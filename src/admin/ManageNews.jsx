import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import "./Admin.css";

const NEWS_IMAGES_BUCKET = "news-images";

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

  // Selected image files before uploading
  const [selectedImages, setSelectedImages] = useState([]);

  // Existing images belonging to the news post being edited
  const [existingImages, setExistingImages] = useState([]);

  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        throw error;
      }

      setNews(data || []);
    } catch (error) {
      console.error("Error loading news:", error);

      setError(
        error.message || "Failed to load news."
      );

      setNews([]);
    } finally {
      setLoading(false);
    }
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
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setForm((previous) => ({
      ...previous,

      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  }

  // ==========================================
  // HANDLE MULTIPLE IMAGE SELECTION
  // ==========================================

  function handleImageChange(event) {
    const files = Array.from(
      event.target.files || []
    );

    setSelectedImages(files);

    setError("");
    setSuccess("");
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
      video_url: "",
      published_at: "",
      is_published: false,
    });

    setSelectedImages([]);

    setExistingImages([]);

    setEditingId(null);

    setError("");
    setSuccess("");

    // Reset file input
    const fileInput =
      document.getElementById(
        "news-images-input"
      );

    if (fileInput) {
      fileInput.value = "";
    }
  }

  // ==========================================
  // UPLOAD ONE IMAGE
  // ==========================================

  async function uploadNewsImage(
    file,
    newsId
  ) {
    if (!file) {
      return null;
    }

    // Create a unique file name
    const fileExtension =
      file.name.split(".").pop();

    const safeFileName =
      file.name
        .replace(
          /[^a-zA-Z0-9.-]/g,
          "-"
        )
        .toLowerCase();

    const uniqueFileName =
      `${Date.now()}-${crypto.randomUUID()}.${fileExtension}`;

    const filePath =
      `${newsId}/${uniqueFileName}`;

    // ========================================
    // UPLOAD FILE TO STORAGE
    // ========================================

    const {
      error: uploadError,
    } = await supabase.storage
      .from(NEWS_IMAGES_BUCKET)
      .upload(
        filePath,
        file,
        {
          cacheControl: "3600",
          upsert: false,
        }
      );

    if (uploadError) {
      throw uploadError;
    }

    // ========================================
    // GET PUBLIC URL
    // ========================================

    const {
      data: publicUrlData,
    } = supabase.storage
      .from(NEWS_IMAGES_BUCKET)
      .getPublicUrl(filePath);

    const imageUrl =
      publicUrlData?.publicUrl;

    if (!imageUrl) {
      throw new Error(
        "Could not get public URL for uploaded image."
      );
    }

    return imageUrl;
  }

  // ==========================================
  // SAVE IMAGE RECORD
  // ==========================================

  async function saveNewsImage(
    newsId,
    imageUrl
  ) {
    const {
      error,
    } = await supabase
      .from("news_images")
      .insert([
        {
          news_id: newsId,
          image_url: imageUrl,
        },
      ]);

    if (error) {
      throw error;
    }
  }

  // ==========================================
  // UPLOAD MULTIPLE IMAGES
  // ==========================================

  async function uploadMultipleImages(
    newsId,
    files
  ) {
    if (!files || files.length === 0) {
      return;
    }

    for (const file of files) {
      const imageUrl =
        await uploadNewsImage(
          file,
          newsId
        );

      if (imageUrl) {
        await saveNewsImage(
          newsId,
          imageUrl
        );
      }
    }
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
      // ========================================
      // PREPARE NEWS DATA
      // ALL FIELDS ARE OPTIONAL
      // ========================================

      const newsData = {
        title:
          form.title.trim() || null,

        title_am:
          form.title_am.trim() || null,

        content:
          form.content.trim() || null,

        content_am:
          form.content_am.trim() || null,

        video_url:
          form.video_url.trim() || null,

        published_at:
          form.published_at || null,

        is_published:
          form.is_published,
      };

      // ========================================
      // UPDATE EXISTING NEWS
      // ========================================

      if (editingId) {
        const {
          error: updateError,
        } = await supabase
          .from("news")
          .update(newsData)
          .eq("id", editingId);

        if (updateError) {
          throw updateError;
        }

        // Upload newly selected images
        if (
          selectedImages.length > 0
        ) {
          await uploadMultipleImages(
            editingId,
            selectedImages
          );
        }

        setSuccess(
          "News updated successfully."
        );
      }

      // ========================================
      // ADD NEW NEWS
      // ========================================

      else {
        const {
          data: newNews,
          error: insertError,
        } = await supabase
          .from("news")
          .insert([
            newsData,
          ])
          .select("id")
          .single();

        if (insertError) {
          throw insertError;
        }

        if (!newNews?.id) {
          throw new Error(
            "News was created, but its ID could not be retrieved."
          );
        }

        // Upload selected images
        if (
          selectedImages.length > 0
        ) {
          await uploadMultipleImages(
            newNews.id,
            selectedImages
          );
        }

        setSuccess(
          "News added successfully."
        );
      }

      // Reload news
      await loadNews();

      // Reset form
      resetForm();

    } catch (error) {
      console.error(
        "Error saving news:",
        error
      );

      setError(
        error.message ||
          "Failed to save news."
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
      title:
        post.title || "",

      title_am:
        post.title_am || "",

      content:
        post.content || "",

      content_am:
        post.content_am || "",

      video_url:
        post.video_url || "",

      published_at:
        post.published_at
          ? post.published_at.slice(
              0,
              16
            )
          : "",

      is_published:
        post.is_published ?? false,
    });

    setSelectedImages([]);

    setExistingImages(
      post.news_images || []
    );

    setError("");
    setSuccess("");

    const fileInput =
      document.getElementById(
        "news-images-input"
      );

    if (fileInput) {
      fileInput.value = "";
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  // ==========================================
  // DELETE EXISTING IMAGE
  // ==========================================

  async function handleDeleteImage(
    image
  ) {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this image?"
      );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      const {
        error,
      } = await supabase
        .from("news_images")
        .delete()
        .eq("id", image.id);

      if (error) {
        throw error;
      }

      // Remove from displayed list
      setExistingImages(
        (previous) =>
          previous.filter(
            (item) =>
              item.id !== image.id
          )
      );

      setSuccess(
        "Image deleted successfully."
      );

    } catch (error) {
      console.error(
        "Error deleting image:",
        error
      );

      setError(
        error.message ||
          "Failed to delete image."
      );
    }
  }

  // ==========================================
  // DELETE NEWS
  // ==========================================

  async function handleDelete(post) {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this news post and all its images?"
      );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      // Because news_images has
      // ON DELETE CASCADE,
      // related image records are
      // automatically deleted.

      const {
        error,
      } = await supabase
        .from("news")
        .delete()
        .eq("id", post.id);

      if (error) {
        throw error;
      }

      // If you want to remove the
      // actual Storage files too,
      // we can add that separately.

      setSuccess(
        "News deleted successfully."
      );

      await loadNews();

    } catch (error) {
      console.error(
        "Error deleting news:",
        error
      );

      setError(
        error.message ||
          "Failed to delete news."
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

    return new Date(
      date
    ).toLocaleString();
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

          <h2>
            Manage News
          </h2>

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
          SUCCESS MESSAGE
      ======================================= */}

      {success && (

        <div className="admin-success">
          {success}
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


        <form
          onSubmit={handleSubmit}
        >

          {/* ==================================
              ENGLISH TITLE
          =================================== */}

          <div className="admin-form-group">

            <label>
              Title (English)
            </label>

            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Enter news title in English (optional)"
            />

          </div>


          {/* ==================================
              AMHARIC TITLE
          =================================== */}

          <div className="admin-form-group">

            <label>
              Title (Amharic)
            </label>

            <input
              type="text"
              name="title_am"
              value={form.title_am}
              onChange={handleChange}
              placeholder="የዜናውን ርዕስ በአማርኛ ያስገቡ (አማራጭ)"
            />

          </div>


          {/* ==================================
              ENGLISH CONTENT
          =================================== */}

          <div className="admin-form-group">

            <label>
              Content (English)
            </label>

            <textarea
              name="content"
              value={form.content}
              onChange={handleChange}
              placeholder="Enter news content in English (optional)"
              rows="7"
            />

          </div>


          {/* ==================================
              AMHARIC CONTENT
          =================================== */}

          <div className="admin-form-group">

            <label>
              Content (Amharic)
            </label>

            <textarea
              name="content_am"
              value={form.content_am}
              onChange={handleChange}
              placeholder="የዜናውን ይዘት በአማርኛ ያስገቡ (አማራጭ)"
              rows="7"
            />

          </div>


          {/* ==================================
              MULTIPLE IMAGES
          =================================== */}

          <div className="admin-form-group">

            <label>
              News Images
            </label>

            <input
              id="news-images-input"
              type="file"
              accept="image/*"
              multiple
              onChange={
                handleImageChange
              }
            />

            <p>
              You can select multiple
              images. This field is optional.
            </p>

          </div>


          {/* ==================================
              SELECTED IMAGE PREVIEW
          =================================== */}

          {selectedImages.length >
            0 && (

            <div
              className="news-selected-images"
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "10px",
                marginBottom: "20px",
              }}
            >

              {selectedImages.map(
                (file, index) => (

                  <div
                    key={
                      `${file.name}-${index}`
                    }
                    style={{
                      width: "120px",
                    }}
                  >

                    <img
                      src={
                        URL.createObjectURL(
                          file
                        )
                      }
                      alt={
                        file.name
                      }
                      style={{
                        width: "120px",
                        height: "80px",
                        objectFit: "cover",
                        borderRadius:
                          "6px",
                      }}
                    />

                    <small>
                      {file.name}
                    </small>

                  </div>

                )
              )}

            </div>

          )}


          {/* ==================================
              EXISTING IMAGES
          =================================== */}

          {editingId &&
            existingImages.length >
              0 && (

            <div
              className="admin-form-group"
            >

              <label>
                Existing Images
              </label>

              <div
                style={{
                  display: "flex",
                  flexWrap:
                    "wrap",
                  gap: "15px",
                }}
              >

                {existingImages.map(
                  (image) => (

                    <div
                      key={
                        image.id
                      }
                      style={{
                        width:
                          "150px",
                      }}
                    >

                      <img
                        src={
                          image.image_url
                        }
                        alt="News"
                        style={{
                          width:
                            "150px",
                          height:
                            "100px",
                          objectFit:
                            "cover",
                          borderRadius:
                            "6px",
                        }}
                      />

                      <button
                        type="button"
                        className="admin-delete-button"
                        onClick={() =>
                          handleDeleteImage(
                            image
                          )
                        }
                        style={{
                          marginTop:
                            "5px",
                          width:
                            "100%",
                        }}
                      >
                        Delete Image
                      </button>

                    </div>

                  )
                )}

              </div>

            </div>

          )}


          {/* ==================================
              VIDEO URL
          =================================== */}

          <div className="admin-form-group">

            <label>
              Video URL
            </label>

            <input
              type="url"
              name="video_url"
              value={form.video_url}
              onChange={handleChange}
              placeholder="Paste video URL (optional)"
            />

          </div>


          {/* ==================================
              PUBLISHED DATE
          =================================== */}

          <div className="admin-form-group">

            <label>
              Published Date
            </label>

            <input
              type="datetime-local"
              name="published_at"
              value={
                form.published_at
              }
              onChange={
                handleChange
              }
            />

          </div>


          {/* ==================================
              PUBLISH CHECKBOX
          =================================== */}

          <div className="admin-form-checkbox">

            <label>

              <input
                type="checkbox"
                name="is_published"
                checked={
                  form.is_published
                }
                onChange={
                  handleChange
                }
              />

              {" "}

              Publish this news on
              the public website

            </label>

          </div>


          {/* ==================================
              BUTTONS
          =================================== */}

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
                onClick={
                  resetForm
                }
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

            {news.map(
              (post) => (

                <div
                  key={post.id}
                  className="admin-service-item"
                >

                  <div
                    className="admin-service-info"
                  >

                    {/* TITLE */}

                    <h4>
                      {post.title ||
                        "Untitled News"}
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

                    {post.content && (

                      <p>
                        {post.content}
                      </p>

                    )}


                    {/* AMHARIC CONTENT */}

                    {post.content_am && (

                      <p>
                        <strong>
                          Amharic Content:
                        </strong>{" "}
                        {post.content_am}
                      </p>

                    )}


                    {/* IMAGE PREVIEWS */}

                    {post.news_images &&
                      post.news_images
                        .length > 0 && (

                      <div
                        style={{
                          display:
                            "flex",
                          flexWrap:
                            "wrap",
                          gap: "10px",
                          marginTop:
                            "10px",
                        }}
                      >

                        {post.news_images.map(
                          (image) => (

                            <img
                              key={
                                image.id
                              }
                              src={
                                image.image_url
                              }
                              alt="News"
                              style={{
                                width:
                                  "150px",
                                height:
                                  "100px",
                                objectFit:
                                  "cover",
                                borderRadius:
                                  "6px",
                              }}
                            />

                          )
                        )}

                      </div>

                    )}


                    {/* VIDEO */}

                    {post.video_url && (

                      <p>

                        <strong>
                          Video:
                        </strong>{" "}

                        <a
                          href={
                            post.video_url
                          }
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

                  <div
                    className="admin-item-actions"
                  >

                    <button
                      type="button"
                      className="admin-edit-button"
                      onClick={() =>
                        handleEdit(
                          post
                        )
                      }
                    >
                      Edit
                    </button>


                    <button
                      type="button"
                      className="admin-delete-button"
                      onClick={() =>
                        handleDelete(
                          post
                        )
                      }
                    >
                      Delete
                    </button>

                  </div>

                </div>

              )
            )}

          </div>

        )}

      </div>

    </div>
  );
}

export default ManageNews;