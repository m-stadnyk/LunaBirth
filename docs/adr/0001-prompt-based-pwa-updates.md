# Prompt-based PWA updates instead of auto-reload

A new service worker used to take control and reload the page as soon as a deploy landed (`registerType: "autoUpdate"`), which could happen in the middle of a contraction being timed during labour. We switch to a "New version — tap to update" banner, so the app never reloads unless the user asks. We also save the in-progress contraction so it survives a reload. The cost is that users may run an older version for longer. Do not switch back to `autoUpdate` without solving mid-labour reloads another way.
