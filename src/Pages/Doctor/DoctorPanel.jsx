// import { useState, useEffect, useRef } from "react";
// import VideoCall from "../Doctor/VideoCall";
// import LiveMap   from "../Doctor/LiveMap";

// /* ─────────────────────────────────────────────────────────────────
//    SHARED STORAGE LAYER  (same keys as AdminPanel.jsx)
//    Replace with your real imports: import { doctorDB, ... } from "../../utils/storage"
// ───────────────────────────────────────────────────────────────── */
// const STORAGE = {
//   get: (k, def) => { try { return JSON.parse(localStorage.getItem(k)) ?? def; } catch { return def; } },
//   set: (k, v)   => localStorage.setItem(k, JSON.stringify(v)),
// };
// const uid  = () => Math.random().toString(36).slice(2, 10);
// const now  = () => new Date().toISOString();
// const todayStr = () => new Date().toISOString().split("T")[0];

// const db = (key) => ({
//   all:    ()      => STORAGE.get(key, []),
//   get:    (id)    => STORAGE.get(key, []).find(r => r.id === id),
//   add:    (obj)   => { const rows = STORAGE.get(key,[]); rows.push(obj); STORAGE.set(key, rows); return obj; },
//   update: (id, patch) => {
//     const rows = STORAGE.get(key,[]).map(r => r.id===id ? {...r,...patch} : r);
//     STORAGE.set(key, rows); return rows.find(r=>r.id===id);
//   },
//   delete: (id)    => STORAGE.set(key, STORAGE.get(key,[]).filter(r=>r.id!==id)),
//   forDoctor:  (did) => STORAGE.get(key,[]).filter(r => r.doctorId === did),
//   forPatient: (pid) => STORAGE.get(key,[]).filter(r => r.patientId === pid),
// });

// // shared DBs (same keys as AdminPanel)
// const doctorDB   = db("adm_doctors");
// const patientDB  = db("adm_patients");
// const apptDB     = db("adm_appointments");
// const payDB      = db("adm_payments");
// const msgDB      = db("adm_messages");
// const notifDB    = db("adm_notifications");
// const commDB     = db("adm_commissions");
// const forfaitDB  = db("adm_forfaits");

// // doctor-specific DBs
// const prescrDB   = db("doc_prescriptions");
// const recordDB   = db("doc_records");
// const consultDB  = db("doc_consultations");
// const scheduleDB = db("doc_schedule");   // {id, doctorId, dayOfWeek, startTime, endTime, available}
// const homeVisitDB= db("doc_homevisits"); // {id, doctorId, patientId, patientName, address, date, time, status, notes}

// function pushNotif(toId, type, title, body) {
//   notifDB.add({ id:uid(), toId, type, title, body, read:false, createdAt:now() });
// }

// /* ─────────────────────────────────────────────────────────────────
//    AVATAR
// ───────────────────────────────────────────────────────────────── */
// function Av({ name="?", size=36 }) {
//   const COLORS = ["#1e88e5","#00bfa5","#7c3aed","#f44336","#ff7043","#0d47a1","#00838f","#e91e63"];
//   const c = COLORS[(name.charCodeAt(0)||0) % COLORS.length];
//   const init = name.split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase();
//   return (
//     <div style={{ width:size, height:size, borderRadius:"50%", background:c, color:"#fff",
//       display:"flex", alignItems:"center", justifyContent:"center",
//       fontWeight:700, fontSize:size*.36, flexShrink:0, fontFamily:"'Sora',sans-serif",
//       boxShadow:"0 2px 8px rgba(0,0,0,.18)" }}>
//       {init}
//     </div>
//   );
// }

// /* ─────────────────────────────────────────────────────────────────
//    BADGE
// ───────────────────────────────────────────────────────────────── */
// const SC = { confirmed:"#22c55e", active:"#22c55e", paid:"#22c55e", accepted:"#22c55e", completed:"#22c55e",
//   pending:"#fbbf24", scheduled:"#fbbf24",
//   cancelled:"#ef4444", inactive:"#94a3b8", declined:"#ef4444" };
// function Badge({ label, color }) {
//   const c = color || SC[label?.toLowerCase()] || "#94a3b8";
//   return <span style={{ background:c+"22", color:c, border:`1px solid ${c}44`, borderRadius:6, padding:"2px 10px", fontSize:11, fontWeight:700, whiteSpace:"nowrap" }}>{label}</span>;
// }

// /* ─────────────────────────────────────────────────────────────────
//    MODAL
// ───────────────────────────────────────────────────────────────── */
// function Modal({ title, onClose, children, wide }) {
//   return (
//     <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.55)", zIndex:9999,
//       display:"flex", alignItems:"center", justifyContent:"center", padding:16 }} onClick={onClose}>
//       <div style={{ background:"var(--card)", borderRadius:18, width:"100%", maxWidth:wide?720:480,
//         maxHeight:"90vh", overflow:"auto", boxShadow:"0 24px 80px rgba(0,0,0,.4)", border:"1px solid var(--border)" }}
//         onClick={e=>e.stopPropagation()}>
//         <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
//           padding:"20px 24px", borderBottom:"1px solid var(--border)" }}>
//           <span style={{ fontFamily:"'Sora',sans-serif", fontWeight:700, fontSize:16 }}>{title}</span>
//           <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", fontSize:20, color:"var(--muted)" }}>✕</button>
//         </div>
//         <div style={{ padding:"20px 24px" }}>{children}</div>
//       </div>
//     </div>
//   );
// }

// /* ─────────────────────────────────────────────────────────────────
//    FORM HELPERS
// ───────────────────────────────────────────────────────────────── */
// function FRow({ label, children }) {
//   return (
//     <div style={{ marginBottom:14 }}>
//       <label style={{ display:"block", fontSize:12, fontWeight:700, color:"var(--muted)", marginBottom:5, textTransform:"uppercase", letterSpacing:.6 }}>{label}</label>
//       {children}
//     </div>
//   );
// }
// const inp = { background:"var(--bg)", border:"1.5px solid var(--border)", borderRadius:9, padding:"9px 13px",
//   width:"100%", fontSize:14, color:"var(--text)", outline:"none", boxSizing:"border-box", fontFamily:"inherit" };

// /* ─────────────────────────────────────────────────────────────────
//    TOAST
// ───────────────────────────────────────────────────────────────── */
// function useToast() {
//   const [toasts, setToasts] = useState([]);
//   const fire = (msg, type="success") => {
//     const id = uid();
//     setToasts(t => [...t, {id,msg,type}]);
//     setTimeout(() => setToasts(t => t.filter(x=>x.id!==id)), 3200);
//   };
//   return { toasts, fire };
// }
// function Toaster({ toasts }) {
//   return (
//     <div style={{ position:"fixed", bottom:24, right:24, zIndex:99999, display:"flex", flexDirection:"column", gap:8 }}>
//       {toasts.map(t => (
//         <div key={t.id} style={{ background:t.type==="error"?"#f44336":t.type==="warn"?"#f59e0b":"#22c55e",
//           color:"#fff", borderRadius:12, padding:"12px 20px", fontSize:14, fontWeight:600,
//           boxShadow:"0 8px 32px rgba(0,0,0,.3)", animation:"fadeUp .3s ease", minWidth:220 }}>{t.msg}</div>
//       ))}
//     </div>
//   );
// }

// /* ─────────────────────────────────────────────────────────────────
//    NAV CONFIG
// ───────────────────────────────────────────────────────────────── */
// const NAV = [
//   { section:"Overview" },
//   { key:"overview",      icon:"⊞", label:"Dashboard" },
//   { section:"Clinical" },
//   { key:"appointments",  icon:"📅", label:"Appointments" },
//   { key:"patients",      icon:"👥", label:"My Patients" },
//   { key:"consultations", icon:"🎥", label:"Consultations" },
//   { key:"prescriptions", icon:"💊", label:"Prescriptions" },
//   { key:"records",       icon:"📋", label:"Medical Records" },
//   { section:"Services" },
//   { key:"home_visits",   icon:"🏠", label:"Home Visits" },
//   { key:"schedule",      icon:"🗓️", label:"My Schedule" },
//   { section:"Communication" },
//   { key:"messages",      icon:"💬", label:"Messages" },
//   { key:"notifications", icon:"🔔", label:"Notifications" },
//   { section:"Finance" },
//   { key:"payments",      icon:"💳", label:"Payments" },
//   { section:"Account" },
//   { key:"profile",       icon:"👤", label:"My Profile" },
// ];

// /* ═══════════════════════════════════════════════════════════════
//    ROOT — accepts doctorId prop (set by login)
// ═══════════════════════════════════════════════════════════════ */


// export default function DoctorPanel({ doctorId: propDoctorId, onLogout }) {
//   const [doctorId] = useState(() => {
//     if (propDoctorId) return propDoctorId;
//     const doctors = doctorDB.all();
//     return doctors.find(d => d.status === "active")?.id || doctors[0]?.id || "d1";
//   });
 
//   const doctor = doctorDB.get(doctorId) || {};
//   const [tab,         setTab]        = useState("overview");
//   const [sideOpen,    setSideOpen]   = useState(false);
//   const [activeCall,  setActiveCall] = useState(null); // incoming video call
//   const [callAlert,   setCallAlert]  = useState(null); // toast-style alert
//   const { toasts, fire: toast } = useToast();
 
//   const [unreadNotif, setUnreadNotif] = useState(0);
//   const [unreadMsg,   setUnreadMsg]   = useState(0);
//   const [pendingAppts,setPending]     = useState(0);
 
//   const refreshBadges = () => {
//     setUnreadNotif(notifDB.all().filter(n => (n.toId===doctorId||n.toId==="all_doctors"||n.toId==="all") && !n.read).length);
//     setUnreadMsg(msgDB.all().filter(m => m.toId===doctorId && !m.read).length);
//     setPending(apptDB.forDoctor(doctorId).filter(a => a.status==="pending").length);
//   };
 
//   /* ── Poll for incoming video call requests ── */
//   useEffect(() => {
//     const checkIncoming = () => {
//       const incoming = consultDB.all().filter(c =>
//         c.doctorId === doctorId &&
//         c.type     === "video"  &&
//         c.status   === "scheduled" &&
//         !c.alertShown
//       );
//       if (incoming.length > 0 && !callAlert && !activeCall) {
//         const call = incoming[0];
//         setCallAlert(call);
//         // Mark as alerted so we don't re-show
//         consultDB.update(call.id, { alertShown: true });
//       }
//     };
//     checkIncoming();
//     const t = setInterval(checkIncoming, 3000);
//     return () => clearInterval(t);
//   }, [doctorId, callAlert, activeCall]);
 
//   useEffect(() => {
//     refreshBadges();
//     const t = setInterval(refreshBadges, 3000);
//     return () => clearInterval(t);
//   }, [doctorId]);
 
//   const sharedProps = { doctorId, doctor, toast, refreshBadges };
 
//   /* ── If in active video call, render VideoCall fullscreen ── */
//   if (activeCall) return (
//     <VideoCall
//       consultation={activeCall}
//       localUser={{ id: doctorId, name: doctor.name || "Doctor", role: "doctor" }}
//       onEnd={() => {
//         consultDB.update(activeCall.id, { status: "completed" });
//         pushNotif(activeCall.patientId, "consultation", "✅ Session Completed",
//           `Your video session with Dr. ${doctor.name} has ended.`);
//         pushNotif("admin", "consultation", "Session Ended",
//           `${doctor.name} completed video call with ${activeCall.patientName}.`);
//         toast("Session ended and marked complete.");
//         setActiveCall(null);
//         refreshBadges();
//       }}
//     />
//   );
 
//   return (
//     <div style={{ display:"flex", height:"100vh", overflow:"hidden", background:"var(--bg)", fontFamily:"'DM Sans',sans-serif", color:"var(--text)" }}>
//       <style>{CSS}</style>
 
//       {/* ── Incoming Video Call Alert ── */}
//       {callAlert && (
//         <div style={{
//           position:"fixed", inset:0, background:"rgba(0,0,0,.7)", zIndex:99999,
//           display:"flex", alignItems:"center", justifyContent:"center", padding:16,
//           backdropFilter:"blur(4px)"
//         }}>
//           <div style={{
//             background:"#fff", borderRadius:24, padding:"36px 32px", maxWidth:420, width:"100%",
//             textAlign:"center", boxShadow:"0 32px 80px rgba(0,0,0,.3)",
//             border:"2px solid rgba(0,191,165,.3)"
//           }}>
//             {/* Animated ring */}
//             <div style={{ position:"relative", width:90, height:90, margin:"0 auto 20px" }}>
//               <div style={{ position:"absolute", inset:0, borderRadius:"50%", border:"3px solid #00bfa5", animation:"ringPulse 1.2s ease-out infinite" }}/>
//               <div style={{ position:"absolute", inset:8, borderRadius:"50%", border:"3px solid rgba(0,191,165,.4)", animation:"ringPulse 1.2s ease-out infinite .3s" }}/>
//               <div style={{ position:"absolute", inset:16, borderRadius:"50%", background:"linear-gradient(135deg,#00bfa5,#0891b2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:28 }}>
//                 📹
//               </div>
//             </div>
//             <style>{`@keyframes ringPulse{0%{transform:scale(1);opacity:1}100%{transform:scale(1.6);opacity:0}}`}</style>
//             <h2 style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:800, fontSize:20, color:"#0f172a", marginBottom:6 }}>
//               Incoming Video Call
//             </h2>
//             <p style={{ color:"#64748b", fontSize:14, marginBottom:4 }}>
//               <strong>{callAlert.patientName}</strong> is requesting a video consultation
//             </p>
//             <p style={{ color:"#94a3b8", fontSize:12, marginBottom:28 }}>
//               📅 Scheduled: {callAlert.date} at {callAlert.time}
//             </p>
//             <div style={{ display:"flex", gap:12 }}>
//               <button
//                 onClick={() => { setCallAlert(null); consultDB.update(callAlert.id, { status:"cancelled" }); pushNotif(callAlert.patientId, "consultation", "Call Declined", `Dr. ${doctor.name} is unavailable right now.`); toast("Call declined.","warn"); }}
//                 style={{ flex:1, padding:"14px", borderRadius:14, border:"2px solid #e2e8f0", background:"#f8fafc", color:"#64748b", fontWeight:700, fontSize:14, cursor:"pointer", fontFamily:"inherit" }}>
//                 📵 Decline
//               </button>
//               <button
//                 onClick={() => { setCallAlert(null); setActiveCall(callAlert); pushNotif(callAlert.patientId, "consultation", "📹 Doctor Joined", `Dr. ${doctor.name} accepted your video call.`); }}
//                 style={{ flex:2, padding:"14px", borderRadius:14, border:"none", background:"linear-gradient(135deg,#00bfa5,#0891b2)", color:"#fff", fontWeight:800, fontSize:14, cursor:"pointer", fontFamily:"inherit", boxShadow:"0 6px 24px rgba(0,191,165,.35)" }}>
//                 📹 Accept Call
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
 
//       {/* SIDEBAR */}
//       <aside className={`sidebar${sideOpen?" open":""}`}>
//         <div className="sidebar-brand">
//           <div className="brand-orb" style={{ background:"linear-gradient(135deg,#00bfa5,#26c6da)" }}>+</div>
//           <div>
//             <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:800, fontSize:15, color:"#fff" }}>STECH</div>
//             <div style={{ fontSize:10, color:"#94a3b8", letterSpacing:1.5, textTransform:"uppercase" }}>Doctor Portal</div>
//           </div>
//         </div>
 
//         <div style={{ margin:"0 12px 8px", padding:"12px", background:"rgba(255,255,255,.06)", borderRadius:12, display:"flex", gap:10, alignItems:"center" }}>
//           <Av name={doctor.name||"Dr"} size={40}/>
//           <div style={{ overflow:"hidden" }}>
//             <div style={{ color:"#fff", fontWeight:700, fontSize:13, fontFamily:"'Sora',sans-serif", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{doctor.name||"Doctor"}</div>
//             <div style={{ color:"#00bfa5", fontSize:11, fontWeight:600 }}>{doctor.specialty||"Specialist"}</div>
//           </div>
//         </div>
 
//         <nav className="sidebar-nav">
//           {NAV.map((n, i) => {
//             if (n.section) return <div key={i} className="nav-section">{n.section}</div>;
//             const badge = n.key==="notifications" ? unreadNotif : n.key==="messages" ? unreadMsg : n.key==="appointments" ? pendingAppts : 0;
//             return (
//               <button key={n.key} className={`nav-item${tab===n.key?" active":""}`}
//                 onClick={() => { setTab(n.key); setSideOpen(false); }}>
//                 <span className="nav-icon">{n.icon}</span>
//                 <span>{n.label}</span>
//                 {badge > 0 && <span className="nav-badge">{badge}</span>}
//               </button>
//             );
//           })}
//         </nav>
 
//         <button className="logout-btn" onClick={onLogout}><span>🚪</span> Logout</button>
//       </aside>
 
//       {/* MAIN */}
//       <div className="main-wrap">
//         <header className="topbar">
//           <button className="hamburger" onClick={() => setSideOpen(s => !s)}>☰</button>
//           <div style={{ flex:1 }}/>
//           {/* Video call quick-launch */}
//           <button className="topbar-icon" title="Start video call" onClick={() => setTab("consultations")}
//             style={{ background:"rgba(0,191,165,.1)", border:"1px solid rgba(0,191,165,.25)", color:"#00bfa5", fontSize:16 }}>
//             📹
//           </button>
//           <button className="topbar-icon" onClick={() => setTab("messages")}>
//             💬{unreadMsg>0&&<sup className="top-badge">{unreadMsg}</sup>}
//           </button>
//           <button className="topbar-icon" onClick={() => setTab("notifications")}>
//             🔔{unreadNotif>0&&<sup className="top-badge">{unreadNotif}</sup>}
//           </button>
//           <div style={{ display:"flex", alignItems:"center", gap:8, padding:"4px 10px", background:"rgba(0,191,165,.1)", borderRadius:10, border:"1px solid rgba(0,191,165,.25)" }}>
//             <div style={{ width:8, height:8, borderRadius:"50%", background:"#00bfa5", animation:"pulse 2s infinite" }}/>
//             <span style={{ fontSize:12, fontWeight:700, color:"#00bfa5" }}>Online</span>
//           </div>
//         </header>
 
//         <main className="content-scroll">
//           {tab==="overview"      && <DocOverview      {...sharedProps} onNav={setTab} onStartCall={(c)=>setActiveCall(c)}/>}
//           {tab==="appointments"  && <DocAppointments  {...sharedProps}/>}
//           {tab==="patients"      && <DocPatients      {...sharedProps}/>}
//           {tab==="consultations" && <DocConsultations {...sharedProps} onStartCall={(c)=>setActiveCall(c)}/>}
//           {tab==="prescriptions" && <DocPrescriptions {...sharedProps}/>}
//           {tab==="records"       && <DocRecords       {...sharedProps}/>}
//           {tab==="home_visits"   && <DocHomeVisits    {...sharedProps}/>}
//           {tab==="schedule"      && <DocSchedule      {...sharedProps}/>}
//           {tab==="messages"      && <DocMessages      {...sharedProps}/>}
//           {tab==="notifications" && <DocNotifications {...sharedProps}/>}
//           {tab==="payments"      && <DocPayments      {...sharedProps}/>}
//           {tab==="profile"       && <DocProfile       {...sharedProps}/>}
//         </main>
//       </div>
 
//       {sideOpen && <div className="overlay" onClick={() => setSideOpen(false)}/>}
//       <Toaster toasts={toasts}/>
//     </div>
//   );
// }

// /* ═══════════════════════════════════════════════════════════════
//    OVERVIEW
// ═══════════════════════════════════════════════════════════════ */
// // function DocOverview({ doctorId, doctor, onNav, toast }) {
// //   const appts    = apptDB.forDoctor(doctorId);
// //   const payments = payDB.forDoctor(doctorId);
// //   const visits   = homeVisitDB.forDoctor(doctorId);
// //   const comms    = commDB.all().filter(c=>c.doctorId===doctorId);
// //   const today    = todayStr();

// //   const todayAppts  = appts.filter(a=>a.date===today);
// //   const pending     = appts.filter(a=>a.status==="pending");
// //   const revenue     = payments.filter(p=>p.status==="paid").reduce((s,p)=>s+p.amount,0);
// //   const upcoming    = appts.filter(a=>a.status!=="cancelled"&&a.date>=today).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time)).slice(0,5);

// //   const hr = new Date().getHours();
// //   const greeting = hr<12?"Good Morning":hr<18?"Good Afternoon":"Good Evening";
// //   const firstName = doctor.name?.split(" ").slice(-1)[0] || doctor.name || "Doctor";

// //   const confirm = (id) => { apptDB.update(id,{status:"confirmed"}); toast("Appointment confirmed!"); window.dispatchEvent(new Event("refresh")); };
// //   const cancel  = (id) => { apptDB.update(id,{status:"cancelled"}); toast("Appointment cancelled.","warn"); window.dispatchEvent(new Event("refresh")); };

// //   // force re-render on internal events
// //   const [tick, setTick] = useState(0);
// //   useEffect(()=>{ const h=()=>setTick(t=>t+1); window.addEventListener("refresh",h); return()=>window.removeEventListener("refresh",h); },[]);

// //   const stats = [
// //     { icon:"📅", label:"Today's Appts",     value:todayAppts.length,  color:"#1e88e5", trend:`${todayAppts.filter(a=>a.status==="confirmed").length} confirmed` },
// //     { icon:"⏳", label:"Pending Requests",  value:pending.length,     color:"#fbbf24", trend:"Need action" },
// //     { icon:"🏠", label:"Home Visit Requests",value:visits.filter(v=>v.status==="pending").length, color:"#f44336", trend:"Awaiting" },
// //     { icon:"💰", label:"Total Revenue",     value:`${(revenue/1000).toFixed(1)}K XAF`, color:"#00bfa5", trend:"Paid sessions" },
// //   ];

// //   return (
// //     <div className="page-anim">
// //       <div className="page-header">
// //         <div>
// //           <h1 className="page-title">{greeting}, Dr. {firstName}!</h1>
// //           <p className="page-sub">{doctor.specialty} · {new Date().toDateString()}</p>
// //         </div>
// //         <button className="btn-teal" onClick={()=>onNav("appointments")}>+ New Appointment</button>
// //       </div>

// //       <div className="stats-row">
// //         {stats.map(s=>(
// //           <div key={s.label} className="stat-card" style={{"--accent":s.color}}>
// //             <div className="stat-icon-wrap" style={{background:s.color+"1a"}}>{s.icon}</div>
// //             <div className="stat-body">
// //               <div className="stat-label">{s.label}</div>
// //               <div className="stat-value">{s.value}</div>
// //               <div className="stat-trend">{s.trend}</div>
// //             </div>
// //           </div>
// //         ))}
// //       </div>

// //       <div className="two-col">
// //         {/* Today's schedule */}
// //         <div className="card">
// //           <div className="card-head">
// //             <div className="card-title">Today's Schedule</div>
// //             <button className="ghost-btn" onClick={()=>onNav("schedule")}>Full schedule →</button>
// //           </div>
// //           {todayAppts.length===0
// //             ? <div className="empty-state"><span style={{fontSize:36}}>🎉</span><p>No appointments today!</p></div>
// //             : todayAppts.map(a=>(
// //               <div key={a.id} className="appt-row">
// //                 <span className="appt-time">{a.time}</span>
// //                 <Av name={a.patientName} size={36}/>
// //                 <div style={{flex:1}}>
// //                   <div style={{fontWeight:700,fontSize:14}}>{a.patientName}</div>
// //                   <div style={{fontSize:12,color:"var(--muted)"}}>{a.healthType}</div>
// //                 </div>
// //                 <Badge label={a.status}/>
// //               </div>
// //             ))
// //           }
// //         </div>

// //         {/* Pending requests */}
// //         <div className="card">
// //           <div className="card-head">
// //             <div className="card-title">Pending Requests</div>
// //             <span style={{fontSize:12,color:"var(--muted)"}}>{pending.length} awaiting</span>
// //           </div>
// //           {pending.length===0
// //             ? <div className="empty-state"><span style={{fontSize:36}}>✅</span><p>All clear!</p></div>
// //             : pending.slice(0,4).map(a=>(
// //               <div key={a.id} className="appt-row">
// //                 <Av name={a.patientName} size={36}/>
// //                 <div style={{flex:1}}>
// //                   <div style={{fontWeight:700,fontSize:14}}>{a.patientName}</div>
// //                   <div style={{fontSize:12,color:"var(--muted)"}}>{a.healthType} · {a.date} {a.time}</div>
// //                 </div>
// //                 <div style={{display:"flex",gap:5}}>
// //                   <button className="ghost-btn green-btn" onClick={()=>confirm(a.id)}>✓</button>
// //                   <button className="ghost-btn" style={{color:"var(--red)"}} onClick={()=>cancel(a.id)}>✗</button>
// //                 </div>
// //               </div>
// //             ))
// //           }
// //         </div>
// //       </div>

// //       {/* Upcoming & Quick actions */}
// //       <div className="two-col" style={{marginTop:20}}>
// //         <div className="card">
// //           <div className="card-head"><div className="card-title">Upcoming Appointments</div></div>
// //           {upcoming.length===0
// //             ? <div className="empty-state"><span style={{fontSize:32}}>📅</span><p>No upcoming appointments.</p></div>
// //             : upcoming.map(a=>(
// //               <div key={a.id} className="appt-row">
// //                 <div style={{textAlign:"center",minWidth:48}}>
// //                   <div style={{fontSize:11,fontWeight:700,color:"var(--muted)",textTransform:"uppercase"}}>{new Date(a.date).toLocaleDateString("en",{month:"short"})}</div>
// //                   <div style={{fontFamily:"'Sora',sans-serif",fontWeight:800,fontSize:20,color:"#1e88e5",lineHeight:1}}>{new Date(a.date).getDate()}</div>
// //                 </div>
// //                 <Av name={a.patientName} size={32}/>
// //                 <div style={{flex:1}}>
// //                   <div style={{fontWeight:700,fontSize:13}}>{a.patientName}</div>
// //                   <div style={{fontSize:12,color:"var(--muted)"}}>{a.healthType} · {a.time}</div>
// //                 </div>
// //                 <Badge label={a.status}/>
// //               </div>
// //             ))
// //           }
// //         </div>

// //         <div className="card">
// //           <div className="card-title" style={{marginBottom:14}}>Quick Actions</div>
// //           <div className="quick-grid">
// //             {[
// //               {icon:"📅",label:"Appointments", nav:"appointments", c:"#1e88e5"},
// //               {icon:"💊",label:"Prescriptions",nav:"prescriptions",c:"#00bfa5"},
// //               {icon:"🎥",label:"Consultations",nav:"consultations",c:"#7c3aed"},
// //               {icon:"📋",label:"Records",      nav:"records",      c:"#f44336"},
// //               {icon:"🏠",label:"Home Visits",  nav:"home_visits",  c:"#ff7043"},
// //               {icon:"💬",label:"Messages",     nav:"messages",     c:"#fbbf24"},
// //             ].map(q=>(
// //               <button key={q.label} className="quick-btn" style={{"--qc":q.c}} onClick={()=>onNav(q.nav)}>
// //                 <span style={{fontSize:22}}>{q.icon}</span>
// //                 <span style={{fontSize:11,fontWeight:700}}>{q.label}</span>
// //               </button>
// //             ))}
// //           </div>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // }

// function DocOverview({ doctorId, doctor, onNav, toast, onStartCall }) {
//   const appts    = apptDB.forDoctor(doctorId);
//   const payments = payDB.forDoctor(doctorId);
//   const visits   = homeVisitDB.forDoctor(doctorId);
//   const consults = consultDB.forDoctor(doctorId);
//   const today    = todayStr();
 
//   const todayAppts    = appts.filter(a => a.date === today);
//   const pending       = appts.filter(a => a.status === "pending");
//   const revenue       = payments.filter(p => p.status === "paid").reduce((s,p) => s+p.amount, 0);
//   const upcoming      = appts.filter(a => a.status!=="cancelled" && a.date>=today).sort((a,b) => (a.date+a.time).localeCompare(b.date+b.time)).slice(0,5);
//   const videoConsults = consults.filter(c => c.type==="video" && c.status==="scheduled");
 
//   const hr = new Date().getHours();
//   const greeting  = hr<12?"Good Morning":hr<18?"Good Afternoon":"Good Evening";
//   const firstName = doctor.name?.split(" ").slice(-1)[0] || "Doctor";
 
//   const confirm = (id) => { apptDB.update(id,{status:"confirmed"}); toast("Appointment confirmed!"); window.dispatchEvent(new Event("refresh")); };
//   const cancel  = (id) => { apptDB.update(id,{status:"cancelled"}); toast("Appointment cancelled.","warn"); window.dispatchEvent(new Event("refresh")); };
 
//   const [tick, setTick] = useState(0);
//   useEffect(()=>{ const h=()=>setTick(t=>t+1); window.addEventListener("refresh",h); return()=>window.removeEventListener("refresh",h); },[]);
 
//   const stats = [
//     { icon:"📅", label:"Today's Appts",      value:todayAppts.length,    color:"#1e88e5", trend:`${todayAppts.filter(a=>a.status==="confirmed").length} confirmed` },
//     { icon:"⏳", label:"Pending Requests",   value:pending.length,       color:"#fbbf24", trend:"Need action" },
//     { icon:"📹", label:"Video Calls",         value:videoConsults.length, color:"#00bfa5", trend:"Scheduled sessions", nav:"consultations" },
//     { icon:"💰", label:"Total Revenue",       value:`${(revenue/1000).toFixed(1)}K XAF`, color:"#16a34a", trend:"Paid sessions" },
//   ];
 
//   return (
//     <div className="page-anim">
//       <div className="page-header">
//         <div>
//           <h1 className="page-title">{greeting}, Dr. {firstName}!</h1>
//           <p className="page-sub">{doctor.specialty} · {new Date().toDateString()}</p>
//         </div>
//         <div style={{ display:"flex", gap:10 }}>
//           {videoConsults.length > 0 && (
//             <button style={{ background:"linear-gradient(135deg,#00bfa5,#0891b2)", color:"#fff", border:"none", borderRadius:12, padding:"10px 18px", fontWeight:700, cursor:"pointer", fontSize:13, fontFamily:"inherit", display:"flex", alignItems:"center", gap:7, animation:"pulse 2s infinite" }}
//               onClick={() => onNav("consultations")}>
//               📹 {videoConsults.length} Video Call{videoConsults.length>1?"s":""} Waiting
//             </button>
//           )}
//           <button className="btn-teal" onClick={() => onNav("appointments")}>+ New Appointment</button>
//         </div>
//       </div>
 
//       <div className="stats-row">
//         {stats.map(s => (
//           <div key={s.label} className="stat-card" style={{"--accent":s.color, cursor:s.nav?"pointer":"default"}} onClick={() => s.nav && onNav(s.nav)}>
//             <div className="stat-icon-wrap" style={{background:s.color+"1a"}}>{s.icon}</div>
//             <div className="stat-body">
//               <div className="stat-label">{s.label}</div>
//               <div className="stat-value">{s.value}</div>
//               <div className="stat-trend">{s.trend}</div>
//             </div>
//           </div>
//         ))}
//       </div>
 
//       {/* Pending video calls banner */}
//       {videoConsults.length > 0 && (
//         <div style={{ background:"linear-gradient(110deg,#003d33,#00574a)", borderRadius:16, padding:"18px 22px", marginBottom:20, display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, flexWrap:"wrap" }}>
//           <div style={{ display:"flex", alignItems:"center", gap:14 }}>
//             <div style={{ fontSize:32 }}>📹</div>
//             <div>
//               <div style={{ fontWeight:800, fontSize:16, color:"#fff" }}>You have {videoConsults.length} scheduled video consultation{videoConsults.length>1?"s":""}</div>
//               <div style={{ fontSize:13, color:"rgba(255,255,255,.6)", marginTop:3 }}>
//                 Next: {videoConsults[0]?.patientName} · {videoConsults[0]?.date} at {videoConsults[0]?.time}
//               </div>
//             </div>
//           </div>
//           <button onClick={() => { onStartCall(videoConsults[0]); }}
//             style={{ background:"#00bfa5", color:"#fff", border:"none", borderRadius:12, padding:"12px 22px", fontWeight:800, cursor:"pointer", fontSize:14, fontFamily:"inherit", whiteSpace:"nowrap" }}>
//             📹 Join Now
//           </button>
//         </div>
//       )}
 
//       <div className="two-col">
//         {/* Today's schedule */}
//         <div className="card">
//           <div className="card-head">
//             <div className="card-title">Today's Schedule</div>
//             <button className="ghost-btn" onClick={() => onNav("schedule")}>Full schedule →</button>
//           </div>
//           {todayAppts.length === 0
//             ? <div className="empty-state"><span style={{fontSize:36}}>🎉</span><p>No appointments today!</p></div>
//             : todayAppts.map(a => (
//               <div key={a.id} className="appt-row">
//                 <span className="appt-time">{a.time}</span>
//                 {a.sessionType === "video" && <span title="Video call" style={{fontSize:14}}>📹</span>}
//                 {a.sessionType === "home-visit" && <span title="Home visit" style={{fontSize:14}}>🏠</span>}
//                 <Av name={a.patientName} size={36}/>
//                 <div style={{flex:1}}>
//                   <div style={{fontWeight:700,fontSize:14}}>{a.patientName}</div>
//                   <div style={{fontSize:12,color:"var(--muted)"}}>{a.healthType}</div>
//                 </div>
//                 <Badge label={a.status}/>
//               </div>
//             ))
//           }
//         </div>
 
//         {/* Pending requests */}
//         <div className="card">
//           <div className="card-head">
//             <div className="card-title">Pending Requests</div>
//             <span style={{fontSize:12,color:"var(--muted)"}}>{pending.length} awaiting</span>
//           </div>
//           {pending.length === 0
//             ? <div className="empty-state"><span style={{fontSize:36}}>✅</span><p>All clear!</p></div>
//             : pending.slice(0,4).map(a => (
//               <div key={a.id} className="appt-row">
//                 {a.sessionType==="video" && <span style={{fontSize:16}}>📹</span>}
//                 {a.sessionType==="home-visit" && <span style={{fontSize:16}}>🏠</span>}
//                 <Av name={a.patientName} size={36}/>
//                 <div style={{flex:1}}>
//                   <div style={{fontWeight:700,fontSize:14}}>{a.patientName}</div>
//                   <div style={{fontSize:12,color:"var(--muted)"}}>{a.healthType} · {a.date} {a.time}</div>
//                 </div>
//                 <div style={{display:"flex",gap:5}}>
//                   <button className="ghost-btn green-btn" onClick={()=>confirm(a.id)}>✓</button>
//                   <button className="ghost-btn" style={{color:"var(--red)"}} onClick={()=>cancel(a.id)}>✗</button>
//                 </div>
//               </div>
//             ))
//           }
//         </div>
//       </div>
 
//       {/* Upcoming */}
//       <div className="two-col" style={{marginTop:20}}>
//         <div className="card">
//           <div className="card-head"><div className="card-title">Upcoming Appointments</div></div>
//           {upcoming.length === 0
//             ? <div className="empty-state"><span style={{fontSize:32}}>📅</span><p>No upcoming.</p></div>
//             : upcoming.map(a => (
//               <div key={a.id} className="appt-row">
//                 <div style={{textAlign:"center",minWidth:48}}>
//                   <div style={{fontSize:11,fontWeight:700,color:"var(--muted)",textTransform:"uppercase"}}>{new Date(a.date).toLocaleDateString("en",{month:"short"})}</div>
//                   <div style={{fontFamily:"'Sora',sans-serif",fontWeight:800,fontSize:20,color:"#1e88e5",lineHeight:1}}>{new Date(a.date).getDate()}</div>
//                 </div>
//                 {a.sessionType==="video" && <span style={{fontSize:14}}>📹</span>}
//                 {a.sessionType==="home-visit" && <span style={{fontSize:14}}>🏠</span>}
//                 <Av name={a.patientName} size={32}/>
//                 <div style={{flex:1}}>
//                   <div style={{fontWeight:700,fontSize:13}}>{a.patientName}</div>
//                   <div style={{fontSize:12,color:"var(--muted)"}}>{a.healthType} · {a.time}</div>
//                 </div>
//                 <Badge label={a.status}/>
//               </div>
//             ))
//           }
//         </div>
 
//         <div className="card">
//           <div className="card-title" style={{marginBottom:14}}>Quick Actions</div>
//           <div className="quick-grid">
//             {[
//               {icon:"📅",label:"Appointments", nav:"appointments", c:"#1e88e5"},
//               {icon:"📹",label:"Video Calls",  nav:"consultations",c:"#00bfa5"},
//               {icon:"💊",label:"Prescriptions",nav:"prescriptions",c:"#7c3aed"},
//               {icon:"📋",label:"Records",      nav:"records",      c:"#f44336"},
//               {icon:"🏠",label:"Home Visits",  nav:"home_visits",  c:"#ff7043"},
//               {icon:"💬",label:"Messages",     nav:"messages",     c:"#fbbf24"},
//             ].map(q => (
//               <button key={q.label} className="quick-btn" style={{"--qc":q.c}} onClick={() => onNav(q.nav)}>
//                 <span style={{fontSize:22}}>{q.icon}</span>
//                 <span style={{fontSize:11,fontWeight:700}}>{q.label}</span>
//               </button>
//             ))}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// /* ═══════════════════════════════════════════════════════════════
//    APPOINTMENTS
// ═══════════════════════════════════════════════════════════════ */
// function DocAppointments({ doctorId, doctor, toast }) {
//   const [items, setItems]   = useState([]);
//   const [filter, setFilter] = useState("all");
//   const [search, setSearch] = useState("");
//   const [modal, setModal]   = useState(null);
//   const [addOpen, setAdd]   = useState(false);
//   const TYPES = ["Consultation","Root Canal","Scaling","Whitening","Wisdom Teeth Removal","Bleaching","Braces","Implant","X-Ray","Check-up","Cardiology","Dermatology"];

//   const refresh = () => setItems(apptDB.forDoctor(doctorId));
//   useEffect(()=>refresh(),[doctorId]);

//   const filtered = items.filter(a =>
//     (filter==="all"||a.status===filter) &&
//     (a.patientName?.toLowerCase().includes(search.toLowerCase())||a.healthType?.toLowerCase().includes(search.toLowerCase()))
//   );

//   const updateStatus = (id, status) => {
//     const a = apptDB.update(id, {status});
//     pushNotif(a?.patientId, "appointment", "Appointment Update", `Your appointment is now ${status}.`);
//     pushNotif("admin", "appointment", "Appointment Updated", `${a?.patientName}'s appointment with ${doctor.name} is ${status}.`);
//     toast(`Status → ${status}`);
//     refresh();
//   };

//   const blank = { patientId:"", healthType:"", date:"", time:"09:00", notes:"" };
//   const [form, setForm] = useState(blank);
//   const patients = patientDB.all();

//   const createAppt = () => {
//     if (!form.patientId||!form.healthType||!form.date) { toast("Fill required fields","error"); return; }
//     const p = patients.find(x=>x.id===form.patientId);
//     const a = apptDB.add({ ...form, id:uid(), doctorId, doctorName:doctor.name, patientName:p?.name, status:"confirmed", amount:0, createdAt:now() });
//     pushNotif(p?.id,"appointment","Appointment Booked",`Dr. ${doctor.name} booked a ${form.healthType} on ${form.date}.`);
//     pushNotif("admin","appointment","New Appointment",`${p?.name} — ${form.healthType} with ${doctor.name}.`);
//     toast("Appointment created!"); setForm(blank); setAdd(false); refresh();
//   };

//   return (
//     <div className="page-anim">
//       <div className="page-header">
//         <div><h1 className="page-title">Appointments</h1><p className="page-sub">{items.length} total</p></div>
//         <button className="btn-teal" onClick={()=>setAdd(true)}>+ New Appointment</button>
//       </div>

//       <div className="card">
//         <div className="filter-bar">
//           <input className="search-inp" style={{maxWidth:240}} placeholder="Search patient, type…" value={search} onChange={e=>setSearch(e.target.value)}/>
//           <div className="filter-tabs">
//             {["all","pending","confirmed","cancelled"].map(f=>(
//               <button key={f} className={`filter-tab${filter===f?" active":""}`} onClick={()=>setFilter(f)}>
//                 {f.charAt(0).toUpperCase()+f.slice(1)}
//                 <span className="f-count">{f==="all"?items.length:items.filter(a=>a.status===f).length}</span>
//               </button>
//             ))}
//           </div>
//         </div>
//         <div className="tbl-wrap">
//           <table className="s-table">
//             <thead><tr><th>Patient</th><th>Type</th><th>Date</th><th>Time</th><th>Amount</th><th>Status</th><th>Actions</th></tr></thead>
//             <tbody>
//               {filtered.length===0&&<tr><td colSpan={7} style={{textAlign:"center",padding:32,color:"var(--muted)"}}>No appointments found.</td></tr>}
//               {filtered.map(a=>(
//                 <tr key={a.id}>
//                   <td><div style={{display:"flex",alignItems:"center",gap:8}}><Av name={a.patientName} size={26}/>{a.patientName}</div></td>
//                   <td>{a.healthType}</td>
//                   <td>{a.date}</td>
//                   <td>{a.time}</td>
//                   <td style={{fontWeight:700}}>{(a.amount||0).toLocaleString()} XAF</td>
//                   <td><Badge label={a.status}/></td>
//                   <td>
//                     <div style={{display:"flex",gap:4}}>
//                       {a.status==="pending"&&<>
//                         <button className="ghost-btn green-btn" onClick={()=>updateStatus(a.id,"confirmed")}>✓</button>
//                         <button className="ghost-btn" style={{color:"var(--red)"}} onClick={()=>updateStatus(a.id,"cancelled")}>✗</button>
//                       </>}
//                       <button className="ghost-btn" onClick={()=>setModal(a)}>👁</button>
//                     </div>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </div>

//       {modal&&(
//         <Modal title="Appointment Detail" onClose={()=>setModal(null)}>
//           <div style={{textAlign:"center",marginBottom:16}}><Av name={modal.patientName} size={60}/></div>
//           {[["Patient",modal.patientName],["Type",modal.healthType],["Date",modal.date],["Time",modal.time],
//             ["Amount",`${(modal.amount||0).toLocaleString()} XAF`],["Status",modal.status],["Notes",modal.notes||"—"]].map(([k,v])=>(
//             <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"9px 0",borderBottom:"1px solid var(--border)",fontSize:14}}>
//               <span style={{color:"var(--muted)",fontWeight:600}}>{k}</span><span style={{fontWeight:600}}>{v}</span>
//             </div>
//           ))}
//         </Modal>
//       )}

//       {addOpen&&(
//         <Modal title="New Appointment" onClose={()=>setAdd(false)}>
//           <FRow label="Patient *">
//             <select style={inp} value={form.patientId} onChange={e=>setForm(f=>({...f,patientId:e.target.value}))}>
//               <option value="">Select patient…</option>
//               {patients.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
//             </select>
//           </FRow>
//           <FRow label="Treatment Type *">
//             <select style={inp} value={form.healthType} onChange={e=>setForm(f=>({...f,healthType:e.target.value}))}>
//               <option value="">Select type…</option>
//               {TYPES.map(t=><option key={t} value={t}>{t}</option>)}
//             </select>
//           </FRow>
//           <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
//             <FRow label="Date *"><input style={inp} type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/></FRow>
//             <FRow label="Time">
//               <select style={inp} value={form.time} onChange={e=>setForm(f=>({...f,time:e.target.value}))}>
//                 {["08:00","09:00","09:30","10:00","10:30","11:00","11:30","14:00","14:30","15:00","15:30","16:00"].map(t=><option key={t} value={t}>{t}</option>)}
//               </select>
//             </FRow>
//           </div>
//           <FRow label="Notes"><textarea style={{...inp,height:72,resize:"vertical"}} value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))}/></FRow>
//           <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
//             <button className="ghost-btn" onClick={()=>setAdd(false)}>Cancel</button>
//             <button className="btn-teal" onClick={createAppt}>Book Appointment</button>
//           </div>
//         </Modal>
//       )}
//     </div>
//   );
// }

// /* ═══════════════════════════════════════════════════════════════
//    MY PATIENTS
// ═══════════════════════════════════════════════════════════════ */
// function DocPatients({ doctorId, doctor, toast }) {
//   const appts = apptDB.forDoctor(doctorId);
//   const patientIds = [...new Set(appts.map(a=>a.patientId).filter(Boolean))];
//   const patients = patientIds.map(id=>patientDB.get(id)).filter(Boolean);
//   const [sel, setSel] = useState(null);
//   const [msgOpen, setMsgOpen] = useState(false);
//   const [msgText, setMsgText] = useState("");
//   const [search, setSearch] = useState("");

//   const filtered = patients.filter(p =>
//     p.name?.toLowerCase().includes(search.toLowerCase()) ||
//     p.email?.toLowerCase().includes(search.toLowerCase())
//   );

//   const sendMsg = () => {
//     if (!msgText.trim()||!sel) return;
//     msgDB.add({ id:uid(), fromId:doctorId, fromName:doctor.name, toId:sel.id, toName:sel.name,
//       body:msgText.trim(), read:false, createdAt:now() });
//     pushNotif(sel.id,"message",`Message from Dr. ${doctor.name}`,msgText.trim());
//     setMsgText(""); setMsgOpen(false);
//     toast(`Message sent to ${sel.name}`);
//   };

//   return (
//     <div className="page-anim">
//       <div className="page-header">
//         <div><h1 className="page-title">My Patients</h1><p className="page-sub">{patients.length} under your care</p></div>
//       </div>
//       <div className="card" style={{marginBottom:16}}>
//         <input className="search-inp" placeholder="Search name or email…" value={search} onChange={e=>setSearch(e.target.value)}/>
//       </div>
//       <div className="doctors-grid">
//         {filtered.length===0&&<div className="card" style={{gridColumn:"1/-1"}}><div className="empty-state"><span style={{fontSize:40}}>👥</span><p>No patients yet. Patients who book with you will appear here.</p></div></div>}
//         {filtered.map(p=>{
//           const pAppts = appts.filter(a=>a.patientId===p.id);
//           return (
//             <div key={p.id} className="doctor-card">
//               <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:12}}>
//                 <Av name={p.name} size={50}/>
//                 <div>
//                   <div style={{fontFamily:"'Sora',sans-serif",fontWeight:700,fontSize:15}}>{p.name}</div>
//                   <div style={{color:"var(--muted)",fontSize:13}}>{p.email}</div>
//                   <div style={{display:"flex",gap:6,marginTop:4}}>
//                     {p.bloodType&&<Badge label={p.bloodType} color="#f44336"/>}
//                     {p.membership&&<Badge label="Member" color="#22c55e"/>}
//                   </div>
//                 </div>
//               </div>
//               <div style={{fontSize:13,color:"var(--muted)",marginBottom:12}}>{pAppts.length} visits · Last: {pAppts.at(-1)?.date||"—"}</div>
//               <div style={{display:"flex",gap:6}}>
//                 <button className="ghost-btn" onClick={()=>setSel(p)}>👁 View</button>
//                 <button className="ghost-btn" style={{color:"#7c3aed"}} onClick={()=>{setSel(p);setMsgOpen(true);}}>💬 Message</button>
//               </div>
//             </div>
//           );
//         })}
//       </div>

//       {sel&&!msgOpen&&(
//         <Modal title="Patient Profile" onClose={()=>setSel(null)} wide>
//           <div style={{display:"flex",alignItems:"center",gap:18,marginBottom:20}}>
//             <Av name={sel.name} size={70}/>
//             <div>
//               <h3 style={{fontFamily:"'Sora',sans-serif",fontSize:20}}>{sel.name}</h3>
//               <p style={{color:"var(--muted)",marginTop:4}}>{sel.email} · {sel.phone}</p>
//               <div style={{display:"flex",gap:8,marginTop:8}}>
//                 {sel.bloodType&&<Badge label={sel.bloodType} color="#f44336"/>}
//                 {sel.membership&&<Badge label="Member" color="#22c55e"/>}
//               </div>
//             </div>
//           </div>
//           {[["DOB",sel.dob||"—"],["Allergies",sel.allergies||"None"],["Address",sel.address||"—"],["Status",sel.status]].map(([k,v])=>(
//             <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"9px 0",borderBottom:"1px solid var(--border)",fontSize:14}}>
//               <span style={{color:"var(--muted)",fontWeight:600}}>{k}</span><span style={{fontWeight:600}}>{v}</span>
//             </div>
//           ))}
//           <div style={{marginTop:16}}>
//             <div className="card-title" style={{marginBottom:10}}>Appointment History</div>
//             <div className="tbl-wrap">
//               <table className="s-table">
//                 <thead><tr><th>Type</th><th>Date</th><th>Time</th><th>Status</th></tr></thead>
//                 <tbody>{appts.filter(a=>a.patientId===sel.id).map(a=>(
//                   <tr key={a.id}><td>{a.healthType}</td><td>{a.date}</td><td>{a.time}</td><td><Badge label={a.status}/></td></tr>
//                 ))}</tbody>
//               </table>
//             </div>
//           </div>
//           <div style={{marginTop:16,textAlign:"right"}}>
//             <button className="btn-teal" onClick={()=>setMsgOpen(true)}>💬 Send Message</button>
//           </div>
//         </Modal>
//       )}

//       {msgOpen&&sel&&(
//         <Modal title={`Message → ${sel.name}`} onClose={()=>setMsgOpen(false)}>
//           <FRow label="Message">
//             <textarea style={{...inp,height:120,resize:"vertical"}} placeholder="Type your message…" value={msgText} onChange={e=>setMsgText(e.target.value)}/>
//           </FRow>
//           <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
//             <button className="ghost-btn" onClick={()=>setMsgOpen(false)}>Cancel</button>
//             <button className="btn-teal" onClick={sendMsg}>Send Message</button>
//           </div>
//         </Modal>
//       )}
//     </div>
//   );
// }

// /* ═══════════════════════════════════════════════════════════════
//    CONSULTATIONS (Video + Chat + Physical)
// ═══════════════════════════════════════════════════════════════ */
// // function DocConsultations({ doctorId, doctor, toast }) {
// //   const [items, setItems] = useState([]);
// //   const [addOpen, setAdd] = useState(false);
// //   const [active,  setActive] = useState(null);
// //   const patients = patientDB.all();
// //   const refresh = () => setItems(consultDB.forDoctor(doctorId));
// //   useEffect(()=>refresh(),[doctorId]);

// //   const blank = { patientId:"", type:"video", mode:"online", date:"", time:"10:00", notes:"" };
// //   const [form, setForm] = useState(blank);

// //   const create = () => {
// //     if (!form.patientId||!form.date) { toast("Fill required fields","error"); return; }
// //     const p = patients.find(x=>x.id===form.patientId);
// //     const c = consultDB.add({ ...form, id:uid(), doctorId, doctorName:doctor.name, patientName:p?.name, status:"scheduled", createdAt:now() });
// //     pushNotif(p?.id,"consultation",`Consultation Scheduled`,`Dr. ${doctor.name} scheduled a ${form.type} session on ${form.date} at ${form.time}.`);
// //     pushNotif("admin","consultation","New Consultation",`${p?.name} with ${doctor.name} on ${form.date}.`);
// //     toast("Consultation scheduled!"); setForm(blank); setAdd(false); refresh();
// //   };

// //   const typeIcon = {video:"🎥",chat:"💬",physical:"🏥"};

// //   return (
// //     <div className="page-anim">
// //       <div className="page-header">
// //         <div><h1 className="page-title">Consultations</h1><p className="page-sub">Video, chat & physical sessions</p></div>
// //         <button className="btn-teal" onClick={()=>setAdd(true)}>+ Schedule</button>
// //       </div>

// //       {active ? (
// //         <ConsultRoom consultation={active} doctor={doctor} onClose={()=>{
// //           consultDB.update(active.id,{status:"completed"});
// //           pushNotif(active.patientId,"consultation","Session Completed",`Your ${active.type} session with Dr. ${doctor.name} is complete.`);
// //           toast("Session ended & marked complete."); setActive(null); refresh();
// //         }}/>
// //       ) : (
// //         <>
// //           {/* Stats row */}
// //           <div className="stats-row" style={{gridTemplateColumns:"repeat(3,1fr)",marginBottom:16}}>
// //             {[{label:"Total",value:items.length,c:"#1e88e5"},{label:"Scheduled",value:items.filter(i=>i.status==="scheduled").length,c:"#fbbf24"},{label:"Completed",value:items.filter(i=>i.status==="completed").length,c:"#22c55e"}].map(s=>(
// //               <div key={s.label} className="stat-card" style={{"--accent":s.c}}>
// //                 <div className="stat-body"><div className="stat-label">{s.label}</div><div className="stat-value">{s.value}</div></div>
// //               </div>
// //             ))}
// //           </div>
// //           <div className="card">
// //             <div className="tbl-wrap">
// //               <table className="s-table">
// //                 <thead><tr><th>Patient</th><th>Type</th><th>Mode</th><th>Date</th><th>Time</th><th>Status</th><th>Action</th></tr></thead>
// //                 <tbody>
// //                   {items.length===0&&<tr><td colSpan={7} style={{textAlign:"center",padding:32,color:"var(--muted)"}}>No consultations yet.</td></tr>}
// //                   {items.map(c=>(
// //                     <tr key={c.id}>
// //                       <td><div style={{display:"flex",alignItems:"center",gap:8}}><Av name={c.patientName} size={26}/>{c.patientName}</div></td>
// //                       <td><Badge label={`${typeIcon[c.type]||"📋"} ${c.type}`} color="#7c3aed"/></td>
// //                       <td><Badge label={c.mode} color={c.mode==="online"?"#1e88e5":"#ff7043"}/></td>
// //                       <td>{c.date}</td><td>{c.time}</td>
// //                       <td><Badge label={c.status}/></td>
// //                       <td>
// //                         {c.status==="scheduled"&&(
// //                           <button className="btn-teal" style={{padding:"5px 12px",fontSize:12}} onClick={()=>setActive(c)}>
// //                             {c.type==="video"?"🎥 Join":c.type==="chat"?"💬 Chat":"🏥 Start"}
// //                           </button>
// //                         )}
// //                         {c.status==="completed"&&<Badge label="Done" color="#22c55e"/>}
// //                       </td>
// //                     </tr>
// //                   ))}
// //                 </tbody>
// //               </table>
// //             </div>
// //           </div>
// //         </>
// //       )}

// //       {addOpen&&(
// //         <Modal title="Schedule Consultation" onClose={()=>setAdd(false)}>
// //           <FRow label="Patient *">
// //             <select style={inp} value={form.patientId} onChange={e=>setForm(f=>({...f,patientId:e.target.value}))}>
// //               <option value="">Select patient…</option>
// //               {patients.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
// //             </select>
// //           </FRow>
// //           <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
// //             <FRow label="Session Type">
// //               <select style={inp} value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}>
// //                 <option value="video">🎥 Video Call</option>
// //                 <option value="chat">💬 Chat</option>
// //                 <option value="physical">🏥 Physical</option>
// //               </select>
// //             </FRow>
// //             <FRow label="Mode">
// //               <select style={inp} value={form.mode} onChange={e=>setForm(f=>({...f,mode:e.target.value}))}>
// //                 <option value="online">🌐 Online</option>
// //                 <option value="in-clinic">🏥 In-Clinic</option>
// //               </select>
// //             </FRow>
// //           </div>
// //           <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
// //             <FRow label="Date *"><input style={inp} type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/></FRow>
// //             <FRow label="Time">
// //               <select style={inp} value={form.time} onChange={e=>setForm(f=>({...f,time:e.target.value}))}>
// //                 {["09:00","10:00","11:00","13:00","14:00","15:00","16:00"].map(t=><option key={t} value={t}>{t}</option>)}
// //               </select>
// //             </FRow>
// //           </div>
// //           <FRow label="Notes"><textarea style={{...inp,height:72,resize:"vertical"}} value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))}/></FRow>
// //           <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
// //             <button className="ghost-btn" onClick={()=>setAdd(false)}>Cancel</button>
// //             <button className="btn-teal" onClick={create}>Schedule</button>
// //           </div>
// //         </Modal>
// //       )}
// //     </div>
// //   );
// // }

// function DocConsultations({ doctorId, doctor, toast, onStartCall }) {
//   const [items,   setItems]  = useState([]);
//   const [addOpen, setAdd]    = useState(false);
//   const patients = patientDB.all();
//   const refresh  = () => setItems(consultDB.forDoctor(doctorId));
//   useEffect(() => refresh(), [doctorId]);
 
//   const blank = { patientId:"", type:"video", mode:"online", date:"", time:"10:00", notes:"" };
//   const [form, setForm] = useState(blank);
 
//   const create = () => {
//     if (!form.patientId || !form.date) { toast("Fill required fields","error"); return; }
//     const p = patients.find(x => x.id === form.patientId);
//     const c = consultDB.add({ ...form, id:uid(), doctorId, doctorName:doctor.name, patientName:p?.name, status:"scheduled", alertShown:false, createdAt:now() });
//     pushNotif(p?.id, "consultation",
//       `${form.type==="video"?"📹":"💬"} Consultation Scheduled`,
//       `Dr. ${doctor.name} scheduled a ${form.type} session on ${form.date} at ${form.time}.`);
//     pushNotif("admin","consultation","New Consultation",`${p?.name} with ${doctor.name} on ${form.date}.`);
//     toast("Consultation scheduled!"); setForm(blank); setAdd(false); refresh();
//   };
 
//   const typeIcon = { video:"📹", chat:"💬", physical:"🏥" };
//   const typeColor = { video:"#00bfa5", chat:"#7c3aed", physical:"#1e88e5" };
 
//   return (
//     <div className="page-anim">
//       <div className="page-header">
//         <div><h1 className="page-title">Consultations</h1><p className="page-sub">Video, chat & physical sessions</p></div>
//         <button className="btn-teal" onClick={() => setAdd(true)}>+ Schedule</button>
//       </div>
 
//       {/* Stats */}
//       <div className="stats-row" style={{gridTemplateColumns:"repeat(4,1fr)",marginBottom:16}}>
//         {[
//           {label:"Total",     value:items.length,                                    c:"#1e88e5"},
//           {label:"Scheduled", value:items.filter(i=>i.status==="scheduled").length,  c:"#fbbf24"},
//           {label:"Video",     value:items.filter(i=>i.type==="video").length,        c:"#00bfa5"},
//           {label:"Completed", value:items.filter(i=>i.status==="completed").length,  c:"#22c55e"},
//         ].map(s => (
//           <div key={s.label} className="stat-card" style={{"--accent":s.c}}>
//             <div className="stat-body"><div className="stat-label">{s.label}</div><div className="stat-value">{s.value}</div></div>
//           </div>
//         ))}
//       </div>
 
//       <div className="card">
//         <div className="tbl-wrap">
//           <table className="s-table">
//             <thead><tr><th>Patient</th><th>Type</th><th>Mode</th><th>Date</th><th>Time</th><th>Status</th><th>Action</th></tr></thead>
//             <tbody>
//               {items.length===0 && <tr><td colSpan={7} style={{textAlign:"center",padding:32,color:"var(--muted)"}}>No consultations yet.</td></tr>}
//               {items.map(c => (
//                 <tr key={c.id}>
//                   <td><div style={{display:"flex",alignItems:"center",gap:8}}><Av name={c.patientName} size={26}/>{c.patientName}</div></td>
//                   <td>
//                     <span style={{display:"flex",alignItems:"center",gap:5,fontWeight:700,color:typeColor[c.type]||"#64748b"}}>
//                       {typeIcon[c.type]||"📋"} {c.type}
//                     </span>
//                   </td>
//                   <td><Badge label={c.mode} color={c.mode==="online"?"#1e88e5":"#ff7043"}/></td>
//                   <td>{c.date}</td>
//                   <td>{c.time}</td>
//                   <td><Badge label={c.status}/></td>
//                   <td>
//                     {c.status === "scheduled" && (
//                       <button
//                         className="btn-teal"
//                         style={{ padding:"6px 14px", fontSize:12, background: c.type==="video" ? "linear-gradient(135deg,#00bfa5,#0891b2)" : undefined }}
//                         onClick={() => onStartCall(c)}>
//                         {c.type==="video" ? "📹 Join Video" : c.type==="chat" ? "💬 Chat" : "🏥 Start"}
//                       </button>
//                     )}
//                     {c.status === "completed" && <Badge label="Done" color="#22c55e"/>}
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </div>
 
//       {addOpen && (
//         <Modal title="Schedule Consultation" onClose={() => setAdd(false)}>
//           <FRow label="Patient *">
//             <select style={inp} value={form.patientId} onChange={e => setForm(f=>({...f,patientId:e.target.value}))}>
//               <option value="">Select patient…</option>
//               {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
//             </select>
//           </FRow>
//           <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
//             <FRow label="Session Type">
//               <select style={inp} value={form.type} onChange={e => setForm(f=>({...f,type:e.target.value}))}>
//                 <option value="video">📹 Video Call</option>
//                 <option value="chat">💬 Chat</option>
//                 <option value="physical">🏥 Physical</option>
//               </select>
//             </FRow>
//             <FRow label="Mode">
//               <select style={inp} value={form.mode} onChange={e => setForm(f=>({...f,mode:e.target.value}))}>
//                 <option value="online">🌐 Online</option>
//                 <option value="in-clinic">🏥 In-Clinic</option>
//               </select>
//             </FRow>
//           </div>
//           {form.type === "video" && (
//             <div style={{background:"rgba(0,191,165,.07)",border:"1px solid rgba(0,191,165,.2)",borderRadius:10,padding:"10px 14px",fontSize:13,color:"#00897b",marginBottom:12}}>
//               📹 A video room will be created. The patient will receive a "Join Video" button in their Consultations tab.
//             </div>
//           )}
//           <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
//             <FRow label="Date *"><input style={inp} type="date" value={form.date} onChange={e => setForm(f=>({...f,date:e.target.value}))}/></FRow>
//             <FRow label="Time">
//               <select style={inp} value={form.time} onChange={e => setForm(f=>({...f,time:e.target.value}))}>
//                 {["09:00","10:00","11:00","13:00","14:00","15:00","16:00"].map(t => <option key={t} value={t}>{t}</option>)}
//               </select>
//             </FRow>
//           </div>
//           <FRow label="Notes"><textarea style={{...inp,height:72,resize:"vertical"}} value={form.notes} onChange={e => setForm(f=>({...f,notes:e.target.value}))}/></FRow>
//           <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
//             <button className="ghost-btn" onClick={() => setAdd(false)}>Cancel</button>
//             <button className="btn-teal" onClick={create}>Schedule</button>
//           </div>
//         </Modal>
//       )}
//     </div>
//   );
// }

// /* ─── Consultation Room ────────────────────────────────────────── */
// function ConsultRoom({ consultation, doctor, onClose }) {
//   const [messages, setMessages] = useState([
//     { id:1, from:"system", text:`Session started — Patient: ${consultation.patientName} · ${consultation.type} · ${consultation.mode}`, time:new Date().toLocaleTimeString() }
//   ]);
//   const [input, setInput] = useState("");
//   const [muted, setMuted] = useState(false);
//   const [camOff, setCamOff] = useState(false);
//   const endRef = useRef(null);
//   const isVideo = consultation.type==="video";
//   const isPhys  = consultation.type==="physical";

//   useEffect(()=>{ endRef.current?.scrollIntoView({behavior:"smooth"}); },[messages]);

//   const send = () => {
//     if (!input.trim()) return;
//     setMessages(m=>[...m,{id:Date.now(),from:"doctor",text:input,time:new Date().toLocaleTimeString()}]);
//     setInput("");
//     if (!isPhys) setTimeout(()=>{
//       const replies = ["I understand, Doctor.","Thank you for explaining that.","Should I take this medication before meals?","How many days until my next visit?"];
//       setMessages(m=>[...m,{id:Date.now()+1,from:"patient",text:replies[Math.floor(Math.random()*replies.length)],time:new Date().toLocaleTimeString()}]);
//     },1400);
//   };

//   return (
//     <div className="consult-room page-anim">
//       <div className="consult-header">
//         <div style={{display:"flex",alignItems:"center",gap:12}}>
//           <div style={{display:"flex",alignItems:"center",gap:6,background:"rgba(239,68,68,.15)",border:"1px solid rgba(239,68,68,.3)",borderRadius:20,padding:"4px 12px"}}>
//             <div style={{width:8,height:8,borderRadius:"50%",background:"#ef4444",animation:"pulse 1s infinite"}}/>
//             <span style={{fontSize:12,fontWeight:700,color:"#ef4444"}}>{isVideo?"LIVE VIDEO":isPhys?"PHYSICAL SESSION":"LIVE CHAT"}</span>
//           </div>
//           <Av name={consultation.patientName} size={32}/>
//           <span style={{fontWeight:700,color:"#fff"}}>{consultation.patientName}</span>
//         </div>
//         <button style={{background:"#ef4444",color:"#fff",border:"none",borderRadius:10,padding:"8px 18px",cursor:"pointer",fontWeight:700,fontFamily:"inherit"}} onClick={onClose}>
//           End Session
//         </button>
//       </div>

//       <div className="consult-body">
//         {isVideo && (
//           <div className="video-area">
//             <div className="video-main">
//               {camOff
//                 ? <div style={{textAlign:"center"}}><div style={{fontSize:48}}>📷</div><p style={{color:"rgba(255,255,255,.5)",marginTop:8}}>Camera off</p></div>
//                 : <><div style={{fontSize:64,marginBottom:12}}>🎥</div><p style={{color:"rgba(255,255,255,.6)"}}>Patient camera (simulated)</p></>}
//               <div className="video-self">{muted?"🔇":"🩺"}</div>
//             </div>
//             <div className="video-controls">
//               <button className="vid-btn" style={{background:muted?"rgba(239,68,68,.3)":"rgba(255,255,255,.1)"}} onClick={()=>setMuted(m=>!m)}>{muted?"🔇":"🎤"}</button>
//               <button className="vid-btn" style={{background:camOff?"rgba(239,68,68,.3)":"rgba(255,255,255,.1)"}} onClick={()=>setCamOff(c=>!c)}>{camOff?"📷":"📸"}</button>
//               <button className="vid-btn" style={{background:"rgba(255,255,255,.1)"}}>🖥️</button>
//             </div>
//           </div>
//         )}

//         <div className="chat-area" style={{flex:isVideo?1:1,maxWidth:isVideo?"none":"100%"}}>
//           <div style={{padding:"10px 14px",borderBottom:"1px solid rgba(255,255,255,.1)",display:"flex",alignItems:"center",gap:10}}>
//             <Av name={consultation.patientName} size={28}/>
//             <span style={{fontWeight:600,color:"#fff",fontSize:14}}>{isPhys?"Physical Session Notes":"Session Chat"}</span>
//           </div>
//           <div className="chat-messages" style={{flex:1,overflow:"auto",padding:14,display:"flex",flexDirection:"column",gap:10}}>
//             {messages.map(m=>(
//               <div key={m.id}>
//                 {m.from==="system"
//                   ? <div style={{textAlign:"center",fontSize:12,color:"rgba(255,255,255,.4)",background:"rgba(255,255,255,.05)",borderRadius:8,padding:"6px 12px"}}>{m.text}</div>
//                   : <div style={{display:"flex",flexDirection:"column",alignItems:m.from==="doctor"?"flex-end":"flex-start"}}>
//                       <div style={{background:m.from==="doctor"?"#00bfa5":"rgba(255,255,255,.12)",color:"#fff",borderRadius:12,padding:"9px 14px",maxWidth:"75%",fontSize:14,lineHeight:1.5}}>{m.text}</div>
//                       <div style={{fontSize:11,color:"rgba(255,255,255,.4)",marginTop:3}}>{m.from==="doctor"?"You":consultation.patientName} · {m.time}</div>
//                     </div>
//                 }
//               </div>
//             ))}
//             <div ref={endRef}/>
//           </div>
//           <div style={{padding:"10px 14px",borderTop:"1px solid rgba(255,255,255,.1)",display:"flex",gap:8}}>
//             <input style={{...inp,background:"rgba(255,255,255,.08)",border:"1px solid rgba(255,255,255,.15)",color:"#fff",flex:1}} placeholder={isPhys?"Add session notes…":"Type a message…"}
//               value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()}/>
//             <button className="btn-teal" style={{padding:"9px 16px"}} onClick={send}>Send</button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// /* ═══════════════════════════════════════════════════════════════
//    PRESCRIPTIONS
// ═══════════════════════════════════════════════════════════════ */
// function DocPrescriptions({ doctorId, doctor, toast }) {
//   const [items, setItems] = useState([]);
//   const [modal, setModal] = useState(false);
//   const patients = patientDB.all();
//   const blank = { patientId:"", medication:"", dosage:"", duration:"", notes:"" };
//   const [form, setForm] = useState(blank);
//   const refresh = () => setItems(prescrDB.forDoctor(doctorId));
//   useEffect(()=>refresh(),[doctorId]);

//   const submit = () => {
//     if (!form.patientId||!form.medication) { toast("Fill required fields","error"); return; }
//     const p = patients.find(x=>x.id===form.patientId);
//     prescrDB.add({ ...form, id:uid(), doctorId, doctorName:doctor.name, patientName:p?.name, date:todayStr(), createdAt:now() });
//     pushNotif(p?.id,"prescription",`New Prescription from Dr. ${doctor.name}`,`Medication: ${form.medication} · ${form.dosage} for ${form.duration}.`);
//     pushNotif("admin","prescription","Prescription Issued",`${doctor.name} prescribed ${form.medication} to ${p?.name}.`);
//     toast("Prescription issued!"); setForm(blank); setModal(false); refresh();
//   };

//   return (
//     <div className="page-anim">
//       <div className="page-header">
//         <div><h1 className="page-title">Prescriptions</h1><p className="page-sub">{items.length} issued</p></div>
//         <button className="btn-teal" onClick={()=>setModal(true)}>+ New Prescription</button>
//       </div>
//       <div className="card">
//         <div className="tbl-wrap">
//           <table className="s-table">
//             <thead><tr><th>Patient</th><th>Medication</th><th>Dosage</th><th>Duration</th><th>Notes</th><th>Date</th></tr></thead>
//             <tbody>
//               {items.length===0&&<tr><td colSpan={6} style={{textAlign:"center",padding:32,color:"var(--muted)"}}>No prescriptions yet.</td></tr>}
//               {items.map(p=>(
//                 <tr key={p.id}>
//                   <td><div style={{display:"flex",alignItems:"center",gap:8}}><Av name={p.patientName} size={26}/>{p.patientName}</div></td>
//                   <td style={{fontWeight:700}}>{p.medication}</td>
//                   <td>{p.dosage}</td><td>{p.duration}</td>
//                   <td style={{color:"var(--muted)",fontSize:12}}>{p.notes||"—"}</td><td>{p.date}</td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </div>
//       {modal&&(
//         <Modal title="New Prescription" onClose={()=>setModal(false)}>
//           <FRow label="Patient *">
//             <select style={inp} value={form.patientId} onChange={e=>setForm(f=>({...f,patientId:e.target.value}))}>
//               <option value="">Select patient…</option>
//               {patients.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
//             </select>
//           </FRow>
//           <FRow label="Medication *"><input style={inp} placeholder="e.g. Amoxicillin 500mg" value={form.medication} onChange={e=>setForm(f=>({...f,medication:e.target.value}))}/></FRow>
//           <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
//             <FRow label="Dosage"><input style={inp} placeholder="e.g. 3×/day" value={form.dosage} onChange={e=>setForm(f=>({...f,dosage:e.target.value}))}/></FRow>
//             <FRow label="Duration"><input style={inp} placeholder="e.g. 7 days" value={form.duration} onChange={e=>setForm(f=>({...f,duration:e.target.value}))}/></FRow>
//           </div>
//           <FRow label="Notes"><textarea style={{...inp,height:72,resize:"vertical"}} value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))}/></FRow>
//           <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
//             <button className="ghost-btn" onClick={()=>setModal(false)}>Cancel</button>
//             <button className="btn-teal" onClick={submit}>Issue Prescription</button>
//           </div>
//         </Modal>
//       )}
//     </div>
//   );
// }

// /* ═══════════════════════════════════════════════════════════════
//    MEDICAL RECORDS
// ═══════════════════════════════════════════════════════════════ */
// function DocRecords({ doctorId, doctor, toast }) {
//   const patients = patientDB.all();
//   const [selPat, setSelPat] = useState("");
//   const [records, setRecords] = useState([]);
//   const [modal, setModal] = useState(false);
//   const blank = { title:"", type:"procedure", description:"" };
//   const [form, setForm] = useState(blank);
//   const TYPES = ["procedure","imaging","lab","prescription","note","diagnosis"];

//   const refresh = () => { if (selPat) setRecords(recordDB.forPatient(selPat)); };
//   useEffect(()=>refresh(),[selPat]);

//   const submit = () => {
//     if (!selPat||!form.title) { toast("Select a patient and fill the title","error"); return; }
//     const p = patients.find(x=>x.id===selPat);
//     recordDB.add({ ...form, id:uid(), patientId:selPat, patientName:p?.name, doctorId, doctorName:doctor.name, date:todayStr(), createdAt:now() });
//     pushNotif(p?.id,"record","New Medical Record",`Dr. ${doctor.name} added: ${form.title}.`);
//     toast("Record saved!"); setForm(blank); setModal(false); refresh();
//   };

//   return (
//     <div className="page-anim">
//       <div className="page-header">
//         <div><h1 className="page-title">Medical Records</h1></div>
//         <button className="btn-teal" onClick={()=>setModal(true)} style={{opacity:selPat?1:.5}}>+ Add Record</button>
//       </div>
//       <div className="card" style={{marginBottom:16}}>
//         <FRow label="Select Patient">
//           <select style={{...inp,maxWidth:320}} value={selPat} onChange={e=>setSelPat(e.target.value)}>
//             <option value="">Choose a patient…</option>
//             {patients.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
//           </select>
//         </FRow>
//       </div>
//       {selPat&&(
//         <div className="card">
//           {records.length===0
//             ? <div className="empty-state"><span style={{fontSize:40}}>📋</span><p>No records for this patient.</p></div>
//             : records.map(r=>(
//               <div key={r.id} style={{padding:"14px 0",borderBottom:"1px solid var(--border)"}}>
//                 <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:8}}>
//                   <div>
//                     <div style={{fontWeight:700,fontSize:15}}>{r.title}</div>
//                     <div style={{fontSize:13,color:"var(--muted)",marginTop:4,lineHeight:1.5}}>{r.description}</div>
//                   </div>
//                   <div style={{display:"flex",gap:8,flexShrink:0}}>
//                     <Badge label={r.type} color="#1e88e5"/>
//                     <span style={{fontSize:12,color:"var(--muted)"}}>{r.date}</span>
//                   </div>
//                 </div>
//               </div>
//             ))
//           }
//         </div>
//       )}
//       {modal&&(
//         <Modal title="Add Medical Record" onClose={()=>setModal(false)}>
//           <FRow label="Title *"><input style={inp} placeholder="Record title" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))}/></FRow>
//           <FRow label="Type">
//             <select style={inp} value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}>
//               {TYPES.map(t=><option key={t} value={t}>{t}</option>)}
//             </select>
//           </FRow>
//           <FRow label="Description"><textarea style={{...inp,height:90,resize:"vertical"}} value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}/></FRow>
//           <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
//             <button className="ghost-btn" onClick={()=>setModal(false)}>Cancel</button>
//             <button className="btn-teal" onClick={submit}>Save Record</button>
//           </div>
//         </Modal>
//       )}
//     </div>
//   );
// }

// /* ═══════════════════════════════════════════════════════════════
//    HOME VISITS
// ═══════════════════════════════════════════════════════════════ */
// // function DocHomeVisits({ doctorId, doctor, toast }) {
// //   const [items, setItems] = useState([]);
// //   const patients = patientDB.all();
// //   const [addOpen, setAdd] = useState(false);
// //   const blank = { patientId:"", address:"", date:"", time:"09:00", service:"", notes:"" };
// //   const [form, setForm] = useState(blank);
// //   const refresh = () => setItems(homeVisitDB.forDoctor(doctorId));
// //   useEffect(()=>refresh(),[doctorId]);

// //   const create = () => {
// //     if (!form.patientId||!form.date||!form.address) { toast("Fill required fields","error"); return; }
// //     const p = patients.find(x=>x.id===form.patientId);
// //     homeVisitDB.add({ ...form, id:uid(), doctorId, doctorName:doctor.name, patientName:p?.name, status:"scheduled", createdAt:now() });
// //     pushNotif(p?.id,"home_visit","Home Visit Scheduled",`Dr. ${doctor.name} will visit you on ${form.date} at ${form.time}.`);
// //     pushNotif("admin","home_visit","Home Visit Scheduled",`${doctor.name} → ${p?.name} on ${form.date}.`);
// //     toast("Home visit scheduled!"); setForm(blank); setAdd(false); refresh();
// //   };

// //   const updateStatus = (id, status, patientId) => {
// //     homeVisitDB.update(id,{status});
// //     pushNotif(patientId,"home_visit","Visit Status Update",`Your home visit is now ${status}.`);
// //     toast(`Visit ${status}`); refresh();
// //   };

// //   return (
// //     <div className="page-anim">
// //       <div className="page-header">
// //         <div><h1 className="page-title">Home Visits</h1><p className="page-sub">Scheduled home service visits</p></div>
// //         <button className="btn-teal" onClick={()=>setAdd(true)}>+ Schedule Visit</button>
// //       </div>
// //       <div style={{display:"flex",flexDirection:"column",gap:14}}>
// //         {items.length===0&&<div className="card"><div className="empty-state"><span style={{fontSize:40}}>🏠</span><p>No home visits scheduled.</p></div></div>}
// //         {items.map(r=>(
// //           <div key={r.id} className="card">
// //             <div style={{display:"flex",alignItems:"flex-start",gap:16,flexWrap:"wrap"}}>
// //               <div style={{flex:1}}>
// //                 <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
// //                   <Av name={r.patientName} size={44}/>
// //                   <div>
// //                     <div style={{fontFamily:"'Sora',sans-serif",fontWeight:700,fontSize:16}}>{r.patientName}</div>
// //                     <div style={{fontSize:13,color:"var(--muted)"}}>{r.service||"Home Visit"}</div>
// //                   </div>
// //                 </div>
// //                 <div style={{display:"flex",gap:16,fontSize:13,color:"var(--muted)",flexWrap:"wrap"}}>
// //                   <span>📍 {r.address}</span>
// //                   <span>📅 {r.date} at {r.time}</span>
// //                 </div>
// //                 {r.notes&&<p style={{fontSize:13,color:"var(--muted)",marginTop:8}}>{r.notes}</p>}
// //               </div>
// //               <div style={{display:"flex",flexDirection:"column",gap:8,alignItems:"flex-end"}}>
// //                 <Badge label={r.status}/>
// //                 {r.status==="scheduled"&&(
// //                   <button className="btn-teal" style={{fontSize:12,padding:"6px 14px"}} onClick={()=>updateStatus(r.id,"completed",r.patientId)}>
// //                     Mark Completed
// //                   </button>
// //                 )}
// //               </div>
// //             </div>
// //           </div>
// //         ))}
// //       </div>
// //       {addOpen&&(
// //         <Modal title="Schedule Home Visit" onClose={()=>setAdd(false)}>
// //           <FRow label="Patient *">
// //             <select style={inp} value={form.patientId} onChange={e=>setForm(f=>({...f,patientId:e.target.value}))}>
// //               <option value="">Select patient…</option>
// //               {patients.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
// //             </select>
// //           </FRow>
// //           <FRow label="Address *"><input style={inp} placeholder="Full address" value={form.address} onChange={e=>setForm(f=>({...f,address:e.target.value}))}/></FRow>
// //           <FRow label="Service"><input style={inp} placeholder="e.g. Post-op follow-up" value={form.service} onChange={e=>setForm(f=>({...f,service:e.target.value}))}/></FRow>
// //           <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
// //             <FRow label="Date *"><input style={inp} type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/></FRow>
// //             <FRow label="Time">
// //               <select style={inp} value={form.time} onChange={e=>setForm(f=>({...f,time:e.target.value}))}>
// //                 {["08:00","09:00","10:00","11:00","14:00","15:00","16:00","17:00"].map(t=><option key={t} value={t}>{t}</option>)}
// //               </select>
// //             </FRow>
// //           </div>
// //           <FRow label="Notes"><textarea style={{...inp,height:72,resize:"vertical"}} value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))}/></FRow>
// //           <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
// //             <button className="ghost-btn" onClick={()=>setAdd(false)}>Cancel</button>
// //             <button className="btn-teal" onClick={create}>Schedule Visit</button>
// //           </div>
// //         </Modal>
// //       )}
// //     </div>
// //   );
// // }

// function DocHomeVisits({ doctorId, doctor, toast }) {
//   const [items,   setItems]  = useState([]);
//   const [addOpen, setAdd]    = useState(false);
//   const [mapVisit,setMapV]   = useState(null);
//   const patients = patientDB.all();
//   const blank = { patientId:"", address:"", date:"", time:"09:00", service:"", notes:"" };
//   const [form, setForm] = useState(blank);
//   const refresh = () => setItems(homeVisitDB.forDoctor(doctorId));
//   useEffect(() => refresh(), [doctorId]);
 
//   const create = () => {
//     if (!form.patientId || !form.date || !form.address) { toast("Fill required fields","error"); return; }
//     const p = patients.find(x => x.id === form.patientId);
//     homeVisitDB.add({ ...form, id:uid(), doctorId, doctorName:doctor.name, patientName:p?.name, status:"scheduled", createdAt:now() });
//     pushNotif(p?.id, "home_visit", "🏠 Home Visit Scheduled",
//       `Dr. ${doctor.name} will visit you on ${form.date} at ${form.time}.`);
//     pushNotif("admin","home_visit","Home Visit Scheduled",`${doctor.name} → ${p?.name} on ${form.date}.`);
//     toast("Home visit scheduled!"); setForm(blank); setAdd(false); refresh();
//   };
 
//   const updateStatus = (id, status, patientId) => {
//     homeVisitDB.update(id, { status });
//     pushNotif(patientId, "home_visit", "🏠 Visit Status Update",
//       status === "accepted"
//         ? `Dr. ${doctor.name} accepted your home visit request! Live tracking is now active.`
//         : `Your home visit status has been updated to: ${status}.`);
//     if (status === "accepted") toast("Visit accepted — patient can now track you live! 📍");
//     else toast(`Visit ${status}`);
//     refresh();
//   };
 
//   if (mapVisit) return (
//     <div className="page-anim">
//       <div className="page-header">
//         <div><h1 className="page-title">📍 Live Route</h1><p className="page-sub">Tracking to {mapVisit.patientName}</p></div>
//         <button className="ghost-btn" onClick={() => setMapV(null)}>← Back</button>
//       </div>
//       <div className="card">
//         <div style={{marginBottom:14,display:"flex",alignItems:"center",gap:12}}>
//           <Av name={mapVisit.patientName} size={44}/>
//           <div>
//             <div style={{fontWeight:700,fontSize:16}}>{mapVisit.patientName}</div>
//             <div style={{fontSize:13,color:"var(--muted)"}}>📍 {mapVisit.address}</div>
//             <div style={{fontSize:13,color:"var(--muted)"}}>📅 {mapVisit.date}{mapVisit.time&&` at ${mapVisit.time}`}</div>
//           </div>
//           <div style={{marginLeft:"auto"}}>
//             <Badge label={mapVisit.status} color="#22c55e"/>
//           </div>
//         </div>
//         <LiveMap visit={mapVisit} role="doctor"/>
//         <div style={{marginTop:14,display:"flex",gap:10,justifyContent:"flex-end"}}>
//           <button className="btn-teal" style={{background:"#16a34a"}} onClick={() => { updateStatus(mapVisit.id,"completed",mapVisit.patientId); setMapV(null); }}>
//             ✅ Mark Completed
//           </button>
//         </div>
//       </div>
//     </div>
//   );
 
//   return (
//     <div className="page-anim">
//       <div className="page-header">
//         <div><h1 className="page-title">Home Visits</h1><p className="page-sub">Scheduled home service visits</p></div>
//         <button className="btn-teal" onClick={() => setAdd(true)}>+ Schedule Visit</button>
//       </div>
 
//       <div style={{display:"flex",flexDirection:"column",gap:14}}>
//         {items.length === 0 && (
//           <div className="card"><div className="empty-state"><span style={{fontSize:40}}>🏠</span><p>No home visits scheduled.</p></div></div>
//         )}
//         {items.map(r => (
//           <div key={r.id} className="card">
//             <div style={{display:"flex",alignItems:"flex-start",gap:16,flexWrap:"wrap"}}>
//               <div style={{flex:1}}>
//                 <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
//                   <Av name={r.patientName} size={44}/>
//                   <div>
//                     <div style={{fontFamily:"'Sora',sans-serif",fontWeight:700,fontSize:16}}>{r.patientName}</div>
//                     <div style={{fontSize:13,color:"var(--muted)"}}>{r.service||"Home Visit"}</div>
//                   </div>
//                 </div>
//                 <div style={{display:"flex",gap:16,fontSize:13,color:"var(--muted)",flexWrap:"wrap"}}>
//                   <span>📍 {r.address}</span>
//                   <span>📅 {r.date}{r.time&&` at ${r.time}`}</span>
//                 </div>
//                 {r.notes && <p style={{fontSize:13,color:"var(--muted)",marginTop:8}}>{r.notes}</p>}
//               </div>
//               <div style={{display:"flex",flexDirection:"column",gap:8,alignItems:"flex-end",flexShrink:0}}>
//                 <Badge label={r.status}/>
//                 <div style={{display:"flex",gap:6,flexWrap:"wrap",justifyContent:"flex-end"}}>
//                   {r.status === "pending" && (
//                     <>
//                       <button className="ghost-btn green-btn" onClick={() => updateStatus(r.id,"accepted",r.patientId)}>✓ Accept</button>
//                       <button className="ghost-btn" style={{color:"var(--red)"}} onClick={() => updateStatus(r.id,"declined",r.patientId)}>✗ Decline</button>
//                     </>
//                   )}
//                   {r.status === "accepted" && (
//                     <>
//                       <button className="btn-teal" style={{padding:"6px 14px",fontSize:12}} onClick={() => setMapV(r)}>
//                         🗺️ Open Map
//                       </button>
//                       <button className="ghost-btn" style={{color:"#22c55e"}} onClick={() => updateStatus(r.id,"completed",r.patientId)}>
//                         ✅ Complete
//                       </button>
//                     </>
//                   )}
//                   {r.status === "scheduled" && (
//                     <button className="ghost-btn green-btn" onClick={() => updateStatus(r.id,"accepted",r.patientId)}>Start Visit</button>
//                   )}
//                 </div>
//               </div>
//             </div>
 
//             {/* Inline map for accepted visits */}
//             {r.status === "accepted" && (
//               <div style={{marginTop:16,borderTop:"1px solid var(--border)",paddingTop:14}}>
//                 <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
//                   <span style={{fontWeight:700,fontSize:13,color:"#00897b"}}>📍 Live Route to Patient</span>
//                   <span style={{fontSize:12,color:"var(--muted)"}}>Patient can see you on their map</span>
//                 </div>
//                 <LiveMap visit={r} role="doctor"/>
//               </div>
//             )}
//           </div>
//         ))}
//       </div>
 
//       {addOpen && (
//         <Modal title="Schedule Home Visit" onClose={() => setAdd(false)}>
//           <FRow label="Patient *">
//             <select style={inp} value={form.patientId} onChange={e => setForm(f=>({...f,patientId:e.target.value}))}>
//               <option value="">Select patient…</option>
//               {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
//             </select>
//           </FRow>
//           <FRow label="Address *"><input style={inp} placeholder="Full patient address" value={form.address} onChange={e => setForm(f=>({...f,address:e.target.value}))}/></FRow>
//           <FRow label="Service"><input style={inp} placeholder="e.g. Post-op follow-up" value={form.service} onChange={e => setForm(f=>({...f,service:e.target.value}))}/></FRow>
//           <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
//             <FRow label="Date *"><input style={inp} type="date" value={form.date} onChange={e => setForm(f=>({...f,date:e.target.value}))}/></FRow>
//             <FRow label="Time">
//               <select style={inp} value={form.time} onChange={e => setForm(f=>({...f,time:e.target.value}))}>
//                 {["08:00","09:00","10:00","11:00","14:00","15:00","16:00","17:00"].map(t => <option key={t} value={t}>{t}</option>)}
//               </select>
//             </FRow>
//           </div>
//           <FRow label="Notes"><textarea style={{...inp,height:72,resize:"vertical"}} value={form.notes} onChange={e => setForm(f=>({...f,notes:e.target.value}))}/></FRow>
//           <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
//             <button className="ghost-btn" onClick={() => setAdd(false)}>Cancel</button>
//             <button className="btn-teal" onClick={create}>Schedule Visit</button>
//           </div>
//         </Modal>
//       )}
//     </div>
//   );
// }

// /* ═══════════════════════════════════════════════════════════════
//    SCHEDULE (availability)
// ═══════════════════════════════════════════════════════════════ */
// function DocSchedule({ doctorId, toast }) {
//   const appts = apptDB.forDoctor(doctorId).filter(a=>a.status!=="cancelled");
//   const [avail, setAvail] = useState(STORAGE.get(`doc_avail_${doctorId}`,{
//     Monday:true,Tuesday:true,Wednesday:true,Thursday:true,Friday:true,Saturday:false,Sunday:false
//   }));
//   const grouped = appts.reduce((acc,a)=>{ (acc[a.date]=acc[a.date]||[]).push(a); return acc; },{});
//   const days = Object.keys(grouped).sort();
//   const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

//   const toggleDay = (d) => {
//     const next = {...avail,[d]:!avail[d]};
//     setAvail(next); STORAGE.set(`doc_avail_${doctorId}`,next);
//     toast(`${d} ${next[d]?"available":"unavailable"}`);
//     pushNotif("admin","schedule","Doctor Availability Updated",`Dr. schedule updated.`);
//   };

//   return (
//     <div className="page-anim">
//       <div className="page-header"><div><h1 className="page-title">My Schedule</h1><p className="page-sub">Manage availability & view bookings</p></div></div>

//       {/* Availability */}
//       <div className="card" style={{marginBottom:20}}>
//         <div className="card-title" style={{marginBottom:16}}>Weekly Availability</div>
//         <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
//           {DAYS.map(d=>(
//             <button key={d} onClick={()=>toggleDay(d)}
//               style={{ padding:"10px 18px", borderRadius:12, border:`2px solid ${avail[d]?"#00bfa5":"var(--border)"}`,
//                 background:avail[d]?"rgba(0,191,165,.1)":"var(--bg)", color:avail[d]?"#00bfa5":"var(--muted)",
//                 fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"inherit", transition:"all .2s" }}>
//               {avail[d]?"✓ ":""}{d.slice(0,3)}
//             </button>
//           ))}
//         </div>
//         <p style={{fontSize:12,color:"var(--muted)",marginTop:12}}>Patients can only book on available days.</p>
//       </div>

//       {/* Appointment calendar */}
//       {days.length===0
//         ? <div className="card"><div className="empty-state"><span style={{fontSize:40}}>🗓️</span><p>No scheduled appointments.</p></div></div>
//         : days.map(day=>(
//           <div key={day} style={{marginBottom:14}}>
//             <div style={{fontFamily:"'Sora',sans-serif",fontWeight:700,fontSize:13,color:"var(--muted)",marginBottom:6,textTransform:"uppercase",letterSpacing:.5}}>{day} · {grouped[day].length} appt{grouped[day].length>1?"s":""}</div>
//             <div className="card" style={{padding:"8px 0"}}>
//               {grouped[day].sort((a,b)=>a.time.localeCompare(b.time)).map(a=>(
//                 <div key={a.id} className="appt-row">
//                   <span className="appt-time">{a.time}</span>
//                   <Av name={a.patientName} size={34}/>
//                   <div style={{flex:1}}>
//                     <div style={{fontWeight:700,fontSize:13}}>{a.patientName}</div>
//                     <div style={{fontSize:12,color:"var(--muted)"}}>{a.healthType}</div>
//                   </div>
//                   <Badge label={a.status}/>
//                 </div>
//               ))}
//             </div>
//           </div>
//         ))
//       }
//     </div>
//   );
// }

// /* ═══════════════════════════════════════════════════════════════
//    MESSAGES  (admin + patients threads)
// ═══════════════════════════════════════════════════════════════ */
// // function DocMessages({ doctorId, doctor, toast, refreshBadges }) {
// //   const patients = patientDB.all();
// //   const contacts = [{ id:"admin", name:"Administrator", role:"Admin" }, ...patients.map(p=>({...p,role:"Patient"}))];
// //   const [selId, setSelId] = useState("admin");
// //   const [msgs, setMsgs]   = useState([]);
// //   const [input, setInput] = useState("");
// //   const endRef = useRef(null);

// //   const loadMsgs = () => {
// //     const all = msgDB.all();
// //     const thread = all.filter(m =>
// //       (m.fromId===doctorId&&m.toId===selId) ||
// //       (m.fromId===selId&&m.toId===doctorId)
// //     ).sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt));
// //     // also include broadcast messages from admin
// //     const broadcasts = all.filter(m =>
// //       m.fromId==="admin" && (m.toId===doctorId||m.toId==="all_doctors"||m.toId==="all")
// //     );
// //     const combined = selId==="admin" ? [...thread, ...broadcasts].filter((v,i,a)=>a.findIndex(x=>x.id===v.id)===i).sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt)) : thread;
// //     setMsgs(combined);
// //     // mark read
// //     msgDB.all().filter(m=>m.toId===doctorId&&!m.read).forEach(m=>msgDB.update(m.id,{read:true}));
// //     refreshBadges();
// //   };

// //   useEffect(()=>{ loadMsgs(); },[selId, doctorId]);
// //   useEffect(()=>{ endRef.current?.scrollIntoView({behavior:"smooth"}); },[msgs]);

// //   const unreadCount = (cid) => msgDB.all().filter(m=>(m.toId===doctorId||(cid==="admin"&&(m.toId==="all_doctors"||m.toId==="all")))&&m.fromId===cid&&!m.read).length;

// //   const send = () => {
// //     if (!input.trim()||!selId) return;
// //     const sel = contacts.find(c=>c.id===selId);
// //     msgDB.add({ id:uid(), fromId:doctorId, fromName:doctor.name, toId:selId, toName:sel?.name, body:input.trim(), read:false, createdAt:now() });
// //     pushNotif(selId,"message",`Message from Dr. ${doctor.name}`,input.trim());
// //     setInput(""); loadMsgs();
// //     toast(`Message sent to ${sel?.name}`);
// //   };

// //   const selContact = contacts.find(c=>c.id===selId);

// //   return (
// //     <div className="page-anim">
// //       <div className="page-header"><div><h1 className="page-title">Messages</h1><p className="page-sub">Chat with admin & patients</p></div></div>
// //       <div className="messages-layout">
// //         {/* Contact list */}
// //         <div className="messages-sidebar card" style={{padding:0,overflow:"hidden"}}>
// //           <div style={{padding:"14px 16px",borderBottom:"1px solid var(--border)",fontFamily:"'Sora',sans-serif",fontWeight:700,fontSize:13}}>Contacts</div>
// //           {contacts.map(c=>{
// //             const unread = unreadCount(c.id);
// //             return (
// //               <div key={c.id} className={`msg-contact${selId===c.id?" active":""}`} onClick={()=>setSelId(c.id)}>
// //                 <Av name={c.name} size={36}/>
// //                 <div style={{flex:1,overflow:"hidden"}}>
// //                   <div style={{fontWeight:700,fontSize:13,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{c.name}</div>
// //                   <div style={{fontSize:11,color:"var(--muted)"}}>{c.role}</div>
// //                 </div>
// //                 {unread>0&&<div style={{width:18,height:18,borderRadius:"50%",background:"#00bfa5",color:"#fff",fontSize:10,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"}}>{unread}</div>}
// //               </div>
// //             );
// //           })}
// //         </div>

// //         {/* Chat window */}
// //         <div className="messages-chat card" style={{display:"flex",flexDirection:"column",padding:0,overflow:"hidden"}}>
// //           {selContact ? (
// //             <>
// //               <div style={{padding:"14px 18px",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",gap:10}}>
// //                 <Av name={selContact.name} size={36}/>
// //                 <div>
// //                   <div style={{fontWeight:700,fontSize:14}}>{selContact.name}</div>
// //                   <div style={{fontSize:12,color:"var(--muted)"}}>{selContact.role}</div>
// //                 </div>
// //               </div>
// //               <div style={{flex:1,overflow:"auto",padding:16,display:"flex",flexDirection:"column",gap:10}}>
// //                 {msgs.length===0&&<div className="empty-state"><span style={{fontSize:32}}>💬</span><p>No messages yet.</p></div>}
// //                 {msgs.map(m=>{
// //                   const isMe = m.fromId===doctorId;
// //                   return (
// //                     <div key={m.id} style={{display:"flex",flexDirection:"column",alignItems:isMe?"flex-end":"flex-start"}}>
// //                       <div style={{background:isMe?"#00bfa5":"var(--bg)",color:isMe?"#fff":"var(--text)",borderRadius:14,padding:"9px 14px",maxWidth:"72%",fontSize:13,lineHeight:1.5,border:"1px solid var(--border)"}}>
// //                         {!isMe&&<div style={{fontSize:11,fontWeight:700,color:"#00bfa5",marginBottom:4}}>{m.fromName}</div>}
// //                         {m.body}
// //                       </div>
// //                       <div style={{fontSize:11,color:"var(--muted)",marginTop:3}}>{new Date(m.createdAt).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}</div>
// //                     </div>
// //                   );
// //                 })}
// //                 <div ref={endRef}/>
// //               </div>
// //               <div style={{padding:"12px 16px",borderTop:"1px solid var(--border)",display:"flex",gap:8}}>
// //                 <input style={{...inp,flex:1}} placeholder="Type a message…" value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()}/>
// //                 <button className="btn-teal" style={{padding:"9px 16px"}} onClick={send}>Send</button>
// //               </div>
// //             </>
// //           ) : <div className="empty-state"><span style={{fontSize:40}}>💬</span><p>Select a contact</p></div>}
// //         </div>
// //       </div>
// //     </div>
// //   );
// // }

// function DocMessages({ doctorId, doctor, toast, refreshBadges }) {
//   const patients = patientDB.all();
//   const contacts = [
//     { id:"admin", name:"Administrator", role:"Admin" },
//     ...patients.map(p => ({...p, role:"Patient"})),
//   ];
//   const [selId,  setSelId]  = useState("admin");
//   const [msgs,   setMsgs]   = useState([]);
//   const [input,  setInput]  = useState("");
//   const [typing, setTyping] = useState(false);
//   const endRef = useRef(null);
 
//   const loadMsgs = useCallback(() => {
//     const all = msgDB.all();
//     const thread = all.filter(m =>
//       (m.fromId===doctorId && m.toId===selId) ||
//       (m.fromId===selId && m.toId===doctorId)
//     ).sort((a,b) => new Date(a.createdAt)-new Date(b.createdAt));
//     const broadcasts = all.filter(m =>
//       m.fromId==="admin" && (m.toId===doctorId||m.toId==="all_doctors"||m.toId==="all")
//     );
//     const combined = selId==="admin"
//       ? [...thread,...broadcasts].filter((v,i,a)=>a.findIndex(x=>x.id===v.id)===i).sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt))
//       : thread;
//     setMsgs(combined);
//     msgDB.all().filter(m=>m.toId===doctorId&&!m.read).forEach(m=>msgDB.update(m.id,{read:true}));
//     refreshBadges();
//   }, [selId, doctorId]);
 
//   useEffect(() => { loadMsgs(); }, [selId, doctorId]);
//   // Fast polling
//   useEffect(() => { const t = setInterval(loadMsgs, 1500); return () => clearInterval(t); }, [loadMsgs]);
//   useEffect(() => { endRef.current?.scrollIntoView({behavior:"smooth"}); }, [msgs]);
 
//   const unreadCount = (cid) => msgDB.all().filter(m =>
//     (m.toId===doctorId||(cid==="admin"&&(m.toId==="all_doctors"||m.toId==="all"))) && m.fromId===cid && !m.read
//   ).length;
 
//   const send = () => {
//     if (!input.trim() || !selId) return;
//     const sel = contacts.find(c => c.id === selId);
//     msgDB.add({ id:uid(), fromId:doctorId, fromName:doctor.name, toId:selId, toName:sel?.name, body:input.trim(), read:false, createdAt:now() });
//     pushNotif(selId, "message", `💬 Message from Dr. ${doctor.name}`, input.trim());
//     setInput(""); loadMsgs();
 
//     // Simulate typing + auto-reply
//     const AUTO_REPLIES = ["Thank you Doctor!", "Understood, I'll follow the advice.", "Should I come in tomorrow?", "The pain is getting better.", "Thanks for checking in."];
//     setTyping(true);
//     setTimeout(() => {
//       msgDB.add({ id:uid(), fromId:selId, fromName:sel?.name||"Patient", toId:doctorId, toName:doctor.name, body:AUTO_REPLIES[Math.floor(Math.random()*AUTO_REPLIES.length)], read:false, createdAt:now() });
//       setTyping(false); loadMsgs();
//     }, 1800 + Math.random() * 1200);
//   };
 
//   const selContact = contacts.find(c => c.id === selId);
 
//   return (
//     <div className="page-anim">
//       <div className="page-header"><div><h1 className="page-title">Messages</h1><p className="page-sub">Chat with admin & patients</p></div></div>
//       <div className="messages-layout">
//         {/* Contact list */}
//         <div className="messages-sidebar card" style={{padding:0,overflow:"hidden"}}>
//           <div style={{padding:"14px 16px",borderBottom:"1px solid var(--border)",fontFamily:"'Sora',sans-serif",fontWeight:700,fontSize:13}}>Contacts</div>
//           {contacts.map(c => {
//             const unread = unreadCount(c.id);
//             return (
//               <div key={c.id} className={`msg-contact${selId===c.id?" active":""}`} onClick={() => setSelId(c.id)}>
//                 <Av name={c.name} size={36}/>
//                 <div style={{flex:1,overflow:"hidden"}}>
//                   <div style={{fontWeight:700,fontSize:13,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{c.name}</div>
//                   <div style={{fontSize:11,color:"var(--muted)"}}>{c.role}</div>
//                 </div>
//                 {unread > 0 && (
//                   <div style={{width:18,height:18,borderRadius:"50%",background:"#00bfa5",color:"#fff",fontSize:10,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
//                     {unread}
//                   </div>
//                 )}
//               </div>
//             );
//           })}
//         </div>
 
//         {/* Chat window */}
//         <div className="messages-chat card" style={{display:"flex",flexDirection:"column",padding:0,overflow:"hidden"}}>
//           {selContact ? (
//             <>
//               <div style={{padding:"14px 18px",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",gap:10}}>
//                 <Av name={selContact.name} size={36}/>
//                 <div>
//                   <div style={{fontWeight:700,fontSize:14}}>{selContact.name}</div>
//                   <div style={{fontSize:12,color:"#00bfa5",display:"flex",alignItems:"center",gap:5}}>
//                     <div style={{width:7,height:7,borderRadius:"50%",background:"#00bfa5",animation:"pulse 2s infinite"}}/>
//                     Online
//                   </div>
//                 </div>
//               </div>
 
//               <div style={{flex:1,overflow:"auto",padding:16,display:"flex",flexDirection:"column",gap:10}}>
//                 {msgs.length===0 && <div className="empty-state"><span style={{fontSize:32}}>💬</span><p>No messages yet.</p></div>}
//                 {msgs.map(m => {
//                   const isMe = m.fromId === doctorId;
//                   return (
//                     <div key={m.id} style={{display:"flex",flexDirection:"column",alignItems:isMe?"flex-end":"flex-start"}}>
//                       <div style={{background:isMe?"#00bfa5":"var(--bg)",color:isMe?"#fff":"var(--text)",borderRadius:14,padding:"9px 14px",maxWidth:"72%",fontSize:13,lineHeight:1.5,border:"1px solid var(--border)"}}>
//                         {!isMe && <div style={{fontSize:11,fontWeight:700,color:"#00bfa5",marginBottom:4}}>{m.fromName}</div>}
//                         {m.body}
//                       </div>
//                       <div style={{fontSize:11,color:"var(--muted)",marginTop:3}}>
//                         {new Date(m.createdAt).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}
//                       </div>
//                     </div>
//                   );
//                 })}
 
//                 {/* Typing indicator */}
//                 {typing && (
//                   <div style={{display:"flex",alignItems:"center",gap:6,color:"var(--muted)",fontSize:12}}>
//                     <div style={{display:"flex",gap:3}}>
//                       {[0,1,2].map(i => <div key={i} style={{width:6,height:6,borderRadius:"50%",background:"#00bfa5",animation:`pulse ${.8+i*.15}s ease-in-out infinite`,animationDelay:`${i*.15}s`}}/>)}
//                     </div>
//                     {selContact.name} is typing…
//                   </div>
//                 )}
//                 <div ref={endRef}/>
//               </div>
 
//               <div style={{padding:"12px 16px",borderTop:"1px solid var(--border)",display:"flex",gap:8}}>
//                 <input style={{...inp,flex:1}} placeholder={`Message ${selContact.name}…`}
//                   value={input} onChange={e => setInput(e.target.value)}
//                   onKeyDown={e => e.key==="Enter" && send()}/>
//                 <button className="btn-teal" style={{padding:"9px 16px"}} onClick={send} disabled={!input.trim()}>Send</button>
//               </div>
//             </>
//           ) : (
//             <div className="empty-state"><span style={{fontSize:40}}>💬</span><p>Select a contact</p></div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

// /* ═══════════════════════════════════════════════════════════════
//    NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════ */
// function DocNotifications({ doctorId, refreshBadges }) {
//   const [items, setItems] = useState([]);
//   const refresh = () => {
//     const all = notifDB.all().filter(n=>n.toId===doctorId||n.toId==="all_doctors"||n.toId==="all").reverse();
//     setItems(all);
//     all.filter(n=>!n.read).forEach(n=>notifDB.update(n.id,{read:true}));
//     refreshBadges();
//   };
//   useEffect(()=>refresh(),[doctorId]);
//   const icons = { appointment:"📅", payment:"💳", message:"💬", prescription:"💊", record:"📋", system:"🔧", consultation:"🎥", home_visit:"🏠" };

//   return (
//     <div className="page-anim">
//       <div className="page-header">
//         <div><h1 className="page-title">Notifications</h1><p className="page-sub">{items.filter(i=>!i.read).length} unread</p></div>
//         <button className="ghost-btn" onClick={()=>{items.forEach(n=>notifDB.update(n.id,{read:true}));refresh();}}>Mark all read</button>
//       </div>
//       <div className="card">
//         {items.length===0&&<div className="empty-state"><span style={{fontSize:40}}>🔔</span><p>No notifications yet.</p></div>}
//         {items.map(n=>(
//           <div key={n.id} className={`notif-item${!n.read?" unread":""}`}>
//             <div style={{fontSize:24,flexShrink:0}}>{icons[n.type]||"🔔"}</div>
//             <div style={{flex:1}}>
//               <div style={{fontWeight:700,fontSize:14}}>{n.title}</div>
//               <div style={{fontSize:13,color:"var(--muted)"}}>{n.body}</div>
//               <div style={{fontSize:11,color:"var(--muted)",marginTop:4}}>{new Date(n.createdAt).toLocaleString()}</div>
//             </div>
//             {!n.read&&<div style={{width:8,height:8,borderRadius:"50%",background:"#00bfa5",flexShrink:0,marginTop:4}}/>}
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

// /* ═══════════════════════════════════════════════════════════════
//    PAYMENTS  (receive & track)
// ═══════════════════════════════════════════════════════════════ */
// function DocPayments({ doctorId, doctor, toast }) {
//   const [items, setItems] = useState([]);
//   const [addOpen, setAdd] = useState(false);
//   const patients = patientDB.all();
//   const forfaits = forfaitDB.all();
//   const blank = { patientId:"", forfaitId:"", service:"", amount:"", method:"Mobile Money", notes:"" };
//   const [form, setForm] = useState(blank);
//   const refresh = () => setItems(payDB.forDoctor(doctorId));
//   useEffect(()=>refresh(),[doctorId]);

//   const revenue = items.filter(p=>p.status==="paid").reduce((s,p)=>s+p.amount,0);
//   const pending = items.filter(p=>p.status==="pending").reduce((s,p)=>s+p.amount,0);
//   const adminCut = items.filter(p=>p.status==="paid").reduce((s,p)=>s+(p.adminCut||0),0);
//   const myNet = revenue - adminCut;

//   const createPayment = () => {
//     if (!form.patientId||!form.amount) { toast("Fill required fields","error"); return; }
//     const p = patients.find(x=>x.id===form.patientId);
//     const f = forfaits.find(x=>x.id===form.forfaitId);
//     const pct = f?.pct || 12;
//     const amt = Number(form.amount);
//     const cut = Math.round(amt * pct / 100);
//     const pay = payDB.add({ id:uid(), patientId:p?.id, patientName:p?.name, doctorId, doctorName:doctor.name,
//       service:form.service||f?.name||"Consultation", amount:amt, currency:"XAF",
//       method:form.method, status:"pending", txRef:`TX-${uid().toUpperCase()}`,
//       date:todayStr(), adminCut:0, forfaitPct:pct, notes:form.notes, createdAt:now() });
//     pushNotif(p?.id,"payment","Payment Request",`Dr. ${doctor.name} sent a payment request for ${amt.toLocaleString()} XAF.`);
//     pushNotif("admin","payment","New Payment Created",`${doctor.name} → ${p?.name} · ${amt.toLocaleString()} XAF.`);
//     toast("Payment request created!"); setForm(blank); setAdd(false); refresh();
//   };

//   const markPaid = (pay) => {
//     payDB.update(pay.id,{status:"paid"});
//     const cut = Math.round(pay.amount*(pay.forfaitPct||12)/100);
//     payDB.update(pay.id,{adminCut:cut});
//     commDB.add({id:uid(),paymentId:pay.id,patientName:pay.patientName,service:pay.service,doctorId,amount:cut,pct:pay.forfaitPct||12,createdAt:now()});
//     pushNotif(pay.patientId,"payment","Payment Confirmed",`Your payment of ${pay.amount.toLocaleString()} XAF to Dr. ${doctor.name} is confirmed.`);
//     pushNotif("admin","payment","Payment Confirmed",`${pay.patientName} paid ${pay.amount.toLocaleString()} XAF to ${doctor.name}.`);
//     toast("Marked as paid + commission logged!"); refresh();
//   };

//   return (
//     <div className="page-anim">
//       <div className="page-header">
//         <div><h1 className="page-title">Payments</h1><p className="page-sub">Financial overview</p></div>
//         <button className="btn-teal" onClick={()=>setAdd(true)}>+ Request Payment</button>
//       </div>

//       <div className="stats-row">
//         {[
//           {label:"Total Billed",  value:`${(revenue/1000).toFixed(1)}K XAF`, icon:"💰", c:"#00bfa5"},
//           {label:"My Net Earnings",value:`${(myNet/1000).toFixed(1)}K XAF`, icon:"💵", c:"#22c55e"},
//           {label:"Admin Commission",value:`${(adminCut/1000).toFixed(1)}K XAF`,icon:"📊",c:"#7c3aed"},
//           {label:"Pending",       value:`${(pending/1000).toFixed(1)}K XAF`, icon:"⏳", c:"#fbbf24"},
//         ].map(s=>(
//           <div key={s.label} className="stat-card" style={{"--accent":s.c}}>
//             <div className="stat-icon-wrap" style={{background:s.c+"1a"}}>{s.icon}</div>
//             <div className="stat-body"><div className="stat-label">{s.label}</div><div className="stat-value">{s.value}</div></div>
//           </div>
//         ))}
//       </div>

//       <div className="card">
//         <div className="tbl-wrap">
//           <table className="s-table">
//             <thead><tr><th>Ref</th><th>Patient</th><th>Service</th><th>Amount</th><th>Admin Cut</th><th>My Net</th><th>Method</th><th>Date</th><th>Status</th><th></th></tr></thead>
//             <tbody>
//               {items.length===0&&<tr><td colSpan={10} style={{textAlign:"center",padding:32,color:"var(--muted)"}}>No payments yet.</td></tr>}
//               {items.map(p=>{
//                 const cut = p.adminCut||0;
//                 const net = p.amount-cut;
//                 return (
//                   <tr key={p.id}>
//                     <td style={{fontSize:11,color:"var(--muted)"}}>{p.txRef}</td>
//                     <td>{p.patientName}</td>
//                     <td>{p.service}</td>
//                     <td style={{fontWeight:700}}>{p.amount.toLocaleString()}</td>
//                     <td style={{color:"#7c3aed",fontSize:12}}>{p.status==="paid"?cut.toLocaleString():"—"}</td>
//                     <td style={{color:"#22c55e",fontWeight:700}}>{p.status==="paid"?net.toLocaleString():"—"}</td>
//                     <td>{p.method}</td>
//                     <td>{p.date}</td>
//                     <td><Badge label={p.status}/></td>
//                     <td>{p.status==="pending"&&<button className="ghost-btn green-btn" onClick={()=>markPaid(p)}>Mark Paid</button>}</td>
//                   </tr>
//                 );
//               })}
//             </tbody>
//           </table>
//         </div>
//       </div>

//       {addOpen&&(
//         <Modal title="Request Payment" onClose={()=>setAdd(false)}>
//           <FRow label="Patient *">
//             <select style={inp} value={form.patientId} onChange={e=>setForm(f=>({...f,patientId:e.target.value}))}>
//               <option value="">Select patient…</option>
//               {patients.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
//             </select>
//           </FRow>
//           {forfaits.length>0&&(
//             <FRow label="Forfait (optional)">
//               <select style={inp} value={form.forfaitId} onChange={e=>{
//                 const f=forfaits.find(x=>x.id===e.target.value);
//                 setForm(x=>({...x,forfaitId:e.target.value,amount:f?.price||x.amount,service:f?.name||x.service}));
//               }}>
//                 <option value="">Custom amount…</option>
//                 {forfaits.map(f=><option key={f.id} value={f.id}>{f.name} — {f.price.toLocaleString()} XAF ({f.pct}% admin)</option>)}
//               </select>
//             </FRow>
//           )}
//           <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
//             <FRow label="Service"><input style={inp} placeholder="e.g. Consultation" value={form.service} onChange={e=>setForm(f=>({...f,service:e.target.value}))}/></FRow>
//             <FRow label="Amount (XAF) *"><input style={inp} type="number" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))}/></FRow>
//           </div>
//           <FRow label="Payment Method">
//             <select style={inp} value={form.method} onChange={e=>setForm(f=>({...f,method:e.target.value}))}>
//               <option>Mobile Money</option><option>Cash</option><option>Bank Transfer</option><option>Card</option>
//             </select>
//           </FRow>
//           <FRow label="Notes"><textarea style={{...inp,height:60,resize:"vertical"}} value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))}/></FRow>
//           <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
//             <button className="ghost-btn" onClick={()=>setAdd(false)}>Cancel</button>
//             <button className="btn-teal" onClick={createPayment}>Create Request</button>
//           </div>
//         </Modal>
//       )}
//     </div>
//   );
// }

// /* ═══════════════════════════════════════════════════════════════
//    PROFILE
// ═══════════════════════════════════════════════════════════════ */
// function DocProfile({ doctorId, doctor, toast }) {
//   const [form, setForm] = useState({ name:doctor.name||"", email:doctor.email||"", phone:doctor.phone||"",
//     specialty:doctor.specialty||"", location:doctor.location||"", experience:doctor.experience||"", bio:doctor.bio||"" });
//   const [pwForm, setPwForm] = useState({ old:"", newPw:"", confirm:"" });

//   const appts  = apptDB.forDoctor(doctorId);
//   const consults = consultDB.forDoctor(doctorId);
//   const prescrs  = prescrDB.forDoctor(doctorId);
//   const visits   = homeVisitDB.forDoctor(doctorId);

//   const save = () => {
//     doctorDB.update(doctorId, form);
//     pushNotif("admin","system","Doctor Profile Updated",`${form.name} updated their profile.`);
//     toast("Profile saved!");
//   };

//   const changePassword = () => {
//     if (pwForm.newPw!==pwForm.confirm) { toast("Passwords don't match","error"); return; }
//     if (pwForm.newPw.length<6) { toast("Password too short","error"); return; }
//     if (pwForm.old!==doctor.password) { toast("Current password incorrect","error"); return; }
//     doctorDB.update(doctorId,{password:pwForm.newPw});
//     toast("Password updated!"); setPwForm({old:"",newPw:"",confirm:""});
//   };

//   return (
//     <div className="page-anim">
//       <div className="page-header"><div><h1 className="page-title">My Profile</h1></div></div>
//       <div className="two-col">
//         <div className="card">
//           <div style={{textAlign:"center",marginBottom:20}}>
//             <Av name={doctor.name||"Dr"} size={80}/>
//             <h3 style={{marginTop:12,fontFamily:"'Sora',sans-serif"}}>{doctor.name}</h3>
//             <div style={{display:"flex",justifyContent:"center",gap:8,marginTop:8}}>
//               <Badge label={doctor.specialty||"Specialist"} color="#00bfa5"/>
//               <span style={{color:"#fbbf24",fontSize:14}}>★ {doctor.rating}</span>
//             </div>
//           </div>
//           <div style={{borderTop:"1px solid var(--border)",paddingTop:16,display:"flex",flexDirection:"column",gap:2}}>
//             {[["Full Name","name","text"],["Email","email","email"],["Phone","phone","tel"],["Specialty","specialty","text"],["Location","location","text"],["Experience","experience","text"]].map(([l,k,t])=>(
//               <FRow key={k} label={l}><input style={inp} type={t} value={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))}/></FRow>
//             ))}
//             <FRow label="Bio"><textarea style={{...inp,height:80,resize:"vertical"}} value={form.bio} onChange={e=>setForm(f=>({...f,bio:e.target.value}))}/></FRow>
//             <button className="btn-teal" style={{marginTop:6}} onClick={save}>Save Changes</button>
//           </div>
//         </div>

//         <div style={{display:"flex",flexDirection:"column",gap:16}}>
//           <div className="card">
//             <div className="card-title" style={{marginBottom:14}}>My Statistics</div>
//             {[
//               ["Total Appointments", appts.length],
//               ["Confirmed",          appts.filter(a=>a.status==="confirmed").length],
//               ["Pending",            appts.filter(a=>a.status==="pending").length],
//               ["Consultations",      consults.length],
//               ["Prescriptions",      prescrs.length],
//               ["Home Visits",        visits.length],
//             ].map(([l,v])=>(
//               <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"9px 0",borderBottom:"1px solid var(--border)",fontSize:14}}>
//                 <span style={{color:"var(--muted)",fontWeight:600}}>{l}</span>
//                 <span style={{fontWeight:700,color:"#00bfa5"}}>{v}</span>
//               </div>
//             ))}
//           </div>

//           <div className="card">
//             <div className="card-title" style={{marginBottom:14}}>Change Password</div>
//             <FRow label="Current Password"><input style={inp} type="password" value={pwForm.old} onChange={e=>setPwForm(f=>({...f,old:e.target.value}))}/></FRow>
//             <FRow label="New Password"><input style={inp} type="password" value={pwForm.newPw} onChange={e=>setPwForm(f=>({...f,newPw:e.target.value}))}/></FRow>
//             <FRow label="Confirm New"><input style={inp} type="password" value={pwForm.confirm} onChange={e=>setPwForm(f=>({...f,confirm:e.target.value}))}/></FRow>
//             <button className="btn-teal" style={{marginTop:6,background:"#0d1b3e"}} onClick={changePassword}>Update Password</button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// /* ═══════════════════════════════════════════════════════════════
//    CSS  (mirrors AdminPanel palette; teal accent for doctor)
// ═══════════════════════════════════════════════════════════════ */
// const CSS = `
// @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap');

// :root {
//   --bg: #f0f4f9;
//   --card: #ffffff;
//   --border: #e2e8f0;
//   --text: #0f172a;
//   --muted: #64748b;
//   --red: #ef4444;
//   --teal: #00bfa5;
//   --sidebar-w: 248px;
// }
// * { box-sizing: border-box; margin: 0; padding: 0; }

// /* SIDEBAR */
// .sidebar {
//   width: var(--sidebar-w);
//   background: linear-gradient(180deg, #003d33 0%, #00574a 100%);
//   display: flex; flex-direction: column; height: 100vh;
//   flex-shrink: 0; overflow-y: auto;
//   transition: transform .28s cubic-bezier(.4,0,.2,1);
//   position: relative; z-index: 200;
// }
// .sidebar-brand {
//   display: flex; align-items: center; gap: 12px;
//   padding: 22px 18px 18px;
//   border-bottom: 1px solid rgba(255,255,255,.08); flex-shrink: 0;
// }
// .brand-orb {
//   width: 38px; height: 38px; border-radius: 10px;
//   display: flex; align-items: center; justify-content: center;
//   font-family: 'Sora',sans-serif; font-weight: 800; color: #fff; font-size: 20px;
//   box-shadow: 0 4px 16px rgba(0,191,165,.4);
// }
// .sidebar-nav { flex: 1; padding: 8px 0; overflow-y: auto; }
// .nav-section {
//   font-size: 10px; font-weight: 700; letter-spacing: 1.5px;
//   text-transform: uppercase; color: rgba(255,255,255,.3);
//   padding: 12px 20px 5px;
// }
// .nav-item {
//   display: flex; align-items: center; gap: 10px;
//   width: 100%; padding: 9px 20px; background: none; border: none;
//   cursor: pointer; color: rgba(255,255,255,.65);
//   font-size: 13.5px; font-family: inherit; text-align: left;
//   transition: background .2s, color .2s; position: relative;
// }
// .nav-item:hover { background: rgba(255,255,255,.06); color: #fff; }
// .nav-item.active {
//   background: rgba(0,191,165,.2); color: #fff;
//   border-right: 3px solid #00bfa5;
// }
// .nav-icon { font-size: 15px; width: 20px; text-align: center; }
// .nav-badge {
//   margin-left: auto; background: #f44336; color: #fff;
//   border-radius: 99px; font-size: 10px; font-weight: 700; padding: 1px 6px;
// }
// .logout-btn {
//   display: flex; align-items: center; gap: 10px; width: 100%;
//   padding: 15px 20px; background: none; border: none; cursor: pointer;
//   color: rgba(255,255,255,.5); font-size: 13.5px; font-family: inherit;
//   border-top: 1px solid rgba(255,255,255,.08); transition: color .2s, background .2s;
// }
// .logout-btn:hover { background: rgba(244,67,54,.15); color: #ff6b6b; }

// /* MAIN */
// .main-wrap { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
// .topbar {
//   height: 58px; background: var(--card);
//   border-bottom: 1px solid var(--border);
//   display: flex; align-items: center; gap: 8px;
//   padding: 0 20px; flex-shrink: 0;
//   box-shadow: 0 1px 4px rgba(0,0,0,.06);
// }
// .hamburger { display: none; background: none; border: none; cursor: pointer; font-size: 20px; color: var(--text); }
// .topbar-icon {
//   position: relative; background: var(--bg);
//   border: 1px solid var(--border); border-radius: 8px;
//   width: 36px; height: 36px; cursor: pointer; font-size: 16px;
//   display: flex; align-items: center; justify-content: center;
// }
// .top-badge {
//   position: absolute; top: -4px; right: -4px;
//   background: #f44336; color: #fff; border-radius: 99px;
//   font-size: 9px; font-weight: 800; padding: 1px 4px; line-height: 1.2;
// }
// .content-scroll { flex: 1; overflow-y: auto; padding: 24px; }

// /* ANIMATIONS */
// .page-anim { animation: fadeUp .35s ease; }
// @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
// @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }

// /* PAGE HEADER */
// .page-header {
//   display: flex; align-items: flex-start; justify-content: space-between;
//   gap: 16px; margin-bottom: 24px; flex-wrap: wrap;
// }
// .page-title { font-family: 'Sora',sans-serif; font-weight: 800; font-size: 26px; color: var(--text); }
// .page-sub { font-size: 13px; color: var(--muted); margin-top: 3px; }

// /* STATS */
// .stats-row { display: grid; grid-template-columns: repeat(4,1fr); gap: 16px; margin-bottom: 24px; }
// .stat-card {
//   background: var(--card); border: 1px solid var(--border);
//   border-radius: 16px; padding: 18px;
//   display: flex; align-items: center; gap: 14px;
//   border-left: 4px solid var(--accent, #00bfa5);
//   transition: transform .2s, box-shadow .2s;
// }
// .stat-card:hover { transform: translateY(-2px); box-shadow: 0 6px 24px rgba(0,0,0,.08); }
// .stat-icon-wrap { font-size: 26px; width: 52px; height: 52px; border-radius: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
// .stat-label { font-size: 11px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: .6px; }
// .stat-value { font-family: 'Sora',sans-serif; font-weight: 800; font-size: 24px; color: var(--text); margin: 2px 0; }
// .stat-trend { font-size: 12px; color: var(--muted); }

// /* CARDS */
// .card { background: var(--card); border: 1px solid var(--border); border-radius: 16px; padding: 20px; }
// .card-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
// .card-title { font-family: 'Sora',sans-serif; font-weight: 700; font-size: 15px; }
// .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }

// /* TABLE */
// .tbl-wrap { overflow-x: auto; margin-top: 10px; }
// .s-table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
// .s-table th { text-align: left; padding: 10px 12px; border-bottom: 2px solid var(--border); font-size: 11px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: .6px; white-space: nowrap; }
// .s-table td { padding: 12px; border-bottom: 1px solid var(--border); vertical-align: middle; }
// .s-table tr:last-child td { border-bottom: none; }
// .s-table tr:hover td { background: #f8fafc; }

// /* BUTTONS */
// .btn-teal {
//   background: linear-gradient(135deg, #00bfa5, #26c6da);
//   color: #fff; border: none; border-radius: 10px;
//   padding: 10px 20px; font-size: 14px; font-weight: 700;
//   cursor: pointer; font-family: inherit;
//   transition: opacity .2s, transform .15s; white-space: nowrap;
// }
// .btn-teal:hover { opacity: .88; transform: translateY(-1px); }
// .ghost-btn {
//   background: var(--bg); border: 1px solid var(--border);
//   border-radius: 8px; padding: 6px 12px; font-size: 12px;
//   font-weight: 600; cursor: pointer; color: var(--text);
//   font-family: inherit; transition: background .2s; white-space: nowrap;
// }
// .ghost-btn:hover { background: #e2e8f0; }
// .green-btn { color: #22c55e !important; border-color: #22c55e44 !important; background: #f0fdf4 !important; }

// /* FILTERS */
// .filter-bar { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; margin-bottom: 12px; }
// .filter-tabs { display: flex; gap: 4px; flex-wrap: wrap; }
// .filter-tab {
//   background: var(--bg); border: 1px solid var(--border);
//   border-radius: 8px; padding: 6px 12px; font-size: 13px;
//   font-weight: 600; cursor: pointer; color: var(--muted);
//   font-family: inherit; transition: all .2s;
// }
// .filter-tab.active { background: #00bfa5; color: #fff; border-color: #00bfa5; }
// .f-count { margin-left: 5px; background: rgba(0,0,0,.12); border-radius: 99px; padding: 1px 6px; font-size: 11px; }
// .filter-tab.active .f-count { background: rgba(255,255,255,.2); }

// .search-inp {
//   background: var(--bg); border: 1.5px solid var(--border);
//   border-radius: 10px; padding: 10px 14px; font-size: 14px;
//   color: var(--text); width: 100%; max-width: 340px;
//   outline: none; font-family: inherit; transition: border-color .2s; margin-bottom: 8px;
// }
// .search-inp:focus { border-color: #00bfa5; }

// /* APPOINTMENT ROW */
// .appt-row {
//   display: flex; align-items: center; gap: 12px;
//   padding: 10px 0; border-bottom: 1px solid var(--border);
// }
// .appt-row:last-child { border-bottom: none; }
// .appt-time { font-family: 'Sora',sans-serif; font-weight: 700; font-size: 13px; color: #00bfa5; min-width: 44px; }

// /* DOCTORS / PATIENT GRID */
// .doctors-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px,1fr)); gap: 16px; }
// .doctor-card {
//   background: var(--card); border: 1px solid var(--border); border-radius: 16px;
//   padding: 20px; transition: box-shadow .2s, transform .2s;
// }
// .doctor-card:hover { box-shadow: 0 8px 32px rgba(0,0,0,.1); transform: translateY(-2px); }

// /* QUICK ACTIONS */
// .quick-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 8px; }
// .quick-btn {
//   background: color-mix(in srgb, var(--qc,#00bfa5) 10%, white);
//   border: 1px solid color-mix(in srgb, var(--qc,#00bfa5) 25%, transparent);
//   border-radius: 12px; padding: 12px 8px;
//   display: flex; flex-direction: column; align-items: center; gap: 4px;
//   cursor: pointer; color: var(--qc,#00bfa5); font-family: inherit;
//   transition: transform .15s, box-shadow .15s;
// }
// .quick-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,.1); }

// /* MESSAGES */
// .messages-layout { display: grid; grid-template-columns: 260px 1fr; gap: 16px; height: 560px; }
// .messages-sidebar { overflow-y: auto; }
// .msg-contact {
//   display: flex; align-items: center; gap: 10px; padding: 12px 16px;
//   cursor: pointer; border-bottom: 1px solid var(--border); transition: background .15s;
// }
// .msg-contact:hover { background: #f8fafc; }
// .msg-contact.active { background: rgba(0,191,165,.08); border-left: 3px solid #00bfa5; }
// .messages-chat { overflow: hidden; }

// /* NOTIFICATIONS */
// .notif-item {
//   display: flex; align-items: flex-start; gap: 14px;
//   padding: 14px 0; border-bottom: 1px solid var(--border);
// }
// .notif-item:last-child { border-bottom: none; }
// .notif-item.unread { background: #f0fffe; border-radius: 10px; padding: 14px; margin-bottom: 4px; }

// /* CONSULTATION ROOM */
// .consult-room { border-radius: 18px; overflow: hidden; background: #0a1628; }
// .consult-header {
//   display: flex; align-items: center; justify-content: space-between;
//   padding: 14px 20px; background: rgba(255,255,255,.05);
//   border-bottom: 1px solid rgba(255,255,255,.1);
// }
// .consult-body { display: flex; height: 500px; }
// .video-area { width: 380px; flex-shrink: 0; display: flex; flex-direction: column; border-right: 1px solid rgba(255,255,255,.1); }
// .video-main {
//   flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
//   background: #111; position: relative;
// }
// .video-self {
//   position: absolute; bottom: 14px; right: 14px; width: 80px; height: 60px;
//   background: #1a2a40; border-radius: 10px; display: flex; align-items: center; justify-content: center;
//   font-size: 28px; border: 2px solid #00bfa5;
// }
// .video-controls {
//   display: flex; gap: 10px; padding: 12px 16px; justify-content: center;
//   background: rgba(255,255,255,.03); border-top: 1px solid rgba(255,255,255,.08);
// }
// .vid-btn {
//   width: 44px; height: 44px; border-radius: 50%; border: none; cursor: pointer;
//   font-size: 18px; display: flex; align-items: center; justify-content: center; color: #fff;
//   transition: transform .15s;
// }
// .vid-btn:hover { transform: scale(1.1); }
// .chat-area { flex: 1; display: flex; flex-direction: column; }
// .chat-messages { flex: 1; overflow-y: auto; padding: 14px; display: flex; flex-direction: column; gap: 10px; }

// /* EMPTY STATE */
// .empty-state { text-align: center; padding: 40px; color: var(--muted); }
// .empty-state p { margin-top: 10px; font-size: 14px; }

// /* OVERLAY */
// .overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,.45); z-index: 100; }

// /* RESPONSIVE */
// @media (max-width: 960px) {
//   .stats-row { grid-template-columns: 1fr 1fr; }
//   .two-col { grid-template-columns: 1fr; }
//   .messages-layout { grid-template-columns: 1fr; height: auto; }
//   .hide-sm { display: none; }
// }
// @media (max-width: 640px) {
//   .sidebar { position: fixed; left: 0; top: 0; transform: translateX(-100%); height: 100vh; z-index: 300; }
//   .sidebar.open { transform: translateX(0); }
//   .overlay { display: block; }
//   .hamburger { display: flex !important; align-items: center; }
//   .stats-row { grid-template-columns: 1fr; }
//   .content-scroll { padding: 14px; }
//   .doctors-grid { grid-template-columns: 1fr; }
//   .quick-grid { grid-template-columns: repeat(2,1fr); }
//   .video-area { display: none; }
//   .messages-layout { height: auto; }
// }
// `;


/**
 * Pages/Doctor/DoctorPanel.jsx
 * ===============================================================
 * Doctor portal built to match the PatientPanel.jsx the user
 * already has. Imports from the SAME Storage.js, uses the SAME
 * VideoCall.jsx and LiveMap.jsx, so every doctor action shows up
 * correctly on the patient side and is mirrored to admin.
 *
 * Key data-shape contracts (must match what PatientPanel reads):
 *  - apptDB items the doctor creates get createdByDoctor:true and
 *    status:"pending" so PatSchedules surfaces them with Accept/Reject.
 *  - consultDB items the doctor creates get doctorInitiated:true and
 *    status:"scheduled" so the incoming-call modal on PatientPanel
 *    fires (it polls for c.doctorInitiated && !c.patientAlerted).
 *  - homeVisitDB items the doctor creates get status:"scheduled" so
 *    they appear in PatSchedules pending list (patient can accept).
 *  - prescrDB / recordDB entries are pushed with pushNotif directly
 *    to the patient AND mirrored to admin via Storage.js's pushNotif.
 *
 * SAVE THIS FILE AS: src/Pages/Doctor/DoctorPanel.jsx
 * (VideoCall.jsx and LiveMap.jsx must sit alongside it in the same folder)
 */
import { useState, useEffect, useRef, useCallback } from "react";
import VideoCall from "./VideoCall";
import LiveMap   from "./LiveMap";
import {
  uid, now, todayStr,
  doctorDB, patientDB, apptDB, payDB, msgDB, notifDB,
  consultDB, prescrDB, recordDB, homeVisitDB,
  pushNotif, seedIfEmpty, VideoSessionBus,
} from "../../Storage";

seedIfEmpty();

/* helpers */
const fmtMoney = n => Number(n || 0).toLocaleString("fr-CM") + " XAF";
const monthSh  = d => d ? new Date(d).toLocaleString("default", { month: "short" }) : "";

const COLORS = ["#1e88e5","#00bfa5","#7c3aed","#f44336","#ff7043","#0891b2","#16a34a","#be185d"];
function Avatar({ name = "?", size = 36, src }) {
  if (src) return <img src={src} alt={name} style={{ width:size, height:size, borderRadius:"50%", objectFit:"cover", flexShrink:0, border:"2px solid #e2e8f0" }}/>;
  const init  = name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  const color = COLORS[(name.charCodeAt(0) || 0) % COLORS.length];
  return (
    <div style={{ width:size, height:size, borderRadius:"50%", background:color, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:size*.37, flexShrink:0, fontFamily:"'Sora',sans-serif" }}>
      {init}
    </div>
  );
}

const SC = { confirmed:"#22c55e", active:"#22c55e", paid:"#22c55e", completed:"#22c55e", accepted:"#22c55e", online:"#22c55e",
  pending:"#fbbf24", scheduled:"#fbbf24",
  cancelled:"#ef4444", declined:"#ef4444", inactive:"#94a3b8" };
function Badge({ label, color }) {
  const c = color || SC[label?.toLowerCase()] || "#94a3b8";
  return <span style={{ background:c+"22", color:c, border:`1px solid ${c}44`, borderRadius:6, padding:"2px 10px", fontSize:11, fontWeight:700, whiteSpace:"nowrap" }}>{label}</span>;
}

function Modal({ title, onClose, children, wide }) {
  useEffect(() => {
    const h = e => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.6)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }} onClick={onClose}>
      <div style={{ background:"#fff", borderRadius:18, width:"100%", maxWidth:wide?720:480, maxHeight:"90vh", overflow:"auto", boxShadow:"0 24px 80px rgba(0,0,0,.4)", border:"1px solid #e2e8f0" }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"18px 22px", borderBottom:"1px solid #e2e8f0" }}>
          <span style={{ fontFamily:"'Sora',sans-serif", fontWeight:700, fontSize:16 }}>{title}</span>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", fontSize:20, color:"#94a3b8" }}>x</button>
        </div>
        <div style={{ padding:"18px 22px" }}>{children}</div>
      </div>
    </div>
  );
}

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

const inp = { background:"#f8fafc", border:"1.5px solid #e2e8f0", borderRadius:9, padding:"9px 13px", width:"100%", fontSize:14, color:"#0f172a", outline:"none", boxSizing:"border-box", fontFamily:"inherit" };
function FRow({ label, children }) {
  return (
    <div style={{ marginBottom:14 }}>
      <label style={{ display:"block", fontSize:12, fontWeight:700, color:"#64748b", marginBottom:5, textTransform:"uppercase", letterSpacing:.6 }}>{label}</label>
      {children}
    </div>
  );
}

const NAV = [
  { section:"Overview" },
  { key:"overview",      icon:"DB", label:"Dashboard" },
  { section:"Care" },
  { key:"appointments",  icon:"AP", label:"Appointments" },
  { key:"consultations", icon:"VC", label:"Video Calls" },
  { key:"home_visits",   icon:"HV", label:"Home Visits" },
  { key:"patients",      icon:"PT", label:"My Patients" },
  { section:"Health" },
  { key:"prescriptions", icon:"RX", label:"Prescriptions" },
  { key:"records",       icon:"MR", label:"Medical Records" },
  { section:"Account" },
  { key:"payments",      icon:"PA", label:"Payments" },
  { key:"messages",      icon:"MS", label:"Messages" },
  { key:"notifications", icon:"NT", label:"Notifications" },
  { key:"profile",       icon:"PR", label:"My Profile" },
];

/* ===============================================================
   ROOT
================================================================ */
export default function DoctorPanel({ doctorId: propDoctorId, onLogout }) {
  const [doctorId] = useState(() => {
    if (propDoctorId) return propDoctorId;
    const docs = doctorDB.all();
    return docs.find(d => d.status === "active")?.id || docs[0]?.id || "d1";
  });

  const doctor = doctorDB.get(doctorId) || {};
  const [tab, setTab] = useState("overview");
  const [sideOpen, setSideOpen] = useState(false);
  const [activeCall, setActiveCall] = useState(null);
  const [callAlert, setCallAlert] = useState(null);
  const { toasts, fire: toast } = useToast();

  const [unreadNotif, setUnreadNotif] = useState(0);
  const [unreadMsg, setUnreadMsg] = useState(0);
  const [pendingAppts, setPending] = useState(0);

  const refreshBadges = () => {
    setUnreadNotif(notifDB.all().filter(n => (n.toId===doctorId) && !n.read).length);
    setUnreadMsg(msgDB.all().filter(m => m.toId===doctorId && !m.read).length);
    setPending(apptDB.forDoctor(doctorId).filter(a => a.status==="pending" && !a.createdByDoctor).length);
  };

  /* Detect a PATIENT-initiated video call session that's waiting
     for the doctor (patient has joined VideoSessionBus already). */
  useEffect(() => {
    const checkIncoming = () => {
      if (activeCall || callAlert) return;
      const myConsults = consultDB.forDoctor(doctorId).filter(c => c.type === "video" && c.status === "scheduled");
      for (const c of myConsults) {
        const session = VideoSessionBus.getActive(c.id);
        if (session) {
          const msgs = VideoSessionBus.getMessages(session.id);
          const patientJoined = msgs.some(m => m.fromId === c.patientId);
          if (patientJoined && !c.doctorAlerted) {
            consultDB.update(c.id, { doctorAlerted: true });
            setCallAlert(c);
            break;
          }
        }
      }
    };
    checkIncoming();
    const t = setInterval(checkIncoming, 2500);
    return () => clearInterval(t);
  }, [doctorId, activeCall, callAlert]);

  useEffect(() => {
    refreshBadges();
    const t = setInterval(refreshBadges, 3000);
    return () => clearInterval(t);
  }, [doctorId]);

  const sp = { doctorId, doctor, toast, refreshBadges };

  if (activeCall) return (
    <VideoCall
      consultation={activeCall}
      localUser={{ id: doctorId, name: doctor.name || "Doctor", role: "doctor" }}
      onEnd={() => {
        consultDB.update(activeCall.id, { status: "completed" });
        toast("Session ended and marked complete.");
        setActiveCall(null);
        refreshBadges();
      }}
    />
  );

  return (
    <div style={{ display:"flex", height:"100vh", overflow:"hidden", background:"#f0f4f9", fontFamily:"'DM Sans',sans-serif", color:"#0f172a" }}>
      <style>{CSS}</style>

      {callAlert && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.7)", zIndex:99999, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
          <div style={{ background:"#fff", borderRadius:24, padding:"36px 32px", maxWidth:420, width:"100%", textAlign:"center", boxShadow:"0 32px 80px rgba(0,0,0,.3)", border:"2px solid rgba(0,191,165,.3)" }}>
            <div style={{ width:80, height:80, borderRadius:"50%", background:"linear-gradient(135deg,#00bfa5,#0891b2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:30, margin:"0 auto 16px", color:"#fff", fontWeight:800 }}>VC</div>
            <h2 style={{ fontFamily:"'Sora',sans-serif", fontSize:20, marginBottom:6 }}>Incoming Video Call</h2>
            <p style={{ color:"#64748b", fontSize:14, marginBottom:4 }}><strong>{callAlert.patientName}</strong> is waiting for you in the video room</p>
            <p style={{ color:"#94a3b8", fontSize:12, marginBottom:24 }}>{callAlert.date} at {callAlert.time}</p>
            <div style={{ display:"flex", gap:12 }}>
              <button onClick={() => {
                setCallAlert(null);
                consultDB.update(callAlert.id, { status:"cancelled" });
                pushNotif(callAlert.patientId, "consultation", "Call Declined", `Dr. ${doctor.name} is unavailable right now.`);
                toast("Call declined.","warn");
              }} style={{ flex:1, padding:"13px", borderRadius:14, border:"2px solid #e2e8f0", background:"#f8fafc", color:"#64748b", fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                Decline
              </button>
              <button onClick={() => { setCallAlert(null); setActiveCall(callAlert); }}
                style={{ flex:2, padding:"13px", borderRadius:14, border:"none", background:"linear-gradient(135deg,#00bfa5,#0891b2)", color:"#fff", fontWeight:800, cursor:"pointer", fontFamily:"inherit" }}>
                Join Now
              </button>
            </div>
          </div>
        </div>
      )}

      <aside className={`dp-sidebar${sideOpen?" open":""}`}>
        <div className="dp-brand">
          <div className="dp-brand-orb">+</div>
          <div>
            <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:800, fontSize:15, color:"#fff" }}>STECH</div>
            <div style={{ fontSize:10, color:"#94a3b8", letterSpacing:1.5, textTransform:"uppercase" }}>Doctor Portal</div>
          </div>
        </div>
        <div style={{ margin:"0 12px 8px", padding:12, background:"rgba(255,255,255,.06)", borderRadius:12, display:"flex", gap:10, alignItems:"center" }}>
          <Avatar name={doctor.name || "Dr"} size={40} src={doctor.avatar}/>
          <div style={{ overflow:"hidden" }}>
            <div style={{ color:"#fff", fontWeight:700, fontSize:13, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{doctor.name || "Doctor"}</div>
            <div style={{ color:"#00bfa5", fontSize:11, fontWeight:600 }}>{doctor.specialty || "Specialist"}</div>
          </div>
        </div>
        <nav className="dp-nav">
          {NAV.map((n,i) => {
            if (n.section) return <div key={i} className="dp-nav-section">{n.section}</div>;
            const badge = n.key==="notifications" ? unreadNotif : n.key==="messages" ? unreadMsg : n.key==="appointments" ? pendingAppts : 0;
            return (
              <button key={n.key} className={`dp-nav-item${tab===n.key?" active":""}`} onClick={() => { setTab(n.key); setSideOpen(false); }}>
                <span className="dp-nav-icon">{n.icon}</span>
                <span>{n.label}</span>
                {badge>0 && <span className="dp-nav-badge">{badge}</span>}
              </button>
            );
          })}
        </nav>
        <button className="dp-logout" onClick={onLogout}>Logout</button>
      </aside>

      <div className="dp-main">
        <header className="dp-topbar">
          <button className="dp-hamburger" onClick={() => setSideOpen(s=>!s)}>Menu</button>
          <div style={{ flex:1 }}/>
          <button className="dp-topbar-icon" onClick={() => setTab("consultations")} style={{ color:"#00bfa5" }}>Video</button>
          <button className="dp-topbar-icon" onClick={() => setTab("messages")}>Msg{unreadMsg>0 && <sup className="dp-top-badge">{unreadMsg}</sup>}</button>
          <button className="dp-topbar-icon" onClick={() => setTab("notifications")}>Bell{unreadNotif>0 && <sup className="dp-top-badge">{unreadNotif}</sup>}</button>
          <div onClick={() => setTab("profile")} style={{ cursor:"pointer" }}><Avatar name={doctor.name} size={32} src={doctor.avatar}/></div>
        </header>

        <main className="dp-content">
          {tab==="overview"      && <DocOverview      {...sp} setTab={setTab} onStartCall={setActiveCall}/>}
          {tab==="appointments"  && <DocAppointments  {...sp}/>}
          {tab==="consultations" && <DocConsultations {...sp} onStartCall={setActiveCall}/>}
          {tab==="home_visits"   && <DocHomeVisits    {...sp}/>}
          {tab==="patients"      && <DocPatients      {...sp}/>}
          {tab==="prescriptions" && <DocPrescriptions {...sp}/>}
          {tab==="records"       && <DocRecords       {...sp}/>}
          {tab==="payments"      && <DocPayments      {...sp}/>}
          {tab==="messages"      && <DocMessages      {...sp}/>}
          {tab==="notifications" && <DocNotifications {...sp}/>}
          {tab==="profile"       && <DocProfile       {...sp}/>}
        </main>
      </div>

      {sideOpen && <div className="dp-overlay" onClick={() => setSideOpen(false)}/>}
      <Toaster toasts={toasts}/>
    </div>
  );
}

/* ===============================================================
   OVERVIEW
================================================================ */
function DocOverview({ doctorId, doctor, setTab, onStartCall }) {
  const appts    = apptDB.forDoctor(doctorId);
  const consults = consultDB.forDoctor(doctorId);
  const visits   = homeVisitDB.forDoctor(doctorId);
  const payments = payDB.forDoctor(doctorId);
  const today    = todayStr();

  const todayAppts = appts.filter(a => a.date === today);
  const pending    = appts.filter(a => a.status === "pending" && !a.createdByDoctor);
  const revenue    = payments.filter(p => p.status === "paid").reduce((s,p) => s+p.amount, 0);
  const videoWaiting = consults.filter(c => c.type==="video" && c.status==="scheduled");

  const hr = new Date().getHours();
  const greeting = hr<12 ? "Good Morning" : hr<18 ? "Good Afternoon" : "Good Evening";
  const firstName = doctor.name?.split(" ").slice(-1)[0] || "Doctor";

  const stats = [
    { label:"Today's Appts",   value:todayAppts.length,    color:"#1e88e5" },
    { label:"Pending Requests",value:pending.length,        color:"#fbbf24" },
    { label:"Video Calls",      value:videoWaiting.length,   color:"#00bfa5", nav:"consultations" },
    { label:"Revenue",          value:`${(revenue/1000).toFixed(1)}K XAF`, color:"#16a34a" },
  ];

  return (
    <div className="dp-anim">
      <div className="dp-page-head">
        <div>
          <h1 className="dp-title">{greeting}, Dr. {firstName}</h1>
          <p className="dp-sub">{doctor.specialty} - {new Date().toDateString()}</p>
        </div>
      </div>

      <div className="dp-stats">
        {stats.map(s => (
          <div key={s.label} className="dp-stat-card" style={{ "--acc":s.color, cursor:s.nav?"pointer":"default" }} onClick={() => s.nav && setTab(s.nav)}>
            <div style={{ fontSize:11, fontWeight:700, color:"#64748b", textTransform:"uppercase", letterSpacing:.6 }}>{s.label}</div>
            <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:800, fontSize:24 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {videoWaiting.length > 0 && (
        <div style={{ background:"linear-gradient(110deg,#003d33,#00574a)", borderRadius:16, padding:"18px 22px", marginBottom:20, display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, flexWrap:"wrap" }}>
          <div>
            <div style={{ fontWeight:800, fontSize:16, color:"#fff" }}>{videoWaiting.length} scheduled video consultation{videoWaiting.length>1?"s":""}</div>
            <div style={{ fontSize:13, color:"rgba(255,255,255,.6)", marginTop:3 }}>
              Next: {videoWaiting[0]?.patientName} - {videoWaiting[0]?.date} at {videoWaiting[0]?.time}
            </div>
          </div>
          <button onClick={() => onStartCall(videoWaiting[0])} style={{ background:"#00bfa5", color:"#fff", border:"none", borderRadius:12, padding:"12px 22px", fontWeight:800, cursor:"pointer", fontSize:14, fontFamily:"inherit" }}>
            Join Now
          </button>
        </div>
      )}

      <div className="dp-two-col">
        <div className="dp-card">
          <div className="dp-card-head"><div className="dp-card-title">Today's Schedule</div></div>
          {todayAppts.length === 0
            ? <div className="dp-empty"><p>No appointments today.</p></div>
            : todayAppts.map(a => (
              <div key={a.id} className="dp-row">
                <span style={{ fontWeight:700, fontSize:13, minWidth:50 }}>{a.time}</span>
                <Avatar name={a.patientName} size={36}/>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:14 }}>{a.patientName}</div>
                  <div style={{ fontSize:12, color:"#64748b" }}>{a.healthType}</div>
                </div>
                <Badge label={a.status}/>
              </div>
            ))}
        </div>

        <div className="dp-card">
          <div className="dp-card-head"><div className="dp-card-title">Pending Requests</div></div>
          {pending.length === 0
            ? <div className="dp-empty"><p>All clear.</p></div>
            : pending.slice(0,5).map(a => (
              <div key={a.id} className="dp-row">
                <Avatar name={a.patientName} size={36}/>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:14 }}>{a.patientName}</div>
                  <div style={{ fontSize:12, color:"#64748b" }}>{a.healthType} - {a.date} {a.time}</div>
                </div>
                <Badge label="pending"/>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

/* ===============================================================
   APPOINTMENTS
   Doctor-created appointments: status "pending", createdByDoctor:true
   -> patient must accept/reject in their My Schedule tab.
   Patient-created appointments: doctor can confirm/cancel directly.
================================================================ */
function DocAppointments({ doctorId, doctor, toast }) {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("all");
  const [addOpen, setAdd] = useState(false);
  const TYPES = ["Consultation","Root Canal","Scaling","Whitening","Wisdom Teeth","Braces Check","Implant","X-Ray","Check-up","Emergency"];

  const refresh = () => setItems(apptDB.forDoctor(doctorId));
  useEffect(() => refresh(), [doctorId]);

  const filtered = items.filter(a => filter==="all" || a.status===filter);

  const updateStatus = (id, status) => {
    const a = apptDB.update(id, { status });
    pushNotif(a?.patientId, "appointment", "Appointment Update", `Your appointment is now ${status}.`);
    pushNotif("admin", "appointment", "Appointment Updated", `${a?.patientName}'s appointment with ${doctor.name} is ${status}.`);
    toast(`Status -> ${status}`); refresh();
  };

  const blank = { patientId:"", healthType:"", date:"", time:"09:00", notes:"" };
  const [form, setForm] = useState(blank);
  const patients = patientDB.all().filter(p => p.status !== "deleted");

  const createAppt = () => {
    if (!form.patientId || !form.healthType || !form.date) { toast("Fill required fields","error"); return; }
    const p = patients.find(x => x.id === form.patientId);
    apptDB.add({
      ...form, id: uid(), doctorId, doctorName: doctor.name,
      patientId: form.patientId, patientName: p?.name,
      status: "pending",
      createdByDoctor: true,
      sessionType: "in-clinic",
      amount: p?.consultFee || doctor.consultFee || 15000,
      createdAt: now(),
    });
    pushNotif(p?.id, "appointment", "New Appointment Scheduled",
      `Dr. ${doctor.name} scheduled a ${form.healthType} on ${form.date} at ${form.time}. Please accept or reject in My Schedule.`);
    pushNotif("admin", "appointment", "Doctor Scheduled Appointment",
      `${doctor.name} -> ${p?.name}: ${form.healthType} on ${form.date}. Awaiting patient response.`);
    toast("Appointment sent to patient for confirmation!");
    setForm(blank); setAdd(false); refresh();
  };

  return (
    <div className="dp-anim">
      <div className="dp-page-head">
        <div><h1 className="dp-title">Appointments</h1><p className="dp-sub">{items.length} total</p></div>
        <button className="dp-btn-primary" onClick={() => setAdd(true)}>+ Schedule for Patient</button>
      </div>

      <div className="dp-card">
        <div className="dp-filter-tabs">
          {["all","pending","confirmed","cancelled"].map(f => (
            <button key={f} className={`dp-filter-tab${filter===f?" active":""}`} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase()+f.slice(1)}
            </button>
          ))}
        </div>
        <div className="dp-tbl-wrap">
          <table className="dp-table">
            <thead><tr><th>Patient</th><th>Type</th><th>Date</th><th>Time</th><th>Source</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {filtered.length===0 && <tr><td colSpan={7} style={{textAlign:"center",padding:32,color:"#94a3b8"}}>No appointments.</td></tr>}
              {filtered.map(a => (
                <tr key={a.id}>
                  <td><div style={{ display:"flex", alignItems:"center", gap:8 }}><Avatar name={a.patientName} size={26}/>{a.patientName}</div></td>
                  <td>{a.sessionType==="video"?"[Video] ":a.sessionType==="home-visit"?"[Home] ":""}{a.healthType}</td>
                  <td>{a.date}</td>
                  <td>{a.time}</td>
                  <td style={{ fontSize:11, fontWeight:700, color: a.createdByDoctor ? "#7c3aed" : "#1e88e5" }}>{a.createdByDoctor ? "Doctor" : "Patient"}</td>
                  <td><Badge label={a.status}/></td>
                  <td>
                    {!a.createdByDoctor && a.status==="pending" && (
                      <div style={{ display:"flex", gap:4 }}>
                        <button className="dp-ghost" style={{ color:"#22c55e" }} onClick={() => updateStatus(a.id,"confirmed")}>Confirm</button>
                        <button className="dp-ghost" style={{ color:"#ef4444" }} onClick={() => updateStatus(a.id,"cancelled")}>Cancel</button>
                      </div>
                    )}
                    {a.createdByDoctor && a.status==="pending" && <span style={{ fontSize:11, color:"#94a3b8", fontStyle:"italic" }}>Awaiting patient</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {addOpen && (
        <Modal title="Schedule Appointment for Patient" onClose={() => setAdd(false)}>
          <div style={{ background:"rgba(124,58,237,.07)", border:"1px solid rgba(124,58,237,.2)", borderRadius:10, padding:"10px 14px", fontSize:13, color:"#7c3aed", marginBottom:14 }}>
            The patient will receive a notification and must accept or reject this in their My Schedule tab.
          </div>
          <FRow label="Patient *">
            <select style={inp} value={form.patientId} onChange={e => setForm(f=>({...f,patientId:e.target.value}))}>
              <option value="">Select patient...</option>
              {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </FRow>
          <FRow label="Treatment Type *">
            <select style={inp} value={form.healthType} onChange={e => setForm(f=>({...f,healthType:e.target.value}))}>
              <option value="">Select type...</option>
              {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </FRow>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <FRow label="Date *"><input style={inp} type="date" value={form.date} onChange={e => setForm(f=>({...f,date:e.target.value}))}/></FRow>
            <FRow label="Time">
              <select style={inp} value={form.time} onChange={e => setForm(f=>({...f,time:e.target.value}))}>
                {["08:00","09:00","10:00","11:00","14:00","15:00","16:00"].map(t => <option key={t}>{t}</option>)}
              </select>
            </FRow>
          </div>
          <FRow label="Notes"><textarea style={{...inp,height:72,resize:"vertical"}} value={form.notes} onChange={e => setForm(f=>({...f,notes:e.target.value}))}/></FRow>
          <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
            <button className="dp-ghost" onClick={() => setAdd(false)}>Cancel</button>
            <button className="dp-btn-primary" onClick={createAppt}>Send to Patient</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ===============================================================
   CONSULTATIONS / VIDEO CALLS
   Doctor-created -> doctorInitiated:true, status:"scheduled".
   This is the flag PatientPanel's root polls for:
     c.patientId===patientId && c.type==="video" && c.status==="scheduled"
     && c.doctorInitiated && !c.patientAlerted
   so the incoming-call modal fires on the PATIENT side when the
   DOCTOR schedules the call - and vice versa via VideoSessionBus
   detection when the PATIENT books one themselves (sessType:"video"
   in PatBooking, which does NOT set doctorInitiated, so it instead
   relies on this DoctorPanel's own VideoSessionBus.getActive poll).
================================================================ */
function DocConsultations({ doctorId, doctor, toast, onStartCall }) {
  const [items, setItems] = useState([]);
  const [addOpen, setAdd] = useState(false);
  const patients = patientDB.all().filter(p => p.status !== "deleted");
  const refresh = () => setItems(consultDB.forDoctor(doctorId));
  useEffect(() => refresh(), [doctorId]);

  const blank = { patientId:"", type:"video", date:"", time:"10:00", notes:"" };
  const [form, setForm] = useState(blank);

  const create = () => {
    if (!form.patientId || !form.date) { toast("Fill required fields","error"); return; }
    const p = patients.find(x => x.id === form.patientId);
    consultDB.add({
      ...form, id: uid(), doctorId, doctorName: doctor.name,
      patientId: form.patientId, patientName: p?.name,
      status: "scheduled",
      doctorInitiated: true,
      patientAlerted: false,
      doctorAlerted: false,
      createdAt: now(),
    });
    pushNotif(p?.id, "consultation", "Video Consultation Scheduled",
      `Dr. ${doctor.name} scheduled a ${form.type} session on ${form.date} at ${form.time}. You'll get a call alert when the doctor joins.`);
    pushNotif("admin", "consultation", "New Consultation", `${p?.name} with ${doctor.name} on ${form.date}.`);
    toast("Consultation scheduled - patient notified!");
    setForm(blank); setAdd(false); refresh();
  };

  return (
    <div className="dp-anim">
      <div className="dp-page-head">
        <div><h1 className="dp-title">Video Calls</h1><p className="dp-sub">Real-time consultations</p></div>
        <button className="dp-btn-primary" onClick={() => setAdd(true)}>+ Schedule</button>
      </div>

      <div className="dp-card">
        <div className="dp-tbl-wrap">
          <table className="dp-table">
            <thead><tr><th>Patient</th><th>Type</th><th>Date</th><th>Time</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {items.length===0 && <tr><td colSpan={6} style={{textAlign:"center",padding:32,color:"#94a3b8"}}>No consultations yet.</td></tr>}
              {items.map(c => (
                <tr key={c.id}>
                  <td><div style={{ display:"flex", alignItems:"center", gap:8 }}><Avatar name={c.patientName} size={26}/>{c.patientName}</div></td>
                  <td>{c.type}</td>
                  <td>{c.date}</td>
                  <td>{c.time}</td>
                  <td><Badge label={c.status}/></td>
                  <td>
                    {c.status === "scheduled" && (
                      <button className="dp-btn-primary" style={{ padding:"6px 14px", fontSize:12 }} onClick={() => onStartCall(c)}>
                        Join Video
                      </button>
                    )}
                    {c.status === "completed" && <Badge label="Done" color="#22c55e"/>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {addOpen && (
        <Modal title="Schedule Video Consultation" onClose={() => setAdd(false)}>
          <div style={{ background:"rgba(0,191,165,.07)", border:"1px solid rgba(0,191,165,.2)", borderRadius:10, padding:"10px 14px", fontSize:13, color:"#00897b", marginBottom:14 }}>
            A real shared video room is created. The patient gets an incoming-call alert and a "Join Video" button. When you both join, you share one live room.
          </div>
          <FRow label="Patient *">
            <select style={inp} value={form.patientId} onChange={e => setForm(f=>({...f,patientId:e.target.value}))}>
              <option value="">Select patient...</option>
              {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </FRow>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <FRow label="Date *"><input style={inp} type="date" value={form.date} onChange={e => setForm(f=>({...f,date:e.target.value}))}/></FRow>
            <FRow label="Time">
              <select style={inp} value={form.time} onChange={e => setForm(f=>({...f,time:e.target.value}))}>
                {["09:00","10:00","11:00","13:00","14:00","15:00","16:00"].map(t => <option key={t}>{t}</option>)}
              </select>
            </FRow>
          </div>
          <FRow label="Notes"><textarea style={{...inp,height:72,resize:"vertical"}} value={form.notes} onChange={e => setForm(f=>({...f,notes:e.target.value}))}/></FRow>
          <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
            <button className="dp-ghost" onClick={() => setAdd(false)}>Cancel</button>
            <button className="dp-btn-primary" onClick={create}>Schedule</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ===============================================================
   HOME VISITS
================================================================ */
function DocHomeVisits({ doctorId, doctor, toast }) {
  const [items, setItems] = useState([]);
  const [addOpen, setAdd] = useState(false);
  const [mapVisit, setMapV] = useState(null);
  const patients = patientDB.all().filter(p => p.status !== "deleted");
  const blank = { patientId:"", address:"", date:"", time:"09:00", service:"", notes:"" };
  const [form, setForm] = useState(blank);
  const refresh = () => setItems(homeVisitDB.forDoctor(doctorId));
  useEffect(() => refresh(), [doctorId]);

  const create = () => {
    if (!form.patientId || !form.date || !form.address) { toast("Fill required fields","error"); return; }
    const p = patients.find(x => x.id === form.patientId);
    homeVisitDB.add({
      ...form, id: uid(), doctorId, doctorName: doctor.name,
      patientId: form.patientId, patientName: p?.name,
      status: "scheduled", createdByDoctor: true, createdAt: now(),
    });
    pushNotif(p?.id, "home_visit", "Home Visit Scheduled",
      `Dr. ${doctor.name} scheduled a home visit on ${form.date} at ${form.time}. Accept or decline in My Schedule.`);
    pushNotif("admin", "home_visit", "Doctor Scheduled Home Visit", `${doctor.name} -> ${p?.name} on ${form.date}.`);
    toast("Home visit sent to patient!"); setForm(blank); setAdd(false); refresh();
  };

  const updateStatus = (id, status, patientId) => {
    homeVisitDB.update(id, { status });
    pushNotif(patientId, "home_visit", "Visit Status Update",
      status === "accepted"
        ? `Dr. ${doctor.name} accepted your home visit request! Live tracking is now active.`
        : `Your home visit status has been updated to: ${status}.`);
    toast(status === "accepted" ? "Visit accepted - tracking live!" : `Visit ${status}`);
    refresh();
  };

  if (mapVisit) return (
    <div className="dp-anim">
      <div className="dp-page-head">
        <div><h1 className="dp-title">Live Route</h1><p className="dp-sub">Tracking to {mapVisit.patientName}</p></div>
        <button className="dp-ghost" onClick={() => setMapV(null)}>Back</button>
      </div>
      <div className="dp-card">
        <LiveMap visit={mapVisit} role="doctor"/>
        <div style={{ marginTop:14, display:"flex", justifyContent:"flex-end" }}>
          <button className="dp-btn-primary" style={{ background:"#16a34a" }} onClick={() => { updateStatus(mapVisit.id,"completed",mapVisit.patientId); setMapV(null); }}>
            Mark Completed
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="dp-anim">
      <div className="dp-page-head">
        <div><h1 className="dp-title">Home Visits</h1></div>
        <button className="dp-btn-primary" onClick={() => setAdd(true)}>+ Schedule Visit</button>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
        {items.length===0 && <div className="dp-card"><div className="dp-empty"><p>No home visits scheduled.</p></div></div>}
        {items.map(r => (
          <div key={r.id} className="dp-card">
            <div style={{ display:"flex", alignItems:"flex-start", gap:16, flexWrap:"wrap" }}>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:10 }}>
                  <Avatar name={r.patientName} size={44}/>
                  <div>
                    <div style={{ fontWeight:700, fontSize:16 }}>{r.patientName}</div>
                    <div style={{ fontSize:13, color:"#64748b" }}>{r.service || "Home Visit"}</div>
                  </div>
                </div>
                <div style={{ display:"flex", gap:16, fontSize:13, color:"#64748b", flexWrap:"wrap" }}>
                  <span>{r.address}</span><span>{r.date}{r.time && ` at ${r.time}`}</span>
                </div>
                {r.createdByDoctor && (r.status==="scheduled" || r.status==="pending") && (
                  <div style={{ marginTop:8, fontSize:12, color:"#7c3aed", fontStyle:"italic" }}>Awaiting patient response</div>
                )}
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:8, alignItems:"flex-end" }}>
                <Badge label={r.status}/>
                <div style={{ display:"flex", gap:6 }}>
                  {r.status === "pending" && !r.createdByDoctor && (
                    <>
                      <button className="dp-ghost" style={{ color:"#22c55e" }} onClick={() => updateStatus(r.id,"accepted",r.patientId)}>Accept</button>
                      <button className="dp-ghost" style={{ color:"#ef4444" }} onClick={() => updateStatus(r.id,"declined",r.patientId)}>Decline</button>
                    </>
                  )}
                  {r.status === "accepted" && (
                    <button className="dp-btn-primary" style={{ padding:"6px 14px", fontSize:12 }} onClick={() => setMapV(r)}>Open Map</button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {addOpen && (
        <Modal title="Schedule Home Visit" onClose={() => setAdd(false)}>
          <FRow label="Patient *">
            <select style={inp} value={form.patientId} onChange={e => setForm(f=>({...f,patientId:e.target.value}))}>
              <option value="">Select patient...</option>
              {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </FRow>
          <FRow label="Address *"><input style={inp} value={form.address} onChange={e => setForm(f=>({...f,address:e.target.value}))}/></FRow>
          <FRow label="Service"><input style={inp} value={form.service} onChange={e => setForm(f=>({...f,service:e.target.value}))}/></FRow>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <FRow label="Date *"><input style={inp} type="date" value={form.date} onChange={e => setForm(f=>({...f,date:e.target.value}))}/></FRow>
            <FRow label="Time">
              <select style={inp} value={form.time} onChange={e => setForm(f=>({...f,time:e.target.value}))}>
                {["08:00","09:00","10:00","11:00","14:00","15:00","16:00"].map(t => <option key={t}>{t}</option>)}
              </select>
            </FRow>
          </div>
          <FRow label="Notes"><textarea style={{...inp,height:72,resize:"vertical"}} value={form.notes} onChange={e => setForm(f=>({...f,notes:e.target.value}))}/></FRow>
          <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
            <button className="dp-ghost" onClick={() => setAdd(false)}>Cancel</button>
            <button className="dp-btn-primary" onClick={create}>Send to Patient</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ===============================================================
   MY PATIENTS
================================================================ */
function DocPatients({ doctorId }) {
  const myAppts = apptDB.forDoctor(doctorId);
  const patientIds = [...new Set(myAppts.map(a => a.patientId))];
  const patients = patientDB.all().filter(p => patientIds.includes(p.id));

  return (
    <div className="dp-anim">
      <div className="dp-page-head"><div><h1 className="dp-title">My Patients</h1><p className="dp-sub">{patients.length} patients</p></div></div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:16 }}>
        {patients.length===0 && <div className="dp-card"><div className="dp-empty"><p>No patients yet.</p></div></div>}
        {patients.map(p => (
          <div key={p.id} className="dp-card">
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:10 }}>
              <Avatar name={p.name} size={44} src={p.avatar}/>
              <div>
                <div style={{ fontWeight:700, fontSize:15 }}>{p.name}</div>
                <div style={{ fontSize:12, color:"#64748b" }}>{p.email}</div>
              </div>
            </div>
            <div style={{ fontSize:13, color:"#64748b" }}>Blood: {p.bloodType || "—"}</div>
            <div style={{ fontSize:13, color:"#64748b" }}>Allergies: {p.allergies || "None"}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ===============================================================
   PRESCRIPTIONS
================================================================ */
function DocPrescriptions({ doctorId, doctor, toast }) {
  const [items, setItems] = useState([]);
  const [modal, setModal] = useState(false);
  const patients = patientDB.all().filter(p => p.status !== "deleted");
  const blank = { patientId:"", medication:"", dosage:"", duration:"", notes:"" };
  const [form, setForm] = useState(blank);
  const refresh = () => setItems(prescrDB.forDoctor(doctorId));
  useEffect(() => refresh(), [doctorId]);

  const submit = () => {
    if (!form.patientId || !form.medication) { toast("Fill required fields","error"); return; }
    const p = patients.find(x => x.id === form.patientId);
    prescrDB.add({
      ...form, id: uid(), doctorId, doctorName: doctor.name,
      patientId: form.patientId, patientName: p?.name,
      date: todayStr(), createdAt: now(),
    });
    pushNotif(p?.id, "prescription", `New Prescription from Dr. ${doctor.name}`,
      `${form.medication} - ${form.dosage} for ${form.duration}. View & download it in your Prescriptions tab.`);
    pushNotif("admin", "prescription", "Prescription Issued", `${doctor.name} prescribed ${form.medication} to ${p?.name}.`);
    toast("Prescription issued - patient notified!"); setForm(blank); setModal(false); refresh();
  };

  return (
    <div className="dp-anim">
      <div className="dp-page-head">
        <div><h1 className="dp-title">Prescriptions</h1><p className="dp-sub">{items.length} issued</p></div>
        <button className="dp-btn-primary" onClick={() => setModal(true)}>+ New Prescription</button>
      </div>
      <div className="dp-card">
        <div className="dp-tbl-wrap">
          <table className="dp-table">
            <thead><tr><th>Patient</th><th>Medication</th><th>Dosage</th><th>Duration</th><th>Date</th></tr></thead>
            <tbody>
              {items.length===0 && <tr><td colSpan={5} style={{textAlign:"center",padding:32,color:"#94a3b8"}}>No prescriptions yet.</td></tr>}
              {items.map(p => (
                <tr key={p.id}>
                  <td><div style={{ display:"flex", alignItems:"center", gap:8 }}><Avatar name={p.patientName} size={26}/>{p.patientName}</div></td>
                  <td style={{ fontWeight:700 }}>{p.medication}</td>
                  <td>{p.dosage}</td><td>{p.duration}</td><td>{p.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {modal && (
        <Modal title="New Prescription" onClose={() => setModal(false)}>
          <FRow label="Patient *">
            <select style={inp} value={form.patientId} onChange={e => setForm(f=>({...f,patientId:e.target.value}))}>
              <option value="">Select patient...</option>
              {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </FRow>
          <FRow label="Medication *"><input style={inp} value={form.medication} onChange={e => setForm(f=>({...f,medication:e.target.value}))}/></FRow>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <FRow label="Dosage"><input style={inp} value={form.dosage} onChange={e => setForm(f=>({...f,dosage:e.target.value}))}/></FRow>
            <FRow label="Duration"><input style={inp} value={form.duration} onChange={e => setForm(f=>({...f,duration:e.target.value}))}/></FRow>
          </div>
          <FRow label="Instructions"><textarea style={{...inp,height:72,resize:"vertical"}} value={form.notes} onChange={e => setForm(f=>({...f,notes:e.target.value}))}/></FRow>
          <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
            <button className="dp-ghost" onClick={() => setModal(false)}>Cancel</button>
            <button className="dp-btn-primary" onClick={submit}>Issue Prescription</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ===============================================================
   MEDICAL RECORDS
================================================================ */
function DocRecords({ doctorId, doctor, toast }) {
  const patients = patientDB.all().filter(p => p.status !== "deleted");
  const [selPat, setSelPat] = useState("");
  const [records, setRecords] = useState([]);
  const [modal, setModal] = useState(false);
  const blank = { title:"", type:"procedure", description:"" };
  const [form, setForm] = useState(blank);
  const TYPES = ["procedure","imaging","lab","prescription","note","diagnosis"];

  const refresh = () => { if (selPat) setRecords(recordDB.forPatient(selPat)); };
  useEffect(() => refresh(), [selPat]);

  const submit = () => {
    if (!selPat || !form.title) { toast("Select a patient and fill the title","error"); return; }
    const p = patients.find(x => x.id === selPat);
    recordDB.add({
      ...form, id: uid(), patientId: selPat, patientName: p?.name,
      doctorId, doctorName: doctor.name, date: todayStr(), createdAt: now(),
    });
    pushNotif(p?.id, "record", "New Medical Record",
      `Dr. ${doctor.name} added: ${form.title}. View & download it in your Medical Records tab.`);
    pushNotif("admin", "record", "Medical Record Added", `${doctor.name} added a record for ${p?.name}.`);
    toast("Record saved - patient notified!"); setForm(blank); setModal(false); refresh();
  };

  return (
    <div className="dp-anim">
      <div className="dp-page-head">
        <div><h1 className="dp-title">Medical Records</h1></div>
        <button className="dp-btn-primary" onClick={() => setModal(true)} style={{ opacity: selPat ? 1 : .5 }}>+ Add Record</button>
      </div>
      <div className="dp-card" style={{ marginBottom:16 }}>
        <FRow label="Select Patient">
          <select style={{ ...inp, maxWidth:320 }} value={selPat} onChange={e => setSelPat(e.target.value)}>
            <option value="">Choose a patient...</option>
            {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </FRow>
      </div>
      {selPat && (
        <div className="dp-card">
          {records.length===0
            ? <div className="dp-empty"><p>No records for this patient.</p></div>
            : records.map(r => (
              <div key={r.id} style={{ padding:"14px 0", borderBottom:"1px solid #e2e8f0" }}>
                <div style={{ display:"flex", justifyContent:"space-between", gap:8, flexWrap:"wrap" }}>
                  <div>
                    <div style={{ fontWeight:700, fontSize:15 }}>{r.title}</div>
                    <div style={{ fontSize:13, color:"#64748b", marginTop:4 }}>{r.description}</div>
                  </div>
                  <div style={{ display:"flex", gap:8 }}>
                    <Badge label={r.type} color="#1e88e5"/>
                    <span style={{ fontSize:12, color:"#94a3b8" }}>{r.date}</span>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}
      {modal && (
        <Modal title="Add Medical Record" onClose={() => setModal(false)}>
          <FRow label="Title *"><input style={inp} value={form.title} onChange={e => setForm(f=>({...f,title:e.target.value}))}/></FRow>
          <FRow label="Type">
            <select style={inp} value={form.type} onChange={e => setForm(f=>({...f,type:e.target.value}))}>
              {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </FRow>
          <FRow label="Description"><textarea style={{...inp,height:90,resize:"vertical"}} value={form.description} onChange={e => setForm(f=>({...f,description:e.target.value}))}/></FRow>
          <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
            <button className="dp-ghost" onClick={() => setModal(false)}>Cancel</button>
            <button className="dp-btn-primary" onClick={submit}>Save Record</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ===============================================================
   PAYMENTS
================================================================ */
function DocPayments({ doctorId }) {
  const items = payDB.forDoctor(doctorId);
  const totalPaid = items.filter(p => p.status==="paid").reduce((s,p) => s+p.amount, 0);

  return (
    <div className="dp-anim">
      <div className="dp-page-head"><div><h1 className="dp-title">Payments</h1><p className="dp-sub">Total earned: {fmtMoney(totalPaid)}</p></div></div>
      <div className="dp-card">
        <div className="dp-tbl-wrap">
          <table className="dp-table">
            <thead><tr><th>Patient</th><th>Service</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>
              {items.length===0 && <tr><td colSpan={5} style={{textAlign:"center",padding:32,color:"#94a3b8"}}>No payments yet.</td></tr>}
              {items.map(p => (
                <tr key={p.id}>
                  <td>{p.patientName}</td><td>{p.service}</td>
                  <td style={{ fontWeight:700 }}>{fmtMoney(p.amount)}</td>
                  <td><Badge label={p.status}/></td><td>{p.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ===============================================================
   MESSAGES - duplex chat, mirrors to admin via pushNotif inside Storage
================================================================ */
function DocMessages({ doctorId, doctor, toast, refreshBadges }) {
  const patients = patientDB.all().filter(p => p.status !== "deleted");
  const contacts = [{ id:"admin", name:"Administrator", role:"Admin" }, ...patients.map(p => ({ ...p, role:"Patient" }))];
  const [selId, setSelId] = useState("admin");
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const endRef = useRef(null);

  const loadMsgs = useCallback(() => {
    const all = msgDB.all();
    const thread = all.filter(m => (m.fromId===doctorId && m.toId===selId) || (m.fromId===selId && m.toId===doctorId))
      .sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt));
    setMsgs(thread);
    msgDB.all().filter(m => m.toId===doctorId && !m.read).forEach(m => msgDB.update(m.id,{read:true}));
    refreshBadges();
  }, [selId, doctorId]);

  useEffect(() => { loadMsgs(); }, [selId, doctorId]);
  useEffect(() => { const t = setInterval(loadMsgs, 1500); return () => clearInterval(t); }, [loadMsgs]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior:"smooth" }); }, [msgs]);

  const send = () => {
    if (!input.trim() || !selId) return;
    const sel = contacts.find(c => c.id === selId);
    msgDB.add({ id: uid(), fromId: doctorId, fromName: doctor.name, toId: selId, toName: sel?.name, body: input.trim(), read: false, createdAt: now() });
    pushNotif(selId, "message", `Message from Dr. ${doctor.name}`, input.trim());
    setInput(""); loadMsgs();
  };

  const selContact = contacts.find(c => c.id === selId);

  return (
    <div className="dp-anim">
      <div className="dp-page-head"><div><h1 className="dp-title">Messages</h1></div></div>
      <div className="dp-msg-layout">
        <div className="dp-msg-contacts">
          {contacts.map(c => (
            <div key={c.id} className={`dp-msg-contact${selId===c.id?" active":""}`} onClick={() => setSelId(c.id)}>
              <Avatar name={c.name} size={36} src={c.avatar}/>
              <div style={{ flex:1, overflow:"hidden" }}>
                <div style={{ fontWeight:700, fontSize:13, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{c.name}</div>
                <div style={{ fontSize:11, color:"#94a3b8" }}>{c.role}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="dp-msg-chat">
          {selContact && <>
            <div style={{ padding:"12px 16px", borderBottom:"1px solid #e2e8f0", display:"flex", alignItems:"center", gap:10 }}>
              <Avatar name={selContact.name} size={36} src={selContact.avatar}/>
              <div style={{ fontWeight:700, fontSize:14 }}>{selContact.name}</div>
            </div>
            <div className="dp-chat-msgs">
              {msgs.length===0 && <div className="dp-empty"><p>No messages yet.</p></div>}
              {msgs.map(m => {
                const isMe = m.fromId === doctorId;
                return (
                  <div key={m.id} style={{ display:"flex", flexDirection:"column", alignItems:isMe?"flex-end":"flex-start", marginBottom:8 }}>
                    <div style={{ background:isMe?"#00bfa5":"#f1f5f9", color:isMe?"#fff":"#0f172a", borderRadius:14, padding:"9px 14px", maxWidth:"72%", fontSize:13 }}>
                      {m.body}
                    </div>
                  </div>
                );
              })}
              <div ref={endRef}/>
            </div>
            <div style={{ padding:"10px 14px", borderTop:"1px solid #e2e8f0", display:"flex", gap:8 }}>
              <input style={{ ...inp, flex:1 }} placeholder="Type a message..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key==="Enter" && send()}/>
              <button className="dp-btn-primary" style={{ padding:"9px 16px" }} onClick={send}>Send</button>
            </div>
          </>}
        </div>
      </div>
    </div>
  );
}

/* ===============================================================
   NOTIFICATIONS
================================================================ */
function DocNotifications({ doctorId }) {
  const [items, setItems] = useState([]);
  const refresh = () => {
    const all = notifDB.all().filter(n => n.toId===doctorId).reverse();
    setItems(all);
    all.filter(n => !n.read).forEach(n => notifDB.update(n.id, { read:true }));
  };
  useEffect(() => { refresh(); const t = setInterval(refresh, 3000); return () => clearInterval(t); }, [doctorId]);

  return (
    <div className="dp-anim">
      <div className="dp-page-head"><div><h1 className="dp-title">Notifications</h1></div></div>
      <div className="dp-card">
        {items.length===0 && <div className="dp-empty"><p>No notifications yet.</p></div>}
        {items.map(n => (
          <div key={n.id} style={{ display:"flex", gap:14, padding:"14px 0", borderBottom:"1px solid #e2e8f0" }}>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:700, fontSize:14 }}>{n.title}</div>
              <div style={{ fontSize:13, color:"#64748b", marginTop:2 }}>{n.body}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ===============================================================
   PROFILE - photo upload + full editable form
================================================================ */
function DocProfile({ doctorId, doctor, toast, refreshBadges }) {
  const [form, setForm] = useState({
    name: doctor.name || "", email: doctor.email || "", phone: doctor.phone || "",
    specialty: doctor.specialty || "", bio: doctor.bio || "", location: doctor.location || "",
    consultFee: doctor.consultFee || 0,
  });
  const [avatar, setAvatar] = useState(doctor.avatar || "");
  const [pw, setPw] = useState({ newPw:"", confirm:"" });
  const fileRef = useRef(null);

  const handlePhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2*1024*1024) { toast("Image must be under 2MB","error"); return; }
    const reader = new FileReader();
    reader.onload = ev => {
      setAvatar(ev.target.result);
      doctorDB.update(doctorId, { avatar: ev.target.result });
      toast("Profile photo updated!");
    };
    reader.readAsDataURL(file);
  };

  const save = () => {
    doctorDB.update(doctorId, { ...form, avatar });
    pushNotif("admin", "doctor", "Doctor Profile Updated", `${form.name} updated their profile.`);
    toast("Profile saved!");
  };

  const changePw = () => {
    if (pw.newPw !== pw.confirm) { toast("Passwords don't match","error"); return; }
    if (pw.newPw.length < 6) { toast("Min 6 characters","error"); return; }
    doctorDB.update(doctorId, { password: pw.newPw });
    setPw({ newPw:"", confirm:"" });
    toast("Password changed!");
  };

  return (
    <div className="dp-anim">
      <div className="dp-page-head"><div><h1 className="dp-title">My Profile</h1></div></div>
      <div className="dp-two-col">
        <div className="dp-card" style={{ textAlign:"center" }}>
          <div style={{ position:"relative", width:90, height:90, margin:"0 auto 14px" }}>
            {avatar
              ? <img src={avatar} alt="" style={{ width:90, height:90, borderRadius:"50%", objectFit:"cover", border:"3px solid #e2e8f0" }}/>
              : <Avatar name={doctor.name} size={90}/>}
            <button onClick={() => fileRef.current?.click()} style={{ position:"absolute", bottom:0, right:0, width:28, height:28, borderRadius:"50%", background:"#1e88e5", color:"#fff", border:"2px solid #fff", cursor:"pointer", fontSize:11 }}>Edit</button>
            <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={handlePhoto}/>
          </div>
          <div style={{ fontWeight:700, fontSize:18 }}>{doctor.name}</div>
          <div style={{ fontSize:13, color:"#64748b" }}>{doctor.specialty}</div>
        </div>

        <div>
          <div className="dp-card">
            <FRow label="Full Name"><input style={inp} value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))}/></FRow>
            <FRow label="Email"><input style={inp} value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))}/></FRow>
            <FRow label="Phone"><input style={inp} value={form.phone} onChange={e => setForm(f=>({...f,phone:e.target.value}))}/></FRow>
            <FRow label="Specialty"><input style={inp} value={form.specialty} onChange={e => setForm(f=>({...f,specialty:e.target.value}))}/></FRow>
            <FRow label="Location"><input style={inp} value={form.location} onChange={e => setForm(f=>({...f,location:e.target.value}))}/></FRow>
            <FRow label="Consultation Fee (XAF)"><input style={inp} type="number" value={form.consultFee} onChange={e => setForm(f=>({...f,consultFee:Number(e.target.value)}))}/></FRow>
            <FRow label="Bio"><textarea style={{...inp,height:80,resize:"vertical"}} value={form.bio} onChange={e => setForm(f=>({...f,bio:e.target.value}))}/></FRow>
            <button className="dp-btn-primary" style={{ width:"100%" }} onClick={save}>Save Changes</button>
          </div>

          <div className="dp-card" style={{ marginTop:16 }}>
            <FRow label="New Password"><input style={inp} type="password" value={pw.newPw} onChange={e => setPw(p=>({...p,newPw:e.target.value}))}/></FRow>
            <FRow label="Confirm New Password"><input style={inp} type="password" value={pw.confirm} onChange={e => setPw(p=>({...p,confirm:e.target.value}))}/></FRow>
            <button className="dp-btn-primary" style={{ width:"100%" }} onClick={changePw}>Update Password</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===============================================================
   CSS
================================================================ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
:root{--sw:252px}
*{box-sizing:border-box;margin:0;padding:0}

.dp-sidebar{width:var(--sw);background:linear-gradient(180deg,#061529,#0d2347);display:flex;flex-direction:column;height:100vh;flex-shrink:0;overflow-y:auto;transition:transform .28s;position:relative;z-index:200}
.dp-brand{display:flex;align-items:center;gap:12px;padding:22px 18px 16px;border-bottom:1px solid rgba(255,255,255,.08);flex-shrink:0}
.dp-brand-orb{width:38px;height:38px;border-radius:10px;background:linear-gradient(135deg,#00bfa5,#0891b2);display:flex;align-items:center;justify-content:center;font-size:20px;color:#fff;font-weight:800}
.dp-nav{flex:1;padding:8px 0;overflow-y:auto}
.dp-nav-section{font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,255,255,.3);padding:12px 20px 5px}
.dp-nav-item{display:flex;align-items:center;gap:10px;width:100%;padding:9px 20px;background:none;border:none;cursor:pointer;color:rgba(255,255,255,.65);font-size:13.5px;font-family:inherit;text-align:left;transition:background .2s,color .2s}
.dp-nav-item:hover{background:rgba(255,255,255,.06);color:#fff}
.dp-nav-item.active{background:rgba(0,191,165,.2);color:#fff;border-right:3px solid #00bfa5}
.dp-nav-icon{font-size:11px;font-weight:700;width:28px;text-align:center;background:rgba(255,255,255,.08);border-radius:6px;padding:2px 0}
.dp-nav-badge{margin-left:auto;background:#f44336;color:#fff;border-radius:99px;font-size:10px;font-weight:700;padding:1px 6px}
.dp-logout{width:100%;padding:15px 20px;background:none;border:none;cursor:pointer;color:rgba(255,255,255,.5);font-size:13.5px;font-family:inherit;border-top:1px solid rgba(255,255,255,.08);text-align:left}
.dp-logout:hover{background:rgba(239,68,68,.15);color:#ff6b6b}

.dp-main{flex:1;display:flex;flex-direction:column;overflow:hidden}
.dp-topbar{height:58px;background:#fff;border-bottom:1px solid #e2e8f0;display:flex;align-items:center;gap:8px;padding:0 20px;flex-shrink:0}
.dp-hamburger{display:none;background:none;border:none;cursor:pointer;font-size:14px}
.dp-topbar-icon{position:relative;background:#f0f4f9;border:1px solid #e2e8f0;border-radius:8px;padding:6px 10px;cursor:pointer;font-size:11px;font-weight:700}
.dp-top-badge{position:absolute;top:-4px;right:-4px;background:#f44336;color:#fff;border-radius:99px;font-size:9px;font-weight:800;padding:1px 4px}
.dp-content{flex:1;overflow-y:auto;padding:24px}

.dp-anim{animation:dpFadeUp .35s ease}
@keyframes dpFadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}

.dp-page-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:24px;flex-wrap:wrap}
.dp-title{font-family:'Sora',sans-serif;font-weight:800;font-size:26px}
.dp-sub{font-size:13px;color:#64748b;margin-top:3px}

.dp-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px}
.dp-stat-card{background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:18px;border-left:4px solid var(--acc,#1e88e5)}

.dp-card{background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:20px}
.dp-card-head{margin-bottom:14px}
.dp-card-title{font-family:'Sora',sans-serif;font-weight:700;font-size:15px}
.dp-two-col{display:grid;grid-template-columns:1fr 1fr;gap:20px}
.dp-row{display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid #e2e8f0}
.dp-row:last-child{border-bottom:none}

.dp-tbl-wrap{overflow-x:auto;margin-top:10px}
.dp-table{width:100%;border-collapse:collapse;font-size:13.5px}
.dp-table th{text-align:left;padding:10px 12px;border-bottom:2px solid #e2e8f0;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase}
.dp-table td{padding:12px;border-bottom:1px solid #e2e8f0}

.dp-btn-primary{background:linear-gradient(135deg,#1e88e5,#42a5f5);color:#fff;border:none;border-radius:10px;padding:10px 20px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit}
.dp-ghost{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:6px 12px;font-size:12px;font-weight:600;cursor:pointer;color:#0f172a;font-family:inherit}
.dp-filter-tabs{display:flex;gap:4px;margin-bottom:8px}
.dp-filter-tab{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:6px 12px;font-size:13px;font-weight:600;cursor:pointer;color:#64748b;font-family:inherit}
.dp-filter-tab.active{background:#1e88e5;color:#fff;border-color:#1e88e5}

.dp-msg-layout{display:grid;grid-template-columns:240px 1fr;gap:16px;height:540px}
.dp-msg-contacts{background:#fff;border:1px solid #e2e8f0;border-radius:16px;overflow-y:auto}
.dp-msg-contact{display:flex;align-items:center;gap:10px;padding:12px 14px;cursor:pointer;border-bottom:1px solid #e2e8f0}
.dp-msg-contact:hover{background:#f8fafc}
.dp-msg-contact.active{background:rgba(30,136,229,.06);border-left:3px solid #1e88e5}
.dp-msg-chat{background:#fff;border:1px solid #e2e8f0;border-radius:16px;display:flex;flex-direction:column;overflow:hidden}
.dp-chat-msgs{flex:1;overflow-y:auto;padding:14px}

.dp-empty{text-align:center;padding:40px;color:#94a3b8}
.dp-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:100}

@media(max-width:960px){
  .dp-stats{grid-template-columns:1fr 1fr}
  .dp-two-col{grid-template-columns:1fr}
  .dp-msg-layout{grid-template-columns:1fr;height:auto}
}
@media(max-width:640px){
  .dp-sidebar{position:fixed;left:0;top:0;transform:translateX(-100%);height:100vh;z-index:300}
  .dp-sidebar.open{transform:translateX(0)}
  .dp-overlay{display:block}
  .dp-hamburger{display:flex!important}
  .dp-stats{grid-template-columns:1fr}
  .dp-content{padding:14px}
}
`;