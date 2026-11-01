/**
 * Feature flag definitions.
 *
 * Each entry:
 *   id           - unique key used in localStorage and useFeatureFlags()
 *   labelKey     - i18n key resolved via t() for the Settings toggle label
 *   defaultValue - true = enabled by default (opt-out model)
 *
 * To add a new flag:
 *   1. Add an entry here
 *   2. Add the labelKey to src/i18n/en.json and src/i18n/uk.json under "flags"
 *   3. Consume in a component: const { flags } = useFeatureFlags()
 *   4. Gate the feature:       {flags.myFlag && <MyFeature />}
 */
export const FEATURE_FLAGS = [
  { id: "debugPopup", labelKey: "flags.debugPopup", defaultValue: false },
  // Cloud sync & partner mode — off until the gaps in docs/adr/0002 are closed.
  // The toggle is hidden when Supabase env vars are missing.
  { id: "cloudSync", labelKey: "flags.cloudSync", defaultValue: false },
];
