import { useState, useEffect } from "react";
import { AFFIRMATIONS } from "../constants/index.js";

/**
 * Rotates through affirmations every 9 seconds with a fade transition.
 * Returns the current affirmation string and whether the fade is visible.
 */
export function useAffirmations() {
  const [msgIdx, setMsgIdx] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const id = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setMsgIdx((i) => (i + 1) % AFFIRMATIONS.length);
        setFade(true);
      }, 500);
    }, 9000);
    return () => clearInterval(id);
  }, []);

  return { affirmation: AFFIRMATIONS[msgIdx], msgIdx, fade };
}
