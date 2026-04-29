import * as THREE from "three";
import { CONFIG } from "./config.js";

export class ARWorld {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, CONFIG.performance.maxDpr));
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(58, 1, 0.01, 100);
    this.camera.position.z = 4.6;
    this.clock = new THREE.Clock();
    this.pills = new THREE.Group();
    this.worldGroup = new THREE.Group();
    this.scene.add(this.worldGroup, this.pills);
    this.selectedWorld = null;
    this.createLights();
    this.createPills();
    this.resize();
    window.addEventListener("resize", () => this.resize());
  }

  createLights() {
    this.scene.add(new THREE.AmbientLight(0xffffff, 1.1));
    const key = new THREE.DirectionalLight(0x9effb5, 2.4);
    key.position.set(2, 4, 5);
    this.scene.add(key);
  }

  createPills() {
    this.pills.visible = false;
    const makePill = (color, x, label) => {
      const group = new THREE.Group();
      const material = new THREE.MeshStandardMaterial({ color, roughness: 0.32, metalness: 0.15, emissive: color, emissiveIntensity: 0.16 });
      const capsule = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.62, 8, 24), material);
      capsule.rotation.z = Math.PI / 2;
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.54, 0.018, 10, 72), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.45 }));
      group.add(capsule, ring);
      group.position.set(x, -0.35, 0);
      group.userData.label = label;
      return group;
    };
    this.redPill = makePill(CONFIG.colors.red, -0.82, CONFIG.pills.redLabel);
    this.bluePill = makePill(CONFIG.colors.blue, 0.82, CONFIG.pills.blueLabel);
    this.pills.add(this.redPill, this.bluePill);
  }

  resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  showPills(show) {
    this.pills.visible = show;
  }

  setWorld(world) {
    this.selectedWorld = world;
  }

  update() {
    const dt = Math.min(this.clock.getDelta(), 0.05);
    const time = this.clock.elapsedTime;
    if (this.pills.visible) {
      this.pills.children.forEach((pill, index) => {
        pill.rotation.y = Math.sin(time * 1.4 + index) * 0.28;
        pill.position.y = -0.35 + Math.sin(time * 1.8 + index) * 0.04;
      });
    }
    this.worldGroup.children.forEach((child) => {
      if (child.userData.update) child.userData.update(dt, time);
    });
    this.renderer.render(this.scene, this.camera);
  }

  clearWorld() {
    while (this.worldGroup.children.length) this.worldGroup.remove(this.worldGroup.children[0]);
  }
}
