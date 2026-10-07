import type { NextConfig } from "next";

function r2RemotePattern(): { protocol: "https"; hostname: string } | null {
  const raw = process.env.R2_PUBLIC_URL;
  if (!raw) return null;
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== "https:" || !parsed.hostname) return null;
    return { protocol: "https", hostname: parsed.hostname };
  } catch {
    return null;
  }
}

const r2Pattern = r2RemotePattern();

const nextConfig: NextConfig = {
  serverExternalPackages: ["exceljs"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      ...(r2Pattern ? [r2Pattern] : []),
    ],
  },
};

export default nextConfig;
