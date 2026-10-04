# Guess Who Am I?

A browser game where players look at 12 texts, pictures and videos and guess whether each was made by a human or by AI.

## Run locally

```powershell
npm install
npm start
```

Open `http://localhost:3000`. Run checks with `npm test`. If PowerShell blocks `npm.ps1`, use `npm.cmd` for each command.

## Project layout

| Path | Purpose |
| --- | --- |
| `server.js` | Express server, clue list and leaderboard API |
| `public/pages/` | Player-facing HTML pages |
| `public/css/` | Stylesheets |
| `public/js/` | Browser JavaScript |
| `public/assets/` | Pictures, videos, texts, music and other static assets |
| `scripts/` | Helper scripts for the text clues (`npm run explain`, `npm run list-texts`) |
| `test/` | Game and route checks |

The server redirects old page URLs such as `/game1.html` to their new locations. Leaderboard scores are saved in `data/leaderboard.json` (not uploaded to Git); delete that file and restart the server to reset the leaderboard.

`npm run explain` asks DeepSeek for a short reason for each Round 1 text. It needs `DEEPSEEK_API_KEY` in a `.env` file (copy `.env.example`); the game itself does not.
