'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Compass,
  Sparkles,
  Heart,
  Download,
  Share2,
  Trash2,
  Search,
  Check,
  Eye,
  Palette,
  Layers,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { UserPreferences } from '@/types/preferences';
import { ShowcaseItem, SHOWCASE_CATEGORIES } from '@/types/showcase';
import { loadUserPreferences, saveUserPreferences, getThemeConfig } from '@/lib/userPreferences';
import { UserAuthButton } from '@/components/ui/UserAuthButton';
import { ShowcaseDetailModal } from '@/components/gallery/ShowcaseDetailModal';
import { triggerCelebration } from '@/lib/confetti';
import { playPopSound, playVictoryChime } from '@/lib/soundEffects';

export default function GalleryPage() {
  const { data: session } = useSession();
  const [preferences, setPreferences] = useState<UserPreferences>(() =>
    typeof window !== 'undefined' ? loadUserPreferences() : ({} as UserPreferences)
  );

  const [activeTab, setActiveTab] = useState<'gallery' | 'publish' | 'mine'>('gallery');
  const [showcases, setShowcases] = useState<ShowcaseItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [sortOption, setSortOption] = useState<'popular' | 'latest'>('popular');

  // Selected showcase for detailed inspection
  const [selectedShowcase, setSelectedShowcase] = useState<ShowcaseItem | null>(null);

  // Applied Toast state
  const [appliedToast, setAppliedToast] = useState<{ title: string; show: boolean }>({
    title: '',
    show: false,
  });

  // Publish Form State
  const [publishTitle, setPublishTitle] = useState(() =>
    preferences.boardTitle ? `${preferences.boardTitle} Setup` : 'Meja Estetik Ceria'
  );
  const [publishDesc, setPublishDesc] = useState('');
  const [publishCategory, setPublishCategory] = useState<string>('Aesthetic');
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccessMessage, setPublishSuccessMessage] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);

  // Active theme of current user
  const themeConfig = useMemo(() => {
    return getThemeConfig(preferences.theme || 'sunset', preferences.customTheme);
  }, [preferences.theme, preferences.customTheme]);

  // Load showcases from API
  const fetchShowcases = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== 'ALL') params.set('category', selectedCategory);
      if (searchQuery.trim()) params.set('q', searchQuery.trim());
      params.set('sort', sortOption);

      const res = await fetch(`/api/showcase?${params.toString()}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setShowcases(data.data);
      }
    } catch (err) {
      console.error('Gagal mengambil data galeri:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, searchQuery, sortOption]);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const params = new URLSearchParams();
        if (selectedCategory !== 'ALL') params.set('category', selectedCategory);
        if (searchQuery.trim()) params.set('q', searchQuery.trim());
        params.set('sort', sortOption);

        const res = await fetch(`/api/showcase?${params.toString()}`);
        const data = await res.json();
        if (!ignore && data.success && Array.isArray(data.data)) {
          setShowcases(data.data);
        }
      } catch (err) {
        if (!ignore) console.error('Gagal mengambil data galeri:', err);
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, [selectedCategory, searchQuery, sortOption]);

  // Handle Like
  const handleToggleLike = async (showcaseId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!session?.user) {
      alert('Silakan login dengan akun Google terlebih dahulu untuk menyukai karya ini.');
      return;
    }

    // Optimistic UI update
    setShowcases((prev) =>
      prev.map((item) => {
        if (item.id === showcaseId) {
          const nextLiked = !item.isLiked;
          return {
            ...item,
            isLiked: nextLiked,
            likesCount: nextLiked ? item.likesCount + 1 : Math.max(0, item.likesCount - 1),
          };
        }
        return item;
      })
    );

    if (selectedShowcase && selectedShowcase.id === showcaseId) {
      const nextLiked = !selectedShowcase.isLiked;
      setSelectedShowcase({
        ...selectedShowcase,
        isLiked: nextLiked,
        likesCount: nextLiked ? selectedShowcase.likesCount + 1 : Math.max(0, selectedShowcase.likesCount - 1),
      });
    }

    playPopSound(preferences.soundProfile || 'pop');

    try {
      const res = await fetch(`/api/showcase/${showcaseId}/like`, { method: 'POST' });
      const data = await res.json();
      if (!data.success) {
        fetchShowcases();
      }
    } catch {
      fetchShowcases();
    }
  };

  // Handle Apply Setup
  const handleApplySetup = async (item: ShowcaseItem) => {
    try {
      let parsedConfig: Partial<UserPreferences> = {};
      try {
        parsedConfig = JSON.parse(item.configJson);
      } catch (err) {
        console.error('Format JSON tidak valid:', err);
        alert('Format konfigurasi tidak valid');
        return;
      }

      // Record clone in backend
      fetch(`/api/showcase/${item.id}/clone`, { method: 'POST' }).catch(() => {});

      // Increment clone counter optimistically
      setShowcases((prev) =>
        prev.map((s) => (s.id === item.id ? { ...s, clonesCount: s.clonesCount + 1 } : s))
      );

      // Merge into current preferences
      const current = loadUserPreferences();
      const updated: UserPreferences = {
        ...current,
        ...parsedConfig,
        appName: parsedConfig.appName || current.appName,
        userName: parsedConfig.userName || current.userName,
      };

      saveUserPreferences(updated);
      setPreferences(updated);

      triggerCelebration(updated.celebrationFx);
      playVictoryChime(updated.soundProfile);

      setAppliedToast({ title: item.title, show: true });
      setTimeout(() => setAppliedToast({ title: '', show: false }), 6000);
    } catch (err) {
      console.error('Gagal menerapkan konfigurasi:', err);
    }
  };

  // Handle Publish Form
  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user) {
      setPublishError('Silakan login terlebih dahulu untuk mempublikasikan meja');
      return;
    }

    if (!publishTitle.trim()) {
      setPublishError('Judul showcase wajib diisi');
      return;
    }

    setIsPublishing(true);
    setPublishError(null);
    setPublishSuccessMessage(null);

    const visualConfigSnapshot: Partial<UserPreferences> = {
      theme: preferences.theme,
      customTheme: preferences.customTheme,
      bgPattern: preferences.bgPattern,
      customBgUrl: preferences.customBgUrl,
      bgDim: preferences.bgDim,
      bgBlur: preferences.bgBlur,
      washiTapeStyle: preferences.washiTapeStyle,
      soundProfile: preferences.soundProfile,
      fontMood: preferences.fontMood,
      celebrationFx: preferences.celebrationFx,
      noteColorMode: preferences.noteColorMode,
      pinStyle: preferences.pinStyle,
      completionStamp: preferences.completionStamp,
      stampColor: preferences.stampColor,
      viewDensity: preferences.viewDensity,
      sortBy: preferences.sortBy,
      deskBuddy: preferences.deskBuddy,
      deskBuddyCustomName: preferences.deskBuddyCustomName,
      deskBuddyCustomQuotes: preferences.deskBuddyCustomQuotes,
      deskBuddyPosition: preferences.deskBuddyPosition,
      deskBuddySize: preferences.deskBuddySize,
      footerText: preferences.footerText,
      paperTexture: preferences.paperTexture,
      stickers: preferences.stickers || [],
      columns: preferences.columns,
      customCategories: preferences.customCategories,
    };

    try {
      const res = await fetch('/api/showcase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: publishTitle.trim(),
          description: publishDesc.trim() || undefined,
          category: publishCategory,
          configJson: JSON.stringify(visualConfigSnapshot),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setPublishSuccessMessage('🎉 Selamat! Meja Anda berhasil dipamerkan ke Galeri Komunitas!');
        triggerCelebration(preferences.celebrationFx);
        playVictoryChime(preferences.soundProfile);
        setTimeout(() => {
          setActiveTab('gallery');
          fetchShowcases();
        }, 1200);
      } else {
        setPublishError(data.error || 'Gagal mempublikasikan showcase');
      }
    } catch (err) {
      console.error('Error publishing showcase:', err);
      setPublishError('Terjadi kesalahan jaringan');
    } finally {
      setIsPublishing(false);
    }
  };

  // Handle Delete Showcase
  const handleDeleteShowcase = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Apakah Anda yakin ingin menghapus karya ini dari galeri publik?')) return;

    try {
      const res = await fetch(`/api/showcase/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setShowcases((prev) => prev.filter((item) => item.id !== id));
        playPopSound(preferences.soundProfile);
      } else {
        alert(data.error || 'Gagal menghapus');
      }
    } catch {
      alert('Terjadi kesalahan jaringan');
    }
  };

  // My showcases filter
  const myShowcases = useMemo(() => {
    const currentUserId = session?.user?.id;
    if (!currentUserId) return [];
    return showcases.filter((s) => s.userId === currentUserId);
  }, [showcases, session]);

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors ${
        themeConfig.isDark ? 'dark bg-slate-950 text-slate-100' : 'bg-[#faf8f5] text-slate-800'
      }`}
    >
      {/* Top Application Navbar */}
      <header className="sticky top-0 z-30 w-full bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-amber-200/60 dark:border-slate-800 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Back button & Title */}
            <div className="flex items-center gap-3 min-w-0">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-amber-100/60 dark:hover:bg-slate-700 text-xs font-bold transition-all shadow-2xs"
                title="Kembali ke Papan Utama"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Kembali ke Papan</span>
              </Link>

              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-400 via-orange-400 to-rose-400 flex items-center justify-center text-white shadow-md shadow-orange-200/50 shrink-0">
                  <Compass className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-base sm:text-lg font-black tracking-tight truncate flex items-center gap-2">
                    Galeri Komunitas
                    <span className="hidden md:inline-block text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-2xs">
                      Etalase Meja
                    </span>
                  </h1>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate hidden sm:block">
                    Jelajahi dekorasi meja estetik atau pamerkan kreasimu sendiri!
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Actions & User Auth */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setActiveTab('publish')}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-rose-500 to-orange-500 hover:opacity-95 active:scale-95 shadow-sm transition-all cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Pamerkan Meja Saya</span>
                <span className="sm:hidden">Pamerkan</span>
              </button>

              <UserAuthButton />
            </div>
          </div>
        </div>
      </header>

      {/* Applied Floating Toast Notification */}
      {appliedToast.show && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-emerald-600 text-white px-5 py-4 rounded-2xl shadow-2xl flex items-center justify-between gap-4 border border-emerald-400 animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <Check className="w-5 h-5 stroke-[3]" />
            </div>
            <div>
              <div className="text-xs font-extrabold uppercase tracking-wider text-emerald-200">
                Setup Berhasil Diterapkan!
              </div>
              <div className="text-sm font-bold truncate max-w-[200px] sm:max-w-[260px]">
                {appliedToast.title}
              </div>
            </div>
          </div>
          <Link
            href="/"
            className="px-3.5 py-1.5 rounded-xl bg-white text-emerald-900 font-extrabold text-xs hover:bg-emerald-50 active:scale-95 transition-all shadow-xs shrink-0"
          >
            Lihat di Papan 🚀
          </Link>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Navigation Tabs Bar */}
        <div className="flex items-center justify-between gap-2 border-b border-amber-200/70 dark:border-slate-800 pb-3 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('gallery')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'gallery'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-amber-100/60 dark:hover:bg-slate-800'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Jelajahi Galeri ({showcases.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('publish')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'publish'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-rose-100/60 dark:hover:bg-slate-800'
              }`}
            >
              <Share2 className="w-4 h-4" />
              <span>Pamerkan Meja Saya</span>
            </button>

            {session?.user && (
              <button
                onClick={() => setActiveTab('mine')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeTab === 'mine'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-purple-100/60 dark:hover:bg-slate-800'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Koleksi Saya ({myShowcases.length})</span>
              </button>
            )}
          </div>

          {activeTab === 'gallery' && (
            <button
              onClick={fetchShowcases}
              disabled={isLoading}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Segarkan data galeri"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>

        {/* TAB 1: JELAJAHI GALERI */}
        {activeTab === 'gallery' && (
          <div className="space-y-6">
            {/* Filter and Search Bar */}
            <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between">
              {/* Search input */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari tema, judul setup, atau stiker..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs sm:text-sm border border-amber-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400 text-slate-800 dark:text-slate-100 placeholder-slate-400"
                />
              </div>

              {/* Sort pills */}
              <div className="flex items-center gap-1.5 p-1 rounded-2xl border border-amber-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold self-start md:self-auto">
                <button
                  onClick={() => setSortOption('popular')}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    sortOption === 'popular'
                      ? 'bg-amber-500 text-white shadow-2xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                  }`}
                >
                  🔥 Paling Populer
                </button>
                <button
                  onClick={() => setSortOption('latest')}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    sortOption === 'latest'
                      ? 'bg-amber-500 text-white shadow-2xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                  }`}
                >
                  ✨ Terbaru
                </button>
              </div>
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setSelectedCategory('ALL')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition-colors cursor-pointer ${
                  selectedCategory === 'ALL'
                    ? 'bg-slate-900 text-white dark:bg-amber-500'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                Semua Kategori
              </button>
              {SHOWCASE_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition-colors cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-slate-900 text-white dark:bg-amber-500'
                      : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Showcase Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div
                    key={n}
                    className="h-80 rounded-3xl bg-slate-200/60 dark:bg-slate-800 animate-pulse border border-slate-200/40 dark:border-slate-700"
                  />
                ))}
              </div>
            ) : showcases.length === 0 ? (
              <div className="py-20 text-center rounded-3xl border-2 border-dashed border-amber-200 dark:border-slate-800 bg-amber-50/40 dark:bg-slate-900/40 p-8">
                <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-100 dark:bg-slate-800 flex items-center justify-center text-3xl mb-4 shadow-xs">
                  🎨
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Belum Ada Setup Meja di Kategori Ini
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
                  Jadilah kreator pertama yang memamerkan kreasi meja to-do dan stiker estetikmu!
                </p>
                <button
                  onClick={() => setActiveTab('publish')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 shadow-md hover:scale-105 active:scale-95 transition-all"
                >
                  <Share2 className="w-4 h-4" />
                  Pamerkan Mejamu Sekarang
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {showcases.map((item) => {
                  let parsed: Partial<UserPreferences> = {};
                  try {
                    parsed = JSON.parse(item.configJson);
                  } catch {}

                  const stickersCount = (parsed.stickers || []).length;
                  const mascot = parsed.deskBuddy || 'none';

                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedShowcase(item)}
                      className="group flex flex-col rounded-3xl border border-amber-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-amber-400 hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer"
                    >
                      {/* Visual Banner Preview */}
                      <div
                        className="h-44 w-full relative overflow-hidden flex flex-col justify-between p-4 select-none"
                        style={{
                          backgroundColor: parsed.customTheme?.bgHex || '#fffbeb',
                          backgroundImage: parsed.customBgUrl ? `url(${parsed.customBgUrl})` : undefined,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                        }}
                      >
                        <div className="absolute inset-0 bg-black/15 backdrop-blur-[0.5px]" />

                        {/* Top Badges */}
                        <div className="relative z-10 flex items-center justify-between">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-white/95 dark:bg-slate-900/95 text-slate-800 dark:text-slate-100 shadow-xs backdrop-blur-xs">
                            🏷️ {item.category}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {mascot !== 'none' && (
                              <span
                                className="w-7 h-7 rounded-full bg-white/95 dark:bg-slate-900/95 flex items-center justify-center text-sm shadow-xs"
                                title={`Maskot: ${mascot}`}
                              >
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
                            )}
                            {stickersCount > 0 && (
                              <span
                                className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/95 dark:bg-slate-900/95 text-amber-600 shadow-xs"
                                title={`${stickersCount} Stiker Meja`}
                              >
                                ✨ {stickersCount} stiker
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Bottom Banner Detail */}
                        <div className="relative z-10 flex items-center justify-between text-white text-xs font-semibold">
                          <div className="bg-black/40 backdrop-blur-xs rounded-xl px-2.5 py-1">
                            🎨 {parsed.theme || 'sunset'} • ✍️ {parsed.fontMood || 'rounded'}
                          </div>
                          <div className="bg-white/90 text-slate-800 p-1.5 rounded-xl shadow-xs group-hover:scale-110 transition-transform">
                            <Eye className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      </div>

                      {/* Card Content */}
                      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                        <div>
                          <h3 className="font-black text-base sm:text-lg text-slate-800 dark:text-slate-100 line-clamp-1 mb-1.5 group-hover:text-amber-600 transition-colors">
                            {item.title}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                            {item.description || 'Tidak ada deskripsi tambahan dari pembuat.'}
                          </p>
                        </div>

                        {/* Author & Interactions */}
                        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                          <div className="flex items-center justify-between">
                            {/* Author avatar */}
                            <div className="flex items-center gap-2 min-w-0">
                              {item.user.image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={item.user.image}
                                  alt={item.user.name || 'User'}
                                  className="w-6 h-6 rounded-full object-cover border border-slate-200 shrink-0"
                                />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-amber-400 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                                  {(item.user.name || 'U')[0].toUpperCase()}
                                </div>
                              )}
                              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[120px]">
                                {item.user.name || 'Kreator Ceria'}
                              </span>
                            </div>

                            {/* Likes & Clones */}
                            <div className="flex items-center gap-3 text-xs">
                              <button
                                type="button"
                                onClick={(e) => handleToggleLike(item.id, e)}
                                className={`flex items-center gap-1 px-2.5 py-1 rounded-xl transition-all cursor-pointer ${
                                  item.isLiked
                                    ? 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 font-bold'
                                    : 'text-slate-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-800'
                                }`}
                              >
                                <Heart
                                  className={`w-3.5 h-3.5 ${item.isLiked ? 'fill-rose-500 text-rose-500' : ''}`}
                                />
                                <span>{item.likesCount}</span>
                              </button>

                              <span
                                className="flex items-center gap-1 text-slate-400"
                                title="Berapa kali template ini dipakai"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>{item.clonesCount}</span>
                              </span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedShowcase(item);
                              }}
                              className="w-full py-2 px-3 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Lihat Detail</span>
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleApplySetup(item);
                              }}
                              className="w-full py-2 px-3 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:opacity-95 active:scale-95 transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <Palette className="w-3.5 h-3.5" />
                              <span>Pakai Setup</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PAMERKAN MEJA SAYA */}
        {activeTab === 'publish' && (
          <div className="max-w-xl mx-auto space-y-6">
            {!session?.user ? (
              <div className="p-8 text-center rounded-3xl border border-amber-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                <div className="w-14 h-14 mx-auto rounded-3xl bg-rose-100 text-rose-600 flex items-center justify-center text-2xl mb-4">
                  🔐
                </div>
                <h3 className="font-bold text-base mb-2">Masuk dengan Akun Google</h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                  Agar karya meja Anda dapat dikaitkan dengan profil dan diapresiasi oleh komunitas, silakan login terlebih dahulu.
                </p>
                <div className="flex justify-center">
                  <UserAuthButton />
                </div>
              </div>
            ) : (
              <form
                onSubmit={handlePublish}
                className="p-6 sm:p-8 rounded-3xl border border-amber-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-5"
              >
                <div>
                  <h3 className="text-base sm:text-lg font-black tracking-tight mb-1">
                    Pamerkan Meja Anda ke Galeri
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Bagikan inspirasi tata letak estetik, stiker, dan temamu kepada teman-teman!
                  </p>
                </div>

                {/* Form fields */}
                <div>
                  <label className="block text-xs font-bold mb-1.5 text-slate-700 dark:text-slate-300">
                    Judul Karya / Setup Meja <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={publishTitle}
                    onChange={(e) => setPublishTitle(e.target.value)}
                    placeholder="Contoh: Meja Belajar Santai ala Cafe Matcha 🍵"
                    maxLength={80}
                    className="w-full px-4 py-2.5 rounded-2xl text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                  <div className="flex justify-between items-center mt-1 text-[11px] text-slate-400">
                    <span>Beri nama yang menggambarkan suasana meja Anda</span>
                    <span>{publishTitle.length}/80</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1.5 text-slate-700 dark:text-slate-300">
                    Kategori Pameran
                  </label>
                  <select
                    value={publishCategory}
                    onChange={(e) => setPublishCategory(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
                  >
                    {SHOWCASE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1.5 text-slate-700 dark:text-slate-300">
                    Deskripsi / Cerita Singkat (Opsional)
                  </label>
                  <textarea
                    rows={3}
                    value={publishDesc}
                    onChange={(e) => setPublishDesc(e.target.value)}
                    placeholder="Ceritakan kombinasi warna kesukaanmu, stiker favorit, atau tips produktivitas saat menggunakan setup ini..."
                    maxLength={250}
                    className="w-full px-4 py-2.5 rounded-2xl text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                  />
                </div>

                {/* Privacy Guarantee Note */}
                <div className="p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/70 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-300 flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div className="text-xs leading-relaxed">
                    <strong className="font-bold">Privasi 100% Terjaga:</strong> Hanya tema visual, stiker dekorasi, dan setelan tampilan yang akan dibagikan. Isi catatan pribadi dan kartu tugas rahasia Anda{' '}
                    <span className="font-bold underline">TIDAK PERNAH</span> dipublikasikan ke galeri.
                  </div>
                </div>

                {/* Messages */}
                {publishError && (
                  <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                    {publishError}
                  </div>
                )}

                {publishSuccessMessage && (
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                    {publishSuccessMessage}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isPublishing}
                  className="w-full py-3.5 px-4 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:opacity-95 active:scale-98 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isPublishing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Menerbitkan ke Galeri...</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4" />
                      <span>Terbitkan ke Galeri Komunitas 🚀</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}

        {/* TAB 3: KOLEKSI SAYA */}
        {activeTab === 'mine' && (
          <div className="space-y-6">
            {myShowcases.length === 0 ? (
              <div className="py-20 text-center rounded-3xl border-2 border-dashed border-amber-200 dark:border-slate-800 bg-amber-50/40 dark:bg-slate-900/40 p-8">
                <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-100 dark:bg-slate-800 flex items-center justify-center text-3xl mb-4 shadow-xs">
                  📁
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Anda Belum Mempublikasikan Karya
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
                  Setup meja yang Anda bagikan akan muncul di sini. Anda dapat memantau jumlah suka dan pemakaian dari komunitas!
                </p>
                <button
                  onClick={() => setActiveTab('publish')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 shadow-md hover:scale-105 active:scale-95 transition-all"
                >
                  <Share2 className="w-4 h-4" />
                  Pamerkan Mejamu Sekarang
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {myShowcases.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col rounded-3xl border border-amber-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-100 text-amber-800">
                          {item.category}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteShowcase(item.id, e)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                          title="Hapus dari galeri publik"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <h4 className="font-bold text-base text-slate-800 dark:text-slate-100 line-clamp-1 mb-1">
                        {item.title}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-4">
                        {item.description || 'Tanpa deskripsi'}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1 text-rose-500 font-bold">
                        <Heart className="w-3.5 h-3.5 fill-rose-500" />
                        <span>{item.likesCount} suka</span>
                      </span>
                      <span className="flex items-center gap-1 text-slate-500">
                        <Download className="w-3.5 h-3.5" />
                        <span>{item.clonesCount} dipakai</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Showcase Detail Inspector Modal */}
      <ShowcaseDetailModal
        showcase={selectedShowcase}
        onClose={() => setSelectedShowcase(null)}
        onApply={handleApplySetup}
        onToggleLike={handleToggleLike}
      />
    </div>
  );
}
