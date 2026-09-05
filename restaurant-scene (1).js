/* =====================================================================
   restaurant-scene.js
   Scene-assembly module for the silent cyber-session experience.
   Plain ES module, no bundler — imports sparkle-shader.js directly.

   Loaded as:  <script type="module" src="restaurant-scene.js"></script>
   Requires the import map in index.html for the bare "three" specifier.
===================================================================== */

import * as THREE from "three";
import { createSparkleMaterial } from "./sparkle-shader.js";

const canvas = document.getElementById("restaurantScene");

if (canvas) {

  /* ---------------------------------------------------------------------
     1. Renderer, scene, fixed cinematic camera
     ------------------------------------------------------------------- */
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0c0805, 0.055);

  const camera = new THREE.PerspectiveCamera(
    36,
    canvas.clientWidth / canvas.clientHeight,
    0.1,
    50
  );
  // Fixed table-eye-level side profile — deliberately never moves.
  camera.position.set(0, 0.5, 4.8);
  camera.lookAt(0, 0.22, 0);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  function makeGlowTexture(hex) {
    const size = 128;
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const ctx = c.getContext("2d");
    const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grad.addColorStop(0, hex + "ff");
    grad.addColorStop(0.25, hex + "aa");
    grad.addColorStop(1, hex + "00");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    return new THREE.CanvasTexture(c);
  }

  /* ---------------------------------------------------------------------
     2. Table, candle, glass
     ------------------------------------------------------------------- */
  const table = new THREE.Mesh(
    new THREE.CylinderGeometry(3.4, 3.6, 0.18, 64),
    new THREE.MeshStandardMaterial({ color: 0x120e09, roughness: 0.3, metalness: 0.35 })
  );
  table.position.y = -0.9;
  scene.add(table);

  const candleGroup = new THREE.Group();
  const wax = new THREE.Mesh(
    new THREE.CylinderGeometry(0.11, 0.13, 0.55, 24),
    new THREE.MeshStandardMaterial({ color: 0xf1e6c8, roughness: 0.6 })
  );
  wax.position.y = -0.52;
  candleGroup.add(wax);

  const flameLight = new THREE.PointLight(0xffb35c, 2.6, 6, 2);
  flameLight.position.y = -0.14;
  candleGroup.add(flameLight);

  const flame = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeGlowTexture("#ffb35c"), transparent: true,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  flame.scale.set(0.5, 0.7, 1);
  flame.position.y = -0.1;
  candleGroup.add(flame);
  candleGroup.position.set(0, 0.55, -0.2);
  scene.add(candleGroup);

  const GLASS_X = 0; // world-space x used by the shader's distortion region

  function makeGlass(x) {
    const g = new THREE.Group();
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff, transparent: true, opacity: 0.2,
      roughness: 0.04, transmission: 0.92, ior: 1.45, thickness: 0.3,
    });
    const bowl = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.62), glassMat
    );
    bowl.rotation.x = Math.PI;
    bowl.position.y = 0.3;
    g.add(bowl);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.28, 10), glassMat);
    stem.position.y = 0.1;
    g.add(stem);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.09, 0.02, 24), glassMat);
    base.position.y = -0.04;
    g.add(base);
    g.position.set(x, -0.78, 0.4);
    g.userData.material = glassMat;
    return g;
  }
  const glass = makeGlass(GLASS_X);
  scene.add(glass);

  /* ---------------------------------------------------------------------
     3. Silhouette figures — practitioner (right, arms crossed) and
        companion (left, profile). Faceless by design.
     ------------------------------------------------------------------- */
  const silhouetteMat = new THREE.MeshStandardMaterial({
    color: 0x070502, roughness: 0.85, metalness: 0.05,
  });
  const companionMat = silhouetteMat.clone(); // gets its own emissive ramp during connection
  companionMat.emissive = new THREE.Color(0x000000);

  const practitioner = new THREE.Group();
  const pTorso = new THREE.Mesh(new THREE.CapsuleGeometry(0.34, 0.62, 8, 16), silhouetteMat);
  pTorso.position.y = 0.35;
  practitioner.add(pTorso);
  const pHead = new THREE.Group(); // wrapped so we can rotate the "head" independently
  const pHeadMesh = new THREE.Mesh(new THREE.SphereGeometry(0.17, 20, 20), silhouetteMat);
  pHead.add(pHeadMesh);
  pHead.position.y = 0.98;
  practitioner.add(pHead);
  const armGeo = new THREE.CapsuleGeometry(0.075, 0.5, 6, 12);
  const armA = new THREE.Mesh(armGeo, silhouetteMat);
  armA.rotation.z = Math.PI / 5;
  armA.position.set(-0.05, 0.32, 0.28);
  practitioner.add(armA);
  const armB = new THREE.Mesh(armGeo, silhouetteMat);
  armB.rotation.z = -Math.PI / 5;
  armB.position.set(0.05, 0.4, 0.3);
  practitioner.add(armB);
  practitioner.position.set(1.5, -0.35, -0.5);
  practitioner.rotation.y = -0.35;
  scene.add(practitioner);

  const companion = new THREE.Group();
  const cTorso = new THREE.Mesh(new THREE.CapsuleGeometry(0.3, 0.58, 8, 16), companionMat);
  cTorso.position.y = 0.32;
  companion.add(cTorso);
  const cHead = new THREE.Mesh(new THREE.SphereGeometry(0.155, 20, 20), companionMat);
  cHead.position.y = 0.9;
  companion.add(cHead);
  companion.position.set(-1.5, -0.35, -0.4);
  companion.rotation.y = 0.4;
  scene.add(companion);

  // A small rim light near the companion, dark until the connection arrives
  const companionGlow = new THREE.PointLight(0xe6be6e, 0, 2.2, 2);
  companionGlow.position.set(-1.5, 0.15, 0.1);
  scene.add(companionGlow);

  /* ---------------------------------------------------------------------
     4. Restrained lighting — figures read as silhouettes, not lit forms
     ------------------------------------------------------------------- */
  scene.add(new THREE.AmbientLight(0x3a2c1c, 0.5));
  const rim = new THREE.DirectionalLight(0xc6963e, 0.65);
  rim.position.set(-3, 2, -2);
  scene.add(rim);
  const fill = new THREE.DirectionalLight(0x6a5a44, 0.18);
  fill.position.set(2, 1, 3);
  scene.add(fill);

  /* ---------------------------------------------------------------------
     5. Background bokeh — soft, warm, breathing; fades out on connection
     ------------------------------------------------------------------- */
  const bokehTexture = makeGlowTexture("#c9a35e");
  const bokehSprites = [];
  const BOKEH_COUNT = 22;
  for (let i = 0; i < BOKEH_COUNT; i++) {
    const mat = new THREE.SpriteMaterial({
      map: bokehTexture, transparent: true, blending: THREE.AdditiveBlending,
      depthWrite: false, opacity: 0.12 + Math.random() * 0.16,
    });
    const sprite = new THREE.Sprite(mat);
    const scale = 0.3 + Math.random() * 0.9;
    sprite.scale.set(scale, scale, 1);
    sprite.position.set((Math.random() - 0.5) * 7, Math.random() * 2 - 0.3, -2.5 - Math.random() * 2);
    scene.add(sprite);
    bokehSprites.push({ sprite, baseOpacity: mat.opacity, phase: Math.random() * 6.28 });
  }

  /* ---------------------------------------------------------------------
     6. Particle field — base points trace the practitioner's silhouette,
        the candle rim, and the glass rim. "Racer" particles carry a
        matching target contour on the companion's silhouette, and
        migrate there when the connection sequence runs.
     ------------------------------------------------------------------- */
  const { material: sparkleMaterial, uniforms: sparkleUniforms } = createSparkleMaterial();

  const basePositions = [];
  const targets = [];
  const groups = [];
  const randoms = [];
  const sizes = [];
  const delays = [];

  // Companion contour — mirrors the practitioner's construction so
  // migrated particles settle into a believable second silhouette,
  // not a single point.
  function companionContourPoint(i, count) {
    const a = (i / count) * Math.PI * 2;
    const band = Math.floor((i / count) * 3);
    const radius = 0.3 - band * 0.06;
    const y = 0.1 + band * 0.4;
    return [
      companion.position.x + Math.cos(a) * radius * 0.9,
      y - 0.35,
      companion.position.z + Math.sin(a) * radius * 0.55 - 0.4,
    ];
  }

  const P = practitioner.position;
  const PRACTITIONER_POINTS = 60;
  for (let i = 0; i < PRACTITIONER_POINTS; i++) {
    const a = (i / PRACTITIONER_POINTS) * Math.PI * 2;
    const band = Math.floor(i / (PRACTITIONER_POINTS / 3));
    const radius = 0.32 - band * 0.06;
    const y = 0.15 + band * 0.45;
    basePositions.push(P.x + Math.cos(a) * radius, y - 0.35, P.z + Math.sin(a) * radius * 0.6 - 0.5);

    const isRacer = i % 2 === 0;
    groups.push(isRacer ? 1 : 0);

    const [tx, ty, tz] = companionContourPoint(i, PRACTITIONER_POINTS);
    targets.push(tx, ty, tz);

    randoms.push(Math.random());
    sizes.push(4 + Math.random() * 6);
    delays.push(Math.random()); // stagger — each particle starts migrating at its own point in the sequence
  }

  // Candle rim — ambient only, never migrates
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    basePositions.push(Math.cos(a) * 0.16, 0.62, -0.2 + Math.sin(a) * 0.16);
    targets.push(0, 0, 0);
    groups.push(0);
    randoms.push(Math.random());
    sizes.push(3 + Math.random() * 4);
    delays.push(0);
  }

  // Glass rim — ambient only; the shader's own distortion field is what
  // makes racer particles passing nearby bend, not these points directly.
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    basePositions.push(
      glass.position.x + Math.cos(a) * 0.2,
      glass.position.y + 0.3,
      glass.position.z + Math.sin(a) * 0.2
    );
    targets.push(0, 0, 0);
    groups.push(0);
    randoms.push(Math.random());
    sizes.push(3 + Math.random() * 4);
    delays.push(0);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(basePositions, 3));
  geometry.setAttribute("aBase", new THREE.Float32BufferAttribute(basePositions, 3));
  geometry.setAttribute("aTarget", new THREE.Float32BufferAttribute(targets, 3));
  geometry.setAttribute("aGroup", new THREE.Float32BufferAttribute(groups, 1));
  geometry.setAttribute("aRandom", new THREE.Float32BufferAttribute(randoms, 1));
  geometry.setAttribute("aSize", new THREE.Float32BufferAttribute(sizes, 1));
  geometry.setAttribute("aDelay", new THREE.Float32BufferAttribute(delays, 1));

  sparkleUniforms.uGlassX.value = GLASS_X;

  const sparkles = new THREE.Points(geometry, sparkleMaterial);
  scene.add(sparkles);

  /* ---------------------------------------------------------------------
     7. Pointer velocity tracking — real delta-based speed, smoothed and
        decaying naturally, not raw position.
     ------------------------------------------------------------------- */
  let lastX = window.innerWidth / 2;
  let lastY = window.innerHeight / 2;
  let lastT = performance.now();
  let mouseVelocity = 0;
  let normPointerX = 0; // -1..1, used for the practitioner's head orientation
  let normPointerY = 0;

  window.addEventListener("pointermove", (e) => {
    const now = performance.now();
    const dt = Math.max(now - lastT, 1);
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    const instVelocity = Math.sqrt(dx * dx + dy * dy) / dt;
    mouseVelocity = mouseVelocity * 0.85 + Math.min(instVelocity, 3) * 0.15;
    lastX = e.clientX;
    lastY = e.clientY;
    lastT = now;

    normPointerX = (e.clientX / window.innerWidth) * 2 - 1;
    normPointerY = (e.clientY / window.innerHeight) * 2 - 1;
  });

  /* ---------------------------------------------------------------------
     8. Connection state — hover or click on the candle hotspot.
        transitionProgress is eased toward its target using frame delta,
        so speed is independent of refresh rate (~2–3s either direction).
     ------------------------------------------------------------------- */
  const hotspot = document.getElementById("candleHotspot");
  let connectTarget = 0;
  let transitionProgress = 0;

  if (hotspot) {
    hotspot.addEventListener("pointerenter", () => { connectTarget = 1; });
    hotspot.addEventListener("pointerleave", () => { connectTarget = 0; });
    hotspot.addEventListener("click", () => {
      connectTarget = connectTarget > 0.5 ? 0 : 1;
      hotspot.setAttribute("aria-pressed", String(connectTarget === 1));
      document.body.classList.toggle("is-connected", connectTarget === 1);
    });
  }

  /* ---------------------------------------------------------------------
     9. Muted Web Audio hook.
        A real StereoPannerNode is created and wired to migration progress
        (pan sweeps left as transitionProgress goes 0→1). Gain starts at
        0 — intentionally silent until you decide to enable actual sound
        or route in a real ambience buffer.
     ------------------------------------------------------------------- */
  let audioCtx = null, panner = null, masterGain = null, droneOsc = null;

  function initAudioOnce() {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    panner = audioCtx.createStereoPanner();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0; // raise this (0–1) when you want audible sound
    droneOsc = audioCtx.createOscillator();
    droneOsc.type = "sine";
    droneOsc.frequency.value = 72;
    droneOsc.connect(panner).connect(masterGain).connect(audioCtx.destination);
    droneOsc.start();
  }
  window.addEventListener("pointerdown", initAudioOnce, { once: true });

  /* ---------------------------------------------------------------------
     10. Render loop — delta-time driven throughout
     ------------------------------------------------------------------- */
  const clock = new THREE.Clock();
  const TRANSITION_SECONDS = 2.6;

  function animate() {
    const delta = clock.getDelta();
    const t = clock.elapsedTime;

    mouseVelocity *= Math.pow(0.4, delta); // frame-rate-independent decay

    // Ease transitionProgress toward its target over ~TRANSITION_SECONDS,
    // using delta time so it's consistent across refresh rates.
    const step = delta / TRANSITION_SECONDS;
    if (transitionProgress < connectTarget) {
      transitionProgress = Math.min(connectTarget, transitionProgress + step);
    } else if (transitionProgress > connectTarget) {
      transitionProgress = Math.max(connectTarget, transitionProgress - step);
    }

    sparkleUniforms.uTime.value = t;
    sparkleUniforms.uMouseVel.value = mouseVelocity;
    sparkleUniforms.uTransitionProgress.value = transitionProgress;

    // Practitioner breathing — subtle, tracks pointer velocity
    const breathFreq = 0.6 + mouseVelocity * 2.0;
    const breathDepth = 0.012 + mouseVelocity * 0.016;
    const breath = 1 + Math.sin(t * breathFreq) * breathDepth;
    practitioner.scale.set(breath, breath * 0.5 + 0.5, breath);

    // Subtle head orientation toward the pointer, clamped and damped —
    // never a dramatic turn.
    const targetHeadY = THREE.MathUtils.clamp(normPointerX * 0.18, -0.18, 0.18);
    const targetHeadX = THREE.MathUtils.clamp(-normPointerY * 0.1, -0.1, 0.1);
    pHead.rotation.y += (targetHeadY - pHead.rotation.y) * Math.min(1, delta * 3);
    pHead.rotation.x += (targetHeadX - pHead.rotation.x) * Math.min(1, delta * 3);

    // Candle: intensity eases down slightly during connection, flicker always present
    const flicker = 1 + Math.sin(t * 9) * 0.08 + Math.sin(t * 23) * 0.05;
    flameLight.intensity = (2.6 - transitionProgress * 1.1) * flicker;
    flame.scale.set(0.5 * flicker, 0.7 * flicker, 1);

    // Glass shimmer — brightens while particles are mid-flight
    const midFlight = Math.sin(Math.min(transitionProgress, 1) * Math.PI);
    glass.userData.material.opacity = 0.2 + midFlight * 0.35;
    glass.userData.material.roughness = 0.04 + midFlight * 0.08;

    // Companion glow ramps in with progress; practitioner dims slightly
    // as "energy leaves it" — never fully, per spec.
    companionGlow.intensity = transitionProgress * 1.6;
    companionMat.emissive.setRGB(
      0.35 * transitionProgress, 0.24 * transitionProgress, 0.08 * transitionProgress
    );
    silhouetteMat.color.setScalar(0.03 - transitionProgress * 0.012);

    // Bokeh fades out as the connection deepens, with a slow independent breathe
    bokehSprites.forEach(({ sprite, baseOpacity, phase }) => {
      const breatheAmt = 0.85 + Math.sin(t * 0.5 + phase) * 0.15;
      sprite.material.opacity = baseOpacity * breatheAmt * (1 - transitionProgress);
    });

    // Audio pan sweeps left as the migration completes (silent until gain is raised)
    if (panner) panner.pan.value = THREE.MathUtils.clamp(transitionProgress * -2 + 1, -1, 1);

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  animate();

  /* --- Resize: keep uResolution accurate for the shader's point sizing */
  function handleResize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    const pr = renderer.getPixelRatio();
    sparkleUniforms.uResolution.value.set(w * pr, h * pr);
  }
  window.addEventListener("resize", handleResize);
  handleResize();
}
