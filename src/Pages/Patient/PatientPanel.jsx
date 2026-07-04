// import { useState, useEffect, useRef, useCallback } from "react";
// import "../Styles/patient.css";
// import VideoCall from "../Doctor/VideoCall";
// import LiveMap   from "../Doctor/LiveMap";

// /* ═══════════════════════════════════════════════════════════════
//    SHARED STORAGE LAYER  (identical keys to AdminPanel)
// ═══════════════════════════════════════════════════════════════ */
// const LS = {
//   get: (k, d = []) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
//   set: (k, v)       => localStorage.setItem(k, JSON.stringify(v)),
// };
// const uid     = () => Math.random().toString(36).slice(2, 10);
// const nowISO  = () => new Date().toISOString();
// const todayStr= () => new Date().toISOString().split("T")[0];
// const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString("fr-CM", { day:"2-digit", month:"short", year:"numeric" }) : "—";
// const fmtMoney= (n)   => Number(n || 0).toLocaleString("fr-CM") + " XAF";
// const monthSh = (d)   => d ? new Date(d).toLocaleString("default", { month:"short" }) : "";

// /* ── Generic DB factory (mirrors AdminPanel) ── */
// const mkDB = (key, seedFn) => ({
//   all:        ()          => { const d = LS.get(key, null); return d ?? (seedFn ? seedFn() : []); },
//   byId:       (id)        => mkDB(key, seedFn).all().find(r => r.id === id),
//   add:        (obj)       => { const rows = mkDB(key, seedFn).all(); rows.push(obj); LS.set(key, rows); return obj; },
//   update:     (id, patch) => { const rows = mkDB(key, seedFn).all().map(r => r.id===id ? {...r,...patch} : r); LS.set(key, rows); return rows.find(r=>r.id===id); },
//   del:        (id)        => LS.set(key, mkDB(key, seedFn).all().filter(r => r.id !== id)),
//   forPatient: (pid)       => mkDB(key, seedFn).all().filter(r => r.patientId === pid),
//   forDoctor:  (did)       => mkDB(key, seedFn).all().filter(r => r.doctorId  === did),
// });

// /* ── DB instances (same keys AdminPanel uses) ── */
// const doctorDB       = mkDB("te_doctors");
// const patientDB      = mkDB("te_patients");
// const appointmentDB  = mkDB("te_appointments");
// const paymentDB      = mkDB("te_payments");
// const notifDB        = mkDB("te_notifs");
// const consultDB      = mkDB("te_consultations");
// const prescDB        = mkDB("te_prescriptions");
// const recordDB       = mkDB("te_records");
// const homeDB         = mkDB("te_home_visits");
// const messageDB      = mkDB("te_messages");

// /* ── Push notification ── */
// const pushNotif = (toId, type, title, body) =>
//   notifDB.add({ id:uid(), toId, type, title, body, read:false, createdAt:nowISO() });

// /* ── Seed doctors if admin panel hasn't run yet ── */
// (function seedDoctorsIfMissing() {
//   if (doctorDB.all().length === 0) {
//     const seed = [
//       { id:"d1", name:"Dr. Olivia Lim",  email:"olivia@te.com", phone:"+237 677 111 001", specialty:"Orthodontist", experience:"8 yrs",  rating:"4.9", status:"active",  bio:"Expert in braces and smile alignment.", location:"Douala",    consultFee:15000, commissionPct:20, createdAt:nowISO() },
//       { id:"d2", name:"Dr. Marcus Bell", email:"marcus@te.com", phone:"+237 677 111 002", specialty:"Oral Surgeon",  experience:"12 yrs", rating:"4.8", status:"active",  bio:"Specialised in complex extractions.",   location:"Yaoundé",   consultFee:25000, commissionPct:20, createdAt:nowISO() },
//       { id:"d3", name:"Dr. Sarah Chen",  email:"sarah@te.com",  phone:"+237 677 111 003", specialty:"Periodontist", experience:"6 yrs",  rating:"4.7", status:"active",  bio:"Gum health and periodontal treatments.",location:"Douala",    consultFee:18000, commissionPct:20, createdAt:nowISO() },
//       { id:"d4", name:"Dr. James Reid",  email:"james@te.com",  phone:"+237 677 111 004", specialty:"Endodontist",  experience:"9 yrs",  rating:"4.9", status:"inactive",bio:"Root canal specialist, 900+ cases.",    location:"Bafoussam", consultFee:20000, commissionPct:20, createdAt:nowISO() },
//     ];
//     seed.forEach(d => doctorDB.add(d));
//   }
// })();

// /* ── Register a patient (called from registration form) ── */
// export function registerPatient(data) {
//   const existing = patientDB.all().find(p => p.email === data.email);
//   if (existing) return { success:false, error:"Email already registered" };
//   const patient = {
//     id:         uid(),
//     name:       data.name,
//     email:      data.email,
//     phone:      data.phone || "",
//     dob:        data.dob   || "",
//     bloodType:  data.bloodType || "",
//     allergies:  data.allergies || "None",
//     address:    data.address   || "",
//     emergency:  data.emergency || "",
//     forfait:    data.forfait   || "Basic",
//     forfaitAmt: data.forfait === "Premium" ? 50000 : data.forfait === "Standard" ? 35000 : 20000,
//     membership: data.forfait === "Premium",
//     preferredDoctorId: data.preferredDoctorId || "",
//     status:     "active",
//     createdAt:  nowISO(),
//   };
//   patientDB.add(patient);
//   // Notify admin immediately
//   pushNotif("admin", "patient", "New Patient Registered",
//     `${patient.name} just created an account (${patient.forfait} plan).`);
//   return { success:true, patient };
// }

// /* ═══════════════════════════════════════════════════════════════
//    SHARED UI COMPONENTS
// ═══════════════════════════════════════════════════════════════ */
// const AVATAR_COLORS = ["#1e88e5","#00bfa5","#7c3aed","#f44336","#ff7043","#0891b2","#16a34a","#be185d"];
// function Avatar({ name="?", size=36 }) {
//   const initials = name.split(" ").map(n=>n[0]).join("").toUpperCase().slice(0,2);
//   const color    = AVATAR_COLORS[(name.charCodeAt(0)||0) % AVATAR_COLORS.length];
//   return (
//     <div className="pp-avatar" style={{ width:size, height:size, background:color, fontSize:size*.37, flexShrink:0 }}>
//       {initials}
//     </div>
//   );
// }

// function Badge({ status }) {
//   const MAP = { confirmed:"pp-b-green", active:"pp-b-green", paid:"pp-b-green", completed:"pp-b-green", online:"pp-b-green", accepted:"pp-b-green", pending:"pp-b-amber", scheduled:"pp-b-amber", inactive:"pp-b-gray", cancelled:"pp-b-red", busy:"pp-b-red", declined:"pp-b-red", premium:"pp-b-purple", standard:"pp-b-blue", basic:"pp-b-gray", video:"pp-b-purple", physical:"pp-b-blue", chat:"pp-b-teal" };
//   return <span className={`pp-badge ${MAP[status?.toLowerCase()] || "pp-b-gray"}`}>{status}</span>;
// }

// function Toast({ msg, type, onClose }) {
//   useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
//   return (
//     <div className={`pp-toast pp-toast--${type}`}>
//       <span className="pp-toast-icon">{type==="success"?"✓":type==="error"?"✕":"ℹ"}</span>
//       {msg}
//       <button className="pp-toast-close" onClick={onClose}>✕</button>
//     </div>
//   );
// }

// function Modal({ title, subtitle, onClose, children, width=520 }) {
//   useEffect(() => {
//     const h = e => e.key==="Escape" && onClose();
//     window.addEventListener("keydown", h);
//     return () => window.removeEventListener("keydown", h);
//   }, [onClose]);
//   return (
//     <div className="pp-modal-overlay" onClick={onClose}>
//       <div className="pp-modal" style={{ maxWidth:width }} onClick={e=>e.stopPropagation()}>
//         <div className="pp-modal-hd">
//           <div>
//             <div className="pp-modal-title">{title}</div>
//             {subtitle && <div className="pp-modal-sub">{subtitle}</div>}
//           </div>
//           <button className="pp-modal-close" onClick={onClose}><i className="ti ti-x"/></button>
//         </div>
//         <div className="pp-modal-bd">{children}</div>
//       </div>
//     </div>
//   );
// }

// function FG({ label, required, children }) {
//   return (
//     <div className="pp-fg">
//       <label className="pp-label">{label}{required && <span style={{color:"#f44336"}}>*</span>}</label>
//       {children}
//     </div>
//   );
// }

// function ConfirmDialog({ msg, onConfirm, onCancel }) {
//   return (
//     <div className="pp-modal-overlay" onClick={onCancel}>
//       <div className="pp-modal" style={{maxWidth:380}} onClick={e=>e.stopPropagation()}>
//         <div className="pp-modal-hd"><div className="pp-modal-title">⚠ Confirm</div></div>
//         <div className="pp-modal-bd">
//           <p style={{color:"var(--pp-muted)",marginBottom:24,lineHeight:1.7}}>{msg}</p>
//           <div style={{display:"flex",gap:10}}>
//             <button className="pp-btn pp-btn-ghost" style={{flex:1}} onClick={onCancel}>Cancel</button>
//             <button className="pp-btn pp-btn-danger" style={{flex:1}} onClick={onConfirm}>Confirm</button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// /* ═══════════════════════════════════════════════════════════════
//    NAV
// ═══════════════════════════════════════════════════════════════ */
// const NAV = [
//   { section:"Overview" },
//   { key:"overview",      icon:"ti-layout-dashboard", label:"Dashboard"       },
//   { section:"Services"  },
//   { key:"appointments",  icon:"ti-calendar-check",   label:"My Appointments" },
//   { key:"book",          icon:"ti-calendar-plus",    label:"Book Appointment"},
//   { key:"consultations", icon:"ti-video",            label:"Consultations"   },
//   { key:"home_visit",    icon:"ti-home-heart",       label:"Home Service"    },
//   { section:"Health"    },
//   { key:"prescriptions", icon:"ti-pill",             label:"Prescriptions"   },
//   { key:"records",       icon:"ti-clipboard-heart",  label:"Medical Records" },
//   { section:"Account"   },
//   { key:"payments",      icon:"ti-credit-card",      label:"Payments"        },
//   { key:"messages",      icon:"ti-message-circle",   label:"Messages"        },
//   { key:"notifications", icon:"ti-bell",             label:"Notifications"   },
//   { key:"profile",       icon:"ti-user-circle",      label:"My Profile"      },
// ];

// /* ═══════════════════════════════════════════════════════════════
//    ROOT — PatientPanel
//    Props:
//      patientId  – id of the logged-in patient
//      onLogout   – callback to return to login/landing
// ═══════════════════════════════════════════════════════════════ */
// export default function PatientPanel({ patientId, onLogout }) {
//   const [tab,      setTab]    = useState("overview");
//   const [sideOpen, setSide]   = useState(false);
//   const [toast,    setToast]  = useState(null);
//   const [patient,  setPatient]= useState(null);

//   const showToast = useCallback((msg, type="success") => setToast({ msg, type }), []);
//   const refreshMe = useCallback(() => setPatient(patientDB.byId(patientId) || null), [patientId]);

//   useEffect(() => { refreshMe(); }, [refreshMe]);
//   useEffect(() => {
//     window.addEventListener("stech_refresh", refreshMe);
//     return () => window.removeEventListener("stech_refresh", refreshMe);
//   }, [refreshMe]);

//   const unreadCount = notifDB.all().filter(n => n.toId===patientId && !n.read).length;
//   const unreadMsg   = messageDB.all().filter(m => m.toId===patientId && !m.read).length;

//   if (!patient) return (
//     <div style={{display:"flex",height:"100vh",alignItems:"center",justifyContent:"center",fontFamily:"'Plus Jakarta Sans',sans-serif",flexDirection:"column",gap:16,color:"#64748b"}}>
//       <div style={{fontSize:52}}>🦷</div>
//       <h2 style={{fontFamily:"'Playfair Display',serif"}}>Patient not found</h2>
//       <p>ID: {patientId} — please log in again.</p>
//       <button className="pp-btn pp-btn-primary" onClick={onLogout}>Back to Login</button>
//     </div>
//   );

//   const sp = { patient, patientId, showToast, refreshMe };

//   return (
//     <div className="pp-root">
//       {/* ── SIDEBAR ── */}
//       <aside className={`pp-sidebar ${sideOpen ? "pp-sidebar--open" : ""}`}>
//         <div className="pp-sidebar-brand">
//           <div className="pp-brand-mark"><i className="ti ti-tooth"/></div>
//           <div>
//             <div className="pp-brand-name">ToothEase</div>
//             <div className="pp-brand-sub">Patient Portal</div>
//           </div>
//           <button className="pp-sidebar-x" onClick={()=>setSide(false)}><i className="ti ti-x"/></button>
//         </div>

//         {/* Patient mini-card */}
//         <div className="pp-sidebar-card">
//           <Avatar name={patient.name} size={42}/>
//           <div className="pp-sidebar-info">
//             <strong>{patient.name}</strong>
//             <span>{patient.forfait} Plan</span>
//             {patient.membership && <span className="pp-member-chip">⭐ Member</span>}
//           </div>
//         </div>

//         <nav className="pp-nav">
//           {NAV.map((n, i) =>
//             n.section ? (
//               <div key={i} className="pp-nav-section">{n.section}</div>
//             ) : (
//               <button
//                 key={n.key}
//                 className={`pp-nav-item ${tab===n.key?"active":""}`}
//                 onClick={() => { setTab(n.key); setSide(false); }}
//               >
//                 <i className={`ti ${n.icon}`}/>
//                 <span>{n.label}</span>
//                 {n.key==="notifications" && unreadCount>0 && <span className="pp-nav-dot">{unreadCount}</span>}
//                 {n.key==="messages"      && unreadMsg>0   && <span className="pp-nav-dot">{unreadMsg}</span>}
//               </button>
//             )
//           )}
//         </nav>

//         <div className="pp-sidebar-foot">
//           <Avatar name={patient.name} size={32}/>
//           <div style={{flex:1,overflow:"hidden"}}>
//             <div style={{fontWeight:700,fontSize:13,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{patient.name}</div>
//             <div style={{fontSize:11,opacity:.65}}>Patient</div>
//           </div>
//           <button className="pp-logout-btn" onClick={onLogout} title="Log out">
//             <i className="ti ti-logout"/>
//           </button>
//         </div>
//       </aside>

//       {/* ── MAIN ── */}
//       <div className="pp-main">
//         {/* Topbar */}
//         <header className="pp-topbar">
//           <button className="pp-hamburger" onClick={()=>setSide(true)}><i className="ti ti-menu-2"/></button>
//           <div className="pp-topbar-title">{NAV.find(n=>n.key===tab)?.label || "Dashboard"}</div>
//           <div className="pp-topbar-right">
//             <button className="pp-icon-btn" onClick={()=>setTab("messages")} title="Messages">
//               <i className="ti ti-message-circle"/>
//               {unreadMsg>0 && <span className="pp-notif-dot">{unreadMsg}</span>}
//             </button>
//             <button className="pp-icon-btn" onClick={()=>setTab("notifications")} title="Notifications">
//               <i className="ti ti-bell"/>
//               {unreadCount>0 && <span className="pp-notif-dot">{unreadCount}</span>}
//             </button>
//             <div className="pp-topbar-profile" onClick={()=>setTab("profile")}>
//               <Avatar name={patient.name} size={30}/>
//               <span>{patient.name.split(" ")[0]}</span>
//             </div>
//             <button className="pp-logout-pill" onClick={onLogout}>
//               <i className="ti ti-logout"/> Logout
//             </button>
//           </div>
//         </header>

//         {/* Content */}
//         <main className="pp-content">
//           {tab==="overview"      && <PatOverview      {...sp} setTab={setTab}/>}
//           {tab==="appointments"  && <PatAppointments  {...sp} setTab={setTab}/>}
//           {tab==="book"          && <PatBooking       {...sp} setTab={setTab}/>}
//           {tab==="consultations" && <PatConsultations {...sp}/>}
//           {tab==="home_visit"    && <PatHomeVisit     {...sp}/>}
//           {tab==="prescriptions" && <PatPrescriptions {...sp}/>}
//           {tab==="records"       && <PatRecords       {...sp}/>}
//           {tab==="payments"      && <PatPayments      {...sp}/>}
//           {tab==="messages"      && <PatMessages      {...sp}/>}
//           {tab==="notifications" && <PatNotifications {...sp}/>}
//           {tab==="profile"       && <PatProfile       {...sp}/>}
//         </main>
//       </div>

//       {/* Mobile overlay */}
//       {sideOpen && <div className="pp-overlay" onClick={()=>setSide(false)}/>}

//       {/* Toast */}
//       {toast && <Toast msg={toast.msg} type={toast.type} onClose={()=>setToast(null)}/>}
//     </div>
//   );
// }

// /* ═══════════════════════════════════════════════════════════════
//    PAGE — OVERVIEW
// ═══════════════════════════════════════════════════════════════ */
// function PatOverview({ patient, patientId, setTab }) {
//   const appts    = appointmentDB.forPatient(patientId);
//   const consults = consultDB.forPatient(patientId);
//   const rxs      = prescDB.forPatient(patientId);
//   const payments = paymentDB.forPatient(patientId);
//   const doctors  = doctorDB.all().filter(d=>d.status==="active");

//   const upcoming = appts
//     .filter(a=>a.status!=="cancelled")
//     .sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));

//   const prefDoc = patient.preferredDoctorId
//     ? doctorDB.byId(patient.preferredDoctorId)
//     : null;

//   const h = new Date().getHours();
//   const greeting = h<12?"morning":h<18?"afternoon":"evening";

//   return (
//     <div className="pp-animate">
//       {/* Hero welcome bar */}
//       <div className="pp-welcome-bar">
//         <div className="pp-welcome-text">
//           <h1>Good {greeting}, <em>{patient.name.split(" ")[0]}</em> 👋</h1>
//           <p>{new Date().toDateString()} · Your dental health, all in one place.</p>
//         </div>
//         <button className="pp-btn pp-btn-white" onClick={()=>setTab("book")}>
//           <i className="ti ti-calendar-plus"/> Book Appointment
//         </button>
//       </div>

//       {/* Stats */}
//       <div className="pp-stats-grid">
//         {[
//           { icon:"ti-calendar-check", label:"Appointments",    value:appts.length,    bg:"#dbeafe", c:"#1e88e5", trend:`${appts.filter(a=>a.status==="confirmed").length} confirmed`,    nav:"appointments" },
//           { icon:"ti-video",          label:"Consultations",   value:consults.length, bg:"#ede9fe", c:"#7c3aed", trend:`${consults.filter(c=>c.status==="scheduled").length} upcoming`,   nav:"consultations" },
//           { icon:"ti-pill",           label:"Prescriptions",   value:rxs.length,      bg:"#dcfce7", c:"#16a34a", trend:"Active medications",                                              nav:"prescriptions" },
//           { icon:"ti-credit-card",    label:"Payments",        value:payments.length, bg:"#fef3c7", c:"#d97706", trend:`${payments.filter(p=>p.status==="pending").length} pending`,      nav:"payments"      },
//         ].map(s => (
//           <div key={s.label} className="pp-stat-card" onClick={()=>setTab(s.nav)}>
//             <div className="pp-stat-icon" style={{background:s.bg, color:s.c}}><i className={`ti ${s.icon}`}/></div>
//             <div>
//               <div className="pp-stat-label">{s.label}</div>
//               <div className="pp-stat-value">{s.value}</div>
//               <div className="pp-stat-trend">{s.trend}</div>
//             </div>
//             <i className="ti ti-chevron-right pp-stat-chevron"/>
//           </div>
//         ))}
//       </div>

//       <div className="pp-two-col">
//         {/* Upcoming appointments */}
//         <div className="pp-card">
//           <div className="pp-card-hd">
//             <div><div className="pp-card-title">Upcoming Appointments</div></div>
//             <button className="pp-ghost-btn" onClick={()=>setTab("appointments")}>View all →</button>
//           </div>
//           {upcoming.length === 0 ? (
//             <div className="pp-empty">
//               <i className="ti ti-calendar-off" style={{fontSize:36,color:"var(--pp-border)"}}/>
//               <p>No upcoming appointments</p>
//               <button className="pp-btn pp-btn-primary pp-btn-sm" onClick={()=>setTab("book")}>Book one now</button>
//             </div>
//           ) : upcoming.slice(0,4).map(a => (
//             <div key={a.id} className="pp-appt-row">
//               <div className="pp-appt-date-box">
//                 <span className="pp-appt-day">{a.date?.split("-")[2]}</span>
//                 <span className="pp-appt-mon">{monthSh(a.date)}</span>
//               </div>
//               <div style={{flex:1}}>
//                 <div style={{fontWeight:700,fontSize:14}}>{a.healthType}</div>
//                 <div style={{fontSize:12,color:"var(--pp-muted)",marginTop:2}}>{a.doctorName} · {a.time}</div>
//               </div>
//               <Badge status={a.status}/>
//             </div>
//           ))}
//         </div>

//         {/* My doctors */}
//         <div className="pp-card">
//           <div className="pp-card-hd">
//             <div className="pp-card-title">Our Specialists</div>
//             <button className="pp-ghost-btn" onClick={()=>setTab("book")}>Book Now →</button>
//           </div>
//           {doctors.slice(0,4).map(d => (
//             <div key={d.id} className="pp-doc-row">
//               <Avatar name={d.name} size={40}/>
//               <div style={{flex:1}}>
//                 <div style={{fontWeight:700,fontSize:14}}>{d.name}{d.id===patient.preferredDoctorId&&<span className="pp-preferred-chip">My Doctor</span>}</div>
//                 <div style={{fontSize:12,color:"var(--pp-muted)"}}>{d.specialty} · {d.location}</div>
//               </div>
//               <div style={{display:"flex",alignItems:"center",gap:4,flexShrink:0}}>
//                 <span style={{color:"#f59e0b",fontSize:13}}>★</span>
//                 <span style={{fontWeight:700,fontSize:13}}>{d.rating}</span>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* Preferred doctor focus card */}
//       {prefDoc && (
//         <div className="pp-pref-doctor-card">
//           <Avatar name={prefDoc.name} size={60}/>
//           <div style={{flex:1}}>
//             <div className="pp-pref-label">Your Primary Dentist</div>
//             <div className="pp-pref-name">{prefDoc.name}</div>
//             <div className="pp-pref-spec">{prefDoc.specialty} · {prefDoc.location}</div>
//           </div>
//           <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
//             <button className="pp-btn pp-btn-primary pp-btn-sm" onClick={()=>setTab("book")}>Book Appointment</button>
//             <button className="pp-btn pp-btn-ghost pp-btn-sm" onClick={()=>setTab("messages")}>Send Message</button>
//           </div>
//         </div>
//       )}

//       {/* Membership card */}
//       <div className={`pp-membership-card ${patient.membership?"pp-membership-card--active":""}`}>
//         <div style={{fontSize:28,marginBottom:8}}>🦷</div>
//         <div style={{flex:1}}>
//           <h3>{patient.membership?"STECH Premium Member":"Upgrade to Premium"}</h3>
//           <p>{patient.membership
//             ?"Enjoy unlimited consultations, priority booking & home visits."
//             :"Get unlimited consultations, 20% discounts & dedicated specialist."}</p>
//         </div>
//         {!patient.membership && (
//           <button className="pp-btn" style={{background:"#fff",color:"var(--pp-blue)",fontWeight:700,borderRadius:12,padding:"10px 22px",border:"none",cursor:"pointer",whiteSpace:"nowrap"}} onClick={()=>setTab("profile")}>
//             Upgrade Now
//           </button>
//         )}
//       </div>
//     </div>
//   );
// }

// /* ═══════════════════════════════════════════════════════════════
//    PAGE — MY APPOINTMENTS
// ═══════════════════════════════════════════════════════════════ */
// function PatAppointments({ patientId, showToast, setTab }) {
//   const [items,   setItems]   = useState(appointmentDB.forPatient(patientId));
//   const [filter,  setFilter]  = useState("all");
//   const [search,  setSearch]  = useState("");
//   const [modal,   setModal]   = useState(null);
//   const [confirm, setConfirm] = useState(null);

//   const refresh  = () => setItems(appointmentDB.forPatient(patientId));
//   const filtered = items.filter(a =>
//     (filter==="all"||a.status===filter) &&
//     [a.healthType, a.doctorName].some(v=>v?.toLowerCase().includes(search.toLowerCase()))
//   );

//   const cancel = (id) => {
//     appointmentDB.update(id, { status:"cancelled" });
//     const a = appointmentDB.byId(id);
//     pushNotif("admin", "appointment", "Appointment Cancelled",
//       `Patient cancelled appointment with ${a?.doctorName} on ${a?.date}.`);
//     refresh(); showToast("Appointment cancelled", "info"); setConfirm(null);
//   };

//   return (
//     <div className="pp-animate">
//       <div className="pp-page-hd">
//         <div><h1 className="pp-page-title">My Appointments</h1><p className="pp-page-sub">{items.length} total</p></div>
//         <button className="pp-btn pp-btn-primary" onClick={()=>setTab("book")}>+ Book New</button>
//       </div>

//       <div className="pp-filter-bar">
//         <div className="pp-search-wrap">
//           <i className="ti ti-search"/>
//           <input className="pp-search" placeholder="Search treatment, doctor…" value={search} onChange={e=>setSearch(e.target.value)}/>
//         </div>
//         <div className="pp-filter-tabs">
//           {["all","pending","confirmed","cancelled"].map(f=>(
//             <button key={f} className={`pp-filter-tab ${filter===f?"active":""}`} onClick={()=>setFilter(f)}>
//               {f.charAt(0).toUpperCase()+f.slice(1)}
//               <span className="pp-filter-count">{f==="all"?items.length:items.filter(a=>a.status===f).length}</span>
//             </button>
//           ))}
//         </div>
//       </div>

//       <div style={{display:"flex",flexDirection:"column",gap:12}}>
//         {filtered.length===0 && (
//           <div className="pp-card"><div className="pp-empty"><i className="ti ti-calendar-off" style={{fontSize:36}}/><p>No appointments found.</p><button className="pp-btn pp-btn-primary pp-btn-sm" onClick={()=>setTab("book")}>Book Now</button></div></div>
//         )}
//         {filtered.map(a=>(
//           <div key={a.id} className="pp-card pp-appt-card">
//             <div className="pp-appt-card-left">
//               <div className="pp-appt-date-box pp-appt-date-box--lg">
//                 <span className="pp-appt-day">{a.date?.split("-")[2]}</span>
//                 <span className="pp-appt-mon">{monthSh(a.date)}</span>
//               </div>
//               <div style={{flex:1}}>
//                 <div style={{fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:17}}>{a.healthType}</div>
//                 <div style={{fontSize:13,color:"var(--pp-muted)",marginTop:4}}>{a.doctorName} · {a.time}</div>
//                 {a.notes && <div style={{fontSize:12,color:"var(--pp-muted)",marginTop:4,fontStyle:"italic"}}>"{a.notes}"</div>}
//                 <div style={{marginTop:8,fontSize:13,fontWeight:700,color:"var(--pp-blue)"}}>{fmtMoney(a.amount)}</div>
//               </div>
//             </div>
//             <div className="pp-appt-card-right">
//               <Badge status={a.status}/>
//               <div style={{display:"flex",gap:6,marginTop:8}}>
//                 <button className="pp-ghost-btn" onClick={()=>setModal(a)}><i className="ti ti-eye"/> View</button>
//                 {a.status!=="cancelled" && (
//                   <button className="pp-ghost-btn pp-danger-text" onClick={()=>setConfirm({id:a.id,label:`${a.healthType} on ${a.date}`})}>
//                     <i className="ti ti-x"/> Cancel
//                   </button>
//                 )}
//               </div>
//             </div>
//           </div>
//         ))}
//       </div>

//       {modal && (
//         <Modal title="Appointment Detail" subtitle={`ID: ${modal.id}`} onClose={()=>setModal(null)}>
//           {[["Doctor",modal.doctorName],["Treatment",modal.healthType],["Date",modal.date],["Time",modal.time],["Amount",fmtMoney(modal.amount)],["Status",modal.status],["Notes",modal.notes||"—"]].map(([k,v])=>(
//             <div key={k} className="pp-detail-row">
//               <span className="pp-detail-key">{k}</span>
//               <span className="pp-detail-val">{k==="Status"?<Badge status={v}/>:v}</span>
//             </div>
//           ))}
//         </Modal>
//       )}

//       {confirm && <ConfirmDialog msg={`Cancel "${confirm.label}"? This cannot be undone.`} onConfirm={()=>cancel(confirm.id)} onCancel={()=>setConfirm(null)}/>}
//     </div>
//   );
// }

// /* ═══════════════════════════════════════════════════════════════
//    PAGE — BOOK APPOINTMENT  (3-step wizard)
// ═══════════════════════════════════════════════════════════════ */
// // function PatBooking({ patient, patientId, showToast, setTab }) {
// //   const doctors = doctorDB.all().filter(d=>d.status==="active");
// //   const TYPES   = ["Consultation","Root Canal","Scaling & Polish","Whitening","Wisdom Teeth","Braces Check","Implant","X-Ray","General Check-up","Emergency"];
// //   const TIMES   = ["08:00","08:30","09:00","09:30","10:00","10:30","11:00","11:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00"];

// //   const initDoc = patient.preferredDoctorId ? doctors.find(d=>d.id===patient.preferredDoctorId) || null : null;
// //   const [step,    setStep]   = useState(1);
// //   const [selDoc,  setSelDoc] = useState(initDoc);
// //   const [form,    setForm]   = useState({ healthType:"", date:"", time:"", notes:"" });
// //   const [errs,    setErrs]   = useState({});
// //   const [loading, setLoad]   = useState(false);
// //   const [done,    setDone]   = useState(false);

// //   const validate = () => {
// //     const e = {};
// //     if (!selDoc)          e.doctor     = "Please select a doctor";
// //     if (!form.healthType) e.healthType = "Select treatment type";
// //     if (!form.date)       e.date       = "Select a date";
// //     if (!form.time)       e.time       = "Select a time";
// //     return e;
// //   };

// //   const submit = async () => {
// //     const e = validate();
// //     if (Object.keys(e).length) { setErrs(e); return; }
// //     setLoad(true);
// //     await new Promise(r=>setTimeout(r,800));
// //     const appt = appointmentDB.add({
// //       id:          uid(),
// //       patientId,
// //       patientName: patient.name,
// //       doctorId:    selDoc.id,
// //       doctorName:  selDoc.name,
// //       healthType:  form.healthType,
// //       date:        form.date,
// //       time:        form.time,
// //       notes:       form.notes,
// //       amount:      selDoc.consultFee || 15000,
// //       status:      "pending",
// //       createdAt:   nowISO(),
// //     });
// //     // Notify doctor and admin
// //     pushNotif(selDoc.id, "appointment", "New Appointment Request",
// //       `${patient.name} booked ${form.healthType} on ${form.date} at ${form.time}.`);
// //     pushNotif("admin", "appointment", "New Appointment Booked",
// //       `${patient.name} → ${selDoc.name} for ${form.healthType} on ${form.date}.`);
// //     setLoad(false);
// //     setDone(true);
// //     showToast("Appointment booked successfully!");
// //     window.dispatchEvent(new Event("stech_refresh"));
// //   };

// //   if (done) return (
// //     <div className="pp-animate">
// //       <div className="pp-booking-success">
// //         <div className="pp-success-circle"><i className="ti ti-check" style={{fontSize:40}}/></div>
// //         <h2>Booking Confirmed!</h2>
// //         <p>Your <strong>{form.healthType}</strong> with <strong>{selDoc?.name}</strong> on <strong>{form.date}</strong> at <strong>{form.time}</strong> is pending confirmation.</p>
// //         <p style={{fontSize:13,color:"var(--pp-muted)"}}>You'll be notified once the doctor approves your request.</p>
// //         <div style={{display:"flex",gap:12,marginTop:24,justifyContent:"center",flexWrap:"wrap"}}>
// //           <button className="pp-btn pp-btn-ghost" onClick={()=>{setDone(false);setStep(1);setSelDoc(initDoc);setForm({healthType:"",date:"",time:"",notes:""});}}>Book Another</button>
// //           <button className="pp-btn pp-btn-primary" onClick={()=>setTab("appointments")}>View Appointments</button>
// //         </div>
// //       </div>
// //     </div>
// //   );

// //   return (
// //     <div className="pp-animate">
// //       <div className="pp-page-hd"><div><h1 className="pp-page-title">Book Appointment</h1><p className="pp-page-sub">Schedule with our specialists</p></div></div>

// //       {/* Progress stepper */}
// //       <div className="pp-stepper">
// //         {["Choose Doctor","Select Details","Confirm"].map((s,i)=>(
// //           <div key={s} className={`pp-step ${step===i+1?"active":step>i+1?"done":""}`}>
// //             <div className="pp-step-num">{step>i+1?<i className="ti ti-check"/>:i+1}</div>
// //             <span>{s}</span>
// //             {i<2 && <div className="pp-step-line"/>}
// //           </div>
// //         ))}
// //       </div>

// //       {/* Step 1 — Choose Doctor */}
// //       {step===1 && (
// //         <div>
// //           {errs.doctor && <div className="pp-err-banner">{errs.doctor}</div>}
// //           <div className="pp-doctor-grid">
// //             {doctors.map(d=>(
// //               <div key={d.id}
// //                 className={`pp-doctor-sel-card ${selDoc?.id===d.id?"selected":""} ${d.id===patient.preferredDoctorId?"preferred":""}`}
// //                 onClick={()=>{setSelDoc(d);setErrs(e=>({...e,doctor:""}));}}>
// //                 {d.id===patient.preferredDoctorId && <div className="pp-preferred-label">Your Doctor</div>}
// //                 <Avatar name={d.name} size={56}/>
// //                 <div style={{textAlign:"center",marginTop:12}}>
// //                   <div style={{fontWeight:700,fontSize:15}}>{d.name}</div>
// //                   <div style={{fontSize:12,color:"var(--pp-muted)",margin:"4px 0"}}>{d.specialty}</div>
// //                   <div style={{display:"flex",justifyContent:"center",gap:6,marginBottom:8}}>
// //                     <span style={{color:"#f59e0b",fontSize:13}}>★ {d.rating}</span>
// //                     <span style={{color:"var(--pp-muted)",fontSize:12}}>· {d.experience}</span>
// //                   </div>
// //                   <div style={{fontSize:12,fontWeight:700,color:"var(--pp-blue)"}}>{fmtMoney(d.consultFee)}</div>
// //                   <p style={{fontSize:12,color:"var(--pp-muted)",marginTop:8,lineHeight:1.5}}>{d.bio}</p>
// //                   <Badge status={d.status}/>
// //                 </div>
// //                 {selDoc?.id===d.id && <div className="pp-selected-tick"><i className="ti ti-check"/></div>}
// //               </div>
// //             ))}
// //           </div>
// //           <div style={{display:"flex",justifyContent:"flex-end",marginTop:20}}>
// //             <button className="pp-btn pp-btn-primary" onClick={()=>{if(!selDoc){setErrs({doctor:"Please select a doctor"});return;}setStep(2);}}>
// //               Continue <i className="ti ti-arrow-right"/>
// //             </button>
// //           </div>
// //         </div>
// //       )}

// //       {/* Step 2 — Details */}
// //       {step===2 && (
// //         <div className="pp-card" style={{maxWidth:580,margin:"0 auto"}}>
// //           <div className="pp-booking-doc-banner">
// //             <Avatar name={selDoc?.name} size={44}/>
// //             <div>
// //               <div style={{fontWeight:700}}>{selDoc?.name}</div>
// //               <div style={{fontSize:13,color:"var(--pp-muted)"}}>{selDoc?.specialty} · {fmtMoney(selDoc?.consultFee)}</div>
// //             </div>
// //             <button className="pp-ghost-btn pp-btn-sm" onClick={()=>setStep(1)}>Change</button>
// //           </div>
// //           <div style={{display:"flex",flexDirection:"column",gap:16}}>
// //             <FG label="Treatment Type" required>
// //               <select className={`pp-input ${errs.healthType?"pp-input--err":""}`} value={form.healthType} onChange={e=>{setForm(f=>({...f,healthType:e.target.value}));setErrs(er=>({...er,healthType:""}));}}>
// //                 <option value="">Select treatment…</option>
// //                 {TYPES.map(t=><option key={t} value={t}>{t}</option>)}
// //               </select>
// //               {errs.healthType && <p className="pp-field-err">{errs.healthType}</p>}
// //             </FG>
// //             <div className="pp-form-row">
// //               <FG label="Date" required>
// //                 <input className={`pp-input ${errs.date?"pp-input--err":""}`} type="date" min={todayStr()} value={form.date} onChange={e=>{setForm(f=>({...f,date:e.target.value}));setErrs(er=>({...er,date:""}));}}/>
// //                 {errs.date && <p className="pp-field-err">{errs.date}</p>}
// //               </FG>
// //               <FG label="Time" required>
// //                 <select className={`pp-input ${errs.time?"pp-input--err":""}`} value={form.time} onChange={e=>{setForm(f=>({...f,time:e.target.value}));setErrs(er=>({...er,time:""}));}}>
// //                   <option value="">Select time…</option>
// //                   {TIMES.map(t=><option key={t} value={t}>{t}</option>)}
// //                 </select>
// //                 {errs.time && <p className="pp-field-err">{errs.time}</p>}
// //               </FG>
// //             </div>
// //             <FG label="Additional Notes">
// //               <textarea className="pp-input pp-textarea" rows={3} placeholder="Describe your concern or special requests…" value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))}/>
// //             </FG>
// //           </div>
// //           <div style={{display:"flex",gap:12,marginTop:20,justifyContent:"space-between"}}>
// //             <button className="pp-btn pp-btn-ghost" onClick={()=>setStep(1)}><i className="ti ti-arrow-left"/> Back</button>
// //             <button className="pp-btn pp-btn-primary" onClick={()=>{const e=validate();if(e.healthType||e.date||e.time){setErrs(e);return;}setStep(3);}}>
// //               Review Booking <i className="ti ti-arrow-right"/>
// //             </button>
// //           </div>
// //         </div>
// //       )}

// //       {/* Step 3 — Confirm */}
// //       {step===3 && (
// //         <div className="pp-card" style={{maxWidth:520,margin:"0 auto"}}>
// //           <h3 style={{fontFamily:"'Playfair Display',serif",marginBottom:20,fontSize:20}}>Confirm Your Appointment</h3>
// //           <div className="pp-confirm-summary">
// //             {[["Doctor",selDoc?.name],["Specialty",selDoc?.specialty],["Treatment",form.healthType],["Date",form.date],["Time",form.time],["Consultation Fee",fmtMoney(selDoc?.consultFee)],["Notes",form.notes||"None"]].map(([k,v])=>(
// //               <div key={k} className="pp-detail-row"><span className="pp-detail-key">{k}</span><span className="pp-detail-val">{v}</span></div>
// //             ))}
// //           </div>
// //           <p style={{fontSize:13,color:"var(--pp-muted)",marginBottom:20,lineHeight:1.7}}>
// //             Your request will be sent to {selDoc?.name} for confirmation. A notification will be sent once approved.
// //           </p>
// //           <div style={{display:"flex",gap:12,justifyContent:"space-between"}}>
// //             <button className="pp-btn pp-btn-ghost" onClick={()=>setStep(2)}><i className="ti ti-arrow-left"/> Back</button>
// //             <button className="pp-btn pp-btn-primary" onClick={submit} disabled={loading}>
// //               {loading && <span className="pp-spinner"/>}
// //               {loading?"Booking…":"Confirm Booking"}
// //             </button>
// //           </div>
// //         </div>
// //       )}
// //     </div>
// //   );
// // }

// function PatBooking({ patient, patientId, showToast, setTab }) {
//   const doctors = doctorDB.all().filter(d => d.status === "active");
//   const TYPES = ["Consultation","Root Canal","Scaling & Polish","Whitening","Wisdom Teeth","Braces Check","Implant","X-Ray","General Check-up","Emergency"];
//   const TIMES = ["08:00","08:30","09:00","09:30","10:00","10:30","11:00","11:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00"];
 
//   const SESSION_TYPES = [
//     { id: "in-clinic",  icon: "🏥", label: "In-Clinic",   desc: "Visit us at the clinic"      },
//     { id: "video",      icon: "📹", label: "Video Call",   desc: "Online video consultation"   },
//     { id: "home-visit", icon: "🏠", label: "Home Visit",   desc: "Doctor comes to you"         },
//   ];
 
//   const initDoc = patient.preferredDoctorId ? doctors.find(d => d.id === patient.preferredDoctorId) || null : null;
//   const [step,        setStep]        = useState(1);
//   const [selDoc,      setSelDoc]      = useState(initDoc);
//   const [sessionType, setSessionType] = useState("in-clinic");
//   const [form,        setForm]        = useState({ healthType: "", date: "", time: "", notes: "", address: patient.address || "" });
//   const [errs,        setErrs]        = useState({});
//   const [loading,     setLoad]        = useState(false);
//   const [done,        setDone]        = useState(false);
 
//   const validate = () => {
//     const e = {};
//     if (!selDoc)           e.doctor      = "Please select a doctor";
//     if (!form.healthType)  e.healthType  = "Select treatment type";
//     if (!form.date)        e.date        = "Select a date";
//     if (!form.time)        e.time        = "Select a time";
//     if (sessionType === "home-visit" && !form.address.trim()) e.address = "Enter your address";
//     return e;
//   };
 
//   const submit = async () => {
//     const e = validate();
//     if (Object.keys(e).length) { setErrs(e); return; }
//     setLoad(true);
//     await new Promise(r => setTimeout(r, 800));
 
//     const appt = appointmentDB.add({
//       id: uid(), patientId, patientName: patient.name,
//       doctorId: selDoc.id, doctorName: selDoc.name,
//       healthType: form.healthType, date: form.date, time: form.time,
//       notes: form.notes, address: form.address, sessionType,
//       amount: selDoc.consultFee || 15000, status: "pending", createdAt: nowISO(),
//     });
 
//     // Video → auto-create consultation entry
//     if (sessionType === "video") {
//       consultDB.add({
//         id: uid(), patientId, patientName: patient.name,
//         doctorId: selDoc.id, doctorName: selDoc.name,
//         type: "video", date: form.date, time: form.time,
//         notes: form.notes, status: "scheduled",
//         linkedAppointmentId: appt.id, createdAt: nowISO(),
//       });
//     }
 
//     // Home visit → auto-create home visit record
//     if (sessionType === "home-visit") {
//       homeDB.add({
//         id: uid(), patientId, patientName: patient.name,
//         doctorId: selDoc.id, doctorName: selDoc.name,
//         service: form.healthType, date: form.date, time: form.time,
//         address: form.address, notes: form.notes,
//         status: "pending", createdAt: nowISO(),
//       });
//     }
 
//     const typeLabel = SESSION_TYPES.find(t => t.id === sessionType)?.label || sessionType;
//     pushNotif(selDoc.id, "appointment",
//       `${SESSION_TYPES.find(t=>t.id===sessionType)?.icon} New ${typeLabel} Request`,
//       `${patient.name} booked ${form.healthType} (${typeLabel}) on ${form.date} at ${form.time}.`);
//     pushNotif("admin", "appointment", "New Appointment Booked",
//       `${patient.name} → ${selDoc.name} for ${form.healthType} (${typeLabel}) on ${form.date}.`);
 
//     setLoad(false);
//     setDone(true);
//     showToast(sessionType === "video" ? "Video consultation booked! 📹" : "Appointment booked! 🎉");
//     window.dispatchEvent(new Event("stech_refresh"));
//   };
 
//   if (done) return (
//     <div className="pp-animate">
//       <div className="pp-booking-success">
//         <div className="pp-success-circle" style={{ background: sessionType === "video" ? "rgba(0,191,165,.15)" : "#dcfce7" }}>
//           <span style={{ fontSize: 40 }}>{SESSION_TYPES.find(t=>t.id===sessionType)?.icon || "✓"}</span>
//         </div>
//         <h2>
//           {sessionType === "video"      ? "Video Call Scheduled!" :
//            sessionType === "home-visit" ? "Home Visit Requested!" :
//                                           "Booking Confirmed!"}
//         </h2>
//         <p>Your <strong>{form.healthType}</strong> with <strong>{selDoc?.name}</strong> on <strong>{form.date}</strong> at <strong>{form.time}</strong>
//           {sessionType === "video"      && " via video call"}
//           {sessionType === "home-visit" && ` at your address`} is pending confirmation.
//         </p>
//         {sessionType === "video" && (
//           <div style={{ background: "rgba(0,191,165,.07)", border: "1px solid rgba(0,191,165,.2)", borderRadius: 12, padding: "14px 18px", marginTop: 12, textAlign: "left" }}>
//             <p style={{ fontSize: 13, color: "var(--pp-muted)", lineHeight: 1.7 }}>
//               📹 Once your doctor confirms, go to <strong>Consultations</strong> and click <em>Join Video</em> at the scheduled time.
//             </p>
//           </div>
//         )}
//         <div style={{ display: "flex", gap: 12, marginTop: 24, justifyContent: "center", flexWrap: "wrap" }}>
//           <button className="pp-btn pp-btn-ghost" onClick={() => { setDone(false); setStep(1); setSelDoc(initDoc); setSessionType("in-clinic"); setForm({ healthType:"", date:"", time:"", notes:"", address: patient.address||"" }); }}>
//             Book Another
//           </button>
//           <button className="pp-btn pp-btn-primary" onClick={() => setTab(
//             sessionType === "video"      ? "consultations" :
//             sessionType === "home-visit" ? "home_visit"    : "appointments"
//           )}>
//             {sessionType === "video"      ? "📹 Go to Consultations →" :
//              sessionType === "home-visit" ? "🏠 Track Home Visit →"    :
//                                             "View Appointments →"}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
 
//   return (
//     <div className="pp-animate">
//       <div className="pp-page-hd">
//         <div><h1 className="pp-page-title">Book Appointment</h1><p className="pp-page-sub">Choose your session type & specialist</p></div>
//       </div>
 
//       {/* Stepper */}
//       <div className="pp-stepper">
//         {["Choose Doctor", "Type & Details", "Confirm"].map((s, i) => (
//           <div key={s} className={`pp-step ${step===i+1?"active":step>i+1?"done":""}`}>
//             <div className="pp-step-num">{step > i+1 ? <i className="ti ti-check"/> : i+1}</div>
//             <span>{s}</span>
//             {i < 2 && <div className="pp-step-line"/>}
//           </div>
//         ))}
//       </div>
 
//       {/* Step 1 — Doctor */}
//       {step === 1 && (
//         <div>
//           {errs.doctor && <div className="pp-err-banner">{errs.doctor}</div>}
//           <div className="pp-doctor-grid">
//             {doctors.map(d => (
//               <div key={d.id}
//                 className={`pp-doctor-sel-card ${selDoc?.id===d.id?"selected":""} ${d.id===patient.preferredDoctorId?"preferred":""}`}
//                 onClick={() => { setSelDoc(d); setErrs(e=>({...e,doctor:""})); }}>
//                 {d.id === patient.preferredDoctorId && <div className="pp-preferred-label">⭐ Your Doctor</div>}
//                 <Avatar name={d.name} size={56}/>
//                 <div style={{ textAlign:"center", marginTop:12 }}>
//                   <div style={{ fontWeight:700, fontSize:15 }}>{d.name}</div>
//                   <div style={{ fontSize:12, color:"var(--pp-muted)", margin:"4px 0" }}>{d.specialty}</div>
//                   <div style={{ display:"flex", justifyContent:"center", gap:6, marginBottom:8 }}>
//                     <span style={{ color:"#f59e0b", fontSize:13 }}>★ {d.rating}</span>
//                     <span style={{ color:"var(--pp-muted)", fontSize:12 }}>· {d.experience}</span>
//                   </div>
//                   <div style={{ fontSize:12, fontWeight:700, color:"var(--pp-blue)" }}>{fmtMoney(d.consultFee)}</div>
//                   <p style={{ fontSize:12, color:"var(--pp-muted)", marginTop:8, lineHeight:1.5 }}>{d.bio}</p>
//                   <Badge status={d.status}/>
//                 </div>
//                 {selDoc?.id === d.id && <div className="pp-selected-tick"><i className="ti ti-check"/></div>}
//               </div>
//             ))}
//           </div>
//           <div style={{ display:"flex", justifyContent:"flex-end", marginTop:20 }}>
//             <button className="pp-btn pp-btn-primary" onClick={() => { if (!selDoc) { setErrs({doctor:"Please select a doctor"}); return; } setStep(2); }}>
//               Continue <i className="ti ti-arrow-right"/>
//             </button>
//           </div>
//         </div>
//       )}
 
//       {/* Step 2 — Session type + details */}
//       {step === 2 && (
//         <div className="pp-card" style={{ maxWidth:600, margin:"0 auto" }}>
//           {/* Doctor banner */}
//           <div className="pp-booking-doc-banner">
//             <Avatar name={selDoc?.name} size={44}/>
//             <div>
//               <div style={{ fontWeight:700 }}>{selDoc?.name}</div>
//               <div style={{ fontSize:13, color:"var(--pp-muted)" }}>{selDoc?.specialty} · {fmtMoney(selDoc?.consultFee)}</div>
//             </div>
//             <button className="pp-ghost-btn pp-btn-sm" onClick={() => setStep(1)}>Change</button>
//           </div>
 
//           {/* Session type picker */}
//           <div style={{ marginBottom:20 }}>
//             <label className="pp-label">Appointment Type</label>
//             <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginTop:8 }}>
//               {SESSION_TYPES.map(t => (
//                 <button key={t.id} type="button" onClick={() => setSessionType(t.id)}
//                   style={{ padding:"14px 8px", borderRadius:12, cursor:"pointer", textAlign:"center", fontFamily:"inherit",
//                     border:`2px solid ${sessionType===t.id?"#00bfa5":"var(--pp-border)"}`,
//                     background: sessionType===t.id ? "rgba(0,191,165,.07)" : "var(--pp-bg)",
//                     transition:"all .18s" }}>
//                   <div style={{ fontSize:24, marginBottom:6 }}>{t.icon}</div>
//                   <div style={{ fontWeight:700, fontSize:13, color: sessionType===t.id ? "#00897b" : "var(--pp-text)" }}>{t.label}</div>
//                   <div style={{ fontSize:11, color:"var(--pp-muted)", marginTop:3 }}>{t.desc}</div>
//                   {sessionType === t.id && <div style={{ marginTop:5, fontSize:10, fontWeight:800, color:"#00bfa5" }}>✓ SELECTED</div>}
//                 </button>
//               ))}
//             </div>
//             {sessionType === "video" && (
//               <div style={{ marginTop:10, background:"rgba(0,191,165,.07)", border:"1px solid rgba(0,191,165,.2)", borderRadius:10, padding:"10px 14px", fontSize:13, color:"#00897b", lineHeight:1.6 }}>
//                 📹 A live video room will appear in <strong>Consultations</strong> at the scheduled time. Your doctor receives a join link instantly.
//               </div>
//             )}
//             {sessionType === "home-visit" && (
//               <div style={{ marginTop:10, background:"rgba(30,136,229,.07)", border:"1px solid rgba(30,136,229,.2)", borderRadius:10, padding:"10px 14px", fontSize:13, color:"#1565c0", lineHeight:1.6 }}>
//                 🏠 Live GPS tracking will be enabled once your doctor accepts. You'll see them approaching on a map.
//               </div>
//             )}
//           </div>
 
//           {/* Form fields */}
//           <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
//             <FG label="Treatment Type" required>
//               <select className={`pp-input ${errs.healthType?"pp-input--err":""}`} value={form.healthType}
//                 onChange={e => { setForm(f=>({...f,healthType:e.target.value})); setErrs(er=>({...er,healthType:""})); }}>
//                 <option value="">Select treatment…</option>
//                 {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
//               </select>
//               {errs.healthType && <p className="pp-field-err">{errs.healthType}</p>}
//             </FG>
//             <div className="pp-form-row">
//               <FG label="Date" required>
//                 <input className={`pp-input ${errs.date?"pp-input--err":""}`} type="date" min={todayStr()} value={form.date}
//                   onChange={e => { setForm(f=>({...f,date:e.target.value})); setErrs(er=>({...er,date:""})); }}/>
//                 {errs.date && <p className="pp-field-err">{errs.date}</p>}
//               </FG>
//               <FG label="Time" required>
//                 <select className={`pp-input ${errs.time?"pp-input--err":""}`} value={form.time}
//                   onChange={e => { setForm(f=>({...f,time:e.target.value})); setErrs(er=>({...er,time:""})); }}>
//                   <option value="">Select time…</option>
//                   {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
//                 </select>
//                 {errs.time && <p className="pp-field-err">{errs.time}</p>}
//               </FG>
//             </div>
//             {sessionType === "home-visit" && (
//               <FG label="Your Address" required>
//                 <input className={`pp-input ${errs.address?"pp-input--err":""}`}
//                   placeholder="Street, Neighbourhood, City"
//                   value={form.address}
//                   onChange={e => { setForm(f=>({...f,address:e.target.value})); setErrs(er=>({...er,address:""})); }}/>
//                 {errs.address && <p className="pp-field-err">{errs.address}</p>}
//               </FG>
//             )}
//             <FG label="Additional Notes">
//               <textarea className="pp-input pp-textarea" rows={3}
//                 placeholder="Describe your concern or special requests…"
//                 value={form.notes} onChange={e => setForm(f=>({...f,notes:e.target.value}))}/>
//             </FG>
//           </div>
 
//           <div style={{ display:"flex", gap:12, marginTop:20, justifyContent:"space-between" }}>
//             <button className="pp-btn pp-btn-ghost" onClick={() => setStep(1)}><i className="ti ti-arrow-left"/> Back</button>
//             <button className="pp-btn pp-btn-primary" onClick={() => { const e = validate(); if (Object.keys(e).length) { setErrs(e); return; } setStep(3); }}>
//               Review Booking <i className="ti ti-arrow-right"/>
//             </button>
//           </div>
//         </div>
//       )}
 
//       {/* Step 3 — Confirm */}
//       {step === 3 && (
//         <div className="pp-card" style={{ maxWidth:520, margin:"0 auto" }}>
//           <h3 style={{ fontFamily:"'Playfair Display',serif", marginBottom:20, fontSize:20 }}>Confirm Your Booking</h3>
//           <div className="pp-confirm-summary">
//             {[
//               ["Doctor",    selDoc?.name],
//               ["Specialty", selDoc?.specialty],
//               ["Type",      SESSION_TYPES.find(t=>t.id===sessionType)?.icon + " " + SESSION_TYPES.find(t=>t.id===sessionType)?.label],
//               ["Treatment", form.healthType],
//               ["Date",      form.date],
//               ["Time",      form.time],
//               ...(sessionType === "home-visit" ? [["Address", form.address]] : []),
//               ["Fee",       fmtMoney(selDoc?.consultFee)],
//               ["Notes",     form.notes || "None"],
//             ].map(([k, v]) => (
//               <div key={k} className="pp-detail-row">
//                 <span className="pp-detail-key">{k}</span>
//                 <span className="pp-detail-val">{v}</span>
//               </div>
//             ))}
//           </div>
//           {sessionType === "video" && (
//             <div style={{ background:"rgba(0,191,165,.07)", border:"1px solid rgba(0,191,165,.2)", borderRadius:10, padding:"12px 14px", marginBottom:16, fontSize:13, color:"#00897b" }}>
//               📹 Your video room appears in <strong>Consultations</strong> once confirmed. Both you and your doctor get a notification.
//             </div>
//           )}
//           <div style={{ display:"flex", gap:12, justifyContent:"space-between" }}>
//             <button className="pp-btn pp-btn-ghost" onClick={() => setStep(2)}><i className="ti ti-arrow-left"/> Back</button>
//             <button className="pp-btn pp-btn-primary" onClick={submit} disabled={loading}>
//               {loading && <span className="pp-spinner"/>}
//               {loading ? "Booking…" :
//                sessionType === "video"      ? "📹 Book Video Call" :
//                sessionType === "home-visit" ? "🏠 Request Home Visit" :
//                                               "✓ Confirm Booking"}
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// /* ═══════════════════════════════════════════════════════════════
//    PAGE — CONSULTATIONS  (video / chat / physical)
// ═══════════════════════════════════════════════════════════════ */
// // function PatConsultations({ patient, patientId, showToast }) {
// //   const doctors  = doctorDB.all().filter(d=>d.status==="active");
// //   const [items,    setItems] = useState(consultDB.forPatient(patientId));
// //   const [showForm, setForm]  = useState(false);
// //   const [activeRoom, setRoom]= useState(null);
// //   const [form, setF]         = useState({ doctorId:"", type:"video", date:"", time:"10:00", notes:"" });

// //   const refresh = () => setItems(consultDB.forPatient(patientId));

// //   const submit = () => {
// //     if (!form.doctorId || !form.date) { showToast("Fill all required fields","error"); return; }
// //     const d = doctorDB.byId(form.doctorId);
// //     consultDB.add({ id:uid(), ...form, patientId, patientName:patient.name, doctorName:d?.name, status:"scheduled", createdAt:nowISO() });
// //     pushNotif(form.doctorId, "consultation", "New Consultation Request",
// //       `${patient.name} requested a ${form.type} session on ${form.date} at ${form.time}.`);
// //     pushNotif("admin","consultation","Consultation Scheduled",
// //       `${patient.name} scheduled ${form.type} with ${d?.name}.`);
// //     setForm({ doctorId:"", type:"video", date:"", time:"10:00", notes:"" });
// //     setForm(false); refresh(); showToast("Consultation scheduled!");
// //   };

// //   if (activeRoom) return <ConsultRoom consultation={activeRoom} patient={patient} onEnd={()=>{
// //     consultDB.update(activeRoom.id, { status:"completed" });
// //     pushNotif(activeRoom.doctorId,"consultation","Session Ended",
// //       `Patient ${patient.name} ended the ${activeRoom.type} session.`);
// //     setRoom(null); refresh();
// //   }}/>;

// //   return (
// //     <div className="pp-animate">
// //       <div className="pp-page-hd">
// //         <div><h1 className="pp-page-title">Consultations</h1><p className="pp-page-sub">Video, chat & in-person sessions</p></div>
// //         <button className="pp-btn pp-btn-primary" onClick={()=>setForm(true)}>+ Request Session</button>
// //       </div>

// //       <div style={{display:"flex",flexDirection:"column",gap:12}}>
// //         {items.length===0 && (
// //           <div className="pp-card"><div className="pp-empty"><i className="ti ti-video" style={{fontSize:36}}/><p>No consultations yet.</p></div></div>
// //         )}
// //         {items.map(c=>(
// //           <div key={c.id} className="pp-card pp-consult-card">
// //             <div className="pp-consult-type-icon" data-type={c.type}>
// //               {c.type==="video"?"📹":c.type==="physical"?"🏥":"💬"}
// //             </div>
// //             <div style={{flex:1}}>
// //               <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
// //                 <span style={{fontWeight:700,fontSize:15}}>{c.doctorName}</span>
// //                 <Badge status={c.type}/><Badge status={c.status}/>
// //               </div>
// //               <div style={{fontSize:13,color:"var(--pp-muted)"}}>📅 {c.date} at {c.time}</div>
// //               {c.notes && <div style={{fontSize:12,color:"var(--pp-muted)",marginTop:3}}>📝 {c.notes}</div>}
// //             </div>
// //             {c.status==="scheduled" && (
// //               <button className="pp-btn pp-btn-primary pp-btn-sm" onClick={()=>setRoom(c)}>
// //                 {c.type==="video"?"📹 Join Video":c.type==="physical"?"🏥 Start Visit":"💬 Open Chat"}
// //               </button>
// //             )}
// //           </div>
// //         ))}
// //       </div>

// //       {showForm && (
// //         <Modal title="Request Consultation" onClose={()=>setForm(false)}>
// //           <FG label="Doctor" required>
// //             <select className="pp-input" value={form.doctorId} onChange={e=>setF(f=>({...f,doctorId:e.target.value}))}>
// //               <option value="">Select doctor…</option>
// //               {doctors.map(d=><option key={d.id} value={d.id}>{d.name} — {d.specialty}</option>)}
// //             </select>
// //           </FG>
// //           <FG label="Session Type">
// //             <div className="pp-type-grid">
// //               {[["video","📹 Video Call"],["physical","🏥 Physical Visit"],["chat","💬 Text Chat"]].map(([val,lbl])=>(
// //                 <button key={val} className={`pp-type-btn ${form.type===val?"selected":""}`} onClick={()=>setF(f=>({...f,type:val}))}>{lbl}</button>
// //               ))}
// //             </div>
// //           </FG>
// //           <div className="pp-form-row">
// //             <FG label="Date" required>
// //               <input className="pp-input" type="date" min={todayStr()} value={form.date} onChange={e=>setF(f=>({...f,date:e.target.value}))}/>
// //             </FG>
// //             <FG label="Time">
// //               <select className="pp-input" value={form.time} onChange={e=>setF(f=>({...f,time:e.target.value}))}>
// //                 {["08:00","09:00","10:00","11:00","14:00","15:00","16:00"].map(t=><option key={t}>{t}</option>)}
// //               </select>
// //             </FG>
// //           </div>
// //           <FG label="Notes">
// //             <textarea className="pp-input pp-textarea" rows={3} placeholder="Describe your concern…" value={form.notes} onChange={e=>setF(f=>({...f,notes:e.target.value}))}/>
// //           </FG>
// //           <div style={{display:"flex",gap:10,marginTop:20}}>
// //             <button className="pp-btn pp-btn-ghost" style={{flex:1}} onClick={()=>setForm(false)}>Cancel</button>
// //             <button className="pp-btn pp-btn-primary" style={{flex:2}} onClick={submit}>Request Session</button>
// //           </div>
// //         </Modal>
// //       )}
// //     </div>
// //   );
// // }

// function PatConsultations({ patient, patientId, showToast }) {
//   const doctors  = doctorDB.all().filter(d => d.status === "active");
//   const [items,    setItems]  = useState(consultDB.forPatient(patientId));
//   const [showForm, setForm]   = useState(false);
//   const [activeRoom, setRoom] = useState(null);
//   const [form, setF] = useState({ doctorId:"", type:"video", date:"", time:"10:00", notes:"" });
 
//   const refresh = () => setItems(consultDB.forPatient(patientId));
 
//   const submit = () => {
//     if (!form.doctorId || !form.date) { showToast("Fill all required fields", "error"); return; }
//     const d = doctorDB.byId(form.doctorId);
//     consultDB.add({ id:uid(), ...form, patientId, patientName:patient.name, doctorName:d?.name, status:"scheduled", createdAt:nowISO() });
//     pushNotif(form.doctorId, "consultation",
//       `${form.type === "video" ? "📹" : form.type === "physical" ? "🏥" : "💬"} New ${form.type} Consultation`,
//       `${patient.name} requested a ${form.type} session on ${form.date} at ${form.time}.`);
//     pushNotif("admin","consultation","Consultation Scheduled",
//       `${patient.name} scheduled ${form.type} with ${d?.name}.`);
//     setF({ doctorId:"", type:"video", date:"", time:"10:00", notes:"" });
//     setForm(false); refresh(); showToast("Consultation scheduled! 🎉");
//   };
 
//   /* Opening video room — use the full VideoCall component */
//   if (activeRoom) return (
//     <VideoCall
//       consultation={activeRoom}
//       localUser={{ id: patientId, name: patient.name, role: "patient" }}
//       onEnd={() => {
//         consultDB.update(activeRoom.id, { status:"completed" });
//         pushNotif(activeRoom.doctorId, "consultation", "Session Ended",
//           `${patient.name} ended the ${activeRoom.type} session.`);
//         window.dispatchEvent(new Event("stech_refresh"));
//         setRoom(null); refresh();
//       }}
//     />
//   );
 
//   return (
//     <div className="pp-animate">
//       <div className="pp-page-hd">
//         <div><h1 className="pp-page-title">Consultations</h1><p className="pp-page-sub">Video, chat & in-person sessions</p></div>
//         <button className="pp-btn pp-btn-primary" onClick={() => setForm(true)}>+ Request Session</button>
//       </div>
 
//       <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
//         {items.length === 0 && (
//           <div className="pp-card">
//             <div className="pp-empty">
//               <i className="ti ti-video" style={{ fontSize:36 }}/>
//               <p>No consultations yet.</p>
//               <button className="pp-btn pp-btn-primary pp-btn-sm" onClick={() => setForm(true)}>Request Now</button>
//             </div>
//           </div>
//         )}
//         {items.map(c => (
//           <div key={c.id} className="pp-card pp-consult-card">
//             <div className="pp-consult-type-icon" style={{
//               width:54, height:54, borderRadius:14, flexShrink:0,
//               background: c.type==="video"?"rgba(0,191,165,.12)":c.type==="physical"?"rgba(30,136,229,.12)":"rgba(124,58,237,.12)",
//               display:"flex", alignItems:"center", justifyContent:"center", fontSize:26
//             }}>
//               {c.type==="video"?"📹":c.type==="physical"?"🏥":"💬"}
//             </div>
//             <div style={{ flex:1 }}>
//               <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4, flexWrap:"wrap" }}>
//                 <span style={{ fontWeight:700, fontSize:15 }}>{c.doctorName}</span>
//                 <Badge status={c.type}/><Badge status={c.status}/>
//               </div>
//               <div style={{ fontSize:13, color:"var(--pp-muted)" }}>📅 {c.date} at {c.time}</div>
//               {c.notes && <div style={{ fontSize:12, color:"var(--pp-muted)", marginTop:3 }}>📝 {c.notes}</div>}
//               {c.linkedAppointmentId && (
//                 <div style={{ fontSize:11, color:"var(--pp-muted)", marginTop:4 }}>🔗 Linked to appointment</div>
//               )}
//             </div>
//             {c.status === "scheduled" && (
//               <button className="pp-btn pp-btn-primary pp-btn-sm" onClick={() => setRoom(c)}
//                 style={{ background: c.type==="video"?"linear-gradient(135deg,#00bfa5,#0891b2)":undefined }}>
//                 {c.type === "video"     ? "📹 Join Video Call" :
//                  c.type === "physical" ? "🏥 Start Visit" :
//                                          "💬 Open Chat"}
//               </button>
//             )}
//             {c.status === "completed" && (
//               <Badge status="completed"/>
//             )}
//           </div>
//         ))}
//       </div>
 
//       {/* Request form */}
//       {showForm && (
//         <Modal title="Request Consultation" onClose={() => setForm(false)}>
//           <FG label="Doctor" required>
//             <select className="pp-input" value={form.doctorId} onChange={e => setF(f=>({...f,doctorId:e.target.value}))}>
//               <option value="">Select doctor…</option>
//               {doctors.map(d => <option key={d.id} value={d.id}>{d.name} — {d.specialty}</option>)}
//             </select>
//           </FG>
//           <FG label="Session Type">
//             <div className="pp-type-grid">
//               {[["video","📹 Video Call"],["physical","🏥 Physical Visit"],["chat","💬 Text Chat"]].map(([val,lbl]) => (
//                 <button key={val} className={`pp-type-btn ${form.type===val?"selected":""}`}
//                   onClick={() => setF(f=>({...f,type:val}))}>{lbl}</button>
//               ))}
//             </div>
//           </FG>
//           {form.type === "video" && (
//             <div style={{ background:"rgba(0,191,165,.07)", border:"1px solid rgba(0,191,165,.2)", borderRadius:10, padding:"10px 14px", fontSize:13, color:"#00897b", marginBottom:12 }}>
//               📹 A live video room will be created and both you and your doctor will be notified.
//             </div>
//           )}
//           <div className="pp-form-row">
//             <FG label="Date" required>
//               <input className="pp-input" type="date" min={todayStr()} value={form.date}
//                 onChange={e => setF(f=>({...f,date:e.target.value}))}/>
//             </FG>
//             <FG label="Time">
//               <select className="pp-input" value={form.time} onChange={e => setF(f=>({...f,time:e.target.value}))}>
//                 {["08:00","09:00","10:00","11:00","14:00","15:00","16:00"].map(t => <option key={t}>{t}</option>)}
//               </select>
//             </FG>
//           </div>
//           <FG label="Describe your concern">
//             <textarea className="pp-input pp-textarea" rows={3}
//               placeholder="What would you like to discuss with the doctor?"
//               value={form.notes} onChange={e => setF(f=>({...f,notes:e.target.value}))}/>
//           </FG>
//           <div style={{ display:"flex", gap:10, marginTop:20 }}>
//             <button className="pp-btn pp-btn-ghost" style={{ flex:1 }} onClick={() => setForm(false)}>Cancel</button>
//             <button className="pp-btn pp-btn-primary" style={{ flex:2 }} onClick={submit}>
//               {form.type === "video" ? "📹 Request Video Call" : "Request Session"}
//             </button>
//           </div>
//         </Modal>
//       )}
//     </div>
//   );
// }

// /* ── Consult Room (live video/chat simulation) ── */
// function ConsultRoom({ consultation, patient, onEnd }) {
//   const isVideo  = consultation.type==="video";
//   const [msgs,   setMsgs]  = useState([{ id:1, from:"system", text:`Session started with ${consultation.doctorName}.`, ts:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}) }]);
//   const [input,  setInput] = useState("");
//   const [muted,  setMuted] = useState(false);
//   const [camOff, setCam]   = useState(false);
//   const [secs,   setSecs]  = useState(0);
//   const chatRef = useRef(null);

//   const REPLIES = ["I understand, I'll check that for you.","Please follow the treatment plan carefully.","You seem to be recovering well.","Come back in two weeks for a follow-up.","Take the medication after meals."];

//   useEffect(()=>{
//     const t = setInterval(()=>setSecs(s=>s+1),1000);
//     const r = setTimeout(()=>setMsgs(m=>[...m,{ id:Date.now(), from:"doctor", text:`Hello ${patient.name}! Ready for our session today.`, ts:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}) }]),1800);
//     return ()=>{ clearInterval(t); clearTimeout(r); };
//   },[]);

//   useEffect(()=>{ chatRef.current?.scrollTo(0, chatRef.current.scrollHeight); },[msgs]);

//   const fmt = s=>`${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
//   const send = ()=>{
//     if(!input.trim())return;
//     const ts = new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});
//     setMsgs(m=>[...m,{ id:Date.now(), from:"patient", text:input.trim(), ts }]);
//     setInput("");
//     setTimeout(()=>setMsgs(m=>[...m,{ id:Date.now()+1, from:"doctor", text:REPLIES[Math.floor(Math.random()*REPLIES.length)], ts:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}) }]),1500+Math.random()*700);
//   };

//   return (
//     <div className="pp-animate">
//       {/* Session header */}
//       <div className="pp-session-hd">
//         <div style={{display:"flex",alignItems:"center",gap:12}}>
//           <div className="pp-live-badge"><span className="pp-live-dot"/>{isVideo?"Video":"Chat"} Session</div>
//           <strong>{consultation.doctorName}</strong>
//         </div>
//         <div style={{display:"flex",alignItems:"center",gap:10}}>
//           <span className="pp-timer">{fmt(secs)}</span>
//           {isVideo && <>
//             <button className={`pp-ctrl-btn ${muted?"pp-ctrl-btn--off":""}`} onClick={()=>setMuted(m=>!m)}>{muted?"🔇":"🎙️"}</button>
//             <button className={`pp-ctrl-btn ${camOff?"pp-ctrl-btn--off":""}`} onClick={()=>setCam(c=>!c)}>{camOff?"📷":"📹"}</button>
//           </>}
//           <button className="pp-btn pp-btn-danger pp-btn-sm" onClick={onEnd}>End Session</button>
//         </div>
//       </div>

//       <div style={{display:"flex",gap:16,minHeight:420}}>
//         {isVideo && (
//           <div className="pp-video-area">
//             {camOff
//               ?<div className="pp-cam-off"><i className="ti ti-camera-off" style={{fontSize:48,opacity:.3}}/><p>Camera off</p></div>
//               :<div className="pp-video-main">
//                 <Avatar name={consultation.doctorName} size={90}/>
//                 <p style={{marginTop:16,color:"rgba(255,255,255,.7)",fontSize:14}}>{consultation.doctorName}</p>
//                 <p style={{fontSize:12,color:"rgba(255,255,255,.4)",marginTop:4}}>🟢 Connected</p>
//               </div>
//             }
//             <div className="pp-video-self">
//               <Avatar name={patient.name} size={34}/>
//               <span style={{fontSize:10,color:"rgba(255,255,255,.5)",marginTop:4}}>You</span>
//             </div>
//             {muted && <div className="pp-muted-pill">🔇 Muted</div>}
//           </div>
//         )}

//         {/* Chat panel */}
//         <div className={`pp-chat-panel ${!isVideo?"pp-chat-panel--full":""}`}>
//           <div className="pp-chat-panel-hd">Session Chat</div>
//           <div className="pp-chat-messages" ref={chatRef}>
//             {msgs.map(m=>(
//               <div key={m.id} className={`pp-bubble-wrap pp-bubble-wrap--${m.from}`}>
//                 {m.from==="system"
//                   ?<div className="pp-system-msg">{m.text}</div>
//                   :<>
//                     <div className={`pp-bubble pp-bubble--${m.from}`}>{m.text}</div>
//                     <span className="pp-bubble-ts">{m.from==="patient"?"You":consultation.doctorName} · {m.ts}</span>
//                   </>
//                 }
//               </div>
//             ))}
//           </div>
//           <div className="pp-chat-input">
//             <input className="pp-input" placeholder="Type a message…" value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()}/>
//             <button className="pp-btn pp-btn-primary" onClick={send} disabled={!input.trim()}>Send</button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// /* ═══════════════════════════════════════════════════════════════
//    PAGE — HOME SERVICE
// ═══════════════════════════════════════════════════════════════ */
// // function PatHomeVisit({ patient, patientId, showToast }) {
// //   const doctors = doctorDB.all().filter(d=>d.status==="active");
// //   const [items,  setItems]  = useState(homeDB.forPatient(patientId));
// //   const [loading,setLoad]   = useState(false);
// //   const [errs,   setErrs]   = useState({});
// //   const SERVICES = ["Dental Check-up","Scaling","Whitening","Braces Adjustment","Post-Op Check","Emergency Consult","Implant Check"];
// //   const [form, setForm] = useState({ doctorId:"", service:"", date:"", time:"", address:patient.address||"", notes:"" });

// //   const refresh = () => setItems(homeDB.forPatient(patientId));

// //   const submit = async (e) => {
// //     e.preventDefault();
// //     const er={};
// //     if(!form.doctorId)       er.doctorId="Select a doctor";
// //     if(!form.service)        er.service ="Select a service";
// //     if(!form.date)           er.date    ="Select a date";
// //     if(!form.address.trim()) er.address ="Enter your address";
// //     if(Object.keys(er).length){setErrs(er);return;}
// //     setLoad(true);
// //     await new Promise(r=>setTimeout(r,700));
// //     const d = doctorDB.byId(form.doctorId);
// //     homeDB.add({ id:uid(), ...form, patientId, patientName:patient.name, doctorId:form.doctorId, doctorName:d?.name, status:"pending", createdAt:nowISO() });
// //     pushNotif(form.doctorId,"home_visit","Home Visit Request",
// //       `${patient.name} requested a home visit for ${form.service} on ${form.date}.`);
// //     pushNotif("admin","home_visit","Home Visit Requested",
// //       `${patient.name} requested home service from ${d?.name}.`);
// //     setForm({ doctorId:"",service:"",date:"",time:"",address:patient.address||"",notes:"" });
// //     setErrs({}); setLoad(false); refresh(); showToast("Home visit requested!");
// //     window.dispatchEvent(new Event("stech_refresh"));
// //   };

// //   return (
// //     <div className="pp-animate">
// //       <div className="pp-page-hd"><div><h1 className="pp-page-title">Home Dental Service</h1><p className="pp-page-sub">Request a specialist to visit you at home</p></div></div>
// //       <div className="pp-two-col">
// //         <div className="pp-card">
// //           <div className="pp-card-title" style={{marginBottom:18}}>Request a Home Visit</div>
// //           <form onSubmit={submit} noValidate style={{display:"flex",flexDirection:"column",gap:14}}>
// //             <FG label="Select Doctor" required>
// //               <select className={`pp-input ${errs.doctorId?"pp-input--err":""}`} value={form.doctorId} onChange={e=>{setForm(f=>({...f,doctorId:e.target.value}));setErrs(er=>({...er,doctorId:""}));}}>
// //                 <option value="">Choose doctor…</option>
// //                 {doctors.map(d=><option key={d.id} value={d.id}>{d.name} — {d.specialty}</option>)}
// //               </select>
// //               {errs.doctorId&&<p className="pp-field-err">{errs.doctorId}</p>}
// //             </FG>
// //             <FG label="Service Needed" required>
// //               <select className={`pp-input ${errs.service?"pp-input--err":""}`} value={form.service} onChange={e=>{setForm(f=>({...f,service:e.target.value}));setErrs(er=>({...er,service:""}));}}>
// //                 <option value="">Select service…</option>
// //                 {SERVICES.map(s=><option key={s} value={s}>{s}</option>)}
// //               </select>
// //               {errs.service&&<p className="pp-field-err">{errs.service}</p>}
// //             </FG>
// //             <div className="pp-form-row">
// //               <FG label="Date" required>
// //                 <input className={`pp-input ${errs.date?"pp-input--err":""}`} type="date" min={todayStr()} value={form.date} onChange={e=>{setForm(f=>({...f,date:e.target.value}));setErrs(er=>({...er,date:""}));}}/>
// //                 {errs.date&&<p className="pp-field-err">{errs.date}</p>}
// //               </FG>
// //               <FG label="Preferred Time">
// //                 <select className="pp-input" value={form.time} onChange={e=>setForm(f=>({...f,time:e.target.value}))}>
// //                   <option value="">Any time</option>
// //                   {["08:00","09:00","10:00","11:00","14:00","15:00","16:00"].map(t=><option key={t}>{t}</option>)}
// //                 </select>
// //               </FG>
// //             </div>
// //             <FG label="Your Address" required>
// //               <input className={`pp-input ${errs.address?"pp-input--err":""}`} placeholder="Street, Neighbourhood, City" value={form.address} onChange={e=>{setForm(f=>({...f,address:e.target.value}));setErrs(er=>({...er,address:""}));}}/>
// //               {errs.address&&<p className="pp-field-err">{errs.address}</p>}
// //             </FG>
// //             <FG label="Additional Notes">
// //               <textarea className="pp-input pp-textarea" rows={3} placeholder="Gate colour, floor, access instructions…" value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))}/>
// //             </FG>
// //             {/* Map placeholder */}
// //             <div className="pp-map-placeholder">
// //               <i className="ti ti-map-2" style={{fontSize:36,opacity:.3}}/>
// //               <p>Real-time doctor tracking will appear here once your request is accepted.</p>
// //             </div>
// //             <button className="pp-btn pp-btn-primary" type="submit" disabled={loading} style={{padding:"14px"}}>
// //               {loading && <span className="pp-spinner"/>}
// //               {loading?"Submitting…":"🏠 Request Home Visit"}
// //             </button>
// //           </form>
// //         </div>

// //         {/* My requests */}
// //         <div>
// //           <div className="pp-card-title" style={{marginBottom:12}}>My Requests</div>
// //           {items.length===0
// //             ?<div className="pp-card"><div className="pp-empty"><i className="ti ti-home" style={{fontSize:36}}/><p>No home visit requests yet.</p></div></div>
// //             :items.map(r=>(
// //               <div key={r.id} className="pp-card" style={{marginBottom:12}}>
// //                 <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
// //                   <div>
// //                     <div style={{fontWeight:700,fontSize:15}}>{r.service}</div>
// //                     <div style={{fontSize:13,color:"var(--pp-muted)"}}>{r.doctorName}</div>
// //                   </div>
// //                   <Badge status={r.status}/>
// //                 </div>
// //                 <div style={{fontSize:13,color:"var(--pp-muted)"}}>📍 {r.address}</div>
// //                 <div style={{fontSize:13,color:"var(--pp-muted)",marginTop:4}}>📅 {r.date}{r.time&&` at ${r.time}`}</div>
// //                 {r.status==="accepted" && (
// //                   <div className="pp-tracking-bar">
// //                     <div className="pp-live-badge"><span className="pp-live-dot"/>Doctor is on the way</div>
// //                     <span style={{fontSize:13,color:"var(--pp-muted)"}}>ETA: ~25 min</span>
// //                   </div>
// //                 )}
// //               </div>
// //             ))
// //           }
// //         </div>
// //       </div>
// //     </div>
// //   );
// // }

// function PatHomeVisit({ patient, patientId, showToast }) {
//   const doctors = doctorDB.all().filter(d => d.status === "active");
//   const [items,  setItems]  = useState(homeDB.forPatient(patientId));
//   const [loading, setLoad]  = useState(false);
//   const [errs,   setErrs]   = useState({});
//   const [activeMap, setMap] = useState(null);
//   const SERVICES = ["Dental Check-up","Scaling","Whitening","Braces Adjustment","Post-Op Check","Emergency Consult","Implant Check"];
//   const [form, setForm] = useState({ doctorId:"", service:"", date:"", time:"", address:patient.address||"", notes:"" });
 
//   const refresh = () => setItems(homeDB.forPatient(patientId));
 
//   const submit = async (e) => {
//     e.preventDefault();
//     const er = {};
//     if (!form.doctorId)       er.doctorId = "Select a doctor";
//     if (!form.service)        er.service  = "Select a service";
//     if (!form.date)           er.date     = "Select a date";
//     if (!form.address.trim()) er.address  = "Enter your address";
//     if (Object.keys(er).length) { setErrs(er); return; }
//     setLoad(true);
//     await new Promise(r => setTimeout(r, 700));
//     const d = doctorDB.byId(form.doctorId);
//     homeDB.add({ id:uid(), ...form, patientId, patientName:patient.name, doctorId:form.doctorId, doctorName:d?.name, status:"pending", createdAt:nowISO() });
//     pushNotif(form.doctorId, "home_visit", "🏠 Home Visit Request",
//       `${patient.name} requested a home visit for ${form.service} on ${form.date}.`);
//     pushNotif("admin","home_visit","Home Visit Requested",
//       `${patient.name} requested home service from ${d?.name}.`);
//     setForm({ doctorId:"", service:"", date:"", time:"", address:patient.address||"", notes:"" });
//     setErrs({}); setLoad(false); refresh();
//     showToast("Home visit requested! 🏠");
//     window.dispatchEvent(new Event("stech_refresh"));
//   };
 
//   if (activeMap) return (
//     <div className="pp-animate">
//       <div className="pp-page-hd">
//         <div><h1 className="pp-page-title">Live Tracking</h1><p className="pp-page-sub">Dr. {activeMap.doctorName} on the way</p></div>
//         <button className="pp-btn pp-btn-ghost" onClick={() => setMap(null)}>← Back</button>
//       </div>
//       <div className="pp-card">
//         <LiveMap visit={activeMap} role="patient"/>
//       </div>
//     </div>
//   );
 
//   return (
//     <div className="pp-animate">
//       <div className="pp-page-hd">
//         <div><h1 className="pp-page-title">Home Dental Service</h1><p className="pp-page-sub">Request a specialist to visit you</p></div>
//       </div>
//       <div className="pp-two-col">
//         {/* Request form */}
//         <div className="pp-card">
//           <div className="pp-card-title" style={{ marginBottom:18 }}>Request a Home Visit</div>
//           <form onSubmit={submit} noValidate style={{ display:"flex", flexDirection:"column", gap:14 }}>
//             <FG label="Select Doctor" required>
//               <select className={`pp-input ${errs.doctorId?"pp-input--err":""}`} value={form.doctorId}
//                 onChange={e => { setForm(f=>({...f,doctorId:e.target.value})); setErrs(er=>({...er,doctorId:""})); }}>
//                 <option value="">Choose doctor…</option>
//                 {doctors.map(d => <option key={d.id} value={d.id}>{d.name} — {d.specialty}</option>)}
//               </select>
//               {errs.doctorId && <p className="pp-field-err">{errs.doctorId}</p>}
//             </FG>
//             <FG label="Service Needed" required>
//               <select className={`pp-input ${errs.service?"pp-input--err":""}`} value={form.service}
//                 onChange={e => { setForm(f=>({...f,service:e.target.value})); setErrs(er=>({...er,service:""})); }}>
//                 <option value="">Select service…</option>
//                 {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
//               </select>
//               {errs.service && <p className="pp-field-err">{errs.service}</p>}
//             </FG>
//             <div className="pp-form-row">
//               <FG label="Date" required>
//                 <input className={`pp-input ${errs.date?"pp-input--err":""}`} type="date" min={todayStr()} value={form.date}
//                   onChange={e => { setForm(f=>({...f,date:e.target.value})); setErrs(er=>({...er,date:""})); }}/>
//                 {errs.date && <p className="pp-field-err">{errs.date}</p>}
//               </FG>
//               <FG label="Preferred Time">
//                 <select className="pp-input" value={form.time} onChange={e => setForm(f=>({...f,time:e.target.value}))}>
//                   <option value="">Any time</option>
//                   {["08:00","09:00","10:00","11:00","14:00","15:00","16:00"].map(t => <option key={t}>{t}</option>)}
//                 </select>
//               </FG>
//             </div>
//             <FG label="Your Address" required>
//               <input className={`pp-input ${errs.address?"pp-input--err":""}`}
//                 placeholder="Street, Neighbourhood, City"
//                 value={form.address}
//                 onChange={e => { setForm(f=>({...f,address:e.target.value})); setErrs(er=>({...er,address:""})); }}/>
//               {errs.address && <p className="pp-field-err">{errs.address}</p>}
//             </FG>
//             <FG label="Additional Notes">
//               <textarea className="pp-input pp-textarea" rows={3}
//                 placeholder="Gate colour, floor, access instructions…"
//                 value={form.notes} onChange={e => setForm(f=>({...f,notes:e.target.value}))}/>
//             </FG>
//             <div style={{ background:"rgba(30,136,229,.07)", border:"1px solid rgba(30,136,229,.18)", borderRadius:10, padding:"10px 14px", fontSize:13, color:"#1565c0" }}>
//               🗺️ Once your doctor accepts, a live GPS map will appear here to track their journey to you.
//             </div>
//             <button className="pp-btn pp-btn-primary" type="submit" disabled={loading} style={{ padding:14 }}>
//               {loading && <span className="pp-spinner"/>}
//               {loading ? "Submitting…" : "🏠 Request Home Visit"}
//             </button>
//           </form>
//         </div>
 
//         {/* My requests */}
//         <div>
//           <div className="pp-card-title" style={{ marginBottom:12 }}>My Requests</div>
//           {items.length === 0 ? (
//             <div className="pp-card">
//               <div className="pp-empty">
//                 <i className="ti ti-home" style={{ fontSize:36 }}/>
//                 <p>No home visit requests yet.</p>
//               </div>
//             </div>
//           ) : items.map(r => (
//             <div key={r.id} className="pp-card" style={{ marginBottom:12 }}>
//               <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
//                 <div>
//                   <div style={{ fontWeight:700, fontSize:15 }}>{r.service}</div>
//                   <div style={{ fontSize:13, color:"var(--pp-muted)" }}>{r.doctorName}</div>
//                 </div>
//                 <Badge status={r.status}/>
//               </div>
//               <div style={{ fontSize:13, color:"var(--pp-muted)" }}>📍 {r.address}</div>
//               <div style={{ fontSize:13, color:"var(--pp-muted)", marginTop:4 }}>📅 {r.date}{r.time && ` at ${r.time}`}</div>
 
//               {/* Live tracking section */}
//               {(r.status === "accepted" || r.status === "pending") && (
//                 <div style={{ marginTop:12 }}>
//                   {r.status === "accepted" ? (
//                     <div>
//                       <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
//                         <div style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(0,191,165,.1)", border:"1px solid rgba(0,191,165,.25)", borderRadius:20, padding:"5px 12px" }}>
//                           <div style={{ width:7, height:7, borderRadius:"50%", background:"#00bfa5", animation:"pulse 1s infinite" }}/>
//                           <span style={{ fontSize:12, fontWeight:700, color:"#00897b" }}>Doctor is on the way</span>
//                         </div>
//                         <button className="pp-ghost-btn" onClick={() => setMap(r)}>
//                           🗺️ Track Live
//                         </button>
//                       </div>
//                       {/* Inline mini map preview */}
//                       <LiveMap visit={r} role="patient"/>
//                     </div>
//                   ) : (
//                     <div style={{ background:"#fef3c7", border:"1px solid #fde68a", borderRadius:10, padding:"10px 14px", fontSize:13, color:"#d97706", marginTop:8 }}>
//                       ⏳ Awaiting doctor confirmation. Live tracking activates when accepted.
//                     </div>
//                   )}
//                 </div>
//               )}
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// }

// /* ═══════════════════════════════════════════════════════════════
//    PAGE — PRESCRIPTIONS
// ═══════════════════════════════════════════════════════════════ */
// function PatPrescriptions({ patientId }) {
//   const items = prescDB.forPatient(patientId);
//   return (
//     <div className="pp-animate">
//       <div className="pp-page-hd"><div><h1 className="pp-page-title">Prescriptions</h1><p className="pp-page-sub">{items.length} issued</p></div></div>
//       {items.length===0
//         ?<div className="pp-card"><div className="pp-empty"><i className="ti ti-pill" style={{fontSize:36}}/><p>No prescriptions yet.</p></div></div>
//         :<div className="pp-rx-grid">
//           {items.map(rx=>(
//             <div key={rx.id} className="pp-rx-card">
//               <div className="pp-rx-header">
//                 <i className="ti ti-pill" style={{fontSize:28}}/>
//                 <div>
//                   <div style={{fontWeight:800,fontSize:17}}>{rx.medication}</div>
//                   <div style={{fontSize:12,opacity:.8,marginTop:2}}>By {rx.doctorName}</div>
//                 </div>
//               </div>
//               <div className="pp-rx-body">
//                 {[["Dosage",rx.dosage],["Duration",rx.duration],["Date",rx.date],["Instructions",rx.notes||"—"]].map(([k,v])=>(
//                   <div key={k} className="pp-detail-row"><span className="pp-detail-key">{k}</span><span className="pp-detail-val">{v}</span></div>
//                 ))}
//               </div>
//             </div>
//           ))}
//         </div>
//       }
//     </div>
//   );
// }

// /* ═══════════════════════════════════════════════════════════════
//    PAGE — MEDICAL RECORDS
// ═══════════════════════════════════════════════════════════════ */
// function PatRecords({ patientId }) {
//   const items = recordDB.forPatient(patientId);
//   const ICONS = { procedure:"🔧", imaging:"🩻", lab:"🧪", prescription:"💊", note:"📝", other:"📋" };
//   return (
//     <div className="pp-animate">
//       <div className="pp-page-hd"><div><h1 className="pp-page-title">Medical Records</h1><p className="pp-page-sub">Your complete health history</p></div></div>
//       {items.length===0
//         ?<div className="pp-card"><div className="pp-empty"><i className="ti ti-clipboard-heart" style={{fontSize:36}}/><p>No medical records yet.</p></div></div>
//         :<div style={{display:"flex",flexDirection:"column",gap:12}}>
//           {items.map(r=>(
//             <div key={r.id} className="pp-card pp-record-row">
//               <div style={{fontSize:32,flexShrink:0}}>{ICONS[r.type]||"📋"}</div>
//               <div style={{flex:1}}>
//                 <div style={{fontWeight:700,fontSize:16,marginBottom:4}}>{r.title}</div>
//                 <div style={{fontSize:13,color:"var(--pp-muted)",marginBottom:8}}>{r.description}</div>
//                 <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
//                   <Badge status={r.type}/><span style={{fontSize:12,color:"var(--pp-muted)"}}>{r.date}</span>
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       }
//     </div>
//   );
// }

// /* ═══════════════════════════════════════════════════════════════
//    PAGE — PAYMENTS
// ═══════════════════════════════════════════════════════════════ */
// function PatPayments({ patientId, showToast }) {
//   const [items,    setItems]   = useState(paymentDB.forPatient(patientId));
//   const [payModal, setPayModal]= useState(null);
//   const refresh = () => setItems(paymentDB.forPatient(patientId));
//   const pending = items.filter(p=>p.status==="pending");
//   const totalPaid = items.filter(p=>p.status==="paid").reduce((s,p)=>s+p.amount,0);

//   const pay = async (id, method) => {
//     await new Promise(r=>setTimeout(r,800));
//     const p = paymentDB.update(id, { status:"paid", method });
//     const earning = Math.round((p.amount * 20)/100);
//     paymentDB.update(id,{ adminEarning:earning });
//     pushNotif("admin","payment","Payment Received",
//       `${fmtMoney(p.amount)} received. Admin commission: ${fmtMoney(earning)}.`);
//     refresh(); setPayModal(null); showToast("Payment successful! 🎉");
//     window.dispatchEvent(new Event("stech_refresh"));
//   };

//   return (
//     <div className="pp-animate">
//       <div className="pp-page-hd"><div><h1 className="pp-page-title">Payments</h1><p className="pp-page-sub">Your billing history</p></div></div>

//       {pending.length>0 && (
//         <div className="pp-payment-alert">
//           ⚠️ You have <strong>{pending.length}</strong> pending payment{pending.length>1?"s":""} totalling <strong>{fmtMoney(pending.reduce((s,p)=>s+p.amount,0))}</strong>
//         </div>
//       )}

//       <div className="pp-stats-grid" style={{gridTemplateColumns:"repeat(3,1fr)"}}>
//         {[
//           { label:"Total Paid",  value:fmtMoney(totalPaid), icon:"ti-check-circle", bg:"#dcfce7", c:"#16a34a" },
//           { label:"Pending",     value:fmtMoney(pending.reduce((s,p)=>s+p.amount,0)), icon:"ti-clock", bg:"#fef3c7", c:"#d97706" },
//           { label:"Transactions",value:items.length, icon:"ti-receipt", bg:"#dbeafe", c:"#1e88e5" },
//         ].map(s=>(
//           <div key={s.label} className="pp-stat-card">
//             <div className="pp-stat-icon" style={{background:s.bg,color:s.c}}><i className={`ti ${s.icon}`}/></div>
//             <div><div className="pp-stat-label">{s.label}</div><div className="pp-stat-value" style={{fontSize:17}}>{s.value}</div></div>
//           </div>
//         ))}
//       </div>

//       <div style={{display:"flex",flexDirection:"column",gap:12}}>
//         {items.length===0 && <div className="pp-card"><div className="pp-empty"><i className="ti ti-credit-card" style={{fontSize:36}}/><p>No payment history.</p></div></div>}
//         {items.map(p=>(
//           <div key={p.id} className="pp-card pp-pay-row">
//             <div style={{fontSize:28}}>{p.status==="paid"?"✅":"⏳"}</div>
//             <div style={{flex:1}}>
//               <div style={{fontWeight:700,fontSize:15}}>{p.service}</div>
//               <div style={{fontSize:12,color:"var(--pp-muted)",marginTop:3}}>{p.date} · {p.method||"—"} · Ref: {p.txRef}</div>
//             </div>
//             <div style={{fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:18,flexShrink:0}}>{fmtMoney(p.amount)}</div>
//             <div style={{display:"flex",gap:8,alignItems:"center"}}>
//               <Badge status={p.status}/>
//               {p.status==="pending" && (
//                 <button className="pp-btn pp-btn-primary pp-btn-sm" onClick={()=>setPayModal(p)}>Pay Now</button>
//               )}
//             </div>
//           </div>
//         ))}
//       </div>

//       {payModal && (
//         <Modal title="Pay Now" subtitle={payModal.service} onClose={()=>setPayModal(null)} width={420}>
//           <div style={{textAlign:"center",marginBottom:24}}>
//             <div style={{fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:32,color:"var(--pp-navy)"}}>{fmtMoney(payModal.amount)}</div>
//             <div style={{color:"var(--pp-muted)",fontSize:14}}>{payModal.service}</div>
//           </div>
//           <div className="pp-pay-methods">
//             {[["📱","Mobile Money","Mobile Money"],["🟡","MTN MoMo","MTN MoMo"],["🟠","Orange Money","Orange Money"],["💳","Bank Card","Card"],["💵","Cash","Cash"]].map(([icon,lbl,m])=>(
//               <button key={m} className="pp-pay-method-btn" onClick={()=>pay(payModal.id, m)}>
//                 <span style={{fontSize:26}}>{icon}</span>
//                 <span style={{fontWeight:700,fontSize:13}}>{lbl}</span>
//               </button>
//             ))}
//           </div>
//         </Modal>
//       )}
//     </div>
//   );
// }

// /* ═══════════════════════════════════════════════════════════════
//    PAGE — MESSAGES  (patient ↔ doctor + admin)
// ═══════════════════════════════════════════════════════════════ */
// // function PatMessages({ patient, patientId }) {
// //   const doctors  = doctorDB.all();
// //   const contacts = [
// //     { id:"admin", name:"Admin / Support", role:"Platform Support" },
// //     ...doctors.map(d => ({ id:d.id, name:d.name, role:d.specialty })),
// //   ];
// //   const [selId, setSelId] = useState(patient.preferredDoctorId || doctors[0]?.id || "admin");
// //   const [msgs,  setMsgs]  = useState([]);
// //   const [input, setInput] = useState("");
// //   const chatRef = useRef(null);

// //   const loadThread = useCallback((cid) => {
// //     const all = messageDB.all();
// //     const thread = all.filter(m =>
// //       (m.fromId===patientId && m.toId===cid) ||
// //       (m.fromId===cid && m.toId===patientId)
// //     ).sort((a,b)=>a.createdAt.localeCompare(b.createdAt));
// //     thread.filter(m=>m.toId===patientId&&!m.read).forEach(m=>messageDB.update(m.id,{read:true}));
// //     setMsgs(thread);
// //   }, [patientId]);

// //   useEffect(()=>{ loadThread(selId); },[selId, loadThread]);
// //   useEffect(()=>{ const t = setInterval(()=>loadThread(selId),3000); return ()=>clearInterval(t); },[selId, loadThread]);
// //   useEffect(()=>{ chatRef.current?.scrollTo(0, chatRef.current.scrollHeight); },[msgs]);

// //   const send = ()=>{
// //     if(!input.trim()) return;
// //     const contact = contacts.find(c=>c.id===selId);
// //     messageDB.add({ id:uid(), fromId:patientId, fromName:patient.name, toId:selId, toName:contact?.name||"", body:input.trim(), read:false, createdAt:nowISO() });
// //     pushNotif(selId, "message", `Message from ${patient.name}`, input.trim());
// //     setInput(""); loadThread(selId);
// //   };

// //   const contact = contacts.find(c=>c.id===selId);
// //   const unreadPerContact = (cid) => messageDB.all().filter(m=>m.fromId===cid&&m.toId===patientId&&!m.read).length;

// //   return (
// //     <div className="pp-animate">
// //       <div className="pp-page-hd"><div><h1 className="pp-page-title">Messages</h1><p className="pp-page-sub">Chat with your doctors & support</p></div></div>
// //       <div className="pp-msg-layout">
// //         {/* Contacts */}
// //         <div className="pp-msg-contacts">
// //           <div className="pp-msg-contacts-hd">Contacts</div>
// //           {contacts.map(c=>{
// //             const u = unreadPerContact(c.id);
// //             return (
// //               <div key={c.id} className={`pp-msg-contact ${selId===c.id?"active":""}`} onClick={()=>setSelId(c.id)}>
// //                 <div style={{position:"relative"}}>
// //                   <Avatar name={c.name} size={38}/>
// //                   {u>0 && <div className="pp-contact-dot"/>}
// //                 </div>
// //                 <div style={{flex:1,overflow:"hidden"}}>
// //                   <div style={{fontWeight:700,fontSize:13,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{c.name}</div>
// //                   <div style={{fontSize:11,color:"var(--pp-muted)"}}>{c.role}</div>
// //                 </div>
// //                 {c.id===patient.preferredDoctorId && <span className="pp-preferred-chip" style={{fontSize:10}}>Primary</span>}
// //               </div>
// //             );
// //           })}
// //         </div>

// //         {/* Chat */}
// //         <div className="pp-msg-chat">
// //           <div className="pp-msg-chat-hd">
// //             <Avatar name={contact?.name||""} size={38}/>
// //             <div>
// //               <div style={{fontWeight:700,fontSize:15}}>{contact?.name}</div>
// //               <div style={{fontSize:12,color:"#00bfa5"}}>● Online</div>
// //             </div>
// //           </div>
// //           <div className="pp-chat-messages" ref={chatRef}>
// //             {msgs.length===0 && <div className="pp-empty" style={{flex:1}}><i className="ti ti-message-circle" style={{fontSize:32,opacity:.3}}/><p>No messages yet. Say hello! 👋</p></div>}
// //             {msgs.map(m=>(
// //               <div key={m.id} className={`pp-bubble-wrap pp-bubble-wrap--${m.fromId===patientId?"patient":"doctor"}`}>
// //                 <div className={`pp-bubble pp-bubble--${m.fromId===patientId?"patient":"doctor"}`}>{m.body}</div>
// //                 <span className="pp-bubble-ts">{m.fromId===patientId?"You":contact?.name} · {new Date(m.createdAt).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}</span>
// //               </div>
// //             ))}
// //           </div>
// //           <div className="pp-chat-input">
// //             <input className="pp-input" placeholder={`Message ${contact?.name}…`} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()}/>
// //             <button className="pp-btn pp-btn-primary" onClick={send} disabled={!input.trim()}>
// //               <i className="ti ti-send"/> Send
// //             </button>
// //           </div>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // }

// function PatMessages({ patient, patientId }) {
//   const doctors  = doctorDB.all();
//   const contacts = [
//     { id:"admin", name:"Admin / Support", role:"Platform Support" },
//     ...doctors.map(d => ({ id:d.id, name:d.name, role:d.specialty })),
//   ];
//   const [selId,   setSelId]   = useState(patient.preferredDoctorId || doctors[0]?.id || "admin");
//   const [msgs,    setMsgs]    = useState([]);
//   const [input,   setInput]   = useState("");
//   const [typing,  setTyping]  = useState(false);
//   const chatRef = useRef(null);
 
//   const loadThread = useCallback((cid) => {
//     const all = messageDB.all();
//     const thread = all.filter(m =>
//       (m.fromId === patientId && m.toId === cid) ||
//       (m.fromId === cid && m.toId === patientId)
//     ).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
//     thread.filter(m => m.toId === patientId && !m.read).forEach(m => messageDB.update(m.id, {read:true}));
//     setMsgs(thread);
//   }, [patientId]);
 
//   useEffect(() => { loadThread(selId); }, [selId, loadThread]);
//   // Faster polling for near-realtime feel
//   useEffect(() => { const t = setInterval(() => loadThread(selId), 1500); return () => clearInterval(t); }, [selId, loadThread]);
//   useEffect(() => { chatRef.current?.scrollTo(0, chatRef.current.scrollHeight); }, [msgs]);
 
//   const send = () => {
//     if (!input.trim()) return;
//     const contact = contacts.find(c => c.id === selId);
//     messageDB.add({ id:uid(), fromId:patientId, fromName:patient.name, toId:selId, toName:contact?.name||"", body:input.trim(), read:false, createdAt:nowISO() });
//     pushNotif(selId, "message", `💬 Message from ${patient.name}`, input.trim());
//     setInput(""); loadThread(selId);
 
//     // Simulate typing + auto-reply
//     setTyping(true);
//     setTimeout(() => {
//       const replies = ["Thanks for reaching out! I'll get back to you shortly.", "I've noted your concern — see you at your appointment.", "Please take the prescribed medication and rest.", "Let me check your file and get back to you."];
//       messageDB.add({ id:uid(), fromId:selId, fromName:contact?.name||"Admin", toId:patientId, toName:patient.name, body:replies[Math.floor(Math.random()*replies.length)], read:false, createdAt:nowISO() });
//       setTyping(false);
//       loadThread(selId);
//     }, 2000 + Math.random() * 1500);
//   };
 
//   const contact = contacts.find(c => c.id === selId);
//   const unreadPerContact = (cid) => messageDB.all().filter(m => m.fromId===cid && m.toId===patientId && !m.read).length;
 
//   return (
//     <div className="pp-animate">
//       <div className="pp-page-hd"><div><h1 className="pp-page-title">Messages</h1><p className="pp-page-sub">Chat with your doctors & support</p></div></div>
//       <div className="pp-msg-layout">
//         {/* Contacts */}
//         <div className="pp-msg-contacts">
//           <div className="pp-msg-contacts-hd">Contacts</div>
//           {contacts.map(c => {
//             const u = unreadPerContact(c.id);
//             return (
//               <div key={c.id} className={`pp-msg-contact ${selId===c.id?"active":""}`} onClick={() => setSelId(c.id)}>
//                 <div style={{ position:"relative" }}>
//                   <Avatar name={c.name} size={38}/>
//                   {u > 0 && <div className="pp-contact-dot"/>}
//                 </div>
//                 <div style={{ flex:1, overflow:"hidden" }}>
//                   <div style={{ fontWeight:700, fontSize:13, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{c.name}</div>
//                   <div style={{ fontSize:11, color:"var(--pp-muted)" }}>{c.role}</div>
//                 </div>
//                 {c.id === patient.preferredDoctorId && <span className="pp-preferred-chip" style={{ fontSize:10 }}>Primary</span>}
//               </div>
//             );
//           })}
//         </div>
 
//         {/* Chat */}
//         <div className="pp-msg-chat">
//           <div className="pp-msg-chat-hd">
//             <Avatar name={contact?.name||""} size={38}/>
//             <div>
//               <div style={{ fontWeight:700, fontSize:15 }}>{contact?.name}</div>
//               <div style={{ fontSize:12, color:"#00bfa5", display:"flex", alignItems:"center", gap:5 }}>
//                 <div style={{ width:7, height:7, borderRadius:"50%", background:"#00bfa5", animation:"pulse 2s infinite" }}/>
//                 Online
//               </div>
//             </div>
//           </div>
//           <div className="pp-chat-messages" ref={chatRef}>
//             {msgs.length === 0 && (
//               <div className="pp-empty" style={{ flex:1 }}>
//                 <i className="ti ti-message-circle" style={{ fontSize:32, opacity:.3 }}/>
//                 <p>No messages yet. Say hello! 👋</p>
//               </div>
//             )}
//             {msgs.map(m => (
//               <div key={m.id} className={`pp-bubble-wrap pp-bubble-wrap--${m.fromId===patientId?"patient":"doctor"}`}>
//                 <div className={`pp-bubble pp-bubble--${m.fromId===patientId?"patient":"doctor"}`}>{m.body}</div>
//                 <span className="pp-bubble-ts">
//                   {m.fromId === patientId ? "You" : contact?.name} · {new Date(m.createdAt).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}
//                 </span>
//               </div>
//             ))}
//             {typing && (
//               <div style={{ display:"flex", alignItems:"center", gap:6, color:"var(--pp-muted)", fontSize:12, padding:"4px 0" }}>
//                 <div style={{ display:"flex", gap:3 }}>
//                   {[0,1,2].map(i => <div key={i} style={{ width:6, height:6, borderRadius:"50%", background:"#00bfa5", animation:`pulse ${.8+i*.15}s ease-in-out infinite`, animationDelay:`${i*.15}s` }}/>)}
//                 </div>
//                 {contact?.name} is typing…
//               </div>
//             )}
//           </div>
//           <div className="pp-chat-input">
//             <input className="pp-input" placeholder={`Message ${contact?.name}…`}
//               value={input} onChange={e => setInput(e.target.value)}
//               onKeyDown={e => e.key === "Enter" && send()}/>
//             <button className="pp-btn pp-btn-primary" onClick={send} disabled={!input.trim()}>
//               <i className="ti ti-send"/> Send
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// /* ═══════════════════════════════════════════════════════════════
//    PAGE — NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════ */
// function PatNotifications({ patientId, showToast }) {
//   const [items, setItems] = useState([]);
//   const refresh = () => {
//     const all = notifDB.all().filter(n=>n.toId===patientId).reverse();
//     setItems(all);
//   };
//   useEffect(()=>{ refresh(); },[patientId]);

//   const markAll = () => {
//     notifDB.all().filter(n=>n.toId===patientId&&!n.read).forEach(n=>notifDB.update(n.id,{read:true}));
//     refresh(); showToast("All marked as read","info");
//   };
//   const markOne = (id) => { notifDB.update(id,{read:true}); refresh(); };

//   const ICON = { appointment:"ti-calendar", payment:"ti-credit-card", prescription:"ti-pill", consultation:"ti-video", message:"ti-message-circle", home_visit:"ti-home", record:"ti-clipboard-heart", patient:"ti-user" };
//   const COLOR= { appointment:"#1e88e5", payment:"#7c3aed", prescription:"#16a34a", consultation:"#7c3aed", message:"#f59e0b", home_visit:"#00bfa5", record:"#be185d", patient:"#f44336" };

//   return (
//     <div className="pp-animate">
//       <div className="pp-page-hd">
//         <div><h1 className="pp-page-title">Notifications</h1><p className="pp-page-sub">{items.filter(n=>!n.read).length} unread</p></div>
//         {items.some(n=>!n.read) && <button className="pp-btn pp-btn-ghost" onClick={markAll}>Mark all read</button>}
//       </div>
//       <div className="pp-card" style={{padding:0,overflow:"hidden"}}>
//         {items.length===0
//           ?<div className="pp-empty" style={{padding:48}}><i className="ti ti-bell-off" style={{fontSize:36,opacity:.3}}/><p>No notifications yet.</p></div>
//           :items.map(n=>(
//             <div key={n.id} className={`pp-notif-item ${!n.read?"pp-notif-item--unread":""}`} onClick={()=>markOne(n.id)}>
//               <div className="pp-notif-icon" style={{background:(COLOR[n.type]||"#888")+"22",color:COLOR[n.type]||"#888"}}>
//                 <i className={`ti ${ICON[n.type]||"ti-bell"}`}/>
//               </div>
//               <div style={{flex:1}}>
//                 <div style={{fontWeight:700,fontSize:14}}>{n.title}</div>
//                 <div style={{fontSize:13,color:"var(--pp-muted)",marginTop:2,lineHeight:1.5}}>{n.body}</div>
//                 <div style={{fontSize:11,color:"var(--pp-muted)",marginTop:4}}>{fmtDate(n.createdAt)}</div>
//               </div>
//               {!n.read && <div className="pp-notif-dot"/>}
//             </div>
//           ))
//         }
//       </div>
//     </div>
//   );
// }

// /* ═══════════════════════════════════════════════════════════════
//    PAGE — PROFILE  (full CRUD on own account)
// ═══════════════════════════════════════════════════════════════ */
// function PatProfile({ patient, patientId, showToast, refreshMe }) {
//   const [tab,  setTab]  = useState("info");
//   const [form, setForm] = useState({
//     name:      patient.name,
//     email:     patient.email,
//     phone:     patient.phone||"",
//     dob:       patient.dob||"",
//     bloodType: patient.bloodType||"",
//     allergies: patient.allergies||"",
//     address:   patient.address||"",
//     emergency: patient.emergency||"",
//     forfait:   patient.forfait||"Basic",
//   });
//   const [pwForm, setPw] = useState({ old:"", newPw:"", confirm:"", show:false });
//   const [confirm, setConfirm] = useState(false);

//   const FORFAITS = [
//     { id:"Basic",    price:20000, features:["2 consultations/month","Email support"] },
//     { id:"Standard", price:35000, features:["5 consultations/month","Chat support","Health records"] },
//     { id:"Premium",  price:50000, features:["Unlimited consultations","Priority support","Health records","Home visits"] },
//   ];

//   const save = () => {
//     if(!form.name||!form.email){showToast("Name and email required","error");return;}
//     patientDB.update(patientId, form);
//     refreshMe();
//     pushNotif("admin","patient","Patient Profile Updated",`${form.name} updated their profile.`);
//     showToast("Profile updated!");
//     window.dispatchEvent(new Event("stech_refresh"));
//   };

//   const changePw = () => {
//     if(!pwForm.newPw){showToast("Enter new password","error");return;}
//     if(pwForm.newPw!==pwForm.confirm){showToast("Passwords don't match","error");return;}
//     if(pwForm.newPw.length<6){showToast("Min 6 characters","error");return;}
//     patientDB.update(patientId,{password:pwForm.newPw});
//     setPw({old:"",newPw:"",confirm:"",show:false});
//     showToast("Password changed!");
//   };

//   const deleteAccount = () => {
//     patientDB.del(patientId);
//     showToast("Account deleted","info");
//   };

//   const appts    = appointmentDB.forPatient(patientId);
//   const payments = paymentDB.forPatient(patientId);
//   const totalPaid= payments.filter(p=>p.status==="paid").reduce((s,p)=>s+p.amount,0);

//   return (
//     <div className="pp-animate">
//       <div className="pp-page-hd"><div><h1 className="pp-page-title">My Profile</h1><p className="pp-page-sub">Manage your account</p></div></div>

//       <div className="pp-two-col">
//         {/* Left — avatar + stats */}
//         <div style={{display:"flex",flexDirection:"column",gap:16}}>
//           <div className="pp-card" style={{textAlign:"center"}}>
//             <Avatar name={patient.name} size={80}/>
//             <h3 style={{marginTop:14,fontFamily:"'Playfair Display',serif",fontSize:20}}>{patient.name}</h3>
//             <p style={{color:"var(--pp-muted)",fontSize:13,marginBottom:12}}>{patient.email}</p>
//             <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap"}}>
//               {patient.bloodType && <span className="pp-badge pp-b-red">{patient.bloodType}</span>}
//               {patient.membership && <span className="pp-badge pp-b-purple">⭐ Member</span>}
//               <Badge status={patient.status}/>
//               <Badge status={patient.forfait?.toLowerCase()}/>
//             </div>
//             <div style={{borderTop:"1px solid var(--pp-border)",marginTop:16,paddingTop:16,display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
//               <div style={{textAlign:"center"}}>
//                 <div style={{fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:22,color:"var(--pp-blue)"}}>{appts.length}</div>
//                 <div style={{fontSize:12,color:"var(--pp-muted)"}}>Appointments</div>
//               </div>
//               <div style={{textAlign:"center"}}>
//                 <div style={{fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:22,color:"#16a34a"}}>{fmtMoney(totalPaid)}</div>
//                 <div style={{fontSize:12,color:"var(--pp-muted)"}}>Total Paid</div>
//               </div>
//             </div>
//           </div>

//           {/* Forfait plans */}
//           <div className="pp-card">
//             <div className="pp-card-title" style={{marginBottom:14}}>Subscription Plans</div>
//             {FORFAITS.map(f=>(
//               <div key={f.id} className={`pp-forfait-option ${patient.forfait===f.id?"pp-forfait-option--active":""}`} onClick={()=>{setForm(fm=>({...fm,forfait:f.id}));}}>
//                 <div style={{flex:1}}>
//                   <div style={{fontWeight:700,fontSize:14}}>{f.id}</div>
//                   <div style={{fontSize:12,color:"var(--pp-muted)"}}>{f.features.join(" · ")}</div>
//                 </div>
//                 <div style={{fontWeight:700,color:"var(--pp-blue)",fontSize:14}}>{fmtMoney(f.price)}</div>
//                 {patient.forfait===f.id && <i className="ti ti-check-circle" style={{color:"var(--pp-blue)",fontSize:18}}/>}
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* Right — tabs */}
//         <div>
//           <div className="pp-profile-tabs">
//             {[["info","Personal"],["health","Health"],["security","Security"]].map(([k,l])=>(
//               <button key={k} className={`pp-filter-tab ${tab===k?"active":""}`} onClick={()=>setTab(k)}>{l}</button>
//             ))}
//           </div>

//           {tab==="info" && (
//             <div className="pp-card" style={{marginTop:14}}>
//               <div style={{display:"flex",flexDirection:"column",gap:14}}>
//                 <div className="pp-form-row">
//                   <FG label="Full Name" required><input className="pp-input" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/></FG>
//                   <FG label="Phone"><input className="pp-input" value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))}/></FG>
//                 </div>
//                 <FG label="Email" required><input className="pp-input" type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))}/></FG>
//                 <FG label="Address"><input className="pp-input" value={form.address} onChange={e=>setForm(f=>({...f,address:e.target.value}))}/></FG>
//                 <FG label="Emergency Contact"><input className="pp-input" value={form.emergency} placeholder="+237 6XX XXX XXX" onChange={e=>setForm(f=>({...f,emergency:e.target.value}))}/></FG>
//                 <button className="pp-btn pp-btn-primary" onClick={save}>Save Changes</button>
//               </div>
//             </div>
//           )}

//           {tab==="health" && (
//             <div className="pp-card" style={{marginTop:14}}>
//               <div style={{display:"flex",flexDirection:"column",gap:14}}>
//                 <div className="pp-form-row">
//                   <FG label="Date of Birth"><input className="pp-input" type="date" value={form.dob} onChange={e=>setForm(f=>({...f,dob:e.target.value}))}/></FG>
//                   <FG label="Blood Type">
//                     <select className="pp-input" value={form.bloodType} onChange={e=>setForm(f=>({...f,bloodType:e.target.value}))}>
//                       <option value="">Select…</option>
//                       {["A+","A-","B+","B-","O+","O-","AB+","AB-"].map(b=><option key={b}>{b}</option>)}
//                     </select>
//                   </FG>
//                 </div>
//                 <FG label="Allergies"><input className="pp-input" placeholder="e.g. Penicillin, Latex, None" value={form.allergies} onChange={e=>setForm(f=>({...f,allergies:e.target.value}))}/></FG>
//                 <button className="pp-btn pp-btn-primary" onClick={save}>Save Health Info</button>
//               </div>
//             </div>
//           )}

//           {tab==="security" && (
//             <div className="pp-card" style={{marginTop:14,display:"flex",flexDirection:"column",gap:14}}>
//               <FG label="Current Password"><input className="pp-input" type={pwForm.show?"text":"password"} value={pwForm.old} onChange={e=>setPw(p=>({...p,old:e.target.value}))}/></FG>
//               <FG label="New Password"><input className="pp-input" type={pwForm.show?"text":"password"} value={pwForm.newPw} onChange={e=>setPw(p=>({...p,newPw:e.target.value}))}/></FG>
//               <FG label="Confirm New Password"><input className="pp-input" type={pwForm.show?"text":"password"} value={pwForm.confirm} onChange={e=>setPw(p=>({...p,confirm:e.target.value}))}/></FG>
//               <label style={{display:"flex",alignItems:"center",gap:8,fontSize:13,cursor:"pointer"}}>
//                 <input type="checkbox" checked={pwForm.show} onChange={e=>setPw(p=>({...p,show:e.target.checked}))} style={{accentColor:"var(--pp-blue)"}}/>
//                 Show passwords
//               </label>
//               <button className="pp-btn pp-btn-primary" onClick={changePw}>Update Password</button>
//               <div style={{borderTop:"1px solid var(--pp-border)",paddingTop:16}}>
//                 <div style={{fontWeight:700,color:"#f44336",marginBottom:8}}>⚠ Danger Zone</div>
//                 <button className="pp-btn pp-btn-danger pp-btn-sm" onClick={()=>setConfirm(true)}>Delete My Account</button>
//               </div>
//             </div>
//           )}
//         </div>
//       </div>

//       {confirm && <ConfirmDialog msg="Delete your account? All your data will be permanently removed. This cannot be undone." onConfirm={deleteAccount} onCancel={()=>setConfirm(false)}/>}
//     </div>
//   );
// }



import { useState, useEffect, useRef, useCallback } from "react";
import VideoCall from "../Doctor/VideoCall";
import LiveMap   from "../Doctor/LiveMap";
import {
  uid, now, todayStr,
  doctorDB, patientDB, apptDB, payDB, msgDB, notifDB,
  consultDB, prescrDB, recordDB, homeVisitDB, pushNotif, seedIfEmpty
} from "../../Storage";

seedIfEmpty();

/* ── helpers ── */
const fmtDate  = iso => iso ? new Date(iso).toLocaleDateString("fr-CM", { day:"2-digit", month:"short", year:"numeric" }) : "—";
const fmtMoney = n   => Number(n||0).toLocaleString("fr-CM") + " XAF";
const monthSh  = d   => d ? new Date(d).toLocaleString("default", { month:"short" }) : "";

/* ── Avatar ── */
const COLORS = ["#1e88e5","#00bfa5","#7c3aed","#f44336","#ff7043","#0891b2","#16a34a","#be185d"];
function Avatar({ name="?", size=36, src }) {
  if (src) return <img src={src} alt={name} style={{ width:size, height:size, borderRadius:"50%", objectFit:"cover", flexShrink:0, border:"2px solid #e2e8f0" }}/>;
  const init  = name.split(" ").map(n=>n[0]).join("").toUpperCase().slice(0,2);
  const color = COLORS[(name.charCodeAt(0)||0) % COLORS.length];
  return (
    <div style={{ width:size, height:size, borderRadius:"50%", background:color, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:size*.37, flexShrink:0, fontFamily:"'Sora',sans-serif", boxShadow:"0 2px 8px rgba(0,0,0,.15)" }}>
      {init}
    </div>
  );
}

/* ── Badge ── */
const SC = { confirmed:"#22c55e", active:"#22c55e", paid:"#22c55e", completed:"#22c55e", accepted:"#22c55e", online:"#22c55e",
  pending:"#fbbf24", scheduled:"#fbbf24",
  cancelled:"#ef4444", declined:"#ef4444", inactive:"#94a3b8" };
function Badge({ label, color }) {
  const c = color || SC[label?.toLowerCase()] || "#94a3b8";
  return <span style={{ background:c+"22", color:c, border:`1px solid ${c}44`, borderRadius:6, padding:"2px 10px", fontSize:11, fontWeight:700, whiteSpace:"nowrap" }}>{label}</span>;
}

/* ── Modal ── */
function Modal({ title, onClose, children, wide }) {
  useEffect(() => {
    const h = e => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.6)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }} onClick={onClose}>
      <div style={{ background:"var(--card,#fff)", borderRadius:18, width:"100%", maxWidth:wide?720:480, maxHeight:"90vh", overflow:"auto", boxShadow:"0 24px 80px rgba(0,0,0,.4)", border:"1px solid #e2e8f0" }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"18px 22px", borderBottom:"1px solid #e2e8f0" }}>
          <span style={{ fontFamily:"'Sora',sans-serif", fontWeight:700, fontSize:16 }}>{title}</span>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", fontSize:20, color:"#94a3b8" }}>✕</button>
        </div>
        <div style={{ padding:"18px 22px" }}>{children}</div>
      </div>
    </div>
  );
}

/* ── Toast ── */
function useToast() {
  const [toasts, setT] = useState([]);
  const fire = (msg, type="success") => { const id=uid(); setT(t=>[...t,{id,msg,type}]); setTimeout(()=>setT(t=>t.filter(x=>x.id!==id)),3200); };
  return { toasts, fire };
}
function Toaster({ toasts }) {
  return (
    <div style={{ position:"fixed", bottom:24, right:24, zIndex:99999, display:"flex", flexDirection:"column", gap:8 }}>
      {toasts.map(t=>(
        <div key={t.id} style={{ background:t.type==="error"?"#f44336":t.type==="warn"?"#f59e0b":"#22c55e", color:"#fff", borderRadius:12, padding:"12px 20px", fontSize:14, fontWeight:600, boxShadow:"0 8px 32px rgba(0,0,0,.3)", minWidth:220 }}>{t.msg}</div>
      ))}
    </div>
  );
}

/* ── FRow ── */
const inp = { background:"#f8fafc", border:"1.5px solid #e2e8f0", borderRadius:9, padding:"9px 13px", width:"100%", fontSize:14, color:"#0f172a", outline:"none", boxSizing:"border-box", fontFamily:"inherit" };
function FRow({ label, children }) {
  return (
    <div style={{ marginBottom:14 }}>
      <label style={{ display:"block", fontSize:12, fontWeight:700, color:"#64748b", marginBottom:5, textTransform:"uppercase", letterSpacing:.6 }}>{label}</label>
      {children}
    </div>
  );
}

/* ── NAV ── */
const NAV = [
  { section:"Overview" },
  { key:"overview",      icon:"⊞",  label:"Dashboard"       },
  { section:"Services"  },
  { key:"appointments",  icon:"📅",  label:"My Appointments" },
  { key:"book",          icon:"➕",  label:"Book Appointment"},
  { key:"consultations", icon:"📹",  label:"Video Calls"     },
  { key:"home_visit",    icon:"🏠",  label:"Home Service"    },
  { key:"schedules",     icon:"🗓️",  label:"My Schedule"     },
  { section:"Health"    },
  { key:"prescriptions", icon:"💊",  label:"Prescriptions"   },
  { key:"records",       icon:"📋",  label:"Medical Records" },
  { section:"Account"   },
  { key:"payments",      icon:"💳",  label:"Payments"        },
  { key:"messages",      icon:"💬",  label:"Messages"        },
  { key:"notifications", icon:"🔔",  label:"Notifications"   },
  { key:"profile",       icon:"👤",  label:"My Profile"      },
];

/* ═══════════════════════════════════════════════════════════════
   ROOT
═══════════════════════════════════════════════════════════════ */
export default function PatientPanel({ patientId, onLogout }) {
  const [tab,       setTab]     = useState("overview");
  const [sideOpen,  setSide]    = useState(false);
  const [patient,   setPatient] = useState(null);
  const [activeCall,setCall]    = useState(null);
  const [callAlert, setAlert]   = useState(null);
  const { toasts, fire: toast } = useToast();

  const refresh = useCallback(() => setPatient(patientDB.get(patientId)), [patientId]);
  useEffect(() => { refresh(); }, [refresh]);

  const unreadNotif = notifDB.all().filter(n => n.toId === patientId && !n.read).length;
  const unreadMsg   = msgDB.all().filter(m => m.toId === patientId && !m.read).length;

  /* Poll for incoming video calls from doctor */
  useEffect(() => {
    const check = () => {
      const calls = consultDB.all().filter(c =>
        c.patientId === patientId && c.type === "video" &&
        c.status === "scheduled" && c.doctorInitiated && !c.patientAlerted
      );
      if (calls.length > 0 && !callAlert && !activeCall) {
        setAlert(calls[0]);
        consultDB.update(calls[0].id, { patientAlerted: true });
      }
    };
    check();
    const t = setInterval(check, 2500);
    return () => clearInterval(t);
  }, [patientId, callAlert, activeCall]);

  if (!patient) return (
    <div style={{ display:"flex", height:"100vh", alignItems:"center", justifyContent:"center", fontFamily:"sans-serif", flexDirection:"column", gap:16 }}>
      <div style={{ fontSize:52 }}>🏥</div>
      <h2>Patient not found — ID: {patientId}</h2>
      <button onClick={onLogout} style={{ background:"#1e88e5", color:"#fff", border:"none", borderRadius:10, padding:"10px 22px", cursor:"pointer" }}>Back to Login</button>
    </div>
  );

  if (activeCall) return (
    <VideoCall
      consultation={activeCall}
      localUser={{ id:patientId, name:patient.name, role:"patient" }}
      onEnd={() => {
        consultDB.update(activeCall.id, { status:"completed" });
        pushNotif(activeCall.doctorId, "consultation", "✅ Session Ended", `${patient.name} ended the video session.`);
        toast("Session ended."); setCall(null); refresh();
      }}
    />
  );

  const sp = { patient, patientId, toast, refresh };

  return (
    <div style={{ display:"flex", height:"100vh", overflow:"hidden", background:"#f0f4f9", fontFamily:"'DM Sans',sans-serif", color:"#0f172a" }}>
      <style>{CSS}</style>

      {/* Incoming call alert */}
      {callAlert && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.7)", zIndex:99999, display:"flex", alignItems:"center", justifyContent:"center", padding:16, backdropFilter:"blur(4px)" }}>
          <div style={{ background:"#fff", borderRadius:24, padding:"36px 32px", maxWidth:400, width:"100%", textAlign:"center", boxShadow:"0 32px 80px rgba(0,0,0,.3)", border:"2px solid rgba(0,191,165,.3)" }}>
            <div style={{ width:80, height:80, borderRadius:"50%", background:"linear-gradient(135deg,#00bfa5,#0891b2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:36, margin:"0 auto 16px" }}>📹</div>
            <style>{`@keyframes rpulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.08);opacity:.8}}`}</style>
            <h2 style={{ fontFamily:"'Sora',sans-serif", fontSize:20, marginBottom:6 }}>Incoming Video Call</h2>
            <p style={{ color:"#64748b", fontSize:14, marginBottom:4 }}><strong>Dr. {callAlert.doctorName}</strong> is calling you</p>
            <p style={{ color:"#94a3b8", fontSize:12, marginBottom:24 }}>📅 {callAlert.date} at {callAlert.time}</p>
            <div style={{ display:"flex", gap:12 }}>
              <button onClick={() => { consultDB.update(callAlert.id, { status:"cancelled" }); pushNotif(callAlert.doctorId,"consultation","Call Declined",`${patient.name} declined the call.`); setAlert(null); toast("Call declined.","warn"); }}
                style={{ flex:1, padding:"13px", borderRadius:14, border:"2px solid #e2e8f0", background:"#f8fafc", color:"#64748b", fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                📵 Decline
              </button>
              <button onClick={() => { setAlert(null); setCall(callAlert); pushNotif(callAlert.doctorId,"consultation","📹 Patient Joined",`${patient.name} accepted the video call.`); }}
                style={{ flex:2, padding:"13px", borderRadius:14, border:"none", background:"linear-gradient(135deg,#00bfa5,#0891b2)", color:"#fff", fontWeight:800, cursor:"pointer", fontFamily:"inherit" }}>
                📹 Accept
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className={`pp-sidebar${sideOpen?" open":""}`}>
        <div className="pp-brand">
          <div className="pp-brand-orb">🏥</div>
          <div>
            <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:800, fontSize:15, color:"#fff" }}>STECH</div>
            <div style={{ fontSize:10, color:"#94a3b8", letterSpacing:1.5, textTransform:"uppercase" }}>Patient Portal</div>
          </div>
        </div>
        <div style={{ margin:"0 12px 8px", padding:12, background:"rgba(255,255,255,.06)", borderRadius:12, display:"flex", gap:10, alignItems:"center" }}>
          <Avatar name={patient.name} size={40} src={patient.avatar}/>
          <div style={{ overflow:"hidden" }}>
            <div style={{ color:"#fff", fontWeight:700, fontSize:13, fontFamily:"'Sora',sans-serif", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{patient.name}</div>
            <div style={{ color:"#00bfa5", fontSize:11, fontWeight:600 }}>{patient.forfait||"Basic"} Plan</div>
          </div>
        </div>
        <nav className="pp-nav">
          {NAV.map((n,i) => {
            if (n.section) return <div key={i} className="pp-nav-section">{n.section}</div>;
            const badge = n.key==="notifications"?unreadNotif:n.key==="messages"?unreadMsg:0;
            return (
              <button key={n.key} className={`pp-nav-item${tab===n.key?" active":""}`} onClick={()=>{setTab(n.key);setSide(false);}}>
                <span className="pp-nav-icon">{n.icon}</span>
                <span>{n.label}</span>
                {badge>0&&<span className="pp-nav-badge">{badge}</span>}
              </button>
            );
          })}
        </nav>
        <button className="pp-logout" onClick={onLogout}><span>🚪</span> Logout</button>
      </aside>

      {/* Main */}
      <div className="pp-main">
        <header className="pp-topbar">
          <button className="pp-hamburger" onClick={()=>setSide(s=>!s)}>☰</button>
          <div style={{ flex:1 }}/>
          <button className="pp-topbar-icon" onClick={()=>setTab("consultations")} title="Video Calls" style={{ color:"#00bfa5" }}>📹</button>
          <button className="pp-topbar-icon" onClick={()=>setTab("messages")}>💬{unreadMsg>0&&<sup className="pp-top-badge">{unreadMsg}</sup>}</button>
          <button className="pp-topbar-icon" onClick={()=>setTab("notifications")}>🔔{unreadNotif>0&&<sup className="pp-top-badge">{unreadNotif}</sup>}</button>
          <div onClick={()=>setTab("profile")} style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer" }}>
            <Avatar name={patient.name} size={32} src={patient.avatar}/>
          </div>
        </header>

        <main className="pp-content">
          {tab==="overview"      && <PatOverview      {...sp} setTab={setTab} onJoinCall={setCall}/>}
          {tab==="appointments"  && <PatAppointments  {...sp} setTab={setTab}/>}
          {tab==="book"          && <PatBooking       {...sp} setTab={setTab}/>}
          {tab==="consultations" && <PatConsultations {...sp} onJoinCall={setCall}/>}
          {tab==="home_visit"    && <PatHomeVisit     {...sp}/>}
          {tab==="schedules"     && <PatSchedules     {...sp}/>}
          {tab==="prescriptions" && <PatPrescriptions {...sp}/>}
          {tab==="records"       && <PatRecords       {...sp}/>}
          {tab==="payments"      && <PatPayments      {...sp}/>}
          {tab==="messages"      && <PatMessages      {...sp}/>}
          {tab==="notifications" && <PatNotifications {...sp}/>}
          {tab==="profile"       && <PatProfile       {...sp}/>}
        </main>
      </div>

      {sideOpen&&<div className="pp-overlay" onClick={()=>setSide(false)}/>}
      <Toaster toasts={toasts}/>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   OVERVIEW
═══════════════════════════════════════════════════════════════ */
function PatOverview({ patient, patientId, setTab, onJoinCall }) {
  const appts    = apptDB.forPatient(patientId);
  const consults = consultDB.forPatient(patientId);
  const rxs      = prescrDB.forPatient(patientId);
  const payments = payDB.forPatient(patientId);
  const doctors  = doctorDB.all().filter(d=>d.status==="active");
  const upcoming = appts.filter(a=>a.status!=="cancelled").sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time)).slice(0,4);
  const pendingCalls = consults.filter(c=>c.type==="video"&&c.status==="scheduled");
  const h = new Date().getHours();
  const greet = h<12?"morning":h<18?"afternoon":"evening";

  return (
    <div className="pp-anim">
      <div className="pp-welcome" style={{ background:"linear-gradient(120deg,#1e88e5,#00bfa5)", borderRadius:18, padding:"24px 28px", marginBottom:24, color:"#fff", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
        <div>
          <h1 style={{ fontFamily:"'Sora',sans-serif", fontWeight:800, fontSize:22, margin:0 }}>Good {greet}, {patient.name.split(" ")[0]} 👋</h1>
          <p style={{ fontSize:13, opacity:.85, marginTop:4 }}>{new Date().toDateString()} · Your health, all in one place</p>
        </div>
        <button className="pp-btn-white" onClick={()=>setTab("book")}>➕ Book Appointment</button>
      </div>

      {pendingCalls.length>0&&(
        <div style={{ background:"linear-gradient(110deg,#003d33,#00574a)", borderRadius:16, padding:"16px 20px", marginBottom:20, display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, flexWrap:"wrap" }}>
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            <div style={{ fontSize:28 }}>📹</div>
            <div>
              <div style={{ fontWeight:800, fontSize:15, color:"#fff" }}>You have {pendingCalls.length} video session{pendingCalls.length>1?"s":""} scheduled</div>
              <div style={{ fontSize:12, color:"rgba(255,255,255,.6)", marginTop:2 }}>Next: Dr. {pendingCalls[0].doctorName} · {pendingCalls[0].date} at {pendingCalls[0].time}</div>
            </div>
          </div>
          <button onClick={()=>onJoinCall(pendingCalls[0])} style={{ background:"#00bfa5", color:"#fff", border:"none", borderRadius:12, padding:"11px 20px", fontWeight:800, cursor:"pointer", fontFamily:"inherit" }}>📹 Join Now</button>
        </div>
      )}

      <div className="pp-stats">
        {[
          { icon:"📅", label:"Appointments",  value:appts.length,    color:"#1e88e5", nav:"appointments", trend:`${appts.filter(a=>a.status==="confirmed").length} confirmed` },
          { icon:"📹", label:"Video Calls",   value:consults.length, color:"#00bfa5", nav:"consultations",trend:`${pendingCalls.length} upcoming` },
          { icon:"💊", label:"Prescriptions", value:rxs.length,      color:"#7c3aed", nav:"prescriptions",trend:"Active meds" },
          { icon:"💳", label:"Payments",      value:payments.length, color:"#f59e0b", nav:"payments",     trend:`${payments.filter(p=>p.status==="pending").length} pending` },
        ].map(s=>(
          <div key={s.label} className="pp-stat-card" style={{"--acc":s.color}} onClick={()=>setTab(s.nav)}>
            <div className="pp-stat-icon" style={{background:s.color+"1a"}}>{s.icon}</div>
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:"#64748b", textTransform:"uppercase", letterSpacing:.6 }}>{s.label}</div>
              <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:800, fontSize:24 }}>{s.value}</div>
              <div style={{ fontSize:12, color:"#94a3b8" }}>{s.trend}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="pp-two-col">
        <div className="pp-card">
          <div className="pp-card-head"><div className="pp-card-title">Upcoming Appointments</div><button className="pp-ghost" onClick={()=>setTab("appointments")}>View all →</button></div>
          {upcoming.length===0?<div className="pp-empty"><span style={{fontSize:32}}>📅</span><p>No upcoming appointments</p><button className="pp-btn-primary" style={{marginTop:10}} onClick={()=>setTab("book")}>Book now</button></div>
            :upcoming.map(a=>(
            <div key={a.id} className="pp-row">
              <div style={{ textAlign:"center", minWidth:42 }}>
                <div style={{ fontSize:10, fontWeight:700, color:"#94a3b8", textTransform:"uppercase" }}>{monthSh(a.date)}</div>
                <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:800, fontSize:20, color:"#1e88e5", lineHeight:1 }}>{a.date?.split("-")[2]}</div>
              </div>
              {a.sessionType==="video"&&<span>📹</span>}
              {a.sessionType==="home-visit"&&<span>🏠</span>}
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, fontSize:14 }}>{a.healthType}</div>
                <div style={{ fontSize:12, color:"#64748b" }}>{a.doctorName} · {a.time}</div>
              </div>
              <Badge label={a.status}/>
            </div>
          ))}
        </div>
        <div className="pp-card">
          <div className="pp-card-head"><div className="pp-card-title">Our Doctors</div><button className="pp-ghost" onClick={()=>setTab("book")}>Book →</button></div>
          {doctors.slice(0,4).map(d=>(
            <div key={d.id} className="pp-row">
              <Avatar name={d.name} size={38} src={d.avatar}/>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, fontSize:14 }}>{d.name}</div>
                <div style={{ fontSize:12, color:"#64748b" }}>{d.specialty} · {d.location}</div>
              </div>
              <span style={{ fontSize:13, fontWeight:700, color:"#f59e0b" }}>★ {d.rating}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   APPOINTMENTS
═══════════════════════════════════════════════════════════════ */
function PatAppointments({ patientId, toast, setTab }) {
  const [items,   setItems]   = useState(apptDB.forPatient(patientId));
  const [filter,  setFilter]  = useState("all");
  const [search,  setSearch]  = useState("");
  const [sel,     setSel]     = useState(null);
  const [confirm, setConfirm] = useState(null);
  const refresh = () => setItems(apptDB.forPatient(patientId));

  const filtered = items.filter(a =>
    (filter==="all"||a.status===filter) &&
    [a.healthType,a.doctorName].some(v=>v?.toLowerCase().includes(search.toLowerCase()))
  );

  const cancel = (id) => {
    const a = apptDB.update(id, { status:"cancelled" });
    pushNotif("admin","appointment","Appointment Cancelled",`${a?.patientName} cancelled with ${a?.doctorName}.`);
    if (a?.doctorId) pushNotif(a.doctorId,"appointment","Appointment Cancelled",`${a.patientName} cancelled the appointment on ${a.date}.`);
    refresh(); toast("Appointment cancelled","warn"); setConfirm(null);
  };

  return (
    <div className="pp-anim">
      <div className="pp-page-head">
        <div><h1 className="pp-title">My Appointments</h1><p className="pp-sub">{items.length} total</p></div>
        <button className="pp-btn-primary" onClick={()=>setTab("book")}>+ Book New</button>
      </div>
      <div className="pp-card">
        <input className="pp-search" placeholder="Search treatment, doctor…" value={search} onChange={e=>setSearch(e.target.value)}/>
        <div className="pp-filter-tabs">
          {["all","pending","confirmed","cancelled"].map(f=>(
            <button key={f} className={`pp-filter-tab${filter===f?" active":""}`} onClick={()=>setFilter(f)}>
              {f.charAt(0).toUpperCase()+f.slice(1)} <span className="pp-f-count">{f==="all"?items.length:items.filter(a=>a.status===f).length}</span>
            </button>
          ))}
        </div>
        <div className="pp-tbl-wrap">
          <table className="pp-table">
            <thead><tr><th>Treatment</th><th>Doctor</th><th>Date</th><th>Time</th><th>Type</th><th>Amount</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {filtered.length===0&&<tr><td colSpan={8} style={{textAlign:"center",padding:32,color:"#94a3b8"}}>No appointments found.</td></tr>}
              {filtered.map(a=>(
                <tr key={a.id}>
                  <td style={{fontWeight:700}}>{a.healthType}</td>
                  <td>{a.doctorName}</td>
                  <td>{a.date}</td>
                  <td>{a.time}</td>
                  <td>{a.sessionType==="video"?"📹 Video":a.sessionType==="home-visit"?"🏠 Home":"🏥 Clinic"}</td>
                  <td style={{fontWeight:700}}>{fmtMoney(a.amount)}</td>
                  <td><Badge label={a.status}/></td>
                  <td>
                    <div style={{display:"flex",gap:4}}>
                      <button className="pp-ghost" onClick={()=>setSel(a)}>👁</button>
                      {a.status!=="cancelled"&&<button className="pp-ghost" style={{color:"#ef4444"}} onClick={()=>setConfirm(a)}>✗</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {sel&&(
        <Modal title="Appointment Detail" onClose={()=>setSel(null)}>
          {[["Doctor",sel.doctorName],["Treatment",sel.healthType],["Date",sel.date],["Time",sel.time],["Type",sel.sessionType||"in-clinic"],["Amount",fmtMoney(sel.amount)],["Status",sel.status],["Notes",sel.notes||"—"]].map(([k,v])=>(
            <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"9px 0",borderBottom:"1px solid #e2e8f0",fontSize:14}}>
              <span style={{color:"#64748b",fontWeight:600}}>{k}</span><span style={{fontWeight:600}}>{k==="Status"?<Badge label={v}/>:v}</span>
            </div>
          ))}
        </Modal>
      )}
      {confirm&&(
        <Modal title="Cancel Appointment?" onClose={()=>setConfirm(null)}>
          <p style={{color:"#64748b",marginBottom:20}}>Cancel <strong>{confirm.healthType}</strong> on <strong>{confirm.date}</strong>? This cannot be undone.</p>
          <div style={{display:"flex",gap:10}}>
            <button className="pp-ghost" style={{flex:1}} onClick={()=>setConfirm(null)}>Keep it</button>
            <button style={{flex:1,background:"#ef4444",color:"#fff",border:"none",borderRadius:10,padding:"10px",fontWeight:700,cursor:"pointer",fontFamily:"inherit"}} onClick={()=>cancel(confirm.id)}>Cancel Appointment</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   BOOK APPOINTMENT  (3-step wizard)
═══════════════════════════════════════════════════════════════ */
function PatBooking({ patient, patientId, toast, setTab }) {
  const doctors = doctorDB.all().filter(d=>d.status==="active");
  const TYPES = ["Consultation","Root Canal","Scaling","Whitening","Wisdom Teeth","Braces Check","Implant","X-Ray","Check-up","Emergency","Cardiology","Dermatology"];
  const TIMES = ["08:00","08:30","09:00","09:30","10:00","10:30","11:00","11:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00"];
  const SESSION = [
    { id:"in-clinic",   icon:"🏥", label:"In-Clinic",  desc:"Visit the clinic" },
    { id:"video",       icon:"📹", label:"Video Call",  desc:"Live video consultation" },
    { id:"home-visit",  icon:"🏠", label:"Home Visit",  desc:"Doctor comes to you" },
  ];

  const initDoc = patient.preferredDoctorId ? doctors.find(d=>d.id===patient.preferredDoctorId)||null : null;
  const [step,     setStep]    = useState(1);
  const [selDoc,   setSelDoc]  = useState(initDoc);
  const [sessType, setSessType]= useState("in-clinic");
  const [form,     setForm]    = useState({ healthType:"", date:"", time:"", notes:"", address:patient.address||"" });
  const [errs,     setErrs]    = useState({});
  const [loading,  setLoad]    = useState(false);
  const [done,     setDone]    = useState(false);

  const validate = () => {
    const e={};
    if (!selDoc)          e.doctor="Select a doctor";
    if (!form.healthType) e.healthType="Select treatment";
    if (!form.date)       e.date="Select a date";
    if (!form.time)       e.time="Select a time";
    if (sessType==="home-visit"&&!form.address.trim()) e.address="Enter your address";
    return e;
  };

  const submit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrs(e); return; }
    setLoad(true);
    await new Promise(r=>setTimeout(r,600));

    const appt = apptDB.add({ id:uid(), patientId, patientName:patient.name, doctorId:selDoc.id, doctorName:selDoc.name, healthType:form.healthType, date:form.date, time:form.time, notes:form.notes, address:form.address, sessionType:sessType, amount:selDoc.consultFee||15000, status:"pending", createdAt:now() });

    if (sessType==="video") {
      const c = consultDB.add({ id:uid(), patientId, patientName:patient.name, doctorId:selDoc.id, doctorName:selDoc.name, type:"video", date:form.date, time:form.time, notes:form.notes, status:"scheduled", linkedAppointmentId:appt.id, doctorInitiated:false, createdAt:now() });
      pushNotif(selDoc.id,"consultation",`📹 Video Call Request`,`${patient.name} requests a video consultation on ${form.date} at ${form.time}.`);
    }
    if (sessType==="home-visit") {
      homeVisitDB.add({ id:uid(), patientId, patientName:patient.name, doctorId:selDoc.id, doctorName:selDoc.name, service:form.healthType, date:form.date, time:form.time, address:form.address, notes:form.notes, status:"pending", createdAt:now() });
      pushNotif(selDoc.id,"home_visit",`🏠 Home Visit Request`,`${patient.name} requests a home visit for ${form.healthType} on ${form.date}.`);
    }

    const typeLabel = SESSION.find(t=>t.id===sessType)?.label||sessType;
    pushNotif(selDoc.id,"appointment",`${SESSION.find(t=>t.id===sessType)?.icon} New ${typeLabel} Booking`,`${patient.name} booked ${form.healthType} on ${form.date} at ${form.time}.`);
    pushNotif("admin","appointment","New Appointment Booked",`${patient.name} → ${selDoc.name} for ${form.healthType} (${typeLabel}) on ${form.date}.`);

    setLoad(false); setDone(true); toast(sessType==="video"?"📹 Video call scheduled!":"✅ Appointment booked!");
  };

  if (done) return (
    <div className="pp-anim" style={{textAlign:"center",padding:40}}>
      <div style={{fontSize:64,marginBottom:16}}>{SESSION.find(t=>t.id===sessType)?.icon||"✅"}</div>
      <h2 style={{fontFamily:"'Sora',sans-serif",fontSize:22,marginBottom:12}}>
        {sessType==="video"?"Video Call Scheduled!":sessType==="home-visit"?"Home Visit Requested!":"Booking Confirmed!"}
      </h2>
      <p style={{color:"#64748b",marginBottom:8}}><strong>{form.healthType}</strong> with <strong>{selDoc?.name}</strong> on <strong>{form.date}</strong> at <strong>{form.time}</strong></p>
      {sessType==="video"&&<div style={{background:"rgba(0,191,165,.07)",border:"1px solid rgba(0,191,165,.25)",borderRadius:12,padding:"14px 18px",margin:"16px auto",maxWidth:400,textAlign:"left",fontSize:13,color:"#00897b"}}>📹 Go to <strong>Video Calls</strong> tab to join when the doctor is ready. You'll get a notification.</div>}
      <div style={{display:"flex",gap:12,justifyContent:"center",marginTop:20,flexWrap:"wrap"}}>
        <button className="pp-ghost" onClick={()=>{setDone(false);setStep(1);setSelDoc(initDoc);setSessType("in-clinic");setForm({healthType:"",date:"",time:"",notes:"",address:patient.address||""});}}>Book Another</button>
        <button className="pp-btn-primary" onClick={()=>setTab(sessType==="video"?"consultations":sessType==="home-visit"?"home_visit":"appointments")}>View →</button>
      </div>
    </div>
  );

  return (
    <div className="pp-anim">
      <div className="pp-page-head"><div><h1 className="pp-title">Book Appointment</h1></div></div>
      {/* Stepper */}
      <div style={{display:"flex",alignItems:"center",marginBottom:28,gap:4}}>
        {["Choose Doctor","Type & Details","Confirm"].map((s,i)=>(
          <div key={s} style={{display:"flex",alignItems:"center",flex:i<2?1:"auto"}}>
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
              <div style={{width:32,height:32,borderRadius:"50%",background:step>i+1?"#22c55e":step===i+1?"#1e88e5":"#e2e8f0",color:step>=i+1?"#fff":"#94a3b8",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:14}}>{step>i+1?"✓":i+1}</div>
              <span style={{fontSize:11,fontWeight:600,color:step===i+1?"#1e88e5":"#94a3b8",whiteSpace:"nowrap"}}>{s}</span>
            </div>
            {i<2&&<div style={{flex:1,height:2,background:step>i+1?"#22c55e":"#e2e8f0",margin:"0 8px",marginBottom:20}}/>}
          </div>
        ))}
      </div>

      {/* Step 1 */}
      {step===1&&(
        <div>
          {errs.doctor&&<div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:10,padding:"10px 14px",color:"#ef4444",fontSize:13,marginBottom:14}}>{errs.doctor}</div>}
          <div className="pp-doc-grid">
            {doctors.map(d=>(
              <div key={d.id} className={`pp-doc-card${selDoc?.id===d.id?" selected":""}`} onClick={()=>{setSelDoc(d);setErrs(e=>({...e,doctor:""}));}}>
                <Avatar name={d.name} size={52} src={d.avatar}/>
                <div style={{textAlign:"center",marginTop:12}}>
                  <div style={{fontWeight:700,fontSize:15}}>{d.name}</div>
                  <div style={{fontSize:12,color:"#64748b",margin:"4px 0"}}>{d.specialty}</div>
                  <div style={{fontSize:12,fontWeight:700,color:"#1e88e5"}}>{fmtMoney(d.consultFee)}</div>
                  <div style={{fontSize:12,color:"#f59e0b",marginTop:4}}>★ {d.rating}</div>
                  <Badge label={d.status}/>
                </div>
                {selDoc?.id===d.id&&<div style={{position:"absolute",top:10,right:10,width:22,height:22,borderRadius:"50%",background:"#22c55e",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700}}>✓</div>}
              </div>
            ))}
          </div>
          <div style={{display:"flex",justifyContent:"flex-end",marginTop:20}}>
            <button className="pp-btn-primary" onClick={()=>{if(!selDoc){setErrs({doctor:"Select a doctor"});return;}setStep(2);}}>Continue →</button>
          </div>
        </div>
      )}

      {/* Step 2 */}
      {step===2&&(
        <div className="pp-card" style={{maxWidth:600,margin:"0 auto"}}>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20,padding:"12px 14px",background:"#f8fafc",borderRadius:12}}>
            <Avatar name={selDoc?.name} size={42} src={selDoc?.avatar}/>
            <div style={{flex:1}}>
              <div style={{fontWeight:700}}>{selDoc?.name}</div>
              <div style={{fontSize:13,color:"#64748b"}}>{selDoc?.specialty} · {fmtMoney(selDoc?.consultFee)}</div>
            </div>
            <button className="pp-ghost" onClick={()=>setStep(1)}>Change</button>
          </div>

          {/* Session type */}
          <div style={{marginBottom:20}}>
            <label style={{display:"block",fontSize:12,fontWeight:700,color:"#64748b",marginBottom:8,textTransform:"uppercase",letterSpacing:.6}}>Appointment Type</label>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
              {SESSION.map(t=>(
                <button key={t.id} onClick={()=>setSessType(t.id)} style={{padding:"14px 8px",borderRadius:12,cursor:"pointer",textAlign:"center",fontFamily:"inherit",border:`2px solid ${sessType===t.id?"#00bfa5":"#e2e8f0"}`,background:sessType===t.id?"rgba(0,191,165,.07)":"#fff",transition:"all .18s"}}>
                  <div style={{fontSize:24,marginBottom:6}}>{t.icon}</div>
                  <div style={{fontWeight:700,fontSize:13,color:sessType===t.id?"#00897b":"#0f172a"}}>{t.label}</div>
                  <div style={{fontSize:11,color:"#94a3b8",marginTop:3}}>{t.desc}</div>
                </button>
              ))}
            </div>
            {sessType==="video"&&<div style={{marginTop:10,background:"rgba(0,191,165,.07)",border:"1px solid rgba(0,191,165,.2)",borderRadius:10,padding:"10px 14px",fontSize:13,color:"#00897b"}}>📹 A live video room will appear in the Video Calls tab when your doctor joins.</div>}
            {sessType==="home-visit"&&<div style={{marginTop:10,background:"rgba(30,136,229,.07)",border:"1px solid rgba(30,136,229,.2)",borderRadius:10,padding:"10px 14px",fontSize:13,color:"#1565c0"}}>🏠 Live GPS tracking activates once your doctor accepts and heads out.</div>}
          </div>

          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <FRow label="Treatment Type *">
              <select style={{...inp,borderColor:errs.healthType?"#ef4444":"#e2e8f0"}} value={form.healthType} onChange={e=>{setForm(f=>({...f,healthType:e.target.value}));setErrs(er=>({...er,healthType:""}));}}>
                <option value="">Select…</option>
                {TYPES.map(t=><option key={t}>{t}</option>)}
              </select>
              {errs.healthType&&<p style={{fontSize:12,color:"#ef4444",marginTop:4}}>{errs.healthType}</p>}
            </FRow>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <FRow label="Date *">
                <input style={{...inp,borderColor:errs.date?"#ef4444":"#e2e8f0"}} type="date" min={todayStr()} value={form.date} onChange={e=>{setForm(f=>({...f,date:e.target.value}));setErrs(er=>({...er,date:""}));}}/>
                {errs.date&&<p style={{fontSize:12,color:"#ef4444",marginTop:4}}>{errs.date}</p>}
              </FRow>
              <FRow label="Time *">
                <select style={{...inp,borderColor:errs.time?"#ef4444":"#e2e8f0"}} value={form.time} onChange={e=>{setForm(f=>({...f,time:e.target.value}));setErrs(er=>({...er,time:""}));}}>
                  <option value="">Select…</option>
                  {TIMES.map(t=><option key={t}>{t}</option>)}
                </select>
              </FRow>
            </div>
            {sessType==="home-visit"&&(
              <FRow label="Your Address *">
                <input style={{...inp,borderColor:errs.address?"#ef4444":"#e2e8f0"}} placeholder="Street, Area, City" value={form.address} onChange={e=>{setForm(f=>({...f,address:e.target.value}));setErrs(er=>({...er,address:""}));}}/>
                {errs.address&&<p style={{fontSize:12,color:"#ef4444",marginTop:4}}>{errs.address}</p>}
              </FRow>
            )}
            <FRow label="Notes">
              <textarea style={{...inp,height:70,resize:"vertical"}} placeholder="Describe your concern…" value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))}/>
            </FRow>
          </div>
          <div style={{display:"flex",gap:12,marginTop:20,justifyContent:"space-between"}}>
            <button className="pp-ghost" onClick={()=>setStep(1)}>← Back</button>
            <button className="pp-btn-primary" onClick={()=>{const e=validate();if(Object.keys(e).filter(k=>k!=="doctor").length){setErrs(e);return;}setStep(3);}}>Review →</button>
          </div>
        </div>
      )}

      {/* Step 3 */}
      {step===3&&(
        <div className="pp-card" style={{maxWidth:520,margin:"0 auto"}}>
          <h3 style={{fontFamily:"'Sora',sans-serif",marginBottom:20,fontSize:18}}>Confirm Your Booking</h3>
          {[["Doctor",selDoc?.name],["Specialty",selDoc?.specialty],["Type",SESSION.find(t=>t.id===sessType)?.icon+" "+SESSION.find(t=>t.id===sessType)?.label],["Treatment",form.healthType],["Date",form.date],["Time",form.time],...(sessType==="home-visit"?[["Address",form.address]]:[]),["Fee",fmtMoney(selDoc?.consultFee)],["Notes",form.notes||"None"]].map(([k,v])=>(
            <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"9px 0",borderBottom:"1px solid #e2e8f0",fontSize:14}}>
              <span style={{color:"#64748b",fontWeight:600}}>{k}</span><span style={{fontWeight:600}}>{v}</span>
            </div>
          ))}
          <div style={{display:"flex",gap:12,marginTop:20,justifyContent:"space-between"}}>
            <button className="pp-ghost" onClick={()=>setStep(2)}>← Back</button>
            <button className="pp-btn-primary" onClick={submit} disabled={loading}>
              {loading&&<span style={{marginRight:8}}>⏳</span>}
              {loading?"Booking…":sessType==="video"?"📹 Book Video Call":sessType==="home-visit"?"🏠 Request Home Visit":"✓ Confirm"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   VIDEO CONSULTATIONS
═══════════════════════════════════════════════════════════════ */
function PatConsultations({ patient, patientId, toast, onJoinCall }) {
  const [items, setItems] = useState(consultDB.forPatient(patientId));
  const refresh = () => setItems(consultDB.forPatient(patientId));
  useEffect(() => { refresh(); const t=setInterval(refresh,3000); return ()=>clearInterval(t); }, [patientId]);

  return (
    <div className="pp-anim">
      <div className="pp-page-head">
        <div><h1 className="pp-title">Video Consultations</h1><p className="pp-sub">Live video sessions with your doctor</p></div>
      </div>
      <div className="pp-stats" style={{gridTemplateColumns:"repeat(3,1fr)",marginBottom:16}}>
        {[{label:"Total",value:items.length,c:"#1e88e5"},{label:"Scheduled",value:items.filter(i=>i.status==="scheduled").length,c:"#fbbf24"},{label:"Completed",value:items.filter(i=>i.status==="completed").length,c:"#22c55e"}].map(s=>(
          <div key={s.label} className="pp-stat-card" style={{"--acc":s.c}}>
            <div className="pp-stat-body"><div style={{fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:.6}}>{s.label}</div><div style={{fontFamily:"'Sora',sans-serif",fontWeight:800,fontSize:24}}>{s.value}</div></div>
          </div>
        ))}
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {items.length===0&&<div className="pp-card"><div className="pp-empty"><span style={{fontSize:36}}>📹</span><p>No video consultations yet. Book one via the <strong>Book Appointment</strong> tab.</p></div></div>}
        {items.map(c=>(
          <div key={c.id} className="pp-card" style={{display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"}}>
            <div style={{width:54,height:54,borderRadius:14,background:"rgba(0,191,165,.12)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,flexShrink:0}}>📹</div>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4,flexWrap:"wrap"}}>
                <span style={{fontWeight:700,fontSize:15}}>{c.doctorName}</span>
                <Badge label={c.status}/>
                {c.doctorInitiated&&<Badge label="Doctor Initiated" color="#7c3aed"/>}
              </div>
              <div style={{fontSize:13,color:"#64748b"}}>📅 {c.date} at {c.time}</div>
              {c.notes&&<div style={{fontSize:12,color:"#94a3b8",marginTop:3}}>📝 {c.notes}</div>}
            </div>
            {c.status==="scheduled"&&(
              <button onClick={()=>onJoinCall(c)} style={{background:"linear-gradient(135deg,#00bfa5,#0891b2)",color:"#fff",border:"none",borderRadius:12,padding:"10px 20px",fontWeight:800,cursor:"pointer",fontFamily:"inherit",fontSize:14}}>
                📹 Join Video Call
              </button>
            )}
            {c.status==="completed"&&<Badge label="Completed" color="#22c55e"/>}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   HOME VISIT
═══════════════════════════════════════════════════════════════ */
function PatHomeVisit({ patient, patientId, toast }) {
  const doctors = doctorDB.all().filter(d=>d.status==="active");
  const [items, setItems]   = useState([]);
  const [mapVisit,setMapV]  = useState(null);
  const [loading, setLoad]  = useState(false);
  const [errs,    setErrs]  = useState({});
  const SERVICES = ["Dental Check-up","Scaling","Whitening","Post-Op Check","Emergency","Implant Check","Cardiology Check","Dermatology Visit"];
  const [form, setForm] = useState({ doctorId:"", service:"", date:"", time:"", address:patient.address||"", notes:"" });
  const refresh = () => setItems(homeVisitDB.forPatient(patientId));
  useEffect(()=>{ refresh(); const t=setInterval(refresh,3000); return()=>clearInterval(t); },[patientId]);

  const submit = async e => {
    e.preventDefault();
    const er={};
    if(!form.doctorId) er.doctorId="Select a doctor";
    if(!form.service)  er.service="Select a service";
    if(!form.date)     er.date="Select a date";
    if(!form.address.trim()) er.address="Enter your address";
    if(Object.keys(er).length){setErrs(er);return;}
    setLoad(true);
    await new Promise(r=>setTimeout(r,600));
    const d = doctorDB.get(form.doctorId);
    homeVisitDB.add({ id:uid(), ...form, patientId, patientName:patient.name, doctorId:form.doctorId, doctorName:d?.name, status:"pending", createdAt:now() });
    pushNotif(form.doctorId,"home_visit","🏠 Home Visit Request",`${patient.name} requests ${form.service} at ${form.address} on ${form.date}.`);
    pushNotif("admin","home_visit","Home Visit Requested",`${patient.name} → ${d?.name} on ${form.date}.`);
    setForm({doctorId:"",service:"",date:"",time:"",address:patient.address||"",notes:""});
    setErrs({}); setLoad(false); refresh(); toast("Home visit requested! 🏠");
  };

  if (mapVisit) return (
    <div className="pp-anim">
      <div className="pp-page-head"><div><h1 className="pp-title">Live Tracking</h1><p className="pp-sub">Dr. {mapVisit.doctorName} is on the way</p></div><button className="pp-ghost" onClick={()=>setMapV(null)}>← Back</button></div>
      <div className="pp-card"><LiveMap visit={mapVisit} role="patient"/></div>
    </div>
  );

  return (
    <div className="pp-anim">
      <div className="pp-page-head"><div><h1 className="pp-title">Home Service</h1><p className="pp-sub">Request a doctor to visit you</p></div></div>
      <div className="pp-two-col">
        <div className="pp-card">
          <div style={{fontFamily:"'Sora',sans-serif",fontWeight:700,fontSize:15,marginBottom:16}}>Request a Home Visit</div>
          <form onSubmit={submit} noValidate style={{display:"flex",flexDirection:"column",gap:14}}>
            <FRow label="Select Doctor *">
              <select style={{...inp,borderColor:errs.doctorId?"#ef4444":"#e2e8f0"}} value={form.doctorId} onChange={e=>{setForm(f=>({...f,doctorId:e.target.value}));setErrs(er=>({...er,doctorId:""}));}}>
                <option value="">Choose…</option>
                {doctors.map(d=><option key={d.id} value={d.id}>{d.name} — {d.specialty}</option>)}
              </select>
              {errs.doctorId&&<p style={{fontSize:12,color:"#ef4444",marginTop:4}}>{errs.doctorId}</p>}
            </FRow>
            <FRow label="Service *">
              <select style={{...inp,borderColor:errs.service?"#ef4444":"#e2e8f0"}} value={form.service} onChange={e=>{setForm(f=>({...f,service:e.target.value}));setErrs(er=>({...er,service:""}));}}>
                <option value="">Select…</option>
                {SERVICES.map(s=><option key={s}>{s}</option>)}
              </select>
              {errs.service&&<p style={{fontSize:12,color:"#ef4444",marginTop:4}}>{errs.service}</p>}
            </FRow>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <FRow label="Date *">
                <input style={{...inp,borderColor:errs.date?"#ef4444":"#e2e8f0"}} type="date" min={todayStr()} value={form.date} onChange={e=>{setForm(f=>({...f,date:e.target.value}));setErrs(er=>({...er,date:""}));}}/>
                {errs.date&&<p style={{fontSize:12,color:"#ef4444",marginTop:4}}>{errs.date}</p>}
              </FRow>
              <FRow label="Time">
                <select style={inp} value={form.time} onChange={e=>setForm(f=>({...f,time:e.target.value}))}>
                  <option value="">Any time</option>
                  {["08:00","09:00","10:00","11:00","14:00","15:00","16:00"].map(t=><option key={t}>{t}</option>)}
                </select>
              </FRow>
            </div>
            <FRow label="Your Address *">
              <input style={{...inp,borderColor:errs.address?"#ef4444":"#e2e8f0"}} placeholder="Street, Neighbourhood, City" value={form.address} onChange={e=>{setForm(f=>({...f,address:e.target.value}));setErrs(er=>({...er,address:""}));}}/>
              {errs.address&&<p style={{fontSize:12,color:"#ef4444",marginTop:4}}>{errs.address}</p>}
            </FRow>
            <FRow label="Notes">
              <textarea style={{...inp,height:70,resize:"vertical"}} placeholder="Gate colour, floor, access instructions…" value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))}/>
            </FRow>
            <button type="submit" className="pp-btn-primary" disabled={loading} style={{padding:14}}>
              {loading?"Submitting…":"🏠 Request Home Visit"}
            </button>
          </form>
        </div>

        <div>
          <div style={{fontFamily:"'Sora',sans-serif",fontWeight:700,fontSize:15,marginBottom:12}}>My Requests</div>
          {items.length===0&&<div className="pp-card"><div className="pp-empty"><span style={{fontSize:36}}>🏠</span><p>No requests yet.</p></div></div>}
          {items.map(r=>(
            <div key={r.id} className="pp-card" style={{marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                <div>
                  <div style={{fontWeight:700,fontSize:15}}>{r.service}</div>
                  <div style={{fontSize:13,color:"#64748b"}}>Dr. {r.doctorName}</div>
                </div>
                <Badge label={r.status}/>
              </div>
              <div style={{fontSize:13,color:"#64748b"}}>📍 {r.address}</div>
              <div style={{fontSize:13,color:"#64748b",marginTop:4}}>📅 {r.date}{r.time&&` at ${r.time}`}</div>
              {r.status==="accepted"&&(
                <div style={{marginTop:12}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                    <div style={{display:"flex",alignItems:"center",gap:6,background:"rgba(0,191,165,.1)",border:"1px solid rgba(0,191,165,.25)",borderRadius:20,padding:"5px 12px"}}>
                      <div style={{width:7,height:7,borderRadius:"50%",background:"#00bfa5",animation:"pulse 1s infinite"}}/>
                      <span style={{fontSize:12,fontWeight:700,color:"#00897b"}}>Doctor is on the way</span>
                    </div>
                    <button className="pp-ghost" onClick={()=>setMapV(r)}>🗺️ Track Live</button>
                  </div>
                  <LiveMap visit={r} role="patient"/>
                </div>
              )}
              {r.status==="pending"&&<div style={{marginTop:10,background:"#fef3c7",border:"1px solid #fde68a",borderRadius:10,padding:"8px 12px",fontSize:13,color:"#d97706"}}>⏳ Awaiting doctor confirmation</div>}
              {r.status==="declined"&&<div style={{marginTop:10,background:"#fef2f2",border:"1px solid #fecaca",borderRadius:10,padding:"8px 12px",fontSize:13,color:"#ef4444"}}>❌ Doctor declined this request</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MY SCHEDULE  — view & accept/reject appointments + home visits
═══════════════════════════════════════════════════════════════ */
function PatSchedules({ patientId, patient, toast }) {
  const [appts,  setAppts]  = useState([]);
  const [visits, setVisits] = useState([]);
  const [calls,  setCalls]  = useState([]);
  const refresh = () => {
    setAppts(apptDB.forPatient(patientId).filter(a=>a.status!=="cancelled"));
    setVisits(homeVisitDB.forPatient(patientId));
    setCalls(consultDB.forPatient(patientId).filter(c=>c.type==="video"&&c.status==="scheduled"));
  };
  useEffect(()=>{ refresh(); const t=setInterval(refresh,3000); return()=>clearInterval(t); },[patientId]);

  const acceptAppt = (a) => {
    apptDB.update(a.id,{status:"confirmed"});
    pushNotif(a.doctorId,"appointment","✅ Appointment Accepted",`${patient.name} confirmed the appointment on ${a.date}.`);
    pushNotif("admin","appointment","Appointment Confirmed",`${patient.name} confirmed with ${a.doctorName}.`);
    toast("Appointment accepted!"); refresh();
  };
  const rejectAppt = (a) => {
    apptDB.update(a.id,{status:"cancelled"});
    pushNotif(a.doctorId,"appointment","❌ Appointment Rejected",`${patient.name} rejected the appointment on ${a.date}.`);
    toast("Appointment rejected","warn"); refresh();
  };
  const acceptVisit = (v) => {
    homeVisitDB.update(v.id,{status:"accepted"});
    pushNotif(v.doctorId,"home_visit","✅ Visit Accepted",`${patient.name} accepted the home visit on ${v.date}.`);
    toast("Home visit accepted!"); refresh();
  };
  const rejectVisit = (v) => {
    homeVisitDB.update(v.id,{status:"declined"});
    pushNotif(v.doctorId,"home_visit","❌ Visit Rejected",`${patient.name} declined the home visit.`);
    toast("Home visit rejected","warn"); refresh();
  };

  const allEvents = [
    ...appts.map(a=>({...a,_kind:"appointment"})),
    ...visits.map(v=>({...v,_kind:"homevisit"})),
    ...calls.map(c=>({...c,_kind:"videocall"})),
  ].sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));

  return (
    <div className="pp-anim">
      <div className="pp-page-head"><div><h1 className="pp-title">My Schedule</h1><p className="pp-sub">All events set by your doctor</p></div></div>
      {allEvents.length===0&&<div className="pp-card"><div className="pp-empty"><span style={{fontSize:40}}>🗓️</span><p>No scheduled events yet.</p></div></div>}
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        {allEvents.map(ev=>{
          const isAppt  = ev._kind==="appointment";
          const isVisit = ev._kind==="homevisit";
          const isCall  = ev._kind==="videocall";
          const icon    = isCall?"📹":isVisit?"🏠":"📅";
          const typeLabel = isCall?"Video Call":isVisit?"Home Visit":"Appointment";
          return (
            <div key={ev.id} className="pp-card" style={{borderLeft:`4px solid ${isCall?"#00bfa5":isVisit?"#ff7043":"#1e88e5"}`}}>
              <div style={{display:"flex",alignItems:"flex-start",gap:14,flexWrap:"wrap"}}>
                <div style={{textAlign:"center",minWidth:48}}>
                  <div style={{fontSize:11,fontWeight:700,color:"#94a3b8",textTransform:"uppercase"}}>{monthSh(ev.date)}</div>
                  <div style={{fontFamily:"'Sora',sans-serif",fontWeight:800,fontSize:22,color:"#1e88e5",lineHeight:1}}>{ev.date?.split("-")[2]}</div>
                </div>
                <div style={{fontSize:28}}>{icon}</div>
                <div style={{flex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4,flexWrap:"wrap"}}>
                    <span style={{fontWeight:700,fontSize:15}}>{ev.healthType||ev.service||typeLabel}</span>
                    <Badge label={typeLabel} color={isCall?"#00bfa5":isVisit?"#ff7043":"#1e88e5"}/>
                    <Badge label={ev.status}/>
                  </div>
                  <div style={{fontSize:13,color:"#64748b"}}>👨‍⚕️ {ev.doctorName} · ⏰ {ev.time||"TBD"}</div>
                  {ev.address&&<div style={{fontSize:13,color:"#64748b",marginTop:2}}>📍 {ev.address}</div>}
                  {ev.notes&&<div style={{fontSize:12,color:"#94a3b8",marginTop:2}}>📝 {ev.notes}</div>}
                </div>
                {/* Patient action buttons for pending items */}
                {isAppt&&ev.status==="pending"&&(
                  <div style={{display:"flex",gap:6,flexShrink:0}}>
                    <button className="pp-ghost" style={{color:"#22c55e",borderColor:"#22c55e44",background:"#f0fdf4"}} onClick={()=>acceptAppt(ev)}>✓ Accept</button>
                    <button className="pp-ghost" style={{color:"#ef4444"}} onClick={()=>rejectAppt(ev)}>✗ Reject</button>
                  </div>
                )}
                {isVisit&&ev.status==="pending"&&(
                  <div style={{display:"flex",gap:6,flexShrink:0}}>
                    <button className="pp-ghost" style={{color:"#22c55e",borderColor:"#22c55e44",background:"#f0fdf4"}} onClick={()=>acceptVisit(ev)}>✓ Accept</button>
                    <button className="pp-ghost" style={{color:"#ef4444"}} onClick={()=>rejectVisit(ev)}>✗ Reject</button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PRESCRIPTIONS
═══════════════════════════════════════════════════════════════ */
function PatPrescriptions({ patientId }) {
  const items = prescrDB.forPatient(patientId);

  const downloadPDF = (rx) => {
    const content = `STECH HEALTH — PRESCRIPTION\n${"=".repeat(40)}\nPatient: ${rx.patientName}\nDate: ${rx.date}\nDoctor: Dr. ${rx.doctorName}\n\n${"─".repeat(40)}\nMEDICATION: ${rx.medication}\nDOSAGE: ${rx.dosage}\nDURATION: ${rx.duration}\n\nINSTRUCTIONS:\n${rx.notes||"Take as directed by your doctor."}\n${"─".repeat(40)}\n\nThis prescription is valid for 30 days from date of issue.\nKeep this document safe and present it to your pharmacist.\n`;
    const blob = new Blob([content], { type:"text/plain" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `prescription_${rx.medication?.replace(/\s+/g,"_")}_${rx.date}.txt`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="pp-anim">
      <div className="pp-page-head"><div><h1 className="pp-title">Prescriptions</h1><p className="pp-sub">{items.length} issued by your doctor</p></div></div>
      {items.length===0&&<div className="pp-card"><div className="pp-empty"><span style={{fontSize:40}}>💊</span><p>No prescriptions yet. Your doctor will issue them after a consultation.</p></div></div>}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:16}}>
        {items.map(rx=>(
          <div key={rx.id} className="pp-card" style={{borderTop:"4px solid #7c3aed"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <div style={{width:44,height:44,borderRadius:12,background:"rgba(124,58,237,.1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>💊</div>
                <div>
                  <div style={{fontWeight:800,fontSize:17}}>{rx.medication}</div>
                  <div style={{fontSize:12,color:"#64748b",marginTop:2}}>By Dr. {rx.doctorName}</div>
                </div>
              </div>
              <button onClick={()=>downloadPDF(rx)} title="Download" style={{background:"rgba(124,58,237,.08)",border:"1px solid rgba(124,58,237,.25)",borderRadius:8,padding:"6px 10px",cursor:"pointer",fontSize:14,color:"#7c3aed"}}>⬇️</button>
            </div>
            {[["Dosage",rx.dosage||"—"],["Duration",rx.duration||"—"],["Date Issued",rx.date],["Instructions",rx.notes||"Take as directed"]].map(([k,v])=>(
              <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid #e2e8f0",fontSize:13}}>
                <span style={{color:"#64748b",fontWeight:600}}>{k}</span>
                <span style={{fontWeight:600,textAlign:"right",maxWidth:"60%"}}>{v}</span>
              </div>
            ))}
            <button onClick={()=>downloadPDF(rx)} style={{marginTop:14,width:"100%",background:"linear-gradient(135deg,#7c3aed,#8b5cf6)",color:"#fff",border:"none",borderRadius:10,padding:"10px",fontWeight:700,cursor:"pointer",fontFamily:"inherit",fontSize:13}}>
              ⬇️ Download Prescription
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MEDICAL RECORDS  — view + download
═══════════════════════════════════════════════════════════════ */
function PatRecords({ patientId, patient }) {
  const items = recordDB.forPatient(patientId);
  const ICONS = { procedure:"🔧", imaging:"🩻", lab:"🧪", prescription:"💊", note:"📝", diagnosis:"🔍", other:"📋" };

  const downloadRecord = (r) => {
    const content = `STECH HEALTH — MEDICAL RECORD\n${"=".repeat(40)}\nPatient: ${r.patientName}\nDate: ${r.date}\nDoctor: Dr. ${r.doctorName}\n\nRECORD TYPE: ${r.type?.toUpperCase()}\nTITLE: ${r.title}\n\nDETAILS:\n${r.description||"No details provided."}\n${"─".repeat(40)}\nConfidential medical document. For patient use only.\n`;
    const blob = new Blob([content], { type:"text/plain" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href=url; a.download=`record_${r.title?.replace(/\s+/g,"_")}_${r.date}.txt`;
    a.click(); URL.revokeObjectURL(url);
  };

  const downloadAll = () => {
    const content = `STECH HEALTH — COMPLETE MEDICAL RECORDS\nPatient: ${patient.name}\nGenerated: ${new Date().toLocaleString()}\n${"=".repeat(50)}\n\n${items.map(r=>`TYPE: ${r.type?.toUpperCase()}\nTITLE: ${r.title}\nDATE: ${r.date}\nDOCTOR: Dr. ${r.doctorName}\nDETAILS: ${r.description||"—"}\n${"─".repeat(40)}`).join("\n\n")}\n`;
    const blob = new Blob([content], { type:"text/plain" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href=url; a.download=`medical_records_${patient.name?.replace(/\s+/g,"_")}.txt`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="pp-anim">
      <div className="pp-page-head">
        <div><h1 className="pp-title">Medical Records</h1><p className="pp-sub">Your complete health history</p></div>
        {items.length>0&&<button className="pp-btn-primary" onClick={downloadAll}>⬇️ Download All</button>}
      </div>
      {items.length===0&&<div className="pp-card"><div className="pp-empty"><span style={{fontSize:40}}>📋</span><p>No medical records yet. Records added by your doctor will appear here.</p></div></div>}
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {items.map(r=>(
          <div key={r.id} className="pp-card" style={{display:"flex",alignItems:"flex-start",gap:16,flexWrap:"wrap"}}>
            <div style={{width:52,height:52,borderRadius:14,background:"rgba(30,136,229,.1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,flexShrink:0}}>{ICONS[r.type]||"📋"}</div>
            <div style={{flex:1}}>
              <div style={{fontWeight:700,fontSize:16,marginBottom:4}}>{r.title}</div>
              <div style={{fontSize:13,color:"#64748b",marginBottom:8,lineHeight:1.6}}>{r.description}</div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                <Badge label={r.type} color="#1e88e5"/>
                <span style={{fontSize:12,color:"#94a3b8"}}>📅 {r.date}</span>
                <span style={{fontSize:12,color:"#94a3b8"}}>👨‍⚕️ Dr. {r.doctorName}</span>
              </div>
            </div>
            <button onClick={()=>downloadRecord(r)} style={{background:"rgba(30,136,229,.08)",border:"1px solid rgba(30,136,229,.25)",borderRadius:10,padding:"8px 14px",cursor:"pointer",fontSize:13,fontWeight:700,color:"#1e88e5",fontFamily:"inherit",flexShrink:0}}>⬇️ Download</button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PAYMENTS
═══════════════════════════════════════════════════════════════ */
function PatPayments({ patientId, toast }) {
  const [items, setItems]     = useState(payDB.forPatient(patientId));
  const [payModal,setPayModal]= useState(null);
  const refresh = () => setItems(payDB.forPatient(patientId));
  const pending   = items.filter(p=>p.status==="pending");
  const totalPaid = items.filter(p=>p.status==="paid").reduce((s,p)=>s+p.amount,0);

  const pay = async (id, method) => {
    await new Promise(r=>setTimeout(r,700));
    const p = payDB.update(id, { status:"paid", method });
    const cut = Math.round((p.amount*(p.forfaitPct||12))/100);
    payDB.update(id,{adminCut:cut});
    pushNotif("admin","payment","💳 Payment Received",`${fmtMoney(p.amount)} received from ${p.patientName}. Commission: ${fmtMoney(cut)}.`);
    if(p.doctorId) pushNotif(p.doctorId,"payment","💳 Payment Confirmed",`${p.patientName} paid ${fmtMoney(p.amount)} for ${p.service}.`);
    refresh(); setPayModal(null); toast("Payment successful! 🎉");
  };

  return (
    <div className="pp-anim">
      <div className="pp-page-head"><div><h1 className="pp-title">Payments</h1><p className="pp-sub">Your billing history</p></div></div>
      {pending.length>0&&<div style={{background:"#fef3c7",border:"1px solid #fde68a",borderRadius:12,padding:"12px 18px",marginBottom:20,fontSize:14,fontWeight:600,color:"#d97706"}}>⚠️ {pending.length} pending payment{pending.length>1?"s":""} totalling {fmtMoney(pending.reduce((s,p)=>s+p.amount,0))}</div>}
      <div className="pp-stats" style={{gridTemplateColumns:"repeat(3,1fr)",marginBottom:20}}>
        {[{label:"Total Paid",value:fmtMoney(totalPaid),c:"#22c55e"},{label:"Pending",value:fmtMoney(pending.reduce((s,p)=>s+p.amount,0)),c:"#f59e0b"},{label:"Transactions",value:items.length,c:"#1e88e5"}].map(s=>(
          <div key={s.label} className="pp-stat-card" style={{"--acc":s.c}}>
            <div style={{fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:.6}}>{s.label}</div>
            <div style={{fontFamily:"'Sora',sans-serif",fontWeight:800,fontSize:20,marginTop:4}}>{s.value}</div>
          </div>
        ))}
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {items.length===0&&<div className="pp-card"><div className="pp-empty"><span style={{fontSize:36}}>💳</span><p>No payment history.</p></div></div>}
        {items.map(p=>(
          <div key={p.id} className="pp-card" style={{display:"flex",alignItems:"center",gap:14,flexWrap:"wrap"}}>
            <div style={{fontSize:28}}>{p.status==="paid"?"✅":"⏳"}</div>
            <div style={{flex:1}}>
              <div style={{fontWeight:700,fontSize:15}}>{p.service}</div>
              <div style={{fontSize:12,color:"#64748b",marginTop:3}}>📅 {p.date} · {p.method||"—"} · Ref: {p.txRef}</div>
            </div>
            <div style={{fontFamily:"'Sora',sans-serif",fontWeight:800,fontSize:18}}>{fmtMoney(p.amount)}</div>
            <Badge label={p.status}/>
            {p.status==="pending"&&<button className="pp-btn-primary" style={{padding:"8px 16px"}} onClick={()=>setPayModal(p)}>Pay Now</button>}
          </div>
        ))}
      </div>
      {payModal&&(
        <Modal title="Pay Now" onClose={()=>setPayModal(null)}>
          <div style={{textAlign:"center",marginBottom:20}}>
            <div style={{fontFamily:"'Sora',sans-serif",fontWeight:800,fontSize:28,color:"#0f172a"}}>{fmtMoney(payModal.amount)}</div>
            <div style={{color:"#64748b",fontSize:14}}>{payModal.service}</div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {[["📱","Mobile Money"],["🟡","MTN MoMo"],["🟠","Orange Money"],["💳","Bank Card"],["💵","Cash"]].map(([icon,m])=>(
              <button key={m} onClick={()=>pay(payModal.id,m)} style={{padding:"16px 10px",borderRadius:12,border:"1.5px solid #e2e8f0",background:"#f8fafc",cursor:"pointer",fontFamily:"inherit",display:"flex",flexDirection:"column",alignItems:"center",gap:6,transition:"all .15s",fontWeight:700,fontSize:13}}>
                <span style={{fontSize:26}}>{icon}</span>{m}
              </button>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MESSAGES
═══════════════════════════════════════════════════════════════ */
function PatMessages({ patient, patientId }) {
  const doctors  = doctorDB.all();
  const contacts = [{ id:"admin", name:"Support / Admin", role:"Platform" }, ...doctors.map(d=>({...d,role:d.specialty}))];
  const [selId,  setSelId]  = useState(patient.preferredDoctorId||doctors[0]?.id||"admin");
  const [msgs,   setMsgs]   = useState([]);
  const [input,  setInput]  = useState("");
  const [typing, setTyping] = useState(false);
  const chatRef = useRef(null);

  const loadThread = useCallback((cid) => {
    const all = msgDB.all();
    const thread = all.filter(m=>(m.fromId===patientId&&m.toId===cid)||(m.fromId===cid&&m.toId===patientId)).sort((a,b)=>a.createdAt.localeCompare(b.createdAt));
    thread.filter(m=>m.toId===patientId&&!m.read).forEach(m=>msgDB.update(m.id,{read:true}));
    setMsgs(thread);
  }, [patientId]);

  useEffect(()=>{ loadThread(selId); },[selId]);
  useEffect(()=>{ const t=setInterval(()=>loadThread(selId),1500); return()=>clearInterval(t); },[selId, loadThread]);
  useEffect(()=>{ chatRef.current?.scrollTo(0,chatRef.current.scrollHeight); },[msgs]);

  const unread = cid => msgDB.all().filter(m=>m.fromId===cid&&m.toId===patientId&&!m.read).length;

  const send = () => {
    if (!input.trim()) return;
    const c = contacts.find(x=>x.id===selId);
    msgDB.add({ id:uid(), fromId:patientId, fromName:patient.name, toId:selId, toName:c?.name||"", body:input.trim(), read:false, createdAt:now() });
    pushNotif(selId,"message",`💬 Message from ${patient.name}`,input.trim());
    setInput(""); loadThread(selId);
    setTyping(true);
    setTimeout(()=>{
      const replies=["Thank you for reaching out!","I'll check your file shortly.","See you at your next appointment.","Please follow the prescribed treatment.","Let me know if you have any more questions."];
      msgDB.add({ id:uid(), fromId:selId, fromName:c?.name||"Doctor", toId:patientId, toName:patient.name, body:replies[Math.floor(Math.random()*replies.length)], read:false, createdAt:now() });
      setTyping(false); loadThread(selId);
    }, 2000+Math.random()*1500);
  };

  const contact = contacts.find(c=>c.id===selId);
  return (
    <div className="pp-anim">
      <div className="pp-page-head"><div><h1 className="pp-title">Messages</h1><p className="pp-sub">Chat with doctors & support</p></div></div>
      <div className="pp-msg-layout">
        <div className="pp-msg-contacts">
          <div style={{padding:"12px 14px",borderBottom:"1px solid #e2e8f0",fontFamily:"'Sora',sans-serif",fontWeight:700,fontSize:13}}>Contacts</div>
          {contacts.map(c=>{
            const u=unread(c.id);
            return (
              <div key={c.id} className={`pp-msg-contact${selId===c.id?" active":""}`} onClick={()=>setSelId(c.id)}>
                <div style={{position:"relative"}}><Avatar name={c.name} size={36} src={c.avatar}/>{u>0&&<div style={{position:"absolute",top:-2,right:-2,width:14,height:14,borderRadius:"50%",background:"#00bfa5",border:"2px solid #fff"}}/>}</div>
                <div style={{flex:1,overflow:"hidden"}}>
                  <div style={{fontWeight:700,fontSize:13,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{c.name}</div>
                  <div style={{fontSize:11,color:"#94a3b8"}}>{c.role||c.specialty}</div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="pp-msg-chat">
          {contact&&<>
            <div style={{padding:"12px 16px",borderBottom:"1px solid #e2e8f0",display:"flex",alignItems:"center",gap:10}}>
              <Avatar name={contact.name} size={36} src={contact.avatar}/>
              <div>
                <div style={{fontWeight:700,fontSize:14}}>{contact.name}</div>
                <div style={{fontSize:11,color:"#00bfa5",display:"flex",alignItems:"center",gap:4}}><div style={{width:6,height:6,borderRadius:"50%",background:"#00bfa5"}}/> Online</div>
              </div>
            </div>
            <div className="pp-chat-msgs" ref={chatRef}>
              {msgs.length===0&&<div className="pp-empty"><span style={{fontSize:28}}>💬</span><p>Say hello!</p></div>}
              {msgs.map(m=>{
                const isMe=m.fromId===patientId;
                return (
                  <div key={m.id} style={{display:"flex",flexDirection:"column",alignItems:isMe?"flex-end":"flex-start",marginBottom:8}}>
                    <div style={{background:isMe?"#1e88e5":"#f1f5f9",color:isMe?"#fff":"#0f172a",borderRadius:14,padding:"9px 14px",maxWidth:"72%",fontSize:13,lineHeight:1.5}}>
                      {!isMe&&<div style={{fontSize:10,fontWeight:700,color:"#1e88e5",marginBottom:3}}>{m.fromName}</div>}
                      {m.body}
                    </div>
                    <div style={{fontSize:10,color:"#94a3b8",marginTop:2}}>{new Date(m.createdAt).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}</div>
                  </div>
                );
              })}
              {typing&&<div style={{display:"flex",alignItems:"center",gap:6,color:"#94a3b8",fontSize:12}}>
                {[0,1,2].map(i=><div key={i} style={{width:6,height:6,borderRadius:"50%",background:"#00bfa5",animation:`pulse ${.8+i*.15}s ease-in-out infinite`,animationDelay:`${i*.15}s`}}/>)}
                {contact.name} is typing…
              </div>}
            </div>
            <div style={{padding:"10px 14px",borderTop:"1px solid #e2e8f0",display:"flex",gap:8}}>
              <input style={{...inp,flex:1}} placeholder={`Message ${contact.name}…`} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()}/>
              <button className="pp-btn-primary" style={{padding:"9px 16px"}} onClick={send} disabled={!input.trim()}>Send</button>
            </div>
          </>}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   NOTIFICATIONS
═══════════════════════════════════════════════════════════════ */
function PatNotifications({ patientId }) {
  const [items, setItems] = useState([]);
  const refresh = () => {
    const all = notifDB.all().filter(n=>n.toId===patientId).reverse();
    setItems(all);
    all.filter(n=>!n.read).forEach(n=>notifDB.update(n.id,{read:true}));
  };
  useEffect(()=>{ refresh(); const t=setInterval(refresh,3000); return()=>clearInterval(t); },[patientId]);

  const ICONS = { appointment:"📅",payment:"💳",message:"💬",prescription:"💊",record:"📋",consultation:"📹",home_visit:"🏠",system:"🔧" };
  return (
    <div className="pp-anim">
      <div className="pp-page-head"><div><h1 className="pp-title">Notifications</h1><p className="pp-sub">{items.filter(n=>!n.read).length} unread</p></div></div>
      <div className="pp-card">
        {items.length===0&&<div className="pp-empty"><span style={{fontSize:40}}>🔔</span><p>No notifications yet.</p></div>}
        {items.map(n=>(
          <div key={n.id} style={{display:"flex",alignItems:"flex-start",gap:14,padding:"14px 0",borderBottom:"1px solid #e2e8f0",background:n.read?"transparent":"rgba(30,136,229,.03)"}}>
            <div style={{fontSize:24,flexShrink:0}}>{ICONS[n.type]||"🔔"}</div>
            <div style={{flex:1}}>
              <div style={{fontWeight:700,fontSize:14}}>{n.title}</div>
              <div style={{fontSize:13,color:"#64748b",marginTop:2}}>{n.body}</div>
              <div style={{fontSize:11,color:"#94a3b8",marginTop:4}}>{fmtDate(n.createdAt)}</div>
            </div>
            {!n.read&&<div style={{width:8,height:8,borderRadius:"50%",background:"#1e88e5",flexShrink:0,marginTop:4}}/>}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PROFILE  — full edit + profile picture upload
═══════════════════════════════════════════════════════════════ */
function PatProfile({ patient, patientId, toast, refresh }) {
  const [tab,  setTab]  = useState("info");
  const [form, setForm] = useState({ name:patient.name, email:patient.email, phone:patient.phone||"", dob:patient.dob||"", bloodType:patient.bloodType||"", allergies:patient.allergies||"", address:patient.address||"", emergency:patient.emergency||"", forfait:patient.forfait||"Basic", bio:patient.bio||"" });
  const [pw,   setPw]   = useState({ old:"", newPw:"", confirm:"", show:false });
  const [avatarPreview, setAvatarPreview] = useState(patient.avatar||null);
  const fileRef = useRef(null);

  const appts    = apptDB.forPatient(patientId);
  const payments = payDB.forPatient(patientId);
  const totalPaid= payments.filter(p=>p.status==="paid").reduce((s,p)=>s+p.amount,0);

  const FORFAITS = [
    { id:"Basic",    price:20000, features:["2 consultations/month","Email support"] },
    { id:"Standard", price:35000, features:["5 consultations/month","Chat support","Health records"] },
    { id:"Premium",  price:50000, features:["Unlimited consultations","Priority support","Home visits"] },
  ];

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2*1024*1024) { toast("Image must be under 2MB","error"); return; }
    const reader = new FileReader();
    reader.onload = ev => {
      const dataUrl = ev.target.result;
      setAvatarPreview(dataUrl);
      patientDB.update(patientId, { avatar: dataUrl });
      refresh(); toast("Profile picture updated! 🎉");
    };
    reader.readAsDataURL(file);
  };

  const save = () => {
    if (!form.name||!form.email) { toast("Name and email required","error"); return; }
    patientDB.update(patientId, { ...form, avatar: avatarPreview });
    refresh();
    pushNotif("admin","patient","Patient Profile Updated",`${form.name} updated their profile.`);
    toast("Profile saved!");
  };

  const changePw = () => {
    if (pw.newPw!==pw.confirm) { toast("Passwords don't match","error"); return; }
    if (pw.newPw.length<6) { toast("Min 6 characters","error"); return; }
    patientDB.update(patientId,{password:pw.newPw});
    setPw({old:"",newPw:"",confirm:"",show:false}); toast("Password changed!");
  };

  return (
    <div className="pp-anim">
      <div className="pp-page-head"><div><h1 className="pp-title">My Profile</h1><p className="pp-sub">Manage your account</p></div></div>
      <div className="pp-two-col">
        {/* Left column */}
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <div className="pp-card" style={{textAlign:"center"}}>
            {/* Avatar upload */}
            <div style={{position:"relative",width:90,height:90,margin:"0 auto 14px"}}>
              {avatarPreview
                ?<img src={avatarPreview} alt="avatar" style={{width:90,height:90,borderRadius:"50%",objectFit:"cover",border:"3px solid #e2e8f0"}}/>
                :<Avatar name={patient.name} size={90}/>}
              <button onClick={()=>fileRef.current?.click()} style={{position:"absolute",bottom:0,right:0,width:28,height:28,borderRadius:"50%",background:"#1e88e5",color:"#fff",border:"2px solid #fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13}}>✏️</button>
              <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleAvatarChange}/>
            </div>
            <div style={{fontFamily:"'Sora',sans-serif",fontWeight:700,fontSize:18}}>{patient.name}</div>
            <div style={{fontSize:13,color:"#64748b",marginTop:4}}>{patient.email}</div>
            <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap",marginTop:10}}>
              {patient.bloodType&&<Badge label={patient.bloodType} color="#ef4444"/>}
              {patient.membership&&<Badge label="⭐ Member" color="#7c3aed"/>}
              <Badge label={patient.forfait||"Basic"} color="#1e88e5"/>
            </div>
            <button onClick={()=>fileRef.current?.click()} style={{marginTop:12,background:"rgba(30,136,229,.07)",border:"1px solid rgba(30,136,229,.2)",borderRadius:10,padding:"8px 16px",cursor:"pointer",fontSize:13,fontWeight:600,color:"#1e88e5",fontFamily:"inherit"}}>
              📷 Change Photo
            </button>
            <div style={{borderTop:"1px solid #e2e8f0",marginTop:16,paddingTop:16,display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div>
                <div style={{fontFamily:"'Sora',sans-serif",fontWeight:800,fontSize:22,color:"#1e88e5"}}>{appts.length}</div>
                <div style={{fontSize:12,color:"#64748b"}}>Appointments</div>
              </div>
              <div>
                <div style={{fontFamily:"'Sora',sans-serif",fontWeight:800,fontSize:16,color:"#22c55e"}}>{fmtMoney(totalPaid)}</div>
                <div style={{fontSize:12,color:"#64748b"}}>Total Paid</div>
              </div>
            </div>
          </div>

          {/* Plans */}
          <div className="pp-card">
            <div style={{fontFamily:"'Sora',sans-serif",fontWeight:700,fontSize:15,marginBottom:14}}>Subscription Plans</div>
            {FORFAITS.map(f=>(
              <div key={f.id} onClick={()=>setForm(fm=>({...fm,forfait:f.id}))} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 0",borderBottom:"1px solid #e2e8f0",cursor:"pointer",background:form.forfait===f.id?"rgba(30,136,229,.04)":"transparent",borderRadius:form.forfait===f.id?10:0,paddingLeft:form.forfait===f.id?10:0,transition:"all .15s"}}>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:14}}>{f.id}</div>
                  <div style={{fontSize:12,color:"#64748b"}}>{f.features.join(" · ")}</div>
                </div>
                <div style={{fontWeight:700,color:"#1e88e5",fontSize:13}}>{fmtMoney(f.price)}</div>
                {form.forfait===f.id&&<span style={{color:"#22c55e",fontSize:18}}>✓</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div>
          <div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>
            {[["info","Personal"],["health","Health"],["security","Security"]].map(([k,l])=>(
              <button key={k} className={`pp-filter-tab${tab===k?" active":""}`} onClick={()=>setTab(k)}>{l}</button>
            ))}
          </div>

          {tab==="info"&&(
            <div className="pp-card">
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                {[["Full Name *","name","text"],["Phone","phone","tel"]].map(([l,k,t])=>(
                  <FRow key={k} label={l}><input style={inp} type={t} value={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))}/></FRow>
                ))}
              </div>
              <FRow label="Email *"><input style={inp} type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))}/></FRow>
              <FRow label="Address"><input style={inp} value={form.address} onChange={e=>setForm(f=>({...f,address:e.target.value}))}/></FRow>
              <FRow label="Emergency Contact"><input style={inp} placeholder="+237 6XX XXX XXX" value={form.emergency} onChange={e=>setForm(f=>({...f,emergency:e.target.value}))}/></FRow>
              <FRow label="Bio"><textarea style={{...inp,height:70,resize:"vertical"}} placeholder="A short note about yourself…" value={form.bio} onChange={e=>setForm(f=>({...f,bio:e.target.value}))}/></FRow>
              <button className="pp-btn-primary" style={{width:"100%"}} onClick={save}>Save Changes</button>
            </div>
          )}
          {tab==="health"&&(
            <div className="pp-card">
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <FRow label="Date of Birth"><input style={inp} type="date" value={form.dob} onChange={e=>setForm(f=>({...f,dob:e.target.value}))}/></FRow>
                <FRow label="Blood Type">
                  <select style={inp} value={form.bloodType} onChange={e=>setForm(f=>({...f,bloodType:e.target.value}))}>
                    <option value="">Select…</option>
                    {["A+","A-","B+","B-","O+","O-","AB+","AB-"].map(b=><option key={b}>{b}</option>)}
                  </select>
                </FRow>
              </div>
              <FRow label="Allergies"><input style={inp} placeholder="e.g. Penicillin, Latex, None" value={form.allergies} onChange={e=>setForm(f=>({...f,allergies:e.target.value}))}/></FRow>
              <button className="pp-btn-primary" style={{width:"100%"}} onClick={save}>Save Health Info</button>
            </div>
          )}
          {tab==="security"&&(
            <div className="pp-card" style={{display:"flex",flexDirection:"column",gap:14}}>
              {[["Current Password","old"],["New Password","newPw"],["Confirm New","confirm"]].map(([l,k])=>(
                <FRow key={k} label={l}><input style={inp} type={pw.show?"text":"password"} value={pw[k]} onChange={e=>setPw(p=>({...p,[k]:e.target.value}))}/></FRow>
              ))}
              <label style={{display:"flex",alignItems:"center",gap:8,fontSize:13,cursor:"pointer"}}>
                <input type="checkbox" checked={pw.show} onChange={e=>setPw(p=>({...p,show:e.target.checked}))} style={{accentColor:"#1e88e5"}}/>
                Show passwords
              </label>
              <button className="pp-btn-primary" onClick={changePw}>Update Password</button>
            </div>
          )}
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
:root{--bg:#f0f4f9;--card:#fff;--border:#e2e8f0;--text:#0f172a;--muted:#64748b;--teal:#00bfa5;--blue:#1e88e5;--red:#ef4444;--sw:252px}
*{box-sizing:border-box;margin:0;padding:0}

.pp-sidebar{width:var(--sw);background:linear-gradient(180deg,#001a13,#003d33);display:flex;flex-direction:column;height:100vh;flex-shrink:0;overflow-y:auto;transition:transform .28s;position:relative;z-index:200}
.pp-brand{display:flex;align-items:center;gap:12px;padding:22px 18px 16px;border-bottom:1px solid rgba(255,255,255,.08);flex-shrink:0}
.pp-brand-orb{width:38px;height:38px;border-radius:10px;background:linear-gradient(135deg,#00bfa5,#0891b2);display:flex;align-items:center;justify-content:center;font-size:20px;box-shadow:0 4px 16px rgba(0,191,165,.4)}
.pp-nav{flex:1;padding:8px 0;overflow-y:auto}
.pp-nav-section{font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,255,255,.3);padding:12px 20px 5px}
.pp-nav-item{display:flex;align-items:center;gap:10px;width:100%;padding:9px 20px;background:none;border:none;cursor:pointer;color:rgba(255,255,255,.65);font-size:13.5px;font-family:inherit;text-align:left;transition:background .2s,color .2s;position:relative}
.pp-nav-item:hover{background:rgba(255,255,255,.06);color:#fff}
.pp-nav-item.active{background:rgba(0,191,165,.2);color:#fff;border-right:3px solid #00bfa5}
.pp-nav-icon{font-size:15px;width:20px;text-align:center}
.pp-nav-badge{margin-left:auto;background:#f44336;color:#fff;border-radius:99px;font-size:10px;font-weight:700;padding:1px 6px}
.pp-logout{display:flex;align-items:center;gap:10px;width:100%;padding:15px 20px;background:none;border:none;cursor:pointer;color:rgba(255,255,255,.5);font-size:13.5px;font-family:inherit;border-top:1px solid rgba(255,255,255,.08);transition:all .2s}
.pp-logout:hover{background:rgba(239,68,68,.15);color:#ff6b6b}

.pp-main{flex:1;display:flex;flex-direction:column;overflow:hidden}
.pp-topbar{height:58px;background:#fff;border-bottom:1px solid #e2e8f0;display:flex;align-items:center;gap:8px;padding:0 20px;flex-shrink:0;box-shadow:0 1px 4px rgba(0,0,0,.06)}
.pp-hamburger{display:none;background:none;border:none;cursor:pointer;font-size:20px;color:var(--text)}
.pp-topbar-icon{position:relative;background:#f0f4f9;border:1px solid #e2e8f0;border-radius:8px;width:36px;height:36px;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center}
.pp-top-badge{position:absolute;top:-4px;right:-4px;background:#f44336;color:#fff;border-radius:99px;font-size:9px;font-weight:800;padding:1px 4px;line-height:1.2}
.pp-content{flex:1;overflow-y:auto;padding:24px}

.pp-anim{animation:ppFadeUp .35s ease}
@keyframes ppFadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}

.pp-page-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:24px;flex-wrap:wrap}
.pp-title{font-family:'Sora',sans-serif;font-weight:800;font-size:26px;color:var(--text)}
.pp-sub{font-size:13px;color:var(--muted);margin-top:3px}

.pp-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px}
.pp-stat-card{background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:18px;display:flex;align-items:center;gap:14px;border-left:4px solid var(--acc,#00bfa5);cursor:pointer;transition:transform .2s,box-shadow .2s}
.pp-stat-card:hover{transform:translateY(-2px);box-shadow:0 6px 24px rgba(0,0,0,.08)}
.pp-stat-icon{font-size:24px;width:50px;height:50px;border-radius:14px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.pp-stat-body{}

.pp-card{background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:20px;position:relative}
.pp-card-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px}
.pp-card-title{font-family:'Sora',sans-serif;font-weight:700;font-size:15px}
.pp-two-col{display:grid;grid-template-columns:1fr 1fr;gap:20px}

.pp-row{display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid #e2e8f0}
.pp-row:last-child{border-bottom:none}

.pp-tbl-wrap{overflow-x:auto;margin-top:10px}
.pp-table{width:100%;border-collapse:collapse;font-size:13.5px}
.pp-table th{text-align:left;padding:10px 12px;border-bottom:2px solid #e2e8f0;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.6px;white-space:nowrap}
.pp-table td{padding:12px;border-bottom:1px solid #e2e8f0;vertical-align:middle}
.pp-table tr:last-child td{border-bottom:none}
.pp-table tr:hover td{background:#f8fafc}

.pp-btn-primary{background:linear-gradient(135deg,#1e88e5,#42a5f5);color:#fff;border:none;border-radius:10px;padding:10px 20px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;transition:opacity .2s,transform .15s;white-space:nowrap}
.pp-btn-primary:hover{opacity:.88;transform:translateY(-1px)}
.pp-btn-primary:disabled{opacity:.6;cursor:not-allowed}
.pp-btn-white{background:#fff;color:#1e88e5;border:none;borderRadius:10px;padding:10px 20px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;border-radius:10px}
.pp-ghost{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:6px 12px;font-size:12px;font-weight:600;cursor:pointer;color:#0f172a;font-family:inherit;transition:background .2s;white-space:nowrap}
.pp-ghost:hover{background:#e2e8f0}

.pp-search{background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:10px;padding:10px 14px;font-size:14px;color:#0f172a;width:100%;max-width:340px;outline:none;font-family:inherit;transition:border-color .2s;margin-bottom:10px}
.pp-search:focus{border-color:#1e88e5}
.pp-filter-tabs{display:flex;gap:4px;flex-wrap:wrap;margin-bottom:8px}
.pp-filter-tab{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:6px 12px;font-size:13px;font-weight:600;cursor:pointer;color:#64748b;font-family:inherit;transition:all .2s}
.pp-filter-tab.active{background:#1e88e5;color:#fff;border-color:#1e88e5}
.pp-f-count{margin-left:4px;background:rgba(0,0,0,.1);border-radius:99px;padding:1px 5px;font-size:11px}
.pp-filter-tab.active .pp-f-count{background:rgba(255,255,255,.2)}

.pp-doc-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px;margin-bottom:20px}
.pp-doc-card{background:#fff;border:2px solid #e2e8f0;border-radius:16px;padding:20px;display:flex;flex-direction:column;align-items:center;cursor:pointer;position:relative;transition:all .2s}
.pp-doc-card:hover{border-color:#1e88e5;transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,.08)}
.pp-doc-card.selected{border-color:#22c55e;background:rgba(34,197,94,.03)}

.pp-msg-layout{display:grid;grid-template-columns:260px 1fr;gap:16px;height:560px}
.pp-msg-contacts{background:#fff;border:1px solid #e2e8f0;border-radius:16px;overflow-y:auto}
.pp-msg-contact{display:flex;align-items:center;gap:10px;padding:12px 14px;cursor:pointer;border-bottom:1px solid #e2e8f0;transition:background .15s}
.pp-msg-contact:hover{background:#f8fafc}
.pp-msg-contact.active{background:rgba(0,191,165,.07);border-left:3px solid #00bfa5}
.pp-msg-chat{background:#fff;border:1px solid #e2e8f0;border-radius:16px;display:flex;flex-direction:column;overflow:hidden}
.pp-chat-msgs{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column}

.pp-empty{text-align:center;padding:40px;color:#94a3b8}
.pp-empty p{margin-top:10px;font-size:14px}

.pp-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:100}

@media(max-width:960px){
  .pp-stats{grid-template-columns:1fr 1fr}
  .pp-two-col{grid-template-columns:1fr}
  .pp-msg-layout{grid-template-columns:1fr;height:auto}
}
@media(max-width:640px){
  .pp-sidebar{position:fixed;left:0;top:0;transform:translateX(-100%);height:100vh;z-index:300}
  .pp-sidebar.open{transform:translateX(0)}
  .pp-overlay{display:block}
  .pp-hamburger{display:flex!important;align-items:center}
  .pp-stats{grid-template-columns:1fr}
  .pp-content{padding:14px}
  .pp-doc-grid{grid-template-columns:1fr}
}
`;