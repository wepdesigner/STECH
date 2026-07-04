import React from "react";
import "../Pages/Styles/Landing.css";

function Footer() {
    return(
        <>
        {/* ── FOOTER ── */}
      <footer className="te-footer">
        <div className="te-footer__top">
          <div className="te-footer__brand">
            <div className="te-nav__brand" style={{marginBottom:"1rem"}}>
              <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
                <circle cx="14" cy="14" r="13" stroke="#2BA8E0" strokeWidth="2" />
                <path d="M9 10c0-2.76 2.24-5 5-5s5 2.24 5 5c0 3-2 5-3 7.5-.3.8-.7 1.5-2 1.5s-1.7-.7-2-1.5C10 15 9 13 9 10z" fill="#2BA8E0" />
              </svg>
              <span className="te-nav__logo-text">ToothEase</span>
            </div>
            <p>Have questions or need support? Our team is always here to help. Reach out to us anytime!</p>
          </div>
          <div className="te-footer__newsletter">
            <label className="te-footer__nl-label">Enter Your Email</label>
            <div className="te-footer__nl-row">
              <input className="te-input te-footer__nl-input" type="email" placeholder="your@email.com" />
              <button className="te-btn te-btn--primary te-btn--icon">→</button>
            </div>
          </div>
        </div>

        <div className="te-footer__grid">
          <div>
            <h4>Our Operating Hours</h4>
            <p><strong style={{color:"#2BA8E0"}}>Monday – Friday:</strong> 8:00 AM – 3:00 PM</p>
            <p><strong style={{color:"#2BA8E0"}}>Saturday:</strong> 10:00 AM – 5:00 PM</p>
            <p><strong style={{color:"#e05050"}}>Sunday:</strong> We're closed to rest and recharge</p>
            <div className="te-footer__social">
              <span className="te-social-icon">f</span>
              <span className="te-social-icon">𝕏</span>
              <span className="te-social-icon" style={{background:"#0077b5"}}>in</span>
              <span className="te-social-icon" style={{background:"#e1306c"}}>ig</span>
            </div>
          </div>
          <div>
            <h4>Company</h4>
            <ul className="te-footer__links">
              {["Full-Service","Employee Benefits","Talent Management","Insight and reporting"].map(l=><li key={l}><a href="#">{l}</a></li>)}
            </ul>
          </div>
          <div>
            <h4>Address</h4>
            <p>1801 Thornridge Cir</p>
            <h4 style={{marginTop:"1rem"}}>Email</h4>
            <p><a href="mailto:toothease@gmail.com" style={{color:"#2BA8E0"}}>toothease@gmail.com</a></p>
            <h4 style={{marginTop:"1rem"}}>Phone</h4>
            <p>(+1) 873-298-3209</p>
          </div>
          <div>
            <h4>Contact</h4>
            <ul className="te-footer__links">
              {["Community","Knowledge Base","Academy","Support"].map(l=><li key={l}><a href="#">{l}</a></li>)}
            </ul>
          </div>
        </div>

        <div className="te-footer__bottom">
          <a href="#">Terms & Conditions</a>
          <span>2025 ToothEase. All rights reserved.</span>
          <a href="#">Privacy Policy</a>
        </div>
      </footer>
        </>
    )
}

export default Footer