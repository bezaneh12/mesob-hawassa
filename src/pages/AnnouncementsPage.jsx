import { useEffect, useState } from "react";
import { getAnnouncements } from "../api/announcementApi";

function AnnouncementsPage() {
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

  if (loading) return <p>Loading announcements...</p>;

  return (
    <div className="announcements-page">
      <h2>Announcements & Vacancies</h2>

      {announcements.length === 0 ? (
        <p>No announcements available.</p>
      ) : (
        announcements.map((item) => (
          <div key={item.id} className="vacancy-item">
            <h3>{item.title}</h3>

            <p>{item.description}</p>

            <small>
              Deadline:{" "}
              {item.deadline
                ? new Date(item.deadline).toLocaleDateString()
                : "N/A"}
            </small>

            {item.application_link && (
              <div style={{ marginTop: "15px" }}>
                <a
                  href={item.application_link}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <button>Apply Now</button>
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