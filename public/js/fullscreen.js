// Full-screen toggle for the top-right button (hidden where the browser can't do it, e.g. iPhone Safari).
(function () {
    const button = document.getElementById('fullscreenButton');
    if (!button) return;
    const root = document.documentElement;
    if (!root.requestFullscreen) {
        button.hidden = true;
        return;
    }

    function sync() {
        const on = Boolean(document.fullscreenElement);
        button.classList.toggle('is-on', on);
        button.setAttribute('aria-label', on ? 'Exit full screen' : 'Full screen');
        button.title = on ? 'Exit full screen' : 'Full screen';
    }

    button.addEventListener('click', () => {
        if (document.fullscreenElement) document.exitFullscreen();
        else root.requestFullscreen().catch(() => {});
    });
    document.addEventListener('fullscreenchange', sync);
    sync();
})();
