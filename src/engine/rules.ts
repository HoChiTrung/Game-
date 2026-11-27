import { CROP_CONFIG, GEAR_UPGRADES, ITEMS, QUESTS, RECIPES } from '../data/contentData';
import {
  BOSS_ARENA,
  createInitialFarmPlots,
  MAP_HEIGHT,
  MAP_WIDTH,
  PLAYER_SPAWN,
  TILE_SIZE,
  WORLD_MAP,
} from '../data/mapData';
import { VOCAB_LIST, VOCAB_MAP } from '../data/vocabData';
import {
  CropId,
  FarmPlot,
  GearUpgradeDefinition,
  PlayerUpgrades,
  PortraitMood,
  RecipeDefinition,
  SaveState,
  TimeOfDay,
  UserVocabProgress,
  WeatherType,
  WordStrikeOption,
} from '../types/game';

export const SAVE_VERSION = '2.0.0';
export const DAY_DURATION_SECONDS = 210;
export const NORMAL_ATTACK_DAMAGE = 10;
export const WORD_STRIKE_DAMAGE = 35;

export function createInitialVocabProgress(): Record<string, UserVocabProgress> {
  const progress: Record<string, UserVocabProgress> = {};
  for (const entry of VOCAB_LIST) {
    progress[entry.id] = {
      vocabId: entry.id,
      discovered: false,
      masteryStars: 0,
      correctCount: 0,
      lastReviewedDay: 0,
    };
  }
  return progress;
}

export function createNewSaveState(): SaveState {
  const vocabProgress = createInitialVocabProgress();
  for (const starterId of ['sunshine', 'water', 'seed', 'companion']) {
    if (vocabProgress[starterId]) {
      vocabProgress[starterId].discovered = true;
      vocabProgress[starterId].masteryStars = 1;
    }
  }
  return {
    version: SAVE_VERSION,
    day: 1,
    timeOfDay: 'morning',
    weather: 'sunny',
    hintMode: 'EN_VI',
    player: {
      x: PLAYER_SPAWN.tileX * TILE_SIZE + TILE_SIZE / 2,
      y: PLAYER_SPAWN.tileY * TILE_SIZE + TILE_SIZE / 2,
      hp: 100,
      maxHp: 100,
      stamina: 100,
      maxStamina: 100,
      xp: 0,
      level: 1,
      coins: 35,
      wellRestedBuff: false,
      warmBuff: false,
    },
    inventory: {
      sunberry_seed: 4,
      pumpkin_seed: 2,
      healing_herb_seed: 1,
      sunberry: 2,
      pumpkin: 1,
      healing_herb: 2,
    },
    farmPlots: createInitialFarmPlots(),
    completedQuests: [],
    openedChests: [],
    solvedChallenges: [],
    ruinsGateUnlocked: false,
    bossDefeated: false,
    vocabProgress,
    upgrades: {
      swordLevel: 1,
      wateringCanLevel: 1,
      bootsLevel: 1,
    },
    ironKeyFound: false,
    statueSolved: false,
    todayEncounteredVocabIds: ['sunshine', 'water', 'seed', 'companion'],
    bestWordCombo: 0,
  };
}

export function getPlayerSwordDamage(upgrades: PlayerUpgrades, wordCombo = 0): number {
  const base = upgrades.swordLevel === 3 ? 24 : upgrades.swordLevel === 2 ? 16 : NORMAL_ATTACK_DAMAGE;
  const feverBonus = wordCombo >= 3 ? Math.round(base * 0.15) : 0;
  return base + feverBonus;
}

export function getWordStrikeDamage(upgrades: PlayerUpgrades, wordCombo = 0): number {
  const base = upgrades.swordLevel === 3 ? 65 : upgrades.swordLevel === 2 ? 48 : WORD_STRIKE_DAMAGE;
  const comboBonus = Math.min(20, wordCombo * 4);
  return base + comboBonus;
}

export function getPlayerMoveSpeed(
  player: SaveState['player'],
  upgrades: PlayerUpgrades,
  wordCombo = 0
): number {
  let speed = 192;
  if (player.wellRestedBuff) speed *= 1.2;
  if (upgrades.bootsLevel >= 2) speed *= 1.15;
  if (wordCombo >= 3) speed *= 1.08;
  return Math.round(speed);
}

export function getDashStaminaCost(upgrades: PlayerUpgrades): number {
  return upgrades.bootsLevel >= 2 ? 4 : 7;
}

export function getUpgradeLevel(upgrades: PlayerUpgrades, id: GearUpgradeDefinition['id']): number {
  if (id === 'sword') return upgrades.swordLevel;
  if (id === 'watering_can') return upgrades.wateringCanLevel;
  return upgrades.bootsLevel;
}

export function canPurchaseUpgrade(state: SaveState, upgrade: GearUpgradeDefinition): boolean {
  const currentLvl = getUpgradeLevel(state.upgrades, upgrade.id);
  if (currentLvl !== upgrade.targetLevel - 1) return false;
  if (state.player.coins < upgrade.costCoins) return false;
  return upgrade.ingredients.every((ing) => (state.inventory[ing.itemId] || 0) >= ing.qty);
}

export function purchaseGearUpgrade(
  state: SaveState,
  upgrade: GearUpgradeDefinition
): { success: boolean; messageEn: string } {
  if (!canPurchaseUpgrade(state, upgrade)) {
    return { success: false, messageEn: 'Missing coins, materials, or prior tier!' };
  }
  state.player.coins -= upgrade.costCoins;
  for (const ing of upgrade.ingredients) {
    state.inventory[ing.itemId] = (state.inventory[ing.itemId] || 0) - ing.qty;
    if (state.inventory[ing.itemId] <= 0) delete state.inventory[ing.itemId];
  }
  if (upgrade.id === 'sword') {
    state.upgrades.swordLevel = upgrade.targetLevel as 1 | 2 | 3;
  } else if (upgrade.id === 'watering_can') {
    state.upgrades.wateringCanLevel = upgrade.targetLevel as 1 | 2;
  } else if (upgrade.id === 'boots') {
    state.upgrades.bootsLevel = upgrade.targetLevel as 1 | 2;
  }
  discoverVocab(state, upgrade.vocabIds);
  return { success: true, messageEn: `Forged ${upgrade.titleEn}!` };
}

export function isTileSolid(tileX: number, tileY: number, ruinsGateUnlocked: boolean): boolean {
  if (tileX < 0 || tileY < 0 || tileX >= MAP_WIDTH || tileY >= MAP_HEIGHT) return true;
  const tile = WORLD_MAP.tiles[tileY][tileX];
  if (tile === 'ruin_gate') {
    return !ruinsGateUnlocked;
  }
  return WORLD_MAP.solid[tileY][tileX];
}

export function canStandAt(
  worldX: number,
  worldY: number,
  halfW: number,
  halfH: number,
  ruinsGateUnlocked: boolean
): boolean {
  const corners = [
    [worldX - halfW, worldY - halfH],
    [worldX + halfW, worldY - halfH],
    [worldX - halfW, worldY + halfH],
    [worldX + halfW, worldY + halfH],
  ];
  for (const [cx, cy] of corners) {
    const tx = Math.floor(cx / TILE_SIZE);
    const ty = Math.floor(cy / TILE_SIZE);
    if (isTileSolid(tx, ty, ruinsGateUnlocked)) {
      return false;
    }
  }
  return true;
}

export function getTimeOfDayFromProgress(dayProgress: number): TimeOfDay {
  const p = ((dayProgress % 1) + 1) % 1;
  if (p < 0.28) return 'morning';
  if (p < 0.56) return 'afternoon';
  if (p < 0.78) return 'evening';
  return 'night';
}

export function xpNeededForLevel(level: number): number {
  return 60 + (level - 1) * 45;
}

export function awardXp(
  player: SaveState['player'],
  baseXp: number
): { leveledUp: boolean; gainedXp: number } {
  const multiplier = player.wellRestedBuff ? 1.25 : 1;
  const gainedXp = Math.round(baseXp * multiplier);
  player.xp += gainedXp;
  let leveledUp = false;
  while (player.xp >= xpNeededForLevel(player.level)) {
    player.xp -= xpNeededForLevel(player.level);
    player.level += 1;
    player.maxHp += 10;
    player.maxStamina += 10;
    player.hp = player.maxHp;
    player.stamina = player.maxStamina;
    leveledUp = true;
  }
  return { leveledUp, gainedXp };
}

export function discoverVocab(state: SaveState, vocabIds: string[]): string[] {
  const newlyDiscovered: string[] = [];
  if (!state.todayEncounteredVocabIds) {
    state.todayEncounteredVocabIds = [];
  }
  for (const id of vocabIds) {
    if (!VOCAB_MAP[id]) continue;
    if (!state.vocabProgress[id]) {
      state.vocabProgress[id] = {
        vocabId: id,
        discovered: false,
        masteryStars: 0,
        correctCount: 0,
        lastReviewedDay: state.day,
      };
    }
    const entry = state.vocabProgress[id];
    if (!entry.discovered) {
      entry.discovered = true;
      entry.masteryStars = Math.max(entry.masteryStars, 1) as 0 | 1 | 2 | 3;
      entry.lastReviewedDay = state.day;
      newlyDiscovered.push(id);
    }
    if (!state.todayEncounteredVocabIds.includes(id)) {
      state.todayEncounteredVocabIds.push(id);
    }
  }
  return newlyDiscovered;
}

export function recordVocabCorrect(state: SaveState, vocabId: string): void {
  discoverVocab(state, [vocabId]);
  const entry = state.vocabProgress[vocabId];
  if (!entry) return;
  entry.correctCount += 1;
  entry.lastReviewedDay = state.day;
  if (entry.correctCount >= 3) {
    entry.masteryStars = 3;
  } else if (entry.correctCount >= 1) {
    entry.masteryStars = Math.max(entry.masteryStars, 2) as 0 | 1 | 2 | 3;
  }
}

export interface FarmActionResult {
  action: 'tilled' | 'planted' | 'watered' | 'harvested' | 'needs_seed' | 'low_stamina' | 'noop';
  staminaCost: number;
  harvestedItemId?: string;
  wateredCount?: number;
  vocabId?: string;
  messageEn: string;
}

export function interactWithFarmPlot(
  plot: FarmPlot,
  selectedItemId: string | null,
  inventory: Record<string, number>,
  stamina: number,
  weather: WeatherType,
  allPlots?: FarmPlot[],
  wateringCanLevel: 1 | 2 = 1
): FarmActionResult {
  if (plot.state === 'mature' && plot.cropId) {
    const cfg = CROP_CONFIG[plot.cropId];
    inventory[cfg.harvestItemId] = (inventory[cfg.harvestItemId] || 0) + 1;
    if (plot.cropId === 'sunberry') {
      inventory[cfg.seedItemId] = (inventory[cfg.seedItemId] || 0) + 1;
    }
    plot.state = 'tilled';
    plot.cropId = null;
    plot.watered = weather === 'rainy';
    plot.daysGrown = 0;
    plot.daysRequired = 1;
    return {
      action: 'harvested',
      staminaCost: 0,
      harvestedItemId: cfg.harvestItemId,
      vocabId: 'harvest',
      messageEn: `Harvested ${cfg.name}!`,
    };
  }

  if (plot.state === 'untilled') {
    if (stamina < 4) {
      return {
        action: 'low_stamina',
        staminaCost: 0,
        messageEn: 'Too tired to till! Eat food or rest at the Campfire.',
      };
    }
    plot.state = 'tilled';
    plot.watered = weather === 'rainy';
    return {
      action: 'tilled',
      staminaCost: 4,
      vocabId: 'soil',
      messageEn: 'Tilled the soil!',
    };
  }

  if (plot.state === 'tilled') {
    let seedIdToPlant: string | null = null;
    if (selectedItemId && ITEMS[selectedItemId]?.category === 'seed' && (inventory[selectedItemId] || 0) > 0) {
      seedIdToPlant = selectedItemId;
    } else {
      const fallback = Object.keys(inventory).find(
        (id) => (inventory[id] || 0) > 0 && ITEMS[id]?.category === 'seed'
      );
      if (fallback) seedIdToPlant = fallback;
    }
    if (!seedIdToPlant) {
      return {
        action: 'needs_seed',
        staminaCost: 0,
        messageEn: 'No seeds left! Buy seeds from Elder Mara or Merchant Bram.',
      };
    }
    const seedDef = ITEMS[seedIdToPlant];
    const cropId = seedDef.cropId as CropId;
    const cfg = CROP_CONFIG[cropId];
    inventory[seedIdToPlant] -= 1;
    if (inventory[seedIdToPlant] <= 0) delete inventory[seedIdToPlant];

    plot.state = 'planted';
    plot.cropId = cropId;
    plot.daysGrown = 0;
    plot.daysRequired = cfg.daysRequired;
    plot.watered = weather === 'rainy';
    return {
      action: 'planted',
      staminaCost: 2,
      vocabId: 'seed',
      messageEn: `Planted ${cfg.name}!`,
    };
  }

  if (plot.state === 'planted') {
    if (plot.watered && wateringCanLevel === 1) {
      return {
        action: 'noop',
        staminaCost: 0,
        messageEn: 'Already watered! Sleep to let it grow.',
      };
    }
    if (stamina < 3) {
      return {
        action: 'low_stamina',
        staminaCost: 0,
        messageEn: 'Too tired to water! Eat something or rest.',
      };
    }
    let wateredCount = 0;
    if (wateringCanLevel >= 2 && allPlots) {
      for (const other of allPlots) {
        if (
          Math.abs(other.tileX - plot.tileX) <= 1 &&
          Math.abs(other.tileY - plot.tileY) <= 1 &&
          other.state !== 'untilled' &&
          !other.watered
        ) {
          other.watered = true;
          wateredCount++;
        }
      }
    }
    if (!plot.watered) {
      plot.watered = true;
      wateredCount = Math.max(1, wateredCount);
    }
    if (wateredCount === 0) {
      return {
        action: 'noop',
        staminaCost: 0,
        messageEn: 'Nearby plots are already watered!',
      };
    }
    return {
      action: 'watered',
      staminaCost: 3,
      wateredCount,
      vocabId: 'water',
      messageEn:
        wateredCount > 1
          ? `Silver Can watered ${wateredCount} plots at once!`
          : 'Watered the crop!',
    };
  }

  return { action: 'noop', staminaCost: 0, messageEn: '' };
}

export function pickNextWeather(nextDay: number): WeatherType {
  const pattern: WeatherType[] = ['sunny', 'rainy', 'cold_wind', 'sunny', 'rainy'];
  return pattern[(nextDay - 1) % pattern.length];
}

export function advanceToNextDay(
  state: SaveState,
  grantWellRested: boolean,
  passedOut = false
): { newWeather: WeatherType; maturedCount: number; lostCoins: number } {
  state.day += 1;
  state.timeOfDay = 'morning';
  const newWeather = pickNextWeather(state.day);
  state.weather = newWeather;

  let maturedCount = 0;
  for (const plot of state.farmPlots) {
    if (plot.state === 'planted' && plot.cropId) {
      if (plot.watered) {
        plot.daysGrown += 1;
        if (plot.daysGrown >= plot.daysRequired) {
          plot.state = 'mature';
          maturedCount += 1;
        }
      }
    }
    plot.watered = newWeather === 'rainy';
  }

  let lostCoins = 0;
  if (passedOut) {
    lostCoins = Math.min(state.player.coins, 10);
    state.player.coins -= lostCoins;
    state.player.hp = Math.round(state.player.maxHp * 0.75);
    state.player.stamina = Math.round(state.player.maxStamina * 0.75);
    state.player.wellRestedBuff = false;
    state.player.x = PLAYER_SPAWN.tileX * TILE_SIZE + TILE_SIZE / 2;
    state.player.y = PLAYER_SPAWN.tileY * TILE_SIZE + TILE_SIZE / 2;
  } else {
    state.player.hp = state.player.maxHp;
    state.player.stamina = state.player.maxStamina;
    state.player.wellRestedBuff = grantWellRested;
  }
  state.player.warmBuff = false;
  state.todayEncounteredVocabIds = [];
  return { newWeather, maturedCount, lostCoins };
}

export function canCraftRecipe(recipe: RecipeDefinition, inventory: Record<string, number>): boolean {
  return recipe.ingredients.every((ing) => (inventory[ing.itemId] || 0) >= ing.qty);
}

export function craftRecipe(
  state: SaveState,
  recipeId: string
): { success: boolean; resultItemId?: string; messageEn: string } {
  const recipe = RECIPES.find((r) => r.id === recipeId);
  if (!recipe) return { success: false, messageEn: 'Recipe not found.' };
  if (!canCraftRecipe(recipe, state.inventory)) {
    return { success: false, messageEn: 'Not enough ingredients!' };
  }
  for (const ing of recipe.ingredients) {
    state.inventory[ing.itemId] = (state.inventory[ing.itemId] || 0) - ing.qty;
    if (state.inventory[ing.itemId] <= 0) delete state.inventory[ing.itemId];
  }
  state.inventory[recipe.resultItemId] = (state.inventory[recipe.resultItemId] || 0) + 1;
  discoverVocab(state, recipe.vocabIds);
  return {
    success: true,
    resultItemId: recipe.resultItemId,
    messageEn: `Cooked ${recipe.titleEn}!`,
  };
}

export function consumeItem(
  state: SaveState,
  itemId: string
): { used: boolean; messageEn: string } {
  const qty = state.inventory[itemId] || 0;
  const def = ITEMS[itemId];
  if (!def || qty <= 0) return { used: false, messageEn: 'Item not available.' };
  if (def.category !== 'food' && def.category !== 'crop') {
    return { used: false, messageEn: 'Cannot eat this item.' };
  }

  state.inventory[itemId] -= 1;
  if (state.inventory[itemId] <= 0) delete state.inventory[itemId];

  if (def.healHp) {
    state.player.hp = Math.min(state.player.maxHp, state.player.hp + def.healHp);
  }
  if (def.restoreStamina) {
    state.player.stamina = Math.min(state.player.maxStamina, state.player.stamina + def.restoreStamina);
  }
  if (def.grantsWarm) {
    state.player.warmBuff = true;
  }
  if (def.vocabId) {
    discoverVocab(state, [def.vocabId]);
  }
  return {
    used: true,
    messageEn: def.grantsWarm
      ? `Ate ${def.name}! Warmth protects you tonight.`
      : `Used ${def.name}!`,
  };
}

export function buildHotbarItems(inventory: Record<string, number>): Array<{ itemId: string; qty: number }> {
  const priorityOrder = [
    'sunberry_seed',
    'pumpkin_seed',
    'healing_herb_seed',
    'bitter_root_seed',
    'pumpkin_soup',
    'healing_potion',
    'berry_tea',
    'sunberry',
    'healing_herb',
    'pumpkin',
    'bitter_root',
    'iron_key',
    'rune_shard',
    'slime_gel',
    'goblin_fang',
  ];
  const result: Array<{ itemId: string; qty: number }> = [];
  for (const id of priorityOrder) {
    const qty = inventory[id] || 0;
    if (qty > 0) {
      result.push({ itemId: id, qty });
    }
    if (result.length >= 5) break;
  }
  return result;
}

export function buildWordStrikeOptions(vocabId: string, seed = 0): WordStrikeOption[] {
  const target = VOCAB_MAP[vocabId];
  if (!target) return [];
  const distractors = VOCAB_LIST.filter((v) => v.id !== vocabId);
  const idx1 = (seed * 7 + target.word.length * 3) % distractors.length;
  let idx2 = (seed * 13 + target.word.length * 11 + 5) % distractors.length;
  if (idx2 === idx1) idx2 = (idx1 + 1) % distractors.length;

  const opts: WordStrikeOption[] = [
    { label: target.meaningVi, correct: true },
    { label: distractors[idx1].meaningVi, correct: false },
    { label: distractors[idx2].meaningVi, correct: false },
  ];
  const shift = (seed + target.word.charCodeAt(0)) % 3;
  return [opts[shift], opts[(shift + 1) % 3], opts[(shift + 2) % 3]];
}

export function buildContextClozeOptions(vocabId: string, seed = 0): {
  prompt: string;
  options: WordStrikeOption[];
} | null {
  const target = VOCAB_MAP[vocabId];
  if (!target) return null;
  const regex = new RegExp(`\\b${target.word}\\b`, 'i');
  if (!regex.test(target.exampleSentence)) return null;

  const prompt = target.exampleSentence.replace(regex, '____');
  const distractors = VOCAB_LIST.filter((v) => v.id !== vocabId);
  const idx1 = (seed * 5 + 3) % distractors.length;
  let idx2 = (seed * 11 + 9) % distractors.length;
  if (idx2 === idx1) idx2 = (idx1 + 1) % distractors.length;

  const opts: WordStrikeOption[] = [
    { label: target.word, correct: true },
    { label: distractors[idx1].word, correct: false },
    { label: distractors[idx2].word, correct: false },
  ];
  const shift = (seed + target.word.length) % 3;
  return {
    prompt,
    options: [opts[shift], opts[(shift + 1) % 3], opts[(shift + 2) % 3]],
  };
}

export function checkSpellingWord(attempt: string, targetWord: string): boolean {
  return attempt.trim().toUpperCase() === targetWord.trim().toUpperCase();
}

export function checkSentenceOrder(selectedTokens: string[], correctTokens: string[]): boolean {
  if (selectedTokens.length !== correctTokens.length) return false;
  return selectedTokens.every((t, i) => t === correctTokens[i]);
}

export function calculateBossDamage(baseDamage: number, bossPhase: string): number {
  if (bossPhase === 'vulnerable') {
    return baseDamage * 2;
  }
  return baseDamage;
}

export function isPlayerOnBlueRune(playerX: number, playerY: number): boolean {
  const tx = Math.floor(playerX / TILE_SIZE);
  const ty = Math.floor(playerY / TILE_SIZE);
  if (tx < 0 || ty < 0 || tx >= MAP_WIDTH || ty >= MAP_HEIGHT) return false;
  if (WORLD_MAP.tiles[ty][tx] === 'rune_blue') return true;
  const cx = BOSS_ARENA.blueRune.tileX * TILE_SIZE;
  const cy = (BOSS_ARENA.blueRune.tileY + 1) * TILE_SIZE;
  return Math.hypot(playerX - cx, playerY - cy) <= TILE_SIZE * 1.45;
}

export function isPlayerBehindStonePillar(
  playerX: number,
  playerY: number,
  bossX: number,
  bossY: number
): boolean {
  const dxP = playerX - bossX;
  const dyP = playerY - bossY;
  const distPlayer = Math.hypot(dxP, dyP);
  if (distPlayer < 1) return false;

  for (const pillar of BOSS_ARENA.pillars) {
    const px = pillar.tileX * TILE_SIZE + TILE_SIZE / 2;
    const py = pillar.tileY * TILE_SIZE + TILE_SIZE / 2;
    const distToPillar = Math.hypot(playerX - px, playerY - py);
    const distBossToPillar = Math.hypot(px - bossX, py - bossY);

    if (distToPillar <= TILE_SIZE * 2.15 && distPlayer >= distBossToPillar - 8) {
      const ux = (px - bossX) / Math.max(1, distBossToPillar);
      const uy = (py - bossY) / Math.max(1, distBossToPillar);
      const vx = dxP / distPlayer;
      const vy = dyP / distPlayer;
      const dot = ux * vx + uy * vy;
      if (dot > 0.85) {
        return true;
      }
    }
  }
  return false;
}

export function getActiveQuest(completedQuests: string[]) {
  return QUESTS.find((q) => !completedQuests.includes(q.id)) || null;
}

export function getPortraitMood(
  hp: number,
  maxHp: number,
  stamina: number,
  maxStamina: number,
  inCombat: boolean,
  inPuzzle: boolean
): PortraitMood {
  if (hp / maxHp < 0.3 || stamina / maxStamina < 0.2) return 'exhausted';
  if (inPuzzle) return 'confused';
  if (inCombat) return 'determined';
  return 'happy';
}

export function getAvailableGearUpgrades(upgrades: PlayerUpgrades): GearUpgradeDefinition[] {
  return GEAR_UPGRADES.filter((u) => getUpgradeLevel(upgrades, u.id) === u.targetLevel - 1);
}
