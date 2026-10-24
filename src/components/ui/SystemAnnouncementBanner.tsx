'use client';

import React, { useState, useEffect } from 'react';
import { Megaphone, X, Sparkles, AlertTriangle, ExternalLink } from 'lucide-react';

interface AnnouncementData {
  id: string;
  message: string;
  type: 'info' | 'celebration' | 'warning';
  isActive: boolean;
  linkUrl: string | null;
}

export const SystemAnnouncementBanner: React.FC = () => {
  const [announcement, setAnnouncement] = useState<AnnouncementData | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    fetch('/api/announcement')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.announcement && data.announcement.isActive) {
          const dismissedId = sessionStorage.getItem('dismissed_announcement');
          if (dismissedId !== data.announcement.id) {
            setAnnouncement(data.announcement);
          }
        }
      })
      .catch(() => {
        // Silently ignore network failures for announcements
      });
  }, []);

  if (!announcement || isDismissed) return null;

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('dismissed_announcement', announcement.id);
  };

  const getStyle = () => {
    switch (announcement.type) {
      case 'celebration':
        return {
          container: 'bg-amber-100/90 border-amber-300 text-amber-900',
          badge: 'bg-amber-500 text-white',
          icon: <Sparkles className="w-4 h-4 text-amber-600 animate-bounce" />,
          label: 'Kabar Gembira',
        };
      case 'warning':
        return {
          container: 'bg-orange-100/90 border-orange-300 text-orange-950',
          badge: 'bg-orange-500 text-white',
          icon: <AlertTriangle className="w-4 h-4 text-orange-600" />,
          label: 'Pengumuman Penting',
        };
      default:
        return {
          container: 'bg-amber-50/95 border-amber-200/90 text-stone-800',
          badge: 'bg-amber-600 text-white',
          icon: <Megaphone className="w-4 h-4 text-amber-600" />,
          label: 'Pengumuman',
        };
    }
  };

  const style = getStyle();

  return (
    <div
      className={`relative w-full border-b px-4 py-2 text-xs transition-all duration-200 shadow-2xs flex items-center justify-between gap-3 ${style.container}`}
    >
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="shrink-0">{style.icon}</div>
          <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full shrink-0 shadow-2xs hidden xs:inline-block tracking-wide">
            {style.label}
          </span>
          <p className="font-semibold truncate">
            {announcement.message}
          </p>
          {announcement.linkUrl && (
            <a
              href={announcement.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-bold underline hover:opacity-80 shrink-0 ml-1 text-amber-700"
            >
              <span>Pelajari</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        <button
          onClick={handleDismiss}
          className="p-1 rounded-lg hover:bg-black/5 text-stone-500 hover:text-stone-800 transition-colors shrink-0 cursor-pointer"
          title="Tutup pengumuman"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
