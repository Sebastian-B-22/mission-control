"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Edit } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { getCategoryColor } from "@/lib/categoryColors";
import { WorkSurfacePageHeader } from "@/components/work-surface";

interface ProfessionalOverviewProps {
  categories: Array<{ _id: Id<"rpmCategories">; name: string; role?: string; purpose?: string; yearlyGoals: string[]; monthlyFocus: string[] }>;
  onEditCategory: (id: Id<"rpmCategories">) => void;
  onViewCategory: (id: Id<"rpmCategories">) => void;
}

export function ProfessionalOverview({ categories, onEditCategory, onViewCategory }: ProfessionalOverviewProps) {
  return (
    <div className="space-y-6">
      <WorkSurfacePageHeader
        title="Professional RPM"
        description="Business categories, strategic outcomes, monthly needle movers, and execution focus."
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => {
          const categoryColor = getCategoryColor(category.name);
          return (
          <Card 
            key={category._id} 
            className={`group cursor-pointer overflow-hidden transition hover:-translate-y-0.5 hover:bg-white/[0.03] ${categoryColor.border} ${categoryColor.surface}`}
            onClick={() => onViewCategory(category._id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{category.name}</CardTitle>
                  <CardDescription className="mt-1">{category.role || "Business lane"}</CardDescription>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditCategory(category._id);
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-white/10 bg-black/15 p-3">
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Purpose</p>
                  {category.purpose ? (
                  <p className="line-clamp-3 text-sm leading-relaxed text-foreground">{category.purpose}</p>
                  ) : (
                    <p className="text-sm italic text-muted-foreground">
                      Click to add purpose...
                    </p>
                  )}
              </div>
              {category.yearlyGoals.length > 0 ? (
                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Yearly outcomes</p>
                  <ul className="space-y-1.5">
                    {category.yearlyGoals.slice(0, 2).map((goal, index) => (
                      <li key={index} className="rounded-md border border-white/10 bg-background/35 px-3 py-2 text-sm leading-snug">
                        {goal}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">This month</p>
                {category.monthlyFocus.length > 0 ? (
                  <ul className="space-y-1.5">
                    {category.monthlyFocus.slice(0, 3).map((focus, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm leading-snug text-foreground">
                        <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-current opacity-70" />
                        <span className="line-clamp-2">{focus}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm italic text-muted-foreground">No monthly needle movers set.</p>
                )}
              </div>
              <div className="flex items-center justify-end text-xs font-medium text-muted-foreground transition group-hover:text-foreground">
                Open category <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </div>
            </CardContent>
          </Card>
          );
        })}
      </div>
    </div>
  );
}
