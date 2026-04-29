import * as THREE from "three";
import { CONFIG } from "../config.js";

export function buildBeachWorld(world) {
  world.clearWorld();
  const group = new THREE.Group();
  const sky = new THREE.MeshBasicMaterial({ color: CONFIG.colors.beachSky, transparent: true, opacity: 0.28 });
  const sand = new THREE.MeshBasicMaterial({ color: CONFIG.colors.beachSand, transparent: true, opacity: 0.34 });
  const sunMat = new THREE.MeshBasicMaterial({ color: 0xfff27a, transparent: true, opacity: 0.78 });
  const horizon = new THREE.Mesh(new THREE.PlaneGeometry(8, 3.5), sky);
  horizon.position.set(0, 0.7, -3);
  const beach = new THREE.Mesh(new THREE.PlaneGeometry(8, 2.2), sand);
  beach.position.set(0, -1.5, -2.8);
  const sun = new THREE.Mesh(new THREE.CircleGeometry(0.42, 48), sunMat);
  sun.position.set(1.85, 1.55, -2.2);
  group.add(horizon, beach, sun);
  group.userData.update = (dt, time) => {
    sun.position.y = 1.55 + Math.sin(time) * 0.05;
  };
  world.worldGroup.add(group);
}
