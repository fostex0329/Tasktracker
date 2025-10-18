// src/app/page.js
"use client";

// =============================
// Imports
// =============================
import { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import TimePickerField from "@/components/inputs/TimePickerField";
import SectionCard from "@/components/SectionCard";
import DayCard from "@/components/schedule/DayCard";
import TaskRow from "@/components/schedule/TaskRow";
import { CheckCircle, Circle, Pencil, X, CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { getNotificationPermission, requestNotificationPermission as reqNotifPerm, scheduleTaskReminders } from "@/lib/notification";

// =============================
// Constants
// =============================
const STORAGE_KEY = "todos";
const NOTE_MAX_LENGTH = 280;

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
function formatReadableDateLabel(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
  try {
    return date.toLocaleDateString("ja-JP", { dateStyle: "medium", weekday: "short" });
  } catch (error) {
    return date.toLocaleDateString("ja-JP");
  }
}
function normalizeNote(note) {
  if (typeof note !== "string") return "";
  return note.trim().slice(0, NOTE_MAX_LENGTH);
}
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
        if (!t || typeof t !== "object") return t;
        let remindAt = t.remindAt;
        if (remindAt && typeof remindAt === "string" && localRe.test(remindAt)) {
          const iso = localDatetimeToISO(remindAt);
          remindAt = iso || remindAt;
        }
        const normalized = { ...t, remindAt };
        if (normalized.remindAt) {
          if (normalized.remindHasTime === undefined) {
            normalized.remindHasTime = true;
          }
        } else {
          delete normalized.remindHasTime;
        }
        const sanitizedNote = normalizeNote(typeof normalized.note === "string" ? normalized.note : "");
        if (sanitizedNote) {
          normalized.note = sanitizedNote;
        } else {
          delete normalized.note;
        }
        return normalized;
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
  const noteRef = useRef(null);
  const reminderControllerRef = useRef(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState("");
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

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
  const [todayKey, setTodayKey] = useState(null);
  const [tomorrowKey, setTomorrowKey] = useState(null);
  const [todayStart, setTodayStart] = useState(null);
  const essentialDateKeys = useMemo(() => [todayKey, tomorrowKey], [todayKey, tomorrowKey]);
  const scheduledCalendar = useMemo(() => {
    const monthMap = new Map(scheduledByMonth.map(([ym, list]) => [ym, list]));
    essentialDateKeys.forEach((dateKey) => {
      if (!dateKey) return;
      const ym = dateKey.slice(0, 7);
      if (!monthMap.has(ym)) {
        monthMap.set(ym, []);
      }
    });
    return Array.from(monthMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [scheduledByMonth, essentialDateKeys]);

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
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(start);
    tomorrow.setDate(tomorrow.getDate() + 1);
    setTodayKey(formatISODate(now));
    setTomorrowKey(formatISODate(tomorrow));
    setTodayStart(start);
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
      setTodos((prev) =>
        prev.map((t) => {
          if (t.id !== id) return t;
          const next = { ...t, ...updated };
          if (payload && Object.prototype.hasOwnProperty.call(payload, "remindHasTime")) {
            if (payload.remindHasTime) {
              next.remindHasTime = true;
            } else {
              delete next.remindHasTime;
            }
          } else if (payload && Object.prototype.hasOwnProperty.call(payload, "remindAt")) {
            if (payload.remindAt) {
              next.remindHasTime = true;
            } else {
              delete next.remindHasTime;
            }
          }
          if (Object.prototype.hasOwnProperty.call(updated, "note")) {
            if (updated.note) {
              next.note = updated.note;
            } else {
              delete next.note;
            }
          }
          return next;
        })
      );
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

  const resetScheduleInputs = () => {
    setSelectedDate(null);
    setSelectedTime("");
    setIsDatePickerOpen(false);
  };

  const handleAddTodo = async () => {
    const name = todoNameRef.current?.value?.trim();
    if (!name) return;

    const rawNoteValue = noteRef.current?.value ?? "";
    const trimmedNote = typeof rawNoteValue === "string" ? rawNoteValue.trim() : "";
    if (trimmedNote.length > NOTE_MAX_LENGTH) {
      alert(`メモは${NOTE_MAX_LENGTH}文字以内で入力してください`);
      return;
    }

    const dateValue = selectedDate instanceof Date && !Number.isNaN(selectedDate?.getTime()) ? selectedDate : null;
    const timeValue = typeof selectedTime === "string" ? selectedTime.trim() : "";

    let remindAt = null;
    let remindHasTime;
    if (dateValue) {
      const localDatePart = formatISODate(dateValue);
      const timePart = timeValue || "00:00";
      const iso = localDatetimeToISO(`${localDatePart}T${timePart}`);
      if (!iso) {
        alert("日付または時刻が無効です");
        return;
      }
      remindAt = iso;
      remindHasTime = Boolean(timeValue);
    }

    try {
      const response = await fetch("/api/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          remindAt,
          note: trimmedNote.length > 0 ? trimmedNote : null,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.error || "タスクの追加に失敗しました");
        return;
      }
      const addedTask = await response.json();
      const annotatedTask =
        remindHasTime === undefined ? addedTask : { ...addedTask, remindHasTime };
      if (annotatedTask.note === null || annotatedTask.note === undefined) {
        delete annotatedTask.note;
      }
      setTodos((prev) => [...prev, annotatedTask]);
      if (todoNameRef.current) todoNameRef.current.value = "";
      if (noteRef.current) noteRef.current.value = "";
      resetScheduleInputs();
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
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 h-16 flex items-center justify-between min-w-0">
          <h1 className="text-lg sm:text-xl font-semibold tracking-tight truncate">YOHAKU</h1>
          <div className="flex items-center gap-1 sm:gap-2 min-w-0">
            <Button size="sm" onClick={() => todoNameRef.current?.focus()} className="hidden sm:inline-flex">新規タスク</Button>
            <Button size="sm" variant="outline" onClick={handleClear} className="text-xs sm:text-sm">完了削除</Button>
            {typeof Notification !== "undefined" && notifPermission !== "granted" ? (
              <Button size="sm" variant="secondary" onClick={requestNotificationPermission} className="text-xs sm:text-sm">
                通知
              </Button>
            ) : null}
          </div>
        </div>
      </header>

      {/* Page container: sidebar + content */}
      <main className="mx-auto max-w-[1200px] px-4 sm:px-6 py-8 grid gap-6 lg:gap-8 grid-cols-1 lg:grid-cols-[minmax(320px,400px)_1fr]">
        {/* LEFT COLUMN */}
        <aside className="grid gap-4 self-start lg:sticky lg:top-24 min-w-0">
          <SectionCard title="Inbox">
            {drafts.length === 0 ? (
              <EmptyRow label="Inboxはありません" />
            ) : (
              <ul className="grid gap-2.5 pl-4 min-w-0">
                {drafts.map((t) => (
                          <TaskRow
                    key={t.id} 
                    task={t} 
                    onToggle={() => toggleTodo(t.id)}
                    onEdit={() => handleEditTodo(t.id, {})}
                    onDelete={() => handleDeleteTodo(t.id)}
                  />
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard title="Scheduled" collapsible>
            <div className="grid gap-6 min-w-0">
              {scheduledCalendar.map(([ym, list]) => {
                const groupedDays = groupByDate(list).map(([dateKey, dayList]) => ({
                  dateKey,
                  tasks: [...dayList].sort((a, b) => {
                    const da = parseISO(a.remindAt);
                    const db = parseISO(b.remindAt);
                    const ta = isValidDate(da) ? da.getTime() : Number.POSITIVE_INFINITY;
                    const tb = isValidDate(db) ? db.getTime() : Number.POSITIVE_INFINITY;
                    return ta - tb;
                  }),
                }));

                essentialDateKeys
                  .filter((dateKey) => dateKey && dateKey.slice(0, 7) === ym)
                  .forEach((dateKey) => {
                    if (!groupedDays.some((entry) => entry.dateKey === dateKey)) {
                      groupedDays.push({ dateKey, tasks: [] });
                    }
                  });

                groupedDays.sort((a, b) => a.dateKey.localeCompare(b.dateKey));

                return (
                  <div key={ym} className="grid gap-6 min-w-0">
                    <MonthSeparator ym={ym} />
                    {groupedDays.map(({ dateKey, tasks }) => (
                      <DayCard key={dateKey} dateKey={dateKey} todayKey={todayKey}>
                        {tasks.length > 0 ? (
                          tasks.map((t) => (
                            <li key={t.id} className="min-w-0">
                              <div
                                className="rounded-lg bg-transparent transition-colors min-w-0"
                                style={dateKey === todayKey ? { "--background": "214 32% 91%" } : undefined}
                              >
                                <TaskRow
                                  task={t}
                                  onToggle={() => toggleTodo(t.id)}
                                  onEdit={() => handleEditTodo(t.id, {})}
                                  onDelete={() => handleDeleteTodo(t.id)}
                                />
                              </div>
                            </li>
                          ))
                        ) : (
                          <EmptyScheduledPlaceholder
                            dateKey={dateKey}
                            todayKey={todayKey}
                            tomorrowKey={tomorrowKey}
                          />
                        )}
                      </DayCard>
                    ))}
                  </div>
                );
              })}
            </div>
          </SectionCard>
        </aside>

        {/* RIGHT CONTENT */}
        <div className="grid gap-6 lg:gap-8 min-w-0">
          {/* Summary cards */}
          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            <SummaryCard label="今日の達成" value={`${stats.completed}/${stats.total}`} rate={stats.rate} />
            <SummaryCard label="残タスク" value={`${stats.remaining} 件`} />
            <SummaryCard label="達成率" value={`${stats.rate}%`} rate={stats.rate} />
          </section>

          {/* Todo list (full list) — 絵文字なしで時刻表示 */}
          <section className="grid gap-4 min-w-0">
            <Card className="p-4 sm:p-5 shadow-md min-w-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold tracking-tight">タスクリスト</h2>
              </div>
              <ul className="grid gap-2.5 min-w-0">
                {todos.map((t) => (
                  <li key={t.id} className="rounded-lg bg-transparent transition-colors min-w-0">
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
            <Card className="p-4 sm:p-5 shadow-md min-w-0">
              <form
                onSubmit={(e) => { e.preventDefault(); handleAddTodo(); }}
                className="grid gap-4 sm:gap-5 min-w-0"
              >
                <div className="grid gap-3 min-w-0">
                  <div className="grid gap-3 min-w-0">
                    <div className="grid gap-1 min-w-0">
                      <label htmlFor="todoTitle" className="sr-only">タスク名</label>
                      <Input id="todoTitle" ref={todoNameRef} placeholder="タスク名を入力" className="w-full font-semibold" />
                    </div>
                    <div className="grid gap-1 min-w-0">
                      <label htmlFor="todoNote" className="sr-only">メモ（任意）</label>
                      <textarea
                        id="todoNote"
                        ref={noteRef}
                        placeholder={`メモ（任意・最大${NOTE_MAX_LENGTH}文字）`}
                        maxLength={NOTE_MAX_LENGTH}
                        className="w-full resize-y rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background min-h-[64px]"
                      />
                      <span className="text-xs text-muted-foreground">最大 {NOTE_MAX_LENGTH} 文字まで入力できます</span>
                    </div>
                  </div>
                  <div className="grid gap-3 min-w-0 sm:grid-cols-[minmax(0,1fr)_160px] lg:grid-cols-[minmax(0,1fr)_200px]">
                    <div className="grid gap-1 min-w-0">
                      <label htmlFor="remindDateButton" className="sr-only">リマインド日（任意）</label>
                      <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            id="remindDateButton"
                            type="button"
                            variant="outline"
                            className={cn(
                              "h-10 w-full justify-start text-left font-normal",
                              !selectedDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {selectedDate ? formatReadableDateLabel(selectedDate) : "日付を選択"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={selectedDate ?? undefined}
                            onSelect={(date) => {
                              if (!date) {
                                setSelectedDate(null);
                                setSelectedTime("");
                                return;
                              }
                              const normalized = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                              setSelectedDate(normalized);
                              setIsDatePickerOpen(false);
                            }}
                            disabled={(date) => {
                              if (!date || !todayStart) return false;
                              return date < todayStart;
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="grid gap-1 min-w-0">
                      <label htmlFor="remindTime" className="sr-only">リマインド時刻（任意）</label>
                      <TimePickerField
                        value={selectedTime}
                        onChange={setSelectedTime}
                        disabled={!selectedDate}
                        className="h-10"
                        placeholder="時刻を選択"
                        minutesStep={5}
                        inputId="remindTime"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2 min-w-0 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                    <Button type="submit" className="font-semibold w-full sm:w-auto">タスクを追加</Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={resetScheduleInputs}
                      className="w-full text-xs sm:w-auto sm:text-sm"
                      disabled={!selectedDate && !selectedTime}
                    >
                      日付をクリア
                    </Button>
                  </div>
                  <span className="text-sm text-muted-foreground sm:ml-auto">未完了: {stats.remaining} 件</span>
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
  const timeLabelRaw = hasRemind ? formatTime(task.remindAt) : null;
  const hasExplicitTime = hasRemind ? task.remindHasTime !== false : false;
  const isToday = hasRemind ? isTodayISO(task.remindAt) : false;
  const isOverdue = hasRemind
    ? (() => {
        if (!hasExplicitTime && isToday) return false;
        return isPastISO(task.remindAt) && !completed;
      })()
    : false;
  const dateLabel = hasRemind ? (isToday ? "今日" : formatDateJP(task.remindAt)) : null;
  const showTime = hasRemind && hasExplicitTime && !!timeLabelRaw;
  const secondaryLabel = hasRemind
    ? showTime
      ? (dateLabel ? `${dateLabel} ${timeLabelRaw}` : timeLabelRaw)
      : dateLabel
    : null;
  const noteText = typeof task.note === "string" ? task.note.trim() : "";
  const hasNote = noteText.length > 0;

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(task.name || "");
  const baseRemindValue =
    task.remindAt && task.remindHasTime !== false ? isoToLocalDatetime(task.remindAt) : "";
  const [editRemindAt, setEditRemindAt] = useState(baseRemindValue);
  const [editNote, setEditNote] = useState(task.note || "");

  const submitEdit = async () => {
    if (!onEdit) { setIsEditing(false); return; }
    const payload = {};
    if (editName !== task.name) payload.name = editName.trim();
    const baseline = baseRemindValue;
    if (editRemindAt !== baseline) {
      payload.remindAt = editRemindAt ? localDatetimeToISO(editRemindAt) : null;
      payload.remindHasTime = Boolean(editRemindAt);
    }
    const trimmedNote = editNote.trim();
    if (trimmedNote.length > NOTE_MAX_LENGTH) {
      alert(`メモは${NOTE_MAX_LENGTH}文字以内で入力してください`);
      return;
    }
    const originalNote = task.note || "";
    if (trimmedNote !== originalNote) {
      payload.note = trimmedNote.length > 0 ? trimmedNote : null;
    }
    const ok = await onEdit(payload);
    if (ok) setIsEditing(false);
  };

  const iconClassName = cn(
    "h-5 w-5 shrink-0",
    completed ? "text-emerald-600" : isOverdue ? "text-destructive" : "text-foreground"
  );

  const titleClassName = `truncate text-[15px] ${
    completed
      ? "font-bold text-emerald-600 line-through decoration-emerald-600/80 decoration-[1.5px]"
      : `font-semibold${isOverdue ? " text-destructive" : ""}`
  }`;

  return (
    <div
      role="checkbox"
      aria-checked={completed}
      aria-labelledby={`task-title-${task.id}`}
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); onToggle?.(); } }}
      className="group flex flex-col gap-1 rounded-md cursor-pointer select-none px-3 py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background min-w-0 hover:bg-muted/50 transition-colors"
    >
      <div className={`flex gap-3 ${isEditing ? "items-start" : "items-center"}`}>
        {completed ? (
          <CheckCircle aria-hidden="true" className={iconClassName} strokeWidth={2} />
        ) : (
          <Circle aria-hidden="true" className={iconClassName} strokeWidth={2} />
        )}
        <div className="min-w-0 flex-1 overflow-hidden">
          {isEditing ? (
            <div className="grid gap-3">
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="タスク名"
                className="h-8"
                onClick={(e) => e.stopPropagation()}
              />
              <textarea
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                maxLength={NOTE_MAX_LENGTH}
                placeholder={`メモ（任意・最大${NOTE_MAX_LENGTH}文字）`}
                className="w-full resize-y rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background min-h-[64px]"
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
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditing(false);
                      setEditName(task.name || "");
                      setEditRemindAt(baseRemindValue);
                      setEditNote(task.note || "");
                    }}
                  >
                    キャンセル
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div
              id={`task-title-${task.id}`}
              className={titleClassName}
              title={task.name}
            >
              {task.name}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 ml-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {task.link ? <span className="text-sm text-muted-foreground" aria-hidden="true">↗︎</span> : null}
          {typeof onEdit === "function" && !isEditing ? (
            <button
              type="button"
              className="h-8 w-8 inline-flex items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
                setEditName(task.name || "");
                setEditRemindAt(baseRemindValue);
                setEditNote(task.note || "");
              }}
              aria-label="タスクを編集"
            >
              <Pencil className="h-4 w-4" aria-hidden="true" />
            </button>
          ) : null}
          {typeof onDelete === "function" ? (
            <button
              type="button"
              className="h-8 w-8 inline-flex items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground shrink-0"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              aria-label="タスクを削除"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </div>
      {hasNote ? (
        <div className="pl-8 text-sm text-muted-foreground/90 whitespace-pre-wrap break-words">{noteText}</div>
      ) : null}
      {!isEditing && secondaryLabel ? (
        <div className={`pl-8 text-xs truncate ${isOverdue ? "text-destructive" : "text-muted-foreground"}`}>{secondaryLabel}</div>
      ) : null}
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
function EmptyScheduledPlaceholder({ dateKey, todayKey, tomorrowKey }) {
  const label =
    dateKey === todayKey
      ? "今日の予定はありません"
      : dateKey === tomorrowKey
        ? "明日の予定はありません"
        : "予定はありません";
  return (
    <li className="min-w-0">
      <div className="rounded-lg bg-transparent py-6 text-center text-xs text-muted-foreground">
        {label}
      </div>
    </li>
  );
}
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
