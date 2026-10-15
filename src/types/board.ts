export type BoardType = 'TASK' | 'NOTE';

export interface Board {
  id: string;
  userId?: string | null;
  title: string;
  type: BoardType;
  icon: string;
  color: string;
  isDefault: boolean;
  order: number;
  tasksCount?: number;
  notesCount?: number;
  _count?: {
    tasks: number;
    notes: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateBoardInput {
  title: string;
  type: BoardType;
  icon?: string;
  color?: string;
}

export interface UpdateBoardInput {
  title?: string;
  icon?: string;
  color?: string;
  order?: number;
}
