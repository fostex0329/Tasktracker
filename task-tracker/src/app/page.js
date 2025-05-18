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
import { useState, useRef, useEffect } from "react";

// uuid
import { v4 as uuidv4 } from "uuid";

// 自作コンポーネント
import TaskList from "@/components/ui/tasklist";
import TodoList from "@/components/TodoList";
import Todo from "@/components/Todo";
import { Input } from "@/components/ui/input";  // Shadcn UI の Input コンポーネントをインポート
import { Card } from "@/components/ui/card";  // Shadcn UI の Card コンポーネントをインポート

export default function Home() {
  const [todos, setTodos] = useState([]);  // タスク一覧を管理
  const [isLoading, setIsLoading] = useState(true);  // ローディング状態を管理
  const todoNameRef = useRef();  // 入力フィールドへの参照

  // ローカルストレージからの読み込み
  useEffect(() => {
    try {
      const savedTodos = localStorage.getItem("todos");
      if (savedTodos) {
        setTodos(JSON.parse(savedTodos));
      }
    } catch (error) {
      console.error("ローカルストレージからの読み込みに失敗しました:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ローカルストレージへの保存
  useEffect(() => {
    try {
      localStorage.setItem("todos", JSON.stringify(todos));
    } catch (error) {
      console.error("ローカルストレージへの保存に失敗しました:", error);
    }
  }, [todos]);

  //タスク追加処理
  const handleAddTodo = async () => {
    const name = todoNameRef.current.value; // 入力フィールドから値を取得
    if (name === "") return; // 空の場合は処理を中断

    try {
      // API呼び出し
      const response = await fetch("/api/create", {
        method: "POST", // HTTPメソッドをPOSTに指定
        headers: { "Content-Type": "application/json" },  // JSONデータを送信することを明示
        body: JSON.stringify({ name }), // オブジェクトをJSON文字列に変換
      });
      const addedTask = await response.json(); // レスポンスをJSONとして解析
      setTodos(prevTodos => [...prevTodos, addedTask]); // 状態を更新（前のタスク一覧に新しいタスクを追加）
      todoNameRef.current.value = null; // 入力フィールドをクリア
    } catch (error) {
      console.error("タスクの追加に失敗しました:", error);
    }
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

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">読み込み中...</div>;
  }

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
          <Button type="submit" className="font-bold">タスクを追加</Button>
        </form>
        
        <button onClick={handleClear}>完了したタスクの削除</button>
        <div>残りのタスク{todos.filter((todo) => !todo.completed).length}</div>
      </Card>
    </div>
  );
};
