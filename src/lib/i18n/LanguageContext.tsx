'use client';

import React, { createContext, useContext, useSyncExternalStore, useCallback } from 'react';
import { Language } from '@/types/preferences';
import { id, Translations } from './id';
import { en } from './en';

const LANGUAGE_STORAGE_KEY = 'ceria_todo_lang_pref';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const dictionaries: Record<Language, Translations> = {
  id,
  en,
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'id',
  setLanguage: () => {},
  t: id,
});

function getClientLanguage(): Language {
  if (typeof window === 'undefined') return 'id';
  try {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved === 'id' || saved === 'en') return saved;

    const prefsRaw = localStorage.getItem('ceria_todo_user_preferences_v1');
    if (prefsRaw) {
      const parsed = JSON.parse(prefsRaw);
      if (parsed.language === 'id' || parsed.language === 'en') {
        return parsed.language;
      }
    }
  } catch {
    // fallback
  }
  return 'id';
}

function getServerLanguage(): Language {
  return 'id';
}

const listeners = new Set<() => void>();

function subscribe(callback: () => void) {
  listeners.add(callback);
  const onStorage = (e: StorageEvent) => {
    if (e.key === LANGUAGE_STORAGE_KEY || e.key === 'ceria_todo_user_preferences_v1') {
      callback();
    }
  };
  window.addEventListener('storage', onStorage);

  return () => {
    listeners.delete(callback);
    window.removeEventListener('storage', onStorage);
  };
}

function notify() {
  listeners.forEach((listener) => listener());
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const language = useSyncExternalStore(subscribe, getClientLanguage, getServerLanguage);

  const setLanguage = useCallback((newLang: Language) => {
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, newLang);
      const prefsRaw = localStorage.getItem('ceria_todo_user_preferences_v1');
      if (prefsRaw) {
        const parsed = JSON.parse(prefsRaw);
        parsed.language = newLang;
        localStorage.setItem('ceria_todo_user_preferences_v1', JSON.stringify(parsed));
      }
    } catch (e) {
      console.warn('Gagal menyimpan bahasa:', e);
    }
    notify();
  }, []);

  const t = dictionaries[language] || id;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    return {
      language: 'id' as Language,
      setLanguage: () => {},
      t: id,
    };
  }
  return context;
}
