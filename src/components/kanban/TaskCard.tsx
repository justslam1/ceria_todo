import React, { useState } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Task, TaskStatus } from '@/types/task';
import {
  WashiTapeStyle,
  FontMood,
  CustomCategory,
  NoteColor,
  NoteColorMode,
  PinStyle,
  CompletionStamp,
  StampColor,
  ViewDensity,
  PaperTexture,
} from '@/types/preferences';
import { getStickyNoteStyle, getStampStyle, getPaperTextureStyle } from '@/lib/userPreferences';
import { PriorityBadge, CategoryBadge, DateBadge, TimeEstimateBadge } from '@/components/ui/Badge';
import {
  Trash2,
  Edit3,
  ArrowRight,
  GripVertical,
  CheckCircle2,
  History,
  CheckSquare,
  Pin,
  Timer,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { parseTaskDescription } from '@/lib/subtasks';

interface TaskCardProps {
  task: Task;
  index: number;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, newStatus: TaskStatus) => void;
  onToggleSubtask?: (taskId: string, subtaskIndex: number) => void;
  onTogglePin?: (taskId: string) => void;
  onStartPomodoro?: (task: Task) => void;
  washiTapeStyle?: WashiTapeStyle;
  customCategories?: CustomCategory[];
  fontMood?: FontMood;
  noteColorMode?: NoteColorMode;
  pinStyle?: PinStyle;
  completionStamp?: CompletionStamp;
  stampColor?: StampColor;
  viewDensity?: ViewDensity;
  paperTexture?: PaperTexture;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  index,
  onEdit,
  onDelete,
  onStatusChange,
  onToggleSubtask,
  onTogglePin,
  onStartPomodoro,
  washiTapeStyle = 'soft',
  customCategories,
  fontMood = 'modern',
  noteColorMode = 'column',
  pinStyle = 'pin',
  completionStamp = 'SELESAI!',
  stampColor = 'red',
  viewDensity = 'cozy',
  paperTexture = 'plain',
}) => {
  const [isSubtasksExpanded, setIsSubtasksExpanded] = useState(false);

  const getNextStatus = (current: TaskStatus): TaskStatus | null => {
    if (current === 'TODO') return 'IN_PROGRESS';
    if (current === 'IN_PROGRESS') return 'DONE';
    return null;
  };

  const nextStatus = getNextStatus(task.status);

  // Subtle natural angle for organic sticky note look
  const tiltClass = index % 2 === 0 ? '-rotate-[0.6deg]' : 'rotate-[0.6deg]';

  // Format creation timestamp
  const formatCreatedTime = (isoString: string) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Check pin status
  const isPinned = Boolean(task.description?.includes('[pin:true]'));

  // Parse structured description (subtasks, notes, color)
  const cleanRawDesc = (task.description || '').replace(/\[pin:true\]/gi, '').trim();
  const parsed = parseTaskDescription(cleanRawDesc);
  const explicitColor = (parsed.colorTag || 'auto') as NoteColor;
  const displayDescription = parsed.note || null;
  const subtasks = parsed.subtasks;

  const theme = getStickyNoteStyle(task.status, task.priority, explicitColor, noteColorMode);
  const stampStyle = getStampStyle(stampColor);
  const isCompact = viewDensity === 'compact';

  // Determine paper texture (category override or board global setting)
  const matchingCat = customCategories?.find(
    (c) => c.name.toLowerCase() === (task.category || '').toLowerCase()
  );
  const effectiveTexture: PaperTexture = matchingCat?.paperTexture || paperTexture || 'plain';
  const textureStyle = getPaperTextureStyle(effectiveTexture, false);

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`relative group rounded-2xl border transition-all duration-200 ${
            isCompact ? 'p-3 pt-4' : 'p-4 pt-5'
          } ${
            snapshot.isDragging
              ? theme.dragging
              : `${theme.paperBg} ${tiltClass} hover:rotate-0 hover:scale-[1.01] hover:shadow-lg`
          } ${task.status === 'DONE' ? 'opacity-90' : ''} ${
            isPinned ? 'ring-2 ring-amber-400 shadow-md shadow-amber-200/40' : ''
          }`}
        >
          {/* Subtle Physical Paper Texture Overlay */}
          {effectiveTexture !== 'plain' && (
            <div
              className="absolute inset-0 rounded-2xl pointer-events-none z-0 opacity-70 overflow-hidden"
              style={textureStyle}
            />
          )}
          {/* Physical Fastener Pin Style on Top Edge */}
          {pinStyle === 'pin' && (
            <div
              className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20 pointer-events-none drop-shadow-md select-none text-xl transition-transform group-hover:scale-110"
              title="Paku Payung"
            >
              📌
            </div>
          )}
          {pinStyle === 'paperclip' && (
            <div
              className="absolute -top-3.5 left-6 z-20 pointer-events-none drop-shadow-md select-none text-xl transition-transform group-hover:rotate-6"
              title="Klip Kertas"
            >
              📎
            </div>
          )}
          {pinStyle === 'woodpeg' && (
            <div
              className="absolute -top-3.5 left-7 z-20 pointer-events-none drop-shadow-md select-none text-xl transition-transform group-hover:-translate-y-0.5"
              title="Jepit Kayu"
            >
              🪵
            </div>
          )}
          {pinStyle === 'magnet' && (
            <div
              className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none drop-shadow-md select-none text-lg transition-transform group-hover:scale-110"
              title="Magnet Kulkas"
            >
              🧲
            </div>
          )}

          {/* Decorative Washi Tape strip at the top center (Only when tape style is selected) */}
          {pinStyle === 'tape' && washiTapeStyle !== 'none' && (
            <div
              className={`absolute -top-2.5 left-1/2 -translate-x-1/2 w-16 h-5 border backdrop-blur-xs rounded-xs shadow-2xs rotate-[-1deg] transition-all pointer-events-none z-10 ${
                isPinned
                  ? 'bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-300 border-amber-400 shadow-xs'
                  : washiTapeStyle === 'colorful'
                  ? task.status === 'TODO'
                    ? 'bg-amber-400/90 border-amber-500 opacity-90 group-hover:opacity-100'
                    : task.status === 'IN_PROGRESS'
                    ? 'bg-sky-400/90 border-sky-500 opacity-90 group-hover:opacity-100'
                    : 'bg-emerald-400/90 border-emerald-500 opacity-90 group-hover:opacity-100'
                  : washiTapeStyle === 'pattern'
                  ? `${theme.tapeBg} bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,rgba(255,255,255,0.6)_4px,rgba(255,255,255,0.6)_8px)] opacity-85 group-hover:opacity-100`
                  : `${theme.tapeBg} opacity-75 group-hover:opacity-95`
              }`}
            />
          )}

          {/* Card Top Header: Drag Handle, Badges, Pin Badge, Actions */}
          <div className={`flex items-center justify-between gap-1.5 ${isCompact ? 'mb-1.5' : 'mb-2.5'}`}>
            <div className="flex items-center gap-1.5 flex-wrap">
              <div
                {...provided.dragHandleProps}
                className={`cursor-grab active:cursor-grabbing ${theme.grip} p-0.5 -ml-1 transition-colors`}
                title="Geser sticky note untuk memindahkan"
              >
                <GripVertical className="w-4 h-4" />
              </div>
              <CategoryBadge category={task.category || 'Personal'} customCategories={customCategories} />
              <PriorityBadge priority={task.priority} />
              {isPinned && (
                <span className="inline-flex items-center gap-0.5 px-2 py-0.2 rounded-full text-[10px] font-extrabold bg-amber-400 text-amber-950 border border-amber-500 shadow-2xs">
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>Fokus</span>
                </span>
              )}
            </div>

            {/* Quick Actions (Pin, Pomodoro, Edit, Delete) */}
            <div className="flex items-center gap-0.5 opacity-70 group-hover:opacity-100 transition-opacity">
              {onTogglePin && (
                <button
                  type="button"
                  onClick={() => onTogglePin(task.id)}
                  className={`p-1 rounded-lg transition-colors cursor-pointer ${
                    isPinned
                      ? 'text-amber-600 bg-amber-100/80 hover:bg-amber-200'
                      : 'text-slate-400 hover:text-amber-600 hover:bg-white/70'
                  }`}
                  title={isPinned ? 'Lepas sematan fokus' : 'Sematkan ke Fokus Hari Ini 📌'}
                >
                  <Pin className={`w-3.5 h-3.5 ${isPinned ? 'fill-amber-500' : ''}`} />
                </button>
              )}
              {onStartPomodoro && task.status !== 'DONE' && (
                <button
                  type="button"
                  onClick={() => onStartPomodoro(task)}
                  className="p-1 text-slate-400 hover:text-orange-600 rounded-lg hover:bg-white/70 transition-colors cursor-pointer"
                  title="Mulai Pomodoro Fokus ⏱️"
                >
                  <Timer className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => onEdit(task)}
                className="p-1 text-slate-500 hover:text-blue-700 rounded-lg hover:bg-white/70 transition-colors cursor-pointer"
                title="Edit tugas"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onDelete(task.id)}
                className="p-1 text-slate-500 hover:text-rose-700 rounded-lg hover:bg-white/70 transition-colors cursor-pointer"
                title="Hapus tugas"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Sticky Note Title */}
          <h4
            className={`${
              fontMood === 'handwriting'
                ? isCompact ? 'font-handwriting text-sm font-bold tracking-wide' : 'font-handwriting text-base font-bold tracking-wide'
                : fontMood === 'rounded'
                ? isCompact ? 'font-rounded font-bold text-xs' : 'font-rounded font-bold text-sm'
                : isCompact ? 'font-bold text-xs' : 'font-bold text-sm'
            } ${theme.title} leading-snug ${isCompact ? 'mb-1' : 'mb-1.5'} ${
              task.status === 'DONE' ? 'line-through text-slate-500' : ''
            }`}
          >
            {task.title}
          </h4>

          {/* Sticky Note Description / Notes */}
          {displayDescription && (
            <p
              className={`${isCompact ? 'text-[11px] line-clamp-1 mb-1.5' : 'text-xs line-clamp-2 mb-2'} text-slate-700 leading-relaxed ${
                fontMood === 'handwriting' ? 'font-handwriting text-sm font-semibold' : ''
              }`}
            >
              {displayDescription}
            </p>
          )}

          {/* Subtask Checklist on Card */}
          {subtasks.length > 0 && (
            isCompact ? (
              /* Compact subtasks single-line preview with toggle expand */
              <div className="mb-2 p-1.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 space-y-1">
                <button
                  type="button"
                  onClick={() => setIsSubtasksExpanded((prev) => !prev)}
                  className="w-full flex items-center justify-between text-[10px] font-bold text-slate-700 dark:text-slate-200 cursor-pointer hover:opacity-80"
                >
                  <span className="flex items-center gap-1">
                    <CheckSquare className="w-2.5 h-2.5 text-amber-600" />
                    <span>Sub-tugas: {subtasks.filter((s) => s.completed).length}/{subtasks.length}</span>
                  </span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-12 bg-black/10 dark:bg-white/10 h-1 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full"
                        style={{
                          width: `${Math.round(
                            (subtasks.filter((s) => s.completed).length / subtasks.length) * 100
                          )}%`,
                        }}
                      />
                    </div>
                    {isSubtasksExpanded ? <ChevronUp className="w-3 h-3 text-slate-400" /> : <ChevronDown className="w-3 h-3 text-slate-400" />}
                  </div>
                </button>

                {isSubtasksExpanded && (
                  <div className="space-y-1 pt-1 border-t border-black/5 dark:border-white/10">
                    {subtasks.map((st, sIdx) => (
                      <label
                        key={st.id || sIdx}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1.5 text-[11px] text-slate-800 dark:text-slate-200 cursor-pointer select-none"
                      >
                        <input
                          type="checkbox"
                          checked={st.completed}
                          onChange={() => onToggleSubtask?.(task.id, sIdx)}
                          className="w-3 h-3 accent-amber-500 rounded cursor-pointer shrink-0"
                        />
                        <span className={`truncate ${st.completed ? 'line-through text-slate-400' : 'font-medium'}`}>
                          {st.title}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* Cozy full subtask list */
              <div className="mb-2.5 p-2 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                  <span className="flex items-center gap-1">
                    <CheckSquare className="w-3 h-3 text-amber-600" />
                    <span>Sub-tugas:</span>
                  </span>
                  <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-md bg-white/70 shadow-2xs font-bold text-slate-800">
                    {subtasks.filter((s) => s.completed).length}/{subtasks.length}
                  </span>
                </div>

                {/* Mini progress bar for subtasks */}
                <div className="w-full bg-black/10 dark:bg-white/10 h-1 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full transition-all duration-300"
                    style={{
                      width: `${Math.round(
                        (subtasks.filter((s) => s.completed).length / subtasks.length) * 100
                      )}%`,
                    }}
                  />
                </div>

                {/* Subtasks items with click-to-toggle */}
                <div className="space-y-1 pt-0.5">
                  {subtasks.map((st, sIdx) => (
                    <label
                      key={st.id || sIdx}
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      className="flex items-center gap-1.5 text-xs text-slate-800 cursor-pointer hover:opacity-80 transition-opacity select-none group/item"
                    >
                      <input
                        type="checkbox"
                        checked={st.completed}
                        onChange={() => onToggleSubtask?.(task.id, sIdx)}
                        className="w-3.5 h-3.5 accent-amber-500 rounded cursor-pointer shrink-0"
                      />
                      <span
                        className={`truncate text-[11px] ${
                          st.completed ? 'line-through text-slate-400 opacity-75' : 'font-medium'
                        }`}
                      >
                        {st.title}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )
          )}

          {/* Retro Completion Stamp (Visible on DONE status) */}
          {task.status === 'DONE' && completionStamp && completionStamp !== 'none' && (
            <div className="absolute right-3 bottom-10 pointer-events-none select-none z-20 -rotate-12 transition-transform group-hover:rotate-[-8deg] group-hover:scale-105">
              <div
                className={`border-2 border-dashed px-2 py-0.5 rounded-lg font-black uppercase tracking-wider text-[11px] sm:text-xs shadow-xs backdrop-blur-2xs flex items-center gap-1 opacity-90 ${stampStyle.borderClass} ${stampStyle.textClass} ${stampStyle.bgClass}`}
                style={{
                  boxShadow: '0 0 0 1.5px currentColor inset',
                  textShadow: '0.5px 0.5px 0px rgba(0,0,0,0.06)',
                }}
              >
                <span>{completionStamp}</span>
              </div>
            </div>
          )}

          {/* Created Date & Time meta text */}
          {!isCompact && (
            <div className={`flex items-center gap-1 text-[10px] ${theme.subtleText} mb-2.5 font-medium`}>
              <History className="w-3 h-3 opacity-70" />
              <span>Dibuat: {formatCreatedTime(task.createdAt)}</span>
            </div>
          )}

          {/* Sticky Note Footer: Due Date with Time, Estimate & Quick Advance */}
          <div className={`flex items-center justify-between gap-1.5 ${isCompact ? 'pt-1.5 mt-0.5' : 'pt-2.5 mt-1'} border-t ${theme.divider} text-xs`}>
            <div className="flex items-center gap-1.5 flex-wrap">
              <DateBadge date={task.dueDate} isDone={task.status === 'DONE'} />
              <TimeEstimateBadge time={task.estimatedTime} />
            </div>

            {/* Quick Status Advance Button */}
            {nextStatus && (
              <button
                onClick={() => onStatusChange(task.id, nextStatus)}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-xl text-xs font-bold ${theme.btnBg} border shadow-2xs transition-all active:scale-95 cursor-pointer`}
                title={nextStatus === 'IN_PROGRESS' ? 'Mulai kerjakan' : 'Tandai selesai'}
              >
                <span>{nextStatus === 'IN_PROGRESS' ? 'Aksi' : 'Selesai'}</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}

            {task.status === 'DONE' && (
              <span className="inline-flex items-center gap-1 text-emerald-800 dark:text-emerald-300 font-bold text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Selesai
              </span>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
};
