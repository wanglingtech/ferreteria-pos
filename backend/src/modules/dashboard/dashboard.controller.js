const dashboardService = require("./dashboard.service");
const { asyncHandler } = require("../../shared/utils/async-handler");
const { sendSuccess } = require("../../shared/utils/http-response");

const getDashboard = asyncHandler(async (req, res) => {
  const data = await dashboardService.getDashboard();
  return sendSuccess(res, data, "Dashboard summary");
});

module.exports = { getDashboard };
