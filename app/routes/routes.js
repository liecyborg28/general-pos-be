const router = require("express").Router();

// routes
const authRouter = require("./authRouter/authRouter");
const userRouter = require("./userRouter/userRouter");
const businessRouter = require("./businessRouter/businessRouter");
const outletRouter = require("./outletRouter/outletRouter");
const itemRouter = require("./itemRouter/itemRouter");

router.use(authRouter);
router.use(userRouter);
router.use(businessRouter);
router.use(outletRouter);
router.use(itemRouter);

module.exports = router;
