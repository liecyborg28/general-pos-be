const errorMessages = require("../messages/errorMessages");
const successMessages = require("../messages/successMessages");
const User = require("../models/userModel");
const authUtils = require("../utility/authUtils");

module.exports = {
  generateAuth: () => {
    return {
      accessToken: authUtils.generateAccessToken(),
    };
  },
  checkAccessToken: (req) => {
    return new Promise((resolve, reject) => {
      const bearerHeader = req.headers["authorization"];

      if (typeof bearerHeader !== "undefined") {
        const bearerToken = bearerHeader.split(" ")[1];
        User.find({
          "auth.accessToken": bearerToken,
        }).then((data) => {
          data.length > 0
            ? resolve({ error: false, message: successMessages.AUTHORIZED })
            : reject({
                error: true,
                message: errorMessages.UNAUTHORIZED,
              });
        });
      } else {
        reject({
          error: true,
          message: errorMessages.SESSION_ENDED,
        });
      }
    });
  },
  login: (req) => {
    return new Promise((resolve, reject) => {
      User.findOne({
        $or: [
          { username: req.body.loginMethod, password: req.body.password },
          { phonenumber: req.body.loginMethod, password: req.body.password },
        ],
      })
        .catch((err) => {
          return Promise.reject({ error: true, message: err });
        })
        .then((data) => {
          if (data) {
            resolve({
              error: false,
              userData: {
                type: data.type,
                name: data.name,
                gender: data.gender,
                imageUrl: data.imageUrl,
                access: [],
                businessId: [],
                outletId: [],
                auth: {
                  accessToken: data.auth.accessToken,
                  expiredAt: authUtils.generateTokenExpirateAt(7),
                },
              },
            });
          } else {
            reject({
              error: false,
              message: errorMessages.LOGIN_FAILED,
            });
          }
        });
    });
  },
  logout: (req) => {
    return new Promise((resolve, reject) => {
      const bearerHeader = req.headers["authorization"];

      if (typeof bearerHeader !== "undefined") {
        const bearerToken = bearerHeader.split(" ")[1];

        User.findOne({
          "auth.accessToken": bearerToken,
        })
          .catch((err) => {
            reject({ error: true, message: err });
          })
          .then((data) => {
            console.log(data);
            let newAuth = {
              auth: {
                accessToken: authUtils.generateAccessToken(),
              },
            };
            if (data) {
              User.findByIdAndUpdate(data._id, newAuth, { new: true })
                .then(() => {
                  resolve({
                    error: false,
                    message: successMessages.TOKEN_SUCCESS_UPDATED,
                  });
                })
                .catch((err) => {
                  reject({ error: true, message: err });
                });
            } else {
              reject({
                error: true,
                message: errorMessages.TOKEN_NOT_FOUND,
              });
            }
          });
      } else {
        reject({
          error: true,
          message: errorMessages.TOKEN_IS_REQUIRED,
        });
      }
    });
  },
};
