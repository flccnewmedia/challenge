import * as THREE from "three";
import { CONFIG } from "../config.js";

export function buildMatrixRoom(world) {
  world.clearWorld();
  const group = new THREE.Group();
  const material = new THREE.PointsMaterial({
    color: CONFIG.colors.matrix,
    size: 0.035,
    transparent: true,
    opacity: 0.82,
    blending: THREE.AdditiveBlending
  });
  const count = CONFIG.performance.particleCount;
  const positions = new Float32Array(count * 3);
  const speeds = [];
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 7;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 5.2;
    positions[i * 3 + 2] = -Math.random() * 5.4;
    speeds.push(0.18 + Math.random() * 0.5);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const points = new THREE.Points(geometry, material);
  group.add(points);
  group.userData.update = (dt, time) => {
    const pos = geometry.attributes.position.array;
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 1] -= speeds[i] * dt * (CONFIG.performance.reducedMotion ? 0.3 : 1);
      if (pos[i * 3 + 1] < -2.8) pos[i * 3 + 1] = 2.8;
    }
    geometry.attributes.position.needsUpdate = true;
    material.opacity = 0.72 + Math.sin(time * 3.4) * 0.1;
  };
  world.worldGroup.add(group);
}
