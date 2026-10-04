// Curtain wipe between screens. Each page reveals itself on load (see "Screen transitions" in app.css);
// goTo() and links to other screens in pages/ close the curtain first, then navigate.
(function () {
    const CLOSE_MS = 650;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let leaving = false;

    window.goTo = function (url) {
        if (leaving) return;
        if (reduceMotion) {
            window.location.href = url;
            return;
        }
        leaving = true;
        document.documentElement.classList.add('page-leaving');
        setTimeout(() => { window.location.href = url; }, CLOSE_MS);
    };

    document.addEventListener('click', event => {
        const link = event.target.closest('a[href]');
        if (!link || link.origin !== location.origin || !link.pathname.includes('/pages/') || link.target || event.defaultPrevented || event.button !== 0) return;
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        window.goTo(link.href);
    });

    // Coming back from the browser's page cache would otherwise show the closed curtain
    window.addEventListener('pageshow', event => {
        if (!event.persisted) return;
        leaving = false;
        document.documentElement.classList.remove('page-leaving');
    });
})();
