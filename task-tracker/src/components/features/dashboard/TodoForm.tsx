// src/components/features/dashboard/TodoForm.tsx
"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/common/ui/button";
import { Input } from "@/components/common/ui/input";
import { Card } from "@/components/common/ui/card";
import { localDatetimeToISO } from "@/lib/utils/date";
import { createTodo } from "@/lib/actions/todo-actions";

export default function TodoForm() {
  const [newTodoText, setNewTodoText] = useState("");
  const [newTodoRemindAt, setNewTodoRemindAt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAddTodo = async () => {
    if (!newTodoText.trim() || isSubmitting) return;
    
    const remindAtISO = localDatetimeToISO(newTodoRemindAt);
    if (!remindAtISO) return;

    setIsSubmitting(true);
    try {
      await createTodo({
        text: newTodoText.trim(),
        remindAt: remindAtISO,
      });
      
      setNewTodoText("");
      setNewTodoRemindAt("");
    } catch (error) {
      console.error("Failed to create todo:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddTodo();
    }
  };

  return (
    <Card className="p-6 mb-8">
      <div className="space-y-4">
        <div className="flex gap-4">
          <Input
            ref={inputRef}
            value={newTodoText}
            onChange={(e) => setNewTodoText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="新しいタスクを入力..."
            className="flex-1"
            disabled={isSubmitting}
          />
          <Input
            type="datetime-local"
            value={newTodoRemindAt}
            onChange={(e) => setNewTodoRemindAt(e.target.value)}
            className="w-48"
            disabled={isSubmitting}
          />
          <Button 
            onClick={handleAddTodo} 
            disabled={!newTodoText.trim() || isSubmitting}
          >
            {isSubmitting ? "追加中..." : "追加"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
