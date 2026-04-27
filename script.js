// =============================================================
//  Edit your message here. Use blank lines for paragraph breaks.
// =============================================================
const LETTER_MESSAGE = `สวัสดี,

เรียนจบแล้ว เย้ๆๆ ถึงจะจบมาสักพักแล้วก้เถอะนะ เห็นตั้งแต่นั่งอ่านหนังสือทุกวัน บ่นท้อบ่นเหนื่อยตลอด สรุปก็กลายเป็นพยาบาลเต้มตัวแล้ว เก่งมาก

เค้าตั้งใจซื้อ Apple Watch มาให้เอาไปใช้ใส่ทำงานด้วย!! ส่วนดอกไม้ก้ตั้งใจเลือกมากๆ ขอให้ตัวชอบนะ อิอิ

ขอให้ได้กินของอร่อยเยอะๆ บาบิตัวอ้วนๆ ตั้งใจทำงานนะ เค้าจะคอย support ตัวตลอด จะคอยชมว่า เก่งมาก อีกเยอะๆเลยยยย

อยู่ด้วยกันไปนานๆนะ อิอิ`;

// =============================================================
//  Countdown gate — page is locked until Apr 28, 15:00 Bangkok (UTC+7)
// =============================================================
const REVEAL_AT = new Date("2026-04-28T15:00:00+07:00").getTime();

const gateEl = document.getElementById("gate");
const cdDays = document.getElementById("cdDays");
const cdHours = document.getElementById("cdHours");
const cdMins = document.getElementById("cdMins");
const cdSecs = document.getElementById("cdSecs");

function pad2(n) { return n < 10 ? "0" + n : "" + n; }

let gateTimer = null;
function tickGate() {
    const remaining = REVEAL_AT - Date.now();
    if (remaining <= 0) {
        cdDays.textContent = cdHours.textContent = cdMins.textContent = cdSecs.textContent = "00";
        unlockPage();
        return;
    }
    const totalSec = Math.floor(remaining / 1000);
    const days = Math.floor(totalSec / 86400);
    const hours = Math.floor((totalSec % 86400) / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    cdDays.textContent = pad2(days);
    cdHours.textContent = pad2(hours);
    cdMins.textContent = pad2(mins);
    cdSecs.textContent = pad2(secs);
}

function unlockPage() {
    if (gateTimer) { clearInterval(gateTimer); gateTimer = null; }
    if (gateEl) gateEl.classList.add("hidden");
    document.body.classList.remove("locked");
}

if (Date.now() >= REVEAL_AT) {
    // Already past the reveal time — never show the gate.
    if (gateEl) gateEl.remove();
} else {
    document.body.classList.add("locked");
    tickGate();
    gateTimer = setInterval(tickGate, 1000);
}

// =============================================================
//  Envelope open
// =============================================================
const envelope = document.getElementById("envelope");
const hint = document.getElementById("hint");
const scrollCue = document.getElementById("scrollCue");

let opened = false;

function openEnvelope() {
    if (opened) return;
    opened = true;
    envelope.classList.add("open");
    hint.classList.add("hidden");
    burstConfetti();
    setTimeout(() => scrollCue.classList.add("visible"), 1600);
}

envelope.addEventListener("click", openEnvelope);
envelope.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openEnvelope();
    }
});

// =============================================================
//  Reveal cards on scroll + trigger typewriter for letter card
// =============================================================
const letterBody = document.getElementById("letterBody");
let typingStarted = false;
let typingTimer = null;

const revealObserver = new IntersectionObserver(
    (entries) => {
        for (const e of entries) {
            if (e.isIntersecting) {
                e.target.classList.add("in-view");
                if (e.target.classList.contains("card-letter") && !typingStarted) {
                    typingStarted = true;
                    setTimeout(typewriter, 700);
                }
            }
        }
    },
    { threshold: 0.25 }
);

document.querySelectorAll("[data-reveal]").forEach((el) => revealObserver.observe(el));

function typewriter() {
    const text = LETTER_MESSAGE;
    letterBody.innerHTML = "";
    const cursor = document.createElement("span");
    cursor.className = "cursor";
    letterBody.appendChild(cursor);

    let i = 0;
    const step = () => {
        if (i < text.length) {
            const ch = text[i++];
            cursor.insertAdjacentText("beforebegin", ch);
            const delay = ch === "\n" ? 220 : ch === "." || ch === "," ? 90 : 28;
            typingTimer = setTimeout(step, delay);
        } else {
            cursor.remove();
        }
    };
    step();
}

// =============================================================
//  Rockets — spawn at random intervals, fly in random directions
//  The "rocket" is a portrait sticker that stays UPRIGHT, with a
//  flickering flame at her feet that trails opposite to motion.
// =============================================================
const rocketLayer = document.getElementById("rocketLayer");

// Stickers are auto-discovered from the sitcker/ folder. Just drop new files
// named 3.webp, 4.png, 5.jpg, etc. and they'll be picked up on next page load.
let ROCKET_FRAMES = [];

const STICKER_DIR = "sitcker";
const STICKER_EXTS = ["webp", "png", "jpg", "jpeg", "gif"];
const STICKER_MAX_INDEX = 30;          // probe 1..30
const STICKER_MISS_TOLERANCE = 3;      // stop after this many consecutive missing numbers

function probeImage(url) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = url;
    });
}

async function discoverStickers() {
    const found = [];
    let misses = 0;
    for (let n = 1; n <= STICKER_MAX_INDEX; n++) {
        let hit = null;
        for (const ext of STICKER_EXTS) {
            const url = `${STICKER_DIR}/${n}.${ext}`;
            if (await probeImage(url)) { hit = url; break; }
        }
        if (hit) {
            found.push(hit);
            misses = 0;
        } else {
            misses++;
            if (found.length > 0 && misses >= STICKER_MISS_TOLERANCE) break;
        }
    }
    return found;
}

const MAX_ROCKETS = 3;
let activeRockets = 0;

function rand(min, max) { return Math.random() * (max - min) + min; }

function spawnRocket() {
    if (!rocketLayer) return;
    if (activeRockets >= MAX_ROCKETS) return;
    if (ROCKET_FRAMES.length === 0) return;

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const size = rand(70, 140);
    const margin = size + 80;

    // Pick a random entry edge, then a random exit edge that's different.
    const edges = ["left", "right", "top", "bottom"];
    const fromEdge = edges[Math.floor(Math.random() * edges.length)];
    let toEdge = edges[Math.floor(Math.random() * edges.length)];
    while (toEdge === fromEdge) toEdge = edges[Math.floor(Math.random() * edges.length)];

    const pickPoint = (edge) => {
        switch (edge) {
            case "left":   return { x: -margin,        y: rand(0, vh) };
            case "right":  return { x: vw + margin,    y: rand(0, vh) };
            case "top":    return { x: rand(0, vw),    y: -margin };
            case "bottom": return { x: rand(0, vw),    y: vh + margin };
        }
    };

    const start = pickPoint(fromEdge);
    const end = pickPoint(toEdge);

    // Travel direction in degrees (CSS: 0=right, 90=down, 180=left, -90=up).
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const travelDeg = Math.atan2(dy, dx) * (180 / Math.PI);

    // Flame anchor is at her feet and naturally points DOWN (90deg).
    // We want it to point opposite to travel direction (travelDeg + 180).
    // So rotate the flame element by: (travelDeg + 180) - 90 = travelDeg + 90.
    const flameAngle = travelDeg + 90;

    // Build the rocket DOM
    const rocket = document.createElement("div");
    rocket.className = "rocket";
    rocket.style.width = size + "px";

    const flame = document.createElement("div");
    flame.className = "rocket-flame";
    flame.style.setProperty("--flame-angle", flameAngle + "deg");
    flame.innerHTML =
        '<div class="flame outer"></div>' +
        '<div class="flame inner"></div>' +
        '<div class="flame core"></div>';

    const img = document.createElement("img");
    img.className = "rocket-body";
    img.src = ROCKET_FRAMES[Math.floor(Math.random() * ROCKET_FRAMES.length)];
    img.alt = "";

    rocket.appendChild(flame);
    rocket.appendChild(img);
    rocketLayer.appendChild(rocket);

    // Animate position with Web Animations API
    const duration = rand(8000, 14000);
    const anim = rocket.animate(
        [
            { transform: `translate3d(${start.x}px, ${start.y}px, 0)` },
            { transform: `translate3d(${end.x}px, ${end.y}px, 0)` },
        ],
        { duration, easing: "linear", fill: "forwards" }
    );

    activeRockets++;
    anim.onfinish = () => {
        rocket.remove();
        activeRockets--;
    };
}

function scheduleNextRocket() {
    const delay = rand(1500, 4500);
    setTimeout(() => {
        spawnRocket();
        scheduleNextRocket();
    }, delay);
}

// Discover stickers, then kick off rocket spawning
discoverStickers().then((list) => {
    ROCKET_FRAMES = list.length ? list : ["sitcker/1.webp", "sitcker/2.webp"];
    console.log(`[rockets] loaded ${ROCKET_FRAMES.length} sticker(s):`, ROCKET_FRAMES);
    spawnRocket();
    scheduleNextRocket();
});

// =============================================================
//  Twinkling stars background
// =============================================================
const starsCanvas = document.getElementById("stars");
const sctx = starsCanvas.getContext("2d");
let stars = [];

function sizeCanvas(c) {
    c.width = window.innerWidth * window.devicePixelRatio;
    c.height = window.innerHeight * window.devicePixelRatio;
    c.style.width = window.innerWidth + "px";
    c.style.height = window.innerHeight + "px";
}

function buildStars() {
    sizeCanvas(starsCanvas);
    const count = Math.floor((window.innerWidth * window.innerHeight) / 5500);
    stars = Array.from({ length: count }, () => ({
        x: Math.random() * starsCanvas.width,
        y: Math.random() * starsCanvas.height,
        r: Math.random() * 1.4 + 0.3,
        a: Math.random(),
        s: Math.random() * 0.015 + 0.004,
        dir: Math.random() < 0.5 ? -1 : 1,
    }));
}

function drawStars() {
    sctx.clearRect(0, 0, starsCanvas.width, starsCanvas.height);
    for (const st of stars) {
        st.a += st.s * st.dir;
        if (st.a > 1) { st.a = 1; st.dir = -1; }
        if (st.a < 0.05) { st.a = 0.05; st.dir = 1; }
        sctx.beginPath();
        sctx.arc(st.x, st.y, st.r * window.devicePixelRatio, 0, Math.PI * 2);
        sctx.fillStyle = `rgba(220, 230, 255, ${st.a})`;
        sctx.fill();
    }
    requestAnimationFrame(drawStars);
}

buildStars();
drawStars();
window.addEventListener("resize", buildStars);

// =============================================================
//  Confetti burst
// =============================================================
const confettiCanvas = document.getElementById("confetti");
const cctx = confettiCanvas.getContext("2d");
let confetti = [];

function resizeConfetti() { sizeCanvas(confettiCanvas); }
resizeConfetti();
window.addEventListener("resize", resizeConfetti);

const COLORS = ["#d8b35a", "#f3d98a", "#e9c46a", "#ffffff", "#9bb8ff", "#5577cc"];

function burstConfetti() {
    const cx = confettiCanvas.width / 2;
    const cy = confettiCanvas.height / 2;
    const count = 140;
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 4 + Math.random() * 9;
        confetti.push({
            x: cx,
            y: cy,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 3,
            g: 0.18 + Math.random() * 0.12,
            size: 4 + Math.random() * 5,
            rot: Math.random() * Math.PI,
            vr: (Math.random() - 0.5) * 0.3,
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
            life: 0,
            max: 220 + Math.random() * 120,
        });
    }
    if (!confettiRunning) tickConfetti();
}

let confettiRunning = false;
function tickConfetti() {
    confettiRunning = true;
    cctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    for (const p of confetti) {
        p.vy += p.g;
        p.x += p.vx * window.devicePixelRatio;
        p.y += p.vy * window.devicePixelRatio;
        p.rot += p.vr;
        p.life++;
        const alpha = Math.max(0, 1 - p.life / p.max);
        cctx.save();
        cctx.translate(p.x, p.y);
        cctx.rotate(p.rot);
        cctx.fillStyle = p.color;
        cctx.globalAlpha = alpha;
        cctx.fillRect(-p.size, -p.size * 0.4, p.size * 2, p.size * 0.8);
        cctx.restore();
    }
    confetti = confetti.filter((p) => p.life < p.max && p.y < confettiCanvas.height + 40);
    if (confetti.length > 0) {
        requestAnimationFrame(tickConfetti);
    } else {
        confettiRunning = false;
        cctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    }
}
