const User = require("../models/userModel");
const Transaction = require("../models/transactionModel");
// const dataController = require("./dataController");
const pageController = require("./pageController");
const errorMessages = require("../messages/errorMessages");
const successMessages = require("../messages/successMessages");

function generateRequestCodes() {
  // Generate 6 digit angka acak untuk viewCode
  const viewCode = Math.floor(100000 + Math.random() * 900000);

  // Hitung valueCode sesuai dengan aturan
  let valueCode = viewCode + 123456;

  // Ambil hanya 6 digit kode dari belakang valueCode
  valueCode = valueCode % 1000000;

  // Balik urutan digit-digit valueCode
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
          charge: body.charge ? body.charge : 0,
          costs: body.costs ? body.costs : [],
          customer: body.customer ? body.customer : null,
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
          Transaction(transactions.data)
            .populate({ path: "businessId outletId userId details.itemId" })
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
          // let transformedData = transactions.data.map((e) => ({
          //   status: e.status,
          //   businessId: e.businessId,
          //   outletId: e.outletId,
          //   userId: e.userId,
          //   details: e.details.map((detail) => ({
          //     item_profile: detail.itemId,
          //     qty: detail.qty,
          //     price: detail.price,
          //   })),
          //   customer: body.customer ? body.customer : null,
          //   changeLog: e.changeLog,
          //   changedBy: e.changedBy,
          //   createdAt: e.createdAt,
          //   updatedAt: e.updatedAt,
          // }));
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
