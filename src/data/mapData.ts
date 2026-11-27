import { FarmPlot, ZoneId } from '../types/game';

export const MAP_WIDTH = 48;
export const MAP_HEIGHT = 36;
export const BASE_TILE_SIZE = 16;
export const RENDER_SCALE = 3;
export const TILE_SIZE = BASE_TILE_SIZE * RENDER_SCALE; // 48px

export type TileKind =
  | 'grass'
  | 'grass_flower'
  | 'path'
  | 'water'
  | 'bridge'
  | 'tree'
  | 'pine'
  | 'ruin_floor'
  | 'ruin_wall'
  | 'ruin_gate'
  | 'pillar'
  | 'rune_blue'
  | 'rune_red'
  | 'rune_green'
  | 'fence'
  | 'cliff';

export interface MapInteractable {
  id: string;
  kind:
    | 'cottage_door'
    | 'weather_board'
    | 'cooking_pot'
    | 'campfire'
    | 'starter_chest'
    | 'elder_mara'
    | 'merchant_bram'
    | 'sign'
    | 'puzzle_chest'
    | 'echo_shrine'
    | 'spelling_rune'
    | 'sentence_pedestal'
    | 'statue'
    | 'iron_key_spot'
    | 'ruins_gate'
    | 'forage_herb'
    | 'forage_root';
  tileX: number;
  tileY: number;
  labelEn: string;
  labelVi: string;
  refId?: string;
}

export interface StaticBuilding {
  kind: 'cottage' | 'tent';
  tileX: number;
  tileY: number;
  widthTiles: number;
  heightTiles: number;
}

export const LANTERN_POSTS: Array<{ tileX: number; tileY: number }> = [
  { tileX: 8, tileY: 15 },
  { tileX: 15, tileY: 15 },
  { tileX: 18, tileY: 15 },
  { tileX: 22, tileY: 15 },
  { tileX: 33, tileY: 15 },
  { tileX: 35, tileY: 15 },
];

export const ZONE_BOUNDARIES = {
  homesteadEnd: 15,
  woodsEnd: 33,
};

export function getZoneForTileX(tileX: number): ZoneId {
  if (tileX <= ZONE_BOUNDARIES.homesteadEnd) return 'homestead';
  if (tileX <= ZONE_BOUNDARIES.woodsEnd) return 'woods';
  return 'ruins';
}

export const ZONE_LABELS: Record<ZoneId, { en: string; vi: string; level: string }> = {
  homestead: { en: 'Homestead', vi: 'Khu Trại', level: 'A1' },
  woods: { en: 'Whispering Woods', vi: 'Rừng Thì Thầm', level: 'A2' },
  ruins: { en: 'Ancient Ruins', vi: 'Tàn Tích Cổ', level: 'B1' },
};

// Player starts in an open 4-tile-wide clearing in Homestead facing south/east
export const PLAYER_SPAWN = {
  tileX: 7,
  tileY: 16,
};

export const BUILDINGS: StaticBuilding[] = [
  { kind: 'cottage', tileX: 4, tileY: 10, widthTiles: 4, heightTiles: 3 },
  { kind: 'tent', tileX: 22, tileY: 12, widthTiles: 3, heightTiles: 3 },
];

// 3x4 Farm Plots (12 tiles) neatly arranged south-east of cottage in Homestead
export function createInitialFarmPlots(): FarmPlot[] {
  const plots: FarmPlot[] = [];
  let id = 1;
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 4; col++) {
      plots.push({
        id,
        tileX: 9 + col,
        tileY: 18 + row,
        state: 'untilled',
        cropId: null,
        watered: false,
        daysGrown: 0,
        daysRequired: 1,
      });
      id++;
    }
  }
  return plots;
}

export const BOSS_ARENA = {
  centerTileX: 41,
  centerTileY: 17,
  triggerMinX: 36,
  pillars: [
    { tileX: 38, tileY: 13 },
    { tileX: 44, tileY: 13 },
    { tileX: 38, tileY: 21 },
    { tileX: 44, tileY: 21 },
  ],
  blueRune: { tileX: 41, tileY: 22 },
  redRune: { tileX: 37, tileY: 17 },
  greenRune: { tileX: 45, tileY: 17 },
};

export const IRON_KEY_SPOT = {
  tileX: 28,
  tileY: 7,
};

export const INTERACTABLES: MapInteractable[] = [
  {
    id: 'cottage_door',
    kind: 'cottage_door',
    tileX: 6,
    tileY: 13,
    labelEn: 'Sleep at Cottage',
    labelVi: 'Ngủ tại Căn chòi',
  },
  {
    id: 'weather_board',
    kind: 'weather_board',
    tileX: 9,
    tileY: 13,
    labelEn: 'Read Weather Board',
    labelVi: 'Đọc Bảng tin Thời tiết',
  },
  {
    id: 'cooking_pot',
    kind: 'cooking_pot',
    tileX: 5,
    tileY: 15,
    labelEn: 'Cook & Forge Gear',
    labelVi: 'Nồi Nấu & Rèn Trang Bị',
  },
  {
    id: 'campfire',
    kind: 'campfire',
    tileX: 6,
    tileY: 19,
    labelEn: 'Rest at Campfire',
    labelVi: 'Ôn từ bên Lửa trại',
  },
  {
    id: 'starter_chest',
    kind: 'starter_chest',
    tileX: 3,
    tileY: 18,
    labelEn: 'Open Supply Chest',
    labelVi: 'Mở Rương khởi đầu',
  },
  {
    id: 'merchant_bram',
    kind: 'merchant_bram',
    tileX: 13,
    tileY: 14,
    labelEn: 'Bargain with Merchant Bram',
    labelVi: 'Mặc cả tiếng Anh với Thương Nhân Bram',
  },
  {
    id: 'sign_homestead',
    kind: 'sign',
    tileX: 14,
    tileY: 15,
    labelEn: 'Read Signpost',
    labelVi: 'Đọc Biển chỉ dẫn',
    refId: 'sign_homestead',
  },
  // Homestead English Challenges (Echo Shrine + Spelling Stone + Grammar Chest)
  {
    id: 'echo_homestead',
    kind: 'echo_shrine',
    tileX: 13,
    tileY: 24,
    labelEn: 'Activate Echo Shrine (Listening)',
    labelVi: 'Kích hoạt Đền Vọng Âm (Luyện Nghe)',
    refId: 'echo_homestead',
  },
  {
    id: 'spell_harvest',
    kind: 'spelling_rune',
    tileX: 8,
    tileY: 23,
    labelEn: 'Decipher Spelling Stone',
    labelVi: 'Giải Đá Ghép Chữ Tiếng Anh',
    refId: 'spell_harvest',
  },
  {
    id: 'chest_meadow',
    kind: 'puzzle_chest',
    tileX: 11,
    tileY: 9,
    labelEn: 'Inspect Grammar Chest',
    labelVi: 'Mở Rương Ngữ Pháp',
    refId: 'chest_meadow',
  },

  // Whispering Woods NPC, Signs, Shrines, Runes & Chests
  {
    id: 'elder_mara',
    kind: 'elder_mara',
    tileX: 23,
    tileY: 15,
    labelEn: 'Talk to Elder Mara',
    labelVi: 'Nói chuyện với Elder Mara',
  },
  {
    id: 'sign_pond_clue',
    kind: 'sign',
    tileX: 25,
    tileY: 13,
    labelEn: 'Read Carved Stone',
    labelVi: 'Đọc Bia đá cổ',
    refId: 'sign_pond_clue',
  },
  {
    id: 'sign_bridge_clue',
    kind: 'sign',
    tileX: 20,
    tileY: 22,
    labelEn: 'Read Forest Sign',
    labelVi: 'Đọc Biển chỉ dẫn rừng',
    refId: 'sign_bridge_clue',
  },
  {
    id: 'sign_ruins_warning',
    kind: 'sign',
    tileX: 32,
    tileY: 15,
    labelEn: 'Read Ruins Tablet',
    labelVi: 'Đọc Bia cảnh báo',
    refId: 'sign_ruins_warning',
  },
  {
    id: 'echo_woods',
    kind: 'echo_shrine',
    tileX: 25,
    tileY: 15,
    labelEn: 'Activate Echo Shrine (Listening A2)',
    labelVi: 'Kích hoạt Đền Vọng Âm Rừng (Nghe A2)',
    refId: 'echo_woods',
  },
  {
    id: 'spell_bridge',
    kind: 'spelling_rune',
    tileX: 19,
    tileY: 14,
    labelEn: 'Decipher Spelling Stone (A2)',
    labelVi: 'Giải Đá Ghép Chữ Bờ Sông',
    refId: 'spell_bridge',
  },
  {
    id: 'sentence_woods',
    kind: 'sentence_pedestal',
    tileX: 26,
    tileY: 23,
    labelEn: 'Arrange Sentence Pedestal',
    labelVi: 'Sắp xếp Câu Tiếng Anh trên Bệ Đá',
    refId: 'sentence_woods',
  },
  {
    id: 'chest_bridge',
    kind: 'puzzle_chest',
    tileX: 22,
    tileY: 26,
    labelEn: 'Inspect Rune Chest',
    labelVi: 'Kiểm tra Rương cổ ngữ',
    refId: 'chest_bridge',
  },
  {
    id: 'chest_grove',
    kind: 'puzzle_chest',
    tileX: 30,
    tileY: 24,
    labelEn: 'Inspect Rune Chest',
    labelVi: 'Kiểm tra Rương cổ ngữ',
    refId: 'chest_grove',
  },
  {
    id: 'chest_north_woods',
    kind: 'puzzle_chest',
    tileX: 22,
    tileY: 8,
    labelEn: 'Inspect Pine Trail Chest',
    labelVi: 'Kiểm tra Rương Đường Mòn Thông',
    refId: 'chest_north_woods',
  },
  {
    id: 'ancient_statue',
    kind: 'statue',
    tileX: 29,
    tileY: 18,
    labelEn: 'Inspect Stone Statue',
    labelVi: 'Kiểm tra Tượng đá cổ',
  },
  {
    id: 'iron_key_spot',
    kind: 'iron_key_spot',
    tileX: IRON_KEY_SPOT.tileX,
    tileY: IRON_KEY_SPOT.tileY,
    labelEn: 'Dig Sparkling Soil',
    labelVi: 'Đào chỗ đất lấp lánh',
  },

  // Ancient Ruins Gate & B1 Challenges
  {
    id: 'ruins_gate',
    kind: 'ruins_gate',
    tileX: 34,
    tileY: 17,
    labelEn: 'Inspect Sealed Gate',
    labelVi: 'Kiểm tra Cổng Phong Ấn',
  },
  {
    id: 'echo_ruins',
    kind: 'echo_shrine',
    tileX: 37,
    tileY: 10,
    labelEn: 'Activate Ancient Echo Shrine (B1)',
    labelVi: 'Kích hoạt Đền Vọng Âm Cổ (Nghe B1)',
    refId: 'echo_ruins',
  },
  {
    id: 'spell_shield',
    kind: 'spelling_rune',
    tileX: 37,
    tileY: 24,
    labelEn: 'Decipher Ruins Spelling Stone (B1)',
    labelVi: 'Giải Đá Ghép Chữ Tàn Tích',
    refId: 'spell_shield',
  },
  {
    id: 'sentence_ruins',
    kind: 'sentence_pedestal',
    tileX: 36,
    tileY: 19,
    labelEn: 'Arrange Ruins Sentence Pedestal',
    labelVi: 'Sắp xếp Câu Chiến Thuật B1',
    refId: 'sentence_ruins',
  },

  // Forageable plants
  {
    id: 'forage_herb_1',
    kind: 'forage_herb',
    tileX: 21,
    tileY: 9,
    labelEn: 'Gather Healing Herb',
    labelVi: 'Hái Thảo mộc chữa lành',
  },
  {
    id: 'forage_herb_2',
    kind: 'forage_herb',
    tileX: 26,
    tileY: 27,
    labelEn: 'Gather Healing Herb',
    labelVi: 'Hái Thảo mộc chữa lành',
  },
  {
    id: 'forage_root_1',
    kind: 'forage_root',
    tileX: 25,
    tileY: 21,
    labelEn: 'Gather Bitter Root',
    labelVi: 'Hái Rễ đắng (Bitter Root)',
  },
  {
    id: 'forage_root_2',
    kind: 'forage_root',
    tileX: 31,
    tileY: 11,
    labelEn: 'Gather Bitter Root',
    labelVi: 'Hái Rễ đắng (Bitter Root)',
  },
];

export interface WorldMapData {
  tiles: TileKind[][];
  solid: boolean[][];
}

function createMap(): WorldMapData {
  const tiles: TileKind[][] = [];
  const solid: boolean[][] = [];

  for (let y = 0; y < MAP_HEIGHT; y++) {
    const row: TileKind[] = [];
    const sRow: boolean[] = [];
    for (let x = 0; x < MAP_WIDTH; x++) {
      const hash = (x * 73 + y * 137) % 13;
      row.push(hash === 0 ? 'grass_flower' : 'grass');
      sRow.push(false);
    }
    tiles.push(row);
    solid.push(sRow);
  }

  const setTile = (x: number, y: number, kind: TileKind, isSolid?: boolean) => {
    if (x < 0 || y < 0 || x >= MAP_WIDTH || y >= MAP_HEIGHT) return;
    tiles[y][x] = kind;
    if (isSolid !== undefined) {
      solid[y][x] = isSolid;
    } else {
      solid[y][x] =
        kind === 'water' ||
        kind === 'tree' ||
        kind === 'pine' ||
        kind === 'ruin_wall' ||
        kind === 'ruin_gate' ||
        kind === 'pillar' ||
        kind === 'fence' ||
        kind === 'cliff';
    }
  };

  // Outer perimeter trees / ruin walls
  for (let x = 0; x < MAP_WIDTH; x++) {
    for (let y = 0; y < 2; y++) {
      setTile(x, y, x >= 34 ? 'ruin_wall' : 'pine');
    }
    for (let y = MAP_HEIGHT - 2; y < MAP_HEIGHT; y++) {
      setTile(x, y, x >= 34 ? 'ruin_wall' : 'tree');
    }
  }
  for (let y = 0; y < MAP_HEIGHT; y++) {
    setTile(0, y, 'tree');
    setTile(1, y, 'tree');
    setTile(MAP_WIDTH - 1, y, 'ruin_wall');
    setTile(MAP_WIDTH - 2, y, 'ruin_wall');
  }

  // ============== ZONE 1: HOMESTEAD (x: 2..15) ==============
  for (let x = 9; x <= 12; x++) {
    setTile(x, 17, 'fence');
    setTile(x, 21, 'fence');
  }
  for (let x = 5; x <= 19; x++) {
    setTile(x, 16, 'path', false);
    setTile(x, 17, x >= 9 && x <= 12 ? 'fence' : 'path', x >= 9 && x <= 12);
  }
  for (let y = 13; y <= 23; y++) {
    setTile(6, y, 'path', false);
    setTile(7, y, 'path', false);
  }
  // Path east to Homestead Echo Shrine
  for (let x = 7; x <= 13; x++) {
    setTile(x, 23, 'path', false);
  }
  const homesteadTrees: Array<[number, number, TileKind]> = [
    [3, 4, 'tree'],
    [5, 5, 'pine'],
    [13, 6, 'pine'],
    [3, 25, 'tree'],
    [5, 28, 'pine'],
    [10, 27, 'tree'],
    [13, 29, 'tree'],
    [14, 9, 'pine'],
  ];
  for (const [tx, ty, kind] of homesteadTrees) {
    setTile(tx, ty, kind);
  }

  // ============== RIVER BETWEEN HOMESTEAD & WOODS (x: 16..17) ==============
  for (let y = 2; y < MAP_HEIGHT - 2; y++) {
    setTile(16, y, 'water');
    setTile(17, y, 'water');
  }
  for (let y = 15; y <= 17; y++) {
    setTile(16, y, 'bridge', false);
    setTile(17, y, 'bridge', false);
  }

  // ============== ZONE 2: WHISPERING WOODS (x: 18..33) ==============
  for (let x = 18; x <= 34; x++) {
    setTile(x, 16, 'path', false);
    setTile(x, 17, 'path', false);
  }
  for (let y = 11; y <= 26; y++) {
    setTile(23, y, 'path', false);
  }
  for (let x = 23; x <= 30; x++) {
    setTile(x, 25, 'path', false);
  }
  for (let y = 7; y <= 16; y++) {
    setTile(26, y, 'path', false);
  }

  // Forest Pond (x: 27..29, y: 9..11)
  for (let y = 9; y <= 11; y++) {
    for (let x = 27; x <= 29; x++) {
      setTile(x, y, 'water');
    }
  }
  // Three iconic pine trees directly north of the pond
  setTile(27, 6, 'pine');
  setTile(28, 6, 'pine');
  setTile(29, 6, 'pine');
  setTile(28, 7, 'grass', false);

  const woodsTrees: Array<[number, number, TileKind]> = [
    [19, 5, 'pine'],
    [20, 6, 'pine'],
    [24, 6, 'pine'],
    [31, 5, 'pine'],
    [32, 7, 'tree'],
    [19, 11, 'tree'],
    [20, 12, 'pine'],
    [19, 20, 'pine'],
    [20, 24, 'tree'],
    [19, 28, 'pine'],
    [21, 30, 'tree'],
    [25, 29, 'pine'],
    [28, 30, 'tree'],
    [31, 28, 'pine'],
    [32, 21, 'pine'],
    [31, 13, 'tree'],
    [27, 19, 'pine'],
  ];
  for (const [tx, ty, kind] of woodsTrees) {
    setTile(tx, ty, kind);
  }

  // ============== ZONE 3: ANCIENT RUINS (x: 34..46) ==============
  for (let y = 2; y < MAP_HEIGHT - 2; y++) {
    for (let x = 35; x < MAP_WIDTH - 2; x++) {
      setTile(x, y, 'ruin_floor', false);
    }
  }
  for (let y = 2; y < MAP_HEIGHT - 2; y++) {
    if (y >= 16 && y <= 18) {
      setTile(34, y, 'ruin_gate', true);
    } else {
      setTile(34, y, 'ruin_wall', true);
    }
  }

  for (let x = 35; x < MAP_WIDTH - 2; x++) {
    setTile(x, 8, 'ruin_wall', true);
    setTile(x, 26, 'ruin_wall', true);
  }

  for (const p of BOSS_ARENA.pillars) {
    setTile(p.tileX, p.tileY, 'pillar', true);
  }

  setTile(BOSS_ARENA.blueRune.tileX, BOSS_ARENA.blueRune.tileY, 'rune_blue', false);
  setTile(BOSS_ARENA.blueRune.tileX - 1, BOSS_ARENA.blueRune.tileY, 'rune_blue', false);
  setTile(BOSS_ARENA.blueRune.tileX, BOSS_ARENA.blueRune.tileY + 1, 'rune_blue', false);
  setTile(BOSS_ARENA.blueRune.tileX - 1, BOSS_ARENA.blueRune.tileY + 1, 'rune_blue', false);

  setTile(BOSS_ARENA.redRune.tileX, BOSS_ARENA.redRune.tileY, 'rune_red', false);
  setTile(BOSS_ARENA.greenRune.tileX, BOSS_ARENA.greenRune.tileY, 'rune_green', false);

  for (const b of BUILDINGS) {
    for (let dy = 0; dy < b.heightTiles; dy++) {
      for (let dx = 0; dx < b.widthTiles; dx++) {
        const bx = b.tileX + dx;
        const by = b.tileY + dy;
        if (bx >= 0 && bx < MAP_WIDTH && by >= 0 && by < MAP_HEIGHT) {
          solid[by][bx] = true;
        }
      }
    }
  }

  // Solid decorative/interactive props
  solid[19][6] = true; // campfire
  solid[15][5] = true; // cooking pot
  solid[13][9] = true; // weather board
  solid[18][29] = true; // ancient statue
  solid[24][13] = true; // echo_homestead
  solid[15][25] = true; // echo_woods
  solid[10][37] = true; // echo_ruins
  return { tiles, solid };
}

export const WORLD_MAP: WorldMapData = createMap();
