// src/lib/actions/todo-actions.ts
"use server";

import { Todo, CreateTodoData, UpdateTodoData, DeleteTodoData } from "@/lib/types";
import { revalidatePath } from "next/cache";

// 実際のアプリケーションでは、ここでデータベースにアクセスします
// 現在はlocalStorageの代わりにメモリ内のストレージを使用
let todos: Todo[] = [];

export async function createTodo(data: CreateTodoData): Promise<Todo> {
  const newTodo: Todo = {
    id: crypto.randomUUID(),
    text: data.text,
    completed: false,
    remindAt: data.remindAt,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  todos.push(newTodo);
  revalidatePath("/");
  
  return newTodo;
}

export async function updateTodo(data: UpdateTodoData): Promise<Todo | null> {
  const todoIndex = todos.findIndex(todo => todo.id === data.id);
  if (todoIndex === -1) return null;

  const existingTodo = todos[todoIndex]!;
  const updatedTodo: Todo = {
    id: existingTodo.id,
    text: data.text ?? existingTodo.text,
    completed: data.completed ?? existingTodo.completed,
    remindAt: data.remindAt ?? existingTodo.remindAt,
    createdAt: existingTodo.createdAt,
    updatedAt: new Date().toISOString(),
  };

  todos[todoIndex] = updatedTodo;
  revalidatePath("/");
  
  return updatedTodo;
}

export async function deleteTodo(data: DeleteTodoData): Promise<boolean> {
  const initialLength = todos.length;
  todos = todos.filter(todo => todo.id !== data.id);
  
  const deleted = todos.length < initialLength;
  if (deleted) {
    revalidatePath("/");
  }
  
  return deleted;
}

export async function getAllTodos(): Promise<Todo[]> {
  return todos;
}
