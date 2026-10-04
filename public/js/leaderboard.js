// Leaderboard: the server's shared board when there is one (npm start), otherwise a board kept on this device
// (e.g. on GitHub Pages, where there is no server). Both keep each player's best score, high to low.
(function () {
    const API = '../api/leaderboard';
    const STORAGE_KEY = 'gwai-leaderboard';
    const SIZE = 20;

    function loadLocal() {
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
            return Array.isArray(saved) ? saved : [];
        } catch {
            return [];
        }
    }

    function saveLocal({ name, avatar, score }) {
        const board = loadLocal();
        const existing = board.find(entry => entry.name.toLowerCase() === name.toLowerCase());
        if (existing) {
            if (score >= existing.score) Object.assign(existing, { name, avatar, score, at: Date.now() });
        } else {
            board.push({ name, avatar, score, at: Date.now() });
        }
        board.sort((a, b) => b.score - a.score || a.at - b.at);
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(board.slice(0, 100))); } catch {}
    }

    window.leaderboard = {
        async load() {
            try {
                const response = await fetch(API);
                if (response.ok) return await response.json();
            } catch {}
            return loadLocal().slice(0, SIZE);
        },
        async save(entry) {
            try {
                const response = await fetch(API, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(entry)
                });
                if (response.ok) return;
            } catch {}
            saveLocal(entry);
        }
    };
})();
