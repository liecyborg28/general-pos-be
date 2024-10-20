const Offer = require("../models/promotionModel");
const User = require("../models/userModel");
const dataController = require("./utils/dataController");
const pageController = require("./utils/pageController");
const errorMessages = require("../repository/messages/errorMessages");
const successMessages = require("../repository/messages/successMessages");
const logController = require("./logController");

module.exports = {
  createOffer: async (req) => {
    let body = req.body;
    const bearerHeader = req.headers["authorization"];
    const bearerToken = bearerHeader.split(" ")[1];

    let userByToken = await User.findOne({
      "auth.accessToken": bearerToken,
    });

    let dateISOString = new Date().toISOString();
    let isBodyValid = () => {
      return body.title && body.type && body.amount && body.businessId;
    };

    let payload = isBodyValid()
      ? {
          title: body.title,
          businessId: body.businessId,
          amount: body.amount,
          type: body.type,
        }
      : {
          error: true,
          message: errorMessages.INVALID_DATA,
        };

    if (isBodyValid()) {
      let nameIsExist = await dataController.isExist(
        { title: body.title, businessId: body.businessId },
        Offer
      );

      if (nameIsExist) {
        return Promise.reject({
          error: true,
          message: errorMessages.NAME_ALREADY_EXISTS,
        });
      }

      return new Promise((resolve, reject) => {
        new Offer(payload)
          .save()
          .then((result) => {
            logController.createLog({
              createdAt: dateISOString,
              title: "Create Offer",
              note: "",
              type: "offer",
              from: result._id,
              by: userByToken._id,
              data: result,
            });

            resolve({
              error: false,
              data: result,
              message: successMessages.OFFER_CREATED_SUCCESS,
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

  getOffers: (req) => {
    let pageKey = req.query.pageKey ? req.query.pageKey : 1;
    let pageSize = req.query.pageSize ? req.query.pageSize : null;

    isNotEveryQueryNull = () => {
      return req.query.keyword || req.query.title || req.query.businessId;
    };

    return new Promise((resolve, reject) => {
      let pipeline = isNotEveryQueryNull()
        ? {
            status: { $ne: "deleted" },
            $or: [
              {
                title: req.query.keyword
                  ? { $regex: req.query.keyword, $options: "i" }
                  : null,
              },
              {
                title: req.query.title
                  ? { $regex: req.query.title, $options: "i" }
                  : null,
              },
              {
                businessId: req.query.businessId ? req.query.businessId : null,
              },
            ],
          }
        : {};

      pageController
        .paginate(pageKey, pageSize, pipeline, Offer)
        .then((offers) => {
          resolve({
            error: false,
            data: offers.data,
            count: offers.count,
          });
        })
        .catch((err) => {
          reject({ error: true, message: err });
        });
    });
  },

  updateOffer: async (req) => {
    let body = req.body;
    const bearerHeader = req.headers["authorization"];
    const bearerToken = bearerHeader.split(" ")[1];

    let userByToken = await User.findOne({
      "auth.accessToken": bearerToken,
    });

    let dateISOString = new Date().toISOString();

    if (!body.offerId) {
      return Promise.reject({
        error: true,
        message: errorMessages.INVALID_DATA,
      });
    } else {
      body.data["updatedAt"] = dateISOString;
      return new Promise((resolve, reject) => {
        Offer.findByIdAndUpdate(body.offerId, body.data, { new: true })
          .then(() => {
            logController.createLog({
              createdAt: dateISOString,
              title: "Update Offer",
              note: body.note ? body.note : "",
              type: "offer",
              from: body.offerId,
              by: userByToken._id,
              data: body.data,
            });
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
