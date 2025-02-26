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

function getRandomColorPair(currentColors = []) {
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

function generatePieChart(data, chartColor, req) {
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
      data: data.map((e) => e.total.revenue),
      backgroundColor: chartColor.map((e) => e.backgroundColor),
      hoverBackgroundColor: chartColor.map((e) => e.borderColor),
    });
  }

  return returnValue;
}

function generateDoughnutChart(data, chartColor, req) {
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
      data: data.map((e) => e.total.revenue),
      backgroundColor: chartColor.map((e) => e.backgroundColor),
      hoverBackgroundColor: chartColor.map((e) => e.borderColor),
    });
  }

  return returnValue;
}

function generateReportToChart(reportArray, req) {
  let chartColor = [];

  let tempChartColor = [];

  for (let i = 0; i < flatColors.length; i++) {
    let temp = getRandomColorPair(tempChartColor);
    tempChartColor.push(temp);
    chartColor.push(temp);
  }

  let chartData = {
    chart: {
      horizontalBar: generateHorizontalBarChart(reportArray, chartColor, req),
      line: generateLineChart(reportArray, chartColor, req),
      pie: generatePieChart(reportArray, chartColor, req),
      doughnut: generateDoughnutChart(reportArray, chartColor, req),
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
          : reportType === "byMonthly"
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
                    values: reportData.reportArray.map((e, i) => i + 1),
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
                    values: reportData.reportArray.map((e) =>
                      reportType === "byTransaction"
                        ? e._id._id.toString()
                        : reportType === "byUser"
                        ? e["userId"].username
                        : reportType === "byProduct"
                        ? `${e["productId"].name} (${e["variantId"].name})`
                        : reportType === "byAnnual" ||
                          reportType === "byMonthly" ||
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
        reportData.reportArray &&
        reportData.reportArray.length > 0 &&
        reportData.reportArray[0].total.revenue !== null &&
        reportData.reportArray[0].total.revenue !== undefined
      ) {
        documentData.book.sheets[0].content.columns.push({
          name: "T. Omzet",
          color: { background: "#FFFF00", text: "#000000" },
          fontStyle: "normal",
          format: "accounting",
          fixed: false,
          align: "right",
          values: reportData.reportArray.map((e) => e.total.revenue),
        });
      }

      if (
        reportData.reportArray &&
        reportData.reportArray.length > 0 &&
        reportData.reportArray[0].total.cost !== null &&
        reportData.reportArray[0].total.cost !== undefined
      ) {
        documentData.book.sheets[0].content.columns.push({
          name: "T. Biaya Produksi",
          color: { background: "#FFFF00", text: "#000000" },
          fontStyle: "normal",
          format: "accounting",
          fixed: false,
          align: "right",
          values: reportData.reportArray.map((e) => e.total.cost),
        });
      }

      if (
        reportData.reportArray &&
        reportData.reportArray.length > 0 &&
        reportData.reportArray[0].total.grossProfit !== null &&
        reportData.reportArray[0].total.grossProfit !== undefined
      ) {
        documentData.book.sheets[0].content.columns.push({
          name: "T. Laba Kotor",
          color: { background: "#FFFF00", text: "#000000" },
          fontStyle: "normal",
          format: "accounting",
          fixed: false,
          align: "right",
          values: reportData.reportArray.map((e) => e.total.grossProfit),
        });
      }

      if (
        reportData.reportArray &&
        reportData.reportArray.length > 0 &&
        reportData.reportArray[0].total.netIncome !== null &&
        reportData.reportArray[0].total.netIncome !== undefined
      ) {
        documentData.book.sheets[0].content.columns.push({
          name: "T. Laba Bersih",
          color: { background: "#FFFF00", text: "#000000" },
          fontStyle: "normal",
          format: "accounting",
          fixed: false,
          align: "right",
          values: reportData.reportArray.map((e) => e.total.netIncome),
        });
      }

      if (
        reportData.reportArray &&
        reportData.reportArray.length > 0 &&
        reportData.reportArray[0].total.promotion !== null &&
        reportData.reportArray[0].total.promotion !== undefined
      ) {
        documentData.book.sheets[0].content.columns.push({
          name: "T. Promosi",
          color: { background: "#FFFF00", text: "#000000" },
          fontStyle: "normal",
          format: "accounting",
          fixed: false,
          align: "right",
          values: reportData.reportArray.map((e) => e.total.promotion),
        });
      }

      if (
        reportData.reportArray &&
        reportData.reportArray.length > 0 &&
        reportData.reportArray[0].total.tax !== null &&
        reportData.reportArray[0].total.tax !== undefined
      ) {
        documentData.book.sheets[0].content.columns.push({
          name: "T. Pajak",
          color: { background: "#FFFF00", text: "#000000" },
          fontStyle: "normal",
          format: "accounting",
          fixed: false,
          align: "right",
          values: reportData.reportArray.map((e) => e.total.tax),
        });
      }

      if (
        reportData.reportArray &&
        reportData.reportArray.length > 0 &&
        reportData.reportArray[0].total.charge !== null &&
        reportData.reportArray[0].total.charge !== undefined
      ) {
        documentData.book.sheets[0].content.columns.push({
          name: "T. Biaya Tambahan",
          color: { background: "#FFFF00", text: "#000000" },
          fontStyle: "normal",
          format: "accounting",
          fixed: false,
          align: "right",
          values: reportData.reportArray.map((e) => e.total.charge),
        });
      }

      if (
        reportData.reportArray &&
        reportData.reportArray.length > 0 &&
        reportData.reportArray[0].total.tip !== null &&
        reportData.reportArray[0].total.tip !== undefined
      ) {
        documentData.book.sheets[0].content.columns.push({
          name: "T. Tip",
          color: { background: "#FFFF00", text: "#000000" },
          fontStyle: "normal",
          format: "accounting",
          fixed: false,
          align: "right",
          values: reportData.reportArray.map((e) => e.total.tip),
        });
      }

      if (
        reportData &&
        reportData.data.length > 0 &&
        reportData.reportArray[0].total.sales !== null &&
        reportData.reportArray[0].total.sales !== undefined
      ) {
        documentData.book.sheets[0].content.columns.push({
          name: "T. Jumlah Terjual",
          color: { background: "#FFFF00", text: "#000000" },
          fontStyle: "normal",
          format: "accounting",
          fixed: false,
          align: "right",
          values: reportData.reportArray.map((e) => e.total.sales),
        });
      }

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

  generateSalesReportByProduct: async function (req) {
    try {
      let dateISOString = new Date().toISOString();
      let pageKey = req.query.pageKey ? req.query.pageKey : 1;
      let pageSize = req.query.pageSize ? req.query.pageSize : null;
      let { businessId, outletId } = req.query;

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

      if (businessId) {
        pipeline.businessId = businessId;
      }

      if (outletId) {
        pipeline.outletId = outletId;
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

        const processItem = (item) => {
          const key = item.variantId.toString(); // Grouping by variantId
          if (!productReport[key]) {
            productReport[key] = {
              variantId: item.variantId,
              productId: item.productId,
              completed: { sales: 0 },
              canceled: { sales: 0 },
              returned: { sales: 0 },
              pending: { sales: 0 },
            };
          }
          productReport[key][status].sales += item.qty;
        };

        transaction.details.forEach(processItem);
        transaction.details.forEach((detail) => {
          detail.additionals.forEach(processItem);
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
      return { error: false, data, reportArray };
    } catch (error) {
      console.error("Error generating product sales report:", error);
      return { error: true, message: error.message };
    }
  },

  generateSalesReportByPeriod: async function (req) {
    try {
      let { reportType, businessId, outletId, timeSpan } = req.query;

      let pipeline = {};
      if (businessId) pipeline.businessId = businessId;
      if (outletId) pipeline.outletId = outletId;

      // Tentukan rentang waktu berdasarkan reportType dan timeSpan
      let currentDate = new Date();
      let startDate;

      if (reportType === "byAnnual") {
        startDate = new Date(currentDate.getFullYear() - timeSpan, 0, 1);
      } else if (reportType === "byMonthly") {
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - (timeSpan - 1));
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
      } else if (reportType === "byQuarter") {
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - (timeSpan - 1) * 3); // Menghitung 3 bulan untuk setiap quarter
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
      }

      if (businessId) {
        pipeline.businessId = businessId;
      }

      if (outletId) {
        pipeline.outletId = outletId;
      }

      pipeline.createdAt = {
        $gte: startDate.toISOString(),
        $lte: formatController.convertToLocaleISOStringNextDay(
          currentDate.toISOString(),
          "start"
        ),
      };

      const transactions = await Transaction.find(pipeline).exec();
      const report = {};

      // Langkah 1: Kelompokkan transaksi berdasarkan status.payment (completed, canceled, returned)
      transactions.forEach((transaction) => {
        let date = new Date(transaction.createdAt);
        let label;

        if (reportType === "byAnnual") {
          label = date.getFullYear().toString();
        } else if (reportType === "byMonthly") {
          label =
            date.toLocaleString("default", { month: "short" }) +
            " " +
            date.getFullYear();
        } else if (reportType === "byQuarter") {
          let quarter = Math.floor(date.getMonth() / 3) + 1;
          label = `Q${quarter} ${date.getFullYear()}`;
        }

        if (!report[label]) {
          report[label] = {
            completed: {
              sales: 0,
              cost: 0,
              revenue: 0,
              grossProfit: 0,
              tax: 0,
              charge: 0,
              promotion: 0,
              tip: 0,
              netIncome: 0,
            },
            canceled: {
              sales: 0,
              cost: 0,
              revenue: 0,
              grossProfit: 0,
              tax: 0,
              charge: 0,
              promotion: 0,
              tip: 0,
              netIncome: 0,
            },
            returned: {
              sales: 0,
              cost: 0,
              revenue: 0,
              grossProfit: 0,
              tax: 0,
              charge: 0,
              promotion: 0,
              tip: 0,
              netIncome: 0,
            },
            pending: {
              sales: 0,
              cost: 0,
              revenue: 0,
              grossProfit: 0,
              tax: 0,
              charge: 0,
              promotion: 0,
              tip: 0,
              netIncome: 0,
            },
          };
        }

        let subtotal = 0;
        let totalCost = 0;
        let totalTip = transaction.tips.reduce(
          (acc, tip) => acc + tip.amount,
          0
        );

        transaction.details.forEach((detail) => {
          let detailRevenue = detail.price * detail.qty;
          let detailCost = detail.cost * detail.qty;
          subtotal += detailRevenue;
          totalCost += detailCost;

          detail.additionals.forEach((additional) => {
            subtotal += additional.price * additional.qty;
            totalCost += additional.cost * additional.qty;
          });
        });

        let tax = transaction.taxes.reduce((acc, tax) => {
          return (
            acc +
            (tax.type === "percentage" ? subtotal * tax.amount : tax.amount)
          );
        }, 0);

        let charge = transaction.charges.reduce((acc, charge) => {
          return (
            acc +
            (charge.type === "percentage"
              ? subtotal * charge.amount
              : charge.amount)
          );
        }, 0);

        let promotion = transaction.promotions.reduce((acc, promo) => {
          return (
            acc +
            (promo.type === "percentage"
              ? subtotal * promo.amount
              : promo.amount)
          );
        }, 0);

        let revenue = subtotal + tax + charge + totalTip - promotion;
        let grossProfit = revenue - totalCost;
        let netIncome = grossProfit - tax - charge - totalTip;

        // Masukkan transaksi ke dalam kategori status.payment yang sesuai
        let category = report[label][transaction.status.payment];
        category.sales += 1;
        category.cost += totalCost;
        category.revenue += revenue;
        category.grossProfit += grossProfit;
        category.tax += tax;
        category.charge += charge;
        category.promotion += promotion;
        category.tip += totalTip;
        category.netIncome += netIncome;
      });

      // Langkah 2: Hitung totalnya menggunakan formula completed - returned
      let reportArray = Object.keys(report).map((key) => {
        const item = report[key];

        return {
          label: key,
          total: {
            sales: item.completed.sales - item.returned.sales,
            cost: item.completed.cost - item.returned.cost,
            revenue: item.completed.revenue - item.returned.revenue,
            grossProfit: item.completed.grossProfit - item.returned.grossProfit,
            tax: item.completed.tax - item.returned.tax,
            charge: item.completed.charge - item.returned.charge,
            promotion: item.completed.promotion - item.returned.promotion,
            tip: item.completed.tip - item.returned.tip,
            netIncome: item.completed.netIncome - item.returned.netIncome,
          },
        };
      });

      // Urutkan berdasarkan label
      reportArray.sort((a, b) => new Date(a.label) - new Date(b.label));

      // Memastikan bulan yang tidak ada transaksi tetap ada (misal, dengan nilai 0)
      let allLabels = [];
      let startMonth = new Date(startDate);
      for (let i = 0; i < timeSpan; i++) {
        let monthLabel = `${startMonth.toLocaleString("default", {
          month: "short",
        })} ${startMonth.getFullYear()}`;
        allLabels.push(monthLabel);
        startMonth.setMonth(startMonth.getMonth() + 1);
      }

      // Tambahkan bulan yang tidak ada data transaksi
      allLabels.forEach((label) => {
        if (!report[label]) {
          report[label] = {
            completed: {
              sales: 0,
              cost: 0,
              revenue: 0,
              grossProfit: 0,
              tax: 0,
              charge: 0,
              promotion: 0,
              tip: 0,
              netIncome: 0,
            },
            canceled: {
              sales: 0,
              cost: 0,
              revenue: 0,
              grossProfit: 0,
              tax: 0,
              charge: 0,
              promotion: 0,
              tip: 0,
              netIncome: 0,
            },
            returned: {
              sales: 0,
              cost: 0,
              revenue: 0,
              grossProfit: 0,
              tax: 0,
              charge: 0,
              promotion: 0,
              tip: 0,
              netIncome: 0,
            },
            pending: {
              sales: 0,
              cost: 0,
              revenue: 0,
              grossProfit: 0,
              tax: 0,
              charge: 0,
              promotion: 0,
              tip: 0,
              netIncome: 0,
            },
          };
        }
      });

      let data = generateReportToChart(reportArray, req);
      return { error: false, data, reportArray };
    } catch (error) {
      console.error("Error generating sales report by period:", error);
      return { error: true, message: error.message };
    }
  },

  generateSalesReportByProductPeriod: async function (req) {
    try {
      let { reportType, timeSpan, businessId, outletId } = req.query;
      let currentDate = new Date();
      let startDate;

      // Tentukan rentang waktu berdasarkan reportType dan timeSpan
      if (reportType === "byAnnual") {
        startDate = new Date(currentDate.getFullYear() - timeSpan, 0, 1);
      } else if (reportType === "byMonthly") {
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - (timeSpan - 1));
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
      } else if (reportType === "byQuarter") {
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - timeSpan * 3);
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
      }

      let pipeline = {
        createdAt: {
          $gte: startDate.toISOString(),
          $lte: formatController.convertToLocaleISOStringNextDay(
            currentDate.toISOString(),
            "start"
          ),
        },
      };

      if (businessId) {
        pipeline.businessId = businessId;
      }

      if (outletId) {
        pipeline.outletId = outletId;
      }

      // Ambil transaksi sesuai filter yang diberikan
      const transactions = await Transaction.find(pipeline).exec();
      const productReport = {};

      transactions.forEach((transaction) => {
        const status = transaction.status.payment;

        const processItem = (item) => {
          const key = item.variantId.toString(); // Grouping by variantId
          if (!productReport[key]) {
            productReport[key] = {
              variantId: item.variantId,
              productId: item.productId,
              completed: { sales: 0 },
              canceled: { sales: 0 },
              returned: { sales: 0 },
              pending: { sales: 0 },
            };
          }
          productReport[key][status].sales += item.qty;
        };

        // Proses data transaksi
        transaction.details.forEach(processItem);
        transaction.details.forEach((detail) => {
          detail.additionals.forEach(processItem);
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

      // Menambahkan data produk dan varian produk
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

      // Mengurutkan berdasarkan penjualan tertinggi
      reportArray.sort((a, b) => b.total.sales - a.total.sales);

      // Generate laporan dalam format chart atau format lain
      let data = generateReportToChart(reportArray, req);
      return { error: false, data, reportArray };
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
    let { reportType, businessId, outletId, timeSpan } = req.query;

    let defaultFrom = formatController.convertToLocaleISOString(
      dateISOString,
      "start"
    );
    let defaultTo = formatController.convertToLocaleISOString(
      dateISOString,
      "end"
    );

    let startDate = new Date();
    let currentDate = new Date();
    let pipeline = {};

    if (reportType === "byAnnual") {
      startDate = new Date(currentDate.getFullYear() - timeSpan, 0, 1);
    } else if (reportType === "byMonthly") {
      startDate = new Date();
      startDate.setMonth(startDate.getMonth() - (timeSpan - 1));
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
    } else if (reportType === "byQuarter") {
      startDate = new Date();
      startDate.setMonth(startDate.getMonth() - (timeSpan - 1) * 3); // Menghitung 3 bulan untuk setiap quarter
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
    }

    if (
      reportType !== "byAnnual" &&
      reportType !== "byMonthly" &&
      reportType !== "byQuarter"
    ) {
      pipeline.createdAt = {
        $gte: req.query.from
          ? formatController.convertToLocaleISOString(req.query.from, "start")
          : defaultFrom,
        $lte: req.query.to
          ? formatController.convertToLocaleISOStringNextDay(
              req.query.to,
              "end"
            )
          : defaultTo,
      };
    } else {
      pipeline.createdAt = {
        $gte: startDate.toISOString(),
        $lte: formatController.convertToLocaleISOStringNextDay(
          currentDate.toISOString(),
          "start"
        ),
      };
    }

    if (businessId) {
      pipeline.businessId = businessId;
    }

    if (outletId) {
      pipeline.outletId = outletId;
    }

    const transactions = await pageController.paginate(
      pageKey,
      pageSize,
      pipeline,
      Transaction,
      1
    );
    const report = {};

    // Langkah 1: Kelompokkan transaksi berdasarkan groupField terlebih dahulu dan hitung totalnya langsung
    transactions.data.forEach((transaction) => {
      const groupId = transaction[groupField]?.toString();
      if (!groupId) return;

      if (!report[groupId]) {
        report[groupId] = {
          [groupField]: transaction[groupField],
          completed: {
            sales: 0,
            cost: 0,
            revenue: 0,
            grossProfit: 0,
            tax: 0,
            charge: 0,
            promotion: 0,
            tip: 0,
            netIncome: 0,
          },
          canceled: {
            sales: 0,
            cost: 0,
            revenue: 0,
            grossProfit: 0,
            tax: 0,
            charge: 0,
            promotion: 0,
            tip: 0,
            netIncome: 0,
          },
          returned: {
            sales: 0,
            cost: 0,
            revenue: 0,
            grossProfit: 0,
            tax: 0,
            charge: 0,
            promotion: 0,
            tip: 0,
            netIncome: 0,
          },
          pending: {
            sales: 0,
            cost: 0,
            revenue: 0,
            grossProfit: 0,
            tax: 0,
            charge: 0,
            promotion: 0,
            tip: 0,
            netIncome: 0,
          },
        };
      }
    });

    // Langkah 2: Masukkan transaksi ke dalam kategori status.payment yang sesuai dalam groupField yang sudah terbentuk
    transactions.data.forEach((transaction) => {
      const groupId = transaction[groupField]?.toString();
      if (!groupId) return;
      let category = report[groupId][transaction.status.payment];

      let subtotal = 0;
      let totalCost = 0;
      let totalTip = transaction.tips.reduce((acc, tip) => acc + tip.amount, 0);

      transaction.details.forEach((detail) => {
        let detailRevenue = detail.price * detail.qty;
        let detailCost = detail.cost * detail.qty;
        subtotal += detailRevenue;
        totalCost += detailCost;

        detail.additionals.forEach((additional) => {
          subtotal += additional.price * additional.qty;
          totalCost += additional.cost * additional.qty;
        });
      });

      let tax = transaction.taxes.reduce((acc, tax) => {
        return (
          acc + (tax.type === "percentage" ? subtotal * tax.amount : tax.amount)
        );
      }, 0);

      let charge = transaction.charges.reduce((acc, charge) => {
        return (
          acc +
          (charge.type === "percentage"
            ? subtotal * charge.amount
            : charge.amount)
        );
      }, 0);

      let promotion = transaction.promotions.reduce((acc, promo) => {
        return (
          acc +
          (promo.type === "percentage" ? subtotal * promo.amount : promo.amount)
        );
      }, 0);

      let revenue = subtotal + tax + charge + totalTip - promotion;
      let grossProfit = revenue - totalCost;
      let netIncome = grossProfit - tax - charge - totalTip;

      category.sales += 1;
      category.cost += totalCost;
      category.revenue += revenue;
      category.grossProfit += grossProfit;
      category.tax += tax;
      category.charge += charge;
      category.promotion += promotion;
      category.tip += totalTip;
      category.netIncome += netIncome;
    });

    let reportArray = await Promise.all(
      Object.values(report).map(async (item) => {
        let model = {
          outletId: Outlet,
          paymentMethodId: PaymentMethod,
          serviceMethodId: ServiceMethod,
          _id: Transaction,
          userId: User,
        }[groupField];
        const populatedField = await dataController.populateFieldById(
          model,
          item[groupField]
        );

        return {
          ...item,
          [groupField]: populatedField,
          total: {
            sales: item.completed.sales - item.returned.sales,
            cost: item.completed.cost - item.returned.cost,
            revenue: item.completed.revenue - item.returned.revenue,
            grossProfit: item.completed.grossProfit - item.returned.grossProfit,
            tax: item.completed.tax - item.returned.tax,
            charge: item.completed.charge - item.returned.charge,
            promotion: item.completed.promotion - item.returned.promotion,
            tip: item.completed.tip - item.returned.tip,
            netIncome: item.completed.netIncome - item.returned.netIncome,
          },
        };
      })
    );

    reportArray.sort((a, b) => b.total.revenue - a.total.revenue);

    let data = generateReportToChart(reportArray, req);
    return { error: false, data, reportArray };
  } catch (error) {
    console.error("Error generating report:", error);
    return { error: true, message: error.message };
  }
}
