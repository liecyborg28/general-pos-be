// models
const Outlet = require("../models/outletModel");
const PaymentMethod = require("../models/paymentMethodModel");
const ServiceMethod = require("../models/serviceMethodModel");
const User = require("../models/userModel");
const Transaction = require("../models/transactionModel");

// controllers
const dataController = require("./utils/dataController");
const excelController = require("./utils/excelController");
const formatController = require("./utils/formatController");
const pageController = require("./utils/pageController");
const pdfController = require("./utils/pdfController");

module.exports = {
  generateDocument: async function (req) {
    try {
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
        default:
          throw new Error("Invalid report type specified.");
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
          : "Transaksi"
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
                    req.query.from
                  )} - ${formatController.convertToDateDDMMYYYY(
                    req.query.to
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
                        : "Transaksi",
                    color: { background: "#FFFF00", text: "#000000" },
                    fontStyle: "normal",
                    format: "text",
                    fixed: true,
                    align: "left",
                    values: reportData.data.map((e) => e[keyName].name),
                  },
                  {
                    name: "Total Biaya Produksi",
                    color: { background: "#FFFF00", text: "#000000" },
                    fontStyle: "normal",
                    format: "accounting",
                    fixed: false,
                    align: "right",
                    values: reportData.data.map((e) => e.total.cost),
                  },
                  {
                    name: "Total Pendapatan",
                    color: { background: "#FFFF00", text: "#000000" },
                    fontStyle: "normal",
                    format: "accounting",
                    fixed: false,
                    align: "right",
                    values: reportData.data.map((e) => e.total.revenue),
                  },
                  {
                    name: "Total Pendapatan Kotor",
                    color: { background: "#FFFF00", text: "#000000" },
                    fontStyle: "normal",
                    format: "accounting",
                    fixed: false,
                    align: "right",
                    values: reportData.data.map((e) => e.total.grossProfit),
                  },
                  {
                    name: "Total Pajak",
                    color: { background: "#FFFF00", text: "#000000" },
                    fontStyle: "normal",
                    format: "accounting",
                    fixed: false,
                    align: "right",
                    values: reportData.data.map((e) => e.total.tax),
                  },
                  {
                    name: "Total Pendapatan Bersih",
                    color: { background: "#FFFF00", text: "#000000" },
                    fontStyle: "normal",
                    format: "accounting",
                    fixed: false,
                    align: "right",
                    values: reportData.data.map((e) => e.total.netIncome),
                  },
                  {
                    name: "Total Service Charge",
                    color: { background: "#FFFF00", text: "#000000" },
                    fontStyle: "normal",
                    format: "accounting",
                    fixed: false,
                    align: "right",
                    values: reportData.data.map((e) => e.total.charge),
                  },
                  {
                    name: "Total Tip",
                    color: { background: "#FFFF00", text: "#000000" },
                    fontStyle: "normal",
                    format: "accounting",
                    fixed: false,
                    align: "right",
                    values: reportData.data.map((e) => e.total.tip),
                  },
                ],
              },
            },
          ],
        },
      };

      if (reportType !== "byTransaction") {
        extraColumns = [
          {
            name: "Total Transaksi Retur",
            color: { background: "#FFFF00", text: "#000000" },
            fontStyle: "normal",
            format: "text",
            fixed: false,
            align: "right",
            values: reportData.data.map((e) => e.total.refund),
          },
          {
            name: "Total Transaksi Batal",
            color: { background: "#FFFF00", text: "#000000" },
            fontStyle: "normal",
            format: "text",
            fixed: false,
            align: "right",
            values: reportData.data.map((e) => e.total.canceled),
          },
        ];
        documentData.book.sheets[0].content.columns =
          documentData.book.sheets[0].content.columns.concat(extraColumns);
      }

      let documentBuffer;

      if (req.query.documentType === "pdf") {
        documentBuffer = await pdfController.generate(documentData);
      } else if (req.query.documentType === "excel") {
        documentBuffer = await excelController.generate(documentData);
      } else {
        throw new Error("Invalid document type specified.");
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
};

async function generateReport(req, groupField) {
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

  const isNotEveryQueryNull = () =>
    req.query.from || req.query.to || req.query[groupField];

  let pipeline = isNotEveryQueryNull()
    ? {
        createdAt: {
          $gte: req.query.from
            ? formatController.convertToLocaleISOString(req.query.from, "start")
            : defaultFrom,
          $lte: req.query.to
            ? formatController.convertToLocaleISOString(req.query.to, "end")
            : defaultTo,
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
      1
    );

    transactions = transactions.data;

    if (!Array.isArray(transactions)) {
      return {
        error: true,
        message: "Data transaksi tidak dalam bentuk array.",
      };
    }

    const report = transactions.reduce((result, transaction) => {
      const groupId = transaction[groupField].toString();

      if (!result[groupId]) {
        result[groupId] = {
          [groupField]: transaction[groupField],
          total: {
            cost: 0,
            revenue: 0,
            grossProfit: 0,
            tax: 0,
            charge: 0,
            tip: 0,
            netIncome: 0,
            refund: 0,
            canceled: 0,
          },
        };
      }

      if (
        transaction.status.order === "completed" ||
        transaction.status.order === "queued"
      ) {
        const totalCost =
          transaction.details?.reduce((costAcc, detail) => {
            const detailCost = (detail.cost || 0) * (detail.qty || 0);
            const additionalCost =
              detail.additionals?.reduce((addAcc, additional) => {
                return addAcc + (additional.cost || 0) * (additional.qty || 0);
              }, 0) || 0;

            return costAcc + detailCost + additionalCost;
          }, 0) || 0;

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

        let totalTax = 0;
        if (transaction.taxes && Array.isArray(transaction.taxes)) {
          totalTax = transaction.taxes.reduce((taxAcc, tax) => {
            let taxAmount = 0;
            if (tax.type === "percentage" && tax.amount) {
              taxAmount = totalRevenue * tax.amount;
            } else if (tax.type === "fixed" && tax.amount) {
              taxAmount = tax.amount;
            }
            return taxAcc + taxAmount;
          }, 0);
        }

        let totalCharge = 0;
        if (transaction.charges && Array.isArray(transaction.charges)) {
          totalCharge = transaction.charges.reduce((chargeAcc, charge) => {
            let chargeAmount = 0;
            if (charge.type === "percentage" && charge.amount) {
              chargeAmount = totalRevenue * charge.amount;
            } else if (charge.type === "fixed" && charge.amount) {
              chargeAmount = charge.amount;
            }
            return chargeAcc + chargeAmount;
          }, 0);
        }

        const totalTip =
          transaction.tips?.reduce(
            (tipAcc, tip) => tipAcc + (tip.amount || 0),
            0
          ) || 0;

        const netIncome = grossProfit - totalTax;

        result[groupId].total.cost += totalCost;
        result[groupId].total.revenue += totalRevenue;
        result[groupId].total.grossProfit += grossProfit;
        result[groupId].total.tax += totalTax;
        result[groupId].total.charge += totalCharge;
        result[groupId].total.tip += totalTip;
        result[groupId].total.netIncome += netIncome;
      } else if (transaction.status.order === "returned") {
        result[groupId].total.refund += 1;
      } else if (transaction.status.order === "canceled") {
        result[groupId].total.canceled += 1;
      }

      return result;
    }, {});

    // Populate groupField data
    const reportArray = await Promise.all(
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
        return { ...item, [groupField]: populatedField };
      })
    );

    return { error: false, data: reportArray };
  } catch (error) {
    console.error(error);
    return { error: true, message: error.message };
  }
}
