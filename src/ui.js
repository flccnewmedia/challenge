import { CONFIG } from "./config.js";
import { STATES } from "./state.js";

export class UIController {
  constructor() {
    this.nodes = {
      app: document.getElementById("app"),
      intro: document.getElementById("introPanel"),
      hud: document.getElementById("hud"),
      pillPanel: document.getElementById("pillPanel"),
      scanPanel: document.getElementById("scanPanel"),
      caption: document.getElementById("caption"),
      ariaLive: document.getElementById("ariaLive"),
      reticle: document.getElementById("reticle"),
      fallbackSunglasses: document.getElementById("fallbackSunglasses"),
      start: document.getElementById("startButton"),
      lockScan: document.getElementById("lockScanButton"),
      focus: document.getElementById("focusButton"),
      transform: document.getElementById("transformButton"),
      flip: document.getElementById("flipButton"),
      reset: document.getElementById("resetButton"),
      red: document.getElementById("redPillButton"),
      blue: document.getElementById("bluePillButton")
    };
    this.drag = null;
    this.sunglassesScale = 1;
    this.enableSunglassesDrag();
  }

  on(actions) {
    this.nodes.start.addEventListener("click", actions.start);
    this.nodes.lockScan.addEventListener("click", actions.lockScan);
    this.nodes.focus.addEventListener("click", actions.focus);
    this.nodes.transform.addEventListener("click", actions.transform);
    this.nodes.flip.addEventListener("click", actions.flip);
    this.nodes.reset.addEventListener("click", actions.reset);
    this.nodes.red.addEventListener("click", actions.red);
    this.nodes.blue.addEventListener("click", actions.blue);
    window.addEventListener("keydown", (event) => {
      if (event.key === "r") actions.red();
      if (event.key === "b") actions.blue();
      if (event.key === "Enter" || event.key === " ") actions.transform();
      if (event.key === "Escape") actions.reset();
    });
  }

  render(state, choice, demoMode = false, scanLocked = false) {
    this.nodes.app.dataset.state = state;
    this.nodes.app.dataset.choice = choice || "";
    this.nodes.app.dataset.demo = String(demoMode);
    this.nodes.app.dataset.scanLocked = String(scanLocked);
    this.nodes.intro.hidden = state !== STATES.INTRO;
    this.nodes.pillPanel.hidden = state !== STATES.PILL_CHOICE;
    this.nodes.scanPanel.hidden = !(state === STATES.REAR_ROOM && !scanLocked);
    this.nodes.flip.hidden = !(state === STATES.BLUE_WORLD || state === STATES.RED_WORLD);
    this.nodes.focus.hidden = !([STATES.REAR_ROOM, STATES.CRACK_FOCUS].includes(state) && scanLocked);
    this.nodes.transform.hidden = !([STATES.REAR_ROOM, STATES.CRACK_FOCUS, STATES.MATRIX_ROOM].includes(state) && (scanLocked || state === STATES.MATRIX_ROOM));
    this.nodes.fallbackSunglasses.hidden = !(state === STATES.SELFIE_BLUE || state === STATES.SELFIE_RED);

    const captions = {
      [STATES.INTRO]: CONFIG.text.introCaption,
      [STATES.REAR_ROOM]: demoMode ? CONFIG.text.cameraDenied : scanLocked ? CONFIG.text.lockedCaption : CONFIG.text.scanCaption,
      [STATES.CRACK_FOCUS]: CONFIG.text.focusCaption,
      [STATES.MATRIX_ROOM]: CONFIG.text.matrixCaption,
      [STATES.PILL_CHOICE]: CONFIG.text.pillCaption,
      [STATES.BLUE_WORLD]: CONFIG.text.blueCaption,
      [STATES.RED_WORLD]: CONFIG.text.redCaption,
      [STATES.SELFIE_BLUE]: CONFIG.text.selfieBlueCaption,
      [STATES.SELFIE_RED]: CONFIG.text.selfieRedCaption
    };
    this.announce(captions[state] || "");
  }

  announce(message) {
    this.nodes.caption.textContent = message;
    this.nodes.ariaLive.textContent = message;
  }

  setReticle(point, active = false) {
    if (!point) {
      this.nodes.reticle.hidden = true;
      return;
    }
    this.nodes.reticle.hidden = false;
    this.nodes.reticle.style.transform = `translate3d(${point.x}px, ${point.y}px, 0)`;
    this.nodes.reticle.classList.toggle("active", active);
  }

  enableSunglassesDrag() {
    const node = this.nodes.fallbackSunglasses;
    const move = (event) => {
      if (!this.drag) return;
      const x = event.clientX - this.drag.dx;
      const y = event.clientY - this.drag.dy;
      node.style.left = `${x}px`;
      node.style.top = `${y}px`;
    };
    const resize = (delta) => {
      this.sunglassesScale = Math.max(0.65, Math.min(1.7, this.sunglassesScale + delta));
      node.style.setProperty("--fallback-scale", this.sunglassesScale);
    };
    node.addEventListener("pointerdown", (event) => {
      node.setPointerCapture(event.pointerId);
      const rect = node.getBoundingClientRect();
      this.drag = { dx: event.clientX - rect.left, dy: event.clientY - rect.top };
    });
    node.addEventListener("pointermove", move);
    node.addEventListener("pointerup", () => {
      this.drag = null;
    });
    node.addEventListener("wheel", (event) => {
      event.preventDefault();
      resize(event.deltaY < 0 ? 0.08 : -0.08);
    });
    node.addEventListener("keydown", (event) => {
      const rect = node.getBoundingClientRect();
      const step = event.shiftKey ? 12 : 5;
      if (event.key === "+" || event.key === "=") resize(0.08);
      if (event.key === "-" || event.key === "_") resize(-0.08);
      if (event.key === "ArrowLeft") node.style.left = `${rect.left - step}px`;
      if (event.key === "ArrowRight") node.style.left = `${rect.left + step}px`;
      if (event.key === "ArrowUp") node.style.top = `${rect.top - step}px`;
      if (event.key === "ArrowDown") node.style.top = `${rect.top + step}px`;
    });
  }
}
