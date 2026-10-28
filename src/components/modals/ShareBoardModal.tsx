'use client';

import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Users, RefreshCw, UserMinus, LogOut, ShieldCheck, User } from 'lucide-react';
import { Board, BoardMemberInfo } from '@/types/board';
import { ThemeConfig } from '@/types/preferences';

interface ShareBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  board: Board | null;
  themeConfig: ThemeConfig;
  onBoardUpdated?: () => void;
  onBoardLeft?: () => void;
}

export const ShareBoardModal: React.FC<ShareBoardModalProps> = ({
  isOpen,
  onClose,
  board,
  themeConfig,
  onBoardUpdated,
  onBoardLeft,
}) => {
  const [loading, setLoading] = useState(false);
  const [inviteCode, setInviteCode] = useState<string>('');
  const [isOwner, setIsOwner] = useState<boolean>(true);
  const [ownerInfo, setOwnerInfo] = useState<{ name: string | null; email: string | null; image: string | null } | null>(null);
  const [members, setMembers] = useState<BoardMemberInfo[]>([]);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchShareInfo = React.useCallback(async (boardId: string) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/boards/${boardId}/share`);
      const data = await res.json();
      if (data.success) {
        setInviteCode(data.data.inviteCode);
        setIsOwner(data.data.isOwner);
        setOwnerInfo(data.data.owner);
        setMembers(data.data.members || []);
      } else {
        setErrorMsg(data.error || 'Gagal memuat data kolaborator');
      }
    } catch (err) {
      console.error('Error fetching share info:', err);
      setErrorMsg('Terjadi kesalahan jaringan');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen || !board?.id) return;

    const timer = setTimeout(() => {
      setCopiedLink(false);
      setCopiedCode(false);
      setErrorMsg(null);
      fetchShareInfo(board.id);
    }, 0);

    return () => clearTimeout(timer);
  }, [isOpen, board?.id, fetchShareInfo]);

  if (!isOpen || !board) return null;

  const getShareLink = () => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/?join=${inviteCode}`;
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(getShareLink());
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      setErrorMsg('Gagal menyalin link');
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      setErrorMsg('Gagal menyalin kode');
    }
  };

  const handleRegenerateCode = async () => {
    if (!confirm('Apakah Anda yakin ingin membuat ulang kode undangan? Kode lama tidak akan berlaku lagi.')) {
      return;
    }
    setRegenerating(true);
    try {
      const res = await fetch(`/api/boards/${board.id}/share`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setInviteCode(data.data.inviteCode);
      } else {
        alert(data.error || 'Gagal membuat ulang kode');
      }
    } catch (err) {
      console.error(err);
      alert('Gagal membuat ulang kode');
    } finally {
      setRegenerating(false);
    }
  };

  const handleKickMember = async (member: BoardMemberInfo) => {
    const memberName = member.user?.name || member.user?.email || 'anggota ini';
    if (!confirm(`Keluarkan ${memberName} dari papan ini?`)) return;

    setActionLoadingId(member.id);
    try {
      const res = await fetch(`/api/boards/${board.id}/members/${member.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setMembers((prev) => prev.filter((m) => m.id !== member.id));
        if (onBoardUpdated) onBoardUpdated();
      } else {
        alert(data.error || 'Gagal mengeluarkan anggota');
      }
    } catch (err) {
      console.error(err);
      alert('Gagal mengeluarkan anggota');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleLeaveBoard = async () => {
    if (!confirm(`Apakah Anda yakin ingin keluar dari papan "${board.title}"?`)) return;

    setActionLoadingId('leave');
    try {
      const res = await fetch(`/api/boards/${board.id}/leave`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        onClose();
        if (onBoardLeft) onBoardLeft();
      } else {
        alert(data.error || 'Gagal keluar dari papan');
      }
    } catch (err) {
      console.error(err);
      alert('Gagal keluar dari papan');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className={`w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden p-6 transition-all duration-200 ${
          themeConfig.isDark
            ? 'bg-slate-900 border-slate-800 text-white'
            : 'bg-white border-amber-100 text-slate-800'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl p-2 rounded-2xl bg-amber-500/10 dark:bg-amber-400/10">
              {board.icon}
            </span>
            <div>
              <h3 className="text-base sm:text-lg font-black flex items-center gap-2">
                <span>Bagikan Papan</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400">
                  {board.type === 'TASK' ? 'Tugas' : 'Catatan'}
                </span>
              </h3>
              <p className="text-xs text-slate-400 truncate max-w-[260px] sm:max-w-sm">
                {board.title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-5 pt-4">
          {errorMsg && (
            <div className="p-3 text-xs rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20 font-medium">
              {errorMsg}
            </div>
          )}

          {/* Share Section (Invite Code & Link) */}
          <div
            className={`p-4 rounded-2xl border ${
              themeConfig.isDark
                ? 'bg-slate-800/60 border-slate-700/60'
                : 'bg-amber-50/70 border-amber-200/70'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                <span>Kode Undangan Papan</span>
              </span>
              {isOwner && (
                <button
                  type="button"
                  onClick={handleRegenerateCode}
                  disabled={regenerating || loading}
                  className="text-[11px] font-bold text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                  title="Buat kode baru"
                >
                  <RefreshCw className={`w-3 h-3 ${regenerating ? 'animate-spin' : ''}`} />
                  <span>Kode Baru</span>
                </button>
              )}
            </div>

            {loading ? (
              <div className="py-4 text-center text-xs text-slate-400 animate-pulse">
                Memuat kode undangan...
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className={`flex-1 flex items-center justify-between px-3.5 py-2.5 rounded-xl border font-mono font-black text-sm sm:text-base tracking-widest ${
                      themeConfig.isDark
                        ? 'bg-slate-900 border-slate-700 text-amber-300'
                        : 'bg-white border-amber-300/80 text-amber-900 shadow-inner'
                    }`}
                  >
                    <span>{inviteCode || '...'}</span>
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="text-xs font-sans font-bold flex items-center gap-1 text-amber-600 hover:text-amber-700 cursor-pointer active:scale-95"
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedCode ? 'Tersalin' : 'Salin Kode'}</span>
                    </button>
                  </div>
                </div>

                {/* Copy Link Button */}
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-black bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-md active:scale-98 transition-all cursor-pointer"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedLink ? 'Tautan Undangan Berhasil Disalin! ✨' : 'Salin Tautan Undangan Langsung'}</span>
                </button>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center mt-1.5">
                  Kirim link atau kode ini ke teman. Mereka cukup mengkliknya untuk mulai berkolaborasi!
                </p>
              </div>
            )}
          </div>

          {/* Members List */}
          <div>
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Anggota Kolaborasi ({1 + members.length})
              </span>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {/* Owner Item */}
              <div
                className={`flex items-center justify-between p-2.5 rounded-xl border text-xs ${
                  themeConfig.isDark
                    ? 'bg-slate-800/40 border-slate-800'
                    : 'bg-slate-50 border-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-600 flex items-center justify-center font-bold text-xs shrink-0">
                    {ownerInfo?.name ? ownerInfo.name[0].toUpperCase() : <User className="w-3.5 h-3.5" />}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold truncate text-slate-700 dark:text-slate-200">
                      {ownerInfo?.name || 'Pemilik Papan'}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">
                      {ownerInfo?.email || ''}
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 shrink-0">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Pemilik</span>
                </span>
              </div>

              {/* Collaborator Items */}
              {members.map((member) => (
                <div
                  key={member.id}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-xs ${
                    themeConfig.isDark
                      ? 'bg-slate-800/40 border-slate-800'
                      : 'bg-slate-50 border-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-blue-500/20 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
                      {member.user?.name ? member.user.name[0].toUpperCase() : <User className="w-3.5 h-3.5" />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold truncate text-slate-700 dark:text-slate-200">
                        {member.user?.name || member.user?.email || 'Kolaborator'}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">
                        {member.user?.email || ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400">
                      Anggota
                    </span>
                    {isOwner && (
                      <button
                        type="button"
                        onClick={() => handleKickMember(member)}
                        disabled={actionLoadingId === member.id}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                        title="Keluarkan anggota"
                      >
                        <UserMinus className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {members.length === 0 && (
                <div className="text-center py-3 text-xs text-slate-400">
                  Belum ada anggota lain yang bergabung ke papan ini.
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions (Leave Board if Member) */}
          {!isOwner && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={handleLeaveBoard}
                disabled={actionLoadingId === 'leave'}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer disabled:opacity-50"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Keluar dari Papan Ini</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
