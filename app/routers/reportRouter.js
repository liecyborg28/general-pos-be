const router = require("express").Router();

// controllers
const authController = require("../controllers/authController");
const reportController = require("../controllers/reportController");

router.get("/reports/sales/by/outlet", (req, res) => {
  authController
    .checkAccess(req)
    .then(() => {
      reportController
        .generateSalesReportByOutlet(req)
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

router.get("/reports/sales/by/user", (req, res) => {
  authController
    .checkAccess(req)
    .then(() => {
      reportController
        .generateSalesReportByUser(req)
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

router.get("/reports/sales/by/transaction", (req, res) => {
  authController
    .checkAccess(req)
    .then(() => {
      reportController
        .generateSalesReportByTransaction(req)
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

router.get("/reports/sales/by/payment", (req, res) => {
  authController
    .checkAccess(req)
    .then(() => {
      reportController
        .generateSalesReportByPaymentMethod(req)
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

router.get("/reports/sales/by/service", (req, res) => {
  authController
    .checkAccess(req)
    .then(() => {
      reportController
        .generateSalesReportByServiceMethod(req)
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
