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
import { ReadAloudList } from "@/components/ReadAloudListDB";
import { TripsOnHorizon } from "@/components/TripsOnHorizon";
import { BookLibrary } from "@/components/BookLibraryDB";
import { TaskList } from "@/components/TaskList";
import { SebastianKanban } from "@/components/SebastianKanban";
import { SidebarNew } from "@/components/SidebarNew";
import { RPMCategoryPage } from "@/components/RPMCategoryPage";
import { PersonalOverview } from "@/components/views/PersonalOverview";
import { ProfessionalOverview } from "@/components/views/ProfessionalOverview";
import { HTAOverview } from "@/components/views/HTAOverview";
import { HTASubView } from "@/components/views/HTASubView";
import { AspireOverview } from "@/components/views/AspireOverview";
import { AspireSubView } from "@/components/views/AspireSubView";
import { HomeschoolOverview } from "@/components/views/HomeschoolOverview";
import {
  HomeschoolScheduleView,
  HomeschoolFocusView,
  HomeschoolProjectsView,
  HomeschoolReadAloudView,
  HomeschoolLibraryView,
  HomeschoolFieldTripsView,
  HomeschoolTripsView,
} from "@/components/views/HomeschoolSubViews";

export default function DashboardPage() {
  const { user } = useUser();
  const [currentView, setCurrentView] = useState("daily");
  const [editingCategoryId, setEditingCategoryId] = useState<Id<"rpmCategories"> | null>(null);
  const [purpose, setPurpose] = useState("");
  const [yearlyGoals, setYearlyGoals] = useState("");
  const [needleMovers, setNeedleMovers] = useState("");
  const [importingSchedule, setImportingSchedule] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [updatingPurposes, setUpdatingPurposes] = useState(false);
  const [purposeMessage, setPurposeMessage] = useState<string | null>(null);
  const [importingBooks, setImportingBooks] = useState(false);
  const [bookMessage, setBookMessage] = useState<string | null>(null);
  const [importingHTATasks, setImportingHTATasks] = useState(false);
  const [htaMessage, setHTAMessage] = useState<string | null>(null);
  const [importingSebastianTasks, setImportingSebastianTasks] = useState(false);
  const [sebastianMessage, setSebastianMessage] = useState<string | null>(null);
  const [updatingAllGoals, setUpdatingAllGoals] = useState(false);
  const [allGoalsMessage, setAllGoalsMessage] = useState<string | null>(null);
  
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
  const importBooks = useMutation(api.admin.importBookLibrary);
  const importHTATasks = useMutation(api.admin.importHTATasks);
  const updateAllRPMGoals = useMutation(api.admin.updateAllRPMGoals);
  const seedSebastianTasks = useMutation(api.seedSebastianTasks.seedInitialTasks);

  // Get today's date in PST (with auto-update at midnight PST)
  const getPSTDate = () => {
    const now = new Date();
    // Convert to PST (America/Los_Angeles)
    const pstDate = new Date(now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
    const year = pstDate.getFullYear();
    const month = String(pstDate.getMonth() + 1).padStart(2, '0');
    const day = String(pstDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [today, setToday] = useState(() => getPSTDate());

  // Update date at midnight PST
  useEffect(() => {
    const checkDate = () => {
      const currentDate = getPSTDate();
      if (currentDate !== today) {
        setToday(currentDate);
      }
    };

    // Check every minute for date change
    const interval = setInterval(checkDate, 60000);
    return () => clearInterval(interval);
  }, [today]);

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

  const handleImportBooks = async () => {
    if (!user) return;
    
    setImportingBooks(true);
    setBookMessage(null);

    try {
      const result = await importBooks({
        clerkId: user.id,
      });
      setBookMessage(result.message || "Books imported successfully!");
      setTimeout(() => setBookMessage(null), 3000);
    } catch (error: any) {
      setBookMessage("Error: " + (error.message || "Failed to import books"));
    } finally {
      setImportingBooks(false);
    }
  };

  const handleImportHTATasks = async () => {
    if (!user) return;
    
    setImportingHTATasks(true);
    setHTAMessage(null);

    try {
      const result = await importHTATasks({
        clerkId: user.id,
        clearFirst: true, // Always clear old tasks before importing
      });
      setHTAMessage(result.message || "HTA tasks imported successfully!");
      setTimeout(() => setHTAMessage(null), 3000);
    } catch (error: any) {
      setHTAMessage("Error: " + (error.message || "Failed to import HTA tasks"));
    } finally {
      setImportingHTATasks(false);
    }
  };

  const handleUpdateAllRPMGoals = async () => {
    if (!user) return;
    
    setUpdatingAllGoals(true);
    setAllGoalsMessage(null);

    try {
      const result = await updateAllRPMGoals({
        clerkId: user.id,
      });
      setAllGoalsMessage(result.message || "All RPM goals updated successfully!");
      setTimeout(() => setAllGoalsMessage(null), 5000);
    } catch (error: any) {
      setAllGoalsMessage("Error: " + (error.message || "Failed to update goals"));
    } finally {
      setUpdatingAllGoals(false);
    }
  };

  const handleImportSebastianTasks = async () => {
    if (!user) return;
    
    setImportingSebastianTasks(true);
    setSebastianMessage(null);

    try {
      const result = await seedSebastianTasks({
        clerkId: user.id,
      });
      setSebastianMessage(result.message || "Imported Sebastian's tasks successfully!");
      setTimeout(() => setSebastianMessage(null), 5000);
    } catch (error: any) {
      setSebastianMessage("Error: " + (error.message || "Failed to import tasks"));
    } finally {
      setImportingSebastianTasks(false);
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

  // Helper function to render content based on current view
  const renderContent = () => {
    // Personal category pages
    if (currentView.startsWith("personal-category-")) {
      const categoryId = currentView.replace("personal-category-", "") as Id<"rpmCategories">;
      return <RPMCategoryPage categoryId={categoryId} />;
    }

    // Professional category pages
    if (currentView.startsWith("professional-category-")) {
      const categoryId = currentView.replace("professional-category-", "") as Id<"rpmCategories">;
      return <RPMCategoryPage categoryId={categoryId} />;
    }

    // Main views
    switch (currentView) {
      case "daily":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">
                Daily - {new Date(today + 'T00:00:00').toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  timeZone: 'America/Los_Angeles'
                })}
              </h2>
            </div>
            <MorningMindset userId={convexUser._id} date={today} />
            <div className="grid gap-6 md:grid-cols-2">
              <HabitTracker userId={convexUser._id} date={today} />
              <FiveToThrive userId={convexUser._id} date={today} />
            </div>
            <EveningReflection userId={convexUser._id} date={today} />
          </div>
        );

      case "personal-overview":
        return (
          <PersonalOverview
            categories={personalCategories}
            onEditCategory={handleEditCategory}
            onViewCategory={(id) => setCurrentView(`personal-category-${id}`)}
          />
        );

      case "professional-overview":
        return (
          <ProfessionalOverview
            categories={professionalCategories}
            onEditCategory={handleEditCategory}
            onViewCategory={(id) => setCurrentView(`professional-category-${id}`)}
          />
        );

      case "sebastian":
        return (
          <div className="space-y-6">
            <div className="mb-4">
              <h2 className="text-2xl font-bold">Sebastian's Task Board</h2>
              <p className="text-muted-foreground">AI sidekick workspace</p>
            </div>
            <SebastianKanban userId={convexUser._id} />
          </div>
        );

      // HTA views
      case "hta-overview":
        return <HTAOverview userId={convexUser._id} />;
      case "hta-gtm":
        return <HTASubView userId={convexUser._id} subProject="gtm" title="GTM Timeline" description="Launch milestones, key dates & GTM strategy" />;
      case "hta-product":
        return <HTASubView userId={convexUser._id} subProject="product" title="Product Development" description="Subscription box development & testing" />;
      case "hta-curriculum":
        return <HTASubView userId={convexUser._id} subProject="curriculum" title="Curriculum Development" description="Activity creation & content" />;
      case "hta-marketing":
        return <HTASubView userId={convexUser._id} subProject="marketing" title="Marketing" description="Brand, content & customer acquisition" />;
      case "hta-operations":
        return <HTASubView userId={convexUser._id} subProject="operations" title="Operations" description="Fulfillment, shipping & systems" />;

      // Aspire views
      case "aspire-overview":
        return <AspireOverview userId={convexUser._id} />;
      case "aspire-pali":
        return <AspireSubView userId={convexUser._id} subProject="pali" title="Pali (Region 69)" description="Pacific Palisades programs & coordination" />;
      case "aspire-agoura":
        return <AspireSubView userId={convexUser._id} subProject="agoura" title="Agoura (Region 4)" description="Agoura programs & coordination" />;
      case "aspire-spring":
        return <AspireSubView userId={convexUser._id} subProject="spring" title="Spring League" description="Season planning & registration" />;
      case "aspire-camps":
        return <AspireSubView userId={convexUser._id} subProject="camps" title="Camps" description="Camp planning & execution" />;
      case "aspire-pdp":
        return <AspireSubView userId={convexUser._id} subProject="pdp" title="PDP" description="Winter training program" />;
      case "aspire-7v7":
        return <AspireSubView userId={convexUser._id} subProject="7v7" title="7v7 Tournaments" description="Tournament organization" />;

      // Homeschool views
      case "homeschool-overview":
        return <HomeschoolOverview userId={convexUser._id} />;
      case "homeschool-schedule":
        return <HomeschoolScheduleView userId={convexUser._id} />;
      case "homeschool-focus":
        return <HomeschoolFocusView userId={convexUser._id} />;
      case "homeschool-projects":
        return <HomeschoolProjectsView userId={convexUser._id} />;
      case "homeschool-readaloud":
        return <HomeschoolReadAloudView userId={convexUser._id} />;
      case "homeschool-library":
        return <HomeschoolLibraryView userId={convexUser._id} />;
      case "homeschool-fieldtrips":
        return <HomeschoolFieldTripsView userId={convexUser._id} />;
      case "homeschool-trips":
        return <HomeschoolTripsView userId={convexUser._id} />;

      default:
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-400">View not found</h2>
            <p className="text-muted-foreground mt-2">Current view: {currentView}</p>
          </div>
        );
    }
  };

  return (
    <>
      {/* Sidebar */}
      <SidebarNew
        userId={convexUser._id} 
        currentView={currentView} 
        onViewChange={setCurrentView} 
      />

      <div className="lg:pl-64">
        <div className="container mx-auto py-8 px-4">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-amber-500 to-red-600 bg-clip-text text-transparent">
              Mission Control
            </h1>
            <p className="text-muted-foreground">
              Hi {user?.firstName || "Corinne"}. Let's make today epic!
            </p>
          </div>

          {/* Render current view content */}
          {renderContent()}

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
      </div>
    </>
  );
}
