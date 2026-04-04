import { useState, useEffect } from "react";
import { N } from "./theme/index.js";
import { useAppMode } from "./hooks/useAppMode.js";
import { useDueDate } from "./hooks/useDueDate.js";
import { useTodos } from "./hooks/useTodos.js";
import { useContractions } from "./hooks/useContractions.js";
import { useHydration } from "./hooks/useHydration.js";
import { useAffirmations } from "./hooks/useAffirmations.js";
import { useRelief } from "./hooks/useRelief.js";
import { LocaleProvider, useLocaleContext } from "./context/LocaleContext.jsx";
import { FeatureFlagProvider } from "./context/FeatureFlagContext.jsx";
import { Header } from "./components/Header.jsx";
import { TabBar } from "./components/TabBar.jsx";
import { MethodModal } from "./components/MethodModal.jsx";
import { SettingsModal } from "./components/SettingsModal.jsx";
import { ContractionsTab } from "./features/contractions/ContractionsTab.jsx";
import { HydrationTab } from "./features/hydration/HydrationTab.jsx";
import { ReliefTab } from "./features/relief/ReliefTab.jsx";
import { ExpectationTab } from "./features/expectation/ExpectationTab.jsx";

const GLOBAL_STYLES = `
  * { box-sizing: border-box; }
  body { margin: 0; background: ${N.bg}; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-thumb { background: ${N.border}; border-radius: 4px; }
  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.85; transform: scale(0.98); }
  }
  .pulsing { animation: pulse 2s ease-in-out infinite; }
  .alertPulse { animation: pulse 1.1s ease-in-out infinite; }
  input:focus { outline: none; border-color: ${N.gold} !important; }
`;

function AppInner() {
  const { locale } = useLocaleContext();
  const { mode, toggleMode } = useAppMode();
  const [tab, setTab] = useState("contractions");
  const [settingsOpen, setSettingsOpen] = useState(false);

  // When mode changes, switch to the appropriate default tab
  useEffect(() => {
    setTab(mode === "expectation" ? "expecting" : "contractions");
  }, [mode]);

  const { affirmation, fade } = useAffirmations(locale);
  const hydration = useHydration();
  const contractions = useContractions({ onPhaseChange: hydration.handlePhaseChange });
  const relief = useRelief();
  const dueDate = useDueDate();
  const todos = useTodos();

  return (
    <>
      <style>{GLOBAL_STYLES}</style>
      <div
        style={{
          fontFamily: "'DM Sans',sans-serif",
          background: `${N.bgImage} center/cover fixed, ${N.bg}`,
          minHeight: "100vh",
          maxWidth: 420,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          color: N.text,
        }}
      >
        <Header
          affirmation={affirmation}
          fade={fade}
          mode={mode}
          onToggleMode={toggleMode}
          onOpenSettings={() => setSettingsOpen(true)}
        />
        <TabBar activeTab={tab} onTabChange={setTab} mode={mode} />

        <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 80px" }}>

          {/* ── Expectation mode ── */}
          {tab === "expecting" && (
            <ExpectationTab
              dueDate={dueDate.dueDate}
              setDueDate={dueDate.setDueDate}
              countdown={dueDate.countdown}
              countdownUnit={dueDate.countdownUnit}
              setCountdownUnit={dueDate.setCountdownUnit}
              todos={todos.todos}
              onAddTodo={todos.addTodo}
              onToggleDone={todos.toggleDone}
              onSetPriority={todos.setPriority}
              onSetCalendar={todos.setCalendar}
              onClearCalendar={todos.clearCalendar}
              onRemoveTodo={todos.removeTodo}
            />
          )}

          {/* ── Labour mode ── */}
          {tab === "contractions" && (
            <ContractionsTab
              contractions={contractions.contractions}
              activeStart={contractions.activeStart}
              elapsed={contractions.elapsed}
              clearConfirm={contractions.clearConfirm}
              setClearConfirm={contractions.setClearConfirm}
              phase={contractions.phase}
              stats={contractions.stats}
              handleContraction={contractions.handleContraction}
              clearAll={contractions.clearAll}
            />
          )}

          {/* ── Shared tabs ── */}
          {tab === "hydration" && (
            <HydrationTab
              drinkInterval={hydration.drinkInterval}
              intervals={hydration.intervals}
              customVal={hydration.customVal}
              setCustomVal={hydration.setCustomVal}
              showCustomInput={hydration.showCustomInput}
              setShowCustomInput={hydration.setShowCustomInput}
              drinkCount={hydration.drinkCount}
              secsLeft={hydration.secsLeft}
              drinkAlert={hydration.drinkAlert}
              drinkSuggestion={hydration.drinkSuggestion}
              setDrinkSuggestion={hydration.setDrinkSuggestion}
              applyInterval={hydration.applyInterval}
              addInterval={hydration.addInterval}
              removeInterval={hydration.removeInterval}
              drank={hydration.drank}
            />
          )}

          {tab === "relief" && (
            <ReliefTab
              methods={relief.methods}
              phase={contractions.phase}
              showAddForm={relief.showAddForm}
              setShowAddForm={relief.setShowAddForm}
              newName={relief.newName}
              setNewName={relief.setNewName}
              newMedia={relief.newMedia}
              setNewMedia={relief.setNewMedia}
              newPhases={relief.newPhases}
              setNewPhases={relief.setNewPhases}
              addMethod={relief.addMethod}
              removeMethod={relief.removeMethod}
              setActiveMethod={relief.setActiveMethod}
            />
          )}
        </div>

        <MethodModal
          method={relief.activeMethod}
          phase={contractions.phase}
          affirmation={affirmation}
          onClose={() => relief.setActiveMethod(null)}
          onSaveMedia={relief.saveMethodMedia}
        />

        <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      </div>
    </>
  );
}

export default function App() {
  return (
    <LocaleProvider>
      <FeatureFlagProvider>
        <AppInner />
      </FeatureFlagProvider>
    </LocaleProvider>
  );
}
