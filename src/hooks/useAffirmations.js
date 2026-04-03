import { useState, useEffect } from "react";
import { AFFIRMATIONS } from "../constants/index.js";
import { AFFIRMATIONS_UK } from "../constants/affirmations_uk.js";

const LISTS = { en: AFFIRMATIONS, uk: AFFIRMATIONS_UK };

/**
 * Rotates through affirmations every 9 seconds with a fade transition.
 * Picks the list for the given locale (falls back to English).
 * Returns the current affirmation string and whether the fade is visible.
 */
export function useAffirmations(locale = "en") {
  const list = LISTS[locale] ?? AFFIRMATIONS;
  const [msgIdx, setMsgIdx] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    setMsgIdx(0);
  }, [locale]);

  useEffect(() => {
    const id = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setMsgIdx((i) => (i + 1) % list.length);
        setFade(true);
      }, 500);
    }, 9000);
    return () => clearInterval(id);
  }, [list]);

  return { affirmation: list[msgIdx] ?? list[0], msgIdx, fade };
}
