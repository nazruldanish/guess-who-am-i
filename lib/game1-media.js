const fs = require('fs');
const path = require('path');

// Round 1 clue pool, read from the asset folders so newly added files are picked up.
// Pictures/videos are labelled by file name and shared by both languages; their src is relative to public/pages/,
// so it works on any host path (including GitHub Pages).
// texts live in assets/texts/<lang>/<Topic>/{ai,human}/*.txt, each with an optional *.why reason,
// and each topic can have a prompt.txt for the writing pop-up.
const GAME1_MEDIA_FOLDERS = { image: ['pictures', /\.(png|jpe?g|webp|gif)$/i], video: ['videos', /\.(mp4|webm)$/i] };
const GAME1_LANGUAGES = ['en', 'ms'];
const ASSETS_DIR = path.join(__dirname, '..', 'public', 'assets');
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
                .map(file => ({ src: `../assets/${folder}/${encodeURIComponent(file)}`, label: labelFromFile(file) }));
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

module.exports = { listGame1Media };
