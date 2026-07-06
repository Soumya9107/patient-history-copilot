import { useState, useEffect } from "react";

const API = "http://localhost:8000/api";

export default function PatientSidebar({ selected, onSelect }) {
  const [patients, setPatients] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ patient_id: "", display_name: "" });
  const [loading, setLoading] = useState(false);

  const fetchPatients = async () => {
    const res = await fetch(`${API}/patients/`);
    const data = await res.json();
    setPatients(data.patients || []);
  };

  useEffect(() => { fetchPatients(); }, []);

  const createPatient = async () => {
    if (!form.patient_id || !form.display_name) return;
    setLoading(true);
    await fetch(`${API}/patients/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ patient_id: "", display_name: "" });
    setShowForm(false);
    setLoading(false);
    fetchPatients();
  };

  return (
    <div style={{ width: 220, background: "#fff", borderRight: "1px solid #e5e7eb", display: "flex", flexDirection: "column", padding: "16px 0" }}>
      <div style={{ padding: "0 16px 12px", fontWeight: 600, fontSize: 13, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        Patients
      </div>

      {patients.map(p => (
        <button key={p.patient_id} onClick={() => onSelect(p)}
          style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", padding: "10px 16px", border: "none", background: selected?.patient_id === p.patient_id ? "#eff6ff" : "transparent",
            borderLeft: selected?.patient_id === p.patient_id ? "3px solid #2563eb" : "3px solid transparent",
            cursor: "pointer", width: "100%" }}>
          <span style={{ fontSize: 14, fontWeight: 500, color: "#111" }}>{p.display_name}</span>
          <span style={{ fontSize: 12, color: "#9ca3af" }}>{p.patient_id}</span>
        </button>
      ))}

      {showForm ? (
        <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
          <input placeholder="Patient ID (e.g. P-004)" value={form.patient_id}
            onChange={e => setForm(f => ({ ...f, patient_id: e.target.value }))}
            style={{ padding: "6px 10px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13 }} />
          <input placeholder="Display name (e.g. P-004)" value={form.display_name}
            onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))}
            style={{ padding: "6px 10px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13 }} />
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={createPatient} disabled={loading}
              style={{ flex: 1, padding: "6px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13 }}>
              {loading ? "..." : "Add"}
            </button>
            <button onClick={() => setShowForm(false)}
              style={{ padding: "6px 10px", background: "#f3f4f6", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13 }}>
              ✕
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowForm(true)}
          style={{ margin: "8px 16px 0", padding: "8px", background: "#f3f4f6", border: "1px dashed #d1d5db", borderRadius: 6, cursor: "pointer", fontSize: 13, color: "#6b7280" }}>
          + New patient
        </button>
      )}
    </div>
  );
}
