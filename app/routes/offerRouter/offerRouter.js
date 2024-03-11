const router = require("express").Router();

const authController = require("../../controllers/authController");
const advancementController = require("../../controllers/offerController");

router
  .route("/offers")
  .get((req, res) => {
    authController
      .checkAccessToken(req)
      .then(() => {
        advancementController
          .getOffers(req)
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
        advancementController
          .createOffer(req)
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
        advancementController
          .updateOffer(req)
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
