
(() => {
  "use strict";

  const canvas = document.getElementById("fireworks");
  const ctx = canvas.getContext("2d");
  const openButton = document.getElementById("openGift");
  const intro = document.getElementById("intro");
  const celebration = document.getElementById("celebration");
  const audio = document.getElementById("birthdayMusic");
  const musicToggle = document.getElementById("musicToggle");
  const replay = document.getElementById("replay");

  if (!ctx) return;

  let width = 0;
  let height = 0;
  let particles = [];
  let rockets = [];
  let running = true;
  let lastFrame = 0;
  let lastLaunch = 0;
  let celebrationStarted = false;

  const reducedMotion =
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mobile = window.innerWidth < 600;
  const MAX_PARTICLES = mobile ? 150 : 240;
  const MAX_ROCKETS = 5;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    width = window.innerWidth;
    height = window.innerHeight;

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  window.addEventListener("resize", resize, { passive: true });
  resize();

  const colors = [
    "#ff91d0", "#ffd978", "#bba5ff",
    "#91f1ff", "#ffffff", "#ff9b9b"
  ];

  function burst(x, y, count = 32) {
    const available = MAX_PARTICLES - particles.length;
    const amount = Math.max(0, Math.min(count, available));

    for (let i = 0; i < amount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 3.1;

      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 45 + Math.random() * 35,
        maxLife: 80,
        size: 1.2 + Math.random() * 2,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }
  }

  function launchRocket() {
    if (rockets.length >= MAX_ROCKETS) return;

    rockets.push({
      x: width * (0.12 + Math.random() * 0.76),
      y: height + 10,
      targetY: height * (0.13 + Math.random() * 0.42),
      speed: 4 + Math.random() * 2,
      color: colors[Math.floor(Math.random() * colors.length)]
    });
  }

  function drawRocket(rocket) {
    ctx.beginPath();
    ctx.arc(rocket.x, rocket.y, 2.3, 0, Math.PI * 2);
    ctx.fillStyle = rocket.color;
    ctx.shadowBlur = 12;
    ctx.shadowColor = rocket.color;
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  function frame(timestamp) {
    if (!running || document.hidden) return;

    const delta = Math.min((timestamp - (lastFrame || timestamp)) / 16.67, 2);
    lastFrame = timestamp;

    ctx.clearRect(0, 0, width, height);

    // Fireworks launch at a relaxed rate.
    if (timestamp - lastLaunch > (celebrationStarted ? 950 : 1900)) {
      launchRocket();
      lastLaunch = timestamp;
    }

    for (let i = rockets.length - 1; i >= 0; i--) {
      const rocket = rockets[i];
      rocket.y -= rocket.speed * delta;
      drawRocket(rocket);

      if (rocket.y <= rocket.targetY) {
        burst(rocket.x, rocket.y, celebrationStarted ? 38 : 25);
        rockets.splice(i, 1);
      }
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx * delta;
      p.y += p.vy * delta;
      p.vy += 0.035 * delta;
      p.vx *= Math.pow(0.985, delta);
      p.life -= delta;

      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }

      ctx.globalAlpha = Math.min(1, p.life / 22);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
    requestAnimationFrame(frame);
  }

  function startAnimation() {
    if (reducedMotion || running) return;
    running = true;
    lastFrame = 0;
    requestAnimationFrame(frame);
  }

  function pauseAnimation() {
    running = false;
    lastFrame = 0;
  }

  if (!reducedMotion) {
    running = true;
    requestAnimationFrame(frame);
  } else {
    running = false;
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      pauseAnimation();
    } else {
      startAnimation();
    }
  });

  function updateMusicButton() {
    const playing = !audio.paused;
    musicToggle.classList.toggle("playing", playing);
    musicToggle.textContent = playing ? "♫ Music On" : "♫ Music Off";
  }

  async function playMusic() {
    try {
      await audio.play();
    } catch (error) {
      // Browser may block autoplay until a user taps.
    }
    updateMusicButton();
  }

  musicToggle.addEventListener("click", async () => {
    if (audio.paused) {
      await playMusic();
    } else {
      audio.pause();
      updateMusicButton();
    }
  });

  audio.addEventListener("play", updateMusicButton);
  audio.addEventListener("pause", updateMusicButton);

  function revealBirthday() {
    if (celebrationStarted) return;
    celebrationStarted = true;

    intro.classList.add("hidden");
    celebration.classList.remove("hidden");

    if (!reducedMotion) startAnimation();

    // Extra celebratory bursts on reveal.
    for (let i = 0; i < 4; i++) {
      setTimeout(() => {
        burst(
          width * (0.15 + Math.random() * 0.7),
          height * (0.15 + Math.random() * 0.4),
          38
        );
      }, i * 220);
    }

    playMusic();
  }

  openButton.addEventListener("click", revealBirthday);

  replay.addEventListener("click", () => {
    celebrationStarted = false;
    particles = [];
    rockets = [];
    celebration.classList.add("hidden");
    intro.classList.remove("hidden");

    // Start the music again if it was paused.
    playMusic();

    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  // Hide missing photos instead of showing broken-image icons.
  document.querySelectorAll(".photo-card img").forEach((img) => {
    img.addEventListener("error", () => {
      img.closest(".photo-card").style.display = "none";
    });

    if (img.complete && img.naturalWidth === 0) {
      img.closest(".photo-card").style.display = "none";
    }
  });

  // Attempt autoplay. Browsers may reject it without user interaction.
  window.addEventListener("load", () => {
    playMusic();
  }, { once: true });
})();
