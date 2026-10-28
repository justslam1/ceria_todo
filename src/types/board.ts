export type BoardType = 'TASK' | 'NOTE';
export type BoardRole = 'OWNER' | 'MEMBER';

export interface BoardMemberInfo {
  id: string;
  role: BoardRole | string;
  user: {
    id: string;
    name: string | null;
    image: string | null;
    email: string | null;
  };
  createdAt?: string;
}

export interface Board {
  id: string;
  userId?: string | null;
  title: string;
  type: BoardType;
  icon: string;
  color: string;
  isDefault: boolean;
  order: number;
  inviteCode?: string | null;
  role?: BoardRole;
  isShared?: boolean;
  ownerName?: string | null;
  owner?: {
    id: string;
    name: string | null;
    image: string | null;
    email: string | null;
  } | null;
  membersCount?: number;
  members?: BoardMemberInfo[];
  tasksCount?: number;
  notesCount?: number;
  _count?: {
    tasks: number;
    notes: number;
    members?: number;
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
