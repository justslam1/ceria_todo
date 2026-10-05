'use client';

import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, X, Volume2, CloudRain, Flame, Coffee, Minimize2, Maximize2, Sparkles, CheckCircle2 } from 'lucide-react';
import { ambientSound, AmbientSoundType } from '@/lib/ambientSound';
import { playVictoryChime, playPopSound } from '@/lib/soundEffects';
import { triggerCelebration } from '@/lib/confetti';
import { SoundProfile } from '@/types/preferences';
import { Task } from '@/types/task';

interface PomodoroBarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTask?: Task | null;
  activeTaskTitle?: string | null;
  onTaskComplete?: (taskId: string) => void;
  onClearTask?: () => void;
  soundProfile?: SoundProfile;
}

export const PomodoroBar: React.FC<PomodoroBarProps> = ({
  isOpen,
  onClose,
  activeTask,
  activeTaskTitle,
  onTaskComplete,
  onClearTask,
  soundProfile = 'pop',
}) => {
  const [mode, setMode] = useState<'work' | 'shortBreak' | 'longBreak'>('work');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [ambient, setAmbient] = useState<AmbientSoundType>('none');
  const [isMinimized, setIsMinimized] = useState(false);

  const effectiveTitle = activeTask?.title || activeTaskTitle;

  // Timer duration in seconds based on mode
  const getDuration = (m: 'work' | 'shortBreak' | 'longBreak') => {
    switch (m) {
      case 'work':
        return 25 * 60;
      case 'shortBreak':
        return 5 * 60;
      case 'longBreak':
        return 15 * 60;
    }
  };

  const switchMode = (newMode: 'work' | 'shortBreak' | 'longBreak') => {
    playPopSound(soundProfile);
    setMode(newMode);
    setTimeLeft(getDuration(newMode));
    setIsRunning(false);
  };

  // Timer Tick Effect
  useEffect(() => {
    if (!isRunning) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsRunning(false);
          playVictoryChime(soundProfile);
          triggerCelebration('confetti');

          // Browser notification if permitted
          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            new Notification('Waktu Sesi Selesai! 🎉', {
              body: mode === 'work' ? 'Sesi fokus tuntas! Istirahat sejenak yuk.' : 'Waktu istirahat selesai! Siap fokus lagi?',
            });
          }

          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, mode, soundProfile]);

  // Ambient sound handler
  const handleAmbientChange = (type: AmbientSoundType) => {
    playPopSound(soundProfile);
    setAmbient(type);
    ambientSound.play(type);
  };

  const handleClose = () => {
    ambientSound.stop();
    setAmbient('none');
    setIsRunning(false);
    onClose();
  };

  // Cleanup sound on unmount or close
  useEffect(() => {
    if (!isOpen) {
      ambientSound.stop();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const totalDuration = getDuration(mode);
  const progressPercent = Math.round(((totalDuration - timeLeft) / totalDuration) * 100);

  // Minimized Compact Pill Mode
  if (isMinimized) {
    return (
      <div className="fixed bottom-5 right-5 z-40 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center gap-2 p-2 px-3.5 bg-slate-900/90 hover:bg-slate-900 backdrop-blur-md text-white rounded-full border border-slate-700/80 shadow-2xl transition-all">
          <button
            type="button"
            onClick={() => {
              playPopSound(soundProfile);
              setIsRunning(!isRunning);
            }}
            className="w-7 h-7 rounded-full bg-orange-500 hover:bg-orange-600 flex items-center justify-center text-white cursor-pointer active:scale-95"
            title={isRunning ? 'Jeda' : 'Mulai'}
          >
            {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
          </button>

          <span className="font-mono font-bold text-sm tracking-wider text-amber-300">
            {timeFormatted}
          </span>

          <span className="text-[11px] text-slate-300 max-w-[120px] truncate">
            {effectiveTitle || (mode === 'work' ? 'Fokus' : 'Istirahat')}
          </span>

          <button
            type="button"
            onClick={() => setIsMinimized(false)}
            className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer ml-1"
            title="Buka panel penuh"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-5 right-5 z-40 max-w-sm w-[calc(100vw-40px)] animate-in fade-in slide-in-from-bottom-3 duration-200">
      <div className="p-4 rounded-3xl bg-slate-900/95 backdrop-blur-md text-white border border-slate-700/80 shadow-2xl flex flex-col gap-3">
        {/* Header Bar */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center text-xs">
              ⏱️
            </div>
            <span className="font-bold text-xs text-slate-200">Pomodoro Timer & Suara Cozy</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIsMinimized(true)}
              className="p-1 text-slate-400 hover:text-slate-200 rounded-lg cursor-pointer"
              title="Perkecil ke tombol ringkas"
            >
              <Minimize2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="p-1 text-slate-400 hover:text-rose-400 rounded-lg cursor-pointer"
              title="Tutup timer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-3 gap-1 bg-slate-800/80 p-1 rounded-2xl text-[11px] font-bold text-center">
          <button
            type="button"
            onClick={() => switchMode('work')}
            className={`py-1 rounded-xl transition-all cursor-pointer ${
              mode === 'work' ? 'bg-orange-500 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            Fokus (25m)
          </button>
          <button
            type="button"
            onClick={() => switchMode('shortBreak')}
            className={`py-1 rounded-xl transition-all cursor-pointer ${
              mode === 'shortBreak' ? 'bg-emerald-500 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            Rehat (5m)
          </button>
          <button
            type="button"
            onClick={() => switchMode('longBreak')}
            className={`py-1 rounded-xl transition-all cursor-pointer ${
              mode === 'longBreak' ? 'bg-sky-500 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            Santai (15m)
          </button>
        </div>

        {/* Active Task Focus Info */}
        {effectiveTitle && (
          <div className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-orange-500/10 border border-orange-500/30 text-xs">
            <div className="flex items-center gap-1.5 min-w-0">
              <Sparkles className="w-3.5 h-3.5 text-orange-400 shrink-0" />
              <span className="truncate text-orange-200 font-medium">
                Misi: <strong className="text-white font-bold">{effectiveTitle}</strong>
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {activeTask && onTaskComplete && (
                <button
                  type="button"
                  onClick={() => onTaskComplete(activeTask.id)}
                  className="px-2 py-0.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold cursor-pointer shrink-0 shadow-2xs flex items-center gap-1"
                  title="Tandai tugas ini selesai 🎉"
                >
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Selesai</span>
                </button>
              )}
              {onClearTask && (
                <button
                  type="button"
                  onClick={onClearTask}
                  className="text-slate-400 hover:text-white text-[10px] cursor-pointer shrink-0"
                  title="Lepas tugas aktif"
                >
                  Ganti
                </button>
              )}
            </div>
          </div>
        )}

        {/* Countdown Display & Progress Bar */}
        <div className="flex flex-col items-center justify-center py-2 gap-1.5">
          <div className="font-mono font-black text-4xl sm:text-5xl tracking-widest text-white drop-shadow-xs">
            {timeFormatted}
          </div>

          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
            <div
              className={`h-full transition-all duration-500 ${
                mode === 'work' ? 'bg-orange-500' : mode === 'shortBreak' ? 'bg-emerald-500' : 'bg-sky-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Timer Control Buttons */}
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              playPopSound(soundProfile);
              setTimeLeft(getDuration(mode));
              setIsRunning(false);
            }}
            className="p-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer active:scale-95 transition-transform"
            title="Reset waktu"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => {
              playPopSound(soundProfile);
              setIsRunning(!isRunning);
            }}
            className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-sm shadow-lg shadow-orange-500/20 active:scale-95 cursor-pointer transition-all"
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4" />
                <span>Jeda</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Mulai Fokus</span>
              </>
            )}
          </button>
        </div>

        {/* Ambient Sound Selector */}
        <div className="pt-2 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5 font-medium">
            <span className="flex items-center gap-1">
              <Volume2 className="w-3 h-3 text-amber-400" />
              <span>Suara Latar (Ambient Cozy):</span>
            </span>
            <span className="text-[10px] text-slate-500">
              {ambient === 'none' ? 'Mati' : ambient.toUpperCase()}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1.5 text-[11px]">
            <button
              type="button"
              onClick={() => handleAmbientChange('none')}
              className={`py-1 rounded-xl border text-center transition-all cursor-pointer ${
                ambient === 'none'
                  ? 'bg-slate-800 border-amber-400 text-amber-300 font-bold'
                  : 'bg-slate-850 border-slate-700/60 text-slate-400 hover:text-white'
              }`}
            >
              Hening
            </button>
            <button
              type="button"
              onClick={() => handleAmbientChange('rain')}
              className={`py-1 rounded-xl border flex items-center justify-center gap-1 transition-all cursor-pointer ${
                ambient === 'rain'
                  ? 'bg-sky-950/60 border-sky-400 text-sky-300 font-bold'
                  : 'bg-slate-850 border-slate-700/60 text-slate-400 hover:text-white'
              }`}
            >
              <CloudRain className="w-3 h-3 text-sky-400" />
              <span>Hujan</span>
            </button>
            <button
              type="button"
              onClick={() => handleAmbientChange('fire')}
              className={`py-1 rounded-xl border flex items-center justify-center gap-1 transition-all cursor-pointer ${
                ambient === 'fire'
                  ? 'bg-orange-950/60 border-orange-400 text-orange-300 font-bold'
                  : 'bg-slate-850 border-slate-700/60 text-slate-400 hover:text-white'
              }`}
            >
              <Flame className="w-3 h-3 text-orange-400" />
              <span>Api</span>
            </button>
            <button
              type="button"
              onClick={() => handleAmbientChange('cafe')}
              className={`py-1 rounded-xl border flex items-center justify-center gap-1 transition-all cursor-pointer ${
                ambient === 'cafe'
                  ? 'bg-amber-950/60 border-amber-400 text-amber-300 font-bold'
                  : 'bg-slate-850 border-slate-700/60 text-slate-400 hover:text-white'
              }`}
            >
              <Coffee className="w-3 h-3 text-amber-400" />
              <span>Kafe</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
