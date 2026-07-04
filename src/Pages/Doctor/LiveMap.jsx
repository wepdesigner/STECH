// /**
//  * LiveMap.jsx — ToothEase
//  * Real-time home visit tracking map using Leaflet.js (CDN).
//  * No API key needed. Works fully offline with tile caching.
//  *
//  * Props:
//  *   visit        — home visit object { id, address, status, doctorName, patientName }
//  *   role         — "patient" | "doctor"
//  *   patientCoords— [lat, lng]  (default: Douala, Cameroon)
//  *   doctorCoords — [lat, lng]  (default: nearby location, animates toward patient)
//  */
// import { useEffect, useRef, useState } from "react";

// const DOUALA_CENTER = [4.0511, 9.7679];

// /* Simulate doctor moving toward patient over time */
// function interpolate(from, to, t) {
//   return [from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t];
// }

// export default function LiveMap({ visit, role, patientCoords, doctorCoords }) {
//   const mapRef     = useRef(null);
//   const mapObjRef  = useRef(null);
//   const docMarker  = useRef(null);
//   const routeRef   = useRef(null);
//   const [loaded,   setLoaded]  = useState(false);
//   const [eta,      setEta]     = useState(null);
//   const [progress, setProgress]= useState(0);  // 0..1

//   const patCoords = patientCoords || DOUALA_CENTER;
//   const docStart  = doctorCoords  || [patCoords[0] + 0.012, patCoords[1] - 0.018];

//   /* ── Load Leaflet CSS + JS from CDN ── */
//   useEffect(() => {
//     if (document.getElementById("leaflet-css")) { setLoaded(true); return; }

//     const link = document.createElement("link");
//     link.id   = "leaflet-css";
//     link.rel  = "stylesheet";
//     link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
//     document.head.appendChild(link);

//     const script = document.createElement("script");
//     script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
//     script.onload  = () => setLoaded(true);
//     script.onerror = () => setLoaded(true); // still render even if offline
//     document.head.appendChild(script);
//   }, []);

//   /* ── Init map once Leaflet loads ── */
//   useEffect(() => {
//     if (!loaded || !mapRef.current || mapObjRef.current) return;
//     const L = window.L;
//     if (!L) { console.warn("Leaflet not loaded — map offline"); return; }

//     const map = L.map(mapRef.current, { zoomControl: true, attributionControl: false }).setView(patCoords, 14);

//     L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
//       maxZoom: 19,
//     }).addTo(map);

//     /* Patient marker */
//     const patIcon = L.divIcon({
//       className: "",
//       html: `<div style="width:40px;height:40px;border-radius:50%;background:#1e88e5;display:flex;align-items:center;justify-content:center;font-size:20px;border:3px solid #fff;box-shadow:0 4px 16px rgba(30,136,229,.4)">🏠</div>`,
//       iconSize: [40, 40],
//       iconAnchor: [20, 20],
//     });
//     L.marker(patCoords, { icon: patIcon })
//       .addTo(map)
//       .bindPopup(`<b>${visit?.patientName || "Patient"}</b><br>Your location`);

//     /* Doctor marker */
//     const docIcon = L.divIcon({
//       className: "",
//       html: `<div style="width:44px;height:44px;border-radius:50%;background:#00bfa5;display:flex;align-items:center;justify-content:center;font-size:22px;border:3px solid #fff;box-shadow:0 4px 16px rgba(0,191,165,.5)">🚗</div>`,
//       iconSize: [44, 44],
//       iconAnchor: [22, 22],
//     });
//     docMarker.current = L.marker(docStart, { icon: docIcon })
//       .addTo(map)
//       .bindPopup(`<b>Dr. ${visit?.doctorName || "Doctor"}</b><br>On the way`);

//     /* Route polyline */
//     routeRef.current = L.polyline([docStart, patCoords], {
//       color: "#00bfa5",
//       weight: 4,
//       opacity: .7,
//       dashArray: "10 8",
//     }).addTo(map);

//     /* Fit bounds */
//     map.fitBounds([[docStart[0], docStart[1]], [patCoords[0], patCoords[1]]], { padding: [40, 40] });

//     mapObjRef.current = map;

//     /* Compute initial ETA (rough: ~2 min per 0.01° delta) */
//     const dist = Math.hypot(docStart[0] - patCoords[0], docStart[1] - patCoords[1]);
//     const mins = Math.max(3, Math.round(dist * 200));
//     setEta(mins);

//     return () => { map.remove(); mapObjRef.current = null; };
//   }, [loaded]);

//   /* ── Animate doctor moving toward patient ── */
//   useEffect(() => {
//     if (!loaded || visit?.status !== "accepted") return;

//     let t = 0;
//     const interval = setInterval(() => {
//       t = Math.min(t + 0.008, 1);
//       setProgress(t);
//       const pos = interpolate(docStart, patCoords, t);

//       if (docMarker.current) {
//         docMarker.current.setLatLng(pos);
//       }
//       if (routeRef.current && window.L) {
//         routeRef.current.setLatLngs([pos, patCoords]);
//       }

//       const remaining = Math.max(0, Math.round(eta * (1 - t)));
//       setEta(remaining);

//       if (t >= 1) {
//         clearInterval(interval);
//         if (docMarker.current) {
//           docMarker.current.setPopupContent(`<b>Dr. ${visit?.doctorName || "Doctor"}</b><br>✅ Arrived!`).openPopup();
//         }
//       }
//     }, 2000); // moves every 2s

//     return () => clearInterval(interval);
//   }, [loaded, visit?.status]);

//   const isAccepted = visit?.status === "accepted";
//   const isArrived  = progress >= 1;

//   return (
//     <div style={{ display: "flex", flexDirection: "column", gap: 12, fontFamily: "'DM Sans', system-ui, sans-serif" }}>

//       {/* Status bar */}
//       <div style={{ background: isArrived ? "#dcfce7" : isAccepted ? "#e0f7f4" : "#fef3c7", border: `1px solid ${isArrived ? "#bbf7d0" : isAccepted ? "#99f6e4" : "#fde68a"}`, borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
//         <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
//           {isAccepted && !isArrived && (
//             <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(0,191,165,.15)", border: "1px solid rgba(0,191,165,.3)", borderRadius: 20, padding: "4px 12px" }}>
//               <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#00bfa5", animation: "pulse 1s infinite" }}/>
//               <span style={{ fontSize: 12, fontWeight: 700, color: "#00897b" }}>Doctor is on the way</span>
//             </div>
//           )}
//           {isArrived && <span style={{ fontWeight: 700, color: "#16a34a" }}>✅ Doctor has arrived!</span>}
//           {!isAccepted && !isArrived && <span style={{ fontWeight: 700, color: "#d97706" }}>⏳ Awaiting confirmation</span>}
//         </div>
//         {isAccepted && !isArrived && eta !== null && (
//           <div style={{ fontWeight: 800, fontSize: 15, color: "#00897b" }}>
//             ETA: ~{eta} min{eta !== 1 ? "s" : ""}
//           </div>
//         )}
//       </div>

//       {/* Progress bar */}
//       {isAccepted && (
//         <div style={{ height: 6, background: "#e2e8f0", borderRadius: 99, overflow: "hidden" }}>
//           <div style={{ height: "100%", width: `${progress * 100}%`, background: "linear-gradient(90deg,#00bfa5,#1e88e5)", borderRadius: 99, transition: "width 2s linear" }}/>
//         </div>
//       )}

//       {/* Map container */}
//       <div ref={mapRef} style={{ height: 340, borderRadius: 14, border: "1px solid #e2e8f0", overflow: "hidden", position: "relative" }}>
//         {/* Fallback when Leaflet is unavailable (offline/blocked) */}
//         {!window.L && loaded && (
//           <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg,#0a1628,#0d2448)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
//             <div style={{ fontSize: 48 }}>🗺️</div>
//             <div style={{ color: "rgba(255,255,255,.7)", fontWeight: 700, fontSize: 15 }}>Map unavailable offline</div>
//             <div style={{ color: "rgba(255,255,255,.4)", fontSize: 13, textAlign: "center", maxWidth: 260 }}>
//               Connect to the internet for live GPS tracking of Dr. {visit?.doctorName}
//             </div>
//             {/* Simulated route visual */}
//             <div style={{ width: 220, height: 2, background: "linear-gradient(90deg,#00bfa5 0%,#1e88e5 100%)", borderRadius: 99, position: "relative" }}>
//               <div style={{ position: "absolute", left: `${progress * 85}%`, top: -12, fontSize: 22, transition: "left 2s linear" }}>🚗</div>
//               <div style={{ position: "absolute", right: 0, top: -12, fontSize: 22 }}>🏠</div>
//             </div>
//             {eta !== null && isAccepted && (
//               <div style={{ color: "#00bfa5", fontWeight: 800, fontSize: 18 }}>ETA: ~{eta} min</div>
//             )}
//           </div>
//         )}
//       </div>

//       {/* Doctor info */}
//       <div style={{ background: "#f4f7fb", borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
//         <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#00bfa5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>🩺</div>
//         <div style={{ flex: 1 }}>
//           <div style={{ fontWeight: 700, fontSize: 14 }}>Dr. {visit?.doctorName}</div>
//           <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>📍 {visit?.address}</div>
//         </div>
//         {isAccepted && !isArrived && (
//           <div style={{ fontSize: 22, animation: "pulse 1.5s infinite" }}>🚗</div>
//         )}
//       </div>

//       <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
//     </div>
//   );
// }






import { useState, useEffect, useRef } from "react";

/*
  LiveMap.jsx  — Simulated live GPS tracking for home visits
  Uses Leaflet (CDN) with a simulated moving doctor marker.
  Props:
    visit  – { id, doctorName, patientName, address, status }
    role   – "doctor" | "patient"
*/

export default function LiveMap({ visit, role }) {
  const mapRef   = useRef(null);
  const leafRef  = useRef(null);
  const markerRef= useRef(null);
  const [eta,    setEta]    = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [dist,   setDist]   = useState(2.4);
  const stepRef  = useRef(null);

  useEffect(() => {
    let script = document.getElementById("leaflet-script");
    let link   = document.getElementById("leaflet-css");

    if (!link) {
      link = document.createElement("link");
      link.id   = "leaflet-css";
      link.rel  = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    if (!script) {
      script = document.createElement("script");
      script.id  = "leaflet-script";
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      document.head.appendChild(script);
      script.onload = () => initMap();
    } else if (window.L) {
      initMap();
    } else {
      script.addEventListener("load", initMap);
    }

    function initMap() {
      if (!mapRef.current || leafRef.current) return;
      const L = window.L;

      // Yaoundé center
      const patLat = 3.848 + (Math.random() - .5) * .01;
      const patLng = 11.502 + (Math.random() - .5) * .01;
      let docLat   = patLat - 0.022;
      let docLng   = patLng - 0.018;

      const map = L.map(mapRef.current).setView([patLat, patLng], 14);
      leafRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
        maxZoom: 19,
      }).addTo(map);

      const patIcon = L.divIcon({
        html: `<div style="background:#1e88e5;color:#fff;border-radius:50%;width:34px;height:34px;display:flex;align-items:center;justify-content:center;font-size:16px;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.3)">🏠</div>`,
        iconSize: [34, 34], iconAnchor: [17, 17], className: ""
      });
      const docIcon = L.divIcon({
        html: `<div style="background:#00bfa5;color:#fff;border-radius:50%;width:34px;height:34px;display:flex;align-items:center;justify-content:center;font-size:16px;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.3)">🩺</div>`,
        iconSize: [34, 34], iconAnchor: [17, 17], className: ""
      });

      L.marker([patLat, patLng], { icon: patIcon }).addTo(map).bindPopup(`<b>${visit.patientName || "Patient"}</b><br>Your location`).openPopup();
      const docMarker = L.marker([docLat, docLng], { icon: docIcon }).addTo(map).bindPopup(`<b>Dr. ${visit.doctorName || "Doctor"}</b><br>On the way`);
      markerRef.current = { marker: docMarker, patLat, patLng, docLat, docLng };

      L.polyline([[docLat, docLng], [patLat, patLng]], { color: "#00bfa5", weight: 3, dashArray: "6,8", opacity: .7 }).addTo(map);

      setLoaded(true);
      setEta(Math.round(dist * 4));

      // Animate doctor marker moving toward patient
      stepRef.current = setInterval(() => {
        if (!markerRef.current) return;
        const { marker, patLat, patLng } = markerRef.current;
        const pos = marker.getLatLng();
        const dLat = (patLat - pos.lat) * 0.08;
        const dLng = (patLng - pos.lng) * 0.08;
        const newLat = pos.lat + dLat;
        const newLng = pos.lng + dLng;
        marker.setLatLng([newLat, newLng]);
        const remaining = Math.sqrt((patLat - newLat) ** 2 + (patLng - newLng) ** 2) * 111;
        setDist(+remaining.toFixed(2));
        setEta(Math.max(1, Math.round(remaining * 4 * 60)));
      }, 2000);
    }

    return () => {
      clearInterval(stepRef.current);
      if (leafRef.current) { leafRef.current.remove(); leafRef.current = null; }
    };
  }, [visit.id]);

  const etaStr = eta ? (eta >= 60 ? `${Math.floor(eta / 60)}h ${eta % 60}m` : `${eta} min`) : "Calculating…";

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif" }}>
      {/* Status bar */}
      <div style={{ display: "flex", gap: 12, marginBottom: 10, flexWrap: "wrap" }}>
        <div style={{ background: "rgba(0,191,165,.08)", border: "1px solid rgba(0,191,165,.25)", borderRadius: 10, padding: "8px 14px", display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#00bfa5", animation: "pulse 1s infinite" }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: "#00897b" }}>Live Tracking Active</span>
        </div>
        {loaded && (
          <>
            <div style={{ background: "var(--bg,#f0f4f9)", border: "1px solid #e2e8f0", borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 600 }}>
              📍 {dist.toFixed(1)} km away
            </div>
            <div style={{ background: "#fef3c7", border: "1px solid #fde68a", borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 600, color: "#d97706" }}>
              ⏱ ETA: {etaStr}
            </div>
          </>
        )}
      </div>

      {/* Map container */}
      <div ref={mapRef} style={{ height: 280, borderRadius: 14, overflow: "hidden", border: "1px solid #e2e8f0", background: "#e8f4f8" }}>
        {!loaded && (
          <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", flexDirection: "column", gap: 8 }}>
            <div style={{ fontSize: 32 }}>🗺️</div>
            <p style={{ fontSize: 14 }}>Loading map…</p>
          </div>
        )}
      </div>

      <div style={{ marginTop: 10, fontSize: 12, color: "#94a3b8", display: "flex", alignItems: "center", gap: 6 }}>
        <span>🩺 = Doctor</span>
        <span style={{ margin: "0 4px" }}>·</span>
        <span>🏠 = {role === "patient" ? "Your location" : "Patient"}</span>
        <span style={{ margin: "0 4px" }}>·</span>
        <span>Updated every 2s</span>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
    </div>
  );
}