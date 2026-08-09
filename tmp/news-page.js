// src/pages/NewsPage.jsx
```jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../context/TranslationContext';
import './news.css';

function NewsPage({ limit, preview }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { lang } = useTranslation();

  useEffect(() => {
    const loadNews = async () => {
      setLoading(true);
      setError(null);
      setPosts([]);
      setLoading(false);
    };

    loadNews();
  }, [limit]);

  if (loading) {
    return <div className="news-page"><p>{lang === 'am' ? 'ዜና በመጫን ላይ...' : 'Loading news...'}</p></div>;
  }

  if (error) {
    return <div className="news-page"><p>{error}</p></div>;
  }

  return (
    <div className="news-page">
      <h2>{lang === 'am' ? 'አዳዲስ ዜናዎች' : 'Latest News'}</h2>
      <div className="news-grid">
        {posts.length === 0 ? (
          <p>{lang === 'am' ? 'በአሁኑ ጊዜ ምንም ዜና የለም።' : 'No news available at this time.'}</p>
        ) : (
          posts.map((post) => <div key={post.id}>{post.title || 'News'}</div>)
        )}
      </div>
      <Link to="/news">{lang === 'am' ? 'ሁሉንም ዜናዎች ይመልከቱ' : 'See all news'}</Link>
    </div>
  );
}

export default NewsPage;
```;
