"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

// React hook
import { useState, useRef } from "react";

// uuid
import { v4 as uuidv4 } from "uuid";

// 自作コンポーネント
import TaskList from "@/components/ui/tasklist";
import TodoList from "@/components/TodoList";
import Todo from "@/components/Todo";
import { Input } from "@/components/ui/input";  // Shadcn UI の Input コンポーネントをインポート
import { Card } from "@/components/ui/card";  // Shadcn UI の Card コンポーネントをインポート

export default function Home() {
  const [todos, setTodos] = useState([]);

  const todoNameRef = useRef();
  const todoDateRef = useRef(); // 日付入力用の ref を追加

  const getCurrentDate = () => {
    const now = new Date();
    const year = now.getFullYear().toString().slice(2); // YY
    const month = (now.getMonth() + 1).toString().padStart(2, "0"); // MM
    const day = now.getDate().toString().padStart(2, "0"); // DD
    return `${year}${month}${day}`;
  };

  const getCurrentTime = () => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, "0"); // HH
    const minutes = now.getMinutes().toString().padStart(2, "0"); // MM
    return `${hours}:${minutes}`;
  };

  const handleAddTodo = () => {
    const name = todoNameRef.current.value;
    const date = todoDateRef.current.value;
    if (name === "") return;
    const timestamp = getCurrentDate() + " " + getCurrentTime(); // 現在の日付と時間を組み合わせる
    setTodos((prevTodos) => {
      return [
        ...prevTodos,
        { id: uuidv4(), name: `${name} ${timestamp}`, completed: false, date: date },
      ];
    });
    todoNameRef.current.value = null;
    todoDateRef.current.value = ""; // 入力フィールドをクリア
  };

  const toggleTodo = (id) => {
    const newTodos = [...todos];
    const todo = newTodos.find((todo) => todo.id === id);
    todo.completed = !todo.completed;
    setTodos(newTodos);
  };

  const handleClear = () => {
    const newTodos = todos.filter((todo) => !todo.completed);
    setTodos(newTodos);
  };

  return (
    <div className="w-full max-w-screen-lg mx-auto p-4">
      {/* Shadcn UI の Card コンポーネント */}
      <Card className="p-4 space-y-4">
        {/* コンポーネント群を Card 内に表示 */}
        <TodoList todos={todos} toggleTodo={toggleTodo} />
        
        <form onSubmit={(e) => { e.preventDefault(); handleAddTodo(); }} className="space-y-4">
          <Input 
            ref={todoNameRef} 
            placeholder="タスク名を入力" 
            className="w-full" 
          />
          <Input
            ref={todoDateRef}
            type="text"
            placeholder={getCurrentTime()} // プレースホルダーに現在の時刻（HH:MM）を設定
            className="w-full placeholder-white" // プレースホルダーの色を白色に変更
          />
          <Button type="submit" className="font-bold">タスクを追加</Button>
        </form>
        
        <button onClick={handleClear}>完了したタスクの削除</button>
        <div>残りのタスク{todos.filter((todo) => !todo.completed).length}</div>
      </Card>
    </div>
  );
};
