import { useEffect, useState } from "react";
import { getBookableServices } from "../api/servicesApi";
import { useTranslation } from "../context/translation-context";
import "./Appointment.css";

function AppointmentPage() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const { lang } = useTranslation();

  useEffect(() => {
    async function loadServices() {
      try {
        const data = await getBookableServices();
        setServices(data || []);
      } catch (error) {
        console.error("Error loading bookable services:", error);
      } finally {
        setLoading(false);
      }
    }

    loadServices();
  }, []);

  return (
    <div className="appointment-page">
      <header className="appointment-hero">
        <h1>{lang === 'am' ? 'የቀጠሮ ምዝገባ' : 'Appointments'}</h1>
        <p>{lang === 'am' ? 'የሚፈልጉትን አገልግሎት በመምረጥ ቀጠሮዎን ያስይዙ።' : 'Book an appointment for our online services directly from here.'}</p>
      </header>

      <section className="appointment-content">
        {loading ? (
          <div className="loading-spinner"></div>
        ) : services.length === 0 ? (
          <div className="no-appointments">
            <p>{lang === 'am' ? 'በአሁኑ ጊዜ በመስመር ላይ ሊያዝ የሚችል አገልግሎት የለም።' : 'No bookable services are available at this time.'}</p>
          </div>
        ) : (
          <div className="bookable-services-grid">
            {services.map((service) => {
              const instName = lang === 'am' ? service.institutions?.name_am || service.institutions?.name : service.institutions?.name;
              const serviceName = lang === 'am' ? service.name_am || service.name : service.name;

              return (
                <article key={service.id} className="bookable-service-card">
                  <div className="bookable-service-header">
                    {service.institutions?.logo_url && (
                      <img src={service.institutions.logo_url} alt={instName} className="bookable-service-logo" />
                    )}
                    <span className="bookable-institution-name">{instName}</span>
                  </div>
                  
                  <h3 className="bookable-service-name">{serviceName}</h3>
                  
                  <a href={service.booking_link} target="_blank" rel="noopener noreferrer" className="book-now-button">
                    {lang === 'am' ? 'አሁኑኑ ቀጠሮ ያስይዙ' : 'Book Now'}
                  </a>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export default AppointmentPage;
