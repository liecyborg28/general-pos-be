// models
const User = require("../models/userModel");

// controllers
const authController = require("./authController");
const dataController = require("./utils/dataController");
const pageController = require("./utils/pageController");

// repositories
const errorMessages = require("../repository/messages/errorMessages");
const successMessages = require("../repository/messages/successMessages");

const UserController = {
  create: async (req) => {
    let body = req.body;
    let dateISOString = new Date().toISOString();
    let isBodyValid = () => {
      return (
        body.businessId &&
        // body.email &&
        body.gender &&
        body.name &&
        body.password &&
        // body.phone &&
        body.roleId &&
        body.settings &&
        body.status
      );
    };

    let payload = isBodyValid()
      ? {
          auth: authController.generateAuth(),
          businessId: body.businessId,
          // email: body.email,
          email: null,
          gender: body.gender,
          imageUrl: body.imageUrl ? body.imageUrl : null,
          name: body.name,
          password: body.password,
          // phone: body.phone,
          phone: null,
          roleId: body.roleId,
          settings: body.settings,
          status: body.status,
          username: body.username,
          // timestamp
          createdAt: dateISOString,
          updatedAt: dateISOString,
        }
      : {
          error: true,
          message: errorMessages.INVALID_DATA,
        };

    if (isBodyValid()) {
      // let phoneIsExist = await dataController.isExist(
      //   {
      //     phone: body.phone,
      //     status: { $ne: "deleted" },
      //   },
      //   User
      // );

      let usernameIsExist = await dataController.isExist(
        {
          username: body.username,
          status: { $ne: "deleted" },
        },
        User
      );

      // if (phoneIsExist) {
      //   return Promise.reject({
      //     error: true,
      //     message: errorMessages.PHONE_ALREADY_EXISTS,
      //   });
      // }

      if (usernameIsExist) {
        return Promise.reject({
          error: true,
          message: errorMessages.USERNAME_ALREADY_EXISTS,
        });
      }

      return new Promise((resolve, reject) => {
        new User(payload)
          .save()
          .then((result) => {
            resolve({
              error: false,
              data: result,
              message: successMessages.USER_CREATED_SUCCESS,
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
        .paginate(pageKey, pageSize, pipeline, User)
        .then((users) => {
          resolve({
            error: false,
            data: users.data,
            count: users.count,
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

    if (!body.userId) {
      return Promise.reject({
        error: true,
        message: errorMessages.INVALID_DATA,
      });
    } else {
      body.data["updatedAt"] = dateISOString;

      return new Promise((resolve, reject) => {
        User.findByIdAndUpdate(body.userId, body.data, { new: true })
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

module.exports = UserController;
