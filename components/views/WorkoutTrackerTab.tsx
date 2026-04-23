"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dumbbell, Plus, RotateCcw, Save, ChevronUp, ChevronDown, Trash2 } from "lucide-react";

interface WorkoutTrackerTabProps {
  userId: Id<"users">;
}

interface ExerciseDraft {
  exerciseTemplateId: Id<"workoutProgramExercises">;
  exerciseName: string;
  sets: Array<{ reps: string; weight: string }>;
}

const DAY_TONES = [
  {
    active: "border-violet-500/70 bg-violet-500/12 ring-1 ring-violet-500/40",
    idle: "border-violet-500/30 bg-violet-500/5",
    badge: "bg-violet-500/15 text-violet-200 border-violet-500/30",
  },
  {
    active: "border-sky-500/70 bg-sky-500/12 ring-1 ring-sky-500/40",
    idle: "border-sky-500/30 bg-sky-500/5",
    badge: "bg-sky-500/15 text-sky-200 border-sky-500/30",
  },
  {
    active: "border-emerald-500/70 bg-emerald-500/12 ring-1 ring-emerald-500/40",
    idle: "border-emerald-500/30 bg-emerald-500/5",
    badge: "bg-emerald-500/15 text-emerald-200 border-emerald-500/30",
  },
  {
    active: "border-rose-500/70 bg-rose-500/12 ring-1 ring-rose-500/40",
    idle: "border-rose-500/30 bg-rose-500/5",
    badge: "bg-rose-500/15 text-rose-200 border-rose-500/30",
  },
  {
    active: "border-amber-500/70 bg-amber-500/12 ring-1 ring-amber-500/40",
    idle: "border-amber-500/30 bg-amber-500/5",
    badge: "bg-amber-500/15 text-amber-200 border-amber-500/30",
  },
  {
    active: "border-cyan-500/70 bg-cyan-500/12 ring-1 ring-cyan-500/40",
    idle: "border-cyan-500/30 bg-cyan-500/5",
    badge: "bg-cyan-500/15 text-cyan-200 border-cyan-500/30",
  },
];

function getLocalDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDefaultWorkoutDate(startsOn?: string) {
  const today = getLocalDateString();
  if (startsOn && startsOn > today) return startsOn;
  return today;
}

function formatDateLabel(dateString?: string) {
  if (!dateString) return "";
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function WorkoutTrackerTab({ userId }: WorkoutTrackerTabProps) {
  const dashboard = useQuery(api.workouts.getWorkoutDashboard, { userId });
  const ensureDefaultProgram = useMutation(api.workouts.ensureDefaultProgram);
  const updateProgram = useMutation(api.workouts.updateProgram);
  const addProgramDay = useMutation(api.workouts.addProgramDay);
  const updateProgramDay = useMutation(api.workouts.updateProgramDay);
  const moveProgramDay = useMutation(api.workouts.moveProgramDay);
  const removeProgramDay = useMutation(api.workouts.removeProgramDay);
  const addProgramExercise = useMutation(api.workouts.addProgramExercise);
  const updateProgramExercise = useMutation(api.workouts.updateProgramExercise);
  const moveProgramExercise = useMutation(api.workouts.moveProgramExercise);
  const removeProgramExercise = useMutation(api.workouts.removeProgramExercise);
  const saveWorkoutLog = useMutation(api.workouts.saveWorkoutLog);

  const [seedRequested, setSeedRequested] = useState(false);
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);
  const [workoutDate, setWorkoutDate] = useState("");
  const [exerciseDrafts, setExerciseDrafts] = useState<ExerciseDraft[]>([]);
  const [newDayName, setNewDayName] = useState("");
  const [newExerciseByDay, setNewExerciseByDay] = useState<Record<string, { name: string; setCount: string }>>({});
  const [saving, setSaving] = useState(false);
  const [celebrationTick, setCelebrationTick] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    if (dashboard === null && !seedRequested) {
      setSeedRequested(true);
      void ensureDefaultProgram({ userId });
    }
  }, [dashboard, ensureDefaultProgram, seedRequested, userId]);

  const upcomingDayId = useMemo(() => {
    if (!dashboard?.days?.length) return null;

    if (dashboard.program?.startsOn && dashboard.program.startsOn > getLocalDateString()) {
      return String(dashboard.days[0]._id);
    }

    const lastLoggedDayId = dashboard.recentLogs[0]?.programDayId
      ? String(dashboard.recentLogs[0].programDayId)
      : null;

    const lastIndex = lastLoggedDayId
      ? dashboard.days.findIndex((day: any) => String(day._id) === lastLoggedDayId)
      : -1;

    return String(
      dashboard.days[lastIndex >= 0 ? (lastIndex + 1) % dashboard.days.length : 0]._id
    );
  }, [dashboard]);

  useEffect(() => {
    if (!dashboard?.days?.length) return;
    if (!selectedDayId || !dashboard.days.some((day: any) => String(day._id) === selectedDayId)) {
      setSelectedDayId(upcomingDayId ?? String(dashboard.days[0]._id));
    }
  }, [dashboard, selectedDayId, upcomingDayId]);

  const selectedDay = useMemo(
    () => dashboard?.days?.find((day: any) => String(day._id) === selectedDayId) ?? null,
    [dashboard, selectedDayId]
  );

  const selectedDayIndex = useMemo(
    () => dashboard?.days?.findIndex((day: any) => String(day._id) === selectedDayId) ?? -1,
    [dashboard, selectedDayId]
  );

  const upcomingDay = useMemo(
    () => dashboard?.days?.find((day: any) => String(day._id) === upcomingDayId) ?? null,
    [dashboard, upcomingDayId]
  );

  useEffect(() => {
    if (!selectedDay || !dashboard?.program) return;
    setWorkoutDate(getDefaultWorkoutDate(dashboard.program.startsOn));
    setExerciseDrafts(
      selectedDay.exercises.map((exercise: any) => ({
        exerciseTemplateId: exercise._id,
        exerciseName: exercise.name,
        sets: Array.from({ length: exercise.setCount ?? 3 }, () => ({
          reps: "",
          weight: exercise.suggestedWeight ?? "",
        })),
      }))
    );
  }, [dashboard?.program, selectedDay]);

  const handleResetWeights = () => {
    if (!selectedDay) return;
    setExerciseDrafts(
      selectedDay.exercises.map((exercise: any) => ({
        exerciseTemplateId: exercise._id,
        exerciseName: exercise.name,
        sets: Array.from({ length: exercise.setCount ?? 3 }, () => ({
          reps: "",
          weight: exercise.suggestedWeight ?? "",
        })),
      }))
    );
    if (dashboard?.program) {
      setWorkoutDate(getDefaultWorkoutDate(dashboard.program.startsOn));
    }
  };

  const handleSaveWorkout = async () => {
    if (!dashboard?.program || !selectedDay || saving) return;
    setSaving(true);
    try {
      await saveWorkoutLog({
        userId,
        programId: dashboard.program._id,
        programDayId: selectedDay._id,
        workoutDate,
        exercises: exerciseDrafts.map((exercise, index) => ({
          exerciseTemplateId: exercise.exerciseTemplateId,
          exerciseName: exercise.exerciseName,
          order: index,
          sets: exercise.sets.map((set) => ({
            reps: set.reps,
            weight: set.weight,
          })),
        })),
      });
      setCelebrationTick((tick) => tick + 1);
      setShowCelebration(true);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!showCelebration) return;
    const timeout = window.setTimeout(() => setShowCelebration(false), 1600);
    return () => window.clearTimeout(timeout);
  }, [showCelebration, celebrationTick]);

  if (dashboard === undefined || dashboard === null) {
    return (
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="py-12 text-center text-zinc-400">
          Loading your workout tracker...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100 flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-amber-400" />
            Strength Program
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-zinc-500 mb-2">Program</p>
            <Input
              defaultValue={dashboard.program.name}
              className="bg-zinc-800 border-zinc-700 text-zinc-100"
              onBlur={(e) =>
                void updateProgram({
                  programId: dashboard.program._id,
                  name: e.target.value.trim() || dashboard.program.name,
                })
              }
            />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-zinc-500 mb-2">Start Date</p>
            <Input
              type="date"
              defaultValue={dashboard.program.startsOn ?? ""}
              className="bg-zinc-800 border-zinc-700 text-zinc-100"
              onBlur={(e) =>
                void updateProgram({
                  programId: dashboard.program._id,
                  startsOn: e.target.value || undefined,
                })
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-zinc-100">
                  {selectedDay?.name ?? "Upcoming Lift"}
                </CardTitle>
                {selectedDayId === upcomingDayId ? (
                  <Badge className="bg-amber-500 text-zinc-950 hover:bg-amber-500">Upcoming</Badge>
                ) : null}
                {dashboard.program.startsOn && dashboard.program.startsOn > getLocalDateString() ? (
                  <Badge variant="outline" className="border-zinc-700 text-zinc-300">
                    Starts {formatDateLabel(dashboard.program.startsOn)}
                  </Badge>
                ) : null}
              </div>
              {upcomingDay && selectedDayId !== upcomingDayId ? (
                <p className="text-sm text-zinc-500">Upcoming: {upcomingDay.name}</p>
              ) : null}
            </div>
            <div className="flex gap-2">
              <Input
                type="date"
                value={workoutDate}
                className="w-[170px] bg-zinc-800 border-zinc-700 text-zinc-100"
                onChange={(e) => setWorkoutDate(e.target.value)}
              />
              <Button
                variant="outline"
                className="bg-zinc-800 border-zinc-700 text-zinc-300"
                onClick={handleResetWeights}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedDay ? (
            exerciseDrafts.map((exerciseDraft, exerciseIndex) => {
              const sourceExercise = selectedDay.exercises.find(
                (exercise: any) => String(exercise._id) === String(exerciseDraft.exerciseTemplateId)
              );

              return (
                <div
                  key={String(exerciseDraft.exerciseTemplateId)}
                  className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4"
                >
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div>
                      <h4 className="font-semibold text-zinc-100">{exerciseDraft.exerciseName}</h4>
                      <div className="text-xs text-zinc-500 mt-1 flex items-center gap-2 flex-wrap">
                        <span>{exerciseDraft.sets.length} sets</span>
                        {sourceExercise?.repTarget ? <span>{sourceExercise.repTarget} reps</span> : null}
                        {sourceExercise?.suggestedWeight ? (
                          <span className="text-amber-300">{sourceExercise.suggestedWeight}</span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    {exerciseDraft.sets.map((set, setIndex) => (
                      <div
                        key={`${String(exerciseDraft.exerciseTemplateId)}-${setIndex}`}
                        className="grid grid-cols-[64px_1fr_1fr] gap-2 items-center"
                      >
                        <div className="text-sm text-zinc-500">Set {setIndex + 1}</div>
                        <Input
                          value={set.reps}
                          placeholder="Reps"
                          className="bg-zinc-800 border-zinc-700 text-zinc-100"
                          onChange={(e) =>
                            setExerciseDrafts((prev) =>
                              prev.map((draft, idx) =>
                                idx === exerciseIndex
                                  ? {
                                      ...draft,
                                      sets: draft.sets.map((existingSet, innerIdx) =>
                                        innerIdx === setIndex
                                          ? { ...existingSet, reps: e.target.value }
                                          : existingSet
                                      ),
                                    }
                                  : draft
                              )
                            )
                          }
                        />
                        <Input
                          value={set.weight}
                          placeholder="Weight"
                          className="bg-zinc-800 border-zinc-700 text-zinc-100"
                          onChange={(e) =>
                            setExerciseDrafts((prev) =>
                              prev.map((draft, idx) =>
                                idx === exerciseIndex
                                  ? {
                                      ...draft,
                                      sets: draft.sets.map((existingSet, innerIdx) =>
                                        innerIdx === setIndex
                                          ? { ...existingSet, weight: e.target.value }
                                          : existingSet
                                      ),
                                    }
                                  : draft
                              )
                            )
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-zinc-500 text-sm">Pick a workout day.</div>
          )}

          <div className="relative pt-8">
            {showCelebration ? (
              <>
                <div className="pointer-events-none absolute inset-x-0 -top-1 flex justify-center z-20">
                  <div key={celebrationTick} className="celebration-pop rounded-full border border-emerald-400/40 bg-emerald-500/15 px-4 py-1 text-sm font-medium text-emerald-200 shadow-lg shadow-emerald-900/20">
                    Nice work 💪
                  </div>
                </div>
                <div className="pointer-events-none absolute inset-x-0 top-7 z-10 h-0 overflow-visible">
                  {[
                    { left: "10%", color: "#f59e0b", delay: "0ms", rotate: "-18deg" },
                    { left: "18%", color: "#fb7185", delay: "60ms", rotate: "12deg" },
                    { left: "28%", color: "#22c55e", delay: "120ms", rotate: "-10deg" },
                    { left: "38%", color: "#38bdf8", delay: "30ms", rotate: "16deg" },
                    { left: "46%", color: "#a78bfa", delay: "90ms", rotate: "-14deg" },
                    { left: "54%", color: "#facc15", delay: "20ms", rotate: "8deg" },
                    { left: "64%", color: "#34d399", delay: "110ms", rotate: "-16deg" },
                    { left: "74%", color: "#f472b6", delay: "45ms", rotate: "10deg" },
                    { left: "84%", color: "#60a5fa", delay: "140ms", rotate: "-8deg" },
                    { left: "92%", color: "#fb923c", delay: "70ms", rotate: "14deg" },
                  ].map((piece, index) => (
                    <span
                      key={`${celebrationTick}-${index}`}
                      className="confetti-piece absolute inline-block h-2.5 w-2.5 rounded-sm"
                      style={{
                        left: piece.left,
                        backgroundColor: piece.color,
                        animationDelay: piece.delay,
                        rotate: piece.rotate,
                      }}
                    />
                  ))}
                </div>
              </>
            ) : null}

            <Button
              className="w-full bg-amber-500 text-zinc-950 hover:bg-amber-400"
              onClick={() => void handleSaveWorkout()}
              disabled={!selectedDay || !workoutDate || saving}
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save Workout"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100 flex items-center justify-between gap-3">
            <span>Base Plan</span>
            <Badge className="bg-zinc-800 text-zinc-300 border border-zinc-700">Editable</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {dashboard.days.map((day: any, dayIndex: number) => {
            const isSelected = String(day._id) === selectedDayId;
            const tone = DAY_TONES[dayIndex % DAY_TONES.length];
            const pendingNewExercise = newExerciseByDay[String(day._id)] ?? { name: "", setCount: "3" };

            return (
              <div
                key={String(day._id)}
                className={`rounded-xl border p-4 ${isSelected ? tone.active : tone.idle}`}
              >
                <div className="flex items-start gap-2 mb-3">
                  <button
                    type="button"
                    className="flex-1 text-left space-y-2"
                    onClick={() => setSelectedDayId(String(day._id))}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className={tone.badge}>
                        Day {dayIndex + 1}
                      </Badge>
                      {String(day._id) === upcomingDayId ? (
                        <Badge className="bg-amber-500 text-zinc-950 hover:bg-amber-500">Upcoming</Badge>
                      ) : null}
                    </div>
                    <Input
                      defaultValue={day.name}
                      className="bg-zinc-900/80 border-zinc-700 text-zinc-100 font-medium"
                      onClick={() => setSelectedDayId(String(day._id))}
                      onBlur={(e) =>
                        void updateProgramDay({
                          dayId: day._id,
                          name: e.target.value.trim() || day.name,
                        })
                      }
                    />
                  </button>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="outline"
                      className="bg-zinc-900/80 border-zinc-700 text-zinc-300"
                      disabled={dayIndex === 0}
                      onClick={() => void moveProgramDay({ dayId: day._id, direction: "up" })}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="bg-zinc-900/80 border-zinc-700 text-zinc-300"
                      disabled={dayIndex === dashboard.days.length - 1}
                      onClick={() => void moveProgramDay({ dayId: day._id, direction: "down" })}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="bg-zinc-900/80 border-zinc-700 text-rose-300 hover:bg-rose-950/40"
                      onClick={() => void removeProgramDay({ dayId: day._id })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  {day.exercises.map((exercise: any, exerciseIndex: number) => (
                    <div
                      key={String(exercise._id)}
                      className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-3"
                    >
                      <div className="grid gap-2 md:grid-cols-[1fr_88px_110px_auto] md:items-center">
                        <Input
                          defaultValue={exercise.name}
                          className="bg-zinc-800 border-zinc-700 text-zinc-100"
                          onBlur={(e) =>
                            void updateProgramExercise({
                              exerciseId: exercise._id,
                              name: e.target.value.trim() || exercise.name,
                            })
                          }
                        />
                        <Input
                          type="number"
                          min={1}
                          max={8}
                          defaultValue={exercise.setCount ?? 3}
                          className="bg-zinc-800 border-zinc-700 text-zinc-100"
                          onBlur={(e) =>
                            void updateProgramExercise({
                              exerciseId: exercise._id,
                              setCount:
                                Math.max(
                                  1,
                                  parseInt(e.target.value || `${exercise.setCount ?? 3}`, 10)
                                ) || 3,
                            })
                          }
                        />
                        <Input
                          defaultValue={exercise.repTarget ?? "10-12"}
                          className="bg-zinc-800 border-zinc-700 text-zinc-100"
                          onBlur={(e) =>
                            void updateProgramExercise({
                              exerciseId: exercise._id,
                              repTarget: e.target.value.trim() || undefined,
                            })
                          }
                        />
                        <div className="flex gap-1 justify-end">
                          <Button
                            size="icon"
                            variant="outline"
                            className="bg-zinc-800 border-zinc-700 text-zinc-300"
                            disabled={exerciseIndex === 0}
                            onClick={() =>
                              void moveProgramExercise({ exerciseId: exercise._id, direction: "up" })
                            }
                          >
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="outline"
                            className="bg-zinc-800 border-zinc-700 text-zinc-300"
                            disabled={exerciseIndex === day.exercises.length - 1}
                            onClick={() =>
                              void moveProgramExercise({ exerciseId: exercise._id, direction: "down" })
                            }
                          >
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="outline"
                            className="bg-zinc-800 border-zinc-700 text-rose-300 hover:bg-rose-950/40"
                            onClick={() => void removeProgramExercise({ exerciseId: exercise._id })}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-3 grid gap-2 md:grid-cols-[1fr_90px_auto]">
                  <Input
                    placeholder="Add exercise"
                    value={pendingNewExercise.name}
                    className="bg-zinc-900/80 border-zinc-700 text-zinc-100"
                    onChange={(e) =>
                      setNewExerciseByDay((prev) => ({
                        ...prev,
                        [String(day._id)]: { ...pendingNewExercise, name: e.target.value },
                      }))
                    }
                  />
                  <Input
                    type="number"
                    min={1}
                    max={8}
                    value={pendingNewExercise.setCount}
                    className="bg-zinc-900/80 border-zinc-700 text-zinc-100"
                    onChange={(e) =>
                      setNewExerciseByDay((prev) => ({
                        ...prev,
                        [String(day._id)]: { ...pendingNewExercise, setCount: e.target.value },
                      }))
                    }
                  />
                  <Button
                    className="bg-zinc-100 text-zinc-900 hover:bg-white"
                    onClick={() => {
                      if (!pendingNewExercise.name.trim()) return;
                      void addProgramExercise({
                        userId,
                        programId: dashboard.program._id,
                        dayId: day._id,
                        name: pendingNewExercise.name.trim(),
                        setCount: Math.max(1, parseInt(pendingNewExercise.setCount || "3", 10) || 3),
                      });
                      setNewExerciseByDay((prev) => ({
                        ...prev,
                        [String(day._id)]: { name: "", setCount: "3" },
                      }));
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Exercise
                  </Button>
                </div>
              </div>
            );
          })}

          <div className="grid gap-2 md:grid-cols-[1fr_auto]">
            <Input
              placeholder="Add workout day"
              value={newDayName}
              className="bg-zinc-800 border-zinc-700 text-zinc-100"
              onChange={(e) => setNewDayName(e.target.value)}
            />
            <Button
              className="bg-amber-500 text-zinc-950 hover:bg-amber-400"
              onClick={() => {
                if (!newDayName.trim()) return;
                void addProgramDay({ userId, programId: dashboard.program._id, name: newDayName.trim() });
                setNewDayName("");
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Day
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100">Recent Workouts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {dashboard.recentLogs.length === 0 ? (
            <div className="text-sm text-zinc-500">No workouts logged yet.</div>
          ) : (
            dashboard.recentLogs.map((log: any) => (
              <div key={String(log._id)} className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div>
                    <p className="font-medium text-zinc-100">{log.workoutDayName}</p>
                    <p className="text-xs text-zinc-500">{formatDateLabel(log.workoutDate)}</p>
                  </div>
                  <Badge className="bg-zinc-800 text-zinc-300 border border-zinc-700">
                    {log.exercises.length} lifts
                  </Badge>
                </div>
                <div className="space-y-2 text-sm text-zinc-300">
                  {log.exercises.slice(0, 4).map((exercise: any) => (
                    <div key={String(exercise._id)} className="flex items-center justify-between gap-3">
                      <span className="truncate">{exercise.exerciseName}</span>
                      <span className="text-zinc-500 shrink-0">
                        {exercise.sets.find((set: any) => set.weight)?.weight || "-"}
                      </span>
                    </div>
                  ))}
                  {log.exercises.length > 4 ? (
                    <div className="text-xs text-zinc-500">+{log.exercises.length - 4} more</div>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
      <style jsx>{`
        .celebration-pop {
          animation: celebration-pop 1.2s ease-out forwards;
        }

        .confetti-piece {
          top: 0;
          opacity: 0;
          animation: confetti-burst 900ms cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }

        @keyframes celebration-pop {
          0% {
            opacity: 0;
            transform: translateY(8px) scale(0.92);
          }
          18% {
            opacity: 1;
            transform: translateY(0) scale(1.02);
          }
          75% {
            opacity: 1;
            transform: translateY(-4px) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(-10px) scale(0.98);
          }
        }

        @keyframes confetti-burst {
          0% {
            opacity: 0;
            transform: translate3d(0, 0, 0) scale(0.7);
          }
          10% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translate3d(0, -34px, 0) scale(1) rotate(180deg);
          }
        }
      `}</style>
    </div>
  );
}
