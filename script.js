
"use strict";

const $ = (id) => document.getElementById(id);

const canvas = $("fireworks");
const ctx = canvas.getContext("2d");
const music = $("birthdayMusic");

const screens = [
  $("welcome"),
  $("giftScreen"),
  $("galleryScreen"),
  $("finalScreen")
];

const photos = [
  { src: "images/nisha1.jpg", label: "Beautiful Nisha ✨" },
  { src: "images/nisha2.jpg", label: "Our Birthday Star 💖" },
  { src: "images/nisha3.jpg", label: "Special Memories 🌸" },
  { src: "images/nisha4.jpg", label: "Always Keep Smiling 👑" }
];

let currentPhoto = 0;
let particles = [];
let rockets = [];
let lastLaunch = 0;
let lastFrame = 0;
let width = 0;
let height = 0;
let dpr = 1;
let musicStarted = false;

const colors = [
  "#ff4fa3", "#ffd166", "#ffffff", "#b967ff",
  "#43eaff", "#7dffb3", "#ff773d", "#ff83e5"
];

function resizeCanvas() {
  dpr = Math.min(window.devicePixelRatio || 1, 1.7);
  width = window.innerWidth;
  height = window.innerHeight;

  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  canvas.style.width = width + "px";
  canvas.style.height = height + "px";

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

function showScreen(screen) {
  screens.forEach((item) => item.classList.remove("active"));
  screen.classList.add("active");
}

function updateMusicButton() {
  $("musicToggle").textContent = music.paused
    ? "♫ MUSIC OFF"
    : "♫ MUSIC ON";
}

async function startMusic() {
  try {
    music.volume = 0.65;
    await music.play();
    musicStarted = true;
  } catch (error) {
    // Browser may block playback until another user tap.
    musicStarted = false;
  }
  updateMusicButton();
}

$("musicToggle").addEventListener("click", async () => {
  if (music.paused) {
    await startMusic();
  } else {
    music.pause();
    updateMusicButton();
  }
});

music.addEventListener("play", updateMusicButton);
music.addEventListener("pause", updateMusicButton);

function launchRocket(targetX, targetY) {
  const x = targetX ?? Math.random() * width;
  const target = targetY ?? height * (0.15 + Math.random() * 0.48);

  rockets.push({
    x: x + (Math.random() - 0.5) * 100,
    y: height + 10,
    vx: (Math.random() - 0.5) * 2.4,
    vy: -(7 + Math.random() * 4),
    targetY: target,
    color: colors[Math.floor(Math.random() * colors.length)],
    trail: []
  });
}

function burst(x, y, color, amount = 75) {
  const hueColor = color || colors[Math.floor(Math.random() * colors.length)];

  for (let i = 0; i < amount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.1 + Math.random() * 5.1;

    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      gravity: 0.045 + Math.random() * 0.035,
      friction: 0.982,
      life: 55 + Math.random() * 50,
      maxLife: 105,
      size: 1.1 + Math.random() * 2.5,
      color: Math.random() < 0.15 ? "#ffffff" : hueColor,
      sparkle: Math.random() < 0.25
    });
  }

  // Extra glitter for a richer explosion.
  for (let i = 0; i < 15; i++) {
    particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 9,
      vy: (Math.random() - 0.5) * 9,
      gravity: 0.025,
      friction: 0.97,
      life: 35 + Math.random() * 35,
      maxLife: 70,
      size: 1 + Math.random() * 2,
      color: "#fff1b8",
      sparkle: true
    });
  }

  // Keep memory and animation load under control on mobile.
  if (particles.length > 1400) {
    particles.splice(0, particles.length - 1400);
  }
}

function drawRocket(rocket) {
  rocket.trail.push({ x: rocket.x, y: rocket.y });
  if (rocket.trail.length > 7) rocket.trail.shift();

  for (let i = 0; i < rocket.trail.length; i++) {
    const point = rocket.trail[i];
    ctx.globalAlpha = i / rocket.trail.length;
    ctx.fillStyle = rocket.color;
    ctx.beginPath();
    ctx.arc(point.x, point.y, 1.5 + i * 0.2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 1;
  ctx.shadowBlur = 12;
  ctx.shadowColor = rocket.color;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(rocket.x, rocket.y, 2.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
}

function animate(now) {
  const delta = Math.min((now - (lastFrame || now)) / 16.67, 2);
  lastFrame = now;

  // Gentle fading keeps previous fireworks glowing in the background.
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = "rgba(16, 6, 23, 0.20)";
  ctx.fillRect(0, 0, width, height);
  ctx.globalCompositeOperation = "lighter";

  // Continuous rockets and fireworks throughout the whole experience.
  if (now - lastLaunch > 320 + Math.random() * 420) {
    launchRocket();
    lastLaunch = now;
  }

  rockets.forEach((rocket) => {
    rocket.x += rocket.vx * delta;
    rocket.y += rocket.vy * delta;
    rocket.vy += 0.055 * delta;
    drawRocket(rocket);
  });

  for (let i = rockets.length - 1; i >= 0; i--) {
    const rocket = rockets[i];
    if (rocket.y <= rocket.targetY || rocket.vy >= -0.2) {
      burst(rocket.x, rocket.y, rocket.color,
        width < 500 ? 48 : 76);
      rockets.splice(i, 1);
    }
  }

  particles.forEach((p) => {
    p.x += p.vx * delta;
    p.y += p.vy * delta;
    p.vy += p.gravity * delta;
    p.vx *= Math.pow(p.friction, delta);
    p.vy *= Math.pow(p.friction, delta);
    p.life -= delta;

    const alpha = Math.max(0, Math.min(1, p.life / p.maxLife));
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;

    if (p.sparkle) {
      ctx.shadowBlur = 8;
      ctx.shadowColor = p.color;
    } else {
      ctx.shadowBlur = 0;
    }

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
  ctx.globalCompositeOperation = "source-over";

  particles = particles.filter((p) =>
    p.life > 0 &&
    p.x > -80 && p.x < width + 80 &&
    p.y < height + 100
  );

  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);

function grandFireworks(count = 12) {
  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      const x = width * (0.1 + Math.random() * 0.8);
      const y = height * (0.12 + Math.random() * 0.48);
      burst(x, y, colors[Math.floor(Math.random() * colors.length)],
        width < 500 ? 55 : 95);
    }, i * 140);
  }
}

function makeStars() {
  const container = $("stars");
  container.innerHTML = "";

  const total = Math.min(70, Math.floor(width / 5));

  for (let i = 0; i < total; i++) {
    const star = document.createElement("span");
    star.className = "star";
    star.textContent = Math.random() > 0.5 ? "✦" : "·";
    star.style.left = Math.random() * 100 + "%";
    star.style.top = Math.random() * 100 + "%";
    star.style.fontSize = (8 + Math.random() * 13) + "px";
    star.style.setProperty("--duration", (1.3 + Math.random() * 3) + "s");
    container.appendChild(star);
  }
}

function makePetal() {
  const container = $("petals");
  const petal = document.createElement("span");
  const symbols = ["♥", "✦", "🌸", "💗"];

  petal.className = "petal";
  petal.textContent = symbols[Math.floor(Math.random() * symbols.length)];
  petal.style.left = Math.random() * 100 + "%";
  petal.style.fontSize = (10 + Math.random() * 17) + "px";
  petal.style.color = Math.random() > 0.5 ? "#ff83c9" : "#ffd98b";
  petal.style.setProperty("--drift", ((Math.random() - 0.5) * 180) + "px");
  petal.style.setProperty("--fall-duration", (6 + Math.random() * 7) + "s");
  container.appendChild(petal);

  setTimeout(() => petal.remove(), 14000);
}

makeStars();
setInterval(makePetal, 650);

$("startBtn").addEventListener("click", async () => {
  // Start audio directly from a user interaction for mobile compatibility.
  await startMusic();
  grandFireworks(18);
  showScreen($("giftScreen"));
});

function openGift() {
  const gift = $("giftBtn");
  gift.style.transform = "scale(1.3) rotate(12deg)";
  gift.style.filter = "brightness(1.8) drop-shadow(0 0 45px #fff)";
  grandFireworks(25);

  setTimeout(() => {
    currentPhoto = 0;
    showPhoto();
    showScreen($("galleryScreen"));
    grandFireworks(14);
  }, 850);
}

$("giftBtn").addEventListener("click", openGift);
$("openGift").addEventListener("click", openGift);

function showPhoto() {
  const photo = photos[currentPhoto];
  const image = $("birthdayPhoto");
  const frame = $("photoFrame");

  frame.animate(
    [
      { opacity: 0, transform: "scale(.82) rotateY(-14deg)" },
      { opacity: 1, transform: "scale(1) rotateY(0deg)" }
    ],
    { duration: 650, easing: "ease-out" }
  );

  image.src = photo.src;
  image.alt = photo.label;
  $("photoLabel").textContent = photo.label;
  $("photoCount").textContent =
    String(currentPhoto + 1).padStart(2, "0") + " / 04";

  $("nextPhoto").textContent =
    currentPhoto === photos.length - 1 ? "GRAND FINALE 🎆" : "NEXT PHOTO 💖";

  grandFireworks(4);
}

$("nextPhoto").addEventListener("click", () => {
  if (currentPhoto < photos.length - 1) {
    currentPhoto++;
    showPhoto();
  } else {
    showScreen($("finalScreen"));
    grandFireworks(35);
  }
});

$("prevPhoto").addEventListener("click", () => {
  currentPhoto = (currentPhoto - 1 + photos.length) % photos.length;
  showPhoto();
});

$("replayBtn").addEventListener("click", () => grandFireworks(20));

$("restartBtn").addEventListener("click", () => {
  currentPhoto = 0;
  $("giftBtn").style.transform = "";
  $("giftBtn").style.filter = "";
  showScreen($("welcome"));
  grandFireworks(18);
});

music.addEventListener("error", () => {
  console.warn("Music file not found. Check music/birthday.mp3");
});
