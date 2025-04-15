const Product = require("../models/productModel");
const User = require("../models/userModel");

// controllers
const dataController = require("./utils/dataController");
const pageController = require("./utils/pageController");

// repositories
const errorMessages = require("../repository/messages/errorMessages");
const successMessages = require("../repository/messages/successMessages");

const mongoose = require("mongoose");

module.exports = {
  create: async (req) => {
    let dateISOString = new Date().toISOString();
    let body = req.body;

    let isBodyValid = () => {
      return (
        body.businessId &&
        body.categoryIds &&
        body.categoryIds.length > 0 &&
        body.code &&
        body.countable !== null &&
        body.name &&
        body.status &&
        body.unitId &&
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
          categoryIds: body.categoryIds,
          changedBy: userByToken._id,
          code: body.code,
          countable: body.countable,
          name: body.name,
          status: body.status,
          unitId: body.unitId,
          variants: body.variants.map((e) => ({
            ...e,
            variantId: new mongoose.Types.ObjectId(),
          })),
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
    let { businessId } = req.query;

    return new Promise((resolve, reject) => {
      let pipeline = {
        status: { $ne: "deleted" },
      };

      if (businessId) {
        pipeline.businessId = businessId;
      }

      pageController
        .paginate(pageKey, pageSize, pipeline, Product)
        .then((products) => {
          Product.populate(products.data, {
            path: "businessId unitId",
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

    // let nameIsExist = await dataController.isExist(
    //   { businessId: body.data.businessId, name: body.data.name },
    //   Product
    // );

    // if (nameIsExist) {
    //   return Promise.reject({
    //     error: true,
    //     message: errorMessages.NAME_ALREADY_EXISTS,
    //   });
    // }

    if (!body.productId) {
      return Promise.reject({
        error: true,
        message: errorMessages.INVALID_DATA,
      });
    }

    if (body.data.variants) {
      body.data.variants = body.data.variants.map((e) => ({
        ...e,
        variantId: e.variantId ? e.variantId : new mongoose.Types.ObjectId(),
      }));
    }

    body.data["updatedAt"] = dateISOString;
    body.data["changedBy"] = userByToken._id;

    return new Promise((resolve, reject) => {
      Product.findByIdAndUpdate(body.productId, body.data, { new: true })
        .then((result) => {
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
