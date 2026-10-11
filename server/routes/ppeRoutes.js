const express = require("express");
const router = express.Router();

/**
 * Helper to check if a value is a placeholder or empty
 */
function isConfiguredValue(val) {
  if (!val || typeof val !== "string") return false;
  const trimmed = val.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) return false;
  if (trimmed.includes("PASTE") || trimmed.includes("CONFIGURE")) return false;
  return true;
}

/**
 * Parse Roboflow configuration from environment
 */
function getRoboflowConfig() {
  const modelUrl = process.env.ROBOFLOW_MODEL_URL || "";
  const apiKey = process.env.ROBOFLOW_API_KEY || "";
  const version = process.env.ROBOFLOW_VERSION || "1";
  const projectId = process.env.ROBOFLOW_PROJECT_ID || "";

  const isConfigured = isConfiguredValue(apiKey) && (isConfiguredValue(modelUrl) || isConfiguredValue(projectId));

  return {
    isConfigured,
    modelUrl: isConfigured ? modelUrl : null,
    apiKey: isConfigured ? apiKey : null,
    version: isConfigured ? version : null,
    projectId: isConfigured ? projectId : null,
  };
}

/**
 * Determine the Roboflow Inference API URL from configuration
 */
function resolveInferenceEndpoint(config) {
  const { modelUrl, apiKey, version, projectId } = config;
  if (!apiKey) return null;

  // Case 1: Full detect.roboflow.com or serverless.roboflow.com endpoint provided
  if (modelUrl && (modelUrl.includes("detect.roboflow.com") || modelUrl.includes("serverless.roboflow.com"))) {
    const url = new URL(modelUrl);
    url.searchParams.set("api_key", apiKey);
    return url.toString();
  }

  // Case 2: Universe URL e.g. https://universe.roboflow.com/workspace/project/model/version
  if (modelUrl && modelUrl.includes("universe.roboflow.com")) {
    const parts = modelUrl.replace(/^https?:\/\/universe\.roboflow\.com\//, "").split("/").filter(Boolean);
    // Typical pattern: workspace/project/...
    const proj = parts[1] || parts[0];
    const ver = parts[3] || version || "1";
    return `https://detect.roboflow.com/${proj}/${ver}?api_key=${apiKey}`;
  }

  // Case 3: Model identifier or fine-tune checkpoint (e.g. chitra-aralikatti/ppe-z0i9o-nrkan-1-rfdetr-medium-t1)
  const rawId = projectId || modelUrl || "";
  if (rawId) {
    if (rawId.includes("ppe-z0i9o-nrkan")) {
      const ver = version || "1";
      return `https://detect.roboflow.com/ppe-z0i9o-nrkan/${ver}?api_key=${apiKey}`;
    }

    const clean = rawId.replace(/^https?:\/\/[^/]+\//, "").split("?")[0];
    const parts = clean.split("/").filter(Boolean);
    let proj = parts[0];
    let ver = version || "1";

    if (parts.length >= 2) {
      proj = parts[1];
      if (parts[2]) ver = parts[2];
    }
    return `https://detect.roboflow.com/${proj}/${ver}?api_key=${apiKey}`;
  }

  return null;
}

/**
 * Class mapping and classification helper
 */
const PPE_PATTERNS = {
  helmet: {
    positive: [/\bhelmet\b/i, /\bhard[-_ ]?hat\b/i, /\bsafety[-_ ]?helmet\b/i],
    negative: [/\bno[-_ ]?helmet\b/i, /\bwithout[-_ ]?helmet\b/i, /\bno[-_ ]?hard[-_ ]?hat\b/i],
  },
  goggles: {
    positive: [/\bgoggles?\b/i, /\bglasses\b/i, /\bsafety[-_ ]?glasses\b/i, /\bsafety[-_ ]?goggles\b/i, /\beye[-_ ]?protection\b/i, /\beyewear\b/i],
    negative: [/\bno[-_ ]?goggles?\b/i, /\bno[-_ ]?glasses\b/i, /\bwithout[-_ ]?goggles?\b/i],
  },
  mask: {
    positive: [/\bmask\b/i, /\bface[-_ ]?mask\b/i, /\bfacemask\b/i, /\bsafety[-_ ]?mask\b/i, /\brespirator\b/i, /\bn95\b/i],
    negative: [/\bno[-_ ]?mask\b/i, /\bwithout[-_ ]?mask\b/i, /\bno[-_ ]?respirator\b/i],
  },
};

/**
 * Check if a prediction matches a pattern
 */
function matchItem(predictions, itemKey) {
  const config = PPE_PATTERNS[itemKey];
  let positiveMatch = null;
  let negativeMatch = null;

  for (const pred of predictions) {
    const className = (pred.class || pred.name || "").trim();

    // Check negative matches first
    for (const rx of config.negative) {
      if (rx.test(className)) {
        if (!negativeMatch || pred.confidence > negativeMatch.confidence) {
          negativeMatch = pred;
        }
      }
    }

    // Check positive matches
    for (const rx of config.positive) {
      if (rx.test(className)) {
        if (!positiveMatch || pred.confidence > positiveMatch.confidence) {
          positiveMatch = pred;
        }
      }
    }
  }

  if (positiveMatch) {
    return {
      detected: true,
      status: "Detected",
      confidence: Math.round((positiveMatch.confidence || 0) * 100),
      label: positiveMatch.class || positiveMatch.name,
      box: {
        x: positiveMatch.x,
        y: positiveMatch.y,
        width: positiveMatch.width,
        height: positiveMatch.height,
      },
    };
  }

  if (negativeMatch) {
    return {
      detected: false,
      status: "Missing",
      confidence: Math.round((negativeMatch.confidence || 0) * 100),
      label: negativeMatch.class || negativeMatch.name,
      box: {
        x: negativeMatch.x,
        y: negativeMatch.y,
        width: negativeMatch.width,
        height: negativeMatch.height,
      },
    };
  }

  // Not explicitly detected or negative
  return null;
}

/**
 * GET /api/ppe/config
 * Check if Roboflow model is configured without exposing private API keys.
 */
router.get("/config", (req, res) => {
  const config = getRoboflowConfig();
  res.json({
    configured: config.isConfigured,
    modelUrl: config.modelUrl ? config.modelUrl.split("?")[0] : null,
    version: config.version,
    requiredItems: ["helmet", "goggles", "mask"],
    instructions: config.isConfigured
      ? "Roboflow PPE model configured and active."
      : "Configure ROBOFLOW_MODEL_URL and ROBOFLOW_API_KEY in server/.env to enable live PPE model inference.",
  });
});

/**
 * POST /api/ppe/detect
 * Proxies detection request to trained Roboflow model.
 * Never fabricates detection if unconfigured or undetected.
 */
router.post("/detect", async (req, res) => {
  try {
    const { image, workerId } = req.body;
    const config = getRoboflowConfig();

    if (!image) {
      return res.status(400).json({
        success: false,
        error: "Missing image payload. Provide a base64 encoded image string.",
      });
    }

    // If model is NOT configured: return honest unconfigured status
    if (!config.isConfigured) {
      return res.status(200).json({
        success: false,
        configured: false,
        message: "Roboflow model is not configured. Please set ROBOFLOW_MODEL_URL and ROBOFLOW_API_KEY in server/.env.",
        complianceStatus: "Incomplete",
        items: {
          helmet: { detected: false, status: "Unknown", confidence: 0, label: "Safety Helmet" },
          goggles: { detected: false, status: "Unknown", confidence: 0, label: "Safety Goggles" },
          mask: { detected: false, status: "Unknown", confidence: 0, label: "Safety Mask" },
        },
        predictions: [],
      });
    }

    // Clean image data for Roboflow API
    let cleanBase64 = image;
    if (cleanBase64.includes(",")) {
      cleanBase64 = cleanBase64.split(",")[1];
    }

    const endpoint = resolveInferenceEndpoint(config);
    if (!endpoint) {
      return res.status(500).json({
        success: false,
        error: "Unable to resolve Roboflow inference endpoint from configuration.",
      });
    }

    // Call Roboflow Inference API securely from the backend
    const roboflowResponse = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: cleanBase64,
    });

    if (!roboflowResponse.ok) {
      const errText = await roboflowResponse.text().catch(() => "");
      return res.status(roboflowResponse.status).json({
        success: false,
        configured: true,
        error: `Roboflow inference API error: ${roboflowResponse.statusText}`,
        details: errText,
      });
    }

    const result = await roboflowResponse.json();
    const predictions = Array.isArray(result.predictions) ? result.predictions : [];

    // Analyze model predictions for each of the three PPE items
    const helmetMatch = matchItem(predictions, "helmet");
    const gogglesMatch = matchItem(predictions, "goggles");
    const maskMatch = matchItem(predictions, "mask");

    // Gather all predicted classes
    const predictedClasses = new Set(predictions.map((p) => (p.class || p.name || "").toLowerCase()));

    // Helper to evaluate item status when match is null
    const evaluateItem = (match, itemKey, label) => {
      if (match) return match;
      // When neither positive nor negative match is found by the model:
      // Report "Not Verified" rather than claiming it is Missing without evidence
      return {
        detected: false,
        status: "Not Verified",
        confidence: 0,
        label,
        box: null,
      };
    };

    const helmet = evaluateItem(helmetMatch, "helmet", "Safety Helmet");
    const goggles = evaluateItem(gogglesMatch, "goggles", "Safety Goggles");
    const mask = evaluateItem(maskMatch, "mask", "Safety Mask");

    // Calculate Overall Compliance
    let complianceStatus = "Pending Inspection";
    if (predictions.length === 0) {
      complianceStatus = "No PPE Detected";
    } else if (
      helmet.status === "Missing" ||
      goggles.status === "Missing" ||
      mask.status === "Missing"
    ) {
      complianceStatus = "Non-Compliant";
    } else if (helmet.detected && goggles.detected && mask.detected) {
      complianceStatus = "Compliant";
    } else if (helmet.detected || goggles.detected || mask.detected) {
      complianceStatus = "Partially Verified";
    } else {
      complianceStatus = "Not Verified";
    }

    // If workerId provided, attempt to update worker's PPE status in database if available
    let workerUpdated = false;
    if (workerId) {
      try {
        const Worker = require("../models/Worker");
        const newStatus = complianceStatus === "Compliant" ? "All PPE Verified" : "PPE Missing";
        await Worker.findOneAndUpdate(
          { workerId },
          { ppeStatus: newStatus, lastInspection: new Date() }
        );
        workerUpdated = true;
      } catch (err) {
        // Non-blocking if DB is not connected
      }
    }

    return res.json({
      success: true,
      configured: true,
      complianceStatus,
      items: {
        helmet,
        goggles,
        mask,
      },
      workerId: workerId || null,
      workerUpdated,
      predictions,
      imageDimensions: result.image || null,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[PPE Detection] Internal Error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error processing PPE detection.",
      details: error.message,
    });
  }
});

module.exports = router;
