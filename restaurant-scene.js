/* =====================================================================
   restaurant-scene.js
   A CDN-loadable Three.js module — no npm, no bundler, no build step.
   Renders a stylised 3D restaurant table (candle, wine glasses, warm
   rim light, floating bokeh) as a living background behind the hero
   copy. Runs immediately on load and reacts to cursor movement with a
   gentle camera parallax, so the page feels alive the instant it opens.

   Loaded as:  <script type="module" src="restaurant-scene.js"></script>
   Requires the import map in index.html.
===================================================================== */

import * as THREE from "three";

const canvas = document.getElementById("restaurantScene");
if (canvas) {

  /* ---------------------------------------------------------------------
     1. Renderer, scene, camera
     ------------------------------------------------------------------- */
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0b0906, 0.11);

  const camera = new THREE.PerspectiveCamera(
    42,
    canvas.clientWidth / canvas.clientHeight,
    0.1,
    50
  );
  camera.position.set(0, 1.35, 5.4);
  camera.lookAt(0, 0.1, 0);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  /* ---------------------------------------------------------------------
     2. Table — a soft, warmly lit surface the scene reads as "a table"
     ------------------------------------------------------------------- */
  const tableGeo = new THREE.CylinderGeometry(3.4, 3.6, 0.18, 64);
  const tableMat = new THREE.MeshStandardMaterial({
    color: 0x14100a, roughness: 0.35, metalness: 0.15,
  });
  const table = new THREE.Mesh(tableGeo, tableMat);
  table.position.y = -0.9;
  scene.add(table);

  // Linen cloth: a soft cream disc slightly above the table edge
  const clothGeo = new THREE.CircleGeometry(2.5, 64);
  const clothMat = new THREE.MeshStandardMaterial({
    color: 0xe8ddc6, roughness: 0.9, metalness: 0,
  });
  const cloth = new THREE.Mesh(clothGeo, clothMat);
  cloth.rotation.x = -Math.PI / 2;
  cloth.position.y = -0.8;
  scene.add(cloth);

  /* ---------------------------------------------------------------------
     3. Candle — geometry + a flickering point light + a glow sprite
     ------------------------------------------------------------------- */
  const candleGroup = new THREE.Group();

  const waxGeo = new THREE.CylinderGeometry(0.11, 0.13, 0.55, 24);
  const waxMat = new THREE.MeshStandardMaterial({ color: 0xf1e6c8, roughness: 0.6 });
  const wax = new THREE.Mesh(waxGeo, waxMat);
  wax.position.y = -0.52;
  candleGroup.add(wax);

  const wickGeo = new THREE.CylinderGeometry(0.006, 0.006, 0.05, 6);
  const wickMat = new THREE.MeshStandardMaterial({ color: 0x1a1410 });
  const wick = new THREE.Mesh(wickGeo, wickMat);
  wick.position.y = -0.22;
  candleGroup.add(wick);

  const flameLight = new THREE.PointLight(0xffb35c, 2.4, 6, 2);
  flameLight.position.y = -0.14;
  candleGroup.add(flameLight);

  // Soft radial-gradient sprite used as the flame's glow (no external texture file)
  function makeGlowTexture(hex) {
    const size = 128;
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const ctx = c.getContext("2d");
    const grad = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
    grad.addColorStop(0, hex + "ff");
    grad.addColorStop(0.4, hex + "88");
    grad.addColorStop(1, hex + "00");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    return new THREE.CanvasTexture(c);
  }

  const flameTexture = makeGlowTexture("#ffb35c");
  const flameMat = new THREE.SpriteMaterial({
    map: flameTexture, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const flame = new THREE.Sprite(flameMat);
  flame.scale.set(0.5, 0.7, 1);
  flame.position.y = -0.1;
  candleGroup.add(flame);

  candleGroup.position.set(0, 0.55, -0.3);
  scene.add(candleGroup);

  /* ---------------------------------------------------------------------
     4. Two stemmed wine glasses, flanking the candle
     ------------------------------------------------------------------- */
  function makeGlass(x) {
    const g = new THREE.Group();
    const bowlGeo = new THREE.SphereGeometry(0.22, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.62);
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff, transparent: true, opacity: 0.18,
      roughness: 0.05, metalness: 0, transmission: 0.9, thickness: 0.3,
    });
    const bowl = new THREE.Mesh(bowlGeo, glassMat);
    bowl.rotation.x = Math.PI;
    bowl.position.y = 0.32;
    g.add(bowl);

    const stemGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.3, 10);
    const stem = new THREE.Mesh(stemGeo, glassMat);
    stem.position.y = 0.12;
    g.add(stem);

    const baseGeo = new THREE.CylinderGeometry(0.09, 0.1, 0.02, 24);
    const base = new THREE.Mesh(baseGeo, glassMat);
    base.position.y = -0.03;
    g.add(base);

    g.position.set(x, -0.78, 0.5);
    return g;
  }
  scene.add(makeGlass(-0.75));
  scene.add(makeGlass(0.75));

  /* ---------------------------------------------------------------------
     5. Ambient + rim lighting for a warm, cinematic restaurant feel
     ------------------------------------------------------------------- */
  scene.add(new THREE.AmbientLight(0x2a1f14, 0.9));
  const rim = new THREE.DirectionalLight(0xc6963e, 0.6);
  rim.position.set(-3, 2, -2);
  scene.add(rim);
  const fill = new THREE.DirectionalLight(0x4a5a6e, 0.25);
  fill.position.set(2, 1, 3);
  scene.add(fill);

  /* ---------------------------------------------------------------------
     6. Floating bokeh — soft, depth-staggered glowing discs drifting
        past the table, the classic "alive marketing-site" 3D layer
     ------------------------------------------------------------------- */
  const bokehTexture = makeGlowTexture("#e6be6e");
  const bokehGroup = new THREE.Group();
  const BOKEH_COUNT = 26;
  const bokehData = [];

  for (let i = 0; i < BOKEH_COUNT; i++) {
    const mat = new THREE.SpriteMaterial({
      map: bokehTexture, transparent: true, blending: THREE.AdditiveBlending,
      depthWrite: false, opacity: 0.35 + Math.random() * 0.3,
    });
    const sprite = new THREE.Sprite(mat);
    const scale = 0.15 + Math.random() * 0.55;
    sprite.scale.set(scale, scale, 1);
    sprite.position.set(
      (Math.random() - 0.5) * 6,
      Math.random() * 3 - 0.8,
      (Math.random() - 0.5) * 4 - 1
    );
    bokehGroup.add(sprite);
    bokehData.push({ sprite, speed: 0.05 + Math.random() * 0.12, drift: Math.random() * 6.28 });
  }
  scene.add(bokehGroup);

  /* ---------------------------------------------------------------------
     7. Cursor parallax — the camera orbits slightly toward the pointer,
        idle sway keeps it alive even with no interaction at all
     ------------------------------------------------------------------- */
  let targetX = 0, targetY = 0;
  let mouseX = 0, mouseY = 0;

  window.addEventListener("pointermove", (e) => {
    targetX = (e.clientX / window.innerWidth - 0.5);
    targetY = (e.clientY / window.innerHeight - 0.5);
  });

  /* ---------------------------------------------------------------------
     8. Render loop
     ------------------------------------------------------------------- */
  const clock = new THREE.Clock();

  function animate() {
    const t = clock.getElapsedTime();

    // Ease camera toward pointer target, plus a slow idle figure-eight sway
    mouseX += (targetX - mouseX) * 0.04;
    mouseY += (targetY - mouseY) * 0.04;
    const idleX = Math.sin(t * 0.18) * 0.12;
    const idleY = Math.cos(t * 0.14) * 0.05;

    camera.position.x = (mouseX * 1.4) + idleX;
    camera.position.y = 1.35 + (mouseY * -0.5) + idleY;
    camera.lookAt(0, 0.1, 0);

    // Flame flicker: layered noise-like sine waves, never perfectly smooth
    const flicker = 1 + Math.sin(t * 9) * 0.08 + Math.sin(t * 23) * 0.05 + Math.sin(t * 5.3) * 0.06;
    flameLight.intensity = 2.2 * flicker;
    flame.scale.set(0.5 * flicker, 0.7 * flicker, 1);

    // Bokeh: slow upward drift with gentle horizontal sway, loops forever
    bokehData.forEach(({ sprite, speed, drift }) => {
      sprite.position.y += speed * 0.016;
      sprite.position.x += Math.sin(t * 0.4 + drift) * 0.002;
      if (sprite.position.y > 2.6) sprite.position.y = -1.2;
    });

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  animate();

  /* --- Resize handling ------------------------------------------------ */
  window.addEventListener("resize", () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  });
}
