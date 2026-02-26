import { v } from "convex/values";
import { mutation } from "./_generated/server";

// Seed the weekly template based on current schedule
export const seedWeeklyTemplate = mutation({
  args: {},
  handler: async (ctx) => {
    const templates = [
      {
        dayOfWeek: 1,
        dayName: "Monday",
        blocks: [
          { id: "mon-1", startTime: "09:00", endTime: "10:00", subject: "Critical Thinking", defaultActivity: "Synthesis Teams", isDigital: true, notes: "Anthony & Roma alternate (one does Teams, one gets 1:1 time)", color: "purple" },
          { id: "mon-2", startTime: "10:00", endTime: "11:00", subject: "Math", defaultActivity: "Wonder Math", isDigital: true, color: "blue" },
          { id: "mon-3", startTime: "11:00", endTime: "12:00", subject: "Language Arts", defaultActivity: "Reading/Writing", isDigital: false, color: "green" },
          { id: "mon-4", startTime: "13:00", endTime: "14:00", subject: "Italian", defaultActivity: "Rosetta Stone", isDigital: true, notes: "Family learning together! 🇮🇹", color: "red" },
          { id: "mon-5", startTime: "14:00", endTime: "15:00", subject: "Life Skills", defaultActivity: "Raising Healthy Families", isDigital: true, color: "orange" },
          { id: "mon-6", startTime: "15:00", endTime: "16:00", subject: "PE", defaultActivity: "PE/Outside Time", isDigital: false, notes: "Gym, ninja course, or outdoor play", color: "teal" },
        ],
      },
      {
        dayOfWeek: 2,
        dayName: "Tuesday",
        blocks: [
          { id: "tue-1", startTime: "09:00", endTime: "10:00", subject: "Math", defaultActivity: "Math Academy / Synthesis Math", isDigital: true, color: "blue" },
          { id: "tue-2", startTime: "10:00", endTime: "11:00", subject: "Science", defaultActivity: "Science Projects", isDigital: false, notes: "Use STEM kits, experiments", color: "yellow" },
          { id: "tue-3", startTime: "11:00", endTime: "12:00", subject: "Art", defaultActivity: "Drawing Class (Outschool)", isDigital: true, color: "pink" },
          { id: "tue-4", startTime: "13:00", endTime: "14:00", subject: "Language Arts", defaultActivity: "Reading/Literature", isDigital: false, color: "green" },
          { id: "tue-5", startTime: "14:00", endTime: "15:00", subject: "History", defaultActivity: "Story of the World", isDigital: false, color: "brown" },
          { id: "tue-6", startTime: "15:00", endTime: "16:00", subject: "PE", defaultActivity: "PE/Outside Time", isDigital: false, color: "teal" },
        ],
      },
      {
        dayOfWeek: 3,
        dayName: "Wednesday",
        blocks: [
          { id: "wed-1", startTime: "09:00", endTime: "10:00", subject: "Critical Thinking", defaultActivity: "Synthesis Teams", isDigital: true, notes: "Swap from Monday", color: "purple" },
          { id: "wed-2", startTime: "10:00", endTime: "11:00", subject: "Math", defaultActivity: "Wonder Math", isDigital: true, color: "blue" },
          { id: "wed-3", startTime: "11:00", endTime: "12:00", subject: "Language Arts", defaultActivity: "Writing With Skill", isDigital: false, color: "green" },
          { id: "wed-4", startTime: "13:00", endTime: "14:00", subject: "Italian", defaultActivity: "Rosetta Stone", isDigital: true, color: "red" },
          { id: "wed-5", startTime: "14:00", endTime: "15:00", subject: "Entrepreneurship", defaultActivity: "Kidpreneurs", isDigital: true, color: "gold" },
          { id: "wed-6", startTime: "15:00", endTime: "16:00", subject: "PE", defaultActivity: "PE/Outside Time", isDigital: false, color: "teal" },
        ],
      },
      {
        dayOfWeek: 4,
        dayName: "Thursday",
        blocks: [
          { id: "thu-1", startTime: "09:00", endTime: "10:00", subject: "Math", defaultActivity: "Math Academy / Synthesis Math", isDigital: true, color: "blue" },
          { id: "thu-2", startTime: "10:00", endTime: "11:00", subject: "Science", defaultActivity: "Science Projects", isDigital: false, color: "yellow" },
          { id: "thu-3", startTime: "11:00", endTime: "12:00", subject: "Language Arts", defaultActivity: "Reading/Literature", isDigital: false, color: "green" },
          { id: "thu-4", startTime: "13:00", endTime: "14:00", subject: "Typing", defaultActivity: "Typing.com", isDigital: true, color: "gray" },
          { id: "thu-5", startTime: "14:00", endTime: "15:00", subject: "History", defaultActivity: "History/Geography", isDigital: false, color: "brown" },
          { id: "thu-6", startTime: "15:00", endTime: "16:00", subject: "PE", defaultActivity: "PE/Outside Time", isDigital: false, color: "teal" },
        ],
      },
      {
        dayOfWeek: 5,
        dayName: "Friday",
        blocks: [
          { id: "fri-1", startTime: "09:00", endTime: "10:00", subject: "Math", defaultActivity: "Math Review/Games", isDigital: false, notes: "Prime Climb, Zeus on the Loose, etc.", color: "blue" },
          { id: "fri-2", startTime: "10:00", endTime: "11:00", subject: "Life Skills", defaultActivity: "Kids Cooking Program", isDigital: true, color: "orange" },
          { id: "fri-3", startTime: "11:00", endTime: "12:00", subject: "Art", defaultActivity: "Art/Making Projects", isDigital: false, notes: "3D printing, pottery, crafts", color: "pink" },
          { id: "fri-4", startTime: "13:00", endTime: "14:00", subject: "Italian", defaultActivity: "Rosetta Stone", isDigital: true, color: "red" },
          { id: "fri-5", startTime: "14:00", endTime: "15:00", subject: "Free Choice", defaultActivity: "Free Choice Learning", isDigital: false, notes: "Student picks topic/activity", color: "rainbow" },
          { id: "fri-6", startTime: "15:00", endTime: "16:00", subject: "PE", defaultActivity: "PepSpeed Sprinting", isDigital: true, color: "teal" },
        ],
      },
    ];

    for (const template of templates) {
      const existing = await ctx.db
        .query("hsWeeklyTemplate")
        .withIndex("by_day", (q) => q.eq("dayOfWeek", template.dayOfWeek))
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, template);
      } else {
        await ctx.db.insert("hsWeeklyTemplate", template);
      }
    }

    return { success: true, message: "Weekly template seeded!" };
  },
});

// Seed digital resources
export const seedDigitalResources = mutation({
  args: {},
  handler: async (ctx) => {
    const digitalResources = [
      { name: "Math Academy", type: "digital", category: "math", subjects: ["math"], isDigital: true, url: "https://mathacademy.com", tags: ["daily", "curriculum"], notes: "Online math curriculum" },
      { name: "Synthesis Math", type: "digital", category: "math", subjects: ["math", "problem-solving"], isDigital: true, url: "https://synthesis.com", tags: ["daily"], notes: "Advanced math from SpaceX/Ad Astra" },
      { name: "Synthesis Teams", type: "digital", category: "critical-thinking", subjects: ["critical-thinking", "teamwork", "problem-solving"], isDigital: true, url: "https://synthesis.com", tags: ["favorite", "mon-wed"], notes: "Team problem-solving games" },
      { name: "Rosetta Stone - Italian", type: "digital", category: "language", subjects: ["italian", "language"], isDigital: true, url: "https://rosettastone.com", tags: ["family", "mon-wed-fri"], notes: "Family learning together! 🇮🇹" },
      { name: "Raising Healthy Families", type: "digital", category: "life-skills", subjects: ["life-skills", "character"], isDigital: true, url: "https://kimball.link/rrHec", tags: ["monday"], notes: "Life skills curriculum" },
      { name: "Typing.com", type: "digital", category: "typing", subjects: ["typing", "tech"], isDigital: true, url: "https://typing.com", tags: ["thursday"], notes: "Keyboard/typing skills" },
      { name: "Kidpreneurs", type: "digital", category: "entrepreneurship", subjects: ["entrepreneurship", "business", "money"], isDigital: true, url: "https://members.raisingempoweredkids.com", tags: ["wednesday"], notes: "Business/entrepreneurship for kids" },
      { name: "Kids Cooking Program", type: "digital", category: "life-skills", subjects: ["cooking", "life-skills", "math"], isDigital: true, tags: ["friday"], notes: "Culinary skills" },
      { name: "PepSpeed", type: "digital", category: "athletics", subjects: ["pe", "athletics", "sprinting"], isDigital: true, url: "https://pepspeed.com", tags: ["friday"], notes: "Sprint training program" },
      { name: "Outschool - Drawing Class", type: "digital", category: "art", subjects: ["art", "drawing"], isDigital: true, url: "https://outschool.com", tags: ["tuesday"], notes: "Online drawing class" },
      { name: "Wonder Math", type: "digital", category: "math", subjects: ["math"], isDigital: true, tags: ["mon-wed"], notes: "Live small group math class" },
      { name: "CrunchLabs Subscription", type: "digital", category: "engineering", subjects: ["engineering", "stem", "science"], isDigital: false, tags: ["monthly", "mark-rober"], notes: "Monthly engineering box from Mark Rober" },
      { name: "Universal Yums", type: "digital", category: "geography", subjects: ["geography", "culture", "world"], isDigital: false, tags: ["monthly"], notes: "Snack box from different countries - geography lesson!" },
    ];

    for (const resource of digitalResources) {
      const existing = await ctx.db
        .query("hsResources")
        .withSearchIndex("search_resources", (q) => q.search("name", resource.name))
        .first();

      if (!existing) {
        await ctx.db.insert("hsResources", {
          ...resource,
          lastUsed: undefined,
          timesUsed: 0,
        });
      }
    }

    return { success: true, message: "Digital resources seeded!" };
  },
});

// Seed a sample quarter
export const seedSampleQuarter = mutation({
  args: {},
  handler: async (ctx) => {
    // Q2 2026 - leading up to Texas trip
    const q2 = await ctx.db.insert("hsQuarters", {
      name: "Q2 2026 - Texas & American Southwest",
      startDate: "2026-04-01",
      endDate: "2026-06-30",
      theme: "Texas History & American Frontier",
      objectives: [
        "Understand Texas Revolution and the Alamo",
        "Learn about Mexican-American relations",
        "Explore frontier/westward expansion",
        "Geography of American Southwest",
        "Spanish language basics (tie to trip)",
      ],
      tripTieIn: "End of April 2026 - Texas road trip (Alamo, etc.)",
      notes: "Build up to Texas trip with relevant history and geography",
    });

    // April focus
    await ctx.db.insert("hsMonthlyFocus", {
      quarterId: q2,
      month: "April 2026",
      theme: "The Alamo & Texas Revolution",
      objectives: [
        "Know the key figures: Santa Anna, Sam Houston, Davy Crockett, Jim Bowie",
        "Understand why Texas wanted independence",
        "Timeline of Texas Revolution",
        "Geography: Map of Texas, Mexico border",
      ],
      keyResources: ["Story of the World", "I Survived books", "Maps"],
      notes: "Trip at end of month - this is the pre-trip deep dive!",
    });

    return { success: true, quarterId: q2 };
  },
});

// Generate daily schedules for a week from template
export const generateWeekFromTemplate = mutation({
  args: { weekStartDate: v.string() }, // Monday of the week
  handler: async (ctx, args) => {
    const startDate = new Date(args.weekStartDate);
    const templates = await ctx.db.query("hsWeeklyTemplate").collect();

    const created = [];

    for (let i = 0; i < 5; i++) {
      // Monday through Friday
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dateStr = date.toISOString().split("T")[0];
      const dayOfWeek = date.getDay();

      const template = templates.find((t) => t.dayOfWeek === dayOfWeek);
      if (!template) continue;

      // Check if already exists
      const existing = await ctx.db
        .query("hsDailySchedule")
        .withIndex("by_date", (q) => q.eq("date", dateStr))
        .first();

      if (existing) {
        created.push({ date: dateStr, status: "already exists" });
        continue;
      }

      const blocks = template.blocks.map((b) => ({
        ...b,
        activity: b.defaultActivity,
        completed: false,
      }));

      await ctx.db.insert("hsDailySchedule", {
        date: dateStr,
        dayOfWeek,
        blocks,
      });

      created.push({ date: dateStr, status: "created" });
    }

    return { success: true, created };
  },
});


