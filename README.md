# Reality Glitch: Red Pill / Blue Pill

A static, mobile-first WebAR-style browser experience. It uses the device camera, Three.js overlays, procedural crack and binary effects, optional MediaPipe hand/face tracking, and graceful fallbacks when camera or tracking is unavailable.

## Run Locally

Use a local static server:

```bash
python3 -m http.server 5173
```

Open `http://localhost:5173` on desktop, or expose the server over HTTPS for mobile camera testing. Mobile Safari and Chrome require HTTPS for camera access on public URLs.

## Deploy

### GitHub Pages

1. Commit the repository.
2. Push to GitHub.
3. In the repository settings, open **Pages**.
4. Choose **Deploy from a branch**.
5. Select the branch and root folder.
6. Open the generated HTTPS Pages URL on iPhone or Android.

### Vercel

1. Import the repository in Vercel.
2. Framework preset: **Other**.
3. Build command: leave empty.
4. Output directory: `.`.
5. Deploy.

### Netlify

1. Import the repository in Netlify.
2. Build command: leave empty.
3. Publish directory: `.`.
4. Deploy.

## Architecture

- `index.html` defines the camera, WebGL, visual effect canvases, ARIA live regions, and real HTML controls.
- `src/config.js` contains editable text, colors, labels, tracking model URLs, and effect settings.
- `src/state.js` defines the required state machine: `INTRO`, `REAR_ROOM`, `CRACK_FOCUS`, `MATRIX_ROOM`, `PILL_CHOICE`, `BLUE_WORLD`, `RED_WORLD`, `SELFIE_BLUE`, `SELFIE_RED`.
- `src/camera.js` manages rear/front camera streams.
- `src/arWorld.js` manages Three.js rendering and 3D pill/world overlays.
- `src/effects/*` contains cracks, binary rain, Matrix room, steampunk world, and beach world effects.
- `src/tracking/*` lazy-loads MediaPipe Tasks Vision for hand and face tracking when available.
- `src/ui.js` manages accessible controls, captions, keyboard shortcuts, and the draggable sunglasses fallback.

## True AR vs Fallback

This project is static and does not require a paid API. It does not bundle 8th Wall because 8th Wall production world tracking generally requires an account/project key. The app is structured so an 8th Wall or WebXR world-tracking module can replace `src/arWorld.js` placement logic later.

Current behavior:

- Camera feed: real browser `getUserMedia`, rear and front camera where supported.
- Room cracks: procedural screen-space AR overlay with device-orientation parallax fallback.
- Approach/proximity: simulated through tap, focus button, hold-style interaction, and crack enlargement.
- Hand pinch: optional MediaPipe Tasks Vision loaded in-browser; tap and keyboard fallback always work.
- Matrix room: WebGL particles plus canvas binary rain, scanlines, glow, and parallax-style depth layers.
- Pill choice: real HTML buttons plus Three.js floating pill visuals.
- Face effects: optional MediaPipe face landmarks. If tracking fails, a draggable fallback is shown and can be resized with mouse wheel or `+`/`-` keys.
- Demo mode: if camera permission is denied, the app runs with simulated room motion and all interactions still available.

## Mobile Notes

- Use a public HTTPS URL for iPhone and Android camera permissions.
- The app caps device pixel ratio and particle counts for mobile Safari.
- Tracking models are lazy-loaded only after the user starts the experience.
- Animation pauses when the tab is hidden.
- Reduced motion is respected with `prefers-reduced-motion`.

## Optional 8th Wall Integration

To add true world tracking, initialize 8th Wall before entering `REAR_ROOM`, then map detected surfaces/anchors to crack positions and Three.js planes. Keep the fallback path for browsers where WebAR tracking is unavailable.
