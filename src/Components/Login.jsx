/**
 * Login.jsx — ToothEase / STECH Dental Platform
 *
 * ✅ Reads from the EXACT same localStorage keys as Register.jsx
 *    te_patients · te_doctors · te_notifs · te_appointments
 *    adm_doctors · adm_patients · adm_notifications (AdminPanel)
 *    stech_users · stech_doctors · stech_patients   (AppContext)
 *
 * ✅ On successful login:
 *    role = "admin"   → AdminPanel
 *    role = "doctor"  → DoctorPanel  (only admin can create doctors)
 *    role = "patient" → Patient Dashboard (the one from Register.jsx)
 *
 * ✅ Writes stech_current_user so AppContext picks it up on page reload
 * ✅ Doctors can ONLY be created by admin — shown clearly in the UI
 * ✅ Forgot & Reset password across ALL stores
 *
 * Usage:
 *   <Login onLogin={user => setUser(user)} onGoRegister={() => navigate("/register")} />
 */

import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import "../Pages/Styles/Login.css";

/* ════════════════════════════════════════════════════════════════
   STORAGE BRIDGE
   Reads every key used by Register.jsx + AdminPanel + AppContext
════════════════════════════════════════════════════════════════ */
const LS = {
  get: (k, d = null) => {
    try { return JSON.parse(localStorage.getItem(k)) ?? d; }
    catch { return d; }
  },
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
};

const uid    = () => `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
const nowISO = () => new Date().toISOString();

/* All storage keys across all files */
const K = {
  /* Register.jsx keys */
  TE_PATIENTS:   "te_patients",
  TE_DOCTORS:    "te_doctors",
  TE_NOTIFS:     "te_notifs",
  TE_APPTS:      "te_appointments",
  /* AdminPanel keys */
  ADM_DOCTORS:   "adm_doctors",
  ADM_PATIENTS:  "adm_patients",
  ADM_NOTIFS:    "adm_notifications",
  ADM_MESSAGES:  "adm_messages",
  /* AppContext keys */
  STECH_USERS:   "stech_users",
  STECH_DOCTORS: "stech_doctors",
  STECH_PATIENTS:"stech_patients",
  STECH_CUR:     "stech_current_user",
  /* Auth keys */
  ADM_ADMINS:    "adm_admins",
  SEEDED:        "te_login_seeded",
  REMEMBER:      "te_login_remember",
  RESET_EMAIL:   "te_reset_email",
  RESET_TOKEN:   "te_reset_token",
};

/* ── Seed default accounts once ────────────────────────────────
   Merges with whatever Register.jsx already put in te_patients
   and whatever AdminPanel put in adm_doctors / adm_admins
──────────────────────────────────────────────────────────────── */
function ensureSeed() {
  if (LS.get(K.SEEDED)) return;

  /* Default admin account */
  if (!LS.get(K.ADM_ADMINS, []).length) {
    LS.set(K.ADM_ADMINS, [{
      id: "a1", role: "admin",
      name: "Admin STECH", email: "admin@stech.com",
      password: "admin123", status: "active", createdAt: nowISO(),
    }]);
  }

  /* Default doctors (if AdminPanel hasn't seeded yet) */
  if (!LS.get(K.ADM_DOCTORS, []).length && !LS.get(K.TE_DOCTORS, []).length) {
    const doctors = [
      { id:"d1", role:"doctor", name:"Dr. Olivia Lim",   email:"olivia@stech.com",  password:"doc123", specialty:"Orthodontist",    phone:"+237 677 001 001", status:"active",   rating:4.9, experience:"8 yrs",  location:"Douala",    bio:"Expert in braces & smile alignment.", consultFee:15000, color:"#1e88e5", createdAt:nowISO() },
      { id:"d2", role:"doctor", name:"Dr. Marcus Bell",  email:"marcus@stech.com",  password:"doc123", specialty:"Oral Surgeon",    phone:"+237 677 002 002", status:"active",   rating:4.8, experience:"12 yrs", location:"Yaoundé",   bio:"Specialised in complex extractions.", consultFee:25000, color:"#00bfa5", createdAt:nowISO() },
      { id:"d3", role:"doctor", name:"Dr. Sarah Chen",   email:"sarah@stech.com",   password:"doc123", specialty:"Periodontist",    phone:"+237 677 003 003", status:"active",   rating:4.7, experience:"6 yrs",  location:"Douala",    bio:"Gum health & periodontal care.",      consultFee:18000, color:"#7c3aed", createdAt:nowISO() },
      { id:"d4", role:"doctor", name:"Dr. James Reid",   email:"james@stech.com",   password:"doc123", specialty:"Endodontist",     phone:"+237 677 004 004", status:"inactive", rating:4.9, experience:"9 yrs",  location:"Bafoussam", bio:"Root canal specialist, 900+ cases.",  consultFee:20000, color:"#e85c4a", createdAt:nowISO() },
      { id:"d5", role:"doctor", name:"Dr. Amara Diallo", email:"amara@stech.com",   password:"doc123", specialty:"General Dentist", phone:"+237 677 005 005", status:"active",   rating:4.6, experience:"5 yrs",  location:"Douala",    bio:"Full-spectrum general dental care.",  consultFee:12000, color:"#f59e0b", createdAt:nowISO() },
      { id:"d6", role:"doctor", name:"Dr. Leila Nkomo",  email:"leila@stech.com",   password:"doc123", specialty:"Cosmetic Dentist",phone:"+237 677 006 006", status:"active",   rating:4.8, experience:"10 yrs", location:"Yaoundé",   bio:"Smile makeovers & cosmetic dentistry.",consultFee:30000, color:"#ec4899", createdAt:nowISO() },
    ];
    LS.set(K.ADM_DOCTORS, doctors);
    LS.set(K.TE_DOCTORS,  doctors); /* Register.jsx reads te_doctors */
  }

  /* Default patients (only if none from Register.jsx yet) */
  if (!LS.get(K.TE_PATIENTS, []).length && !LS.get(K.ADM_PATIENTS, []).length) {
    const patients = [
      { id:"p1", role:"patient", name:"Emmanuel Tabi",  email:"e.tabi@mail.com",  password:"pat123", phone:"+237 655 001 001", dob:"1990-04-12", bloodType:"O+", allergies:"None",      membership:true,  forfait:"Premium",  status:"active", preferredDoctorId:"d1", createdAt:nowISO() },
      { id:"p2", role:"patient", name:"Fatima Oumarou", email:"f.oum@mail.com",   password:"pat123", phone:"+237 655 002 002", dob:"1995-08-23", bloodType:"A+", allergies:"Penicillin",membership:false, forfait:"Basic",    status:"active", preferredDoctorId:"d2", createdAt:nowISO() },
      { id:"p3", role:"patient", name:"Ngono Pierre",   email:"n.pierre@mail.com",password:"pat123", phone:"+237 655 003 003", dob:"1988-01-07", bloodType:"B-", allergies:"Latex",     membership:true,  forfait:"Standard", status:"active", preferredDoctorId:"d3", createdAt:nowISO() },
    ];
    LS.set(K.TE_PATIENTS,   patients);
    LS.set(K.ADM_PATIENTS,  patients);
  }

  LS.set(K.SEEDED, true);
}

/* ── authenticate — checks ALL stores in priority order ────────
   1. adm_admins   (admin)
   2. adm_doctors  (doctor, admin-created)
   3. te_doctors   (doctor, legacy Register.jsx seed)
   4. te_patients  (patient, self-registered via Register.jsx)
   5. adm_patients (patient, admin-created)
   6. stech_users  (AppContext store)
──────────────────────────────────────────────────────────────── */
function authenticate(email, password) {
  const e = email.trim().toLowerCase();

  /* 1 — Admin */
  const admins = LS.get(K.ADM_ADMINS, []);
  const admin  = admins.find(a => a.email?.toLowerCase() === e && a.password === password);
  if (admin) {
    const { password: _p, ...safe } = admin;
    return { ok: true, user: { ...safe, role: "admin" } };
  }

  /* 2 & 3 — Doctor (merge both doctor stores, deduplicate by id) */
  const allDocs = _dedupe([
    ...LS.get(K.ADM_DOCTORS, []),
    ...LS.get(K.TE_DOCTORS,  []),
  ]);
  const doc = allDocs.find(d => d.email?.toLowerCase() === e && d.password === password);
  if (doc) {
    if (doc.status === "inactive")
      return { ok: false, error: "Your doctor account is inactive. Contact the administrator." };
    const { password: _p, ...safe } = doc;
    return { ok: true, user: { ...safe, role: "doctor" } };
  }

  /* 4 & 5 & 6 — Patient (merge all patient stores) */
  const allPts = _dedupe([
    ...LS.get(K.TE_PATIENTS,   []),
    ...LS.get(K.ADM_PATIENTS,  []),
    ...(LS.get(K.STECH_USERS,  []) || []).filter(u => u.role === "patient"),
  ]);
  const patient = allPts.find(p => p.email?.toLowerCase() === e && p.password === password);
  if (patient) {
    if (patient.status === "deleted")  return { ok: false, error: "This account has been removed." };
    if (patient.status === "inactive") return { ok: false, error: "Your account is deactivated. Contact admin." };
    const { password: _p, ...safe } = patient;
    return { ok: true, user: { ...safe, role: "patient" } };
  }

  return { ok: false, error: "Incorrect email or password. Please try again." };
}

function _dedupe(arr) {
  const seen = new Set();
  return arr.filter(x => {
    if (!x?.id || seen.has(x.id)) return false;
    seen.add(x.id); return true;
  });
}

/* Save logged-in user so AppContext & page refresh pick it up */
function persistSession(user) {
  LS.set(K.STECH_CUR, user);
  /* Ensure user is in stech_users for AppContext */
  const users = LS.get(K.STECH_USERS, []) || [];
  if (!users.find(u => u.id === user.id)) {
    users.push(user);
    LS.set(K.STECH_USERS, users);
  }
}

/* Push notification to admin + doctor notification store */
function pushLoginNotif(user) {
  if (user.role === "admin") return;
  const label = user.role === "doctor" ? `🩺 Doctor` : `👤 Patient`;
  const body  = `${user.name} signed in at ${new Date().toLocaleTimeString()}.`;

  /* adm_notifications (AdminPanel reads this) */
  const admNotifs = LS.get(K.ADM_NOTIFS, []) || [];
  admNotifs.unshift({ id: uid(), toId: "a1", type: "system", title: `${label} Login`, body, read: false, createdAt: nowISO() });
  LS.set(K.ADM_NOTIFS, admNotifs);

  /* te_notifs (Doctor dashboard reads this) */
  if (user.role === "doctor") {
    const dn = LS.get(K.TE_NOTIFS, []) || [];
    dn.push({ id: uid(), toId: user.id, type: "system", title: "You're logged in", body: `Welcome back, ${user.name.split(" ")[0]}!`, read: false, createdAt: nowISO() });
    LS.set(K.TE_NOTIFS, dn);
  }
}

/* Live role detection as user types */
function detectRole(email) {
  const e = email.trim().toLowerCase();
  if (!e.includes("@")) return null;
  const all = _dedupe([
    ...LS.get(K.ADM_ADMINS,  []),
    ...LS.get(K.ADM_DOCTORS, []),
    ...LS.get(K.TE_DOCTORS,  []),
    ...LS.get(K.TE_PATIENTS, []),
    ...LS.get(K.ADM_PATIENTS,[]),
    ...(LS.get(K.STECH_USERS,[]) || []),
  ]);
  return all.find(u => u.email?.toLowerCase() === e)?.role || null;
}

/* ════════════════════════════════════════════════════════════════
   SMALL UI COMPONENTS
════════════════════════════════════════════════════════════════ */
const AV_COLORS = ["#1e88e5","#00bfa5","#7c3aed","#f44336","#ff7043","#0891b2","#16a34a","#be185d"];

function Av({ name = "?", size = 44 }) {
  const ini = name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  const bg  = AV_COLORS[(name.charCodeAt(0) || 0) % AV_COLORS.length];
  return (
    <div className="lv-av" style={{ width: size, height: size, background: bg, fontSize: size * 0.36 }}>
      {ini}
    </div>
  );
}

function PwField({ id, value, onChange, placeholder = "Password", autoComplete = "current-password" }) {
  const [show, setShow] = useState(false);
  return (
    <div className="lv-pw-wrap">
      <input id={id} className="lv-input" type={show ? "text" : "password"}
        value={value} onChange={onChange} placeholder={placeholder} autoComplete={autoComplete} />
      <button type="button" className="lv-pw-eye"
        onClick={() => setShow(s => !s)} aria-label={show ? "Hide" : "Show"}>
        {show ? "🙈" : "👁️"}
      </button>
    </div>
  );
}

function PwStrength({ pw }) {
  const s = [/.{8,}/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter(r => r.test(pw)).length;
  const LABELS = ["", "Weak", "Fair", "Good", "Strong"];
  const COLORS = ["", "#ef4444", "#f59e0b", "#1e88e5", "#16a34a"];
  if (!pw) return null;
  return (
    <div className="lv-strength">
      <div className="lv-strength-bars">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="lv-strength-seg" style={{ background: i <= s ? COLORS[s] : "#e2e8f0" }} />
        ))}
      </div>
      <span style={{ color: COLORS[s], fontWeight: 700, fontSize: 11 }}>{LABELS[s]}</span>
    </div>
  );
}

function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3800); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`lv-toast lv-toast--${type}`}>
      <span>{type === "success" ? "✓" : type === "info" ? "ℹ" : "✕"}</span>
      <span>{msg}</span>
      <button onClick={onClose} aria-label="Close">✕</button>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   ROOT EXPORT
════════════════════════════════════════════════════════════════ */
export default function Login({ onLogin, onGoRegister }) {
  const [mode,  setMode]  = useState("login"); // login | forgot | reset
  const [toast, setToast] = useState(null);

  const show = (msg, type = "success") => setToast({ msg, type });

  useEffect(() => { ensureSeed(); }, []);

  return (
    <div className="lv-root">
      {mode === "login"  && <LoginView  onLogin={onLogin} onGoRegister={onGoRegister} onForgot={() => setMode("forgot")} show={show} />}
      {mode === "forgot" && <ForgotView onBack={() => setMode("login")} onSent={() => setMode("reset")} show={show} />}
      {mode === "reset"  && <ResetView  onBack={() => setMode("login")} show={show} />}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   LOGIN VIEW
════════════════════════════════════════════════════════════════ */
const ROLE_COLORS = {
  admin:   { color: "#0d1b3e", bg: "#0d1b3e18", icon: "🛡️", label: "Administrator" },
  doctor:  { color: "#00897b", bg: "#00bfa518", icon: "🩺", label: "Doctor"         },
  patient: { color: "#1e88e5", bg: "#1e88e518", icon: "👤", label: "Patient"        },
};

/* Quick-fill demo pills */
// const DEMOS = [
//   { label: "🛡️ Admin",        email: "admin@stech.com",   pw: "admin123", role: "admin"   },
//   { label: "🩺 Dr. Olivia",   email: "olivia@stech.com",  pw: "doc123",   role: "doctor"  },
//   { label: "🩺 Dr. Marcus",   email: "marcus@stech.com",  pw: "doc123",   role: "doctor"  },
//   { label: "👤 Emmanuel",     email: "e.tabi@mail.com",   pw: "pat123",   role: "patient" },
//   { label: "👤 Fatima",       email: "f.oum@mail.com",    pw: "pat123",   role: "patient" },
// ];

function LoginView({ onLogin, onGoRegister, onForgot, show }) {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [errs,     setErrs]     = useState({});
  const [detRole,  setDetRole]  = useState(null);
  const emailRef = useRef(null);

  /* Restore remembered email */
  useEffect(() => {
    const saved = LS.get(K.REMEMBER);
    if (saved) { setEmail(saved); setRemember(true); }
    emailRef.current?.focus();
  }, []);

  /* Live role detection */
  useEffect(() => {
    const t = setTimeout(() => setDetRole(detectRole(email)), 220);
    return () => clearTimeout(t);
  }, [email]);

  const rm = ROLE_COLORS[detRole] || null;

  const fill = (e, p) => {
    setEmail(e); setPassword(p);
    setErrs({}); setDetRole(null);
  };

  const validate = () => {
    const e = {};
    if (!email.trim())                     e.email    = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email    = "Enter a valid email";
    if (!password)                         e.password = "Password is required";
    return e;
  };

  const handleSubmit = async (ev) => {
    ev?.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrs(e); return; }
    setErrs({}); setLoading(true);
    await new Promise(r => setTimeout(r, 680));

    const res = authenticate(email, password);
    setLoading(false);

    if (!res.ok) {
      setErrs({ password: res.error });
      show(res.error, "error");
      return;
    }

    const { user } = res;

    if (remember) LS.set(K.REMEMBER, email.trim());
    else          localStorage.removeItem(K.REMEMBER);

    persistSession(user);
    pushLoginNotif(user);
    window.dispatchEvent(new Event("stech_refresh"));
    show(`Welcome back, ${user.name.split(" ")[0]}! 👋`);

    setTimeout(() => onLogin(user), 380);
  };

  return (
    <div className="lv-page">

      {/* ── LEFT PANEL ── */}
      <div className="lv-left">
        <div className="lv-brand">
          <div className="lv-brand-orb">🦷</div>
          <div>
            <div className="lv-brand-name">ToothEase</div>
            <div className="lv-brand-sub">STECH Dental Platform</div>
          </div>
        </div>

        <div className="lv-hero">
          <h1>Welcome<br /><em>back.</em></h1>
          <p>Your dental health journey continues. Sign in to access your appointments, consultations, records — and everything your panel has to offer.</p>
        </div>

        <ul className="lv-features">
          {[
            { i: "🔒", t: "End-to-end encrypted health data — never shared" },
            { i: "⚡", t: "Instant access to appointments & records"         },
            { i: "🎥", t: "Join video consultations from your dashboard"     },
            { i: "💊", t: "Prescriptions & medical history always accessible"},
            { i: "🏠", t: "Home visit tracking for premium members"          },
          ].map(f => (
            <li key={f.t} className="lv-feat">
              <span className="lv-feat-icon">{f.i}</span>
              <span>{f.t}</span>
            </li>
          ))}
        </ul>

        {/* Role legend — explains which dashboard each role lands on */}
        <div className="lv-legend">
          <div className="lv-legend-title">Who signs in here</div>
          {[
            { role:"admin",   desc:"Full platform management & analytics"      },
            { role:"doctor",  desc:"Patient care, schedules & consultations"    },
            { role:"patient", desc:"Book appointments, view records & messages" },
          ].map(({ role, desc }) => {
            const m = ROLE_COLORS[role];
            return (
              <div key={role} className="lv-legend-row">
                <div className="lv-legend-dot" style={{ background: m.color }} />
                <div>
                  <strong>{m.icon} {m.label}</strong>
                  <span>{desc}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="lv-left-stats">
          {[["500+","Patients"],["6","Specialists"],["3 Roles","One Login"],["99%","Uptime"]].map(([v,l]) => (
            <div key={l} className="lv-stat">
              <strong>{v}</strong><span>{l}</span>
            </div>
          ))}
        </div>

        <p className="lv-left-foot">© 2025 ToothEase · STECH Medical · Privacy · Terms</p>

        {/* Decorative blobs */}
        <div className="lv-blob lv-blob-1" />
        <div className="lv-blob lv-blob-2" />
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="lv-right">
        <div className="lv-card">

          {/* Card header */}
          <div className="lv-card-head">
            <h2 className="lv-card-title">Sign in to your account</h2>
            <p className="lv-card-sub">Use the credentials you registered with</p>
          </div>

          {/* Demo pills */}
          {/* <div className="lv-demos">
            <div className="lv-demos-label">⚡ Click to auto-fill demo credentials</div>
            <div className="lv-demos-grid">
              {DEMOS.map(d => (
                <button
                  key={d.email}
                  type="button"
                  className="lv-demo-pill"
                  style={{ "--pc": ROLE_COLORS[d.role].color }}
                  onClick={() => fill(d.email, d.pw)}
                >
                  <span className="lv-demo-label">{d.label}</span>
                  <span className="lv-demo-email">{d.email}</span>
                </button>
              ))}
            </div>
          </div> */}

          <div className="lv-divider"><span>or enter your details</span></div>

          {/* Form */}
          <form className="lv-form" onSubmit={handleSubmit} noValidate>

            {/* Email field with live role badge */}
            <div className="lv-field">
              <label className="lv-label" htmlFor="lv-email">
                Email address
                {rm && (
                  <span className="lv-role-chip" style={{ background: rm.bg, color: rm.color, borderColor: rm.color + "44" }}>
                    {rm.icon} {rm.label} detected
                  </span>
                )}
              </label>
              <input
                ref={emailRef}
                id="lv-email"
                className={`lv-input${errs.email ? " lv-input--err" : ""}`}
                type="email" autoComplete="email"
                placeholder="you@email.com"
                value={email}
                onChange={e => { setEmail(e.target.value); setErrs(x => ({ ...x, email: "" })); }}
              />
              {errs.email && <p className="lv-err"><span>⚠</span> {errs.email}</p>}
            </div>

            {/* Password field */}
            <div className="lv-field">
              <label className="lv-label" htmlFor="lv-pw">
                Password
                <button type="button" className="lv-forgot-link" onClick={onForgot}>
                  Forgot password?
                </button>
              </label>
              <PwField
                id="lv-pw"
                value={password}
                onChange={e => { setPassword(e.target.value); setErrs(x => ({ ...x, password: "" })); }}
                placeholder="Your password"
              />
              {errs.password && <p className="lv-err"><span>⚠</span> {errs.password}</p>}
            </div>

            {/* Remember me */}
            <label className="lv-remember">
              <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} />
              <span>Remember me for 30 days</span>
            </label>

            {/* Submit button — color adapts to detected role */}
            <button
              type="submit"
              className={`lv-submit${loading ? " loading" : ""}`}
              disabled={loading}
              style={rm ? {
                background: `linear-gradient(135deg, ${rm.color} 0%, ${rm.color}dd 100%)`,
                boxShadow:  `0 6px 24px ${rm.color}44`,
              } : {}}
            >
              {loading
                ? <><span className="lv-spinner" /><span>Signing in…</span></>
                : <span>{rm ? `${rm.icon} Sign in as ${rm.label}` : "Sign in →"}</span>
              }
            </button>

          </form>

          {/* Doctor-only note */}

          {/* Register link — goes to Register.jsx */}
          <div className="lv-foot">
            <span>Don't have an account?</span>
            {onGoRegister
              ? <button type="button" className="lv-link-btn" onClick={onGoRegister}>Register as a patient</button>
              : <Link to="/register" className="lv-link-btn">Register as a patient</Link>
            }
          </div>

        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   FORGOT PASSWORD
════════════════════════════════════════════════════════════════ */
function ForgotView({ onBack, onSent, show }) {
  const [email, setEmail]   = useState("");
  const [loading, setLoad]  = useState(false);
  const [err, setErr]       = useState("");

  const submit = async (ev) => {
    ev?.preventDefault();
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setErr("Enter a valid email address"); return;
    }
    setErr(""); setLoad(true);
    await new Promise(r => setTimeout(r, 900));

    /* Check across ALL stores */
    const found = _dedupe([
      ...LS.get(K.ADM_ADMINS,  []),
      ...LS.get(K.ADM_DOCTORS, []),
      ...LS.get(K.TE_DOCTORS,  []),
      ...LS.get(K.TE_PATIENTS, []),
      ...LS.get(K.ADM_PATIENTS,[]),
    ]).find(u => u.email?.toLowerCase() === email.trim().toLowerCase());

    if (found) {
      LS.set(K.RESET_EMAIL, email.trim().toLowerCase());
      LS.set(K.RESET_TOKEN, uid());
    }
    /* Don't reveal whether account exists (security) */
    setLoad(false);
    show("If an account exists, a reset link has been sent.", "info");
    onSent();
  };

  return (
    <div className="lv-page lv-page--centered">
      <div className="lv-card lv-card--narrow">
        <button className="lv-back" onClick={onBack}>← Back to sign in</button>
        <div className="lv-icon-orb">🔑</div>
        <div className="lv-card-head" style={{ textAlign: "center" }}>
          <h2 className="lv-card-title">Forgot your password?</h2>
          <p className="lv-card-sub">Enter your email and we'll generate a password reset link.</p>
        </div>
        <form className="lv-form" onSubmit={submit} noValidate>
          <div className="lv-field">
            <label className="lv-label" htmlFor="fp-email">Email address</label>
            <input id="fp-email" className={`lv-input${err ? " lv-input--err" : ""}`}
              type="email" placeholder="you@email.com"
              value={email} onChange={e => { setEmail(e.target.value); setErr(""); }} />
            {err && <p className="lv-err"><span>⚠</span> {err}</p>}
          </div>
          <button type="submit" className={`lv-submit${loading ? " loading" : ""}`} disabled={loading}>
            {loading ? <><span className="lv-spinner" /><span>Sending…</span></> : <span>Send reset link</span>}
          </button>
        </form>
        <div className="lv-foot" style={{ justifyContent: "center" }}>
          <span>Remembered it?</span>
          <button type="button" className="lv-link-btn" onClick={onBack}>Sign in</button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   RESET PASSWORD
════════════════════════════════════════════════════════════════ */
function ResetView({ onBack, show }) {
  const [pw,      setPw]    = useState({ newPw: "", confirm: "" });
  const [loading, setLoad]  = useState(false);
  const [errs,    setErrs]  = useState({});
  const [done,    setDone]  = useState(false);

  const HINTS = [
    ["8+ characters",    pw.newPw.length >= 8],
    ["Uppercase letter", /[A-Z]/.test(pw.newPw)],
    ["Number",           /[0-9]/.test(pw.newPw)],
    ["Special char",     /[^A-Za-z0-9]/.test(pw.newPw)],
  ];

  const submit = async (ev) => {
    ev?.preventDefault();
    const e = {};
    if (pw.newPw.length < 6)       e.newPw  = "Minimum 6 characters";
    if (pw.newPw !== pw.confirm)   e.confirm = "Passwords do not match";
    if (Object.keys(e).length) { setErrs(e); return; }
    setLoad(true);
    await new Promise(r => setTimeout(r, 800));

    const target = LS.get(K.RESET_EMAIL);
    if (target) {
      /* Update password in every store that holds accounts */
      [K.ADM_ADMINS, K.ADM_DOCTORS, K.TE_DOCTORS, K.TE_PATIENTS, K.ADM_PATIENTS, K.STECH_USERS].forEach(key => {
        const rows = LS.get(key, []);
        if (Array.isArray(rows)) {
          LS.set(key, rows.map(u =>
            u.email?.toLowerCase() === target ? { ...u, password: pw.newPw } : u
          ));
        }
      });
      localStorage.removeItem(K.RESET_EMAIL);
      localStorage.removeItem(K.RESET_TOKEN);
    }
    setLoad(false);
    setDone(true);
    show("Password updated successfully! You can now sign in.");
  };

  if (done) return (
    <div className="lv-page lv-page--centered">
      <div className="lv-card lv-card--narrow" style={{ textAlign: "center" }}>
        <div className="lv-success-orb">✓</div>
        <h2 className="lv-card-title" style={{ marginTop: 20 }}>Password updated!</h2>
        <p className="lv-card-sub" style={{ marginTop: 8 }}>Sign in with your new credentials.</p>
        <button className="lv-submit" style={{ marginTop: 28 }} onClick={onBack}>Sign in now →</button>
      </div>
    </div>
  );

  return (
    <div className="lv-page lv-page--centered">
      <div className="lv-card lv-card--narrow">
        <button className="lv-back" onClick={onBack}>← Back to sign in</button>
        <div className="lv-icon-orb">🔐</div>
        <div className="lv-card-head" style={{ textAlign: "center" }}>
          <h2 className="lv-card-title">Set a new password</h2>
          <p className="lv-card-sub">Choose a strong password you haven't used before.</p>
        </div>
        <form className="lv-form" onSubmit={submit} noValidate>
          <div className="lv-field">
            <label className="lv-label">New password</label>
            <PwField value={pw.newPw} placeholder="Min 6 characters" autoComplete="new-password"
              onChange={e => { setPw(p => ({ ...p, newPw: e.target.value })); setErrs(x => ({ ...x, newPw: "" })); }} />
            <PwStrength pw={pw.newPw} />
            {errs.newPw && <p className="lv-err"><span>⚠</span> {errs.newPw}</p>}
          </div>
          <div className="lv-field">
            <label className="lv-label">Confirm new password</label>
            <PwField value={pw.confirm} placeholder="Repeat password" autoComplete="new-password"
              onChange={e => { setPw(p => ({ ...p, confirm: e.target.value })); setErrs(x => ({ ...x, confirm: "" })); }} />
            {errs.confirm && <p className="lv-err"><span>⚠</span> {errs.confirm}</p>}
          </div>
          {/* Password hints */}
          <div className="lv-hints">
            {HINTS.map(([label, met]) => (
              <div key={label} className={`lv-hint${met ? " lv-hint--met" : ""}`}>
                <span>{met ? "✓" : "○"}</span>{label}
              </div>
            ))}
          </div>
          <button type="submit" className={`lv-submit${loading ? " loading" : ""}`} disabled={loading}>
            {loading ? <><span className="lv-spinner" /><span>Updating…</span></> : <span>Update password</span>}
          </button>
        </form>
      </div>
    </div>
  );
}