const router = require("express").Router();
const { body, param, query } = require("express-validator");
const { validate } = require("../middleware/validate");
const { authenticate, authorize } = require("../middleware/auth");
const {
  createUserHandler,
  listUsersHandler,
  getUserHandler,
  updateUserHandler,
  deactivateUserHandler,
} = require("../controllers/userController");

// All user management routes require authentication + ADMIN role
router.use(authenticate);

/**
 * GET /api/users
 * Admin — list all users with optional role/status filter.
 */
router.get(
  "/",
  authorize("READ_USERS"),
  [
    query("role").optional().isIn(["viewer", "analyst", "admin"]).withMessage("Invalid role"),
    query("status").optional().isIn(["active", "inactive"]).withMessage("Invalid status"),
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
  ],
  validate,
  listUsersHandler
);

/**
 * POST /api/users
 * Admin — create a new user.
 */
router.post(
  "/",
  authorize("CREATE_USER"),
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email required").normalizeEmail(),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters"),
    body("role")
      .isIn(["viewer", "analyst", "admin"])
      .withMessage("Role must be viewer, analyst, or admin"),
  ],
  validate,
  createUserHandler
);

/**
 * GET /api/users/:id
 * Admin — get a user by ID.
 */
router.get(
  "/:id",
  authorize("READ_USERS"),
  [param("id").isUUID().withMessage("Invalid user ID")],
  validate,
  getUserHandler
);

/**
 * PATCH /api/users/:id
 * Admin — update user fields.
 */
router.patch(
  "/:id",
  authorize("UPDATE_USER"),
  [
    param("id").isUUID().withMessage("Invalid user ID"),
    body("name").optional().trim().notEmpty(),
    body("email").optional().isEmail().normalizeEmail(),
    body("password").optional().isLength({ min: 8 }),
    body("role").optional().isIn(["viewer", "analyst", "admin"]),
    body("status").optional().isIn(["active", "inactive"]),
  ],
  validate,
  updateUserHandler
);

/**
 * DELETE /api/users/:id
 * Admin — soft-deactivate a user.
 */
router.delete(
  "/:id",
  authorize("DELETE_USER"),
  [param("id").isUUID().withMessage("Invalid user ID")],
  validate,
  deactivateUserHandler
);

module.exports = router;
