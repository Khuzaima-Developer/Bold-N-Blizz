const express = require("express");
const router = express.Router();

// require pages
const ordersController = require("../controllers/orders.js");
const wrapAsync = require("../utils/error-handler/wrapAsync.js");

router.get("/updates", wrapAsync(ordersController.orderUpdates));

router.get("/delivers", wrapAsync(ordersController.deliveredOrders));

router.get("/returns", wrapAsync(ordersController.returnedOrders));

router.get("/undelivers", wrapAsync(ordersController.undelivers));

router.get("/bookings", wrapAsync(ordersController.bookings));

router.get("/update-data", wrapAsync(ordersController.updateData));

router.get("/stop-func", wrapAsync(ordersController.stopFunc));

module.exports = router;
