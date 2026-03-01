"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
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
import { HabitTracker } from "@/components/HabitTracker";
import { FiveToThrive } from "@/components/FiveToThrive";
import { MorningMindset } from "@/components/MorningMindset";
import { AgentIdeasWidget } from "@/components/AgentIdeasWidget";
import { EveningReflection } from "@/components/EveningReflection";
import { HealthWidget } from "@/components/HealthWidget";
import { HealthDashboard } from "@/components/views/HealthDashboard";
import { SebastianWorkspace } from "@/components/SebastianWorkspace";
import AgentHuddle from "@/components/AgentHuddle";
import { ContentPipeline } from "@/components/ContentPipeline";
import { MavenVerificationDashboard } from "@/components/MavenVerificationDashboard";
import { MemoryView } from "@/components/MemoryView";
import { EngagementHabits } from "@/components/EngagementHabits";
import { SidebarNew } from "@/components/SidebarNew";
import { QuickWinsCard } from "@/components/QuickWinsCard";
import { FamilyMeetingDashboard } from "@/components/FamilyMeetingDashboard";
import { RPMCategoryPage } from "@/components/RPMCategoryPage";
import { PersonalOverview } from "@/components/views/PersonalOverview";
import { ProfessionalOverview } from "@/components/views/ProfessionalOverview";
import { HTAOverview } from "@/components/views/HTAOverview";
import { HTASubView } from "@/components/views/HTASubView";
import { AspireOverview } from "@/components/views/AspireOverview";
import { CoachHubView } from "@/components/views/CoachHubView";
import { FamilyCRM } from "@/components/FamilyCRM";
import { PersonalCRM, SurpriseCard } from "@/components/PersonalCRM";
import { AspireSubView } from "@/components/views/AspireSubView";
import { AspireSpringView } from "@/components/views/AspireSpringView";
import { AspireCampsView } from "@/components/views/AspireCampsView";
import { AspirePDPView } from "@/components/views/AspirePDPView";
import { Aspire7v7View } from "@/components/views/Aspire7v7View";
import { HomeschoolOverview } from "@/components/views/HomeschoolOverview";
import { HomeschoolDailyView } from "@/components/views/HomeschoolDailyView";
import HomeschoolProgressView from "@/components/views/HomeschoolProgressView";
import { HomeschoolResourcesView } from "@/components/views/HomeschoolResourcesView";
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
            {user?.id && <SurpriseCard clerkId={user.id} />}
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              <HealthWidget userId={convexUser._id} />
              <HabitTracker userId={convexUser._id} date={today} />
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <FiveToThrive userId={convexUser._id} date={today} />
              <QuickWinsCard userId={convexUser._id} date={today} />
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
        return <SebastianWorkspace userId={convexUser._id} />;

      // Agent Huddle channels
      case "agent-huddle-main":
        return (
          <div className="h-[calc(100vh-120px)]">
            <AgentHuddle initialChannel="main" />
          </div>
        );
      case "agent-huddle-aspire-ops":
        return (
          <div className="h-[calc(100vh-120px)]">
            <AgentHuddle initialChannel="aspire-ops" />
          </div>
        );
      case "agent-huddle-hta-launch":
        return (
          <div className="h-[calc(100vh-120px)]">
            <AgentHuddle initialChannel="hta-launch" />
          </div>
        );
      case "agent-huddle-family":
        return (
          <div className="h-[calc(100vh-120px)]">
            <AgentHuddle initialChannel="family" />
          </div>
        );
      case "agent-huddle-ideas":
        return (
          <div className="h-[calc(100vh-120px)]">
            <AgentHuddle initialChannel="ideas" />
          </div>
        );

      // Legacy views
      case "agent-ideas":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <span>💡</span> Agent Ideas
                </h2>
                <p className="text-muted-foreground text-sm mt-1">
                  Ideas and suggestions from your AI agents
                </p>
              </div>
            </div>
            <AgentIdeasWidget />
          </div>
        );

      case "agent-huddle":
        return (
          <div className="h-[calc(100vh-120px)]">
            <AgentHuddle initialChannel="main" />
          </div>
        );

      case "content-pipeline":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <span>🎯</span> Content Pipeline
                </h2>
                <p className="text-muted-foreground text-sm mt-1">
                  Maven&apos;s drafts waiting for your review &amp; approval
                </p>
              </div>
            </div>
            <MavenVerificationDashboard />
            <ContentPipeline />
          </div>
        );

      case "memory":
        return <MemoryView />;

      case "engagement-habits":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <span>📈</span> Engagement Habits
                </h2>
                <p className="text-muted-foreground text-sm mt-1">
                  Track your daily social media engagement to build consistency
                </p>
              </div>
            </div>
            <EngagementHabits userId={convexUser._id} />
          </div>
        );

      case "family-meeting":
        return <FamilyMeetingDashboard userId={convexUser._id} />;

      case "health":
        return <HealthDashboard userId={convexUser._id} />;

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
        return <AspireSpringView userId={convexUser._id} />;
      case "aspire-camps":
        return <AspireCampsView userId={convexUser._id} />;
      case "aspire-pdp":
        return <AspirePDPView userId={convexUser._id} />;
      case "aspire-7v7":
        return <Aspire7v7View userId={convexUser._id} />;
      case "aspire-families":
        return <FamilyCRM />;
      case "aspire-coach-hub":
        return <CoachHubView />;

      case "personal-crm":
        return (
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Personal CRM</h2>
            <p className="text-sm text-gray-500 mb-4">Your people - friends, family, mentors. Remember what matters to them.</p>
            <PersonalCRM />
          </div>
        );

      // Homeschool views
      case "homeschool-overview":
        return <HomeschoolOverview userId={convexUser._id} />;
      case "homeschool-daily":
        return <HomeschoolDailyView userId={convexUser._id} />;
      case "homeschool-progress":
        return <HomeschoolProgressView />;
      case "homeschool-resources":
        return <HomeschoolResourcesView />;
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

      <div className="lg:pl-64 min-h-screen bg-black">
        <div className="container mx-auto py-8 px-4">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-amber-500 to-red-600 bg-clip-text text-transparent">
              Mission Control
            </h1>
            <p className="text-muted-foreground">
              Hi {user?.firstName || "Corinne"}. Let&apos;s make today epic!
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
