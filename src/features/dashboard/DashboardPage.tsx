import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase/client";
import { CONTACT_STATUS_LABELS } from "@/types/domain";
import type { ContactStatus } from "@/types/database";

type Counts = Partial<Record<ContactStatus, number>>;

/** FR-010 dashboard: contact counters by status. Campaign filtering is a later iteration. */
export function DashboardPage() {
  const [counts, setCounts] = useState<Counts>({});
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadCounts() {
      setIsLoading(true);
      const { data, error } = await supabase.from("contacts").select("status");
      if (!cancelled) {
        if (!error && data) {
          const next: Counts = {};
          for (const row of data) {
            const status = row.status as ContactStatus;
            next[status] = (next[status] ?? 0) + 1;
          }
          setCounts(next);
          setTotal(data.length);
        }
        setIsLoading(false);
      }
    }

    loadCounts();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Overview of your contacts and outreach activity.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard label="Total contacts" value={total} isLoading={isLoading} />
        {(Object.keys(CONTACT_STATUS_LABELS) as ContactStatus[]).map((status) => (
          <StatCard
            key={status}
            label={CONTACT_STATUS_LABELS[status]}
            value={counts[status] ?? 0}
            isLoading={isLoading}
          />
        ))}
      </div>

      <div className="mt-6 flex gap-3">
        <Link
          to="/imports"
          className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
        >
          Import contacts
        </Link>
        <Link
          to="/contacts"
          className="rounded-md border border-border px-3 py-2 text-sm font-medium"
        >
          View contacts
        </Link>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  isLoading,
}: {
  label: string;
  value: number;
  isLoading: boolean;
}) {
  return (
    <div className="rounded-lg border border-border p-4">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{isLoading ? "…" : value}</div>
    </div>
  );
}
