const router = require("express").Router();

const authController = require("../../controllers/authController");

router
  .route("/auth")
  .post("/login", (req, res) => {
    authController
      .login(req.body)
      .then((value) => {
        res.status(200).send(value);
      })
      .catch((err) => {
        res.status(500).send(err);
      });
  })
  .post("/logout", (req, res) => {
    authController
      .login(req)
      .then((value) => {
        res.status(200).send(value);
      })
      .catch((err) => {
        res.status(500).send(err);
      });
  });
