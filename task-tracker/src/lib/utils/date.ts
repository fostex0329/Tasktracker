// src/lib/utils/date.ts
import { Todo } from '@/lib/types';

export function parseISO(v: string | null | undefined): Date {
  if (!v) return new Date(NaN);
  return new Date(v);
}

export function isValidDate(d: Date): boolean {
  return d instanceof Date && !Number.isNaN(d.getTime());
}

export function formatISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function formatJPYearMonth(ym: string): string {
  const [, m] = ym.split("-");
  return `${Number(m)}月`;
}

export function formatTime(isoLike: string): string | null {
  const d = parseISO(isoLike);
  if (!isValidDate(d)) return null;
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

export function formatDateJP(iso: string): string | null {
  const d = parseISO(iso);
  if (!isValidDate(d)) return null;
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function isSameYMD(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && 
         a.getMonth() === b.getMonth() && 
         a.getDate() === b.getDate();
}

export function isTodayISO(iso: string): boolean {
  const d = parseISO(iso);
  if (!isValidDate(d)) return false;
  return isSameYMD(d, new Date());
}

export function isPastISO(iso: string): boolean {
  const d = parseISO(iso);
  if (!isValidDate(d)) return false;
  return d.getTime() < Date.now();
}

export function groupByMonth(items: Todo[]): [string, Todo[]][] {
  const map = new Map<string, Todo[]>();
  for (const t of items) {
    const d = parseISO(t.remindAt);
    if (!isValidDate(d)) continue;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(t);
  }
  return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
}

export function groupByDate(items: Todo[]): [string, Todo[]][] {
  const map = new Map<string, Todo[]>();
  for (const t of items) {
    const d = parseISO(t.remindAt);
    if (!isValidDate(d)) continue;
    const key = formatISODate(d);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(t);
  }
  return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
}

// Timezone-safe helpers
export function localDatetimeToISO(local: string): string | null {
  if (!local) return null;
  const d = new Date(local);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function isoToLocalDatetime(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hh = pad(d.getHours());
  const mm = pad(d.getMinutes());
  return `${y}-${m}-${day}T${hh}:${mm}`;
}

export function migrateTodosToISO(list: Todo[]): Todo[] {
  const localRe = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
  return Array.isArray(list)
    ? list.map((t) => {
        if (t?.remindAt && typeof t.remindAt === "string" && localRe.test(t.remindAt)) {
          const iso = localDatetimeToISO(t.remindAt);
          return { ...t, remindAt: iso || t.remindAt };
        }
        return t;
      })
    : list;
}
