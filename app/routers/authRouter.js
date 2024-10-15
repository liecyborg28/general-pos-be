const router = require("express").Router();

const authController = require("../controllers/authController");

router.post("/auth/create", (req, res) => {
  authController
    .createAccess(req)
    .then((value) => {
      res.status(200).send(value);
    })
    .catch((err) => {
      res.status(500).send(err);
    });
});

router.post("/auth/login", (req, res) => {
  authController
    .login(req)
    .then((value) => {
      res.status(200).send(value);
    })
    .catch((err) => {
      res.status(500).send(err);
    });
});

module.exports = router;
