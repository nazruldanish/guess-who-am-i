const express = require('express');
const http = require('http');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);

// Optional password for the whole site: when SITE_PASSWORD is set, the browser asks for it before anything loads.
// Any user name works; only the password is checked.
const SITE_PASSWORD = process.env.SITE_PASSWORD;
if (SITE_PASSWORD) {
    app.use((req, res, next) => {
        const [scheme, encoded = ''] = (req.get('Authorization') || '').split(' ');
        const password = scheme === 'Basic' ? Buffer.from(encoded, 'base64').toString().split(':').slice(1).join(':') : '';
        if (password === SITE_PASSWORD) return next();
        res.set('WWW-Authenticate', 'Basic realm="Guess Who Am I?"').status(401).send('Password required');
    });
}

// Root serves the shell page, which shows each screen in a frame so full screen survives moving between screens
// (must be BEFORE static middleware).
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'shell.html')));

const oldPagePaths = {
    '/menu.html': '/pages/menu.html',
    '/game1.html': '/pages/game1.html',
};
for (const [oldPath, newPath] of Object.entries(oldPagePaths)) {
    app.get(oldPath, (req, res) => {
        const query = req.originalUrl.includes('?') ? req.originalUrl.slice(req.originalUrl.indexOf('?')) : '';
        res.redirect(newPath + query);
    });
}

// Round 1 clue pool (see lib/game1-media.js); the GitHub Pages build writes the same list to a static file.
const { listGame1Media } = require('./lib/game1-media');

app.get('/js/game1-media.js', (req, res) => {
    res.type('application/javascript').send(`window.GAME1_MEDIA = ${JSON.stringify(listGame1Media())};\n`);
});

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json({ limit: '2kb' }));

// Leaderboard: best score per nickname, saved to a JSON file so it survives restarts.
const LEADERBOARD_FILE = process.env.LEADERBOARD_FILE || path.join(__dirname, 'data', 'leaderboard.json');
const LEADERBOARD_SIZE = 20;
let leaderboard = [];
try {
    leaderboard = JSON.parse(fs.readFileSync(LEADERBOARD_FILE, 'utf8'));
} catch {
    leaderboard = [];
}

function saveLeaderboard() {
    fs.mkdirSync(path.dirname(LEADERBOARD_FILE), { recursive: true });
    fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify(leaderboard, null, 2));
}

app.get('/api/leaderboard', (req, res) => {
    res.json(leaderboard.slice(0, LEADERBOARD_SIZE));
});

app.post('/api/leaderboard', (req, res) => {
    const name = typeof req.body?.name === 'string' ? req.body.name.trim().slice(0, 16) : '';
    const avatar = typeof req.body?.avatar === 'string' ? req.body.avatar.slice(0, 8) : '🙂';
    const score = Number(req.body?.score);
    if (!name || !Number.isInteger(score) || score < 0 || score > 100000) {
        return res.status(400).json({ error: 'Invalid score' });
    }

    const existing = leaderboard.find(entry => entry.name.toLowerCase() === name.toLowerCase());
    if (existing) {
        if (score >= existing.score) Object.assign(existing, { name, avatar, score, at: Date.now() });
    } else {
        leaderboard.push({ name, avatar, score, at: Date.now() });
    }
    leaderboard.sort((a, b) => b.score - a.score || a.at - b.at);
    leaderboard = leaderboard.slice(0, 100);
    saveLeaderboard();
    res.json(leaderboard.slice(0, LEADERBOARD_SIZE));
});

if (require.main === module) {
    const port = Number(process.env.PORT) || 3000;
    server.listen(port, '0.0.0.0', () => {
        console.log(`Server running at http://localhost:${port}`);
    });
}

module.exports = { app, server };

