import { useState, useRef, useEffect } from "react";

const API = "http://localhost:8000/api";

const EXAMPLE_QUESTIONS = [
  "What medications is this patient on?",
  "Any reported symptoms?",
  "Recent diagnoses?",
  "Known allergies?",
  "Latest lab results?",
];

export default function ChatInterface({ patient }) {
  const [messages, setMessages] = useState([
    { role: "assistant", text: `Ready to search records for ${patient.display_name}. Ingest some data first, then ask anything!` }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    setMessages([{ role: "assistant", text: `Ready to search records for ${patient.display_name}. Ingest some data first, then ask anything!` }]);
  }, [patient.patient_id]);

  const send = async (question) => {
    const q = question || input.trim();
    if (!q || loading) return;
    setInput("");
    setMessages(m => [...m, { role: "user", text: q }]);
    setLoading(true);

    try {
      const res = await fetch(`${API}/recall/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patient_id: patient.patient_id, question: q }),
      });
      const data = await res.json();
      setMessages(m => [...m, { role: "assistant", text: data.answer, sources: data.sources_used }]);
    } catch {
      setMessages(m => [...m, { role: "assistant", text: "Error connecting to the server.", error: true }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

      <div style={{ background: "#eff6ff", borderBottom: "1px solid #bfdbfe", padding: "8px 24px", fontSize: 12, color: "#1d4ed8" }}>
        Powered by Cognee memory — results are raw recalled chunks from the knowledge graph
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{
              maxWidth: "80%",
              padding: "12px 16px",
              borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
              background: m.role === "user" ? "#2563eb" : "#fff",
              color: m.role === "user" ? "#fff" : "#111",
              border: m.role === "assistant" ? "1px solid #e5e7eb" : "none",
              fontSize: 14,
              lineHeight: 1.7,
              whiteSpace: "pre-wrap",
            }}>
              {m.text}
              {m.sources !== undefined && (
                <div style={{ marginTop: 8, fontSize: 11, color: m.role === "user" ? "rgba(255,255,255,0.7)" : "#9ca3af" }}>
                  {m.sources} memory chunk{m.sources !== 1 ? "s" : ""} recalled from Cognee
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: "flex" }}>
            <div style={{ padding: "12px 16px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: "16px 16px 16px 4px", fontSize: 14, color: "#9ca3af" }}>
              Searching Cognee memory graph...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {messages.length <= 1 && (
        <div style={{ padding: "0 24px 12px", display: "flex", flexWrap: "wrap", gap: 8 }}>
          {EXAMPLE_QUESTIONS.map(q => (
            <button key={q} onClick={() => send(q)}
              style={{ padding: "6px 12px", background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", borderRadius: 20, fontSize: 12, cursor: "pointer" }}>
              {q}
            </button>
          ))}
        </div>
      )}

      <div style={{ padding: "16px 24px", background: "#fff", borderTop: "1px solid #e5e7eb", display: "flex", gap: 10 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
          placeholder="Search patient memory... (e.g. 'What medications?')"
          style={{ flex: 1, padding: "10px 14px", border: "1px solid #d1d5db", borderRadius: 10, fontSize: 14, outline: "none" }}
        />
        <button
          onClick={() => send()}
          disabled={loading || !input.trim()}
          style={{ padding: "10px 20px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontSize: 14, fontWeight: 500, opacity: loading || !input.trim() ? 0.5 : 1 }}>
          Search
        </button>
      </div>
    </div>
  );
}
