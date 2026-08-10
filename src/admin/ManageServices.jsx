import { useEffect, useRef, useState } from "react";
import { supabase } from "../supabase";
import "./Admin.css";

function ManageServices() {
  const [institutions, setInstitutions] = useState([]);
  const [services, setServices] = useState([]);

  const [selectedInstitutionId, setSelectedInstitutionId] = useState("");
  const [isInstitutionMenuOpen, setIsInstitutionMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [form, setForm] = useState({
    name: "",
    name_am: "",
    booking_link: "",
  });

  const [editingId, setEditingId] = useState(null);

  const [loadingInstitutions, setLoadingInstitutions] = useState(true);
  const [loadingServices, setLoadingServices] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // ============================================
  // LOAD INSTITUTIONS
  // ============================================

  async function loadInstitutions() {
    if (!supabase) {
      setError("Supabase is not configured. Please add your environment variables.");
      setLoadingInstitutions(false);
      return;
    }

    setLoadingInstitutions(true);
    setError("");

    const { data, error } = await supabase
      .from("institutions")
      .select("id, name, name_am")
      .order("name");

    if (error) {
      console.error("Error loading institutions:", error);
      setError(error.message);
    } else {
      setInstitutions(data || []);
    }

    setLoadingInstitutions(false);
  }

  // ============================================
  // LOAD SERVICES FOR SELECTED INSTITUTION
  // ============================================

  async function loadServices(institutionId) {
    if (!supabase) {
      setError("Supabase is not configured. Please add your environment variables.");
      return;
    }

    if (!institutionId) {
      setServices([]);
      return;
    }

    setLoadingServices(true);
    setError("");

    const { data, error } = await supabase
      .from("services")
      .select("id, institution_id, name, name_am, booking_link, created_at, updated_at")
      .eq("institution_id", institutionId)
      .order("name");

    if (error) {
      console.error("Error loading services:", error);
      setError(error.message);
      setServices([]);
    } else {
      setServices(data || []);
    }

    setLoadingServices(false);
  }

  // ============================================
  // INITIAL LOAD
  // ============================================

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (!supabase) {
      setError("Supabase is not configured. Please add your environment variables.");
      setLoadingInstitutions(false);
      return;
    }

    loadInstitutions();
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsInstitutionMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // ============================================
  // FORM INPUT
  // ============================================

  // Runs directly from the user's dropdown click, so this updates
  // services/form state immediately rather than via an effect.
  function handleInstitutionSelect(institutionId) {
    setSelectedInstitutionId(institutionId);
    setIsInstitutionMenuOpen(false);

    if (institutionId) {
      loadServices(institutionId);
    } else {
      setServices([]);
    }

    resetForm();
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  // ============================================
  // RESET FORM
  // ============================================

  function resetForm() {
    setForm({
      name: "",
      name_am: "",
      booking_link: "",
    });

    setEditingId(null);
  }

  // ============================================
  // SUBMIT ADD / UPDATE
  // ============================================

  async function handleSubmit(event) {
    event.preventDefault();

    if (!supabase) {
      setError("Supabase is not configured. Please add your environment variables.");
      return;
    }

    setError("");

    if (!selectedInstitutionId) {
      setError("Please select an institution first.");
      return;
    }

    if (!form.name.trim()) {
      setError("English service name is required.");
      return;
    }

    setSaving(true);

    try {
      const serviceData = {
        institution_id: selectedInstitutionId,
        name: form.name.trim(),
        name_am: form.name_am.trim() || null,
        booking_link: form.booking_link.trim() || null,
        updated_at: new Date().toISOString(),
      };

      // ========================================
      // UPDATE EXISTING SERVICE
      // ========================================

      if (editingId) {
        const { data, error } = await supabase
          .from("services")
          .update(serviceData)
          .eq("id", editingId)
          .select();

        if (error) {
          throw error;
        }

        if (data && data.length === 0) {
          throw new Error("Update failed! Zero rows were affected. Your Supabase RLS (Row Level Security) is blocking UPDATE actions on the services table.");
        }
      }

      // ========================================
      // ADD NEW SERVICE
      // ========================================

      else {
        const { error } = await supabase
          .from("services")
          .insert([
            {
              ...serviceData,
              created_at: new Date().toISOString(),
            },
          ]);

        if (error) {
          throw error;
        }
      }

      resetForm();

      await loadServices(selectedInstitutionId);

    } catch (error) {
      console.error("Error saving service:", error);

      setError(
        error.message || "Failed to save service."
      );
    } finally {
      setSaving(false);
    }
  }

  // ============================================
  // EDIT SERVICE
  // ============================================

  function handleEdit(service) {
    setEditingId(service.id);

    setForm({
      name: service.name || "",
      name_am: service.name_am || "",
      booking_link: service.booking_link || "",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  // ============================================
  // DELETE SERVICE
  // ============================================

  async function handleDelete(service) {
    if (!supabase) {
      setError("Supabase is not configured. Please add your environment variables.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete "${service.name}"?`
    );

    if (!confirmed) {
      return;
    }

    setError("");

    try {
      const { error } = await supabase
        .from("services")
        .delete()
        .eq("id", service.id);

      if (error) {
        throw error;
      }

      // Refresh service list
      await loadServices(selectedInstitutionId);

    } catch (error) {
      console.error("Error deleting service:", error);

      setError(
        error.message || "Failed to delete service."
      );
    }
  }

  // ============================================
  // GET SELECTED INSTITUTION
  // ============================================

  const selectedInstitution = institutions.find(
    (institution) =>
      institution.id === selectedInstitutionId
  );

  // ============================================
  // RENDER
  // ============================================

  if (!supabase) {
    return (
      <div className="manage-page">
        <div className="manage-header">
          <h2>Manage Services</h2>
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

      {/* ======================================
          HEADER
      ======================================= */}

      <div className="manage-header">
        <div>
          <h2>Manage Services</h2>

          <p>
            Add and manage the services offered by
            MESOB partner institutions in a clean,
            structured format.
          </p>
        </div>
      </div>


      {/* ======================================
          SELECT INSTITUTION
      ======================================= */}

      <div className="admin-form-card">

        <h3>Select Institution</h3>

        <div className="admin-form-group">

          <label htmlFor="institution">
            Institution
          </label>

          {loadingInstitutions ? (
            <p className="admin-form-text">
              Loading institutions...
            </p>
          ) : (
            <div className="admin-select-wrapper" ref={dropdownRef}>
              <button
                id="institution"
                type="button"
                className="admin-select-button"
                onClick={() =>
                  setIsInstitutionMenuOpen((previous) => !previous)
                }
              >
                <span>
                  {selectedInstitution
                    ? selectedInstitution.name
                    : "-- Select an Institution --"}
                </span>
                <span
                  className={`admin-select-arrow ${isInstitutionMenuOpen ? "open" : ""}`}
                >
                  ⌄
                </span>
              </button>

              {isInstitutionMenuOpen && (
                <div className="admin-select-dropdown">
                  <button
                    type="button"
                    className={`admin-select-option ${!selectedInstitutionId ? "active" : ""}`}
                    onClick={() => handleInstitutionSelect("")}
                  >
                    -- Select an Institution --
                  </button>

                  {institutions.map((institution) => (
                    <button
                      key={institution.id}
                      type="button"
                      className={`admin-select-option ${selectedInstitutionId === institution.id ? "active" : ""}`}
                      onClick={() => handleInstitutionSelect(institution.id)}
                    >
                      {institution.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

      </div>


      {/* ======================================
          ADD / EDIT SERVICE FORM
      ======================================= */}

      {selectedInstitutionId && (
        <div className="admin-form-card">

          <h3>
            {editingId
              ? "Edit Service"
              : "Add New Service"}
          </h3>

          <p>
            Institution:{" "}
            <strong>
              {selectedInstitution?.name}
            </strong>
          </p>

          <form onSubmit={handleSubmit}>

            {/* ENGLISH NAME */}

            <div className="admin-form-group">

              <label htmlFor="name">
                Service Name (English)
              </label>

              <input
                id="name"
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter English service name"
                required
              />

            </div>


            {/* AMHARIC NAME */}

            <div className="admin-form-group">

              <label htmlFor="name_am">
                Service Name (Amharic)
              </label>

              <input
                id="name_am"
                name="name_am"
                type="text"
                value={form.name_am}
                onChange={handleChange}
                placeholder="የአገልግሎቱን ስም በአማርኛ ያስገቡ"
              />

            </div>

            {/* BOOKING LINK */}

            <div className="admin-form-group">

              <label htmlFor="booking_link">
                Booking Link (Optional)
              </label>

              <input
                id="booking_link"
                name="booking_link"
                type="text"
                value={form.booking_link}
                onChange={handleChange}
                placeholder="https://example.com/book"
              />

            </div>


            {/* ERROR */}

            {error && (
              <p className="admin-error">
                {error}
              </p>
            )}


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
                    ? "Update Service"
                    : "Add Service"}
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
      )}


      {/* ======================================
          SERVICE LIST
      ======================================= */}

      {selectedInstitutionId && (
        <div className="admin-list-card">

          <h3>
            Services
            {selectedInstitution && (
              <>
                {" "}
                for {selectedInstitution.name}
              </>
            )}
          </h3>

          {loadingServices ? (
            <p>Loading services...</p>
          ) : services.length === 0 ? (
            <p>
              No services found for this institution.
            </p>
          ) : (

            <div className="admin-service-list">

              {services.map((service) => (

                <div
                  key={service.id}
                  className="admin-service-item"
                >

                  <div className="admin-service-info">

                    <h4>
                      {service.name}
                    </h4>

                    {service.name_am && (
                      <p>
                        {service.name_am}
                      </p>
                    )}

                  </div>


                  <div className="admin-item-actions">

                    <button
                      type="button"
                      className="admin-edit-button"
                      onClick={() =>
                        handleEdit(service)
                      }
                    >
                      Edit
                    </button>


                    <button
                      type="button"
                      className="admin-delete-button"
                      onClick={() =>
                        handleDelete(service)
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
      )}

    </div>
  );
}

export default ManageServices;