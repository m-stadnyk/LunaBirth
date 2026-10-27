/** Feedback address from the build env (set in Netlify); empty → feedback row hidden. */
export function getFeedbackEmail() {
  return import.meta.env.VITE_FEEDBACK_EMAIL || "";
}

/**
 * mailto: link with app version and language prefilled, or null when no
 * address is configured. No third-party service involved.
 */
export function buildFeedbackLink(email, { version, locale }) {
  if (!email) return null;
  const params = new URLSearchParams({
    subject: `LunaBirth feedback (v${version})`,
    body: `\n\n---\nApp version: ${version}\nLanguage: ${locale}\n`,
  });
  // URLSearchParams encodes spaces as "+", which mail clients show literally
  return `mailto:${email}?${params.toString().replace(/\+/g, "%20")}`;
}
