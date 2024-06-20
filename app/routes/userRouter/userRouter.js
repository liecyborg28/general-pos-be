const router = require("express").Router();

const authController = require("../../controllers/authController");
const userController = require("../../controllers/userController");

const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.get("/users/bulk/template", (req, res) => {
  authController
    .checkAccessToken(req)
    .then(() => {
      userController
        .getBulkUserTemplate(req)
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

router.post("/users/bulk", upload.single("file"), (req, res) => {
  authController
    .checkAccessToken(req)
    .then(() => {
      userController
        .createBulkUser(req)
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

router.post("/users/register", (req, res) => {
  userController
    .registerUser(req.body)
    .then((value) => {
      res.status(200).send(value);
    })
    .catch((err) => {
      res.status(500).send(err);
    });
});

router
  .route("/users")
  .get((req, res) => {
    authController
      .checkAccessToken(req)
      .then(() => {
        userController
          .getUsers(req)
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
        userController
          .createUser(req.body)
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
        userController
          .updateUser(req.body)
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
