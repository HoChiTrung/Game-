import {
  BOSS_COMMANDS,
  BOSS_MAX_HP,
  BOSS_TELEGRAPH_SECONDS,
  BOSS_VULNERABLE_SECONDS,
  ENEMY_ARCHETYPES,
  ENEMY_SPAWNS,
} from '../data/bestiaryData';
import {
  CLUE_SIGNS,
  ECHO_SHRINES,
  ITEMS,
  MERCHANT_BARGAINS,
  PUZZLE_CHESTS,
  QUESTS,
  SENTENCE_PEDESTALS,
  SPELLING_RUNES,
  STATUE_RIDDLE,
  TOTAL_CHALLENGE_COUNT,
  WEATHER_BULLETINS,
} from '../data/contentData';
import {
  BOSS_ARENA,
  BUILDINGS,
  getZoneForTileX,
  INTERACTABLES,
  IRON_KEY_SPOT,
  LANTERN_POSTS,
  MAP_HEIGHT,
  MAP_WIDTH,
  TILE_SIZE,
  WORLD_MAP,
} from '../data/mapData';
import { VOCAB_LIST, VOCAB_MAP } from '../data/vocabData';
import { storageService } from '../services/storageService';
import {
  ActiveModal,
  BossRuntimeState,
  Direction,
  GameScreenState,
  GearUpgradeDefinition,
  HudSnapshot,
  MinimapMarker,
  RuntimeEnemy,
  SaveState,
  VictoryStats,
  WordStrikePrompt,
} from '../types/game';
import { audioManager } from './audio';
import { ParticleSystem } from './particles';
import {
  advanceToNextDay,
  awardXp,
  buildContextClozeOptions,
  buildHotbarItems,
  buildWordStrikeOptions,
  calculateBossDamage,
  canStandAt,
  consumeItem,
  craftRecipe,
  createNewSaveState,
  DAY_DURATION_SECONDS,
  discoverVocab,
  getActiveQuest,
  getDashStaminaCost,
  getPlayerMoveSpeed,
  getPlayerSwordDamage,
  getPortraitMood,
  getTimeOfDayFromProgress,
  getWordStrikeDamage,
  interactWithFarmPlot,
  isPlayerBehindStonePillar,
  isPlayerOnBlueRune,
  purchaseGearUpgrade,
  recordVocabCorrect,
  xpNeededForLevel,
} from './rules';
import { SpriteManager } from './sprites';

export interface EngineCallbacks {
  onHudUpdate: (snapshot: HudSnapshot) => void;
  onOpenModal: (modal: ActiveModal) => void;
  onScreenChange: (state: GameScreenState) => void;
  onVictory: (stats: VictoryStats) => void;
  onSaveChanged: (hasSave: boolean) => void;
}

const SWORD_LETTERS = ['A', 'E', 'I', 'O', 'U', 'L', 'X', 'W', 'R'];

interface AmbientCritter {
  x: number;
  y: number;
  vx: number;
  vy: number;
  phase: number;
  color: string;
}

interface DashGhost {
  x: number;
  y: number;
  dir: Direction;
  alpha: number;
}

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private sprites: SpriteManager;
  private particles: ParticleSystem;
  private callbacks: EngineCallbacks;

  private saveState: SaveState;
  private screenState: GameScreenState = 'title';
  private activeModal: ActiveModal = null;

  private rafId: number | null = null;
  private lastTimestamp = 0;
  private elapsedTime = 0;
  private dayElapsed = 12;
  private autoSaveTimer = 0;
  private hudEmitTimer = 0;
  private lastHudKey = '';
  private hitstopTimer = 0;

  // Player runtime physics & animation
  private playerFacing: Direction = 'down';
  private walkDistance = 0;
  private attackTimer = 0;
  private attackCooldown = 0;
  private attackHitIds = new Set<string>();
  private farmAnimTimer = 0;
  private hurtInvulnTimer = 0;
  private playerHitFlash = 0;
  private squashX = 1;
  private squashY = 1;
  private selectedHotbarIndex = 0;

  // Dash & Afterimages
  private dashTimer = 0;
  private dashCooldown = 0;
  private dashDirX = 0;
  private dashDirY = 0;
  private dashGhosts: DashGhost[] = [];

  // Word Combo & Lexicon Surge Nova
  private wordCombo = 0;
  private surgeCharge = 0;
  private novaActive = false;
  private novaRadius = 0;
  private novaOriginX = 0;
  private novaOriginY = 0;

  // Chibi Companion Pet: Pip the Lexicon Owl
  private pipX = 0;
  private pipY = 0;
  private pipPhase = 0;
  private pipNearSecret = false;

  // Merchant daily bargain discount
  private merchantDiscountActive = false;

  // Camera
  private camX = 0;
  private camY = 0;
  private titlePanPhase = 0;

  // Input hub
  private keysHeld = new Set<string>();
  private attackBufferedTimer = 0;

  // Entities
  private enemies: RuntimeEnemy[] = [];
  private foragedSpots = new Set<string>();
  private boss: BossRuntimeState;
  private activeWordStrike: WordStrikePrompt | null = null;
  private wordStrikeCooldown = 0;
  private wordStrikeSeed = 1;
  private coldDrainAccum = 0;
  private toastMessage: string | null = null;
  private toastTimer = 0;

  // Cached pre-rendered static world layers + 2.5D canopy layer
  private worldLayers: [HTMLCanvasElement, HTMLCanvasElement] | null = null;
  private canopyLayer: HTMLCanvasElement | null = null;
  private worldLayerGateState = false;

  // Ambient weather & wildlife
  private rainDrops: Array<{ x: number; y: number; speed: number; len: number }> = [];
  private critters: AmbientCritter[] = [];

  constructor(canvas: HTMLCanvasElement, callbacks: EngineCallbacks) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.ctx.imageSmoothingEnabled = false;
    this.callbacks = callbacks;
    this.sprites = new SpriteManager();
    this.particles = new ParticleSystem();
    this.saveState = createNewSaveState();
    this.boss = this.createInitialBoss();

    this.pipX = this.saveState.player.x - 32;
    this.pipY = this.saveState.player.y - 18;

    for (let i = 0; i < 65; i++) {
      this.rainDrops.push({
        x: Math.random() * 1600,
        y: Math.random() * 1000,
        speed: 420 + Math.random() * 200,
        len: 12 + Math.random() * 10,
      });
    }

    const butterflyColors = ['#ffe066', '#ff9bb3', '#8be0ff', '#fff6d6'];
    for (let i = 0; i < 16; i++) {
      this.critters.push({
        x: (3 + Math.random() * 29) * TILE_SIZE,
        y: (4 + Math.random() * 26) * TILE_SIZE,
        vx: (Math.random() - 0.5) * 32,
        vy: (Math.random() - 0.5) * 26,
        phase: Math.random() * Math.PI * 2,
        color: butterflyColors[i % butterflyColors.length],
      });
    }

    this.buildWorldLayers(false);
    this.spawnWorldEnemies();
    this.snapCameraToPlayer();
    this.bindWindowEvents();
  }

  private buildWorldLayers(gateUnlocked: boolean): void {
    const worldW = MAP_WIDTH * TILE_SIZE;
    const worldH = MAP_HEIGHT * TILE_SIZE;
    const layers: HTMLCanvasElement[] = [];

    for (let frame = 0; frame < 2; frame++) {
      const c = document.createElement('canvas');
      c.width = worldW;
      c.height = worldH;
      const lctx = c.getContext('2d')!;
      lctx.imageSmoothingEnabled = false;
      for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
          let tileKind = WORLD_MAP.tiles[y][x];
          if (tileKind === 'ruin_gate' && gateUnlocked) {
            tileKind = 'ruin_floor';
          }
          lctx.drawImage(this.sprites.getTile(tileKind, frame), x * TILE_SIZE, y * TILE_SIZE);
        }
      }
      // Bake organic water shorelines, path borders & ruin shadows
      this.sprites.renderAutoTileTransitions(lctx, WORLD_MAP.tiles, gateUnlocked);
      layers.push(c);
    }

    this.worldLayers = [layers[0], layers[1]];
    this.worldLayerGateState = gateUnlocked;

    // Build 2.5D overhanging tree canopy layer once
    if (!this.canopyLayer) {
      const cc = document.createElement('canvas');
      cc.width = worldW;
      cc.height = worldH;
      const cctx = cc.getContext('2d')!;
      cctx.imageSmoothingEnabled = false;
      for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
          const t = WORLD_MAP.tiles[y][x];
          if (t === 'tree' || t === 'pine') {
            const canopy = this.sprites.getTreeCanopy(t);
            cctx.drawImage(canopy, x * TILE_SIZE - 12, y * TILE_SIZE - 30);
          }
        }
      }
      this.canopyLayer = cc;
    }
  }

  private createInitialBoss(): BossRuntimeState {
    return {
      active: false,
      defeated: this.saveState?.bossDefeated || false,
      x: BOSS_ARENA.centerTileX * TILE_SIZE + TILE_SIZE / 2,
      y: BOSS_ARENA.centerTileY * TILE_SIZE + TILE_SIZE / 2,
      hp: BOSS_MAX_HP,
      maxHp: BOSS_MAX_HP,
      phase: 'dormant',
      phaseTimer: 0,
      command: null,
      commandEn: '',
      commandVi: '',
      telegraphMax: BOSS_TELEGRAPH_SECONDS,
      hitFlash: 0,
      normalAttackTimer: 2.5,
      commandIndex: 0,
      shockwaveRadius: 0,
      shockwaveActive: false,
      runeBlastTimer: 0,
      koTimer: 0,
    };
  }

  getSpriteManager(): SpriteManager {
    return this.sprites;
  }

  getItemIconUrl(itemId: string): string {
    return this.sprites.getItemIconUrl(itemId);
  }

  getSaveState(): SaveState {
    return this.saveState;
  }

  setCallbacks(callbacks: EngineCallbacks): void {
    this.callbacks = callbacks;
  }

  start(): void {
    if (this.rafId !== null) return;
    this.lastTimestamp = performance.now();
    const tick = (now: number) => {
      const rawDt = (now - this.lastTimestamp) / 1000;
      this.lastTimestamp = now;
      const dt = Math.min(Math.max(rawDt, 0), 0.05);
      this.update(dt);
      this.render();
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  destroy(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.unbindWindowEvents();
    audioManager.stopSpeech();
  }

  resize(width: number, height: number): void {
    this.canvas.width = Math.max(320, Math.floor(width));
    this.canvas.height = Math.max(240, Math.floor(height));
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.imageSmoothingEnabled = false;
  }

  private getViewportSize(): { w: number; h: number } {
    return { w: this.canvas.width, h: this.canvas.height };
  }

  // ==================== LIFECYCLE & STATE ====================
  startNewGame(): void {
    this.saveState = createNewSaveState();
    this.foragedSpots.clear();
    this.particles.clear();
    this.dayElapsed = 12;
    this.autoSaveTimer = 0;
    this.selectedHotbarIndex = 0;
    this.activeModal = null;
    this.activeWordStrike = null;
    this.wordCombo = 0;
    this.surgeCharge = 0;
    this.merchantDiscountActive = false;
    this.dashGhosts = [];
    this.pipX = this.saveState.player.x - 32;
    this.pipY = this.saveState.player.y - 18;
    this.boss = this.createInitialBoss();
    this.spawnWorldEnemies();
    this.snapCameraToPlayer();
    this.clearInputState();
    this.screenState = 'playing';
    this.callbacks.onOpenModal(null);
    this.callbacks.onScreenChange('playing');
    this.persistMilestone();
    this.showToast('Welcome to Lexicon Isle! Pip the Owl joins you — press E near signs, shrines, or Merchant Bram!');
    this.emitHud(true);
  }

  continueGame(): boolean {
    const loaded = storageService.load();
    if (!loaded) return false;
    this.saveState = loaded;
    this.foragedSpots.clear();
    this.particles.clear();
    this.dayElapsed =
      loaded.timeOfDay === 'morning'
        ? 12
        : loaded.timeOfDay === 'afternoon'
          ? DAY_DURATION_SECONDS * 0.38
          : loaded.timeOfDay === 'evening'
            ? DAY_DURATION_SECONDS * 0.66
            : DAY_DURATION_SECONDS * 0.85;
    this.autoSaveTimer = 0;
    this.activeModal = null;
    this.activeWordStrike = null;
    this.wordCombo = 0;
    this.merchantDiscountActive = false;
    this.dashGhosts = [];
    this.pipX = loaded.player.x - 32;
    this.pipY = loaded.player.y - 18;
    this.boss = this.createInitialBoss();
    this.boss.defeated = loaded.bossDefeated;
    this.spawnWorldEnemies();
    this.snapCameraToPlayer();
    this.clearInputState();
    this.screenState = 'playing';
    this.callbacks.onOpenModal(null);
    this.callbacks.onScreenChange('playing');
    this.showToast(`Welcome back! Day ${loaded.day} — ${WEATHER_BULLETINS[loaded.weather].labelEn}.`);
    this.emitHud(true);
    return true;
  }

  resetSaveData(): void {
    storageService.reset();
    this.callbacks.onSaveChanged(false);
  }

  returnToTitle(): void {
    this.clearInputState();
    this.activeModal = null;
    this.activeWordStrike = null;
    this.screenState = 'title';
    this.callbacks.onOpenModal(null);
    this.callbacks.onScreenChange('title');
    audioManager.stopSpeech();
  }

  setPaused(paused: boolean): void {
    if (this.screenState === 'title' || this.screenState === 'gameover') return;
    this.clearInputState();
    this.screenState = paused ? 'paused' : 'playing';
    this.callbacks.onScreenChange(this.screenState);
    if (paused) audioManager.stopSpeech();
  }

  continueAfterVictory(): void {
    this.clearInputState();
    this.screenState = 'playing';
    this.callbacks.onScreenChange('playing');
    this.emitHud(true);
  }

  setActiveModal(modal: ActiveModal): void {
    this.activeModal = modal;
    if (modal !== null) {
      this.clearInputState();
    }
    this.callbacks.onOpenModal(modal);
    this.emitHud(true);
  }

  toggleHintMode(): void {
    this.saveState.hintMode = this.saveState.hintMode === 'EN' ? 'EN_VI' : 'EN';
    audioManager.playSfx('click');
    this.emitHud(true);
  }

  toggleMute(): void {
    audioManager.toggleMute();
    this.emitHud(true);
  }

  selectHotbarSlot(index: number): void {
    if (index < 0 || index > 4) return;
    this.selectedHotbarIndex = index;
    audioManager.playSfx('click');
    this.emitHud(true);
  }

  useSelectedHotbarItem(): void {
    const hotbar = buildHotbarItems(this.saveState.inventory);
    const slot = hotbar[this.selectedHotbarIndex];
    if (!slot) return;
    const def = ITEMS[slot.itemId];
    if (!def) return;
    if (def.category === 'food' || def.category === 'crop') {
      const res = consumeItem(this.saveState, slot.itemId);
      if (res.used) {
        audioManager.playSfx('harvest');
        this.particles.burst(this.saveState.player.x, this.saveState.player.y - 8, '#7cf59b', 12, 70, 4, 40);
        this.particles.spawnFloatingText(this.saveState.player.x, this.saveState.player.y - 26, `+${def.name}`, '#94f7a8', 0.95);
        this.showToast(res.messageEn);
        this.emitHud(true);
      }
    } else if (def.category === 'seed') {
      this.showToast(`Selected ${def.name}. Stand on tilled soil and press E to plant.`);
    }
  }

  // ==================== MODAL ACTION HANDLERS ====================
  handleCraftRecipe(recipeId: string): { success: boolean; messageEn: string } {
    const res = craftRecipe(this.saveState, recipeId);
    if (res.success) {
      audioManager.playSfx('chest');
      this.particles.burst(this.saveState.player.x, this.saveState.player.y - 10, '#ffd466', 14, 80, 4, 50);
      this.persistMilestone();
      this.emitHud(true);
    } else {
      audioManager.playSfx('error');
    }
    return res;
  }

  handlePurchaseUpgrade(upgrade: GearUpgradeDefinition): { success: boolean; messageEn: string } {
    const res = purchaseGearUpgrade(this.saveState, upgrade);
    if (res.success) {
      audioManager.playSfx('levelup');
      this.particles.burst(this.saveState.player.x, this.saveState.player.y - 10, '#70e4ff', 22, 115, 5, 60);
      this.particles.spawnFloatingText(this.saveState.player.x, this.saveState.player.y - 34, `FORGED ${upgrade.titleEn}!`, '#ffe36e', 1.1);
      this.persistMilestone();
      this.emitHud(true);
    } else {
      audioManager.playSfx('error');
    }
    return res;
  }

  handleConsumeItemFromBag(itemId: string): { used: boolean; messageEn: string } {
    const res = consumeItem(this.saveState, itemId);
    if (res.used) {
      audioManager.playSfx('harvest');
      this.emitHud(true);
    }
    return res;
  }

  handleBuySeed(itemId: string, discounted = false): { success: boolean; messageEn: string } {
    const def = ITEMS[itemId];
    if (!def || !def.price) return { success: false, messageEn: 'Unavailable.' };
    const price = discounted && this.merchantDiscountActive ? Math.max(1, Math.round(def.price * 0.7)) : def.price;
    if (this.saveState.player.coins < price) {
      audioManager.playSfx('error');
      return { success: false, messageEn: 'Not enough coins!' };
    }
    this.saveState.player.coins -= price;
    this.saveState.inventory[itemId] = (this.saveState.inventory[itemId] || 0) + 1;
    if (def.vocabId) discoverVocab(this.saveState, [def.vocabId]);
    audioManager.playSfx('chest');
    this.persistMilestone();
    this.emitHud(true);
    return { success: true, messageEn: `Bought 1 ${def.name} for ${price}g!` };
  }

  handleMerchantBargain(bargainId: string, correct: boolean): void {
    const challenge = MERCHANT_BARGAINS.find((b) => b.id === bargainId);
    if (challenge) {
      discoverVocab(this.saveState, challenge.vocabIds);
    }
    if (correct) {
      this.merchantDiscountActive = true;
      if (challenge) {
        for (const vid of challenge.vocabIds) recordVocabCorrect(this.saveState, vid);
      }
      audioManager.playSfx('chest');
      this.surgeCharge = Math.min(100, this.surgeCharge + 15);
      this.showToast('Merchant Bram unlocked a 30% English Scholar discount for today!');
      this.emitHud(true);
    } else {
      audioManager.playSfx('error');
    }
  }

  handleUnlockRuinsGate(): boolean {
    if ((this.saveState.inventory.iron_key || 0) <= 0) {
      audioManager.playSfx('error');
      return false;
    }
    this.saveState.ruinsGateUnlocked = true;
    discoverVocab(this.saveState, ['seal', 'ancient', 'guardian']);
    audioManager.playSfx('chest');
    this.particles.burst(34 * TILE_SIZE + 24, 17 * TILE_SIZE + 24, '#ffd966', 24, 120, 5, 60);
    this.particles.addShake(0.35);
    this.showToast('The Sealed Stone Gate opens! Enter the Ancient Ruins.');
    this.persistMilestone();
    this.setActiveModal(null);
    return true;
  }

  handleSpendHintCost(): boolean {
    if (this.saveState.player.coins >= 5) {
      this.saveState.player.coins -= 5;
      this.emitHud(true);
      return true;
    }
    if (this.saveState.player.stamina >= 5) {
      this.saveState.player.stamina -= 5;
      this.emitHud(true);
      return true;
    }
    return true;
  }

  private grantChallengeRewards(
    id: string,
    tileX: number,
    tileY: number,
    titleEn: string,
    rewardCoins: number,
    rewardXp: number,
    rewardItems: Record<string, number>,
    vocabIds: string[],
    particleColor: string
  ): void {
    if (!this.saveState.solvedChallenges.includes(id)) {
      this.saveState.solvedChallenges.push(id);
    }
    this.saveState.player.coins += rewardCoins;
    const xpRes = awardXp(this.saveState.player, rewardXp);
    for (const [itemId, qty] of Object.entries(rewardItems)) {
      this.saveState.inventory[itemId] = (this.saveState.inventory[itemId] || 0) + qty;
    }
    discoverVocab(this.saveState, vocabIds);
    for (const vid of vocabIds) recordVocabCorrect(this.saveState, vid);
    this.surgeCharge = Math.min(100, this.surgeCharge + 20);

    audioManager.playSfx(xpRes.leveledUp ? 'levelup' : 'chest');
    this.particles.burst(tileX * TILE_SIZE + 24, tileY * TILE_SIZE + 24, particleColor, 24, 120, 5, 70);
    this.showToast(`Solved ${titleEn}! +${rewardCoins}g, +${xpRes.gainedXp} XP, +20% Surge.`);
    this.persistMilestone();
    this.emitHud(true);
  }

  handleSolveChestPuzzle(chestId: string): void {
    const chest = PUZZLE_CHESTS[chestId];
    if (!chest || this.saveState.openedChests.includes(chestId)) return;
    this.saveState.openedChests.push(chestId);
    this.grantChallengeRewards(
      chest.id,
      chest.tileX,
      chest.tileY,
      chest.titleEn,
      chest.rewardCoins,
      chest.rewardXp,
      chest.rewardItems,
      chest.vocabIds,
      '#ffe066'
    );
  }

  handleSolveEchoShrine(challengeId: string): void {
    const shrine = ECHO_SHRINES[challengeId];
    if (!shrine || this.saveState.solvedChallenges.includes(challengeId)) return;
    this.grantChallengeRewards(
      shrine.id,
      shrine.tileX,
      shrine.tileY,
      shrine.titleEn,
      shrine.rewardCoins,
      shrine.rewardXp,
      shrine.rewardItems,
      shrine.vocabIds,
      '#58d2ff'
    );
  }

  handleSolveSpellingRune(challengeId: string): void {
    const rune = SPELLING_RUNES[challengeId];
    if (!rune || this.saveState.solvedChallenges.includes(challengeId)) return;
    this.grantChallengeRewards(
      rune.id,
      rune.tileX,
      rune.tileY,
      rune.titleEn,
      rune.rewardCoins,
      rune.rewardXp,
      rune.rewardItems,
      rune.vocabIds,
      '#ffd966'
    );
  }

  handleSolveSentencePedestal(challengeId: string): void {
    const ped = SENTENCE_PEDESTALS[challengeId];
    if (!ped || this.saveState.solvedChallenges.includes(challengeId)) return;
    this.grantChallengeRewards(
      ped.id,
      ped.tileX,
      ped.tileY,
      ped.titleEn,
      ped.rewardCoins,
      ped.rewardXp,
      ped.rewardItems,
      ped.vocabIds,
      '#7ff5a8'
    );
  }

  handleSolveStatueRiddle(): boolean {
    if (this.saveState.statueSolved) return false;
    if ((this.saveState.inventory[STATUE_RIDDLE.requiredItemId] || 0) <= 0) {
      audioManager.playSfx('error');
      return false;
    }
    this.saveState.inventory[STATUE_RIDDLE.requiredItemId] -= 1;
    if (this.saveState.inventory[STATUE_RIDDLE.requiredItemId] <= 0) {
      delete this.saveState.inventory[STATUE_RIDDLE.requiredItemId];
    }
    this.saveState.statueSolved = true;
    this.grantChallengeRewards(
      STATUE_RIDDLE.id,
      STATUE_RIDDLE.tileX,
      STATUE_RIDDLE.tileY,
      STATUE_RIDDLE.titleEn,
      STATUE_RIDDLE.rewardCoins,
      STATUE_RIDDLE.rewardXp,
      STATUE_RIDDLE.rewardItems,
      STATUE_RIDDLE.vocabIds,
      '#66e0ff'
    );
    return true;
  }

  handleCampfireSleep(reviewedVocabIds: string[], grantWellRested: boolean): void {
    for (const vid of reviewedVocabIds) {
      recordVocabCorrect(this.saveState, vid);
    }
    const result = advanceToNextDay(this.saveState, grantWellRested, false);
    this.dayElapsed = 12;
    this.merchantDiscountActive = false;
    this.foragedSpots.clear();
    this.spawnWorldEnemies();
    audioManager.playSfx('campfire');
    this.persistMilestone();
    this.setActiveModal(null);

    const weatherLabel = WEATHER_BULLETINS[result.newWeather].labelEn;
    const buffText = grantWellRested ? ' Well Rested (+20% Speed, +25% XP)!' : '';
    const cropText = result.maturedCount > 0 ? ` ${result.maturedCount} crop(s) ready to harvest!` : '';
    this.showToast(`Day ${this.saveState.day} (${weatherLabel}).${cropText}${buffText}`);
    this.emitHud(true);
  }

  triggerSaveManual(): void {
    this.persistMilestone();
    this.showToast('Progress saved!');
  }

  private persistMilestone(): void {
    storageService.save(this.saveState);
    this.callbacks.onSaveChanged(true);
  }

  private showToast(msg: string): void {
    this.toastMessage = msg;
    this.toastTimer = 4.2;
    this.emitHud(true);
  }

  // ==================== DASH & LEXICON SURGE NOVA ====================
  private triggerDash(): void {
    if (this.dashCooldown > 0 || this.dashTimer > 0) return;
    const cost = getDashStaminaCost(this.saveState.upgrades);
    if (this.saveState.player.stamina < cost) {
      this.showToast('Too tired to Dash! Eat a Sunberry or Soup.');
      return;
    }

    let dx = 0;
    let dy = 0;
    if (this.keysHeld.has('KeyW') || this.keysHeld.has('ArrowUp')) dy -= 1;
    if (this.keysHeld.has('KeyS') || this.keysHeld.has('ArrowDown')) dy += 1;
    if (this.keysHeld.has('KeyA') || this.keysHeld.has('ArrowLeft')) dx -= 1;
    if (this.keysHeld.has('KeyD') || this.keysHeld.has('ArrowRight')) dx += 1;

    if (dx === 0 && dy === 0) {
      const f = this.getFacingVector();
      dx = f.x;
      dy = f.y;
    } else {
      const len = Math.hypot(dx, dy);
      dx /= len;
      dy /= len;
    }

    this.saveState.player.stamina = Math.max(0, this.saveState.player.stamina - cost);
    this.dashDirX = dx;
    this.dashDirY = dy;
    this.dashTimer = 0.18;
    this.dashCooldown = 0.65;
    this.hurtInvulnTimer = Math.max(this.hurtInvulnTimer, 0.28);
    this.squashX = 1.28;
    this.squashY = 0.78;
    audioManager.playSfx('dash');
    this.particles.burst(this.saveState.player.x, this.saveState.player.y + 12, '#e8dcc0', 10, 85, 4, 40);
    this.emitHud(true);
  }

  triggerLexiconNova(): void {
    if (this.screenState !== 'playing' || this.activeModal !== null) return;
    if (this.surgeCharge < 100) {
      this.showToast(`Lexicon Surge is at ${Math.round(this.surgeCharge)}% — chain Word Strikes to reach 100%!`);
      return;
    }

    const p = this.saveState.player;
    this.surgeCharge = 0;
    this.novaActive = true;
    this.novaRadius = 18;
    this.novaOriginX = p.x;
    this.novaOriginY = p.y;
    this.hitstopTimer = 0.08;
    this.particles.addShake(0.65);
    audioManager.playSfx('nova');
    discoverVocab(this.saveState, ['surge', 'triumph']);

    // Golden letter burst
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2;
      const letter = SWORD_LETTERS[i % SWORD_LETTERS.length];
      this.particles.spawnFloatingText(
        p.x + Math.cos(ang) * 52,
        p.y + Math.sin(ang) * 42,
        letter,
        '#ffe566',
        1.15
      );
    }
    this.particles.burst(p.x, p.y, '#ffd84d', 30, 175, 5, 30);

    const novaDmg = 55;
    let hitCount = 0;
    for (const enemy of this.enemies) {
      if (enemy.dead || enemy.state === 'ko') continue;
      if (Math.hypot(enemy.x - p.x, enemy.y - p.y) <= 265) {
        this.damageEnemy(enemy, novaDmg, true);
        hitCount++;
      }
    }

    if (this.boss.active && !this.boss.defeated && this.boss.phase !== 'ko') {
      if (Math.hypot(this.boss.x - p.x, this.boss.y - p.y) <= 300) {
        const dmg = calculateBossDamage(novaDmg, this.boss.phase);
        this.damageBoss(dmg, true);
        hitCount++;
      }
    }

    this.particles.spawnFloatingText(p.x, p.y - 42, 'LEXICON NOVA!', '#fff299', 1.3);
    this.showToast(
      hitCount > 0
        ? `Lexicon Nova blasted ${hitCount} foe(s) with golden word power!`
        : 'Lexicon Nova unleashed!'
    );
    this.emitHud(true);
  }

  // ==================== WORD STRIKE ====================
  answerWordStrike(optionIndex: number): void {
    if (!this.activeWordStrike || this.screenState !== 'playing' || this.activeModal !== null) return;
    const opt = this.activeWordStrike.options[optionIndex];
    if (!opt) return;

    const { enemyId, vocabId, word } = this.activeWordStrike;
    if (opt.correct) {
      recordVocabCorrect(this.saveState, vocabId);
      this.wordCombo += 1;
      if (this.wordCombo > (this.saveState.bestWordCombo || 0)) {
        this.saveState.bestWordCombo = this.wordCombo;
      }
      this.surgeCharge = Math.min(100, this.surgeCharge + 34);
      const strikeDmg = getWordStrikeDamage(this.saveState.upgrades, this.wordCombo);

      audioManager.playSfx('crit');
      audioManager.speakEnglish(word);
      this.hitstopTimer = 0.065;
      this.particles.addShake(0.45);

      if (this.wordCombo >= 3) {
        this.particles.spawnFloatingText(
          this.saveState.player.x,
          this.saveState.player.y - 46,
          `WORD FEVER x${this.wordCombo}!`,
          '#ffd84d',
          1.08
        );
      }

      if (enemyId === 'boss_stone_guardian' && this.boss.active && !this.boss.defeated) {
        const dmg = calculateBossDamage(strikeDmg, this.boss.phase);
        this.damageBoss(dmg, true);
      } else {
        const enemy = this.enemies.find((e) => e.id === enemyId && !e.dead && e.state !== 'ko');
        if (enemy) {
          this.damageEnemy(enemy, strikeDmg, true);
        }
      }
      this.wordStrikeSeed += 1;
      this.wordStrikeCooldown = 0.45;
      this.activeWordStrike = null;
    } else {
      this.wordCombo = 0;
      audioManager.playSfx('error');
      this.particles.spawnFloatingText(this.saveState.player.x, this.saveState.player.y - 26, 'MISS!', '#ff857a', 0.95);
      this.wordStrikeCooldown = 1.05;
      this.activeWordStrike = null;
    }
    this.emitHud(true);
  }

  // ==================== INPUT HUB ====================
  private onKeyDown = (e: KeyboardEvent) => {
    const code = e.code;

    if (this.screenState === 'title') {
      if (code === 'Enter' || code === 'Space') {
        if (document.activeElement instanceof HTMLButtonElement) return;
        e.preventDefault();
        this.startNewGame();
      }
      return;
    }

    if (this.screenState === 'gameover') return;

    if (code === 'Escape') {
      e.preventDefault();
      if (this.activeModal !== null) {
        this.setActiveModal(null);
      } else {
        this.setPaused(this.screenState !== 'paused');
      }
      return;
    }

    if (code === 'KeyP' && this.activeModal === null) {
      e.preventDefault();
      this.setPaused(this.screenState !== 'paused');
      return;
    }

    if (this.screenState === 'paused') return;

    // Do not hijack typing inside Spelling modal or text inputs
    if (this.activeModal !== null) {
      if (this.activeModal.type === 'lexicon' && code === 'KeyL') {
        e.preventDefault();
        this.setActiveModal(null);
      } else if (this.activeModal.type === 'crafting' && code === 'KeyI') {
        e.preventDefault();
        this.setActiveModal(null);
      }
      return;
    }

    if (code === 'KeyM') {
      this.toggleMute();
      return;
    }

    if (code === 'KeyL' && !this.activeWordStrike) {
      e.preventDefault();
      audioManager.playSfx('click');
      this.setActiveModal({ type: 'lexicon' });
      return;
    }

    if (code === 'KeyI') {
      e.preventDefault();
      audioManager.playSfx('click');
      this.setActiveModal({ type: 'crafting', initialTab: 'bag' });
      return;
    }

    // Dash (Shift) & Lexicon Surge Nova (Q)
    if ((code === 'ShiftLeft' || code === 'ShiftRight') && !e.repeat) {
      e.preventDefault();
      this.triggerDash();
      return;
    }
    if (code === 'KeyQ' && !e.repeat) {
      e.preventDefault();
      this.triggerLexiconNova();
      return;
    }

    // Word Strike quick keys (J / K / L)
    if (this.activeWordStrike) {
      if (code === 'KeyJ') {
        e.preventDefault();
        this.answerWordStrike(0);
        return;
      }
      if (code === 'KeyK') {
        e.preventDefault();
        this.answerWordStrike(1);
        return;
      }
      if (code === 'KeyL') {
        e.preventDefault();
        this.answerWordStrike(2);
        return;
      }
    }

    // Hotbar 1-5 & F to use
    if (code.startsWith('Digit')) {
      const idx = parseInt(code.replace('Digit', ''), 10) - 1;
      if (idx >= 0 && idx <= 4) {
        this.selectHotbarSlot(idx);
      }
      return;
    }
    if (code === 'KeyF' && !e.repeat) {
      this.useSelectedHotbarItem();
      return;
    }

    if (code === 'KeyE' && !e.repeat) {
      e.preventDefault();
      this.performInteract();
      return;
    }
    if (code === 'Space' && !e.repeat) {
      e.preventDefault();
      this.attackBufferedTimer = 0.14;
      return;
    }

    this.keysHeld.add(code);
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keysHeld.delete(e.code);
  };

  private clearInputState = () => {
    this.keysHeld.clear();
    this.attackBufferedTimer = 0;
  };

  private onVisibilityChange = () => {
    if (document.hidden) {
      this.clearInputState();
    }
  };

  private bindWindowEvents(): void {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.clearInputState);
    document.addEventListener('visibilitychange', this.onVisibilityChange);
  }

  private unbindWindowEvents(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.clearInputState);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
  }

  // ==================== INTERACTION ====================
  private getFacingTile(): { tx: number; ty: number } {
    const p = this.saveState.player;
    const baseTx = Math.floor(p.x / TILE_SIZE);
    const baseTy = Math.floor(p.y / TILE_SIZE);
    const offset =
      this.playerFacing === 'up'
        ? [0, -1]
        : this.playerFacing === 'down'
          ? [0, 1]
          : this.playerFacing === 'left'
            ? [-1, 0]
            : [1, 0];
    return { tx: baseTx + offset[0], ty: baseTy + offset[1] };
  }

  private findNearbyInteractable() {
    const p = this.saveState.player;
    const facing = this.getFacingTile();
    let best: (typeof INTERACTABLES)[number] | null = null;
    let bestDist = Infinity;

    for (const item of INTERACTABLES) {
      if (item.kind === 'iron_key_spot' && this.saveState.ironKeyFound) continue;
      if (item.kind === 'ruins_gate' && this.saveState.ruinsGateUnlocked) continue;
      if ((item.kind === 'forage_herb' || item.kind === 'forage_root') && this.foragedSpots.has(item.id)) continue;

      const ix = item.tileX * TILE_SIZE + TILE_SIZE / 2;
      const iy = item.tileY * TILE_SIZE + TILE_SIZE / 2;
      const dist = Math.hypot(p.x - ix, p.y - iy);
      const isFacingTile = item.tileX === facing.tx && item.tileY === facing.ty;
      if (dist <= TILE_SIZE * 1.48 || (isFacingTile && dist <= TILE_SIZE * 1.85)) {
        if (dist < bestDist) {
          bestDist = dist;
          best = item;
        }
      }
    }
    return best;
  }

  private findNearbyFarmPlot() {
    const p = this.saveState.player;
    const curTx = Math.floor(p.x / TILE_SIZE);
    const curTy = Math.floor(p.y / TILE_SIZE);
    const facing = this.getFacingTile();

    const direct = this.saveState.farmPlots.find((pl) => pl.tileX === curTx && pl.tileY === curTy);
    if (direct) return direct;
    const faced = this.saveState.farmPlots.find((pl) => pl.tileX === facing.tx && pl.tileY === facing.ty);
    if (faced) return faced;
    return null;
  }

  performInteract(): void {
    const target = this.findNearbyInteractable();
    if (target) {
      this.handleInteractable(target);
      return;
    }

    const plot = this.findNearbyFarmPlot();
    if (plot) {
      const hotbar = buildHotbarItems(this.saveState.inventory);
      const selectedItem = hotbar[this.selectedHotbarIndex]?.itemId || null;
      const res = interactWithFarmPlot(
        plot,
        selectedItem,
        this.saveState.inventory,
        this.saveState.player.stamina,
        this.saveState.weather,
        this.saveState.farmPlots,
        this.saveState.upgrades.wateringCanLevel
      );
      if (res.staminaCost > 0) {
        this.saveState.player.stamina = Math.max(0, this.saveState.player.stamina - res.staminaCost);
      }
      if (res.vocabId) {
        discoverVocab(this.saveState, [res.vocabId]);
      }
      if (res.action === 'tilled') {
        audioManager.playSfx('hoe');
        this.farmAnimTimer = 0.25;
        this.squashX = 1.18;
        this.squashY = 0.84;
        this.particles.burst(plot.tileX * TILE_SIZE + 24, plot.tileY * TILE_SIZE + 24, '#8c5e3c', 8, 65, 4, 140);
      } else if (res.action === 'planted') {
        audioManager.playSfx('hoe');
        this.farmAnimTimer = 0.22;
        this.particles.burst(plot.tileX * TILE_SIZE + 24, plot.tileY * TILE_SIZE + 24, '#7fd667', 8, 60, 4, 90);
      } else if (res.action === 'watered') {
        audioManager.playSfx('water');
        this.farmAnimTimer = 0.28;
        const spread = this.saveState.upgrades.wateringCanLevel >= 2 ? 120 : 85;
        this.particles.burst(plot.tileX * TILE_SIZE + 24, plot.tileY * TILE_SIZE + 20, '#5ec7ff', 18, spread, 4, 150);
      } else if (res.action === 'harvested') {
        audioManager.playSfx('harvest');
        this.farmAnimTimer = 0.25;
        this.particles.burst(plot.tileX * TILE_SIZE + 24, plot.tileY * TILE_SIZE + 20, '#ffe066', 16, 95, 5, 90);
        this.particles.spawnFloatingText(plot.tileX * TILE_SIZE + 24, plot.tileY * TILE_SIZE, res.messageEn, '#ffe47a', 1);
      }
      if (res.messageEn) this.showToast(res.messageEn);
      this.emitHud(true);
    }
  }

  private handleInteractable(target: (typeof INTERACTABLES)[number]): void {
    audioManager.playSfx('click');

    if (target.kind === 'weather_board') {
      const b = WEATHER_BULLETINS[this.saveState.weather];
      discoverVocab(this.saveState, b.vocabIds);
      this.setActiveModal({
        type: 'dialog',
        payload: {
          kind: 'weather',
          speakerEn: `Morning Weather Board — Day ${this.saveState.day} (${b.labelEn})`,
          speakerVi: `Bảng Tin Thời Tiết — Ngày ${this.saveState.day} (${b.labelVi})`,
          textEn: b.messageEn,
          textVi: b.messageVi,
          vocabIds: b.vocabIds,
        },
      });
      return;
    }

    if (target.kind === 'cooking_pot') {
      discoverVocab(this.saveState, ['boil', 'brew', 'warm', 'forge']);
      this.setActiveModal({ type: 'crafting', initialTab: 'cook' });
      return;
    }

    if (target.kind === 'campfire' || target.kind === 'cottage_door') {
      discoverVocab(this.saveState, ['camp']);
      this.setActiveModal({ type: 'campfire' });
      return;
    }

    if (target.kind === 'starter_chest') {
      if (this.saveState.openedChests.includes('starter_chest')) {
        this.showToast('The supply chest is already empty.');
        return;
      }
      this.saveState.openedChests.push('starter_chest');
      this.saveState.inventory.sunberry_seed = (this.saveState.inventory.sunberry_seed || 0) + 3;
      this.saveState.inventory.pumpkin_seed = (this.saveState.inventory.pumpkin_seed || 0) + 2;
      this.saveState.inventory.healing_potion = (this.saveState.inventory.healing_potion || 0) + 1;
      this.saveState.player.coins += 15;
      audioManager.playSfx('chest');
      this.particles.burst(target.tileX * TILE_SIZE + 24, target.tileY * TILE_SIZE + 24, '#ffd966', 18, 95, 4, 80);
      this.persistMilestone();
      this.setActiveModal({
        type: 'dialog',
        payload: {
          kind: 'notice',
          speakerEn: 'Homestead Supply Chest',
          speakerVi: 'Rương Đồ Khởi Đầu',
          textEn: 'You found 3 Sunberry Seeds, 2 Pumpkin Seeds, 1 Healing Potion, and 15 Coins!',
          textVi: 'Bạn tìm thấy 3 Hạt Quả Nắng, 2 Hạt Bí Ngô, 1 Bình Hồi Máu và 15 Xu!',
          vocabIds: ['seed', 'pumpkin'],
        },
      });
      return;
    }

    if (target.kind === 'merchant_bram') {
      const bargain = MERCHANT_BARGAINS[(this.saveState.day - 1) % MERCHANT_BARGAINS.length];
      discoverVocab(this.saveState, ['bargain', 'seed', 'pumpkin']);
      this.setActiveModal({
        type: 'dialog',
        payload: {
          kind: 'merchant',
          speakerEn: 'Merchant Bram — Wandering Peddler',
          speakerVi: 'Thương Nhân Bram — Người Bán Hàng Rong',
          textEn: this.merchantDiscountActive
            ? 'Welcome back, polite scholar! Your 30% English discount is active on all seeds today.'
            : 'Greetings, traveler! Answer my English bargaining challenge below to earn 30% off all seeds today!',
          textVi: this.merchantDiscountActive
            ? 'Chào mừng học giả lịch sự quay lại! Ưu đãi giảm 30% cho toàn bộ hạt giống hôm nay đang áp dụng.'
            : 'Chào lữ khách! Trả lời đúng tình huống giao tiếp mặc cả tiếng Anh bên dưới để được giảm 30% giá hạt giống hôm nay!',
          vocabIds: ['bargain', 'seed'],
          canBuySeeds: true,
          merchantDiscountActive: this.merchantDiscountActive,
          merchantBargainId: bargain.id,
        },
      });
      return;
    }

    if (target.kind === 'elder_mara') {
      let questCompletedBanner: string | undefined;
      if (!this.saveState.completedQuests.includes('q_meet_mara')) {
        const q1 = QUESTS[0];
        this.saveState.completedQuests.push(q1.id);
        this.saveState.player.coins += q1.rewardCoins;
        const xp = awardXp(this.saveState.player, q1.rewardXp);
        if (q1.rewardItems) {
          for (const [id, qty] of Object.entries(q1.rewardItems)) {
            this.saveState.inventory[id] = (this.saveState.inventory[id] || 0) + qty;
          }
        }
        audioManager.playSfx(xp.leveledUp ? 'levelup' : 'chest');
        questCompletedBanner = `Quest Complete: ${q1.titleEn} (+${q1.rewardCoins}g, +${xp.gainedXp} XP, +1 Rune Shard)`;
        this.persistMilestone();
      } else if (
        this.saveState.ironKeyFound &&
        !this.saveState.completedQuests.includes('q_iron_key')
      ) {
        const q2 = QUESTS[1];
        this.saveState.completedQuests.push(q2.id);
        this.saveState.player.coins += q2.rewardCoins;
        const xp = awardXp(this.saveState.player, q2.rewardXp);
        if (q2.rewardItems) {
          for (const [id, qty] of Object.entries(q2.rewardItems)) {
            this.saveState.inventory[id] = (this.saveState.inventory[id] || 0) + qty;
          }
        }
        audioManager.playSfx(xp.leveledUp ? 'levelup' : 'chest');
        questCompletedBanner = `Quest Complete: ${q2.titleEn} (+${q2.rewardCoins}g, +${xp.gainedXp} XP)`;
        this.persistMilestone();
      }

      const active = getActiveQuest(this.saveState.completedQuests);
      discoverVocab(this.saveState, ['whisper', 'bridge', 'north', 'pond']);

      const textEn = this.saveState.bossDefeated
        ? 'Peace has returned to Lexicon Isle! You are a true Lexicon Master. Try solving every Echo Shrine, Spelling Stone, and Syntax Pedestal!'
        : this.saveState.ironKeyFound
          ? 'Splendid work finding the Iron Key! Forge stronger gear at the Cooking Pot & Forge, then unlock the Sealed Stone Gate east of here.'
          : 'Welcome, young traveler! Whispering Woods hides the Iron Key that opens the Ancient Ruins. Read the carved stone clue northeast of my tent, and listen to the Echo Shrines for Rune Shards!';

      const textVi = this.saveState.bossDefeated
        ? 'Hòa bình đã trở lại với Đảo Cổ Ngữ! Bạn thật sự là Bậc Thầy Cổ Ngữ. Hãy chinh phục toàn bộ Đền Vọng Âm, Đá Ghép Chữ và Bệ Câu nhé!'
        : this.saveState.ironKeyFound
          ? 'Tuyệt vời, bạn đã tìm được Chìa Khóa Sắt! Hãy rèn vũ khí mạnh hơn ở Nồi Nấu & Lò Rèn, rồi mở Cổng Đá Phong Ấn ở phía đông.'
          : 'Chào nhà thám hiểm trẻ! Rừng Thì Thầm cất giấu Chìa Khóa Sắt mở Tàn Tích Cổ. Hãy đọc bia đá manh mối phía đông bắc lều ta và giải các Đền Vọng Âm để lấy Mảnh Cổ Ngữ!';

      this.setActiveModal({
        type: 'dialog',
        payload: {
          kind: 'elder',
          speakerEn: 'Elder Mara — Island Scholar',
          speakerVi: 'Trưởng Làng Elder Mara — Học Giả Đảo',
          textEn,
          textVi,
          vocabIds: ['whisper', 'north', 'pond', 'guardian'],
          canBuySeeds: true,
          activeQuestTextEn: active ? active.objectiveEn : 'All main quests completed!',
          activeQuestTextVi: active ? active.objectiveVi : 'Bạn đã hoàn thành toàn bộ nhiệm vụ chính!',
          questCompletedBanner,
        },
      });
      return;
    }

    if (target.kind === 'sign' && target.refId) {
      const sign = CLUE_SIGNS[target.refId];
      if (!sign) return;
      discoverVocab(this.saveState, sign.vocabIds);
      this.setActiveModal({
        type: 'dialog',
        payload: {
          kind: 'sign',
          speakerEn: sign.titleEn,
          speakerVi: sign.titleVi,
          textEn: sign.textEn,
          textVi: sign.textVi,
          vocabIds: sign.vocabIds,
        },
      });
      return;
    }

    if (target.kind === 'iron_key_spot') {
      if (this.saveState.ironKeyFound) return;
      this.saveState.ironKeyFound = true;
      this.saveState.inventory.iron_key = (this.saveState.inventory.iron_key || 0) + 1;
      discoverVocab(this.saveState, ['north', 'pond', 'beside', 'seal']);
      recordVocabCorrect(this.saveState, 'north');
      recordVocabCorrect(this.saveState, 'beside');

      if (!this.saveState.completedQuests.includes('q_iron_key')) {
        const q2 = QUESTS[1];
        this.saveState.completedQuests.push(q2.id);
        this.saveState.player.coins += q2.rewardCoins;
        awardXp(this.saveState.player, q2.rewardXp);
      }

      audioManager.playSfx('levelup');
      this.particles.burst(IRON_KEY_SPOT.tileX * TILE_SIZE + 24, IRON_KEY_SPOT.tileY * TILE_SIZE + 24, '#ffe066', 26, 120, 5, 70);
      this.persistMilestone();
      this.setActiveModal({
        type: 'dialog',
        payload: {
          kind: 'notice',
          speakerEn: 'Buried Treasure Discovered!',
          speakerVi: 'Phát Hiện Kho Báu Chôn Giấu!',
          textEn:
            'You dug beside the three pine trees north of the pond and uncovered the Iron Key! Use it to unlock the Sealed Stone Gate to the east.',
          textVi:
            'Bạn đã đào bên cạnh ba cây thông phía bắc cái ao và tìm thấy Chìa Khóa Sắt! Hãy dùng nó mở Cổng Đá Phong Ấn ở phía đông.',
          vocabIds: ['north', 'beside', 'pond', 'seal'],
        },
      });
      return;
    }

    if (target.kind === 'puzzle_chest' && target.refId) {
      if (this.saveState.openedChests.includes(target.refId)) {
        this.showToast('This Rune Chest has already been opened.');
        return;
      }
      this.setActiveModal({ type: 'puzzle', puzzleKind: 'chest', chestId: target.refId });
      return;
    }

    if (target.kind === 'echo_shrine' && target.refId) {
      if (this.saveState.solvedChallenges.includes(target.refId)) {
        const shrine = ECHO_SHRINES[target.refId];
        if (shrine) audioManager.speakEnglish(shrine.spokenText);
        this.showToast('This Echo Shrine resonates softly with your wisdom (already solved).');
        return;
      }
      this.setActiveModal({ type: 'puzzle', puzzleKind: 'echo', challengeId: target.refId });
      return;
    }

    if (target.kind === 'spelling_rune' && target.refId) {
      if (this.saveState.solvedChallenges.includes(target.refId)) {
        this.showToast('You already deciphered this Spelling Stone!');
        return;
      }
      this.setActiveModal({ type: 'puzzle', puzzleKind: 'spelling', challengeId: target.refId });
      return;
    }

    if (target.kind === 'sentence_pedestal' && target.refId) {
      if (this.saveState.solvedChallenges.includes(target.refId)) {
        this.showToast('This Syntax Pedestal glows with your completed sentence!');
        return;
      }
      this.setActiveModal({ type: 'puzzle', puzzleKind: 'sentence', challengeId: target.refId });
      return;
    }

    if (target.kind === 'statue') {
      if (this.saveState.statueSolved) {
        this.showToast('The Ancient Forest Statue glows warmly with your offering.');
        return;
      }
      discoverVocab(this.saveState, STATUE_RIDDLE.vocabIds);
      this.setActiveModal({ type: 'puzzle', puzzleKind: 'statue' });
      return;
    }

    if (target.kind === 'ruins_gate') {
      const hasKey = (this.saveState.inventory.iron_key || 0) > 0;
      discoverVocab(this.saveState, ['seal', 'ancient']);
      this.setActiveModal({
        type: 'dialog',
        payload: {
          kind: 'gate',
          speakerEn: 'Sealed Stone Gate',
          speakerVi: 'Cổng Đá Phong Ấn',
          textEn: hasKey
            ? 'Your Iron Key resonates with the ancient seal! Unlock the gate to face the Stone Guardian?'
            : 'The ancient gate is sealed tight. Find the Iron Key hidden in Whispering Woods first.',
          textVi: hasKey
            ? 'Chìa Khóa Sắt của bạn đang phát sáng trước phong ấn cổ! Mở cổng để tiến vào đấu trường Hộ Vệ Đá chứ?'
            : 'Cánh cổng cổ đã bị phong ấn. Hãy tìm Chìa Khóa Sắt ẩn giấu trong Rừng Thì Thầm trước.',
          vocabIds: ['seal', 'ancient'],
          canUnlockGate: hasKey,
        },
      });
      return;
    }

    if (target.kind === 'forage_herb') {
      this.foragedSpots.add(target.id);
      this.saveState.inventory.healing_herb = (this.saveState.inventory.healing_herb || 0) + 1;
      discoverVocab(this.saveState, ['brew']);
      audioManager.playSfx('harvest');
      this.particles.burst(target.tileX * TILE_SIZE + 24, target.tileY * TILE_SIZE + 24, '#73f088', 12, 75, 4, 70);
      this.particles.spawnFloatingText(target.tileX * TILE_SIZE + 24, target.tileY * TILE_SIZE, '+1 Healing Herb', '#8ef79e', 0.95);
      this.showToast('Gathered 1 Healing Herb!');
      this.emitHud(true);
      return;
    }

    if (target.kind === 'forage_root') {
      this.foragedSpots.add(target.id);
      this.saveState.inventory.bitter_root = (this.saveState.inventory.bitter_root || 0) + 1;
      discoverVocab(this.saveState, ['bitter', 'root']);
      audioManager.playSfx('harvest');
      this.particles.burst(target.tileX * TILE_SIZE + 24, target.tileY * TILE_SIZE + 24, '#d9a441', 12, 75, 4, 70);
      this.particles.spawnFloatingText(target.tileX * TILE_SIZE + 24, target.tileY * TILE_SIZE, '+1 Bitter Root', '#ffd266', 0.95);
      this.showToast('Gathered 1 Bitter Root!');
      this.emitHud(true);
    }
  }

  // ==================== ENEMIES & COMBAT ====================
  private spawnWorldEnemies(): void {
    this.enemies = [];
    const isNight = this.saveState.timeOfDay === 'night';
    for (const sp of ENEMY_SPAWNS) {
      const arch = ENEMY_ARCHETYPES[sp.kind];
      if (arch.nightOnly && !isNight) continue;
      const vocabId = arch.vocabIds[(sp.tileX + sp.tileY + this.saveState.day) % arch.vocabIds.length];
      const entry = VOCAB_MAP[vocabId];
      this.enemies.push({
        id: sp.id,
        kind: sp.kind,
        x: sp.tileX * TILE_SIZE + TILE_SIZE / 2,
        y: sp.tileY * TILE_SIZE + TILE_SIZE / 2,
        homeX: sp.tileX * TILE_SIZE + TILE_SIZE / 2,
        homeY: sp.tileY * TILE_SIZE + TILE_SIZE / 2,
        vx: 0,
        vy: 0,
        hp: arch.maxHp,
        maxHp: arch.maxHp,
        vocabId,
        word: entry ? entry.word.toUpperCase() : 'WORD',
        facing: 'down',
        hitFlash: 0,
        knockbackTimer: 0,
        state: 'idle',
        stateTimer: 0.5 + Math.random(),
        koTimer: 0,
        hopPhase: Math.random() * Math.PI * 2,
        flankSign: Math.random() > 0.5 ? 1 : -1,
        dead: false,
      });
    }
  }

  private ensureNightEnemies(isNight: boolean): void {
    if (isNight) {
      for (const sp of ENEMY_SPAWNS) {
        const arch = ENEMY_ARCHETYPES[sp.kind];
        if (!arch.nightOnly) continue;
        const exists = this.enemies.some((e) => e.id === sp.id);
        if (!exists) {
          const vocabId = arch.vocabIds[(sp.tileX + this.saveState.day) % arch.vocabIds.length];
          const entry = VOCAB_MAP[vocabId];
          this.enemies.push({
            id: sp.id,
            kind: sp.kind,
            x: sp.tileX * TILE_SIZE + TILE_SIZE / 2,
            y: sp.tileY * TILE_SIZE + TILE_SIZE / 2,
            homeX: sp.tileX * TILE_SIZE + TILE_SIZE / 2,
            homeY: sp.tileY * TILE_SIZE + TILE_SIZE / 2,
            vx: 0,
            vy: 0,
            hp: arch.maxHp,
            maxHp: arch.maxHp,
            vocabId,
            word: entry ? entry.word.toUpperCase() : 'MOON',
            facing: 'down',
            hitFlash: 0,
            knockbackTimer: 0,
            state: 'idle',
            stateTimer: 0.4,
            koTimer: 0,
            hopPhase: 0,
            flankSign: 1,
            dead: false,
          });
        }
      }
    } else {
      this.enemies = this.enemies.filter((e) => !ENEMY_ARCHETYPES[e.kind].nightOnly);
    }
  }

  private startSwordAttack(): void {
    if (this.attackCooldown > 0 || this.saveState.player.stamina < 3) {
      if (this.saveState.player.stamina < 3) {
        this.showToast('Low stamina! Eat a Sunberry or Soup.');
      }
      return;
    }
    this.saveState.player.stamina = Math.max(0, this.saveState.player.stamina - 3);
    this.attackTimer = 0.24;
    this.attackCooldown = 0.32;
    this.attackHitIds.clear();
    this.squashX = 1.2;
    this.squashY = 0.86;
    audioManager.playSfx('swing');

    const dirVec = this.getFacingVector();
    const sx = this.saveState.player.x + dirVec.x * 26;
    const sy = this.saveState.player.y + dirVec.y * 26;
    const letter = SWORD_LETTERS[Math.floor(Math.random() * SWORD_LETTERS.length)];
    const sparkColor = this.saveState.upgrades.swordLevel >= 3 ? '#7be6ff' : '#fff3b8';
    this.particles.spawnFloatingText(sx, sy - 6, letter, sparkColor, 0.8);
    this.particles.burst(sx, sy, sparkColor, 5, 65, 3, 20);
  }

  private getFacingVector(): { x: number; y: number } {
    if (this.playerFacing === 'up') return { x: 0, y: -1 };
    if (this.playerFacing === 'down') return { x: 0, y: 1 };
    if (this.playerFacing === 'left') return { x: -1, y: 0 };
    return { x: 1, y: 0 };
  }

  private damageEnemy(enemy: RuntimeEnemy, amount: number, isWordStrike: boolean): void {
    if (enemy.dead || enemy.state === 'ko') return;
    enemy.hp -= amount;
    enemy.hitFlash = 0.14;
    discoverVocab(this.saveState, [enemy.vocabId]);

    const dx = enemy.x - this.saveState.player.x;
    const dy = enemy.y - this.saveState.player.y;
    const dist = Math.max(1, Math.hypot(dx, dy));
    if (ENEMY_ARCHETYPES[enemy.kind].behavior !== 'stationary_turret') {
      enemy.vx = (dx / dist) * (isWordStrike ? 220 : 150);
      enemy.vy = (dy / dist) * (isWordStrike ? 220 : 150);
      enemy.knockbackTimer = 0.16;
    }

    this.particles.burst(
      enemy.x,
      enemy.y,
      isWordStrike ? '#ffd84d' : '#ff9c7a',
      isWordStrike ? 20 : 10,
      isWordStrike ? 135 : 85,
      isWordStrike ? 5 : 4,
      80
    );
    this.particles.spawnFloatingText(
      enemy.x,
      enemy.y - 24,
      isWordStrike ? `WORD STRIKE! -${amount}` : `-${amount}`,
      isWordStrike ? '#ffe359' : '#ffffff',
      isWordStrike ? 1.18 : 0.95
    );

    if (enemy.hp <= 0) {
      enemy.hp = 0;
      enemy.state = 'ko';
      enemy.koTimer = 0.38;
      const arch = ENEMY_ARCHETYPES[enemy.kind];
      const xpBase = isWordStrike ? arch.xpReward * 2 : arch.xpReward;
      const xpRes = awardXp(this.saveState.player, xpBase);
      this.saveState.player.coins += arch.coinReward;
      this.particles.spawnFloatingText(enemy.x, enemy.y - 44, `+${xpRes.gainedXp} XP`, '#80f5a8', 0.9);

      // Monster Forge Material Drop!
      if (arch.dropItemId) {
        this.saveState.inventory[arch.dropItemId] = (this.saveState.inventory[arch.dropItemId] || 0) + 1;
        const dropDef = ITEMS[arch.dropItemId];
        if (dropDef) {
          this.particles.spawnFloatingText(enemy.x, enemy.y - 62, `+1 ${dropDef.name}`, '#8be0ff', 0.85);
        }
      }

      if (xpRes.leveledUp) {
        audioManager.playSfx('levelup');
        this.particles.spawnFloatingText(this.saveState.player.x, this.saveState.player.y - 40, `LEVEL ${this.saveState.player.level}!`, '#ffe066', 1.25);
        this.showToast(`Level Up! You reached Level ${this.saveState.player.level}.`);
      }
      if (!isWordStrike) {
        audioManager.playSfx('hit');
        this.hitstopTimer = 0.04;
        this.particles.addShake(0.22);
      }
    } else if (!isWordStrike) {
      audioManager.playSfx('hit');
      this.hitstopTimer = 0.03;
      this.particles.addShake(0.14);
    }
  }

  private damageBoss(amount: number, isWordStrike: boolean): void {
    if (!this.boss.active || this.boss.defeated || this.boss.phase === 'ko') return;
    this.boss.hp = Math.max(0, this.boss.hp - amount);
    this.boss.hitFlash = 0.14;
    this.particles.burst(
      this.boss.x,
      this.boss.y,
      isWordStrike ? '#58d2ff' : '#ffd470',
      isWordStrike ? 22 : 12,
      130,
      5,
      60
    );
    const label =
      this.boss.phase === 'vulnerable'
        ? `x2 BREAK! -${amount}`
        : isWordStrike
          ? `WORD STRIKE! -${amount}`
          : `-${amount}`;
    this.particles.spawnFloatingText(
      this.boss.x,
      this.boss.y - 48,
      label,
      this.boss.phase === 'vulnerable' ? '#58e3ff' : isWordStrike ? '#ffe359' : '#ffffff',
      isWordStrike || this.boss.phase === 'vulnerable' ? 1.2 : 1.0
    );

    if (!isWordStrike) {
      audioManager.playSfx('hit');
      this.hitstopTimer = 0.04;
      this.particles.addShake(0.2);
    }

    if (this.boss.hp <= 0) {
      this.boss.phase = 'ko';
      this.boss.koTimer = 0.9;
      this.activeWordStrike = null;
      audioManager.playSfx('levelup');
      this.particles.addShake(0.75);
      this.particles.burst(this.boss.x, this.boss.y, '#64dcff', 36, 160, 6, 40);
      this.particles.burst(this.boss.x, this.boss.y, '#ffe066', 28, 130, 5, 70);
    }
  }

  private damagePlayer(amount: number, sourceX: number, sourceY: number): void {
    if (this.hurtInvulnTimer > 0 || this.screenState !== 'playing') return;
    this.saveState.player.hp = Math.max(0, this.saveState.player.hp - amount);
    this.hurtInvulnTimer = 0.7;
    this.playerHitFlash = 0.18;
    audioManager.playSfx('hurt');
    this.hitstopTimer = 0.045;
    this.particles.addShake(0.38);
    this.particles.burst(this.saveState.player.x, this.saveState.player.y, '#ff5c5c', 12, 90, 4, 90);
    this.particles.spawnFloatingText(this.saveState.player.x, this.saveState.player.y - 24, `-${amount}`, '#ff6b6b', 1.05);

    const dx = this.saveState.player.x - sourceX;
    const dy = this.saveState.player.y - sourceY;
    const dist = Math.max(1, Math.hypot(dx, dy));
    const nx = this.saveState.player.x + (dx / dist) * 18;
    const ny = this.saveState.player.y + (dy / dist) * 18;
    if (canStandAt(nx, ny, 12, 10, this.saveState.ruinsGateUnlocked)) {
      this.saveState.player.x = nx;
      this.saveState.player.y = ny;
    }

    if (this.saveState.player.hp <= 0) {
      this.handlePlayerPassOut();
    }
    this.emitHud(true);
  }

  private handlePlayerPassOut(): void {
    const res = advanceToNextDay(this.saveState, false, true);
    this.dayElapsed = 12;
    this.wordCombo = 0;
    this.merchantDiscountActive = false;
    this.activeWordStrike = null;
    this.boss = this.createInitialBoss();
    this.boss.defeated = this.saveState.bossDefeated;
    this.foragedSpots.clear();
    this.spawnWorldEnemies();
    this.snapCameraToPlayer();
    this.persistMilestone();
    this.showToast(
      `You fainted and woke up at Homestead (Day ${this.saveState.day}). Lost ${res.lostCoins} coins, kept all items & words.`
    );
  }

  // ==================== MAIN UPDATE LOOP ====================
  private update(dt: number): void {
    this.elapsedTime += dt;
    this.particles.update(dt);

    // Campfire embers, cottage chimney smoke, cooking pot steam
    if (Math.random() < dt * 9) {
      this.particles.spawnAmbientEmber(6 * TILE_SIZE + 24, 19 * TILE_SIZE + 14, Math.random() > 0.4 ? '#ff9f43' : '#ffe066');
    }
    if (Math.random() < dt * 3.5) {
      // Cottage chimney smoke puff
      this.particles.spawnAmbientEmber(7 * TILE_SIZE + 8, 10 * TILE_SIZE + 4, 'rgba(235, 232, 224, 0.7)');
    }
    if (Math.random() < dt * 4) {
      // Cooking pot warm steam
      this.particles.spawnAmbientEmber(5 * TILE_SIZE + 24, 15 * TILE_SIZE + 10, 'rgba(255, 248, 225, 0.72)');
    }

    // Update ambient butterflies / fireflies
    for (const c of this.critters) {
      c.phase += dt * 3.2;
      c.x += (c.vx + Math.sin(c.phase) * 18) * dt;
      c.y += (c.vy + Math.cos(c.phase * 1.3) * 14) * dt;
      if (c.x < 2 * TILE_SIZE) c.vx = Math.abs(c.vx);
      if (c.x > 33 * TILE_SIZE) c.vx = -Math.abs(c.vx);
      if (c.y < 3 * TILE_SIZE) c.vy = Math.abs(c.vy);
      if (c.y > 32 * TILE_SIZE) c.vy = -Math.abs(c.vy);
    }

    // Rain particle update
    if (this.saveState.weather === 'rainy' && this.screenState === 'playing') {
      const { w, h } = this.getViewportSize();
      for (const drop of this.rainDrops) {
        drop.x -= drop.speed * 0.25 * dt;
        drop.y += drop.speed * dt;
        if (drop.y > h + 20) {
          drop.y = -20;
          drop.x = Math.random() * (w + 180);
        }
      }
    }

    // Live World Camera Tour on Title Screen
    if (this.screenState === 'title') {
      this.titlePanPhase += dt * 0.14;
      const { w, h } = this.getViewportSize();
      const maxX = Math.max(0, MAP_WIDTH * TILE_SIZE - w);
      const maxY = Math.max(0, MAP_HEIGHT * TILE_SIZE - h);
      const t = (Math.sin(this.titlePanPhase - Math.PI / 2) + 1) / 2;
      this.camX = t * maxX * 0.85;
      this.camY = Math.min(maxY, Math.max(0, 8.2 * TILE_SIZE + Math.sin(this.titlePanPhase * 1.4) * 48));
      return;
    }

    if (this.screenState !== 'playing' || this.activeModal !== null) {
      return;
    }

    // Nova wave expansion
    if (this.novaActive) {
      this.novaRadius += dt * 620;
      if (this.novaRadius > 280) {
        this.novaActive = false;
      }
    }

    // Decay Dash ghosts
    for (let i = this.dashGhosts.length - 1; i >= 0; i--) {
      this.dashGhosts[i].alpha -= dt * 4.2;
      if (this.dashGhosts[i].alpha <= 0) this.dashGhosts.splice(i, 1);
    }

    if (this.toastTimer > 0) {
      this.toastTimer -= dt;
      if (this.toastTimer <= 0) {
        this.toastMessage = null;
        this.emitHud(true);
      }
    }

    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= dt;
      return;
    }

    this.autoSaveTimer += dt;
    if (this.autoSaveTimer >= 60) {
      this.autoSaveTimer = 0;
      this.persistMilestone();
    }

    // Day-Night Cycle progression
    const prevTime = this.saveState.timeOfDay;
    this.dayElapsed += dt;
    if (this.dayElapsed >= DAY_DURATION_SECONDS) {
      this.dayElapsed -= DAY_DURATION_SECONDS;
      const nextRes = advanceToNextDay(this.saveState, false, false);
      this.merchantDiscountActive = false;
      this.foragedSpots.clear();
      this.spawnWorldEnemies();
      this.persistMilestone();
      this.showToast(`Dawn of Day ${this.saveState.day} (${WEATHER_BULLETINS[nextRes.newWeather].labelEn})!`);
    }
    const dayProgress = this.dayElapsed / DAY_DURATION_SECONDS;
    this.saveState.timeOfDay = getTimeOfDayFromProgress(dayProgress);
    if (this.saveState.timeOfDay !== prevTime) {
      this.ensureNightEnemies(this.saveState.timeOfDay === 'night');
      if (this.saveState.timeOfDay === 'night') {
        this.showToast(
          this.saveState.weather === 'cold_wind' && !this.saveState.player.warmBuff
            ? 'Night falls! Cold Wind chills you — eat Warm Pumpkin Soup or rest at Campfire!'
            : 'Night falls! Fireflies glow and Night Bats prowl Whispering Woods.'
        );
      }
      this.emitHud(true);
    }

    // Cold wind night survival drain
    if (
      this.saveState.weather === 'cold_wind' &&
      this.saveState.timeOfDay === 'night' &&
      !this.saveState.player.warmBuff
    ) {
      this.coldDrainAccum += dt;
      if (this.coldDrainAccum >= 2.2) {
        this.coldDrainAccum = 0;
        if (this.saveState.player.stamina > 0) {
          this.saveState.player.stamina = Math.max(0, this.saveState.player.stamina - 3);
        } else {
          this.saveState.player.hp = Math.max(0, this.saveState.player.hp - 3);
          if (this.saveState.player.hp <= 0) {
            this.handlePlayerPassOut();
          }
        }
        this.particles.spawnFloatingText(this.saveState.player.x, this.saveState.player.y - 26, 'Chilly!', '#8ad8ff', 0.82);
      }
    }

    this.updatePlayer(dt);
    this.updatePipCompanion(dt);
    this.updateEnemies(dt);
    this.updateBoss(dt);
    this.updateWordStrikeProximity(dt);
    this.updateCamera(dt);

    this.hudEmitTimer += dt;
    if (this.hudEmitTimer >= 0.1) {
      this.hudEmitTimer = 0;
      this.emitHud(false);
    }
  }

  private updatePlayer(dt: number): void {
    const p = this.saveState.player;
    this.squashX += (1 - this.squashX) * Math.min(1, dt * 14);
    this.squashY += (1 - this.squashY) * Math.min(1, dt * 14);

    if (this.hurtInvulnTimer > 0) this.hurtInvulnTimer -= dt;
    if (this.playerHitFlash > 0) this.playerHitFlash -= dt;
    if (this.attackCooldown > 0) this.attackCooldown -= dt;
    if (this.farmAnimTimer > 0) this.farmAnimTimer -= dt;
    if (this.dashCooldown > 0) this.dashCooldown -= dt;

    if (this.attackBufferedTimer > 0) {
      this.attackBufferedTimer -= dt;
      if (this.attackCooldown <= 0) {
        this.attackBufferedTimer = 0;
        this.startSwordAttack();
      }
    }

    const halfW = 12;
    const halfH = 10;

    // Active Dash movement
    if (this.dashTimer > 0) {
      this.dashTimer -= dt;
      if (this.dashGhosts.length < 4 && Math.random() < dt * 28) {
        this.dashGhosts.push({ x: p.x, y: p.y, dir: this.playerFacing, alpha: 0.58 });
      }
      const dashSpeed = 490;
      const mx = this.dashDirX * dashSpeed * dt;
      const my = this.dashDirY * dashSpeed * dt;
      if (canStandAt(p.x + mx, p.y, halfW, halfH, this.saveState.ruinsGateUnlocked)) {
        p.x += mx;
      }
      if (canStandAt(p.x, p.y + my, halfW, halfH, this.saveState.ruinsGateUnlocked)) {
        p.y += my;
      }
      this.walkDistance += Math.hypot(mx, my);
    } else {
      let ix = 0;
      let iy = 0;
      if (this.keysHeld.has('KeyW') || this.keysHeld.has('ArrowUp')) iy -= 1;
      if (this.keysHeld.has('KeyS') || this.keysHeld.has('ArrowDown')) iy += 1;
      if (this.keysHeld.has('KeyA') || this.keysHeld.has('ArrowLeft')) ix -= 1;
      if (this.keysHeld.has('KeyD') || this.keysHeld.has('ArrowRight')) ix += 1;

      if (ix !== 0 || iy !== 0) {
        const len = Math.hypot(ix, iy);
        ix /= len;
        iy /= len;

        if (Math.abs(ix) > Math.abs(iy)) {
          this.playerFacing = ix > 0 ? 'right' : 'left';
        } else {
          this.playerFacing = iy > 0 ? 'down' : 'up';
        }

        const baseSpeed = getPlayerMoveSpeed(p, this.saveState.upgrades, this.wordCombo);
        const moveX = ix * baseSpeed * dt;
        const moveY = iy * baseSpeed * dt;

        if (canStandAt(p.x + moveX, p.y, halfW, halfH, this.saveState.ruinsGateUnlocked)) {
          p.x += moveX;
        }
        if (canStandAt(p.x, p.y + moveY, halfW, halfH, this.saveState.ruinsGateUnlocked)) {
          p.y += moveY;
        }
        this.walkDistance += Math.hypot(moveX, moveY);
      }
    }

    // Active melee hitbox window
    if (this.attackTimer > 0) {
      this.attackTimer -= dt;
      if (this.attackTimer > 0.06 && this.attackTimer < 0.2) {
        const dir = this.getFacingVector();
        const hitX = p.x + dir.x * 34;
        const hitY = p.y + dir.y * 34;
        const swordDmg = getPlayerSwordDamage(this.saveState.upgrades, this.wordCombo);

        for (const enemy of this.enemies) {
          if (enemy.dead || enemy.state === 'ko' || this.attackHitIds.has(enemy.id)) continue;
          if (Math.hypot(enemy.x - hitX, enemy.y - hitY) <= 44) {
            this.attackHitIds.add(enemy.id);
            this.damageEnemy(enemy, swordDmg, false);
          }
        }

        if (
          this.boss.active &&
          !this.boss.defeated &&
          this.boss.phase !== 'ko' &&
          !this.attackHitIds.has('boss')
        ) {
          if (Math.hypot(this.boss.x - hitX, this.boss.y - hitY) <= 72) {
            this.attackHitIds.add('boss');
            const dmg = calculateBossDamage(swordDmg, this.boss.phase);
            this.damageBoss(dmg, false);
          }
        }
      }
    }
  }

  private updatePipCompanion(dt: number): void {
    const p = this.saveState.player;
    this.pipPhase += dt * 4.5;
    const f = this.getFacingVector();
    const targetX = p.x - f.x * 28 - f.y * 18;
    const targetY = p.y - f.y * 24 - 16 + Math.sin(this.pipPhase) * 4;
    const lerp = 1 - Math.exp(-5.5 * dt);
    this.pipX += (targetX - this.pipX) * lerp;
    this.pipY += (targetY - this.pipY) * lerp;

    // Detect nearby unsolved puzzles / secrets so Pip sparkles eagerly
    let nearSecret = false;
    for (const item of INTERACTABLES) {
      const isChallenge =
        (item.kind === 'echo_shrine' && item.refId && !this.saveState.solvedChallenges.includes(item.refId)) ||
        (item.kind === 'spelling_rune' && item.refId && !this.saveState.solvedChallenges.includes(item.refId)) ||
        (item.kind === 'sentence_pedestal' && item.refId && !this.saveState.solvedChallenges.includes(item.refId)) ||
        (item.kind === 'puzzle_chest' && item.refId && !this.saveState.openedChests.includes(item.refId)) ||
        (item.kind === 'iron_key_spot' && !this.saveState.ironKeyFound);
      if (!isChallenge) continue;
      const dist = Math.hypot(p.x - (item.tileX * TILE_SIZE + 24), p.y - (item.tileY * TILE_SIZE + 24));
      if (dist <= TILE_SIZE * 4.5) {
        nearSecret = true;
        break;
      }
    }
    this.pipNearSecret = nearSecret;
    if (nearSecret && Math.random() < dt * 4) {
      this.particles.spawnAmbientEmber(this.pipX, this.pipY - 12, '#ffe066');
    }
  }

  private updateEnemies(dt: number): void {
    const p = this.saveState.player;
    let activeAttackers = this.enemies.filter((e) => e.state === 'windup' || e.state === 'attack').length;

    for (const enemy of this.enemies) {
      if (enemy.dead) continue;
      if (enemy.hitFlash > 0) enemy.hitFlash -= dt;

      if (enemy.state === 'ko') {
        enemy.koTimer -= dt;
        enemy.x += enemy.vx * dt * 0.4;
        enemy.y += enemy.vy * dt * 0.4;
        if (enemy.koTimer <= 0) {
          enemy.dead = true;
        }
        continue;
      }

      const arch = ENEMY_ARCHETYPES[enemy.kind];

      if (enemy.knockbackTimer > 0) {
        enemy.knockbackTimer -= dt;
        const nx = enemy.x + enemy.vx * dt;
        const ny = enemy.y + enemy.vy * dt;
        if (canStandAt(nx, ny, 12, 10, this.saveState.ruinsGateUnlocked)) {
          enemy.x = nx;
          enemy.y = ny;
        }
        continue;
      }

      const dx = p.x - enemy.x;
      const dy = p.y - enemy.y;
      const dist = Math.hypot(dx, dy);

      if (enemy.x < 17.5 * TILE_SIZE) {
        enemy.x = 17.5 * TILE_SIZE;
      }

      if (enemy.state === 'windup') {
        enemy.stateTimer -= dt;
        if (enemy.stateTimer <= 0) {
          enemy.state = 'attack';
          enemy.stateTimer = 0.16;
          if (dist <= arch.attackRange + 14) {
            this.damagePlayer(arch.damage, enemy.x, enemy.y);
          }
          if (arch.behavior === 'shielded_charger' && dist > 1) {
            const nx = enemy.x + (dx / dist) * 28;
            const ny = enemy.y + (dy / dist) * 28;
            if (canStandAt(nx, ny, 14, 12, this.saveState.ruinsGateUnlocked)) {
              enemy.x = nx;
              enemy.y = ny;
            }
          }
        }
        continue;
      }

      if (enemy.state === 'attack') {
        enemy.stateTimer -= dt;
        if (enemy.stateTimer <= 0) {
          enemy.state = 'recover';
          enemy.stateTimer = arch.attackCooldown;
        }
        continue;
      }

      if (enemy.state === 'recover') {
        enemy.stateTimer -= dt;
        if (enemy.stateTimer <= 0) {
          enemy.state = 'idle';
        }
        continue;
      }

      if (dist <= arch.attackRange && activeAttackers < 2) {
        enemy.state = 'windup';
        enemy.stateTimer = arch.windupDuration;
        activeAttackers++;
        continue;
      }

      if (dist <= arch.aggroRange && Math.floor(p.x / TILE_SIZE) >= 17) {
        enemy.state = 'chase';
        const nxDir = dx / Math.max(1, dist);
        const nyDir = dy / Math.max(1, dist);
        let moveX = 0;
        let moveY = 0;

        if (arch.behavior === 'hopper_chaser') {
          enemy.hopPhase += dt * 5.2;
          const hopBurst = Math.max(0, Math.sin(enemy.hopPhase));
          moveX = nxDir * arch.speed * (0.35 + hopBurst * 1.15) * dt;
          moveY = nyDir * arch.speed * (0.35 + hopBurst * 1.15) * dt;
        } else if (arch.behavior === 'fast_flanker') {
          const perpX = -nyDir * enemy.flankSign * 0.55;
          const perpY = nxDir * enemy.flankSign * 0.55;
          moveX = (nxDir + perpX) * arch.speed * dt;
          moveY = (nyDir + perpY) * arch.speed * dt;
        } else if (arch.behavior === 'night_swooper') {
          enemy.hopPhase += dt * 4;
          const swoop = Math.cos(enemy.hopPhase) * 0.55;
          enemy.x += (nxDir - nyDir * swoop) * arch.speed * dt;
          enemy.y += (nyDir + nxDir * swoop) * arch.speed * dt;
          continue;
        } else if (arch.behavior === 'shielded_charger') {
          moveX = nxDir * arch.speed * dt;
          moveY = nyDir * arch.speed * dt;
        } else if (arch.behavior === 'stationary_turret') {
          continue;
        }

        const candX = enemy.x + moveX;
        const candY = enemy.y + moveY;
        if (candX > 17.5 * TILE_SIZE && canStandAt(candX, enemy.y, 12, 10, this.saveState.ruinsGateUnlocked)) {
          enemy.x = candX;
        }
        if (canStandAt(enemy.x, candY, 12, 10, this.saveState.ruinsGateUnlocked)) {
          enemy.y = candY;
        }
      } else {
        const hdx = enemy.homeX - enemy.x;
        const hdy = enemy.homeY - enemy.y;
        const hdist = Math.hypot(hdx, hdy);
        if (hdist > 36 && arch.speed > 0) {
          const stepX = (hdx / hdist) * arch.speed * 0.45 * dt;
          const stepY = (hdy / hdist) * arch.speed * 0.45 * dt;
          if (canStandAt(enemy.x + stepX, enemy.y + stepY, 12, 10, this.saveState.ruinsGateUnlocked)) {
            enemy.x += stepX;
            enemy.y += stepY;
          }
        }
      }
    }
  }

  private updateBoss(dt: number): void {
    if (this.boss.defeated) return;
    const p = this.saveState.player;
    const playerTileX = Math.floor(p.x / TILE_SIZE);

    if (this.boss.hitFlash > 0) this.boss.hitFlash -= dt;
    if (this.boss.runeBlastTimer > 0) this.boss.runeBlastTimer -= dt;

    if (this.boss.shockwaveActive) {
      this.boss.shockwaveRadius += dt * 460;
      if (this.boss.shockwaveRadius > 460) {
        this.boss.shockwaveActive = false;
      }
    }

    if (this.boss.phase === 'ko') {
      this.boss.koTimer -= dt;
      if (this.boss.koTimer <= 0) {
        this.boss.defeated = true;
        this.boss.active = false;
        this.saveState.bossDefeated = true;
        if (!this.saveState.completedQuests.includes('q_defeat_guardian')) {
          const q3 = QUESTS[2];
          this.saveState.completedQuests.push(q3.id);
          this.saveState.player.coins += q3.rewardCoins;
          awardXp(this.saveState.player, q3.rewardXp);
        }
        discoverVocab(this.saveState, ['guardian', 'courage', 'seal', 'triumph']);
        this.persistMilestone();
        this.screenState = 'gameover';
        this.callbacks.onScreenChange('gameover');

        const allProgress = Object.values(this.saveState.vocabProgress);
        const wordsDiscovered = allProgress.filter((v) => v.discovered).length;
        const wordsMastered = allProgress.filter((v) => v.masteryStars >= 3).length;
        this.callbacks.onVictory({
          daysSurvived: this.saveState.day,
          wordsDiscovered,
          wordsMastered,
          totalWords: VOCAB_LIST.length,
          challengesSolved: this.saveState.solvedChallenges.length,
          bestWordCombo: this.saveState.bestWordCombo || this.wordCombo,
          level: this.saveState.player.level,
          coins: this.saveState.player.coins,
        });
      }
      return;
    }

    if (!this.boss.active) {
      if (this.saveState.ruinsGateUnlocked && playerTileX >= BOSS_ARENA.triggerMinX) {
        this.boss.active = true;
        this.boss.phase = 'idle';
        this.boss.phaseTimer = 2.4;
        audioManager.playSfx('boss_roar');
        audioManager.speakEnglish('Who dares enter the Ancient Ruins? Listen to my commands!');
        this.particles.addShake(0.45);
        this.showToast('Stone Guardian awakens! Listen & obey its English commands!');
        this.emitHud(true);
      }
      return;
    }

    if (playerTileX < 34) {
      this.boss.active = false;
      this.boss.phase = 'dormant';
      return;
    }

    if (this.boss.phase !== 'vulnerable') {
      this.boss.normalAttackTimer -= dt;
      if (this.boss.normalAttackTimer <= 0 && Math.hypot(p.x - this.boss.x, p.y - this.boss.y) < 66) {
        this.boss.normalAttackTimer = 2.2;
        this.damagePlayer(14, this.boss.x, this.boss.y);
      }
    }

    this.boss.phaseTimer -= dt;

    if (this.boss.phase === 'idle' && this.boss.phaseTimer <= 0) {
      const spec = BOSS_COMMANDS[this.boss.commandIndex % BOSS_COMMANDS.length];
      this.boss.commandIndex += 1;
      this.boss.command = spec.type;
      this.boss.commandEn = spec.commandEn;
      this.boss.commandVi = spec.commandVi;
      discoverVocab(this.saveState, spec.vocabIds);

      if (spec.type === 'sleep_shield') {
        this.boss.phase = 'vulnerable';
        this.boss.phaseTimer = BOSS_VULNERABLE_SECONDS;
        this.boss.telegraphMax = BOSS_VULNERABLE_SECONDS;
        audioManager.speakEnglish(spec.commandEn);
        this.particles.spawnFloatingText(this.boss.x, this.boss.y - 52, 'Zzz... SHIELD DOWN (x2)!', '#70e4ff', 1.15);
      } else {
        this.boss.phase = 'telegraph';
        this.boss.phaseTimer = BOSS_TELEGRAPH_SECONDS;
        this.boss.telegraphMax = BOSS_TELEGRAPH_SECONDS;
        audioManager.playSfx('boss_roar');
        audioManager.speakEnglish(spec.commandEn);
      }
      this.emitHud(true);
      return;
    }

    if (this.boss.phase === 'telegraph' && this.boss.phaseTimer <= 0) {
      this.boss.phase = 'executing';
      this.boss.phaseTimer = 1.0;

      if (this.boss.command === 'blue_rune') {
        this.boss.runeBlastTimer = 0.85;
        this.particles.addShake(0.55);
        audioManager.playSfx('boss_roar');
        if (isPlayerOnBlueRune(p.x, p.y)) {
          recordVocabCorrect(this.saveState, 'rune');
          this.particles.spawnFloatingText(p.x, p.y - 32, 'SAFE ON BLUE RUNE!', '#73f5a2', 1.1);
          this.particles.burst(p.x, p.y, '#58c4ff', 16, 90, 4, 30);
        } else {
          this.damagePlayer(26, this.boss.x, this.boss.y);
          this.particles.spawnFloatingText(p.x, p.y - 36, 'STAND ON BLUE RUNE!', '#ff857a', 1.0);
        }
      } else if (this.boss.command === 'stone_pillar') {
        this.boss.shockwaveActive = true;
        this.boss.shockwaveRadius = 24;
        this.particles.addShake(0.6);
        audioManager.playSfx('boss_roar');
        if (isPlayerBehindStonePillar(p.x, p.y, this.boss.x, this.boss.y)) {
          recordVocabCorrect(this.saveState, 'pillar');
          recordVocabCorrect(this.saveState, 'hide');
          this.particles.spawnFloatingText(p.x, p.y - 32, 'SHELTERED!', '#73f5a2', 1.1);
          this.particles.burst(p.x, p.y, '#a6d8ff', 14, 80, 4, 30);
        } else {
          this.damagePlayer(26, this.boss.x, this.boss.y);
          this.particles.spawnFloatingText(p.x, p.y - 36, 'HIDE BEHIND PILLAR!', '#ff857a', 1.0);
        }
      }
      this.emitHud(true);
      return;
    }

    if ((this.boss.phase === 'executing' || this.boss.phase === 'vulnerable') && this.boss.phaseTimer <= 0) {
      this.boss.phase = 'idle';
      this.boss.phaseTimer = 2.6;
      this.boss.command = null;
      this.boss.commandEn = '';
      this.boss.commandVi = '';
      this.emitHud(true);
    }
  }

  private buildWordStrikePrompt(
    enemyId: string,
    enemyName: string,
    vocabId: string,
    word: string
  ): WordStrikePrompt {
    const entry = VOCAB_MAP[vocabId];
    const useContextMode = this.wordStrikeSeed % 2 === 0;
    if (useContextMode && entry) {
      const cloze = buildContextClozeOptions(vocabId, this.wordStrikeSeed);
      if (cloze) {
        return {
          enemyId,
          enemyName,
          vocabId,
          word,
          ipa: entry.ipa,
          mode: 'context',
          contextPrompt: cloze.prompt,
          options: cloze.options,
        };
      }
    }
    return {
      enemyId,
      enemyName,
      vocabId,
      word,
      ipa: entry?.ipa || '',
      mode: 'meaning',
      options: buildWordStrikeOptions(vocabId, this.wordStrikeSeed),
    };
  }

  private updateWordStrikeProximity(dt: number): void {
    if (this.wordStrikeCooldown > 0) {
      this.wordStrikeCooldown -= dt;
      return;
    }

    const p = this.saveState.player;
    let nearest: RuntimeEnemy | null = null;
    let nearestDist = 195;

    for (const enemy of this.enemies) {
      if (enemy.dead || enemy.state === 'ko') continue;
      const d = Math.hypot(enemy.x - p.x, enemy.y - p.y);
      if (d < nearestDist) {
        nearestDist = d;
        nearest = enemy;
      }
    }

    if (nearest) {
      if (!this.activeWordStrike || this.activeWordStrike.enemyId !== nearest.id) {
        discoverVocab(this.saveState, [nearest.vocabId]);
        this.activeWordStrike = this.buildWordStrikePrompt(
          nearest.id,
          ENEMY_ARCHETYPES[nearest.kind].name,
          nearest.vocabId,
          nearest.word
        );
        this.emitHud(true);
      }
      return;
    }

    if (this.boss.active && !this.boss.defeated && this.boss.phase !== 'ko') {
      const distBoss = Math.hypot(this.boss.x - p.x, this.boss.y - p.y);
      if (distBoss < 210) {
        if (!this.activeWordStrike || this.activeWordStrike.enemyId !== 'boss_stone_guardian') {
          const bossWords = ['guardian', 'shield', 'pillar', 'rune', 'ancient', 'courage', 'shelter'];
          const vocabId = bossWords[this.wordStrikeSeed % bossWords.length];
          const entry = VOCAB_MAP[vocabId];
          discoverVocab(this.saveState, [vocabId]);
          this.activeWordStrike = this.buildWordStrikePrompt(
            'boss_stone_guardian',
            'Stone Guardian',
            vocabId,
            entry ? entry.word.toUpperCase() : 'GUARDIAN'
          );
          this.emitHud(true);
        }
        return;
      }
    }

    if (this.activeWordStrike !== null) {
      this.activeWordStrike = null;
      this.emitHud(true);
    }
  }

  private snapCameraToPlayer(): void {
    const { w, h } = this.getViewportSize();
    const maxX = Math.max(0, MAP_WIDTH * TILE_SIZE - w);
    const maxY = Math.max(0, MAP_HEIGHT * TILE_SIZE - h);
    this.camX = Math.max(0, Math.min(maxX, this.saveState.player.x - w / 2));
    this.camY = Math.max(0, Math.min(maxY, this.saveState.player.y - h / 2));
  }

  private updateCamera(dt: number): void {
    const { w, h } = this.getViewportSize();
    const maxX = Math.max(0, MAP_WIDTH * TILE_SIZE - w);
    const maxY = Math.max(0, MAP_HEIGHT * TILE_SIZE - h);
    const targetX = Math.max(0, Math.min(maxX, this.saveState.player.x - w / 2));
    const targetY = Math.max(0, Math.min(maxY, this.saveState.player.y - h / 2));
    const lerp = 1 - Math.exp(-9 * dt);
    this.camX += (targetX - this.camX) * lerp;
    this.camY += (targetY - this.camY) * lerp;
  }

  private buildMinimapMarkers(): MinimapMarker[] {
    const markers: MinimapMarker[] = [];
    for (const item of INTERACTABLES) {
      if (item.kind === 'elder_mara') {
        markers.push({ x: item.tileX, y: item.tileY, kind: 'elder' });
      } else if (item.kind === 'merchant_bram') {
        markers.push({ x: item.tileX, y: item.tileY, kind: 'merchant' });
      } else if (item.kind === 'echo_shrine') {
        markers.push({
          x: item.tileX,
          y: item.tileY,
          kind: 'shrine',
          done: Boolean(item.refId && this.saveState.solvedChallenges.includes(item.refId)),
        });
      } else if (item.kind === 'spelling_rune' || item.kind === 'sentence_pedestal') {
        markers.push({
          x: item.tileX,
          y: item.tileY,
          kind: 'puzzle',
          done: Boolean(item.refId && this.saveState.solvedChallenges.includes(item.refId)),
        });
      } else if (item.kind === 'puzzle_chest') {
        markers.push({
          x: item.tileX,
          y: item.tileY,
          kind: 'puzzle',
          done: Boolean(item.refId && this.saveState.openedChests.includes(item.refId)),
        });
      }
    }
    if (!this.boss.defeated) {
      markers.push({ x: BOSS_ARENA.centerTileX, y: BOSS_ARENA.centerTileY, kind: 'boss' });
    }
    return markers;
  }

  // ==================== HUD SNAPSHOT ====================
  emitHud(force = false): void {
    const p = this.saveState.player;
    const playerTileX = Math.floor(p.x / TILE_SIZE);
    const playerTileY = Math.floor(p.y / TILE_SIZE);
    const zone = getZoneForTileX(playerTileX);
    const activeQuest = getActiveQuest(this.saveState.completedQuests);
    const hotbarItems = buildHotbarItems(this.saveState.inventory);
    if (this.selectedHotbarIndex >= hotbarItems.length && hotbarItems.length > 0) {
      this.selectedHotbarIndex = hotbarItems.length - 1;
    }

    let nearbyPrompt: string | null = null;
    if (this.screenState === 'playing' && this.activeModal === null) {
      const inter = this.findNearbyInteractable();
      if (inter) {
        nearbyPrompt =
          this.saveState.hintMode === 'EN_VI'
            ? `[E] ${inter.labelEn} · ${inter.labelVi}`
            : `[E] ${inter.labelEn}`;
      } else {
        const plot = this.findNearbyFarmPlot();
        if (plot) {
          const actionText =
            plot.state === 'untilled'
              ? 'Till Soil'
              : plot.state === 'tilled'
                ? 'Plant Seed'
                : plot.state === 'planted'
                  ? plot.watered
                    ? 'Watered (Sleep to grow)'
                    : this.saveState.upgrades.wateringCanLevel >= 2
                      ? 'Water 3x3 Patch'
                      : 'Water Crop'
                  : 'Harvest Crop';
          nearbyPrompt = `[E] ${actionText}`;
        }
      }
    }

    const inCombat = this.activeWordStrike !== null || this.boss.active;
    const inPuzzle = this.activeModal?.type === 'puzzle';
    const discoveredCount = Object.values(this.saveState.vocabProgress).filter((v) => v.discovered).length;
    const dashReady = this.dashCooldown <= 0 && p.stamina >= getDashStaminaCost(this.saveState.upgrades);

    const snapshot: HudSnapshot = {
      hp: Math.round(p.hp),
      maxHp: Math.round(p.maxHp),
      stamina: Math.round(p.stamina),
      maxStamina: Math.round(p.maxStamina),
      xp: Math.round(p.xp),
      xpToNext: xpNeededForLevel(p.level),
      level: p.level,
      coins: p.coins,
      day: this.saveState.day,
      timeOfDay: this.saveState.timeOfDay,
      dayProgress: this.dayElapsed / DAY_DURATION_SECONDS,
      weather: this.saveState.weather,
      zone,
      hintMode: this.saveState.hintMode,
      portraitMood: getPortraitMood(p.hp, p.maxHp, p.stamina, p.maxStamina, inCombat, inPuzzle),
      wellRestedBuff: p.wellRestedBuff,
      warmBuff: Boolean(p.warmBuff),
      wordCombo: this.wordCombo,
      surgeCharge: Math.round(this.surgeCharge),
      dashReady,
      upgrades: { ...this.saveState.upgrades },
      activeQuestTitleEn: activeQuest ? activeQuest.titleEn : 'Free Exploration — Lexicon Master',
      activeQuestTitleVi: activeQuest ? activeQuest.titleVi : 'Khám phá tự do — Bậc Thầy Cổ Ngữ',
      hotbarItems,
      selectedHotbarIndex: this.selectedHotbarIndex,
      nearbyPrompt,
      wordStrike: this.activeWordStrike,
      bossHud: this.boss.active
        ? {
            active: true,
            hp: Math.round(this.boss.hp),
            maxHp: this.boss.maxHp,
            phase: this.boss.phase,
            commandEn: this.boss.commandEn,
            commandVi: this.boss.commandVi,
            timerRemaining: Math.max(0, this.boss.phaseTimer),
            timerMax: this.boss.telegraphMax,
          }
        : null,
      minimap: {
        playerTileX,
        playerTileY,
        markers: this.buildMinimapMarkers(),
      },
      muted: audioManager.isMuted(),
      discoveredCount,
      totalVocabCount: VOCAB_LIST.length,
      solvedChallengesCount: this.saveState.solvedChallenges.length,
      totalChallengesCount: TOTAL_CHALLENGE_COUNT,
      toastMessage: this.toastMessage,
    };

    if (force || this.screenState === 'playing') {
      const hotbarSig = hotbarItems.map((h) => `${h.itemId}:${h.qty}`).join(',');
      const bossSig = snapshot.bossHud
        ? `${snapshot.bossHud.hp}:${snapshot.bossHud.phase}:${snapshot.bossHud.commandEn}:${Math.round(snapshot.bossHud.timerRemaining * 5)}`
        : 'none';
      const hudKey = [
        snapshot.hp,
        snapshot.maxHp,
        snapshot.stamina,
        snapshot.maxStamina,
        snapshot.xp,
        snapshot.level,
        snapshot.coins,
        snapshot.day,
        snapshot.timeOfDay,
        snapshot.weather,
        snapshot.zone,
        snapshot.hintMode,
        snapshot.portraitMood,
        snapshot.wellRestedBuff ? 1 : 0,
        snapshot.warmBuff ? 1 : 0,
        snapshot.wordCombo,
        snapshot.surgeCharge,
        snapshot.dashReady ? 1 : 0,
        `${snapshot.upgrades.swordLevel}${snapshot.upgrades.wateringCanLevel}${snapshot.upgrades.bootsLevel}`,
        snapshot.activeQuestTitleEn,
        snapshot.selectedHotbarIndex,
        snapshot.nearbyPrompt || '',
        snapshot.wordStrike ? `${snapshot.wordStrike.enemyId}:${snapshot.wordStrike.word}:${snapshot.wordStrike.mode}` : '',
        bossSig,
        `${playerTileX},${playerTileY}`,
        snapshot.muted ? 1 : 0,
        snapshot.discoveredCount,
        snapshot.solvedChallengesCount,
        snapshot.toastMessage || '',
        hotbarSig,
      ].join('|');

      if (force || hudKey !== this.lastHudKey) {
        this.lastHudKey = hudKey;
        this.callbacks.onHudUpdate(snapshot);
      }
    }
  }

  // ==================== RENDERING ====================
  private render(): void {
    const ctx = this.ctx;
    const { w, h } = this.getViewportSize();
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#1b2618';
    ctx.fillRect(0, 0, w, h);

    const { ox, oy } = this.particles.getShakeOffset();
    const viewX = Math.round(this.camX + ox);
    const viewY = Math.round(this.camY + oy);

    ctx.save();
    ctx.translate(-viewX, -viewY);

    // 1. Pre-rendered static tilemap + organic shorelines/borders
    if (!this.worldLayers || this.worldLayerGateState !== this.saveState.ruinsGateUnlocked) {
      this.buildWorldLayers(this.saveState.ruinsGateUnlocked);
    }
    const waterAnim = Math.floor(this.elapsedTime * 2) % 2;
    const layer = this.worldLayers![waterAnim];
    const sx = Math.max(0, Math.min(layer.width - 1, viewX));
    const sy = Math.max(0, Math.min(layer.height - 1, viewY));
    const sw = Math.min(w, layer.width - sx);
    const sh = Math.min(h, layer.height - sy);
    if (sw > 0 && sh > 0) {
      ctx.drawImage(layer, sx, sy, sw, sh, sx, sy, sw, sh);
    }

    // 2. Farm Plots
    for (const plot of this.saveState.farmPlots) {
      const px = plot.tileX * TILE_SIZE;
      const py = plot.tileY * TILE_SIZE;
      const soilKey =
        plot.state === 'untilled'
          ? 'soil_untilled'
          : plot.watered
            ? 'soil_watered'
            : 'soil_tilled';
      ctx.drawImage(this.sprites.getProp(soilKey), px, py);

      if ((plot.state === 'planted' || plot.state === 'mature') && plot.cropId) {
        const cropImg = this.sprites.getCrop(plot.cropId, plot.state === 'mature');
        const bob = plot.state === 'mature' ? Math.sin(this.elapsedTime * 4 + plot.id) * 2 : 0;
        ctx.drawImage(cropImg, px, py + bob);
      }
    }

    // 3. Boss Arena Telegraph Floor Effects
    if (this.boss.active && !this.boss.defeated) {
      this.renderBossArenaFloor(ctx);
    }

    // 4. Buildings
    for (const b of BUILDINGS) {
      ctx.drawImage(this.sprites.getProp(b.kind), b.tileX * TILE_SIZE, b.tileY * TILE_SIZE);
    }

    // 5. Lantern Posts
    for (const lp of LANTERN_POSTS) {
      ctx.drawImage(this.sprites.getProp('lantern'), lp.tileX * TILE_SIZE, lp.tileY * TILE_SIZE);
    }

    // 6. Interactable Props & NPCs
    const campfireFrame = Math.floor(this.elapsedTime * 5) % 2;
    for (const item of INTERACTABLES) {
      const px = item.tileX * TILE_SIZE;
      const py = item.tileY * TILE_SIZE;

      if (item.kind === 'weather_board') {
        ctx.drawImage(this.sprites.getProp('weather_board'), px, py);
      } else if (item.kind === 'cooking_pot') {
        ctx.drawImage(this.sprites.getProp('cooking_pot'), px, py);
      } else if (item.kind === 'campfire') {
        ctx.drawImage(this.sprites.getProp(`campfire_${campfireFrame}`), px, py);
      } else if (item.kind === 'sign') {
        ctx.drawImage(this.sprites.getProp('sign'), px, py);
      } else if (item.kind === 'starter_chest' || item.kind === 'puzzle_chest') {
        const isOpen = this.saveState.openedChests.includes(item.refId || item.id);
        ctx.drawImage(this.sprites.getProp(isOpen ? 'chest_open' : 'chest_closed'), px, py);
      } else if (item.kind === 'echo_shrine') {
        const solved = Boolean(item.refId && this.saveState.solvedChallenges.includes(item.refId));
        ctx.drawImage(this.sprites.getProp(solved ? 'echo_shrine_solved' : 'echo_shrine_active'), px, py);
        if (!solved) {
          const ringR = 14 + ((this.elapsedTime * 24) % 20);
          ctx.save();
          ctx.strokeStyle = `rgba(88, 210, 255, ${1 - (ringR - 14) / 20})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(px + 24, py + 18, ringR, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
      } else if (item.kind === 'spelling_rune') {
        const solved = Boolean(item.refId && this.saveState.solvedChallenges.includes(item.refId));
        ctx.drawImage(this.sprites.getProp(solved ? 'spelling_rune_solved' : 'spelling_rune_active'), px, py);
      } else if (item.kind === 'sentence_pedestal') {
        const solved = Boolean(item.refId && this.saveState.solvedChallenges.includes(item.refId));
        ctx.drawImage(this.sprites.getProp(solved ? 'sentence_pedestal_solved' : 'sentence_pedestal_active'), px, py);
      } else if (item.kind === 'statue') {
        ctx.drawImage(this.sprites.getProp('statue'), px, py);
      } else if (item.kind === 'forage_herb' && !this.foragedSpots.has(item.id)) {
        ctx.drawImage(this.sprites.getProp('forage_herb'), px, py);
      } else if (item.kind === 'forage_root' && !this.foragedSpots.has(item.id)) {
        ctx.drawImage(this.sprites.getProp('forage_root'), px, py);
      } else if (item.kind === 'iron_key_spot' && !this.saveState.ironKeyFound) {
        const pulse = 0.55 + Math.sin(this.elapsedTime * 5) * 0.45;
        ctx.save();
        ctx.globalAlpha = pulse;
        ctx.fillStyle = '#ffe566';
        ctx.fillRect(px + 20, py + 16, 8, 8);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(px + 22, py + 12, 4, 16);
        ctx.fillRect(px + 16, py + 18, 16, 4);
        ctx.restore();
      } else if (item.kind === 'elder_mara') {
        const bob = Math.sin(this.elapsedTime * 2.5) * 2;
        ctx.drawImage(this.sprites.getElderMara(), px, py + bob);
        this.drawWorldLabel(ctx, px + 24, py - 8, 'Elder Mara', '#f7e5b7', '#26422c');
      } else if (item.kind === 'merchant_bram') {
        const bob = Math.sin(this.elapsedTime * 2.8 + 1.2) * 2;
        ctx.drawImage(this.sprites.getMerchantBram(), px, py + bob);
        this.drawWorldLabel(ctx, px + 24, py - 8, 'Merchant Bram', '#ffe699', '#2b3e5c');
      }
    }

    // 7. Enemies
    for (const enemy of this.enemies) {
      if (enemy.dead) continue;
      this.renderEnemy(ctx, enemy);
    }

    // 8. Boss Stone Guardian
    if (!this.boss.defeated) {
      this.renderBoss(ctx);
    }

    // 9. Lexicon Nova Shockwave Ring
    if (this.novaActive) {
      ctx.save();
      const alpha = Math.max(0, 1 - this.novaRadius / 280);
      ctx.strokeStyle = `rgba(255, 224, 102, ${alpha})`;
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(this.novaOriginX, this.novaOriginY, this.novaRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = `rgba(112, 228, 255, ${alpha * 0.85})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(this.novaOriginX, this.novaOriginY, Math.max(4, this.novaRadius - 14), 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 10. Dash Afterimages + Chibi Player + Pip Companion
    this.renderPlayer(ctx);
    this.renderPipCompanion(ctx);

    // 11. 2.5D Overhanging Tree Canopies (drawn ABOVE characters for true depth!)
    if (this.canopyLayer && sw > 0 && sh > 0) {
      ctx.drawImage(this.canopyLayer, sx, sy, sw, sh, sx, sy, sw, sh);
    }

    // 12. Ambient Butterflies (Day) / Fireflies (Evening & Night)
    const isDarkCritterTime = this.saveState.timeOfDay === 'evening' || this.saveState.timeOfDay === 'night';
    for (const c of this.critters) {
      if (c.x < viewX - 24 || c.x > viewX + w + 24 || c.y < viewY - 24 || c.y > viewY + h + 24) continue;
      if (isDarkCritterTime) {
        const glow = 0.45 + Math.sin(c.phase * 2.2) * 0.45;
        ctx.fillStyle = `rgba(255, 232, 110, ${glow * 0.35})`;
        ctx.beginPath();
        ctx.arc(c.x, c.y, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(255, 248, 176, ${glow})`;
        ctx.fillRect(Math.round(c.x - 1), Math.round(c.y - 1), 3, 3);
      } else {
        const flap = Math.sin(c.phase * 5) > 0 ? 3 : 1;
        ctx.fillStyle = c.color;
        ctx.fillRect(Math.round(c.x - flap), Math.round(c.y), flap, 3);
        ctx.fillRect(Math.round(c.x + 1), Math.round(c.y), flap, 3);
      }
    }

    // 13. Particles & Floating Numbers
    this.particles.render(ctx);

    ctx.restore();

    // 14. Day/Night Lighting, Morning Sunbeams, Lantern Glows & Rain
    this.renderAtmosphere(ctx, w, h, viewX, viewY);
  }

  private renderPlayer(ctx: CanvasRenderingContext2D): void {
    const p = this.saveState.player;
    const step = Math.floor(this.walkDistance / 22) % 2;
    const img = this.sprites.getPlayer(this.playerFacing, step);
    const bob = Math.sin(this.walkDistance * 0.14) * 2;

    // Dash translucent afterimages
    for (const g of this.dashGhosts) {
      ctx.save();
      ctx.globalAlpha = g.alpha * 0.55;
      ctx.drawImage(this.sprites.getPlayer(g.dir, 1), Math.round(g.x - 24), Math.round(g.y - 24));
      ctx.restore();
    }

    // Ground shadow
    ctx.fillStyle = 'rgba(15, 10, 6, 0.36)';
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + 18, 14, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(Math.round(p.x), Math.round(p.y + bob));
    ctx.scale(this.squashX, this.squashY);
    if (this.farmAnimTimer > 0) {
      ctx.rotate(this.playerFacing === 'left' ? -0.18 : 0.18);
    }
    ctx.drawImage(img, -24, -24);

    if (this.playerHitFlash > 0) {
      ctx.globalCompositeOperation = 'source-atop';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fillRect(-24, -24, 48, 48);
    }
    ctx.restore();

    // Sword slash arc visual (scales color with Sword upgrade level!)
    if (this.attackTimer > 0) {
      const progress = 1 - this.attackTimer / 0.24;
      const baseAngle =
        this.playerFacing === 'right'
          ? 0
          : this.playerFacing === 'down'
            ? Math.PI / 2
            : this.playerFacing === 'left'
              ? Math.PI
              : -Math.PI / 2;
      const lv = this.saveState.upgrades.swordLevel;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.strokeStyle = lv >= 3 ? '#b5f3ff' : '#fff5cc';
      ctx.lineWidth = lv >= 2 ? 7 : 6;
      ctx.beginPath();
      ctx.arc(0, 0, 32, baseAngle - 1.0 + progress * 0.4, baseAngle + 0.9 - (1 - progress) * 0.5);
      ctx.stroke();
      ctx.strokeStyle = lv >= 3 ? '#38b6ff' : lv === 2 ? '#e6c873' : '#f2a83b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 26, baseAngle - 0.85, baseAngle + 0.85);
      ctx.stroke();
      ctx.restore();
    }
  }

  private renderPipCompanion(ctx: CanvasRenderingContext2D): void {
    const flapFrame = Math.floor(this.elapsedTime * 5) % 2;
    const pipImg = this.sprites.getPip(flapFrame);
    // Tiny shadow below Pip
    ctx.fillStyle = 'rgba(15, 10, 6, 0.24)';
    ctx.beginPath();
    ctx.ellipse(this.pipX, this.pipY + 20, 8, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.drawImage(pipImg, Math.round(this.pipX - 18), Math.round(this.pipY - 18));

    if (this.pipNearSecret) {
      this.drawWorldLabel(ctx, this.pipX, this.pipY - 22, '!', '#ffe066', 'rgba(34, 24, 16, 0.88)');
    }
  }

  private renderEnemy(ctx: CanvasRenderingContext2D, enemy: RuntimeEnemy): void {
    const img = this.sprites.getEnemy(enemy.kind);
    const arch = ENEMY_ARCHETYPES[enemy.kind];
    const isTargeted = this.activeWordStrike?.enemyId === enemy.id;

    if (enemy.state === 'windup') {
      const pulse = 0.45 + Math.sin(this.elapsedTime * 28) * 0.35;
      ctx.save();
      ctx.strokeStyle = `rgba(255, 76, 66, ${pulse})`;
      ctx.fillStyle = 'rgba(255, 76, 66, 0.16)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y + 8, arch.attackRange * 0.75, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    if (isTargeted) {
      ctx.save();
      ctx.strokeStyle = '#ffd954';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(enemy.x, enemy.y + 16, 20, 9, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    let alpha = 1;
    let rot = 0;
    let scaleY = 1;
    if (enemy.state === 'ko') {
      alpha = Math.max(0, enemy.koTimer / 0.38);
      rot = (1 - alpha) * 1.4;
      scaleY = 0.6 + alpha * 0.4;
    } else if (arch.behavior === 'hopper_chaser') {
      scaleY = 0.92 + Math.abs(Math.sin(enemy.hopPhase)) * 0.16;
    }
    ctx.globalAlpha = alpha;
    ctx.translate(Math.round(enemy.x), Math.round(enemy.y));
    ctx.rotate(rot);
    ctx.scale(1, scaleY);
    ctx.drawImage(img, -24, -24);

    if (enemy.hitFlash > 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.fillRect(-18, -18, 36, 36);
    }
    ctx.restore();

    if (enemy.state !== 'ko') {
      const bw = 36;
      const ratio = Math.max(0, enemy.hp / enemy.maxHp);
      ctx.fillStyle = 'rgba(18,12,10,0.85)';
      ctx.fillRect(Math.round(enemy.x - bw / 2), Math.round(enemy.y - 26), bw, 5);
      ctx.fillStyle = '#e04f44';
      ctx.fillRect(Math.round(enemy.x - bw / 2 + 1), Math.round(enemy.y - 25), Math.round((bw - 2) * ratio), 3);

      this.drawWorldLabel(
        ctx,
        enemy.x,
        enemy.y - 34,
        enemy.word,
        isTargeted ? '#fff4b3' : '#f5ecd7',
        isTargeted ? '#7a3c12' : 'rgba(24, 18, 14, 0.88)'
      );
    }
  }

  private renderBossArenaFloor(ctx: CanvasRenderingContext2D): void {
    if (this.boss.phase === 'telegraph' && this.boss.command === 'blue_rune') {
      const ratio = 1 - this.boss.phaseTimer / this.boss.telegraphMax;
      ctx.save();
      ctx.fillStyle = `rgba(220, 48, 48, ${0.08 + ratio * 0.24})`;
      ctx.fillRect(35 * TILE_SIZE, 9 * TILE_SIZE, 11 * TILE_SIZE, 17 * TILE_SIZE);
      const bx = (BOSS_ARENA.blueRune.tileX - 1) * TILE_SIZE;
      const by = BOSS_ARENA.blueRune.tileY * TILE_SIZE;
      ctx.fillStyle = 'rgba(72, 200, 255, 0.35)';
      ctx.fillRect(bx, by, TILE_SIZE * 2, TILE_SIZE * 2);
      ctx.strokeStyle = '#9be8ff';
      ctx.lineWidth = 4;
      ctx.strokeRect(bx + 2, by + 2, TILE_SIZE * 2 - 4, TILE_SIZE * 2 - 4);
      ctx.restore();
    }

    if (this.boss.runeBlastTimer > 0) {
      ctx.save();
      ctx.fillStyle = `rgba(255, 84, 54, ${this.boss.runeBlastTimer * 0.45})`;
      ctx.fillRect(35 * TILE_SIZE, 9 * TILE_SIZE, 11 * TILE_SIZE, 17 * TILE_SIZE);
      ctx.restore();
    }

    if (this.boss.phase === 'telegraph' && this.boss.command === 'stone_pillar') {
      const ratio = 1 - this.boss.phaseTimer / this.boss.telegraphMax;
      ctx.save();
      ctx.strokeStyle = `rgba(255, 165, 64, ${0.4 + ratio * 0.55})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(this.boss.x, this.boss.y, 45 + ratio * 180, 0, Math.PI * 2);
      ctx.stroke();

      for (const pl of BOSS_ARENA.pillars) {
        ctx.strokeStyle = '#75e6ff';
        ctx.lineWidth = 3;
        ctx.strokeRect(pl.tileX * TILE_SIZE - 4, pl.tileY * TILE_SIZE - 4, TILE_SIZE + 8, TILE_SIZE + 8);
      }
      ctx.restore();
    }

    if (this.boss.shockwaveActive) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 196, 86, 0.9)';
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.arc(this.boss.x, this.boss.y, this.boss.shockwaveRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  private renderBoss(ctx: CanvasRenderingContext2D): void {
    const sleeping = this.boss.phase === 'vulnerable';
    const img = this.sprites.getBoss(sleeping);
    const bob = sleeping ? 0 : Math.sin(this.elapsedTime * 3) * 3;

    ctx.save();
    let alpha = 1;
    if (this.boss.phase === 'ko') {
      alpha = Math.max(0, this.boss.koTimer / 0.9);
    }
    ctx.globalAlpha = alpha;
    ctx.translate(Math.round(this.boss.x), Math.round(this.boss.y + bob));
    ctx.drawImage(img, -48, -48);
    if (this.boss.hitFlash > 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.65)';
      ctx.fillRect(-38, -38, 76, 76);
    }
    ctx.restore();

    if (this.boss.phase !== 'ko') {
      this.drawWorldLabel(
        ctx,
        this.boss.x,
        this.boss.y - 56,
        sleeping ? 'STONE GUARDIAN (SLEEPING x2)' : 'STONE GUARDIAN',
        sleeping ? '#9ef0ff' : '#ffe8b3',
        'rgba(22, 26, 30, 0.92)'
      );
    }
  }

  private drawWorldLabel(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    text: string,
    fg: string,
    bg: string
  ): void {
    ctx.font = '700 12px "JetBrains Mono", monospace';
    const tw = ctx.measureText(text).width;
    const padX = 7;
    const rx = Math.round(x - tw / 2 - padX);
    const ry = Math.round(y - 12);
    ctx.fillStyle = bg;
    ctx.fillRect(rx, ry, Math.round(tw + padX * 2), 18);
    ctx.strokeStyle = 'rgba(218, 184, 122, 0.55)';
    ctx.lineWidth = 1;
    ctx.strokeRect(rx + 0.5, ry + 0.5, Math.round(tw + padX * 2) - 1, 17);
    ctx.fillStyle = fg;
    ctx.textAlign = 'center';
    ctx.fillText(text, Math.round(x), ry + 13);
  }

  private renderAtmosphere(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    viewX: number,
    viewY: number
  ): void {
    const tod = this.saveState.timeOfDay;

    // Warm sunlit morning god rays on sunny days
    if (this.saveState.weather === 'sunny' && (tod === 'morning' || tod === 'afternoon')) {
      ctx.save();
      const grad = ctx.createLinearGradient(0, 0, w * 0.6, h * 0.7);
      grad.addColorStop(0, 'rgba(255, 240, 180, 0.13)');
      grad.addColorStop(0.55, 'rgba(255, 224, 140, 0.04)');
      grad.addColorStop(1, 'rgba(255, 224, 140, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }

    // Time-of-day atmospheric color tint
    if (tod === 'evening') {
      ctx.fillStyle = 'rgba(186, 86, 36, 0.22)';
      ctx.fillRect(0, 0, w, h);
    } else if (tod === 'night') {
      ctx.fillStyle = 'rgba(14, 22, 52, 0.52)';
      ctx.fillRect(0, 0, w, h);
    }

    // Warm light pools for Campfire, Player Torch & Lantern Posts during evening/night
    if (tod === 'evening' || tod === 'night') {
      const intensity = tod === 'night' ? 0.34 : 0.2;
      const drawGlow = (wx: number, wy: number, radius: number, rgbaInner: string) => {
        const gx = wx - viewX;
        const gy = wy - viewY;
        if (gx < -radius || gx > w + radius || gy < -radius || gy > h + radius) return;
        const grad = ctx.createRadialGradient(gx, gy, 8, gx, gy, radius);
        grad.addColorStop(0, rgbaInner);
        grad.addColorStop(1, 'rgba(255, 190, 90, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(gx, gy, radius, 0, Math.PI * 2);
        ctx.fill();
      };

      drawGlow(6 * TILE_SIZE + 24, 19 * TILE_SIZE + 24, 155, `rgba(255, 178, 72, ${intensity})`);
      drawGlow(this.saveState.player.x, this.saveState.player.y, 125, `rgba(255, 210, 120, ${intensity * 0.72})`);
      for (const lp of LANTERN_POSTS) {
        drawGlow(lp.tileX * TILE_SIZE + 30, lp.tileY * TILE_SIZE + 20, 115, `rgba(255, 206, 98, ${intensity * 0.9})`);
      }
    }

    // Cold wind subtle icy vignette
    if (this.saveState.weather === 'cold_wind') {
      ctx.fillStyle = 'rgba(130, 200, 240, 0.1)';
      ctx.fillRect(0, 0, w, h);
    }

    // Rain overlay streaks
    if (this.saveState.weather === 'rainy' && this.screenState === 'playing') {
      ctx.save();
      ctx.strokeStyle = 'rgba(175, 222, 255, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (const drop of this.rainDrops) {
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x - drop.len * 0.25, drop.y + drop.len);
      }
      ctx.stroke();
      ctx.restore();
    }
  }
}
