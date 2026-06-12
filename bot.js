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
const WORLD_VERSION = config.server.world_version || '26.23';

const CACHE_FOLDER = config.bot.cache_folder || './cache';
const API_PORT = config.bot.api_port || 3000;

const MESSAGE_TEXT =
  (config.message && config.message.text) ||
  'If you want to rejoin the server, add "PCrft" on Xbox, and you will be able to join through your friends list!';

// ================== AUTH / PORTAL ==================
console.log('[INFO] Initializing Xbox authentication (prismarine-auth).');
console.log('[INFO] On first use, a Microsoft device login URL and code will appear below in this console.');

const auth = new Authflow('XboxBotAccount', CACHE_FOLDER);

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

async function ensurePortalStarted() {
  if (!portalStarted) {
    console.log('[INFO] Starting Xbox Live portal...');
    await portal.start();
    portalStarted = true;
    console.log('[OK] Portal started and hooked into Xbox Live.');
  }
}

async function invitePlayer(gamertag) {
  await ensurePortalStarted();
  console.log(`[INFO] Sending invite to ${gamertag}...`);
  await portal.invitePlayer(gamertag);
  console.log(`[OK] Invite sent to ${gamertag}.`);
}

async function messagePlayer(gamertag) {
  await ensurePortalStarted();
  console.log(`[INFO] Message for ${gamertag}: ${MESSAGE_TEXT}`);
  // No direct DM API; we still send an invite so they get a notification.
  await portal.invitePlayer(gamertag);
  console.log(`[OK] Message (via invite) processed for ${gamertag}.`);
}

// ================== EXPRESS APP ==================
const app = express();
app.use(cors());
app.use(express.json());

// Simple dark gray / light gray dashboard
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
    --accent-strong: #f0f0f0;
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
    max-width: 520px;
    background: #1b1b1b;
    border-radius: 16px;
    padding: 24px 26px 22px;
    border: 1px solid #2a2a2a;
    box-shadow: 0 18px 45px rgba(0,0,0,0.7);
  }
  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 18px;
  }
  .title-block {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .title {
    font-size: 1.2rem;
    font-weight: 600;
    letter-spacing: 0.03em;
  }
  .subtitle {
    font-size: 0.8rem;
    color: var(--muted);
  }
  .status-pill {
    padding: 6px 10px;
    border-radius: 999px;
    font-size: 0.75rem;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: #151515;
    border: 1px solid #2a2a2a;
  }
  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: var(--danger);
  }
  .status-label {
    color: var(--muted);
  }
  .status-value {
    color: var(--text);
    font-weight: 500;
  }
  .field-group {
    margin-top: 10px;
    margin-bottom: 14px;
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
  .hint {
    font-size: 0.75rem;
    color: var(--muted);
    margin-top: 6px;
  }
  .hint span {
    color: var(--accent);
    font-weight: 500;
  }
  .button-row {
    display: flex;
    gap: 8px;
    margin-top: 16px;
  }
  button {
    flex: 1;
    border-radius: 999px;
    border: 1px solid #2a2a2a;
    padding: 10px 12px;
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    color: var(--text);
    background: #222222;
  }
  button.primary {
    background: #2b2b2b;
  }
  button.danger {
    background: #3a1b1b;
  }
  button.secondary {
    background: #1f1f1f;
  }
  button:hover {
    filter: brightness(1.1);
  }
  .footer {
    margin-top: 18px;
    font-size: 0.72rem;
    color: var(--muted);
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
  }
  .status-toast {
    position: fixed;
    bottom: 18px;
    right: 18px;
    min-width: 220px;
    max-width: 320px;
    padding: 10px 12px;
    border-radius: 12px;
    font-size: 0.8rem;
    background: #1b1b1b;
    border: 1px solid #2a2a2a;
    box-shadow: 0 14px 30px rgba(0,0,0,0.8);
    display: flex;
    align-items: flex-start;
    gap: 8px;
    opacity: 0;
    transform: translateY(10px);
    pointer-events: none;
    transition: opacity 0.18s ease, transform 0.18s ease;
  }
  .status-toast.visible {
    opacity: 1;
    transform: translateY(0);
    pointer-events: auto;
  }
  .status-toast .dot {
    margin-top: 3px;
    width: 8px;
    height: 8px;
    border-radius: 999px;
  }
  .status-toast.success .dot {
    background: var(--success);
  }
  .status-toast.error .dot {
    background: var(--danger);
  }
  .status-toast .title {
    font-weight: 600;
    margin-bottom: 2px;
  }
  .status-toast .body {
    color: var(--muted);
  }
  @media (max-width: 600px) {
    .card { padding: 20px 18px 18px; }
    .button-row { flex-direction: column; }
  }
</style>
</head>
<body>
<div class="card">
  <div class="card-header">
    <div class="title-block">
      <div class="title">PCrft Xbox Invite Bot</div>
      <div class="subtitle">Gamertag input, instant invite and message.</div>
    </div>
    <div class="status-pill" id="status-pill">
      <span class="status-dot" id="status-dot"></span>
      <span class="status-label">Portal</span>
      <span class="status-value" id="status-value">Checking...</span>
    </div>
  </div>

  <div class="field-group">
    <div class="field-label">Xbox Gamertag</div>
    <input id="gamertag" type="text" placeholder="Example: n2ab" autocomplete="off">
    <div class="hint">
      Message includes:
      <span id="message-preview"></span>
    </div>
  </div>

  <div class="button-row">
    <button class="secondary" id="btn-invite">Invite</button>
    <button class="danger" id="btn-message">Send Message</button>
    <button class="primary" id="btn-both">Invite + Message</button>
  </div>

  <div class="footer">
    <span>Server: <span id="server-info"></span></span>
    <span><a href="/auth" style="color: var(--muted); text-decoration: none;">Xbox Auth Info</a></span>
  </div>
</div>

<div class="status-toast" id="toast">
  <div class="dot"></div>
  <div class="text">
    <div class="title" id="toast-title"></div>
    <div class="body" id="toast-body"></div>
  </div>
</div>

<script>
const toast = document.getElementById('toast');
const toastTitle = document.getElementById('toast-title');
const toastBody = document.getElementById('toast-body');

function showToast(type, title, body) {
  toast.classList.remove('success', 'error');
  toast.classList.add(type);
  toastTitle.textContent = title;
  toastBody.textContent = body;
  toast.classList.add('visible');
  setTimeout(() => toast.classList.remove('visible'), 2600);
}

async function callEndpoint(path, gamertag) {
  if (!gamertag || !gamertag.trim()) {
    showToast('error', 'Missing gamertag', 'Please enter a valid Xbox gamertag.');
    return;
  }
  try {
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gamertag: gamertag.trim() })
    });
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.error || 'Unknown error');
    showToast('success', 'Success', 'Action completed for ' + gamertag.trim() + '.');
  } catch (err) {
    showToast('error', 'Error', err.message || 'Request failed.');
  }
}

document.getElementById('btn-invite').addEventListener('click', () => {
  const g = document.getElementById('gamertag').value;
  callEndpoint('/api/invite', g);
});
document.getElementById('btn-message').addEventListener('click', () => {
  const g = document.getElementById('gamertag').value;
  callEndpoint('/api/message', g);
});
document.getElementById('btn-both').addEventListener('click', () => {
  const g = document.getElementById('gamertag').value;
  callEndpoint('/api/invite-and-message', g);
});

async function refreshStatus() {
  try {
    const res = await fetch('/api/status');
    const data = await res.json();
    const dot = document.getElementById('status-dot');
    const val = document.getElementById('status-value');
    const info = document.getElementById('server-info');
    if (data.portalStarted) {
      dot.style.background = '#4bff8a';
      val.textContent = 'Online';
    } else {
      dot.style.background = '#ff4b4b';
      val.textContent = 'Offline';
    }
    info.textContent = data.serverIp + ':' + data.serverPort;
    document.getElementById('message-preview').textContent = data.messageText;
  } catch (e) {
    const dot = document.getElementById('status-dot');
    const val = document.getElementById('status-value');
    dot.style.background = '#ff4b4b';
    val.textContent = 'Error';
  }
}
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
  const html = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>Xbox Authentication</title>
    <style>
      body { background: #111111; color: #f5f5f5; font-family: system-ui, sans-serif; padding: 20px; }
      a { color: #d0d0d0; }
      code { background: #1b1b1b; padding: 2px 4px; border-radius: 4px; }
    </style>
  </head>
  <body>
    <h1>Xbox Authentication</h1>
    <p>On first run, the bot prints a Microsoft Device Login URL and code in the Node.js console.</p>
    <p>Steps:</p>
    <ol>
      <li>Open the Node.js console where this bot is running.</li>
      <li>Find the device login URL and code printed by prismarine-auth.</li>
      <li>Click the link below to open the Microsoft device login page.</li>
      <li>Enter the code from the console and sign in with your Xbox/Microsoft account.</li>
    </ol>
    <p><a href="https://www.microsoft.com/link" target="_blank" rel="noreferrer">Open Microsoft Device Login</a></p>
    <p>After this, tokens are cached and future logins are automatic.</p>
  </body>
  </html>
  `;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
});

app.post('/api/invite', async (req, res) => {
  const { gamertag } = req.body || {};
  if (!gamertag) return res.status(400).json({ ok: false, error: 'gamertag required' });
  try {
    await invitePlayer(gamertag);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message || 'invite failed' });
  }
});

app.post('/api/message', async (req, res) => {
  const { gamertag } = req.body || {};
  if (!gamertag) return res.status(400).json({ ok: false, error: 'gamertag required' });
  try {
    await messagePlayer(gamertag);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message || 'message failed' });
  }
});

app.post('/api/invite-and-message', async (req, res) => {
  const { gamertag } = req.body || {};
  if (!gamertag) return res.status(400).json({ ok: false, error: 'gamertag required' });
  try {
    await invitePlayer(gamertag);
    await messagePlayer(gamertag);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message || 'invite+message failed' });
  }
});

app.get('/api/status', (_req, res) => {
  res.json({
    portalStarted,
    serverIp: SERVER_IP,
    serverPort: SERVER_PORT,
    messageText: MESSAGE_TEXT
  });
});

app.listen(API_PORT, () => {
  console.log(`[OK] Web dashboard and API listening on http://127.0.0.1:${API_PORT}`);
  console.log('[INFO] Open http://127.0.0.1:' + API_PORT + ' in your browser.');
});
