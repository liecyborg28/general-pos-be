const router = require("express").Router();

const authController = require("../controllers/authController");
const promotionController = require("../controllers/promotionController");

router
  .route("/promotions")
  .get((req, res) => {
    authController
      .checkAccess(req)
      .then(() => {
        promotionController
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
        promotionController
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
        promotionController
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
