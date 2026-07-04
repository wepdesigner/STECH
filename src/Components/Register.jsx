import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import "../Pages/Styles/Registration.css";

/* ═══════════════════════════════════════════════════════════════
   SHARED STORAGE  — identical keys to AdminPanel.jsx
═══════════════════════════════════════════════════════════════ */
const LS = {
  get: (k, d) => {
    try {
      const v = localStorage.getItem(k);
      if (v === null) return d;
      return JSON.parse(v);
    } catch { return d; }
  },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

const uid    = () => Math.random().toString(36).slice(2, 10);
const nowISO = () => new Date().toISOString();
const today  = () => new Date().toISOString().split("T")[0];

/* Generic CRUD  — mirrors AdminPanel's  db() factory */
const mkDB = (key) => ({
  all:    ()          => LS.get(key, []),
  byId:   (id)        => (LS.get(key, []) || []).find(r => r.id === id),
  add:    (obj)       => {
    const rows = LS.get(key, []) || [];
    rows.push(obj);
    LS.set(key, rows);
    return obj;
  },
  update: (id, patch) => {
    const rows = (LS.get(key, []) || []).map(r => r.id === id ? { ...r, ...patch } : r);
    LS.set(key, rows);
    return rows.find(r => r.id === id);
  },
  del:    (id)        => LS.set(key, (LS.get(key, []) || []).filter(r => r.id !== id)),
  forPat: (pid)       => (LS.get(key, []) || []).filter(r => r.patientId === pid),
});

/* DB handles using AdminPanel's exact key names */
const admDoctorDB  = mkDB("adm_doctors");      
const admPatientDB = mkDB("adm_patients");      
const admApptDB    = mkDB("adm_appointments"); 
const admPayDB     = mkDB("adm_payments");      
const admNotifDB   = mkDB("adm_notifications");
const tePatientDB  = mkDB("te_patients");       
const teApptDB     = mkDB("te_appointments");   
const teNotifDB    = mkDB("te_notifs");         

/* ── Helpers ── */
const admNotify = (type, title, body) =>
  admNotifDB.add({ id: uid(), toId: "admin", type, title, body, read: false, createdAt: nowISO() });

const docNotify = (doctorId, type, title, body) =>
  teNotifDB.add({ id: uid(), toId: doctorId, type, title, body, read: false, createdAt: nowISO() });

const fireRefresh = () => {
  window.dispatchEvent(new Event("stech_refresh"));
  window.dispatchEvent(new Event("refresh"));
};

/* Write appointment to BOTH stores */
const addAppt = (obj) => {
  const appt = { ...obj, id: obj.id || uid(), createdAt: obj.createdAt || nowISO() };
  admApptDB.add(appt);
  teApptDB.add(appt);
  return appt;
};

/* Get appointments from both stores, deduped */
const getPatientAppts = (pid) => {
  const adm  = admApptDB.forPat(pid);
  const te   = teApptDB.forPat(pid);
  const seen = new Set(adm.map(a => a.id));
  return [...adm, ...te.filter(a => !seen.has(a.id))]
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
};

/* ─── Doctors: read ONLY from adm_doctors (admin-managed) ─── */
const getActiveDoctors = () =>
  (admDoctorDB.all() || []).filter(d => d.status === "active");

/* ═══════════════════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════════════════ */
const TITLES    = ["Mr.", "Mrs.", "Ms.", "Dr.", "Prof."];
const COUNTRIES = ["Cameroon","France","United States","United Kingdom","Canada","Germany","Nigeria","Senegal","Côte d'Ivoire","Other"];
const FORFAITS  = [
  { id:"basic",    label:"Basic",    price:20000, color:"#64748b",
    features:["2 consultations/month","Email support","Basic records"] },
  { id:"standard", label:"Standard", price:35000, color:"#1e88e5",
    features:["5 consultations/month","Chat & email support","Full records","Priority booking"] },
  { id:"premium",  label:"Premium",  price:50000, color:"#00bfa5",
    features:["Unlimited consultations","24/7 priority support","Full records","Home visits","Specialist access"] },
];
const TREATMENT_TYPES = [
  "Consultation", "Oral Examination", "Dental Fillings", "Tooth Removal",
  "Teeth Cleaning", "Teeth Whitening", "Crowns",
  "Bridges", "X-Ray / Imaging", "Teeth Jewellery", "Braces", "Dentures",
  "Gum Therapy", "Night Guards", "Veneers", "Smile Makeover", "Root Canal",
  "Slimming Wires",
];
const TIMES = [
  "08:00","08:30","09:00","09:30","10:00","10:30","11:00","11:30",
  "14:00","14:30","15:00","15:30","16:00","16:30","17:00",
];

/* ═══════════════════════════════════════════════════════════════
   SHARED UI COMPONENTS
═══════════════════════════════════════════════════════════════ */
const AV_COLORS = ["#1e88e5","#00bfa5","#7c3aed","#f44336","#ff7043","#0891b2","#16a34a","#be185d"];

function Avatar({ name = "?", size = 38, color }) {
  const initials = name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  const bg = color || AV_COLORS[(name.charCodeAt(0) || 0) % AV_COLORS.length];
  return (
    <div className="rg-avatar" style={{ width: size, height: size, background: bg, fontSize: size * 0.36 }}>
      {initials}
    </div>
  );
}

function PasswordInput({ value, onChange, placeholder = "Password" }) {
  const [show, setShow] = useState(false);
  return (
    <div className="rg-pw-wrap">
      <input
        className="rg-input"
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete="new-password"
      />
      <button type="button" className="rg-pw-toggle" onClick={() => setShow(s => !s)}>
        {show ? "🙈" : "👁️"}
      </button>
    </div>
  );
}

function StrengthBar({ password }) {
  const score = [/.{8,}/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter(r => r.test(password)).length;
  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  const colors = ["", "#ef4444", "#f59e0b", "#1e88e5", "#16a34a"];
  if (!password.length) return null;
  return (
    <div className="rg-strength">
      <div className="rg-strength-bars">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="rg-strength-seg"
            style={{ background: i <= score ? colors[score] : "var(--rg-border)" }} />
        ))}
      </div>
      <span style={{ color: colors[score], fontWeight: 700, fontSize: 11 }}>{labels[score]}</span>
    </div>
  );
}

function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3600); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`rg-toast rg-toast--${type}`}>
      <span>{type === "success" ? "✓" : type === "error" ? "✕" : "ℹ"}</span>
      <span style={{ flex: 1 }}>{msg}</span>
      <button onClick={onClose} aria-label="Close">✕</button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ROOT EXPORT
═══════════════════════════════════════════════════════════════ */
export default function Register({ onRegistered: externalCb }) {
  const [view,    setView]    = useState("register");
  const [patient, setPatient] = useState(null);
  const [toast,   setToast]   = useState(null);

  const showToast = useCallback((msg, type = "success") => setToast({ msg, type }), []);

  const handleRegistered = useCallback((p) => {
    LS.set("stech_session", { ...p, role: "patient" });
    setPatient(p);
    setView("dashboard");
    showToast(`Welcome, ${p.name.split(" ")[0]}! 🎉`);
    externalCb?.(p);
  }, [externalCb, showToast]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("stech_session");
    setView("register");
    setPatient(null);
  }, []);

  return (
    <div className="rg-root">
      {view === "register" && (
        <RegistrationPage onRegistered={handleRegistered} showToast={showToast} />
      )}
      {view === "dashboard" && patient && (
        <Dashboard patient={patient} onLogout={handleLogout}
          showToast={showToast} setPatient={setPatient} />
      )}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

/* named export so App.jsx can lazy-import Dashboard directly */
export { Dashboard };

/* ═══════════════════════════════════════════════════════════════
   REGISTRATION PAGE — 4 steps
═══════════════════════════════════════════════════════════════ */
function RegistrationPage({ onRegistered, showToast }) {
  const [step,    setStep]  = useState(1);
  const [loading, setLoad]  = useState(false);
  const [doctors, setDrs]   = useState([]);

  /* load admin-managed doctors fresh on mount + on stech_refresh */
  useEffect(() => {
    const load = () => setDrs(getActiveDoctors());
    load();
    window.addEventListener("stech_refresh", load);
    return () => window.removeEventListener("stech_refresh", load);
  }, []);

  const [form, setForm] = useState({
    title: "", firstName: "", lastName: "", email: "", password: "", confirmPw: "",
    phone: "", dob: "", country: "Cameroon",
    bloodType: "", allergies: "", emergency: "",
    forfait: "standard", preferredDoctorId: "", consent: false,
  });
  const [errs, setErrs] = useState({});

  const set = (field, val) => {
    setForm(f => ({ ...f, [field]: val }));
    setErrs(e => ({ ...e, [field]: "" }));
  };

  const validate = (s) => {
    const e = {};
    if (s === 1) {
      if (!form.firstName.trim())                    e.firstName = "First name required";
      if (!form.lastName.trim())                     e.lastName  = "Last name required";
      if (!form.email.match(/^\S+@\S+\.\S+$/))       e.email     = "Valid email required";
      if (form.password.length < 6)                  e.password  = "Min. 6 characters";
      if (form.password !== form.confirmPw)           e.confirmPw = "Passwords do not match";
    }
    if (s === 3 && !form.preferredDoctorId)
      e.preferredDoctorId = "Please select your primary dentist";
    return e;
  };

  const next = () => {
    const e = validate(step);
    if (Object.keys(e).length) { setErrs(e); return; }
    setStep(s => s + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submit = async () => {
    setLoad(true);
    await new Promise(r => setTimeout(r, 900));

    /* duplicate-email check across both stores */
    const allPats = [
      ...(admPatientDB.all() || []),
      ...(tePatientDB.all()  || []),
    ];
    if (allPats.find(p => p.email?.toLowerCase() === form.email.toLowerCase())) {
      showToast("This email is already registered.", "error");
      setLoad(false);
      return;
    }

    const forfaitPrices = { basic: 20000, standard: 35000, premium: 50000 };
    const doctor        = admDoctorDB.byId(form.preferredDoctorId);
    const forfaitLabel  = form.forfait.charAt(0).toUpperCase() + form.forfait.slice(1);

    const patient = {
      id:                  uid(),
      role:                "patient",
      name:                `${form.firstName} ${form.lastName}`.trim(),
      title:               form.title,
      email:               form.email.toLowerCase().trim(),
      password:            form.password,
      phone:               form.phone,
      dob:                 form.dob,
      country:             form.country,
      bloodType:           form.bloodType,
      allergies:           form.allergies,
      emergency:           form.emergency,
      forfait:             forfaitLabel,
      forfaitAmt:          forfaitPrices[form.forfait],
      membership:          form.forfait === "premium",
      preferredDoctorId:   form.preferredDoctorId,
      preferredDoctorName: doctor?.name || "",
      status:              "active",
      createdAt:           nowISO(),
    };

    /* ── Write to AdminPanel's store (Patients tab shows it) ── */
    admPatientDB.add(patient);

    /* ── Write to te_patients (Login.jsx authenticates from here) ── */
    tePatientDB.add(patient);

    /* ── Notify admin — bell badge increments ── */
    admNotify("patient",
      "🆕 New Patient Registered",
      `${patient.name} joined with a ${forfaitLabel} plan. Doctor: ${doctor?.name || "none"}.`
    );

    /* ── Notify chosen doctor ── */
    if (doctor) {
      docNotify(doctor.id, "patient",
        "New Patient Assigned",
        `${patient.name} chose you as their primary dentist (${forfaitLabel} plan).`
      );
    }

    fireRefresh();
    setLoad(false);
    setStep(5);
    setTimeout(() => onRegistered(patient), 2200);
  };

  const STEPS = ["Account", "Health Info", "Choose Doctor", "Plan & Confirm"];

  return (
    <div className="rg-page">
      {/* ── LEFT PANEL ── */}
      <aside className="rg-left">
        <div className="rg-left-brand">
          <div className="rg-brand-orb"><span>🦷</span></div>
          <div>
            <div className="rg-brand-name">ToothEase</div>
            <div className="rg-brand-sub">STECH Dental Platform</div>
          </div>
        </div>

        <div className="rg-left-hero">
          <h1>Your smile,<br /><em>our mission.</em></h1>
          <p>Join thousands of patients managing their dental health with world-class specialists — all from one elegant platform.</p>
        </div>

        <div className="rg-left-perks">
          {[
            { icon: "🎓", title: "150+ CE Courses",    desc: "Free peer-reviewed dental education available 24/7." },
            { icon: "🔒", title: "Private & Secure",   desc: "Your health data is encrypted and protected." },
            { icon: "⚡", title: "Instant Booking",    desc: "Book with verified specialists in seconds." },
            { icon: "🏠", title: "Home Visit Service", desc: "Premium members get specialist home visits." },
            // { icon: "📊", title: "Admin Sync",         desc: "Your profile appears live on the admin dashboard." },
          ].map(p => (
            <div key={p.title} className="rg-perk">
              <span className="rg-perk-icon">{p.icon}</span>
              <div><strong>{p.title}</strong><span>{p.desc}</span></div>
            </div>
          ))}
        </div>

        {/* Live stats */}
        {/* <div className="rg-left-stats">
          {[
            { val: (admPatientDB.all() || []).length || "500+", lbl: "Patients" },
            { val: (admDoctorDB.all()  || []).filter(d => d.status === "active").length || "—", lbl: "Specialists" },
            { val: (admApptDB.all()    || []).length || "1K+",  lbl: "Appointments" },
          ].map(s => (
            <div key={s.lbl} className="rg-left-stat">
              <strong>{s.val}</strong><span>{s.lbl}</span>
            </div>
          ))}
        </div> */}

        <div className="rg-left-footer">© 2025 ToothEase · Privacy · Terms</div>
        <div className="rg-circle rg-circle-1" />
        <div className="rg-circle rg-circle-2" />
      </aside>

      {/* ── RIGHT PANEL ── */}
      <div className="rg-right">
        {step < 5 && (
          <>
            <div className="rg-stepper">
              {STEPS.map((s, i) => (
                <div key={s} className={`rg-step ${step === i+1 ? "active" : step > i+1 ? "done" : ""}`}>
                  <div className="rg-step-dot">{step > i+1 ? "✓" : i+1}</div>
                  <span className="rg-step-label">{s}</span>
                  {i < STEPS.length - 1 && <div className="rg-step-line" />}
                </div>
              ))}
            </div>

            <div className="rg-form-area">
              {step === 1 && <Step1 form={form} set={set} errs={errs} />}
              {step === 2 && <Step2 form={form} set={set} />}
              {step === 3 && <Step3 form={form} set={set} errs={errs} doctors={doctors} />}
              {step === 4 && <Step4 form={form} set={set} doctors={doctors} />}
            </div>

            <div className="rg-nav-row">
              {step > 1 && (
                <button className="rg-btn rg-btn-ghost" onClick={() => setStep(s => s - 1)}>
                  ← Back
                </button>
              )}
              <div style={{ flex: 1 }} />
              {step < 4 ? (
                <button className="rg-btn rg-btn-primary" onClick={next}>Continue →</button>
              ) : (
                <button className="rg-btn rg-btn-primary" onClick={submit} disabled={loading}>
                  {loading && <span className="rg-spinner" />}
                  {loading ? "Creating Account…" : "Create My Account 🎉"}
                </button>
              )}
            </div>

            <div className="rg-login-link">
              Already have an account? <Link to="/auth">Log in</Link>
            </div>
          </>
        )}

        {step === 5 && <SuccessScreen />}
      </div>
    </div>
  );
}

/* ── Step 1: Account Details ── */
function Step1({ form, set, errs }) {
  return (
    <div className="rg-step-content">
      <div className="rg-step-head">
        <h2>Create your account</h2>
        <p>Start your dental health journey — it takes under 2 minutes.</p>
      </div>

      {/* Admin sync badge */}
      {/* <div className="rg-admin-sync-badge">
        <span>🔗</span> Your profile will appear instantly on the Admin Dashboard
      </div> */}

      <div className="rg-field-group">
        <label className="rg-label">Title</label>
        <select className="rg-input" value={form.title} onChange={e => set("title", e.target.value)}>
          <option value="">Select title…</option>
          {TITLES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div className="rg-row-2">
        <div className="rg-field-group">
          <label className="rg-label">First Name <span className="rg-req">*</span></label>
          <input className={`rg-input${errs.firstName ? " rg-input--err" : ""}`}
            value={form.firstName} onChange={e => set("firstName", e.target.value)} placeholder="Jean" />
          {errs.firstName && <p className="rg-err">{errs.firstName}</p>}
        </div>
        <div className="rg-field-group">
          <label className="rg-label">Last Name <span className="rg-req">*</span></label>
          <input className={`rg-input${errs.lastName ? " rg-input--err" : ""}`}
            value={form.lastName} onChange={e => set("lastName", e.target.value)} placeholder="Dupont" />
          {errs.lastName && <p className="rg-err">{errs.lastName}</p>}
        </div>
      </div>

      <div className="rg-row-2">
        <div className="rg-field-group">
          <label className="rg-label">Date of Birth</label>
          <input className="rg-input" type="date" max={today()}
            value={form.dob} onChange={e => set("dob", e.target.value)} />
        </div>
        <div className="rg-field-group">
          <label className="rg-label">Country</label>
          <select className="rg-input" value={form.country} onChange={e => set("country", e.target.value)}>
            {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className="rg-field-group">
        <label className="rg-label">Email Address <span className="rg-req">*</span></label>
        <input className={`rg-input${errs.email ? " rg-input--err" : ""}`}
          type="email" value={form.email}
          onChange={e => set("email", e.target.value)} placeholder="you@email.com" />
        {errs.email && <p className="rg-err">{errs.email}</p>}
      </div>

      <div className="rg-row-2">
        <div className="rg-field-group">
          <label className="rg-label">Password <span className="rg-req">*</span></label>
          <PasswordInput value={form.password}
            onChange={e => set("password", e.target.value)} placeholder="Min. 6 characters" />
          <StrengthBar password={form.password} />
          {errs.password && <p className="rg-err">{errs.password}</p>}
        </div>
        <div className="rg-field-group">
          <label className="rg-label">Confirm Password <span className="rg-req">*</span></label>
          <PasswordInput value={form.confirmPw}
            onChange={e => set("confirmPw", e.target.value)} placeholder="Repeat password" />
          {errs.confirmPw && <p className="rg-err">{errs.confirmPw}</p>}
        </div>
      </div>

      <div className="rg-field-group">
        <label className="rg-label">Phone Number</label>
        <input className="rg-input" type="tel" value={form.phone}
          onChange={e => set("phone", e.target.value)} placeholder="+237 6XX XXX XXX" />
      </div>

      <label className="rg-consent-row">
        <input type="checkbox" checked={form.consent} onChange={e => set("consent", e.target.checked)} />
        <span>
          I agree to receive appointment reminders and health updates from ToothEase. I accept the{" "}
          <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
        </span>
      </label>
    </div>
  );
}

/* ── Step 2: Health Information ── */
function Step2({ form, set }) {
  return (
    <div className="rg-step-content">
      <div className="rg-step-head">
        <h2>Health Information</h2>
        <p>Help us personalise your care. All info is encrypted and private.</p>
      </div>

      <div className="rg-row-2">
        <div className="rg-field-group">
          <label className="rg-label">Blood Type</label>
          <select className="rg-input" value={form.bloodType}
            onChange={e => set("bloodType", e.target.value)}>
            <option value="">Select…</option>
            {["A+","A-","B+","B-","O+","O-","AB+","AB-"].map(b => (
              <option key={b}>{b}</option>
            ))}
          </select>
        </div>
        <div className="rg-field-group">
          <label className="rg-label">Emergency Contact</label>
          <input className="rg-input" value={form.emergency}
            onChange={e => set("emergency", e.target.value)} placeholder="+237 6XX XXX XXX" />
        </div>
      </div>

      <div className="rg-field-group">
        <label className="rg-label">Known Allergies</label>
        <input className="rg-input" value={form.allergies}
          onChange={e => set("allergies", e.target.value)}
          placeholder="e.g. Penicillin, Latex — or 'None'" />
      </div>

      <div className="rg-info-grid">
        {[
          { icon: "🔐", text: "Encrypted end-to-end — never sold or shared without consent." },
          { icon: "👩‍⚕️", text: "Visible only to your chosen doctor and the admin team." },
          // { icon: "📊", text: "Admin sees your full profile in the Patients dashboard." },
        ].map(c => (
          <div key={c.text} className="rg-info-card">
            <span>{c.icon}</span><p>{c.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Step 3: Choose Doctor  (from adm_doctors only) ── */
function Step3({ form, set, errs, doctors }) {
  return (
    <div className="rg-step-content">
      <div className="rg-step-head">
        <h2>Choose Your Primary Dentist</h2>
        <p>Select a specialist added by the admin team. They will be notified of your registration.</p>
      </div>

      {errs.preferredDoctorId && (
        <div className="rg-err-banner">{errs.preferredDoctorId}</div>
      )}

      {doctors.length === 0 ? (
        <div className="rg-no-doctors">
          <div className="rg-no-doctors-icon">🩺</div>
          <h3>No specialists available yet</h3>
          <p>The admin team hasn't added any active doctors yet. You can skip this step and update later from your profile, or ask your clinic admin to add specialists.</p>
          <button
            className="rg-btn rg-btn-ghost"
            style={{ marginTop: 16 }}
            onClick={() => set("preferredDoctorId", "")}
          >
            Continue without selecting
          </button>
        </div>
      ) : (
        <div className="rg-doctor-grid">
          {doctors.map(d => (
            <div
              key={d.id}
              className={`rg-doctor-card${form.preferredDoctorId === d.id ? " selected" : ""}`}
              onClick={() => set("preferredDoctorId", d.id)}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === "Enter" && set("preferredDoctorId", d.id)}
            >
              {form.preferredDoctorId === d.id && (
                <div className="rg-doctor-tick">✓</div>
              )}
              <Avatar name={d.name} size={54} color={d.color} />
              <div className="rg-doctor-info">
                <div className="rg-doctor-name">{d.name}</div>
                <div className="rg-doctor-spec">{d.specialty}</div>
                <div className="rg-doctor-meta">
                  <span className="rg-stars">{"★".repeat(Math.round(d.rating || 4))}</span>
                  <span>{d.rating}</span>
                </div>
                {d.location && (
                  <div className="rg-doctor-loc">📍 {d.location}{d.experience ? ` · ${d.experience}` : ""}</div>
                )}
                {d.bio && <p className="rg-doctor-bio">{d.bio}</p>}
                <div className="rg-doctor-fee">
                  {(d.consultFee || 15000).toLocaleString("fr-CM")} XAF / visit
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Step 4: Plan & Confirm ── */
function Step4({ form, set, doctors }) {
  const doctor  = doctors.find(d => d.id === form.preferredDoctorId);
  const forfait = FORFAITS.find(f => f.id === form.forfait);

  return (
    <div className="rg-step-content">
      <div className="rg-step-head">
        <h2>Choose Your Plan</h2>
        <p>Select the membership that fits your dental needs and budget.</p>
      </div>

      <div className="rg-forfait-grid">
        {FORFAITS.map(f => (
          <div
            key={f.id}
            className={`rg-forfait-card${form.forfait === f.id ? " selected" : ""}`}
            style={{ "--fc": f.color }}
            onClick={() => set("forfait", f.id)}
            role="button"
            tabIndex={0}
          >
            {f.id === "standard" && <div className="rg-forfait-badge">Popular</div>}
            <div className="rg-forfait-label">{f.label}</div>
            <div className="rg-forfait-price">
              {f.price.toLocaleString("fr-CM")}<span> XAF/mo</span>
            </div>
            <ul className="rg-forfait-features">
              {f.features.map(ft => (
                <li key={ft}><span className="rg-check">✓</span>{ft}</li>
              ))}
            </ul>
            {form.forfait === f.id && <div className="rg-forfait-selected">✓ Selected</div>}
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="rg-summary">
        <div className="rg-summary-title">Registration Summary</div>
        <div className="rg-summary-rows">
          {[
            ["Name",       `${form.title} ${form.firstName} ${form.lastName}`.trim()],
            ["Email",      form.email],
            ["Country",    form.country],
            ["Doctor",     doctor ? doctor.name : "—"],
            ["Specialty",  doctor ? doctor.specialty : "—"],
            ["Plan",       `${forfait?.label} — ${forfait?.price.toLocaleString("fr-CM")} XAF/mo`],
            ["Blood",      form.bloodType || "Not specified"],
            ["Membership", form.forfait === "premium" ? "✓ Premium Member" : "Standard"],
          ].map(([k, v]) => (
            <div key={k} className="rg-summary-row">
              <span>{k}</span><strong>{v}</strong>
            </div>
          ))}
        </div>

        {/* <div className="rg-admin-sync-confirm">
          <span>📊</span>
          <p>
            Upon registration your profile appears instantly on{" "}
            <strong>Admin Dashboard → Patients</strong> and{" "}
            {doctor ? <><strong>{doctor.name}</strong> receives a notification.</> : "the admin team is notified."}
          </p>
        </div> */}
      </div>
    </div>
  );
}

/* ── Success Screen ── */
function SuccessScreen() {
  return (
    <div className="rg-success">
      <div className="rg-success-orb">🦷</div>
      <h2>You're all set!</h2>
      <p>Your account has been created and is live on the admin dashboard. Taking you to your personal dashboard…</p>
      <div className="rg-sync-indicators">
        {["✓ Profile saved to Admin","✓ Doctor notified","✓ Membership activated"].map(s => (
          <div key={s} className="rg-sync-item">{s}</div>
        ))}
      </div>
      <div className="rg-progress-bar"><div className="rg-progress-fill" /></div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   DASHBOARD
═══════════════════════════════════════════════════════════════ */
const DASH_NAV = [
  { key: "home",         icon: "⊞", label: "Dashboard"        },
  { key: "book",         icon: "📅", label: "Book Appointment" },
  { key: "appointments", icon: "📋", label: "My Appointments"  },
  { key: "messages",     icon: "💬", label: "Messages"         },
  { key: "profile",      icon: "👤", label: "My Profile"       },
];

function Dashboard({ patient: initPat, onLogout, showToast, setPatient }) {
  const [tab,      setTab]     = useState("home");
  const [sideOpen, setSide]    = useState(false);
  const [livePat,  setLP]      = useState(initPat);

  /* stay in sync with any admin edits (status, membership changes etc.) */
  useEffect(() => {
    const sync = () => {
      const fresh = admPatientDB.byId(initPat.id) || tePatientDB.byId(initPat.id);
      if (fresh) setLP(p => ({ ...p, ...fresh }));
    };
    window.addEventListener("stech_refresh", sync);
    return () => window.removeEventListener("stech_refresh", sync);
  }, [initPat.id]);

  const doctors = getActiveDoctors();
  const prefDoc = doctors.find(d => d.id === livePat.preferredDoctorId);
  const appts   = getPatientAppts(livePat.id);

  const handleSetPat = useCallback((p) => {
    setLP(p);
    setPatient(p);
    LS.set("stech_session", { ...p, role: "patient" });
  }, [setPatient]);

  return (
    <div className="rg-dash">
      {/* Sidebar */}
      <aside className={`rg-dash-side${sideOpen ? " open" : ""}`}>
        <div className="rg-dash-brand">
          <div className="rg-brand-orb"><span>🦷</span></div>
          <div>
            <div className="rg-brand-name">ToothEase</div>
            <div className="rg-brand-sub">Patient Portal</div>
          </div>
          <button className="rg-side-close" onClick={() => setSide(false)}>✕</button>
        </div>

        <div className="rg-dash-side-user">
          <Avatar name={livePat.name} size={44} />
          <div>
            <strong>{livePat.name}</strong>
            <span>{livePat.forfait} Plan</span>
            {livePat.membership && <span className="rg-member-chip">⭐ Premium</span>}
          </div>
        </div>

        <nav className="rg-dash-nav">
          {DASH_NAV.map(n => (
            <button key={n.key}
              className={`rg-dash-nav-item${tab === n.key ? " active" : ""}`}
              onClick={() => { setTab(n.key); setSide(false); }}>
              <span>{n.icon}</span>{n.label}
            </button>
          ))}
        </nav>

        <div className="rg-dash-side-foot">
          <Avatar name={livePat.name} size={30} />
          <span style={{ flex:1, fontSize:13, fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            {livePat.name}
          </span>
          <button className="rg-logout-btn" onClick={onLogout} title="Log out">🚪</button>
        </div>
      </aside>

      {/* Main */}
      <div className="rg-dash-main">
        <header className="rg-dash-topbar">
          <button className="rg-hamburger" onClick={() => setSide(true)}>☰</button>
          <div className="rg-dash-topbar-title">
            {DASH_NAV.find(n => n.key === tab)?.label || "Dashboard"}
          </div>
          <div className="rg-dash-topbar-right">
            <div className="rg-topbar-user"
              onClick={() => setTab("profile")}
              style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
              <Avatar name={livePat.name} size={30} />
              <span>{livePat.name.split(" ")[0]}</span>
            </div>
            <button className="rg-logout-pill" onClick={onLogout}>🚪 Logout</button>
          </div>
        </header>

        <main className="rg-dash-content">
          {tab === "home"         && <DashHome       patient={livePat} doctors={doctors} prefDoc={prefDoc} appts={appts} setTab={setTab} />}
          {tab === "book"         && <DashBook        patient={livePat} doctors={doctors} showToast={showToast} setTab={setTab} />}
          {tab === "appointments" && <DashAppts       patient={livePat} />}
          {tab === "messages"     && <DashMessages    patient={livePat} doctors={doctors} />}
          {tab === "profile"      && <DashProfile     patient={livePat} setPatient={handleSetPat} showToast={showToast} onLogout={onLogout} />}
        </main>
      </div>

      {sideOpen && <div className="rg-overlay" onClick={() => setSide(false)} />}
    </div>
  );
}

/* ── Dashboard Home ── */
function DashHome({ patient, doctors, prefDoc, appts, setTab }) {
  const upcoming = appts.filter(a => a.status !== "cancelled")
    .sort((a, b) => a.date.localeCompare(b.date));
  const h     = new Date().getHours();
  const greet = h < 12 ? "morning" : h < 18 ? "afternoon" : "evening";

  return (
    <div className="rg-anim">
      <div className="rg-dash-welcome">
        <div>
          <h1>Good {greet}, <em>{patient.name.split(" ")[0]}</em> 👋</h1>
          <p>{new Date().toDateString()} · Your dental health hub</p>
        </div>
        <button className="rg-btn rg-btn-white" onClick={() => setTab("book")}>📅 Book Appointment</button>
      </div>

      <div className="rg-dash-stats">
        {[
          { icon:"📅", label:"Appointments",  value: appts.length,
            bg:"#dbeafe", c:"#1e88e5",
            sub:`${appts.filter(a=>a.status==="confirmed").length} confirmed` },
          { icon:"🦷", label:"My Dentist",    value: prefDoc ? prefDoc.name.split(" ").pop() : "—",
            bg:"#e0f7f4", c:"#00897b",
            sub: prefDoc?.specialty || "Not selected" },
          { icon:"💎", label:"Plan",          value: patient.forfait,
            bg:"#ede9fe", c:"#7c3aed",
            sub: patient.membership ? "Premium member" : "Active" },
          { icon:"⏳", label:"Pending",       value: appts.filter(a=>a.status==="pending").length,
            bg:"#fef3c7", c:"#d97706",
            sub: "Awaiting confirmation" },
        ].map(s => (
          <div key={s.label} className="rg-dash-stat">
            <div className="rg-dash-stat-icon" style={{ background: s.bg, color: s.c }}>{s.icon}</div>
            <div>
              <div className="rg-dash-stat-val">{s.value}</div>
              <div className="rg-dash-stat-lbl">{s.label}</div>
              <div className="rg-dash-stat-sub">{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="rg-dash-two-col">
        {/* Upcoming */}
        <div className="rg-dash-card">
          <div className="rg-dash-card-hd">
            <span className="rg-dash-card-title">Upcoming Appointments</span>
            <button className="rg-ghost-btn" onClick={() => setTab("appointments")}>View all →</button>
          </div>
          {upcoming.length === 0 ? (
            <div className="rg-dash-empty">
              <span style={{ fontSize: 32 }}>📅</span>
              <p>No upcoming appointments.</p>
              <button className="rg-btn rg-btn-primary rg-btn-sm"
                style={{ marginTop: 10 }} onClick={() => setTab("book")}>Book now</button>
            </div>
          ) : upcoming.slice(0, 4).map(a => (
            <div key={a.id} className="rg-appt-row">
              <div className="rg-appt-date">
                <strong>{a.date?.split("-")[2]}</strong>
                <span>{new Date(a.date).toLocaleString("default", { month: "short" })}</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{a.healthType}</div>
                <div style={{ fontSize: 12, color: "#64748b" }}>{a.doctorName} · {a.time}</div>
              </div>
              <span className={`rg-badge rg-badge--${a.status}`}>{a.status}</span>
            </div>
          ))}
        </div>

        {/* Doctors */}
        <div className="rg-dash-card">
          <div className="rg-dash-card-hd">
            <span className="rg-dash-card-title">Available Specialists</span>
            <button className="rg-ghost-btn" onClick={() => setTab("book")}>Book →</button>
          </div>
          {doctors.length === 0 ? (
            <div className="rg-dash-empty">
              <span style={{ fontSize: 28 }}>🩺</span>
              <p style={{ marginTop: 8 }}>No specialists added yet.</p>
            </div>
          ) : doctors.slice(0, 4).map(d => (
            <div key={d.id} className="rg-doc-row">
              <Avatar name={d.name} size={38} color={d.color} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>
                  {d.name}
                  {d.id === patient.preferredDoctorId && (
                    <span className="rg-primary-chip">Primary</span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: "#64748b" }}>{d.specialty} · {d.location}</div>
              </div>
              <span style={{ color: "#f59e0b", fontWeight: 700, fontSize: 13 }}>★ {d.rating}</span>
            </div>
          ))}
        </div>
      </div>

      {prefDoc && (
        <div className="rg-pref-card">
          <Avatar name={prefDoc.name} size={60} color={prefDoc.color} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#00bfa5",
              textTransform:"uppercase", letterSpacing:".05em", marginBottom:4 }}>
              Your Primary Dentist
            </div>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, fontWeight:700 }}>
              {prefDoc.name}
            </div>
            <div style={{ fontSize:13, color:"#64748b" }}>
              {prefDoc.specialty} · {prefDoc.location}
            </div>
          </div>
          <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
            <button className="rg-btn rg-btn-primary rg-btn-sm" onClick={() => setTab("book")}>
              Book Appointment
            </button>
            <button className="rg-btn rg-btn-ghost rg-btn-sm" onClick={() => setTab("messages")}>
              Message
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Book Appointment ── */
function DashBook({ patient, doctors, showToast, setTab }) {
  const [step,    setStep]  = useState(1);
  const [selDoc,  setSel]   = useState(
    doctors.find(d => d.id === patient.preferredDoctorId) || null
  );
  const [form,    setForm]  = useState({ healthType: "", date: "", time: "", notes: "" });
  const [loading, setLoad]  = useState(false);
  const [done,    setDone]  = useState(false);

  const submit = async () => {
    if (!selDoc || !form.healthType || !form.date || !form.time) {
      showToast("Please fill all required fields", "error"); return;
    }
    setLoad(true);
    await new Promise(r => setTimeout(r, 800));

    /* ── Write to adm_appointments + te_appointments ── */
    const appt = addAppt({
      patientId:    patient.id,
      patientName:  patient.name,
      patientEmail: patient.email,
      doctorId:     selDoc.id,
      doctorName:   selDoc.name,
      healthType:   form.healthType,
      date:         form.date,
      time:         form.time,
      notes:        form.notes,
      amount:       selDoc.consultFee || 15000,
      status:       "pending",
    });

    /* ── Pending payment in AdminPanel ── */
    admPayDB.add({
      id: uid(), patientId: patient.id, patientName: patient.name,
      doctorId: selDoc.id, doctorName: selDoc.name,
      appointmentId: appt.id, service: form.healthType,
      amount: selDoc.consultFee || 15000, currency: "XAF",
      method: "—", status: "pending",
      txRef: "TX-" + uid().toUpperCase(),
      date: form.date, adminCut: 0, createdAt: nowISO(),
    });

    /* ── Notifications ── */
    admNotify("appointment", "📅 New Appointment",
      `${patient.name} → ${selDoc.name} · ${form.healthType} · ${form.date} ${form.time}`);
    docNotify(selDoc.id, "appointment", "New Booking Request",
      `${patient.name} wants ${form.healthType} on ${form.date} at ${form.time}.`);

    fireRefresh();
    setLoad(false);
    setDone(true);
    showToast("Appointment request sent! 🎉");
  };

  if (done) return (
    <div className="rg-anim rg-book-success">
      <div className="rg-success-orb" style={{ margin:"0 auto 20px", width:70, height:70, fontSize:"1.8rem" }}>✓</div>
      <h2>Booking Requested!</h2>
      <p>
        Your <strong>{form.healthType}</strong> with <strong>{selDoc?.name}</strong> on{" "}
        <strong>{form.date}</strong> at <strong>{form.time}</strong> is pending confirmation.
      </p>
      <p style={{ fontSize:13, color:"#64748b", marginTop:6 }}>
        The doctor and admin have been notified instantly.
      </p>
      <div style={{ display:"flex", gap:12, marginTop:24, justifyContent:"center", flexWrap:"wrap" }}>
        <button className="rg-btn rg-btn-ghost"
          onClick={() => { setDone(false); setStep(1); setForm({ healthType:"",date:"",time:"",notes:"" }); }}>
          Book Another
        </button>
        <button className="rg-btn rg-btn-primary" onClick={() => setTab("appointments")}>
          View Appointments
        </button>
      </div>
    </div>
  );

  return (
    <div className="rg-anim">
      <div className="rg-page-hd">
        <h1 className="rg-page-title">Book Appointment</h1>
        <p className="rg-page-sub">Schedule with our verified specialists</p>
      </div>

      <div className="rg-stepper rg-stepper--sm">
        {["Choose Doctor","Select Details","Confirm"].map((s, i) => (
          <div key={s} className={`rg-step${step===i+1?" active":step>i+1?" done":""}`}>
            <div className="rg-step-dot">{step > i+1 ? "✓" : i+1}</div>
            <span className="rg-step-label">{s}</span>
            {i < 2 && <div className="rg-step-line" />}
          </div>
        ))}
      </div>

      {/* Step 1 — Doctor */}
      {step === 1 && (
        <div>
          {doctors.length === 0 ? (
            <div className="rg-dash-card" style={{ textAlign:"center", padding:"3rem" }}>
              <div style={{ fontSize:40, marginBottom:12 }}>🩺</div>
              <h3>No specialists available</h3>
              <p style={{ color:"#64748b", marginTop:8 }}>
                The admin hasn't added any active doctors yet. Please check back later.
              </p>
            </div>
          ) : (
            <>
              <div className="rg-doctor-grid">
                {doctors.map(d => (
                  <div key={d.id}
                    className={`rg-doctor-card${selDoc?.id===d.id?" selected":""}${d.id===patient.preferredDoctorId?" primary":""}`}
                    onClick={() => setSel(d)} role="button" tabIndex={0}>
                    {d.id===patient.preferredDoctorId && <div className="rg-preferred-tag">Your Doctor</div>}
                    {selDoc?.id===d.id && <div className="rg-doctor-tick">✓</div>}
                    <Avatar name={d.name} size={52} color={d.color} />
                    <div className="rg-doctor-info">
                      <div className="rg-doctor-name">{d.name}</div>
                      <div className="rg-doctor-spec">{d.specialty}</div>
                      <div className="rg-doctor-meta">
                        <span className="rg-stars">★</span>{d.rating} · {d.experience}
                      </div>
                      <div className="rg-doctor-fee">
                        {(d.consultFee||15000).toLocaleString("fr-CM")} XAF
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display:"flex", justifyContent:"flex-end", marginTop:20 }}>
                <button className="rg-btn rg-btn-primary"
                  onClick={() => { if(!selDoc){showToast("Please select a doctor","error");return;} setStep(2); }}>
                  Continue →
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Step 2 — Details */}
      {step === 2 && (
        <div className="rg-dash-card" style={{ maxWidth:560, margin:"0 auto" }}>
          <div className="rg-booking-doc-banner">
            <Avatar name={selDoc?.name} size={42} color={selDoc?.color} />
            <div>
              <div style={{ fontWeight:700 }}>{selDoc?.name}</div>
              <div style={{ fontSize:13, color:"#64748b" }}>
                {selDoc?.specialty} · {(selDoc?.consultFee||15000).toLocaleString("fr-CM")} XAF
              </div>
            </div>
            <button className="rg-ghost-btn rg-btn-sm" onClick={() => setStep(1)}>Change</button>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div className="rg-field-group">
              <label className="rg-label">Treatment Type *</label>
              <select className="rg-input" value={form.healthType}
                onChange={e => setForm(f => ({ ...f, healthType: e.target.value }))}>
                <option value="">Select treatment…</option>
                {TREATMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="rg-row-2">
              <div className="rg-field-group">
                <label className="rg-label">Date *</label>
                <input className="rg-input" type="date" min={today()}
                  value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div className="rg-field-group">
                <label className="rg-label">Time *</label>
                <select className="rg-input" value={form.time}
                  onChange={e => setForm(f => ({ ...f, time: e.target.value }))}>
                  <option value="">Select time…</option>
                  {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="rg-field-group">
              <label className="rg-label">Notes (optional)</label>
              <textarea className="rg-input rg-textarea" rows={3}
                placeholder="Describe your concern…"
                value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
          <div style={{ display:"flex", gap:12, marginTop:20, justifyContent:"space-between" }}>
            <button className="rg-btn rg-btn-ghost" onClick={() => setStep(1)}>← Back</button>
            <button className="rg-btn rg-btn-primary" onClick={() => {
              if (!form.healthType||!form.date||!form.time) {
                showToast("Fill all required fields","error"); return;
              }
              setStep(3);
            }}>Review →</button>
          </div>
        </div>
      )}

      {/* Step 3 — Confirm */}
      {step === 3 && (
        <div className="rg-dash-card" style={{ maxWidth:500, margin:"0 auto" }}>
          <h3 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, marginBottom:20 }}>
            Confirm Your Booking
          </h3>
          <div className="rg-confirm-summary">
            {[
              ["Doctor",    selDoc?.name],
              ["Specialty", selDoc?.specialty],
              ["Treatment", form.healthType],
              ["Date",      form.date],
              ["Time",      form.time],
              ["Fee",       `${(selDoc?.consultFee||15000).toLocaleString("fr-CM")} XAF`],
              ["Notes",     form.notes || "—"],
            ].map(([k, v]) => (
              <div key={k} className="rg-summary-row">
                <span>{k}</span><strong>{v}</strong>
              </div>
            ))}
          </div>

          {/* Admin sync note */}
          <div className="rg-admin-sync-note">
            <span>📊</span>
            <p>
              This booking appears instantly in{" "}
              <strong>Admin → Appointments</strong> and{" "}
              <strong>{selDoc?.name}</strong> is notified immediately.
            </p>
          </div>

          <div style={{ display:"flex", gap:12, justifyContent:"space-between", marginTop:16 }}>
            <button className="rg-btn rg-btn-ghost" onClick={() => setStep(2)}>← Back</button>
            <button className="rg-btn rg-btn-primary" onClick={submit} disabled={loading}>
              {loading && <span className="rg-spinner" />}
              {loading ? "Booking…" : "Confirm Booking"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── My Appointments ── */
function DashAppts({ patient }) {
  const [filter, setFilter] = useState("all");
  const [appts,  setAppts]  = useState(() => getPatientAppts(patient.id));

  useEffect(() => {
    const refresh = () => setAppts(getPatientAppts(patient.id));
    window.addEventListener("stech_refresh", refresh);
    return () => window.removeEventListener("stech_refresh", refresh);
  }, [patient.id]);

  const filtered = filter === "all" ? appts : appts.filter(a => a.status === filter);

  return (
    <div className="rg-anim">
      <div className="rg-page-hd">
        <h1 className="rg-page-title">My Appointments</h1>
        <p className="rg-page-sub">{appts.length} total</p>
      </div>
      <div style={{ display:"flex", gap:6, marginBottom:16, flexWrap:"wrap" }}>
        {["all","pending","confirmed","cancelled"].map(f => (
          <button key={f} className={`rg-filter-tab${filter===f?" active":""}`}
            onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
            <span className="rg-filter-count">
              {f==="all" ? appts.length : appts.filter(a=>a.status===f).length}
            </span>
          </button>
        ))}
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        {filtered.length === 0 ? (
          <div className="rg-dash-card">
            <div className="rg-dash-empty">
              <span style={{ fontSize:32 }}>📅</span>
              <p>No appointments found.</p>
            </div>
          </div>
        ) : filtered.map(a => (
          <div key={a.id} className="rg-dash-card rg-appt-full">
            <div className="rg-appt-date rg-appt-date--lg">
              <strong>{a.date?.split("-")[2]}</strong>
              <span>{new Date(a.date).toLocaleString("default",{month:"short"})}</span>
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:700, fontSize:18 }}>
                {a.healthType}
              </div>
              <div style={{ fontSize:13, color:"#64748b", marginTop:4 }}>
                {a.doctorName} · {a.time}
              </div>
              {a.notes && (
                <div style={{ fontSize:12, color:"#94a3b8", marginTop:4, fontStyle:"italic" }}>
                  "{a.notes}"
                </div>
              )}
              <div style={{ fontWeight:700, color:"#1e88e5", marginTop:6 }}>
                {(a.amount||0).toLocaleString("fr-CM")} XAF
              </div>
            </div>
            <span className={`rg-badge rg-badge--${a.status}`}>{a.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Messages ── */
function DashMessages({ patient, doctors }) {
  const contacts = [
    { id:"admin", name:"Admin Support", role:"Platform Help", color:"#0d1b3e" },
    ...doctors.map(d => ({ id:d.id, name:d.name, role:d.specialty, color:d.color })),
  ];
  const [selId, setSel]  = useState(patient.preferredDoctorId || contacts[0]?.id || "admin");
  const [msgs,  setMsgs] = useState([]);
  const [input, setInput]= useState("");
  const chatRef = useRef(null);

  const loadThread = useCallback(() => {
    const key = `te_thread_${patient.id}_${selId}`;
    setMsgs(LS.get(key, []));
  }, [patient.id, selId]);

  useEffect(() => { loadThread(); }, [loadThread]);
  useEffect(() => { chatRef.current?.scrollTo(0, chatRef.current.scrollHeight); }, [msgs]);

  const send = () => {
    if (!input.trim()) return;
    const key = `te_thread_${patient.id}_${selId}`;
    const msg = {
      id: uid(), from: "patient", text: input.trim(),
      ts: new Date().toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" }),
    };
    const updated = [...msgs, msg];
    LS.set(key, updated);
    setMsgs(updated);
    setInput("");
    docNotify(selId, "message", `Message from ${patient.name}`, input.trim().slice(0, 80));
    setTimeout(() => {
      const reply = {
        id: uid(), from: "doctor",
        text: "Thank you for your message. I'll get back to you shortly.",
        ts: new Date().toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" }),
      };
      const final = [...updated, reply];
      LS.set(key, final);
      setMsgs(final);
    }, 1800 + Math.random() * 600);
  };

  const contact = contacts.find(c => c.id === selId);

  return (
    <div className="rg-anim">
      <div className="rg-page-hd"><h1 className="rg-page-title">Messages</h1></div>
      <div className="rg-msg-layout">
        <div className="rg-msg-contacts">
          <div className="rg-msg-contacts-hd">Contacts</div>
          {contacts.map(c => (
            <div key={c.id} className={`rg-msg-contact${selId===c.id?" active":""}`}
              onClick={() => setSel(c.id)}>
              <Avatar name={c.name} size={36} color={c.color} />
              <div>
                <div style={{ fontWeight:700, fontSize:13 }}>{c.name}</div>
                <div style={{ fontSize:11, color:"#64748b" }}>{c.role}</div>
              </div>
              {c.id===patient.preferredDoctorId && (
                <span className="rg-primary-chip" style={{ fontSize:9 }}>Primary</span>
              )}
            </div>
          ))}
        </div>
        <div className="rg-msg-chat">
          <div className="rg-msg-chat-hd">
            <Avatar name={contact?.name||""} size={36} color={contact?.color} />
            <div>
              <div style={{ fontWeight:700 }}>{contact?.name}</div>
              <div style={{ fontSize:12, color:"#00bfa5" }}>● Online</div>
            </div>
          </div>
          <div className="rg-msg-bubbles" ref={chatRef}>
            {msgs.length===0 && (
              <div className="rg-dash-empty" style={{ flex:1 }}>
                <span style={{ fontSize:32 }}>💬</span><p>No messages yet. Say hello!</p>
              </div>
            )}
            {msgs.map(m => (
              <div key={m.id} className={`rg-bubble-wrap${m.from==="patient"?" right":" left"}`}>
                <div className={`rg-bubble rg-bubble--${m.from}`}>{m.text}</div>
                <span className="rg-bubble-ts">
                  {m.from==="patient" ? "You" : contact?.name} · {m.ts}
                </span>
              </div>
            ))}
          </div>
          <div className="rg-msg-input">
            <input className="rg-input" placeholder={`Message ${contact?.name}…`}
              value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && send()} />
            <button className="rg-btn rg-btn-primary" onClick={send} disabled={!input.trim()}>
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── My Profile ── */
function DashProfile({ patient, setPatient, showToast, onLogout }) {
  const [tab,     setPTab]  = useState("info");
  const [form,    setForm]  = useState({
    name: patient.name, email: patient.email, phone: patient.phone||"",
    dob: patient.dob||"", bloodType: patient.bloodType||"",
    allergies: patient.allergies||"", address: patient.address||"",
    emergency: patient.emergency||"",
  });
  const [pw,      setPw]    = useState({ old:"", newPw:"", confirm:"" });
  const [confirm, setConf]  = useState(false);
  const appts = getPatientAppts(patient.id);

  const save = () => {
    if (!form.name||!form.email) { showToast("Name and email required","error"); return; }
    admPatientDB.update(patient.id, form);
    tePatientDB.update(patient.id, form);
    admNotify("patient","Patient Profile Updated",`${form.name} updated their profile.`);
    setPatient({ ...patient, ...form });
    fireRefresh();
    showToast("Profile updated!");
  };

  const changePw = () => {
    if (!pw.newPw)             { showToast("Enter a new password","error"); return; }
    if (pw.newPw !== pw.confirm){ showToast("Passwords don't match","error"); return; }
    if (pw.newPw.length < 6)   { showToast("Min. 6 characters","error"); return; }
    admPatientDB.update(patient.id, { password: pw.newPw });
    tePatientDB.update(patient.id,  { password: pw.newPw });
    setPw({ old:"", newPw:"", confirm:"" });
    showToast("Password updated!");
  };

  const deleteAccount = () => {
    admPatientDB.update(patient.id, { status: "deleted" });
    tePatientDB.update(patient.id,  { status: "deleted" });
    admNotify("patient","Patient Account Deleted",`${patient.name} deleted their account.`);
    fireRefresh();
    showToast("Account deleted", "info");
    onLogout();
  };

  return (
    <div className="rg-anim">
      <div className="rg-page-hd"><h1 className="rg-page-title">My Profile</h1></div>
      <div className="rg-dash-two-col">
        {/* Info card */}
        <div className="rg-dash-card" style={{ textAlign:"center" }}>
          <Avatar name={patient.name} size={80} />
          <h3 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, marginTop:14 }}>
            {patient.name}
          </h3>
          <p style={{ color:"#64748b", fontSize:13, marginBottom:12 }}>{patient.email}</p>
          <div style={{ display:"flex", gap:8, justifyContent:"center", flexWrap:"wrap" }}>
            {patient.bloodType && <span className="rg-badge rg-badge--red">{patient.bloodType}</span>}
            {patient.membership && <span className="rg-badge rg-badge--teal">⭐ Premium</span>}
            <span className={`rg-badge rg-badge--${patient.status}`}>{patient.status}</span>
          </div>
          <div style={{ borderTop:"1px solid #e2e8f0", marginTop:16, paddingTop:16,
            display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div>
              <div style={{ fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:22,color:"#1e88e5" }}>
                {appts.length}
              </div>
              <div style={{ fontSize:12, color:"#64748b" }}>Appointments</div>
            </div>
            <div>
              <div style={{ fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:22,color:"#16a34a" }}>
                {patient.forfait}
              </div>
              <div style={{ fontSize:12, color:"#64748b" }}>Current Plan</div>
            </div>
          </div>
          <p style={{ fontSize:11, color:"#94a3b8", marginTop:10 }}>
            Profile synced with Admin Dashboard
          </p>
        </div>

        {/* Edit area */}
        <div>
          <div style={{ display:"flex", gap:6, marginBottom:14, flexWrap:"wrap" }}>
            {[["info","Personal"],["health","Health"],["security","Security"]].map(([k,l]) => (
              <button key={k} className={`rg-filter-tab${tab===k?" active":""}`}
                onClick={() => setPTab(k)}>{l}</button>
            ))}
          </div>
          <div className="rg-dash-card">
            {tab === "info" && (
              <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                <div className="rg-row-2">
                  <div className="rg-field-group">
                    <label className="rg-label">Full Name</label>
                    <input className="rg-input" value={form.name}
                      onChange={e => setForm(f => ({...f,name:e.target.value}))} />
                  </div>
                  <div className="rg-field-group">
                    <label className="rg-label">Phone</label>
                    <input className="rg-input" value={form.phone}
                      onChange={e => setForm(f => ({...f,phone:e.target.value}))} />
                  </div>
                </div>
                <div className="rg-field-group">
                  <label className="rg-label">Email</label>
                  <input className="rg-input" type="email" value={form.email}
                    onChange={e => setForm(f => ({...f,email:e.target.value}))} />
                </div>
                <div className="rg-field-group">
                  <label className="rg-label">Address</label>
                  <input className="rg-input" value={form.address}
                    onChange={e => setForm(f => ({...f,address:e.target.value}))} />
                </div>
                <div className="rg-field-group">
                  <label className="rg-label">Emergency Contact</label>
                  <input className="rg-input" value={form.emergency}
                    onChange={e => setForm(f => ({...f,emergency:e.target.value}))} />
                </div>
                <button className="rg-btn rg-btn-primary" onClick={save}>Save Changes</button>
              </div>
            )}
            {tab === "health" && (
              <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                <div className="rg-row-2">
                  <div className="rg-field-group">
                    <label className="rg-label">Date of Birth</label>
                    <input className="rg-input" type="date" value={form.dob}
                      onChange={e => setForm(f => ({...f,dob:e.target.value}))} />
                  </div>
                  <div className="rg-field-group">
                    <label className="rg-label">Blood Type</label>
                    <select className="rg-input" value={form.bloodType}
                      onChange={e => setForm(f => ({...f,bloodType:e.target.value}))}>
                      <option value="">Select…</option>
                      {["A+","A-","B+","B-","O+","O-","AB+","AB-"].map(b=>(
                        <option key={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="rg-field-group">
                  <label className="rg-label">Allergies</label>
                  <input className="rg-input" value={form.allergies}
                    onChange={e => setForm(f => ({...f,allergies:e.target.value}))} />
                </div>
                <button className="rg-btn rg-btn-primary" onClick={save}>Save Health Info</button>
              </div>
            )}
            {tab === "security" && (
              <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                <div className="rg-field-group">
                  <label className="rg-label">Current Password</label>
                  <input className="rg-input" type="password" value={pw.old}
                    onChange={e => setPw(p => ({...p,old:e.target.value}))} />
                </div>
                <div className="rg-field-group">
                  <label className="rg-label">New Password</label>
                  <input className="rg-input" type="password" value={pw.newPw}
                    onChange={e => setPw(p => ({...p,newPw:e.target.value}))} />
                </div>
                <div className="rg-field-group">
                  <label className="rg-label">Confirm New</label>
                  <input className="rg-input" type="password" value={pw.confirm}
                    onChange={e => setPw(p => ({...p,confirm:e.target.value}))} />
                </div>
                <button className="rg-btn rg-btn-primary" onClick={changePw}>
                  Update Password
                </button>
                <div style={{ borderTop:"1px solid #e2e8f0", paddingTop:14 }}>
                  <p style={{ fontSize:12, color:"#64748b", marginBottom:10 }}>
                    Deleting your account notifies the admin and removes all access.
                  </p>
                  <button className="rg-btn rg-btn-danger rg-btn-sm" onClick={() => setConf(true)}>
                    Delete My Account
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {confirm && (
        <div className="rg-modal-overlay" onClick={() => setConf(false)}>
          <div className="rg-modal" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, marginBottom:12 }}>
              Delete Account?
            </h3>
            <p style={{ color:"#64748b", marginBottom:20, lineHeight:1.7 }}>
              This will permanently remove your account and notify the administrator. This cannot be undone.
            </p>
            <div style={{ display:"flex", gap:10 }}>
              <button className="rg-btn rg-btn-ghost" style={{ flex:1 }} onClick={() => setConf(false)}>
                Cancel
              </button>
              <button className="rg-btn rg-btn-danger" style={{ flex:1 }} onClick={deleteAccount}>
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}