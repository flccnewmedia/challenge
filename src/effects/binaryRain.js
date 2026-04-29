import { CONFIG } from "../config.js";

export class BinaryRain {
  constructor() {
    this.columns = [];
    this.active = false;
  }

  resize(width, height) {
    const count = Math.ceil(width / 18);
    this.columns = Array.from({ length: count }, (_, i) => ({
      x: i * 18,
      y: Math.random() * height,
      speed: 1.2 + Math.random() * 3.3,
      alpha: 0.25 + Math.random() * 0.65
    }));
  }

  setActive(active) {
    this.active = active;
  }

  draw(ctx, width, height) {
    if (!this.active) return;
    ctx.save();
    ctx.fillStyle = "rgba(0, 8, 3, 0.22)";
    ctx.fillRect(0, 0, width, height);
    ctx.font = "16px ui-monospace, SFMono-Regular, Menlo, monospace";
    for (const column of this.columns) {
      column.y += CONFIG.performance.reducedMotion ? 0.4 : column.speed;
      if (column.y > height + 80) column.y = -80;
      for (let i = 0; i < 16; i++) {
        ctx.fillStyle = `rgba(45,255,95,${Math.max(0, column.alpha - i * 0.045)})`;
        ctx.fillText(Math.random() > 0.5 ? "1" : "0", column.x, column.y - i * 22);
      }
    }
    ctx.restore();
  }
}
