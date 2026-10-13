'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Trophy, Sparkles, Play, Gamepad2, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';
import { SoundProfile } from '@/types/preferences';
import { playPopSound, playVictoryChime, playBuzzSound } from '@/lib/soundEffects';
import { triggerCelebration } from '@/lib/confetti';

interface BuddySnakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  buddyName?: string;
  buddyAvatar?: string;
  treatEmoji?: string;
  treatName?: string;
  soundProfile?: SoundProfile;
  onClaimReward?: (earnedTreats: number, earnedHearts: number) => void;
}

interface GridPoint {
  x: number;
  y: number;
}

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

const GRID_SIZE = 15;
const HIGHSCORE_KEY = 'ceria_buddy_snake_highscore';

function randomFreeCell(occupied: GridPoint[]): GridPoint {
  const occupiedSet = new Set(occupied.map((p) => `${p.x},${p.y}`));
  const free: GridPoint[] = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (!occupiedSet.has(`${x},${y}`)) {
        free.push({ x, y });
      }
    }
  }
  if (free.length === 0) return { x: 0, y: 0 };
  return free[Math.floor(Math.random() * free.length)];
}

export const BuddySnakeModal: React.FC<BuddySnakeModalProps> = ({
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
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      return Number(localStorage.getItem(HIGHSCORE_KEY)) || 0;
    }
    return 0;
  });
  const [snake, setSnake] = useState<GridPoint[]>([
    { x: 7, y: 7 },
    { x: 6, y: 7 },
    { x: 5, y: 7 },
  ]);
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [food, setFood] = useState<GridPoint>({ x: 11, y: 7 });
  const [bonusFood, setBonusFood] = useState<GridPoint | null>(null);
  const [rewardClaimed, setRewardClaimed] = useState<boolean>(false);

  const snakeRef = useRef<GridPoint[]>([
    { x: 7, y: 7 },
    { x: 6, y: 7 },
    { x: 5, y: 7 },
  ]);
  const dirRef = useRef<Direction>('RIGHT');
  const nextDirQueueRef = useRef<Direction[]>([]);
  const foodRef = useRef<GridPoint>({ x: 11, y: 7 });
  const bonusFoodRef = useRef<GridPoint | null>(null);
  const scoreRef = useRef<number>(0);

  const calculateRewards = useCallback((finalScore: number) => {
    if (finalScore >= 180) {
      return { treats: 3, hearts: 3, rank: 'Master Ular Produktif! 🐍👑' };
    }
    if (finalScore >= 90) {
      return { treats: 2, hearts: 2, rank: 'Penjelajah Camilan Gesit! 🌟' };
    }
    if (finalScore >= 30) {
      return { treats: 1, hearts: 1, rank: 'Petualang Ceria! ✨' };
    }
    return { treats: 1, hearts: 0, rank: 'Pemanasan Seru! 🐾' };
  }, []);

  const finishGame = useCallback(() => {
    playBuzzSound();
    setGameState('ended');

    const finalScore = scoreRef.current;
    if (finalScore > highScore) {
      setHighScore(finalScore);
      if (typeof window !== 'undefined') {
        localStorage.setItem(HIGHSCORE_KEY, String(finalScore));
      }
    }

    if (finalScore >= 90) {
      setTimeout(() => {
        playVictoryChime('arcade');
        triggerCelebration('confetti');
      }, 220);
    } else {
      setTimeout(() => playVictoryChime(soundProfile), 220);
    }
  }, [highScore, soundProfile]);

  const startGame = () => {
    playPopSound('arcade');
    const initialSnake = [
      { x: 7, y: 7 },
      { x: 6, y: 7 },
      { x: 5, y: 7 },
    ];
    const firstFood = randomFreeCell(initialSnake);

    snakeRef.current = initialSnake;
    dirRef.current = 'RIGHT';
    nextDirQueueRef.current = [];
    foodRef.current = firstFood;
    bonusFoodRef.current = null;
    scoreRef.current = 0;

    setSnake(initialSnake);
    setDirection('RIGHT');
    setFood(firstFood);
    setBonusFood(null);
    setScore(0);
    setRewardClaimed(false);
    setGameState('playing');
  };

  // Reset to ready whenever opened
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      setGameState('ready');
      setRewardClaimed(false);
    }, 0);
    return () => clearTimeout(timer);
  }, [isOpen]);

  const queueDirection = useCallback((newDir: Direction) => {
    const lastScheduled =
      nextDirQueueRef.current.length > 0
        ? nextDirQueueRef.current[nextDirQueueRef.current.length - 1]
        : dirRef.current;

    const isOpposite =
      (newDir === 'UP' && lastScheduled === 'DOWN') ||
      (newDir === 'DOWN' && lastScheduled === 'UP') ||
      (newDir === 'LEFT' && lastScheduled === 'RIGHT') ||
      (newDir === 'RIGHT' && lastScheduled === 'LEFT');

    if (!isOpposite && newDir !== lastScheduled && nextDirQueueRef.current.length < 2) {
      nextDirQueueRef.current.push(newDir);
    }
  }, []);

  // Keyboard listener
  useEffect(() => {
    if (!isOpen || gameState !== 'playing') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        queueDirection('UP');
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        queueDirection('DOWN');
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        queueDirection('LEFT');
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        queueDirection('RIGHT');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, gameState, queueDirection]);

  // Main Snake Step Loop (speed increases slightly as score grows)
  const stepMs = Math.max(85, 155 - Math.floor(score / 30) * 8);

  useEffect(() => {
    if (gameState !== 'playing') return;

    const interval = setInterval(() => {
      const currentSnake = [...snakeRef.current];
      const nextDir =
        nextDirQueueRef.current.length > 0
          ? (nextDirQueueRef.current.shift() as Direction)
          : dirRef.current;

      dirRef.current = nextDir;
      setDirection(nextDir);

      const head = currentSnake[0];
      const nextHead: GridPoint = {
        x: head.x + (nextDir === 'RIGHT' ? 1 : nextDir === 'LEFT' ? -1 : 0),
        y: head.y + (nextDir === 'DOWN' ? 1 : nextDir === 'UP' ? -1 : 0),
      };

      // Check wall collision
      if (
        nextHead.x < 0 ||
        nextHead.x >= GRID_SIZE ||
        nextHead.y < 0 ||
        nextHead.y >= GRID_SIZE
      ) {
        finishGame();
        return;
      }

      // Check self collision (excluding tail tip if not eating)
      const hitsSelf = currentSnake
        .slice(0, -1)
        .some((seg) => seg.x === nextHead.x && seg.y === nextHead.y);
      if (hitsSelf) {
        finishGame();
        return;
      }

      const ateFood =
        nextHead.x === foodRef.current.x && nextHead.y === foodRef.current.y;
      const ateBonus =
        bonusFoodRef.current &&
        nextHead.x === bonusFoodRef.current.x &&
        nextHead.y === bonusFoodRef.current.y;

      const updatedSnake = [nextHead, ...currentSnake];
      if (!ateFood && !ateBonus) {
        updatedSnake.pop();
      }

      snakeRef.current = updatedSnake;
      setSnake(updatedSnake);

      if (ateFood) {
        playPopSound('bubble');
        scoreRef.current += 10;
        setScore(scoreRef.current);

        const occupied = bonusFoodRef.current
          ? [...updatedSnake, bonusFoodRef.current]
          : updatedSnake;
        const newFood = randomFreeCell(occupied);
        foodRef.current = newFood;
        setFood(newFood);

        // Chance to spawn golden star bonus food
        if (!bonusFoodRef.current && Math.random() < 0.28) {
          const bCell = randomFreeCell([...updatedSnake, newFood]);
          bonusFoodRef.current = bCell;
          setBonusFood(bCell);
        }
      } else if (ateBonus) {
        playPopSound('arcade');
        scoreRef.current += 25;
        setScore(scoreRef.current);
        bonusFoodRef.current = null;
        setBonusFood(null);
      }
    }, stepMs);

    return () => clearInterval(interval);
  }, [gameState, stepMs, finishGame]);

  const handleClaimAndClose = () => {
    if (gameState === 'ended' && !rewardClaimed) {
      const reward = calculateRewards(score);
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

  const rewardInfo = calculateRewards(score);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={handleClaimAndClose}
    >
      <div
        className="relative w-full max-w-md bg-[#faf8f5] dark:bg-slate-900 border-2 border-emerald-400 dark:border-emerald-500/60 rounded-3xl shadow-2xl overflow-hidden select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-emerald-100 via-teal-50 to-amber-100 dark:from-slate-800 dark:via-emerald-950/50 dark:to-slate-900 border-b border-emerald-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-2xl bg-emerald-500/15 border border-emerald-400/40 flex items-center justify-center text-lg shadow-2xs">
              🐍
            </span>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
                  Buddy Snake: Snack Trail
                </h3>
                <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-emerald-600 text-white">
                  Easter Egg
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Kumpulkan jejak {treatName} bersama {buddyName}! {buddyAvatar}
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

        {/* HUD */}
        <div className="px-5 py-2.5 bg-white/80 dark:bg-slate-800/70 border-b border-emerald-100 dark:border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-slate-900 px-2.5 py-1 rounded-xl border border-emerald-200 dark:border-slate-700">
              <span>Skor:</span>
              <span className="text-sm text-emerald-600 dark:text-emerald-400">{score}</span>
            </div>

            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              Panjang: <strong className="text-slate-800 dark:text-slate-200">{snake.length}</strong>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
            <Trophy className="w-3.5 h-3.5" />
            <span>Rekor: {Math.max(score, highScore)}</span>
          </div>
        </div>

        {/* 15x15 Grid Board */}
        <div className="relative p-4 flex flex-col items-center justify-center bg-gradient-to-b from-emerald-50/40 via-amber-50/20 to-teal-50/40 dark:from-slate-900 dark:to-slate-800">
          <div
            className="relative w-[300px] h-[300px] sm:w-[330px] sm:h-[330px] rounded-2xl border-2 border-emerald-300/90 dark:border-slate-700 bg-white/90 dark:bg-slate-900/90 shadow-inner overflow-hidden"
            style={{
              backgroundImage:
                'linear-gradient(to right, rgba(16, 185, 129, 0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(16, 185, 129, 0.08) 1px, transparent 1px)',
              backgroundSize: `${100 / GRID_SIZE}% ${100 / GRID_SIZE}%`,
            }}
          >
            {/* Regular Treat Food */}
            <div
              style={{
                left: `${(food.x / GRID_SIZE) * 100}%`,
                top: `${(food.y / GRID_SIZE) * 100}%`,
                width: `${100 / GRID_SIZE}%`,
                height: `${100 / GRID_SIZE}%`,
              }}
              className="absolute flex items-center justify-center text-sm sm:text-base animate-bounce"
            >
              {treatEmoji}
            </div>

            {/* Bonus Star Food */}
            {bonusFood && (
              <div
                style={{
                  left: `${(bonusFood.x / GRID_SIZE) * 100}%`,
                  top: `${(bonusFood.y / GRID_SIZE) * 100}%`,
                  width: `${100 / GRID_SIZE}%`,
                  height: `${100 / GRID_SIZE}%`,
                }}
                className="absolute flex items-center justify-center text-sm sm:text-base animate-pulse scale-125"
              >
                🌟
              </div>
            )}

            {/* Snake Segments */}
            {snake.map((segment, index) => {
              const isHead = index === 0;
              return (
                <div
                  key={`${segment.x}-${segment.y}-${index}`}
                  style={{
                    left: `${(segment.x / GRID_SIZE) * 100}%`,
                    top: `${(segment.y / GRID_SIZE) * 100}%`,
                    width: `${100 / GRID_SIZE}%`,
                    height: `${100 / GRID_SIZE}%`,
                  }}
                  className="absolute flex items-center justify-center transition-all duration-75"
                >
                  {isHead ? (
                    <span className="text-base sm:text-lg leading-none drop-shadow-xs">
                      {buddyAvatar}
                    </span>
                  ) : (
                    <div
                      className={`w-[82%] h-[82%] rounded-md shadow-2xs ${
                        index % 2 === 0
                          ? 'bg-emerald-400 dark:bg-emerald-500'
                          : 'bg-teal-400 dark:bg-teal-500'
                      }`}
                    />
                  )}
                </div>
              );
            })}

            {/* READY SCREEN */}
            {gameState === 'ready' && (
              <div className="absolute inset-0 z-20 bg-white/90 dark:bg-slate-900/92 backdrop-blur-xs flex flex-col items-center justify-center p-5 text-center">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-100 to-teal-200 dark:from-slate-800 dark:to-slate-700 border-2 border-emerald-400 flex items-center justify-center text-4xl shadow-lg mb-2.5 animate-bounce">
                  {buddyAvatar}
                </div>
                <h4 className="text-base font-extrabold text-slate-800 dark:text-slate-100 mb-1">
                  Buddy Snake: Jejak Camilan! 🐍
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 max-w-xs mb-4 leading-relaxed">
                  Arahkan <strong>{buddyName}</strong> memakan <strong>{treatEmoji} {treatName}</strong> (+10) dan <strong>🌟 Bintang</strong> (+25) tanpa menabrak dinding atau ekor sendiri!
                </p>

                <button
                  onClick={startGame}
                  className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-sm shadow-lg shadow-emerald-500/25 flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Mulai Main Snake!</span>
                </button>
              </div>
            )}

            {/* GAME OVER SCREEN */}
            {gameState === 'ended' && (
              <div className="absolute inset-0 z-20 bg-white/92 dark:bg-slate-900/95 backdrop-blur-xs flex flex-col items-center justify-center p-5 text-center animate-in fade-in zoom-in-95 duration-200">
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 border-2 border-emerald-400 flex items-center justify-center text-3xl mb-1.5 shadow-md">
                  {score >= 90 ? '🏆' : buddyAvatar}
                </div>

                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  {rewardInfo.rank}
                </span>
                <h4 className="text-xl font-black text-slate-800 dark:text-slate-100">
                  Skor Akhir: {score}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
                  Panjang Ekor: <strong>{snake.length}</strong> • Rekor: <strong>{Math.max(score, highScore)}</strong>
                </p>

                <div className="w-full max-w-xs p-2.5 rounded-2xl bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 dark:from-slate-800 dark:to-slate-800/80 border border-amber-300 dark:border-amber-500/40 mb-3.5 shadow-xs">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 mb-1 flex items-center justify-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Hadiah untuk {buddyName}</span>
                  </div>
                  <div className="flex items-center justify-center gap-4 text-xs font-extrabold">
                    <span className="text-amber-700 dark:text-amber-300">
                      +{rewardInfo.treats} {treatEmoji} {treatName}
                    </span>
                    {rewardInfo.hearts > 0 && (
                      <span className="text-rose-500">+{rewardInfo.hearts} ❤️ Hati</span>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleClaimAndClose}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-xs shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                >
                  <span>Ambil Hadiah & Selesai ✨</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile / On-Screen D-Pad Controls */}
          <div className="mt-3 flex items-center justify-between w-full max-w-[330px] gap-2">
            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Gamepad2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Gunakan tombol Panah / WASD</span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => queueDirection('LEFT')}
                className={`p-2 rounded-xl border cursor-pointer active:scale-90 ${
                  direction === 'LEFT'
                    ? 'bg-emerald-500 text-white border-emerald-600'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                }`}
                aria-label="Kiri"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => queueDirection('UP')}
                  className={`p-2 rounded-xl border cursor-pointer active:scale-90 ${
                    direction === 'UP'
                      ? 'bg-emerald-500 text-white border-emerald-600'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                  }`}
                  aria-label="Atas"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => queueDirection('DOWN')}
                  className={`p-2 rounded-xl border cursor-pointer active:scale-90 ${
                    direction === 'DOWN'
                      ? 'bg-emerald-500 text-white border-emerald-600'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                  }`}
                  aria-label="Bawah"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
              </div>
              <button
                type="button"
                onClick={() => queueDirection('RIGHT')}
                className={`p-2 rounded-xl border cursor-pointer active:scale-90 ${
                  direction === 'RIGHT'
                    ? 'bg-emerald-500 text-white border-emerald-600'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                }`}
                aria-label="Kanan"
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
