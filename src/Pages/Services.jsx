import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import "./Styles/Services.css";

/* ─── Unsplash image helper ────────────────────────────────────────────────
   Format: https://images.unsplash.com/photo-{ID}?w=480&h=260&fit=crop&auto=format&q=80
   All photos are free-to-use under the Unsplash License.
   Replace any `img` value with a local path if you have your own photos:
   e.g.  img: "/assets/services/oral-exam.jpg"
──────────────────────────────────────────────────────────────────────────── */
const UNS = (id) =>
  `https://images.unsplash.com/photo-${id}?w=480&h=260&fit=crop&auto=format&q=80`;

/* ─── Service data ─────────────────────────────────────────────────────────── */
const SERVICES = [
  {
    id: "oral-exam",
    name: "Oral Examination",
    category: "General",
    img: UNS("1588776814546-1ffedbe47add"),
    imgAlt: "Dentist performing an oral examination",
    desc: "Comprehensive check-up to assess your overall oral health and catch issues early.",
    color: "#1e88e5",
  },
  {
    id: "fillings",
    name: "Dental Fillings",
    category: "General",
    img: UNS("1609840114035-3c981b782dfe"),
    imgAlt: "Tooth-coloured composite filling being applied",
    desc: "Restore decayed teeth with tooth-coloured composite resin for a natural finish.",
    color: "#00bfa5",
  },
  {
    id: "extraction",
    name: "Tooth Removal",
    category: "Surgical",
    img: UNS("1606811971618-4486d14f3f99"),
    imgAlt: "Dental extraction procedure",
    desc: "Safe, minimally-invasive extractions performed under local anaesthesia.",
    color: "#e85c4a",
  },
  {
    id: "cleaning",
    name: "Teeth Cleaning",
    category: "General",
    img: UNS("1598256989800-fe5f95da9787"),
    imgAlt: "Professional teeth cleaning and scaling",
    desc: "Professional scaling and polishing to remove plaque, tartar, and surface stains.",
    color: "#0891b2",
  },
  {
    id: "whitening",
    name: "Teeth Whitening",
    category: "Cosmetic",
    img: UNS("1606265752439-1f18756aa5fc"),
    imgAlt: "Bright white smile after teeth whitening",
    desc: "In-clinic bleaching treatment that brightens your smile up to 8 shades in one session.",
    color: "#f59e0b",
  },
  {
    id: "crowns",
    name: "Crowns",
    category: "Restorative",
    img: UNS("1581579186913-45ac6bc9a87e"),
    imgAlt: "Dental crown being fitted",
    desc: "Porcelain or zirconia caps that protect and restore the shape of damaged teeth.",
    color: "#7c3aed",
  },
  {
    id: "bridges",
    name: "Bridges",
    category: "Restorative",
    img: UNS("1629909613654-28e377c37b09"),
    imgAlt: "Dental bridge prosthetic on model",
    desc: "Fixed dental bridges to replace one or more missing teeth and restore your bite.",
    color: "#be185d",
  },
  {
    id: "jewellery",
    name: "Teeth Jewellery",
    category: "Cosmetic",
    img: UNS("1607613009820-a29f7bb81c04"),
    imgAlt: "Close-up of a bright smile with tooth gem",
    desc: "Crystal or gold tooth gems applied safely to the enamel surface — zero drilling.",
    color: "#db2777",
  },
  {
    id: "braces",
    name: "Braces",
    category: "Orthodontic",
    img: UNS("1571772996211-2f02c9727629"),
    imgAlt: "Patient wearing metal braces",
    desc: "Traditional metal or ceramic braces to straighten teeth and align your jaw.",
    color: "#1e88e5",
  },
  {
    id: "dentures",
    name: "Dentures",
    category: "Restorative",
    img: UNS("1576091160550-2173dba999ef"),
    imgAlt: "Custom dentures on dental cast",
    desc: "Custom full or partial dentures crafted for comfort, function, and a natural look.",
    color: "#00897b",
  },
  {
    id: "gum-therapy",
    name: "Gum Therapy",
    category: "General",
    img: UNS("1559757148-5c350d0d3c56"),
    imgAlt: "Dentist performing gum treatment",
    desc: "Non-surgical deep cleaning and periodontal therapy to reverse gum disease.",
    color: "#16a34a",
  },
  {
    id: "night-guards",
    name: "Night Guards",
    category: "General",
    img: UNS("1588776814546-1ffedbe47add"),
    imgAlt: "Custom night guard mouthguard",
    desc: "Custom-fitted occlusal guards to protect against teeth grinding while you sleep.",
    color: "#0891b2",
  },
  {
    id: "veneers",
    name: "Veneers",
    category: "Cosmetic",
    img: UNS("1651008571463-f6296cbe8b54"),
    imgAlt: "Porcelain veneers on front teeth",
    desc: "Ultra-thin porcelain shells bonded to the front of teeth for an instant smile upgrade.",
    color: "#f59e0b",
  },
  {
    id: "makeover",
    name: "Smile Makeover",
    category: "Cosmetic",
    img: UNS("1606265752439-1f18756aa5fc"),
    imgAlt: "Beautiful smile after a full smile makeover",
    desc: "A personalised combination of cosmetic treatments planned around your unique smile goals.",
    color: "#7c3aed",
  },
  {
    id: "root-canal",
    name: "Root Canal",
    category: "Surgical",
    img: UNS("1606811971618-4486d14f3f99"),
    imgAlt: "Endodontic root canal procedure",
    desc: "Painless endodontic treatment that saves severely infected teeth from extraction.",
    color: "#e85c4a",
  },
  {
    id: "slimming-wires",
    name: "Slimming Wires",
    category: "Orthodontic",
    img: UNS("1571772996211-2f02c9727629"),
    imgAlt: "Fine orthodontic arch-wires on braces",
    desc: "Fine arch-wires used in the later stages of orthodontic treatment for fine-tuning.",
    color: "#be185d",
  },
];

const CATEGORIES = ["All", "General", "Cosmetic", "Surgical", "Restorative", "Orthodontic"];

const TAG_COLORS = {
  General:     { bg: "#dbeafe", color: "#1e40af" },
  Cosmetic:    { bg: "#fef3c7", color: "#92400e" },
  Surgical:    { bg: "#fee2e2", color: "#991b1b" },
  Restorative: { bg: "#ede9fe", color: "#4c1d95" },
  Orthodontic: { bg: "#dcfce7", color: "#14532d" },
};

/* ─── ServiceCard ──────────────────────────────────────────────────────────── */
function ServiceCard({ service }) {
  const [imgError, setImgError] = useState(false);
  const tag = TAG_COLORS[service.category] || { bg: "#f1f5f9", color: "#475569" };

  return (
    <div className="ss-card" style={{ "--accent": service.color }}>

      {/* ── Visual area ── */}
      <div className="ss-card-visual">
        {!imgError ? (
          <img
            src={service.img}
            alt={service.imgAlt}
            className="ss-card-img"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          /* Fallback gradient tile if image fails to load */
          <div
            className="ss-card-img-fallback"
            style={{ background: `linear-gradient(135deg, ${service.color}22, ${service.color}11)` }}
            aria-hidden="true"
          />
        )}

        {/* Dark gradient at bottom so card name is always readable */}
        <div className="ss-card-img-gradient" />

        {/* Category badge — sits on top of image */}
        <span
          className="ss-tag ss-tag--on-image"
          style={{ background: tag.bg, color: tag.color }}
        >
          {service.category}
        </span>

        {/* Hover overlay with description */}
        <div className="ss-card-overlay">
          <p className="ss-card-desc">{service.desc}</p>
        </div>
      </div>

      {/* ── Card body ── */}
      <div className="ss-card-body">
        <h3 className="ss-card-name">{service.name}</h3>

        {/*
          Link to /appointment — passes service data via React Router state.
          In Appointment.jsx read it with:
            const { state } = useLocation();
            const preSelected = state?.service;
        */}
        <Link
          to="/appointment"
          state={{ service: { id: service.id, name: service.name, category: service.category } }}
          className="ss-book-btn"
          aria-label={`Book appointment for ${service.name}`}
        >
          <span>Book Appointment</span>
          <span className="ss-btn-arrow">→</span>
        </Link>
      </div>
    </div>
  );
}

/* ─── Services (main export) ───────────────────────────────────────────────── */
export default function Services() {
  const [activeCategory, setActiveCategory] = useState("All");

  const filtered = useMemo(
    () =>
      activeCategory === "All"
        ? SERVICES
        : SERVICES.filter((s) => s.category === activeCategory),
    [activeCategory]
  );

  return (
    <section id="services" className="ss-root" aria-labelledby="ss-heading">

      {/* ── Header ── */}
      <div className="ss-header">
        <p className="ss-eyebrow">What we treat</p>
        <h2 id="ss-heading" className="ss-title">
          Every Smile Deserves<br />
          <em>Expert Care.</em>
        </h2>
        <p className="ss-subtitle">
          ToothEase offers General, Cosmetic, Surgical, Restorative, and Orthodontic
          treatments — all in one platform, with verified specialists near you.
        </p>
      </div>

      {/* ── Category filter pills ── */}
      <div className="ss-filters" role="tablist" aria-label="Filter by category">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            role="tab"
            aria-selected={activeCategory === cat}
            className={`ss-filter-pill${activeCategory === cat ? " active" : ""}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
            <span className="ss-pill-count">
              {cat === "All"
                ? SERVICES.length
                : SERVICES.filter((s) => s.category === cat).length}
            </span>
          </button>
        ))}
      </div>

      {/* ── Grid ── */}
      <div className="ss-grid" role="tabpanel">
        {filtered.map((service) => (
          <ServiceCard key={service.id} service={service} />
        ))}
      </div>

      {/* ── Bottom CTA ── */}
      <div className="ss-footer-cta">
        <p>Not sure which treatment you need?</p>
        <Link
          className="ss-consult-btn"
          to="/appointment"
          state={{ service: { id: "consultation", name: "General Consultation", category: "General" } }}
        >
          Book a Free Consultation →
        </Link>
      </div>

    </section>
  );
}