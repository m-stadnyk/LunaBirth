import { useState, useEffect } from "react";
import { useDatabaseContext } from "../context/DatabaseContext.jsx";
import { useReportError } from "../context/DebugContext.jsx";
import { CONTRACTION_RULES, DEFAULT_RULE } from "../constants/contractionRules.js";

/**
 * The contraction rule (5-1-1 / 4-1-1 / 3-1-1) the user's provider advised.
 * Persists via adapter settings as `contractionRule`.
 */
export function useContractionRule() {
  const { adapter, resetKey } = useDatabaseContext();
  const report = useReportError();
  const [rule, setRuleState] = useState(DEFAULT_RULE);

  useEffect(() => {
    adapter.getSettings().then((settings) => {
      const stored = settings?.contractionRule;
      setRuleState(CONTRACTION_RULES[stored] ? stored : DEFAULT_RULE);
    });
  }, [adapter, resetKey]);

  const setRule = (next) => {
    if (!CONTRACTION_RULES[next]) return;
    setRuleState(next);
    adapter.saveSettings({ contractionRule: next }).catch(report("contraction rule"));
  };

  return { rule, setRule, rules: Object.keys(CONTRACTION_RULES) };
}
