import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CHARACTER_SELECT_ROSTER,
  computeSpriteAnimationPose,
  getCharacterProfileById,
  validateCharacterSelectionSubmission,
} from './characterSelectModel';

test('roster contains exactly the 4 required Tamers with strict color and gender mapping', () => {
  assert.equal(CHARACTER_SELECT_ROSTER.length, 4);

  const summary = CHARACTER_SELECT_ROSTER.map((c) => ({
    id: c.id,
    colorName: c.colorName,
    gender: c.gender,
    description: c.description,
  }));

  assert.deepEqual(summary, [
    {
      id: 'kai',
      colorName: 'Azul',
      gender: 'Menino',
      description: 'Tamer Corajoso e Determinado',
    },
    {
      id: 'ren',
      colorName: 'Vermelho',
      gender: 'Menino',
      description: 'Tamer Estratégico e Inteligente',
    },
    {
      id: 'hina',
      colorName: 'Rosa',
      gender: 'Menina',
      description: 'Tamer Alegre e Persistente',
    },
    {
      id: 'yuna',
      colorName: 'Roxo',
      gender: 'Menina',
      description: 'Tamer Sonhadora e Forte',
    },
  ]);

  // Verify Ren uses red neon accent (never blue)
  const ren = getCharacterProfileById('ren');
  assert.ok(ren);
  assert.equal(ren.palette.neonBorder, '#ff3050');
});

test('submission validation blocks missing character or invalid Tamer name', () => {
  const noChar = validateCharacterSelectionSubmission(null, 'TaiKamiya');
  assert.equal(noChar.valid, false);
  assert.equal(noChar.field, 'character');

  const emptyName = validateCharacterSelectionSubmission('kai', '   ');
  assert.equal(emptyName.valid, false);
  assert.equal(emptyName.field, 'tamerName');

  const shortName = validateCharacterSelectionSubmission('ren', 'ab');
  assert.equal(shortName.valid, false);
  assert.equal(shortName.field, 'tamerName');

  const invalidChars = validateCharacterSelectionSubmission('hina', 'Hina@@@');
  assert.equal(invalidChars.valid, false);
  assert.equal(invalidChars.field, 'tamerName');

  const validSubmission = validateCharacterSelectionSubmission('yuna', 'Yuna Star');
  assert.equal(validSubmission.valid, true);
  assert.equal(validSubmission.errorMessage, null);
});

test('sprite animation pose plays walk step right after selection, then breathing idle', () => {
  const justSelected = computeSpriteAnimationPose({
    elapsedSec: 2.0,
    phaseOffsetSec: 0,
    isSelected: true,
    selectionAgeSec: 0.4,
    previewState: 'auto',
    previewDirection: 'S',
    animationsEnabled: true,
  });
  assert.equal(justSelected.state, 'walk');
  assert.ok(justSelected.fps > 6);
  assert.ok(justSelected.auraIntensity >= 0.7);

  const settledIdle = computeSpriteAnimationPose({
    elapsedSec: 2.0,
    phaseOffsetSec: 0,
    isSelected: true,
    selectionAgeSec: 3.0,
    previewState: 'auto',
    previewDirection: 'E',
    animationsEnabled: true,
  });
  assert.equal(settledIdle.state, 'idle');
  assert.equal(settledIdle.direction, 'E');
  assert.ok(settledIdle.fps > 0);
  assert.notEqual(settledIdle.breathScaleY, 1);

  const unselectedAlive = computeSpriteAnimationPose({
    elapsedSec: 1.5,
    phaseOffsetSec: 1.15,
    isSelected: false,
    selectionAgeSec: 0,
    previewState: 'auto',
    previewDirection: 'E',
    animationsEnabled: true,
  });
  assert.equal(unselectedAlive.state, 'idle');
  assert.equal(unselectedAlive.direction, 'S');
  assert.ok(unselectedAlive.fps > 0);
  assert.ok(unselectedAlive.auraIntensity < 0.5);

  const reducedMotion = computeSpriteAnimationPose({
    elapsedSec: 5.0,
    phaseOffsetSec: 0,
    isSelected: true,
    selectionAgeSec: 0.2,
    previewState: 'walk',
    previewDirection: 'S',
    animationsEnabled: false,
  });
  assert.equal(reducedMotion.fps, 0);
  assert.equal(reducedMotion.breathScaleY, 1);
  assert.equal(reducedMotion.hairSwaySkew, 0);
});
