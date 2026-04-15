import { useState, useEffect } from "react";
import { useAuth } from "../AuthContext";
import { api } from "../api";

export default function DashboardPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Course section state
  const [showCoursePanel, setShowCoursePanel] = useState(false);
  const [courseTab, setCourseTab] = useState("browse"); // "browse" | "create"
  const [allCourses, setAllCourses] = useState([]);
  const [newCourse, setNewCourse] = useState({ courseName: "", section: "", semester: "", startTime: "", endTime: "", location: "" });
  const [courseError, setCourseError] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    const [c, n] = await Promise.all([
      api.get("/my/courses"),
      api.get("/my/notifications"),
    ]);
    setCourses(c || []);
    setNotifications(n || []);
    setLoading(false);
  }

  async function openCoursePanel() {
    setShowCoursePanel(p => !p);
    setCourseError("");
    const data = await api.get("/my/all-courses");
    setAllCourses(data || []);
  }

  async function enrollIn(courseID) {
    setCourseError("");
    try {
      await api.post("/my/enrollments", { courseID });
      const [enrolled, all] = await Promise.all([
        api.get("/my/courses"),
        api.get("/my/all-courses"),
      ]);
      setCourses(enrolled || []);
      setAllCourses(all || []);
    } catch (err) {
      setCourseError(err.message);
    }
  }

  async function createCourse(e) {
    e.preventDefault();
    setCourseError("");
    try {
      await api.post("/my/courses", newCourse);
      setNewCourse({ courseName: "", section: "", semester: "", startTime: "", endTime: "", location: "" });
      setShowCoursePanel(false);
      const enrolled = await api.get("/my/courses");
      setCourses(enrolled || []);
    } catch (err) {
      setCourseError(err.message);
    }
  }

  const unenrolledCourses = allCourses.filter(c => !c.enrolled);

  if (loading) return <div style={styles.page}>Loading...</div>;

  return (
    <div style={styles.page}>
      <h2 style={styles.welcome}>Welcome, {user.name}</h2>
      <div style={styles.grid}>
        <section style={styles.card}>
          <div style={styles.cardHeader}>
            <h3 style={styles.sectionTitle}>My Courses</h3>
            <button onClick={openCoursePanel} style={styles.btnSmall}>
              {showCoursePanel ? "Close" : "+ Add Course"}
            </button>
          </div>
          {courses.length === 0 && <p style={styles.empty}>No courses enrolled.</p>}
          {courses.map(c => (
            <div key={c.courseID} style={styles.courseItem}>
              <strong>{c.courseName}</strong>{c.section ? ` §${c.section}` : ""}
              <div style={styles.meta}>
                {[c.days, c.startTime && c.endTime ? `${c.startTime}–${c.endTime}` : (c.startTime || c.endTime || null), c.location].filter(Boolean).join(" · ")}
              </div>
            </div>
          ))}

          {showCoursePanel && (
            <div style={styles.panel}>
              <div style={styles.subTabs}>
                <button
                  style={courseTab === "browse" ? styles.subTabActive : styles.subTab}
                  onClick={() => setCourseTab("browse")}
                >
                  Browse Existing
                </button>
                <button
                  style={courseTab === "create" ? styles.subTabActive : styles.subTab}
                  onClick={() => setCourseTab("create")}
                >
                  Create New
                </button>
              </div>

              {courseError && <p style={styles.error}>{courseError}</p>}

              {courseTab === "browse" && (
                <div>
                  {unenrolledCourses.length === 0
                    ? <p style={styles.empty}>You're enrolled in all available courses.</p>
                    : unenrolledCourses.map(c => (
                        <div key={c.courseID} style={styles.browseRow}>
                          <div>
                            <strong style={{ fontSize: 13 }}>{c.courseName}</strong>{c.section ? ` §${c.section}` : ""}
                            {c.days || c.startTime
                              ? <div style={styles.meta}>{[c.days, c.startTime && c.endTime ? `${c.startTime}–${c.endTime}` : null, c.location].filter(Boolean).join(" · ")}</div>
                              : null}
                          </div>
                          <button onClick={() => enrollIn(c.courseID)} style={styles.btnEnroll}>Enroll</button>
                        </div>
                      ))
                  }
                </div>
              )}

              {courseTab === "create" && (
                <form onSubmit={createCourse} style={styles.createForm}>
                  <input
                    placeholder="Course name *"
                    value={newCourse.courseName}
                    onChange={e => setNewCourse(f => ({ ...f, courseName: e.target.value }))}
                    required
                    style={styles.input}
                  />
                  <div style={styles.formRow}>
                    <input placeholder="Section" value={newCourse.section} onChange={e => setNewCourse(f => ({ ...f, section: e.target.value }))} style={styles.input} />
                    <input placeholder="Semester" value={newCourse.semester} onChange={e => setNewCourse(f => ({ ...f, semester: e.target.value }))} style={styles.input} />
                  </div>
                  <div style={styles.formRow}>
                    <input placeholder="Start time (e.g. 9:30 AM)" value={newCourse.startTime} onChange={e => setNewCourse(f => ({ ...f, startTime: e.target.value }))} style={styles.input} />
                    <input placeholder="End time (e.g. 10:45 AM)" value={newCourse.endTime} onChange={e => setNewCourse(f => ({ ...f, endTime: e.target.value }))} style={styles.input} />
                  </div>
                  <input placeholder="Location" value={newCourse.location} onChange={e => setNewCourse(f => ({ ...f, location: e.target.value }))} style={styles.input} />
                  <button type="submit" style={styles.btnEnroll}>Create & Enroll</button>
                </form>
              )}
            </div>
          )}
        </section>

        <section style={styles.card}>
          <h3 style={styles.sectionTitle}>Unread Notifications</h3>
          {notifications.length === 0 && <p style={styles.empty}>No unread notifications.</p>}
          {notifications.map(n => (
            <div key={n.notificationID} style={styles.notifItem}>
              {n.type && <span style={styles.notifType}>{n.type}</span>}
              <span>{n.message}</span>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}

const styles = {
  page:         { padding: "32px 40px", fontFamily: "system-ui, sans-serif", background: "#f5f5f5", minHeight: "calc(100vh - 52px)" },
  welcome:      { fontSize: 22, fontWeight: 600, color: "#1e293b", marginBottom: 24, marginTop: 0 },
  grid:         { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start" },
  card:         { background: "#fff", borderRadius: 8, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.07)" },
  cardHeader:   { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: 600, color: "#334155", margin: 0 },
  courseItem:   { borderBottom: "1px solid #f1f5f9", paddingBottom: 12, marginBottom: 12 },
  meta:         { fontSize: 13, color: "#64748b", marginTop: 4 },
  notifItem:    { display: "flex", gap: 8, alignItems: "flex-start", borderBottom: "1px solid #f1f5f9", paddingBottom: 10, marginBottom: 10, fontSize: 14 },
  notifType:    { background: "#dbeafe", color: "#1d4ed8", borderRadius: 4, padding: "2px 6px", fontSize: 12, whiteSpace: "nowrap", flexShrink: 0 },
  empty:        { color: "#94a3b8", fontSize: 14, margin: "8px 0 0" },
  btnSmall:     { padding: "5px 12px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontFamily: "system-ui, sans-serif" },
  panel:        { marginTop: 16, borderTop: "1px solid #e2e8f0", paddingTop: 14 },
  subTabs:      { display: "flex", gap: 0, marginBottom: 12 },
  subTab:       { flex: 1, padding: "6px 0", background: "none", border: "none", borderBottom: "2px solid #e2e8f0", cursor: "pointer", fontSize: 13, color: "#64748b" },
  subTabActive: { flex: 1, padding: "6px 0", background: "none", border: "none", borderBottom: "2px solid #2563eb", cursor: "pointer", fontSize: 13, color: "#2563eb", fontWeight: 600 },
  browseRow:    { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f1f5f9" },
  btnEnroll:    { padding: "5px 12px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, flexShrink: 0, fontFamily: "system-ui, sans-serif" },
  createForm:   { display: "flex", flexDirection: "column", gap: 8 },
  formRow:      { display: "flex", gap: 8 },
  input:        { padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 13, fontFamily: "system-ui, sans-serif", background: "#fff", color: "#1e293b", flex: 1 },
  error:        { color: "#dc2626", fontSize: 13, margin: "4px 0" },
};
