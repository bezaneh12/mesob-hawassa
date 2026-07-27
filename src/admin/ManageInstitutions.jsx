import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import "./Admin.css";

function ManageInstitutions() {
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    name_am: "",
  });

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [editingId, setEditingId] = useState(null);

  async function loadInstitutions() {
    if (!supabase) {
      setError("Supabase is not configured. Please add your environment variables.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("institutions")
      .select("id, name, name_am, logo_url")
      .order("name");

    if (error) {
      console.error(error);
      setError(error.message);
    } else {
      setInstitutions(data || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    if (!supabase) {
      setError("Supabase is not configured. Please add your environment variables.");
      setLoading(false);
      return;
    }

    loadInstitutions();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function handleLogoChange(event) {
    const file = event.target.files?.[0];

    if (!file) {
      setLogoFile(null);
      setLogoPreview("");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5 MB.");
      return;
    }

    setError("");
    setLogoFile(file);

    const previewUrl = URL.createObjectURL(file);
    setLogoPreview(previewUrl);
  }

  function resetForm() {
    setForm({
      name: "",
      name_am: "",
    });

    setLogoFile(null);
    setLogoPreview("");
    setEditingId(null);

    const fileInput = document.getElementById("logo");
    if (fileInput) {
      fileInput.value = "";
    }
  }

  async function uploadLogo(file) {
    if (!file) {
      return null;
    }

    const fileExtension = (file.name.split(".").pop() || "png").toLowerCase();
    const fileName = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2)}.${fileExtension}`;
    const filePath = fileName;

    const { error: uploadError } = await supabase.storage
      .from("institution-logos")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || "application/octet-stream",
      });

    if (uploadError) {
      throw new Error(`Failed to upload logo: ${uploadError.message}`);
    }

    const { data: publicUrlData } = supabase.storage
      .from("institution-logos")
      .getPublicUrl(filePath);

    const publicUrl = publicUrlData?.publicUrl?.trim();

    if (publicUrl) {
      return publicUrl;
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

    if (supabaseUrl) {
      return `${supabaseUrl}/storage/v1/object/public/institution-logos/${encodeURIComponent(filePath)}`;
    }

    throw new Error("Could not generate a public URL for the uploaded logo.");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.name.trim()) {
      setError("English institution name is required.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      let logoUrl = null;

      // If editing and no new logo is selected,
      // keep the existing logo.
      if (editingId && !logoFile) {
        const existingInstitution = institutions.find(
          (institution) => institution.id === editingId
        );

        logoUrl = existingInstitution?.logo_url || null;
      }

      // Upload new logo if selected.
      if (logoFile) {
        logoUrl = await uploadLogo(logoFile);
      }

      const normalizedLogoUrl = typeof logoUrl === "string" ? logoUrl.trim() : null;

      const institutionData = {
        name: form.name.trim(),
        name_am: form.name_am.trim() || null,
        logo_url: normalizedLogoUrl || null,
      };

      if (editingId) {
        const { error } = await supabase
          .from("institutions")
          .update(institutionData)
          .eq("id", editingId);

        if (error) {
          throw error;
        }
      } else {
        const { error } = await supabase
          .from("institutions")
          .insert([institutionData]);

        if (error) {
          throw error;
        }
      }

      resetForm();
      await loadInstitutions();
    } catch (error) {
      console.error("Error saving institution:", error);
      setError(error.message || "Failed to save institution.");
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(institution) {
    setEditingId(institution.id);

    setForm({
      name: institution.name || "",
      name_am: institution.name_am || "",
    });

    setLogoFile(null);
    setLogoPreview(institution.logo_url || "");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleDelete(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this institution?"
    );

    if (!confirmed) {
      return;
    }

    setError("");

    const institution = institutions.find(
      (item) => item.id === id
    );

    const { error } = await supabase
      .from("institutions")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(error);
      setError(error.message);
      return;
    }

    // We don't delete the storage image here yet.
    // The database record is deleted successfully.
    console.log("Deleted institution:", institution?.name);

    await loadInstitutions();
  }

  if (!supabase) {
    return (
      <div className="manage-page">
        <div className="manage-header">
          <h2>Manage Institutions</h2>
          <p>
            Supabase is not configured yet. Add your environment variables to
            enable this admin page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="manage-page">

      <div className="manage-header">
        <div>
          <h2>Manage Institutions</h2>
          <p>
            Add and manage MESOB partner institutions.
          </p>
        </div>
      </div>

      <div className="admin-form-card">

        <h3>
          {editingId
            ? "Edit Institution"
            : "Add New Institution"}
        </h3>

        <form onSubmit={handleSubmit}>

          <div className="admin-form-group">

            <label htmlFor="name">
              Institution Name (English)
            </label>

            <input
              id="name"
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              placeholder="Enter English institution name"
              required
            />

          </div>

          <div className="admin-form-group">

            <label htmlFor="name_am">
              Institution Name (Amharic)
            </label>

            <input
              id="name_am"
              name="name_am"
              type="text"
              value={form.name_am}
              onChange={handleChange}
              placeholder="የተቋሙን ስም በአማርኛ ያስገቡ"
            />

          </div>

          <div className="admin-form-group">

            <label htmlFor="logo">
              Institution Logo
            </label>

            <input
              id="logo"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              onChange={handleLogoChange}
            />

            <small>
              Maximum file size: 5 MB
            </small>

          </div>

          {logoPreview && (
            <div className="logo-preview-container">

              <p>Logo Preview:</p>

              <img
                src={logoPreview}
                alt="Logo preview"
                className="logo-preview"
              />

            </div>
          )}

          {error && (
            <p className="admin-error">
              {error}
            </p>
          )}

          <div className="admin-form-actions">

            <button
              type="submit"
              className="admin-primary-button"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : editingId
                  ? "Update Institution"
                  : "Add Institution"}
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

        <h3>Existing Institutions</h3>

        {loading ? (
          <p>Loading institutions...</p>
        ) : institutions.length === 0 ? (
          <p>No institutions found.</p>
        ) : (

          <div className="admin-institution-list">

            {institutions.map((institution) => (

              <div
                key={institution.id}
                className="admin-institution-item"
              >

                <div className="admin-institution-info">

                  {institution.logo_url ? (
  <img
    src={institution.logo_url}
    alt={institution.name}
    className="admin-institution-logo"
    onError={(event) => {
      console.error(
        "Logo failed to load:",
        institution.logo_url
      );

      event.currentTarget.style.display = "none";
    }}
  />
) : (
  <div className="no-logo">
    No Logo
  </div>
)}

                  <div>

                    <h4>
                      {institution.name}
                    </h4>

                    {institution.name_am && (
                      <p>
                        {institution.name_am}
                      </p>
                    )}

                  </div>

                </div>

                <div className="admin-item-actions">

                  <button
                    type="button"
                    onClick={() =>
                      handleEdit(institution)
                    }
                    className="admin-edit-button"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleDelete(institution.id)
                    }
                    className="admin-delete-button"
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

export default ManageInstitutions;