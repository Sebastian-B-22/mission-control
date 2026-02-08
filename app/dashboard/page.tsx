"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Id } from "@/convex/_generated/dataModel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ProjectTaskList } from "@/components/ProjectTaskList";
import { HabitTracker } from "@/components/HabitTracker";
import { FiveToThrive } from "@/components/FiveToThrive";
import { TaskList } from "@/components/TaskList";

export default function DashboardPage() {
  const { user } = useUser();
  const [editingCategoryId, setEditingCategoryId] = useState<Id<"rpmCategories"> | null>(null);
  const [purpose, setPurpose] = useState("");
  const [yearlyGoals, setYearlyGoals] = useState("");
  const [needleMovers, setNeedleMovers] = useState("");
  
  // Get or create user in Convex
  const convexUser = useQuery(
    api.users.getUserByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );
  const createUser = useMutation(api.users.createUser);

  // Auto-create user if doesn't exist
  useEffect(() => {
    if (user && convexUser === null) {
      createUser({
        clerkId: user.id,
        email: user.emailAddresses[0]?.emailAddress || "",
        name: user.fullName || user.firstName || "User",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, convexUser]);

  // Get RPM categories
  const categories = useQuery(
    api.rpm.getCategoriesByUser,
    convexUser ? { userId: convexUser._id } : "skip"
  );

  const updateCategory = useMutation(api.rpm.updateCategory);

  // Get today's date
  const today = new Date().toISOString().split("T")[0];

  const personalCategories = categories?.filter((c) => c.type === "personal") || [];
  const professionalCategories = categories?.filter((c) => c.type === "professional") || [];

  const handleEditCategory = (categoryId: Id<"rpmCategories">) => {
    const category = categories?.find((c) => c._id === categoryId);
    if (category) {
      setEditingCategoryId(categoryId);
      setPurpose(category.purpose || "");
      setYearlyGoals(category.yearlyGoals.join("\n"));
      setNeedleMovers(category.monthlyFocus.join("\n"));
    }
  };

  const handleSaveCategory = async () => {
    if (!editingCategoryId) return;

    await updateCategory({
      id: editingCategoryId,
      purpose: purpose.trim() || undefined,
      yearlyGoals: yearlyGoals
        .split("\n")
        .map((g) => g.trim())
        .filter(Boolean),
      monthlyFocus: needleMovers
        .split("\n")
        .map((m) => m.trim())
        .filter(Boolean),
    });

    setEditingCategoryId(null);
    setPurpose("");
    setYearlyGoals("");
    setNeedleMovers("");
  };

  const editingCategory = categories?.find((c) => c._id === editingCategoryId);

  if (!convexUser) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto"></div>
            <p className="text-muted-foreground">Loading your Mission Control...</p>
          </div>
        </div>
      </div>
    );
  }

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
        <TabsList className="grid w-full grid-cols-6 mb-8 h-auto">
          <TabsTrigger value="personal">Personal RPM</TabsTrigger>
          <TabsTrigger value="professional">Professional RPM</TabsTrigger>
          <TabsTrigger value="daily">Daily</TabsTrigger>
          <TabsTrigger value="hta">HTA</TabsTrigger>
          <TabsTrigger value="aspire">Aspire</TabsTrigger>
          <TabsTrigger value="homeschool">Homeschool</TabsTrigger>
        </TabsList>

        {/* Personal RPM Tab */}
        <TabsContent value="personal" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {personalCategories.map((category) => (
              <Card 
                key={category._id} 
                className="hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => handleEditCategory(category._id)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{category.name}</CardTitle>
                      <CardDescription>RPM Category</CardDescription>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditCategory(category._id);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Purpose</p>
                      {category.purpose ? (
                        <p className="text-sm">{category.purpose}</p>
                      ) : (
                        <p className="text-sm italic text-muted-foreground">
                          Click to add purpose...
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Yearly Goals</p>
                      {category.yearlyGoals.length > 0 ? (
                        <ul className="text-sm list-disc list-inside space-y-1">
                          {category.yearlyGoals.slice(0, 2).map((goal, i) => (
                            <li key={i} className="truncate">{goal}</li>
                          ))}
                          {category.yearlyGoals.length > 2 && (
                            <li className="text-muted-foreground">
                              +{category.yearlyGoals.length - 2} more
                            </li>
                          )}
                        </ul>
                      ) : (
                        <p className="text-sm italic text-muted-foreground">
                          Click to add goals...
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Monthly Needle Movers
                      </p>
                      {category.monthlyFocus.length > 0 ? (
                        <ul className="text-sm list-disc list-inside space-y-1">
                          {category.monthlyFocus.slice(0, 2).map((focus, i) => (
                            <li key={i} className="truncate">{focus}</li>
                          ))}
                          {category.monthlyFocus.length > 2 && (
                            <li className="text-muted-foreground">
                              +{category.monthlyFocus.length - 2} more
                            </li>
                          )}
                        </ul>
                      ) : (
                        <p className="text-sm italic text-muted-foreground">
                          Click to add focus areas...
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Professional RPM Tab */}
        <TabsContent value="professional" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {professionalCategories.map((category) => (
              <Card 
                key={category._id} 
                className="hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => handleEditCategory(category._id)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{category.name}</CardTitle>
                      <CardDescription>RPM Category</CardDescription>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditCategory(category._id);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Purpose</p>
                      {category.purpose ? (
                        <p className="text-sm">{category.purpose}</p>
                      ) : (
                        <p className="text-sm italic text-muted-foreground">
                          Click to add purpose...
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Yearly Goals</p>
                      {category.yearlyGoals.length > 0 ? (
                        <ul className="text-sm list-disc list-inside space-y-1">
                          {category.yearlyGoals.slice(0, 2).map((goal, i) => (
                            <li key={i} className="truncate">{goal}</li>
                          ))}
                          {category.yearlyGoals.length > 2 && (
                            <li className="text-muted-foreground">
                              +{category.yearlyGoals.length - 2} more
                            </li>
                          )}
                        </ul>
                      ) : (
                        <p className="text-sm italic text-muted-foreground">
                          Click to add goals...
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Monthly Needle Movers
                      </p>
                      {category.monthlyFocus.length > 0 ? (
                        <ul className="text-sm list-disc list-inside space-y-1">
                          {category.monthlyFocus.slice(0, 2).map((focus, i) => (
                            <li key={i} className="truncate">{focus}</li>
                          ))}
                          {category.monthlyFocus.length > 2 && (
                            <li className="text-muted-foreground">
                              +{category.monthlyFocus.length - 2} more
                            </li>
                          )}
                        </ul>
                      ) : (
                        <p className="text-sm italic text-muted-foreground">
                          Click to add focus areas...
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Daily Tab */}
        <TabsContent value="daily" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Habit Tracker */}
            <HabitTracker userId={convexUser._id} date={today} />

            {/* 5 to Thrive */}
            <FiveToThrive userId={convexUser._id} date={today} />
          </div>

          {/* Daily Reflection */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Reflection</CardTitle>
              <CardDescription>Journal & gratitude</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="What are you grateful for today? What did you learn? How did you grow?"
                rows={6}
                className="w-full"
              />
              <Button className="mt-4">
                <Edit className="mr-2 h-4 w-4" />
                Save Entry
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* HTA Tab */}
        <TabsContent value="hta" className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">HTA Project Management</h2>
          </div>

          <Tabs defaultValue="product" className="w-full">
            <TabsList>
              <TabsTrigger value="product">Product Dev</TabsTrigger>
              <TabsTrigger value="curriculum">Curriculum Dev</TabsTrigger>
              <TabsTrigger value="marketing">Marketing</TabsTrigger>
              <TabsTrigger value="operations">Operations</TabsTrigger>
            </TabsList>

            <TabsContent value="product" className="space-y-4">
              <ProjectTaskList
                userId={convexUser._id}
                project="hta"
                subProject="product"
                title="Product Development"
                description="Subscription box development & testing"
              />
            </TabsContent>

            <TabsContent value="curriculum" className="space-y-4">
              <ProjectTaskList
                userId={convexUser._id}
                project="hta"
                subProject="curriculum"
                title="Curriculum Development"
                description="Activity creation & content"
              />
            </TabsContent>

            <TabsContent value="marketing" className="space-y-4">
              <ProjectTaskList
                userId={convexUser._id}
                project="hta"
                subProject="marketing"
                title="Marketing"
                description="Brand, content & customer acquisition"
              />
            </TabsContent>

            <TabsContent value="operations" className="space-y-4">
              <ProjectTaskList
                userId={convexUser._id}
                project="hta"
                subProject="operations"
                title="Operations"
                description="Fulfillment, shipping & systems"
              />
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Aspire Tab */}
        <TabsContent value="aspire" className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Aspire Project Management</h2>
          </div>

          <Tabs defaultValue="pali" className="w-full">
            <TabsList>
              <TabsTrigger value="pali">Pali</TabsTrigger>
              <TabsTrigger value="agoura">Agoura</TabsTrigger>
              <TabsTrigger value="spring">Spring League</TabsTrigger>
              <TabsTrigger value="camps">Camps</TabsTrigger>
              <TabsTrigger value="pdp">PDP</TabsTrigger>
              <TabsTrigger value="7v7">7v7</TabsTrigger>
            </TabsList>

            <TabsContent value="pali" className="space-y-4">
              <ProjectTaskList
                userId={convexUser._id}
                project="aspire"
                subProject="pali"
                title="Pali (Region 69)"
                description="Pacific Palisades programs & coordination"
              />
            </TabsContent>

            <TabsContent value="agoura" className="space-y-4">
              <ProjectTaskList
                userId={convexUser._id}
                project="aspire"
                subProject="agoura"
                title="Agoura (Region 4)"
                description="Agoura programs & coordination"
              />
            </TabsContent>

            <TabsContent value="spring" className="space-y-4">
              <ProjectTaskList
                userId={convexUser._id}
                project="aspire"
                subProject="spring"
                title="Spring League"
                description="Season planning & registration"
              />
            </TabsContent>

            <TabsContent value="camps" className="space-y-4">
              <ProjectTaskList
                userId={convexUser._id}
                project="aspire"
                subProject="camps"
                title="Camps"
                description="Camp planning, scheduling & execution"
              />
            </TabsContent>

            <TabsContent value="pdp" className="space-y-4">
              <ProjectTaskList
                userId={convexUser._id}
                project="aspire"
                subProject="pdp"
                title="PDP (Player Development Program)"
                description="Winter training program"
              />
            </TabsContent>

            <TabsContent value="7v7" className="space-y-4">
              <ProjectTaskList
                userId={convexUser._id}
                project="aspire"
                subProject="7v7"
                title="7v7 Tournaments"
                description="Tournament organization & logistics"
              />
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Homeschool Tab */}
        <TabsContent value="homeschool" className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">A & R Academy</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Monthly Itinerary */}
            <ProjectTaskList
              userId={convexUser._id}
              project="homeschool"
              subProject="itinerary"
              title="Monthly Itinerary"
              description="This month's schedule"
            />

            {/* Field Trips */}
            <ProjectTaskList
              userId={convexUser._id}
              project="homeschool"
              subProject="fieldtrips"
              title="Upcoming Field Trips"
              description="Educational outings"
            />

            {/* Learning Outcomes */}
            <ProjectTaskList
              userId={convexUser._id}
              project="homeschool"
              subProject="outcomes"
              title="Learning Outcomes"
              description="Goals & progress tracking"
            />

            {/* Curriculum */}
            <ProjectTaskList
              userId={convexUser._id}
              project="homeschool"
              subProject="curriculum"
              title="Curriculum"
              description="Current studies & resources"
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Category Dialog */}
      <Dialog open={!!editingCategoryId} onOpenChange={() => setEditingCategoryId(null)}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>Edit {editingCategory?.name}</DialogTitle>
            <DialogDescription>
              Update your RPM (Results, Purpose, Massive Action Plan) for this category
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="purpose">
                Purpose (Why is this important?)
              </Label>
              <Textarea
                id="purpose"
                placeholder="What's your deeper purpose for this area of your life?"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="goals">
                Yearly Goals (What results do you want?)
              </Label>
              <Textarea
                id="goals"
                placeholder="List your specific, measurable goals for this year (one per line)..."
                value={yearlyGoals}
                onChange={(e) => setYearlyGoals(e.target.value)}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="needle-movers">
                Monthly Needle Movers (What actions will create the biggest impact?)
              </Label>
              <Textarea
                id="needle-movers"
                placeholder="What are the 3-5 most important actions this month? (one per line)"
                value={needleMovers}
                onChange={(e) => setNeedleMovers(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingCategoryId(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveCategory}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
