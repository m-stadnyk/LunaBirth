import { useState, useEffect, useRef } from "react";

/**
 * Prompt-based PWA updates (see docs/adr/0001-prompt-based-pwa-updates.md).
 *
 * A new service worker installs in the background and waits. The app only
 * reloads after the user taps "Update" (applyUpdate), never on its own — an
 * unexpected reload mid-labour is worse than running an older version.
 */
export function useAppUpdate() {
  const [swReg, setSwReg] = useState(null);
  // 'idle' | 'checking' | 'upToDate' | 'updating'
  const [status, setStatus] = useState("idle");
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const userRequestedRef = useRef(false);

  useEffect(() => {
    const sw = navigator.serviceWorker;
    if (!sw) return;

    sw.ready.then((reg) => {
      setSwReg(reg);
      if (reg.waiting) setUpdateAvailable(true);
      reg.addEventListener?.("updatefound", () => {
        const installing = reg.installing;
        installing?.addEventListener("statechange", () => {
          // "installed" with an existing controller = an update is waiting
          if (installing.state === "installed" && sw.controller) setUpdateAvailable(true);
        });
      });
    });

    const handleControllerChange = () => {
      if (userRequestedRef.current) window.location.reload();
    };
    sw.addEventListener("controllerchange", handleControllerChange);
    return () => {
      sw.removeEventListener("controllerchange", handleControllerChange);
    };
  }, []);

  const showUpToDate = () => {
    setStatus("upToDate");
    setTimeout(() => setStatus("idle"), 3000);
  };

  const checkForUpdates = async () => {
    setStatus("checking");

    if (!swReg) {
      // Dev mode or browser without SW support
      showUpToDate();
      return;
    }

    try {
      await swReg.update();
      // Give the new SW time to install before looking for it
      setTimeout(() => {
        if (swReg.waiting) {
          setUpdateAvailable(true);
          setStatus("idle");
        } else {
          showUpToDate();
        }
      }, 1500);
    } catch {
      showUpToDate();
    }
  };

  const applyUpdate = () => {
    if (!swReg?.waiting) return;
    userRequestedRef.current = true;
    setStatus("updating");
    swReg.waiting.postMessage({ type: "SKIP_WAITING" });
  };

  return { status, updateAvailable, checkForUpdates, applyUpdate };
}
