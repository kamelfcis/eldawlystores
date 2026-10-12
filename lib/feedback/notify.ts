import { toast } from "sonner";

const DURATIONS = {
  success: 3000,
  info: 3000,
  warning: 4000,
  error: 5000,
} as const;

export type NotifyOptions = { id?: string };

/** Stable sonner id from message text for deduplication. */
export function notifyToastId(message: string): string {
  return message;
}

function toastId(message: string, options?: NotifyOptions): string {
  return options?.id ?? notifyToastId(message);
}

export const notify = {
  success(message: string, options?: NotifyOptions) {
    toast.success(message, { id: toastId(message, options), duration: DURATIONS.success });
  },
  error(message: string, options?: NotifyOptions) {
    toast.error(message, { id: toastId(message, options), duration: DURATIONS.error });
  },
  warning(message: string, options?: NotifyOptions) {
    toast.warning(message, { id: toastId(message, options), duration: DURATIONS.warning });
  },
  info(message: string, options?: NotifyOptions) {
    toast.info(message, { id: toastId(message, options), duration: DURATIONS.info });
  },
};
