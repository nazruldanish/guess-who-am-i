const socket = io();
const GAME_SECONDS = 120;
const GUESS_POINTS = 500;
let timeLeft = GAME_SECONDS;
let timerInterval;
let gameStarted = false;
let guessed = false;
let wasAI = null;
const params = new URLSearchParams(window.location.search);
const playerName = params.get('player') || 'You';
const previousScore = Number(params.get('g1score')) || 0;

window.addEventListener('load', () => socket.emit('startGame'));

socket.on('gameStarted', ({ isAI }) => {
    wasAI = isAI;
    document.getElementById('preGame').style.display = 'none';
    document.getElementById('gameArea').style.display = 'flex';
    document.getElementById('opponentName').textContent = 'Stranger';
    document.getElementById('msgInput').disabled = false;
    document.getElementById('sendBtn').disabled = false;
    gameStarted = true;
    startTimer();
});

function startTimer() {
    const fill = document.getElementById('progressFill');
    const badge = document.getElementById('timerBadge');
    timerInterval = setInterval(() => {
        timeLeft--;
        const m = Math.floor(timeLeft / 60), s = timeLeft % 60;
        document.getElementById('timerDisplay').textContent = `${m}:${s.toString().padStart(2,'0')}`;
        document.getElementById('progressLabel').textContent = `${timeLeft}s`;
        fill.style.width = (timeLeft / GAME_SECONDS * 100) + '%';
        if (timeLeft <= 10) badge.classList.add('urgent');
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            lockInput();
            showTyping(false);
            badge.classList.remove('urgent');
            document.getElementById('guessOverlay').style.display = 'flex';
        }
    }, 1000);
}

function lockInput() {
    document.getElementById('msgInput').disabled = true;
    document.getElementById('sendBtn').disabled = true;
}

function sendMessage() {
    const input = document.getElementById('msgInput');
    const text = input.value.trim();
    if (!text || !gameStarted || timeLeft <= 0) return;
    addBubble(playerName, text, 'you');
    socket.emit('studentMessage', text);
    input.value = '';
    document.getElementById('emptyState').style.display = 'none';
    showTyping(true);
}

document.getElementById('sendBtn').onclick = sendMessage;
document.getElementById('msgInput').addEventListener('keydown', e => { if (e.key === 'Enter') sendMessage(); });

socket.on('receiveReply', (msg) => {
    showTyping(false);
    const clean = msg.replace(/^\s*\[(AI|Human|System)\]:\s*/, '');
    addBubble('Stranger', clean, msg.includes('[System]') ? 'system' : 'them');
    document.getElementById('emptyState').style.display = 'none';
});

function addBubble(sender, text, type) {
    const chatBox = document.getElementById('chatBox');
    const typingEl = document.getElementById('typingIndicator');
    const bubble = document.createElement('div');
    bubble.className = `bubble ${type}`;
    if (type !== 'system') {
        const lbl = document.createElement('div');
        lbl.className = 'bubble-label';
        lbl.textContent = type === 'you' ? playerName : 'Stranger';
        bubble.appendChild(lbl);
    }
    const txt = document.createElement('span');
    txt.textContent = text;
    bubble.appendChild(txt);
    chatBox.insertBefore(bubble, typingEl);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function showTyping(v) {
    const t = document.getElementById('typingIndicator');
    t.style.display = v ? 'block' : 'none';
    if (v) document.getElementById('chatBox').scrollTop = document.getElementById('chatBox').scrollHeight;
}

function makeGuess(type) {
    if (guessed || timeLeft > 0) return;
    guessed = true;
    document.getElementById('guessHuman').disabled = true;
    document.getElementById('guessAI').disabled = true;
    const correct = (type === 'ai') === wasAI;
    const earned = correct ? GUESS_POINTS : 0;
    document.getElementById('resultTitle').textContent = correct ? 'Correct!' : 'Wrong!';
    document.getElementById('resultSub').textContent = `The stranger was ${wasAI ? 'AI' : 'Human'}. You guessed ${type === 'ai' ? 'AI' : 'Human'}.`;
    document.getElementById('resultScore').textContent = `Game 1: ${previousScore} + Game 2: ${earned} = ${previousScore + earned} points`;
    document.getElementById('guessOverlay').style.display = 'none';
    document.getElementById('resultOverlay').style.display = 'flex';
}

document.getElementById('guessHuman').addEventListener('click', () => makeGuess('human'));
document.getElementById('guessAI').addEventListener('click', () => makeGuess('ai'));
document.getElementById('playAgainButton').addEventListener('click', () => {
    window.location.href = '/pages/menu.html';
});
