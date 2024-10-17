const User = require("../models/userModel");
const Product = require("../models/productModel");
const dataController = require("./utils/dataController");
const pageController = require("./utils/pageController");
const errorMessages = require("../repository/messages/errorMessages");
const successMessages = require("../repository/messages/successMessages");
const logController = require("./logController");

module.exports = {
  create: async (req) => {
    let dateISOString = new Date().toISOString();
    let body = req.body;

    let isBodyValid = () => {
      return (
        body.businessId &&
        body.status &&
        body.categoryId &&
        body.name &&
        body.price
      );
    };

    const bearerHeader = req.headers["authorization"];
    const bearerToken = bearerHeader.split(" ")[1];

    let userByToken = await User.findOne({
      "auth.accessToken": bearerToken,
    });

    let payload = isBodyValid()
      ? {
          status: body.status,
          businessId: body.businessId,
          name: body.name,
          imageUrl: body.imageUrl ? body.imageUrl : null,
          categoryId: body.categoryId,
          price: body.price,
          changedBy: userByToken._id,
          createdAt: dateISOString,
          updatedAt: dateISOString,
          ingredients: body.ingredients ? body.ingredients : [],
          taxed: body.taxed,
          charged: body.charged,
        }
      : {
          error: true,
          message: errorMessages.INVALID_DATA,
        };

    if (isBodyValid()) {
      let nameIsExist = await dataController.isExist(
        {
          businessId: body.businessId,
          name: body.name,
          status: { $ne: "deleted" },
        },
        Product
      );

      if (nameIsExist) {
        return Promise.reject({
          error: true,
          message: errorMessages.NAME_ALREADY_EXISTS,
        });
      }

      return new Promise((resolve, reject) => {
        new Product(payload)
          .save()
          .then((result) => {
            logController.createLog({
              createdAt: dateISOString,
              title: "Create Product",
              note: "",
              type: "Product",
              from: result._id,
              by: userByToken._id,
              data: result,
            });
            resolve({
              error: false,
              data: result,
              message: successMessages.Product_CREATED_SUCCESS,
            });
          })
          .catch((err) => {
            reject({ error: true, message: err });
          });
      });
    } else {
      return Promise.reject(payload);
    }
  },

  get: (req) => {
    let pageKey = req.query.pageKey ? req.query.pageKey : 1;
    let pageSize = req.query.pageSize ? req.query.pageSize : null;

    isNotEveryQueryNull = () => {
      return (
        req.query.keyword ||
        req.query.name ||
        req.query.businessId ||
        req.query.categoryId
      );
    };

    return new Promise((resolve, reject) => {
      let pipeline = isNotEveryQueryNull()
        ? {
            status: { $ne: "deleted" },
            $or: [
              {
                name: req.query.keyword
                  ? { $regex: req.query.keyword, $options: "i" }
                  : null,
              },
              {
                name: req.query.name
                  ? { $regex: req.query.name, $options: "i" }
                  : null,
              },
              {
                price: req.query.price
                  ? { $regex: req.query.price, $options: "i" }
                  : null,
              },
              {
                categoryId: req.query.categoryId ? req.query.categoryId : null,
              },
              {
                businessId: req.query.businessId ? req.query.businessId : null,
              },
            ],
          }
        : {
            status: { $ne: "deleted" },
          };

      pageController
        .paginate(pageKey, pageSize, pipeline, Product)
        .then((products) => {
          Product.populate(products.data, { path: "businessId categoryId" })
            .then((data) => {
              resolve({
                error: false,
                data: data,
                count: products.count,
              });
            })
            .catch((err) => {
              reject({ error: true, message: err });
            });
        })
        .catch((err) => {
          reject({ error: true, message: err });
        });
    });
  },

  update: async (req) => {
    let dateISOString = new Date().toISOString();
    const bearerHeader = req.headers["authorization"];
    const bearerToken = bearerHeader.split(" ")[1];

    let userByToken = await User.findOne({
      "auth.accessToken": bearerToken,
    });

    let body = req.body;

    let nameIsExist = await dataController.isExist(
      { businessId: body.data.businessId, name: body.data.name },
      Product
    );

    if (nameIsExist) {
      return Promise.reject({
        error: true,
        message: errorMessages.NAME_ALREADY_EXISTS,
      });
    }

    if (!body.ProductId) {
      return Promise.reject({
        error: true,
        message: errorMessages.INVALID_DATA,
      });
    }

    body.data["updatedAt"] = dateISOString;
    body.data["changedBy"] = userByToken._id;

    return new Promise((resolve, reject) => {
      Product.findByIdAndUpdate(body.ProductId, body.data, { new: true })
        .then((result) => {
          logController.createLog({
            createdAt: dateISOString,
            title: "Update Product",
            note: body.note ? body.note : "",
            type: "Product",
            from: body.ProductId,
            by: userByToken._id,
            data: body.data,
          });

          resolve({
            error: false,
            data: result,
            message: successMessages.DATA_SUCCESS_UPDATED,
          });
        })
        .catch((err) => {
          reject({ error: true, message: err });
        });
    });
  },
};
