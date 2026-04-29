import { CONFIG } from "../config.js";

const rand = (min, max) => min + Math.random() * (max - min);
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export class CrackSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { alpha: true });
    this.cracks = [];
    this.focused = -1;
    this.enabled = false;
    this.binaryOffset = 0;
    this.lastTime = performance.now();
    this.resize();
    this.seed();
    window.addEventListener("resize", () => {
      this.resize();
      this.seed();
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
    this.cracks = Array.from({ length: CONFIG.performance.crackCount }, (_, index) => ({
      xPct: rand(0.14, 0.86),
      yPct: rand(0.24, 0.78),
      radiusPct: rand(0.11, 0.2),
      angle: rand(-0.7, 0.7),
      phase: rand(0, 10),
      index,
      open: 0,
      spine: this.makeSpine(),
      chips: Array.from({ length: 18 }, () => ({ x: rand(-0.7, 0.7), y: rand(-0.9, 0.9), r: rand(0.008, 0.026) })),
      hairlines: Array.from({ length: 9 }, () => ({ x: rand(-0.55, 0.55), y: rand(-0.75, 0.75), a: rand(0, Math.PI * 2), l: rand(0.18, 0.58) }))
    }));
  }

  makeSpine() {
    return Array.from({ length: 13 }, (_, i) => {
      const t = i / 12;
      const y = -1 + t * 2;
      const bend = Math.sin(t * Math.PI * 2.1) * 0.18 + rand(-0.16, 0.16);
      const width = 0.09 + Math.sin(t * Math.PI) * 0.22 + rand(-0.035, 0.045);
      return { x: bend, y, width: Math.max(0.05, width) };
    });
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    if (!enabled) this.clear();
  }

  focusNearest(x = window.innerWidth / 2, y = window.innerHeight / 2) {
    let best = 0;
    let bestDist = Infinity;
    this.cracks.forEach((crack, index) => {
      const pos = this.getCrackPosition(crack);
      const dist = Math.hypot(pos.x - x, pos.y - y);
      if (dist < bestDist) {
        best = index;
        bestDist = dist;
      }
    });
    this.focused = best;
    return this.cracks[best];
  }

  hitTest(x, y) {
    const crack = this.cracks.find((item) => {
      const pos = this.getCrackPosition(item);
      return Math.hypot(pos.x - x, pos.y - y) < pos.radius + CONFIG.cracks.tapRadius;
    });
    if (crack) this.focused = crack.index;
    return crack;
  }

  getCrackPosition(crack) {
    const minSide = Math.min(window.innerWidth, window.innerHeight);
    return {
      x: crack.xPct * window.innerWidth,
      y: crack.yPct * window.innerHeight,
      radius: crack.radiusPct * minSide
    };
  }

  getFocusedOpenAmount() {
    if (this.focused < 0) return 0;
    return this.cracks[this.focused]?.open || 0;
  }

  clear() {
    this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  }

  draw(time, transformed = false) {
    if (!this.enabled) return;
    const dt = Math.min(50, time - this.lastTime);
    this.lastTime = time;
    this.binaryOffset += CONFIG.performance.reducedMotion ? 0.2 : 1;
    if (this.focused >= 0) {
      const focused = this.cracks[this.focused];
      focused.open = clamp(focused.open + dt * CONFIG.cracks.openRate * 0.001, 0, 1);
    }
    for (const crack of this.cracks) this.drawCrack(crack, time, transformed);
  }

  drawCrack(crack, time, transformed) {
    const ctx = this.ctx;
    const focus = crack.index === this.focused || transformed;
    const open = transformed ? 1 : crack.open;
    const scale = 1 + open * (CONFIG.cracks.focusGrowth - 1);
    const { x, y, radius: baseRadius } = this.getCrackPosition(crack);
    const radius = baseRadius * scale;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(crack.angle);
    ctx.scale(radius, radius);

    this.pathOpening(ctx, crack, open);
    ctx.save();
    ctx.clip();
    this.drawBinaryInside(time, open);
    ctx.restore();

    this.pathOpening(ctx, crack, open);
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = "rgba(0,0,0,0.86)";
    ctx.lineWidth = 0.09;
    ctx.lineJoin = "round";
    ctx.stroke();

    this.pathOpening(ctx, crack, open);
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = "rgba(185,185,170,0.34)";
    ctx.lineWidth = 0.035;
    ctx.stroke();

    this.drawBrokenEdges(ctx, crack, open);
    this.drawHairlineCracks(ctx, crack);
    ctx.restore();
  }

  pathOpening(ctx, crack, open) {
    const spread = 0.58 + open * 1.55;
    const left = crack.spine.map((p) => ({ x: p.x - p.width * spread - 0.04 * open, y: p.y }));
    const right = crack.spine.map((p) => ({ x: p.x + p.width * spread + 0.04 * open, y: p.y })).reverse();
    ctx.beginPath();
    ctx.moveTo(left[0].x, left[0].y);
    left.slice(1).forEach((p) => ctx.lineTo(p.x, p.y));
    right.forEach((p) => ctx.lineTo(p.x, p.y));
    ctx.closePath();
  }

  drawBrokenEdges(ctx, crack, open) {
    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    for (const chip of crack.chips) {
      const alpha = 0.18 + open * 0.12;
      ctx.fillStyle = `rgba(24,24,22,${alpha})`;
      ctx.beginPath();
      ctx.ellipse(chip.x, chip.y, chip.r * (1 + open), chip.r * 0.45, crack.angle + chip.x, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  drawHairlineCracks(ctx, crack) {
    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = "rgba(0,0,0,0.48)";
    ctx.lineWidth = 0.012;
    ctx.lineCap = "round";
    for (const line of crack.hairlines) {
      const sx = line.x;
      const sy = line.y;
      const ex = sx + Math.cos(line.a) * line.l;
      const ey = sy + Math.sin(line.a) * line.l * 0.6;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo((sx + ex) / 2 + Math.sin(line.a) * 0.05, (sy + ey) / 2);
      ctx.lineTo(ex, ey);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawBinaryInside(time, open) {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = "rgba(0,3,1,0.98)";
    ctx.fillRect(-1.4, -1.25, 2.8, 2.5);
    ctx.font = `${0.13 + open * 0.04}px ui-monospace, SFMono-Regular, Menlo, monospace`;
    ctx.textAlign = "center";
    ctx.fillStyle = `rgba(49,255,100,${0.66 + open * 0.28})`;
    ctx.shadowColor = "rgba(39,255,99,0.68)";
    ctx.shadowBlur = 0.04 + open * 0.06;
    const columns = 13;
    const rows = 20;
    const speed = CONFIG.performance.reducedMotion ? 0.0003 : 0.0012;
    const offset = (time * speed + this.binaryOffset * 0.002) % 0.18;
    for (let c = 0; c < columns; c++) {
      const x = -1.2 + c * 0.2;
      for (let r = 0; r < rows; r++) {
        const y = -1.18 + ((r * 0.16 + offset + c * 0.025) % 2.36);
        const bit = (c + r + Math.floor(this.binaryOffset / 9)) % 2 ? "1" : "0";
        ctx.fillText(bit, x, y);
      }
    }
    ctx.restore();
  }
}
