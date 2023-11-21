const router = require("express").Router();

// routes
const authRouter = require("./authRouter/authRouter");
const userRouter = require("./userRouter/userRouter");
const resourceRouter = require("./resourceRouter/resourceRouter");
const businessRouter = require("./businessRouter/businessRouter");
const outletRouter = require("./outletRouter/outletRouter");
const itemRouter = require("./itemRouter/itemRouter");
const transactionRouter = require("./transactionRouter/transactionRouter");
const reportRouter = require("./reportRouter/reportRouter");
const receiptRouter = require("./receiptRouter/receiptRouter");

router.use(authRouter);
router.use(userRouter);
router.use(resourceRouter);
router.use(businessRouter);
router.use(outletRouter);
router.use(itemRouter);
router.use(transactionRouter);
router.use(reportRouter);
router.use(receiptRouter);

module.exports = router;
