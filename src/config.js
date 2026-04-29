export const CONFIG = {
  text: {
    title: "Reality Glitch",
    introCaption: "Press Start Camera to begin.",
    rearCaption: "Rear camera active. Move slowly and tap a crack to inspect it.",
    focusCaption: "Crack focus increased. Pinch, point, or tap Trigger Glitch.",
    matrixCaption: "The room is converting into Matrix code.",
    pillCaption: "Choose Red Pill or Blue Pill.",
    blueCaption: "Blue world ready. Flip to selfie for beach styling.",
    redCaption: "Red world ready. Flip to selfie for steampunk styling.",
    selfieBlueCaption: "Selfie beach mode. Face effects track when available.",
    selfieRedCaption: "Selfie red mode. Face effects track when available.",
    cameraDenied: "Camera unavailable. Demo mode is running with simulated AR."
  },
  colors: {
    matrix: "#27ff63",
    matrixDim: "#0c8f34",
    crackGlow: "#3dff76",
    void: "#020504",
    red: "#ff2c34",
    blue: "#2aa7ff",
    brass: "#c68a35",
    amber: "#ffb35b",
    beachSky: "#67d7ff",
    beachSand: "#ffe08d",
    beachPink: "#ff6fb1"
  },
  performance: {
    maxDpr: 1.5,
    particleCount: navigator.hardwareConcurrency && navigator.hardwareConcurrency < 6 ? 140 : 260,
    crackCount: 5,
    reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches
  },
  tracking: {
    handModelUrl: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
    faceModelUrl: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task",
    wasmBase: "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
  },
  cracks: {
    focusGrowth: 1.55,
    tapRadius: 110,
    binarySpeed: 34,
    openRate: 0.18,
    openThreshold: 0.92
  },
  pills: {
    redLabel: "Red Pill",
    blueLabel: "Blue Pill"
  }
};
