import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <nav style={styles.nav}>
      <span style={styles.brand}>SchedU</span>
      {user && (
        <div style={styles.links}>
          <Link to="/dashboard" style={styles.link}>Dashboard</Link>
          <Link to="/assignments" style={styles.link}>Assignments</Link>
          <Link to="/events" style={styles.link}>Events</Link>
          {user.isAdmin === 1 && (
            <Link to="/admin" style={styles.link}>Admin</Link>
          )}
        </div>
      )}
      <div style={styles.right}>
        {user
          ? <button onClick={handleLogout} style={styles.btn}>Logout</button>
          : null
        }
      </div>
    </nav>
  );
}

const styles = {
  nav:   { display: "flex", alignItems: "center", background: "#2563eb", padding: "0 24px", height: 52, color: "#fff", fontFamily: "system-ui, sans-serif" },
  brand: { fontWeight: 700, fontSize: 18, marginRight: "auto" },
  links: { display: "flex", gap: 20 },
  link:  { color: "#fff", textDecoration: "none", fontSize: 14 },
  right: { marginLeft: 24 },
  btn:   { background: "transparent", border: "1px solid #fff", color: "#fff", padding: "4px 12px", borderRadius: 4, cursor: "pointer", fontSize: 14 },
};
