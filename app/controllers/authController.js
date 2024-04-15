const errorMessages = require("../repository/messages/errorMessages");
const successMessages = require("../repository/messages/successMessages");
const crypto = require("crypto");
const User = require("../models/userModel");
const Business = require("../models/businessModel");
const pageController = require("./utils/pageController");
const authUtils = require("../utility/authUtils");

function generateHash(data) {
  const hash = crypto.createHash("sha256");
  hash.update(data);
  return hash.digest("hex");
}

module.exports = {
  generateAuth: () => {
    return {
      accessToken: generateHash(authUtils.generateAccessToken()),
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
        status: { $ne: "deleted" },
        $or: [
          { username: req.body.loginMethod, password: req.body.password },
          // { phonenumber: req.body.loginMethod, password: req.body.password },
        ],
      })
        .catch((err) => {
          return Promise.reject({ error: true, message: err });
        })
        .then((data) => {
          if (data) {
            if (data.status === "inactive") {
              reject({
                error: true,
                message: errorMessages.ACCOUNT_INACTIVE,
              });
            }

            pageController
              .paginate(1, null, {}, Business)
              .then((businesses) => {
                resolve({
                  error: false,
                  userData: {
                    type: data.type,
                    name: data.name,
                    gender: data.gender,
                    imageUrl: data.imageUrl,
                    userId: data._id,
                    access: [],
                    businessIds: [],
                    outletIds: [],
                    auth: {
                      accessToken: data.auth.accessToken,
                      expiredAt: authUtils.generateTokenExpirateAt(7),
                    },
                  },
                  businessData: businesses.data.map((e) => ({
                    id: e._id,
                    name: e.name,
                    imageUrl: e.imageUrl,
                  })),
                });
              })
              .catch((err) => {
                reject({ error: true, message: err });
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
            let newAuth = {
              auth: {
                accessToken: generateHash(authUtils.generateAccessToken()),
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
