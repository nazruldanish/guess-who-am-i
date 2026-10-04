// Looping background music. Each page picks its track with <script src="../js/music.js" data-track="menu">.
(function () {
    const STORAGE_KEY = 'gwai-music-volume';
    const track = document.currentScript?.dataset.track;

    // Volume from 0 to 1, set by the Settings sliders on the menu.
    let volume = 1;
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved !== null) volume = Math.min(1, Math.max(0, Number(saved) || 0));
        else if (localStorage.getItem('gwai-sound') === 'off') volume = 0;
    } catch {}

    // Per-track gain so every track plays equally loud. The tracks measured menu -13.1 dB
    // and game1 -18.5 dB, so each is scaled to about -19 dB.
    const TRACK_GAIN = { menu: 0.51, game1: 0.94 };

    const music = track ? new Audio(`../assets/music/${track}.mp3`) : null;
    if (music) music.loop = true;

    function apply() {
        if (!music) return;
        music.volume = 0.35 * (TRACK_GAIN[track] ?? 1) * volume;
        if (volume === 0) music.pause();
        else if (music.paused) music.play().catch(() => {});
    }

    // Browsers block autoplay until the player interacts with the page, so retry on the first input.
    function unlock() {
        apply();
        if (music && (!music.paused || volume === 0)) {
            window.removeEventListener('pointerdown', unlock);
            window.removeEventListener('keydown', unlock);
        }
    }
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    apply();

    window.music = {
        get volume() { return volume; },
        setVolume(value) {
            volume = Math.min(1, Math.max(0, Number(value) || 0));
            try { localStorage.setItem(STORAGE_KEY, String(volume)); } catch {}
            apply();
        }
    };
})();
