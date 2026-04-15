const express = require("express");
const bcrypt = require("bcryptjs");
const router = express.Router();

module.exports = (db) => {
  // GET /api/admin/users
  router.get("/users", async (_req, res) => {
    try {
      const [rows] = await db.query(
        "SELECT userID, name, email, isAdmin FROM `User`"
      );
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/admin/users
  router.post("/users", async (req, res) => {
    const { name, email, password, isAdmin } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: "name, email, and password are required." });
    try {
      const hashed = await bcrypt.hash(password, 12);
      const [result] = await db.query(
        "INSERT INTO `User` (name, email, password, isAdmin) VALUES (?, ?, ?, ?)",
        [name, email, hashed, isAdmin ? 1 : 0]
      );
      res.json({ success: true, insertedID: result.insertId });
    } catch (err) {
      if (err.code === "ER_DUP_ENTRY")
        return res.status(409).json({ error: "Email already in use." });
      res.status(500).json({ error: err.message });
    }
  });

  // DELETE /api/admin/users/:id
  router.delete("/users/:id", async (req, res) => {
    try {
      const [result] = await db.query(
        "DELETE FROM `User` WHERE userID = ?",
        [req.params.id]
      );
      if (result.affectedRows === 0)
        return res.status(404).json({ error: "User not found." });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
