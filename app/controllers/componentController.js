const User = require("../models/userModel");
const Component = require("../models/componentModel");
const dataController = require("./utils/dataController");
const pageController = require("./utils/pageController");
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
        body.name &&
        body.status &&
        body.unitId
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
          imageUrl: body.imageUrl ? body.imageUrl : null,
          name: body.name,
          status: body.status,
          unitId: body.unitId,
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
        Component
      );

      if (nameIsExist) {
        return Promise.reject({
          error: true,
          message: errorMessages.NAME_ALREADY_EXISTS,
        });
      }

      return new Promise((resolve, reject) => {
        new Component(payload)
          .save()
          .then((result) => {
            resolve({
              error: false,
              data: result,
              message: successMessages.COMPONENT_CREATED_SUCCESS,
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
        .paginate(pageKey, pageSize, pipeline, Component)
        .then((components) => {
          Component.populate(components.data, {
            path: "businessId categoryId unitId",
          })
            .then((data) => {
              resolve({
                error: false,
                data: data,
                count: components.count,
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
    let dateISOString = new Date().toISOString();
    const bearerHeader = req.headers["authorization"];
    const bearerToken = bearerHeader.split(" ")[1];

    let userByToken = await User.findOne({
      "auth.accessToken": bearerToken,
    });

    if (!body.componentId) {
      return Promise.reject({
        error: true,
        message: errorMessages.INVALID_DATA,
      });
    }

    body.data["updatedAt"] = dateISOString;
    body.data["changedBy"] = userByToken._id;

    return new Promise((resolve, reject) => {
      Component.findByIdAndUpdate(body.componentId, body.data, { new: true })
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
