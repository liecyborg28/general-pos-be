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
            ? resolve({ error: false, message: "Authorized!" })
            : reject({
                error: true,
                message: "Unauthorized!",
              });
        });
      } else {
        reject({
          error: true,
          message: "Token not found!",
        });
      }
    });
  },
  login: (userBody) => {
    return new Promise((resolve, reject) => {
      User.findOne({
        $or: [
          { username: userBody.usernameOrPhonenumber, password: password },
          { phonenumber: userBody.usernameOrPhonenumber, password: password },
        ],
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
                  accessToken: data.accessToken,
                  expiredAt: authUtils.generateTokenExpirateAt(7),
                },
              },
            });
          } else {
            reject({
              error: false,
              message: "User not found!",
            });
          }
        })
        .catch((err) => {
          return Promise.reject({ error: true, message: err });
        });
    });
  },
  logout: (accessToken) => {
    return new Promise((resolve, reject) => {
      const bearerHeader = req.headers["authorization"];

      if (typeof bearerHeader !== "undefined") {
        const bearerToken = bearerHeader.split(" ")[1];

        User.find({
          "auth.accessToken": accessToken,
        })
          .then((data) => {
            let newAuth = { auth: this.generateAuth() };
            if (data.length > 0) {
              User.findByIdAndUpdate(data._id, newAuth, { new: true }).then(
                () => {
                  resolve({
                    error: false,
                    message: "Access token updated successfully!",
                  });
                }
              );
            } else {
              reject({
                error: true,
                message: "Access token not found!",
              });
            }
          })
          .catch((err) => {
            return Promise.reject({ error: true, message: err });
          });
      } else {
        reject({
          error: true,
          message: "Token not found!",
        });
      }
    });
  },
};
