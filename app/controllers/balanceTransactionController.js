//mamah uwu
const User = require("../models/userModel");
const Transaction = require("../models/transactionModel");
const BalanceTransaction = require("../models/balanceTransactionModel");
const pageController = require("./utils/pageController");
const userController = require("./userController");
const errorMessages = require("../repository/messages/errorMessages");
const successMessages = require("../repository/messages/successMessages");
const logController = require("./logController");
const balanceTransactionModel = require("../models/balanceTransactionModel");
const transactionController = require("./transactionController");
const paymentGatewayController = require("./utils/paymentGatewayController");
const crypto = require("crypto");
const config = require("../config/config");
const Joi = require("joi");
const logger = require("../utils/logger"); // Gunakan modul logging

function convertToLocaleISOString(date, type) {
  if (type !== "start" && type !== "end") {
    throw new Error('Parameter "type" harus "start" atau "end"');
  }

  return date
    .toISOString()
    .replace(
      /T\d{2}:\d{2}:\d{2}.\d{3}Z/,
      type === "start" ? "T00:00:00.000Z" : "T23:59:59.999Z"
    );
}

// Skema validasi untuk topUp
const topUpSchema = Joi.object({
  amount: Joi.number().positive().required(),
  customerName: Joi.string().required(),
  email: Joi.string().email().required(),
  phoneNumber: Joi.string().optional(),
  paymentMethod: Joi.string().valid("credit_card", "008", "009").required(), // Sesuaikan dengan kode channel DOKU
});

module.exports = {
  // Middleware untuk validasi token
  authenticateUser: async (req, res, next) => {
    try {
      const bearerHeader = req.headers["authorization"];
      if (!bearerHeader) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const bearerToken = bearerHeader.split(" ")[1];
      const user = await User.findOne({ "auth.accessToken": bearerToken });
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      req.user = user;
      next();
    } catch (error) {
      logger.error("Error authenticating user:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  createBalanceTransaction: async (req) => {
    try {
      let dateISOString = new Date().toISOString();
      let body = req.body;

      const bearerHeader = req.headers["authorization"];
      const bearerToken = bearerHeader.split(" ")[1];

      // Ambil data user dari token
      let userByToken = await User.findOne({
        "auth.accessToken": bearerToken,
      });

      let isBodyValid = () => {
        return body.amount;
      };

      // Payload untuk data balanceTransaction
      let payload = isBodyValid()
        ? {
            userId: userByToken._id,
            invoiceId: null, // Akan diupdate setelah request ke payment gateway
            status: null, // Akan diupdate setelah request ke payment gateway
            amount: body.amount,
            fee: null, // Akan diupdate setelah request ke payment gateway
            paymentMethod: null, // Akan diupdate setelah request ke payment gateway
            tag: "in",
            createdAt: dateISOString,
            updatedAt: dateISOString,
          }
        : {
            error: true,
            message: errorMessages.INVALID_DATA,
          };

      if (isBodyValid()) {
        // ... (Logika untuk request transaksi ke payment gateway)

        // Contoh:
        // const paymentResponse = await paymentGatewayController.requestPayment(...);

        // Update payload dengan data dari payment gateway response
        payload.invoiceId = paymentResponse.invoiceId; // Sesuaikan properti response
        payload.status = paymentResponse.status; // Sesuaikan properti response
        payload.fee = paymentResponse.fee; // Sesuaikan properti response
        payload.paymentMethod = paymentResponse.paymentMethod; // Sesuaikan properti response

        const newBalanceTransaction = await new BalanceTransaction(
          payload
        ).save();

        logController.createLog({
          createdAt: dateISOString,
          title: "Create Balance Transaction",
          note: "Top Up Balance",
          type: "balanceTransaction",
          from: newBalanceTransaction._id,
          by: userByToken._id,
          data: newBalanceTransaction,
        });

        // Update saldo user
        await userController.updateUser({
          body: {
            userId: userByToken._id,
            data: {
              balance: userByToken.balance + body.amount, // Update saldo dengan amount
            },
          },
        });
      } else {
        return Promise.reject(payload);
      }
    } catch (error) {
      // Handle error dengan tepat
      logger.error("Error creating balance transaction:", error);
      // Kirim response error
    }
  },

  getBalanceTransactionsByPeriod: (req) => {
    try {
      let pageKey = req.query.pageKey ? req.query.pageKey : 1;
      let pageSize = req.query.pageSize
        ? req.query.pageSize
        : 1 * 1000 * 1000 * 1000;

      let defaultFrom = convertToLocaleISOString(new Date(), "start");
      let defaultTo = convertToLocaleISOString(new Date(), "end");

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

      return pageController
        .paginate(pageKey, pageSize, pipeline, Transaction)
        .then((transactions) => {
          return BalanceTransaction.populate(transactions.data, {
            path: "userId",
          }).then((data) => {
            return {
              error: false,
              data: data,
              count: transactions.count,
            };
          });
        });
    } catch (error) {
      // Handle error dengan tepat
      logger.error("Error getting balance transactions:", error);
      // Kirim response error
    }
  },

  // Update balance transaction
  updateBalanceTransaction: async (req) => {
    try {
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
        const updatedTransaction = await BalanceTransaction.findOneAndUpdate(
          {
            invoiceId: body.invoiceId,
          },
          payload,
          { new: true }
        );

        if (!updatedTransaction) {
          throw new Error("Transaksi tidak ditemukan");
        }

        logController.createLog({
          createdAt: dateISOString,
          title: "Update Balance Transaction",
          note: body.note ? body.note : "",
          type: "balanceTransaction",
          from: body.transactionId,
          by: userByToken._id,
          data: body.data,
        });

        return {
          error: false,
          data: updatedTransaction,
          message: successMessages.DATA_SUCCESS_UPDATED,
        };
      } else {
        return Promise.reject(payload);
      }
    } catch (error) {
      logger.error("Error updating balance transaction:", error);
      // Handle error dengan tepat
      // Kirim response error
    }
  },

  // Metode untuk top-up menggunakan DOKU
  topUp: async (req, res) => {
    try {
      const { error: validationError } = topUpSchema.validate(req.body);
      if (validationError) {
        return res
          .status(400)
          .json({ message: validationError.details[0].message });
      }

      const { amount, customerName, email, phoneNumber, paymentMethod } =
        req.body;
      const invoiceNumber = `TOPUP-${Date.now()}`;

      const paymentResponse = await paymentGatewayController.requestPaymentDOKU(
        {
          amount,
          invoiceNumber,
          customerName,
          email,
          phoneNumber,
          paymentMethod,
        }
      );

      // Ambil data user dari token
      const userByToken = await User.findOne({
        "auth.accessToken": req.headers.authorization.split(" ")[1],
      });

      const payload = {
        userId: userByToken._id,
        invoiceId: paymentResponse.order.invoice_number,
        status: paymentResponse.order.transaction_status,
        amount: amount,
        fee: paymentResponse.order.fee,
        paymentMethod: paymentResponse.order.payment_channel,
        tag: "in",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = await new BalanceTransaction(payload).save();

      logController.createLog({
        createdAt: new Date().toISOString(),
        title: "Create Balance Transaction",
        note: "Top Up Balance",
        type: "balanceTransaction",
        from: result._id,
        by: userByToken._id,
        data: result,
      });

      // Update balance user
      await userController.updateUser({
        body: {
          userId: userByToken._id,
          data: {
            balance: userByToken.balance + amount,
          },
        },
      });

      logger.info(
        `Request pembayaran DOKU berhasil. Invoice: ${invoiceNumber}`,
        { user: req.user._id }
      );
      res.status(200).json({
        paymentUrl: paymentResponse.payment_url,
        message: "Request pembayaran berhasil dibuat.",
      });
    } catch (error) {
      logger.error("Error processing top-up:", error);
      res.status(500).json({
        message: "Gagal memproses top-up",
        error: error.message,
      });
    }
  },

  // Endpoint untuk menerima notifikasi dari DOKU
  handleDokuNotification: async (req, res) => {
    try {
      if (!(await verifyDokuNotification(req))) {
        logger.error("Invalid DOKU notification signature", {
          requestBody: req.body,
        });
        return res.status(400).send("STOP");
      }

      const transactionData = extractTransactionData(req);
      await updateBalanceTransaction(transactionData);

      res.status(200).send("CONTINUE");
    } catch (error) {
      logger.error("Error handling DOKU notification:", error);
      res.status(500).send("FAILED");
    }
  },
};

// Fungsi untuk verifikasi notifikasi dari DOKU
async function verifyDokuNotification(req) {
  try {
    const serverKey = config.doku.serverKey;
    const requestBody = JSON.stringify(req.body);
    const words = `${requestBody}${serverKey}`;
    const expectedSignature = crypto
      .createHash("sha1")
      .update(words)
      .digest("hex");

    return (
      req.headers["x-doku-signature"].toLowerCase() ===
      expectedSignature.toLowerCase()
    );
  } catch (error) {
    logger.error("Error verifying DOKU notification:", error);
    return false;
  }
}

// Fungsi untuk mengambil data transaksi dari request body DOKU
function extractTransactionData(req) {
  const {
    order: { invoice_number, amount, transaction_status, payment_channel },
  } = req.body;

  return {
    invoiceNumber: invoice_number,
    transactionStatus: transaction_status,
    amount: amount,
    paymentMethod: payment_channel,
  };
}
