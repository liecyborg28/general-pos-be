const router = require("express").Router();

// routes
const authRouter = require("../authRouter");
const businessRouter = require("../businessRouter");
const categoryRouter = require("../categoryRouter");
const currencyRouter = require("../currencyRouter");
const inventoryRouter = require("../inventoryRouter");
const productRouter = require("../productRouter");
const offerRouter = require("../offerRouter");
const outletRouter = require("../outletRouter");
const receiptRouter = require("../receiptRouter");
const reportRouter = require("../reportRouter");
const resourceRouter = require("../resourceRouter");
const roleRouter = require("../roleRouter");
const transactionRouter = require("../transactionRouter");
const unitRouter = require("../unitRouter");
const userRouter = require("../userRouter");

router.use(authRouter);
router.use(businessRouter);
router.use(categoryRouter);
router.use(currencyRouter);
// router.use(inventoryRouter);
// router.use(productRouter);
// router.use(offerRouter);
router.use(outletRouter);
// router.use(receiptRouter);
// router.use(reportRouter);
// router.use(resourceRouter);
router.use(roleRouter);
// router.use(transactionRouter);
router.use(unitRouter);
router.use(userRouter);

module.exports = router;
