const errorMessages = require("../repository/messages/errorMessages");
const pdfController = require("../controllers/utils/pdfController");
const Transaction = require("../models/transactionModel");
const Category = require("../models/categoryModel");
const PoolTableTransaction = require("../models/poolTableTransactionModel");
const transactionResource = require("../repository/resources/transactionResource");
const formatController = require("../controllers/utils/formatController");
const pageController = require("../controllers/utils/pageController");

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

function countBillingAmount(timeStr, rate, rateType) {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const totalMinutes = hours * 60 + minutes;

  return rateType === "perHour"
    ? (totalMinutes / 60) * rate
    : totalMinutes * rate;
}

const logoUrl =
  "https://raw.githubusercontent.com/liecyborg28/my-assets-public/main/logo-berlin-billiard-new.png";

const phoneNumber = "(+62) 896 9929 1452";

const postCode = "78121";

module.exports = {
  getPoolTableTransactionReceipt: (req) => {
    return new Promise((resolve, reject) => {
      const poolTableTransactionId = req.params.poolTableTransactionId;

      PoolTableTransaction.findOne({ _id: poolTableTransactionId })
        .populate("businessId outletId userId details.poolTableId")
        .exec()
        .then((result) => {
          let receiptDetails = result.details.map((e) => ({
            name: e.poolTableId.name,
            poolTableNumber: e.poolTableNumber,
            duration: e.duration,
            durationType: e.durationType,
            price: e.price,
            totalPrice: countBillingAmount(e.duration, e.price, e.durationType),
          }));

          let totalDetails =
            result.details.length > 0
              ? receiptDetails
                  .map((e) =>
                    countBillingAmount(e.duration, e.price, e.durationType)
                  )
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
            change: result.paymentAmount - grandTotal,
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
                        font-size: 14px;
                    }

                    hr {
                        border-top: 1px;
                        border-color: #000;
                    }

                    .container {
                        max-height: fit-content !important;
                    }

                    .logo {
                        content: url(${logoUrl});
                        width: 350px;
                        min-height: fit-content;
                        margin: -20px auto auto;
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
                    <p class="address">${receiptData.address}</p>
                    <p class="call-and-post">${phoneNumber}, ${postCode}</p>
                    <hr>
                    <table>
                        <tr>
                            <td>ID</td>
                            <td>: ${receiptData.id}</td>
                        </tr>
                        <tr>
                            <td>Waktu</td>
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
                    </table>
                    <hr>
                    <div>`;

          html += `<div class="detail">
                    <div style="width: 25%; display: flex; justify-content: left;">Meja</div>
                    <div style="width: 25%; display: flex; justify-content: right;">Durasi</div>
                    <div style="width: 25%; display: flex; justify-content: right;">Per Jam</div>
                    <div style="width: 25%; display: flex; justify-content: right;">Total</div>
                </div>`;

          receiptData.details.map((e) => {
            html += `<div class="detail">
              <div style="width: 25%; display: flex; justify-content: left;">${
                e.name
              } ${e.poolTableNumber}</div>
              <div style="width: 25%; display: flex; justify-content: right;">${
                e.duration
              }</div>
              <div style="width: 25%; display: flex; justify-content: right;">${formatController.currencyTransform(
                e.price
              )}</div>
              <div style="width: 25%; display: flex; justify-content: right;">${formatController.currencyTransform(
                e.totalPrice
              )}</div>
          </div>`;
          });

          receiptData.costs.map((e) => {
            html += `<div class="detail">
              <span>${e.title}</span>
              <span>${formatController.currencyTransform(e.amount)}</span>
          </div>`;
          });

          receiptData.discounts.map((e) => {
            html += `<div class="detail">
              <span>${e.title}</span>
              <span>${formatController.currencyTransform(e.amount)}</span>
          </div>`;
          });

          html += `<hr>
                </div>
                <div>
                    <div class="detail">
                        <span>Total ${receiptData.details.length} Item</span>
                        <span>${formatController.currencyTransform(
                          receiptData.totalDetails
                        )}</span>
                    </div>
                    <div class="detail">
                        <span>Total Biaya Tambahan</span>
                        <span>${formatController.currencyTransform(
                          receiptData.totalCosts
                        )}</span>
                    </div>
                    <div class="detail">
                        <span>Total Pajak</span>
                        <span>${formatController.currencyTransform(
                          parseInt(receiptData.totalTax)
                        )}</span>
                    </div>
                    <div class="detail">
                        <span>Total Diskon</span>
                        <span>(${formatController.currencyTransform(
                          receiptData.totalDiscounts
                        )})</span>
                    </div>
                    <hr>
                </div>
                <div>
                    <div class="detail">
                        <span>Total Bayar (${receiptData.paymentMethod})</span>
                        <span>${formatController.currencyTransform(
                          parseInt(receiptData.paymentAmount)
                        )}</span>
                    </div>    
                    <div class="detail">
                        <span>Total Tagihan</span>
                        <span>${formatController.currencyTransform(
                          receiptData.grandTotal
                        )}</span>
                    </div>
                    <div class="detail">
                        <span>Kembalian</span>
                        <span>${formatController.currencyTransform(
                          receiptData.change
                        )}</span>
                    </div>
                    <hr>
                </div>
                <p style="text-align: center; margin-top: 50px;">Terima Kasih atas Kunjungan Anda :)</p>
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
            change: result.paymentAmount - grandTotal,
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
                  font-size: 14px;
              }
              hr {
                  border-top: 1px;
                  border-color: #000;
              }
              .container {
                  max-height: fit-content !important;
              }
              .logo {
                  content: url(${logoUrl});
                  width: 350px;
                  min-height: fit-content;
                  margin: -20px auto auto;
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
              <p class="address">${receiptData.address}</p>
              <p class="call-and-post">${phoneNumber}, ${postCode}</p>
              <hr>
              <table>
                  <tr>
                      <td>ID</td>
                      <td>: ${receiptData.id}</td>
                  </tr>
                  <tr>
                      <td>Waktu</td>
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
        <span>${formatController.currencyTransform(e.price)}</span>
    </div>`;
          });

          receiptData.costs.map((e) => {
            html += `<div class="detail">
        <span>${e.title}</span>
        <span>${formatController.currencyTransform(e.amount)}</span>
    </div>`;
          });

          receiptData.discounts.map((e) => {
            html += `<div class="detail">
        <span>${e.title}</span>
        <span>${formatController.currencyTransform(e.amount)}</span>
    </div>`;
          });

          html += `<hr>
      </div>
      <div>
          <div class="detail">
              <span>Total ${receiptData.details.length} Item</span>
              <span>${formatController.currencyTransform(
                receiptData.totalDetails
              )}</span>
          </div>
          <div class="detail">
              <span>Total Biaya Tambahan</span>
              <span>${formatController.currencyTransform(
                receiptData.totalCosts
              )}</span>
          </div>
          <div class="detail">
              <span>Total Pajak</span>
              <span>${formatController.currencyTransform(
                receiptData.totalTax
              )}</span>
          </div>
          <div class="detail">
              <span>Total Diskon</span>
              <span>(${formatController.currencyTransform(
                receiptData.totalDiscounts
              )})</span>
          </div>
          <hr>
      </div>
      <div>
          <div class="detail">
              <span>Total Bayar (${receiptData.paymentMethod})</span>
              <span>${formatController.currencyTransform(
                receiptData.paymentAmount
              )}</span>
          </div>
          <div class="detail">
              <span>Total Tagihan</span>
              <span>${formatController.currencyTransform(
                receiptData.grandTotal
              )}</span>
          </div>
          <div class="detail">
              <span>Kembalian</span>
              <span>${formatController.currencyTransform(
                receiptData.change
              )}</span>
          </div>
          <hr>
      </div>
      <p style="text-align: center; margin-top: 50px;">Terima Kasih atas Kunjungan Anda :)</p>
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
      let categoryId = req.query.categoryId ? req.query.categoryId : null;
      let categoriesList = [];
      let receiptKitchenDetails = [];
      let receiptBar1Details = [];
      let receiptBar2Details = [];

      pageController.paginate(1, null, {}, Category).then((categories) => {
        categoriesList = categories.data;

        let findKitchenCategory = categoriesList.find(
          (e) => e.name === "Kitchen"
        );
        let findBar1Category = categoriesList.find(
          (e) => e.name === "Bar Lantai 1"
        );
        let findBar2Category = categoriesList.find(
          (e) => e.name === "Bar Lantai 2"
        );

        Transaction.findOne({ _id: transactionId })
          .populate("businessId outletId userId details.itemId")
          .exec()
          .then((result) => {
            let receiptDetails = [];
            let totalDetails = [];

            receiptKitchenDetails = result.details
              .filter(
                (el) =>
                  el.itemId.categoryId.toString() ==
                  findKitchenCategory._id.toString()
              )
              .map((e) => ({
                name: e.itemId.name,
                qty: e.qty,
                price: e.price,
              }));

            receiptBar1Details = result.details
              .filter(
                (el) =>
                  el.itemId.categoryId.toString() ==
                  findBar1Category._id.toString()
              )
              .map((e) => ({
                name: e.itemId.name,
                qty: e.qty,
                price: e.price,
              }));

            receiptBar2Details = result.details
              .filter(
                (el) =>
                  el.itemId.categoryId.toString() ==
                  findBar2Category._id.toString()
              )
              .map((e) => ({
                name: e.itemId.name,
                qty: e.qty,
                price: e.price,
              }));

            if (categoryId) {
              receiptDetails = result.details
                .filter((el) => el.itemId.categoryId.toString() == categoryId)
                .map((e) => ({
                  name: e.itemId.name,
                  qty: e.qty,
                  price: e.price,
                }));

              totalDetails =
                result.details.length > 0
                  ? receiptDetails
                      .map((e) => e.qty * e.price)
                      .reduce((a, b) => a + b)
                  : 0;
            } else {
              receiptDetails = result.details.map((e) => ({
                name: e.itemId.name,
                qty: e.qty,
                price: e.price,
              }));

              totalDetails =
                result.details.length > 0
                  ? receiptDetails
                      .map((e) => e.qty * e.price)
                      .reduce((a, b) => a + b)
                  : 0;
            }

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
              totalDetails +
              totalCosts +
              totalCharge +
              totalTax -
              totalDiscounts;

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
              note: result.note,
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
                  font-size: 14px;
              }
              hr {
                  border-top: 1px;
                  border-color: #000;
              }
              * {
                  font-family: Arial, Helvetica, sans-serif;
                  font-size: 14px;
              }
              hr {
                  border-top: 1px;
                  border-color: #000;
              }
              .container {
                  max-height: fit-content !important;
              }
             .logo {
                  content: url(${logoUrl});
                  width: 350px;
                  min-height: fit-content;
                  margin: -20px auto auto;
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
              <hr>
              <table>
                  <tr>
                      <td>ID</td>
                      <td>: ${receiptData.id}</td>
                  </tr>
                  <tr>
                      <td>Waktu</td>
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

            //         receiptData.details.map((e) => {
            //           html += `<div class="detail">
            //     <span>${e.qty} ${e.name}</span>
            //     <span>${formatController.currencyTransform(e.price)}</span>
            // </div>`;
            //         });

            if (
              receiptKitchenDetails.length > 0 &&
              req.query.categoryId === findKitchenCategory._id.toString()
            ) {
              html += `<div class="detail">
                  <span>(Kitchen)</span>
              </div>`;

              receiptKitchenDetails.map((e) => {
                html += `<div class="detail">
        <span>${e.qty} ${e.name}</span>
        <span>${formatController.currencyTransform(e.price)}</span>
    </div>`;
              });
            }

            if (
              receiptBar1Details.length > 0 &&
              req.query.categoryId === findBar1Category._id.toString()
            ) {
              html += `<div class="detail">
                  <span>(Bar Lantai 1)</span>
              </div>`;

              receiptBar1Details.map((e) => {
                html += `<div class="detail">
        <span>${e.qty} ${e.name}</span>
        <span>${formatController.currencyTransform(e.price)}</span>
    </div>`;
              });
            }

            if (
              receiptBar2Details.length > 0 &&
              req.query.categoryId === findBar2Category._id.toString()
            ) {
              html += `<div class="detail">
                  <span>(Bar Lantai 2)</span>
              </div>`;

              receiptBar2Details.map((e) => {
                html += `<div class="detail">
        <span>${e.qty} ${e.name}</span>
        <span>${formatController.currencyTransform(e.price)}</span>
    </div>`;
              });
            }

            if (receiptData.note) {
              html += `<div class="detail">
                  <span>(Catatan)</span>
              </div>
              <div class="detail">
                  <span>${receiptData.note}</span>
              </div>`;
            }

            html += `<hr>
      </div>
  </div>
</body>
</html>`;

            if (receiptData.details.length > 0) {
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
            }
          })
          .catch((err) => {
            reject({
              error: true,
              message: errorMessages.FAILED_CREATED_FILE,
            });
          });
      });
    });
  },
};
