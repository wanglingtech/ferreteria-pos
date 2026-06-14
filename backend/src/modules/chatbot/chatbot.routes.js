const express = require("express");
const chatbotController = require("./chatbot.controller");
const { authenticate } = require("../../shared/middlewares/auth.middleware");

const router = express.Router();
router.post("/", authenticate, chatbotController.chat);

module.exports = router;
