import type { DatsCollider } from '../maps/datsCenterMap';
import type { EnemyMonsterInstance } from '../maps/huntingFieldMap';
import type { CardinalDirection } from '../sprites/tamerRealSheets';
import type { PartnerAIState, PartnerAttackKind } from '../types/digimon';

export interface ActiveCombatEffect {
  id: number;
  kind: PartnerAttackKind;
  attackerX: number;
  attackerY: number;
  targetX: number;
  targetY: number;
  elapsed: number;
  duration: number;
}

export interface FloatingDamageText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  elapsed: number;
  duration: number;
}

export interface PartnerRuntimeState {
  x: number;
  y: number;
  dir: CardinalDirection;
  aiState: PartnerAIState;
  isMoving: boolean;
  frameTime: number;
  frameIndex: number;

  // Target & Combat Cooldowns
  targetEnemyId: string | null;
  searchTimer: number;
  basicCooldown: number;
  special1Cooldown: number;
  special2Cooldown: number;
  basicHitsSinceSkill: number;
  basicComboStep: number;
  activeAttack: {
    kind: PartnerAttackKind;
    targetId: string;
    elapsed: number;
    duration: number;
    damageApplied: boolean;
    facingRight: boolean;
    comboStep?: number;
  } | null;

  // Anti-Stuck & Obstacle Recovery
  stuckCheckTimer: number;
  lastProgressX: number;
  lastProgressY: number;
  recoverTimer: number;
  recoverVx: number;
  recoverVy: number;
  recoverNextState: 'FOLLOW' | 'CHASE' | 'RETURN';
  recoverFailCount: number;
  ignoredEnemyId: string | null;
  ignoredEnemyTimer: number;
}

export interface PartnerTickContext {
  dt: number;
  tamerX: number;
  tamerY: number;
  tamerDir: CardinalDirection;
  tamerMoving: boolean;
  tamerSpeed?: number;
  isCombatMap: boolean;
  isInSafeZone: boolean;
  worldW: number;
  worldH: number;
  minY?: number;
  colliders: readonly DatsCollider[];
  enemies: EnemyMonsterInstance[];
  speedMult?: number;
  partnerSizeOffset?: number;
  basicHitIntervalSec?: number;
  special1CooldownSec?: number;
  special2CooldownSec?: number;
  canUseSpecial1?: boolean;
  canUseSpecial2?: boolean;
  onConsumeSpecialDs?: (kind: 'special1' | 'special2') => boolean;
  resolveCircleRect: (
    cx: number,
    cy: number,
    radius: number,
    rect: DatsCollider
  ) => [number, number];
  snapDir: (dx: number, dy: number) => CardinalDirection;
  onDealDamage: (
    enemy: EnemyMonsterInstance,
    kind: PartnerAttackKind,
    amount: number
  ) => void;
}

const PARTNER_RADIUS = 14;
const FOLLOW_SPEED = 186;
const CHASE_SPEED = 228;
const RETURN_SPEED = 252;

// Natural 1–2m follow spacing + Leash bounds
const PREFERRED_FOLLOW_DIST = 64;
const FOLLOW_START_THRESHOLD = 78;
const FOLLOW_SETTLE_THRESHOLD = 52;
const MIN_TAMER_SEPARATION = 42;
const MAX_CHASE_LEASH_FROM_TAMER = 340;
const HARD_TELEPORT_RECOVERY_DIST = 540;

export function createInitialPartnerRuntime(
  spawnX: number,
  spawnY: number,
  dir: CardinalDirection
): PartnerRuntimeState {
  const offset = getTrailingSlot(spawnX, spawnY, dir);
  return {
    x: offset.x,
    y: offset.y,
    dir,
    aiState: 'IDLE',
    isMoving: false,
    frameTime: 0,
    frameIndex: 0,
    targetEnemyId: null,
    searchTimer: 0,
    basicCooldown: 0,
    special1Cooldown: 1.5,
    special2Cooldown: 4.0,
    basicHitsSinceSkill: 0,
    basicComboStep: 0,
    activeAttack: null,
    stuckCheckTimer: 0,
    lastProgressX: offset.x,
    lastProgressY: offset.y,
    recoverTimer: 0,
    recoverVx: 0,
    recoverVy: 0,
    recoverNextState: 'FOLLOW',
    recoverFailCount: 0,
    ignoredEnemyId: null,
    ignoredEnemyTimer: 0,
  };
}

export function getDirectionUnitVector(
  dir: CardinalDirection
): { x: number; y: number } {
  if (dir === 'N') return { x: 0, y: -1 };
  if (dir === 'S') return { x: 0, y: 1 };
  if (dir === 'E') return { x: 1, y: 0 };
  return { x: -1, y: 0 };
}

/**
 * Resolves a Digimon's sprite facing direction from its actual movement vector.
 * Since all Digimon sheets face 3/4 front-left natively (W/S = flipX:false, E/N = flipX:true),
 * significant horizontal motion always takes priority over opposing vertical-slot flips
 * so the Digimon never moonwalks or looks opposite to its travel direction.
 */
export function resolvePartnerMovementFacing(
  dx: number,
  dy: number,
  fallbackDir: CardinalDirection
): CardinalDirection {
  const absX = Math.abs(dx);
  const absY = Math.abs(dy);
  if (absX < 0.05 && absY < 0.05) {
    return fallbackDir;
  }

  if (absX >= absY) {
    return dx >= 0 ? 'E' : 'W';
  }

  if (dy > 0) {
    // 'S' renders facing 3/4 left (flipX: false); if moving noticeably right, face 'E'
    return dx > absY * 0.35 ? 'E' : 'S';
  }

  // 'N' renders facing 3/4 right (flipX: true); if moving noticeably left, face 'W'
  return dx < -absY * 0.35 ? 'W' : 'N';
}

/**
 * Returns true when the Tamer has reversed direction toward the partner and the trailing
 * slot now lies behind the partner relative to the Tamer's movement. Holding briefly while
 * the Tamer passes prevents the Digimon from running backwards across the Tamer's path.
 */
export function shouldPartnerYieldForTamerReversal(params: {
  tamerX: number;
  tamerY: number;
  tamerDir: CardinalDirection;
  tamerMoving: boolean;
  partnerX: number;
  partnerY: number;
  slotX: number;
  slotY: number;
  sizeOffset?: number;
}): boolean {
  if (!params.tamerMoving) return false;
  const sizeOffset = params.sizeOffset ?? 0;
  const fwd = getDirectionUnitVector(params.tamerDir);
  const slotDx = params.slotX - params.partnerX;
  const slotDy = params.slotY - params.partnerY;
  const slotAlongFwd = slotDx * fwd.x + slotDy * fwd.y;
  if (slotAlongFwd > 0) return false;

  const relX = params.partnerX - params.tamerX;
  const relY = params.partnerY - params.tamerY;
  const distToTamer = Math.hypot(relX, relY);
  const alongPerp = Math.abs(relX * -fwd.y + relY * fwd.x);
  return distToTamer <= 180 + sizeOffset && alongPerp <= 95 + sizeOffset;
}

export function getTrailingSlot(
  tamerX: number,
  tamerY: number,
  dir: CardinalDirection,
  sizeOffset = 0
): { x: number; y: number } {
  // Natural trailing offset beside/behind Tamer that expands cleanly for Champion/Ultimate/Mega
  if (dir === 'N') return { x: tamerX - (38 + sizeOffset * 0.75), y: tamerY + (52 + sizeOffset * 0.55) };
  if (dir === 'S') return { x: tamerX + (46 + sizeOffset * 0.9), y: tamerY - (38 + sizeOffset * 0.45) };
  if (dir === 'E') return { x: tamerX - (58 + sizeOffset * 0.95), y: tamerY + 14 };
  return { x: tamerX + (58 + sizeOffset * 0.95), y: tamerY + 14 };
}

function movePartnerWithCollisions(
  partner: PartnerRuntimeState,
  dx: number,
  dy: number,
  speed: number,
  ctx: PartnerTickContext
): { moved: number; movedX: number; movedY: number } {
  const dist = Math.hypot(dx, dy);
  if (dist < 0.001) return { moved: 0, movedX: 0, movedY: 0 };

  const step = Math.min(dist, speed * ctx.dt);
  const prevX = partner.x;
  const prevY = partner.y;

  const minY = ctx.minY ?? 185;
  let nx = Math.max(
    42,
    Math.min(ctx.worldW - 42, partner.x + (dx / dist) * step)
  );
  let ny = Math.max(
    minY,
    Math.min(ctx.worldH - 42, partner.y + (dy / dist) * step)
  );

  for (const col of ctx.colliders) {
    const [rx, ry] = ctx.resolveCircleRect(nx, ny, PARTNER_RADIUS, col);
    nx = rx;
    ny = ry;
  }

  // Keep comfortable personal space from Tamer proportional to evolution body size
  const minSep = MIN_TAMER_SEPARATION + (ctx.partnerSizeOffset ?? 0) * 0.85;
  const tx = nx - ctx.tamerX;
  const ty = ny - ctx.tamerY;
  const tDist = Math.hypot(tx, ty);
  if (tDist > 0.001 && tDist < minSep && partner.aiState !== 'ATTACK') {
    const push = (minSep - tDist) * 0.45;
    nx += (tx / tDist) * push;
    ny += (ty / tDist) * push;
  }

  partner.x = nx;
  partner.y = ny;
  const movedX = nx - prevX;
  const movedY = ny - prevY;
  return { moved: Math.hypot(movedX, movedY), movedX, movedY };
}

function pickBestDetourVector(
  px: number,
  py: number,
  goalX: number,
  goalY: number,
  colliders: readonly DatsCollider[],
  resolveCircleRect: PartnerTickContext['resolveCircleRect']
): { vx: number; vy: number } {
  const baseAngle = Math.atan2(goalY - py, goalX - px);
  const candidates = [Math.PI / 2, -Math.PI / 2, Math.PI * 0.65, -Math.PI * 0.65];

  let bestScore = -1;
  let bestVx = Math.cos(baseAngle + Math.PI / 2);
  let bestVy = Math.sin(baseAngle + Math.PI / 2);

  for (const offset of candidates) {
    const a = baseAngle + offset;
    const vx = Math.cos(a);
    const vy = Math.sin(a);
    let tx = px + vx * 34;
    let ty = py + vy * 34;
    for (const col of colliders) {
      const [rx, ry] = resolveCircleRect(tx, ty, PARTNER_RADIUS, col);
      tx = rx;
      ty = ry;
    }
    const clearance = Math.hypot(tx - px, ty - py);
    if (clearance > bestScore) {
      bestScore = clearance;
      bestVx = vx;
      bestVy = vy;
    }
  }
  return { vx: bestVx, vy: bestVy };
}

// Auto-targeting helper removed: Partner Digimon only attacks enemies explicitly clicked by the player.


/**
 * Updates the 7-state Autonomous Digimon Partner AI:
 * IDLE -> FOLLOW -> SEARCH -> CHASE -> ATTACK -> RETURN -> RECOVER
 */
export function updatePartnerAI(
  partner: PartnerRuntimeState,
  ctx: PartnerTickContext
): void {
  const { dt } = ctx;

  partner.basicCooldown = Math.max(0, partner.basicCooldown - dt);
  partner.special1Cooldown = Math.max(0, partner.special1Cooldown - dt);
  partner.special2Cooldown = Math.max(0, partner.special2Cooldown - dt);
  if (partner.ignoredEnemyTimer > 0) {
    partner.ignoredEnemyTimer = Math.max(0, partner.ignoredEnemyTimer - dt);
    if (partner.ignoredEnemyTimer === 0) partner.ignoredEnemyId = null;
  }

  const sizeOffset = ctx.partnerSizeOffset ?? 0;
  const distToTamer = Math.hypot(partner.x - ctx.tamerX, partner.y - ctx.tamerY);
  const slot = getTrailingSlot(ctx.tamerX, ctx.tamerY, ctx.tamerDir, sizeOffset);
  const minY = ctx.minY ?? 190;
  const clampedSlotX = Math.max(48, Math.min(ctx.worldW - 48, slot.x));
  const clampedSlotY = Math.max(minY, Math.min(ctx.worldH - 48, slot.y));
  const distToSlot = Math.hypot(clampedSlotX - partner.x, clampedSlotY - partner.y);

  // Absolute emergency fallback if somehow warped far off-screen
  if (distToTamer > HARD_TELEPORT_RECOVERY_DIST) {
    partner.x = clampedSlotX;
    partner.y = clampedSlotY;
    partner.activeAttack = null;
    partner.targetEnemyId = null;
    partner.aiState = 'IDLE';
    return;
  }

  // DATS Center or Safe Zone: abort active combat and stick to Tamer
  // (keep targetEnemyId if player clicked an enemy outside while walking out of the safe zone)
  if (!ctx.isCombatMap) {
    partner.targetEnemyId = null;
    partner.activeAttack = null;
    if (partner.aiState === 'SEARCH' || partner.aiState === 'CHASE' || partner.aiState === 'ATTACK') {
      partner.aiState = 'RETURN';
    }
  } else if (ctx.isInSafeZone) {
    partner.activeAttack = null;
    if (partner.aiState === 'SEARCH' || partner.aiState === 'CHASE' || partner.aiState === 'ATTACK') {
      partner.targetEnemyId = null;
      partner.aiState = 'RETURN';
    }
  }

  // Check active attack swing completion
  if (partner.activeAttack) {
    partner.activeAttack.elapsed += dt;
    const target = ctx.enemies.find((e) => e.id === partner.activeAttack?.targetId);
    const hitPoint = partner.activeAttack.duration * 0.42;
    if (!partner.activeAttack.damageApplied && partner.activeAttack.elapsed >= hitPoint) {
      partner.activeAttack.damageApplied = true;
      if (target && target.alive && target.disposition === 'enemy') {
        const dmg =
          partner.activeAttack.kind === 'special2'
            ? 54
            : partner.activeAttack.kind === 'special1'
              ? 38
              : 22;
        ctx.onDealDamage(target, partner.activeAttack.kind, dmg);
      }
    }
    if (partner.activeAttack.elapsed >= partner.activeAttack.duration) {
      partner.activeAttack = null;
    } else {
      partner.isMoving = false;
      return;
    }
  }

  // Distance Leash Check: If Tamer moved too far away during CHASE or ATTACK, return!
  if (
    (partner.aiState === 'CHASE' || partner.aiState === 'ATTACK') &&
    distToTamer > MAX_CHASE_LEASH_FROM_TAMER
  ) {
    partner.targetEnemyId = null;
    partner.aiState = 'RETURN';
  }

  // State Machine Dispatch
  switch (partner.aiState) {
    case 'IDLE': {
      partner.isMoving = false;
      partner.dir = ctx.tamerDir;
      partner.frameIndex = 0;

      if (ctx.tamerMoving || distToSlot > FOLLOW_START_THRESHOLD) {
        partner.aiState = 'FOLLOW';
        break;
      }

      // Only engage if the player explicitly clicked an enemy target
      if (ctx.isCombatMap && !ctx.isInSafeZone && partner.targetEnemyId) {
        const selectedTarget = ctx.enemies.find(
          (e) =>
            e.id === partner.targetEnemyId &&
            e.alive &&
            e.disposition === 'enemy' &&
            Math.hypot(e.x - ctx.tamerX, e.y - ctx.tamerY) <= MAX_CHASE_LEASH_FROM_TAMER
        );
        if (selectedTarget) {
          partner.aiState = 'CHASE';
          partner.recoverFailCount = 0;
          break;
        }
      }
      break;
    }

    case 'FOLLOW': {
      // Only engage if the player explicitly clicked an enemy target
      if (ctx.isCombatMap && !ctx.isInSafeZone && partner.targetEnemyId) {
        const selectedTarget = ctx.enemies.find(
          (e) =>
            e.id === partner.targetEnemyId &&
            e.alive &&
            e.disposition === 'enemy' &&
            Math.hypot(e.x - ctx.tamerX, e.y - ctx.tamerY) <= MAX_CHASE_LEASH_FROM_TAMER
        );
        if (selectedTarget) {
          partner.aiState = 'CHASE';
          partner.recoverFailCount = 0;
          break;
        }
      }

      if (distToSlot <= FOLLOW_SETTLE_THRESHOLD && !ctx.tamerMoving) {
        partner.aiState = 'IDLE';
        partner.isMoving = false;
        partner.dir = ctx.tamerDir;
        break;
      }

      if (
        shouldPartnerYieldForTamerReversal({
          tamerX: ctx.tamerX,
          tamerY: ctx.tamerY,
          tamerDir: ctx.tamerDir,
          tamerMoving: ctx.tamerMoving,
          partnerX: partner.x,
          partnerY: partner.y,
          slotX: clampedSlotX,
          slotY: clampedSlotY,
          sizeOffset,
        })
      ) {
        // Wait smoothly facing the Tamer's new direction while the Tamer passes by
        partner.isMoving = false;
        partner.dir = ctx.tamerDir;
        partner.stuckCheckTimer = 0;
        partner.lastProgressX = partner.x;
        partner.lastProgressY = partner.y;
        break;
      }

      const spdMult = ctx.speedMult ?? 1;
      const baseFollowSpeed = Math.max(
        FOLLOW_SPEED,
        ctx.tamerMoving && ctx.tamerSpeed ? ctx.tamerSpeed * 1.04 : FOLLOW_SPEED
      );
      const baseReturnSpeed = Math.max(RETURN_SPEED, baseFollowSpeed * 1.18);
      const speed = (distToTamer > 150 ? baseReturnSpeed : baseFollowSpeed) * spdMult;
      const moveRes = movePartnerWithCollisions(
        partner,
        clampedSlotX - partner.x,
        clampedSlotY - partner.y,
        speed,
        ctx
      );
      partner.isMoving = moveRes.moved > 0.2;
      if (moveRes.moved > 0.35) {
        partner.dir = resolvePartnerMovementFacing(
          moveRes.movedX,
          moveRes.movedY,
          ctx.tamerDir
        );
      } else if (ctx.tamerMoving) {
        partner.dir = ctx.tamerDir;
      }

      // Stuck detection -> RECOVER
      partner.stuckCheckTimer += dt;
      if (partner.stuckCheckTimer >= 0.28) {
        const progress = Math.hypot(
          partner.x - partner.lastProgressX,
          partner.y - partner.lastProgressY
        );
        partner.lastProgressX = partner.x;
        partner.lastProgressY = partner.y;
        partner.stuckCheckTimer = 0;
        if (distToSlot > 72 && progress < 5) {
          const detour = pickBestDetourVector(
            partner.x,
            partner.y,
            clampedSlotX,
            clampedSlotY,
            ctx.colliders,
            ctx.resolveCircleRect
          );
          partner.recoverVx = detour.vx;
          partner.recoverVy = detour.vy;
          partner.recoverTimer = 0.42;
          partner.recoverNextState = 'FOLLOW';
          partner.aiState = 'RECOVER';
        }
      }
      break;
    }

    case 'SEARCH': {
      // Never auto-target other wild Digimons; return to Tamer unless a clicked target is active
      partner.isMoving = false;
      const selectedTarget =
        ctx.isCombatMap && !ctx.isInSafeZone && partner.targetEnemyId
          ? ctx.enemies.find(
              (e) =>
                e.id === partner.targetEnemyId &&
                e.alive &&
                e.disposition === 'enemy'
            )
          : undefined;
      if (selectedTarget) {
        partner.aiState = 'CHASE';
        partner.recoverFailCount = 0;
      } else {
        partner.targetEnemyId = null;
        partner.aiState = distToSlot > PREFERRED_FOLLOW_DIST ? 'RETURN' : 'IDLE';
      }
      break;
    }

    case 'CHASE': {
      const target = ctx.enemies.find(
        (e) => e.id === partner.targetEnemyId && e.alive && e.disposition === 'enemy'
      );
      if (!target) {
        partner.targetEnemyId = null;
        partner.aiState = distToSlot > FOLLOW_SETTLE_THRESHOLD ? 'RETURN' : 'IDLE';
        break;
      }

      const targetFromTamer = Math.hypot(target.x - ctx.tamerX, target.y - ctx.tamerY);
      if (targetFromTamer > MAX_CHASE_LEASH_FROM_TAMER) {
        partner.targetEnemyId = null;
        partner.aiState = 'RETURN';
        break;
      }

      const dx = target.x - partner.x;
      const dy = target.y - partner.y;
      const dist = Math.hypot(dx, dy);

      const bossBonus = target.isBoss ? 36 : 0;
      const engageDist = 64 + sizeOffset * 0.7 + bossBonus;
      if (dist <= engageDist) {
        partner.aiState = 'ATTACK';
        partner.isMoving = false;
        partner.basicHitsSinceSkill = 0;
        partner.dir = resolvePartnerMovementFacing(dx, dy, partner.dir);
        break;
      }

      const spdMult = ctx.speedMult ?? 1;
      const moveRes = movePartnerWithCollisions(partner, dx, dy, CHASE_SPEED * spdMult, ctx);
      partner.isMoving = moveRes.moved > 0.2;
      if (partner.isMoving) {
        partner.dir = resolvePartnerMovementFacing(moveRes.movedX, moveRes.movedY, partner.dir);
      }

      // Obstacle Avoidance check -> RECOVER
      partner.stuckCheckTimer += dt;
      if (partner.stuckCheckTimer >= 0.26) {
        const progress = Math.hypot(
          partner.x - partner.lastProgressX,
          partner.y - partner.lastProgressY
        );
        partner.lastProgressX = partner.x;
        partner.lastProgressY = partner.y;
        partner.stuckCheckTimer = 0;
        if (progress < 5) {
          partner.recoverFailCount += 1;
          if (partner.recoverFailCount >= 2) {
            // Unreachable behind obstacles -> drop clicked target cleanly and return to Tamer
            partner.ignoredEnemyId = target.id;
            partner.ignoredEnemyTimer = 4.0;
            partner.targetEnemyId = null;
            partner.aiState = distToSlot > FOLLOW_SETTLE_THRESHOLD ? 'RETURN' : 'IDLE';
          } else {
            const detour = pickBestDetourVector(
              partner.x,
              partner.y,
              target.x,
              target.y,
              ctx.colliders,
              ctx.resolveCircleRect
            );
            partner.recoverVx = detour.vx;
            partner.recoverVy = detour.vy;
            partner.recoverTimer = 0.45;
            partner.recoverNextState = 'CHASE';
            partner.aiState = 'RECOVER';
          }
        }
      }
      break;
    }

    case 'ATTACK': {
      const target = ctx.enemies.find(
        (e) => e.id === partner.targetEnemyId && e.alive && e.disposition === 'enemy'
      );
      if (!target) {
        partner.targetEnemyId = null;
        partner.aiState = distToSlot > FOLLOW_SETTLE_THRESHOLD ? 'RETURN' : 'IDLE';
        break;
      }

      const dx = target.x - partner.x;
      const dy = target.y - partner.y;
      const dist = Math.hypot(dx, dy);
      partner.dir = resolvePartnerMovementFacing(dx, dy, partner.dir);
      partner.isMoving = false;

      const bossBonus = target.isBoss ? 36 : 0;
      if (dist > 88 + sizeOffset * 0.8 + bossBonus) {
        partner.aiState = 'CHASE';
        break;
      }

      // Authentic Digimon RPG Combat Flow:
      // Always weave at least 2 physical melee Hits before unleashing F1 / F2 powers!
      let chosenKind: PartnerAttackKind | null = null;
      const s1Allowed = ctx.canUseSpecial1 ?? true;
      const s2Allowed = ctx.canUseSpecial2 ?? true;
      const hitInterval = ctx.basicHitIntervalSec ?? 0.92;
      const cd1 = ctx.special1CooldownSec ?? 4.5;
      const cd2 = ctx.special2CooldownSec ?? 9.5;
      const readyForAutoSkill = partner.basicHitsSinceSkill >= 2;

      if (readyForAutoSkill && partner.special1Cooldown <= 0 && s1Allowed) {
        if (!ctx.onConsumeSpecialDs || ctx.onConsumeSpecialDs('special1')) {
          chosenKind = 'special1';
          partner.special1Cooldown = cd1;
          partner.basicCooldown = Math.max(0.75, hitInterval * 0.95);
          partner.basicHitsSinceSkill = 0;
        }
      }
      if (!chosenKind && readyForAutoSkill && partner.special2Cooldown <= 0 && s2Allowed) {
        if (!ctx.onConsumeSpecialDs || ctx.onConsumeSpecialDs('special2')) {
          chosenKind = 'special2';
          partner.special2Cooldown = cd2;
          partner.basicCooldown = Math.max(0.85, hitInterval);
          partner.basicHitsSinceSkill = 0;
        }
      }
      if (!chosenKind && partner.basicCooldown <= 0) {
        chosenKind = 'basic';
        partner.basicCooldown = hitInterval;
        partner.basicHitsSinceSkill += 1;
        partner.basicComboStep = (partner.basicComboStep + 1) % 3;
      }

      if (chosenKind) {
        partner.activeAttack = {
          kind: chosenKind,
          targetId: target.id,
          elapsed: 0,
          duration: chosenKind === 'basic' ? 0.34 : 0.56,
          damageApplied: false,
          facingRight: target.x >= partner.x,
          comboStep: partner.basicComboStep,
        };
      }
      break;
    }

    case 'RETURN': {
      partner.targetEnemyId = null;
      if (distToSlot <= FOLLOW_SETTLE_THRESHOLD) {
        partner.aiState = ctx.tamerMoving ? 'FOLLOW' : 'IDLE';
        partner.isMoving = false;
        break;
      }

      const returnSpd = Math.max(
        RETURN_SPEED,
        ctx.tamerSpeed ? ctx.tamerSpeed * 1.22 : RETURN_SPEED
      );
      const moveRes = movePartnerWithCollisions(
        partner,
        clampedSlotX - partner.x,
        clampedSlotY - partner.y,
        returnSpd,
        ctx
      );
      partner.isMoving = moveRes.moved > 0.2;
      if (partner.isMoving) {
        partner.dir = resolvePartnerMovementFacing(
          moveRes.movedX,
          moveRes.movedY,
          ctx.tamerDir
        );
      }

      partner.stuckCheckTimer += dt;
      if (partner.stuckCheckTimer >= 0.28) {
        const progress = Math.hypot(
          partner.x - partner.lastProgressX,
          partner.y - partner.lastProgressY
        );
        partner.lastProgressX = partner.x;
        partner.lastProgressY = partner.y;
        partner.stuckCheckTimer = 0;
        if (progress < 5) {
          const detour = pickBestDetourVector(
            partner.x,
            partner.y,
            clampedSlotX,
            clampedSlotY,
            ctx.colliders,
            ctx.resolveCircleRect
          );
          partner.recoverVx = detour.vx;
          partner.recoverVy = detour.vy;
          partner.recoverTimer = 0.45;
          partner.recoverNextState = 'RETURN';
          partner.aiState = 'RECOVER';
        }
      }
      break;
    }

    case 'RECOVER': {
      partner.recoverTimer -= dt;
      const moveRes = movePartnerWithCollisions(
        partner,
        partner.recoverVx,
        partner.recoverVy,
        CHASE_SPEED,
        ctx
      );
      partner.isMoving = moveRes.moved > 0.2;
      if (partner.isMoving) {
        partner.dir = resolvePartnerMovementFacing(
          moveRes.movedX,
          moveRes.movedY,
          partner.dir
        );
      }
      if (partner.recoverTimer <= 0) {
        partner.aiState = partner.recoverNextState;
        partner.lastProgressX = partner.x;
        partner.lastProgressY = partner.y;
        partner.stuckCheckTimer = 0;
      }
      break;
    }
  }

  // Advance running animation frames briskly
  if (partner.isMoving) {
    partner.frameTime += dt;
    if (partner.frameTime >= 1 / 12.5) {
      partner.frameTime = 0;
      partner.frameIndex = (partner.frameIndex + 1) % 4;
    }
  } else {
    partner.frameTime = 0;
    partner.frameIndex = 0;
  }
}

export type ManualSkillResult =
  | { ok: true; targetName: string }
  | {
      ok: false;
      reason:
        | 'safe-zone'
        | 'cooldown'
        | 'low-ds'
        | 'no-target'
        | 'out-of-range'
        | 'busy';
    };

export function triggerPartnerManualSkill(
  partner: PartnerRuntimeState,
  params: {
    kind: 'special1' | 'special2';
    tamerX: number;
    tamerY: number;
    isCombatMap: boolean;
    isInSafeZone: boolean;
    enemies: EnemyMonsterInstance[];
    hasEnoughDs: boolean;
    cooldownSec?: number;
    snapDir: (dx: number, dy: number) => CardinalDirection;
    onConsumeDs: () => void;
  }
): ManualSkillResult {
  if (!params.isCombatMap || params.isInSafeZone) {
    return { ok: false, reason: 'safe-zone' };
  }
  const cd =
    params.kind === 'special1'
      ? partner.special1Cooldown
      : partner.special2Cooldown;
  if (cd > 0) {
    return { ok: false, reason: 'cooldown' };
  }
  if (!params.hasEnoughDs) {
    return { ok: false, reason: 'low-ds' };
  }
  if (partner.activeAttack) {
    return { ok: false, reason: 'busy' };
  }

  // Only use skills on the enemy the player explicitly clicked to attack
  const target = params.enemies.find(
    (e) => e.id === partner.targetEnemyId && e.alive && e.disposition === 'enemy'
  );

  if (!target) {
    partner.targetEnemyId = null;
    return { ok: false, reason: 'no-target' };
  }

  const distToTarget = Math.hypot(target.x - partner.x, target.y - partner.y);
  if (distToTarget > 125 + (target.isBoss ? 40 : 0)) {
    partner.aiState = 'CHASE';
    return { ok: false, reason: 'out-of-range' };
  }

  params.onConsumeDs();
  if (params.kind === 'special1') {
    partner.special1Cooldown = params.cooldownSec ?? 4.5;
  } else {
    partner.special2Cooldown = params.cooldownSec ?? 9.5;
  }
  partner.basicCooldown = 0.85;
  partner.basicHitsSinceSkill = 0;
  partner.aiState = 'ATTACK';
  partner.isMoving = false;
  partner.dir = params.snapDir(target.x - partner.x, target.y - partner.y);
  partner.activeAttack = {
    kind: params.kind,
    targetId: target.id,
    elapsed: 0,
    duration: 0.56,
    damageApplied: false,
    facingRight: target.x >= partner.x,
  };

  return { ok: true, targetName: target.name };
}

