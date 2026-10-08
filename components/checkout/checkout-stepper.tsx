const steps = [
  { id: 1, label: "التواصل" },
  { id: 2, label: "العنوان" },
  { id: 3, label: "المراجعة" },
] as const;

export function CheckoutStepper() {
  return (
    <ol className="flex items-center justify-between gap-2" aria-label="خطوات إتمام الطلب">
      {steps.map((step, index) => (
        <li key={step.id} className="flex min-w-0 flex-1 items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-carbon-ink text-[14px] font-bold text-paper-white">
            {step.id}
          </span>
          <span className="truncate text-[14px] font-bold text-retail-ink">{step.label}</span>
          {index < steps.length - 1 ? (
            <span aria-hidden className="ms-auto hidden h-px flex-1 bg-mist sm:block" />
          ) : null}
        </li>
      ))}
    </ol>
  );
}
