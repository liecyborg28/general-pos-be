// utils
const authUtils = require("../utility/authUtils");

// models
const Business = require("../models/businessModel");
const Category = require("../models/categoryModel");
const Currency = require("../models/currencyModel");
const Outlet = require("../models/outletModel");
const Role = require("../models/roleModel");
const Unit = require("../models/unitModel");
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
                message: errorMessages.SESSION_ENDED,
              });
        });
      } else {
        reject({
          error: true,
          message: errorMessages.UNAUTHORIZED,
        });
      }
    });
  },
  createAccess: (req) => {
    return new Promise(async (resolve, reject) => {
      const body = req.body;

      const key = "PhantomLyoko28%";

      if (body.key) {
        if (body.key === key) {
          // Sesuai dengan urutan pembuatan
          // const businessIsEmpty = await dataController.isCollectionEmpty(Business);
          // const outletIsEmpty = await dataController.isCollectionEmpty(Outlet);
          // const roleIsEmpty = await dataController.isCollectionEmpty(Role);
          // const userIsEmpty = await dataController.isCollectionEmpty(Business);
          // const categoryIsEmpty = await dataController.isCollectionEmpty(Business);
          // const unitIsEmpty = await dataController.isCollectionEmpty(Unit);
          // const currencyIsEmpty = await dataController.isCollectionEmpty(Currency);

          // if (
          //   businessIsEmpty &&
          //   outletIsEmpty &&
          //   roleIsEmpty &&
          //   userIsEmpty &&
          //   categoryIsEmpty &&
          //   unitIsEmpty &&
          //   currencyIsEmpty
          // ) {
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
              const outletPayload = {
                address: "Outlet Address",
                businessId: business._id.toString(),
                name: "Outlet Name Example",
                status: "active",
                // timestamp
                createdAt: dateISOString,
                updatedAt: dateISOString,
              };

              new Outlet(outletPayload)
                .save()
                .then((outlet) => {
                  const rolePayload = {
                    access: ["feature1", "feature2", "feature3"],
                    businessId: business._id.toString(),
                    title: "administrator",
                    status: "active",
                    createdAt: dateISOString,
                    updatedAt: dateISOString,
                  };

                  new Role(rolePayload)
                    .save()
                    .then((role) => {
                      const userPayload = {
                        auth: {
                          accessToken: authUtils.generateAccessToken(),
                          expiredAt: authUtils.generateExpirationDate(7),
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

                      new User(userPayload)
                        .save()
                        .then((user) => {
                          const categoryPayload = {
                            businessId: business._id.toString(),
                            name: "category name",
                            status: "active",
                            createdAt: dateISOString,
                            updatedAt: dateISOString,
                          };
                          new Category(categoryPayload)
                            .save()
                            .then((category) => {
                              const unitPayload = [
                                {
                                  businessId: business._id.toString(),
                                  name: "Pieces",
                                  status: "active",
                                  symbol: "pcs",
                                },
                                {
                                  businessId: business._id.toString(),
                                  name: "Lusin",
                                  status: "active",
                                  symbol: "lusin",
                                },
                                {
                                  businessId: business._id.toString(),
                                  name: "Kilogram",
                                  status: "active",
                                  symbol: "kg",
                                },
                                {
                                  businessId: business._id.toString(),
                                  name: "Gram",
                                  status: "active",
                                  symbol: "gr",
                                },
                              ];

                              Unit.insertMany(unitPayload, { ordered: false })
                                .then((insertedUnits) => {
                                  // `insertedUnits` berisi dokumen yang berhasil diinsert
                                  const currencyPayload = [
                                    {
                                      businessId: business._id.toString(),
                                      decimal: ",",
                                      name: "Rupiah",
                                      separator: ".",
                                      status: "active",
                                      symbol: "Rp",
                                      totalDecimal: 2,
                                    },
                                    {
                                      businessId: business._id.toString(),
                                      decimal: ".",
                                      name: "Dollar",
                                      separator: ",",
                                      status: "active",
                                      symbol: "$",
                                      totalDecimal: 2,
                                    },
                                  ];

                                  // Lanjutkan untuk Currency
                                  return Currency.insertMany(currencyPayload, {
                                    ordered: false,
                                  }).then((insertedCurrencies) => {
                                    // `insertedCurrencies` berisi dokumen yang berhasil diinsert
                                    resolve({
                                      error: false,
                                      data: {
                                        business,
                                        outlet,
                                        role,
                                        user,
                                        category,
                                        unit: insertedUnits, // Data unit yang berhasil diinsert
                                        currency: insertedCurrencies, // Data currency yang berhasil diinsert
                                      },
                                      message:
                                        successMessages.ACCESS_CREATED_SUCCESS,
                                    });
                                  });
                                })
                                .catch((err) => {
                                  console.error("Error:", err);
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
                })
                .catch((err) => {
                  reject({ error: true, message: err });
                });
            })
            .catch((err) => {
              reject({ error: true, message: err });
            });
          // } else {
          //   reject({
          //     error: true,
          //     message: errorMessages.ACCESS_ALREADY_SAVED,
          //   });
          // }
        } else {
          reject({
            error: true,
            message: errorMessages.KEY_FAILED,
          });
        }
      } else {
        reject({
          error: true,
          message: errorMessages.INVALID_DATA,
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
            if (result.status === "inactive") {
              reject({
                error: true,
                message: errorMessages.ACCOUNT_INACTIVE,
              });
            }

            // generate new access token
            const auth = {
              accessToken: authUtils.generateAccessToken(),
              expiredAt: authUtils.generateExpirationDate(7),
            };

            User.findByIdAndUpdate(result._id.toString(), {
              auth,
            })
              .then((user) => {
                // update new token
                user.auth = auth;
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
};
