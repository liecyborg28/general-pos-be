const router = require("express").Router();
const authController = require("../controllers/authController");
const reportController = require("../controllers/reportController");

router.get("/reports/item/sales", (req, res) => {
  authController
    .checkAccessToken(req)
    .then(() => {
      reportController
        .getItemSalesReport(req)
        .then((value) => {
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

router.get("/reports/transaction/sales", (req, res) => {
  authController
    .checkAccessToken(req)
    .then(() => {
      reportController
        .getTransactionSalesReport(req)
        .then((value) => {
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

router.get("/reports/transaction/closing", (req, res) => {
  authController
    .checkAccessToken(req)
    .then(() => {
      reportController
        .getClosingReport(req)
        .then((value) => {
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
