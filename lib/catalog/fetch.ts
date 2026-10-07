import { logError } from "@/lib/logging";
import { classifyCatalogError, isRetryable } from "@/lib/catalog/errors";

const FETCH_TIMEOUT_MS = 8_000;
const RETRY_DELAY_MS = 300;

export interface CatalogSuccess<T> {
  data: T;
  error: null;
}

export interface CatalogFailure {
  data: null;
  error: unknown;
}

export type CatalogResult<T> = CatalogSuccess<T> | CatalogFailure;

export function isCatalogSuccess<T>(result: CatalogResult<T>): result is CatalogSuccess<T> {
  return result.error === null;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), ms);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

async function executeOnce<T>(operation: string, fetchFn: () => Promise<T>): Promise<CatalogResult<T>> {
  try {
    return { data: await withTimeout(fetchFn(), FETCH_TIMEOUT_MS), error: null };
  } catch (err) {
    return { data: null, error: err };
  }
}

export async function runCatalogFetch<T>(
  operation: string,
  fetchFn: () => Promise<T>
): Promise<CatalogResult<T>> {
  let result = await executeOnce(operation, fetchFn);

  if (result.error && isRetryable(classifyCatalogError(result.error))) {
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    result = await executeOnce(operation, fetchFn);
  }

  if (result.error) {
    const kind = classifyCatalogError(result.error);
    logError("catalog.fetch_failed", {
      operation,
      kind,
      retryable: isRetryable(kind),
    });
  }

  return result;
}
