const router = require("express").Router();

// controllers
const authController = require("../../controllers/authController");
const outletController = require("../../controllers/outletController");

router
  .route("/outlets")
  .get((req, res) => {
    authController
      .checkAccess(req)
      .then(() => {
        outletController
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
        outletController
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
        outletController
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
