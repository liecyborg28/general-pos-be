const router = require("express").Router();
const authController = require("../../controllers/authController");
const resourceController = require("../../controllers/resourceController");

router.get("/resources/transaction", (req, res) => {
  authController
    .checkAccessToken(req)
    .then(() => {
      resourceController
        .getTransactionResource()
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

router.get("/resources/item", (req, res) => {
  authController
    .checkAccessToken(req)
    .then(() => {
      resourceController
        .getItemResource()
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

router.get("/resources/outlet", (req, res) => {
  authController
    .checkAccessToken(req)
    .then(() => {
      resourceController
        .getOutletResource()
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

router.get("/resources/outlet", (req, res) => {
  authController
    .checkAccessToken(req)
    .then(() => {
      resourceController
        .getOutletResource()
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

router.get("/resources/inventory", (req, res) => {
  authController
    .checkAccessToken(req)
    .then(() => {
      resourceController
        .getInventoryResource()
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
