# Guess Who Am I?

A two-round browser game. Round 1 asks players to identify 12 text messages; Round 2 is a live chat with an AI or a human operator.

## Run locally

```powershell
npm install
copy .env.example .env   # then put your DeepSeek API key in .env
npm start
```

Open `http://localhost:3000`. Run checks with `npm test`. If PowerShell blocks `npm.ps1`, use `npm.cmd` for each command.

## Project layout

| Path | Purpose |
| --- | --- |
| `server.js` | Express server, Socket.IO events, and DeepSeek API calls |
| `public/pages/` | Player-facing HTML pages |
| `public/admin/admin.html` | Human operator page at `/admin/admin.html` |
| `public/css/` | Stylesheets |
| `public/js/` | Browser JavaScript |
| `public/assets/` | Images and other static assets |
| `test/` | Game and route checks |

The server redirects old page URLs such as `/game1.html` to their new locations. The operator page remains directly accessible; it does not have sign-in protection.

The logo in `public/assets/` is kept as a brand asset, but the current pages use a text logo.
