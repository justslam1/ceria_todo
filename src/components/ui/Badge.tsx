import React from 'react';
import { Priority } from '@/types/task';
import { Calendar, Clock, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface PriorityBadgeProps {
  priority: Priority;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority }) => {
  const { t } = useLanguage();
  switch (priority) {
    case 'HIGH':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-700 border border-rose-200 shadow-2xs">
          <AlertCircle className="w-3 h-3" />
          {t.card.priorityHigh}
        </span>
      );
    case 'MEDIUM':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200 shadow-2xs">
          {t.card.priorityMedium}
        </span>
      );
    case 'LOW':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200 shadow-2xs">
          {t.card.priorityLow}
        </span>
      );
  }
};

import { getCategoryBadgeClasses } from '@/lib/userPreferences';
import { CustomCategory } from '@/types/preferences';

interface CategoryBadgeProps {
  category: string;
  customCategories?: CustomCategory[];
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({ category, customCategories }) => {
  const colorClasses = getCategoryBadgeClasses(category, customCategories);
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border shadow-2xs ${colorClasses}`}>
      🏷️ {category}
    </span>
  );
};

interface DateBadgeProps {
  date: string | null;
  isDone?: boolean;
}

export const DateBadge: React.FC<DateBadgeProps> = ({ date, isDone = false }) => {
  const { t, language } = useLanguage();
  if (!date) return null;

  const locale = language === 'en' ? 'en-US' : 'id-ID';
  const d = new Date(date);
  const formattedDate = d.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
  });

  const hours = d.getHours();
  const minutes = d.getMinutes();
  const hasSpecificTime = !(hours === 23 && minutes === 59) && !(hours === 0 && minutes === 0);
  const formattedTime = hasSpecificTime
    ? d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
    : null;

  const now = new Date();
  const isOverdue = !isDone && d.getTime() < now.getTime();

  // Check if today or tomorrow
  const isToday = !isDone && d.toDateString() === now.toDateString();
  const tomorrow = new Date();
  tomorrow.setDate(now.getDate() + 1);
  const isTomorrow = !isDone && d.toDateString() === tomorrow.toDateString();

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xl text-xs font-semibold transition-colors shadow-2xs ${
        isDone
          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          : isOverdue
          ? 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse'
          : isToday
          ? 'bg-amber-100 text-amber-900 border border-amber-300 font-bold'
          : isTomorrow
          ? 'bg-sky-100 text-sky-800 border border-sky-300'
          : 'bg-white/80 text-slate-700 border border-slate-200/90'
      }`}
    >
      <Calendar className="w-3 h-3 shrink-0" />
      <span>
        {isDone
          ? formattedDate
          : isOverdue
          ? `${t.card.overduePrefix} (${formattedDate})`
          : isToday
          ? `${t.card.todayPrefix}${formattedTime ? ` ${formattedTime}` : ''}`
          : isTomorrow
          ? `${t.card.tomorrowPrefix}${formattedTime ? ` ${formattedTime}` : ''}`
          : formattedDate}
      </span>
      {formattedTime && !isToday && !isTomorrow && (
        <>
          <span className="text-slate-300">•</span>
          <span className="font-semibold">{formattedTime}</span>
        </>
      )}
    </span>
  );
};

interface TimeEstimateBadgeProps {
  time: string | null;
}

export const TimeEstimateBadge: React.FC<TimeEstimateBadgeProps> = ({ time }) => {
  if (!time) return null;

  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-xl text-xs font-medium bg-sky-50 text-sky-700 border border-sky-200/90 shadow-2xs"
    >
      <Clock className="w-3 h-3 text-sky-500 shrink-0" />
      <span>{time}</span>
    </span>
  );
};
