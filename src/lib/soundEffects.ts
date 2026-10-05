/**
 * Lightweight Web Audio API Synthesizer for Ceria Todo.
 * No external audio files or network requests needed.
 */
import { SoundProfile } from '@/types/preferences';

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;

  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }

  // Resume suspended audio context if needed
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  return audioCtx;
}

// Sound state management
const MUTE_STORAGE_KEY = 'ceria_todo_sound_muted';

export function isSoundMuted(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(MUTE_STORAGE_KEY) === 'true';
}

export function setSoundMuted(muted: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(MUTE_STORAGE_KEY, muted ? 'true' : 'false');
}

/**
 * Action sound for dragging, dropping, or moving tasks between columns.
 */
export function playPopSound(profile: SoundProfile = 'pop'): void {
  if (isSoundMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (profile === 'arcade') {
      // 8-bit retro coin blip
      osc.type = 'square';
      osc.frequency.setValueAtTime(987.77, now); // B5
      osc.frequency.setValueAtTime(1318.51, now + 0.04); // E6
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (profile === 'bubble') {
      // Cute bubble pop ("bloop")
      osc.type = 'sine';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(840, now + 0.06);
      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    } else {
      // Standard smooth pop
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.09);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.1);
    }
  } catch (err) {
    console.warn('Could not play pop sound:', err);
  }
}

/**
 * Cheerful victory chime / fanfare when a task reaches "Misi Sukses".
 */
export function playVictoryChime(profile: SoundProfile = 'pop'): void {
  if (isSoundMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    if (profile === 'arcade') {
      // 8-bit retro victory fanfare
      const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5]; // C5, E5, G5, C6, E6
      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        const noteStart = now + index * 0.07;
        const noteDuration = index === notes.length - 1 ? 0.35 : 0.1;

        osc.frequency.setValueAtTime(freq, noteStart);
        gain.gain.setValueAtTime(0.12, noteStart);
        gain.gain.exponentialRampToValueAtTime(0.001, noteStart + noteDuration);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(noteStart);
        osc.stop(noteStart + noteDuration);
      });
    } else if (profile === 'bubble') {
      // Gentle water chime
      const notes = [587.33, 739.99, 880.0, 1174.66]; // D5, F#5, A5, D6
      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        const noteStart = now + index * 0.08;
        const noteDuration = 0.3;

        osc.frequency.setValueAtTime(freq, noteStart);
        gain.gain.setValueAtTime(0.2, noteStart);
        gain.gain.exponentialRampToValueAtTime(0.001, noteStart + noteDuration);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(noteStart);
        osc.stop(noteStart + noteDuration);
      });
    } else {
      // Standard C-Major arpeggio
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        const noteStart = now + index * 0.09;
        const noteDuration = 0.35;

        osc.frequency.setValueAtTime(freq, noteStart);
        gain.gain.setValueAtTime(0.18, noteStart);
        gain.gain.exponentialRampToValueAtTime(0.001, noteStart + noteDuration);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(noteStart);
        osc.stop(noteStart + noteDuration);
      });
    }
  } catch (err) {
    console.warn('Could not play victory chime:', err);
  }
}
