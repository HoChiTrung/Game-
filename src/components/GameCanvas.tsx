import { useEffect, useRef } from 'react';
import { EngineCallbacks, GameEngine } from '../engine/gameEngine';

interface GameCanvasProps {
  onEngineReady: (engine: GameEngine) => void;
  callbacks: EngineCallbacks;
}

export function GameCanvas({ onEngineReady, callbacks }: GameCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const callbacksRef = useRef<EngineCallbacks>(callbacks);

  useEffect(() => {
    callbacksRef.current = callbacks;
    if (engineRef.current) {
      engineRef.current.setCallbacks(callbacks);
    }
  }, [callbacks]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const engine = new GameEngine(canvas, callbacksRef.current);
    engineRef.current = engine;

    const syncSize = () => {
      const rect = container.getBoundingClientRect();
      engine.resize(rect.width || window.innerWidth, rect.height || window.innerHeight);
    };

    syncSize();
    const ro = new ResizeObserver(syncSize);
    ro.observe(container);

    engine.start();
    onEngineReady(engine);

    return () => {
      ro.disconnect();
      engine.destroy();
      engineRef.current = null;
    };
    // Mount the canvas engine strictly once so HUD state updates never tear down the 60FPS loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={containerRef} className="fixed inset-0 w-full h-full overflow-hidden bg-[#181410]">
      <canvas
        ref={canvasRef}
        data-testid="game-canvas"
        className="block w-full h-full pixel-canvas"
      />
    </div>
  );
}
