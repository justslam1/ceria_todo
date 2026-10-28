export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface TaskAssignee {
  id: string;
  name: string | null;
  image: string | null;
  email: string | null;
}

export interface Task {
  id: string;
  userId?: string | null;
  boardId?: string | null;
  assignedToId?: string | null;
  assignedTo?: TaskAssignee | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: Priority;
  category: string;
  dueDate: string | null; // ISO string from JSON
  estimatedTime: string | null;
  imageUrl?: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskInput {
  title: string;
  boardId?: string | null;
  assignedToId?: string | null;
  description?: string | null;
  status?: TaskStatus;
  priority?: Priority;
  category?: string;
  dueDate?: string | Date | null;
  estimatedTime?: string | null;
  imageUrl?: string | null;
  order?: number;
}

export interface UpdateTaskInput {
  title?: string;
  boardId?: string | null;
  assignedToId?: string | null;
  description?: string | null;
  status?: TaskStatus;
  priority?: Priority;
  category?: string;
  dueDate?: string | Date | null;
  estimatedTime?: string | null;
  imageUrl?: string | null;
  order?: number;
}

export interface ParsedTask {
  title: string;
  description?: string;
  priority: Priority;
  dueDate?: string;
  estimatedTime?: string;
  category?: string;
}

export interface BoardActivityItem {
  id: string;
  boardId: string;
  userId: string | null;
  userName: string | null;
  action: string;
  details: string | null;
  createdAt: string;
}
