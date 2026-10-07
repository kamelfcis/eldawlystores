import { CompareView } from "@/components/compare/compare-view";

export const metadata = { title: "مقارنة المنتجات" };

interface ComparePageProps {
  searchParams: Promise<{ ids?: string }>;
}

function parseIds(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return [...new Set(raw.split(",").map((id) => id.trim()).filter(Boolean))].slice(0, 3);
}

export default async function ComparePage({ searchParams }: ComparePageProps) {
  const params = await searchParams;
  const initialIdsFromUrl = parseIds(params.ids);

  return <CompareView initialIdsFromUrl={initialIdsFromUrl} />;
}
