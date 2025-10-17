// src/app/page.js
"use client";

// =============================
// Imports
// =============================
import { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import SectionCard from "@/components/SectionCard";
import DayCard from "@/components/schedule/DayCard";
import TaskRow from "@/components/schedule/TaskRow";
import { CheckCircle, Circle, Pencil } from "lucide-react";
import { getNotificationPermission, requestNotificationPermission as reqNotifPerm, scheduleTaskReminders } from "@/lib/notification";

// =============================
// Constants
// =============================
const STORAGE_KEY = "todos";

// =============================
// Date / Grouping Utilities
// =============================
function parseISO(v) { if (!v) return new Date(NaN); return new Date(v); }
function isValidDate(d) { return d instanceof Date && !Number.isNaN(d.getTime()); }
function formatISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function formatJPYearMonth(ym) { const [, m] = ym.split("-"); return `${Number(m)}月`; }
function formatTime(isoLike) { const d = parseISO(isoLike); if (!isValidDate(d)) return null; const hh = String(d.getHours()).padStart(2, "0"); const mm = String(d.getMinutes()).padStart(2, "0"); return `${hh}:${mm}`; }
function formatDateJP(iso) { const d = parseISO(iso); if (!isValidDate(d)) return null; return `${d.getMonth() + 1}/${d.getDate()}`; }
function isSameYMD(a, b) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
function isTodayISO(iso) { const d = parseISO(iso); if (!isValidDate(d)) return false; return isSameYMD(d, new Date()); }
function isPastISO(iso) { const d = parseISO(iso); if (!isValidDate(d)) return false; return d.getTime() < Date.now(); }
function groupByMonth(items) {
  const map = new Map();
  for (const t of items) {
    const d = parseISO(t.remindAt);
    if (!isValidDate(d)) continue;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(t);
  }
  return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
}
function groupByDate(items) {
  const map = new Map();
  for (const t of items) {
    const d = parseISO(t.remindAt);
    if (!isValidDate(d)) continue;
    const key = formatISODate(d);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(t);
  }
  return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
}

// ---- Timezone-safe helpers ----
// 'YYYY-MM-DDTHH:mm' (datetime-local) -> ISO(UTC)
function localDatetimeToISO(local) {
  if (!local) return null;
  const d = new Date(local); // interpret as local time in the browser
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}
// ISO -> 'YYYY-MM-DDTHH:mm' in user's local time (for <input type="datetime-local" />)
function isoToLocalDatetime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hh = pad(d.getHours());
  const mm = pad(d.getMinutes());
  return `${y}-${m}-${day}T${hh}:${mm}`;
}
// migrate old todos that kept 'YYYY-MM-DDTHH:mm' (no TZ) into ISO once
function migrateTodosToISO(list) {
  const localRe = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/; // no timezone
  return Array.isArray(list)
    ? list.map((t) => {
        if (t?.remindAt && typeof t.remindAt === "string" && localRe.test(t.remindAt)) {
          const iso = localDatetimeToISO(t.remindAt);
          return { ...t, remindAt: iso };
        }
        return t;
      })
    : list;
}

// =============================
// Page Component
// =============================
export default function Home() {
  const [todos, setTodos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notifPermission, setNotifPermission] = useState(
    typeof window !== "undefined" ? getNotificationPermission() : "default"
  );
  const todoNameRef = useRef(null);
  const remindAtRef = useRef(null);
  const reminderControllerRef = useRef(null);

  const stats = useMemo(() => {
    const total = todos.length;
    const completed = todos.filter((t) => t.completed).length;
    const remaining = total - completed;
    const rate = total === 0 ? 0 : Math.round((completed / total) * 100);
    return { total, completed, remaining, rate };
  }, [todos]);

  const drafts = useMemo(() => todos.filter((t) => !t.remindAt), [todos]);
  const scheduled = useMemo(() => todos.filter((t) => !!t.remindAt), [todos]);
  const scheduledByMonth = useMemo(() => groupByMonth(scheduled), [scheduled]);
  const todayKey = useMemo(() => formatISODate(new Date()), []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const migrated = migrateTodosToISO(parsed);
        setTodos(migrated);
        if (JSON.stringify(parsed) !== JSON.stringify(migrated)) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
        }
      }
    } catch (err) {
      console.error("ローカルストレージからの読み込みに失敗しました:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    } catch (err) {
      console.error("ローカルストレージへの保存に失敗しました:", err);
    }
  }, [todos]);

  // 通知権限の最新状態を同期
  useEffect(() => {
    setNotifPermission(getNotificationPermission());
  }, []);

  // リマインドのスケジューリング
  useEffect(() => {
    reminderControllerRef.current?.clear?.();
    reminderControllerRef.current = scheduleTaskReminders(todos, (title, body) => {
      try { alert(`${title} (リマインド: ${body})`); } catch (_) {}
    });
    return () => { reminderControllerRef.current?.clear?.(); };
  }, [todos]);

  const handleEditTodo = async (id, payload) => {
    try {
      const response = await fetch("/api/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...payload }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.error || "タスクの更新に失敗しました");
        return false;
      }
      const updated = await response.json();
      setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, ...updated } : t)));
      return true;
    } catch (error) {
      console.error("タスクの更新に失敗しました:", error);
      alert("タスクの更新に失敗しました");
      return false;
    }
  };

  const requestNotificationPermission = async () => {
    const result = await reqNotifPerm();
    setNotifPermission(result);
    if (result === "unsupported") {
      alert("このブラウザは通知に対応していません");
    } else if (result !== "granted") {
      alert("通知を有効化できませんでした");
    }
  };

  const handleAddTodo = async () => {
    const name = todoNameRef.current?.value?.trim();
    const rawRemind = remindAtRef.current?.value || null; // 'YYYY-MM-DDTHH:mm'
    const remindAt = rawRemind ? localDatetimeToISO(rawRemind) : null; // ISO(UTC)
    if (!name) return;
    try {
      const response = await fetch("/api/create", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, remindAt }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.error || "タスクの追加に失敗しました");
        return;
      }
      const addedTask = await response.json();
      setTodos((prev) => [...prev, addedTask]);
      if (todoNameRef.current) todoNameRef.current.value = "";
      if (remindAtRef.current) remindAtRef.current.value = "";
    } catch (error) {
      console.error("タスクの追加に失敗しました:", error);
      alert("タスクの追加に失敗しました");
    }
  };

  const handleDeleteTodo = async (id) => {
    try {
      const response = await fetch("/api/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.error || "タスクの削除に失敗しました");
        return;
      }
      setTodos((prev) => prev.filter((t) => t.id !== id));
    } catch (error) {
      console.error("タスクの削除に失敗しました:", error);
      alert("タスクの削除に失敗しました");
    }
  };

  const toggleTodo = (id) => {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  };
  const handleClear = () => { setTodos((prev) => prev.filter((t) => !t.completed)); };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen text-muted-foreground">読み込み中...</div>;
  }

  return (
    <div className="min-h-dvh bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-card/60 backdrop-blur">
        <div className="mx-auto max-w-[1200px] px-6 h-16 flex items-center justify-between">
          <h1 className="text-lg sm:text-xl font-semibold tracking-tight">Tasktracker</h1>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => todoNameRef.current?.focus()}>新規タスク</Button>
            <Button size="sm" variant="outline" onClick={handleClear}>完了タスク削除</Button>
            {typeof Notification !== "undefined" && notifPermission !== "granted" ? (
              <Button size="sm" variant="secondary" onClick={requestNotificationPermission}>
                通知を有効化
              </Button>
            ) : null}
          </div>
        </div>
      </header>

      {/* Page container: sidebar + content */}
      <main className="mx-auto max-w-[1200px] px-6 py-8 grid gap-8 grid-cols-1 lg:grid-cols-[320px_1fr]">
        {/* LEFT COLUMN */}
        <aside className="grid gap-4 self-start lg:sticky lg:top-24">
          <SectionCard title="DRAFT">
            {drafts.length === 0 ? (
              <EmptyRow label="ドラフトはありません" />
            ) : (
              <ul className="grid gap-2.5 pl-4">
                {drafts.map((t) => (
                  <TaskRow key={t.id} task={t} onToggle={() => toggleTodo(t.id)} />
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard title="SCHEDULED" collapsible>
            {scheduledByMonth.length === 0 ? (
              <EmptyRow label="予定されたタスクはありません" />
            ) : (
              <div className="grid gap-6">
                {scheduledByMonth.map(([ym, list]) => (
                  <div key={ym} className="grid gap-6">
                    <MonthSeparator ym={ym} />
                    {groupByDate(list).map(([dateKey, dayList]) => (
                      <DayCard key={dateKey} dateKey={dateKey} todayKey={todayKey}>
                        {[...dayList]
                          .sort((a, b) => {
                            const da = parseISO(a.remindAt);
                            const db = parseISO(b.remindAt);
                            const ta = isValidDate(da) ? da.getTime() : Number.POSITIVE_INFINITY;
                            const tb = isValidDate(db) ? db.getTime() : Number.POSITIVE_INFINITY;
                            return ta - tb; // 早い時刻が上に
                          })
                          .map((t) => (
                            <li key={t.id}>
                              <div
                                className="rounded-lg bg-transparent py-2 transition-colors"
                                style={dateKey === todayKey ? { "--background": "214 32% 91%" } : undefined}
                              >
                                <TaskRow task={t} onToggle={() => toggleTodo(t.id)} />
                              </div>
                            </li>
                          ))}
                      </DayCard>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </aside>

        {/* RIGHT CONTENT */}
        <div className="grid gap-8">
          {/* Summary cards */}
          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            <SummaryCard label="今日の達成" value={`${stats.completed}/${stats.total}`} rate={stats.rate} />
            <SummaryCard label="残タスク" value={`${stats.remaining} 件`} />
            <SummaryCard label="達成率" value={`${stats.rate}%`} rate={stats.rate} />
          </section>

          {/* Todo list (full list) — 絵文字なしで時刻表示 */}
          <section className="grid gap-4">
            <Card className="p-5 shadow-md">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold tracking-tight">タスクリスト</h2>
              </div>
              <ul className="grid gap-2.5">
                {todos.map((t) => (
                  <li key={t.id} className="rounded-lg bg-transparent py-2 transition-colors">
                    <TaskRowWithDate
                      task={t}
                      onToggle={() => toggleTodo(t.id)}
                      onDelete={() => handleDeleteTodo(t.id)}
                      onEdit={(payload) => handleEditTodo(t.id, payload)}
                    />
                  </li>
                ))}
              </ul>
            </Card>

            {/* Add form */}
            <Card className="p-5 shadow-md">
              <form
                onSubmit={(e) => { e.preventDefault(); handleAddTodo(); }}
                className="grid gap-5"
              >
                <div className="grid gap-3 sm:grid-cols-[1fr_260px] items-start">
                  <div className="grid gap-1">
                    <label htmlFor="todoTitle" className="sr-only">タスク名</label>
                    <Input id="todoTitle" ref={todoNameRef} placeholder="タスク名を入力" className="w-full" />
                  </div>
                  <div className="grid gap-1">
                    <label htmlFor="remindAt" className="sr-only">リマインド日時（任意）</label>
                    <Input id="remindAt" ref={remindAtRef} type="datetime-local" placeholder="リマインド日時（任意）" className="w-full" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button type="submit" className="font-semibold">タスクを追加</Button>
                  <span className="text-sm text-muted-foreground">未完了: {stats.remaining} 件</span>
                </div>
              </form>
            </Card>
          </section>
        </div>
      </main>
    </div>
  );
}

// =============================
// Presentational bits (小物はここに）
// =============================
function TaskRowWithDate({ task, onToggle, onDelete, onEdit }) {
  const completed = !!task.completed;
  const hasRemind = !!task.remindAt;
  const timeLabel = hasRemind ? formatTime(task.remindAt) : null;
  const isToday = hasRemind ? isTodayISO(task.remindAt) : false;
  const isOverdue = hasRemind ? isPastISO(task.remindAt) && !completed : false;
  const dateLabel = hasRemind ? (isToday ? "今日" : formatDateJP(task.remindAt)) : null;
  const secondaryLabel = timeLabel ? (dateLabel ? `${dateLabel} ${timeLabel}` : timeLabel) : null;

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(task.name || "");
  const [editRemindAt, setEditRemindAt] = useState(task.remindAt ? isoToLocalDatetime(task.remindAt) : "");

  const submitEdit = async () => {
    if (!onEdit) { setIsEditing(false); return; }
    const payload = {};
    if (editName !== task.name) payload.name = editName.trim();
    const baseline = task.remindAt ? isoToLocalDatetime(task.remindAt) : "";
    if (editRemindAt !== baseline) payload.remindAt = editRemindAt ? localDatetimeToISO(editRemindAt) : null;
    const ok = await onEdit(payload);
    if (ok) setIsEditing(false);
  };

  return (
    <div
      role="checkbox"
      aria-checked={completed}
      aria-labelledby={`task-title-${task.id}`}
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); onToggle?.(); } }}
      className="flex items-start gap-3 rounded-md cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      {completed ? (
        <CheckCircle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" strokeWidth={2.5} />
      ) : (
        <Circle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-foreground/60" strokeWidth={2.5} />
      )}
      <div className="min-w-0 flex-1">
        {isEditing ? (
          <div className="grid gap-2">
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="タスク名"
              className="h-8"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="grid gap-2 sm:grid-cols-[220px_auto] items-center">
              <Input
                type="datetime-local"
                value={editRemindAt}
                onChange={(e) => setEditRemindAt(e.target.value)}
                className="h-8"
                onClick={(e) => e.stopPropagation()}
              />
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={(e) => { e.stopPropagation(); submitEdit(); }}>保存</Button>
                <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setIsEditing(false); setEditName(task.name || ""); setEditRemindAt(task.remindAt ? isoToLocalDatetime(task.remindAt) : ""); }}>キャンセル</Button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div id={`task-title-${task.id}`} className={`truncate text-[15px] ${completed ? 'font-bold text-emerald-600 line-through decoration-emerald-600/80 decoration-[1.5px]' : 'font-medium'}`}>{task.name}</div>
            {secondaryLabel ? (
              <div className={`text-xs mt-1 ${isOverdue ? 'text-destructive' : 'text-muted-foreground'}`}>{secondaryLabel}</div>
            ) : null}
          </>
        )}
      </div>
      <div className="flex items-center gap-2 ml-2">
        {task.link ? <span className="text-sm text-muted-foreground" aria-hidden="true">↗︎</span> : null}
        {typeof onEdit === "function" && !isEditing ? (
          <button
            type="button"
            className="h-7 w-7 inline-flex items-center justify-center rounded border border-border text-muted-foreground hover:bg-muted"
            onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
            aria-label="タスクを編集"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        ) : null}
        {typeof onDelete === "function" ? (
          <button
            type="button"
            className="text-xs px-2 py-1 rounded border border-border text-muted-foreground hover:bg-muted"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            aria-label="タスクを削除"
          >
            削除
          </button>
        ) : null}
      </div>
    </div>
  );
}
function SummaryCard({ label, value, rate }) {
  const now = Math.min(Math.max(typeof rate === "number" ? rate : 0, 0), 100);
  return (
    <Card className="p-5 shadow-md">
      <div className="text-sm text-muted-foreground mb-3">{label}</div>
      <div className="text-3xl font-bold tracking-tight">{value}</div>
      {typeof rate === "number" ? (
        <div className="mt-4">
          <div
            className="h-2 w-full rounded-full bg-muted/70 overflow-hidden"
            role="progressbar"
            aria-label={`${label}の進捗`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={now}
          >
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${now}%` }} />
          </div>
        </div>
      ) : null}
    </Card>
  );
}

function EmptyRow({ label }) { return <div className="text-xs text-muted-foreground px-1 py-1">{label}</div>; }
function MonthSeparator({ ym }) {
  const label = formatJPYearMonth(ym);
  return (
    <div className="flex items-center gap-3 px-1 text-xs text-muted-foreground" aria-hidden="true">
      <div className="flex-1 h-px bg-border" />
      <div className="shrink-0 font-semibold tracking-wide">{label}</div>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}