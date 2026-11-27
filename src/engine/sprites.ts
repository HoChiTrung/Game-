import { BASE_TILE_SIZE, MAP_HEIGHT, MAP_WIDTH, RENDER_SCALE, TILE_SIZE, TileKind } from '../data/mapData';
import { CropId, Direction, EnemyKind, PortraitMood } from '../types/game';

type PixelPalette = Record<string, string>;

function makeOffscreen(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function drawMatrix(
  matrix: string[],
  palette: PixelPalette,
  scale = RENDER_SCALE
): HTMLCanvasElement {
  const h = matrix.length;
  const w = matrix[0].length;
  const canvas = makeOffscreen(w * scale, h * scale);
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;

  for (let y = 0; y < h; y++) {
    const row = matrix[y];
    for (let x = 0; x < w; x++) {
      const ch = row[x];
      if (ch === '.' || ch === ' ') continue;
      const color = palette[ch];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(x * scale, y * scale, scale, scale);
    }
  }
  return canvas;
}

// ==========================================
// CHIBI PLAYER MATRICES (16x16, ~2.5 head ratio)
// ==========================================
const PLAYER_PALETTE: PixelPalette = {
  o: '#221712',
  h: '#6e4226',
  H: '#9e633b',
  s: '#f8d2b0',
  b: '#e89d8b',
  e: '#1d1822',
  w: '#ffffff',
  r: '#d63b2f',
  R: '#a8261d',
  c: '#8d5b36',
  C: '#6b4125',
  p: '#3f5a78',
  k: '#3d281a',
  g: '#e6b84c',
};

const PLAYER_DOWN_0 = [
  '....oooooooo....',
  '...oHHhhhhhho...',
  '..oHhhhhhhhhho..',
  '..ohssssssssho..',
  '..oswessssweso..',
  '..osbssssssbso..',
  '...oossssssoo...',
  '..oorrrrrrrroo..',
  '..orRrrrrrrRro..',
  '..oCccgcccCcco..',
  '..oCccccccccCo..',
  '...oCppppppo....',
  '...opp....pp....',
  '...okko..okko...',
  '....oo....oo....',
  '................',
];

const PLAYER_DOWN_1 = [
  '....oooooooo....',
  '...oHHhhhhhho...',
  '..oHhhhhhhhhho..',
  '..ohssssssssho..',
  '..oswessssweso..',
  '..osbssssssbso..',
  '...oossssssoo...',
  '..oorrrrrrrroo..',
  '..orRrrrrrrRro..',
  '..oCccgcccCcco..',
  '...oCccccccCo...',
  '...oCppppppo....',
  '..opp......ppo..',
  '..okko....okko..',
  '...oo......oo...',
  '................',
];

const PLAYER_UP_0 = [
  '....oooooooo....',
  '...oHHhhhhhho...',
  '..oHhhhhhhhhho..',
  '..ohhhhhhhhhho..',
  '..ohhhhhhhhhho..',
  '..ohhhhhhhhhho..',
  '...oohhhhhhoo...',
  '..oorrrrrrrroo..',
  '..orRkkkkkkRro..',
  '..oCckgkkkgkCo..',
  '..oCckkkkkkkCo..',
  '...oCppppppo....',
  '...opp....pp....',
  '...okko..okko...',
  '....oo....oo....',
  '................',
];

const PLAYER_UP_1 = [
  '....oooooooo....',
  '...oHHhhhhhho...',
  '..oHhhhhhhhhho..',
  '..ohhhhhhhhhho..',
  '..ohhhhhhhhhho..',
  '..ohhhhhhhhhho..',
  '...oohhhhhhoo...',
  '..oorrrrrrrroo..',
  '..orRkkkkkkRro..',
  '..oCckgkkkgkCo..',
  '...oCkkkkkkCo...',
  '...oCppppppo....',
  '..opp......ppo..',
  '..okko....okko..',
  '...oo......oo...',
  '................',
];

const PLAYER_RIGHT_0 = [
  '....oooooooo....',
  '...oHHhhhhhho...',
  '..oHhhhhhhhhho..',
  '..ohhhssssssho..',
  '..ohhhsswessso..',
  '..ohhhsssbssso..',
  '...oohsssssoo...',
  '..oorrrrrrrroo..',
  '..okkRrrrrrrro..',
  '..okkgccccccCo..',
  '..okkkccccccCo..',
  '...oCppppppo....',
  '....opp..pp.....',
  '....okko.okko...',
  '.....oo...oo....',
  '................',
];

const PLAYER_RIGHT_1 = [
  '....oooooooo....',
  '...oHHhhhhhho...',
  '..oHhhhhhhhhho..',
  '..ohhhssssssho..',
  '..ohhhsswessso..',
  '..ohhhsssbssso..',
  '...oohsssssoo...',
  '..oorrrrrrrroo..',
  '..okkRrrrrrrro..',
  '..okkgccccccCo..',
  '..okkkccccccCo..',
  '...oCppppppo....',
  '...opp....ppo...',
  '..okko....okko..',
  '...oo......oo...',
  '................',
];

// Elder Mara (16x16 chibi sage)
const MARA_PALETTE: PixelPalette = {
  o: '#1c1816',
  g: '#2e6b43',
  G: '#448f5c',
  y: '#e6b84c',
  w: '#f3efe6',
  W: '#d1cbc0',
  s: '#f3caa7',
  e: '#1d1c24',
  b: '#58b8ff',
  k: '#6b4226',
};

const MARA_MATRIX = [
  '....oooooooo....',
  '...oGGGGGGGGoo..',
  '..oGggggggggGo..',
  '..ogyyyyyyyygo..',
  '..owsssssssswo..',
  '..owsesssseswo..',
  '..owwwwwwwwwwo..',
  '..oWwwwwwwwwWo..',
  '.oGgyywwwwyygGo.',
  '.oGgggywwygggkbo',
  '.oGgggywwygggko.',
  '..oGggyyyyggko..',
  '..oGggggggggko..',
  '...oGgyyyygko...',
  '....oo....oo....',
  '................',
];

// Merchant Bram (16x16 chibi traveler with wide hat & pack)
const BRAM_PALETTE: PixelPalette = {
  o: '#211712',
  t: '#b06f35', // traveler hat
  T: '#d9984c', // hat highlight
  y: '#ffd966', // gold buckle / feather
  s: '#f6cca5', // skin
  e: '#1d1822', // eyes
  b: '#2b6cb0', // blue merchant tunic
  B: '#1e4e82', // tunic shadow
  p: '#7c4824', // backpack
  r: '#c93c32', // red neckerchief
  k: '#3d281a', // boots
};

const BRAM_MATRIX = [
  '....oooooooo....',
  '..ooTTttttTToo..',
  '.oTTttttttttTTo.',
  'ooyyyyyyyyyyyyoo',
  '..ootsssssssto..',
  '..osesssssseso..',
  '...oossssssoo...',
  '..oorrrrrrrroo..',
  '.opBbbbbbbbbBpo.',
  '.oppbbbyybbbppo.',
  '.opBbbbbbbbbBpo.',
  '..ooBbbbbbbBoo..',
  '...oBB....BBo...',
  '...okko..okko...',
  '....oo....oo....',
  '................',
];

// Chibi Companion Pet: Pip the Lexicon Owl (12x12)
const PIP_PALETTE: PixelPalette = {
  o: '#221712',
  f: '#f5e6cc', // cream belly feathers
  w: '#a6764b', // warm tawny wing
  W: '#c99763', // light wing
  y: '#ffd24c', // golden owl eyes & beak
  e: '#1c1721', // pupil
  r: '#d63b2f', // tiny red explorer ribbon
};

const PIP_FRAME_0 = [
  '..oo....oo..',
  '.oWWooooWWo.',
  '.oWWWWWWWWo.',
  'oWWyeyyeyWWo',
  'oWWwyyyywWWo',
  'owwffffffwwo',
  'owwffrrffwwo',
  '.owffffffwo.',
  '.owwffffwwo.',
  '..oowwwwoo..',
  '...oy..yo...',
  '............',
];

const PIP_FRAME_1 = [
  '..oo....oo..',
  '.oWWooooWWo.',
  'oWWWWWWWWWWo',
  'oWWyeyyeyWWo',
  'oWWwyyyywWWo',
  'oWwffffffwWo',
  '.owffrrffwo.',
  '..owffffwo..',
  '..owwffwwo..',
  '...ooyyoo...',
  '............',
  '............',
];

// Enemy Matrices
const SLIME_MATRIX = [
  '................',
  '................',
  '.....oooooo.....',
  '...ooLLLLLLoo...',
  '..oLLbbbbbbLLo..',
  '.oLbbbbbbbbbbLo.',
  '.oLbbwebbwebbLo.',
  '.oLbbebbbebbbLo.',
  '.oLbbbkbbkbbbLo.',
  '.oLbbbbbbbbbbLo.',
  '.oDbbbbbbbbbbDo.',
  '..oDDDDDDDDDDo..',
  '...oooooooooo...',
  '................',
  '................',
  '................',
];

const GOBLIN_MATRIX = [
  '................',
  '.oo..oooooo..oo.',
  'oGGoGGGGGGGGooGo',
  '.oGGGGGGGGGGGGoo',
  '..oGGyeGGyeGGo..',
  '..oGGeeGGeeGGo..',
  '...oGGrrrrGGo...',
  '....ooGGGGoo....',
  '...oBBbbbbBBo...',
  '..oBbbbyybbbBo..',
  '..oBbbbbbbbbBo..',
  '...oBbb..bbBo...',
  '...oKKo..oKKo...',
  '....oo....oo....',
  '................',
  '................',
];

const BRAMBLE_MATRIX = [
  '.....oo..oo.....',
  '...ooPPooPPoo...',
  '..oPPppPPppPPo..',
  '..oPpyyPPyypPo..',
  '.oGGooPPPPooGGo.',
  'oGggGGooooGGggGo',
  '.oGgggGGGGgggGo.',
  '..oGggGggGggGo..',
  '.oTGGgGGGGgGGTo.',
  '..oGGgGggGgGGo..',
  '...oGGggggGGo...',
  '..oKKoGGGGooKKo.',
  '..oKKooKKooKKo..',
  '...oooooooooo...',
  '................',
  '................',
];

const BAT_MATRIX = [
  '................',
  '................',
  '.oo..........oo.',
  'oPPo..oooo..oPPo',
  'oPPPoPPPPPPoPPPo',
  'oPPPPPyPPyPPPPPo',
  '.oPPPPPPPPPPPPo.',
  '..ooPPwPPwPPoo..',
  '....ooPPPPoo....',
  '.....oPPPPo.....',
  '......oooo......',
  '................',
  '................',
  '................',
  '................',
  '................',
];

const OWL_MATRIX = [
  '....oo....oo....',
  '...oBBo..oBBo...',
  '..oBBBBBBBBBBoo.',
  '..oBBYYBBYYBBBo.',
  '..oBByYBBYyyBBo.',
  '..oBBBBooBBBBBo.',
  '.oDBBbbBBbbBBDo.',
  '.oDBBbbbbbbBBDo.',
  '.oDBBbbBBbbBBDo.',
  '..oDBBbbbbBBDo..',
  '...oDDBBBBDDoo..',
  '....oYY..YYo....',
  '.....oo..oo.....',
  '................',
  '................',
  '................',
];

const SENTINEL_MATRIX = [
  '....oooooooo....',
  '...oSSssssSSo...',
  '..oSssCCCCssSo..',
  '..oSssCccCssSo..',
  '..oSssssssssSo..',
  '...ooSSSSSSoo...',
  '.ooSSsCCCCsSSoo.',
  'oSSssSCCCCSssSSo',
  'oSSssSssssSssSSo',
  'oSSssSssssSssSSo',
  '.ooSSsSSSSsSSoo.',
  '...oSSs..sSSo...',
  '...oDDo..oDDo...',
  '...ooo....ooo...',
  '................',
  '................',
];

function flipHorizontal(matrix: string[]): string[] {
  return matrix.map((row) => row.split('').reverse().join(''));
}

export class SpriteManager {
  private tileCache = new Map<string, HTMLCanvasElement>();
  private canopyCache = new Map<string, HTMLCanvasElement>();
  private playerCache = new Map<string, HTMLCanvasElement>();
  private enemyCache = new Map<string, HTMLCanvasElement>();
  private propCache = new Map<string, HTMLCanvasElement>();
  private cropCache = new Map<string, HTMLCanvasElement>();
  private itemIconUrls = new Map<string, string>();
  private bossCanvasActive: HTMLCanvasElement;
  private bossCanvasSleep: HTMLCanvasElement;
  private elderCanvas: HTMLCanvasElement;
  private bramCanvas: HTMLCanvasElement;
  private pipFrames: [HTMLCanvasElement, HTMLCanvasElement];
  private customSheet: HTMLImageElement | null = null;
  private portraitUrls: Record<PortraitMood, string>;

  constructor() {
    this.buildTiles();
    this.buildTreeCanopies();
    this.buildPlayer();
    this.elderCanvas = drawMatrix(MARA_MATRIX, MARA_PALETTE);
    this.bramCanvas = drawMatrix(BRAM_MATRIX, BRAM_PALETTE);
    this.pipFrames = [
      drawMatrix(PIP_FRAME_0, PIP_PALETTE, RENDER_SCALE),
      drawMatrix(PIP_FRAME_1, PIP_PALETTE, RENDER_SCALE),
    ];
    this.buildEnemies();
    this.buildProps();
    this.buildCrops();
    this.buildItemIcons();
    this.bossCanvasActive = this.buildBossSprite(false);
    this.bossCanvasSleep = this.buildBossSprite(true);
    this.portraitUrls = {
      happy: this.buildPortrait('happy'),
      determined: this.buildPortrait('determined'),
      confused: this.buildPortrait('confused'),
      exhausted: this.buildPortrait('exhausted'),
    };
  }

  loadOptionalSheet(url: string): void {
    const img = new Image();
    img.onload = () => {
      this.customSheet = img;
    };
    img.onerror = () => {
      this.customSheet = null;
    };
    img.src = url;
  }

  hasCustomSheet(): boolean {
    return this.customSheet !== null;
  }

  getPortraitUrl(mood: PortraitMood): string {
    return this.portraitUrls[mood];
  }

  getItemIconUrl(itemId: string): string {
    return this.itemIconUrls.get(itemId) || this.itemIconUrls.get('rune_shard') || '';
  }

  getTile(kind: TileKind, animFrame = 0): HTMLCanvasElement {
    if (kind === 'water') {
      return this.tileCache.get(animFrame % 2 === 0 ? 'water_0' : 'water_1')!;
    }
    return this.tileCache.get(kind) || this.tileCache.get('grass')!;
  }

  getTreeCanopy(kind: 'tree' | 'pine'): HTMLCanvasElement {
    return this.canopyCache.get(kind)!;
  }

  getPlayer(dir: Direction, stepFrame: number): HTMLCanvasElement {
    const key = `${dir}_${stepFrame % 2}`;
    return this.playerCache.get(key) || this.playerCache.get('down_0')!;
  }

  getElderMara(): HTMLCanvasElement {
    return this.elderCanvas;
  }

  getMerchantBram(): HTMLCanvasElement {
    return this.bramCanvas;
  }

  getPip(frame: number): HTMLCanvasElement {
    return this.pipFrames[frame % 2];
  }

  getEnemy(kind: EnemyKind): HTMLCanvasElement {
    return this.enemyCache.get(kind) || this.enemyCache.get('slime_red')!;
  }

  getBoss(sleeping: boolean): HTMLCanvasElement {
    return sleeping ? this.bossCanvasSleep : this.bossCanvasActive;
  }

  getProp(name: string): HTMLCanvasElement {
    return this.propCache.get(name) || this.propCache.get('sign')!;
  }

  getCrop(cropId: CropId, mature: boolean): HTMLCanvasElement {
    const key = mature ? `${cropId}_mature` : `${cropId}_sprout`;
    return this.cropCache.get(key) || this.cropCache.get('sunberry_sprout')!;
  }

  /**
   * Bakes organic river shorelines, foam highlights, rounded cobblestone path borders,
   * and subtle ruin wall drop shadows directly onto the static worldLayer canvas once.
   */
  renderAutoTileTransitions(
    ctx: CanvasRenderingContext2D,
    tiles: TileKind[][],
    gateUnlocked: boolean
  ): void {
    const S = TILE_SIZE;
    const u = RENDER_SCALE; // 3px pixel unit
    const at = (x: number, y: number): TileKind => {
      if (x < 0 || y < 0 || x >= MAP_WIDTH || y >= MAP_HEIGHT) return 'tree';
      const t = tiles[y][x];
      if (t === 'ruin_gate' && gateUnlocked) return 'ruin_floor';
      return t;
    };

    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        const t = at(x, y);
        const px = x * S;
        const py = y * S;

        // 1. Organic sandy riverbank + water foam on water edges
        if (t === 'water') {
          const n = at(x, y - 1);
          const s = at(x, y + 1);
          const w = at(x - 1, y);
          const e = at(x + 1, y);

          const isLand = (k: TileKind) => k !== 'water' && k !== 'bridge';

          if (isLand(n)) {
            ctx.fillStyle = '#d4b483';
            ctx.fillRect(px, py, S, u * 2);
            ctx.fillStyle = '#a3e0f5';
            ctx.fillRect(px + u, py + u * 2, S - u * 2, u);
          }
          if (isLand(s)) {
            ctx.fillStyle = '#d4b483';
            ctx.fillRect(px, py + S - u * 2, S, u * 2);
            ctx.fillStyle = '#89d0eb';
            ctx.fillRect(px + u, py + S - u * 3, S - u * 2, u);
          }
          if (isLand(w)) {
            ctx.fillStyle = '#d4b483';
            ctx.fillRect(px, py, u * 2, S);
            ctx.fillStyle = '#a3e0f5';
            ctx.fillRect(px + u * 2, py + u, u, S - u * 2);
          }
          if (isLand(e)) {
            ctx.fillStyle = '#d4b483';
            ctx.fillRect(px + S - u * 2, py, u * 2, S);
            ctx.fillStyle = '#89d0eb';
            ctx.fillRect(px + S - u * 3, py + u, u, S - u * 2);
          }
        }

        // 2. Soft organic path-to-grass border pebbles & tuft overhang
        if (t === 'path') {
          const isGrass = (k: TileKind) => k === 'grass' || k === 'grass_flower';
          if (isGrass(at(x, y - 1))) {
            ctx.fillStyle = '#6c9d52';
            ctx.fillRect(px, py, S, u);
            ctx.fillStyle = '#9e7c51';
            ctx.fillRect(px + u * 2, py + u, S - u * 4, u);
          }
          if (isGrass(at(x, y + 1))) {
            ctx.fillStyle = '#53803f';
            ctx.fillRect(px, py + S - u, S, u);
            ctx.fillStyle = '#9e7c51';
            ctx.fillRect(px + u * 2, py + S - u * 2, S - u * 4, u);
          }
          if (isGrass(at(x - 1, y))) {
            ctx.fillStyle = '#6c9d52';
            ctx.fillRect(px, py, u, S);
          }
          if (isGrass(at(x + 1, y))) {
            ctx.fillStyle = '#53803f';
            ctx.fillRect(px + S - u, py, u, S);
          }
        }

        // 3. Soft drop shadow beneath Ruin Walls onto Ruin Floor
        if (t === 'ruin_floor' && at(x, y - 1) === 'ruin_wall') {
          ctx.fillStyle = 'rgba(12, 16, 18, 0.34)';
          ctx.fillRect(px, py, S, u * 3);
        }
      }
    }
  }

  private buildTiles(): void {
    const S = BASE_TILE_SIZE * RENDER_SCALE; // 48
    const makeTile = (key: string, fn: (ctx: CanvasRenderingContext2D, s: number) => void) => {
      const c = makeOffscreen(S, S);
      const ctx = c.getContext('2d')!;
      ctx.imageSmoothingEnabled = false;
      fn(ctx, S);
      this.tileCache.set(key, c);
    };

    const px = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) => {
      ctx.fillStyle = color;
      ctx.fillRect(x * RENDER_SCALE, y * RENDER_SCALE, w * RENDER_SCALE, h * RENDER_SCALE);
    };

    makeTile('grass', (ctx) => {
      px(ctx, 0, 0, 16, 16, '#5c8c47');
      // warm sunlit meadow patches
      px(ctx, 1, 2, 4, 2, '#689c50');
      px(ctx, 9, 9, 4, 3, '#64964d');
      // crisp pixel grass blades
      px(ctx, 2, 3, 2, 1, '#7ab05d');
      px(ctx, 10, 5, 2, 1, '#4b7539');
      px(ctx, 6, 12, 2, 1, '#7ab05d');
      px(ctx, 13, 13, 1, 2, '#4b7539');
      px(ctx, 3, 10, 1, 2, '#73a858');
    });

    makeTile('grass_flower', (ctx) => {
      px(ctx, 0, 0, 16, 16, '#5c8c47');
      px(ctx, 1, 1, 5, 4, '#66994e');
      // golden buttercup
      px(ctx, 3, 4, 2, 2, '#ffe066');
      px(ctx, 4, 5, 1, 1, '#d97724');
      // sky-white daisy
      px(ctx, 11, 10, 2, 2, '#fff5e6');
      px(ctx, 12, 11, 1, 1, '#f0a630');
      // tiny pink blossom
      px(ctx, 10, 3, 2, 1, '#f7a1b5');
      px(ctx, 7, 13, 1, 2, '#4b7539');
    });

    makeTile('path', (ctx) => {
      px(ctx, 0, 0, 16, 16, '#c7a77b');
      // warm cobblestone variation
      px(ctx, 1, 2, 4, 3, '#d6b990');
      px(ctx, 2, 3, 3, 1, '#e3ca9e');
      px(ctx, 8, 5, 5, 3, '#b89567');
      px(ctx, 9, 6, 3, 1, '#c9a87c');
      px(ctx, 3, 10, 5, 3, '#b59264');
      px(ctx, 11, 11, 3, 3, '#d4b68c');
      px(ctx, 6, 14, 2, 1, '#9e7c51');
    });

    const buildWater = (shift: number) => (ctx: CanvasRenderingContext2D) => {
      px(ctx, 0, 0, 16, 16, '#2b6d99');
      px(ctx, 0, 4, 16, 4, '#3179a8');
      px(ctx, 0, 11, 16, 3, '#26628a');
      px(ctx, (2 + shift) % 13, 3, 4, 1, '#66b8e0');
      px(ctx, (8 + shift) % 11, 7, 5, 1, '#90d5f5');
      px(ctx, (4 + shift) % 12, 12, 4, 1, '#66b8e0');
      px(ctx, (10 + shift) % 14, 14, 2, 1, '#b5e8ff');
    };
    makeTile('water_0', buildWater(0));
    makeTile('water_1', buildWater(3));

    makeTile('bridge', (ctx) => {
      px(ctx, 0, 0, 16, 16, '#7a4f2c');
      for (let x = 0; x < 16; x += 4) {
        px(ctx, x, 0, 1, 16, '#52321a');
        px(ctx, x + 1, 1, 2, 14, '#a67448');
        px(ctx, x + 2, 2, 1, 12, '#bd895b');
      }
      // bridge railings
      px(ctx, 0, 0, 16, 2, '#472a14');
      px(ctx, 0, 1, 16, 1, '#8c5c34');
      px(ctx, 0, 14, 16, 2, '#472a14');
      px(ctx, 0, 14, 16, 1, '#8c5c34');
    });

    // Tree ground base (canopy towers above in canopyLayer!)
    makeTile('tree', (ctx) => {
      px(ctx, 0, 0, 16, 16, '#5c8c47');
      // lush soft elliptical ground shadow
      px(ctx, 2, 10, 12, 5, '#3b5e2e');
      px(ctx, 4, 9, 8, 6, '#325226');
      // solid trunk base with roots
      px(ctx, 6, 7, 4, 7, '#59341d');
      px(ctx, 7, 7, 2, 6, '#7d4d2e');
      px(ctx, 5, 12, 2, 2, '#59341d');
      px(ctx, 9, 12, 2, 2, '#59341d');
    });

    makeTile('pine', (ctx) => {
      px(ctx, 0, 0, 16, 16, '#528041');
      px(ctx, 3, 11, 10, 4, '#335229');
      px(ctx, 6, 8, 4, 6, '#4f2f1a');
      px(ctx, 7, 9, 2, 5, '#6e4326');
    });

    makeTile('fence', (ctx) => {
      px(ctx, 0, 0, 16, 16, '#5c8c47');
      px(ctx, 2, 12, 12, 2, '#3d6130');
      px(ctx, 1, 5, 14, 2, '#996a3f');
      px(ctx, 1, 10, 14, 2, '#7d522d');
      px(ctx, 2, 3, 3, 11, '#875933');
      px(ctx, 11, 3, 3, 11, '#875933');
      px(ctx, 3, 3, 1, 10, '#bd8b5b');
      px(ctx, 12, 3, 1, 10, '#bd8b5b');
    });

    makeTile('ruin_floor', (ctx) => {
      px(ctx, 0, 0, 16, 16, '#525a5c');
      px(ctx, 0, 0, 16, 1, '#3b4245');
      px(ctx, 0, 8, 16, 1, '#3b4245');
      px(ctx, 7, 0, 1, 8, '#3b4245');
      px(ctx, 14, 8, 1, 8, '#3b4245');
      px(ctx, 2, 2, 4, 4, '#626c6e');
      px(ctx, 10, 10, 3, 3, '#446e48');
    });

    makeTile('ruin_wall', (ctx) => {
      px(ctx, 0, 0, 16, 16, '#2a3033');
      px(ctx, 1, 1, 14, 6, '#485256');
      px(ctx, 1, 8, 6, 7, '#3a4245');
      px(ctx, 8, 8, 7, 7, '#485256');
      px(ctx, 2, 2, 12, 2, '#626d70');
      px(ctx, 9, 9, 4, 2, '#3e6e46');
    });

    makeTile('ruin_gate', (ctx) => {
      px(ctx, 0, 0, 16, 16, '#394042');
      px(ctx, 1, 0, 14, 16, '#222629');
      for (let x = 2; x <= 12; x += 3) {
        px(ctx, x, 0, 2, 16, '#6e767d');
      }
      px(ctx, 1, 4, 14, 2, '#4c5459');
      px(ctx, 1, 10, 14, 2, '#4c5459');
      px(ctx, 6, 6, 4, 4, '#d99b26');
      px(ctx, 7, 7, 2, 2, '#fff0b3');
    });

    makeTile('pillar', (ctx) => {
      px(ctx, 0, 0, 16, 16, '#525a5c');
      px(ctx, 2, 1, 12, 14, '#363c3e');
      px(ctx, 3, 2, 10, 12, '#7c878a');
      px(ctx, 4, 3, 4, 10, '#9ba6a8');
      px(ctx, 5, 5, 6, 2, '#46c7ff');
      px(ctx, 3, 13, 10, 2, '#4f5759');
    });

    const buildRune = (key: string, glow: string, bright: string) => {
      makeTile(key, (ctx) => {
        px(ctx, 0, 0, 16, 16, '#484f52');
        px(ctx, 1, 1, 14, 14, '#2b3133');
        px(ctx, 2, 2, 12, 12, glow);
        px(ctx, 4, 4, 8, 8, '#1e2426');
        px(ctx, 5, 5, 6, 6, bright);
        px(ctx, 7, 6, 2, 4, '#ffffff');
      });
    };
    buildRune('rune_blue', '#2474b5', '#58c4ff');
    buildRune('rune_red', '#a32a2a', '#ff645c');
    buildRune('rune_green', '#268049', '#5de089');

    makeTile('cliff', (ctx) => {
      px(ctx, 0, 0, 16, 16, '#5c4d3c');
      px(ctx, 1, 2, 14, 12, '#73604b');
    });
  }

  // Tall 2.5D overhanging tree canopies (24x24 base px = 72x72px, centered above trunk)
  private buildTreeCanopies(): void {
    const makeCanopy = (key: string, fn: (ctx: CanvasRenderingContext2D) => void) => {
      const c = makeOffscreen(24 * RENDER_SCALE, 24 * RENDER_SCALE);
      const ctx = c.getContext('2d')!;
      ctx.imageSmoothingEnabled = false;
      fn(ctx);
      this.canopyCache.set(key, c);
    };
    const px = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, col: string) => {
      ctx.fillStyle = col;
      ctx.fillRect(x * RENDER_SCALE, y * RENDER_SCALE, w * RENDER_SCALE, h * RENDER_SCALE);
    };

    makeCanopy('tree', (ctx) => {
      // Deep foliage outline
      px(ctx, 4, 5, 16, 13, '#1e4223');
      px(ctx, 6, 3, 12, 16, '#1e4223');
      // Mid lush green body
      px(ctx, 5, 6, 14, 11, '#2f6633');
      px(ctx, 7, 4, 10, 13, '#3c7d3e');
      // Sunlit upper-left leaf clusters
      px(ctx, 6, 5, 9, 7, '#529c4c');
      px(ctx, 8, 4, 6, 4, '#70bd60');
      px(ctx, 14, 8, 4, 4, '#478c43');
      // Tiny sunlit leaf speckles
      px(ctx, 9, 5, 2, 2, '#94d97c');
      px(ctx, 13, 7, 2, 1, '#7bc468');
    });

    makeCanopy('pine', (ctx) => {
      // Lower bough tier
      px(ctx, 3, 13, 18, 5, '#193b29');
      px(ctx, 4, 12, 16, 4, '#245238');
      px(ctx, 6, 12, 8, 2, '#34734d');
      // Middle bough tier
      px(ctx, 5, 8, 14, 5, '#1e4731');
      px(ctx, 6, 7, 12, 4, '#2d6644');
      px(ctx, 7, 7, 6, 2, '#468c5e');
      // Upper bough tier + crown
      px(ctx, 7, 4, 10, 4, '#27593b');
      px(ctx, 9, 2, 6, 4, '#3c8055');
      px(ctx, 11, 1, 2, 3, '#63b378');
    });
  }

  private buildPlayer(): void {
    this.playerCache.set('down_0', drawMatrix(PLAYER_DOWN_0, PLAYER_PALETTE));
    this.playerCache.set('down_1', drawMatrix(PLAYER_DOWN_1, PLAYER_PALETTE));
    this.playerCache.set('up_0', drawMatrix(PLAYER_UP_0, PLAYER_PALETTE));
    this.playerCache.set('up_1', drawMatrix(PLAYER_UP_1, PLAYER_PALETTE));
    this.playerCache.set('right_0', drawMatrix(PLAYER_RIGHT_0, PLAYER_PALETTE));
    this.playerCache.set('right_1', drawMatrix(PLAYER_RIGHT_1, PLAYER_PALETTE));
    this.playerCache.set('left_0', drawMatrix(flipHorizontal(PLAYER_RIGHT_0), PLAYER_PALETTE));
    this.playerCache.set('left_1', drawMatrix(flipHorizontal(PLAYER_RIGHT_1), PLAYER_PALETTE));
  }

  private buildEnemies(): void {
    this.enemyCache.set(
      'slime_red',
      drawMatrix(SLIME_MATRIX, {
        o: '#2e1212',
        L: '#ff7d70',
        b: '#e04238',
        D: '#a62620',
        w: '#ffffff',
        e: '#1e1313',
        k: '#ff9fa3',
      })
    );
    this.enemyCache.set(
      'slime_blue',
      drawMatrix(SLIME_MATRIX, {
        o: '#102136',
        L: '#7bd4ff',
        b: '#2f8dd6',
        D: '#1d5d94',
        w: '#ffffff',
        e: '#121824',
        k: '#a6e5ff',
      })
    );
    this.enemyCache.set(
      'slime_green',
      drawMatrix(SLIME_MATRIX, {
        o: '#152b18',
        L: '#8de374',
        b: '#44ab46',
        D: '#2a7531',
        w: '#ffffff',
        e: '#122114',
        k: '#b7f5a2',
      })
    );
    this.enemyCache.set(
      'goblin',
      drawMatrix(GOBLIN_MATRIX, {
        o: '#1b2116',
        G: '#679e43',
        y: '#f7d84a',
        e: '#1b1414',
        r: '#d9534f',
        B: '#593924',
        b: '#85583a',
        K: '#382214',
      })
    );
    this.enemyCache.set(
      'bramble',
      drawMatrix(BRAMBLE_MATRIX, {
        o: '#1a2417',
        P: '#9b3d6e',
        p: '#d46199',
        y: '#f7e163',
        G: '#2d6134',
        g: '#4a8f4d',
        T: '#d9c589',
        K: '#5c3c24',
      })
    );
    this.enemyCache.set(
      'night_bat',
      drawMatrix(BAT_MATRIX, {
        o: '#120d1c',
        P: '#5a3d7a',
        y: '#ffbf36',
        w: '#ffffff',
      })
    );
    this.enemyCache.set(
      'night_owl',
      drawMatrix(OWL_MATRIX, {
        o: '#1c1824',
        B: '#665a73',
        b: '#9c90a8',
        D: '#443b4f',
        Y: '#ffb833',
        y: '#18141c',
      })
    );
    this.enemyCache.set(
      'sentinel',
      drawMatrix(SENTINEL_MATRIX, {
        o: '#1a1f21',
        S: '#78858a',
        s: '#9aa8ad',
        D: '#4d575c',
        C: '#3bb7f5',
        c: '#b5eeff',
      })
    );
  }

  private buildBossSprite(sleeping: boolean): HTMLCanvasElement {
    const S = 32 * RENDER_SCALE;
    const c = makeOffscreen(S, S);
    const ctx = c.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    const p = (x: number, y: number, w: number, h: number, col: string) => {
      ctx.fillStyle = col;
      ctx.fillRect(x * RENDER_SCALE, y * RENDER_SCALE, w * RENDER_SCALE, h * RENDER_SCALE);
    };

    p(4, 27, 24, 4, 'rgba(10,12,15,0.45)');
    p(7, 22, 6, 7, '#4c5459');
    p(19, 22, 6, 7, '#4c5459');
    p(8, 23, 4, 5, '#6d777d');
    p(20, 23, 4, 5, '#6d777d');
    p(5, 8, 22, 15, '#2b3136');
    p(6, 9, 20, 13, '#6c777d');
    p(8, 10, 16, 11, '#859196');
    p(7, 10, 4, 3, '#447049');
    p(20, 16, 4, 3, '#447049');
    p(10, 2, 12, 8, '#2b3136');
    p(11, 3, 10, 6, '#7b878c');
    const runeColor = sleeping ? '#3b4a52' : '#42ccff';
    const runeCore = sleeping ? '#576870' : '#d6f7ff';
    p(13, 5, 2, 2, runeColor);
    p(17, 5, 2, 2, runeColor);
    if (!sleeping) {
      p(13, 5, 1, 1, runeCore);
      p(17, 5, 1, 1, runeCore);
    }
    p(13, 12, 6, 6, '#2b3136');
    p(14, 13, 4, 4, runeColor);
    p(15, 14, 2, 2, runeCore);
    p(1, 10, 5, 12, '#3a4247');
    p(2, 11, 3, 10, '#78848a');
    p(26, 10, 5, 12, '#3a4247');
    p(27, 11, 3, 10, '#78848a');
    p(2, 14, 3, 3, runeColor);
    p(27, 14, 3, 3, runeColor);

    return c;
  }

  private buildProps(): void {
    const makeProp = (name: string, wTiles: number, hTiles: number, fn: (ctx: CanvasRenderingContext2D) => void) => {
      const c = makeOffscreen(wTiles * 16 * RENDER_SCALE, hTiles * 16 * RENDER_SCALE);
      const ctx = c.getContext('2d')!;
      ctx.imageSmoothingEnabled = false;
      fn(ctx);
      this.propCache.set(name, c);
    };
    const px = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, col: string) => {
      ctx.fillStyle = col;
      ctx.fillRect(x * RENDER_SCALE, y * RENDER_SCALE, w * RENDER_SCALE, h * RENDER_SCALE);
    };

    makeProp('cottage', 4, 3, (ctx) => {
      px(ctx, 2, 43, 60, 5, 'rgba(18,14,10,0.38)');
      px(ctx, 6, 20, 52, 25, '#593720');
      px(ctx, 8, 22, 48, 21, '#ead7b5');
      px(ctx, 8, 22, 4, 21, '#784c2b');
      px(ctx, 52, 22, 4, 21, '#784c2b');
      px(ctx, 8, 30, 48, 2, '#784c2b');
      // pitched shingle roof with layered highlights
      px(ctx, 2, 14, 60, 10, '#783324');
      px(ctx, 6, 8, 52, 8, '#96422e');
      px(ctx, 12, 3, 40, 6, '#b5563e');
      px(ctx, 14, 4, 36, 2, '#cc6a50');
      // chimney
      px(ctx, 46, 2, 8, 12, '#695f59');
      px(ctx, 45, 1, 10, 3, '#4f4742');
      // door
      px(ctx, 27, 29, 10, 15, '#5e371d');
      px(ctx, 29, 31, 6, 13, '#85522f');
      px(ctx, 33, 37, 2, 2, '#e6b84c');
      // glowing windows + flower boxes
      px(ctx, 14, 26, 8, 8, '#4f301b');
      px(ctx, 15, 27, 6, 6, '#ffd87a');
      px(ctx, 17, 27, 2, 6, '#4f301b');
      px(ctx, 14, 34, 8, 2, '#3d7d3e');
      px(ctx, 15, 34, 2, 1, '#ff7a90');
      px(ctx, 19, 34, 2, 1, '#ffe066');
      px(ctx, 42, 26, 8, 8, '#4f301b');
      px(ctx, 43, 27, 6, 6, '#ffd87a');
      px(ctx, 45, 27, 2, 6, '#4f301b');
      px(ctx, 42, 34, 8, 2, '#3d7d3e');
      px(ctx, 44, 34, 2, 1, '#ffe066');
      px(ctx, 47, 34, 2, 1, '#ff7a90');
    });

    makeProp('tent', 3, 3, (ctx) => {
      px(ctx, 3, 42, 42, 5, 'rgba(18,14,10,0.38)');
      px(ctx, 4, 20, 40, 23, '#28593c');
      px(ctx, 8, 12, 32, 12, '#35734d');
      px(ctx, 14, 6, 20, 8, '#448f5f');
      px(ctx, 21, 2, 6, 6, '#e6b84c');
      px(ctx, 4, 21, 40, 2, '#e6b84c');
      px(ctx, 17, 26, 14, 17, '#1a241d');
      px(ctx, 19, 28, 10, 15, '#2b382f');
    });

    // Warm Lantern Post
    makeProp('lantern', 1, 1, (ctx) => {
      px(ctx, 5, 13, 6, 2, 'rgba(15,10,6,0.38)');
      px(ctx, 7, 5, 2, 10, '#4f301b');
      px(ctx, 7, 4, 5, 1, '#4f301b');
      px(ctx, 9, 5, 4, 5, '#3b2415');
      px(ctx, 10, 6, 2, 3, '#ffe073');
      px(ctx, 10, 7, 2, 1, '#fff9db');
    });

    // Listening Echo Shrine (glowing cyan sound-wave obelisk)
    const buildEchoShrine = (name: string, solved: boolean) => {
      makeProp(name, 1, 1, (ctx) => {
        px(ctx, 3, 13, 10, 2, 'rgba(10,16,22,0.42)');
        px(ctx, 3, 11, 10, 3, '#4c575c');
        px(ctx, 4, 3, 8, 9, '#68767d');
        px(ctx, 5, 2, 6, 9, '#83939c');
        px(ctx, 6, 1, 4, 2, '#a3b5bf');
        const c1 = solved ? '#64d987' : '#32b8ff';
        const c2 = solved ? '#d4ffe0' : '#c7f2ff';
        px(ctx, 6, 4, 4, 5, '#1d2b36');
        px(ctx, 7, 5, 2, 3, c1);
        px(ctx, 7, 6, 2, 1, c2);
        // carved acoustic rings on sides
        px(ctx, 4, 6, 1, 2, c1);
        px(ctx, 11, 6, 1, 2, c1);
      });
    };
    buildEchoShrine('echo_shrine_active', false);
    buildEchoShrine('echo_shrine_solved', true);

    // Spelling Rune Stone (golden carved rune slab)
    const buildSpellingStone = (name: string, solved: boolean) => {
      makeProp(name, 1, 1, (ctx) => {
        px(ctx, 2, 13, 12, 2, 'rgba(15,12,8,0.4)');
        px(ctx, 3, 3, 10, 11, '#464d52');
        px(ctx, 4, 4, 8, 9, '#6b757c');
        const g1 = solved ? '#66db8b' : '#f2b838';
        const g2 = solved ? '#d9ffe4' : '#fff2b0';
        px(ctx, 5, 5, 6, 2, g1);
        px(ctx, 6, 5, 4, 1, g2);
        px(ctx, 5, 8, 6, 2, g1);
        px(ctx, 5, 11, 4, 1, g1);
      });
    };
    buildSpellingStone('spelling_rune_active', false);
    buildSpellingStone('spelling_rune_solved', true);

    // Sentence Syntax Pedestal (scroll lectern)
    const buildPedestal = (name: string, solved: boolean) => {
      makeProp(name, 1, 1, (ctx) => {
        px(ctx, 3, 13, 10, 2, 'rgba(15,12,8,0.4)');
        px(ctx, 5, 8, 6, 6, '#5f686e');
        px(ctx, 4, 12, 8, 2, '#4a5257');
        px(ctx, 2, 3, 12, 6, '#593720');
        px(ctx, 3, 4, 10, 4, solved ? '#d4f5dc' : '#f7e9c8');
        px(ctx, 4, 5, 8, 1, solved ? '#2d7a47' : '#8a5624');
        px(ctx, 4, 7, 6, 1, solved ? '#2d7a47' : '#8a5624');
      });
    };
    buildPedestal('sentence_pedestal_active', false);
    buildPedestal('sentence_pedestal_solved', true);

    makeProp('weather_board', 1, 1, (ctx) => {
      px(ctx, 3, 10, 2, 6, '#593720');
      px(ctx, 11, 10, 2, 6, '#593720');
      px(ctx, 1, 2, 14, 10, '#593720');
      px(ctx, 2, 3, 12, 8, '#f0e2c2');
      px(ctx, 3, 5, 4, 3, '#f2b830');
      px(ctx, 8, 5, 5, 1, '#5c4938');
      px(ctx, 8, 7, 4, 1, '#5c4938');
      px(ctx, 8, 9, 5, 1, '#5c4938');
    });

    makeProp('cooking_pot', 1, 1, (ctx) => {
      px(ctx, 2, 11, 12, 4, '#593720');
      px(ctx, 4, 12, 8, 2, '#ff7729');
      px(ctx, 2, 5, 12, 7, '#2c3136');
      px(ctx, 3, 4, 10, 2, '#4a5259');
      px(ctx, 4, 5, 8, 2, '#f09432');
      px(ctx, 6, 2, 2, 2, '#e8e8e8');
    });

    const buildCampfire = (name: string, tall: boolean) => {
      makeProp(name, 1, 1, (ctx) => {
        px(ctx, 2, 10, 12, 4, '#593720');
        px(ctx, 3, 9, 10, 2, '#7d502d');
        px(ctx, 4, tall ? 3 : 5, 8, tall ? 7 : 5, '#e85d22');
        px(ctx, 6, tall ? 5 : 6, 4, 4, '#ffd24c');
        px(ctx, 7, 7, 2, 2, '#fff7cc');
      });
    };
    buildCampfire('campfire_0', false);
    buildCampfire('campfire_1', true);

    makeProp('sign', 1, 1, (ctx) => {
      px(ctx, 7, 9, 2, 6, '#5c3921');
      px(ctx, 2, 3, 12, 7, '#6b4226');
      px(ctx, 3, 4, 10, 5, '#a67449');
      px(ctx, 4, 5, 8, 1, '#4a2e1a');
      px(ctx, 4, 7, 6, 1, '#4a2e1a');
    });

    makeProp('chest_closed', 1, 1, (ctx) => {
      px(ctx, 2, 4, 12, 10, '#4a2c16');
      px(ctx, 3, 5, 10, 8, '#9c6234');
      px(ctx, 2, 8, 12, 2, '#e6b84c');
      px(ctx, 7, 7, 2, 4, '#fff0a8');
    });

    makeProp('chest_open', 1, 1, (ctx) => {
      px(ctx, 2, 2, 12, 5, '#5e391e');
      px(ctx, 2, 7, 12, 7, '#4a2c16');
      px(ctx, 3, 8, 10, 5, '#26170d');
      px(ctx, 2, 7, 12, 1, '#e6b84c');
    });

    makeProp('statue', 1, 1, (ctx) => {
      px(ctx, 2, 12, 12, 3, '#4c5457');
      px(ctx, 4, 4, 8, 9, '#7a8487');
      px(ctx, 5, 2, 6, 4, '#98a3a6');
      px(ctx, 6, 3, 1, 1, '#58c4ff');
      px(ctx, 9, 3, 1, 1, '#58c4ff');
      px(ctx, 5, 7, 6, 2, '#5c6669');
    });

    makeProp('forage_herb', 1, 1, (ctx) => {
      px(ctx, 3, 7, 10, 7, '#275c34');
      px(ctx, 4, 5, 8, 7, '#3fa352');
      px(ctx, 5, 6, 2, 2, '#a3f7a8');
      px(ctx, 9, 8, 2, 2, '#a3f7a8');
    });

    makeProp('forage_root', 1, 1, (ctx) => {
      px(ctx, 4, 8, 8, 6, '#5e3d28');
      px(ctx, 5, 9, 6, 4, '#8c5a3c');
      px(ctx, 6, 4, 4, 5, '#4c8544');
      px(ctx, 5, 5, 2, 2, '#d9a441');
    });

    makeProp('soil_untilled', 1, 1, (ctx) => {
      px(ctx, 1, 1, 14, 14, '#709954');
      px(ctx, 2, 2, 12, 12, '#826445');
      px(ctx, 4, 5, 2, 1, '#6e5237');
      px(ctx, 9, 10, 3, 1, '#6e5237');
    });

    makeProp('soil_tilled', 1, 1, (ctx) => {
      px(ctx, 1, 1, 14, 14, '#6b472a');
      for (let y = 3; y <= 12; y += 3) {
        px(ctx, 2, y, 12, 2, '#8a5d3b');
      }
    });

    makeProp('soil_watered', 1, 1, (ctx) => {
      px(ctx, 1, 1, 14, 14, '#3d2717');
      for (let y = 3; y <= 12; y += 3) {
        px(ctx, 2, y, 12, 2, '#523621');
      }
    });
  }

  private buildCrops(): void {
    const makeCrop = (key: string, fn: (ctx: CanvasRenderingContext2D) => void) => {
      const c = makeOffscreen(16 * RENDER_SCALE, 16 * RENDER_SCALE);
      const ctx = c.getContext('2d')!;
      ctx.imageSmoothingEnabled = false;
      fn(ctx);
      this.cropCache.set(key, c);
    };
    const px = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, col: string) => {
      ctx.fillStyle = col;
      ctx.fillRect(x * RENDER_SCALE, y * RENDER_SCALE, w * RENDER_SCALE, h * RENDER_SCALE);
    };

    const drawSprout = (ctx: CanvasRenderingContext2D) => {
      px(ctx, 7, 8, 2, 5, '#4aa348');
      px(ctx, 5, 6, 3, 2, '#73d466');
      px(ctx, 8, 6, 3, 2, '#73d466');
    };

    for (const id of ['sunberry', 'pumpkin', 'healing_herb', 'bitter_root'] as CropId[]) {
      makeCrop(`${id}_sprout`, drawSprout);
    }

    makeCrop('sunberry_mature', (ctx) => {
      px(ctx, 4, 6, 8, 7, '#2d7536');
      px(ctx, 5, 4, 6, 7, '#459e4c');
      px(ctx, 5, 6, 3, 3, '#ffd24c');
      px(ctx, 9, 5, 3, 3, '#ffad29');
      px(ctx, 7, 9, 3, 3, '#ffd24c');
    });

    makeCrop('pumpkin_mature', (ctx) => {
      px(ctx, 7, 3, 2, 3, '#3c7a36');
      px(ctx, 3, 5, 10, 9, '#d96b1c');
      px(ctx, 5, 5, 6, 9, '#f28c28');
      px(ctx, 7, 6, 2, 7, '#ffa940');
    });

    makeCrop('healing_herb_mature', (ctx) => {
      px(ctx, 3, 5, 10, 8, '#236e43');
      px(ctx, 5, 3, 6, 9, '#48c774');
      px(ctx, 6, 5, 2, 2, '#d8ffdf');
      px(ctx, 9, 7, 2, 2, '#d8ffdf');
    });

    makeCrop('bitter_root_mature', (ctx) => {
      px(ctx, 5, 3, 6, 5, '#3b7d3b');
      px(ctx, 4, 8, 8, 5, '#734a2e');
      px(ctx, 5, 9, 6, 3, '#a6704b');
      px(ctx, 6, 6, 4, 2, '#d9a441');
    });
  }

  // Crisp 32x32 pixel-art icons for Hotbar, Bag, Shop & Forge
  private buildItemIcons(): void {
    const makeIcon = (id: string, fn: (p: (x: number, y: number, w: number, h: number, col: string) => void) => void) => {
      const c = makeOffscreen(32, 32);
      const ctx = c.getContext('2d')!;
      ctx.imageSmoothingEnabled = false;
      const p = (x: number, y: number, w: number, h: number, col: string) => {
        ctx.fillStyle = col;
        ctx.fillRect(x * 2, y * 2, w * 2, h * 2);
      };
      fn(p);
      this.itemIconUrls.set(id, c.toDataURL());
    };

    const drawSeedPouch = (p: (x: number, y: number, w: number, h: number, col: string) => void, accent: string) => {
      p(4, 3, 8, 11, '#5e3d22');
      p(5, 4, 6, 9, '#c99b63');
      p(5, 2, 6, 2, '#a3723b');
      p(6, 6, 4, 4, accent);
      p(7, 7, 2, 2, '#fff5d6');
    };

    makeIcon('sunberry_seed', (p) => drawSeedPouch(p, '#f5b82e'));
    makeIcon('pumpkin_seed', (p) => drawSeedPouch(p, '#e66e1e'));
    makeIcon('healing_herb_seed', (p) => drawSeedPouch(p, '#48c774'));
    makeIcon('bitter_root_seed', (p) => drawSeedPouch(p, '#8c5630'));

    makeIcon('sunberry', (p) => {
      p(5, 3, 6, 3, '#3b8c42');
      p(4, 6, 8, 7, '#e69b19');
      p(5, 5, 6, 7, '#ffd24c');
      p(6, 6, 2, 2, '#fff8cc');
    });
    makeIcon('pumpkin', (p) => {
      p(7, 2, 2, 3, '#3b7a34');
      p(3, 5, 10, 8, '#c95c14');
      p(5, 5, 6, 8, '#f28c28');
      p(7, 6, 2, 6, '#ffb84d');
    });
    makeIcon('healing_herb', (p) => {
      p(7, 10, 2, 4, '#2f6e39');
      p(3, 4, 10, 7, '#2d8247');
      p(5, 3, 6, 7, '#58d67d');
      p(6, 5, 2, 2, '#d8ffe2');
    });
    makeIcon('bitter_root', (p) => {
      p(5, 2, 6, 4, '#478a44');
      p(4, 6, 8, 6, '#6e4529');
      p(6, 7, 4, 6, '#a36b43');
      p(5, 11, 2, 3, '#6e4529');
      p(9, 11, 2, 3, '#6e4529');
    });
    makeIcon('pumpkin_soup', (p) => {
      p(2, 7, 12, 6, '#5c3a21');
      p(3, 8, 10, 4, '#875736');
      p(3, 6, 10, 3, '#f28b24');
      p(5, 6, 6, 2, '#ffc95c');
      p(5, 3, 1, 2, '#fff5e6');
      p(10, 2, 1, 3, '#fff5e6');
    });
    makeIcon('healing_potion', (p) => {
      p(6, 2, 4, 2, '#a3723b');
      p(6, 4, 4, 2, '#c8e4f0');
      p(4, 6, 8, 8, '#3d1d24');
      p(5, 7, 6, 6, '#e03e4b');
      p(6, 8, 2, 2, '#ff9ea6');
    });
    makeIcon('berry_tea', (p) => {
      p(4, 6, 8, 7, '#e8dcc3');
      p(12, 8, 2, 3, '#d4c3a3');
      p(5, 6, 6, 2, '#f5b836');
      p(7, 3, 1, 2, '#ffffff');
      p(9, 2, 1, 3, '#ffffff');
    });
    makeIcon('iron_key', (p) => {
      p(3, 5, 5, 5, '#424c54');
      p(4, 6, 3, 3, '#c8d6e0');
      p(5, 7, 1, 1, '#424c54');
      p(8, 7, 6, 2, '#b0c0cc');
      p(11, 9, 1, 2, '#b0c0cc');
      p(13, 9, 1, 3, '#b0c0cc');
    });
    makeIcon('slime_gel', (p) => {
      p(4, 5, 8, 8, '#1e6e8f');
      p(5, 4, 6, 8, '#54c7f0');
      p(6, 6, 2, 2, '#d8f7ff');
    });
    makeIcon('goblin_fang', (p) => {
      p(4, 3, 4, 4, '#d9d2c5');
      p(6, 6, 4, 4, '#f2ede2');
      p(8, 9, 3, 4, '#ffffff');
      p(10, 12, 2, 2, '#fff8e6');
    });
    makeIcon('rune_shard', (p) => {
      p(6, 2, 4, 12, '#2270a6');
      p(4, 5, 8, 6, '#48b8f5');
      p(6, 4, 4, 8, '#8be0ff');
      p(7, 6, 2, 3, '#ffffff');
    });
    // Gear upgrade icons
    makeIcon('sword', (p) => {
      p(10, 2, 4, 4, '#b8d4e8');
      p(8, 4, 4, 4, '#dcecf7');
      p(6, 6, 4, 4, '#92b8d4');
      p(4, 9, 5, 2, '#e6b84c');
      p(3, 11, 3, 3, '#6b4226');
    });
    makeIcon('watering_can', (p) => {
      p(5, 6, 7, 7, '#7591a3');
      p(6, 7, 5, 5, '#a8c4d6');
      p(2, 8, 3, 2, '#7591a3');
      p(12, 7, 2, 4, '#597282');
      p(7, 4, 3, 2, '#597282');
    });
    makeIcon('boots', (p) => {
      p(4, 3, 5, 8, '#6e4226');
      p(4, 9, 9, 4, '#8f5834');
      p(5, 4, 3, 5, '#b57648');
      p(2, 6, 2, 2, '#8be0ff');
      p(11, 8, 2, 2, '#8be0ff');
    });
  }

  private buildPortrait(mood: PortraitMood): string {
    const c = makeOffscreen(64, 64);
    const ctx = c.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    const p = (x: number, y: number, w: number, h: number, col: string) => {
      ctx.fillStyle = col;
      ctx.fillRect(x * 4, y * 4, w * 4, h * 4);
    };

    const bg =
      mood === 'determined'
        ? '#542a22'
        : mood === 'confused'
          ? '#2e3f57'
          : mood === 'exhausted'
            ? '#3d3530'
            : '#3d5c3a';
    p(0, 0, 16, 16, bg);

    p(3, 12, 10, 4, '#d63b2f');
    p(4, 14, 8, 2, '#8d5b36');

    p(3, 2, 10, 10, '#221712');
    p(4, 2, 8, 4, '#6e4226');
    p(5, 2, 4, 2, '#965c36');
    p(4, 5, 8, 7, '#f8d2b0');
    p(4, 5, 2, 2, '#6e4226');
    p(10, 5, 2, 2, '#6e4226');

    if (mood === 'happy') {
      p(5, 7, 2, 2, '#1d1822');
      p(9, 7, 2, 2, '#1d1822');
      p(5, 7, 1, 1, '#ffffff');
      p(9, 7, 1, 1, '#ffffff');
      p(4, 9, 1, 1, '#e89584');
      p(11, 9, 1, 1, '#e89584');
      p(7, 10, 2, 1, '#b55b4a');
    } else if (mood === 'determined') {
      p(5, 6, 2, 1, '#522f18');
      p(9, 6, 2, 1, '#522f18');
      p(5, 7, 2, 2, '#1d1822');
      p(9, 7, 2, 2, '#1d1822');
      p(6, 7, 1, 1, '#ffcf5c');
      p(9, 7, 1, 1, '#ffcf5c');
      p(6, 10, 4, 1, '#8c3d32');
    } else if (mood === 'confused') {
      p(5, 7, 2, 2, '#1d1822');
      p(9, 7, 2, 2, '#1d1822');
      p(7, 10, 2, 1, '#8c5346');
      p(12, 2, 2, 1, '#ffe47a');
      p(13, 3, 1, 2, '#ffe47a');
      p(12, 5, 1, 1, '#ffe47a');
      p(12, 7, 1, 1, '#ffe47a');
    } else {
      p(5, 8, 2, 1, '#1d1822');
      p(9, 8, 2, 1, '#1d1822');
      p(12, 5, 1, 3, '#6cc4ff');
      p(7, 10, 2, 1, '#7a574d');
    }

    return c.toDataURL();
  }
}
