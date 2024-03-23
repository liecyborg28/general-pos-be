const User = require("../models/userModel");
const Item = require("../models/itemModel");
const Inventory = require("../models/inventoryModel");
const Transaction = require("../models/transactionModel");
const pageController = require("./utils/pageController");
const itemController = require("./itemController");
const inventoryController = require("./inventoryController");
const errorMessages = require("../repository/messages/errorMessages");
const successMessages = require("../repository/messages/successMessages");
const logController = require("./logController");

function generateRequestCodes() {
  const viewCode = Math.floor(100000 + Math.random() * 900000);

  let valueCode = viewCode + 123456;

  valueCode = valueCode % 1000000;

  const reversedValueCode = parseInt(
    valueCode.toString().split("").reverse().join("")
  );

  return { status: "initial", viewCode, valueCode: reversedValueCode };
}

function convertToLocaleISOString(date, type) {
  if (type !== "start" && type !== "end") {
    throw new Error('Parameter "type" harus "start" atau "end"');
  }

  // if (type === "start") date.setDate(date.getDate() + 1);

  return date
    .toISOString()
    .replace(
      /T\d{2}:\d{2}:\d{2}.\d{3}Z/,
      type === "start" ? "T00:00:00.000Z" : "T23:59:59.999Z"
    );
}

module.exports = {
  createTransaction: async (req) => {
    let dateISOString = new Date().toISOString();
    let body = req.body;

    const bearerHeader = req.headers["authorization"];
    const bearerToken = bearerHeader.split(" ")[1];

    let userByToken = await User.findOne({
      "auth.accessToken": bearerToken,
    });

    let isBodyValid = () => {
      return (
        body.businessId &&
        body.outletId &&
        body.userId &&
        body.status &&
        body.orderStatus &&
        body.details &&
        body.tax &&
        body.paymentAmount &&
        body.paymentMethod &&
        body.details.length > 0
      );
    };

    let payload = isBodyValid()
      ? {
          status: body.status,
          orderStatus: body.orderStatus,
          businessId: body.businessId,
          outletId: body.outletId,
          userId: body.userId,
          details: body.details,
          tax: body.tax,
          paymentAmount: body.paymentAmount,
          paymentMethod: body.paymentMethod,
          charge: body.charge ? body.charge : 0,
          costs: body.costs ? body.costs : [],
          discounts: body.discounts ? body.discounts : [],
          customer: body.customer ? body.customer : null,
          table: body.table ? body.table : null,
          request: generateRequestCodes(),
          changedBy: userByToken._id,
          createdAt: dateISOString,
          updatedAt: dateISOString,
        }
      : {
          error: true,
          message: errorMessages.INVALID_DATA,
        };

    if (isBodyValid()) {
      return new Promise(async (resolve, reject) => {
        let outOfStockList = [];
        let almostOutList = [];
        let availableList = [];

        const promises = body.details
          .map(async (detail) => {
            try {
              const item = await Item().findOne({
                _id: detail.itemId,
              });

              Inventory.populate(item, {
                path: "ingredients.inventoryId",
              })
                .then((item) => {
                  item.ingredients.forEach((e) => {
                    if (e.inventoryId.qty.last - e.qty * detail.qty <= 0) {
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
            } catch (error) {
              reject({
                error: true,
                message: errorMessages.FAILED_SAVED_DATA,
              });
            }
          })
          .catch((err) => {
            reject({ error: true, message: err });
          });

        await Promise.all(promises);

        if (outOfStockList.length > 0) {
          reject({
            error: true,
            message: errorMessages.TRANSACTION_FAILED_OUT_OF_STOCK,
          });
        }

        if (almostOutList.length > 0) {
          almostOutList.forEach((e) => {
            inventoryController.updateInventory({
              inventoryId: e.inventoryId._id,
              data: {
                qty: {
                  status: "almostOut",
                  last: e.inventoryId.qty.last - e.qty * detail.qty,
                  early: e.inventoryId.qty.early,
                  min: e.inventoryId.qty.min,
                  max: e.inventoryId.qty.max,
                },
              },
            });
          });
        }

        if (availableList.length > 0) {
          availableList.forEach((e) => {
            inventoryController.updateInventory({
              inventoryId: e.inventoryId._id,
              data: {
                qty: {
                  status: "available",
                  last: e.inventoryId.qty.last - e.qty * detail.qty,
                  early: e.inventoryId.qty.early,
                  min: e.inventoryId.qty.min,
                  max: e.inventoryId.qty.max,
                },
              },
            });
          });
        }

        new Transaction(payload).save().then((result) => {
          logController.createLog({
            createdAt: dateISOString,
            title: "Create Transaction",
            note: "",
            type: "transaction",
            from: result._id,
            by: userByToken._id,
            data: result,
          });

          resolve({
            error: false,
            data: result,
            message: successMessages.TRANSACTION_CREATED_SUCCESS,
          });
        });
      });
    } else {
      return Promise.reject(payload);
    }
  },

  getTransactions: (req) => {
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

  getTransactionsByPeriod: (req) => {
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

  updateTransaction: async (req) => {
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
      // body.data["$push"] = {
      //   changeLog: {
      //     date: dateISOString,
      //     by: userByToken._id,
      //     data: body.data,
      //   },
      // };
      return new Promise((resolve, reject) => {
        if (body.data.status && body.data.status === "canceled") {
        }
        Transaction.findByIdAndUpdate(body.transactionId, body.data, {
          new: true,
        })
          .then((result) => {
            logController.createLog({
              createdAt: dateISOString,
              title: "Update Transaction",
              note: body.note ? body.note : "",
              type: "transaction",
              from: body.transactionId,
              by: userByToken._id,
              data: body.data,
            });
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
