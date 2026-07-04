import React from "react";
import { useState } from "react";
import "../Pages/Styles/Landing.css"


const TESTIMONIALS = [
  {
    name: "Daniel Harper",
    role: "Art Director",
    text: "Getting treatment at ToothEase made me feel confident again. Their expert care and friendly staff made every visit stress-free. I no longer worry about dental issues and my smile has never looked better!",
    stat1: "22/24",
    stat2: "99%",
  },
  {
    name: "Priya Mehta",
    role: "Product Designer",
    text: "The team at ToothEase is phenomenal. From booking to aftercare, everything was smooth and professional. I recommend them to everyone looking for world-class dental care.",
    stat1: "20/24",
    stat2: "98%",
  },
];

export default function Testimonial(){

  const [testimonialIdx, setTestimonialIdx] = useState(0);

  const testimonial = TESTIMONIALS[testimonialIdx];

  return(
    <>

    <section className="te-testimonials">
        <div className="te-testimonials__inner">
          <div className="te-testimonials__header">
            <div>
              <h2 className="te-section-title">
                About <br /><em className="te-accent">Every Smile Dentistry</em>
              </h2>
            </div>
            <div className="te-testimonials__meta">
              <div className="te-tag">✦ Testimonials</div>
              <p>Real stories from our patients who left with brighter, healthier smiles.</p>
            </div>
          </div>

          <div className="te-testimonials__body">
            <div className="te-testimonial-img">
              <div className="te-testimonial-img__placeholder">
                <img width="500" height="200" viewBox="0 0 70 70" fill="none" src="/public/Landing/1.JPG" alt="" />
                {/* <svg width="70" height="70" viewBox="0 0 70 70" fill="none" opacity="0.15">
                  <circle cx="35" cy="26" r="16" fill="#2BA8E0"/>
                  <path d="M5 68c0-16.57 13.43-30 30-30s30 13.43 30 30" fill="#2BA8E0"/>
                </svg> */}
              </div>
            </div>
            <div className="te-testimonial-content">
              <div className="te-quote-icon">"</div>
              <p className="te-testimonial-text">
                "{testimonial.text.replace('ToothEase', '')}<span className="te-accent">ToothEase</span>{testimonial.text.split('ToothEase')[1] || ''}"
              </p>
              <div className="te-testimonial-author">
                <strong>{testimonial.name}</strong>
                <span>{testimonial.role}</span>
              </div>
            </div>
            <div className="te-testimonial-stats">
              <div className="te-stat-card">
                <span className="te-stat-label">Seamless Experience Inside & Out</span>
                <span className="te-stat-value">{testimonial.stat1}</span>
              </div>
              <div className="te-stat-card">
                <span className="te-stat-label">Satisfaction</span>
                <span className="te-stat-value">{testimonial.stat2}</span>
              </div>
            </div>
          </div>

          <div className="te-carousel-controls">
            <button className="te-carousel-btn" onClick={() => setTestimonialIdx((testimonialIdx - 1 + TESTIMONIALS.length) % TESTIMONIALS.length)}>←</button>
            <button className="te-carousel-btn te-carousel-btn--active" onClick={() => setTestimonialIdx((testimonialIdx + 1) % TESTIMONIALS.length)}>→</button>
          </div>
        </div>
      </section>
    
    </>
  )
}