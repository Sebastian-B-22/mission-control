import { mutation } from "./_generated/server";

// Quick reimport for first user - full schedule reset
export const reset = mutation({
  args: {},
  handler: async (ctx) => {
    // Find first user
    const allUsers = await ctx.db.query("users").collect();
    const user = allUsers[0];
    if (!user) throw new Error("No users found");

    // Clear existing schedule
    const existing = await ctx.db
      .query("weeklySchedule")
      .withIndex("by_user_and_day", (q) => q.eq("userId", user._id))
      .collect();
    for (const block of existing) {
      await ctx.db.delete(block._id);
    }

    // Full schedule data
    const scheduleData = [
      // MONDAY
      { dayOfWeek: "monday", startTime: "07:00", endTime: "07:30", activity: "Journal + Reading + Free Time" },
      { dayOfWeek: "monday", startTime: "07:30", endTime: "08:00", activity: "Breakfast" },
      { dayOfWeek: "monday", startTime: "08:00", endTime: "08:30", activity: "Chores" },
      { dayOfWeek: "monday", startTime: "08:30", endTime: "09:30", activity: "Sprinting Program + Juggling" },
      { dayOfWeek: "monday", startTime: "09:30", endTime: "10:00", activity: "Writing with Skill" },
      { dayOfWeek: "monday", startTime: "10:00", endTime: "11:00", activity: "Anthony: Synthesis Teams / Roma: 1:1 with Mom", notes: "Math Academy review, Writing with Skill review, Socratic discussions" },
      { dayOfWeek: "monday", startTime: "11:00", endTime: "12:00", activity: "Roma: Synthesis Teams / Anthony: 1:1 with Mom", notes: "Math Academy review, Writing with Skill review, Socratic discussions" },
      { dayOfWeek: "monday", startTime: "12:00", endTime: "14:00", activity: "Passion Projects + Mom Work Block", notes: "3D printing, DJ, Card Magic, origami, stop motion", color: "mom-work" },
      { dayOfWeek: "monday", startTime: "14:00", endTime: "14:30", activity: "Rosetta Stone Italian + Life Skills", notes: "Family session - Italian OR How to Be a Person / Manners book" },
      { dayOfWeek: "monday", startTime: "14:30", endTime: "15:00", activity: "Free Time / Transition" },
      { dayOfWeek: "monday", startTime: "15:00", endTime: "16:30", activity: "Rock Climbing", notes: "Family - 90 min" },
      { dayOfWeek: "monday", startTime: "16:30", endTime: "17:30", activity: "Free Time & Dinner" },
      { dayOfWeek: "monday", startTime: "17:30", endTime: "18:30", activity: "Screen Time" },
      { dayOfWeek: "monday", startTime: "18:30", endTime: "19:30", activity: "Free Time / Family Time" },
      { dayOfWeek: "monday", startTime: "19:30", endTime: "20:00", activity: "Compound Interest + Read-Aloud & Bedtime", notes: "5 min compound interest" },
      
      // TUESDAY
      { dayOfWeek: "tuesday", startTime: "07:00", endTime: "07:30", activity: "Journal + Reading + Free Time" },
      { dayOfWeek: "tuesday", startTime: "07:30", endTime: "08:00", activity: "Breakfast" },
      { dayOfWeek: "tuesday", startTime: "08:00", endTime: "08:30", activity: "Chores" },
      { dayOfWeek: "tuesday", startTime: "08:30", endTime: "09:30", activity: "Project or Reading with Joey", notes: "While Mom at Jiu-Jitsu", color: "mom-work" },
      { dayOfWeek: "tuesday", startTime: "09:30", endTime: "10:30", activity: "PE with Joey", notes: "March: Throwing & Rolling Games" },
      { dayOfWeek: "tuesday", startTime: "10:30", endTime: "11:30", activity: "Health/Body Study", notes: "Einstein Body Kit, Blood & Guts, CGM data review, nutrition discussion" },
      { dayOfWeek: "tuesday", startTime: "11:30", endTime: "12:00", activity: "Lunch & Free Time" },
      { dayOfWeek: "tuesday", startTime: "12:00", endTime: "13:00", activity: "Anthony: Wonder Math Class / Mom Work Block", notes: "Roma: Math Academy, independent activities", color: "mom-work" },
      { dayOfWeek: "tuesday", startTime: "13:00", endTime: "15:30", activity: "Park Meetup + Play Date", notes: "Homeschool group - social time" },
      { dayOfWeek: "tuesday", startTime: "15:30", endTime: "16:00", activity: "Travel to Horseback Riding" },
      { dayOfWeek: "tuesday", startTime: "16:00", endTime: "17:00", activity: "Horseback Riding", notes: "Both kids" },
      { dayOfWeek: "tuesday", startTime: "17:30", endTime: "18:00", activity: "Dinner" },
      { dayOfWeek: "tuesday", startTime: "18:00", endTime: "19:00", activity: "Screen Time" },
      { dayOfWeek: "tuesday", startTime: "19:00", endTime: "19:30", activity: "Free Time" },
      { dayOfWeek: "tuesday", startTime: "19:30", endTime: "20:00", activity: "Compound Interest + Read-Aloud & Bedtime", notes: "5 min compound interest" },
      
      // WEDNESDAY
      { dayOfWeek: "wednesday", startTime: "07:00", endTime: "07:30", activity: "Journal + Reading + Free Time" },
      { dayOfWeek: "wednesday", startTime: "07:30", endTime: "08:00", activity: "Breakfast" },
      { dayOfWeek: "wednesday", startTime: "08:00", endTime: "08:30", activity: "Chores" },
      { dayOfWeek: "wednesday", startTime: "08:30", endTime: "09:30", activity: "Sprinting Program + Juggling" },
      { dayOfWeek: "wednesday", startTime: "09:30", endTime: "11:30", activity: "Learning Block", notes: "Health/Science, Math, History, Writing, Shakespeare" },
      { dayOfWeek: "wednesday", startTime: "11:30", endTime: "12:00", activity: "Lunch" },
      { dayOfWeek: "wednesday", startTime: "12:00", endTime: "14:00", activity: "Passion Projects + Free Time + Mom Work Block", color: "mom-work" },
      { dayOfWeek: "wednesday", startTime: "14:00", endTime: "14:30", activity: "Rosetta Stone Italian + Life Skills", notes: "Family session - Italian OR How to Be a Person / Manners book" },
      { dayOfWeek: "wednesday", startTime: "14:30", endTime: "15:30", activity: "Snack & Reset/Quiet Time" },
      { dayOfWeek: "wednesday", startTime: "15:30", endTime: "16:00", activity: "Prep for Activities" },
      { dayOfWeek: "wednesday", startTime: "16:00", endTime: "17:00", activity: "Kids' Boxing" },
      { dayOfWeek: "wednesday", startTime: "17:00", endTime: "18:00", activity: "Kids' Jiu-Jitsu" },
      { dayOfWeek: "wednesday", startTime: "18:00", endTime: "19:00", activity: "Mom's Jiu-Jitsu / Kids: Screen Time", color: "mom-work" },
      { dayOfWeek: "wednesday", startTime: "19:00", endTime: "19:30", activity: "Dinner" },
      { dayOfWeek: "wednesday", startTime: "19:30", endTime: "20:00", activity: "Compound Interest + Read-Aloud & Bedtime", notes: "5 min compound interest" },
      
      // THURSDAY
      { dayOfWeek: "thursday", startTime: "07:00", endTime: "07:30", activity: "Journal + Reading + Free Time" },
      { dayOfWeek: "thursday", startTime: "07:30", endTime: "08:00", activity: "Breakfast" },
      { dayOfWeek: "thursday", startTime: "08:00", endTime: "08:30", activity: "Chores" },
      { dayOfWeek: "thursday", startTime: "08:30", endTime: "09:00", activity: "Yoga + Dance Party" },
      { dayOfWeek: "thursday", startTime: "09:00", endTime: "10:00", activity: "Mom's Jiu-Jitsu / Kids: Math Academy + Membean + Workbooks", color: "mom-work" },
      { dayOfWeek: "thursday", startTime: "10:00", endTime: "10:30", activity: "Car Learning", notes: "Podcasts: Greeking Out, Homeschool History, Brains On, The Past and the Curious, Dead Funny History" },
      { dayOfWeek: "thursday", startTime: "10:30", endTime: "11:00", activity: "Roma: Magic Practice / Anthony: Beyblades", notes: "Before Ninja" },
      { dayOfWeek: "thursday", startTime: "11:00", endTime: "12:00", activity: "Ninja Warrior" },
      { dayOfWeek: "thursday", startTime: "12:00", endTime: "13:30", activity: "Homeschool Group + Play Date", notes: "Social time" },
      { dayOfWeek: "thursday", startTime: "14:00", endTime: "15:30", activity: "Cooking / Meal Prep", notes: "Recipes: Hummus, Coconut Cashew Milk, Bread, Peanut Butter" },
      { dayOfWeek: "thursday", startTime: "16:00", endTime: "17:00", activity: "Outschool Drawing" },
      { dayOfWeek: "thursday", startTime: "17:00", endTime: "17:30", activity: "Screen Time" },
      { dayOfWeek: "thursday", startTime: "17:30", endTime: "18:00", activity: "Travel to Soccer" },
      { dayOfWeek: "thursday", startTime: "18:00", endTime: "20:00", activity: "Roma's Soccer + Mom Coaches", notes: "Anthony with Joey or at field" },
      { dayOfWeek: "thursday", startTime: "20:00", endTime: "20:30", activity: "Late Dinner / Snack" },
      { dayOfWeek: "thursday", startTime: "20:30", endTime: "21:00", activity: "Independent Reading & Bedtime", notes: "No formal read-aloud - late night" },
      
      // FRIDAY
      { dayOfWeek: "friday", startTime: "07:00", endTime: "07:30", activity: "Journal + Reading + Free Time" },
      { dayOfWeek: "friday", startTime: "07:30", endTime: "08:00", activity: "Breakfast" },
      { dayOfWeek: "friday", startTime: "08:00", endTime: "08:30", activity: "Chores" },
      { dayOfWeek: "friday", startTime: "08:30", endTime: "09:30", activity: "Sprinting Program + Juggling" },
      { dayOfWeek: "friday", startTime: "09:30", endTime: "11:30", activity: "Learning Block", notes: "Health/Science, Shakespeare, Financial Literacy, Math, Civics (Tuttle Twins), Italian" },
      { dayOfWeek: "friday", startTime: "11:30", endTime: "14:00", activity: "Sky Zone or Field Trip", notes: "Alternate weeks" },
      { dayOfWeek: "friday", startTime: "14:00", endTime: "16:00", activity: "Passion Projects / Free Time" },
      { dayOfWeek: "friday", startTime: "16:00", endTime: "17:00", activity: "Screen Time" },
      { dayOfWeek: "friday", startTime: "17:30", endTime: "18:30", activity: "Kids' Jiu-Jitsu / Mom Work Block", color: "mom-work" },
      { dayOfWeek: "friday", startTime: "19:00", endTime: "20:30", activity: "Dinner + Movie Night", notes: "Check Family Meeting movie list" },
      { dayOfWeek: "friday", startTime: "20:30", endTime: "21:00", activity: "Compound Interest + Read-Aloud & Bedtime", notes: "5 min compound interest" },
      
      // SATURDAY
      { dayOfWeek: "saturday", startTime: "08:00", endTime: "12:00", activity: "Spring League Games / Catch-Up", notes: "Games start Mar 7 - flexible timing" },
      { dayOfWeek: "saturday", startTime: "12:00", endTime: "18:00", activity: "Family Projects or Playdate" },
      { dayOfWeek: "saturday", startTime: "18:00", endTime: "21:00", activity: "Free Time", notes: "Movies, games, rest" },
      
      // SUNDAY
      { dayOfWeek: "sunday", startTime: "08:00", endTime: "09:30", activity: "Sunday Morning Chill & Cuddles & Free Time" },
      { dayOfWeek: "sunday", startTime: "09:30", endTime: "11:30", activity: "House Cleaning / Reset", notes: "Everyone helps" },
      { dayOfWeek: "sunday", startTime: "11:30", endTime: "12:30", activity: "Cooking / Meal Prep", notes: "Peanut butter, hummus, nut milk, bread for week + flour milling" },
      { dayOfWeek: "sunday", startTime: "12:30", endTime: "13:00", activity: "Lunch" },
      { dayOfWeek: "sunday", startTime: "13:00", endTime: "14:00", activity: "Screen Time" },
      { dayOfWeek: "sunday", startTime: "14:00", endTime: "15:00", activity: "Family Italian Practice or Origami or Card Magic Pro", notes: "Flexible family learning" },
      { dayOfWeek: "sunday", startTime: "15:00", endTime: "17:00", activity: "Free Time" },
      { dayOfWeek: "sunday", startTime: "17:00", endTime: "17:30", activity: "Family Meeting" },
      { dayOfWeek: "sunday", startTime: "17:30", endTime: "18:30", activity: "Family Game Night" },
      { dayOfWeek: "sunday", startTime: "18:30", endTime: "19:00", activity: "Dinner" },
      { dayOfWeek: "sunday", startTime: "19:30", endTime: "20:00", activity: "Compound Interest + Read-Aloud", notes: "5 min compound interest" },
    ];

    // Insert all schedule blocks
    let insertedCount = 0;
    for (const block of scheduleData) {
      await ctx.db.insert("weeklySchedule", {
        userId: user._id,
        dayOfWeek: block.dayOfWeek as "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday",
        startTime: block.startTime,
        endTime: block.endTime,
        activity: block.activity,
        notes: block.notes,
        color: block.color,
        createdAt: Date.now(),
      });
      insertedCount++;
    }

    return { userId: user._id, cleared: existing.length, inserted: insertedCount, message: "Schedule reimported successfully!" };
  },
});
