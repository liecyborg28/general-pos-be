// Models
const Business = require("../models/businessModel");

// controllers
const dataController = require("./utils/dataController");
const pageController = require("./utils/pageController");
const errorMessages = require("../repository/messages/errorMessages");
const successMessages = require("../repository/messages/successMessages");
const logController = require("./logController");

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
      return body.status && body.imageUrl && body.name;
    };

    let payload = isBodyValid()
      ? {
          status: body.status,
          imageUrl: body.imageUrl,
          name: body.name,
          createdAt: dateISOString,
          updatedAt: dateISOString,
        }
      : {
          error: true,
          message: errorMessages.INVALID_DATA,
        };

    if (isBodyValid()) {
      let nameIsExist = await dataController.isExist(
        { name: body.name, status: { $ne: "deleted" } },
        Business
      );

      if (nameIsExist) {
        return Promise.reject({
          error: true,
          message: errorMessages.NAME_ALREADY_EXISTS,
        });
      }

      return new Promise((resolve, reject) => {
        new Business(payload)
          .save()
          .then((result) => {
            logController.createLog({
              createdAt: dateISOString,
              name: "Create Business",
              note: "",
              type: "business",
              from: result._id,
              by: userByToken._id,
              data: result,
            });

            resolve({
              error: false,
              data: result,
              message: successMessages.BUSINESS_CREATED_SUCCESS,
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

    return new Promise((resolve, reject) => {
      let pipeline = { status: { $ne: "deleted" } };

      pageController
        .paginate(pageKey, pageSize, pipeline, Business)
        .then((businesses) => {
          resolve({
            error: false,
            data: businesses.data,
            count: businesses.count,
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

    if (!body.businessId) {
      return Promise.reject({
        error: true,
        message: errorMessages.INVALID_DATA,
      });
    } else {
      body.data["updatedAt"] = dateISOString;
      return new Promise((resolve, reject) => {
        Business.findByIdAndUpdate(body.businessId, body.data, {
          new: true,
        }).then((result) => {
          logController.createLog({
            createdAt: dateISOString,
            name: "Update Business",
            note: body.note ? body.note : "",
            type: "business",
            from: body.businessId,
            by: userByToken._id,
            data: body.data,
          });
          resolve({
            error: false,
            data: result,
            message: successMessages.DATA_SUCCESS_UPDATED,
          });
        });
      });
    }
  },
};
