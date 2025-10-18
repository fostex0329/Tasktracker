// src/app/page.tsx
import TodoForm from "@/components/features/dashboard/TodoForm";
import TodoServerComponent from "@/components/features/dashboard/TodoServerComponent";
import { getAllTodos } from "@/lib/actions/todo-actions";

export default async function Home() {
  // Server Componentでデータを取得
  const todos = await getAllTodos();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8">Task Tracker</h1>
        
        {/* Client Component for form interactions */}
        <TodoForm />
        
        {/* Server Component for displaying data */}
        <TodoServerComponent todos={todos} />
      </div>
    </div>
  );
}