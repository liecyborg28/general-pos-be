const outletResource = require("../repository/resources/outletResource");
const itemResource = require("../repository/resources/productResource");
const transactionResource = require("../repository/resources/transactionResource");
const inventoryResource = require("../repository/resources/inventoryResource");

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

  getInventoryResource: () => {
    return new Promise((resolve, reject) => {
      resolve({
        error: false,
        data: inventoryResource,
      });
    });
  },
};
