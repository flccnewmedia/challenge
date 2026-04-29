import { CONFIG } from "../config.js";

export class FaceTracker extends EventTarget {
  constructor(video, canvas) {
    super();
    this.video = video;
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.landmarker = null;
    this.running = false;
    this.lastVideoTime = -1;
    this.style = "blue";
    this.resize();
    window.addEventListener("resize", () => this.resize());
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, CONFIG.performance.maxDpr);
    this.canvas.width = Math.floor(window.innerWidth * dpr);
    this.canvas.height = Math.floor(window.innerHeight * dpr);
    this.canvas.style.width = `${window.innerWidth}px`;
    this.canvas.style.height = `${window.innerHeight}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  async init() {
    try {
      const vision = await import("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14");
      const fileset = await vision.FilesetResolver.forVisionTasks(CONFIG.tracking.wasmBase);
      this.landmarker = await vision.FaceLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: CONFIG.tracking.faceModelUrl, delegate: "GPU" },
        runningMode: "VIDEO",
        numFaces: 1
      });
      return true;
    } catch (error) {
      console.info("Face tracking unavailable, using draggable fallback.", error);
      return false;
    }
  }

  start(style) {
    this.style = style;
    this.running = true;
    this.loop();
  }

  stop() {
    this.running = false;
    this.clear();
  }

  clear() {
    this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  }

  loop = () => {
    if (!this.running) return;
    this.clear();
    if (this.landmarker && this.video.readyState >= 2 && this.video.currentTime !== this.lastVideoTime) {
      this.lastVideoTime = this.video.currentTime;
      const result = this.landmarker.detectForVideo(this.video, performance.now());
      const face = result.faceLandmarks?.[0];
      if (face) this.drawFaceEffects(face);
    }
    requestAnimationFrame(this.loop);
  };

  drawFaceEffects(face) {
    const leftEye = face[33];
    const rightEye = face[263];
    const chin = face[152];
    if (!leftEye || !rightEye || !chin) return;
    const lx = (1 - leftEye.x) * window.innerWidth;
    const rx = (1 - rightEye.x) * window.innerWidth;
    const ly = leftEye.y * window.innerHeight;
    const ry = rightEye.y * window.innerHeight;
    const cx = (lx + rx) / 2;
    const cy = (ly + ry) / 2;
    const width = Math.max(96, Math.hypot(rx - lx, ry - ly) * 2.05);
    const angle = Math.atan2(ry - ly, rx - lx);
    this.drawSunglasses(cx, cy, width, angle);
    this.drawOutfit(cx, chin.y * window.innerHeight, width);
  }

  drawSunglasses(cx, cy, width, angle) {
    const ctx = this.ctx;
    const lensColor = this.style === "red" ? "rgba(4,4,6,0.92)" : "rgba(255,83,174,0.74)";
    const frameColor = this.style === "red" ? "#0b0b0f" : CONFIG.colors.beachSky;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.lineWidth = Math.max(5, width * 0.045);
    ctx.strokeStyle = frameColor;
    ctx.fillStyle = lensColor;
    const lensW = width * 0.34;
    const lensH = width * 0.18;
    ctx.beginPath();
    this.roundRect(ctx, -width * 0.42, -lensH * 0.5, lensW, lensH, 12);
    this.roundRect(ctx, width * 0.08, -lensH * 0.5, lensW, lensH, 12);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-width * 0.08, 0);
    ctx.lineTo(width * 0.08, 0);
    ctx.stroke();
    ctx.restore();
  }

  roundRect(ctx, x, y, width, height, radius) {
    if (ctx.roundRect) {
      ctx.roundRect(x, y, width, height, radius);
      return;
    }
    const r = Math.min(radius, width / 2, height / 2);
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
  }

  drawOutfit(cx, chinY, width) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(cx, chinY + width * 0.18);
    if (this.style === "red") {
      ctx.fillStyle = "rgba(4,5,7,0.72)";
      ctx.beginPath();
      ctx.moveTo(-width * 0.72, width * 1.55);
      ctx.lineTo(-width * 0.28, 0);
      ctx.lineTo(0, width * 0.46);
      ctx.lineTo(width * 0.28, 0);
      ctx.lineTo(width * 0.72, width * 1.55);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillStyle = "rgba(255,111,177,0.36)";
      ctx.beginPath();
      ctx.arc(0, width * 0.42, width * 0.54, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}
