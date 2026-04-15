const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env.local") });
const { authenticateToken, requireAdmin } = require("./middleware/auth");

const app = express();
app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});


const db = pool.promise();

// Auth routes (no middleware)
app.use("/api/auth", require("./routes/auth")(db));

// User-scoped routes (require valid JWT)
app.use("/api/my", authenticateToken, require("./routes/my")(db));

// Admin routes (require valid JWT + isAdmin)
app.use("/api/admin", authenticateToken, requireAdmin, require("./routes/admin")(db));

// Health check
app.get("/api/status", async (req, res) => {
  try {
    await db.query("SELECT 1");
    res.json({ connected: true, database: process.env.DB_NAME, host: process.env.DB_HOST });
  } catch (err) {
    res.status(500).json({ connected: false, error: err.message });
  }
});

// USER FUNCTIONS !!!

// Get all users
app.get("/api/users", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM `User`");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Insert a new user
app.post("/api/users", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: "name, email, and password are required." });
  try {
    const [result] = await db.query(
      "INSERT INTO `User` (name, email, password) VALUES (?, ?, ?)",
      [name, email, password]
    );
    res.json({ success: true, insertedID: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a user with valid id
app.put("/api/users/:id", async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const [result] = await db.query(
      "UPDATE `User` SET name = ?, email = ?, password = ? WHERE userID = ?",
      [name, email, password, req.params.id]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ error: "User not found." });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// delete user
app.delete("/api/users/:id", async (req, res) => {
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

// Course Information

// Get all courses
app.get("/api/courses", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM Course");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Insert course
app.post("/api/courses", async (req, res) => {
  const { courseName, section, semester, startTime, endTime, location } = req.body;
  if (!courseName)
    return res.status(400).json({ error: "courseName is required." });
  try {
    const [result] = await db.query(
      "INSERT INTO Course (courseName, section, semester, startTime, endTime, location) VALUES (?, ?, ?, ?, ?, ?)",
      [courseName, section, semester, startTime, endTime, location]
    );
    res.json({ success: true, insertedID: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update course
app.put("/api/courses/:id", async (req, res) => {
  const { courseName, section, semester, startTime, endTime, location } = req.body;
  try {
    const [result] = await db.query(
      "UPDATE Course SET courseName = ?, section = ?, semester = ?, startTime = ?, endTime = ?, location = ? WHERE courseID = ?",
      [courseName, section, semester, startTime, endTime, location, req.params.id]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Course not found." });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete course
app.delete("/api/courses/:id", async (req, res) => {
  try {
    const [result] = await db.query(
      "DELETE FROM Course WHERE courseID = ?",
      [req.params.id]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Course not found." });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ASSIGMENT OPERATORS

// Get all assignments
app.get("/api/assignments", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM Assignment");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Insert assignment
app.post("/api/assignments", async (req, res) => {
  const { courseID, userID, title, description, estimatedTime, priority, grade, status } = req.body;
  if (!courseID || !userID || !title)
    return res.status(400).json({ error: "courseID, userID, and title are required." });
  try {
    const [result] = await db.query(
      "INSERT INTO Assignment (courseID, userID, title, description, estimatedTime, priority, grade, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [courseID, userID, title, description, estimatedTime, priority, grade, status]
    );
    res.json({ success: true, insertedID: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update assignment
app.put("/api/assignments/:id", async (req, res) => {
  const { courseID, userID, title, description, estimatedTime, priority, grade, status } = req.body;
  try {
    const [result] = await db.query(
      "UPDATE Assignment SET courseID = ?, userID = ?, title = ?, description = ?, estimatedTime = ?, priority = ?, grade = ?, status = ? WHERE assignmentID = ?",
      [courseID, userID, title, description, estimatedTime, priority, grade, status, req.params.id]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Assignment not found." });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete assignment
app.delete("/api/assignments/:id", async (req, res) => {
  try {
    const [result] = await db.query(
      "DELETE FROM Assignment WHERE assignmentID = ?",
      [req.params.id]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Assignment not found." });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all enrollments
app.get("/api/enrollments", async (req, res) => {
  try {
    const sql = `
      SELECT e.enrollmentID, e.userID, e.courseID, u.name AS userName, c.courseName, e.enrollmentDate, e.status
      FROM Enrollment e
      JOIN \`User\` u ON e.userID = u.userID
      JOIN Course c ON e.courseID = c.courseID
    `;
    const [rows] = await db.query(sql);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Insert enrollment
app.post("/api/enrollments", async (req, res) => {
  const { userID, courseID, enrollmentDate, status } = req.body;
  if (!userID || !courseID)
    return res.status(400).json({ error: "userID and courseID are required." });
  try {
    const [result] = await db.query(
      "INSERT INTO Enrollment (userID, courseID, enrollmentDate, status) VALUES (?, ?, ?, ?)",
      [userID, courseID, enrollmentDate, status]
    );
    res.json({ success: true, insertedID: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update enrollment
app.put("/api/enrollments/:id", async (req, res) => {
  const { userID, courseID, enrollmentDate, status } = req.body;
  try {
    const [result] = await db.query(
      "UPDATE Enrollment SET userID = ?, courseID = ?, enrollmentDate = ?, status = ? WHERE enrollmentID = ?",
      [userID, courseID, enrollmentDate, status, req.params.id]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Enrollment not found." });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete enrollment
app.delete("/api/enrollments/:id", async (req, res) => {
  try {
    const [result] = await db.query(
      "DELETE FROM Enrollment WHERE enrollmentID = ?",
      [req.params.id]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Enrollment not found." });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// TIME LOG !!!

// Get all time logs
app.get("/api/timelogs", async (_req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM TimeLog");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Insert time log
app.post("/api/timelogs", async (req, res) => {
  const { userID, assignmentID, startTime, endTime } = req.body;
  if (!userID || !assignmentID)
    return res.status(400).json({ error: "userID and assignmentID are required." });
  try {
    const [result] = await db.query(
      "INSERT INTO TimeLog (userID, assignmentID, startTime, endTime) VALUES (?, ?, ?, ?)",
      [userID, assignmentID, startTime, endTime]
    );
    res.json({ success: true, insertedID: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update time log
app.put("/api/timelogs/:id", async (req, res) => {
  const { userID, assignmentID, startTime, endTime } = req.body;
  try {
    const [result] = await db.query(
      "UPDATE TimeLog SET userID = ?, assignmentID = ?, startTime = ?, endTime = ? WHERE logID = ?",
      [userID, assignmentID, startTime, endTime, req.params.id]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ error: "TimeLog not found." });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete time log
app.delete("/api/timelogs/:id", async (req, res) => {
  try {
    const [result] = await db.query(
      "DELETE FROM TimeLog WHERE logID = ?",
      [req.params.id]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ error: "TimeLog not found." });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// NOTIFICATION !!!

// Get all notifications
app.get("/api/notifications", async (_req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM Notification");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Insert notification
app.post("/api/notifications", async (req, res) => {
  const { userID, message, type, sendTime, readStatus } = req.body;
  if (!userID || !message)
    return res.status(400).json({ error: "userID and message are required." });
  try {
    const [result] = await db.query(
      "INSERT INTO Notification (userID, message, type, sendTime, readStatus) VALUES (?, ?, ?, ?, ?)",
      [userID, message, type, sendTime, readStatus]
    );
    res.json({ success: true, insertedID: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update notification
app.put("/api/notifications/:id", async (req, res) => {
  const { userID, message, type, sendTime, readStatus } = req.body;
  try {
    const [result] = await db.query(
      "UPDATE Notification SET userID = ?, message = ?, type = ?, sendTime = ?, readStatus = ? WHERE notificationID = ?",
      [userID, message, type, sendTime, readStatus, req.params.id]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Notification not found." });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete notification
app.delete("/api/notifications/:id", async (req, res) => {
  try {
    const [result] = await db.query(
      "DELETE FROM Notification WHERE notificationID = ?",
      [req.params.id]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Notification not found." });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ORGANIZATION !!!

// Get all organizations
app.get("/api/organizations", async (_req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM Organization");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Insert organization
app.post("/api/organizations", async (req, res) => {
  const { organizationName, description } = req.body;
  if (!organizationName)
    return res.status(400).json({ error: "organizationName is required." });
  try {
    const [result] = await db.query(
      "INSERT INTO Organization (organizationName, description) VALUES (?, ?)",
      [organizationName, description]
    );
    res.json({ success: true, insertedID: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update organization
app.put("/api/organizations/:id", async (req, res) => {
  const { organizationName, description } = req.body;
  try {
    const [result] = await db.query(
      "UPDATE Organization SET organizationName = ?, description = ? WHERE organizationID = ?",
      [organizationName, description, req.params.id]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Organization not found." });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete organization
app.delete("/api/organizations/:id", async (req, res) => {
  try {
    const [result] = await db.query(
      "DELETE FROM Organization WHERE organizationID = ?",
      [req.params.id]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Organization not found." });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ORGANIZATION MEMBERSHIP !!!

// Get all memberships
app.get("/api/memberships", async (req, res) => {
  try {
    const sql = `
      SELECT m.membershipID, m.userID, m.organizationID, u.name AS userName,
             o.organizationName, m.role
      FROM OrganizationMembership m
      JOIN \`User\` u ON m.userID = u.userID
      JOIN Organization o ON m.organizationID = o.organizationID
    `;
    const [rows] = await db.query(sql);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Insert membership
app.post("/api/memberships", async (req, res) => {
  const { userID, organizationID, role } = req.body;
  if (!userID || !organizationID)
    return res.status(400).json({ error: "userID and organizationID are required." });
  try {
    const [result] = await db.query(
      "INSERT INTO OrganizationMembership (userID, organizationID, role) VALUES (?, ?, ?)",
      [userID, organizationID, role]
    );
    res.json({ success: true, insertedID: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update membership
app.put("/api/memberships/:id", async (req, res) => {
  const { userID, organizationID, role } = req.body;
  try {
    const [result] = await db.query(
      "UPDATE OrganizationMembership SET userID = ?, organizationID = ?, role = ? WHERE membershipID = ?",
      [userID, organizationID, role, req.params.id]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Membership not found." });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete membership
app.delete("/api/memberships/:id", async (req, res) => {
  try {
    const [result] = await db.query(
      "DELETE FROM OrganizationMembership WHERE membershipID = ?",
      [req.params.id]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Membership not found." });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// EVENT !!!

app.get("/api/events", async (_req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM Event");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Insert event
app.post("/api/events", async (req, res) => {
  const { userID, organizationID, title, description, startTime, endTime, location, isRecurring } = req.body;
  if (!userID || !organizationID || !title)
    return res.status(400).json({ error: "userID, organizationID, and title are required." });
  try {
    const [result] = await db.query(
      "INSERT INTO Event (userID, organizationID, title, description, startTime, endTime, location, isRecurring) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [userID, organizationID, title, description, startTime, endTime, location, isRecurring]
    );
    res.json({ success: true, insertedID: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update event
app.put("/api/events/:id", async (req, res) => {
  const { userID, organizationID, title, description, startTime, endTime, location, isRecurring } = req.body;
  try {
    const [result] = await db.query(
      "UPDATE Event SET userID = ?, organizationID = ?, title = ?, description = ?, startTime = ?, endTime = ?, location = ?, isRecurring = ? WHERE eventID = ?",
      [userID, organizationID, title, description, startTime, endTime, location, isRecurring, req.params.id]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Event not found." });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete event
app.delete("/api/events/:id", async (req, res) => {
  try {
    const [result] = await db.query(
      "DELETE FROM Event WHERE eventID = ?",
      [req.params.id]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Event not found." });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// COURSE DAY (view only) !!!

app.get("/api/coursedays", async (_req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM CourseDay");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// EVENT DAY (view only) !!!

app.get("/api/eventdays", async (_req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM EventDay");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Row count summary for all tables
app.get("/api/summary", async (req, res) => {
  const tables = [
    "User", "Course", "CourseDay", "Enrollment", "Assignment",
    "TimeLog", "Notification", "Organization",
    "OrganizationMembership", "Event", "EventDay",
  ];
  try {
    const results = await Promise.all(
      tables.map(async (t) => {
        const name = t === "User" ? "`User`" : t;
        const [rows] = await db.query(`SELECT COUNT(*) AS count FROM ${name}`);
        return { table: t, rows: rows[0].count };
      })
    );
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start server
const PORT = 5001;
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`),
);
