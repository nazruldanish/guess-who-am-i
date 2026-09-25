const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function makeGame(abilityList = 'firewall,lieDetector') {
    const elements = new Map();
    const timeouts = [];
    function element() {
        return {
            textContent: '', hidden: false, disabled: false, style: {}, children: [],
            classList: { add() {}, remove() {}, toggle() {} },
            setAttribute() {}, addEventListener(type, callback) { this[type] = callback; },
            replaceChildren(...children) { this.children = children; },
            append(...children) { this.children.push(...children); }
        };
    }
    const document = {
        body: { classList: { add() {} } },
        getElementById(id) {
            if (!elements.has(id)) {
                const node = element();
                node.hidden = ['gameShell', 'recoveryModal', 'finalModal', 'feedbackModal', 'analysisHint'].includes(id);
                elements.set(id, node);
            }
            return elements.get(id);
        },
        createElement: element
    };
    const context = vm.createContext({
        document,
        window: { location: { search: '?player=Tester&abilities=' + abilityList } },
        URLSearchParams,
        setInterval: () => 1,
        clearInterval() {},
        setTimeout(callback, delay) { timeouts.push({ callback, delay }); return timeouts.length; },
        clearTimeout() {},
        Date,
        Math
    });
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../public/js/abilities.js'), 'utf8'), context);
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../public/js/game1.js'), 'utf8'), context);
    return {
        run: expression => vm.runInContext(expression, context),
        get: id => document.getElementById(id),
        timeouts
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
    assert.match(window.location.href, /\/pages\/game1\.html\?player=Tester&abilities=firewall%2Coverclock/);
});

test('12 correct answers go directly to perfect victory with streak points', () => {
    const game = makeGame();
    assert.equal(game.run('selectedAbilities.size'), 2);
    assert.equal(game.get('gameShell').hidden, false);
    for (let i = 0; i < 12; i++) {
        game.run('submitAnswer(questions[currentQuestionIndex].answer)');
        game.run('nextQuestion()');
    }
    assert.equal(game.run('score'), 2100);
    assert.equal(game.run('failedQuestions.length'), 0);
    assert.equal(game.get('finalTitle').textContent, 'Perfect Score Victory');
    assert.equal(game.get('recoveryModal').hidden, true);
});

test('many misses permit exactly one recovery worth 50 points', () => {
    const game = makeGame('firewall,override');
    for (let i = 0; i < 12; i++) {
        game.run("submitAnswer(questions[currentQuestionIndex].answer === 'human' ? 'ai' : 'human')");
        game.run('nextQuestion()');
    }
    assert.equal(game.run('failedQuestions.length'), 12);
    assert.equal(game.get('recoveryModal').hidden, false);
    game.run('submitRecovery(recoveryQuestion.answer)');
    assert.equal(game.run('score'), 50);
    game.run('submitRecovery(recoveryQuestion.answer)');
    assert.equal(game.run('score'), 50);
    assert.equal(game.get('finalModal').hidden, false);
});

test('firewall protects a streak while overclock doubles points and resets on a miss', () => {
    const game = makeGame('firewall,overclock');
    for (let i = 0; i < 3; i++) {
        game.run('submitAnswer(questions[currentQuestionIndex].answer)');
        game.run('nextQuestion()');
    }
    assert.equal(game.run('streak'), 3);
    assert.equal(game.run('multiplier'), 1.5);
    game.run("useAbility('firewall'); submitAnswer('human')");
    assert.equal(game.run('streak'), 3);
    game.run('nextQuestion()');
    game.run("useAbility('overclock'); submitAnswer('human')");
    assert.equal(game.run('score'), 650);
    game.run('nextQuestion()');
    game.run("submitAnswer('human')");
    assert.equal(game.run('streak'), 0);
    assert.equal(game.run('multiplier'), 1);
});

test('override grants base points and forfeits the streak without a failed question', () => {
    const game = makeGame('override,lieDetector');
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
    game.run("useAbility('firewall'); useAbility('overclock'); submitAnswer('human')");
    assert.equal(game.run('streak'), 0);
    assert.equal(game.run('multiplier'), 1);
    game.run('nextQuestion(); submitAnswer(null)');
    assert.equal(game.run('failedQuestions.length'), 2);
    assert.equal(game.run('phase'), 'feedback');
});

test('answer feedback opens a popup and advances automatically after five seconds', () => {
    const game = makeGame();
    game.run('submitAnswer(questions[0].answer)');
    assert.equal(game.get('feedbackModal').hidden, false);
    assert.equal(game.get('feedbackSeconds').textContent, 5);
    assert.equal(game.timeouts[0].delay, 5000);
    game.timeouts[0].callback();
    assert.equal(game.run('currentQuestionIndex'), 1);
    assert.equal(game.get('feedbackModal').hidden, true);
});

test('Next button skips feedback countdown without advancing twice', () => {
    const game = makeGame();
    game.run('submitAnswer(questions[0].answer)');
    game.get('feedbackNextButton').click();
    assert.equal(game.run('currentQuestionIndex'), 1);
    assert.equal(game.get('feedbackModal').hidden, true);
    game.timeouts[0].callback();
    assert.equal(game.run('currentQuestionIndex'), 1);
});
