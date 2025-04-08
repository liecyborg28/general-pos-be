// Models
const Business = require("../models/businessModel");
const Outlet = require("../models/outletModel");
const User = require("../models/userModel");
const Warehouse = require("../models/warehouseModel");

// controllers
const dataController = require("./utils/dataController");
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
      return body.imageUrl && body.name && body.status;
    };

    let payload = isBodyValid()
      ? {
          imageUrl: body.imageUrl,
          name: body.name,
          note: body.note ? body.note : null,
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
            const warehousesPayload = [
              {
                name: "Gudang Utama",
                businessId: result._id.toString(),
                components: [],
                products: [],
                status: "active",
                createdAt: dateISOString,
                updatedAt: dateISOString,
              },
            ];

            Warehouse.insertMany(warehousesPayload, { ordered: true })
              .then((warehouses) => {
                const outletsPayload = [
                  {
                    address: `Address for ${result.name}.`,
                    businessId: result._id.toString(),
                    warehouseId: warehouses[0]._id.toString(),
                    name: `Outlet Utama ${result.name}`,
                    note: "",
                    status: "active",
                    createdAt: dateISOString,
                    updatedAt: dateISOString,
                  },
                ];

                Outlet.insertMany(outletsPayload, { ordered: true })
                  .then((outlets) => {
                    resultFinal = {
                      business: result,
                      outlet: outlets[0],
                      warehouse: warehouses[0],
                    };

                    resolve({
                      error: false,
                      data: resultFinal,
                      message: successMessages.BUSINESS_CREATED_SUCCESS,
                    });
                  })
                  .catch((err) => {
                    reject({ error: true, message: err });
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
    } else {
      return Promise.reject(payload);
    }
  },

  get: (req) => {
    let { businessId } = req.query;
    let pageKey = req.query.pageKey ? req.query.pageKey : 1;
    let pageSize = req.query.pageSize ? req.query.pageSize : null;

    return new Promise((resolve, reject) => {
      let pipeline = { status: { $ne: "deleted" } };

      if (businessId) {
        pipeline._id = businessId;
      }

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
        })
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
    }
  },
};
