const selectedAbilities = new Set();
const abilities = window.ABILITY_DEFINITIONS;
// pixel-avatars.js (loaded first on the menu) supplies the pixel-art avatar list
const AVATARS = window.AVATAR_OPTIONS || ['🦊', '🐼', '🐯', '🐸', '🐵', '🦁', '🐨', '🐙', '🦄', '🐧', '🐶', '🐱'];
let avatarIndex = Math.floor(Math.random() * AVATARS.length);

const playSound = name => window.sfx?.play(name);

function renderAvatar() {
    document.getElementById('avatarButton').textContent = AVATARS[avatarIndex];
}

function renderAvatarPicker() {
    document.getElementById('avatarGrid').replaceChildren(...AVATARS.map((emoji, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'avatar-option' + (index === avatarIndex ? ' selected' : '');
        button.setAttribute('aria-pressed', index === avatarIndex);
        button.textContent = emoji;
        button.addEventListener('click', () => {
            avatarIndex = index;
            renderAvatar();
            closeAvatarPicker();
        });
        return button;
    }));
}

function openAvatarPicker() {
    renderAvatarPicker();
    document.getElementById('avatarModal').hidden = false;
    document.querySelector('#avatarGrid .selected')?.focus();
}

function closeAvatarPicker() {
    document.getElementById('avatarModal').hidden = true;
    document.getElementById('avatarButton').focus();
}

function renderLoadout() {
    const grid = document.getElementById('loadoutGrid');
    grid.replaceChildren();
    for (const [id, ability] of Object.entries(abilities)) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `loadout-option power-${id}` + (selectedAbilities.has(id) ? ' selected' : '');
        button.setAttribute('aria-pressed', selectedAbilities.has(id));

        const copy = document.createElement('span');
        copy.className = 'ability-copy';
        const title = document.createElement('strong');
        title.textContent = ability.name;
        const description = document.createElement('span');
        description.textContent = ability.description;
        copy.append(title, description);
        button.append(window.createAbilityIcon(id), copy);

        button.addEventListener('click', () => {
            if (selectedAbilities.has(id)) selectedAbilities.delete(id);
            else if (selectedAbilities.size < 2) selectedAbilities.add(id);
            renderLoadout();
        });
        grid.append(button);
    }
    const ready = selectedAbilities.size === 2;
    document.getElementById('selectionCount').textContent = window.i18n.t('loadout.count', { n: selectedAbilities.size });
    document.getElementById('beginButton').disabled = !ready;
}

function startGame() {
    const name = document.getElementById('playerName').value.trim();
    const inputWrapper = document.getElementById('inputWrapper');
    const errorMsg = document.getElementById('errorMsg');
    if (!name) {
        errorMsg.style.display = 'block';
        inputWrapper.classList.remove('shake');
        void inputWrapper.offsetWidth;
        inputWrapper.classList.add('shake');
        playSound('wrong');
        return;
    }
    errorMsg.style.display = 'none';
    document.getElementById('loadoutModal').hidden = false;
}

// Power-ups chosen: show the "how to spot AI" tips before Round 1 starts
function beginRound() {
    if (selectedAbilities.size !== 2) return;
    document.getElementById('loadoutModal').hidden = true;
    document.getElementById('tipsModal').hidden = false;
}

function startRound() {
    if (selectedAbilities.size !== 2) return;
    playSound('start');
    const params = new URLSearchParams({
        player: document.getElementById('playerName').value.trim(),
        abilities: [...selectedAbilities].join(','),
        avatar: AVATARS[avatarIndex]
    });
    const url = 'game1.html?' + params.toString();
    if (window.goTo) window.goTo(url); else window.location.href = url;
}

function leaderboardEntry(tag, className, entry) {
    const el = document.createElement(tag);
    el.className = className;
    const avatar = document.createElement('span');
    avatar.className = 'lb-avatar';
    avatar.textContent = entry.avatar;
    const name = document.createElement('span');
    name.className = 'lb-name';
    name.textContent = entry.name;
    const score = document.createElement('span');
    score.className = 'lb-score';
    score.textContent = entry.score.toLocaleString();
    el.append(avatar, name, score);
    return el;
}

function renderLeaderboard(entries) {
    // Podium order left-to-right: 2nd, 1st, 3rd.
    const podium = document.getElementById('podium');
    podium.replaceChildren(...[1, 0, 2].filter(i => entries[i]).map(i => {
        const place = leaderboardEntry('div', `podium-place place-${i + 1}`, entries[i]);
        const step = document.createElement('span');
        step.className = 'podium-step';
        step.textContent = i + 1;
        place.append(step);
        return place;
    }));
    document.getElementById('rankList').replaceChildren(
        ...entries.slice(3).map(entry => leaderboardEntry('li', 'rank-row', entry))
    );
    document.getElementById('leaderboardEmpty').hidden = entries.length > 0;
}

async function openLeaderboard() {
    document.getElementById('leaderboardModal').hidden = false;
    const empty = document.getElementById('leaderboardEmpty');
    renderLeaderboard(await window.leaderboard.load());
    empty.dataset.i18n = 'leaderboard.empty';
    empty.textContent = window.i18n.t(empty.dataset.i18n);
}

renderAvatar();
renderLoadout();
window.i18n.onChange(renderLoadout);
document.getElementById('leaderboardButton').addEventListener('click', openLeaderboard);
document.getElementById('leaderboardClose').addEventListener('click', () => {
    document.getElementById('leaderboardModal').hidden = true;
});
document.getElementById('avatarButton').addEventListener('click', openAvatarPicker);
document.getElementById('avatarClose').addEventListener('click', closeAvatarPicker);
document.getElementById('avatarModal').addEventListener('click', event => {
    if (event.target === event.currentTarget) closeAvatarPicker();
});
document.getElementById('startButton').addEventListener('click', startGame);
document.getElementById('clearNameButton').addEventListener('click', () => {
    document.getElementById('playerName').value = '';
    document.getElementById('playerName').focus();
});
document.getElementById('beginButton').addEventListener('click', beginRound);
document.getElementById('loadoutClose').addEventListener('click', () => {
    document.getElementById('loadoutModal').hidden = true;
});
document.getElementById('tipsReadyButton').addEventListener('click', startRound);
document.getElementById('tipsClose').addEventListener('click', () => {
    document.getElementById('tipsModal').hidden = true;
    document.getElementById('loadoutModal').hidden = false;
});
document.getElementById('playerName').addEventListener('keydown', event => {
    if (event.key === 'Enter') startGame();
});
