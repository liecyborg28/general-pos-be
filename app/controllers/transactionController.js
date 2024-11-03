// models
const Business = require("../models/businessModel");
const Component = require("../models/componentModel");
const Charge = require("../models/chargeModel");
const Customer = require("../models/customerModel");
const Outlet = require("../models/outletModel");
const PaymentMethod = require("../models/paymentMethodModel");
const Product = require("../models/productModel");
const Promotion = require("../models/promotionModel");
const ServiceMethod = require("../models/serviceMethodModel");
const Tax = require("../models/taxModel");
const Transaction = require("../models/transactionModel");
const User = require("../models/userModel");

// controllers
const componentController = require("./componentController");
const dataController = require("./utils/dataController");
const formatController = require("./utils/formatController");
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

// function getDateWithOffset(date = new Date()) {
//   const offset = -date.getTimezoneOffset();
//   const sign = offset >= 0 ? "+" : "-";
//   const hours = String(Math.floor(Math.abs(offset) / 60)).padStart(2, "0");
//   const minutes = String(Math.abs(offset) % 60).padStart(2, "0");

//   return date.toISOString().slice(0, -1) + sign + hours + ":" + minutes;
// }

module.exports = {
  create: async (req) => {
    const body = req.body;

    let dateISOString = new Date().toISOString();

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
      outletId: body.outletId,
      paymentMethodId: body.paymentMethodId,
      promotions: body.promotions,
      serviceMethodId: body.serviceMethodId,
      status: body.status,
      taxes: body.taxes,
      tips: body.tips,
      userId: body.userId,
      request: generateRequestCodes(),
      createdAt: dateISOString,
      updatedAt: dateISOString,
    };

    const transaction = await Transaction.create(payload);

    return {
      error: false,
      message: successMessages.TRANSACTION_CREATED_SUCCESS,
      data: transaction,
    };
  },

  get: async (req) => {
    let dateISOString = new Date().toISOString();

    let pageKey = req.query.pageKey ? req.query.pageKey : 1;
    let pageSize = req.query.pageSize
      ? req.query.pageSize
      : 1 * 1000 * 1000 * 1000;

    let defaultFrom = formatController.convertToLocaleISOString(
      dateISOString,
      "start"
    );
    let defaultTo = formatController.convertToLocaleISOString(
      dateISOString,
      "end"
    );

    const isNotEveryQueryNull = () => {
      return req.query.from || req.query.to;
    };

    let pipeline = isNotEveryQueryNull()
      ? req.query.outletId
        ? {
            outletId: req.query.outletId,
            createdAt: {
              $gte: req.query.from
                ? formatController.convertToLocaleISOString(
                    new Date(req.query.from),
                    "start"
                  )
                : defaultFrom,
              $lte: req.query.to
                ? formatController.convertToLocaleISOString(
                    new Date(req.query.to),
                    "end"
                  )
                : defaultTo,
            },
          }
        : {
            createdAt: {
              $gte: req.query.from
                ? formatController.convertToLocaleISOString(
                    new Date(req.query.from),
                    "start"
                  )
                : defaultFrom,
              $lte: req.query.to
                ? formatController.convertToLocaleISOString(
                    new Date(req.query.to),
                    "end"
                  )
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

    try {
      // Fetch data transaksi berdasarkan periode
      const transactions = await pageController.paginate(
        pageKey,
        pageSize,
        pipeline,
        Transaction,
        -1
      );

      // Loop untuk melakukan populate pada setiap transaksi
      for (const transaction of transactions.data) {
        // Populate businessId, userId, customerId, outletId, serviceMethodId, dan paymentMethodId
        transaction.businessId = await dataController.populateFieldById(
          Business,
          transaction.businessId
        );
        transaction.userId = await dataController.populateFieldById(
          User,
          transaction.userId
        );
        transaction.customerId = await dataController.populateFieldById(
          Customer,
          transaction.customerId
        );
        transaction.outletId = await dataController.populateFieldById(
          Outlet,
          transaction.outletId
        );
        transaction.serviceMethodId = await dataController.populateFieldById(
          ServiceMethod,
          transaction.serviceMethodId
        );
        transaction.paymentMethodId = await dataController.populateFieldById(
          PaymentMethod,
          transaction.paymentMethodId
        );

        // Populate charges
        for (const charge of transaction.charges) {
          charge.chargeId = await dataController.populateFieldById(
            Charge,
            charge.chargeId
          );
        }

        // Populate promotions
        for (const promotion of transaction.promotions) {
          promotion.promotionId = await dataController.populateFieldById(
            Promotion,
            promotion.promotionId
          );
        }

        // Populate taxes
        for (const tax of transaction.taxes) {
          tax.taxId = await dataController.populateFieldById(Tax, tax.taxId);
        }

        // Populate componentId di dalam details
        for (const detail of transaction.details) {
          for (const component of detail.components) {
            component.componentId = await dataController.populateFieldById(
              Component,
              component.componentId
            );
          }
          // Jika ada additionals yang memiliki components, populate juga componentId di dalam additionals
          for (const additional of detail.additionals || []) {
            for (const component of additional.components) {
              component.componentId = await dataController.populateFieldById(
                Component,
                component.componentId
              );
            }
          }
        }
      }

      return {
        error: false,
        data: transactions.data,
        count: transactions.count,
      };
    } catch (err) {
      return { error: true, message: err.message || "Unknown error" };
    }
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
