"use client";

import { useEffect, useRef } from "react";
import type { FormState } from "@/lib/admin/actions";
import { notify } from "@/lib/feedback/notify";

export function useFormToast(state: FormState, successMessage: string, onSaved?: () => void) {
  const seen = useRef(state);
  const onSavedRef = useRef(onSaved);
  onSavedRef.current = onSaved;

  useEffect(() => {
    if (seen.current === state) return;
    seen.current = state;

    if (state.error) {
      notify.error(state.error);
      return;
    }
    if (state.notice) {
      notify.warning(state.notice);
      return;
    }
    if (!state.saved) return;

    notify.success(successMessage);
    onSavedRef.current?.();
  }, [state, successMessage]);
}
