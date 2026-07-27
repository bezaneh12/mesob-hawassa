import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import ManageInstitutions from "./ManageInstitutions";
import ManageServices from "./ManageServices";
import ManageRequirements from "./ManageRequirements";
import ManageNews from "./ManageNews";
import "./Admin.css";

function AdminDashboard() {
  const navigate = useNavigate();

  const [adminEmail, setAdminEmail] = useState("");
  const [activePage, setActivePage] = useState("dashboard");

  useEffect(() => {
    if (!supabase) {
      return;
    }

    async function checkUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/admin/login");
        return;
      }

      setAdminEmail(user.email);
    }

    checkUser();
  }, [navigate]);

  async function handleLogout() {
    if (!supabase) {
      navigate("/admin/login");
      return;
    }

    await supabase.auth.signOut();
    navigate("/admin/login");
  }

  if (!supabase) {
    return (
      <div className="admin-dashboard">

        <div className="admin-login-card">

          <h2>
            Admin unavailable
          </h2>

          <p>
            Supabase is not configured yet.
            Add your VITE_SUPABASE_URL and
            VITE_SUPABASE_ANON_KEY values
            to enable the admin pages.
          </p>

        </div>

      </div>
    );
  }

  return (
    <div className="admin-dashboard">

      {/* =================================
          ADMIN HEADER
      ================================== */}

      <header className="admin-header">

        <div>

          <h1>
            MESOB Admin Dashboard
          </h1>

          <p>
            Welcome, {adminEmail}
          </p>

        </div>


        <button
          type="button"
          className="admin-logout-button"
          onClick={handleLogout}
        >
          Logout
        </button>

      </header>


      {/* =================================
          ADMIN LAYOUT
      ================================== */}

      <div className="admin-layout">


        {/* =================================
            SIDEBAR
        ================================== */}

        <aside className="admin-sidebar">


          {/* DASHBOARD */}

          <button
            className={
              activePage === "dashboard"
                ? "active"
                : ""
            }
            onClick={() =>
              setActivePage("dashboard")
            }
          >
            Dashboard
          </button>


          {/* INSTITUTIONS */}

          <button
            className={
              activePage === "institutions"
                ? "active"
                : ""
            }
            onClick={() =>
              setActivePage("institutions")
            }
          >
            Institutions
          </button>


          {/* SERVICES */}

          <button
            className={
              activePage === "services"
                ? "active"
                : ""
            }
            onClick={() =>
              setActivePage("services")
            }
          >
            Services
          </button>


          {/* REQUIREMENTS */}

          <button
            className={
              activePage === "requirements"
                ? "active"
                : ""
            }
            onClick={() =>
              setActivePage("requirements")
            }
          >
            Requirements
          </button>


          {/* NEWS */}

          <button
            className={
              activePage === "news"
                ? "active"
                : ""
            }
            onClick={() =>
              setActivePage("news")
            }
          >
            News
          </button>


          {/* ANNOUNCEMENTS */}

          <button
            className={
              activePage === "announcements"
                ? "active"
                : ""
            }
            onClick={() =>
              setActivePage("announcements")
            }
          >
            Announcements
          </button>

        </aside>


        {/* =================================
            MAIN CONTENT
        ================================== */}

        <main className="admin-main">


          {/* =================================
              DASHBOARD
          ================================== */}

          {activePage === "dashboard" && (

            <div>

              <h2>
                Dashboard
              </h2>

              <p>
                Welcome to the MESOB Hawassa
                administration panel.
              </p>


              <div className="admin-cards">


                {/* INSTITUTIONS CARD */}

                <div className="admin-card">

                  <h3>
                    Institutions
                  </h3>

                  <p>
                    Manage partner institutions.
                  </p>

                  <button
                    onClick={() =>
                      setActivePage(
                        "institutions"
                      )
                    }
                  >
                    Manage Institutions
                  </button>

                </div>


                {/* SERVICES CARD */}

                <div className="admin-card">

                  <h3>
                    Services
                  </h3>

                  <p>
                    Manage services and
                    requirements.
                  </p>

                  <button
                    onClick={() =>
                      setActivePage(
                        "services"
                      )
                    }
                  >
                    Manage Services
                  </button>

                </div>


                {/* REQUIREMENTS CARD */}

                <div className="admin-card">

                  <h3>
                    Requirements
                  </h3>

                  <p>
                    Manage requirements
                    for each service.
                  </p>

                  <button
                    onClick={() =>
                      setActivePage(
                        "requirements"
                      )
                    }
                  >
                    Manage Requirements
                  </button>

                </div>


                {/* NEWS CARD */}

                <div className="admin-card">

                  <h3>
                    News
                  </h3>

                  <p>
                    Manage news posts.
                  </p>

                  <button
                    onClick={() =>
                      setActivePage(
                        "news"
                      )
                    }
                  >
                    Manage News
                  </button>

                </div>


                {/* ANNOUNCEMENTS CARD */}

                <div className="admin-card">

                  <h3>
                    Announcements
                  </h3>

                  <p>
                    Manage vacancies
                    and announcements.
                  </p>

                  <button
                    onClick={() =>
                      setActivePage(
                        "announcements"
                      )
                    }
                  >
                    Manage Announcements
                  </button>

                </div>

              </div>

            </div>

          )}


          {/* =================================
              INSTITUTIONS MANAGEMENT
          ================================== */}

          {activePage === "institutions" && (

            <ManageInstitutions />

          )}


          {/* =================================
              SERVICES MANAGEMENT
          ================================== */}

          {activePage === "services" && (

            <ManageServices />

          )}


          {/* =================================
              REQUIREMENTS MANAGEMENT
          ================================== */}

          {activePage === "requirements" && (

            <ManageRequirements />

          )}


          {/* =================================
              NEWS MANAGEMENT
          ================================== */}

          {activePage === "news" && (

            <ManageNews />

          )}


          {/* =================================
              ANNOUNCEMENTS MANAGEMENT
          ================================== */}

          {activePage === "announcements" && (

            <div>

              <h2>
                Manage Announcements
              </h2>

              <p>
                Announcement management
                will be added next.
              </p>

            </div>

          )}

        </main>

      </div>

    </div>
  );
}

export default AdminDashboard;