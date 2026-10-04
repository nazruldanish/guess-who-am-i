// Power-up icons: filled "sticker" style in the poster colours (48x48 grid).
const OUTLINE = 'stroke="#1c0b3d" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"';

window.ABILITY_DEFINITIONS = {
    firewall: {
        get name() { return window.i18n.t('ability.firewall.name'); },
        get description() { return window.i18n.t('ability.firewall.description'); },
        // Purple shield with a lime tick
        icon: `<path d="M24 5 39 10v13c0 10-7 17-15 20C16 40 9 33 9 23V10Z" fill="#3b1f76" ${OUTLINE}/>
            <path d="M24 7.5 11.5 11.7V23c0 8.4 5.6 14.4 12.5 17.3Z" fill="#5a36a3"/>
            <path d="m16.5 24 5.5 5.5 10-11.5" fill="none" stroke="#d4fb79" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>
            <ellipse cx="15.5" cy="14.5" rx="3" ry="1.5" fill="#fff" opacity=".45" transform="rotate(-20 15.5 14.5)"/>`
    },
    timeFreeze: {
        get name() { return window.i18n.t('ability.timeFreeze.name'); },
        get description() { return window.i18n.t('ability.timeFreeze.description'); },
        // Icy blue stopwatch with a snowflake on the face
        icon: `<rect x="20" y="3.5" width="8" height="6" rx="2" fill="#2a8fd6" ${OUTLINE}/>
            <path d="m35.5 12.5 3-3" stroke="#1c0b3d" stroke-width="6" stroke-linecap="round"/>
            <path d="m35.5 12.5 3-3" stroke="#2a8fd6" stroke-width="2.5" stroke-linecap="round"/>
            <circle cx="24" cy="27" r="16" fill="#5bbcf2" ${OUTLINE}/>
            <circle cx="24" cy="27" r="11.5" fill="#eaf8ff" ${OUTLINE}/>
            <path d="M24 18.5v17M16.6 22.75l14.8 8.5M16.6 31.25l14.8-8.5" stroke="#2a8fd6" stroke-width="2.6" stroke-linecap="round"/>
            <path d="m21.5 19.5 2.5 2 2.5-2M21.5 34.5l2.5-2 2.5 2" fill="none" stroke="#2a8fd6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="24" cy="27" r="2" fill="#3b1f76"/>
            <path d="M12.5 21a13 13 0 0 1 5-5.5" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".7"/>`
    },
    overclock: {
        get name() { return window.i18n.t('ability.overclock.name'); },
        get description() { return window.i18n.t('ability.overclock.description'); },
        // Red lightning bolt with speed sparks
        icon: `<path d="M27 4 10 27h12l-3 17 19-25H26Z" fill="#ef3b3b" ${OUTLINE}/>
            <path d="M25.5 9.5 15 24.5h5" fill="none" stroke="#ff9a9a" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="m38 9 3.5-3.5M40 14.5h4.5M9 37.5l-3.5 3.5M8 32H3.5" fill="none" stroke="#7b4fd6" stroke-width="2.8" stroke-linecap="round"/>`
    },
    override: {
        get name() { return window.i18n.t('ability.override.name'); },
        get description() { return window.i18n.t('ability.override.description'); },
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
