const router = require("express").Router();
const authController = require("../../controllers/authController");
const receiptController = require("../../controllers/receiptController");

router.get("/receipt/transaction/:transactionId", (req, res) => {
  authController
    .checkAccessToken(req)
    .then(() => {
      receiptController
        .getTransactionReceipt(req)
        .then((value) => {
          res.setHeader("Content-Type", "application/pdf");
          res.setHeader(
            "Content-Disposition",
            `attachment; filename=Struk_Transaksi_${new Date().toISOString()}.pdf`
          );
          res.status(200).send(value);
        })
        .catch((err) => {
          res.status(500).send(err);
        });
    })
    .catch((err) => {
      res.status(500).send(err);
    });
});

router.get("/receipt/item/:transactionId", (req, res) => {
  authController
    .checkAccessToken(req)
    .then(() => {
      receiptController
        .getItemReceipt(req)
        .then((value) => {
          res.setHeader("Content-Type", "application/pdf");
          res.setHeader(
            "Content-Disposition",
            `attachment; filename=Struk_Orderan_${new Date().toISOString()}.pdf`
          );
          res.status(200).send(value);
        })
        .catch((err) => {
          res.status(500).send(err);
        });
    })
    .catch((err) => {
      res.status(500).send(err);
    });
});

module.exports = router;
