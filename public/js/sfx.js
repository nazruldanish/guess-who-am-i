// Tiny Web Audio sound effects, no audio files needed.
(function () {
    const STORAGE_KEY = 'gwai-sound';
    let enabled = true;
    try { enabled = localStorage.getItem(STORAGE_KEY) !== 'off'; } catch {}

    let ctx = null;
    function audio() {
        if (!ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return null;
            ctx = new AudioCtx();
        }
        if (ctx.state === 'suspended') ctx.resume();
        return ctx;
    }

    function tone(freq, start, duration, type = 'sine', volume = 0.18) {
        const ac = audio();
        if (!ac) return;
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        const t = ac.currentTime + start;
        osc.type = type;
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(volume, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
        osc.connect(gain).connect(ac.destination);
        osc.start(t);
        osc.stop(t + duration);
    }

    const sounds = {
        click: () => tone(520, 0, 0.08, 'triangle', 0.12),
        select: () => { tone(660, 0, 0.08, 'triangle'); tone(880, 0.06, 0.1, 'triangle'); },
        start: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.09, 0.18, 'square', 0.08)),
        tick: () => tone(1000, 0, 0.05, 'square', 0.06),
        correct: () => { tone(784, 0, 0.12, 'triangle'); tone(1175, 0.1, 0.25, 'triangle'); },
        wrong: () => { tone(220, 0, 0.18, 'sawtooth', 0.1); tone(160, 0.15, 0.3, 'sawtooth', 0.1); },
        power: () => { [392, 523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.05, 0.14, 'square', 0.07)); tone(1568, 0.28, 0.35, 'triangle', 0.12); },
        send:() => tone(740, 0, 0.07, 'sine', 0.1),
        receive: () => { tone(600, 0, 0.07, 'sine', 0.1); tone(900, 0.06, 0.08, 'sine', 0.1); },
        win: () => [523, 659, 784, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.22, 'triangle', 0.14))
    };

    window.sfx = {
        get enabled() { return enabled; },
        setEnabled(value) {
            enabled = Boolean(value);
            try { localStorage.setItem(STORAGE_KEY, enabled ? 'on' : 'off'); } catch {}
        },
        play(name) {
            if (!enabled || !sounds[name]) return;
            try { sounds[name](); } catch {}
        }
    };
})();
