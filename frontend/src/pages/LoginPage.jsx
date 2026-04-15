import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { api } from "../api";

export default function LoginPage() {
  const [tab, setTab] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  function update(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const path = tab === "login" ? "/auth/login" : "/auth/register";
      const body = tab === "login"
        ? { email: form.email, password: form.password }
        : { name: form.name, email: form.email, password: form.password };
      const data = await api.post(path, body);
      login(data.token, data.user);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>SchedU</h1>
        <div style={styles.tabs}>
          <button
            style={tab === "login" ? styles.activeTab : styles.tab}
            onClick={() => { setTab("login"); setError(""); }}
          >
            Log In
          </button>
          <button
            style={tab === "signup" ? styles.activeTab : styles.tab}
            onClick={() => { setTab("signup"); setError(""); }}
          >
            Sign Up
          </button>
        </div>
        <form onSubmit={handleSubmit} style={styles.form}>
          {tab === "signup" && (
            <input
              name="name"
              placeholder="Full name"
              value={form.name}
              onChange={update}
              required
              style={styles.input}
            />
          )}
          <input
            name="email"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={update}
            required
            style={styles.input}
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={update}
            required
            style={styles.input}
          />
          {error && <p style={styles.error}>{error}</p>}
          <button type="submit" style={styles.submit}>
            {tab === "login" ? "Log In" : "Sign Up"}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page:      { minHeight: "calc(100vh - 52px)", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f5f5", fontFamily: "system-ui, sans-serif" },
  card:      { background: "#fff", borderRadius: 8, padding: "36px 40px", width: 360, boxShadow: "0 2px 12px rgba(0,0,0,0.10)" },
  title:     { margin: "0 0 24px", fontSize: 24, fontWeight: 700, color: "#1e293b", textAlign: "center" },
  tabs:      { display: "flex", marginBottom: 20 },
  tab:       { flex: 1, padding: "8px 0", background: "none", border: "none", borderBottom: "2px solid #e2e8f0", cursor: "pointer", fontSize: 14, color: "#64748b" },
  activeTab: { flex: 1, padding: "8px 0", background: "none", border: "none", borderBottom: "2px solid #2563eb", cursor: "pointer", fontSize: 14, color: "#2563eb", fontWeight: 600 },
  form:      { display: "flex", flexDirection: "column", gap: 12 },
  input:     { padding: "10px 12px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 14, outline: "none", fontFamily: "system-ui, sans-serif", background: "#fff", color: "#1e293b" },
  error:     { color: "#dc2626", fontSize: 13, margin: 0 },
  submit:    { padding: "10px 0", background: "#2563eb", color: "#fff", border: "none", borderRadius: 6, fontSize: 15, cursor: "pointer", fontWeight: 600, marginTop: 4, fontFamily: "system-ui, sans-serif" },
};
