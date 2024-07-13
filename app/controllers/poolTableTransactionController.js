const User = require("../models/userModel");
const PoolTableTransaction = require("../models/poolTableTransactionModel");
const pageController = require("./utils/pageController");
const balanceTransactionController = require("./balanceTransactionController");
const errorMessages = require("../repository/messages/errorMessages");
const successMessages = require("../repository/messages/successMessages");
const logController = require("./logController");

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
  createPoolTableTransaction: async (req) => {
    let dateISOString = new Date().toISOString();
    let body = req.body;

    const bearerHeader = req.headers["authorization"];
    const bearerToken = bearerHeader.split(" ")[1];

    let userByToken = await User.findOne({
      "auth.accessToken": bearerToken,
    });

    let customer = null;

    if (body.customerId) {
      customer = await User.findOne({ _id: body.customerId });
    }

    let isBodyValid = () => {
      return (
        body.businessId &&
        body.outletId &&
        body.userId &&
        body.status &&
        body.details &&
        // body.tax &&
        // body.paymentAmount &&
        // body.paymentMethod &&
        body.details.length > 0
      );
    };

    let payload = isBodyValid()
      ? {
          outletId: body.outletId,
          userId: body.userId,
          businessId: body.businessId,
          customerId: body.customerId ? body.customerId : null,
          scheduledAt: body.scheduledAt,
          status: body.status,
          details: body.details,
          paymentAmount: body.paymentAmount,
          paymentMethod: body.paymentMethod,
          tax: body.tax,
          charge: body.charge ? body.charge : 0,
          costs: body.costs ? body.costs : [],
          discounts: body.discounts ? body.discounts : [],
          customer: body.customer ? body.customer : null,
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
          new PoolTableTransaction(payload).save().then(async (result) => {
            logController.createLog({
              createdAt: dateISOString,
              title: "Create Pool Table Transaction",
              note: "",
              type: "poolTableTransaction",
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
                  note: "Order Meja",
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

  getPoolTableTransactions: (req) => {
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
        .paginate(pageKey, pageSize, pipeline, PoolTableTransaction)
        .then((poolTableTransactions) => {
          PoolTableTransaction.populate(poolTableTransactions.data, {
            path: "businessId outletId userId details.poolTableId",
          })
            .then((data) => {
              resolve({
                error: false,
                data: data,
                count: poolTableTransactions.count,
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

  getPoolTableTransactionsByPeriod: (req) => {
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
        .paginate(pageKey, pageSize, pipeline, PoolTableTransaction)
        .then((transactions) => {
          PoolTableTransaction.populate(transactions.data, {
            path: "businessId outletId userId details.poolTableId",
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

  updatePoolTableTransaction: async (req) => {
    let dateISOString = new Date().toISOString();

    const bearerHeader = req.headers["authorization"];
    const bearerToken = bearerHeader.split(" ")[1];

    let userByToken = await User.findOne({
      "auth.accessToken": bearerToken,
    });

    let body = req.body;

    if (!body.poolTableTransactionId) {
      return Promise.reject({
        error: true,
        message: errorMessages.INVALID_DATA,
      });
    } else {
      body.data["updatedAt"] = dateISOString;
      body.data["changedBy"] = userByToken._id;
      return new Promise(async (resolve, reject) => {
        // if (body.data.status && body.data.status === "canceled") {
        //   let poolTableTransaction = await PoolTableTransaction.findOne({
        //     _id: body.poolTableTransactionId,
        //   });
        // }

        PoolTableTransaction.findByIdAndUpdate(
          body.poolTableTransactionId,
          body.data,
          {
            new: true,
          }
        )
          .then(async (result) => {
            logController.createLog({
              createdAt: dateISOString,
              title: "Update Pool Table Transaction",
              note: body.note ? body.note : "",
              type: "poolTableTransaction",
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
