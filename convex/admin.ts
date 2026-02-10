import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Admin function to manually initialize user data
export const manuallyInitializeUser = mutation({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    // Find the user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Check if already initialized
    const existingTeamMembers = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (existingTeamMembers) {
      return { message: "User already initialized" };
    }

    // Initialize team members
    const defaultMembers = [
      { name: "Corinne", role: "Owner/Coach" },
      { name: "Sebastian", role: "AI Assistant" },
      { name: "Allie", role: "Virtual Assistant" },
    ];

    for (const member of defaultMembers) {
      await ctx.db.insert("teamMembers", {
        userId: user._id,
        name: member.name,
        role: member.role,
        active: true,
        createdAt: Date.now(),
      });
    }

    // Initialize habit templates (if not exist)
    const existingHabits = await ctx.db
      .query("habitTemplates")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (!existingHabits) {
      const defaultHabits = [
        { name: "Morning light", icon: "☀️", order: 0 },
        { name: "Redlight/meditation", icon: "🧘", order: 1 },
        { name: "Workout before 8am", icon: "💪", order: 2 },
        { name: "Take all supplements", icon: "💊", order: 3 },
        { name: "Ice bath", icon: "🧊", order: 4 },
        { name: "Sauna", icon: "🔥", order: 5 },
        { name: "Screens off by 9:30 pm", icon: "📱", order: 6 },
        { name: "Sleep 7.5 hours", icon: "😴", order: 7 },
      ];

      for (const habit of defaultHabits) {
        await ctx.db.insert("habitTemplates", {
          userId: user._id,
          name: habit.name,
          icon: habit.icon,
          active: true,
          order: habit.order,
          createdAt: Date.now(),
        });
      }
    }

    return { message: "User initialized successfully!" };
  },
});

// Import weekly schedule
export const importWeeklySchedule = mutation({
  args: { 
    clerkId: v.string(),
    clearExisting: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Find the user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Schedule data
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

    // Clear existing if requested
    if (args.clearExisting) {
      const existing = await ctx.db
        .query("weeklySchedule")
        .withIndex("by_user_and_day", (q) => q.eq("userId", user._id))
        .collect();
      
      for (const block of existing) {
        await ctx.db.delete(block._id);
      }
    }

    // Insert all schedule blocks
    let insertedCount = 0;
    for (const block of scheduleData) {
      await ctx.db.insert("weeklySchedule", {
        userId: user._id,
        dayOfWeek: block.dayOfWeek as any,
        startTime: block.startTime,
        endTime: block.endTime,
        activity: block.activity,
        notes: block.notes,
        createdAt: Date.now(),
      });
      insertedCount++;
    }

    return {
      success: true,
      count: insertedCount,
      message: `Successfully imported ${insertedCount} schedule blocks for all 7 days!`,
    };
  },
});

// Update RPM category purposes
export const updateRPMPurposes = mutation({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const categories = await ctx.db
      .query("rpmCategories")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Map of category names to purposes and roles
    const categoryData: Record<string, { purpose: string; role: string }> = {
      // Personal
      "Financial Independence & Freedom": {
        purpose: "To take massive action towards creating a compelling future, eradicate financial stress, and live life on MY terms with abundance and ease.",
        role: "Disciplined Wealth Builder"
      },
      "Bangin' Ass Body": {
        purpose: "To show up every damn day with sexy confidence, limitless energy, and a body that feels as good as it looks.",
        role: "Elite Performer"
      },
      "Home Haven & Sanctuary": {
        purpose: "To create a space where my family feels loved, safe, and at peace - our refuge from the chaos of the world.",
        role: "Intentional Nest Creator"
      },
      "Extraordinary Friendships": {
        purpose: "To consistently invest in and deepen relationships with my friends and family who make life richer, more joyful, and full of meaning.",
        role: "Loyal Connector"
      },
      "Phenomenal Relationship": {
        purpose: "To nurture a passionate partnership with Joey that models what an extraordinary relationship truly looks like for our kids.",
        role: "Devoted Partner"
      },
      "Raising Resilient Humans": {
        purpose: "To guide Anthony & Roma to become confident, curious, capable humans who know they're deeply loved and can create their own extraordinary lives.",
        role: "Empowering Guide"
      },
      "Magnificent Mommy/Homeschooling Hero": {
        purpose: "To guide Anthony & Roma to become confident, curious, capable humans who know they're deeply loved and can create their own extraordinary lives.",
        role: "Empowering Guide"
      },
      
      // Professional
      "Bad Ass Business Owner": {
        purpose: "To build a thriving business that creates the freedom, impact, and lifestyle I deserve - on my own terms.",
        role: "Strategic Visionary"
      },
      "HTA Empire Builder": {
        purpose: "To create a game-changing brand that transforms how families connect through sports - and scales like crazy.",
        role: "Product Innovator"
      },
      "Staff Empowerment & Kickass Workplace": {
        purpose: "To build a team of empowered, passionate coaches who love what they do and help each other win every day.",
        role: "Inspiring Leader"
      },
      "Marketing & Networking Genius": {
        purpose: "To create powerful messaging that attracts our ideal families and build relationships that open doors and amplify impact.",
        role: "Compelling Storyteller"
      },
      "Operational Systems Guru": {
        purpose: "To design systems that run like clockwork - freeing me to focus on growth, innovation, and what I do best.",
        role: "Efficiency Architect"
      },
      "Program Innovation & Excellence": {
        purpose: "To continuously raise the bar and deliver phenomenal experiences that blow families away and keep them coming back for more.",
        role: "Excellence Champion"
      },
    };

    let updatedCount = 0;
    for (const category of categories) {
      const data = categoryData[category.name];
      if (data) {
        await ctx.db.patch(category._id, { 
          purpose: data.purpose,
          role: data.role 
        });
        updatedCount++;
      }
      
      // Also rename if needed
      if (category.name === "Magnificent Mommy/Homeschooling Hero") {
        const newData = categoryData["Raising Resilient Humans"];
        await ctx.db.patch(category._id, { 
          name: "Raising Resilient Humans", 
          purpose: newData.purpose,
          role: newData.role
        });
      }
    }

    return {
      success: true,
      updatedCount,
      message: `Updated ${updatedCount} category purposes`,
    };
  },
});

// Import book library
export const importBookLibrary = mutation({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Check if books already exist
    const existing = await ctx.db
      .query("bookLibrary")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (existing) {
      return { success: true, message: "Books already imported", count: 0 };
    }

    // Your complete book collection
    const books = [
      { title: "Abraham Lincoln (DK Biography)", author: "DK", category: "Biography", read: false },
      { title: "Albert Einstein (DK Biography)", author: "DK", category: "Biography", read: false },
      { title: "Alexander Hamilton: The Outsider", author: "", category: "Biography", read: false },
      { title: "All Creatures Great and Small", author: "James Herriot", category: "Health/Science", read: false },
      { title: "Amelia Earhart (DK Biography)", author: "DK", category: "Biography", read: false },
      { title: "Ancient Art of Origami", author: "", category: "Other", read: false },
      { title: "Anne Frank's Diary", author: "Anne Frank", category: "Classic Lit", read: false },
      { title: "Blood and Guts", author: "Linda Allison", category: "Health/Science", read: false },
      { title: "Carry On, Mr. Bowditch", author: "Jean Lee Latham", category: "Adventure", read: false },
      { title: "Ender's Game", author: "Orson Scott Card", category: "Adventure", read: false },
      { title: "George Washington's Secret Six", author: "", category: "Biography", read: true },
      { title: "Great Battles for Boys - American Revolution", author: "", category: "History", read: false },
      { title: "Hana's Suitcase", author: "", category: "History", read: true },
      { title: "Heidi", author: "Johanna Spyri", category: "Classic Lit", read: false },
      { title: "How to Teach Children Shakespeare", author: "", category: "Other", read: false },
      { title: "King Arthur (Classic Starts)", author: "", category: "Classic Lit", read: false },
      { title: "Leon Garfield's Shakespeare Stories", author: "Leon Garfield", category: "Classic Lit", read: false },
      { title: "Little Britches: Father and I Were Ranchers", author: "Ralph Moody", category: "Adventure", read: false },
      { title: "Little Women", author: "Louisa May Alcott", category: "Classic Lit", read: false },
      { title: "Lord of the Flies", author: "William Golding", category: "Classic Lit", read: false },
      { title: "Lord of the Rings trilogy", author: "J.R.R. Tolkien", category: "Adventure", read: false },
      { title: "Marie Antoinette (Who/What Was)", author: "", category: "Biography", read: false },
      { title: "Miller Moguls series", author: "", category: "Other", read: false },
      { title: "Nelson Mandela (Who/What Was)", author: "", category: "Biography", read: false },
      { title: "Once and Future King", author: "T.H. White", category: "Classic Lit", read: false },
      { title: "Pearl Harbor (Who/What Was)", author: "", category: "History", read: false },
      { title: "Queen Elizabeth 2 (Who/What Was)", author: "", category: "Biography", read: false },
      { title: "Robinson Crusoe", author: "Daniel Defoe", category: "Classic Lit", read: false },
      { title: "See Inside Your Body (Usborne)", author: "Usborne", category: "Health/Science", read: false },
      { title: "Shane", author: "Jack Schaefer", category: "Classic Lit", read: false },
      { title: "Story of Doctor Doolittle", author: "Hugh Lofting", category: "Adventure", read: false },
      { title: "Story of the World Book 1 (Ancient times)", author: "", category: "History", read: false },
      { title: "The Bronze Bow", author: "Elizabeth George Speare", category: "Classic Lit", read: false },
      { title: "The Disappearing Spoon", author: "Sam Kean", category: "Health/Science", read: false },
      { title: "The Door in the Wall", author: "Marguerite de Angeli", category: "Classic Lit", read: false },
      { title: "The Way We Work", author: "David Macaulay", category: "Health/Science", read: false },
      { title: "Treasure Island (Classic Starts)", author: "", category: "Adventure", read: false },
      { title: "Treasury of Egyptian Mythology", author: "", category: "Mythology", read: false },
      { title: "Treasury of Norse Mythology", author: "", category: "Mythology", read: false },
      { title: "Tuttle Twins Free Market Rules", author: "", category: "History", read: false },
      { title: "Tuttle Twins Guide to series", author: "", category: "History", read: false },
      { title: "Tuttle Twins History Volume 2 (American Revolution)", author: "", category: "History", read: false },
      { title: "Tuttle Twins History Volume 3 (War of 1812, Civil War)", author: "", category: "History", read: false },
      { title: "Tuttle Twins Teen Series (Choose Your Consequence)", author: "", category: "History", read: false },
      { title: "Understood Betsy", author: "Dorothy Canfield Fisher", category: "Classic Lit", read: false },
      { title: "Who Was Benjamin Franklin?", author: "", category: "Biography", read: false },
      { title: "Will You Sign Here, John Hancock?", author: "", category: "Biography", read: false },
      { title: "A Wind in the Door", author: "Madeleine L'Engle", category: "Adventure", read: false },
      { title: "A Wrinkle in Time", author: "Madeleine L'Engle", category: "Adventure", read: true },
    ];

    let count = 0;
    for (const book of books) {
      await ctx.db.insert("bookLibrary", {
        userId: user._id,
        title: book.title,
        author: book.author || undefined,
        category: book.category || undefined,
        read: book.read,
        createdAt: Date.now(),
      });
      count++;
    }

    return { success: true, message: `Imported ${count} books successfully!`, count };
  },
});

// Query to check user setup
export const checkUserSetup = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      return { exists: false };
    }

    const teamMembers = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const habitTemplates = await ctx.db
      .query("habitTemplates")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const rpmCategories = await ctx.db
      .query("rpmCategories")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    return {
      exists: true,
      userId: user._id,
      teamMembersCount: teamMembers.length,
      habitTemplatesCount: habitTemplates.length,
      rpmCategoriesCount: rpmCategories.length,
    };
  },
});
