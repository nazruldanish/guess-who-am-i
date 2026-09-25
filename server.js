const express = require('express');
const http = require('http');
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
- Reply short, like a normal casual chat. Usually 1-2 sentences.
- Do not use perfect grammar or structure every time.
- Do not use bullet points or lists.
- Do not be overly helpful or eager.
- Occasionally ask a question back, but not every reply.
- Sometimes say you are not sure, or that you do not know something.
- Never admit you are an AI unless directly and repeatedly pressed.
- Match the user's language and tone. If they speak Malay casually, reply in Malay casually.
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
