import { useState } from "react";
import PatientSidebar from "./components/PatientSidebar";
import ChatInterface from "./components/ChatInterface";
import IngestPanel from "./components/IngestPanel";
import Briefing from "./components/Briefing";
import AuditLog from "./components/AuditLog";

const TABS = ["Q&A", "Ingest", "Briefing", "Audit"];

export default function App() {
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [activeTab, setActiveTab] = useState("Q&A");

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "system-ui, sans-serif", background: "#f8f9fa" }}>
      {/* Sidebar */}
      <PatientSidebar selected={selectedPatient} onSelect={setSelectedPatient} />

      {/* Main content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Top bar */}
        <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "0 24px", display: "flex", alignItems: "center", gap: 24, height: 56 }}>
          <span style={{ fontWeight: 600, fontSize: 16, color: "#111" }}>
            🏥 Patient History Copilot
          </span>
          {selectedPatient && (
            <span style={{ fontSize: 13, color: "#6b7280", background: "#f3f4f6", padding: "3px 10px", borderRadius: 6 }}>
              {selectedPatient.display_name} · {selectedPatient.patient_id}
            </span>
          )}
          <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
            {TABS.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                style={{ padding: "6px 14px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500,
                  background: activeTab === tab ? "#2563eb" : "transparent",
                  color: activeTab === tab ? "#fff" : "#374151" }}>
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Content area */}
        <div style={{ flex: 1, overflow: "hidden", display: "flex" }}>
          {!selectedPatient ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", flexDirection: "column", gap: 8 }}>
              <span style={{ fontSize: 32 }}>🩺</span>
              <span style={{ fontSize: 15 }}>Select a patient from the sidebar to begin</span>
            </div>
          ) : (
            <>
              {activeTab === "Q&A"      && <ChatInterface patient={selectedPatient} />}
              {activeTab === "Ingest"   && <IngestPanel patient={selectedPatient} />}
              {activeTab === "Briefing" && <Briefing patient={selectedPatient} />}
              {activeTab === "Audit"    && <AuditLog patient={selectedPatient} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
