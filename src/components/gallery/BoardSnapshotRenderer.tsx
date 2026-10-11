'use client';

import React, { forwardRef } from 'react';
import { UserPreferences, BoardSticker } from '@/types/preferences';
import { Task } from '@/types/task';
import { getThemeConfig } from '@/lib/userPreferences';
import { getDisplayTasksForCapture, ScrambledTaskItem } from '@/lib/boardScrambler';

interface BoardSnapshotRendererProps {
  preferences: UserPreferences;
  tasks: Task[];
  privacyMode: 'cheerful' | 'original';
}

export const BoardSnapshotRenderer = forwardRef<HTMLDivElement, BoardSnapshotRendererProps>(
  ({ preferences, tasks, privacyMode }, ref) => {
    const themeConfig = getThemeConfig(preferences.theme || 'sunset', preferences.customTheme);
    const displayTasks: ScrambledTaskItem[] = getDisplayTasksForCapture(tasks, privacyMode);
    const stickers: BoardSticker[] = preferences.stickers || [];
    const mascot = preferences.deskBuddy || 'none';

    const columns = preferences.columns || {
      TODO: { title: 'Rencana Brilian', subtitle: 'Ide & tugas siap dieksekusi', emoji: '💡' },
      IN_PROGRESS: { title: 'Sedang Berjalan', subtitle: 'Fokus tuntaskan misi', emoji: '⏳' },
      DONE: { title: 'Misi Selesai', subtitle: 'Pencapaian hebat hari ini', emoji: '🎉' },
    };

    const todoTasks = displayTasks.filter((t) => t.status === 'TODO');
    const inProgressTasks = displayTasks.filter((t) => t.status === 'IN_PROGRESS');
    const doneTasks = displayTasks.filter((t) => t.status === 'DONE');

    return (
      <div
        ref={ref}
        style={{
          width: '1200px',
          height: '675px', // 16:9 ratio
          backgroundColor: preferences.customTheme?.bgHex || themeConfig.bgHex || '#faf8f5',
          backgroundImage: preferences.customBgUrl ? `url(${preferences.customBgUrl})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative',
          overflow: 'hidden',
          fontFamily: preferences.fontMood === 'handwriting' ? 'Caveat, cursive' : 'inherit',
        }}
        className="flex flex-col p-6 select-none"
      >
        {/* Dim and Blur Overlay */}
        {(preferences.bgDim || preferences.bgBlur) && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: `rgba(0,0,0,${(preferences.bgDim || 0) / 100})`,
              backdropFilter: preferences.bgBlur ? `blur(${preferences.bgBlur}px)` : undefined,
              pointerEvents: 'none',
              zIndex: 1,
            }}
          />
        )}

        {/* Board Top Header Banner */}
        <div
          style={{ zIndex: 10 }}
          className="flex items-center justify-between pb-4 border-b border-black/10 dark:border-white/10 shrink-0"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-400 text-white flex items-center justify-center text-2xl shadow-md">
              <span>{preferences.boardIcon || '📋'}</span>
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                {preferences.boardTitle || 'Papan Catatan Ceria'}
                {privacyMode === 'cheerful' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                    🎭 Teks Ceria
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                {preferences.dailyMotto || 'Kelola tugas lebih ringan & menyenangkan! ✨'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold bg-white/80 dark:bg-slate-900/80 px-3 py-1.5 rounded-xl shadow-xs border border-black/10">
            <span>🎨 Tema: {preferences.theme || 'sunset'}</span>
            <span>•</span>
            <span>✍️ Font: {preferences.fontMood || 'rounded'}</span>
          </div>
        </div>

        {/* 3 Columns Grid */}
        <div style={{ zIndex: 10 }} className="flex-1 grid grid-cols-3 gap-5 pt-4 min-h-0">
          {[
            { key: 'TODO', col: columns.TODO, taskList: todoTasks },
            { key: 'IN_PROGRESS', col: columns.IN_PROGRESS, taskList: inProgressTasks },
            { key: 'DONE', col: columns.DONE, taskList: doneTasks },
          ].map(({ key, col, taskList }) => (
            <div
              key={key}
              className="flex flex-col rounded-2xl bg-white/75 dark:bg-slate-900/75 backdrop-blur-md border border-black/10 dark:border-white/10 p-3.5 shadow-sm"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-black/10 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{col.emoji}</span>
                  <div>
                    <h3 className="text-xs font-black text-slate-800 dark:text-slate-100">{col.title}</h3>
                    <p className="text-[10px] text-slate-500">{col.subtitle}</p>
                  </div>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-slate-700 dark:text-slate-200">
                  {taskList.length}
                </span>
              </div>

              {/* Tasks List */}
              <div className="flex-1 flex flex-col gap-2.5 overflow-hidden">
                {taskList.slice(0, 3).map((task) => (
                  <div
                    key={task.id}
                    className="relative p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between"
                  >
                    {/* Washi Tape Mock Accent */}
                    {preferences.washiTapeStyle !== 'none' && (
                      <div
                        className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-14 h-3 bg-amber-200/80 dark:bg-amber-600/70 rounded-xs border-y border-dashed border-amber-400/60 -rotate-1 pointer-events-none"
                      />
                    )}

                    <div className="flex items-start justify-between gap-1 mb-1.5">
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                        {task.category}
                      </span>
                      {key === 'DONE' && (
                        <span className="text-[9px] font-black text-rose-600 border border-rose-300 px-1 rounded-sm -rotate-6">
                          {preferences.completionStamp || 'SELESAI!'}
                        </span>
                      )}
                    </div>

                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100 line-clamp-2 leading-snug">
                      {task.title}
                    </p>

                    {task.dueDateStr && (
                      <div className="mt-1.5 text-[9px] font-semibold text-slate-400">
                        🗓️ {task.dueDateStr}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Floating Corkboard Stickers Layer */}
        <div style={{ zIndex: 20 }} className="absolute inset-0 pointer-events-none">
          {stickers.map((s) => (
            <div
              key={s.id}
              style={{
                position: 'absolute',
                left: `${s.x}%`,
                top: `${s.y}%`,
                transform: `rotate(${s.rotation}deg) scale(${s.scale || 1})`,
                maxWidth: s.imageUrl ? `${s.width ? s.width * 0.75 : 180}px` : undefined,
              }}
            >
              {s.imageUrl ? (
                <div className="rounded-xl overflow-hidden shadow-2xl border-2 border-white/95 bg-white/95">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.imageUrl} alt={s.text || 'Stiker'} className="w-full h-auto object-contain" />
                </div>
              ) : (
                <span className="text-4xl drop-shadow-lg filter">{s.emoji}</span>
              )}
            </div>
          ))}
        </div>

        {/* Desk Buddy Mascot in Snapshot */}
        {mascot !== 'none' && (
          <div
            style={{ zIndex: 30 }}
            className={`absolute pointer-events-none ${
              preferences.deskBuddyPosition === 'top-left'
                ? 'top-4 left-4'
                : preferences.deskBuddyPosition === 'top-right'
                ? 'top-4 right-4'
                : preferences.deskBuddyPosition === 'bottom-right'
                ? 'bottom-4 right-4'
                : 'bottom-4 left-4'
            }`}
          >
            <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-xl border border-amber-200 dark:border-slate-700 flex items-center gap-2">
              <span className="text-2xl">
                {mascot === 'cat'
                  ? '🐱'
                  : mascot === 'dog'
                  ? '🐶'
                  : mascot === 'plant'
                  ? '🌱'
                  : mascot === 'coffee'
                  ? '☕'
                  : mascot === 'owl'
                  ? '🦉'
                  : mascot === 'robot'
                  ? '🤖'
                  : mascot === 'toast'
                  ? '🍞'
                  : '🐾'}
              </span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                {preferences.deskBuddyCustomName || 'Teman Meja'}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }
);

BoardSnapshotRenderer.displayName = 'BoardSnapshotRenderer';
