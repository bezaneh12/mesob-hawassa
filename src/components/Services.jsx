import { useEffect, useState } from "react";
import {
  getServiceInstitutions,
  getServicesByInstitution,
  getRequirements,
} from "../api/servicesApi";

function Services() {
  const [institutions, setInstitutions] = useState([]);
  const [selectedInstitution, setSelectedInstitution] = useState(null);
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [requirements, setRequirements] = useState([]);

  useEffect(() => {
    async function loadInstitutions() {
      try {
        const data = await getServiceInstitutions();

        // Hide the helper institution from the Services page if needed
        // Remove this filter if you WANT Banking Services to appear.
        setInstitutions(data);
      } catch (error) {
        console.error(error);
      }
    }

    loadInstitutions();
  }, []);

  async function openInstitution(institution) {
    setSelectedInstitution(institution);

    try {
      const data = await getServicesByInstitution(institution.id);
      setServices(data);
      setSelectedService(null);
      setRequirements([]);
    } catch (error) {
      console.error(error);
    }
  }

  async function openService(service) {
    setSelectedService(service);

    try {
      const data = await getRequirements(service.id);
      setRequirements(data);
    } catch (error) {
      console.error(error);
    }
  }

  function closeModal() {
    setSelectedInstitution(null);
    setSelectedService(null);
    setServices([]);
    setRequirements([]);
  }

  return (
    <section className="services-page">
      <header className="services-hero">
        <h1>Our Services</h1>
        <p>Explore the digital services available through Hawassa MESOB.</p>
      </header>

      <div className="services-grid">
        {institutions.map((institution) => (
          <article
            key={institution.id}
            className="service-card"
            onClick={() => openInstitution(institution)}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                openInstitution(institution);
              }
            }}
          >
            <img
              src={institution.logo_url || "/city.jpg"}
              alt={institution.name}
              className="service-icon"
              onError={(e) => {
                e.target.src = "/city.jpg";
              }}
            />

            <h3>{institution.name}</h3>
          </article>
        ))}
      </div>

      {selectedInstitution && (
        <div className="modal-overlay" onClick={closeModal}>
          <div
            className="modal-container"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>{selectedInstitution.name}</h2>

              <button
                className="modal-close"
                onClick={closeModal}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <div className="modal-content">
              <div className="service-detail-card">
                <div className="detail-section services-offered-panel">
                  <h3>Services Offered</h3>

                  <p className="services-hint">
                    Tap a service to see what you need to bring.
                  </p>

                  <ul className="services-offered-grid">
                    {services.map((service, index) => (
                      <li
                        key={service.id}
                        className={`service-offered-card ${
                          selectedService?.id === service.id ? "active" : ""
                        }`}
                      >
                        <button
                          type="button"
                          className="service-offered-toggle"
                          onClick={() => openService(service)}
                        >
                          <span className="service-offered-label">
                            {index + 1}
                          </span>

                          <p>{service.name}</p>

                          <span
                            className="service-offered-chevron"
                            aria-hidden="true"
                          >
                            ›
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="detail-section requirements-panel">
                  <h3>Requirements</h3>

                  {selectedService ? (
                    <div className="service-details-container" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                      {requirements.length > 0 ? (
                        <ul className="requirements-list" style={{ flexGrow: 1 }}>
                          {requirements.map((req) => (
                            <li key={req.id}>{req.requirement}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="no-requirements" style={{ flexGrow: 1 }}>
                          No requirements found.
                        </p>
                      )}

                      {selectedService.booking_link && (
                        <a
                          href={selectedService.booking_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="book-now-button"
                          style={{
                            marginTop: "1.5rem",
                            display: "inline-block",
                            backgroundColor: "var(--primary-color, #2563eb)",
                            color: "white",
                            padding: "0.75rem 1.5rem",
                            borderRadius: "6px",
                            textDecoration: "none",
                            fontWeight: "600",
                            textAlign: "center",
                            alignSelf: "flex-start",
                            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
                          }}
                          onMouseOver={(e) => e.target.style.opacity = "0.9"}
                          onMouseOut={(e) => e.target.style.opacity = "1"}
                        >
                          Book Now
                        </a>
                      )}
                    </div>
                  ) : (
                    <p className="no-requirements">
                      Select a service on the left to see its requirements.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default Services;