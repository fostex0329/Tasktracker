"use client";
import { useCallback, useRef } from "react";
import { CheckCircle, Circle, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Todo } from "@/lib/types";
import { formatTime } from "@/lib/utils/date";

// Local helpers
function parseISO(v: string): Date { 
  return v ? new Date(v) : new Date(NaN); 
}

function isValidDate(d: Date): boolean { 
  return d instanceof Date && !Number.isNaN(d.getTime()); 
}

interface TaskRowProps {
  todo: Todo;
  isEditing: boolean;
  editingText: string;
  editingRemindAt: string;
  onToggle: () => void;
  onDelete: () => void;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onTextChange: (text: string) => void;
  onRemindAtChange: (remindAt: string) => void;
  onKeyPress: (e: React.KeyboardEvent, action: () => void) => void;
}

/**
 * タスク行コンポーネント（編集機能付き）
 */
export default function TaskRow({ 
  todo, 
  isEditing, 
  editingText, 
  editingRemindAt,
  onToggle, 
  onDelete,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onTextChange,
  onRemindAtChange,
  onKeyPress 
}: TaskRowProps) {
  const completed = !!todo.completed;
  const timeLabel = todo.remindAt ? formatTime(todo.remindAt) : null;
  const titleId = `task-title-${todo.id}`;
  const editInputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      if (!isEditing) {
        onToggle();
      }
    }
  }, [onToggle, isEditing]);

  const handleEditKeyPress = useCallback((e: React.KeyboardEvent) => {
    onKeyPress(e, onSaveEdit);
  }, [onKeyPress, onSaveEdit]);

  const handleCancelKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onCancelEdit();
    }
  }, [onCancelEdit]);

  if (isEditing) {
    return (
      <div className="flex items-center gap-3 p-2 bg-muted/50 rounded-md">
        <div className="flex-1 space-y-2">
          <Input
            ref={editInputRef}
            value={editingText}
            onChange={(e) => onTextChange(e.target.value)}
            onKeyPress={handleEditKeyPress}
            onKeyDown={handleCancelKeyPress}
            placeholder="タスクを編集..."
            className="text-sm"
          />
          <Input
            type="datetime-local"
            value={editingRemindAt}
            onChange={(e) => onRemindAtChange(e.target.value)}
            onKeyPress={handleEditKeyPress}
            onKeyDown={handleCancelKeyPress}
            className="text-xs"
          />
        </div>
        <div className="flex gap-1">
          <Button size="sm" onClick={onSaveEdit} disabled={!editingText.trim()}>
            保存
          </Button>
          <Button size="sm" variant="outline" onClick={onCancelEdit}>
            キャンセル
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      role="checkbox"
      aria-checked={completed}
      aria-labelledby={titleId}
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={handleKeyDown}
      className="flex items-start gap-3 bg-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-md p-1"
    >
      {/* 視覚用バレット（装飾扱い） */}
      {completed ? (
        <CheckCircle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" strokeWidth={2.5} />
      ) : (
        <Circle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-foreground/60" strokeWidth={2.5} />
      )}

      <div className="min-w-0 flex-1">
        <div
          id={titleId}
          className={`truncate text-[15px] ${
            completed
              ? "font-bold text-emerald-600 line-through decoration-emerald-600/80 decoration-[1.5px]"
              : "font-medium"
          }`}
        >
          {todo.text}
        </div>
        {timeLabel ? <div className="text-xs text-muted-foreground mt-1">{timeLabel}</div> : null}
      </div>

      {/* アクションボタン */}
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            onStartEdit();
          }}
          className="h-6 w-6 p-0"
        >
          <Pencil className="h-3 w-3" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="h-6 w-6 p-0 text-destructive hover:text-destructive"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
