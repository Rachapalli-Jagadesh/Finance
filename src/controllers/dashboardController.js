const {
  getSummary,
  getCategoryTotals,
  getMonthlyTrends,
  getWeeklyTrends,
  getRecentActivity,
  getInsights,
} = require("../services/dashboardService");
const { success } = require("../utils/response");

function summaryHandler(req, res, next) {
  try {
    const { startDate, endDate } = req.query;
    const data = getSummary({ startDate, endDate });
    return success(res, data, "Dashboard summary");
  } catch (err) {
    next(err);
  }
}

function categoryTotalsHandler(req, res, next) {
  try {
    const { startDate, endDate } = req.query;
    const data = getCategoryTotals({ startDate, endDate });
    return success(res, data, "Category totals");
  } catch (err) {
    next(err);
  }
}

function monthlyTrendsHandler(req, res, next) {
  try {
    const months = Math.min(parseInt(req.query.months) || 12, 24);
    const data = getMonthlyTrends({ months });
    return success(res, data, "Monthly trends");
  } catch (err) {
    next(err);
  }
}

function weeklyTrendsHandler(req, res, next) {
  try {
    const weeks = Math.min(parseInt(req.query.weeks) || 8, 52);
    const data = getWeeklyTrends({ weeks });
    return success(res, data, "Weekly trends");
  } catch (err) {
    next(err);
  }
}

function recentActivityHandler(req, res, next) {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const data = getRecentActivity({ limit });
    return success(res, data, "Recent activity");
  } catch (err) {
    next(err);
  }
}

function insightsHandler(req, res, next) {
  try {
    const { startDate, endDate } = req.query;
    const data = getInsights({ startDate, endDate });
    return success(res, data, "Financial insights");
  } catch (err) {
    next(err);
  }
}

module.exports = {
  summaryHandler,
  categoryTotalsHandler,
  monthlyTrendsHandler,
  weeklyTrendsHandler,
  recentActivityHandler,
  insightsHandler,
};
