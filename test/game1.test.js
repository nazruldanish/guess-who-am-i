const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const clues = (key, names) => names.map(name => ({ [key]: name, label: 'Label ' + name }));
const MEDIA = {
    // Six English topics, each with one AI and one human text (with a saved reason); no Malay texts yet
    text: {
        en: Object.fromEntries(['ai', 'human'].map(answer =>
            [answer, [1, 2, 3, 4, 5, 6].map(n => ({ text: `${answer} ${n}`, label: `Topic ${n}`, why: `Reason ${answer} ${n}.` }))])),
        ms: { ai: [], human: [] }
    },
    labels: { ms: { 'label /a1.png': 'Label Melayu' } },
    image: { ai: clues('src', ['/a1.png', '/a2.png', '/a3.png', '/a4.png']), human: clues('src', ['/h1.jpg', '/h2.jpg', '/h3.jpg', '/h4.jpg']) },
    video: { ai: clues('src', ['/a1.mp4', '/a2.mp4', '/a3.mp4', '/a4.mp4']), human: clues('src', ['/h1.mp4', '/h2.mp4', '/h3.mp4']) }
};

function makeGame(abilityList = 'firewall,timeFreeze', lang = 'en') {
    const elements = new Map();
    const timeouts = [];
    const posts = [];
    function element() {
        return {
            textContent: '', hidden: false, disabled: false, style: {}, children: [],
            classList: { add() {}, remove() {}, toggle() {} },
            setAttribute() {}, addEventListener(type, callback) { this[type] = callback; },
            replaceChildren(...children) { this.children = children; },
            append(...children) { this.children.push(...children); },
            querySelector() { return null; }, focus() {}
        };
    }
    const document = {
        body: { classList: { add() {} } },
        addEventListener() {},
        getElementById(id) {
            if (!elements.has(id)) {
                const node = element();
                node.hidden = ['gameShell', 'finalScreen', 'feedbackBar', 'mediaViewer'].includes(id);
                elements.set(id, node);
            }
            return elements.get(id);
        },
        createElement: element
    };
    const context = vm.createContext({
        document,
        window: { location: { search: '?player=Tester&abilities=' + abilityList }, GAME1_MEDIA: MEDIA },
        URLSearchParams,
        setInterval: () => 1,
        clearInterval() {},
        setTimeout(callback, delay) { timeouts.push({ callback, delay }); return timeouts.length; },
        clearTimeout() {},
        Date,
        Math,
        localStorage: { getItem: () => lang, setItem() {} },
        fetch: (url, options) => { posts.push({ url, body: JSON.parse(options.body) }); return Promise.resolve(); }
    });
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../public/js/i18n.js'), 'utf8'), context);
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../public/js/abilities.js'), 'utf8'), context);
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../public/js/leaderboard.js'), 'utf8'), context);
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../public/js/game1.js'), 'utf8'), context);
    return {
        run: expression => vm.runInContext(expression, context),
        get: id => document.getElementById(id),
        timeouts,
        posts
    };
}

test('name entry opens loadout on the same page before Round 1', () => {
    const elements = new Map();
    function element() {
        return {
            value: '', hidden: false, disabled: false, textContent: '', style: {}, children: [],
            classList: { add() {}, remove() {} },
            setAttribute() {},
            addEventListener(type, callback) { this[type] = callback; },
            replaceChildren(...children) { this.children = children; },
            append(...children) { this.children.push(...children); }
        };
    }
    const document = {
        getElementById(id) {
            if (!elements.has(id)) elements.set(id, element());
            return elements.get(id);
        },
        createElement: element
    };
    const window = { location: { href: '/pages/menu.html' } };
    const context = vm.createContext({ document, window, URLSearchParams });
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../public/js/i18n.js'), 'utf8'), context);
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../public/js/abilities.js'), 'utf8'), context);
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../public/js/menu.js'), 'utf8'), context);
    document.getElementById('loadoutModal').hidden = true;
    document.getElementById('playerName').value = 'Tester';
    vm.runInContext('startGame()', context);
    assert.equal(document.getElementById('loadoutModal').hidden, false);
    assert.equal(window.location.href, '/pages/menu.html');
    assert.equal(document.getElementById('loadoutGrid').children.length, 4);
    assert.match(document.getElementById('loadoutGrid').children[0].children[0].innerHTML, /<svg/);
    document.getElementById('loadoutGrid').children[0].click();
    document.getElementById('loadoutGrid').children[2].click();
    assert.equal(document.getElementById('beginButton').disabled, false);
    vm.runInContext('beginRound()', context);
    assert.equal(document.getElementById('loadoutModal').hidden, true);
    assert.equal(document.getElementById('tipsModal').hidden, false);
    assert.equal(window.location.href, '/pages/menu.html');
    vm.runInContext('startRound()', context);
    assert.match(window.location.href, /^game1\.html\?player=Tester&abilities=firewall%2Coverclock/);
});

test('15 correct answers go directly to perfect victory with streak points', () => {
    const game = makeGame();
    assert.equal(game.run('selectedAbilities.size'), 2);
    assert.equal(game.get('gameShell').hidden, false);
    for (let i = 0; i < 15; i++) {
        game.run('submitAnswer(questions[currentQuestionIndex].answer)');
        game.run('nextQuestion()');
    }
    // Instant answers get full points: 5 texts (100, 100, 150, 150, 200 with the streak bonus),
    // 5 pictures at 2x 125 and 5 videos at 2x 150
    assert.equal(game.run('score'), 3450);
    assert.equal(game.run('failedQuestions.length'), 0);
    assert.equal(game.get('finalTitle').textContent, 'Perfect score victory');
    assert.equal(game.run('recoveryActive'), false);
    assert.deepEqual(game.posts, [{ url: '../api/leaderboard', body: { name: 'Tester', avatar: '🙂', score: 3450 } }]);
});

test('right answers are worth more the faster they come: full points down to half at the buzzer', () => {
    const game = makeGame();
    const answerWithTimeLeft = (index, msLeft) => {
        game.run(`currentQuestionIndex = ${index}; loadQuestion(); questionDeadline = Date.now() + ${msLeft}`);
        const before = game.run('score');
        game.run('submitAnswer(questions[currentQuestionIndex].answer); streak = 0; multiplier = 1');
        return game.run('score') - before;
    };
    assert.equal(answerWithTimeLeft(0, 10000), 100, 'text, instant');
    assert.equal(answerWithTimeLeft(1, 5000), 75, 'text, halfway');
    assert.equal(answerWithTimeLeft(2, 0), 50, 'text, at the buzzer');
    assert.equal(answerWithTimeLeft(5, 10000), 125, 'picture, instant');
    assert.equal(answerWithTimeLeft(6, 5000), 95, 'picture, halfway (93.75 rounds to 95)');
    assert.equal(answerWithTimeLeft(10, 10000), 150, 'video, instant');
    assert.equal(answerWithTimeLeft(11, 0), 75, 'video, at the buzzer');
});

test('time freeze locks the points at the moment it is used', () => {
    const game = makeGame('override,timeFreeze');
    game.run('questionDeadline = Date.now() + 8000');
    game.run("useAbility('timeFreeze')");
    game.run('questionDeadline = Date.now()'); // time passing no longer matters
    game.run('submitAnswer(questions[currentQuestionIndex].answer)');
    assert.equal(game.run('score'), 90);
});

test('many misses permit exactly one recovery worth 50 points', () => {
    const game = makeGame('firewall,override');
    for (let i = 0; i < 15; i++) {
        game.run("submitAnswer(questions[currentQuestionIndex].answer === 'human' ? 'ai' : 'human')");
        game.run('nextQuestion()');
    }
    assert.equal(game.run('failedQuestions.length'), 15);
    assert.equal(game.run('phase'), 'recovery-intro');
    assert.match(game.get('chancePopNote').textContent, /\+50/);
    game.run('submitRecovery(recoveryQuestion.answer)');
    assert.equal(game.run('score'), 0, 'answers are ignored during the intro animation');
    game.timeouts.at(-1).callback();
    assert.equal(game.run('phase'), 'recovery');
    assert.equal(game.get('suspectText').textContent, game.run("recoveryQuestion.text || ''"));
    game.run('submitRecovery(recoveryQuestion.answer)');
    assert.equal(game.run('score'), 50);
    game.run('submitRecovery(recoveryQuestion.answer)');
    assert.equal(game.run('score'), 50);
    assert.equal(game.get('feedbackNextButton').textContent, 'See results');
    game.run('nextQuestion()');
    assert.equal(game.get('finalScreen').hidden, false);
});

test('firewall protects a streak while overclock doubles points and resets on a miss', () => {
    const game = makeGame('firewall,overclock');
    for (let i = 0; i < 3; i++) {
        game.run('submitAnswer(questions[currentQuestionIndex].answer)');
        game.run('nextQuestion()');
    }
    assert.equal(game.run('streak'), 3);
    assert.equal(game.run('multiplier'), 1.5);
    game.run("useAbility('firewall'); submitAnswer(questions[currentQuestionIndex].answer === 'human' ? 'ai' : 'human')");
    assert.equal(game.run('streak'), 3);
    game.run('nextQuestion()');
    game.run("useAbility('overclock'); submitAnswer(questions[currentQuestionIndex].answer)");
    assert.equal(game.run('score'), 650);
    game.run('nextQuestion()');
    game.run("submitAnswer(questions[currentQuestionIndex].answer === 'human' ? 'ai' : 'human')");
    assert.equal(game.run('streak'), 0);
    assert.equal(game.run('multiplier'), 1);
});

test('time freeze stops the question timer until the next question', () => {
    const game = makeGame('override,timeFreeze');
    game.run("useAbility('timeFreeze')");
    assert.equal(game.run('timerId'), null);
    assert.equal(game.run('phase'), 'question');
    game.run('submitAnswer(questions[currentQuestionIndex].answer); nextQuestion()');
    assert.notEqual(game.run('timerId'), null);
});

test('override grants base points and forfeits the streak without a failed question', () => {
    const game = makeGame('override,timeFreeze');
    game.run('useAbility(\'override\')');
    assert.equal(game.run('score'), 100);
    assert.equal(game.run('streak'), 0);
    assert.equal(game.run('failedQuestions.length'), 0);
    assert.equal(game.run('phase'), 'feedback');
});

test('overclock miss resets a protected streak and a timeout is recorded as failed', () => {
    const game = makeGame('firewall,overclock');
    for (let i = 0; i < 3; i++) {
        game.run('submitAnswer(questions[currentQuestionIndex].answer)');
        game.run('nextQuestion()');
    }
    game.run("useAbility('firewall'); useAbility('overclock'); submitAnswer(questions[currentQuestionIndex].answer === 'human' ? 'ai' : 'human')");
    assert.equal(game.run('streak'), 0);
    assert.equal(game.run('multiplier'), 1);
    game.run('nextQuestion(); submitAnswer(null)');
    assert.equal(game.run('failedQuestions.length'), 2);
    assert.equal(game.run('phase'), 'feedback');
});

test('answer feedback shows in the answer boxes and advances automatically after five seconds', () => {
    const game = makeGame();
    game.run('submitAnswer(questions[0].answer)');
    assert.equal(game.get('feedbackBar').hidden, false);
    const box = game.run("questions[0].answer === 'human' ? 'answerHuman' : 'answerAi'");
    assert.equal(game.get(box + 'Points').hidden, false);
    assert.equal(game.get(box + 'Points').textContent, '+100');
    assert.equal(game.get('feedbackSeconds').textContent, 10);
    assert.equal(game.timeouts[0].delay, 10000);
    game.timeouts[0].callback();
    assert.equal(game.run('currentQuestionIndex'), 1);
    assert.equal(game.get('feedbackBar').hidden, true);
});

test('Next button skips feedback countdown without advancing twice', () => {
    const game = makeGame();
    game.run('submitAnswer(questions[0].answer)');
    game.get('feedbackNextButton').click();
    assert.equal(game.run('currentQuestionIndex'), 1);
    assert.equal(game.get('feedbackBar').hidden, true);
    game.timeouts[0].callback();
    assert.equal(game.run('currentQuestionIndex'), 1);
});

test('each game has 5 texts from different topics, 5 pictures and 5 videos, never all AI or all human per type', () => {
    for (let run = 0; run < 50; run++) {
        const game = makeGame();
        const questions = JSON.parse(game.run('JSON.stringify(questions)'));
        assert.deepEqual(questions.map(q => q.type), [...Array(5).fill('text'), ...Array(5).fill('image'), ...Array(5).fill('video')]);
        const topics = questions.filter(q => q.type === 'text').map(q => q.label);
        assert.equal(new Set(topics).size, 5, 'one text per topic');
        assert.deepEqual(questions.map(q => q.id), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
        for (const type of ['text', 'image', 'video']) {
            const answers = questions.filter(q => q.type === type).map(q => q.answer);
            assert.ok(answers.includes('ai') && answers.includes('human'), `${type}: ${answers}`);
        }
        const sources = questions.filter(q => q.type !== 'text').map(q => q.src);
        assert.equal(new Set(sources).size, 10, 'no repeated media');
        for (const q of questions) {
            const key = q.type === 'text' ? 'text' : 'src';
            const pool = q.type === 'text' ? MEDIA.text.en : MEDIA[q.type];
            assert.ok(pool[q.answer].some(clue => clue[key] === q[key]), 'answer matches its folder');
        }
    }
});

test('picture and video questions show muted media that can be enlarged', () => {
    const game = makeGame();
    game.run('currentQuestionIndex = 10; loadQuestion()');
    assert.equal(game.get('suspectText').hidden, true);
    assert.equal(game.get('suspectMedia').hidden, false);
    const video = game.get('suspectMedia').children[0];
    assert.equal(video.muted, true);
    assert.equal(video.src, game.run('questions[10].src'));
    assert.equal(game.get('answerHeading').textContent, 'Who made this video?');
    assert.equal(game.get('suspectHeading').textContent, game.run('questions[10].label'));
    game.get('suspectMedia').click();
    assert.equal(game.get('mediaViewer').hidden, false);
    assert.equal(game.get('mediaViewerContent').children[0].muted, true);
    game.run("submitAnswer('human')");
    assert.equal(game.get('mediaViewer').hidden, true, 'answering closes the enlarged view');
    game.run('currentQuestionIndex = 0; loadQuestion()');
    assert.equal(game.get('suspectMedia').hidden, true);
    assert.equal(game.get('suspectText').textContent, game.run('questions[0].text'));
});

test('Bahasa Melayu shows Malay text, translated labels, and English texts until Malay ones exist', () => {
    const game = makeGame('firewall,timeFreeze', 'ms');
    const questions = JSON.parse(game.run('JSON.stringify(questions)'));
    assert.ok(questions.filter(q => q.type === 'text').every(q => q.label.startsWith('Topic')), 'falls back to English texts');
    assert.equal(game.get('answerHeading').textContent, 'Siapa yang tulis ini?');
    assert.equal(game.get('roundTag').textContent, 'Pusingan 1 · Kuiz');
    const a1 = questions.find(q => q.src === '/a1.png');
    if (a1) assert.equal(a1.label, 'Label Melayu');
    game.run("submitAnswer(questions[0].answer === 'human' ? 'ai' : 'human')");
    assert.equal(game.get('feedbackTitle').textContent, 'Alamak!');
    assert.match(game.get('feedbackText').textContent, /^Jawapannya (Manusia|AI)\. Ini ditulis oleh/);
    assert.equal(game.run('abilities.firewall.name'), 'Perisai');
});

test('text questions add their saved DeepSeek reason to the answer explanation', () => {
    const game = makeGame();
    const question = game.run('questions[0]');
    assert.equal(question.type, 'text');
    const writer = question.answer === 'ai' ? 'This was written by AI.' : 'This was written by a person.';
    assert.equal(question.explanation, `${writer} Reason ${question.text}.`);
});

test('the results button goes back to the menu', () => {
    const html = fs.readFileSync(path.join(__dirname, '../public/pages/game1.html'), 'utf8');
    assert.match(html, /id="continueButton" href="menu\.html"/);
});
