'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Clock } from 'lucide-react';

interface LiveDateTimeBadgeProps {
  isDark?: boolean;
  language: string;
}

export const LiveDateTimeBadge: React.FC<LiveDateTimeBadgeProps> = React.memo(
  ({ isDark = false, language }) => {
    const [dateTime, setDateTime] = useState({ date: '', time: '' });

    useEffect(() => {
      const locale = language === 'en' ? 'en-US' : 'id-ID';
      const updateDateTime = () => {
        const now = new Date();
        setDateTime({
          date: now.toLocaleDateString(locale, {
            weekday: 'long',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          }),
          time:
            now.toLocaleTimeString(locale, {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            }) + (language === 'id' ? ' WIB' : ''),
        });
      };

      updateDateTime();
      const timer = setInterval(updateDateTime, 1000);
      return () => clearInterval(timer);
    }, [language]);

    if (!dateTime.date) return null;

    return (
      <div
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[11px] font-semibold shadow-2xs ${
          isDark
            ? 'bg-slate-900/50 border-slate-700/50 text-slate-300'
            : 'bg-amber-50/70 border-amber-200/70 text-amber-900'
        }`}
      >
        <Calendar className="w-3 h-3 text-amber-500 shrink-0" />
        <span>{dateTime.date}</span>
        <span className="text-amber-300">•</span>
        <Clock className="w-3 h-3 text-amber-500 shrink-0" />
        <span className={`font-mono ${isDark ? 'text-amber-400' : 'text-slate-800'}`}>
          {dateTime.time}
        </span>
      </div>
    );
  }
);

LiveDateTimeBadge.displayName = 'LiveDateTimeBadge';
