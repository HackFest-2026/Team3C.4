/**
 * MINEGUARD ROBOTIC / AI PPE DETECTION SUITE TEST
 * Tests Roboflow proxy endpoint, honest unconfigured fallback, and 3-item mapping
 */

const { test, describe, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const ppeRoutes = require("../routes/ppeRoutes");

describe("MineGuard AI PPE Detection & Roboflow Integration Tests", () => {
  let app;
  let server;
  let baseUrl;
  const originalEnv = { ...process.env };

  beforeEach(async () => {
    app = express();
    app.use(express.json({ limit: "10mb" }));
    app.use("/api/ppe", ppeRoutes);

    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  afterEach(async () => {
    process.env = { ...originalEnv };
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  test("1. Unconfigured State: GET /api/ppe/config reports unconfigured without exposing secrets", async () => {
    delete process.env.ROBOFLOW_API_KEY;
    delete process.env.ROBOFLOW_MODEL_URL;

    const res = await fetch(`${baseUrl}/api/ppe/config`);
    assert.equal(res.status, 200);
    const body = await res.json();

    assert.equal(body.configured, false);
    assert.deepEqual(body.requiredItems, ["helmet", "goggles", "mask"]);
    assert.match(body.instructions, /ROBOFLOW_MODEL_URL/);
    assert.equal(body.apiKey, undefined, "Must NEVER leak API key in response");
  });

  test("2. Unconfigured State: POST /api/ppe/detect does NOT fabricate mock detections", async () => {
    process.env.ROBOFLOW_MODEL_URL = "[PASTE MY ROBOFLOW MODEL URL HERE]";
    process.env.ROBOFLOW_API_KEY = "[CONFIGURE MY ROBOFLOW API KEY SECURELY]";

    const res = await fetch(`${baseUrl}/api/ppe/detect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image: "data:image/jpeg;base64,dummyfakeimage123",
        workerId: "ACDS-W001",
      }),
    });

    assert.equal(res.status, 200);
    const body = await res.json();

    assert.equal(body.success, false);
    assert.equal(body.configured, false);
    assert.equal(body.complianceStatus, "Incomplete");
    // Ensure all 3 required safety items are reported Unknown/undetected, not fabricated
    assert.equal(body.items.helmet.detected, false);
    assert.equal(body.items.helmet.status, "Unknown");
    assert.equal(body.items.goggles.detected, false);
    assert.equal(body.items.goggles.status, "Unknown");
    assert.equal(body.items.mask.detected, false);
    assert.equal(body.items.mask.status, "Unknown");
  });

  test("3. Missing Payload Validation: POST /api/ppe/detect returns 400 when image is missing", async () => {
    const res = await fetch(`${baseUrl}/api/ppe/detect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workerId: "ACDS-W001" }),
    });

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.match(body.error, /Missing image/);
  });

  test("4. Configured State Status Check: Recognizes valid environment variables safely", async () => {
    process.env.ROBOFLOW_MODEL_URL = "https://detect.roboflow.com/ppe-detector-xyz/1";
    process.env.ROBOFLOW_API_KEY = "live_secret_key_12345";
    process.env.ROBOFLOW_VERSION = "2";

    const res = await fetch(`${baseUrl}/api/ppe/config`);
    assert.equal(res.status, 200);
    const body = await res.json();

    assert.equal(body.configured, true);
    assert.equal(body.version, "2");
    assert.equal(body.apiKey, undefined, "Must NEVER expose API key even when configured");
  });
});
