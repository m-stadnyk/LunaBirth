import { useState } from "react";
import { P } from "../../theme/index.js";
import { TaskCard } from "../../components/TaskCard.jsx";
import { TaskModal } from "../../components/TaskModal.jsx";
import { groupTasksWithAI } from "../../utils/aiGrouping.js";
import { storage } from "../../utils/storage.js";

export function TodoList({ tasks, addTask, toggleDone, removeTask, updateTask }) {
  const [newText, setNewText] = useState("");
  const [newPriority, setNewPriority] = useState("medium");
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeTask, setActiveTask] = useState(null);
  const [focusIds, setFocusIds] = useState(null);
  const [focusRationale, setFocusRationale] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  const handleAdd = async () => {
    if (!newText.trim()) return;
    await addTask({ text: newText, priority: newPriority });
    setNewText("");
    setNewPriority("medium");
    setShowAddForm(false);
  };

  const handleFocusView = async () => {
    setAiError("");
    const apiKeyStored = await storage.get("lc_ak");
    const apiKey = apiKeyStored?.value?.trim() || null;

    setAiLoading(true);
    try {
      const result = await groupTasksWithAI({
        tasks,
        apiKey,
        fallback: !apiKey,
      });
      setFocusIds(result.focusIds);
      setFocusRationale(result.rationale);
    } catch (e) {
      setAiError("Could not load focus view. Check your API key in Settings.");
    } finally {
      setAiLoading(false);
    }
  };

  const displayedTasks = focusIds
    ? tasks.filter((t) => focusIds.includes(t.id))
    : tasks;

  const PRIORITY_OPTS = [
    { id: "high", label: "High" },
    { id: "medium", label: "Medium" },
    { id: "low", label: "Low" },
  ];

  return (
    <>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{
          fontFamily: "'Cormorant Garamond',serif", fontSize: 18, color: P.text,
        }}>
          ✅ Tasks before baby arrives
        </span>
        <div style={{ display: "flex", gap: 6 }}>
          {focusIds ? (
            <button
              onClick={() => { setFocusIds(null); setFocusRationale(""); }}
              style={{
                padding: "5px 10px", borderRadius: 14, border: `1px solid ${P.border}`,
                background: "none", color: P.muted,
                fontFamily: "'DM Sans',sans-serif", fontSize: 11, cursor: "pointer",
              }}
            >
              Show all
            </button>
          ) : (
            <button
              onClick={handleFocusView}
              disabled={aiLoading || tasks.filter((t) => !t.done).length === 0}
              style={{
                padding: "5px 10px", borderRadius: 14, border: "none",
                background: aiLoading ? P.border : `linear-gradient(135deg,${P.sage},${P.sageDark})`,
                color: "#fff", fontFamily: "'DM Sans',sans-serif", fontSize: 11,
                fontWeight: 500, cursor: aiLoading ? "default" : "pointer",
              }}
            >
              {aiLoading ? "…" : "✨ Focus"}
            </button>
          )}
        </div>
      </div>

      {/* AI error */}
      {aiError && (
        <div style={{
          background: P.roseLight, border: `1px solid ${P.rose}50`,
          borderRadius: 10, padding: "9px 12px", marginBottom: 10,
          fontSize: 12, color: P.roseDark, fontFamily: "'DM Sans',sans-serif",
        }}>
          {aiError}
        </div>
      )}

      {/* Focus rationale */}
      {focusIds && focusRationale && (
        <div style={{
          background: P.sageLight, border: `1px solid ${P.sage}40`,
          borderRadius: 12, padding: "10px 12px", marginBottom: 10,
          display: "flex", alignItems: "flex-start", gap: 8,
        }}>
          <span style={{ fontSize: 16 }}>✨</span>
          <p style={{
            margin: 0, fontSize: 12, color: P.sageDark, lineHeight: 1.5,
            fontFamily: "'DM Sans',sans-serif",
          }}>
            {focusRationale}
          </p>
        </div>
      )}

      {/* Task list */}
      {displayedTasks.length === 0 && !showAddForm && (
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <p style={{
            fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic",
            fontSize: 16, color: P.muted, margin: 0,
          }}>
            {focusIds ? "No matching tasks." : "No tasks yet — add your first one!"}
          </p>
        </div>
      )}

      {displayedTasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          onTap={() => setActiveTask(task)}
          onToggleDone={toggleDone}
        />
      ))}

      {/* Add task form / button */}
      {!focusIds && (
        <div style={{ marginTop: 6 }}>
          {showAddForm ? (
            <div style={{
              background: P.card, borderRadius: 14, padding: 14,
              border: `1.5px solid ${P.border}`,
            }}>
              <input
                autoFocus
                placeholder="What needs to be done?"
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") setShowAddForm(false); }}
                style={{
                  width: "100%", padding: "10px 12px", borderRadius: 10,
                  border: `1.5px solid ${P.border}`, background: P.cream,
                  fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: P.text,
                  marginBottom: 10, display: "block",
                }}
              />
              <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                {PRIORITY_OPTS.map(({ id, label }) => {
                  const active = newPriority === id;
                  const colors = { high: P.roseDark, medium: P.amber, low: P.muted };
                  return (
                    <button
                      key={id}
                      onClick={() => setNewPriority(id)}
                      style={{
                        flex: 1, padding: "6px 4px", borderRadius: 8,
                        border: `1.5px solid ${active ? colors[id] : P.border}`,
                        background: active ? "rgba(0,0,0,0.05)" : P.card,
                        color: active ? colors[id] : P.muted,
                        fontFamily: "'DM Sans',sans-serif", fontSize: 12,
                        fontWeight: active ? 600 : 400, cursor: "pointer",
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={handleAdd}
                  style={{
                    flex: 1, padding: 10, borderRadius: 10, border: "none",
                    background: P.rose, color: "#fff",
                    fontFamily: "'DM Sans',sans-serif", fontSize: 14, fontWeight: 500, cursor: "pointer",
                  }}
                >
                  Add Task
                </button>
                <button
                  onClick={() => { setShowAddForm(false); setNewText(""); setNewPriority("medium"); }}
                  style={{
                    padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${P.border}`,
                    background: "none", color: P.muted,
                    fontFamily: "'DM Sans',sans-serif", fontSize: 14, cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              style={{
                width: "100%", padding: 12, borderRadius: 14,
                border: `1.5px dashed ${P.border}`, background: "none",
                color: P.muted, fontFamily: "'DM Sans',sans-serif", fontSize: 14, cursor: "pointer",
              }}
            >
              + Add task
            </button>
          )}
        </div>
      )}

      {/* Task detail modal */}
      <TaskModal
        task={activeTask}
        onClose={() => setActiveTask(null)}
        onUpdate={(id, patch) => {
          updateTask(id, patch);
          setActiveTask((prev) => (prev?.id === id ? { ...prev, ...patch } : prev));
        }}
        onDelete={(id) => { removeTask(id); setActiveTask(null); }}
      />
    </>
  );
}
