const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'leaderboard-')), 'leaderboard.json');
process.env.LEADERBOARD_FILE = file;
const { server } = require('../server');

test('leaderboard keeps each player\'s best score, sorted high to low', async () => {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const base = `http://127.0.0.1:${server.address().port}`;
    const post = body => fetch(base + '/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });

    try {
        assert.deepEqual(await (await fetch(base + '/api/leaderboard')).json(), []);

        await post({ name: 'Ali', avatar: '🦊', score: 800 });
        await post({ name: 'Mei', avatar: '🐼', score: 1200 });
        await post({ name: 'ali', avatar: '🐯', score: 500 });
        await post({ name: 'ALI', avatar: '🐸', score: 1500 });
        assert.equal((await post({ name: '', score: 10 })).status, 400);
        assert.equal((await post({ name: 'Bad', score: 'lots' })).status, 400);

        const board = (await (await fetch(base + '/api/leaderboard')).json()).map(({ name, avatar, score }) => ({ name, avatar, score }));
        assert.deepEqual(board, [
            { name: 'ALI', avatar: '🐸', score: 1500 },
            { name: 'Mei', avatar: '🐼', score: 1200 }
        ]);
        assert.equal(JSON.parse(fs.readFileSync(file, 'utf8')).length, 2);
    } finally {
        server.closeAllConnections();
        await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    }
});

test('without a server (GitHub Pages) the leaderboard is kept on the device', async () => {
    const vm = require('node:vm');
    const store = new Map();
    const window = {};
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../public/js/leaderboard.js'), 'utf8'), {
        window,
        fetch: async () => ({ ok: false, status: 404 }),
        localStorage: { getItem: key => store.get(key) ?? null, setItem: (key, value) => store.set(key, value) },
        Date
    });

    await window.leaderboard.save({ name: 'Mei', avatar: '🐼', score: 1200 });
    await window.leaderboard.save({ name: 'ali', avatar: '🐯', score: 500 });
    await window.leaderboard.save({ name: 'ALI', avatar: '🐸', score: 1500 });
    await window.leaderboard.save({ name: 'Mei', avatar: '🐼', score: 100 });
    const board = JSON.parse(JSON.stringify(await window.leaderboard.load())).map(({ name, score }) => ({ name, score }));
    assert.deepEqual(board, [{ name: 'ALI', score: 1500 }, { name: 'Mei', score: 1200 }]);
});

test('with a Supabase key every device shares one online board', async () => {
    const vm = require('node:vm');
    const requests = [];
    const window = { LEADERBOARD_CONFIG: { url: 'https://example.supabase.co', key: 'sb_publishable_test' } };
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../public/js/leaderboard.js'), 'utf8'), {
        window,
        fetch: async (url, options = {}) => {
            requests.push({ url, method: options.method || 'GET', apikey: options.headers?.apikey, body: options.body && JSON.parse(options.body) });
            return { ok: true, json: async () => [{ name: 'Mei', avatar: '🐼', score: 1200 }] };
        },
        localStorage: { getItem: () => null, setItem: () => assert.fail('should not fall back to the device board') },
        Date
    });

    await window.leaderboard.save({ name: 'Mei', avatar: '🐼', score: 1200 });
    const board = JSON.parse(JSON.stringify(await window.leaderboard.load()));
    assert.deepEqual(board, [{ name: 'Mei', avatar: '🐼', score: 1200 }]);
    assert.deepEqual(JSON.parse(JSON.stringify(requests)), [
        { url: 'https://example.supabase.co/rest/v1/rpc/submit_score', method: 'POST', apikey: 'sb_publishable_test', body: { p_name: 'Mei', p_avatar: '🐼', p_score: 1200 } },
        { url: 'https://example.supabase.co/rest/v1/leaderboard?select=name,avatar,score&order=score.desc,at.asc&limit=20', method: 'GET', apikey: 'sb_publishable_test' }
    ]);
});
