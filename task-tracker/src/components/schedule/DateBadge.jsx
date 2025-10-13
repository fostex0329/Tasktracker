"use client";

export default function DateBadge({ iso, className = "", ...rest }) {
  const d = iso ? new Date(iso) : new Date(NaN);
  const day = Number.isNaN(d.getTime()) ? "" : String(d.getDate());
  return (
    <div {...rest} className={`rounded-full flex items-center justify-center text-xs font-semibold ${className}`}>
      {day}
    </div>
  );
}