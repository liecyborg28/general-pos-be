const Tax = require("../models/taxModel");
const User = require("../models/userModel");

// controllers
const dataController = require("./utils/dataController");
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
      return (
        body.amount !== null &&
        body.businessId &&
        body.default !== null &&
        body.name &&
        body.type
      );
    };

    let payload = isBodyValid()
      ? {
          amount: body.amount,
          businessId: body.businessId,
          changedBy: userByToken._id,
          default: body.default,
          name: body.name,
          type: body.type,
          status: "active",
          createdAt: dateISOString,
          updatedAt: dateISOString,
        }
      : {
          error: true,
          message: errorMessages.INVALID_DATA,
        };

    if (isBodyValid()) {
      let nameIsExist = await dataController.isExist(
        { name: body.name, businessId: body.businessId },
        Tax
      );

      if (nameIsExist) {
        return Promise.reject({
          error: true,
          message: errorMessages.NAME_ALREADY_EXISTS,
        });
      }

      return new Promise((resolve, reject) => {
        new Tax(payload)
          .save()
          .then((result) => {
            resolve({
              error: false,
              data: result,
              message: successMessages.CHARGE_CREATED_SUCCESS,
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
    let { businessId } = req.query;
    let pageKey = req.query.pageKey ? req.query.pageKey : 1;
    let pageSize = req.query.pageSize ? req.query.pageSize : null;

    return new Promise((resolve, reject) => {
      let pipeline = {
        status: { $ne: "deleted" },
      };

      if (businessId) {
        pipeline.businessId = businessId;
      }

      pageController
        .paginate(pageKey, pageSize, pipeline, Tax)
        .then((taxes) => {
          resolve({
            error: false,
            data: taxes.data,
            count: taxes.count,
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

    if (!body.taxId) {
      return Promise.reject({
        error: true,
        message: errorMessages.INVALID_DATA,
      });
    } else {
      body.data["updatedAt"] = dateISOString;
      body.data["changedBy"] = userByToken._id;

      return new Promise((resolve, reject) => {
        Tax.findByIdAndUpdate(body.taxId, body.data, { new: true })
          .then(() => {
            resolve({
              error: false,
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
