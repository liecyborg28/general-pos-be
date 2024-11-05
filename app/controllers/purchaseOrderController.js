// models
const Business = require("../models/businessModel");
const Component = require("../models/componentModel");
const PaymentMethod = require("../models/paymentMethodModel");
const PurchaseOrder = require("../models/purchaseOrderModel");
const Tax = require("../models/taxModel");
const User = require("../models/userModel");

// controllers
const dataController = require("./utils/dataController");
const formatController = require("./utils/formatController");
const pageController = require("./utils/pageController");

// messages
const errorMessages = require("../repository/messages/errorMessages");
const successMessages = require("../repository/messages/successMessages");

module.exports = {
  create: async (req) => {
    let dateISOString = new Date().toISOString();

    const {
      amount,
      businessId,
      details,
      paymentMethodId,
      status,
      supplierId,
      taxes,
      userId,
    } = req.body;

    try {
      // Membuat instance PurchaseOrder
      const purchaseOrder = new PurchaseOrder({
        amount,
        businessId,
        details,
        paymentMethodId,
        status,
        supplierId,
        taxes,
        userId,
        createdAt: dateISOString,
        updatedAt: dateISOString,
      });

      // Simpan purchase order ke database
      const savedOrder = await purchaseOrder.save();

      // Update qty pada setiap component berdasarkan status order
      if (status.order === "completed" || status.order === "returned") {
        // Loop melalui setiap detail untuk update component terkait
        for (const item of details) {
          const component = await Component.findById(item.componentId);

          if (component) {
            // Tentukan perubahan qty: tambah jika "completed", kurangi jika "returned"
            const qtyChange =
              status.order === "completed" ? item.qty : -item.qty;
            component.qty.current += qtyChange;

            // Simpan perubahan pada component
            await component.save();
          }
        }
      }

      return {
        error: false,
        message: successMessages.PURCHASE_ORDER_SUCCESS,
        data: savedOrder,
      };
    } catch (error) {
      return {
        error: true,
        message: error.message,
      };
    }
  },

  get: async (req) => {
    let dateISOString = new Date().toISOString();

    let pageKey = req.query.pageKey || 1;
    let pageSize = req.query.pageSize || 1000;

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
      ? req.query.businessId
        ? {
            businessId: req.query.businessId,
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
      : req.query.businessId
      ? {
          businessId: req.query.businessId,
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
      // Fetch data purchase order berdasarkan periode
      const purchaseOrders = await pageController.paginate(
        pageKey,
        pageSize,
        pipeline,
        PurchaseOrder,
        -1
      );

      // Loop untuk melakukan populate pada setiap purchase order
      for (const order of purchaseOrders.data) {
        // Populate businessId, userId, supplierId, dan paymentMethodId
        order.businessId = await dataController.populateFieldById(
          Business,
          order.businessId
        );
        order.userId = await dataController.populateFieldById(
          User,
          order.userId
        );
        order.supplierId = await dataController.populateFieldById(
          Supplier,
          order.supplierId
        );
        order.paymentMethodId = await dataController.populateFieldById(
          PaymentMethod,
          order.paymentMethodId
        );

        // Populate taxes
        for (const tax of order.taxes || []) {
          tax.taxId = await dataController.populateFieldById(Tax, tax.taxId);
        }

        // Populate componentId di dalam details
        for (const detail of order.details || []) {
          detail.componentId = await dataController.populateFieldById(
            Component,
            detail.componentId
          );
        }
      }

      return {
        error: false,
        data: purchaseOrders.data,
        count: purchaseOrders.count,
      };
    } catch (err) {
      return { error: true, message: err.message || "Unknown error" };
    }
  },

  update: async (req) => {
    let dateISOString = new Date().toISOString();

    const bearerHeader = req.headers["authorization"];
    const bearerToken = bearerHeader.split(" ")[1];

    // Dapatkan user berdasarkan token yang disediakan
    let userByToken = await User.findOne({
      "auth.accessToken": bearerToken,
    });

    let body = req.body;

    // Validasi apakah ada purchaseOrderId
    if (!body.purchaseOrderId) {
      return Promise.reject({
        error: true,
        message: errorMessages.INVALID_DATA,
      });
    } else {
      // Tambahkan informasi siapa yang melakukan perubahan dan waktu perubahannya
      body.data["changedBy"] = userByToken._id;
      body.data["updatedAt"] = dateISOString;

      return new Promise(async (resolve, reject) => {
        try {
          // Jika status order diubah menjadi 'canceled', maka perbarui data purchase order
          if (body.data.status.order === "canceled") {
            const updatedPurchaseOrder = await PurchaseOrder.findByIdAndUpdate(
              body.purchaseOrderId,
              body.data,
              { new: true }
            );

            resolve({
              error: false,
              data: updatedPurchaseOrder,
              message: successMessages.DATA_SUCCESS_UPDATED,
            });
          } else {
            // Tambahkan logika lain untuk status order selain 'canceled', jika diperlukan
            const updatedPurchaseOrder = await PurchaseOrder.findByIdAndUpdate(
              body.purchaseOrderId,
              body.data,
              { new: true }
            );

            resolve({
              error: false,
              data: updatedPurchaseOrder,
              message: successMessages.DATA_SUCCESS_UPDATED,
            });
          }
        } catch (err) {
          reject({ error: true, message: err.message || "Unknown error" });
        }
      });
    }
  },
};
