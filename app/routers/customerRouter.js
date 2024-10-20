const router = require("express").Router();

// controllers
const authController = require("../controllers/authController");
const customerController = require("../controllers/customerController");

router
  .route("/users")
  .get((req, res) => {
    authController
      .checkAccess(req)
      .then(() => {
        customerController
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
        customerController
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
        customerController
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
