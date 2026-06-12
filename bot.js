const { BedrockPortal, Joinability } = require('bedrock-portal');
const { Authflow } = require('prismarine-auth');
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');

// ================== LOAD CONFIG ==================
const configPath = path.join(__dirname, 'config.yml');
const config = yaml.load(fs.readFileSync(configPath, 'utf8'));

const SERVER_IP = config.server.ip;
const SERVER_PORT = config.server.port;
const WORLD_VERSION = config.server.world_version;

const CACHE_FOLDER = config.bot.cache_folder || './cache';
const API_PORT = config.bot.api_port || 3000;

// ================== AUTH ==================
const auth = new Authflow('XboxBotAccount', CACHE_FOLDER);

// ================== PORTAL ==================
const portal = new BedrockPortal(auth, {
    ip: SERVER_IP,
    port: SERVER_PORT,
    joinability: Joinability.FriendsOfFriends,
    world: {
        name: 'My Custom Server',
        version: WORLD_VERSION,
        memberCount: 1,
        maxMemberCount: 100
    }
});

let portalStarted = false;

async function ensurePortalStarted() {
    if (!portalStarted) {
        console.log('[INFO] Starting Xbox Live Hook...');
        await portal.start();
        portalStarted = true;
        console.log('[OK] Portal started and hooked into Xbox Live!');
    }
}

async function invitePlayer(gamertag) {
    await ensurePortalStarted();
    console.log(`[INFO] Sending invite to ${gamertag}...`);
    await portal.invitePlayer(gamertag);
    console.log(`[OK] Invite sent to ${gamertag}`);
}

async function messagePlayer(gamertag) {
    await ensurePortalStarted();
    const msg = `If you want to rejoin the server, add "PCrft" on Xbox, and you will be able to join through your friends list!`;
    console.log(`[INFO] Message for ${gamertag}: ${msg}`);
    // No direct DM API; we still send an invite so they get a notification.
    await portal.invitePlayer(gamertag);
    console.log(`[OK] Message (via invite) processed for ${gamertag}`);
}

// ================== EXPRESS API ==================
const app = express();
app.use(cors());
app.use(express.json());

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

app.get('/api/status', async (_req, res) => {
    res.json({
        portalStarted,
        serverIp: SERVER_IP,
        serverPort: SERVER_PORT
    });
});

app.listen(API_PORT, () => {
    console.log(`[OK] API listening on http://localhost:${API_PORT}`);
});
