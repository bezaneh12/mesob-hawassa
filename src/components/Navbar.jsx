import { useState, useContext, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import mesobLogo from "../assets/mesoblogo.jpg";
import { ThemeContext } from "../context/ThemeContext";
import { useTranslation } from "../context/TranslationContext";

function SunIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="2" x2="12" y2="4.5" />
      <line x1="12" y1="19.5" x2="12" y2="22" />
      <line x1="4.22" y1="4.22" x2="5.94" y2="5.94" />
      <line x1="18.06" y1="18.06" x2="19.78" y2="19.78" />
      <line x1="2" y1="12" x2="4.5" y2="12" />
      <line x1="19.5" y1="12" x2="22" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.94" y2="18.06" />
      <line x1="18.06" y1="5.94" x2="19.78" y2="4.22" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { isDark, toggleTheme } = useContext(ThemeContext);
  const { lang, setLang, t } = useTranslation();


  const dropdownRef = useRef(null);


  useEffect(() => {
    function handleClickOutside(event) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="navbar">
      <Link to="/" className="logo" aria-label="MESOB Hawassa home">
        <img src={mesobLogo} alt="MESOB logo" />
      </Link>

      {/* Hamburger Icon */}
      <div className="hamburger" onClick={() => setIsOpen(!isOpen)}>
        <span></span>
        <span></span>
        <span></span>
      </div>

      {/* Nav links + utility controls */}
      <div className="navbar-right">
        <ul className={isOpen ? "nav-links open" : "nav-links"}>
          <li><Link to="/">{t("home")}</Link></li>
          <li><Link to="/institutions">{t("institutions")}</Link></li>
          <li><Link to="/services">{t("services")}</Link></li>
          <li><Link to="/appointment">{lang === 'am' ? 'ቀጠሮ' : 'Appointment'}</Link></li>

          
          <li
            ref={dropdownRef}
            className={`dropdown ${isDropdownOpen ? "open" : ""}`}
          >
            <button
              type="button"
              className="dropdown-toggle"
              onClick={(event) => {
                event.preventDefault();
                setIsDropdownOpen((prev) => !prev);
              }}
              aria-expanded={isDropdownOpen}
            >
              {lang === 'am' ? 'ምን አዲስ ነገር አለ' : "What's New"}
            </button>

            <div className="dropdown-menu">
              <Link
                to="/news"
                onClick={() => {
                  setIsOpen(false);
                  setIsDropdownOpen(false);
                }}
              >
                {t("news")}
              </Link>

              <Link
                to="/announcements"
                onClick={() => {
                  setIsOpen(false);
                  setIsDropdownOpen(false);
                }}
              >
                {t("announcements")}
              </Link>
            </div>
          </li>

          <li><Link to="/about">{t("about")}</Link></li>
        </ul>

        <div className="navbar-controls">
          <div className="lang-switcher">
            {[
              { key: "en", label: "EN" },
              { key: "am", label: "አማ" }
            ].map((opt) => (
              <button
                key={opt.key}
                type="button"
                className={`lang-btn ${lang === opt.key ? "active" : ""}`}
                onClick={() => setLang(opt.key)}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label="Toggle dark/light mode"
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
