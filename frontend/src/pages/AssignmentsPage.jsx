import { useState, useEffect } from "react";
import { api } from "../api";

const STATUS_OPTIONS = ["pending", "in-progress", "complete"];
const PRIORITY_OPTIONS = ["low", "medium", "high"];

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [filter, setFilter] = useState("");
  const [editID, setEditID] = useState(null);
  const [editVals, setEditVals] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [newAssignment, setNewAssignment] = useState({ courseID: "", title: "", description: "", estimatedTime: "", priority: "", status: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    load();
    api.get("/my/courses").then(d => setCourses(d || []));
  }, []);

  async function load() {
    const data = await api.get("/my/assignments");
    setAssignments(data || []);
  }

  function startEdit(a) {
    setEditID(a.assignmentID);
    setEditVals({ status: a.status || "", priority: a.priority || "" });
  }

  async function saveEdit(id) {
    try {
      await api.put(`/my/assignments/${id}`, editVals);
      setEditID(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function addAssignment(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/my/assignments", {
        ...newAssignment,
        estimatedTime: newAssignment.estimatedTime ? parseInt(newAssignment.estimatedTime) : null,
      });
      setNewAssignment({ courseID: "", title: "", description: "", estimatedTime: "", priority: "", status: "" });
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  const visible = filter ? assignments.filter(a => a.status === filter) : assignments;

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h2 style={styles.title}>Assignments</h2>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <select value={filter} onChange={e => setFilter(e.target.value)} style={styles.select}>
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button onClick={() => setShowForm(f => !f)} style={styles.btn}>+ Add</button>
        </div>
      </div>
      {error && <p style={styles.error}>{error}</p>}
      {showForm && (
        <form onSubmit={addAssignment} style={styles.form}>
          <select
            value={newAssignment.courseID}
            onChange={e => setNewAssignment(f => ({ ...f, courseID: e.target.value }))}
            required
            style={styles.input}
          >
            <option value="">Select course</option>
            {courses.map(c => (
              <option key={c.courseID} value={c.courseID}>{c.courseName}{c.section ? ` §${c.section}` : ""}</option>
            ))}
          </select>
          <input
            placeholder="Title"
            value={newAssignment.title}
            onChange={e => setNewAssignment(f => ({ ...f, title: e.target.value }))}
            required
            style={styles.input}
          />
          <input
            placeholder="Description"
            value={newAssignment.description}
            onChange={e => setNewAssignment(f => ({ ...f, description: e.target.value }))}
            style={styles.input}
          />
          <input
            placeholder="Est. time (min)"
            type="number"
            value={newAssignment.estimatedTime}
            onChange={e => setNewAssignment(f => ({ ...f, estimatedTime: e.target.value }))}
            style={{ ...styles.input, width: 120 }}
          />
          <select
            value={newAssignment.priority}
            onChange={e => setNewAssignment(f => ({ ...f, priority: e.target.value }))}
            style={styles.input}
          >
            <option value="">Priority</option>
            {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select
            value={newAssignment.status}
            onChange={e => setNewAssignment(f => ({ ...f, status: e.target.value }))}
            style={styles.input}
          >
            <option value="">Status</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button type="submit" style={styles.btn}>Save</button>
          <button type="button" onClick={() => setShowForm(false)} style={styles.btnSecondary}>Cancel</button>
        </form>
      )}
      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              {["Title", "Course", "Priority", "Status", "Grade", ""].map(h => (
                <th key={h} style={styles.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr><td colSpan={6} style={{ ...styles.td, color: "#94a3b8", textAlign: "center" }}>No assignments found.</td></tr>
            )}
            {visible.map(a => (
              <tr key={a.assignmentID} style={styles.tr}>
                <td style={styles.td}>{a.title}</td>
                <td style={styles.td}>{a.courseName}</td>
                <td style={styles.td}>
                  {editID === a.assignmentID
                    ? <select value={editVals.priority} onChange={e => setEditVals(v => ({ ...v, priority: e.target.value }))} style={styles.select}>
                        <option value=""></option>
                        {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    : a.priority}
                </td>
                <td style={styles.td}>
                  {editID === a.assignmentID
                    ? <select value={editVals.status} onChange={e => setEditVals(v => ({ ...v, status: e.target.value }))} style={styles.select}>
                        <option value=""></option>
                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    : a.status}
                </td>
                <td style={styles.td}>{a.grade}</td>
                <td style={styles.td}>
                  {editID === a.assignmentID
                    ? <>
                        <button onClick={() => saveEdit(a.assignmentID)} style={{ ...styles.btn, marginRight: 6 }}>Save</button>
                        <button onClick={() => setEditID(null)} style={styles.btnSecondary}>Cancel</button>
                      </>
                    : <button onClick={() => startEdit(a)} style={styles.btnSecondary}>Edit</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const styles = {
  page:        { padding: "32px 40px", fontFamily: "system-ui, sans-serif", background: "#f5f5f5", minHeight: "calc(100vh - 52px)" },
  header:      { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  title:       { fontSize: 22, fontWeight: 600, color: "#1e293b", margin: 0 },
  tableWrap:   { borderRadius: 8, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.07)" },
  table:       { width: "100%", borderCollapse: "collapse", background: "#fff" },
  th:          { textAlign: "left", padding: "10px 14px", background: "#f8fafc", fontSize: 13, fontWeight: 600, color: "#475569", borderBottom: "1px solid #e2e8f0" },
  tr:          { borderBottom: "1px solid #f1f5f9" },
  td:          { padding: "10px 14px", fontSize: 14, color: "#334155" },
  btn:         { padding: "7px 14px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13, fontFamily: "system-ui, sans-serif" },
  btnSecondary:{ padding: "6px 12px", background: "none", color: "#2563eb", border: "1px solid #2563eb", borderRadius: 6, cursor: "pointer", fontSize: 13, fontFamily: "system-ui, sans-serif" },
  select:      { padding: "6px 10px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 13, fontFamily: "system-ui, sans-serif" },
  input:       { padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 13, fontFamily: "system-ui, sans-serif" },
  form:        { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", background: "#fff", padding: 16, borderRadius: 8, marginBottom: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.07)" },
  error:       { color: "#dc2626", fontSize: 13 },
};
