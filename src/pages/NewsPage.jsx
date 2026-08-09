import { useEffect, useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabase";
import { useTranslation } from "../context/TranslationContext";
import "./news.css";

const PAGE_SIZE = 6; // how many older posts to reveal per "Load more" click

// ==========================================
// VIDEO HELPERS
// ==========================================

function getVideoInfo(url) {
  if (!url) return null;

  const youtubeMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (youtubeMatch) {
    const id = youtubeMatch[1];
    return {
      type: "youtube",
      embedUrl: `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`,
      thumbnailUrl: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
      label: "YouTube",
    };
  }

  if (/facebook\.com|fb\.watch/.test(url)) {
    return {
      type: "facebook",
      embedUrl: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(
        url
      )}&show_text=false&autoplay=1`,
      thumbnailUrl: null,
      label: "Facebook",
    };
  }

  if (/\.(mp4|webm|ogg)$/i.test(url)) {
    return { type: "file", embedUrl: url, thumbnailUrl: null, label: "Video" };
  }

  return { type: "other", embedUrl: url, thumbnailUrl: null, label: "Video" };
}

function VideoEmbed({ videoUrl }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const info = getVideoInfo(videoUrl);
  if (!info) return null;

  if (info.type === "other") {
    return (
      <a
        href={videoUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="news-video-link"
        onClick={(event) => event.stopPropagation()}
      >
        &#9654; Watch Video
      </a>
    );
  }

  if (isPlaying) {
    if (info.type === "file") {
      return (
        <video controls autoPlay className="news-video">
          <source src={info.embedUrl} />
          Your browser does not support video playback.
        </video>
      );
    }
    return (
      <div className="news-video-frame">
        <iframe
          src={info.embedUrl}
          title={info.label}
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          frameBorder="0"
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      className="news-video-thumb"
      onClick={(event) => {
        event.stopPropagation();
        setIsPlaying(true);
      }}
      style={info.thumbnailUrl ? { backgroundImage: `url(${info.thumbnailUrl})` } : undefined}
    >
      <span className="news-video-play">&#9654;</span>
      <span className="news-video-label">{info.label}</span>
    </button>
  );
}

// ==========================================
// IMAGE CAROUSEL / GALLERY
// ==========================================

function ImageCarousel({ images, altText = "", autoSlide = true, interval = 4000 }) {
  const [index, setIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const timerRef = useRef(null);

  const goTo = useCallback(
    (nextIndex) => {
      setIndex(((nextIndex % images.length) + images.length) % images.length);
    },
    [images.length]
  );

  useEffect(() => {
    setIndex(0);
  }, [images]);

  useEffect(() => {
    if (!autoSlide || images.length <= 1 || isHovered) return;
    timerRef.current = setInterval(() => {
      setIndex((current) => (current + 1) % images.length);
    }, interval);
    return () => clearInterval(timerRef.current);
  }, [autoSlide, images.length, interval, isHovered, index]);

  if (!images || images.length === 0) return null;

  const handlePrev = (event) => {
    event.stopPropagation();
    goTo(index - 1);
  };
  const handleNext = (event) => {
    event.stopPropagation();
    goTo(index + 1);
  };
  const handleDotClick = (event, dotIndex) => {
    event.stopPropagation();
    goTo(dotIndex);
  };

  return (
    <div className="carousel" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
      <div className="carousel-track" style={{ transform: `translateX(-${index * 100}%)` }}>
        {images.map((src, i) => (
          <img key={src + i} src={src} alt={altText} className="carousel-image" draggable={false} />
        ))}
      </div>

      {images.length > 1 && (
        <>
          <button type="button" className="carousel-arrow carousel-arrow-prev" onClick={handlePrev} aria-label="Previous image">
            &#8249;
          </button>
          <button type="button" className="carousel-arrow carousel-arrow-next" onClick={handleNext} aria-label="Next image">
            &#8250;
          </button>
          <div className="carousel-dots">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                className={`carousel-dot${i === index ? " active" : ""}`}
                onClick={(event) => handleDotClick(event, i)}
                aria-label={`Go to image ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ==========================================
// NEWS CARD
// Expand behavior designed to never leave the
// user disoriented:
//  1. Smooth height animation (CSS grid-rows
//     trick), not an instant jump.
//  2. Auto-scrolls the card into view once it
//     opens, so the new content is guaranteed
//     visible even far down a long page.
//  3. A brief highlight ring on open, so it's
//     obvious *something* happened.
//  4. A sticky "x Close" pinned to the top of
//     the expanded area, so collapsing is
//     always one visible click away, even
//     after scrolling inside a long post.
// ==========================================

function NewsCard({ post, lang, size = "normal" }) {
  const [expanded, setExpanded] = useState(false);
  const [justOpened, setJustOpened] = useState(false);
  const cardRef = useRef(null);

  const images = post.news_images.map((img) => img.image_url);
  const title = lang === "am" ? post.title_am || post.title : post.title;
  const content =
    lang === "am"
      ? post.content_am || post.content || "ምንም ይዘት የለም።"
      : post.content || "No content available.";

  const dateLabel = lang === "am" ? "የታተመበት ቀን: " : "Published on: ";
  const dateValue = post.published_at
    ? new Date(post.published_at).toLocaleDateString()
    : new Date(post.created_at).toLocaleDateString();

  const readMoreLabel = lang === "am" ? "ተጨማሪ አንብብ" : "Read more";
  const closeLabel = lang === "am" ? "ዝጋ" : "Close";

  const hasMore = content.length > 160;

  function handleToggle() {
    if (expanded) {
      setExpanded(false);
      return;
    }

    setExpanded(true);
    setJustOpened(true);
    setTimeout(() => setJustOpened(false), 900);

    // Give the CSS expand transition a beat to start, then bring the
    // newly revealed content into view so it's never left off-screen.
    setTimeout(() => {
      cardRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 120);
  }

  return (
    <article
      ref={cardRef}
      className={`news-card news-card-${size}${expanded ? " expanded" : ""}${
        justOpened ? " just-opened" : ""
      }`}
    >
      {images.length > 0 && (
        <div className="news-image">
          <ImageCarousel images={images} altText={title} />
        </div>
      )}

      <div className="news-card-content">
        <h3>{title}</h3>

        {/* Video is always visible on the card, same as the image
            gallery above — not gated behind "Read more". */}
        {post.video_url && (
          <div className="news-video-wrapper">
            <VideoEmbed videoUrl={post.video_url} />
          </div>
        )}

        {!expanded && <div className="news-content news-content-clamped">{content}</div>}

        {/* Smooth-animated expand section: always in the DOM so the
            grid-rows transition can animate, just visually collapsed
            to zero height when closed. Now only holds the full text. */}
        <div className={`news-expand${expanded ? " open" : ""}`}>
          <div className="news-expand-inner">
            {expanded && (
              <button type="button" className="news-expand-close" onClick={handleToggle}>
                &times; {closeLabel}
              </button>
            )}
            <div className="news-content">{content}</div>
          </div>
        </div>

        <div className="news-card-footer">
          <small className="news-date">
            {dateLabel}
            {dateValue}
          </small>

          {hasMore && !expanded && (
            <button type="button" className="news-readmore-btn" onClick={handleToggle}>
              {readMoreLabel}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

// ==========================================
// NEWS PAGE
// ==========================================

function NewsPage({ limit, preview }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const { lang } = useTranslation();

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
          video_url,
          published_at,
          is_published,
          created_at,
          news_images (
            id,
            image_url,
            display_order
          )
          `
        )
        .eq("is_published", true)
        .order("published_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });

      if (typeof limit === "number" && limit > 0) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Failed to fetch news:", error);
        setError(error.message);
        setPosts([]);
      } else {
        const sorted = (data || []).map((post) => ({
          ...post,
          news_images: [...(post.news_images || [])].sort(
            (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)
          ),
        }));
        setPosts(sorted);
      }

      setLoading(false);
    }

    loadNews();
  }, [limit]);

  if (loading) {
    return (
      <div className="news-page">
        <p>{lang === "am" ? "ዜና በመጫን ላይ..." : "Loading news..."}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="news-page">
        <div className="news-status news-error">
          <p>{lang === "am" ? "ዜና በመጫን ላይ ስህተት ተፈጥሯል:" : "Error loading news:"}</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const isPreview = preview === true;

  if (posts.length === 0) {
    return (
      <div className={isPreview ? "news-page news-preview" : "news-page"}>
        <h2>{lang === "am" ? "አዳዲስ ዜናዎች" : "Latest News"}</h2>
        <div className="news-status">
          <p>{lang === "am" ? "በአሁኑ ጊዜ ምንም ዜና የለም።" : "No news available at this time."}</p>
        </div>
      </div>
    );
  }

  if (isPreview) {
    return (
      <div className="news-page news-preview">
        <div className="news-preview-header">
          <h2>{lang === "am" ? "አዳዲስ ዜናዎች" : "Latest News"}</h2>
          <Link to="/news">{lang === "am" ? "ሁሉንም ዜናዎች ይመልከቱ" : "See all news"}</Link>
        </div>

        <div className="news-slider">
          <div className="news-slider-track">
            {posts.map((post) => (
              <div className="news-slide" key={post.id}>
                <NewsCard post={post} lang={lang} size="compact" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const [heroPost, ...rest] = posts;
  const visiblePosts = rest.slice(0, visibleCount);
  const hasMoreToShow = visibleCount < rest.length;
  const hasCollapsible = visibleCount > PAGE_SIZE;

  return (
    <div className="news-page">
      <h2>{lang === "am" ? "አዳዲስ ዜናዎች" : "Latest News"}</h2>

      <div className="news-hero">
        <NewsCard post={heroPost} lang={lang} size="hero" />
      </div>

      {rest.length > 0 && (
        <>
          <h3 className="news-section-heading">{lang === "am" ? "ሌሎች ዜናዎች" : "More News"}</h3>

          <div className="news-grid">
            {visiblePosts.map((post) => (
              <NewsCard key={post.id} post={post} lang={lang} size="normal" />
            ))}
          </div>

          <div className="news-pagination-actions">
            {hasMoreToShow && (
              <button
                type="button"
                className="news-loadmore-btn"
                onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
              >
                {lang === "am" ? "ተጨማሪ ዜናዎችን አሳይ" : "Show older news"}
              </button>
            )}

            {hasCollapsible && !hasMoreToShow && (
              <button
                type="button"
                className="news-loadmore-btn news-loadmore-btn-secondary"
                onClick={() => setVisibleCount(PAGE_SIZE)}
              >
                {lang === "am" ? "ትንሽ አሳይ" : "Show fewer"}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default NewsPage;