const router = require("express").Router();
const authController = require("../../controllers/authController");
const balanceTransactionController = require("../../controllers/balanceTransactionController");

router.get("/balanceTransactions/period", (req, res) => {
  authController
    .checkAccessToken(req)
    .then(() => {
      balanceTransactionController
        .getBalanceTransactionsByPeriod(req)
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

router
  .route("/balanceTransactions")
  .post((req, res) => {
    authController
      .checkAccessToken(req)
      .then(() => {
        balanceTransactionController
          .createBalanceTransaction(req)
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
  })
  .patch((req, res) => {
    authController
      .checkAccessToken(req)
      .then(() => {
        balanceTransactionController
          .updateBalanceTransaction(req)
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
