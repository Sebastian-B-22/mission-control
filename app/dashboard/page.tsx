"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  const { user } = useUser();
  
  // TODO: Get user from Convex by Clerk ID
  // const convexUser = useQuery(api.users.getUserByClerkId, { clerkId: user?.id || "" });
  // const categories = useQuery(api.rpm.getCategoriesByUser, { userId: convexUser?._id });

  const personalCategories = [
    "Magnificent Mommy/Homeschooling Hero",
    "Financial Independence & Freedom",
    "Home Haven & Sanctuary",
    "Bangin' Ass Body",
    "Extraordinary Friendships",
    "Phenomenal Relationship",
  ];

  const professionalCategories = [
    "Bad Ass Business Owner",
    "HTA Empire Builder",
    "Staff Empowerment & Kickass Workplace",
    "Marketing & Networking Genius",
    "Operational Systems Guru",
    "Program Innovation & Excellence",
  ];

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-amber-500 to-red-600 bg-clip-text text-transparent">
          Mission Control
        </h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.firstName || "Corinne"}! Ready to make today count?
        </p>
      </div>

      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
          <TabsTrigger value="personal">PERSONAL</TabsTrigger>
          <TabsTrigger value="professional">PROFESSIONAL</TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {personalCategories.map((category) => (
              <Card key={category} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{category}</CardTitle>
                  <CardDescription>RPM Category</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Yearly Goals</p>
                      <p className="text-sm italic text-muted-foreground">
                        Click to add goals...
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Monthly Needle Movers
                      </p>
                      <p className="text-sm italic text-muted-foreground">
                        Click to add focus areas...
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="professional" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {professionalCategories.map((category) => (
              <Card key={category} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{category}</CardTitle>
                  <CardDescription>RPM Category</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Yearly Goals</p>
                      <p className="text-sm italic text-muted-foreground">
                        Click to add goals...
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Monthly Needle Movers
                      </p>
                      <p className="text-sm italic text-muted-foreground">
                        Click to add focus areas...
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
