const ExcelJS = require("exceljs");

// models
const Product = require("../models/productModel");
const Transaction = require("../models/transactionModel");

// controllers
const dataController = require("./utils/dataController");
const excelController = require("./utils/excelController");
const formatController = require("./utils/formatController");
const pageController = require("./utils/pageController");
const productController = require("./productController");
const productResource = require("../repository/resources/productResource");
const transactionResource = require("../repository/resources/transactionResource");

// repositories
const errorMessages = require("../repository/messages/errorMessages");
const successMessages = require("../repository/messages/successMessages");

module.exports = {
  generateSalesReportByOutlet: async (req) => {
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
      return req.query.from || req.query.to || req.query.userId;
    };

    let pipeline = isNotEveryQueryNull()
      ? req.query.userId
        ? {
            userId: req.query.userId,
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
            ...(req.query.outletId && { outletId: req.query.outletId }),
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
            ...(req.query.outletId && { outletId: req.query.outletId }),
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
      let transactions = await pageController.paginate(
        pageKey,
        pageSize,
        pipeline,
        Transaction,
        -1
      );

      transactions = await Transaction.populate(transactions.data, {
        path: "outletId",
      });

      const report = transactions.reduce((result, transaction) => {
        const outletId = transaction.outletId.toString();

        if (!result[outletId]) {
          result[outletId] = {
            outletId: transaction.outletId,
            total: {
              cost: 0,
              revenue: 0,
              grossProfit: 0,
              tax: 0,
              charge: 0,
              tip: 0,
              netIncome: 0,
            },
          };
        }

        // Menghitung totalCost
        const totalCost =
          transaction.details?.reduce((costAcc, detail) => {
            const detailCost = (detail.cost || 0) * (detail.qty || 0);
            const additionalCost =
              detail.additionals?.reduce((addAcc, additional) => {
                return addAcc + (additional.cost || 0) * (additional.qty || 0);
              }, 0) || 0;

            return costAcc + detailCost + additionalCost;
          }, 0) || 0;

        // Menghitung totalRevenue
        const totalRevenue =
          transaction.details?.reduce((revenueAcc, detail) => {
            const detailRevenue = (detail.price || 0) * (detail.qty || 0);
            const additionalRevenue =
              detail.additionals?.reduce((addAcc, additional) => {
                return addAcc + (additional.price || 0) * (additional.qty || 0);
              }, 0) || 0;

            return revenueAcc + detailRevenue + additionalRevenue;
          }, 0) || 0;

        const grossProfit = totalRevenue - totalCost;

        const totalTax =
          transaction.taxes?.reduce((taxAcc, tax) => {
            const taxAmount =
              tax.type === "persentage"
                ? totalRevenue * (tax.amount || 0)
                : tax.amount || 0;
            return taxAcc + taxAmount;
          }, 0) || 0;

        const totalCharge =
          transaction.charges?.reduce((chargeAcc, charge) => {
            const chargeAmount =
              charge.type === "persentage"
                ? totalRevenue * (charge.amount || 0)
                : charge.amount || 0;
            return chargeAcc + chargeAmount;
          }, 0) || 0;

        const totalTip =
          transaction.tips?.reduce(
            (tipAcc, tip) => tipAcc + (tip.amount || 0),
            0
          ) || 0;

        const netIncome = grossProfit - totalTax;

        // Tambahkan ke total berdasarkan outletId
        result[outletId].total.cost += totalCost;
        result[outletId].total.revenue += totalRevenue;
        result[outletId].total.grossProfit += grossProfit;
        result[outletId].total.tax += totalTax;
        result[outletId].total.charge += totalCharge;
        result[outletId].total.tip += totalTip;
        result[outletId].total.netIncome += netIncome;

        return result;
      }, {});

      const reportArray = Object.values(report);

      return { error: false, data: reportArray };
    } catch (error) {
      console.error(error);
      return { error: true, message: error.message };
    }
  },

  generateSalesReportByUser: async (req) => {
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
      let transactions = await pageController.paginate(
        pageKey,
        pageSize,
        pipeline,
        Transaction,
        -1
      );

      transactions = await Transaction.populate(transactions.data, {
        path: "userId",
      });

      const report = transactions.reduce((result, transaction) => {
        const userId = transaction.userId.toString();

        if (!result[userId]) {
          result[userId] = {
            userId: transaction.userId,
            total: {
              cost: 0,
              revenue: 0,
              grossProfit: 0,
              tax: 0,
              charge: 0,
              tip: 0,
              netIncome: 0,
            },
          };
        }

        // Menghitung totalCost
        const totalCost =
          transaction.details?.reduce((costAcc, detail) => {
            // Cost dari produk utama
            const detailCost = (detail.cost || 0) * (detail.qty || 0);

            // Cost dari produk tambahan di additionals
            const additionalCost =
              detail.additionals?.reduce((addAcc, additional) => {
                return addAcc + (additional.cost || 0) * (additional.qty || 0);
              }, 0) || 0;

            return costAcc + detailCost + additionalCost;
          }, 0) || 0;

        // Menghitung totalRevenue
        const totalRevenue =
          transaction.details?.reduce((revenueAcc, detail) => {
            // Revenue dari produk utama
            const detailRevenue = (detail.price || 0) * (detail.qty || 0);

            // Revenue dari produk tambahan di additionals
            const additionalRevenue =
              detail.additionals?.reduce((addAcc, additional) => {
                return addAcc + (additional.price || 0) * (additional.qty || 0);
              }, 0) || 0;

            return revenueAcc + detailRevenue + additionalRevenue;
          }, 0) || 0;

        const grossProfit = totalRevenue - totalCost;

        const totalTax =
          transaction.taxes?.reduce((taxAcc, tax) => {
            const taxAmount =
              tax.type === "persentage"
                ? totalRevenue * (tax.amount || 0)
                : tax.amount || 0;
            return taxAcc + taxAmount;
          }, 0) || 0;

        const totalCharge =
          transaction.charges?.reduce((chargeAcc, charge) => {
            const chargeAmount =
              charge.type === "persentage"
                ? totalRevenue * (charge.amount || 0)
                : charge.amount || 0;
            return chargeAcc + chargeAmount;
          }, 0) || 0;

        const totalTip =
          transaction.tips?.reduce(
            (tipAcc, tip) => tipAcc + (tip.amount || 0),
            0
          ) || 0;

        const netIncome = grossProfit - totalTax;

        // Tambahkan ke total berdasarkan userId
        result[userId].total.cost += totalCost;
        result[userId].total.revenue += totalRevenue;
        result[userId].total.grossProfit += grossProfit;
        result[userId].total.tax += totalTax;
        result[userId].total.charge += totalCharge;
        result[userId].total.tip += totalTip;
        result[userId].total.netIncome += netIncome;

        return result;
      }, {});

      const reportArray = Object.values(report);

      return { error: false, data: reportArray };
    } catch (error) {
      console.error(error);
      return { error: true, message: error.message };
    }
  },

  generateSalesReportByTransaction: async (req) => {
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
      return req.query.from || req.query.to || req.query.userId;
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
            ...(req.query.userId && { userId: req.query.userId }),
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
            ...(req.query.userId && { userId: req.query.userId }),
          }
      : req.query.outletId
      ? {
          outletId: req.query.outletId,
          createdAt: {
            $gte: defaultFrom,
            $lte: defaultTo,
          },
          ...(req.query.userId && { userId: req.query.userId }),
        }
      : {
          createdAt: {
            $gte: defaultFrom,
            $lte: defaultTo,
          },
          ...(req.query.userId && { userId: req.query.userId }),
        };

    try {
      let transactions = await pageController.paginate(
        pageKey,
        pageSize,
        pipeline,
        Transaction,
        -1
      );

      transactions = await Transaction.populate(transactions.data, {
        path: "userId",
      });

      const report = transactions.map((transaction) => {
        const userId = transaction.userId.toString();

        // Menghitung totalCost
        const totalCost =
          transaction.details?.reduce((costAcc, detail) => {
            const detailCost = (detail.cost || 0) * (detail.qty || 0);
            const additionalCost =
              detail.additionals?.reduce((addAcc, additional) => {
                return addAcc + (additional.cost || 0) * (additional.qty || 0);
              }, 0) || 0;

            return costAcc + detailCost + additionalCost;
          }, 0) || 0;

        // Menghitung totalRevenue
        const totalRevenue =
          transaction.details?.reduce((revenueAcc, detail) => {
            const detailRevenue = (detail.price || 0) * (detail.qty || 0);
            const additionalRevenue =
              detail.additionals?.reduce((addAcc, additional) => {
                return addAcc + (additional.price || 0) * (additional.qty || 0);
              }, 0) || 0;

            return revenueAcc + detailRevenue + additionalRevenue;
          }, 0) || 0;

        const grossProfit = totalRevenue - totalCost;

        const totalTax =
          transaction.taxes?.reduce((taxAcc, tax) => {
            const taxAmount =
              tax.type === "persentage"
                ? totalRevenue * (tax.amount || 0)
                : tax.amount || 0;
            return taxAcc + taxAmount;
          }, 0) || 0;

        const totalCharge =
          transaction.charges?.reduce((chargeAcc, charge) => {
            const chargeAmount =
              charge.type === "persentage"
                ? totalRevenue * (charge.amount || 0)
                : charge.amount || 0;
            return chargeAcc + chargeAmount;
          }, 0) || 0;

        const totalTip =
          transaction.tips?.reduce(
            (tipAcc, tip) => tipAcc + (tip.amount || 0),
            0
          ) || 0;

        const netIncome = grossProfit - totalTax;

        // Laporan untuk setiap transaksi
        return {
          transactionId: transaction._id,
          userId: transaction.userId,
          total: {
            cost: totalCost,
            revenue: totalRevenue,
            grossProfit,
            tax: totalTax,
            charge: totalCharge,
            tip: totalTip,
            netIncome,
          },
        };
      });

      return { error: false, data: report };
    } catch (error) {
      console.error(error);
      return { error: true, message: error.message };
    }
  },

  generateSalesReportByPaymentMethod: async (req) => {
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
      return req.query.from || req.query.to || req.query.userId;
    };

    let pipeline = isNotEveryQueryNull()
      ? req.query.userId
        ? {
            userId: req.query.userId,
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
            ...(req.query.paymentMethodId && {
              paymentMethodId: req.query.paymentMethodId,
            }),
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
            ...(req.query.paymentMethodId && {
              paymentMethodId: req.query.paymentMethodId,
            }),
          }
      : req.query.paymentMethodId
      ? {
          paymentMethodId: req.query.paymentMethodId,
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
      let transactions = await pageController.paginate(
        pageKey,
        pageSize,
        pipeline,
        Transaction,
        -1
      );

      transactions = await Transaction.populate(transactions.data, {
        path: "paymentMethodId",
      });

      const report = transactions.reduce((result, transaction) => {
        const paymentMethodId = transaction.paymentMethodId.toString();

        if (!result[paymentMethodId]) {
          result[paymentMethodId] = {
            paymentMethodId: transaction.paymentMethodId,
            total: {
              cost: 0,
              revenue: 0,
              grossProfit: 0,
              tax: 0,
              charge: 0,
              tip: 0,
              netIncome: 0,
            },
          };
        }

        // Menghitung totalCost
        const totalCost =
          transaction.details?.reduce((costAcc, detail) => {
            const detailCost = (detail.cost || 0) * (detail.qty || 0);
            const additionalCost =
              detail.additionals?.reduce((addAcc, additional) => {
                return addAcc + (additional.cost || 0) * (additional.qty || 0);
              }, 0) || 0;

            return costAcc + detailCost + additionalCost;
          }, 0) || 0;

        // Menghitung totalRevenue
        const totalRevenue =
          transaction.details?.reduce((revenueAcc, detail) => {
            const detailRevenue = (detail.price || 0) * (detail.qty || 0);
            const additionalRevenue =
              detail.additionals?.reduce((addAcc, additional) => {
                return addAcc + (additional.price || 0) * (additional.qty || 0);
              }, 0) || 0;

            return revenueAcc + detailRevenue + additionalRevenue;
          }, 0) || 0;

        const grossProfit = totalRevenue - totalCost;

        const totalTax =
          transaction.taxes?.reduce((taxAcc, tax) => {
            const taxAmount =
              tax.type === "persentage"
                ? totalRevenue * (tax.amount || 0)
                : tax.amount || 0;
            return taxAcc + taxAmount;
          }, 0) || 0;

        const totalCharge =
          transaction.charges?.reduce((chargeAcc, charge) => {
            const chargeAmount =
              charge.type === "persentage"
                ? totalRevenue * (charge.amount || 0)
                : charge.amount || 0;
            return chargeAcc + chargeAmount;
          }, 0) || 0;

        const totalTip =
          transaction.tips?.reduce(
            (tipAcc, tip) => tipAcc + (tip.amount || 0),
            0
          ) || 0;

        const netIncome = grossProfit - totalTax;

        // Tambahkan ke total berdasarkan paymentMethodId
        result[paymentMethodId].total.cost += totalCost;
        result[paymentMethodId].total.revenue += totalRevenue;
        result[paymentMethodId].total.grossProfit += grossProfit;
        result[paymentMethodId].total.tax += totalTax;
        result[paymentMethodId].total.charge += totalCharge;
        result[paymentMethodId].total.tip += totalTip;
        result[paymentMethodId].total.netIncome += netIncome;

        return result;
      }, {});

      const reportArray = Object.values(report);

      return { error: false, data: reportArray };
    } catch (error) {
      console.error(error);
      return { error: true, message: error.message };
    }
  },

  generateSalesReportByServiceMethod: async (req) => {
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
      return req.query.from || req.query.to || req.query.userId;
    };

    let pipeline = isNotEveryQueryNull()
      ? req.query.userId
        ? {
            userId: req.query.userId,
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
            ...(req.query.serviceMethodId && {
              serviceMethodId: req.query.serviceMethodId,
            }),
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
            ...(req.query.serviceMethodId && {
              serviceMethodId: req.query.serviceMethodId,
            }),
          }
      : req.query.serviceMethodId
      ? {
          serviceMethodId: req.query.serviceMethodId,
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
      let transactions = await pageController.paginate(
        pageKey,
        pageSize,
        pipeline,
        Transaction,
        -1
      );

      transactions = await Transaction.populate(transactions.data, {
        path: "serviceMethodId",
      });

      const report = transactions.reduce((result, transaction) => {
        const serviceMethodId = transaction.serviceMethodId.toString();

        if (!result[serviceMethodId]) {
          result[serviceMethodId] = {
            serviceMethodId: transaction.serviceMethodId,
            total: {
              cost: 0,
              revenue: 0,
              grossProfit: 0,
              tax: 0,
              charge: 0,
              tip: 0,
              netIncome: 0,
            },
          };
        }

        // Menghitung totalCost
        const totalCost =
          transaction.details?.reduce((costAcc, detail) => {
            const detailCost = (detail.cost || 0) * (detail.qty || 0);
            const additionalCost =
              detail.additionals?.reduce((addAcc, additional) => {
                return addAcc + (additional.cost || 0) * (additional.qty || 0);
              }, 0) || 0;

            return costAcc + detailCost + additionalCost;
          }, 0) || 0;

        // Menghitung totalRevenue
        const totalRevenue =
          transaction.details?.reduce((revenueAcc, detail) => {
            const detailRevenue = (detail.price || 0) * (detail.qty || 0);
            const additionalRevenue =
              detail.additionals?.reduce((addAcc, additional) => {
                return addAcc + (additional.price || 0) * (additional.qty || 0);
              }, 0) || 0;

            return revenueAcc + detailRevenue + additionalRevenue;
          }, 0) || 0;

        const grossProfit = totalRevenue - totalCost;

        const totalTax =
          transaction.taxes?.reduce((taxAcc, tax) => {
            const taxAmount =
              tax.type === "persentage"
                ? totalRevenue * (tax.amount || 0)
                : tax.amount || 0;
            return taxAcc + taxAmount;
          }, 0) || 0;

        const totalCharge =
          transaction.charges?.reduce((chargeAcc, charge) => {
            const chargeAmount =
              charge.type === "persentage"
                ? totalRevenue * (charge.amount || 0)
                : charge.amount || 0;
            return chargeAcc + chargeAmount;
          }, 0) || 0;

        const totalTip =
          transaction.tips?.reduce(
            (tipAcc, tip) => tipAcc + (tip.amount || 0),
            0
          ) || 0;

        const netIncome = grossProfit - totalTax;

        // Tambahkan ke total berdasarkan serviceMethodId
        result[serviceMethodId].total.cost += totalCost;
        result[serviceMethodId].total.revenue += totalRevenue;
        result[serviceMethodId].total.grossProfit += grossProfit;
        result[serviceMethodId].total.tax += totalTax;
        result[serviceMethodId].total.charge += totalCharge;
        result[serviceMethodId].total.tip += totalTip;
        result[serviceMethodId].total.netIncome += netIncome;

        return result;
      }, {});

      const reportArray = Object.values(report);

      return { error: false, data: reportArray };
    } catch (error) {
      console.error(error);
      return { error: true, message: error.message };
    }
  },
};
