const User = require("../models/userModel");
const Item = require("../models/itemModel");
const Inventory = require("../models/inventoryModel");
const Transaction = require("../models/transactionModel");
const pageController = require("./utils/pageController");
const itemController = require("./itemController");
const userController = require("./userController");
const inventoryController = require("./inventoryController");
const errorMessages = require("../repository/messages/errorMessages");
const successMessages = require("../repository/messages/successMessages");
const logController = require("./logController");

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

    if (isBodyValid()) {
      // Logic saat ingin request transaksi ke payment gateway sampai berhasil simpan di sini

      // update user balance
      userController.updateUser({
        body: {
          userId: userByToken._id,
          data: {
            balance: userByToken.balance + body.balance,
          },
        },
      });
    } else {
      return Promise.reject(payload);
    }
  },
};
