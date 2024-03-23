const router = require("express").Router();

const authController = require("../../controllers/authController");
const outletController = require("../../controllers/outletController");

router
  .route("/outlets")
  .get((req, res) => {
    authController
      .checkAccessToken(req)
      .then(() => {
        outletController
          .getOutlets(req)
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
        outletController
          .createOutlet(req)
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
        outletController
          .updateOutlet(req)
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
