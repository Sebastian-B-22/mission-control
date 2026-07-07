import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const updateAllRPMGoals = mutation({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    // Get user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    // Get all categories
    const categories = await ctx.db
      .query("rpmCategories")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const updates = {
      "Bad Ass Business Owner": {
        monthlyFocus: [
          "Spring League registration push (300-350 Agoura, 100-125 Pali)",
          "Business insurance (get quotes, finalize policy)",
          "Complete prep for opening day: shirts/balls inventory + orders, equipment tested and organized, field setup checklist",
          "Finalize Saturday staff assignments",
          "Get all automations with Sebastian setup and executed"
        ],
        yearlyGoals: [
          "HTA launched in June",
          "Aspire camp sold out (40 kids × 4 weeks = 160 total campers)",
          "Aspire revenue: $500K in 2026",
          "All systems documented, optimized, automated as much as possible, and running smoothly"
        ]
      },
      "HTA Empire Builder": {
        monthlyFocus: [
          "Complete X API integration for social monitoring/posting",
          "Create 30-day content calendar (launch countdown)",
          "Finalize Welcome Box prototype (supplier samples)",
          "Finish curriculum development (activities + mission cards)"
        ],
        yearlyGoals: [
          "Launch June 15th with 500 Founding Families",
          "1,000 active subscribers by December",
          "MRR: $39,000/month ($468K first-year revenue)"
        ]
      },
      "Staff Empowerment & Kickass Workplace": {
        monthlyFocus: [
          "Band API setup for staff coordination",
          "Staff meeting (season kickoff + expectations)",
          "Contact FCE re: staff training opportunities",
          "Schedule staff outing (Angel City game OR World Cup watch party this summer)",
          "Figure out payroll efficiency with Sebastian (automate/streamline)"
        ],
        yearlyGoals: [
          "Full 7-agent squad operational",
          "Band app and staff scheduling automated",
          "Payroll system automated and efficient",
          "FCE course completed with all staff"
        ]
      },
      "Marketing & Networking Genius": {
        monthlyFocus: [
          "Spring League email campaign completely written and scheduled (both locations, now through opening day)",
          "Create HTA social media presence (consistent posting + engagement)",
          "Network with strategic partners/influencers: touch base with friends/reconnect, create list + track contact history, research youth sports influencers, start interacting on their X accounts"
        ],
        yearlyGoals: [
          "Personal X account: 10,000 followers",
          "HTA X account: 10,000 followers (20K total reach)",
          "5 podcast appearances",
          "Strategic partnerships established",
          "1 viral moment / press coverage in major outlet",
          "Marketing for programs designed and scheduled/automated"
        ]
      },
      "Operational Systems Guru": {
        monthlyFocus: [
          "Deploy Scout agent (Operations Commander - auto-monitoring)",
          "Jotform → roster automation fully functional",
          "Quo daily monitoring + action item workflow with Allie locked in",
          "Build curriculum database app (Next.js + Convex)",
          "Document all systems (so they run without you)"
        ],
        yearlyGoals: [
          "All major workflows automated (registration, scheduling, communications)",
          "Curriculum database live and used by all coaches",
          "7-agent squad handling 80% of routine operations",
          "Zero missed parent communications or registration issues",
          "Systems so smooth you could take a 2-week vacation"
        ]
      },
      "Program Innovation & Excellence": {
        monthlyFocus: [
          "Adult 7v7 program (restart date for Pali? Send proposal to Agoura)",
          "HTA curriculum finished",
          "Aspire curriculum database complete",
          "Promote camp mini trial day (kids can try camp before signing up)"
        ],
        yearlyGoals: [
          "Adult 7v7 running in both locations (launch Agoura, relaunch Pali)",
          "Fall PDP Agoura launched",
          "Aspire curriculum fully documented and searchable",
          "HTA proven model ready to scale",
          "FOCUS: Hit 1,000 HTA subscribers (this is the needle-mover)"
        ]
      },
      "Magnificent Mommy/Homeschooling Hero": {
        monthlyFocus: [
          "iFLY and Nixon Museum field trips",
          "Anthony & Roma days (alternate - one this month, one next month)",
          "Create and support OpenClaw projects (James and Compass)",
          "Establish better morning routine"
        ],
        yearlyGoals: [
          "Help Anthony & Roma create a business and make money (utilizing James and Compass)",
          "UPW in Florida trip (November)",
          "Texas roadtrip",
          "Homeschool routine dialed in and helping us thrive",
          "Magic moments: Ed Sheeran concert, World Cup game, family cruise"
        ]
      },
      "Financial Independence & Freedom": {
        monthlyFocus: [
          "Complete Bench and Kick accounting",
          "Schedule tax appointment",
          "Automate 10% savings from every deposit into business account",
          "Automate investing"
        ],
        yearlyGoals: [
          "6-month emergency fund fully funded",
          "10% of all business income automated to savings/investments",
          "Financial freedom number defined and roadmap created",
          "Up to date on all taxes"
        ]
      },
      "Home Haven & Sanctuary": {
        monthlyFocus: [
          "Finish office flooring",
          "Declutter laundry closet",
          "Purchase plant for front garden"
        ],
        yearlyGoals: [
          "Decluttering throughout year (prep for January 2027 move)",
          "Declutter extra storage garage (big project)",
          "Every room EXACTLY how you want it",
          "Joey's mom's house ready for move-in January 2027 (this is MASSIVE!)",
          "Home systems run smoothly, family LOVES being home"
        ]
      },
      "Bangin' Ass Body": {
        monthlyFocus: [
          "Workout 4x/week",
          "Walk/run 4x/week",
          "Take measurements (set accurate weight loss goals)",
          "Sleep 7 hours every night",
          "Lose 10 lbs (to start)"
        ],
        yearlyGoals: [
          "Lose 40 lbs",
          "Workout 5x/week (260+ workouts in 2026!)",
          "Run a 5K, Tough Mudder, or Color Run with the kids",
          "Promoted from white belt in jiu-jitsu",
          "Personal stylist and new wardrobe",
          "Reduce pace of aging - biological age younger than actual age"
        ]
      },
      "Extraordinary Friendships": {
        monthlyFocus: [
          "HTA reconnect list + warm outreach",
          "Plan girls night with Lauren",
          "Create system for daily ritual of reaching out (log entries from Mission Control morning mindset question #2)"
        ],
        yearlyGoals: [
          "Weekend with Pam and Kim",
          "Fun adventure planned with Lauren",
          "Visit Twila",
          "Deep connections with 10+ friends",
          "Be the friend who shows up",
          "Daily ritual of reaching out becomes automatic"
        ]
      },
      "Phenomenal Relationship": {
        monthlyFocus: [
          "Birthday date night (Feb 22 - you share the same birthday!)",
          "Weekly in-home date night on Saturdays (no TV or video games)",
          "Family visit to see his mom"
        ],
        yearlyGoals: [
          "Trip to Vegas without the kiddos",
          "Monthly date nights (12 minimum)",
          "Date with Destiny",
          "Complete Show Her Off dance classes (online program)",
          "Sexy photo shoot for pics for Joey",
          "Create our new home together (Joey's mom's house ready January 2027)"
        ]
      }
    };

    let updated = 0;
    for (const category of categories) {
      const data = updates[category.name as keyof typeof updates];
      if (data) {
        await ctx.db.patch(category._id, {
          monthlyFocus: data.monthlyFocus,
          yearlyGoals: data.yearlyGoals,
        });
        updated++;
      }
    }

    return { 
      message: `Updated ${updated} categories with monthly needle movers and yearly goals!`,
      updated 
    };
  },
});
