const router = require("express").Router();

const authController = require("../controllers/authController");
const inventoryController = require("../controllers/inventoryController");

const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.get("/inventories/bulk/template", (req, res) => {
  authController
    .checkAccessToken(req)
    .then(() => {
      inventoryController
        .getBulkInventoryTemplate(req)
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

router.post("/inventories/bulk", upload.single("file"), (req, res) => {
  authController
    .checkAccessToken(req)
    .then(() => {
      inventoryController
        .createBulkInventory(req)
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

router
  .route("/inventories")
  .get((req, res) => {
    authController
      .checkAccessToken(req)
      .then(() => {
        inventoryController
          .getInventories(req)
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
        inventoryController
          .createInventory(req)
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
        inventoryController
          .updateInventory(req)
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
