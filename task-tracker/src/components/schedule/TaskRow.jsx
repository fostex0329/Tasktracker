"use client";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { CheckCircle, Circle, Pencil, X, NotebookPen, CalendarIcon } from "lucide-react";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import TimePickerField from "@/components/inputs/TimePickerField";
import { cn } from "@/lib/utils";

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
 function isSameYMD(a, b){
   return a.getFullYear() === b.getFullYear()
     && a.getMonth() === b.getMonth()
     && a.getDate() === b.getDate();
 }
 function isTodayISO(iso){
   const d = parseISO(iso);
   if(!isValidDate(d)) return false;
   return isSameYMD(d, new Date());
 }
function isPastISO(iso){
   const d = parseISO(iso);
   if(!isValidDate(d)) return false;
   return d.getTime() < Date.now();
}
function formatReadableDateLabel(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
  try {
    return date.toLocaleDateString("ja-JP", { dateStyle: "medium", weekday: "short" });
  } catch (error) {
    return date.toLocaleDateString("ja-JP");
  }
}
function formatISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function localDatetimeToISO(local) {
  if (!local) return null;
  const d = new Date(local);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}
function getNearestFutureTime(stepMinutes = 5) {
  const now = new Date();
  const minutes = now.getMinutes();
  const remainder = minutes % stepMinutes;
  if (remainder !== 0) {
    now.setMinutes(minutes + (stepMinutes - remainder));
  }
  now.setSeconds(0, 0);
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(now.getHours())}:${pad(now.getMinutes())}`;
}
const NOTE_MAX_LENGTH = 280;

function autoResizeTextArea(element) {
  if (!element) return;
  element.style.height = "auto";
  element.style.height = `${element.scrollHeight}px`;
}
 
 /**
  * 行全体をclick/Space/Enterでトグル可能なチェック行（AX対応）
  * props: { task: {id, name, completed, remindAt?, link?}, onToggle: () => void, onEdit?: () => void, onDelete?: () => void }
  */
export default function TaskRow({ task, onToggle, onEdit, onDelete }) {
  const completed = !!task.completed;
  const hasRemind = !!task.remindAt;
  const hasExplicitTime = hasRemind && task.remindHasTime !== false;
  const timeLabel = hasExplicitTime ? formatTime(task.remindAt) : null;
  const noteText = typeof task.note === "string" ? task.note.trim() : "";
  const hasNote = noteText.length > 0;
  const titleId = `task-title-${task.id}`;
  const rowId = useMemo(() => `task-note-${task.id}`, [task.id]);
  const [isPeekOpen, setIsPeekOpen] = useState(false);
  const rowRef = useRef(null);
  const editNameRef = useRef(null);
  const editNoteRef = useRef(null);
  const baseReminderDate = useMemo(() => {
    if (!task.remindAt) return null;
    const parsed = parseISO(task.remindAt);
    if (!isValidDate(parsed)) return null;
    return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  }, [task.remindAt]);
  const baseReminderTime = useMemo(() => {
    if (!hasRemind || !hasExplicitTime) return "";
    return formatTime(task.remindAt) || "";
  }, [hasRemind, hasExplicitTime, task.remindAt]);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(task.name || "");
  const [editDate, setEditDate] = useState(baseReminderDate);
  const [editTime, setEditTime] = useState(baseReminderTime);
  const [editNote, setEditNote] = useState(task.note || "");
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const isToday = hasRemind ? isTodayISO(task.remindAt) : false;
  const isOverdue = hasRemind
    ? (() => {
        if (!hasExplicitTime && isToday) return false;
        return isPastISO(task.remindAt) && !completed;
      })()
    : false;

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        onToggle?.();
      }
    },
    [onToggle]
  );

  useEffect(() => {
    const handler = (e) => {
      if (e?.detail?.id !== rowId) {
        setIsPeekOpen(false);
      }
    };
    window.addEventListener("task-note-peek", handler);
    return () => window.removeEventListener("task-note-peek", handler);
  }, [rowId]);

  const togglePeek = (state) => {
    const nextState = typeof state === "boolean" ? state : !isPeekOpen;
    if (nextState) {
      window.dispatchEvent(new CustomEvent("task-note-peek", { detail: { id: rowId } }));
    }
    setIsPeekOpen(nextState);
  };

  const notePreview = hasNote ? noteText : "";

  const iconClassName = cn(
    "h-5 w-5 shrink-0",
    completed ? "text-emerald-600" : isOverdue ? "text-destructive" : "text-foreground/80"
  );

  const resetEditState = useCallback(() => {
    setEditName(task.name || "");
    setEditNote(task.note || "");
    setEditDate(baseReminderDate ? new Date(baseReminderDate) : null);
    setEditTime(baseReminderTime || "");
    setIsDatePickerOpen(false);
    requestAnimationFrame(() => {
      if (editNoteRef.current) autoResizeTextArea(editNoteRef.current);
    });
  }, [task.name, task.note, baseReminderDate, baseReminderTime]);

  const cancelEdit = useCallback(() => {
    setIsEditing(false);
    resetEditState();
  }, [resetEditState]);

  const ensureEditTimeDefault = useCallback(() => {
    if (!editDate) return;
    setEditTime((prev) => {
      const value = typeof prev === "string" ? prev.trim() : "";
      if (value.length > 0) return prev;
      return getNearestFutureTime(5);
    });
  }, [editDate]);

  const clearEditSchedule = useCallback(() => {
    setEditDate(null);
    setEditTime("");
    setIsDatePickerOpen(false);
  }, []);

  const submitEdit = useCallback(async () => {
    if (!onEdit) {
      cancelEdit();
      return;
    }

    const trimmedName = editName.trim();
    if (!trimmedName) {
      alert("タスク名を入力してください");
      return;
    }

    const trimmedNote = editNote.trim();
    if (trimmedNote.length > 280) {
      alert("メモは280文字以内で入力してください");
      return;
    }

    const payload = {};
    if (trimmedName !== task.name) payload.name = trimmedName;

    const baselineISO = task.remindAt || null;
    const dateValue = editDate instanceof Date && !Number.isNaN(editDate?.getTime()) ? editDate : null;
    const timeValue = typeof editTime === "string" ? editTime.trim() : "";

    let nextISO = baselineISO;
    let nextHasTime = hasExplicitTime;

    if (dateValue) {
      const localDatePart = formatISODate(dateValue);
      const timePart = timeValue || "00:00";
      const iso = localDatetimeToISO(`${localDatePart}T${timePart}`);
      if (!iso) {
        alert("日付または時刻が無効です");
        return;
      }
      nextISO = iso;
      nextHasTime = Boolean(timeValue);
    } else {
      nextISO = null;
      nextHasTime = false;
    }

    if (nextISO !== baselineISO) {
      payload.remindAt = nextISO;
    }
    if (nextHasTime !== hasExplicitTime) {
      payload.remindHasTime = nextHasTime;
    }

    if ((task.note || "").trim() !== trimmedNote) {
      payload.note = trimmedNote.length > 0 ? trimmedNote : null;
    }

    if (Object.keys(payload).length === 0) {
      cancelEdit();
      return;
    }

    const ok = await onEdit(payload);
    if (ok) {
      setIsEditing(false);
      setIsDatePickerOpen(false);
    }
  }, [onEdit, cancelEdit, editName, editNote, editDate, editTime, task.name, task.note, task.remindAt, hasExplicitTime]);

  useEffect(() => {
    if (!isEditing) return;
    const handlePointerDown = (event) => {
      const target = event.target;
      if (rowRef.current?.contains(target)) return;
      if (target.closest(`[data-inline-edit-popover="${task.id}"]`)) return;
      if (target.closest(".MuiPickersPopper-root")) return;
      cancelEdit();
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isEditing, cancelEdit, task.id]);

  useLayoutEffect(() => {
    if (!isEditing) return;
    if (editNameRef.current) editNameRef.current.focus({ preventScroll: true });
    if (editNoteRef.current) autoResizeTextArea(editNoteRef.current);
  }, [isEditing, editNote]);

  useEffect(() => {
    if (isEditing) return;
    resetEditState();
  }, [isEditing, resetEditState]);

  const rowClassName = cn(
    "group flex w-full max-w-full cursor-pointer select-none flex-col gap-1 overflow-hidden rounded-md bg-transparent px-3 py-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    isToday ? "hover:bg-slate-300/75 focus-visible:bg-slate-300/75" : "hover:bg-muted/50 focus-visible:bg-muted/60"
  );

  return (
    <Collapsible open={isPeekOpen} onOpenChange={(next) => togglePeek(next)} className="w-full max-w-full">
      <div
        ref={rowRef}
        role="checkbox"
        aria-checked={completed}
        aria-labelledby={titleId}
        tabIndex={0}
        onClick={(e) => {
          if (isEditing) {
            e.preventDefault();
            e.stopPropagation();
            cancelEdit();
            return;
          }
          onToggle?.();
        }}
        onKeyDown={(e) => {
          if (isEditing) {
            if (e.key === "Escape") {
              e.preventDefault();
              cancelEdit();
            }
            return;
          }
          handleKeyDown(e);
        }}
        className={rowClassName}
      >
        <div className={cn("flex w-full gap-2", isEditing ? "items-start" : "items-center") }>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center">
            {completed ? (
              <CheckCircle aria-hidden="true" className={iconClassName} strokeWidth={1.6} />
            ) : (
              <Circle aria-hidden="true" className={iconClassName} strokeWidth={1.6} />
            )}
          </div>
          <div className="min-w-0 flex-1">
            {isEditing ? (
              <div className="grid gap-3" onClick={(e) => e.stopPropagation()}>
                <Input
                  ref={editNameRef}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="タスク名"
                  className="h-9"
                />
                <textarea
                  ref={editNoteRef}
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  maxLength={NOTE_MAX_LENGTH}
                  placeholder={`メモ（任意・最大${NOTE_MAX_LENGTH}文字）`}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background min-h-[64px]"
                  style={{ overflow: "hidden", resize: "none" }}
                  onInput={(e) => autoResizeTextArea(e.currentTarget)}
                />
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className={cn(
                            "h-9 min-w-[11rem] justify-start text-left font-normal",
                            !editDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {editDate ? formatReadableDateLabel(editDate) : "日付を選択"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start" data-inline-edit-popover={task.id}>
                        <Calendar
                          mode="single"
                          selected={editDate ?? undefined}
                          onSelect={(date) => {
                            if (!date) {
                              clearEditSchedule();
                              return;
                            }
                            const normalized = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                            setEditDate(normalized);
                            setIsDatePickerOpen(false);
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <div className="w-[9rem]">
                      <TimePickerField
                        value={editTime}
                        onChange={setEditTime}
                        disabled={!editDate}
                        onFocus={ensureEditTimeDefault}
                        onOpen={ensureEditTimeDefault}
                        className="h-10"
                        placeholder="時刻を選択"
                        minutesStep={5}
                      />
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearEditSchedule();
                      }}
                      disabled={!editDate && !(editTime && editTime.trim())}
                    >
                      日付をクリア
                    </Button>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        submitEdit();
                      }}
                    >
                      保存
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        cancelEdit();
                      }}
                    >
                      キャンセル
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div
                id={titleId}
                className={`text-[15px] ${
                  completed
                    ? "font-bold text-emerald-600 line-through decoration-emerald-600/80 decoration-[1.5px]"
                    : `font-semibold ${isOverdue ? "text-destructive" : "text-foreground"}`
                } truncate`}
                title={task.name}
              >
                {task.name}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0 max-w-0 overflow-hidden opacity-0 transition-all duration-200 group-hover:max-w-full group-hover:opacity-100 group-focus-within:max-w-full group-focus-within:opacity-100">
            {hasNote ? (
              <TooltipProvider>
                <Tooltip delayDuration={200}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="h-8 w-8 inline-flex items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePeek();
                      }}
                      aria-label="メモを表示"
                    >
                      <NotebookPen className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" align="end" className="max-w-xs text-left leading-relaxed">
                    <p className="whitespace-pre-line">{noteText}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : null}
            {task.link ? <span className="text-sm text-muted-foreground" aria-hidden="true">↗︎</span> : null}
            {typeof onEdit === "function" && !isEditing ? (
              <button
                type="button"
                className="h-8 w-8 inline-flex items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  resetEditState();
                  setIsEditing(true);
                }}
                aria-label="タスクを編集"
              >
                <Pencil className="h-4 w-4" aria-hidden="true" />
              </button>
            ) : null}
            {typeof onDelete === "function" ? (
              <button
                type="button"
                className="h-8 w-8 inline-flex items-center justify-center rounded text-red-400 hover:bg-red-400/10 hover:text-red-400 focus-visible:ring-2 focus-visible:ring-red-400/40 shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                aria-label="タスクを削除"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            ) : null}
          </div>
        </div>

        {!isEditing && hasNote ? (
          <div className="pl-10 text-xs text-muted-foreground/80 whitespace-pre-line break-words clamp-3">{notePreview}</div>
        ) : null}
        {!isEditing && timeLabel ? <div className="pl-10 text-xs text-muted-foreground break-words">{timeLabel}</div> : null}
      </div>

      {hasNote ? (
        <CollapsibleContent className="pl-10 overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out">
          <div className="mt-1 rounded-lg border border-border/70 bg-muted/40 px-3 py-2 text-sm leading-relaxed text-muted-foreground max-h-24 overflow-y-auto">
            <p className="whitespace-pre-wrap">{noteText}</p>
          </div>
        </CollapsibleContent>
      ) : null}
    </Collapsible>
  );
}
