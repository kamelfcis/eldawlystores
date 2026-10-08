import { ROUTE_OPERATION_ID, startOperation } from "@/lib/loading/operations";

let installs = 0;
let restore: (() => void) | null = null;

function isInternalNavigationClick(event: MouseEvent) {
  if (event.button !== 0) return false;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
  const target = event.target;
  if (!(target instanceof Element)) return false;
  if (target.closest("button, input, textarea, select, [data-prevent-progress]")) return false;

  const anchor = target.closest("a");
  if (!(anchor instanceof HTMLAnchorElement)) return false;
  if (anchor.hasAttribute("download")) return false;
  const frame = anchor.getAttribute("target");
  if (frame && frame !== "_self") return false;

  const raw = anchor.getAttribute("href");
  if (!raw || raw.startsWith("#")) return false;
  if (/^(mailto:|tel:|blob:|javascript:)/i.test(raw)) return false;

  let url: URL;
  try {
    url = new URL(anchor.href);
  } catch {
    return false;
  }
  if (url.origin !== window.location.origin) return false;
  return url.pathname !== window.location.pathname || url.search !== window.location.search;
}

function watchHistory(method: "pushState" | "replaceState") {
  const original = history[method];
  history[method] = function (this: History, ...args: Parameters<History["pushState"]>) {
    const before = window.location.pathname + window.location.search;
    const result = original.apply(this, args);
    const after = window.location.pathname + window.location.search;
    if (after !== before) startOperation(ROUTE_OPERATION_ID);
    return result;
  };
  return () => {
    history[method] = original;
  };
}

function install() {
  const onClick = (event: MouseEvent) => {
    if (!isInternalNavigationClick(event)) return;
    startOperation(ROUTE_OPERATION_ID);
  };
  const onPopState = () => startOperation(ROUTE_OPERATION_ID);
  document.addEventListener("click", onClick, true);
  window.addEventListener("popstate", onPopState);
  const unpush = watchHistory("pushState");
  const unreplace = watchHistory("replaceState");

  return () => {
    document.removeEventListener("click", onClick, true);
    window.removeEventListener("popstate", onPopState);
    unpush();
    unreplace();
  };
}

export function installRouteSignals() {
  installs += 1;
  if (installs === 1) restore = install();
  return () => {
    installs -= 1;
    if (installs === 0 && restore) {
      restore();
      restore = null;
    }
  };
}
