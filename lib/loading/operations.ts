export const SHOW_DELAY_MS = 100;

export const ROUTE_OPERATION_ID = "route";

export type OperationMode = "indeterminate" | "determinate";

type Operation = {
  id: string;
  mode: OperationMode;
  loaded: number;
  total: number;
  startedAt: number;
};

export type ProgressSnapshot = {
  busy: boolean;
  visible: boolean;
  mode: "idle" | "indeterminate" | "determinate";
  ratio: number | null;
  activeCount: number;
};

const IDLE: ProgressSnapshot = {
  busy: false,
  visible: false,
  mode: "idle",
  ratio: null,
  activeCount: 0,
};

const operations = new Map<string, Operation>();
const listeners = new Set<() => void>();

let snapshot: ProgressSnapshot = IDLE;
let revealTimer: ReturnType<typeof setTimeout> | null = null;

function sameSnapshot(a: ProgressSnapshot, b: ProgressSnapshot) {
  return (
    a.busy === b.busy &&
    a.visible === b.visible &&
    a.mode === b.mode &&
    a.ratio === b.ratio &&
    a.activeCount === b.activeCount
  );
}

function compute(now = Date.now()): ProgressSnapshot {
  if (operations.size === 0) return IDLE;

  let oldest = Number.POSITIVE_INFINITY;
  let loaded = 0;
  let total = 0;

  for (const operation of operations.values()) {
    if (operation.startedAt < oldest) oldest = operation.startedAt;
    if (operation.mode === "determinate" && operation.total > 0) {
      loaded += Math.max(0, operation.loaded);
      total += operation.total;
    }
  }

  const visible = now - oldest >= SHOW_DELAY_MS;
  if (total > 0) {
    return {
      busy: true,
      visible,
      mode: "determinate",
      ratio: Math.min(1, Math.max(0, loaded / total)),
      activeCount: operations.size,
    };
  }

  return {
    busy: true,
    visible,
    mode: "indeterminate",
    ratio: null,
    activeCount: operations.size,
  };
}

function publish() {
  const next = compute();
  if (sameSnapshot(snapshot, next)) return;
  snapshot = next;
  for (const listener of listeners) listener();
}

function clearRevealTimer() {
  if (revealTimer == null) return;
  clearTimeout(revealTimer);
  revealTimer = null;
}

function scheduleReveal() {
  if (revealTimer != null || operations.size === 0) return;
  let oldest = Number.POSITIVE_INFINITY;
  for (const operation of operations.values()) {
    if (operation.startedAt < oldest) oldest = operation.startedAt;
  }
  const wait = Math.max(0, SHOW_DELAY_MS - (Date.now() - oldest));
  revealTimer = setTimeout(() => {
    revealTimer = null;
    publish();
  }, wait);
}

export function startOperation(id: string, options?: { mode?: OperationMode }) {
  if (operations.has(id)) return;
  operations.set(id, {
    id,
    mode: options?.mode ?? "indeterminate",
    loaded: 0,
    total: 0,
    startedAt: Date.now(),
  });
  scheduleReveal();
  publish();
}

export function setOperationProgress(id: string, loaded: number, total: number) {
  const operation = operations.get(id);
  if (!operation) return;
  if (!Number.isFinite(loaded) || !Number.isFinite(total) || total <= 0) return;
  operation.mode = "determinate";
  operation.loaded = Math.max(0, loaded);
  operation.total = total;
  publish();
}

export function finishOperation(id: string) {
  if (!operations.delete(id)) return;
  if (operations.size === 0) clearRevealTimer();
  publish();
}

export function subscribeProgress(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getProgressSnapshot() {
  return snapshot;
}

export function getServerProgressSnapshot(): ProgressSnapshot {
  return IDLE;
}

export function resetOperations() {
  operations.clear();
  clearRevealTimer();
  snapshot = IDLE;
  for (const listener of listeners) listener();
}
