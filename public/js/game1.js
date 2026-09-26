const BASE_POINTS = 100;
const QUESTION_SECONDS = 10;
const FEEDBACK_SECONDS = 5;

const abilities = window.ABILITY_DEFINITIONS;

const questions = [
    { id: 1, text: 'aiyoo benda ni susah gila ah. aku dah cuba 3 kali still salah. rasa nak buang laptop terus. ke kau ada idea lain tak?', answer: 'human', explanation: 'This sounds like someone chatting while upset.', hint: 'The writer sounds upset and uses short, casual words.' },
    { id: 2, text: 'In Malaysia, various culinary traditions have converged over centuries, resulting in a diverse gastronomic landscape. Dishes such as Nasi Lemak, Char Kway Teow, and Roti Canai represent a harmonious blend of influences.', answer: 'ai', explanation: 'It sounds like a neat report, not a quick chat.', hint: 'The words sound very formal for a chat message.' },
    { id: 3, text: 'weh aku tadi nampak kau kat mamak tapi kau tak perasan. aku dah lambai-lambai macam orang gila. malu gila do', answer: 'human', explanation: 'This tells a funny, personal story about seeing a friend.', hint: 'The writer talks about something that just happened to them.' },
    { id: 4, text: 'To address your query, an effective study strategy involves spaced repetition, active recall, and adequate rest. Reviewing material at increasing intervals can support long-term retention.', answer: 'ai', explanation: 'It sounds like a prepared answer to a question.', hint: 'The first words sound like a school report.' },
    { id: 5, text: 'bro kau ingat tak masa form 3 kita main bola hujan-hujan sampai cikgu marah? best gila. rindu ah zaman tu', answer: 'human', explanation: 'The writer remembers a day they shared with a friend.', hint: 'The writer expects their friend to remember the same day.' },
    { id: 6, text: 'Certainly! Here are three practical ways to prepare for your presentation: outline your key points, rehearse aloud, and leave time for questions.', answer: 'ai', explanation: 'The tidy list sounds like advice from an AI helper.', hint: 'The advice is packed into a neat list.' },
    { id: 7, text: 'aku dah sampai depan library. eh silap, depan cafe sebelah library. kau kat mana?', answer: 'human', explanation: 'The writer fixes a mistake while sending a quick update.', hint: 'The writer corrects their location in the same message.' },
    { id: 8, text: 'The event offers an opportunity for students to connect, exchange ideas, and cultivate meaningful relationships within a supportive campus environment.', answer: 'ai', explanation: 'This sounds like a poster. It gives no personal details.', hint: 'It sounds like an ad for a school event.' },
    { id: 9, text: 'sorry lambat reply, tertidur dalam bas tadi. nasib driver kejut aku kalau tak sampai terminal', answer: 'human', explanation: 'The writer tells a small story about falling asleep on a bus.', hint: 'There is a clear reason for the late reply.' },
    { id: 10, text: 'If you are feeling overwhelmed, consider breaking your tasks into smaller steps and prioritizing the most urgent item first. Remember to take regular breaks.', answer: 'ai', explanation: 'This advice could be given to almost anyone.', hint: 'The advice is helpful but does not mention anything personal.' },
    { id: 11, text: 'weh siapa ambik charger aku kat studio? cable dia dah koyak sikit tu, jangan buat-buat tak nampak', answer: 'human', explanation: 'The writer is upset about their own charger.', hint: 'The writer knows a small detail about the charger.' },
    { id: 12, text: 'Thank you for sharing your perspective. While both options have merits, the best choice depends on your goals, available time, and preferred learning style.', answer: 'ai', explanation: 'It gives a careful answer without picking a side.', hint: 'The writer talks about both choices but never picks one.' }
];

const FEEDBACK_STYLES = {
    correct: { title: 'Correct!', icon: '✅', sound: 'correct' },
    wrong: { title: 'Oops!', icon: '❌', sound: 'wrong' },
    timeout: { title: "Time's up!", icon: '⏰', sound: 'wrong' },
    skip: { title: 'Skipped!', icon: '⏭️', sound: 'click' }
};

let currentQuestionIndex = 0;
let score = 0;
let streak = 0;
let multiplier = 1;
const params = new URLSearchParams(window.location.search);
let selectedAbilities = new Set((params.get('abilities') || '').split(',').filter(id => Object.hasOwn(abilities, id)));
let usedAbilities = new Set();
let failedQuestions = [];
let correctAnswers = 0;
let timerId = null;
let feedbackTimerId = null;
let feedbackTickId = null;
let phase = 'loadout';
let activeFirewall = false;
let activeOverclock = false;
let recoveryQuestion = null;
let recoveryResult = 'none';

const $ = id => document.getElementById(id);
const playerName = params.get('player')?.trim() || '';
const playerAvatar = params.get('avatar') || '🙂';
const playSound = name => window.sfx?.play(name);

function calculateMultiplier() {
    return streak >= 5 ? 2 : streak >= 3 ? 1.5 : 1;
}

function updateStats() {
    $('scoreDisplay').textContent = score;
    $('streakDisplay').textContent = streak;
    $('multiplierDisplay').textContent = multiplier.toFixed(1) + 'x';
    $('streakRow').classList.toggle('hot', streak >= 3);
    $('multiplierChip').classList.toggle('boosted', multiplier > 1);
}

function renderAbilities() {
    const container = $('abilityActions');
    container.replaceChildren();
    for (const id of selectedAbilities) {
        const button = document.createElement('button');
        button.type = 'button';
        const active = (id === 'firewall' && activeFirewall) || (id === 'overclock' && activeOverclock);
        const used = usedAbilities.has(id);
        button.className = `power-tile power-${id}` + (active ? ' active' : '') + (used ? ' used' : '');
        const status = active ? ' (on)' : used ? ' (used)' : '';
        button.setAttribute('aria-label', `${abilities[id].name}${status}: ${abilities[id].description}`);

        // Name + description card shown on hover / keyboard focus
        const tip = document.createElement('span');
        tip.className = 'power-tip';
        const tipName = document.createElement('strong');
        tipName.textContent = abilities[id].name + status;
        const tipText = document.createElement('span');
        tipText.textContent = abilities[id].description;
        tip.append(tipName, tipText);

        button.append(window.createAbilityIcon(id), tip);
        button.disabled = phase !== 'question' || usedAbilities.has(id);
        button.addEventListener('click', () => useAbility(id));
        container.append(button);
    }
}

const POWER_NOTES = {
    firewall: 'Your streak is protected this question',
    lieDetector: 'A clue appeared under the message',
    overclock: 'Double points if you get it right!',
    override: 'Skipping this question'
};

// Big "power-up activated" animation; restarting the CSS class replays it
function showPowerPop(id) {
    const pop = $('powerPop');
    $('powerPopIcon').replaceChildren(window.createAbilityIcon(id));
    $('powerPopName').textContent = `${abilities[id].name} activated!`;
    $('powerPopNote').textContent = POWER_NOTES[id];
    pop.className = `power-pop power-${id}`;
    void pop.offsetWidth;
    pop.classList.add('show');
}

function useAbility(id) {
    if (phase !== 'question' || !selectedAbilities.has(id) || usedAbilities.has(id)) return;
    usedAbilities.add(id);
    playSound('power');
    showPowerPop(id);
    if (id === 'firewall') activeFirewall = true;
    if (id === 'overclock') activeOverclock = true;
    if (id === 'lieDetector') {
        $('analysisHint').textContent = `🔍 Clue: ${questions[currentQuestionIndex].hint}`;
        $('analysisHint').hidden = false;
    }
    if (id === 'override') {
        stopTimer();
        score += BASE_POINTS;
        streak = 0;
        multiplier = 1;
        completeQuestion('skip', `+${BASE_POINTS}`, 'You skipped this one. Your streak has ended.');
    } else renderAbilities();
}

function stopTimer() {
    if (timerId !== null) clearInterval(timerId);
    timerId = null;
}

function stopFeedbackTimer() {
    if (feedbackTimerId !== null) clearTimeout(feedbackTimerId);
    if (feedbackTickId !== null) clearInterval(feedbackTickId);
    feedbackTimerId = null;
    feedbackTickId = null;
}

function startTimer() {
    stopTimer();
    const deadline = Date.now() + QUESTION_SECONDS * 1000;
    let lastShown = QUESTION_SECONDS;
    $('timerDisplay').classList.remove('urgent');
    $('timerDisplay').textContent = QUESTION_SECONDS;
    $('timerBar').style.width = '100%';
    timerId = setInterval(() => {
        const msLeft = Math.max(0, deadline - Date.now());
        const remaining = Math.ceil(msLeft / 1000);
        $('timerDisplay').textContent = remaining;
        $('timerDisplay').classList.toggle('urgent', remaining <= 3);
        $('timerBar').style.width = `${msLeft / (QUESTION_SECONDS * 1000) * 100}%`;
        if (remaining !== lastShown && remaining > 0 && remaining <= 3) playSound('tick');
        lastShown = remaining;
        if (remaining === 0) submitAnswer(null);
    }, 100);
}

function loadQuestion() {
    phase = 'question';
    activeFirewall = false;
    activeOverclock = false;
    const question = questions[currentQuestionIndex];
    $('questionCount').textContent = `${question.id} / ${questions.length}`;
    $('suspectNumber').textContent = String(question.id).padStart(2, '0');
    $('suspectText').textContent = question.text;
    $('analysisHint').hidden = true;
    $('analysisHint').textContent = '';
    $('feedbackModal').hidden = true;
    $('answerHuman').disabled = false;
    $('answerAi').disabled = false;
    updateStats();
    renderAbilities();
    startTimer();
}

function completeQuestion(kind, points, message) {
    phase = 'feedback';
    stopTimer();
    const style = FEEDBACK_STYLES[kind];
    const modal = $('feedbackModal');
    $('answerHuman').disabled = true;
    $('answerAi').disabled = true;
    modal.classList.remove('correct', 'wrong', 'timeout', 'skip');
    modal.classList.add(kind);
    $('feedbackIcon').textContent = style.icon;
    $('feedbackTitle').textContent = style.title;
    $('feedbackPoints').textContent = points;
    $('feedbackText').textContent = message;
    modal.hidden = false;
    playSound(style.sound);
    $('feedbackCountdownLabel').textContent = currentQuestionIndex === questions.length - 1
        ? (failedQuestions.length ? 'Bonus chance in' : 'Results in')
        : 'Next question in';
    $('feedbackNextButton').textContent = currentQuestionIndex === questions.length - 1
        ? (failedQuestions.length ? 'Bonus chance 🎁' : 'See results 🏆')
        : 'Next question ➜';
    $('feedbackSeconds').textContent = FEEDBACK_SECONDS;
    const deadline = Date.now() + FEEDBACK_SECONDS * 1000;
    feedbackTickId = setInterval(() => {
        $('feedbackSeconds').textContent = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
    }, 100);
    feedbackTimerId = setTimeout(nextQuestion, FEEDBACK_SECONDS * 1000);
    updateStats();
    renderAbilities();
}

function submitAnswer(choice) {
    if (phase !== 'question') return;
    const question = questions[currentQuestionIndex];
    if (choice === question.answer) {
        correctAnswers++;
        streak++;
        multiplier = calculateMultiplier();
        const points = BASE_POINTS * multiplier * (activeOverclock ? 2 : 1);
        score += points;
        const streakNote = streak >= 3 ? ` 🔥 ${streak} in a row!` : '';
        completeQuestion('correct', `+${points}`, question.explanation + streakNote);
    } else {
        failedQuestions.push({ id: question.id, text: question.text, answer: question.answer, explanation: question.explanation });
        if (activeOverclock || !activeFirewall || choice === null) {
            streak = 0;
            multiplier = 1;
        }
        const protection = activeFirewall && !activeOverclock && choice !== null ? ' 🛡️ Firewall kept your streak!' : '';
        const answerLabel = question.answer === 'ai' ? 'AI 🤖' : 'HUMAN 🧑';
        completeQuestion(choice === null ? 'timeout' : 'wrong', '+0', `It was ${answerLabel}. ${question.explanation}${protection}`);
    }
}

function nextQuestion() {
    if (phase !== 'feedback') return;
    stopFeedbackTimer();
    $('feedbackModal').hidden = true;
    if (currentQuestionIndex < questions.length - 1) {
        currentQuestionIndex++;
        loadQuestion();
    } else if (failedQuestions.length > 0) {
        startRecovery();
    } else {
        showFinal();
    }
}

function startRecovery() {
    phase = 'recovery';
    recoveryQuestion = failedQuestions[Math.floor(Math.random() * failedQuestions.length)];
    $('recoveryQuestionLabel').textContent = `Question ${recoveryQuestion.id}`;
    $('recoveryText').textContent = recoveryQuestion.text;
    $('recoveryModal').hidden = false;
}

function submitRecovery(choice) {
    if (phase !== 'recovery') return;
    phase = 'complete';
    $('recoveryHuman').disabled = true;
    $('recoveryAi').disabled = true;
    if (choice === recoveryQuestion.answer) {
        score += BASE_POINTS / 2;
        recoveryResult = 'Recovered 50 points';
        playSound('correct');
    } else {
        recoveryResult = 'Recovery missed';
        playSound('wrong');
    }
    $('recoveryModal').hidden = true;
    showFinal();
}

function showFinal() {
    phase = 'final';
    const perfect = failedQuestions.length === 0;
    const stars = correctAnswers >= 11 ? 3 : correctAnswers >= 7 ? 2 : correctAnswers >= 3 ? 1 : 0;
    $('finalTitle').textContent = perfect ? 'Perfect Score Victory' : ['Nice try!', 'Good job!', 'Great job!', 'Amazing!'][stars];
    $('finalStars').replaceChildren(...[0, 1, 2].map(i => {
        const star = document.createElement('span');
        star.textContent = '⭐';
        if (i >= stars) star.className = 'off';
        return star;
    }));
    $('finalSummary').textContent = perfect
        ? 'You got all 12 questions right. You are a real AI detective!'
        : `You got ${correctAnswers} out of ${questions.length} right. Ready for the live chat?`;
    $('finalScore').textContent = score;
    $('finalCorrect').textContent = correctAnswers;
    $('finalWrong').textContent = failedQuestions.length;
    $('finalRecovery').textContent = recoveryResult === 'Recovered 50 points' ? '+50' : recoveryResult === 'Recovery missed' ? '✗' : '–';
    const next = new URLSearchParams({ player: playerName, avatar: playerAvatar, g1score: score, g1total: questions.length });
    $('continueButton').href = `/pages/chat.html?${next.toString()}`;
    $('finalModal').hidden = false;
    playSound('win');
}

function beginGame() {
    if (phase !== 'loadout' || selectedAbilities.size !== 2 || !playerName) return;
    $('gameShell').hidden = false;
    loadQuestion();
}

if (!playerName || selectedAbilities.size !== 2) {
    window.location.href = '/pages/menu.html';
} else {
    $('playerLabel').textContent = playerName;
    $('playerAvatar').textContent = playerAvatar;
    beginGame();
}
$('answerHuman').addEventListener('click', () => submitAnswer('human'));
$('answerAi').addEventListener('click', () => submitAnswer('ai'));
$('feedbackNextButton').addEventListener('click', nextQuestion);
$('recoveryHuman').addEventListener('click', () => submitRecovery('human'));
$('recoveryAi').addEventListener('click', () => submitRecovery('ai'));
