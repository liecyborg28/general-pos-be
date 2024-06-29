const router = require("express").Router();
const authController = require("../../controllers/authController");
const poolTableController = require("../../controllers/poolTableController");

router
  .route("/poolTables")
  .get((req, res) => {
    authController
      .checkAccessToken(req)
      .then(() => {
        poolTableController
          .getPoolTables(req)
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
        poolTableController
          .createPoolTable(req)
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
        poolTableController
          .updatePoolTable(req)
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
