const Outlet = require("../models/outletModel");
const dataController = require("./dataController");
const pageController = require("./pageController");
const errorMessages = require("../messages/errorMessages");
const successMessages = require("../messages/successMessages");

module.exports = {
  createOutlet: async (body) => {
    let dateISOString = new Date().toISOString();
    let isBodyValid = () => {
      return body.businessId && body.status && body.name;
    };

    let payload = isBodyValid()
      ? {
          businessId: body.businessId,
          status: body.status,
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
          .then(() => {
            resolve({
              error: false,
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

  getOutlets: (req) => {
    let pageKey = req.query.pageKey ? req.query.pageKey : 1;
    let pageSize = req.query.pageSize ? req.query.pageSize : 10;

    isNotEveryQueryNull = () => {
      return req.query.keyword || req.query.name || req.query.businessId;
    };

    return new Promise((resolve, reject) => {
      let pipeline = isNotEveryQueryNull()
        ? {
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
                businessId: req.query.businessId ? req.query.businessId : null,
              },
            ],
          }
        : {};

      pageController
        .paginate(pageKey, pageSize, pipeline, Outlet)
        .then((outlets) => {
          resolve({
            error: false,
            data: outlets.data,
            count: outlets.count,
          });
        })
        .catch((err) => {
          reject({ error: true, message: err });
        });
    });
  },

  updateOutlet: async (body) => {
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
      return new Promise((resolve, reject) => {
        Outlet.findByIdAndUpdate(body.outletId, body.data, { new: true })
          .then(() => {
            Outlet.findByIdAndUpdate(
              body.outletId,
              { updatedAt: dateISOString },
              { new: true }
            )
              .then(() => {
                resolve({
                  error: false,
                  message: successMessages.DATA_SUCCESS_UPDATED,
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
    }
  },
};
