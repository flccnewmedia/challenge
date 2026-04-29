import { CONFIG } from "./config.js";
import { AppState, STATES } from "./state.js";
import { CameraController } from "./camera.js";
import { UIController } from "./ui.js";
import { ARWorld } from "./arWorld.js";
import { CrackSystem } from "./effects/cracks.js";
import { BinaryRain } from "./effects/binaryRain.js";
import { buildMatrixRoom } from "./effects/matrixRoom.js";
import { buildSteampunkWorld } from "./effects/steampunkWorld.js";
import { buildBeachWorld } from "./effects/beachWorld.js";
import { HandTracker } from "./tracking/hands.js";
import { FaceTracker } from "./tracking/face.js";

const video = document.getElementById("cameraFeed");
const fxCanvas = document.getElementById("fxCanvas");
const fx = fxCanvas.getContext("2d", { alpha: true });

const state = new AppState();
const ui = new UIController();
const camera = new CameraController(video);
const world = new ARWorld(document.getElementById("threeCanvas"));
const cracks = new CrackSystem(fxCanvas);
const rain = new BinaryRain();
const hands = new HandTracker(video);
const face = new FaceTracker(video, document.getElementById("faceCanvas"));

let running = true;
let last = performance.now();
let trackingLoaded = false;
let faceLoaded = false;

function resizeFx() {
  cracks.resize();
  rain.resize(window.innerWidth, window.innerHeight);
}
window.addEventListener("resize", resizeFx);
resizeFx();

ui.on({
  start: startExperience,
  focus: () => focusCrack(window.innerWidth / 2, window.innerHeight / 2),
  transform: triggerMatrix,
  flip: flipToSelfie,
  reset: reset,
  red: () => choosePill("red"),
  blue: () => choosePill("blue")
});

state.addEventListener("statechange", ({ detail }) => {
  document.body.className = detail.state.toLowerCase().replace("_", "-");
  ui.render(state.value, state.choice, state.demoMode);
  applyStateEffects(detail.state);
});

state.addEventListener("choicechange", () => ui.render(state.value, state.choice, state.demoMode));

window.addEventListener("pointerdown", (event) => {
  if ([STATES.REAR_ROOM, STATES.CRACK_FOCUS].includes(state.value)) {
    const hit = cracks.hitTest(event.clientX, event.clientY);
    if (hit) focusCrack(event.clientX, event.clientY);
  }
});

hands.addEventListener("hand", ({ detail }) => {
  ui.setReticle({ x: detail.x, y: detail.y }, detail.pinch);
  if (detail.pinch && [STATES.REAR_ROOM, STATES.CRACK_FOCUS].includes(state.value)) {
    const hit = cracks.hitTest(detail.x, detail.y);
    if (hit) triggerMatrix();
  }
  if (detail.pinch && state.value === STATES.PILL_CHOICE) {
    choosePill(detail.x < window.innerWidth / 2 ? "red" : "blue");
  }
});

document.addEventListener("visibilitychange", () => {
  running = !document.hidden;
  if (running) {
    last = performance.now();
    requestAnimationFrame(loop);
  }
});

async function startExperience() {
  try {
    await camera.start("environment");
    state.setDemoMode(false);
  } catch (error) {
    console.info("Camera permission failed, entering demo mode.", error);
    state.setDemoMode(true);
  }
  cracks.setEnabled(true);
  state.set(STATES.REAR_ROOM);
  lazyLoadTracking();
}

async function lazyLoadTracking() {
  if (!trackingLoaded) {
    trackingLoaded = await hands.init();
    if (trackingLoaded) hands.start();
  }
  if (!faceLoaded) faceLoaded = await face.init();
}

function focusCrack(x, y) {
  cracks.focusNearest(x, y);
  state.set(STATES.CRACK_FOCUS);
}

function triggerMatrix() {
  cracks.setEnabled(true);
  rain.setActive(true);
  buildMatrixRoom(world);
  state.set(STATES.MATRIX_ROOM);
  window.setTimeout(() => state.set(STATES.PILL_CHOICE), CONFIG.performance.reducedMotion ? 600 : 1600);
}

function choosePill(choice) {
  state.setChoice(choice);
  rain.setActive(false);
  world.showPills(false);
  if (choice === "red") {
    buildSteampunkWorld(world);
    state.set(STATES.RED_WORLD);
  } else {
    buildBeachWorld(world);
    state.set(STATES.BLUE_WORLD);
  }
}

async function flipToSelfie() {
  if (!state.choice) return;
  if (!state.demoMode) {
    try {
      await camera.start("user");
    } catch (error) {
      console.info("Front camera unavailable, continuing demo selfie mode.", error);
      state.setDemoMode(true);
    }
  }
  cracks.setEnabled(false);
  const next = state.choice === "red" ? STATES.SELFIE_RED : STATES.SELFIE_BLUE;
  state.set(next);
  face.start(state.choice);
  ui.nodes.fallbackSunglasses.hidden = faceLoaded;
}

function reset() {
  face.stop();
  hands.stop();
  camera.stop();
  world.clearWorld();
  world.showPills(false);
  rain.setActive(false);
  cracks.setEnabled(false);
  state.setChoice(null);
  state.setDemoMode(false);
  state.set(STATES.INTRO);
}

function applyStateEffects(next) {
  world.showPills(next === STATES.PILL_CHOICE);
  document.documentElement.dataset.world = state.choice || "matrix";
  if (next === STATES.REAR_ROOM) buildMatrixRoom(world);
  if (next === STATES.INTRO) {
    fx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    ui.setReticle(null);
  }
}

function drawDemoCamera(time) {
  if (!state.demoMode) return;
  const grd = fx.createLinearGradient(0, 0, window.innerWidth, window.innerHeight);
  grd.addColorStop(0, "rgba(9,21,18,0.38)");
  grd.addColorStop(1, "rgba(4,4,7,0.45)");
  fx.fillStyle = grd;
  fx.fillRect(0, 0, window.innerWidth, window.innerHeight);
  fx.strokeStyle = "rgba(255,255,255,0.08)";
  for (let i = 0; i < 8; i++) {
    const y = ((time * 0.015 + i * 96) % (window.innerHeight + 96)) - 48;
    fx.beginPath();
    fx.moveTo(0, y);
    fx.lineTo(window.innerWidth, y - 80);
    fx.stroke();
  }
}

function loop(now) {
  if (!running) return;
  const dt = now - last;
  last = now;
  const active = state.value !== STATES.INTRO;
  if (active) {
    fx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    drawDemoCamera(now);
    cracks.draw(now, state.value === STATES.MATRIX_ROOM || state.value === STATES.PILL_CHOICE);
    if (state.value === STATES.CRACK_FOCUS && cracks.getFocusedOpenAmount() >= CONFIG.cracks.openThreshold) {
      triggerMatrix();
    }
    rain.draw(fx, window.innerWidth, window.innerHeight);
    drawScanlines(now, dt);
  }
  world.update();
  requestAnimationFrame(loop);
}

function drawScanlines(time) {
  if (![STATES.MATRIX_ROOM, STATES.PILL_CHOICE, STATES.RED_WORLD, STATES.BLUE_WORLD, STATES.SELFIE_BLUE, STATES.SELFIE_RED].includes(state.value)) return;
  fx.save();
  fx.globalAlpha = state.value.includes("RED") ? 0.12 : 0.18;
  fx.fillStyle = state.choice === "red" ? "rgba(255,179,91,0.22)" : "rgba(45,255,95,0.18)";
  for (let y = (time * 0.04) % 8; y < window.innerHeight; y += 8) fx.fillRect(0, y, window.innerWidth, 1);
  fx.restore();
}

ui.render(state.value, state.choice, state.demoMode);
requestAnimationFrame(loop);
