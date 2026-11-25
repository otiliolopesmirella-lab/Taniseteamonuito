import assert from 'node:assert/strict';
import test from 'node:test';
import {
  BOSS_TARGET_ROTATION_MS,
  selectRaidBossPrimaryTarget,
  type RaidBossAttackerCandidate,
} from './worldBossRotation';

function makeCandidate(
  uid: string,
  digimonName: string,
  isLocal = false
): RaidBossAttackerCandidate {
  return {
    uid,
    tamerName: `Tamer-${uid}`,
    digimonName,
    x: 1000,
    y: 500,
    isLocal,
  };
}

test('selectRaidBossPrimaryTarget rotates every 7 seconds across attackers in deterministic uid order', () => {
  const candidates = [
    makeCandidate('u3', 'Garurumon'),
    makeCandidate('u1', 'Greymon', true),
    makeCandidate('u2', 'Kabuterimon'),
  ];

  assert.equal(BOSS_TARGET_ROTATION_MS, 7000);

  const slot0 = selectRaidBossPrimaryTarget(candidates, 0);
  assert.equal(slot0.primaryTarget?.uid, 'u1');
  assert.equal(slot0.slotIndex, 0);
  assert.equal(slot0.totalAttackers, 3);
  assert.equal(slot0.swapRemainingSec, 7);

  const slot0Mid = selectRaidBossPrimaryTarget(candidates, 4500);
  assert.equal(slot0Mid.primaryTarget?.uid, 'u1');
  assert.equal(slot0Mid.swapRemainingSec, 2.5);

  const slot1 = selectRaidBossPrimaryTarget(candidates, 7000);
  assert.equal(slot1.primaryTarget?.uid, 'u2');
  assert.equal(slot1.slotIndex, 1);

  const slot2 = selectRaidBossPrimaryTarget(candidates, 14_000);
  assert.equal(slot2.primaryTarget?.uid, 'u3');
  assert.equal(slot2.slotIndex, 2);

  const wrapped = selectRaidBossPrimaryTarget(candidates, 21_000);
  assert.equal(wrapped.primaryTarget?.uid, 'u1');
  assert.equal(wrapped.slotIndex, 0);
});

test('selectRaidBossPrimaryTarget cycles cleanly through 12 attackers and handles empty list', () => {
  const empty = selectRaidBossPrimaryTarget([], 5000);
  assert.equal(empty.primaryTarget, null);
  assert.equal(empty.totalAttackers, 0);

  const twelve = Array.from({ length: 12 }, (_, idx) =>
    makeCandidate(`p-${String(idx).padStart(2, '0')}`, `Digimon-${idx}`)
  );

  const visited = new Set<string>();
  for (let step = 0; step < 12; step++) {
    const sel = selectRaidBossPrimaryTarget(twelve, step * 7000 + 100);
    assert.ok(sel.primaryTarget);
    visited.add(sel.primaryTarget.uid);
  }
  assert.equal(visited.size, 12);
});
