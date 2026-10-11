// Leaderboard: the online Supabase board when leaderboard-config.js has a key (shared by every device), else the
// server's board when there is one (npm start), otherwise a board kept on this device. All keep each player's
// best score, high to low, and the device board is the fallback whenever the shared one can't be reached.
(function () {
    const API = '../api/leaderboard';
    const config = window.LEADERBOARD_CONFIG?.url && window.LEADERBOARD_CONFIG?.key ? window.LEADERBOARD_CONFIG : null;
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

    function loadShared() {
        if (config) {
            return fetch(`${config.url}/rest/v1/leaderboard?select=name,avatar,score&order=score.desc,at.asc&limit=${SIZE}`, {
                headers: { apikey: config.key }
            });
        }
        return fetch(API);
    }

    function saveShared(entry) {
        if (config) {
            return fetch(`${config.url}/rest/v1/rpc/submit_score`, {
                method: 'POST',
                headers: { apikey: config.key, 'Content-Type': 'application/json' },
                body: JSON.stringify({ p_name: entry.name, p_avatar: entry.avatar, p_score: entry.score })
            });
        }
        return fetch(API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(entry)
        });
    }

    window.leaderboard = {
        async load() {
            try {
                const response = await loadShared();
                if (response.ok) return await response.json();
            } catch {}
            return loadLocal().slice(0, SIZE);
        },
        async save(entry) {
            try {
                const response = await saveShared(entry);
                if (response.ok) return;
            } catch {}
            saveLocal(entry);
        }
    };
})();
