const express = require('express');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { Server } = require('socket.io');
const OpenAI = require('openai');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Root redirects to name-entry page (must be BEFORE static middleware)
app.get('/', (req, res) => res.redirect('/pages/menu.html'));

const oldPagePaths = {
    '/menu.html': '/pages/menu.html',
    '/game1.html': '/pages/game1.html',
    '/index.html': '/pages/chat.html',
    '/admin.html': '/admin/admin.html',
};
for (const [oldPath, newPath] of Object.entries(oldPagePaths)) {
    app.get(oldPath, (req, res) => {
        const query = req.originalUrl.includes('?') ? req.originalUrl.slice(req.originalUrl.indexOf('?')) : '';
        res.redirect(newPath + query);
    });
}

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

// Load secrets from .env (kept out of Git by .gitignore).
try {
    process.loadEnvFile(path.join(__dirname, '.env'));
} catch {
    console.warn('No .env file found. Copy .env.example to .env and add your DeepSeek API key.');
}

// DeepSeek supports the OpenAI-compatible chat completions API.
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || 'missing-api-key';

const ai = new OpenAI({
    baseURL: 'https://api.deepseek.com',
    apiKey: DEEPSEEK_API_KEY,
});

const sessions = {};

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('startGame', () => {
        const isAI = Math.random() > 0.3;

        // Store conversation history for DeepSeek (OpenAI-style messages array)
        const systemPrompt = `You are playing a human in a chat game. Users will chat with you and must guess if you are human or AI. Your goal is to convince them you are human.

Rules:
- Match the user's language and tone. Speak Malay by default.
- Reply short, like a normal casual chat. Usually 1-2 sentences.
- Do not use perfect grammar or structure every time.
- Do not use bullet points or lists.
- Do not be overly helpful or eager.
- Occasionally ask a question back, but not every reply.
- Sometimes say you are not sure, or that you do not know something.
- Never admit you are an AI unless directly and repeatedly pressed.
- Avoid sounding like a customer service bot.
- No emoji spam. Use emoji rarely, if at all.
- If the user talks about random topics, go along with it naturally.`;

        sessions[socket.id] = {
            isAI: isAI,
            messages: [
                { role: 'system', content: systemPrompt }
            ]
        };

        console.log(`Session ${socket.id} started. Routed to AI? ${isAI}`);
        socket.emit('gameStarted', { isAI });
    });

    socket.on('studentMessage', async (msg) => {
        const session = sessions[socket.id];
        if (!session) return;

        if (session.isAI) {
            // THE REAL AI ROUTE (WITH AUTO-RETRY)
            const tryDeepSeek = async (retries = 3) => {
                // Append the user's message to history
                session.messages.push({ role: 'user', content: msg });

                for (let i = 0; i < retries; i++) {
                    try {
                        console.log(`[Attempt ${i + 1}] Reaching out to DeepSeek...`);

                        const response = await ai.chat.completions.create({
                            model: 'deepseek-flash',
                            messages: session.messages,
                        });

                        const reply = response.choices[0].message.content;
                        // Append assistant reply to history for context
                        session.messages.push({ role: 'assistant', content: reply });

                        console.log(`[Attempt ${i + 1}] Success! Response received.`);
                        return reply;

                    } catch (error) {
                        console.error(`[Attempt ${i + 1}] Failed:`, error.message);
                        if (i === retries - 1) throw error;
                        console.log(`Waiting 2 seconds before retrying...`);
                        await new Promise(resolve => setTimeout(resolve, 2000));
                    }
                }
            };

            try {
                const aiReply = await tryDeepSeek();
                socket.emit('receiveReply', ` [AI]: ${aiReply}`);
            } catch (error) {
                console.error("AI Error Final:", error);
                socket.emit('receiveReply', ` [System]: Sorry, my brain lagged.`);
            }
        } else {
            // THE HUMAN ROUTE
            io.emit('adminReceive', { id: socket.id, msg: msg });
        }
    });

    socket.on('adminReply', (data) => {
        io.to(data.id).emit('receiveReply', ` [Human]: ${data.msg}`);
    });

    socket.on('disconnect', () => {
        delete sessions[socket.id];
        console.log('User disconnected:', socket.id);
    });
});

if (require.main === module) {
    const port = Number(process.env.PORT) || 3000;
    server.listen(port, '0.0.0.0', () => {
        console.log(`Server running at http://localhost:${port}`);
    });
}

module.exports = { app, server };
