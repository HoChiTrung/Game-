export type ZoneId = 'homestead' | 'woods' | 'ruins';
export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';
export type WeatherType = 'sunny' | 'rainy' | 'cold_wind';
export type Direction = 'down' | 'up' | 'left' | 'right';
export type GameScreenState = 'title' | 'playing' | 'paused' | 'gameover';
export type CropId = 'sunberry' | 'pumpkin' | 'healing_herb' | 'bitter_root';
export type PortraitMood = 'happy' | 'determined' | 'confused' | 'exhausted';

export interface VocabEntry {
  id: string;
  word: string;
  ipa: string;
  partOfSpeech: string;
  meaningVi: string;
  exampleSentence: string;
  zone: ZoneId;
  level: 'A1' | 'A2' | 'B1';
}

export interface UserVocabProgress {
  vocabId: string;
  discovered: boolean;
  masteryStars: 0 | 1 | 2 | 3;
  correctCount: number;
  lastReviewedDay: number;
}

export interface FarmPlot {
  id: number;
  tileX: number;
  tileY: number;
  state: 'untilled' | 'tilled' | 'planted' | 'mature';
  cropId: CropId | null;
  watered: boolean;
  daysGrown: number;
  daysRequired: number;
}

export interface PlayerUpgrades {
  swordLevel: 1 | 2 | 3;
  wateringCanLevel: 1 | 2;
  bootsLevel: 1 | 2;
}

export interface PlayerSaveData {
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  stamina: number;
  maxStamina: number;
  xp: number;
  level: number;
  coins: number;
  wellRestedBuff: boolean;
  warmBuff?: boolean;
}

export interface SaveState {
  version: string;
  day: number;
  timeOfDay: TimeOfDay;
  weather: WeatherType;
  hintMode: 'EN' | 'EN_VI';
  player: PlayerSaveData;
  inventory: Record<string, number>;
  farmPlots: FarmPlot[];
  completedQuests: string[];
  openedChests: string[];
  solvedChallenges: string[];
  ruinsGateUnlocked: boolean;
  bossDefeated: boolean;
  vocabProgress: Record<string, UserVocabProgress>;
  upgrades: PlayerUpgrades;
  ironKeyFound?: boolean;
  statueSolved?: boolean;
  todayEncounteredVocabIds?: string[];
  bestWordCombo?: number;
}

export interface ItemDefinition {
  id: string;
  name: string;
  nameVi: string;
  category: 'seed' | 'crop' | 'food' | 'key' | 'material';
  descriptionEn: string;
  descriptionVi: string;
  cropId?: CropId;
  healHp?: number;
  restoreStamina?: number;
  grantsWarm?: boolean;
  price?: number;
  vocabId?: string;
}

export interface RecipeDefinition {
  id: string;
  resultItemId: string;
  titleEn: string;
  titleVi: string;
  instructionEn: string;
  instructionVi: string;
  ingredients: Array<{ itemId: string; qty: number }>;
  vocabIds: string[];
}

export interface GearUpgradeDefinition {
  id: 'sword' | 'watering_can' | 'boots';
  targetLevel: number;
  titleEn: string;
  titleVi: string;
  descriptionEn: string;
  descriptionVi: string;
  costCoins: number;
  ingredients: Array<{ itemId: string; qty: number }>;
  vocabIds: string[];
}

export interface QuestDefinition {
  id: string;
  titleEn: string;
  titleVi: string;
  objectiveEn: string;
  objectiveVi: string;
  rewardCoins: number;
  rewardXp: number;
  rewardItems?: Record<string, number>;
}

export interface PuzzleChestDefinition {
  id: string;
  tileX: number;
  tileY: number;
  titleEn: string;
  titleVi: string;
  storySentenceEn: string;
  storySentenceVi: string;
  options: Array<{ text: string; correct: boolean }>;
  rewardCoins: number;
  rewardXp: number;
  rewardItems: Record<string, number>;
  vocabIds: string[];
}

export interface EchoShrineChallenge {
  id: string;
  tileX: number;
  tileY: number;
  zone: ZoneId;
  titleEn: string;
  titleVi: string;
  spokenText: string;
  spokenMeaningVi: string;
  questionEn: string;
  questionVi: string;
  options: Array<{ labelEn: string; labelVi: string; correct: boolean }>;
  rewardCoins: number;
  rewardXp: number;
  rewardItems: Record<string, number>;
  vocabIds: string[];
}

export interface SpellingRuneChallenge {
  id: string;
  tileX: number;
  tileY: number;
  titleEn: string;
  titleVi: string;
  targetWord: string;
  clueEn: string;
  clueVi: string;
  pipHintEn: string;
  rewardCoins: number;
  rewardXp: number;
  rewardItems: Record<string, number>;
  vocabIds: string[];
}

export interface SentencePedestalChallenge {
  id: string;
  tileX: number;
  tileY: number;
  titleEn: string;
  titleVi: string;
  correctTokens: string[];
  meaningVi: string;
  grammarTipEn: string;
  grammarTipVi: string;
  rewardCoins: number;
  rewardXp: number;
  rewardItems: Record<string, number>;
  vocabIds: string[];
}

export interface MerchantBargainChallenge {
  id: string;
  promptEn: string;
  promptVi: string;
  options: Array<{ textEn: string; replyEn: string; replyVi: string; correct: boolean }>;
  vocabIds: string[];
}

export interface StatueRiddleDefinition {
  id: string;
  tileX: number;
  tileY: number;
  titleEn: string;
  titleVi: string;
  riddleEn: string;
  riddleVi: string;
  requiredItemId: string;
  rewardCoins: number;
  rewardXp: number;
  rewardItems: Record<string, number>;
  vocabIds: string[];
}

export interface ClueSignDefinition {
  id: string;
  tileX: number;
  tileY: number;
  titleEn: string;
  titleVi: string;
  textEn: string;
  textVi: string;
  vocabIds: string[];
}

export type EnemyKind =
  | 'slime_red'
  | 'slime_blue'
  | 'slime_green'
  | 'goblin'
  | 'bramble'
  | 'night_bat'
  | 'night_owl'
  | 'sentinel';

export type EnemyBehaviorPolicy =
  | 'hopper_chaser'
  | 'fast_flanker'
  | 'stationary_turret'
  | 'night_swooper'
  | 'shielded_charger';

export interface EnemyArchetype {
  kind: EnemyKind;
  name: string;
  nameVi: string;
  zone: ZoneId;
  nightOnly: boolean;
  maxHp: number;
  damage: number;
  speed: number;
  xpReward: number;
  coinReward: number;
  dropItemId?: string;
  aggroRange: number;
  attackRange: number;
  windupDuration: number;
  attackCooldown: number;
  behavior: EnemyBehaviorPolicy;
  vocabIds: string[];
}

export interface RuntimeEnemy {
  id: string;
  kind: EnemyKind;
  x: number;
  y: number;
  homeX: number;
  homeY: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  vocabId: string;
  word: string;
  facing: Direction;
  hitFlash: number;
  knockbackTimer: number;
  state: 'idle' | 'chase' | 'windup' | 'attack' | 'recover' | 'ko';
  stateTimer: number;
  koTimer: number;
  hopPhase: number;
  flankSign: number;
  dead: boolean;
}

export type BossCommandType = 'blue_rune' | 'stone_pillar' | 'sleep_shield';

export interface BossCommandSpec {
  type: BossCommandType;
  commandEn: string;
  commandVi: string;
  vocabIds: string[];
}

export interface BossRuntimeState {
  active: boolean;
  defeated: boolean;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  phase: 'dormant' | 'idle' | 'telegraph' | 'executing' | 'vulnerable' | 'ko';
  phaseTimer: number;
  command: BossCommandType | null;
  commandEn: string;
  commandVi: string;
  telegraphMax: number;
  hitFlash: number;
  normalAttackTimer: number;
  commandIndex: number;
  shockwaveRadius: number;
  shockwaveActive: boolean;
  runeBlastTimer: number;
  koTimer: number;
}

export interface WordStrikeOption {
  label: string;
  correct: boolean;
}

export interface WordStrikePrompt {
  enemyId: string;
  enemyName: string;
  vocabId: string;
  word: string;
  ipa: string;
  mode: 'meaning' | 'context';
  contextPrompt?: string;
  options: WordStrikeOption[];
}

export interface DialogPayload {
  kind: 'weather' | 'sign' | 'elder' | 'merchant' | 'notice' | 'gate';
  speakerEn: string;
  speakerVi: string;
  textEn: string;
  textVi: string;
  vocabIds?: string[];
  canBuySeeds?: boolean;
  merchantDiscountActive?: boolean;
  merchantBargainId?: string;
  canUnlockGate?: boolean;
  activeQuestTextEn?: string;
  activeQuestTextVi?: string;
  questCompletedBanner?: string;
}

export type ActiveModal =
  | null
  | { type: 'dialog'; payload: DialogPayload }
  | { type: 'crafting'; initialTab: 'cook' | 'bag' | 'forge' }
  | { type: 'puzzle'; puzzleKind: 'chest'; chestId: string }
  | { type: 'puzzle'; puzzleKind: 'statue' }
  | { type: 'puzzle'; puzzleKind: 'echo'; challengeId: string }
  | { type: 'puzzle'; puzzleKind: 'spelling'; challengeId: string }
  | { type: 'puzzle'; puzzleKind: 'sentence'; challengeId: string }
  | { type: 'lexicon' }
  | { type: 'campfire' };

export interface MinimapMarker {
  x: number; // tileX
  y: number; // tileY
  kind: 'player' | 'elder' | 'merchant' | 'shrine' | 'puzzle' | 'boss';
  done?: boolean;
}

export interface HudSnapshot {
  hp: number;
  maxHp: number;
  stamina: number;
  maxStamina: number;
  xp: number;
  xpToNext: number;
  level: number;
  coins: number;
  day: number;
  timeOfDay: TimeOfDay;
  dayProgress: number;
  weather: WeatherType;
  zone: ZoneId;
  hintMode: 'EN' | 'EN_VI';
  portraitMood: PortraitMood;
  wellRestedBuff: boolean;
  warmBuff: boolean;
  wordCombo: number;
  surgeCharge: number; // 0..100
  dashReady: boolean;
  upgrades: PlayerUpgrades;
  activeQuestTitleEn: string;
  activeQuestTitleVi: string;
  hotbarItems: Array<{ itemId: string; qty: number }>;
  selectedHotbarIndex: number;
  nearbyPrompt: string | null;
  wordStrike: WordStrikePrompt | null;
  bossHud: {
    active: boolean;
    hp: number;
    maxHp: number;
    phase: BossRuntimeState['phase'];
    commandEn: string;
    commandVi: string;
    timerRemaining: number;
    timerMax: number;
  } | null;
  minimap: {
    playerTileX: number;
    playerTileY: number;
    markers: MinimapMarker[];
  };
  muted: boolean;
  discoveredCount: number;
  totalVocabCount: number;
  solvedChallengesCount: number;
  totalChallengesCount: number;
  toastMessage: string | null;
}

export interface VictoryStats {
  daysSurvived: number;
  wordsDiscovered: number;
  wordsMastered: number;
  totalWords: number;
  challengesSolved: number;
  bestWordCombo: number;
  level: number;
  coins: number;
}
