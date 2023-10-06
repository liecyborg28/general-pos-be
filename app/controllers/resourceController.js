const itemResource = require("../repository/resources/itemResource");
const transactionResource = require("../repository/resources/transactionResource");

module.exports = {
  getTransactionResource: () => {
    return new Promise((resolve, reject) => {
      resolve({
        error: false,
        data: transactionResource,
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
};
