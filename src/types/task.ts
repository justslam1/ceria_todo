export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: Priority;
  category: string;
  dueDate: string | null; // ISO string from JSON
  estimatedTime: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: Priority;
  category?: string;
  dueDate?: string | Date | null;
  estimatedTime?: string | null;
  order?: number;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: Priority;
  category?: string;
  dueDate?: string | Date | null;
  estimatedTime?: string | null;
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
