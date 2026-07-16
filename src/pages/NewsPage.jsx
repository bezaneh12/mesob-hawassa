import { useState, useEffect } from "react";
import { apiEndpoints } from "../config/api";
import "./news.css";

function NewsPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch(apiEndpoints.news)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then(data => {
        setPosts(Array.isArray(data) ? data : []);
        setError(null);
      })
      .catch(err => {
        console.error("Failed to fetch news:", err);
        setError(err.message);
        setPosts([]);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="news-page"><p>Loading news...</p></div>;
  if (error) return <div className="news-page"><p className="error">Error loading news: {error}</p></div>;
  if (!posts.length) return <div className="news-page"><p>No news available at this time.</p></div>;

  return (
    <div className="news-page">
      <h2>Latest News</h2>
      <div className="news-grid">
        {posts.map(post => (
          <div key={post.id} className="news-card">
            <h3>{post.title}</h3>
            <p>{post.content}</p>

            {post.image && (
              <img src={post.image} alt={post.title} className="news-image" />
            )}

            {post.video && (
              <video controls className="news-video">
                <source src={post.video} type="video/mp4" />
              </video>
            )}

            <small>Posted on: {post.date} by {post.author}</small>
          </div>
        ))}
      </div>
    </div>
  );
}

export default NewsPage;
