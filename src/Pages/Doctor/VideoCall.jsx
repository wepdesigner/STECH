// /**
//  * VideoCall.jsx — ToothEase
//  * Shared Video Consultation Room
//  *
//  * Used by both PatientPanel and DoctorPanel.
//  * Simulates WebRTC UI (real WebRTC requires a signalling server).
//  * Includes: camera/mic toggles, screen share UI, live chat, notes, timer, whiteboard.
//  *
//  * Props:
//  *   consultation  — the consultation object { id, doctorId, doctorName, patientId, patientName, type }
//  *   localUser     — { id, name, role: "doctor"|"patient" }
//  *   onEnd()       — called when session ends
//  */
// import { useState, useEffect, useRef, useCallback } from "react";

// /* ── Shared storage (same as panels) ── */
// const LS = {
//   get: (k, d = []) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
//   set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
// };
// const uid    = () => Math.random().toString(36).slice(2, 10);
// const nowISO = () => new Date().toISOString();
// const msgDB  = { all: () => LS.get("te_vc_messages", []), add: (o) => { const r = LS.get("te_vc_messages",[]); r.push(o); LS.set("te_vc_messages", r); return o; } };

// const DOCTOR_REPLIES = [
//   "I can see your concern — let me explain the treatment plan.",
//   "Based on what you've described, I recommend we schedule a follow-up.",
//   "Please open wide so I can get a better look.",
//   "The treatment should take about 45 minutes in total.",
//   "You're recovering very well — continue the medication.",
//   "I'll prescribe something for the discomfort. Take it after meals.",
//   "That's completely normal after the procedure. No need to worry.",
//   "Let's book you in for a cleaning as well this month.",
// ];
// const PATIENT_REPLIES = [
//   "Thank you Doctor, that makes sense.",
//   "Should I avoid certain foods?",
//   "The pain has reduced since yesterday.",
//   "When should I come back for the follow-up?",
//   "Is this normal? I'm a bit worried.",
// ];

// export default function VideoCall({ consultation, localUser, onEnd }) {
//   const isDoctor   = localUser.role === "doctor";
//   const peerName   = isDoctor ? consultation.patientName : consultation.doctorName;
//   const sessionKey = `vc_${consultation.id}`;

//   /* ── State ── */
//   const [micOn,   setMic]    = useState(true);
//   const [camOn,   setCam]    = useState(true);
//   const [sharing, setShare]  = useState(false);
//   const [pinned,  setPinned] = useState("peer");  // "self" | "peer"
//   const [layout,  setLayout] = useState("side");  // "side" | "pip" | "chat-only"
//   const [tab,     setTab]    = useState("chat");   // "chat" | "notes" | "files"
//   const [msgs,    setMsgs]   = useState([]);
//   const [input,   setInput]  = useState("");
//   const [notes,   setNotes]  = useState(LS.get(`${sessionKey}_notes`, ""));
//   const [secs,    setSecs]   = useState(0);
//   const [quality, setQuality]= useState("HD");
//   const [typing,  setTyping] = useState(false);
//   const [peerOn,  setPeerOn] = useState(true);   // simulates peer connection state
//   const [raised,  setRaised] = useState(false);  // hand raise
//   const chatRef = useRef(null);
//   const inputRef = useRef(null);

//   /* ── System init message ── */
//   useEffect(() => {
//     const sysMsg = { id: uid(), consultationId: consultation.id, fromId: "system", fromName: "System", body: `Session started — ${consultation.type || "Video"} call between ${consultation.doctorName} and ${consultation.patientName}`, ts: nowISO() };
//     msgDB.add(sysMsg);
//     loadMsgs();

//     // Simulate peer joining after 1.5s
//     setTimeout(() => {
//       const joinMsg = { id: uid(), consultationId: consultation.id, fromId: "system", fromName: "System", body: `${peerName} joined the call. 🟢`, ts: nowISO() };
//       msgDB.add(joinMsg);
//       loadMsgs();
//     }, 1500);

//     // Timer
//     const timer = setInterval(() => setSecs(s => s + 1), 1000);

//     // Simulate peer sends a greeting after 2.5s
//     setTimeout(() => {
//       const greet = isDoctor
//         ? `Hello ${consultation.patientName.split(" ")[0]}! I can see you clearly. How are you feeling today?`
//         : `Hello ${consultation.doctorName.split(" ").slice(-1)[0]}! Thank you for accepting my call.`;
//       const autoMsg = { id: uid(), consultationId: consultation.id, fromId: isDoctor ? consultation.patientId : consultation.doctorId, fromName: peerName, body: greet, ts: nowISO() };
//       msgDB.add(autoMsg);
//       loadMsgs();
//     }, 2500);

//     return () => clearInterval(timer);
//   }, []);

//   /* ── Polling for new messages (simulates real-time) ── */
//   const loadMsgs = useCallback(() => {
//     const all = msgDB.all().filter(m => m.consultationId === consultation.id);
//     setMsgs([...all]);
//     setTimeout(() => chatRef.current?.scrollTo(0, chatRef.current.scrollHeight), 50);
//   }, [consultation.id]);

//   useEffect(() => {
//     const t = setInterval(loadMsgs, 1500);
//     return () => clearInterval(t);
//   }, [loadMsgs]);

//   /* ── Send message ── */
//   const send = () => {
//     if (!input.trim()) return;
//     const m = { id: uid(), consultationId: consultation.id, fromId: localUser.id, fromName: localUser.name, body: input.trim(), ts: nowISO() };
//     msgDB.add(m);
//     setInput("");
//     loadMsgs();

//     // Simulate auto-reply from peer after 1.5–3s
//     const replies = isDoctor ? PATIENT_REPLIES : DOCTOR_REPLIES;
//     setTyping(true);
//     setTimeout(() => {
//       const reply = { id: uid(), consultationId: consultation.id, fromId: isDoctor ? consultation.patientId : consultation.doctorId, fromName: peerName, body: replies[Math.floor(Math.random() * replies.length)], ts: nowISO() };
//       msgDB.add(reply);
//       setTyping(false);
//       loadMsgs();
//     }, 1500 + Math.random() * 1500);
//   };

//   /* ── Save notes ── */
//   const saveNotes = (v) => { setNotes(v); LS.set(`${sessionKey}_notes`, v); };

//   /* ── Helpers ── */
//   const fmtTime = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

//   /* ── Avatar tile ── */
//   function VideoTile({ name, isSelf, camActive, muted: isMuted, label, large }) {
//     const COLORS = ["#1e88e5","#00bfa5","#7c3aed","#f44336","#ff7043","#0891b2"];
//     const color = COLORS[(name?.charCodeAt(0) || 0) % COLORS.length];
//     const ini = name?.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "?";
//     return (
//       <div style={{ position: "relative", borderRadius: 14, overflow: "hidden", background: camActive ? "#111827" : "#0d1117", display: "flex", alignItems: "center", justifyContent: "center", border: isSelf ? "2px solid #00bfa5" : "2px solid rgba(255,255,255,.1)", height: "100%" }}>
//         {camActive ? (
//           <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
//             <div style={{ width: large ? 80 : 48, height: large ? 80 : 48, borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: large ? 32 : 18, fontWeight: 800, color: "#fff", fontFamily: "'DM Sans',sans-serif", boxShadow: `0 0 0 3px ${color}44` }}>
//               {ini}
//             </div>
//             <div style={{ width: large ? 120 : 60, height: large ? 3 : 2, background: `linear-gradient(90deg, transparent, ${color}, transparent)`, borderRadius: 99, animation: "audioBar 1.2s ease-in-out infinite" }}/>
//           </div>
//         ) : (
//           <div style={{ textAlign: "center", color: "rgba(255,255,255,.3)" }}>
//             <div style={{ fontSize: large ? 36 : 22 }}>📷</div>
//             <div style={{ fontSize: 11, marginTop: 4 }}>Camera off</div>
//           </div>
//         )}
//         {/* Name label */}
//         <div style={{ position: "absolute", bottom: 8, left: 10, display: "flex", alignItems: "center", gap: 5, background: "rgba(0,0,0,.6)", borderRadius: 6, padding: "3px 8px" }}>
//           {isMuted && <span style={{ fontSize: 11 }}>🔇</span>}
//           <span style={{ fontSize: 11, color: "#fff", fontWeight: 600 }}>{label || name}</span>
//         </div>
//         {isSelf && <div style={{ position: "absolute", top: 8, right: 8, background: "#00bfa5", color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4 }}>You</div>}
//       </div>
//     );
//   }

//   return (
//     <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#060d1a", fontFamily: "'DM Sans', system-ui, sans-serif", color: "#fff" }}>

//       <style>{`
//         @keyframes audioBar { 0%,100%{transform:scaleX(.4);opacity:.5} 50%{transform:scaleX(1);opacity:1} }
//         @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
//         .vc-ctrl-btn { width:52px;height:52px;border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:20px;transition:transform .15s,background .15s; }
//         .vc-ctrl-btn:hover { transform:scale(1.08); }
//         .vc-tab-btn { padding:8px 16px;border:none;border-radius:8px;cursor:pointer;font-size:13px;font-weight:700;font-family:inherit;transition:all .18s; }
//         .vc-msg-input { background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);border-radius:10px;padding:10px 14px;color:#fff;font-size:13.5px;font-family:inherit;outline:none;width:100%;box-sizing:border-box; }
//         .vc-msg-input:focus { border-color:#00bfa5; }
//         .vc-notes { background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:12px;color:rgba(255,255,255,.85);font-family:'DM Sans',sans-serif;font-size:13px;line-height:1.7;resize:none;outline:none;width:100%;box-sizing:border-box; }
//         .vc-notes:focus { border-color:#00bfa5; }
//         ::-webkit-scrollbar { width:4px; }
//         ::-webkit-scrollbar-track { background:transparent; }
//         ::-webkit-scrollbar-thumb { background:rgba(255,255,255,.15);border-radius:99px; }
//       `}</style>

//       {/* ── TOP BAR ── */}
//       <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", background: "rgba(255,255,255,.04)", borderBottom: "1px solid rgba(255,255,255,.08)", flexShrink: 0, gap: 12, flexWrap: "wrap" }}>
//         <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
//           {/* Live badge */}
//           <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(239,68,68,.15)", border: "1px solid rgba(239,68,68,.3)", borderRadius: 20, padding: "5px 14px" }}>
//             <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#ef4444", animation: "pulse 1s infinite" }}/>
//             <span style={{ fontSize: 11, fontWeight: 800, color: "#ef4444", letterSpacing: .5 }}>LIVE</span>
//           </div>
//           <div>
//             <div style={{ fontWeight: 700, fontSize: 14 }}>{peerName}</div>
//             <div style={{ fontSize: 11, color: "rgba(255,255,255,.45)" }}>{consultation.type || "Video"} consultation</div>
//           </div>
//           {/* Timer */}
//           <div style={{ background: "rgba(0,191,165,.12)", border: "1px solid rgba(0,191,165,.25)", borderRadius: 8, padding: "5px 12px", fontFamily: "'DM Mono',monospace,sans-serif", fontWeight: 700, fontSize: 15, color: "#00bfa5", letterSpacing: 1 }}>
//             {fmtTime(secs)}
//           </div>
//           {/* Quality badge */}
//           <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,.4)", background: "rgba(255,255,255,.06)", padding: "4px 10px", borderRadius: 6 }}>
//             📶 {quality}
//           </div>
//           {raised && <div style={{ background: "rgba(251,191,36,.2)", border: "1px solid rgba(251,191,36,.4)", borderRadius: 8, padding: "4px 10px", fontSize: 12, fontWeight: 700, color: "#fbbf24" }}>✋ Hand raised</div>}
//         </div>

//         {/* Layout switcher */}
//         <div style={{ display: "flex", gap: 6 }}>
//           {[["side","⊟ Side by side"],["pip","▣ Picture-in-picture"],["chat-only","💬 Chat only"]].map(([l, lbl]) => (
//             <button key={l} onClick={() => setLayout(l)} style={{ background: layout === l ? "rgba(0,191,165,.2)" : "rgba(255,255,255,.06)", border: `1px solid ${layout === l ? "rgba(0,191,165,.5)" : "rgba(255,255,255,.1)"}`, borderRadius: 8, padding: "6px 12px", color: layout === l ? "#00bfa5" : "rgba(255,255,255,.5)", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
//               {lbl}
//             </button>
//           ))}
//         </div>
//       </div>

//       {/* ── MAIN BODY ── */}
//       <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>

//         {/* Video area */}
//         {layout !== "chat-only" && (
//           <div style={{ flex: layout === "side" ? "1 1 60%" : "1 1 70%", position: "relative", background: "#0a0f1a", display: "flex", gap: 8, padding: 12, minWidth: 0 }}>
//             {layout === "side" ? (
//               /* Side-by-side */
//               <>
//                 <div style={{ flex: 1, minHeight: 0 }}>
//                   <VideoTile name={peerName} camActive={peerOn} large label={peerName} />
//                 </div>
//                 <div style={{ flex: 1, minHeight: 0 }}>
//                   <VideoTile name={localUser.name} isSelf camActive={camOn} muted={!micOn} large label="You" />
//                 </div>
//               </>
//             ) : (
//               /* PiP */
//               <div style={{ position: "relative", width: "100%", height: "100%" }}>
//                 <VideoTile name={peerName} camActive={peerOn} large label={peerName} />
//                 <div style={{ position: "absolute", bottom: 16, right: 16, width: 160, height: 110, borderRadius: 12, overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,.5)" }}>
//                   <VideoTile name={localUser.name} isSelf camActive={camOn} muted={!micOn} label="You" />
//                 </div>
//               </div>
//             )}

//             {/* Sharing banner */}
//             {sharing && (
//               <div style={{ position: "absolute", top: 20, left: "50%", transform: "translateX(-50%)", background: "rgba(0,191,165,.9)", color: "#fff", borderRadius: 10, padding: "8px 20px", fontSize: 13, fontWeight: 700 }}>
//                 🖥️ You are sharing your screen
//               </div>
//             )}
//           </div>
//         )}

//         {/* Sidebar panel: chat / notes */}
//         <div style={{ width: layout === "chat-only" ? "100%" : 320, flexShrink: 0, display: "flex", flexDirection: "column", background: "rgba(255,255,255,.03)", borderLeft: "1px solid rgba(255,255,255,.07)", minHeight: 0 }}>

//           {/* Panel tabs */}
//           <div style={{ display: "flex", gap: 4, padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,.07)", flexShrink: 0 }}>
//             {[["chat","💬 Chat"],["notes","📋 Notes"]].map(([k,lbl]) => (
//               <button key={k} className="vc-tab-btn" onClick={() => setTab(k)} style={{ background: tab === k ? "rgba(0,191,165,.2)" : "transparent", color: tab === k ? "#00bfa5" : "rgba(255,255,255,.45)", border: `1px solid ${tab === k ? "rgba(0,191,165,.4)" : "transparent"}` }}>
//                 {lbl}
//               </button>
//             ))}
//             <div style={{ marginLeft: "auto", fontSize: 12, color: "rgba(255,255,255,.3)", alignSelf: "center" }}>{msgs.filter(m=>m.fromId!=="system").length} msgs</div>
//           </div>

//           {/* Chat tab */}
//           {tab === "chat" && (
//             <>
//               <div ref={chatRef} style={{ flex: 1, overflowY: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10, minHeight: 0 }}>
//                 {msgs.map(m => {
//                   const isMe = m.fromId === localUser.id;
//                   const isSys = m.fromId === "system";
//                   if (isSys) return (
//                     <div key={m.id} style={{ textAlign: "center", fontSize: 11, color: "rgba(255,255,255,.3)", background: "rgba(255,255,255,.04)", borderRadius: 6, padding: "5px 10px" }}>{m.body}</div>
//                   );
//                   return (
//                     <div key={m.id} style={{ display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start" }}>
//                       <div style={{ background: isMe ? "linear-gradient(135deg,#00bfa5,#0891b2)" : "rgba(255,255,255,.10)", color: "#fff", borderRadius: isMe ? "14px 14px 4px 14px" : "14px 14px 14px 4px", padding: "9px 13px", maxWidth: "82%", fontSize: 13.5, lineHeight: 1.55, wordBreak: "break-word" }}>
//                         {!isMe && <div style={{ fontSize: 10, fontWeight: 700, color: "#00bfa5", marginBottom: 3 }}>{m.fromName}</div>}
//                         {m.body}
//                       </div>
//                       <span style={{ fontSize: 10, color: "rgba(255,255,255,.28)", marginTop: 3 }}>
//                         {new Date(m.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
//                       </span>
//                     </div>
//                   );
//                 })}
//                 {typing && (
//                   <div style={{ display: "flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,.4)", fontSize: 12 }}>
//                     <div style={{ display: "flex", gap: 3 }}>
//                       {[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "#00bfa5", animation: `pulse ${.8+i*.15}s ease-in-out infinite`, animationDelay: `${i*.15}s` }}/>)}
//                     </div>
//                     {peerName} is typing…
//                   </div>
//                 )}
//               </div>
//               <div style={{ padding: "10px 12px", borderTop: "1px solid rgba(255,255,255,.07)", display: "flex", gap: 8, flexShrink: 0 }}>
//                 <input ref={inputRef} className="vc-msg-input" placeholder="Type a message…" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())} />
//                 <button onClick={send} disabled={!input.trim()} style={{ background: "linear-gradient(135deg,#00bfa5,#0891b2)", border: "none", borderRadius: 10, padding: "10px 14px", color: "#fff", fontWeight: 800, cursor: "pointer", fontSize: 16, flexShrink: 0, opacity: input.trim() ? 1 : .4 }}>
//                   ➤
//                 </button>
//               </div>
//             </>
//           )}

//           {/* Notes tab */}
//           {tab === "notes" && (
//             <div style={{ flex: 1, padding: 14, display: "flex", flexDirection: "column", gap: 10, minHeight: 0, overflow: "hidden" }}>
//               <div style={{ fontSize: 12, color: "rgba(255,255,255,.35)", fontWeight: 600 }}>
//                 {isDoctor ? "Clinical notes (saved automatically)" : "Personal notes from this session"}
//               </div>
//               <textarea className="vc-notes" style={{ flex: 1, minHeight: 0 }} placeholder={isDoctor ? "Findings, treatment notes, follow-up instructions…" : "Questions to ask, medication reminders, next steps…"} value={notes} onChange={e => saveNotes(e.target.value)} />
//               <div style={{ fontSize: 11, color: "rgba(255,255,255,.25)" }}>Auto-saved • {notes.length} chars</div>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* ── CONTROL BAR ── */}
//       <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: "14px 20px", background: "rgba(255,255,255,.04)", borderTop: "1px solid rgba(255,255,255,.08)", flexShrink: 0, flexWrap: "wrap" }}>

//         {/* Mic */}
//         <button className="vc-ctrl-btn" onClick={() => setMic(m => !m)} title={micOn ? "Mute" : "Unmute"} style={{ background: micOn ? "rgba(255,255,255,.1)" : "rgba(239,68,68,.25)", color: micOn ? "#fff" : "#ef4444" }}>
//           {micOn ? "🎙️" : "🔇"}
//         </button>

//         {/* Camera */}
//         <button className="vc-ctrl-btn" onClick={() => setCam(c => !c)} title={camOn ? "Turn off camera" : "Turn on camera"} style={{ background: camOn ? "rgba(255,255,255,.1)" : "rgba(239,68,68,.25)", color: camOn ? "#fff" : "#ef4444" }}>
//           {camOn ? "📹" : "📷"}
//         </button>

//         {/* Screen share */}
//         <button className="vc-ctrl-btn" onClick={() => setShare(s => !s)} title={sharing ? "Stop sharing" : "Share screen"} style={{ background: sharing ? "rgba(0,191,165,.25)" : "rgba(255,255,255,.1)", color: sharing ? "#00bfa5" : "#fff" }}>
//           🖥️
//         </button>

//         {/* Hand raise */}
//         <button className="vc-ctrl-btn" onClick={() => setRaised(r => !r)} title="Raise hand" style={{ background: raised ? "rgba(251,191,36,.25)" : "rgba(255,255,255,.1)", color: raised ? "#fbbf24" : "#fff" }}>
//           ✋
//         </button>

//         {/* Quality toggle */}
//         <button className="vc-ctrl-btn" onClick={() => setQuality(q => q === "HD" ? "SD" : "HD")} title="Toggle quality" style={{ background: "rgba(255,255,255,.1)", color: "#fff", fontSize: 13, fontWeight: 800, fontFamily: "inherit", borderRadius: 12, width: 52, height: 52 }}>
//           {quality}
//         </button>

//         {/* End call */}
//         <button className="vc-ctrl-btn" onClick={onEnd} style={{ background: "#ef4444", color: "#fff", width: 64, height: 52, borderRadius: 14, fontSize: 16, fontWeight: 800, fontFamily: "inherit" }}>
//           📵 End
//         </button>
//       </div>
//     </div>
//   );
// }






/**
 * VideoCall.jsx — ToothEase
 * Real shared video room. Both patient AND doctor read/write
 * from the same VideoSessionBus (localStorage message bus at 800ms).
 *
 * Props:
 *   consultation  — { id, doctorId, doctorName, patientId, patientName }
 *   localUser     — { id, name, role: "doctor"|"patient" }
 *   onEnd()
 */
// import { useState, useEffect, useRef, useCallback } from "react";
// import { VideoSessionBus, pushNotif, nowISO } from "./Shared";

// export default function VideoCall({ consultation, localUser, onEnd }) {
//   const isDoctor = localUser.role === "doctor";
//   const peerName = isDoctor ? consultation.patientName : consultation.doctorName;
//   const peerId   = isDoctor ? consultation.patientId   : consultation.doctorId;

//   const [session,  setSession] = useState(null);
//   const [msgs,     setMsgs]    = useState([]);
//   const [input,    setInput]   = useState("");
//   const [micOn,    setMic]     = useState(true);
//   const [camOn,    setCam]     = useState(true);
//   const [sharing,  setShare]   = useState(false);
//   const [raised,   setRaised]  = useState(false);
//   const [layout,   setLayout]  = useState("side");
//   const [tab,      setTab]     = useState("chat");
//   const [notes,    setNotes]   = useState("");
//   const [secs,     setSecs]    = useState(0);
//   const [peerOn,   setPeerOn]  = useState(false);
//   const chatRef  = useRef(null);
//   const inputRef = useRef(null);
//   const pollRef  = useRef(null);
//   const timerRef = useRef(null);

//   useEffect(() => {
//     const s = VideoSessionBus.start(
//       consultation.id, consultation.doctorId, consultation.patientId
//     );
//     setSession(s);

//     VideoSessionBus.send(
//       s.id, localUser.id, localUser.name, localUser.role,
//       `${localUser.name} joined the call.`
//     );

//     pushNotif(peerId, "consultation",
//       `📹 ${localUser.name} joined the video call`,
//       "Open Consultations → Join Video to connect."
//     );
//     pushNotif("admin", "consultation", "Video Call Active",
//       `${consultation.doctorName} ↔ ${consultation.patientName} session started.`
//     );

//     const saved = localStorage.getItem(`vc_notes_${s.id}`);
//     if (saved) setNotes(saved);

//     timerRef.current = setInterval(() => setSecs(x => x + 1), 1000);
//     return () => {
//       clearInterval(timerRef.current);
//       clearInterval(pollRef.current);
//     };
//   }, []);

//   const loadMsgs = useCallback(() => {
//     if (!session) return;
//     const all = VideoSessionBus.getMessages(session.id);
//     setMsgs([...all]);
//     if (all.some(m => m.fromId === peerId)) setPeerOn(true);
//     setTimeout(() => chatRef.current?.scrollTo(0, chatRef.current.scrollHeight), 30);
//   }, [session, peerId]);

//   useEffect(() => {
//     if (!session) return;
//     loadMsgs();
//     pollRef.current = setInterval(loadMsgs, 800);
//     const h = () => loadMsgs();
//     window.addEventListener("te_vc_msg", h);
//     return () => { clearInterval(pollRef.current); window.removeEventListener("te_vc_msg", h); };
//   }, [session, loadMsgs]);

//   const send = () => {
//     if (!input.trim() || !session) return;
//     VideoSessionBus.send(session.id, localUser.id, localUser.name, localUser.role, input.trim());
//     setInput("");
//     inputRef.current?.focus();
//   };

//   const saveNotes = (v) => {
//     setNotes(v);
//     if (session) localStorage.setItem(`vc_notes_${session.id}`, v);
//   };

//   const handleEnd = () => {
//     if (session) {
//       VideoSessionBus.sendSystem(session.id, `${localUser.name} ended the session.`);
//       VideoSessionBus.end(session.id);
//     }
//     pushNotif(peerId, "consultation", "📹 Video call ended",
//       `${localUser.name} ended the session.`);
//     pushNotif("admin", "consultation", "Video Session Ended",
//       `${consultation.doctorName} ↔ ${consultation.patientName} completed.`);
//     onEnd();
//   };

//   const fmtTime = (s) =>
//     `${String(Math.floor(s / 60)).padStart(2,"0")}:${String(s % 60).padStart(2,"0")}`;

//   function Tile({ name, self: isSelf, active, muted: m, large }) {
//     const COLORS = ["#1e88e5","#00bfa5","#7c3aed","#f44336","#ff7043","#0891b2"];
//     const color  = COLORS[(name?.charCodeAt(0)||0) % COLORS.length];
//     const ini    = name?.split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2)||"?";
//     return (
//       <div style={{ position:"relative", borderRadius:14, overflow:"hidden",
//         background:active?"#111827":"#0d1117",
//         display:"flex", alignItems:"center", justifyContent:"center",
//         border:`2px solid ${isSelf?"#00bfa5":"rgba(255,255,255,.1)"}`,
//         height:"100%", width:"100%" }}>
//         {active ? (
//           <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:10 }}>
//             <div style={{ width:large?88:52, height:large?88:52, borderRadius:"50%",
//               background:color, display:"flex", alignItems:"center", justifyContent:"center",
//               fontSize:large?34:20, fontWeight:800, color:"#fff",
//               boxShadow:`0 0 0 4px ${color}33` }}>{ini}</div>
//             <div style={{ width:large?140:70, height:3,
//               background:`linear-gradient(90deg,transparent,${color},transparent)`,
//               borderRadius:99, animation:"audioBar 1.2s ease-in-out infinite" }}/>
//           </div>
//         ) : (
//           <div style={{ textAlign:"center", color:"rgba(255,255,255,.3)" }}>
//             <div style={{ fontSize:large?36:22 }}>📷</div>
//             <div style={{ fontSize:10, marginTop:4 }}>Camera off</div>
//           </div>
//         )}
//         <div style={{ position:"absolute", bottom:8, left:10,
//           background:"rgba(0,0,0,.65)", borderRadius:6, padding:"3px 8px",
//           display:"flex", alignItems:"center", gap:5 }}>
//           {m && <span style={{ fontSize:10 }}>🔇</span>}
//           <span style={{ fontSize:11, color:"#fff", fontWeight:600 }}>{isSelf?"You":name}</span>
//         </div>
//         {isSelf && <div style={{ position:"absolute", top:8, right:8,
//           background:"#00bfa5", color:"#fff", fontSize:9, fontWeight:800,
//           padding:"2px 7px", borderRadius:5 }}>YOU</div>}
//         {!isSelf && !peerOn && (
//           <div style={{ position:"absolute", top:8, left:8,
//             background:"rgba(251,191,36,.18)", border:"1px solid rgba(251,191,36,.35)",
//             borderRadius:6, padding:"3px 8px", fontSize:10, color:"#fbbf24", fontWeight:700 }}>
//             ⏳ Waiting…
//           </div>
//         )}
//       </div>
//     );
//   }

//   return (
//     <div style={{ display:"flex", flexDirection:"column", height:"100vh",
//       background:"#060d1a", fontFamily:"'DM Sans',system-ui,sans-serif", color:"#fff" }}>
//       <style>{`
//         @keyframes audioBar{0%,100%{transform:scaleX(.3);opacity:.4}50%{transform:scaleX(1);opacity:1}}
//         @keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}
//         .vc-b{border:none;cursor:pointer;font-family:inherit;transition:all .18s;}
//         .vc-c{width:50px;height:50px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;}
//         .vc-t{padding:7px 14px;border-radius:8px;font-size:12px;font-weight:700;}
//         .vc-i{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);border-radius:10px;padding:10px 14px;color:#fff;font-size:13.5px;font-family:inherit;outline:none;width:100%;box-sizing:border-box;}
//         .vc-i:focus{border-color:#00bfa5;}
//         .vc-n{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:12px;color:rgba(255,255,255,.85);font-family:'DM Sans',sans-serif;font-size:13px;line-height:1.7;resize:none;outline:none;width:100%;box-sizing:border-box;}
//         .vc-n:focus{border-color:#00bfa5;}
//         ::-webkit-scrollbar{width:3px;}
//         ::-webkit-scrollbar-thumb{background:rgba(255,255,255,.12);border-radius:99px;}
//       `}</style>

//       {/* TOP BAR */}
//       <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
//         padding:"11px 18px", background:"rgba(255,255,255,.04)",
//         borderBottom:"1px solid rgba(255,255,255,.07)", flexShrink:0, gap:10, flexWrap:"wrap" }}>
//         <div style={{ display:"flex", alignItems:"center", gap:12 }}>
//           <div style={{ display:"flex", alignItems:"center", gap:6,
//             background:"rgba(239,68,68,.15)", border:"1px solid rgba(239,68,68,.3)",
//             borderRadius:20, padding:"4px 12px" }}>
//             <div style={{ width:7, height:7, borderRadius:"50%",
//               background:"#ef4444", animation:"pulse 1s infinite" }}/>
//             <span style={{ fontSize:11, fontWeight:800, color:"#ef4444" }}>LIVE</span>
//           </div>
//           <div>
//             <div style={{ fontWeight:700, fontSize:14 }}>{peerName}</div>
//             <div style={{ fontSize:11, color:peerOn?"#00bfa5":"rgba(255,255,255,.35)" }}>
//               {peerOn ? "🟢 Connected" : "⏳ Waiting for peer…"}
//             </div>
//           </div>
//           <div style={{ background:"rgba(0,191,165,.12)", border:"1px solid rgba(0,191,165,.2)",
//             borderRadius:8, padding:"5px 12px", fontWeight:800, fontSize:15, color:"#00bfa5",
//             letterSpacing:1 }}>
//             {fmtTime(secs)}
//           </div>
//         </div>
//         <div style={{ display:"flex", gap:5 }}>
//           {[["side","⊟ Side"],["pip","▣ PiP"],["chat-only","💬 Chat"]].map(([l,lbl]) => (
//             <button key={l} className="vc-b vc-t" onClick={() => setLayout(l)}
//               style={{ background:layout===l?"rgba(0,191,165,.2)":"rgba(255,255,255,.06)",
//                 border:`1px solid ${layout===l?"rgba(0,191,165,.4)":"rgba(255,255,255,.1)"}`,
//                 color:layout===l?"#00bfa5":"rgba(255,255,255,.4)" }}>
//               {lbl}
//             </button>
//           ))}
//         </div>
//       </div>

//       {/* BODY */}
//       <div style={{ flex:1, display:"flex", overflow:"hidden", minHeight:0 }}>

//         {layout !== "chat-only" && (
//           <div style={{ flex:"1 1 60%", background:"#0a0f1a",
//             display:"flex", gap:8, padding:10, minWidth:0, position:"relative" }}>
//             {layout === "side" ? (
//               <>
//                 <div style={{ flex:1, minHeight:0 }}>
//                   <Tile name={peerName} active={peerOn} large />
//                 </div>
//                 <div style={{ flex:1, minHeight:0 }}>
//                   <Tile name={localUser.name} self active={camOn} muted={!micOn} large />
//                 </div>
//               </>
//             ) : (
//               <div style={{ position:"relative", width:"100%", height:"100%" }}>
//                 <Tile name={peerName} active={peerOn} large />
//                 <div style={{ position:"absolute", bottom:14, right:14,
//                   width:150, height:100, borderRadius:10, overflow:"hidden",
//                   boxShadow:"0 8px 32px rgba(0,0,0,.5)" }}>
//                   <Tile name={localUser.name} self active={camOn} muted={!micOn} />
//                 </div>
//               </div>
//             )}
//             {sharing && (
//               <div style={{ position:"absolute", top:16, left:"50%", transform:"translateX(-50%)",
//                 background:"rgba(0,191,165,.9)", color:"#fff", borderRadius:10,
//                 padding:"8px 18px", fontSize:13, fontWeight:700 }}>
//                 🖥️ Sharing screen
//               </div>
//             )}
//           </div>
//         )}

//         {/* SIDE PANEL */}
//         <div style={{ width:layout==="chat-only"?"100%":310, flexShrink:0,
//           display:"flex", flexDirection:"column",
//           background:"rgba(255,255,255,.025)",
//           borderLeft:"1px solid rgba(255,255,255,.06)", minHeight:0 }}>

//           <div style={{ display:"flex", gap:4, padding:"9px 11px",
//             borderBottom:"1px solid rgba(255,255,255,.06)", flexShrink:0 }}>
//             {[["chat","💬 Chat"],["notes","📋 Notes"]].map(([k,lbl]) => (
//               <button key={k} className="vc-b vc-t" onClick={() => setTab(k)}
//                 style={{ background:tab===k?"rgba(0,191,165,.2)":"transparent",
//                   color:tab===k?"#00bfa5":"rgba(255,255,255,.4)",
//                   border:`1px solid ${tab===k?"rgba(0,191,165,.35)":"transparent"}` }}>
//                 {lbl}
//               </button>
//             ))}
//             <span style={{ marginLeft:"auto", fontSize:11, color:"rgba(255,255,255,.22)", alignSelf:"center" }}>
//               {msgs.filter(m=>m.type!=="system").length} msgs
//             </span>
//           </div>

//           {tab === "chat" && (
//             <>
//               <div ref={chatRef} style={{ flex:1, overflowY:"auto", padding:"10px 12px",
//                 display:"flex", flexDirection:"column", gap:8, minHeight:0 }}>
//                 {msgs.map(m => {
//                   const isMe  = m.fromId === localUser.id;
//                   const isSys = m.type === "system";
//                   if (isSys) return (
//                     <div key={m.id} style={{ textAlign:"center", fontSize:11,
//                       color:"rgba(255,255,255,.28)",
//                       background:"rgba(255,255,255,.04)", borderRadius:6,
//                       padding:"5px 10px" }}>{m.body}</div>
//                   );
//                   if (!isMe && m.body === `${peerName} joined the call.`) return null;
//                   return (
//                     <div key={m.id} style={{ display:"flex", flexDirection:"column",
//                       alignItems:isMe?"flex-end":"flex-start" }}>
//                       <div style={{
//                         background:isMe
//                           ?"linear-gradient(135deg,#00bfa5,#0891b2)"
//                           :"rgba(255,255,255,.10)",
//                         color:"#fff",
//                         borderRadius:isMe?"14px 14px 4px 14px":"14px 14px 14px 4px",
//                         padding:"9px 13px", maxWidth:"84%",
//                         fontSize:13.5, lineHeight:1.55, wordBreak:"break-word" }}>
//                         {!isMe && <div style={{ fontSize:10, fontWeight:700,
//                           color:"#00bfa5", marginBottom:3 }}>{m.fromName}</div>}
//                         {m.body}
//                       </div>
//                       <span style={{ fontSize:10, color:"rgba(255,255,255,.22)", marginTop:3 }}>
//                         {new Date(m.ts).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}
//                       </span>
//                     </div>
//                   );
//                 })}
//               </div>
//               <div style={{ padding:"9px 11px",
//                 borderTop:"1px solid rgba(255,255,255,.06)",
//                 display:"flex", gap:7, flexShrink:0 }}>
//                 <input ref={inputRef} className="vc-i"
//                   placeholder={peerOn ? `Message ${peerName}…` : "Waiting for peer to join…"}
//                   value={input}
//                   onChange={e => setInput(e.target.value)}
//                   onKeyDown={e => e.key==="Enter" && !e.shiftKey && (e.preventDefault(), send())}/>
//                 <button className="vc-b" onClick={send} disabled={!input.trim()}
//                   style={{ background:input.trim()
//                     ?"linear-gradient(135deg,#00bfa5,#0891b2)"
//                     :"rgba(255,255,255,.08)",
//                     border:"none", borderRadius:10, padding:"10px 13px",
//                     color:"#fff", fontWeight:800, fontSize:16,
//                     flexShrink:0, opacity:input.trim()?1:.4 }}>
//                   ➤
//                 </button>
//               </div>
//             </>
//           )}

//           {tab === "notes" && (
//             <div style={{ flex:1, padding:12, display:"flex",
//               flexDirection:"column", gap:8, minHeight:0, overflow:"hidden" }}>
//               <div style={{ fontSize:11, color:"rgba(255,255,255,.28)", fontWeight:600 }}>
//                 {isDoctor
//                   ? "Clinical notes — visible to patient after session"
//                   : "Your personal session notes"}
//               </div>
//               <textarea className="vc-n" style={{ flex:1, minHeight:0 }}
//                 placeholder={isDoctor
//                   ? "Findings, treatment plan, follow-up instructions…"
//                   : "Questions, medication reminders, next steps…"}
//                 value={notes} onChange={e => saveNotes(e.target.value)}/>
//               <div style={{ fontSize:10, color:"rgba(255,255,255,.2)" }}>
//                 Auto-saved · {notes.length} chars
//               </div>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* CONTROLS */}
//       <div style={{ display:"flex", alignItems:"center", justifyContent:"center",
//         gap:10, padding:"12px 18px",
//         background:"rgba(255,255,255,.035)",
//         borderTop:"1px solid rgba(255,255,255,.07)",
//         flexShrink:0, flexWrap:"wrap" }}>
//         <button className="vc-b vc-c" onClick={() => setMic(m=>!m)}
//           style={{ background:micOn?"rgba(255,255,255,.1)":"rgba(239,68,68,.25)",
//             color:micOn?"#fff":"#ef4444" }}>
//           {micOn?"🎙️":"🔇"}
//         </button>
//         <button className="vc-b vc-c" onClick={() => setCam(c=>!c)}
//           style={{ background:camOn?"rgba(255,255,255,.1)":"rgba(239,68,68,.25)",
//             color:camOn?"#fff":"#ef4444" }}>
//           {camOn?"📹":"📷"}
//         </button>
//         <button className="vc-b vc-c" onClick={() => setShare(s=>!s)}
//           style={{ background:sharing?"rgba(0,191,165,.25)":"rgba(255,255,255,.1)",
//             color:sharing?"#00bfa5":"#fff" }}>
//           🖥️
//         </button>
//         <button className="vc-b vc-c" onClick={() => setRaised(r=>!r)}
//           style={{ background:raised?"rgba(251,191,36,.25)":"rgba(255,255,255,.1)",
//             color:raised?"#fbbf24":"#fff" }}>
//           ✋
//         </button>
//         <button className="vc-b" onClick={handleEnd}
//           style={{ background:"#ef4444", color:"#fff", borderRadius:14,
//             padding:"13px 28px", fontWeight:800, fontSize:15,
//             display:"flex", alignItems:"center", gap:8,
//             boxShadow:"0 4px 18px rgba(239,68,68,.4)" }}>
//           📵 End Call
//         </button>
//       </div>
//     </div>
//   );
// }



// import { useState, useEffect, useRef, useCallback } from "react";

// /*
//   VideoCall.jsx  — Real WebRTC video using PeerJS (peer-to-peer via public broker)
//   Falls back gracefully when camera/mic are denied.

//   Props:
//     consultation  – { id, patientId, patientName, doctorId, doctorName, date, time }
//     localUser     – { id, name, role: "doctor" | "patient" }
//     onEnd         – callback when session ends
// */

// const PEER_SERVER = { host: "0.peerjs.com", port: 443, path: "/", secure: true };

// const LS = {
//   get: (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
//   set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
// };

// const sigDB = {
//   write: (key, val) => LS.set("vc_sig_" + key, { val, ts: Date.now() }),
//   read:  (key)      => { const r = LS.get("vc_sig_" + key, null); return r && (Date.now() - r.ts < 30000) ? r.val : null; },
//   clear: (key)      => localStorage.removeItem("vc_sig_" + key),
// };

// function uid6() { return Math.random().toString(36).slice(2, 8); }
// const now = () => new Date().toISOString();

// export default function VideoCall({ consultation, localUser, onEnd }) {
//   const localRef  = useRef(null);
//   const remoteRef = useRef(null);
//   const peerRef   = useRef(null);
//   const streamRef = useRef(null);
//   const callRef   = useRef(null);
//   const pollRef   = useRef(null);

//   const [status,   setStatus]  = useState("Initializing…");
//   const [muted,    setMuted]   = useState(false);
//   const [camOff,   setCamOff]  = useState(false);
//   const [connected,setConn]    = useState(false);
//   const [secs,     setSecs]    = useState(0);
//   const [msgs,     setMsgs]    = useState([]);
//   const [input,    setInput]   = useState("");
//   const [peerId,   setPeerId]  = useState("");
//   const timerRef  = useRef(null);
//   const chatRef   = useRef(null);

//   const isDoctor  = localUser.role === "doctor";
//   const roomId    = "stech_" + consultation.id;
//   const myPeerKey = roomId + "_" + localUser.role;
//   const theirKey  = roomId + "_" + (isDoctor ? "patient" : "doctor");

//   const addSysMsg = (txt) =>
//     setMsgs(m => [...m, { id: uid6(), from: "system", text: txt, ts: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }]);

//   const addMsg = (from, text) =>
//     setMsgs(m => [...m, { id: uid6(), from, text, ts: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }]);

//   useEffect(() => {
//     timerRef.current = setInterval(() => setSecs(s => s + 1), 1000);
//     return () => clearInterval(timerRef.current);
//   }, []);

//   useEffect(() => { chatRef.current?.scrollTo(0, chatRef.current.scrollHeight); }, [msgs]);

//   const fmt = s => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

//   const attachStream = useCallback((stream) => {
//     streamRef.current = stream;
//     if (localRef.current) { localRef.current.srcObject = stream; localRef.current.play().catch(() => {}); }
//   }, []);

//   const handleRemoteStream = useCallback((stream) => {
//     if (remoteRef.current) { remoteRef.current.srcObject = stream; remoteRef.current.play().catch(() => {}); }
//     setConn(true);
//     setStatus("Connected");
//     addSysMsg("✅ Video connected!");
//     clearInterval(pollRef.current);
//   }, []);

//   useEffect(() => {
//     let destroyed = false;

//     async function init() {
//       setStatus("Requesting camera…");
//       let stream;
//       try {
//         stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
//         attachStream(stream);
//         setStatus("Camera ready. Connecting…");
//       } catch {
//         setStatus("Camera denied — audio only / sim mode");
//         addSysMsg("⚠ Camera access denied. Text chat only.");
//       }

//       try {
//         const { Peer } = await import("https://esm.sh/peerjs@1.5.2");
//         if (destroyed) return;

//         const peer = new Peer(myPeerKey, PEER_SERVER);
//         peerRef.current = peer;

//         peer.on("open", (id) => {
//           if (destroyed) return;
//           setPeerId(id);
//           sigDB.write(myPeerKey, id);
//           setStatus("Waiting for peer…");
//           addSysMsg("📡 Room ready. Waiting for " + (isDoctor ? "patient" : "doctor") + "…");

//           if (!isDoctor) {
//             pollRef.current = setInterval(() => {
//               const doctorId = sigDB.read(theirKey);
//               if (doctorId && peerRef.current) {
//                 clearInterval(pollRef.current);
//                 setStatus("Calling doctor…");
//                 addSysMsg("📞 Calling doctor…");
//                 const call = peerRef.current.call(doctorId, stream || new MediaStream());
//                 callRef.current = call;
//                 call.on("stream", handleRemoteStream);
//                 call.on("error", (e) => addSysMsg("Call error: " + e.message));
//               }
//             }, 1500);
//           }
//         });

//         peer.on("call", (call) => {
//           callRef.current = call;
//           call.answer(stream || new MediaStream());
//           call.on("stream", handleRemoteStream);
//           addSysMsg("📞 Incoming call — answering…");
//         });

//         peer.on("connection", (conn) => {
//           conn.on("data", (data) => {
//             if (data.type === "chat") addMsg(data.from, data.text);
//             if (data.type === "end")  { addSysMsg("Other party ended the session."); }
//           });
//         });

//         peer.on("error", (e) => {
//           if (!destroyed) setStatus("Connection error — " + e.type);
//           addSysMsg("⚠ Peer error: " + e.type);
//         });

//       } catch (e) {
//         if (!destroyed) {
//           setStatus("PeerJS unavailable — fallback sim mode");
//           addSysMsg("⚠ Live video unavailable (network). Sim mode active.");
//           setConn(true);
//         }
//       }
//     }

//     init();

//     return () => {
//       destroyed = true;
//       clearInterval(pollRef.current);
//       streamRef.current?.getTracks().forEach(t => t.stop());
//       peerRef.current?.destroy();
//       sigDB.clear(myPeerKey);
//     };
//   }, []);

//   const endCall = () => {
//     clearInterval(pollRef.current);
//     callRef.current?.close();
//     streamRef.current?.getTracks().forEach(t => t.stop());
//     peerRef.current?.destroy();
//     sigDB.clear(myPeerKey);
//     onEnd();
//   };

//   const toggleMute = () => {
//     streamRef.current?.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
//     setMuted(m => !m);
//   };

//   const toggleCam = () => {
//     streamRef.current?.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
//     setCamOff(c => !c);
//   };

//   const sendChat = () => {
//     if (!input.trim()) return;
//     addMsg(localUser.name, input.trim());
//     setInput("");
//   };

//   const otherName = isDoctor ? consultation.patientName : consultation.doctorName;

//   return (
//     <div style={{ fontFamily: "'DM Sans',sans-serif", height: "100vh", display: "flex", flexDirection: "column", background: "#0a1628", color: "#fff" }}>
//       {/* Header */}
//       <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", background: "rgba(255,255,255,.05)", borderBottom: "1px solid rgba(255,255,255,.1)", flexShrink: 0 }}>
//         <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
//           <div style={{ background: connected ? "rgba(34,197,94,.2)" : "rgba(251,191,36,.2)", border: `1px solid ${connected ? "#22c55e" : "#fbbf24"}`, borderRadius: 20, padding: "4px 12px", display: "flex", alignItems: "center", gap: 6 }}>
//             <div style={{ width: 8, height: 8, borderRadius: "50%", background: connected ? "#22c55e" : "#fbbf24", animation: "pulse 1s infinite" }} />
//             <span style={{ fontSize: 12, fontWeight: 700, color: connected ? "#22c55e" : "#fbbf24" }}>{connected ? "LIVE" : status}</span>
//           </div>
//           <span style={{ fontWeight: 700 }}>{otherName}</span>
//           <span style={{ fontSize: 12, color: "rgba(255,255,255,.5)" }}>{fmt(secs)}</span>
//         </div>
//         <div style={{ display: "flex", gap: 8 }}>
//           <CtrlBtn active={muted} icon={muted ? "🔇" : "🎙️"} label={muted ? "Unmute" : "Mute"} onClick={toggleMute} />
//           <CtrlBtn active={camOff} icon={camOff ? "📷" : "📹"} label={camOff ? "Cam On" : "Cam Off"} onClick={toggleCam} />
//           <button onClick={endCall} style={{ background: "#ef4444", color: "#fff", border: "none", borderRadius: 10, padding: "8px 20px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
//             📵 End
//           </button>
//         </div>
//       </div>

//       {/* Body */}
//       <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
//         {/* Video area */}
//         <div style={{ flex: 1, position: "relative", background: "#060e1a", display: "flex", alignItems: "center", justifyContent: "center" }}>
//           <video ref={remoteRef} autoPlay playsInline style={{ width: "100%", height: "100%", objectFit: "cover", display: connected ? "block" : "none" }} />
//           {!connected && (
//             <div style={{ textAlign: "center", color: "rgba(255,255,255,.5)" }}>
//               <div style={{ fontSize: 64, marginBottom: 16 }}>👤</div>
//               <p style={{ fontSize: 14 }}>{status}</p>
//               <p style={{ fontSize: 12, marginTop: 8, opacity: .6 }}>Waiting for {otherName}…</p>
//             </div>
//           )}
//           {/* Local PiP */}
//           <div style={{ position: "absolute", bottom: 16, right: 16, width: 140, height: 100, background: "#1a2a40", borderRadius: 12, border: "2px solid #00bfa5", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
//             <video ref={localRef} autoPlay muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover", display: camOff ? "none" : "block" }} />
//             {camOff && <span style={{ fontSize: 28 }}>📷</span>}
//           </div>
//         </div>

//         {/* Chat panel */}
//         <div style={{ width: 300, flexShrink: 0, display: "flex", flexDirection: "column", borderLeft: "1px solid rgba(255,255,255,.1)" }}>
//           <div style={{ padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,.1)", fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,.7)" }}>
//             💬 Session Chat
//           </div>
//           <div ref={chatRef} style={{ flex: 1, overflow: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
//             {msgs.map(m => (
//               <div key={m.id}>
//                 {m.from === "system"
//                   ? <div style={{ textAlign: "center", fontSize: 11, color: "rgba(255,255,255,.4)", background: "rgba(255,255,255,.05)", borderRadius: 8, padding: "4px 10px" }}>{m.text}</div>
//                   : <div style={{ display: "flex", flexDirection: "column", alignItems: m.from === localUser.name ? "flex-end" : "flex-start" }}>
//                       <div style={{ background: m.from === localUser.name ? "#00bfa5" : "rgba(255,255,255,.12)", color: "#fff", borderRadius: 10, padding: "7px 12px", maxWidth: "82%", fontSize: 13, lineHeight: 1.5 }}>
//                         {m.from !== localUser.name && <div style={{ fontSize: 10, fontWeight: 700, color: "#00bfa5", marginBottom: 3 }}>{m.from}</div>}
//                         {m.text}
//                       </div>
//                       <div style={{ fontSize: 10, color: "rgba(255,255,255,.35)", marginTop: 2 }}>{m.ts}</div>
//                     </div>
//                 }
//               </div>
//             ))}
//           </div>
//           <div style={{ padding: "10px 12px", borderTop: "1px solid rgba(255,255,255,.1)", display: "flex", gap: 6 }}>
//             <input
//               style={{ flex: 1, background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.15)", borderRadius: 8, padding: "8px 10px", color: "#fff", fontSize: 13, outline: "none", fontFamily: "inherit" }}
//               placeholder="Type a message…" value={input}
//               onChange={e => setInput(e.target.value)}
//               onKeyDown={e => e.key === "Enter" && sendChat()}
//             />
//             <button onClick={sendChat} style={{ background: "#00bfa5", color: "#fff", border: "none", borderRadius: 8, padding: "8px 12px", cursor: "pointer", fontWeight: 700 }}>↑</button>
//           </div>
//         </div>
//       </div>
//       <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
//     </div>
//   );
// }

// function CtrlBtn({ active, icon, label, onClick }) {
//   return (
//     <button onClick={onClick} title={label} style={{ background: active ? "rgba(239,68,68,.3)" : "rgba(255,255,255,.1)", border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontSize: 16, color: "#fff", display: "flex", alignItems: "center", gap: 5 }}>
//       {icon}
//     </button>
//   );
// }




/**
 * Pages/Doctor/VideoCall.jsx
 * ===============================================================
 * Real shared video room. Both PatientPanel and DoctorPanel render
 * this SAME component, passing their own localUser. Both poll the
 * same VideoSessionBus (backed by te_vc_messages in Storage.js) at
 * 800ms - true two-way live communication, not a static simulator.
 *
 * Props:
 *   consultation - { id, doctorId, doctorName, patientId, patientName, type, date, time }
 *   localUser    - { id, name, role: "doctor" | "patient" }
 *   onEnd()
 *
 * SAVE THIS FILE AS: src/Pages/Doctor/VideoCall.jsx
 *
 * Import path used by both panels:
 *   Doctor/DoctorPanel.jsx   -> import VideoCall from "./VideoCall";
 *   Patient/PatientPanel.jsx -> import VideoCall from "../Doctor/VideoCall";
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { VideoSessionBus, pushNotif } from "../../Storage";

export default function VideoCall({ consultation, localUser, onEnd }) {
  const isDoctor = localUser.role === "doctor";
  const peerName = isDoctor ? consultation.patientName : consultation.doctorName;
  const peerId   = isDoctor ? consultation.patientId   : consultation.doctorId;

  const [session, setSession] = useState(null);
  const [msgs,    setMsgs]    = useState([]);
  const [input,   setInput]   = useState("");
  const [micOn,   setMic]     = useState(true);
  const [camOn,   setCam]     = useState(true);
  const [sharing, setShare]   = useState(false);
  const [raised,  setRaised]  = useState(false);
  const [layout,  setLayout]  = useState("side");
  const [tab,     setTab]     = useState("chat");
  const [notes,   setNotes]   = useState("");
  const [secs,    setSecs]    = useState(0);
  const [peerOn,  setPeerOn]  = useState(false);
  const chatRef  = useRef(null);
  const inputRef = useRef(null);
  const pollRef  = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    const s = VideoSessionBus.start(consultation.id, consultation.doctorId, consultation.patientId);
    setSession(s);

    VideoSessionBus.send(s.id, localUser.id, localUser.name, localUser.role, `${localUser.name} joined the call.`);

    pushNotif(peerId, "consultation", `Video call: ${localUser.name} joined`,
      "Open Video Calls / Consultations and tap Join to connect.");
    pushNotif("admin", "consultation", "Video Call Active",
      `${consultation.doctorName} <-> ${consultation.patientName} session started.`);

    const saved = localStorage.getItem(`vc_notes_${s.id}`);
    if (saved) setNotes(saved);

    timerRef.current = setInterval(() => setSecs(x => x + 1), 1000);
    return () => { clearInterval(timerRef.current); clearInterval(pollRef.current); };
  }, []);

  const loadMsgs = useCallback(() => {
    if (!session) return;
    const all = VideoSessionBus.getMessages(session.id);
    setMsgs([...all]);
    if (all.some(m => m.fromId === peerId)) setPeerOn(true);
    setTimeout(() => chatRef.current?.scrollTo(0, chatRef.current.scrollHeight), 30);
  }, [session, peerId]);

  useEffect(() => {
    if (!session) return;
    loadMsgs();
    pollRef.current = setInterval(loadMsgs, 800);
    const h = () => loadMsgs();
    window.addEventListener("te_vc_msg", h);
    return () => { clearInterval(pollRef.current); window.removeEventListener("te_vc_msg", h); };
  }, [session, loadMsgs]);

  const send = () => {
    if (!input.trim() || !session) return;
    VideoSessionBus.send(session.id, localUser.id, localUser.name, localUser.role, input.trim());
    setInput("");
    inputRef.current?.focus();
  };

  const saveNotes = (v) => {
    setNotes(v);
    if (session) localStorage.setItem(`vc_notes_${session.id}`, v);
  };

  const handleEnd = () => {
    if (session) {
      VideoSessionBus.sendSystem(session.id, `${localUser.name} ended the session.`);
      VideoSessionBus.end(session.id);
    }
    pushNotif(peerId, "consultation", "Video call ended", `${localUser.name} ended the session.`);
    pushNotif("admin", "consultation", "Video Session Ended",
      `${consultation.doctorName} <-> ${consultation.patientName} completed.`);
    onEnd();
  };

  const fmtTime = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  function Tile({ name, self: isSelf, active, muted: m, large }) {
    const COLORS = ["#1e88e5", "#00bfa5", "#7c3aed", "#f44336", "#ff7043", "#0891b2"];
    const color  = COLORS[(name?.charCodeAt(0) || 0) % COLORS.length];
    const ini    = name?.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "?";
    return (
      <div style={{
        position: "relative", borderRadius: 14, overflow: "hidden",
        background: active ? "#111827" : "#0d1117",
        display: "flex", alignItems: "center", justifyContent: "center",
        border: `2px solid ${isSelf ? "#00bfa5" : "rgba(255,255,255,.1)"}`,
        height: "100%", width: "100%",
      }}>
        {active ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <div style={{
              width: large ? 88 : 52, height: large ? 88 : 52, borderRadius: "50%",
              background: color, display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: large ? 34 : 20, fontWeight: 800, color: "#fff",
              boxShadow: `0 0 0 4px ${color}33`,
            }}>{ini}</div>
            <div style={{
              width: large ? 140 : 70, height: 3,
              background: `linear-gradient(90deg,transparent,${color},transparent)`,
              borderRadius: 99, animation: "audioBar 1.2s ease-in-out infinite",
            }}/>
          </div>
        ) : (
          <div style={{ textAlign: "center", color: "rgba(255,255,255,.3)" }}>
            <div style={{ fontSize: large ? 36 : 22 }}>Camera</div>
            <div style={{ fontSize: 10, marginTop: 4 }}>off</div>
          </div>
        )}
        <div style={{
          position: "absolute", bottom: 8, left: 10,
          background: "rgba(0,0,0,.65)", borderRadius: 6, padding: "3px 8px",
          display: "flex", alignItems: "center", gap: 5,
        }}>
          {m && <span style={{ fontSize: 10 }}>Muted</span>}
          <span style={{ fontSize: 11, color: "#fff", fontWeight: 600 }}>{isSelf ? "You" : name}</span>
        </div>
        {isSelf && (
          <div style={{
            position: "absolute", top: 8, right: 8, background: "#00bfa5", color: "#fff",
            fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 5,
          }}>YOU</div>
        )}
        {!isSelf && !peerOn && (
          <div style={{
            position: "absolute", top: 8, left: 8,
            background: "rgba(251,191,36,.18)", border: "1px solid rgba(251,191,36,.35)",
            borderRadius: 6, padding: "3px 8px", fontSize: 10, color: "#fbbf24", fontWeight: 700,
          }}>Waiting...</div>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#060d1a", fontFamily: "'DM Sans',system-ui,sans-serif", color: "#fff" }}>
      <style>{`
        @keyframes audioBar{0%,100%{transform:scaleX(.3);opacity:.4}50%{transform:scaleX(1);opacity:1}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}
        .vc-b{border:none;cursor:pointer;font-family:inherit;transition:all .18s;}
        .vc-c{width:50px;height:50px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;}
        .vc-t{padding:7px 14px;border-radius:8px;font-size:12px;font-weight:700;}
        .vc-i{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);border-radius:10px;padding:10px 14px;color:#fff;font-size:13.5px;font-family:inherit;outline:none;width:100%;box-sizing:border-box;}
        .vc-i:focus{border-color:#00bfa5;}
        .vc-n{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:12px;color:rgba(255,255,255,.85);font-family:'DM Sans',sans-serif;font-size:13px;line-height:1.7;resize:none;outline:none;width:100%;box-sizing:border-box;}
        .vc-n:focus{border-color:#00bfa5;}
        ::-webkit-scrollbar{width:3px;}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,.12);border-radius:99px;}
      `}</style>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 18px", background: "rgba(255,255,255,.04)", borderBottom: "1px solid rgba(255,255,255,.07)", flexShrink: 0, gap: 10, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(239,68,68,.15)", border: "1px solid rgba(239,68,68,.3)", borderRadius: 20, padding: "4px 12px" }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#ef4444", animation: "pulse 1s infinite" }}/>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#ef4444" }}>LIVE</span>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{peerName}</div>
            <div style={{ fontSize: 11, color: peerOn ? "#00bfa5" : "rgba(255,255,255,.35)" }}>
              {peerOn ? "Connected" : "Waiting for peer..."}
            </div>
          </div>
          <div style={{ background: "rgba(0,191,165,.12)", border: "1px solid rgba(0,191,165,.2)", borderRadius: 8, padding: "5px 12px", fontWeight: 800, fontSize: 15, color: "#00bfa5", letterSpacing: 1 }}>
            {fmtTime(secs)}
          </div>
        </div>
        <div style={{ display: "flex", gap: 5 }}>
          {[["side", "Side"], ["pip", "PiP"], ["chat-only", "Chat"]].map(([l, lbl]) => (
            <button key={l} className="vc-b vc-t" onClick={() => setLayout(l)}
              style={{ background: layout === l ? "rgba(0,191,165,.2)" : "rgba(255,255,255,.06)", border: `1px solid ${layout === l ? "rgba(0,191,165,.4)" : "rgba(255,255,255,.1)"}`, color: layout === l ? "#00bfa5" : "rgba(255,255,255,.4)" }}>
              {lbl}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>
        {layout !== "chat-only" && (
          <div style={{ flex: "1 1 60%", background: "#0a0f1a", display: "flex", gap: 8, padding: 10, minWidth: 0, position: "relative" }}>
            {layout === "side" ? (
              <>
                <div style={{ flex: 1, minHeight: 0 }}><Tile name={peerName} active={peerOn} large/></div>
                <div style={{ flex: 1, minHeight: 0 }}><Tile name={localUser.name} self active={camOn} muted={!micOn} large/></div>
              </>
            ) : (
              <div style={{ position: "relative", width: "100%", height: "100%" }}>
                <Tile name={peerName} active={peerOn} large/>
                <div style={{ position: "absolute", bottom: 14, right: 14, width: 150, height: 100, borderRadius: 10, overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,.5)" }}>
                  <Tile name={localUser.name} self active={camOn} muted={!micOn}/>
                </div>
              </div>
            )}
            {sharing && (
              <div style={{ position: "absolute", top: 16, left: "50%", transform: "translateX(-50%)", background: "rgba(0,191,165,.9)", color: "#fff", borderRadius: 10, padding: "8px 18px", fontSize: 13, fontWeight: 700 }}>
                Sharing screen
              </div>
            )}
          </div>
        )}

        <div style={{ width: layout === "chat-only" ? "100%" : 310, flexShrink: 0, display: "flex", flexDirection: "column", background: "rgba(255,255,255,.025)", borderLeft: "1px solid rgba(255,255,255,.06)", minHeight: 0 }}>
          <div style={{ display: "flex", gap: 4, padding: "9px 11px", borderBottom: "1px solid rgba(255,255,255,.06)", flexShrink: 0 }}>
            {[["chat", "Chat"], ["notes", "Notes"]].map(([k, lbl]) => (
              <button key={k} className="vc-b vc-t" onClick={() => setTab(k)}
                style={{ background: tab === k ? "rgba(0,191,165,.2)" : "transparent", color: tab === k ? "#00bfa5" : "rgba(255,255,255,.4)", border: `1px solid ${tab === k ? "rgba(0,191,165,.35)" : "transparent"}` }}>
                {lbl}
              </button>
            ))}
            <span style={{ marginLeft: "auto", fontSize: 11, color: "rgba(255,255,255,.22)", alignSelf: "center" }}>
              {msgs.filter(m => m.type !== "system").length} msgs
            </span>
          </div>

          {tab === "chat" && (
            <>
              <div ref={chatRef} style={{ flex: 1, overflowY: "auto", padding: "10px 12px", display: "flex", flexDirection: "column", gap: 8, minHeight: 0 }}>
                {msgs.map(m => {
                  const isMe = m.fromId === localUser.id;
                  const isSys = m.type === "system";
                  if (isSys) return (
                    <div key={m.id} style={{ textAlign: "center", fontSize: 11, color: "rgba(255,255,255,.28)", background: "rgba(255,255,255,.04)", borderRadius: 6, padding: "5px 10px" }}>{m.body}</div>
                  );
                  if (!isMe && m.body === `${peerName} joined the call.`) return null;
                  return (
                    <div key={m.id} style={{ display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start" }}>
                      <div style={{
                        background: isMe ? "linear-gradient(135deg,#00bfa5,#0891b2)" : "rgba(255,255,255,.10)",
                        color: "#fff", borderRadius: isMe ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                        padding: "9px 13px", maxWidth: "84%", fontSize: 13.5, lineHeight: 1.55, wordBreak: "break-word",
                      }}>
                        {!isMe && <div style={{ fontSize: 10, fontWeight: 700, color: "#00bfa5", marginBottom: 3 }}>{m.fromName}</div>}
                        {m.body}
                      </div>
                      <span style={{ fontSize: 10, color: "rgba(255,255,255,.22)", marginTop: 3 }}>
                        {new Date(m.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div style={{ padding: "9px 11px", borderTop: "1px solid rgba(255,255,255,.06)", display: "flex", gap: 7, flexShrink: 0 }}>
                <input ref={inputRef} className="vc-i" placeholder={peerOn ? `Message ${peerName}...` : "Waiting for peer to join..."} value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}/>
                <button className="vc-b" onClick={send} disabled={!input.trim()}
                  style={{ background: input.trim() ? "linear-gradient(135deg,#00bfa5,#0891b2)" : "rgba(255,255,255,.08)", border: "none", borderRadius: 10, padding: "10px 13px", color: "#fff", fontWeight: 800, fontSize: 16, flexShrink: 0, opacity: input.trim() ? 1 : .4 }}>
                  Send
                </button>
              </div>
            </>
          )}

          {tab === "notes" && (
            <div style={{ flex: 1, padding: 12, display: "flex", flexDirection: "column", gap: 8, minHeight: 0, overflow: "hidden" }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,.28)", fontWeight: 600 }}>
                {isDoctor ? "Clinical notes - visible to patient after session" : "Your personal session notes"}
              </div>
              <textarea className="vc-n" style={{ flex: 1, minHeight: 0 }}
                placeholder={isDoctor ? "Findings, treatment plan, follow-up instructions..." : "Questions, medication reminders, next steps..."}
                value={notes} onChange={e => saveNotes(e.target.value)}/>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,.2)" }}>Auto-saved - {notes.length} chars</div>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "12px 18px", background: "rgba(255,255,255,.035)", borderTop: "1px solid rgba(255,255,255,.07)", flexShrink: 0, flexWrap: "wrap" }}>
        <button className="vc-b vc-c" onClick={() => setMic(m => !m)} style={{ background: micOn ? "rgba(255,255,255,.1)" : "rgba(239,68,68,.25)", color: micOn ? "#fff" : "#ef4444" }}>{micOn ? "Mic" : "Mute"}</button>
        <button className="vc-b vc-c" onClick={() => setCam(c => !c)} style={{ background: camOn ? "rgba(255,255,255,.1)" : "rgba(239,68,68,.25)", color: camOn ? "#fff" : "#ef4444" }}>{camOn ? "Cam" : "Off"}</button>
        <button className="vc-b vc-c" onClick={() => setShare(s => !s)} style={{ background: sharing ? "rgba(0,191,165,.25)" : "rgba(255,255,255,.1)", color: sharing ? "#00bfa5" : "#fff" }}>Share</button>
        <button className="vc-b vc-c" onClick={() => setRaised(r => !r)} style={{ background: raised ? "rgba(251,191,36,.25)" : "rgba(255,255,255,.1)", color: raised ? "#fbbf24" : "#fff" }}>Hand</button>
        <button className="vc-b" onClick={handleEnd} style={{ background: "#ef4444", color: "#fff", borderRadius: 14, padding: "13px 28px", fontWeight: 800, fontSize: 15, display: "flex", alignItems: "center", gap: 8, boxShadow: "0 4px 18px rgba(239,68,68,.4)" }}>
          End Call
        </button>
      </div>
    </div>
  );
}