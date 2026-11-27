import { useEffect, useRef } from 'react';
import { ITEMS } from '../data/contentData';
import { MAP_HEIGHT, MAP_WIDTH, ZONE_LABELS } from '../data/mapData';
import { audioManager } from '../engine/audio';
import { HudSnapshot } from '../types/game';

interface HUDProps {
  hud: HudSnapshot;
  portraitUrl: string;
  getItemIconUrl: (itemId: string) => string;
  onToggleHintMode: () => void;
  onToggleMute: () => void;
  onOpenLexicon: () => void;
  onOpenBag: () => void;
  onOpenForge: () => void;
  onPause: () => void;
  onSelectHotbar: (idx: number) => void;
  onUseHotbar: () => void;
  onAnswerWordStrike: (idx: number) => void;
  onTriggerNova: () => void;
}

const WEATHER_ICON: Record<HudSnapshot['weather'], { en: string; vi: string }> = {
  sunny: { en: 'Sunny', vi: 'Nắng' },
  rainy: { en: 'Rainy', vi: 'Mưa' },
  cold_wind: { en: 'Cold Wind', vi: 'Gió lạnh' },
};

const TIME_LABEL: Record<HudSnapshot['timeOfDay'], { en: string; vi: string }> = {
  morning: { en: 'Morning', vi: 'Sáng' },
  afternoon: { en: 'Afternoon', vi: 'Chiều' },
  evening: { en: 'Evening', vi: 'Hoàng hôn' },
  night: { en: 'Night', vi: 'Ban đêm' },
};

const STRIKE_KEYS = ['J', 'K', 'L'];

export function HUD({
  hud,
  portraitUrl,
  getItemIconUrl,
  onToggleHintMode,
  onToggleMute,
  onOpenLexicon,
  onOpenBag,
  onOpenForge,
  onPause,
  onSelectHotbar,
  onUseHotbar,
  onAnswerWordStrike,
  onTriggerNova,
}: HUDProps) {
  const hpGhostRef = useRef<HTMLDivElement | null>(null);

  const hpPct = Math.max(0, Math.min(100, (hud.hp / Math.max(1, hud.maxHp)) * 100));
  const stamPct = Math.max(0, Math.min(100, (hud.stamina / Math.max(1, hud.maxStamina)) * 100));
  const surgePct = Math.max(0, Math.min(100, hud.surgeCharge));

  useEffect(() => {
    if (hpGhostRef.current) {
      hpGhostRef.current.style.width = `${hpPct}%`;
    }
  }, [hpPct]);

  const zoneInfo = ZONE_LABELS[hud.zone];
  const weatherInfo = WEATHER_ICON[hud.weather];
  const timeInfo = TIME_LABEL[hud.timeOfDay];

  return (
    <div className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-between p-3 sm:p-4">
      {/* TOP ROW */}
      <div className="flex items-start justify-between gap-3">
        {/* Top-Left: Chibi Portrait + Vitality + Surge + Active Quest */}
        <div className="flex flex-col gap-2 max-w-[345px]">
          <div className="panel-wood rounded-md px-3 py-2.5 flex items-center gap-3">
            {/* Chibi Mood Portrait */}
            <div className="relative w-12 h-12 rounded border-2 border-[#a88254] overflow-hidden shrink-0 bg-[#2a2018]">
              <img
                src={portraitUrl}
                alt={`Hero portrait (${hud.portraitMood})`}
                className="w-full h-full pixel-canvas"
              />
              <span className="absolute bottom-0 right-0 bg-[#241911] text-[#ffd970] font-mono-num text-[10px] font-bold px-1 leading-tight">
                L{hud.level}
              </span>
            </div>

            {/* Bars */}
            <div className="flex-1 min-w-[178px] space-y-1.5">
              <div>
                <div className="flex items-center justify-between text-[11px] font-semibold leading-none mb-1">
                  <span className="text-[#ff9c94] tracking-wider">HP</span>
                  <span className="font-mono-num text-[#fff5e4]" data-testid="hud-hp">
                    {hud.hp}/{hud.maxHp}
                  </span>
                </div>
                <div className="relative h-2.5 bg-[#1b130e] border border-[#5e4430] rounded-xs overflow-hidden">
                  <div
                    ref={hpGhostRef}
                    className="absolute inset-y-0 left-0 bg-[#f0b95b] transition-all duration-500"
                    style={{ width: `${hpPct}%` }}
                  />
                  <div
                    className="absolute inset-y-0 left-0 bg-[#d9433b] transition-all duration-150"
                    style={{ width: `${hpPct}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-[11px] font-semibold leading-none mb-1">
                  <span className="text-[#9ee087] tracking-wider">STAMINA</span>
                  <span className="font-mono-num text-[#fff5e4]" data-testid="hud-stamina">
                    {hud.stamina}/{hud.maxStamina}
                  </span>
                </div>
                <div className="relative h-2 bg-[#1b130e] border border-[#5e4430] rounded-xs overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-[#4eb357] transition-all duration-150"
                    style={{ width: `${stamPct}%` }}
                  />
                </div>
              </div>

              {/* Lexicon Surge Bar (clickable when 100%) */}
              <div className="pointer-events-auto">
                <div className="flex items-center justify-between text-[10px] font-semibold leading-none mb-0.5">
                  <span className={surgePct >= 100 ? 'text-[#ffe066] font-bold' : 'text-[#8fd4ff]'}>
                    SURGE [Q] {hud.wordCombo > 0 ? `· x${hud.wordCombo}` : ''}
                  </span>
                  <span className="font-mono-num text-[#d8e8f5]">{surgePct}%</span>
                </div>
                <button
                  type="button"
                  tabIndex={-1}
                  disabled={surgePct < 100}
                  onClick={(e) => {
                    e.currentTarget.blur();
                    onTriggerNova();
                  }}
                  aria-label="Trigger Lexicon Nova Surge"
                  className={`relative block w-full h-2 bg-[#151c24] border rounded-xs overflow-hidden ${
                    surgePct >= 100
                      ? 'border-[#ffe066] cursor-pointer'
                      : 'border-[#3a4f61] cursor-default'
                  }`}
                >
                  <div
                    className={`h-full transition-all duration-200 ${
                      surgePct >= 100 ? 'bg-[#ffd84d]' : 'bg-[#46b4f0]'
                    }`}
                    style={{ width: `${surgePct}%` }}
                  />
                </button>
              </div>

              {/* Compact inline metrics */}
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-[#decba8] font-mono-num pt-0.5">
                <span data-testid="hud-coins">{hud.coins}g</span>
                <span aria-hidden="true">·</span>
                <span>
                  XP {hud.xp}/{hud.xpToNext}
                </span>
                <span aria-hidden="true">·</span>
                <span className={hud.dashReady ? 'text-[#9ee8ff]' : 'text-[#877863]'}>
                  Dash[Shift]
                </span>
                {hud.wellRestedBuff && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="text-[#96f0a5] font-sans font-semibold">Rested</span>
                  </>
                )}
                {hud.warmBuff && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="text-[#ffb963] font-sans font-semibold">Warm</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Active Quest & English Challenges counter */}
          <div className="panel-wood rounded-md px-3 py-1.5 text-xs">
            <div className="flex items-center justify-between gap-2 text-[10px] font-bold tracking-wider">
              <span className="text-[#d9a659]">ACTIVE QUEST</span>
              <span className="font-mono-num text-[#8fd4ff]" data-testid="hud-challenges">
                Puzzles {hud.solvedChallengesCount}/{hud.totalChallengesCount}
              </span>
            </div>
            <div className="text-[#f7eedc] font-medium leading-snug" data-testid="hud-quest">
              {hud.activeQuestTitleEn}
            </div>
            {hud.hintMode === 'EN_VI' && (
              <div className="text-[#cbb694] text-[11px] leading-snug">{hud.activeQuestTitleVi}</div>
            )}
          </div>
        </div>

        {/* Top-Center: Boss Bar & Spoken English Command Telegraph */}
        {hud.bossHud && hud.bossHud.active && (
          <div className="panel-wood rounded-md px-4 py-2.5 w-full max-w-md text-center border-[#58b8ff]">
            <div className="flex items-center justify-between text-xs font-bold mb-1">
              <span className="font-display text-sm text-[#fff4d4]">STONE GUARDIAN</span>
              <span className="font-mono-num text-[#9be4ff]" data-testid="boss-hp">
                {hud.bossHud.hp} / {hud.bossHud.maxHp}
              </span>
            </div>
            <div className="h-3 bg-[#151a1e] border border-[#46697d] rounded-xs overflow-hidden mb-2">
              <div
                className="h-full bg-[#38a6e8] transition-all duration-150"
                style={{ width: `${(hud.bossHud.hp / hud.bossHud.maxHp) * 100}%` }}
              />
            </div>

            {hud.bossHud.commandEn && (
              <div className="pt-1">
                <div className="font-display text-base sm:text-lg font-bold text-[#ffe36e]">
                  “{hud.bossHud.commandEn}”
                </div>
                {hud.hintMode === 'EN_VI' && (
                  <div className="text-xs text-[#d6e8f5] mt-0.5">{hud.bossHud.commandVi}</div>
                )}
                <div className="mt-1.5 h-1.5 bg-[#1b2226] rounded-xs overflow-hidden">
                  <div
                    className={`h-full ${hud.bossHud.phase === 'vulnerable' ? 'bg-[#58e3ff]' : 'bg-[#f06449]'}`}
                    style={{
                      width: `${Math.max(0, Math.min(100, (hud.bossHud.timerRemaining / Math.max(0.1, hud.bossHud.timerMax)) * 100))}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Top-Right: Zone, Day/Time/Weather & Utility Controls */}
        <div className="flex flex-col items-end gap-2">
          <div className="panel-wood rounded-md px-3 py-2 text-right">
            <div className="font-display text-sm font-bold text-[#fff4d6]" data-testid="hud-zone">
              {zoneInfo.en}
              <span className="text-xs font-mono-num text-[#d9a659] ml-1.5">({zoneInfo.level})</span>
            </div>
            <div className="text-xs text-[#dfd0b4] font-mono-num flex items-center justify-end gap-1.5 mt-0.5">
              <span data-testid="hud-day">Day {hud.day}</span>
              <span aria-hidden="true">·</span>
              <span>{hud.hintMode === 'EN_VI' ? `${timeInfo.en} (${timeInfo.vi})` : timeInfo.en}</span>
              <span aria-hidden="true">·</span>
              <span data-testid="hud-weather">{weatherInfo.en}</span>
            </div>
          </div>

          <div className="flex flex-wrap justify-end items-center gap-1.5 pointer-events-auto">
            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                onToggleHintMode();
              }}
              aria-label="Toggle English and Vietnamese hint mode"
              data-testid="toggle-hint-mode"
              className="btn-wood-secondary px-2.5 py-1.5 rounded text-xs font-bold whitespace-nowrap cursor-pointer"
            >
              {hud.hintMode === 'EN_VI' ? 'EN + VI' : 'EN Only'}
            </button>

            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                onOpenLexicon();
              }}
              aria-label="Open Lexicon Notebook"
              className="btn-wood-secondary px-2.5 py-1.5 rounded text-xs font-semibold whitespace-nowrap cursor-pointer"
            >
              Lexicon [L] <span className="font-mono-num text-[#ffd970]">{hud.discoveredCount}/{hud.totalVocabCount}</span>
            </button>

            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                onOpenBag();
              }}
              aria-label="Open Inventory Bag"
              className="btn-wood-secondary px-2.5 py-1.5 rounded text-xs font-semibold whitespace-nowrap cursor-pointer"
            >
              Bag [I]
            </button>

            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                onOpenForge();
              }}
              aria-label="Open Gear Forge"
              className="btn-wood-secondary px-2.5 py-1.5 rounded text-xs font-semibold whitespace-nowrap cursor-pointer"
            >
              Forge
            </button>

            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                onToggleMute();
              }}
              aria-label={hud.muted ? 'Unmute audio' : 'Mute audio'}
              className="btn-wood-secondary px-2.5 py-1.5 rounded text-xs font-semibold whitespace-nowrap cursor-pointer"
            >
              {hud.muted ? 'Muted [M]' : 'Audio [M]'}
            </button>

            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                onPause();
              }}
              aria-label="Pause game"
              className="btn-wood-secondary px-2.5 py-1.5 rounded text-xs font-semibold whitespace-nowrap cursor-pointer"
            >
              Pause [P]
            </button>
          </div>
        </div>
      </div>

      {/* BOTTOM ROW: Center Prompts/WordStrike/Hotbar + Bottom-Right Compact Live Minimap */}
      <div className="relative flex items-end justify-center">
        <div className="flex flex-col items-center gap-2 max-w-full">
          {hud.toastMessage && (
            <div
              role="status"
              className="panel-wood px-4 py-1.5 rounded text-xs sm:text-sm font-medium text-[#fff2cc] text-center max-w-xl"
            >
              {hud.toastMessage}
            </div>
          )}

          {hud.nearbyPrompt && !hud.wordStrike && (
            <div className="panel-wood px-3.5 py-1 rounded text-xs sm:text-sm font-semibold text-[#ffe394]">
              {hud.nearbyPrompt}
            </div>
          )}

          {/* Compact Non-Pausing Word Strike Combat Bar (Meaning + Context Cloze + IPA) */}
          {hud.wordStrike && (
            <div
              data-testid="word-strike-bar"
              className="panel-wood rounded-md px-4 py-2.5 pointer-events-auto border-[#e8a838] max-w-2xl w-full"
            >
              <div className="flex items-center justify-between gap-3 mb-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-bold tracking-wider text-[#ffb84d]">
                    {hud.wordStrike.mode === 'context' ? 'CONTEXT STRIKE' : 'WORD STRIKE'}
                  </span>
                  {hud.wordStrike.mode === 'meaning' ? (
                    <>
                      <span className="font-mono-num text-base font-bold text-[#fff8dc]">
                        {hud.wordStrike.word}
                      </span>
                      {hud.wordStrike.ipa && (
                        <span className="font-mono-num text-xs text-[#cbb896]">{hud.wordStrike.ipa}</span>
                      )}
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={(e) => {
                          e.currentTarget.blur();
                          audioManager.speakEnglish(hud.wordStrike!.word.toLowerCase());
                        }}
                        aria-label={`Pronounce ${hud.wordStrike.word}`}
                        className="text-xs text-[#ffe082] hover:text-white cursor-pointer"
                      >
                        🔊
                      </button>
                    </>
                  ) : (
                    <span className="text-xs sm:text-sm font-semibold text-[#fff5d6]">
                      “{hud.wordStrike.contextPrompt}”
                    </span>
                  )}
                </div>
                <span className="text-xs text-[#d6c2a1] whitespace-nowrap">
                  {hud.wordStrike.enemyName}
                  {hud.wordCombo >= 2 ? ` · x${hud.wordCombo} COMBO` : ' · 2x XP'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {hud.wordStrike.options.map((opt, idx) => (
                  <button
                    key={`${hud.wordStrike!.enemyId}-${idx}`}
                    type="button"
                    tabIndex={-1}
                    onClick={(e) => {
                      e.currentTarget.blur();
                      onAnswerWordStrike(idx);
                    }}
                    className="btn-wood-secondary px-3 py-2 rounded text-xs sm:text-sm font-semibold text-left flex items-center gap-2 cursor-pointer"
                  >
                    <span className="font-mono-num text-[#ffd666] font-bold">[{STRIKE_KEYS[idx]}]</span>
                    <span className="truncate">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Hotbar 1-5 with Pixel-Art Item Icons */}
          <div className="panel-wood rounded-md px-2 py-1.5 flex items-center gap-1.5 pointer-events-auto">
            {[0, 1, 2, 3, 4].map((idx) => {
              const slot = hud.hotbarItems[idx];
              const def = slot ? ITEMS[slot.itemId] : null;
              const isSelected = hud.selectedHotbarIndex === idx;
              const iconUrl = slot ? getItemIconUrl(slot.itemId) : '';
              return (
                <button
                  key={idx}
                  type="button"
                  tabIndex={-1}
                  onClick={(e) => {
                    e.currentTarget.blur();
                    if (isSelected && slot) {
                      onUseHotbar();
                    } else {
                      onSelectHotbar(idx);
                    }
                  }}
                  aria-label={def ? `Hotbar slot ${idx + 1}: ${def.name} (${slot.qty})` : `Empty hotbar slot ${idx + 1}`}
                  className={`relative min-w-[94px] sm:min-w-[122px] px-2 py-1.5 rounded text-left transition-colors cursor-pointer flex items-center gap-2 ${
                    isSelected
                      ? 'bg-[#614127] border-2 border-[#f2be5c] text-[#fff8e6]'
                      : 'bg-[#261c15] border border-[#543d2b] text-[#d6c5a9] hover:bg-[#33261c]'
                  }`}
                >
                  <div className="w-7 h-7 rounded bg-[#1b130e] border border-[#573e2b] shrink-0 flex items-center justify-center overflow-hidden">
                    {iconUrl ? (
                      <img src={iconUrl} alt="" className="w-6 h-6 pixel-canvas" />
                    ) : (
                      <span className="text-[10px] font-mono-num text-[#6e5a44]">{idx + 1}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between text-[10px] font-mono-num leading-none">
                      <span className={isSelected ? 'text-[#ffd970] font-bold' : 'text-[#9e896c]'}>[{idx + 1}]</span>
                      {slot && <span className="text-[#f7eedc] font-bold">x{slot.qty}</span>}
                    </div>
                    <div className="text-[11px] font-semibold truncate mt-0.5">
                      {def ? def.name : 'Empty'}
                    </div>
                  </div>
                </button>
              );
            })}

            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                onUseHotbar();
              }}
              aria-label="Use selected hotbar item"
              className="btn-wood-primary px-3 py-2.5 rounded text-xs font-bold whitespace-nowrap cursor-pointer"
            >
              Use [F]
            </button>
          </div>
        </div>

        {/* Compact Bottom-Right Live Island Minimap (hidden on narrow phones so Hotbar stays spacious) */}
        <div
          aria-label="Island Minimap"
          data-testid="hud-minimap"
          className="hidden lg:block absolute right-0 bottom-0 panel-wood rounded-md p-1.5"
        >
          <div className="relative w-[144px] h-[108px] rounded-xs overflow-hidden border border-[#5c432d] bg-[#2a3824]">
            {/* 3 Zone terrain bands + river + bridge */}
            <div className="absolute inset-y-0 left-0 w-[33%] bg-[#4e7a3d]" />
            <div className="absolute inset-y-0 left-[33%] w-[4.5%] bg-[#2d6e99]" />
            <div className="absolute left-[32.5%] top-[42%] w-[5.5%] h-[9%] bg-[#a36f40]" />
            <div className="absolute inset-y-0 left-[37.5%] w-[33.5%] bg-[#366134]" />
            <div className="absolute inset-y-0 left-[71%] w-[29%] bg-[#495154]" />

            {/* World Markers */}
            {hud.minimap.markers.map((m, idx) => {
              const leftPct = (m.x / MAP_WIDTH) * 100;
              const topPct = (m.y / MAP_HEIGHT) * 100;
              const color =
                m.kind === 'boss'
                  ? '#ff5247'
                  : m.kind === 'elder'
                    ? '#78f593'
                    : m.kind === 'merchant'
                      ? '#ffd452'
                      : m.kind === 'shrine'
                        ? m.done
                          ? '#598268'
                          : '#47d1ff'
                        : m.done
                          ? '#756b58'
                          : '#f5b841';
              return (
                <span
                  key={idx}
                  className="absolute rounded-full"
                  style={{
                    left: `${leftPct}%`,
                    top: `${topPct}%`,
                    width: m.kind === 'boss' ? 7 : 5,
                    height: m.kind === 'boss' ? 7 : 5,
                    transform: 'translate(-50%, -50%)',
                    backgroundColor: color,
                  }}
                />
              );
            })}

            {/* Player Dot */}
            <span
              className="absolute w-2.5 h-2.5 rounded-full bg-white border border-[#221712]"
              style={{
                left: `${(hud.minimap.playerTileX / MAP_WIDTH) * 100}%`,
                top: `${(hud.minimap.playerTileY / MAP_HEIGHT) * 100}%`,
                transform: 'translate(-50%, -50%)',
              }}
            />
          </div>
          <div className="flex items-center justify-between text-[9px] font-mono-num text-[#cbb896] mt-1 px-0.5">
            <span>Camp</span>
            <span>Woods</span>
            <span>Ruins</span>
          </div>
        </div>
      </div>
    </div>
  );
}
