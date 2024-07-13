const router = require("express").Router();
const authController = require("../../controllers/authController");
const poolTableTransactionController = require("../../controllers/poolTableTransactionController");

router.get("/poolTableTransactions/period", (req, res) => {
  authController
    .checkAccessToken(req)
    .then(() => {
      poolTableTransactionController
        .getPoolTableTransactionsByPeriod(req)
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
  .route("/poolTableTransactions")
  .get((req, res) => {
    authController
      .checkAccessToken(req)
      .then(() => {
        poolTableTransactionController
          .getPoolTableTransactions(req)
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
  .post((req, res) => {
    authController
      .checkAccessToken(req)
      .then(() => {
        poolTableTransactionController
          .createPoolTableTransaction(req)
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
        poolTableTransactionController
          .updatePoolTableTransaction(req)
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
