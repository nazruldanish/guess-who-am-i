// Writes all-texts.md: every Round 1 text, grouped by language and topic, split into human and AI,
// with its "why" reason when there is one. Only for reading; the game never loads this file.
// Run: npm run list-texts
const fs = require('fs');
const path = require('path');

const TEXTS_DIR = path.join(__dirname, '..', 'public', 'assets', 'texts');
const OUTPUT = path.join(__dirname, '..', 'all-texts.md');
const LANGUAGE_NAMES = { en: 'English', ms: 'Bahasa Melayu' };
const SOURCES = [['human', 'Human'], ['ai', 'AI']];

const readFolder = folder => { try { return fs.readdirSync(folder).sort(); } catch { return []; } };
const readText = file => { try { return fs.readFileSync(file, 'utf8').trim(); } catch { return ''; } };

const lines = ['# All Round 1 texts', '', `Generated ${new Date().toLocaleString()} from public/assets/texts. Re-run \`npm run list-texts\` after adding texts.`, ''];
const totals = [];

for (const lang of readFolder(TEXTS_DIR)) {
    const counts = { human: 0, ai: 0 };
    const section = [];
    for (const topic of readFolder(path.join(TEXTS_DIR, lang))) {
        section.push(`### ${topic}`, '');
        for (const [source, heading] of SOURCES) {
            const folder = path.join(TEXTS_DIR, lang, topic, source);
            const files = readFolder(folder).filter(file => /\.txt$/i.test(file));
            section.push(`**${heading}** (${files.length})`, '');
            if (!files.length) section.push('_None yet._', '');
            files.forEach((file, i) => {
                const text = readText(path.join(folder, file)).replace(/\s*\n\s*/g, ' ');
                const why = readText(path.join(folder, file.replace(/\.txt$/i, '.why')));
                section.push(`${i + 1}. ${text}  `, `   <sub>${file}${why ? ` · Why: ${why}` : ''}</sub>`);
            });
            if (files.length) section.push('');
            counts[source] += files.length;
        }
    }
    totals.push(`| ${LANGUAGE_NAMES[lang] || lang} | ${counts.human} | ${counts.ai} | ${counts.human + counts.ai} |`);
    lines.push(`## ${LANGUAGE_NAMES[lang] || lang}`, '', ...section);
}

// Summary table right under the title
lines.splice(4, 0, '| Language | Human | AI | Total |', '| --- | --- | --- | --- |', ...totals, '');
fs.writeFileSync(OUTPUT, lines.join('\n'));
console.log(`Wrote ${path.relative(process.cwd(), OUTPUT)}`);
