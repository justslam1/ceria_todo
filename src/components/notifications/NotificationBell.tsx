'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Bell, CheckCheck, Trash2, UserCheck, UserPlus, Info, ExternalLink } from 'lucide-react';
import { ThemeConfig } from '@/types/preferences';

export interface AppNotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'TASK_ASSIGNED' | 'BOARD_JOINED' | 'INFO' | string;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
}

interface NotificationBellProps {
  themeConfig: ThemeConfig;
  isPlayful?: boolean;
}

function formatNotificationTime(isoString: string): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'Baru saja';
  if (diffMin < 60) return `${diffMin}m lalu`;
  if (diffHour < 24) return `${diffHour}j lalu`;
  if (diffDay < 7) return `${diffDay}h lalu`;

  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  themeConfig,
  isPlayful = false,
}) => {
  const { status } = useSession();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    if (status !== 'authenticated') return;
    try {
      const res = await fetch('/api/notifications?limit=25');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setNotifications(data.data);
          setUnreadCount(typeof data.unreadCount === 'number' ? data.unreadCount : 0);
        }
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  }, [status]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    const timer = setTimeout(() => {
      fetchNotifications();
    }, 0);

    // Poll every 35 seconds to keep awareness fresh without overwhelming server
    const interval = setInterval(fetchNotifications, 35000);

    const handleFocus = () => fetchNotifications();
    window.addEventListener('focus', handleFocus);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [status, fetchNotifications]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState && status === 'authenticated') {
      fetchNotifications();
    }
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));

    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllAsRead: true }),
      });
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleItemClick = async (notif: AppNotificationItem) => {
    if (!notif.isRead) {
      // Optimistic update
      setUnreadCount((c) => Math.max(0, c - 1));
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
      );
      try {
        await fetch('/api/notifications', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: notif.id, isRead: true }),
        });
      } catch (err) {
        console.error('Failed to mark notification as read:', err);
      }
    }

    if (notif.link) {
      setIsOpen(false);
      if (notif.link.startsWith('?')) {
        router.push(`/${notif.link}`);
      } else {
        router.push(notif.link);
      }
    }
  };

  const handleClearAll = async () => {
    setNotifications([]);
    setUnreadCount(0);
    try {
      await fetch('/api/notifications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clearAll: true }),
      });
    } catch (err) {
      console.error('Failed to clear notifications:', err);
    }
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'TASK_ASSIGNED':
        return (
          <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-2xs">
            <UserCheck className="w-4 h-4" />
          </div>
        );
      case 'BOARD_JOINED':
        return (
          <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 shadow-2xs">
            <UserPlus className="w-4 h-4" />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 shadow-2xs">
            <Info className="w-4 h-4" />
          </div>
        );
    }
  };

  return (
    <div className="relative shrink-0" ref={containerRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={handleToggle}
        className={`relative inline-flex items-center justify-center p-2 rounded-xl border transition-all duration-150 cursor-pointer active:scale-95 shrink-0 ${
          isOpen
            ? themeConfig.isDark
              ? 'bg-slate-700 border-amber-400/80 text-amber-300'
              : 'bg-amber-200/80 border-amber-400 text-amber-950 shadow-xs'
            : isPlayful
            ? 'rotate-1 hover:rotate-0 hover:-translate-y-0.5 shadow-xs'
            : 'hover:-translate-y-0.5 shadow-2xs'
        } ${
          themeConfig.isDark
            ? 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-amber-300'
            : isPlayful
            ? 'bg-amber-100/85 hover:bg-amber-100 border-amber-300 text-amber-950'
            : 'bg-amber-100/60 hover:bg-amber-100 border-amber-200/80 text-amber-900'
        }`}
        title={unreadCount > 0 ? `${unreadCount} notifikasi baru` : 'Notifikasi'}
        aria-expanded={isOpen}
      >
        {isPlayful && !themeConfig.isDark && (
          <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-4 h-1.5 bg-amber-200/90 border-y border-dashed border-amber-400/60 rounded-2xs pointer-events-none" />
        )}
        <Bell className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />

        {/* Unread Counter Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 px-1.5 py-0.2 min-w-4.5 h-4.5 text-[9px] font-black rounded-full bg-rose-500 text-white shadow-xs flex items-center justify-center animate-bounce">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown Panel */}
      {isOpen && (
        <div
          className={`absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl border shadow-2xl z-50 backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 overflow-hidden ${
            themeConfig.isDark
              ? 'bg-slate-900/95 border-slate-700 text-slate-100 shadow-black/50'
              : 'bg-[#fffdf9]/95 border-amber-200/90 text-amber-950 shadow-amber-900/15'
          }`}
        >
          {/* Header */}
          <div
            className={`flex items-center justify-between px-3.5 py-2.5 border-b ${
              themeConfig.isDark ? 'border-slate-800 bg-slate-800/40' : 'border-amber-100 bg-amber-50/50'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-base">🔔</span>
              <h3 className="text-xs sm:text-sm font-black">Notifikasi</h3>
              {unreadCount > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                  {unreadCount} baru
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 px-2 py-1 rounded-lg hover:bg-amber-100/50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Tandai semua telah dibaca"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Tandai Dibaca</span>
                </button>
              )}

              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="p-1 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Hapus semua riwayat notifikasi"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* List of Notifications */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-amber-100/60 dark:divide-slate-800/70">
            {status !== 'authenticated' ? (
              <div className="p-6 text-center">
                <div className="w-10 h-10 mx-auto mb-2 rounded-2xl bg-amber-100/80 dark:bg-slate-800 flex items-center justify-center text-amber-600 dark:text-amber-400 text-lg">
                  🔒
                </div>
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Silakan masuk dengan akun Google untuk menerima notifikasi penugasan tugas dan kolaborasi papan.
                </p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 mx-auto mb-2.5 rounded-2xl bg-amber-100/70 dark:bg-slate-800 flex items-center justify-center text-2xl animate-bounce">
                  ✨
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                  Belum ada notifikasi
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                  Aktivitas penugasan tugas dan saat rekan bergabung ke papan Anda akan tampil di sini.
                </p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleItemClick(notif)}
                  className={`flex items-start gap-3 p-3 transition-colors cursor-pointer text-left relative ${
                    notif.isRead
                      ? themeConfig.isDark
                        ? 'hover:bg-slate-800/50 text-slate-400'
                        : 'hover:bg-amber-50/40 text-slate-600'
                      : themeConfig.isDark
                      ? 'bg-slate-800/60 hover:bg-slate-800 text-slate-100 font-semibold'
                      : 'bg-amber-50/70 hover:bg-amber-100/50 text-amber-950 font-semibold'
                  }`}
                >
                  {/* Left Icon */}
                  {getItemIcon(notif.type)}

                  {/* Notification Content */}
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs leading-relaxed ${notif.isRead ? 'text-slate-700 dark:text-slate-300' : 'text-slate-900 dark:text-white font-bold'}`}>
                      {notif.message}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">
                        {formatNotificationTime(notif.createdAt)}
                      </span>
                      {notif.link && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-600 dark:text-amber-400">
                          <span>Buka</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Unread dot */}
                  {!notif.isRead && (
                    <span className="w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white dark:ring-slate-900 shrink-0 self-center" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
