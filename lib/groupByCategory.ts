import { Id } from "@/convex/_generated/dataModel";

/**
 * Groups items by their categoryId, with uncategorized items at the end.
 * Preserves original order within each category group.
 * 
 * @param items - Array of items with optional categoryId
 * @param rpmCategories - Array of RPM categories (with _id and name)
 * @returns Array of groups: { categoryId, categoryName, items }
 */
export interface CategoryGroup<T> {
  categoryId: Id<"rpmCategories"> | null;
  categoryName: string | null;
  items: T[];
}

export function groupByCategory<T extends { categoryId?: Id<"rpmCategories"> }>(
  items: T[],
  rpmCategories: Array<{ _id: Id<"rpmCategories">; name: string; order?: number }>
): CategoryGroup<T>[] {
  // Create a map of categoryId -> items
  const grouped = new Map<string, T[]>();
  
  // Track which categories have items (in order they appear)
  const categoryOrder: string[] = [];
  
  for (const item of items) {
    const key = item.categoryId ?? "uncategorized";
    if (!grouped.has(key)) {
      grouped.set(key, []);
      categoryOrder.push(key);
    }
    grouped.get(key)!.push(item);
  }
  
  // Sort categories: first by RPM category order (if available), then uncategorized last
  const categoryMap = new Map(rpmCategories.map(c => [c._id, c]));
  
  categoryOrder.sort((a, b) => {
    if (a === "uncategorized") return 1;
    if (b === "uncategorized") return -1;
    
    const catA = categoryMap.get(a as Id<"rpmCategories">);
    const catB = categoryMap.get(b as Id<"rpmCategories">);
    
    // Use RPM category order if available
    if (catA?.order !== undefined && catB?.order !== undefined) {
      return catA.order - catB.order;
    }
    
    // Fallback to name comparison
    const nameA = catA?.name ?? "";
    const nameB = catB?.name ?? "";
    return nameA.localeCompare(nameB);
  });
  
  // Build result array
  return categoryOrder.map(key => {
    if (key === "uncategorized") {
      return {
        categoryId: null,
        categoryName: null,
        items: grouped.get(key)!,
      };
    }
    
    const category = categoryMap.get(key as Id<"rpmCategories">);
    return {
      categoryId: key as Id<"rpmCategories">,
      categoryName: category?.name ?? null,
      items: grouped.get(key)!,
    };
  });
}

/**
 * Flattens grouped items back into a single array.
 * Useful for compatibility with existing code that expects flat arrays.
 */
export function flattenGroups<T>(groups: CategoryGroup<T>[]): T[] {
  return groups.flatMap(g => g.items);
}
