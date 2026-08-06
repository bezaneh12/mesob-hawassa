import { useEffect, useState } from "react";
import {
  getServiceInstitutions,
  getServicesByInstitution,
  getRequirements,
} from "../api/servicesApi";
import { useTranslation } from "../context/TranslationContext";

function Services() {
  const [institutions, setInstitutions] = useState([]);
  const [selectedInstitution, setSelectedInstitution] = useState(null);
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [requirements, setRequirements] = useState([]);
  const { t, lang } = useTranslation();

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
        <h1>{t("ourServices")}</h1>
        <p>{t("exploreServices")}</p>
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

            <h3>{lang === 'am' ? institution.name_am || institution.name : institution.name}</h3>
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
              <h2>{lang === 'am' ? selectedInstitution.name_am || selectedInstitution.name : selectedInstitution.name}</h2>

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
                  <h3>{t("servicesOffered")}</h3>

                  <p className="services-hint">
                    {t("tapService")}
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

                          <p>{lang === 'am' ? service.name_am || service.name : service.name}</p>

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
                  <h3>{t("requirements")}</h3>

                  {selectedService ? (
                    <div className="service-details-container" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                      {requirements.length > 0 ? (
                        <ul className="requirements-list" style={{ flexGrow: 1 }}>
                          {requirements.map((req) => (
                            <li key={req.id}>{lang === 'am' ? req.requirement_am || req.requirement : req.requirement}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="no-requirements" style={{ flexGrow: 1 }}>
                          {t("noRequirements")}
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
                          {t("bookNow")}
                        </a>
                      )}
                    </div>
                  ) : (
                    <p className="no-requirements">
                      {t("selectServiceLeft")}
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