const router = require("express").Router();

const authController = require("../../controllers/authController");
const itemController = require("../../controllers/itemController");

const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.get("/items/bulk/template", (req, res) => {
  authController.checkAccessToken(req).then(() => {
    itemController
      .getBulkItemTemplate(req)
      .then((value) => {
        res.status(200).send(value);
      })
      .catch((err) => {
        res.status(500).send(err);
      });
  });
});

router.post("/items/bulk", upload.single("file"), (req, res) => {
  authController.checkAccessToken(req).then(() => {
    itemController
      .createBulkItem(req)
      .then((value) => {
        res.status(200).send(value);
      })
      .catch((err) => {
        res.status(500).send(err);
      });
  });
});

router
  .route("/items")
  .get((req, res) => {
    authController
      .checkAccessToken(req)
      .then(() => {
        itemController
          .getItems(req)
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
        itemController
          .createItem(req)
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
        itemController
          .updateItem(req)
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
