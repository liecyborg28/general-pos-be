const router = require("express").Router();

// controllers
const authController = require("../controllers/authController");
const transactionController = require("../controllers/transactionController");

router.route("/transactions/order").post((req, res) => {
  transactionController
    .createOrder(req)
    .then((value) => {
      res.status(200).send(value);
    })
    .catch((err) => {
      res.status(500).send(err);
    });
});

router
  .route("/transactions")
  .get((req, res) => {
    authController
      .checkAccess(req)
      .then(() => {
        transactionController
          .get(req)
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
      .checkAccess(req)
      .then(() => {
        transactionController
          .create(req)
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
      .checkAccess(req)
      .then(() => {
        transactionController
          .update(req)
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
