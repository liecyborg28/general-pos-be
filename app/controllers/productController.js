const Product = require("../models/productModel");
const User = require("../models/userModel");

// controllers
const dataController = require("./utils/dataController");
const logController = require("./logController");
const pageController = require("./utils/pageController");

// repositories
const errorMessages = require("../repository/messages/errorMessages");
const successMessages = require("../repository/messages/successMessages");

module.exports = {
  create: async (req) => {
    let dateISOString = new Date().toISOString();
    let body = req.body;

    let isBodyValid = () => {
      return (
        body.businessId &&
        body.categoryId &&
        body.countable !== null &&
        body.charged !== null &&
        body.name &&
        body.status &&
        body.unitId &&
        body.taxed !== null &&
        body.variants
      );
    };

    const bearerHeader = req.headers["authorization"];
    const bearerToken = bearerHeader.split(" ")[1];

    let userByToken = await User.findOne({
      "auth.accessToken": bearerToken,
    });

    let payload = isBodyValid()
      ? {
          businessId: body.businessId,
          categoryId: body.categoryId,
          changedBy: userByToken._id,
          countable: body.countable,
          charged: body.charged,
          name: body.name,
          status: body.status,
          unitId: body.unitId,
          taxed: body.taxed,
          variants: body.variants,
          createdAt: dateISOString,
          updatedAt: dateISOString,
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
            // logController.create({
            //   by: userByToken._id,
            //   data: result,
            //   from: result._id,
            //   note: body.note ? body.note : null,
            //   title: "Create Product",
            //   type: "product",
            //   // timestamp
            //   createdAt: dateISOString,
            // });

            resolve({
              error: false,
              data: result,
              message: successMessages.PRODUCT_CREATED_SUCCESS,
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
      return req.query.businessId || req.query.categoryId || req.query.name;
    };

    return new Promise((resolve, reject) => {
      let pipeline = isNotEveryQueryNull()
        ? {
            status: { $ne: "deleted" },
            $or: [
              {
                businessId: req.query.businessId ? req.query.businessId : null,
              },
              {
                categoryId: req.query.categoryId ? req.query.categoryId : null,
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
            ],
          }
        : {
            status: { $ne: "deleted" },
          };

      pageController
        .paginate(pageKey, pageSize, pipeline, Product)
        .then((products) => {
          Product.populate(products.data, {
            path: "businessId categoryId unitId",
          })
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

    if (!body.productId) {
      return Promise.reject({
        error: true,
        message: errorMessages.INVALID_DATA,
      });
    }

    body.data["updatedAt"] = dateISOString;
    body.data["changedBy"] = userByToken._id;

    return new Promise((resolve, reject) => {
      Product.findByIdAndUpdate(body.productId, body.data, { new: true })
        .then((result) => {
          // logController.create({
          //   by: userByToken._id,
          //   data: result,
          //   from: result._id,
          //   note: body.note ? body.note : null,
          //   title: "Update Product",
          //   type: "product",
          //   // timestamp
          //   createdAt: dateISOString,
          // });

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
