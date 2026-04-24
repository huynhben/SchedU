import { useState, useEffect } from "react";
import { useAuth } from "../AuthContext";
import { api } from "../api";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function dueDateLabel(dueDate) {
  if (!dueDate) return null;
  const due = new Date(dueDate);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  const diff = Math.round((due - now) / 86400000);
  if (diff < 0)   return { text: `${Math.abs(diff)}d overdue`, color: "#dc2626" };
  if (diff === 0) return { text: "Due today",    color: "#d97706" };
  if (diff === 1) return { text: "Due tomorrow", color: "#d97706" };
  return { text: `Due in ${diff}d`, color: "#64748b" };
}

function urgencyStyle(urgency) {
  if (urgency === "high")   return { background: "#fee2e2", color: "#dc2626" };
  if (urgency === "medium") return { background: "#ffedd5", color: "#ea580c" };
  return { background: "#dbeafe", color: "#1d4ed8" };
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [events, setEvents] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [smartNotifs, setSmartNotifs] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showCoursePanel, setShowCoursePanel] = useState(false);
  const [courseTab, setCourseTab] = useState("browse");
  const [allCourses, setAllCourses] = useState([]);
  const [newCourse, setNewCourse] = useState({ courseName: "", section: "", semester: "", startTime: "", endTime: "", location: "" });
  const [courseError, setCourseError] = useState("");

  useEffect(() => { loadDashboard(); }, []);

  async function loadDashboard() {
    const [c, a, ev, n, sn, o] = await Promise.all([
      api.get("/my/courses"),
      api.get("/my/assignments"),
      api.get("/my/events"),
      api.get("/my/notifications"),
      api.get("/my/notifications/smart"),
      api.get("/my/organizations"),
    ]);
    setCourses(c || []);
    setAssignments(a || []);
    setEvents(ev || []);
    setNotifications(n || []);
    setSmartNotifs(sn || []);
    setOrganizations(o || []);
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
      const [enrolled, all] = await Promise.all([api.get("/my/courses"), api.get("/my/all-courses")]);
      setCourses(enrolled || []);
      setAllCourses(all || []);
    } catch (err) { setCourseError(err.message); }
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
    } catch (err) { setCourseError(err.message); }
  }

  const today = new Date();
  const todayName = DAY_NAMES[today.getDay()];

  const todayCourses = courses.filter(c =>
    c.days && c.days.split(", ").includes(todayName)
  );

  const todayEvents = events.filter(e => {
    if (!e.startTime) return false;
    const d = new Date(e.startTime);
    return d.toDateString() === today.toDateString();
  });

  const upcomingAssignments = assignments
    .filter(a => a.dueDate && a.status !== "Done")
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 5);

  const unenrolledCourses = allCourses.filter(c => !c.enrolled);

  if (loading) return <div style={st.page}>Loading...</div>;

  return (
    <div style={st.page}>
      <h2 style={st.welcome}>Welcome, {user.name}</h2>

      {/* Today's Schedule — full width */}
      <section style={{ ...st.card, marginBottom: 24 }}>
        <h3 style={st.sectionTitle}>
          Today's Schedule
          <span style={st.todayLabel}>{today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</span>
        </h3>
        {todayCourses.length === 0 && todayEvents.length === 0 && (
          <p style={st.empty}>Nothing scheduled for today.</p>
        )}
        <div style={st.scheduleGrid}>
          {todayCourses.map(c => (
            <div key={c.courseID} style={st.scheduleItem}>
              <div style={{ ...st.scheduleBar, background: "#2563eb" }} />
              <div>
                <div style={st.scheduleTitle}>{c.courseName}{c.section ? ` §${c.section}` : ""}</div>
                <div style={st.scheduleSub}>{c.startTime && c.endTime ? `${c.startTime} – ${c.endTime}` : ""}{c.location ? ` · ${c.location}` : ""}</div>
              </div>
            </div>
          ))}
          {todayEvents.map(e => (
            <div key={e.eventID} style={st.scheduleItem}>
              <div style={{ ...st.scheduleBar, background: "#16a34a" }} />
              <div>
                <div style={st.scheduleTitle}>{e.title}</div>
                <div style={st.scheduleSub}>{e.organizationName}{e.location ? ` · ${e.location}` : ""}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Row 2: Upcoming Assignments + Notifications */}
      <div style={st.grid}>
        <section style={st.card}>
          <h3 style={st.sectionTitle}>Upcoming Assignments</h3>
          {upcomingAssignments.length === 0 && <p style={st.empty}>No upcoming assignments.</p>}
          {upcomingAssignments.map(a => {
            const label = dueDateLabel(a.dueDate);
            return (
              <div key={a.assignmentID} style={st.assignItem}>
                <div style={st.assignLeft}>
                  <div style={st.assignTitle}>{a.title}</div>
                  <div style={st.meta}>{a.courseName} · {a.priority || "No priority"} · {a.status}</div>
                </div>
                {label && <span style={{ ...st.dueTag, color: label.color }}>{label.text}</span>}
              </div>
            );
          })}
        </section>

        <section style={st.card}>
          <h3 style={st.sectionTitle}>Notifications</h3>
          {smartNotifs.length === 0 && notifications.length === 0 && (
            <p style={st.empty}>No notifications.</p>
          )}
          {smartNotifs.map((n, i) => (
            <div key={i} style={st.notifItem}>
              <span style={{ ...st.notifType, ...urgencyStyle(n.urgency) }}>{n.type}</span>
              <span style={{ fontSize: 14 }}>{n.message}</span>
            </div>
          ))}
          {notifications.length > 0 && (
            <>
              {smartNotifs.length > 0 && <div style={st.divider} />}
              {notifications.map(n => (
                <div key={n.notificationID} style={st.notifItem}>
                  {n.type && <span style={st.notifType}>{n.type}</span>}
                  <span style={{ fontSize: 14 }}>{n.message}</span>
                </div>
              ))}
            </>
          )}
        </section>

        {/* Row 3: My Courses + My Organizations */}
        <section style={st.card}>
          <div style={st.cardHeader}>
            <h3 style={st.sectionTitle}>My Courses</h3>
            <button onClick={openCoursePanel} style={st.btnSmall}>
              {showCoursePanel ? "Close" : "+ Add Course"}
            </button>
          </div>
          {courses.length === 0 && <p style={st.empty}>No courses enrolled.</p>}
          {courses.map(c => (
            <div key={c.courseID} style={st.courseItem}>
              <strong>{c.courseName}</strong>{c.section ? ` §${c.section}` : ""}
              <div style={st.meta}>
                {[c.days, c.startTime && c.endTime ? `${c.startTime}–${c.endTime}` : null, c.location].filter(Boolean).join(" · ")}
              </div>
            </div>
          ))}
          {showCoursePanel && (
            <div style={st.panel}>
              <div style={st.subTabs}>
                <button style={courseTab === "browse" ? st.subTabActive : st.subTab} onClick={() => setCourseTab("browse")}>Browse Existing</button>
                <button style={courseTab === "create" ? st.subTabActive : st.subTab} onClick={() => setCourseTab("create")}>Create New</button>
              </div>
              {courseError && <p style={st.error}>{courseError}</p>}
              {courseTab === "browse" && (
                <div>
                  {unenrolledCourses.length === 0
                    ? <p style={st.empty}>You're enrolled in all available courses.</p>
                    : unenrolledCourses.map(c => (
                        <div key={c.courseID} style={st.browseRow}>
                          <div>
                            <strong style={{ fontSize: 13 }}>{c.courseName}</strong>{c.section ? ` §${c.section}` : ""}
                            {(c.days || c.startTime) && (
                              <div style={st.meta}>{[c.days, c.startTime && c.endTime ? `${c.startTime}–${c.endTime}` : null, c.location].filter(Boolean).join(" · ")}</div>
                            )}
                          </div>
                          <button onClick={() => enrollIn(c.courseID)} style={st.btnEnroll}>Enroll</button>
                        </div>
                      ))
                  }
                </div>
              )}
              {courseTab === "create" && (
                <form onSubmit={createCourse} style={st.createForm}>
                  <input placeholder="Course name *" value={newCourse.courseName} onChange={e => setNewCourse(f => ({ ...f, courseName: e.target.value }))} required style={st.input} />
                  <div style={st.formRow}>
                    <input placeholder="Section" value={newCourse.section} onChange={e => setNewCourse(f => ({ ...f, section: e.target.value }))} style={st.input} />
                    <input placeholder="Semester" value={newCourse.semester} onChange={e => setNewCourse(f => ({ ...f, semester: e.target.value }))} style={st.input} />
                  </div>
                  <div style={st.formRow}>
                    <input placeholder="Start time (e.g. 9:30 AM)" value={newCourse.startTime} onChange={e => setNewCourse(f => ({ ...f, startTime: e.target.value }))} style={st.input} />
                    <input placeholder="End time (e.g. 10:45 AM)" value={newCourse.endTime} onChange={e => setNewCourse(f => ({ ...f, endTime: e.target.value }))} style={st.input} />
                  </div>
                  <input placeholder="Location" value={newCourse.location} onChange={e => setNewCourse(f => ({ ...f, location: e.target.value }))} style={st.input} />
                  <button type="submit" style={st.btnEnroll}>Create & Enroll</button>
                </form>
              )}
            </div>
          )}
        </section>

        <section style={st.card}>
          <h3 style={st.sectionTitle}>My Organizations</h3>
          {organizations.length === 0 && <p style={st.empty}>Not a member of any organizations.</p>}
          {organizations.map(o => (
            <div key={o.organizationID} style={st.orgItem}>
              <strong>{o.organizationName}</strong>
              {o.role && <span style={st.roleTag}>{o.role}</span>}
              {o.description && <div style={{ ...st.meta, width: "100%" }}>{o.description}</div>}
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}

const st = {
  page:         { padding: "32px 40px", fontFamily: "system-ui, sans-serif", background: "#f5f5f5", minHeight: "calc(100vh - 52px)" },
  welcome:      { fontSize: 22, fontWeight: 600, color: "#1e293b", marginBottom: 24, marginTop: 0 },
  grid:         { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start" },
  card:         { background: "#fff", borderRadius: 8, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.07)" },
  cardHeader:   { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: 600, color: "#334155", margin: "0 0 16px", display: "flex", alignItems: "center", gap: 12 },
  todayLabel:   { fontSize: 13, fontWeight: 400, color: "#94a3b8" },
  scheduleGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 },
  scheduleItem: { display: "flex", gap: 10, alignItems: "flex-start" },
  scheduleBar:  { width: 4, borderRadius: 2, alignSelf: "stretch", flexShrink: 0, minHeight: 36 },
  scheduleTitle:{ fontSize: 14, fontWeight: 600, color: "#1e293b" },
  scheduleSub:  { fontSize: 12, color: "#64748b", marginTop: 2 },
  assignItem:   { display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid #f1f5f9", paddingBottom: 10, marginBottom: 10 },
  assignLeft:   { flex: 1 },
  assignTitle:  { fontSize: 14, fontWeight: 600, color: "#1e293b" },
  dueTag:       { fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", marginLeft: 8, flexShrink: 0 },
  courseItem:   { borderBottom: "1px solid #f1f5f9", paddingBottom: 12, marginBottom: 12 },
  orgItem:      { borderBottom: "1px solid #f1f5f9", paddingBottom: 12, marginBottom: 12, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 },
  roleTag:      { background: "#f1f5f9", color: "#475569", borderRadius: 4, padding: "2px 7px", fontSize: 11, fontWeight: 600 },
  meta:         { fontSize: 13, color: "#64748b", marginTop: 4 },
  notifItem:    { display: "flex", gap: 8, alignItems: "flex-start", borderBottom: "1px solid #f1f5f9", paddingBottom: 10, marginBottom: 10 },
  notifType:    { background: "#dbeafe", color: "#1d4ed8", borderRadius: 4, padding: "2px 6px", fontSize: 12, whiteSpace: "nowrap", flexShrink: 0 },
  divider:      { borderTop: "1px solid #f1f5f9", margin: "10px 0" },
  empty:        { color: "#94a3b8", fontSize: 14, margin: "8px 0 0" },
  btnSmall:     { padding: "5px 12px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontFamily: "system-ui, sans-serif" },
  panel:        { marginTop: 16, borderTop: "1px solid #e2e8f0", paddingTop: 14 },
  subTabs:      { display: "flex", marginBottom: 12 },
  subTab:       { flex: 1, padding: "6px 0", background: "none", border: "none", borderBottom: "2px solid #e2e8f0", cursor: "pointer", fontSize: 13, color: "#64748b" },
  subTabActive: { flex: 1, padding: "6px 0", background: "none", border: "none", borderBottom: "2px solid #2563eb", cursor: "pointer", fontSize: 13, color: "#2563eb", fontWeight: 600 },
  browseRow:    { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f1f5f9" },
  btnEnroll:    { padding: "5px 12px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, flexShrink: 0, fontFamily: "system-ui, sans-serif" },
  createForm:   { display: "flex", flexDirection: "column", gap: 8 },
  formRow:      { display: "flex", gap: 8 },
  input:        { padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 13, fontFamily: "system-ui, sans-serif", background: "#fff", color: "#1e293b", flex: 1 },
  error:        { color: "#dc2626", fontSize: 13, margin: "4px 0" },
};
