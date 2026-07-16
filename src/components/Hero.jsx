import { useState, useEffect } from "react";

const IMAGES = [
  "/building.jpg",
  "/building2.jpg",
  "/office1.jpg",
  "/office2.png"
];

function Hero() {
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % IMAGES.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section
      className="hero"
      style={{
        backgroundImage: `url(${IMAGES[currentImage]})`
      }}
    >
      <div className="hero-overlay">

        <h1>Hawassa MESOB  </h1>

        <p>
         Welcome to One Center Digital Government Service
        </p>


      </div>
    </section>
  );
}

export default Hero;