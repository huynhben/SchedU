import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import ChangePasswordModal from "./ChangePasswordModal";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <>
      <nav style={styles.nav}>
        <span style={styles.brand}>SchedU</span>
        {user && (
          <div style={styles.links}>
            <Link to="/dashboard" style={styles.link}>Dashboard</Link>
            <Link to="/assignments" style={styles.link}>Assignments</Link>
            <Link to="/events" style={styles.link}>Events</Link>
            <Link to="/calendar" style={styles.link}>Calendar</Link>
            <Link to="/analytics" style={styles.link}>Analytics</Link>
            {user.isAdmin === 1 && (
              <Link to="/admin" style={styles.link}>Admin</Link>
            )}
          </div>
        )}
        <div style={styles.right}>
          {user && (
            <div ref={dropdownRef} style={styles.userMenu}>
              <button
                style={styles.userBtn}
                onClick={() => setDropdownOpen(o => !o)}
              >
                {user.name} ▾
              </button>
              {dropdownOpen && (
                <div style={styles.dropdown}>
                  <button
                    style={styles.dropItem}
                    onClick={() => { setShowModal(true); setDropdownOpen(false); }}
                  >
                    Change Password
                  </button>
                  <button style={styles.dropItem} onClick={handleLogout}>
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </nav>
      {showModal && <ChangePasswordModal onClose={() => setShowModal(false)} />}
    </>
  );
}

const styles = {
  nav:      { display: "flex", alignItems: "center", background: "#2563eb", padding: "0 24px", height: 52, color: "#fff", fontFamily: "system-ui, sans-serif" },
  brand:    { fontWeight: 700, fontSize: 18, marginRight: "auto" },
  links:    { display: "flex", gap: 20 },
  link:     { color: "#fff", textDecoration: "none", fontSize: 14 },
  right:    { marginLeft: 24 },
  userMenu: { position: "relative" },
  userBtn:  { background: "transparent", border: "1px solid #fff", color: "#fff", padding: "4px 12px", borderRadius: 4, cursor: "pointer", fontSize: 14 },
  dropdown: { position: "absolute", right: 0, top: "calc(100% + 6px)", background: "#fff", borderRadius: 6, boxShadow: "0 4px 16px rgba(0,0,0,0.15)", minWidth: 160, zIndex: 100 },
  dropItem: { display: "block", width: "100%", padding: "10px 16px", background: "none", border: "none", textAlign: "left", fontSize: 14, color: "#1e293b", cursor: "pointer" },
};
