const router = require("express").Router();

// controllers
const authController = require("../controllers/authController");
const reportController = require("../controllers/reportController");

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

module.exports = router;
