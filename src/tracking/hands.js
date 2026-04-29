import { CONFIG } from "../config.js";

export class HandTracker extends EventTarget {
  constructor(video) {
    super();
    this.video = video;
    this.landmarker = null;
    this.running = false;
    this.lastVideoTime = -1;
  }

  async init() {
    try {
      const vision = await import("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14");
      const fileset = await vision.FilesetResolver.forVisionTasks(CONFIG.tracking.wasmBase);
      this.landmarker = await vision.HandLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: CONFIG.tracking.handModelUrl, delegate: "GPU" },
        runningMode: "VIDEO",
        numHands: 1
      });
      return true;
    } catch (error) {
      console.info("Hand tracking unavailable, using tap fallback.", error);
      return false;
    }
  }

  start() {
    if (!this.landmarker || this.running) return;
    this.running = true;
    this.loop();
  }

  stop() {
    this.running = false;
  }

  loop = () => {
    if (!this.running) return;
    if (this.video.readyState >= 2 && this.video.currentTime !== this.lastVideoTime) {
      this.lastVideoTime = this.video.currentTime;
      const result = this.landmarker.detectForVideo(this.video, performance.now());
      const hand = result.landmarks?.[0];
      if (hand) {
        const index = hand[8];
        const thumb = hand[4];
        const x = (1 - index.x) * window.innerWidth;
        const y = index.y * window.innerHeight;
        const pinch = Math.hypot(index.x - thumb.x, index.y - thumb.y) < 0.055;
        this.dispatchEvent(new CustomEvent("hand", { detail: { x, y, pinch } }));
      }
    }
    requestAnimationFrame(this.loop);
  };
}
