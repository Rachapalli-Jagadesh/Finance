const router = require("express").Router();
const { body, param, query } = require("express-validator");
const { validate } = require("../middleware/validate");
const { authenticate, authorize } = require("../middleware/auth");
const {
  createRecordHandler,
  listRecordsHandler,
  getRecordHandler,
  updateRecordHandler,
  deleteRecordHandler,
} = require("../controllers/recordController");
const { CATEGORIES } = require("../utils/constants");

router.use(authenticate);

/**
 * GET /api/records
 * Viewer, Analyst, Admin — list records with filters and pagination.
 */
router.get(
  "/",
  authorize("READ_RECORDS"),
  [
    query("type").optional().isIn(["income", "expense"]),
    query("category").optional().isIn(CATEGORIES),
    query("startDate").optional().isISO8601().withMessage("startDate must be YYYY-MM-DD"),
    query("endDate").optional().isISO8601().withMessage("endDate must be YYYY-MM-DD"),
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("sortBy").optional().isIn(["date", "amount", "category", "type", "created_at"]),
    query("sortDir").optional().isIn(["ASC", "DESC", "asc", "desc"]),
  ],
  validate,
  listRecordsHandler
);

/**
 * POST /api/records
 * Admin only — create a new financial record.
 */
router.post(
  "/",
  authorize("CREATE_RECORD"),
  [
    body("amount")
      .isFloat({ gt: 0 })
      .withMessage("Amount must be a positive number"),
    body("type")
      .isIn(["income", "expense"])
      .withMessage("Type must be 'income' or 'expense'"),
    body("category")
      .isIn(CATEGORIES)
      .withMessage(`Category must be one of: ${CATEGORIES.join(", ")}`),
    body("date")
      .isISO8601()
      .withMessage("Date must be in YYYY-MM-DD format"),
    body("notes").optional().isString().isLength({ max: 500 }),
  ],
  validate,
  createRecordHandler
);

/**
 * GET /api/records/:id
 * Viewer, Analyst, Admin — get a single record.
 */
router.get(
  "/:id",
  authorize("READ_RECORDS"),
  [param("id").isUUID().withMessage("Invalid record ID")],
  validate,
  getRecordHandler
);

/**
 * PATCH /api/records/:id
 * Admin only — update a record.
 */
router.patch(
  "/:id",
  authorize("UPDATE_RECORD"),
  [
    param("id").isUUID().withMessage("Invalid record ID"),
    body("amount").optional().isFloat({ gt: 0 }),
    body("type").optional().isIn(["income", "expense"]),
    body("category").optional().isIn(CATEGORIES),
    body("date").optional().isISO8601(),
    body("notes").optional().isString().isLength({ max: 500 }),
  ],
  validate,
  updateRecordHandler
);

/**
 * DELETE /api/records/:id
 * Admin only — soft-delete a record.
 */
router.delete(
  "/:id",
  authorize("DELETE_RECORD"),
  [param("id").isUUID().withMessage("Invalid record ID")],
  validate,
  deleteRecordHandler
);

module.exports = router;
