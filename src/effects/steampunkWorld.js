import * as THREE from "three";
import { CONFIG } from "../config.js";

export function buildSteampunkWorld(world) {
  world.clearWorld();
  const group = new THREE.Group();
  const brass = new THREE.MeshStandardMaterial({ color: CONFIG.colors.brass, roughness: 0.28, metalness: 0.75, emissive: 0x3b2107, emissiveIntensity: 0.2 });
  const pipeMat = new THREE.MeshStandardMaterial({ color: 0x6d4930, roughness: 0.4, metalness: 0.6 });

  for (let i = 0; i < 5; i++) {
    const gear = new THREE.Mesh(new THREE.TorusGeometry(0.28 + i * 0.05, 0.035, 8, 18), brass);
    gear.position.set(-2 + i, Math.sin(i) * 0.7, -1.8 - i * 0.18);
    gear.userData.spin = i % 2 ? -1 : 1;
    group.add(gear);
  }
  for (let i = 0; i < 4; i++) {
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 3.6, 16), pipeMat);
    pipe.rotation.z = Math.PI / 2;
    pipe.position.set(0, -1.25 + i * 0.55, -2.4);
    group.add(pipe);
  }
  group.userData.update = (dt) => {
    group.children.forEach((child) => {
      if (child.userData.spin) child.rotation.z += dt * child.userData.spin;
    });
  };
  world.worldGroup.add(group);
}
