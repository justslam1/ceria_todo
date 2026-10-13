'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Trophy, Sparkles, Play, Gamepad2 } from 'lucide-react';
import { SoundProfile } from '@/types/preferences';
import { playPopSound, playVictoryChime, playBuzzSound } from '@/lib/soundEffects';
import { triggerCelebration } from '@/lib/confetti';

interface FocusPongModalProps {
  isOpen: boolean;
  onClose: () => void;
  buddyName?: string;
  buddyAvatar?: string;
  treatEmoji?: string;
  treatName?: string;
  soundProfile?: SoundProfile;
  onClaimReward?: (earnedTreats: number, earnedHearts: number) => void;
}

const WIN_GOALS = 5;
const PADDLE_WIDTH = 22; // % of arena width

export const FocusPongModal: React.FC<FocusPongModalProps> = ({
  isOpen,
  onClose,
  buddyName = 'Desk Buddy',
  buddyAvatar = '🐱',
  treatEmoji = '🐟',
  treatName = 'Camilan',
  soundProfile = 'pop',
  onClaimReward,
}) => {
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'ended'>('ready');
  const [playerGoals, setPlayerGoals] = useState<number>(0);
  const [aiGoals, setAiGoals] = useState<number>(0);
  const [rallyCount, setRallyCount] = useState<number>(0);
  const [bestRally, setBestRally] = useState<number>(0);
  const [playerX, setPlayerX] = useState<number>(50);
  const [aiX, setAiX] = useState<number>(50);
  const [ball, setBall] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [rewardClaimed, setRewardClaimed] = useState<boolean>(false);

  const arenaRef = useRef<HTMLDivElement | null>(null);
  const playerXRef = useRef<number>(50);
  const aiXRef = useRef<number>(50);
  const ballRef = useRef<{ x: number; y: number; vx: number; vy: number }>({
    x: 50,
    y: 50,
    vx: 36,
    vy: 54,
  });
  const playerGoalsRef = useRef<number>(0);
  const aiGoalsRef = useRef<number>(0);
  const rallyRef = useRef<number>(0);
  const keysRef = useRef<{ left: boolean; right: boolean }>({ left: false, right: false });
  const lastFrameRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);

  const resetBall = useCallback((towardsPlayer: boolean) => {
    const angleSpread = (Math.random() - 0.5) * 50;
    ballRef.current = {
      x: 50,
      y: 50,
      vx: angleSpread || 28,
      vy: towardsPlayer ? 54 : -54,
    };
    rallyRef.current = 0;
    setRallyCount(0);
    setBall({ x: 50, y: 50 });
  }, []);

  const finishMatch = useCallback(
    (didPlayerWin: boolean) => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      setGameState('ended');

      if (didPlayerWin) {
        playVictoryChime('arcade');
        triggerCelebration('confetti');
      } else {
        playVictoryChime(soundProfile);
      }
    },
    [soundProfile]
  );

  const startGame = () => {
    playPopSound('arcade');
    playerGoalsRef.current = 0;
    aiGoalsRef.current = 0;
    rallyRef.current = 0;
    playerXRef.current = 50;
    aiXRef.current = 50;

    setPlayerGoals(0);
    setAiGoals(0);
    setRallyCount(0);
    setBestRally(0);
    setPlayerX(50);
    setAiX(50);
    setRewardClaimed(false);

    resetBall(false);
    lastFrameRef.current = performance.now();
    setGameState('playing');
  };

  // Reset to ready whenever modal opens
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      setGameState('ready');
      setRewardClaimed(false);
    }, 0);
    return () => clearTimeout(timer);
  }, [isOpen]);

  // Keyboard listener
  useEffect(() => {
    if (!isOpen || gameState !== 'playing') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        keysRef.current.left = true;
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        keysRef.current.right = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        keysRef.current.left = false;
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        keysRef.current.right = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      keysRef.current = { left: false, right: false };
    };
  }, [isOpen, gameState]);

  // Main 60fps Pong Loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const update = (now: number) => {
      const dt = Math.min((now - lastFrameRef.current) / 1000, 0.05);
      lastFrameRef.current = now;

      // 1. Move player paddle via keyboard
      const playerSpeed = 80;
      if (keysRef.current.left) {
        playerXRef.current = Math.max(PADDLE_WIDTH / 2 + 2, playerXRef.current - playerSpeed * dt);
        setPlayerX(playerXRef.current);
      }
      if (keysRef.current.right) {
        playerXRef.current = Math.min(
          100 - PADDLE_WIDTH / 2 - 2,
          playerXRef.current + playerSpeed * dt
        );
        setPlayerX(playerXRef.current);
      }

      // 2. AI Paddle tracks ball X with human-like speed limit
      const aiMaxSpeed = 52;
      const diff = ballRef.current.x - aiXRef.current;
      const aiStep = Math.sign(diff) * Math.min(Math.abs(diff), aiMaxSpeed * dt);
      aiXRef.current = Math.max(
        PADDLE_WIDTH / 2 + 2,
        Math.min(100 - PADDLE_WIDTH / 2 - 2, aiXRef.current + aiStep)
      );
      setAiX(aiXRef.current);

      // 3. Move ball
      let { x, y, vx, vy } = ballRef.current;
      x += vx * dt;
      y += vy * dt;

      // Bounce left/right walls
      if (x <= 4) {
        x = 4;
        vx = Math.abs(vx);
        playPopSound('pop');
      } else if (x >= 96) {
        x = 96;
        vx = -Math.abs(vx);
        playPopSound('pop');
      }

      // Check Player Paddle collision (bottom around y: 88..93)
      if (vy > 0 && y >= 86 && y <= 93) {
        const hitOffset = x - playerXRef.current;
        if (Math.abs(hitOffset) <= PADDLE_WIDTH / 2 + 3.5) {
          y = 86;
          const speedBoost = Math.min(1.06, 1.035);
          vy = -Math.min(105, Math.abs(vy) * speedBoost);
          vx = hitOffset * 4.2;
          rallyRef.current += 1;
          setRallyCount(rallyRef.current);
          setBestRally((prev) => Math.max(prev, rallyRef.current));
          playPopSound('bubble');
        }
      }

      // Check AI Paddle collision (top around y: 7..14)
      if (vy < 0 && y <= 14 && y >= 7) {
        const hitOffset = x - aiXRef.current;
        if (Math.abs(hitOffset) <= PADDLE_WIDTH / 2 + 3.5) {
          y = 14;
          vy = Math.min(105, Math.abs(vy) * 1.03);
          vx = hitOffset * 3.8 + (Math.random() - 0.5) * 12;
          playPopSound('pop');
        }
      }

      // Check Goal Scored!
      if (y < 0) {
        // Player scored against AI!
        playPopSound('arcade');
        playerGoalsRef.current += 1;
        setPlayerGoals(playerGoalsRef.current);

        if (playerGoalsRef.current >= WIN_GOALS) {
          finishMatch(true);
          return;
        }
        resetBall(true);
      } else if (y > 100) {
        // AI scored against Player!
        playBuzzSound();
        aiGoalsRef.current += 1;
        setAiGoals(aiGoalsRef.current);

        if (aiGoalsRef.current >= WIN_GOALS) {
          finishMatch(false);
          return;
        }
        resetBall(false);
      } else {
        ballRef.current = { x, y, vx, vy };
        setBall({ x, y });
      }

      rafRef.current = requestAnimationFrame(update);
    };

    rafRef.current = requestAnimationFrame(update);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [gameState, finishMatch, resetBall]);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (gameState !== 'playing' || !arenaRef.current) return;
    const rect = arenaRef.current.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * 100;
    const clamped = Math.max(
      PADDLE_WIDTH / 2 + 2,
      Math.min(100 - PADDLE_WIDTH / 2 - 2, relX)
    );
    playerXRef.current = clamped;
    setPlayerX(clamped);
  };

  const calculateRewards = () => {
    const won = playerGoals >= WIN_GOALS;
    if (won) {
      return { treats: 3, hearts: 3, rank: 'Juara Tenis Meja Fokus! 🏓👑' };
    }
    if (playerGoals >= 3 || bestRally >= 6) {
      return { treats: 2, hearts: 1, rank: 'Lawan Tangguh & Gesit! ⚡✨' };
    }
    return { treats: 1, hearts: 1, rank: 'Semangat Pantang Menyerah! 🐾' };
  };

  const handleClaimAndClose = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (gameState === 'ended' && !rewardClaimed) {
      const reward = calculateRewards();
      if (onClaimReward) {
        onClaimReward(reward.treats, reward.hearts);
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('ceria-buddy-reward', {
            detail: { treats: reward.treats, hearts: reward.hearts },
          })
        );
      }
      setRewardClaimed(true);
    }
    setGameState('ready');
    onClose();
  };

  if (!isOpen) return null;

  const rewardInfo = calculateRewards();
  const didPlayerWin = playerGoals >= WIN_GOALS;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={handleClaimAndClose}
    >
      <div
        className="relative w-full max-w-md bg-[#faf8f5] dark:bg-slate-900 border-2 border-sky-400 dark:border-sky-500/60 rounded-3xl shadow-2xl overflow-hidden select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-sky-100 via-cyan-50 to-amber-100 dark:from-slate-800 dark:via-sky-950/50 dark:to-slate-900 border-b border-sky-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-2xl bg-sky-500/15 border border-sky-400/40 flex items-center justify-center text-lg shadow-2xs">
              🏓
            </span>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
                  Focus Pong: Desk Tennis
                </h3>
                <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-sky-600 text-white">
                  First to {WIN_GOALS}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {buddyName} {buddyAvatar} vs Boss Prokrastinasi 👾
              </p>
            </div>
          </div>

          <button
            onClick={handleClaimAndClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
            title="Tutup Permainan"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scoreboard HUD */}
        <div className="px-5 py-2.5 bg-white/80 dark:bg-slate-800/70 border-b border-sky-100 dark:border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-xl bg-sky-50 dark:bg-slate-900 border border-sky-200 dark:border-slate-700 font-extrabold text-sky-700 dark:text-sky-300">
              {buddyAvatar} Kamu: {playerGoals}
            </span>
            <span className="text-slate-400 font-bold">vs</span>
            <span className="px-2.5 py-1 rounded-xl bg-rose-50 dark:bg-slate-900 border border-rose-200 dark:border-slate-700 font-extrabold text-rose-600 dark:text-rose-400">
              👾 Boss: {aiGoals}
            </span>
          </div>

          <div className="flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400">
            <Trophy className="w-3.5 h-3.5" />
            <span>Rally: {rallyCount}x</span>
          </div>
        </div>

        {/* Pong Table Arena */}
        <div
          ref={arenaRef}
          onPointerMove={handlePointerMove}
          onPointerDown={handlePointerMove}
          className="relative h-[340px] w-full bg-gradient-to-b from-sky-900 via-teal-900 to-emerald-900 overflow-hidden touch-none"
        >
          {/* Tennis Table Lines & Net */}
          <div className="absolute inset-3 border-2 border-white/25 rounded-xl pointer-events-none" />
          <div className="absolute inset-x-3 top-1/2 -translate-y-1/2 border-t-2 border-dashed border-white/35 pointer-events-none" />
          <div className="absolute inset-y-3 left-1/2 -translate-x-1/2 border-l border-white/15 pointer-events-none" />

          {/* AI Paddle (Top - Boss Prokrastinasi) */}
          <div
            style={{
              left: `${aiX}%`,
              width: `${PADDLE_WIDTH}%`,
            }}
            className="absolute top-6 -translate-x-1/2 h-3.5 rounded-full bg-gradient-to-r from-rose-500 via-pink-500 to-rose-500 border border-white/80 shadow-md flex items-center justify-center pointer-events-none"
          >
            <span className="text-xs -mt-5 drop-shadow-xs">👾</span>
          </div>

          {/* Ball */}
          {gameState === 'playing' && (
            <div
              style={{
                left: `${ball.x}%`,
                top: `${ball.y}%`,
              }}
              className="absolute -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-amber-300 border-2 border-white shadow-[0_0_12px_rgba(251,191,36,0.9)] flex items-center justify-center text-xs pointer-events-none"
            >
              ⚡
            </div>
          )}

          {/* Player Paddle (Bottom - User & Desk Buddy) */}
          <div
            style={{
              left: `${playerX}%`,
              width: `${PADDLE_WIDTH}%`,
            }}
            className="absolute bottom-6 -translate-x-1/2 h-3.5 rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 border border-white shadow-lg flex items-center justify-center pointer-events-none"
          >
            <span className="text-sm -mb-5 drop-shadow-xs">{buddyAvatar}</span>
          </div>

          {/* READY OVERLAY */}
          {gameState === 'ready' && (
            <div className="absolute inset-0 z-20 bg-slate-900/85 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center text-white">
              <div className="w-16 h-16 rounded-3xl bg-sky-500/20 border-2 border-sky-400 flex items-center justify-center text-4xl shadow-lg mb-3 animate-bounce">
                🏓
              </div>

              <h4 className="text-base font-extrabold mb-1">
                Focus Pong: Desk Tennis! ⚡
              </h4>
              <p className="text-xs text-slate-300 max-w-xs mb-5 leading-relaxed">
                Geser paddle untuk memantulkan bola energi ke gawang <strong>👾 Boss Prokrastinasi</strong>. Siapa cepat cetak <strong>{WIN_GOALS} poin</strong> jadi pemenang!
              </p>

              <button
                onClick={startGame}
                className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-extrabold text-sm shadow-lg shadow-sky-500/30 flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Mulai Pertandingan!</span>
              </button>
            </div>
          )}

          {/* GAME OVER OVERLAY */}
          {gameState === 'ended' && (
            <div className="absolute inset-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-2xl bg-sky-100 dark:bg-sky-950/80 border-2 border-sky-400 flex items-center justify-center text-4xl mb-2 shadow-md">
                {didPlayerWin ? '🏆' : buddyAvatar}
              </div>

              <span className="text-[11px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                {rewardInfo.rank}
              </span>
              <h4 className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-0.5">
                {didPlayerWin ? 'Kamu Menang!' : 'Pertandingan Selesai!'} ({playerGoals} - {aiGoals})
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
                Rally Terpanjang: <strong>{bestRally}x Pantulan</strong>
              </p>

              <div className="w-full max-w-xs p-3 rounded-2xl bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 dark:from-slate-800 dark:to-slate-800/80 border border-amber-300 dark:border-amber-500/40 mb-4 shadow-xs">
                <div className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 mb-1.5 flex items-center justify-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>Hadiah Pertandingan untuk {buddyName}</span>
                </div>
                <div className="flex items-center justify-center gap-4 text-sm font-extrabold">
                  <span className="text-amber-700 dark:text-amber-300">
                    +{rewardInfo.treats} {treatEmoji} {treatName}
                  </span>
                  <span className="text-rose-500">+{rewardInfo.hearts} ❤️ Hati</span>
                </div>
              </div>

              <button
                onClick={handleClaimAndClose}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-xs shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
              >
                <span>Ambil Hadiah & Selesai ✨</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer Controls */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <Gamepad2 className="w-3.5 h-3.5 text-sky-500" />
            <span>Geser kursor/jari di meja atau gunakan ⬅️ ➡️</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onPointerDown={() => {
                keysRef.current.left = true;
              }}
              onPointerUp={() => {
                keysRef.current.left = false;
              }}
              onPointerLeave={() => {
                keysRef.current.left = false;
              }}
              className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-200 active:scale-95 cursor-pointer"
            >
              ⬅️
            </button>
            <button
              type="button"
              onPointerDown={() => {
                keysRef.current.right = true;
              }}
              onPointerUp={() => {
                keysRef.current.right = false;
              }}
              onPointerLeave={() => {
                keysRef.current.right = false;
              }}
              className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-200 active:scale-95 cursor-pointer"
            >
              ➡️
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
