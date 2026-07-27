import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import "./Admin.css";

function ManageNews() {
  const [news, setNews] = useState([]);

  const [form, setForm] = useState({
    title: "",
    title_am: "",
    content: "",
    content_am: "",
    image_url: "",
    video_url: "",
    published_at: "",
    is_published: true,
  });

  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // ==========================================
  // LOAD NEWS
  // ==========================================

  async function loadNews() {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("news")
      .select(
        "id, title, title_am, content, content_am, image_url, video_url, published_at, is_published, created_at"
      )
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error("Error loading news:", error);
      setError(error.message);
      setNews([]);
    } else {
      setNews(data || []);
    }

    setLoading(false);
  }

  // ==========================================
  // LOAD NEWS WHEN PAGE OPENS
  // ==========================================

  useEffect(() => {
    loadNews();
  }, []);

  // ==========================================
  // HANDLE FORM INPUT
  // ==========================================

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  // ==========================================
  // RESET FORM
  // ==========================================

  function resetForm() {
    setForm({
      title: "",
      title_am: "",
      content: "",
      content_am: "",
      image_url: "",
      video_url: "",
      published_at: "",
      is_published: true,
    });

    setEditingId(null);
    setError("");
  }

  // ==========================================
  // ADD OR UPDATE NEWS
  // ==========================================

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");

    if (!form.title.trim()) {
      setError("English news title is required.");
      return;
    }

    if (!form.content.trim()) {
      setError("English news content is required.");
      return;
    }

    setSaving(true);

    try {
      const newsData = {
        title: form.title.trim(),

        title_am: form.title_am.trim() || null,

        content: form.content.trim(),

        content_am: form.content_am.trim() || null,

        image_url: form.image_url.trim() || null,

        video_url: form.video_url.trim() || null,

        published_at: form.published_at || null,

        is_published: form.is_published,
      };

      // ========================================
      // UPDATE EXISTING NEWS
      // ========================================

      if (editingId) {
        const { error } = await supabase
          .from("news")
          .update(newsData)
          .eq("id", editingId);

        if (error) {
          throw error;
        }
      }

      // ========================================
      // ADD NEW NEWS
      // ========================================

      else {
        const { error } = await supabase
          .from("news")
          .insert([newsData]);

        if (error) {
          throw error;
        }
      }

      resetForm();

      await loadNews();
    } catch (error) {
      console.error("Error saving news:", error);

      setError(
        error.message || "Failed to save news."
      );
    } finally {
      setSaving(false);
    }
  }

  // ==========================================
  // EDIT NEWS
  // ==========================================

  function handleEdit(post) {
    setEditingId(post.id);

    setForm({
      title: post.title || "",

      title_am: post.title_am || "",

      content: post.content || "",

      content_am: post.content_am || "",

      image_url: post.image_url || "",

      video_url: post.video_url || "",

      published_at: post.published_at
        ? post.published_at.slice(0, 16)
        : "",

      is_published: post.is_published ?? true,
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  // ==========================================
  // DELETE NEWS
  // ==========================================

  async function handleDelete(post) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this news post?"
    );

    if (!confirmed) {
      return;
    }

    setError("");

    try {
      const { error } = await supabase
        .from("news")
        .delete()
        .eq("id", post.id);

      if (error) {
        throw error;
      }

      await loadNews();
    } catch (error) {
      console.error(
        "Error deleting news:",
        error
      );

      setError(
        error.message || "Failed to delete news."
      );
    }
  }

  // ==========================================
  // FORMAT DATE
  // ==========================================

  function formatDate(date) {
    if (!date) {
      return "Not set";
    }

    return new Date(date).toLocaleString();
  }

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <div className="manage-page">

      {/* ======================================
          PAGE HEADER
      ======================================= */}

      <div className="manage-header">
        <div>
          <h2>Manage News</h2>

          <p>
            Add, edit, publish, or delete
            news posts.
          </p>
        </div>
      </div>


      {/* ======================================
          ERROR MESSAGE
      ======================================= */}

      {error && (
        <div className="admin-error">
          {error}
        </div>
      )}


      {/* ======================================
          NEWS FORM
      ======================================= */}

      <div className="admin-form-card">

        <h3>
          {editingId
            ? "Edit News Post"
            : "Add New News Post"}
        </h3>

        <form onSubmit={handleSubmit}>

          {/* ENGLISH TITLE */}

          <div className="admin-form-group">

            <label>
              Title (English)
            </label>

            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Enter news title in English"
              required
            />

          </div>


          {/* AMHARIC TITLE */}

          <div className="admin-form-group">

            <label>
              Title (Amharic)
            </label>

            <input
              type="text"
              name="title_am"
              value={form.title_am}
              onChange={handleChange}
              placeholder="የዜናውን ርዕስ በአማርኛ ያስገቡ"
            />

          </div>


          {/* ENGLISH CONTENT */}

          <div className="admin-form-group">

            <label>
              Content (English)
            </label>

            <textarea
              name="content"
              value={form.content}
              onChange={handleChange}
              placeholder="Enter news content in English"
              rows="7"
              required
            />

          </div>


          {/* AMHARIC CONTENT */}

          <div className="admin-form-group">

            <label>
              Content (Amharic)
            </label>

            <textarea
              name="content_am"
              value={form.content_am}
              onChange={handleChange}
              placeholder="የዜናውን ይዘት በአማርኛ ያስገቡ"
              rows="7"
            />

          </div>


          {/* IMAGE URL */}

          <div className="admin-form-group">

            <label>
              Image URL
            </label>

            <input
              type="url"
              name="image_url"
              value={form.image_url}
              onChange={handleChange}
              placeholder="Paste image URL"
            />

          </div>


          {/* VIDEO URL */}

          <div className="admin-form-group">

            <label>
              Video URL
            </label>

            <input
              type="url"
              name="video_url"
              value={form.video_url}
              onChange={handleChange}
              placeholder="Paste video URL"
            />

          </div>


          {/* PUBLISHED DATE */}

          <div className="admin-form-group">

            <label>
              Published Date
            </label>

            <input
              type="datetime-local"
              name="published_at"
              value={form.published_at}
              onChange={handleChange}
            />

          </div>


          {/* PUBLISH CHECKBOX */}

          <div className="admin-form-checkbox">

            <label>

              <input
                type="checkbox"
                name="is_published"
                checked={form.is_published}
                onChange={handleChange}
              />

              {" "}
              Publish this news on
              the public website

            </label>

          </div>


          {/* BUTTONS */}

          <div className="admin-form-actions">

            <button
              type="submit"
              className="admin-primary-button"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : editingId
                  ? "Update News"
                  : "Add News"}
            </button>


            {editingId && (

              <button
                type="button"
                className="admin-secondary-button"
                onClick={resetForm}
              >
                Cancel
              </button>

            )}

          </div>

        </form>

      </div>


      {/* ======================================
          EXISTING NEWS
      ======================================= */}

      <div className="admin-list-card">

        <h3>
          Existing News
        </h3>


        {loading ? (

          <p>
            Loading news...
          </p>

        ) : news.length === 0 ? (

          <p>
            No news posts found.
          </p>

        ) : (

          <div className="admin-service-list">

            {news.map((post) => (

              <div
                key={post.id}
                className="admin-service-item"
              >

                <div className="admin-service-info">

                  {/* TITLE */}

                  <h4>
                    {post.title}
                  </h4>


                  {/* AMHARIC TITLE */}

                  {post.title_am && (

                    <p>
                      <strong>
                        Amharic Title:
                      </strong>{" "}
                      {post.title_am}
                    </p>

                  )}


                  {/* CONTENT */}

                  <p>
                    {post.content}
                  </p>


                  {/* AMHARIC CONTENT */}

                  {post.content_am && (

                    <p>
                      <strong>
                        Amharic Content:
                      </strong>{" "}
                      {post.content_am}
                    </p>

                  )}


                  {/* IMAGE PREVIEW */}

                  {post.image_url && (

                    <img
                      src={post.image_url}
                      alt={post.title}
                      style={{
                        width: "150px",
                        height: "100px",
                        objectFit: "cover",
                        borderRadius: "6px",
                        marginTop: "10px",
                      }}
                    />

                  )}


                  {/* VIDEO LINK */}

                  {post.video_url && (

                    <p>

                      <strong>
                        Video:
                      </strong>{" "}

                      <a
                        href={post.video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View Video
                      </a>

                    </p>

                  )}


                  {/* PUBLISHED DATE */}

                  <p>

                    <strong>
                      Published Date:
                    </strong>{" "}

                    {formatDate(
                      post.published_at
                    )}

                  </p>


                  {/* STATUS */}

                  <p>

                    <strong>
                      Status:
                    </strong>{" "}

                    {post.is_published
                      ? "Published"
                      : "Draft"}

                  </p>

                </div>


                {/* ACTION BUTTONS */}

                <div className="admin-item-actions">

                  <button
                    type="button"
                    className="admin-edit-button"
                    onClick={() =>
                      handleEdit(post)
                    }
                  >
                    Edit
                  </button>


                  <button
                    type="button"
                    className="admin-delete-button"
                    onClick={() =>
                      handleDelete(post)
                    }
                  >
                    Delete
                  </button>

                </div>

              </div>

            ))}

          </div>

        )}

      </div>

    </div>
  );
}

export default ManageNews;