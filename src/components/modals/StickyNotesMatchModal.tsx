'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Trophy, Sparkles, Clock, Footprints, CheckCircle2, StickyNote } from 'lucide-react';
import { SoundProfile } from '@/types/preferences';
import { playPopSound, playVictoryChime } from '@/lib/soundEffects';
import { triggerCelebration } from '@/lib/confetti';

interface StickyNotesMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  triggerWord?: string;
  soundProfile?: SoundProfile;
  onClaimReward?: (earnedTreats: number, earnedHearts: number) => void;
}

interface CardPairConfig {
  pairId: string;
  emoji: string;
  label: string;
  noteBg: string;
  tapeBg: string;
}

interface MemoryCard {
  id: number;
  pairId: string;
  emoji: string;
  label: string;
  noteBg: string;
  tapeBg: string;
  rotation: number;
  isFlipped: boolean;
  isMatched: boolean;
}

const CARD_PAIRS_POOL: CardPairConfig[] = [
  {
    pairId: 'cat',
    emoji: '🐱',
    label: 'Mimi Kucing',
    noteBg: 'bg-amber-100 dark:bg-amber-950/80 border-amber-300 dark:border-amber-700',
    tapeBg: 'bg-amber-300/70 dark:bg-amber-500/40',
  },
  {
    pairId: 'dog',
    emoji: '🐶',
    label: 'Bobi Anjing',
    noteBg: 'bg-orange-100 dark:bg-orange-950/80 border-orange-300 dark:border-orange-700',
    tapeBg: 'bg-orange-300/70 dark:bg-orange-500/40',
  },
  {
    pairId: 'coffee',
    emoji: '☕',
    label: 'Kopi Fokus',
    noteBg: 'bg-rose-100 dark:bg-rose-950/80 border-rose-300 dark:border-rose-700',
    tapeBg: 'bg-rose-300/70 dark:bg-rose-500/40',
  },
  {
    pairId: 'plant',
    emoji: '🌱',
    label: 'Moko Sukulen',
    noteBg: 'bg-emerald-100 dark:bg-emerald-950/80 border-emerald-300 dark:border-emerald-700',
    tapeBg: 'bg-emerald-300/70 dark:bg-emerald-500/40',
  },
  {
    pairId: 'owl',
    emoji: '🦉',
    label: 'Hooti Bijak',
    noteBg: 'bg-purple-100 dark:bg-purple-950/80 border-purple-300 dark:border-purple-700',
    tapeBg: 'bg-purple-300/70 dark:bg-purple-500/40',
  },
  {
    pairId: 'toast',
    emoji: '🍞',
    label: 'Roti Manis',
    noteBg: 'bg-yellow-100 dark:bg-yellow-950/80 border-yellow-300 dark:border-yellow-700',
    tapeBg: 'bg-yellow-300/70 dark:bg-yellow-500/40',
  },
  {
    pairId: 'rocket',
    emoji: '🚀',
    label: 'Misi Sukses',
    noteBg: 'bg-sky-100 dark:bg-sky-950/80 border-sky-300 dark:border-sky-700',
    tapeBg: 'bg-sky-300/70 dark:bg-sky-500/40',
  },
  {
    pairId: 'robot',
    emoji: '🤖',
    label: 'Bip-Bop',
    noteBg: 'bg-indigo-100 dark:bg-indigo-950/80 border-indigo-300 dark:border-indigo-700',
    tapeBg: 'bg-indigo-300/70 dark:bg-indigo-500/40',
  },
];

const BEST_MOVES_KEY = 'ceria_sticky_match_best_moves';

function createShuffledDeck(pairCount: number = 6): MemoryCard[] {
  const selectedPairs = CARD_PAIRS_POOL.slice(0, pairCount);
  const rawCards = [...selectedPairs, ...selectedPairs];

  // Fisher-Yates shuffle
  for (let i = rawCards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rawCards[i], rawCards[j]] = [rawCards[j], rawCards[i]];
  }

  const rotations = [-2, 1.5, -1, 2, -1.5, 1, -2.5, 2.5, -1, 1.5, -2, 1];
  return rawCards.map((pair, idx) => ({
    id: idx + 1,
    pairId: pair.pairId,
    emoji: pair.emoji,
    label: pair.label,
    noteBg: pair.noteBg,
    tapeBg: pair.tapeBg,
    rotation: rotations[idx % rotations.length],
    isFlipped: false,
    isMatched: false,
  }));
}

export const StickyNotesMatchModal: React.FC<StickyNotesMatchModalProps> = ({
  isOpen,
  onClose,
  triggerWord = 'rehat',
  soundProfile = 'pop',
  onClaimReward,
}) => {
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [flippedIds, setFlippedIds] = useState<number[]>([]);
  const [moves, setMoves] = useState<number>(0);
  const [matchedPairs, setMatchedPairs] = useState<number>(0);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [rewardClaimed, setRewardClaimed] = useState<boolean>(false);
  const [bestMoves, setBestMoves] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      return Number(localStorage.getItem(BEST_MOVES_KEY)) || 0;
    }
    return 0;
  });

  const totalPairs = 6;
  const mismatchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Reset and shuffle a fresh board whenever opened
  useEffect(() => {
    if (!isOpen) return;
    const initTimer = setTimeout(() => {
      setCards(createShuffledDeck(6));
      setFlippedIds([]);
      setMoves(0);
      setMatchedPairs(0);
      setElapsedSeconds(0);
      setIsCompleted(false);
      setIsLocked(false);
      setRewardClaimed(false);
    }, 0);
    return () => clearTimeout(initTimer);
  }, [isOpen]);

  // Timer while game is active
  useEffect(() => {
    if (!isOpen || isCompleted) return;

    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, isCompleted]);

  useEffect(() => {
    return () => {
      if (mismatchTimeoutRef.current) {
        clearTimeout(mismatchTimeoutRef.current);
      }
    };
  }, []);

  const calculateRewards = useCallback((totalMoves: number) => {
    if (totalMoves <= 9) {
      return { treats: 3, hearts: 2, rank: 'Ingatan Super Tajam! 🧠👑' };
    }
    if (totalMoves <= 14) {
      return { treats: 2, hearts: 2, rank: 'Fokus & Teliti! 🌟✨' };
    }
    return { treats: 1, hearts: 1, rank: 'Pikiran Segar Kembali! 🍃🐾' };
  }, []);

  const handleCardClick = (clickedCard: MemoryCard) => {
    if (isLocked || isCompleted || clickedCard.isFlipped || clickedCard.isMatched) {
      return;
    }

    playPopSound(soundProfile);

    const nextFlipped = [...flippedIds, clickedCard.id];
    setFlippedIds(nextFlipped);
    setCards((prev) =>
      prev.map((c) => (c.id === clickedCard.id ? { ...c, isFlipped: true } : c))
    );

    if (nextFlipped.length === 2) {
      const nextMoves = moves + 1;
      setMoves(nextMoves);
      setIsLocked(true);

      const firstCard = cards.find((c) => c.id === nextFlipped[0]);
      const secondCard = clickedCard;

      if (firstCard && firstCard.pairId === secondCard.pairId) {
        // Match found!
        setTimeout(() => {
          playPopSound('bubble');
          setCards((prev) =>
            prev.map((c) =>
              c.pairId === firstCard.pairId ? { ...c, isMatched: true, isFlipped: true } : c
            )
          );
          setFlippedIds([]);
          setIsLocked(false);

          const nextMatched = matchedPairs + 1;
          setMatchedPairs(nextMatched);

          if (nextMatched === totalPairs) {
            setIsCompleted(true);
            playVictoryChime('arcade');
            triggerCelebration('confetti');

            if (bestMoves === 0 || nextMoves < bestMoves) {
              setBestMoves(nextMoves);
              if (typeof window !== 'undefined') {
                localStorage.setItem(BEST_MOVES_KEY, String(nextMoves));
              }
            }
          }
        }, 280);
      } else {
        // Not a match — flip back after short delay
        mismatchTimeoutRef.current = setTimeout(() => {
          setCards((prev) =>
            prev.map((c) =>
              nextFlipped.includes(c.id) ? { ...c, isFlipped: false } : c
            )
          );
          setFlippedIds([]);
          setIsLocked(false);
        }, 680);
      }
    }
  };

  const handleClaimAndClose = () => {
    if (mismatchTimeoutRef.current) {
      clearTimeout(mismatchTimeoutRef.current);
      mismatchTimeoutRef.current = null;
    }
    if (isCompleted && !rewardClaimed) {
      const reward = calculateRewards(moves);
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
    onClose();
  };

  if (!isOpen) return null;

  const rewardInfo = calculateRewards(moves);
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={handleClaimAndClose}
    >
      <div
        className="relative w-full max-w-lg bg-[#faf8f5] dark:bg-slate-900 border-2 border-amber-300 dark:border-amber-500/50 rounded-3xl shadow-2xl overflow-hidden select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-amber-100 via-yellow-50 to-orange-100 dark:from-slate-800 dark:via-slate-800 dark:to-slate-900 border-b border-amber-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-2xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-lg shadow-2xs">
              📌
            </span>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
                  Sticky Notes Match
                </h3>
                <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-amber-500 text-white">
                  Kode: &quot;{triggerWord.toUpperCase()}&quot;
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Rehat sejenak & cocokkan pasangan catatan tempel! 🧠✨
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

        {/* Status Bar: Moves, Pairs, Time, Best */}
        <div className="px-5 py-2.5 bg-white/80 dark:bg-slate-800/70 border-b border-amber-100 dark:border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 font-bold text-slate-700 dark:text-slate-200 bg-amber-50 dark:bg-slate-900 px-2.5 py-1 rounded-xl border border-amber-200/80 dark:border-slate-700">
              <Footprints className="w-3.5 h-3.5 text-amber-500" />
              <span>Langkah:</span>
              <span className="font-extrabold text-amber-600 dark:text-amber-400">{moves}</span>
            </div>

            <div className="flex items-center gap-1 font-bold text-slate-700 dark:text-slate-200 bg-emerald-50 dark:bg-slate-900 px-2.5 py-1 rounded-xl border border-emerald-200/80 dark:border-slate-700">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>
                {matchedPairs}/{totalPairs} Cocok
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {bestMoves > 0 && (
              <div
                className="hidden sm:flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400"
                title="Rekor Langkah Terhemat"
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>Rekor: {bestMoves}</span>
              </div>
            )}

            <div className="flex items-center gap-1 font-extrabold px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
              <Clock className="w-3.5 h-3.5 text-sky-500" />
              <span>{formatTime(elapsedSeconds)}</span>
            </div>
          </div>
        </div>

        {/* Sticky Notes Grid Arena */}
        <div
          className="relative p-5 min-h-[340px] flex items-center justify-center"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(148, 163, 184, 0.22) 1.2px, transparent 1.2px)',
            backgroundSize: '16px 16px',
          }}
        >
          <div className="grid grid-cols-4 gap-3 sm:gap-3.5 w-full">
            {cards.map((card) => {
              const isRevealed = card.isFlipped || card.isMatched;

              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => handleCardClick(card)}
                  disabled={isRevealed || isLocked}
                  style={{
                    transform: `rotate(${isRevealed ? 0 : card.rotation}deg)`,
                  }}
                  className={`group relative h-24 sm:h-28 rounded-xl border-2 p-2 flex flex-col items-center justify-center transition-all duration-200 shadow-md ${
                    isRevealed
                      ? `${card.noteBg} scale-100 shadow-lg`
                      : 'bg-gradient-to-br from-amber-200 via-yellow-100 to-amber-100 dark:from-slate-800 dark:via-slate-800 dark:to-slate-700 border-amber-300/90 dark:border-slate-600 hover:scale-105 hover:-translate-y-0.5 hover:shadow-xl cursor-pointer active:scale-95'
                  } ${card.isMatched ? 'ring-2 ring-emerald-400 dark:ring-emerald-500' : ''}`}
                >
                  {/* Washi Tape on Top of Sticky Note */}
                  <div
                    className={`absolute -top-2 left-1/2 -translate-x-1/2 w-10 h-3.5 rounded-xs shadow-2xs pointer-events-none ${
                      isRevealed
                        ? card.tapeBg
                        : 'bg-amber-400/50 dark:bg-amber-500/30 group-hover:bg-amber-400/70'
                    }`}
                  />

                  {isRevealed ? (
                    <div className="flex flex-col items-center justify-center animate-in zoom-in-75 duration-150">
                      <span className="text-3xl sm:text-4xl drop-shadow-xs mb-1">
                        {card.emoji}
                      </span>
                      <span className="text-[10px] font-extrabold text-slate-700 dark:text-slate-200 leading-tight text-center">
                        {card.label}
                      </span>
                      {card.isMatched && (
                        <span className="absolute top-1.5 right-1.5 text-[9px] font-black px-1 rounded bg-emerald-500 text-white shadow-2xs">
                          ✓
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-amber-700/60 dark:text-slate-400 group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors">
                      <StickyNote className="w-6 h-6 mb-0.5 opacity-75" />
                      <span className="text-[10px] font-extrabold uppercase tracking-wider">
                        Buka
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* VICTORY OVERLAY */}
          {isCompleted && (
            <div className="absolute inset-0 z-20 bg-white/92 dark:bg-slate-900/95 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-950/80 border-2 border-amber-400 flex items-center justify-center text-4xl mb-2 shadow-md animate-bounce">
                🎉
              </div>

              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                {rewardInfo.rank}
              </span>
              <h4 className="text-xl font-black text-slate-800 dark:text-slate-100 mt-0.5">
                Semua Catatan Cocok!
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 mb-3">
                Selesai dalam <strong>{moves} langkah</strong> ({formatTime(elapsedSeconds)})
              </p>

              {/* Reward Box */}
              <div className="w-full max-w-xs p-3 rounded-2xl bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 dark:from-slate-800 dark:to-slate-800/80 border border-amber-300 dark:border-amber-500/40 mb-4 shadow-xs">
                <div className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 mb-1.5 flex items-center justify-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>Bonus Istirahat untuk Desk Buddy</span>
                </div>
                <div className="flex items-center justify-center gap-4 text-sm font-extrabold">
                  <span className="text-amber-700 dark:text-amber-300">
                    +{rewardInfo.treats} 🎁 Camilan
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

        {/* Footer */}
        <div className="px-5 py-2.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span>💡 Tips: Semakin sedikit langkah, semakin besar hadiah camilan!</span>
          <span className="font-semibold text-amber-600 dark:text-amber-400">6 Pasang Kartu</span>
        </div>
      </div>
    </div>
  );
};
