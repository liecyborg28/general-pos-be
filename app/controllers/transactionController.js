const User = require("../models/userModel");
const Transaction = require("../models/transactionModel");
const pageController = require("./utils/pageController");
const errorMessages = require("../repository/messages/errorMessages");
const successMessages = require("../repository/messages/successMessages");
const transactionResource = require("../repository/resources/transactionResource");

function generateRequestCodes() {
  const viewCode = Math.floor(100000 + Math.random() * 900000);

  let valueCode = viewCode + 123456;

  valueCode = valueCode % 1000000;

  const reversedValueCode = parseInt(
    valueCode.toString().split("").reverse().join("")
  );

  return { status: "initial", viewCode, valueCode: reversedValueCode };
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
          changeLog: [
            {
              date: dateISOString,
              by: userByToken._id,
              data: { status: body.status },
            },
          ],
          changedBy: userByToken._id,
          createdAt: dateISOString,
          updatedAt: dateISOString,
        }
      : {
          error: true,
          message: errorMessages.INVALID_DATA,
        };

    if (isBodyValid()) {
      return new Promise((resolve, reject) => {
        new Transaction(payload)
          .save()
          .then(() => {
            resolve({
              error: false,
              message: successMessages.TRANSACTION_CREATED_SUCCESS,
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

  getTransactions: (req) => {
    let pageKey = req.query.pageKey ? req.query.pageKey : 1;
    let pageSize = req.query.pageSize ? req.query.pageSize : 10;

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
    let pageSize = req.query.pageSize ? req.query.pageSize : 10;

    let defaultFrom = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
    let defaultTo = new Date(
      new Date().setHours(23, 59, 59, 999)
    ).toISOString();

    isNotEveryQueryNull = () => {
      return req.query.from || req.query.to;
    };

    return new Promise((resolve, reject) => {
      let pipeline = isNotEveryQueryNull()
        ? {
            createdAt: {
              $gte: req.query.from || defaultFrom,
              $lte: req.query.to || defaultTo,
            },
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
      return new Promise((resolve, reject) => {
        Transaction.findByIdAndUpdate(body.transactionId, body.data, {
          new: true,
        })
          .then(() => {
            Transaction.findByIdAndUpdate(
              body.transactionId,
              {
                updatedAt: dateISOString,
                changedBy: userByToken._id,
                $push: {
                  changeLog: {
                    date: dateISOString,
                    by: userByToken._id,
                    data: body.data,
                  },
                },
              },
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
