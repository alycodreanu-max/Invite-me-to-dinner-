(function(){
  "use strict";

  /* -----------------------------------------------------------
     Cursor spotlight — the "alive" ambient light that follows you
     everywhere on the page, not just inside the hero. Skipped on
     touch devices and when reduced motion is requested.
  ----------------------------------------------------------- */
  const root = document.documentElement;
  const canHover = matchMedia("(hover:hover)").matches;
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const spotlightEl = document.getElementById("spotlight");
  if (canHover && !reducedMotion){
    window.addEventListener("pointermove", (e) => {
      root.style.setProperty("--sx", e.clientX + "px");
      root.style.setProperty("--sy", e.clientY + "px");
    });
  } else if (spotlightEl){
    spotlightEl.style.display = "none";
  }

  /* -----------------------------------------------------------
     Hero parallax — scroll-driven scale/translate/fade on the
     dinner photo, matching a classic scroll-linked hero treatment.
  ----------------------------------------------------------- */
  const heroSection = document.getElementById("hero");
  const heroMedia = document.getElementById("heroMedia");
  const heroContent = heroSection ? heroSection.querySelector(".hero__content") : null;

  /* -----------------------------------------------------------
     Andy portrait — scroll-driven parallax as its section passes
  ----------------------------------------------------------- */
  const portraitWrap = document.getElementById("andyPortrait");

  let ticking = false;
  function updateScrollParallax(){
    if (heroSection && heroMedia && !reducedMotion){
      const rect = heroSection.getBoundingClientRect();
      const heroHeight = heroSection.offsetHeight || 1;
      const progress = Math.min(Math.max(-rect.top / heroHeight, 0), 1);
      const scale = 1 + progress * 0.15;
      const translateY = progress * 12;
      heroMedia.style.transform = `scale(${scale}) translateY(${translateY}%)`;
      if (heroContent){
        heroContent.style.opacity = String(Math.max(0, 1 - progress / 0.8));
      }
    }

    if (portraitWrap && !reducedMotion){
      const r = portraitWrap.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      // 0 when the section enters at the bottom, 1 when it exits at the top
      const p = Math.min(Math.max((vh - r.top) / (vh + r.height), 0), 1);
      const translateY = (-6 + p * 12); // -6% -> 6%
      portraitWrap.style.transform = `translateY(${translateY}%)`;
    }

    ticking = false;
  }
  function onScroll(){
    if (!ticking){
      requestAnimationFrame(updateScrollParallax);
      ticking = true;
    }
  }
  if (!reducedMotion){
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    updateScrollParallax();
  }

  /* -----------------------------------------------------------
     Andy portrait — cursor-reactive 3D tilt (desktop only, layers
     on top of the scroll parallax translate above)
  ----------------------------------------------------------- */
  const portrait = document.getElementById("andyPortrait");
  const portraitImg = portrait ? portrait.querySelector("img") : null;
  if (portrait && portraitImg && matchMedia("(hover:hover)").matches){
    portrait.addEventListener("pointermove", (e) => {
      const r = portrait.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      portraitImg.style.transform = `rotateY(${px * 10}deg) rotateX(${py * -10}deg) scale(1.03)`;
    });
    portrait.addEventListener("pointerleave", () => {
      portraitImg.style.transform = "rotateY(0deg) rotateX(0deg) scale(1)";
    });
  }

  /* -----------------------------------------------------------
     Offering panels — subtle tilt + selection state
  ----------------------------------------------------------- */
  const offerCards = document.querySelectorAll(".offer");
  offerCards.forEach((card) => {
    if (matchMedia("(hover:hover)").matches){
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `rotateY(${px * 4}deg) rotateX(${py * -4}deg) translateY(-2px)`;
      });
      card.addEventListener("pointerleave", () => {
        card.style.transform = "rotateY(0) rotateX(0) translateY(0)";
      });
    }
    const btn = card.querySelector("[data-select]");
    if (btn){
      btn.addEventListener("click", () => selectOffer(btn.dataset.select));
    }
  });

  /* -----------------------------------------------------------
     Offer selection — syncs offering cards + booking pills
  ----------------------------------------------------------- */
  const pills = document.querySelectorAll(".pill[data-value]");
  const offerField = document.getElementById("offerField");
  const summaryPrice = document.getElementById("summaryPrice");
  const PRICES = { individual: "£300", couple: "£450" };

  function selectOffer(value){
    pills.forEach(p => p.setAttribute("aria-pressed", String(p.dataset.value === value)));
    offerCards.forEach(c => c.classList.toggle("is-active", c.dataset.offer === value));
    offerField.value = value;
    summaryPrice.textContent = PRICES[value];
  }

  pills.forEach(p => p.addEventListener("click", () => {
    selectOffer(p.dataset.value);
    document.getElementById("book").scrollIntoView({ behavior: "smooth", block: "start" });
  }));

  selectOffer("individual");

  /* -----------------------------------------------------------
     Calendar
  ----------------------------------------------------------- */
  const monthLabel = document.getElementById("calendarMonth");
  const grid = document.getElementById("calendarGrid");
  const prevBtn = document.getElementById("prevMonth");
  const nextBtn = document.getElementById("nextMonth");
  const dateField = document.getElementById("dateField");
  const timeSelect = document.getElementById("timeSelect");
  const timePills = document.getElementById("timePills");
  const timeField = document.getElementById("timeField");

  const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const TIMES = ["6:30 PM","7:00 PM","7:30 PM","8:00 PM","8:30 PM"];

  const today = new Date();
  today.setHours(0,0,0,0);
  let viewYear = today.getFullYear();
  let viewMonth = today.getMonth();
  let selectedDate = null;

  function renderCalendar(){
    monthLabel.textContent = `${MONTHS[viewMonth]} ${viewYear}`;
    grid.innerHTML = "";

    const firstDay = new Date(viewYear, viewMonth, 1);
    // Monday-first index
    let startOffset = firstDay.getDay() - 1;
    if (startOffset < 0) startOffset = 6;

    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    for (let i = 0; i < startOffset; i++){
      const empty = document.createElement("span");
      empty.className = "day is-empty";
      grid.appendChild(empty);
    }

    for (let d = 1; d <= daysInMonth; d++){
      const cellDate = new Date(viewYear, viewMonth, d);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "day";
      btn.textContent = String(d);

      const isPast = cellDate < today;
      const isSunday = cellDate.getDay() === 0;

      if (isPast || isSunday){
        btn.classList.add("is-disabled");
        btn.disabled = true;
      } else {
        btn.addEventListener("click", () => selectDate(cellDate, btn));
      }

      if (selectedDate && cellDate.getTime() === selectedDate.getTime()){
        btn.classList.add("is-selected");
      }

      grid.appendChild(btn);
    }
  }

  function selectDate(date, btn){
    selectedDate = date;
    document.querySelectorAll(".day.is-selected").forEach(d => d.classList.remove("is-selected"));
    btn.classList.add("is-selected");
    const readable = date.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    dateField.value = readable;

    if (timeSelect.hidden){
      timeSelect.hidden = false;
      TIMES.forEach((t, i) => {
        const p = document.createElement("button");
        p.type = "button";
        p.className = "time-pill";
        p.textContent = t;
        p.addEventListener("click", () => {
          document.querySelectorAll(".time-pill").forEach(el => el.classList.remove("is-selected"));
          p.classList.add("is-selected");
          timeField.value = t;
        });
        timePills.appendChild(p);
      });
    }
  }

  prevBtn.addEventListener("click", () => {
    viewMonth--;
    if (viewMonth < 0){ viewMonth = 11; viewYear--; }
    renderCalendar();
  });
  nextBtn.addEventListener("click", () => {
    viewMonth++;
    if (viewMonth > 11){ viewMonth = 0; viewYear++; }
    renderCalendar();
  });

  renderCalendar();

  /* -----------------------------------------------------------
     Form submission — client-side confirmation
     (Wire the fetch() call below to your booking backend / Calendly / Stripe flow.)
  ----------------------------------------------------------- */
  const form = document.getElementById("bookingForm");
  const overlay = document.getElementById("confirmOverlay");
  const confirmName = document.getElementById("confirmName");
  const confirmOffer = document.getElementById("confirmOffer");
  const confirmDate = document.getElementById("confirmDate");
  const confirmTime = document.getElementById("confirmTime");
  const confirmClose = document.getElementById("confirmClose");

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    if (!dateField.value){
      grid.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (!timeField.value){
      timeSelect.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (!form.checkValidity()){
      form.reportValidity();
      return;
    }

    const data = new FormData(form);

    // TODO: replace with your real booking endpoint, e.g.:
    // fetch("/api/bookings", { method: "POST", body: data });

    confirmName.textContent = (data.get("name") || "friend").split(" ")[0];
    confirmOffer.textContent = data.get("offer") === "couple" ? "Couple" : "Individual";
    confirmDate.textContent = data.get("date");
    confirmTime.textContent = data.get("time");

    overlay.hidden = false;
  });

  confirmClose.addEventListener("click", () => { overlay.hidden = true; });
  overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.hidden = true; });

})();
