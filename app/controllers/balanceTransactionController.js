const User = require("../models/userModel");
const Item = require("../models/itemModel");
const Inventory = require("../models/inventoryModel");
const Transaction = require("../models/transactionModel");
const BalanceTransaction = require("../models/balanceTransactionModel");
const pageController = require("./utils/pageController");
const itemController = require("./itemController");
const userController = require("./userController");
const errorMessages = require("../repository/messages/errorMessages");
const successMessages = require("../repository/messages/successMessages");
const logController = require("./logController");
const balanceTransactionModel = require("../models/balanceTransactionModel");
const transactionController = require("./transactionController");
const paymentGatewayController = require("./utils/paymentGatewayController");

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
  createBalanceTransaction: async (req) => {
    let dateISOString = new Date().toISOString();
    let body = req.body;

    const bearerHeader = req.headers["authorization"];
    const bearerToken = bearerHeader.split(" ")[1];

    // Ambil data user dari token
    let userByToken = await User.findOne({
      "auth.accessToken": bearerToken,
    });

    let isBodyValid = () => {
      // Tambahkan data apa saja yang required saat akan request transaksi ke payment gateway
      return body.amount;
    };

    // Payload adalah data yang akan disimpan ke dalam data balanceTransaction
    let payload = isBodyValid()
      ? {
          userId: userByToken._id,
          invoiceId: null,
          status: null,
          amount: body.amount,
          fee: null,
          paymentMethod: null,
          tag: "in",
          createdAt: dateISOString,
          updatedAt: dateISOString,
        }
      : {
          error: true,
          message: errorMessages.INVALID_DATA,
        };

    if (isBodyValid()) {
      // Logic saat ingin request transaksi ke payment gateway sampai berhasil simpan di sini

      // Dapatkan invoiceId dan status setelah invoice telah dibuat saat request transaksi ke payment gateway telah berhasil
      let invoiceId = null;

      let status = null;

      // Isi payload fee dan paymentMethod dengan data dari API
      payload["fee"] = null;
      payload["paymentMethod"] = null;
      payload["status"] = status;
      payload["invoiceId"] = invoiceId;

      new BalanceTransaction(payload).save().then(async (result) => {
        logController.createLog({
          createdAt: dateISOString,
          title: "Create Balance Transaction",
          note: "Top Up Balance",
          type: "balanceTransaction",
          from: result._id,
          by: userByToken._id,
          data: result,
        });

        // update user balance
        userController.updateUser({
          body: {
            userId: userByToken._id,
            data: {
              balance: userByToken.balance + body.balance,
            },
          },
        });
      });
    } else {
      return Promise.reject(payload);
    }
  },

  getBalanceTransactionsByPeriod: (req) => {
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
      let pipeline = {
        createdAt: {
          $gte: req.query.from
            ? convertToLocaleISOString(new Date(req.query.from), "start")
            : defaultFrom,
          $lte: req.query.to
            ? convertToLocaleISOString(new Date(req.query.to), "end")
            : defaultTo,
        },
      };

      pageController
        .paginate(pageKey, pageSize, pipeline, Transaction)
        .then((transactions) => {
          BalanceTransaction.populate(transactions.data, {
            path: "userId",
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

  // Update balance transaction digunakan oleh API payment gateway saat ingin update status transaksi nanti untuk bagian pengiriman / request body nya mungkin masih harus disesuaikan lagi mengikuti cara kirim payment gateway.
  updateBalanceTransaction: async (req) => {
    let dateISOString = new Date().toISOString();
    let body = req.body;

    const bearerHeader = req.headers["authorization"];
    const bearerToken = bearerHeader.split(" ")[1];

    // Ambil data user dari token
    let userByToken = await User.findOne({
      "auth.accessToken": bearerToken,
    });

    let isBodyValid = () => {
      return body.invoiceId && body.status && body.tag;
    };

    let payload = isBodyValid()
      ? {
          status: body.status,
          tag: body.tag ? body.tag : null,
        }
      : {
          error: true,
          message: errorMessages.INVALID_DATA,
        };

    if (isBodyValid()) {
      BalanceTransaction.findOneAndUpdate(
        {
          invoiceId: body.invoiceId,
        },
        payload,
        {
          new: true,
        }
      )
        .then((result) => {
          logController.createLog({
            createdAt: dateISOString,
            title: "Update Balance Transaction",
            note: body.note ? body.note : "",
            type: "balanceTransaction",
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
    } else {
      return Promise.reject(payload);
    }
  },
  // Metode untuk top-up menggunakan DOKU
  topUp: async (req, res) => {
    const { amount, invoiceNumber, customerName, email, phoneNumber, paymentMethod } = req.body;

    try {
      const paymentResponse = await paymentGatewayController.requestPaymentDOKU({ amount, invoiceNumber, customerName, email, phoneNumber, paymentMethod });

      // Proses paymentResponse sesuai kebutuhan
      // Contoh: Update saldo user, simpan transaksi ke database, dll.

      const dateISOString = new Date().toISOString();
      const bearerHeader = req.headers["authorization"];
      const bearerToken = bearerHeader.split(" ")[1];

      // Ambil data user dari token
      const userByToken = await User.findOne({
        "auth.accessToken": bearerToken,
      });

      // Payload adalah data yang akan disimpan ke dalam data balanceTransaction
      const payload = {
        userId: userByToken._id,
        invoiceId: paymentResponse.order.invoice_number,
        status: paymentResponse.order.status,
        amount: amount,
        fee: paymentResponse.order.fee,
        paymentMethod: paymentResponse.order.payment_method,
        tag: "in",
        createdAt: dateISOString,
        updatedAt: dateISOString,
      };

      new BalanceTransaction(payload).save().then(async (result) => {
        logController.createLog({
          createdAt: dateISOString,
          title: "Create Balance Transaction",
          note: "Top Up Balance",
          type: "balanceTransaction",
          from: result._id,
          by: userByToken._id,
          data: result,
        });

        // update user balance
        userController.updateUser({
          body: {
            userId: userByToken._id,
            data: {
              balance: userByToken.balance + amount,
            },
          },
        });

        res.status(200).json(result);
      }).catch((error) => {
        console.error('Error saving balance transaction:', error);
        res.status(500).json({ message: 'Failed to save balance transaction', error: error.message });
      });
    } catch (error) {
      console.error('Error processing top-up:', error);
      res.status(500).json({ message: 'Failed to process top-up', error: error.message });
    }
  },
};
