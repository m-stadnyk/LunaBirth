import { useState, useEffect, useCallback, useRef } from "react";
import { storage } from "../utils/storage.js";

const KEY = "luna_notif_water";
const AUDIO_KEY = "luna_notif_water_audio";

function playWaterTone(audioCtxRef) {
  // Stop any currently playing tone so alerts don't stack
  if (audioCtxRef.current) {
    try { audioCtxRef.current.close(); } catch {}
    audioCtxRef.current = null;
  }
  if (typeof AudioContext === "undefined") return;
  try {
    const ctx = new AudioContext();
    audioCtxRef.current = ctx;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    // Two-note water-drop chime: E5 → C5, 0.8 s fade
    osc.type = "sine";
    osc.frequency.setValueAtTime(659, ctx.currentTime);
    osc.frequency.setValueAtTime(523, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.35, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.8);
    osc.onended = () => {
      ctx.close().catch(() => {});
      if (audioCtxRef.current === ctx) audioCtxRef.current = null;
    };
  } catch {
    // AudioContext can fail in restricted browser contexts — silently ignore
  }
}

/**
 * Manages water-reminder alerts: browser push notifications and/or an in-app
 * audio tone. Each channel has its own enable/disable toggle and persisted
 * preference.  Alerts never stack: push uses `tag` to replace the previous
 * notification, and audio stops any current tone before starting a new one.
 */
export function useNotifications() {
  const [permission, setPermission] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "denied"
  );
  const [enabled, setEnabled] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const audioCtxRef = useRef(null);

  // Load persisted preferences on mount
  useEffect(() => {
    storage.get(KEY).then((stored) => {
      if (stored?.value === "1") setEnabled(true);
    });
    storage.get(AUDIO_KEY).then((stored) => {
      if (stored?.value === "1") setAudioEnabled(true);
    });
  }, []);

  // Keep permission state in sync if the browser updates it externally
  useEffect(() => {
    if (typeof Notification === "undefined") return;
    setPermission(Notification.permission);
  }, [enabled]);

  /**
   * Toggle push notifications on/off.
   * Requests browser permission the first time if not yet granted.
   */
  const toggle = useCallback(async () => {
    if (typeof Notification === "undefined") return;

    const next = !enabled;

    if (next && Notification.permission === "default") {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== "granted") return;
    } else {
      setPermission(Notification.permission);
    }

    setEnabled(next);
    storage.set(KEY, next ? "1" : "0");
  }, [enabled]);

  /**
   * Toggle audio notifications on/off. No browser permission required.
   */
  const toggleAudio = useCallback(() => {
    const next = !audioEnabled;
    setAudioEnabled(next);
    storage.set(AUDIO_KEY, next ? "1" : "0");
  }, [audioEnabled]);

  /**
   * Fire a water-reminder alert via all enabled channels.
   * Push uses `tag: "luna-water"` to replace any pending notification (no
   * stacking).  Audio stops any current tone before playing a new one.
   */
  const notifyWater = useCallback((title, body) => {
    if (enabled && typeof Notification !== "undefined" && Notification.permission === "granted") {
      try {
        new Notification(title ?? "Time to drink! 💧", {
          body: body ?? "Your water reminder interval has ended.",
          icon: "/icons/icon-192x192.png",
          tag: "luna-water",
          renotify: true,
        });
      } catch {
        // Notification constructor can throw in some browser contexts
      }
    }

    if (audioEnabled) {
      playWaterTone(audioCtxRef);
    }
  }, [enabled, audioEnabled]);

  return { permission, enabled, toggle, audioEnabled, toggleAudio, notifyWater };
}
