import { useState, useEffect, useCallback } from "react";
import { storage } from "../utils/storage.js";
import { showNotification } from "../utils/notify.js";

const KEY = "luna_notif_water";

/**
 * Manages browser Notification permission and user preference for water reminders.
 * Reminders fire only while the app is open (foreground timers); there is no
 * server-side push. Settings tells the user this.
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
    storage.set(KEY, next ? "1" : "0").catch(() => {}); // preference only; best-effort
  }, [enabled]);

  /**
   * Fire a water reminder notification.
   * No-op if disabled, permission not granted, or Notification API unavailable.
   */
  const notifyWater = useCallback((title, body) => {
    if (!enabled) return Promise.resolve();
    return showNotification(title ?? "Time to drink! 💧", {
      body: body ?? "Your water reminder interval has ended.",
      tag: "luna-water", // replaces previous notification instead of stacking
      renotify: true,
    });
  }, [enabled]);

  return { permission, enabled, toggle, notifyWater };
}
