"use client";
import TaskRow from "@/components/schedule/TaskRow";

/** props: { todos: Todo[], toggleTodo: (id) => void } */
export default function FullTodoList({ todos, toggleTodo }) {
  if (!Array.isArray(todos) || todos.length === 0) {
    return <div className="text-sm text-muted-foreground">タスクはありません</div>;
  }
  return (
    <ul className="grid gap-2">
      {todos.map((t) => (
        <li key={t.id} className="rounded-lg bg-card shadow-sm hover:bg-accent/50 transition-colors">
          <TaskRow task={t} onToggle={() => toggleTodo?.(t.id)} />
        </li>
      ))}
    </ul>
  );
}
