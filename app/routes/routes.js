const router = require("express").Router();

// Aldil
const relayController = require('../controllers/relayController');

// routes
const authRouter = require("./authRouter/authRouter");
const userRouter = require("./userRouter/userRouter");
const resourceRouter = require("./resourceRouter/resourceRouter");
const businessRouter = require("./businessRouter/businessRouter");
const outletRouter = require("./outletRouter/outletRouter");
const itemRouter = require("./itemRouter/itemRouter");
const transactionRouter = require("./transactionRouter/transactionRouter");
const reportRouter = require("./reportRouter/reportRouter");

// new routes
const offerRouter = require("./offerRouter/offerRouter");
const categoryRouter = require("./categoryRouter/categoryRouter");
const inventoryRouter = require("./inventoryRouter/inventoryRouter");
const balanceTransactionRouter = require("./balanceTransactionRouter/balanceTransactionRouter");
const poolTableRouter = require("./poolTableRouter/poolTableRouter");
const poolTableTransactionRouter = require("./poolTableTransactionRouter/poolTableTransactionRouter");

// --- Gunakan router dari relayController ---
router.use('/', relayController.router); // Gunakan router dari relayController

router.use(authRouter);
router.use(userRouter);
router.use(resourceRouter);
router.use(businessRouter);
router.use(outletRouter);
router.use(itemRouter);
router.use(transactionRouter);
router.use(reportRouter);
router.use(offerRouter);
router.use(categoryRouter);
router.use(inventoryRouter);
router.use(poolTableRouter);
router.use(poolTableTransactionRouter);
router.use(balanceTransactionRouter);

// --- Hapus rute ini, karena sudah didefinisikan di relayController.router ---
// router.get('/', (req, res) => {
//   res.send('Hello from the server!');
// });

// router.post('/relay', relayController.controlRelay); 
// router.get('/poll/:esp', relayController.pollRelay); 
// router.get('/light-status', (req, res) => {
//   res.json(lightStates);
// });

module.exports = router; 