/* =====================================================================
   reveal.js
   Vanilla ports of two scroll-triggered reveal patterns:

   [data-reveal]        — fade + rise + blur-in, once, when ~30% visible.
                           Optional data-reveal-delay="0.2" (seconds).
   [data-reveal-words]  — splits the element's text into words and fades
                           each one in with a small stagger, once, when
                           ~60% visible. Matches the original's timing:
                           0.5s per word, delay = min(i * 0.03, 1.4)s.

   No framework required — same easing and thresholds as the source
   Framer Motion components, implemented with IntersectionObserver and
   plain CSS transitions.
===================================================================== */

(function () {
  "use strict";

  const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

  function setupReveal() {
    const els = document.querySelectorAll("[data-reveal]");
    if (!els.length) return;

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const delay = parseFloat(el.dataset.revealDelay || "0");
        el.style.transitionDelay = delay + "s";
        el.classList.add("is-revealed");
        io.unobserve(el);
      });
    }, { threshold: 0.3 });

    els.forEach((el) => {
      const y = el.dataset.revealY || "28";
      el.style.setProperty("--reveal-y", y + "px");
      el.style.transition = `opacity .9s ${EASE}, transform .9s ${EASE}, filter .9s ${EASE}`;
      io.observe(el);
    });
  }

  function setupRevealWords() {
    const els = document.querySelectorAll("[data-reveal-words]");
    if (!els.length) return;

    els.forEach((el) => {
      const text = el.textContent.trim();
      const words = text.split(/\s+/);
      el.textContent = "";
      words.forEach((word, i) => {
        const span = document.createElement("span");
        span.textContent = word + "\u00A0";
        span.style.display = "inline-block";
        span.style.opacity = "0.12";
        span.style.transition = `opacity .5s ${EASE}`;
        span.style.transitionDelay = Math.min(i * 0.03, 1.4) + "s";
        el.appendChild(span);
      });
    });

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.querySelectorAll("span").forEach((span) => {
          span.style.opacity = "1";
        });
        io.unobserve(entry.target);
      });
    }, { threshold: 0.6 });

    els.forEach((el) => io.observe(el));
  }

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    // Respect reduced motion: reveal everything immediately, no animation.
    document.querySelectorAll("[data-reveal]").forEach((el) => el.classList.add("is-revealed"));
  } else {
    setupReveal();
    setupRevealWords();
  }
})();
