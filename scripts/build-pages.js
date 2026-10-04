// Builds a static copy of the game in _site/ for GitHub Pages (no server there):
// copies public/, writes the Round 1 clue list to js/game1-media.js, and makes shell.html the index page.
//   npm run build:pages
const fs = require('fs');
const path = require('path');
const { listGame1Media } = require('../lib/game1-media');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, '_site');

fs.rmSync(OUT, { recursive: true, force: true });
fs.cpSync(path.join(ROOT, 'public'), OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'js', 'game1-media.js'), `window.GAME1_MEDIA = ${JSON.stringify(listGame1Media())};\n`);
fs.copyFileSync(path.join(OUT, 'shell.html'), path.join(OUT, 'index.html'));
// Tell GitHub Pages to serve the files as they are
fs.writeFileSync(path.join(OUT, '.nojekyll'), '');

console.log(`Static site written to ${path.relative(ROOT, OUT)}/`);
