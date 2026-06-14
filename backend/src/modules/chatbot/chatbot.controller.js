const chatbotService = require("./chatbot.service");
const { asyncHandler } = require("../../shared/utils/async-handler");
const { sendSuccess } = require("../../shared/utils/http-response");

const chat = asyncHandler(async (req, res) => {
  const { message } = req.body;
  if (!message) return sendSuccess(res, null, "Mensaje vacío");
  const response = await chatbotService.processMessage(message);
  return sendSuccess(res, response, "Respuesta del chatbot");
});

module.exports = { chat };
