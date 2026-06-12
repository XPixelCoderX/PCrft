import express from "express";
import cors from "cors";
import fs from "fs";
import yaml from "js-yaml";
import path from "path";
import fetch from "node-fetch";
import { fileURLToPath } from "url";
import { BedrockPortal, Joinability } from "bedrock-portal";
import { Authflow } from "prismarine-auth";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ================== LOAD CONFIG ==================
const configPath = path.join(__dirname, "config.yml");
const config = yaml.load(fs.readFileSync(configPath, "utf8"));

const SERVER_IP = config.server.ip;
const SERVER_PORT = config.server.port;
let WORLD_VERSION = config.server.world_version || "latest";

const CACHE_FOLDER = config.bot.cache_folder || "./cache";
const API_PORT = config.bot.api_port || 3000;

// ================== AUTO-LATEST VERSION ==================
async function resolveVersion() {
  if (WORLD_VERSION !== "latest") {
    console.log(`[INFO] Using configured version: ${WORLD_VERSION}`);
    return WORLD_VERSION;
  }

  console.log("[INFO] Fetching latest Bedrock version...");

  const url =
    "https://raw.githubusercontent.com/PrismarineJS/minecraft-data/master/data/bedrock/common/versions.json";

  const res = await fetch(url);
  const list = await res.json();

  const latest = list[list.length - 1];

  console.log(`[OK] Latest version detected: ${latest}`);

  WORLD_VERSION = latest;
  return latest;
}

// ================== AUTH / PORTAL ==================
console.log("[INFO] Initializing Xbox authentication (prismarine-auth).");
console.log(
  "[INFO] On first use, a Microsoft device login URL and code will appear below in this console."
);

let portal;
let portalStarted = false;

async function initPortal() {
  const version = await resolveVersion();

  const auth = new Authflow("XboxBotAccount", CACHE_FOLDER);

  portal = new BedrockPortal(auth, {
    ip: SERVER_IP,
    port: SERVER_PORT,
    joinability: Joinability.FriendsOfFriends,
    world: {
      name: "PCrft Redirect",
      version: version,
      memberCount: 1,
      maxMemberCount: 100,
    },
  });
}

async function ensurePortalStarted() {
  if (!portalStarted) {
    console.log("[INFO] Starting Xbox Live portal...");
    await portal.start();
    portalStarted = true;
    console.log("[OK] Portal started and hooked into Xbox Live.");
  }
}

async function invitePlayer(gamertag) {
  await ensurePortalStarted();
  console.log(`[INFO] Sending invite to ${gamertag}...`);
  await portal.invitePlayer(gamertag);
  console.log(`[OK] Invite sent to ${gamertag}.`);
}

// ================== EXPRESS APP ==================
const app = express();
app.use(cors());
app.use(express.json());

// ================== DASHBOARD HTML ==================
const HTML = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>PCrft Xbox Invite Bot</title>
<style>
  :root {
    --bg: #111111;
    --bg-card: #1b1b1b;
    --accent: #d0d0d0;
    --text: #f5f5f5;
    --muted: #a0a0a0;
    --danger: #ff4b4b;
    --success: #4bff8a;
  }
  body {
    background: var(--bg);
    color: var(--text);
    font-family: system-ui, sans-serif;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
  }
  .card {
    background: var(--bg-card);
    padding: 24px;
    border-radius: 12px;
    width: 360px;
    border: 1px solid #2a2a2a;
  }
  input {
    width: 100%;
    padding: 10px;
    background: #151515;
    border: 1px solid #2a2a2a;
    border-radius: 6px;
    color: var(--text);
    margin-top: 8px;
  }
  button {
    width: 100%;
    margin-top: 14px;
    padding: 10px;
    background: #2b2b2b;
    border: 1px solid #2a2a2a;
    color: var(--text);
    border-radius: 6px;
    cursor: pointer;
  }
  button:hover {
    filter: brightness(1.1);
  }
  .status {
    margin-top: 12px;
    font-size: 0.8rem;
    color: var(--muted);
  }
</style>
</head>
<body>
<div class="card">
  <h2>PCrft Xbox Invite Bot</h2>
  <p>Enter a Gamertag to send an invite.</p>

  <input id="gamertag" placeholder="Gamertag">

  <button onclick="invite()">Send Invite</button>

  <div class="status" id="status"></div>
</div>

<script>
async function invite() {
  const g = document.getElementById("gamertag").value.trim();
  if (!g) {
    document.getElementById("status").innerText = "Enter a gamertag.";
    return;
  }

  const res = await fetch("/api/invite", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ gamertag: g })
  });

  const data = await res.json();
  document.getElementById("status").innerText =
    data.ok ? "Invite sent." : "Error: " + data.error;
}
</script>
</body>
</html>
`;

// ================== ROUTES ==================
app.get("/", (_req, res) => {
  res.setHeader("Content-Type", "text/html");
  res.send(HTML);
});

app.get("/auth", (_req, res) => {
  res.send(`
    <h1>Xbox Authentication</h1>
    <p>Check the Node console for your Microsoft device login code.</p>
    <a href="https://www.microsoft.com/link" target="_blank">Open Microsoft Login</a>
  `);
});

app.post("/api/invite", async (req, res) => {
  const { gamertag } = req.body || {};
  if (!gamertag)
    return res.status(400).json({ ok: false, error: "gamertag required" });

  try {
    await invitePlayer(gamertag);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get("/api/status", (_req, res) => {
  res.json({
    portalStarted,
    serverIp: SERVER_IP,
    serverPort: SERVER_PORT,
    worldVersion: WORLD_VERSION,
  });
});

// ================== START ==================
await initPortal();

app.listen(API_PORT, () => {
  console.log(`[OK] Dashboard running at http://127.0.0.1:${API_PORT}`);
});
