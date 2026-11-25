import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createInitialPartnerRuntime,
  getDirectionUnitVector,
  resolvePartnerMovementFacing,
  updatePartnerAI,
  type PartnerRuntimeState,
} from './partnerAI';
import type { CardinalDirection } from '../sprites/tamerRealSheets';

function snapDir(dx: number, dy: number): CardinalDirection {
  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx >= 0 ? 'E' : 'W';
  }
  return dy >= 0 ? 'S' : 'N';
}

/**
 * Matches DIRECTION_CELL_MAP in src/sprites/digimonPartnerSprites.ts:
 * - W & S have flipX: false -> Digimon sprite visually faces LEFT (-x)
 * - E & N have flipX: true  -> Digimon sprite visually faces RIGHT (+x)
 */
function spriteFacesRight(dir: CardinalDirection): boolean {
  return dir === 'E' || dir === 'N';
}

function assertFacingNeverContradictsMovement(
  label: string,
  stepIdx: number,
  partner: PartnerRuntimeState,
  movedX: number,
  movedY: number
): void {
  if (!partner.isMoving) return;

  // Whenever horizontal travel is noticeable, sprite horizontal facing must match movedX
  if (Math.abs(movedX) > 0.45 && Math.abs(movedX) > Math.abs(movedY) * 0.4) {
    const expectedRight = movedX > 0;
    assert.equal(
      spriteFacesRight(partner.dir),
      expectedRight,
      `${label} [tick ${stepIdx}]: partner moved horizontally (${movedX.toFixed(2)}, ${movedY.toFixed(2)}) while dir=${partner.dir} (facesRight=${spriteFacesRight(partner.dir)})`
    );
  }

  // Pure vertical travel must never face opposite vertically
  if (Math.abs(movedY) > 0.45 && Math.abs(movedX) < 0.25) {
    const expectedDir: CardinalDirection = movedY > 0 ? 'S' : 'N';
    assert.equal(
      partner.dir,
      expectedDir,
      `${label} [tick ${stepIdx}]: partner moved vertically (${movedX.toFixed(2)}, ${movedY.toFixed(2)}) while dir=${partner.dir}`
    );
  }
}

function simulateWalkSequence(
  label: string,
  initialDir: CardinalDirection,
  segments: Array<{ dir: CardinalDirection; moving: boolean; durationSec: number }>
): { partner: PartnerRuntimeState; tamerX: number; tamerY: number } {
  let tamerX = 800;
  let tamerY = 800;
  let tamerDir = initialDir;
  const partner = createInitialPartnerRuntime(tamerX, tamerY, initialDir);
  const dt = 1 / 60;
  const tamerSpeed = 165;
  let stepIdx = 0;

  for (const seg of segments) {
    tamerDir = seg.dir;
    const fwd = getDirectionUnitVector(tamerDir);
    const ticks = Math.round(seg.durationSec / dt);

    for (let i = 0; i < ticks; i++) {
      if (seg.moving) {
        tamerX += fwd.x * tamerSpeed * dt;
        tamerY += fwd.y * tamerSpeed * dt;
      }

      const prevX = partner.x;
      const prevY = partner.y;

      updatePartnerAI(partner, {
        dt,
        tamerX,
        tamerY,
        tamerDir,
        tamerMoving: seg.moving,
        isCombatMap: false,
        isInSafeZone: true,
        worldW: 2000,
        worldH: 2000,
        minY: 185,
        colliders: [],
        enemies: [],
        resolveCircleRect: (cx, cy) => [cx, cy],
        snapDir,
        onDealDamage: () => undefined,
      });

      const movedX = partner.x - prevX;
      const movedY = partner.y - prevY;
      assertFacingNeverContradictsMovement(label, stepIdx, partner, movedX, movedY);
      stepIdx += 1;
    }
  }

  return { partner, tamerX, tamerY };
}

test('resolvePartnerMovementFacing aligns horizontal sprite orientation on diagonals', () => {
  assert.equal(resolvePartnerMovementFacing(10, 0, 'S'), 'E');
  assert.equal(resolvePartnerMovementFacing(-10, 0, 'S'), 'W');
  assert.equal(resolvePartnerMovementFacing(0, 10, 'E'), 'S');
  assert.equal(resolvePartnerMovementFacing(0, -10, 'W'), 'N');

  // Diagonal down-right must face RIGHT ('E'), never 'S' (which faces left)
  assert.equal(resolvePartnerMovementFacing(6, 10, 'S'), 'E');
  // Diagonal up-left must face LEFT ('W'), never 'N' (which faces right)
  assert.equal(resolvePartnerMovementFacing(-6, -10, 'N'), 'W');
  // Diagonal down-left & up-right stay consistent with S/N facing
  assert.equal(resolvePartnerMovementFacing(-4, 10, 'S'), 'S');
  assert.equal(resolvePartnerMovementFacing(4, -10, 'N'), 'N');
});

test('partner never moonwalks backwards during 180-degree reversals (E->W, W->E, N->S, S->N)', () => {
  const reversalPairs: Array<[CardinalDirection, CardinalDirection]> = [
    ['E', 'W'],
    ['W', 'E'],
    ['N', 'S'],
    ['S', 'N'],
  ];

  for (const [startDir, reverseDir] of reversalPairs) {
    const label = `${startDir}->${reverseDir}`;
    const { partner, tamerX, tamerY } = simulateWalkSequence(label, startDir, [
      { dir: startDir, moving: true, durationSec: 0.8 },
      { dir: reverseDir, moving: true, durationSec: 2.0 },
    ]);

    assert.equal(
      partner.dir,
      reverseDir,
      `${label}: partner should face ${reverseDir} once steadily trailing behind Tamer`
    );
    assert.equal(
      partner.isMoving,
      true,
      `${label}: partner should actively follow while Tamer keeps walking`
    );

    // Partner should be behind the Tamer along the new walking axis
    const fwd = getDirectionUnitVector(reverseDir);
    const alongFwd = (partner.x - tamerX) * fwd.x + (partner.y - tamerY) * fwd.y;
    assert.ok(
      alongFwd < -20,
      `${label}: partner should trail behind Tamer (alongFwd=${alongFwd.toFixed(1)})`
    );
  }
});

test('partner never moonwalks during 90-degree turns or tap-and-stop reversals', () => {
  const turns: Array<[CardinalDirection, CardinalDirection]> = [
    ['E', 'S'],
    ['E', 'N'],
    ['W', 'S'],
    ['W', 'N'],
    ['S', 'E'],
    ['S', 'W'],
    ['N', 'E'],
    ['N', 'W'],
  ];

  for (const [d1, d2] of turns) {
    const { partner } = simulateWalkSequence(`${d1}->${d2}`, d1, [
      { dir: d1, moving: true, durationSec: 0.7 },
      { dir: d2, moving: true, durationSec: 1.8 },
    ]);
    assert.equal(partner.dir, d2);
  }

  // Tap opposite direction briefly and stop: partner repositions facing its motion, then settles facing Tamer dir
  const { partner } = simulateWalkSequence('E->tapW->stop', 'E', [
    { dir: 'E', moving: true, durationSec: 0.6 },
    { dir: 'W', moving: true, durationSec: 0.2 },
    { dir: 'W', moving: false, durationSec: 1.5 },
  ]);
  assert.equal(partner.aiState, 'IDLE');
  assert.equal(partner.dir, 'W');
});
