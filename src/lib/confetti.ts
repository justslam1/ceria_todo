import confetti from 'canvas-confetti';
import { CelebrationFx } from '@/types/preferences';

/**
 * Triggers celebratory visual effect for completed tasks ("Misi Sukses")
 * based on user's chosen CelebrationFx preference.
 */
export function triggerCelebration(fx: CelebrationFx = 'confetti') {
  if (fx === 'none') return;

  if (fx === 'stars') {
    // Golden & sparkling stars shower
    const defaults = {
      spread: 360,
      ticks: 100,
      gravity: 0.6,
      decay: 0.94,
      startVelocity: 30,
      shapes: ['star'] as confetti.Shape[],
      colors: ['#FFE840', '#FFA940', '#FF7A45', '#FFF566', '#FFD666', '#FFC069'],
    };

    confetti({
      ...defaults,
      particleCount: 50,
      scalar: 1.2,
      origin: { y: 0.6 },
    });

    setTimeout(() => {
      confetti({
        ...defaults,
        particleCount: 40,
        scalar: 0.8,
        origin: { y: 0.5 },
      });
    }, 200);
    return;
  }

  if (fx === 'fireworks') {
    // Dramatic dual-sided fireworks bursts
    const count = 3;
    const interval = 250;
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        // Left launcher
        confetti({
          startVelocity: 45,
          spread: 70,
          ticks: 80,
          origin: { x: 0.2, y: 0.85 },
          colors: ['#FF5964', '#35A7FF', '#FFE74C', '#38E54D', '#A259FF'],
        });
        // Right launcher
        confetti({
          startVelocity: 45,
          spread: 70,
          ticks: 80,
          origin: { x: 0.8, y: 0.85 },
          colors: ['#FF5964', '#35A7FF', '#FFE74C', '#38E54D', '#A259FF'],
        });
      }, i * interval);
    }
    return;
  }

  // Default: Cheerful multi-stage confetti burst
  const count = 200;
  const defaults = {
    origin: { y: 0.7 },
    colors: ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6', '#fbbf24', '#34d399'],
  };

  function fire(particleRatio: number, opts: confetti.Options) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    });
  }

  fire(0.25, {
    spread: 26,
    startVelocity: 55,
  });

  fire(0.2, {
    spread: 60,
  });

  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8,
  });

  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2,
  });

  fire(0.1, {
    spread: 120,
    startVelocity: 45,
  });
}

// Backward-compatible alias
export const triggerCelebrationConfetti = () => triggerCelebration('confetti');
