// Script to import the weekly homeschool schedule
// Run with: npx convex run scripts/import-schedule:importSchedule --userId <user-id>

import { internalMutation } from "../convex/_generated/server";
import { v } from "convex/values";

const scheduleData = [
  // MONDAY
  { dayOfWeek: "monday", startTime: "07:00", endTime: "07:30", activity: "Journal + Reading" },
  { dayOfWeek: "monday", startTime: "07:30", endTime: "08:00", activity: "Breakfast" },
  { dayOfWeek: "monday", startTime: "08:00", endTime: "08:30", activity: "Chores" },
  { dayOfWeek: "monday", startTime: "08:30", endTime: "09:30", activity: "SPRINTING PROGRAM + JUGGLING" },
  { dayOfWeek: "monday", startTime: "09:30", endTime: "10:00", activity: "READ-ALOUD", notes: "Disappearing Spoon or Blood and Guts" },
  { dayOfWeek: "monday", startTime: "10:00", endTime: "11:00", activity: "Anthony: Synthesis Teams / Roma: 1:1 WITH MOM", notes: "Math Academy help, writing" },
  { dayOfWeek: "monday", startTime: "11:00", endTime: "12:00", activity: "Roma: Synthesis Teams / Anthony: 1:1 WITH MOM", notes: "Math Academy help, writing" },
  { dayOfWeek: "monday", startTime: "12:00", endTime: "14:00", activity: "PASSION PROJECTS + MOM WORK BLOCK", notes: "3D printing, DJ, Card Magic, origami, stop motion" },
  { dayOfWeek: "monday", startTime: "14:00", endTime: "14:30", activity: "ROSETTA STONE ITALIAN", notes: "FAMILY session" },
  { dayOfWeek: "monday", startTime: "14:30", endTime: "15:00", activity: "Free time / transition" },
  { dayOfWeek: "monday", startTime: "15:00", endTime: "16:30", activity: "ROCK CLIMBING", notes: "family - 90 min" },
  { dayOfWeek: "monday", startTime: "16:30", endTime: "17:30", activity: "Free time & Dinner" },
  { dayOfWeek: "monday", startTime: "17:30", endTime: "18:30", activity: "SCREEN TIME" },
  { dayOfWeek: "monday", startTime: "18:30", endTime: "19:30", activity: "Free time / Family time" },
  { dayOfWeek: "monday", startTime: "19:30", endTime: "20:00", activity: "COMPOUND INTEREST + READ-ALOUD & BEDTIME", notes: "5 min compound interest" },

  // TUESDAY
  { dayOfWeek: "tuesday", startTime: "07:00", endTime: "07:30", activity: "Journal + Reading + Free time" },
  { dayOfWeek: "tuesday", startTime: "07:30", endTime: "08:00", activity: "Breakfast" },
  { dayOfWeek: "tuesday", startTime: "08:00", endTime: "08:30", activity: "Chores" },
  { dayOfWeek: "tuesday", startTime: "08:30", endTime: "09:30", activity: "PROJECT OR READING WITH JOEY", notes: "while Mom at Jiu-Jitsu" },
  { dayOfWeek: "tuesday", startTime: "09:30", endTime: "10:30", activity: "PE WITH JOEY" },
  { dayOfWeek: "tuesday", startTime: "10:30", endTime: "11:30", activity: "HEALTH/BODY STUDY", notes: "systems, nutrition, CGM data review" },
  { dayOfWeek: "tuesday", startTime: "11:30", endTime: "12:00", activity: "Lunch & Free time" },
  { dayOfWeek: "tuesday", startTime: "12:00", endTime: "13:00", activity: "ANTHONY: WONDER MATH CLASS / MOM WORK BLOCK", notes: "Roma: Math Academy, independent activities" },
  { dayOfWeek: "tuesday", startTime: "13:00", endTime: "15:30", activity: "PARK MEETUP", notes: "Homeschool group - social time" },
  { dayOfWeek: "tuesday", startTime: "15:30", endTime: "16:00", activity: "Travel to horseback riding" },
  { dayOfWeek: "tuesday", startTime: "16:00", endTime: "17:00", activity: "HORSEBACK RIDING", notes: "both kids" },
  { dayOfWeek: "tuesday", startTime: "17:30", endTime: "18:00", activity: "Dinner" },
  { dayOfWeek: "tuesday", startTime: "18:00", endTime: "19:00", activity: "SCREEN TIME" },
  { dayOfWeek: "tuesday", startTime: "19:00", endTime: "19:30", activity: "Free time" },
  { dayOfWeek: "tuesday", startTime: "19:30", endTime: "20:00", activity: "COMPOUND INTEREST + READ-ALOUD & BEDTIME", notes: "5 min compound interest" },

  // WEDNESDAY
  { dayOfWeek: "wednesday", startTime: "07:00", endTime: "07:30", activity: "Journal + Reading + Free Time" },
  { dayOfWeek: "wednesday", startTime: "07:30", endTime: "08:00", activity: "Breakfast" },
  { dayOfWeek: "wednesday", startTime: "08:00", endTime: "08:30", activity: "Chores" },
  { dayOfWeek: "wednesday", startTime: "08:30", endTime: "09:30", activity: "SPRINTING PROGRAM + JUGGLING" },
  { dayOfWeek: "wednesday", startTime: "09:30", endTime: "11:30", activity: "LEARNING BLOCK", notes: "Health/Science, Math, History, Life Skills, etc" },
  { dayOfWeek: "wednesday", startTime: "11:30", endTime: "12:00", activity: "Lunch" },
  { dayOfWeek: "wednesday", startTime: "12:00", endTime: "14:00", activity: "PASSION PROJECTS + FREE TIME + MOM WORK BLOCK" },
  { dayOfWeek: "wednesday", startTime: "14:00", endTime: "14:30", activity: "ROSETTA STONE ITALIAN", notes: "FAMILY session" },
  { dayOfWeek: "wednesday", startTime: "14:30", endTime: "15:30", activity: "Snack & Reset/Quiet Time" },
  { dayOfWeek: "wednesday", startTime: "15:30", endTime: "16:00", activity: "Prep for activities" },
  { dayOfWeek: "wednesday", startTime: "16:00", endTime: "17:00", activity: "KIDS' BOXING" },
  { dayOfWeek: "wednesday", startTime: "17:00", endTime: "18:00", activity: "KIDS' JIU-JITSU" },
  { dayOfWeek: "wednesday", startTime: "18:00", endTime: "19:00", activity: "MOM'S JIU-JITSU / KIDS: SCREEN TIME" },
  { dayOfWeek: "wednesday", startTime: "19:00", endTime: "19:30", activity: "Dinner" },
  { dayOfWeek: "wednesday", startTime: "19:30", endTime: "20:00", activity: "COMPOUND INTEREST + READ-ALOUD & BEDTIME", notes: "5 min compound interest" },

  // THURSDAY
  { dayOfWeek: "thursday", startTime: "07:00", endTime: "07:30", activity: "Journal + Reading + Free Time" },
  { dayOfWeek: "thursday", startTime: "07:30", endTime: "08:00", activity: "Breakfast" },
  { dayOfWeek: "thursday", startTime: "08:00", endTime: "08:30", activity: "Chores" },
  { dayOfWeek: "thursday", startTime: "08:30", endTime: "09:00", activity: "YOGA + DANCE PARTY" },
  { dayOfWeek: "thursday", startTime: "09:00", endTime: "10:00", activity: "MOM'S JIU-JITSU / Kids: MATH ACADEMY + MEMBEAN/TEACHTALES + WORKBOOKS" },
  { dayOfWeek: "thursday", startTime: "10:00", endTime: "10:30", activity: "CAR LEARNING", notes: "drive to Ninja: podcasts, discussions, math facts" },
  { dayOfWeek: "thursday", startTime: "10:30", endTime: "11:00", activity: "ROMA: MAGIC PRACTICE / ANTHONY: BEYBLADES", notes: "before Ninja" },
  { dayOfWeek: "thursday", startTime: "11:00", endTime: "12:00", activity: "NINJA WARRIOR" },
  { dayOfWeek: "thursday", startTime: "12:00", endTime: "13:30", activity: "PLAY DATE", notes: "social time" },
  { dayOfWeek: "thursday", startTime: "14:00", endTime: "15:30", activity: "COOKING / MEAL PREP", notes: "flour milling, bread making, nutrition experiments" },
  { dayOfWeek: "thursday", startTime: "16:00", endTime: "17:00", activity: "OUTSCHOOL DRAWING" },
  { dayOfWeek: "thursday", startTime: "17:00", endTime: "17:30", activity: "SCREEN TIME" },
  { dayOfWeek: "thursday", startTime: "17:30", endTime: "18:00", activity: "Travel to soccer" },
  { dayOfWeek: "thursday", startTime: "18:00", endTime: "20:00", activity: "ROMA'S SOCCER + MOM COACHES", notes: "Anthony with Joey or at field" },
  { dayOfWeek: "thursday", startTime: "20:00", endTime: "20:30", activity: "Late dinner / snack" },
  { dayOfWeek: "thursday", startTime: "20:30", endTime: "21:00", activity: "INDEPENDENT READING & BEDTIME", notes: "no formal read-aloud - late night" },

  // FRIDAY
  { dayOfWeek: "friday", startTime: "07:00", endTime: "07:30", activity: "Journal + Reading + Free Time" },
  { dayOfWeek: "friday", startTime: "07:30", endTime: "08:00", activity: "Breakfast" },
  { dayOfWeek: "friday", startTime: "08:00", endTime: "08:30", activity: "Chores" },
  { dayOfWeek: "friday", startTime: "08:30", endTime: "09:30", activity: "SPRINTING PROGRAM + JUGGLING" },
  { dayOfWeek: "friday", startTime: "09:30", endTime: "11:30", activity: "LEARNING BLOCK", notes: "Health, Tuttle Twins, Origami, Shakespeare, life skills" },
  { dayOfWeek: "friday", startTime: "11:30", endTime: "14:00", activity: "SKY ZONE OR FIELD TRIP", notes: "alternate weeks" },
  { dayOfWeek: "friday", startTime: "14:00", endTime: "16:00", activity: "Free time" },
  { dayOfWeek: "friday", startTime: "16:00", endTime: "17:00", activity: "SCREEN TIME / FREE TIME" },
  { dayOfWeek: "friday", startTime: "17:30", endTime: "18:30", activity: "KIDS' JIU-JITSU / MOM WORK BLOCK" },
  { dayOfWeek: "friday", startTime: "19:00", endTime: "20:30", activity: "DINNER + MOVIE NIGHT" },
  { dayOfWeek: "friday", startTime: "20:30", endTime: "21:00", activity: "COMPOUND INTEREST + READ-ALOUD & BEDTIME", notes: "5 min compound interest" },

  // SATURDAY
  { dayOfWeek: "saturday", startTime: "10:00", endTime: "12:00", activity: "CATCH-UP SCHOOLWORK OR ROCK CLIMBING OR Free Time", notes: "Flexible - catch up if needed" },
  { dayOfWeek: "saturday", startTime: "12:00", endTime: "18:00", activity: "FAMILY PROJECTS or PLAYDATE" },
  { dayOfWeek: "saturday", startTime: "18:00", endTime: "21:00", activity: "Free time", notes: "movies, games, rest" },

  // SUNDAY
  { dayOfWeek: "sunday", startTime: "08:00", endTime: "09:30", activity: "SUNDAY MORNING CHILL & CUDDLES & FREE TIME" },
  { dayOfWeek: "sunday", startTime: "09:30", endTime: "11:30", activity: "HOUSE CLEANING / RESET", notes: "everyone helps" },
  { dayOfWeek: "sunday", startTime: "11:30", endTime: "12:30", activity: "MEAL PREP SESSION", notes: "peanut butter, hummus, nut milk, bread for week + flour milling practice" },
  { dayOfWeek: "sunday", startTime: "12:30", endTime: "13:00", activity: "Lunch" },
  { dayOfWeek: "sunday", startTime: "13:00", endTime: "14:00", activity: "SCREEN TIME" },
  { dayOfWeek: "sunday", startTime: "14:00", endTime: "15:00", activity: "FAMILY ITALIAN PRACTICE OR ORIGAMI OR CARD MAGIC PRO", notes: "flexible family learning" },
  { dayOfWeek: "sunday", startTime: "15:00", endTime: "17:00", activity: "FREE TIME" },
  { dayOfWeek: "sunday", startTime: "17:00", endTime: "17:30", activity: "FAMILY MEETING" },
  { dayOfWeek: "sunday", startTime: "17:30", endTime: "18:30", activity: "FAMILY GAME NIGHT" },
  { dayOfWeek: "sunday", startTime: "18:30", endTime: "19:00", activity: "Dinner" },
  { dayOfWeek: "sunday", startTime: "19:30", endTime: "20:00", activity: "COMPOUND INTEREST + READ-ALOUD", notes: "5 min compound interest" },
];

export const importSchedule = internalMutation({
  args: {
    userId: v.id("users"),
    clearExisting: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Clear existing schedule if requested
    if (args.clearExisting) {
      const existing = await ctx.db
        .query("weeklySchedule")
        .withIndex("by_user_and_day", (q) => q.eq("userId", args.userId))
        .collect();
      
      for (const block of existing) {
        await ctx.db.delete(block._id);
      }
    }

    // Insert all schedule blocks
    const insertedIds = [];
    for (const block of scheduleData) {
      const id = await ctx.db.insert("weeklySchedule", {
        userId: args.userId,
        dayOfWeek: block.dayOfWeek as any,
        startTime: block.startTime,
        endTime: block.endTime,
        activity: block.activity,
        notes: block.notes,
        createdAt: Date.now(),
      });
      insertedIds.push(id);
    }

    return {
      success: true,
      count: insertedIds.length,
      message: `Successfully imported ${insertedIds.length} schedule blocks`,
    };
  },
});
