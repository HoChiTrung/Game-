import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CampfireModal } from './components/CampfireModal';
import { CraftingModal } from './components/CraftingModal';
import { DialogModal } from './components/DialogModal';
import { GameCanvas } from './components/GameCanvas';
import { HUD } from './components/HUD';
import { LexiconModal } from './components/LexiconModal';
import { PuzzleModal } from './components/PuzzleModal';
import { PauseModal, VictoryModal } from './components/StatusModals';
import { TitleScreen } from './components/TitleScreen';
import { TOTAL_CHALLENGE_COUNT } from './data/contentData';
import { EngineCallbacks, GameEngine } from './engine/gameEngine';
import { storageService } from './services/storageService';
import { ActiveModal, GameScreenState, HudSnapshot, VictoryStats } from './types/game';

export default function App() {
  const engineRef = useRef<GameEngine | null>(null);
  const [screenState, setScreenState] = useState<GameScreenState>('title');
  const [hasSave, setHasSave] = useState<boolean>(() => storageService.hasSave());
  const [hud, setHud] = useState<HudSnapshot | null>(null);
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [victoryStats, setVictoryStats] = useState<VictoryStats | null>(null);
  const [modalRefreshTick, setModalRefreshTick] = useState(0);

  useEffect(() => {
    document.body.dataset.state = screenState;
  }, [screenState]);

  const callbacks = useMemo<EngineCallbacks>(
    () => ({
      onHudUpdate: (snapshot) => {
        setHud(snapshot);
      },
      onOpenModal: (modal) => {
        setActiveModal(modal);
        setModalRefreshTick((t) => t + 1);
      },
      onScreenChange: (state) => {
        setScreenState(state);
      },
      onVictory: (stats) => {
        setVictoryStats(stats);
      },
      onSaveChanged: (saved) => {
        setHasSave(saved);
      },
    }),
    []
  );

  const handleEngineReady = useCallback((engine: GameEngine) => {
    engineRef.current = engine;
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      engine.startNewGame();
    }
  }, []);

  const bumpModalData = () => setModalRefreshTick((t) => t + 1);

  const getItemIconUrl = useCallback((itemId: string) => {
    return engineRef.current?.getItemIconUrl(itemId) || '';
  }, []);

  const currentSave = engineRef.current?.getSaveState();
  const portraitUrl =
    hud && engineRef.current
      ? engineRef.current.getSpriteManager().getPortraitUrl(hud.portraitMood)
      : '';

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#181410]">
      {/* Isolated 60 FPS Canvas2D Layer */}
      <GameCanvas onEngineReady={handleEngineReady} callbacks={callbacks} />

      {/* Title Screen */}
      {screenState === 'title' && (
        <TitleScreen
          hasSave={hasSave}
          onStartNew={() => engineRef.current?.startNewGame()}
          onContinue={() => engineRef.current?.continueGame()}
          onResetSave={() => engineRef.current?.resetSaveData()}
        />
      )}

      {/* Playing HUD */}
      {screenState === 'playing' && hud && (
        <HUD
          hud={hud}
          portraitUrl={portraitUrl}
          getItemIconUrl={getItemIconUrl}
          onToggleHintMode={() => engineRef.current?.toggleHintMode()}
          onToggleMute={() => engineRef.current?.toggleMute()}
          onOpenLexicon={() => engineRef.current?.setActiveModal({ type: 'lexicon' })}
          onOpenBag={() =>
            engineRef.current?.setActiveModal({ type: 'crafting', initialTab: 'bag' })
          }
          onOpenForge={() =>
            engineRef.current?.setActiveModal({ type: 'crafting', initialTab: 'forge' })
          }
          onPause={() => engineRef.current?.setPaused(true)}
          onSelectHotbar={(idx) => engineRef.current?.selectHotbarSlot(idx)}
          onUseHotbar={() => engineRef.current?.useSelectedHotbarItem()}
          onAnswerWordStrike={(idx) => engineRef.current?.answerWordStrike(idx)}
          onTriggerNova={() => engineRef.current?.triggerLexiconNova()}
        />
      )}

      {/* Gameplay Modals */}
      {screenState === 'playing' && activeModal && currentSave && (
        <div data-refresh={modalRefreshTick}>
          {activeModal.type === 'dialog' && (
            <DialogModal
              payload={activeModal.payload}
              hintMode={currentSave.hintMode}
              coins={currentSave.player.coins}
              getItemIconUrl={getItemIconUrl}
              onToggleHintMode={() => {
                engineRef.current?.toggleHintMode();
                bumpModalData();
              }}
              onBuySeed={(itemId, discounted) => {
                const res = engineRef.current?.handleBuySeed(itemId, discounted) || {
                  success: false,
                  messageEn: 'Unavailable',
                };
                bumpModalData();
                return res;
              }}
              onMerchantBargain={(bargainId, correct) => {
                engineRef.current?.handleMerchantBargain(bargainId, correct);
                bumpModalData();
              }}
              onUnlockGate={() => engineRef.current?.handleUnlockRuinsGate() || false}
              onClose={() => engineRef.current?.setActiveModal(null)}
            />
          )}

          {activeModal.type === 'crafting' && (
            <CraftingModal
              initialTab={activeModal.initialTab}
              inventory={currentSave.inventory}
              coins={currentSave.player.coins}
              upgrades={currentSave.upgrades}
              hintMode={currentSave.hintMode}
              getItemIconUrl={getItemIconUrl}
              onCraft={(recipeId) => {
                const res = engineRef.current?.handleCraftRecipe(recipeId) || {
                  success: false,
                  messageEn: 'Unavailable',
                };
                bumpModalData();
                return res;
              }}
              onPurchaseUpgrade={(up) => {
                const res = engineRef.current?.handlePurchaseUpgrade(up) || {
                  success: false,
                  messageEn: 'Unavailable',
                };
                bumpModalData();
                return res;
              }}
              onConsumeItem={(itemId) => {
                const res = engineRef.current?.handleConsumeItemFromBag(itemId) || {
                  used: false,
                  messageEn: 'Unavailable',
                };
                bumpModalData();
                return res;
              }}
              onClose={() => engineRef.current?.setActiveModal(null)}
            />
          )}

          {activeModal.type === 'puzzle' && (
            <PuzzleModal
              puzzleKind={activeModal.puzzleKind}
              chestId={activeModal.puzzleKind === 'chest' ? activeModal.chestId : undefined}
              challengeId={
                activeModal.puzzleKind === 'echo' ||
                activeModal.puzzleKind === 'spelling' ||
                activeModal.puzzleKind === 'sentence'
                  ? activeModal.challengeId
                  : undefined
              }
              hintMode={currentSave.hintMode}
              inventory={currentSave.inventory}
              onSpendHintCost={() => {
                const ok = engineRef.current?.handleSpendHintCost() || false;
                bumpModalData();
                return ok;
              }}
              onSolveChest={(chestId) => {
                engineRef.current?.handleSolveChestPuzzle(chestId);
                bumpModalData();
              }}
              onSolveStatue={() => {
                const ok = engineRef.current?.handleSolveStatueRiddle() || false;
                bumpModalData();
                return ok;
              }}
              onSolveEchoShrine={(challengeId) => {
                engineRef.current?.handleSolveEchoShrine(challengeId);
                bumpModalData();
              }}
              onSolveSpellingRune={(challengeId) => {
                engineRef.current?.handleSolveSpellingRune(challengeId);
                bumpModalData();
              }}
              onSolveSentencePedestal={(challengeId) => {
                engineRef.current?.handleSolveSentencePedestal(challengeId);
                bumpModalData();
              }}
              onClose={() => engineRef.current?.setActiveModal(null)}
            />
          )}

          {activeModal.type === 'lexicon' && (
            <LexiconModal
              vocabProgress={currentSave.vocabProgress}
              solvedChallengesCount={currentSave.solvedChallenges.length}
              totalChallengesCount={TOTAL_CHALLENGE_COUNT}
              hintMode={currentSave.hintMode}
              onClose={() => engineRef.current?.setActiveModal(null)}
            />
          )}

          {activeModal.type === 'campfire' && (
            <CampfireModal
              day={currentSave.day}
              todayEncounteredIds={currentSave.todayEncounteredVocabIds || []}
              vocabProgress={currentSave.vocabProgress}
              onCompleteSleep={(reviewedIds, grantWellRested) =>
                engineRef.current?.handleCampfireSleep(reviewedIds, grantWellRested)
              }
              onClose={() => engineRef.current?.setActiveModal(null)}
            />
          )}
        </div>
      )}

      {/* Pause Modal */}
      {screenState === 'paused' && (
        <PauseModal
          onResume={() => engineRef.current?.setPaused(false)}
          onSaveNow={() => {
            engineRef.current?.triggerSaveManual();
            engineRef.current?.setPaused(false);
          }}
          onRestart={() => engineRef.current?.startNewGame()}
          onTitle={() => engineRef.current?.returnToTitle()}
        />
      )}

      {/* Victory Summary Modal */}
      {screenState === 'gameover' && victoryStats && (
        <VictoryModal
          stats={victoryStats}
          onContinueExploring={() => engineRef.current?.continueAfterVictory()}
          onPlayAgain={() => engineRef.current?.startNewGame()}
        />
      )}
    </main>
  );
}
