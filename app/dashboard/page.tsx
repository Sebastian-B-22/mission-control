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
import { MorningMindset } from "@/components/MorningMindset";
import { EveningReflection } from "@/components/EveningReflection";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { FieldTripList } from "@/components/FieldTripList";
import { WeeklySchedule } from "@/components/WeeklySchedule";
import { HomeschoolObjectives } from "@/components/HomeschoolObjectives";
import { MonthlyFocus } from "@/components/MonthlyFocus";
import { ProjectsThisMonth } from "@/components/ProjectsThisMonth";
import { ReadAloudList } from "@/components/ReadAloudList";
import { TripsOnHorizon } from "@/components/TripsOnHorizon";
import { BookLibrary } from "@/components/BookLibrary";
import { TaskList } from "@/components/TaskList";

export default function DashboardPage() {
  const { user } = useUser();
  const [editingCategoryId, setEditingCategoryId] = useState<Id<"rpmCategories"> | null>(null);
  const [purpose, setPurpose] = useState("");
  const [yearlyGoals, setYearlyGoals] = useState("");
  const [needleMovers, setNeedleMovers] = useState("");
  const [importingSchedule, setImportingSchedule] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [updatingPurposes, setUpdatingPurposes] = useState(false);
  const [purposeMessage, setPurposeMessage] = useState<string | null>(null);
  
  // Get or create user in Convex
  const convexUser = useQuery(
    api.users.getUserByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );
  const createUser = useMutation(api.users.createUser);

  // Check user setup
  const userSetup = useQuery(
    api.admin.checkUserSetup,
    user?.id ? { clerkId: user.id } : "skip"
  );
  const manuallyInitialize = useMutation(api.admin.manuallyInitializeUser);

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

  // Auto-initialize if missing team members
  useEffect(() => {
    if (user && userSetup && userSetup.exists && userSetup.teamMembersCount === 0) {
      console.log("Initializing user data...");
      manuallyInitialize({ clerkId: user.id });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, userSetup]);

  // Get RPM categories
  const categories = useQuery(
    api.rpm.getCategoriesByUser,
    convexUser ? { userId: convexUser._id } : "skip"
  );

  const updateCategory = useMutation(api.rpm.updateCategory);
  const importSchedule = useMutation(api.admin.importWeeklySchedule);
  const updateRPMPurposes = useMutation(api.admin.updateRPMPurposes);

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

  const handleImportSchedule = async () => {
    if (!user) return;
    
    setImportingSchedule(true);
    setImportMessage(null);

    try {
      const result = await importSchedule({
        clerkId: user.id,
        clearExisting: true,
      });
      setImportMessage(result.message || "Schedule imported successfully!");
    } catch (error: any) {
      setImportMessage("Error: " + (error.message || "Failed to import schedule"));
    } finally {
      setImportingSchedule(false);
    }
  };

  const handleUpdatePurposes = async () => {
    if (!user) return;
    
    setUpdatingPurposes(true);
    setPurposeMessage(null);

    try {
      const result = await updateRPMPurposes({
        clerkId: user.id,
      });
      setPurposeMessage(result.message || "Purposes updated successfully!");
      // Reload to show updated purposes
      setTimeout(() => setPurposeMessage(null), 3000);
    } catch (error: any) {
      setPurposeMessage("Error: " + (error.message || "Failed to update purposes"));
    } finally {
      setUpdatingPurposes(false);
    }
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
          <div className="flex items-center justify-end mb-4">
            <Button 
              onClick={handleUpdatePurposes}
              disabled={updatingPurposes}
              variant="outline"
              size="sm"
            >
              {updatingPurposes ? "Updating..." : "Update Category Purposes"}
            </Button>
          </div>

          {purposeMessage && (
            <div className={`p-3 rounded-lg text-sm ${
              purposeMessage.startsWith("Error") 
                ? "bg-red-50 text-red-800 border border-red-200" 
                : "bg-green-50 text-green-800 border border-green-200"
            }`}>
              {purposeMessage}
            </div>
          )}

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
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Professional RPM Tab */}
        <TabsContent value="professional" className="space-y-4">
          <div className="flex items-center justify-end mb-4">
            <Button 
              onClick={handleUpdatePurposes}
              disabled={updatingPurposes}
              variant="outline"
              size="sm"
            >
              {updatingPurposes ? "Updating..." : "Update Category Purposes"}
            </Button>
          </div>

          {purposeMessage && (
            <div className={`p-3 rounded-lg text-sm ${
              purposeMessage.startsWith("Error") 
                ? "bg-red-50 text-red-800 border border-red-200" 
                : "bg-green-50 text-green-800 border border-green-200"
            }`}>
              {purposeMessage}
            </div>
          )}

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
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Daily Tab */}
        <TabsContent value="daily" className="space-y-6">
          {/* Morning Mindset - Top */}
          <MorningMindset userId={convexUser._id} date={today} />

          {/* Habits & 5 to Thrive - Middle */}
          <div className="grid gap-6 md:grid-cols-2">
            <HabitTracker userId={convexUser._id} date={today} />
            <FiveToThrive userId={convexUser._id} date={today} />
          </div>

          {/* Evening Reflection - Bottom */}
          <EveningReflection userId={convexUser._id} date={today} />
        </TabsContent>

        {/* HTA Tab */}
        <TabsContent value="hta" className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">HTA Project Management</h2>
          </div>

          <Tabs defaultValue="gtm" className="w-full">
            <TabsList>
              <TabsTrigger value="gtm">GTM Timeline</TabsTrigger>
              <TabsTrigger value="product">Product Dev</TabsTrigger>
              <TabsTrigger value="curriculum">Curriculum Dev</TabsTrigger>
              <TabsTrigger value="marketing">Marketing</TabsTrigger>
              <TabsTrigger value="operations">Operations</TabsTrigger>
            </TabsList>

            <TabsContent value="gtm" className="space-y-4">
              <ProjectTaskList
                userId={convexUser._id}
                project="hta"
                subProject="gtm"
                title="Go-To-Market Timeline"
                description="Launch milestones, key dates & GTM strategy"
              />
            </TabsContent>

            <TabsContent value="product" className="space-y-4">
              <ErrorBoundary>
                <ProjectTaskList
                  userId={convexUser._id}
                  project="hta"
                  subProject="product"
                  title="Product Development"
                  description="Subscription box development & testing"
                />
              </ErrorBoundary>
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

          <Tabs defaultValue="spring" className="w-full">
            <TabsList>
              <TabsTrigger value="spring">Spring League</TabsTrigger>
              <TabsTrigger value="camps">Camps</TabsTrigger>
              <TabsTrigger value="pdp">PDP</TabsTrigger>
              <TabsTrigger value="7v7">7v7</TabsTrigger>
              <TabsTrigger value="pali">Pali</TabsTrigger>
              <TabsTrigger value="agoura">Agoura</TabsTrigger>
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
              <div className="grid gap-6 md:grid-cols-2">
                <ProjectTaskList
                  userId={convexUser._id}
                  project="aspire"
                  subProject="spring-agoura"
                  title="Agoura Spring League"
                  description="Region 4 season planning & registration"
                />
                <ProjectTaskList
                  userId={convexUser._id}
                  project="aspire"
                  subProject="spring-pali"
                  title="Pali Spring League"
                  description="Region 69 season planning & registration"
                />
              </div>
            </TabsContent>

            <TabsContent value="camps" className="space-y-4">
              <div className="grid gap-6 md:grid-cols-2">
                <ProjectTaskList
                  userId={convexUser._id}
                  project="aspire"
                  subProject="camps-agoura"
                  title="Agoura Camps"
                  description="Region 4 camp planning & execution"
                />
                <ProjectTaskList
                  userId={convexUser._id}
                  project="aspire"
                  subProject="camps-pali"
                  title="Pali Camps"
                  description="Region 69 camp planning & execution"
                />
              </div>
            </TabsContent>

            <TabsContent value="pdp" className="space-y-4">
              <div className="grid gap-6 md:grid-cols-2">
                <ProjectTaskList
                  userId={convexUser._id}
                  project="aspire"
                  subProject="pdp-agoura"
                  title="Agoura PDP"
                  description="Region 4 winter training program"
                />
                <ProjectTaskList
                  userId={convexUser._id}
                  project="aspire"
                  subProject="pdp-pali"
                  title="Pali PDP"
                  description="Region 69 winter training program"
                />
              </div>
            </TabsContent>

            <TabsContent value="7v7" className="space-y-4">
              <div className="grid gap-6 md:grid-cols-2">
                <ProjectTaskList
                  userId={convexUser._id}
                  project="aspire"
                  subProject="7v7-agoura"
                  title="Agoura 7v7 Tournaments"
                  description="Region 4 tournament organization"
                />
                <ProjectTaskList
                  userId={convexUser._id}
                  project="aspire"
                  subProject="7v7-pali"
                  title="Pali 7v7 Tournaments"
                  description="Region 69 tournament organization"
                />
              </div>
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Homeschool Tab */}
        <TabsContent value="homeschool" className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold">A & R Academy</h2>
            </div>
            <Button 
              onClick={handleImportSchedule}
              disabled={importingSchedule}
              variant="outline"
              size="sm"
            >
              {importingSchedule ? "Importing..." : "Import Weekly Schedule"}
            </Button>
          </div>

          {importMessage && (
            <div className={`p-3 rounded-lg text-sm ${
              importMessage.startsWith("Error") 
                ? "bg-red-50 text-red-800 border border-red-200" 
                : "bg-green-50 text-green-800 border border-green-200"
            }`}>
              {importMessage}
            </div>
          )}

          {/* Homeschool Objectives - Slim Banner */}
          <HomeschoolObjectives />

          {/* Weekly Schedule - Full Width */}
          <WeeklySchedule userId={convexUser._id} />

          {/* Two Column Section */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Left Column */}
            <div className="space-y-6">
              <MonthlyFocus />
              <ProjectsThisMonth />
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <ReadAloudList />
              <TripsOnHorizon />
            </div>
          </div>

          {/* Long Lists - Bottom Section */}
          <div className="grid gap-6 md:grid-cols-2">
            <FieldTripList userId={convexUser._id} />
            <BookLibrary />
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
