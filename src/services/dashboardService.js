const { get, all } = require("../database");

/**
 * High-level summary: total income, total expenses, net balance, record count.
 */
function getSummary({ startDate, endDate } = {}) {
  const conditions = ["deleted = 0"];
  const params = [];

  if (startDate) { conditions.push("date >= ?"); params.push(startDate); }
  if (endDate)   { conditions.push("date <= ?"); params.push(endDate); }

  const where = "WHERE " + conditions.join(" AND ");

  const income = get(
    `SELECT COALESCE(SUM(amount), 0) as total FROM financial_records ${where} AND type = 'income'`,
    params
  ).total;

  const expense = get(
    `SELECT COALESCE(SUM(amount), 0) as total FROM financial_records ${where} AND type = 'expense'`,
    params
  ).total;

  const count = get(
    `SELECT COUNT(*) as count FROM financial_records ${where}`,
    params
  ).count;

  return {
    total_income: income,
    total_expenses: expense,
    net_balance: income - expense,
    record_count: count,
  };
}

/**
 * Category-wise totals broken down by type.
 */
function getCategoryTotals({ startDate, endDate } = {}) {
  const conditions = ["deleted = 0"];
  const params = [];

  if (startDate) { conditions.push("date >= ?"); params.push(startDate); }
  if (endDate)   { conditions.push("date <= ?"); params.push(endDate); }

  const where = "WHERE " + conditions.join(" AND ");

  const rows = all(
    `SELECT category, type, SUM(amount) as total, COUNT(*) as count
     FROM financial_records ${where}
     GROUP BY category, type
     ORDER BY total DESC`,
    params
  );

  // Reshape: { category -> { income: X, expense: Y, net: Z } }
  const map = {};
  for (const row of rows) {
    if (!map[row.category]) map[row.category] = { category: row.category, income: 0, expense: 0, count: 0 };
    map[row.category][row.type] = row.total;
    map[row.category].count += row.count;
  }

  const result = Object.values(map).map((c) => ({
    ...c,
    net: c.income - c.expense,
  }));

  return result;
}

/**
 * Monthly trend: income vs expenses per calendar month.
 * Returns last N months (default 12).
 */
function getMonthlyTrends({ months = 12 } = {}) {
  const rows = all(
    `SELECT
       strftime('%Y-%m', date) as month,
       type,
       SUM(amount) as total,
       COUNT(*) as count
     FROM financial_records
     WHERE deleted = 0
       AND date >= date('now', '-' || ? || ' months')
     GROUP BY month, type
     ORDER BY month ASC`,
    [months]
  );

  // Reshape into month -> { income, expense, net }
  const map = {};
  for (const row of rows) {
    if (!map[row.month]) map[row.month] = { month: row.month, income: 0, expense: 0, count: 0 };
    map[row.month][row.type] = row.total;
    map[row.month].count += row.count;
  }

  return Object.values(map).map((m) => ({ ...m, net: m.income - m.expense }));
}

/**
 * Weekly trend: last N weeks.
 */
function getWeeklyTrends({ weeks = 8 } = {}) {
  const rows = all(
    `SELECT
       strftime('%Y-W%W', date) as week,
       type,
       SUM(amount) as total,
       COUNT(*) as count
     FROM financial_records
     WHERE deleted = 0
       AND date >= date('now', '-' || ? || ' days')
     GROUP BY week, type
     ORDER BY week ASC`,
    [weeks * 7]
  );

  const map = {};
  for (const row of rows) {
    if (!map[row.week]) map[row.week] = { week: row.week, income: 0, expense: 0, count: 0 };
    map[row.week][row.type] = row.total;
    map[row.week].count += row.count;
  }

  return Object.values(map).map((w) => ({ ...w, net: w.income - w.expense }));
}

/**
 * Recent activity: last N records.
 */
function getRecentActivity({ limit = 10 } = {}) {
  return all(
    `SELECT r.*, u.name as user_name
     FROM financial_records r
     LEFT JOIN users u ON r.user_id = u.id
     WHERE r.deleted = 0
     ORDER BY r.created_at DESC
     LIMIT ?`,
    [limit]
  );
}

/**
 * Analyst-only deep insights:
 * - top spending categories
 * - income vs expense ratio
 * - average transaction size
 */
function getInsights({ startDate, endDate } = {}) {
  const conditions = ["deleted = 0"];
  const params = [];

  if (startDate) { conditions.push("date >= ?"); params.push(startDate); }
  if (endDate)   { conditions.push("date <= ?"); params.push(endDate); }

  const where = "WHERE " + conditions.join(" AND ");

  const avgIncome = get(
    `SELECT COALESCE(AVG(amount), 0) as avg FROM financial_records ${where} AND type = 'income'`,
    params
  ).avg;

  const avgExpense = get(
    `SELECT COALESCE(AVG(amount), 0) as avg FROM financial_records ${where} AND type = 'expense'`,
    params
  ).avg;

  const topExpenseCategories = all(
    `SELECT category, SUM(amount) as total, COUNT(*) as count
     FROM financial_records ${where} AND type = 'expense'
     GROUP BY category
     ORDER BY total DESC
     LIMIT 5`,
    params
  );

  const topIncomeCategories = all(
    `SELECT category, SUM(amount) as total, COUNT(*) as count
     FROM financial_records ${where} AND type = 'income'
     GROUP BY category
     ORDER BY total DESC
     LIMIT 5`,
    params
  );

  const summary = getSummary({ startDate, endDate });
  const incomeExpenseRatio =
    summary.total_expenses > 0
      ? +(summary.total_income / summary.total_expenses).toFixed(2)
      : null;

  const savingsRate =
    summary.total_income > 0
      ? +((summary.net_balance / summary.total_income) * 100).toFixed(2)
      : 0;

  return {
    average_income_per_transaction: +avgIncome.toFixed(2),
    average_expense_per_transaction: +avgExpense.toFixed(2),
    income_to_expense_ratio: incomeExpenseRatio,
    savings_rate_percent: savingsRate,
    top_expense_categories: topExpenseCategories,
    top_income_categories: topIncomeCategories,
  };
}

module.exports = {
  getSummary,
  getCategoryTotals,
  getMonthlyTrends,
  getWeeklyTrends,
  getRecentActivity,
  getInsights,
};
