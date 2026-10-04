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

// Round 1 clue pool, read from the asset folders so newly added files are picked up.
// Pictures/videos are labelled by file name and shared by both languages;
// texts live in assets/texts/<lang>/<Topic>/{ai,human}/*.txt, each with an optional *.why reason,
// and each topic can have a prompt.txt for the writing pop-up.
const GAME1_MEDIA_FOLDERS = { image: ['pictures', /\.(png|jpe?g|webp|gif)$/i], video: ['videos', /\.(mp4|webm)$/i] };
const GAME1_LANGUAGES = ['en', 'ms'];
const ASSETS_DIR = path.join(__dirname, 'public', 'assets');
const TEXTS_DIR = process.env.TEXTS_DIR || path.join(ASSETS_DIR, 'texts');

function readFolder(folder) {
    try {
        return fs.readdirSync(folder);
    } catch {
        return [];
    }
}

// "Movie_Poster (2).jpg" -> "Movie Poster"
function labelFromFile(file) {
    return path.parse(file).name.replace(/[_]+/g, ' ').replace(/\s*(\(\d+\)|[-\s]\d+)$/, '').trim();
}

function listGame1Media() {
    const media = {};
    for (const [type, [suffix, pattern]] of Object.entries(GAME1_MEDIA_FOLDERS)) {
        media[type] = {};
        for (const source of ['ai', 'human']) {
            const folder = `${source}_${suffix}`;
            media[type][source] = readFolder(path.join(ASSETS_DIR, folder)).filter(file => pattern.test(file))
                .map(file => ({ src: `/assets/${folder}/${encodeURIComponent(file)}`, label: labelFromFile(file) }));
        }
    }
    media.text = {};
    media.labels = {};
    for (const lang of GAME1_LANGUAGES) {
        media.text[lang] = { ai: [], human: [] };
        const textsDir = path.join(TEXTS_DIR, lang);
        for (const topic of readFolder(textsDir)) {
            for (const source of ['ai', 'human']) {
                const folder = path.join(textsDir, topic, source);
                for (const file of readFolder(folder).filter(file => /\.txt$/i.test(file))) {
                    const text = fs.readFileSync(path.join(folder, file), 'utf8').trim();
                    // Optional <name>.why next to the text: a short reason shown after answering (npm run explain)
                    let why = '';
                    try { why = fs.readFileSync(path.join(folder, file.replace(/\.txt$/i, '.why')), 'utf8').trim(); } catch {}
                    if (text) media.text[lang][source].push(why ? { text, label: topic, why } : { text, label: topic });
                }
            }
        }
        // Optional labels-<lang>.json translates picture/video labels: { "file name label": "translated label" }
        try {
            const file = fs.readFileSync(path.join(ASSETS_DIR, `labels-${lang}.json`), 'utf8').replace(/^﻿/, '');
            const labels = JSON.parse(file);
            media.labels[lang] = Object.fromEntries(Object.entries(labels).map(([key, value]) => [key.toLowerCase(), value]));
        } catch {}
    }
    return media;
}

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

