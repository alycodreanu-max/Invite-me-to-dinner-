/* =====================================================================
   ember-canvas.js
   Slow-drifting embers and smoke rising through the candlelight.
   Vanilla port of a React EmberCanvas component — same particle math,
   no framework required. Attaches to any <canvas data-ember> on the page.
===================================================================== */

(function () {
  "use strict";

  function initEmberCanvas(canvas) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let width = 0, height = 0, raf = 0;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    function spawn() {
      const maxLife = 240 + Math.random() * 360;
      return {
        x: Math.random() * (width || 1),
        y: (height || 1) * (0.55 + Math.random() * 0.6),
        r: 0.6 + Math.random() * 1.8,
        vy: -(0.12 + Math.random() * 0.35),
        vx: (Math.random() - 0.5) * 0.18,
        life: Math.random() * maxLife,
        maxLife,
      };
    }

    const count = reduced ? 18 : 60;
    const particles = Array.from({ length: count }, spawn);

    function draw() {
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) {
        p.life += 1;
        p.x += p.vx + Math.sin(p.life / 60) * 0.12;
        p.y += p.vy;
        if (p.life > p.maxLife || p.y < -20) {
          Object.assign(p, spawn(), { y: height + 10, life: 0 });
        }
        const fade = 1 - p.life / p.maxLife;
        const alpha = Math.max(0, Math.min(0.75, fade * 0.75));
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 6);
        gradient.addColorStop(0, `rgba(255, 168, 92, ${alpha})`);
        gradient.addColorStop(1, "rgba(255, 120, 40, 0)");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 6, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = window.requestAnimationFrame(draw);
    }
    raf = window.requestAnimationFrame(draw);

    return function cleanup() {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }

  document.querySelectorAll("canvas[data-ember]").forEach(initEmberCanvas);
})();
