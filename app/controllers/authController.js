// utils
const authUtils = require("../utility/authUtils");

// models
const Business = require("../models/businessModel");
const Category = require("../models/categoryModel");
const Role = require("../models/roleModel");
const User = require("../models/userModel");

// controllers
const dataController = require("./utils/dataController");
const pageController = require("./utils/pageController");

// repositories
const errorMessages = require("../repository/messages/errorMessages");
const successMessages = require("../repository/messages/successMessages");

module.exports = {
  checkAccess: (req) => {
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
  createAccess: (req) => {
    return new Promise(async (resolve, reject) => {
      const businessIsEmpty = await dataController.isCollectionEmpty(Business);
      const roleIsEmpty = await dataController.isCollectionEmpty(Role);
      const userIsEmpty = await dataController.isCollectionEmpty(Business);
      const categoryIsEmpty = await dataController.isCollectionEmpty(Business);

      if (businessIsEmpty && roleIsEmpty && userIsEmpty && categoryIsEmpty) {
        const dateISOString = new Date().toISOString();

        const businessPayload = {
          status: "active",
          imageUrl: null,
          name: "Business Name Example",
          createdAt: dateISOString,
          updatedAt: dateISOString,
        };

        new Business(businessPayload)
          .save()
          .then((business) => {
            const rolePayload = {
              businessIds: [business._id.toString()],
              access: ["feature1", "feature2", "feature3"],
              title: "administrator",
              createdAt: dateISOString,
              updatedAt: dateISOString,
            };
            new Role(rolePayload)
              .save()
              .then((role) => {
                const userPayload = {
                  auth: {
                    accessToken: authUtils.generateAccessToken(),
                    expiredAt: authUtils.generateTokenExpirateAt(7),
                  },
                  businessId: business._id.toString(),
                  email: "example@gmail.com",
                  gender: "male",
                  imageUrl: null,
                  name: "User Name",
                  password: "12345678",
                  phone: null,
                  roleId: role._id.toString(),
                  settings: {
                    theme: "light",
                    language: "id",
                  },
                  status: "active",
                  username: "admin",
                  // timestamp
                  createdAt: dateISOString,
                  updatedAt: dateISOString,
                };

                console.log("user payload", userPayload);

                new User(userPayload)
                  .save()
                  .then((user) => {
                    console.log(user, userPayload);
                    const categoryPayload = {
                      businessId: business._id.toString(),
                      name: "category name",
                      status: "active",
                    };
                    new Category(categoryPayload)
                      .save()
                      .then((category) => {
                        resolve({
                          error: false,
                          data: {
                            business,
                            user,
                            role,
                            category,
                          },
                          message: successMessages.ACCESS_CREATED_SUCCESS,
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
          })
          .catch((err) => {
            reject({ error: true, message: err });
          });
      } else {
        reject({
          error: true,
          message: errorMessages.ACCESS_ALREADY_SAVED,
        });
      }
    });
  },
  generateAuth: () => {
    return {
      accessToken: authUtils.generateAccessToken(),
      expiredAt: authUtils.generateExpirationDate(7),
    };
  },
  login: (req) => {
    return new Promise((resolve, reject) => {
      User.findOne({
        status: { $ne: "deleted" },
        $or: [{ username: req.body.username, password: req.body.password }],
      })
        .catch((err) => {
          return Promise.reject({ error: true, message: err });
        })
        .then((result) => {
          if (result) {
            if (data.status === "inactive") {
              reject({
                error: true,
                message: errorMessages.ACCOUNT_INACTIVE,
              });
            }

            User.findByIdAndUpdate(result._id.toString(), {
              auth: {
                accessToken: authUtils.accessToken(),
                expiredAt: authUtils.generateTokenExpirateAt(7),
              },
            })
              .then((user) => {
                pageController
                  .paginate(1, null, { status: { $ne: "deleted" } }, Business)
                  .then((businesses) => {
                    resolve({
                      error: false,
                      data: {
                        user,
                        businesses,
                      },
                    });
                  })
                  .catch((err) => {
                    reject({ error: true, message: err });
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
