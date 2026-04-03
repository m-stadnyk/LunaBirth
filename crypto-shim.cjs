// Polyfill globalThis.crypto for Node 18 in all CJS contexts (main thread + worker threads).
// Required by serialize-javascript (used by @rollup/plugin-terser inside workbox-build).
if (typeof crypto === 'undefined') {
  const { webcrypto } = require('crypto');
  globalThis.crypto = webcrypto;
}
