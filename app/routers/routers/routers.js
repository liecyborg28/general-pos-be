const router = require("express").Router();

// routes
const authRouter = require("../authRouter");
const businessRouter = require("../businessRouter");
const categoryRouter = require("../categoryRouter");
const chargeRouter = require("../chargeRouter");
const componentRouter = require("../componentRouter");
const currencyRouter = require("../currencyRouter");
const customerRouter = require("../customerRouter");
const productRouter = require("../productRouter");
const promotionRouter = require("../promotionRouter");
const outletRouter = require("../outletRouter");
const paymentMethodRouter = require("../paymentMethodRouter");
const serviceMethodRouter = require("../serviceMethodRouter");
const receiptRouter = require("../receiptRouter");
const reportRouter = require("../reportRouter");
const resourceRouter = require("../resourceRouter");
const roleRouter = require("../roleRouter");
const taxRouter = require("../taxRouter");
const transactionRouter = require("../transactionRouter");
const unitRouter = require("../unitRouter");
const userRouter = require("../userRouter");

router.use(authRouter);
router.use(businessRouter);
router.use(categoryRouter);
router.use(chargeRouter);
router.use(componentRouter);
router.use(currencyRouter);
router.use(customerRouter);
router.use(productRouter);
router.use(promotionRouter);
router.use(outletRouter);
router.use(paymentMethodRouter);
router.use(serviceMethodRouter);
// router.use(receiptRouter);
// router.use(reportRouter);
// router.use(resourceRouter);
router.use(roleRouter);
// router.use(transactionRouter);
router.use(taxRouter);
router.use(unitRouter);
router.use(userRouter);

module.exports = router;
