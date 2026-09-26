window.ABILITY_DEFINITIONS = {
    firewall: {
        name: 'Firewall',
        description: 'Guess wrong? Keep your streak for this question.',
        emoji: '🛡️'
    },
    lieDetector: {
        name: 'Lie Detector',
        description: 'Get a clue about how the message was written.',
        emoji: '🔍'
    },
    overclock: {
        name: 'Overclock',
        description: 'Get double points if you are right. If wrong, lose your streak.',
        emoji: '⚡'
    },
    override: {
        name: 'Override',
        description: 'Skip this question and get 100 points. Your streak ends.',
        emoji: '⏭️'
    }
};

window.createAbilityIcon = function (id) {
    const icon = document.createElement('span');
    icon.className = 'ability-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = window.ABILITY_DEFINITIONS[id].emoji;
    return icon;
};
