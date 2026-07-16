import React from "react";
import { FaFacebook, FaLinkedin, FaTelegram } from "react-icons/fa";
import { SiGmail } from "react-icons/si";
import mesoblogo from "../assets/mesoblogo.jpg";
import "./Footer.css";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-logo">
        <img src={mesoblogo} alt="MESOB Logo" />
      </div>
      <h2>Hawassa MESOB - One Center Digital Government Service</h2>
      <p className="subtitle">
           THE NEW HORIZON OF SERVICES !
      </p>

      <div className="social-icons">
        <a href="https://web.facebook.com/profile.php?id=61588798515029&__cft__[0]=AZazWu7cYtg-OszX6obNhzEBJv0WsDJcT57kv_JEorFmnjONz8bu-vofYzhYxtsuSFym4vNiBJ2jHsrG5TpOMmtzltR8dXWmfiMf5cjGvoY9kLYJkWKriYDfUyguwnzSm8EMtf_EsCoHSmcfIp8FQICPow_DDTpItoLhQau0pEwK805nqp5dntfsxyPTnK36ib-NEEE_zALv97nUgGxorrqL&__tn__=-UC%2CP-R" target="_blank" rel="noreferrer">
          <FaFacebook />
        </a>
        <a href="https://t.me" target="_blank" rel="noreferrer">
          <FaTelegram />
        </a>
         <a href="mailto:hawassamesob2018@gmail.com">
          <SiGmail />
        </a>
      </div>

      <p className="copyright">
        © 2026 Hawassa-MESOB Center. All rights reserved.
      </p>
    </footer>
  );
};

export default Footer;
