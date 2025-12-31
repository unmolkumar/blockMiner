// Next, React
import { FC, useState, useEffect, useRef } from 'react';

import pkg from '../../../package.json';

// ❌ DO NOT EDIT ANYTHING ABOVE THIS LINE

export const HomeView: FC = () => {
  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      {/* HEADER – fake Scrolly feed tabs */}
      <header className="flex items-center justify-center border-b border-white/10 py-3">
        <div className="flex items-center gap-2 rounded-full bg-white/5 px-2 py-1 text-[11px]">
          <button className="rounded-full bg-slate-900 px-3 py-1 font-semibold text-white">
            Feed
          </button>
          <button className="rounded-full px-3 py-1 text-slate-400">
            Casino
          </button>
          <button className="rounded-full px-3 py-1 text-slate-400">
            Kids
          </button>
        </div>
      </header>

      {/* MAIN – central game area (phone frame) */}
      <main className="flex flex-1 items-center justify-center px-4 py-3">
        <div className="relative aspect-[9/16] w-full max-w-sm overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 shadow-[0_0_40px_rgba(56,189,248,0.35)]">
          {/* Fake “feed card” top bar inside the phone */}
          <div className="flex items-center justify-between px-3 py-2 text-[10px] text-slate-400">
            <span className="rounded-full bg-white/5 px-2 py-1 text-[9px] uppercase tracking-wide">
              Scrolly Game
            </span>
            <span className="text-[9px] opacity-70">#NoCodeJam</span>
          </div>

          {/* The game lives INSIDE this phone frame */}
          <div className="flex h-[calc(100%-26px)] flex-col items-center justify-start px-3 pb-3 pt-1">
            <GameSandbox />
          </div>
        </div>
      </main>

      {/* FOOTER – tiny version text */}
      <footer className="flex h-5 items-center justify-center border-t border-white/10 px-2 text-[9px] text-slate-500">
        <span>Scrolly · v{pkg.version}</span>
      </footer>
    </div>
  );
};

// ✅ THIS IS THE ONLY PART YOU EDIT FOR THE JAM
// Replace this entire GameSandbox component with the one AI generates.
// Keep the name `GameSandbox` and the `FC` type.

const GameSandbox: FC = () => {
  /* ---------------- CONFIG ---------------- */
  const MAX_LIVES = 3;
  const BASE_IDLE_MS = 4000;
  const LEVEL_UP_EVERY = 4;
  const MAX_BLOCKS = 12;
  const STAGE_HEIGHT = 320;

  /* ---------------- STATE ---------------- */
  const [started, setStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lives, setLives] = useState(MAX_LIVES);
  const [gameOver, setGameOver] = useState(false);
  const [correctId, setCorrectId] = useState(0);
  const [heat, setHeat] = useState(0);
  const [flash, setFlash] = useState<'hit' | 'miss' | null>(null);
  const [shake, setShake] = useState(false);

  /* ---------------- AUDIO ---------------- */
  const audioCtxRef = useRef<AudioContext | null>(null);
  const bgOscRef = useRef<OscillatorNode | null>(null);

  const getCtx = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
    }
    return audioCtxRef.current;
  };

  const playHit = () => {
    const ctx = getCtx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.value = 900;
    g.gain.value = 0.08;
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.12);
  };

  const playBuzz = () => {
    const ctx = getCtx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sawtooth';
    o.frequency.value = 140;
    g.gain.value = 0.12;
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.22);
  };

  const startHum = () => {
    if (bgOscRef.current) return;
    const ctx = getCtx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = 60;
    g.gain.value = 0.02;
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    bgOscRef.current = o;
  };

  const stopHum = () => {
    bgOscRef.current?.stop();
    bgOscRef.current = null;
  };

  /* ---------------- DERIVED ---------------- */
  const blockCount = level < 3 ? 6 : level < 5 ? 9 : 12;
  const idleMs = Math.max(BASE_IDLE_MS - level * 300, 1800);

  const blockSize =
    level < 3 ? 72 : level < 6 ? 60 : level < 9 ? 52 : 44;

  const decoyChance = Math.min(0.25 + level * 0.07, 0.8);

  /* ---------------- HELPERS ---------------- */
  const reshuffle = () => {
    setCorrectId(Math.floor(Math.random() * blockCount));
    setHeat(0);
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 120);
  };

  const loseLife = () => {
    setFlash('miss');
    triggerShake();
    playBuzz();

    setTimeout(() => setFlash(null), 100);

    setLives((l) => {
      if (l - 1 <= 0) {
        stopHum();
        setGameOver(true);
        return 0;
      }
      return l - 1;
    });

    reshuffle();
  };

  /* ---------------- HEAT ---------------- */
  useEffect(() => {
    if (gameOver || !started) return;

    const t = setInterval(() => {
      setHeat((h) => {
        const next = h + 100 / (idleMs / 100);
        if (next >= 100) {
          loseLife();
          return 0;
        }
        return next;
      });
    }, 100);

    return () => clearInterval(t);
  }, [idleMs, gameOver, started]);

  useEffect(() => {
    reshuffle();
  }, []);

  /* ---------------- ACTION ---------------- */
  const onTap = (i: number) => {
    if (gameOver || !started) return;

    startHum();

    if (i === correctId) {
      playHit();
      setFlash('hit');

      setTimeout(() => {
        setFlash(null);
        reshuffle();
      }, 90);

      setScore((s) => {
        const next = s + 1;
        if (next % LEVEL_UP_EVERY === 0) setLevel((lv) => lv + 1);
        return next;
      });
    } else {
      loseLife();
    }
  };

  const restart = () => {
    stopHum();
    setStarted(false);
    setScore(0);
    setLevel(1);
    setLives(MAX_LIVES);
    setGameOver(false);
    reshuffle();
  };

  /* ---------------- RENDER ---------------- */
  return (
    <div
      className={[
        'relative flex w-full flex-col rounded-2xl p-3 select-none',
        'bg-[#0b1220]',
        shake ? 'translate-x-[2px]' : '',
      ].join(' ')}
    >
      {/* HUD */}
      <div className="flex items-center justify-between text-[12px] font-bold text-white">
        <span>⛏️ LV {level}</span>
        <span>SCORE {score}</span>
        <span>{'⚡'.repeat(lives)}</span>
      </div>

      {/* HEAT */}
      <div className="mt-1 h-2 w-full rounded bg-white/20 overflow-hidden">
        <div
          className="h-full bg-yellow-400 transition-all"
          style={{ width: `${heat}%` }}
        />
      </div>

      {/* FIXED STAGE */}
      <div
        className="relative flex flex-col justify-between"
        style={{ height: STAGE_HEIGHT }}
      >
        {/* GRID */}
        <div className="grid grid-cols-3 grid-rows-4 gap-3 py-4 place-items-center">
          {Array.from({ length: 12 }).map((_, i) => {
            if (i >= blockCount) return <div key={i} className="opacity-0" />;

            const isCorrect = i === correctId;
            const isDecoy = !isCorrect && Math.random() < decoyChance;

            return (
              <button
                key={i}
                onClick={() => onTap(i)}
                style={{ width: blockSize, height: blockSize }}
                className={[
                  'flex items-center justify-center rounded-xl',
                  'transition-all active:scale-90',
                  'bg-[#1b2a4a]',
                  flash === 'hit' && isCorrect ? 'ring-2 ring-yellow-400' : '',
                  flash === 'miss' && !isCorrect ? 'ring-2 ring-red-400' : '',
                ].join(' ')}
              >
                <span
                  style={{ fontSize: blockSize * 0.7 }}
                  className={
                    isCorrect
                      ? 'opacity-100'
                      : isDecoy
                      ? 'opacity-[0.85] animate-pulse'
                      : 'opacity-30'
                  }
                >
                  🪙
                </span>
              </button>
            );
          })}
        </div>

        {!gameOver && (
          <div className="text-center text-[11px] font-semibold text-white/80">
            Find the REAL coin before power runs out
          </div>
        )}
      </div>

      {/* START SCREEN */}
      {!started && !gameOver && (
        <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-[#111a33]">
          <div className="flex flex-col items-center gap-4 px-6 text-center">
            <div className="text-3xl font-extrabold text-yellow-400">
              BLOCK MINER
            </div>

            <div className="space-y-2 text-[13px] font-bold text-white">
              <div>🪙 ONE coin is REAL</div>
              <div>👆 TAP it fast</div>
              <div>⚡ WAITING drains power</div>
            </div>

            <button
              onClick={() => setStarted(true)}
              className="rounded-full bg-yellow-400 px-8 py-3 text-sm font-black text-black active:scale-95"
            >
              START MINING
            </button>

            <div className="text-[10px] font-semibold text-white/70">
              Fast reactions = higher score
            </div>
          </div>
        </div>
      )}

      {/* GAME OVER */}
      {gameOver && (
        <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-[#111a33]">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="text-2xl font-extrabold text-red-400">
              MINER EXHAUSTED
            </div>
            <div className="text-sm font-bold text-white">
              LEVEL {level} · SCORE {score}
            </div>
            <button
              onClick={restart}
              className="rounded-full bg-yellow-400 px-7 py-2 text-sm font-black text-black"
            >
              TRY AGAIN
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
