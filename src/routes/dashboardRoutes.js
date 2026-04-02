const router = require("express").Router();
const { query } = require("express-validator");
const { validate } = require("../middleware/validate");
const { authenticate, authorize } = require("../middleware/auth");
const {
  summaryHandler,
  categoryTotalsHandler,
  monthlyTrendsHandler,
  weeklyTrendsHandler,
  recentActivityHandler,
  insightsHandler,
} = require("../controllers/dashboardController");

router.use(authenticate);

const dateFilters = [
  query("startDate").optional().isISO8601().withMessage("startDate must be YYYY-MM-DD"),
  query("endDate").optional().isISO8601().withMessage("endDate must be YYYY-MM-DD"),
];

/**
 * GET /api/dashboard/summary
 * All roles — total income, expenses, net balance.
 */
router.get("/summary", authorize("READ_DASHBOARD"), dateFilters, validate, summaryHandler);

/**
 * GET /api/dashboard/categories
 * All roles — category-wise totals.
 */
router.get("/categories", authorize("READ_DASHBOARD"), dateFilters, validate, categoryTotalsHandler);

/**
 * GET /api/dashboard/trends/monthly
 * All roles — monthly income vs expense trend.
 */
router.get(
  "/trends/monthly",
  authorize("READ_DASHBOARD"),
  [query("months").optional().isInt({ min: 1, max: 24 })],
  validate,
  monthlyTrendsHandler
);

/**
 * GET /api/dashboard/trends/weekly
 * All roles — weekly trend.
 */
router.get(
  "/trends/weekly",
  authorize("READ_DASHBOARD"),
  [query("weeks").optional().isInt({ min: 1, max: 52 })],
  validate,
  weeklyTrendsHandler
);

/**
 * GET /api/dashboard/activity
 * All roles — recent transactions.
 */
router.get(
  "/activity",
  authorize("READ_DASHBOARD"),
  [query("limit").optional().isInt({ min: 1, max: 50 })],
  validate,
  recentActivityHandler
);

/**
 * GET /api/dashboard/insights
 * Analyst + Admin only — deep analytics.
 */
router.get("/insights", authorize("READ_INSIGHTS"), dateFilters, validate, insightsHandler);

module.exports = router;
