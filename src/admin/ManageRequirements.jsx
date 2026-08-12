import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import "./Admin.css";

function ManageRequirements() {
  // ==========================================
  // STATE
  // ==========================================

  const [institutions, setInstitutions] = useState([]);
  const [services, setServices] = useState([]);
  const [requirements, setRequirements] = useState([]);

  const [selectedInstitutionId, setSelectedInstitutionId] =
    useState("");

  const [selectedServiceId, setSelectedServiceId] =
    useState("");

  const [form, setForm] = useState({
    requirement: "",
    requirement_am: "",
  });

  const [editingId, setEditingId] = useState(null);

  const [loadingInstitutions, setLoadingInstitutions] =
    useState(true);

  const [loadingServices, setLoadingServices] =
    useState(false);

  const [loadingRequirements, setLoadingRequirements] =
    useState(false);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  // ==========================================
  // LOAD INSTITUTIONS
  // ==========================================

  async function loadInstitutions() {
    setLoadingInstitutions(true);
    setError("");

    const { data, error } = await supabase
      .from("institutions")
      .select("id, name, name_am")
      .order("name", { ascending: true });

    if (error) {
      console.error(
        "Error loading institutions:",
        error
      );

      setError(error.message);
      setInstitutions([]);
    } else {
      setInstitutions(data || []);
    }

    setLoadingInstitutions(false);
  }

  // ==========================================
  // LOAD SERVICES
  // ==========================================

  async function loadServices(institutionId) {
    if (!institutionId) {
      setServices([]);
      return;
    }

    setLoadingServices(true);
    setError("");

    const { data, error } = await supabase
      .from("services")
      .select(
        "id, institution_id, name, name_am"
      )
      .eq(
        "institution_id",
        institutionId
      )
      .order("name", {
        ascending: true,
      });

    if (error) {
      console.error(
        "Error loading services:",
        error
      );

      setError(error.message);
      setServices([]);
    } else {
      setServices(data || []);
    }

    setLoadingServices(false);
  }

  // ==========================================
  // LOAD REQUIREMENTS
  // ==========================================

  async function loadRequirements(serviceId) {
    if (!serviceId) {
      setRequirements([]);
      return;
    }

    setLoadingRequirements(true);
    setError("");

    const { data, error } = await supabase
      .from("service_requirements")
      .select(
        "id, service_id, requirement, requirement_am, created_at"
      )
      .eq(
        "service_id",
        serviceId
      )
      .order("created_at", {
        ascending: true,
      });

    if (error) {
      console.error(
        "Error loading requirements:",
        error
      );

      setError(error.message);
      setRequirements([]);
    } else {
      setRequirements(data || []);
    }

    setLoadingRequirements(false);
  }

  // ==========================================
  // INITIAL LOAD
  // ==========================================

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadInstitutions();
  }, []);

  // ==========================================
  // WHEN INSTITUTION CHANGES (user selection, not an effect)
  // ==========================================

  function handleInstitutionSelect(institutionId) {
    setSelectedInstitutionId(institutionId);
    setSelectedServiceId("");
    setServices([]);
    setRequirements([]);
    resetForm();

    if (institutionId) {
      loadServices(institutionId);
    }
  }

  // ==========================================
  // WHEN SERVICE CHANGES (user selection, not an effect)
  // ==========================================

  function handleServiceSelect(serviceId) {
    setSelectedServiceId(serviceId);
    resetForm();

    if (serviceId) {
      loadRequirements(serviceId);
    } else {
      setRequirements([]);
    }
  }

  // ==========================================
  // HANDLE FORM INPUT
  // ==========================================

  function handleChange(event) {
    const {
      name,
      value,
    } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  // ==========================================
  // RESET FORM
  // ==========================================

  function resetForm() {
    setForm({
      requirement: "",
      requirement_am: "",
    });

    setEditingId(null);
  }

  // ==========================================
  // ADD / UPDATE REQUIREMENT
  // ==========================================

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");

    if (!selectedInstitutionId) {
      setError(
        "Please select an institution first."
      );
      return;
    }

    if (!selectedServiceId) {
      setError(
        "Please select a service first."
      );
      return;
    }

    if (!form.requirement.trim()) {
      setError(
        "English requirement is required."
      );
      return;
    }

    setSaving(true);

    const requirementData = {
      service_id: selectedServiceId,
      requirement: form.requirement.trim(),
      requirement_am: form.requirement_am,
    };

    try {
      // ========================================
      // UPDATE EXISTING REQUIREMENT
      // ========================================

      if (editingId) {
        const {
          error,
        } = await supabase
          .from(
            "service_requirements"
          )
          .update(
            requirementData
          )
          .eq(
            "id",
            editingId
          );

        if (error) {
          throw error;
        }
      }

      // ========================================
      // ADD NEW REQUIREMENT
      // ========================================

      else {
        const {
          error,
        } = await supabase
          .from(
            "service_requirements"
          )
          .insert([
            requirementData,
          ]);

        if (error) {
          throw error;
        }
      }

      // Clear form

      resetForm();

      // Reload requirements

      await loadRequirements(
        selectedServiceId
      );

    } catch (error) {
      console.error(
        "Error saving requirement:",
        error
      );

      setError(
        error.message ||
        "Failed to save requirement."
      );
    } finally {
      setSaving(false);
    }
  }

  // ==========================================
  // EDIT REQUIREMENT
  // ==========================================

  function handleEdit(requirement) {
    setEditingId(
      requirement.id
    );

    setForm({
      requirement:
        requirement.requirement ||
        "",

      requirement_am:
        requirement.requirement_am ||
        "",
    });
  }

  // ==========================================
  // DELETE REQUIREMENT
  // ==========================================

  async function handleDelete(
    requirement
  ) {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this requirement?"
      );

    if (!confirmed) {
      return;
    }

    setError("");

    try {
      const {
        error,
      } = await supabase
        .from(
          "service_requirements"
        )
        .delete()
        .eq(
          "id",
          requirement.id
        );

      if (error) {
        throw error;
      }

      await loadRequirements(
        selectedServiceId
      );

    } catch (error) {
      console.error(
        "Error deleting requirement:",
        error
      );

      setError(
        error.message ||
        "Failed to delete requirement."
      );
    }
  }

  // ==========================================
  // SELECTED INSTITUTION
  // ==========================================

  const selectedInstitution =
    institutions.find(
      (institution) =>
        institution.id ===
        selectedInstitutionId
    );

  // ==========================================
  // SELECTED SERVICE
  // ==========================================

  const selectedService =
    services.find(
      (service) =>
        service.id ===
        selectedServiceId
    );

  // ==========================================
  // RETURN UI
  // ==========================================

  return (
    <div className="manage-page">

      {/* ======================================
          HEADER
      ======================================= */}

      <div className="manage-header">

        <div>

          <h2>
            Manage Requirements
          </h2>

          <p>
            Add, edit, and delete requirements
            for each service.
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
          STEP 1: SELECT INSTITUTION
      ======================================= */}

      <div className="admin-form-card">

        <h3>
          1. Select Institution
        </h3>

        {loadingInstitutions ? (
          <p>
            Loading institutions...
          </p>
        ) : (

          <div className="admin-form-group">

            <label>
              Institution
            </label>

            <select
              value={
                selectedInstitutionId
              }
              onChange={(event) =>
                handleInstitutionSelect(
                  event.target.value
                )
              }
            >

              <option value="">
                -- Select Institution --
              </option>

              {institutions.map(
                (institution) => (

                  <option
                    key={
                      institution.id
                    }
                    value={
                      institution.id
                    }
                  >
                    {institution.name}
                  </option>

                )
              )}

            </select>

          </div>

        )}

      </div>


      {/* ======================================
          STEP 2: SELECT SERVICE
      ======================================= */}

      {selectedInstitutionId && (

        <div className="admin-form-card">

          <h3>
            2. Select Service
          </h3>

          <p>
            Institution:{" "}

            <strong>
              {
                selectedInstitution?.name
              }
            </strong>
          </p>


          {loadingServices ? (

            <p>
              Loading services...
            </p>

          ) : (

            <div className="admin-form-group">

              <label>
                Service
              </label>

              <select
                value={
                  selectedServiceId
                }
                onChange={(event) =>
                  handleServiceSelect(
                    event.target.value
                  )
                }
              >

                <option value="">
                  -- Select Service --
                </option>

                {services.map(
                  (service) => (

                    <option
                      key={
                        service.id
                      }
                      value={
                        service.id
                      }
                    >
                      {service.name}
                    </option>

                  )
                )}

              </select>

            </div>

          )}

        </div>

      )}


      {/* ======================================
          STEP 3: ADD / EDIT REQUIREMENT
      ======================================= */}

      {selectedServiceId && (

        <div className="admin-form-card">

          <h3>
            {editingId
              ? "Edit Requirement"
              : "3. Add Requirement"}
          </h3>


          <p>
            Service:{" "}

            <strong>
              {
                selectedService?.name
              }
            </strong>
          </p>


          <form
            onSubmit={
              handleSubmit
            }
          >

            {/* ENGLISH */}

            <div className="admin-form-group">

              <label>
                Requirement (English)
              </label>

              <textarea
                name="requirement"
                value={
                  form.requirement
                }
                onChange={
                  handleChange
                }
                placeholder="Enter the requirement in English"
                rows="3"
                required
              />

            </div>


            {/* AMHARIC */}

            <div className="admin-form-group">

              <label>
                Requirement (Amharic)
              </label>

              <textarea
                name="requirement_am"
                value={
                  form.requirement_am
                }
                onChange={
                  handleChange
                }
                placeholder="መስፈርቱን በአማርኛ ያስገቡ"
                rows="3"
              />

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
                    ? "Update Requirement"
                    : "Add Requirement"}
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

      )}


      {/* ======================================
          STEP 4: REQUIREMENT LIST
      ======================================= */}

      {selectedServiceId && (

        <div className="admin-list-card">

          <h3>
            Requirements
          </h3>


          {loadingRequirements ? (

            <p>
              Loading requirements...
            </p>

          ) : requirements.length === 0 ? (

            <p>
              No requirements found
              for this service.
            </p>

          ) : (

            <div className="admin-service-list">

              {requirements.map(
                (
                  requirement,
                  index
                ) => (

                  <div
                    key={
                      requirement.id
                    }
                    className="admin-service-item"
                  >

                    <div className="admin-service-info">

                      <h4>
                        {index + 1}.{" "}
                        {
                          requirement.requirement
                        }
                      </h4>

                      {requirement.requirement_am && (

                        <p>
                          {
                            requirement.requirement_am
                          }
                        </p>

                      )}

                    </div>


                    <div className="admin-item-actions">

                      <button
                        type="button"
                        className="admin-edit-button"
                        onClick={() =>
                          handleEdit(
                            requirement
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
                            requirement
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

      )}

    </div>
  );
}

export default ManageRequirements;