/* =====================================================================
   sparkle-shader.js
   Custom Three.js ShaderMaterial for the connection-sequence particle
   field. Plain ES module — imported directly by the browser via the
   <script type="module"> import map, no bundler required.

   Required per-particle BufferGeometry attributes:
     position        vec3  — mirrors aBase, required by THREE.Points
     aBase           vec3  — origin point on the traced silhouette/edge
     aTarget         vec3  — destination point inside the companion silhouette
     aRandom         float — stable per-particle random seed (0..1)
     aSize           float — base point size before attenuation
     aDelay          float — per-particle stagger offset (0..1) for migration
     aGroup          float — 0 = ambient edge sparkle, 1 = migrating "racer"

   Uniforms:
     uTime              float  — elapsed seconds
     uMouseVel          float  — smoothed pointer velocity, ~0..1.5
     uTransitionProgress float — 0 = idle, 1 = fully connected
     uResolution        vec2   — canvas size in device pixels
     uGlassX            float  — world-space x of the glass region (distortion center)
===================================================================== */

import * as THREE from "three";

export const sparkleVertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uMouseVel;
  uniform float uTransitionProgress;
  uniform vec2  uResolution;
  uniform float uGlassX;

  attribute vec3  aBase;
  attribute vec3  aTarget;
  attribute float aRandom;
  attribute float aSize;
  attribute float aDelay;
  attribute float aGroup;

  varying float vAlpha;
  varying float vGroup;
  varying float vHeat;

  // Cheap pseudo-random hash — no texture lookups needed
  float hash(float n) { return fract(sin(n) * 43758.5453123); }

  void main() {
    vec3 pos = aBase;

    // --- Idle turbulence: always present, scales with pointer velocity ---
    float turbulence = 0.05 + uMouseVel * 0.85;
    pos.x += sin(uTime * 0.4 + aRandom * 6.2831) * turbulence * 0.16;
    pos.y += mod(uTime * (0.07 + uMouseVel * 0.22) + aRandom * 2.0, 1.0) * 0.32;
    pos.z += cos(uTime * 0.33 + aRandom * 6.2831) * turbulence * 0.11;

    // --- Staggered migration, only for aGroup > 0.5 ("racer") particles ---
    float vHeatLocal = 0.0;
    if (aGroup > 0.5) {
      // Each particle starts migrating at its own delay, driven by
      // uTransitionProgress rather than uTime directly, so reversing the
      // sequence smoothly reverses the migration too.
      float local = clamp((uTransitionProgress - aDelay * 0.6) / max(0.4, 1.0 - aDelay * 0.6), 0.0, 1.0);
      float eased = local * local * (3.0 - 2.0 * local); // smoothstep

      vec3 traveled = mix(aBase, aTarget, eased);

      // Glass-region distortion: as a particle's x crosses near uGlassX,
      // bend it up or down and briefly accelerate/compress horizontally.
      float distToGlass = traveled.x - uGlassX;
      float glassInfluence = exp(-distToGlass * distToGlass * 6.0);
      float bendDir = hash(aRandom * 91.7) > 0.5 ? 1.0 : -1.0;
      traveled.y += glassInfluence * bendDir * 0.22;
      traveled.x += glassInfluence * (uGlassX - traveled.x) * 0.35; // compress toward center
      traveled.z += glassInfluence * sin(aRandom * 40.0) * 0.08;

      // A gentle overall arc so the path reads as crossing a table, not a straight line
      traveled.y += sin(eased * 3.14159265) * 0.3;

      pos = mix(pos, traveled, eased);
      vHeatLocal = glassInfluence + eased * 0.4;
    }

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);

    // Perspective attenuation with a resolution-aware scale, and a hard
    // clamp so particles never balloon as they approach the camera.
    float resScale = uResolution.y / 900.0;
    float sizeBoost = 1.0 + uMouseVel * 1.3 + aGroup * uTransitionProgress * 1.2;
    float attenuated = aSize * sizeBoost * resScale * (300.0 / -mvPosition.z);
    gl_PointSize = clamp(attenuated, 1.0, 18.0);

    gl_Position = projectionMatrix * mvPosition;

    vAlpha = 0.5 + 0.5 * sin(uTime * (1.8 + uMouseVel * 3.5) + aRandom * 12.0);
    vGroup = aGroup * uTransitionProgress;
    vHeat = clamp(vHeatLocal, 0.0, 1.0);
  }
`;

export const sparkleFragmentShader = /* glsl */ `
  precision mediump float;
  varying float vAlpha;
  varying float vGroup;
  varying float vHeat;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float dist = length(uv);

    // Bright pinprick core + soft halo — no square sprite corners
    float core = smoothstep(0.09, 0.0, dist);
    float halo = pow(smoothstep(0.5, 0.0, dist), 1.8);
    float shape = core * 1.4 + halo;

    vec3 darkAmber  = vec3(0.55, 0.34, 0.10);
    vec3 gold       = vec3(0.85, 0.62, 0.24);
    vec3 warmGold   = vec3(1.0, 0.78, 0.4);
    vec3 hotCenter  = vec3(1.0, 0.95, 0.82);

    vec3 color = mix(darkAmber, gold, clamp(vAlpha, 0.0, 1.0));
    color = mix(color, warmGold, vGroup);
    color = mix(color, hotCenter, vHeat * core);

    gl_FragColor = vec4(color, shape * vAlpha);
  }
`;

export function createSparkleMaterial() {
  const uniforms = {
    uTime:               { value: 0 },
    uMouseVel:           { value: 0 },
    uTransitionProgress: { value: 0 },
    uResolution:         { value: new THREE.Vector2(1, 1) },
    uGlassX:             { value: 0 },
  };

  const material = new THREE.ShaderMaterial({
    vertexShader: sparkleVertexShader,
    fragmentShader: sparkleFragmentShader,
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  return { material, uniforms };
}
