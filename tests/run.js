
require("dotenv").config();

const http = require("http");

const BASE = `http://localhost:${process.env.PORT || 3000}`;

let passed = 0;
let failed = 0;
const errors = [];

// ─── HTTP helper ─────────────────────────────────────────────────────────────
function req(method, path, { body, token } = {}) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const options = {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    };

    const request = http.request(BASE + path, options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    request.on("error", reject);
    if (payload) request.write(payload);
    request.end();
  });
}

// ─── Assertion helper ─────────────────────────────────────────────────────────
function assert(testName, condition, detail = "") {
  if (condition) {
    console.log(`   ${testName}`);
    passed++;
  } else {
    console.log(`   ${testName}${detail ? ` — ${detail}` : ""}`);
    failed++;
    errors.push(testName);
  }
}

// ─── Tests ────────────────────────────────────────────────────────────────────
async function runTests() {
  console.log("\n Running Finance Backend Tests\n");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  let adminToken, analystToken, viewerToken;
  let recordId;

  // ── 1. Health ──────────────────────────────────────────────────────────────
  console.log(" 1. Health Check");
  {
    const r = await req("GET", "/health");
    assert("GET /health returns 200", r.status === 200);
    assert("Health response has success: true", r.body.success === true);
  }

  // ── 2. Auth ────────────────────────────────────────────────────────────────
  console.log("\n 2. Authentication");
  {
    // Bad credentials
    const bad = await req("POST", "/api/auth/login", {
      body: { email: "nobody@nowhere.com", password: "wrongpass" },
    });
    assert("Login with wrong creds returns 401", bad.status === 401);

    // Validation — missing password
    const noPass = await req("POST", "/api/auth/login", {
      body: { email: "admin@finance.dev" },
    });
    assert("Login without password returns 400", noPass.status === 400);

    // Admin login
    const adminLogin = await req("POST", "/api/auth/login", {
      body: { email: "admin@finance.dev", password: "Admin@1234" },
    });
    assert("Admin login succeeds", adminLogin.status === 200);
    assert("Admin login returns token", !!adminLogin.body.data?.token);
    adminToken = adminLogin.body.data?.token;

    // Analyst login
    const analystLogin = await req("POST", "/api/auth/login", {
      body: { email: "analyst@finance.dev", password: "Analyst@1234" },
    });
    assert("Analyst login succeeds", analystLogin.status === 200);
    analystToken = analystLogin.body.data?.token;

    // Viewer login
    const viewerLogin = await req("POST", "/api/auth/login", {
      body: { email: "viewer@finance.dev", password: "Viewer@1234" },
    });
    assert("Viewer login succeeds", viewerLogin.status === 200);
    viewerToken = viewerLogin.body.data?.token;

    // /me endpoint
    const me = await req("GET", "/api/auth/me", { token: adminToken });
    assert("GET /me returns current user", me.status === 200 && me.body.data?.email === "admin@finance.dev");

    // /me without token
    const meUnauth = await req("GET", "/api/auth/me");
    assert("GET /me without token returns 401", meUnauth.status === 401);
  }

  // ── 3. Records — Admin CRUD ────────────────────────────────────────────────
  console.log("\n 3. Financial Records (Admin CRUD)");
  {
    // Create
    const create = await req("POST", "/api/records", {
      token: adminToken,
      body: { amount: 5000, type: "income", category: "salary", date: "2026-04-01", notes: "Test record" },
    });
    assert("Admin can create a record", create.status === 201);
    assert("Created record has correct amount", create.body.data?.amount === 5000);
    recordId = create.body.data?.id;

    // Read one
    const one = await req("GET", `/api/records/${recordId}`, { token: adminToken });
    assert("Admin can read a record by ID", one.status === 200);

    // List
    const list = await req("GET", "/api/records?type=income&limit=5", { token: adminToken });
    assert("Admin can list records with filter", list.status === 200);
    assert("List returns array", Array.isArray(list.body.data));
    assert("List returns pagination meta", !!list.body.meta?.total);

    // Update
    const update = await req("PATCH", `/api/records/${recordId}`, {
      token: adminToken,
      body: { amount: 7500, notes: "Updated notes" },
    });
    assert("Admin can update a record", update.status === 200);
    assert("Updated amount is correct", update.body.data?.amount === 7500);

    // Delete (soft)
    const del = await req("DELETE", `/api/records/${recordId}`, { token: adminToken });
    assert("Admin can soft-delete a record", del.status === 200);

    // Deleted record should 404
    const gone = await req("GET", `/api/records/${recordId}`, { token: adminToken });
    assert("Deleted record returns 404", gone.status === 404);
  }

  // ── 4. Records — Validation ────────────────────────────────────────────────
  console.log("\n 4. Input Validation");
  {
    const badAmount = await req("POST", "/api/records", {
      token: adminToken,
      body: { amount: -100, type: "income", category: "salary", date: "2026-04-01" },
    });
    assert("Negative amount returns 400", badAmount.status === 400);

    const badType = await req("POST", "/api/records", {
      token: adminToken,
      body: { amount: 100, type: "revenue", category: "salary", date: "2026-04-01" },
    });
    assert("Invalid type returns 400", badType.status === 400);

    const badDate = await req("POST", "/api/records", {
      token: adminToken,
      body: { amount: 100, type: "income", category: "salary", date: "not-a-date" },
    });
    assert("Invalid date returns 400", badDate.status === 400);

    const badCategory = await req("POST", "/api/records", {
      token: adminToken,
      body: { amount: 100, type: "income", category: "unicorn", date: "2026-04-01" },
    });
    assert("Invalid category returns 400", badCategory.status === 400);
  }

  // ── 5. RBAC — Viewer Restrictions ─────────────────────────────────────────
  console.log("\n 5. RBAC — Viewer Restrictions");
  {
    const viewRead = await req("GET", "/api/records", { token: viewerToken });
    assert("Viewer CAN read records", viewRead.status === 200);

    const viewCreate = await req("POST", "/api/records", {
      token: viewerToken,
      body: { amount: 100, type: "income", category: "salary", date: "2026-04-01" },
    });
    assert("Viewer CANNOT create records (403)", viewCreate.status === 403);

    const viewUsers = await req("GET", "/api/users", { token: viewerToken });
    assert("Viewer CANNOT list users (403)", viewUsers.status === 403);

    const viewInsights = await req("GET", "/api/dashboard/insights", { token: viewerToken });
    assert("Viewer CANNOT access insights (403)", viewInsights.status === 403);
  }

  // ── 6. RBAC — Analyst Restrictions ────────────────────────────────────────
  console.log("\n 6. RBAC — Analyst Restrictions");
  {
    const analystRead = await req("GET", "/api/records", { token: analystToken });
    assert("Analyst CAN read records", analystRead.status === 200);

    const analystCreate = await req("POST", "/api/records", {
      token: analystToken,
      body: { amount: 100, type: "income", category: "salary", date: "2026-04-01" },
    });
    assert("Analyst CANNOT create records (403)", analystCreate.status === 403);

    const analystInsights = await req("GET", "/api/dashboard/insights", { token: analystToken });
    assert("Analyst CAN access insights", analystInsights.status === 200);

    const analystUsers = await req("GET", "/api/users", { token: analystToken });
    assert("Analyst CANNOT manage users (403)", analystUsers.status === 403);
  }

  // ── 7. Dashboard Endpoints ────────────────────────────────────────────────
  console.log("\n 7. Dashboard APIs");
  {
    const summary = await req("GET", "/api/dashboard/summary", { token: adminToken });
    assert("GET /dashboard/summary returns 200", summary.status === 200);
    assert("Summary has net_balance field", "net_balance" in (summary.body.data || {}));
    assert("Summary has total_income field", "total_income" in (summary.body.data || {}));

    const cats = await req("GET", "/api/dashboard/categories", { token: adminToken });
    assert("GET /dashboard/categories returns 200", cats.status === 200);
    assert("Categories returns array", Array.isArray(cats.body.data));

    const monthly = await req("GET", "/api/dashboard/trends/monthly?months=6", { token: adminToken });
    assert("GET /dashboard/trends/monthly returns 200", monthly.status === 200);

    const weekly = await req("GET", "/api/dashboard/trends/weekly", { token: adminToken });
    assert("GET /dashboard/trends/weekly returns 200", weekly.status === 200);

    const activity = await req("GET", "/api/dashboard/activity?limit=5", { token: adminToken });
    assert("GET /dashboard/activity returns 200", activity.status === 200);
    assert("Activity returns array", Array.isArray(activity.body.data));

    const insights = await req("GET", "/api/dashboard/insights", { token: adminToken });
    assert("GET /dashboard/insights returns 200", insights.status === 200);
    assert("Insights has savings_rate_percent", "savings_rate_percent" in (insights.body.data || {}));
  }

  // ── 8. User Management ────────────────────────────────────────────────────
  console.log("\n 8. User Management (Admin)");
  {
    const listUsers = await req("GET", "/api/users", { token: adminToken });
    assert("Admin can list users", listUsers.status === 200);
    assert("User list returns array", Array.isArray(listUsers.body.data));

    // Use a timestamp-based unique email so re-running tests never collides
    const uniqueEmail = `test.user.${Date.now()}@finance.dev`;

    // Create a user
    const newUser = await req("POST", "/api/users", {
      token: adminToken,
      body: { name: "Test User", email: uniqueEmail, password: "TestUser@1234", role: "viewer" },
    });
    assert("Admin can create a user", newUser.status === 201);
    const newUserId = newUser.body.data?.id;

    if (newUserId) {
      // Update user role
      const updated = await req("PATCH", `/api/users/${newUserId}`, {
        token: adminToken,
        body: { role: "analyst" },
      });
      assert("Admin can update user role", updated.status === 200);
      assert("Updated role is correct", updated.body.data?.role === "analyst");

      // Deactivate
      const deactivated = await req("DELETE", `/api/users/${newUserId}`, { token: adminToken });
      assert("Admin can deactivate a user", deactivated.status === 200);
      assert("Deactivated user has status inactive", deactivated.body.data?.status === "inactive");
    } else {
      assert("Admin can update user role", false, "Skipped — user creation failed");
      assert("Updated role is correct", false, "Skipped — user creation failed");
      assert("Admin can deactivate a user", false, "Skipped — user creation failed");
      assert("Deactivated user has status inactive", false, "Skipped — user creation failed");
    }
  }

  // ── 9. 404 for Unknown Routes ─────────────────────────────────────────────
  console.log("\n  9. 404 Handler");
  {
    const notFound = await req("GET", "/api/nonexistent");
    assert("Unknown route returns 404", notFound.status === 404);
  }

  // ─── Summary ───────────────────────────────────────────────────────────────
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`\n Test Results: ${passed} passed, ${failed} failed\n`);

  if (failed > 0) {
    console.log(" Failed tests:");
    errors.forEach((e) => console.log(`   - ${e}`));
    console.log();
    process.exit(1);
  } else {
    console.log(" All tests passed!\n");
    process.exit(0);
  }
}

// Start server in test mode, run tests, then kill
const app = require("../src/app");
// Wait a moment for server to boot
setTimeout(runTests, 1500);