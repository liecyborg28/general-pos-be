const ExcelJS = require("exceljs");
const excelController = require("./utils/excelController");
const Transaction = require("../models/transactionModel");
const pageController = require("./utils/pageController");
const errorMessages = require("../repository/messages/errorMessages");
const successMessages = require("../repository/messages/successMessages");
const itemController = require("./itemController");
const itemResource = require("../repository/resources/itemResource");

function countItemSales(transactions) {
  const groupedItems = {};

  transactions.forEach((transaction) => {
    transaction.details.forEach((detail) => {
      const key = detail.itemId._id;
      if (!groupedItems[key]) {
        const date = new Date(transaction.createdAt).toLocaleDateString(
          "id-ID"
        );

        groupedItems[key] = {
          category: detail.itemId.category,
          date: date,
          name: detail.itemId.name,
          totalQty: detail.qty,
          revenue: detail.qty * detail.price, // Menggunakan harga dari posisi paling luar
        };
      } else {
        groupedItems[key].totalQty += detail.qty;
        groupedItems[key].revenue += detail.qty * detail.price; // Menggunakan harga dari posisi paling luar
      }
    });
  });

  const result = Object.values(groupedItems);
  return result;
}

function getConstId(categoryName, language, constant) {
  const lowerCaseCategoryName = categoryName.toLowerCase();
  for (const item of constant) {
    if (item[language] && item.value.toLowerCase() === lowerCaseCategoryName) {
      return item[language];
    }
  }

  return "Not found";
}

function getAccumulateEachTransaction(transactions) {
  const result = [];

  transactions.forEach((transaction) => {
    // Menghitung total pendapatan dari item dalam transaksi
    const totalRevenue = transaction.details.reduce(
      (total, item) => total + item.qty * item.price,
      0
    );

    // Menghitung total charge dan membulatkannya
    const charge = Math.round(totalRevenue * transaction.charge);

    // Menghitung total pajak dan membulatkannya
    const totalTax = Math.round((totalRevenue + charge) * transaction.tax);

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
      createdAt: formattedDate,
      outletName: transaction.outletId.name,
      username: transaction.userId.username,
      table: transaction.table,
      totalRevenue: totalRevenue,
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

module.exports = {
  getItemSalesReport: (req) => {
    let defaultFrom = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
    let defaultTo = new Date(
      new Date().setHours(23, 59, 59, 999)
    ).toISOString();

    let pageKey = req.query.pageKey ? req.query.pageKey : 1;
    let pageSize = req.query.pageSize ? req.query.pageSize : null;

    isNotEveryQueryNull = () => {
      return req.query.from || req.query.to;
    };

    return new Promise((resolve, reject) => {
      let pipeline = isNotEveryQueryNull()
        ? {
            createdAt: {
              $gte: req.query.from || defaultFrom,
              $lte: req.query.to || defaultTo,
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
              let categoryItem = itemResource.CATEGORY;
              let transformedData = countItemSales(data)
                .sort((a, b) => b.totalQty - a.totalQty)
                .map((e, i) => ({
                  "No.": i + 1,
                  Tanggal: e.date,
                  "Nama Menu": e.name,
                  Kategori: getConstId(e.category, "id", categoryItem),
                  "Total Menu Terjual": e.totalQty,
                  "Total Penjualan": e.revenue,
                }));

              const properties = {
                workbook: "Laporan_Penjualan_Menu",
                worksheet: "Laporan Penjualan Menu",
                title: "Laporan Penjualan Menu",
                data: transformedData,
              };

              excelController
                .generateExcelTemplate(properties)
                .then((result) => {
                  resolve({
                    error: false,
                    data: {
                      obj: countItemSales(data),
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

  getTransactionSalesReport: (req) => {
    let defaultFrom = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
    let defaultTo = new Date(
      new Date().setHours(23, 59, 59, 999)
    ).toISOString();

    let pageKey = req.query.pageKey ? req.query.pageKey : 1;
    let pageSize = req.query.pageSize ? req.query.pageSize : null;

    isNotEveryQueryNull = () => {
      return req.query.from || req.query.to;
    };

    return new Promise((resolve, reject) => {
      let pipeline = isNotEveryQueryNull()
        ? {
            createdAt: {
              $gte: req.query.from || defaultFrom,
              $lte: req.query.to || defaultTo,
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
                  "Penjualan Kotor": e.totalRevenue,
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
};
