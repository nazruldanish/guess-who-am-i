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
