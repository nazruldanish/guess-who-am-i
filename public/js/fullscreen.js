// Full screen for the whole app. Screens run inside the shell page's frame (see /shell.html), so full screen
// is applied to the top-level page and stays on while the frame moves between screens.
(function () {
    let topDoc = document;
    try {
        if (window.top.document) topDoc = window.top.document;
    } catch {}
    const root = topDoc.documentElement;
    const supported = Boolean(root.requestFullscreen);

    window.fullscreen = {
        supported,
        get on() { return Boolean(topDoc.fullscreenElement); },
        set(on) {
            if (!supported) return Promise.resolve();
            if (on && !topDoc.fullscreenElement) return root.requestFullscreen();
            if (!on && topDoc.fullscreenElement) return topDoc.exitFullscreen();
            return Promise.resolve();
        },
        onChange(listener) {
            topDoc.addEventListener('fullscreenchange', listener);
            // The top page outlives this screen, so stop listening when the frame navigates away.
            window.addEventListener('pagehide', () => topDoc.removeEventListener('fullscreenchange', listener));
        }
    };
})();
