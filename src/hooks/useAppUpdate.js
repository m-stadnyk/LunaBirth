import { useState, useEffect } from "react";

export function useAppUpdate() {
  const [swReg, setSwReg] = useState(null);
  // 'idle' | 'checking' | 'upToDate' | 'updating'
  const [status, setStatus] = useState("idle");

  useEffect(() => {
    const sw = navigator.serviceWorker;
    if (!sw) return;

    sw.ready.then((reg) => setSwReg(reg));

    const handleControllerChange = () => window.location.reload();
    sw.addEventListener("controllerchange", handleControllerChange);
    return () => {
      sw.removeEventListener("controllerchange", handleControllerChange);
    };
  }, []);

  const checkForUpdates = async () => {
    setStatus("checking");

    if (!swReg) {
      // Dev mode or browser without SW support
      setStatus("upToDate");
      setTimeout(() => setStatus("idle"), 3000);
      return;
    }

    try {
      await swReg.update();
      // Give the new SW time to install and skip-wait (autoUpdate). If the
      // controllerchange event fires, the page reloads and we never reach here.
      setTimeout(() => {
        if (swReg.waiting) {
          // New SW installed but hasn't claimed yet — push it to activate
          setStatus("updating");
          swReg.waiting.postMessage({ type: "SKIP_WAITING" });
        } else {
          setStatus("upToDate");
          setTimeout(() => setStatus("idle"), 3000);
        }
      }, 1500);
    } catch {
      setStatus("upToDate");
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  return { status, checkForUpdates };
}
