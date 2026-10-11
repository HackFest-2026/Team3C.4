import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

/**
 * MineGuard 3D Realistic Mining Digital Twin & Ambient Canvas
 * Fully procedural WebGL environment powered by Three.js
 * Features:
 * - Stepped open-pit mine with geological rock strata
 * - Heavy CAT/Komatsu-style mining haul trucks driving on haul roads with rotating wheels
 * - Heavy hydraulic mining excavator with articulating boom & bucket
 * - Primary crushing plant with overhead truss conveyor system
 * - Conical ore stockpiles and overburden dumps
 * - Digital twin telemetry nodes and safety zones
 * - Warm daylight industrial lighting matching the light premium theme
 */
export default function Mining3DCanvas({
  mode = "full", // "full" | "subtle" | "login" | "interactive"
  activeCameraPreset = "default",
  onPresetChange = null,
}) {
  const containerRef = useRef(null);
  const [internalPreset, setInternalPreset] = useState(activeCameraPreset || "overview");

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // -------------------------------------------------------------
    // SCENE, CAMERA, RENDERER
    // -------------------------------------------------------------
    const scene = new THREE.Scene();

    // Light-theme fog: soft warm ivory / peach champagne mist
    const isSubtle = mode === "subtle";
    const isLogin = mode === "login";
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const fogColor = isSubtle
      ? 0xfcf8f2
      : isLogin
      ? 0xfdf5ee
      : 0xfbf4eb;
    scene.fog = new THREE.FogExp2(fogColor, isSubtle ? 0.025 : 0.012);

    // Subtle background mode fills the viewport (fixed), so size to the window
    // to keep a correct aspect ratio regardless of how tall the page grows.
    const width = isSubtle ? window.innerWidth : container.clientWidth || window.innerWidth;
    const height = isSubtle ? window.innerHeight : container.clientHeight || window.innerHeight;

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.5, 1000);

    // Initial camera placement depending on mode
    if (isLogin) {
      camera.position.set(0, 10, 32);
    } else if (isSubtle) {
      camera.position.set(0, 18, 38);
    } else {
      camera.position.set(22, 20, 34);
    }

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // Master group for entire mining site
    const siteGroup = new THREE.Group();
    scene.add(siteGroup);

    // -------------------------------------------------------------
    // LIGHTING (Warm Industrial Daylight)
    // -------------------------------------------------------------
    // Ambient light - warm ivory sky fill
    const ambientLight = new THREE.AmbientLight(0xfff5ea, 0.85);
    scene.add(ambientLight);

    // Hemisphere light - Sky is warm cream, ground is warm ochre bounce
    const hemiLight = new THREE.HemisphereLight(0xfff7ed, 0xd4a373, 0.65);
    hemiLight.position.set(0, 50, 0);
    scene.add(hemiLight);

    // Primary Sun - Warm golden industrial sunlight
    const sunLight = new THREE.DirectionalLight(0xffecd1, 1.8);
    sunLight.position.set(45, 60, 35);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 150;
    sunLight.shadow.camera.left = -40;
    sunLight.shadow.camera.right = 40;
    sunLight.shadow.camera.top = 40;
    sunLight.shadow.camera.bottom = -40;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);

    // Soft secondary fill light from opposite angle
    const fillLight = new THREE.DirectionalLight(0xe0f2fe, 0.45);
    fillLight.position.set(-35, 30, -30);
    scene.add(fillLight);

    // -------------------------------------------------------------
    // SHARED MATERIALS (High-Visibility Industrial Mining Palette)
    // -------------------------------------------------------------
    const materials = {
      // Mining Yellow (Caterpillar / Komatsu equipment)
      miningYellow: new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        metalness: 0.25,
        roughness: 0.35,
      }),
      // Safety Orange
      safetyOrange: new THREE.MeshStandardMaterial({
        color: 0xea580c,
        metalness: 0.2,
        roughness: 0.4,
      }),
      // Heavy Industrial Steel / Dark Cast Iron
      darkSteel: new THREE.MeshStandardMaterial({
        color: 0x1f2937,
        metalness: 0.8,
        roughness: 0.3,
      }),
      // Industrial Structural Galvanized Steel
      galvSteel: new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        metalness: 0.6,
        roughness: 0.4,
      }),
      // Heavy-Duty Rubber Tires
      rubberTire: new THREE.MeshStandardMaterial({
        color: 0x111827,
        metalness: 0.05,
        roughness: 0.9,
      }),
      // Operator Glass Windows
      glass: new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        metalness: 0.9,
        roughness: 0.1,
        transparent: true,
        opacity: 0.75,
      }),
      // Geological Strata: Top Sandy Overburden
      sandstone: new THREE.MeshStandardMaterial({
        color: 0xe5c49e,
        roughness: 0.9,
        metalness: 0.05,
        flatShading: true,
      }),
      // Geological Strata: Iron Oxide / Copper Ore Layer
      oreRock: new THREE.MeshStandardMaterial({
        color: 0xb45309,
        roughness: 0.8,
        metalness: 0.2,
        flatShading: true,
      }),
      // Geological Strata: Deep Basalt / Slate Bedrock
      basalt: new THREE.MeshStandardMaterial({
        color: 0x475569,
        roughness: 0.85,
        metalness: 0.1,
        flatShading: true,
      }),
      // High-grade Mineral Ore (Golden/Copper Glimmer)
      goldMineral: new THREE.MeshStandardMaterial({
        color: 0xd97706,
        emissive: 0x78350f,
        emissiveIntensity: 0.3,
        metalness: 0.7,
        roughness: 0.3,
      }),
      // Haul Road Dirt / Gravel
      haulRoad: new THREE.MeshStandardMaterial({
        color: 0xc89d7c,
        roughness: 0.95,
        metalness: 0.0,
      }),
      // Emissive Headlights
      headlightGlow: new THREE.MeshBasicMaterial({
        color: 0xfef08a,
      }),
      // Safety Beacon Cyan
      beaconCyan: new THREE.MeshBasicMaterial({
        color: 0x0284c7,
        wireframe: true,
      }),
      // Safety Beacon Amber
      beaconAmber: new THREE.MeshBasicMaterial({
        color: 0xf59e0b,
      }),
    };

    // -------------------------------------------------------------
    // 1. OPEN-PIT MINE & TERRACED BENCHES
    // -------------------------------------------------------------
    const pitGroup = new THREE.Group();
    siteGroup.add(pitGroup);

    // Bench 1 (Top rim surface)
    const rimGeo = new THREE.CylinderGeometry(42, 44, 4, 32, 1, true);
    const rimMat = materials.sandstone;
    const rimMesh = new THREE.Mesh(rimGeo, rimMat);
    rimMesh.position.y = 2;
    rimMesh.receiveShadow = true;
    pitGroup.add(rimMesh);

    // Bench 2 (Upper terrace - sandstone & overburden)
    const bench1Geo = new THREE.CylinderGeometry(34, 38, 4.5, 32, 1, false);
    const bench1 = new THREE.Mesh(bench1Geo, materials.sandstone);
    bench1.position.y = -2;
    bench1.receiveShadow = true;
    pitGroup.add(bench1);

    // Bench 3 (Mid terrace - rich copper/iron ore layer)
    const bench2Geo = new THREE.CylinderGeometry(25, 29, 4.5, 32, 1, false);
    const bench2 = new THREE.Mesh(bench2Geo, materials.oreRock);
    bench2.position.y = -6;
    bench2.receiveShadow = true;
    pitGroup.add(bench2);

    // Bench 4 (Deep excavation pit floor - basalt bedrock)
    const bench3Geo = new THREE.CylinderGeometry(15, 20, 4.5, 28, 1, false);
    const bench3 = new THREE.Mesh(bench3Geo, materials.basalt);
    bench3.position.y = -10;
    bench3.receiveShadow = true;
    pitGroup.add(bench3);

    // Deepest pit bottom sump
    const pitFloorGeo = new THREE.CylinderGeometry(13, 14, 2, 24);
    const pitFloor = new THREE.Mesh(pitFloorGeo, materials.darkSteel);
    pitFloor.position.y = -13;
    pitFloor.receiveShadow = true;
    pitGroup.add(pitFloor);

    // Haul Road spiral tracks (Visual rings around benches)
    const roadRing1 = new THREE.Mesh(
      new THREE.RingGeometry(29, 34, 32),
      materials.haulRoad
    );
    roadRing1.rotation.x = -Math.PI / 2;
    roadRing1.position.y = 0.26;
    roadRing1.receiveShadow = true;
    pitGroup.add(roadRing1);

    const roadRing2 = new THREE.Mesh(
      new THREE.RingGeometry(20, 25, 32),
      materials.haulRoad
    );
    roadRing2.rotation.x = -Math.PI / 2;
    roadRing2.position.y = -3.74;
    roadRing2.receiveShadow = true;
    pitGroup.add(roadRing2);

    const roadRing3 = new THREE.Mesh(
      new THREE.RingGeometry(13, 17, 28),
      materials.haulRoad
    );
    roadRing3.rotation.x = -Math.PI / 2;
    roadRing3.position.y = -7.74;
    roadRing3.receiveShadow = true;
    pitGroup.add(roadRing3);

    // Geological ore veins & boulders on benches
    for (let i = 0; i < 18; i++) {
      const angle = (i / 18) * Math.PI * 2;
      const radius = 22 + Math.sin(i * 1.7) * 4;
      const rockGeo = new THREE.DodecahedronGeometry(0.8 + Math.random() * 0.9, 0);
      const rockMesh = new THREE.Mesh(
        rockGeo,
        i % 3 === 0 ? materials.goldMineral : materials.oreRock
      );
      rockMesh.position.set(
        Math.cos(angle) * radius,
        -3.4 + Math.random() * 0.4,
        Math.sin(angle) * radius
      );
      rockMesh.rotation.set(Math.random(), Math.random(), Math.random());
      rockMesh.castShadow = true;
      pitGroup.add(rockMesh);
    }

    // -------------------------------------------------------------
    // 2. PROCEDURAL HEAVY MINING HAUL TRUCK FACTORY
    // -------------------------------------------------------------
    function createHaulTruck(scale = 1.0, isHero = false) {
      const truck = new THREE.Group();

      // Main Chassis / Frame
      const chassisGeo = new THREE.BoxGeometry(3.6 * scale, 0.8 * scale, 7.2 * scale);
      const chassis = new THREE.Mesh(chassisGeo, materials.darkSteel);
      chassis.position.y = 1.4 * scale;
      chassis.castShadow = true;
      truck.add(chassis);

      // Heavy Front Bumper & Radiator Grille
      const bumperGeo = new THREE.BoxGeometry(3.8 * scale, 1.2 * scale, 1.0 * scale);
      const bumper = new THREE.Mesh(bumperGeo, materials.darkSteel);
      bumper.position.set(0, 1.2 * scale, 3.8 * scale);
      bumper.castShadow = true;
      truck.add(bumper);

      // Radiator Grille Accent
      const grilleGeo = new THREE.PlaneGeometry(2.4 * scale, 0.9 * scale);
      const grille = new THREE.Mesh(grilleGeo, materials.galvSteel);
      grille.position.set(0, 1.3 * scale, 4.32 * scale);
      truck.add(grille);

      // Twin Headlights
      const headL = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2 * scale, 0.2 * scale, 0.1 * scale, 12),
        materials.headlightGlow
      );
      headL.rotation.x = Math.PI / 2;
      headL.position.set(1.4 * scale, 1.3 * scale, 4.33 * scale);
      truck.add(headL);

      const headR = headL.clone();
      headR.position.x = -1.4 * scale;
      truck.add(headR);

      // Operator Deck & Cab (Offset to left side like real CAT haul trucks)
      const deckGeo = new THREE.BoxGeometry(3.6 * scale, 0.3 * scale, 3.0 * scale);
      const deck = new THREE.Mesh(deckGeo, materials.darkSteel);
      deck.position.set(0, 2.0 * scale, 2.0 * scale);
      truck.add(deck);

      const cabGeo = new THREE.BoxGeometry(1.4 * scale, 1.5 * scale, 1.8 * scale);
      const cab = new THREE.Mesh(cabGeo, materials.miningYellow);
      cab.position.set(-1.0 * scale, 2.9 * scale, 2.0 * scale);
      cab.castShadow = true;
      truck.add(cab);

      // Cab Windshield & Windows
      const windshieldGeo = new THREE.PlaneGeometry(1.2 * scale, 0.9 * scale);
      const windshield = new THREE.Mesh(windshieldGeo, materials.glass);
      windshield.position.set(-1.0 * scale, 3.0 * scale, 2.92 * scale);
      truck.add(windshield);

      const sideWinGeo = new THREE.PlaneGeometry(1.4 * scale, 0.8 * scale);
      const sideWin = new THREE.Mesh(sideWinGeo, materials.glass);
      sideWin.rotation.y = -Math.PI / 2;
      sideWin.position.set(-1.72 * scale, 3.0 * scale, 2.0 * scale);
      truck.add(sideWin);

      // Canopy guard extending over the cab
      const canopyGeo = new THREE.BoxGeometry(3.8 * scale, 0.3 * scale, 2.2 * scale);
      const canopy = new THREE.Mesh(canopyGeo, materials.miningYellow);
      canopy.position.set(0, 4.0 * scale, 2.4 * scale);
      canopy.castShadow = true;
      truck.add(canopy);

      // Massive Dump Bed (Tilted hopper)
      const bedGroup = new THREE.Group();
      bedGroup.position.set(0, 2.2 * scale, -0.6 * scale);

      // Bed floor
      const bedFloor = new THREE.Mesh(
        new THREE.BoxGeometry(3.6 * scale, 0.4 * scale, 5.0 * scale),
        materials.miningYellow
      );
      bedFloor.castShadow = true;
      bedGroup.add(bedFloor);

      // Bed side walls
      const wallL = new THREE.Mesh(
        new THREE.BoxGeometry(0.3 * scale, 1.6 * scale, 5.0 * scale),
        materials.miningYellow
      );
      wallL.position.set(1.8 * scale, 0.9 * scale, 0);
      bedGroup.add(wallL);

      const wallR = new THREE.Mesh(
        new THREE.BoxGeometry(0.3 * scale, 1.6 * scale, 5.0 * scale),
        materials.miningYellow
      );
      wallR.position.set(-1.8 * scale, 0.9 * scale, 0);
      bedGroup.add(wallR);

      // Front wall of bed
      const wallF = new THREE.Mesh(
        new THREE.BoxGeometry(3.6 * scale, 1.8 * scale, 0.3 * scale),
        materials.miningYellow
      );
      wallF.position.set(0, 1.0 * scale, 2.35 * scale);
      bedGroup.add(wallF);

      // Mineral Ore Payload in Dump Bed
      const orePayloadGeo = new THREE.DodecahedronGeometry(1.6 * scale, 1);
      const orePayload = new THREE.Mesh(
        orePayloadGeo,
        isHero ? materials.goldMineral : materials.oreRock
      );
      orePayload.scale.set(1.0, 0.65, 1.3);
      orePayload.position.set(0, 1.2 * scale, 0);
      bedGroup.add(orePayload);

      truck.add(bedGroup);

      // Exhaust Stacks
      const exhaustGeo = new THREE.CylinderGeometry(0.12 * scale, 0.12 * scale, 1.8 * scale, 8);
      const exhaust = new THREE.Mesh(exhaustGeo, materials.galvSteel);
      exhaust.position.set(1.4 * scale, 3.4 * scale, 0.8 * scale);
      truck.add(exhaust);

      // Giant Mining Tires (6 wheels: 2 front, 4 rear duals)
      const wheelGeo = new THREE.CylinderGeometry(
        1.1 * scale,
        1.1 * scale,
        0.8 * scale,
        16
      );
      wheelGeo.rotateZ(Math.PI / 2);

      const wheels = [];

      // Front Left & Right
      const wFL = new THREE.Mesh(wheelGeo, materials.rubberTire);
      wFL.position.set(2.0 * scale, 1.1 * scale, 2.5 * scale);
      wFL.castShadow = true;
      truck.add(wFL);
      wheels.push(wFL);

      const wFR = new THREE.Mesh(wheelGeo, materials.rubberTire);
      wFR.position.set(-2.0 * scale, 1.1 * scale, 2.5 * scale);
      wFR.castShadow = true;
      truck.add(wFR);
      wheels.push(wFR);

      // Rear Dual Left
      const wRL1 = new THREE.Mesh(wheelGeo, materials.rubberTire);
      wRL1.position.set(1.8 * scale, 1.1 * scale, -2.0 * scale);
      wRL1.castShadow = true;
      truck.add(wRL1);
      wheels.push(wRL1);

      const wRL2 = new THREE.Mesh(wheelGeo, materials.rubberTire);
      wRL2.position.set(2.7 * scale, 1.1 * scale, -2.0 * scale);
      wRL2.castShadow = true;
      truck.add(wRL2);
      wheels.push(wRL2);

      // Rear Dual Right
      const wRR1 = new THREE.Mesh(wheelGeo, materials.rubberTire);
      wRR1.position.set(-1.8 * scale, 1.1 * scale, -2.0 * scale);
      wRR1.castShadow = true;
      truck.add(wRR1);
      wheels.push(wRR1);

      const wRR2 = new THREE.Mesh(wheelGeo, materials.rubberTire);
      wRR2.position.set(-2.7 * scale, 1.1 * scale, -2.0 * scale);
      wRR2.castShadow = true;
      truck.add(wRR2);
      wheels.push(wRR2);

      return { group: truck, wheels, bed: bedGroup };
    }

    // Instance 1: Haul Truck 1 (Traversing mid bench ring road)
    const truck1 = createHaulTruck(0.75);
    truck1.group.position.set(22, -3.7, 0);
    pitGroup.add(truck1.group);

    // Instance 2: Haul Truck 2 (Traversing upper bench)
    const truck2 = createHaulTruck(0.65);
    truck2.group.position.set(-30, 0.3, 0);
    pitGroup.add(truck2.group);

    // Instance 3: Hero Haul Truck for Login Scene or Foreground Showcase
    let heroTruck = null;
    if (isLogin) {
      heroTruck = createHaulTruck(1.3, true);
      heroTruck.group.position.set(-28, -2.5, 12);
      heroTruck.group.rotation.y = Math.PI / 2;
      siteGroup.add(heroTruck.group);
    }

    // -------------------------------------------------------------
    // 3. HEAVY HYDRAULIC MINING EXCAVATOR
    // -------------------------------------------------------------
    function createExcavator() {
      const excavator = new THREE.Group();

      // Dual Crawler Tracks
      const trackGeo = new THREE.BoxGeometry(1.2, 1.0, 6.0);
      const trackL = new THREE.Mesh(trackGeo, materials.darkSteel);
      trackL.position.set(1.8, 0.5, 0);
      trackL.castShadow = true;
      excavator.add(trackL);

      const trackR = new THREE.Mesh(trackGeo, materials.darkSteel);
      trackR.position.set(-1.8, 0.5, 0);
      trackR.castShadow = true;
      excavator.add(trackR);

      const undercarriage = new THREE.Mesh(
        new THREE.BoxGeometry(2.6, 0.6, 3.5),
        materials.darkSteel
      );
      undercarriage.position.y = 0.8;
      excavator.add(undercarriage);

      // Revolving Superstructure (Cab & Engine Body)
      const turret = new THREE.Group();
      turret.position.y = 1.3;

      const bodyGeo = new THREE.BoxGeometry(4.2, 2.2, 5.0);
      const body = new THREE.Mesh(bodyGeo, materials.miningYellow);
      body.position.set(0, 1.1, -0.6);
      body.castShadow = true;
      turret.add(body);

      // Heavy Counterweight at rear
      const counterweight = new THREE.Mesh(
        new THREE.BoxGeometry(4.4, 2.0, 1.4),
        materials.darkSteel
      );
      counterweight.position.set(0, 1.0, -3.3);
      counterweight.castShadow = true;
      turret.add(counterweight);

      // Elevated Operator Cab
      const exCab = new THREE.Mesh(
        new THREE.BoxGeometry(1.4, 1.8, 1.8),
        materials.glass
      );
      exCab.position.set(-1.6, 2.3, 1.4);
      turret.add(exCab);

      // Articulated Boom Base
      const boomGroup = new THREE.Group();
      boomGroup.position.set(0.8, 1.5, 2.0);

      // Boom Arm
      const boom = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 0.8, 6.5),
        materials.miningYellow
      );
      boom.position.set(0, 2.5, 2.6);
      boom.rotation.x = -Math.PI / 4;
      boom.castShadow = true;
      boomGroup.add(boom);

      // Stick / Dipper Arm
      const stickGroup = new THREE.Group();
      stickGroup.position.set(0, 4.8, 5.0);

      const stick = new THREE.Mesh(
        new THREE.BoxGeometry(0.7, 0.7, 4.5),
        materials.miningYellow
      );
      stick.position.set(0, -1.6, 1.5);
      stick.rotation.x = Math.PI / 3;
      stick.castShadow = true;
      stickGroup.add(stick);

      // Heavy Excavation Bucket
      const bucket = new THREE.Mesh(
        new THREE.BoxGeometry(1.8, 1.4, 1.6),
        materials.darkSteel
      );
      bucket.position.set(0, -3.0, 3.2);
      bucket.rotation.x = -Math.PI / 6;
      bucket.castShadow = true;
      stickGroup.add(bucket);

      boomGroup.add(stickGroup);
      turret.add(boomGroup);
      excavator.add(turret);

      return { group: excavator, turret, boomGroup, stickGroup };
    }

    const excavatorObj = createExcavator();
    excavatorObj.group.position.set(-14, -7.7, 10);
    excavatorObj.group.rotation.y = -Math.PI / 3;
    pitGroup.add(excavatorObj.group);

    // -------------------------------------------------------------
    // 4. CRUSHING PLANT & CONVEYOR SYSTEM
    // -------------------------------------------------------------
    const plantGroup = new THREE.Group();
    plantGroup.position.set(30, 2, -18);
    siteGroup.add(plantGroup);

    // Primary Crusher Building / Steel Tower
    const crusherTower = new THREE.Mesh(
      new THREE.BoxGeometry(6, 9, 6),
      materials.galvSteel
    );
    crusherTower.position.y = 4.5;
    crusherTower.castShadow = true;
    plantGroup.add(crusherTower);

    // Intake Hopper
    const hopper = new THREE.Mesh(
      new THREE.CylinderGeometry(3.5, 1.5, 2.5, 6),
      materials.darkSteel
    );
    hopper.position.set(0, 10.2, 0);
    plantGroup.add(hopper);

    // Industrial Storage Silos (Twin cylindrical tanks)
    const silo1 = new THREE.Mesh(
      new THREE.CylinderGeometry(2.4, 2.4, 8, 20),
      materials.galvSteel
    );
    silo1.position.set(-7, 4, 1);
    silo1.castShadow = true;
    plantGroup.add(silo1);

    const silo2 = silo1.clone();
    silo2.position.set(-7, 4, -4.5);
    plantGroup.add(silo2);

    // Inclined Truss Conveyor Gantry
    const conveyorGroup = new THREE.Group();
    conveyorGroup.position.set(0, 7, 0);

    const conveyorBelt = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.4, 26),
      materials.darkSteel
    );
    conveyorBelt.rotation.x = Math.PI / 8;
    conveyorBelt.position.set(-10, -3.5, 10);
    conveyorBelt.castShadow = true;
    conveyorGroup.add(conveyorBelt);

    // Ore chunks on conveyor belt
    for (let c = 0; c < 8; c++) {
      const oreChunk = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.35, 0),
        materials.goldMineral
      );
      oreChunk.position.set(
        (Math.random() - 0.5) * 0.6 - 10,
        -3.1 + (c / 8) * 4.5 - 2,
        (c / 8) * 22 - 1
      );
      conveyorGroup.add(oreChunk);
    }

    plantGroup.add(conveyorGroup);

    // Conical Ore Stockpiles
    const stockpileGeo = new THREE.ConeGeometry(5.5, 4.5, 16);
    const stockpile1 = new THREE.Mesh(stockpileGeo, materials.oreRock);
    stockpile1.position.set(-22, 2.2, 18);
    stockpile1.castShadow = true;
    plantGroup.add(stockpile1);

    const stockpile2 = new THREE.Mesh(stockpileGeo, materials.goldMineral);
    stockpile2.scale.set(0.75, 0.75, 0.75);
    stockpile2.position.set(-26, 1.7, 12);
    stockpile2.castShadow = true;
    plantGroup.add(stockpile2);

    // -------------------------------------------------------------
    // 5. DIGITAL TWIN TELEMETRY NODES (Holographic Markers)
    // -------------------------------------------------------------
    const telemetryNodes = [];
    const nodeLocations = [
      { name: "EX-04 Pit Face", pos: [-14, -4.0, 10], color: 0x0284c7 },
      { name: "Haul Route 1", pos: [22, -1.0, 0], color: 0xf59e0b },
      { name: "Primary Crusher", pos: [30, 12, -18], color: 0x10b981 },
      { name: "Slope Stability Radar", pos: [-28, 4.5, -15], color: 0x8b5cf6 },
    ];

    nodeLocations.forEach((loc) => {
      const nodeGroup = new THREE.Group();
      nodeGroup.position.set(...loc.pos);

      // Glowing inner beacon sphere
      const beaconSphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.35, 12, 12),
        new THREE.MeshBasicMaterial({ color: loc.color })
      );
      nodeGroup.add(beaconSphere);

      // Pulsing outer radar ring
      const ringGeo = new THREE.RingGeometry(0.8, 1.1, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: loc.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.75,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      nodeGroup.add(ring);

      // Vertical holographic coordinate tether
      const tetherGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, -2.5, 0),
      ]);
      const tether = new THREE.Line(
        tetherGeo,
        new THREE.LineBasicMaterial({
          color: loc.color,
          transparent: true,
          opacity: 0.5,
        })
      );
      nodeGroup.add(tether);

      siteGroup.add(nodeGroup);
      telemetryNodes.push({ group: nodeGroup, ring, baseScale: 1.0 });
    });

    // -------------------------------------------------------------
    // 6. ATMOSPHERIC WARM DUST / GOLDEN MINERAL PARTICLES
    // -------------------------------------------------------------
    const particleCount = isSubtle ? 120 : 260;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);

    for (let p = 0; p < particleCount * 3; p += 3) {
      particlePositions[p] = (Math.random() - 0.5) * 80;
      particlePositions[p + 1] = -12 + Math.random() * 26;
      particlePositions[p + 2] = (Math.random() - 0.5) * 80;
    }
    particleGeo.setAttribute(
      "position",
      new THREE.BufferAttribute(particlePositions, 3)
    );

    const particleMat = new THREE.PointsMaterial({
      color: 0xd97706,
      size: isSubtle ? 0.18 : 0.28,
      transparent: true,
      opacity: isSubtle ? 0.35 : 0.65,
      blending: THREE.NormalBlending,
    });
    const dustParticles = new THREE.Points(particleGeo, particleMat);
    siteGroup.add(dustParticles);

    // -------------------------------------------------------------
    // MOUSE PARALLAX & CAMERA INTERACTION
    // -------------------------------------------------------------
    let mouseX = 0;
    let mouseY = 0;
    let targetCameraX = camera.position.x;
    let targetCameraY = camera.position.y;
    let targetCameraZ = camera.position.z;

    const handleMouseMove = (e) => {
      const normX = (e.clientX / window.innerWidth - 0.5) * 2;
      const normY = (e.clientY / window.innerHeight - 0.5) * 2;
      mouseX = normX;
      mouseY = normY;
    };
    window.addEventListener("mousemove", handleMouseMove);

    const handleResize = () => {
      if (!container) return;
      const w = isSubtle ? window.innerWidth : container.clientWidth || window.innerWidth;
      const h = isSubtle ? window.innerHeight : container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    // -------------------------------------------------------------
    // ANIMATION LOOP
    // -------------------------------------------------------------
    let animationFrameId;
    const clock = new THREE.Clock();

    const animate = () => {
      if (prefersReducedMotion) {
        renderer.render(scene, camera);
        return;
      }
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // 1. Haul Truck 1 (Mid ring road travel)
      const truck1Angle = elapsedTime * 0.18;
      const truck1Radius = 22.5;
      truck1.group.position.x = Math.cos(truck1Angle) * truck1Radius;
      truck1.group.position.z = Math.sin(truck1Angle) * truck1Radius;
      truck1.group.rotation.y = -truck1Angle + Math.PI / 2;
      // Rotate wheels
      truck1.wheels.forEach((w) => {
        w.rotation.x += 0.08;
      });

      // 2. Haul Truck 2 (Upper rim travel)
      const truck2Angle = elapsedTime * 0.12 + Math.PI;
      const truck2Radius = 31.5;
      truck2.group.position.x = Math.cos(truck2Angle) * truck2Radius;
      truck2.group.position.z = Math.sin(truck2Angle) * truck2Radius;
      truck2.group.rotation.y = -truck2Angle + Math.PI / 2;
      truck2.wheels.forEach((w) => {
        w.rotation.x += 0.06;
      });

      // 3. Hero Truck in Login mode (Drives slowly across screen horizontally)
      if (heroTruck) {
        // Continuous smooth driving trajectory
        const heroX = ((elapsedTime * 3.8 + 25) % 65) - 32;
        heroTruck.group.position.x = heroX;
        // Gentle chassis suspension rocking
        heroTruck.group.position.y = -2.5 + Math.sin(elapsedTime * 4.5) * 0.05;
        heroTruck.group.rotation.z = Math.sin(elapsedTime * 4.5) * 0.015;
        heroTruck.wheels.forEach((w) => {
          w.rotation.x += 0.12;
        });
      }

      // 4. Excavator Working Motion
      if (excavatorObj) {
        excavatorObj.turret.rotation.y = Math.sin(elapsedTime * 0.5) * 0.35 - Math.PI / 3;
        excavatorObj.boomGroup.rotation.x = Math.sin(elapsedTime * 0.8) * 0.08;
        excavatorObj.stickGroup.rotation.x = Math.cos(elapsedTime * 0.8) * 0.12;
      }

      // 5. Digital Twin Holographic Node Pulsing
      telemetryNodes.forEach((node, idx) => {
        const pulse = 1 + Math.sin(elapsedTime * 3 + idx * 1.5) * 0.28;
        node.ring.scale.set(pulse, pulse, pulse);
        node.ring.material.opacity = 0.85 - (pulse - 0.72) * 0.6;
      });

      // 6. Dust particle drift
      const pArr = particleGeo.attributes.position.array;
      for (let i = 1; i < particleCount * 3; i += 3) {
        pArr[i] += 0.018;
        if (pArr[i] > 18) pArr[i] = -12;
      }
      particleGeo.attributes.position.needsUpdate = true;

      // 7. Camera Interpolation & Parallax
      if (isLogin) {
        // Subtle parallax for login card focus
        camera.position.x += (mouseX * 4 - camera.position.x) * 0.03;
        camera.position.y += (10 - mouseY * 2 - camera.position.y) * 0.03;
        camera.lookAt(0, 0, 0);
      } else if (isSubtle) {
        // Very slow, soothing orbital camera drift for dashboard background
        const bgAngle = elapsedTime * 0.02;
        camera.position.x = Math.cos(bgAngle) * 36 + mouseX * 2;
        camera.position.z = Math.sin(bgAngle) * 36;
        camera.position.y = 16 - mouseY * 2;
        camera.lookAt(0, -4, 0);
      } else {
        // Interactive / Full Dashboard 3D View with camera targets
        const camTargetX = 22 + mouseX * 6;
        const camTargetY = 20 - mouseY * 4;
        const camTargetZ = 34;

        camera.position.x += (camTargetX - camera.position.x) * 0.05;
        camera.position.y += (camTargetY - camera.position.y) * 0.05;
        camera.position.z += (camTargetZ - camera.position.z) * 0.05;
        camera.lookAt(0, -3, 0);
      }

      renderer.render(scene, camera);
    };

    animate();

    // -------------------------------------------------------------
    // CLEANUP
    // -------------------------------------------------------------
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);

      if (container && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }

      renderer.dispose();
      // Dispose materials & geometries
      Object.values(materials).forEach((m) => m.dispose());
      particleGeo.dispose();
      particleMat.dispose();
    };
  }, [mode]);

  return (
    <div
      ref={containerRef}
      style={{
        position: mode === "subtle" ? "fixed" : "absolute",
        top: mode === "subtle" ? 0 : undefined,
        left: mode === "subtle" ? 0 : undefined,
        inset: mode === "subtle" ? undefined : 0,
        width: mode === "subtle" ? "100vw" : "100%",
        height: mode === "subtle" ? "100vh" : "100%",
        pointerEvents: mode === "full" ? "auto" : "none",
        zIndex: mode === "subtle" ? 0 : 1,
        opacity: mode === "subtle" ? 0.42 : 1.0,
        overflow: "hidden",
      }}
    />
  );
}
