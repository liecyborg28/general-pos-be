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
const dataController = require("./utils/dataController");
const formatController = require("./utils/formatController");
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

    // Inisialisasi objek untuk menyimpan total kebutuhan atau pengembalian setiap komponen
    const componentAdjustments = {};

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

      // Cek apakah transaksi adalah retur berdasarkan status pesanan
      const isReturnTransaction =
        body.status && body.status.order === "returned";

      // Jika bukan retur, cek qty produk untuk transaksi reguler
      if (!isReturnTransaction) {
        if (product.countable && product.qty < detail.qty) {
          return {
            error: true,
            message: {
              id: `Persediaan untuk produk ${product.name} tidak mencukupi.`,
            },
            data: { productId: detail.productId, availableQty: product.qty },
          };
        }
      }

      // Proses komponen berdasarkan jenis transaksi (penambahan atau pengurangan qty komponen)
      for (const componentDetail of [
        ...detail.components,
        ...detail.additionals.flatMap((a) => a.components),
      ]) {
        const componentId = componentDetail.componentId;
        const adjustedQty = componentDetail.qty * detail.qty;

        // Tambahkan qty jika transaksi retur, kurangi qty jika transaksi biasa
        if (componentAdjustments[componentId]) {
          componentAdjustments[componentId] += isReturnTransaction
            ? adjustedQty
            : -adjustedQty;
        } else {
          componentAdjustments[componentId] = isReturnTransaction
            ? adjustedQty
            : -adjustedQty;
        }
      }

      // Kurangi qty produk untuk transaksi reguler, atau tambahkan qty untuk retur
      if (product.countable) {
        product.qty += isReturnTransaction ? detail.qty : -detail.qty;
        await product.save();
      }
    }

    // Lakukan penyesuaian qty pada setiap komponen berdasarkan kebutuhan
    for (const [componentId, qtyAdjustment] of Object.entries(
      componentAdjustments
    )) {
      const component = await Component.findById(componentId);

      if (!component) {
        return {
          error: true,
          message: { id: `Komponen dengan ID ${componentId} tidak ditemukan.` },
          data: { componentId },
        };
      }

      component.qty.current += qtyAdjustment;
      await component.save();
    }

    // Siapkan payload untuk pembuatan transaksi
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

    // Simpan transaksi baru
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

    const { transactionId, data } = req.body;
    if (!transactionId) {
      return Promise.reject({
        error: true,
        message: errorMessages.INVALID_DATA,
      });
    }

    data["changedBy"] = userByToken._id;
    data["updatedAt"] = dateISOString;

    try {
      // Dapatkan transaksi yang akan diupdate
      const transaction = await Transaction.findById(transactionId);
      if (!transaction) {
        return { error: true, message: errorMessages.TRANSACTION_NOT_FOUND };
      }

      // Jika status order adalah "canceled"
      if (data.status.order === "canceled") {
        // Loop setiap detail produk untuk mengembalikan qty setiap komponen terkait
        for (const detail of transaction.details) {
          // Temukan produk
          const product = await Product.findById(detail.productId);

          if (product && product.countable) {
            // Tambahkan kembali qty produk
            product.qty += detail.qty;
            await product.save();
          }

          // Loop komponen utama dan tambahan
          for (const componentDetail of [
            ...detail.components,
            ...detail.additionals.flatMap(
              (additional) => additional.components
            ),
          ]) {
            const component = await Component.findById(
              componentDetail.componentId
            );
            if (component) {
              // Tambahkan kembali qty.current dari komponen
              component.qty.current += componentDetail.qty * detail.qty;
              await component.save();
            }
          }
        }
      }

      // Update transaksi dengan data baru
      const updatedTransaction = await Transaction.findByIdAndUpdate(
        transactionId,
        data,
        { new: true }
      );

      return {
        error: false,
        data: updatedTransaction,
        message: successMessages.DATA_SUCCESS_UPDATED,
      };
    } catch (err) {
      return { error: true, message: err.message || "Unknown error" };
    }
  },
};
