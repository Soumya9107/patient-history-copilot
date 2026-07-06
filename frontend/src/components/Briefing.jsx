import { useState } from "react";

const API = "http://localhost:8000/api";

export default function Briefing({ patient }) {
  const [briefing, setBriefing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchBriefing = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/recall/briefing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patient_id: patient.patient_id }),
      });
      const data = await res.json();
      if (res.ok) setBriefing(data.briefing);
      else setError(data.detail || "Failed to generate briefing.");
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ flex: 1, padding: 32, overflowY: "auto" }}>
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 6, color: "#111" }}>Pre-visit briefing</h2>
      <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 24 }}>
        Generate a concise summary of <strong>{patient.display_name}</strong>'s history before an appointment.
        Cognee recalls the most relevant records; Claude synthesises them into a structured briefing.
      </p>

      <button onClick={fetchBriefing} disabled={loading}
        style={{ padding: "10px 28px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: "pointer", opacity: loading ? 0.6 : 1 }}>
        {loading ? "Generating briefing..." : "Generate briefing"}
      </button>

      {error && (
        <div style={{ marginTop: 20, padding: "12px 16px", background: "#fef2f2", color: "#991b1b", borderRadius: 8, border: "1px solid #fecaca", fontSize: 14 }}>
          ❌ {error}
        </div>
      )}

      {briefing && (
        <div style={{ marginTop: 24, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <span style={{ fontSize: 20 }}>📋</span>
            <span style={{ fontWeight: 600, fontSize: 15 }}>{patient.display_name} — Pre-visit summary</span>
            <span style={{ marginLeft: "auto", fontSize: 12, color: "#9ca3af" }}>{new Date().toLocaleDateString()}</span>
          </div>
          <div style={{ fontSize: 14, lineHeight: 1.8, color: "#374151", whiteSpace: "pre-wrap" }}>
            {briefing}
          </div>
          <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid #f3f4f6", fontSize: 12, color: "#9ca3af" }}>
            Generated from Cognee memory · Grounded by Claude · Not a substitute for clinical judgement
          </div>
        </div>
      )}
    </div>
  );
}
