// models
const Customer = require("../models/customerModel");

// controllers
const authController = require("./authController");
const dataController = require("./utils/dataController");
const pageController = require("./utils/pageController");

// repositories
const errorMessages = require("../repository/messages/errorMessages");
const successMessages = require("../repository/messages/successMessages");

const CustomerController = {
  create: async (req) => {
    let body = req.body;
    let dateISOString = new Date().toISOString();
    let isBodyValid = () => {
      return body.email && body.name && body.phone && body.status;
    };

    let payload = isBodyValid()
      ? {
          balance: 0,
          email: body.email,
          imageUrl: body.imageUrl ? body.imageUrl : null,
          name: body.name,
          phone: body.phone,
          point: 0,
          status: body.status,
          // timestamp
          createdAt: dateISOString,
          updatedAt: dateISOString,
        }
      : {
          error: true,
          message: errorMessages.INVALID_DATA,
        };

    if (isBodyValid()) {
      let phoneIsExist = await dataController.isExist(
        {
          phone: body.phone,
          status: { $ne: "deleted" },
        },
        Customer
      );

      if (phoneIsExist) {
        return Promise.reject({
          error: true,
          message: errorMessages.PHONE_ALREADY_EXISTS,
        });
      }

      return new Promise((resolve, reject) => {
        new Customer(payload)
          .save()
          .then((result) => {
            resolve({
              error: false,
              data: result,
              message: successMessages.CUSTOMER_CREATED_SUCCESS,
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
    let pageSize = req.query.pageSize ? req.query.pageSize : 1000;

    return new Promise((resolve, reject) => {
      let pipeline = {
        status: { $ne: "deleted" },
      };

      pageController
        .paginate(pageKey, pageSize, pipeline, Customer)
        .then((customers) => {
          resolve({
            error: false,
            data: customers.data,
            count: customers.count,
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

    if (!body.customerId) {
      return Promise.reject({
        error: true,
        message: errorMessages.INVALID_DATA,
      });
    } else {
      body.data["updatedAt"] = dateISOString;

      return new Promise((resolve, reject) => {
        Customer.findByIdAndUpdate(body.customerId, body.data, { new: true })
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

module.exports = CustomerController;
