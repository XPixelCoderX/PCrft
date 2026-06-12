const express = require('express');
const cors = require('cors');
const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');
const { BedrockPortal, Joinability } = require('bedrock-portal');
const { Authflow } = require('prismarine-auth');

// ================== LOAD CONFIG ==================
const configPath = path.join(__dirname, 'config.yml');
const config = yaml.load(fs.readFileSync(configPath, 'utf8'));

const SERVER_IP = config.server.ip;
const SERVER_PORT = config.server.port;
const WORLD_VERSION = config.server.world_version || '1.26.20';

const CACHE_FOLDER = config.bot.cache_folder || './cache';
const API_PORT = config.bot.api_port || 3000;

// ================== AUTH / PORTAL ==================
// IMPORTANT: same pattern as your working file.
// Do NOT pass options into Authflow. bedrock-portal patches it internally.
console.log('[INFO] Initializing Xbox authentication (prismarine-auth).');
console.log('[INFO] On first use, a Microsoft device login URL and code will appear in this console.');

const auth = new Authflow('XboxBotAccount', CACHE_FOLDER);

// Same constructor style as your working bot:
const portal = new BedrockPortal(auth, {
    ip: SERVER_IP,
    port: SERVER_PORT,
    joinability: Joinability.FriendsOfFriends,
    world: {
        name: 'PCrft Redirect',
        version: WORLD_VERSION,
        memberCount: 1,
        maxMemberCount: 100
    }
});

let portalStarted = false;

async function startPortal() {
    if (portalStarted) return;
    console.log('[INFO] Starting Xbox Live Hook...');
    await portal.start();
    portalStarted = true;
    console.log('[OK] Successfully hooked into Xbox Live Network!');
    console.log('[OK] Your world is now visible to friends.');
}

async function invitePlayer(gamertag) {
    if (!portalStarted) {
        await startPortal();
    }
    console.log(`[INFO] Sending system invite to: ${gamertag}...`);
    await portal.invitePlayer(gamertag);
    console.log(`[OK] Invite successfully sent to ${gamertag}!`);
}

// ================== EXPRESS APP ==================
const app = express();
app.use(cors());
app.use(express.json());

// Simple dark gray dashboard
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
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
    background: #111111;
    color: var(--text);
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }
  .card {
    width: 100%;
    max-width: 420px;
    background: #1b1b1b;
    border-radius: 16px;
    padding: 24px 26px 22px;
    border: 1px solid #2a2a2a;
    box-shadow: 0 18px 45px rgba(0,0,0,0.7);
  }
  .card h2 {
    margin-bottom: 4px;
    font-size: 1.2rem;
  }
  .subtitle {
    font-size: 0.8rem;
    color: var(--muted);
    margin-bottom: 16px;
  }
  .field-label {
    font-size: 0.78rem;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--muted);
    margin-bottom: 6px;
  }
  input[type="text"] {
    width: 100%;
    padding: 11px 14px;
    border-radius: 999px;
    border: 1px solid #2a2a2a;
    background: #151515;
    color: var(--text);
    font-size: 0.9rem;
    outline: none;
  }
  input[type="text"]::placeholder {
    color: #777777;
  }
  input[type="text"]:focus {
    border-color: var(--accent);
  }
  button {
    width: 100%;
    border-radius: 999px;
    border: 1px solid #2a2a2a;
    padding: 10px 12px;
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    color: var(--text);
    background: #2b2b2b;
    margin-top: 14px;
  }
  button:hover {
    filter: brightness(1.1);
  }
  .status {
    margin-top: 12px;
    font-size: 0.8rem;
    color: var(--muted);
  }
  .status-pill {
    margin-top: 10px;
    font-size: 0.78rem;
    color: var(--muted);
  }
</style>
</head>
<body>
<div class="card">
  <h2>PCrft Xbox Invite Bot</h2>
  <div class="subtitle">Enter a Gamertag and send an Xbox invite.</div>

  <div class="field-label">Xbox Gamertag</div>
  <input id="gamertag" type="text" placeholder="Example: n2ab" autocomplete="off">

  <button id="btn-invite">Send Invite</button>

  <div class="status" id="status"></div>
  <div class="status-pill" id="status-pill"></div>
</div>

<script>
async function refreshStatus() {
  try {
    const res = await fetch('/api/status');
    const data = await res.json();
    const pill = document.getElementById('status-pill');
    pill.textContent = 'Portal: ' + (data.portalStarted ? 'Online' : 'Offline') +
      ' | Server: ' + data.serverIp + ':' + data.serverPort +
      ' | World version: ' + data.worldVersion;
  } catch (e) {
    document.getElementById('status-pill').textContent = 'Status: Error';
  }
}

document.getElementById('btn-invite').addEventListener('click', async () => {
  const g = document.getElementById('gamertag').value.trim();
  const status = document.getElementById('status');
  if (!g) {
    status.textContent = 'Please enter a gamertag.';
    return;
  }
  status.textContent = 'Sending invite...';
  try {
    const res = await fetch('/api/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gamertag: g })
    });
    const data = await res.json();
    if (data.ok) {
      status.textContent = 'Invite sent to ' + g + '.';
    } else {
      status.textContent = 'Error: ' + (data.error || 'Unknown error');
    }
  } catch (e) {
    status.textContent = 'Error: ' + e.message;
  }
});

refreshStatus();
setInterval(refreshStatus, 8000);
</script>
</body>
</html>
`;

// Routes
app.get('/', (_req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(HTML);
});

app.get('/auth', (_req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(`
      <h1>Xbox Authentication</h1>
      <p>On first run, the bot prints a Microsoft Device Login URL and code in the Node.js console.</p>
      <p>Open <a href="https://www.microsoft.com/link" target="_blank">https://www.microsoft.com/link</a> and enter the code shown in the console.</p>
    `);
});

app.post('/api/invite', async (req, res) => {
    const { gamertag } = req.body || {};
    if (!gamertag) {
        return res.status(400).json({ ok: false, error: 'gamertag required' });
    }
    try {
        await invitePlayer(gamertag);
        res.json({ ok: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ ok: false, error: err.message || 'invite failed' });
    }
});

app.get('/api/status', (_req, res) => {
    res.json({
        portalStarted,
        serverIp: SERVER_IP,
        serverPort: SERVER_PORT,
        worldVersion: WORLD_VERSION
    });
});

// Start portal immediately (like your working CLI bot), then start HTTP
startPortal()
    .then(() => {
        app.listen(API_PORT, () => {
            console.log(`[OK] Web dashboard and API listening on http://127.0.0.1:${API_PORT}`);
        });
    })
    .catch(err => {
        console.error('[FATAL] Failed to start portal:', err);
        process.exit(1);
    });
