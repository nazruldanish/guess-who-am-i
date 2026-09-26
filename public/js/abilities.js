// Power-up icons: filled "sticker" style in the poster colours (48x48 grid).
const OUTLINE = 'stroke="#1c0b3d" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"';

window.ABILITY_DEFINITIONS = {
    firewall: {
        name: 'Firewall',
        description: 'Guess wrong? Keep your streak for this question.',
        // Purple shield with a lime tick
        icon: `<path d="M24 5 39 10v13c0 10-7 17-15 20C16 40 9 33 9 23V10Z" fill="#3b1f76" ${OUTLINE}/>
            <path d="M24 7.5 11.5 11.7V23c0 8.4 5.6 14.4 12.5 17.3Z" fill="#5a36a3"/>
            <path d="m16.5 24 5.5 5.5 10-11.5" fill="none" stroke="#d4fb79" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>
            <ellipse cx="15.5" cy="14.5" rx="3" ry="1.5" fill="#fff" opacity=".45" transform="rotate(-20 15.5 14.5)"/>`
    },
    lieDetector: {
        name: 'Lie detector',
        description: 'Get a clue about how the message was written.',
        // Violet magnifying glass with a question mark in the lens
        icon: `<path d="m30 30 10 10" stroke="#1c0b3d" stroke-width="9" stroke-linecap="round"/>
            <path d="m30 30 10 10" stroke="#7b4fd6" stroke-width="4.5" stroke-linecap="round"/>
            <circle cx="20" cy="20" r="14" fill="#7b4fd6" ${OUTLINE}/>
            <circle cx="20" cy="20" r="9.5" fill="#eeffcc" ${OUTLINE}/>
            <path d="M16.8 17.3a3.3 3.3 0 1 1 4.7 3c-1.1.6-1.5 1.2-1.5 2.5" fill="none" stroke="#3b1f76" stroke-width="2.6" stroke-linecap="round"/>
            <circle cx="20" cy="26.3" r="1.5" fill="#3b1f76"/>
            <path d="M13.5 15.5a7 7 0 0 1 3.5-4" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/>`
    },
    overclock: {
        name: 'Overclock',
        description: 'Get double points if you are right. If wrong, lose your streak.',
        // Red lightning bolt with speed sparks
        icon: `<path d="M27 4 10 27h12l-3 17 19-25H26Z" fill="#ef3b3b" ${OUTLINE}/>
            <path d="M25.5 9.5 15 24.5h5" fill="none" stroke="#ff9a9a" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="m38 9 3.5-3.5M40 14.5h4.5M9 37.5l-3.5 3.5M8 32H3.5" fill="none" stroke="#7b4fd6" stroke-width="2.8" stroke-linecap="round"/>`
    },
    override: {
        name: 'Override',
        description: 'Skip this question and get 100 points. Your streak ends.',
        // Lime skip-forward arrows with a purple end bar
        icon: `<path d="M6 12.5 21 24 6 35.5Z" fill="#d4fb79" ${OUTLINE}/>
            <path d="M20 12.5 35 24 20 35.5Z" fill="#b8e25a" ${OUTLINE}/>
            <rect x="36" y="12" width="6" height="24" rx="2" fill="#3b1f76" ${OUTLINE}/>
            <path d="M9 17v6" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".7"/>`
    }
};

window.createAbilityIcon = function (id) {
    const icon = document.createElement('span');
    icon.className = 'ability-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.innerHTML = `<svg viewBox="0 0 48 48">${window.ABILITY_DEFINITIONS[id].icon}</svg>`;
    return icon;
};
