import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const appointmentData = [
  { date: "18 Oct", count: 8 },
  { date: "19 Oct", count: 14 },
  { date: "20 Oct", count: 10 },
  { date: "21 Oct", count: 23 },
  { date: "22 Oct", count: 17 },
  { date: "23 Oct", count: 13 },
  { date: "24 Oct", count: 9 },
];

const patients = [
  { no: 96, date: "23/10/2021", name: "Kiki Allman", membership: true, treatment: "Root Canal" },
  { no: 95, date: "23/10/2021", name: "Corbin Oakley", membership: false, treatment: "Consultation" },
  { no: 94, date: "23/10/2021", name: "Seren Lennon", membership: true, treatment: "Root Canal" },
  { no: 93, date: "22/10/2021", name: "Amos Trent", membership: true, treatment: "Scaling" },
  { no: 92, date: "22/10/2021", name: "Dora Finch", membership: false, treatment: "Whitening" },
];

const upcomingToday = [
  { time: "12:00", name: "Mike Robin", type: "Consultation", member: false, avatar: "MR" },
  { time: "14:00", name: "Jane Black", type: "Wisdom Teeth Removal", member: true, avatar: "JB" },
];

const upcomingTomorrow = [
  { time: "11:00", name: "Esther Wilson", type: "Bleaching", member: true, avatar: "EW", active: true },
  { time: "12:30", name: "Andy Mcconnell", type: "Scaling", member: false, avatar: "AM" },
  { time: "13:45", name: "Melisa Cooper", type: "Consultation", member: false, avatar: "MC" },
];

const calendarDays = [
  { label: "Mon", num: 25, active: true },
  { label: "Tue", num: 26 },
  { label: "Wed", num: 27 },
  { label: "Thu", num: 28 },
  { label: "Fri", num: 29 },
  { label: "Sat", num: 30 },
  { label: "Sun", num: 31 },
];

const navItems = [
  { icon: "⊞", label: "Dashboard", active: true },
  { icon: "📅", label: "Appointments" },
  { icon: "📋", label: "Requests", badge: 3 },
  { icon: "👤", label: "Patients" },
  { icon: "🩺", label: "Doctors" },
  { icon: "💬", label: "Chat" },
  { icon: "💳", label: "Payouts" },
  { icon: "⚙️", label: "Settings" },
];

const avatarColors = {
  MR: "#FF6B6B", JB: "#4ECDC4", EW: "#45B7D1", AM: "#96CEB4", MC: "#FFEAA7",
};

function Avatar({ initials, size = 36 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: avatarColors[initials] || "#c5cae9",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 700, fontSize: size * 0.35, color: "#fff",
      flexShrink: 0, letterSpacing: "0.5px",
    }}>
      {initials}
    </div>
  );
}

function MemberBadge() {
  return (
    <span style={{
      background: "#FF6B6B", color: "#fff", fontSize: 10,
      padding: "2px 7px", borderRadius: 20, fontWeight: 700, letterSpacing: "0.5px",
    }}>Member</span>
  );
}

function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeNav, setActiveNav] = useState("Dashboard");

  return (
    <div style={{
      display: "flex", minHeight: "100vh", fontFamily: "'Nunito', 'Segoe UI', sans-serif",
      background: "#eef1fb", color: "#2d3561",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-thumb { background: #c5cae9; border-radius: 3px; }
        .sidebar-overlay { display: none; }
        .nav-label { display: block; }
        .stat-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; }
        .main-grid { display: grid; grid-template-columns: 1fr 300px; gap: 20px; }
        .appt-section { overflow-y: auto; max-height: 420px; }
        @media (max-width: 1100px) {
          .main-grid { grid-template-columns: 1fr !important; }
          .appt-section { max-height: none; }
        }
        @media (max-width: 768px) {
          .sidebar { transform: translateX(-100%); transition: transform 0.3s; position: fixed !important; z-index: 200; height: 100vh; }
          .sidebar.open { transform: translateX(0); }
          .sidebar-overlay { display: block; position: fixed; inset: 0; background: rgba(0,0,0,0.35); z-index: 199; }
          .stat-grid { grid-template-columns: repeat(2,1fr) !important; }
          .top-bar { padding: 14px 16px !important; }
          .content-area { padding: 14px !important; }
          .nav-label { display: none; }
          .mini-sidebar { width: 60px !important; min-width: 60px !important; }
        }
        @media (max-width: 480px) {
          .stat-grid { grid-template-columns: 1fr !important; }
        }
        .nav-item { display: flex; align-items: center; gap: 12px; padding: 11px 18px; border-radius: 12px; cursor: pointer; font-weight: 600; font-size: 14px; color: #7a82b8; transition: all 0.18s; position: relative; }
        .nav-item:hover { background: #e8ebff; color: #2d3561; }
        .nav-item.active { background: #2d3561; color: #fff; }
        .card { background: #fff; border-radius: 18px; padding: 18px; box-shadow: 0 2px 12px rgba(45,53,97,0.07); }
        .btn-primary { background: #2d3561; color: #fff; border: none; border-radius: 10px; padding: 10px 18px; font-weight: 700; font-size: 13px; cursor: pointer; transition: background 0.18s; white-space: nowrap; }
        .btn-primary:hover { background: #3d4e8a; }
        .btn-accent { background: #FF6B6B; color: #fff; border: none; border-radius: 10px; padding: 10px 18px; font-weight: 700; font-size: 13px; cursor: pointer; transition: background 0.18s; white-space: nowrap; }
        .btn-accent:hover { background: #e05555; }
        .cal-day { display: flex; flex-direction: column; align-items: center; padding: 7px 8px; border-radius: 12px; cursor: pointer; transition: background 0.16s; min-width: 34px; }
        .cal-day.active { background: #2d3561; color: #fff; }
        .cal-day:not(.active):hover { background: #e8ebff; }
        .appt-card { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: 14px; transition: background 0.16s; }
        .appt-card:hover { background: #f4f5fb; }
        .appt-card.active-card { background: #2d3561; color: #fff; }
        .table-row { display: grid; grid-template-columns: 40px 100px 1fr 100px 120px 36px; align-items: center; padding: 10px 4px; border-bottom: 1px solid #f0f1f8; font-size: 13.5px; gap: 8px; }
        .table-row:last-child { border-bottom: none; }
        .hamburger { display: none; background: none; border: none; cursor: pointer; font-size: 22px; color: #2d3561; }
        @media (max-width: 768px) { .hamburger { display: block; } }
        @media (max-width: 600px) {
          .table-row { grid-template-columns: 30px 80px 1fr 80px 36px; }
          .table-row .treatment-col { display: none; }
        }
        .tooltip-custom { background: #2d3561; color: #fff; border-radius: 8px; padding: 6px 12px; font-size: 13px; font-family: 'Nunito', sans-serif; }
      `}</style>

      {/* Sidebar */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
      <aside className={`sidebar${sidebarOpen ? " open" : ""}`} style={{
        width: 220, minWidth: 220, background: "#fff",
        display: "flex", flexDirection: "column", padding: "24px 12px",
        position: "relative", boxShadow: "2px 0 16px rgba(45,53,97,0.07)",
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 8px 28px" }}>
          <div style={{
            width: 38, height: 38, background: "linear-gradient(135deg,#FF6B6B,#2d3561)",
            borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontSize: 18,
          }}>🦷</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, color: "#2d3561", lineHeight: 1 }}>Dentino</div>
            <div style={{ fontSize: 11, color: "#7a82b8" }}>Dental Clinic</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
          {navItems.map(({ icon, label, badge }) => (
            <div key={label}
              className={`nav-item${activeNav === label ? " active" : ""}`}
              onClick={() => { setActiveNav(label); setSidebarOpen(false); }}
            >
              <span style={{ fontSize: 17 }}>{icon}</span>
              <span className="nav-label">{label}</span>
              {badge && (
                <span style={{
                  marginLeft: "auto", background: "#FF6B6B", color: "#fff",
                  borderRadius: 20, padding: "1px 7px", fontSize: 11, fontWeight: 700,
                }}>{badge}</span>
              )}
            </div>
          ))}
        </nav>

        {/* Logout */}
        <div className="nav-item" style={{ marginTop: 8 }} onClick={() => {}}>
          <span style={{ fontSize: 17 }}>🚪</span>
          <span className="nav-label">Log Out</span>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Top Bar */}
        <div className="top-bar" style={{
          background: "#fff", padding: "14px 28px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          boxShadow: "0 1px 8px rgba(45,53,97,0.06)", zIndex: 10,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <button className="hamburger" onClick={() => setSidebarOpen(v => !v)}>☰</button>
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "#f4f5fb", borderRadius: 10, padding: "8px 14px",
              fontSize: 14, color: "#7a82b8",
            }}>
              <span>🔍</span>
              <input placeholder="Search patients, doctors..." style={{
                border: "none", background: "transparent", outline: "none",
                fontSize: 14, color: "#2d3561", width: "min(200px, 30vw)",
              }} />
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 38, height: 38, borderRadius: "50%",
              background: "linear-gradient(135deg,#2d3561,#4ECDC4)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontSize: 18, cursor: "pointer",
            }}>🔔</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 40, height: 40, borderRadius: "50%",
                background: "linear-gradient(135deg,#FF6B6B,#2d3561)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontWeight: 800, fontSize: 14,
              }}>MC</div>
              <div style={{ display: "none", flexDirection: "column" }} className="doctor-info">
                <span style={{ fontWeight: 700, fontSize: 14, color: "#2d3561" }}>Dr. Miguel Connelly</span>
                <span style={{ fontSize: 12, color: "#7a82b8" }}>Practical Dentist</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="content-area" style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
          {/* Page Header */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginBottom: 22, flexWrap: "wrap", gap: 12,
          }}>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: "#2d3561" }}>Dashboard Overview</h1>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn-primary">+ Make an Appointment</button>
              <button className="btn-accent">+ Add Patient</button>
            </div>
          </div>

          <div className="main-grid">
            {/* Left Column */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Stats */}
              <div className="stat-grid">
                {[
                  { icon: "👤", label: "Patients Today", value: 8, color: "#FF6B6B" },
                  { icon: "👥", label: "Total Patients", value: 364, color: "#4ECDC4" },
                  { icon: "📋", label: "Requests", value: 20, color: "#45B7D1" },
                ].map(({ icon, label, value, color }) => (
                  <div key={label} className="card" style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: 14,
                      background: color + "20",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 22, flexShrink: 0,
                    }}>{icon}</div>
                    <div>
                      <div style={{ fontSize: 12, color: "#7a82b8", fontWeight: 600, marginBottom: 2 }}>{label}</div>
                      <div style={{ fontSize: 26, fontWeight: 800, color: "#2d3561" }}>{value}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Chart */}
              <div className="card">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 17, color: "#2d3561" }}>Appointments Statistics</div>
                    <div style={{ fontSize: 13, color: "#7a82b8", marginTop: 2 }}>October 2021</div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button style={{ background: "#f4f5fb", border: "none", borderRadius: 8, padding: "6px 12px", fontWeight: 700, fontSize: 13, color: "#2d3561", cursor: "pointer" }}>Week ▾</button>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={appointmentData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f1f8" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#7a82b8" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#7a82b8" }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: "#2d3561", border: "none", borderRadius: 10, color: "#fff", fontSize: 13, fontFamily: "Nunito,sans-serif" }}
                      itemStyle={{ color: "#fff" }}
                      labelStyle={{ color: "#c5cae9", fontWeight: 700 }}
                      formatter={(v) => [`${v} Appointments`, ""]}
                    />
                    <Line
                      type="monotone" dataKey="count" stroke="#4ECDC4" strokeWidth={3}
                      dot={{ r: 5, fill: "#FF6B6B", strokeWidth: 0 }}
                      activeDot={{ r: 7, fill: "#FF6B6B" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Latest Patients Table */}
              <div className="card">
                <div style={{ fontWeight: 800, fontSize: 17, color: "#2d3561", marginBottom: 14 }}>Latest Patients</div>
                {/* Header */}
                <div className="table-row" style={{ color: "#7a82b8", fontSize: 12, fontWeight: 700, borderBottom: "2px solid #eef1fb" }}>
                  <span>No</span><span>Date</span><span>Name</span>
                  <span>Membership</span><span className="treatment-col">Treatment</span><span></span>
                </div>
                {patients.map((p) => (
                  <div key={p.no} className="table-row">
                    <span style={{ color: "#7a82b8", fontWeight: 600 }}>{p.no}</span>
                    <span style={{ color: "#7a82b8", fontSize: 12 }}>{p.date}</span>
                    <span style={{ fontWeight: 700 }}>{p.name}</span>
                    <span>
                      {p.membership
                        ? <MemberBadge />
                        : <span style={{ color: "#aab0d4", fontSize: 12 }}>Not a member</span>}
                    </span>
                    <span className="treatment-col" style={{ color: "#7a82b8", fontSize: 13 }}>{p.treatment}</span>
                    <span style={{ color: "#c5cae9", cursor: "pointer", textAlign: "right" }}>···</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Calendar */}
              <div className="card">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <div style={{ fontWeight: 800, fontSize: 16, color: "#2d3561" }}>October 2021</div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button style={{ background: "#f4f5fb", border: "none", borderRadius: 8, width: 28, height: 28, cursor: "pointer", color: "#7a82b8", fontWeight: 700 }}>‹</button>
                    <button style={{ background: "#f4f5fb", border: "none", borderRadius: 8, width: 28, height: 28, cursor: "pointer", color: "#2d3561", fontWeight: 700 }}>›</button>
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  {calendarDays.map(({ label, num, active }) => (
                    <div key={num} className={`cal-day${active ? " active" : ""}`}>
                      <span style={{ fontSize: 10, fontWeight: 600, color: active ? "#c5cae9" : "#aab0d4", marginBottom: 4 }}>{label}</span>
                      <span style={{ fontSize: 15, fontWeight: 800 }}>{num}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upcoming Appointments */}
              <div className="card" style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 16, color: "#2d3561", marginBottom: 14 }}>Upcoming Appointments</div>

                <div style={{ fontSize: 12, fontWeight: 700, color: "#7a82b8", marginBottom: 8 }}>Today, 25 Oct</div>
                <div className="appt-section" style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
                  {upcomingToday.map((a) => (
                    <div key={a.name} className="appt-card">
                      <span style={{ fontSize: 12, color: "#7a82b8", fontWeight: 700, minWidth: 38 }}>{a.time}</span>
                      <Avatar initials={a.avatar} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{a.name}</div>
                        <div style={{ fontSize: 12, color: "#7a82b8", marginTop: 2 }}>{a.type}</div>
                      </div>
                      {a.member && <MemberBadge />}
                      <span style={{ color: "#c5cae9", cursor: "pointer" }}>⋮</span>
                    </div>
                  ))}
                </div>

                <div style={{ fontSize: 12, fontWeight: 700, color: "#7a82b8", marginBottom: 8 }}>Tuesday, 26 Oct</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {upcomingTomorrow.map((a) => (
                    <div key={a.name} className={`appt-card${a.active ? " active-card" : ""}`}>
                      <span style={{ fontSize: 12, color: a.active ? "#c5cae9" : "#7a82b8", fontWeight: 700, minWidth: 38 }}>{a.time}</span>
                      <Avatar initials={a.avatar} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: a.active ? "#fff" : "#2d3561" }}>{a.name}</div>
                        <div style={{ fontSize: 12, color: a.active ? "#c5cae9" : "#7a82b8", marginTop: 2 }}>{a.type}</div>
                      </div>
                      {a.member && <MemberBadge />}
                      <span style={{ color: a.active ? "#c5cae9" : "#c5cae9", cursor: "pointer" }}>⋮</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default  Dashboard;