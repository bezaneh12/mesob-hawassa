// src/components/Modal.jsx


function Modal({ show, onClose, institution }) {
  if (!show) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>{institution.name}</h3>
        <ul>
          {institution.services.map((srv, idx) => (
            <li key={idx}>
              <strong>{srv.title}</strong> — Requirement: {srv.requirement}
            </li>
          ))}
        </ul>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

export default Modal;
