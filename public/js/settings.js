// Settings pop-up (menu and both game screens): sound effect and music volume sliders plus a full-screen switch.
(function () {
    const modal = document.getElementById('settingsModal');
    document.getElementById('settingsButton').addEventListener('click', () => { modal.hidden = false; });
    document.getElementById('settingsClose').addEventListener('click', () => { modal.hidden = true; });

    function bindVolume(inputId, labelId, target, onChange) {
        const input = document.getElementById(inputId);
        const label = document.getElementById(labelId);
        if (!input || !target) return;

        function render() {
            label.textContent = `${input.value}%`;
            input.style.setProperty('--fill', `${input.value}%`);
        }
        input.value = Math.round(target.volume * 100);
        render();
        input.addEventListener('input', () => {
            target.setVolume(input.value / 100);
            render();
        });
        if (onChange) input.addEventListener('change', onChange);
    }

    // Play a click when the sound slider is released so the player hears the new level.
    bindVolume('sfxVolume', 'sfxVolumeValue', window.sfx, () => window.sfx.play('click'));
    bindVolume('musicVolume', 'musicVolumeValue', window.music);

    const fullscreenRow = document.getElementById('fullscreenRow');
    const fullscreenToggle = document.getElementById('fullscreenToggle');
    if (!window.fullscreen?.supported) {
        // Not supported (e.g. iPhone Safari).
        fullscreenRow.hidden = true;
        return;
    }
    const sync = () => { fullscreenToggle.checked = window.fullscreen.on; };
    fullscreenToggle.addEventListener('change', () => {
        window.fullscreen.set(fullscreenToggle.checked).catch(sync);
    });
    window.fullscreen.onChange(sync);
    sync();
})();
