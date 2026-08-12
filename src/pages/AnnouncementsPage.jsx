import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { useTranslation } from "../context/translation-context";
import "./Announcement.css";

function AnnouncementCard({ item, lang, t }) {
  const [expanded, setExpanded] = useState(false);

  const title = lang === "am" ? item.title_am || item.title : item.title;
  const description =
    lang === "am"
      ? item.description_am || item.description || ""
      : item.description || "";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadlineDate = item.deadline ? new Date(item.deadline) : null;
  const isClosed = deadlineDate ? deadlineDate < today : false;

  const daysLeft = deadlineDate
    ? Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24))
    : null;
  const isClosingSoon = !isClosed && daysLeft !== null && daysLeft <= 3;

  const hasMore = description.length > 180;

  return (
    <article className={`announcement-card${isClosed ? " is-closed" : ""}`}>
      {item.image_url && (
        <div className="announcement-image">
          <img src={item.image_url} alt={title} />
        </div>
      )}

      <div className="announcement-content">
        <div className="announcement-badges">
          {isClosed && (
            <span className="announcement-badge badge-closed">
              {t("closed") || (lang === "am" ? "ተዘግቷል" : "Closed")}
            </span>
          )}
          {isClosingSoon && (
            <span className="announcement-badge badge-soon">
              {lang === "am"
                ? `${daysLeft} ቀናት ቀርተዋል`
                : daysLeft === 0
                ? "Closes today"
                : `Closes in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`}
            </span>
          )}
        </div>

        <h3>{title}</h3>

        <div className={expanded ? "announcement-description" : "announcement-description clamped"}>
          {description || (lang === "am" ? "ምንም ዝርዝር የለም።" : "No details provided.")}
        </div>

        {hasMore && (
          <button
            type="button"
            className="announcement-readmore-btn"
            onClick={() => setExpanded((prev) => !prev)}
          >
            {expanded
              ? lang === "am"
                ? "ትንሽ አሳይ"
                : "Show less"
              : lang === "am"
              ? "ተጨማሪ አንብብ"
              : "Read more"}
          </button>
        )}

        <div className="announcement-footer">
          <small>
            {t("deadline")}{" "}
            {item.deadline ? deadlineDate.toLocaleDateString() : t("notAvailable")}
          </small>

          {item.application_link && !isClosed && (
            <a href={item.application_link} target="_blank" rel="noopener noreferrer">
              <button type="button" className="announcement-apply-btn">
                {t("applyNow")}
              </button>
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

function AnnouncementsPage() {
  const { t, lang } = useTranslation();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadAnnouncements() {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .eq("is_active", true)
        // Soonest deadlines first; items with no deadline fall to the end.
        .order("deadline", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Failed to fetch announcements:", error);
        setError(error.message);
        setAnnouncements([]);
      } else {
        setAnnouncements(data || []);
      }

      setLoading(false);
    }

    loadAnnouncements();
  }, []);

  if (loading) {
    return (
      <div className="announcements-page">
        <p>{t("loadingAnnouncements")}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="announcements-page">
        <div className="announcements-status announcements-error">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="announcements-page">
      <h2>{t("announcementsAndVacancies")}</h2>

      {announcements.length === 0 ? (
        <p>{t("noAnnouncements")}</p>
      ) : (
        <div className="announcements-grid">
          {announcements.map((item) => (
            <AnnouncementCard key={item.id} item={item} lang={lang} t={t} />
          ))}
        </div>
      )}
    </div>
  );
}

export default AnnouncementsPage;