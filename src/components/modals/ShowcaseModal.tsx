'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  X,
  Heart,
  Download,
  Share2,
  Trash2,
  Search,
  ShieldCheck,
  Check,
  Palette,
  Layers,
  Compass,
  RefreshCw,
  Eye,
  Maximize2,
  Camera,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { UserPreferences, ThemeConfig } from '@/types/preferences';
import { Task } from '@/types/task';
import { ShowcaseItem, SHOWCASE_CATEGORIES } from '@/types/showcase';
import { ShowcaseDetailModal } from '@/components/gallery/ShowcaseDetailModal';
import { BoardSnapshotRenderer } from '@/components/gallery/BoardSnapshotRenderer';
import { captureNodeAsJpeg } from '@/lib/boardCapture';
import { triggerCelebration } from '@/lib/confetti';
import { playPopSound, playVictoryChime } from '@/lib/soundEffects';

interface ShowcaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: UserPreferences;
  onApplyPreferences: (prefs: Partial<UserPreferences>, showcaseTitle: string) => void;
  themeConfig: ThemeConfig;
  tasks?: Task[];
}

export const ShowcaseModal: React.FC<ShowcaseModalProps> = ({
  isOpen,
  onClose,
  preferences,
  onApplyPreferences,
  themeConfig,
  tasks = [],
}) => {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<'gallery' | 'publish' | 'mine'>('gallery');

  // Gallery state
  const [showcases, setShowcases] = useState<ShowcaseItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [sortOption, setSortOption] = useState<'popular' | 'latest'>('popular');

  // Publish form state
  const [publishTitle, setPublishTitle] = useState(() =>
    preferences.boardTitle ? `${preferences.boardTitle} Setup` : 'Meja Estetik Ceria'
  );
  const [publishDesc, setPublishDesc] = useState('');
  const [publishCategory, setPublishCategory] = useState<string>('Aesthetic');
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccessMessage, setPublishSuccessMessage] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);

  // Applied notification state
  const [appliedToast, setAppliedToast] = useState<string | null>(null);

  // Selected showcase for detailed inspection
  const [selectedDetailShowcase, setSelectedDetailShowcase] = useState<ShowcaseItem | null>(null);

  // Snapshot Capture State
  const [privacyMode, setPrivacyMode] = useState<'cheerful' | 'original'>('cheerful');
  const [capturedThumbnail, setCapturedThumbnail] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const snapshotRef = useRef<HTMLDivElement>(null);

  const generateSnapshot = useCallback(async () => {
    setIsCapturing(true);
    try {
      await new Promise((r) => setTimeout(r, 150));

      // Jika mode 'original' (Tampilkan Apa Adanya), potret langsung elemen papan yang tampil di layar
      const liveBoardEl = document.getElementById('kanban-board-canvas');
      if (privacyMode === 'original' && liveBoardEl) {
        const dataUrl = await captureNodeAsJpeg(liveBoardEl);
        setCapturedThumbnail(dataUrl);
        return;
      }

      // Jika mode 'cheerful' (Samarkan dengan Teks Ceria) atau kanvas layar tidak ditemukan
      if (snapshotRef.current) {
        const dataUrl = await captureNodeAsJpeg(snapshotRef.current);
        setCapturedThumbnail(dataUrl);
      }
    } catch (err) {
      console.error('Gagal mengambil tangkapan layar meja:', err);
    } finally {
      setIsCapturing(false);
    }
  }, [privacyMode]);

  // Auto capture snapshot when entering publish tab or changing privacyMode
  useEffect(() => {
    if (isOpen && activeTab === 'publish') {
      const timer = setTimeout(() => {
        generateSnapshot();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen, activeTab, privacyMode, generateSnapshot]);

  // Fetch gallery showcases
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
      console.error('Gagal mengambil data galeri showcase:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, searchQuery, sortOption]);

  useEffect(() => {
    if (!isOpen) return;

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
        if (!ignore) {
          console.error('Gagal mengambil data galeri showcase:', err);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      ignore = true;
    };
  }, [isOpen, selectedCategory, searchQuery, sortOption]);

  // Handle Like Toggle
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
    playPopSound(preferences.soundProfile);

    try {
      const res = await fetch(`/api/showcase/${showcaseId}/like`, { method: 'POST' });
      const data = await res.json();
      if (!data.success) {
        // Revert on error
        fetchShowcases();
      }
    } catch {
      fetchShowcases();
    }
  };

  // Handle Apply / Clone
  const handleApply = async (item: ShowcaseItem) => {
    try {
      let parsedConfig: Partial<UserPreferences> = {};
      try {
        parsedConfig = JSON.parse(item.configJson);
      } catch (err) {
        console.error('Gagal mem-parse konfigurasi showcase:', err);
        alert('Format konfigurasi tidak valid');
        return;
      }

      // Record clone in backend
      fetch(`/api/showcase/${item.id}/clone`, { method: 'POST' }).catch(() => {});

      // Increment local clone counter optimistically
      setShowcases((prev) =>
        prev.map((s) => (s.id === item.id ? { ...s, clonesCount: s.clonesCount + 1 } : s))
      );

      // Apply to user preferences
      onApplyPreferences(parsedConfig, item.title);

      triggerCelebration(preferences.celebrationFx);
      playVictoryChime(preferences.soundProfile);

      setAppliedToast(`✨ Tema "${item.title}" berhasil diterapkan ke mejamu!`);
      setTimeout(() => setAppliedToast(null), 4000);
    } catch (err) {
      console.error('Gagal menerapkan konfigurasi:', err);
    }
  };

  // Handle Publish Form Submit
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

    // Build the visual configuration snapshot from current preferences
    // Omitting any private task data!
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
          thumbnail: capturedThumbnail || undefined,
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

  // Filtered showcases for "mine" tab
  const myShowcases = useMemo(() => {
    const currentUserId = session?.user?.id;
    if (!currentUserId) return [];
    return showcases.filter((s) => s.userId === currentUserId);
  }, [showcases, session]);

  const handleClose = () => {
    setActiveTab('gallery');
    setSelectedDetailShowcase(null);
    setSearchQuery('');
    setSelectedCategory('ALL');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={handleClose}
    >
      <div
        className={`w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden transition-all duration-200 ${
          themeConfig.isDark
            ? 'bg-slate-900 border border-slate-800 text-slate-100'
            : 'bg-[#fcfbf9] border border-amber-200/80 text-slate-800'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-5 sm:px-6 py-4 border-b shrink-0 ${
            themeConfig.isDark
              ? 'border-slate-800 bg-slate-900/90'
              : 'border-amber-100 bg-gradient-to-r from-amber-50/80 via-orange-50/50 to-pink-50/40'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 via-orange-400 to-rose-400 flex items-center justify-center text-white shadow-md shadow-orange-200/50">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold tracking-tight">Galeri Komunitas</h2>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-2xs">
                  Etalase Meja
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pamerkan dekorasi mejamu atau terapkan template estetik dari teman-teman!
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/gallery"
              onClick={handleClose}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-300/80 dark:border-slate-700 bg-amber-50 dark:bg-slate-800 text-amber-900 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-slate-700 text-xs font-bold transition-all shadow-2xs"
              title="Buka Galeri di Halaman Penuh"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Halaman Penuh ↗</span>
            </Link>
            <button
              onClick={handleClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Applied Toast Banner */}
        {appliedToast && (
          <div className="bg-emerald-500 text-white px-4 py-2.5 text-xs sm:text-sm font-semibold flex items-center justify-between shadow-inner animate-in slide-in-from-top duration-200">
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 stroke-[3]" />
              {appliedToast}
            </span>
            <button
              onClick={() => setAppliedToast(null)}
              className="text-white/80 hover:text-white p-0.5 text-xs font-bold"
            >
              Tutup
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div
          className={`flex items-center justify-between px-5 sm:px-6 py-2.5 border-b shrink-0 overflow-x-auto ${
            themeConfig.isDark ? 'border-slate-800 bg-slate-900/60' : 'border-amber-100/70 bg-white/70'
          }`}
        >
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setActiveTab('gallery')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'gallery'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-amber-100/60 dark:hover:bg-slate-800'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Jelajahi Galeri</span>
              <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-white/30 text-white font-bold">
                {showcases.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('publish')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
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
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeTab === 'mine'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-purple-100/60 dark:hover:bg-slate-800'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Koleksi Saya</span>
                {myShowcases.length > 0 && (
                  <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-white/30 text-white font-bold">
                    {myShowcases.length}
                  </span>
                )}
              </button>
            )}
          </div>

          {activeTab === 'gallery' && (
            <button
              onClick={fetchShowcases}
              disabled={isLoading}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Segarkan data galeri"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
          {/* TAB 1: JELAJAHI GALERI */}
          {activeTab === 'gallery' && (
            <div className="space-y-4">
              {/* Filter & Search Bar */}
              <div className="flex flex-col sm:flex-row gap-2.5 sm:items-center justify-between">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari tema, judul, atau kata kunci..."
                    className={`w-full pl-9 pr-4 py-2 rounded-xl text-xs sm:text-sm border transition-all focus:outline-none focus:ring-2 focus:ring-amber-400 ${
                      themeConfig.isDark
                        ? 'bg-slate-800/80 border-slate-700 text-white placeholder-slate-500'
                        : 'bg-white border-amber-200/80 text-slate-800 placeholder-slate-400'
                    }`}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Sort */}
                <div className="flex items-center gap-2 shrink-0">
                  <div
                    className={`flex items-center p-1 rounded-xl border text-xs font-semibold ${
                      themeConfig.isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-amber-200/80'
                    }`}
                  >
                    <button
                      onClick={() => setSortOption('popular')}
                      className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                        sortOption === 'popular'
                          ? 'bg-amber-500 text-white shadow-2xs'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                      }`}
                    >
                      🔥 Terpopuler
                    </button>
                    <button
                      onClick={() => setSortOption('latest')}
                      className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                        sortOption === 'latest'
                          ? 'bg-amber-500 text-white shadow-2xs'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                      }`}
                    >
                      ✨ Terbaru
                    </button>
                  </div>
                </div>
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                <button
                  onClick={() => setSelectedCategory('ALL')}
                  className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition-colors cursor-pointer ${
                    selectedCategory === 'ALL'
                      ? 'bg-slate-800 text-white dark:bg-amber-500'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  Semua
                </button>
                {SHOWCASE_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition-colors cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-slate-800 text-white dark:bg-amber-500'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Grid Cards */}
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                      key={i}
                      className="h-56 rounded-2xl bg-slate-200/60 dark:bg-slate-800 animate-pulse border border-slate-200/40 dark:border-slate-700"
                    />
                  ))}
                </div>
              ) : showcases.length === 0 ? (
                <div
                  className={`py-12 px-6 text-center rounded-2xl border-2 border-dashed ${
                    themeConfig.isDark ? 'border-slate-800 bg-slate-900/40' : 'border-amber-200 bg-amber-50/30'
                  }`}
                >
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-100 dark:bg-slate-800 flex items-center justify-center text-3xl mb-3 shadow-xs">
                    🎨
                  </div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Belum Ada Setup Meja
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-4">
                    Jadilah orang pertama yang memamerkan tata letak meja estetik, stiker, dan temamu kepada komunitas!
                  </p>
                  <button
                    onClick={() => setActiveTab('publish')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-rose-500 shadow-md hover:scale-105 active:scale-95 transition-all"
                  >
                    <Share2 className="w-4 h-4" />
                    Pamerkan Meja Sekarang
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                  {showcases.map((item) => {
                    let parsed: Partial<UserPreferences> = {};
                    try {
                      parsed = JSON.parse(item.configJson);
                    } catch {}

                    const stickerCount = (parsed.stickers || []).length;
                    const mascot = parsed.deskBuddy || 'none';

                    return (
                      <div
                        key={item.id}
                        className={`group flex flex-col rounded-2xl border transition-all duration-200 overflow-hidden hover:shadow-xl hover:-translate-y-1 ${
                          themeConfig.isDark
                            ? 'bg-slate-800/90 border-slate-700 hover:border-amber-500/60'
                            : 'bg-white border-amber-200/70 hover:border-amber-400 shadow-xs'
                        }`}
                      >
                        {/* Visual Banner Preview */}
                        <div
                          className="h-36 w-full relative overflow-hidden flex flex-col justify-between p-3 select-none bg-slate-900"
                        >
                          {item.thumbnail ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.thumbnail}
                              alt={item.title}
                              className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <div
                              className="absolute inset-0"
                              style={{
                                backgroundColor: parsed.customTheme?.bgHex || '#fffbeb',
                                backgroundImage: parsed.customBgUrl ? `url(${parsed.customBgUrl})` : undefined,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                              }}
                            />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-black/30 pointer-events-none" />

                          {/* Top Badges */}
                          <div className="relative z-10 flex items-center justify-between">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-white/90 dark:bg-slate-900/90 text-slate-800 dark:text-slate-100 shadow-2xs backdrop-blur-xs">
                              🏷️ {item.category}
                            </span>
                            <div className="flex items-center gap-1.5">
                              {mascot !== 'none' && (
                                <span
                                  className="w-6 h-6 rounded-full bg-white/90 dark:bg-slate-900/90 flex items-center justify-center text-xs shadow-2xs"
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
                              {stickerCount > 0 && (
                                <span
                                  className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-white/90 dark:bg-slate-900/90 text-amber-600 shadow-2xs"
                                  title={`${stickerCount} Stiker Meja`}
                                >
                                  ✨ {stickerCount} stiker
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Theme indicator */}
                          <div className="relative z-10 flex items-center gap-1.5 bg-black/35 text-white backdrop-blur-xs rounded-lg px-2 py-0.8 text-[11px] self-start font-medium">
                            <span>🎨 {parsed.theme || 'sunset'}</span>
                            {parsed.fontMood && <span>• ✍️ {parsed.fontMood}</span>}
                          </div>
                        </div>

                        {/* Card Body */}
                        <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between">
                          <div>
                            <h4 className="font-bold text-sm sm:text-base text-slate-800 dark:text-slate-100 line-clamp-1 mb-1">
                              {item.title}
                            </h4>
                            {item.description ? (
                              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3 leading-relaxed">
                                {item.description}
                              </p>
                            ) : (
                              <p className="text-xs text-slate-400 italic mb-3">
                                Tidak ada deskripsi tambahan
                              </p>
                            )}
                          </div>

                          {/* Author & Stats */}
                          <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60">
                            <div className="flex items-center justify-between mb-3">
                              {/* Author */}
                              <div className="flex items-center gap-1.5 min-w-0">
                                {item.user.image ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={item.user.image}
                                    alt={item.user.name || 'User'}
                                    className="w-5 h-5 rounded-full object-cover border border-slate-200 dark:border-slate-600 shrink-0"
                                  />
                                ) : (
                                  <div className="w-5 h-5 rounded-full bg-amber-400 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                                    {(item.user.name || 'U')[0].toUpperCase()}
                                  </div>
                                )}
                                <span className="text-xs font-medium text-slate-600 dark:text-slate-300 truncate max-w-[100px]">
                                  {item.user.name || 'Kreator Ceria'}
                                </span>
                              </div>

                              {/* Likes & Clones */}
                              <div className="flex items-center gap-2 text-xs">
                                <button
                                  type="button"
                                  onClick={(e) => handleToggleLike(item.id, e)}
                                  className={`flex items-center gap-1 px-2 py-0.8 rounded-lg transition-colors cursor-pointer ${
                                    item.isLiked
                                      ? 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 font-bold'
                                      : 'text-slate-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-700'
                                  }`}
                                  title="Sukai karya ini"
                                >
                                  <Heart
                                    className={`w-3.5 h-3.5 ${item.isLiked ? 'fill-rose-500 text-rose-500' : ''}`}
                                  />
                                  <span>{item.likesCount}</span>
                                </button>

                                <span
                                  className="flex items-center gap-1 text-slate-400 dark:text-slate-500"
                                  title="Berapa kali template ini dipakai"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  <span>{item.clonesCount}</span>
                                </span>
                              </div>
                            </div>

                            {/* Action Buttons: Detail & Apply */}
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => setSelectedDetailShowcase(item)}
                                className="py-2 px-2.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Lihat Isi</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleApply(item)}
                                className="py-2 px-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:opacity-95 active:scale-98 shadow-2xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <Palette className="w-3.5 h-3.5" />
                                <span>Pakai</span>
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
            <div className="max-w-xl mx-auto space-y-5">
              {!session?.user ? (
                <div
                  className={`p-6 text-center rounded-2xl border ${
                    themeConfig.isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-amber-50/70 border-amber-200'
                  }`}
                >
                  <div className="w-12 h-12 mx-auto rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-xl mb-3">
                    🔐
                  </div>
                  <h3 className="font-bold text-base mb-1">Masuk dengan Akun Google</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                    Agar kreasi Anda dapat dikaitkan dengan profil dan diapresiasi oleh komunitas, silakan login terlebih dahulu.
                  </p>
                </div>
              ) : (
                <form onSubmit={handlePublish} className="space-y-4">
                  {/* Pilihan Privasi Tangkapan Layar */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Pilihan Privasi Teks Tangkapan Layar:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setPrivacyMode('cheerful')}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                          privacyMode === 'cheerful'
                            ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-400'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-bold text-xs text-amber-700 dark:text-amber-400 mb-1">
                          <span>🎭 Samarkan dengan Teks Ceria</span>
                          <span className="text-[9px] bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 px-1.5 py-0.2 rounded-full font-extrabold">
                            Aman
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                          Tugas asli diganti otomatis dengan contoh kegiatan santai & produktif. Privasi 100% terjaga.
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPrivacyMode('original')}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                          privacyMode === 'original'
                            ? 'bg-rose-500/10 border-rose-500 ring-2 ring-rose-400'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800 dark:text-slate-200 mb-1">
                          <span>🔓 Tampilkan Apa Adanya</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                          Memotret papan dengan seluruh teks judul dan catatan asli tanpa disensor.
                        </p>
                      </button>
                    </div>
                  </div>

                  {/* Pratinjau Tangkapan Layar Penuh (16:9 Studio Snapshot) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Camera className="w-4 h-4 text-amber-500" />
                        <span>Pratinjau Foto Meja (16:9 Penuh):</span>
                      </span>
                      <button
                        type="button"
                        onClick={generateSnapshot}
                        disabled={isCapturing}
                        className="text-[11px] font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className={`w-3 h-3 ${isCapturing ? 'animate-spin' : ''}`} />
                        <span>Ambil Ulang Foto</span>
                      </button>
                    </div>

                    <div className="relative rounded-2xl overflow-hidden border-2 border-amber-200/80 dark:border-slate-700 bg-slate-900 shadow-md aspect-video flex items-center justify-center">
                      {capturedThumbnail ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={capturedThumbnail}
                            alt="Pratinjau Meja"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-xs font-semibold">
                            <span>{privacyMode === 'cheerful' ? '🎭 Teks Ceria' : '🔓 Konten Asli'}</span>
                          </div>
                        </>
                      ) : (
                        <div className="text-xs text-slate-400 flex items-center gap-2">
                          <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                          <span>Menyiapkan tangkapan layar meja...</span>
                        </div>
                      )}
                    </div>
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
                      className={`w-full px-3.5 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-amber-400 ${
                        themeConfig.isDark
                          ? 'bg-slate-800 border-slate-700 text-white'
                          : 'bg-white border-amber-200/80 text-slate-800'
                      }`}
                    />
                    <div className="flex justify-between items-center mt-1 text-[11px] text-slate-400">
                      <span>Beri judul yang menarik & menggambarkan suasana meja Anda</span>
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
                      className={`w-full px-3.5 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer ${
                        themeConfig.isDark
                          ? 'bg-slate-800 border-slate-700 text-white'
                          : 'bg-white border-amber-200/80 text-slate-800'
                      }`}
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
                      className={`w-full px-3.5 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none ${
                        themeConfig.isDark
                          ? 'bg-slate-800 border-slate-700 text-white'
                          : 'bg-white border-amber-200/80 text-slate-800'
                      }`}
                    />
                    <div className="flex justify-end items-center mt-1 text-[11px] text-slate-400">
                      <span>{publishDesc.length}/250</span>
                    </div>
                  </div>

                  {/* Privacy Guarantee Note */}
                  <div
                    className={`p-3.5 rounded-xl border flex items-start gap-2.5 ${
                      themeConfig.isDark
                        ? 'bg-emerald-950/20 border-emerald-800/50 text-emerald-300'
                        : 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                    }`}
                  >
                    <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <div className="text-xs leading-relaxed">
                      <strong className="font-bold">Privasi 100% Terjaga:</strong> Hanya tema visual, stiker dekorasi, dan setelan tampilan yang akan dibagikan. Isi catatan pribadi dan kartu tugas rahasia Anda{' '}
                      <span className="font-bold underline">TIDAK PERNAH</span> dipublikasikan ke galeri.
                    </div>
                  </div>

                  {/* Messages */}
                  {publishError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                      {publishError}
                    </div>
                  )}

                  {publishSuccessMessage && (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                      {publishSuccessMessage}
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isPublishing}
                    className="w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:opacity-95 active:scale-98 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
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
            <div className="space-y-4">
              {myShowcases.length === 0 ? (
                <div
                  className={`py-12 px-6 text-center rounded-2xl border-2 border-dashed ${
                    themeConfig.isDark ? 'border-slate-800 bg-slate-900/40' : 'border-amber-200 bg-amber-50/30'
                  }`}
                >
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-100 dark:bg-slate-800 flex items-center justify-center text-3xl mb-3 shadow-xs">
                    📁
                  </div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Anda Belum Mempublikasikan Karya
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-4">
                    Karya meja yang Anda bagikan ke galeri komunitas akan muncul di sini. Anda bisa memantau jumlah orang yang menyukai dan memakai karyamu!
                  </p>
                  <button
                    onClick={() => setActiveTab('publish')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-rose-500 shadow-md hover:scale-105 active:scale-95 transition-all"
                  >
                    <Share2 className="w-4 h-4" />
                    Pamerkan Meja Sekarang
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {myShowcases.map((item) => (
                    <div
                      key={item.id}
                      className={`flex flex-col rounded-2xl border p-4 transition-all ${
                        themeConfig.isDark
                          ? 'bg-slate-800/90 border-slate-700'
                          : 'bg-white border-amber-200/80 shadow-xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-100 text-amber-800">
                          {item.category}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteShowcase(item.id, e)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-700 transition-colors"
                          title="Hapus dari galeri publik"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <h4 className="font-bold text-sm sm:text-base text-slate-800 dark:text-slate-100 line-clamp-1 mb-1">
                        {item.title}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
                        {item.description || 'Tanpa deskripsi'}
                      </p>
                      <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
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
        </div>

        {/* Footer */}
        <div
          className={`px-5 sm:px-6 py-3 border-t flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 shrink-0 ${
            themeConfig.isDark ? 'border-slate-800 bg-slate-900/90' : 'border-amber-100 bg-amber-50/40'
          }`}
        >
          <span>💡 Menggunakan setup galeri tidak akan menghapus tugas-tugas aktif Anda.</span>
          <button
            onClick={handleClose}
            className="px-4 py-1.5 rounded-xl font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>

      {/* Detail Inspector Modal */}
      <ShowcaseDetailModal
        showcase={selectedDetailShowcase}
        onClose={() => setSelectedDetailShowcase(null)}
        onApply={handleApply}
        onToggleLike={handleToggleLike}
      />

      {/* Hidden Off-Screen Studio Renderer for Snapshot Capture */}
      <div
        style={{
          position: 'fixed',
          left: -9999,
          top: -9999,
          width: 1200,
          height: 675,
          pointerEvents: 'none',
          opacity: 0,
          zIndex: -100,
        }}
      >
        <BoardSnapshotRenderer
          ref={snapshotRef}
          preferences={preferences}
          tasks={tasks}
          privacyMode={privacyMode}
        />
      </div>
    </div>
  );
};
