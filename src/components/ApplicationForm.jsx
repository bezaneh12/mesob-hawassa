import { useState } from "react";
import { apiEndpoints } from "../config/api";

function ApplicationForm({ vacancyId }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    cv: null,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData({
      ...formData,
      [name]: files ? files[0] : value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const data = new FormData();
    data.append("vacancyId", vacancyId);
    data.append("name", formData.name);
    data.append("email", formData.email);
    data.append("phone", formData.phone);
    data.append("cv", formData.cv);

    fetch(apiEndpoints.applications, {
      method: "POST",
      body: data,
    })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then(() => {
        setMessage({ type: "success", text: "Application submitted successfully!" });
        setFormData({ name: "", email: "", phone: "", cv: null });
      })
      .catch(err => {
        console.error("Failed to submit application:", err);
        setMessage({ type: "error", text: `Error: ${err.message}` });
      })
      .finally(() => setLoading(false));
  };

  return (
    <form onSubmit={handleSubmit} className="application-form">
      <h3>Apply for Vacancy</h3>
      {message && <p className={`message ${message.type}`}>{message.text}</p>}
      <input type="text" name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} required />
      <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
      <input type="tel" name="phone" placeholder="Phone Number" value={formData.phone} onChange={handleChange} required />
      <input type="file" name="cv" accept=".pdf,.doc,.docx" onChange={handleChange} required />
      <button type="submit" disabled={loading}>{loading ? "Submitting..." : "Submit Application"}</button>
    </form>
  );
}

export default ApplicationForm;

