import { useState } from "react";
import { P } from "./theme/index.js";
import { useContractions } from "./hooks/useContractions.js";
import { useHydration } from "./hooks/useHydration.js";
import { useAffirmations } from "./hooks/useAffirmations.js";
import { useRelief } from "./hooks/useRelief.js";
import { Header } from "./components/Header.jsx";
import { TabBar } from "./components/TabBar.jsx";
import { MethodModal } from "./components/MethodModal.jsx";
import { ContractionsTab } from "./features/contractions/ContractionsTab.jsx";
import { HydrationTab } from "./features/hydration/HydrationTab.jsx";
import { ReliefTab } from "./features/relief/ReliefTab.jsx";

const GLOBAL_STYLES = `
  * { box-sizing: border-box; }
  body { margin: 0; background: ${P.bg}; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-thumb { background: ${P.border}; border-radius: 4px; }
  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.85; transform: scale(0.98); }
  }
  .pulsing { animation: pulse 2s ease-in-out infinite; }
  .alertPulse { animation: pulse 1.1s ease-in-out infinite; }
  input:focus { outline: none; border-color: ${P.rose} !important; }
`;

export default function App() {
  const [tab, setTab] = useState("contractions");

  const { affirmation, fade } = useAffirmations();
  const hydration = useHydration();
  const contractions = useContractions({ onPhaseChange: hydration.handlePhaseChange });
  const relief = useRelief();

  return (
    <>
      <style>{GLOBAL_STYLES}</style>
      <div
        style={{
          fontFamily: "'DM Sans',sans-serif",
          background: P.bg,
          minHeight: "100vh",
          maxWidth: 420,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          color: P.text,
        }}
      >
        <Header affirmation={affirmation} fade={fade} />
        <TabBar activeTab={tab} onTabChange={setTab} />

        <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 80px" }}>
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
      </div>
    </>
  );
}
