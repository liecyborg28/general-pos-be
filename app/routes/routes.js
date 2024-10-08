const router = require("express").Router();

// routes
const authRouter = require("./authRouter/authRouter");
const businessRouter = require("./businessRouter/businessRouter");
const categoryRouter = require("./categoryRouter/categoryRouter");
const inventoryRouter = require("./inventoryRouter/inventoryRouter");
const productRouter = require("./productRouter/productRouter");
const offerRouter = require("./offerRouter/offerRouter");
const outletRouter = require("./outletRouter/outletRouter");
const receiptRouter = require("./receiptRouter/receiptRouter");
const reportRouter = require("./reportRouter/reportRouter");
const resourceRouter = require("./resourceRouter/resourceRouter");
const roleRouter = require("./roleRouter/roleRouter");
const transactionRouter = require("./transactionRouter/transactionRouter");
const userRouter = require("./userRouter/userRouter");

router.use(authRouter);
router.use(businessRouter);
router.use(categoryRouter);
// router.use(inventoryRouter);
// router.use(productRouter);
// router.use(offerRouter);
router.use(outletRouter);
// router.use(receiptRouter);
// router.use(reportRouter);
// router.use(resourceRouter);
router.use(roleRouter);
// router.use(transactionRouter);
router.use(userRouter);

module.exports = router;
