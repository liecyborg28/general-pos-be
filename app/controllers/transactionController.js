const User = require("../models/userModel");
const Product = require("../models/productModel");
const Inventory = require("../models/componentModel");
const Transaction = require("../models/transactionModel");
const pageController = require("./utils/pageController");
const inventoryController = require("./componentController");
const errorMessages = require("../repository/messages/errorMessages");
const successMessages = require("../repository/messages/successMessages");
const paymentMethodModel = require("../models/paymentMethodModel");
const serviceMethodModel = require("../models/serviceMethodModel");

function generateRequestCodes() {
  const viewCode = Math.floor(100000 + Math.random() * 900000);

  let valueCode = viewCode + 123456;

  valueCode = valueCode % 1000000;

  const reversedValueCode = parseInt(
    valueCode.toString().split("").reverse().join("")
  );

  return { status: "initial", viewCode, valueCode: reversedValueCode };
}

function getDateWithOffset(date = new Date()) {
  const offset = -date.getTimezoneOffset();
  const sign = offset >= 0 ? "+" : "-";
  const hours = String(Math.floor(Math.abs(offset) / 60)).padStart(2, "0");
  const minutes = String(Math.abs(offset) % 60).padStart(2, "0");

  return date.toISOString().slice(0, -1) + sign + hours + ":" + minutes;
}

function convertToLocaleISOString(date, type) {
  if (type !== "start" && type !== "end") {
    throw new Error('Parameter "type" harus "start" atau "end"');
  }

  // Format bagian tanggal (tanpa timezone) dari input date
  const [year, month, day] = date.slice(0, 10).split("-");

  // Menentukan waktu berdasarkan type
  const time = type === "start" ? "00:00:00.000" : "23:59:59.999";

  // Menambahkan offset dari date input
  const offset = date.slice(19);

  // Menghasilkan string ISO dengan offset yang sudah didapat
  return `${year}-${month}-${day}T${time}${offset}`;
}

module.exports = {
  create: async (req) => {
    let dateISOString = new Date().toISOString();
    let body = req.body;

    const bearerHeader = req.headers["authorization"];
    const bearerToken = bearerHeader.split(" ")[1];

    let userByToken = await User.findOne({
      "auth.accessToken": bearerToken,
    });

    let isBodyValid = () => {
      return (
        body.amount !== null &&
        body.businessId &&
        body.charges &&
        body.date &&
        body.details &&
        body.promotions &&
        body.outletId &&
        body.taxes &&
        body.tips &&
        body.userId &&
        body.status
      );
    };

    let payload = isBodyValid()
      ? {
          amount: body.amount,
          businessId: body.businessId,
          customerId: body.customerId,
          charges: body.charges,
          details: body.details,
          note: body.note,
          outletId: body.outletId,
          paymentMethodId: body.paymentMethodId,
          promotions: body.promotions,
          request: generateRequestCodes(),
          status: body.status,
          serviceMethodId: body.serviceMethodId,
          taxes: body.taxes,
          tips: body.tips,
          userId: body.userId,
          createdAt: body.date,
          updatedAt: body.date,
        }
      : {
          error: true,
          message: errorMessages.INVALID_DATA,
        };

    if (isBodyValid()) {
      return new Promise(async (resolve, reject) => {
        if (
          body.status === "completed" &&
          body.customerId &&
          body.paymentMethod === "accountBalance" &&
          customer.balance < body.paymentAmount
        ) {
          reject({
            error: true,
            message: errorMessages.BALANCE_NOT_ENOUGH,
          });
        } else {
          let outOfStockList = [];
          let almostOutList = [];
          let availableList = [];

          const promises = body.details.map(async (detail) => {
            try {
              const item = await Item.findOne({
                _id: detail.itemId,
              });

              await Inventory.populate(item, {
                path: "ingredients.inventoryId",
              })
                .then((item) => {
                  item.ingredients.forEach((e) => {
                    if (e.inventoryId.qty.last - e.qty * detail.qty < 0) {
                      outOfStockList.push(e);
                    } else if (
                      e.inventoryId.qty.last - e.qty * detail.qty <=
                      e.inventoryId.qty.min
                    ) {
                      almostOutList.push(e);
                    } else {
                      availableList.push(e);
                    }
                  });
                })
                .catch((err) => {
                  reject({ error: true, message: err });
                });

              if (outOfStockList.length > 0) {
                reject({
                  error: true,
                  message: errorMessages.TRANSACTION_FAILED_OUT_OF_STOCK,
                });
              }

              if (almostOutList.length > 0) {
                almostOutList.forEach((e) => {
                  inventoryController.updateInventory({
                    headers: req.headers,
                    body: {
                      inventoryId: e.inventoryId._id,
                      note: "Create Transaction",
                      data: {
                        qty: {
                          status: "almostOut",
                          last: e.inventoryId.qty.last - e.qty * detail.qty,
                          early: e.inventoryId.qty.early,
                          min: e.inventoryId.qty.min,
                          max: e.inventoryId.qty.max,
                        },
                      },
                    },
                  });
                });
              }

              if (availableList.length > 0) {
                availableList.forEach((e) => {
                  inventoryController.updateInventory({
                    headers: req.headers,
                    body: {
                      inventoryId: e.inventoryId._id,
                      note: "Create Transaction",
                      data: {
                        qty: {
                          status: "available",
                          last: e.inventoryId.qty.last - e.qty * detail.qty,
                          early: e.inventoryId.qty.early,
                          min: e.inventoryId.qty.min,
                          max: e.inventoryId.qty.max,
                        },
                      },
                    },
                  });
                });
              }
            } catch (error) {
              reject({
                error: true,
                message: errorMessages.FAILED_SAVED_DATA,
              });
            }
          });

          await Promise.all(promises);

          new Transaction(payload).save().then(async (result) => {
            logController.createLog({
              createdAt: dateISOString,
              title: "Create Transaction",
              note: "",
              type: "transaction",
              from: result._id,
              by: userByToken._id,
              data: result,
            });

            if (
              body.status === "completed" &&
              body.customerId &&
              body.paymentMethod === "accountBalance" &&
              customer.balance >= body.paymentAmount
            ) {
              await balanceTransactionController.createBalanceTransaction({
                headers: req.headers,
                body: {
                  customerId: body.customerId,
                  amount: body.paymentAmount,
                  tag: "out",
                  note: "Order Menu",
                },
              });
            }

            resolve({
              error: false,
              data: result,
              message: successMessages.TRANSACTION_CREATED_SUCCESS,
            });
          });
        }
      });
    } else {
      return Promise.reject(payload);
    }
  },

  get: (req) => {
    let pageKey = req.query.pageKey ? req.query.pageKey : 1;
    let pageSize = req.query.pageSize ? req.query.pageSize : null;

    isNotEveryQueryNull = () => {
      return (
        req.query.keyword ||
        req.query.customer ||
        req.query.businessId ||
        req.query.outletId ||
        req.query.userId ||
        req.query.createdAt
      );
    };

    return new Promise((resolve, reject) => {
      let pipeline = isNotEveryQueryNull()
        ? {
            // status: transactionResource.STATUS.COMPLETED.value,
            $or: [
              {
                customer: req.query.keyword
                  ? { $regex: req.query.keyword, $options: "i" }
                  : null,
              },
              {
                customer: req.query.customer
                  ? { $regex: req.query.customer, $options: "i" }
                  : null,
              },
              {
                businessId: req.query.businessId ? req.query.businessId : null,
              },
              {
                outletId: req.query.outletId ? req.query.outletId : null,
              },
              {
                userId: req.query.userId ? req.query.userId : null,
              },
              {
                createdAt: req.query.createdAt ? req.query.createdAt : null,
              },
            ],
          }
        : {};

      pageController
        .paginate(pageKey, pageSize, pipeline, Transaction)
        .then((transactions) => {
          Transaction.populate(transactions.data, {
            path: "businessId outletId userId details.itemId",
          })
            .then((data) => {
              resolve({
                error: false,
                data: data,
                count: transactions.count,
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
  },

  getByPeriod: (req) => {
    let pageKey = req.query.pageKey ? req.query.pageKey : 1;
    let pageSize = req.query.pageSize
      ? req.query.pageSize
      : 1 * 1000 * 1000 * 1000;

    let defaultFrom = convertToLocaleISOString(new Date(), "start");
    let defaultTo = convertToLocaleISOString(new Date(), "end");

    isNotEveryQueryNull = () => {
      return req.query.from || req.query.to;
    };

    return new Promise((resolve, reject) => {
      let pipeline = isNotEveryQueryNull()
        ? req.query.outletId
          ? {
              outletId: req.query.outletId,
              createdAt: {
                $gte: req.query.from
                  ? convertToLocaleISOString(new Date(req.query.from), "start")
                  : defaultFrom,
                $lte: req.query.to
                  ? convertToLocaleISOString(new Date(req.query.to), "end")
                  : defaultTo,
              },
            }
          : {
              createdAt: {
                $gte: req.query.from
                  ? convertToLocaleISOString(new Date(req.query.from), "start")
                  : defaultFrom,
                $lte: req.query.to
                  ? convertToLocaleISOString(new Date(req.query.to), "end")
                  : defaultTo,
              },
            }
        : req.query.outletId
        ? {
            outletId: req.query.outletId,
            createdAt: {
              $gte: defaultFrom,
              $lte: defaultTo,
            },
          }
        : {
            createdAt: {
              $gte: defaultFrom,
              $lte: defaultTo,
            },
          };

      pageController
        .paginate(pageKey, pageSize, pipeline, Transaction, -1)
        .then((transactions) => {
          Transaction.populate(transactions.data, {
            path: "businessId outletId userId details.itemId",
          })
            .then((data) => {
              resolve({
                error: false,
                data: data,
                count: transactions.count,
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
  },

  update: async (req) => {
    let dateISOString = new Date().toISOString();

    const bearerHeader = req.headers["authorization"];
    const bearerToken = bearerHeader.split(" ")[1];

    let userByToken = await User.findOne({
      "auth.accessToken": bearerToken,
    });

    let body = req.body;

    if (!body.transactionId) {
      return Promise.reject({
        error: true,
        message: errorMessages.INVALID_DATA,
      });
    } else {
      body.data["updatedAt"] = dateISOString;
      body.data["changedBy"] = userByToken._id;
      return new Promise(async (resolve, reject) => {
        if (body.data.status && body.data.status === "canceled") {
          let transaction = await Transaction.findOne({
            _id: body.transactionId,
          });

          const promises = transaction.details.map(async (detail) => {
            try {
              const item = await Item.findOne({ _id: detail.itemId });

              await Inventory.populate(item, {
                path: "ingredients.inventoryId",
              })
                .then((item) => {
                  item.ingredients.forEach((e) => {
                    inventoryController.updateInventory({
                      headers: req.headers,
                      body: {
                        inventoryId: e.inventoryId._id,
                        note: "Update Transaction",
                        data: {
                          qty: {
                            last: e.inventoryId.qty.last + e.qty * detail.qty,
                            early: e.inventoryId.qty.early,
                            min: e.inventoryId.qty.min,
                            max: e.inventoryId.qty.max,
                          },
                        },
                      },
                    });
                  });
                })
                .catch((err) => {
                  reject({ error: true, message: err });
                });
            } catch (err) {
              reject({
                error: true,
                message: errorMessages.FAILED_SAVED_DATA,
              });
            }
          });

          await Promise.all(promises);
        }

        Transaction.findByIdAndUpdate(body.transactionId, body.data, {
          new: true,
        })
          .then(async (result) => {
            logController.createLog({
              createdAt: dateISOString,
              title: "Update Transaction",
              note: body.note ? body.note : "",
              type: "transaction",
              from: body.transactionId,
              by: userByToken._id,
              data: body.data,
            });

            if (
              body.data.status === "completed" &&
              body.data.customerId &&
              body.data.paymentMethod === "accountBalance" &&
              customer.balance >= body.data.paymentAmount
            ) {
              await balanceTransactionController.createBalanceTransaction({
                headers: req.headers,
                body: {
                  customerId: body.customerId,
                  amount: body.paymentAmount,
                  tag: "out",
                  note: "Order Menu",
                },
              });
            }

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
