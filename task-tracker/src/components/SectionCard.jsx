"use client";
import { Card } from "@/components/ui/card";

export default function SectionCard({ title, children, collapsible }) {
  const headingId = `section-${String(title).toLowerCase()}`;
  return (
    <Card className="p-3 shadow-sm rounded-xl pt-5 pb-7" role="region" aria-labelledby={headingId}>
      <div className="flex items-center justify-between px-4 pb-2">
        <h2 id={headingId} className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
          {title}
        </h2>
        {collapsible ? <div className="text-muted-foreground" aria-hidden="true">▾</div> : null}
      </div>
      <div className="grid gap-2 px-4">{children}</div>
    </Card>
  );
}