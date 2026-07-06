import { useState, useEffect } from "react";

const API = "http://localhost:8000/api";

const ACTION_COLORS = {
  remember: { bg: "#eff6ff", text: "#1d4ed8" },
  recall:   { bg: "#f0fdf4", text: "#166534" },
  improve:  { bg: "#fefce8", text: "#854d0e" },
  forget:   { bg: "#fef2f2", text: "#991b1b" },
  qa:       { bg: "#f5f3ff", text: "#6d28d9" },
  register: { bg: "#f3f4f6", text: "#374151" },
};

export default function AuditLog({ patient }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchLog = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/audit?limit=100`);
      const data = await res.json();
      const filtered = data.entries.filter(e => e.patient_id === patient.patient_id);
      setEntries(filtered);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchLog(); }, [patient.patient_id]);

  return (
    <div style={{ flex: 1, padding: 32, overflowY: "auto" }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "#111", marginBottom: 4 }}>Audit log</h2>
          <p style={{ fontSize: 14, color: "#6b7280" }}>All memory operations for {patient.display_name}</p>
        </div>
        <button onClick={fetchLog} style={{ marginLeft: "auto", padding: "7px 16px", border: "1px solid #d1d5db", borderRadius: 8, background: "#fff", cursor: "pointer", fontSize: 13 }}>
          ↻ Refresh
        </button>
      </div>

      {loading && <div style={{ color: "#9ca3af", fontSize: 14 }}>Loading...</div>}

      {!loading && entries.length === 0 && (
        <div style={{ color: "#9ca3af", fontSize: 14 }}>No audit entries for this patient yet.</div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {entries.map((e, i) => {
          const colors = ACTION_COLORS[e.action] || ACTION_COLORS.register;
          return (
            <div key={i} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "12px 16px", display: "flex", gap: 14, alignItems: "flex-start" }}>
              <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 4, background: colors.bg, color: colors.text, whiteSpace: "nowrap" }}>
                {e.action}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                {e.detail && Object.keys(e.detail).length > 0 && (
                  <div style={{ fontSize: 13, color: "#374151", marginBottom: 2 }}>
                    {e.detail.question && <span>Q: {e.detail.question}</span>}
                    {e.detail.source_type && <span>Source: {e.detail.source_type}</span>}
                    {e.detail.type && <span>{e.detail.type}</span>}
                    {e.detail.reason && <span>{e.detail.reason}</span>}
                  </div>
                )}
                {e.detail?.pii_findings_count !== undefined && (
                  <span style={{ fontSize: 12, color: "#9ca3af" }}>PII redacted: {e.detail.pii_findings_count}</span>
                )}
              </div>
              <span style={{ fontSize: 12, color: "#9ca3af", whiteSpace: "nowrap" }}>
                {new Date(e.ts).toLocaleTimeString()}
              </span>
            </div>
          );
        })}
      </div>

      {/* GDPR forget button */}
      <div style={{ marginTop: 32, padding: 20, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10 }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: "#991b1b", marginBottom: 6 }}>⚠️ GDPR — Right to erasure</div>
        <p style={{ fontSize: 13, color: "#7f1d1d", marginBottom: 12 }}>
          Permanently delete all Cognee memory for this patient. This cannot be undone.
        </p>
        <button onClick={async () => {
          if (!confirm(`Delete ALL memory for ${patient.display_name}? This is permanent.`)) return;
          await fetch(`${API}/patients/${patient.patient_id}/memory`, { method: "DELETE" });
          fetchLog();
        }} style={{ padding: "8px 20px", background: "#dc2626", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 500 }}>
          Erase all memory
        </button>
      </div>
    </div>
  );
}
