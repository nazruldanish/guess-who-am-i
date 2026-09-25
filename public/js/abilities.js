window.ABILITY_DEFINITIONS = {
    firewall: {
        name: 'Firewall',
        description: 'Guess wrong? Keep your streak for this question.',
        icon: '<path d="M12 2 4 5v6c0 5 3.4 9 8 11 4.6-2 8-6 8-11V5l-8-3Z"/><path d="m9 12 2 2 4-4"/>'
    },
    lieDetector: {
        name: 'Lie Detector',
        description: 'Get a clue about how the message was written.',
        icon: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5M8 10h5m-3-2v5"/>'
    },
    overclock: {
        name: 'Overclock',
        description: 'Get double points if you are right. If wrong, lose your streak.',
        icon: '<path d="m13 2-9 11h7l-1 9 10-12h-7l1-8Z"/>'
    },
    override: {
        name: 'Override',
        description: 'Skip this question and get 100 points. Your streak ends.',
        icon: '<path d="M4 5v14l10-7L4 5Zm11 0v14M20 5v14"/>'
    }
};

window.createAbilityIcon = function (id) {
    const icon = document.createElement('span');
    icon.className = 'ability-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${window.ABILITY_DEFINITIONS[id].icon}</svg>`;
    return icon;
};
