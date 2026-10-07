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

export function StatusPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex rounded-full border border-ash-border bg-fog px-2 py-0.5 text-[12px] text-pewter">
      {children}
    </span>
  );
}
