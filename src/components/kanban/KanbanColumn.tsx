import React from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { Task, TaskStatus } from '@/types/task';
import { WashiTapeStyle, FontMood, CustomCategory, NoteColorMode } from '@/types/preferences';
import { TaskCard } from './TaskCard';
import { Lightbulb, Zap, Trophy, Plus, Sparkles, Archive } from 'lucide-react';

interface KanbanColumnProps {
  id: TaskStatus;
  title: string;
  subtitle: string;
  emoji?: string;
  status: TaskStatus;
  tasks: Task[];
  washiTapeStyle?: WashiTapeStyle;
  customCategories?: CustomCategory[];
  fontMood?: FontMood;
  noteColorMode?: NoteColorMode;
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onStatusChange: (id: string, newStatus: TaskStatus) => void;
  onAddTaskToColumn?: (status: TaskStatus) => void;
  onToggleSubtask?: (taskId: string, subtaskIndex: number) => void;
  onTogglePin?: (taskId: string) => void;
  onStartPomodoro?: (task: Task) => void;
  onArchiveDone?: () => void;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  id,
  title,
  subtitle,
  emoji,
  status,
  tasks,
  washiTapeStyle = 'soft',
  customCategories,
  fontMood = 'modern',
  noteColorMode = 'column',
  onEditTask,
  onDeleteTask,
  onStatusChange,
  onAddTaskToColumn,
  onToggleSubtask,
  onTogglePin,
  onStartPomodoro,
  onArchiveDone,
}) => {
  // Rich, tactile pastel themed styles per column
  const getTheme = () => {
    switch (status) {
      case 'TODO':
        return {
          wrapper: 'bg-gradient-to-b from-amber-100/70 via-amber-50/50 to-amber-100/40 border-amber-300/80 shadow-lg shadow-amber-900/5',
          headerBg: 'bg-gradient-to-r from-amber-200/95 via-amber-100 to-orange-100/90 border-amber-300/90 shadow-xs',
          pinBg: 'bg-amber-400 border-amber-500 shadow-amber-400/50',
          accentText: 'text-amber-950',
          subtitleText: 'text-amber-800/80',
          badge: 'bg-amber-300 text-amber-950 border border-amber-400 font-black shadow-xs',
          icon: <Lightbulb className="w-5 h-5 text-amber-600" />,
          dropActive: 'bg-amber-200/60 ring-2 ring-amber-400 shadow-inner',
          quickAddBtn: 'hover:bg-amber-200/90 text-amber-900 border-amber-300/80',
          ghostBg: 'border-amber-300/80 bg-amber-50/40 text-amber-850 hover:bg-amber-100/40',
          ghostTape: 'bg-amber-200/70 border-amber-300/60',
        };
      case 'IN_PROGRESS':
        return {
          wrapper: 'bg-gradient-to-b from-sky-100/70 via-sky-50/50 to-sky-100/40 border-sky-300/80 shadow-lg shadow-sky-900/5',
          headerBg: 'bg-gradient-to-r from-sky-200/95 via-sky-100 to-blue-100/90 border-sky-300/90 shadow-xs',
          pinBg: 'bg-sky-400 border-sky-500 shadow-sky-400/50',
          accentText: 'text-sky-950',
          subtitleText: 'text-sky-800/80',
          badge: 'bg-sky-300 text-sky-950 border border-sky-400 font-black shadow-xs',
          icon: <Zap className="w-5 h-5 text-sky-600" />,
          dropActive: 'bg-sky-200/60 ring-2 ring-sky-400 shadow-inner',
          quickAddBtn: 'hover:bg-sky-200/90 text-sky-900 border-sky-300/80',
          ghostBg: 'border-sky-300/80 bg-sky-50/40 text-sky-850 hover:bg-sky-100/40',
          ghostTape: 'bg-sky-200/70 border-sky-300/60',
        };
      case 'DONE':
        return {
          wrapper: 'bg-gradient-to-b from-emerald-100/70 via-emerald-50/50 to-emerald-100/40 border-emerald-300/80 shadow-lg shadow-emerald-900/5',
          headerBg: 'bg-gradient-to-r from-emerald-200/95 via-emerald-100 to-teal-100/90 border-emerald-300/90 shadow-xs',
          pinBg: 'bg-emerald-400 border-emerald-500 shadow-emerald-400/50',
          accentText: 'text-emerald-950',
          subtitleText: 'text-emerald-800/80',
          badge: 'bg-emerald-300 text-emerald-950 border border-emerald-400 font-black shadow-xs',
          icon: <Trophy className="w-5 h-5 text-emerald-600" />,
          dropActive: 'bg-emerald-200/60 ring-2 ring-emerald-400 shadow-inner',
          quickAddBtn: 'hover:bg-emerald-200/90 text-emerald-900 border-emerald-300/80',
          ghostBg: 'border-emerald-300/80 bg-emerald-50/40 text-emerald-850 hover:bg-emerald-100/40',
          ghostTape: 'bg-emerald-200/70 border-emerald-300/60',
        };
    }
  };

  const theme = getTheme();

  return (
    <div
      className={`relative flex flex-col flex-1 min-w-[300px] max-w-full rounded-2xl border ${theme.wrapper} p-3 pt-4 transition-all duration-200`}
    >
      {/* Decorative Board Magnet Pin at the top center */}
      <div
        className={`absolute -top-2 left-1/2 -translate-x-1/2 w-4.5 h-4.5 rounded-full ${theme.pinBg} border-2 shadow-xs flex items-center justify-center z-10`}
      >
        <div className="w-1.5 h-1.5 rounded-full bg-white/80 shadow-xs" />
      </div>

      {/* Column Header */}
      <div className={`p-2.5 sm:p-3 rounded-xl mb-2.5 ${theme.headerBg} border transition-all`}>
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-white/70 shadow-2xs flex items-center justify-center min-w-[28px] min-h-[28px]">
              {emoji ? <span className="text-sm leading-none">{emoji}</span> : theme.icon}
            </div>
            <div>
              <h3 className={`font-black text-sm tracking-tight ${theme.accentText}`}>
                {title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Archive All Done Button */}
            {status === 'DONE' && tasks.length > 0 && onArchiveDone && (
              <button
                type="button"
                onClick={onArchiveDone}
                className="p-1 rounded-lg bg-white/70 border border-emerald-300 hover:bg-emerald-200/90 text-emerald-800 transition-all active:scale-95 cursor-pointer shadow-2xs flex items-center gap-1 text-[11px] font-bold px-1.5"
                title="Pindahkan tugas selesai ke Arsip 📦"
              >
                <Archive className="w-3.5 h-3.5 text-emerald-700" />
                <span className="hidden sm:inline">Arsipkan</span>
              </button>
            )}

            {/* Direct Quick Add Button */}
            {onAddTaskToColumn && (
              <button
                onClick={() => onAddTaskToColumn(status)}
                className={`p-1 rounded-lg bg-white/60 border ${theme.quickAddBtn} transition-all active:scale-95 cursor-pointer shadow-2xs`}
                title={`Tambah tugas ke ${title}`}
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Circular Stamp-like Counter Badge */}
            <span
              className={`w-5.5 h-5.5 rounded-full flex items-center justify-center text-[11px] font-bold ${theme.badge}`}
              title={`${tasks.length} tugas`}
            >
              {tasks.length}
            </span>
          </div>
        </div>

        <p className={`text-[11px] font-medium pl-8 ${theme.subtitleText}`}>
          {subtitle}
        </p>
      </div>

      {/* Droppable Zone */}
      <Droppable droppableId={id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 flex flex-col gap-3 min-h-[440px] p-1.5 rounded-2xl transition-all duration-200 ${
              snapshot.isDraggingOver ? theme.dropActive : ''
            }`}
          >
            {tasks.length === 0 ? (
              /* Ghost Sticky Note Empty State */
              <div
                onClick={() => onAddTaskToColumn && onAddTaskToColumn(status)}
                className={`relative flex-1 flex flex-col items-center justify-center border-2 border-dashed ${theme.ghostBg} rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 group -rotate-[0.5deg] hover:rotate-0`}
              >
                {/* Translucent Ghost Tape */}
                <div
                  className={`absolute -top-2.5 left-1/2 -translate-x-1/2 w-14 h-4.5 ${theme.ghostTape} border rounded-xs backdrop-blur-2xs opacity-60 group-hover:opacity-90 transition-opacity`}
                />

                <div className="w-10 h-10 rounded-2xl bg-white/80 border border-current flex items-center justify-center text-current mb-2.5 shadow-2xs group-hover:scale-110 transition-transform">
                  <Sparkles className="w-5 h-5 opacity-75" />
                </div>
                <p className="text-xs font-bold text-slate-700 mb-1">
                  Tempel Catatan di Sini
                </p>
                <p className="text-[11px] text-slate-500 max-w-[170px] leading-relaxed">
                  Belum ada sticky note. Klik untuk membuat tugas baru! 📌
                </p>
              </div>
            ) : (
              tasks.map((task, index) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  index={index}
                  washiTapeStyle={washiTapeStyle}
                  customCategories={customCategories}
                  fontMood={fontMood}
                  noteColorMode={noteColorMode}
                  onEdit={onEditTask}
                  onDelete={onDeleteTask}
                  onStatusChange={onStatusChange}
                  onToggleSubtask={onToggleSubtask}
                  onTogglePin={onTogglePin}
                  onStartPomodoro={onStartPomodoro}
                />
              ))
            )}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
};
