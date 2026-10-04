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
            '/css/app.css',
            '/js/i18n.js',
            '/js/abilities.js',
            '/js/sfx.js',
            '/js/fullscreen.js',
            '/js/menu.js',
            '/js/game1.js',
            '/js/music.js',
            '/js/settings.js',
            '/assets/music/menu.mp3',
            '/assets/music/game1.mp3',
            '/js/game1-media.js'
        ]) {
            const response = await fetch(base + url);
            assert.equal(response.status, 200, url);
        }

        const mediaScript = await (await fetch(base + '/js/game1-media.js')).text();
        const media = JSON.parse(mediaScript.match(/window.GAME1_MEDIA = (.*);/)[1]);
        for (const type of ['image', 'video']) {
            for (const source of ['ai', 'human']) {
                assert.ok(media[type][source].length > 0, `${source} ${type} files listed`);
                const { src, label } = media[type][source][0];
                assert.ok(label, `${src} has a label`);
                const response = await fetch(base + src, { method: 'HEAD' });
                assert.equal(response.status, 200, src);
            }
        }
        for (const source of ['ai', 'human']) {
            assert.ok(media.text.en[source].length > 0 && media.text.en[source].every(clue => clue.text && clue.label), `${source} texts listed`);
        }

        const oldGameUrl = await fetch(base + '/game1.html?player=Tester', { redirect: 'manual' });
        assert.equal(oldGameUrl.status, 302);
        assert.equal(oldGameUrl.headers.get('location'), '/pages/game1.html?player=Tester');
    } finally {
        server.closeAllConnections();
        await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    }
});
