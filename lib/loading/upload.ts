import { finishOperation, setOperationProgress, startOperation } from "@/lib/loading/operations";

export type UploadFolder = "products" | "banners" | "brands" | "categories";

export type UploadOutcome =
  | { ok: true; publicUrl: string }
  | { ok: false; error: string };

type UploadPayload = {
  status?: string;
  publicUrl?: string;
  error?: string;
};

export function readUploadPayload(status: number, raw: string): UploadOutcome {
  let data: UploadPayload = {};
  try {
    data = JSON.parse(raw) as UploadPayload;
  } catch {
    data = {};
  }

  if (data.status === "not-configured" || status === 503) {
    return { ok: false, error: "رفع الصور غير مُعد" };
  }
  if (status < 200 || status >= 300 || data.status !== "uploaded" || !data.publicUrl) {
    return { ok: false, error: data.error || "فشل رفع الملف" };
  }
  return { ok: true, publicUrl: data.publicUrl };
}

export function uploadAdminFile(
  file: File,
  folder: UploadFolder,
  operationId: string,
  onProgress?: (loaded: number, total: number) => void
): Promise<UploadOutcome> {
  startOperation(operationId, { mode: "determinate" });

  return new Promise((resolve) => {
    const body = new FormData();
    body.append("file", file);
    body.append("folder", folder);
    let settled = false;

    const finish = (outcome: UploadOutcome) => {
      if (settled) return;
      settled = true;
      finishOperation(operationId);
      resolve(outcome);
    };

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload");
    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || event.total <= 0) return;
      setOperationProgress(operationId, event.loaded, event.total);
      onProgress?.(event.loaded, event.total);
    };
    xhr.onerror = () => finish({ ok: false, error: "فشل رفع الملف" });
    xhr.onabort = () => finish({ ok: false, error: "فشل رفع الملف" });
    xhr.onload = () => finish(readUploadPayload(xhr.status, xhr.responseText));
    try {
      xhr.send(body);
    } catch {
      finish({ ok: false, error: "فشل رفع الملف" });
    }
  });
}
