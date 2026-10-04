// Round 1 HUD extra that only reads what game1.js already shows on the page: the progress track gets
// one segment per question, filled green (right), red (wrong/time up) or violet (skipped)
(function () {
    const $ = id => document.getElementById(id);
    const track = $('progressTrack');
    if (!track) return;

    // Progress segments, built from the "3 / 12" badge
    let segments = [];
    let current = -1;
    function syncProgress() {
        const match = $('questionCount').textContent.match(/(\d+)\s*\/\s*(\d+)/);
        if (!match) {
            // Second chance question: highlight the whole track
            track.classList.add('bonus');
            return;
        }
        const [index, total] = [Number(match[1]) - 1, Number(match[2])];
        if (segments.length !== total) {
            segments = Array.from({ length: total }, () => document.createElement('i'));
            track.replaceChildren(...segments);
        }
        current = index;
        segments.forEach((segment, i) => segment.classList.toggle('current', i === index));
    }
    new MutationObserver(syncProgress).observe($('questionCount'), { childList: true, characterData: true, subtree: true });
    syncProgress();

    // When the feedback bar opens, colour the current segment by the result
    new MutationObserver(() => {
        if ($('feedbackBar').hidden || !segments[current] || track.classList.contains('bonus')) return;
        const title = $('feedbackTitle').textContent;
        const skipped = title === window.i18n.t('game1.skip');
        const picked = ['answerHuman', 'answerAi'].find(id => !$(id + 'Points').hidden);
        const right = !skipped && picked && $(picked).classList.contains('result-correct');
        segments[current].classList.remove('current');
        segments[current].classList.add(skipped ? 'skipped' : right ? 'right' : 'wrong');
    }).observe($('feedbackBar'), { attributes: true, attributeFilter: ['hidden'] });
})();
