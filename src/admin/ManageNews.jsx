import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import "./Admin.css";

const NEWS_IMAGES_BUCKET = "news-images";
const NEWS_VIDEOS_BUCKET = "news-videos";

function ManageNews() {
  const [news, setNews] = useState([]);

  const [form, setForm] = useState({
    title: "",
    title_am: "",
    content: "",
    content_am: "",
    video_url: "",
    published_at: "",
    is_published: false,
  });

  // "link" = paste a URL (YouTube/Facebook/etc). "upload" = upload a file.
  const [videoMode, setVideoMode] = useState("link");
  const [selectedVideoFile, setSelectedVideoFile] = useState(null);

  const [selectedImages, setSelectedImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);

  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ==========================================
  // LOAD NEWS
  // ==========================================

  async function loadNews() {
    setLoading(true);
    setError("");

    try {
      const { data, error } = await supabase
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
            created_at
          )
          `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNews(data || []);
    } catch (error) {
      console.error("Error loading news:", error);
      setError(error.message || "Failed to load news.");
      setNews([]);
    } finally {
      setLoading(false);
    }
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    loadNews();
  }, []);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;
    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function handleImageChange(event) {
    const files = Array.from(event.target.files || []);
    setSelectedImages(files);
    setError("");
    setSuccess("");
  }

  function handleVideoFileChange(event) {
    const file = event.target.files?.[0] || null;
    setSelectedVideoFile(file);
    setError("");
    setSuccess("");
  }

  function handleVideoModeChange(mode) {
    setVideoMode(mode);
    // Clear whichever field isn't in use, so we never submit stale data
    // from the mode the admin switched away from.
    if (mode === "link") {
      setSelectedVideoFile(null);
      const fileInput = document.getElementById("news-video-file-input");
      if (fileInput) fileInput.value = "";
    } else {
      setForm((previous) => ({ ...previous, video_url: "" }));
    }
  }

  function resetForm() {
    setForm({
      title: "",
      title_am: "",
      content: "",
      content_am: "",
      video_url: "",
      published_at: "",
      is_published: false,
    });

    setVideoMode("link");
    setSelectedVideoFile(null);
    setSelectedImages([]);
    setExistingImages([]);
    setEditingId(null);
    setError("");
    setSuccess("");
    setUploadStatus("");

    const imageInput = document.getElementById("news-images-input");
    if (imageInput) imageInput.value = "";

    const videoInput = document.getElementById("news-video-file-input");
    if (videoInput) videoInput.value = "";
  }

  // ==========================================
  // UPLOAD ONE IMAGE
  // ==========================================

  async function uploadNewsImage(file, newsId) {
    if (!file) return null;

    const fileExtension = file.name.split(".").pop();
    const uniqueFileName = `${Date.now()}-${crypto.randomUUID()}.${fileExtension}`;
    const filePath = `${newsId}/${uniqueFileName}`;

    const { error: uploadError } = await supabase.storage
      .from(NEWS_IMAGES_BUCKET)
      .upload(filePath, file, { cacheControl: "3600", upsert: false });

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage.from(NEWS_IMAGES_BUCKET).getPublicUrl(filePath);
    const imageUrl = publicUrlData?.publicUrl;

    if (!imageUrl) throw new Error("Could not get public URL for uploaded image.");
    return imageUrl;
  }

  async function saveNewsImage(newsId, imageUrl) {
    const { error } = await supabase.from("news_images").insert([{ news_id: newsId, image_url: imageUrl }]);
    if (error) throw error;
  }

  async function uploadMultipleImages(newsId, files) {
    if (!files || files.length === 0) return;
    for (const file of files) {
      const imageUrl = await uploadNewsImage(file, newsId);
      if (imageUrl) await saveNewsImage(newsId, imageUrl);
    }
  }

  // ==========================================
  // UPLOAD VIDEO FILE
  // Returns the public URL, to be saved into
  // news.video_url just like a pasted link.
  // ==========================================

  async function uploadNewsVideo(file, newsId) {
    if (!file) return null;

    setUploadStatus("Uploading video... this can take a moment for larger files.");

    const fileExtension = file.name.split(".").pop();
    const uniqueFileName = `${Date.now()}-${crypto.randomUUID()}.${fileExtension}`;
    const filePath = `${newsId}/${uniqueFileName}`;

    const { error: uploadError } = await supabase.storage
      .from(NEWS_VIDEOS_BUCKET)
      .upload(filePath, file, { cacheControl: "3600", upsert: false });

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage.from(NEWS_VIDEOS_BUCKET).getPublicUrl(filePath);
    const videoUrl = publicUrlData?.publicUrl;

    if (!videoUrl) throw new Error("Could not get public URL for uploaded video.");

    setUploadStatus("");
    return videoUrl;
  }

  // ==========================================
  // ADD OR UPDATE NEWS
  // ==========================================

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      // If in "link" mode, use the pasted URL as-is. If in "upload" mode,
      // we don't have the final URL yet (need the news row's id first for
      // the storage path), so leave it null for now and fill it in after.
      const initialVideoUrl = videoMode === "link" ? form.video_url.trim() || null : null;

      // Only include published_at if the admin actually set one. If we
      // explicitly send `null`, Postgres uses that null and ignores the
      // column's DEFAULT NOW() — so a blank field would permanently push
      // this post to the back of the "newest first" sort. Omitting the
      // key entirely lets the database default apply instead.
      const newsData = {
        title: form.title.trim() || null,
        title_am: form.title_am.trim() || null,
        content: form.content.trim() || null,
        content_am: form.content_am.trim() || null,
        video_url: initialVideoUrl,
        is_published: form.is_published,
      };

      if (form.published_at) {
        newsData.published_at = form.published_at;
      } else if (editingId) {
        // On an explicit edit, an intentionally cleared date should
        // still clear it — inserts are the only case we want to skip.
        newsData.published_at = null;
      }

      let newsId = editingId;

      if (editingId) {
        // If replacing with an uploaded file, don't overwrite video_url
        // with null yet — leave the existing value until the new file
        // finishes uploading, so there's no gap with a broken video.
        const updatePayload = { ...newsData };
        if (videoMode === "upload" && !selectedVideoFile) {
          delete updatePayload.video_url; // keep whatever was already saved
        }

        const { error: updateError } = await supabase.from("news").update(updatePayload).eq("id", editingId);
        if (updateError) throw updateError;
      } else {
        const { data: newNews, error: insertError } = await supabase
          .from("news")
          .insert([newsData])
          .select("id")
          .single();

        if (insertError) throw insertError;
        if (!newNews?.id) throw new Error("News was created, but its ID could not be retrieved.");
        newsId = newNews.id;
      }

      // Upload images
      if (selectedImages.length > 0) {
        await uploadMultipleImages(newsId, selectedImages);
      }

      // Upload video file, then attach its URL to the news row
      if (videoMode === "upload" && selectedVideoFile) {
        const uploadedUrl = await uploadNewsVideo(selectedVideoFile, newsId);
        const { error: videoUpdateError } = await supabase
          .from("news")
          .update({ video_url: uploadedUrl })
          .eq("id", newsId);
        if (videoUpdateError) throw videoUpdateError;
      }

      setSuccess(editingId ? "News updated successfully." : "News added successfully.");
      await loadNews();
      resetForm();
    } catch (error) {
      console.error("Error saving news:", error);
      setError(error.message || "Failed to save news.");
      setUploadStatus("");
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
      video_url: post.video_url || "",
      published_at: post.published_at ? post.published_at.slice(0, 16) : "",
      is_published: post.is_published ?? false,
    });

    // Existing videos always start in "link" mode showing their current
    // URL (whether it was originally pasted or previously uploaded) —
    // the admin can switch to "upload" to replace it with a new file.
    setVideoMode("link");
    setSelectedVideoFile(null);

    setSelectedImages([]);
    setExistingImages(post.news_images || []);

    setError("");
    setSuccess("");

    const imageInput = document.getElementById("news-images-input");
    if (imageInput) imageInput.value = "";
    const videoInput = document.getElementById("news-video-file-input");
    if (videoInput) videoInput.value = "";

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ==========================================
  // DELETE EXISTING IMAGE
  // ==========================================

  async function handleDeleteImage(image) {
    if (!window.confirm("Are you sure you want to delete this image?")) return;

    setError("");
    setSuccess("");

    try {
      const { error } = await supabase.from("news_images").delete().eq("id", image.id);
      if (error) throw error;

      setExistingImages((previous) => previous.filter((item) => item.id !== image.id));
      setSuccess("Image deleted successfully.");
    } catch (error) {
      console.error("Error deleting image:", error);
      setError(error.message || "Failed to delete image.");
    }
  }

  // ==========================================
  // DELETE NEWS
  // ==========================================

  async function handleDelete(post) {
    if (!window.confirm("Are you sure you want to delete this news post and all its images?")) return;

    setError("");
    setSuccess("");

    try {
      const { error } = await supabase.from("news").delete().eq("id", post.id);
      if (error) throw error;

      setSuccess("News deleted successfully.");
      await loadNews();
    } catch (error) {
      console.error("Error deleting news:", error);
      setError(error.message || "Failed to delete news.");
    }
  }

  function formatDate(date) {
    if (!date) return "Not set";
    return new Date(date).toLocaleString();
  }

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <div className="manage-page">
      <div className="manage-header">
        <div>
          <h2>Manage News</h2>
          <p>Add, edit, publish, or delete news posts.</p>
        </div>
      </div>

      {error && <div className="admin-error">{error}</div>}
      {success && <div className="admin-success">{success}</div>}
      {uploadStatus && <div className="admin-info">{uploadStatus}</div>}

      <div className="admin-form-card">
        <h3>{editingId ? "Edit News Post" : "Add New News Post"}</h3>

        <form onSubmit={handleSubmit}>
          <div className="admin-form-group">
            <label>Title (English)</label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Enter news title in English (optional)"
            />
          </div>

          <div className="admin-form-group">
            <label>Title (Amharic)</label>
            <input
              type="text"
              name="title_am"
              value={form.title_am}
              onChange={handleChange}
              placeholder="የዜናውን ርዕስ በአማርኛ ያስገቡ (አማራጭ)"
            />
          </div>

          <div className="admin-form-group">
            <label>Content (English)</label>
            <textarea
              name="content"
              value={form.content}
              onChange={handleChange}
              placeholder="Enter news content in English (optional)"
              rows="7"
            />
          </div>

          <div className="admin-form-group">
            <label>Content (Amharic)</label>
            <textarea
              name="content_am"
              value={form.content_am}
              onChange={handleChange}
              placeholder="የዜናውን ይዘት በአማርኛ ያስገቡ (አማራጭ)"
              rows="7"
            />
          </div>

          {/* ================================
              IMAGES
          ================================= */}

          <div className="admin-form-group">
            <label>News Images</label>
            <input id="news-images-input" type="file" accept="image/*" multiple onChange={handleImageChange} />
            <p>You can select multiple images. This field is optional.</p>
          </div>

          {selectedImages.length > 0 && (
            <div className="news-selected-images" style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "20px" }}>
              {selectedImages.map((file, index) => (
                <div key={`${file.name}-${index}`} style={{ width: "120px" }}>
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    style={{ width: "120px", height: "80px", objectFit: "cover", borderRadius: "6px" }}
                  />
                  <small>{file.name}</small>
                </div>
              ))}
            </div>
          )}

          {editingId && existingImages.length > 0 && (
            <div className="admin-form-group">
              <label>Existing Images</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "15px" }}>
                {existingImages.map((image) => (
                  <div key={image.id} style={{ width: "150px" }}>
                    <img
                      src={image.image_url}
                      alt="News"
                      style={{ width: "150px", height: "100px", objectFit: "cover", borderRadius: "6px" }}
                    />
                    <button
                      type="button"
                      className="admin-delete-button"
                      onClick={() => handleDeleteImage(image)}
                      style={{ marginTop: "5px", width: "100%" }}
                    >
                      Delete Image
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================================
              VIDEO: link or upload toggle
          ================================= */}

          <div className="admin-form-group">
            <label>Video</label>

            <div className="admin-toggle-group">
              <button
                type="button"
                className={`admin-toggle-btn${videoMode === "link" ? " active" : ""}`}
                onClick={() => handleVideoModeChange("link")}
              >
                Paste a link
              </button>
              <button
                type="button"
                className={`admin-toggle-btn${videoMode === "upload" ? " active" : ""}`}
                onClick={() => handleVideoModeChange("upload")}
              >
                Upload a file
              </button>
            </div>

            {videoMode === "link" ? (
              <input
                type="url"
                name="video_url"
                value={form.video_url}
                onChange={handleChange}
                placeholder="Paste a YouTube, Facebook, or direct video URL (optional)"
                style={{ marginTop: "10px" }}
              />
            ) : (
              <div style={{ marginTop: "10px" }}>
                <input
                  id="news-video-file-input"
                  type="file"
                  accept="video/*"
                  onChange={handleVideoFileChange}
                />
                {selectedVideoFile && (
                  <p>
                    Selected: {selectedVideoFile.name} (
                    {(selectedVideoFile.size / (1024 * 1024)).toFixed(1)} MB)
                  </p>
                )}
                {editingId && form.video_url && !selectedVideoFile && (
                  <p>
                    Current video: <a href={form.video_url} target="_blank" rel="noopener noreferrer">view existing</a> — uploading a new file will replace it.
                  </p>
                )}
                <p>Large video files may take a while to upload depending on your connection.</p>
              </div>
            )}
          </div>

          <div className="admin-form-group">
            <label>Published Date</label>
            <input type="datetime-local" name="published_at" value={form.published_at} onChange={handleChange} />
          </div>

          <div className="admin-form-checkbox">
            <label>
              <input type="checkbox" name="is_published" checked={form.is_published} onChange={handleChange} />{" "}
              Publish this news on the public website
            </label>
          </div>

          <div className="admin-form-actions">
            <button type="submit" className="admin-primary-button" disabled={saving}>
              {saving ? "Saving..." : editingId ? "Update News" : "Add News"}
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
        <h3>Existing News</h3>

        {loading ? (
          <p>Loading news...</p>
        ) : news.length === 0 ? (
          <p>No news posts found.</p>
        ) : (
          <div className="admin-service-list">
            {news.map((post) => (
              <div key={post.id} className="admin-service-item">
                <div className="admin-service-info">
                  <h4>{post.title || "Untitled News"}</h4>

                  {post.title_am && (
                    <p>
                      <strong>Amharic Title:</strong> {post.title_am}
                    </p>
                  )}

                  {post.content && <p>{post.content}</p>}

                  {post.content_am && (
                    <p>
                      <strong>Amharic Content:</strong> {post.content_am}
                    </p>
                  )}

                  {post.news_images && post.news_images.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "10px" }}>
                      {post.news_images.map((image) => (
                        <img
                          key={image.id}
                          src={image.image_url}
                          alt="News"
                          style={{ width: "150px", height: "100px", objectFit: "cover", borderRadius: "6px" }}
                        />
                      ))}
                    </div>
                  )}

                  {post.video_url && (
                    <p>
                      <strong>Video:</strong>{" "}
                      <a href={post.video_url} target="_blank" rel="noopener noreferrer">
                        View Video
                      </a>
                    </p>
                  )}

                  <p>
                    <strong>Published Date:</strong> {formatDate(post.published_at)}
                  </p>

                  <p>
                    <strong>Status:</strong> {post.is_published ? "Published" : "Draft"}
                  </p>
                </div>

                <div className="admin-item-actions">
                  <button type="button" className="admin-edit-button" onClick={() => handleEdit(post)}>
                    Edit
                  </button>
                  <button type="button" className="admin-delete-button" onClick={() => handleDelete(post)}>
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