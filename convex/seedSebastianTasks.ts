import { mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Seed Sebastian's task board with initial 16 tasks
 * Run once to populate the board
 */
export const seedInitialTasks = mutation({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get user by Clerk ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      throw new Error("User not found with Clerk ID: " + args.clerkId);
    }

    const userId = user._id;

    // Check if tasks already exist
    const existing = await ctx.db
      .query("sebastianTasks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    if (existing.length > 0) {
      return {
        success: false,
        message: `Tasks already exist (${existing.length} found). Delete them first if you want to re-seed.`,
      };
    }

    // Define all 16 tasks
    const tasks = [
      // Recurring daily tasks (4)
      {
        title: "Morning Brief (8:00 AM)",
        description: "Daily motivation + schedule + priorities check (automated via cron)",
        category: "infrastructure",
        priority: "high" as const,
        status: "todo" as const,
      },
      {
        title: "Quo Parent Message Monitoring (9:30 PM)",
        description: "Daily scan for action items, registration changes (automated via cron)",
        category: "aspire",
        priority: "high" as const,
        status: "todo" as const,
      },
      {
        title: "Evening Check-in (9:00 PM)",
        description: "Reflection + wins + prep for tomorrow (automated via cron)",
        category: "infrastructure",
        priority: "medium" as const,
        status: "todo" as const,
      },
      {
        title: "Weekly RPM Review (Sunday 9:15 PM)",
        description: "Lock in 3 MVRs for the week ahead (automated via cron)",
        category: "infrastructure",
        priority: "high" as const,
        status: "todo" as const,
      },

      // High priority projects (4)
      {
        title: "Google Calendar Integration",
        description: "Set up GOG skill for calendar access in morning briefs",
        category: "infrastructure",
        priority: "high" as const,
        status: "in-progress" as const,
      },
      {
        title: 'HTA "Why Now" Landing Page Content',
        description: "Draft emotional hook around World Cup timing + family connection",
        category: "hta",
        priority: "high" as const,
        status: "backlog" as const,
      },
      {
        title: "Founding Families Waitlist Email Sequence",
        description: "5-email nurture series for 500-spot launch offer",
        category: "hta",
        priority: "high" as const,
        status: "backlog" as const,
      },
      {
        title: "X Developer API Approval Follow-up",
        description: "Check status, enable social monitoring/posting for HTA",
        category: "infrastructure",
        priority: "high" as const,
        status: "backlog" as const,
      },

      // Medium priority (5)
      {
        title: "Spring League Registration Analysis",
        description: "Weekly check: Pali vs Agoura player distributions",
        category: "aspire",
        priority: "medium" as const,
        status: "todo" as const,
      },
      {
        title: "Scout Agent Logs Channel Setup",
        description: "Configure scout-logs, scout-memory for Discord reporting",
        category: "agent-squad",
        priority: "medium" as const,
        status: "backlog" as const,
      },
      {
        title: "Maven Content Creation Testing",
        description: "Give Maven first HTA content task, observe quality",
        category: "agent-squad",
        priority: "medium" as const,
        status: "backlog" as const,
      },
      {
        title: "Band API Registration Complete",
        description: "Finish form, enable staff scheduling integration",
        category: "infrastructure",
        priority: "medium" as const,
        status: "backlog" as const,
      },
      {
        title: "Cost Optimization: Claude Max Setup",
        description: "Switch to $200/month unlimited when Corinne returns from Cabo",
        category: "infrastructure",
        priority: "medium" as const,
        status: "backlog" as const,
      },

      // Low priority (3)
      {
        title: "Email Sender Name Fix (OAuth)",
        description: "Re-auth sebastian@gmail so emails show proper sender",
        category: "infrastructure",
        priority: "low" as const,
        status: "backlog" as const,
      },
      {
        title: "Mission Control Task Board Polish",
        description: "Added Sebastian tab with kanban view - SHIPPED!",
        category: "infrastructure",
        priority: "low" as const,
        status: "done" as const,
      },
      {
        title: "Agent Squad Phase 3 Planning",
        description: "Synthesis layer, always-on monitoring, auto-research from #drop-links",
        category: "agent-squad",
        priority: "low" as const,
        status: "backlog" as const,
      },
    ];

    // Insert all tasks
    const taskIds = [];
    for (const task of tasks) {
      const id = await ctx.db.insert("sebastianTasks", {
        userId,
        title: task.title,
        description: task.description,
        category: task.category,
        priority: task.priority,
        status: task.status,
        createdAt: Date.now(),
        completedAt: task.status === "done" ? Date.now() : undefined,
      });
      taskIds.push(id);
    }

    return {
      success: true,
      message: `Successfully imported ${taskIds.length} tasks!`,
      taskIds,
    };
  },
});

/**
 * Clear all Sebastian's tasks (for re-seeding)
 */
export const clearAllTasks = mutation({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const tasks = await ctx.db
      .query("sebastianTasks")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    for (const task of tasks) {
      await ctx.db.delete(task._id);
    }

    return {
      success: true,
      message: `Deleted ${tasks.length} tasks`,
    };
  },
});
