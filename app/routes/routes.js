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
//Aldil
const balanceTransactionController = require('../controllers/balanceTransactionController');

// const receiptRouter = require("./receiptRouter/receiptRouter");

// new routes
const offerRouter = require("./offerRouter/offerRouter");
const categoryRouter = require("./categoryRouter/categoryRouter");
const inventoryRouter = require("./inventoryRouter/inventoryRouter");

router.use(authRouter);
router.use(userRouter);
router.use(resourceRouter);
router.use(businessRouter);
router.use(outletRouter);
router.use(itemRouter);
router.use(transactionRouter);
router.use(reportRouter);
// router.use(receiptRouter);
router.use(offerRouter);
router.use(categoryRouter);
router.use(inventoryRouter);
//Aldil
router.post('/topUp', balanceTransactionController.topUp);
router.post('/handleMidtransNotification', balanceTransactionController.handleMidtransNotification);
router.get('/balanceTransactions', balanceTransactionController.getBalanceTransactionsByPeriod);
router.put('/balanceTransactions/:transactionId', balanceTransactionController.updateBalanceTransaction);


module.exports = router;
