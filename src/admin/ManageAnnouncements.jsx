import { useEffect, useState } from "react";
import { supabase } from "../supabase";

function ManageAnnouncements() {
  const emptyForm = {
    title: "",
    title_am: "",
    description: "",
    description_am: "",
    deadline: "",
    application_link: "",
    image_url: "",
    is_active: true,
  };

  const [form, setForm] = useState(emptyForm);
  const [announcements, setAnnouncements] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  async function loadAnnouncements() {
    const { data, error } = await supabase
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) {
      setAnnouncements(data || []);
    }
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingId) {
        const { error } = await supabase
          .from("announcements")
          .update(form)
          .eq("id", editingId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("announcements")
          .insert([form]);

        if (error) throw error;
      }

      resetForm();
      loadAnnouncements();
    } catch (err) {
      alert(err.message);
    }

    setLoading(false);
  }

  function handleEdit(item) {
    setEditingId(item.id);

    setForm({
      title: item.title || "",
      title_am: item.title_am || "",
      description: item.description || "",
      description_am: item.description_am || "",
      deadline: item.deadline || "",
      application_link: item.application_link || "",
      image_url: item.image_url || "",
      is_active: item.is_active,
    });
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this announcement?")) return;

    const { error } = await supabase
      .from("announcements")
      .delete()
      .eq("id", id);

    if (!error) {
      loadAnnouncements();
    }
  }

  return (
    <div className="manage-page">
      <div className="manage-header">
        <h2>Manage Announcements</h2>
        <p>Add, edit, and delete announcements and vacancies.</p>
      </div>

      <div className="admin-form-card">
        <h3>{editingId ? "Edit Announcement" : "Add Announcement"}</h3>

        <form onSubmit={handleSubmit}>
          <div className="admin-form-group">
            <label>English Title</label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
            />
          </div>

          <div className="admin-form-group">
            <label>Amharic Title</label>
            <input
              type="text"
              name="title_am"
              value={form.title_am}
              onChange={handleChange}
            />
          </div>

          <div className="admin-form-group">
            <label>English Description</label>
            <textarea
              name="description"
              rows="5"
              value={form.description}
              onChange={handleChange}
            />
          </div>

          <div className="admin-form-group">
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
            <label>
              <input
                type="checkbox"
                name="is_active"
                checked={form.is_active}
                onChange={handleChange}
              />
              Active (Visible on Website)
            </label>
          </div>

          <div className="admin-form-actions">
            <button className="admin-primary-button" disabled={loading}>
              {editingId ? "Update" : "Add"} Announcement
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

      <div className="admin-list-card">
        <h3>Existing Announcements</h3>
        {announcements.length === 0 ? (
          <p>No announcements found.</p>
        ) : (
          <div className="admin-service-list">
            {announcements.map((item) => (
              <div key={item.id} className="admin-service-item">
                <div className="admin-service-info">
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
