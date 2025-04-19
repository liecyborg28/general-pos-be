const router = require("express").Router();

// controllers
const authController = require("../controllers/authController");
const discordController = require("../controllers/utils/discordController");
const slackController = require("../controllers/utils/slackController");

router.route("/notifications/slack").post((req, res) => {
  // authController
  //   .checkAccess(req)
  //   .then(() => {
  slackController
    .sendMessageToSlackWebhook(req.body.type, req.body.text, req.body.link)
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
});

router.route("/notifications/discord").post((req, res) => {
  // authController
  //   .checkAccess(req)
  //   .then(() => {
  discordController
    .sendMessageToDiscordWebhook(req.body.type, req.body.text, req.body.link)
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
});

module.exports = router;
