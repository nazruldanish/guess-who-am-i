const socket = io();
const GAME_SECONDS = 120;
const GUESS_POINTS = 500;
let timeLeft = GAME_SECONDS;
let timerInterval;
let gameStarted = false;
let guessed = false;
let wasAI = null;
let messagesSent = 0;
const params = new URLSearchParams(window.location.search);
const playerName = params.get('player') || 'You';
const playerAvatar = params.get('avatar') || '🙂';
const previousScore = Number(params.get('g1score')) || 0;
const $ = id => document.getElementById(id);
const playSound = name => window.sfx?.play(name);

window.addEventListener('load', () => socket.emit('startGame'));

socket.on('gameStarted', ({ isAI }) => {
    wasAI = isAI;
    $('preGame').style.display = 'none';
    $('gameArea').style.display = 'flex';
    $('opponentName').textContent = 'Mystery Stranger';
    $('msgInput').disabled = false;
    $('sendBtn').disabled = false;
    $('msgInput').focus();
    gameStarted = true;
    playSound('start');
    startTimer();
});

function startTimer() {
    const badge = $('timerBadge');
    timerInterval = setInterval(() => {
        timeLeft--;
        const m = Math.floor(timeLeft / 60), s = timeLeft % 60;
        $('timerDisplay').textContent = `${m}:${s.toString().padStart(2, '0')}`;
        if (timeLeft <= 10) badge.classList.add('urgent');
        if (timeLeft > 0 && timeLeft <= 5) playSound('tick');
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            lockInput();
            showTyping(false);
            badge.classList.remove('urgent');
            $('guessOverlay').hidden = false;
            playSound('wrong');
        }
    }, 1000);
}

function lockInput() {
    $('msgInput').disabled = true;
    $('sendBtn').disabled = true;
}

function sendMessage() {
    const input = $('msgInput');
    const text = input.value.trim();
    if (!text || !gameStarted || timeLeft <= 0) return;
    addBubble(text, 'you');
    socket.emit('studentMessage', text);
    messagesSent++;
    input.value = '';
    $('emptyState').style.display = 'none';
    playSound('send');
    showTyping(true);
}

$('sendBtn').onclick = sendMessage;
$('msgInput').addEventListener('keydown', e => { if (e.key === 'Enter') sendMessage(); });

socket.on('receiveReply', (msg) => {
    showTyping(false);
    const clean = msg.replace(/^\s*\[(AI|Human|System)\]:\s*/, '');
    addBubble(clean, msg.includes('[System]') ? 'system' : 'them');
    $('emptyState').style.display = 'none';
    playSound('receive');
});

function addBubble(text, type) {
    const chatBox = $('chatBox');
    const bubble = document.createElement('div');
    bubble.className = `bubble ${type}`;
    if (type !== 'system') {
        const lbl = document.createElement('div');
        lbl.className = 'bubble-label';
        lbl.textContent = type === 'you' ? `${playerAvatar} ${playerName}` : '❓ Stranger';
        bubble.appendChild(lbl);
    }
    const txt = document.createElement('span');
    txt.textContent = text;
    bubble.appendChild(txt);
    chatBox.insertBefore(bubble, $('typingIndicator'));
    chatBox.scrollTop = chatBox.scrollHeight;
}

function showTyping(visible) {
    $('typingIndicator').style.display = visible ? 'block' : 'none';
    if (visible) $('chatBox').scrollTop = $('chatBox').scrollHeight;
}

function makeGuess(type) {
    if (guessed || timeLeft > 0) return;
    guessed = true;
    $('guessHuman').disabled = true;
    $('guessAI').disabled = true;
    const correct = (type === 'ai') === wasAI;
    const earned = correct ? GUESS_POINTS : 0;
    const label = isAI => isAI ? 'an AI 🤖' : 'a human 🧑';
    $('resultIcon').textContent = correct ? '🎉' : '😅';
    $('resultTitle').textContent = correct ? 'You got it!' : 'So close!';
    $('resultSub').textContent = `The stranger was ${label(wasAI)}. You guessed ${label(type === 'ai')}.`;
    $('resultTotal').textContent = previousScore + earned;
    $('resultRound1').textContent = previousScore;
    $('resultRound2').textContent = `+${earned}`;
    $('resultMessages').textContent = messagesSent;
    $('resultConfetti').hidden = !correct;
    $('guessOverlay').hidden = true;
    $('resultOverlay').hidden = false;
    playSound(correct ? 'win' : 'wrong');
}

$('guessHuman').addEventListener('click', () => makeGuess('human'));
$('guessAI').addEventListener('click', () => makeGuess('ai'));
$('playAgainButton').addEventListener('click', () => {
    window.location.href = '/pages/menu.html';
});
