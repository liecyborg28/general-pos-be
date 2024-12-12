const Promotion = require("../models/promotionModel");
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
        Promotion
      );

      if (nameIsExist) {
        return Promise.reject({
          error: true,
          message: errorMessages.NAME_ALREADY_EXISTS,
        });
      }

      return new Promise((resolve, reject) => {
        new Promotion(payload)
          .save()
          .then((result) => {
            resolve({
              error: false,
              data: result,
              message: successMessages.PROMOTION_CREATED_SUCCESS,
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
      return req.query.businessId;
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
        .paginate(pageKey, pageSize, pipeline, Promotion)
        .then((promotions) => {
          resolve({
            error: false,
            data: promotions.data,
            count: promotions.count,
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

    if (!body.promotionId) {
      return Promise.reject({
        error: true,
        message: errorMessages.INVALID_DATA,
      });
    } else {
      body.data["updatedAt"] = dateISOString;
      body.data["changedBy"] = userByToken._id;

      return new Promise((resolve, reject) => {
        Promotion.findByIdAndUpdate(body.promotionId, body.data, { new: true })
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
