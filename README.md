# PCrft Xbox Invite Bot

A Node.js Xbox Live bot with a built-in dark dashboard for sending Minecraft Bedrock invites instantly.

---

## Features

* Auto-detects the **latest** Minecraft Bedrock version
* Invite-only (no messaging)
* Secure Microsoft Device Login
* No passwords stored locally
* Works with any Minecraft Bedrock server
* Clean dark gray dashboard
* Mobile-friendly interface
* Simple Gamertag input
* Automatic token caching
* Runs on `127.0.0.1:3000`

---

## Requirements

* Node.js 18 or newer
* An Xbox/Microsoft account
* Internet connection

---

## Installation

Clone the repository:

```bash
git clone https://github.com/XPixelCoderX/pcrft.git
cd pcrft
npm install
```

---

## Configuration

Edit `config.yml`:

```yaml
server:
  ip: "play.pcsmp.net"
  port: 19132
  world_version: "latest"

bot:
  cache_folder: "./cache"
  api_port: 3000
```

### World Version

Use:

```yaml
world_version: "latest"
```

to automatically detect the newest supported Minecraft Bedrock version.

Or specify a version manually:

```yaml
world_version: "1.21.80"
```

---

## Running

Start the bot:

```bash
npm start
```

After startup, open:

```text
http://127.0.0.1:3000
```

---

## First-Time Login

The bot uses Microsoft's official Device Login flow.

1. Start the bot:

```bash
npm start
```

2. Open the dashboard:

```text
http://127.0.0.1:3000
```

3. Enter any Gamertag.

4. Click **Send Invite**.

5. If the bot has not been authenticated yet, a login code will appear in the Node.js console:

```text
To sign in, visit https://www.microsoft.com/link
Enter code: XXXX-XXXX
```

6. Hold **Ctrl** and click the Microsoft link in the console, or copy and paste it into your browser.

7. Enter the displayed code.

8. Sign in using your Microsoft/Xbox account.

9. The bot will automatically finish authentication and continue processing the invite request.

10. Login tokens are saved inside:

```text
./cache
```

Future launches normally will not require signing in again.

---

## Usage

1. Open the dashboard:

```text
http://127.0.0.1:3000
```

2. Enter the player's Xbox Gamertag.

3. Click **Send Invite**.

4. If authentication is required, complete the Microsoft login process.

5. Once authenticated, the bot automatically sends the invite.

6. Status messages are shown in both the dashboard and the Node.js console.

---

## Dashboard

The built-in dashboard provides:

* Gamertag input field
* Invite button
* Real-time status messages
* Mobile-friendly layout
* Dark gray theme
* Local-only access on `127.0.0.1`

---

## Security

* Uses Microsoft's official Device Code authentication flow
* No Microsoft password is ever entered into the application
* No passwords are stored locally
* Authentication tokens are stored in the configured cache directory
* Dashboard is intended for local use

---

## Example Configuration

```yaml
server:
  ip: "play.pcsmp.net"
  port: 19132
  world_version: "latest"

bot:
  cache_folder: "./cache"
  api_port: 3000
```

---

## Troubleshooting

### Login Code Does Not Appear

* Check the Node.js console output.
* Ensure the bot is running correctly.
* Click **Send Invite** to trigger authentication.

### Invite Fails

* Verify the server IP and port.
* Confirm the Gamertag is valid.
* Check console logs for Xbox Live errors.

### Dashboard Not Loading

* Verify the bot is running.
* Ensure the configured API port is available.
* Open:

```text
http://127.0.0.1:3000
```

---

## License

MIT License

---

Made for Minecraft Bedrock Edition server owners who want a simple way to send Xbox invites through a clean web dashboard.
