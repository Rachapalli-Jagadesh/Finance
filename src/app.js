require("dotenv").config();

const express = require("express");
const helmet  = require("helmet");
const morgan  = require("morgan");
const rateLimit = require("express-rate-limit");

const { getDB }          = require("./database");
const authRoutes         = require("./routes/authRoutes");
const userRoutes         = require("./routes/userRoutes");
const recordRoutes       = require("./routes/recordRoutes");
const dashboardRoutes    = require("./routes/dashboardRoutes");
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");

const app  = express();
const PORT = process.env.PORT || 3000;

// ─── Security & Logging ───────────────────────────────────────────────────────
app.use(helmet());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// ─── Rate Limiting ────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max:      parseInt(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, message: "Too many requests. Please try again later." },
});
app.use(limiter);

// ─── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: false }));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({
    success: true,
    message: "Finance Backend is running",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use("/api/auth",      authRoutes);
app.use("/api/users",     userRoutes);
app.use("/api/records",   recordRoutes);
app.use("/api/dashboard", dashboardRoutes);

// ─── Error Handling ───────────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ─── Start ────────────────────────────────────────────────────────────────────
async function start() {
  await getDB();   // initialise & migrate schema
  app.listen(PORT, () => {
    console.log(`\n Finance Backend running on http://localhost:${PORT}`);
    console.log(`Health: http://localhost:${PORT}/health`);
    console.log(` Login:  POST http://localhost:${PORT}/api/auth/login\n`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});

module.exports = app; // for testing
