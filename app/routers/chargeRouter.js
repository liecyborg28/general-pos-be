const router = require("express").Router();

const authController = require("../controllers/authController");
const chargeController = require("../controllers/chargeController");

router
  .route("/charges")
  .get((req, res) => {
    // authController
    //   .checkAccess(req)
    //   .then(() => {
    chargeController
      .get(req)
      .then((value) => {
        res.status(200).send(value);
      })
      .catch((err) => {
        res.status(500).send(err);
      });
    // })
    // .catch((err) => {
    //   res.status(500).send(err);
    // });
  })
  .post((req, res) => {
    authController
      .checkAccess(req)
      .then(() => {
        chargeController
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
        chargeController
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
