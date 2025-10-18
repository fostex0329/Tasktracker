// src/lib/types/todo.ts
export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  remindAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTodoData {
  text: string;
  remindAt: string;
}

export interface UpdateTodoData {
  id: string;
  text?: string;
  completed?: boolean;
  remindAt?: string;
}

export interface DeleteTodoData {
  id: string;
}

// Date grouping types
export interface GroupedByMonth {
  [key: string]: Todo[];
}

export interface GroupedByDate {
  [key: string]: Todo[];
}

export interface DateGroup {
  date: string;
  todos: Todo[];
}
