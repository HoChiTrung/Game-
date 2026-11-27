import { useState } from 'react';
import { VOCAB_LIST } from '../data/vocabData';
import { audioManager } from '../engine/audio';
import { UserVocabProgress, ZoneId } from '../types/game';

interface LexiconModalProps {
  vocabProgress: Record<string, UserVocabProgress>;
  solvedChallengesCount: number;
  totalChallengesCount: number;
  hintMode: 'EN' | 'EN_VI';
  onClose: () => void;
}

export function LexiconModal({
  vocabProgress,
  solvedChallengesCount,
  totalChallengesCount,
  hintMode,
  onClose,
}: LexiconModalProps) {
  const [zoneFilter, setZoneFilter] = useState<'all' | ZoneId>('all');
  const [levelFilter, setLevelFilter] = useState<'all' | 'A1' | 'A2' | 'B1'>('all');
  const [showMeanings, setShowMeanings] = useState(hintMode === 'EN_VI');

  const discoveredTotal = Object.values(vocabProgress).filter((v) => v.discovered).length;
  const masteredTotal = Object.values(vocabProgress).filter((v) => v.masteryStars >= 3).length;

  const filtered = VOCAB_LIST.filter((entry) => {
    if (zoneFilter !== 'all' && entry.zone !== zoneFilter) return false;
    if (levelFilter !== 'all' && entry.level !== levelFilter) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const da = vocabProgress[a.id]?.discovered ? 1 : 0;
    const db = vocabProgress[b.id]?.discovered ? 1 : 0;
    return db - da;
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Lexicon Vocabulary Notebook"
      className="fixed inset-0 z-30 flex items-center justify-center bg-[#0f0b08]/75 p-4"
    >
      <div className="panel-parchment rounded-lg max-w-4xl w-full p-6 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#cbb58c] pb-3 mb-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-[#2c2118]">Lexicon Notebook</h2>
            <div className="text-xs text-[#634c36] font-mono-num mt-0.5">
              Discovered {discoveredTotal}/{VOCAB_LIST.length} · Mastered (3★) {masteredTotal} · Puzzles {solvedChallengesCount}/{totalChallengesCount}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowMeanings((prev) => !prev)}
              className="btn-wood-secondary px-3 py-1.5 rounded text-xs font-semibold cursor-pointer whitespace-nowrap"
            >
              {showMeanings ? 'Hide Vietnamese' : 'Show Vietnamese'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn-wood-primary px-4 py-1.5 rounded text-xs font-bold cursor-pointer whitespace-nowrap"
            >
              Close [L]
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-1 p-1 bg-[#e3d3b1] rounded-md border border-[#bfa67a]">
            {(['all', 'homestead', 'woods', 'ruins'] as const).map((z) => (
              <button
                key={z}
                type="button"
                onClick={() => setZoneFilter(z)}
                className={`px-3 py-1 rounded text-xs font-bold capitalize cursor-pointer whitespace-nowrap ${
                  zoneFilter === z ? 'bg-[#4a3525] text-[#fff6df]' : 'text-[#4a3525] hover:bg-[#d8c49b]'
                }`}
              >
                {z === 'all' ? 'All Zones' : z === 'woods' ? 'Whispering Woods' : z === 'ruins' ? 'Ancient Ruins' : 'Homestead'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 p-1 bg-[#e3d3b1] rounded-md border border-[#bfa67a]">
            {(['all', 'A1', 'A2', 'B1'] as const).map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setLevelFilter(lvl)}
                className={`px-3 py-1 rounded text-xs font-bold cursor-pointer whitespace-nowrap ${
                  levelFilter === lvl ? 'bg-[#4a3525] text-[#fff6df]' : 'text-[#4a3525] hover:bg-[#d8c49b]'
                }`}
              >
                {lvl === 'all' ? 'All Levels' : lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Cards Grid */}
        <div className="overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 pr-1">
          {sorted.map((entry) => {
            const prog = vocabProgress[entry.id];
            const discovered = prog?.discovered || false;
            const stars = prog?.masteryStars || 0;

            return (
              <div
                key={entry.id}
                className={`rounded-md p-3.5 border ${
                  discovered
                    ? 'bg-[#ebe0c7] border-[#c2ab80]'
                    : 'bg-[#e6dcc6]/65 border-[#d6c6a5] opacity-70'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-baseline flex-wrap gap-2">
                      <span className="font-display text-lg font-bold text-[#2c2118]">
                        {discovered ? entry.word : '?????'}
                      </span>
                      {discovered && entry.ipa && (
                        <span className="font-mono-num text-xs text-[#7a562d]">{entry.ipa}</span>
                      )}
                      <span className="text-xs text-[#6e563d]">
                        {entry.partOfSpeech} · {entry.level}
                      </span>
                    </div>
                    <div className="text-xs font-mono-num text-[#b57618] mt-0.5" aria-label={`${stars} of 3 mastery stars`}>
                      {'★'.repeat(stars)}
                      {'☆'.repeat(3 - stars)}
                    </div>
                  </div>

                  {discovered && (
                    <button
                      type="button"
                      onClick={() => audioManager.speakEnglish(entry.word)}
                      aria-label={`Pronounce ${entry.word}`}
                      className="btn-wood-secondary px-2.5 py-1 rounded text-xs font-bold cursor-pointer shrink-0"
                    >
                      🔊 Speak
                    </button>
                  )}
                </div>

                {discovered ? (
                  <>
                    <p className="text-xs text-[#3b2c1f] italic mt-2 leading-relaxed">
                      “{entry.exampleSentence}”
                    </p>
                    {showMeanings && (
                      <p className="text-xs font-semibold text-[#6e4621] mt-1.5">
                        Nghĩa: {entry.meaningVi}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-[#7a664f] mt-2">
                    Explore {entry.zone === 'homestead' ? 'Homestead' : entry.zone === 'woods' ? 'Whispering Woods' : 'Ancient Ruins'} to discover this word.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
