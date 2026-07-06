import { useState } from "react";

const API = "http://localhost:8000/api";

const SOURCE_TYPES = ["lab_report", "note", "prescription", "symptom", "discharge"];

export default function IngestPanel({ patient }) {
  const [mode, setMode] = useState("file"); // "file" | "text"
  const [sourceType, setSourceType] = useState("note");
  const [file, setFile] = useState(null);
  const [text, setText] = useState("");
  const [isUpdate, setIsUpdate] = useState(false);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    setStatus(null);

    try {
      let res;
      if (mode === "file" && file) {
        const form = new FormData();
        form.append("patient_id", patient.patient_id);
        form.append("source_type", sourceType);
        form.append("is_update", isUpdate);
        form.append("file", file);
        res = await fetch(`${API}/ingest/document`, { method: "POST", body: form });
      } else {
        res = await fetch(`${API}/ingest/text`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ patient_id: patient.patient_id, source_type: sourceType, content: text, is_update: isUpdate }),
        });
      }
      const data = await res.json();
      if (res.ok) {
        setStatus({ ok: true, msg: `✅ Ingested successfully. PII entities redacted: ${data.pii_entities_redacted}` });
        setFile(null); setText("");
      } else {
        setStatus({ ok: false, msg: `❌ ${data.detail || "Something went wrong."}` });
      }
    } catch {
      setStatus({ ok: false, msg: "❌ Network error." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ flex: 1, padding: 32, overflowY: "auto" }}>
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 6, color: "#111" }}>Ingest records</h2>
      <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 24 }}>
        Add medical documents for <strong>{patient.display_name}</strong>. PII is automatically redacted before storage.
      </p>

      {/* Mode toggle */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {["file", "text"].map(m => (
          <button key={m} onClick={() => setMode(m)}
            style={{ padding: "7px 18px", borderRadius: 8, border: "1px solid", cursor: "pointer", fontSize: 13, fontWeight: 500,
              background: mode === m ? "#2563eb" : "#fff", color: mode === m ? "#fff" : "#374151",
              borderColor: mode === m ? "#2563eb" : "#d1d5db" }}>
            {m === "file" ? "📎 Upload file" : "✏️ Paste text"}
          </button>
        ))}
      </div>

      {/* Source type */}
      <label style={{ fontSize: 13, fontWeight: 500, color: "#374151", display: "block", marginBottom: 6 }}>Source type</label>
      <select value={sourceType} onChange={e => setSourceType(e.target.value)}
        style={{ padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 13, marginBottom: 20, display: "block", minWidth: 200 }}>
        {SOURCE_TYPES.map(t => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
      </select>

      {/* Input */}
      {mode === "file" ? (
        <div style={{ border: "2px dashed #d1d5db", borderRadius: 10, padding: 32, textAlign: "center", marginBottom: 20, background: "#fafafa" }}>
          <input type="file" accept=".pdf,.txt" id="file-upload" style={{ display: "none" }} onChange={e => setFile(e.target.files[0])} />
          <label htmlFor="file-upload" style={{ cursor: "pointer", fontSize: 14, color: "#2563eb" }}>
            {file ? `📄 ${file.name}` : "Click to select a PDF or TXT file"}
          </label>
        </div>
      ) : (
        <textarea value={text} onChange={e => setText(e.target.value)}
          placeholder="Paste doctor notes, symptom descriptions, prescription details..."
          style={{ width: "100%", height: 180, padding: "12px 14px", border: "1px solid #d1d5db", borderRadius: 10, fontSize: 14, resize: "vertical", marginBottom: 20, boxSizing: "border-box" }} />
      )}

      {/* Update toggle */}
      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#374151", marginBottom: 24, cursor: "pointer" }}>
        <input type="checkbox" checked={isUpdate} onChange={e => setIsUpdate(e.target.checked)} />
        This is an update to existing information (uses <code>improve()</code> instead of <code>remember()</code>)
      </label>

      <button onClick={submit} disabled={loading || (mode === "file" ? !file : !text.trim())}
        style={{ padding: "10px 28px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: "pointer",
          opacity: loading || (mode === "file" ? !file : !text.trim()) ? 0.5 : 1 }}>
        {loading ? "Ingesting..." : "Ingest into Cognee"}
      </button>

      {status && (
        <div style={{ marginTop: 20, padding: "12px 16px", borderRadius: 8, fontSize: 14,
          background: status.ok ? "#f0fdf4" : "#fef2f2",
          color: status.ok ? "#166534" : "#991b1b",
          border: `1px solid ${status.ok ? "#bbf7d0" : "#fecaca"}` }}>
          {status.msg}
        </div>
      )}
    </div>
  );
}
