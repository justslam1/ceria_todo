import React, { useState, useRef } from 'react';
import {
  UserPreferences,
  ThemeId,
} from '@/types/preferences';
import {
  THEME_LIST,
  PATTERN_OPTIONS,
  AVATAR_OPTIONS,
  BOARD_ICONS,
  APP_ICON_PRESETS,
  WORKFLOW_PRESETS,
  COLUMN_ICON_OPTIONS,
  WASHI_TAPE_OPTIONS,
  SOUND_PROFILE_OPTIONS,
  FONT_MOOD_OPTIONS,
  CELEBRATION_OPTIONS,
  CATEGORY_COLORS,
  DEFAULT_PREFERENCES,
} from '@/lib/userPreferences';
import { compressImageToDataUrl, compressWallpaperImageToDataUrl } from '@/lib/imageCompressor';
import { triggerCelebration } from '@/lib/confetti';
import {
  Sparkles,
  Palette,
  User,
  Check,
  RotateCcw,
  X,
  Kanban,
  Play,
  Upload,
  Trash2,
  Type,
  Tag,
  PartyPopper,
  Plus,
  Target,
  Gift,
  Image as ImageIcon,
  Sliders,
  HardDrive,
  Download,
  FileJson,
  CheckCircle2,
} from 'lucide-react';
import { playPopSound, playVictoryChime } from '@/lib/soundEffects';
import { Task } from '@/types/task';

interface PersonalizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPreferences: UserPreferences;
  onSavePreferences: (newPrefs: UserPreferences) => void;
  allTasks?: Task[];
  onRestoreData?: (tasks: Task[], preferences: UserPreferences) => void;
}

export const PersonalizationModal: React.FC<PersonalizationModalProps> = ({
  isOpen,
  onClose,
  currentPreferences,
  onSavePreferences,
  allTasks = [],
  onRestoreData,
}) => {
  const [formData, setFormData] = useState<UserPreferences>(currentPreferences);
  const [prevPreferences, setPrevPreferences] = useState<UserPreferences>(currentPreferences);
  const [activeTab, setActiveTab] = useState<'profile' | 'theme' | 'workflow' | 'categories' | 'gamification' | 'effects' | 'backup'>('profile');
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingWallpaper, setIsUploadingWallpaper] = useState(false);
  const [restoreMsg, setRestoreMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const wallpaperInputRef = useRef<HTMLInputElement>(null);
  const backupInputRef = useRef<HTMLInputElement>(null);

  // New Category input state
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('purple');

  // Sync state during render when currentPreferences prop updates
  if (currentPreferences !== prevPreferences) {
    setPrevPreferences(currentPreferences);
    setFormData(currentPreferences);
  }

  if (!isOpen) return null;

  const currentThemeConfig = THEME_LIST.find((t) => t.id === formData.theme) || THEME_LIST[0];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    playVictoryChime(formData.soundProfile);
    triggerCelebration(formData.celebrationFx);
    onSavePreferences(formData);
    onClose();
  };

  const handleReset = () => {
    if (confirm('Kembalikan semua pengaturan tampilan ke setelan awal?')) {
      playPopSound(formData.soundProfile);
      setFormData(DEFAULT_PREFERENCES);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const dataUrl = await compressImageToDataUrl(file, 160);
      playPopSound(formData.soundProfile);
      setFormData((prev) => ({
        ...prev,
        customLogoUrl: dataUrl,
      }));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Gagal memproses gambar');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveCustomLogo = () => {
    playPopSound(formData.soundProfile);
    setFormData((prev) => ({
      ...prev,
      customLogoUrl: null,
    }));
  };

  const handleWallpaperUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingWallpaper(true);
      const dataUrl = await compressWallpaperImageToDataUrl(file);
      playVictoryChime(formData.soundProfile);
      setFormData((prev) => ({
        ...prev,
        bgPattern: 'custom',
        customBgUrl: dataUrl,
      }));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Gagal memproses gambar latar');
    } finally {
      setIsUploadingWallpaper(false);
      if (wallpaperInputRef.current) wallpaperInputRef.current.value = '';
    }
  };

  const handleRemoveWallpaper = () => {
    playPopSound(formData.soundProfile);
    setFormData((prev) => ({
      ...prev,
      customBgUrl: null,
      bgPattern: 'dots',
    }));
  };

  const applyWorkflowPreset = (presetId: string) => {
    const found = WORKFLOW_PRESETS.find((p) => p.id === presetId);
    if (!found) return;
    playPopSound(formData.soundProfile);
    setFormData((prev) => ({
      ...prev,
      columns: {
        TODO: { ...found.columns.TODO },
        IN_PROGRESS: { ...found.columns.IN_PROGRESS },
        DONE: { ...found.columns.DONE },
      },
    }));
  };

  const handleAddCategory = () => {
    const trimmed = newCatName.trim();
    if (!trimmed) return;
    if (formData.customCategories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
      alert('Kategori dengan nama ini sudah ada.');
      return;
    }
    playPopSound(formData.soundProfile);
    setFormData((prev) => ({
      ...prev,
      customCategories: [
        ...prev.customCategories,
        { id: `cat-${Date.now()}`, name: trimmed, color: newCatColor },
      ],
    }));
    setNewCatName('');
  };

  const handleRemoveCategory = (id: string) => {
    playPopSound(formData.soundProfile);
    setFormData((prev) => ({
      ...prev,
      customCategories: prev.customCategories.filter((c) => c.id !== id),
    }));
  };

  const handleExportBackup = () => {
    try {
      const backupData = {
        version: '1.0',
        appName: 'Ceria Todo',
        exportedAt: new Date().toISOString(),
        preferences: formData,
        tasks: allTasks || [],
      };
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(backupData, null, 2)
      )}`;
      const downloadAnchor = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      downloadAnchor.setAttribute('href', jsonString);
      downloadAnchor.setAttribute('download', `ceria-todo-cadangan-${dateStr}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      playVictoryChime(formData.soundProfile);
      setRestoreMsg('File cadangan (.json) berhasil diunduh! Simpan file ini dengan aman 📁');
      setTimeout(() => setRestoreMsg(null), 5000);
    } catch {
      alert('Gagal mengekspor data cadangan.');
    }
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        if (!parsed || typeof parsed !== 'object') {
          throw new Error('Format file tidak valid.');
        }

        const isSafeUrl = (url: unknown): string | null => {
          if (typeof url !== 'string') return null;
          const trimmed = url.trim();
          if (
            trimmed.startsWith('data:image/') ||
            trimmed.startsWith('https://') ||
            trimmed.startsWith('/')
          ) {
            return trimmed;
          }
          return null;
        };

        const rawPrefs = parsed.preferences || {};
        const importedPreferences: UserPreferences = {
          ...DEFAULT_PREFERENCES,
          ...rawPrefs,
          customLogoUrl: isSafeUrl(rawPrefs.customLogoUrl),
          customBgUrl: isSafeUrl(rawPrefs.customBgUrl),
        };

        // Safety: Cap tasks array to 100 items to match API batch limit
        const importedTasks = (Array.isArray(parsed.tasks) ? parsed.tasks : []).slice(0, 100);

        setFormData(importedPreferences);

        if (onRestoreData) {
          onRestoreData(importedTasks, importedPreferences);
        } else {
          onSavePreferences(importedPreferences);
        }

        playVictoryChime(importedPreferences.soundProfile || formData.soundProfile);
        triggerCelebration(importedPreferences.celebrationFx || formData.celebrationFx);
        setRestoreMsg(`Berhasil memulihkan ${importedTasks.length} tugas & pengaturan ruang kerja! 🎉`);
        setTimeout(() => setRestoreMsg(null), 6000);
      } catch {
        alert('File cadangan tidak valid atau rusak. Pastikan file berformat .json dari Ceria Todo.');
      } finally {
        if (backupInputRef.current) backupInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-3xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 via-white to-slate-50">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl bg-gradient-to-tr ${currentThemeConfig.accentGradient} flex items-center justify-center text-white shadow-md text-lg`}
            >
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                Personalisasi Ruang Kerja
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-normal">
                  Khusus Untukmu ✨
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Atur branding, font tulisan tangan, animasi selebrasi, hingga kategori label
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Preview Box */}
        <div className="px-6 pt-4 pb-2">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Pratinjau Langsung (Live Preview)
          </div>
          <div
            className={`p-3.5 rounded-2xl border transition-all duration-300 ${currentThemeConfig.cardBg} ${currentThemeConfig.headerBorder} shadow-xs flex flex-col gap-2.5`}
            style={{ backgroundColor: currentThemeConfig.isDark ? '#1a1d27' : '#ffffff' }}
          >
            {/* Mini Header / Navbar Brand Preview */}
            <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center overflow-hidden shrink-0 shadow-2xs ${
                    formData.customLogoUrl
                      ? 'bg-white p-0.5 border border-slate-200'
                      : `bg-gradient-to-tr ${currentThemeConfig.accentGradient} text-white`
                  }`}
                >
                  {formData.customLogoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={formData.customLogoUrl}
                      alt="Logo Preview"
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <span className="text-sm leading-none">{formData.appIconPreset || '✨'}</span>
                  )}
                </div>
                <div className="min-w-0 flex items-center gap-2">
                  <h3
                    className={`font-black text-sm tracking-tight truncate ${
                      currentThemeConfig.isDark ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    {formData.appName.trim() || 'Ceria Todo'}
                  </h3>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${currentThemeConfig.badgeBg} ${currentThemeConfig.badgeText} ${currentThemeConfig.badgeBorder}`}
                  >
                    {formData.appBadgeText.trim() || 'v1.0'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 text-xs">
                <span className="text-base" title="Avatar Kamu">{formData.avatarIcon}</span>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold border ${currentThemeConfig.badgeBg} ${currentThemeConfig.badgeText} ${currentThemeConfig.badgeBorder}`}>
                  {currentThemeConfig.name}
                </span>
              </div>
            </div>

            {/* Board Banner Preview with Font Mood applied */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-xl p-1 rounded-xl bg-slate-100/60 shadow-2xs shrink-0">
                  {formData.boardIcon || '📌'}
                </span>
                <div className="min-w-0">
                  <h4
                    className={`font-bold text-xs sm:text-sm truncate ${
                      formData.fontMood === 'handwriting'
                        ? 'font-handwriting text-base'
                        : formData.fontMood === 'rounded'
                        ? 'font-rounded font-bold'
                        : 'font-sans'
                    } ${currentThemeConfig.isDark ? 'text-white' : 'text-slate-800'}`}
                  >
                    {formData.boardTitle.trim() || 'Judul Papan'}
                  </h4>
                  <p
                    className={`text-[11px] truncate ${
                      currentThemeConfig.isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}
                  >
                    Halo <span className="font-semibold text-amber-500">{formData.userName.trim() || 'Kamu'}</span>! {formData.dailyMotto || 'Semangat terus!'}
                  </p>
                </div>
              </div>

              {/* Sample Custom Category Pill */}
              <div className="flex items-center gap-1 shrink-0">
                {formData.customCategories.slice(0, 2).map((cat) => {
                  const colorObj = CATEGORY_COLORS.find((c) => c.id === cat.color);
                  return (
                    <span
                      key={cat.id}
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                        colorObj?.classNames || 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      🏷️ {cat.name}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Mini Column Workflow Preview */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
              <div className="bg-amber-50/80 dark:bg-amber-950/30 p-1.5 rounded-xl border border-amber-200/60 dark:border-amber-800/40 flex items-center gap-1.5 truncate">
                <span>{formData.columns.TODO.emoji}</span>
                <span className="font-bold text-amber-900 dark:text-amber-200 truncate">
                  {formData.columns.TODO.title}
                </span>
              </div>
              <div className="bg-sky-50/80 dark:bg-sky-950/30 p-1.5 rounded-xl border border-sky-200/60 dark:border-sky-800/40 flex items-center gap-1.5 truncate">
                <span>{formData.columns.IN_PROGRESS.emoji}</span>
                <span className="font-bold text-sky-900 dark:text-sky-200 truncate">
                  {formData.columns.IN_PROGRESS.title}
                </span>
              </div>
              <div className="bg-emerald-50/80 dark:bg-emerald-950/30 p-1.5 rounded-xl border border-emerald-200/60 dark:border-emerald-800/40 flex items-center gap-1.5 truncate">
                <span>{formData.columns.DONE.emoji}</span>
                <span className="font-bold text-emerald-900 dark:text-emerald-200 truncate">
                  {formData.columns.DONE.title}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 pt-2 pb-0 flex border-b border-slate-100 gap-1 sm:gap-2 justify-between">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`pb-2 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap px-1 ${
              activeTab === 'profile'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Profil</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('theme')}
            className={`pb-2 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap px-1 ${
              activeTab === 'theme'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Tema</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('workflow')}
            className={`pb-2 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap px-1 ${
              activeTab === 'workflow'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <Kanban className="w-3.5 h-3.5" />
            <span>Kolom</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('categories')}
            className={`pb-2 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap px-1 ${
              activeTab === 'categories'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Kategori</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('gamification')}
            className={`pb-2 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap px-1 ${
              activeTab === 'gamification'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>Target</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('effects')}
            className={`pb-2 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap px-1 ${
              activeTab === 'effects'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <PartyPopper className="w-3.5 h-3.5" />
            <span>Efek</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('backup')}
            className={`pb-2 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap px-1 ${
              activeTab === 'backup'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Cadangan</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* TAB 1: BRAND & IDENTITAS */}
          {activeTab === 'profile' && (
            <div className="space-y-5">
              {/* Branding Navbar */}
              <div className="p-4 rounded-2xl bg-orange-50/40 border border-orange-200/80 space-y-3.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-orange-950 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                    Branding & Logo Aplikasi (Navbar Atas)
                  </h3>
                  <span className="text-[11px] text-orange-600/80 font-medium">Bisa upload foto sendiri 📸</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nama Aplikasi / Brand
                    </label>
                    <input
                      type="text"
                      maxLength={30}
                      value={formData.appName}
                      onChange={(e) => setFormData({ ...formData, appName: e.target.value })}
                      placeholder="Contoh: Ceria Todo, Dimas Workspace"
                      className="w-full px-3.5 py-2 rounded-2xl border border-slate-200 text-xs sm:text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-orange-400 font-semibold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Label Badge
                    </label>
                    <input
                      type="text"
                      maxLength={12}
                      value={formData.appBadgeText}
                      onChange={(e) => setFormData({ ...formData, appBadgeText: e.target.value })}
                      placeholder="v1.0 / Pro"
                      className="w-full px-3.5 py-2 rounded-2xl border border-slate-200 text-xs sm:text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-orange-400 font-medium text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Logo / Ikon Aplikasi
                  </label>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden border shadow-sm shrink-0 ${
                          formData.customLogoUrl
                            ? 'bg-white p-1 border-orange-300 ring-2 ring-orange-200'
                            : `bg-gradient-to-tr ${currentThemeConfig.accentGradient} text-white text-2xl`
                        }`}
                      >
                        {formData.customLogoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={formData.customLogoUrl}
                            alt="Logo Aktif"
                            className="w-full h-full object-cover rounded-xl"
                          />
                        ) : (
                          <span>{formData.appIconPreset || '✨'}</span>
                        )}
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleImageUpload}
                          accept="image/png,image/jpeg,image/webp,image/gif"
                          className="hidden"
                        />
                        <button
                          type="button"
                          disabled={isUploading}
                          onClick={() => fileInputRef.current?.click()}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-orange-50 border border-orange-300 text-orange-700 text-xs font-bold shadow-2xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>{formData.customLogoUrl ? 'Ganti Foto Logo' : 'Unggah Foto Logo 📸'}</span>
                        </button>

                        {formData.customLogoUrl && (
                          <button
                            type="button"
                            onClick={handleRemoveCustomLogo}
                            className="inline-flex items-center gap-1 text-[11px] text-rose-500 hover:text-rose-700 font-semibold cursor-pointer px-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Hapus foto (pakai ikon)</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {!formData.customLogoUrl && (
                      <div className="flex-1 sm:pl-3 sm:border-l border-orange-200/80">
                        <span className="text-[11px] font-medium text-slate-500 block mb-1">
                          Atau pilih ikon emoji bawaan:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {APP_ICON_PRESETS.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                playPopSound(formData.soundProfile);
                                setFormData({ ...formData, appIconPreset: p.icon });
                              }}
                              className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center transition-all cursor-pointer ${
                                formData.appIconPreset === p.icon
                                  ? 'bg-white shadow-xs border border-orange-400 scale-110'
                                  : 'hover:bg-orange-100/60'
                              }`}
                              title={p.label}
                            >
                              {p.icon}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Identitas Diri */}
              <div className="space-y-4 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Nama Panggilan Kamu
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      maxLength={30}
                      value={formData.userName}
                      onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                      placeholder="Contoh: Dimas, Kak Sarah, Adit"
                      className="flex-1 px-3.5 py-2 rounded-2xl border border-slate-200 text-sm bg-white text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-orange-400 font-medium"
                    />
                    <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 p-1 rounded-2xl">
                      {AVATAR_OPTIONS.slice(0, 5).map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => {
                            playPopSound(formData.soundProfile);
                            setFormData({ ...formData, avatarIcon: emoji });
                          }}
                          className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm transition-all cursor-pointer ${
                            formData.avatarIcon === emoji
                              ? 'bg-white shadow-xs scale-110 border border-amber-300'
                              : 'hover:bg-slate-200/50'
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Nama Papan Buletin Kerja
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 p-1 rounded-2xl">
                      {BOARD_ICONS.slice(0, 5).map((icon) => (
                        <button
                          key={icon}
                          type="button"
                          onClick={() => {
                            playPopSound(formData.soundProfile);
                            setFormData({ ...formData, boardIcon: icon });
                          }}
                          className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm transition-all cursor-pointer ${
                            formData.boardIcon === icon
                              ? 'bg-white shadow-xs scale-110 border border-amber-300'
                              : 'hover:bg-slate-200/50'
                          }`}
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      maxLength={40}
                      value={formData.boardTitle}
                      onChange={(e) => setFormData({ ...formData, boardTitle: e.target.value })}
                      placeholder="Contoh: Markas Tempur Dimas, Cozy Workspace"
                      className="flex-1 px-3.5 py-2 rounded-2xl border border-slate-200 text-sm bg-white text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-orange-400 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Mantra Harian / Pesan Tagline
                  </label>
                  <input
                    type="text"
                    maxLength={70}
                    value={formData.dailyMotto}
                    onChange={(e) => setFormData({ ...formData, dailyMotto: e.target.value })}
                    placeholder="Contoh: Assooyyyy | Pelan-pelan asal konsisten ✨"
                    className="w-full px-3.5 py-2 rounded-2xl border border-slate-200 text-sm bg-white text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-orange-400 font-medium"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TEMA & FONT TIPOGRAFI */}
          {activeTab === 'theme' && (
            <div className="space-y-5">
              {/* Gaya Font / Tipografi (NEW REKOMENDASI FAVORIT) */}
              <div className="p-4 rounded-2xl bg-amber-50/40 border border-amber-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                    <Type className="w-3.5 h-3.5 text-amber-600" />
                    Gaya Font / Tipografi Catatan (Font Mood)
                  </label>
                  <span className="text-[11px] text-amber-700 font-medium">Bisa tulisan tangan ✍️</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {FONT_MOOD_OPTIONS.map((f) => {
                    const isSelected = formData.fontMood === f.id;
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => {
                          playPopSound(formData.soundProfile);
                          setFormData({ ...formData, fontMood: f.id });
                        }}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between h-24 ${
                          isSelected
                            ? 'border-orange-500 bg-white shadow-xs ring-2 ring-orange-300'
                            : 'border-amber-200/70 bg-white/70 hover:bg-white hover:border-amber-300'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className={`text-base text-slate-800 ${f.fontClass}`}>
                            {f.previewText}
                          </span>
                          {isSelected && <Check className="w-4 h-4 text-orange-600" />}
                        </div>
                        <div>
                          <div className="font-bold text-xs text-slate-800">{f.label}</div>
                          <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{f.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Color Themes Grid */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Palet Warna Tema
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {THEME_LIST.map((theme) => {
                    const isSelected = formData.theme === theme.id;
                    return (
                      <div
                        key={theme.id}
                        onClick={() => {
                          playPopSound(formData.soundProfile);
                          setFormData({ ...formData, theme: theme.id as ThemeId });
                        }}
                        className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'border-orange-500 bg-orange-50/40 shadow-xs ring-1 ring-orange-400'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{theme.emoji}</span>
                          <div>
                            <div className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                              {theme.name}
                              {theme.isDark && (
                                <span className="text-[10px] px-1.5 py-0.2 bg-slate-800 text-slate-200 rounded-md">
                                  Dark
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 leading-tight">
                              {theme.tagline}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 pl-2">
                          <div className="flex -space-x-1.5 items-center">
                            {theme.previewColors.map((hex, i) => (
                              <span
                                key={i}
                                className="w-4 h-4 rounded-full border border-white shadow-2xs"
                                style={{ backgroundColor: hex }}
                              />
                            ))}
                          </div>
                          {isSelected && (
                            <Check className="w-4 h-4 text-orange-600 ml-1.5" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Background Pattern */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Tekstur Latar Papan Buletin
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {PATTERN_OPTIONS.map((pat) => {
                    const isSelected = formData.bgPattern === pat.id;
                    return (
                      <button
                        key={pat.id}
                        type="button"
                        onClick={() => {
                          playPopSound(formData.soundProfile);
                          setFormData({ ...formData, bgPattern: pat.id });
                          if (pat.id === 'custom' && !formData.customBgUrl) {
                            wallpaperInputRef.current?.click();
                          }
                        }}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between h-20 ${
                          isSelected
                            ? 'border-orange-500 bg-orange-50/50 ring-1 ring-orange-400'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-base text-slate-600 font-mono font-bold">
                            {pat.icon}
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-orange-600" />}
                        </div>
                        <div>
                          <div className="font-bold text-xs text-slate-800">{pat.label}</div>
                          <p className="text-[10px] text-slate-400 line-clamp-1">
                            {pat.desc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Pengaturan Wallpaper Foto Khusus (Muncul saat opsi 'Foto Sendiri' dipilih atau ada foto aktif) */}
              {(formData.bgPattern === 'custom' || formData.customBgUrl) && (
                <div className="p-4 rounded-2xl bg-orange-50/50 border border-orange-200/80 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
                        <ImageIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">
                          Kustomisasi Foto Latar Papan Buletin
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          Unggah foto favorit & sesuaikan kelembutan agar kartu catatan tetap terbaca jelas
                        </p>
                      </div>
                    </div>
                  </div>

                  <input
                    type="file"
                    ref={wallpaperInputRef}
                    onChange={handleWallpaperUpload}
                    accept="image/png,image/jpeg,image/webp,image/avif"
                    className="hidden"
                  />

                  {formData.customBgUrl ? (
                    <div className="space-y-4">
                      {/* Preview Box & Actions */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-white rounded-xl border border-orange-200 shadow-2xs">
                        {/* Mini Wallpaper Preview with blur and dim simulation */}
                        <div className="relative w-full sm:w-28 h-20 rounded-lg overflow-hidden border border-slate-200 shrink-0 bg-slate-100">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={formData.customBgUrl}
                            alt="Wallpaper Preview"
                            className="w-full h-full object-cover transition-all"
                            style={{
                              filter: (formData.bgBlur ?? 0) > 0 ? `blur(${formData.bgBlur}px)` : undefined,
                              transform: (formData.bgBlur ?? 0) > 0 ? 'scale(1.1)' : undefined,
                            }}
                          />
                          <div
                            className={`absolute inset-0 transition-opacity ${
                              currentThemeConfig.isDark ? 'bg-black' : 'bg-slate-900'
                            }`}
                            style={{ opacity: (formData.bgDim ?? 30) / 100 }}
                          />
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span className="text-[9px] font-bold text-white px-1.5 py-0.5 rounded-full bg-black/40 backdrop-blur-xs">
                              Pratinjau
                            </span>
                          </div>
                        </div>

                        <div className="flex-1 flex flex-col justify-between h-full gap-2">
                          <div>
                            <span className="text-xs font-bold text-slate-800 block">
                              Wallpaper Aktif Terpasang ✨
                            </span>
                            <span className="text-[11px] text-slate-500">
                              Foto telah terkompresi otomatis agar ringan di browser & hemat memori.
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              disabled={isUploadingWallpaper}
                              onClick={() => wallpaperInputRef.current?.click()}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-2xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <span>{isUploadingWallpaper ? 'Memproses...' : 'Ganti Foto'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={handleRemoveWallpaper}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Hapus Foto</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Slider Controls */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Dim Slider */}
                        <div className="p-3 bg-white rounded-xl border border-orange-100 shadow-2xs space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <label className="font-bold text-slate-700 flex items-center gap-1.5">
                              <Sliders className="w-3.5 h-3.5 text-orange-500" />
                              Lapisan Redup (Dim)
                            </label>
                            <span className="font-mono font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md">
                              {formData.bgDim ?? 30}%
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="80"
                            step="5"
                            value={formData.bgDim ?? 30}
                            onChange={(e) =>
                              setFormData({ ...formData, bgDim: Number(e.target.value) })
                            }
                            className="w-full accent-orange-500 cursor-pointer"
                          />
                          <p className="text-[10px] text-slate-400">
                            Meredupkan latar agar warna sticky note kontras & nyaman dibaca
                          </p>
                        </div>

                        {/* Blur Slider */}
                        <div className="p-3 bg-white rounded-xl border border-orange-100 shadow-2xs space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <label className="font-bold text-slate-700 flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                              Efek Buram (Blur)
                            </label>
                            <span className="font-mono font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md">
                              {formData.bgBlur ?? 2}px
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="8"
                            step="1"
                            value={formData.bgBlur ?? 2}
                            onChange={(e) =>
                              setFormData({ ...formData, bgBlur: Number(e.target.value) })
                            }
                            className="w-full accent-orange-500 cursor-pointer"
                          />
                          <p className="text-[10px] text-slate-400">
                            Melembutkan detail foto agar tidak mengalihkan konsentrasi kerja
                          </p>
                        </div>
                      </div>

                      {/* Quick Presets */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[11px] font-medium text-slate-500 mr-1">
                          Preset Cepat:
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            playPopSound(formData.soundProfile);
                            setFormData({ ...formData, bgDim: 30, bgBlur: 2 });
                          }}
                          className={`text-[10px] px-2.5 py-1 rounded-lg border font-semibold transition-all cursor-pointer ${
                            (formData.bgDim ?? 30) === 30 && (formData.bgBlur ?? 2) === 2
                              ? 'bg-orange-500 text-white border-orange-600 shadow-2xs'
                              : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                          }`}
                        >
                          Seimbang (30% / 2px) ✨
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            playPopSound(formData.soundProfile);
                            setFormData({ ...formData, bgDim: 50, bgBlur: 4 });
                          }}
                          className={`text-[10px] px-2.5 py-1 rounded-lg border font-semibold transition-all cursor-pointer ${
                            (formData.bgDim ?? 30) === 50 && (formData.bgBlur ?? 2) === 4
                              ? 'bg-orange-500 text-white border-orange-600 shadow-2xs'
                              : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                          }`}
                        >
                          Fokus Tinggi (50% / 4px) 🎯
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            playPopSound(formData.soundProfile);
                            setFormData({ ...formData, bgDim: 15, bgBlur: 0 });
                          }}
                          className={`text-[10px] px-2.5 py-1 rounded-lg border font-semibold transition-all cursor-pointer ${
                            (formData.bgDim ?? 30) === 15 && (formData.bgBlur ?? 2) === 0
                              ? 'bg-orange-500 text-white border-orange-600 shadow-2xs'
                              : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                          }`}
                        >
                          Foto Utuh Jelas (15% / 0px) 🖼️
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Upload Prompt if no image is uploaded yet */
                    <div className="p-5 bg-white rounded-xl border-2 border-dashed border-orange-300 text-center flex flex-col items-center justify-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 text-xl shadow-xs">
                        <Upload className="w-6 h-6" />
                      </div>
                      <div className="max-w-sm">
                        <p className="text-xs font-bold text-slate-800">
                          Pilih Foto dari Galeri atau Komputer
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Format JPG, PNG, atau WebP. Gambar otomatis dikompresi (&lt;250KB) agar performa tetap cepat.
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={isUploadingWallpaper}
                        onClick={() => wallpaperInputRef.current?.click()}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                      >
                        <Upload className="w-4 h-4" />
                        <span>{isUploadingWallpaper ? 'Mengunggah & Mengompres...' : 'Pilih Foto Wallpaper 📸'}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}


              {/* Washi Tape Style */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Gaya Selotip (Washi Tape) Sticky Note
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {WASHI_TAPE_OPTIONS.map((tape) => {
                    const isSelected = formData.washiTapeStyle === tape.id;
                    return (
                      <button
                        key={tape.id}
                        type="button"
                        onClick={() => {
                          playPopSound(formData.soundProfile);
                          setFormData({ ...formData, washiTapeStyle: tape.id });
                        }}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between h-22 ${
                          isSelected
                            ? 'border-orange-500 bg-orange-50/50 ring-1 ring-orange-400'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className={`w-10 h-3 rounded-xs border ${tape.preview}`} />
                          {isSelected && <Check className="w-3.5 h-3.5 text-orange-600" />}
                        </div>
                        <div>
                          <div className="font-bold text-xs text-slate-800">{tape.label}</div>
                          <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                            {tape.desc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Mode Pewarnaan Sticky Note (NEW Poin 4) */}
              <div className="p-4 rounded-2xl bg-orange-50/40 border border-orange-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-orange-950 uppercase tracking-wider flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-orange-600" />
                    Mode Pewarnaan Kertas Sticky Note
                  </label>
                  <span className="text-[11px] text-orange-600 font-medium">Bisa otomatis prioritas! ✨</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      playPopSound(formData.soundProfile);
                      setFormData({ ...formData, noteColorMode: 'column' });
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between h-24 ${
                      formData.noteColorMode === 'column'
                        ? 'border-orange-500 bg-white shadow-xs ring-2 ring-orange-300'
                        : 'border-orange-200/70 bg-white/70 hover:bg-white hover:border-orange-300'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-amber-400 border border-amber-500 shadow-2xs" />
                        <span className="w-3 h-3 rounded-full bg-sky-400 border border-sky-500 shadow-2xs" />
                        <span className="w-3 h-3 rounded-full bg-emerald-400 border border-emerald-500 shadow-2xs" />
                      </div>
                      {formData.noteColorMode === 'column' && <Check className="w-4 h-4 text-orange-600" />}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-800">Sesuai Status Kolom (Bawaan)</div>
                      <p className="text-[10px] text-slate-400 line-clamp-2 mt-0.5">
                        Kuning (To Do) ➔ Biru (In Progress) ➔ Hijau (Done).
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      playPopSound(formData.soundProfile);
                      setFormData({ ...formData, noteColorMode: 'priority' });
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between h-24 ${
                      formData.noteColorMode === 'priority'
                        ? 'border-orange-500 bg-white shadow-xs ring-2 ring-orange-300'
                        : 'border-orange-200/70 bg-white/70 hover:bg-white hover:border-orange-300'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-pink-400 border border-pink-500 shadow-2xs" />
                        <span className="w-3 h-3 rounded-full bg-amber-300 border border-amber-400 shadow-2xs" />
                        <span className="w-3 h-3 rounded-full bg-emerald-400 border border-emerald-500 shadow-2xs" />
                      </div>
                      {formData.noteColorMode === 'priority' && <Check className="w-4 h-4 text-orange-600" />}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-800">Sesuai Tingkat Prioritas</div>
                      <p className="text-[10px] text-slate-400 line-clamp-2 mt-0.5">
                        Tinggi = Pink/Peach mawar, Santai = Hijau mint tenang.
                      </p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ALUR & KOLOM */}
          {activeTab === 'workflow' && (
            <div className="space-y-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-700">
                    Template Alur Kerja Cepat (1-Klik Terapkan)
                  </label>
                  <span className="text-[11px] text-slate-400">Pilih salah satu untuk mengisi otomatis</span>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  {WORKFLOW_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => applyWorkflowPreset(p.id)}
                      className="p-3 rounded-2xl border border-slate-200 hover:border-orange-400 hover:bg-orange-50/30 text-left transition-all cursor-pointer flex items-start gap-2.5 group"
                    >
                      <span className="text-xl p-1.5 rounded-xl bg-slate-100 group-hover:bg-white shadow-2xs">
                        {p.icon}
                      </span>
                      <div>
                        <div className="font-bold text-xs text-slate-800 group-hover:text-orange-600">
                          {p.name}
                        </div>
                        <p className="text-[10px] text-slate-400 leading-tight mt-0.5">
                          {p.desc}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700">
                    Ubah Nama & Icon Kolom Secara Manual
                  </label>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Klik salah satu icon rekomendasi atau ketik emoji pilihanmu sendiri.
                  </p>
                </div>

                {/* Kolom 1 (TODO) */}
                <div className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-200/80 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                    <span className="flex items-center gap-1.5">
                      <span>Kolom 1: Status Rencana (To Do)</span>
                    </span>
                    <span className="text-[11px] font-normal text-amber-700">
                      Icon aktif: <span className="text-base font-mono">{formData.columns.TODO.emoji}</span>
                    </span>
                  </div>

                  {/* Pilihan Icon Cepat */}
                  <div className="flex flex-col gap-1.5 bg-white/80 p-2 rounded-xl border border-amber-200/70">
                    <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">
                      Pilihan Icon Cepat:
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {COLUMN_ICON_OPTIONS.TODO.map((ico) => (
                        <button
                          key={ico}
                          type="button"
                          onClick={() => {
                            playPopSound(formData.soundProfile);
                            setFormData({
                              ...formData,
                              columns: {
                                ...formData.columns,
                                TODO: { ...formData.columns.TODO, emoji: ico },
                              },
                            });
                          }}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm transition-all cursor-pointer ${
                            formData.columns.TODO.emoji === ico
                              ? 'bg-amber-400 text-white shadow-xs scale-115 ring-2 ring-amber-300'
                              : 'bg-amber-50/80 hover:bg-amber-100 hover:scale-105'
                          }`}
                          title={`Pilih icon ${ico}`}
                        >
                          {ico}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <input
                        type="text"
                        maxLength={4}
                        value={formData.columns.TODO.emoji}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            columns: {
                              ...formData.columns,
                              TODO: { ...formData.columns.TODO, emoji: e.target.value },
                            },
                          })
                        }
                        title="Ketik emoji sendiri"
                        placeholder="Icon"
                        className="w-12 text-center px-1 py-1.5 rounded-xl border border-amber-300 text-base bg-white font-mono shadow-2xs"
                      />
                    </div>
                    <input
                      type="text"
                      maxLength={30}
                      value={formData.columns.TODO.title}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          columns: {
                            ...formData.columns,
                            TODO: { ...formData.columns.TODO, title: e.target.value },
                          },
                        })
                      }
                      placeholder="Nama Kolom 1"
                      className="flex-1 px-3 py-1.5 rounded-xl border border-amber-300 text-xs sm:text-sm bg-white font-medium"
                    />
                  </div>
                  <input
                    type="text"
                    maxLength={60}
                    value={formData.columns.TODO.subtitle}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        columns: {
                          ...formData.columns,
                          TODO: { ...formData.columns.TODO, subtitle: e.target.value },
                        },
                      })
                    }
                    placeholder="Subjudul kolom 1"
                    className="w-full px-3 py-1 rounded-xl border border-amber-200 text-xs bg-white text-slate-600"
                  />
                </div>

                {/* Kolom 2 (IN_PROGRESS) */}
                <div className="p-3.5 rounded-2xl bg-sky-50/50 border border-sky-200/80 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between text-xs font-bold text-sky-900">
                    <span className="flex items-center gap-1.5">
                      <span>Kolom 2: Status Sedang Dikerjakan (In Progress)</span>
                    </span>
                    <span className="text-[11px] font-normal text-sky-700">
                      Icon aktif: <span className="text-base font-mono">{formData.columns.IN_PROGRESS.emoji}</span>
                    </span>
                  </div>

                  {/* Pilihan Icon Cepat */}
                  <div className="flex flex-col gap-1.5 bg-white/80 p-2 rounded-xl border border-sky-200/70">
                    <div className="text-[10px] font-bold text-sky-800 uppercase tracking-wider">
                      Pilihan Icon Cepat:
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {COLUMN_ICON_OPTIONS.IN_PROGRESS.map((ico) => (
                        <button
                          key={ico}
                          type="button"
                          onClick={() => {
                            playPopSound(formData.soundProfile);
                            setFormData({
                              ...formData,
                              columns: {
                                ...formData.columns,
                                IN_PROGRESS: { ...formData.columns.IN_PROGRESS, emoji: ico },
                              },
                            });
                          }}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm transition-all cursor-pointer ${
                            formData.columns.IN_PROGRESS.emoji === ico
                              ? 'bg-sky-500 text-white shadow-xs scale-115 ring-2 ring-sky-300'
                              : 'bg-sky-50/80 hover:bg-sky-100 hover:scale-105'
                          }`}
                          title={`Pilih icon ${ico}`}
                        >
                          {ico}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <input
                        type="text"
                        maxLength={4}
                        value={formData.columns.IN_PROGRESS.emoji}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            columns: {
                              ...formData.columns,
                              IN_PROGRESS: { ...formData.columns.IN_PROGRESS, emoji: e.target.value },
                            },
                          })
                        }
                        title="Ketik emoji sendiri"
                        placeholder="Icon"
                        className="w-12 text-center px-1 py-1.5 rounded-xl border border-sky-300 text-base bg-white font-mono shadow-2xs"
                      />
                    </div>
                    <input
                      type="text"
                      maxLength={30}
                      value={formData.columns.IN_PROGRESS.title}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          columns: {
                            ...formData.columns,
                            IN_PROGRESS: { ...formData.columns.IN_PROGRESS, title: e.target.value },
                          },
                        })
                      }
                      placeholder="Nama Kolom 2"
                      className="flex-1 px-3 py-1.5 rounded-xl border border-sky-300 text-xs sm:text-sm bg-white font-medium"
                    />
                  </div>
                  <input
                    type="text"
                    maxLength={60}
                    value={formData.columns.IN_PROGRESS.subtitle}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        columns: {
                          ...formData.columns,
                          IN_PROGRESS: { ...formData.columns.IN_PROGRESS, subtitle: e.target.value },
                        },
                      })
                    }
                    placeholder="Subjudul kolom 2"
                    className="w-full px-3 py-1 rounded-xl border border-sky-200 text-xs bg-white text-slate-600"
                  />
                </div>

                {/* Kolom 3 (DONE) */}
                <div className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
                    <span className="flex items-center gap-1.5">
                      <span>Kolom 3: Status Selesai (Done)</span>
                    </span>
                    <span className="text-[11px] font-normal text-emerald-700">
                      Icon aktif: <span className="text-base font-mono">{formData.columns.DONE.emoji}</span>
                    </span>
                  </div>

                  {/* Pilihan Icon Cepat */}
                  <div className="flex flex-col gap-1.5 bg-white/80 p-2 rounded-xl border border-emerald-200/70">
                    <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                      Pilihan Icon Cepat:
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {COLUMN_ICON_OPTIONS.DONE.map((ico) => (
                        <button
                          key={ico}
                          type="button"
                          onClick={() => {
                            playPopSound(formData.soundProfile);
                            setFormData({
                              ...formData,
                              columns: {
                                ...formData.columns,
                                DONE: { ...formData.columns.DONE, emoji: ico },
                              },
                            });
                          }}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm transition-all cursor-pointer ${
                            formData.columns.DONE.emoji === ico
                              ? 'bg-emerald-500 text-white shadow-xs scale-115 ring-2 ring-emerald-300'
                              : 'bg-emerald-50/80 hover:bg-emerald-100 hover:scale-105'
                          }`}
                          title={`Pilih icon ${ico}`}
                        >
                          {ico}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <input
                        type="text"
                        maxLength={4}
                        value={formData.columns.DONE.emoji}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            columns: {
                              ...formData.columns,
                              DONE: { ...formData.columns.DONE, emoji: e.target.value },
                            },
                          })
                        }
                        title="Ketik emoji sendiri"
                        placeholder="Icon"
                        className="w-12 text-center px-1 py-1.5 rounded-xl border border-emerald-300 text-base bg-white font-mono shadow-2xs"
                      />
                    </div>
                    <input
                      type="text"
                      maxLength={30}
                      value={formData.columns.DONE.title}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          columns: {
                            ...formData.columns,
                            DONE: { ...formData.columns.DONE, title: e.target.value },
                          },
                        })
                      }
                      placeholder="Nama Kolom 3"
                      className="flex-1 px-3 py-1.5 rounded-xl border border-emerald-300 text-xs sm:text-sm bg-white font-medium"
                    />
                  </div>
                  <input
                    type="text"
                    maxLength={60}
                    value={formData.columns.DONE.subtitle}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        columns: {
                          ...formData.columns,
                          DONE: { ...formData.columns.DONE, subtitle: e.target.value },
                        },
                      })
                    }
                    placeholder="Subjudul kolom 3"
                    className="w-full px-3 py-1 rounded-xl border border-emerald-200 text-xs bg-white text-slate-600"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: LABEL KATEGORI KUSTOM (NEW REKOMENDASI FAVORIT) */}
          {activeTab === 'categories' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-purple-50/40 border border-purple-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-purple-950 uppercase tracking-wider flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-purple-600" />
                    Tambah Kategori Sendiri
                  </label>
                  <span className="text-[11px] text-purple-600 font-medium">Buat label tugas sesukamu</span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-2.5">
                  <input
                    type="text"
                    maxLength={25}
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="Contoh: Skripsi, Gym, Belanjaan, SideHustle"
                    className="w-full sm:flex-1 px-3.5 py-2 rounded-2xl border border-purple-200 text-xs sm:text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-400 font-medium text-slate-800"
                  />

                  {/* Color Picker dots */}
                  <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-purple-200">
                    {CATEGORY_COLORS.map((col) => (
                      <button
                        key={col.id}
                        type="button"
                        onClick={() => setNewCatColor(col.id)}
                        className={`w-6 h-6 rounded-full transition-transform cursor-pointer border ${
                          newCatColor === col.id ? 'scale-125 ring-2 ring-purple-500 shadow-xs' : 'hover:scale-110 opacity-75'
                        }`}
                        style={{ backgroundColor: col.dotHex }}
                        title={col.label}
                      />
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleAddCategory}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-2xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white text-xs font-bold shadow-md shadow-purple-200 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah</span>
                  </button>
                </div>
              </div>

              {/* List of Custom Categories */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Daftar Kategori Aktif ({formData.customCategories.length})
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {formData.customCategories.map((cat) => {
                    const colorObj = CATEGORY_COLORS.find((c) => c.id === cat.color);
                    return (
                      <div
                        key={cat.id}
                        className="p-2.5 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span
                            className={`text-xs px-2.5 py-0.5 rounded-full font-bold border truncate ${
                              colorObj?.classNames || 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            🏷️ {cat.name}
                          </span>
                        </div>

                        {/* Inline color changer */}
                        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
                          {CATEGORY_COLORS.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => {
                                playPopSound(formData.soundProfile);
                                setFormData({
                                  ...formData,
                                  customCategories: formData.customCategories.map((item) =>
                                    item.id === cat.id ? { ...item, color: c.id } : item
                                  ),
                                });
                              }}
                              className={`w-4 h-4 rounded-full transition-transform cursor-pointer border ${
                                cat.color === c.id
                                  ? 'scale-125 ring-2 ring-purple-500 shadow-2xs'
                                  : 'hover:scale-110 opacity-70 hover:opacity-100'
                              }`}
                              style={{ backgroundColor: c.dotHex }}
                              title={`Ubah warna ke ${c.label}`}
                            />
                          ))}
                        </div>

                        {formData.customCategories.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveCategory(cat.id)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Hapus kategori"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: GAMIFIKASI & TARGET HARIAN (NEW Poin 5) */}
          {activeTab === 'gamification' && (
            <div className="space-y-5">
              {/* Daily Target Goal Card */}
              <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                    <Target className="w-4 h-4 text-amber-600" />
                    Target Tugas Selesai Harian (Daily Goal)
                  </label>
                  <span className="text-[11px] text-amber-700 font-medium">Bikin semangat konsisten! 🔥</span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Tentukan berapa tugas yang ingin kamu selesaikan setiap harinya. Progress bar di atas papan akan menunjukkan persentase menuju target ini.
                </p>

                <div className="flex items-center gap-3">
                  {[2, 3, 4, 5, 8, 10].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => {
                        playPopSound(formData.soundProfile);
                        setFormData({ ...formData, dailyTargetGoal: num });
                      }}
                      className={`w-10 h-10 rounded-2xl font-bold text-sm transition-all cursor-pointer border ${
                        formData.dailyTargetGoal === num
                          ? 'bg-amber-500 text-white border-amber-600 shadow-xs scale-110 ring-2 ring-amber-300'
                          : 'bg-white text-slate-700 border-amber-200 hover:bg-amber-50 hover:border-amber-300'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                  <div className="flex items-center gap-1.5 pl-2">
                    <span className="text-xs text-slate-500">Kustom:</span>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={formData.dailyTargetGoal || 4}
                      onChange={(e) =>
                        setFormData({ ...formData, dailyTargetGoal: Math.max(1, parseInt(e.target.value) || 1) })
                      }
                      className="w-14 px-2 py-1.5 rounded-xl border border-amber-200 text-xs font-bold bg-white text-center focus:outline-hidden focus:ring-2 focus:ring-amber-400"
                    />
                    <span className="text-xs text-slate-500">tugas/hari</span>
                  </div>
                </div>
              </div>

              {/* Self-Reward Note Card */}
              <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-rose-950 uppercase tracking-wider flex items-center gap-1.5">
                    <Gift className="w-4 h-4 text-rose-600" />
                    Hadiah Untuk Diri Sendiri (Self-Reward Note)
                  </label>
                  <span className="text-[11px] text-rose-700 font-medium">Beri apresiasi usahamu! 🎁</span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Tuliskan hadiah kecil yang akan kamu nikmati saat semua target hari ini tuntas. Saat target 100% tercapai, notifikasi apresiasi & selebrasi akan muncul!
                </p>

                <div className="space-y-2">
                  <input
                    type="text"
                    maxLength={80}
                    value={formData.rewardNote || ''}
                    onChange={(e) => setFormData({ ...formData, rewardNote: e.target.value })}
                    placeholder="Contoh: Beli Es Kopi Susu gula aren! ☕ atau Nonton 1 episode anime 🎬"
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-rose-200 text-sm font-medium bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-400 text-slate-800"
                  />

                  {/* Template Ide Hadiah Cepat */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-slate-400 font-semibold mr-1">Ide cepat:</span>
                    {[
                      'Beli Es Kopi Susu gula aren! ☕',
                      'Nonton 1 episode serial favorit 🎬',
                      'Makan camilan enak tanpa rasa bersalah 🍰',
                      'Tidur siang 30 menit nyenyak 💤',
                      'Main game santai 1 jam 🎮',
                    ].map((idea) => (
                      <button
                        key={idea}
                        type="button"
                        onClick={() => {
                          playPopSound(formData.soundProfile);
                          setFormData({ ...formData, rewardNote: idea });
                        }}
                        className="text-[11px] px-2.5 py-1 rounded-xl bg-white border border-rose-200/70 hover:bg-rose-100/50 text-rose-900 transition-colors cursor-pointer"
                      >
                        {idea}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: AUDIO & SELEBRASI */}
          {activeTab === 'effects' && (
            <div className="space-y-5">
              {/* Celebration Animation Picker */}
              <div className="p-4 rounded-2xl bg-emerald-50/40 border border-emerald-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                    <PartyPopper className="w-3.5 h-3.5 text-emerald-600" />
                    Animasi Selebrasi Selesai Tugas (Celebration FX)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      playVictoryChime(formData.soundProfile);
                      triggerCelebration(formData.celebrationFx);
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/80 hover:bg-emerald-200 px-2.5 py-1 rounded-xl cursor-pointer active:scale-95 transition-all"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Tes Selebrasi 🎉</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {CELEBRATION_OPTIONS.map((c) => {
                    const isSelected = formData.celebrationFx === c.id;
                    return (
                      <div
                        key={c.id}
                        onClick={() => {
                          playPopSound(formData.soundProfile);
                          setFormData({ ...formData, celebrationFx: c.id });
                          triggerCelebration(c.id);
                        }}
                        className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'border-emerald-500 bg-white shadow-xs ring-1 ring-emerald-400'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl p-1 rounded-xl bg-slate-100">{c.icon}</span>
                          <div>
                            <div className="font-bold text-xs text-slate-800">{c.label}</div>
                            <p className="text-[10px] text-slate-500">{c.desc}</p>
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-emerald-600" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sound Profile Audio Mood */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Paket Efek Suara (Audio Mood)
                </label>
                <div className="space-y-2.5">
                  {SOUND_PROFILE_OPTIONS.map((sp) => {
                    const isSelected = formData.soundProfile === sp.id;
                    return (
                      <div
                        key={sp.id}
                        onClick={() => {
                          playPopSound(sp.id);
                          setFormData({ ...formData, soundProfile: sp.id });
                        }}
                        className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'border-orange-500 bg-orange-50/40 shadow-xs ring-1 ring-orange-400'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl p-1.5 rounded-xl bg-slate-100">
                            {sp.icon}
                          </span>
                          <div>
                            <div className="font-bold text-xs sm:text-sm text-slate-800 flex items-center gap-2">
                              {sp.label}
                              {isSelected && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-semibold">
                                  Aktif
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500">{sp.desc}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => playPopSound(sp.id)}
                            className="px-2.5 py-1.5 rounded-xl border border-slate-200 hover:bg-white text-[11px] font-semibold text-slate-600 flex items-center gap-1 active:scale-95 cursor-pointer shadow-2xs"
                            title="Tes efek geser/pop"
                          >
                            <Play className="w-3 h-3 text-orange-500" />
                            <span>Pop</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => playVictoryChime(sp.id)}
                            className="px-2.5 py-1.5 rounded-xl border border-slate-200 hover:bg-white text-[11px] font-semibold text-slate-600 flex items-center gap-1 active:scale-95 cursor-pointer shadow-2xs"
                            title="Tes suara misi selesai"
                          >
                            <Sparkles className="w-3 h-3 text-emerald-500" />
                            <span>Fanfare</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: CADANGAN & PULIHKAN (BACKUP & RESTORE) */}
          {activeTab === 'backup' && (
            <div className="space-y-4">
              {/* Feedback Alert if present */}
              {restoreMsg && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{restoreMsg}</span>
                </div>
              )}

              {/* Ekspor Cadangan Card */}
              <div className="p-4 rounded-2xl bg-sky-50/50 border border-sky-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-sky-950 uppercase tracking-wider flex items-center gap-1.5">
                    <Download className="w-3.5 h-3.5 text-sky-600" />
                    Ekspor Data Cadangan (.json)
                  </h3>
                  <span className="text-[11px] text-sky-700 font-medium">Cadangkan Tugas & Pengaturan 📦</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Unduh seluruh daftar tugas ({allTasks.length} tugas) beserta semua pengaturan personalisasi, tema, dan target harian ke dalam satu file JSON. Kamu bisa menyimpannya untuk jaga-jaga atau memindahkannya ke perangkat lain.
                </p>
                <button
                  type="button"
                  onClick={handleExportBackup}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh File Cadangan Sekarang</span>
                </button>
              </div>

              {/* Pulihkan Cadangan Card */}
              <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5 text-amber-600" />
                    Pulihkan Data Cadangan (.json)
                  </h3>
                  <span className="text-[11px] text-amber-700 font-medium">Restore Cadangan Lama 🔄</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Pilih file cadangan JSON yang pernah kamu unduh sebelumnya untuk memulihkan seluruh tugas dan preferensi tampilan papan buletin kamu secara instan.
                </p>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    ref={backupInputRef}
                    onChange={handleImportBackup}
                    accept=".json,application/json"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => backupInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-amber-100/70 border border-amber-300 text-amber-900 text-xs font-bold shadow-2xs active:scale-95 transition-all cursor-pointer"
                  >
                    <FileJson className="w-4 h-4 text-amber-600" />
                    <span>Pilih File Cadangan (.json)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Footer Controls */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-600 transition-colors cursor-pointer py-1.5 px-2.5 rounded-xl hover:bg-rose-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Default</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-2xl border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-600 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold shadow-md transition-all cursor-pointer ${currentThemeConfig.primaryButton}`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Simpan & Terapkan</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
