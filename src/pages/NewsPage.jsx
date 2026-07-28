import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabase";
import "./news.css";

function NewsPage({ limit, preview }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadNews() {
      setLoading(true);
      setError(null);

      let query = supabase
        .from("news")
        .select(
          `
          id,
          title,
          title_am,
          content,
          content_am,
          image_url,
          video_url,
          published_at,
          is_published,
          created_at
          `
        )
        .eq("is_published", true)
        .order("published_at", {
          ascending: false,
          nullsFirst: false,
        })
        .order("created_at", {
          ascending: false,
        });

      if (typeof limit === "number" && limit > 0) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error(
          "Failed to fetch news:",
          error
        );

        setError(error.message);
        setPosts([]);
      } else {
        setPosts(data || []);
      }

      setLoading(false);
    }

    loadNews();
  }, []);

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="news-page">
        <div className="news-status">
          <p>Loading news...</p>
        </div>
      </div>
    );
  }

  // ==========================================
  // ERROR
  // ==========================================

  if (error) {
    return (
      <div className="news-page">
        <div className="news-status error">
          <p>
            Error loading news:
            <br />
            {error}
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // NO NEWS
  // ==========================================

  const isPreview = preview === true;

  if (posts.length === 0) {
    return (
      <div className={isPreview ? "news-page news-preview" : "news-page"}>

        <h2>
          Latest News
        </h2>

        <div className="news-status">
          <p>
            No news available at this time.
          </p>
        </div>

      </div>
    );
  }

  // ==========================================
  // NEWS PAGE
  // ==========================================

  if (isPreview) {
    return (
      <div className="news-page news-preview">
        <div className="news-page-header">
          <h2>Latest News</h2>
          <Link to="/news" className="news-view-all">
            See all news
          </Link>
        </div>

        <div className="news-slider">
          <div className="news-slider-track">
            {posts.map((post) => (
              <article key={post.id} className="news-card news-slide">
                {post.image_url && (
                  <img
                    src={post.image_url}
                    alt={post.title}
                    className="news-image"
                  />
                )}

                <div className="news-card-content">
                  <h3>{post.title}</h3>
                  <div className="news-content">
                    {post.content ? post.content : "No content available."}
                  </div>
                  {post.video_url && (
                    <video controls className="news-video">
                      <source src={post.video_url} type="video/mp4" />
                      Your browser does not support video playback.
                    </video>
                  )}
                  <small className="news-date">
                    Published on: {post.published_at
                      ? new Date(post.published_at).toLocaleDateString()
                      : new Date(post.created_at).toLocaleDateString()}
                  </small>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="news-page">

      <h2>
        Latest News
      </h2>

      <div className="news-grid">

        {posts.map((post) => (

          <article
            key={post.id}
            className="news-card"
          >

            {/* =================================
                IMAGE
            ================================== */}

            {post.image_url && (

              <img
                src={post.image_url}
                alt={post.title}
                className="news-image"
              />

            )}


            {/* =================================
                CONTENT
            ================================== */}

            <div className="news-card-content">

              {/* TITLE */}

              <h3>
                {post.title}
              </h3>


              {/* NEWS CONTENT */}

              <div className="news-content">
                {post.content ? post.content : "No content available."}
              </div>


              {/* VIDEO */}

              {post.video_url && (

                <video
                  controls
                  className="news-video"
                >

                  <source
                    src={post.video_url}
                    type="video/mp4"
                  />

                  Your browser does not support
                  video playback.

                </video>

              )}


              {/* DATE */}

              <small className="news-date">

                Published on:{" "}

                {post.published_at
                  ? new Date(
                      post.published_at
                    ).toLocaleDateString()
                  : new Date(
                      post.created_at
                    ).toLocaleDateString()}

              </small>

            </div>

          </article>

        ))}

      </div>

    </div>
  );
}

export default NewsPage;