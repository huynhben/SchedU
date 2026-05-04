import { useState, useEffect, useRef } from "react";
import { api } from "../api";

const STATUS_OPTIONS = ["Not Started", "In Progress", "Done"];
const PRIORITY_OPTIONS = ["Low", "Medium", "High"];

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${String(s).padStart(2, "0")}s`;
  return `${m}m ${String(s).padStart(2, "0")}s`;
}

function dueDateLabel(dueDate) {
  if (!dueDate) return null;
  const due = new Date(dueDate);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  const diff = Math.round((due - now) / 86400000);
  if (diff < 0)  return { text: `${Math.abs(diff)}d overdue`, color: "#dc2626" };
  if (diff === 0) return { text: "Due today",     color: "#d97706" };
  if (diff === 1) return { text: "Due tomorrow",  color: "#d97706" };
  return { text: `Due in ${diff}d`, color: "#64748b" };
}

const blank = { courseID: "", title: "", description: "", estimatedTime: "", priority: "", status: "", dueDate: "" };

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [timelogs, setTimelogs] = useState([]);
  const [activeTimer, setActiveTimer] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [filter, setFilter] = useState("");
  const [editID, setEditID] = useState(null);
  const [editVals, setEditVals] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [newAssignment, setNewAssignment] = useState(blank);
  const [error, setError] = useState("");
  const intervalRef = useRef(null);

  useEffect(() => {
    load();
    api.get("/my/courses").then(d => setCourses(d || []));
    loadTimers();
  }, []);

  useEffect(() => {
    clearInterval(intervalRef.current);
    if (activeTimer) {
      const start = new Date(activeTimer.startTime).getTime();
      setElapsed(Math.floor((Date.now() - start) / 1000));
      intervalRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - start) / 1000));
      }, 1000);
    } else {
      setElapsed(0);
    }
    return () => clearInterval(intervalRef.current);
  }, [activeTimer]);

  async function load() {
    const data = await api.get("/my/assignments");
    setAssignments(data || []);
  }

  async function loadTimers() {
    const [active, logs] = await Promise.all([
      api.get("/my/timelogs/active"),
      api.get("/my/timelogs"),
    ]);
    setActiveTimer(active || null);
    setTimelogs(logs || []);
  }

  function totalLogged(assignmentID) {
    return timelogs
      .filter(t => t.assignmentID === assignmentID && t.endTime)
      .reduce((sum, t) => sum + (t.seconds || 0), 0);
  }

  async function startTimer(assignmentID) {
    try {
      const result = await api.post("/my/timelogs", { assignmentID });
      setActiveTimer({ logID: result.logID, assignmentID, startTime: new Date().toISOString() });
    } catch (err) { setError(err.message); }
  }

  async function stopTimer() {
    if (!activeTimer) return;
    try {
      await api.put(`/my/timelogs/${activeTimer.logID}/stop`, {});
      setActiveTimer(null);
      loadTimers();
    } catch (err) { setError(err.message); }
  }

  function startEdit(a) {
    setEditID(a.assignmentID);
    setEditVals({
      status: a.status || "",
      priority: a.priority || "",
      dueDate: a.dueDate ? a.dueDate.slice(0, 10) : "",
    });
  }

  async function saveEdit(id) {
    try {
      await api.put(`/my/assignments/${id}`, editVals);
      setEditID(null);
      load();
    } catch (err) { setError(err.message); }
  }

  async function deleteAssignment(id) {
    if (!window.confirm("Delete this assignment?")) return;
    try {
      await api.del(`/my/assignments/${id}`);
      load();
    } catch (err) { setError(err.message); }
  }

  async function addAssignment(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/my/assignments", {
        ...newAssignment,
        estimatedTime: newAssignment.estimatedTime ? parseInt(newAssignment.estimatedTime) : null,
      });
      setNewAssignment(blank);
      setShowForm(false);
      load();
    } catch (err) { setError(err.message); }
  }

  const visible = (filter ? assignments.filter(a => a.status === filter) : assignments)
    .slice()
    .sort((a, b) => {
      const doneA = a.status === "Done" ? 1 : 0;
      const doneB = b.status === "Done" ? 1 : 0;
      if (doneA !== doneB) return doneA - doneB;
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return doneA
        ? new Date(b.dueDate) - new Date(a.dueDate)
        : new Date(a.dueDate) - new Date(b.dueDate);
    });

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h2 style={s.title}>Assignments</h2>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {activeTimer && (
            <div style={s.timerBanner}>
              ⏱ {formatDuration(elapsed)}
              <button onClick={stopTimer} style={s.stopBtn}>■ Stop</button>
            </div>
          )}
          <select value={filter} onChange={e => setFilter(e.target.value)} style={s.select}>
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map(st => <option key={st} value={st}>{st}</option>)}
          </select>
          <button onClick={() => setShowForm(f => !f)} style={s.btn}>+ Add</button>
        </div>
      </div>

      {error && <p style={s.error}>{error}</p>}

      {showForm && (
        <form onSubmit={addAssignment} style={s.form}>
          <select value={newAssignment.courseID} onChange={e => setNewAssignment(f => ({ ...f, courseID: e.target.value }))} required style={s.input}>
            <option value="">Select course</option>
            {courses.map(c => <option key={c.courseID} value={c.courseID}>{c.courseName}{c.section ? ` §${c.section}` : ""}</option>)}
          </select>
          <input placeholder="Title" value={newAssignment.title} onChange={e => setNewAssignment(f => ({ ...f, title: e.target.value }))} required style={s.input} />
          <input placeholder="Description" value={newAssignment.description} onChange={e => setNewAssignment(f => ({ ...f, description: e.target.value }))} style={s.input} />
          <input placeholder="Est. time (min)" type="number" value={newAssignment.estimatedTime} onChange={e => setNewAssignment(f => ({ ...f, estimatedTime: e.target.value }))} style={{ ...s.input, width: 130 }} />
          <input type="date" value={newAssignment.dueDate} onChange={e => setNewAssignment(f => ({ ...f, dueDate: e.target.value }))} style={{ ...s.input, width: 140 }} title="Due date" />
          <select value={newAssignment.priority} onChange={e => setNewAssignment(f => ({ ...f, priority: e.target.value }))} style={s.input}>
            <option value="">Priority</option>
            {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={newAssignment.status} onChange={e => setNewAssignment(f => ({ ...f, status: e.target.value }))} style={s.input}>
            <option value="">Status</option>
            {STATUS_OPTIONS.map(st => <option key={st} value={st}>{st}</option>)}
          </select>
          <button type="submit" style={s.btn}>Save</button>
          <button type="button" onClick={() => setShowForm(false)} style={s.btnSecondary}>Cancel</button>
        </form>
      )}

      <div style={s.tableWrap}>
        <table style={s.table}>
          <thead>
            <tr>
              {["Title", "Course", "Due", "Priority", "Status", "Grade", "Logged", "Timer", ""].map(h => (
                <th key={h} style={s.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr><td colSpan={9} style={{ ...s.td, color: "#94a3b8", textAlign: "center" }}>No assignments found.</td></tr>
            )}
            {visible.map(a => {
              const isActive = activeTimer?.assignmentID === a.assignmentID;
              const dueLabel = dueDateLabel(a.dueDate);
              const logged = totalLogged(a.assignmentID);
              return (
                <tr key={a.assignmentID} style={{ ...s.tr, ...(isActive ? s.activeRow : {}) }}>
                  <td style={s.td}><strong>{a.title}</strong>{a.description && <div style={s.sub}>{a.description}</div>}</td>
                  <td style={s.td}>{a.courseName}</td>
                  <td style={s.td}>
                    {editID === a.assignmentID
                      ? <input type="date" value={editVals.dueDate} onChange={e => setEditVals(v => ({ ...v, dueDate: e.target.value }))} style={{ ...s.select, width: 130 }} />
                      : a.status === "Done"
                        ? <span style={{ color: "#16a34a", fontWeight: 500, fontSize: 13 }}>Completed</span>
                        : dueLabel
                          ? <span style={{ color: dueLabel.color, fontWeight: 500, fontSize: 13 }}>{dueLabel.text}</span>
                          : <span style={{ color: "#cbd5e1" }}>—</span>}
                  </td>
                  <td style={s.td}>
                    {editID === a.assignmentID
                      ? <select value={editVals.priority} onChange={e => setEditVals(v => ({ ...v, priority: e.target.value }))} style={s.select}>
                          <option value=""></option>
                          {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      : a.priority || "—"}
                  </td>
                  <td style={s.td}>
                    {editID === a.assignmentID
                      ? <select value={editVals.status} onChange={e => setEditVals(v => ({ ...v, status: e.target.value }))} style={s.select}>
                          <option value=""></option>
                          {STATUS_OPTIONS.map(st => <option key={st} value={st}>{st}</option>)}
                        </select>
                      : a.status || "—"}
                  </td>
                  <td style={s.td}>{a.grade || "—"}</td>
                  <td style={s.td}>
                    {isActive
                      ? <span style={{ color: "#2563eb", fontWeight: 600, fontSize: 13 }}>{formatDuration(elapsed)}</span>
                      : logged > 0
                        ? <span style={{ fontSize: 13, color: "#64748b" }}>{formatDuration(logged)}</span>
                        : <span style={{ color: "#cbd5e1" }}>—</span>}
                  </td>
                  <td style={s.td}>
                    {isActive
                      ? <button onClick={stopTimer} style={s.stopBtn}>■ Stop</button>
                      : a.status !== "Done"
                        ? <button onClick={() => startTimer(a.assignmentID)} style={s.timerBtn}>▶ Start</button>
                        : null}
                  </td>
                  <td style={s.td}>
                    {editID === a.assignmentID
                      ? <>
                          <button onClick={() => saveEdit(a.assignmentID)} style={{ ...s.btn, marginRight: 6 }}>Save</button>
                          <button onClick={() => setEditID(null)} style={s.btnSecondary}>Cancel</button>
                        </>
                      : <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={() => startEdit(a)} style={s.btnSecondary}>Edit</button>
                          <button onClick={() => deleteAssignment(a.assignmentID)} style={s.deleteBtn}>Delete</button>
                        </div>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const s = {
  page:        { padding: "32px 40px", fontFamily: "system-ui, sans-serif", background: "#f5f5f5", minHeight: "calc(100vh - 52px)" },
  header:      { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  title:       { fontSize: 22, fontWeight: 600, color: "#1e293b", margin: 0 },
  tableWrap:   { borderRadius: 8, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.07)" },
  table:       { width: "100%", borderCollapse: "collapse", background: "#fff" },
  th:          { textAlign: "left", padding: "10px 14px", background: "#f8fafc", fontSize: 13, fontWeight: 600, color: "#475569", borderBottom: "1px solid #e2e8f0" },
  tr:          { borderBottom: "1px solid #f1f5f9" },
  activeRow:   { background: "#eff6ff" },
  td:          { padding: "10px 14px", fontSize: 14, color: "#334155", verticalAlign: "top" },
  sub:         { fontSize: 12, color: "#94a3b8", marginTop: 2 },
  btn:         { padding: "7px 14px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13, fontFamily: "system-ui, sans-serif" },
  btnSecondary:{ padding: "6px 12px", background: "none", color: "#2563eb", border: "1px solid #2563eb", borderRadius: 6, cursor: "pointer", fontSize: 13, fontFamily: "system-ui, sans-serif" },
  timerBtn:    { padding: "5px 10px", background: "#f0fdf4", color: "#16a34a", border: "1px solid #86efac", borderRadius: 6, cursor: "pointer", fontSize: 12, fontFamily: "system-ui, sans-serif" },
  stopBtn:     { padding: "5px 10px", background: "#fef2f2", color: "#dc2626", border: "1px solid #fca5a5", borderRadius: 6, cursor: "pointer", fontSize: 12, fontFamily: "system-ui, sans-serif" },
  timerBanner: { display: "flex", alignItems: "center", gap: 8, background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 6, padding: "5px 12px", fontSize: 13, fontWeight: 600, color: "#2563eb" },
  select:      { padding: "6px 10px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 13, fontFamily: "system-ui, sans-serif" },
  input:       { padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 13, fontFamily: "system-ui, sans-serif" },
  form:        { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", background: "#fff", padding: 16, borderRadius: 8, marginBottom: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.07)" },
  deleteBtn:   { padding: "6px 12px", background: "none", color: "#dc2626", border: "1px solid #dc2626", borderRadius: 6, cursor: "pointer", fontSize: 13, fontFamily: "system-ui, sans-serif" },
  error:       { color: "#dc2626", fontSize: 13 },
};
