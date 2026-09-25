const test = require('node:test');
const assert = require('node:assert/strict');
const { server } = require('../server');

test('organized pages and assets load while old page URLs redirect', async () => {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const base = `http://127.0.0.1:${server.address().port}`;

    try {
        for (const url of [
            '/pages/menu.html',
            '/pages/game1.html',
            '/pages/chat.html',
            '/admin/admin.html',
            '/css/app.css',
            '/css/chat.css',
            '/css/admin.css',
            '/js/abilities.js',
            '/js/menu.js',
            '/js/game1.js',
            '/js/chat.js',
            '/js/admin.js'
        ]) {
            const response = await fetch(base + url);
            assert.equal(response.status, 200, url);
        }

        const oldGameUrl = await fetch(base + '/game1.html?player=Tester', { redirect: 'manual' });
        assert.equal(oldGameUrl.status, 302);
        assert.equal(oldGameUrl.headers.get('location'), '/pages/game1.html?player=Tester');

        const oldAdminUrl = await fetch(base + '/admin.html', { redirect: 'manual' });
        assert.equal(oldAdminUrl.headers.get('location'), '/admin/admin.html');
    } finally {
        server.closeAllConnections();
        await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    }
});
