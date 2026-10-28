'use client';

import React, { useState, useEffect } from 'react';
import { X, History, CheckCircle2, PlusCircle, UserCheck, RefreshCw } from 'lucide-react';
import { ThemeConfig } from '@/types/preferences';
import { BoardActivityItem } from '@/types/task';

interface BoardActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  boardId: string | null;
  boardTitle?: string;
  themeConfig: ThemeConfig;
}

export const BoardActivityModal: React.FC<BoardActivityModalProps> = ({
  isOpen,
  onClose,
  boardId,
  boardTitle,
  themeConfig,
}) => {
  const [activities, setActivities] = useState<BoardActivityItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchActivities = React.useCallback(async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/boards/${id}/activities`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setActivities(data.data);
      }
    } catch (err) {
      console.error('Error fetching activities:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen || !boardId) return;
    const timer = setTimeout(() => {
      fetchActivities(boardId);
    }, 0);
    return () => clearTimeout(timer);
  }, [isOpen, boardId, fetchActivities]);

  if (!isOpen || !boardId) return null;

function formatActivityTime(isoString: string): string {
  if (!isoString) return '';
  const d = new Date(isoString);
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getActionIcon(action: string) {
  switch (action) {
    case 'TASK_COMPLETED':
      return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    case 'TASK_ASSIGNED':
      return <UserCheck className="w-4 h-4 text-blue-500" />;
    case 'TASK_CREATED':
    default:
      return <PlusCircle className="w-4 h-4 text-amber-500" />;
  }
}

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className={`w-full max-w-md rounded-3xl border shadow-2xl overflow-hidden p-6 transition-all duration-200 ${
          themeConfig.isDark
            ? 'bg-slate-900 border-slate-800 text-white'
            : 'bg-white border-amber-100 text-slate-800'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-2xl bg-amber-500/10 text-amber-500">
              <History className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-black">Aktivitas Papan</h3>
              <p className="text-xs text-slate-400 truncate max-w-[220px]">
                {boardTitle || 'Papan'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => fetchActivities(boardId)}
              disabled={loading}
              className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer disabled:opacity-50"
              title="Segarkan aktivitas"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="pt-4 max-h-80 overflow-y-auto space-y-2.5">
          {loading && activities.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 animate-pulse">
              Memuat aktivitas papan...
            </div>
          ) : activities.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Belum ada aktivitas tercatat pada papan ini.
            </div>
          ) : (
            activities.map((item) => (
              <div
                key={item.id}
                className={`p-3 rounded-2xl border flex items-start gap-3 text-xs ${
                  themeConfig.isDark
                    ? 'bg-slate-800/40 border-slate-800'
                    : 'bg-slate-50 border-slate-100'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {getActionIcon(item.action)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="font-bold text-slate-700 dark:text-slate-200 truncate">
                      {item.userName || 'Seseorang'}
                    </span>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {formatActivityTime(item.createdAt)}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 break-words leading-relaxed text-[11px]">
                    {item.details || item.action}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
