// models
const Transaction = require("../models/transactionModel");

// controllers
const excelController = require("./utils/excelController");
const formatController = require("./utils/formatController");
const pageController = require("./utils/pageController");
const pdfController = require("./utils/pdfController");

module.exports = {
  generateDocument: async function (req, documentType) {
    try {
      let reportData;

      // Menentukan data laporan berdasarkan jenis laporan yang diminta
      switch (req.query.reportType) {
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

      const documentData = {
        book: {
          name: `${req.query.reportType}_report`,
          created: new Date(),
          creator: req.query.creator || "Default Creator",
          sheets: [
            {
              name: `${req.query.reportType}_list`,
              content: {
                header: {
                  name: "Report Header",
                  color: { background: "#FFFF00", text: "#000000" },
                  fontWeight: "bold",
                },
                columns: Object.keys(reportData.data[0].total).map((key) => ({
                  name: key,
                  color: { background: "#FFFFFF", text: "#000000" },
                  fontWeight: "normal",
                  format:
                    key === "revenue" || key === "cost" ? "accounting" : "text",
                  values: reportData.data.map((item) => item.total[key]),
                  fixed: false,
                })),
              },
            },
          ],
        },
      };

      let documentBuffer;

      if (documentType === "pdf") {
        documentBuffer = await pdfController.generatePDF(documentData);
      } else if (documentType === "excel") {
        documentBuffer = await excelController.generateExcel(documentData);
      } else {
        throw new Error("Invalid document type specified.");
      }

      return { error: false, data: documentBuffer };
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
    return generateReport(req, "userId");
  },

  generateSalesReportByUser: async (req) => {
    return generateReport(req, "userId");
  },
};

// Helper function to generate the report based on groupField
async function generateReport(req, groupField) {
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

  const isNotEveryQueryNull = () =>
    req.query.from || req.query.to || req.query[groupField];

  let pipeline = isNotEveryQueryNull()
    ? {
        [groupField]: req.query[groupField],
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
      path: groupField,
    });

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

      if (transaction.status.order === "completed") {
        // Calculate totals for completed transactions
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

        const totalTax =
          transaction.taxes?.reduce((taxAcc, tax) => {
            const taxAmount =
              tax.type === "percentage"
                ? totalRevenue * (tax.amount || 0)
                : tax.amount || 0;
            return taxAcc + taxAmount;
          }, 0) || 0;

        const totalCharge =
          transaction.charges?.reduce((chargeAcc, charge) => {
            const chargeAmount =
              charge.type === "percentage"
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

        // Add calculated totals for completed transactions
        result[groupId].total.cost += totalCost;
        result[groupId].total.revenue += totalRevenue;
        result[groupId].total.grossProfit += grossProfit;
        result[groupId].total.tax += totalTax;
        result[groupId].total.charge += totalCharge;
        result[groupId].total.tip += totalTip;
        result[groupId].total.netIncome += netIncome;
      } else if (transaction.status.order === "returned") {
        result[groupId].total.refund += 1; // Count of returned transactions
      } else if (transaction.status.order === "canceled") {
        result[groupId].total.canceled += 1; // Count of canceled transactions
      }

      return result;
    }, {});

    const reportArray = Object.values(report);
    return { error: false, data: reportArray };
  } catch (error) {
    console.error(error);
    return { error: true, message: error.message };
  }
}
