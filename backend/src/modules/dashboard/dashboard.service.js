const dashboardRepository = require("./dashboard.repository");

async function getDashboard() {
  const [kpis, salesLast7Days, topProducts, recentActivity, lowStockAlerts] =
    await Promise.all([
      dashboardRepository.getKpis(),
      dashboardRepository.getSalesLast7Days(),
      dashboardRepository.getTopProducts(),
      dashboardRepository.getRecentActivity(),
      dashboardRepository.getLowStockAlerts(),
    ]);
  return {
    kpis,
    salesLast7Days,
    topProducts,
    recentActivity,
    lowStockAlerts,
  };
}

module.exports = { getDashboard };
