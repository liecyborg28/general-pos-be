const User = require("../models/userModel");
const authController = require("./authController");
const dataController = require("./utils/dataController");
const pageController = require("./utils/pageController");
const excelController = require("./utils/excelController");
const errorMessages = require("../repository/messages/errorMessages");
const successMessages = require("../repository/messages/successMessages");

const UserController = {
  createBulkUser: (req) => {},

  createUser: async (body) => {
    let dateISOString = new Date().toISOString();
    let isBodyValid = () => {
      return (
        body.type &&
        body.gender &&
        body.name &&
        body.phonenumber &&
        body.username &&
        body.password &&
        body.businessIds &&
        body.status &&
        body.outletIds &&
        body.access
      );
    };

    let payload = isBodyValid()
      ? {
          // required
          type: body.type,
          gender: body.gender,
          name: body.name,
          phonenumber: body.phonenumber,
          username: body.username,
          password: body.password,
          businessIds: body.businessIds,
          outletIds: body.outletIds,
          access: body.access,
          status: body.status,
          // optional
          imageUrl: body.imageUrl || "",
          email: body.email || "",
          // generate by BE
          createdAt: dateISOString,
          updatedAt: dateISOString,
          auth: authController.generateAuth(),
        }
      : {
          error: true,
          message: errorMessages.INVALID_DATA,
        };

    if (isBodyValid()) {
      let phonenumberIsExist = await dataController.isExist(
        {
          phonenumber: body.phonenumber,
        },
        User
      );

      let usernameIsExist = await dataController.isExist(
        {
          username: body.username,
        },
        User
      );

      if (phonenumberIsExist) {
        return Promise.reject({
          error: true,
          message: errorMessages.NAME_ALREADY_EXISTS,
        });
      }

      if (usernameIsExist) {
        return Promise.reject({
          error: true,
          message: errorMessages.USERNAME_ALREADY_EXISTS,
        });
      }

      return new Promise((resolve, reject) => {
        new User(payload)
          .save()
          .then(() => {
            resolve({
              error: false,
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

  getUsers: (req) => {
    let pageKey = req.query.pageKey ? req.query.pageKey : 1;
    let pageSize = req.query.pageSize ? req.query.pageSize : 10;

    isNotEveryQueryNull = () => {
      return (
        req.query.keyword ||
        req.query.name ||
        req.query.username ||
        req.query.gender ||
        req.query.phonenumber
      );
    };

    return new Promise((resolve, reject) => {
      let pipeline = isNotEveryQueryNull()
        ? {
            $or: [
              {
                type: req.query.keyword ? { $regex: req.query.keyword } : null,
              },
              {
                name: req.query.keyword
                  ? { $regex: req.query.keyword, $options: "i" }
                  : null,
              },
              {
                username: req.query.keyword
                  ? { $regex: req.query.keyword, $options: "i" }
                  : null,
              },
              {
                gender: req.query.keyword
                  ? { $regex: req.query.keyword, $options: "i" }
                  : null,
              },
              {
                phonenumber: req.query.keyword ? req.query.keyword : null,
              },
              {
                type: req.query.type ? { $regex: req.query.type } : null,
              },
              {
                name: req.query.name
                  ? { $regex: req.query.name, $options: "i" }
                  : null,
              },
              {
                username: req.query.username
                  ? { $regex: req.query.username, $options: "i" }
                  : null,
              },
              {
                gender: req.query.gender
                  ? { $regex: req.query.gender, $options: "i" }
                  : null,
              },
              {
                phonenumber: req.query.phonenumber
                  ? req.query.phonenumber
                  : null,
              },
            ],
          }
        : {};

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

  updateUser: async (body) => {
    let dateISOString = new Date().toISOString();
    let phonenumberIsExist = await userDataIsExist({
      phonenumber: body.data.phonenumber,
    });

    let usernameIsExist = await userDataIsExist({
      username: body.data.username,
    });

    if (phonenumberIsExist) {
      return Promise.reject({
        error: true,
        message: errorMessages.PHONE_ALREADY_EXISTS,
      });
    }

    if (usernameIsExist) {
      return Promise.reject({
        error: true,
        message: errorMessages.USERNAME_ALREADY_EXISTS,
      });
    }

    if (!body.userId) {
      return Promise.reject({
        error: true,
        message: errorMessages.INVALID_DATA,
      });
    } else {
      return new Promise((resolve, reject) => {
        User.findByIdAndUpdate(body.userId, body.data, { new: true })
          .then(() => {
            User.findByIdAndUpdate(
              body.userId,
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

module.exports = UserController;
