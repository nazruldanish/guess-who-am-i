// English / Bahasa Melayu text for every screen. The chosen language is saved on this device.
// In the HTML, data-i18n="key" sets an element's text and data-i18n-attr="attr:key; attr:key" sets attributes.
(function () {
    const STORAGE_KEY = 'gwai-lang';
    const LANGUAGES = ['en', 'ms'];

    const STRINGS = {
        en: {
            'lang.en': 'EN',
            'lang.ms': 'BM',
            'common.close': 'Close',
            'common.back': 'Back',
            'common.fullscreen': 'Full screen',
            'common.exitFullscreen': 'Exit full screen',
            'common.backToStart': 'Guess Who Am I? (back to start)',
            'common.human': 'Human',
            'common.ai': 'AI',

            'menu.join': 'Join the game',
            'menu.changeAvatar': 'Change your avatar',
            'menu.avatarHint': 'Tap to change your avatar',
            'menu.nickname': 'Your nickname',
            'menu.nicknamePlaceholder': 'Enter nickname',
            'menu.clearName': 'Clear name',
            'menu.nameError': 'Oops! Type a nickname first 😊',
            'menu.play': "Let's play!",
            'menu.leaderboard': 'Leaderboard',
            'menu.settings': 'Settings',
            'menu.language': 'Language',
            'menu.eyebrow': 'Human vs AI · Detection game',
            'menu.tagline': 'Some are real. Some are machine.',
            'menu.taglineStrong': 'Can you tell which is which?',
            'menu.round1Label': 'Round 01',
            'menu.round1Text': 'Spot the AI in texts, pictures and videos',

            'leaderboard.eyebrow': 'Top detectives',
            'leaderboard.empty': 'No scores yet. Be the first!',
            'leaderboard.error': 'Could not load the leaderboard. Try again later.',

            // Settings rows show line icons next to these
            'settings.sfxLabel': 'Sound effects',
            'settings.musicLabel': 'Music',

            'loadout.title': 'Choose 2 power-ups',
            'loadout.intro': 'Each power-up works one time in round 1. Choose wisely!',
            'loadout.count': '{n} of 2 selected',
            'loadout.start': 'Start',

            'tips.title': 'Tips for Round 1',
            'tips.readTitle': "Don't forget to read the title to understand the situation.",
            'tips.text': 'Read the sentences carefully. Is this how people usually talk?',
            'tips.media': 'Watch the lighting and movement in pictures and videos. Some might give the answer away!',
            'tips.speed': 'Be quick! The faster you answer correctly, the more points you get. Texts are worth up to 100, pictures 125 and videos 150.',
            'tips.ready': "I'm ready!",

            'ability.firewall.name': 'Shield',
            'ability.firewall.description': 'Guess wrong? Keep your streak for this question',
            'ability.firewall.note': 'Your streak is protected this question',
            'ability.timeFreeze.name': 'Time Freeze',
            'ability.timeFreeze.description': 'Stop the timer so you can take your time',
            'ability.timeFreeze.note': 'The timer is frozen. Take your time!',
            'ability.overclock.name': 'All In',
            'ability.overclock.description': 'Get double points if you are right. If wrong, lose your streak',
            'ability.overclock.note': 'Double points if you get it right!',
            'ability.override.name': 'Skip',
            'ability.override.description': 'Skip this question and get 100 points but your streak ends',
            'ability.override.note': 'Skipping this question',
            'ability.on': ' (on)',
            'ability.used': ' (used)',
            'ability.activated': '{name} activated!',

            'game1.title': 'Round 1 | Guess Who Am I?',
            'game1.streakTitle': 'Streak: answers right in a row',
            'game1.bonusTitle': 'Bonus multiplier: 3 in a row = 1.5x, 5 in a row = 2x',
            'game1.bonus': 'Bonus',
            'game1.score': 'Score',
            'game1.timeLeft': 'Time left',
            'game1.enlarge': 'Enlarge',
            'game1.clickToEnlarge': 'Click to enlarge',
            'game1.enlargedView': 'Enlarged view',
            'game1.powerUps': 'Power-ups',
            'game1.roundTag': 'Round 1 · Quiz',
            'game1.text.label': 'Text',
            'game1.situation': 'Situation: {topic}',
            'game1.text.heading': 'Who wrote this?',
            'game1.image.label': 'Picture',
            'game1.image.heading': 'Who made this picture?',
            'game1.image.round': 'Picture clue',
            'game1.video.label': 'Video',
            'game1.video.heading': 'Who made this video?',
            'game1.text.ai': 'This was written by AI.',
            'game1.text.human': 'This was written by a person.',
            'game1.image.ai': 'This picture was made by AI.',
            'game1.image.human': 'This is a real photo taken by a person.',
            'game1.video.ai': 'This video was made by AI.',
            'game1.video.human': 'This is a real video filmed by a person.',
            'game1.correct': 'Correct!',
            'game1.wrong': 'Oops!',
            'game1.timeout': "Time's up!",
            'game1.skip': 'Skipped!',
            'game1.skipped': 'You skipped this one. Your streak has ended.',
            'game1.inARow': ' {n} in a row!',
            'game1.firewallKept': ' {name} kept your streak!',
            'game1.itWas': 'It was {answer}. ',
            'game1.resultsIn': 'Results in',
            'game1.secondChanceIn': 'Second chance in',
            'game1.nextQuestionIn': 'Next question in',
            'game1.seeResults': 'See results',
            'game1.secondChanceButton': 'Second chance',
            'game1.nextQuestion': 'Next question',
            'game1.secondChance': 'Second chance!',
            'game1.secondChanceNote': 'Get this one right for +{n} bonus points',
            'game1.bonusBadge': '🎁 Bonus',
            'game1.bonusWon': 'Bonus won! ',
            'game1.roundComplete': 'Round 1 complete',
            'game1.points': 'Points',
            'game1.correctCount': 'Correct',
            'game1.missed': 'Missed',
            'game1.continue': 'Back to menu',
            'game1.perfect': 'Perfect score victory',
            'game1.stars0': 'Nice try!',
            'game1.stars1': 'Good job!',
            'game1.stars2': 'Great job!',
            'game1.stars3': 'Amazing!'
        },
        ms: {
            'lang.en': 'EN',
            'lang.ms': 'BM',
            'common.close': 'Tutup',
            'common.back': 'Kembali',
            'common.fullscreen': 'Skrin penuh',
            'common.exitFullscreen': 'Keluar skrin penuh',
            'common.backToStart': 'Guess Who Am I? (kembali ke menu)',
            'common.human': 'Manusia',
            'common.ai': 'AI',

            'menu.join': 'Sertai permainan',
            'menu.changeAvatar': 'Tukar avatar anda',
            'menu.avatarHint': 'Tekan untuk tukar avatar',
            'menu.nickname': 'Nama panggilan anda',
            'menu.nicknamePlaceholder': 'Masukkan nama panggilan',
            'menu.clearName': 'Padam nama',
            'menu.nameError': 'Alamak! Taip nama panggilan dulu 😊',
            'menu.play': 'Jom main!',
            'menu.leaderboard': 'Papan Markah',
            'menu.settings': 'Tetapan',
            'menu.language': 'Bahasa',
            'menu.eyebrow': 'Manusia vs AI · Permainan detektif',
            'menu.tagline': 'Ada yang manusia. Ada yang mesin.',
            'menu.taglineStrong': 'Boleh anda bezakan?',
            'menu.round1Label': 'Pusingan 01',
            'menu.round1Text': 'Cari AI dalam teks, gambar dan video',

            'leaderboard.eyebrow': 'Detektif terhebat',
            'leaderboard.empty': 'Belum ada markah lagi. Jadilah yang pertama!',
            'leaderboard.error': 'Papan markah tidak dapat dimuatkan. Cuba lagi nanti.',

            // Settings rows show line icons next to these
            'settings.sfxLabel': 'Kesan bunyi',
            'settings.musicLabel': 'Muzik',

            'loadout.title': 'Pilih 2 kuasa khas',
            'loadout.intro': 'Setiap kuasa khas hanya boleh digunakan sekali dalam pusingan 1. Pilih dengan bijak!',
            'loadout.count': '{n} daripada 2 dipilih',
            'loadout.start': 'Mula',

            'tips.title': 'Tip untuk Pusingan 1',
            'tips.readTitle': 'Baca tajuk untuk fahamkan situasi.',
            'tips.text': 'Baca ayat dengan teliti. Adakah cara orang bercakap selalunya begitu?',
            'tips.media': 'Perhatikan pencahayaan dan pergerakan bagi gambar dan video. Beberapa media mungkin beri jawapan terus!',
            'tips.speed': 'Cepat! Lebih cepat anda jawab dengan betul, lebih banyak markah anda dapat. Teks bernilai sehingga 100, gambar 125 dan video 150.',
            'tips.ready': 'Saya sedia!',

            'ability.firewall.name': 'Perisai',
            'ability.firewall.description': 'Salah teka? Kekalkan streak anda untuk soalan ini',
            'ability.firewall.note': 'Streak anda dilindungi untuk soalan ini',
            'ability.timeFreeze.name': 'Beku Masa',
            'ability.timeFreeze.description': 'Hentikan masa untuk anda berfikir dengan tenang',
            'ability.timeFreeze.note': 'Pemasa dibekukan. Ambil masa anda!',
            'ability.overclock.name': 'Markah Ganda',
            'ability.overclock.description': 'Dapatkan markah berganda jika betul. Jika salah, streak anda hilang',
            'ability.overclock.note': 'Markah berganda jika anda jawab betul!',
            'ability.override.name': 'Langkau',
            'ability.override.description': 'Langkau soalan ini dan dapat 100 markah tetapi streak anda hilang',
            'ability.override.note': 'Soalan ini dilangkau',
            'ability.on': ' (aktif)',
            'ability.used': ' (sudah guna)',
            'ability.activated': '{name} diaktifkan!',

            'game1.title': 'Pusingan 1 | Guess Who Am I?',
            'game1.streakTitle': 'Streak: jawapan betul berturut-turut',
            'game1.bonusTitle': 'Pengganda bonus: 3 berturut-turut = 1.5x, 5 berturut-turut = 2x',
            'game1.bonus': 'Bonus',
            'game1.score': 'Markah',
            'game1.timeLeft': 'Masa berbaki',
            'game1.enlarge': 'Besarkan',
            'game1.clickToEnlarge': 'Klik untuk besarkan',
            'game1.enlargedView': 'Paparan besar',
            'game1.powerUps': 'Kuasa khas',
            'game1.roundTag': 'Pusingan 1 · Kuiz',
            'game1.text.label': 'Teks',
            'game1.situation': 'Situasi: {topic}',
            'game1.text.heading': 'Siapa yang tulis ini?',
            'game1.image.label': 'Gambar',
            'game1.image.heading': 'Siapa yang hasilkan gambar ini?',
            'game1.image.round': 'Petunjuk gambar',
            'game1.video.label': 'Video',
            'game1.video.heading': 'Siapa yang hasilkan video ini?',
            'game1.text.ai': 'Ini ditulis oleh AI.',
            'game1.text.human': 'Ini ditulis oleh manusia.',
            'game1.image.ai': 'Gambar ini dihasilkan oleh AI.',
            'game1.image.human': 'Ini gambar sebenar yang diambil oleh manusia.',
            'game1.video.ai': 'Video ini dihasilkan oleh AI.',
            'game1.video.human': 'Ini video sebenar yang dirakam oleh manusia.',
            'game1.correct': 'Betul!',
            'game1.wrong': 'Alamak!',
            'game1.timeout': 'Masa tamat!',
            'game1.skip': 'Dilangkau!',
            'game1.skipped': 'Anda langkau soalan ini. Streak anda sudah tamat.',
            'game1.inARow': ' {n} berturut-turut!',
            'game1.firewallKept': ' {name} kekalkan streak anda!',
            'game1.itWas': 'Jawapannya {answer}. ',
            'game1.resultsIn': 'Keputusan dalam',
            'game1.secondChanceIn': 'Peluang kedua dalam',
            'game1.nextQuestionIn': 'Soalan seterusnya dalam',
            'game1.seeResults': 'Lihat keputusan',
            'game1.secondChanceButton': 'Peluang kedua',
            'game1.nextQuestion': 'Soalan seterusnya',
            'game1.secondChance': 'Peluang kedua!',
            'game1.secondChanceNote': 'Jawab dengan betul untuk +{n} markah bonus',
            'game1.bonusBadge': '🎁 Bonus',
            'game1.bonusWon': 'Bonus dimenangi! ',
            'game1.roundComplete': 'Pusingan 1 selesai',
            'game1.points': 'Markah',
            'game1.correctCount': 'Betul',
            'game1.missed': 'Salah',
            'game1.continue': 'Kembali ke menu',
            'game1.perfect': 'Markah penuh!',
            'game1.stars0': 'Cubaan yang baik!',
            'game1.stars1': 'Syabas!',
            'game1.stars2': 'Hebat!',
            'game1.stars3': 'Luar biasa!'
        }
    };

    let lang = 'en';
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (LANGUAGES.includes(saved)) lang = saved;
    } catch {}

    const listeners = [];

    function t(key, vars = {}) {
        const text = STRINGS[lang][key] ?? STRINGS.en[key] ?? key;
        return text.replace(/\{(\w+)\}/g, (match, name) => (name in vars ? vars[name] : match));
    }

    function apply(root = document) {
        if (!root.querySelectorAll) return;
        if (root.documentElement) root.documentElement.lang = lang;
        for (const element of root.querySelectorAll('[data-i18n]')) {
            element.textContent = t(element.dataset.i18n);
        }
        for (const element of root.querySelectorAll('[data-i18n-attr]')) {
            for (const pair of element.dataset.i18nAttr.split(';')) {
                const [attr, key] = pair.split(':').map(part => part.trim());
                if (attr && key) element.setAttribute(attr, t(key));
            }
        }
        for (const button of root.querySelectorAll('[data-lang-option]')) {
            button.setAttribute('aria-pressed', button.dataset.langOption === lang);
        }
    }

    function setLang(next) {
        if (!LANGUAGES.includes(next) || next === lang) return;
        lang = next;
        try { localStorage.setItem(STORAGE_KEY, lang); } catch {}
        apply();
        for (const listener of listeners) listener(lang);
    }

    window.i18n = {
        get lang() { return lang; },
        t,
        apply,
        setLang,
        onChange(listener) { listeners.push(listener); }
    };

    // Any EN / BM switch on the page
    if (typeof document !== 'undefined' && document.addEventListener) {
        document.addEventListener('click', event => {
            const button = event.target.closest?.('[data-lang-option]');
            if (button) setLang(button.dataset.langOption);
        });
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => apply());
        else apply();
    }
})();
