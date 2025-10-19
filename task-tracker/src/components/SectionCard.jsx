"use client";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

export default function SectionCard({ title, children, collapsible, elevated = true }) {
  const headingId = `section-${String(title).toLowerCase()}`;
  const surfaceClassName = elevated
    ? "shadow-lg shadow-slate-950/5"
    : "shadow-none border border-border/60 bg-card/95";

  return (
    <Card
      className={cn("rounded-xl p-3 pt-5 pb-7", surfaceClassName)}
      role="region"
      aria-labelledby={headingId}
    >
      <div className="flex items-center justify-between px-4 pb-2">
        <h2 id={headingId} className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
          {title}
        </h2>
        {collapsible ? <div className="text-muted-foreground" aria-hidden="true">▾</div> : null}
      </div>
      <div className="grid gap-2 px-4">
        <div className="min-w-0 w-full">
          {children}
        </div>
      </div>
    </Card>
  );
}
