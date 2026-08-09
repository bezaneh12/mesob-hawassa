import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import "./Admin.css";

const ANNOUNCEMENT_IMAGES_BUCKET = "announcement-images";

function ManageAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);

  const [form, setForm] = useState({
    title: "",
    title_am: "",
    description: "",
    description_am: "",
    deadline: "",
    application_link: "",
    image_url: "",
    is_active: true,
  });

  // "upload" = pick a file from device (default). "link" = paste a URL.
  const [imageMode, setImageMode] = useState("upload");
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [existingImageUrl, setExistingImageUrl] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    loadAnnouncements();
  }, []);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function handleImageFileChange(event) {
    const file = event.target.files?.[0] || null;
    setSelectedImageFile(file);
    setError("");
    setSuccess("");
  }

  function handleImageModeChange(mode) {
    setImageMode(mode);
    if (mode === "upload") {
      setForm((prev) => ({ ...prev, image_url: "" }));
    } else {
      setSelectedImageFile(null);
      const fileInput = document.getElementById("announcement-image-file-input");
      if (fileInput) fileInput.value = "";
    }
  }

  function resetForm() {
    setForm({
      title: "",
      title_am: "",
      description: "",
      description_am: "",
      deadline: "",
      application_link: "",
      image_url: "",
      is_active: true,
    });
    setImageMode("upload");
    setSelectedImageFile(null);
    setExistingImageUrl("");
    setEditingId(null);
    setError("");
    setSuccess("");
    setUploadStatus("");

    const fileInput = document.getElementById("announcement-image-file-input");
    if (fileInput) fileInput.value = "";
  }

  // ==========================================
  // UPLOAD IMAGE FILE
  // Returns the public URL, to be saved into
  // announcements.image_url.
  // ==========================================

  async function uploadAnnouncementImage(file, announcementId) {
    if (!file) return null;

    setUploadStatus("Uploading image...");

    const fileExtension = file.name.split(".").pop();
    const uniqueFileName = `${Date.now()}-${crypto.randomUUID()}.${fileExtension}`;
    const filePath = `${announcementId}/${uniqueFileName}`;

    const { error: uploadError } = await supabase.storage
      .from(ANNOUNCEMENT_IMAGES_BUCKET)
      .upload(filePath, file, { cacheControl: "3600", upsert: false });

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage
      .from(ANNOUNCEMENT_IMAGES_BUCKET)
      .getPublicUrl(filePath);

    const imageUrl = publicUrlData?.publicUrl;
    if (!imageUrl) throw new Error("Could not get public URL for uploaded image.");

    setUploadStatus("");
    return imageUrl;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    setSaving(true);

    try {
      // In "link" mode we already have the URL. In "upload" mode we
      // don't have the final URL yet (need the row's id first to build
      // the storage path), so leave it out for now and fill it in after.
      const initialImageUrl = imageMode === "link" ? form.image_url.trim() || null : null;

      const payload = {
        title: form.title.trim() || null,
        title_am: form.title_am.trim() || null,
        description: form.description.trim() || null,
        description_am: form.description_am.trim() || null,
        deadline: form.deadline || null,
        application_link: form.application_link.trim() || null,
        image_url: initialImageUrl,
        is_active: form.is_active,
      };

      let announcementId = editingId;

      if (editingId) {
        const updatePayload = { ...payload };
        // If staying in upload mode without picking a new file, keep
        // whatever image is already saved instead of wiping it to null.
        if (imageMode === "upload" && !selectedImageFile) {
          delete updatePayload.image_url;
        }

        const { error: updateError } = await supabase
          .from("announcements")
          .update(updatePayload)
          .eq("id", editingId);

        if (updateError) throw updateError;
      } else {
        const { data: newRow, error: insertError } = await supabase
          .from("announcements")
          .insert([payload])
          .select("id")
          .single();

        if (insertError) throw insertError;
        if (!newRow?.id) throw new Error("Announcement was created, but its ID could not be retrieved.");
        announcementId = newRow.id;
      }

      // Upload the image file, then attach its URL to the row
      if (imageMode === "upload" && selectedImageFile) {
        const uploadedUrl = await uploadAnnouncementImage(selectedImageFile, announcementId);
        const { error: imageUpdateError } = await supabase
          .from("announcements")
          .update({ image_url: uploadedUrl })
          .eq("id", announcementId);
        if (imageUpdateError) throw imageUpdateError;
      }

      setSuccess(editingId ? "Announcement updated successfully." : "Announcement added successfully.");
      await loadAnnouncements();
      resetForm();
    } catch (err) {
      console.error("Error saving announcement:", err);
      setError(err.message || "Failed to save announcement.");
      setUploadStatus("");
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(item) {
    setEditingId(item.id);
    setForm({
      title: item.title || "",
      title_am: item.title_am || "",
      description: item.description || "",
      description_am: item.description_am || "",
      deadline: item.deadline ? item.deadline.slice(0, 10) : "",
      application_link: item.application_link || "",
      image_url: item.image_url || "",
      is_active: item.is_active ?? true,
    });

    // Existing images always start in "upload" mode, showing a preview
    // of the current image. The admin can switch to "link" to replace
    // it with a pasted URL instead, or pick a new file to upload.
    setImageMode("upload");
    setSelectedImageFile(null);
    setExistingImageUrl(item.image_url || "");

    setError("");
    setSuccess("");

    const fileInput = document.getElementById("announcement-image-file-input");
    if (fileInput) fileInput.value = "";

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

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
      {uploadStatus && <div className="admin-info">{uploadStatus}</div>}

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
              placeholder="Enter announcement title in English (optional)"
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
            <label>Description (English)</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Enter announcement details in English (optional)"
              rows="4"
            />
          </div>

          <div className="admin-form-group">
            <label>Description (Amharic)</label>
            <textarea
              name="description_am"
              value={form.description_am}
              onChange={handleChange}
              placeholder="የማስታወቂያውን ይዘት በአማርኛ ያስገቡ (አማራጭ)"
              rows="4"
            />
          </div>

          <div className="admin-form-group">
            <label>Deadline</label>
            <input type="date" name="deadline" value={form.deadline} onChange={handleChange} />
          </div>

          <div className="admin-form-group">
            <label>Application Link</label>
            <input
              type="url"
              name="application_link"
              value={form.application_link}
              onChange={handleChange}
              placeholder="https://example.com/apply"
            />
          </div>

          {/* ================================
              IMAGE: upload (default) or link
          ================================= */}

          <div className="admin-form-group">
            <label>Image</label>

            <div className="admin-toggle-group">
              <button
                type="button"
                className={`admin-toggle-btn${imageMode === "upload" ? " active" : ""}`}
                onClick={() => handleImageModeChange("upload")}
              >
                Upload from device
              </button>
              <button
                type="button"
                className={`admin-toggle-btn${imageMode === "link" ? " active" : ""}`}
                onClick={() => handleImageModeChange("link")}
              >
                Paste a link
              </button>
            </div>

            {imageMode === "upload" ? (
              <div style={{ marginTop: "10px" }}>
                <input
                  id="announcement-image-file-input"
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                />

                {selectedImageFile && (
                  <div className="logo-preview-container">
                    <p>Selected image:</p>
                    <img
                      src={URL.createObjectURL(selectedImageFile)}
                      alt="Selected"
                      className="logo-preview"
                    />
                  </div>
                )}

                {editingId && existingImageUrl && !selectedImageFile && (
                  <div className="logo-preview-container">
                    <p>Current image:</p>
                    <img src={existingImageUrl} alt="Current" className="logo-preview" />
                    <small>Choosing a new file above will replace this image.</small>
                  </div>
                )}
              </div>
            ) : (
              <input
                type="url"
                name="image_url"
                value={form.image_url}
                onChange={handleChange}
                placeholder="https://example.com/image.jpg"
                style={{ marginTop: "10px" }}
              />
            )}
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
                    {item.title}{" "}
                    {!item.is_active && (
                      <span style={{ color: "red", fontSize: "0.8em" }}>(Inactive)</span>
                    )}
                  </h4>
                  {item.title_am && <p>{item.title_am}</p>}
                  {item.deadline && (
                    <p style={{ fontSize: "0.85em", color: "#666" }}>
                      Deadline: {new Date(item.deadline).toLocaleDateString()}
                    </p>
                  )}
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