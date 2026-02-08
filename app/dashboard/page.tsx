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
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Habit Tracker */}
            <Card>
              <CardHeader>
                <CardTitle>Habit Tracker</CardTitle>
                <CardDescription>Your daily habits</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Habit
                </Button>
              </CardContent>
            </Card>

            {/* 5 to Thrive */}
            <Card>
              <CardHeader>
                <CardTitle>5 to Thrive</CardTitle>
                <CardDescription>Today's must-dos</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Task
                </Button>
              </CardContent>
            </Card>

            {/* Reflection/Journal */}
            <Card>
              <CardHeader>
                <CardTitle>Daily Reflection</CardTitle>
                <CardDescription>Journal & gratitude</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline">
                  <Edit className="mr-2 h-4 w-4" />
                  Write Entry
                </Button>
              </CardContent>
            </Card>
          </div>
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
              <Card>
                <CardHeader>
                  <CardTitle>Product Development</CardTitle>
                  <CardDescription>Subscription box development & testing</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Coming soon: Task management for product development</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="curriculum" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Curriculum Development</CardTitle>
                  <CardDescription>Activity creation & content</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Coming soon: Curriculum task tracking</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="marketing" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Marketing</CardTitle>
                  <CardDescription>Brand, content & customer acquisition</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Coming soon: Marketing campaigns & tracking</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="operations" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Operations</CardTitle>
                  <CardDescription>Fulfillment, shipping & systems</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Coming soon: Operations task management</p>
                </CardContent>
              </Card>
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
              <Card>
                <CardHeader>
                  <CardTitle>Pali (Region 69)</CardTitle>
                  <CardDescription>Pacific Palisades programs & coordination</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Coming soon: Pali program management</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="agoura" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Agoura (Region 4)</CardTitle>
                  <CardDescription>Agoura programs & coordination</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Coming soon: Agoura program management</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="spring" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Spring League</CardTitle>
                  <CardDescription>Season planning & registration</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Coming soon: Spring League management</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="camps" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Camps</CardTitle>
                  <CardDescription>Camp planning, scheduling & execution</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Coming soon: Camp management</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="pdp" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>PDP (Player Development Program)</CardTitle>
                  <CardDescription>Winter training program</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Coming soon: PDP coordination</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="7v7" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>7v7 Tournaments</CardTitle>
                  <CardDescription>Tournament organization & logistics</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Coming soon: 7v7 tournament management</p>
                </CardContent>
              </Card>
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
            <Card>
              <CardHeader>
                <CardTitle>Monthly Itinerary</CardTitle>
                <CardDescription>This month's schedule</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">Coming soon: Monthly planning calendar</p>
              </CardContent>
            </Card>

            {/* Field Trips */}
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Field Trips</CardTitle>
                <CardDescription>Educational outings</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Coming soon: Field trip planning</p>
              </CardContent>
            </Card>

            {/* Learning Outcomes */}
            <Card>
              <CardHeader>
                <CardTitle>Learning Outcomes</CardTitle>
                <CardDescription>Goals & progress tracking</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Coming soon: Learning objectives tracker</p>
              </CardContent>
            </Card>

            {/* Curriculum */}
            <Card>
              <CardHeader>
                <CardTitle>Curriculum</CardTitle>
                <CardDescription>Current studies & resources</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Coming soon: Curriculum management</p>
              </CardContent>
            </Card>
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
