import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const COLORS = {
  red:    0xFF3B4E,
  green:  0x00D46A,
  yellow: 0xFFD600,
  blue:   0x0091FF,
  board:  0xF0E6D3,
  cream:  0xFAF0E0,
  dark:   0x1A0A14,
  white:  0xFFFFFF,
};

/* ═══════════════════════════════════════════════
   SHARED BOARD BUILDER
═══════════════════════════════════════════════ */
function buildBoard() {
  const group = new THREE.Group();

  // Frame (dark wood border)
  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(15.6, 0.5, 15.6),
    new THREE.MeshStandardMaterial({ color: 0x1A0A08, roughness: 0.9, metalness: 0.05 })
  );
  frame.position.y = -0.05;
  frame.receiveShadow = true;
  group.add(frame);

  // Board base
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(15, 0.15, 15),
    new THREE.MeshStandardMaterial({ color: COLORS.board, roughness: 0.7, metalness: 0 })
  );
  base.position.y = 0.2;
  base.receiveShadow = true;
  group.add(base);

  // Cross paths (white strips)
  const pathMat = new THREE.MeshStandardMaterial({ color: COLORS.white, roughness: 0.5 });
  const vertPath = new THREE.Mesh(new THREE.BoxGeometry(3, 0.06, 15), pathMat);
  vertPath.position.set(0, 0.28, 0);
  group.add(vertPath);
  const horizPath = new THREE.Mesh(new THREE.BoxGeometry(15, 0.06, 3), pathMat.clone());
  horizPath.position.set(0, 0.28, 0);
  group.add(horizPath);

  // Home areas — 4 corners
  const homeData = [
    { color: COLORS.green,  x: -4.5, z: -4.5 },
    { color: COLORS.red,    x:  4.5, z: -4.5 },
    { color: COLORS.yellow, x: -4.5, z:  4.5 },
    { color: COLORS.blue,   x:  4.5, z:  4.5 },
  ];

  homeData.forEach(({ color, x, z }) => {
    // Colored base
    const home = new THREE.Mesh(
      new THREE.BoxGeometry(6, 0.1, 6),
      new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.25, roughness: 0.4 })
    );
    home.position.set(x, 0.28, z);
    group.add(home);

    // White ring
    const ring = new THREE.Mesh(
      new THREE.CylinderGeometry(2.1, 2.1, 0.12, 48),
      new THREE.MeshStandardMaterial({ color: COLORS.white, roughness: 0.3 })
    );
    ring.position.set(x, 0.34, z);
    group.add(ring);

    // Colored inner circle
    const inner = new THREE.Mesh(
      new THREE.CylinderGeometry(1.7, 1.7, 0.14, 48),
      new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.5, roughness: 0.3 })
    );
    inner.position.set(x, 0.36, z);
    group.add(inner);
  });

  // Center star (4 triangles pointing inward)
  const centerColors = [COLORS.green, COLORS.red, COLORS.yellow, COLORS.blue];
  centerColors.forEach((color, i) => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.lineTo(1.3, -1.3);
    shape.lineTo(-1.3, -1.3);
    shape.closePath();
    const geo = new THREE.ShapeGeometry(shape);
    const mat = new THREE.MeshStandardMaterial({
      color, emissive: color, emissiveIntensity: 0.6,
      side: THREE.DoubleSide, roughness: 0.3,
    });
    const tri = new THREE.Mesh(geo, mat);
    tri.rotation.x = -Math.PI / 2;
    tri.rotation.z = (i * Math.PI) / 2;
    tri.position.y = 0.32;
    group.add(tri);
  });

  // Center white cap
  const cap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.5, 0.1, 32),
    new THREE.MeshStandardMaterial({ color: COLORS.white, emissive: COLORS.white, emissiveIntensity: 0.4 })
  );
  cap.position.y = 0.34;
  group.add(cap);

  return group;
}

/* ═══════════════════════════════════════════════
   TOKEN BUILDER  (single token)
═══════════════════════════════════════════════ */
function buildToken(color) {
  const group = new THREE.Group();
  const mat = (emissiveInt = 0.3) => new THREE.MeshStandardMaterial({
    color, emissive: color, emissiveIntensity: emissiveInt, roughness: 0.3, metalness: 0.2,
  });

  // Base disc
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.6, 0.18, 32), mat(0.2));
  base.position.y = 0;
  group.add(base);

  // Neck
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 0.5, 24), mat(0.25));
  neck.position.y = 0.34;
  group.add(neck);

  // Head sphere
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.44, 32, 24), mat(0.4));
  head.position.y = 0.84;
  group.add(head);

  // Specular glint
  const glint = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 16, 12),
    new THREE.MeshStandardMaterial({ color: 0xFFFFFF, emissive: 0xFFFFFF, emissiveIntensity: 0.8, roughness: 0 })
  );
  glint.position.set(-0.15, 1.0, 0.3);
  group.add(glint);

  group.castShadow = true;
  return group;
}

/* ═══════════════════════════════════════════════
   PARTICLE FIELD
═══════════════════════════════════════════════ */
function buildParticles(count = 250) {
  const positions = new Float32Array(count * 3);
  const colorArr  = new Float32Array(count * 3);
  const palette   = [
    new THREE.Color(COLORS.red),
    new THREE.Color(COLORS.green),
    new THREE.Color(COLORS.yellow),
    new THREE.Color(COLORS.blue),
  ];
  for (let i = 0; i < count; i++) {
    positions[i * 3]     = (Math.random() - 0.5) * 60;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 40;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 60;
    const c = palette[Math.floor(Math.random() * 4)];
    colorArr[i * 3]     = c.r;
    colorArr[i * 3 + 1] = c.g;
    colorArr[i * 3 + 2] = c.b;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color',    new THREE.BufferAttribute(colorArr,  3));
  return new THREE.Points(
    geo,
    new THREE.PointsMaterial({ size: 0.12, vertexColors: true, transparent: true, opacity: 0.6 })
  );
}

/* ═══════════════════════════════════════════════
   HERO SCENE
═══════════════════════════════════════════════ */
function initHeroScene() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 200);
  camera.position.set(0, 9, 15);
  camera.lookAt(0, 0, 0);

  function resize() {
    const w = canvas.clientWidth  || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  // Lights
  scene.add(new THREE.AmbientLight(0x111133, 0.6));
  const lights = [
    { color: COLORS.red,    pos: [-7, 6, -7]  },
    { color: COLORS.green,  pos: [7,  6, -7]  },
    { color: COLORS.yellow, pos: [-7, 6,  7]  },
    { color: COLORS.blue,   pos: [7,  6,  7]  },
  ];
  lights.forEach(({ color, pos }) => {
    const l = new THREE.PointLight(color, 3, 22);
    l.position.set(...pos);
    l.castShadow = false;
    scene.add(l);
  });

  // Board group (tilted slightly)
  const boardGroup = buildBoard();
  boardGroup.rotation.x = THREE.MathUtils.degToRad(-8);
  scene.add(boardGroup);

  // Tokens — pushed to edges so they don't overlap the hero title
  const tokenData = [
    { color: COLORS.green,  x: -7.5, z: -5.5 },
    { color: COLORS.red,    x:  7.5, z: -5.5 },
    { color: COLORS.yellow, x: -7.5, z:  6.5 },
    { color: COLORS.blue,   x:  7.5, z:  6.5 },
  ];
  const tokens = tokenData.map(({ color, x, z }) => {
    const t = buildToken(color);
    t.position.set(x, 2.5, z);
    t.scale.setScalar(0.6);
    scene.add(t);
    return t;
  });

  // Particles
  scene.add(buildParticles(300));

  // Subtle mouse parallax
  let mouseX = 0, mouseY = 0;
  window.addEventListener('mousemove', e => {
    mouseX = (e.clientX / window.innerWidth  - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  let frame = 0;
  function animate() {
    requestAnimationFrame(animate);
    frame++;
    const t = frame * 0.006;

    boardGroup.rotation.y = t * 0.5;

    // Float tokens with offset phases
    tokens.forEach((tok, i) => {
      tok.position.y  = 2.2 + Math.sin(t * 1.2 + i * 1.57) * 0.3;
      tok.rotation.y  = t * 0.8 + i * 1.57;
    });

    // Gentle camera parallax
    camera.position.x += (mouseX * 1.5 - camera.position.x) * 0.02;
    camera.position.y += (-mouseY * 1.0 + 9 - camera.position.y) * 0.02;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  }
  animate();
}

/* ═══════════════════════════════════════════════
   BOARD CANVAS SCENE (game preview section)
═══════════════════════════════════════════════ */
function initBoardScene() {
  const canvas = document.getElementById('board-canvas');
  if (!canvas) return;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 200);
  camera.position.set(14, 14, 14);
  camera.lookAt(0, 0, 0);

  function resize() {
    const w = canvas.clientWidth || 480, h = canvas.clientHeight || 480;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  // Lights
  scene.add(new THREE.AmbientLight(0x223344, 0.8));
  const lights2 = [
    { color: COLORS.red,    pos: [-8, 8, -8]  },
    { color: COLORS.green,  pos: [8,  8, -8]  },
    { color: COLORS.yellow, pos: [-8, 8,  8]  },
    { color: COLORS.blue,   pos: [8,  8,  8]  },
  ];
  lights2.forEach(({ color, pos }) => {
    const l = new THREE.PointLight(color, 2.5, 30);
    l.position.set(...pos);
    scene.add(l);
  });
  const topLight = new THREE.DirectionalLight(0xffffff, 1.2);
  topLight.position.set(5, 20, 5);
  topLight.castShadow = true;
  scene.add(topLight);

  // Board
  const board = buildBoard();
  scene.add(board);

  // Tokens positioned in home circles
  const tokenPositions = [
    { color: COLORS.green,  positions: [[-3.5,-3.5],[-5.5,-3.5],[-3.5,-5.5],[-5.5,-5.5]] },
    { color: COLORS.red,    positions: [[ 3.5,-3.5],[ 5.5,-3.5],[ 3.5,-5.5],[ 5.5,-5.5]] },
    { color: COLORS.yellow, positions: [[-3.5, 3.5],[-5.5, 3.5],[-3.5, 5.5],[-5.5, 5.5]] },
    { color: COLORS.blue,   positions: [[ 3.5, 3.5],[ 5.5, 3.5],[ 3.5, 5.5],[ 5.5, 5.5]] },
  ];
  const allTokens = [];
  tokenPositions.forEach(({ color, positions }) => {
    positions.forEach(([x, z]) => {
      const t = buildToken(color);
      t.position.set(x, 0.5, z);
      t.scale.setScalar(0.55);
      scene.add(t);
      allTokens.push(t);
    });
  });

  // OrbitControls — interactive
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.minPolarAngle = 0.2;
  controls.maxPolarAngle = Math.PI / 2.2;
  controls.minDistance = 10;
  controls.maxDistance = 30;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.6;

  let frame = 0;
  function animate() {
    requestAnimationFrame(animate);
    frame++;
    const t = frame * 0.008;
    allTokens.forEach((tok, i) => {
      tok.position.y = 0.5 + Math.sin(t + i * 0.8) * 0.06;
    });
    controls.update();
    renderer.render(scene, camera);
  }
  animate();
}

/* ═══════════════════════════════════════════════
   TOKEN MINI-CANVASES (NFT cards)
═══════════════════════════════════════════════ */
function initTokenCanvases() {
  const canvases = document.querySelectorAll('.token-canvas');
  canvases.forEach(canvas => {
    const colorName = canvas.dataset.color;
    const colorHex  = COLORS[colorName] ?? COLORS.red;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 50);
    camera.position.set(0, 1.2, 4.5);
    camera.lookAt(0, 0.8, 0);

    function resize() {
      const size = canvas.clientWidth || 200;
      renderer.setSize(size, size, false);
    }
    resize();
    new ResizeObserver(resize).observe(canvas);

    // Lights
    scene.add(new THREE.AmbientLight(0x111122, 0.5));
    const spot = new THREE.SpotLight(colorHex, 6, 20, Math.PI / 4, 0.4);
    spot.position.set(0, 8, 3);
    scene.add(spot);
    const fill = new THREE.PointLight(0xffffff, 1, 12);
    fill.position.set(-3, 2, 3);
    scene.add(fill);
    const rim = new THREE.PointLight(colorHex, 2, 10);
    rim.position.set(3, -1, -3);
    scene.add(rim);

    const token = buildToken(colorHex);
    token.scale.setScalar(0.9);
    token.position.y = 0;
    scene.add(token);

    // Subtle platform disc
    const platform = new THREE.Mesh(
      new THREE.CylinderGeometry(1.0, 1.0, 0.05, 48),
      new THREE.MeshStandardMaterial({ color: colorHex, emissive: colorHex, emissiveIntensity: 0.15, roughness: 0.8, transparent: true, opacity: 0.4 })
    );
    platform.position.y = -0.15;
    scene.add(platform);

    let frame = 0;
    function animate() {
      requestAnimationFrame(animate);
      frame++;
      token.rotation.y = frame * 0.018;
      token.position.y = Math.sin(frame * 0.03) * 0.06;
      renderer.render(scene, camera);
    }
    animate();
  });
}

/* ═══════════════════════════════════════════════
   BOOT
═══════════════════════════════════════════════ */
initHeroScene();
initBoardScene();
initTokenCanvases();
