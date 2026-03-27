#!/usr/bin/env bash
# =============================================================================
# LunaBirth — Build & Local Preview Script
# =============================================================================
# Usage:
#   ./scripts/build-and-serve.sh          # build + serve (HTTP, phone on same WiFi)
#   ./scripts/build-and-serve.sh --https  # build + serve with self-signed HTTPS
#                                          # (required for PWA install on iOS)
# =============================================================================
set -e

HTTPS_MODE=false
if [[ "$1" == "--https" ]]; then
  HTTPS_MODE=true
fi

echo ""
echo "🌸  LunaBirth Build"
echo "===================="

# 1. Install dependencies if node_modules missing
if [ ! -d "node_modules" ]; then
  echo "📦  Installing dependencies..."
  npm install
fi

# 2. Build
echo "🔨  Building production bundle..."
npm run build
echo "✅  Build complete → dist/"

# 3. Serve
echo ""
echo "📱  HOW TO INSTALL ON YOUR PHONE"
echo "=================================="
echo ""

if $HTTPS_MODE; then
  echo "Starting HTTPS preview server (self-signed cert)..."
  echo "You may need to accept the security warning in your browser."
  echo ""
  # vite preview supports --host to expose on LAN
  npx vite preview --host --port 4173 --https 2>/dev/null || \
    npx serve -s dist --listen 4173 --ssl-cert cert.pem --ssl-key key.pem 2>/dev/null || \
    npx http-server dist -p 4173 -S -C cert.pem 2>/dev/null || \
    (echo "Install serve: npm install -g serve" && exit 1)
else
  LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || hostname -I 2>/dev/null | awk '{print $1}')
  PORT=4173

  echo "1. Make sure your phone and computer are on the SAME Wi-Fi network."
  echo ""
  if [ -n "$LOCAL_IP" ]; then
    echo "2. Open this URL on your phone's browser:"
    echo "   http://${LOCAL_IP}:${PORT}"
  else
    echo "2. Find your computer's local IP (e.g. 192.168.x.x) and open:"
    echo "   http://<your-ip>:${PORT}"
  fi
  echo ""
  echo "3. Android Chrome:"
  echo "   • Tap the three-dot menu → 'Add to Home screen'"
  echo "   • Or look for the install banner at the bottom"
  echo ""
  echo "4. iPhone Safari:"
  echo "   • Tap the Share button (box with arrow) → 'Add to Home Screen'"
  echo "   • NOTE: iOS requires HTTPS for full PWA install."
  echo "     Run with --https flag, or deploy to a free host (see below)."
  echo ""
  echo "5. FREE HOSTING OPTIONS (recommended for iOS):"
  echo "   • Netlify:  drag-and-drop the 'dist' folder at netlify.com/drop"
  echo "   • Vercel:   npx vercel deploy --prod"
  echo "   • GitHub Pages: push dist/ to gh-pages branch"
  echo ""
  echo "Starting HTTP preview server..."
  npx vite preview --host --port $PORT
fi
