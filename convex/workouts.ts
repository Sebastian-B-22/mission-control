import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const DEFAULT_WORKOUT_DAYS = [
  {
    name: "Day 1 - Chest, Triceps, Abs",
    exercises: [
      { name: "Smith or Barbell Bench Press", setCount: 3 },
      { name: "Smith or Barbell Incline Bench Press", setCount: 3 },
      { name: "Dips - Chest Variation", setCount: 3 },
      { name: "Smith or Barbell Close Grip Bench Press", setCount: 3 },
      { name: "Cable Crunch", setCount: 3 },
    ],
  },
  {
    name: "Day 2 - Shoulders & Legs",
    exercises: [
      { name: "Machine Shoulder Press", setCount: 4 },
      { name: "Dumbbell Lateral Side Raise", setCount: 3 },
      { name: "Smith or Barbell Squat", setCount: 3 },
      { name: "Deadlift", setCount: 3 },
      { name: "Walking Lunges", setCount: 3 },
    ],
  },
  {
    name: "Day 3 - Back & Biceps",
    exercises: [
      { name: "Lat Pulldown", setCount: 3 },
      { name: "Bent Over Barbell Row", setCount: 3 },
      { name: "Seated Cable Row", setCount: 3 },
      { name: "T Bar Row", setCount: 3 },
      { name: "Cable Biceps Curl", setCount: 3 },
      { name: "Dumbbell Curl (Both arms)", setCount: 3 },
      { name: "Preacher Curl", setCount: 3 },
    ],
  },
  {
    name: "Day 4 - Chest, Triceps, Abs",
    exercises: [
      { name: "Incline Dumbbell Fly", setCount: 3 },
      { name: "Pec Dec Fly (or flat dumbbell)", setCount: 3 },
      { name: "Low Cable Fly", setCount: 3 },
      { name: "Triceps Pushdown (Rope)", setCount: 3 },
      { name: "Overhead Triceps Ext (Rope)", setCount: 3 },
      { name: "Triceps Pushdown (V Bar)", setCount: 3 },
      { name: "Crunches", setCount: 3 },
    ],
  },
  {
    name: "Day 5 - Shoulders & Legs",
    exercises: [
      { name: "Side lateral raise (DB or Cable)", setCount: 3 },
      { name: "Cable Front Raise (Rope)", setCount: 3 },
      { name: "Dumbbell Rear Delt Fly", setCount: 3 },
      { name: "Leg Extensions", setCount: 3 },
      { name: "Seated or Lying Leg Curl", setCount: 3 },
      { name: "Dumbbell Deadlifts", setCount: 3 },
    ],
  },
  {
    name: "Day 6 - Back & Biceps",
    exercises: [
      { name: "Wide Grip Lat Pulldown", setCount: 3 },
      { name: "Close Grip Lat Pulldown", setCount: 3 },
      { name: "Machine Low Row", setCount: 3 },
      { name: "Barbell Biceps Curl", setCount: 3 },
      { name: "Cable Biceps Curl", setCount: 3 },
      { name: "Dumbbell Curl", setCount: 3 },
    ],
  },
];

function toLocalDateString(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getNextMondayDateString() {
  const now = new Date();
  const local = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const day = local.getDay();
  const daysUntilNextMonday = ((8 - day) % 7) || 7;
  local.setDate(local.getDate() + daysUntilNextMonday);
  return toLocalDateString(local);
}

async function getActiveProgram(ctx: any, userId: string) {
  const programs = await ctx.db
    .query("workoutPrograms")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .collect();

  const activePrograms = programs.filter((program: any) => program.active);
  const candidates = activePrograms.length > 0 ? activePrograms : programs;

  return candidates.sort((a: any, b: any) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))[0] ?? null;
}

export const ensureDefaultProgram = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const existing = await getActiveProgram(ctx, userId);
    if (existing) {
      return existing._id;
    }

    const now = Date.now();
    const programId = await ctx.db.insert("workoutPrograms", {
      userId,
      name: "12 Week Shred",
      description:
        "Editable lifting plan seeded from your printed journal. Track reps, weight, and notes, then let Mission Control carry forward your last working weight for the next round.",
      startsOn: getNextMondayDateString(),
      active: true,
      createdAt: now,
      updatedAt: now,
    });

    for (const [dayIndex, day] of DEFAULT_WORKOUT_DAYS.entries()) {
      const dayId = await ctx.db.insert("workoutProgramDays", {
        userId,
        programId,
        name: day.name,
        order: dayIndex,
        createdAt: now,
        updatedAt: now,
      });

      for (const [exerciseIndex, exercise] of day.exercises.entries()) {
        await ctx.db.insert("workoutProgramExercises", {
          userId,
          programId,
          programDayId: dayId,
          name: exercise.name,
          setCount: exercise.setCount,
          repTarget: "10-12",
          order: exerciseIndex,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    return programId;
  },
});

export const getWorkoutDashboard = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const program = await getActiveProgram(ctx, userId);
    if (!program) return null;

    const days = await ctx.db
      .query("workoutProgramDays")
      .withIndex("by_program_order", (q) => q.eq("programId", program._id))
      .collect();

    const exercises = await ctx.db
      .query("workoutProgramExercises")
      .withIndex("by_program", (q) => q.eq("programId", program._id))
      .collect();

    const exerciseLogs = await ctx.db
      .query("workoutExerciseLogs")
      .withIndex("by_user_date", (q) => q.eq("userId", userId))
      .collect();

    const latestWeightByExercise = new Map<string, string>();
    const sortedExerciseLogs = [...exerciseLogs].sort((a, b) => {
      const dateCompare = b.workoutDate.localeCompare(a.workoutDate);
      if (dateCompare !== 0) return dateCompare;
      return (b.updatedAt ?? 0) - (a.updatedAt ?? 0);
    });

    for (const log of sortedExerciseLogs) {
      const key = String(log.exerciseTemplateId);
      if (latestWeightByExercise.has(key)) continue;
      const firstWeight = log.sets.find((set) => set.weight.trim())?.weight?.trim();
      if (firstWeight) {
        latestWeightByExercise.set(key, firstWeight);
      }
    }

    const exercisesByDay = new Map<string, any[]>();
    for (const exercise of exercises) {
      const key = String(exercise.programDayId);
      if (!exercisesByDay.has(key)) exercisesByDay.set(key, []);
      exercisesByDay.get(key)!.push({
        ...exercise,
        suggestedWeight: latestWeightByExercise.get(String(exercise._id)) ?? "",
      });
    }

    const workoutLogs = await ctx.db
      .query("workoutLogs")
      .withIndex("by_user_date", (q) => q.eq("userId", userId))
      .collect();

    const recentLogs = workoutLogs
      .sort((a, b) => {
        const dateCompare = b.workoutDate.localeCompare(a.workoutDate);
        if (dateCompare !== 0) return dateCompare;
        return (b.updatedAt ?? 0) - (a.updatedAt ?? 0);
      })
      .slice(0, 8);

    const exerciseLogsByWorkout = new Map<string, any[]>();
    for (const log of exerciseLogs) {
      const key = String(log.workoutLogId);
      if (!exerciseLogsByWorkout.has(key)) exerciseLogsByWorkout.set(key, []);
      exerciseLogsByWorkout.get(key)!.push(log);
    }

    return {
      program,
      days: days.map((day) => ({
        ...day,
        exercises: (exercisesByDay.get(String(day._id)) ?? []).sort((a, b) => a.order - b.order),
      })),
      recentLogs: recentLogs.map((log) => ({
        ...log,
        exercises: (exerciseLogsByWorkout.get(String(log._id)) ?? [])
          .sort((a, b) => a.order - b.order)
          .map((exerciseLog) => ({
            _id: exerciseLog._id,
            exerciseName: exerciseLog.exerciseName,
            notes: exerciseLog.notes,
            sets: exerciseLog.sets,
          })),
      })),
    };
  },
});

export const updateProgram = mutation({
  args: {
    programId: v.id("workoutPrograms"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    startsOn: v.optional(v.string()),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { programId, ...rest } = args;
    await ctx.db.patch(programId, {
      ...rest,
      updatedAt: Date.now(),
    });
  },
});

export const addProgramDay = mutation({
  args: {
    userId: v.id("users"),
    programId: v.id("workoutPrograms"),
    name: v.string(),
  },
  handler: async (ctx, { userId, programId, name }) => {
    const days = await ctx.db
      .query("workoutProgramDays")
      .withIndex("by_program_order", (q) => q.eq("programId", programId))
      .collect();

    const now = Date.now();
    return await ctx.db.insert("workoutProgramDays", {
      userId,
      programId,
      name,
      order: days.length,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateProgramDay = mutation({
  args: {
    dayId: v.id("workoutProgramDays"),
    name: v.optional(v.string()),
  },
  handler: async (ctx, { dayId, name }) => {
    await ctx.db.patch(dayId, {
      ...(name !== undefined ? { name } : {}),
      updatedAt: Date.now(),
    });
  },
});

export const moveProgramDay = mutation({
  args: {
    dayId: v.id("workoutProgramDays"),
    direction: v.union(v.literal("up"), v.literal("down")),
  },
  handler: async (ctx, { dayId, direction }) => {
    const day = await ctx.db.get(dayId);
    if (!day) return;

    const days = await ctx.db
      .query("workoutProgramDays")
      .withIndex("by_program_order", (q) => q.eq("programId", day.programId))
      .collect();

    const sortedDays = [...days].sort((a, b) => a.order - b.order);
    const index = sortedDays.findIndex((entry) => entry._id === dayId);
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (index === -1 || swapIndex < 0 || swapIndex >= sortedDays.length) return;

    const target = sortedDays[swapIndex];
    const now = Date.now();
    await ctx.db.patch(dayId, { order: target.order, updatedAt: now });
    await ctx.db.patch(target._id, { order: day.order, updatedAt: now });
  },
});

export const removeProgramDay = mutation({
  args: { dayId: v.id("workoutProgramDays") },
  handler: async (ctx, { dayId }) => {
    const day = await ctx.db.get(dayId);
    if (!day) return;

    const exercises = await ctx.db
      .query("workoutProgramExercises")
      .withIndex("by_day_order", (q) => q.eq("programDayId", dayId))
      .collect();

    for (const exercise of exercises) {
      await ctx.db.delete(exercise._id);
    }

    await ctx.db.delete(dayId);

    const remainingDays = await ctx.db
      .query("workoutProgramDays")
      .withIndex("by_program_order", (q) => q.eq("programId", day.programId))
      .collect();

    const now = Date.now();
    for (const [index, remainingDay] of [...remainingDays].sort((a, b) => a.order - b.order).entries()) {
      if (remainingDay.order !== index) {
        await ctx.db.patch(remainingDay._id, { order: index, updatedAt: now });
      }
    }
  },
});

export const addProgramExercise = mutation({
  args: {
    userId: v.id("users"),
    programId: v.id("workoutPrograms"),
    dayId: v.id("workoutProgramDays"),
    name: v.string(),
    setCount: v.optional(v.number()),
    repTarget: v.optional(v.string()),
  },
  handler: async (ctx, { userId, programId, dayId, name, setCount, repTarget }) => {
    const exercises = await ctx.db
      .query("workoutProgramExercises")
      .withIndex("by_day_order", (q) => q.eq("programDayId", dayId))
      .collect();

    const now = Date.now();
    return await ctx.db.insert("workoutProgramExercises", {
      userId,
      programId,
      programDayId: dayId,
      name,
      setCount: setCount ?? 3,
      repTarget: repTarget ?? "10-12",
      order: exercises.length,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateProgramExercise = mutation({
  args: {
    exerciseId: v.id("workoutProgramExercises"),
    name: v.optional(v.string()),
    setCount: v.optional(v.number()),
    repTarget: v.optional(v.string()),
  },
  handler: async (ctx, { exerciseId, name, setCount, repTarget }) => {
    await ctx.db.patch(exerciseId, {
      ...(name !== undefined ? { name } : {}),
      ...(setCount !== undefined ? { setCount } : {}),
      ...(repTarget !== undefined ? { repTarget } : {}),
      updatedAt: Date.now(),
    });
  },
});

export const moveProgramExercise = mutation({
  args: {
    exerciseId: v.id("workoutProgramExercises"),
    direction: v.union(v.literal("up"), v.literal("down")),
  },
  handler: async (ctx, { exerciseId, direction }) => {
    const exercise = await ctx.db.get(exerciseId);
    if (!exercise) return;

    const exercises = await ctx.db
      .query("workoutProgramExercises")
      .withIndex("by_day_order", (q) => q.eq("programDayId", exercise.programDayId))
      .collect();

    const sortedExercises = [...exercises].sort((a, b) => a.order - b.order);
    const index = sortedExercises.findIndex((entry) => entry._id === exerciseId);
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (index === -1 || swapIndex < 0 || swapIndex >= sortedExercises.length) return;

    const target = sortedExercises[swapIndex];
    const now = Date.now();
    await ctx.db.patch(exerciseId, { order: target.order, updatedAt: now });
    await ctx.db.patch(target._id, { order: exercise.order, updatedAt: now });
  },
});

export const removeProgramExercise = mutation({
  args: { exerciseId: v.id("workoutProgramExercises") },
  handler: async (ctx, { exerciseId }) => {
    const exercise = await ctx.db.get(exerciseId);
    if (!exercise) return;

    await ctx.db.delete(exerciseId);

    const remaining = await ctx.db
      .query("workoutProgramExercises")
      .withIndex("by_day_order", (q) => q.eq("programDayId", exercise.programDayId))
      .collect();

    const now = Date.now();
    for (const [index, item] of [...remaining].sort((a, b) => a.order - b.order).entries()) {
      if (item.order !== index) {
        await ctx.db.patch(item._id, { order: index, updatedAt: now });
      }
    }
  },
});

export const saveWorkoutLog = mutation({
  args: {
    userId: v.id("users"),
    programId: v.id("workoutPrograms"),
    programDayId: v.id("workoutProgramDays"),
    workoutDate: v.string(),
    notes: v.optional(v.string()),
    exercises: v.array(
      v.object({
        exerciseTemplateId: v.id("workoutProgramExercises"),
        exerciseName: v.string(),
        order: v.number(),
        notes: v.optional(v.string()),
        sets: v.array(
          v.object({
            reps: v.string(),
            weight: v.string(),
          })
        ),
      })
    ),
  },
  handler: async (ctx, args) => {
    const day = await ctx.db.get(args.programDayId);
    if (!day) {
      throw new Error("Workout day not found");
    }

    const existing = await ctx.db
      .query("workoutLogs")
      .withIndex("by_user_day_date", (q) =>
        q.eq("userId", args.userId).eq("programDayId", args.programDayId).eq("workoutDate", args.workoutDate)
      )
      .first();

    const now = Date.now();
    let workoutLogId = existing?._id;

    if (existing) {
      await ctx.db.patch(existing._id, {
        notes: args.notes,
        workoutDayName: day.name,
        updatedAt: now,
      });

      const existingExerciseLogs = await ctx.db
        .query("workoutExerciseLogs")
        .withIndex("by_log_order", (q) => q.eq("workoutLogId", existing._id))
        .collect();

      for (const existingExerciseLog of existingExerciseLogs) {
        await ctx.db.delete(existingExerciseLog._id);
      }
    } else {
      workoutLogId = await ctx.db.insert("workoutLogs", {
        userId: args.userId,
        programId: args.programId,
        programDayId: args.programDayId,
        workoutDate: args.workoutDate,
        workoutDayName: day.name,
        notes: args.notes,
        createdAt: now,
        updatedAt: now,
      });
    }

    for (const exercise of args.exercises) {
      await ctx.db.insert("workoutExerciseLogs", {
        userId: args.userId,
        workoutLogId: workoutLogId!,
        programDayId: args.programDayId,
        exerciseTemplateId: exercise.exerciseTemplateId,
        exerciseName: exercise.exerciseName,
        order: exercise.order,
        notes: exercise.notes,
        sets: exercise.sets,
        workoutDate: args.workoutDate,
        createdAt: now,
        updatedAt: now,
      });
    }

    return workoutLogId;
  },
});
