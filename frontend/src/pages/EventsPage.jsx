import { useState, useEffect } from "react";
import { api } from "../api";

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [orgs, setOrgs] = useState([]);
  const [showEventForm, setShowEventForm] = useState(false);
  const [eventForm, setEventForm] = useState({ organizationID: "", title: "", description: "", startTime: "", endTime: "", location: "" });
  const [eventError, setEventError] = useState("");

  // Org browse state
  const [showOrgPanel, setShowOrgPanel] = useState(false);
  const [allOrgs, setAllOrgs] = useState([]);
  const [orgError, setOrgError] = useState("");

  useEffect(() => {
    loadEvents();
    api.get("/my/organizations").then(d => setOrgs(d || []));
  }, []);

  async function loadEvents() {
    const data = await api.get("/my/events");
    setEvents(data || []);
  }

  async function openOrgPanel() {
    setShowOrgPanel(p => !p);
    setOrgError("");
    const data = await api.get("/my/all-organizations");
    setAllOrgs(data || []);
  }

  async function joinOrg(organizationID) {
    setOrgError("");
    try {
      await api.post("/my/memberships", { organizationID });
      const [myOrgs, all, evts] = await Promise.all([
        api.get("/my/organizations"),
        api.get("/my/all-organizations"),
        api.get("/my/events"),
      ]);
      setOrgs(myOrgs || []);
      setAllOrgs(all || []);
      setEvents(evts || []);
    } catch (err) {
      setOrgError(err.message);
    }
  }

  async function createEvent(e) {
    e.preventDefault();
    setEventError("");
    try {
      await api.post("/my/events", eventForm);
      setShowEventForm(false);
      setEventForm({ organizationID: "", title: "", description: "", startTime: "", endTime: "", location: "" });
      loadEvents();
    } catch (err) {
      setEventError(err.message);
    }
  }

  function formatDateTime(dt) {
    if (!dt) return null;
    return new Date(dt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  }

  const unjoinedOrgs = allOrgs.filter(o => !o.joined);

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h2 style={styles.title}>Events</h2>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={openOrgPanel} style={styles.btnSecondary}>
            {showOrgPanel ? "Close" : "Join Organization"}
          </button>
          <button onClick={() => setShowEventForm(f => !f)} style={styles.btn}>+ Create Event</button>
        </div>
      </div>

      {/* Org browse panel */}
      {showOrgPanel && (
        <div style={styles.panel}>
          <h4 style={styles.panelTitle}>Browse Organizations</h4>
          {orgError && <p style={styles.error}>{orgError}</p>}
          {unjoinedOrgs.length === 0
            ? <p style={styles.empty}>You've joined all available organizations.</p>
            : unjoinedOrgs.map(o => (
                <div key={o.organizationID} style={styles.browseRow}>
                  <div>
                    <strong style={{ fontSize: 14 }}>{o.organizationName}</strong>
                    {o.description && <div style={styles.meta}>{o.description}</div>}
                  </div>
                  <button onClick={() => joinOrg(o.organizationID)} style={styles.btnJoin}>Join</button>
                </div>
              ))
          }
        </div>
      )}

      {/* Create event form */}
      {showEventForm && (
        <form onSubmit={createEvent} style={styles.form}>
          {eventError && <p style={styles.error}>{eventError}</p>}
          <select
            value={eventForm.organizationID}
            onChange={e => setEventForm(f => ({ ...f, organizationID: e.target.value }))}
            required
            style={styles.input}
          >
            <option value="">Select organization</option>
            {orgs.map(o => (
              <option key={o.organizationID} value={o.organizationID}>{o.organizationName}</option>
            ))}
          </select>
          <input placeholder="Title" value={eventForm.title} onChange={e => setEventForm(f => ({ ...f, title: e.target.value }))} required style={styles.input} />
          <input placeholder="Location" value={eventForm.location} onChange={e => setEventForm(f => ({ ...f, location: e.target.value }))} style={styles.input} />
          <input placeholder="Description" value={eventForm.description} onChange={e => setEventForm(f => ({ ...f, description: e.target.value }))} style={styles.input} />
          <label style={styles.dateLabel}>
            Start
            <input type="datetime-local" value={eventForm.startTime} onChange={e => setEventForm(f => ({ ...f, startTime: e.target.value }))} style={styles.input} />
          </label>
          <label style={styles.dateLabel}>
            End
            <input type="datetime-local" value={eventForm.endTime} onChange={e => setEventForm(f => ({ ...f, endTime: e.target.value }))} style={styles.input} />
          </label>
          <button type="submit" style={styles.btn}>Save</button>
          <button type="button" onClick={() => setShowEventForm(false)} style={styles.btnSecondary}>Cancel</button>
        </form>
      )}

      {orgs.length === 0 && !showOrgPanel && (
        <p style={{ ...styles.empty, marginBottom: 12 }}>
          You haven't joined any organizations yet. Click <strong>Join Organization</strong> to get started.
        </p>
      )}

      <div style={styles.list}>
        {events.length === 0 && orgs.length > 0 && <p style={styles.empty}>No events from your organizations.</p>}
        {events.map(ev => (
          <div key={ev.eventID} style={styles.card}>
            <div style={styles.cardHeader}>
              <strong style={{ fontSize: 15 }}>{ev.title}</strong>
              <span style={styles.orgTag}>{ev.organizationName}</span>
            </div>
            <div style={styles.metaText}>
              {[formatDateTime(ev.startTime), ev.location].filter(Boolean).join(" · ")}
            </div>
            {ev.description && <div style={styles.desc}>{ev.description}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  page:        { padding: "32px 40px", fontFamily: "system-ui, sans-serif", background: "#f5f5f5", minHeight: "calc(100vh - 52px)" },
  header:      { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  title:       { fontSize: 22, fontWeight: 600, color: "#1e293b", margin: 0 },
  panel:       { background: "#fff", borderRadius: 8, padding: "16px 20px", marginBottom: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.07)" },
  panelTitle:  { fontSize: 14, fontWeight: 600, color: "#334155", margin: "0 0 12px" },
  browseRow:   { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f1f5f9" },
  btnJoin:     { padding: "5px 12px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, flexShrink: 0, fontFamily: "system-ui, sans-serif" },
  list:        { display: "flex", flexDirection: "column", gap: 12 },
  card:        { background: "#fff", borderRadius: 8, padding: "16px 20px", boxShadow: "0 1px 4px rgba(0,0,0,0.07)" },
  cardHeader:  { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  orgTag:      { background: "#f0fdf4", color: "#16a34a", borderRadius: 4, padding: "2px 8px", fontSize: 12, fontWeight: 500 },
  metaText:    { fontSize: 13, color: "#64748b" },
  meta:        { fontSize: 13, color: "#64748b", marginTop: 2 },
  desc:        { fontSize: 13, color: "#475569", marginTop: 6 },
  form:        { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", background: "#fff", padding: 16, borderRadius: 8, marginBottom: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.07)" },
  input:       { padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 13, fontFamily: "system-ui, sans-serif", background: "#fff", color: "#1e293b" },
  dateLabel:   { display: "flex", flexDirection: "column", gap: 4, fontSize: 12, color: "#64748b" },
  btn:         { padding: "7px 14px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13, fontFamily: "system-ui, sans-serif" },
  btnSecondary:{ padding: "6px 12px", background: "none", color: "#2563eb", border: "1px solid #2563eb", borderRadius: 6, cursor: "pointer", fontSize: 13, fontFamily: "system-ui, sans-serif" },
  error:       { color: "#dc2626", fontSize: 13, margin: 0 },
  empty:       { color: "#94a3b8", fontSize: 14, margin: 0 },
};
