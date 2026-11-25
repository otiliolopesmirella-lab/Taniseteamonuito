import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DMO_HATCH_QUALITY_PROFILES,
  clampHatchSizePct,
  computeHatchPowerMultiplier,
  computeHatchVisualScale,
  computeTotalHatchBonusPct,
  getQualitySizeBonusPct,
  rollHatchSizePct,
} from './itemsCatalog';

test('DMO_HATCH_QUALITY_PROFILES matches exact stage bonuses (3/5: 0%, 4/5: +7%, 5/5: +15%)', () => {
  assert.equal(DMO_HATCH_QUALITY_PROFILES[3].qualityName, 'Normal');
  assert.equal(DMO_HATCH_QUALITY_PROFILES[3].powerBonusPct, 0);
  assert.equal(DMO_HATCH_QUALITY_PROFILES[3].statMultiplier, 1.0);
  assert.equal(DMO_HATCH_QUALITY_PROFILES[3].minSizePct, 80);
  assert.equal(DMO_HATCH_QUALITY_PROFILES[3].maxSizePct, 100);

  assert.equal(DMO_HATCH_QUALITY_PROFILES[4].powerBonusPct, 7);
  assert.equal(DMO_HATCH_QUALITY_PROFILES[4].statMultiplier, 1.07);
  assert.equal(DMO_HATCH_QUALITY_PROFILES[4].minSizePct, 100);
  assert.equal(DMO_HATCH_QUALITY_PROFILES[4].maxSizePct, 120);

  assert.equal(DMO_HATCH_QUALITY_PROFILES[5].powerBonusPct, 15);
  assert.equal(DMO_HATCH_QUALITY_PROFILES[5].statMultiplier, 1.15);
  assert.equal(DMO_HATCH_QUALITY_PROFILES[5].minSizePct, 120);
  assert.equal(DMO_HATCH_QUALITY_PROFILES[5].maxSizePct, 140);
});

test('getQualitySizeBonusPct returns exact tiered bonuses across 80%–140%', () => {
  assert.equal(getQualitySizeBonusPct(80), 0.1);
  assert.equal(getQualitySizeBonusPct(90), 0.1);
  assert.equal(getQualitySizeBonusPct(91), 0.2);
  assert.equal(getQualitySizeBonusPct(100), 0.2);
  assert.equal(getQualitySizeBonusPct(101), 0.3);
  assert.equal(getQualitySizeBonusPct(110), 0.3);
  assert.equal(getQualitySizeBonusPct(111), 0.4);
  assert.equal(getQualitySizeBonusPct(120), 0.4);
  assert.equal(getQualitySizeBonusPct(121), 0.5);
  assert.equal(getQualitySizeBonusPct(130), 0.5);
  assert.equal(getQualitySizeBonusPct(131), 0.6);
  assert.equal(getQualitySizeBonusPct(140), 0.6);
});

test('rollHatchSizePct respects exact inclusive bounds for 3/5, 4/5, and 5/5', () => {
  assert.equal(rollHatchSizePct(3, () => 0), 80);
  assert.equal(rollHatchSizePct(3, () => 0.999999), 100);

  assert.equal(rollHatchSizePct(4, () => 0), 100);
  assert.equal(rollHatchSizePct(4, () => 0.999999), 120);

  assert.equal(rollHatchSizePct(5, () => 0), 120);
  assert.equal(rollHatchSizePct(5, () => 0.999999), 140);
});

test('clampHatchSizePct clamps out-of-range values and falls back to grade default', () => {
  assert.equal(clampHatchSizePct(3, 50), 80);
  assert.equal(clampHatchSizePct(3, 130), 100);
  assert.equal(clampHatchSizePct(3, undefined), 100);

  assert.equal(clampHatchSizePct(4, 90), 100);
  assert.equal(clampHatchSizePct(4, 150), 120);
  assert.equal(clampHatchSizePct(4, undefined), 110);

  assert.equal(clampHatchSizePct(5, 110), 120);
  assert.equal(clampHatchSizePct(5, 180), 140);
  assert.equal(clampHatchSizePct(5, undefined), 130);
});

test('computeHatchPowerMultiplier combines stage bonus and quality tier bonus cleanly', () => {
  assert.equal(computeTotalHatchBonusPct(3, 85), 0.1);
  assert.equal(computeTotalHatchBonusPct(3, 100), 0.2);
  assert.equal(computeTotalHatchBonusPct(4, 100), 7.2);
  assert.equal(computeTotalHatchBonusPct(4, 110), 7.3);
  assert.equal(computeTotalHatchBonusPct(4, 120), 7.4);
  assert.equal(computeTotalHatchBonusPct(5, 120), 15.4);
  assert.equal(computeTotalHatchBonusPct(5, 130), 15.5);
  assert.equal(computeTotalHatchBonusPct(5, 140), 15.6);

  assert.ok(Math.abs(computeHatchPowerMultiplier(3, 80) - 1.001) < 1e-9);
  assert.ok(Math.abs(computeHatchPowerMultiplier(3, 100) - 1.002) < 1e-9);
  assert.ok(Math.abs(computeHatchPowerMultiplier(4, 100) - 1.072) < 1e-9);
  assert.ok(Math.abs(computeHatchPowerMultiplier(4, 120) - 1.074) < 1e-9);
  assert.ok(Math.abs(computeHatchPowerMultiplier(5, 120) - 1.154) < 1e-9);
  assert.ok(Math.abs(computeHatchPowerMultiplier(5, 140) - 1.156) < 1e-9);

  assert.ok(computeHatchPowerMultiplier(4, 100) > computeHatchPowerMultiplier(3, 100));
  assert.ok(computeHatchPowerMultiplier(5, 120) > computeHatchPowerMultiplier(4, 120));
});

test('computeHatchVisualScale scales Digimon smoothly between 80% and 140%', () => {
  assert.ok(Math.abs(computeHatchVisualScale(80) - 0.92) < 1e-9);
  assert.ok(Math.abs(computeHatchVisualScale(100) - 1.0) < 1e-9);
  assert.ok(Math.abs(computeHatchVisualScale(120) - 1.08) < 1e-9);
  assert.ok(Math.abs(computeHatchVisualScale(140) - 1.16) < 1e-9);
});
