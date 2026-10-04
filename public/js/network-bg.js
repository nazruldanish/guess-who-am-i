// Moving "neural network" background for every screen: drifting nodes link up when close,
// data pulses travel along the links, and nodes near the pointer reach out to it.
// Colours come from --net-node / --net-line / --net-pulse in app.css, so the lime and dark backgrounds both work.
(function () {
    const canvas = document.getElementById('networkBg');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const LINK_DISTANCE = 150;
    const POINTER_DISTANCE = 190;
    let width = 0, height = 0, nodes = [], pulses = [], links = [];
    let colors = {};
    const pointer = { x: -9999, y: -9999 };

    function readColors() {
        const style = getComputedStyle(document.body);
        colors = {
            node: style.getPropertyValue('--net-node').trim() || '212, 251, 121',
            line: style.getPropertyValue('--net-line').trim() || '168, 136, 240',
            pulse: style.getPropertyValue('--net-pulse').trim() || '212, 251, 121'
        };
    }

    function resize() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        // Roughly one node per 15,000 px², between 30 and 110
        const count = Math.max(30, Math.min(110, Math.round(width * height / 15000)));
        nodes = Array.from({ length: count }, () => ({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - .5) * .35,
            vy: (Math.random() - .5) * .35,
            r: 1.2 + Math.random() * 1.8,
            phase: Math.random() * Math.PI * 2
        }));
        pulses = [];
    }

    function step(time) {
        ctx.clearRect(0, 0, width, height);
        links = [];

        for (const node of nodes) {
            node.x += node.vx;
            node.y += node.vy;
            if (node.x < 0 || node.x > width) node.vx *= -1;
            if (node.y < 0 || node.y > height) node.vy *= -1;
        }

        // Links between nearby nodes
        ctx.lineWidth = 1;
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const a = nodes[i], b = nodes[j];
                const dist = Math.hypot(a.x - b.x, a.y - b.y);
                if (dist > LINK_DISTANCE) continue;
                links.push([a, b]);
                ctx.strokeStyle = `rgba(${colors.line}, ${(1 - dist / LINK_DISTANCE) * .45})`;
                ctx.beginPath();
                ctx.moveTo(a.x, a.y);
                ctx.lineTo(b.x, b.y);
                ctx.stroke();
            }
            // Reach out to the pointer
            const a = nodes[i];
            const toPointer = Math.hypot(a.x - pointer.x, a.y - pointer.y);
            if (toPointer < POINTER_DISTANCE) {
                ctx.strokeStyle = `rgba(${colors.node}, ${(1 - toPointer / POINTER_DISTANCE) * .6})`;
                ctx.beginPath();
                ctx.moveTo(a.x, a.y);
                ctx.lineTo(pointer.x, pointer.y);
                ctx.stroke();
            }
        }

        // Nodes, gently breathing
        for (const node of nodes) {
            const glow = .55 + Math.sin(time / 900 + node.phase) * .35;
            ctx.fillStyle = `rgba(${colors.node}, ${glow})`;
            ctx.beginPath();
            ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
            ctx.fill();
        }

        // Now and then send a data pulse along a random link
        if (links.length && pulses.length < 14 && Math.random() < .06) {
            const [from, to] = links[Math.floor(Math.random() * links.length)];
            pulses.push({ from, to, t: 0 });
        }
        pulses = pulses.filter(pulse => {
            pulse.t += .018;
            if (pulse.t >= 1) return false;
            const x = pulse.from.x + (pulse.to.x - pulse.from.x) * pulse.t;
            const y = pulse.from.y + (pulse.to.y - pulse.from.y) * pulse.t;
            const fade = Math.sin(pulse.t * Math.PI);
            ctx.fillStyle = `rgba(${colors.pulse}, ${fade * .35})`;
            ctx.beginPath();
            ctx.arc(x, y, 7, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = `rgba(${colors.pulse}, ${fade})`;
            ctx.beginPath();
            ctx.arc(x, y, 2.4, 0, Math.PI * 2);
            ctx.fill();
            return true;
        });

        if (!reduceMotion) requestAnimationFrame(step);
    }

    readColors();
    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', event => { pointer.x = event.clientX; pointer.y = event.clientY; });
    document.addEventListener('pointerleave', () => { pointer.x = pointer.y = -9999; });
    // Still, single frame when the player prefers less motion
    requestAnimationFrame(step);
})();
