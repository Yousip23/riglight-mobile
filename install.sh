#!/usr/bin/env bash
set -e

# ============================================================
# RigLight — One-Command iPhone Install
# Run this once. It builds the app and gives you an install link.
# ============================================================

echo ""
echo "  ██████╗ ██╗ ██████╗ ██╗     ██╗ ██████╗ ██╗  ██╗████████╗"
echo "  ██╔══██╗██║██╔════╝ ██║     ██║██╔════╝ ██║  ██║╚══██╔══╝"
echo "  ██████╔╝██║██║  ███╗██║     ██║██║  ███╗███████║   ██║   "
echo "  ██╔══██╗██║██║   ██║██║     ██║██║   ██║██╔══██║   ██║   "
echo "  ██║  ██║██║╚██████╔╝███████╗██║╚██████╔╝██║  ██║   ██║   "
echo ""
echo "  iPhone App Builder"
echo "  ============================================================"
echo ""

# 1. Install EAS CLI globally if missing
if ! command -v eas &>/dev/null; then
  echo "▶  Installing EAS CLI..."
  npm install -g eas-cli
fi

# 2. Log in to Expo account
echo ""
echo "▶  Log in to your Expo account (free at expo.dev)"
eas login

# 3. Register THIS iPhone so the build can be installed
echo ""
echo "▶  Register your iPhone for internal distribution."
echo "   Open the URL that appears on your phone and follow the prompts."
echo ""
eas device:create

# 4. Build for internal distribution (iOS)
echo ""
echo "▶  Building RigLight for your iPhone..."
echo "   This takes ~10–15 minutes in the cloud."
echo "   You'll get an email + QR code when it's done."
echo ""
eas build --platform ios --profile preview --non-interactive

# 5. Done!
echo ""
echo "  ✅  BUILD COMPLETE"
echo ""
echo "  On your iPhone:"
echo "  1. Open the install link that appeared above (or check your email)"
echo "  2. Tap INSTALL when prompted"
echo "  3. Go to Settings → General → VPN & Device Management"
echo "     and trust the developer certificate"
echo "  4. Open RigLight"
echo "  5. Enable Bluetooth, tap a tire → Connect"
echo ""
