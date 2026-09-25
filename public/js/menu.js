const selectedAbilities = new Set();
const abilities = window.ABILITY_DEFINITIONS;

function renderLoadout() {
    const grid = document.getElementById('loadoutGrid');
    grid.replaceChildren();
    for (const [id, ability] of Object.entries(abilities)) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'loadout-option' + (selectedAbilities.has(id) ? ' selected' : '');
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
    document.getElementById('selectionCount').textContent = `${selectedAbilities.size} of 2 selected`;
    document.getElementById('beginButton').disabled = selectedAbilities.size !== 2;
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
        return;
    }
    errorMsg.style.display = 'none';
    document.getElementById('loadoutModal').hidden = false;
}

function beginRound() {
    if (selectedAbilities.size !== 2) return;
    const params = new URLSearchParams({
        player: document.getElementById('playerName').value.trim(),
        abilities: [...selectedAbilities].join(',')
    });
    window.location.href = '/pages/game1.html?' + params.toString();
}

renderLoadout();
document.getElementById('startButton').addEventListener('click', startGame);
document.getElementById('clearNameButton').addEventListener('click', () => {
    document.getElementById('playerName').value = '';
    document.getElementById('playerName').focus();
});
document.getElementById('beginButton').addEventListener('click', beginRound);
document.getElementById('playerName').addEventListener('keydown', event => {
    if (event.key === 'Enter') startGame();
});
