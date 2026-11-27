import test from 'node:test';
import assert from 'node:assert/strict';
import {
  advanceToNextDay,
  awardXp,
  buildContextClozeOptions,
  buildHotbarItems,
  buildWordStrikeOptions,
  calculateBossDamage,
  canCraftRecipe,
  canStandAt,
  checkSentenceOrder,
  checkSpellingWord,
  consumeItem,
  craftRecipe,
  createNewSaveState,
  discoverVocab,
  getDashStaminaCost,
  getPlayerMoveSpeed,
  getPlayerSwordDamage,
  getPortraitMood,
  getTimeOfDayFromProgress,
  getWordStrikeDamage,
  interactWithFarmPlot,
  isPlayerBehindStonePillar,
  isPlayerOnBlueRune,
  NORMAL_ATTACK_DAMAGE,
  purchaseGearUpgrade,
  recordVocabCorrect,
  WORD_STRIKE_DAMAGE,
} from './rules';
import { BOSS_ARENA, getZoneForTileX, PLAYER_SPAWN, TILE_SIZE } from '../data/mapData';
import { GEAR_UPGRADES, RECIPES } from '../data/contentData';

test('new save state spawns player on open Homestead tile with starter inventory & Lv1 upgrades', () => {
  const state = createNewSaveState();
  assert.equal(state.day, 1);
  assert.equal(state.weather, 'sunny');
  assert.equal(state.player.hp, 100);
  assert.equal(state.player.stamina, 100);
  assert.equal(state.farmPlots.length, 12);
  assert.equal(state.upgrades.swordLevel, 1);
  assert.equal(state.upgrades.wateringCanLevel, 1);
  assert.equal(state.upgrades.bootsLevel, 1);
  assert.equal(getZoneForTileX(PLAYER_SPAWN.tileX), 'homestead');
  assert.equal(canStandAt(state.player.x, state.player.y, 12, 10, false), true);
  assert.ok((state.inventory.sunberry_seed || 0) >= 2);
});

test('zone boundaries and sealed ruins gate collision work accurately', () => {
  assert.equal(getZoneForTileX(10), 'homestead');
  assert.equal(getZoneForTileX(22), 'woods');
  assert.equal(getZoneForTileX(40), 'ruins');

  const gateCenterX = 34 * TILE_SIZE + TILE_SIZE / 2;
  const gateCenterY = 17 * TILE_SIZE + TILE_SIZE / 2;
  assert.equal(canStandAt(gateCenterX, gateCenterY, 10, 10, false), false);
  assert.equal(canStandAt(gateCenterX, gateCenterY, 10, 10, true), true);
});

test('farming lifecycle tills, plants, waters (including 3x3 Silver Can), grows on sleep, and harvests', () => {
  const state = createNewSaveState();
  const plot = state.farmPlots[0];
  const neighbor = state.farmPlots[1];

  const r1 = interactWithFarmPlot(plot, 'sunberry_seed', state.inventory, state.player.stamina, 'sunny');
  assert.equal(r1.action, 'tilled');
  interactWithFarmPlot(neighbor, 'sunberry_seed', state.inventory, state.player.stamina, 'sunny');

  const r2 = interactWithFarmPlot(plot, 'sunberry_seed', state.inventory, state.player.stamina, 'sunny');
  assert.equal(r2.action, 'planted');
  interactWithFarmPlot(neighbor, 'sunberry_seed', state.inventory, state.player.stamina, 'sunny');

  // Silver Watering Can Lv2 waters neighboring planted plots in 3x3 radius
  const r3 = interactWithFarmPlot(plot, 'sunberry_seed', state.inventory, state.player.stamina, 'sunny', state.farmPlots, 2);
  assert.equal(r3.action, 'watered');
  assert.equal(plot.watered, true);
  assert.equal(neighbor.watered, true);
  assert.equal(r3.wateredCount, 2);

  const next = advanceToNextDay(state, true);
  assert.equal(state.day, 2);
  assert.equal(next.newWeather, 'rainy');
  assert.equal(next.maturedCount, 2);
  assert.equal(plot.state, 'mature');
  assert.equal(state.player.wellRestedBuff, true);
  assert.equal(state.farmPlots[5].watered, true);

  const beforeSunberries = state.inventory.sunberry || 0;
  const r4 = interactWithFarmPlot(plot, null, state.inventory, 0, 'rainy');
  assert.equal(r4.action, 'harvested');
  assert.equal(state.inventory.sunberry, beforeSunberries + 1);
});

test('cooking and Forge gear upgrades consume materials and boost combat/speed stats', () => {
  const state = createNewSaveState();
  const soupRecipe = RECIPES.find((r) => r.id === 'recipe_pumpkin_soup')!;
  assert.equal(canCraftRecipe(soupRecipe, state.inventory), true);

  const res = craftRecipe(state, 'recipe_pumpkin_soup');
  assert.equal(res.success, true);
  assert.equal(state.inventory.pumpkin_soup, 1);

  state.player.hp = 60;
  state.player.stamina = 30;
  const eat = consumeItem(state, 'pumpkin_soup');
  assert.equal(eat.used, true);
  assert.equal(state.player.warmBuff, true);
  assert.equal(state.player.hp, 80);
  assert.equal(state.player.stamina, 85);

  // Forge Iron Wordblade Lv2 & Windstrider Boots Lv2
  state.player.coins = 100;
  state.inventory.slime_gel = 2;
  state.inventory.goblin_fang = 1;
  state.inventory.rune_shard = 2;

  const swordUpg = GEAR_UPGRADES.find((u) => u.id === 'sword' && u.targetLevel === 2)!;
  const forgeSword = purchaseGearUpgrade(state, swordUpg);
  assert.equal(forgeSword.success, true);
  assert.equal(state.upgrades.swordLevel, 2);
  assert.equal(getPlayerSwordDamage(state.upgrades, 0), 16);
  assert.ok(getWordStrikeDamage(state.upgrades, 3) > getWordStrikeDamage(state.upgrades, 0));

  const bootsUpg = GEAR_UPGRADES.find((u) => u.id === 'boots' && u.targetLevel === 2)!;
  const baseSpeed = getPlayerMoveSpeed(state.player, state.upgrades, 0);
  assert.equal(purchaseGearUpgrade(state, bootsUpg).success, true);
  assert.ok(getPlayerMoveSpeed(state.player, state.upgrades, 0) > baseSpeed);
  assert.equal(getDashStaminaCost(state.upgrades), 4);
});

test('word strike meaning & context cloze, spelling rune, and sentence order checks work', () => {
  const opts = buildWordStrikeOptions('shadow', 3);
  assert.equal(opts.length, 3);
  assert.equal(opts.filter((o) => o.correct).length, 1);
  assert.equal(NORMAL_ATTACK_DAMAGE, 10);
  assert.equal(WORD_STRIKE_DAMAGE, 35);

  const cloze = buildContextClozeOptions('bridge', 2);
  assert.ok(cloze);
  assert.ok(cloze!.prompt.includes('____'));
  assert.equal(cloze!.options.filter((o) => o.correct).length, 1);

  assert.equal(checkSpellingWord('harvest', 'HARVEST'), true);
  assert.equal(checkSpellingWord('harvset', 'HARVEST'), false);

  assert.equal(
    checkSentenceOrder(['Cross', 'the', 'wooden', 'bridge'], ['Cross', 'the', 'wooden', 'bridge']),
    true
  );
  assert.equal(
    checkSentenceOrder(['the', 'Cross', 'wooden', 'bridge'], ['Cross', 'the', 'wooden', 'bridge']),
    false
  );
});

test('boss mechanics verify blue rune safe zone, stone pillar shelter, and sleep x2 damage', () => {
  const blueX = BOSS_ARENA.blueRune.tileX * TILE_SIZE;
  const blueY = BOSS_ARENA.blueRune.tileY * TILE_SIZE + 24;
  assert.equal(isPlayerOnBlueRune(blueX, blueY), true);
  assert.equal(isPlayerOnBlueRune(36 * TILE_SIZE, 12 * TILE_SIZE), false);

  const bossX = BOSS_ARENA.centerTileX * TILE_SIZE + TILE_SIZE / 2;
  const bossY = BOSS_ARENA.centerTileY * TILE_SIZE + TILE_SIZE / 2;
  const shelteredX = 37 * TILE_SIZE + 12;
  const shelteredY = 12 * TILE_SIZE + 12;
  assert.equal(isPlayerBehindStonePillar(shelteredX, shelteredY, bossX, bossY), true);
  const exposedX = 40 * TILE_SIZE;
  const exposedY = 15 * TILE_SIZE;
  assert.equal(isPlayerBehindStonePillar(exposedX, exposedY, bossX, bossY), false);

  assert.equal(calculateBossDamage(10, 'idle'), 10);
  assert.equal(calculateBossDamage(10, 'vulnerable'), 20);
  assert.equal(calculateBossDamage(35, 'vulnerable'), 70);
});

test('vocab discovery, mastery stars, XP buff, day cycle, hotbar, and portrait moods work', () => {
  const state = createNewSaveState();
  const newly = discoverVocab(state, ['pillar', 'rune']);
  assert.deepEqual(newly, ['pillar', 'rune']);
  assert.equal(state.vocabProgress.pillar.masteryStars, 1);

  recordVocabCorrect(state, 'pillar');
  assert.equal(state.vocabProgress.pillar.masteryStars, 2);
  recordVocabCorrect(state, 'pillar');
  recordVocabCorrect(state, 'pillar');
  assert.equal(state.vocabProgress.pillar.masteryStars, 3);

  state.player.wellRestedBuff = true;
  const xpRes = awardXp(state.player, 60);
  assert.equal(xpRes.gainedXp, 75);
  assert.equal(xpRes.leveledUp, true);
  assert.equal(state.player.level, 2);

  assert.equal(getTimeOfDayFromProgress(0.1), 'morning');
  assert.equal(getTimeOfDayFromProgress(0.4), 'afternoon');
  assert.equal(getTimeOfDayFromProgress(0.65), 'evening');
  assert.equal(getTimeOfDayFromProgress(0.85), 'night');

  assert.ok(buildHotbarItems(state.inventory).length > 0);
  assert.equal(getPortraitMood(20, 100, 100, 100, false, false), 'exhausted');
  assert.equal(getPortraitMood(100, 100, 100, 100, true, false), 'determined');
  assert.equal(getPortraitMood(100, 100, 100, 100, false, true), 'confused');
  assert.equal(getPortraitMood(100, 100, 100, 100, false, false), 'happy');
});
