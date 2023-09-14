const router = require("express").Router();

// routes
const userRouter = require("./userRouter/userRouter");

router.use(userRouter);

module.exports = router;
