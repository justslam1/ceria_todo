'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Trophy, Heart, Sparkles, Play, Gamepad2 } from 'lucide-react';
import { SoundProfile } from '@/types/preferences';
import { playPopSound, playVictoryChime, playBuzzSound } from '@/lib/soundEffects';
import { triggerCelebration } from '@/lib/confetti';

interface BuddySnackGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  buddyName: string;
  buddyAvatar: string;
  treatEmoji: string;
  treatName: string;
  accessoryIcon?: string;
  soundProfile?: SoundProfile;
  onClaimReward: (earnedTreats: number, earnedHearts: number) => void;
}

type ItemKind = 'treat' | 'golden' | 'heart' | 'distraction';

interface FallingItem {
  id: number;
  x: number; // percentage 8..92
  y: number; // percentage 0..100
  speed: number; // % per second
  kind: ItemKind;
  emoji: string;
  label?: string;
}

interface FloatingScore {
  id: number;
  x: number;
  y: number;
  text: string;
  colorClass: string;
}

const DISTRACTIONS = [
  { emoji: '📱', label: 'Medsos' },
  { emoji: '💤', label: 'Ngantuk' },
  { emoji: '🐛', label: 'Bug!' },
  { emoji: '📺', label: 'Binge' },
];

const GAME_DURATION = 30; // seconds
const HIGHSCORE_KEY = 'ceria_desk_buddy_snack_highscore';

export const BuddySnackGameModal: React.FC<BuddySnackGameModalProps> = ({
  isOpen,
  onClose,
  buddyName,
  buddyAvatar,
  treatEmoji,
  treatName,
  accessoryIcon,
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
  const [timeLeft, setTimeLeft] = useState<number>(GAME_DURATION);
  const [lives, setLives] = useState<number>(3);
  const [combo, setCombo] = useState<number>(0);
  const [playerX, setPlayerX] = useState<number>(50); // 10% to 90%
  const [items, setItems] = useState<FallingItem[]>([]);
  const [floatingScores, setFloatingScores] = useState<FloatingScore[]>([]);
  const [isHitShake, setIsHitShake] = useState<boolean>(false);
  const [rewardClaimed, setRewardClaimed] = useState<boolean>(false);

  // Refs for smooth game loop without stale closures
  const arenaRef = useRef<HTMLDivElement | null>(null);
  const playerXRef = useRef<number>(50);
  const keysPressedRef = useRef<{ left: boolean; right: boolean }>({ left: false, right: false });
  const itemsRef = useRef<FallingItem[]>([]);
  const scoreRef = useRef<number>(0);
  const livesRef = useRef<number>(3);
  const comboRef = useRef<number>(0);
  const timeLeftRef = useRef<number>(GAME_DURATION);
  const nextItemIdRef = useRef<number>(1);
  const lastSpawnTimeRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);

  const addFloatingText = useCallback((x: number, y: number, text: string, colorClass: string) => {
    const id = Date.now() + Math.random();
    setFloatingScores((prev) => [...prev.slice(-6), { id, x, y, text, colorClass }]);
    setTimeout(() => {
      setFloatingScores((prev) => prev.filter((f) => f.id !== id));
    }, 750);
  }, []);

  const calculateRewards = useCallback((finalScore: number) => {
    if (finalScore >= 220) return { treats: 3, hearts: 3, rank: 'Master Penangkap Camilan! 🏆' };
    if (finalScore >= 120) return { treats: 2, hearts: 2, rank: 'Partner Gesit & Fokus! 🌟' };
    if (finalScore >= 40) return { treats: 1, hearts: 1, rank: 'Teman Bermain Ceria! ✨' };
    return { treats: 1, hearts: 0, rank: 'Pemanasan yang Seru! 🐾' };
  }, []);

  const finishGame = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setGameState('ended');

    const finalScore = scoreRef.current;
    if (finalScore > highScore) {
      setHighScore(finalScore);
      if (typeof window !== 'undefined') {
        localStorage.setItem(HIGHSCORE_KEY, String(finalScore));
      }
    }

    if (finalScore >= 120) {
      playVictoryChime('arcade');
      triggerCelebration('confetti');
    } else {
      playVictoryChime(soundProfile);
    }
  }, [highScore, soundProfile]);

  const startGame = () => {
    playPopSound('arcade');
    scoreRef.current = 0;
    livesRef.current = 3;
    comboRef.current = 0;
    timeLeftRef.current = GAME_DURATION;
    playerXRef.current = 50;
    itemsRef.current = [];
    lastSpawnTimeRef.current = performance.now();
    lastFrameTimeRef.current = performance.now();

    setScore(0);
    setLives(3);
    setCombo(0);
    setTimeLeft(GAME_DURATION);
    setPlayerX(50);
    setItems([]);
    setFloatingScores([]);
    setRewardClaimed(false);
    setGameState('playing');
  };

  // Timer countdown while playing
  useEffect(() => {
    if (gameState !== 'playing') return;

    const timer = setInterval(() => {
      timeLeftRef.current -= 1;
      setTimeLeft(timeLeftRef.current);

      if (timeLeftRef.current <= 0) {
        clearInterval(timer);
        finishGame();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, finishGame]);

  // Keyboard listener
  useEffect(() => {
    if (!isOpen || gameState !== 'playing') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        keysPressedRef.current.left = true;
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        keysPressedRef.current.right = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        keysPressedRef.current.left = false;
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        keysPressedRef.current.right = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      keysPressedRef.current = { left: false, right: false };
    };
  }, [isOpen, gameState]);

  // Main 60fps Game Loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const updateFrame = (now: number) => {
      const dt = Math.min((now - lastFrameTimeRef.current) / 1000, 0.1);
      lastFrameTimeRef.current = now;

      // 1. Move player via keyboard if pressed
      const moveSpeed = 72; // % per second
      if (keysPressedRef.current.left) {
        playerXRef.current = Math.max(8, playerXRef.current - moveSpeed * dt);
        setPlayerX(playerXRef.current);
      }
      if (keysPressedRef.current.right) {
        playerXRef.current = Math.min(92, playerXRef.current + moveSpeed * dt);
        setPlayerX(playerXRef.current);
      }

      // 2. Spawn items periodically (faster during last 10s Fever Mode)
      const isFever = timeLeftRef.current <= 10;
      const spawnInterval = isFever ? 380 : 560; // ms
      if (now - lastSpawnTimeRef.current >= spawnInterval) {
        lastSpawnTimeRef.current = now;
        const roll = Math.random();
        let kind: ItemKind = 'treat';
        let emoji = treatEmoji || '🐟';
        let label: string | undefined;

        if (roll < 0.25) {
          kind = 'distraction';
          const picked = DISTRACTIONS[Math.floor(Math.random() * DISTRACTIONS.length)];
          emoji = picked.emoji;
          label = picked.label;
        } else if (roll < 0.37) {
          kind = 'golden';
          emoji = '🌟';
        } else if (roll < 0.43 && livesRef.current < 3) {
          kind = 'heart';
          emoji = '💖';
        }

        const baseSpeed = isFever ? 42 : 30;
        const speedVariance = Math.random() * 18;

        itemsRef.current.push({
          id: nextItemIdRef.current++,
          x: 10 + Math.random() * 80,
          y: -5,
          speed: baseSpeed + speedVariance,
          kind,
          emoji,
          label,
        });
      }

      // 3. Move items & check collisions with player basket (around y: 80..92)
      const nextItems: FallingItem[] = [];
      let gameOverTriggered = false;

      for (const item of itemsRef.current) {
        const updatedY = item.y + item.speed * dt;

        // Check catch collision
        const hitVertical = updatedY >= 77 && updatedY <= 92;
        const hitHorizontal = Math.abs(item.x - playerXRef.current) <= 11.5;

        if (hitVertical && hitHorizontal) {
          if (item.kind === 'treat') {
            comboRef.current += 1;
            const bonus = comboRef.current >= 5 ? 5 : 0;
            const pts = 10 + bonus;
            scoreRef.current += pts;
            setScore(scoreRef.current);
            setCombo(comboRef.current);
            playPopSound('bubble');
            addFloatingText(
              item.x,
              76,
              `+${pts} ${item.emoji}`,
              'text-amber-600 dark:text-amber-300'
            );
          } else if (item.kind === 'golden') {
            comboRef.current += 1;
            const pts = 25;
            scoreRef.current += pts;
            setScore(scoreRef.current);
            setCombo(comboRef.current);
            playPopSound('arcade');
            addFloatingText(item.x, 75, '+25 🌟 SUPER!', 'text-yellow-500 font-extrabold');
          } else if (item.kind === 'heart') {
            livesRef.current = Math.min(3, livesRef.current + 1);
            scoreRef.current += 15;
            setLives(livesRef.current);
            setScore(scoreRef.current);
            playPopSound('arcade');
            addFloatingText(item.x, 75, '+1 ❤️ NYAWA!', 'text-rose-500 font-extrabold');
          } else if (item.kind === 'distraction') {
            comboRef.current = 0;
            livesRef.current -= 1;
            setCombo(0);
            setLives(livesRef.current);
            playBuzzSound();
            setIsHitShake(true);
            setTimeout(() => setIsHitShake(false), 320);
            addFloatingText(
              item.x,
              75,
              `Aduh! ${item.label || 'Distraksi'} -1 ❤️`,
              'text-rose-600 dark:text-rose-400 font-extrabold'
            );

            if (livesRef.current <= 0) {
              gameOverTriggered = true;
            }
          }
          continue; // Consumed
        }

        // Missed item reaches bottom
        if (updatedY > 102) {
          if (item.kind === 'treat' || item.kind === 'golden') {
            comboRef.current = 0;
            setCombo(0);
          }
          continue;
        }

        nextItems.push({ ...item, y: updatedY });
      }

      itemsRef.current = nextItems;
      setItems([...nextItems]);

      if (gameOverTriggered) {
        finishGame();
        return;
      }

      rafRef.current = requestAnimationFrame(updateFrame);
    };

    rafRef.current = requestAnimationFrame(updateFrame);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [gameState, treatEmoji, addFloatingText, finishGame]);

  // Pointer / Touch drag inside arena
  const handleArenaPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (gameState !== 'playing' || !arenaRef.current) return;
    const rect = arenaRef.current.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * 100;
    const clamped = Math.max(8, Math.min(92, relX));
    playerXRef.current = clamped;
    setPlayerX(clamped);
  };

  const handleClaimAndClose = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (!rewardClaimed && gameState === 'ended') {
      const reward = calculateRewards(score);
      onClaimReward(reward.treats, reward.hearts);
      setRewardClaimed(true);
    }
    setGameState('ready');
    setItems([]);
    itemsRef.current = [];
    onClose();
  };

  if (!isOpen) return null;

  const rewardInfo = calculateRewards(score);
  const isFeverTime = gameState === 'playing' && timeLeft <= 10;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={handleClaimAndClose}
    >
      <div
        className={`relative w-full max-w-md bg-white dark:bg-slate-900 border-2 border-amber-300 dark:border-amber-500/50 rounded-3xl shadow-2xl overflow-hidden select-none transition-transform ${
          isHitShake ? 'animate-bounce border-rose-500' : ''
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-amber-100 via-orange-50 to-yellow-100 dark:from-slate-800 dark:via-slate-800 dark:to-slate-900 border-b border-amber-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-lg">
              🎮
            </span>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
                  Tangkap {treatName}!
                </h3>
                <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-amber-500 text-white">
                  Easter Egg
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Bermain bersama {buddyName} {buddyAvatar}
              </p>
            </div>
          </div>

          <button
            onClick={handleClaimAndClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
            title="Tutup Mini Game"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Score, Lives & Timer HUD */}
        <div className="px-4 py-2.5 bg-amber-50/60 dark:bg-slate-800/60 border-b border-amber-100 dark:border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 font-extrabold text-amber-700 dark:text-amber-300 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-xl border border-amber-200 dark:border-slate-700 shadow-2xs">
              <span>Skor:</span>
              <span className="text-sm text-amber-600 dark:text-amber-400">{score}</span>
            </div>

            {combo >= 3 && gameState === 'playing' && (
              <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-orange-500 to-rose-500 text-white font-black text-[10px] animate-pulse">
                {combo}x COMBO! 🔥
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Lives */}
            <div className="flex items-center gap-0.5" title="Nyawa Fokus">
              {[1, 2, 3].map((idx) => (
                <Heart
                  key={idx}
                  className={`w-4 h-4 transition-all ${
                    idx <= lives
                      ? 'fill-rose-500 text-rose-500 scale-100'
                      : 'text-slate-300 dark:text-slate-700 scale-75'
                  }`}
                />
              ))}
            </div>

            {/* Timer */}
            <div
              className={`font-extrabold px-2.5 py-1 rounded-xl border transition-colors ${
                isFeverTime
                  ? 'bg-rose-500 text-white border-rose-600 animate-pulse'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
              }`}
            >
              ⏱️ {timeLeft}s
            </div>
          </div>
        </div>

        {/* Game Arena */}
        <div
          ref={arenaRef}
          onPointerMove={handleArenaPointerMove}
          onPointerDown={handleArenaPointerMove}
          className={`relative h-[340px] w-full overflow-hidden touch-none ${
            isFeverTime
              ? 'bg-gradient-to-b from-amber-100/70 via-orange-50/50 to-rose-100/60 dark:from-slate-900 dark:via-indigo-950/50 dark:to-rose-950/30'
              : 'bg-gradient-to-b from-sky-50/70 via-amber-50/30 to-emerald-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800'
          }`}
        >
          {/* Decorative background clouds/sparkles */}
          <div className="absolute top-6 left-8 text-2xl opacity-25 pointer-events-none">☁️</div>
          <div className="absolute top-14 right-10 text-xl opacity-25 pointer-events-none">✨</div>
          <div className="absolute top-28 left-1/2 -translate-x-1/2 text-xs font-bold uppercase tracking-widest text-slate-400/40 pointer-events-none">
            {isFeverTime ? '🔥 FEVER TIME! MAKIN CEPAT! 🔥' : 'Geser Kursor / Panah ⬅️ ➡️'}
          </div>

          {/* READY SCREEN OVERLAY */}
          {gameState === 'ready' && (
            <div className="absolute inset-0 z-20 bg-white/85 dark:bg-slate-900/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center">
              <div className="relative mb-3">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-100 to-yellow-200 dark:from-slate-800 dark:to-slate-700 border-2 border-amber-400 flex items-center justify-center text-5xl shadow-lg animate-bounce">
                  {buddyAvatar}
                </div>
                {accessoryIcon && (
                  <span className="absolute -top-3 -right-2 text-2xl drop-shadow-xs">
                    {accessoryIcon}
                  </span>
                )}
              </div>

              <h4 className="text-base font-extrabold text-slate-800 dark:text-slate-100 mb-1">
                {buddyName} Mengajakmu Bermain! 🎉
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 max-w-xs mb-4 leading-relaxed">
                Tangkap <strong>{treatEmoji} {treatName}</strong> (+10) dan <strong>🌟 Bintang</strong> (+25). Hindari distraksi seperti <strong>📱 Medsos</strong>, <strong>💤 Kantuk</strong>, dan <strong>🐛 Bug</strong>!
              </p>

              <div className="grid grid-cols-2 gap-2 w-full max-w-xs mb-5 text-[11px]">
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 font-semibold flex items-center justify-center gap-1.5">
                  <span>{treatEmoji} 🌟 💖</span>
                  <span>Tangkap!</span>
                </div>
                <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 font-semibold flex items-center justify-center gap-1.5">
                  <span>📱 💤 🐛</span>
                  <span>Hindari!</span>
                </div>
              </div>

              {highScore > 0 && (
                <div className="mb-4 flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                  <Trophy className="w-4 h-4" />
                  <span>Rekor Terbaikmu: {highScore} Poin</span>
                </div>
              )}

              <button
                onClick={startGame}
                className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-sm shadow-lg shadow-amber-500/25 flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Mulai Tangkap Camilan!</span>
              </button>
            </div>
          )}

          {/* GAME OVER / REWARD OVERLAY */}
          {gameState === 'ended' && (
            <div className="absolute inset-0 z-20 bg-white/90 dark:bg-slate-900/95 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-950/80 border-2 border-amber-400 flex items-center justify-center text-4xl mb-2 shadow-md">
                {score >= 120 ? '🏆' : buddyAvatar}
              </div>

              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                {rewardInfo.rank}
              </span>
              <h4 className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-0.5">
                Skor Akhir: {score}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
                Rekor Tertinggi: <strong>{Math.max(score, highScore)}</strong> Poin
              </p>

              {/* Reward Box */}
              <div className="w-full max-w-xs p-3 rounded-2xl bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 dark:from-slate-800 dark:to-slate-800/80 border border-amber-300 dark:border-amber-500/40 mb-4 shadow-xs">
                <div className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 mb-1.5 flex items-center justify-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>Hadiah untuk {buddyName}</span>
                </div>
                <div className="flex items-center justify-center gap-4 text-sm font-extrabold">
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
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-xs shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
              >
                <span>Ambil Hadiah & Selesai ✨</span>
              </button>
            </div>
          )}

          {/* FALLING ITEMS */}
          {items.map((item) => (
            <div
              key={item.id}
              style={{
                left: `${item.x}%`,
                top: `${item.y}%`,
              }}
              className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center"
            >
              <span
                className={`text-2xl drop-shadow-xs ${
                  item.kind === 'golden'
                    ? 'scale-125 animate-pulse'
                    : item.kind === 'distraction'
                      ? 'bg-rose-500/15 dark:bg-rose-500/25 rounded-full p-1 border border-rose-400/50'
                      : ''
                }`}
              >
                {item.emoji}
              </span>
              {item.kind === 'distraction' && item.label && (
                <span className="text-[9px] font-extrabold px-1 rounded bg-rose-600 text-white shadow-2xs -mt-1">
                  {item.label}
                </span>
              )}
            </div>
          ))}

          {/* FLOATING SCORE FEEDBACK */}
          {floatingScores.map((f) => (
            <div
              key={f.id}
              style={{ left: `${f.x}%`, top: `${f.y}%` }}
              className={`absolute -translate-x-1/2 pointer-events-none text-xs font-black whitespace-nowrap animate-in fade-in slide-out-to-top-6 duration-700 ${f.colorClass}`}
            >
              {f.text}
            </div>
          ))}

          {/* PLAYER DESK BUDDY CATCHER */}
          <div
            style={{ left: `${playerX}%` }}
            className="absolute bottom-3 -translate-x-1/2 pointer-events-none transition-transform duration-75"
          >
            <div className="relative flex flex-col items-center">
              {accessoryIcon && (
                <span className="absolute -top-3.5 text-base z-10 drop-shadow-xs">
                  {accessoryIcon}
                </span>
              )}
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-100 via-orange-50 to-yellow-100 dark:from-slate-800 dark:to-slate-700 border-2 border-amber-400 shadow-lg flex items-center justify-center text-3xl">
                {buddyAvatar}
              </div>
              <div className="mt-0.5 px-2 py-0.2 rounded-full bg-amber-500/90 text-white text-[9px] font-extrabold shadow-2xs">
                {buddyName}
              </div>
            </div>
          </div>

          {/* Ground grass / desk line */}
          <div className="absolute bottom-0 inset-x-0 h-2 bg-gradient-to-r from-amber-300 via-orange-300 to-amber-300 dark:from-amber-600/50 dark:to-orange-600/50" />
        </div>

        {/* Footer Mobile / Quick Controls */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <Gamepad2 className="w-3.5 h-3.5 text-amber-500" />
            <span>Sentuh/geser area permainan atau gunakan tombol ⬅️ ➡️</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onPointerDown={() => {
                keysPressedRef.current.left = true;
              }}
              onPointerUp={() => {
                keysPressedRef.current.left = false;
              }}
              onPointerLeave={() => {
                keysPressedRef.current.left = false;
              }}
              className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-200 active:scale-95 cursor-pointer"
            >
              ⬅️
            </button>
            <button
              type="button"
              onPointerDown={() => {
                keysPressedRef.current.right = true;
              }}
              onPointerUp={() => {
                keysPressedRef.current.right = false;
              }}
              onPointerLeave={() => {
                keysPressedRef.current.right = false;
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
