"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { WeeklySchedule } from "@/components/WeeklySchedule";
import { MonthlyFocus } from "@/components/MonthlyFocus";
import { ProjectsThisMonth } from "@/components/ProjectsThisMonth";
import { ReadAloudList } from "@/components/ReadAloudListDB";
import { TripsOnHorizon } from "@/components/TripsOnHorizon";
import { FieldTripList } from "@/components/FieldTripList";
import { BookLibraryVisual } from "@/components/BookLibraryVisual";
import { GameLibraryVisual } from "@/components/GameLibraryVisual";
import { KidsLifeSkillsChecklist } from "@/components/KidsLifeSkillsChecklist";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Id } from "@/convex/_generated/dataModel";
import { Plus, Trash2, BookMarked, ArrowRight, Dumbbell, HeartPulse, Trophy } from "lucide-react";

// Up Next Books Component
function UpNextBooks({ userId }: { userId: Id<"users"> }) {
  const books = useQuery(api.books.getUpNextBooks, { userId });
  const addBook = useMutation(api.books.addReadAloudBook);
  const deleteBook = useMutation(api.books.deleteReadAloudBook);
  const moveToReading = useMutation(api.books.moveToReading);

  const [newTitle, setNewTitle] = useState("");
  const [newAuthor, setNewAuthor] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAdd = async () => {
    if (newTitle.trim()) {
      await addBook({
        userId,
        title: newTitle.trim(),
        author: newAuthor.trim() || undefined,
        status: "up-next",
      });
      setNewTitle("");
      setNewAuthor("");
      setShowAddForm(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <BookMarked className="h-5 w-5 text-orange-500" />
          <CardTitle className="text-lg">Books on Deck</CardTitle>
        </div>
        <CardDescription>What we&apos;ll read next</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {books && books.length > 0 ? (
          <div className="space-y-3">
            {books.map((book) => (
              <div
                key={book._id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 group"
              >
                {/* Book Cover */}
                {book.coverUrl ? (
                  <img
                    src={book.coverUrl}
                    alt={book.title}
                    className="w-10 h-14 object-cover rounded shadow-sm flex-shrink-0"
                  />
                ) : (
                  <div className="w-10 h-14 bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900 dark:to-orange-800 rounded flex items-center justify-center flex-shrink-0">
                    <BookMarked className="w-4 h-4 text-orange-500 opacity-50" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{book.title}</div>
                  {book.author && (
                    <div className="text-xs text-muted-foreground truncate">{book.author}</div>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => moveToReading({ id: book._id })}
                  className="opacity-0 group-hover:opacity-100 h-7"
                  title="Move to Currently Reading"
                >
                  <ArrowRight className="h-3 w-3 mr-1" />
                  Start
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteBook({ id: book._id })}
                  className="opacity-0 group-hover:opacity-100 text-destructive h-7 w-7 p-0"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No books on deck yet</p>
        )}

        {showAddForm ? (
          <div className="space-y-2 pt-2 border-t">
            <Input
              placeholder="Book title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            <Input
              placeholder="Author (optional)"
              value={newAuthor}
              onChange={(e) => setNewAuthor(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAdd}>Add</Button>
              <Button size="sm" variant="ghost" onClick={() => setShowAddForm(false)}>Cancel</Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddForm(true)}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Book
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

interface HomeschoolSubViewProps {
  userId: Id<"users">;
}

function useLocalStorageState<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") return fallback;

    const saved = window.localStorage.getItem(key);
    if (!saved) return fallback;

    try {
      return JSON.parse(saved) as T;
    } catch {
      return fallback;
    }
  });

  const updateValue = (next: T) => {
    setValue(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(key, JSON.stringify(next));
    }
  };

  return [value, updateValue] as const;
}

type SummerGoal = {
  id: string;
  title: string;
  owner: "Anthony" | "Roma" | "Both";
  area: string;
  target: string;
  cadence: string;
  done: boolean;
};

const defaultSummerGoals: SummerGoal[] = [
  {
    id: "soccer-touch-count",
    title: "Summer soccer touch count",
    owner: "Both",
    area: "Training",
    target: "15 focused sessions",
    cadence: "3x/week",
    done: false,
  },
  {
    id: "strength-mobility",
    title: "Strength and mobility base",
    owner: "Both",
    area: "Health",
    target: "20 bodyweight sessions",
    cadence: "4x/week",
    done: false,
  },
  {
    id: "creative-project",
    title: "One big creative project",
    owner: "Both",
    area: "Project",
    target: "Finished artifact by August",
    cadence: "Weekly block",
    done: false,
  },
];

const trainingBlocks = [
  { label: "Ball Mastery", detail: "10 min touches, turns, weak foot" },
  { label: "Speed", detail: "Short sprints, agility ladder, change of direction" },
  { label: "Strength", detail: "Squats, lunges, push-ups, core, balance" },
  { label: "Recovery", detail: "Walk, stretch, water, sleep check" },
];

export function HomeschoolSummerView({ userId }: HomeschoolSubViewProps) {
  void userId;
  const [goals, setGoals] = useLocalStorageState<SummerGoal[]>("mc-homeschool-summer-goals", defaultSummerGoals);
  const [newGoal, setNewGoal] = useState("");

  const addGoal = () => {
    const title = newGoal.trim();
    if (!title) return;

    setGoals([
      ...goals,
      {
        id: `goal-${Date.now()}`,
        title,
        owner: "Both",
        area: "Training",
        target: "",
        cadence: "",
        done: false,
      },
    ]);
    setNewGoal("");
  };

  const updateGoal = (id: string, updates: Partial<SummerGoal>) => {
    setGoals(goals.map((goal) => (goal.id === id ? { ...goal, ...updates } : goal)));
  };

  const removeGoal = (id: string) => {
    setGoals(goals.filter((goal) => goal.id !== id));
  };

  const completed = goals.filter((goal) => goal.done).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Summer Goals</h1>
        <p className="text-muted-foreground mt-1">Training, projects, and routines for Anthony & Roma</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Goal Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{completed}/{goals.length}</div>
            <p className="text-sm text-muted-foreground">summer goals checked off</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Training Rhythm</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">3-4x</div>
            <p className="text-sm text-muted-foreground">short sessions per week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Summer Focus</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">Body + Joy</div>
            <p className="text-sm text-muted-foreground">skill, health, creativity</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              <CardTitle>Summer Goal Board</CardTitle>
            </div>
            <CardDescription>Training, health, creative work</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {goals.map((goal) => (
              <div key={goal.id} className="grid gap-3 rounded-lg border p-3 md:grid-cols-[auto_1fr_110px_120px_120px_auto]">
                <input
                  type="checkbox"
                  checked={goal.done}
                  onChange={(event) => updateGoal(goal.id, { done: event.target.checked })}
                  className="mt-2 h-4 w-4"
                  aria-label={`Complete ${goal.title}`}
                />
                <Input value={goal.title} onChange={(event) => updateGoal(goal.id, { title: event.target.value })} />
                <select
                  value={goal.owner}
                  onChange={(event) => updateGoal(goal.id, { owner: event.target.value as SummerGoal["owner"] })}
                  className="h-10 rounded-md border bg-background px-3 text-sm"
                  aria-label="Owner"
                >
                  <option>Both</option>
                  <option>Anthony</option>
                  <option>Roma</option>
                </select>
                <Input value={goal.area} onChange={(event) => updateGoal(goal.id, { area: event.target.value })} placeholder="Area" />
                <Input value={goal.cadence} onChange={(event) => updateGoal(goal.id, { cadence: event.target.value })} placeholder="Cadence" />
                <Button variant="ghost" size="sm" onClick={() => removeGoal(goal.id)} className="h-10 w-10 p-0">
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Input
                  value={goal.target}
                  onChange={(event) => updateGoal(goal.id, { target: event.target.value })}
                  placeholder="Target"
                  className="md:col-start-2 md:col-span-4"
                />
              </div>
            ))}

            <div className="flex gap-2 pt-2">
              <Input
                value={newGoal}
                onChange={(event) => setNewGoal(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && addGoal()}
                placeholder="Add a summer goal..."
              />
              <Button onClick={addGoal}>
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-emerald-500" />
              <CardTitle>Training Menu</CardTitle>
            </div>
            <CardDescription>Pick one block and keep it short enough to repeat</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {trainingBlocks.map((block) => (
              <div key={block.label} className="rounded-lg border p-3">
                <div className="font-medium">{block.label}</div>
                <div className="text-sm text-muted-foreground">{block.detail}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

const healthHabits = [
  "Morning sunlight or outside time",
  "Protein + water before long screens",
  "Movement snack between learning blocks",
  "Mobility or stretch after training",
  "Evening wind-down without device drift",
];

export function HomeschoolHealthView({ userId }: HomeschoolSubViewProps) {
  void userId;
  const [checked, setChecked] = useLocalStorageState<Record<string, boolean>>("mc-homeschool-health-checks", {});
  const doneCount = healthHabits.filter((habit) => checked[habit]).length;

  const toggleHabit = (habit: string) => {
    setChecked({ ...checked, [habit]: !checked[habit] });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Health Habits</h1>
        <p className="text-muted-foreground mt-1">Simple body-care rhythm for summer homeschool days</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <HeartPulse className="h-5 w-5 text-red-500" />
              <CardTitle>Daily Health Check</CardTitle>
            </div>
            <CardDescription>{doneCount} of {healthHabits.length} habits checked today</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {healthHabits.map((habit) => (
              <label key={habit} className="flex items-center gap-3 rounded-lg border p-3 text-sm">
                <input
                  type="checkbox"
                  checked={Boolean(checked[habit])}
                  onChange={() => toggleHabit(habit)}
                  className="h-4 w-4"
                />
                <span className={checked[habit] ? "line-through text-muted-foreground" : ""}>{habit}</span>
              </label>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-blue-500" />
              <CardTitle>Summer Training Template</CardTitle>
            </div>
            <CardDescription>Enough structure to start, not so much it becomes a production</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="rounded-lg border p-3">
              <div className="font-medium">Warm-up</div>
              <div className="text-muted-foreground">5 minutes easy movement, skips, dynamic stretch</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="font-medium">Skill</div>
              <div className="text-muted-foreground">10 minutes ball mastery or sport-specific technique</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="font-medium">Strength</div>
              <div className="text-muted-foreground">10 minutes legs, core, balance, and posture</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="font-medium">Reset</div>
              <div className="text-muted-foreground">Water, stretch, one quick note: what felt stronger?</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function HomeschoolScheduleView({ userId }: HomeschoolSubViewProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Weekly Schedule</h1>
        <p className="text-muted-foreground mt-1">A & R Academy routine</p>
      </div>
      <WeeklySchedule userId={userId} />
    </div>
  );
}

export function HomeschoolFocusView({ userId }: HomeschoolSubViewProps) {
  void userId;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Monthly Focus</h1>
        <p className="text-muted-foreground mt-1">Current & upcoming learning themes</p>
      </div>
      <MonthlyFocus mode="page" />
    </div>
  );
}

export function HomeschoolLifeSkillsView({ userId }: HomeschoolSubViewProps) {
  void userId;
  return (
    <div className="space-y-6">
      <div className="print:hidden">
        <h1 className="text-3xl font-bold">Life Skills</h1>
        <p className="text-muted-foreground mt-1">Real-world independence checklist for Anthony & Roma</p>
      </div>
      <KidsLifeSkillsChecklist />
    </div>
  );
}

export function HomeschoolProjectsView({ userId }: HomeschoolSubViewProps) {
  void userId;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Projects This Month</h1>
        <p className="text-muted-foreground mt-1">Current & upcoming project-based learning</p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        {/* This Month */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-green-600">This Month</h2>
          <ProjectsThisMonth />
        </div>

        {/* Up Next */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-blue-600">Up Next</h2>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Next Month&apos;s Projects</CardTitle>
              <CardDescription>Projects in the pipeline</CardDescription>
            </CardHeader>
            <CardContent>
              <textarea
                className="w-full min-h-[200px] p-3 border rounded-lg text-sm"
                placeholder="Add upcoming projects here..."
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export function HomeschoolReadAloudView({ userId }: HomeschoolSubViewProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Read Aloud List</h1>
        <p className="text-muted-foreground mt-1">Current & upcoming family reading</p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        {/* Currently Reading */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-green-600">Currently Reading</h2>
          <ReadAloudList userId={userId} />
        </div>

        {/* Up Next */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-orange-500">Up Next</h2>
          <UpNextBooks userId={userId} />
        </div>
      </div>
    </div>
  );
}

export function HomeschoolLibraryView({ userId }: HomeschoolSubViewProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Book Library</h1>
        <p className="text-muted-foreground mt-1">Full collection</p>
      </div>
      <BookLibraryVisual userId={userId} />
    </div>
  );
}

export function HomeschoolGamesView({ userId }: HomeschoolSubViewProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Game Library</h1>
        <p className="text-muted-foreground mt-1">Family game night collection</p>
      </div>
      <GameLibraryVisual userId={userId} />
    </div>
  );
}

export function HomeschoolFieldTripsView({ userId }: HomeschoolSubViewProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Field Trips</h1>
        <p className="text-muted-foreground mt-1">Educational adventures</p>
      </div>
      <FieldTripList userId={userId} />
    </div>
  );
}

export function HomeschoolTripsView({ userId }: HomeschoolSubViewProps) {
  void userId;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Trips on Horizon</h1>
        <p className="text-muted-foreground mt-1">Upcoming travel</p>
      </div>
      <TripsOnHorizon />
    </div>
  );
}
