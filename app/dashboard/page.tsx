"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit } from "lucide-react";

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
              <Card key={category} className="hover:shadow-lg transition-shadow cursor-pointer group">
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
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
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

        {/* Professional RPM Tab */}
        <TabsContent value="professional" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {professionalCategories.map((category) => (
              <Card key={category} className="hover:shadow-lg transition-shadow cursor-pointer group">
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
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
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

          <Tabs defaultValue="camps" className="w-full">
            <TabsList>
              <TabsTrigger value="camps">Camps</TabsTrigger>
              <TabsTrigger value="tournaments">Tournaments</TabsTrigger>
              <TabsTrigger value="leagues">Leagues</TabsTrigger>
              <TabsTrigger value="coaching">Coach Training</TabsTrigger>
            </TabsList>

            <TabsContent value="camps" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Soccer Camps</CardTitle>
                  <CardDescription>Planning, scheduling & execution</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Coming soon: Camp management & scheduling</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tournaments" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Tournaments</CardTitle>
                  <CardDescription>Organization & logistics</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Coming soon: Tournament planning tools</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="leagues" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Leagues</CardTitle>
                  <CardDescription>Season planning & coordination</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Coming soon: League management</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="coaching" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Coach Training</CardTitle>
                  <CardDescription>Development & education programs</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Coming soon: Coach training coordination</p>
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
    </div>
  );
}
