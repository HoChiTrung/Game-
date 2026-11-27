import { useMemo, useState } from 'react';
import { VOCAB_LIST, VOCAB_MAP } from '../data/vocabData';
import { audioManager } from '../engine/audio';
import { buildWordStrikeOptions } from '../engine/rules';
import { UserVocabProgress } from '../types/game';

interface CampfireModalProps {
  day: number;
  todayEncounteredIds: string[];
  vocabProgress: Record<string, UserVocabProgress>;
  onCompleteSleep: (reviewedIds: string[], grantWellRested: boolean) => void;
  onClose: () => void;
}

export function CampfireModal({
  day,
  todayEncounteredIds,
  vocabProgress,
  onCompleteSleep,
  onClose,
}: CampfireModalProps) {
  const reviewList = useMemo(() => {
    const pool = todayEncounteredIds.filter((id) => Boolean(VOCAB_MAP[id]));
    const discovered = Object.values(vocabProgress)
      .filter((v) => v.discovered && !pool.includes(v.vocabId))
      .map((v) => v.vocabId);
    const combined = [...pool, ...discovered, 'sunshine', 'water', 'seed'];
    const unique = Array.from(new Set(combined)).slice(0, 3);
    return unique.map((id, idx) => ({
      entry: VOCAB_MAP[id] || VOCAB_LIST[idx],
      options: buildWordStrikeOptions(id, day + idx * 3),
    }));
  }, [day, todayEncounteredIds, vocabProgress]);

  const [step, setStep] = useState(0);
  const [correctIds, setCorrectIds] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);

  const current = reviewList[step];

  const handleAnswer = (correct: boolean) => {
    if (!current) return;
    if (correct) {
      audioManager.playSfx('harvest');
      setCorrectIds((prev) => [...prev, current.entry.id]);
      setFeedback(`Correct! "${current.entry.word}" = ${current.entry.meaningVi}`);
    } else {
      audioManager.playSfx('error');
      setFeedback(`Good try! "${current.entry.word}" means "${current.entry.meaningVi}".`);
    }

    if (step + 1 >= reviewList.length) {
      setFinished(true);
    } else {
      setStep((s) => s + 1);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Campfire Evening Review"
      className="fixed inset-0 z-30 flex items-center justify-center bg-[#0f0b08]/80 p-4"
    >
      <div className="panel-parchment rounded-lg max-w-lg w-full p-6">
        <div className="flex items-start justify-between gap-3 border-b border-[#cbb58c] pb-3 mb-4">
          <div>
            <div className="text-[11px] font-bold tracking-wider text-[#8a4d19]">
              END OF DAY {day} · CAMPFIRE REVIEW
            </div>
            <h2 className="font-display text-2xl font-bold text-[#2c2118]">
              Rest & Review 3 Words
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-[#6e563d] hover:text-[#2c2118] cursor-pointer"
          >
            Stay Awake
          </button>
        </div>

        <p className="text-sm text-[#4f3d2b] mb-4">
          Review 3 words from your journey to earn mastery stars and wake up{' '}
          <span className="font-bold text-[#286624]">Well Rested (+20% Speed & +25% XP)</span>{' '}
          tomorrow.
        </p>

        {feedback && (
          <div className="mb-3 px-3.5 py-2 rounded bg-[#ebe0c7] border border-[#c7b187] text-xs font-semibold text-[#2c2118]">
            {feedback}
          </div>
        )}

        {!finished && current ? (
          <div className="bg-[#ebe0c7] border border-[#c7b187] rounded-md p-4 mb-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono-num font-bold text-[#7a5b3c]">
                Word {step + 1} of {reviewList.length}
              </span>
              <button
                type="button"
                onClick={() => audioManager.speakEnglish(current.entry.word)}
                className="btn-wood-primary px-3 py-1 rounded text-xs font-bold cursor-pointer"
              >
                🔊 Pronounce
              </button>
            </div>

            <div className="font-display text-2xl font-bold text-[#2c2118] text-center mb-1">
              {current.entry.word}
            </div>
            <p className="text-xs text-[#634c36] italic text-center mb-4">
              “{current.entry.exampleSentence}”
            </p>

            <div className="flex flex-col gap-2">
              {current.options.map((opt, idx) => (
                <button
                  key={`${current.entry.id}-${idx}`}
                  type="button"
                  onClick={() => handleAnswer(opt.correct)}
                  className="btn-wood-secondary py-2.5 px-4 rounded text-sm font-semibold text-left cursor-pointer"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-[#dff0d8] border border-[#7ca66d] rounded-md p-4 mb-5 text-center">
            <div className="font-display text-lg font-bold text-[#244a1c]">
              Review Complete! ({correctIds.length}/{reviewList.length} correct)
            </div>
            <p className="text-xs text-[#2d5924] mt-1">
              {correctIds.length >= 2
                ? 'You earned the Well Rested buff for tomorrow!'
                : 'Your words have been refreshed. Ready to sleep until dawn.'}
            </p>
          </div>
        )}

        <div className="flex items-center justify-between gap-3">
          {!finished ? (
            <button
              type="button"
              onClick={() => onCompleteSleep([], false)}
              className="btn-wood-secondary px-4 py-2.5 rounded text-xs font-semibold cursor-pointer"
            >
              Skip & Sleep Until Dawn
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onCompleteSleep(correctIds, correctIds.length >= 2)}
              className="btn-wood-primary w-full py-3 rounded-md text-sm font-bold cursor-pointer"
            >
              Sleep Until Day {day + 1}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
