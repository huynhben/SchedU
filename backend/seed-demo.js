const bcrypt = require("bcryptjs");
const mysql = require("mysql2/promise");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env.local") });

async function seedDemo() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  const [existing] = await db.execute(
    "SELECT userID FROM `User` WHERE email = ?",
    ["demo@vt.edu"]
  );

  let userID;
  if (existing.length > 0) {
    userID = existing[0].userID;
    console.log(`Demo account already exists (userID=${userID}). Patching missing events...`);
    await patchEvents(db, userID);
    await db.end();
    return;
  }

  const hashed = await bcrypt.hash("demo123", 12);
  const [userResult] = await db.execute(
    "INSERT INTO `User` (name, email, password, isAdmin) VALUES (?, ?, ?, ?)",
    ["Lebron James", "demo@vt.edu", hashed, 0]
  );
  userID = userResult.insertId;
  console.log(`  Created user: demo@vt.edu (userID=${userID})`);

  // Enrollments in courses 1–5 (all have CourseDay entries)
  const enrollments = [1, 2, 3, 4, 5];
  for (const courseID of enrollments) {
    await db.execute(
      "INSERT INTO Enrollment (userID, courseID, enrollmentDate, status) VALUES (?, ?, ?, ?)",
      [userID, courseID, "2026-01-15", "Enrolled"]
    );
  }
  console.log(`  Enrolled in ${enrollments.length} courses`);

  // Assignments
  const assignmentDefs = [
    { courseID: 1, title: "Java Overdue Assignment",   desc: "Missed deadline",               estTime: 60,  priority: "High",   grade: null,  status: "Not Started", dueDate: "2026-04-26" },
    { courseID: 1, title: "Java Homework 4",           desc: "Chapter 4 exercises",           estTime: 90,  priority: "Medium", grade: "B+",  status: "Done",        dueDate: "2026-04-21" },
    { courseID: 1, title: "Java Quiz 3",               desc: "Loops and arrays",              estTime: 60,  priority: "Medium", grade: "A-",  status: "Done",        dueDate: "2026-04-28" },
    { courseID: 1, title: "Java Reading Response",     desc: "Ch. 7 reading reflection",      estTime: 60,  priority: "Low",    grade: null,  status: "Not Started", dueDate: "2026-05-04" },
    { courseID: 1, title: "Java Final Project",        desc: "Build a Java app from scratch", estTime: 300, priority: "High",   grade: null,  status: "In Progress", dueDate: "2026-05-10" },
    { courseID: 2, title: "C Lab Due Today",           desc: "Pointers and memory",           estTime: 90,  priority: "High",   grade: null,  status: "In Progress", dueDate: "2026-05-03" },
    { courseID: 2, title: "C Pointer Quiz",            desc: "Short pointer quiz",            estTime: 45,  priority: "Low",    grade: "A",   status: "Done",        dueDate: "2026-04-29" },
    { courseID: 2, title: "C Programming Lab 5",       desc: "Structs and file I/O",          estTime: 120, priority: "High",   grade: null,  status: "In Progress", dueDate: "2026-05-05" },
    { courseID: 3, title: "Python Functions HW",       desc: "Write 10 utility functions",    estTime: 75,  priority: "Medium", grade: "A-",  status: "Done",        dueDate: "2026-04-25" },
    { courseID: 3, title: "Python Data Analysis",      desc: "Analyze CSV dataset",           estTime: 180, priority: "High",   grade: null,  status: "Not Started", dueDate: "2026-05-07" },
    { courseID: 4, title: "SQL Lab 3",                 desc: "JOIN queries practice",         estTime: 60,  priority: "Low",    grade: "B",   status: "Done",        dueDate: "2026-04-30" },
    { courseID: 4, title: "SQL Query HW",              desc: "Complex subqueries",            estTime: 120, priority: "Medium", grade: null,  status: "Not Started", dueDate: "2026-05-06" },
    { courseID: 4, title: "SQL Project Phase 2",       desc: "Implement schema and queries",  estTime: 240, priority: "High",   grade: null,  status: "In Progress", dueDate: "2026-05-09" },
    { courseID: 5, title: "MATLAB Midterm",            desc: "Matrix operations exam",        estTime: 120, priority: "High",   grade: "B+",  status: "Done",        dueDate: "2026-04-15" },
    { courseID: 5, title: "MATLAB Script",             desc: "Write a data processing script",estTime: 90,  priority: "Medium", grade: null,  status: "Not Started", dueDate: "2026-05-06" },
    { courseID: 6, title: "Data Structures Exam Prep", desc: "Review trees and graphs",       estTime: 180, priority: "High",   grade: null,  status: "In Progress", dueDate: "2026-05-04" },
    { courseID: 8, title: "Database Final Report",     desc: "Write final project report",    estTime: 150, priority: "High",   grade: null,  status: "Not Started", dueDate: "2026-05-08" },
  ];

  const assignmentIDs = {};
  for (const a of assignmentDefs) {
    const [res] = await db.execute(
      "INSERT INTO Assignment (courseID, userID, title, description, estimatedTime, priority, grade, status, dueDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [a.courseID, userID, a.title, a.desc, a.estTime, a.priority, a.grade, a.status, a.dueDate]
    );
    assignmentIDs[a.title] = res.insertId;
  }
  console.log(`  Inserted ${assignmentDefs.length} assignments`);

  // TimeLogs (reference captured assignmentIDs)
  const timeLogs = [
    { title: "Java Quiz 3",               start: "2026-04-28 18:00:00", end: "2026-04-28 19:00:00" },
    { title: "C Pointer Quiz",            start: "2026-04-29 17:00:00", end: "2026-04-29 17:45:00" },
    { title: "SQL Lab 3",                 start: "2026-04-30 20:00:00", end: "2026-04-30 21:00:00" },
    { title: "Java Final Project",        start: "2026-05-01 14:00:00", end: "2026-05-01 16:00:00" },
    { title: "SQL Project Phase 2",       start: "2026-05-01 19:00:00", end: "2026-05-01 20:30:00" },
    { title: "Data Structures Exam Prep", start: "2026-05-02 10:00:00", end: "2026-05-02 11:00:00" },
    { title: "C Programming Lab 5",       start: "2026-05-02 15:00:00", end: "2026-05-02 17:30:00" },
    { title: "Python Data Analysis",      start: "2026-05-02 20:00:00", end: "2026-05-02 21:30:00" },
    { title: "C Lab Due Today",           start: "2026-05-03 09:00:00", end: "2026-05-03 10:00:00" },
    { title: "Java Final Project",        start: "2026-05-03 13:00:00", end: "2026-05-03 14:30:00" },
  ];

  for (const log of timeLogs) {
    const aID = assignmentIDs[log.title];
    await db.execute(
      "INSERT INTO TimeLog (userID, assignmentID, startTime, endTime) VALUES (?, ?, ?, ?)",
      [userID, aID, log.start, log.end]
    );
  }
  console.log(`  Inserted ${timeLogs.length} time logs`);

  // Organization memberships
  const memberships = [
    { orgID: 1, role: "Member" },
    { orgID: 3, role: "Member" },
    { orgID: 4, role: "Vice President" },
    { orgID: 6, role: "Member" },
  ];
  for (const m of memberships) {
    await db.execute(
      "INSERT INTO OrganizationMembership (userID, organizationID, role) VALUES (?, ?, ?)",
      [userID, m.orgID, m.role]
    );
  }
  console.log(`  Joined ${memberships.length} organizations`);

  // Events
  const events = [
    { orgID: 1, title: "Cassell Guard Watch Party", desc: "ACC tournament watch party",  start: "2026-05-03 14:00:00", end: "2026-05-03 17:00:00", location: "Cassell Coliseum", recurring: "No"  },
    { orgID: 3, title: "Math Club Study Session",   desc: "Group study for finals",      start: "2026-05-04 15:00:00", end: "2026-05-04 17:00:00", location: "McBryde 210",      recurring: "No"  },
    { orgID: 6, title: "ACM Tech Talk on AI",       desc: "Industry speaker on AI/ML",  start: "2026-05-05 17:00:00", end: "2026-05-05 18:30:00", location: "Goodwin Hall",     recurring: "No"  },
    { orgID: 4, title: "CS Club Weekly Meeting",    desc: "Weekly club check-in",        start: "2026-05-06 19:00:00", end: "2026-05-06 20:00:00", location: "Torgerson Hall",   recurring: "Yes" },
    { orgID: 1, title: "Cassell Guard Game Night",  desc: "Basketball game watch party", start: "2026-05-07 19:00:00", end: "2026-05-07 21:30:00", location: "Cassell Coliseum", recurring: "No"  },
    { orgID: 6, title: "ACM Workshop",              desc: "Hands-on coding workshop",    start: "2026-05-08 14:00:00", end: "2026-05-08 16:00:00", location: "Goodwin Hall",     recurring: "No"  },
    { orgID: 4, title: "CS Hackathon",              desc: "24-hour hackathon",           start: "2026-05-10 09:00:00", end: "2026-05-10 17:00:00", location: "Pamplin 101",      recurring: "No"  },
  ];

  const eventIDs = {};
  for (const e of events) {
    const [res] = await db.execute(
      "INSERT INTO Event (userID, organizationID, title, description, startTime, endTime, location, isRecurring) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [userID, e.orgID, e.title, e.desc, e.start, e.end, e.location, e.recurring]
    );
    eventIDs[e.title] = res.insertId;
  }
  await db.execute(
    "INSERT INTO EventDay (eventID, day) VALUES (?, ?)",
    [eventIDs["CS Club Weekly Meeting"], "Wednesday"]
  );
  console.log(`  Inserted ${events.length} events`);

  // Notifications
  const notifications = [
    { msg: "C Lab Due Today is due today!",              type: "Reminder",     time: "2026-05-03 08:00:00", read: "Unread" },
    { msg: "Java Overdue Assignment is past due!",       type: "Alert",        time: "2026-05-02 09:00:00", read: "Unread" },
    { msg: "Java Quiz 3 graded: A-",                     type: "Update",       time: "2026-04-29 10:00:00", read: "Read"   },
    { msg: "Heavy workload on Monday — 240 min est.",    type: "Alert",        time: "2026-05-03 08:00:00", read: "Unread" },
    { msg: "ACM Tech Talk on AI is tomorrow",            type: "Event",        time: "2026-05-04 18:00:00", read: "Unread" },
    { msg: "CS Club Hackathon registration is open",     type: "Announcement", time: "2026-05-03 07:00:00", read: "Read"   },
  ];

  for (const n of notifications) {
    await db.execute(
      "INSERT INTO Notification (userID, message, type, sendTime, readStatus) VALUES (?, ?, ?, ?, ?)",
      [userID, n.msg, n.type, n.time, n.read]
    );
  }
  console.log(`  Inserted ${notifications.length} notifications`);

  await db.end();
  console.log("\nDemo account ready:");
  console.log("  Email:    demo@vt.edu");
  console.log("  Password: demo123");
}

async function patchEvents(db, userID) {
  const missing = [
    { orgID: 1, title: "Cassell Guard Watch Party", desc: "ACC tournament watch party",  start: "2026-05-03 14:00:00", end: "2026-05-03 17:00:00", location: "Cassell Coliseum", recurring: "No"  },
    { orgID: 3, title: "Math Club Study Session",   desc: "Group study for finals",      start: "2026-05-04 15:00:00", end: "2026-05-04 17:00:00", location: "McBryde 210",      recurring: "No"  },
    { orgID: 6, title: "ACM Tech Talk on AI",       desc: "Industry speaker on AI/ML",  start: "2026-05-05 17:00:00", end: "2026-05-05 18:30:00", location: "Goodwin Hall",     recurring: "No"  },
    { orgID: 4, title: "CS Club Weekly Meeting",    desc: "Weekly club check-in",        start: "2026-05-06 19:00:00", end: "2026-05-06 20:00:00", location: "Torgerson Hall",   recurring: "Yes" },
    { orgID: 1, title: "Cassell Guard Game Night",  desc: "Basketball game watch party", start: "2026-05-07 19:00:00", end: "2026-05-07 21:30:00", location: "Cassell Coliseum", recurring: "No"  },
    { orgID: 6, title: "ACM Workshop",              desc: "Hands-on coding workshop",    start: "2026-05-08 14:00:00", end: "2026-05-08 16:00:00", location: "Goodwin Hall",     recurring: "No"  },
    { orgID: 4, title: "CS Hackathon",              desc: "24-hour hackathon",           start: "2026-05-10 09:00:00", end: "2026-05-10 17:00:00", location: "Pamplin 101",      recurring: "No"  },
  ];

  let added = 0;
  for (const e of missing) {
    const [exists] = await db.execute(
      "SELECT eventID FROM `Event` WHERE userID = ? AND title = ?",
      [userID, e.title]
    );
    if (exists.length > 0) continue;
    const [res] = await db.execute(
      "INSERT INTO `Event` (userID, organizationID, title, description, startTime, endTime, location, isRecurring) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [userID, e.orgID, e.title, e.desc, e.start, e.end, e.location, e.recurring]
    );
    if (e.title === "CS Club Weekly Meeting") {
      await db.execute("INSERT INTO EventDay (eventID, day) VALUES (?, ?)", [res.insertId, "Wednesday"]);
    }
    console.log(`  Added event: ${e.title}`);
    added++;
  }
  if (added === 0) console.log("  All events already present.");
}

seedDemo().catch(err => { console.error(err); process.exit(1); });
