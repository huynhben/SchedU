const express = require("express");
const router = express.Router();

module.exports = (db) => {
  // GET /api/my/courses
  router.get("/courses", async (req, res) => {
    const { userID } = req.user;
    const sql = `
      SELECT c.courseID, c.courseName, c.section, c.semester,
             c.startTime, c.endTime, c.location,
             GROUP_CONCAT(cd.day ORDER BY cd.day SEPARATOR ', ') AS days
      FROM Enrollment e
      JOIN Course c ON e.courseID = c.courseID
      LEFT JOIN CourseDay cd ON c.courseID = cd.courseID
      WHERE e.userID = ?
      GROUP BY c.courseID
    `;
    try {
      const [rows] = await db.query(sql, [userID]);
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/my/notifications
  router.get("/notifications", async (req, res) => {
    const { userID } = req.user;
    try {
      const [rows] = await db.query(
        "SELECT * FROM Notification WHERE userID = ? AND (readStatus IS NULL OR readStatus != 'read') ORDER BY sendTime DESC",
        [userID]
      );
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/my/assignments
  router.get("/assignments", async (req, res) => {
    const { userID } = req.user;
    const sql = `
      SELECT a.assignmentID, a.title, a.description, a.estimatedTime,
             a.priority, a.grade, a.status, a.courseID, c.courseName
      FROM Assignment a
      JOIN Course c ON a.courseID = c.courseID
      WHERE a.userID = ?
    `;
    try {
      const [rows] = await db.query(sql, [userID]);
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // PUT /api/my/assignments/:id
  router.put("/assignments/:id", async (req, res) => {
    const { userID } = req.user;
    const { status, priority } = req.body;
    try {
      const [result] = await db.query(
        "UPDATE Assignment SET status = ?, priority = ? WHERE assignmentID = ? AND userID = ?",
        [status, priority, req.params.id, userID]
      );
      if (result.affectedRows === 0)
        return res.status(404).json({ error: "Assignment not found or not yours." });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/my/assignments
  router.post("/assignments", async (req, res) => {
    const { userID } = req.user;
    const { courseID, title, description, estimatedTime, priority, grade, status } = req.body;
    if (!courseID || !title)
      return res.status(400).json({ error: "courseID and title are required." });
    try {
      const [result] = await db.query(
        "INSERT INTO Assignment (courseID, userID, title, description, estimatedTime, priority, grade, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [courseID, userID, title, description || null, estimatedTime || null, priority || null, grade || null, status || null]
      );
      res.json({ success: true, insertedID: result.insertId });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/my/events
  router.get("/events", async (req, res) => {
    const { userID } = req.user;
    const sql = `
      SELECT ev.eventID, ev.title, ev.description, ev.startTime,
             ev.endTime, ev.location, ev.isRecurring,
             o.organizationName
      FROM OrganizationMembership m
      JOIN \`Event\` ev ON m.organizationID = ev.organizationID
      JOIN Organization o ON ev.organizationID = o.organizationID
      WHERE m.userID = ?
      ORDER BY ev.startTime ASC
    `;
    try {
      const [rows] = await db.query(sql, [userID]);
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/my/events
  router.post("/events", async (req, res) => {
    const { userID } = req.user;
    const { organizationID, title, description, startTime, endTime, location, isRecurring } = req.body;
    if (!organizationID || !title)
      return res.status(400).json({ error: "organizationID and title are required." });
    try {
      const [result] = await db.query(
        "INSERT INTO `Event` (userID, organizationID, title, description, startTime, endTime, location, isRecurring) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [userID, organizationID, title, description || null, startTime || null, endTime || null, location || null, isRecurring || null]
      );
      res.json({ success: true, insertedID: result.insertId });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/my/all-courses — all courses with enrolled flag for this user
  router.get("/all-courses", async (req, res) => {
    const { userID } = req.user;
    const sql = `
      SELECT c.courseID, c.courseName, c.section, c.semester,
             c.startTime, c.endTime, c.location,
             GROUP_CONCAT(cd.day ORDER BY cd.day SEPARATOR ', ') AS days,
             MAX(CASE WHEN e.userID = ? THEN 1 ELSE 0 END) AS enrolled
      FROM Course c
      LEFT JOIN CourseDay cd ON c.courseID = cd.courseID
      LEFT JOIN Enrollment e ON c.courseID = e.courseID AND e.userID = ?
      GROUP BY c.courseID
    `;
    try {
      const [rows] = await db.query(sql, [userID, userID]);
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/my/enrollments — enroll in an existing course
  router.post("/enrollments", async (req, res) => {
    const { userID } = req.user;
    const { courseID } = req.body;
    if (!courseID) return res.status(400).json({ error: "courseID is required." });
    try {
      await db.query(
        "INSERT INTO Enrollment (userID, courseID, enrollmentDate, status) VALUES (?, ?, NOW(), 'active')",
        [userID, courseID]
      );
      res.json({ success: true });
    } catch (err) {
      if (err.code === "ER_DUP_ENTRY")
        return res.status(409).json({ error: "Already enrolled in this course." });
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/my/courses — create a new course and auto-enroll the user
  router.post("/courses", async (req, res) => {
    const { userID } = req.user;
    const { courseName, section, semester, startTime, endTime, location } = req.body;
    if (!courseName) return res.status(400).json({ error: "courseName is required." });
    try {
      const [courseResult] = await db.query(
        "INSERT INTO Course (courseName, section, semester, startTime, endTime, location) VALUES (?, ?, ?, ?, ?, ?)",
        [courseName, section || null, semester || null, startTime || null, endTime || null, location || null]
      );
      const newCourseID = courseResult.insertId;
      await db.query(
        "INSERT INTO Enrollment (userID, courseID, enrollmentDate, status) VALUES (?, ?, NOW(), 'active')",
        [userID, newCourseID]
      );
      res.json({ success: true, courseID: newCourseID });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/my/all-organizations — all orgs with joined flag for this user
  router.get("/all-organizations", async (req, res) => {
    const { userID } = req.user;
    const sql = `
      SELECT o.organizationID, o.organizationName, o.description,
             MAX(CASE WHEN m.userID = ? THEN 1 ELSE 0 END) AS joined
      FROM Organization o
      LEFT JOIN OrganizationMembership m ON o.organizationID = m.organizationID AND m.userID = ?
      GROUP BY o.organizationID
    `;
    try {
      const [rows] = await db.query(sql, [userID, userID]);
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/my/memberships — join an organization
  router.post("/memberships", async (req, res) => {
    const { userID } = req.user;
    const { organizationID } = req.body;
    if (!organizationID) return res.status(400).json({ error: "organizationID is required." });
    try {
      await db.query(
        "INSERT INTO OrganizationMembership (userID, organizationID, role) VALUES (?, ?, 'member')",
        [userID, organizationID]
      );
      res.json({ success: true });
    } catch (err) {
      if (err.code === "ER_DUP_ENTRY")
        return res.status(409).json({ error: "Already a member of this organization." });
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/my/organizations
  router.get("/organizations", async (req, res) => {
    const { userID } = req.user;
    const sql = `
      SELECT o.organizationID, o.organizationName, o.description, m.role
      FROM OrganizationMembership m
      JOIN Organization o ON m.organizationID = o.organizationID
      WHERE m.userID = ?
    `;
    try {
      const [rows] = await db.query(sql, [userID]);
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
