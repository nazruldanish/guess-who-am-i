const selectedAbilities = new Set();
const abilities = window.ABILITY_DEFINITIONS;
const AVATARS = ['🦊', '🐼', '🐯', '🐸', '🐵', '🦁', '🐨', '🐙', '🦄', '🐧', '🐶', '🐱'];
let avatarIndex = Math.floor(Math.random() * AVATARS.length);

const playSound = name => window.sfx?.play(name);

function renderAvatar() {
    document.getElementById('avatarButton').textContent = AVATARS[avatarIndex];
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
            playSound('select');
            renderLoadout();
        });
        grid.append(button);
    }
    const ready = selectedAbilities.size === 2;
    document.getElementById('selectionCount').textContent = `${selectedAbilities.size} of 2 selected`;
    document.getElementById('beginButton').disabled = !ready;
    document.getElementById('beginButton').textContent = ready ? 'Start Round 1 🚀' : 'Pick 2 power-ups';
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
    playSound('click');
    document.getElementById('loadoutModal').hidden = false;
}

function beginRound() {
    if (selectedAbilities.size !== 2) return;
    playSound('start');
    const params = new URLSearchParams({
        player: document.getElementById('playerName').value.trim(),
        abilities: [...selectedAbilities].join(','),
        avatar: AVATARS[avatarIndex]
    });
    window.location.href = '/pages/game1.html?' + params.toString();
}

renderAvatar();
renderLoadout();
document.getElementById('avatarButton').addEventListener('click', () => {
    avatarIndex = (avatarIndex + 1) % AVATARS.length;
    playSound('click');
    renderAvatar();
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
document.getElementById('playerName').addEventListener('keydown', event => {
    if (event.key === 'Enter') startGame();
});
const soundToggle = document.getElementById('soundToggle');
soundToggle.checked = window.sfx ? window.sfx.enabled : true;
soundToggle.addEventListener('change', () => {
    window.sfx?.setEnabled(soundToggle.checked);
    playSound('click');
});
