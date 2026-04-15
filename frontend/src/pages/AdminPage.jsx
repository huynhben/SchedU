import { useState, useEffect } from "react";
import { api } from "../api";

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", isAdmin: false });
  const [error, setError] = useState("");

  useEffect(() => { load(); }, []);

  async function load() {
    const data = await api.get("/admin/users");
    setUsers(data || []);
  }

  async function deleteUser(id) {
    if (!window.confirm("Delete this user permanently?")) return;
    try {
      await api.del(`/admin/users/${id}`);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function createUser(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/admin/users", form);
      setForm({ name: "", email: "", password: "", isAdmin: false });
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h2 style={styles.title}>Admin — Users</h2>
        <button onClick={() => setShowForm(f => !f)} style={styles.btn}>+ Create User</button>
      </div>
      {error && <p style={styles.error}>{error}</p>}
      {showForm && (
        <form onSubmit={createUser} style={styles.form}>
          <input
            placeholder="Name"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            required
            style={styles.input}
          />
          <input
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            required
            style={styles.input}
          />
          <input
            placeholder="Password"
            type="password"
            value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            required
            style={styles.input}
          />
          <label style={styles.checkLabel}>
            <input
              type="checkbox"
              checked={form.isAdmin}
              onChange={e => setForm(f => ({ ...f, isAdmin: e.target.checked }))}
            />
            Admin
          </label>
          <button type="submit" style={styles.btn}>Save</button>
          <button type="button" onClick={() => setShowForm(false)} style={styles.btnSecondary}>Cancel</button>
        </form>
      )}
      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              {["Name", "Email", "Admin", ""].map(h => (
                <th key={h} style={styles.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.length === 0 && (
              <tr><td colSpan={4} style={{ ...styles.td, color: "#94a3b8", textAlign: "center" }}>No users found.</td></tr>
            )}
            {users.map(u => (
              <tr key={u.userID} style={styles.tr}>
                <td style={styles.td}>{u.name}</td>
                <td style={styles.td}>{u.email}</td>
                <td style={styles.td}>{u.isAdmin ? "Yes" : "No"}</td>
                <td style={styles.td}>
                  <button onClick={() => deleteUser(u.userID)} style={styles.btnDanger}>Delete</button>
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
  btnDanger:   { padding: "6px 12px", background: "#dc2626", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13, fontFamily: "system-ui, sans-serif" },
  form:        { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", background: "#fff", padding: 16, borderRadius: 8, marginBottom: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.07)" },
  input:       { padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 13, fontFamily: "system-ui, sans-serif" },
  checkLabel:  { fontSize: 13, display: "flex", alignItems: "center", gap: 6, color: "#334155" },
  error:       { color: "#dc2626", fontSize: 13 },
};
