/** Flat accents cycled by category sort order or offer-banner order. */
export const categoryAccentMarks = [
  "bg-category-teal",
  "bg-category-blue",
  "bg-category-amber",
  "bg-category-violet",
] as const;

export function categoryAccentMark(index: number) {
  return categoryAccentMarks[index % categoryAccentMarks.length];
}
