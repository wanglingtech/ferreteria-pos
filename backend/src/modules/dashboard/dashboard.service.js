const dashboardRepository = require('./dashboard.repository');

async function getDashboard() {
  return dashboardRepository.getKpis();
}

module.exports = {
  getDashboard,
};
