import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import "./Styles/Appointment.css";

/* ═══════════════════════════════════════════════════════════════
   SHARED STORAGE LAYER  (identical keys to AdminPanel + DoctorPanel)
═══════════════════════════════════════════════════════════════ */
const LS = {
  get: (k, d) => { try { const v = localStorage.getItem(k); return v !== null ? JSON.parse(v) : d; } catch { return d; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

const uid     = () => Math.random().toString(36).slice(2, 10).toUpperCase();
const nowISO  = () => new Date().toISOString();
const todayStr= () => new Date().toISOString().split("T")[0];

/* Generic DB — mirrors the db() factory in all panels */
const mkDB = (key) => ({
  all:    ()          => LS.get(key, []),
  byId:   (id)        => LS.get(key, []).find(r => r.id === id),
  add:    (obj)       => { const r = LS.get(key,[]); r.push(obj); LS.set(key, r); return obj; },
  update: (id, patch) => { const r = LS.get(key,[]).map(x => x.id===id ? {...x,...patch} : x); LS.set(key, r); return r.find(x=>x.id===id); },
  del:    (id)        => LS.set(key, LS.get(key,[]).filter(x => x.id!==id)),
  forDoc: (did)       => LS.get(key,[]).filter(x => x.doctorId === did),
  forPat: (pid)       => LS.get(key,[]).filter(x => x.patientId === pid),
});

const doctorDB  = mkDB("adm_doctors");
const patientDB = mkDB("adm_patients");
const apptDB    = mkDB("adm_appointments");
const payDB     = mkDB("adm_payments");
const notifDB   = mkDB("adm_notifications");

/** Push a notification visible to admin + doctor panels */
function pushNotif(toId, type, title, body) {
  notifDB.add({ id: "N" + uid(), toId, type, title, body, read: false, createdAt: nowISO() });
}

/** Fire the cross-panel refresh event */
const fireRefresh = () => {
  window.dispatchEvent(new Event("stech_refresh"));
  window.dispatchEvent(new Event("refresh")); // DoctorPanel also listens to this
};

/* ── Seed doctors if the admin panel hasn't run yet ── */
(function seedIfEmpty() {
  if (doctorDB.all().length > 0) return;
  [
    { id:"d1", name:"Dr. Molack Steve",    specialty:"Orthodontist",    experience:"9 yrs",  rating:4.9, status:"active",   location:"Douala",    bio:"Expert in braces & smile alignment.",  consultFee:15000, commissionPct:12, password:"doc123", revenue:0, createdAt:nowISO() },
    { id:"d2", name:"Dr. Sarah Okafor",    specialty:"Periodontist",    experience:"7 yrs",  rating:4.7, status:"active",   location:"Yaoundé",   bio:"Gum health & periodontal treatments.", consultFee:18000, commissionPct:12, password:"doc123", revenue:0, createdAt:nowISO() },
    { id:"d3", name:"Dr. James Trent",     specialty:"Oral Surgeon",    experience:"12 yrs", rating:4.8, status:"active",   location:"Bafoussam", bio:"Specialised in complex extractions.",  consultFee:25000, commissionPct:12, password:"doc123", revenue:0, createdAt:nowISO() },
    { id:"d4", name:"Dr. Amira Haddad",    specialty:"General Dentist", experience:"5 yrs",  rating:4.6, status:"active",   location:"Douala",    bio:"Full-spectrum general dental care.",   consultFee:12000, commissionPct:12, password:"doc123", revenue:0, createdAt:nowISO() },
    { id:"d5", name:"Dr. Boukar Jean",     specialty:"Endodontist",     experience:"8 yrs",  rating:4.8, status:"active",   location:"Yaoundé",   bio:"Root-canal specialist, 800+ cases.",   consultFee:20000, commissionPct:12, password:"doc123", revenue:0, createdAt:nowISO() },
    { id:"d6", name:"Dr. Claire Fongang",  specialty:"Dermatology",     experience:"6 yrs",  rating:4.5, status:"inactive", location:"Douala",    bio:"Skin care & cosmetic dermatology.",    consultFee:14000, commissionPct:12, password:"doc123", revenue:0, createdAt:nowISO() },
  ].forEach(d => doctorDB.add(d));
})();

/* ═══════════════════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════════════════ */
const SERVICES = [
  "Consultation", "Oral Examination", "Dental Fillings", "Tooth Removal",
  "Teeth Cleaning", "Teeth Whitening", "Crowns",
  "Bridges", "X-Ray / Imaging", "Teeth Jewellery", "Braces", "Dentures",
  "Gum Therapy", "Night Guards", "Veneers", "Smile Makeover", "Root Canal",
  "Slimming Wires",
];

const TIMES = [
  "08:00","08:30","09:00","09:30","10:00","10:30","11:00","11:30",
  "12:00","14:00","14:30","15:00","15:30","16:00","16:30","17:00",
];

const PARTNERS = [
  { name:"asana",      sym:"▲" },
  { name:"Airtasker",  sym:"◆" },
  { name:"Segment",    sym:"○" },
  { name:"splunk>",    sym:"◀" },
  { name:"HubSpot",    sym:"●" },
];

/* ═══════════════════════════════════════════════════════════════
   VALIDATION
═══════════════════════════════════════════════════════════════ */
function validate(f) {
  const e = {};
  if (!f.name.trim())                        e.name    = "Full name is required";
  if (!/^\+?\d[\d\s\-]{6,}$/.test(f.phone)) e.phone   = "Enter a valid phone number";
  if (!f.service)                            e.service = "Please choose a service";
  if (!/\S+@\S+\.\S+/.test(f.email))        e.email   = "Enter a valid email address";
  if (!f.doctorId)                           e.doctorId= "Please select a doctor";
  if (!f.date)                               e.date    = "Please pick a date";
  if (!f.time)                               e.time    = "Please select a time";
  return e;
}

/* ═══════════════════════════════════════════════════════════════
   AVATAR
═══════════════════════════════════════════════════════════════ */
const AV_COLORS = ["#1e88e5","#00bfa5","#7c3aed","#e85c4a","#ff7043","#0891b2","#16a34a","#be185d"];
function Avatar({ name = "?", size = 40 }) {
  const initials = name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  const bg = AV_COLORS[(name.charCodeAt(0) || 0) % AV_COLORS.length];
  return (
    <div className="appt-avatar" style={{ width: size, height: size, background: bg, fontSize: size * 0.36 }}>
      {initials}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TOAST
═══════════════════════════════════════════════════════════════ */
function useToast() {
  const [list, setList] = useState([]);
  const fire = (msg, type = "success") => {
    const id = uid();
    setList(l => [...l, { id, msg, type }]);
    setTimeout(() => setList(l => l.filter(x => x.id !== id)), 3800);
  };
  return { list, fire };
}

/* ═══════════════════════════════════════════════════════════════
   ROOT EXPORT
═══════════════════════════════════════════════════════════════ */
export default function Appointment() {
  const [form, setForm] = useState({
    name:"", phone:"", email:"", service:"", doctorId:"", date:"", time:"", notes:""
  });
  const [errors,     setErrors]    = useState({});
  const [loading,    setLoading]   = useState(false);
  const [success,    setSuccess]   = useState(false);
  const [bookedAppt, setBooked]    = useState(null);
  const [newsletter, setNewsletter]= useState("");
  const [nlDone,     setNlDone]    = useState(false);
  const [step,       setStep]      = useState(1); // 1=details 2=choose-doctor 3=confirm
  const { list: toasts, fire: toast } = useToast();

  const doctors = doctorDB.all().filter(d => d.status === "active");
  const selDoc  = doctors.find(d => d.id === form.doctorId);

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => ({ ...e, [k]: "" }));
  };

  const nextStep = () => {
    if (step === 1) {
      const e = {};
      if (!form.name.trim())                        e.name  = "Name required";
      if (!/^\+?\d[\d\s\-]{6,}$/.test(form.phone)) e.phone = "Valid phone required";
      if (!/\S+@\S+\.\S+/.test(form.email))         e.email = "Valid email required";
      if (!form.service)                            e.service= "Choose a service";
      if (Object.keys(e).length) { setErrors(e); return; }
    }
    if (step === 2) {
      if (!form.doctorId) { setErrors({ doctorId:"Select a doctor" }); return; }
    }
    setStep(s => s + 1);
  };

  const submit = async (e) => {
    e?.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    await new Promise(r => setTimeout(r, 900));

    const doc    = doctorDB.byId(form.doctorId);
    const apptId = "A" + uid();
    const txRef  = "TX-" + uid();

    /* ── Write appointment to shared DB ── */
    const appt = apptDB.add({
      id:          apptId,
      patientId:   "guest-" + uid(),   // guest booking (no registered account)
      patientName: form.name,
      patientEmail:form.email,
      patientPhone:form.phone,
      doctorId:    form.doctorId,
      doctorName:  doc?.name || "",
      healthType:  form.service,
      date:        form.date,
      time:        form.time,
      notes:       form.notes,
      amount:      doc?.consultFee || 15000,
      status:      "pending",          // ← doctor must confirm
      source:      "appointment_page",
      createdAt:   nowISO(),
    });

    /* ── Auto-create a pending payment ── */
    payDB.add({
      id:          "P" + uid(),
      patientId:   appt.patientId,
      patientName: form.name,
      doctorId:    form.doctorId,
      doctorName:  doc?.name || "",
      appointmentId: apptId,
      service:     form.service,
      amount:      doc?.consultFee || 15000,
      currency:    "XAF",
      method:      "—",
      status:      "pending",
      txRef,
      date:        form.date,
      adminCut:    0,
      createdAt:   nowISO(),
    });

    /* ── Notify doctor — shows in their Appointments tab ── */
    pushNotif(
      form.doctorId,
      "appointment",
      "📅 New Booking Request",
      `${form.name} wants ${form.service} on ${form.date} at ${form.time}. Please confirm or decline.`
    );

    /* ── Notify admin — shows in their Overview + bell ── */
    pushNotif(
      "admin",
      "appointment",
      "📅 New Appointment Booked",
      `${form.name} booked ${form.service} with ${doc?.name} on ${form.date} at ${form.time}. Status: PENDING.`
    );

    /* ── Fire cross-panel refresh ── */
    fireRefresh();

    setBooked(appt);
    setLoading(false);
    setSuccess(true);
    toast("Appointment request sent! The doctor will confirm shortly.");
  };

  const reset = () => {
    setForm({ name:"", phone:"", email:"", service:"", doctorId:"", date:"", time:"", notes:"" });
    setErrors({}); setSuccess(false); setBooked(null); setStep(1);
  };

  return (
    <div className="appt-root">

      {/* ══ HERO ══ */}
      <section className="appt-hero">
        <div className="appt-hero-overlay"/>
        <div className="appt-hero-particles">
          {[...Array(14)].map((_, i) => <div key={i} className="particle" style={{ "--i": i }}/>)}
        </div>
        <div className="appt-hero-content">
          <nav className="appt-breadcrumb">
            <Link to="/"><span>Home</span></Link>
            <span className="sep">›</span>
            <span className="current">Book Appointment</span>
          </nav>
          <h1 className="appt-hero-title">Book an Appointment</h1>
          <p className="appt-hero-sub">Choose your specialist · Pick a slot · We'll handle the rest</p>

          {/* Live stats strip */}
          <div className="appt-hero-stats">
            {[
              { val: doctors.length,           lbl:"Specialists Available" },
              { val: apptDB.all().filter(a=>a.status==="confirmed").length, lbl:"Confirmed Today" },
              { val: "24/7",                   lbl:"Online Booking" },
              { val: "< 2min",                 lbl:"Average Booking Time" },
            ].map(s => (
              <div key={s.lbl} className="appt-hero-stat">
                <strong>{s.val}</strong>
                <span>{s.lbl}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ MAIN SECTION ══ */}
      <section className="appt-form-section">
        <div className="appt-form-wrap">

          {/* ── LEFT: intro ── */}
          <div className="appt-intro">
            <p className="appt-intro-eyebrow">
              <span className="appt-check-icon">✦</span> STECH Dental Care
            </p>
            <h2 className="appt-intro-title">
              Expert care,<br/><em>on your schedule.</em>
            </h2>
            <p className="appt-intro-desc">
              STECH Dental connects you with verified specialists in seconds.
              Your booking goes directly to your chosen doctor — they confirm,
              you get notified, all in real time.
            </p>

            {/* How it works */}
            <div className="appt-how">
              <div className="appt-how-title">How it works</div>
              {[
                { num:"01", title:"Fill your details",   desc:"Name, contact, and preferred treatment." },
                { num:"02", title:"Choose your doctor",  desc:"Browse our active specialists and pick one." },
                { num:"03", title:"Confirm & submit",    desc:"Review and send — doctor gets notified instantly." },
                { num:"04", title:"Doctor confirms",     desc:"You receive a confirmation once approved." },
              ].map(h => (
                <div key={h.num} className="appt-how-step">
                  <div className="appt-how-num">{h.num}</div>
                  <div>
                    <strong>{h.title}</strong>
                    <p>{h.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Active doctors preview */}
            <div className="appt-doc-preview">
              <div className="appt-doc-preview-title">Available Specialists</div>
              {doctors.slice(0, 4).map(d => (
                <div key={d.id} className="appt-doc-preview-row">
                  <Avatar name={d.name} size={36}/>
                  <div>
                    <div style={{ fontWeight:700, fontSize:13 }}>{d.name}</div>
                    <div style={{ fontSize:11, color:"var(--appt-muted)" }}>{d.specialty} · {d.location}</div>
                  </div>
                  <div className="appt-online-dot"/>
                </div>
              ))}
            </div>
          </div>

          {/* ── RIGHT: form / success ── */}
          <div className="appt-form-right">

            {success ? (
              <SuccessCard appt={bookedAppt} selDoc={selDoc} form={form} onReset={reset}/>
            ) : (
              <>
                {/* Step indicator */}
                <div className="appt-steps">
                  {["Your Details","Choose Doctor","Confirm & Book"].map((s, i) => (
                    <div key={s} className={`appt-step ${step === i+1 ? "active" : step > i+1 ? "done" : ""}`}>
                      <div className="appt-step-dot">{step > i+1 ? "✓" : i+1}</div>
                      <span>{s}</span>
                      {i < 2 && <div className="appt-step-line"/>}
                    </div>
                  ))}
                </div>

                {/* ── Step 1: Details ── */}
                {step === 1 && (
                  <div className="appt-form-card appt-anim">
                    <div className="appt-form-card-hd">
                      <h3>Your Information</h3>
                      <p>Tell us about yourself and what you need.</p>
                    </div>
                    <div className="appt-form-grid">
                      <Field label="Full Name *" error={errors.name}>
                        <div className="appt-input-wrap">
                          <input className={`appt-input${errors.name?" appt-input--err":""}`}
                            type="text" placeholder="Jean Dupont"
                            value={form.name} onChange={e=>set("name",e.target.value)}/>
                          <span className="appt-field-icon">👤</span>
                        </div>
                      </Field>

                      <Field label="Phone Number *" error={errors.phone}>
                        <div className="appt-input-wrap">
                          <input className={`appt-input${errors.phone?" appt-input--err":""}`}
                            type="tel" placeholder="+237 6XX XXX XXX"
                            value={form.phone} onChange={e=>set("phone",e.target.value)}/>
                          <span className="appt-field-icon">📞</span>
                        </div>
                      </Field>

                      <Field label="Email Address *" error={errors.email}>
                        <div className="appt-input-wrap">
                          <input className={`appt-input${errors.email?" appt-input--err":""}`}
                            type="email" placeholder="you@email.com"
                            value={form.email} onChange={e=>set("email",e.target.value)}/>
                          <span className="appt-field-icon">✉</span>
                        </div>
                      </Field>

                      <Field label="Treatment Type *" error={errors.service}>
                        <div className="appt-input-wrap">
                          <select className={`appt-input appt-select${errors.service?" appt-input--err":""}`}
                            value={form.service} onChange={e=>set("service",e.target.value)}>
                            <option value="">Choose treatment…</option>
                            {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                          <span className="appt-field-icon appt-arrow">⌄</span>
                        </div>
                      </Field>

                      <Field label="Preferred Date *" error={errors.date}>
                        <div className="appt-input-wrap">
                          <input className={`appt-input${errors.date?" appt-input--err":""}`}
                            type="date" min={todayStr()}
                            value={form.date} onChange={e=>set("date",e.target.value)}/>
                          <span className="appt-field-icon">📅</span>
                        </div>
                      </Field>

                      <Field label="Preferred Time *" error={errors.time}>
                        <div className="appt-input-wrap">
                          <select className={`appt-input appt-select${errors.time?" appt-input--err":""}`}
                            value={form.time} onChange={e=>set("time",e.target.value)}>
                            <option value="">Select time…</option>
                            {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                          <span className="appt-field-icon appt-arrow">⌄</span>
                        </div>
                      </Field>

                      <Field label="Additional Notes" cls="appt-field--full">
                        <textarea className="appt-input appt-textarea" rows={3}
                          placeholder="Describe your concern, allergies, or any special request…"
                          value={form.notes} onChange={e=>set("notes",e.target.value)}/>
                      </Field>
                    </div>

                    <div className="appt-form-nav">
                      <div/>
                      <button className="appt-btn appt-btn-primary" onClick={nextStep}>
                        Choose Doctor →
                      </button>
                    </div>
                  </div>
                )}

                {/* ── Step 2: Doctor selection ── */}
                {step === 2 && (
                  <div className="appt-form-card appt-anim">
                    <div className="appt-form-card-hd">
                      <h3>Choose Your Doctor</h3>
                      <p>Select the specialist you'd like to see for <strong>{form.service}</strong>.</p>
                    </div>

                    {errors.doctorId && (
                      <div className="appt-err-banner">{errors.doctorId}</div>
                    )}

                    <div className="appt-doctor-list">
                      {doctors.map(d => (
                        <div
                          key={d.id}
                          className={`appt-doctor-card ${form.doctorId === d.id ? "selected" : ""}`}
                          onClick={() => set("doctorId", d.id)}
                        >
                          {form.doctorId === d.id && (
                            <div className="appt-doctor-check">✓ Selected</div>
                          )}
                          <div className="appt-doctor-card-inner">
                            <Avatar name={d.name} size={52}/>
                            <div className="appt-doctor-info">
                              <div className="appt-doctor-name">{d.name}</div>
                              <div className="appt-doctor-spec">{d.specialty}</div>
                              <div className="appt-doctor-meta">
                                <span className="appt-stars">{"★".repeat(Math.round(d.rating))}</span>
                                <span className="appt-rating">{d.rating}</span>
                                <span className="appt-sep">·</span>
                                <span>{d.experience}</span>
                                <span className="appt-sep">·</span>
                                <span>📍 {d.location}</span>
                              </div>
                              <p className="appt-doctor-bio">{d.bio}</p>
                              <div className="appt-doctor-fee">
                                <span className="appt-fee-val">{(d.consultFee||15000).toLocaleString("fr-CM")} XAF</span>
                                <span className="appt-fee-lbl">/ consultation</span>
                              </div>
                            </div>
                            <div className="appt-doctor-avail">
                              <span className="appt-avail-dot"/>
                              <span>Available</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="appt-form-nav">
                      <button className="appt-btn appt-btn-ghost" onClick={() => setStep(1)}>← Back</button>
                      <button className="appt-btn appt-btn-primary" onClick={nextStep}>
                        Review Booking →
                      </button>
                    </div>
                  </div>
                )}

                {/* ── Step 3: Confirm ── */}
                {step === 3 && (
                  <div className="appt-form-card appt-anim">
                    <div className="appt-form-card-hd">
                      <h3>Review & Confirm</h3>
                      <p>Check your booking details before sending.</p>
                    </div>

                    {/* Doctor banner */}
                    {selDoc && (
                      <div className="appt-confirm-doc">
                        <Avatar name={selDoc.name} size={50}/>
                        <div>
                          <div style={{ fontWeight:700, fontSize:16 }}>{selDoc.name}</div>
                          <div style={{ fontSize:13, color:"var(--appt-muted)" }}>{selDoc.specialty} · {selDoc.location}</div>
                          <div style={{ marginTop:6, fontWeight:700, color:"var(--appt-blue)" }}>
                            {(selDoc.consultFee||15000).toLocaleString("fr-CM")} XAF
                          </div>
                        </div>
                        <button className="appt-btn appt-btn-ghost appt-btn-xs" onClick={() => setStep(2)}>Change</button>
                      </div>
                    )}

                    {/* Summary grid */}
                    <div className="appt-summary">
                      {[
                        ["Patient",   form.name],
                        ["Phone",     form.phone],
                        ["Email",     form.email],
                        ["Service",   form.service],
                        ["Date",      form.date],
                        ["Time",      form.time],
                        ["Notes",     form.notes || "—"],
                        ["Consultation Fee", selDoc ? `${(selDoc.consultFee||15000).toLocaleString("fr-CM")} XAF` : "—"],
                      ].map(([k, v]) => (
                        <div key={k} className="appt-summary-row">
                          <span>{k}</span>
                          <strong>{v}</strong>
                        </div>
                      ))}
                    </div>

                    {/* Info note */}
                    <div className="appt-info-note">
                      <span>ℹ</span>
                      <p>Your request will be sent to <strong>{selDoc?.name}</strong> for confirmation.
                        The admin team and the doctor will both be notified. You'll receive a confirmation
                        once the doctor approves your request.</p>
                    </div>

                    <div className="appt-form-nav">
                      <button className="appt-btn appt-btn-ghost" onClick={() => setStep(2)}>← Back</button>
                      <button className="appt-btn appt-btn-primary appt-btn-lg" onClick={submit} disabled={loading}>
                        {loading
                          ? <><span className="appt-spinner"/> Submitting…</>
                          : "📅 Confirm Booking"}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      {/* ══ LIVE BOOKINGS FEED ══ */}
      <LiveFeed/>

      {/* ══ PARTNERS ══ */}
      <section className="appt-partners">
        <p className="appt-partners-label">Trusted by leading organisations</p>
        <div className="appt-partners-inner">
          {PARTNERS.map(p => (
            <div key={p.name} className="appt-partner">
              <span className="appt-partner-sym">{p.sym}</span>
              <span className="appt-partner-name">{p.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ══ FEATURE CARDS ══ */}
      <section className="appt-features">
        <div className="appt-features-inner">
          {[
            { icon:"🦷", color:"appt-feat-blue",  title:"Expert Dental Care",       desc:"Our board-certified specialists cover everything from routine check-ups to complex oral surgery, with precision and compassion." },
            { icon:"🏥", color:"appt-feat-green", title:"World-Class Facilities",   desc:"State-of-the-art clinics equipped with the latest diagnostic and treatment technology for the best patient outcomes." },
            { icon:"📱", color:"appt-feat-navy",  title:"Seamless Digital Booking", desc:"Book, reschedule, and track your appointments in real time — from any device, 24 hours a day." },
            { icon:"🔔", color:"appt-feat-teal",  title:"Instant Notifications",    desc:"Doctors and admins are notified the moment you book. Confirmations are sent back to you in minutes." },
          ].map(f => (
            <div key={f.title} className={`appt-feat-card ${f.color}`}>
              <div className="appt-feat-icon-wrap">
                <span className="appt-feat-icon">{f.icon}</span>
              </div>
              <div className="appt-feat-body">
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer className="appt-footer">
        <div className="appt-footer-inner">
          <div className="appt-foot-col appt-foot-brand">
            <div className="appt-foot-logo">
              <span>🦷</span>
              <span className="appt-foot-logo-text">STECH Dental</span>
            </div>
            <p>Connecting patients with world-class dental specialists through a seamless digital platform.</p>
            <div className="appt-foot-social">
              {["f","in","𝕏","ig"].map(s => (
                <span key={s} className="appt-foot-social-btn">{s}</span>
              ))}
            </div>
          </div>

          <div className="appt-foot-col">
            <h4>Services</h4>
            <ul>
              {["General Dentistry","Orthodontics","Oral Surgery","Cosmetic Dentistry","Periodontics"].map(s => (
                <li key={s}><a href="#">{s}</a></li>
              ))}
            </ul>
          </div>

          <div className="appt-foot-col">
            <h4>Our Newsletter</h4>
            <p>Stay informed about dental health tips and clinic updates.</p>
            {nlDone ? (
              <p className="appt-nl-done">✓ Subscribed! Thank you.</p>
            ) : (
              <div className="appt-newsletter-wrap">
                <input type="email" placeholder="Enter your email…"
                  value={newsletter} onChange={e=>setNewsletter(e.target.value)}/>
                <button onClick={() => { if(newsletter.includes("@")) setNlDone(true); }}>→</button>
              </div>
            )}
          </div>

          <div className="appt-foot-col">
            <h4>Contact Us</h4>
            <ul>
              <li>✉ info@stechdental.cm</li>
              <li>📞 +237 699 000 001</li>
              <li>📍 Bonapriso, Douala — Cameroon</li>
            </ul>
          </div>
        </div>

        <div className="appt-foot-bottom">
          <span>© STECH Dental 2025. All Rights Reserved.</span>
          <div className="appt-foot-links">
            <a href="#">Terms &amp; Conditions</a>
            <a href="#">Privacy Policy</a>
            <a href="#">Cookie Policy</a>
          </div>
          <span className="appt-foot-domain">www.STECHDental.cm</span>
        </div>
      </footer>

      {/* ══ TOASTS ══ */}
      <div className="appt-toast-stack">
        {toasts.map(t => (
          <div key={t.id} className={`appt-toast appt-toast--${t.type}`}>
            <span>{t.type==="success"?"✓":"✕"}</span>{t.msg}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Field wrapper ── */
function Field({ label, error, cls = "", children }) {
  return (
    <div className={`appt-field ${error ? "err" : ""} ${cls}`}>
      <label>{label}</label>
      {children}
      {error && <p className="appt-field-err">{error}</p>}
    </div>
  );
}

/* ── Success card ── */
function SuccessCard({ appt, selDoc, form, onReset }) {
  return (
    <div className="appt-success appt-anim">
      <div className="appt-success-ripple">
        <div className="appt-success-icon">✓</div>
      </div>
      <h3>Appointment Request Sent!</h3>
      <p>
        Thank you, <strong>{appt?.patientName}</strong>. Your booking with{" "}
        <strong>{selDoc?.name}</strong> has been received and is{" "}
        <span className="appt-status-pill">⏳ pending confirmation</span>.
      </p>

      <div className="appt-success-detail">
        {[
          ["Service",   appt?.healthType],
          ["Date",      appt?.date],
          ["Time",      appt?.time],
          ["Doctor",    selDoc?.name],
          ["Specialty", selDoc?.specialty],
          ["Fee",       `${(appt?.amount||15000).toLocaleString("fr-CM")} XAF`],
          ["Ref",       appt?.id],
        ].map(([k, v]) => (
          <div key={k} className="appt-success-row">
            <span>{k}</span><strong>{v}</strong>
          </div>
        ))}
      </div>

      {/* Live status tracker */}
      <div className="appt-tracker">
        <div className="appt-tracker-title">Booking Status</div>
        <div className="appt-tracker-steps">
          {[
            { label:"Submitted",   done:true  },
            { label:"Doctor Review",done:false },
            { label:"Confirmed",   done:false },
            { label:"Visit",       done:false },
          ].map((s, i) => (
            <div key={s.label} className={`appt-tracker-step ${s.done?"done":i===1?"active":""}`}>
              <div className="appt-tracker-dot">{s.done?"✓":i+1}</div>
              <span>{s.label}</span>
              {i < 3 && <div className="appt-tracker-line"/>}
            </div>
          ))}
        </div>
        <p className="appt-tracker-note">
          🔔 You'll be notified at <strong>{form.email}</strong> once {selDoc?.name} confirms your appointment.
        </p>
      </div>

      <div style={{ display:"flex", gap:12, marginTop:24, justifyContent:"center", flexWrap:"wrap" }}>
        <button className="appt-btn appt-btn-ghost" onClick={onReset}>Book Another</button>
        <Link to="/">
          <button className="appt-btn appt-btn-primary">← Back to Home</button>
        </Link>
      </div>
    </div>
  );
}

/* ── Live feed of recent confirmed bookings ── */
function LiveFeed() {
  const [items, setItems] = useState([]);
  const [tick,  setTick]  = useState(0);

  useEffect(() => {
    const all = apptDB.all()
      .filter(a => a.status !== "cancelled")
      .slice(-6).reverse();
    setItems(all);
  }, [tick]);

  useEffect(() => {
    const h = () => setTick(t => t + 1);
    window.addEventListener("stech_refresh", h);
    return () => window.removeEventListener("stech_refresh", h);
  }, []);

  if (items.length === 0) return null;

  return (
    <section className="appt-live-feed">
      <div className="appt-live-feed-inner">
        <div className="appt-live-feed-hd">
          <div className="appt-live-badge">
            <span className="appt-live-dot"/>LIVE
          </div>
          <span className="appt-live-title">Recent Appointment Activity</span>
        </div>
        <div className="appt-live-grid">
          {items.map(a => (
            <div key={a.id} className="appt-live-card">
              <Avatar name={a.patientName} size={36}/>
              <div style={{ flex:1, overflow:"hidden" }}>
                <div style={{ fontWeight:700, fontSize:13, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                  {a.patientName}
                </div>
                <div style={{ fontSize:11, color:"var(--appt-muted)" }}>{a.healthType} · {a.date}</div>
              </div>
              <div className={`appt-live-status appt-live-status--${a.status}`}>{a.status}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}