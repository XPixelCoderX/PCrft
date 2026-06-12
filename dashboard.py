import subprocess
import time
import requests
import yaml
from flask import Flask, request, jsonify, render_template_string
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CONFIG_PATH = os.path.join(BASE_DIR, "config.yml")

with open(CONFIG_PATH, "r") as f:
    config = yaml.safe_load(f)

NODE_API_BASE = f"http://localhost:{config['bot']['api_port']}"
NODE_CMD = ["node", os.path.join(BASE_DIR, "bot.js")]

DASH_HOST = config["dashboard"]["host"]
DASH_PORT = config["dashboard"]["port"]
DASH_TITLE = config["dashboard"]["title"]
MESSAGE_TEXT = config["dashboard"]["message_text"]

app = Flask(__name__)

HTML = r"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <title>{{ title }} | Control Panel</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            background: #0f0f0f;
            font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
            color: #e5e5e5;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 24px;
        }

        /* Dashboard Container */
        .dashboard {
            max-width: 1300px;
            width: 100%;
            background: #181818;
            border-radius: 20px;
            border: 1px solid #2a2a2a;
            overflow: hidden;
            box-shadow: 0 8px 20px rgba(0,0,0,0.5);
            display: flex;
            flex-direction: column;
        }

        /* Top bar */
        .top-bar {
            background: #141414;
            border-bottom: 1px solid #2a2a2a;
            padding: 16px 24px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 12px;
        }

        .logo-area {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .logo {
            font-weight: 700;
            font-size: 1.3rem;
            letter-spacing: -0.3px;
            background: #2a2a2a;
            padding: 5px 12px;
            border-radius: 40px;
            color: #ddd;
        }

        .title-header {
            font-size: 0.85rem;
            color: #aaa;
            border-left: 1px solid #2c2c2c;
            padding-left: 14px;
        }

        .status-pill {
            background: #202020;
            padding: 6px 12px;
            border-radius: 40px;
            border: 1px solid #2c2c2c;
            font-size: 0.75rem;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .status-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #4caf50;
            box-shadow: none;
        }

        /* Main Layout */
        .main-layout {
            display: flex;
            flex: 1;
        }

        /* Sidebar */
        .sidebar {
            width: 250px;
            background: #141414;
            border-right: 1px solid #2a2a2a;
            padding: 20px 12px;
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .nav-btn {
            background: transparent;
            border: none;
            color: #c0c0c0;
            padding: 12px 16px;
            text-align: left;
            font-size: 0.85rem;
            font-weight: 500;
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.15s ease;
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .nav-btn i {
            font-style: normal;
            font-weight: 600;
            opacity: 0.7;
        }

        .nav-btn:hover {
            background: #202020;
            color: #efefef;
        }

        .nav-btn.active {
            background: #2a2a2a;
            color: white;
            border-left: 3px solid #6c8eff;
        }

        /* Content */
        .content {
            flex: 1;
            background: #181818;
            padding: 24px 28px;
        }

        /* Cards */
        .card {
            background: #1f1f1f;
            border: 1px solid #2e2e2e;
            border-radius: 16px;
            padding: 20px 24px;
            margin-bottom: 24px;
        }

        .card-header {
            margin-bottom: 16px;
            font-weight: 600;
            border-bottom: 1px solid #2c2c2c;
            padding-bottom: 12px;
            display: flex;
            justify-content: space-between;
        }

        /* Form Elements */
        .input-group {
            margin-bottom: 20px;
        }

        label {
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #aaa;
            display: block;
            margin-bottom: 8px;
        }

        input {
            width: 100%;
            background: #111;
            border: 1px solid #333;
            padding: 12px 14px;
            border-radius: 12px;
            color: #f0f0f0;
            font-size: 0.9rem;
            transition: 0.1s linear;
        }

        input:focus {
            outline: none;
            border-color: #6c8eff;
            background: #0c0c0c;
        }

        .hint {
            font-size: 0.7rem;
            color: #888;
            margin-top: 8px;
        }

        .hint span {
            color: #b0b0b0;
            background: #2a2a2a;
            padding: 2px 8px;
            border-radius: 30px;
        }

        button.action-btn {
            background: #2c2c2c;
            border: 1px solid #3e3e3e;
            padding: 12px 20px;
            border-radius: 40px;
            font-weight: 500;
            font-size: 0.85rem;
            color: #e0e0e0;
            cursor: pointer;
            transition: 0.1s linear;
            display: inline-flex;
            align-items: center;
            gap: 8px;
        }

        button.action-btn:hover {
            background: #3a3a3a;
            border-color: #555;
        }

        button.primary-action {
            background: #2c2c2c;
            border-color: #6c8eff;
            color: white;
        }

        button.primary-action:hover {
            background: #3a4bcc;
            border-color: #7b93ff;
        }

        /* Tabs (content panels) */
        .tab {
            display: none;
        }

        .tab.active {
            display: block;
        }

        .status-grid {
            display: flex;
            gap: 16px;
            flex-wrap: wrap;
        }

        .stat-item {
            background: #151515;
            border: 1px solid #2c2c2c;
            border-radius: 14px;
            padding: 12px 18px;
            flex: 1;
        }

        .stat-label {
            font-size: 0.7rem;
            color: #999;
        }

        .stat-value {
            font-size: 1.1rem;
            font-weight: 500;
            margin-top: 4px;
        }

        .footer {
            background: #141414;
            border-top: 1px solid #2a2a2a;
            padding: 12px 24px;
            font-size: 0.7rem;
            color: #6f6f6f;
            display: flex;
            justify-content: space-between;
        }

        /* Toast */
        .status-toast {
            position: fixed;
            bottom: 24px;
            right: 24px;
            background: #1e1e1e;
            border: 1px solid #3a3a3a;
            border-radius: 14px;
            padding: 12px 16px;
            min-width: 240px;
            backdrop-filter: blur(8px);
            display: flex;
            gap: 12px;
            opacity: 0;
            transform: translateY(15px);
            transition: 0.2s ease;
            pointer-events: none;
            z-index: 1000;
        }

        .status-toast.visible {
            opacity: 1;
            transform: translateY(0);
            pointer-events: auto;
        }

        .toast-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            margin-top: 4px;
        }

        .status-toast.success .toast-dot { background: #2ecc71; }
        .status-toast.error .toast-dot { background: #e74c3c; }

        .toast-text {
            font-size: 0.8rem;
        }

        .toast-title {
            font-weight: 600;
            margin-bottom: 2px;
        }

        .toast-body {
            color: #aaa;
            font-size: 0.75rem;
        }

        @media (max-width: 720px) {
            body { padding: 12px; }
            .main-layout { flex-direction: column; }
            .sidebar { width: 100%; flex-direction: row; flex-wrap: wrap; border-right: none; border-bottom: 1px solid #2a2a2a; gap: 6px; }
            .nav-btn { flex: 1; text-align: center; justify-content: center; }
            .content { padding: 20px; }
        }
    </style>
</head>
<body>
<div class="dashboard">
    <div class="top-bar">
        <div class="logo-area">
            <div class="logo">PCrft</div>
            <div class="title-header">{{ title }}</div>
        </div>
        <div class="status-pill" id="status-pill">
            <span class="status-dot" id="status-dot"></span>
            <span>Portal</span>
            <span id="status-value">Checking...</span>
        </div>
    </div>
    <div class="main-layout">
        <div class="sidebar">
            <button class="nav-btn active" data-tab="dashboard">
                <i>📊</i> Dashboard
            </button>
            <button class="nav-btn" data-tab="invite">
                <i>🎮</i> Invite Player
            </button>
            <button class="nav-btn" data-tab="message">
                <i>💬</i> Send Message
            </button>
            <button class="nav-btn" data-tab="both">
                <i>⚡</i> Invite + Message
            </button>
        </div>
        <div class="content">
            <!-- Shared Gamertag Input Card -->
            <div class="card">
                <div class="card-header">
                    <span>Gamertag</span>
                </div>
                <div class="input-group">
                    <label>Xbox Gamertag</label>
                    <input type="text" id="gamertag" placeholder="e.g. n2ab, FaZe Clan" autocomplete="off">
                    <div class="hint">
                        Message template: <span>{{ message_text }}</span>
                    </div>
                </div>
            </div>

            <!-- Dashboard Tab -->
            <div id="dashboard-tab" class="tab active">
                <div class="card">
                    <div class="card-header">
                        <span>🖥️ Portal Status</span>
                    </div>
                    <div class="status-grid" id="status-grid">
                        <div class="stat-item">
                            <div class="stat-label">Node.js Bot</div>
                            <div class="stat-value" id="portal-state">—</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">Server Address</div>
                            <div class="stat-value" id="server-addr">—</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">API Endpoint</div>
                            <div class="stat-value" id="api-endpoint">localhost</div>
                        </div>
                    </div>
                </div>
                <div class="card">
                    <div class="card-header">
                        <span>ℹ️ About</span>
                    </div>
                    <p style="color:#bbb; font-size:0.85rem;">Use the sidebar to invite players or send automated messages. This dashboard interfaces with the Minecraft Bedrock bot (Node.js). All actions are logged by the backend.</p>
                </div>
            </div>

            <!-- Invite Tab -->
            <div id="invite-tab" class="tab">
                <div class="card">
                    <div class="card-header">
                        <span>🎮 Send Game Invite</span>
                    </div>
                    <p style="margin-bottom: 18px; color:#aaa;">Send a direct invite to the entered gamertag. The bot will attempt to invite the player to the current session.</p>
                    <button class="action-btn" id="btn-invite">
                        <span>📨</span> Invite Player
                    </button>
                </div>
            </div>

            <!-- Message Tab -->
            <div id="message-tab" class="tab">
                <div class="card">
                    <div class="card-header">
                        <span>💬 Send Live Message</span>
                    </div>
                    <p style="margin-bottom: 18px; color:#aaa;">Sends a message directly to the player using the configured message text from <code>config.yml</code>.</p>
                    <button class="action-btn" id="btn-message">
                        <span>✉️</span> Send Message
                    </button>
                </div>
            </div>

            <!-- Invite + Message Tab -->
            <div id="both-tab" class="tab">
                <div class="card">
                    <div class="card-header">
                        <span>⚡ Invite &amp; Message</span>
                    </div>
                    <p style="margin-bottom: 18px; color:#aaa;">Combined action: sends an invite and then immediately delivers the message to the target player.</p>
                    <button class="action-btn primary-action" id="btn-both">
                        <span>🚀</span> Invite + Message
                    </button>
                </div>
            </div>
        </div>
    </div>
    <div class="footer">
        <span>PCrft Invite Dashboard • bedrock-portal</span>
        <span id="server-info"></span>
    </div>
</div>

<div class="status-toast" id="toast">
    <div class="toast-dot"></div>
    <div class="toast-text">
        <div class="toast-title" id="toast-title"></div>
        <div class="toast-body" id="toast-body"></div>
    </div>
</div>

<script>
    // toast helper
    const toastEl = document.getElementById('toast');
    const toastTitle = document.getElementById('toast-title');
    const toastBody = document.getElementById('toast-body');

    function showToast(type, title, body) {
        toastEl.classList.remove('success', 'error');
        toastEl.classList.add(type);
        toastTitle.textContent = title;
        toastBody.textContent = body;
        toastEl.classList.add('visible');
        setTimeout(() => toastEl.classList.remove('visible'), 2800);
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
            if (!res.ok || !data.ok) throw new Error(data.error || 'Request failed');
            showToast('success', 'Success', `Action completed for ${gamertag.trim()}.`);
        } catch (err) {
            showToast('error', 'Error', err.message || 'Request failed.');
        }
    }

    // status polling
    async function refreshStatus() {
        try {
            const res = await fetch('/status');
            const data = await res.json();
            const dot = document.getElementById('status-dot');
            const statusVal = document.getElementById('status-value');
            const portalStateSpan = document.getElementById('portal-state');
            const serverAddrSpan = document.getElementById('server-addr');
            const infoSpan = document.getElementById('server-info');

            if (data.portalStarted) {
                dot.style.background = '#2ecc71';
                statusVal.textContent = 'Online';
                if (portalStateSpan) portalStateSpan.textContent = 'Active';
                if (serverAddrSpan && data.serverIp && data.serverPort) 
                    serverAddrSpan.textContent = `${data.serverIp}:${data.serverPort}`;
                if (infoSpan && data.serverIp && data.serverPort)
                    infoSpan.textContent = `${data.serverIp}:${data.serverPort}`;
            } else {
                dot.style.background = '#e74c3c';
                statusVal.textContent = 'Offline';
                if (portalStateSpan) portalStateSpan.textContent = 'Inactive';
                if (serverAddrSpan) serverAddrSpan.textContent = 'unavailable';
                if (infoSpan) infoSpan.textContent = 'offline';
            }
        } catch (e) {
            const dot = document.getElementById('status-dot');
            const statusVal = document.getElementById('status-value');
            dot.style.background = '#e74c3c';
            statusVal.textContent = 'Error';
            if (document.getElementById('portal-state')) 
                document.getElementById('portal-state').textContent = 'Unreachable';
        }
    }

    // Tab switching logic
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const tabName = btn.getAttribute('data-tab');
            document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
            const activeTab = document.getElementById(`${tabName}-tab`);
            if (activeTab) activeTab.classList.add('active');
        });
    });

    // Buttons attach to existing endpoints
    document.getElementById('btn-invite')?.addEventListener('click', () => {
        const g = document.getElementById('gamertag').value;
        callEndpoint('/invite', g);
    });
    document.getElementById('btn-message')?.addEventListener('click', () => {
        const g = document.getElementById('gamertag').value;
        callEndpoint('/message', g);
    });
    document.getElementById('btn-both')?.addEventListener('click', () => {
        const g = document.getElementById('gamertag').value;
        callEndpoint('/invite-and-message', g);
    });

    refreshStatus();
    setInterval(refreshStatus, 7000);
</script>
</body>
</html>
"""

def forward(path, payload=None):
    url = f"{NODE_API_BASE}{path}"
    r = requests.post(url, json=payload or {}, timeout=10)
    r.raise_for_status()
    return r.json()

@app.route("/")
def index():
    return render_template_string(HTML, title=DASH_TITLE, message_text=MESSAGE_TEXT)

@app.route("/invite", methods=["POST"])
def invite():
    data = request.get_json(force=True)
    gamertag = data.get("gamertag")
    if not gamertag:
        return jsonify({"ok": False, "error": "gamertag required"}), 400
    try:
        forward("/api/invite", {"gamertag": gamertag})
        return jsonify({"ok": True})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500

@app.route("/message", methods=["POST"])
def message():
    data = request.get_json(force=True)
    gamertag = data.get("gamertag")
    if not gamertag:
        return jsonify({"ok": False, "error": "gamertag required"}), 400
    try:
        forward("/api/message", {"gamertag": gamertag})
        return jsonify({"ok": True})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500

@app.route("/invite-and-message", methods=["POST"])
def invite_and_message():
    data = request.get_json(force=True)
    gamertag = data.get("gamertag")
    if not gamertag:
        return jsonify({"ok": False, "error": "gamertag required"}), 400
    try:
        forward("/api/invite-and-message", {"gamertag": gamertag})
        return jsonify({"ok": True})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500

@app.route("/status")
def status():
    try:
        r = requests.get(f"{NODE_API_BASE}/api/status", timeout=5)
        return jsonify(r.json())
    except Exception:
        return jsonify({"portalStarted": False, "serverIp": "unknown", "serverPort": "unknown"})

def start_node():
    if not config["bot"].get("auto_start", True):
        return
    print("[INFO] Starting Node bot...")
    subprocess.Popen(NODE_CMD, cwd=BASE_DIR)
    time.sleep(3)

if __name__ == "__main__":
    start_node()
    app.run(host=DASH_HOST, port=DASH_PORT, debug=False)
