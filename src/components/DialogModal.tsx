import { useState } from 'react';
import { ITEMS, MERCHANT_BARGAINS, SHOP_STOCK } from '../data/contentData';
import { VOCAB_MAP } from '../data/vocabData';
import { audioManager } from '../engine/audio';
import { DialogPayload } from '../types/game';

interface DialogModalProps {
  payload: DialogPayload;
  hintMode: 'EN' | 'EN_VI';
  coins: number;
  getItemIconUrl: (itemId: string) => string;
  onToggleHintMode: () => void;
  onBuySeed: (itemId: string, discounted?: boolean) => { success: boolean; messageEn: string };
  onMerchantBargain: (bargainId: string, correct: boolean) => void;
  onUnlockGate: () => boolean;
  onClose: () => void;
}

export function DialogModal({
  payload,
  hintMode,
  coins,
  getItemIconUrl,
  onToggleHintMode,
  onBuySeed,
  onMerchantBargain,
  onUnlockGate,
  onClose,
}: DialogModalProps) {
  const [shopNotice, setShopNotice] = useState<string | null>(null);
  const [discountUnlocked, setDiscountUnlocked] = useState<boolean>(
    Boolean(payload.merchantDiscountActive)
  );
  const [bargainReply, setBargainReply] = useState<{ en: string; vi: string; ok: boolean } | null>(null);

  const bargain =
    payload.kind === 'merchant' && payload.merchantBargainId
      ? MERCHANT_BARGAINS.find((b) => b.id === payload.merchantBargainId) || MERCHANT_BARGAINS[0]
      : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={payload.speakerEn}
      className="fixed inset-0 z-30 flex items-center justify-center bg-[#0f0b08]/75 p-4"
    >
      <div className="panel-parchment rounded-lg max-w-xl w-full p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-[#cbb58c] pb-3 mb-4">
          <div>
            <h2 className="font-display text-xl font-bold text-[#2c2118]">{payload.speakerEn}</h2>
            {hintMode === 'EN_VI' && (
              <p className="text-xs font-medium text-[#6e563d] mt-0.5">{payload.speakerVi}</p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => audioManager.speakEnglish(payload.textEn)}
              aria-label="Listen to English pronunciation"
              className="btn-wood-primary px-3 py-1.5 rounded text-xs font-bold whitespace-nowrap cursor-pointer"
            >
              🔊 Listen
            </button>
            <button
              type="button"
              onClick={onToggleHintMode}
              className="btn-wood-secondary px-2.5 py-1.5 rounded text-xs font-semibold whitespace-nowrap cursor-pointer"
            >
              {hintMode === 'EN_VI' ? 'EN + VI' : 'EN Only'}
            </button>
          </div>
        </div>

        {/* Quest completed banner */}
        {payload.questCompletedBanner && (
          <div className="mb-4 px-3.5 py-2.5 rounded bg-[#dff0d8] border border-[#7ca66d] text-[#244a1c] text-sm font-semibold">
            {payload.questCompletedBanner}
          </div>
        )}

        {/* English Primary Text */}
        <p className="text-base leading-relaxed text-[#241a12] font-medium mb-3">
          “{payload.textEn}”
        </p>

        {hintMode === 'EN_VI' && (
          <p className="text-sm leading-relaxed text-[#5c4734] bg-[#eadec4] border border-[#d1be96] rounded px-3.5 py-2.5 mb-4">
            {payload.textVi}
          </p>
        )}

        {/* Merchant Bram English Bargaining Challenge */}
        {payload.kind === 'merchant' && bargain && !discountUnlocked && (
          <div className="mb-4 p-3.5 rounded-md bg-[#e8eef2] border border-[#96b4c7]">
            <div className="text-[11px] font-bold tracking-wider text-[#225475] mb-1">
              ENGLISH BARGAINING CHALLENGE (UNLOCK 30% OFF)
            </div>
            <p className="text-sm font-semibold text-[#1d2e3b] mb-1">{bargain.promptEn}</p>
            {hintMode === 'EN_VI' && (
              <p className="text-xs text-[#435f73] mb-3">{bargain.promptVi}</p>
            )}

            <div className="space-y-2 mt-2">
              {bargain.options.map((opt) => (
                <button
                  key={opt.textEn}
                  type="button"
                  onClick={() => {
                    audioManager.speakEnglish(opt.textEn);
                    setBargainReply({ en: opt.replyEn, vi: opt.replyVi, ok: opt.correct });
                    onMerchantBargain(bargain.id, opt.correct);
                    if (opt.correct) {
                      setDiscountUnlocked(true);
                    }
                  }}
                  className="btn-wood-secondary w-full px-3.5 py-2 rounded text-xs sm:text-sm font-semibold text-left cursor-pointer"
                >
                  “{opt.textEn}”
                </button>
              ))}
            </div>
          </div>
        )}

        {bargainReply && (
          <div
            className={`mb-4 px-3.5 py-2.5 rounded text-xs font-semibold border ${
              bargainReply.ok
                ? 'bg-[#dff0d8] border-[#7ca66d] text-[#244a1c]'
                : 'bg-[#f7dcd9] border-[#cf7b74] text-[#7a201a]'
            }`}
          >
            <div>Bram: “{bargainReply.en}”</div>
            {hintMode === 'EN_VI' && <div className="font-normal mt-0.5">{bargainReply.vi}</div>}
          </div>
        )}

        {/* Active quest reminder for Elder Mara */}
        {payload.activeQuestTextEn && (
          <div className="mb-4 px-3.5 py-2.5 rounded bg-[#ebe0c7] border border-[#c7b187]">
            <div className="text-[11px] font-bold tracking-wider text-[#8a4d19]">CURRENT OBJECTIVE</div>
            <p className="text-sm font-semibold text-[#2c2118] mt-0.5">{payload.activeQuestTextEn}</p>
            {hintMode === 'EN_VI' && payload.activeQuestTextVi && (
              <p className="text-xs text-[#634c36] mt-0.5">{payload.activeQuestTextVi}</p>
            )}
          </div>
        )}

        {/* Highlighted key words saved to Lexicon */}
        {payload.vocabIds && payload.vocabIds.length > 0 && (
          <div className="mb-4 pt-2 border-t border-[#d8c49e]">
            <div className="text-xs font-semibold text-[#6e563d] mb-2">
              Words saved to your Lexicon Notebook (click to hear):
            </div>
            <div className="flex flex-wrap gap-2">
              {payload.vocabIds.map((vid) => {
                const entry = VOCAB_MAP[vid];
                if (!entry) return null;
                return (
                  <button
                    key={vid}
                    type="button"
                    onClick={() => audioManager.speakEnglish(entry.word)}
                    className="px-2.5 py-1 rounded bg-[#e8dab8] hover:bg-[#dec999] border border-[#bba273] text-xs font-semibold text-[#2c2118] cursor-pointer"
                  >
                    🔊 {entry.word} <span className="font-mono-num text-[#7a5a32]">{entry.ipa}</span>
                    {hintMode === 'EN_VI' ? ` — ${entry.meaningVi}` : ''}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Elder Mara / Merchant Bram Seed Shop */}
        {payload.canBuySeeds && (
          <div className="mb-5 pt-3 border-t border-[#cbb58c]">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-display text-base font-bold text-[#2c2118]">
                {payload.kind === 'merchant' ? 'Merchant Bram’s Travel Pack' : 'Elder Mara’s Seed Pouch'}
                {payload.kind === 'merchant' && discountUnlocked && (
                  <span className="ml-2 text-xs font-sans font-bold text-[#286624]">(30% OFF!)</span>
                )}
              </h3>
              <span className="font-mono-num text-sm font-bold text-[#8a4d19]">Your Coins: {coins}g</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SHOP_STOCK.map((itemId) => {
                const def = ITEMS[itemId];
                if (!def || !def.price) return null;
                const isDiscounted = payload.kind === 'merchant' && discountUnlocked;
                const price = isDiscounted ? Math.max(1, Math.round(def.price * 0.7)) : def.price;
                const affordable = coins >= price;
                return (
                  <div
                    key={itemId}
                    className="flex items-center justify-between gap-2 bg-[#ebe0c7] border border-[#c7b187] rounded px-2.5 py-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={getItemIconUrl(itemId)}
                        alt=""
                        className="w-7 h-7 pixel-canvas rounded bg-[#d9c7a3] p-0.5 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-[#2c2118] truncate">{def.name}</div>
                        <div className="text-[11px] text-[#634c36] truncate">
                          {hintMode === 'EN_VI' ? def.nameVi : def.descriptionEn}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={!affordable}
                      onClick={() => {
                        const res = onBuySeed(itemId, isDiscounted);
                        setShopNotice(res.messageEn);
                      }}
                      className={`px-3 py-1.5 rounded text-xs font-bold font-mono-num whitespace-nowrap shrink-0 ${
                        affordable
                          ? 'btn-wood-primary cursor-pointer'
                          : 'bg-[#c9baa0] text-[#7a6b55] cursor-not-allowed'
                      }`}
                    >
                      Buy {price}g
                    </button>
                  </div>
                );
              })}
            </div>
            {shopNotice && (
              <p className="text-xs font-semibold text-[#316b2d] mt-2" role="status">
                {shopNotice}
              </p>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {payload.canUnlockGate && (
            <button
              type="button"
              onClick={onUnlockGate}
              className="btn-wood-primary px-5 py-2.5 rounded-md text-sm font-bold cursor-pointer"
            >
              Unlock Gate with Iron Key
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="btn-wood-secondary px-5 py-2.5 rounded-md text-sm font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
