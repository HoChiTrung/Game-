# AGENTS.md — Lexicon Isle Development Rules

## 1. Source of Truth

* Always follow `SRS_Lexicon_Isle.md` (architecture, schemas, mechanics) and `user.md` (acceptance criteria).

* Do NOT invent extra features, extra zones, or extra npm dependencies outside the SRS unless explicitly requested.

## 2. Token & Context Efficiency (CRITICAL)

* **Read selectively:** Only inspect files directly related to the current task/phase. Never re-read unchanged data files (`vocabData.ts`, `mapData.ts`) unnecessarily.

* **Surgical edits:** Modify only the specific functions/lines needed. Never rewrite an entire working file just to fix a small bug.

* **Concise output:** Keep chat explanations brief (bullet points). Do not paste full code blocks in chat after editing files.

* **No blind retry loops:** If a build/type error persists after 2 fix attempts, stop, explain the root cause concisely, and ask the user.

* **Phase-by-phase execution:** Implement one Phase (or 1–2 User Stories) at a time. Mark completed criteria `[x]` in `user.md` only after verifying.

## 3. Runtime & Storage Resource Efficiency

* **React vs. Canvas separation (60 FPS Rule):**

  * Keep the game loop (`requestAnimationFrame` + `deltaTime`), player/enemy coordinates, physics, and particles strictly inside `src/engine/` using mutable refs/classes.

  * **NEVER** store high-frequency positions (`x`, `y`, `vx`, `vy`) or frame counters in React `useState`. Only sync throttled UI values (HP, Stamina, Day, Active Quest, Modals) to React.

* **Zero external URLs & lightweight assets:**

  * Pre-render all procedural chibi pixel sprites once onto offscreen canvases (`imageSmoothingEnabled = false`) and cache them in `sprites.ts`. Do not redraw pixel matrices per frame.

  * Use native **Web Audio API** (8-bit SFX) and **Web Speech API** (`window.speechSynthesis`) for English audio.

* **Throttled Persistence (Save Writes):**

  * Never write to `localStorage` or DB on movement or per-frame ticks.

  * Only trigger `storageService.save()` on milestone events (sleep/new day, chest opened, quest completed, boss defeated, or 60s interval).

  * Keep `storageService.ts` abstracted so `localStorage` can later be swapped to Supabase without touching engine or UI files.

## 4. Architecture & Code Standards

* **Stack:** React 18+, TypeScript (strict), Vite, HTML5 Canvas 2D, Tailwind CSS.

* **Single Schema:** All shared interfaces MUST live in `src/types/game.ts`.

* **Data-Driven Content:** All English vocabulary, recipes, riddles, dialogues, and enemy stats MUST live in `src/data/` — never hardcode text inside `gameEngine.ts`.

* **Clean Cleanup:** Always clean up `requestAnimationFrame`, `keydown/keyup` listeners, and `speechSynthesis.cancel()` on unmount.

## 5. Non-Negotiable Gameplay Guardrails

* **No boring quiz popups:** Never pause real-time combat to show generic A/B/C/D test modals. Use the compact bottom **Word Strike** bar (`J/K/L` or click) for enemies and spoken/visual **English commands** for the Boss.

* **Bilingual Toggle:** Every English dialogue, sign, recipe, and riddle must respect `hintMode` (`EN` vs `EN_VI`) and include a clickable 🔊 pronunciation button.

* **Pause on Modals:** Automatically pause the game loop when `LexiconModal`, `CraftingModal`, `PuzzleModal`, `DialogModal`, or `CampfireModal` is open.

## 6. Verification Checklist (Before Finishing Any Task)

1. Run TypeScript check (`npx tsc --noEmit`) and ensure 0 errors.

2. Verify no console errors or missing asset warnings.

3. Confirm existing features from previous phases were not broken.

4. Report completed files, test steps, and next recommended User Story in 3–5 lines.