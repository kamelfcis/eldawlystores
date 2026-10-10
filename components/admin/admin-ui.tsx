export function adminFilterChipClass(selected: boolean): string {
  const base =
    "inline-flex min-h-10 items-center rounded-full border px-3 text-[14px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-carbon-ink";
  return selected
    ? `${base} border-carbon-ink bg-carbon-ink text-paper-white`
    : `${base} border-ash-border bg-paper-white text-graphite`;
}

export function AdminPage({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[16px] font-bold tracking-[0.057em] text-carbon-ink">{title}</h1>
        {action}
      </div>
      {children}
    </div>
  );
}

export function AdminList({
  columns,
  gridClass,
  children,
  flush = false,
}: {
  columns: readonly string[];
  gridClass: string;
  children: React.ReactNode;
  flush?: boolean;
}) {
  return (
    <div
      className={
        flush
          ? "space-y-3 lg:space-y-0"
          : "space-y-3 lg:space-y-0 lg:overflow-hidden lg:rounded-[8px] lg:border lg:border-mist lg:bg-paper-white"
      }
    >
      <div
        className={`hidden ${gridClass} border-b border-mist bg-fog px-4 py-3 text-[14px] font-bold tracking-[0.038em] text-carbon-ink lg:grid lg:items-center`}
      >
        {columns.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
      <ul className={flush ? "lg:px-0" : undefined}>{children}</ul>
    </div>
  );
}

export function AdminListRow({ gridClass, children }: { gridClass: string; children: React.ReactNode }) {
  return (
    <li
      className={`grid gap-3 rounded-[8px] border border-mist bg-paper-white px-4 py-3 text-[14px] lg:rounded-none lg:border-0 lg:border-b lg:last:border-0 ${gridClass} lg:items-center`}
    >
      {children}
    </li>
  );
}

export function AdminListCell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="mb-1 text-[12px] text-graphite lg:hidden">{label}</p>
      {children}
    </div>
  );
}

export function AdminError({ message }: { message: string | null | undefined }) {
  if (!message) return null;
  return (
    <p className="rounded-[4px] border border-mist bg-paper-white px-3 py-2 text-[14px] text-carbon-ink">{message}</p>
  );
}

export function AdminEmpty({ children }: { children: React.ReactNode }) {
  return <p className="rounded-[8px] border border-mist bg-paper-white px-4 py-8 text-center text-[14px] text-graphite">{children}</p>;
}

export function formatAdminTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("ar-EG", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Cairo",
  }).format(date);
}

export function StatusPill({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <span
      className="inline-flex rounded-full border border-ash-border bg-fog px-2 py-0.5 text-[12px] text-pewter"
      style={color ? { borderColor: color, color, backgroundColor: "transparent" } : undefined}
    >
      {children}
    </span>
  );
}
