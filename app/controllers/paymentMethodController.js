// models
const PaymentMethod = require("../models/paymentMethodModel");
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
    let body = req.body;
    const bearerHeader = req.headers["authorization"];
    const bearerToken = bearerHeader.split(" ")[1];
    let userByToken = await User.findOne({
      "auth.accessToken": bearerToken,
    });

    let dateISOString = new Date().toISOString();
    let isBodyValid = () => {
      return body.businessId && body.name && body.status;
    };

    let payload = isBodyValid()
      ? {
          businessId: body.businessId,
          name: body.name,
          status: body.status,
          createdAt: dateISOString,
          updatedAt: dateISOString,
        }
      : {
          error: true,
          message: errorMessages.INVALID_DATA,
        };

    if (isBodyValid()) {
      let nameIsExist = await dataController.isExist(
        { businessId: body.businessId, name: body.name },
        PaymentMethod
      );

      if (nameIsExist) {
        return Promise.reject({
          error: true,
          message: errorMessages.NAME_ALREADY_EXISTS,
        });
      }

      return new Promise((resolve, reject) => {
        new PaymentMethod(payload)
          .save()
          .then((result) => {
            // logController.create({
            //   by: userByToken._id,
            //   data: result,
            //   from: result._id,
            //   note: body.note ? body.note : null,
            //   title: "Create Payment Method",
            //   type: "paymentMethod",
            //   // timestamp
            //   createdAt: dateISOString,
            // });

            resolve({
              error: false,
              data: result,
              message: successMessages.PAYMENT_METHOD_CREATED_ACCESS,
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
      return req.query.businessId || req.query.name;
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
                name: req.query.name
                  ? { $regex: req.query.name, $options: "i" }
                  : null,
              },
            ],
          }
        : {
            status: { $ne: "deleted" },
          };

      pageController
        .paginate(pageKey, pageSize, pipeline, PaymentMethod)
        .then((paymentMethods) => {
          PaymentMethod.populate(paymentMethods.data, { path: "businessId" })
            .then((data) => {
              resolve({
                error: false,
                data: data,
                count: paymentMethods.count,
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
    let body = req.body;
    const bearerHeader = req.headers["authorization"];
    const bearerToken = bearerHeader.split(" ")[1];

    let userByToken = await User.findOne({
      "auth.accessToken": bearerToken,
    });
    let dateISOString = new Date().toISOString();
    let nameIsExist = await dataController.isExist(
      { businessId: body.data.businessId, name: body.data.name },
      PaymentMethod
    );

    if (nameIsExist) {
      return Promise.reject({
        error: true,
        message: errorMessages.NAME_ALREADY_EXISTS,
      });
    }

    if (!body.paymentMethodId) {
      return Promise.reject({
        error: true,
        message: errorMessages.INVALID_DATA,
      });
    } else {
      body.data["updatedAt"] = dateISOString;
      return new Promise((resolve, reject) => {
        PaymentMethod.findByIdAndUpdate(body.paymentMethodId, body.data, {
          new: true,
        })
          .then((result) => {
            // logController.create({
            //   by: userByToken._id,
            //   data: result,
            //   from: result._id,
            //   note: body.note ? body.note : null,
            //   title: "Update Payment Method",
            //   type: "paymentMethod",
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
    }
  },
};
