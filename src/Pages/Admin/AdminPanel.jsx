import { useState, useEffect, useRef } from "react";

/* ─────────────────────────────────────────────────────────────────
   MOCK DATA LAYER  (replace with your real DB utils)
───────────────────────────────────────────────────────────────── */
const STORAGE = {
  get: (k, def) => { try { return JSON.parse(localStorage.getItem(k)) ?? def; } catch { return def; } },
  set: (k, v)   => localStorage.setItem(k, JSON.stringify(v)),
};
const uid = () => Math.random().toString(36).slice(2, 10);
const now = () => new Date().toISOString();

// ── seed helpers ──
// function seed() {
//   if (!STORAGE.get("adm_seeded", false)) {
//     STORAGE.set("adm_doctors", [
//       { id:"d1", name:"Dr. Amara Nkosi",    email:"amara@stech.cm",  phone:"+237 6XX XXX 001", specialty:"Cardiology",     status:"active",   rating:4.9, experience:"12 yrs", location:"Douala", bio:"Senior cardiologist.", password:"doc123", avatar:"AN", revenue:0, createdAt:now() },
//       { id:"d2", name:"Dr. Boukar Jean",    email:"boukar@stech.cm", phone:"+237 6XX XXX 002", specialty:"Dentistry",      status:"active",   rating:4.7, experience:"8 yrs",  location:"Yaoundé", bio:"Dental specialist.",  password:"doc123", avatar:"BJ", revenue:0, createdAt:now() },
//       { id:"d3", name:"Dr. Claire Fongang", email:"claire@stech.cm", phone:"+237 6XX XXX 003", specialty:"Dermatology",    status:"inactive", rating:4.5, experience:"6 yrs",  location:"Douala", bio:"Skin care expert.",   password:"doc123", avatar:"CF", revenue:0, createdAt:now() },
//     ]);
//     STORAGE.set("adm_patients", [
//       { id:"p1", name:"Emmanuel Tabi",    email:"e.tabi@mail.cm",   phone:"+237 655 001 001", bloodType:"O+", membership:true,  status:"active",   createdAt:now(), dob:"1990-04-12" },
//       { id:"p2", name:"Fatima Oumarou",   email:"f.oum@mail.cm",    phone:"+237 655 002 002", bloodType:"A+", membership:false, status:"active",   createdAt:now(), dob:"1995-08-23" },
//       { id:"p3", name:"Ngono Pierre",     email:"n.pierre@mail.cm", phone:"+237 655 003 003", bloodType:"B-", membership:true,  status:"inactive", createdAt:now(), dob:"1988-01-07" },
//     ]);
//     STORAGE.set("adm_appointments", [
//       { id:"a1", patientId:"p1", patientName:"Emmanuel Tabi",  doctorId:"d1", doctorName:"Dr. Amara Nkosi",    healthType:"Cardiology",  date:"2025-06-10", time:"09:00", status:"confirmed", notes:"Follow-up",   amount:25000 },
//       { id:"a2", patientId:"p2", patientName:"Fatima Oumarou", doctorId:"d2", doctorName:"Dr. Boukar Jean",    healthType:"Dentistry",   date:"2025-06-12", time:"11:00", status:"pending",   notes:"First visit", amount:15000 },
//       { id:"a3", patientId:"p3", patientName:"Ngono Pierre",   doctorId:"d3", doctorName:"Dr. Claire Fongang", healthType:"Dermatology", date:"2025-06-15", time:"14:00", status:"cancelled", notes:"Rash exam",   amount:18000 },
//     ]);
//     STORAGE.set("adm_payments", [
//       { id:"pay1", patientId:"p1", patientName:"Emmanuel Tabi",  appointmentId:"a1", service:"Cardiology Consultation", amount:25000, currency:"XAF", method:"Mobile Money", status:"paid",    txRef:"TX-001", date:"2025-06-10", adminCut:0 },
//       { id:"pay2", patientId:"p2", patientName:"Fatima Oumarou", appointmentId:"a2", service:"Dental Check-up",          amount:15000, currency:"XAF", method:"Cash",         status:"pending", txRef:"TX-002", date:"2025-06-12", adminCut:0 },
//     ]);
//     STORAGE.set("adm_messages", []);
//     STORAGE.set("adm_notifications", [
//       { id:"n1", toId:"admin", type:"appointment", title:"New Appointment", body:"Emmanuel Tabi booked a cardiology session.", read:false, createdAt:now() },
//       { id:"n2", toId:"admin", type:"payment",     title:"Payment Received", body:"25 000 XAF received for Cardiology.",    read:false, createdAt:now() },
//     ]);
//     STORAGE.set("adm_commissions", []); // {id, paymentId, amount, pct, createdAt}
//     STORAGE.set("adm_forfaits", [
//       { id:"f1", name:"Basic",    price:15000,  pct:10, description:"Standard single-visit consultation." },
//       { id:"f2", name:"Premium",  price:35000,  pct:15, description:"Priority access + follow-up." },
//       { id:"f3", name:"Elite",    price:75000,  pct:20, description:"Full annual care package." },
//     ]);
//     STORAGE.set("adm_seeded", true);
//   }
// }
// seed();

// mini-ORMs
const db = (key) => ({
  all:    ()     => STORAGE.get(key, []),
  get:    (id)   => STORAGE.get(key, []).find(r => r.id === id),
  add:    (obj)  => { const rows = STORAGE.get(key,[]); rows.push(obj); STORAGE.set(key, rows); return obj; },
  update: (id, patch) => {
    const rows = STORAGE.get(key,[]).map(r => r.id===id ? {...r,...patch} : r);
    STORAGE.set(key, rows); return rows.find(r=>r.id===id);
  },
  delete: (id)   => { const rows = STORAGE.get(key,[]).filter(r=>r.id!==id); STORAGE.set(key,rows); },
});
const doctorDB  = db("adm_doctors");
const patientDB = db("adm_patients");
const apptDB    = db("adm_appointments");
const payDB     = db("adm_payments");
const msgDB     = db("adm_messages");
const notifDB   = db("adm_notifications");
const commDB    = db("adm_commissions");
const forfaitDB = db("adm_forfaits");

/* ─────────────────────────────────────────────────────────────────
   TINY UTILITIES
───────────────────────────────────────────────────────────────── */
const COMMISSION_PCT = 12; // default admin cut %

function applyCommission(payment) {
  const pct = payment.forfaitPct ?? COMMISSION_PCT;
  const cut = Math.round(payment.amount * pct / 100);
  payDB.update(payment.id, { adminCut: cut });
  commDB.add({ id: uid(), paymentId: payment.id, patientName: payment.patientName, service: payment.service, amount: cut, pct, createdAt: now() });
}

function pushNotif(toId, type, title, body) {
  notifDB.add({ id: uid(), toId, type, title, body, read: false, createdAt: now() });
}

/* ─────────────────────────────────────────────────────────────────
   AVATAR
───────────────────────────────────────────────────────────────── */
function Av({ name="?", size=36 }) {
  const colors = ["#1e88e5","#00bfa5","#7c3aed","#f44336","#ff7043","#0d47a1","#00838f"];
  const idx = (name.charCodeAt(0)||0) % colors.length;
  const initials = name.split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase();
  return (
    <div style={{ width:size, height:size, borderRadius:"50%", background:colors[idx], color:"#fff",
      display:"flex", alignItems:"center", justifyContent:"center",
      fontWeight:700, fontSize:size*0.36, flexShrink:0, fontFamily:"'Sora',sans-serif",
      boxShadow:"0 2px 8px rgba(0,0,0,.18)" }}>
      {initials}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   BADGE & STATUS
───────────────────────────────────────────────────────────────── */
const statusColor = { confirmed:"#22c55e", active:"#22c55e", paid:"#22c55e",
  pending:"#fbbf24", scheduled:"#fbbf24",
  cancelled:"#f44336", inactive:"#94a3b8", unpaid:"#f44336" };

function Badge({ label, color }) {
  const c = color || statusColor[label?.toLowerCase()] || "#94a3b8";
  return (
    <span style={{ background: c+"22", color:c, border:`1px solid ${c}44`,
      borderRadius:6, padding:"2px 10px", fontSize:11, fontWeight:700, whiteSpace:"nowrap" }}>
      {label}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────────
   MODAL WRAPPER
───────────────────────────────────────────────────────────────── */
function Modal({ title, onClose, children, wide }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.55)", zIndex:9999,
      display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}
      onClick={onClose}>
      <div style={{ background:"var(--card)", borderRadius:18, width:"100%", maxWidth: wide?720:480,
        maxHeight:"90vh", overflow:"auto", boxShadow:"0 24px 80px rgba(0,0,0,.4)", border:"1px solid var(--border)" }}
        onClick={e=>e.stopPropagation()}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
          padding:"20px 24px", borderBottom:"1px solid var(--border)" }}>
          <span style={{ fontFamily:"'Sora',sans-serif", fontWeight:700, fontSize:16 }}>{title}</span>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer",
            fontSize:20, color:"var(--muted)", lineHeight:1 }}>✕</button>
        </div>
        <div style={{ padding:"20px 24px" }}>{children}</div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   FORM ROW
───────────────────────────────────────────────────────────────── */
function FRow({ label, children }) {
  return (
    <div style={{ marginBottom:14 }}>
      <label style={{ display:"block", fontSize:12, fontWeight:700, color:"var(--muted)", marginBottom:5, textTransform:"uppercase", letterSpacing:.6 }}>{label}</label>
      {children}
    </div>
  );
}
const inp = {
  background:"var(--bg)", border:"1.5px solid var(--border)", borderRadius:9, padding:"9px 13px",
  width:"100%", fontSize:14, color:"var(--text)", outline:"none", boxSizing:"border-box", fontFamily:"inherit",
};

/* ─────────────────────────────────────────────────────────────────
   TOAST
───────────────────────────────────────────────────────────────── */
function useToast() {
  const [toasts, setToasts] = useState([]);
  const fire = (msg, type="success") => {
    const id = uid();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x=>x.id!==id)), 3200);
  };
  return { toasts, fire };
}

function Toaster({ toasts }) {
  return (
    <div style={{ position:"fixed", bottom:24, right:24, zIndex:99999, display:"flex", flexDirection:"column", gap:8 }}>
      {toasts.map(t => (
        <div key={t.id} style={{ background: t.type==="error"?"#f44336":t.type==="warn"?"#fbbf24":"#22c55e",
          color:"#fff", borderRadius:12, padding:"12px 20px", fontSize:14, fontWeight:600,
          boxShadow:"0 8px 32px rgba(0,0,0,.3)", animation:"slideUp .3s ease", minWidth:220 }}>
          {t.msg}
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   NAV
───────────────────────────────────────────────────────────────── */
const NAV = [
  { section:"Overview" },
  { key:"overview",      icon:"⊞",  label:"Dashboard" },
  { key:"analytics",     icon:"📊",  label:"Analytics" },
  { section:"People" },
  { key:"doctors",       icon:"🩺",  label:"Doctors" },
  { key:"patients",      icon:"👥",  label:"Patients" },
  { section:"Operations" },
  { key:"appointments",  icon:"📅",  label:"Appointments" },
  { key:"messages",      icon:"💬",  label:"Messages" },
  { key:"notifications", icon:"🔔",  label:"Notifications" },
  { section:"Finance" },
  { key:"payments",      icon:"💳",  label:"Payments" },
  { key:"revenue",       icon:"📈",  label:"My Revenue" },
  { key:"forfaits",      icon:"🏷️",  label:"Forfaits" },
  { section:"System" },
  { key:"settings",      icon:"⚙️",  label:"Settings" },
  { key:"profile",       icon:"👤",  label:"Profile" },
];

/* ═══════════════════════════════════════════════════════════════
   ROOT ADMIN PANEL
═══════════════════════════════════════════════════════════════ */
export default function AdminPanel({ onLogout }) {
  const [tab, setTab] = useState("overview");
  const [sideOpen, setSideOpen] = useState(false);
  const { toasts, fire: toast } = useToast();
  const [unread, setUnread] = useState(0);
  const [unreadMsg, setUnreadMsg] = useState(0);

  const refreshBadges = () => {
    setUnread(notifDB.all().filter(n=>n.toId==="admin"&&!n.read).length);
    setUnreadMsg(msgDB.all().filter(m=>m.toId==="admin"&&!m.read).length);
  };
  useEffect(() => { refreshBadges(); const t = setInterval(refreshBadges, 3000); return ()=>clearInterval(t); }, []);

  return (
    <div style={{ display:"flex", height:"100vh", overflow:"hidden", background:"var(--bg)", fontFamily:"'DM Sans', sans-serif", color:"var(--text)" }}>
      <style>{CSS}</style>

      {/* ── Sidebar ── */}
      <aside className={`sidebar${sideOpen?" open":""}`}>
        <div className="sidebar-brand">
          <div className="brand-orb">S</div>
          <div>
            <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:800, fontSize:15, color:"#fff" }}>STECH</div>
            <div style={{ fontSize:10, color:"#94a3b8", letterSpacing:1.5, textTransform:"uppercase" }}>Admin Portal</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV.map((n, i) => {
            if (n.section) return <div key={i} className="nav-section">{n.section}</div>;
            const badge = n.key==="notifications" ? unread : n.key==="messages" ? unreadMsg : 0;
            return (
              <button key={n.key} className={`nav-item${tab===n.key?" active":""}`}
                onClick={() => { setTab(n.key); setSideOpen(false); }}>
                <span className="nav-icon">{n.icon}</span>
                <span>{n.label}</span>
                {badge > 0 && <span className="nav-badge">{badge}</span>}
              </button>
            );
          })}
        </nav>

        <button className="logout-btn" onClick={onLogout}>
          <span>🚪</span> Logout
        </button>
      </aside>

      {/* ── Main ── */}
      <div className="main-wrap">
        <header className="topbar">
          <button className="hamburger" onClick={() => setSideOpen(s=>!s)}>☰</button>
          <div style={{ flex:1 }} />
          <button className="topbar-icon" onClick={() => setTab("messages")}>
            💬{unreadMsg>0&&<sup className="top-badge">{unreadMsg}</sup>}
          </button>
          <button className="topbar-icon" onClick={() => setTab("notifications")}>
            🔔{unread>0&&<sup className="top-badge">{unread}</sup>}
          </button>
          <div style={{ width:34, height:34, borderRadius:"50%", background:"linear-gradient(135deg,#0d1b3e,#1e88e5)",
            display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:700, fontSize:14 }}>A</div>
        </header>

        <main className="content-scroll">
          {tab==="overview"      && <AdminOverview    onNav={setTab} toast={toast} refreshBadges={refreshBadges} />}
          {tab==="analytics"     && <AdminAnalytics />}
          {tab==="doctors"       && <AdminDoctors     toast={toast} refreshBadges={refreshBadges} />}
          {tab==="patients"      && <AdminPatients    toast={toast} />}
          {tab==="appointments"  && <AdminAppointments toast={toast} />}
          {tab==="messages"      && <AdminMessages    toast={toast} refreshBadges={refreshBadges} />}
          {tab==="notifications" && <AdminNotifications refreshBadges={refreshBadges} />}
          {tab==="payments"      && <AdminPayments    toast={toast} />}
          {tab==="revenue"       && <AdminRevenue />}
          {tab==="forfaits"      && <AdminForfaits    toast={toast} />}
          {tab==="settings"      && <AdminSettings    toast={toast} />}
          {tab==="profile"       && <AdminProfile     toast={toast} />}
        </main>
      </div>

      {sideOpen && <div className="overlay" onClick={() => setSideOpen(false)} />}
      <Toaster toasts={toasts} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   OVERVIEW
═══════════════════════════════════════════════════════════════ */
function AdminOverview({ onNav, toast, refreshBadges }) {
  const appts    = apptDB.all();
  const patients = patientDB.all();
  const doctors  = doctorDB.all();
  const payments = payDB.all();
  const revenue  = payments.filter(p=>p.status==="paid").reduce((s,p)=>s+p.amount,0);
  const myEarnings = commDB.all().reduce((s,c)=>s+c.amount,0);
  const recent   = appts.slice(-6).reverse();

  const stats = [
    { icon:"👥", label:"Patients",       value:patients.length,                                    color:"#1e88e5", trend:`${patients.filter(p=>p.status==="active").length} active` },
    { icon:"🩺", label:"Doctors",         value:doctors.length,                                     color:"#00bfa5", trend:`${doctors.filter(d=>d.status==="active").length} active` },
    { icon:"📅", label:"Appointments",    value:appts.length,                                       color:"#f44336", trend:`${appts.filter(a=>a.status==="pending").length} pending` },
    { icon:"💰", label:"My Earnings",     value:`${(myEarnings/1000).toFixed(1)}K XAF`,             color:"#7c3aed", trend:`${COMMISSION_PCT}% commission` },
  ];

  return (
    <div className="page-anim">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-sub">Welcome back, Administrator · {new Date().toDateString()}</p>
        </div>
        <button className="btn-primary" onClick={() => onNav("appointments")}>+ Appointment</button>
      </div>

      <div className="stats-row">
        {stats.map(s => (
          <div key={s.label} className="stat-card" style={{ "--accent":s.color }}>
            <div className="stat-icon-wrap" style={{ background:s.color+"1a" }}>{s.icon}</div>
            <div className="stat-body">
              <div className="stat-label">{s.label}</div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-trend">{s.trend}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="two-col">
        <div className="card">
          <div className="card-head">
            <div className="card-title">Recent Appointments</div>
            <button className="ghost-btn" onClick={()=>onNav("appointments")}>View all →</button>
          </div>
          <div className="tbl-wrap">
            <table className="s-table">
              <thead><tr><th>Patient</th><th>Doctor</th><th>Type</th><th>Date</th><th>Status</th></tr></thead>
              <tbody>
                {recent.map(a=>(
                  <tr key={a.id}>
                    <td><div style={{display:"flex",alignItems:"center",gap:8}}><Av name={a.patientName} size={26}/>{a.patientName}</div></td>
                    <td className="hide-sm">{a.doctorName}</td>
                    <td>{a.healthType}</td>
                    <td>{a.date}</td>
                    <td><Badge label={a.status}/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="stack">
          <div className="card">
            <div className="card-title" style={{marginBottom:14}}>Quick Actions</div>
            <div className="quick-grid">
              {[
                {icon:"🩺",label:"Add Doctor",    nav:"doctors",       c:"#00bfa5"},
                {icon:"👥",label:"Patients",       nav:"patients",      c:"#1e88e5"},
                {icon:"💬",label:"Messages",       nav:"messages",      c:"#7c3aed"},
                {icon:"💳",label:"Payments",       nav:"payments",      c:"#f44336"},
                {icon:"📈",label:"Revenue",        nav:"revenue",       c:"#ff7043"},
                {icon:"🏷️",label:"Forfaits",       nav:"forfaits",      c:"#fbbf24"},
              ].map(q=>(
                <button key={q.label} className="quick-btn" style={{"--qc":q.c}} onClick={()=>onNav(q.nav)}>
                  <span style={{fontSize:22}}>{q.icon}</span>
                  <span style={{fontSize:11,fontWeight:700}}>{q.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-title" style={{marginBottom:12}}>Revenue Snapshot</div>
            <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
              <div style={{flex:1,minWidth:120,background:"#ede9fe",borderRadius:12,padding:"14px 16px"}}>
                <div style={{fontSize:11,color:"#7c3aed",fontWeight:700,marginBottom:4}}>TOTAL BILLED</div>
                <div style={{fontFamily:"'Sora',sans-serif",fontWeight:800,fontSize:20,color:"#7c3aed"}}>{(revenue/1000).toFixed(1)}K XAF</div>
              </div>
              <div style={{flex:1,minWidth:120,background:"#dcfce7",borderRadius:12,padding:"14px 16px"}}>
                <div style={{fontSize:11,color:"#22c55e",fontWeight:700,marginBottom:4}}>MY EARNINGS</div>
                <div style={{fontFamily:"'Sora',sans-serif",fontWeight:800,fontSize:20,color:"#22c55e"}}>{(myEarnings/1000).toFixed(1)}K XAF</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ANALYTICS
═══════════════════════════════════════════════════════════════ */
function AdminAnalytics() {
  const appts    = apptDB.all();
  const payments = payDB.all();
  const byStatus = { confirmed:0, pending:0, cancelled:0 };
  appts.forEach(a => { if (byStatus[a.status]!==undefined) byStatus[a.status]++; });
  const byType = {};
  appts.forEach(a => { byType[a.healthType]=(byType[a.healthType]||0)+1; });
  const sorted = Object.entries(byType).sort((a,b)=>b[1]-a[1]).slice(0,6);
  const max = sorted[0]?.[1]||1;
  const revenue = payments.filter(p=>p.status==="paid").reduce((s,p)=>s+p.amount,0);

  return (
    <div className="page-anim">
      <div className="page-header"><div><h1 className="page-title">Analytics</h1><p className="page-sub">Platform-wide statistics</p></div></div>
      <div className="stats-row">
        {[
          {label:"Total Revenue",  value:`${(revenue/1000).toFixed(1)}K XAF`, icon:"💰", c:"#7c3aed"},
          {label:"Confirmed",      value:byStatus.confirmed,   icon:"✅", c:"#22c55e"},
          {label:"Pending",        value:byStatus.pending,     icon:"⏳", c:"#fbbf24"},
          {label:"Cancelled",      value:byStatus.cancelled,   icon:"❌", c:"#f44336"},
        ].map(s=>(
          <div key={s.label} className="stat-card" style={{"--accent":s.c}}>
            <div className="stat-icon-wrap" style={{background:s.c+"1a"}}>{s.icon}</div>
            <div className="stat-body"><div className="stat-label">{s.label}</div><div className="stat-value">{s.value}</div></div>
          </div>
        ))}
      </div>
      <div className="two-col">
        <div className="card">
          <div className="card-title" style={{marginBottom:16}}>Top Appointment Types</div>
          {sorted.map(([type,count])=>(
            <div key={type} style={{marginBottom:14}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:5}}>
                <span style={{fontWeight:600}}>{type}</span><span style={{color:"var(--muted)"}}>{count}</span>
              </div>
              <div style={{height:8,background:"var(--border)",borderRadius:99}}>
                <div style={{height:"100%",width:`${(count/max)*100}%`,background:"#1e88e5",borderRadius:99,transition:"width .6s"}}/>
              </div>
            </div>
          ))}
        </div>
        <div className="card">
          <div className="card-title" style={{marginBottom:16}}>Payment Methods</div>
          {Object.entries(payments.reduce((acc,p)=>{acc[p.method]=(acc[p.method]||0)+p.amount;return acc;},{})).map(([m,t])=>(
            <div key={m} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"11px 0",borderBottom:"1px solid var(--border)"}}>
              <span style={{fontWeight:600}}>{m}</span>
              <Badge label={`${(t/1000).toFixed(0)}K XAF`} color="#1e88e5"/>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   DOCTORS — full CRUD + status + messaging
═══════════════════════════════════════════════════════════════ */
function AdminDoctors({ toast, refreshBadges }) {
  const [doctors, setDrs] = useState(doctorDB.all());
  const [search, setSearch] = useState("");
  const [modal, setModal]   = useState(null); // null | "view" | "add" | "edit" | "msg"
  const [sel, setSel]       = useState(null);
  const [msgText, setMsgText] = useState("");
  const blank = { name:"", email:"", phone:"", specialty:"", location:"", experience:"", bio:"", password:"", status:"active", rating:4.5 };
  const [form, setForm]     = useState(blank);

  const refresh = () => setDrs(doctorDB.all());
  const filtered = doctors.filter(d =>
    d.name?.toLowerCase().includes(search.toLowerCase()) ||
    d.specialty?.toLowerCase().includes(search.toLowerCase())
  );

  const saveDoctor = () => {
    if (!form.name || !form.email || !form.specialty) { toast("Fill required fields","error"); return; }
    if (sel) {
      doctorDB.update(sel.id, form);
      pushNotif(sel.id, "system", "Profile Updated", "Your profile was updated by the administrator.");
      toast("Doctor updated!");
    } else {
      const id = "d"+uid();
      doctorDB.add({ ...form, id, avatar: form.name.slice(0,2).toUpperCase(), revenue:0, createdAt: now() });
      pushNotif(id, "system", "Welcome to STECH!", `Hello Dr. ${form.name}, your account has been created.`);
      toast("Doctor account created!");
    }
    refresh(); setModal(null); setForm(blank); setSel(null);
  };

  const deleteDoctor = (d) => {
    if (!window.confirm(`Delete ${d.name}? This cannot be undone.`)) return;
    doctorDB.delete(d.id);
    toast("Doctor removed.", "warn");
    refresh();
  };

  const sendMessage = () => {
    if (!msgText.trim()) return;
    msgDB.add({ id:uid(), fromId:"admin", fromName:"Administrator", toId:sel.id, toName:sel.name,
      body:msgText.trim(), read:false, createdAt:now() });
    pushNotif(sel.id, "message", "New message from Admin", msgText.trim());
    setMsgText(""); toast(`Message sent to ${sel.name}`);
    refreshBadges();
    setModal(null);
  };

  return (
    <div className="page-anim">
      <div className="page-header">
        <div><h1 className="page-title">Doctors</h1><p className="page-sub">{doctors.length} registered</p></div>
        <button className="btn-primary" onClick={() => { setForm(blank); setSel(null); setModal("add"); }}>+ Add Doctor</button>
      </div>

      <div className="card" style={{marginBottom:20}}>
        <input className="search-inp" placeholder="Search name or specialty…" value={search} onChange={e=>setSearch(e.target.value)}/>
      </div>

      <div className="doctors-grid">
        {filtered.map(d=>(
          <div key={d.id} className="doctor-card">
            <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:12}}>
              <Av name={d.name} size={50}/>
              <div>
                <div style={{fontFamily:"'Sora',sans-serif",fontWeight:700,fontSize:15}}>{d.name}</div>
                <div style={{color:"var(--muted)",fontSize:13}}>{d.specialty}</div>
                <div style={{display:"flex",alignItems:"center",gap:4,marginTop:3}}>
                  <span style={{color:"#fbbf24"}}>★</span>
                  <span style={{fontWeight:700,fontSize:13}}>{d.rating}</span>
                  <span style={{color:"var(--muted)",fontSize:12,marginLeft:4}}>· {d.experience}</span>
                </div>
              </div>
            </div>
            <div style={{fontSize:12,color:"var(--muted)",marginBottom:12,lineHeight:1.5}}>{d.bio}</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              <Badge label={d.status}/>
              <button className="ghost-btn" onClick={()=>{setSel(d);setModal("view");}}>👁 View</button>
              <button className="ghost-btn" onClick={()=>{setSel(d);setForm({...d});setModal("edit");}}>✏️ Edit</button>
              <button className="ghost-btn" style={{color:"#7c3aed"}} onClick={()=>{setSel(d);setModal("msg");}}>💬 Msg</button>
              <button className="ghost-btn" style={{color:"var(--red)"}} onClick={()=>deleteDoctor(d)}>🗑</button>
            </div>
          </div>
        ))}
      </div>

      {/* ADD / EDIT MODAL */}
      {(modal==="add"||modal==="edit") && (
        <Modal title={modal==="add"?"Add New Doctor":"Edit Doctor"} onClose={()=>setModal(null)} wide>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 16px"}}>
            {[["Full Name*","name","text"],["Email*","email","email"],["Phone","phone","text"],["Specialty*","specialty","text"],
              ["Location","location","text"],["Experience","experience","text"],["Rating","rating","number"]].map(([l,k,t])=>(
              <FRow key={k} label={l}>
                <input style={inp} type={t} value={form[k]||""} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))}/>
              </FRow>
            ))}
            <FRow label="Status">
              <select style={inp} value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))}>
                <option value="active">Active</option><option value="inactive">Inactive</option>
              </select>
            </FRow>
            {modal==="add" && (
              <FRow label="Password*">
                <input style={inp} type="password" value={form.password||""} onChange={e=>setForm(f=>({...f,password:e.target.value}))}/>
              </FRow>
            )}
          </div>
          <FRow label="Bio">
            <textarea style={{...inp,height:72,resize:"vertical"}} value={form.bio||""} onChange={e=>setForm(f=>({...f,bio:e.target.value}))}/>
          </FRow>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:8}}>
            <button className="ghost-btn" onClick={()=>setModal(null)}>Cancel</button>
            <button className="btn-primary" onClick={saveDoctor}>{modal==="add"?"Create Account":"Save Changes"}</button>
          </div>
        </Modal>
      )}

      {/* VIEW MODAL */}
      {modal==="view" && sel && (
        <Modal title={sel.name} onClose={()=>setModal(null)}>
          <div style={{textAlign:"center",marginBottom:18}}><Av name={sel.name} size={70}/><p style={{color:"var(--muted)",marginTop:8}}>{sel.specialty}</p></div>
          {[["Email",sel.email],["Phone",sel.phone],["Location",sel.location],["Experience",sel.experience],["Rating",`★ ${sel.rating}`],["Status",sel.status],["Bio",sel.bio]].map(([k,v])=>(
            <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"9px 0",borderBottom:"1px solid var(--border)",fontSize:14}}>
              <span style={{color:"var(--muted)",fontWeight:600}}>{k}</span>
              <span style={{fontWeight:600,maxWidth:"60%",textAlign:"right"}}>{v}</span>
            </div>
          ))}
          <div style={{display:"flex",gap:8,marginTop:16,justifyContent:"flex-end"}}>
            <button className="ghost-btn" onClick={()=>{setForm({...sel});setModal("edit");}}>✏️ Edit</button>
            <button className="btn-primary" onClick={()=>setModal("msg")}>💬 Message</button>
          </div>
        </Modal>
      )}

      {/* MESSAGE MODAL */}
      {modal==="msg" && sel && (
        <Modal title={`Message to ${sel.name}`} onClose={()=>setModal(null)}>
          <p style={{color:"var(--muted)",fontSize:13,marginBottom:14}}>Send a direct message to {sel.name}. They will receive a notification.</p>
          <FRow label="Message">
            <textarea style={{...inp,height:120,resize:"vertical"}} placeholder="Type your message…"
              value={msgText} onChange={e=>setMsgText(e.target.value)}/>
          </FRow>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
            <button className="ghost-btn" onClick={()=>setModal(null)}>Cancel</button>
            <button className="btn-primary" onClick={sendMessage}>Send Message</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PATIENTS
═══════════════════════════════════════════════════════════════ */
function AdminPatients({ toast }) {
  const [patients, setPts] = useState(patientDB.all());
  const [search, setSearch] = useState("");
  const [sel, setSel]       = useState(null);
  const [msgText, setMsgText] = useState("");
  const [msgModal, setMsgModal] = useState(false);
  const refresh = () => setPts(patientDB.all());

  const filtered = patients.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.email?.toLowerCase().includes(search.toLowerCase())
  );

  const toggleStatus = (p) => {
    const status = p.status==="active"?"inactive":"active";
    patientDB.update(p.id, { status });
    pushNotif(p.id, "system", "Account Status Changed", `Your account has been ${status} by the administrator.`);
    toast(`${p.name} ${status}`);
    refresh();
  };

  const sendMsg = () => {
    if (!msgText.trim()) return;
    msgDB.add({ id:uid(), fromId:"admin", fromName:"Administrator", toId:sel.id, toName:sel.name,
      body:msgText.trim(), read:false, createdAt:now() });
    pushNotif(sel.id, "message", "Message from Admin", msgText.trim());
    setMsgText(""); setMsgModal(false);
    toast(`Message sent to ${sel.name}`);
  };

  return (
    <div className="page-anim">
      <div className="page-header"><div><h1 className="page-title">Patients</h1><p className="page-sub">{patients.length} registered</p></div></div>
      <div className="card">
        <input className="search-inp" placeholder="Search name or email…" value={search} onChange={e=>setSearch(e.target.value)}/>
        <div className="tbl-wrap">
          <table className="s-table">
            <thead><tr><th>Patient</th><th>Email</th><th>Blood</th><th>Membership</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.map(p=>(
                <tr key={p.id}>
                  <td><div style={{display:"flex",alignItems:"center",gap:8}}><Av name={p.name} size={30}/><span style={{fontWeight:600}}>{p.name}</span></div></td>
                  <td>{p.email}</td>
                  <td><Badge label={p.bloodType||"—"} color="#f44336"/></td>
                  <td>{p.membership?<Badge label="Member" color="#22c55e"/>:<Badge label="None" color="#94a3b8"/>}</td>
                  <td><Badge label={p.status}/></td>
                  <td>
                    <div style={{display:"flex",gap:5}}>
                      <button className="ghost-btn" onClick={()=>setSel(sel?.id===p.id?null:p)}>👁</button>
                      <button className="ghost-btn" style={{color:"#7c3aed"}} onClick={()=>{setSel(p);setMsgModal(true);}}>💬</button>
                      <button className={`ghost-btn ${p.status==="active"?"":"green-btn"}`} onClick={()=>toggleStatus(p)}>
                        {p.status==="active"?"🔒":"🔓"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {sel && !msgModal && (
        <Modal title="Patient Profile" onClose={()=>setSel(null)}>
          <div style={{textAlign:"center",marginBottom:18}}><Av name={sel.name} size={68}/><h3 style={{marginTop:10,fontFamily:"'Sora',sans-serif"}}>{sel.name}</h3><p style={{color:"var(--muted)"}}>{sel.email}</p></div>
          {[["Phone",sel.phone],["DOB",sel.dob||"—"],["Blood",sel.bloodType||"—"],["Membership",sel.membership?"Yes":"No"],["Status",sel.status]].map(([k,v])=>(
            <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"9px 0",borderBottom:"1px solid var(--border)",fontSize:14}}>
              <span style={{color:"var(--muted)",fontWeight:600}}>{k}</span><span style={{fontWeight:600}}>{v}</span>
            </div>
          ))}
          <div style={{marginTop:16,textAlign:"right"}}>
            <button className="btn-primary" onClick={()=>setMsgModal(true)}>💬 Send Message</button>
          </div>
        </Modal>
      )}

      {msgModal && sel && (
        <Modal title={`Message → ${sel.name}`} onClose={()=>setMsgModal(false)}>
          <FRow label="Message">
            <textarea style={{...inp,height:120,resize:"vertical"}} placeholder="Type your message…"
              value={msgText} onChange={e=>setMsgText(e.target.value)}/>
          </FRow>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
            <button className="ghost-btn" onClick={()=>setMsgModal(false)}>Cancel</button>
            <button className="btn-primary" onClick={sendMsg}>Send</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   APPOINTMENTS
═══════════════════════════════════════════════════════════════ */
function AdminAppointments({ toast }) {
  const [items, setItems] = useState(apptDB.all());
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [modal, setModal]   = useState(null);
  const refresh = () => setItems(apptDB.all());

  const filtered = items.filter(a =>
    (filter==="all"||a.status===filter) &&
    (a.patientName?.toLowerCase().includes(search.toLowerCase())||a.doctorName?.toLowerCase().includes(search.toLowerCase()))
  );

  const update = (id, status) => {
    const a = apptDB.update(id, { status });
    pushNotif(a.patientId, "appointment", "Appointment Update", `Your appointment was ${status}.`);
    pushNotif(a.doctorId, "appointment", "Appointment Update", `Appointment with ${a.patientName} is ${status}.`);
    toast(`Status → ${status}`);
    refresh();
  };

  return (
    <div className="page-anim">
      <div className="page-header"><div><h1 className="page-title">Appointments</h1><p className="page-sub">{items.length} total</p></div></div>
      <div className="card">
        <div className="filter-bar">
          <input className="search-inp" style={{maxWidth:260}} placeholder="Search…" value={search} onChange={e=>setSearch(e.target.value)}/>
          <div className="filter-tabs">
            {["all","pending","confirmed","cancelled"].map(f=>(
              <button key={f} className={`filter-tab${filter===f?" active":""}`} onClick={()=>setFilter(f)}>
                {f.charAt(0).toUpperCase()+f.slice(1)}
                <span className="f-count">{f==="all"?items.length:items.filter(a=>a.status===f).length}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="tbl-wrap">
          <table className="s-table">
            <thead><tr><th>Patient</th><th>Doctor</th><th>Type</th><th>Date</th><th>Amount</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.length===0&&<tr><td colSpan={7} style={{textAlign:"center",padding:32,color:"var(--muted)"}}>No results.</td></tr>}
              {filtered.map(a=>(
                <tr key={a.id}>
                  <td><div style={{display:"flex",alignItems:"center",gap:8}}><Av name={a.patientName} size={26}/>{a.patientName}</div></td>
                  <td className="hide-sm">{a.doctorName}</td>
                  <td>{a.healthType}</td>
                  <td>{a.date}</td>
                  <td style={{fontWeight:700}}>{(a.amount||0).toLocaleString()} XAF</td>
                  <td><Badge label={a.status}/></td>
                  <td>
                    <div style={{display:"flex",gap:4}}>
                      {a.status==="pending"&&<>
                        <button className="ghost-btn green-btn" onClick={()=>update(a.id,"confirmed")}>✓</button>
                        <button className="ghost-btn" style={{color:"var(--red)"}} onClick={()=>update(a.id,"cancelled")}>✗</button>
                      </>}
                      <button className="ghost-btn" onClick={()=>setModal(a)}>👁</button>
                      <button className="ghost-btn" style={{color:"var(--red)"}} onClick={()=>{apptDB.delete(a.id);refresh();}}>🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {modal&&(
        <Modal title="Appointment Detail" onClose={()=>setModal(null)}>
          {[["Patient",modal.patientName],["Doctor",modal.doctorName],["Type",modal.healthType],["Date",modal.date],["Time",modal.time],["Amount",`${(modal.amount||0).toLocaleString()} XAF`],["Status",modal.status],["Notes",modal.notes||"—"]].map(([k,v])=>(
            <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"9px 0",borderBottom:"1px solid var(--border)",fontSize:14}}>
              <span style={{color:"var(--muted)",fontWeight:600}}>{k}</span><span style={{fontWeight:600}}>{v}</span>
            </div>
          ))}
        </Modal>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MESSAGES — broadcast + individual threads
═══════════════════════════════════════════════════════════════ */
function AdminMessages({ toast, refreshBadges }) {
  const [messages, setMessages] = useState([]);
  const [tab, setTab] = useState("inbox");
  const [compose, setCompose] = useState(false);
  const [form, setForm] = useState({ toId:"all_doctors", body:"" });
  const [doctors, setDoctors]   = useState(doctorDB.all());
  const [patients, setPatients] = useState(patientDB.all());
  const everyone = [
    { id:"all_doctors",  label:"📢 All Doctors" },
    { id:"all_patients", label:"📢 All Patients" },
    { id:"all",          label:"📢 Everyone" },
    ...doctors.map(d=>({ id:d.id, label:`🩺 ${d.name}` })),
    ...patients.map(p=>({ id:p.id, label:`👤 ${p.name}` })),
  ];

  const refresh = () => {
    const all = msgDB.all();
    const inbox = all.filter(m=>m.toId==="admin"||m.toId==="all");
    const sent  = all.filter(m=>m.fromId==="admin");
    setMessages(tab==="inbox"?inbox:sent);
    all.filter(m=>m.toId==="admin"&&!m.read).forEach(m=>msgDB.update(m.id,{read:true}));
    refreshBadges();
  };
  useEffect(()=>{ refresh(); },[tab]);

  const send = () => {
    if (!form.body.trim()) return;
    const targets = form.toId==="all_doctors"   ? doctors.map(d=>d.id)
                  : form.toId==="all_patients"  ? patients.map(p=>p.id)
                  : form.toId==="all"           ? [...doctors.map(d=>d.id),...patients.map(p=>p.id)]
                  : [form.toId];
    const rec = everyone.find(e=>e.id===form.toId);
    targets.forEach(tid=>{
      msgDB.add({ id:uid(), fromId:"admin", fromName:"Administrator", toId:tid, toName:rec?.label||tid,
        body:form.body.trim(), read:false, createdAt:now() });
      pushNotif(tid,"message","Message from Administrator",form.body.trim());
    });
    toast(`Message sent to ${targets.length} recipient(s)`);
    setCompose(false); setForm({toId:"all_doctors",body:""}); refresh();
  };

  return (
    <div className="page-anim">
      <div className="page-header">
        <div><h1 className="page-title">Messages</h1><p className="page-sub">Communicate with doctors & patients</p></div>
        <button className="btn-primary" onClick={()=>setCompose(true)}>+ Compose</button>
      </div>

      <div style={{display:"flex",gap:8,marginBottom:16}}>
        {["inbox","sent"].map(t=>(
          <button key={t} className={`filter-tab${tab===t?" active":""}`} onClick={()=>setTab(t)}>
            {t.charAt(0).toUpperCase()+t.slice(1)}
          </button>
        ))}
      </div>

      <div className="card">
        {messages.length===0 && (
          <div className="empty-state"><span style={{fontSize:40}}>💬</span><p>No messages yet.</p></div>
        )}
        {messages.map(m=>(
          <div key={m.id} className="msg-item">
            <Av name={tab==="inbox"?m.fromName:m.toName} size={38}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                <span style={{fontWeight:700,fontSize:14}}>{tab==="inbox"?m.fromName:m.toName}</span>
                <span style={{fontSize:11,color:"var(--muted)"}}>{new Date(m.createdAt).toLocaleString()}</span>
              </div>
              <p style={{fontSize:13,color:"var(--muted)",margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.body}</p>
            </div>
            {!m.read && tab==="inbox" && <div style={{width:8,height:8,borderRadius:"50%",background:"#1e88e5",flexShrink:0}}/>}
          </div>
        ))}
      </div>

      {compose && (
        <Modal title="Compose Message" onClose={()=>setCompose(false)}>
          <FRow label="Recipient">
            <select style={inp} value={form.toId} onChange={e=>setForm(f=>({...f,toId:e.target.value}))}>
              {everyone.map(e=><option key={e.id} value={e.id}>{e.label}</option>)}
            </select>
          </FRow>
          <FRow label="Message">
            <textarea style={{...inp,height:130,resize:"vertical"}} placeholder="Write your message…"
              value={form.body} onChange={e=>setForm(f=>({...f,body:e.target.value}))}/>
          </FRow>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
            <button className="ghost-btn" onClick={()=>setCompose(false)}>Cancel</button>
            <button className="btn-primary" onClick={send}>Send Message</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   NOTIFICATIONS
═══════════════════════════════════════════════════════════════ */
function AdminNotifications({ refreshBadges }) {
  const [items, setItems] = useState([]);
  const refresh = () => {
    const all = notifDB.all().filter(n=>n.toId==="admin").reverse();
    setItems(all);
    all.filter(n=>!n.read).forEach(n=>notifDB.update(n.id,{read:true}));
    refreshBadges();
  };
  useEffect(()=>refresh(),[]);

  const icons = { appointment:"📅", payment:"💳", message:"💬", system:"🔧" };

  return (
    <div className="page-anim">
      <div className="page-header">
        <div><h1 className="page-title">Notifications</h1><p className="page-sub">{items.filter(i=>!i.read).length} unread</p></div>
        <button className="ghost-btn" onClick={()=>{items.forEach(n=>notifDB.update(n.id,{read:true}));refresh();}}>Mark all read</button>
      </div>
      <div className="card">
        {items.length===0 && <div className="empty-state"><span style={{fontSize:40}}>🔔</span><p>No notifications.</p></div>}
        {items.map(n=>(
          <div key={n.id} className={`notif-item${!n.read?" unread":""}`}>
            <div style={{fontSize:24,flexShrink:0}}>{icons[n.type]||"🔔"}</div>
            <div style={{flex:1}}>
              <div style={{fontWeight:700,fontSize:14}}>{n.title}</div>
              <div style={{fontSize:13,color:"var(--muted)"}}>{n.body}</div>
              <div style={{fontSize:11,color:"var(--muted)",marginTop:4}}>{new Date(n.createdAt).toLocaleString()}</div>
            </div>
            {!n.read && <div style={{width:8,height:8,borderRadius:"50%",background:"#1e88e5",flexShrink:0,marginTop:4}}/>}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PAYMENTS — with auto-commission
═══════════════════════════════════════════════════════════════ */
function AdminPayments({ toast }) {
  const [items, setItems] = useState(payDB.all());
  const refresh = () => setItems(payDB.all());
  const revenue = items.filter(p=>p.status==="paid").reduce((s,p)=>s+p.amount,0);
  const pending = items.filter(p=>p.status==="pending").reduce((s,p)=>s+p.amount,0);

  const markPaid = (p) => {
    payDB.update(p.id,{status:"paid"});
    applyCommission({...p,status:"paid"});
    pushNotif(p.patientId,"payment","Payment Confirmed",`Payment of ${p.amount.toLocaleString()} XAF confirmed.`);
    toast("Payment confirmed + commission logged!");
    refresh();
  };

  return (
    <div className="page-anim">
      <div className="page-header"><div><h1 className="page-title">Payments</h1><p className="page-sub">Financial records</p></div></div>
      <div className="stats-row">
        {[
          {label:"Total Billed",  value:`${(revenue/1000).toFixed(1)}K XAF`, icon:"💰", c:"#7c3aed"},
          {label:"Pending",       value:`${(pending/1000).toFixed(1)}K XAF`, icon:"⏳", c:"#fbbf24"},
          {label:"Paid",          value:items.filter(p=>p.status==="paid").length,    icon:"✅", c:"#22c55e"},
          {label:"Pending Txns",  value:items.filter(p=>p.status==="pending").length, icon:"🔄", c:"#f44336"},
        ].map(s=>(
          <div key={s.label} className="stat-card" style={{"--accent":s.c}}>
            <div className="stat-icon-wrap" style={{background:s.c+"1a"}}>{s.icon}</div>
            <div className="stat-body"><div className="stat-label">{s.label}</div><div className="stat-value">{s.value}</div></div>
          </div>
        ))}
      </div>
      <div className="card">
        <div className="tbl-wrap">
          <table className="s-table">
            <thead><tr><th>Ref</th><th>Patient</th><th>Service</th><th>Amount</th><th>Commission</th><th>Method</th><th>Date</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {items.map(p=>(
                <tr key={p.id}>
                  <td style={{fontSize:11,color:"var(--muted)"}}>{p.txRef}</td>
                  <td>{p.patientName}</td>
                  <td>{p.service}</td>
                  <td style={{fontWeight:700}}>{p.amount.toLocaleString()} XAF</td>
                  <td style={{color:"#7c3aed",fontWeight:700}}>{p.adminCut?(p.adminCut.toLocaleString()+" XAF"):"—"}</td>
                  <td>{p.method}</td>
                  <td>{p.date}</td>
                  <td><Badge label={p.status}/></td>
                  <td>{p.status==="pending"&&<button className="ghost-btn green-btn" onClick={()=>markPaid(p)}>Mark Paid</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MY REVENUE — admin earnings from commissions
═══════════════════════════════════════════════════════════════ */
function AdminRevenue() {
  const comms    = commDB.all().reverse();
  const total    = comms.reduce((s,c)=>s+c.amount,0);
  const payments = payDB.all();
  const billed   = payments.filter(p=>p.status==="paid").reduce((s,p)=>s+p.amount,0);

  return (
    <div className="page-anim">
      <div className="page-header"><div><h1 className="page-title">My Revenue</h1><p className="page-sub">Commission earnings from bookings</p></div></div>

      <div className="stats-row">
        {[
          {label:"Total Earnings",  value:`${(total/1000).toFixed(2)}K XAF`,  icon:"💵", c:"#22c55e"},
          {label:"Total Billed",    value:`${(billed/1000).toFixed(1)}K XAF`, icon:"💳", c:"#1e88e5"},
          {label:"Avg Commission",  value:`${COMMISSION_PCT}%`,               icon:"📊", c:"#7c3aed"},
          {label:"Transactions",    value:comms.length,                        icon:"🔢", c:"#ff7043"},
        ].map(s=>(
          <div key={s.label} className="stat-card" style={{"--accent":s.c}}>
            <div className="stat-icon-wrap" style={{background:s.c+"1a"}}>{s.icon}</div>
            <div className="stat-body"><div className="stat-label">{s.label}</div><div className="stat-value">{s.value}</div></div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-head" style={{marginBottom:14}}>
          <div className="card-title">Commission History</div>
          <div style={{background:"#ede9fe",color:"#7c3aed",borderRadius:10,padding:"6px 14px",fontWeight:700,fontSize:14}}>
            Total: {total.toLocaleString()} XAF
          </div>
        </div>
        <div className="tbl-wrap">
          <table className="s-table">
            <thead><tr><th>Patient</th><th>Service</th><th>Commission</th><th>Rate</th><th>Date</th></tr></thead>
            <tbody>
              {comms.length===0&&<tr><td colSpan={5} style={{textAlign:"center",padding:32,color:"var(--muted)"}}>No commissions yet. Mark payments as paid to earn.</td></tr>}
              {comms.map(c=>(
                <tr key={c.id}>
                  <td>{c.patientName}</td>
                  <td>{c.service}</td>
                  <td style={{fontWeight:700,color:"#22c55e"}}>{c.amount.toLocaleString()} XAF</td>
                  <td><Badge label={`${c.pct}%`} color="#7c3aed"/></td>
                  <td style={{fontSize:12,color:"var(--muted)"}}>{new Date(c.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   FORFAITS — subscription plan management
═══════════════════════════════════════════════════════════════ */
function AdminForfaits({ toast }) {
  const [items, setItems] = useState(forfaitDB.all());
  const [modal, setModal] = useState(false);
  const [sel, setSel]     = useState(null);
  const blank = { name:"", price:"", pct:10, description:"" };
  const [form, setForm]   = useState(blank);
  const refresh = () => setItems(forfaitDB.all());

  const save = () => {
    if (!form.name||!form.price) { toast("Fill required fields","error"); return; }
    if (sel) { forfaitDB.update(sel.id, form); toast("Forfait updated!"); }
    else { forfaitDB.add({...form, id:"f"+uid(), price:Number(form.price), pct:Number(form.pct)}); toast("Forfait created!"); }
    refresh(); setModal(false); setForm(blank); setSel(null);
  };

  return (
    <div className="page-anim">
      <div className="page-header">
        <div><h1 className="page-title">Forfaits</h1><p className="page-sub">Subscription plans & commission rates</p></div>
        <button className="btn-primary" onClick={()=>{setForm(blank);setSel(null);setModal(true);}}>+ Add Forfait</button>
      </div>

      <div className="doctors-grid">
        {items.map(f=>(
          <div key={f.id} className="doctor-card" style={{borderTop:`4px solid #7c3aed`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
              <div style={{fontFamily:"'Sora',sans-serif",fontWeight:800,fontSize:18}}>{f.name}</div>
              <Badge label={`${f.pct}% cut`} color="#7c3aed"/>
            </div>
            <div style={{fontFamily:"'Sora',sans-serif",fontWeight:700,fontSize:26,color:"#7c3aed",marginBottom:8}}>{f.price.toLocaleString()} XAF</div>
            <div style={{fontSize:13,color:"var(--muted)",marginBottom:14}}>{f.description}</div>
            <div style={{display:"flex",gap:8}}>
              <button className="ghost-btn" onClick={()=>{setSel(f);setForm({...f});setModal(true);}}>✏️ Edit</button>
              <button className="ghost-btn" style={{color:"var(--red)"}} onClick={()=>{forfaitDB.delete(f.id);refresh();}}>🗑 Delete</button>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <Modal title={sel?"Edit Forfait":"New Forfait"} onClose={()=>setModal(false)}>
          <FRow label="Plan Name*"><input style={inp} value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/></FRow>
          <FRow label="Price (XAF)*"><input style={inp} type="number" value={form.price} onChange={e=>setForm(f=>({...f,price:e.target.value}))}/></FRow>
          <FRow label="Admin Commission %">
            <input style={inp} type="number" min={0} max={100} value={form.pct} onChange={e=>setForm(f=>({...f,pct:e.target.value}))}/>
          </FRow>
          <FRow label="Description">
            <textarea style={{...inp,height:80,resize:"vertical"}} value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}/>
          </FRow>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
            <button className="ghost-btn" onClick={()=>setModal(false)}>Cancel</button>
            <button className="btn-primary" onClick={save}>Save</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SETTINGS
═══════════════════════════════════════════════════════════════ */
function AdminSettings({ toast }) {
  const [clinicName, setCN] = useState(STORAGE.get("adm_clinic_name","STECH Dental"));
  const [currency,   setCur] = useState(STORAGE.get("adm_currency","XAF"));
  const [commPct,   setCP]  = useState(STORAGE.get("adm_commission_pct",COMMISSION_PCT));

  const save = () => {
    STORAGE.set("adm_clinic_name",clinicName);
    STORAGE.set("adm_currency",currency);
    STORAGE.set("adm_commission_pct",Number(commPct));
    toast("Settings saved!");
  };

  return (
    <div className="page-anim">
      <div className="page-header"><div><h1 className="page-title">Settings</h1><p className="page-sub">System configuration</p></div></div>
      <div className="card" style={{maxWidth:560}}>
        <div className="card-title" style={{marginBottom:18}}>Clinic Settings</div>
        <FRow label="Clinic Name"><input style={inp} value={clinicName} onChange={e=>setCN(e.target.value)}/></FRow>
        <FRow label="Default Currency">
          <select style={inp} value={currency} onChange={e=>setCur(e.target.value)}>
            <option value="XAF">XAF — CFA Franc</option>
            <option value="USD">USD — Dollar</option>
            <option value="EUR">EUR — Euro</option>
          </select>
        </FRow>
        <FRow label="Admin Commission % (default)">
          <input style={inp} type="number" min={0} max={100} value={commPct} onChange={e=>setCP(e.target.value)}/>
        </FRow>
        <button className="btn-primary" style={{marginTop:8}} onClick={save}>Save Settings</button>

        <div style={{borderTop:"1px solid var(--border)",marginTop:24,paddingTop:20}}>
          <div style={{fontWeight:700,color:"var(--red)",marginBottom:12}}>Danger Zone</div>
          <button style={{background:"#fdecea",color:"var(--red)",border:"none",borderRadius:9,padding:"9px 18px",cursor:"pointer",fontWeight:700,fontSize:13}}
            onClick={()=>{ if(window.confirm("Reset ALL data? This cannot be undone.")) { localStorage.clear(); window.location.reload(); } }}>
            🗑 Reset All Data
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PROFILE
═══════════════════════════════════════════════════════════════ */
function AdminProfile({ toast }) {
  const [form, setForm] = useState({ name:"Admin", email:"admin@stech.cm", phone:"+237 6XX XXX 000" });
  const [pwForm, setPwForm] = useState({ old:"", newPw:"", confirm:"" });

  return (
    <div className="page-anim">
      <div className="page-header"><div><h1 className="page-title">My Profile</h1></div></div>
      <div className="two-col">
        <div className="card">
          <div style={{textAlign:"center",marginBottom:20}}>
            <Av name={form.name} size={80}/>
            <h3 style={{marginTop:12,fontFamily:"'Sora',sans-serif"}}>{form.name}</h3>
            <p style={{color:"var(--muted)"}}>Platform Administrator</p>
          </div>
          <div style={{borderTop:"1px solid var(--border)",paddingTop:18,display:"flex",flexDirection:"column",gap:14}}>
            <FRow label="Full Name"><input style={inp} value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/></FRow>
            <FRow label="Email"><input style={inp} type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))}/></FRow>
            <FRow label="Phone"><input style={inp} value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))}/></FRow>
            <button className="btn-primary" onClick={()=>toast("Profile saved!")}>Save Changes</button>
          </div>
        </div>
        <div className="card">
          <div className="card-title" style={{marginBottom:16}}>Change Password</div>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <FRow label="Current Password"><input style={inp} type="password" value={pwForm.old} onChange={e=>setPwForm(f=>({...f,old:e.target.value}))}/></FRow>
            <FRow label="New Password"><input style={inp} type="password" value={pwForm.newPw} onChange={e=>setPwForm(f=>({...f,newPw:e.target.value}))}/></FRow>
            <FRow label="Confirm New"><input style={inp} type="password" value={pwForm.confirm} onChange={e=>setPwForm(f=>({...f,confirm:e.target.value}))}/></FRow>
            <button className="btn-primary" style={{background:"#0d1b3e"}} onClick={()=>{
              if(pwForm.newPw!==pwForm.confirm){ toast("Passwords don't match","error"); return; }
              if(pwForm.newPw.length<6){ toast("Password too short","error"); return; }
              toast("Password updated!"); setPwForm({old:"",newPw:"",confirm:""});
            }}>Update Password</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CSS
═══════════════════════════════════════════════════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap');

:root {
  --bg: #f0f4f9;
  --card: #ffffff;
  --border: #e2e8f0;
  --text: #0f172a;
  --muted: #64748b;
  --red: #ef4444;
  --blue: #1e88e5;
  --sidebar-w: 240px;
}
* { box-sizing: border-box; margin: 0; padding: 0; }

/* SIDEBAR */
.sidebar {
  width: var(--sidebar-w);
  background: linear-gradient(180deg, #0d1b3e 0%, #112356 100%);
  display: flex;
  flex-direction: column;
  height: 100vh;
  flex-shrink: 0;
  overflow-y: auto;
  transition: transform .28s cubic-bezier(.4,0,.2,1);
  position: relative;
  z-index: 200;
}
.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 24px 18px 20px;
  border-bottom: 1px solid rgba(255,255,255,.08);
  flex-shrink: 0;
}
.brand-orb {
  width: 38px; height: 38px;
  background: linear-gradient(135deg, #1e88e5, #42a5f5);
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  font-family: 'Sora',sans-serif; font-weight: 800; color: #fff; font-size: 18px;
  box-shadow: 0 4px 16px rgba(30,136,229,.4);
}
.sidebar-nav { flex: 1; padding: 10px 0; overflow-y: auto; }
.nav-section {
  font-size: 10px; font-weight: 700; letter-spacing: 1.5px;
  text-transform: uppercase; color: rgba(255,255,255,.3);
  padding: 14px 20px 6px;
}
.nav-item {
  display: flex; align-items: center; gap: 10px;
  width: 100%; padding: 10px 20px;
  background: none; border: none; cursor: pointer;
  color: rgba(255,255,255,.65); font-size: 14px; font-family: inherit;
  text-align: left; border-radius: 0; transition: background .2s, color .2s;
  position: relative;
}
.nav-item:hover { background: rgba(255,255,255,.06); color: #fff; }
.nav-item.active {
  background: rgba(30,136,229,.2);
  color: #fff;
  border-right: 3px solid #42a5f5;
}
.nav-icon { font-size: 16px; width: 20px; text-align: center; }
.nav-badge {
  margin-left: auto;
  background: #f44336; color: #fff; border-radius: 99px;
  font-size: 10px; font-weight: 700; padding: 1px 6px;
}
.logout-btn {
  display: flex; align-items: center; gap: 10px;
  width: 100%; padding: 16px 20px;
  background: none; border: none; cursor: pointer;
  color: rgba(255,255,255,.5); font-size: 14px; font-family: inherit;
  border-top: 1px solid rgba(255,255,255,.08);
  transition: color .2s, background .2s;
}
.logout-btn:hover { background: rgba(244,67,54,.15); color: #ff6b6b; }

/* MAIN */
.main-wrap { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
.topbar {
  height: 60px; background: var(--card);
  border-bottom: 1px solid var(--border);
  display: flex; align-items: center; gap: 8px; padding: 0 20px;
  flex-shrink: 0; box-shadow: 0 1px 4px rgba(0,0,0,.06);
}
.hamburger {
  display: none; background: none; border: none; cursor: pointer;
  font-size: 20px; color: var(--text);
}
.topbar-icon {
  position: relative; background: var(--bg); border: 1px solid var(--border);
  border-radius: 8px; width: 36px; height: 36px; cursor: pointer; font-size: 16px;
  display: flex; align-items: center; justify-content: center;
}
.top-badge {
  position: absolute; top: -4px; right: -4px;
  background: #f44336; color: #fff; border-radius: 99px;
  font-size: 9px; font-weight: 800; padding: 1px 4px; line-height: 1.2;
}
.content-scroll { flex: 1; overflow-y: auto; padding: 24px; }

/* PAGE */
.page-anim { animation: fadeUp .35s ease; }
@keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
@keyframes slideUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }

.page-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  gap: 16px; margin-bottom: 24px; flex-wrap: wrap;
}
.page-title { font-family: 'Sora',sans-serif; font-weight: 800; font-size: 26px; color: var(--text); }
.page-sub { font-size: 13px; color: var(--muted); margin-top: 3px; }

/* STATS */
.stats-row {
  display: grid; grid-template-columns: repeat(4, 1fr);
  gap: 16px; margin-bottom: 24px;
}
.stat-card {
  background: var(--card); border: 1px solid var(--border); border-radius: 16px;
  padding: 18px; display: flex; align-items: center; gap: 14;
  border-left: 4px solid var(--accent, #1e88e5);
  transition: transform .2s, box-shadow .2s;
}
.stat-card:hover { transform: translateY(-2px); box-shadow: 0 6px 24px rgba(0,0,0,.08); }
.stat-icon-wrap { font-size: 26px; width: 52px; height: 52px; border-radius: 14px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.stat-label { font-size: 12px; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: .6px; }
.stat-value { font-family: 'Sora',sans-serif; font-weight: 800; font-size: 24px; color: var(--text); margin: 2px 0; }
.stat-trend { font-size: 12px; color: var(--muted); }

/* CARDS */
.card {
  background: var(--card); border: 1px solid var(--border);
  border-radius: 16px; padding: 20px;
}
.card-head {
  display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;
}
.card-title { font-family: 'Sora',sans-serif; font-weight: 700; font-size: 15px; }
.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.stack { display: flex; flex-direction: column; gap: 16px; }

/* TABLE */
.tbl-wrap { overflow-x: auto; margin-top: 12px; }
.s-table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
.s-table th {
  text-align: left; padding: 10px 12px;
  border-bottom: 2px solid var(--border);
  font-size: 11px; font-weight: 700; color: var(--muted);
  text-transform: uppercase; letter-spacing: .6px;
  white-space: nowrap;
}
.s-table td { padding: 12px; border-bottom: 1px solid var(--border); vertical-align: middle; }
.s-table tr:last-child td { border-bottom: none; }
.s-table tr:hover td { background: #f8fafc; }

/* BUTTONS */
.btn-primary {
  background: linear-gradient(135deg, #1e88e5, #42a5f5);
  color: #fff; border: none; border-radius: 10px;
  padding: 10px 20px; font-size: 14px; font-weight: 700;
  cursor: pointer; font-family: inherit;
  transition: opacity .2s, transform .15s;
  white-space: nowrap;
}
.btn-primary:hover { opacity: .88; transform: translateY(-1px); }
.ghost-btn {
  background: var(--bg); border: 1px solid var(--border);
  border-radius: 8px; padding: 6px 12px; font-size: 12px;
  font-weight: 600; cursor: pointer; color: var(--text);
  font-family: inherit; transition: background .2s;
  white-space: nowrap;
}
.ghost-btn:hover { background: #e2e8f0; }
.green-btn { color: #22c55e !important; border-color: #22c55e44 !important; background: #f0fdf4 !important; }

/* FILTERS */
.filter-bar { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; margin-bottom: 12px; }
.filter-tabs { display: flex; gap: 4px; flex-wrap: wrap; }
.filter-tab {
  background: var(--bg); border: 1px solid var(--border); border-radius: 8px;
  padding: 6px 12px; font-size: 13px; font-weight: 600; cursor: pointer;
  color: var(--muted); font-family: inherit; transition: all .2s;
}
.filter-tab.active { background: #1e88e5; color: #fff; border-color: #1e88e5; }
.f-count { margin-left: 5px; background: rgba(0,0,0,.12); border-radius: 99px;
  padding: 1px 6px; font-size: 11px; }
.filter-tab.active .f-count { background: rgba(255,255,255,.2); }

/* SEARCH */
.search-inp {
  background: var(--bg); border: 1.5px solid var(--border); border-radius: 10px;
  padding: 10px 14px; font-size: 14px; color: var(--text);
  width: 100%; max-width: 340px; outline: none; font-family: inherit;
  transition: border-color .2s; margin-bottom: 8px;
}
.search-inp:focus { border-color: #1e88e5; }

/* DOCTORS GRID */
.doctors-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
.doctor-card {
  background: var(--card); border: 1px solid var(--border); border-radius: 16px;
  padding: 20px; transition: box-shadow .2s, transform .2s;
}
.doctor-card:hover { box-shadow: 0 8px 32px rgba(0,0,0,.1); transform: translateY(-2px); }

/* QUICK ACTIONS */
.quick-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 8px; }
.quick-btn {
  background: color-mix(in srgb, var(--qc, #1e88e5) 10%, white);
  border: 1px solid color-mix(in srgb, var(--qc, #1e88e5) 25%, transparent);
  border-radius: 12px; padding: 12px 8px;
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  cursor: pointer; color: var(--qc, #1e88e5); font-family: inherit;
  transition: transform .15s, box-shadow .15s;
}
.quick-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,.1); }

/* MESSAGES */
.msg-item {
  display: flex; align-items: flex-start; gap: 12px;
  padding: 14px 0; border-bottom: 1px solid var(--border);
  cursor: pointer; transition: background .15s;
}
.msg-item:last-child { border-bottom: none; }
.msg-item:hover { background: #f8fafc; border-radius: 8px; padding-left: 8px; }

/* NOTIFICATIONS */
.notif-item {
  display: flex; align-items: flex-start; gap: 14px;
  padding: 14px 0; border-bottom: 1px solid var(--border);
}
.notif-item:last-child { border-bottom: none; }
.notif-item.unread { background: #f0f7ff; border-radius: 10px; padding: 14px; margin-bottom: 4px; }

/* EMPTY STATE */
.empty-state { text-align: center; padding: 48px; color: var(--muted); }
.empty-state p { margin-top: 12px; font-size: 14px; }

/* OVERLAY */
.overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,.45); z-index: 100; }

/* HIDE-SM */
@media (max-width: 960px) {
  .stats-row { grid-template-columns: 1fr 1fr; }
  .two-col { grid-template-columns: 1fr; }
  .hide-sm { display: none; }
}

@media (max-width: 640px) {
  .sidebar { position: fixed; left: 0; top: 0; transform: translateX(-100%); height: 100vh; z-index: 300; }
  .sidebar.open { transform: translateX(0); }
  .overlay { display: block; }
  .hamburger { display: flex !important; align-items: center; }
  .stats-row { grid-template-columns: 1fr; }
  .content-scroll { padding: 14px; }
  .doctors-grid { grid-template-columns: 1fr; }
  .quick-grid { grid-template-columns: repeat(2,1fr); }
}
`;
