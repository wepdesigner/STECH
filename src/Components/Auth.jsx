import { useState, useEffect, useCallback } from "react";
import Login    from "./Login";
import Register from "./Register";
import AdminPanel   from "../Pages/Admin/AdminPanel";
import DoctorPanel  from "../Pages/Doctor/DoctorPanel";
import { lazy, Suspense } from "react";
import "../Pages/Styles/Login.css"
// const AdminPanel  = lazy(() => import("../Pages/Admin/AdminPanel"));
// const DoctorPanel = lazy(() => import("../Pages/Doctor/DoctorPanel"));


const LS = {
  get: (k, d = null) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set: (k, v)        => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  del: (k)           => { try { localStorage.removeItem(k); } catch {} },
};

const SESSION_KEY = "stech_session";   // ← persisted login session

/* ── Restore a previously saved session ── */
function loadSession() {
  const s = LS.get(SESSION_KEY);
  if (!s || !s.id || !s.role) return null;


  const email = s.email?.toLowerCase();
  if (!email) return null;

  // Admin
  const admins = LS.get("adm_admins", []) || [];
  const admin  = admins.find(a => a.id === s.id && a.status !== "deleted");
  if (admin && s.role === "admin") return s;

  // Doctor
  const doctors = _dedupe([
    ...(LS.get("adm_doctors", []) || []),
    ...(LS.get("te_doctors",  []) || []),
  ]);
  const doc = doctors.find(d => d.id === s.id && d.status !== "deleted" && d.status !== "inactive");
  if (doc && s.role === "doctor") return s;

  // Patient
  const patients = _dedupe([
    ...(LS.get("te_patients",  []) || []),
    ...(LS.get("adm_patients", []) || []),
  ]);
  const patient = patients.find(p => p.id === s.id && p.status !== "deleted" && p.status !== "inactive");
  if (patient && s.role === "patient") return s;

  // Session no longer valid — wipe it
  LS.del(SESSION_KEY);
  return null;
}

function _dedupe(arr) {
  const seen = new Set();
  return (arr || []).filter(x => {
    if (!x?.id || seen.has(x.id)) return false;
    seen.add(x.id); return true;
  });
}

/* ═══════════════════════════════════════════════════════════════
   LOADING SPINNER  (shown while lazy chunks load)
═══════════════════════════════════════════════════════════════ */
function PageLoader({ message = "Loading…" }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", height: "100vh",
      background: "linear-gradient(135deg,#061529 0%,#0d2347 100%)",
      fontFamily: "'DM Sans',system-ui,sans-serif",
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: "50%",
        border: "4px solid rgba(255,255,255,.15)",
        borderTopColor: "#00bfa5",
        animation: "spin .8s linear infinite",
        marginBottom: 20,
      }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <p style={{ color: "rgba(255,255,255,.5)", fontSize: 14, fontWeight: 600 }}>{message}</p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ROOT APP
═══════════════════════════════════════════════════════════════ */
export default function Auth() {
  // "view" can be:  "login" | "register" | "dashboard"
  const [view,    setView]    = useState("loading");
  const [user,    setUser]    = useState(null);
  const [toast,   setToast]   = useState(null);

  /* ── On mount: try to restore a saved session ── */
  useEffect(() => {
    const session = loadSession();
    if (session) {
      setUser(session);
      setView("dashboard");
    } else {
      setView("login");
    }
  }, []);

  /* ── Called by Login.jsx after successful authentication ── */
  const handleLogin = useCallback((loggedInUser) => {
    if (!loggedInUser?.role) {
      console.error("handleLogin: user object is missing 'role'", loggedInUser);
      return;
    }
    // Persist session so page-refresh keeps user logged in
    LS.set(SESSION_KEY, loggedInUser);
    setUser(loggedInUser);
    setView("dashboard");
    showToast(`Welcome back, ${loggedInUser.name?.split(" ")[0] || ""}! 👋`);
  }, []);

  /* ── Called by Register.jsx after successful registration ── */
  const handleRegistered = useCallback((newPatient) => {
    // New patients always land on the patient dashboard
    const patientUser = { ...newPatient, role: "patient" };
    LS.set(SESSION_KEY, patientUser);
    setUser(patientUser);
    setView("dashboard");
    showToast(`Welcome, ${newPatient.name?.split(" ")[0]}! 🎉`);
  }, []);

  /* ── Logout: clear session and return to login ── */
  const handleLogout = useCallback(() => {
    LS.del(SESSION_KEY);
    setUser(null);
    setView("login");
    showToast("You've been signed out.", "info");
  }, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3800);
  };

  /* ── Initial load ── */
  if (view === "loading") return <PageLoader message="Restoring session…" />;

  return (
    <>
      {/* ── AUTH SCREENS ── */}
      {view === "login" && (
        <Login
          onLogin={handleLogin}
          onGoRegister={() => setView("register")}
        />
      )}

      {view === "register" && (
        <Register
          onRegistered={handleRegistered}
          onGoLogin={() => setView("login")}
        />
      )}

      {/* ── DASHBOARDS ── */}
      {view === "dashboard" && user && (
        <Suspense fallback={<PageLoader message="Loading your dashboard…" />}>
          <DashboardRouter
            user={user}
            onLogout={handleLogout}
            showToast={showToast}
          />
        </Suspense>
      )}

      {/* ── GLOBAL TOAST ── */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 99999,
          display: "flex", alignItems: "center", gap: 10,
          padding: "13px 20px", borderRadius: 12, color: "#fff",
          fontFamily: "'DM Sans',system-ui,sans-serif",
          fontSize: 14, fontWeight: 700,
          background: toast.type === "error"  ? "#ef4444"
                    : toast.type === "info"   ? "#1e88e5"
                    : "#16a34a",
          boxShadow: "0 10px 36px rgba(0,0,0,.22)",
          animation: "fadeUp .3s ease",
        }}>
          <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>
          <span>{toast.type === "success" ? "✓" : toast.type === "info" ? "ℹ" : "✕"}</span>
          {toast.msg}
        </div>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   DASHBOARD ROUTER
   Picks the right panel based on user.role
═══════════════════════════════════════════════════════════════ */
function DashboardRouter({ user, onLogout, showToast }) {
  switch (user.role) {
    case "admin":
      return <AdminPanel onLogout={onLogout} />;

    case "doctor":
      return <DoctorPanel doctorId={user.id} onLogout={onLogout} />;

    case "patient":
      // The patient dashboard lives inside Register.jsx as <Dashboard>
      // We render it directly here, passing the full user object
      return (
        <PatientDashboardWrapper
          patient={user}
          onLogout={onLogout}
          showToast={showToast}
        />
      );

    default:
      return (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", height: "100vh",
          fontFamily: "'DM Sans',system-ui,sans-serif",
          gap: 16, color: "#64748b",
        }}>
          <div style={{ fontSize: 48 }}>⚠️</div>
          <h2 style={{ fontFamily: "'DM Sans',sans-serif", color: "#0f172a" }}>Unknown role: "{user.role}"</h2>
          <p>Your account has an unrecognised role. Please contact admin.</p>
          <button
            onClick={onLogout}
            style={{
              background: "#0d1b3e", color: "#fff", border: "none",
              borderRadius: 10, padding: "10px 24px", cursor: "pointer",
              fontFamily: "inherit", fontWeight: 700,
            }}
          >
            Sign Out
          </button>
        </div>
      );
  }
}

/* ═══════════════════════════════════════════════════════════════
   PATIENT DASHBOARD WRAPPER
   Reads the freshest patient record from localStorage so that
   any profile updates made since registration are reflected.
═══════════════════════════════════════════════════════════════ */
function PatientDashboardWrapper({ patient: sessionUser, onLogout, showToast }) {
  const [patient, setPatient] = useState(() => {
    // Try to load the freshest version from storage
    const all = _dedupe([
      ...(LS.get("te_patients",  []) || []),
      ...(LS.get("adm_patients", []) || []),
    ]);
    return all.find(p => p.id === sessionUser.id) || sessionUser;
  });

  // When patient updates their profile, also update the session
  const handleSetPatient = useCallback((updated) => {
    setPatient(updated);
    LS.set(SESSION_KEY, { ...updated, role: "patient" });
  }, []);

  // Keep the Register.jsx Dashboard component happy by importing it inline.
  // Since Dashboard is not exported separately from Register.jsx, we
  // re-implement a minimal shell here that renders the same Dashboard
  // component from Register.jsx by passing user state down.
  //
  // IMPORTANT: Export `Dashboard` as a NAMED export from Register.jsx:
  //   export function Dashboard({ patient, onLogout, showToast, setPatient }) { … }
  //
  // If you haven't done that yet, the DynamicDashboard below will handle it.

  return (
    <DynamicPatientDashboard
      patient={patient}
      setPatient={handleSetPatient}
      onLogout={onLogout}
      showToast={showToast}
    />
  );
}

/* ── Dynamic patient dashboard ──
   Tries to import the named Dashboard export from Register.jsx.
   Falls back to a built-in mini-dashboard if that export doesn't exist.
── */
function DynamicPatientDashboard({ patient, setPatient, onLogout, showToast }) {
  const [DashComp, setDashComp] = useState(null);
  const [error,    setError]    = useState(false);

  useEffect(() => {
    // Try to load the exported Dashboard from Register.jsx
    import("./Register")
      .then(mod => {
        if (mod.Dashboard) {
          setDashComp(() => mod.Dashboard);
        } else {
          // Register.jsx doesn't export Dashboard separately — use fallback
          setError(true);
        }
      })
      .catch(() => setError(true));
  }, []);

  if (!DashComp && !error) return <PageLoader message="Loading your dashboard…" />;

  if (DashComp) {
    return (
      <DashComp
        patient={patient}
        onLogout={onLogout}
        showToast={showToast}
        setPatient={setPatient}
      />
    );
  }

  // ── FALLBACK: built-in patient dashboard ──
  return (
    <FallbackPatientDashboard
      patient={patient}
      setPatient={setPatient}
      onLogout={onLogout}
      showToast={showToast}
    />
  );
}

/* ─────────────────────────────────────────────────────────────
   FALLBACK PATIENT DASHBOARD
   Shown only if Dashboard is not exported from Register.jsx.
   Add `export function Dashboard(…)` to Register.jsx to replace this.
───────────────────────────────────────────────────────────────*/
const LS2 = LS; // alias

function FallbackPatientDashboard({ patient, setPatient, onLogout, showToast }) {
  const [tab, setTab] = useState("home");

  const appts   = (LS2.get("te_appointments", []) || []).filter(a => a.patientId === patient.id);
  const doctors = _dedupe([
    ...(LS2.get("te_doctors",  []) || []),
    ...(LS2.get("adm_doctors", []) || []),
  ]).filter(d => d.status === "active");
  const prefDoc = doctors.find(d => d.id === patient.preferredDoctorId);

  const NAV = [
    { key:"home",         icon:"⊞",  label:"Dashboard"        },
    { key:"book",         icon:"📅",  label:"Book Appointment" },
    { key:"appointments", icon:"📋",  label:"My Appointments"  },
    { key:"profile",      icon:"👤",  label:"My Profile"       },
  ];

  return (
    <div style={{ display:"flex", height:"100vh", overflow:"hidden", fontFamily:"'DM Sans',system-ui,sans-serif", color:"#0f172a", background:"#f4f7fb" }}>
      {/* Sidebar */}
      <aside style={{ width:220, background:"linear-gradient(180deg,#061529,#0a2d5c)", display:"flex", flexDirection:"column", height:"100vh", flexShrink:0 }}>
        <div style={{ padding:"20px 16px", borderBottom:"1px solid rgba(255,255,255,.08)", display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:"linear-gradient(135deg,#00bfa5,#26c6da)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>🦷</div>
          <div>
            <div style={{ fontWeight:700, color:"#fff", fontSize:13 }}>ToothEase</div>
            <div style={{ fontSize:9, color:"rgba(255,255,255,.4)", letterSpacing:1.5, textTransform:"uppercase" }}>Patient Portal</div>
          </div>
        </div>

        <div style={{ padding:"12px 16px", borderBottom:"1px solid rgba(255,255,255,.08)", display:"flex", alignItems:"center", gap:10, background:"rgba(255,255,255,.04)" }}>
          <MiniAvatar name={patient.name} size={38}/>
          <div>
            <div style={{ color:"#fff", fontWeight:600, fontSize:13, maxWidth:130, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{patient.name}</div>
            <div style={{ fontSize:10, color:"rgba(255,255,255,.4)" }}>{patient.forfait || "Patient"}</div>
          </div>
        </div>

        <nav style={{ flex:1, padding:"8px 0" }}>
          {NAV.map(n => (
            <button key={n.key}
              onClick={() => setTab(n.key)}
              style={{ display:"flex", alignItems:"center", gap:10, width:"100%", padding:"10px 18px", background:tab===n.key?"rgba(0,191,165,.18)":"none", border:"none", borderRight:tab===n.key?"3px solid #00bfa5":"3px solid transparent", cursor:"pointer", color:tab===n.key?"#fff":"rgba(255,255,255,.55)", fontSize:13.5, fontFamily:"inherit", textAlign:"left", transition:"all .2s" }}>
              <span>{n.icon}</span><span>{n.label}</span>
            </button>
          ))}
        </nav>

        <button onClick={onLogout}
          style={{ display:"flex", alignItems:"center", gap:10, width:"100%", padding:"14px 18px", background:"none", border:"none", borderTop:"1px solid rgba(255,255,255,.08)", cursor:"pointer", color:"rgba(255,255,255,.45)", fontSize:13, fontFamily:"inherit", transition:"all .2s" }}>
          🚪 Sign Out
        </button>
      </aside>

      {/* Main */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        {/* Topbar */}
        <header style={{ height:62, background:"#fff", borderBottom:"1px solid #e2e8f0", display:"flex", alignItems:"center", padding:"0 24px", gap:12, boxShadow:"0 1px 6px rgba(0,0,0,.04)", flexShrink:0 }}>
          <span style={{ flex:1, fontWeight:700, fontSize:15, color:"#0f172a" }}>{NAV.find(n=>n.key===tab)?.label}</span>
          <MiniAvatar name={patient.name} size={32}/>
          <span style={{ fontSize:13, fontWeight:600 }}>{patient.name.split(" ")[0]}</span>
          <button onClick={onLogout} style={{ background:"rgba(239,68,68,.08)", border:"1px solid rgba(239,68,68,.2)", color:"#ef4444", borderRadius:8, padding:"6px 14px", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
            🚪 Logout
          </button>
        </header>

        <main style={{ flex:1, overflowY:"auto", padding:24 }}>
          {tab === "home"         && <FBHome    patient={patient} appts={appts} prefDoc={prefDoc} doctors={doctors} setTab={setTab}/>}
          {tab === "book"         && <FBBook    patient={patient} doctors={doctors} showToast={showToast} setTab={setTab}/>}
          {tab === "appointments" && <FBAppts   appts={appts}/>}
          {tab === "profile"      && <FBProfile patient={patient} setPatient={setPatient} showToast={showToast} onLogout={onLogout}/>}
        </main>
      </div>
    </div>
  );
}

/* ── Mini avatar ── */
function MiniAvatar({ name="?", size=36 }) {
  const COLORS = ["#1e88e5","#00bfa5","#7c3aed","#f44336","#ff7043","#0891b2"];
  const bg = COLORS[(name.charCodeAt(0)||0) % COLORS.length];
  const ini = name.split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2);
  return (
    <div style={{ width:size, height:size, borderRadius:"50%", background:bg, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:size*.36, flexShrink:0, fontFamily:"'DM Sans',sans-serif" }}>
      {ini}
    </div>
  );
}

/* ── Fallback Home ── */
function FBHome({ patient, appts, prefDoc, doctors, setTab }) {
  const h = new Date().getHours();
  const g = h<12?"morning":h<18?"afternoon":"evening";
  const upcoming = appts.filter(a=>a.status!=="cancelled").sort((a,b)=>a.date.localeCompare(b.date));

  const card = { background:"#fff", border:"1px solid #e2e8f0", borderRadius:14, padding:"1.25rem" };
  const statCard = { ...card, display:"flex", alignItems:"center", gap:12, cursor:"pointer", transition:"all .2s" };

  return (
    <div>
      {/* Welcome bar */}
      <div style={{ background:"linear-gradient(110deg,#061529,#1e88e5)", borderRadius:22, padding:"1.75rem 2rem", marginBottom:20, display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
        <div>
          <h1 style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:800, fontSize:"1.5rem", color:"#fff", marginBottom:4 }}>
            Good {g}, <em style={{ fontStyle:"italic", color:"#90c8ff" }}>{patient.name.split(" ")[0]}</em> 👋
          </h1>
          <p style={{ color:"rgba(255,255,255,.55)", fontSize:".85rem" }}>{new Date().toDateString()} · Your dental health hub</p>
        </div>
        <button onClick={()=>setTab("book")} style={{ background:"#fff", color:"#0d1b3e", border:"none", borderRadius:10, padding:"10px 20px", fontWeight:700, fontSize:".85rem", cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap" }}>
          📅 Book Appointment
        </button>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:14, marginBottom:20 }}>
        {[
          { icon:"📅", lbl:"Appointments",  val:appts.length,                bg:"#dbeafe", c:"#1e88e5", nav:"appointments" },
          { icon:"🦷", lbl:"My Dentist",    val:prefDoc?.name.split(" ").pop()||"—",  bg:"#e0f7f4", c:"#00897b", nav:null },
          { icon:"💎", lbl:"Plan",          val:patient.forfait||"Basic",    bg:"#ede9fe", c:"#7c3aed", nav:null },
          { icon:"⏳", lbl:"Pending",       val:appts.filter(a=>a.status==="pending").length, bg:"#fef3c7", c:"#d97706", nav:"appointments" },
        ].map(s => (
          <div key={s.lbl} style={statCard} onClick={()=>s.nav&&setTab(s.nav)}>
            <div style={{ width:44, height:44, borderRadius:12, background:s.bg, color:s.c, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>{s.icon}</div>
            <div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:800, fontSize:"1.4rem", color:"#0f172a" }}>{s.val}</div>
              <div style={{ fontSize:11, fontWeight:700, color:"#64748b", textTransform:"uppercase", letterSpacing:.5 }}>{s.lbl}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        {/* Upcoming */}
        <div style={card}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
            <span style={{ fontWeight:700, fontSize:15 }}>Upcoming Appointments</span>
            <button onClick={()=>setTab("appointments")} style={{ background:"none", border:"none", color:"#1e88e5", fontWeight:700, cursor:"pointer", fontSize:12 }}>View all →</button>
          </div>
          {upcoming.length===0
            ? <div style={{ textAlign:"center", padding:"2rem", color:"#64748b" }}><div style={{fontSize:32}}>📅</div><p style={{marginTop:8}}>No appointments yet.</p><button onClick={()=>setTab("book")} style={{ marginTop:12, background:"#1e88e5", color:"#fff", border:"none", borderRadius:8, padding:"8px 16px", cursor:"pointer", fontWeight:700, fontFamily:"inherit" }}>Book Now</button></div>
            : upcoming.slice(0,4).map(a => (
              <div key={a.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 0", borderBottom:"1px solid #e2e8f0" }}>
                <div style={{ width:44, height:44, background:"#dbeafe", borderRadius:12, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <strong style={{ fontWeight:800, fontSize:"1rem", color:"#1e88e5", lineHeight:1 }}>{a.date?.split("-")[2]}</strong>
                  <span style={{ fontSize:9, fontWeight:700, color:"#1e88e5", textTransform:"uppercase" }}>{new Date(a.date).toLocaleString("default",{month:"short"})}</span>
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:14 }}>{a.healthType}</div>
                  <div style={{ fontSize:12, color:"#64748b" }}>{a.doctorName} · {a.time}</div>
                </div>
                <span style={{ fontSize:11, fontWeight:700, padding:"3px 8px", borderRadius:6, background:a.status==="confirmed"?"#dcfce7":a.status==="pending"?"#fef3c7":"#fef2f2", color:a.status==="confirmed"?"#16a34a":a.status==="pending"?"#d97706":"#ef4444" }}>{a.status}</span>
              </div>
            ))
          }
        </div>

        {/* Doctors */}
        <div style={card}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
            <span style={{ fontWeight:700, fontSize:15 }}>Our Specialists</span>
            <button onClick={()=>setTab("book")} style={{ background:"none", border:"none", color:"#1e88e5", fontWeight:700, cursor:"pointer", fontSize:12 }}>Book →</button>
          </div>
          {doctors.slice(0,5).map(d => (
            <div key={d.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 0", borderBottom:"1px solid #e2e8f0" }}>
              <MiniAvatar name={d.name} size={36}/>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, fontSize:13 }}>
                  {d.name}
                  {d.id===patient.preferredDoctorId && <span style={{ background:"#e0f7f4", color:"#00897b", fontSize:9, fontWeight:700, padding:"2px 6px", borderRadius:5, marginLeft:6 }}>Primary</span>}
                </div>
                <div style={{ fontSize:11, color:"#64748b" }}>{d.specialty}</div>
              </div>
              <span style={{ color:"#f59e0b", fontWeight:700, fontSize:12 }}>★ {d.rating}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Primary doctor card */}
      {prefDoc && (
        <div style={{ background:"linear-gradient(110deg,#e0f7f4,#dbeafe)", border:"1.5px solid rgba(0,191,165,.3)", borderRadius:16, padding:"1.25rem 1.5rem", marginTop:16, display:"flex", alignItems:"center", gap:16, flexWrap:"wrap" }}>
          <MiniAvatar name={prefDoc.name} size={54}/>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:10, fontWeight:800, color:"#00897b", textTransform:"uppercase", letterSpacing:".06em", marginBottom:4 }}>Your Primary Dentist</div>
            <div style={{ fontWeight:800, fontSize:17 }}>{prefDoc.name}</div>
            <div style={{ fontSize:12, color:"#64748b" }}>{prefDoc.specialty} · {prefDoc.location}</div>
          </div>
          <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
            <button onClick={()=>setTab("book")} style={{ background:"#0d1b3e", color:"#fff", border:"none", borderRadius:9, padding:"9px 18px", fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>Book Appointment</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Fallback Book ── */
const uid2 = () => Math.random().toString(36).slice(2,10);
const nowISO2 = () => new Date().toISOString();
const TYPES = ["Consultation","Root Canal","Scaling & Polishing","Whitening","Wisdom Teeth","Braces Check","Implant","X-Ray","Check-up","Emergency"];
const TIMES2 = ["08:00","08:30","09:00","09:30","10:00","10:30","11:00","11:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00"];

function FBBook({ patient, doctors, showToast, setTab }) {
  const [selDoc, setSel] = useState(doctors.find(d=>d.id===patient.preferredDoctorId)||null);
  const [form,   setForm]= useState({ healthType:"", date:"", time:"", notes:"" });
  const [done,   setDone]= useState(false);
  const [load,   setLoad]= useState(false);
  const [step,   setStep]= useState(1);

  const submit = async () => {
    if(!selDoc||!form.healthType||!form.date||!form.time){showToast("Fill all required fields","error");return;}
    setLoad(true);
    await new Promise(r=>setTimeout(r,800));
    const appt = {
      id:"A"+uid2(), patientId:patient.id, patientName:patient.name,
      doctorId:selDoc.id, doctorName:selDoc.name,
      healthType:form.healthType, date:form.date, time:form.time,
      notes:form.notes, amount:selDoc.consultFee||15000,
      status:"pending", createdAt:nowISO2(),
    };
    // Write to te_appointments (same key Register.jsx + Appointment.jsx use)
    const existing = LS2.get("te_appointments",[]) || [];
    LS2.set("te_appointments",[...existing, appt]);
    // Notify doctor + admin
    const notifs = LS2.get("te_notifs",[]) || [];
    notifs.push({ id:uid2(), toId:selDoc.id, type:"appointment", title:"New Booking", body:`${patient.name} booked ${form.healthType} on ${form.date}`, read:false, createdAt:nowISO2() });
    notifs.push({ id:uid2(), toId:"admin",   type:"appointment", title:"New Appointment", body:`${patient.name} → ${selDoc.name} for ${form.healthType} on ${form.date}`, read:false, createdAt:nowISO2() });
    LS2.set("te_notifs", notifs);
    window.dispatchEvent(new Event("stech_refresh"));
    setLoad(false); setDone(true); showToast("Appointment booked! 🎉");
  };

  const card = { background:"#fff", border:"1px solid #e2e8f0", borderRadius:14, padding:"1.5rem", maxWidth:560, margin:"0 auto" };
  const inp  = { width:"100%", height:44, border:"1.5px solid #e2e8f0", borderRadius:10, padding:"0 14px", fontFamily:"inherit", fontSize:14, color:"#0f172a", outline:"none", boxSizing:"border-box", appearance:"none" };
  const lbl  = { display:"block", fontSize:11, fontWeight:700, color:"#64748b", textTransform:"uppercase", letterSpacing:".05em", marginBottom:5 };

  if(done) return (
    <div style={{ textAlign:"center", padding:"3rem", ...card }}>
      <div style={{ width:70, height:70, borderRadius:"50%", background:"#dcfce7", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.8rem", margin:"0 auto 16px", color:"#16a34a" }}>✓</div>
      <h2 style={{ fontWeight:800, marginBottom:8 }}>Appointment Booked!</h2>
      <p style={{ color:"#64748b", marginBottom:20 }}>Your {form.healthType} with {selDoc?.name} on {form.date} at {form.time} is pending confirmation.</p>
      <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
        <button onClick={()=>{setDone(false);setStep(1);setSel(null);setForm({healthType:"",date:"",time:"",notes:""});}} style={{ background:"#f4f7fb", border:"1px solid #e2e8f0", borderRadius:9, padding:"9px 18px", fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>Book Another</button>
        <button onClick={()=>setTab("appointments")} style={{ background:"#0d1b3e", color:"#fff", border:"none", borderRadius:9, padding:"9px 18px", fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>View Appointments</button>
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ marginBottom:20 }}>
        <h1 style={{ fontWeight:800, fontSize:"1.6rem" }}>Book Appointment</h1>
        <p style={{ color:"#64748b" }}>Schedule with a verified specialist</p>
      </div>

      {step===1 && (
        <div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:12, marginBottom:20 }}>
            {doctors.map(d=>(
              <div key={d.id} onClick={()=>setSel(d)} style={{ background:"#fff", border:`2px solid ${selDoc?.id===d.id?"#1e88e5":"#e2e8f0"}`, borderRadius:14, padding:"1.25rem", cursor:"pointer", position:"relative", transition:"all .2s", textAlign:"center" }}>
                {d.id===patient.preferredDoctorId && <div style={{ position:"absolute", top:-8, left:"50%", transform:"translateX(-50%)", background:"#00bfa5", color:"#fff", fontSize:9, fontWeight:700, padding:"2px 10px", borderRadius:99, whiteSpace:"nowrap" }}>Your Doctor</div>}
                {selDoc?.id===d.id && <div style={{ position:"absolute", top:10, right:10, background:"#1e88e5", color:"#fff", width:20, height:20, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700 }}>✓</div>}
                <MiniAvatar name={d.name} size={46}/>
                <div style={{ fontWeight:700, marginTop:10, fontSize:14 }}>{d.name}</div>
                <div style={{ fontSize:12, color:"#64748b", marginBottom:6 }}>{d.specialty}</div>
                <div style={{ fontWeight:700, color:"#1e88e5", fontSize:13 }}>{(d.consultFee||15000).toLocaleString("fr-CM")} XAF</div>
              </div>
            ))}
          </div>
          <div style={{ display:"flex", justifyContent:"flex-end" }}>
            <button onClick={()=>{if(!selDoc){showToast("Select a doctor","error");return;}setStep(2);}} style={{ background:"#0d1b3e", color:"#fff", border:"none", borderRadius:10, padding:"11px 24px", fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>Continue →</button>
          </div>
        </div>
      )}

      {step===2 && (
        <div style={card}>
          <div style={{ display:"flex", alignItems:"center", gap:12, background:"#f4f7fb", borderRadius:12, padding:"12px 14px", marginBottom:18 }}>
            <MiniAvatar name={selDoc?.name||""} size={40}/>
            <div>
              <div style={{ fontWeight:700 }}>{selDoc?.name}</div>
              <div style={{ fontSize:12, color:"#64748b" }}>{selDoc?.specialty}</div>
            </div>
            <button onClick={()=>setStep(1)} style={{ marginLeft:"auto", background:"none", border:"1px solid #e2e8f0", borderRadius:7, padding:"4px 10px", fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>Change</button>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div><label style={lbl}>Treatment Type *</label><select style={inp} value={form.healthType} onChange={e=>setForm(f=>({...f,healthType:e.target.value}))}><option value="">Select…</option>{TYPES.map(t=><option key={t} value={t}>{t}</option>)}</select></div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <div><label style={lbl}>Date *</label><input style={inp} type="date" min={new Date().toISOString().split("T")[0]} value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/></div>
              <div><label style={lbl}>Time *</label><select style={inp} value={form.time} onChange={e=>setForm(f=>({...f,time:e.target.value}))}><option value="">Select…</option>{TIMES2.map(t=><option key={t} value={t}>{t}</option>)}</select></div>
            </div>
            <div><label style={lbl}>Notes (optional)</label><textarea style={{...inp,height:"auto",padding:"10px 14px",minHeight:80,resize:"vertical"}} rows={3} placeholder="Describe your concern…" value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))}/></div>
          </div>
          <div style={{ display:"flex", gap:10, marginTop:20, justifyContent:"space-between" }}>
            <button onClick={()=>setStep(1)} style={{ background:"#f4f7fb", border:"1px solid #e2e8f0", borderRadius:9, padding:"9px 18px", fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>← Back</button>
            <button onClick={()=>{if(!form.healthType||!form.date||!form.time){showToast("Fill all fields","error");return;}setStep(3);}} style={{ background:"#0d1b3e", color:"#fff", border:"none", borderRadius:10, padding:"11px 24px", fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>Review →</button>
          </div>
        </div>
      )}

      {step===3 && (
        <div style={card}>
          <h3 style={{ fontWeight:800, marginBottom:16 }}>Confirm Booking</h3>
          <div style={{ background:"#f4f7fb", borderRadius:12, padding:"1rem", marginBottom:16 }}>
            {[["Doctor",selDoc?.name],["Treatment",form.healthType],["Date",form.date],["Time",form.time],["Fee",`${(selDoc?.consultFee||15000).toLocaleString("fr-CM")} XAF`],["Notes",form.notes||"—"]].map(([k,v])=>(
              <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px solid #e2e8f0", fontSize:14 }}>
                <span style={{ color:"#64748b", fontWeight:600 }}>{k}</span>
                <strong>{v}</strong>
              </div>
            ))}
          </div>
          <div style={{ display:"flex", gap:10, justifyContent:"space-between" }}>
            <button onClick={()=>setStep(2)} style={{ background:"#f4f7fb", border:"1px solid #e2e8f0", borderRadius:9, padding:"9px 18px", fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>← Back</button>
            <button onClick={submit} disabled={load} style={{ background:"#0d1b3e", color:"#fff", border:"none", borderRadius:10, padding:"11px 24px", fontWeight:700, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", gap:8 }}>
              {load&&<span style={{ width:15, height:15, border:"2px solid rgba(255,255,255,.3)", borderTopColor:"#fff", borderRadius:"50%", animation:"spin .7s linear infinite", display:"inline-block" }}/>}
              {load?"Booking…":"📅 Confirm Booking"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Fallback Appointments ── */
function FBAppts({ appts }) {
  const [filter, setFilter] = useState("all");
  const filtered = filter==="all" ? appts : appts.filter(a=>a.status===filter);
  return (
    <div>
      <div style={{ marginBottom:16 }}>
        <h1 style={{ fontWeight:800, fontSize:"1.6rem" }}>My Appointments</h1>
        <p style={{ color:"#64748b" }}>{appts.length} total</p>
      </div>
      <div style={{ display:"flex", gap:6, marginBottom:16, flexWrap:"wrap" }}>
        {["all","pending","confirmed","cancelled"].map(f=>(
          <button key={f} onClick={()=>setFilter(f)} style={{ background:filter===f?"#1e88e5":"#f4f7fb", color:filter===f?"#fff":"#64748b", border:`1px solid ${filter===f?"#1e88e5":"#e2e8f0"}`, borderRadius:8, padding:"6px 14px", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
            {f.charAt(0).toUpperCase()+f.slice(1)} ({f==="all"?appts.length:appts.filter(a=>a.status===f).length})
          </button>
        ))}
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        {filtered.length===0
          ? <div style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:14, padding:"3rem", textAlign:"center", color:"#64748b" }}><div style={{fontSize:36}}>📅</div><p style={{marginTop:8}}>No appointments found.</p></div>
          : filtered.map(a=>(
            <div key={a.id} style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:14, padding:"1.25rem", display:"flex", alignItems:"center", gap:14, flexWrap:"wrap" }}>
              <div style={{ width:52, height:52, background:"#dbeafe", borderRadius:14, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <strong style={{ fontWeight:800, fontSize:"1rem", color:"#1e88e5", lineHeight:1 }}>{a.date?.split("-")[2]}</strong>
                <span style={{ fontSize:9, fontWeight:700, color:"#1e88e5", textTransform:"uppercase" }}>{new Date(a.date).toLocaleString("default",{month:"short"})}</span>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:800, fontSize:16 }}>{a.healthType}</div>
                <div style={{ fontSize:13, color:"#64748b", marginTop:3 }}>{a.doctorName} · {a.time}</div>
                {a.notes&&<div style={{ fontSize:12, color:"#94a3b8", marginTop:3, fontStyle:"italic" }}>"{a.notes}"</div>}
                <div style={{ fontWeight:700, color:"#1e88e5", marginTop:5 }}>{(a.amount||0).toLocaleString("fr-CM")} XAF</div>
              </div>
              <span style={{ fontSize:12, fontWeight:700, padding:"4px 12px", borderRadius:8, background:a.status==="confirmed"?"#dcfce7":a.status==="pending"?"#fef3c7":"#fef2f2", color:a.status==="confirmed"?"#16a34a":a.status==="pending"?"#d97706":"#ef4444" }}>{a.status}</span>
            </div>
          ))
        }
      </div>
    </div>
  );
}

/* ── Fallback Profile ── */
function FBProfile({ patient, setPatient, showToast, onLogout }) {
  const [form, setForm] = useState({ name:patient.name, email:patient.email, phone:patient.phone||"", dob:patient.dob||"", bloodType:patient.bloodType||"", allergies:patient.allergies||"" });
  const inp = { width:"100%", height:44, border:"1.5px solid #e2e8f0", borderRadius:10, padding:"0 14px", fontFamily:"inherit", fontSize:14, outline:"none", boxSizing:"border-box" };
  const lbl = { display:"block", fontSize:11, fontWeight:700, color:"#64748b", textTransform:"uppercase", letterSpacing:".05em", marginBottom:5 };
  const row = { marginBottom:14 };

  const save = () => {
    // Update in both patient stores
    ["te_patients","adm_patients"].forEach(key=>{
      const rows = LS2.get(key,[]) || [];
      LS2.set(key, rows.map(p=>p.id===patient.id?{...p,...form}:p));
    });
    setPatient({ ...patient, ...form });
    showToast("Profile updated!");
  };

  return (
    <div>
      <div style={{ marginBottom:20 }}><h1 style={{ fontWeight:800, fontSize:"1.6rem" }}>My Profile</h1></div>
      <div style={{ display:"grid", gridTemplateColumns:"240px 1fr", gap:20 }}>
        <div style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:14, padding:"1.5rem", textAlign:"center" }}>
          <MiniAvatar name={patient.name} size={72}/>
          <h3 style={{ fontWeight:800, marginTop:12, fontSize:17 }}>{patient.name}</h3>
          <p style={{ color:"#64748b", fontSize:13 }}>{patient.email}</p>
          <div style={{ display:"flex", gap:6, justifyContent:"center", flexWrap:"wrap", marginTop:12 }}>
            {patient.bloodType&&<span style={{ background:"#fef2f2", color:"#ef4444", fontSize:11, fontWeight:700, padding:"3px 9px", borderRadius:6 }}>{patient.bloodType}</span>}
            {patient.membership&&<span style={{ background:"#ede9fe", color:"#7c3aed", fontSize:11, fontWeight:700, padding:"3px 9px", borderRadius:6 }}>⭐ Premium</span>}
            <span style={{ background:"#dcfce7", color:"#16a34a", fontSize:11, fontWeight:700, padding:"3px 9px", borderRadius:6 }}>{patient.forfait||"Basic"}</span>
          </div>
          <div style={{ borderTop:"1px solid #e2e8f0", marginTop:16, paddingTop:16 }}>
            <button onClick={onLogout} style={{ background:"rgba(239,68,68,.08)", border:"1px solid rgba(239,68,68,.2)", color:"#ef4444", borderRadius:9, padding:"8px 18px", fontWeight:700, cursor:"pointer", fontFamily:"inherit", width:"100%" }}>
              🚪 Sign Out
            </button>
          </div>
        </div>

        <div style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:14, padding:"1.5rem" }}>
          <h3 style={{ fontWeight:800, marginBottom:18 }}>Edit Profile</h3>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
            <div style={row}><label style={lbl}>Full Name</label><input style={inp} value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/></div>
            <div style={row}><label style={lbl}>Phone</label><input style={inp} value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))}/></div>
            <div style={row}><label style={lbl}>Email</label><input style={inp} type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))}/></div>
            <div style={row}><label style={lbl}>Date of Birth</label><input style={inp} type="date" value={form.dob} onChange={e=>setForm(f=>({...f,dob:e.target.value}))}/></div>
            <div style={row}><label style={lbl}>Blood Type</label><select style={inp} value={form.bloodType} onChange={e=>setForm(f=>({...f,bloodType:e.target.value}))}><option value="">Select…</option>{["A+","A-","B+","B-","O+","O-","AB+","AB-"].map(b=><option key={b}>{b}</option>)}</select></div>
            <div style={row}><label style={lbl}>Allergies</label><input style={inp} value={form.allergies} onChange={e=>setForm(f=>({...f,allergies:e.target.value}))} placeholder="e.g. Penicillin or None"/></div>
          </div>
          <button onClick={save} style={{ background:"#0d1b3e", color:"#fff", border:"none", borderRadius:10, padding:"11px 24px", fontWeight:700, cursor:"pointer", fontFamily:"inherit", marginTop:8 }}>Save Changes</button>
        </div>
      </div>
    </div>
  );
}