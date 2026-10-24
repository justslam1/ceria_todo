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

export default function AdminDashboardPage() {
  const { status } = useSession();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'active' | 'admin'>('all');
  const [sortBy, setSortBy] = useState<'joined' | 'tasks' | 'notes'>('joined');
  const [selectedUser, setSelectedUser] = useState<AdminUserItem | null>(null);

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

  // Filtered and sorted users
  const filteredUsers = useMemo(() => {
    let result = [...users];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.id.toLowerCase().includes(q)
      );
    }

    // Role / activity filter
    if (selectedFilter === 'admin') {
      result = result.filter((u) => u.isAdmin);
    } else if (selectedFilter === 'active') {
      result = result.filter((u) => u.counts.tasks > 0 || u.counts.notes > 0 || u.counts.boards > 0);
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'tasks') {
        return b.counts.tasks - a.counts.tasks;
      }
      if (sortBy === 'notes') {
        return b.counts.notes - a.counts.notes;
      }
      // default 'joined' -> newest first
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

  // Completion rate percentage
  const completionRate = useMemo(() => {
    if (!stats || stats.totalTasks === 0) return 0;
    return Math.round((stats.tasksDone / stats.totalTasks) * 100);
  }, [stats]);

  return (
    <div className="min-h-screen bg-[#faf8f5] text-stone-800 flex flex-col font-sans selection:bg-amber-200 selection:text-amber-900 pb-16">
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
                  Pantau pertumbuhan pengguna dan aktivitas catatan Ceria Todo
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

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-8 pt-6 sm:pt-8 flex-1 flex flex-col gap-6">
        {/* Error / Unauthorized Alert */}
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3 shadow-xs animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-bold">Akses Terbatas / Kesalahan Terjadi</h3>
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

        {/* Top 4 KPI Cards (Gaya Ceria Todo: Warm Sticky Cards with Tape) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
              <span>Sticky notes terpasang di papan</span>
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
              <span>Interaksi komunitas Ceria Todo</span>
            </div>
          </div>
        </section>

        {/* User Management Section */}
        <section className="bg-white/95 rounded-3xl border border-amber-200/90 p-5 sm:p-7 shadow-xs relative">
          {/* Decorative pin */}
          <div className="absolute -top-3 left-8 w-6 h-6 rounded-full bg-amber-400 border-2 border-white shadow-xs flex items-center justify-center text-[10px]">
            📌
          </div>

          {/* Section Header & Toolbar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-stone-100">
            <div>
              <h2 className="text-lg font-extrabold text-stone-900 flex items-center gap-2">
                <span>Daftar Pengguna Terdaftar</span>
                <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
                  {filteredUsers.length} dari {users.length}
                </span>
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Lihat nama, email, waktu bergabung, dan ringkasan aktivitas tiap pengguna
              </p>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Search input */}
              <div className="relative min-w-[220px]">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama atau email..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-2xl bg-stone-50 border border-stone-200 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all"
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

              {/* Status Filter */}
              <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-2xl border border-stone-200/80 text-xs font-semibold">
                <button
                  onClick={() => setSelectedFilter('all')}
                  className={`px-2.5 py-1 rounded-xl transition-all ${
                    selectedFilter === 'all'
                      ? 'bg-white text-stone-900 shadow-2xs font-bold'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Semua
                </button>
                <button
                  onClick={() => setSelectedFilter('active')}
                  className={`px-2.5 py-1 rounded-xl transition-all ${
                    selectedFilter === 'active'
                      ? 'bg-white text-stone-900 shadow-2xs font-bold'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Ada Aktivitas
                </button>
                <button
                  onClick={() => setSelectedFilter('admin')}
                  className={`px-2.5 py-1 rounded-xl transition-all ${
                    selectedFilter === 'admin'
                      ? 'bg-white text-amber-800 shadow-2xs font-bold'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Admin
                </button>
              </div>

              {/* Sort Selector */}
              <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-2xl border border-stone-200/80 text-xs font-semibold">
                <span className="text-[11px] text-stone-500 pl-2 pr-1 hidden sm:inline">Urut:</span>
                <button
                  onClick={() => setSortBy('joined')}
                  className={`px-2 py-1 rounded-xl transition-all ${
                    sortBy === 'joined'
                      ? 'bg-white text-stone-900 shadow-2xs font-bold'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Terbaru
                </button>
                <button
                  onClick={() => setSortBy('tasks')}
                  className={`px-2 py-1 rounded-xl transition-all ${
                    sortBy === 'tasks'
                      ? 'bg-white text-stone-900 shadow-2xs font-bold'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Tugas
                </button>
                <button
                  onClick={() => setSortBy('notes')}
                  className={`px-2 py-1 rounded-xl transition-all ${
                    sortBy === 'notes'
                      ? 'bg-white text-stone-900 shadow-2xs font-bold'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Catatan
                </button>
              </div>
            </div>
          </div>

          {/* User Table / List View */}
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-stone-500">
              <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
              <p className="text-sm font-semibold">Memuat data pengguna dari papan buletin...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-16 text-center text-stone-400">
              <Users className="w-12 h-12 mx-auto stroke-1 mb-2 text-stone-300" />
              <p className="text-sm font-bold text-stone-600">Tidak ada pengguna yang cocok</p>
              <p className="text-xs text-stone-400 mt-1">Coba sesuaikan kata kunci pencarian atau filter Anda</p>
            </div>
          ) : (
            <div className="mt-4 divide-y divide-stone-100">
              {filteredUsers.map((u) => {
                const initial = u.name ? u.name.charAt(0).toUpperCase() : 'U';
                const hasActivity = u.counts.tasks > 0 || u.counts.notes > 0 || u.counts.boards > 0;

                return (
                  <div
                    key={u.id}
                    className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-amber-50/40 rounded-2xl px-2.5 transition-colors"
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
                          {!hasActivity && (
                            <span className="text-[10px] text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded-md">
                              Belum ada item
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

                    {/* Content Count Badges & Action */}
                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap pl-14 md:pl-0">
                      {/* Boards */}
                      <div
                        className="px-2.5 py-1 rounded-xl bg-orange-50 border border-orange-200/80 text-orange-800 text-xs font-bold flex items-center gap-1.5"
                        title={`${u.counts.boards} Papan Proyek`}
                      >
                        <LayoutGrid className="w-3.5 h-3.5 text-orange-600" />
                        <span>{u.counts.boards}</span>
                        <span className="text-[10px] text-orange-600 font-semibold hidden sm:inline">Papan</span>
                      </div>

                      {/* Notes */}
                      <div
                        className="px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-800 text-xs font-bold flex items-center gap-1.5"
                        title={`${u.counts.notes} Sticky Notes`}
                      >
                        <StickyNote className="w-3.5 h-3.5 text-amber-600" />
                        <span>{u.counts.notes}</span>
                        <span className="text-[10px] text-amber-600 font-semibold hidden sm:inline">Catatan</span>
                      </div>

                      {/* Tasks with Progress */}
                      <div
                        className="px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-bold flex items-center gap-1.5"
                        title={`${u.counts.tasks} Tugas (${u.counts.tasksDone} Selesai)`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{u.counts.tasks}</span>
                        <span className="text-[10px] text-emerald-600 font-semibold hidden sm:inline">
                          ({u.counts.tasksDone} ✓)
                        </span>
                      </div>

                      {/* Showcases */}
                      {u.counts.showcases > 0 && (
                        <div
                          className="px-2.5 py-1 rounded-xl bg-indigo-50 border border-indigo-200/80 text-indigo-800 text-xs font-bold flex items-center gap-1.5"
                          title={`${u.counts.showcases} Showcase di Galeri`}
                        >
                          <Compass className="w-3.5 h-3.5 text-indigo-600" />
                          <span>{u.counts.showcases}</span>
                        </div>
                      )}

                      {/* Detail Modal Trigger */}
                      <button
                        onClick={() => setSelectedUser(u)}
                        className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-amber-100 text-stone-700 hover:text-amber-900 text-xs font-bold border border-stone-200/80 hover:border-amber-300 transition-all cursor-pointer ml-auto md:ml-0"
                      >
                        Detail
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* User Detail Inspect Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg bg-[#fbf9f5] border-2 border-amber-300 rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            {/* Top Tape accent */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-24 h-5 bg-amber-200/90 border-y border-dashed border-amber-400/80 rounded-2xs pointer-events-none" />

            {/* Close Button */}
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

                {/* Progress bar */}
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
