"use client";
import { useCallback } from "react";
import { CheckCircle, Circle } from "lucide-react";

// --- local helpers (重複しない最小限だけ)
function parseISO(v){ return v ? new Date(v) : new Date(NaN); }
function isValidDate(d){ return d instanceof Date && !Number.isNaN(d.getTime()); }
function formatTime(iso){
  const d = parseISO(iso);
  if(!isValidDate(d)) return null;
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

/**
 * 行全体をclick/Space/Enterでトグル可能なチェック行（AX対応）
 * props: { task: {id, name, completed, remindAt?, link?}, onToggle: () => void }
 */
export default function TaskRow({ task, onToggle }) {
  const completed = !!task.completed;
  const timeLabel = task.remindAt ? formatTime(task.remindAt) : null;
  const titleId = `task-title-${task.id}`;

  const handleKeyDown = useCallback((e) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      onToggle?.();
    }
  }, [onToggle]);

  return (
    <div
      role="checkbox"
      aria-checked={completed}
      aria-labelledby={titleId}
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={handleKeyDown}
      className="flex items-start gap-3 bg-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-md"
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
          {task.name}
        </div>
        {timeLabel ? <div className="text-xs text-muted-foreground mt-1">{timeLabel}</div> : null}
      </div>

      {task.link ? <span className="ml-2 text-sm text-muted-foreground" aria-hidden="true">↗︎</span> : null}
    </div>
  );
}