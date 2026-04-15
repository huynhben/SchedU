const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const router = express.Router();

module.exports = (db) => {
  // POST /api/auth/register
  router.post("/register", async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: "name, email, and password are required." });
    try {
      const hashed = await bcrypt.hash(password, 12);
      const [result] = await db.query(
        "INSERT INTO `User` (name, email, password) VALUES (?, ?, ?)",
        [name, email, hashed]
      );
      const token = jwt.sign(
        { userID: result.insertId, isAdmin: 0 },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );
      res.json({ token, user: { userID: result.insertId, name, isAdmin: 0 } });
    } catch (err) {
      if (err.code === "ER_DUP_ENTRY")
        return res.status(409).json({ error: "Email already in use." });
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/auth/login
  router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "email and password are required." });
    try {
      const [rows] = await db.query(
        "SELECT userID, name, password, isAdmin FROM `User` WHERE email = ?",
        [email]
      );
      if (rows.length === 0)
        return res.status(401).json({ error: "Invalid credentials." });
      const user = rows[0];
      const match = await bcrypt.compare(password, user.password);
      if (!match)
        return res.status(401).json({ error: "Invalid credentials." });
      const token = jwt.sign(
        { userID: user.userID, isAdmin: user.isAdmin },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );
      res.json({
        token,
        user: { userID: user.userID, name: user.name, isAdmin: user.isAdmin }
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
