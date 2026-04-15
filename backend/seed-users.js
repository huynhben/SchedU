const bcrypt = require("bcryptjs");
const mysql = require("mysql2/promise");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env.local") });

async function seedUsers() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  const users = [
    { name: "Eunisela Wilson",   email: "euni@vt.edu",     password: "pass123",  isAdmin: 0 },
    { name: "Ben Huynh",         email: "ben@vt.edu",      password: "pass123",  isAdmin: 0 },
    { name: "Divyan Dhavale",    email: "divyan@vt.edu",   password: "pass123",  isAdmin: 0 },
    { name: "Ethan Surber",      email: "ethan@vt.edu",    password: "pass123",  isAdmin: 0 },
    { name: "Maria Lopez",       email: "mlopez@vt.edu",   password: "pass123",  isAdmin: 0 },
    { name: "James Park",        email: "jpark@vt.edu",    password: "pass123",  isAdmin: 0 },
    { name: "John Doe",          email: "doej@vt.edu",     password: "apple234", isAdmin: 0 },
    { name: "Jasmine Nguyen",    email: "jnguygen@vt.edu", password: "09pass34", isAdmin: 0 },
    { name: "Admin",             email: "admin@vt.edu",    password: "admin123", isAdmin: 1 },
  ];

  for (const u of users) {
    const hashed = await bcrypt.hash(u.password, 12);
    await db.execute(
      "INSERT INTO `User` (name, email, password, isAdmin) VALUES (?, ?, ?, ?)",
      [u.name, u.email, hashed, u.isAdmin]
    );
    console.log(`  Inserted: ${u.email}`);
  }

  await db.end();
}

seedUsers().catch(err => { console.error(err); process.exit(1); });
