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
        body.current !== null &&
        body.current !== null &&
        body.max !== null &&
        body.min !== null &&
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

    let qtyStatusData = "";

    if (body.current <= 0) {
      qtyStatusData = "outOfStock";
    } else if (body.current <= body.min) {
      qtyStatusData = "almostOut";
    } else {
      qtyStatusData = "available";
    }

    let payload = isBodyValid()
      ? {
          businessId: body.businessId,
          categoryId: body.categoryId,
          changedBy: userByToken._id,
          imageUrl: body.imageUrl ? body.imageUrl : null,
          name: body.name,
          status: body.status,
          unitId: body.unitId,
          qty: {
            current: body.current,
            max: body.max,
            min: body.min,
            status: qtyStatusData,
          },
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
    let pageKey = req.query.pageKey ? req.query.pageKey : 1;
    let pageSize = req.query.pageSize ? req.query.pageSize : null;

    isNotEveryQueryNull = () => {
      return req.query.name || req.query.businessId || req.query.categoryId;
    };

    return new Promise((resolve, reject) => {
      let pipeline = isNotEveryQueryNull()
        ? {
            status: { $ne: "deleted" },
            $or: [
              {
                name: req.query.name
                  ? { $regex: req.query.name, $options: "i" }
                  : null,
              },
              {
                businessId: req.query.businessId ? req.query.businessId : null,
              },
              {
                categoryId: req.query.categoryId ? req.query.categoryId : null,
              },
            ],
          }
        : {
            status: { $ne: "deleted" },
          };

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

    if (body.data.qty) {
      let component = await Component.findOne({ _id: body.componentId });

      let qtyData = body.data.qty;

      let componentQty = component.qty;

      let qtyStatusData = "";

      if (qtyData.current < 0) {
        qtyStatusData = "outOfStock";
      } else if (qtyData.current <= componentQty.min) {
        qtyStatusData = "almostOut";
      } else {
        qtyStatusData = "available";
      }

      body.data["qty"]["status"] = qtyStatusData;
    }

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
