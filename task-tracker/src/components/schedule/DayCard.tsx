"use client";
import DateBadge from "./DateBadge";
import { ReactNode } from "react";

// Local helpers
function parseISO(v: string): Date { 
  return v ? new Date(v) : new Date(NaN); 
}

function isValidDate(d: Date): boolean { 
  return d instanceof Date && !Number.isNaN(d.getTime()); 
}

function formatJPFullDate(iso: string): string {
  const d = parseISO(iso);
  if (!isValidDate(d)) return iso;
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

interface DayCardProps {
  date: string;
  todos: any[];
  children: ReactNode;
}

/**
 * 1日分のカード（左上バッジ＋タスクUL）
 */
export default function DayCard({ date, todos, children }: DayCardProps) {
  const today = new Date().toISOString().split('T')[0];
  const isToday = date === today;
  
  return (
    <div
      className={`relative rounded-2xl border shadow-sm border-border/60 ${isToday ? 'bg-slate-200' : 'bg-card'}`}
      role="region"
      aria-label={formatJPFullDate(date)}
    >
      {/* バッジ：カード左端ぴったり・今日だけ強調 */}
      <DateBadge
        iso={date}
        aria-hidden="true"
        className={`absolute left-0 -top-3 h-10 w-10 shadow-md flex items-center justify-center text-sm rounded-full ${
          isToday
            ? "font-extrabold bg-slate-700 text-white shadow-xl border border-slate-800"
            : "font-bold bg-muted text-foreground/80 border border-border"
        }`}
      />

      {/* タスクリスト（左右揃えはDRAFTに一致） */}
      <ul className="px-4 pt-8 pb-4 grid gap-2">{children}</ul>
    </div>
  );
}
