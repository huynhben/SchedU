import { useState, useEffect } from "react";
import { api } from "../api";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_MAP = { Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 };
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function CalendarPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [courses, setCourses] = useState([]);
  const [events, setEvents] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    api.get("/my/courses").then(setCourses).catch(() => {});
    api.get("/my/events").then(setEvents).catch(() => {});
    api.get("/my/assignments").then(setAssignments).catch(() => {});
  }, []);

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }

  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  function getItemsForDay(day) {
    const dayOfWeek = new Date(year, month, day).getDay();
    const dayCourses = courses.filter(c => {
      if (!c.days) return false;
      return c.days.split(", ").map(d => DAY_MAP[d.trim()]).includes(dayOfWeek);
    });
    const dayEvents = events.filter(e => {
      if (!e.startTime) return false;
      const d = new Date(e.startTime);
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
    });
    const dayAssignments = assignments.filter(a => {
      if (!a.dueDate) return false;
      const d = new Date(a.dueDate);
      return d.getUTCFullYear() === year && d.getUTCMonth() === month && d.getUTCDate() === day;
    });
    return { courses: dayCourses, events: dayEvents, assignments: dayAssignments };
  }

  const todayDay = today.getFullYear() === year && today.getMonth() === month ? today.getDate() : null;
  const selectedItems = selected ? getItemsForDay(selected) : null;
  const pendingAssignments = assignments.filter(a => a.status !== "Done");

  return (
    <div style={s.page}>
      <div style={s.calArea}>
        <div style={s.header}>
          <button onClick={prevMonth} style={s.navBtn}>&#8249;</button>
          <h2 style={s.monthTitle}>{MONTHS[month]} {year}</h2>
          <button onClick={nextMonth} style={s.navBtn}>&#8250;</button>
          {(year !== today.getFullYear() || month !== today.getMonth()) && (
            <button onClick={() => { setYear(today.getFullYear()); setMonth(today.getMonth()); setSelected(null); }} style={s.todayBtn}>Today</button>
          )}
        </div>

        <div style={s.grid}>
          {DAY_NAMES.map(d => <div key={d} style={s.dayHeader}>{d}</div>)}
          {cells.map((day, i) => {
            if (!day) return <div key={i} style={s.emptyCell} />;
            const { courses: dc, events: de, assignments: da } = getItemsForDay(day);
            const isToday = day === todayDay;
            const isSelected = day === selected;
            const allItems = [
              ...dc.map(c => ({ type: "course",     label: c.courseName, id: c.courseID     })),
              ...de.map(e => ({ type: "event",      label: e.title,      id: e.eventID      })),
              ...da.map(a => ({ type: "assignment", label: a.title,      id: a.assignmentID })),
            ];
            const visible = allItems.slice(0, 3);
            const overflow = allItems.length - 3;
            return (
              <div
                key={i}
                style={{ ...s.cell, ...(isSelected ? s.selectedCell : {}), ...(isToday ? s.todayCell : {}) }}
                onClick={() => setSelected(day === selected ? null : day)}
              >
                <span style={{ ...s.dayNum, ...(isToday ? s.todayNum : {}) }}>{day}</span>
                <div style={s.chips}>
                  {visible.map((item, j) => (
                    <div key={j} style={item.type === "course" ? s.courseChip : item.type === "event" ? s.eventChip : s.assignmentChip}>
                      {item.label.length > 14 ? item.label.slice(0, 14) + "…" : item.label}
                    </div>
                  ))}
                  {overflow > 0 && <div style={s.moreChip}>+{overflow} more</div>}
                </div>
              </div>
            );
          })}
        </div>

        <div style={s.legend}>
          <span style={s.legendItem}><span style={{ ...s.legendDot, background: "#2563eb" }} />Classes</span>
          <span style={s.legendItem}><span style={{ ...s.legendDot, background: "#16a34a" }} />Events</span>
          <span style={s.legendItem}><span style={{ ...s.legendDot, background: "#ea580c" }} />Assignments</span>
        </div>
      </div>

      <div style={s.sidebar}>
        {selected && selectedItems ? (
          <>
            <div style={s.sideHeader}>
              <span style={s.sideDate}>{MONTHS[month]} {selected}, {year}</span>
              <button onClick={() => setSelected(null)} style={s.closeBtn}>✕</button>
            </div>

            {selectedItems.courses.length === 0 && selectedItems.events.length === 0 && selectedItems.assignments.length === 0 && (
              <p style={s.emptyMsg}>No items on this day.</p>
            )}

            {selectedItems.courses.length > 0 && (
              <div style={s.sideSection}>
                <div style={{ ...s.sideLabel, color: "#2563eb" }}>Classes</div>
                {selectedItems.courses.map(c => (
                  <div key={c.courseID} style={s.sideItem}>
                    <div style={{ ...s.dot, background: "#2563eb" }} />
                    <div>
                      <div style={s.itemTitle}>{c.courseName}</div>
                      <div style={s.itemSub}>{c.startTime} – {c.endTime}</div>
                      {c.location && <div style={s.itemSub}>{c.location}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedItems.events.length > 0 && (
              <div style={s.sideSection}>
                <div style={{ ...s.sideLabel, color: "#16a34a" }}>Events</div>
                {selectedItems.events.map(e => (
                  <div key={e.eventID} style={s.sideItem}>
                    <div style={{ ...s.dot, background: "#16a34a" }} />
                    <div>
                      <div style={s.itemTitle}>{e.title}</div>
                      {e.organizationName && <div style={s.itemSub}>{e.organizationName}</div>}
                      {e.location && <div style={s.itemSub}>{e.location}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedItems.assignments.length > 0 && (
              <div style={s.sideSection}>
                <div style={{ ...s.sideLabel, color: "#ea580c" }}>Due</div>
                {selectedItems.assignments.map(a => (
                  <div key={a.assignmentID} style={s.sideItem}>
                    <div style={{ ...s.dot, background: "#ea580c" }} />
                    <div>
                      <div style={s.itemTitle}>{a.title}</div>
                      <div style={s.itemSub}>{a.courseName} · {a.priority || "No priority"}</div>
                      <div style={s.itemSub}>{a.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <div style={s.sideHeader}>
              <span style={s.sideDate}>Assignments</span>
            </div>
            {pendingAssignments.length === 0 ? (
              <p style={s.emptyMsg}>No pending assignments.</p>
            ) : (
              <div style={s.sideSection}>
                <div style={{ ...s.sideLabel, color: "#ea580c" }}>To Do</div>
                {pendingAssignments.map(a => (
                  <div key={a.assignmentID} style={s.sideItem}>
                    <div style={{ ...s.dot, background: "#ea580c" }} />
                    <div>
                      <div style={s.itemTitle}>{a.title}</div>
                      <div style={s.itemSub}>{a.courseName}</div>
                      <div style={s.itemSub}>{a.priority} priority · {a.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const s = {
  page:         { display: "flex", gap: 0, height: "calc(100vh - 52px)", background: "#f1f5f9", fontFamily: "system-ui, sans-serif" },
  calArea:      { flex: 1, display: "flex", flexDirection: "column", padding: "24px 24px 16px", overflow: "hidden" },
  header:       { display: "flex", alignItems: "center", gap: 12, marginBottom: 16 },
  monthTitle:   { margin: 0, fontSize: 20, fontWeight: 700, color: "#1e293b", minWidth: 200 },
  navBtn:       { background: "none", border: "1px solid #e2e8f0", borderRadius: 6, width: 32, height: 32, fontSize: 20, cursor: "pointer", color: "#475569", display: "flex", alignItems: "center", justifyContent: "center" },
  todayBtn:     { marginLeft: 8, padding: "4px 12px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, cursor: "pointer", fontWeight: 600 },
  grid:         { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 1, background: "#e2e8f0", border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden", flex: 1 },
  dayHeader:    { background: "#f8fafc", padding: "8px 0", textAlign: "center", fontSize: 12, fontWeight: 600, color: "#64748b", letterSpacing: "0.05em" },
  emptyCell:    { background: "#f8fafc", minHeight: 90 },
  cell:         { background: "#fff", padding: "6px 8px", minHeight: 90, cursor: "pointer", transition: "background 0.1s" },
  selectedCell: { background: "#eff6ff" },
  todayCell:    { background: "#fff" },
  dayNum:       { fontSize: 13, fontWeight: 500, color: "#374151", display: "block", marginBottom: 4 },
  todayNum:     { background: "#2563eb", color: "#fff", borderRadius: "50%", width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 },
  chips:        { display: "flex", flexDirection: "column", gap: 2 },
  courseChip:   { background: "#dbeafe", color: "#1d4ed8", fontSize: 11, padding: "1px 5px", borderRadius: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontWeight: 500 },
  eventChip:    { background: "#dcfce7", color: "#15803d", fontSize: 11, padding: "1px 5px", borderRadius: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontWeight: 500 },
  assignmentChip: { background: "#ffedd5", color: "#c2410c", fontSize: 11, padding: "1px 5px", borderRadius: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontWeight: 500 },
  moreChip:     { fontSize: 11, color: "#94a3b8", padding: "1px 5px" },
  legend:       { display: "flex", gap: 20, marginTop: 12, paddingLeft: 4 },
  legendItem:   { display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#64748b" },
  legendDot:    { width: 10, height: 10, borderRadius: "50%", display: "inline-block" },
  sidebar:      { width: 280, background: "#fff", borderLeft: "1px solid #e2e8f0", display: "flex", flexDirection: "column", overflow: "hidden" },
  sideHeader:   { padding: "20px 20px 12px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" },
  sideDate:     { fontSize: 15, fontWeight: 700, color: "#1e293b" },
  closeBtn:     { background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: 16, padding: 0 },
  sideSection:  { padding: "12px 20px" },
  sideLabel:    { fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 },
  sideItem:     { display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 12 },
  dot:          { width: 8, height: 8, borderRadius: "50%", marginTop: 5, flexShrink: 0 },
  itemTitle:    { fontSize: 14, fontWeight: 600, color: "#1e293b", marginBottom: 2 },
  itemSub:      { fontSize: 12, color: "#64748b" },
  emptyMsg:     { padding: "12px 20px", color: "#94a3b8", fontSize: 14 },
};
