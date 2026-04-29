import { CONFIG } from "../config.js";

const rand = (min, max) => min + Math.random() * (max - min);

export class CrackSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { alpha: true });
    this.cracks = [];
    this.focused = -1;
    this.parallax = { x: 0, y: 0 };
    this.enabled = false;
    this.binaryOffset = 0;
    this.resize();
    this.seed();
    window.addEventListener("resize", () => {
      this.resize();
      this.seed();
    });
    window.addEventListener("deviceorientation", (event) => {
      this.parallax.x = Math.max(-18, Math.min(18, (event.gamma || 0) * 0.55));
      this.parallax.y = Math.max(-18, Math.min(18, (event.beta || 0) * 0.25));
    });
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, CONFIG.performance.maxDpr);
    this.canvas.width = Math.floor(window.innerWidth * dpr);
    this.canvas.height = Math.floor(window.innerHeight * dpr);
    this.canvas.style.width = `${window.innerWidth}px`;
    this.canvas.style.height = `${window.innerHeight}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  seed() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.cracks = Array.from({ length: CONFIG.performance.crackCount }, (_, index) => ({
      x: rand(w * 0.14, w * 0.86),
      y: rand(h * 0.26, h * 0.82),
      radius: rand(58, 118),
      angle: rand(-0.7, 0.7),
      branches: 6 + Math.floor(Math.random() * 6),
      phase: rand(0, 10),
      index
    }));
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    if (!enabled) this.clear();
  }

  focusNearest(x = window.innerWidth / 2, y = window.innerHeight / 2) {
    let best = 0;
    let bestDist = Infinity;
    this.cracks.forEach((crack, index) => {
      const dist = Math.hypot(crack.x - x, crack.y - y);
      if (dist < bestDist) {
        best = index;
        bestDist = dist;
      }
    });
    this.focused = best;
    return this.cracks[best];
  }

  hitTest(x, y) {
    const crack = this.cracks.find((item) => Math.hypot(item.x - x, item.y - y) < item.radius + CONFIG.cracks.tapRadius);
    if (crack) this.focused = crack.index;
    return crack;
  }

  clear() {
    this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  }

  draw(time, transformed = false) {
    if (!this.enabled) return;
    this.binaryOffset += CONFIG.performance.reducedMotion ? 0.2 : 1;
    for (const crack of this.cracks) this.drawCrack(crack, time, transformed);
  }

  drawCrack(crack, time, transformed) {
    const ctx = this.ctx;
    const focus = crack.index === this.focused || transformed;
    const scale = focus ? CONFIG.cracks.focusGrowth : 1;
    const glow = 0.55 + Math.sin(time * 0.004 + crack.phase) * CONFIG.cracks.glowPulse;
    const x = crack.x + this.parallax.x * (crack.index % 2 ? 0.5 : -0.4);
    const y = crack.y + this.parallax.y * (crack.index % 2 ? -0.3 : 0.5);
    const radius = crack.radius * scale;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(crack.angle);
    ctx.beginPath();
    ctx.moveTo(-radius * 0.75, 0);
    for (let i = 0; i < 9; i++) {
      const px = -radius * 0.75 + (i / 8) * radius * 1.5;
      const py = Math.sin(i * 1.7 + crack.phase) * radius * 0.16 + rand(-2, 2);
      ctx.lineTo(px, py);
    }
    for (let b = 0; b < crack.branches; b++) {
      const t = (b / crack.branches) * Math.PI * 2;
      const length = radius * rand(0.25, 0.72);
      ctx.moveTo(Math.cos(t) * radius * 0.12, Math.sin(t) * radius * 0.08);
      ctx.lineTo(Math.cos(t) * length, Math.sin(t) * length * 0.54);
    }
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.shadowColor = CONFIG.colors.crackGlow;
    ctx.shadowBlur = 22 * glow;
    ctx.strokeStyle = "rgba(55,255,112,0.84)";
    ctx.lineWidth = focus ? 5 : 3;
    ctx.stroke();

    ctx.globalCompositeOperation = "destination-over";
    const gradient = ctx.createRadialGradient(0, 0, 4, 0, 0, radius);
    gradient.addColorStop(0, "rgba(0,0,0,0.96)");
    gradient.addColorStop(0.44, "rgba(0,20,7,0.74)");
    gradient.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(0, 0, radius * 0.9, radius * 0.34, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalCompositeOperation = "source-over";
    ctx.clip();
    this.drawBinaryInside(radius, focus);
    ctx.restore();
  }

  drawBinaryInside(radius, focus) {
    const ctx = this.ctx;
    ctx.font = `${focus ? 18 : 13}px ui-monospace, SFMono-Regular, Menlo, monospace`;
    ctx.fillStyle = focus ? "rgba(79,255,116,0.92)" : "rgba(71,255,112,0.55)";
    const step = focus ? 20 : 24;
    for (let col = -radius; col < radius; col += step) {
      for (let row = -radius * 0.5; row < radius * 0.5; row += step) {
        const bit = ((col + row + Math.floor(this.binaryOffset / 7)) % 2) ? "1" : "0";
        ctx.fillText(bit, col, row + (this.binaryOffset % step));
      }
    }
  }
}
