"use client";
import { formatDateTime } from "@/lib/format";

export interface HistoryEntry {
  timestamp: string;
  actor: string;
  action: string;
  note?: string;
}

export function HistoryTimeline({ entries }: { entries: HistoryEntry[] }) {
  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">Sin historial.</p>;
  }
  return (
    <ol className="space-y-3 border-l pl-4">
      {entries.map((e, i) => (
        <li key={i}>
          <p className="text-sm font-medium">{e.action}</p>
          <p className="text-xs text-muted-foreground">
            {formatDateTime(e.timestamp)} — {e.actor}
          </p>
          {e.note && <p className="text-sm mt-1">{e.note}</p>}
        </li>
      ))}
    </ol>
  );
}
