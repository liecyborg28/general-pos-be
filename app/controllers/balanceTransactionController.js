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
      return body.invoiceId && body.status;
    };

    let payload = isBodyValid()
      ? {
          status: body.status,
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
};
