const outletResource = require("../repository/resources/outletResource");
const itemResource = require("../repository/resources/itemResource");
const transactionResource = require("../repository/resources/transactionResource");

module.exports = {
  getOutletResource: () => {
    return new Promise((resolve, reject) => {
      resolve({
        error: false,
        data: outletResource,
      });
    });
  },

  getItemResource: () => {
    return new Promise((resolve, reject) => {
      resolve({
        error: false,
        data: itemResource,
      });
    });
  },

  getTransactionResource: () => {
    return new Promise((resolve, reject) => {
      resolve({
        error: false,
        data: transactionResource,
      });
    });
  },
};
