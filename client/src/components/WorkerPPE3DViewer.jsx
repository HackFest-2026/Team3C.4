import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

/**
 * WorkerPPE3DViewer
 * Interactive, rotatable & zoomable 3D human worker model visualizing PPE detection states.
 * Colors and highlight shaders dynamically reflect live inference for Helmet, Goggles, and Face Mask.
 */
export default function WorkerPPE3DViewer({
  helmetStatus = "Unknown",
  gogglesStatus = "Unknown",
  maskStatus = "Unknown",
}) {
  const mountRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const modelGroupRef = useRef(null);
  const partsRef = useRef({});
  const isDraggingRef = useRef(false);
  const prevPointerRef = useRef({ x: 0, y: 0 });
  const animFrameIdRef = useRef(null);

  const [isAutoRotate, setIsAutoRotate] = useState(true);

  // Setup Three.js scene on mount
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 320;
    const height = container.clientHeight || 340;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 1.15, 3.4);
    camera.lookAt(0, 1.05, 0);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xfff7ed, 1.3);
    dirLight1.position.set(2, 4, 3);
    scene.add(dirLight1);

    const rimLight = new THREE.DirectionalLight(0xf59e0b, 0.7);
    rimLight.position.set(-3, 2, -2);
    scene.add(rimLight);

    // 5. Worker 3D Hierarchy
    const modelGroup = new THREE.Group();
    modelGroupRef.current = modelGroup;
    scene.add(modelGroup);

    // Base pedestal / scan ring
    const pedestalGeo = new THREE.CylinderGeometry(0.9, 1.0, 0.08, 32);
    const pedestalMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.6,
      roughness: 0.4,
    });
    const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
    pedestal.position.y = -0.04;
    modelGroup.add(pedestal);

    const ringGeo = new THREE.RingGeometry(0.95, 1.05, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xd97706,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.01;
    modelGroup.add(ring);

    // Torso with High-Visibility Mining Vest
    const torsoGeo = new THREE.CylinderGeometry(0.42, 0.36, 1.0, 24);
    const vestMat = new THREE.MeshStandardMaterial({
      color: 0xea580c, // mining orange safety vest
      roughness: 0.5,
      metalness: 0.1,
    });
    const torso = new THREE.Mesh(torsoGeo, vestMat);
    torso.position.y = 0.5;
    modelGroup.add(torso);

    // Reflective Vest Stripes (Silver)
    const stripeGeo = new THREE.CylinderGeometry(0.43, 0.43, 0.08, 24);
    const stripeMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.8,
      roughness: 0.2,
      emissive: 0x94a3b8,
      emissiveIntensity: 0.2,
    });
    const stripe1 = new THREE.Mesh(stripeGeo, stripeMat);
    stripe1.position.y = 0.7;
    modelGroup.add(stripe1);
    const stripe2 = new THREE.Mesh(stripeGeo, stripeMat);
    stripe2.position.y = 0.4;
    modelGroup.add(stripe2);

    // Neck
    const neckGeo = new THREE.CylinderGeometry(0.16, 0.18, 0.22, 16);
    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xd4a373,
      roughness: 0.6,
    });
    const neck = new THREE.Mesh(neckGeo, skinMat);
    neck.position.y = 1.05;
    modelGroup.add(neck);

    // Head
    const headGeo = new THREE.SphereGeometry(0.32, 28, 28);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.y = 1.34;
    modelGroup.add(head);

    // Shoulders
    const shoulderGeo = new THREE.CylinderGeometry(0.12, 0.1, 0.65, 16);
    const armL = new THREE.Mesh(shoulderGeo, vestMat);
    armL.position.set(-0.52, 0.62, 0);
    armL.rotation.z = Math.PI / 14;
    modelGroup.add(armL);

    const armR = new THREE.Mesh(shoulderGeo, vestMat);
    armR.position.set(0.52, 0.62, 0);
    armR.rotation.z = -Math.PI / 14;
    modelGroup.add(armR);

    // -------------------------------------------------------------------------
    // 6. THREE PPE COMPONENTS (HELMET, GOGGLES, MASK)
    // -------------------------------------------------------------------------

    // A. SAFETY HELMET GROUP
    const helmetGroup = new THREE.Group();
    helmetGroup.position.set(0, 1.48, 0);

    const helmetDomeGeo = new THREE.SphereGeometry(
      0.37,
      32,
      18,
      0,
      Math.PI * 2,
      0,
      Math.PI / 1.85
    );
    const helmetMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      roughness: 0.35,
      metalness: 0.2,
    });
    const helmetDome = new THREE.Mesh(helmetDomeGeo, helmetMat);
    helmetDome.position.y = 0.05;
    helmetGroup.add(helmetDome);

    // Helmet brim
    const brimGeo = new THREE.CylinderGeometry(0.44, 0.44, 0.035, 32);
    const brim = new THREE.Mesh(brimGeo, helmetMat);
    brim.position.set(0, 0.03, 0.03);
    helmetGroup.add(brim);

    // Helmet lamp bracket (Mining Headlamp)
    const lampGeo = new THREE.BoxGeometry(0.09, 0.07, 0.07);
    const lampMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.7,
    });
    const lamp = new THREE.Mesh(lampGeo, lampMat);
    lamp.position.set(0, 0.14, 0.38);
    helmetGroup.add(lamp);

    const lampLensGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.02, 16);
    const lampLensMat = new THREE.MeshBasicMaterial({ color: 0xfffbeb });
    const lampLens = new THREE.Mesh(lampLensGeo, lampLensMat);
    lampLens.rotation.x = Math.PI / 2;
    lampLens.position.set(0, 0.14, 0.42);
    helmetGroup.add(lampLens);

    modelGroup.add(helmetGroup);

    // B. SAFETY GOGGLES GROUP
    const gogglesGroup = new THREE.Group();
    gogglesGroup.position.set(0, 1.37, 0.28);

    const lensGeo = new THREE.BoxGeometry(0.38, 0.13, 0.09);
    const gogglesMat = new THREE.MeshPhysicalMaterial({
      color: 0x06b6d4,
      roughness: 0.1,
      metalness: 0.1,
      transmission: 0.6,
      transparent: true,
      opacity: 0.85,
    });
    const lens = new THREE.Mesh(lensGeo, gogglesMat);
    gogglesGroup.add(lens);

    // Goggle strap wrapping to sides
    const strapGeo = new THREE.BoxGeometry(0.44, 0.03, 0.38);
    const strapMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });
    const strap = new THREE.Mesh(strapGeo, strapMat);
    strap.position.set(0, 0, -0.15);
    gogglesGroup.add(strap);

    modelGroup.add(gogglesGroup);

    // C. SAFETY MASK GROUP
    const maskGroup = new THREE.Group();
    maskGroup.position.set(0, 1.21, 0.28);

    const maskGeo = new THREE.ConeGeometry(0.2, 0.22, 18);
    const maskMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      roughness: 0.6,
    });
    const mask = new THREE.Mesh(maskGeo, maskMat);
    mask.rotation.x = -Math.PI / 4;
    mask.position.set(0, 0, 0.04);
    maskGroup.add(mask);

    // Mask Exhalation Valve
    const valveGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.03, 16);
    const valveMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.4 });
    const valve = new THREE.Mesh(valveGeo, valveMat);
    valve.rotation.x = Math.PI / 2;
    valve.position.set(0, -0.01, 0.14);
    maskGroup.add(valve);

    modelGroup.add(maskGroup);

    // Store mesh references for dynamic material updates
    partsRef.current = {
      helmetMat,
      gogglesMat,
      maskMat,
      helmetGroup,
      gogglesGroup,
      maskGroup,
    };

    // 7. Render Loop with smooth idle rotation
    let clock = new THREE.Clock();
    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      if (isAutoRotate && !isDraggingRef.current && modelGroupRef.current) {
        modelGroupRef.current.rotation.y += delta * 0.4;
      }

      renderer.render(scene, camera);
    };
    animate();

    // 8. Resize Handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const newW = container.clientWidth || 320;
      const newH = container.clientHeight || 340;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Update PPE Part Colors and Materials based on props
  useEffect(() => {
    const parts = partsRef.current;
    if (!parts || !parts.helmetMat) return;

    // Helper to apply status colors
    const applyPPEStatus = (mat, group, status, detectedColor, emissiveColor) => {
      if (!mat) return;
      if (status === "Detected") {
        mat.color.setHex(detectedColor);
        mat.emissive.setHex(emissiveColor);
        mat.emissiveIntensity = 0.45;
        mat.transparent = false;
        mat.opacity = 1.0;
        mat.wireframe = false;
        if (group) group.visible = true;
      } else if (status === "Missing") {
        mat.color.setHex(0xef4444);
        mat.emissive.setHex(0xb91c1c);
        mat.emissiveIntensity = 0.6;
        mat.transparent = true;
        mat.opacity = 0.85;
        mat.wireframe = true;
        if (group) group.visible = true;
      } else {
        // Unknown / Not Verified: semi-transparent neutral indicator
        mat.color.setHex(0x94a3b8);
        mat.emissive.setHex(0x334155);
        mat.emissiveIntensity = 0.15;
        mat.transparent = true;
        mat.opacity = 0.45;
        mat.wireframe = false;
        if (group) group.visible = true;
      }
    };

    // 1. Safety Helmet
    applyPPEStatus(parts.helmetMat, parts.helmetGroup, helmetStatus, 0x10b981, 0x059669);

    // 2. Safety Goggles
    applyPPEStatus(parts.gogglesMat, parts.gogglesGroup, gogglesStatus, 0x06b6d4, 0x0284c7);

    // 3. Safety Mask
    applyPPEStatus(parts.maskMat, parts.maskGroup, maskStatus, 0x10b981, 0x059669);
  }, [helmetStatus, gogglesStatus, maskStatus]);

  // Pointer Interaction Handlers for rotating & zooming
  const handlePointerDown = (e) => {
    isDraggingRef.current = true;
    prevPointerRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e) => {
    if (!isDraggingRef.current || !modelGroupRef.current) return;
    const deltaX = e.clientX - prevPointerRef.current.x;
    const deltaY = e.clientY - prevPointerRef.current.y;

    modelGroupRef.current.rotation.y += deltaX * 0.012;
    modelGroupRef.current.rotation.x = Math.max(
      -0.3,
      Math.min(0.4, modelGroupRef.current.rotation.x + deltaY * 0.008)
    );

    prevPointerRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e) => {
    if (!cameraRef.current) return;
    e.preventDefault();
    const zoomDelta = e.deltaY * 0.003;
    cameraRef.current.position.z = Math.max(
      2.0,
      Math.min(5.5, cameraRef.current.position.z + zoomDelta)
    );
  };

  const handleResetView = () => {
    if (modelGroupRef.current) {
      modelGroupRef.current.rotation.set(0, 0, 0);
    }
    if (cameraRef.current) {
      cameraRef.current.position.set(0, 1.15, 3.4);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        background: "linear-gradient(145deg, #182230 0%, #0f172a 100%)",
        borderRadius: "14px",
        border: "1px solid rgba(217, 119, 6, 0.3)",
        overflow: "hidden",
        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.25)",
      }}
    >
      {/* 3D Viewport Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 14px",
          borderBottom: "1px solid rgba(217, 119, 6, 0.2)",
          background: "rgba(15, 23, 42, 0.6)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "14px" }}>🧍</span>
          <span style={{ fontSize: "11px", fontWeight: 800, color: "#fbbf24", textTransform: "uppercase" }}>
            3D PPE Twin Visualizer
          </span>
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          <button
            onClick={() => setIsAutoRotate(!isAutoRotate)}
            style={{
              background: isAutoRotate ? "rgba(245, 158, 11, 0.2)" : "rgba(100, 116, 139, 0.2)",
              border: `1px solid ${isAutoRotate ? "#f59e0b" : "#64748b"}`,
              color: isAutoRotate ? "#fbbf24" : "#cbd5e1",
              borderRadius: "6px",
              padding: "3px 8px",
              fontSize: "10px",
              fontWeight: 700,
              cursor: "pointer",
            }}
            title="Toggle Continuous 3D Rotation"
          >
            {isAutoRotate ? "Auto-Spin ON" : "Auto-Spin OFF"}
          </button>
          <button
            onClick={handleResetView}
            style={{
              background: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              color: "#cbd5e1",
              borderRadius: "6px",
              padding: "3px 8px",
              fontSize: "10px",
              fontWeight: 700,
              cursor: "pointer",
            }}
            title="Reset View Orientation"
          >
            Reset
          </button>
        </div>
      </div>

      {/* 3D Canvas Mount Point */}
      <div
        ref={mountRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onWheel={handleWheel}
        style={{
          width: "100%",
          height: "260px",
          cursor: "grab",
          touchAction: "none",
          position: "relative",
        }}
      />

      {/* 3D Visual Legend & Hint */}
      <div
        style={{
          padding: "8px 12px",
          background: "rgba(15, 23, 42, 0.8)",
          borderTop: "1px solid rgba(217, 119, 6, 0.15)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "8px",
          fontSize: "10px",
        }}
      >
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "#34d399", fontWeight: 700 }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
            Detected
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "#f87171", fontWeight: 700 }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ef4444", display: "inline-block" }} />
            Missing
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "#94a3b8", fontWeight: 700 }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#64748b", display: "inline-block" }} />
            Not Verified
          </span>
        </div>
        <div style={{ color: "#64748b", fontStyle: "italic" }}>
          * Drag to rotate • Scroll to zoom
        </div>
      </div>
    </div>
  );
}
