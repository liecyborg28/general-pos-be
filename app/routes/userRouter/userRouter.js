const router = require("express").Router();

const userModel = require("../../models/userModel");

const userController = require("../../controllers/userController");

router
  .route("/users")
  .get((req, res) => {
    userController
      .getUsers()
      .then((value) => {
        res.status(200).send(value);
      })
      .catch((err) => {
        res.status(500).send(err);
      });
  })
  .post((req, res) => {
    userController
      .createUser(req.body)
      .then((value) => {
        res.status(200).send(value);
      })
      .catch((err) => {
        res.status(500).send(err);
      });
  })
  .patch((req, res) => {
    res.send("Patch User OK");
  });

module.exports = router;
