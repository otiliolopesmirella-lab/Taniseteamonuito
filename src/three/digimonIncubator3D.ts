import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export type IncubatorVisualMode =
  | 'idle'
  | 'hatching'
  | 'reinforcing'
  | 'success';

interface IncubatorAnimHandles {
  root: THREE.Group;
  mainNeedle: THREE.Group;
  topNeedles: THREE.Group[];
  neonSegments: THREE.MeshStandardMaterial[];
  coreLight: THREE.PointLight;
  holoBeamMat: THREE.MeshBasicMaterial;
  energyRing: THREE.Mesh;
  energyRingMat: THREE.MeshBasicMaterial;
  topCoreMat: THREE.MeshStandardMaterial;
  disposables: Array<{ dispose: () => void }>;
}

function detectSoftwareGl(): boolean {
  try {
    const gl = document.createElement('canvas').getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

function createCentralGaugeTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d')!;
  const cx = 128;
  const cy = 128;

  // Outer dark rim
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 256, 256);

  // Left half bright royal blue, Right half crimson red (matching reference)
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.arc(cx, cy, 118, Math.PI * 0.5, Math.PI * 1.5);
  ctx.closePath();
  ctx.fillStyle = '#1d4ed8';
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.arc(cx, cy, 118, -Math.PI * 0.5, Math.PI * 0.5);
  ctx.closePath();
  ctx.fillStyle = '#dc2626';
  ctx.fill();

  // Center metallic seam & inner highlight
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(cx, 12);
  ctx.lineTo(cx, 244);
  ctx.stroke();

  // Dial tick marks around circumference
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const r1 = i % 2 === 0 ? 96 : 104;
    const r2 = 114;
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = i % 2 === 0 ? 4 : 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
    ctx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2);
    ctx.stroke();
  }

  // Center hub circle
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.arc(cx, cy, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 3;
  ctx.stroke();

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createTopDialTexture(variant: 'center' | 'side'): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext('2d')!;
  const cx = 64;
  const cy = 64;

  ctx.fillStyle = '#e2e8f0';
  ctx.beginPath();
  ctx.arc(cx, cy, 60, 0, Math.PI * 2);
  ctx.fill();

  // Green / Red pressure zones matching reference upper dials
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.arc(cx, cy, 52, Math.PI * 0.75, Math.PI * 1.5);
  ctx.closePath();
  ctx.fillStyle = '#16a34a';
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.arc(
    cx,
    cy,
    52,
    -Math.PI * 0.5,
    variant === 'center' ? Math.PI * 0.15 : Math.PI * 0.25
  );
  ctx.closePath();
  ctx.fillStyle = '#dc2626';
  ctx.fill();

  // White inner face
  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.arc(cx, cy, 28, 0, Math.PI * 2);
  ctx.fill();

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createSideTankDecalTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d')!;

  // Clean metallic white tank body
  const grad = ctx.createLinearGradient(0, 0, 512, 0);
  grad.addColorStop(0, '#cbd5e1');
  grad.addColorStop(0.25, '#f8fafc');
  grad.addColorStop(0.55, '#ffffff');
  grad.addColorStop(0.85, '#dbeafe');
  grad.addColorStop(1, '#94a3b8');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  // Red "DIGI EGG" header label on front face (center around x=256)
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(184, 128, 144, 42);
  ctx.strokeStyle = '#7f1d1d';
  ctx.lineWidth = 3;
  ctx.strokeRect(184, 128, 144, 42);

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 24px "Exo 2", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('DIGI EGG', 256, 150);

  // Yellow hazard/caution decal plate directly below DIGI EGG badge
  ctx.fillStyle = '#facc15';
  ctx.fillRect(190, 186, 132, 134);
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 4;
  ctx.strokeRect(190, 186, 132, 134);

  // Dark caution header strip inside yellow plate
  ctx.fillStyle = '#111827';
  ctx.fillRect(202, 198, 108, 16);

  // Bold hazard X emblem
  ctx.strokeStyle = '#111827';
  ctx.lineWidth = 14;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(218, 232);
  ctx.lineTo(294, 298);
  ctx.moveTo(294, 232);
  ctx.lineTo(218, 298);
  ctx.stroke();

  // Subtle horizontal metallic seam rings
  ctx.fillStyle = 'rgba(15, 23, 42, 0.16)';
  ctx.fillRect(0, 74, 512, 6);
  ctx.fillRect(0, 420, 512, 8);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Builds the multi-part procedural 3D Digimon Incubator matching the reference:
 * - Glowing cyan holographic pedestal with 8 perimeter LED segments
 * - Metallic purple central chamber with dark front console & silver louvered vents
 * - Central split Red/Blue gauge with animated yellow pointer arrow + 3 upper gauges
 * - Twin white side gas cylinders ("DIGI EGG" + yellow warning decals) & yellow caps
 * - Curved metallic connecting pipes + animated holographic core light beam
 */
export function buildDigimonIncubatorGroup(options?: {
  worldMode?: boolean;
}): IncubatorAnimHandles {
  const worldMode = Boolean(options?.worldMode);
  const root = new THREE.Group();
  const disposables: Array<{ dispose: () => void }> = [];
  const track = <T extends { dispose: () => void }>(item: T): T => {
    disposables.push(item);
    return item;
  };

  // Materials (varied roughness >= 0.25 & metalness per Three.js studio guidelines)
  const purpleArmorMat = track(
    new THREE.MeshStandardMaterial({
      color: 0x6b2fd6,
      roughness: 0.34,
      metalness: 0.42,
    })
  );
  const purpleDarkMat = track(
    new THREE.MeshStandardMaterial({
      color: 0x451899,
      roughness: 0.46,
      metalness: 0.35,
    })
  );
  const chromeSteelMat = track(
    new THREE.MeshStandardMaterial({
      color: 0xcbd5e1,
      roughness: 0.22,
      metalness: 0.85,
    })
  );
  const darkGunmetalMat = track(
    new THREE.MeshStandardMaterial({
      color: 0x1a2038,
      roughness: 0.56,
      metalness: 0.55,
    })
  );
  const yellowCapMat = track(
    new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      roughness: 0.3,
      metalness: 0.22,
      emissive: 0x422006,
      emissiveIntensity: 0.25,
    })
  );
  const tankTex = track(createSideTankDecalTexture());
  const tankMat = track(
    new THREE.MeshStandardMaterial({
      map: tankTex,
      roughness: 0.38,
      metalness: 0.16,
    })
  );

  // 1. Holographic Pedestal Base (seated flush at y = 0)
  const basePlateGeo = track(new THREE.CylinderGeometry(1.75, 1.88, 0.22, 32));
  const basePlate = new THREE.Mesh(basePlateGeo, darkGunmetalMat);
  basePlate.position.y = 0.11;
  basePlate.receiveShadow = true;
  root.add(basePlate);

  const upperRingGeo = track(new THREE.CylinderGeometry(1.52, 1.66, 0.12, 32));
  const upperRing = new THREE.Mesh(upperRingGeo, chromeSteelMat);
  upperRing.position.y = 0.27;
  upperRing.castShadow = true;
  upperRing.receiveShadow = true;
  root.add(upperRing);

  // 8 Glowing Cyan Neon Perimeter Segments around Pedestal
  const neonSegments: THREE.MeshStandardMaterial[] = [];
  const segGeo = track(new THREE.BoxGeometry(0.46, 0.08, 0.14));
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2 + Math.PI / 8;
    const segMat = track(
      new THREE.MeshStandardMaterial({
        color: 0x38e8ff,
        emissive: 0x00c8ff,
        emissiveIntensity: 1.9,
        roughness: 0.2,
        metalness: 0.1,
      })
    );
    neonSegments.push(segMat);
    const seg = new THREE.Mesh(segGeo, segMat);
    const r = 1.68;
    seg.position.set(Math.sin(angle) * r, 0.14, Math.cos(angle) * r);
    seg.rotation.y = angle;
    root.add(seg);
  }

  // Cyan floor energy halo ring (modal showcase only; DATS draws its own ground pad & halo)
  if (!worldMode) {
    const floorHaloGeo = track(new THREE.RingGeometry(1.78, 2.02, 48));
    const floorHaloMat = track(
      new THREE.MeshBasicMaterial({
        color: 0x22d3ee,
        transparent: true,
        opacity: 0.48,
        side: THREE.DoubleSide,
      })
    );
    const floorHalo = new THREE.Mesh(floorHaloGeo, floorHaloMat);
    floorHalo.rotation.x = -Math.PI / 2;
    floorHalo.position.y = 0.02;
    root.add(floorHalo);
  }

  // 2. Main Purple Armored Cylindrical Chamber & Crown
  const mainBodyGeo = track(new THREE.CylinderGeometry(0.86, 0.92, 1.68, 28));
  const mainBody = new THREE.Mesh(mainBodyGeo, purpleArmorMat);
  mainBody.position.y = 1.16;
  mainBody.castShadow = true;
  mainBody.receiveShadow = true;
  root.add(mainBody);

  // Dome top cap + metallic rim
  const crownGeo = track(new THREE.CylinderGeometry(0.68, 0.86, 0.26, 28));
  const crown = new THREE.Mesh(crownGeo, purpleDarkMat);
  crown.position.y = 2.13;
  crown.castShadow = true;
  root.add(crown);

  const collarGeo = track(new THREE.TorusGeometry(0.85, 0.045, 10, 32));
  const collar = new THREE.Mesh(collarGeo, chromeSteelMat);
  collar.rotation.x = Math.PI / 2;
  collar.position.y = 2.0;
  root.add(collar);

  // Top glowing cyan energy cap
  const topCoreGeo = track(new THREE.CylinderGeometry(0.32, 0.4, 0.12, 24));
  const topCoreMat = track(
    new THREE.MeshStandardMaterial({
      color: 0x7dd3fc,
      emissive: 0x00d8ff,
      emissiveIntensity: 1.5,
      roughness: 0.2,
      metalness: 0.2,
    })
  );
  const topCore = new THREE.Mesh(topCoreGeo, topCoreMat);
  topCore.position.y = 2.29;
  root.add(topCore);

  // 3. Front Instrument Console Housing + Side Silver Louvered Vents
  const frontHousingGeo = track(new THREE.BoxGeometry(1.18, 1.38, 0.28));
  const frontHousing = new THREE.Mesh(frontHousingGeo, purpleDarkMat);
  frontHousing.position.set(0, 1.12, 0.78);
  frontHousing.castShadow = true;
  root.add(frontHousing);

  const consoleInsetGeo = track(new THREE.BoxGeometry(0.76, 0.92, 0.1));
  const consoleInset = new THREE.Mesh(consoleInsetGeo, darkGunmetalMat);
  consoleInset.position.set(0, 0.98, 0.89);
  root.add(consoleInset);

  // Silver horizontal vent slats flanking lower front console
  const slatGeo = track(new THREE.BoxGeometry(0.18, 0.055, 0.08));
  for (const side of [-1, 1]) {
    for (let s = 0; s < 6; s++) {
      const slat = new THREE.Mesh(slatGeo, chromeSteelMat);
      slat.position.set(side * 0.46, 0.62 + s * 0.11, 0.9);
      root.add(slat);
    }
  }

  // 4. Central Large Red/Blue Split Gauge + Animated Yellow Needle
  const bezelGeo = track(new THREE.TorusGeometry(0.32, 0.045, 12, 32));
  const mainBezel = new THREE.Mesh(bezelGeo, chromeSteelMat);
  mainBezel.position.set(0, 1.05, 0.95);
  root.add(mainBezel);

  const centralGaugeTex = track(createCentralGaugeTexture());
  const dialFaceGeo = track(new THREE.CircleGeometry(0.3, 32));
  const dialFaceMat = track(
    new THREE.MeshBasicMaterial({ map: centralGaugeTex })
  );
  const dialFace = new THREE.Mesh(dialFaceGeo, dialFaceMat);
  dialFace.position.set(0, 1.05, 0.945);
  root.add(dialFace);

  // Yellow pointer arrow needle
  const mainNeedle = new THREE.Group();
  mainNeedle.position.set(0, 1.05, 0.965);
  const needleShaftGeo = track(new THREE.BoxGeometry(0.042, 0.2, 0.02));
  const needleShaft = new THREE.Mesh(needleShaftGeo, yellowCapMat);
  needleShaft.position.y = 0.08;
  mainNeedle.add(needleShaft);
  const needleHeadGeo = track(new THREE.ConeGeometry(0.068, 0.1, 4));
  const needleHead = new THREE.Mesh(needleHeadGeo, yellowCapMat);
  needleHead.position.y = 0.21;
  needleHead.rotation.y = Math.PI / 4;
  mainNeedle.add(needleHead);
  root.add(mainNeedle);

  // 5. Upper Tri-Gauge Cluster + Indicator LEDs
  const topNeedles: THREE.Group[] = [];
  const topCenterTex = track(createTopDialTexture('center'));
  const topSideTex = track(createTopDialTexture('side'));

  const topDials: Array<{
    x: number;
    y: number;
    z: number;
    r: number;
    tex: THREE.CanvasTexture;
    rotY: number;
  }> = [
    { x: 0, y: 1.72, z: 0.91, r: 0.145, tex: topCenterTex, rotY: 0 },
    { x: -0.27, y: 1.64, z: 0.87, r: 0.095, tex: topSideTex, rotY: -0.25 },
    { x: 0.27, y: 1.64, z: 0.87, r: 0.095, tex: topSideTex, rotY: 0.25 },
  ];

  for (const d of topDials) {
    const g = new THREE.Group();
    g.position.set(d.x, d.y, d.z);
    g.rotation.y = d.rotY;

    const rim = new THREE.Mesh(
      track(new THREE.TorusGeometry(d.r, 0.022, 10, 24)),
      chromeSteelMat
    );
    g.add(rim);

    const face = new THREE.Mesh(
      track(new THREE.CircleGeometry(d.r * 0.95, 24)),
      track(new THREE.MeshBasicMaterial({ map: d.tex }))
    );
    face.position.z = 0.005;
    g.add(face);

    const nGroup = new THREE.Group();
    nGroup.position.z = 0.018;
    const nStick = new THREE.Mesh(
      track(new THREE.BoxGeometry(0.018, d.r * 0.72, 0.01)),
      darkGunmetalMat
    );
    nStick.position.y = d.r * 0.28;
    nGroup.add(nStick);
    g.add(nGroup);
    topNeedles.push(nGroup);

    root.add(g);
  }

  // Glowing cyan/amber indicator rivets around upper housing
  const ledGeo = track(new THREE.SphereGeometry(0.036, 12, 12));
  const ledPositions: Array<[number, number, number, number]> = [
    [-0.19, 1.84, 0.89, 0x38e8ff],
    [0.19, 1.84, 0.89, 0x38e8ff],
    [-0.4, 1.56, 0.85, 0xfacc15],
    [0.4, 1.56, 0.85, 0xfacc15],
  ];
  for (const [lx, ly, lz, color] of ledPositions) {
    const ledMat = track(
      new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 1.8,
        roughness: 0.25,
        metalness: 0.1,
      })
    );
    neonSegments.push(ledMat);
    const led = new THREE.Mesh(ledGeo, ledMat);
    led.position.set(lx, ly, lz);
    root.add(led);
  }

  // 6. Twin White Side Gas Cylinders ("DIGI EGG" + Yellow Caps)
  const tankGeo = track(new THREE.CylinderGeometry(0.32, 0.32, 1.54, 24));
  const tankCapGeo = track(new THREE.CylinderGeometry(0.3, 0.34, 0.14, 24));
  const tankValveGeo = track(new THREE.CylinderGeometry(0.12, 0.14, 0.12, 16));
  const tankBaseCollarGeo = track(new THREE.CylinderGeometry(0.35, 0.37, 0.12, 24));

  for (const side of [-1, 1]) {
    const tank = new THREE.Mesh(tankGeo, tankMat);
    tank.position.set(side * 1.16, 1.12, 0.05);
    // Rotate so "DIGI EGG" decal faces forward (+Z)
    tank.rotation.y = side === -1 ? -Math.PI * 0.45 : -Math.PI * 0.55;
    tank.castShadow = true;
    tank.receiveShadow = true;
    root.add(tank);

    const cap = new THREE.Mesh(tankCapGeo, yellowCapMat);
    cap.position.set(side * 1.16, 1.94, 0.05);
    cap.castShadow = true;
    root.add(cap);

    const valve = new THREE.Mesh(tankValveGeo, chromeSteelMat);
    valve.position.set(side * 1.16, 2.04, 0.05);
    root.add(valve);

    const bCollar = new THREE.Mesh(tankBaseCollarGeo, darkGunmetalMat);
    bCollar.position.set(side * 1.16, 0.38, 0.05);
    root.add(bCollar);
  }

  // 7. Curved Metallic Connecting Pipes (TubeGeometry) linking top shoulders to side tanks
  for (const side of [-1, 1]) {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 0.62, 1.95, 0.35),
      new THREE.Vector3(side * 0.96, 2.02, 0.25),
      new THREE.Vector3(side * 1.14, 1.88, 0.12),
    ]);
    const pipeGeo = track(new THREE.TubeGeometry(curve, 16, 0.065, 10, false));
    const pipe = new THREE.Mesh(pipeGeo, darkGunmetalMat);
    pipe.castShadow = true;
    root.add(pipe);

    const lowerCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 0.72, 1.72, 0.52),
      new THREE.Vector3(side * 0.98, 1.66, 0.35),
      new THREE.Vector3(side * 1.14, 1.56, 0.16),
    ]);
    const lowerPipeGeo = track(
      new THREE.TubeGeometry(lowerCurve, 14, 0.048, 8, false)
    );
    root.add(new THREE.Mesh(lowerPipeGeo, chromeSteelMat));
  }

  // 8. Holographic Energy Surge Curtain & Floating Ring (hidden in idle/world so no boxy border)
  const holoBeamGeo = track(
    new THREE.CylinderGeometry(1.42, 1.48, 2.35, 32, 1, true)
  );
  const holoBeamMat = track(
    new THREE.MeshBasicMaterial({
      color: 0x38e8ff,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  const holoBeam = new THREE.Mesh(holoBeamGeo, holoBeamMat);
  holoBeam.position.y = 1.28;
  holoBeam.visible = !worldMode;
  root.add(holoBeam);

  const energyRingGeo = track(new THREE.TorusGeometry(1.54, 0.032, 8, 48));
  const energyRingMat = track(
    new THREE.MeshBasicMaterial({
      color: 0x67e8f9,
      transparent: true,
      opacity: worldMode ? 0 : 0.32,
      blending: THREE.AdditiveBlending,
    })
  );
  const energyRing = new THREE.Mesh(energyRingGeo, energyRingMat);
  energyRing.rotation.x = Math.PI / 2;
  energyRing.position.y = 0.36;
  energyRing.visible = !worldMode;
  root.add(energyRing);

  const coreLight = new THREE.PointLight(0x38e8ff, worldMode ? 1.4 : 2.2, 8, 2);
  coreLight.position.set(0, 1.6, 1.6);
  root.add(coreLight);

  return {
    root,
    mainNeedle,
    topNeedles,
    neonSegments,
    coreLight,
    holoBeamMat,
    energyRing,
    energyRingMat,
    topCoreMat,
    disposables,
  };
}

function updateIncubatorAnimation(
  handles: IncubatorAnimHandles,
  elapsed: number,
  mode: IncubatorVisualMode
) {
  const isHatching = mode === 'hatching';
  const isReinforcing = mode === 'reinforcing';
  const isSuccess = mode === 'success';
  const pulseSpeed = isHatching ? 12 : isReinforcing ? 9 : isSuccess ? 6 : 2.6;
  const pulse = 0.5 + 0.5 * Math.sin(elapsed * pulseSpeed);

  // Main gauge needle sweeps gently in idle, accelerates during hatching
  handles.mainNeedle.rotation.z = isHatching
    ? Math.sin(elapsed * 16) * 1.15
    : isReinforcing
      ? Math.sin(elapsed * 11) * 0.85
      : Math.sin(elapsed * 1.4) * 0.32;

  handles.topNeedles.forEach((n, idx) => {
    n.rotation.z =
      Math.sin(elapsed * (2.1 + idx * 0.7) + idx) *
      (isHatching ? 1.1 : 0.42);
  });

  // Neon pedestal bars & LEDs
  const neonBaseColor = isSuccess ? 0xfde047 : 0x00d8ff;
  const neonEmissive = isHatching
    ? 2.2 + pulse * 1.8
    : isSuccess
      ? 2.5 + pulse * 1.2
      : 1.45 + pulse * 0.65;
  for (let i = 0; i < handles.neonSegments.length; i++) {
    const mat = handles.neonSegments[i];
    if (i < 8) {
      mat.emissive.setHex(neonBaseColor);
      mat.emissiveIntensity = neonEmissive;
    }
  }

  handles.topCoreMat.emissive.setHex(isSuccess ? 0xfacc15 : 0x00d8ff);
  handles.topCoreMat.emissiveIntensity = isHatching
    ? 2.4 + pulse * 1.8
    : 1.3 + pulse * 0.7;

  handles.coreLight.color.setHex(isSuccess ? 0xfacc15 : 0x38e8ff);
  handles.coreLight.intensity = isHatching ? 4.2 + pulse * 2.5 : 2.2 + pulse * 0.8;

  // Holographic curtain & rising scan ring (only surges during active hatch/reinforce)
  handles.holoBeamMat.color.setHex(isSuccess ? 0xfde047 : 0x38e8ff);
  handles.holoBeamMat.opacity = isHatching
    ? 0.22 + pulse * 0.16
    : isReinforcing
      ? 0.18 + pulse * 0.12
      : isSuccess
        ? 0.22
        : 0;

  handles.energyRingMat.color.setHex(isSuccess ? 0xfde047 : 0x67e8f9);
  handles.energyRingMat.opacity = isHatching ? 0.85 : isReinforcing ? 0.65 : 0.28;
  handles.energyRing.position.y =
    0.32 + ((elapsed * (isHatching ? 1.6 : 0.45)) % 1) * 2.05;
  const ringScale = isHatching ? 1.0 + Math.sin(elapsed * 8) * 0.05 : 1.0;
  handles.energyRing.scale.set(ringScale, ringScale, 1);
}

export interface IncubatorPreviewController {
  setMode: (mode: IncubatorVisualMode) => void;
  dispose: () => void;
}

/**
 * Mounts the live interactive 3D Three.js Incubator inside the Chocador de DigiEgg modal.
 */
export function mountIncubatorChamberPreview(
  canvas: HTMLCanvasElement,
  onFallback?: () => void
): IncubatorPreviewController {
  let disposed = false;
  let currentMode: IncubatorVisualMode = 'idle';
  let frameId = 0;

  let renderer: THREE.WebGLRenderer | null = null;
  let envTex: THREE.Texture | null = null;
  let ro: ResizeObserver | null = null;
  let incubator: IncubatorAnimHandles | null = null;
  const isSoftwareGl = detectSoftwareGl();

  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: !isSoftwareGl,
      alpha: true,
      powerPreference: 'default',
    });

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setPixelRatio(
      isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 1.5)
    );
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    envTex = pmremGenerator.fromScene(roomEnv, 0.04).texture;
    roomEnv.dispose();
    scene.environment = envTex;
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 50);
    camera.position.set(0, 1.82, 6.1);
    camera.lookAt(0, 1.15, 0);

    scene.add(new THREE.AmbientLight(0xbbe6ff, 0.85));
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.85);
    keyLight.position.set(3.2, 5.2, 4.5);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38e8ff, 1.35);
    rimLight.position.set(-3.5, 2.5, -2.5);
    scene.add(rimLight);

    incubator = buildDigimonIncubatorGroup({ worldMode: false });
    incubator.root.rotation.y = -0.06;
    scene.add(incubator.root);

    const syncSize = () => {
      if (!renderer || disposed) return;
      const rect = canvas.getBoundingClientRect();
      const w = Math.max(1, Math.round(rect.width));
      const h = Math.max(1, Math.round(rect.height));
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    syncSize();
    ro = new ResizeObserver(syncSize);
    ro.observe(canvas);

    const clock = new THREE.Clock();
    let lastDrawMs = 0;

    function afterDraw(cb: () => void) {
      if (!renderer) return;
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync?.(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      if (!sync) {
        frameId = window.setTimeout(cb, 80);
        return;
      }
      const poll = () => {
        if (disposed) return;
        const state = gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick(now?: number) {
      if (disposed || !renderer || !incubator) return;
      if (document.visibilityState === 'hidden') {
        frameId = requestAnimationFrame(tick);
        return;
      }
      if (!isSoftwareGl && typeof now === 'number' && now - lastDrawMs < 32) {
        frameId = requestAnimationFrame(tick);
        return;
      }
      lastDrawMs = now ?? performance.now();

      try {
        const elapsed = clock.getElapsedTime();
        incubator.root.rotation.y = -0.05 + Math.sin(elapsed * 0.6) * 0.04;
        updateIncubatorAnimation(incubator, elapsed, currentMode);
        renderer.render(scene, camera);
      } catch {
        // Ignore transient WebGL frame errors safely
      }

      if (isSoftwareGl) afterDraw(() => tick());
      else frameId = requestAnimationFrame(tick);
    }

    tick();
  } catch {
    ro?.disconnect();
    if (incubator) {
      for (const d of incubator.disposables) d.dispose();
    }
    envTex?.dispose();
    try {
      renderer?.forceContextLoss?.();
      renderer?.dispose();
    } catch {
      // Ignore cleanup error
    }
    onFallback?.();
    return { setMode: () => {}, dispose: () => {} };
  }

  return {
    setMode: (mode: IncubatorVisualMode) => {
      currentMode = mode;
    },
    dispose: () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      ro?.disconnect();
      if (incubator) {
        for (const d of incubator.disposables) d.dispose();
      }
      envTex?.dispose();
      try {
        renderer?.forceContextLoss?.();
        renderer?.dispose();
      } catch {
        // Ignore cleanup error
      }
    },
  };
}

export interface IncubatorWorldSpriteRenderer {
  getCanvas: (elapsed: number) => HTMLCanvasElement | null;
  dispose: () => void;
}

/**
 * Renders the genuine 3D Three.js Digimon Incubator from the 2.5D DATS isometric camera angle
 * into a generous transparent 320x320 offscreen canvas with zero edge clipping.
 */
export function createIncubatorWorldSpriteRenderer(): IncubatorWorldSpriteRenderer {
  const isSoftwareGl = detectSoftwareGl();
  const offscreen = document.createElement('canvas');
  offscreen.width = 320;
  offscreen.height = 320;

  const snapshot2d = document.createElement('canvas');
  snapshot2d.width = 320;
  snapshot2d.height = 320;
  const snapCtx = snapshot2d.getContext('2d');
  if (!snapCtx) {
    return { getCanvas: () => null, dispose: () => {} };
  }

  let renderer: THREE.WebGLRenderer | null = null;
  let envTex: THREE.Texture | null = null;
  let incubator: IncubatorAnimHandles | null = null;

  try {
    renderer = new THREE.WebGLRenderer({
      canvas: offscreen,
      antialias: !isSoftwareGl,
      alpha: true,
      premultipliedAlpha: false,
      preserveDrawingBuffer: true,
      powerPreference: 'default',
    });

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.22;
    renderer.setPixelRatio(1);
    renderer.setSize(320, 320, false);
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    envTex = pmremGenerator.fromScene(roomEnv, 0.04).texture;
    roomEnv.dispose();
    scene.environment = envTex;
    pmremGenerator.dispose();

    // Isometric-aligned 2.5D perspective with wide transparent margins (zero edge clipping)
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
    camera.position.set(0.24, 3.25, 7.85);
    camera.lookAt(0, 1.08, 0);

    scene.add(new THREE.AmbientLight(0xd8f2ff, 1.05));
    const sun = new THREE.DirectionalLight(0xffffff, 2.05);
    sun.position.set(3.8, 6.5, 4.5);
    scene.add(sun);

    const rim = new THREE.DirectionalLight(0x38e8ff, 1.35);
    rim.position.set(-4.2, 3.2, -2.2);
    scene.add(rim);

    incubator = buildDigimonIncubatorGroup({ worldMode: true });
    incubator.root.rotation.y = -0.08;
    scene.add(incubator.root);

    updateIncubatorAnimation(incubator, 0.85, 'idle');
    renderer.render(scene, camera);
    snapCtx.clearRect(0, 0, 320, 320);
    snapCtx.drawImage(offscreen, 0, 0);
  } catch {
    return { getCanvas: () => null, dispose: () => {} };
  } finally {
    if (incubator) {
      for (const d of incubator.disposables) d.dispose();
    }
    envTex?.dispose();
    try {
      renderer?.forceContextLoss?.();
      renderer?.dispose();
    } catch {
      // Ignore cleanup error
    }
    renderer = null;
    offscreen.width = 0;
    offscreen.height = 0;
  }

  let disposed = false;

  return {
    getCanvas: (_elapsed: number) => {
      if (disposed) return null;
      return snapshot2d;
    },
    dispose: () => {
      disposed = true;
      snapshot2d.width = 0;
      snapshot2d.height = 0;
    },
  };
}
