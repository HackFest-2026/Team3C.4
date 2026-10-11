import React, { useState, useRef, useEffect, useCallback } from "react";
import api from "../services/api";
import WorkerPPE3DViewer from "./WorkerPPE3DViewer";

/**
 * PPEDetectionPanel
 * Real-time Roboflow AI PPE Detection & Interactive 3D Digital Twin Visualizer
 * Detects:
 *  1. Safety Helmet (🪖)
 *  2. Safety Goggles / Glasses (🥽)
 *  3. Safety Mask / Respirator (😷)
 */
export default function PPEDetectionPanel({ workers = [], onUpdateWorkerPPE }) {
  const [config, setConfig] = useState({ configured: false, loading: true, instructions: "" });
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [selectedWorkerId, setSelectedWorkerId] = useState(workers[0]?.workerId || "");
  const [isInspecting, setIsInspecting] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [detectionResult, setDetectionResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [inferenceFps, setInferenceFps] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);
  const liveLoopIntervalRef = useRef(null);
  const inFlightRef = useRef(false);
  const lastInferenceTimeRef = useRef(Date.now());

  // Check Roboflow backend configuration on mount
  useEffect(() => {
    let isMounted = true;
    api.getPPEConfig()
      .then((res) => {
        if (isMounted) {
          setConfig({
            configured: Boolean(res.configured),
            loading: false,
            modelUrl: res.modelUrl,
            version: res.version,
            instructions: res.instructions,
          });
        }
      })
      .catch(() => {
        if (isMounted) {
          setConfig({
            configured: false,
            loading: false,
            instructions: "Unable to verify backend Roboflow configuration.",
          });
        }
      });

    return () => {
      isMounted = false;
      stopCamera();
    };
  }, []);

  // Update selected worker default if workers list updates
  useEffect(() => {
    if (!selectedWorkerId && workers.length > 0) {
      setSelectedWorkerId(workers[0].workerId);
    }
  }, [workers, selectedWorkerId]);

  // Draw bounding boxes on target canvas
  const drawBoxesOnCanvas = (targetCanvas, predictions, imgWidth, imgHeight) => {
    if (!targetCanvas) return;
    const ctx = targetCanvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);

    if (!predictions || predictions.length === 0) return;

    const natW = imgWidth || targetCanvas.width || 640;
    const natH = imgHeight || targetCanvas.height || 480;
    const scaleX = targetCanvas.width / natW;
    const scaleY = targetCanvas.height / natH;

    predictions.forEach((pred) => {
      const className = (pred.class || pred.name || "").toLowerCase();
      let color = "#10b981"; // default emerald
      if (className.includes("no-") || className.includes("without") || className.includes("missing")) {
        color = "#ef4444"; // red for negative detection
      } else if (className.includes("goggle") || className.includes("glass")) {
        color = "#0284c7"; // cyan/blue for goggles
      } else if (className.includes("mask") || className.includes("respirator")) {
        color = "#d97706"; // amber for mask
      } else if (className.includes("helmet") || className.includes("hat")) {
        color = "#10b981"; // green for helmet
      } else if (className.includes("vest")) {
        color = "#6366f1"; // indigo for vest
      }

      // Convert Roboflow center coordinates to top-left
      let boxX = (pred.x - pred.width / 2) * scaleX;
      let boxY = (pred.y - pred.height / 2) * scaleY;
      let boxW = pred.width * scaleX;
      let boxH = pred.height * scaleY;

      // Handle corner coordinates if provided
      if (pred.x !== undefined && pred.y !== undefined && pred.width === undefined) {
        boxX = pred.x * scaleX;
        boxY = pred.y * scaleY;
        boxW = 100 * scaleX;
        boxH = 100 * scaleY;
      }

      // Bounding Box Rectangle
      ctx.lineWidth = 3;
      ctx.strokeStyle = color;
      ctx.strokeRect(boxX, boxY, boxW, boxH);

      // Label Badge
      const label = `${pred.class || "PPE"} ${Math.round((pred.confidence || 0) * 100)}%`;
      ctx.font = "bold 11px Inter, sans-serif";
      const textWidth = ctx.measureText(label).width;

      ctx.fillStyle = color;
      ctx.fillRect(boxX, Math.max(0, boxY - 20), textWidth + 8, 20);

      ctx.fillStyle = "#ffffff";
      ctx.fillText(label, boxX + 4, Math.max(14, boxY - 5));
    });
  };

  // Perform PPE inspection with base64 image
  const processImageForPPE = async (base64Img, isLiveTick = false) => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    if (!isLiveTick) setIsInspecting(true);

    try {
      const payload = {
        image: base64Img,
        workerId: selectedWorkerId || null,
      };

      const start = Date.now();
      const result = await api.detectPPE(payload);
      const elapsed = Date.now() - start;
      setInferenceFps(Math.round(1000 / Math.max(elapsed, 1)));
      setDetectionResult(result);
      setErrorMessage("");

      // Render bounding boxes
      if (cameraActive && overlayCanvasRef.current && videoRef.current) {
        const video = videoRef.current;
        const overlay = overlayCanvasRef.current;
        overlay.width = video.clientWidth || video.videoWidth || 640;
        overlay.height = video.clientHeight || video.videoHeight || 480;
        drawBoxesOnCanvas(
          overlay,
          result.predictions || [],
          result.imageDimensions?.width || video.videoWidth,
          result.imageDimensions?.height || video.videoHeight
        );
      } else if (canvasRef.current) {
        const img = new Image();
        img.onload = () => {
          const canvas = canvasRef.current;
          if (canvas) {
            canvas.width = img.width || 640;
            canvas.height = img.height || 480;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            drawBoxesOnCanvas(canvas, result.predictions || [], img.width, img.height);
          }
        };
        img.src = base64Img;
      }
    } catch (err) {
      if (!isLiveTick) {
        console.error("[PPE Inspection Error]:", err);
        setErrorMessage(err.message || "Failed to run PPE detection. Check backend connection.");
      }
    } finally {
      inFlightRef.current = false;
      if (!isLiveTick) setIsInspecting(false);
    }
  };

  // Capture a single frame from video element
  const captureCurrentFrameBase64 = useCallback(() => {
    if (!videoRef.current) return null;
    const video = videoRef.current;
    if (video.readyState < 2 || !video.videoWidth) return null;

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = video.videoWidth;
    tempCanvas.height = video.videoHeight;
    const ctx = tempCanvas.getContext("2d");
    ctx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
    return tempCanvas.toDataURL("image/jpeg", 0.85);
  }, []);

  // Continuous Live Inference Loop while camera is active
  useEffect(() => {
    if (!cameraActive) {
      if (liveLoopIntervalRef.current) {
        clearInterval(liveLoopIntervalRef.current);
        liveLoopIntervalRef.current = null;
      }
      return;
    }

    // Interval tick every 950ms for live detection stream
    liveLoopIntervalRef.current = setInterval(() => {
      if (!cameraActive || inFlightRef.current) return;
      const base64 = captureCurrentFrameBase64();
      if (base64) {
        processImageForPPE(base64, true);
      }
    }, 950);

    return () => {
      if (liveLoopIntervalRef.current) {
        clearInterval(liveLoopIntervalRef.current);
        liveLoopIntervalRef.current = null;
      }
    };
  }, [cameraActive, captureCurrentFrameBase64]);

  // Start live webcam stream
  const startCamera = async () => {
    setCameraError("");
    setErrorMessage("");
    setCapturedImage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err) {
      console.warn("[PPE Camera Error]:", err);
      setCameraError(
        err.name === "NotAllowedError"
          ? "Camera permission denied. Please allow camera access in browser permissions."
          : `Unable to access camera: ${err.message}`
      );
      setCameraActive(false);
    }
  };

  // Stop live webcam stream
  const stopCamera = () => {
    if (liveLoopIntervalRef.current) {
      clearInterval(liveLoopIntervalRef.current);
      liveLoopIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (overlayCanvasRef.current) {
      const ctx = overlayCanvasRef.current.getContext("2d");
      if (ctx) ctx.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
    }
    setCameraActive(false);
    setInferenceFps(null);
  };

  // Manual snapshot capture
  const handleManualCapture = () => {
    const base64 = captureCurrentFrameBase64();
    if (base64) {
      setCapturedImage(base64);
      processImageForPPE(base64, false);
    }
  };

  // Handle uploaded photo
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please select a valid image file (JPG, PNG, or WEBP).");
      return;
    }

    stopCamera();
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result;
      if (base64) {
        setCapturedImage(base64);
        processImageForPPE(base64, false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Apply inspection result to worker profile
  const handleSyncToWorker = () => {
    if (!selectedWorkerId || !detectionResult) return;
    const newStatus = detectionResult.complianceStatus === "Compliant" ? "All PPE Verified" : "PPE Missing";
    if (onUpdateWorkerPPE) {
      onUpdateWorkerPPE(selectedWorkerId, newStatus);
    }
  };

  // Helper badge color for item statuses
  const getItemBadgeStyle = (status) => {
    switch (status) {
      case "Detected":
        return { bg: "rgba(16, 185, 129, 0.15)", border: "#10b981", color: "#047857", icon: "✓" };
      case "Missing":
        return { bg: "rgba(239, 68, 68, 0.15)", border: "#ef4444", color: "#b91c1c", icon: "✗" };
      default:
        return { bg: "rgba(245, 158, 11, 0.15)", border: "#f59e0b", color: "#b45309", icon: "—" };
    }
  };

  const selectedWorker = workers.find((w) => w.workerId === selectedWorkerId);

  // Extract individual 3D item states
  const helmetStatus = detectionResult?.items?.helmet?.status || "Unknown";
  const gogglesStatus = detectionResult?.items?.goggles?.status || "Unknown";
  const maskStatus = detectionResult?.items?.mask?.status || "Unknown";

  return (
    <div
      className="mg-pop"
      style={{
        background: "linear-gradient(145deg, #ffffff 0%, #fffdfa 100%)",
        boxShadow: "0 8px 24px rgba(180, 130, 95, 0.08)",
        borderRadius: "18px",
        border: "1px solid rgba(217, 119, 6, 0.25)",
        padding: "24px",
        display: "grid",
        gap: "20px",
      }}
    >
      {/* ------------------------------------------------------------------- */}
      {/* 1. Header & Live Indicator                                          */}
      {/* ------------------------------------------------------------------- */}
      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", flexWrap: "wrap", gap: "14px" }}>
        {/* Worker Assignment Selector */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <label style={{ fontSize: "11px", fontWeight: 700, color: "#475569" }}>Inspecting Worker:</label>
          <select
            value={selectedWorkerId}
            onChange={(e) => setSelectedWorkerId(e.target.value)}
            style={{
              padding: "7px 12px",
              borderRadius: "8px",
              border: "1px solid rgba(217, 119, 6, 0.3)",
              background: "#ffffff",
              color: "#181e24",
              fontSize: "12px",
              fontWeight: 600,
            }}
          >
            {workers.map((w) => (
              <option key={w.workerId} value={w.workerId}>
                {w.workerId} — {w.name} ({w.ppeStatus || "All PPE Verified"})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* 2. Main 3-Column Inspection Layout:                                 */}
      {/*    Col 1: Live Video Feed & Bounding Box Viewfinder                 */}
      {/*    Col 2: Interactive 3D PPE Worker Twin Visualizer                 */}
      {/*    Col 3: Real-Time Checklist & Compliance Actions                  */}
      {/* ------------------------------------------------------------------- */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "18px" }}>
        
        {/* ================================================================= */}
        {/* COLUMN 1: LIVE VIEWFINDER & CAMERA CONTROLS                       */}
        {/* ================================================================= */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "14px",
            border: "1px solid rgba(217, 119, 6, 0.22)",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", fontWeight: 800, color: "#181e24" }}>
              Worker Visual Feed
            </span>
            <div style={{ display: "flex", gap: "6px" }}>
              {!cameraActive ? (
                <button
                  onClick={startCamera}
                  style={{
                    background: "linear-gradient(135deg, #f59e0b, #d97706)",
                    border: "none",
                    color: "#181e24",
                    padding: "6px 12px",
                    borderRadius: "8px",
                    fontWeight: 700,
                    fontSize: "11px",
                    cursor: "pointer",
                  }}
                >
                  📷 Start Camera
                </button>
              ) : (
                <button
                  onClick={stopCamera}
                  style={{
                    background: "#ef4444",
                    border: "none",
                    color: "#ffffff",
                    padding: "6px 12px",
                    borderRadius: "8px",
                    fontWeight: 700,
                    fontSize: "11px",
                    cursor: "pointer",
                  }}
                >
                  ⏹ Stop Camera
                </button>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  background: "#fffdfa",
                  border: "1px solid rgba(217, 119, 6, 0.35)",
                  color: "#b45309",
                  padding: "6px 12px",
                  borderRadius: "8px",
                  fontWeight: 700,
                  fontSize: "11px",
                  cursor: "pointer",
                }}
              >
                📁 Upload Photo
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                style={{ display: "none" }}
              />
            </div>
          </div>

          {/* Viewport Box */}
          <div
            style={{
              position: "relative",
              width: "100%",
              height: "260px",
              background: "#0f172a",
              borderRadius: "10px",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid rgba(217, 119, 6, 0.2)",
            }}
          >
            {/* Live Camera Video Feed */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: cameraActive && !capturedImage ? "block" : "none",
              }}
            />

            {/* Live Bounding Box Overlay Canvas directly on top of video */}
            <canvas
              ref={overlayCanvasRef}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                pointerEvents: "none",
                display: cameraActive && !capturedImage ? "block" : "none",
                zIndex: 5,
              }}
            />

            {/* Snapshot canvas (when photo is captured or uploaded) */}
            <canvas
              ref={canvasRef}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                display: capturedImage ? "block" : "none",
              }}
            />

            {/* Standby screen when camera is idle */}
            {!cameraActive && !capturedImage && (
              <div style={{ textAlign: "center", color: "#94a3b8", padding: "20px" }}>
                <span style={{ fontSize: "36px", display: "block", marginBottom: "8px" }}>📷</span>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "#cbd5e1" }}>
                  Camera Feed Standby
                </div>
                <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>
                  Click <strong>Start Camera</strong> to run real-time Roboflow detection.
                </div>
              </div>
            )}

            {/* Scanning / In-flight Indicator Pill */}
            {cameraActive && (
              <div
                style={{
                  position: "absolute",
                  top: "10px",
                  left: "10px",
                  zIndex: 10,
                  background: "rgba(15, 23, 42, 0.75)",
                  backdropFilter: "blur(6px)",
                  padding: "4px 10px",
                  borderRadius: "6px",
                  fontSize: "10px",
                  fontWeight: 800,
                  color: "#34d399",
                  border: "1px solid rgba(16, 185, 129, 0.4)",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: "#10b981",
                  }}
                />
                LIVE SCANNING
              </div>
            )}
          </div>

          {/* Camera & API Error Displays */}
          {cameraError && (
            <div style={{ fontSize: "11px", color: "#dc2626", background: "rgba(239, 68, 68, 0.1)", padding: "8px", borderRadius: "6px" }}>
              ⚠️ {cameraError}
            </div>
          )}

          {errorMessage && (
            <div style={{ fontSize: "11px", color: "#dc2626", background: "rgba(239, 68, 68, 0.1)", padding: "8px", borderRadius: "6px" }}>
              ⚠️ {errorMessage}
            </div>
          )}

          {/* Manual Snapshot trigger */}
          {cameraActive && (
            <button
              onClick={handleManualCapture}
              disabled={isInspecting}
              style={{
                width: "100%",
                padding: "9px",
                background: "linear-gradient(135deg, #10b981, #059669)",
                border: "none",
                borderRadius: "8px",
                color: "#ffffff",
                fontWeight: 800,
                fontSize: "11px",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(16, 185, 129, 0.25)",
              }}
            >
              📸 Freeze Frame & Inspect
            </button>
          )}
        </div>

        {/* ================================================================= */}
        {/* COLUMN 2: INTERACTIVE 3D PPE WORKER TWIN                          */}
        {/* ================================================================= */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <WorkerPPE3DViewer
            helmetStatus={helmetStatus}
            gogglesStatus={gogglesStatus}
            maskStatus={maskStatus}
          />
        </div>

        {/* ================================================================= */}
        {/* COLUMN 3: REAL-TIME PPE CHECKLIST & OVERALL STATUS                */}
        {/* ================================================================= */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          
          {/* Overall Compliance Header Pill */}
          <div
            style={{
              padding: "14px 18px",
              borderRadius: "12px",
              background:
                detectionResult?.complianceStatus === "Compliant"
                  ? "rgba(16, 185, 129, 0.12)"
                  : detectionResult?.complianceStatus === "Non-Compliant"
                  ? "rgba(239, 68, 68, 0.12)"
                  : "#fffdfa",
              border: `1px solid ${
                detectionResult?.complianceStatus === "Compliant"
                  ? "#10b981"
                  : detectionResult?.complianceStatus === "Non-Compliant"
                  ? "#ef4444"
                  : "rgba(217, 119, 6, 0.25)"
              }`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "8px",
            }}
          >
            <div>
              <div style={{ fontSize: "10px", fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>
                OVERALL COMPLIANCE STATUS
              </div>
              <div
                style={{
                  fontSize: "16px",
                  fontWeight: 900,
                  color:
                    detectionResult?.complianceStatus === "Compliant"
                      ? "#047857"
                      : detectionResult?.complianceStatus === "Non-Compliant"
                      ? "#dc2626"
                      : "#b45309",
                  marginTop: "2px",
                }}
              >
                {detectionResult?.complianceStatus || "PENDING INSPECTION"}
              </div>
            </div>

            {detectionResult && (
              <button
                onClick={handleSyncToWorker}
                style={{
                  background: "linear-gradient(135deg, #f59e0b, #d97706)",
                  border: "none",
                  color: "#181e24",
                  padding: "6px 14px",
                  borderRadius: "8px",
                  fontWeight: 800,
                  fontSize: "11px",
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(217, 119, 6, 0.2)",
                }}
              >
                Sync to {selectedWorkerId}
              </button>
            )}
          </div>

          {/* Three Required PPE Items */}
          <div style={{ display: "grid", gap: "10px" }}>
            
            {/* 1. Safety Helmet */}
            {(() => {
              const item = detectionResult?.items?.helmet;
              const badge = getItemBadgeStyle(item?.status || "Unknown");
              return (
                <div
                  style={{
                    background: "#ffffff",
                    border: "1px solid rgba(217, 119, 6, 0.2)",
                    borderRadius: "12px",
                    padding: "12px 16px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "20px" }}>🪖</span>
                    <div>
                      <div style={{ fontSize: "12px", fontWeight: 800, color: "#181e24" }}>Safety Helmet</div>
                      <div style={{ fontSize: "10px", color: "#64748b" }}>
                        Hard hat protection against head trauma & subterranean debris
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span
                      style={{
                        padding: "4px 10px",
                        borderRadius: "8px",
                        fontSize: "11px",
                        fontWeight: 800,
                        background: badge.bg,
                        border: `1px solid ${badge.border}`,
                        color: badge.color,
                        display: "inline-block",
                      }}
                    >
                      {badge.icon} {item?.status || "Not Verified"}
                    </span>
                    {item?.confidence ? (
                      <div style={{ fontSize: "10px", color: "#047857", fontWeight: 700, marginTop: "2px" }}>
                        {item.confidence}% Confidence
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })()}

            {/* 2. Safety Goggles */}
            {(() => {
              const item = detectionResult?.items?.goggles;
              const badge = getItemBadgeStyle(item?.status || "Unknown");
              return (
                <div
                  style={{
                    background: "#ffffff",
                    border: "1px solid rgba(217, 119, 6, 0.2)",
                    borderRadius: "12px",
                    padding: "12px 16px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "20px" }}>🥽</span>
                    <div>
                      <div style={{ fontSize: "12px", fontWeight: 800, color: "#181e24" }}>Safety Goggles</div>
                      <div style={{ fontSize: "10px", color: "#64748b" }}>
                        Impact-rated eye protection against rock chips, dust & splashes
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span
                      style={{
                        padding: "4px 10px",
                        borderRadius: "8px",
                        fontSize: "11px",
                        fontWeight: 800,
                        background: badge.bg,
                        border: `1px solid ${badge.border}`,
                        color: badge.color,
                        display: "inline-block",
                      }}
                    >
                      {badge.icon} {item?.status || "Not Verified"}
                    </span>
                    {item?.confidence ? (
                      <div style={{ fontSize: "10px", color: "#047857", fontWeight: 700, marginTop: "2px" }}>
                        {item.confidence}% Confidence
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })()}

            {/* 3. Safety Mask */}
            {(() => {
              const item = detectionResult?.items?.mask;
              const badge = getItemBadgeStyle(item?.status || "Unknown");
              return (
                <div
                  style={{
                    background: "#ffffff",
                    border: "1px solid rgba(217, 119, 6, 0.2)",
                    borderRadius: "12px",
                    padding: "12px 16px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "20px" }}>😷</span>
                    <div>
                      <div style={{ fontSize: "12px", fontWeight: 800, color: "#181e24" }}>Safety Mask</div>
                      <div style={{ fontSize: "10px", color: "#64748b" }}>
                        Respiratory filtration against quartz silica dust & toxic particulate
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span
                      style={{
                        padding: "4px 10px",
                        borderRadius: "8px",
                        fontSize: "11px",
                        fontWeight: 800,
                        background: badge.bg,
                        border: `1px solid ${badge.border}`,
                        color: badge.color,
                        display: "inline-block",
                      }}
                    >
                      {badge.icon} {item?.status || "Not Verified"}
                    </span>
                    {item?.confidence ? (
                      <div style={{ fontSize: "10px", color: "#047857", fontWeight: 700, marginTop: "2px" }}>
                        {item.confidence}% Confidence
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })()}

          </div>

          {/* Selected Worker Info Footer */}
          {selectedWorker && (
            <div
              style={{
                fontSize: "11px",
                color: "#475569",
                background: "#fffdfa",
                padding: "10px 14px",
                borderRadius: "10px",
                border: "1px solid rgba(217, 119, 6, 0.15)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>
                Assigned: <strong>{selectedWorker.name}</strong> ({selectedWorker.designation || selectedWorker.role})
              </span>
              <span>
                Zone: <strong>{selectedWorker.zone || "Gold Pit Alpha"}</strong>
              </span>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
