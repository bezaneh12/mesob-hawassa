import React, { useEffect, useState } from "react";
import { getInstitutions } from "../api/institutionApi";

function Institutions() {
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchInstitutions() {
      try {
        const data = await getInstitutions();
        setInstitutions(data);
      } catch (error) {
        console.error("Error loading institutions:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }

    fetchInstitutions();
  }, []);

  if (loading) {
    return (
      <section id="institutions" className="institutions">
        <p>Loading institutions...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section id="institutions" className="institutions">
        <p className="error">
          Error loading institutions: {error}
        </p>
      </section>
    );
  }

  return (
    <section id="institutions" className="institutions">
      <h2>Institutions</h2>

      <p>
        Our partner institutions working with Hawassa MESOB.
      </p>

      <div className="institution-list">
        {institutions.map((institution) => (
          <div
            className="institution-card"
            key={institution.id}
          >
            <div className="institution-icon">
              {institution.logo_url ? (
                <img
                  src={institution.logo_url}
                  alt={institution.name}
                  className="institution-logo"
                  onError={(event) => {
                    console.error(
                      "Failed to load image:",
                      institution.logo_url
                    );
                  }}
                />
              ) : (
                <div className="institution-no-logo">
                  No Logo
                </div>
              )}
            </div>

            <h3>{institution.name}</h3>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Institutions;