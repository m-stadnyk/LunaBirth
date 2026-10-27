# Cloud sync ships dark for the beta

For the first share with beta testers, cloud sync and partner mode are hidden behind a `cloudSync` feature flag (off by default, and hidden when the Supabase env vars are missing). The flag only hides Sign in / Join: devices that are already synced keep working and can still Unsync. We kept the code rather than deleting it because partner-side support is on the roadmap.

## Gaps to close before the flag defaults on

- **Offline:** signing in deletes the local data, and a reload without network falls back to an empty local adapter. Cloud mode needs a local cache.
- **Partner writes:** the RLS policies make the partner read-only, but the UI lets the partner write and swallows the failures. Pick a partner write model and make the UI match it.
- **Invite code security:** codes are 6 characters from `Math.random`, never rotated, with no rate limit on `join_session`, and partners can't be removed. Contacts' phone numbers are readable by anyone who joins.
- **Concurrent edits:** each data type is a whole snapshot (last write wins), and the read-merge-write on settings is not atomic.
- **Realtime coverage:** hydration and contacts have no realtime subscription. The partner's "labour started" alert fires on every settings change while in labour mode.
