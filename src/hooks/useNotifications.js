import { useState, useEffect, useCallback } from "react";
import { storage } from "../utils/storage.js";

const KEY = "luna_notif_water";

/**
 * Manages browser Notification permission and user preference for water reminders.
 * Fires in-app notifications only while the browser has the app loaded.
 * No server-side push or VAPID keys required.
 */
export function useNotifications() {
  const [permission, setPermission] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "denied"
  );
  const [enabled, setEnabled] = useState(false);

  // Load persisted preference on mount
  useEffect(() => {
    storage.get(KEY).then((stored) => {
      if (stored?.value === "1") setEnabled(true);
    });
  }, []);

  // Keep permission state in sync if browser updates it externally
  useEffect(() => {
    if (typeof Notification === "undefined") return;
    setPermission(Notification.permission);
  }, [enabled]);

  /**
   * Toggle water reminder notifications on/off.
   * Requests browser permission the first time if not yet granted.
   */
  const toggle = useCallback(async () => {
    if (typeof Notification === "undefined") return;

    const next = !enabled;

    if (next && Notification.permission === "default") {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== "granted") return; // user denied — don't enable
    } else {
      setPermission(Notification.permission);
    }

    setEnabled(next);
    storage.set(KEY, next ? "1" : "0");
  }, [enabled]);

  /**
   * Fire a water reminder notification.
   * No-op if disabled, permission not granted, or Notification API unavailable.
   */
  const notifyWater = useCallback((title, body) => {
    if (!enabled || typeof Notification === "undefined") return;
    if (Notification.permission !== "granted") return;

    try {
      new Notification(title ?? "Time to drink! 💧", {
        body: body ?? "Your water reminder interval has ended.",
        icon: "/icons/icon-192x192.png",
        tag: "luna-water", // replaces previous notification instead of stacking
        renotify: true,
      });
    } catch {
      // Notification constructor can throw in some browser contexts — silently ignore
    }
  }, [enabled]);

  return { permission, enabled, toggle, notifyWater };
}
