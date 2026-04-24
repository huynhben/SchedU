import { useState } from "react";
import { api } from "../api";

export default function ChangePasswordModal({ onClose }) {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
    setSuccess("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const data = await api.put("/auth/change-password", {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setSuccess(data.message);
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <h3 style={styles.title}>Change Password</h3>
        <form onSubmit={handleSubmit}>
          <label style={styles.label}>Current Password</label>
          <input
            style={styles.input}
            type="password"
            name="currentPassword"
            value={form.currentPassword}
            onChange={handleChange}
            required
          />
          <label style={styles.label}>New Password</label>
          <input
            style={styles.input}
            type="password"
            name="newPassword"
            value={form.newPassword}
            onChange={handleChange}
            required
          />
          <label style={styles.label}>Confirm New Password</label>
          <input
            style={styles.input}
            type="password"
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
            required
          />
          {error && <p style={styles.error}>{error}</p>}
          {success && <p style={styles.success}>{success}</p>}
          <div style={styles.actions}>
            <button type="button" onClick={onClose} style={styles.cancel}>Cancel</button>
            <button type="submit" style={styles.save} disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  modal:   { background: "#fff", borderRadius: 8, padding: "28px 32px", width: 340, boxShadow: "0 4px 24px rgba(0,0,0,0.15)" },
  title:   { margin: "0 0 20px", fontSize: 18, fontWeight: 600, color: "#1e293b" },
  label:   { display: "block", fontSize: 13, fontWeight: 500, color: "#475569", marginBottom: 4 },
  input:   { width: "100%", boxSizing: "border-box", padding: "8px 10px", border: "1px solid #cbd5e1", borderRadius: 4, fontSize: 14, marginBottom: 14, background: "#fff", color: "#1e293b" },
  error:   { color: "#dc2626", fontSize: 13, margin: "0 0 12px" },
  success: { color: "#16a34a", fontSize: 13, margin: "0 0 12px" },
  actions: { display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 4 },
  cancel:  { padding: "7px 16px", borderRadius: 4, border: "1px solid #cbd5e1", background: "#fff", color: "#1e293b", cursor: "pointer", fontSize: 14 },
  save:    { padding: "7px 16px", borderRadius: 4, border: "none", background: "#2563eb", color: "#fff", cursor: "pointer", fontSize: 14 },
};
