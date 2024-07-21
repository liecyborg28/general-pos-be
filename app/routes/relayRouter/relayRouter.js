const router = require("express").Router();

const authController = require("../../controllers/authController");
const relayController = require("../../controllers/relayController");

router.post("/relay", (req, res) => {
  authController
    .checkAccessToken(req)
    .then(() => {
      relayController
        .controlRelay(req, res)
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
