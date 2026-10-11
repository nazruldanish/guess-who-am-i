// Pixel-art avatars and power-up icons. Each avatar is still stored and passed around as its emoji
// (URL, leaderboard), so older scores keep working; any avatar element on the page
// holding one of these emoji is redrawn as a 16x16 pixel sprite. Unknown emoji (e.g. old scores) stay as text.
(function () {
    const COLORS = {
        K: '#1b1b1f', Y: '#ffcd3c', S: '#e9a21f', H: '#fff1a8', W: '#ffffff', M: '#7a1f2b', P: '#ff6f8a',
        R: '#e53935', B: '#5ec4ff', D: '#33334a', d: '#24243a', T: '#f6c690', O: '#e98a1c', C: '#f4a340',
        c: '#d9822b', G: '#b9bec7', g: '#6c7380', L: '#3ddc5a', l: '#a8f5b4',
        // Power-up icons
        U: '#5a36a3', u: '#3b1f76', N: '#d4fb79', n: '#b8e25a', A: '#2a8fd6', a: '#5bbcf2', I: '#eaf8ff', V: '#7b4fd6',
        // Results trophy
        Q: '#f5b700', q: '#c98a00', Z: '#ffe27a', E: '#8a4b2f', e: '#5c2f1c',
        // Second chance gift box
        X: '#b21f1f'
    };

    const FACE = [
        '....KKKKKKKK....',
        '..KKYYYYYYYYKK..',
        '.KYYYYYYYYYYYYK.',
        '.KYHHYYYYYYYYYK.',
        'KYHYYYYYYYYYYYYK',
        'KYYYYYYYYYYYYYYK',
        'KYYYYYYYYYYYYYYK',
        'KYYYYYYYYYYYYYYK',
        'KYYYYYYYYYYYYYYK',
        'KYYYYYYYYYYYYYYK',
        'KYYYYYYYYYYYYYYK',
        'KYYYYYYYYYYYYYSK',
        '.KSYYYYYYYYYYSK.',
        '.KSSYYYYYYYYSSK.',
        '..KKSSSSSSSSKK..',
        '....KKKKKKKK....'
    ];
    const CAT = [
        '.KK..........KK.',
        '.KPK........KPK.',
        '.KYPK......KPYK.',
        '.KYYYKKKKKKYYYK.',
        'KYYYYYYYYYYYYYYK',
        'KYYYYYYYYYYYYYYK',
        'KYYYYYYYYYYYYYYK',
        'KYYYYYYYYYYYYYYK',
        'KYYYYYYYYYYYYYYK',
        'KYYYYYYYYYYYYYYK',
        'KYYYYYYYYYYYYYYK',
        'KYYYYYYYYYYYYYSK',
        '.KSYYYYYYYYYYSK.',
        '.KSSYYYYYYYYSSK.',
        '..KKSSSSSSSSKK..',
        '....KKKKKKKK....'
    ];
    const LAPTOP = [
        '................',
        '................',
        '..KKKKKKKKKKKK..',
        '..KGGGGGGGGGGK..',
        '..KGLLLLLLLLGK..',
        '..KGLLLLLLLlGK..',
        '..KGLLLLLLlLGK..',
        '..KGLLLLLlLLGK..',
        '..KGLLLLlLLLGK..',
        '..KGLLLLLLLLGK..',
        '..KGGGGGGGGGGK..',
        '..KKKKKKKKKKKK..',
        '.KGGGGGGGGGGGGK.',
        'KGgGgGgGgGgGgGGK',
        'KKKKKKKKKKKKKKKK',
        '................'
    ];

    const ROBOT = [
        '......KKKK......',
        '......KRRK......',
        '.......KK.......',
        '..KKKKKKKKKKKK..',
        '.KGIGGGGGGGGGGK.',
        'KKGGGGGGGGGGGGKK',
        'KgGKKKKGGKKKKGgK',
        'KgGKaaKGGKaaKGgK',
        'KgGKAAKGGKAAKGgK',
        'KgGKKKKGGKKKKGgK',
        'KKGGGGGGGGGGGGKK',
        '.KGGKKKKKKKKKGK.',
        '.KGGKWKWKWKWKGK.',
        '.KGGKKKKKKKKKGK.',
        '.KggggggggggggK.',
        '..KKKKKKKKKKKK..'
    ];

    // Copy a base sprite, recolour it, then paint patches: [row, col, 'pixels'] where '_' keeps what is there
    function sprite(base, patches = [], recolor = {}) {
        const grid = base.map(row => [...row].map(ch => recolor[ch] || ch));
        for (const [row, col, pixels] of patches) {
            [...pixels].forEach((ch, i) => { if (ch !== '_' && grid[row]?.[col + i] !== undefined) grid[row][col + i] = ch; });
        }
        return grid;
    }

    const BIG_GRIN = [[9, 3, 'KKKKKKKKKK'], [10, 3, 'KWWWWWWWWK'], [11, 4, 'KMMPPMMK'], [12, 5, 'KKKKKK']];
    const HAPPY_EYES = [[5, 5, 'K'], [6, 4, 'K_K'], [5, 10, 'K'], [6, 9, 'K_K']];

    const SPRITES = {
        '😀': sprite(FACE, [[5, 5, 'K'], [6, 5, 'K'], [7, 5, 'K'], [5, 10, 'K'], [6, 10, 'K'], [7, 10, 'K'], ...BIG_GRIN]),
        '😄': sprite(FACE, [...HAPPY_EYES, ...BIG_GRIN]),
        '😘': sprite(FACE, [
            [6, 4, 'KKK'], [5, 10, 'K'], [6, 10, 'K'], [7, 10, 'K'],
            [9, 8, 'K'], [10, 7, 'K'], [11, 8, 'K'],
            [10, 9, '_KK_KK_'], [11, 9, 'KRRKRRK'], [12, 9, 'KRRRRRK'], [13, 9, '_KRRRK_'], [14, 9, '__KRK__'], [15, 9, '___K___']
        ]),
        '🙄': sprite(FACE, [
            [3, 3, '_KKK_'], [4, 3, 'KWKWK'], [5, 3, 'KWWWK'], [6, 3, '_KKK_'],
            [3, 8, '_KKK_'], [4, 8, 'KWKWK'], [5, 8, 'KWWWK'], [6, 8, '_KKK_'],
            [10, 5, 'KKKKKK']
        ]),
        '🤔': sprite(FACE, [
            // Raised left brow, flat right brow, sideways mouth and a fist under the chin
            [4, 4, 'KK'], [6, 5, 'K'], [7, 5, 'K'], [5, 9, 'KKK'], [6, 10, 'K'], [7, 10, 'K'],
            [10, 8, 'KKK'],
            [10, 2, 'KK'], [11, 1, 'KCCK'], [12, 1, 'KCCCKK'], [13, 1, 'KCCCCCK'], [14, 2, 'KccccK'], [15, 3, 'KKKK']
        ]),
        '😂': sprite(FACE, [
            ...HAPPY_EYES, ...BIG_GRIN,
            [6, 1, 'B'], [7, 0, 'BB'], [8, 0, 'BB'], [6, 14, 'B'], [7, 14, 'BB'], [8, 14, 'BB']
        ]),
        '😵': sprite(FACE, [
            [5, 4, 'K_K'], [6, 4, '_K_'], [7, 4, 'K_K'], [5, 9, 'K_K'], [6, 9, '_K_'], [7, 9, 'K_K'],
            [10, 6, '_KK_'], [11, 6, 'KMMK'], [12, 6, '_KK_']
        ]),
        '🥷': sprite(FACE, [
            [3, 1, 'RRRRRRRRRRRRRR'], [4, 1, 'RRRRRRRRRRRRRR'], [2, 14, 'R'], [1, 15, 'R'], [3, 15, 'R'],
            [6, 2, 'TTTTTTTTTTTT'], [7, 2, 'TTTTTTTTTTTT'], [8, 2, 'TTTTTTTTTTTT'],
            [6, 4, 'K'], [7, 4, 'KK'], [6, 11, 'K'], [7, 10, 'KK']
        ], { Y: 'D', H: 'D', S: 'd' }),
        '😺': sprite(CAT, [
            [4, 7, 'OO'], [5, 7, 'OO'],
            [6, 5, 'K'], [7, 5, 'K'], [6, 10, 'K'], [7, 10, 'K'], [8, 7, 'PP'],
            [8, 0, 'KK'], [8, 14, 'KK'], [9, 0, 'K'], [9, 15, 'K'],
            [9, 4, 'KKKKKKKK'], [10, 4, 'KWWWWWWK'], [11, 5, 'KPPPPK'], [12, 6, 'KKKK']
        ]),
        '😼': sprite(CAT, [
            [4, 7, 'OO'], [5, 7, 'OO'],
            [6, 4, 'KKK'], [7, 5, 'K'], [6, 9, 'KKK'], [7, 10, 'K'], [8, 7, 'PP'],
            [8, 0, 'KK'], [8, 14, 'KK'],
            [10, 6, 'KKKKK'], [9, 11, 'K']
        ], { Y: 'C', S: 'c', H: 'C' }),
        '😎': sprite(FACE, [
            // Black shades with a shine on each lens, and a cool half smile
            [5, 1, 'KKKKKKKKKKKKKK'],
            [6, 2, 'KWDDK'], [6, 9, 'KWDDK'], [7, 2, 'KDDDK'], [7, 9, 'KDDDK'], [8, 3, 'KKK'], [8, 10, 'KKK'],
            [10, 10, 'K'], [11, 5, 'KKKKK']
        ]),
        '🤖': sprite(ROBOT),
        // Retired choice: still drawn for old leaderboard scores, but no longer offered in the picker
        '💻': sprite(LAPTOP)
    };
    const RETIRED_AVATARS = ['💻'];

    function toSvg(grid) {
        let rects = '';
        grid.forEach((row, y) => {
            let x = 0;
            while (x < row.length) {
                const ch = row[x];
                let run = 1;
                while (row[x + run] === ch) run++;
                if (COLORS[ch]) rects += `<rect x="${x}" y="${y}" width="${run}" height="1" fill="${COLORS[ch]}"/>`;
                x += run;
            }
        });
        return `<svg class="pixel-sprite" viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true">${rects}</svg>`;
    }

    const SVGS = Object.fromEntries(Object.entries(SPRITES).map(([emoji, grid]) => [emoji, toSvg(grid)]));

    // The avatar choices shown in menu.js's picker
    window.AVATAR_OPTIONS = Object.keys(SVGS).filter(emoji => !RETIRED_AVATARS.includes(emoji));

    // Results-screen icons (not avatar choices): a gold trophy for a win and a sweaty smile for a miss,
    // plus the second chance gift box
    Object.assign(SVGS, {
        '🎁': toSvg(sprite([
            '................',
            '...KK......KK...',
            '..KQQK....KQQK..',
            '..KQqQK..KQqQK..',
            '...KQqQKKQqQK...',
            '.KKKKKQQQQKKKKK.',
            '.KRRRRKQQKRRRRK.',
            '.KRRRRKQQKRRRRK.',
            '.KKKKKKQQKKKKKK.',
            '..KRRRKQQKRRRK..',
            '..KRRRKQQKRRRK..',
            '..KRRRKQQKRRRK..',
            '..KXRRKQqKRRXK..',
            '..KXXXKqqKXXXK..',
            '..KKKKKKKKKKKK..',
            '................'
        ], [[6, 2, 'W'], [9, 3, 'W']])),
        '🏆': toSvg(sprite([
            '................',
            '...KKKKKKKKKK...',
            '.KKKZQQQQQQqKKK.',
            'K..KZQQQQQQqK..K',
            'K..KZQQQQQQqK..K',
            '.K.KZQQQQQQqK.K.',
            '..KKZQQQQQQqKK..',
            '...KZQQQQQqqK...',
            '....KQQQQqqK....',
            '.....KQQqqK.....',
            '......KQqK......',
            '......KQqK......',
            '.....KKqqKK.....',
            '....KEEEEEEK....',
            '....KeeeeeeK....',
            '....KKKKKKKK....'
        ], [[3, 6, 'W'], [4, 6, 'W'], [13, 6, 'QQQQ']])),
        '😅': toSvg(sprite(FACE, [...HAPPY_EYES, ...BIG_GRIN, [1, 13, 'B'], [2, 12, 'BWB'], [3, 12, 'BBB'], [4, 13, 'B']]))
    });

    // ---------- Power-up icons: pixel versions of the abilities.js icons, same colours ----------
    const EMPTY = Array(16).fill('................');
    const arrow = (col, fill) => [
        [3, col, 'KK'], [4, col, `K${fill}K`], [5, col, `K${fill}${fill}K`], [6, col, `K${fill}${fill}${fill}K`],
        [7, col, `K${fill}${fill}${fill}${fill}K`], [8, col, `K${fill}${fill}${fill}${fill}K`], [9, col, `K${fill}${fill}${fill}K`],
        [10, col, `K${fill}${fill}K`], [11, col, `K${fill}K`], [12, col, 'KK']
    ];
    const POWER_SPRITES = {
        // Two-tone purple shield
        firewall: sprite([
            '................',
            '.KKKKKKKKKKKKKK.',
            '.KWVVVVVUUUUUUK.',
            '.KVVVVVVUUUUUUK.',
            '.KVVVVVVUUUUUUK.',
            '.KVVVVVVUUUUUUK.',
            '.KVVVVVVUUUUUUK.',
            '.KVVVVVVUUUUUUK.',
            '.KVVVVVVUUUUUUK.',
            '.KVVVVVVUUUUUUK.',
            '..KVVVVVUUUUUK..',
            '..KVVVVVUUUUUK..',
            '...KVVVVUUUUK...',
            '....KVVVUUUK....',
            '.....KKVUKK.....',
            '.......KK.......'
        ]),
        // Icy stopwatch with a snowflake on the face
        timeFreeze: sprite([
            '......KKKK......',
            '......KAAK......',
            '....KKKKKKKK....',
            '...KaaaaaaaaK...',
            '..KaaIIIIIIaaK..',
            '.KaaIIIIIIIIaaK.',
            '.KaIIIIIIIIIIaK.',
            '.KaIIIIIIIIIIaK.',
            '.KaIIIIIIIIIIaK.',
            '.KaIIIIIIIIIIaK.',
            '.KaIIIIIIIIIIaK.',
            '.KaaIIIIIIIIaaK.',
            '..KaaIIIIIIaaK..',
            '...KaaaaaaaaK...',
            '....KKKKKKKK....',
            '................'
        ], [
            [5, 7, 'AA'], [6, 7, 'AA'], [7, 7, 'AA'], [8, 4, 'AAAAAAAA'], [9, 7, 'AA'], [10, 7, 'AA'], [11, 7, 'AA'],
            [6, 5, 'A'], [6, 10, 'A'], [7, 6, 'A'], [7, 9, 'A'], [9, 6, 'A'], [9, 9, 'A'], [10, 5, 'A'], [10, 10, 'A']
        ]),
        // Red lightning bolt with purple speed sparks
        overclock: sprite([
            '.........KKKK...',
            '........KRRK....',
            '.......KRRK.....',
            '......KRRK......',
            '.....KRRK.......',
            '....KRRKKKKK....',
            '...KRRRRRRRK....',
            '...KKKKKRRK.....',
            '.......KRRK.....',
            '......KRRK......',
            '.....KRRK.......',
            '....KRRK........',
            '...KRK..........',
            '..KK............',
            '................',
            '................'
        ], [[1, 14, 'V'], [2, 13, 'V'], [4, 12, 'VV'], [11, 10, 'VV'], [12, 11, 'V'], [9, 1, 'VV']]),
        // Lime skip-forward arrows with a purple end bar
        override: sprite(EMPTY, [
            ...arrow(1, 'N'), ...arrow(6, 'n'),
            [3, 12, 'KKK'], [4, 12, 'KuK'], [5, 12, 'KuK'], [6, 12, 'KuK'], [7, 12, 'KuK'], [8, 12, 'KuK'],
            [9, 12, 'KuK'], [10, 12, 'KuK'], [11, 12, 'KuK'], [12, 12, 'KKK']
        ])
    };
    const POWER_SVGS = Object.fromEntries(Object.entries(POWER_SPRITES).map(([id, grid]) => [id, toSvg(grid)]));

    // Swap abilities.js's icon maker for the pixel one (must load after abilities.js, before menu.js / game1.js)
    const createSvgIcon = window.createAbilityIcon;
    window.createAbilityIcon = function (id) {
        if (!POWER_SVGS[id]) return createSvgIcon(id);
        const icon = document.createElement('span');
        icon.className = 'ability-icon pixel-icon';
        icon.setAttribute('aria-hidden', 'true');
        icon.innerHTML = POWER_SVGS[id];
        return icon;
    };

    const AVATAR_SELECTOR = '#avatarButton, .avatar-option, #playerAvatar, .lb-avatar, .msg-avatar, .results-icon, .chance-pop-gift';
    function upgrade(root = document) {
        for (const el of root.querySelectorAll(AVATAR_SELECTOR)) {
            const emoji = el.textContent.trim();
            if (!SVGS[emoji]) continue;
            el.innerHTML = SVGS[emoji];
            el.classList.add('pixel-avatar');
            el.dataset.emoji = emoji;
        }
    }

    // Avatars are (re)written by menu.js, game1.js and the leaderboard at any time, so watch for them
    function start() {
        upgrade();
        new MutationObserver(() => upgrade()).observe(document.body, { childList: true, subtree: true, characterData: true });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
    else start();
})();
