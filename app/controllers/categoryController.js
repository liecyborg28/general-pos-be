// models
const User = require("../models/userModel");
const Category = require("../models/categoryModel");

// controllers
const dataController = require("./utils/dataController");
const logController = require("./logController");
const pageController = require("./utils/pageController");

// repositories
const errorMessages = require("../repository/messages/errorMessages");
const successMessages = require("../repository/messages/successMessages");

module.exports = {
  create: async (req) => {
    let body = req.body;
    let dateISOString = new Date().toISOString();
    const bearerHeader = req.headers["authorization"];
    const bearerToken = bearerHeader.split(" ")[1];

    let userByToken = await User.findOne({
      "auth.accessToken": bearerToken,
    });

    let isBodyValid = () => {
      return body.name && body.businessId;
    };

    let payload = isBodyValid()
      ? {
          name: body.name,
          businessId: body.businessId,
          status: "active",
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
        Category
      );

      if (nameIsExist) {
        return Promise.reject({
          error: true,
          message: errorMessages.NAME_ALREADY_EXISTS,
        });
      }

      return new Promise((resolve, reject) => {
        new Category(payload)
          .save()
          .then((result) => {
            logController.createLog({
              by: userByToken._id,
              data: result,
              from: result._id,
              note: body.note ? body.note : null,
              title: "Create Category",
              type: "category",
              // timestamp
              createdAt: dateISOString,
            });

            resolve({
              error: false,
              data: result,
              message: successMessages.CATEGORY_CREATED_SUCCESS,
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
    let pageSize = req.query.pageSize ? req.query.pageSize : 10;

    return new Promise((resolve, reject) => {
      let pipeline = {
        status: { $ne: "deleted" },
      };

      pageController
        .paginate(pageKey, pageSize, pipeline, Category)
        .then((categories) => {
          resolve({
            error: false,
            data: categories.data,
            count: categories.count,
          });
        })
        .catch((err) => {
          reject({ error: true, message: err });
        });
    });
  },

  update: async (req) => {
    let body = req.body;
    let dateISOString = new Date().toISOString();
    const bearerHeader = req.headers["authorization"];
    const bearerToken = bearerHeader.split(" ")[1];

    let userByToken = await User.findOne({
      "auth.accessToken": bearerToken,
    });

    if (!body.categoryId) {
      return Promise.reject({
        error: true,
        message: errorMessages.INVALID_DATA,
      });
    } else {
      body.data["updatedAt"] = dateISOString;
      return new Promise((resolve, reject) => {
        Category.findByIdAndUpdate(body.categoryId, body.data, { new: true })
          .then((result) => {
            logController.createLog({
              by: userByToken._id,
              data: result,
              from: result._id,
              note: body.note ? body.note : null,
              title: "Create Category",
              type: "category",
              // timestamp
              createdAt: dateISOString,
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
    }
  },
};
