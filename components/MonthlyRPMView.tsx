"use client";

import { useEffect, useMemo, useState } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { getCategoryColor } from "@/lib/categoryColors";
import { WorkSurfacePageHeader } from "@/components/work-surface";

type RPMCategory = {
  _id: Id<"rpmCategories">;
  name: string;
  type: "personal" | "professional";
  purpose?: string;
  yearlyGoals: string[];
  monthlyFocus: string[];
  order: number;
};

type MonthlyHighlight = {
  id: string;
  categoryId: Id<"rpmCategories">;
  categoryName: string;
  text: string;
};

const STORAGE_KEY = "mission-control-monthly-highlights";

function goalId(categoryId: string, text: string) {
  return `${categoryId}:${text}`;
}

function loadHighlights(): MonthlyHighlight[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveHighlights(highlights: MonthlyHighlight[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(highlights));
  window.dispatchEvent(new Event("mission-control-monthly-highlights-updated"));
}

export function MonthlyRPMView({
  categories,
  onEditCategory,
  onViewCategory,
}: {
  categories: RPMCategory[];
  onEditCategory: (id: Id<"rpmCategories">) => void;
  onViewCategory: (id: Id<"rpmCategories">) => void;
}) {
  const [highlights, setHighlights] = useState<MonthlyHighlight[]>([]);

  useEffect(() => {
    queueMicrotask(() => setHighlights(loadHighlights()));
  }, []);

  const highlightedIds = useMemo(() => new Set(highlights.map((item) => item.id)), [highlights]);
  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.type.localeCompare(b.type) || a.order - b.order),
    [categories]
  );
  const personalCategories = useMemo(() => sortedCategories.filter((category) => category.type === "personal"), [sortedCategories]);
  const professionalCategories = useMemo(() => sortedCategories.filter((category) => category.type === "professional"), [sortedCategories]);
  const categoriesById = useMemo(
    () => new Map(categories.map((category) => [category._id, category])),
    [categories]
  );
  const toggleHighlight = (category: RPMCategory, text: string) => {
    const id = goalId(category._id, text);
    const exists = highlightedIds.has(id);
    const next = exists
      ? highlights.filter((item) => item.id !== id)
      : [
          ...highlights,
          { id, categoryId: category._id, categoryName: category.name, text },
        ].slice(-5);

    setHighlights(next);
    saveHighlights(next);
  };

  const renderCategoryCard = (category: RPMCategory) => {
    const categoryColor = getCategoryColor(category.name);

    return (
      <Card key={category._id} className={[categoryColor.border, categoryColor.surface].join(" ")}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-base">{category.name}</CardTitle>
              <CardDescription className="mt-1">
                <span className={["inline-flex rounded-full border px-2 py-0.5 text-xs font-medium capitalize", categoryColor.badge].join(" ")}>
                  {category.type}
                </span>
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => onViewCategory(category._id)}>
                Open
              </Button>
              <Button variant="outline" size="sm" onClick={() => onEditCategory(category._id)}>
                Edit
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Yearly goals</div>
            {category.yearlyGoals.length > 0 ? (
              <ul className="space-y-1.5 text-sm">
                {category.yearlyGoals.map((goal, index) => (
                  <li key={index} className={["rounded-md border px-2 py-1.5", categoryColor.surface].join(" ")}>
                    {goal}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No yearly goals yet.</p>
            )}
          </div>

          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Monthly needle movers</div>
            {category.monthlyFocus.length > 0 ? (
              <div className="space-y-1.5">
                {category.monthlyFocus.map((focus, index) => {
                  const id = goalId(category._id, focus);
                  const highlighted = highlightedIds.has(id);
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => toggleHighlight(category, focus)}
                      className={[
                        "flex w-full items-center gap-2 rounded-md border px-2 py-1.5 text-left text-sm transition",
                        highlighted
                          ? categoryColor.surface
                          : "border-zinc-800 bg-background/50 hover:bg-muted/40",
                      ].join(" ")}
                    >
                      <Star className={["h-4 w-4 flex-shrink-0", highlighted ? "fill-amber-400 text-amber-400" : "text-muted-foreground"].join(" ")} />
                      <span>{focus}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No monthly focus yet.</p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <WorkSurfacePageHeader
        title="Monthly RPM"
        description="Yearly goals, this month&apos;s needle movers, and the 3-5 priorities to keep visible in Daily."
        action={<Badge variant="outline">{highlights.length}/5 starred</Badge>}
      />

      <Card className="border-amber-400/30 bg-gradient-to-br from-amber-500/14 via-orange-500/8 to-slate-950">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            Top Monthly Focus
          </CardTitle>
          <CardDescription>These show up at the top of Daily.</CardDescription>
        </CardHeader>
        <CardContent>
          {highlights.length > 0 ? (
            <div className="grid gap-2 md:grid-cols-2">
              {highlights.map((item) => (
                <div
                  key={item.id}
                  className={[
                    "rounded-lg border p-3",
                    getCategoryColor(categoriesById.get(item.categoryId)?.name ?? item.categoryName).surface,
                  ].join(" ")}
                >
                  <div
                    className={[
                      "mb-1 inline-flex rounded-full border px-2 py-0.5 text-xs font-medium",
                      getCategoryColor(categoriesById.get(item.categoryId)?.name ?? item.categoryName).badge,
                    ].join(" ")}
                  >
                    {item.categoryName}
                  </div>
                  <div className="text-sm font-medium">{item.text}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Star 3-5 monthly needle movers below.</p>
          )}
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">Personal RPM</h3>
            <Badge variant="outline">Life lanes</Badge>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {personalCategories.map(renderCategoryCard)}
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">Professional RPM</h3>
            <Badge variant="outline">Business lanes</Badge>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {professionalCategories.map(renderCategoryCard)}
          </div>
        </div>
      </div>
    </div>
  );
}
