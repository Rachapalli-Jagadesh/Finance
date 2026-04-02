const router = require("express").Router();
const { body } = require("express-validator");
const { validate } = require("../middleware/validate");
const { authenticate } = require("../middleware/auth");
const { loginHandler, meHandler } = require("../controllers/authController");

/**
 * POST /api/auth/login
 * Public — returns JWT on valid credentials.
 */
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email required").normalizeEmail(),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  validate,
  loginHandler
);

/**
 * GET /api/auth/me
 * Protected — returns the currently authenticated user.
 */
router.get("/me", authenticate, meHandler);

module.exports = router;
