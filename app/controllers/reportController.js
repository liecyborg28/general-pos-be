// models
const Outlet = require("../models/outletModel");
const PaymentMethod = require("../models/paymentMethodModel");
const Product = require("../models/productModel");
const ServiceMethod = require("../models/serviceMethodModel");
const User = require("../models/userModel");
const Transaction = require("../models/transactionModel");

// controllers
const dataController = require("./utils/dataController");
const excelController = require("./utils/excelController");
const formatController = require("./utils/formatController");
const pageController = require("./utils/pageController");
const pdfController = require("./utils/pdfController");

function getRandomColorPair(currentColors = []) {
  const flatColors = [
    "#ff6b6b",
    "#ff9f43",
    "#feca57",
    "#ffdd59",
    "#48dbfb",
    "#1dd1a1",
    "#00d2d3",
    "#54a0ff",
    "#5f27cd",
    "#c8d6e5",
    "#576574",
    "#ff4757",
    "#ff6348",
    "#ffa502",
    "#fffa65",
    "#7bed9f",
    "#70a1ff",
    "#5352ed",
    "#e84393",
    "#6c5ce7",
    "#fd79a8",
    "#00cec9",
    "#00b894",
    "#fab1a0",
    "#e17055",
    "#d63031",
    "#0984e3",
    "#74b9ff",
    "#a29bfe",
    "#55efc4",
    "#81ecec",
    "#ffeaa7",
    "#b2bec3",
    "#636e72",
    "#2d3436",
  ];

  function generateUniqueColor() {
    let color;
    do {
      color = flatColors[Math.floor(Math.random() * flatColors.length)];
    } while (currentColors.includes(color));
    return color;
  }

  let borderColor = generateUniqueColor();
  let backgroundColor = borderColor + "99"; // Slight transparency

  return { borderColor, backgroundColor };
}

function generateHorizontalBarChart(data, chartColor, req) {
  let returnValue = {
    labels: data.map((item) => {
      switch (req.query.by) {
        case "outlet":
          return item.outletId?.name;
        case "payment":
          return item.paymentMethodId?.name;
        case "service":
          return item.serviceMethodId?.name;
        case "user":
          return item.userId?.username;
        case "product":
          return `${item.productId?.name} (${item.variantId?.name})`;
        default:
          return item.label;
      }
    }),
    datasets: [],
  };

  if (
    data.length > 0 &&
    data[0].total.revenue !== null &&
    data[0].total.revenue !== undefined
  ) {
    returnValue?.datasets?.push({
      label: "REVENUE",
      backgroundColor: chartColor[0].backgroundColor,
      borderColor: chartColor[0].borderColor,
      data: data.map((item) => item.total.revenue),
    });
  }

  if (
    data.length > 0 &&
    data[0].total.grossProfit !== null &&
    data[0].total.grossProfit !== undefined
  ) {
    returnValue?.datasets?.push({
      label: "GROSS_PROFIT",
      backgroundColor: chartColor[1].backgroundColor,
      borderColor: chartColor[1].borderColor,
      data: data.map((item) => item.total.grossProfit),
    });
  }

  if (
    data.length > 0 &&
    data[0].total.netIncome !== null &&
    data[0].total.netIncome !== undefined
  ) {
    returnValue?.datasets?.push({
      label: "NET_INCOME",
      backgroundColor: chartColor[2].backgroundColor,
      borderColor: chartColor[2].borderColor,
      data: data.map((item) => item.total.netIncome),
    });
  }

  if (
    data.length > 0 &&
    data[0].total.cost !== null &&
    data[0].total.cost !== undefined
  ) {
    returnValue?.datasets?.push({
      label: "COST",
      backgroundColor: chartColor[3].backgroundColor,
      borderColor: chartColor[3].borderColor,
      data: data.map((item) => item.total.cost),
    });
  }

  if (
    data.length > 0 &&
    data[0].total.tax !== null &&
    data[0].total.tax !== undefined
  ) {
    returnValue?.datasets?.push({
      label: "TAX",
      backgroundColor: chartColor[4].backgroundColor,
      borderColor: chartColor[4].borderColor,
      data: data.map((item) => item.total.tax),
    });
  }

  if (
    data.length > 0 &&
    data[0].total.charge !== null &&
    data[0].total.charge !== undefined
  ) {
    returnValue?.datasets?.push({
      label: "CHARGE",
      backgroundColor: chartColor[5].backgroundColor,
      borderColor: chartColor[5].borderColor,
      data: data.map((item) => item.total.charge),
    });
  }

  if (
    data.length > 0 &&
    data[0].total.promotion !== null &&
    data[0].total.promotion !== undefined
  ) {
    returnValue?.datasets?.push({
      label: "PROMOTION",
      backgroundColor: chartColor[6].backgroundColor,
      borderColor: chartColor[6].borderColor,
      data: data.map((item) => item.total.promotion),
    });
  }

  if (
    data.length > 0 &&
    data[0].total.sales !== null &&
    data[0].total.sales !== undefined
  ) {
    returnValue?.datasets?.push({
      label: "SALES",
      backgroundColor: chartColor[7].backgroundColor,
      borderColor: chartColor[7].borderColor,
      data: data.map((item) => item.total.sales),
    });
  }

  return returnValue;
}

function generateLineChart(data, chartColor, req) {
  let returnValue = {
    labels: data.map((item) => {
      switch (req.query.by) {
        case "outlet":
          return item.outletId?.name;
        case "payment":
          return item.paymentMethodId?.name;
        case "service":
          return item.serviceMethodId?.name;
        case "user":
          return item.userId?.username;
        case "product":
          return `${item.productId?.name} (${item.variantId?.name})`;
        default:
          return item?.label;
      }
    }),
    datasets: [],
  };

  if (
    data.length > 0 &&
    data[0].total.revenue !== null &&
    data[0].total.revenue !== undefined
  ) {
    returnValue?.datasets?.push({
      label: "REVENUE",
      backgroundColor: chartColor[0].backgroundColor,
      borderColor: chartColor[0].borderColor,
      data: data.map((item) => item.total.revenue),
      fill: false,
      tension: 0.4,
    });
  }

  if (
    data.length > 0 &&
    data[0].total.grossProfit !== null &&
    data[0].total.grossProfit !== undefined
  ) {
    returnValue?.datasets?.push({
      label: "GROSS_PROFIT",
      backgroundColor: chartColor[1].backgroundColor,
      borderColor: chartColor[1].borderColor,
      data: data.map((item) => item.total.grossProfit),
      fill: false,
      tension: 0.4,
    });
  }

  if (
    data.length > 0 &&
    data[0].total.netIncome !== null &&
    data[0].total.netIncome !== undefined
  ) {
    returnValue?.datasets?.push({
      label: "NET_INCOME",
      backgroundColor: chartColor[2].backgroundColor,
      borderColor: chartColor[2].borderColor,
      data: data.map((item) => item.total.netIncome),
      fill: false,
      tension: 0.4,
    });
  }

  if (
    data.length > 0 &&
    data[0].total.cost !== null &&
    data[0].total.cost !== undefined
  ) {
    returnValue?.datasets?.push({
      label: "COST",
      backgroundColor: chartColor[3].backgroundColor,
      borderColor: chartColor[3].borderColor,
      data: data.map((item) => item.total.cost),
      fill: false,
      tension: 0.4,
    });
  }

  if (
    data.length > 0 &&
    data[0].total.tax !== null &&
    data[0].total.tax !== undefined
  ) {
    returnValue?.datasets?.push({
      label: "TAX",
      backgroundColor: chartColor[4].backgroundColor,
      borderColor: chartColor[4].borderColor,
      data: data.map((item) => item.total.tax),
      fill: false,
      tension: 0.4,
    });
  }

  if (
    data.length > 0 &&
    data[0].total.charge !== null &&
    data[0].total.charge !== undefined
  ) {
    returnValue?.datasets?.push({
      label: "CHARGE",
      backgroundColor: chartColor[5].backgroundColor,
      borderColor: chartColor[5].borderColor,
      data: data.map((item) => item.total.charge),
      fill: false,
      tension: 0.4,
    });
  }

  if (
    data.length > 0 &&
    data[0].total.promotion !== null &&
    data[0].total.promotion !== undefined
  ) {
    returnValue?.datasets?.push({
      label: "PROMOTION",
      backgroundColor: chartColor[6].backgroundColor,
      borderColor: chartColor[6].borderColor,
      data: data.map((item) => item.total.promotion),
      fill: false,
      tension: 0.4,
    });
  }

  if (
    data.length > 0 &&
    data[0].total.sales !== null &&
    data[0].total.sales !== undefined
  ) {
    returnValue?.datasets?.push({
      label: "SALES",
      backgroundColor: chartColor[7].backgroundColor,
      borderColor: chartColor[7].borderColor,
      data: data.map((item) => item.total.sales),
      fill: false,
      tension: 0.4,
    });
  }

  return returnValue;
}

function generateReportToChart(reportArray, req) {
  let totals = [0, 1, 2, 3, 4, 5, 6, 7];

  let chartColor = [];

  let tempChartColor = [];

  chartColor = totals.map((e) => {
    let temp = getRandomColorPair(tempChartColor);
    tempChartColor.push(temp);
    return temp;
  });

  let chartData = {
    chart: {
      horizontalBar: generateHorizontalBarChart(reportArray, chartColor, req),
      line: generateLineChart(reportArray, chartColor, req),
    },
  };

  return chartData;
}

module.exports = {
  generateDocument: async function (req) {
    try {
      let dateISOString = new Date().toISOString();

      let reportData;

      let reportType = req.query.reportType;
      // Menentukan data laporan berdasarkan jenis laporan yang diminta
      switch (reportType) {
        case "byOutlet":
          reportData = await this.generateSalesReportByOutlet(req);
          break;
        case "byPaymentMethod":
          reportData = await this.generateSalesReportByPaymentMethod(req);
          break;
        case "byServiceMethod":
          reportData = await this.generateSalesReportByServiceMethod(req);
          break;
        case "byTransaction":
          reportData = await this.generateSalesReportByTransaction(req);
          break;
        case "byUser":
          reportData = await this.generateSalesReportByUser(req);
          break;
        case "byProduct":
          reportData = await this.generateSalesReportByProduct(req);
          break;
        default:
          reportData = await this.generateSalesReportByPeriod(req);
        // throw new Error("Invalid report type specified.");
      }

      if (reportData.error || !reportData.data) {
        throw new Error("Failed to generate report data.");
      }

      let name = `Laporan Penjualan Per ${
        reportType === "byOutlet"
          ? "Outlet"
          : reportType === "byPaymentMethod"
          ? "Metode Transaksi"
          : reportType === "byServiceMethod"
          ? "Tipe Penjualan"
          : reportType === "byUser"
          ? "Kasir"
          : reportType === "byTransaction"
          ? "Transaksi"
          : reportType === "byAnnual"
          ? "Tahunan"
          : reportType === "byMonth"
          ? "Bulanan"
          : reportType === "byQuarter"
          ? "Kuartal"
          : "Produk"
      }`;

      let keyName =
        reportType === "byOutlet"
          ? "outletId"
          : reportType === "byPaymentMethod"
          ? "paymentMethodId"
          : reportType === "byServiceMethod"
          ? "serviceMethodId"
          : reportType === "byUser"
          ? "userId"
          : reportType === "byProduct"
          ? "productId"
          : "_id";

      let documentData = {
        book: {
          name: name
            .split(" ")
            .join("_")
            .concat(`_${new Date().toISOString()}`),
          created: new Date(),
          creator: "General_POS",
          sheets: [
            {
              name: "Laporan Penjualan",
              content: {
                header: {
                  name: `${name} Periode (${formatController.convertToDateDDMMYYYY(
                    req.query?.from ? req.query?.from : dateISOString
                  )} - ${formatController.convertToDateDDMMYYYY(
                    req.query?.to ? req.query?.to : dateISOString
                  )})`,
                  color: { background: "#FFFF00", text: "#000000" },
                  fontStyle: "bold",
                },
                columns: [
                  {
                    name: "No",
                    color: { background: "#FFFF00", text: "#000000" },
                    fontStyle: "normal",
                    format: "text",
                    fixed: true,
                    align: "center",
                    values: reportData.data.map((e, i) => i + 1),
                  },
                  {
                    name:
                      reportType === "byOutlet"
                        ? "Outlet"
                        : reportType === "byPaymentMethod"
                        ? "Metode Transaksi"
                        : reportType === "byServiceMethod"
                        ? "Tipe Penjualan"
                        : reportType === "byUser"
                        ? "Kasir"
                        : "ID Transaksi",
                    color: { background: "#FFFF00", text: "#000000" },
                    fontStyle: "normal",
                    format: "text",
                    fixed: true,
                    align: "left",
                    values: reportData.data.map((e) =>
                      reportType === "byTransaction"
                        ? e._id._id.toString()
                        : reportType === "byUser"
                        ? e["userId"].username
                        : reportType === "byProduct"
                        ? `${e["productId"].name} (${e["variantId"].name})`
                        : reportType === "byAnnual" ||
                          reportType === "byMonth" ||
                          reportType === "byQuarter"
                        ? e.label
                        : e[keyName].name
                    ),
                  },
                ],
              },
            },
          ],
        },
      };

      if (
        reportData.data &&
        reportData.data.length > 0 &&
        typeof reportData.data[0].total.revenue === "number"
      ) {
        documentData.book.sheets[0].content.columns.push({
          name: "T. Omzet",
          color: { background: "#FFFF00", text: "#000000" },
          fontStyle: "normal",
          format: "accounting",
          fixed: false,
          align: "right",
          values: reportData.data.map((e) => e.total.revenue),
        });
      }

      if (
        reportData.data &&
        reportData.data.length > 0 &&
        typeof reportData.data[0].total.cost === "number"
      ) {
        documentData.book.sheets[0].content.columns.push({
          name: "T. Biaya Produksi",
          color: { background: "#FFFF00", text: "#000000" },
          fontStyle: "normal",
          format: "accounting",
          fixed: false,
          align: "right",
          values: reportData.data.map((e) => e.total.cost),
        });
      }

      if (
        reportData.data &&
        reportData.data.length > 0 &&
        typeof reportData.data[0].total.grossProfit === "number"
      ) {
        documentData.book.sheets[0].content.columns.push({
          name: "T. Laba Kotor",
          color: { background: "#FFFF00", text: "#000000" },
          fontStyle: "normal",
          format: "accounting",
          fixed: false,
          align: "right",
          values: reportData.data.map((e) => e.total.grossProfit),
        });
      }

      if (
        reportData.data &&
        reportData.data.length > 0 &&
        typeof reportData.data[0].total.promotion === "number"
      ) {
        documentData.book.sheets[0].content.columns.push({
          name: "T. Promosi",
          color: { background: "#FFFF00", text: "#000000" },
          fontStyle: "normal",
          format: "accounting",
          fixed: false,
          align: "right",
          values: reportData.data.map((e) => e.total.promotion),
        });
      }

      if (
        reportData.data &&
        reportData.data.length > 0 &&
        typeof reportData.data[0].total.tax === "number"
      ) {
        documentData.book.sheets[0].content.columns.push({
          name: "T. Pajak",
          color: { background: "#FFFF00", text: "#000000" },
          fontStyle: "normal",
          format: "accounting",
          fixed: false,
          align: "right",
          values: reportData.data.map((e) => e.total.tax),
        });
      }

      if (
        reportData.data &&
        reportData.data.length > 0 &&
        typeof reportData.data[0].total.netIncome === "number"
      ) {
        documentData.book.sheets[0].content.columns.push({
          name: "T. Pendapatan Bersih",
          color: { background: "#FFFF00", text: "#000000" },
          fontStyle: "normal",
          format: "accounting",
          fixed: false,
          align: "right",
          values: reportData.data.map((e) => e.total.netIncome),
        });
      }

      if (
        reportData.data &&
        reportData.data.length > 0 &&
        typeof reportData.data[0].total.charge === "number"
      ) {
        documentData.book.sheets[0].content.columns.push({
          name: "T. Biaya Tambahan",
          color: { background: "#FFFF00", text: "#000000" },
          fontStyle: "normal",
          format: "accounting",
          fixed: false,
          align: "right",
          values: reportData.data.map((e) => e.total.charge),
        });
      }

      if (
        reportData.data &&
        reportData.data.length > 0 &&
        typeof reportData.data[0].total.tip === "number"
      ) {
        documentData.book.sheets[0].content.columns.push({
          name: "T. Tip",
          color: { background: "#FFFF00", text: "#000000" },
          fontStyle: "normal",
          format: "accounting",
          fixed: false,
          align: "right",
          values: reportData.data.map((e) => e.total.tip),
        });
      }

      if (
        reportData &&
        reportData.data.length > 0 &&
        typeof reportData.data[0].total.sales === "number"
      ) {
        documentData.book.sheets[0].content.columns.push({
          name: "T. Jumlah Terjual",
          color: { background: "#FFFF00", text: "#000000" },
          fontStyle: "normal",
          format: "accounting",
          fixed: false,
          align: "right",
          values: reportData.data.map((e) => e.total.sales),
        });
      }

      let extraColumns = [];

      let documentBuffer = await excelController.generate(documentData);

      if (req.query.documentType === "pdf") {
        documentBuffer = await pdfController.generatePdfFromExcel(
          documentBuffer
        );
      }

      return {
        error: false,
        data: { fileName: documentData.book.name, buffer: documentBuffer },
      };
    } catch (error) {
      console.error("Error generating document:", error);
      return { error: true, message: error.message };
    }
  },

  generateSalesReportByOutlet: async (req) => {
    return generateReport(req, "outletId");
  },

  generateSalesReportByPaymentMethod: async (req) => {
    return generateReport(req, "paymentMethodId");
  },

  generateSalesReportByServiceMethod: async (req) => {
    return generateReport(req, "serviceMethodId");
  },

  generateSalesReportByTransaction: async (req) => {
    return generateReport(req, "_id"); // Gunakan '_id' untuk group per transaksi
  },

  generateSalesReportByUser: async (req) => {
    return generateReport(req, "userId");
  },

  generateSalesReportByProductPeriod: async function (req) {
    try {
      let timeSpan = parseInt(req.query.timeSpan) || 1;
      let reportType = req.query.reportType; // byAnnual, byMonth, byQuarter
      let today = new Date();
      let startDate = new Date();

      if (reportType === "byAnnual") {
        startDate.setFullYear(today.getFullYear() - timeSpan);
      } else if (reportType === "byMonth") {
        startDate.setMonth(today.getMonth() - (timeSpan - 1));
      } else if (reportType === "byQuarter") {
        startDate.setMonth(today.getMonth() - timeSpan * 3);
      }
      startDate.setHours(0, 0, 0, 0);

      let endDate = new Date();
      endDate.setHours(23, 59, 59, 999);

      let pipeline = {
        createdAt: {
          $gte: new Date(startDate).toISOString(),
          $lte: new Date(endDate).toISOString(),
        },
        "status.payment": "completed",
      };

      if (req.query.businessId) {
        pipeline.businessId = req.query.businessId;
      }

      if (req.query.outletId) {
        pipeline.outletId = req.query.outletId;
      }

      // Ambil data transaksi dalam rentang waktu yang dipilih
      const transactions = await Transaction.find(pipeline).lean();

      // Objek untuk menyimpan totalQty per produk dan varian
      const productReport = {};

      transactions.forEach((transaction) => {
        // Hitung produk utama (details)
        transaction.details.forEach((detail) => {
          const key = `${detail.productId}-${detail.variantId}`;
          if (!productReport[key]) {
            productReport[key] = {
              productId: detail.productId,
              variantId: detail.variantId,
              total: { sales: 0 },
            };
          }
          productReport[key].total.sales += detail.qty;
        });

        // Hitung produk tambahan (additionals)
        transaction.details.forEach((detail) => {
          detail.additionals.forEach((additional) => {
            const key = `${additional.productId}-null`;
            if (!productReport[key]) {
              productReport[key] = {
                productId: additional.productId,
                variantId: null,
                total: { sales: 0 },
              };
            }
            productReport[key].total.sales += additional.qty;
          });
        });
      });

      // Konversi objek ke array
      let reportArray = Object.values(productReport);

      // Populate productId dan variantId untuk mendapatkan detail produk dan varian
      reportArray = await Promise.all(
        reportArray.map(async (item) => {
          const product = await Product.findById(item.productId).exec();

          let variantData = null;
          if (item.variantId && product.variants) {
            variantData = product.variants.find(
              (variant) => variant._id.toString() === item.variantId.toString()
            );
          }

          return {
            ...item,
            productId: product, // Ganti productId dengan data produk yang sudah dipopulate
            variantId: variantData, // Ganti variantId dengan data varian yang lengkap
          };
        })
      );

      // Urutkan berdasarkan jumlah penjualan terbanyak
      reportArray.sort((a, b) => b.total.sales - a.total.sales);

      let data = generateReportToChart(reportArray, req);
      return { error: false, data };
    } catch (error) {
      console.error("Error generating product sales report by period:", error);
      return { error: true, message: error.message };
    }
  },

  generateSalesReportByPeriod: async function (req) {
    try {
      let timeSpan = parseInt(req.query.timeSpan) || 1; // Default 1 tahun
      let reportType = req.query.reportType; // byAnnual, byMonth, byQuarter
      let today = new Date();
      let startDate = new Date();

      if (reportType === "byAnnual") {
        startDate.setFullYear(today.getFullYear() - timeSpan);
      } else if (reportType === "byMonth") {
        startDate.setMonth(today.getMonth() - (timeSpan - 1));
      } else if (reportType === "byQuarter") {
        startDate.setMonth(today.getMonth() - timeSpan * 3);
      }
      startDate.setHours(0, 0, 0, 0);

      let endDate = new Date();
      endDate.setHours(23, 59, 59, 999);

      let pipeline = {
        createdAt: {
          $gte: new Date(startDate).toISOString(),
          $lte: new Date(endDate).toISOString(),
        },
        "status.payment": "completed",
      };

      if (req.query.businessId) {
        pipeline.businessId = req.query.businessId;
      }

      if (req.query.outletId) {
        pipeline.outletId = req.query.outletId;
      }

      let transactions = await Transaction.find(pipeline).lean();

      let report = [];
      let periodMap = {};
      let currentDate = new Date(startDate);
      while (currentDate <= today) {
        let periodKey;
        if (reportType === "byAnnual") {
          periodKey = currentDate.getFullYear().toString();
          currentDate.setFullYear(currentDate.getFullYear() + 1);
        } else if (reportType === "byMonth") {
          periodKey =
            currentDate.toLocaleString("en-US", { month: "short" }) +
            " " +
            currentDate.getFullYear();
          currentDate.setMonth(currentDate.getMonth() + 1);
        } else if (reportType === "byQuarter") {
          let quarter = Math.floor(currentDate.getMonth() / 3) + 1;
          periodKey = `Q${quarter} ${currentDate.getFullYear()}`;
          currentDate.setMonth(currentDate.getMonth() + 3);
        }
        periodMap[periodKey] = {
          label: periodKey,
          total: { revenue: 0, grossProfit: 0, netIncome: 0, sales: 0, tax: 0 },
        };
      }

      transactions.forEach((transaction) => {
        let createdAt = new Date(transaction.createdAt);
        let periodKey;
        if (reportType === "byAnnual") {
          periodKey = createdAt.getFullYear().toString();
        } else if (reportType === "byMonth") {
          periodKey =
            createdAt.toLocaleString("en-US", { month: "short" }) +
            " " +
            createdAt.getFullYear();
        } else if (reportType === "byQuarter") {
          let quarter = Math.floor(createdAt.getMonth() / 3) + 1;
          periodKey = `Q${quarter} ${createdAt.getFullYear()}`;
        }

        if (!periodMap[periodKey]) return;

        let totalRevenue = transaction.details.reduce(
          (sum, detail) => sum + detail.price * detail.qty,
          0
        );
        let totalCost = transaction.details.reduce(
          (sum, detail) => sum + detail.cost * detail.qty,
          0
        );
        let grossProfit = totalRevenue - totalCost;
        let taxAmount =
          totalRevenue *
          (transaction.taxes?.reduce((sum, tax) => sum + tax.amount, 0) || 0);
        let netIncome = grossProfit - taxAmount;
        let sales = transaction.details.reduce(
          (sum, detail) => sum + detail.qty,
          0
        );

        periodMap[periodKey].total.revenue += totalRevenue;
        periodMap[periodKey].total.grossProfit += grossProfit;
        periodMap[periodKey].total.tax += taxAmount;
        periodMap[periodKey].total.netIncome += netIncome;
        periodMap[periodKey].total.sales += sales;
        periodMap[periodKey].total.tax += taxAmount;
      });

      report = Object.values(periodMap).sort(
        (a, b) => new Date(a.label) - new Date(b.label)
      );

      let data = generateReportToChart(report, req);

      return { error: false, data };
    } catch (error) {
      console.error("Error generating periodic report:", error);
      return { error: true, message: error.message };
    }
  },

  generateSalesReportByProduct: async function (req) {
    try {
      let dateISOString = new Date().toISOString();
      let pageKey = req.query.pageKey ? req.query.pageKey : 1;
      let pageSize = req.query.pageSize ? req.query.pageSize : null;

      let defaultFrom = formatController.convertToLocaleISOString(
        dateISOString,
        "start"
      );
      let defaultTo = formatController.convertToLocaleISOString(
        dateISOString,
        "end"
      );

      let pipeline = {
        createdAt: {
          $gte: req.query.from
            ? formatController.convertToLocaleISOString(req.query.from, "start")
            : defaultFrom,
          $lte: req.query.to
            ? formatController.convertToLocaleISOStringNextDay(
                req.query.to,
                "end"
              )
            : defaultTo,
        },
      };

      if (req.query.businessId) {
        pipeline.businessId = req.query.businessId;
      }

      if (req.query.outletId) {
        pipeline.outletId = req.query.outletId;
      }

      const transactions = await pageController.paginate(
        pageKey,
        pageSize,
        pipeline,
        Transaction,
        1
      );
      const productReport = {};

      transactions.data.forEach((transaction) => {
        const status = transaction.status.payment;

        transaction.details.forEach((detail) => {
          const key = `${detail.productId}-${detail.variantId}`;
          if (!productReport[key]) {
            productReport[key] = {
              productId: detail.productId,
              variantId: detail.variantId,
              completed: { sales: 0 },
              canceled: { sales: 0 },
              returned: { sales: 0 },
            };
          }
          productReport[key][status].sales += detail.qty;
        });
      });

      let reportArray = Object.values(productReport).map((item) => {
        return {
          productId: item.productId,
          variantId: item.variantId,
          total: {
            sales: item.completed.sales - item.returned.sales,
          },
        };
      });

      reportArray = await Promise.all(
        reportArray.map(async (item) => {
          const product = await Product.findById(item.productId).exec();
          let variantData = null;
          if (item.variantId && product.variants) {
            variantData = product.variants.find(
              (variant) => variant._id.toString() === item.variantId.toString()
            );
          }
          return { ...item, productId: product, variantId: variantData };
        })
      );

      reportArray.sort((a, b) => b.total.sales - a.total.sales);

      let data = generateReportToChart(reportArray, req);
      return { error: false, data };
    } catch (error) {
      console.error("Error generating product sales report:", error);
      return { error: true, message: error.message };
    }
  },
};

async function generateReport(req, groupField) {
  try {
    let dateISOString = new Date().toISOString();
    let pageKey = req.query.pageKey ? req.query.pageKey : 1;
    let pageSize = req.query.pageSize ? req.query.pageSize : null;

    let defaultFrom = formatController.convertToLocaleISOString(
      dateISOString,
      "start"
    );
    let defaultTo = formatController.convertToLocaleISOString(
      dateISOString,
      "end"
    );

    let pipeline = {
      createdAt: {
        $gte: req.query.from
          ? formatController.convertToLocaleISOString(req.query.from, "start")
          : defaultFrom,
        $lte: req.query.to
          ? formatController.convertToLocaleISOStringNextDay(
              req.query.to,
              "end"
            )
          : defaultTo,
      },
    };

    if (req.query.businessId) {
      pipeline.businessId = req.query.businessId;
    }

    if (req.query.outletId) {
      pipeline.outletId = req.query.outletId;
    }

    const transactions = await pageController.paginate(
      pageKey,
      pageSize,
      pipeline,
      Transaction,
      1
    );
    const report = {};

    transactions.data.forEach((transaction) => {
      const groupId = transaction[groupField]?.toString();
      if (!groupId) return;

      if (!report[groupId]) {
        report[groupId] = {
          [groupField]: transaction[groupField],
          completed: {
            cost: 0,
            revenue: 0,
            grossProfit: 0,
            tax: 0,
            charge: 0,
            tip: 0,
            netIncome: 0,
            sales: 0,
            promotion: 0,
          },
          canceled: {
            cost: 0,
            revenue: 0,
            grossProfit: 0,
            tax: 0,
            charge: 0,
            tip: 0,
            netIncome: 0,
            sales: 0,
            promotion: 0,
          },
          returned: {
            cost: 0,
            revenue: 0,
            grossProfit: 0,
            tax: 0,
            charge: 0,
            tip: 0,
            netIncome: 0,
            sales: 0,
            promotion: 0,
          },
        };
      }

      let category = report[groupId][transaction.status.payment];
      transaction.details.forEach((detail) => {
        category.sales += detail.qty;
        category.cost += detail.cost * detail.qty;
        category.revenue += detail.price * detail.qty;

        // Menambahkan perhitungan untuk additionals
        detail.additionals.forEach((additional) => {
          category.sales += additional.qty;
          category.cost += additional.cost * additional.qty;
          category.revenue += additional.price * additional.qty;
        });
      });

      let totalPromotion = transaction.promotions.reduce(
        (acc, promo) =>
          acc +
          (promo.type === "percentage"
            ? category.revenue * promo.amount
            : promo.amount),
        0
      );

      let totalGrossProfit = category.revenue - category.cost;
      let totalTax = transaction.taxes.reduce(
        (acc, tax) =>
          acc +
          (tax.type === "percentage"
            ? category.revenue * tax.amount
            : tax.amount),
        0
      );
      let totalCharge = transaction.charges.reduce(
        (acc, charge) =>
          acc +
          (charge.type === "percentage"
            ? category.revenue * charge.amount
            : charge.amount),
        0
      );
      let totalTip = transaction.tips.reduce((acc, tip) => acc + tip.amount, 0);
      let netIncome = totalGrossProfit - totalTax;

      category.revenue += totalCharge + totalTax - totalPromotion;
      category.grossProfit += totalGrossProfit;
      category.tax += totalTax;
      category.charge += totalCharge;
      category.tip += totalTip;
      category.promotion += totalPromotion;
      category.netIncome += netIncome;
    });

    let reportArray = await Promise.all(
      Object.values(report).map(async (item) => {
        let model = null;
        switch (groupField) {
          case "outletId":
            model = Outlet;
            break;
          case "paymentMethodId":
            model = PaymentMethod;
            break;
          case "serviceMethodId":
            model = ServiceMethod;
            break;
          case "_id":
            model = Transaction;
            break;
          case "userId":
            model = User;
            break;
          default:
            break;
        }
        const populatedField = await dataController.populateFieldById(
          model,
          item[groupField]
        );
        return {
          ...item,
          [groupField]: populatedField,
          total: {
            // sales: item.completed.sales - item.returned.sales,
            cost: item.completed.cost - item.returned.cost,
            revenue: item.completed.revenue - item.returned.revenue,
            grossProfit: item.completed.grossProfit - item.returned.grossProfit,
            tax: item.completed.tax - item.returned.tax,
            charge: item.completed.charge - item.returned.charge,
            tip: item.completed.tip - item.returned.tip,
            promotion: item.completed.promotion - item.returned.promotion,
            netIncome: item.completed.netIncome - item.returned.netIncome,
          },
        };
      })
    );

    reportArray.sort((a, b) => b.total.revenue - a.total.revenue);

    let data = generateReportToChart(reportArray, req);
    return { error: false, data };
  } catch (error) {
    console.error("Error generating report:", error);
    return { error: true, message: error.message };
  }
}
