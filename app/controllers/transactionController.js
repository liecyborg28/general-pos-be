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
const slackController = require("./utils/slackController");

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
    const body = req.body;

    if (!Array.isArray(body.details) || body.details.length === 0) {
      throw new Error("Data detail transaksi tidak valid.");
    }

    for (const detail of body.details) {
      const product = await Product.findById(detail.productId);

      if (!product) {
        return {
          error: true,
          message: {
            id: `Produk dengan ID ${detail.productId} tidak ditemukan.`,
          },
          data: { productId: detail.productId },
        };
      }

      // 1. Cek qty produk
      if (product.countable && product.qty < detail.qty) {
        return {
          error: true,
          message: {
            id: `Persediaan untuk produk ${product.name} tidak mencukupi.`,
          },
          data: { productId: detail.productId, availableQty: product.qty },
        };
      }

      // 2. Cek qty setiap komponen dalam `components` dan `additionals`
      for (const componentDetail of [
        ...detail.components,
        ...detail.additionals.flatMap((a) => a.components),
      ]) {
        const component = await Component.findById(componentDetail.componentId);

        if (!component) {
          return {
            error: true,
            message: {
              id: `Komponen dengan ID ${componentDetail.componentId} tidak ditemukan.`,
            },
            data: { componentId: componentDetail.componentId },
          };
        }

        // Hitung total qty yang dibutuhkan untuk komponen ini
        const totalQtyNeeded = componentDetail.qty * detail.qty;

        if (component.qty.current < totalQtyNeeded) {
          return {
            error: true,
            message: { id: `Bahan baku untuk ${product.name} tidak mencukupi` },
            data: {
              componentId: componentDetail.componentId,
              requiredQty: totalQtyNeeded,
              availableQty: component.qty.current,
            },
          };
        }
      }

      // Jika semua pengecekan qty produk dan komponen mencukupi, lanjutkan update qty
      if (product.countable) {
        product.qty -= detail.qty;
        await product.save();
      }

      for (const componentDetail of [
        ...detail.components,
        ...detail.additionals.flatMap((a) => a.components),
      ]) {
        const component = await Component.findById(componentDetail.componentId);
        component.qty.current -= componentDetail.qty * detail.qty;
        await component.save();
      }
    }

    const payload = {
      amount: body.amount,
      businessId: body.businessId,
      customerId: body.customerId,
      details: body.details,
      charges: body.charges,
      promotions: body.promotions,
      status: body.status,
      taxes: body.taxes,
      tips: body.tips,
      userId: body.userId,
      request: generateRequestCodes(),
      createdAt: getDateWithOffset(new Date()),
      updatedAt: getDateWithOffset(new Date()),
    };

    const transaction = await Transaction.create(payload);

    return {
      error: false,
      message: successMessages.TRANSACTION_CREATED_SUCCESS,
      data: transaction,
    };
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
      body.data["changedBy"] = userByToken._id;
      body.data["updatedAt"] = dateISOString;

      return new Promise(async (resolve, reject) => {
        if (body.data.status.order === "canceled") {
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
          resolve({
            error: false,
            data: data,
            count: data.count,
          });
        }
      });
    }
  },
};
