
"use strict";

const $ = (id) => document.getElementById(id);

const canvas = $("fireworks");
const ctx = canvas.getContext("2d", { alpha: false });
const music = $("birthdayMusic");

const screens = [
  $("welcome"),
  $("giftScreen"),
  $("galleryScreen"),
  $("finalScreen")
];

const photos = [
  { src: "images/nisha1.jpg", label: "Beautiful Nisha ✦" },
  { src: "images/nisha2.jpg", label: "A Golden Memory ✦" },
  { src: "images/nisha3.jpg", label: "Together Forever ✦" },
  { src: "images/nisha4.jpg", label: "Our Birthday Star ✦" }
];

const GOLD = ["#ffe6a0", "#d8ad50", "#ffffff", "#b88837"];

let width = 0;
let height = 0;
let dpr = 1;
let particles = [];
let rockets = [];
let lastLaunch = 0;
let lastFrame = 0;
let photoIndex = 0;
let fireworksBoost = false;
let audioAvailable = false;

function resizeCanvas() {
  width = window.innerWidth;
  height = window.innerHeight;

  // Limit canvas resolution on phones to reduce rendering load.
  dpr = Math.min(window.devicePixelRatio || 1, 1.25);

  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  canvas.style.width = width + "px";
  canvas.style.height = height + "px";

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = "#050505";
  ctx.fillRect(0, 0, width, height);
}

window.addEventListener("resize", resizeCanvas, { passive: true });
resizeCanvas();

function showScreen(target) {
  for (const screen of screens) {
    screen.classList.toggle("active", screen === target);
  }
}

function updateMusicButton() {
  $("musicToggle").textContent = music.paused
    ? "♫ MUSIC OFF"
    : "♫ MUSIC ON";
}

async function playMusic() {
  try {
    music.volume = 0.65;
    await music.play();
    audioAvailable = true;
  } catch (error) {
    audioAvailable = false;
    console.info(
      "Tap the music button to start playback. Check the MP3 file path if needed."
    );
  }

  updateMusicButton();
}

$("musicToggle").addEventListener("click", async () => {
  if (music.paused) {
    await playMusic();
  } else {
    music.pause();
    updateMusicButton();
  }
});

music.addEventListener("play", updateMusicButton);
music.addEventListener("pause", updateMusicButton);
music.addEventListener("error", () => {
  audioAvailable = false;
  updateMusicButton();
  console.warn("Music not found: music/birthday.mp3");
});

function createBurst(x, y, count = 34) {
  const color = GOLD[Math.floor(Math.random() * GOLD.length)];

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.7 + Math.random() * 2.8;

    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 35 + Math.random() * 32,
      maxLife: 67,
      size: 0.8 + Math.random() * 1.4,
      color,
      gravity: 0.025 + Math.random() * 0.02
    });
  }

  // Hard cap protects lower-powered mobile devices.
  if (particles.length > 420) {
    particles.splice(0, particles.length - 420);
  }
}

function launchRocket() {
  rockets.push({
    x: width * (0.12 + Math.random() * 0.76),
    y: height + 4,
    targetY: height * (0.18 + Math.random() * 0.38),
    vy: -(4.0 + Math.random() * 2.0),
    vx: (Math.random() - 0.5) * 0.8,
    color: GOLD[Math.floor(Math.random() * GOLD.length)],
    trail: []
  });

  if (rockets.length > 5) rockets.shift();
}

function render(now) {
  const delta = Math.min((now - (lastFrame || now)) / 16.67, 1.8);
  lastFrame = now;

  // Fade existing particles instead of redrawing the entire page.
  ctx.fillStyle = "rgba(5, 5, 5, 0.24)";
  ctx.fillRect(0, 0, width, height);

  // Regular fireworks continue on every screen.
  const interval = fireworksBoost ? 240 : 1000;

  if (now - lastLaunch > interval) {
    launchRocket();
    lastLaunch = now;

    if (fireworksBoost && Math.random() < 0.5) {
      launchRocket();
    }
  }

  for (let i = rockets.length - 1; i >= 0; i--) {
    const rocket = rockets[i];

    rocket.trail.push({ x: rocket.x, y: rocket.y });
    if (rocket.trail.length > 5) rocket.trail.shift();

    rocket.x += rocket.vx * delta;
    rocket.y += rocket.vy * delta;
    rocket.vy += 0.045 * delta;

    ctx.beginPath();
    ctx.strokeStyle = rocket.color;
    ctx.lineWidth = 1.2;
    ctx.globalAlpha = 0.65;
    ctx.moveTo(rocket.x, rocket.y);

    for (let j = rocket.trail.length - 1; j >= 0; j--) {
      ctx.lineTo(rocket.trail[j].x, rocket.trail[j].y);
    }

    ctx.stroke();
    ctx.globalAlpha = 1;

    if (rocket.y <= rocket.targetY || rocket.vy >= 0) {
      createBurst(rocket.x, rocket.y, width < 500 ? 24 : 36);
      rockets.splice(i, 1);
    }
  }

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];

    p.x += p.vx * delta;
    p.y += p.vy * delta;
    p.vy += p.gravity * delta;
    p.life -= delta;

    if (p.life <= 0) {
      particles.splice(i, 1);
      continue;
    }

    ctx.globalAlpha = Math.min(1, p.life / p.maxLife);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.size, p.size);
  }

  ctx.globalAlpha = 1;
  requestAnimationFrame(render);
}

requestAnimationFrame(render);

function celebrate(count = 8) {
  fireworksBoost = true;

  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      createBurst(
        width * (0.12 + Math.random() * 0.76),
        height * (0.14 + Math.random() * 0.42),
        width < 500 ? 28 : 42
      );
    }, i * 110);
  }

  // Temporary bursts only; normal animation resumes afterwards.
  setTimeout(() => {
    fireworksBoost = false;
  }, 2400);
}

function enterGiftScreen() {
  showScreen($("giftScreen"));
  celebrate(9);
}

$("startBtn").addEventListener("click", async () => {
  // User gesture allows mobile browsers to start audio.
  await playMusic();
  enterGiftScreen();
});

function openGift() {
  const gift = $("giftBtn");
  gift.disabled = true;
  gift.animate(
    [
      { transform: "scale(1)", opacity: 1 },
      { transform: "scale(1.18)", opacity: 1 },
      { transform: "scale(.3)", opacity: 0 }
    ],
    { duration: 550, easing: "ease-in", fill: "forwards" }
  );

  celebrate(12);

  setTimeout(() => {
    photoIndex = 0;
    showPhoto();
    showScreen($("galleryScreen"));
    gift.disabled = false;
    celebrate(5);
  }, 650);
}

$("giftBtn").addEventListener("click", openGift);
$("openGift").addEventListener("click", openGift);

function showPhoto() {
  const photo = photos[photoIndex];
  const image = $("birthdayPhoto");
  const frame = $("photoFrame");

  $("photoError").hidden = true;
  image.hidden = false;
  image.src = photo.src;
  image.alt = photo.label;
  $("photoLabel").textContent = photo.label;

  $("photoCount").textContent =
    String(photoIndex + 1).padStart(2, "0") + " / 04";

  $("nextPhoto").textContent =
    photoIndex === photos.length - 1
      ? "GRAND FINALE ✦"
      : "NEXT MEMORY ✦";

  if (typeof frame.animate === "function") {
    frame.animate(
      [
        { opacity: 0.35, transform: "scale(.97)" },
        { opacity: 1, transform: "scale(1)" }
      ],
      { duration: 420, easing: "ease-out" }
    );
  }

  celebrate(3);
}

$("birthdayPhoto").addEventListener("error", () => {
  $("birthdayPhoto").hidden = true;
  $("photoError").hidden = false;
});

$("birthdayPhoto").addEventListener("load", () => {
  $("birthdayPhoto").hidden = false;
  $("photoError").hidden = true;
});

$("nextPhoto").addEventListener("click", () => {
  if (photoIndex < photos.length - 1) {
    photoIndex++;
    showPhoto();
  } else {
    showScreen($("finalScreen"));
    celebrate(18);
  }
});

$("prevPhoto").addEventListener("click", () => {
  photoIndex = (photoIndex - 1 + photos.length) % photos.length;
  showPhoto();
});

$("replayBtn").addEventListener("click", () => celebrate(15));

$("restartBtn").addEventListener("click", () => {
  photoIndex = 0;
  showScreen($("welcome"));
  celebrate(8);
});

// Keep the page from doing unnecessary canvas work in the background.
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    lastFrame = 0;
  }
});
