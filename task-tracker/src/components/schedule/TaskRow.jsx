"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle, Circle, Pencil, X, NotebookPen } from "lucide-react";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
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

  const isToday = hasRemind ? isTodayISO(task.remindAt) : false;
   const isOverdue = hasRemind
     ? (() => {
         if (!hasExplicitTime && isToday) return false;
         return isPastISO(task.remindAt) && !completed;
       })()
     : false;
 
   const handleKeyDown = useCallback((e) => {
     if (e.key === " " || e.key === "Enter") {
       e.preventDefault();
       onToggle?.();
     }
   }, [onToggle]);
 
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
     completed ? "text-emerald-600" : isOverdue ? "text-destructive" : "text-foreground/60"
   );
 
   return (
     <Collapsible
       open={isPeekOpen}
       onOpenChange={(next) => togglePeek(next)}
     >
       <div
         role="checkbox"
         aria-checked={completed}
         aria-labelledby={titleId}
         tabIndex={0}
         onClick={onToggle}
         onKeyDown={handleKeyDown}
         className="group flex flex-col gap-1 bg-transparent px-3 py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-md min-w-0 hover:bg-muted/50 transition-colors"
       >
         <div className="flex items-center gap-3">
         {completed ? (
           <CheckCircle aria-hidden="true" className={iconClassName} strokeWidth={2} />
         ) : (
           <Circle aria-hidden="true" className={iconClassName} strokeWidth={2} />
         )}
 
         <div className="min-w-0 flex-1">
           <div
             id={titleId}
             className={`break-words text-[15px] ${
               completed
                 ? "font-bold text-emerald-600 line-through decoration-emerald-600/80 decoration-[1.5px]"
                 : `font-semibold ${isOverdue ? "text-destructive" : "text-foreground"}`
             }`}
             title={task.name}
           >
             {task.name}
           </div>
         </div>
 
         <div className="flex items-center gap-1 ml-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
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
           {typeof onEdit === "function" ? (
             <button
               type="button"
               className="h-8 w-8 inline-flex items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground shrink-0"
               onClick={(e) => { e.stopPropagation(); onEdit(); }}
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
         <div className="pl-8 text-xs text-muted-foreground/80 whitespace-pre-line break-words clamp-3">{notePreview}</div>
       ) : null}
       {hasNote ? (
         <CollapsibleContent className="overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out">
           <div className="mt-1 ml-8 rounded-lg border border-border/70 bg-muted/40 px-3 py-2 text-sm leading-relaxed text-muted-foreground max-h-24 overflow-y-auto">
             <p className="whitespace-pre-wrap">{noteText}</p>
           </div>
         </CollapsibleContent>
       ) : null}
       {timeLabel ? <div className="pl-8 text-xs text-muted-foreground break-words">{timeLabel}</div> : null}
       </div>
     </Collapsible>
   );
 }
