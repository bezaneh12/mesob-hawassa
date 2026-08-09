import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Institutions from "./components/Institutions";
import Services from "./components/Services";
import Footer from "./components/Footer";
import AboutPage from "./AboutPage";
import NewsPage from "./pages/NewsPage.jsx";
import AnnouncementsPage from "./pages/AnnouncementsPage";
import { ThemeProvider } from "./context/ThemeContext";
import { TranslationProvider } from "./context/TranslationContext";
import AdminLogin from "./admin/AdminLogin";
import AdminDashboard from "./admin/AdminDashboard";

function App() {
  return (
    <ThemeProvider>
      <TranslationProvider>
        <Router>
          <Navbar />
          <Routes>
            {/* Home page */}
            <Route
              path="/"
              element={
                <>
                  <Hero />
                  <Institutions />
                  <NewsPage limit={6} preview />
                </>
              }
            />

            {/* About Us page */}
            <Route path="/about" element={<AboutPage />} />

            {/* Services page */}
            <Route path="/services" element={<Services />} />

            {/* Institutions page */}
            <Route path="/institutions" element={<Institutions />} />

            {/* News and announcements */}
            <Route path="/news" element={<NewsPage />} />
            <Route path="/announcements" element={<AnnouncementsPage />} />

            {/* Admin routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
          </Routes>
          <Footer />
        </Router>
      </TranslationProvider>
    </ThemeProvider>
  );
}

export default App;
