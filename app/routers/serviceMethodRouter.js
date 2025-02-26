const router = require("express").Router();

// controllers
const authController = require("../controllers/authController");
const serviceMethodController = require("../controllers/serviceMethodController");

router
  .route("/serviceMethods")
  .get((req, res) => {
    // authController
    //   .checkAccess(req)
    //   .then(() => {
    serviceMethodController
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
        serviceMethodController
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
        serviceMethodController
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
