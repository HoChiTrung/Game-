import { VictoryStats } from '../types/game';

interface PauseModalProps {
  onResume: () => void;
  onSaveNow: () => void;
  onRestart: () => void;
  onTitle: () => void;
}

export function PauseModal({ onResume, onSaveNow, onRestart, onTitle }: PauseModalProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Game Paused"
      className="fixed inset-0 z-40 flex items-center justify-center bg-[#0f0b08]/75 p-4"
    >
      <div className="panel-parchment rounded-lg max-w-md w-full p-6 text-center">
        <h2 className="font-display text-2xl font-bold text-[#2c2118] mb-1">Adventure Paused</h2>
        <p className="text-sm text-[#5c4835] mb-6">
          Your world stands still. Take a breath or adjust your journey.
        </p>

        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onResume}
            className="btn-wood-primary w-full py-3 rounded-md font-semibold text-base cursor-pointer"
          >
            Resume Adventure
          </button>
          <button
            type="button"
            onClick={onSaveNow}
            className="btn-wood-secondary w-full py-2.5 rounded-md font-semibold text-sm cursor-pointer"
          >
            Save Progress Now
          </button>
          <button
            type="button"
            onClick={onRestart}
            className="btn-wood-secondary w-full py-2.5 rounded-md font-semibold text-sm cursor-pointer"
          >
            Start Fresh Island
          </button>
          <button
            type="button"
            onClick={onTitle}
            className="w-full py-2 text-sm font-semibold text-[#6b4829] hover:text-[#2c2118] cursor-pointer"
          >
            Return to Title Screen
          </button>
        </div>
      </div>
    </div>
  );
}

interface VictoryModalProps {
  stats: VictoryStats;
  onContinueExploring: () => void;
  onPlayAgain: () => void;
}

export function VictoryModal({
  stats,
  onContinueExploring,
  onPlayAgain,
}: VictoryModalProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Victory — Lexicon Master"
      className="fixed inset-0 z-40 flex items-center justify-center bg-[#0f0b08]/80 p-4"
    >
      <div className="panel-parchment rounded-lg max-w-lg w-full p-7 text-center">
        <div className="mx-auto w-16 h-16 mb-3 flex items-center justify-center">
          <svg viewBox="0 0 64 64" className="w-16 h-16" aria-hidden="true">
            <polygon
              points="32,4 40,22 60,24 45,37 49,57 32,47 15,57 19,37 4,24 24,22"
              fill="#e6a82e"
              stroke="#4a2c12"
              strokeWidth="3"
            />
            <circle cx="32" cy="32" r="9" fill="#58c4ff" stroke="#1e2d3b" strokeWidth="2.5" />
          </svg>
        </div>

        <div className="text-xs font-bold tracking-widest text-[#8f511c]">BADGE UNLOCKED · LEXICON MASTER</div>
        <h2 className="font-display text-3xl font-bold text-[#2c2118] mt-1 mb-2">
          The Ancient Seal Is Broken!
        </h2>
        <p className="text-sm text-[#574432] mb-6">
          You defeated the Stone Guardian by mastering the English clues and spoken commands of Lexicon Isle.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-6">
          <div className="bg-[#e8dab8] border border-[#b59c6e] rounded p-3">
            <div className="text-[11px] font-semibold text-[#6b533b]">Days</div>
            <div className="font-mono-num text-xl font-bold text-[#2c2118] mt-1">
              {stats.daysSurvived}
            </div>
          </div>
          <div className="bg-[#e8dab8] border border-[#b59c6e] rounded p-3">
            <div className="text-[11px] font-semibold text-[#6b533b]">Words</div>
            <div className="font-mono-num text-xl font-bold text-[#2c2118] mt-1">
              {stats.wordsDiscovered}/{stats.totalWords}
            </div>
          </div>
          <div className="bg-[#e8dab8] border border-[#b59c6e] rounded p-3">
            <div className="text-[11px] font-semibold text-[#6b533b]">Puzzles</div>
            <div className="font-mono-num text-xl font-bold text-[#2c2118] mt-1">
              {stats.challengesSolved}
            </div>
          </div>
          <div className="bg-[#e8dab8] border border-[#b59c6e] rounded p-3">
            <div className="text-[11px] font-semibold text-[#6b533b]">Best Combo</div>
            <div className="font-mono-num text-xl font-bold text-[#2c2118] mt-1">
              x{stats.bestWordCombo}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={onContinueExploring}
            className="btn-wood-primary flex-1 py-3 rounded-md font-semibold text-sm cursor-pointer"
          >
            Continue Exploring
          </button>
          <button
            type="button"
            data-start="true"
            onClick={onPlayAgain}
            className="btn-wood-secondary flex-1 py-3 rounded-md font-semibold text-sm cursor-pointer"
          >
            Play Again
          </button>
        </div>
      </div>
    </div>
  );
}
