// Mecânica de Raid Boss: troca de alvo principal a cada 7s + skill em área em todos os atacantes
export const BOSS_TARGET_ROTATION_MS = 7_000;
export const BOSS_AOE_SKILL_COOLDOWN_SEC = 6.5;
export const BOSS_AOE_SKILL_RADIUS_PX = 275;
export const BOSS_AGGRO_DETECT_RADIUS_PX = 285;

export interface RaidBossAttackerCandidate {
  uid: string;
  tamerName: string;
  digimonName: string;
  x: number;
  y: number;
  isLocal: boolean;
}

export interface RaidBossTargetSelection<T extends RaidBossAttackerCandidate> {
  primaryTarget: T | null;
  slotIndex: number;
  swapRemainingSec: number;
  totalAttackers: number;
}

/**
 * Deterministically rotates the Raid Boss primary target every 7 seconds across
 * all currently attacking Digimons so every client stays synchronized.
 */
export function selectRaidBossPrimaryTarget<T extends RaidBossAttackerCandidate>(
  candidates: readonly T[],
  nowMs: number = Date.now(),
  rotationMs: number = BOSS_TARGET_ROTATION_MS
): RaidBossTargetSelection<T> {
  if (candidates.length === 0) {
    return {
      primaryTarget: null,
      slotIndex: 0,
      swapRemainingSec: rotationMs / 1000,
      totalAttackers: 0,
    };
  }
  const sorted = [...candidates].sort((a, b) => a.uid.localeCompare(b.uid));
  const safeRotMs = Math.max(1000, rotationMs);
  const slotIndex = Math.floor(nowMs / safeRotMs) % sorted.length;
  const swapRemainingSec = Number(
    Math.max(0.1, (safeRotMs - (nowMs % safeRotMs)) / 1000).toFixed(1)
  );
  return {
    primaryTarget: sorted[slotIndex],
    slotIndex,
    swapRemainingSec,
    totalAttackers: sorted.length,
  };
}
