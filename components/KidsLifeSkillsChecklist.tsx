"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Medal, Printer, Sparkles, Star, Trophy } from "lucide-react";

type Kid = "anthony" | "roma";
type Status = "not-started" | "learned" | "practiced" | "owned" | "taught";

type LifeSkill = {
  id: string;
  category: string;
  skill: string;
  starter?: boolean;
};

const kids: Record<Kid, { name: string; color: string }> = {
  anthony: { name: "Anthony", color: "text-blue-300" },
  roma: { name: "Roma", color: "text-fuchsia-300" },
};

const statusLabels: Record<Status, string> = {
  "not-started": "Not yet",
  learned: "Learned",
  practiced: "Practiced",
  owned: "Owned",
  taught: "Taught",
};

const statusOrder: Status[] = ["not-started", "learned", "practiced", "owned", "taught"];

const xpByStatus: Record<Status, number> = {
  "not-started": 0,
  learned: 10,
  practiced: 25,
  owned: 50,
  taught: 75,
};

const badgeByCategory: Record<string, string> = {
  "Feed Yourself": "Kitchen Captain",
  "Body + Health": "Body Boss",
  "Run a Home": "Home Hero",
  "Car + Practical Mechanics": "Garage Guide",
  "Clothing + Presentation": "Sharp Dresser",
  "Money Smarts": "Money Boss",
  "Digital + AI Smarts": "Digital Detective",
  Communication: "Polite Pro",
  "Hospitality + Hosting": "Host With the Most",
  "Time + Responsibility": "Time Ninja",
  "Safety + Navigation": "Crisis Capable",
  "Travel Independence": "Trip Captain",
  "Outdoor + Tool Skills": "Survival Scout",
};

const skills: LifeSkill[] = [
  { id: "pancakes", category: "Feed Yourself", skill: "Make pancakes or waffles", starter: true },
  { id: "smoothie", category: "Feed Yourself", skill: "Make a balanced smoothie", starter: true },
  { id: "lunch", category: "Feed Yourself", skill: "Make and pack a balanced lunch", starter: true },
  { id: "family-dinner", category: "Feed Yourself", skill: "Plan and make family dinner" },
  { id: "grocery-shop", category: "Feed Yourself", skill: "Grocery shop from a list and stay within a budget" },
  { id: "recipe", category: "Feed Yourself", skill: "Read and follow a simple recipe" },
  { id: "kitchen-clean", category: "Feed Yourself", skill: "Clean as you cook and reset the kitchen" },
  { id: "load-dishwasher", category: "Feed Yourself", skill: "Load the dishwasher correctly" },
  { id: "hand-wash-dishes", category: "Feed Yourself", skill: "Hand wash dishes, pans, knives, and cutting boards safely" },
  { id: "nutrition-label", category: "Feed Yourself", skill: "Read a nutrition label and compare two snacks" },

  { id: "water-bottle", category: "Body + Health", skill: "Bring water bottle to and from sports/activity successfully 3x in a row", starter: true },
  { id: "first-aid", category: "Body + Health", skill: "Handle basic first aid for cuts, scrapes, burns, and sprains" },
  { id: "sleep-energy", category: "Body + Health", skill: "Track sleep, mood, energy, and hydration for one week" },
  { id: "calm-reset", category: "Body + Health", skill: "Use a calm-down reset: breathing, walk, stretch, or pause" },

  { id: "laundry", category: "Run a Home", skill: "Do one full laundry cycle", starter: true },
  { id: "manage-clean-laundry", category: "Run a Home", skill: "Manage clean laundry: fold, hang, sort, and put away" },
  { id: "sheets", category: "Run a Home", skill: "Change sheets and make the bed" },
  { id: "bathroom-sink", category: "Run a Home", skill: "Clean bathroom sink and mirror", starter: true },
  { id: "vacuum", category: "Run a Home", skill: "Vacuum or sweep a room" },
  { id: "picture-frame", category: "Run a Home", skill: "Hang a picture frame straight and securely" },
  { id: "plunge-toilet", category: "Run a Home", skill: "Plunge and unclog a toilet safely" },
  { id: "paint-room", category: "Run a Home", skill: "Prep and paint a room or wall section" },
  { id: "assemble-furniture", category: "Run a Home", skill: "Build or assemble furniture from instructions" },
  { id: "mow-lawn", category: "Run a Home", skill: "Mow the lawn or complete an outdoor maintenance task safely" },
  { id: "basic-tools", category: "Run a Home", skill: "Use a screwdriver, hammer, measuring tape, level, and Allen key safely" },

  { id: "wash-car", category: "Car + Practical Mechanics", skill: "Wash and detail the car" },
  { id: "gas", category: "Car + Practical Mechanics", skill: "Get gas and reset/track the trip meter if needed" },
  { id: "check-oil", category: "Car + Practical Mechanics", skill: "Check the oil" },
  { id: "tire-pressure", category: "Car + Practical Mechanics", skill: "Check tire pressure and understand the recommended PSI" },
  { id: "change-tire", category: "Car + Practical Mechanics", skill: "Change a tire or walk through the full tire-change process safely" },

  { id: "iron-shirt", category: "Clothing + Presentation", skill: "Iron a dress shirt" },
  { id: "iron-slacks", category: "Clothing + Presentation", skill: "Iron slacks or dress pants" },
  { id: "tie-necktie", category: "Clothing + Presentation", skill: "Tie a necktie" },
  { id: "polish-shoes", category: "Clothing + Presentation", skill: "Polish dress shoes" },
  { id: "sew-button", category: "Clothing + Presentation", skill: "Sew on a button" },
  { id: "remove-stain", category: "Clothing + Presentation", skill: "Treat a basic clothing stain" },

  { id: "spending", category: "Money Smarts", skill: "Track spending or allowance for two weeks", starter: true },
  { id: "budget", category: "Money Smarts", skill: "Split money into spend/save/give/invest" },
  { id: "unit-price", category: "Money Smarts", skill: "Compare prices and unit costs" },
  { id: "subscriptions", category: "Money Smarts", skill: "Explain subscriptions and recurring charges" },

  { id: "passphrase", category: "Digital + AI Smarts", skill: "Create a strong passphrase and explain why it works", starter: true },
  { id: "private-info", category: "Digital + AI Smarts", skill: "Know what personal info never goes online or into AI" },
  { id: "scams", category: "Digital + AI Smarts", skill: "Spot phishing, fake giveaways, and urgent scam messages" },
  { id: "screenshots", category: "Digital + AI Smarts", skill: "Explain why screenshots make messages permanent" },
  { id: "ai-check", category: "Digital + AI Smarts", skill: "Use AI for brainstorming and check answers before trusting them" },

  { id: "thank-you", category: "Communication", skill: "Write and mail a thank-you card", starter: true },
  { id: "phone-call", category: "Communication", skill: "Make a polite phone call or leave a voicemail", starter: true },
  { id: "adult-text", category: "Communication", skill: "Write a polite text/email to a coach, teacher, or adult" },
  { id: "apology", category: "Communication", skill: "Apologize well: own it, repair it, move forward" },
  { id: "wrap-present", category: "Hospitality + Hosting", skill: "Wrap a present neatly" },
  { id: "host-guest", category: "Hospitality + Hosting", skill: "Host a guest: greet, offer water/snack, include them, and help reset" },
  { id: "set-table", category: "Hospitality + Hosting", skill: "Set the table and help serve a family meal" },
  { id: "thank-host", category: "Hospitality + Hosting", skill: "Be a good guest: thank the host and help clean up" },

  { id: "calendar", category: "Time + Responsibility", skill: "Use a calendar or planner for practices, activities, and deadlines" },
  { id: "night-before", category: "Time + Responsibility", skill: "Pack the night before" },
  { id: "task-steps", category: "Time + Responsibility", skill: "Break a big task into three smaller steps" },
  { id: "teach-sibling", category: "Time + Responsibility", skill: "Teach one life skill to your sibling", starter: true },

  { id: "emergency", category: "Safety + Navigation", skill: "Memorize parent phone numbers and home address" },
  { id: "crisis-basics", category: "Safety + Navigation", skill: "Crisis-capable basics: stay calm, assess, get safe, contact help, and communicate clearly" },
  { id: "lost", category: "Safety + Navigation", skill: "Know what to do if lost or separated" },
  { id: "map", category: "Safety + Navigation", skill: "Read a map and identify landmarks" },
  { id: "unsafe", category: "Safety + Navigation", skill: "Say clearly: I need help / I don’t feel safe / call my parent" },

  { id: "plan-trip", category: "Travel Independence", skill: "Plan and execute a trip: budget, book, pack, navigate, and practice hospitality" },
  { id: "packing-list", category: "Travel Independence", skill: "Create and use a packing list for a trip" },
  { id: "travel-budget", category: "Travel Independence", skill: "Build a simple travel budget: transport, food, activities, and buffer" },
  { id: "navigation", category: "Travel Independence", skill: "Navigate with maps, landmarks, timing, and backup routes" },

  { id: "basic-knots", category: "Outdoor + Tool Skills", skill: "Tie basic knots: square knot, bowline, two half hitches" },
  { id: "catch-fish", category: "Outdoor + Tool Skills", skill: "Catch, handle, and clean a fish safely" },
  { id: "build-fire", category: "Outdoor + Tool Skills", skill: "Build, maintain, and safely extinguish a fire" },
  { id: "swiss-army-knife", category: "Outdoor + Tool Skills", skill: "Use a Swiss Army knife safely and responsibly" },
  { id: "firearm-safety", category: "Outdoor + Tool Skills", skill: "Learn firearm safety rules and handle a firearm only with qualified adult supervision" },
  { id: "supervised-firearm", category: "Outdoor + Tool Skills", skill: "Shoot a firearm safely at a supervised range or lesson" },
];

const groupedSkills = skills.reduce<Record<string, LifeSkill[]>>((groups, skill) => {
  groups[skill.category] = [...(groups[skill.category] || []), skill];
  return groups;
}, {});

function nextStatus(current: Status): Status {
  const index = statusOrder.indexOf(current);
  return statusOrder[(index + 1) % statusOrder.length];
}

function LifeSkillsTab({ kid }: { kid: Kid }) {
  const storageKey = `mission-control-life-skills-${kid}`;
  const [progress, setProgress] = useState<Record<string, Status>>({});

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved) setProgress(JSON.parse(saved));
    } catch {
      // Ignore localStorage issues and keep the checklist usable.
    }
  }, [storageKey]);

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(progress));
    } catch {
      // Ignore localStorage issues and keep the checklist usable.
    }
  }, [progress, storageKey]);

  const completedCount = useMemo(
    () => skills.filter((skill) => ["owned", "taught"].includes(progress[skill.id] || "not-started")).length,
    [progress]
  );

  const xp = useMemo(
    () => skills.reduce((sum, skill) => sum + xpByStatus[progress[skill.id] || "not-started"], 0),
    [progress]
  );

  const level = Math.floor(xp / 250) + 1;
  const nextLevelXp = level * 250;
  const currentLevelFloor = (level - 1) * 250;
  const levelProgress = Math.round(((xp - currentLevelFloor) / (nextLevelXp - currentLevelFloor)) * 100);

  const categoryProgress = useMemo(
    () => Object.entries(groupedSkills).map(([category, categorySkills]) => {
      const completed = categorySkills.filter((skill) => ["owned", "taught"].includes(progress[skill.id] || "not-started")).length;
      return {
        category,
        completed,
        total: categorySkills.length,
        percent: Math.round((completed / categorySkills.length) * 100),
      };
    }),
    [progress]
  );

  const earnedBadges = categoryProgress.filter((category) => category.completed === category.total);
  const activeQuests = skills.filter((skill) => skill.starter && !["owned", "taught"].includes(progress[skill.id] || "not-started")).slice(0, 5);

  const setSkillStatus = (skillId: string, status: Status) => {
    setProgress((prev) => ({ ...prev, [skillId]: status }));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <h2 className={`text-xl font-semibold ${kids[kid].color}`}>{kids[kid].name}&apos;s Life XP</h2>
          <p className="text-sm text-muted-foreground">
            {completedCount}/{skills.length} owned or taught. Tap a skill to move it forward.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Printer className="mr-2 h-4 w-4" /> Print
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-3 print:hidden">
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-amber-300">
              <Star className="h-5 w-5" />
              <span className="text-sm font-semibold">Level {level}</span>
            </div>
            <div className="mt-2 text-2xl font-bold text-white">{xp} XP</div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-800">
              <div className="h-full rounded-full bg-amber-400" style={{ width: `${levelProgress}%` }} />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{nextLevelXp - xp} XP to Level {level + 1}</p>
          </CardContent>
        </Card>

        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-green-300">
              <Trophy className="h-5 w-5" />
              <span className="text-sm font-semibold">Badges</span>
            </div>
            <div className="mt-2 text-2xl font-bold text-white">{earnedBadges.length}/{categoryProgress.length}</div>
            <div className="mt-3 flex flex-wrap gap-1">
              {earnedBadges.length > 0 ? earnedBadges.slice(0, 3).map((badge) => (
                <Badge key={badge.category} className="bg-green-500/20 text-green-200">{badgeByCategory[badge.category]}</Badge>
              )) : <p className="text-xs text-muted-foreground">Complete a category to earn the first badge.</p>}
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-500/30 bg-blue-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-blue-300">
              <Medal className="h-5 w-5" />
              <span className="text-sm font-semibold">Active Quests</span>
            </div>
            <div className="mt-3 space-y-1">
              {activeQuests.length > 0 ? activeQuests.map((quest) => (
                <button
                  key={quest.id}
                  type="button"
                  onClick={() => setSkillStatus(quest.id, nextStatus(progress[quest.id] || "not-started"))}
                  className="block w-full rounded-md bg-zinc-950/60 px-2 py-1 text-left text-xs text-zinc-200 hover:bg-zinc-800"
                >
                  + {quest.skill}
                </button>
              )) : <p className="text-xs text-muted-foreground">Starter quests complete. Pick a new adventure.</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="print:hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Badge Progress</CardTitle>
          <CardDescription>Complete every skill in a category to unlock its badge.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {categoryProgress.map((category) => (
            <div key={category.category} className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-3">
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="font-medium text-zinc-100">{badgeByCategory[category.category]}</span>
                <span className="text-xs text-muted-foreground">{category.completed}/{category.total}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{category.category}</p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-800">
                <div className="h-full rounded-full bg-green-400" style={{ width: `${category.percent}%` }} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="hidden print:block">
        <h2 className="text-2xl font-bold">{kids[kid].name}&apos;s Life Skills Checklist</h2>
        <p className="text-sm">Learned · Practiced · Owned · Taught</p>
      </div>

      {Object.entries(groupedSkills).map(([category, categorySkills]) => (
        <Card key={category} className="print:break-inside-avoid print:border-zinc-300 print:bg-white print:text-black">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{category}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {categorySkills.map((skill) => {
              const status = progress[skill.id] || "not-started";
              const done = status === "owned" || status === "taught";

              return (
                <div
                  key={skill.id}
                  className="flex items-start gap-3 rounded-lg border border-zinc-800 bg-zinc-950/50 p-3 print:border-zinc-300 print:bg-white"
                >
                  <button
                    type="button"
                    onClick={() => setSkillStatus(skill.id, nextStatus(status))}
                    className="mt-0.5 print:hidden"
                    aria-label={`Update ${skill.skill}`}
                  >
                    {done ? <CheckCircle2 className="h-5 w-5 text-green-400" /> : <Circle className="h-5 w-5 text-zinc-500" />}
                  </button>
                  <span className="hidden print:inline-block">□</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm text-zinc-100 print:text-black">{skill.skill}</p>
                      {skill.starter && <Badge variant="secondary" className="print:hidden">Starter</Badge>}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1 print:hidden">
                      {statusOrder.map((option) => (
                        <Button
                          key={option}
                          type="button"
                          size="sm"
                          variant={status === option ? "default" : "outline"}
                          className="h-7 px-2 text-xs"
                          onClick={() => setSkillStatus(skill.id, option)}
                        >
                          {statusLabels[option]}
                        </Button>
                      ))}
                    </div>
                    <div className="mt-1 hidden text-xs print:block">Learned □ Practiced □ Owned □ Taught □</div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function KidsLifeSkillsChecklist() {
  return (
    <div className="space-y-6">
      <Card className="print:hidden">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-400" />
            <CardTitle>Life Skills Checklist</CardTitle>
          </div>
          <CardDescription>
            Draft checklist for building capable, independent humans. Anthony and Roma can move at their own pace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 text-sm text-muted-foreground md:grid-cols-4">
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3"><strong className="text-zinc-100">Learned</strong><br />I understand it.</div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3"><strong className="text-zinc-100">Practiced</strong><br />I did it with help.</div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3"><strong className="text-zinc-100">Owned</strong><br />I can do it independently.</div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3"><strong className="text-zinc-100">Taught</strong><br />I can teach someone else.</div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="anthony" className="w-full">
        <TabsList className="grid w-full grid-cols-2 print:hidden">
          <TabsTrigger value="anthony">Anthony</TabsTrigger>
          <TabsTrigger value="roma">Roma</TabsTrigger>
        </TabsList>
        <TabsContent value="anthony" className="mt-4">
          <LifeSkillsTab kid="anthony" />
        </TabsContent>
        <TabsContent value="roma" className="mt-4">
          <LifeSkillsTab kid="roma" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
