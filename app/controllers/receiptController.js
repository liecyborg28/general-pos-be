const fs = require("fs");
const errorMessages = require("../repository/messages/errorMessages");
const successMessages = require("../repository/messages/successMessages");
const pdfController = require("../controllers/utils/pdfController");
const Transaction = require("../models/transactionModel");
const transactionResource = require("../repository/resources/transactionResource");

function getPageSize(pdfPath) {
  const pdfReader = hummus.createReader(pdfPath);
  const firstPage = pdfReader.getPage(0);
  const pageSize = firstPage.getMediaBox();
  return { width: pageSize[2], height: pageSize[3] };
}

function formatReceiptDate(inputDate) {
  const date = new Date(inputDate);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const formattedDate = `${day}/${month}/${year} ${hours}:${minutes}`;
  return formattedDate;
}

function capitalizeEveryWord(inputString) {
  const words = inputString.split(" ");
  const capitalizedWords = words.map(
    (word) => word.charAt(0).toUpperCase() + word.slice(1)
  );
  const capitalizedString = capitalizedWords.join(" ");
  return capitalizedString;
}

function getPropertyFromArray(value, property, dataArray) {
  return dataArray.find((e) => e.value === value)[property];
}

module.exports = {
  getTransactionReceipt: (req) => {
    return new Promise((resolve, reject) => {
      const transactionId = req.params.transactionId;

      Transaction.findOne({ _id: transactionId })
        .populate("businessId outletId userId details.itemId")
        .exec()
        .then((result) => {
          let receiptDetails = result.details.map((e) => ({
            name: e.itemId.name,
            qty: e.qty,
            price: e.price,
          }));

          let totalDetails =
            result.details.length > 0
              ? receiptDetails
                  .map((e) => e.qty * e.price)
                  .reduce((a, b) => a + b)
              : 0;

          let totalCosts =
            result.costs.length > 0
              ? result.costs.map((e) => e.amount).reduce((a, b) => a + b)
              : 0;

          let totalDiscounts =
            result.discounts.length > 0
              ? result.discounts.map((e) => e.amount).reduce((a, b) => a + b)
              : 0;

          let totalCharge = totalDetails * result.charge;

          let totalTax = Math.round(
            (totalDetails + totalCharge - totalDiscounts) * result.tax
          );

          let grandTotal =
            totalDetails + totalCosts + totalCharge + totalTax - totalDiscounts;

          let receiptData = {
            // header
            outlet: result.outletId.name,
            address: result.outletId.address,
            // content
            id: result._id,
            date: formatReceiptDate(result.createdAt),
            cashier: result.userId.name,
            customer: capitalizeEveryWord(result.customer),
            table: result.table ? result.table : "-",
            paymentMethod: getPropertyFromArray(
              result.paymentMethod,
              "id",
              transactionResource.PAYMENT_METHOD
            ),
            details: receiptDetails,
            costs: result.costs,
            discounts: result.discounts,
            totalDetails,
            totalCosts,
            totalDiscounts,
            totalTax,
            paymentAmount: result.paymentAmount,
            grandTotal,
            change: grandTotal - result.paymentAmount,
          };

          let html = `<!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link rel="stylesheet" href="styles/style.css">
          <title>Document</title>
          <style>
              * {
                  font-family: Arial, Helvetica, sans-serif;
                  font-size: 8px;
              }
              hr {
                  border-top: 1px;
                  border-color: #000;
              }
              .logo {
                  content: url(https://raw.githubusercontent.com/liecyborg28/my-assets-public/main/logo-anak-bawang.png);
                  width: 100px;
                  min-height: fit-content;
                  filter: grayscale();
                  margin: 30px auto auto;
              }
              .address {
                  text-align: center;
              }
              .call-and-post {
                  text-align: center;
              }
              .detail {
                  width: 100%;
                  display: flex;
                  justify-content: space-between;
                  margin-bottom: 5px;
              }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="logo"></div>
              <p class="address">${receiptData.outlet}, ${receiptData.address}</p>
              <p class="call-and-post">(+62) 852 5062 1375, 78111</p>
              <hr>
              <table>
                  <tr>
                      <td>ID Transaksi</td>
                      <td>: ${receiptData.id}</td>
                  </tr>
                  <tr>
                      <td>Waktu Transaksi</td>
                      <td>: ${receiptData.date}</td>
                  </tr>
                  <tr>
                      <td>Kasir</td>
                      <td>: ${receiptData.cashier}</td>
                  </tr>
                  <tr>
                      <td>Pemesan</td>
                      <td>: ${receiptData.customer}</td>
                  </tr>
                  <tr>
                      <td>No. Meja</td>
                      <td>: ${receiptData.table}</td>
                  </tr>
              </table>
              <hr>
              <div>`;

          receiptData.details.map((e) => {
            html += `<div class="detail">
        <span>${e.qty} ${e.name}</span>
        <span>${e.price}</span>
    </div>`;
          });

          receiptData.costs.map((e) => {
            html += `<div class="detail">
        <span>${e.title}</span>
        <span>${e.amount}</span>
    </div>`;
          });

          receiptData.discounts.map((e) => {
            html += `<div class="detail">
        <span>${e.title}</span>
        <span>${e.amount}</span>
    </div>`;
          });

          html += `<hr>
      </div>
      <div>
          <div class="detail">
              <span>Total ${receiptData.details.length} Item</span>
              <span>${receiptData.totalDetails}</span>
          </div>
          <div class="detail">
              <span>Total Biaya Tambahan</span>
              <span>${receiptData.totalCosts}</span>
          </div>
          <div class="detail">
              <span>Total Pajak</span>
              <span>${receiptData.totalTax}</span>
          </div>
          <div class="detail">
              <span>Total Diskon</span>
              <span>(${receiptData.totalDiscounts})</span>
          </div>
          <hr>
      </div>
      <div>
          <div class="detail">
              <span>Total Tagihan</span>
              <span>${receiptData.grandTotal}</span>
          </div>
          <div class="detail">
              <span>Total Bayar (${receiptData.paymentMethod})</span>
              <span>${receiptData.paymentAmount}</span>
          </div>
          <div class="detail">
              <span>Kembalian</span>
              <span>${receiptData.change}</span>
          </div>
          <hr>
      </div>
  </div>
</body>
</html>`;

          pdfController
            .generatePDF(html)
            .then((res) => {
              resolve(res);
            })
            .catch((err) => {
              reject({
                error: true,
                message: errorMessages.FAILED_CREATED_FILE,
              });
            });
        })
        .catch((err) => {
          reject({
            error: true,
            message: errorMessages.FAILED_CREATED_FILE,
          });
        });
    });
  },

  getItemReceipt: (req) => {
    return new Promise((resolve, reject) => {
      const transactionId = req.params.transactionId;

      Transaction.findOne({ _id: transactionId })
        .populate("businessId outletId userId details.itemId")
        .exec()
        .then((result) => {
          let receiptDetails = result.details.map((e) => ({
            name: e.itemId.name,
            qty: e.qty,
            price: e.price,
          }));

          let totalDetails =
            result.details.length > 0
              ? receiptDetails
                  .map((e) => e.qty * e.price)
                  .reduce((a, b) => a + b)
              : 0;

          let totalCosts =
            result.costs.length > 0
              ? result.costs.map((e) => e.amount).reduce((a, b) => a + b)
              : 0;

          let totalDiscounts =
            result.discounts.length > 0
              ? result.discounts.map((e) => e.amount).reduce((a, b) => a + b)
              : 0;

          let totalCharge = totalDetails * result.charge;

          let totalTax = Math.round(
            (totalDetails + totalCharge - totalDiscounts) * result.tax
          );

          let grandTotal =
            totalDetails + totalCosts + totalCharge + totalTax - totalDiscounts;

          let receiptData = {
            // header
            outlet: result.outletId.name,
            address: result.outletId.address,
            // content
            id: result._id,
            date: formatReceiptDate(result.createdAt),
            cashier: result.userId.name,
            customer: capitalizeEveryWord(result.customer),
            table: result.table ? result.table : "-",
            paymentMethod: getPropertyFromArray(
              result.paymentMethod,
              "id",
              transactionResource.PAYMENT_METHOD
            ),
            details: receiptDetails,
            costs: result.costs,
            discounts: result.discounts,
            totalDetails,
            totalCosts,
            totalDiscounts,
            totalTax,
            paymentAmount: result.paymentAmount,
            grandTotal,
            change: grandTotal - result.paymentAmount,
          };

          let html = `<!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link rel="stylesheet" href="styles/style.css">
          <title>Document</title>
          <style>
              * {
                  font-family: Arial, Helvetica, sans-serif;
                  font-size: 8px;
              }
              hr {
                  border-top: 1px;
                  border-color: #000;
              }
              .logo {
                  content: url(https://raw.githubusercontent.com/liecyborg28/my-assets-public/main/logo-anak-bawang.png);
                  width: 100px;
                  min-height: fit-content;
                  filter: grayscale();
                  margin: 30px auto auto;
              }
              .address {
                  text-align: center;
              }
              .call-and-post {
                  text-align: center;
              }
              .detail {
                  width: 100%;
                  display: flex;
                  justify-content: space-between;
                  margin-bottom: 5px;
              }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="logo"></div>
              <p class="address">${receiptData.outlet}, ${receiptData.address}</p>
              <p class="call-and-post">(+62) 852 5062 1375, 78111</p>
              <hr>
              <table>
                  <tr>
                      <td>ID Transaksi</td>
                      <td>: ${receiptData.id}</td>
                  </tr>
                  <tr>
                      <td>Waktu Transaksi</td>
                      <td>: ${receiptData.date}</td>
                  </tr>
                  <tr>
                      <td>Kasir</td>
                      <td>: ${receiptData.cashier}</td>
                  </tr>
                  <tr>
                      <td>Pemesan</td>
                      <td>: ${receiptData.customer}</td>
                  </tr>
                  <tr>
                      <td>No. Meja</td>
                      <td>: ${receiptData.table}</td>
                  </tr>
              </table>
              <hr>
              <div>`;

          receiptData.details.map((e) => {
            html += `<div class="detail">
        <span>${e.qty} ${e.name}</span>
        <span>${e.price}</span>
    </div>`;
          });

          html += `<hr>
      </div>
  </div>
</body>
</html>`;

          pdfController
            .generatePDF(html)
            .then((res) => {
              resolve(res);
            })
            .catch((err) => {
              reject({
                error: true,
                message: errorMessages.FAILED_CREATED_FILE,
              });
            });
        })
        .catch((err) => {
          reject({
            error: true,
            message: errorMessages.FAILED_CREATED_FILE,
          });
        });
    });
  },
};
