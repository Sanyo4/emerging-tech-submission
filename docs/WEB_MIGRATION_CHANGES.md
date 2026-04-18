# Web Migration Changes

This document lists every change made to support running the app in a web browser. All changes are additive guards behind `Platform.OS === 'web'` checks, making reversion straightforward.

## How to run on web

```bash
# Option 1: Two terminals
npm run proxy   # Terminal 1 — CORS proxy on :3001
npm run web     # Terminal 2 — Expo web on :8081

# Option 2: Single command (requires concurrently)
npx concurrently "npm run proxy" "npm run web"
# or after installing: npm run dev:web
```

## Changed files

### `services/haptics.ts`
**Change:** Added `if (Platform.OS === 'web') return;` at the top of `playBudgetHaptic`, `playTransactionHaptic`, and `playSuccessHaptic`.
**Revert:** Remove those three early-return lines.

### `components/VoiceInput.tsx`
**Change:** Added `Platform` import, `webSpeechAvailable` state, and a check that shows "Voice input requires Chrome or Edge" when the Web Speech API is unavailable.
**Revert:** Remove the `Platform` import addition, the `webSpeechAvailable` state + `useEffect`, and the early-return block before the main render.

### `app/_layout.tsx`
**Change:** Added `Platform` import and wrapped `<AuthGate />` in a max-width container (`maxWidth: 480, marginHorizontal: 'auto'`) on web. Added `webContainer` and `nativeContainer` styles.
**Revert:** Remove the `Platform` import addition, unwrap the `<View>` around `<StatusBar>` and `<AuthGate>`, and delete the two new style entries.

### `services/tonalAudio.ts`
**Change:** Wrapped the `Audio.setAudioModeAsync()` call in a try-catch to handle web edge cases.
**Revert:** Remove the try-catch wrapper, leaving the bare `await Audio.setAudioModeAsync(...)` call.

### `services/ai.ts`
**Change:** Added `Platform` import and made `HF_API_URL` conditional — uses `http://localhost:3001/...` on web (CORS proxy) and the direct HuggingFace URL on native.
**Revert:** Remove the `Platform` import and replace the conditional with the original direct URL string.

### `app.json`
**Change:** Added `"bundler": "metro"` to the `web` config section.
**Revert:** Remove the `"bundler": "metro"` line.

### `package.json`
**Change:** Added `"proxy"` and `"dev:web"` scripts.
**Revert:** Remove those two script entries.

## New files (delete to revert)

- `scripts/cors-proxy.js` — Lightweight Node.js CORS proxy for HuggingFace API calls from browser.
- `docs/WEB_MIGRATION_CHANGES.md` — This file.
