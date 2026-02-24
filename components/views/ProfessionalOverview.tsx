"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

interface ProfessionalOverviewProps {
  categories: Array<{ _id: Id<"rpmCategories">; name: string; role?: string; purpose?: string; monthlyFocus: string[] }>;
  onEditCategory: (id: Id<"rpmCategories">) => void;
  onViewCategory: (id: Id<"rpmCategories">) => void;
}

export function ProfessionalOverview({ categories, onEditCategory, onViewCategory }: ProfessionalOverviewProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Professional RPM</h1>
        <p className="text-muted-foreground mt-1">Your business categories - click to explore each one</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <Card 
            key={category._id} 
            className="hover:shadow-lg transition-shadow cursor-pointer group"
            onClick={() => onViewCategory(category._id)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{category.name}</CardTitle>
                  <CardDescription>{category.role || "RPM Category"}</CardDescription>
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
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-bold text-muted-foreground mb-1">Purpose</p>
                  {category.purpose ? (
                    <p className="text-sm line-clamp-2">{category.purpose}</p>
                  ) : (
                    <p className="text-sm italic text-muted-foreground">
                      Click to add purpose...
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold text-muted-foreground mb-1">
                    Monthly Needle Movers
                  </p>
                  {category.monthlyFocus.length > 0 ? (
                    <p className="text-sm text-muted-foreground">
                      {category.monthlyFocus.length} focus areas
                    </p>
                  ) : (
                    <p className="text-sm italic text-muted-foreground">
                      None set
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
