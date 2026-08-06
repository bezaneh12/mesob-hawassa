import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import "./Admin.css";

function ManageAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);

  const [form, setForm] = useState({
    title: "",
    title_am: "",
    content: "",
    content_am: "",
    is_active: true,
  });

  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ==========================================
  // LOAD ANNOUNCEMENTS
  // ==========================================

  async function loadAnnouncements() {
    setLoading(true);
    setError("");

    try {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (err) {
      console.error("Error loading announcements:", err);
      setError(err.message || "Failed to load announcements.");
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAnnouncements();
  }, []);

  // ==========================================
  // HANDLE INPUT
  // ==========================================

  function handleChange(event) {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({
      ...prev,
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
      is_active: true,
    });
    setEditingId(null);
    setError("");
    setSuccess("");
  }

  // ==========================================
  // ADD / UPDATE
  // ==========================================

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!form.title.trim()) {
      setError("English title is required.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        title: form.title.trim(),
        title_am: form.title_am.trim() || null,
        content: form.content.trim() || null,
        content_am: form.content_am.trim() || null,
        is_active: form.is_active,
      };

      if (editingId) {
        const { error: updateError } = await supabase
          .from("announcements")
          .update(payload)
          .eq("id", editingId);

        if (updateError) throw updateError;
        setSuccess("Announcement updated successfully.");
      } else {
        const { error: insertError } = await supabase
          .from("announcements")
          .insert([payload]);

        if (insertError) throw insertError;
        setSuccess("Announcement added successfully.");
      }

      await loadAnnouncements();
      resetForm();
    } catch (err) {
      console.error("Error saving announcement:", err);
      setError(err.message || "Failed to save announcement.");
    } finally {
      setSaving(false);
    }
  }

  // ==========================================
  // EDIT
  // ==========================================

  function handleEdit(item) {
    setEditingId(item.id);
    setForm({
      title: item.title || "",
      title_am: item.title_am || "",
      content: item.content || "",
      content_am: item.content_am || "",
      is_active: item.is_active ?? true,
    });
    setError("");
    setSuccess("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ==========================================
  // DELETE
  // ==========================================

  async function handleDelete(item) {
    if (!window.confirm("Are you sure you want to delete this announcement?")) return;

    setError("");
    setSuccess("");

    try {
      const { error } = await supabase
        .from("announcements")
        .delete()
        .eq("id", item.id);

      if (error) throw error;
      setSuccess("Announcement deleted successfully.");
      await loadAnnouncements();
    } catch (err) {
      console.error("Error deleting announcement:", err);
      setError(err.message || "Failed to delete announcement.");
    }
  }

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="manage-page">
      <div className="manage-header">
        <div>
          <h2>Manage Announcements</h2>
          <p>Add, edit, or delete announcements shown to citizens.</p>
        </div>
      </div>

      {error && <div className="admin-error">{error}</div>}
      {success && <div className="admin-success">{success}</div>}

      <div className="admin-form-card">
        <h3>{editingId ? "Edit Announcement" : "Add New Announcement"}</h3>

        <form onSubmit={handleSubmit}>
          <div className="admin-form-group">
            <label>Title (English)</label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Enter announcement title in English"
              required
            />
          </div>

          <div className="admin-form-group">
            <label>Title (Amharic)</label>
            <input
              type="text"
              name="title_am"
              value={form.title_am}
              onChange={handleChange}
              placeholder="ማስታወቂያውን በአማርኛ ያስገቡ (አማራጭ)"
            />
          </div>

          <div className="admin-form-group">
            <label>Content (English)</label>
            <textarea
              name="content"
              value={form.content}
              onChange={handleChange}
              placeholder="Enter announcement details in English (optional)"
              rows="4"
            />
          </div>

          <div className="admin-form-group">
            <label>Content (Amharic)</label>
            <textarea
              name="content_am"
              value={form.content_am}
              onChange={handleChange}
              placeholder="የማስታወቂያውን ይዘት በአማርኛ ያስገቡ (አማራጭ)"
              rows="4"
            />
          </div>

          <div className="admin-form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                name="is_active"
                checked={form.is_active}
                onChange={handleChange}
              />
              Is Active (Visible to public)
            </label>
          </div>

          <div className="admin-form-actions">
            <button type="submit" className="admin-primary-button" disabled={saving}>
              {saving ? "Saving..." : editingId ? "Update Announcement" : "Add Announcement"}
            </button>
            {editingId && (
              <button type="button" className="admin-secondary-button" onClick={resetForm}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="admin-list-card">
        <h3>Existing Announcements</h3>
        {loading ? (
          <p>Loading...</p>
        ) : announcements.length === 0 ? (
          <p>No announcements found.</p>
        ) : (
          <div className="admin-service-list">
            {announcements.map((item) => (
              <div key={item.id} className="admin-service-item">
                <div className="admin-service-info">
                  <h4>
                    {item.title} {!item.is_active && <span style={{ color: "red", fontSize: "0.8em" }}>(Inactive)</span>}
                  </h4>
                  {item.title_am && <p>{item.title_am}</p>}
                </div>
                <div className="admin-item-actions">
                  <button type="button" className="admin-edit-button" onClick={() => handleEdit(item)}>
                    Edit
                  </button>
                  <button type="button" className="admin-delete-button" onClick={() => handleDelete(item)}>
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

export default ManageAnnouncements;

          <div className="admin-form-group">
<<<<<<< HEAD
            <label>Amharic Title</label>
=======
            <label>Title (Amharic)</label>
>>>>>>> c1e5385b28efadf0a599b9d65110f77a58b4c7c0
            <input
              type="text"
              name="title_am"
              value={form.title_am}
              onChange={handleChange}
<<<<<<< HEAD
=======
              placeholder="ማስታወቂያውን በአማርኛ ያስገቡ (አማራጭ)"
>>>>>>> c1e5385b28efadf0a599b9d65110f77a58b4c7c0
            />
          </div>

          <div className="admin-form-group">
<<<<<<< HEAD
            <label>English Description</label>
            <textarea
              name="description"
              rows="5"
              value={form.description}
              onChange={handleChange}
=======
            <label>Content (English)</label>
            <textarea
              name="content"
              value={form.content}
              onChange={handleChange}
              placeholder="Enter announcement details in English (optional)"
              rows="4"
>>>>>>> c1e5385b28efadf0a599b9d65110f77a58b4c7c0
            />
          </div>

          <div className="admin-form-group">
<<<<<<< HEAD
            <label>Amharic Description</label>
            <textarea
              name="description_am"
              rows="5"
              value={form.description_am}
              onChange={handleChange}
            />
          </div>

          <div className="admin-form-group">
            <label>Deadline</label>
            <input
              type="date"
              name="deadline"
              value={form.deadline}
              onChange={handleChange}
            />
          </div>

          <div className="admin-form-group">
            <label>Application Link</label>
            <input
              type="text"
              name="application_link"
              value={form.application_link}
              onChange={handleChange}
            />
          </div>

          <div className="admin-form-group">
            <label>Image URL</label>
            <input
              type="text"
              name="image_url"
              value={form.image_url}
              onChange={handleChange}
            />
            {form.image_url && (
              <img src={form.image_url} alt="" className="logo-preview" />
            )}
          </div>

          <div className="admin-form-group">
=======
            <label>Content (Amharic)</label>
            <textarea
              name="content_am"
              value={form.content_am}
              onChange={handleChange}
              placeholder="የማስታወቂያውን ይዘት በአማርኛ ያስገቡ (አማራጭ)"
              rows="4"
            />
          </div>

          <div className="admin-form-group checkbox-group">
>>>>>>> c1e5385b28efadf0a599b9d65110f77a58b4c7c0
            <label>
              <input
                type="checkbox"
                name="is_active"
                checked={form.is_active}
                onChange={handleChange}
              />
<<<<<<< HEAD
              Active (Visible on Website)
=======
              Is Active (Visible to public)
>>>>>>> c1e5385b28efadf0a599b9d65110f77a58b4c7c0
            </label>
          </div>

          <div className="admin-form-actions">
<<<<<<< HEAD
            <button className="admin-primary-button" disabled={loading}>
              {editingId ? "Update" : "Add"} Announcement
            </button>
            {editingId && (
              <button
                type="button"
                className="admin-secondary-button"
                onClick={resetForm}
              >
=======
            <button type="submit" className="admin-primary-button" disabled={saving}>
              {saving ? "Saving..." : editingId ? "Update Announcement" : "Add Announcement"}
            </button>
            {editingId && (
              <button type="button" className="admin-secondary-button" onClick={resetForm}>
>>>>>>> c1e5385b28efadf0a599b9d65110f77a58b4c7c0
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="admin-list-card">
        <h3>Existing Announcements</h3>
<<<<<<< HEAD
        {announcements.length === 0 ? (
=======
        {loading ? (
          <p>Loading...</p>
        ) : announcements.length === 0 ? (
>>>>>>> c1e5385b28efadf0a599b9d65110f77a58b4c7c0
          <p>No announcements found.</p>
        ) : (
          <div className="admin-service-list">
            {announcements.map((item) => (
              <div key={item.id} className="admin-service-item">
                <div className="admin-service-info">
<<<<<<< HEAD
                  <h4>{item.title || "Untitled"}</h4>
                  <p>
                    {item.deadline
                      ? `Deadline: ${new Date(item.deadline).toLocaleDateString()}`
                      : "No deadline"}
                  </p>
                  <p>
                    Status:
                    <strong>
                      {item.is_active ? "Active" : "Hidden"}
                    </strong>
                  </p>
                </div>
                <div className="admin-item-actions">
                  <button
                    className="admin-edit-button"
                    onClick={() => handleEdit(item)}
                  >
                    Edit
                  </button>
                  <button
                    className="admin-delete-button"
                    onClick={() => handleDelete(item.id)}
                  >
=======
                  <h4>
                    {item.title} {!item.is_active && <span style={{ color: "red", fontSize: "0.8em" }}>(Inactive)</span>}
                  </h4>
                  {item.title_am && <p>{item.title_am}</p>}
                </div>
                <div className="admin-item-actions">
                  <button type="button" className="admin-edit-button" onClick={() => handleEdit(item)}>
                    Edit
                  </button>
                  <button type="button" className="admin-delete-button" onClick={() => handleDelete(item)}>
>>>>>>> c1e5385b28efadf0a599b9d65110f77a58b4c7c0
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

export default ManageAnnouncements;
