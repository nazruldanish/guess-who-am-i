// Asks DeepSeek once for a short "why is this human / AI?" reason for every Round 1 text, and saves it next
// to the text as <name>.why (e.g. excuse-1.txt -> excuse-1.why). The game shows it in the answer feedback.
// Texts that already have a .why file are skipped, so you can edit a reason by hand and it stays.
//   npm run explain            -> only texts without a reason yet
//   npm run explain -- --force -> rewrite every reason

const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');

const TEXTS_DIR = path.join(__dirname, '..', 'public', 'assets', 'texts');
const LANGUAGE_NAMES = { en: 'English', ms: 'casual Malaysian Malay (use "anda", not "kamu")' };

const readFolder = folder => { try { return fs.readdirSync(folder); } catch { return []; } };

async function explain(ai, lang, topic, source, text) {
    const writer = source === 'ai' ? 'an AI' : 'a real person (a student)';
    const response = await ai.chat.completions.create({
        model: 'deepseek-flash',
        messages: [{
            role: 'user',
            content: `In a quiz, school students read a short "${topic}" text and guess whether a human or an AI wrote it. This one was written by ${writer}.

Text: """${text}"""

In ${LANGUAGE_NAMES[lang]}, give ONE short, simple sentence (max 20 words) that tells students the clue in this text that shows it was written by ${writer}. Point at something specific in the text and put any words you copy from it in 'single quotes'. Easy words a 12-year-old understands. Start straight with the clue: no "This was written by...", no "You can see..." / "Anda boleh nampak..." opener.`
        }]
    });
    return response.choices[0].message.content.trim().replace(/^"(.*)"$/s, '$1');
}

async function main() {
    const force = process.argv.includes('--force');
    try {
        process.loadEnvFile(path.join(__dirname, '..', '.env'));
    } catch {}
    if (!process.env.DEEPSEEK_API_KEY) {
        console.error('DEEPSEEK_API_KEY is missing. Add it to .env first.');
        process.exit(1);
    }
    const ai = new OpenAI({ baseURL: 'https://api.deepseek.com', apiKey: process.env.DEEPSEEK_API_KEY });

    let written = 0, skipped = 0, failed = 0;
    for (const lang of Object.keys(LANGUAGE_NAMES)) {
        for (const topic of readFolder(path.join(TEXTS_DIR, lang))) {
            for (const source of ['ai', 'human']) {
                const folder = path.join(TEXTS_DIR, lang, topic, source);
                for (const file of readFolder(folder).filter(file => /\.txt$/i.test(file))) {
                    const whyFile = path.join(folder, file.replace(/\.txt$/i, '.why'));
                    const label = `${lang}/${topic}/${source}/${file}`;
                    if (!force && fs.existsSync(whyFile)) { skipped++; continue; }
                    const text = fs.readFileSync(path.join(folder, file), 'utf8').trim();
                    if (!text) continue;
                    try {
                        const why = await explain(ai, lang, topic, source, text);
                        fs.writeFileSync(whyFile, why + '\n');
                        console.log(`✔ ${label}\n    ${why}`);
                        written++;
                    } catch (error) {
                        console.error(`✖ ${label}: ${error.message}`);
                        failed++;
                    }
                }
            }
        }
    }
    console.log(`\nDone: ${written} written, ${skipped} already had a reason, ${failed} failed.`);
}

if (require.main === module) main();

module.exports = { explain };
