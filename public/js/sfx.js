// Sound effects: recorded clips for click / correct / incorrect, tiny Web Audio tones for the rest.
(function () {
    const STORAGE_KEY = 'gwai-sfx-volume';
    // Volume from 0 to 1, set by the Settings sliders on the menu.
    let volume = 1;
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved !== null) volume = Math.min(1, Math.max(0, Number(saved) || 0));
        else if (localStorage.getItem('gwai-sound') === 'off') volume = 0;
    } catch {}

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

    function tone(freq, start, duration, type = 'sine', level = 0.18) {
        const ac = audio();
        if (!ac) return;
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        const t = ac.currentTime + start;
        osc.type = type;
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(level * volume, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
        osc.connect(gain).connect(ac.destination);
        osc.start(t);
        osc.stop(t + duration);
    }

    // Recorded clips. Each is measured once decoded and scaled so its loudness (RMS) hits
    // `level`, keeping the clips even with each other and with the tones below. The click is
    // quieter because it plays on every button press.
    const CLIPS = {
        click: { src: '/assets/music/click.mp3', level: 0.06 },
        correct: { src: '/assets/music/correct.mp3', level: 0.1 },
        incorrect: { src: '/assets/music/incorrect.MP3', level: 0.1 }
    };
    const MAX_PEAK = 0.9;

    function loudness(buffer) {
        let sum = 0, peak = 0, count = 0, first = buffer.length;
        for (let c = 0; c < buffer.numberOfChannels; c++) {
            const data = buffer.getChannelData(c);
            for (let i = 0; i < data.length; i++) {
                const v = data[i];
                const a = Math.abs(v);
                if (a > peak) peak = a;
                if (a > 0.01 && i < first) first = i;
                // Skip near-silence so leading/trailing gaps do not drag the average down
                if (a > 0.01) { sum += v * v; count++; }
            }
        }
        // `start` is where the sound begins, so the silence MP3s carry at the front can be skipped
        return { rms: count ? Math.sqrt(sum / count) : 0, peak, start: first < buffer.length ? first / buffer.sampleRate : 0 };
    }

    // Decode with an offline context so nothing tries to start audio before the player interacts
    const Offline = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (Offline && window.fetch) {
        const decoder = new Offline(1, 1, 44100);
        for (const clip of Object.values(CLIPS)) {
            fetch(clip.src)
                .then(response => response.arrayBuffer())
                .then(data => decoder.decodeAudioData(data))
                .then(buffer => {
                    const { rms, peak, start } = loudness(buffer);
                    clip.buffer = buffer;
                    clip.start = start;
                    clip.gain = rms ? Math.min(clip.level / rms, MAX_PEAK / peak) : 1;
                })
                .catch(() => {});
        }
    }

    function playClip(clip, fallback, { gain: scale = 1, rate = 1, lowpass = 0 } = {}) {
        const ac = clip.buffer && audio();
        if (!ac) return fallback();
        const source = ac.createBufferSource();
        const gain = ac.createGain();
        source.buffer = clip.buffer;
        source.playbackRate.value = rate;
        gain.gain.value = clip.gain * scale * volume;
        let node = source;
        if (lowpass) {
            // Cut the highs to muffle the sound
            const filter = ac.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = lowpass;
            node = node.connect(filter);
        }
        node.connect(gain).connect(ac.destination);
        source.start(0, clip.start);
    }

    const sounds = {
        click: () => playClip(CLIPS.click, () => tone(520, 0, 0.08, 'triangle', 0.12)),
        // Typing reuses the click pitched down and muffled into a deeper "thock", with a small
        // random pitch change per key. Filtering takes some energy out, so the gain is a touch higher.
        type: () => playClip(CLIPS.click, () => tone(180, 0, 0.05, 'sine', 0.08), { gain: 0.7, rate: 0.6 + Math.random() * 0.08, lowpass: 1400 }),
        correct: () => playClip(CLIPS.correct, () => { tone(784, 0, 0.12, 'triangle'); tone(1175, 0.1, 0.25, 'triangle'); }),
        incorrect: () => playClip(CLIPS.incorrect, () => sounds.wrong()),
        start: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.09, 0.18, 'square', 0.08)),
        tick: () => tone(1000, 0, 0.05, 'square', 0.06),
        wrong: () => { tone(220, 0, 0.18, 'sawtooth', 0.1); tone(160, 0.15, 0.3, 'sawtooth', 0.1); },
        power: () => { [392, 523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.05, 0.14, 'square', 0.07)); tone(1568, 0.28, 0.35, 'triangle', 0.12); },
        send:() => tone(740, 0, 0.07, 'sine', 0.1),
        receive: () => { tone(600, 0, 0.07, 'sine', 0.1); tone(900, 0.06, 0.08, 'sine', 0.1); },
        win: () => [523, 659, 784, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.22, 'triangle', 0.14))
    };

    window.sfx = {
        get volume() { return volume; },
        setVolume(value) {
            volume = Math.min(1, Math.max(0, Number(value) || 0));
            try { localStorage.setItem(STORAGE_KEY, String(volume)); } catch {}
        },
        play(name) {
            if (volume === 0 || !sounds[name]) return;
            try { sounds[name](); } catch {}
        }
    };

    // Every button, link and switch clicks. Elements that play their own sound instead
    // (the answer buttons) opt out with data-click-sound="off".
    const CLICKABLE = 'button, a[href], [role="button"], input[type="checkbox"], select, label';
    function clickSound(event) {
        const target = event.target.closest?.(CLICKABLE);
        if (!target || target.disabled || target.dataset.clickSound === 'off') return;
        // A <label> only counts when it toggles a switch
        if (target.tagName === 'LABEL' && (target.control?.type !== 'checkbox' || target.control.disabled)) return;
        window.sfx.play('click');
    }
    // Soft tap for each character typed or deleted in a text box (e.g. player name)
    document.addEventListener('input', event => {
        if (event.target.matches?.('input[type="text"], textarea')) window.sfx.play('type');
    }, true);

    // Mouse/touch: sound on press rather than release so it feels instant
    let lastPointerDown = 0;
    document.addEventListener('pointerdown', event => {
        lastPointerDown = Date.now();
        if (event.button === 0) clickSound(event);
    }, true);
    // Keyboard (Enter/Space) only produces a click event. Skip clicks that follow a press,
    // including the one a label forwards to its switch.
    document.addEventListener('click', event => {
        if (Date.now() - lastPointerDown > 1000) clickSound(event);
    }, true);
})();
