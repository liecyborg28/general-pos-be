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
};
