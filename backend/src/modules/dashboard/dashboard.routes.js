const express = require("express");
const dashboardController = require("./dashboard.controller");
const { authenticate } = require("../../shared/middlewares/auth.middleware");
const router = express.Router();
router.get("/", authenticate, dashboardController.getDashboard);
module.exports = router;
