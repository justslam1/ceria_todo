'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Trophy, Heart, Sparkles, Play, Hammer, Zap } from 'lucide-react';
import { SoundProfile } from '@/types/preferences';
import { playPopSound, playVictoryChime, playBuzzSound } from '@/lib/soundEffects';
import { triggerCelebration } from '@/lib/confetti';

interface WhackADistractionModalProps {
  isOpen: boolean;
  onClose: () => void;
  buddyAvatar?: string;
  buddyName?: string;
  soundProfile?: SoundProfile;
  onClaimReward?: (earnedTreats: number, earnedHearts: number) => void;
}

type MoleKind = 'distraction' | 'boss' | 'friend';

interface MoleEntity {
  id: number;
  slotIndex: number; // 0..8
  kind: MoleKind;
  emoji: string;
  name: string;
  badgeColor: string;
  expiresAt: number;
  isWhacked?: boolean;
}

interface HitFeedback {
  id: number;
  slotIndex: number;
  text: string;
  colorClass: string;
}

const DISTRACTION_MOLES = [
  { emoji: '🦥', name: 'Nanti Aja', badgeColor: 'bg-rose-500 text-white' },
  { emoji: '📱', name: 'Scroll Medsos', badgeColor: 'bg-pink-500 text-white' },
  { emoji: '🛌', name: 'Rebahan Dulu', badgeColor: 'bg-orange-500 text-white' },
  { emoji: '🌀', name: 'Overthinking', badgeColor: 'bg-purple-600 text-white' },
  { emoji: '📺', name: 'Maraton Seri', badgeColor: 'bg-red-500 text-white' },
];

const GAME_DURATION = 30;
const HIGHSCORE_KEY = 'ceria_whack_distraction_highscore';

export const WhackADistractionModal: React.FC<WhackADistractionModalProps> = ({
  isOpen,
  onClose,
  buddyAvatar = '🐱',
  buddyName = 'Desk Buddy',
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
  const [moles, setMoles] = useState<Record<number, MoleEntity>>({});
  const [feedbacks, setFeedbacks] = useState<HitFeedback[]>([]);
  const [isScreenShake, setIsScreenShake] = useState<boolean>(false);
  const [rewardClaimed, setRewardClaimed] = useState<boolean>(false);

  const scoreRef = useRef<number>(0);
  const livesRef = useRef<number>(3);
  const comboRef = useRef<number>(0);
  const timeLeftRef = useRef<number>(GAME_DURATION);
  const molesRef = useRef<Record<number, MoleEntity>>({});
  const nextIdRef = useRef<number>(1);

  const addFeedback = useCallback((slotIndex: number, text: string, colorClass: string) => {
    const id = Date.now() + Math.random();
    setFeedbacks((prev) => [...prev.slice(-8), { id, slotIndex, text, colorClass }]);
    setTimeout(() => {
      setFeedbacks((prev) => prev.filter((f) => f.id !== id));
    }, 650);
  }, []);

  const calculateRewards = useCallback((finalScore: number) => {
    if (finalScore >= 240) {
      return { treats: 3, hearts: 3, rank: 'Pembasmi Prokrastinasi Legendaris! ⚡👑' };
    }
    if (finalScore >= 140) {
      return { treats: 2, hearts: 2, rank: 'Penjaga Fokus Tangguh! 🛡️🔥' };
    }
    if (finalScore >= 50) {
      return { treats: 1, hearts: 1, rank: 'Bebas Distraksi! ✨' };
    }
    return { treats: 1, hearts: 0, rank: 'Pemanasan Fokus! 🐾' };
  }, []);

  const finishGame = useCallback(() => {
    setGameState('ended');
    molesRef.current = {};
    setMoles({});

    const finalScore = scoreRef.current;
    if (finalScore > highScore) {
      setHighScore(finalScore);
      if (typeof window !== 'undefined') {
        localStorage.setItem(HIGHSCORE_KEY, String(finalScore));
      }
    }

    if (finalScore >= 140) {
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
    molesRef.current = {};

    setScore(0);
    setLives(3);
    setCombo(0);
    setTimeLeft(GAME_DURATION);
    setMoles({});
    setFeedbacks([]);
    setRewardClaimed(false);
    setGameState('playing');
  };

  // Reset state to ready whenever modal opens
  useEffect(() => {
    if (!isOpen) return;
    const initTimer = setTimeout(() => {
      setGameState('ready');
      setMoles({});
      molesRef.current = {};
      setFeedbacks([]);
      setRewardClaimed(false);
    }, 0);
    return () => clearTimeout(initTimer);
  }, [isOpen]);

  // Countdown timer
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

  // Mole spawner & expiration loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const tickInterval = setInterval(() => {
      const now = Date.now();
      const current = { ...molesRef.current };
      let changed = false;

      // 1. Remove expired moles
      for (const key of Object.keys(current)) {
        const slot = Number(key);
        if (current[slot] && now >= current[slot].expiresAt) {
          delete current[slot];
          changed = true;
        }
      }

      // 2. Spawn new mole(s) if slots available
      const isOverdrive = timeLeftRef.current <= 10;
      const maxConcurrent = isOverdrive ? 3 : 2;
      const activeSlots = Object.keys(current).map(Number);

      if (activeSlots.length < maxConcurrent && Math.random() < (isOverdrive ? 0.85 : 0.68)) {
        const emptySlots = [0, 1, 2, 3, 4, 5, 6, 7, 8].filter((s) => !current[s]);
        if (emptySlots.length > 0) {
          const pickedSlot = emptySlots[Math.floor(Math.random() * emptySlots.length)];
          const roll = Math.random();

          let kind: MoleKind = 'distraction';
          let emoji = '🦥';
          let name = 'Nanti Aja';
          let badgeColor = 'bg-rose-500 text-white';
          let stayDuration = isOverdrive ? 1050 : 1350;

          if (roll < 0.22) {
            // Friend / Good Idea — DO NOT WHACK!
            kind = 'friend';
            if (Math.random() < 0.5) {
              emoji = '💡';
              name = 'Ide Brilian!';
            } else {
              emoji = buddyAvatar || '🐱';
              name = buddyName || 'Desk Buddy';
            }
            badgeColor = 'bg-emerald-500 text-white';
            stayDuration = 1250;
          } else if (roll < 0.38) {
            // Boss Invader!
            kind = 'boss';
            emoji = '👾';
            name = 'Boss Malas!';
            badgeColor = 'bg-amber-500 text-slate-950';
            stayDuration = isOverdrive ? 880 : 1050;
          } else {
            const picked =
              DISTRACTION_MOLES[Math.floor(Math.random() * DISTRACTION_MOLES.length)];
            emoji = picked.emoji;
            name = picked.name;
            badgeColor = picked.badgeColor;
          }

          current[pickedSlot] = {
            id: nextIdRef.current++,
            slotIndex: pickedSlot,
            kind,
            emoji,
            name,
            badgeColor,
            expiresAt: now + stayDuration,
          };
          changed = true;
        }
      }

      if (changed) {
        molesRef.current = current;
        setMoles({ ...current });
      }
    }, 240);

    return () => clearInterval(tickInterval);
  }, [gameState, buddyAvatar, buddyName]);

  const handleWhackSlot = useCallback(
    (slotIndex: number) => {
      if (gameState !== 'playing') return;
      const mole = molesRef.current[slotIndex];
      if (!mole || mole.isWhacked) return;

      // Remove whacked mole immediately
      const nextMoles = { ...molesRef.current };
      delete nextMoles[slotIndex];
      molesRef.current = nextMoles;
      setMoles(nextMoles);

      if (mole.kind === 'distraction') {
        comboRef.current += 1;
        const bonus = comboRef.current >= 4 ? 5 : 0;
        const pts = 10 + bonus;
        scoreRef.current += pts;
        setScore(scoreRef.current);
        setCombo(comboRef.current);
        playPopSound('bubble');
        addFeedback(slotIndex, `BONK! +${pts}`, 'text-amber-600 dark:text-amber-300');
      } else if (mole.kind === 'boss') {
        comboRef.current += 1;
        const pts = 25;
        scoreRef.current += pts;
        setScore(scoreRef.current);
        setCombo(comboRef.current);
        playPopSound('arcade');
        addFeedback(slotIndex, 'CRITICAL! +25 ⚡', 'text-yellow-500 font-black');
      } else if (mole.kind === 'friend') {
        comboRef.current = 0;
        livesRef.current -= 1;
        scoreRef.current = Math.max(0, scoreRef.current - 10);
        setCombo(0);
        setLives(livesRef.current);
        setScore(scoreRef.current);
        playBuzzSound();
        setIsScreenShake(true);
        setTimeout(() => setIsScreenShake(false), 320);
        addFeedback(slotIndex, `Jangan Pukul ${mole.name}! -1 ❤️`, 'text-rose-600 font-black');

        if (livesRef.current <= 0) {
          finishGame();
        }
      }
    },
    [gameState, addFeedback, finishGame]
  );

  // Allow keyboard 1-9 keys to whack slots
  useEffect(() => {
    if (!isOpen || gameState !== 'playing') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '1' && e.key <= '9') {
        const idx = Number(e.key) - 1;
        handleWhackSlot(idx);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, gameState, handleWhackSlot]);

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
    setMoles({});
    molesRef.current = {};
    onClose();
  };

  if (!isOpen) return null;

  const rewardInfo = calculateRewards(score);
  const isOverdrive = gameState === 'playing' && timeLeft <= 10;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={handleClaimAndClose}
    >
      <div
        className={`relative w-full max-w-md bg-[#faf8f5] dark:bg-slate-900 border-2 border-indigo-400 dark:border-indigo-500/60 rounded-3xl shadow-2xl overflow-hidden select-none transition-transform ${
          isScreenShake ? 'animate-bounce border-rose-500' : ''
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-indigo-100 via-purple-50 to-amber-100 dark:from-slate-800 dark:via-indigo-950/60 dark:to-slate-900 border-b border-indigo-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-2xl bg-indigo-500/15 border border-indigo-400/40 flex items-center justify-center text-lg shadow-2xs">
              👾
            </span>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
                  Procrastination Invaders
                </h3>
                <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-indigo-600 text-white">
                  Konami Code
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Pukul monster rasa malas, lindungi Ide Brilian! 🔨✨
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

        {/* HUD Bar */}
        <div className="px-4 py-2.5 bg-white/80 dark:bg-slate-800/70 border-b border-indigo-100 dark:border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1 font-extrabold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-slate-900 px-2.5 py-1 rounded-xl border border-indigo-200 dark:border-slate-700">
              <span>Skor:</span>
              <span className="text-sm text-indigo-600 dark:text-indigo-400">{score}</span>
            </div>

            {combo >= 3 && gameState === 'playing' && (
              <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 text-white font-black text-[10px] animate-pulse">
                {combo}x BONK! 💥
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
                isOverdrive
                  ? 'bg-rose-500 text-white border-rose-600 animate-pulse'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
              }`}
            >
              ⏱️ {timeLeft}s
            </div>
          </div>
        </div>

        {/* 3x3 Whack-a-Distraction Arena */}
        <div
          className={`relative p-5 min-h-[345px] flex flex-col items-center justify-center transition-colors ${
            isOverdrive
              ? 'bg-gradient-to-b from-rose-50/70 via-amber-50/40 to-indigo-50/70 dark:from-slate-900 dark:via-rose-950/30 dark:to-indigo-950/40'
              : 'bg-gradient-to-b from-indigo-50/40 via-amber-50/20 to-emerald-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800'
          }`}
        >
          {isOverdrive && (
            <div className="mb-2 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-rose-600 dark:text-rose-400 animate-pulse">
              <Zap className="w-3.5 h-3.5 fill-rose-500" />
              <span>OVERDRIVE! SERANGAN PROKRASTINASI MENINGKAT!</span>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3 w-full max-w-[340px]">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((slotIdx) => {
              const mole = moles[slotIdx];
              const slotFeedbacks = feedbacks.filter((f) => f.slotIndex === slotIdx);

              return (
                <button
                  key={slotIdx}
                  type="button"
                  onClick={() => handleWhackSlot(slotIdx)}
                  disabled={gameState !== 'playing'}
                  className={`relative h-24 rounded-2xl border-2 flex flex-col items-center justify-center transition-all overflow-hidden ${
                    mole
                      ? mole.kind === 'friend'
                        ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-400 dark:border-emerald-500 shadow-lg cursor-pointer active:scale-90'
                        : mole.kind === 'boss'
                          ? 'bg-amber-100 dark:bg-amber-950/80 border-amber-400 dark:border-amber-500 shadow-xl ring-2 ring-amber-400/60 cursor-pointer active:scale-90'
                          : 'bg-rose-50 dark:bg-rose-950/70 border-rose-300 dark:border-rose-600 shadow-lg cursor-pointer active:scale-90'
                      : 'bg-white/70 dark:bg-slate-800/70 border-slate-200/90 dark:border-slate-700/80 shadow-inner'
                  }`}
                >
                  {/* Key number hint in corner */}
                  <span className="absolute top-1.5 left-2 text-[9px] font-bold text-slate-300 dark:text-slate-600 pointer-events-none">
                    {slotIdx + 1}
                  </span>

                  {/* Desk hole shadow */}
                  <div className="absolute bottom-2 w-14 h-3 rounded-full bg-slate-900/10 dark:bg-black/35 pointer-events-none" />

                  {/* Active Mole */}
                  {mole && (
                    <div className="relative z-10 flex flex-col items-center animate-in zoom-in-75 slide-in-from-bottom-4 duration-150">
                      <span className="text-3xl sm:text-4xl drop-shadow-xs">
                        {mole.emoji}
                      </span>
                      <span
                        className={`mt-1 text-[9px] font-extrabold px-1.5 py-0.2 rounded-full shadow-2xs truncate max-w-[90px] ${mole.badgeColor}`}
                      >
                        {mole.name}
                      </span>
                    </div>
                  )}

                  {/* Floating BONK Feedback */}
                  {slotFeedbacks.map((fb) => (
                    <span
                      key={fb.id}
                      className={`absolute inset-x-1 top-2 z-20 text-[10px] font-black text-center pointer-events-none animate-in fade-in slide-out-to-top-4 duration-500 ${fb.colorClass}`}
                    >
                      {fb.text}
                    </span>
                  ))}
                </button>
              );
            })}
          </div>

          {/* READY OVERLAY */}
          {gameState === 'ready' && (
            <div className="absolute inset-0 z-20 bg-white/90 dark:bg-slate-900/92 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center text-4xl shadow-lg mb-3 animate-bounce">
                👾
              </div>

              <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700 mb-1.5">
                ↑ ↑ ↓ ↓ ← → ← → Terdeteksi!
              </span>

              <h4 className="text-base font-extrabold text-slate-800 dark:text-slate-100 mb-1">
                Basmi Monster Prokrastinasi! 🔨
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 max-w-xs mb-4 leading-relaxed">
                Klik cepat untuk memukul monster distraksi yang nongol di meja kerja, tapi <strong>jangan pukul Ide Brilian 💡 atau {buddyName} {buddyAvatar}</strong>!
              </p>

              <div className="grid grid-cols-2 gap-2 w-full max-w-xs mb-4 text-[11px]">
                <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 font-semibold flex flex-col items-center">
                  <span className="text-base">🦥 📱 🛌 👾</span>
                  <span>Pukul! (+10 / +25)</span>
                </div>
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 font-semibold flex flex-col items-center">
                  <span className="text-base">💡 {buddyAvatar}</span>
                  <span>Lindungi! (Jangan Klik)</span>
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
                className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-sm shadow-lg shadow-indigo-500/25 flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Mulai Basmi Distraksi!</span>
              </button>
            </div>
          )}

          {/* GAME OVER OVERLAY */}
          {gameState === 'ended' && (
            <div className="absolute inset-0 z-20 bg-white/92 dark:bg-slate-900/95 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-950/80 border-2 border-indigo-400 flex items-center justify-center text-4xl mb-2 shadow-md">
                {score >= 140 ? '🏆' : '🔨'}
              </div>

              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
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
                  <span>Hadiah Fokus untuk {buddyName}</span>
                </div>
                <div className="flex items-center justify-center gap-4 text-sm font-extrabold">
                  <span className="text-amber-700 dark:text-amber-300">
                    +{rewardInfo.treats} 🎁 Camilan
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
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <Hammer className="w-3.5 h-3.5 text-indigo-500" />
            <span>Klik lubang atau tekan tombol angka 1–9 di keyboard</span>
          </span>
          <span className="font-bold text-indigo-600 dark:text-indigo-400">↑↑↓↓←→←→</span>
        </div>
      </div>
    </div>
  );
};
