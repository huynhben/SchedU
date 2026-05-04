import { useState, useEffect } from "react";
import { api } from "../api";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_MAP = { Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 };

function getWeekStart(date) {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay()); // roll back to Sunday
  d.setHours(0, 0, 0, 0);
  return d;
}

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth() === b.getMonth() &&
         a.getDate() === b.getDate();
}

function fmtMins(mins) {
  if (!mins) return "0m";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m > 0 ? m + "m" : ""}`.trim() : `${m}m`;
}

function fmtSecs(secs) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function fmtDate(d) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function AnalyticsPage() {
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [assignments, setAssignments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [events, setEvents] = useState([]);
  const [timelogs, setTimelogs] = useState([]);

  useEffect(() => {
    api.get("/my/assignments").then(d => setAssignments(d || []));
    api.get("/my/courses").then(d => setCourses(d || []));
    api.get("/my/events").then(d => setEvents(d || []));
    api.get("/my/timelogs").then(d => setTimelogs(d || []));
  }, []);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  const weekEnd = days[6];
  const isThisWeek = sameDay(weekStart, getWeekStart(new Date()));

  function prevWeek() {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    setWeekStart(d);
  }

  function nextWeek() {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    setWeekStart(d);
  }

  function assignmentsForDay(day) {
    return assignments.filter(a => {
      if (!a.dueDate) return false;
      const due = new Date(a.dueDate);
      return due.getUTCFullYear() === day.getFullYear() &&
             due.getUTCMonth() === day.getMonth() &&
             due.getUTCDate() === day.getDate();
    });
  }

  function coursesForDay(day) {
    const dow = day.getDay(); // 0=Sun, matches DAY_MAP (Sunday: 0)
    return courses.filter(c => {
      if (!c.days) return false;
      return c.days.split(", ").map(d => DAY_MAP[d.trim()]).includes(dow);
    });
  }

  function eventsForDay(day) {
    return events.filter(e => {
      if (!e.startTime) return false;
      const d = new Date(e.startTime);
      return sameDay(d, day);
    });
  }

  function estimatedMinsForDay(day) {
    return assignmentsForDay(day).reduce((s, a) => s + (a.estimatedTime || 0), 0);
  }

  function loggedSecsThisWeek() {
    return timelogs
      .filter(t => {
        if (!t.startTime || !t.endTime) return false;
        const d = new Date(t.startTime);
        return d >= weekStart && d <= weekEnd;
      })
      .reduce((s, t) => s + (t.seconds || 0), 0);
  }

  // Per-day estimated workload
  const dayMins = days.map(d => estimatedMinsForDay(d));
  const maxMins = Math.max(...dayMins, 1);
  const totalEstMins = dayMins.reduce((s, m) => s + m, 0);
  const totalAssignments = days.reduce((s, d) => s + assignmentsForDay(d).length, 0);
  const busiestIdx = dayMins.indexOf(Math.max(...dayMins));
  const loggedSecs = loggedSecsThisWeek();

  function barColor(mins) {
    if (mins === 0) return "#e2e8f0";
    if (mins <= 60) return "#86efac";
    if (mins <= 180) return "#fde68a";
    return "#fca5a5";
  }

  const today = new Date();

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div style={s.weekNav}>
          <button onClick={prevWeek} style={s.navBtn}>‹</button>
          <span style={s.weekLabel}>
            {fmtDate(weekStart)} – {fmtDate(weekEnd)}
          </span>
          <button onClick={nextWeek} style={s.navBtn}>›</button>
          {isThisWeek
            ? <span style={{ ...s.todayBtn, cursor: "default" }}>This Week</span>
            : <button onClick={() => setWeekStart(getWeekStart(new Date()))} style={s.todayBtn}>← Today</button>
          }
        </div>
        <h2 style={s.title}>Weekly Workload</h2>
      </div>

      {/* Summary cards */}
      <div style={s.cards}>
        <div style={s.card}>
          <div style={s.cardVal}>{fmtMins(totalEstMins)}</div>
          <div style={s.cardLabel}>Estimated work</div>
        </div>
        <div style={s.card}>
          <div style={s.cardVal}>{totalAssignments}</div>
          <div style={s.cardLabel}>Assignments due</div>
        </div>
        <div style={s.card}>
          <div style={s.cardVal}>{totalEstMins > 0 ? DAY_LABELS[busiestIdx] : "—"}</div>
          <div style={s.cardLabel}>Busiest day</div>
        </div>
        <div style={s.card}>
          <div style={s.cardVal}>{loggedSecs > 0 ? fmtSecs(loggedSecs) : "—"}</div>
          <div style={s.cardLabel}>Time logged</div>
        </div>
      </div>

      {/* Bar chart */}
      <div style={s.chartCard}>
        <div style={s.chartTitle}>Estimated Workload by Day</div>
        <div style={s.chart}>
          {days.map((day, i) => {
            const mins = dayMins[i];
            const pct = Math.round((mins / maxMins) * 100);
            const isToday = sameDay(day, today);
            return (
              <div key={i} style={s.barRow}>
                <div style={{ ...s.barDayLabel, ...(isToday ? { color: "#2563eb", fontWeight: 700 } : {}) }}>
                  {DAY_LABELS[i]}
                  <span style={s.barDateSub}>{fmtDate(day)}</span>
                </div>
                <div style={s.barTrack}>
                  <div style={{ ...s.bar, width: `${Math.max(pct, mins > 0 ? 2 : 0)}%`, background: barColor(mins) }} />
                </div>
                <div style={{ ...s.barTime, color: mins > 0 ? "#334155" : "#cbd5e1" }}>
                  {mins > 0 ? fmtMins(mins) : "—"}
                </div>
              </div>
            );
          })}
        </div>
        <div style={s.legend}>
          <span style={s.legendItem}><span style={{ ...s.ldot, background: "#86efac" }} />Light (≤1h)</span>
          <span style={s.legendItem}><span style={{ ...s.ldot, background: "#fde68a" }} />Moderate (1–3h)</span>
          <span style={s.legendItem}><span style={{ ...s.ldot, background: "#fca5a5" }} />Heavy (&gt;3h)</span>
        </div>
      </div>

      {/* Day breakdown — all 7 days always rendered to preserve Mon–Sun order */}
      <div style={s.breakdown}>
        {days.map((day, i) => {
          const dc = coursesForDay(day);
          const da = assignmentsForDay(day);
          const de = eventsForDay(day);
          const isEmpty = dc.length === 0 && da.length === 0 && de.length === 0;
          const isToday = sameDay(day, today);
          return (
            <div key={i} style={{ ...s.dayCard, ...(isToday ? s.todayCard : {}), ...(isEmpty ? s.emptyDayCard : {}) }}>
              <div style={s.dayCardHeader}>
                <span style={{ ...s.dayCardTitle, ...(isToday ? { color: "#2563eb" } : {}), ...(isEmpty ? { color: "#94a3b8" } : {}) }}>
                  {DAY_LABELS[i]} <span style={s.dayCardDate}>{fmtDate(day)}</span>
                </span>
                {dayMins[i] > 0 && <span style={s.dayCardMins}>{fmtMins(dayMins[i])} estimated</span>}
              </div>

              {isEmpty && <div style={{ fontSize: 12, color: "#cbd5e1" }}>Nothing scheduled</div>}

              {dc.length > 0 && (
                <div style={s.daySection}>
                  {dc.map(c => (
                    <div key={c.courseID} style={s.dayRow}>
                      <span style={{ ...s.dot, background: "#2563eb" }} />
                      <span style={s.dayRowText}>{c.courseName}</span>
                      <span style={s.dayRowSub}>{c.startTime}–{c.endTime}</span>
                    </div>
                  ))}
                </div>
              )}

              {da.length > 0 && (
                <div style={s.daySection}>
                  {da.map(a => (
                    <div key={a.assignmentID} style={s.dayRow}>
                      <span style={{ ...s.dot, background: "#ea580c" }} />
                      <span style={s.dayRowText}>{a.title}</span>
                      <span style={s.dayRowSub}>
                        {a.courseName}{a.estimatedTime ? ` · ${fmtMins(a.estimatedTime)}` : ""}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {de.length > 0 && (
                <div style={s.daySection}>
                  {de.map(e => (
                    <div key={e.eventID} style={s.dayRow}>
                      <span style={{ ...s.dot, background: "#16a34a" }} />
                      <span style={s.dayRowText}>{e.title}</span>
                      <span style={s.dayRowSub}>{e.organizationName}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Assignment Overview */}
      <AssignmentOverview assignments={assignments} />
    </div>
  );
}

const GRADE_ORDER = ["A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "D-", "F"];
const GRADE_COLORS = { A: "#16a34a", "A-": "#22c55e", "B+": "#65a30d", B: "#84cc16", "B-": "#a3e635", "C+": "#eab308", C: "#f59e0b", "C-": "#f97316", "D+": "#ef4444", D: "#dc2626", "D-": "#b91c1c", F: "#7f1d1d" };

function AssignmentOverview({ assignments }) {
  const total = assignments.length;
  if (total === 0) return null;

  const done       = assignments.filter(a => a.status === "Done").length;
  const inProgress = assignments.filter(a => a.status === "In Progress").length;
  const notStarted = assignments.filter(a => a.status === "Not Started").length;

  const graded = assignments.filter(a => a.grade);
  const gradeCounts = {};
  for (const a of graded) gradeCounts[a.grade] = (gradeCounts[a.grade] || 0) + 1;
  const gradeMax = Math.max(...Object.values(gradeCounts), 1);

  const highPri   = assignments.filter(a => a.priority === "High" && a.status !== "Done").length;
  const medPri    = assignments.filter(a => a.priority === "Medium" && a.status !== "Done").length;
  const lowPri    = assignments.filter(a => a.priority === "Low" && a.status !== "Done").length;

  return (
    <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>

      {/* Status breakdown */}
      <div style={s.chartCard}>
        <div style={s.chartTitle}>Assignment Status</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {[
            { label: "Done",         count: done,       color: "#16a34a", bg: "#dcfce7" },
            { label: "In Progress",  count: inProgress, color: "#2563eb", bg: "#dbeafe" },
            { label: "Not Started",  count: notStarted, color: "#94a3b8", bg: "#f1f5f9" },
          ].map(({ label, count, color, bg }) => (
            <div key={label}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>{label}</span>
                <span style={{ fontSize: 13, color }}>{count} / {total}</span>
              </div>
              <div style={{ height: 10, background: "#f1f5f9", borderRadius: 6, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${total > 0 ? Math.round((count / total) * 100) : 0}%`, background: color, borderRadius: 6, transition: "width 0.4s ease" }} />
              </div>
            </div>
          ))}
          <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
            <div style={{ flex: 1, background: "#f0fdf4", borderRadius: 8, padding: "12px 16px", textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#16a34a" }}>{total > 0 ? Math.round((done / total) * 100) : 0}%</div>
              <div style={{ fontSize: 12, color: "#64748b" }}>Complete</div>
            </div>
            <div style={{ flex: 1, background: "#fff7ed", borderRadius: 8, padding: "12px 16px", textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#ea580c" }}>{highPri}</div>
              <div style={{ fontSize: 12, color: "#64748b" }}>High priority pending</div>
            </div>
          </div>
        </div>
      </div>

      {/* Grade distribution */}
      <div style={s.chartCard}>
        <div style={s.chartTitle}>Grade Distribution ({graded.length} graded)</div>
        {graded.length === 0
          ? <p style={{ color: "#94a3b8", fontSize: 14 }}>No graded assignments yet.</p>
          : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {GRADE_ORDER.filter(g => gradeCounts[g]).map(g => {
                const count = gradeCounts[g];
                const pct = Math.round((count / gradeMax) * 100);
                return (
                  <div key={g} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 32, fontSize: 13, fontWeight: 700, color: GRADE_COLORS[g], flexShrink: 0 }}>{g}</div>
                    <div style={{ flex: 1, height: 20, background: "#f1f5f9", borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${Math.max(pct, count > 0 ? 4 : 0)}%`, background: GRADE_COLORS[g], borderRadius: 4, transition: "width 0.4s ease" }} />
                    </div>
                    <div style={{ width: 20, fontSize: 13, color: "#64748b", textAlign: "right", flexShrink: 0 }}>{count}</div>
                  </div>
                );
              })}
            </div>
          )
        }
      </div>
    </div>
  );
}

const s = {
  page:          { padding: "32px 40px", fontFamily: "system-ui, sans-serif", background: "#f1f5f9", minHeight: "calc(100vh - 52px)" },
  header:        { display: "flex", flexDirection: "column", gap: 4, marginBottom: 24 },
  title:         { fontSize: 22, fontWeight: 700, color: "#1e293b", margin: 0 },
  weekNav:       { display: "flex", alignItems: "center", gap: 10 },
  weekLabel:     { fontSize: 15, fontWeight: 600, color: "#475569", minWidth: 180 },
  navBtn:        { background: "none", border: "1px solid #e2e8f0", borderRadius: 6, width: 30, height: 30, fontSize: 18, cursor: "pointer", color: "#475569" },
  todayBtn:      { padding: "4px 12px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, cursor: "pointer", fontWeight: 600 },
  cards:         { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 },
  card:          { background: "#fff", borderRadius: 8, padding: "20px 24px", boxShadow: "0 1px 4px rgba(0,0,0,0.07)" },
  cardVal:       { fontSize: 28, fontWeight: 700, color: "#1e293b", marginBottom: 4 },
  cardLabel:     { fontSize: 13, color: "#64748b" },
  chartCard:     { background: "#fff", borderRadius: 8, padding: "24px", boxShadow: "0 1px 4px rgba(0,0,0,0.07)", marginBottom: 24 },
  chartTitle:    { fontSize: 15, fontWeight: 600, color: "#334155", marginBottom: 16 },
  chart:         { display: "flex", flexDirection: "column", gap: 10 },
  barRow:        { display: "flex", alignItems: "center", gap: 12 },
  barDayLabel:   { width: 80, fontSize: 13, fontWeight: 600, color: "#475569", display: "flex", flexDirection: "column", flexShrink: 0 },
  barDateSub:    { fontSize: 11, color: "#94a3b8", fontWeight: 400 },
  barTrack:      { flex: 1, height: 28, background: "#f1f5f9", borderRadius: 6, overflow: "hidden" },
  bar:           { height: "100%", borderRadius: 6, transition: "width 0.4s ease" },
  barTime:       { width: 60, fontSize: 13, fontWeight: 600, textAlign: "right", flexShrink: 0 },
  legend:        { display: "flex", gap: 20, marginTop: 16 },
  legendItem:    { display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#64748b" },
  ldot:          { width: 10, height: 10, borderRadius: "50%", display: "inline-block" },
  breakdown:     { display: "flex", flexDirection: "column", gap: 12 },
  dayCard:       { background: "#fff", borderRadius: 8, padding: "16px 20px", boxShadow: "0 1px 4px rgba(0,0,0,0.07)" },
  todayCard:     { borderLeft: "3px solid #2563eb" },
  emptyDayCard:  { opacity: 0.5 },
  dayCardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  dayCardTitle:  { fontSize: 15, fontWeight: 700, color: "#1e293b" },
  dayCardDate:   { fontWeight: 400, color: "#94a3b8", fontSize: 13 },
  dayCardMins:   { fontSize: 12, color: "#64748b", background: "#f1f5f9", padding: "2px 8px", borderRadius: 10 },
  daySection:    { display: "flex", flexDirection: "column", gap: 6, marginTop: 6 },
  dayRow:        { display: "flex", alignItems: "center", gap: 8 },
  dot:           { width: 8, height: 8, borderRadius: "50%", flexShrink: 0 },
  dayRowText:    { fontSize: 13, color: "#334155", fontWeight: 500 },
  dayRowSub:     { fontSize: 12, color: "#94a3b8", marginLeft: "auto" },
};
