const express = require('express');
const router = express.Router();

// require pages
const homeController = require("../controllers/home.js");
const wrapAsync = require("../utils/error-handler/wrapAsync.js");

router.get('/', homeController.root);

module.exports = router;
