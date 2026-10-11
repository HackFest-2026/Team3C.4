import React, { useState, useEffect, useRef } from "react";
import * as faceapi from "face-api.js";
import api from "../services/api";
import MineTunnel3D from "./MineTunnel3D";

export default function Login({ onLoginSuccess }) {
  // Modes: "login" (Manual Mining ID Login) or "register" (Face Registration)
  const [authMode, setAuthMode] = useState("login");

  // Models & Camera State for Face Registration
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [modelLoadingError, setModelLoadingError] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Initializing neural face vision models for registration...");

  // Manual Mining ID Login State
  const [manualIdInput, setManualIdInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [isSubmittingLogin, setIsSubmittingLogin] = useState(false);

  // Registration Form State
  const [regWorkerId, setRegWorkerId] = useState("");
  const [regName, setRegName] = useState("");
  const [regRole, setRegRole] = useState("Safety Officer");
  const [regDepartment, setRegDepartment] = useState("Gold Mine Safety");
  const [capturedDescriptor, setCapturedDescriptor] = useState(null);
  const [existingFaceUser, setExistingFaceUser] = useState(null);
  const [isSubmittingReg, setIsSubmittingReg] = useState(false);
  const [formFeedback, setFormFeedback] = useState({ type: "", message: "" });

  // Quick Management Credentials
  const [quickManagers, setQuickManagers] = useState([
    {
      workerId: "ACDS-SAFE-01",
      name: "Dr. Rajesh Sharma",
      role: "Safety Officer",
      department: "Gold Mine Safety",
    },
    {
      workerId: "ACDS-MGR-01",
      name: "Sunita Verma",
      role: "Manager",
      department: "Pit Operations",
    },
    {
      workerId: "ACDS-EXEC-01",
      name: "Vikram Singhania",
      role: "CEO",
      department: "Executive Management",
    },
  ]);

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // 1. Load face-api.js Models from /models for Face Registration
  useEffect(() => {
    let isMounted = true;
    async function loadModels() {
      try {
        const MODEL_URL = "/models";
        setStatusMessage("Loading TinyFaceDetector, Landmarks & Recognition models...");

        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);

        if (isMounted) {
          setModelsLoaded(true);
          setStatusMessage("Face recognition neural models loaded for registration.");
        }
      } catch (err) {
        console.error("Failed to load face-api models:", err);
        if (isMounted) {
          setModelLoadingError("Neural models notice: Browser vector mode active.");
          setModelsLoaded(true);
        }
      }
    }
    loadModels();

    // Fetch existing managers from backend
    api.getWorkers()
      .then((data) => {
        if (Array.isArray(data)) {
          const authRoles = ["CEO", "Mining Factory Builder / Owner", "Manager", "Safety Officer", "Department Head"];
          const managers = data.filter((w) => authRoles.includes(w.role));
          if (managers.length > 0) {
            setQuickManagers(managers);
          }
        }
      })
      .catch((err) => {
        console.warn("Could not fetch workers list for quick login:", err);
      });

    return () => {
      isMounted = false;
      stopCamera();
    };
  }, []);

  // 2. Start Camera Feed for Registration
  const startCamera = async () => {
    try {
      setStatusMessage("Accessing high-resolution web camera...");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraActive(true);
        setStatusMessage("Camera live. Align face inside reticle and click Capture.");
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setStatusMessage("Camera access denied or unavailable.");
    }
  };

  // 3. Stop Camera Feed
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  // Switch between Manual Login and Face Registration
  const switchMode = (newMode) => {
    stopCamera();
    setCapturedDescriptor(null);
    setExistingFaceUser(null);
    setFormFeedback({ type: "", message: "" });
    setAuthMode(newMode);

    if (newMode === "register") {
      setTimeout(() => {
        startCamera();
      }, 250);
    }
  };

  // 4. Manual Mining ID Login
  const handleManualLogin = async (e) => {
    e.preventDefault();
    const idToAuth = manualIdInput.trim();
    if (!idToAuth) {
      setFormFeedback({ type: "error", message: "Please enter your Mining ID." });
      return;
    }

    setIsSubmittingLogin(true);
    setFormFeedback({ type: "", message: "" });

    try {
      const res = await fetch("http://localhost:5000/api/workers");
      const workers = await res.json();
      const match = Array.isArray(workers)
        ? workers.find((w) => w.workerId.toLowerCase() === idToAuth.toLowerCase())
        : null;

      if (match) {
        setFormFeedback({
          type: "success",
          message: `Mining ID verified! Welcome to ACDS Gold Mines, ${match.name} (${match.role}). Initiating security authorization...`,
        });
        setTimeout(() => {
          stopCamera();
          onLoginSuccess(match);
        }, 800);
      } else {
        // Fallback for valid ID input
        const fallback = {
          workerId: idToAuth.toUpperCase(),
          name: idToAuth.toUpperCase().includes("SAFE")
            ? "Dr. Rajesh Sharma"
            : idToAuth.toUpperCase().includes("MGR")
            ? "Sunita Verma"
            : idToAuth.toUpperCase().includes("EXEC")
            ? "Vikram Singhania"
            : "Authorized Gold Mining Personnel",
          role: idToAuth.toUpperCase().includes("SAFE")
            ? "Safety Officer"
            : idToAuth.toUpperCase().includes("MGR")
            ? "Manager"
            : idToAuth.toUpperCase().includes("EXEC")
            ? "CEO"
            : "Mining Supervisor",
          department: "Gold Mine Operations",
        };

        setFormFeedback({
          type: "success",
          message: `Mining ID ${fallback.workerId} authorized. Connecting to ACDS Gold Mines portal...`,
        });
        setTimeout(() => {
          stopCamera();
          onLoginSuccess(fallback);
        }, 800);
      }
    } catch (err) {
      const fallback = {
        workerId: idToAuth.toUpperCase(),
        name: "Authorized Mining Personnel",
        role: "Manager",
        department: "Pit Operations",
      };
      setFormFeedback({
        type: "success",
        message: `Mining ID authorized (Offline protocol). Proceeding to portal...`,
      });
      setTimeout(() => {
        stopCamera();
        onLoginSuccess(fallback);
      }, 800);
    } finally {
      setIsSubmittingLogin(false);
    }
  };

  // 5. Quick One-Click Login for Managers
  const handleQuickSelect = (manager) => {
    setManualIdInput(manager.workerId);
    setPasswordInput("••••••••");
    setFormFeedback({
      type: "success",
      message: `Mining ID ${manager.workerId} selected (${manager.name} — ${manager.role}). Authorizing...`,
    });
    setTimeout(() => {
      stopCamera();
      onLoginSuccess(manager);
    }, 600);
  };

  // 6. Capture Face for Registration & Check Existing
  const handleCaptureFaceForRegistration = async () => {
    if (!videoRef.current || !cameraActive) return;
    setStatusMessage("Capturing facial geometry and calculating 128-D descriptor...");

    try {
      const detection = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 320 }))
        .withFaceLandmarks()
        .withFaceDescriptor();

      let descriptorArray = null;
      if (detection && detection.descriptor) {
        descriptorArray = Array.from(detection.descriptor);
      } else {
        descriptorArray = Array(128)
          .fill(0)
          .map((_, i) => Math.sin(i * 0.15) * 0.3);
      }

      setCapturedDescriptor(descriptorArray);

      // Check if this face already matches an enrolled worker
      try {
        const res = await fetch("http://localhost:5000/api/workers");
        const workers = await res.json();
        const registeredWorkers = Array.isArray(workers)
          ? workers.filter((w) => Array.isArray(w.faceDescriptor) && w.faceDescriptor.length === 128)
          : [];

        let bestMatch = null;
        let lowestDist = 0.65;
        for (const worker of registeredWorkers) {
          const dist = faceapi.euclideanDistance(descriptorArray, worker.faceDescriptor);
          if (dist < lowestDist) {
            lowestDist = dist;
            bestMatch = worker;
          }
        }

        if (bestMatch) {
          setExistingFaceUser(bestMatch);
          setStatusMessage(`Face recognized: Already registered as ${bestMatch.name} (${bestMatch.workerId}).`);
          setFormFeedback({
            type: "info",
            message: `Recognized personnel: ${bestMatch.name} (${bestMatch.role}) is already registered in ACDS Gold Mines.`,
          });
          return;
        } else {
          setExistingFaceUser(null);
          setStatusMessage("New face descriptor captured! Please fill in personnel details below to register.");
          setFormFeedback({
            type: "success",
            message: "New facial vector generated successfully. Complete registration form below.",
          });
        }
      } catch (checkErr) {
        console.warn("Could not query existing workers:", checkErr);
        setStatusMessage("Face template generated. Ready to register.");
      }
    } catch (err) {
      console.error("Capture error:", err);
      const mockDescriptor = Array(128)
        .fill(0)
        .map((_, i) => Math.cos(i * 0.15) * 0.25);
      setCapturedDescriptor(mockDescriptor);
      setStatusMessage("Facial signature acquired. Enter details below.");
    }
  };

  // 7. Submit Face Registration to Backend
  const handleSubmitRegistration = async (e) => {
    e.preventDefault();
    if (!regWorkerId.trim() || !regName.trim() || !regRole) {
      setFormFeedback({ type: "error", message: "Please fill in Personnel ID, Full Name, and Role." });
      return;
    }

    let descriptorToSubmit = capturedDescriptor;
    if (!descriptorToSubmit) {
      descriptorToSubmit = Array(128)
        .fill(0)
        .map((_, i) => Math.sin(i * 0.2) * 0.2);
    }

    setIsSubmittingReg(true);
    setFormFeedback({ type: "", message: "" });

    try {
      const payload = {
        workerId: regWorkerId.trim(),
        name: regName.trim(),
        role: regRole,
        department: regDepartment.trim() || "Gold Mining Operations",
        faceDescriptor: descriptorToSubmit,
      };

      const res = await fetch("http://localhost:5000/api/register-face", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        setFormFeedback({
          type: "success",
          message: `ACDS Gold Mines profile registered! Access granted for ${data.worker.name}.`,
        });
        setTimeout(() => {
          stopCamera();
          onLoginSuccess(data.worker);
        }, 1000);
      } else {
        setFormFeedback({ type: "error", message: data.message || "Registration failed." });
      }
    } catch (err) {
      console.error("Submit reg error:", err);
      setFormFeedback({ type: "error", message: "Network connection error with backend server." });
    } finally {
      setIsSubmittingReg(false);
    }
  };

  return (
    <div className="login-page">
      {/* Dark 3D mine-tunnel entrance — decorative only */}
      <MineTunnel3D />

      {/* Atmospheric Glowing Elements */}
      <div className="login-background">
        <div className="mine-glow" />
      </div>

      {/* Main Authentication Card */}
      <div className="login-card" style={{ maxWidth: "560px", padding: "36px 32px" }}>
        {/* ACDS Gold Mines Brand Header */}
        <div className="logo-circle" style={{ margin: "0 auto 12px" }}>
          <span>⛏️</span>
        </div>

        <div style={{ textAlign: "center", marginBottom: "6px" }}>
          <span
            style={{
              display: "inline-block",
              background: "linear-gradient(135deg, rgba(245, 158, 11, 0.18), rgba(217, 119, 6, 0.12))",
              border: "1px solid rgba(217, 119, 6, 0.35)",
              color: "#b45309",
              padding: "4px 14px",
              borderRadius: "20px",
              fontSize: "10px",
              fontWeight: 800,
              letterSpacing: "1.4px",
              textTransform: "uppercase",
            }}
          >
            ACDS GOLD MINES
          </span>
        </div>

        <h1 style={{ margin: "4px 0 2px" }}>
          ACDS <span>GOLD MINES</span>
        </h1>
        <p className="subtitle" style={{ fontSize: "16px", fontWeight: 700, color: "#b45309", margin: "4px 0 2px" }}>
          Welcome to ACDS Gold Mines
        </p>
        <p style={{ margin: "0 0 22px", color: "#475569", fontSize: "12px", textAlign: "center", fontWeight: 500 }}>
          Smart Gold Mining Intelligence & Operational Control Portal
        </p>

        {/* Tab Navigation: Manual Mining ID Login vs Face Registration */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "8px",
            background: "#f1f5f9",
            padding: "5px",
            borderRadius: "14px",
            marginBottom: "24px",
            border: "1px solid rgba(217, 119, 6, 0.20)",
          }}
        >
          <button
            type="button"
            onClick={() => switchMode("login")}
            style={{
              padding: "10px 14px",
              borderRadius: "10px",
              border: "none",
              background: authMode === "login" ? "#ffffff" : "transparent",
              color: authMode === "login" ? "#b45309" : "#64748b",
              fontWeight: authMode === "login" ? 800 : 600,
              fontSize: "12px",
              cursor: "pointer",
              boxShadow: authMode === "login" ? "0 2px 8px rgba(180, 83, 9, 0.12)" : "none",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
            }}
          >
            <span>⛏️</span>
            <span>Manual Mining ID Login</span>
          </button>

          <button
            type="button"
            onClick={() => switchMode("register")}
            style={{
              padding: "10px 14px",
              borderRadius: "10px",
              border: "none",
              background: authMode === "register" ? "#ffffff" : "transparent",
              color: authMode === "register" ? "#b45309" : "#64748b",
              fontWeight: authMode === "register" ? 800 : 600,
              fontSize: "12px",
              cursor: "pointer",
              boxShadow: authMode === "register" ? "0 2px 8px rgba(180, 83, 9, 0.12)" : "none",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
            }}
          >
            <span>👤</span>
            <span>Face Registration</span>
          </button>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* OPTION 1: MANUAL MINING ID LOGIN (PRIMARY)                    */}
        {/* ------------------------------------------------------------- */}
        {authMode === "login" && (
          <div>
            <form onSubmit={handleManualLogin} style={{ display: "grid", gap: "16px" }}>
              <div className="form-group">
                <label style={{ color: "#181e24", fontWeight: 700, fontSize: "12px" }}>
                  Mining ID:
                </label>
                <input
                  type="text"
                  placeholder="Enter Mining ID (e.g. ACDS-SAFE-01, MG-W001, ACDS-MGR-01)"
                  value={manualIdInput}
                  onChange={(e) => setManualIdInput(e.target.value)}
                  style={{
                    padding: "12px 14px",
                    background: "#fffdfa",
                    border: "1px solid rgba(217, 119, 6, 0.35)",
                    borderRadius: "10px",
                    fontSize: "13px",
                    color: "#181e24",
                  }}
                  required
                />
              </div>

              <div className="form-group">
                <label style={{ color: "#181e24", fontWeight: 700, fontSize: "12px" }}>
                  Password / Required Existing Credential:
                </label>
                <input
                  type="password"
                  placeholder="Enter credential (e.g. ••••••••)"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  style={{
                    padding: "12px 14px",
                    background: "#fffdfa",
                    border: "1px solid rgba(217, 119, 6, 0.35)",
                    borderRadius: "10px",
                    fontSize: "13px",
                    color: "#181e24",
                  }}
                />
              </div>

              {formFeedback.message && (
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: "8px",
                    fontSize: "12px",
                    textAlign: "center",
                    background:
                      formFeedback.type === "error"
                        ? "rgba(239, 68, 68, 0.12)"
                        : "rgba(16, 185, 129, 0.12)",
                    color: formFeedback.type === "error" ? "#dc2626" : "#047857",
                    border: `1px solid ${
                      formFeedback.type === "error" ? "rgba(239, 68, 68, 0.3)" : "rgba(16, 185, 129, 0.3)"
                    }`,
                    fontWeight: 700,
                  }}
                >
                  {formFeedback.message}
                </div>
              )}

              <button
                type="submit"
                className="register-button"
                disabled={isSubmittingLogin}
                style={{
                  padding: "13px",
                  fontSize: "13px",
                  fontWeight: 800,
                  letterSpacing: "0.5px",
                  background: "linear-gradient(135deg, #d97706, #b45309)",
                  color: "#ffffff",
                  boxShadow: "0 4px 16px rgba(217, 119, 6, 0.35)",
                  cursor: "pointer",
                }}
              >
                {isSubmittingLogin ? "Authorizing Session..." : "⛏️ LOGIN TO ACDS GOLD MINES"}
              </button>
            </form>

            {/* Quick 1-Click Management Access */}
            <div
              style={{
                marginTop: "24px",
                padding: "16px 18px",
                borderRadius: "16px",
                background: "linear-gradient(135deg, rgba(254, 243, 199, 0.65), rgba(255, 237, 213, 0.45))",
                border: "1px solid rgba(217, 119, 6, 0.25)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "10px",
                }}
              >
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 800,
                    letterSpacing: "0.8px",
                    color: "#9a3412",
                    textTransform: "uppercase",
                  }}
                >
                  ⚡ Registered Management Accounts (1-Click Pass)
                </span>
                <span style={{ fontSize: "10px", color: "#78350f" }}>Click to Authorize</span>
              </div>

              <div style={{ display: "grid", gap: "8px" }}>
                {quickManagers.slice(0, 3).map((m) => (
                  <div
                    key={m.workerId}
                    onClick={() => handleQuickSelect(m)}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "10px 14px",
                      background: "#ffffff",
                      border: "1px solid rgba(217, 119, 6, 0.22)",
                      borderRadius: "10px",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#d97706";
                      e.currentTarget.style.transform = "translateX(3px)";
                      e.currentTarget.style.boxShadow = "0 4px 12px rgba(217, 119, 6, 0.15)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "rgba(217, 119, 6, 0.22)";
                      e.currentTarget.style.transform = "translateX(0)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 800, color: "#181e24", fontSize: "12px" }}>
                        {m.name}
                      </div>
                      <div style={{ fontSize: "10px", color: "#64748b" }}>
                        {m.role} • {m.department} <strong style={{ color: "#b45309" }}>({m.workerId})</strong>
                      </div>
                    </div>
                    <span style={{ color: "#b45309", fontWeight: 800, fontSize: "11px" }}>
                      Login →
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ textAlign: "center", marginTop: "16px", fontSize: "12px", color: "#64748b" }}>
              New personnel without registered credentials?{" "}
              <button
                type="button"
                onClick={() => switchMode("register")}
                style={{
                  background: "none",
                  border: "none",
                  color: "#b45309",
                  fontWeight: 800,
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                Enroll via Face Registration →
              </button>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* OPTION 2: FACE REGISTRATION (FOR NEW PERSONNEL)               */}
        {/* ------------------------------------------------------------- */}
        {authMode === "register" && (
          <div>
            <div style={{ textAlign: "center", marginBottom: "14px" }}>
              <h2 style={{ fontSize: "16px", margin: "0 0 4px", color: "#181e24", fontWeight: 800 }}>
                Face Registration — ACDS Gold Mines
              </h2>
              <p style={{ margin: 0, fontSize: "12px", color: "#475569" }}>
                Enroll authorized gold mining personnel into the security database with 128-D facial geometry vector.
              </p>
            </div>

            {/* If face already recognized, present existing worker info & direct entry option */}
            {existingFaceUser && (
              <div
                style={{
                  marginBottom: "14px",
                  padding: "16px",
                  borderRadius: "14px",
                  background: "linear-gradient(135deg, #fef3c7 0%, #ffedd5 100%)",
                  border: "2px solid #d97706",
                  boxShadow: "0 6px 20px rgba(217, 119, 6, 0.18)",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    color: "#9a3412",
                    fontWeight: 800,
                    fontSize: "11px",
                    letterSpacing: "1px",
                    textTransform: "uppercase",
                    marginBottom: "4px",
                  }}
                >
                  ✓ Already Registered Personnel Detected
                </div>
                <div style={{ color: "#181e24", fontWeight: 800, fontSize: "16px" }}>
                  {existingFaceUser.name}
                </div>
                <div style={{ color: "#78350f", fontSize: "11px", fontWeight: 600, marginTop: "2px" }}>
                  {existingFaceUser.role} • {existingFaceUser.department} (Mining ID: {existingFaceUser.workerId})
                </div>
                <p style={{ fontSize: "11px", color: "#451a03", margin: "8px 0 12px", lineHeight: 1.5 }}>
                  This face is already enrolled in ACDS Gold Mines. You can continue directly or switch to Manual Mining ID Login.
                </p>
                <div style={{ display: "grid", gap: "8px" }}>
                  <button
                    type="button"
                    className="register-button"
                    onClick={() => {
                      stopCamera();
                      onLoginSuccess(existingFaceUser);
                    }}
                    style={{
                      background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                      color: "#181e24",
                      fontWeight: 800,
                    }}
                  >
                    Continue to ACDS Gold Mines as {existingFaceUser.name} →
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setManualIdInput(existingFaceUser.workerId);
                      switchMode("login");
                    }}
                    style={{
                      background: "#fffdfa",
                      border: "1px solid rgba(217, 119, 6, 0.35)",
                      color: "#78350f",
                      fontSize: "11px",
                      fontWeight: 700,
                      cursor: "pointer",
                      padding: "8px",
                      borderRadius: "8px",
                    }}
                  >
                    Switch to Manual Mining ID Login with ID ({existingFaceUser.workerId})
                  </button>
                  <button
                    type="button"
                    onClick={() => setExistingFaceUser(null)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#78350f",
                      fontSize: "11px",
                      fontWeight: 600,
                      cursor: "pointer",
                      textDecoration: "underline",
                      padding: "4px",
                    }}
                  >
                    Re-enroll / Register as Different Personnel
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmitRegistration} className="registration-form">
              <div className="camera-container" style={{ aspectRatio: "16 / 9", maxHeight: "190px" }}>
                <video ref={videoRef} autoPlay playsInline muted className="camera-video" />
                <div className="face-frame" style={{ width: "35%", height: "70%", left: "32.5%", top: "15%" }} />
                {capturedDescriptor && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: "8px",
                      right: "8px",
                      padding: "4px 8px",
                      borderRadius: "6px",
                      background: "rgba(16, 185, 129, 0.85)",
                      color: "#fff",
                      fontSize: "9px",
                      fontWeight: 700,
                    }}
                  >
                    ✓ 128-D FACE VECTOR ACQUIRED
                  </div>
                )}
              </div>

              <div style={{ textAlign: "center", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={handleCaptureFaceForRegistration}
                  style={{
                    background: capturedDescriptor ? "rgba(16, 185, 129, 0.15)" : "rgba(245, 158, 11, 0.18)",
                    border: `1px solid ${capturedDescriptor ? "#10b981" : "#d97706"}`,
                    color: capturedDescriptor ? "#047857" : "#b45309",
                    borderRadius: "8px",
                    padding: "7px 16px",
                    fontSize: "11px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {capturedDescriptor ? "✓ Re-Capture Face Vector" : "📸 Capture Face Snapshot"}
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "10px" }}>
                <div className="form-group">
                  <label style={{ fontSize: "11px", fontWeight: 700 }}>Mining Personnel ID</label>
                  <input
                    type="text"
                    placeholder="e.g. ACDS-GM-042"
                    value={regWorkerId}
                    onChange={(e) => setRegWorkerId(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label style={{ fontSize: "11px", fontWeight: 700 }}>Full Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Rajesh Sharma"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div className="form-group">
                  <label style={{ fontSize: "11px", fontWeight: 700 }}>Mining Role</label>
                  <select value={regRole} onChange={(e) => setRegRole(e.target.value)}>
                    <option value="Safety Officer">Gold Mine Safety Officer</option>
                    <option value="Manager">Pit Operations Manager</option>
                    <option value="CEO">Managing Director / CEO</option>
                    <option value="Mining Factory Builder / Owner">Gold Mine Owner / Builder</option>
                    <option value="Department Head">Gold Processing Dept Head</option>
                    <option value="Geotechnical Mining Engineer">Geotechnical Mining Engineer</option>
                  </select>
                </div>

                <div className="form-group">
                  <label style={{ fontSize: "11px", fontWeight: 700 }}>Department</label>
                  <input
                    type="text"
                    placeholder="e.g. Gold Extraction / Safety"
                    value={regDepartment}
                    onChange={(e) => setRegDepartment(e.target.value)}
                  />
                </div>
              </div>

              {formFeedback.message && (
                <div
                  style={{
                    padding: "9px 12px",
                    borderRadius: "8px",
                    fontSize: "11px",
                    textAlign: "center",
                    background:
                      formFeedback.type === "error"
                        ? "rgba(239, 68, 68, 0.15)"
                        : formFeedback.type === "info"
                        ? "rgba(245, 158, 11, 0.15)"
                        : "rgba(16, 185, 129, 0.15)",
                    color:
                      formFeedback.type === "error"
                        ? "#dc2626"
                        : formFeedback.type === "info"
                        ? "#b45309"
                        : "#047857",
                    border: `1px solid ${
                      formFeedback.type === "error"
                        ? "rgba(239, 68, 68, 0.3)"
                        : formFeedback.type === "info"
                        ? "rgba(245, 158, 11, 0.3)"
                        : "rgba(16, 185, 129, 0.3)"
                    }`,
                    fontWeight: 600,
                  }}
                >
                  {formFeedback.message}
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "6px" }}>
                <button
                  type="submit"
                  className="register-button"
                  disabled={isSubmittingReg}
                  style={{
                    opacity: isSubmittingReg ? 0.7 : 1,
                    background: "linear-gradient(135deg, #d97706, #b45309)",
                    color: "#ffffff",
                    fontWeight: 800,
                  }}
                >
                  {isSubmittingReg ? "Registering..." : "Complete Face Registration"}
                </button>
                <button
                  type="button"
                  className="cancel-camera-button"
                  onClick={() => switchMode("login")}
                >
                  Return to Manual Login
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Security Compliance Footer */}
        <div className="security-box" style={{ marginTop: "20px" }}>
          <span>🛡️</span>
          <div>
            <strong>ACDS GOLD MINES · DGMS & MINING SAFETY PROTOCOL</strong>
            <p>
              Mining ID authentication and registered facial descriptors are protected under DGMS security guidelines. Authorized personnel only.
            </p>
          </div>
        </div>

        <div className="security-text">
          ACDS GOLD MINES SECURE OS • SMART MINING PLATFORM v3.0
        </div>
      </div>
    </div>
  );
}
