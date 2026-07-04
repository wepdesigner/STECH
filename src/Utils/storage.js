// ─── STECH Dental · LocalStorage Layer ──────────────────────────
// All persistence goes through this file. Swapping to real API = change imports only.

const KEYS = {
  USERS:         "stech_users",
  CURRENT_USER:  "stech_current_user",
  APPOINTMENTS:  "stech_appointments",
  PATIENTS:      "stech_patients",
  DOCTORS:       "stech_doctors",
  CONSULTATIONS: "stech_consultations",
  PRESCRIPTIONS: "stech_prescriptions",
  PAYMENTS:      "stech_payments",
  NOTIFICATIONS: "stech_notifications",
  HOME_REQUESTS: "stech_home_requests",
  MESSAGES:      "stech_messages",
  RECORDS:       "stech_medical_records",
};

const get  = (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };
const set  = (k, v) => localStorage.setItem(k, JSON.stringify(v));
export const uid  = () => `${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
export const now  = () => new Date().toISOString();
const today = () => new Date().toISOString().split("T")[0];

// ── Seed ──────────────────────────────────────────────────────────
export function seedIfEmpty() {
  if (get(KEYS.USERS)) return;

  const doctors = [
    { id:"d1", role:"doctor", name:"Dr. Molack Steve",   email:"steve@stech.com",  password:"doctor123", specialty:"Orthodontist",   phone:"+237 677 001 001", avatar:null, status:"active", bio:"10+ years in orthodontics. Specialises in braces and aligners.", rating:4.9, experience:"10 years", location:"Douala, Cameroon", createdAt:now() },
    { id:"d2", role:"doctor", name:"Dr. Sarah Okafor",   email:"sarah@stech.com",  password:"doctor123", specialty:"Periodontist",   phone:"+237 677 002 002", avatar:null, status:"active", bio:"8 years expertise in gum disease treatment.", rating:4.7, experience:"8 years",  location:"Yaoundé, Cameroon", createdAt:now() },
    { id:"d3", role:"doctor", name:"Dr. James Trent",    email:"james@stech.com",  password:"doctor123", specialty:"Oral Surgeon",   phone:"+237 677 003 003", avatar:null, status:"active", bio:"12 years of complex oral surgery.", rating:4.8, experience:"12 years", location:"Douala, Cameroon", createdAt:now() },
    { id:"d4", role:"doctor", name:"Dr. Amira Haddad",   email:"amira@stech.com",  password:"doctor123", specialty:"General Dentist",phone:"+237 677 004 004", avatar:null, status:"active", bio:"Family dentist focused on preventive care.", rating:4.6, experience:"6 years",  location:"Bafoussam, Cameroon", createdAt:now() },
  ];

  const patients = [
    { id:"p1", role:"patient", name:"Mike Robin",     email:"mike@mail.com",    password:"patient123", phone:"+237 690 100 100", dob:"1990-05-14", bloodType:"A+",  allergies:"None",      membership:false, avatar:null, status:"active", address:"Akwa, Douala",    emergency:"555-0199", createdAt:now() },
    { id:"p2", role:"patient", name:"Jane Black",     email:"jane@mail.com",    password:"patient123", phone:"+237 690 200 200", dob:"1988-11-22", bloodType:"B+",  allergies:"Penicillin",membership:true,  avatar:null, status:"active", address:"Bastos, Yaoundé", emergency:"555-0298", createdAt:now() },
    { id:"p3", role:"patient", name:"Esther Wilson",  email:"esther@mail.com",  password:"patient123", phone:"+237 690 300 300", dob:"1995-03-08", bloodType:"O+",  allergies:"None",      membership:true,  avatar:null, status:"active", address:"Bonanjo, Douala", emergency:"555-0397", createdAt:now() },
    { id:"p4", role:"patient", name:"Andy Mcconnell", email:"andy@mail.com",    password:"patient123", phone:"+237 690 400 400", dob:"1992-07-30", bloodType:"AB-", allergies:"Latex",     membership:false, avatar:null, status:"active", address:"Omnisport, Yaoundé",emergency:"555-0496", createdAt:now() },
    { id:"p5", role:"patient", name:"Melisa Cooper",  email:"melisa@mail.com",  password:"patient123", phone:"+237 690 500 500", dob:"1985-01-17", bloodType:"A-",  allergies:"None",      membership:false, avatar:null, status:"active", address:"Bonaberi, Douala",emergency:"555-0595", createdAt:now() },
  ];

  const admin = [{ id:"a1", role:"admin", name:"Admin STECH", email:"admin@stech.com", password:"admin123", phone:"+237 699 000 000", avatar:null, status:"active", createdAt:now() }];

  set(KEYS.USERS, [...admin, ...doctors, ...patients]);
  set(KEYS.DOCTORS, doctors);
  set(KEYS.PATIENTS, patients);

  const appointments = [
    { id:uid(), patientId:"p1", patientName:"Mike Robin",    doctorId:"d1", doctorName:"Dr. Molack Steve", healthType:"Consultation",         date:"2024-10-25", time:"12:00", status:"confirmed", notes:"",                membership:false, read:true,  createdAt:now() },
    { id:uid(), patientId:"p2", patientName:"Jane Black",    doctorId:"d1", doctorName:"Dr. Molack Steve", healthType:"Wisdom Teeth Removal", date:"2024-10-25", time:"14:00", status:"confirmed", notes:"Member priority",  membership:true,  read:true,  createdAt:now() },
    { id:uid(), patientId:"p3", patientName:"Esther Wilson", doctorId:"d1", doctorName:"Dr. Molack Steve", healthType:"Bleaching",            date:"2024-10-26", time:"11:00", status:"confirmed", notes:"",                membership:true,  read:true,  createdAt:now() },
    { id:uid(), patientId:"p4", patientName:"Andy Mcconnell",doctorId:"d2", doctorName:"Dr. Sarah Okafor", healthType:"Scaling",              date:"2024-10-26", time:"12:30", status:"confirmed", notes:"",                membership:false, read:true,  createdAt:now() },
    { id:uid(), patientId:"p5", patientName:"Melisa Cooper", doctorId:"d3", doctorName:"Dr. James Trent",  healthType:"Consultation",         date:"2024-10-26", time:"13:45", status:"pending",   notes:"First visit",     membership:false, read:false, createdAt:now() },
    { id:uid(), patientId:"p2", patientName:"Jane Black",    doctorId:"d1", doctorName:"Dr. Molack Steve", healthType:"Root Canal",           date:"2024-10-23", time:"10:00", status:"confirmed", notes:"",                membership:true,  read:true,  createdAt:now() },
    { id:uid(), patientId:"p4", patientName:"Andy Mcconnell",doctorId:"d2", doctorName:"Dr. Sarah Okafor", healthType:"X-Ray",                date:"2024-10-27", time:"09:00", status:"pending",   notes:"",                membership:false, read:false, createdAt:now() },
    { id:uid(), patientId:"p1", patientName:"Mike Robin",    doctorId:"d4", doctorName:"Dr. Amira Haddad", healthType:"Consultation",         date:today(),      time:"15:00", status:"pending",   notes:"Follow-up",       membership:false, read:false, createdAt:now() },
  ];
  set(KEYS.APPOINTMENTS, appointments);

  const consultations = [
    { id:uid(), patientId:"p1", patientName:"Mike Robin",    doctorId:"d1", type:"chat",  status:"completed", date:"2024-10-20", time:"10:00", duration:25, notes:"Follow-up required after procedure.", roomId:"room_001", createdAt:now() },
    { id:uid(), patientId:"p3", patientName:"Esther Wilson", doctorId:"d2", type:"video", status:"scheduled", date:"2024-10-28", time:"14:00", duration:0,  notes:"",                                    roomId:"room_002", createdAt:now() },
    { id:uid(), patientId:"p2", patientName:"Jane Black",    doctorId:"d1", type:"video", status:"scheduled", date:today(),      time:"16:00", duration:0,  notes:"",                                    roomId:"room_003", createdAt:now() },
  ];
  set(KEYS.CONSULTATIONS, consultations);

  const prescriptions = [
    { id:uid(), patientId:"p1", patientName:"Mike Robin", doctorId:"d1", doctorName:"Dr. Molack Steve", medication:"Amoxicillin 500mg", dosage:"3x daily", duration:"7 days",  notes:"Take after meals", date:"2024-10-20", createdAt:now() },
    { id:uid(), patientId:"p2", patientName:"Jane Black", doctorId:"d1", doctorName:"Dr. Molack Steve", medication:"Ibuprofen 400mg",   dosage:"2x daily", duration:"5 days",  notes:"With water",       date:"2024-10-22", createdAt:now() },
    { id:uid(), patientId:"p3", patientName:"Esther Wilson", doctorId:"d2", doctorName:"Dr. Sarah Okafor", medication:"Metronidazole 250mg", dosage:"3x daily", duration:"5 days", notes:"Finish course",  date:"2024-10-24", createdAt:now() },
  ];
  set(KEYS.PRESCRIPTIONS, prescriptions);

  const payments = [
    { id:uid(), patientId:"p1", patientName:"Mike Robin",    doctorId:"d1", amount:15000, currency:"XAF", method:"Mobile Money", status:"paid",    service:"Consultation",         txRef:"TX001", date:"2024-10-20", createdAt:now() },
    { id:uid(), patientId:"p2", patientName:"Jane Black",    doctorId:"d1", amount:45000, currency:"XAF", method:"Card",         status:"paid",    service:"Wisdom Teeth Removal", txRef:"TX002", date:"2024-10-22", createdAt:now() },
    { id:uid(), patientId:"p3", patientName:"Esther Wilson", doctorId:"d1", amount:25000, currency:"XAF", method:"Mobile Money", status:"pending", service:"Bleaching",            txRef:"TX003", date:"2024-10-25", createdAt:now() },
    { id:uid(), patientId:"p4", patientName:"Andy Mcconnell",doctorId:"d2", amount:12000, currency:"XAF", method:"Cash",         status:"paid",    service:"Scaling",              txRef:"TX004", date:"2024-10-26", createdAt:now() },
  ];
  set(KEYS.PAYMENTS, payments);

  const homeRequests = [
    { id:uid(), patientId:"p5", patientName:"Melisa Cooper", doctorId:"d4", doctorName:"Dr. Amira Haddad", address:"Bonaberi, Douala", date:"2024-10-28", time:"10:00", status:"pending",   service:"Scaling",   notes:"", lat:4.0511, lng:9.7679, createdAt:now() },
    { id:uid(), patientId:"p1", patientName:"Mike Robin",    doctorId:"d1", doctorName:"Dr. Molack Steve", address:"Akwa, Douala",     date:"2024-10-29", time:"09:00", status:"accepted",  service:"Check-up",  notes:"", lat:4.0483, lng:9.7034, createdAt:now() },
  ];
  set(KEYS.HOME_REQUESTS, homeRequests);

  const records = [
    { id:uid(), patientId:"p1", doctorId:"d1", title:"Root Canal - Oct 2024", type:"procedure", description:"Successful root canal on lower molar.", date:"2024-10-20", attachments:[], createdAt:now() },
    { id:uid(), patientId:"p2", doctorId:"d1", title:"Wisdom Teeth X-Ray",    type:"imaging",   description:"Pre-op X-Ray for wisdom teeth removal.", date:"2024-10-22", attachments:[], createdAt:now() },
  ];
  set(KEYS.RECORDS, records);

  // Notifications per user
  const allUsers = [...admin, ...doctors, ...patients];
  const notifs = allUsers.map(u => ({ userId:u.id, items:[
    { id:uid(), title:"Welcome to STECH Dental!", body:"Your account is ready. Explore the dashboard.", read:false, type:"system", createdAt:now() },
  ]}));
  set(KEYS.NOTIFICATIONS, notifs);
  set(KEYS.MESSAGES, []);
}

// ── Auth ──────────────────────────────────────────────────────────
export const auth = {
  login(email, password, role) {
    const users = get(KEYS.USERS) || [];
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password && u.role === role);
    if (!user) return { success:false, error:"Invalid credentials or incorrect role selected." };
    if (user.status === "inactive") return { success:false, error:"Account is deactivated. Contact admin." };
    const { password:_p, ...safe } = user;
    set(KEYS.CURRENT_USER, safe);
    return { success:true, user:safe };
  },
  logout() { localStorage.removeItem(KEYS.CURRENT_USER); },
  current() { return get(KEYS.CURRENT_USER); },
  register(data) {
    const users = get(KEYS.USERS) || [];
    if (users.find(u => u.email.toLowerCase() === data.email.toLowerCase())) return { success:false, error:"Email already in use." };
    const newUser = { id:uid(), role:"patient", status:"active", membership:false, avatar:null, createdAt:now(), ...data };
    users.push(newUser);
    set(KEYS.USERS, users);
    const patients = get(KEYS.PATIENTS) || [];
    patients.push(newUser);
    set(KEYS.PATIENTS, patients);
    // notif
    const notifs = get(KEYS.NOTIFICATIONS) || [];
    notifs.push({ userId:newUser.id, items:[{ id:uid(), title:"Welcome!", body:"Account created successfully.", read:false, type:"system", createdAt:now() }] });
    set(KEYS.NOTIFICATIONS, notifs);
    const { password:_p, ...safe } = newUser;
    set(KEYS.CURRENT_USER, safe);
    return { success:true, user:safe };
  },
  updateProfile(userId, updates) {
    const users = get(KEYS.USERS) || [];
    const idx = users.findIndex(u => u.id === userId);
    if (idx === -1) return { success:false };
    users[idx] = { ...users[idx], ...updates };
    set(KEYS.USERS, users);
    // mirror
    const rk = users[idx].role === "doctor" ? KEYS.DOCTORS : KEYS.PATIENTS;
    const rl = get(rk) || [];
    const ri = rl.findIndex(u => u.id === userId);
    if (ri !== -1) { rl[ri] = { ...rl[ri], ...updates }; set(rk, rl); }
    const { password:_p, ...safe } = users[idx];
    set(KEYS.CURRENT_USER, safe);
    return { success:true, user:safe };
  },
  changePassword(userId, oldPw, newPw) {
    const users = get(KEYS.USERS) || [];
    const idx = users.findIndex(u => u.id === userId);
    if (idx === -1 || users[idx].password !== oldPw) return { success:false, error:"Current password incorrect." };
    users[idx].password = newPw;
    set(KEYS.USERS, users);
    return { success:true };
  },
};

// ── Appointments ──────────────────────────────────────────────────
export const appointmentDB = {
  all()                 { return get(KEYS.APPOINTMENTS) || []; },
  forDoctor(doctorId)   { return this.all().filter(a => a.doctorId === doctorId); },
  forPatient(patientId) { return this.all().filter(a => a.patientId === patientId); },
  byId(id)              { return this.all().find(a => a.id === id); },
  add(data) {
    const list = this.all();
    const item = { id:uid(), status:"pending", read:false, createdAt:now(), ...data };
    list.push(item);
    set(KEYS.APPOINTMENTS, list);
    notifDB.push(data.doctorId, { title:"New Appointment", body:`${data.patientName} booked ${data.healthType}`, type:"appointment" });
    return item;
  },
  update(id, updates) {
    const list = this.all();
    const idx = list.findIndex(a => a.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...updates };
    set(KEYS.APPOINTMENTS, list);
    return list[idx];
  },
  delete(id) { set(KEYS.APPOINTMENTS, this.all().filter(a => a.id !== id)); },
  markReadForDoctor(doctorId) {
    set(KEYS.APPOINTMENTS, this.all().map(a => a.doctorId === doctorId ? { ...a, read:true } : a));
  },
  unreadCount(doctorId) { return this.forDoctor(doctorId).filter(a => !a.read).length; },
};

// ── Patients ──────────────────────────────────────────────────────
export const patientDB = {
  all()    { return get(KEYS.PATIENTS) || []; },
  byId(id) { return this.all().find(p => p.id === id); },
  update(id, updates) {
    const list = this.all();
    const idx = list.findIndex(p => p.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...updates };
    set(KEYS.PATIENTS, list);
    return list[idx];
  },
  delete(id) {
    set(KEYS.PATIENTS, this.all().filter(p => p.id !== id));
    const users = get(KEYS.USERS) || [];
    set(KEYS.USERS, users.filter(u => u.id !== id));
  },
};

// ── Doctors ───────────────────────────────────────────────────────
export const doctorDB = {
  all()    { return get(KEYS.DOCTORS) || []; },
  byId(id) { return this.all().find(d => d.id === id); },
  update(id, updates) {
    const list = this.all();
    const idx = list.findIndex(d => d.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...updates };
    set(KEYS.DOCTORS, list);
    return list[idx];
  },
};

// ── Consultations ─────────────────────────────────────────────────
export const consultationDB = {
  all()                 { return get(KEYS.CONSULTATIONS) || []; },
  forDoctor(doctorId)   { return this.all().filter(c => c.doctorId === doctorId); },
  forPatient(patientId) { return this.all().filter(c => c.patientId === patientId); },
  add(data) {
    const list = this.all();
    const item = { id:uid(), status:"scheduled", roomId:`room_${uid()}`, createdAt:now(), ...data };
    list.push(item);
    set(KEYS.CONSULTATIONS, list);
    notifDB.push(data.doctorId, { title:"New Consultation", body:`${data.type} consultation requested`, type:"consultation" });
    return item;
  },
  update(id, updates) {
    const list = this.all();
    const idx = list.findIndex(c => c.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...updates };
    set(KEYS.CONSULTATIONS, list);
    return list[idx];
  },
};

// ── Prescriptions ─────────────────────────────────────────────────
export const prescriptionDB = {
  all()                 { return get(KEYS.PRESCRIPTIONS) || []; },
  forPatient(patientId) { return this.all().filter(p => p.patientId === patientId); },
  forDoctor(doctorId)   { return this.all().filter(p => p.doctorId === doctorId); },
  add(data) {
    const list = this.all();
    const item = { id:uid(), date:today(), createdAt:now(), ...data };
    list.push(item);
    set(KEYS.PRESCRIPTIONS, list);
    notifDB.push(data.patientId, { title:"New Prescription", body:`${data.medication} prescribed`, type:"prescription" });
    return item;
  },
};

// ── Medical Records ───────────────────────────────────────────────
export const recordDB = {
  all()                 { return get(KEYS.RECORDS) || []; },
  forPatient(patientId) { return this.all().filter(r => r.patientId === patientId); },
  add(data) {
    const list = this.all();
    const item = { id:uid(), date:today(), attachments:[], createdAt:now(), ...data };
    list.push(item);
    set(KEYS.RECORDS, list);
    return item;
  },
};

// ── Payments ──────────────────────────────────────────────────────
export const paymentDB = {
  all()                 { return get(KEYS.PAYMENTS) || []; },
  forPatient(patientId) { return this.all().filter(p => p.patientId === patientId); },
  forDoctor(doctorId)   { return this.all().filter(p => p.doctorId === doctorId); },
  add(data) {
    const list = this.all();
    const item = { id:uid(), status:"pending", txRef:`TX${Date.now()}`, createdAt:now(), ...data };
    list.push(item);
    set(KEYS.PAYMENTS, list);
    return item;
  },
  update(id, updates) {
    const list = this.all();
    const idx = list.findIndex(p => p.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...updates };
    set(KEYS.PAYMENTS, list);
    return list[idx];
  },
  totalRevenue()        { return this.all().filter(p => p.status === "paid").reduce((s, p) => s + p.amount, 0); },
};

// ── Home Requests ─────────────────────────────────────────────────
export const homeRequestDB = {
  all()                 { return get(KEYS.HOME_REQUESTS) || []; },
  forDoctor(doctorId)   { return this.all().filter(r => r.doctorId === doctorId); },
  forPatient(patientId) { return this.all().filter(r => r.patientId === patientId); },
  add(data) {
    const list = this.all();
    const item = { id:uid(), status:"pending", createdAt:now(), ...data };
    list.push(item);
    set(KEYS.HOME_REQUESTS, list);
    notifDB.push(data.doctorId, { title:"Home Visit Requested", body:`${data.patientName} at ${data.address}`, type:"home_visit" });
    return item;
  },
  update(id, updates) {
    const list = this.all();
    const idx = list.findIndex(r => r.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...updates };
    set(KEYS.HOME_REQUESTS, list);
    return list[idx];
  },
};

// ── Notifications ─────────────────────────────────────────────────
export const notifDB = {
  forUser(userId)  { return (get(KEYS.NOTIFICATIONS)||[]).find(e => e.userId === userId)?.items || []; },
  push(userId, data) {
    const all = get(KEYS.NOTIFICATIONS) || [];
    const item = { id:uid(), read:false, createdAt:now(), ...data };
    const idx = all.findIndex(e => e.userId === userId);
    if (idx !== -1) all[idx].items.unshift(item);
    else all.push({ userId, items:[item] });
    set(KEYS.NOTIFICATIONS, all);
  },
  markAllRead(userId) {
    const all = get(KEYS.NOTIFICATIONS) || [];
    const idx = all.findIndex(e => e.userId === userId);
    if (idx !== -1) { all[idx].items = all[idx].items.map(i => ({ ...i, read:true })); set(KEYS.NOTIFICATIONS, all); }
  },
  unreadCount(userId) { return this.forUser(userId).filter(i => !i.read).length; },
};

// ── Messages ──────────────────────────────────────────────────────
export const messageDB = {
  all() { return get(KEYS.MESSAGES) || []; },
  thread(a, b) {
    return this.all()
      .filter(m => (m.senderId===a && m.receiverId===b)||(m.senderId===b && m.receiverId===a))
      .sort((x, y) => new Date(x.createdAt) - new Date(y.createdAt));
  },
  send(senderId, receiverId, text) {
    const list = this.all();
    const msg = { id:uid(), senderId, receiverId, text, read:false, createdAt:now() };
    list.push(msg);
    set(KEYS.MESSAGES, list);
    return msg;
  },
  contacts(userId) {
    const all = this.all();
    const ids = new Set();
    all.filter(m => m.senderId===userId||m.receiverId===userId)
       .forEach(m => ids.add(m.senderId===userId ? m.receiverId : m.senderId));
    return [...ids];
  },
};