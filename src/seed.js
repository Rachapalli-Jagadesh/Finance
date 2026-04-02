/**
 * seed.js — Populates the database with:
 *   - 1 admin user
 *   - 1 analyst user
 *   - 1 viewer user
 *   - 30 sample financial records spread across the past 6 months
 *
 * Run: node src/seed.js
 */

require("dotenv").config();
const { getDB } = require("./database");
const { createUser } = require("./services/authService");
const { createRecord } = require("./services/recordService");
const { CATEGORIES } = require("./utils/constants");

const USERS = [
  { name: "Admin User",    email: "admin@finance.dev",   password: "Admin@1234",   role: "admin" },
  { name: "Alice Analyst", email: "analyst@finance.dev", password: "Analyst@1234", role: "analyst" },
  { name: "Victor Viewer", email: "viewer@finance.dev",  password: "Viewer@1234",  role: "viewer" },
];

function randomAmount(min, max) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(2));
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

const SAMPLE_RECORDS = [
  // Income records
  { amount: 85000, type: "income",  category: "salary",      daysAgo: 1,  notes: "Monthly salary — April" },
  { amount: 12500, type: "income",  category: "freelance",   daysAgo: 5,  notes: "Web design project" },
  { amount: 4200,  type: "income",  category: "investment",  daysAgo: 10, notes: "Stock dividend" },
  { amount: 85000, type: "income",  category: "salary",      daysAgo: 31, notes: "Monthly salary — March" },
  { amount: 7000,  type: "income",  category: "freelance",   daysAgo: 35, notes: "API integration gig" },
  { amount: 85000, type: "income",  category: "salary",      daysAgo: 61, notes: "Monthly salary — February" },
  { amount: 3800,  type: "income",  category: "investment",  daysAgo: 65, notes: "Mutual fund redemption" },
  { amount: 85000, type: "income",  category: "salary",      daysAgo: 91, notes: "Monthly salary — January" },
  { amount: 15000, type: "income",  category: "freelance",   daysAgo: 95, notes: "Mobile app project milestone" },
  { amount: 85000, type: "income",  category: "salary",      daysAgo: 121, notes: "Monthly salary — December" },
  // Expense records
  { amount: 18000, type: "expense", category: "rent",        daysAgo: 2,  notes: "Monthly rent — April" },
  { amount: 3200,  type: "expense", category: "food",        daysAgo: 3,  notes: "Groceries and dining" },
  { amount: 1500,  type: "expense", category: "transport",   daysAgo: 4,  notes: "Fuel and Ola rides" },
  { amount: 800,   type: "expense", category: "utilities",   daysAgo: 6,  notes: "Electricity + internet" },
  { amount: 4500,  type: "expense", category: "shopping",    daysAgo: 8,  notes: "Clothing and electronics" },
  { amount: 2000,  type: "expense", category: "entertainment",daysAgo: 12, notes: "OTT + movies + games" },
  { amount: 1200,  type: "expense", category: "healthcare",  daysAgo: 15, notes: "Doctor visit + medicines" },
  { amount: 18000, type: "expense", category: "rent",        daysAgo: 32, notes: "Monthly rent — March" },
  { amount: 2800,  type: "expense", category: "food",        daysAgo: 33, notes: "Groceries" },
  { amount: 5500,  type: "expense", category: "education",   daysAgo: 40, notes: "Online course — AWS" },
  { amount: 900,   type: "expense", category: "utilities",   daysAgo: 36, notes: "Phone + internet bills" },
  { amount: 18000, type: "expense", category: "rent",        daysAgo: 62, notes: "Monthly rent — February" },
  { amount: 3500,  type: "expense", category: "food",        daysAgo: 63, notes: "Dining out + groceries" },
  { amount: 2200,  type: "expense", category: "transport",   daysAgo: 70, notes: "Flight tickets" },
  { amount: 7500,  type: "expense", category: "shopping",    daysAgo: 75, notes: "Festival shopping" },
  { amount: 18000, type: "expense", category: "rent",        daysAgo: 92, notes: "Monthly rent — January" },
  { amount: 3000,  type: "expense", category: "food",        daysAgo: 94, notes: "Groceries + restaurants" },
  { amount: 4200,  type: "expense", category: "insurance",   daysAgo: 100, notes: "Annual health insurance premium" },
  { amount: 800,   type: "expense", category: "utilities",   daysAgo: 96, notes: "Electricity bill" },
  { amount: 18000, type: "expense", category: "rent",        daysAgo: 122, notes: "Monthly rent — December" },
];

async function seed() {
  console.log("🌱 Starting seed...\n");

  // Init DB
  await getDB();

  // Create users
  const createdUsers = [];
  for (const u of USERS) {
    try {
      const user = await createUser(u);
      createdUsers.push(user);
      console.log(`✅ Created user: ${u.email} (${u.role})`);
    } catch (err) {
      if (err.status === 409) {
        console.log(`⚠️  User already exists: ${u.email}`);
      } else {
        console.error(`❌ Failed to create ${u.email}:`, err.message);
      }
    }
  }

  // Find admin to attach records to
  const { get } = require("./database");
  const admin = get("SELECT id FROM users WHERE email = ?", ["admin@finance.dev"]);
  if (!admin) {
    console.error("❌ Admin user not found, cannot seed records");
    process.exit(1);
  }

  // Create records
  let created = 0;
  for (const r of SAMPLE_RECORDS) {
    try {
      createRecord({
        userId: admin.id,
        amount: r.amount,
        type: r.type,
        category: r.category,
        date: daysAgo(r.daysAgo),
        notes: r.notes,
      });
      created++;
    } catch (err) {
      console.error(`❌ Failed to create record:`, err.message);
    }
  }

  console.log(`\n✅ Created ${created} financial records\n`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📋 Login Credentials:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Admin:   admin@finance.dev    / Admin@1234");
  console.log("  Analyst: analyst@finance.dev  / Analyst@1234");
  console.log("  Viewer:  viewer@finance.dev   / Viewer@1234");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  console.log("🎉 Seed complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
