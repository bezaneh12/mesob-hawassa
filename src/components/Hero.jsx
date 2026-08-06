import { useState, useEffect } from "react";
import { useTranslation } from "../context/TranslationContext";

const HERO_SLIDES = [
  {
    image: "/building.jpg",
    titleKey: "Hawassa MESOB",
    subtitleKey: "welcome",
  },
  {
    image: "/building2.jpg",
    titleKey: "Centralized Public Services",
    subtitleKey: "Access multiple government and partner institutions from a single, unified platform",
  },
  {
    image: "/office1.jpg",
    titleKey: "Digital First Governance",
    subtitleKey: "Streamlining your administrative processes with modern, fast, and transparent services",
  },
  {
    image: "/office2.png",
    titleKey: "Empowering Citizens",
    subtitleKey: "Stay updated with the latest news, announcements, and seamless appointment bookings",
  }
];

function Hero() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const { t, lang } = useTranslation();

  useEffect(() => {
    const interval = setInterval(() => {
      // Start fade out
      setIsFading(true);
      
      // Wait for fade out to complete before changing text/image
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % HERO_SLIDES.length);
        // Start fade in
        setIsFading(false);
      }, 500);
      
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const currentSlide = HERO_SLIDES[currentIndex];

  return (
    <section
      className="hero"
      style={{
        backgroundImage: `url(${currentSlide.image})`
      }}
    >
      <div className="hero-overlay">
        <div 
          style={{ 
            opacity: isFading ? 0 : 1, 
            transform: isFading ? "translateY(15px)" : "translateY(0)",
            transition: "opacity 0.5s ease-in-out, transform 0.5s ease-in-out",
            display: "flex",
            flexDirection: "column",
            alignItems: "center"
          }}
        >
          <h1>{t(currentSlide.titleKey)}</h1>
          <p>{t(currentSlide.subtitleKey)}</p>
        </div>
      </div>
    </section>
  );
}

export default Hero;