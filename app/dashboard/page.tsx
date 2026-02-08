"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TaskList } from "@/components/TaskList";

export default function DashboardPage() {
  const { user } = useUser();
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [purpose, setPurpose] = useState("");
  const [yearlyGoals, setYearlyGoals] = useState("");
  const [needleMovers, setNeedleMovers] = useState("");
  
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

  const handleEditCategory = (category: string) => {
    setEditingCategory(category);
    // TODO: Load existing data from Convex
    setPurpose("");
    setYearlyGoals("");
    setNeedleMovers("");
  };

  const handleSaveCategory = () => {
    // TODO: Save to Convex
    console.log("Saving category:", editingCategory, {
      purpose,
      yearlyGoals,
      needleMovers,
    });
    setEditingCategory(null);
  };

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
                key={category} 
                className="hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => handleEditCategory(category)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{category}</CardTitle>
                      <CardDescription>RPM Category</CardDescription>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditCategory(category);
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
                      <p className="text-sm italic text-muted-foreground">
                        Click to add purpose...
                      </p>
                    </div>
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

        {/* Professional RPM Tab */}
        <TabsContent value="professional" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {professionalCategories.map((category) => (
              <Card 
                key={category} 
                className="hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => handleEditCategory(category)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{category}</CardTitle>
                      <CardDescription>RPM Category</CardDescription>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditCategory(category);
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
                      <p className="text-sm italic text-muted-foreground">
                        Click to add purpose...
                      </p>
                    </div>
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

        {/* Daily Tab */}
        <TabsContent value="daily" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Habit Tracker */}
            <TaskList
              title="Habit Tracker"
              description="Your daily habits"
            />

            {/* 5 to Thrive */}
            <TaskList
              title="5 to Thrive"
              description="Today's must-dos"
            />
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
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Task
            </Button>
          </div>

          <Tabs defaultValue="product" className="w-full">
            <TabsList>
              <TabsTrigger value="product">Product Dev</TabsTrigger>
              <TabsTrigger value="curriculum">Curriculum Dev</TabsTrigger>
              <TabsTrigger value="marketing">Marketing</TabsTrigger>
              <TabsTrigger value="operations">Operations</TabsTrigger>
            </TabsList>

            <TabsContent value="product" className="space-y-4">
              <TaskList
                title="Product Development"
                description="Subscription box development & testing"
              />
            </TabsContent>

            <TabsContent value="curriculum" className="space-y-4">
              <TaskList
                title="Curriculum Development"
                description="Activity creation & content"
              />
            </TabsContent>

            <TabsContent value="marketing" className="space-y-4">
              <TaskList
                title="Marketing"
                description="Brand, content & customer acquisition"
              />
            </TabsContent>

            <TabsContent value="operations" className="space-y-4">
              <TaskList
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
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Task
            </Button>
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
              <TaskList
                title="Pali (Region 69)"
                description="Pacific Palisades programs & coordination"
              />
            </TabsContent>

            <TabsContent value="agoura" className="space-y-4">
              <TaskList
                title="Agoura (Region 4)"
                description="Agoura programs & coordination"
              />
            </TabsContent>

            <TabsContent value="spring" className="space-y-4">
              <TaskList
                title="Spring League"
                description="Season planning & registration"
              />
            </TabsContent>

            <TabsContent value="camps" className="space-y-4">
              <TaskList
                title="Camps"
                description="Camp planning, scheduling & execution"
              />
            </TabsContent>

            <TabsContent value="pdp" className="space-y-4">
              <TaskList
                title="PDP (Player Development Program)"
                description="Winter training program"
              />
            </TabsContent>

            <TabsContent value="7v7" className="space-y-4">
              <TaskList
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
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Monthly Itinerary */}
            <TaskList
              title="Monthly Itinerary"
              description="This month's schedule"
            />

            {/* Field Trips */}
            <TaskList
              title="Upcoming Field Trips"
              description="Educational outings"
            />

            {/* Learning Outcomes */}
            <TaskList
              title="Learning Outcomes"
              description="Goals & progress tracking"
            />

            {/* Curriculum */}
            <TaskList
              title="Curriculum"
              description="Current studies & resources"
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Category Dialog */}
      <Dialog open={!!editingCategory} onOpenChange={() => setEditingCategory(null)}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>Edit {editingCategory}</DialogTitle>
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
                placeholder="List your specific, measurable goals for this year..."
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
                placeholder="What are the 3-5 most important actions this month?"
                value={needleMovers}
                onChange={(e) => setNeedleMovers(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingCategory(null)}>
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
