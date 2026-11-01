export const NOTIFICATION_ICON = "/icons/icon-192.png";

/**
 * Show a system notification if permission is granted.
 *
 * Mobile browsers (Android Chrome, iOS home-screen PWAs) only support
 * notifications through the service worker registration — `new Notification()`
 * throws there — so prefer that and fall back to the constructor on desktop.
 * Never throws.
 */
export async function showNotification(title, options = {}) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  const opts = { icon: NOTIFICATION_ICON, ...options };
  try {
    const reg = await navigator.serviceWorker?.getRegistration?.();
    if (reg?.showNotification) {
      await reg.showNotification(title, opts);
      return;
    }
    new Notification(title, opts);
  } catch {
    // Notifications are best-effort
  }
}
