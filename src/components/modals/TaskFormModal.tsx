import React, { useState, useRef } from 'react';
import { Task, TaskStatus, Priority, CreateTaskInput, UpdateTaskInput } from '@/types/task';
import { X, Calendar, Clock, AlertCircle, CheckSquare, Plus, Trash2, Image as ImageIcon, Loader2, Users } from 'lucide-react';

import { CustomCategory, NoteColor } from '@/types/preferences';
import { getCategoryBadgeClasses, getCategoryDotHex, NOTE_COLOR_OPTIONS } from '@/lib/userPreferences';
import { CategoryBadge } from '@/components/ui/Badge';
import { Subtask, parseTaskDescription, stringifyTaskDescription } from '@/lib/subtasks';
import { compressImage, getImageFileFromClipboard } from '@/lib/imageCompression';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskToEdit?: Task | null;
  defaultStatus?: TaskStatus;
  customCategories?: CustomCategory[];
  assignees?: Array<{ id: string; name: string | null; email: string | null; image: string | null }>;
  onSave: (taskData: CreateTaskInput | UpdateTaskInput, id?: string) => Promise<void>;
}

const DEFAULT_CATEGORY_SUGGESTIONS = ['Personal', 'Kerja', 'Belajar', 'Kesehatan', 'Keluarga', 'Tech'];

export const TaskFormModal: React.FC<TaskFormModalProps> = ({
  isOpen,
  onClose,
  taskToEdit,
  defaultStatus = 'TODO',
  customCategories,
  assignees = [],
  onSave,
}) => {
  const { t } = useLanguage();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtaskInput, setNewSubtaskInput] = useState('');
  const [status, setStatus] = useState<TaskStatus>('TODO');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [assignedToId, setAssignedToId] = useState<string | null>(taskToEdit?.assignedToId || null);
  const [category, setCategory] = useState('Personal');
  const [noteColor, setNoteColor] = useState<NoteColor>('auto');
  const [dueDate, setDueDate] = useState('');
  const [estimatedTime, setEstimatedTime] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to convert date to YYYY-MM-DDTHH:mm for datetime-local input
  const toLocalISOString = (dateObj: Date) => {
    const pad = (num: number) => String(num).padStart(2, '0');
    const year = dateObj.getFullYear();
    const month = pad(dateObj.getMonth() + 1);
    const day = pad(dateObj.getDate());
    const hours = pad(dateObj.getHours());
    const minutes = pad(dateObj.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [prevTaskToEdit, setPrevTaskToEdit] = useState<Task | null | undefined>(taskToEdit);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

  // Sync form state during render when taskToEdit or modal open state changes
  if (taskToEdit !== prevTaskToEdit || isOpen !== prevIsOpen) {
    setPrevTaskToEdit(taskToEdit);
    setPrevIsOpen(isOpen);

    if (taskToEdit) {
      setTitle(taskToEdit.title);
      const parsed = parseTaskDescription(taskToEdit.description);
      setDescription(parsed.note);
      setSubtasks(parsed.subtasks);
      setNoteColor((parsed.colorTag as NoteColor) || 'auto');
      setStatus(taskToEdit.status);
      setPriority(taskToEdit.priority);
      setAssignedToId(taskToEdit.assignedToId || null);
      setCategory(taskToEdit.category || 'Personal');
      setDueDate(taskToEdit.dueDate ? toLocalISOString(new Date(taskToEdit.dueDate)) : '');
      setEstimatedTime(taskToEdit.estimatedTime || '');
      setImageUrl(taskToEdit.imageUrl || null);
    } else {
      setTitle('');
      setDescription('');
      setSubtasks([]);
      setNewSubtaskInput('');
      setNoteColor('auto');
      setStatus(defaultStatus);
      setPriority('MEDIUM');
      setAssignedToId(null);
      setCategory('Personal');
      setDueDate('');
      setEstimatedTime('');
      setImageUrl(null);
    }
    setErrorMsg(null);
  }

  const handleAddSubtask = () => {
    const trimmed = newSubtaskInput.trim();
    if (!trimmed) return;
    setSubtasks((prev) => [
      ...prev,
      { id: `sub-${Date.now()}`, title: trimmed, completed: false },
    ]);
    setNewSubtaskInput('');
  };

  const handleToggleSubtask = (index: number) => {
    setSubtasks((prev) =>
      prev.map((st, i) => (i === index ? { ...st, completed: !st.completed } : st))
    );
  };

  const handleRemoveSubtask = (index: number) => {
    setSubtasks((prev) => prev.filter((_, i) => i !== index));
  };

  if (!isOpen) return null;

  const handleProcessImage = async (file: File | Blob) => {
    try {
      setIsCompressing(true);
      const compressed = await compressImage(file);
      setImageUrl(compressed);
    } catch (err) {
      console.error('Gagal memproses gambar:', err);
      alert('Gagal memproses gambar. Pastikan format file berupa gambar yang valid.');
    } finally {
      setIsCompressing(false);
    }
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const imageFile = getImageFileFromClipboard(e);
    if (imageFile) {
      e.preventDefault();
      await handleProcessImage(imageFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg(t.taskModal.titleRequiredError);
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      const finalDescription = stringifyTaskDescription(description, subtasks, noteColor);

      const payload = {
        title: title.trim(),
        description: finalDescription || null,
        status,
        priority,
        assignedToId: assignedToId || null,
        category: category.trim() || 'Personal',
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        estimatedTime: estimatedTime.trim() || null,
        imageUrl: imageUrl || null,
      };

      await onSave(payload, taskToEdit?.id);
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-amber-100 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-orange-50/60 to-amber-50/40">
          <h3 className="font-bold text-slate-800 text-lg">
            {taskToEdit ? t.taskModal.editTitle : t.taskModal.newTitle}
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[80vh]">
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              {t.taskModal.taskTitleLabel} <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t.taskModal.taskTitlePlaceholder}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-400 focus:border-amber-400 text-sm text-slate-800 font-medium"
            />
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                {t.taskModal.descriptionLabel}
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      await handleProcessImage(file);
                      e.target.value = '';
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isCompressing}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors cursor-pointer"
                >
                  {isCompressing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-500" />
                  ) : (
                    <ImageIcon className="w-3.5 h-3.5 text-purple-500" />
                  )}
                  <span>{isCompressing ? t.notesBoard.modalProcessing : imageUrl ? t.taskModal.changeImageBtn : t.taskModal.addImageBtn}</span>
                </button>
              </div>
            </div>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onPaste={handlePaste}
              placeholder={t.taskModal.descriptionPlaceholder}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-400 focus:border-amber-400 text-sm text-slate-800 resize-none"
            />
          </div>

          {/* Image Attachment Preview */}
          {imageUrl && (
            <div className="p-3 rounded-2xl bg-purple-50/50 border border-purple-200/80 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span className="flex items-center gap-1.5 text-purple-900">
                  <ImageIcon className="w-3.5 h-3.5 text-purple-600" />
                  <span>{t.taskModal.attachedCoverLabel}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setImageUrl(null)}
                  className="text-[11px] font-semibold text-rose-500 hover:text-rose-600 flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>{t.common.delete}</span>
                </button>
              </div>
              <div className="relative group rounded-xl overflow-hidden border border-purple-100 bg-white max-h-48 flex items-center justify-center p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt="Cover tugas"
                  className="w-full max-h-44 object-contain rounded-lg"
                />
              </div>
            </div>
          )}

          {/* Subtask Checklist Section */}
          <div className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-amber-600" />
                {t.taskModal.subtasksTitle}
              </label>
              {subtasks.length > 0 && (
                <span className="text-[11px] font-bold text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded-full border border-amber-200">
                  {subtasks.filter((s) => s.completed).length} / {subtasks.length} {t.common.done}
                </span>
              )}
            </div>

            {/* Existing Subtask items */}
            {subtasks.length > 0 && (
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {subtasks.map((st, idx) => (
                  <div
                    key={st.id || idx}
                    className="flex items-center gap-2 p-1.5 px-2.5 bg-white rounded-xl border border-amber-200/70 shadow-2xs group"
                  >
                    <input
                      type="checkbox"
                      checked={st.completed}
                      onChange={() => handleToggleSubtask(idx)}
                      className="w-4 h-4 accent-amber-500 rounded cursor-pointer shrink-0"
                    />
                    <input
                      type="text"
                      value={st.title}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSubtasks((prev) =>
                          prev.map((item, i) => (i === idx ? { ...item, title: val } : item))
                        );
                      }}
                      className={`flex-1 text-xs text-slate-800 bg-transparent focus:outline-hidden ${
                        st.completed ? 'line-through text-slate-400' : ''
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveSubtask(idx)}
                      className="text-slate-400 hover:text-rose-500 p-0.5 opacity-60 group-hover:opacity-100 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add new subtask input */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newSubtaskInput}
                onChange={(e) => setNewSubtaskInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubtask();
                  }
                }}
                placeholder={t.taskModal.addSubtaskPlaceholder}
                className="flex-1 px-3 py-1.5 rounded-xl border border-amber-200 text-xs bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-400"
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-2xs active:scale-95 cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t.common.add}</span>
              </button>
            </div>
          </div>

          {/* Status & Priority Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {t.taskModal.statusColumnLabel}
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-400 text-sm font-medium text-slate-700 bg-white"
              >
                <option value="TODO">💡 {t.kanban.defaultColTodoTitle}</option>
                <option value="IN_PROGRESS">⚡ {t.kanban.defaultColProgTitle}</option>
                <option value="DONE">🏆 {t.kanban.defaultColDoneTitle}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {t.taskModal.priorityLabel}
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-400 text-sm font-medium text-slate-700 bg-white"
              >
                <option value="HIGH">{t.taskModal.priorityHigh}</option>
                <option value="MEDIUM">{t.taskModal.priorityMedium}</option>
                <option value="LOW">{t.taskModal.priorityLow}</option>
              </select>
            </div>
          </div>

          {/* Assignee Row (Visible if board has members/assignees) */}
          {assignees && assignees.length > 0 && (
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                <Users className="w-3.5 h-3.5 text-amber-500" />
                <span>Tugaskan Ke (Penanggung Jawab)</span>
              </label>
              <select
                value={assignedToId || ''}
                onChange={(e) => setAssignedToId(e.target.value || null)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-400 text-sm font-medium text-slate-700 bg-white"
              >
                <option value="">-- Belum Ditugaskan --</option>
                {assignees.map((person) => (
                  <option key={person.id} value={person.id}>
                    👤 {person.name || person.email || 'Anggota'}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Sticky Note Paper Color Picker (Pilihan Warna Kertas Per-Kartu) */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                {t.taskModal.paperColorLabel}
              </label>
              <span className="text-[11px] text-slate-500 font-medium">
                {noteColor === 'auto' ? t.common.auto : NOTE_COLOR_OPTIONS.find((c) => c.id === noteColor)?.label}
              </span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setNoteColor('auto')}
                className={`px-2.5 py-1 text-xs rounded-xl border transition-all cursor-pointer font-bold ${
                  noteColor === 'auto'
                    ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {t.common.auto}
              </button>

              {NOTE_COLOR_OPTIONS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setNoteColor(c.id)}
                  className={`w-7 h-7 rounded-xl transition-all cursor-pointer border flex items-center justify-center ${
                    noteColor === c.id
                      ? 'scale-115 ring-2 ring-orange-500 shadow-xs'
                      : 'hover:scale-105 opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c.dotHex }}
                  title={c.label}
                >
                  {noteColor === c.id && <span className="text-white text-xs drop-shadow-md">✓</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                {t.taskModal.categoryLabel}
              </label>
              {category.trim() && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-400 font-medium">{t.taskModal.labelPreview}</span>
                  <CategoryBadge category={category} customCategories={customCategories} />
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 mb-2">
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder={t.taskModal.categoryPlaceholder}
                className="w-full px-3.5 py-2 rounded-2xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-400 text-sm font-medium text-slate-800 bg-white"
              />
            </div>

            <div className="flex flex-wrap gap-1.5">
              {(customCategories && customCategories.length > 0
                ? customCategories.map((c) => c.name)
                : DEFAULT_CATEGORY_SUGGESTIONS
              ).map((cat) => {
                const isSelected = category.trim().toLowerCase() === cat.trim().toLowerCase();
                const colorClasses = getCategoryBadgeClasses(cat, customCategories);
                const dotHex = getCategoryDotHex(cat, customCategories);

                return (
                  <button
                    type="button"
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? `${colorClasses} font-bold ring-2 ring-slate-800/25 shadow-xs scale-105`
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: dotHex }}
                    />
                    <span>{cat}</span>
                    {isSelected && <span className="text-[10px] font-black">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Due Date & Time, and Estimated Duration Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-amber-600" />
                <span>{t.taskModal.dueDateLabel}</span>
              </label>
              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-2xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-400 text-xs sm:text-sm font-medium text-slate-700 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>{t.taskModal.estimatedTimeLabel}</span>
              </label>
              <input
                type="text"
                value={estimatedTime}
                onChange={(e) => setEstimatedTime(e.target.value)}
                placeholder={t.taskModal.estimatedTimePlaceholder}
                className="w-full px-3.5 py-2 rounded-2xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-400 text-xs sm:text-sm font-medium text-slate-700"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-sm font-medium transition-colors cursor-pointer"
            >
              {t.common.cancel}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-2xl bg-gradient-to-r from-orange-400 to-amber-500 hover:from-orange-500 hover:to-amber-600 active:scale-95 text-white text-sm font-semibold shadow-md shadow-orange-200 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? t.taskModal.savingBtn : taskToEdit ? t.taskModal.updateBtn : t.taskModal.saveBtn}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
