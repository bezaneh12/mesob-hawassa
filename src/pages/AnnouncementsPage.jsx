import { useEffect, useState } from "react";
import { getAnnouncements } from "../api/announcementApi";
import { useTranslation } from "../context/TranslationContext";

function AnnouncementsPage() {
  const { t, lang } = useTranslation();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAnnouncements() {
      try {
        const data = await getAnnouncements();
        setAnnouncements(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadAnnouncements();
  }, []);

  if (loading) return <p>{t("loadingAnnouncements")}</p>;

  return (
    <div className="announcements-page">
      <h2>{t("announcementsAndVacancies")}</h2>

      {announcements.length === 0 ? (
        <p>{t("noAnnouncements")}</p>
      ) : (
        announcements.map((item) => (
          <div key={item.id} className="vacancy-item">
            <h3>{lang === 'am' ? item.title_am || item.title : item.title}</h3>

            <p>{lang === 'am' ? item.description_am || item.description : item.description}</p>

            <small>
              {t("deadline")}{" "}
              {item.deadline
                ? new Date(item.deadline).toLocaleDateString()
                : t("notAvailable")}
            </small>

            {item.application_link && (
              <div style={{ marginTop: "15px" }}>
                <a
                  href={item.application_link}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <button>{t("applyNow")}</button>
                </a>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

export default AnnouncementsPage;