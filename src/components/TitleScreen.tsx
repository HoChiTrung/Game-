import { useState } from 'react';

interface TitleScreenProps {
  hasSave: boolean;
  onStartNew: () => void;
  onContinue: () => void;
  onResetSave: () => void;
}

export function TitleScreen({
  hasSave,
  onStartNew,
  onContinue,
  onResetSave,
}: TitleScreenProps) {
  const [confirmingReset, setConfirmingReset] = useState(false);

  return (
    <div className="fixed inset-0 z-20 flex flex-col justify-between p-6 md:p-10 pointer-events-none">
      {/* Measured contrast scrim on the left/lower region over live panning pixel world */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 28% 46%, rgba(20, 15, 11, 0.78) 0%, rgba(20, 15, 11, 0.45) 52%, rgba(12, 9, 7, 0.72) 100%)',
        }}
      />

      {/* Main Focal Lockup & Actions */}
      <div className="relative z-10 flex-1 flex flex-col justify-center max-w-xl pl-2 md:pl-10">
        {/* Bespoke inline SVG Title Crest Lockup */}
        <div className="mb-6">
          <svg
            viewBox="0 0 540 164"
            className="w-full max-w-[460px] h-auto overflow-visible"
            role="img"
            aria-label="Lexicon Isle"
          >
            {/* Carved wood & parchment crest plaque behind title */}
            <defs>
              <filter id="titleShadow" x="-10%" y="-10%" width="120%" height="130%">
                <feDropShadow dx="0" dy="6" stdDeviation="4" floodColor="#100a06" floodOpacity="0.82" />
              </filter>
            </defs>
            <g filter="url(#titleShadow)">
              {/* Compass & open lexicon emblem */}
              <polygon
                points="52,18 60,34 78,34 64,45 69,62 52,52 35,62 40,45 26,34 44,34"
                fill="#e5a93c"
                stroke="#3b2210"
                strokeWidth="3"
              />
              <circle cx="52" cy="42" r="7" fill="#58c4ff" stroke="#1e2d3b" strokeWidth="2.5" />
              {/* Ribbon rule */}
              <path d="M90 42 H480" stroke="#c99b52" strokeWidth="2.5" strokeDasharray="6 6" opacity="0.8" />
              <text
                x="92"
                y="32"
                fill="#e8d4ad"
                fontFamily="Plus Jakarta Sans, sans-serif"
                fontSize="13"
                fontWeight="700"
                letterSpacing="3"
              >
                CHIBI ENGLISH ADVENTURE RPG
              </text>

              {/* Main Display Title */}
              <text
                x="24"
                y="116"
                fill="#fff6df"
                stroke="#2c1c11"
                strokeWidth="9"
                paintOrder="stroke fill"
                fontFamily="Fraunces, Georgia, serif"
                fontSize="68"
                fontWeight="800"
                letterSpacing="-1"
              >
                Lexicon Isle
              </text>

              {/* Subtle carved underline with rune diamonds */}
              <path d="M28 136 H420" stroke="#e5a93c" strokeWidth="3.5" />
              <polygon points="434,136 442,128 450,136 442,144" fill="#58c4ff" stroke="#241911" strokeWidth="2" />
              <polygon points="458,136 464,130 470,136 464,142" fill="#e5a93c" stroke="#241911" strokeWidth="2" />
            </g>
          </svg>
        </div>

        {/* Action Buttons (<= 3 primary actions) */}
        <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 pointer-events-auto">
          <button
            type="button"
            data-start="true"
            onClick={(e) => {
              e.currentTarget.blur();
              onStartNew();
            }}
            className="btn-wood-primary px-7 py-3.5 rounded-md font-display text-lg font-bold tracking-tight whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffd97a]"
          >
            Start Adventure
          </button>

          <button
            type="button"
            disabled={!hasSave}
            onClick={(e) => {
              e.currentTarget.blur();
              onContinue();
            }}
            className={`btn-wood-secondary px-6 py-3.5 rounded-md font-semibold text-base whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffd97a] ${
              hasSave ? 'cursor-pointer' : 'opacity-45 cursor-not-allowed'
            }`}
          >
            Continue
          </button>

          {hasSave && !confirmingReset && (
            <button
              type="button"
              onClick={() => setConfirmingReset(true)}
              className="px-4 py-3.5 rounded-md text-sm font-semibold text-[#e6c4a0] hover:text-[#ff9b8f] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Reset Save
            </button>
          )}
        </div>

        {/* Inline Reset Confirmation (no window.confirm) */}
        {confirmingReset && (
          <div className="mt-4 panel-wood p-4 rounded-md max-w-md pointer-events-auto">
            <p className="text-sm text-[#f5ecd7] mb-3">
              Erase your saved island progress, garden, and vocabulary notebook?
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  onResetSave();
                  setConfirmingReset(false);
                }}
                className="px-4 py-2 rounded bg-[#b8372e] hover:bg-[#cf4238] text-white text-sm font-semibold cursor-pointer whitespace-nowrap"
              >
                Confirm Reset
              </button>
              <button
                type="button"
                onClick={() => setConfirmingReset(false)}
                className="btn-wood-secondary px-4 py-2 rounded text-sm font-semibold cursor-pointer whitespace-nowrap"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Single flat borderless control-hint line in bottom safe margin */}
      <div className="relative z-10 text-xs sm:text-sm text-[#e6d8be] tracking-wide font-medium">
        WASD Move · Shift Dash · E Interact · Space Sword · J/K/L Word Strike · Q Surge · L Lexicon · I Bag
      </div>
    </div>
  );
}
