const router = require("express").Router();

// controllers
const authController = require("../controllers/authController");
const warehouseController = require("../controllers/warehouseController");

router
  .route("/warehouses")
  .get((req, res) => {
    // authController
    //   .checkAccess(req)
    //   .then(() => {
    warehouseController
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
        warehouseController
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
        warehouseController
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
