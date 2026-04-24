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

  // GET /api/my/notifications/smart — generated from real assignment data
  router.get("/notifications/smart", async (req, res) => {
    const { userID } = req.user;
    try {
      const [assignments] = await db.query(
        `SELECT a.assignmentID, a.title, a.dueDate, a.estimatedTime, a.status, c.courseName
         FROM Assignment a
         JOIN Course c ON a.courseID = c.courseID
         WHERE a.userID = ? AND a.status != 'Done' AND a.dueDate IS NOT NULL
         ORDER BY a.dueDate ASC`,
        [userID]
      );

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const notifications = [];

      for (const a of assignments) {
        const due = new Date(a.dueDate);
        due.setHours(0, 0, 0, 0);
        const diff = Math.round((due - today) / 86400000);
        if (diff < 0) {
          notifications.push({ type: "Overdue",      urgency: "high",   message: `"${a.title}" (${a.courseName}) is overdue by ${Math.abs(diff)} day${Math.abs(diff) !== 1 ? "s" : ""}` });
        } else if (diff === 0) {
          notifications.push({ type: "Due Today",    urgency: "high",   message: `"${a.title}" (${a.courseName}) is due today` });
        } else if (diff === 1) {
          notifications.push({ type: "Due Tomorrow", urgency: "medium", message: `"${a.title}" (${a.courseName}) is due tomorrow` });
        } else if (diff <= 7) {
          notifications.push({ type: "Upcoming",     urgency: "low",    message: `"${a.title}" (${a.courseName}) is due in ${diff} days` });
        }
      }

      const [heavyDays] = await db.query(
        `SELECT dueDate, SUM(estimatedTime) AS totalMins, COUNT(*) AS count
         FROM Assignment
         WHERE userID = ? AND status != 'Done'
           AND dueDate BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
         GROUP BY dueDate HAVING totalMins > 180
         ORDER BY dueDate ASC`,
        [userID]
      );

      for (const w of heavyDays) {
        const dayName = new Date(w.dueDate).toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });
        const h = Math.floor(w.totalMins / 60), m = w.totalMins % 60;
        const timeStr = h > 0 ? `${h}h${m > 0 ? ` ${m}m` : ""}` : `${m}m`;
        notifications.push({ type: "Heavy Day", urgency: "medium", message: `Heavy workload on ${dayName} — ${timeStr} estimated across ${w.count} assignment${w.count !== 1 ? "s" : ""}` });
      }

      const [upcomingEvents] = await db.query(
        `SELECT ev.eventID, ev.title, ev.startTime, o.organizationName
         FROM OrganizationMembership m
         JOIN \`Event\` ev ON m.organizationID = ev.organizationID
         JOIN Organization o ON ev.organizationID = o.organizationID
         WHERE m.userID = ? AND ev.startTime BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 7 DAY)
         ORDER BY ev.startTime ASC`,
        [userID]
      );

      for (const e of upcomingEvents) {
        const start = new Date(e.startTime);
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        start.setHours(0, 0, 0, 0);
        const diff = Math.round((start - now) / 86400000);
        if (diff === 0) {
          notifications.push({ type: "Event Today",    urgency: "medium", message: `"${e.title}" (${e.organizationName}) is happening today` });
        } else if (diff === 1) {
          notifications.push({ type: "Event Tomorrow", urgency: "low",    message: `"${e.title}" (${e.organizationName}) is tomorrow` });
        } else {
          notifications.push({ type: "Event",          urgency: "low",    message: `"${e.title}" (${e.organizationName}) is in ${diff} days` });
        }
      }

      res.json(notifications);
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
             a.priority, a.grade, a.status, a.dueDate, a.courseID, c.courseName
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
    const { status, priority, dueDate } = req.body;
    try {
      const [result] = await db.query(
        "UPDATE Assignment SET status = ?, priority = ?, dueDate = ? WHERE assignmentID = ? AND userID = ?",
        [status, priority, dueDate || null, req.params.id, userID]
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
    const { courseID, title, description, estimatedTime, priority, grade, status, dueDate } = req.body;
    if (!courseID || !title)
      return res.status(400).json({ error: "courseID and title are required." });
    try {
      const [result] = await db.query(
        "INSERT INTO Assignment (courseID, userID, title, description, estimatedTime, priority, grade, status, dueDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [courseID, userID, title, description || null, estimatedTime || null, priority || null, grade || null, status || null, dueDate || null]
      );
      res.json({ success: true, insertedID: result.insertId });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/my/timelogs — all logs with minutes per session
  router.get("/timelogs", async (req, res) => {
    const { userID } = req.user;
    try {
      const [rows] = await db.query(
        `SELECT logID, assignmentID, startTime, endTime,
                TIMESTAMPDIFF(SECOND, startTime, endTime) AS seconds
         FROM TimeLog WHERE userID = ? ORDER BY startTime DESC`,
        [userID]
      );
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/my/timelogs/active — currently running timer
  router.get("/timelogs/active", async (req, res) => {
    const { userID } = req.user;
    try {
      const [rows] = await db.query(
        "SELECT * FROM TimeLog WHERE userID = ? AND endTime IS NULL ORDER BY startTime DESC LIMIT 1",
        [userID]
      );
      res.json(rows[0] || null);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/my/timelogs — start a timer (stops any active one first)
  router.post("/timelogs", async (req, res) => {
    const { userID } = req.user;
    const { assignmentID } = req.body;
    if (!assignmentID) return res.status(400).json({ error: "assignmentID is required." });
    try {
      await db.query(
        "UPDATE TimeLog SET endTime = NOW() WHERE userID = ? AND endTime IS NULL",
        [userID]
      );
      const [result] = await db.query(
        "INSERT INTO TimeLog (userID, assignmentID, startTime) VALUES (?, ?, NOW())",
        [userID, assignmentID]
      );
      res.json({ success: true, logID: result.insertId });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // PUT /api/my/timelogs/:id/stop — stop a running timer
  router.put("/timelogs/:id/stop", async (req, res) => {
    const { userID } = req.user;
    try {
      const [result] = await db.query(
        "UPDATE TimeLog SET endTime = NOW() WHERE logID = ? AND userID = ? AND endTime IS NULL",
        [req.params.id, userID]
      );
      if (result.affectedRows === 0)
        return res.status(404).json({ error: "Timer not found or already stopped." });
      res.json({ success: true });
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

  // PUT /api/my/events/:id
  router.put("/events/:id", async (req, res) => {
    const { userID } = req.user;
    const { title, description, startTime, endTime, location } = req.body;
    try {
      const [result] = await db.query(
        "UPDATE `Event` SET title = ?, description = ?, startTime = ?, endTime = ?, location = ? WHERE eventID = ? AND userID = ?",
        [title, description || null, startTime || null, endTime || null, location || null, req.params.id, userID]
      );
      if (result.affectedRows === 0)
        return res.status(404).json({ error: "Event not found or not yours." });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // DELETE /api/my/events/:id
  router.delete("/events/:id", async (req, res) => {
    const { userID } = req.user;
    try {
      const [result] = await db.query(
        "DELETE FROM `Event` WHERE eventID = ? AND userID = ?",
        [req.params.id, userID]
      );
      if (result.affectedRows === 0)
        return res.status(404).json({ error: "Event not found or not yours." });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // DELETE /api/my/assignments/:id
  router.delete("/assignments/:id", async (req, res) => {
    const { userID } = req.user;
    try {
      const [result] = await db.query(
        "DELETE FROM Assignment WHERE assignmentID = ? AND userID = ?",
        [req.params.id, userID]
      );
      if (result.affectedRows === 0)
        return res.status(404).json({ error: "Assignment not found or not yours." });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // DELETE /api/my/enrollments/:courseID
  router.delete("/enrollments/:courseID", async (req, res) => {
    const { userID } = req.user;
    try {
      const [result] = await db.query(
        "DELETE FROM Enrollment WHERE userID = ? AND courseID = ?",
        [userID, req.params.courseID]
      );
      if (result.affectedRows === 0)
        return res.status(404).json({ error: "Enrollment not found." });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // DELETE /api/my/memberships/:organizationID
  router.delete("/memberships/:organizationID", async (req, res) => {
    const { userID } = req.user;
    try {
      const [result] = await db.query(
        "DELETE FROM OrganizationMembership WHERE userID = ? AND organizationID = ?",
        [userID, req.params.organizationID]
      );
      if (result.affectedRows === 0)
        return res.status(404).json({ error: "Membership not found." });
      res.json({ success: true });
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
