const ExcelJS = require("exceljs");
const excelController = require("./utils/excelController");
const Transaction = require("../models/transactionModel");
const Product = require("../models/productModel");
const pageController = require("./utils/pageController");
const errorMessages = require("../repository/messages/errorMessages");
const successMessages = require("../repository/messages/successMessages");
const productController = require("./productController");
const productResource = require("../repository/resources/productResource");
const transactionResource = require("../repository/resources/transactionResource");
const dataController = require("./utils/dataController");

function convertToLocaleISOString(date, type) {
  let isoString = new Date(date).toISOString();
  let convertDate = new Date(isoString);
  if (type !== "start" && type !== "end") {
    throw new Error('Parameter "type" harus "start" atau "end"');
  }

  convertDate.setHours(date.getHours() + 7);

  let fixDate = convertDate
    .toISOString()
    .replace(
      /T\d{2}:\d{2}:\d{2}.\d{3}Z/,
      type === "start" ? "T00:00:00.000Z" : "T23:59:59.999Z"
    );

  // console.log("fixDate", fixDate);

  return fixDate;
}

function countProductSales(transactions) {
  const groupedItems = {};

  transactions.forEach((transaction) => {
    transaction.details.forEach((detail) => {
      const key = detail.itemId._id;
      if (!groupedItems[key]) {
        const date = new Date(transaction.createdAt).toLocaleDateString(
          "id-ID"
        );

        groupedItems[key] = {
          category: detail.itemId.categoryId.name,
          date: date,
          name: detail.itemId.name,
          totalQty: detail.qty,
          grossSales: detail.qty * detail.price, // Menggunakan harga dari posisi paling luar
        };
      } else {
        groupedItems[key].totalQty += detail.qty;
        groupedItems[key].grossSales += detail.qty * detail.price; // Menggunakan harga dari posisi paling luar
      }
    });
  });

  const result = Object.values(groupedItems);
  return result;
}

// function getConstId(categoryName, language, constant) {
//   const lowerCaseCategoryName = categoryName.toLowerCase();
//   for (const item of constant) {
//     if (item[language] && item.value.toLowerCase() === lowerCaseCategoryName) {
//       return item[language];
//     }
//   }

//   return "Not found";
// }

function getAccumulateEachTransaction(transactions) {
  const result = [];

  transactions.forEach((transaction) => {
    // Menghitung total pendapatan dari item dalam transaksi
    const totalGrossSales = transaction.details.reduce(
      (total, item) => total + item.qty * item.price,
      0
    );

    // Menghitung total charge dan membulatkannya
    const charge = Math.round(totalGrossSales * transaction.charge);

    // Menghitung total pajak dan membulatkannya
    const totalTax = Math.round((totalGrossSales + charge) * transaction.tax);

    // Menghitung total biaya dari objek costs
    const totalCost = transaction.costs.reduce(
      (total, cost) => total + cost.amount,
      0
    );

    // Menghitung total diskon dari objek discounts
    const totalDiscount = transaction.discounts.reduce(
      (total, discount) => total + discount.amount,
      0
    );

    const date = new Date(transaction.createdAt);
    const formattedDate = date.toLocaleString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const entry = {
      _id: transaction._id,
      orderStatus: transaction.orderStatus,
      status: transaction.status,
      createdAt: formattedDate,
      outletName: transaction.outletId.name,
      username: transaction.userId.username,
      table: transaction.table,
      totalGrossSales: totalGrossSales,
      charge: charge,
      totalTax: totalTax,
      totalCost: totalCost,
      totalDiscount: totalDiscount,
      paymentMethod: transaction.paymentMethod,
      paymentAmount: transaction.paymentAmount,
    };

    result.push(entry);
  });

  return result;
}

function getClosingTransactions(transactions) {
  const result = [];
  const processedData = {};

  transactions.forEach((transaction) => {
    const date = new Date(transaction.createdAt);
    const formattedDate = `${date.getDate()}/${
      date.getMonth() + 1
    }/${date.getFullYear()}`;
    const userId = transaction.userId;

    const key = `${formattedDate}_${userId._id}`;

    if (!processedData[key]) {
      processedData[key] = {
        salesDate: formattedDate,
        userProfile: userId,
        totalOrder: 0,
        statusCanceled: 0,
        statusCompleted: 0,
        grandTotalGrossSales: 0,
        grandTotalCharge: 0,
        grandTotalTax: 0,
        grandTotalDiscount: 0,
        grandTotalCost: 0,
        totalPaymentMethodCash: 0,
        totalPaymentMethodDebit: 0,
        totalPaymentMethodQRIS: 0,
        totalPaymentMethodEntertain: 0,
        totalPaymentMethodTransfer: 0,
        totalPaymentMethodEDC: 0,
      };
    }

    processedData[key].totalOrder++;
    if (transaction.status === "completed") {
      processedData[key].statusCompleted++;
    } else if (transaction.status === "canceled") {
      processedData[key].statusCanceled++;
    }

    // Calculate totalGrossSales
    const totalGrossSales = transaction.details.reduce((total, detail) => {
      return total + detail.qty * detail.price;
    }, 0);
    processedData[key].grandTotalGrossSales += totalGrossSales;

    // Calculate grandTotalCharge, grandTotalTax
    const charge = totalGrossSales * transaction.charge;
    const tax = Math.round((totalGrossSales + charge) * transaction.tax);
    processedData[key].grandTotalCharge += charge;
    processedData[key].grandTotalTax += tax;

    // Calculate grandTotalDiscount
    const discount = transaction.discounts.reduce(
      (total, d) => total + d.amount,
      0
    );
    processedData[key].grandTotalDiscount += discount;

    // Calculate grandTotalCost
    const cost = transaction.costs.reduce((total, c) => total + c.amount, 0);
    processedData[key].grandTotalCost += cost;

    // Calculate payment methods
    if (transaction.paymentMethod === "cash") {
      processedData[key].totalPaymentMethodCash += totalGrossSales;
    } else if (transaction.paymentMethod === "debit") {
      processedData[key].totalPaymentMethodDebit += totalGrossSales;
    } else if (transaction.paymentMethod === "QRIS") {
      processedData[key].totalPaymentMethodQRIS += totalGrossSales;
    } else if (transaction.paymentMethod === "entertain") {
      processedData[key].totalPaymentMethodEntertain += totalGrossSales;
    } else if (transaction.paymentMethod === "transfer") {
      processedData[key].totalPaymentMethodTransfer += totalGrossSales;
    } else if (transaction.paymentMethod === "edc") {
      processedData[key].totalPaymentMethodEDC += totalGrossSales;
    }
  });

  for (const key in processedData) {
    result.push(processedData[key]);
  }

  return result;
}

module.exports = {
  getItemSalesReport: async (req) => {
    let defaultFrom = convertToLocaleISOString(
      new Date(req.query.from),
      "start"
    );

    let defaultTo =
      req.query.to !== new Date(req.query.to).toISOString()
        ? convertToLocaleISOString(new Date(req.query.to), "end")
        : req.query.to;

    let pageKey = req.query.pageKey ? req.query.pageKey : 1;
    let pageSize = req.query.pageSize ? req.query.pageSize : null;

    isNotEveryQueryNull = () => {
      return req.query.from || req.query.to;
    };

    isQueryParamsIsValid = () => {
      return req.query.businessId && req.query.outletId;
    };

    if (!isQueryParamsIsValid()) {
      return Promise.reject({
        error: true,
        message: errorMessages.INVALID_DATA,
      });
    }

    let businessIdIsExist = await dataController.isExist(
      { businessId: req.query.businessId },
      Transaction
    );

    let outletIdIsExist = await dataController.isExist(
      { outletId: req.query.outletId },
      Transaction
    );

    if (!businessIdIsExist) {
      return Promise.reject({
        error: true,
        message: errorMessages.BUSINESS_ID_NOT_FOUND,
      });
    }

    if (!outletIdIsExist) {
      return Promise.reject({
        error: true,
        message: errorMessages.OUTLET_ID_NOT_FOUND,
      });
    }

    return new Promise((resolve, reject) => {
      let pipeline = isNotEveryQueryNull()
        ? {
            businessId: req.query.businessId,
            outletId: req.query.outletId,
            status: transactionResource.STATUS.COMPLETED.value,
            createdAt: {
              $gte: defaultFrom,
              $lte: defaultTo,
            },
          }
        : {};

      pageController
        .paginate(pageKey, pageSize, pipeline, Transaction)
        .then((transactions) => {
          Transaction.populate(transactions.data, {
            path: "businessId outletId userId details.itemId",
          })
            .then((data) => {
              Transaction.populate(data, {
                path: "details.itemId.categoryId",
              })
                .then((result) => {
                  let transformedData = countProductSales(result)
                    .sort((a, b) => b.totalQty - a.totalQty)
                    .map((e, i) => ({
                      "No.": i + 1,
                      Tanggal: e.date,
                      "Nama Menu": e.name,
                      Kategori: e.category,
                      "Total Item Terjual": e.totalQty,
                      "Total Penjualan Kotor": e.grossSales,
                    }));

                  const properties = {
                    workbook: "Laporan_Penjualan_Item",
                    worksheet: "Laporan Penjualan Item",
                    title: "Laporan Penjualan Item",
                    data: transformedData,
                    hiddenSheets: [],
                  };

                  excelController
                    .generateExcelTemplate(properties)
                    .then((result) => {
                      resolve({
                        error: false,
                        data: {
                          obj: countProductSales(data),
                          excel: result.data.excel,
                        },
                      });
                    })
                    .catch((error) => {
                      reject(error);
                    });
                })
                .catch((err) => {
                  reject({ error: true, message: err });
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

  getTransactionSalesReport: async (req) => {
    let defaultFrom = convertToLocaleISOString(
      new Date(req.query.from),
      "start"
    );

    let defaultTo =
      req.query.to !== new Date(req.query.to).toISOString()
        ? convertToLocaleISOString(new Date(req.query.to), "end")
        : req.query.to;

    let pageKey = req.query.pageKey ? req.query.pageKey : 1;
    let pageSize = req.query.pageSize ? req.query.pageSize : null;

    isNotEveryQueryNull = () => {
      return req.query.from || req.query.to;
    };

    isQueryParamsIsValid = () => {
      return req.query.businessId && req.query.outletId;
    };

    if (!isQueryParamsIsValid()) {
      return Promise.reject({
        error: true,
        message: errorMessages.INVALID_DATA,
      });
    }

    let businessIdIsExist = await dataController.isExist(
      { businessId: req.query.businessId },
      Transaction
    );

    let outletIdIsExist = await dataController.isExist(
      { outletId: req.query.outletId },
      Transaction
    );

    if (!businessIdIsExist) {
      return Promise.reject({
        error: true,
        message: errorMessages.BUSINESS_ID_NOT_FOUND,
      });
    }

    if (!outletIdIsExist) {
      return Promise.reject({
        error: true,
        message: errorMessages.OUTLET_ID_NOT_FOUND,
      });
    }

    return new Promise((resolve, reject) => {
      let pipeline = isNotEveryQueryNull()
        ? {
            businessId: req.query.businessId,
            outletId: req.query.outletId,
            status: transactionResource.STATUS.COMPLETED.value,
            createdAt: {
              $gte: defaultFrom,
              $lte: defaultTo,
            },
          }
        : {};

      pageController
        .paginate(pageKey, pageSize, pipeline, Transaction)
        .then((transactions) => {
          Transaction.populate(transactions.data, {
            path: "businessId outletId userId details.itemId",
          })
            .then((data) => {
              let transformedData = getAccumulateEachTransaction(data).map(
                (e, i) => ({
                  "No.": i + 1,
                  "Tanggal Transaksi": e.createdAt,
                  "ID Transaksi": e._id,
                  "Nama Outlet": e.outletName,
                  Kasir: e.username,
                  "Nomor Meja": e.table,
                  "Penjualan Kotor": e.totalGrossSales,
                  "Service Charge": e.charge,
                  Pajak: e.totalTax,
                  "Biaya Tambahan": e.totalCost,
                  Diskon: e.totalDiscount,
                  "Metode Pembayaran": e.paymentMethod,
                  "Jumlah Pembayaran": e.paymentAmount,
                })
              );

              const properties = {
                workbook: "Laporan_Transaksi_Penjualan",
                worksheet: "Laporan Transaksi Penjualan",
                title: "Laporan Transaksi Penjualan",
                data: transformedData,
                hiddenSheets: [],
              };

              excelController
                .generateExcelTemplate(properties)
                .then((result) => {
                  resolve({
                    error: false,
                    data: {
                      obj: getAccumulateEachTransaction(data),
                      excel: result.data.excel,
                    },
                  });
                })
                .catch((error) => {
                  reject(error);
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

  getClosingReport: async (req) => {
    let defaultFrom = convertToLocaleISOString(
      new Date(req.query.from),
      "start"
    );

    let defaultTo =
      req.query.to !== new Date(req.query.to).toISOString()
        ? convertToLocaleISOString(new Date(req.query.to), "end")
        : req.query.to;

    let pageKey = req.query.pageKey ? req.query.pageKey : 1;
    let pageSize = req.query.pageSize ? req.query.pageSize : null;

    isNotEveryQueryNull = () => {
      return req.query.from || req.query.to;
    };

    isQueryParamsIsValid = () => {
      return req.query.businessId && req.query.outletId;
    };

    if (!isQueryParamsIsValid()) {
      return Promise.reject({
        error: true,
        message: errorMessages.INVALID_DATA,
      });
    }

    let businessIdIsExist = await dataController.isExist(
      { businessId: req.query.businessId },
      Transaction
    );
    let outletIdIsExist = await dataController.isExist(
      { outletId: req.query.outletId },
      Transaction
    );

    if (!businessIdIsExist) {
      return Promise.reject({
        error: true,
        message: errorMessages.BUSINESS_ID_NOT_FOUND,
      });
    }

    if (!outletIdIsExist) {
      return Promise.reject({
        error: true,
        message: errorMessages.OUTLET_ID_NOT_FOUND,
      });
    }

    return new Promise((resolve, reject) => {
      let pipeline = isNotEveryQueryNull()
        ? {
            businessId: req.query.businessId,
            outletId: req.query.outletId,
            createdAt: {
              $gte: defaultFrom,
              $lte: defaultTo,
            },
          }
        : {};

      pageController
        .paginate(pageKey, pageSize, pipeline, Transaction)
        .then((transactions) => {
          Transaction.populate(transactions.data, {
            path: "businessId outletId userId details.itemId",
          })
            .then((data) => {
              let transformedData = getClosingTransactions(data).map(
                (e, i) => ({
                  "No.": i + 1,
                  Tanggal: e.salesDate,
                  Kasir: e.userProfile.username,
                  "Penjualan Kotor": e.grandTotalGrossSales,
                  "S. Charge": e.grandTotalCharge,
                  Pajak: e.grandTotalTax,
                  "Biaya Tambahan": e.grandTotalCost,
                  Diskon: e.grandTotalDiscount,
                  Terjual: e.statusCompleted,
                  Refund: e.statusCanceled,
                  Cash: e.totalPaymentMethodCash,
                  Debit: e.totalPaymentMethodDebit,
                  EDC: e.totalPaymentMethodEDC,
                  Entertain: e.totalPaymentMethodEntertain,
                  QRIS: e.totalPaymentMethodQRIS,
                  "Transfer Bank": e.totalPaymentMethodTransfer,
                  "Total Order": e.totalOrder,
                })
              );

              const properties = {
                workbook: "Laporan_Closing",
                worksheet: "Laporan Closing",
                title: "Laporan Closing",
                data: transformedData,
                hiddenSheets: [],
              };

              excelController
                .generateExcelTemplate(properties)
                .then((result) => {
                  resolve({
                    error: false,
                    data: {
                      obj: getClosingTransactions(data),
                      excel: result.data.excel,
                    },
                  });
                })
                .catch((error) => {
                  reject(error);
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
};
