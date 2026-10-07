import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { log, logWarn } from "@/lib/logging";

export type UploadResult =
  | { status: "uploaded"; url: string; key: string }
  | { status: "not-configured" }
  | { status: "skipped"; reason: string }
  | { status: "failed"; error: string };

export function isR2Configured(): boolean {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET_NAME &&
      process.env.R2_PUBLIC_URL
  );
}

function getR2Client(): S3Client | null {
  if (!isR2Configured()) return null;
  return new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
}

export async function getPresignedUploadUrl(
  key: string,
  contentType: string
): Promise<{ status: "ready"; url: string } | { status: "not-configured" } | { status: "failed"; error: string }> {
  if (!isR2Configured()) {
    logWarn("storage.not-configured", { key });
    return { status: "not-configured" };
  }

  try {
    const client = getR2Client()!;
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      ContentType: contentType,
    });
    const url = await getSignedUrl(client, command, { expiresIn: 3600 });
    return { status: "ready", url };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { status: "failed", error: message };
  }
}

export async function uploadBuffer(
  key: string,
  buffer: Buffer,
  contentType: string
): Promise<UploadResult> {
  if (!isR2Configured()) {
    logWarn("storage.not-configured", { key });
    return { status: "not-configured" };
  }

  try {
    const client = getR2Client()!;
    await client.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      })
    );
    const url = publicObjectUrl(key);
    log("storage.uploaded", { key });
    return { status: "uploaded", url, key };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logWarn("storage.failed", { key, error: message });
    return { status: "failed", error: message };
  }
}

function publicObjectUrl(key: string): string {
  const base = process.env.R2_PUBLIC_URL!.replace(/\/+$/, "");
  const normalizedKey = key.replace(/^\/+/, "");
  return `${base}/${normalizedKey}`;
}

export function getPublicUrl(key: string): string | null {
  if (!process.env.R2_PUBLIC_URL) return null;
  return publicObjectUrl(key);
}
