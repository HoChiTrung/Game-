import { useEffect, useMemo, useState } from 'react';
import {
  ECHO_SHRINES,
  ITEMS,
  PUZZLE_CHESTS,
  SENTENCE_PEDESTALS,
  SPELLING_RUNES,
  STATUE_RIDDLE,
} from '../data/contentData';
import { audioManager } from '../engine/audio';
import { checkSentenceOrder, checkSpellingWord } from '../engine/rules';

interface PuzzleModalProps {
  puzzleKind: 'chest' | 'statue' | 'echo' | 'spelling' | 'sentence';
  chestId?: string;
  challengeId?: string;
  hintMode: 'EN' | 'EN_VI';
  inventory: Record<string, number>;
  onSpendHintCost: () => boolean;
  onSolveChest: (chestId: string) => void;
  onSolveStatue: () => boolean;
  onSolveEchoShrine: (challengeId: string) => void;
  onSolveSpellingRune: (challengeId: string) => void;
  onSolveSentencePedestal: (challengeId: string) => void;
  onClose: () => void;
}

function deterministicShuffle<T>(items: T[], seedStr: string): T[] {
  const arr = [...items];
  let seed = 0;
  for (let i = 0; i < seedStr.length; i++) seed = (seed * 31 + seedStr.charCodeAt(i)) >>> 0;
  for (let i = arr.length - 1; i > 0; i--) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const j = seed % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  // Ensure order differs from original if length > 1
  if (arr.length > 1 && arr.every((v, idx) => v === items[idx])) {
    [arr[0], arr[1]] = [arr[1], arr[0]];
  }
  return arr;
}

export function PuzzleModal({
  puzzleKind,
  chestId,
  challengeId,
  hintMode,
  inventory,
  onSpendHintCost,
  onSolveChest,
  onSolveStatue,
  onSolveEchoShrine,
  onSolveSpellingRune,
  onSolveSentencePedestal,
  onClose,
}: PuzzleModalProps) {
  const [revealedVi, setRevealedVi] = useState(hintMode === 'EN_VI');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [solved, setSolved] = useState(false);

  // Echo Shrine transcript reveal toggle
  const [showTranscript, setShowTranscript] = useState(false);

  // Spelling Stone state
  const spellingChallenge = puzzleKind === 'spelling' && challengeId ? SPELLING_RUNES[challengeId] : null;
  const scrambledLetters = useMemo(() => {
    if (!spellingChallenge) return [];
    const letters = spellingChallenge.targetWord.split('').map((ch, idx) => ({ id: idx, ch }));
    return deterministicShuffle(letters, spellingChallenge.id);
  }, [spellingChallenge]);
  const [pickedLetterIds, setPickedLetterIds] = useState<number[]>([]);
  const [showPipHint, setShowPipHint] = useState(false);

  // Sentence Pedestal state
  const sentenceChallenge = puzzleKind === 'sentence' && challengeId ? SENTENCE_PEDESTALS[challengeId] : null;
  const shuffledTokens = useMemo(() => {
    if (!sentenceChallenge) return [];
    const tokens = sentenceChallenge.correctTokens.map((text, idx) => ({ id: idx, text }));
    return deterministicShuffle(tokens, sentenceChallenge.id);
  }, [sentenceChallenge]);
  const [pickedTokenIds, setPickedTokenIds] = useState<number[]>([]);

  // Auto-speak Echo Shrine audio once on open
  useEffect(() => {
    if (puzzleKind === 'echo' && challengeId) {
      const shrine = ECHO_SHRINES[challengeId];
      if (shrine) {
        audioManager.speakEnglish(shrine.spokenText, 0.92);
      }
    }
  }, [puzzleKind, challengeId]);

  // Allow keyboard typing inside Spelling Stone
  useEffect(() => {
    if (puzzleKind !== 'spelling' || !spellingChallenge || solved) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Backspace') {
        e.preventDefault();
        setPickedLetterIds((prev) => prev.slice(0, -1));
        setErrorMsg(null);
        return;
      }
      const upper = e.key.toUpperCase();
      if (/^[A-Z]$/.test(upper)) {
        setPickedLetterIds((prev) => {
          const match = scrambledLetters.find((item) => item.ch === upper && !prev.includes(item.id));
          if (!match) return prev;
          return [...prev, match.id];
        });
        setErrorMsg(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [puzzleKind, spellingChallenge, scrambledLetters, solved]);

  const showVi = hintMode === 'EN_VI' || revealedVi;

  // ================= 1. LISTENING ECHO SHRINE =================
  if (puzzleKind === 'echo' && challengeId) {
    const shrine = ECHO_SHRINES[challengeId];
    if (!shrine) return null;

    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-label={shrine.titleEn}
        className="fixed inset-0 z-30 flex items-center justify-center bg-[#0f0b08]/75 p-4"
      >
        <div className="panel-parchment rounded-lg max-w-lg w-full p-6">
          <div className="flex items-start justify-between gap-3 border-b border-[#cbb58c] pb-3 mb-4">
            <div>
              <div className="text-[11px] font-bold tracking-wider text-[#1e6a8f]">LISTENING ECHO SHRINE</div>
              <h2 className="font-display text-xl font-bold text-[#2c2118]">{shrine.titleEn}</h2>
              {showVi && <p className="text-xs text-[#634c36]">{shrine.titleVi}</p>}
            </div>
          </div>

          {/* Audio Playback Controls */}
          <div className="bg-[#e3edf2] border border-[#96bccf] rounded-md p-4 mb-4">
            <p className="text-sm font-semibold text-[#1c394a] mb-3">{shrine.questionEn}</p>
            {showVi && <p className="text-xs text-[#3b5d70] mb-3">{shrine.questionVi}</p>}

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => audioManager.speakEnglish(shrine.spokenText, 0.94)}
                className="btn-wood-primary px-4 py-2 rounded text-xs font-bold cursor-pointer"
              >
                🔊 Listen (Normal)
              </button>
              <button
                type="button"
                onClick={() => audioManager.speakEnglish(shrine.spokenText, 0.72)}
                className="btn-wood-secondary px-3.5 py-2 rounded text-xs font-bold cursor-pointer"
              >
                🐢 Slow (0.7x)
              </button>
              {!solved && !showTranscript && (
                <button
                  type="button"
                  onClick={() => setShowTranscript(true)}
                  className="text-xs font-semibold text-[#1e6a8f] hover:underline ml-auto cursor-pointer"
                >
                  🦉 Pip: Show Transcript
                </button>
              )}
            </div>

            {(showTranscript || solved) && (
              <div className="mt-3 pt-2.5 border-t border-[#b8d4e3] text-xs text-[#1d3442]">
                <div className="font-semibold italic">“{shrine.spokenText}”</div>
                {(showVi || solved) && <div className="text-[#4a6473] mt-0.5">{shrine.spokenMeaningVi}</div>}
              </div>
            )}
          </div>

          {errorMsg && (
            <div className="mb-3 px-3 py-2 rounded bg-[#f7dcd9] border border-[#cf7b74] text-[#7a201a] text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {solved ? (
            <div className="px-4 py-3 rounded bg-[#dff0d8] border border-[#7ca66d] text-[#244a1c] text-sm font-bold mb-4">
              Echo Shrine attuned! Earned +{shrine.rewardCoins} Coins, +{shrine.rewardXp} XP, Rune Shards & +20% Lexicon Surge!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-5">
              {shrine.options.map((opt) => (
                <button
                  key={opt.labelEn}
                  type="button"
                  onClick={() => {
                    if (opt.correct) {
                      setErrorMsg(null);
                      setSolved(true);
                      onSolveEchoShrine(shrine.id);
                    } else {
                      audioManager.playSfx('error');
                      setErrorMsg('Not quite! Tap Slow (0.7x) to listen to the Echo Shrine again.');
                    }
                  }}
                  className="btn-wood-secondary py-3 px-3.5 rounded-md font-bold text-sm text-left cursor-pointer"
                >
                  <div>{opt.labelEn}</div>
                  {showVi && <div className="text-[11px] font-normal text-[#d8c7a7] mt-0.5">{opt.labelVi}</div>}
                </button>
              ))}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className={
                solved
                  ? 'btn-wood-primary px-5 py-2 rounded text-sm font-bold cursor-pointer'
                  : 'btn-wood-secondary px-5 py-2 rounded text-sm font-semibold cursor-pointer'
              }
            >
              {solved ? 'Collect & Close' : 'Step Back'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ================= 2. SPELLING RUNE STONE =================
  if (puzzleKind === 'spelling' && spellingChallenge) {
    const builtWord = pickedLetterIds
      .map((id) => scrambledLetters.find((l) => l.id === id)?.ch || '')
      .join('');

    const handleCheckSpelling = () => {
      if (checkSpellingWord(builtWord, spellingChallenge.targetWord)) {
        setErrorMsg(null);
        setSolved(true);
        audioManager.speakEnglish(spellingChallenge.targetWord.toLowerCase());
        onSolveSpellingRune(spellingChallenge.id);
      } else {
        audioManager.playSfx('error');
        setErrorMsg(`"${builtWord || '...'}" is not the right spelling yet. Listen or ask Pip for a hint!`);
      }
    };

    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-label={spellingChallenge.titleEn}
        className="fixed inset-0 z-30 flex items-center justify-center bg-[#0f0b08]/75 p-4"
      >
        <div className="panel-parchment rounded-lg max-w-lg w-full p-6">
          <div className="flex items-start justify-between gap-3 border-b border-[#cbb58c] pb-3 mb-4">
            <div>
              <div className="text-[11px] font-bold tracking-wider text-[#9c5e14]">WORD SPELLING STONE</div>
              <h2 className="font-display text-xl font-bold text-[#2c2118]">{spellingChallenge.titleEn}</h2>
            </div>
            <button
              type="button"
              onClick={() => audioManager.speakEnglish(spellingChallenge.targetWord.toLowerCase(), 0.85)}
              aria-label="Hear target word pronunciation"
              className="btn-wood-primary px-3 py-1.5 rounded text-xs font-bold whitespace-nowrap cursor-pointer"
            >
              🔊 Hear Word
            </button>
          </div>

          <p className="text-sm font-semibold text-[#241a12] bg-[#ebe0c7] border border-[#c7b187] rounded p-3.5 mb-2">
            {spellingChallenge.clueEn}
          </p>
          {showVi && <p className="text-xs text-[#5c4734] mb-3">{spellingChallenge.clueVi}</p>}

          {/* Pip's Free Owl Hint */}
          <div className="mb-3">
            {showPipHint ? (
              <div className="text-xs font-semibold text-[#543a18] bg-[#f7ebd0] border border-[#d6b87c] rounded px-3 py-2">
                🦉 {spellingChallenge.pipHintEn}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowPipHint(true)}
                className="text-xs font-semibold text-[#8a4d19] hover:underline cursor-pointer"
              >
                🦉 Ask Pip the Owl for a free clue
              </button>
            )}
          </div>

          {/* Letter Answer Slots */}
          <div className="flex items-center justify-center gap-1.5 my-4">
            {spellingChallenge.targetWord.split('').map((_, idx) => {
              const letterId = pickedLetterIds[idx];
              const letterObj = scrambledLetters.find((l) => l.id === letterId);
              return (
                <button
                  key={idx}
                  type="button"
                  disabled={!letterObj || solved}
                  onClick={() => {
                    if (letterObj && !solved) {
                      setPickedLetterIds((prev) => prev.filter((id) => id !== letterObj.id));
                    }
                  }}
                  className={`w-10 h-11 rounded font-mono-num text-lg font-bold border-2 flex items-center justify-center ${
                    solved
                      ? 'bg-[#dff0d8] border-[#569447] text-[#1e4d16]'
                      : letterObj
                        ? 'bg-[#fff5dc] border-[#b57a2a] text-[#2c2118] cursor-pointer'
                        : 'bg-[#e3d4b5] border-[#bfa67a] text-[#9e8969]'
                  }`}
                >
                  {letterObj ? letterObj.ch : '_'}
                </button>
              );
            })}
          </div>

          {/* Scrambled Rune Tiles */}
          {!solved && (
            <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
              {scrambledLetters.map((item) => {
                const used = pickedLetterIds.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled={used}
                    onClick={() => {
                      audioManager.playSfx('click');
                      setPickedLetterIds((prev) => [...prev, item.id]);
                      setErrorMsg(null);
                    }}
                    className={`w-10 h-10 rounded font-mono-num text-base font-bold ${
                      used
                        ? 'bg-[#d4c6ab] text-[#a3947a] cursor-not-allowed'
                        : 'btn-wood-secondary cursor-pointer'
                    }`}
                  >
                    {item.ch}
                  </button>
                );
              })}
            </div>
          )}

          {errorMsg && (
            <div className="mb-3 px-3 py-2 rounded bg-[#f7dcd9] border border-[#cf7b74] text-[#7a201a] text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {solved ? (
            <div className="px-4 py-3 rounded bg-[#dff0d8] border border-[#7ca66d] text-[#244a1c] text-sm font-bold mb-4">
              Deciphered “{spellingChallenge.targetWord}”! Received +{spellingChallenge.rewardCoins} Coins, +{spellingChallenge.rewardXp} XP & Rune Shards.
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 mb-4">
              <button
                type="button"
                onClick={() => setPickedLetterIds([])}
                className="btn-wood-secondary px-3.5 py-2 rounded text-xs font-semibold cursor-pointer"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setPickedLetterIds((prev) => prev.slice(0, -1))}
                className="btn-wood-secondary px-3.5 py-2 rounded text-xs font-semibold cursor-pointer"
              >
                Backspace
              </button>
              <button
                type="button"
                onClick={handleCheckSpelling}
                className="btn-wood-primary px-5 py-2 rounded text-xs font-bold cursor-pointer"
              >
                Check Word
              </button>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="btn-wood-secondary px-5 py-2 rounded text-sm font-semibold cursor-pointer"
            >
              {solved ? 'Collect & Close' : 'Step Back'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ================= 3. SENTENCE SYNTAX PEDESTAL =================
  if (puzzleKind === 'sentence' && sentenceChallenge) {
    const arrangedTokens = pickedTokenIds.map(
      (id) => shuffledTokens.find((t) => t.id === id)?.text || ''
    );
    const fullSentence = sentenceChallenge.correctTokens.join(' ');

    const handleCheckSentence = () => {
      if (checkSentenceOrder(arrangedTokens, sentenceChallenge.correctTokens)) {
        setErrorMsg(null);
        setSolved(true);
        audioManager.speakEnglish(fullSentence);
        onSolveSentencePedestal(sentenceChallenge.id);
      } else {
        audioManager.playSfx('error');
        setErrorMsg('Check the English word order (Verb / Subject / Object) and try again!');
      }
    };

    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-label={sentenceChallenge.titleEn}
        className="fixed inset-0 z-30 flex items-center justify-center bg-[#0f0b08]/75 p-4"
      >
        <div className="panel-parchment rounded-lg max-w-xl w-full p-6">
          <div className="flex items-start justify-between gap-3 border-b border-[#cbb58c] pb-3 mb-4">
            <div>
              <div className="text-[11px] font-bold tracking-wider text-[#2c6b3f]">SENTENCE SYNTAX PEDESTAL</div>
              <h2 className="font-display text-xl font-bold text-[#2c2118]">{sentenceChallenge.titleEn}</h2>
            </div>
            <button
              type="button"
              onClick={() => audioManager.speakEnglish(fullSentence, 0.85)}
              aria-label="Listen to target sentence"
              className="btn-wood-primary px-3 py-1.5 rounded text-xs font-bold whitespace-nowrap cursor-pointer"
            >
              🔊 Listen Hint
            </button>
          </div>

          <p className="text-sm text-[#4a3827] mb-1">
            Arrange the rune words below into a natural English sentence:
          </p>
          <p className="text-sm font-semibold text-[#2c2118] bg-[#ebe0c7] border border-[#c7b187] rounded p-3 mb-3">
            Nghĩa mục tiêu: “{sentenceChallenge.meaningVi}”
          </p>

          {/* Constructed Sentence Tray */}
          <div className="min-h-[54px] bg-[#f7eedc] border-2 border-[#bfa67a] rounded-md p-2.5 flex flex-wrap items-center gap-2 mb-3">
            {arrangedTokens.length === 0 ? (
              <span className="text-xs text-[#8c785c] italic">Tap word cards below in order...</span>
            ) : (
              pickedTokenIds.map((id) => {
                const tok = shuffledTokens.find((t) => t.id === id);
                if (!tok) return null;
                return (
                  <button
                    key={id}
                    type="button"
                    disabled={solved}
                    onClick={() => setPickedTokenIds((prev) => prev.filter((item) => item !== id))}
                    className={`px-3 py-1.5 rounded text-sm font-bold ${
                      solved
                        ? 'bg-[#dff0d8] border border-[#569447] text-[#1e4d16]'
                        : 'bg-[#4a3525] text-[#fff6df] cursor-pointer hover:bg-[#614631]'
                    }`}
                  >
                    {tok.text}
                  </button>
                );
              })
            )}
          </div>

          {/* Available Shuffled Word Cards */}
          {!solved && (
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {shuffledTokens.map((tok) => {
                const used = pickedTokenIds.includes(tok.id);
                return (
                  <button
                    key={tok.id}
                    type="button"
                    disabled={used}
                    onClick={() => {
                      audioManager.playSfx('click');
                      setPickedTokenIds((prev) => [...prev, tok.id]);
                      setErrorMsg(null);
                    }}
                    className={`px-3.5 py-2 rounded text-sm font-bold ${
                      used
                        ? 'bg-[#d4c6ab] text-[#a3947a] cursor-not-allowed'
                        : 'btn-wood-secondary cursor-pointer'
                    }`}
                  >
                    {tok.text}
                  </button>
                );
              })}
            </div>
          )}

          {/* Grammar Tip */}
          <div className="text-xs text-[#543e29] bg-[#ebe0c7] border border-[#d1bc94] rounded px-3 py-2 mb-4">
            <strong>Grammar Tip:</strong> {sentenceChallenge.grammarTipEn}
            {showVi && <div className="text-[#6e553b] mt-0.5">{sentenceChallenge.grammarTipVi}</div>}
          </div>

          {errorMsg && (
            <div className="mb-3 px-3 py-2 rounded bg-[#f7dcd9] border border-[#cf7b74] text-[#7a201a] text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {solved ? (
            <div className="px-4 py-3 rounded bg-[#dff0d8] border border-[#7ca66d] text-[#244a1c] text-sm font-bold mb-4">
              Perfect English syntax! Received +{sentenceChallenge.rewardCoins} Coins, +{sentenceChallenge.rewardXp} XP & Rune Shards.
            </div>
          ) : (
            <div className="flex items-center justify-end gap-2 mb-2">
              <button
                type="button"
                onClick={() => setPickedTokenIds([])}
                className="btn-wood-secondary px-4 py-2 rounded text-xs font-semibold cursor-pointer"
              >
                Reset
              </button>
              <button
                type="button"
                disabled={arrangedTokens.length !== sentenceChallenge.correctTokens.length}
                onClick={handleCheckSentence}
                className={`px-5 py-2 rounded text-xs font-bold ${
                  arrangedTokens.length === sentenceChallenge.correctTokens.length
                    ? 'btn-wood-primary cursor-pointer'
                    : 'bg-[#c9baa0] text-[#7a6b55] cursor-not-allowed'
                }`}
              >
                Check Sentence
              </button>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-wood-secondary px-5 py-2 rounded text-sm font-semibold cursor-pointer"
            >
              {solved ? 'Collect & Close' : 'Step Back'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ================= 4. RUNE LOCK CHEST =================
  if (puzzleKind === 'chest' && chestId) {
    const chest = PUZZLE_CHESTS[chestId];
    if (!chest) return null;

    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-label={chest.titleEn}
        className="fixed inset-0 z-30 flex items-center justify-center bg-[#0f0b08]/75 p-4"
      >
        <div className="panel-parchment rounded-lg max-w-lg w-full p-6">
          <div className="flex items-start justify-between gap-3 border-b border-[#cbb58c] pb-3 mb-4">
            <div>
              <div className="text-[11px] font-bold tracking-wider text-[#8a4d19]">RUNE LOCK PUZZLE</div>
              <h2 className="font-display text-xl font-bold text-[#2c2118]">{chest.titleEn}</h2>
            </div>
            <button
              type="button"
              onClick={() => audioManager.speakEnglish(chest.storySentenceEn.replace('___', 'blank'))}
              aria-label="Listen to puzzle sentence"
              className="btn-wood-primary px-3 py-1.5 rounded text-xs font-bold whitespace-nowrap cursor-pointer"
            >
              🔊 Listen
            </button>
          </div>

          <p className="text-base font-semibold text-[#241a12] bg-[#ebe0c7] border border-[#c7b187] rounded p-4 mb-3">
            “{chest.storySentenceEn}”
          </p>

          {showVi ? (
            <p className="text-sm text-[#5c4734] mb-4">{chest.storySentenceVi}</p>
          ) : (
            <button
              type="button"
              onClick={() => {
                onSpendHintCost();
                setRevealedVi(true);
              }}
              className="text-xs font-semibold text-[#8a4d19] hover:underline mb-4 cursor-pointer"
            >
              Need a Vietnamese hint? Reveal meaning (-5 Coins / Stamina)
            </button>
          )}

          {errorMsg && (
            <div className="mb-3 px-3 py-2 rounded bg-[#f7dcd9] border border-[#cf7b74] text-[#7a201a] text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {solved ? (
            <div className="px-4 py-3 rounded bg-[#dff0d8] border border-[#7ca66d] text-[#244a1c] text-sm font-bold mb-4">
              Rune unlocked! Rewards & Rune Shard added to your bag.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5 mb-5">
              {chest.options.map((opt) => (
                <button
                  key={opt.text}
                  type="button"
                  onClick={() => {
                    audioManager.speakEnglish(opt.text);
                    if (opt.correct) {
                      setErrorMsg(null);
                      setSolved(true);
                      onSolveChest(chest.id);
                    } else {
                      audioManager.playSfx('error');
                      setErrorMsg(`"${opt.text}" does not fit the rune sentence. Try another word!`);
                    }
                  }}
                  className="btn-wood-secondary py-3 px-4 rounded-md font-bold text-sm cursor-pointer"
                >
                  {opt.text}
                </button>
              ))}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className={
                solved
                  ? 'btn-wood-primary px-5 py-2 rounded text-sm font-bold cursor-pointer'
                  : 'btn-wood-secondary px-5 py-2 rounded text-sm font-semibold cursor-pointer'
              }
            >
              {solved ? 'Collect & Close' : 'Step Back'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ================= 5. ANCIENT STONE STATUE ITEM RIDDLE =================
  const hasRoot = (inventory[STATUE_RIDDLE.requiredItemId] || 0) > 0;
  const offerableItems = Object.entries(inventory).filter(([, qty]) => qty > 0);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={STATUE_RIDDLE.titleEn}
      className="fixed inset-0 z-30 flex items-center justify-center bg-[#0f0b08]/75 p-4"
    >
      <div className="panel-parchment rounded-lg max-w-lg w-full p-6">
        <div className="flex items-start justify-between gap-3 border-b border-[#cbb58c] pb-3 mb-4">
          <div>
            <div className="text-[11px] font-bold tracking-wider text-[#8a4d19]">ANCIENT ITEM RIDDLE</div>
            <h2 className="font-display text-xl font-bold text-[#2c2118]">{STATUE_RIDDLE.titleEn}</h2>
          </div>
          <button
            type="button"
            onClick={() => audioManager.speakEnglish(STATUE_RIDDLE.riddleEn)}
            aria-label="Listen to statue riddle"
            className="btn-wood-primary px-3 py-1.5 rounded text-xs font-bold whitespace-nowrap cursor-pointer"
          >
            🔊 Listen
          </button>
        </div>

        <p className="text-base font-semibold text-[#241a12] bg-[#ebe0c7] border border-[#c7b187] rounded p-4 mb-3">
          “{STATUE_RIDDLE.riddleEn}”
        </p>

        {showVi ? (
          <p className="text-sm text-[#5c4734] mb-4">{STATUE_RIDDLE.riddleVi}</p>
        ) : (
          <button
            type="button"
            onClick={() => {
              onSpendHintCost();
              setRevealedVi(true);
            }}
            className="text-xs font-semibold text-[#8a4d19] hover:underline mb-4 cursor-pointer"
          >
            Need a Vietnamese hint? Reveal meaning (-5 Coins / Stamina)
          </button>
        )}

        {errorMsg && (
          <div className="mb-3 px-3 py-2 rounded bg-[#f7dcd9] border border-[#cf7b74] text-[#7a201a] text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        {solved ? (
          <div className="px-4 py-3 rounded bg-[#dff0d8] border border-[#7ca66d] text-[#244a1c] text-sm font-bold mb-4">
            The statue accepts your Bitter Root! Received 60 Coins, 2 Healing Potions, 1 Warm Pumpkin Soup & 2 Rune Shards.
          </div>
        ) : (
          <div className="mb-5">
            <div className="text-xs font-semibold text-[#6e563d] mb-2">
              Choose an item from your bag to offer:
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-44 overflow-y-auto">
              {offerableItems.map(([itemId, qty]) => {
                const def = ITEMS[itemId];
                if (!def) return null;
                return (
                  <button
                    key={itemId}
                    type="button"
                    onClick={() => {
                      if (itemId === STATUE_RIDDLE.requiredItemId) {
                        const ok = onSolveStatue();
                        if (ok) {
                          setErrorMsg(null);
                          setSolved(true);
                        }
                      } else {
                        audioManager.playSfx('error');
                        setErrorMsg(`The statue rejects ${def.name}. Read the riddle carefully!`);
                      }
                    }}
                    className="btn-wood-secondary px-3 py-2 rounded text-xs font-semibold flex items-center justify-between cursor-pointer"
                  >
                    <span className="truncate">{def.name}</span>
                    <span className="font-mono-num text-[#ffd666]">x{qty}</span>
                  </button>
                );
              })}
            </div>
            {!hasRoot && (
              <p className="text-xs text-[#7a4b1e] mt-2">
                Tip: Forage wild Bitter Root patches in Whispering Woods or grow Bitter Root Seeds!
              </p>
            )}
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="btn-wood-secondary px-5 py-2 rounded text-sm font-semibold cursor-pointer"
          >
            {solved ? 'Continue' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
