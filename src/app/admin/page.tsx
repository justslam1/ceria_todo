'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import {
  ArrowLeft,
  Shield,
  Users,
  CheckCircle2,
  StickyNote,
  LayoutGrid,
  Search,
  RefreshCw,
  Heart,
  TrendingUp,
  Compass,
  AlertCircle,
  X,
  Mail,
  Download,
  Megaphone,
  Database,
  BarChart2,
  Sparkles,
  Trash2,
  Star,
  ExternalLink,
  UserX,
  UserCheck,
  Check,
} from 'lucide-react';

interface AdminStats {
  totalUsers: number;
  newUsersThisWeek: number;
  totalBoards: number;
  totalNotes: number;
  totalTasks: number;
  tasksTodo: number;
  tasksInProgress: number;
  tasksDone: number;
  totalShowcases: number;
  totalLikes: number;
}

interface AdminUserItem {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: string;
  isSuspended: boolean;
  createdAt: string;
  updatedAt: string;
  isAdmin: boolean;
  counts: {
    boards: number;
    tasks: number;
    notes: number;
    showcases: number;
    likes: number;
    tasksTodo: number;
    tasksInProgress: number;
    tasksDone: number;
  };
}

interface AdminShowcaseItem {
  id: string;
  title: string;
  description: string | null;
  category: string;
  thumbnail: string | null;
  likesCount: number;
  clonesCount: number;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
}

interface AdminAnnouncement {
  id: string;
  message: string;
  type: 'info' | 'celebration' | 'warning';
  isActive: boolean;
  linkUrl: string | null;
  updatedAt: string;
}

interface AdminAnalytics {
  signupTrend: { date: string; count: number }[];
  categories: { category: string; count: number }[];
}

interface SystemHealth {
  status: string;
  dbLatencyMs: number;
  tablesCount: {
    users: number;
    boards: number;
    notes: number;
    tasks: number;
    showcases: number;
    likes: number;
  };
}

export default function AdminDashboardPage() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'moderation' | 'announcement' | 'health'>('overview');

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [showcases, setShowcases] = useState<AdminShowcaseItem[]>([]);
  const [announcement, setAnnouncement] = useState<AdminAnnouncement | null>(null);
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Search & Filters for Users
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'active' | 'admin' | 'suspended'>('all');
  const [sortBy, setSortBy] = useState<'joined' | 'tasks' | 'notes'>('joined');
  const [selectedUser, setSelectedUser] = useState<AdminUserItem | null>(null);

  // Announcement Form State
  const [announcementMsg, setAnnouncementMsg] = useState('');
  const [announcementType, setAnnouncementType] = useState<'info' | 'celebration' | 'warning'>('info');
  const [announcementActive, setAnnouncementActive] = useState(true);
  const [announcementLink, setAnnouncementLink] = useState('');
  const [isSavingAnnouncement, setIsSavingAnnouncement] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const isLoading =
    status === 'loading' ||
    (status === 'authenticated' && stats === null && fetchError === null) ||
    isRefreshing;

  const errorMsg =
    status === 'unauthenticated'
      ? 'Silakan masuk (login) terlebih dahulu untuk mengakses halaman ini.'
      : fetchError;

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    setFetchError(null);
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal memuat data dasbor admin');
      }
      setStats(data.stats);
      setUsers(data.users || []);
      setShowcases(data.showcases || []);
      setAnnouncement(data.announcement || null);
      setAnalytics(data.analytics || null);
      setSystemHealth(data.systemHealth || null);

      if (data.announcement) {
        setAnnouncementMsg(data.announcement.message);
        setAnnouncementType(data.announcement.type || 'info');
        setAnnouncementActive(data.announcement.isActive);
        setAnnouncementLink(data.announcement.linkUrl || '');
      }
      showToast('Data dasbor berhasil diperbarui');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setFetchError(err.message);
      } else {
        setFetchError('Terjadi kesalahan yang tidak terduga');
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    if (status !== 'authenticated') return;

    fetch('/api/admin/stats')
      .then(async (res) => {
        const data = await res.json();
        if (!isMounted) return;
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Gagal memuat data dasbor admin');
        }
        setStats(data.stats);
        setUsers(data.users || []);
        setShowcases(data.showcases || []);
        setAnnouncement(data.announcement || null);
        setAnalytics(data.analytics || null);
        setSystemHealth(data.systemHealth || null);

        if (data.announcement) {
          setAnnouncementMsg(data.announcement.message);
          setAnnouncementType(data.announcement.type || 'info');
          setAnnouncementActive(data.announcement.isActive);
          setAnnouncementLink(data.announcement.linkUrl || '');
        }
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        if (err instanceof Error) {
          setFetchError(err.message);
        } else {
          setFetchError('Terjadi kesalahan yang tidak terduga');
        }
      });

    return () => {
      isMounted = false;
    };
  }, [status]);

  // Export Users to CSV (Excel Compatible with UTF-8 BOM)
  const handleExportCSV = () => {
    if (users.length === 0) return;

    const headers = [
      'ID Pengguna',
      'Nama',
      'Email',
      'Peran (Role)',
      'Status Akun',
      'Tanggal Bergabung',
      'Aktivitas Terakhir',
      'Total Papan',
      'Total Catatan',
      'Total Tugas',
      'Tugas Selesai',
      'Tugas Dikerjakan',
      'Tugas Todo',
      'Showcase Galeri',
      'Total Likes',
    ];

    const rows = users.map((u) => [
      `"${u.id}"`,
      `"${(u.name || '').replace(/"/g, '""')}"`,
      `"${(u.email || '').replace(/"/g, '""')}"`,
      `"${u.isAdmin ? 'ADMIN' : 'USER'}"`,
      `"${u.isSuspended ? 'DITANGGUHKAN' : 'AKTIF'}"`,
      `"${new Date(u.createdAt).toLocaleString('id-ID')}"`,
      `"${new Date(u.updatedAt).toLocaleString('id-ID')}"`,
      u.counts.boards,
      u.counts.notes,
      u.counts.tasks,
      u.counts.tasksDone,
      u.counts.tasksInProgress,
      u.counts.tasksTodo,
      u.counts.showcases,
      u.counts.likes,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ceria_todo_users_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Laporan pengguna berhasil diunduh (CSV/Excel)');
  };

  // Toggle Admin Role
  const handleToggleAdminRole = async (targetUser: AdminUserItem) => {
    const newRole = targetUser.isAdmin ? 'USER' : 'ADMIN';
    const confirmText = targetUser.isAdmin
      ? `Cabut hak akses admin dari ${targetUser.name}?`
      : `Angkat ${targetUser.name} sebagai Administrator?`;

    if (!window.confirm(confirmText)) return;

    try {
      const res = await fetch(`/api/admin/users/${targetUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal mengubah peran admin');
      }

      setUsers((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, role: newRole, isAdmin: newRole === 'ADMIN' } : u))
      );
      showToast(`Peran ${targetUser.name} berhasil diubah`);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Gagal mengubah peran admin');
    }
  };

  // Toggle Suspend Status
  const handleToggleSuspend = async (targetUser: AdminUserItem) => {
    const nextSuspended = !targetUser.isSuspended;
    const confirmText = nextSuspended
      ? `Tangguhkan akun ${targetUser.name}? Pengguna ini tidak akan bisa mengakses papan.`
      : `Aktifkan kembali akun ${targetUser.name}?`;

    if (!window.confirm(confirmText)) return;

    try {
      const res = await fetch(`/api/admin/users/${targetUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isSuspended: nextSuspended }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal mengubah status penangguhan akun');
      }

      setUsers((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, isSuspended: nextSuspended } : u))
      );
      showToast(`Status akun ${targetUser.name} diperbarui`);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Gagal menangguhkan akun');
    }
  };

  // Toggle Featured Showcase
  const handleToggleFeaturedShowcase = async (item: AdminShowcaseItem) => {
    const nextFeatured = !item.isFeatured;
    try {
      const res = await fetch(`/api/admin/showcases/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFeatured: nextFeatured }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal memperbarui status pilihan editor');
      }

      setShowcases((prev) =>
        prev.map((s) => (s.id === item.id ? { ...s, isFeatured: nextFeatured } : s))
      );
      showToast(nextFeatured ? 'Showcase dijadikan Pilihan Editor 🌟' : 'Pilihan Editor dicabut');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Gagal memperbarui status');
    }
  };

  // Delete Showcase (Moderation)
  const handleDeleteShowcase = async (item: AdminShowcaseItem) => {
    if (!window.confirm(`Hapus showcase "${item.title}" dari galeri komunitas? Tindakan ini tidak dapat dibatalkan.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/showcases/${item.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal menghapus showcase');
      }

      setShowcases((prev) => prev.filter((s) => s.id !== item.id));
      showToast('Showcase berhasil dihapus');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Gagal menghapus showcase');
    }
  };

  // Save Announcement
  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementMsg.trim()) return;

    setIsSavingAnnouncement(true);
    try {
      const res = await fetch('/api/admin/announcement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: announcementMsg.trim(),
          type: announcementType,
          isActive: announcementActive,
          linkUrl: announcementLink.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal menyimpan pengumuman');
      }

      setAnnouncement(data.announcement);
      showToast('Pengumuman sistem berhasil disimpan dan dipublikasikan');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Gagal menyimpan pengumuman');
    } finally {
      setIsSavingAnnouncement(false);
    }
  };

  // Filtered and sorted users
  const filteredUsers = useMemo(() => {
    let result = [...users];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.id.toLowerCase().includes(q)
      );
    }

    if (selectedFilter === 'admin') {
      result = result.filter((u) => u.isAdmin);
    } else if (selectedFilter === 'suspended') {
      result = result.filter((u) => u.isSuspended);
    } else if (selectedFilter === 'active') {
      result = result.filter((u) => u.counts.tasks > 0 || u.counts.notes > 0 || u.counts.boards > 0);
    }

    result.sort((a, b) => {
      if (sortBy === 'tasks') {
        return b.counts.tasks - a.counts.tasks;
      }
      if (sortBy === 'notes') {
        return b.counts.notes - a.counts.notes;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return result;
  }, [users, searchQuery, selectedFilter, sortBy]);

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const formatDateTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const completionRate = useMemo(() => {
    if (!stats || stats.totalTasks === 0) return 0;
    return Math.round((stats.tasksDone / stats.totalTasks) * 100);
  }, [stats]);

  // Max signup count for scaling the trend chart
  const maxSignupDaily = useMemo(() => {
    if (!analytics || analytics.signupTrend.length === 0) return 1;
    const max = Math.max(...analytics.signupTrend.map((t) => t.count));
    return max > 0 ? max : 1;
  }, [analytics]);

  return (
    <div className="min-h-screen bg-[#faf8f5] text-stone-800 flex flex-col font-sans selection:bg-amber-200 selection:text-amber-900 pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-white px-4 py-2.5 rounded-2xl shadow-2xl text-xs font-bold flex items-center gap-2 border border-stone-700 animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header with Ceria Board Aesthetic */}
      <header className="sticky top-0 z-30 bg-[#faf8f5]/95 backdrop-blur-md border-b border-amber-200/80 shadow-2xs px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 hover:bg-amber-50 text-stone-700 hover:text-amber-800 border border-stone-200/90 hover:border-amber-300 shadow-2xs hover:shadow-xs transition-all text-xs sm:text-sm font-semibold active:scale-95"
            >
              <ArrowLeft className="w-4 h-4 text-amber-600" />
              <span>Kembali ke Papan</span>
            </Link>

            <div className="h-5 w-px bg-stone-300 hidden sm:block" />

            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-amber-500/15 text-amber-700 border border-amber-300/80">
                <Shield className="w-4 h-4" />
              </span>
              <div>
                <h1 className="text-sm sm:text-base font-extrabold text-stone-900 tracking-tight flex items-center gap-1.5">
                  Dasbor Pemantau Admin
                  <span className="text-[10px] uppercase font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full shadow-2xs">
                    Admin
                  </span>
                </h1>
                <p className="text-[11px] text-stone-500 hidden sm:block">
                  Pusat kendali, moderasi, analitik, dan kesehatan sistem Ceria Todo
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleManualRefresh}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-amber-50 border border-stone-200 text-stone-700 hover:text-amber-800 text-xs font-semibold shadow-2xs transition-all cursor-pointer active:scale-95 disabled:opacity-60"
              title="Perbarui data"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-amber-600 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Muat Ulang</span>
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs Bar */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-8 pt-5">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-amber-200/80 scrollbar-none">
          <button
            onClick={() => setActiveTab('overview')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-white/80 text-stone-600 hover:bg-amber-100/60 border border-stone-200/80'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            <span>Ringkasan & Analitik</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'users'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-white/80 text-stone-600 hover:bg-amber-100/60 border border-stone-200/80'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Manajemen Pengguna ({users.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('moderation')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'moderation'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-white/80 text-stone-600 hover:bg-amber-100/60 border border-stone-200/80'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Moderasi Galeri ({showcases.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('announcement')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'announcement'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-white/80 text-stone-600 hover:bg-amber-100/60 border border-stone-200/80'
            }`}
          >
            <Megaphone className="w-4 h-4" />
            <span>Pengumuman Sistem</span>
            {announcement?.isActive && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('health')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'health'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-white/80 text-stone-600 hover:bg-amber-100/60 border border-stone-200/80'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Kesehatan Sistem & DB</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-8 pt-6 flex-1 flex flex-col gap-6">
        {/* Error Alert */}
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3 shadow-xs animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-bold">Akses Terbatas / Terjadi Kendala</h3>
              <p className="text-xs text-rose-700 mt-0.5">{errorMsg}</p>
            </div>
            <Link
              href="/"
              className="px-3 py-1 rounded-xl bg-white border border-rose-200 text-rose-700 hover:bg-rose-100 text-xs font-semibold"
            >
              Ke Halaman Utama
            </Link>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 1: OVERVIEW & ANALYTICS                                    */}
        {/* ============================================================== */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Top 4 KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Users */}
              <div className="relative p-5 rounded-3xl bg-amber-50/90 border border-amber-200/90 shadow-xs hover:shadow-md transition-all -rotate-0.5 hover:rotate-0">
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-16 h-4 bg-amber-200/90 border-y border-dashed border-amber-400/60 rounded-2xs pointer-events-none" />
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                    Total Pengguna
                  </span>
                  <div className="w-8 h-8 rounded-2xl bg-amber-200/80 flex items-center justify-center text-amber-900 shadow-2xs">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-3xl font-extrabold text-stone-900 tracking-tight">
                    {isLoading ? '...' : stats?.totalUsers || 0}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-700 font-medium">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                  <span>+{stats?.newUsersThisWeek || 0} pengguna baru minggu ini</span>
                </div>
              </div>

              {/* Card 2: Boards & Notes */}
              <div className="relative p-5 rounded-3xl bg-orange-50/90 border border-orange-200/90 shadow-xs hover:shadow-md transition-all rotate-0.5 hover:rotate-0">
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-16 h-4 bg-orange-200/90 border-y border-dashed border-orange-400/60 rounded-2xs pointer-events-none" />
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-orange-800 uppercase tracking-wider">
                    Papan & Catatan
                  </span>
                  <div className="w-8 h-8 rounded-2xl bg-orange-200/80 flex items-center justify-center text-orange-900 shadow-2xs">
                    <LayoutGrid className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-stone-900 tracking-tight">
                    {isLoading ? '...' : stats?.totalBoards || 0}
                  </span>
                  <span className="text-xs font-bold text-orange-700">Papan</span>
                  <span className="text-stone-300">•</span>
                  <span className="text-xl font-bold text-stone-800">
                    {isLoading ? '...' : stats?.totalNotes || 0}
                  </span>
                  <span className="text-xs font-bold text-orange-700">Catatan</span>
                </div>
                <div className="mt-2 flex items-center gap-1.5 text-xs text-orange-700 font-medium">
                  <StickyNote className="w-3.5 h-3.5 text-orange-600" />
                  <span>Sticky notes aktif di papan buletin</span>
                </div>
              </div>

              {/* Card 3: Tasks Productivity */}
              <div className="relative p-5 rounded-3xl bg-emerald-50/90 border border-emerald-200/90 shadow-xs hover:shadow-md transition-all -rotate-0.5 hover:rotate-0">
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-16 h-4 bg-emerald-200/90 border-y border-dashed border-emerald-400/60 rounded-2xs pointer-events-none" />
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                    Total Tugas
                  </span>
                  <div className="w-8 h-8 rounded-2xl bg-emerald-200/80 flex items-center justify-center text-emerald-900 shadow-2xs">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-stone-900 tracking-tight">
                    {isLoading ? '...' : stats?.totalTasks || 0}
                  </span>
                  <span className="text-xs font-semibold text-emerald-700">
                    ({completionRate}% Selesai)
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-2 text-[11px] font-semibold text-stone-600">
                  <span className="text-emerald-700 font-bold">✅ {stats?.tasksDone || 0}</span>
                  <span>•</span>
                  <span className="text-sky-700 font-bold">⚡ {stats?.tasksInProgress || 0}</span>
                  <span>•</span>
                  <span className="text-amber-700 font-bold">📋 {stats?.tasksTodo || 0}</span>
                </div>
              </div>

              {/* Card 4: Community & Showcase */}
              <div className="relative p-5 rounded-3xl bg-indigo-50/90 border border-indigo-200/90 shadow-xs hover:shadow-md transition-all rotate-0.5 hover:rotate-0">
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-16 h-4 bg-indigo-200/90 border-y border-dashed border-indigo-400/60 rounded-2xs pointer-events-none" />
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-800 uppercase tracking-wider">
                    Galeri & Komunitas
                  </span>
                  <div className="w-8 h-8 rounded-2xl bg-indigo-200/80 flex items-center justify-center text-indigo-900 shadow-2xs">
                    <Compass className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-stone-900 tracking-tight">
                    {isLoading ? '...' : stats?.totalShowcases || 0}
                  </span>
                  <span className="text-xs font-bold text-indigo-700">Showcase</span>
                  <span className="text-stone-300">•</span>
                  <span className="text-xl font-bold text-stone-800">
                    {isLoading ? '...' : stats?.totalLikes || 0}
                  </span>
                  <span className="text-xs font-bold text-indigo-700">Suka</span>
                </div>
                <div className="mt-2 flex items-center gap-1.5 text-xs text-indigo-700 font-medium">
                  <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                  <span>Karya pengguna di galeri publik</span>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Daily Signups Bar Chart (14 Days) */}
              <div className="lg:col-span-2 bg-white/95 rounded-3xl border border-amber-200/90 p-5 sm:p-6 shadow-xs relative">
                <div className="flex items-center justify-between pb-4 border-b border-stone-100">
                  <div>
                    <h3 className="text-sm font-extrabold text-stone-900 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-amber-600" />
                      <span>Tren Pertumbuhan Pengguna (14 Hari Terakhir)</span>
                    </h3>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Jumlah pendaftaran akun baru per hari
                    </p>
                  </div>
                  <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-xl">
                    +{stats?.newUsersThisWeek || 0} Minggu Ini
                  </span>
                </div>

                <div className="mt-6 pt-4">
                  {analytics && analytics.signupTrend.length > 0 ? (
                    <div className="flex items-end justify-between gap-1 sm:gap-2 h-44 px-2">
                      {analytics.signupTrend.map((item) => {
                        const heightPct = Math.max(8, Math.round((item.count / maxSignupDaily) * 100));
                        const shortDate = item.date.slice(5); // MM-DD
                        return (
                          <div key={item.date} className="flex-1 flex flex-col items-center gap-1.5 group">
                            <span className="text-[10px] font-bold text-stone-500 opacity-0 group-hover:opacity-100 transition-opacity">
                              {item.count}
                            </span>
                            <div className="w-full max-w-[28px] bg-amber-100 group-hover:bg-amber-400 rounded-t-xl transition-all relative flex items-end justify-center" style={{ height: `${heightPct}%` }}>
                              <div className="w-full bg-amber-500 rounded-t-xl transition-all" style={{ height: `${item.count > 0 ? '100%' : '4px'}` }} />
                            </div>
                            <span className="text-[10px] font-semibold text-stone-400 truncate max-w-[32px]">
                              {shortDate}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="h-44 flex items-center justify-center text-stone-400 text-xs">
                      Belum ada data tren pendaftaran
                    </div>
                  )}
                </div>
              </div>

              {/* Task Categories Breakdown */}
              <div className="bg-white/95 rounded-3xl border border-amber-200/90 p-5 sm:p-6 shadow-xs">
                <h3 className="text-sm font-extrabold text-stone-900 flex items-center gap-2 pb-3 border-b border-stone-100">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Kategori Tugas Terpopuler</span>
                </h3>

                <div className="mt-4 space-y-3">
                  {analytics && analytics.categories.length > 0 ? (
                    analytics.categories.slice(0, 5).map((cat, idx) => {
                      const totalCatTasks = stats?.totalTasks || 1;
                      const pct = Math.round((cat.count / totalCatTasks) * 100);
                      const colors = [
                        'bg-amber-500',
                        'bg-orange-500',
                        'bg-emerald-500',
                        'bg-sky-500',
                        'bg-indigo-500',
                      ];
                      return (
                        <div key={cat.category} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-stone-800">{cat.category}</span>
                            <span className="text-stone-500 font-semibold">{cat.count} tugas ({pct}%)</span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-stone-100 overflow-hidden">
                            <div
                              className={`h-full ${colors[idx % colors.length]} rounded-full transition-all`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-8 text-center text-stone-400 text-xs">
                      Belum ada kategori tugas
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: USER MANAGEMENT                                         */}
        {/* ============================================================== */}
        {activeTab === 'users' && (
          <section className="bg-white/95 rounded-3xl border border-amber-200/90 p-5 sm:p-7 shadow-xs relative animate-in fade-in duration-200">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-stone-100">
              <div>
                <h2 className="text-lg font-extrabold text-stone-900 flex items-center gap-2">
                  <span>Daftar Pengguna Ceria Todo</span>
                  <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
                    {filteredUsers.length} dari {users.length}
                  </span>
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  Pantau aset, kelola peran admin, tangguhkan akun, atau ekspor laporan
                </p>
              </div>

              {/* Action Buttons & Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleExportCSV}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs transition-all cursor-pointer active:scale-95"
                  title="Unduh laporan dalam format Excel / CSV"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Ekspor CSV</span>
                </button>

                {/* Search */}
                <div className="relative min-w-[200px]">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari nama atau email..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-2xl bg-stone-50 border border-stone-200 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Filter */}
                <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-2xl border border-stone-200/80 text-xs font-semibold">
                  <button
                    onClick={() => setSelectedFilter('all')}
                    className={`px-2 py-0.5 rounded-xl transition-all ${
                      selectedFilter === 'all' ? 'bg-white text-stone-900 shadow-2xs font-bold' : 'text-stone-600'
                    }`}
                  >
                    Semua
                  </button>
                  <button
                    onClick={() => setSelectedFilter('active')}
                    className={`px-2 py-0.5 rounded-xl transition-all ${
                      selectedFilter === 'active' ? 'bg-white text-stone-900 shadow-2xs font-bold' : 'text-stone-600'
                    }`}
                  >
                    Aktif
                  </button>
                  <button
                    onClick={() => setSelectedFilter('admin')}
                    className={`px-2 py-0.5 rounded-xl transition-all ${
                      selectedFilter === 'admin' ? 'bg-white text-amber-800 shadow-2xs font-bold' : 'text-stone-600'
                    }`}
                  >
                    Admin
                  </button>
                  <button
                    onClick={() => setSelectedFilter('suspended')}
                    className={`px-2 py-0.5 rounded-xl transition-all ${
                      selectedFilter === 'suspended' ? 'bg-white text-rose-800 shadow-2xs font-bold' : 'text-stone-600'
                    }`}
                  >
                    Ditangguhkan
                  </button>
                </div>

                {/* Sort */}
                <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-2xl border border-stone-200/80 text-xs font-semibold">
                  <span className="text-[10px] text-stone-400 pl-1.5 hidden sm:inline">Urut:</span>
                  <button
                    onClick={() => setSortBy('joined')}
                    className={`px-2 py-0.5 rounded-xl transition-all ${
                      sortBy === 'joined' ? 'bg-white text-stone-900 shadow-2xs font-bold' : 'text-stone-600'
                    }`}
                  >
                    Terbaru
                  </button>
                  <button
                    onClick={() => setSortBy('tasks')}
                    className={`px-2 py-0.5 rounded-xl transition-all ${
                      sortBy === 'tasks' ? 'bg-white text-stone-900 shadow-2xs font-bold' : 'text-stone-600'
                    }`}
                  >
                    Tugas
                  </button>
                  <button
                    onClick={() => setSortBy('notes')}
                    className={`px-2 py-0.5 rounded-xl transition-all ${
                      sortBy === 'notes' ? 'bg-white text-stone-900 shadow-2xs font-bold' : 'text-stone-600'
                    }`}
                  >
                    Catatan
                  </button>
                </div>
              </div>
            </div>

            {/* User List */}
            {isLoading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-stone-500">
                <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
                <p className="text-sm font-semibold">Memuat daftar pengguna...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="py-16 text-center text-stone-400">
                <Users className="w-12 h-12 mx-auto stroke-1 mb-2 text-stone-300" />
                <p className="text-sm font-bold text-stone-600">Tidak ada pengguna yang cocok</p>
              </div>
            ) : (
              <div className="mt-4 divide-y divide-stone-100">
                {filteredUsers.map((u) => {
                  const initial = u.name ? u.name.charAt(0).toUpperCase() : 'U';
                  const isSelf = session?.user?.email === u.email;

                  return (
                    <div
                      key={u.id}
                      className="py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 hover:bg-amber-50/40 rounded-2xl px-2.5 transition-colors"
                    >
                      {/* User Profile Info */}
                      <div className="flex items-center gap-3 min-w-0">
                        {u.image ? (
                          <Image
                            src={u.image}
                            alt={u.name}
                            width={44}
                            height={44}
                            unoptimized
                            className="w-11 h-11 rounded-2xl border border-stone-200 shadow-2xs object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-2xl bg-amber-200 text-amber-900 font-extrabold text-base flex items-center justify-center shadow-2xs shrink-0">
                            {initial}
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-extrabold text-stone-900 truncate">{u.name}</h4>
                            {u.isAdmin && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-white shadow-2xs">
                                <Shield className="w-2.5 h-2.5" />
                                Admin
                              </span>
                            )}
                            {u.isSuspended && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500 text-white shadow-2xs">
                                Ditangguhkan
                              </span>
                            )}
                            {isSelf && (
                              <span className="text-[10px] text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded-md font-bold">
                                (Anda)
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-stone-500 mt-0.5 flex-wrap">
                            <span className="truncate">{u.email}</span>
                            <span>•</span>
                            <span className="text-stone-400 text-[11px]">
                              Gabung: {formatDate(u.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Content Badges & Quick Actions */}
                      <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap pl-14 lg:pl-0">
                        {/* Board & Task Pills */}
                        <div className="px-2.5 py-1 rounded-xl bg-orange-50 border border-orange-200/80 text-orange-800 text-xs font-bold flex items-center gap-1.5">
                          <LayoutGrid className="w-3.5 h-3.5 text-orange-600" />
                          <span>{u.counts.boards} Papan</span>
                        </div>

                        <div className="px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-800 text-xs font-bold flex items-center gap-1.5">
                          <StickyNote className="w-3.5 h-3.5 text-amber-600" />
                          <span>{u.counts.notes} Catatan</span>
                        </div>

                        <div className="px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{u.counts.tasks} Tugas ({u.counts.tasksDone}✓)</span>
                        </div>

                        {/* Admin Action Buttons */}
                        <button
                          onClick={() => setSelectedUser(u)}
                          className="px-2.5 py-1 rounded-xl bg-stone-100 hover:bg-amber-100 text-stone-700 text-xs font-bold border border-stone-200/80 transition-all cursor-pointer"
                        >
                          Detail
                        </button>

                        {!isSelf && (
                          <>
                            <button
                              onClick={() => handleToggleAdminRole(u)}
                              className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                                u.isAdmin
                                  ? 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200'
                                  : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                              }`}
                              title={u.isAdmin ? 'Cabut hak akses Admin' : 'Jadikan Admin'}
                            >
                              {u.isAdmin ? 'Cabut Admin' : '+ Admin'}
                            </button>

                            <button
                              onClick={() => handleToggleSuspend(u)}
                              className={`p-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                                u.isSuspended
                                  ? 'bg-rose-100 text-rose-800 border-rose-300 hover:bg-rose-200'
                                  : 'bg-stone-50 text-stone-500 border-stone-200 hover:text-rose-600 hover:bg-rose-50'
                              }`}
                              title={u.isSuspended ? 'Aktifkan Akun' : 'Tangguhkan Akun'}
                            >
                              {u.isSuspended ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ============================================================== */}
        {/* TAB 3: GALLERY SHOWCASE MODERATION                             */}
        {/* ============================================================== */}
        {activeTab === 'moderation' && (
          <section className="bg-white/95 rounded-3xl border border-amber-200/90 p-5 sm:p-7 shadow-xs animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-stone-100">
              <div>
                <h2 className="text-lg font-extrabold text-stone-900 flex items-center gap-2">
                  <span>Moderasi Galeri Publik</span>
                  <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
                    {showcases.length} Showcase
                  </span>
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  Sematkan lencana &quot;Pilihan Editor 🌟&quot; atau hapus papan karya yang tidak sesuai aturan
                </p>
              </div>

              <Link
                href="/gallery"
                target="_blank"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold border border-amber-300 transition-all self-start sm:self-auto"
              >
                <span>Buka Galeri Komunitas</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>

            {showcases.length === 0 ? (
              <div className="py-16 text-center text-stone-400">
                <Compass className="w-12 h-12 mx-auto stroke-1 mb-2 text-stone-300" />
                <p className="text-sm font-bold text-stone-600">Belum ada showcase yang dipublikasikan</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-5">
                {showcases.map((sc) => (
                  <div
                    key={sc.id}
                    className={`rounded-3xl border p-4 transition-all flex flex-col justify-between ${
                      sc.isFeatured
                        ? 'bg-amber-50/90 border-amber-300 shadow-md ring-2 ring-amber-400/50'
                        : 'bg-stone-50/80 border-stone-200 shadow-xs hover:shadow-md'
                    }`}
                  >
                    <div>
                      {/* Thumbnail Preview */}
                      <div className="relative aspect-video rounded-2xl overflow-hidden bg-stone-200 border border-stone-300/80 mb-3">
                        {sc.thumbnail ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={sc.thumbnail}
                            alt={sc.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-stone-400 font-bold">
                            Tidak ada pratinjau
                          </div>
                        )}

                        {sc.isFeatured && (
                          <span className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-400 text-stone-900 shadow-md flex items-center gap-1 border border-amber-300">
                            🌟 Pilihan Editor
                          </span>
                        )}

                        <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/60 text-white backdrop-blur-xs">
                          {sc.category}
                        </span>
                      </div>

                      {/* Title & Author */}
                      <h4 className="font-extrabold text-sm text-stone-900 line-clamp-1">{sc.title}</h4>
                      <p className="text-xs text-stone-500 line-clamp-2 mt-1">
                        {sc.description || 'Tidak ada deskripsi.'}
                      </p>

                      <div className="flex items-center gap-2 text-xs text-stone-500 mt-2.5 pt-2.5 border-t border-stone-200/80">
                        <span className="font-semibold text-stone-700">{sc.user.name || 'Pengguna'}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-rose-600 font-bold">
                          <Heart className="w-3 h-3 fill-rose-500" />
                          {sc.likesCount}
                        </span>
                        <span>•</span>
                        <span>{sc.clonesCount}x dipakai</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-stone-200/80">
                      <button
                        onClick={() => handleToggleFeaturedShowcase(sc)}
                        className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          sc.isFeatured
                            ? 'bg-amber-400 text-stone-900 hover:bg-amber-300'
                            : 'bg-white hover:bg-amber-100 text-stone-700 border border-stone-200'
                        }`}
                      >
                        <Star className={`w-3.5 h-3.5 ${sc.isFeatured ? 'fill-stone-900' : ''}`} />
                        <span>{sc.isFeatured ? 'Batal Pilihan' : 'Pilihan Editor'}</span>
                      </button>

                      <button
                        onClick={() => handleDeleteShowcase(sc)}
                        className="p-1.5 rounded-xl bg-white hover:bg-rose-50 text-stone-400 hover:text-rose-600 border border-stone-200 transition-colors cursor-pointer"
                        title="Hapus showcase"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ============================================================== */}
        {/* TAB 4: SYSTEM BROADCAST ANNOUNCEMENT                           */}
        {/* ============================================================== */}
        {activeTab === 'announcement' && (
          <section className="bg-white/95 rounded-3xl border border-amber-200/90 p-5 sm:p-7 shadow-xs animate-in fade-in duration-200">
            <div className="pb-5 border-b border-stone-100">
              <h2 className="text-lg font-extrabold text-stone-900 flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-amber-600" />
                <span>Pengumuman / Siaran Global Sistem</span>
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Pesan ini akan otomatis tampil di atas papan seluruh pengguna Ceria Todo
              </p>
            </div>

            {/* Live Preview Box */}
            <div className="mt-6">
              <span className="text-xs font-extrabold text-stone-700 uppercase tracking-wider block mb-2">
                Pratinjau Langsung (Live Preview):
              </span>
              <div
                className={`p-3 rounded-2xl border flex items-center justify-between gap-3 text-xs font-semibold shadow-xs ${
                  announcementType === 'celebration'
                    ? 'bg-amber-100 border-amber-300 text-amber-900'
                    : announcementType === 'warning'
                    ? 'bg-orange-100 border-orange-300 text-orange-950'
                    : 'bg-amber-50 border-amber-200 text-stone-800'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-500 text-white shrink-0">
                    {announcementType === 'celebration'
                      ? 'Kabar Gembira'
                      : announcementType === 'warning'
                      ? 'Penting'
                      : 'Pengumuman'}
                  </span>
                  <span className="truncate">
                    {announcementMsg.trim() || 'Tulis pesan pengumuman Anda di bawah...'}
                  </span>
                  {announcementLink && (
                    <span className="underline font-bold text-amber-700 shrink-0 ml-1">Pelajari ↗</span>
                  )}
                </div>
                <X className="w-3.5 h-3.5 text-stone-400 shrink-0" />
              </div>
            </div>

            {/* Announcement Form */}
            <form onSubmit={handleSaveAnnouncement} className="mt-6 space-y-4 max-w-2xl">
              <div>
                <label className="text-xs font-extrabold text-stone-800 block mb-1">
                  Isi Pesan Pengumuman:
                </label>
                <textarea
                  value={announcementMsg}
                  onChange={(e) => setAnnouncementMsg(e.target.value)}
                  placeholder="Contoh: Fitur Galeri Template Papan kini telah hadir! Cobalah sekarang 🎉"
                  rows={3}
                  className="w-full p-3 rounded-2xl bg-stone-50 border border-stone-200 text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-extrabold text-stone-800 block mb-1">
                    Gaya / Tipe Pengumuman:
                  </label>
                  <select
                    value={announcementType}
                    onChange={(e) => setAnnouncementType(e.target.value as 'info' | 'celebration' | 'warning')}
                    className="w-full p-2.5 rounded-2xl bg-stone-50 border border-stone-200 text-xs text-stone-800 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                  >
                    <option value="info">ℹ️ Informasi Standar (Kuning Hangat)</option>
                    <option value="celebration">🎉 Kabar Gembira / Fitur Baru</option>
                    <option value="warning">⚠️ Pengumuman Penting / Maintenance</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-extrabold text-stone-800 block mb-1">
                    Tautan Tambahan (Opsional):
                  </label>
                  <input
                    type="text"
                    value={announcementLink}
                    onChange={(e) => setAnnouncementLink(e.target.value)}
                    placeholder="Contoh: /gallery atau https://..."
                    className="w-full p-2.5 rounded-2xl bg-stone-50 border border-stone-200 text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                  />
                </div>
              </div>

              {/* Toggle Active */}
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="announcementActive"
                  checked={announcementActive}
                  onChange={(e) => setAnnouncementActive(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 cursor-pointer"
                />
                <label htmlFor="announcementActive" className="text-xs font-bold text-stone-800 cursor-pointer">
                  Aktifkan siaran ini sekarang (akan langsung terlihat oleh pengguna)
                </label>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSavingAnnouncement || !announcementMsg.trim()}
                  className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-xs font-extrabold shadow-md transition-all cursor-pointer active:scale-95"
                >
                  {isSavingAnnouncement ? 'Menyimpan...' : 'Simpan & Publikasikan Pengumuman'}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* ============================================================== */}
        {/* TAB 5: SYSTEM & DATABASE HEALTH                                */}
        {/* ============================================================== */}
        {activeTab === 'health' && (
          <section className="bg-white/95 rounded-3xl border border-amber-200/90 p-5 sm:p-7 shadow-xs animate-in fade-in duration-200">
            <div className="pb-5 border-b border-stone-100">
              <h2 className="text-lg font-extrabold text-stone-900 flex items-center gap-2">
                <Database className="w-5 h-5 text-amber-600" />
                <span>Kesehatan Sistem & Penyimpanan Database</span>
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Status koneksi database MySQL, kecepatan latensi, dan statistik tabel
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80">
                <span className="text-xs font-bold text-emerald-800 uppercase block">Status Database</span>
                <span className="text-2xl font-black text-emerald-950 mt-1 block">🟢 Aktif & Sehat</span>
                <span className="text-[11px] text-emerald-700 font-semibold mt-1 block">
                  Koneksi MySQL tersinkronisasi
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200/80">
                <span className="text-xs font-bold text-sky-800 uppercase block">Latensi Query</span>
                <span className="text-2xl font-black text-sky-950 mt-1 block">
                  {systemHealth?.dbLatencyMs || 0} ms
                </span>
                <span className="text-[11px] text-sky-700 font-semibold mt-1 block">
                  Kecepatan respon kueri database
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80">
                <span className="text-xs font-bold text-amber-800 uppercase block">Total Rekaman Data</span>
                <span className="text-2xl font-black text-amber-950 mt-1 block">
                  {systemHealth
                    ? Object.values(systemHealth.tablesCount).reduce((a, b) => a + b, 0)
                    : 0}{' '}
                  Baris
                </span>
                <span className="text-[11px] text-amber-700 font-semibold mt-1 block">
                  Akumulasi data pada semua tabel
                </span>
              </div>
            </div>

            {/* Table Record Breakdown */}
            <div className="mt-6">
              <h3 className="text-xs font-extrabold text-stone-800 uppercase tracking-wider mb-3">
                Rincian Rekaman per Tabel Database:
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 text-center">
                  <span className="text-lg font-black text-stone-900 block">{systemHealth?.tablesCount.users || 0}</span>
                  <span className="text-[11px] font-bold text-stone-500">Users</span>
                </div>
                <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 text-center">
                  <span className="text-lg font-black text-stone-900 block">{systemHealth?.tablesCount.boards || 0}</span>
                  <span className="text-[11px] font-bold text-stone-500">Boards</span>
                </div>
                <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 text-center">
                  <span className="text-lg font-black text-stone-900 block">{systemHealth?.tablesCount.notes || 0}</span>
                  <span className="text-[11px] font-bold text-stone-500">Notes</span>
                </div>
                <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 text-center">
                  <span className="text-lg font-black text-stone-900 block">{systemHealth?.tablesCount.tasks || 0}</span>
                  <span className="text-[11px] font-bold text-stone-500">Tasks</span>
                </div>
                <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 text-center">
                  <span className="text-lg font-black text-stone-900 block">{systemHealth?.tablesCount.showcases || 0}</span>
                  <span className="text-[11px] font-bold text-stone-500">Showcases</span>
                </div>
                <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 text-center">
                  <span className="text-lg font-black text-stone-900 block">{systemHealth?.tablesCount.likes || 0}</span>
                  <span className="text-[11px] font-bold text-stone-500">Likes</span>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* User Detail Inspect Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg bg-[#fbf9f5] border-2 border-amber-300 rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-24 h-5 bg-amber-200/90 border-y border-dashed border-amber-400/80 rounded-2xs pointer-events-none" />

            <button
              onClick={() => setSelectedUser(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-white hover:bg-stone-100 border border-stone-200 text-stone-500 hover:text-stone-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* User Header */}
            <div className="flex items-center gap-3.5 pb-4 border-b border-stone-200">
              {selectedUser.image ? (
                <Image
                  src={selectedUser.image}
                  alt={selectedUser.name}
                  width={56}
                  height={56}
                  unoptimized
                  className="w-14 h-14 rounded-2xl border-2 border-amber-200 shadow-xs object-cover shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-amber-200 text-amber-900 font-black text-xl flex items-center justify-center shadow-xs shrink-0">
                  {selectedUser.name.charAt(0).toUpperCase()}
                </div>
              )}

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-stone-900">{selectedUser.name}</h3>
                  {selectedUser.isAdmin && (
                    <span className="text-[10px] font-extrabold bg-amber-500 text-white px-2 py-0.5 rounded-full">
                      Admin
                    </span>
                  )}
                  {selectedUser.isSuspended && (
                    <span className="text-[10px] font-extrabold bg-rose-500 text-white px-2 py-0.5 rounded-full">
                      Ditangguhkan
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-500 flex items-center gap-1.5 mt-0.5">
                  <Mail className="w-3.5 h-3.5 text-stone-400" />
                  {selectedUser.email}
                </p>
                <p className="text-[11px] text-stone-400 mt-0.5">
                  ID: <span className="font-mono text-stone-500">{selectedUser.id}</span>
                </p>
              </div>
            </div>

            {/* Date Details */}
            <div className="grid grid-cols-2 gap-3 my-4 p-3 rounded-2xl bg-white border border-stone-200/80 text-xs">
              <div>
                <span className="text-stone-400 text-[11px] block">Terdaftar Sejak</span>
                <span className="font-bold text-stone-800">{formatDateTime(selectedUser.createdAt)}</span>
              </div>
              <div>
                <span className="text-stone-400 text-[11px] block">Aktivitas Terakhir</span>
                <span className="font-bold text-stone-800">{formatDateTime(selectedUser.updatedAt)}</span>
              </div>
            </div>

            {/* Content Statistics Cards */}
            <div className="space-y-3">
              <h4 className="text-xs font-extrabold text-stone-800 uppercase tracking-wider">
                Ringkasan Aset & Konten
              </h4>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-3 rounded-2xl bg-orange-50 border border-orange-200/70">
                  <span className="text-xl font-black text-orange-900">{selectedUser.counts.boards}</span>
                  <span className="block text-[11px] font-bold text-orange-700 mt-0.5">Papan</span>
                </div>
                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200/70">
                  <span className="text-xl font-black text-amber-900">{selectedUser.counts.notes}</span>
                  <span className="block text-[11px] font-bold text-amber-700 mt-0.5">Catatan</span>
                </div>
                <div className="p-3 rounded-2xl bg-indigo-50 border border-indigo-200/70">
                  <span className="text-xl font-black text-indigo-900">{selectedUser.counts.showcases}</span>
                  <span className="block text-[11px] font-bold text-indigo-700 mt-0.5">Showcase</span>
                </div>
              </div>

              {/* Task Breakdown */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/70">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-900 mb-2">
                  <span>Total Tugas: {selectedUser.counts.tasks}</span>
                  <span>
                    {selectedUser.counts.tasks > 0
                      ? `${Math.round(
                          (selectedUser.counts.tasksDone / selectedUser.counts.tasks) * 100
                        )}% Tuntas`
                      : 'Belum ada tugas'}
                  </span>
                </div>

                <div className="w-full h-3 rounded-full bg-stone-200 overflow-hidden flex">
                  <div
                    style={{
                      width: `${
                        selectedUser.counts.tasks > 0
                          ? (selectedUser.counts.tasksDone / selectedUser.counts.tasks) * 100
                          : 0
                      }%`,
                    }}
                    className="bg-emerald-500 h-full"
                    title="Selesai"
                  />
                  <div
                    style={{
                      width: `${
                        selectedUser.counts.tasks > 0
                          ? (selectedUser.counts.tasksInProgress / selectedUser.counts.tasks) * 100
                          : 0
                      }%`,
                    }}
                    className="bg-sky-400 h-full"
                    title="Sedang Dikerjakan"
                  />
                  <div
                    style={{
                      width: `${
                        selectedUser.counts.tasks > 0
                          ? (selectedUser.counts.tasksTodo / selectedUser.counts.tasks) * 100
                          : 0
                      }%`,
                    }}
                    className="bg-amber-400 h-full"
                    title="Todo"
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-stone-600 mt-2 font-semibold">
                  <span className="text-emerald-700">✓ {selectedUser.counts.tasksDone} Selesai</span>
                  <span className="text-sky-700">⚡ {selectedUser.counts.tasksInProgress} Proses</span>
                  <span className="text-amber-700">📋 {selectedUser.counts.tasksTodo} Todo</span>
                </div>
              </div>
            </div>

            <div className="mt-5 text-center">
              <button
                onClick={() => setSelectedUser(null)}
                className="w-full py-2.5 rounded-2xl bg-stone-800 hover:bg-stone-900 text-white text-xs font-bold shadow-md transition-all cursor-pointer active:scale-98"
              >
                Tutup Jendela
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
