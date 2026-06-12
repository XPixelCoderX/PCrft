# PCrft Xbox Invite Bot

The **PCrft Xbox Invite Bot** is a Node.js Xbox Live bot with a built-in dark dashboard, providing a clean control panel for sending Xbox invites to your Minecraft Bedrock server.

---

## Features

* Secure Microsoft Device Login authentication
* No passwords stored locally
* Connects to Xbox Live using `bedrock-portal`
* Compatible with any Minecraft Bedrock Edition server
* Modern dark gray dashboard
* Simple Gamertag-based interface
* Single action:

  * Invite
* Live portal status indicator
* Mobile-friendly design
* Easy HTTPS setup with Nginx Proxy Manager
* Works on Linux, Windows, macOS, VPSs, and GitHub Codespaces

---

# Requirements

## Node.js

* Node.js 20 or newer
* Node.js 22 recommended

## Other

* Xbox / Microsoft account for the bot
* Minecraft Bedrock server IP and port

---

# Installation

## Method 1: Clone from GitHub

### Clone the Repository

```bash
git clone https://github.com/XPixelCoderX/pcrft.git
cd pcrft
```

### Install Dependencies

```bash
npm install
```

This installs:

* bedrock-portal
* prismarine-auth
* express
* cors
* js-yaml

---

# Method 2: Download ZIP

If you do not want to use Git:

1. Open the repository page.
2. Click **Code**.
3. Click **Download ZIP**.
4. Extract the ZIP file.
5. Open a terminal inside the extracted folder.

Install dependencies:

```bash
npm install
```

---

# Configuration

Edit `config.yml`:

```yaml
server:
  ip: "play.pcsmp.net"
  port: 19132
  world_version: "1.21.80"

bot:
  cache_folder: "./cache"
  api_port: 3000
```

### Configuration Options

| Setting       | Description                      |
| ------------- | -------------------------------- |
| ip            | Bedrock server IP                |
| port          | Bedrock server port              |
| world_version | Bedrock version shown in invites |
| cache_folder  | Microsoft authentication cache   |
| api_port      | Dashboard/API port               |

---

# Running the Bot

Start the bot and dashboard:

```bash
npm start
```

The dashboard and API will be available at:

```text
http://127.0.0.1:3000
```

Open your browser and navigate to:

```text
http://127.0.0.1:3000
```

If you are connecting from another machine, replace `127.0.0.1` with your server IP.

---

# First-Time Microsoft Login

On the first launch:

1. The console will display a Microsoft Device Login URL and code.
2. Open the URL shown in the terminal.

Or visit:

```text
http://127.0.0.1:3000/auth
```

and click the login link.

### Login Steps

1. Open the Microsoft authentication page.
2. Enter the provided device code.
3. Sign into your Microsoft/Xbox account.
4. Approve the request.

After successful authentication:

* Tokens are saved to the configured cache folder.
* Future launches automatically reuse saved credentials.
* No passwords are stored locally.

---

# Using the Dashboard

1. Open the dashboard.
2. Enter a player's Xbox Gamertag.
3. Click **Invite**.
4. The bot sends an Xbox invite to the configured Bedrock server.

---

# Status Indicator

The dashboard includes a live portal status indicator.

| Status  | Meaning                            |
| ------- | ---------------------------------- |
| Online  | Xbox portal is connected and ready |
| Offline | Portal is not running              |
| Error   | Authentication or API issue        |

---

# GitHub Codespaces Setup

GitHub Codespaces allows you to run the bot entirely in the cloud.

## Create a Codespace

1. Open the repository on GitHub.
2. Click the green **Code** button.
3. Select **Codespaces**.
4. Click **Create codespace on main**.

Wait for the environment to finish building.

---

## Install Dependencies

Inside the Codespaces terminal:

```bash
npm install
```

---

## Configure the Bot

Edit:

```text
config.yml
```

with your server information.

---

## Start the Bot

```bash
npm start
```

---

## Open the Dashboard

Codespaces automatically forwards ports.

When port 3000 appears:

1. Open the **Ports** tab.
2. Find port **3000**.
3. Set visibility to **Public** if desired.
4. Open the forwarded URL.

Example:

```text
https://example-3000.app.github.dev
```

The dashboard will now be accessible through the Codespaces URL.

---

## Microsoft Login in Codespaces

After starting the bot:

1. Copy the device login URL from the terminal.
2. Open it in your browser.
3. Enter the provided device code.
4. Sign in to Microsoft.

Authentication tokens remain stored in the Codespace filesystem.

---

# Running with PM2

Install PM2:

```bash
npm install -g pm2
```

Start the bot:

```bash
pm2 start index.js --name pcrft
```

View logs:

```bash
pm2 logs pcrft
```

Restart:

```bash
pm2 restart pcrft
```

Stop:

```bash
pm2 stop pcrft
```

---

# HTTPS with Nginx Proxy Manager

1. Create a Proxy Host.
2. Domain:

```text
invite.example.com
```

3. Forward Host:

```text
127.0.0.1
```

4. Forward Port:

```text
3000
```

5. Enable:

* Websocket Support
* Block Common Exploits

6. Request a Let's Encrypt certificate.
7. Enable Force SSL.

The dashboard will then be available securely via HTTPS.

---

# Troubleshooting

## Dashboard Shows Offline

Check that the bot is running:

```bash
npm start
```

or

```bash
pm2 status
```

---

## Authentication Failed

Delete the cache folder:

```bash
rm -rf cache
```

Then restart the bot and sign in again.

---

## Port Already In Use

Change:

```yaml
bot:
  api_port: 3000
```

to another port.

Example:

```yaml
bot:
  api_port: 8080
```

---

## Cannot Access Dashboard

Verify the API port:

```bash
netstat -tulpn | grep 3000
```

or

```bash
ss -tulpn | grep 3000
```

Ensure your firewall allows the configured port.

---

# Security

* Uses Microsoft's official Device Login flow
* No passwords stored
* Tokens cached locally
* HTTPS compatible
* No Xbox credentials exposed to clients

---

# License

MIT License

---

Developed for Minecraft Bedrock Edition communities needing a simple Xbox invite automation dashboard.
