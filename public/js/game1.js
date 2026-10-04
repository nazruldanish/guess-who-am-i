const QUESTION_SECONDS = 10;
// Speed scoring: a right answer is worth the full amount straight away, sliding down to half at the buzzer
const MAX_POINTS = { text: 100, image: 125, video: 150 };
const SLOWEST_SHARE = 0.5;
const SKIP_POINTS = 100;
const SECOND_CHANCE_POINTS = 50;
const FEEDBACK_SECONDS = 10;
const SECOND_CHANCE_INTRO_MS = 2600;

const abilities = window.ABILITY_DEFINITIONS;
const { t, lang } = window.i18n;

// 12 questions: 5 texts (one per topic), then 4 pictures, then 3 videos
const QUESTION_MIX = [['text', 5], ['image', 4], ['video', 3]];

function shuffle(list) {
    const copy = [...list];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

// Random pick that never makes every question of a type all-AI or all-human
function pickMixed(pool, count) {
    const ai = shuffle(pool.filter(item => item.answer === 'ai'));
    const human = shuffle(pool.filter(item => item.answer === 'human'));
    const minAi = Math.max(1, count - human.length);
    const maxAi = Math.min(count - 1, ai.length);
    if (minAi > maxAi) return shuffle([...ai, ...human]).slice(0, count);
    const aiCount = minAi + Math.floor(Math.random() * (maxAi - minAi + 1));
    return shuffle([...ai.slice(0, aiCount), ...human.slice(0, count - aiCount)]);
}

// One random clue from each of `count` random topics, still never all-AI or all-human
function pickOnePerTopic(pool, count) {
    const byTopic = new Map();
    for (const item of pool) byTopic.set(item.label, [...(byTopic.get(item.label) || []), item]);
    const topics = shuffle([...byTopic.values()]).slice(0, count);
    const picked = topics.map(items => items[Math.floor(Math.random() * items.length)]);
    if (picked.length > 1 && picked.every(item => item.answer === picked[0].answer)) {
        const flip = shuffle(topics.map((items, index) => index))
            .find(index => topics[index].some(item => item.answer !== picked[0].answer));
        if (flip !== undefined) picked[flip] = shuffle(topics[flip].filter(item => item.answer !== picked[0].answer))[0];
    }
    return picked;
}

// Texts, pictures and videos come from the asset folders (served as window.GAME1_MEDIA), each with a
// topic label shown above the clue. Texts are per language (English texts stand in until a language has
// its own); picture/video labels are translated through media.labels.
const textLanguage = media => media.text?.[lang]?.ai?.length && media.text[lang].human?.length ? lang : 'en';

function buildQuestions(media = window.GAME1_MEDIA || {}) {
    const texts = media.text?.[textLanguage(media)];
    const labels = media.labels?.[lang] || {};
    const clues = { text: texts, image: media.image, video: media.video };
    const picked = QUESTION_MIX.flatMap(([type, count]) => {
        const pool = ['ai', 'human'].flatMap(answer =>
            (clues[type]?.[answer] || []).map(clue => ({
                ...clue, label: labels[clue.label?.toLowerCase()] || clue.label,
                type, answer, explanation: t(`game1.${type}.${answer}`) + (clue.why ? ` ${clue.why}` : '')
            })));
        return type === 'text' ? pickOnePerTopic(pool, count) : pickMixed(pool, count);
    });
    return picked.map((question, index) => ({ ...question, id: index + 1 }));
}

const questions = buildQuestions();

const FEEDBACK_STYLES = {
    correct: { title: 'game1.correct', sound: 'correct' },
    wrong: { title: 'game1.wrong', sound: 'incorrect' },
    timeout: { title: 'game1.timeout', sound: 'incorrect' },
    // The Skip tile already played its click and power-up sound
    skip: { title: 'game1.skip', sound: null }
};

const ANSWER_BUTTONS = [['answerHuman', 'human'], ['answerAi', 'ai']];

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
let recoveryActive = false;
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
        const status = active ? t('ability.on') : used ? t('ability.used') : '';
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

// Big "power-up activated" animation; restarting the CSS class replays it
function showPowerPop(id) {
    const pop = $('powerPop');
    $('powerPopIcon').replaceChildren(window.createAbilityIcon(id));
    $('powerPopName').textContent = t('ability.activated', { name: abilities[id].name });
    $('powerPopNote').textContent = t(`ability.${id}.note`);
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
    if (id === 'timeFreeze') {
        frozenMsLeft = timeLeftMs();
        stopTimer();
        $('timerDisplay').classList.remove('urgent');
        $('timerDisplay').classList.add('frozen');
    }
    if (id === 'override') {
        stopTimer();
        score += SKIP_POINTS;
        streak = 0;
        multiplier = 1;
        completeQuestion('skip', `+${SKIP_POINTS}`, t('game1.skipped'));
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

// "0:08" (m:ss)
const clock = seconds => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

// Time left on the current question in ms; Time Freeze pins it at the moment it was used
let questionDeadline = 0;
let frozenMsLeft = null;
const timeLeftMs = () => frozenMsLeft ?? Math.max(0, questionDeadline - Date.now());

// Points for a right answer: full while the clock is full, down to SLOWEST_SHARE at the buzzer, to the nearest 5
function speedPoints(type) {
    const share = SLOWEST_SHARE + (1 - SLOWEST_SHARE) * timeLeftMs() / (QUESTION_SECONDS * 1000);
    return MAX_POINTS[type] * share;
}
const roundPoints = points => Math.round(points / 5) * 5;

function startTimer() {
    stopTimer();
    const deadline = Date.now() + QUESTION_SECONDS * 1000;
    questionDeadline = deadline;
    frozenMsLeft = null;
    let lastShown = QUESTION_SECONDS;
    $('timerDisplay').classList.remove('urgent', 'frozen');
    $('timerDisplay').textContent = clock(QUESTION_SECONDS);
    $('timerBar').style.width = '100%';
    timerId = setInterval(() => {
        const msLeft = Math.max(0, deadline - Date.now());
        const remaining = Math.ceil(msLeft / 1000);
        $('timerDisplay').textContent = clock(remaining);
        $('timerDisplay').classList.toggle('urgent', remaining <= 3);
        $('timerBar').style.width = `${msLeft / (QUESTION_SECONDS * 1000) * 100}%`;
        if (remaining !== lastShown && remaining > 0 && remaining <= 3) playSound('tick');
        lastShown = remaining;
        if (remaining === 0) phase === 'recovery' ? submitRecovery(null) : submitAnswer(null);
    }, 100);
}

function loadQuestion() {
    phase = 'question';
    activeFirewall = false;
    activeOverclock = false;
    const question = questions[currentQuestionIndex];
    $('questionCount').textContent = `${question.id} / ${questions.length}`;
    showSuspect(question);
    resetAnswerBoxes(true);
    updateStats();
    renderAbilities();
    startTimer();
}

// Pictures and videos never play sound: videos are always muted and have no controls
function createMedia(question) {
    if (question.type === 'image') {
        const image = document.createElement('img');
        image.src = question.src;
        image.alt = question.label || t('game1.image.round');
        return image;
    }
    const video = document.createElement('video');
    video.src = question.src;
    video.muted = true;
    video.autoplay = true;
    video.loop = true;
    video.playsInline = true;
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    return video;
}

function showSuspect(question) {
    const type = question.type;
    const isText = question.type === 'text';
    closeMediaViewer();
    const label = question.label || t(`game1.${type}.label`);
    // Text questions name the situation ("Situation: Late For School"); pictures and videos show their label as is
    $('suspectHeading').textContent = isText ? t('game1.situation', { topic: label }) : label;
    $('answerHeading').textContent = t(`game1.${type}.heading`);
    $('roundTag').textContent = t('game1.roundTag');
    $('suspectText').hidden = !isText;
    $('suspectText').textContent = isText ? question.text : '';
    $('suspectMedia').hidden = isText;
    $('gameShell').classList.toggle('media-question', !isText);
    $('suspectMedia').replaceChildren(...(isText ? [] : [createMedia(question)]));
}

function currentQuestion() {
    return recoveryActive ? recoveryQuestion : questions[currentQuestionIndex];
}

function openMediaViewer() {
    const question = currentQuestion();
    if (question.type === 'text') return;
    const media = createMedia(question);
    const small = $('suspectMedia').querySelector('video');
    if (small && media.tagName === 'VIDEO') media.currentTime = small.currentTime;
    $('mediaViewerContent').replaceChildren(media);
    $('mediaViewer').hidden = false;
    $('mediaViewerClose').focus();
}

function closeMediaViewer() {
    if ($('mediaViewer').hidden) return;
    $('mediaViewer').hidden = true;
    $('mediaViewerContent').replaceChildren();
}

// Load the picked pictures and videos early so they show up right away
const preloadedMedia = questions.filter(question => question.type !== 'text').map(question => {
    const element = document.createElement(question.type === 'image' ? 'img' : 'video');
    element.preload = 'auto';
    element.src = question.src;
    return element;
});

function resetAnswerBoxes(enabled) {
    $('feedbackBar').hidden = true;
    for (const [id] of ANSWER_BUTTONS) {
        $(id).disabled = !enabled;
        $(id).classList.remove('result-correct', 'result-wrong');
        $(id + 'Points').hidden = true;
    }
}

function currentAnswer() {
    return currentQuestion().answer;
}

// Colour the answer boxes: the picked box turns green/red, the right answer is
// shown in green, and the points won pop up briefly over the box
function showAnswerResult(kind, choice, points) {
    const answer = currentAnswer();
    for (const [id, value] of ANSWER_BUTTONS) {
        const resultClass = value === answer ? 'result-correct' : value === choice ? 'result-wrong' : '';
        const pointsBadge = $(id + 'Points');
        $(id).disabled = true;
        $(id).classList.remove('result-correct', 'result-wrong');
        if (resultClass) $(id).classList.add(resultClass);
        pointsBadge.textContent = points;
        pointsBadge.hidden = !(value === choice || (kind === 'skip' && value === answer));
    }
}

function completeQuestion(kind, points, message, choice = null) {
    phase = 'feedback';
    stopTimer();
    closeMediaViewer();
    const style = FEEDBACK_STYLES[kind];
    showAnswerResult(kind, choice, points);
    $('feedbackTitle').textContent = t(style.title);
    $('feedbackText').textContent = message;
    $('feedbackBar').hidden = false;
    playSound(style.sound);
    const lastQuestion = currentQuestionIndex === questions.length - 1;
    const upNext = recoveryActive || (lastQuestion && !failedQuestions.length) ? 'results'
        : lastQuestion ? 'bonus' : 'next';
    $('feedbackCountdownLabel').textContent = t({ results: 'game1.resultsIn', bonus: 'game1.secondChanceIn', next: 'game1.nextQuestionIn' }[upNext]);
    $('feedbackNextButton').textContent = t({ results: 'game1.seeResults', bonus: 'game1.secondChanceButton', next: 'game1.nextQuestion' }[upNext]);
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
        const points = roundPoints(speedPoints(question.type) * multiplier * (activeOverclock ? 2 : 1));
        score += points;
        const streakNote = streak >= 3 ? t('game1.inARow', { n: streak }) : '';
        completeQuestion('correct', `+${points}`, question.explanation + streakNote, choice);
    } else {
        failedQuestions.push(question);
        if (activeOverclock || !activeFirewall || choice === null) {
            streak = 0;
            multiplier = 1;
        }
        const protection = activeFirewall && !activeOverclock && choice !== null ? t('game1.firewallKept', { name: abilities.firewall.name }) : '';
        const itWas = t('game1.itWas', { answer: t(`common.${question.answer}`) });
        completeQuestion(choice === null ? 'timeout' : 'wrong', '+0', itWas + question.explanation + protection, choice);
    }
}

function nextQuestion() {
    if (phase !== 'feedback') return;
    stopFeedbackTimer();
    $('feedbackBar').hidden = true;
    if (recoveryActive) {
        showFinal();
    } else if (currentQuestionIndex < questions.length - 1) {
        currentQuestionIndex++;
        loadQuestion();
    } else if (failedQuestions.length > 0) {
        startRecovery();
    } else {
        showFinal();
    }
}

// Second chance: a gift pop-up animation, then one missed question in the usual layout
function startRecovery() {
    phase = 'recovery-intro';
    recoveryActive = true;
    recoveryQuestion = failedQuestions[Math.floor(Math.random() * failedQuestions.length)];
    resetAnswerBoxes(false);
    renderAbilities();
    showSecondChancePop();
    setTimeout(loadRecoveryQuestion, SECOND_CHANCE_INTRO_MS);
}

// Full-screen orange takeover; restarting the CSS class replays it
function showSecondChancePop() {
    const pop = $('chancePop');
    $('chancePopNote').textContent = t('game1.secondChanceNote', { n: SECOND_CHANCE_POINTS });
    pop.classList.remove('show');
    void pop.offsetWidth;
    pop.classList.add('show');
    playSound('power');
}

function loadRecoveryQuestion() {
    phase = 'recovery';
    $('questionCount').textContent = t('game1.bonusBadge');
    showSuspect(recoveryQuestion);
    resetAnswerBoxes(true);
    renderAbilities();
    startTimer();
}

function submitRecovery(choice) {
    if (phase !== 'recovery') return;
    const bonus = SECOND_CHANCE_POINTS;
    if (choice === recoveryQuestion.answer) {
        score += bonus;
        recoveryResult = 'Recovered 50 points';
        completeQuestion('correct', `+${bonus}`, t('game1.bonusWon') + recoveryQuestion.explanation, choice);
    } else {
        recoveryResult = 'Recovery missed';
        completeQuestion(choice === null ? 'timeout' : 'wrong', '+0', t('game1.itWas', { answer: t(`common.${recoveryQuestion.answer}`) }) + recoveryQuestion.explanation, choice);
    }
}

function showFinal() {
    phase = 'final';
    const perfect = failedQuestions.length === 0;
    const stars = correctAnswers >= 11 ? 3 : correctAnswers >= 7 ? 2 : correctAnswers >= 3 ? 1 : 0;
    $('finalTitle').textContent = t(perfect ? 'game1.perfect' : `game1.stars${stars}`);
    $('finalScore').textContent = score;
    $('finalCorrect').textContent = correctAnswers;
    $('finalWrong').textContent = failedQuestions.length;
    $('finalRecovery').textContent = recoveryResult === 'Recovered 50 points' ? '+50' : recoveryResult === 'Recovery missed' ? '✗' : '–';
    $('finalScreen').hidden = false;
    playSound('win');
    saveRound1Score();
}

// Save the final score to the leaderboard
function saveRound1Score() {
    window.leaderboard.save({ name: playerName, avatar: playerAvatar, score });
}

function beginGame() {
    if (phase !== 'loadout' || selectedAbilities.size !== 2 || !playerName) return;
    $('gameShell').hidden = false;
    loadQuestion();
}

if (!playerName || selectedAbilities.size !== 2) {
    window.location.href = 'menu.html';
} else {
    $('playerLabel').textContent = playerName;
    $('playerAvatar').textContent = playerAvatar;
    beginGame();
}
const pickAnswer = choice => phase === 'recovery' ? submitRecovery(choice) : submitAnswer(choice);
$('answerHuman').addEventListener('click', () => pickAnswer('human'));
$('answerAi').addEventListener('click', () => pickAnswer('ai'));
$('feedbackNextButton').addEventListener('click', nextQuestion);
$('suspectMedia').addEventListener('click', openMediaViewer);
$('mediaViewerClose').addEventListener('click', closeMediaViewer);
$('mediaViewer').addEventListener('click', event => {
    if (event.target === $('mediaViewer') || event.target === $('mediaViewerContent')) closeMediaViewer();
});
document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeMediaViewer();
});
