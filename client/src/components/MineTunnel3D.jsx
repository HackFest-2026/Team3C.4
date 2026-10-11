import React, { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * DARK 3D mine-tunnel entrance — "secure entry into a smart mining facility".
 * Purely decorative login backdrop rendered with Three.js: irregular rock
 * tunnel, gold-edged entrance arch, rails + sleepers, amber safety lamps, an
 * approaching mine cart with a blinking beacon, cyan biometric scan rings
 * travelling toward the viewer and drifting dust. Contains NO application
 * logic and is intentionally distinct from the light dashboard background.
 */
export default function MineTunnel3D() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x07090c, 16, 82);

    const viewW = () => window.innerWidth;
    const viewH = () => window.innerHeight;

    const camera = new THREE.PerspectiveCamera(58, viewW() / viewH(), 0.1, 300);
    camera.position.set(0, 0.5, 16);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(viewW(), viewH());
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const disposables = [];

    // ---------- Ambient fill ----------
    scene.add(new THREE.AmbientLight(0x8fa3b5, 0.4));
    const mouthLight = new THREE.DirectionalLight(0xbfd4e6, 0.5);
    mouthLight.position.set(0, 6, 22);
    scene.add(mouthLight);

    // ---------- Rock tunnel (viewed from inside, open ends) ----------
    const tunnelGeo = new THREE.CylinderGeometry(11, 12.5, 92, 16, 26, true);
    const pos = tunnelGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const n = Math.sin(x * 1.7 + y * 0.6) * 0.4 + Math.cos(z * 1.3 + y * 0.9) * 0.4;
      const len = Math.hypot(x, z) || 1;
      pos.setX(i, x + (x / len) * n);
      pos.setZ(i, z + (z / len) * n);
    }
    tunnelGeo.computeVertexNormals();
    const tunnelMat = new THREE.MeshStandardMaterial({
      color: 0x2a2118,
      roughness: 1,
      metalness: 0.03,
      flatShading: true,
      side: THREE.BackSide,
    });
    const tunnel = new THREE.Mesh(tunnelGeo, tunnelMat);
    tunnel.rotation.x = Math.PI / 2;
    tunnel.position.z = -32;
    scene.add(tunnel);
    disposables.push(tunnelGeo, tunnelMat);

    // tunnel floor
    const floorGeo = new THREE.PlaneGeometry(26, 92);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x1b150f, roughness: 1 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, -8, -32);
    scene.add(floor);
    disposables.push(floorGeo, floorMat);

    // ---------- Entrance arch with gold emissive edge ----------
    const archMat = new THREE.MeshStandardMaterial({ color: 0x3a3f46, roughness: 0.5, metalness: 0.6 });
    const archGeo = new THREE.TorusGeometry(11.6, 0.45, 10, 48, Math.PI);
    const arch = new THREE.Mesh(archGeo, archMat);
    arch.position.set(0, -8, 6);
    scene.add(arch);
    disposables.push(archMat, archGeo);

    const edgeMat = new THREE.MeshBasicMaterial({ color: 0xffc107 });
    const edgeGeo = new THREE.TorusGeometry(11.6, 0.1, 8, 64, Math.PI);
    const edge = new THREE.Mesh(edgeGeo, edgeMat);
    edge.position.set(0, -8, 6.45);
    scene.add(edge);
    disposables.push(edgeMat, edgeGeo);

    // arch side pillars
    const pillarGeo = new THREE.BoxGeometry(1.1, 13, 1.1);
    const pillarL = new THREE.Mesh(pillarGeo, archMat);
    pillarL.position.set(-11.6, -7.5, 6);
    const pillarR = new THREE.Mesh(pillarGeo, archMat);
    pillarR.position.set(11.6, -7.5, 6);
    scene.add(pillarL, pillarR);
    disposables.push(pillarGeo);

    // ---------- Rails + sleepers ----------
    const railMat = new THREE.MeshStandardMaterial({ color: 0x7d8792, roughness: 0.35, metalness: 0.8 });
    const railGeo = new THREE.BoxGeometry(0.24, 0.24, 86);
    const sleeperMat = new THREE.MeshStandardMaterial({ color: 0x2e241a, roughness: 1 });
    const sleeperGeo = new THREE.BoxGeometry(4.8, 0.18, 0.75);
    disposables.push(railMat, railGeo, sleeperMat, sleeperGeo);
    [-1.8, 1.8].forEach((x) => {
      const rail = new THREE.Mesh(railGeo, railMat);
      rail.position.set(x, -7.7, -30);
      scene.add(rail);
    });
    for (let i = 0; i < 24; i++) {
      const s = new THREE.Mesh(sleeperGeo, sleeperMat);
      s.position.set(0, -7.85, 9 - i * 4);
      scene.add(s);
    }

    // ---------- Amber wall lamps ----------
    const lampMat = new THREE.MeshStandardMaterial({
      color: 0xffb02e,
      emissive: 0xff9d00,
      emissiveIntensity: 1.7,
    });
    const lampGeo = new THREE.SphereGeometry(0.38, 10, 10);
    disposables.push(lampMat, lampGeo);
    const lampZs = [-2, -16, -30, -44];
    lampZs.forEach((z, i) => {
      [-9.6, 9.6].forEach((x) => {
        const lamp = new THREE.Mesh(lampGeo, lampMat);
        lamp.position.set(x, -1.4, z);
        scene.add(lamp);
      });
      if (i < 2) {
        const pl = new THREE.PointLight(0xff9d00, 16, 24, 1.8);
        pl.position.set(0, -1, z - 4);
        scene.add(pl);
      }
    });

    // ---------- Mine cart rolling in from the depth, blinking beacon ----------
    const cart = new THREE.Group();
    const cartBodyMat = new THREE.MeshStandardMaterial({ color: 0x4a5560, roughness: 0.6, metalness: 0.4 });
    const cartBodyGeo = new THREE.BoxGeometry(3.4, 1.7, 2.3);
    const cartOreMat = new THREE.MeshStandardMaterial({ color: 0x8a6a44, roughness: 1, flatShading: true });
    const cartOreGeo = new THREE.IcosahedronGeometry(0.95, 0);
    disposables.push(cartBodyMat, cartBodyGeo, cartOreMat, cartOreGeo);
    const cartBody = new THREE.Mesh(cartBodyGeo, cartBodyMat);
    cart.add(cartBody);
    const ore1 = new THREE.Mesh(cartOreGeo, cartOreMat);
    ore1.position.set(-0.6, 1.0, 0);
    const ore2 = new THREE.Mesh(cartOreGeo, cartOreMat);
    ore2.position.set(0.75, 0.9, 0.2);
    ore2.scale.setScalar(0.75);
    cart.add(ore1, ore2);
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0xff5a3c });
    const beaconGeo = new THREE.SphereGeometry(0.17, 8, 8);
    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.position.set(0, 1.35, 0);
    cart.add(beacon);
    disposables.push(beaconMat, beaconGeo);
    cart.position.set(0, -6.85, -48);
    scene.add(cart);

    // ---------- Cyan biometric scan rings approaching the viewer ----------
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x00d2ff, transparent: true, opacity: 0.5 });
    const ringGeo = new THREE.TorusGeometry(6.6, 0.06, 8, 64);
    disposables.push(ringMat, ringGeo);
    const rings = [0, 1, 2].map((i) => {
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.userData.phase = i / 3;
      scene.add(ring);
      return ring;
    });

    // ---------- Gold dust particles ----------
    const dustCount = 280;
    const dustGeo = new THREE.BufferGeometry();
    const dustPos = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      dustPos[i * 3] = (Math.random() - 0.5) * 19;
      dustPos[i * 3 + 1] = Math.random() * 16 - 8;
      dustPos[i * 3 + 2] = -Math.random() * 62 + 8;
    }
    dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
    const dustMat = new THREE.PointsMaterial({
      color: 0xffc107,
      size: 0.13,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const dust = new THREE.Points(dustGeo, dustMat);
    scene.add(dust);
    disposables.push(dustGeo, dustMat);

    // ---------- Mouse parallax ----------
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;
    const handleMouseMove = (e) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", handleMouseMove);

    const handleResize = () => {
      camera.aspect = viewW() / viewH();
      camera.updateProjectionMatrix();
      renderer.setSize(viewW(), viewH());
    };
    window.addEventListener("resize", handleResize);

    // ---------- Animation loop ----------
    const clock = new THREE.Clock();
    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      targetX += (mouseX * 2.2 - targetX) * 0.045;
      targetY += (-mouseY * 1.2 - targetY) * 0.045;
      camera.position.x = targetX;
      camera.position.y = 0.5 + targetY + Math.sin(t * 0.6) * 0.18;
      camera.lookAt(0, -1.5, -30);

      // gold arch edge subtle pulse
      edgeMat.color.setHSL(0.125, 1, 0.5 + Math.sin(t * 2) * 0.08);

      // mine cart slowly rolling toward the entrance, then resetting
      const cycle = (t * 0.9) % 28;
      cart.position.z = -48 + cycle;
      cart.position.x = Math.sin(t * 0.7) * 0.12;
      beacon.visible = Math.sin(t * 6) > -0.2;

      // biometric scan rings travelling from depth to the mouth
      rings.forEach((ring) => {
        const p = (t * 0.12 + ring.userData.phase) % 1;
        ring.position.z = -54 + p * 62;
        ring.position.y = -2;
        ring.scale.setScalar(0.55 + p * 0.75);
      });
      ringMat.opacity = 0.32 + Math.sin(t * 1.5) * 0.16;

      // drifting dust
      const dpos = dustGeo.attributes.position.array;
      for (let i = 0; i < dustCount; i++) {
        dpos[i * 3 + 1] += 0.008;
        dpos[i * 3 + 2] += 0.02;
        if (dpos[i * 3 + 1] > 8) dpos[i * 3 + 1] = -8;
        if (dpos[i * 3 + 2] > 10) dpos[i * 3 + 2] = -60;
      }
      dustGeo.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      if (container && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      disposables.forEach((d) => d.dispose());
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 1,
        overflow: "hidden",
      }}
      aria-hidden="true"
    />
  );
}
