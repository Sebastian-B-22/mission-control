"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { BookOpen, Plus, Sparkles, Target, Library } from "lucide-react";

const CATEGORIES = ["voice", "business", "platform", "contentType", "section", "ideaType"] as const;
type TrainingCategory = (typeof CATEGORIES)[number];

const CATEGORY_LABELS: Record<TrainingCategory, string> = {
  voice: "Voice",
  business: "Business",
  platform: "Platform",
  contentType: "Content Type",
  section: "Section",
  ideaType: "Idea Type",
};

export function AgentTrainingCenter() {
  const [activeTab, setActiveTab] = useState<TrainingCategory>("voice");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    category: "voice" as TrainingCategory,
    key: "",
    title: "",
    content: "",
  });

  const training = useQuery(api.agentTraining.list, { activeOnly: false }) || [];
  const createTraining = useMutation(api.agentTraining.create);
  const updateTraining = useMutation(api.agentTraining.update);

  const grouped = useMemo(() => {
    return CATEGORIES.reduce((acc, category) => {
      acc[category] = training.filter((item: any) => item.category === category);
      return acc;
    }, {} as Record<TrainingCategory, any[]>);
  }, [training]);

  const activeCount = training.filter((item: any) => item.active).length;

  const handleCreate = async () => {
    if (!form.key.trim() || !form.title.trim() || !form.content.trim()) return;
    await createTraining({
      category: form.category,
      key: form.key.trim(),
      title: form.title.trim(),
      content: form.content.trim(),
      updatedBy: "sebastian",
      active: true,
    });
    setForm({ category: form.category, key: "", title: "", content: "" });
    setShowCreate(false);
    setActiveTab(form.category);
  };

  const toggleActive = async (item: any) => {
    await updateTraining({
      id: item._id,
      active: !item.active,
      updatedBy: "sebastian",
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Library className="h-8 w-8 text-cyan-500" />
              <div>
                <div className="text-2xl font-bold">{training.length}</div>
                <p className="text-sm text-muted-foreground">training entries</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Target className="h-8 w-8 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{activeCount}</div>
                <p className="text-sm text-muted-foreground">active right now</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium">Training Center</div>
              <p className="text-sm text-muted-foreground">Manage the instruction stack Sebastian and the agents should follow.</p>
            </div>
            <Dialog open={showCreate} onOpenChange={setShowCreate}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add rule
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add training entry</DialogTitle>
                  <DialogDescription>
                    Create a reusable instruction block for voice, business logic, platform rules, or idea handling.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={form.category} onValueChange={(value: TrainingCategory) => setForm((prev) => ({ ...prev, category: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((category) => (
                          <SelectItem key={category} value={category}>{CATEGORY_LABELS[category]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Key</Label>
                    <Input value={form.key} onChange={(e) => setForm((prev) => ({ ...prev, key: e.target.value }))} placeholder="maven-tone-x-posts" />
                  </div>
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} placeholder="X posts should feel grounded, sharp, and useful" />
                  </div>
                  <div className="space-y-2">
                    <Label>Content</Label>
                    <Textarea value={form.content} onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))} rows={7} placeholder="Write the actual instruction the agents should follow..." />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
                  <Button onClick={handleCreate}>Save entry</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-cyan-500" />
            Agent Training Center
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TrainingCategory)}>
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
              {CATEGORIES.map((category) => (
                <TabsTrigger key={category} value={category} className="text-xs">
                  {CATEGORY_LABELS[category]}
                </TabsTrigger>
              ))}
            </TabsList>

            {CATEGORIES.map((category) => (
              <TabsContent key={category} value={category} className="mt-4 space-y-3">
                {grouped[category].length === 0 ? (
                  <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                    <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    No {CATEGORY_LABELS[category].toLowerCase()} training yet.
                  </div>
                ) : (
                  grouped[category].map((item: any) => (
                    <div key={item._id} className="rounded-lg border p-4 space-y-3 bg-card">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold">{item.title}</h3>
                            <Badge variant={item.active ? "default" : "secondary"}>{item.active ? "Active" : "Inactive"}</Badge>
                            <Badge variant="outline">{item.key}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Updated by {item.updatedBy} • {new Date(item.updatedAt).toLocaleString()}
                          </p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => toggleActive(item)}>
                          {item.active ? "Deactivate" : "Activate"}
                        </Button>
                      </div>
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{item.content}</p>
                    </div>
                  ))
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
