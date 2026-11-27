import { useState } from 'react';
import { GEAR_UPGRADES, ITEMS, RECIPES } from '../data/contentData';
import { audioManager } from '../engine/audio';
import { canCraftRecipe, getUpgradeLevel } from '../engine/rules';
import { GearUpgradeDefinition, PlayerUpgrades } from '../types/game';

interface CraftingModalProps {
  initialTab: 'cook' | 'bag' | 'forge';
  inventory: Record<string, number>;
  coins: number;
  upgrades: PlayerUpgrades;
  hintMode: 'EN' | 'EN_VI';
  getItemIconUrl: (itemId: string) => string;
  onCraft: (recipeId: string) => { success: boolean; messageEn: string };
  onPurchaseUpgrade: (upgrade: GearUpgradeDefinition) => { success: boolean; messageEn: string };
  onConsumeItem: (itemId: string) => { used: boolean; messageEn: string };
  onClose: () => void;
}

export function CraftingModal({
  initialTab,
  inventory,
  coins,
  upgrades,
  hintMode,
  getItemIconUrl,
  onCraft,
  onPurchaseUpgrade,
  onConsumeItem,
  onClose,
}: CraftingModalProps) {
  const [tab, setTab] = useState<'cook' | 'bag' | 'forge'>(initialTab);
  const [feedback, setFeedback] = useState<string | null>(null);

  const ownedItems = Object.entries(inventory).filter(([, qty]) => qty > 0);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={tab === 'cook' ? 'Cooking Pot' : tab === 'forge' ? 'Gear Forge' : 'Inventory Bag'}
      className="fixed inset-0 z-30 flex items-center justify-center bg-[#0f0b08]/75 p-4"
    >
      <div className="panel-parchment rounded-lg max-w-2xl w-full p-6 max-h-[88vh] flex flex-col">
        {/* Header & Interactive Tab Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#cbb58c] pb-3 mb-4">
          <div className="flex items-center gap-1 p-1 bg-[#e3d3b1] rounded-md border border-[#bfa67a]">
            <button
              type="button"
              onClick={() => setTab('cook')}
              className={`px-3.5 py-1.5 rounded text-xs sm:text-sm font-bold cursor-pointer whitespace-nowrap ${
                tab === 'cook' ? 'bg-[#4a3525] text-[#fff6df]' : 'text-[#4a3525] hover:bg-[#d8c49b]'
              }`}
            >
              Cooking Pot
            </button>
            <button
              type="button"
              onClick={() => setTab('forge')}
              className={`px-3.5 py-1.5 rounded text-xs sm:text-sm font-bold cursor-pointer whitespace-nowrap ${
                tab === 'forge' ? 'bg-[#4a3525] text-[#fff6df]' : 'text-[#4a3525] hover:bg-[#d8c49b]'
              }`}
            >
              Gear Forge
            </button>
            <button
              type="button"
              onClick={() => setTab('bag')}
              className={`px-3.5 py-1.5 rounded text-xs sm:text-sm font-bold cursor-pointer whitespace-nowrap ${
                tab === 'bag' ? 'bg-[#4a3525] text-[#fff6df]' : 'text-[#4a3525] hover:bg-[#d8c49b]'
              }`}
            >
              Inventory Bag ({ownedItems.length})
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-mono-num text-xs font-bold text-[#8a4d19]">{coins}g</span>
            <button
              type="button"
              onClick={onClose}
              className="btn-wood-secondary px-4 py-1.5 rounded text-sm font-semibold cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

        {feedback && (
          <div
            role="status"
            className="mb-3 px-3.5 py-2 rounded bg-[#dff0d8] border border-[#7ca66d] text-[#244a1c] text-sm font-semibold"
          >
            {feedback}
          </div>
        )}

        {/* Tab Body */}
        <div className="overflow-y-auto flex-1 space-y-3 pr-1">
          {tab === 'cook' &&
            RECIPES.map((recipe) => {
              const ready = canCraftRecipe(recipe, inventory);
              return (
                <div
                  key={recipe.id}
                  className="bg-[#ebe0c7] border border-[#c7b187] rounded-md p-4 flex flex-col gap-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <img
                        src={getItemIconUrl(recipe.resultItemId)}
                        alt=""
                        className="w-10 h-10 pixel-canvas rounded bg-[#d9c7a3] p-1 border border-[#b59c6e] shrink-0"
                      />
                      <div>
                        <h3 className="font-display text-lg font-bold text-[#2c2118]">
                          {recipe.titleEn}
                          {hintMode === 'EN_VI' && (
                            <span className="font-sans text-xs font-medium text-[#6e563d] ml-2">
                              ({recipe.titleVi})
                            </span>
                          )}
                        </h3>
                        <p className="text-sm text-[#2c2118] font-medium mt-0.5">
                          “{recipe.instructionEn}”
                        </p>
                        {hintMode === 'EN_VI' && (
                          <p className="text-xs text-[#634c36] mt-0.5">{recipe.instructionVi}</p>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => audioManager.speakEnglish(recipe.instructionEn)}
                      aria-label={`Listen to ${recipe.titleEn} recipe`}
                      className="btn-wood-secondary px-3 py-1.5 rounded text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      🔊 Listen
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#d6c29b]">
                    <div className="flex flex-wrap items-center gap-3 text-xs font-mono-num">
                      {recipe.ingredients.map((ing) => {
                        const have = inventory[ing.itemId] || 0;
                        const itemDef = ITEMS[ing.itemId];
                        const ok = have >= ing.qty;
                        return (
                          <span
                            key={ing.itemId}
                            className={ok ? 'text-[#286624] font-bold' : 'text-[#9e3129] font-bold'}
                          >
                            {itemDef?.name || ing.itemId}: {have}/{ing.qty}
                          </span>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      disabled={!ready}
                      onClick={() => {
                        const res = onCraft(recipe.id);
                        setFeedback(res.messageEn);
                      }}
                      className={`px-4 py-2 rounded text-xs font-bold whitespace-nowrap ${
                        ready
                          ? 'btn-wood-primary cursor-pointer'
                          : 'bg-[#c9baa0] text-[#7a6b55] cursor-not-allowed'
                      }`}
                    >
                      Cook {recipe.titleEn}
                    </button>
                  </div>
                </div>
              );
            })}

          {tab === 'forge' && (
            <div className="space-y-3">
              <div className="bg-[#e3d3b1] border border-[#bfa67a] rounded px-3.5 py-2 text-xs text-[#4a3525] flex flex-wrap items-center justify-between gap-2">
                <span>
                  Defeat monsters & solve Echo Shrines / Puzzles to earn <strong>Slime Gel</strong>,{' '}
                  <strong>Forest Fangs</strong> & <strong>Rune Shards</strong>.
                </span>
                <span className="font-mono-num font-bold text-[#7a4518]">
                  Sword Lv.{upgrades.swordLevel} · Can Lv.{upgrades.wateringCanLevel} · Boots Lv.{upgrades.bootsLevel}
                </span>
              </div>

              {GEAR_UPGRADES.map((up) => {
                const currentLv = getUpgradeLevel(upgrades, up.id);
                const alreadyOwned = currentLv >= up.targetLevel;
                const lockedByPrev = currentLv < up.targetLevel - 1;
                const ready =
                  currentLv === up.targetLevel - 1 &&
                  coins >= up.costCoins &&
                  up.ingredients.every((ing) => (inventory[ing.itemId] || 0) >= ing.qty);
                return (
                  <div
                    key={`${up.id}_${up.targetLevel}`}
                    className={`rounded-md p-4 border flex flex-col gap-2 ${
                      alreadyOwned
                        ? 'bg-[#e1ecd8] border-[#8eb37d]'
                        : 'bg-[#ebe0c7] border-[#c7b187]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <img
                          src={getItemIconUrl(up.id)}
                          alt=""
                          className="w-10 h-10 pixel-canvas rounded bg-[#d9c7a3] p-1 border border-[#b59c6e] shrink-0"
                        />
                        <div>
                          <h3 className="font-display text-lg font-bold text-[#2c2118]">
                            {up.titleEn}
                            {hintMode === 'EN_VI' && (
                              <span className="font-sans text-xs font-medium text-[#6e563d] ml-2">
                                ({up.titleVi})
                              </span>
                            )}
                          </h3>
                          <p className="text-sm text-[#2c2118] mt-0.5">{up.descriptionEn}</p>
                          {hintMode === 'EN_VI' && (
                            <p className="text-xs text-[#634c36] mt-0.5">{up.descriptionVi}</p>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => audioManager.speakEnglish(`${up.titleEn}. ${up.descriptionEn}`)}
                        aria-label={`Listen to ${up.titleEn}`}
                        className="btn-wood-secondary px-2.5 py-1 rounded text-xs font-bold shrink-0 cursor-pointer"
                      >
                        🔊
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#d6c29b]">
                      <div className="flex flex-wrap items-center gap-3 text-xs font-mono-num">
                        <span className={coins >= up.costCoins ? 'text-[#286624] font-bold' : 'text-[#9e3129] font-bold'}>
                          Coins: {coins}/{up.costCoins}g
                        </span>
                        {up.ingredients.map((ing) => {
                          const have = inventory[ing.itemId] || 0;
                          const def = ITEMS[ing.itemId];
                          const ok = have >= ing.qty;
                          return (
                            <span
                              key={ing.itemId}
                              className={ok ? 'text-[#286624] font-bold' : 'text-[#9e3129] font-bold'}
                            >
                              {def?.name || ing.itemId}: {have}/{ing.qty}
                            </span>
                          );
                        })}
                      </div>

                      {alreadyOwned ? (
                        <span className="text-xs font-bold text-[#286624]">✓ Forged</span>
                      ) : (
                        <button
                          type="button"
                          disabled={!ready}
                          onClick={() => {
                            const res = onPurchaseUpgrade(up);
                            setFeedback(res.messageEn);
                          }}
                          className={`px-4 py-2 rounded text-xs font-bold whitespace-nowrap ${
                            ready
                              ? 'btn-wood-primary cursor-pointer'
                              : 'bg-[#c9baa0] text-[#7a6b55] cursor-not-allowed'
                          }`}
                        >
                          {lockedByPrev ? 'Requires Previous Level' : `Forge (${up.costCoins}g)`}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {tab === 'bag' &&
            (ownedItems.length === 0 ? (
              <div className="text-center py-10 text-sm text-[#6e563d]">
                Your travel bag is empty. Harvest crops or open supply chests to gather items!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ownedItems.map(([itemId, qty]) => {
                  const def = ITEMS[itemId];
                  if (!def) return null;
                  const edible = def.category === 'food' || def.category === 'crop';
                  return (
                    <div
                      key={itemId}
                      className="bg-[#ebe0c7] border border-[#c7b187] rounded-md p-3.5 flex flex-col justify-between gap-2"
                    >
                      <div className="flex items-start gap-2.5">
                        <img
                          src={getItemIconUrl(itemId)}
                          alt=""
                          className="w-9 h-9 pixel-canvas rounded bg-[#d9c7a3] p-1 border border-[#b59c6e] shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-sm text-[#2c2118] truncate">{def.name}</span>
                            <span className="font-mono-num text-sm font-bold text-[#8a4d19]">x{qty}</span>
                          </div>
                          {hintMode === 'EN_VI' && (
                            <div className="text-xs font-medium text-[#6e563d]">{def.nameVi}</div>
                          )}
                          <p className="text-xs text-[#4a3827] mt-1">{def.descriptionEn}</p>
                          {hintMode === 'EN_VI' && (
                            <p className="text-[11px] text-[#735c44] mt-0.5">{def.descriptionVi}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-[#d6c29b]">
                        <button
                          type="button"
                          onClick={() => audioManager.speakEnglish(def.name)}
                          aria-label={`Pronounce ${def.name}`}
                          className="text-xs font-semibold text-[#6e4621] hover:text-[#2c2118] cursor-pointer"
                        >
                          🔊 {def.name}
                        </button>

                        {edible && (
                          <button
                            type="button"
                            onClick={() => {
                              const res = onConsumeItem(itemId);
                              setFeedback(res.messageEn);
                            }}
                            className="btn-wood-primary px-3 py-1 rounded text-xs font-bold cursor-pointer"
                          >
                            Eat / Use
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
