function formatCurrency(
  amount,
  decimal = ",",
  separator = ".",
  symbol = "Rp",
  totalDecimal = 2
) {
  // Pastikan jumlah angka desimal tidak negatif
  if (totalDecimal < 0) totalDecimal = 0;

  // Pisahkan bagian desimal dari angka
  const parts = amount.toFixed(totalDecimal).split(".");

  // Format bagian ribuan dengan pemisah
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, separator);

  // Gabungkan simbol dan bagian desimal
  return `${symbol} ${parts.join(decimal)}`;
}

// models
const Currency = require("../models/currencyModel");
const User = require("../models/userModel");

// controllers
const dataController = require("./utils/dataController");
const pageController = require("./utils/pageController");

// repositories
const errorMessages = require("../repository/messages/errorMessages");
const successMessages = require("../repository/messages/successMessages");

module.exports = {
  create: async (req) => {
    let body = req.body;
    let dateISOString = new Date().toISOString();
    const bearerHeader = req.headers["authorization"];
    const bearerToken = bearerHeader.split(" ")[1];

    let userByToken = await User.findOne({
      "auth.accessToken": bearerToken,
    });

    let isBodyValid = () => {
      return (
        body.businessId &&
        body.decimal &&
        body.name &&
        body.separator &&
        body.status &&
        body.symbol &&
        body.totalDecimal
      );
    };

    let payload = isBodyValid()
      ? {
          businessId: body.businessId,
          decimal: body.decimal,
          name: body.name,
          separator: body.separator,
          status: body.status,
          symbol: body.symbol,
          totalDecimal: body.totalDecimal,
          createdAt: dateISOString,
          updatedAt: dateISOString,
        }
      : {
          error: true,
          message: errorMessages.INVALID_DATA,
        };

    if (isBodyValid()) {
      let nameIsExist = await dataController.isExist(
        {
          businessId: body.businessId,
          name: body.name,
          status: { $ne: "deleted" },
        },
        Currency
      );

      if (nameIsExist) {
        return Promise.reject({
          error: true,
          message: errorMessages.NAME_ALREADY_EXISTS,
        });
      }

      return new Promise((resolve, reject) => {
        new Currency(payload)
          .save()
          .then((result) => {
            resolve({
              error: false,
              data: result,
              message: successMessages.CURRENCY_CREATED_SUCCESS,
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

  get: (req) => {
    let { businessId } = req.query;
    let pageKey = req.query.pageKey ? req.query.pageKey : 1;
    let pageSize = req.query.pageSize ? req.query.pageSize : null;

    return new Promise((resolve, reject) => {
      let pipeline = {
        status: { $ne: "deleted" },
      };

      if (businessId) {
        pipeline.businessId = businessId;
      }

      pageController
        .paginate(pageKey, pageSize, pipeline, Currency)
        .then((currencies) => {
          resolve({
            error: false,
            data: currencies.data,
            count: currencies.count,
          });
        })
        .catch((err) => {
          reject({ error: true, message: err });
        });
    });
  },

  update: async (req) => {
    let body = req.body;
    let dateISOString = new Date().toISOString();
    const bearerHeader = req.headers["authorization"];
    const bearerToken = bearerHeader.split(" ")[1];

    let userByToken = await User.findOne({
      "auth.accessToken": bearerToken,
    });

    if (!body.currencyId) {
      return Promise.reject({
        error: true,
        message: errorMessages.INVALID_DATA,
      });
    } else {
      body.data["updatedAt"] = dateISOString;
      return new Promise((resolve, reject) => {
        Currency.findByIdAndUpdate(body.currencyId, body.data, { new: true })
          .then((result) => {
            resolve({
              error: false,
              data: result,
              message: successMessages.DATA_SUCCESS_UPDATED,
            });
          })
          .catch((err) => {
            reject({ error: true, message: err });
          });
      });
    }
  },
};
