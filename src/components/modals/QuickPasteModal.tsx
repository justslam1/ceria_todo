import React, { useState } from 'react';
import { parseWhatsAppMessage } from '@/lib/whatsappParser';
import { ParsedTask, Priority, Task } from '@/types/task';
import { CustomCategory, getCategoryBadgeClasses } from '@/lib/userPreferences';
import {
  X,
  MessageSquareShare,
  Sparkles,
  Trash2,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface QuickPasteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTasksSaved: (createdTasks: Task[]) => void;
  customCategories?: CustomCategory[];
}

export const QuickPasteModal: React.FC<QuickPasteModalProps> = ({
  isOpen,
  onClose,
  onTasksSaved,
  customCategories,
}) => {
  const [rawText, setRawText] = useState('');
  const [parsedItems, setParsedItems] = useState<ParsedTask[]>([]);
  const [hasParsed, setHasParsed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Example templates for 1-click test
  const sampleChat1 = `[10.15, 05/10/2026] Budi: Tolong review pull request modul payment #Work !urgent est: 1h deadline: besok
[10.18, 05/10/2026] Budi: Jangan lupa beli kopi espresso di supermarket #Personal dl: hari ini
[10.25, 05/10/2026] Siti: Update copy text di banner promo Ramadhan #Marketing [Penting] ~45m deadline: lusa`;

  const sampleChat2 = `- [ ] Kirim invoice klien PT Maju Bersama #Finance !urgent deadline: besok est: 30m
- [ ] Buat dokumentasi arsitektur database MySQL #Tech dl: jumat ~2h
- [ ] Jadwalkan evaluasi sprint minggu depan #Work [Santai]`;

  const handleParse = () => {
    if (!rawText.trim()) {
      setErrorMsg('Silakan tempel (paste) teks WhatsApp terlebih dahulu!');
      return;
    }
    setErrorMsg(null);
    const results = parseWhatsAppMessage(rawText);
    if (results.length === 0) {
      setErrorMsg('Tidak dapat menemukan tugas dalam teks. Pastikan format teks memuat rencana kerja.');
      return;
    }
    setParsedItems(results);
    setHasParsed(true);
  };

  const handleUpdateItem = (index: number, updatedFields: Partial<ParsedTask>) => {
    setParsedItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...updatedFields };
      return copy;
    });
  };

  const handleRemoveItem = (index: number) => {
    setParsedItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveToDatabase = async () => {
    if (parsedItems.length === 0) {
      setErrorMsg('Tidak ada tugas untuk disimpan');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      const payload = parsedItems.map((item, idx) => ({
        title: item.title,
        description: item.description || null,
        status: 'TODO',
        priority: item.priority || 'MEDIUM',
        category: item.category || 'Personal',
        dueDate: item.dueDate || null,
        estimatedTime: item.estimatedTime || null,
        order: idx,
      }));

      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal menyimpan tugas ke server');
      }

      onTasksSaved(data.data);
      // Reset state and close
      setRawText('');
      setParsedItems([]);
      setHasParsed(false);
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'TimeoutError') {
        setErrorMsg('Waktu tunggu koneksi habis (timeout). Pastikan MySQL di XAMPP sedang aktif.');
      } else {
        setErrorMsg(err instanceof Error ? err.message : 'Terjadi kesalahan saat menyimpan tugas');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-amber-100 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-50/70 via-teal-50/40 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-200">
              <MessageSquareShare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                Quick Paste dari WhatsApp
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  AI & Regex Parser
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Otomatis mengekstrak judul, prioritas, kategori, deadline & estimasi waktu.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {!hasParsed ? (
            /* Input Step */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-700">
                  Tempel Pesan WhatsApp di Sini:
                </label>
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <span>Coba contoh:</span>
                  <button
                    onClick={() => setRawText(sampleChat1)}
                    className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors cursor-pointer"
                  >
                    Chat WA
                  </button>
                  <button
                    onClick={() => setRawText(sampleChat2)}
                    className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors cursor-pointer"
                  >
                    To-do List
                  </button>
                </div>
              </div>

              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Contoh:
[10.30] Budi: Tolong review modul payment #Work !urgent deadline: besok est: 1h
- [ ] Siapkan laporan mingguan #Finance ~30m
• Meeting dengan klien baru dl: 10/10/2026"
                rows={8}
                className="w-full p-4 rounded-2xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 text-sm font-mono leading-relaxed resize-none shadow-2xs"
              />

              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-800 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>Tips Format Pintar:</span>
                </div>
                <p className="leading-relaxed text-amber-900/90">
                  Gunakan tag seperti <code className="bg-amber-100/80 px-1 rounded">#Kantor</code>, prioritas <code className="bg-amber-100/80 px-1 rounded">!urgent</code> atau <code className="bg-amber-100/80 px-1 rounded">[Penting]</code>, batas waktu <code className="bg-amber-100/80 px-1 rounded">deadline: besok</code>, dan durasi <code className="bg-amber-100/80 px-1 rounded">est: 30m</code>.
                </p>
              </div>
            </div>
          ) : (
            /* Preview Step */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-slate-800 text-sm">
                    Pratinjau Hasil Ekstraksi ({parsedItems.length} tugas ditemukan)
                  </h4>
                  <p className="text-xs text-slate-500">
                    Anda dapat mengedit judul, kategori, atau prioritas sebelum menyimpan.
                  </p>
                </div>
                <button
                  onClick={() => setHasParsed(false)}
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold underline underline-offset-2 cursor-pointer"
                >
                  Ubah Teks Input
                </button>
              </div>

              <div className="space-y-3">
                {parsedItems.map((item, index) => (
                  <div
                    key={index}
                    className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/90 hover:border-slate-300 transition-all space-y-2.5"
                  >
                    <div className="flex items-start gap-2">
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) =>
                          handleUpdateItem(index, { title: e.target.value })
                        }
                        className="flex-1 font-semibold text-sm bg-white px-3 py-1.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-400 text-slate-800"
                        placeholder="Judul tugas..."
                      />
                      <button
                        onClick={() => handleRemoveItem(index)}
                        className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors"
                        title="Hapus baris ini"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Metadata editor row */}
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {/* Category */}
                      <div className="flex items-center gap-1">
                        <span className="text-slate-400 font-medium">Kat:</span>
                        <input
                          type="text"
                          value={item.category || 'Personal'}
                          onChange={(e) =>
                            handleUpdateItem(index, { category: e.target.value })
                          }
                          className={`font-semibold px-2 py-1 rounded-lg w-28 border focus:outline-hidden text-xs transition-colors ${getCategoryBadgeClasses(
                            item.category || 'Personal',
                            customCategories
                          )}`}
                        />
                      </div>

                      {/* Priority */}
                      <div className="flex items-center gap-1">
                        <span className="text-slate-400 font-medium">Prioritas:</span>
                        <select
                          value={item.priority}
                          onChange={(e) =>
                            handleUpdateItem(index, {
                              priority: e.target.value as Priority,
                            })
                          }
                          className="bg-white border border-slate-200 font-medium px-2 py-1 rounded-lg text-slate-700 focus:outline-hidden"
                        >
                          <option value="HIGH">Tinggi 🔥</option>
                          <option value="MEDIUM">Sedang ⚡</option>
                          <option value="LOW">Santai 🍃</option>
                        </select>
                      </div>

                      {/* Due Date & Time */}
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <input
                          type="datetime-local"
                          value={
                            item.dueDate
                              ? (() => {
                                  const d = new Date(item.dueDate);
                                  const pad = (n: number) => String(n).padStart(2, '0');
                                  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
                                })()
                              : ''
                          }
                          onChange={(e) =>
                            handleUpdateItem(index, {
                              dueDate: e.target.value ? new Date(e.target.value).toISOString() : undefined,
                            })
                          }
                          className="bg-white border border-slate-200 font-medium px-2 py-0.5 rounded-lg text-slate-700 text-xs focus:outline-hidden"
                        />
                      </div>

                      {/* Estimated time */}
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <input
                          type="text"
                          value={item.estimatedTime || ''}
                          placeholder="cth: 30m, 1h"
                          onChange={(e) =>
                            handleUpdateItem(index, {
                              estimatedTime: e.target.value || undefined,
                            })
                          }
                          className="bg-white border border-slate-200 font-medium px-2 py-1 rounded-lg text-slate-700 w-24 focus:outline-hidden"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-sm font-medium transition-colors cursor-pointer"
          >
            Batal
          </button>

          {!hasParsed ? (
            <button
              onClick={handleParse}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-2xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white text-sm font-semibold shadow-md shadow-emerald-200 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Ekstrak & Pratinjau</span>
            </button>
          ) : (
            <button
              onClick={handleSaveToDatabase}
              disabled={isSubmitting || parsedItems.length === 0}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 active:scale-95 text-white text-sm font-semibold shadow-md shadow-emerald-200 transition-all disabled:opacity-50 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? 'Menyimpan...'
                  : `Simpan ke "Rencana Brilian" (${parsedItems.length})`}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
