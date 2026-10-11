import React, { useEffect, useRef, useState } from "react";

/**
 * MiningBlastTransition Component
 * 
 * Cinematic Rock-Breaking & Quarry Blast Transition
 * Triggered strictly upon SUCCESSFUL face authentication before revealing the Dashboard.
 * 
 * Sequence (2.8 seconds total):
 * 0.0s - 0.4s: "ACCESS GRANTED: BIOMETRIC IDENTITY VERIFIED" terminal HUD
 * 0.4s - 0.8s: Highwall quarry rock face appears, detonation warning flash
 * 0.8s - 1.8s: VIOLENT MINING ROCK BLAST:
 *              - Screen-quake ground vibration
 *              - Fiery explosion burst and shockwave ring
 *              - 45+ jagged 3D rock chunks fracturing and hurtling toward camera
 *              - Volumetric expanding quarry dust cloud & flying embers
 * 1.8s - 2.5s: Dust cloud expands and begins dissipating, golden sunlight beams emerge
 * 2.5s - 2.8s: "COMMAND CENTER UNLOCKED" reveal -> Dashboard appears
 */
export default function MiningBlastTransition({ user, onComplete }) {
  const canvasRef = useRef(null);
  const [phase, setPhase] = useState("granted"); // "granted" | "charge" | "blast" | "clearing"
  const [countdownText, setCountdownText] = useState("BIOMETRIC ACCESS GRANTED");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // -------------------------------------------------------------
    // AUDIO SYNTHESIS (Web Audio API - Optional Realistic Rumble)
    // -------------------------------------------------------------
    const playBlastAudio = () => {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const audioCtx = new AudioCtx();
        if (audioCtx.state === "suspended") {
          audioCtx.resume();
        }

        // Noise buffer for quarry explosion rumble
        const bufferSize = audioCtx.sampleRate * 1.8;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (audioCtx.sampleRate * 0.4));
        }

        const noise = audioCtx.createBufferSource();
        noise.buffer = buffer;

        // Low-pass filter for deep subterranean rock blast
        const filter = audioCtx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(320, audioCtx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 1.6);

        const gainNode = audioCtx.createGain();
        gainNode.gain.setValueAtTime(0.7, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1.8);

        noise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        noise.start();
      } catch (e) {
        // Audio is optional enhancement; silent fallback is completely graceful
      }
    };

    // -------------------------------------------------------------
    // PARTICLE & ROCK SIMULATION DATA
    // -------------------------------------------------------------
    const rocks = [];
    const dustPuffs = [];
    const sparks = [];
    const shockwaves = [];

    // Rock shapes generator (Jagged irregular polygons)
    const createRock = (x, y) => {
      const vertices = [];
      const numPoints = 6 + Math.floor(Math.random() * 4);
      const baseRadius = 25 + Math.random() * 65;
      for (let i = 0; i < numPoints; i++) {
        const angle = (i / numPoints) * Math.PI * 2;
        const rad = baseRadius * (0.65 + Math.random() * 0.7);
        vertices.push({ x: Math.cos(angle) * rad, y: Math.sin(angle) * rad });
      }

      // 3D trajectory: rocks explode outward from pit center toward the camera
      const angleOut = Math.random() * Math.PI * 2;
      const speed = 12 + Math.random() * 28;
      const colors = [
        "#8c6239", // sandstone
        "#6b4423", // ochre rock
        "#b45309", // iron ore vein
        "#475569", // dark basalt
        "#334155", // slate rock
        "#d97706", // mineral copper
      ];

      return {
        x,
        y,
        vx: Math.cos(angleOut) * speed * (0.8 + Math.random() * 0.5),
        vy: Math.sin(angleOut) * speed * 0.7 - (4 + Math.random() * 8), // upward lift then gravity
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.25,
        scale: 0.2 + Math.random() * 0.3,
        vScale: 0.04 + Math.random() * 0.05, // gets larger as it flies toward camera
        color: colors[Math.floor(Math.random() * colors.length)],
        vertices,
        gravity: 0.38,
        opacity: 1.0,
      };
    };

    // Dust Cloud Puffs
    const createDustPuff = (x, y) => {
      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 16;
      return {
        x: x + (Math.random() - 0.5) * 60,
        y: y + (Math.random() - 0.5) * 40,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed * 0.6 - 2,
        radius: 30 + Math.random() * 45,
        growth: 2.2 + Math.random() * 2.8,
        maxRadius: 240 + Math.random() * 180,
        opacity: 0.75 + Math.random() * 0.2,
        color: Math.random() > 0.4 ? "rgba(225, 185, 145," : "rgba(240, 215, 185,",
      };
    };

    // Sparks / Explosive Fire Embers
    const createSpark = (x, y) => {
      const angle = Math.random() * Math.PI * 2;
      const speed = 18 + Math.random() * 32;
      return {
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 6,
        size: 2 + Math.random() * 5,
        life: 1.0,
        decay: 0.02 + Math.random() * 0.03,
        color: Math.random() > 0.3 ? "#f59e0b" : "#ef4444",
      };
    };

    // -------------------------------------------------------------
    // PHASE SEQUENCER TIMELINE
    // -------------------------------------------------------------
    const startTime = performance.now();
    let blastTriggered = false;

    // Phase 1 -> Phase 2 (0.4s): Charging Quarry Wall
    const timerCharge = setTimeout(() => {
      setPhase("charge");
      setCountdownText("ARMING EXCAVATION CHARGE: ZONE 4");
    }, 450);

    // Phase 2 -> Phase 3 (0.85s): DETONATION BLAST!
    const timerBlast = setTimeout(() => {
      setPhase("blast");
      setCountdownText("💥 CONTROLLED ROCK BLAST DETONATION");
      playBlastAudio();
      blastTriggered = true;

      const centerX = width / 2;
      const centerY = height / 2;

      // Spawn 55 rock fragments
      for (let i = 0; i < 55; i++) {
        rocks.push(createRock(centerX, centerY));
      }

      // Spawn 60 expanding dust puffs
      for (let i = 0; i < 60; i++) {
        dustPuffs.push(createDustPuff(centerX, centerY));
      }

      // Spawn 120 fire embers & sparks
      for (let i = 0; i < 120; i++) {
        sparks.push(createSpark(centerX, centerY));
      }

      // Shockwaves
      shockwaves.push({ r: 10, maxR: width * 0.9, width: 28, opacity: 1.0 });
      shockwaves.push({ r: 5, maxR: width * 0.7, width: 14, opacity: 0.9 });
    }, 850);

    // Phase 3 -> Phase 4 (1.9s): Dust clearing
    const timerClear = setTimeout(() => {
      setPhase("clearing");
      setCountdownText("MINEGUARD COMMAND CENTER — REVEALED");
    }, 1900);

    // Complete transition (2.8s) -> Reveal Dashboard
    const timerComplete = setTimeout(() => {
      if (onComplete) onComplete();
    }, 2800);

    // -------------------------------------------------------------
    // RENDER ANIMATION LOOP
    // -------------------------------------------------------------
    let animationId;

    const render = () => {
      animationId = requestAnimationFrame(render);
      const now = performance.now();
      const elapsed = (now - startTime) / 1000;

      ctx.clearRect(0, 0, width, height);

      // 1. Initial Highwall Rock Face (Phases 1 & 2 before blast)
      if (elapsed < 0.95) {
        // Draw massive quarry rock face
        const rockGrad = ctx.createLinearGradient(0, 0, width, height);
        rockGrad.addColorStop(0, "#2c1c11");
        rockGrad.addColorStop(0.5, "#432818");
        rockGrad.addColorStop(1, "#1e130c");
        ctx.fillStyle = rockGrad;
        ctx.fillRect(0, 0, width, height);

        // Cracks glowing in the rock before detonating
        if (elapsed > 0.45) {
          const crackProgress = (elapsed - 0.45) / 0.4;
          ctx.strokeStyle = `rgba(245, 158, 11, ${0.4 + crackProgress * 0.6})`;
          ctx.lineWidth = 3 + crackProgress * 4;
          ctx.shadowColor = "#f59e0b";
          ctx.shadowBlur = 20 * crackProgress;

          // Radiating fracture fissures
          const cx = width / 2;
          const cy = height / 2;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx - 280 * crackProgress, cy - 180 * crackProgress);
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + 310 * crackProgress, cy - 140 * crackProgress);
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx - 190 * crackProgress, cy + 240 * crackProgress);
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + 260 * crackProgress, cy + 220 * crackProgress);
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + 20 * crackProgress, cy - 320 * crackProgress);
          ctx.stroke();
          ctx.shadowBlur = 0;
        }
      }

      // 2. Blast Detonation Flash (0.85s - 1.25s)
      if (elapsed >= 0.85 && elapsed < 1.35) {
        const flashIntensity = Math.max(0, 1 - (elapsed - 0.85) / 0.45);
        const flashGrad = ctx.createRadialGradient(
          width / 2,
          height / 2,
          20,
          width / 2,
          height / 2,
          width * 0.7
        );
        flashGrad.addColorStop(0, `rgba(255, 255, 255, ${flashIntensity})`);
        flashGrad.addColorStop(0.3, `rgba(254, 240, 138, ${flashIntensity * 0.9})`);
        flashGrad.addColorStop(0.7, `rgba(245, 158, 11, ${flashIntensity * 0.7})`);
        flashGrad.addColorStop(1, "transparent");
        ctx.fillStyle = flashGrad;
        ctx.fillRect(0, 0, width, height);
      }

      // 3. Shockwave Rings
      shockwaves.forEach((sw) => {
        if (sw.r < sw.maxR) {
          sw.r += (sw.maxR - sw.r) * 0.12;
          sw.opacity *= 0.94;
          ctx.save();
          ctx.beginPath();
          ctx.arc(width / 2, height / 2, sw.r, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(254, 215, 170, ${sw.opacity * 0.8})`;
          ctx.lineWidth = sw.width * sw.opacity;
          ctx.stroke();
          ctx.restore();
        }
      });

      // 4. Update & Render Tumbling 3D Rock Fragments
      if (blastTriggered) {
        rocks.forEach((rock) => {
          rock.x += rock.vx;
          rock.y += rock.vy;
          rock.vy += rock.gravity;
          rock.rot += rock.rotSpeed;
          rock.scale += rock.vScale;
          if (elapsed > 2.0) {
            rock.opacity = Math.max(0, rock.opacity - 0.04);
          }

          ctx.save();
          ctx.translate(rock.x, rock.y);
          ctx.rotate(rock.rot);
          ctx.scale(rock.scale, rock.scale);
          ctx.globalAlpha = Math.max(0, rock.opacity);

          // Draw rock facet
          ctx.beginPath();
          rock.vertices.forEach((v, idx) => {
            if (idx === 0) ctx.moveTo(v.x, v.y);
            else ctx.lineTo(v.x, v.y);
          });
          ctx.closePath();
          ctx.fillStyle = rock.color;
          ctx.fill();

          // Dark rock bevel shadow
          ctx.strokeStyle = "rgba(0, 0, 0, 0.4)";
          ctx.lineWidth = 3;
          ctx.stroke();

          // Golden mineral highlight on facet edge
          ctx.beginPath();
          ctx.moveTo(rock.vertices[0].x, rock.vertices[0].y);
          ctx.lineTo(rock.vertices[1].x, rock.vertices[1].y);
          ctx.strokeStyle = "rgba(253, 230, 138, 0.7)";
          ctx.lineWidth = 2.5;
          ctx.stroke();

          ctx.restore();
        });

        // 5. Fire Sparks & Incandescent Embers
        sparks.forEach((sp) => {
          if (sp.life > 0) {
            sp.x += sp.vx;
            sp.y += sp.vy;
            sp.vy += 0.35;
            sp.life -= sp.decay;

            ctx.save();
            ctx.beginPath();
            ctx.arc(sp.x, sp.y, sp.size * sp.life, 0, Math.PI * 2);
            ctx.fillStyle = sp.color;
            ctx.shadowColor = sp.color;
            ctx.shadowBlur = 10;
            ctx.globalAlpha = Math.max(0, sp.life);
            ctx.fill();
            ctx.restore();
          }
        });

        // 6. Expanding Volumetric Quarry Dust Cloud
        dustPuffs.forEach((dp) => {
          dp.x += dp.vx;
          dp.y += dp.vy;
          dp.vx *= 0.94;
          dp.vy *= 0.94;

          if (dp.radius < dp.maxRadius) {
            dp.radius += dp.growth;
          }

          // In clearing phase (after 1.9s), dust clears out
          if (elapsed > 1.9) {
            dp.opacity = Math.max(0, dp.opacity - 0.022);
          }

          if (dp.opacity > 0) {
            ctx.save();
            const puffGrad = ctx.createRadialGradient(
              dp.x,
              dp.y,
              dp.radius * 0.1,
              dp.x,
              dp.y,
              dp.radius
            );
            puffGrad.addColorStop(0, `${dp.color} ${dp.opacity * 0.85})`);
            puffGrad.addColorStop(0.5, `${dp.color} ${dp.opacity * 0.5})`);
            puffGrad.addColorStop(1, `${dp.color} 0)`);

            ctx.fillStyle = puffGrad;
            ctx.beginPath();
            ctx.arc(dp.x, dp.y, dp.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
        });
      }

      // 7. Light Rays Piercing Dust (Clearing phase: 1.8s - 2.8s)
      if (elapsed > 1.7) {
        const rayAlpha = Math.min(1, (elapsed - 1.7) / 0.6) * Math.max(0, 1 - (elapsed - 2.4) / 0.4);
        ctx.save();
        ctx.globalAlpha = rayAlpha * 0.65;
        const sunGrad = ctx.createRadialGradient(
          width / 2,
          height * 0.4,
          20,
          width / 2,
          height * 0.4,
          width * 0.8
        );
        sunGrad.addColorStop(0, "rgba(255, 247, 237, 0.95)");
        sunGrad.addColorStop(0.3, "rgba(254, 243, 199, 0.8)");
        sunGrad.addColorStop(0.7, "rgba(255, 237, 213, 0.4)");
        sunGrad.addColorStop(1, "transparent");
        ctx.fillStyle = sunGrad;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
      clearTimeout(timerCharge);
      clearTimeout(timerBlast);
      clearTimeout(timerClear);
      clearTimeout(timerComplete);
    };
  }, [onComplete]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        background: "#080b0d",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        animation: phase === "blast" ? "cameraQuake 0.6s cubic-bezier(0.36, 0.07, 0.19, 0.97) both" : "none",
      }}
    >
      {/* HTML5 Canvas for 60fps WebGL-grade Rock & Dust Physics */}
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      />

      {/* Cinematic HUD Overlay */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          textAlign: "center",
          maxWidth: "680px",
          padding: "24px 32px",
          background: "rgba(15, 20, 25, 0.72)",
          backdropFilter: "blur(16px)",
          borderRadius: "24px",
          border: "1px solid rgba(245, 158, 11, 0.4)",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.6), 0 0 30px rgba(245, 158, 11, 0.25)",
          color: "#f8fafc",
          animation: "hudPulse 1.2s infinite alternate ease-in-out",
          opacity: phase === "clearing" ? 0.3 : 1,
          transition: "opacity 0.6s ease",
        }}
      >
        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
          <span style={{ fontSize: "20px" }}>⛏️</span>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 800,
              letterSpacing: "2px",
              color: "#f59e0b",
              textTransform: "uppercase",
            }}
          >
            MINEGUARD HIGH-SECURITY PROTOCOL
          </span>
        </div>

        <h1
          style={{
            margin: "0 0 8px",
            fontSize: "26px",
            fontWeight: 900,
            letterSpacing: "1.5px",
            color: phase === "blast" ? "#f59e0b" : "#34d399",
            textShadow: "0 0 20px rgba(245, 158, 11, 0.5)",
            fontFamily: "Space Grotesk, sans-serif",
          }}
        >
          {countdownText}
        </h1>

        <div style={{ fontSize: "14px", fontWeight: 700, color: "#ffffff", marginTop: "4px" }}>
          OPERATOR: <span style={{ color: "#f59e0b" }}>{user?.name || "Authorized Personnel"}</span>
        </div>
        <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>
          ROLE: {user?.role || "Safety Director"} • ID: {user?.workerId || "MG-NODE-01"}
        </div>

        {/* Progress bar */}
        <div
          style={{
            marginTop: "16px",
            height: "5px",
            background: "rgba(255, 255, 255, 0.15)",
            borderRadius: "4px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              background: "linear-gradient(90deg, #f59e0b, #ef4444, #10b981)",
              animation: "blastProgress 2.8s linear forwards",
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes cameraQuake {
          10%, 90% { transform: translate3d(-3px, -2px, 0) scale(1.01); }
          20%, 80% { transform: translate3d(5px, 4px, 0) scale(1.02); }
          30%, 50%, 70% { transform: translate3d(-6px, -5px, 0) scale(1.03); }
          40%, 60% { transform: translate3d(6px, 5px, 0) scale(1.01); }
        }
        @keyframes blastProgress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        @keyframes hudPulse {
          0% { transform: scale(0.99); }
          100% { transform: scale(1.01); }
        }
      `}</style>
    </div>
  );
}
