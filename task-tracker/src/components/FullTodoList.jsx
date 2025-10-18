"use client";
import TaskRow from "@/components/schedule/TaskRow";
import { sortTodos } from "@/lib/sort-todos";

/** props: { todos: Todo[], toggleTodo: (id) => void } */
export default function FullTodoList({ todos, toggleTodo }) {
  if (!Array.isArray(todos) || todos.length === 0) {
    return <div className="text-sm text-muted-foreground">タスクはありません</div>;
  }
  const sorted = sortTodos(todos);
  return (
    <ul className="grid w-full gap-2">
      {sorted.map((t) => (
        <li key={t.id} className="min-w-0 w-full rounded-lg bg-card shadow-sm transition-colors hover:bg-accent/50">
          <TaskRow task={t} onToggle={() => toggleTodo?.(t.id)} />
        </li>
      ))}
    </ul>
  );
}
