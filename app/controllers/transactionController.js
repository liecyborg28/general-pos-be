// models
const Component = require("../models/componentModel");
const PaymentMethod = require("../models/paymentMethodModel");
const Product = require("../models/productModel");
const ServiceMethod = require("../models/serviceMethodModel");
const Transaction = require("../models/transactionModel");
const User = require("../models/userModel");

// controllers
const componentController = require("./componentController");
const pageController = require("./utils/pageController");

// messages
const errorMessages = require("../repository/messages/errorMessages");
const successMessages = require("../repository/messages/successMessages");

function generateRequestCodes() {
  const viewCode = Math.floor(100000 + Math.random() * 900000);

  let valueCode = viewCode + 123456;

  valueCode = valueCode % 1000000;

  const reversedValueCode = parseInt(
    valueCode.toString().split("").reverse().join("")
  );

  return { status: "initial", viewCode, valueCode: reversedValueCode };
}

function getDateWithOffset(date = new Date()) {
  const offset = -date.getTimezoneOffset();
  const sign = offset >= 0 ? "+" : "-";
  const hours = String(Math.floor(Math.abs(offset) / 60)).padStart(2, "0");
  const minutes = String(Math.abs(offset) % 60).padStart(2, "0");

  return date.toISOString().slice(0, -1) + sign + hours + ":" + minutes;
}

function convertToLocaleISOString(date, type) {
  if (type !== "start" && type !== "end") {
    throw new Error('Parameter "type" harus "start" atau "end"');
  }

  // Format bagian tanggal (tanpa timezone) dari input date
  const [year, month, day] = date.slice(0, 10).split("-");

  // Menentukan waktu berdasarkan type
  const time = type === "start" ? "00:00:00.000" : "23:59:59.999";

  // Menambahkan offset dari date input
  const offset = date.slice(19);

  // Menghasilkan string ISO dengan offset yang sudah didapat
  // return `${year}-${month}-${day}T${time}${offset}`;
  return `${year}-${month}-${day}T${time}`;
}

module.exports = {
  create: async (req) => {
    const { body } = req;
    const { order, payment } = body.status;
    const isStockDecrease =
      (order === "queued" || order === "completed") && payment === "completed";
    const isStockIncrease = order === "returned" && payment === "completed";
    const outOfStocks = [];

    // Validasi body
    const isBodyValid =
      body.amount !== null &&
      body.businessId &&
      body.charges &&
      body.date &&
      body.details &&
      body.paymentMethodId &&
      body.promotions &&
      body.outletId &&
      body.taxes &&
      body.tips &&
      body.userId &&
      body.status &&
      body.serviceMethodId;

    if (!isBodyValid) {
      return { error: true, message: errorMessages.INVALID_DATA };
    }

    // Gabung komponen dan additionals, lalu cek stoknya
    const componentsList = body.details.flatMap(
      ({ productId, components, additionals = [] }) =>
        [...components, ...additionals.flatMap((a) => a.components)].map(
          (c) => ({ ...c, productId })
        )
    );

    for (const { componentId, qty, productId } of componentsList) {
      const componentData = await Component.findById(componentId);
      const currentStock = componentData?.qty.current || 0;

      if (currentStock < qty) {
        outOfStocks.push({
          productName: productId,
          componentName: componentData?.name || "Unknown",
          requiredQty: qty,
          availableQty: currentStock,
        });
      } else if (isStockDecrease || isStockIncrease) {
        // Update stok
        componentData.qty.current += isStockIncrease ? qty : -qty;

        // Update status stok
        if (componentData.qty.current <= 0) {
          componentData.qty.status = "outOfStock";
        } else if (componentData.qty.current <= componentData.qty.min) {
          componentData.qty.status = "almostOut";
        } else {
          componentData.qty.status = "available";
        }

        await componentData.save();
      }
    }

    // Return error jika ada out of stock
    if (outOfStocks.length) {
      return {
        error: true,
        message: {
          id: `Bahan baku untuk ${outOfStocks[0].productName} tidak mencukupi`,
        },
        data: outOfStocks,
      };
    }

    try {
      const payload = {
        ...body,
        request: generateRequestCodes(),
        createdAt: body.date,
        updatedAt: body.date,
      };
      const transaction = await Transaction.create(payload);
      return { error: false, data: transaction };
    } catch (err) {
      return { error: true, message: err };
    }
  },

  get: (req) => {
    let pageKey = req.query.pageKey ? req.query.pageKey : 1;
    let pageSize = req.query.pageSize ? req.query.pageSize : null;

    isNotEveryQueryNull = () => {
      return (
        req.query.businessId ||
        req.query.createdAt ||
        req.query.outletId ||
        req.query.userId
      );
    };

    return new Promise((resolve, reject) => {
      let pipeline = isNotEveryQueryNull()
        ? {
            $or: [
              {
                businessId: req.query.businessId ? req.query.businessId : null,
              },
              {
                createdAt: req.query.createdAt ? req.query.createdAt : null,
              },
              {
                outletId: req.query.outletId ? req.query.outletId : null,
              },
              {
                userId: req.query.userId ? req.query.userId : null,
              },
            ],
          }
        : {};

      pageController
        .paginate(pageKey, pageSize, pipeline, Transaction)
        .then((transactions) => {
          Transaction.populate(transactions.data, {
            path: "businessId outletId userId details.productId",
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

  getByPeriod: (req) => {
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
      let pipeline = isNotEveryQueryNull()
        ? req.query.outletId
          ? {
              outletId: req.query.outletId,
              createdAt: {
                $gte: req.query.from
                  ? convertToLocaleISOString(new Date(req.query.from), "start")
                  : defaultFrom,
                $lte: req.query.to
                  ? convertToLocaleISOString(new Date(req.query.to), "end")
                  : defaultTo,
              },
            }
          : {
              createdAt: {
                $gte: req.query.from
                  ? convertToLocaleISOString(new Date(req.query.from), "start")
                  : defaultFrom,
                $lte: req.query.to
                  ? convertToLocaleISOString(new Date(req.query.to), "end")
                  : defaultTo,
              },
            }
        : req.query.outletId
        ? {
            outletId: req.query.outletId,
            createdAt: {
              $gte: defaultFrom,
              $lte: defaultTo,
            },
          }
        : {
            createdAt: {
              $gte: defaultFrom,
              $lte: defaultTo,
            },
          };

      pageController
        .paginate(pageKey, pageSize, pipeline, Transaction, -1)
        .then((transactions) => {
          Transaction.populate(transactions.data, {
            path: "businessId outletId userId details.productId",
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

  update: async (req) => {
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
      body.data["updatedAt"] = dateISOString;
      body.data["changedBy"] = userByToken._id;
      return new Promise(async (resolve, reject) => {
        Transaction.findByIdAndUpdate(body.transactionId, body.data, {
          new: true,
        })
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
