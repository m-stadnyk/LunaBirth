/**
 * Resolve a dot-notation key against a nested translations object.
 * e.g. getNestedValue(obj, "phases.early.title")
 * Returns undefined when any segment of the path is missing.
 */
export function getNestedValue(obj, key) {
  if (obj == null) return undefined;
  return key.split(".").reduce((cur, k) => (cur != null ? cur[k] : undefined), obj);
}

/**
 * Build a t(key, vars?) function bound to a translations object.
 * - Falls back to the key itself when the translation is missing.
 * - Supports {{varName}} interpolation via the optional vars object.
 */
export function createTranslator(translations) {
  return function t(key, vars) {
    const raw = getNestedValue(translations, key);
    const str = raw !== undefined ? String(raw) : key;
    if (!vars) return str;
    return str.replace(/\{\{(\w+)}}/g, (_, name) =>
      name in vars ? String(vars[name]) : `{{${name}}}`
    );
  };
}
