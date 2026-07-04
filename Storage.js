

// export const LS = {
//   get: (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
//   set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
// };

// export const uid  = () => Math.random().toString(36).slice(2, 10);
// export const now  = () => new Date().toISOString();
// export const todayStr = () => new Date().toISOString().split("T")[0];

// /* Generic DB factory — all panels share these key names */
// export const mkDB = (key) => ({
//   all:        ()          => LS.get(key, []),
//   get:        (id)        => LS.get(key, []).find(r => r.id === id) ?? null,
//   add:        (obj)       => { const rows = LS.get(key, []); rows.push(obj); LS.set(key, rows); return obj; },
//   update:     (id, patch) => {
//     const rows = LS.get(key, []).map(r => r.id === id ? { ...r, ...patch } : r);
//     LS.set(key, rows);
//     return rows.find(r => r.id === id) ?? null;
//   },
//   del:        (id)        => LS.set(key, LS.get(key, []).filter(r => r.id !== id)),
//   forPatient: (pid)       => LS.get(key, []).filter(r => r.patientId === pid),
//   forDoctor:  (did)       => LS.get(key, []).filter(r => r.doctorId  === did),
// });

// /* Shared DB instances — same keys used by every panel */
// export const doctorDB      = mkDB("adm_doctors");
// export const patientDB     = mkDB("adm_patients");
// export const apptDB        = mkDB("adm_appointments");
// export const payDB         = mkDB("adm_payments");
// export const msgDB         = mkDB("adm_messages");
// export const notifDB       = mkDB("adm_notifications");
// export const commDB        = mkDB("adm_commissions");
// export const forfaitDB     = mkDB("adm_forfaits");
// export const consultDB     = mkDB("adm_consultations");
// export const prescrDB      = mkDB("adm_prescriptions");
// export const recordDB      = mkDB("adm_records");
// export const homeVisitDB   = mkDB("adm_homevisits");
// export const scheduleDB    = mkDB("adm_schedule");

// /* Push a notification to a specific user (or "admin"/"all_doctors"/"all") */
// export function pushNotif(toId, type, title, body) {
//   notifDB.add({ id: uid(), toId, type, title, body, read: false, createdAt: now() });
// }

// /* Seed initial data once */
// export function seedIfEmpty() {
//   if (LS.get("adm_seeded_v3", false)) return;

//   doctorDB.all().length === 0 && [
//     { id:"d1", name:"Dr. Amara Nkosi",    email:"amara@stech.cm",  phone:"+237 677 111 001", specialty:"Cardiology",   experience:"12 yrs", rating:"4.9", status:"active",   bio:"Senior cardiologist with 12 years experience.", location:"Douala",    password:"doc123", consultFee:25000, commissionPct:12, createdAt:now() },
//     { id:"d2", name:"Dr. Boukar Jean",    email:"boukar@stech.cm", phone:"+237 677 111 002", specialty:"Dentistry",    experience:"8 yrs",  rating:"4.7", status:"active",   bio:"Dental specialist, all ages.", location:"Yaoundé",  password:"doc123", consultFee:15000, commissionPct:12, createdAt:now() },
//     { id:"d3", name:"Dr. Claire Fongang", email:"claire@stech.cm", phone:"+237 677 111 003", specialty:"Dermatology",  experience:"6 yrs",  rating:"4.5", status:"active",   bio:"Skin care and aesthetics expert.", location:"Douala",  password:"doc123", consultFee:18000, commissionPct:12, createdAt:now() },
//   ].forEach(d => doctorDB.add(d));

//   patientDB.all().length === 0 && [
//     { id:"p1", name:"Emmanuel Tabi",  email:"e.tabi@mail.cm",   phone:"+237 655 001 001", bloodType:"O+", membership:true,  status:"active", dob:"1990-04-12", address:"Rue de Joie, Bastos, Yaoundé", allergies:"Penicillin", forfait:"Premium", password:"pat123", createdAt:now() },
//     { id:"p2", name:"Fatima Oumarou", email:"f.oum@mail.cm",    phone:"+237 655 002 002", bloodType:"A+", membership:false, status:"active", dob:"1995-08-23", address:"Bali, Douala",                 allergies:"None",       forfait:"Basic",   password:"pat123", createdAt:now() },
//   ].forEach(p => patientDB.add(p));

//   forfaitDB.all().length === 0 && [
//     { id:"f1", name:"Basic",    price:20000, pct:10, description:"2 consultations/month, email support." },
//     { id:"f2", name:"Standard", price:35000, pct:12, description:"5 consultations, chat support, health records." },
//     { id:"f3", name:"Premium",  price:50000, pct:15, description:"Unlimited consultations, home visits, priority." },
//   ].forEach(f => forfaitDB.add(f));

//   LS.set("adm_seeded_v3", true);
// }




/**
 * Storage.js — STECH / ToothEase centralized data layer.
 * ═══════════════════════════════════════════════════════════════
 * Single source of truth for ALL panels (Patient / Doctor / Admin).
 * Place this file at: src/Storage.js  (root of src, two levels
 * above Pages/Patient/PatientPanel.jsx and Pages/Doctor/DoctorPanel.jsx
 * so both can `import ... from "../../Storage"`).
 *
 * Exports exactly what PatientPanel.jsx and DoctorPanel.jsx expect:
 *   uid, now, todayStr,
 *   doctorDB, patientDB, apptDB, payDB, msgDB, notifDB,
 *   consultDB, prescrDB, recordDB, homeVisitDB,
 *   pushNotif, seedIfEmpty
 */

/* ── Low-level localStorage bridge ── */
const LS = {
  get: (k, d = []) => {
    try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; }
    catch { return d; }
  },
  set: (k, v) => {
    try { localStorage.setItem(k, JSON.stringify(v)); } catch {}
  },
};

/* ── Helpers ── */
export const uid      = () => `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
export const now       = () => new Date().toISOString();
export const todayStr  = () => new Date().toISOString().split("T")[0];

/* ── Generic table factory ──
   Every DB exposes: all, get, add, update, del, forPatient, forDoctor, forTo, filter
   `get` doubles as `byId` (PatientPanel calls patientDB.get(id), doctorDB.get(id)) */
function makeTable(key) {
  return {
    key,
    all: () => LS.get(key, []),

    get: (id) => LS.get(key, []).find(r => r.id === id) || null,
    byId: (id) => LS.get(key, []).find(r => r.id === id) || null,

    add: (obj) => {
      const rows = LS.get(key, []);
      rows.push(obj);
      LS.set(key, rows);
      return obj;
    },

    update: (id, patch) => {
      const rows = LS.get(key, []).map(r =>
        r.id === id ? { ...r, ...patch, updatedAt: now() } : r
      );
      LS.set(key, rows);
      return rows.find(r => r.id === id) || null;
    },

    del: (id) => {
      LS.set(key, LS.get(key, []).filter(r => r.id !== id));
    },

    filter: (fn) => LS.get(key, []).filter(fn),

    forPatient: (pid) => LS.get(key, []).filter(r => r.patientId === pid),
    forDoctor:  (did) => LS.get(key, []).filter(r => r.doctorId === did),
    forTo:      (toId) => LS.get(key, []).filter(r => r.toId === toId),
  };
}

/* ══════════════════════════════════════════════════════════════
   DB INSTANCES — exact names PatientPanel.jsx / DoctorPanel.jsx import
══════════════════════════════════════════════════════════════ */
export const doctorDB     = makeTable("te_doctors");
export const patientDB    = makeTable("te_patients");
export const apptDB       = makeTable("te_appointments");
export const payDB        = makeTable("te_payments");
export const msgDB        = makeTable("te_messages");
export const notifDB      = makeTable("te_notifs");
export const consultDB    = makeTable("te_consultations");
export const prescrDB     = makeTable("te_prescriptions");
export const recordDB     = makeTable("te_records");
export const homeVisitDB  = makeTable("te_home_visits");

/* Admin-only mirror so the AdminPanel can monitor every patient/doctor
   interaction without re-deriving it from raw tables every render. */
export const adminFeedDB  = makeTable("adm_feed");

/* ══════════════════════════════════════════════════════════════
   VIDEO SESSION BUS
   The real shared room: both doctor and patient VideoCall.jsx
   instances poll te_vc_messages for the same consultation.id and
   write/read from the same session. This is what makes the call
   "live" instead of a static simulator.
══════════════════════════════════════════════════════════════ */
const vcMessagesDB = makeTable("te_vc_messages"); // { id, sessionId, fromId, fromName, role, body, type, ts }
const vcSessionsDB = makeTable("te_vc_sessions"); // { id, consultationId, doctorId, patientId, status, startedAt }

export const VideoSessionBus = {
  start: (consultationId, doctorId, patientId) => {
    const existing = vcSessionsDB.filter(s => s.consultationId === consultationId && s.status === "active")[0];
    if (existing) return existing;
    const session = vcSessionsDB.add({ id: uid(), consultationId, doctorId, patientId, status: "active", startedAt: now() });
    VideoSessionBus.sendSystem(session.id, "Session started. Connecting…");
    return session;
  },
  send: (sessionId, fromId, fromName, role, body) => {
    const msg = { id: uid(), sessionId, fromId, fromName, role, body, type: "text", ts: now() };
    vcMessagesDB.add(msg);
    window.dispatchEvent(new CustomEvent("te_vc_msg", { detail: msg }));
    return msg;
  },
  sendSystem: (sessionId, text) => {
    const msg = { id: uid(), sessionId, fromId: "system", fromName: "System", role: "system", body: text, type: "system", ts: now() };
    vcMessagesDB.add(msg);
    window.dispatchEvent(new CustomEvent("te_vc_msg", { detail: msg }));
    return msg;
  },
  getMessages: (sessionId) => vcMessagesDB.filter(m => m.sessionId === sessionId),
  end: (sessionId) => {
    vcSessionsDB.update(sessionId, { status: "ended", endedAt: now() });
    VideoSessionBus.sendSystem(sessionId, "Session ended.");
  },
  getActive: (consultationId) => vcSessionsDB.filter(s => s.consultationId === consultationId && s.status === "active")[0] || null,
};

/* ══════════════════════════════════════════════════════════════
   NOTIFICATIONS
   pushNotif always writes the direct notification AND mirrors a
   readable line to adm_feed, so AdminPanel sees doctor↔patient
   activity (appointments, video sessions, records, rx, messages…)
   without any extra wiring on the Admin side.
══════════════════════════════════════════════════════════════ */
export function pushNotif(toId, type, title, body) {
  const n = { id: uid(), toId, type, title, body, read: false, createdAt: now() };
  notifDB.add(n);

  // Mirror everything into the admin oversight feed
  adminFeedDB.add({
    id: uid(),
    type,
    title,
    body: toId === "admin" ? body : `[→ ${toId}] ${body}`,
    relatedTo: toId,
    createdAt: now(),
  });

  window.dispatchEvent(new CustomEvent("te_notif", { detail: n }));
  return n;
}

/* ══════════════════════════════════════════════════════════════
   SEED DATA
   Idempotent — only seeds once per browser (localStorage flag).
══════════════════════════════════════════════════════════════ */
export function seedIfEmpty() {
  if (LS.get("te_seed_flag_v1", false)) return;

  if (doctorDB.all().length === 0) {
    [
      { id:"d1", name:"Dr. Olivia Lim",   email:"olivia@stech.com", password:"doc123", specialty:"Orthodontist",    phone:"+237 677 001 001", status:"active",   rating:"4.9", experience:"8 yrs",  location:"Douala",    bio:"Expert in braces and smile alignment.", consultFee:15000, avatar:"", createdAt: now() },
      { id:"d2", name:"Dr. Marcus Bell",  email:"marcus@stech.com", password:"doc123", specialty:"Oral Surgeon",    phone:"+237 677 002 002", status:"active",   rating:"4.8", experience:"12 yrs", location:"Yaoundé",   bio:"Specialised in complex extractions.",   consultFee:25000, avatar:"", createdAt: now() },
      { id:"d3", name:"Dr. Sarah Chen",   email:"sarah@stech.com",  password:"doc123", specialty:"Periodontist",    phone:"+237 677 003 003", status:"active",   rating:"4.7", experience:"6 yrs",  location:"Douala",    bio:"Gum health and periodontal treatments.",consultFee:18000, avatar:"", createdAt: now() },
      { id:"d4", name:"Dr. James Reid",   email:"james@stech.com",  password:"doc123", specialty:"Endodontist",     phone:"+237 677 004 004", status:"inactive", rating:"4.9", experience:"9 yrs",  location:"Bafoussam", bio:"Root canal specialist.",                consultFee:20000, avatar:"", createdAt: now() },
      { id:"d5", name:"Dr. Amara Diallo", email:"amara@stech.com",  password:"doc123", specialty:"General Dentist", phone:"+237 677 005 005", status:"active",   rating:"4.6", experience:"5 yrs",  location:"Douala",    bio:"Full-spectrum general dental care.",    consultFee:12000, avatar:"", createdAt: now() },
    ].forEach(d => doctorDB.add(d));
  }

  if (patientDB.all().length === 0) {
    [
      { id:"p1", name:"Emmanuel Tabi",   email:"e.tabi@mail.com",   password:"pat123", phone:"+237 655 001 001", dob:"1990-04-12", bloodType:"O+", allergies:"None",       address:"Bonapriso, Douala", forfait:"Premium",  membership:true,  preferredDoctorId:"d1", status:"active", avatar:"", createdAt: now() },
      { id:"p2", name:"Fatima Oumarou",  email:"f.oum@mail.com",    password:"pat123", phone:"+237 655 002 002", dob:"1995-08-23", bloodType:"A+", allergies:"Penicillin", address:"Bastos, Yaoundé",   forfait:"Basic",    membership:false, preferredDoctorId:"d2", status:"active", avatar:"", createdAt: now() },
      { id:"p3", name:"Ngono Pierre",    email:"n.pierre@mail.com", password:"pat123", phone:"+237 655 003 003", dob:"1988-01-07", bloodType:"B-", allergies:"Latex",      address:"Akwa, Douala",      forfait:"Standard", membership:true,  preferredDoctorId:"d3", status:"active", avatar:"", createdAt: now() },
    ].forEach(p => patientDB.add(p));
  }

  LS.set("te_seed_flag_v1", true);
}