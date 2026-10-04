const test = require('node:test');
const assert = require('node:assert/strict');

process.env.SITE_PASSWORD = 'friends-only';
const { server } = require('../server');

test('SITE_PASSWORD locks every page until the password is given', async () => {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const base = `http://127.0.0.1:${server.address().port}`;
    const login = password => ({ Authorization: 'Basic ' + Buffer.from(`anyone:${password}`).toString('base64') });

    try {
        for (const url of ['/', '/pages/menu.html', '/api/leaderboard']) {
            const locked = await fetch(base + url);
            assert.equal(locked.status, 401, url);
            assert.match(locked.headers.get('www-authenticate'), /^Basic/);
            assert.equal((await fetch(base + url, { headers: login('wrong') })).status, 401, url);
            assert.equal((await fetch(base + url, { headers: login('friends-only') })).status, 200, url);
        }
    } finally {
        server.closeAllConnections();
        await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    }
});
