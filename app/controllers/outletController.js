// models
const Outlet = require("../models/outletModel");
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
      return body.address && body.businessId && body.name && body.status;
    };

    let payload = isBodyValid()
      ? {
          businessId: body.businessId,
          status: body.status,
          name: body.name,
          address: body.address ? body.address : null,
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
        Outlet
      );

      if (nameIsExist) {
        return Promise.reject({
          error: true,
          message: errorMessages.NAME_ALREADY_EXISTS,
        });
      }

      return new Promise((resolve, reject) => {
        new Outlet(payload)
          .save()
          .then((result) => {
            logController.createLog({
              createdAt: dateISOString,
              title: "Create Outlet",
              note: "",
              type: "outlet",
              from: result._id,
              by: userByToken._id,
              data: result,
            });
            resolve({
              error: false,
              data: result,
              message: successMessages.OUTLET_CREATED_SUCCESS,
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
      return req.query.keyword || req.query.name || req.query.businessId;
    };

    return new Promise((resolve, reject) => {
      let pipeline = isNotEveryQueryNull()
        ? req.query.isActive
          ? {
              status: "active",
              $or: [
                {
                  name: req.query.keyword
                    ? { $regex: req.query.keyword, $options: "i" }
                    : null,
                },
                {
                  name: req.query.name
                    ? { $regex: req.query.name, $options: "i" }
                    : null,
                },
                {
                  businessId: req.query.businessId
                    ? req.query.businessId
                    : null,
                },
              ],
            }
          : {
              status: { $ne: "deleted" },
              $or: [
                {
                  name: req.query.keyword
                    ? { $regex: req.query.keyword, $options: "i" }
                    : null,
                },
                {
                  name: req.query.name
                    ? { $regex: req.query.name, $options: "i" }
                    : null,
                },
                {
                  businessId: req.query.businessId
                    ? req.query.businessId
                    : null,
                },
              ],
            }
        : req.query.isActive
        ? { status: "active" }
        : {
            status: { $ne: "deleted" },
          };

      pageController
        .paginate(pageKey, pageSize, pipeline, Outlet)
        .then((outlets) => {
          Outlet.populate(outlets.data, { path: "businessId" })
            .then((data) => {
              resolve({
                error: false,
                data: data,
                count: outlets.count,
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
      Outlet
    );

    if (nameIsExist) {
      return Promise.reject({
        error: true,
        message: errorMessages.NAME_ALREADY_EXISTS,
      });
    }

    if (!body.outletId) {
      return Promise.reject({
        error: true,
        message: errorMessages.INVALID_DATA,
      });
    } else {
      body.data["updatedAt"] = dateISOString;
      return new Promise((resolve, reject) => {
        Outlet.findByIdAndUpdate(body.outletId, body.data, { new: true })
          .then((result) => {
            logController.createLog({
              createdAt: dateISOString,
              title: "Update Outlet",
              note: body.note ? body.note : "",
              type: "outlet",
              from: body.outletId,
              by: userByToken._id,
              data: body.data,
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
