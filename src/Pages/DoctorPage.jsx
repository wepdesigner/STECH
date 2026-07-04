
import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import "./Styles/Doc.css";

/* ═══════════════════════════════════════════════════════════════
   SHARED STORAGE  (same keys as AdminPanel, DoctorPanel, Register)
═══════════════════════════════════════════════════════════════ */
const LS = {
  get: (k, d) => {
    try { const v = localStorage.getItem(k); return v !== null ? JSON.parse(v) : d; }
    catch { return d; }
  },
};

const getDoctors     = () => (LS.get("adm_doctors", []) || []).filter(d => d.status === "active");
const getApptCount   = () => (LS.get("adm_appointments", []) || []).length;
const getPatientCount= () => {
  const adm = LS.get("adm_patients", []) || [];
  const te  = LS.get("te_patients",  []) || [];
  const ids = new Set(adm.map(p => p.id));
  return adm.length + te.filter(p => !ids.has(p.id)).length;
};

/* ═══════════════════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════════════════ */
const SERVICES = [
  { icon: "🦷", title: "General Dentistry",    desc: "Comprehensive check-ups, fillings, extractions and preventive care for the whole family.",    color: "#1e88e5" },
  { icon: "✨", title: "Cosmetic Dentistry",   desc: "Teeth whitening, veneers, and smile makeovers designed to boost your confidence.",              color: "#00bfa5" },
  { icon: "🔧", title: "Orthodontics",         desc: "Braces, clear aligners, and retainers to correct alignment and give you a perfect smile.",      color: "#7c3aed" },
  { icon: "🏥", title: "Oral Surgery",         desc: "Wisdom teeth removal, implants, and complex extractions performed with precision and care.",     color: "#e85c4a" },
  { icon: "🩺", title: "Periodontics",         desc: "Advanced gum disease treatment, scaling, root planing, and long-term gum health management.",   color: "#f59e0b" },
  { icon: "🔬", title: "Endodontics",          desc: "Root canal therapy using the latest technology to save teeth and eliminate pain effectively.",   color: "#ec4899" },
];

const TESTIMONIALS = [
  { name: "Emmanuel Tabi",   role: "Premium Member",   rating: 5, text: "STECH Dental transformed my smile completely. The team is professional, caring, and the technology is impressive. I've never felt more confident." },
  { name: "Fatima Oumarou", role: "Standard Plan",     rating: 5, text: "Booking online was so simple and the reminder system is excellent. Dr. Olivia explained every step of my treatment clearly. Highly recommend!" },
  { name: "Ngono Pierre",   role: "Premium Member",   rating: 5, text: "The home visit service is a game-changer. As a busy professional I can't always make it to the clinic — STECH brings the clinic to me." },
  { name: "Aline Biya",     role: "Basic Plan",        rating: 5, text: "Clean, modern facilities and a genuinely caring staff. The admin dashboard even lets me track my appointments and medical history. Brilliant system." },
];

const PROCESS = [
  { step: "01", title: "Register Online",       desc: "Create your free account in under 2 minutes. Choose your plan and select your preferred specialist." },
  { step: "02", title: "Book Appointment",      desc: "Pick a date, time, and treatment type. Your doctor receives an instant notification." },
  { step: "03", title: "Get Confirmed",         desc: "Your doctor reviews and confirms your booking. You receive a notification immediately." },
  { step: "04", title: "Receive Expert Care",   desc: "Attend your appointment and enjoy world-class dental care at our state-of-the-art clinic." },
];

const STATS_BASE = [
  { icon: "😊", label: "Happy Patients",    key: "patients",    suffix: "+"  },
  { icon: "🦷", label: "Procedures Done",   key: "appointments",suffix: "+"  },
  { icon: "🩺", label: "Specialists",       key: "doctors",     suffix: ""   },
  { icon: "⭐", label: "Average Rating",    key: "rating",      suffix: "/5" },
];

const AV_COLORS = ["#1e88e5","#00bfa5","#7c3aed","#e85c4a","#f59e0b","#ec4899","#0891b2","#16a34a"];

/* ═══════════════════════════════════════════════════════════════
   SMALL COMPONENTS
═══════════════════════════════════════════════════════════════ */
function Avatar({ name = "?", size = 60, color }) {
  const initials = name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  const bg = color || AV_COLORS[(name.charCodeAt(0) || 0) % AV_COLORS.length];
  return (
    <div className="ln-avatar" style={{ width: size, height: size, background: bg, fontSize: size * 0.35 }}>
      {initials}
    </div>
  );
}

function Stars({ count = 5 }) {
  return (
    <div className="ln-stars">
      {[...Array(5)].map((_, i) => (
        <span key={i} className={i < count ? "ln-star filled" : "ln-star"}>★</span>
      ))}
    </div>
  );
}

/* Animated counter */
function Counter({ target, suffix = "", duration = 1800 }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const start = Date.now();
          const tick = () => {
            const elapsed = Date.now() - start;
            const progress = Math.min(elapsed / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 3);
            setVal(Math.round(target * ease));
            if (progress < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

/* ═══════════════════════════════════════════════════════════════
   ROOT EXPORT
═══════════════════════════════════════════════════════════════ */
export default function DoctorPage() {
  const [menuOpen,  setMenu]    = useState(false);
  const [scrolled,  setScrolled]= useState(false);
  const [doctors,   setDoctors] = useState([]);
  const [stats,     setStats]   = useState({ patients: 0, appointments: 0, doctors: 0, rating: 4.9 });
  const [activeTab, setTab]     = useState(0);

  /* Live data from admin store */
  useEffect(() => {
    const load = () => {
      const docs = getDoctors();
      setDoctors(docs);
      setStats({
        patients:     Math.max(getPatientCount(), 120),
        appointments: Math.max(getApptCount(),    350),
        doctors:      Math.max(docs.length,        6),
        rating:       4.9,
      });
    };
    load();
    window.addEventListener("stech_refresh", load);
    return () => window.removeEventListener("stech_refresh", load);
  }, []);

  /* Navbar scroll effect */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = useCallback((id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMenu(false);
  }, []);

  /* Testimonial auto-rotate */
  useEffect(() => {
    const t = setInterval(() => setTab(v => (v + 1) % TESTIMONIALS.length), 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="ln-root">

      {/* ══════════════════ NAVBAR ══════════════════ */}
      <header className={`ln-nav${scrolled ? " ln-nav--scrolled" : ""}`}>
        <div className="ln-nav-inner">
          {/* Logo */}
          <Link to="/" className="ln-logo">
            <div className="ln-logo-orb">🦷</div>
            <div>
              <div className="ln-logo-name">STECH Dental</div>
              <div className="ln-logo-sub">ToothEase Platform</div>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="ln-nav-links">
            {[
              ["Home",         "#home"],
              ["Services",     "#services"],
              ["Our Doctors",  "#doctors"],
              ["Process",      "#process"],
              ["Testimonials", "#testimonials"],
              ["Contact",      "#contact"],
            ].map(([label, href]) => (
              <a key={label} href={href}
                className="ln-nav-link"
                onClick={e => { e.preventDefault(); scrollTo(href.slice(1)); }}>
                {label}
              </a>
            ))}
          </nav>

          {/* CTA buttons */}
          <div className="ln-nav-cta">
            <Link to="/auth"        className="ln-btn ln-btn-ghost ln-btn-sm">Log In</Link>
            <Link to="/appointment" className="ln-btn ln-btn-teal ln-btn-sm">Book Now</Link>
          </div>

          {/* Hamburger */}
          <button className="ln-hamburger" onClick={() => setMenu(m => !m)} aria-label="Menu">
            <span className={menuOpen ? "open" : ""} />
            <span className={menuOpen ? "open" : ""} />
            <span className={menuOpen ? "open" : ""} />
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="ln-mobile-menu">
            {[
              ["Home",         "home"],
              ["Services",     "services"],
              ["Our Doctors",  "doctors"],
              ["Process",      "process"],
              ["Testimonials", "testimonials"],
              ["Contact",      "contact"],
            ].map(([label, id]) => (
              <button key={id} className="ln-mobile-link" onClick={() => scrollTo(id)}>
                {label}
              </button>
            ))}
            <div className="ln-mobile-ctas">
              <Link to="/auth"        className="ln-btn ln-btn-ghost"   onClick={() => setMenu(false)}>Log In</Link>
              <Link to="/register"    className="ln-btn ln-btn-outline" onClick={() => setMenu(false)}>Register</Link>
              <Link to="/appointment" className="ln-btn ln-btn-teal"    onClick={() => setMenu(false)}>Book Appointment</Link>
            </div>
          </div>
        )}
      </header>

      {/* ══════════════════ HERO ══════════════════ */}
      <section id="home" className="ln-hero">
        {/* Background layers */}
        <div className="ln-hero-bg" />
        <div className="ln-hero-particles">
          {[...Array(16)].map((_, i) => (
            <div key={i} className="ln-particle" style={{ "--i": i }} />
          ))}
        </div>
        {/* Floating dental cross */}
        <div className="ln-hero-emblem">+</div>

        <div className="ln-hero-inner">
          {/* LEFT — copy */}
          <div className="ln-hero-copy">
            <div className="ln-hero-badge">
              <span className="ln-badge-dot" />
              Cameroon's Premier Dental Platform
            </div>

            <h1 className="ln-hero-h1">
              Expert Dental Care,<br />
              <em>Designed Around You.</em>
            </h1>

            <p className="ln-hero-p">
              STECH Dental connects patients with verified specialists for seamless consultations,
              real-time bookings, and personalised care — all from one intelligent platform.
            </p>

            <div className="ln-hero-actions">
              <Link to="/appointment" className="ln-btn ln-btn-teal ln-btn-lg">
                📅 Book an Appointment
              </Link>
              <Link to="/register" className="ln-btn ln-btn-outline-white ln-btn-lg">
                Create Free Account →
              </Link>
            </div>

            {/* Mini trust strip */}
            <div className="ln-hero-trust">
              <div className="ln-trust-faces">
                {["ET","FO","NP","AB"].map((ini, i) => (
                  <div key={i} className="ln-trust-face"
                    style={{ background: AV_COLORS[i], marginLeft: i ? "-10px" : 0, zIndex: 4 - i }}>
                    {ini}
                  </div>
                ))}
              </div>
              <div>
                <Stars count={5} />
                <span className="ln-trust-label">
                  Trusted by <strong>{stats.patients.toLocaleString()}+</strong> patients
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT — info card */}
          <div className="ln-hero-card-wrap">
            <div className="ln-hero-card">
              <div className="ln-hero-card-head">
                <div className="ln-hero-card-icon">🦷</div>
                <div>
                  <div className="ln-hero-card-title">Quick Appointment</div>
                  <div className="ln-hero-card-sub">Available 24/7 · Online</div>
                </div>
              </div>

              <div className="ln-hero-card-body">
                {[
                  { icon: "✓", label: "Verified Specialists",   val: `${stats.doctors} Active` },
                  { icon: "✓", label: "Avg. Wait Time",         val: "Under 24h" },
                  { icon: "✓", label: "Patient Satisfaction",   val: "4.9 / 5.0" },
                  { icon: "✓", label: "Consultations Done",     val: `${stats.appointments.toLocaleString()}+` },
                ].map(r => (
                  <div key={r.label} className="ln-hero-card-row">
                    <span className="ln-check">{r.icon}</span>
                    <span className="ln-row-label">{r.label}</span>
                    <strong className="ln-row-val">{r.val}</strong>
                  </div>
                ))}
              </div>

              <Link to="/appointment" className="ln-btn ln-btn-teal" style={{ width: "100%", justifyContent: "center", marginTop: 8 }}>
                Book Now — It's Free
              </Link>

              <div className="ln-hero-card-foot">
                No registration required for guest bookings
              </div>
            </div>

            {/* Floating badges */}
            <div className="ln-float-badge ln-float-badge--tl">
              <span>🏆</span> Top Rated Clinic
            </div>
            <div className="ln-float-badge ln-float-badge--br">
              <span>🔒</span> HIPAA Compliant
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <button className="ln-scroll-hint" onClick={() => scrollTo("services")} aria-label="Scroll down">
          <div className="ln-scroll-arrow" />
        </button>
      </section>

      {/* ══════════════════ STATS BAND ══════════════════ */}
      <section className="ln-stats-band">
        <div className="ln-stats-inner">
          {STATS_BASE.map(s => (
            <div key={s.label} className="ln-stat-item">
              <div className="ln-stat-icon">{s.icon}</div>
              <div className="ln-stat-num">
                {s.key === "rating"
                  ? <>{stats[s.key]}{s.suffix}</>
                  : <Counter target={stats[s.key]} suffix={s.suffix} />
                }
              </div>
              <div className="ln-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════ SERVICES ══════════════════ */}
      <section id="services" className="ln-section ln-services">
        <div className="ln-section-inner">
          <div className="ln-section-head">
            <p className="ln-eyebrow">What We Offer</p>
            <h2 className="ln-section-title">
              Comprehensive Dental<br /><em>Services & Treatments</em>
            </h2>
            <p className="ln-section-sub">
              From routine check-ups to complex surgical procedures, our verified specialists
              deliver world-class care using the latest dental technology.
            </p>
          </div>

          <div className="ln-services-grid">
            {SERVICES.map((s, i) => (
              <div key={s.title} className="ln-service-card" style={{ "--scolor": s.color, "--delay": `${i * 0.08}s` }}>
                <div className="ln-service-icon-wrap" style={{ background: s.color + "1a" }}>
                  <span className="ln-service-icon">{s.icon}</span>
                </div>
                <h3 className="ln-service-title">{s.title}</h3>
                <p className="ln-service-desc">{s.desc}</p>
                <Link to="/appointment" className="ln-service-cta">
                  Book Now <span>→</span>
                </Link>
              </div>
            ))}
          </div>

          <div className="ln-services-footer">
            <p>Not sure which treatment you need?</p>
            <Link to="/appointment" className="ln-btn ln-btn-teal">
              Book a Free Consultation
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════ WHY CHOOSE US ══════════════════ */}
      <section className="ln-why">
        <div className="ln-why-inner">
          {/* Left: content */}
          <div className="ln-why-copy">
            <p className="ln-eyebrow ln-eyebrow--teal">Why STECH Dental?</p>
            <h2 className="ln-section-title">
              A Smarter Way to<br /><em>Manage Your Dental Health</em>
            </h2>
            <p className="ln-why-p">
              We've reimagined the dental experience from the ground up — combining
              world-class specialists with a seamless digital platform so that getting
              expert care is as easy as booking a table for dinner.
            </p>

            <div className="ln-why-list">
              {[
                { icon: "⚡", title: "Instant Online Booking",     desc: "Book appointments 24/7. Confirmations arrive in real time." },
                { icon: "🔔", title: "Smart Notifications",        desc: "Automated reminders and status updates keep you informed." },
                { icon: "🏠", title: "Home Visit Service",         desc: "Premium members get verified specialists at their doorstep." },
                { icon: "📊", title: "Unified Health Dashboard",   desc: "All your records, prescriptions, and history in one place." },
                { icon: "💳", title: "Transparent Pricing",        desc: "Clear fees, flexible plans, no hidden costs." },
                { icon: "🔒", title: "Medical-Grade Security",     desc: "Your health data is encrypted and never sold to third parties." },
              ].map(w => (
                <div key={w.title} className="ln-why-item">
                  <div className="ln-why-item-icon">{w.icon}</div>
                  <div>
                    <strong>{w.title}</strong>
                    <p>{w.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <Link to="/register" className="ln-btn ln-btn-navy ln-btn-lg" style={{ marginTop: "2rem" }}>
              Get Started — It's Free →
            </Link>
          </div>

          {/* Right: visual */}
          <div className="ln-why-visual">
            <div className="ln-why-card ln-why-card--main">
              <div className="ln-why-card-head">
                <div className="ln-why-card-orb">🦷</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "1rem" }}>Your Dental Hub</div>
                  <div style={{ fontSize: ".8rem", color: "rgba(255,255,255,.5)" }}>Live Dashboard</div>
                </div>
                <div className="ln-live-dot-wrap">
                  <div className="ln-live-dot" />
                  <span>Live</span>
                </div>
              </div>
              {[
                { label: "Appointments Today",  val: Math.max(getApptCount() % 8, 3), color: "#1e88e5" },
                { label: "Pending Requests",    val: Math.max(getApptCount() % 4, 1), color: "#f59e0b" },
                { label: "Active Doctors",      val: stats.doctors,                   color: "#00bfa5" },
              ].map(r => (
                <div key={r.label} className="ln-why-metric">
                  <span className="ln-why-metric-label">{r.label}</span>
                  <div className="ln-why-metric-bar-wrap">
                    <div className="ln-why-metric-bar"
                      style={{ width: `${Math.min((r.val / 10) * 100, 100)}%`, background: r.color }} />
                  </div>
                  <span className="ln-why-metric-val" style={{ color: r.color }}>{r.val}</span>
                </div>
              ))}
            </div>

            <div className="ln-why-card ln-why-card--sm ln-why-card--tl">
              <div style={{ fontSize: "1.5rem", marginBottom: 6 }}>📅</div>
              <strong>Next Available</strong>
              <p>Today · 10:00 AM</p>
            </div>
            <div className="ln-why-card ln-why-card--sm ln-why-card--br">
              <div style={{ fontSize: "1.5rem", marginBottom: 6 }}>⭐</div>
              <strong>4.9 Rating</strong>
              <p>From {stats.patients}+ patients</p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════ DOCTORS ══════════════════ */}
      <section id="doctors" className="ln-section ln-doctors">
        <div className="ln-section-inner">
          <div className="ln-section-head">
            <p className="ln-eyebrow">Our Specialists</p>
            <h2 className="ln-section-title">
              Meet the Expert Team<br /><em>Behind Your Smile</em>
            </h2>
            <p className="ln-section-sub">
              Every doctor on our platform is verified, board-certified, and committed to
              delivering the highest standard of patient care.
            </p>
          </div>

          {doctors.length === 0 ? (
            <div className="ln-doctors-empty">
              <div style={{ fontSize: "3rem", marginBottom: 16 }}>🩺</div>
              <h3>Specialists coming soon</h3>
              <p>Our admin team is onboarding verified specialists. Check back shortly.</p>
            </div>
          ) : (
            <div className="ln-doctors-grid">
              {doctors.map((d, i) => (
                <div key={d.id} className="ln-doctor-card" style={{ "--delay": `${i * 0.1}s` }}>
                  <div className="ln-doctor-card-top" style={{ background: `linear-gradient(135deg, ${d.color || "#1e88e5"}22, ${d.color || "#1e88e5"}08)` }}>
                    <Avatar name={d.name} size={80} color={d.color} />
                    {d.status === "active" && (
                      <div className="ln-doctor-available">
                        <div className="ln-avail-dot" />
                        Available
                      </div>
                    )}
                  </div>
                  <div className="ln-doctor-card-body">
                    <h3 className="ln-doctor-name">{d.name}</h3>
                    <p className="ln-doctor-spec">{d.specialty}</p>
                    <div className="ln-doctor-meta">
                      {d.rating && (
                        <span className="ln-doctor-rating">
                          ★ {d.rating}
                        </span>
                      )}
                      {d.experience && (
                        <span className="ln-doctor-exp">{d.experience}</span>
                      )}
                      {d.location && (
                        <span className="ln-doctor-loc">📍 {d.location}</span>
                      )}
                    </div>
                    {d.bio && <p className="ln-doctor-bio">{d.bio}</p>}
                    {d.consultFee && (
                      <div className="ln-doctor-fee">
                        {(d.consultFee).toLocaleString("fr-CM")} XAF
                        <span> / consultation</span>
                      </div>
                    )}
                    <Link to="/appointment" className="ln-btn ln-btn-teal ln-btn-sm"
                      style={{ width: "100%", justifyContent: "center", marginTop: 14 }}>
                      Book with {d.name?.split(" ").pop()}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {doctors.length > 0 && (
            <div className="ln-doctors-footer">
              <Link to="/appointment" className="ln-btn ln-btn-outline-navy">
                View All Specialists & Book →
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════ PROCESS ══════════════════ */}
      <section id="process" className="ln-process">
        <div className="ln-section-inner">
          <div className="ln-section-head ln-section-head--light">
            <p className="ln-eyebrow ln-eyebrow--white">How It Works</p>
            <h2 className="ln-section-title ln-section-title--white">
              From Booking to Treatment<br /><em>in Four Simple Steps</em>
            </h2>
          </div>

          <div className="ln-process-grid">
            {PROCESS.map((p, i) => (
              <div key={p.step} className="ln-process-card" style={{ "--delay": `${i * 0.12}s` }}>
                <div className="ln-process-step">{p.step}</div>
                <h3 className="ln-process-title">{p.title}</h3>
                <p className="ln-process-desc">{p.desc}</p>
                {i < PROCESS.length - 1 && <div className="ln-process-arrow">→</div>}
              </div>
            ))}
          </div>

          <div className="ln-process-cta">
            <Link to="/register" className="ln-btn ln-btn-teal ln-btn-lg">
              Start Your Journey Today
            </Link>
            <Link to="/appointment" className="ln-btn ln-btn-outline-white ln-btn-lg">
              Book Without Registering
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════ PLANS ══════════════════ */}
      <section className="ln-section ln-plans">
        <div className="ln-section-inner">
          <div className="ln-section-head">
            <p className="ln-eyebrow">Membership Plans</p>
            <h2 className="ln-section-title">
              Flexible Plans for<br /><em>Every Patient</em>
            </h2>
          </div>

          <div className="ln-plans-grid">
            {[
              {
                name: "Basic", price: "20,000", badge: null,
                color: "#64748b",
                features: ["2 consultations/month","Email support","Basic health records","Appointment reminders"],
                notIncluded: ["Home visits","Priority support","Specialist access"],
              },
              {
                name: "Standard", price: "35,000", badge: "Most Popular",
                color: "#1e88e5",
                features: ["5 consultations/month","Chat & email support","Full health records","Priority booking","Appointment history"],
                notIncluded: ["Home visits"],
              },
              {
                name: "Premium", price: "50,000", badge: "Best Value",
                color: "#00bfa5",
                features: ["Unlimited consultations","24/7 priority support","Full records & history","Home visit service","Specialist access","Emergency priority"],
                notIncluded: [],
              },
            ].map(plan => (
              <div key={plan.name}
                className={`ln-plan-card${plan.name === "Standard" ? " ln-plan-card--featured" : ""}`}
                style={{ "--pcolor": plan.color }}>
                {plan.badge && <div className="ln-plan-badge">{plan.badge}</div>}
                <div className="ln-plan-name">{plan.name}</div>
                <div className="ln-plan-price">
                  {plan.price}<span> XAF/mo</span>
                </div>
                <ul className="ln-plan-features">
                  {plan.features.map(f => (
                    <li key={f} className="ln-plan-feat--yes">
                      <span>✓</span>{f}
                    </li>
                  ))}
                  {plan.notIncluded.map(f => (
                    <li key={f} className="ln-plan-feat--no">
                      <span>✗</span>{f}
                    </li>
                  ))}
                </ul>
                <Link to="/register" className="ln-btn ln-btn-plan" style={{ "--pcolor": plan.color }}>
                  Get {plan.name}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ TESTIMONIALS ══════════════════ */}
      <section id="testimonials" className="ln-section ln-testimonials">
        <div className="ln-section-inner">
          <div className="ln-section-head">
            <p className="ln-eyebrow">Patient Stories</p>
            <h2 className="ln-section-title">
              What Our Patients<br /><em>Say About Us</em>
            </h2>
          </div>

          {/* Featured testimonial */}
          <div className="ln-testi-main">
            <div className="ln-testi-quote">"</div>
            <p className="ln-testi-text">{TESTIMONIALS[activeTab].text}</p>
            <div className="ln-testi-author">
              <Avatar name={TESTIMONIALS[activeTab].name} size={48} />
              <div>
                <strong>{TESTIMONIALS[activeTab].name}</strong>
                <span>{TESTIMONIALS[activeTab].role}</span>
              </div>
              <Stars count={TESTIMONIALS[activeTab].rating} />
            </div>
          </div>

          {/* Dots */}
          <div className="ln-testi-dots">
            {TESTIMONIALS.map((_, i) => (
              <button key={i}
                className={`ln-testi-dot${activeTab === i ? " active" : ""}`}
                onClick={() => setTab(i)}
                aria-label={`Testimonial ${i+1}`} />
            ))}
          </div>

          {/* Grid cards */}
          <div className="ln-testi-grid">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className={`ln-testi-card${activeTab === i ? " ln-testi-card--active" : ""}`}
                onClick={() => setTab(i)}>
                <Stars count={t.rating} />
                <p className="ln-testi-card-text">"{t.text.slice(0, 100)}…"</p>
                <div className="ln-testi-card-author">
                  <Avatar name={t.name} size={36} />
                  <div>
                    <strong>{t.name}</strong>
                    <span>{t.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ CTA BAND ══════════════════ */}
      <section className="ln-cta-band">
        <div className="ln-cta-inner">
          <div className="ln-cta-copy">
            <h2>Ready to Transform<br /><em>Your Smile?</em></h2>
            <p>
              Join {stats.patients.toLocaleString()}+ patients who trust STECH Dental for their oral health.
              Book your first consultation today — no registration required.
            </p>
          </div>
          <div className="ln-cta-actions">
            <Link to="/appointment" className="ln-btn ln-btn-teal ln-btn-lg">
              📅 Book an Appointment
            </Link>
            <Link to="/register" className="ln-btn ln-btn-outline-white ln-btn-lg">
              Create Free Account
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════ CONTACT ══════════════════ */}
      <section id="contact" className="ln-section ln-contact">
        <div className="ln-section-inner">
          <div className="ln-section-head">
            <p className="ln-eyebrow">Get in Touch</p>
            <h2 className="ln-section-title">We're Here to<br /><em>Help You</em></h2>
          </div>

          <div className="ln-contact-grid">
            {[
              { icon: "📍", label: "Address",   val: "Bonapriso, Douala — Cameroon",  sub: "Open Mon – Sat, 8am – 6pm" },
              { icon: "📞", label: "Phone",     val: "+237 699 000 001",               sub: "Emergency line available 24/7" },
              { icon: "✉",  label: "Email",     val: "info@stechdental.cm",            sub: "We reply within 2 business hours" },
              { icon: "🌐", label: "Website",   val: "www.STECHDental.cm",             sub: "Book online anytime" },
            ].map(c => (
              <div key={c.label} className="ln-contact-card">
                <div className="ln-contact-icon">{c.icon}</div>
                <div className="ln-contact-label">{c.label}</div>
                <div className="ln-contact-val">{c.val}</div>
                <div className="ln-contact-sub">{c.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ FOOTER ══════════════════ */}
      <footer className="ln-footer">
        <div className="ln-footer-inner">
          {/* Brand col */}
          <div className="ln-footer-col ln-footer-brand">
            <div className="ln-footer-logo">
              <div className="ln-logo-orb ln-logo-orb--sm">🦷</div>
              <div>
                <div className="ln-logo-name">STECH Dental</div>
                <div className="ln-logo-sub">ToothEase Platform</div>
              </div>
            </div>
            <p className="ln-footer-about">
              Cameroon's leading dental care platform — connecting patients with verified
              specialists for world-class oral health management.
            </p>
            <div className="ln-footer-socials">
              {["f","in","𝕏","ig"].map(s => (
                <span key={s} className="ln-social-btn">{s}</span>
              ))}
            </div>
          </div>

          {/* Services col */}
          <div className="ln-footer-col">
            <h4>Treatments</h4>
            <ul>
              {["General Dentistry","Orthodontics","Cosmetic Dentistry","Oral Surgery","Periodontics","Endodontics"].map(s => (
                <li key={s}><Link to="/appointment">{s}</Link></li>
              ))}
            </ul>
          </div>

          {/* Platform col */}
          <div className="ln-footer-col">
            <h4>Platform</h4>
            <ul>
              {[
                ["Book Appointment", "/appointment"],
                ["Patient Register",  "/register"],
                ["Patient Login",     "/auth"],
                ["My Dashboard",      "/auth"],
              ].map(([label, path]) => (
                <li key={label}><Link to={path}>{label}</Link></li>
              ))}
            </ul>
          </div>

          {/* Newsletter col */}
          <div className="ln-footer-col">
            <h4>Newsletter</h4>
            <p>Dental health tips and platform updates delivered monthly.</p>
            <NewsletterForm />
          </div>
        </div>

        <div className="ln-footer-bottom">
          <span>© 2025 STECH Dental · ToothEase. All Rights Reserved.</span>
          <div className="ln-footer-links">
            <a href="#">Terms & Conditions</a>
            <a href="#">Privacy Policy</a>
            <a href="#">Cookie Policy</a>
          </div>
          <span className="ln-footer-domain">www.STECHDental.cm</span>
        </div>
      </footer>

    </div>
  );
}

/* ── Newsletter mini-form ── */
function NewsletterForm() {
  const [email, setEmail]   = useState("");
  const [done,  setDone]    = useState(false);
  const submit = () => { if (email.includes("@")) setDone(true); };
  return done
    ? <p className="ln-nl-done">✓ You're subscribed! Thank you.</p>
    : (
      <div className="ln-nl-wrap">
        <input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === "Enter" && submit()}
        />
        <button onClick={submit} aria-label="Subscribe">→</button>
      </div>
    );
}