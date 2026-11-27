# SOFTWARE REQUIREMENTS SPECIFICATION (SRS)
**Tên dự án:** Lexicon Isle  
**Thể loại:** 2D Top-down Pixel-art Chibi RPG (Phiêu lưu Giải đố + Nông trại nhẹ + Sinh tồn nhẹ)  
**Mục tiêu giáo dục:** Học tiếng Anh tự nhiên theo ngữ cảnh (Trình độ A1 – B1) dành cho người Việt  
**Phạm vi triển khai:** Web Game (Chơi cá nhân / Nhóm bạn, hỗ trợ mở rộng lên Cloud DB)  

---

## 1. TỔNG QUAN & TRIẾT LÝ THIẾT KẾ

### 1.1. Bối cảnh (Lore)
Người chơi là một nhà thám hiểm trẻ bị trôi dạt lên **Đảo Cổ Ngữ (Lexicon Isle)** — nơi cư dân, bia đá và hầm ngục đều sử dụng tiếng Anh. Để sinh tồn và phá giải phong ấn tại Tàn Tích Cổ Đại, người chơi phải chăm sóc khu vườn nhỏ lấy lương thực, trò chuyện với trưởng làng **Elder Mara**, giải mã manh mối trong rừng và đánh bại **Stone Guardian Boss**.

### 1.2. Nguyên tắc cốt lõi (Core Design Pillars)
1. **Không ngắt nhịp game (No Boring Quiz Popups):** Tuyệt đối không dừng màn hình chiến đấu để hiện bảng trắc nghiệm A-B-C-D tách rời bối cảnh. Tiếng Anh phải là **vũ khí, công thức, cảnh báo thời tiết và manh mối môi trường**.
2. **1 Lõi chính – 2 Vệ tinh nhẹ:**
   * **Trụ cột chính:** Phiêu lưu khám phá, giải đố tiếng Anh và chiến đấu.
   * **Vệ tinh bổ trợ:** Nông trại gọn (12 ô đất) và Sinh tồn nhẹ (chỉ gồm `HP`, `Stamina` và Thời tiết).
3. **Bán thế giới mở phân tầng trình độ:** Tự do đi lại giữa 3 khu vực với độ khó tiếng Anh tăng dần từ **A1 → A2 → B1**.

---

## 2. KIẾN TRÚC KỸ THUẬT & QUY ƯỚC CHO AI AGENT

### 2.1. Tech Stack
* **Frontend & Game Engine:** React 18+, TypeScript, Vite, HTML5 Canvas 2D, Tailwind CSS (UI overlay phong cách Retro Pixel).
* **Đồ họa (Pixel-art Chibi):**
  * Thiết kế nhân vật theo dáng **Chibi** (tỉ lệ ~2.5 đầu, đường viền rõ, màu sắc ấm cúng).
  * Thiết lập `ctx.imageSmoothingEnabled = false` để giữ pixel sắc nét.
  * **Quy tắc Asset (Bắt buộc):** Không dùng link ảnh/âm thanh ngoài có nguy cơ chết link. Xây dựng hệ thống `SpriteManager` hỗ trợ nạp spritesheet PNG nội bộ (nếu người dùng thả file vào `/public/assets/`), **đồng thời có sẵn bộ renderer pixel-art bằng code (procedural pixel-matrix offscreen canvas)** làm mặc định để game chạy hoàn chỉnh ngay lập tức.
* **Âm thanh & Phát âm:**
  * **Web Audio API:** Tổng hợp âm thanh 8-bit nhẹ (cuốc đất, tưới nước, thu hoạch, vung kiếm, chí mạng, mở rương, nhận sát thương, lên cấp).
  * **Web Speech API (`window.speechSynthesis`):** Đọc giọng tiếng Anh bản xứ (`en-US` hoặc `en-GB`) cho mọi biển báo, lời thoại, thẻ từ vựng và khẩu lệnh của Boss.
* **Lưu trữ dữ liệu:**
  * **Giai đoạn 1 (MVP):** Tự động lưu toàn bộ tiến độ vào `localStorage` (có nút `Continue` và `Reset Save`).
  * **Giai đoạn 2 (Mở rộng):** Tách sẵn tầng `services/storageService.ts` để dễ dàng cắm **Supabase** (lưu Save State vào 1 cột `JSONB` và tiến độ từ vựng vào bảng `user_vocab_progress`).

### 2.2. Cấu trúc thư mục chuẩn (Modular Architecture)
```text
src/
├── types/
│   └── game.ts              # Toàn bộ interface (Player, Enemy, Crop, Quest, Vocab, SaveState)
├── data/
│   ├── mapData.ts           # Dữ liệu tilemap 48x36 chia 3 vùng, vị trí vật thể & va chạm
│   ├── vocabData.ts         # Bộ từ vựng A1-B1 (tối thiểu 40-60 từ chia theo vùng)
│   ├── contentData.ts       # Công thức nấu ăn, hạt giống, nhiệm vụ, câu đố, lời thoại NPC
│   └── bestiaryData.ts      # Chỉ số & từ khóa của từng loại quái và Boss
├── engine/
│   ├── sprites.ts           # Procedural pixel-art chibi sprites + loader cho PNG spritesheet
│   ├── audio.ts             # Web Audio API 8-bit SFX + Web Speech API TTS wrapper
│   ├── gameEngine.ts        # Game loop 60FPS, camera follow, collision, physics, AI quái/Boss
│   └── particles.ts         # Floating damage/XP, hit-flash, screen shake, particle bursts
├── services/
│   └── storageService.ts    # Auto-save / Load / Reset (localStorage, sẵn sàng nối Supabase)
├── components/
│   ├── GameCanvas.tsx       # Component bọc HTML5 Canvas & lắng nghe input
│   ├── HUD.tsx              # Thanh HP, Stamina, Đồng hồ, Thời tiết, Hotbar 1-5, Toggle EN/EN+VI
│   ├── TitleScreen.tsx      # Màn hình chính (Start Adventure / Continue / Controls)
│   ├── DialogModal.tsx      # Khung thoại NPC, Biển báo, Bảng tin thời tiết (kèm nút loa 🔊)
│   ├── PuzzleModal.tsx      # Giao diện Rương giải đố & Cổng cổ ngữ
│   ├── CraftingModal.tsx    # Giao diện Nồi nấu ăn & Túi đồ (Inventory)
│   ├── LexiconModal.tsx     # Sổ tay từ vựng (Phím L) có phát âm & sao thông thạo
│   └── CampfireModal.tsx    # Mini-game ôn từ vựng trước khi đi ngủ qua ngày mới
└── App.tsx
```

---

## 3. THIẾT KẾ BẢN ĐỒ (WORLD MAP — 48x36 TILES)

Bản đồ thống nhất kích thước **48 cột x 36 hàng** (kích thước gốc `16x16px`, render scale `3x` thành `48x48px` trên màn hình), camera di chuyển mượt theo nhân vật và giới hạn trong khung bản đồ.

| Khu vực | Tọa độ X (gợi ý) | Bối cảnh & Vật thể chính | Trình độ |
| :--- | :--- | :--- | :--- |
| **1. West: Homestead** *(Khu Trại — Vùng An Toàn)* | `0 – 15` | Căn chòi gỗ (điểm ngủ qua ngày), **Bảng tin thời tiết**, **Nồi nấu ăn**, **Lửa trại**, **Mảnh vườn 3x4 (12 ô đất)**, rương chứa đồ khởi đầu. Không có quái vật. | **A1** |
| **2. Center: Whispering Woods** *(Rừng Thì Thầm)* | `16 – 33` | Rừng thông, dòng sông chảy dọc kèm **Cầu gỗ**, lều của **Elder Mara**, 3+ **Bia đá/Biển chỉ dẫn tiếng Anh**, bụi thảo mộc hái lượm, **2 Rương giải đố**, khu vực quái thường xuất hiện. | **A2** |
| **3. East: Ancient Ruins** *(Tàn Tích Cổ — Đấu trường Boss)* | `34 – 47` | **Cổng Đá Phong Ấn** (cần *Iron Key* từ giải đố mới mở), sàn gạch rêu phong, **4 Cột đá chắn đòn (Stone Pillars)**, **3 Bệ cổ ngữ phát sáng (Blue / Red / Green Runes)**, đấu trường **Stone Guardian Boss**. | **B1** |

---

## 4. NHÂN VẬT & DANH SÁCH QUÁI VẬT (CHARACTERS & BESTIARY)

### 4.1. Nhân vật chính & NPC
* **The Player (Chibi Hero):**
  * Ngoại hình: Tỉ lệ chibi, áo khoác nâu, khăn quàng cổ đỏ, ba lô sinh tồn, tay cầm kiếm ngắn và sổ tay *Lexicon*.
  * Trạng thái animation: `Idle`, `Walk` (4 hướng: Down/Up/Left/Right), `Attack` (vung kiếm kèm hiệu ứng chữ cái), `Farm` (tưới nước/cuốc đất), `Read` (đọc sổ tay).
  * Biểu cảm chân dung trên HUD thay đổi theo trạng thái: *Vui vẻ* (HP/Stamina đầy), *Quyết tâm* (khi chiến đấu), *Hoang mang* (khi mở câu đố), *Kiệt sức* (khi Stamina < 20% hoặc HP < 30%).
* **Elder Mara (Mentor NPC):** Học giả râu dài, áo choàng xanh lục viền vàng, cầm trượng sách cổ phát sáng. Giao nhiệm vụ chính tuyến, giải thích công thức và bán/tặng hạt giống cơ bản.

### 4.2. Quái vật (Bestiary)
| Tên quái | Khu vực | Thời điểm | Hành vi & Cơ chế Tiếng Anh |
| :--- | :--- | :--- | :--- |
| **Word Slimes** *(Đỏ/Xanh/Lục)* | Whispering Woods | Cả ngày | Nhảy chậm về phía người chơi. Hiển thị từ vựng A1 trên đầu (vd: `CAT`, `FLY`, `RUN`, `RED`). |
| **Goblins** | Whispering Woods | Cả ngày | Di chuyển nhanh, áp sát tấn công. Mang từ vựng A2 (vd: `STEAL`, `DARK`, `HIDE`, `FAST`). |
| **Bramble Plants** | Whispering Woods | Cả ngày | Đứng yên gần rương/thảo mộc, cắn khi lại gần. Mang từ vựng thực vật/tính từ (vd: `BITE`, `SPINY`, `ROOT`, `POISON`). |
| **Night Bat & Owl** | Whispering Woods | **Chỉ ban đêm** | Bay nhanh, bỏ qua chướng ngại vật thấp. Mang từ vựng ban đêm (vd: `SHADOW`, `MOON`, `WING`, `SILENT`). |
| **Ruin Sentinels** | Ancient Ruins | Cả ngày | Lính đá canh cổng, máu dày. Mang từ vựng B1 (vd: `SHIELD`, `GUARD`, `ANCIENT`, `ARMOR`). |
| **Stone Guardian (BOSS)** | Boss Arena | Khi kích hoạt | Hộ vệ đá khổng lồ khắc cổ ngữ xanh phát sáng. Có 3 chiêu thức gắn khẩu lệnh tiếng Anh + phát âm. |

---

## 5. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS)

### FR-01: Điều khiển & Tương tác
* `W/A/S/D` hoặc Phím mũi tên: Di chuyển 4 hướng.
* `E`: Tương tác thông minh theo ngữ cảnh (nói chuyện NPC, đọc biển báo, mở rương, cuốc/gieo/tưới/thu hoạch ô đất, dùng nồi nấu ăn, ngủ tại lều/lửa trại).
* `Space`: Tấn công thường bằng kiếm theo hướng nhân vật đang nhìn.
* `1` – `5`: Chọn nhanh vật phẩm/hạt giống/thức ăn trên thanh Hotbar (bấm `F` hoặc click để ăn/sử dụng).
* `L`: Mở/Đóng Sổ tay Từ vựng (*Lexicon Notebook*).
* `I`: Mở/Đóng Túi đồ (*Inventory*).
* Hỗ trợ nút click chuột bổ trợ trên UI cho thao tác chọn đáp án, nấu ăn và bật âm thanh.

### FR-02: Sinh tồn nhẹ & Chu kỳ Ngày – Đêm
* **Chỉ số:** `HP` (tối đa 100) và `Stamina` (tối đa 100). Hành động cuốc đất, tưới cây, vung kiếm tốn Stamina; ăn thức ăn để hồi HP/Stamina. Nếu `HP = 0`, người chơi ngất và tỉnh lại ở Khu Trại vào sáng hôm sau (mất một ít xu, không mất trang bị hay từ vựng).
* **Thời gian:** 1 ngày trong game chia 4 pha: `Morning` → `Afternoon` → `Evening` → `Night` (mỗi ngày kéo dài khoảng 3–4 phút thời gian thực). Ban đêm phủ lớp màu xanh tối + vòng sáng (torchlight glow) quanh nhân vật và lửa trại.
* **Bảng tin Thời tiết (Weather Board):** Mỗi sáng tự động sinh 1 bản tin tiếng Anh kèm tác động thật:
  * *Sunny:* `"Bright sunshine today — remember to water your crops!"` (Cây cần tưới mới lớn).
  * *Rainy:* `"Heavy rain is coming today — crops won't need watering!"` (Toàn bộ ô đất tự động ướt, có hiệu ứng hạt mưa).
  * *Cold Wind:* `"A freezing wind blows tonight — cook Pumpkin Soup to stay warm!"` (Ban đêm tụt dần Stamina/HP nếu chưa ăn súp giữ ấm).

### FR-03: Nông trại & Nấu ăn (Farming & Crafting-Lite)
* **12 ô đất (3x4):** Chu trình `Untilled` → `Tilled` → `Planted (Seed)` → `Watered` → `Growing` → `Mature (Harvestable)`.
* **4 loại cây trồng:**
  1. `Sunberry`: Lớn nhanh (1 ngày), hồi Stamina nhẹ.
  2. `Pumpkin`: Lớn sau 2 ngày, nguyên liệu chính nấu *Pumpkin Soup* (chống lạnh, hồi nhiều Stamina).
  3. `Healing Herb`: Thảo mộc xanh, dùng chế *Healing Potion* (hồi 50 HP).
  4. `Bitter Root`: Rễ đắng (tìm hạt giống trong rừng), dùng để giải câu đố bức tượng đá.
* **Nồi nấu ăn (Cooking Pot):** Hiển thị công thức bằng câu mệnh lệnh tiếng Anh ngắn (vd: *"Boil 1 Pumpkin + 1 Sunberry to make Warm Pumpkin Soup"*). Người chơi chọn đúng nguyên liệu từ túi đồ để chế tạo.

### FR-04: Hệ thống Giải đố Tiếng Anh (4 Cơ chế)
1. **Manh mối môi trường (Environmental Clues):** Biển báo và Elder Mara đưa chỉ dẫn vị trí giấu vật phẩm bằng tiếng Anh (vd: *"The Iron Key rests beside the three pine trees north of the pond"*). Người chơi tự tìm đúng ô trên bản đồ và nhấn `E` để đào.
2. **Câu đố dâng vật phẩm (Item Riddle):** Bức tượng cổ hiển thị câu đố mô tả tính chất (vd: *"Offer me a bitter root from the forest to open the secret path"*). Người chơi giao đúng vật phẩm từ túi đồ để nhận thưởng.
3. **Rương khóa cổ ngữ (Contextual Fill-in-the-Blank):** Mở rương bằng cách chọn đúng từ/giới từ hoàn thiện câu văn gắn với cốt truyện (vd: *"The ancient key is hidden ___ the old bridge."* → `under`).
4. **Hỗ trợ dịch (EN / EN+VI Toggle):** Nút chuyển nhanh trên HUD. Khi bật gợi ý tiếng Việt trong lúc giải đố, người chơi có thể xem nghĩa để không bị kẹt (có thể tốn nhẹ 5 Stamina hoặc 5 Coins để khuyến khích tự đoán trước).

### FR-05: Chiến đấu & Đấu Boss (Combat & Boss Mechanics)
* **Đánh thường & Word Strike:**
  * Đánh bằng phím `Space` gây sát thương cơ bản (`10 dmg`).
  * Khi lại gần quái đang mang từ tiếng Anh trên đầu, một thanh **Word Strike** nhỏ xuất hiện gọn gàng ở cạnh dưới màn hình với 3 lựa chọn nghĩa/từ khắc chế nhanh (bấm phím tắt `J / K / L` hoặc click). Chọn đúng lập tức tung đòn **Word Strike (Chí mạng `35 dmg` + hiệu ứng chớp sáng + gấp đôi XP + ghi từ vào Sổ tay)**.
* **Cơ chế Boss — Stone Guardian (`300 HP`):**
  * Luân phiên tấn công thường và tung **Tuyệt chiêu báo trước bằng khẩu lệnh tiếng Anh + phát âm (Web Speech API)** trong 4 giây trước khi kích hoạt:
    1. `"Stand on the BLUE rune!"` → Toàn sàn nổ sát thương trừ ô bệ đá màu xanh dương.
    2. `"Hide behind the STONE pillar!"` → Boss bắn sóng xung kích từ trung tâm; đứng sau 1 trong 4 cột đá sẽ miễn nhiễm sát thương.
    3. `"Strike my shield when I sleep!"` → Boss rơi vào trạng thái ngủ/hạ giáp trong 4 giây, nhận `x2` sát thương.
  * Đánh bại Boss mở khóa màn hình Chiến thắng (Victory Summary: tổng số từ đã học, số ngày sinh tồn, huy hiệu *Lexicon Master*) và cho phép tiếp tục chơi tự do.

### FR-06: Sổ tay Từ vựng (Lexicon Notebook) & Ôn tập Lửa trại
* **Lexicon (`L`):** Tự động ghi lại mọi từ khóa xuất hiện trong biển báo, vật phẩm, công thức và quái vật đã gặp. Mỗi thẻ từ gồm: Từ tiếng Anh, loại từ, nút phát âm 🔊, câu ngữ cảnh gốc trong game, nghĩa tiếng Việt (có thể ẩn/hiện) và **Mức thông thạo (1–3 sao)**.
* **Campfire Review (Ôn tập trước khi ngủ):** Khi nhấn `E` vào Lửa trại hoặc Căn chòi vào buổi tối, game gợi ý ôn nhanh 3 từ vừa gặp trong ngày (nghe phát âm chọn từ hoặc điền từ còn thiếu). Trả lời đúng tăng sao thông thạo và nhận hiệu ứng **Well Rested** (+20% tốc độ chạy và +25% XP cho ngày hôm sau).

---

## 6. MÔ HÌNH DỮ LIỆU CỐT LÕI (DATA SCHEMAS)

Agent cần định nghĩa các cấu trúc dữ liệu chuẩn hóa ngay từ đầu trong `src/types/game.ts`:

```typescript
export type ZoneId = 'homestead' | 'woods' | 'ruins';
export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';
export type WeatherType = 'sunny' | 'rainy' | 'cold_wind';

export interface VocabEntry {
  id: string;
  word: string;
  partOfSpeech: string;
  meaningVi: string;
  exampleSentence: string;
  zone: ZoneId;
  level: 'A1' | 'A2' | 'B1';
}

export interface UserVocabProgress {
  vocabId: string;
  discovered: boolean;
  masteryStars: 0 | 1 | 2 | 3; // 0 = chưa gặp, 3 = thông thạo
  correctCount: number;
  lastReviewedDay: number;
}

export interface FarmPlot {
  id: number;
  tileX: number;
  tileY: number;
  state: 'untilled' | 'tilled' | 'planted' | 'mature';
  cropId: 'sunberry' | 'pumpkin' | 'healing_herb' | 'bitter_root' | null;
  watered: boolean;
  daysGrown: number;
  daysRequired: number;
}

export interface SaveState {
  version: string;
  day: number;
  timeOfDay: TimeOfDay;
  weather: WeatherType;
  hintMode: 'EN' | 'EN_VI';
  player: {
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
  };
  inventory: Record<string, number>;
  farmPlots: FarmPlot[];
  completedQuests: string[];
  openedChests: string[];
  ruinsGateUnlocked: boolean;
  bossDefeated: boolean;
  vocabProgress: Record<string, UserVocabProgress>;
}
```

---

## 7. YÊU CẦU PHI CHỨC NĂNG & TIÊU CHÍ NGHIỆM THU

### 7.1. Yêu cầu Phi chức năng (NFR)
* **Hiệu năng:** Duy trì ổn định `60 FPS` trên trình duyệt hiện đại (Chrome, Edge, Safari) dùng `requestAnimationFrame` với `deltaTime` để tốc độ di chuyển không phụ thuộc tần số quét màn hình.
* **Game Feel:** Có số sát thương/XP bay lên (floating numbers), rung màn hình nhẹ khi dính đòn hoặc nổ chí mạng (screen shake), nhấp nháy trắng khi trúng đòn (hit-flash), hạt hiệu ứng khi tưới cây/thu hoạch/diệt quái.
* **Khả năng mở rộng:** Toàn bộ nội dung tiếng Anh (từ vựng, nhiệm vụ, câu đố, công thức) phải nằm trong thư mục `src/data/`, không hardcode rải rác trong `gameEngine.ts`.

### 7.2. Tiêu chí Nghiệm thu (Acceptance Criteria)
Bản build được xem là đạt yêu cầu khi kiểm tra thông suốt luồng chơi sau mà không có lỗi đỏ trên Console:
- [ ] Khởi động vào Title Screen, bấm `Start Adventure`, nhân vật chibi di chuyển mượt 4 hướng và có va chạm chuẩn với tường/cây/sông.
- [ ] Đọc được Bảng tin thời tiết buổi sáng kèm âm thanh phát âm 🔊.
- [ ] Cuốc đất, gieo hạt, tưới nước, ngủ qua ngày (hoặc qua chu kỳ) và thu hoạch được nông sản, sau đó nấu thành công ít nhất 1 món ăn tại Nồi nấu ăn.
- [ ] Đi sang Rừng Thì Thầm, nói chuyện với Elder Mara, đọc biển chỉ dẫn, tìm được *Iron Key* và giải đố mở được 2 Rương báu.
- [ ] Chiến đấu với quái thường, kích hoạt được chí mạng **Word Strike** và thấy từ vựng tự động lưu vào Sổ tay *Lexicon* (phím `L`).
- [ ] Dùng *Iron Key* mở cổng Tàn Tích Cổ, chiến đấu với Boss *Stone Guardian* có đầy đủ 3 khẩu lệnh tiếng Anh + phát âm, và kích hoạt được màn hình Chiến thắng khi Boss hết máu.
- [ ] F5 tải lại trang, chọn `Continue` và khôi phục nguyên vẹn vị trí, nông trại, túi đồ và sổ từ vựng.

---

## 8. LỘ TRÌNH GIAO VIỆC CHO AGENT (RECOMMENDED PHASES)

Nếu chạy theo từng chặng để kiểm soát chất lượng tốt nhất, yêu cầu Agent thực hiện tuần tự:
1. **Phase 1 — Core Engine & Homestead:** Dựng cấu trúc thư mục, Tilemap 3 vùng, Camera, Va chạm, Chibi Player animation, HUD và `storageService`.
2. **Phase 2 — Farming, Cooking & Survival-Lite:** Hoàn thiện 12 ô đất, Chu kỳ Ngày – Đêm, Thời tiết tiếng Anh, Nồi nấu ăn và Lửa trại ôn từ.
3. **Phase 3 — Exploration, Puzzles & Combat:** Thêm Elder Mara, Biển chỉ dẫn, 2 Rương giải đố, Quái thường (Slimes, Goblins, Bramble, Night Bat/Owl), cơ chế *Word Strike* và *Lexicon Notebook*.
4. **Phase 4 — Boss Arena & Polish:** Hoàn thiện cổng khóa Tàn Tích, Ruin Sentinels, Boss *Stone Guardian* với 3 khẩu lệnh phát âm, âm thanh 8-bit, hiệu ứng hạt và kiểm thử toàn bộ tiêu chí nghiệm thu.