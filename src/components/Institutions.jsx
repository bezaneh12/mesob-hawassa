import React, { useEffect, useState } from "react";
import { getInstitutions } from "../api/institutionApi";

function Institutions() {
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInstitutions() {
      try {
        const data = await getInstitutions();

        // Hide Banking Services from the Institutions page
        const visibleInstitutions = data.filter(
          (institution) => institution.name !== "Banking Services"
        );

        setInstitutions(visibleInstitutions);
      } catch (error) {
        console.error("Error loading institutions:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchInstitutions();
  }, []);

  if (loading) {
    return <p>Loading institutions...</p>;
  }

  return (
    <section id="institutions" className="institutions">
      <h2>Institutions</h2>
      <p>Our partner institutions working with Hawassa MESOB.</p>

      <div className="institution-list">
        {institutions.map((institution) => (
          <div className="institution-card" key={institution.id}>
            <div className="institution-icon">
              <img
                src={institution.logo_url}
                alt={institution.name}
                onError={(e) => {
                  e.target.src = "/city.jpg"; // fallback image
                }}
              />
            </div>

            <h3>{institution.name}</h3>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Institutions;