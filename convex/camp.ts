import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";

const CAMP_WEEK_BLUEPRINTS = [
  {
    weekId: "week1",
    weekLabel: "Agoura Week 1",
    label: "June 22-26",
    shortLabel: "A1 · Jun 22-26",
    startDate: "2026-06-22",
    endDate: "2026-06-26",
    regionKey: "agoura",
    regionLabel: "Agoura",
    locationLabel: "Brookside",
    sequence: 1,
    configured: true,
    weeklySlots: 40,
    dailySlots: 40,
  },
  {
    weekId: "week2",
    weekLabel: "Agoura Week 2",
    label: "July 6-10",
    shortLabel: "A2 · Jul 6-10",
    startDate: "2026-07-06",
    endDate: "2026-07-10",
    regionKey: "agoura",
    regionLabel: "Agoura",
    locationLabel: "Brookside",
    sequence: 2,
    configured: true,
    weeklySlots: 40,
    dailySlots: 40,
  },
  {
    weekId: "week3",
    weekLabel: "Agoura Week 3",
    label: "July 20-24",
    shortLabel: "A3 · Jul 20-24",
    startDate: "2026-07-20",
    endDate: "2026-07-24",
    regionKey: "agoura",
    regionLabel: "Agoura",
    locationLabel: "Brookside",
    sequence: 3,
    configured: true,
    weeklySlots: 40,
    dailySlots: 40,
  },
  {
    weekId: "week4",
    weekLabel: "Agoura Week 4",
    label: "July 27-31",
    shortLabel: "A4 · Jul 27-31",
    startDate: "2026-07-27",
    endDate: "2026-07-31",
    regionKey: "agoura",
    regionLabel: "Agoura",
    locationLabel: "Brookside",
    sequence: 4,
    configured: true,
    weeklySlots: 40,
    dailySlots: 40,
  },
  {
    weekId: "week5",
    weekLabel: "Pali Week 1",
    label: "Dates TBD",
    shortLabel: "P1 · TBD",
    startDate: "",
    endDate: "",
    regionKey: "pali",
    regionLabel: "Pali",
    locationLabel: "Paul Revere",
    sequence: 5,
    configured: false,
    weeklySlots: 0,
    dailySlots: 0,
  },
  {
    weekId: "week6",
    weekLabel: "Pali Week 2",
    label: "Dates TBD",
    shortLabel: "P2 · TBD",
    startDate: "",
    endDate: "",
    regionKey: "pali",
    regionLabel: "Pali",
    locationLabel: "Paul Revere",
    sequence: 6,
    configured: false,
    weeklySlots: 0,
    dailySlots: 0,
  },
] as const;

const MAY17_MINI_CAMP_PROGRAM_ID = "trial-day-2026";
const MAY17_MINI_CAMP_EVENT_DATE = "2026-05-17";
const MAY17_MINI_CAMP_SESSION_CAPACITY = 30;
const MAY17_MINI_CAMP_SESSIONS = [
  "Morning Session (9:00 AM - 11:30 AM)",
  "Afternoon Session (12:00 PM - 2:30 PM)",
] as const;

async function syncTrialRegistrationToFamilyCrm(ctx: any, registration: {
  childFirstName: string;
  childLastName: string;
  dateOfBirth: string;
  gender: string;
  parentFirstName: string;
  parentLastName: string;
  email: string;
  phone: string;
  region: string;
  session: string;
  status: string;
}) {
  const now = Date.now();
  const email = registration.email.trim().toLowerCase();

  let family = await ctx.db
    .query("families")
    .withIndex("by_email", (q: any) => q.eq("email", email))
    .first();

  let familyId = family?._id;
  if (familyId) {
    await ctx.db.patch(familyId, {
      parentFirstName: registration.parentFirstName.trim(),
      parentLastName: registration.parentLastName.trim(),
      email,
      phone: registration.phone.trim(),
      updatedAt: now,
    });
  } else {
    familyId = await ctx.db.insert("families", {
      parentFirstName: registration.parentFirstName.trim(),
      parentLastName: registration.parentLastName.trim(),
      email,
      phone: registration.phone.trim(),
      tags: ["mini-camp"],
      createdAt: now,
      updatedAt: now,
    });
  }

  const existingChildren = await ctx.db
    .query("children")
    .withIndex("by_family", (q: any) => q.eq("familyId", familyId))
    .collect();

  const child = existingChildren.find((candidate: any) =>
    candidate.firstName.trim().toLowerCase() === registration.childFirstName.trim().toLowerCase()
    && candidate.lastName.trim().toLowerCase() === registration.childLastName.trim().toLowerCase()
  );

  let childId = child?._id;
  if (childId) {
    await ctx.db.patch(childId, {
      dob: registration.dateOfBirth,
      gender: registration.gender,
    });
  } else {
    childId = await ctx.db.insert("children", {
      familyId,
      firstName: registration.childFirstName.trim(),
      lastName: registration.childLastName.trim(),
      dob: registration.dateOfBirth,
      gender: registration.gender,
      createdAt: now,
    });
  }

  const existingEnrollment = await ctx.db
    .query("enrollments")
    .withIndex("by_child", (q: any) => q.eq("childId", childId))
    .filter((q: any) => q.and(
      q.eq(q.field("program"), "mini_camp"),
      q.eq(q.field("season"), MAY17_MINI_CAMP_EVENT_DATE)
    ))
    .first();

  const enrollment = {
    childId,
    familyId,
    program: "mini_camp",
    region: registration.region,
    season: MAY17_MINI_CAMP_EVENT_DATE,
    division: registration.session,
    status: registration.status,
    notes: "May 17 Free Mini Camp",
  };

  if (existingEnrollment) {
    await ctx.db.patch(existingEnrollment._id, enrollment);
  } else {
    await ctx.db.insert("enrollments", { ...enrollment, createdAt: now });
  }
}

const CAMP_WEEK_BLUEPRINT_MAP = Object.fromEntries(
  CAMP_WEEK_BLUEPRINTS.map((week) => [week.weekId, week])
) as Record<string, (typeof CAMP_WEEK_BLUEPRINTS)[number]>;

function getFallbackBlueprint(weekId: string) {
  return {
    weekId,
    weekLabel: weekId.toUpperCase(),
    label: "Unmapped week",
    shortLabel: weekId.toUpperCase(),
    startDate: "",
    endDate: "",
    regionKey: "other",
    regionLabel: "Other",
    locationLabel: "Unknown",
    sequence: 999,
    configured: true,
    weeklySlots: 40,
    dailySlots: 40,
  };
}

function getWeekBlueprint(weekId: string) {
  return CAMP_WEEK_BLUEPRINT_MAP[weekId] || getFallbackBlueprint(weekId);
}

function normalizeWeekRecord(week: any) {
  const blueprint = getWeekBlueprint(week.weekId);
  const configured = blueprint.configured !== false;
  const weeklySlots = Math.max(week.weeklySlots ?? 0, blueprint.weeklySlots ?? 0);
  const dailySlots = Math.max(week.dailySlots ?? 0, blueprint.dailySlots ?? 0);
  const totalRegistered = week.weeklyUsed + week.dailyUsed;
  const capacity = Math.max(weeklySlots, dailySlots, configured ? 30 : 0);

  return {
    weekId: week.weekId,
    weekLabel: week.weekLabel || blueprint.weekLabel,
    label: week.label || blueprint.label,
    shortLabel: week.shortLabel || blueprint.shortLabel,
    startDate: week.startDate || blueprint.startDate,
    endDate: week.endDate || blueprint.endDate,
    regionKey: week.regionKey || blueprint.regionKey,
    regionLabel: week.regionLabel || blueprint.regionLabel,
    locationLabel: week.locationLabel || blueprint.locationLabel,
    sequence: week.sequence ?? blueprint.sequence,
    configured,
    weeklySlots,
    weeklyUsed: week.weeklyUsed,
    dailySlots,
    dailyUsed: week.dailyUsed,
    weeklyRemaining: Math.max(0, weeklySlots - week.weeklyUsed),
    dailyRemaining: Math.max(0, dailySlots - week.dailyUsed),
    totalRegistered,
    displaySpots: Math.max(0, capacity - totalRegistered),
    isFull: configured ? Math.max(0, capacity - totalRegistered) === 0 : false,
  };
}

function buildPlaceholderWeek(weekId: string) {
  const blueprint = getWeekBlueprint(weekId);
  return {
    weekId: blueprint.weekId,
    weekLabel: blueprint.weekLabel,
    label: blueprint.label,
    shortLabel: blueprint.shortLabel,
    startDate: blueprint.startDate,
    endDate: blueprint.endDate,
    regionKey: blueprint.regionKey,
    regionLabel: blueprint.regionLabel,
    locationLabel: blueprint.locationLabel,
    sequence: blueprint.sequence,
    configured: blueprint.configured,
    weeklySlots: blueprint.weeklySlots,
    weeklyUsed: 0,
    dailySlots: blueprint.dailySlots,
    dailyUsed: 0,
    weeklyRemaining: blueprint.weeklySlots,
    dailyRemaining: blueprint.dailySlots,
    totalRegistered: 0,
    displaySpots: blueprint.configured ? Math.max(0, Math.max(blueprint.weeklySlots, blueprint.dailySlots, 30)) : 0,
    isFull: false,
  };
}

function buildRegionSummaries(weeks: any[]) {
  const regions = [
    { regionKey: "agoura", regionLabel: "Agoura", locationLabel: "Brookside" },
    { regionKey: "pali", regionLabel: "Pali", locationLabel: "Paul Revere" },
  ];

  return regions.map((region) => {
    const regionWeeks = weeks.filter((week) => week.regionKey === region.regionKey);
    return {
      ...region,
      weekCount: regionWeeks.length,
      configuredWeekCount: regionWeeks.filter((week) => week.configured).length,
      totalRegistered: regionWeeks.reduce((sum, week) => sum + week.totalRegistered, 0),
      totalDisplaySpots: regionWeeks.reduce((sum, week) => sum + week.displaySpots, 0),
      weeks: regionWeeks,
    };
  });
}

function buildDateRange(startDate: string, endDate: string) {
  if (!startDate || !endDate) return [] as string[];

  const dates: string[] = [];
  const current = new Date(`${startDate}T12:00:00`);
  const end = new Date(`${endDate}T12:00:00`);

  if (Number.isNaN(current.getTime()) || Number.isNaN(end.getTime())) {
    return dates;
  }

  while (current <= end) {
    dates.push(current.toISOString().split("T")[0]);
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

function buildDayAvailabilityByWeek(weeks: any[], registrations: any[]) {
  const result: Record<string, Record<string, { date: string; reserved: number; remaining: number; capacity: number; isFull: boolean }>> = {};

  for (const week of weeks) {
    const dates = buildDateRange(week.startDate, week.endDate);
    const capacity = week.dailySlots ?? 40;
    result[week.weekId] = Object.fromEntries(
      dates.map((date) => [date, {
        date,
        reserved: 0,
        remaining: capacity,
        capacity,
        isFull: false,
      }])
    );
  }

  for (const registration of registrations) {
    if (registration.status !== "paid") continue;

    for (const child of registration.children ?? []) {
      const sessions = child.sessions as Record<string, { type?: string; selectedDays?: string[] }>;

      for (const [weekId, session] of Object.entries(sessions || {})) {
        const dayMap = result[weekId];
        if (!dayMap) continue;

        const dates = session?.type === "full"
          ? Object.keys(dayMap)
          : (session?.selectedDays ?? []);

        for (const date of dates) {
          const day = dayMap[date];
          if (!day) continue;
          day.reserved += 1;
        }
      }
    }
  }

  for (const dayMap of Object.values(result)) {
    for (const day of Object.values(dayMap)) {
      day.remaining = Math.max(day.capacity - day.reserved, 0);
      day.isFull = day.remaining === 0;
    }
  }

  return result;
}

async function getNormalizedCampWeeks(ctx: any) {
  const records = await ctx.db.query("campAvailability").collect();
  const byWeekId = new Map(records.map((record: any) => [record.weekId, record]));

  const normalized = CAMP_WEEK_BLUEPRINTS.map((blueprint) => {
    const existing = byWeekId.get(blueprint.weekId);
    return existing ? normalizeWeekRecord(existing) : buildPlaceholderWeek(blueprint.weekId);
  });

  const unmapped = records
    .filter((record: any) => !CAMP_WEEK_BLUEPRINT_MAP[record.weekId])
    .map((record: any) => normalizeWeekRecord(record));

  return [...normalized, ...unmapped].sort((a, b) => (a.sequence ?? 999) - (b.sequence ?? 999));
}

async function syncCampWeekStructure(ctx: any) {
  const existing = await ctx.db.query("campAvailability").collect();
  const byWeekId = new Map(existing.map((week: any) => [week.weekId, week]));

  for (const blueprint of CAMP_WEEK_BLUEPRINTS) {
    const current = byWeekId.get(blueprint.weekId) as any;
    const payload = {
      label: blueprint.label,
      shortLabel: blueprint.shortLabel,
      startDate: blueprint.startDate,
      endDate: blueprint.endDate,
      weekLabel: blueprint.weekLabel,
      regionKey: blueprint.regionKey,
      regionLabel: blueprint.regionLabel,
      locationLabel: blueprint.locationLabel,
      sequence: blueprint.sequence,
      weeklySlots: blueprint.weeklySlots,
      dailySlots: blueprint.dailySlots,
    };

    if (current) {
      await ctx.db.patch(current._id, payload);
      continue;
    }

    await ctx.db.insert("campAvailability", {
      weekId: blueprint.weekId,
      label: blueprint.label,
      shortLabel: blueprint.shortLabel,
      startDate: blueprint.startDate,
      endDate: blueprint.endDate,
      weekLabel: blueprint.weekLabel,
      regionKey: blueprint.regionKey,
      regionLabel: blueprint.regionLabel,
      locationLabel: blueprint.locationLabel,
      sequence: blueprint.sequence,
      weeklySlots: blueprint.weeklySlots,
      weeklyUsed: 0,
      dailySlots: blueprint.dailySlots,
      dailyUsed: 0,
    });
  }
}

// ─── Availability ──────────────────────────────────────────────────────────

export const getAvailability = query({
  args: {},
  handler: async (ctx) => {
    const weeks = await getNormalizedCampWeeks(ctx);
    const registrations = await ctx.db.query("campRegistrations").collect();
    const dayAvailabilityByWeek = buildDayAvailabilityByWeek(weeks, registrations);
    const result: Record<string, unknown> = {};
    for (const week of weeks) {
      result[week.weekId] = {
        ...week,
        dayAvailability: dayAvailabilityByWeek[week.weekId] ?? {},
      };
    }
    return result;
  },
});

// ─── Promo Codes ──────────────────────────────────────────────────────────

export const validatePromo = query({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    const promo = await ctx.db
      .query("campPromoCodes")
      .withIndex("by_code", (q) => q.eq("code", code.trim().toUpperCase()))
      .first();
    if (!promo || !promo.active) return { valid: false, error: "Invalid or expired promo code" };
    if (promo.maxUses !== undefined && promo.usedCount >= promo.maxUses) {
      return { valid: false, error: "This promo code has reached its limit" };
    }
    return {
      valid: true,
      code: promo.code,
      type: promo.type,
      value: promo.value,
      description: promo.description,
    };
  },
});

export const getPromoCodes = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db.query("campPromoCodes").collect();
  },
});

export const createPromoCode = mutation({
  args: {
    code: v.string(),
    type: v.string(),
    value: v.number(),
    description: v.string(),
    maxUses: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const upper = args.code.trim().toUpperCase();
    const existing = await ctx.db
      .query("campPromoCodes")
      .withIndex("by_code", (q) => q.eq("code", upper))
      .first();
    if (existing) throw new Error("Code already exists");
    return ctx.db.insert("campPromoCodes", {
      code: upper,
      type: args.type,
      value: args.value,
      description: args.description,
      active: true,
      usedCount: 0,
      maxUses: args.maxUses,
      createdAt: Date.now(),
    });
  },
});

export const togglePromoCode = mutation({
  args: { code: v.string(), active: v.optional(v.boolean()) },
  handler: async (ctx, { code, active }) => {
    const promo = await ctx.db
      .query("campPromoCodes")
      .withIndex("by_code", (q) => q.eq("code", code.toUpperCase()))
      .first();
    if (!promo) throw new Error("Promo code not found");
    const newActive = active !== undefined ? active : !promo.active;
    await ctx.db.patch(promo._id, { active: newActive });
    return { ...promo, active: newActive };
  },
});

export const getTrialDayAvailability = query({
  args: {},
  handler: async (ctx) => {
    const registrations = await ctx.db.query("campTrialDayRegistrations").collect();
    const activeRegistrations = registrations.filter((registration) => registration.status !== "cancelled"
      && registration.programId === MAY17_MINI_CAMP_PROGRAM_ID
      && registration.eventDate === MAY17_MINI_CAMP_EVENT_DATE);

    return MAY17_MINI_CAMP_SESSIONS.map((session) => {
      const reserved = activeRegistrations.filter((registration) => registration.session === session).length;
      const remaining = Math.max(MAY17_MINI_CAMP_SESSION_CAPACITY - reserved, 0);

      return {
        session,
        capacity: MAY17_MINI_CAMP_SESSION_CAPACITY,
        reserved,
        remaining,
        isFull: remaining === 0,
      };
    });
  },
});

export const listTrialDayRegistrations = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("campTrialDayRegistrations")
      .withIndex("by_status", (q) => q.eq("status", "confirmed"))
      .filter((q) => q.and(
        q.eq(q.field("programId"), MAY17_MINI_CAMP_PROGRAM_ID),
        q.eq(q.field("eventDate"), MAY17_MINI_CAMP_EVENT_DATE)
      ))
      .order("desc")
      .collect();
  },
});

export const backfillTrialDayFamilyCrm = mutation({
  args: {},
  handler: async (ctx) => {
    const registrations = await ctx.db
      .query("campTrialDayRegistrations")
      .filter((q) => q.and(
        q.eq(q.field("programId"), MAY17_MINI_CAMP_PROGRAM_ID),
        q.eq(q.field("eventDate"), MAY17_MINI_CAMP_EVENT_DATE),
        q.eq(q.field("status"), "confirmed")
      ))
      .collect();

    for (const registration of registrations) {
      await syncTrialRegistrationToFamilyCrm(ctx, registration);
    }

    return { synced: registrations.length };
  },
});

export const createTrialDayRegistration = mutation({
  args: {
    programId: v.string(),
    session: v.string(),
    childFirstName: v.string(),
    childLastName: v.string(),
    dateOfBirth: v.string(),
    age: v.optional(v.number()),
    gender: v.string(),
    parentFirstName: v.string(),
    parentLastName: v.string(),
    email: v.string(),
    phone: v.string(),
    emergencyContactName: v.string(),
    emergencyContactPhone: v.string(),
    medicalNotes: v.optional(v.string()),
    waiverAccepted: v.boolean(),
  },
  handler: async (ctx, args) => {
    const normalizedSession = args.session.trim();
    if (!MAY17_MINI_CAMP_SESSIONS.includes(normalizedSession as (typeof MAY17_MINI_CAMP_SESSIONS)[number])) {
      throw new Error("Please choose one of the May 17 sessions.");
    }

    if (args.programId !== MAY17_MINI_CAMP_PROGRAM_ID) {
      throw new Error("Invalid trial day program.");
    }

    if (!args.parentFirstName || !args.parentLastName || !args.email || !args.phone) {
      throw new Error("Missing parent info.");
    }

    if (!args.childFirstName || !args.childLastName || !args.dateOfBirth || !args.gender) {
      throw new Error("Missing child info.");
    }

    const normalizedEmail = args.email.trim().toLowerCase();
    const normalizedChildFirstName = args.childFirstName.trim().toLowerCase();
    const normalizedChildLastName = args.childLastName.trim().toLowerCase();

    const existingForEmail = await ctx.db
      .query("campTrialDayRegistrations")
      .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
      .collect();

    const duplicate = existingForEmail.find((registration) => {
      return registration.status !== "cancelled"
        && registration.programId === MAY17_MINI_CAMP_PROGRAM_ID
        && registration.eventDate === MAY17_MINI_CAMP_EVENT_DATE
        && registration.childFirstName.trim().toLowerCase() === normalizedChildFirstName
        && registration.childLastName.trim().toLowerCase() === normalizedChildLastName;
    });

    if (duplicate) {
      throw new Error("This player already has a May 17 mini camp reservation. Please keep one session only.");
    }

    const sessionRegistrations = await ctx.db
      .query("campTrialDayRegistrations")
      .withIndex("by_session", (q) => q.eq("session", normalizedSession))
      .collect();

    const reservedCount = sessionRegistrations.filter((registration) => registration.status !== "cancelled"
      && registration.programId === MAY17_MINI_CAMP_PROGRAM_ID
      && registration.eventDate === MAY17_MINI_CAMP_EVENT_DATE).length;
    if (reservedCount >= MAY17_MINI_CAMP_SESSION_CAPACITY) {
      throw new Error("That session is full. Please choose the other option if spots remain.");
    }

    const registration = {
      programId: MAY17_MINI_CAMP_PROGRAM_ID,
      eventDate: MAY17_MINI_CAMP_EVENT_DATE,
      region: "agoura",
      session: normalizedSession,
      childFirstName: args.childFirstName.trim(),
      childLastName: args.childLastName.trim(),
      dateOfBirth: args.dateOfBirth,
      age: args.age,
      gender: args.gender,
      parentFirstName: args.parentFirstName.trim(),
      parentLastName: args.parentLastName.trim(),
      email: normalizedEmail,
      phone: args.phone.trim(),
      emergencyContactName: args.emergencyContactName.trim(),
      emergencyContactPhone: args.emergencyContactPhone.trim(),
      medicalNotes: args.medicalNotes?.trim() || undefined,
      waiverAccepted: args.waiverAccepted,
      status: "confirmed",
      createdAt: Date.now(),
    };

    const registrationId = await ctx.db.insert("campTrialDayRegistrations", registration);
    await syncTrialRegistrationToFamilyCrm(ctx, registration);
    return registrationId;
  },
});

// ─── Registrations ────────────────────────────────────────────────────────


export const cancelTrialDayRegistration = mutation({
  args: { registrationId: v.id("campTrialDayRegistrations") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.registrationId, { status: "cancelled" });
    return { success: true };
  },
});

export const createRegistration = mutation({
  args: {
    season: v.string(),
    parent: v.object({
      firstName: v.string(),
      lastName: v.string(),
      email: v.string(),
      phone: v.string(),
    }),
    children: v.array(v.object({
      firstName: v.string(),
      lastName: v.string(),
      age: v.optional(v.number()),
      birthDate: v.optional(v.string()),
      gender: v.optional(v.string()),
      allergies: v.optional(v.string()),
      sessions: v.any(),
    })),
    emergencyContact: v.object({ name: v.string(), phone: v.string() }),
    waiverAccepted: v.boolean(),
    promoCode: v.optional(v.string()),
    pricing: v.object({ subtotal: v.number(), discount: v.number(), total: v.number() }),
    stripePaymentIntentId: v.string(),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("campRegistrations", {
      ...args,
      status: "pending",
      createdAt: Date.now(),
    });
  },
});

export const markFreeRegistration = mutation({
  args: {
    registrationId: v.string(),
    promoCode: v.optional(v.string())
  },
  handler: async (ctx, { registrationId, promoCode }) => {
    const reg = await ctx.db
      .query("campRegistrations")
      .withIndex("by_stripe_pi", (q) => q.eq("stripePaymentIntentId", registrationId))
      .first();

    if (!reg) {
      console.log("[markFreeRegistration] No registration found for:", registrationId);
      return null;
    }

    await ctx.db.patch(reg._id, {
      status: "paid",
      paidAt: Date.now(),
      paymentMethod: "free_promo",
      appliedPromoCode: promoCode
    });

    return { success: true };
  },
});

export const markPaid = internalMutation({
  args: { stripePaymentIntentId: v.string() },
  handler: async (ctx, { stripePaymentIntentId }) => {
    const reg = await ctx.db
      .query("campRegistrations")
      .withIndex("by_stripe_pi", (q) => q.eq("stripePaymentIntentId", stripePaymentIntentId))
      .first();
    if (!reg) return null;

    await ctx.db.patch(reg._id, { status: "paid", paidAt: Date.now() });

    const email = reg.parent.email.toLowerCase().trim();
    const now = Date.now();

    let family = await ctx.db
      .query("families")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (!family) {
      const familyId = await ctx.db.insert("families", {
        parentFirstName: reg.parent.firstName,
        parentLastName: reg.parent.lastName,
        email,
        phone: reg.parent.phone,
        createdAt: now,
        updatedAt: now,
      });
      family = await ctx.db.get(familyId);
    }

    if (family) {
      for (const child of reg.children) {
        if (!child.firstName || !child.lastName) continue;

        const existingChild = await ctx.db
          .query("children")
          .withIndex("by_family", (q) => q.eq("familyId", family._id))
          .filter((q) =>
            q.and(
              q.eq(q.field("firstName"), child.firstName),
              q.eq(q.field("lastName"), child.lastName)
            )
          )
          .first();

        if (!existingChild) {
          const birthYear = child.age ? new Date().getFullYear() - child.age : undefined;
          await ctx.db.insert("children", {
            familyId: family._id,
            firstName: child.firstName,
            lastName: child.lastName,
            birthYear,
            gender: child.gender,
            createdAt: now,
          });
        }
      }
    }

    if (reg.promoCode) {
      const promo = await ctx.db
        .query("campPromoCodes")
        .withIndex("by_code", (q) => q.eq("code", reg.promoCode!))
        .first();
      if (promo) await ctx.db.patch(promo._id, { usedCount: promo.usedCount + 1 });
    }

    for (const child of reg.children) {
      const sessions = child.sessions as Record<string, { type: string; selectedDays?: string[] }>;
      for (const [weekId, session] of Object.entries(sessions)) {
        const week = await ctx.db
          .query("campAvailability")
          .withIndex("by_week_id", (q) => q.eq("weekId", weekId))
          .first();
        if (!week) continue;
        if (session.type === "full") {
          await ctx.db.patch(week._id, {
            weeklyUsed: Math.min(week.weeklyUsed + 1, week.weeklySlots),
          });
        } else if (session.type === "days" && (session.selectedDays?.length ?? 0) > 0) {
          await ctx.db.patch(week._id, {
            dailyUsed: Math.min(week.dailyUsed + 1, week.dailySlots),
          });
        }
      }
    }

    return reg;
  },
});

export const getRegistrations = query({
  args: {
    week: v.optional(v.string()),
    status: v.optional(v.string()),
    q: v.optional(v.string()),
  },
  handler: async (ctx, { week, status, q }) => {
    let regs = await ctx.db.query("campRegistrations").order("desc").collect();
    if (status) regs = regs.filter((r) => r.status === status);
    if (week) {
      regs = regs.filter((r) =>
        r.children.some((c) => {
          const s = (c.sessions as Record<string, { type: string; selectedDays?: string[] }>)[week];
          return s && s.type !== "none" && (s.type === "full" || (s.selectedDays?.length ?? 0) > 0);
        })
      );
    }
    if (q) {
      const lower = q.toLowerCase();
      regs = regs.filter(
        (r) =>
          r.parent.firstName.toLowerCase().includes(lower) ||
          r.parent.lastName.toLowerCase().includes(lower) ||
          r.parent.email.toLowerCase().includes(lower) ||
          r.children.some(
            (c) =>
              c.firstName.toLowerCase().includes(lower) ||
              c.lastName.toLowerCase().includes(lower)
          )
      );
    }
    return regs;
  },
});

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const regs = await ctx.db.query("campRegistrations").collect();
    const paid = regs.filter((r) => r.status === "paid");
    const pending = regs.filter((r) => r.status === "pending");
    const totalKids = paid.reduce((sum, reg) => sum + reg.children.length, 0);
    const totalRevenue = paid.reduce((sum, reg) => sum + reg.pricing.total, 0);
    const weeks = await getNormalizedCampWeeks(ctx);
    const weekStats = Object.fromEntries(weeks.map((week) => [week.weekId, week]));
    const byRegion = buildRegionSummaries(weeks);

    return {
      totalKids,
      totalRevenue,
      totalFamilies: paid.length,
      pendingCount: pending.length,
      weekStats,
      byRegion,
      totalConfiguredWeeks: weeks.filter((week) => week.configured).length,
      plannedWeekCount: weeks.length,
    };
  },
});

// ─── Seed / Structure Sync ────────────────────────────────────────────────

export const ensureCampWeekStructure = mutation({
  args: {},
  handler: async (ctx) => {
    await syncCampWeekStructure(ctx);
    return { ok: true, weeks: CAMP_WEEK_BLUEPRINTS.length };
  },
});

export const seedCampData = mutation({
  args: {},
  handler: async (ctx) => {
    await syncCampWeekStructure(ctx);

    const existingPromo = await ctx.db.query("campPromoCodes").first();
    if (!existingPromo) {
      await ctx.db.insert("campPromoCodes", {
        code: "REFERRAL",
        type: "free_days",
        value: 1,
        description: "1 free camp day ($65 value)",
        active: true,
        usedCount: 0,
        createdAt: Date.now(),
      });
      await ctx.db.insert("campPromoCodes", {
        code: "EARLYBIRD",
        type: "percent_off",
        value: 10,
        description: "10% off total",
        active: true,
        usedCount: 0,
        createdAt: Date.now(),
      });
      await ctx.db.insert("campPromoCodes", {
        code: "ASPIRE",
        type: "dollar_off",
        value: 50,
        description: "$50 off - Aspire Soccer families",
        active: true,
        usedCount: 0,
        createdAt: Date.now(),
      });
    }

    return { seeded: true };
  },
});

// ─── Admin Stats & Reports ────────────────────────────────────────────────

export const getCampStats = query({
  args: {},
  handler: async (ctx) => {
    const regs = await ctx.db.query("campRegistrations")
      .filter((q) => q.eq(q.field("status"), "paid"))
      .collect();

    const normalizedWeeks = await getNormalizedCampWeeks(ctx);
    const weekLabelMap = Object.fromEntries(
      normalizedWeeks.map((week) => [week.weekId, `${week.regionLabel} · ${week.weekLabel} (${week.label})`])
    ) as Record<string, string>;

    let totalRevenue = 0;
    let totalKids = 0;
    let totalAge = 0;
    let ageCount = 0;

    const weeklyBreakdown: Record<string, Record<string, number>> = Object.fromEntries(
      normalizedWeeks.map((week) => [`${week.regionLabel} · ${week.weekLabel} (${week.label})`, {}])
    );

    for (const reg of regs) {
      totalRevenue += reg.pricing.total;
      totalKids += reg.children.length;

      for (const child of reg.children) {
        if (child.birthDate) {
          const birth = new Date(child.birthDate);
          const today = new Date();
          let age = today.getFullYear() - birth.getFullYear();
          const monthDelta = today.getMonth() - birth.getMonth();
          if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birth.getDate())) {
            age--;
          }
          totalAge += age;
          ageCount++;
        }

        const sessions = child.sessions as Record<string, { type: string; selectedDays?: string[] }>;
        for (const [weekId, session] of Object.entries(sessions || {})) {
          const weekName = weekLabelMap[weekId];
          if (!weekName) continue;

          if (!weeklyBreakdown[weekName]) weeklyBreakdown[weekName] = {};

          for (const day of session.selectedDays || []) {
            const dayLower = day.toLowerCase();
            weeklyBreakdown[weekName][dayLower] = (weeklyBreakdown[weekName][dayLower] || 0) + 1;
          }
        }
      }
    }

    return {
      totalRegistrations: regs.length,
      totalRevenue,
      totalKids,
      avgAge: ageCount > 0 ? totalAge / ageCount : 0,
      weeklyBreakdown,
    };
  },
});

function getWeekdayKey(date: string) {
  const parsed = new Date(`${date}T12:00:00`);
  return parsed.toLocaleDateString("en-US", { weekday: "long", timeZone: "America/Los_Angeles" }).toLowerCase();
}

function calculateChildAge(birthDate?: string) {
  if (!birthDate) return undefined;
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDelta = today.getMonth() - birth.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export const getCheckInRoster = query({
  args: {
    date: v.string(),
    regionKey: v.optional(v.string()),
  },
  handler: async (ctx, { date, regionKey }) => {
    const targetRegion = regionKey || "agoura";
    const weeks = await getNormalizedCampWeeks(ctx);
    const activeWeek = weeks.find((week) =>
      week.regionKey === targetRegion
      && week.configured !== false
      && week.startDate
      && week.endDate
      && date >= week.startDate
      && date <= week.endDate
    );

    const weekdayKey = getWeekdayKey(date);
    const paidRegs = await ctx.db
      .query("campRegistrations")
      .withIndex("by_status", (q) => q.eq("status", "paid"))
      .collect();
    const attendanceEntries = await ctx.db
      .query("campAttendance")
      .withIndex("by_date_region", (q) => q.eq("date", date).eq("regionKey", targetRegion))
      .collect();
    const attendanceByKey = new Map(attendanceEntries.map((entry) => [entry.key, entry]));

    const registeredCampers = activeWeek
      ? paidRegs.flatMap((reg) =>
          reg.children.flatMap((child, childIndex) => {
            const sessions = child.sessions as Record<string, { type: string; selectedDays?: string[] }>;
            const session = sessions?.[activeWeek.weekId];
            if (!session) return [];

            const attendsThatDay = session.type === "full" || (session.selectedDays || []).map((day) => day.toLowerCase()).includes(weekdayKey);
            if (!attendsThatDay) return [];

            const key = `${date}:${reg._id}:${childIndex}`;
            const attendance = attendanceByKey.get(key);
            return [{
              key,
              registrationId: reg._id,
              childIndex,
              childName: `${child.firstName} ${child.lastName}`,
              age: child.age ?? calculateChildAge(child.birthDate),
              emergencyPhone: reg.emergencyContact.phone,
              parentPhone: reg.parent.phone,
              isWalkIn: false,
              checkInAt: attendance?.checkInAt,
              checkOutAt: attendance?.checkOutAt,
            }];
          })
        )
      : [];

    const walkIns = attendanceEntries
      .filter((entry) => entry.isWalkIn)
      .map((entry) => ({
        key: entry.key,
        registrationId: entry.registrationId,
        childIndex: entry.childIndex,
        childName: entry.childName,
        age: entry.age,
        emergencyPhone: entry.emergencyPhone,
        parentPhone: entry.parentPhone,
        isWalkIn: true,
        checkInAt: entry.checkInAt,
        checkOutAt: entry.checkOutAt,
      }));

    const rosterMap = new Map<string, {
      key: string;
      registrationId?: any;
      childIndex?: number;
      childName: string;
      age?: number;
      emergencyPhone: string;
      parentPhone?: string;
      isWalkIn: boolean;
      checkInAt?: number;
      checkOutAt?: number;
    }>();

    [...registeredCampers, ...walkIns].forEach((camper) => {
      rosterMap.set(camper.key, camper);
    });

    return {
      date,
      regionKey: targetRegion,
      week: activeWeek || null,
      roster: Array.from(rosterMap.values()).sort((a, b) => a.childName.localeCompare(b.childName)),
    };
  },
});

export const recordCheckInAction = mutation({
  args: {
    key: v.string(),
    date: v.string(),
    regionKey: v.string(),
    action: v.union(v.literal("check_in"), v.literal("check_out")),
    childName: v.optional(v.string()),
    age: v.optional(v.number()),
    emergencyPhone: v.optional(v.string()),
    parentPhone: v.optional(v.string()),
    weekId: v.optional(v.string()),
    registrationId: v.optional(v.id("campRegistrations")),
    childIndex: v.optional(v.number()),
    isWalkIn: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("campAttendance")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();

    const patch = args.action === "check_in"
      ? { checkInAt: now, updatedAt: now }
      : { checkOutAt: now, updatedAt: now };

    if (existing) {
      await ctx.db.patch(existing._id, patch);
      return await ctx.db.get(existing._id);
    }

    if (!args.childName || !args.emergencyPhone) {
      throw new Error("childName and emergencyPhone are required for a new attendance record");
    }

    const attendanceId = await ctx.db.insert("campAttendance", {
      key: args.key,
      date: args.date,
      regionKey: args.regionKey,
      weekId: args.weekId,
      registrationId: args.registrationId,
      childIndex: args.childIndex,
      childName: args.childName,
      age: args.age,
      emergencyPhone: args.emergencyPhone,
      parentPhone: args.parentPhone,
      isWalkIn: Boolean(args.isWalkIn),
      checkInAt: args.action === "check_in" ? now : undefined,
      checkOutAt: args.action === "check_out" ? now : undefined,
      createdAt: now,
      updatedAt: now,
    });

    return await ctx.db.get(attendanceId);
  },
});

export const addWalkIn = mutation({
  args: {
    date: v.string(),
    regionKey: v.string(),
    childName: v.string(),
    age: v.number(),
    emergencyPhone: v.string(),
    parentPhone: v.optional(v.string()),
    weekId: v.optional(v.string()),
  },
  handler: async (ctx, { date, regionKey, childName, age, emergencyPhone, parentPhone, weekId }) => {
    const now = Date.now();
    const key = `walkin:${date}:${childName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}:${now}`;

    const attendanceId = await ctx.db.insert("campAttendance", {
      key,
      date,
      regionKey,
      weekId,
      childName,
      age,
      emergencyPhone,
      parentPhone,
      isWalkIn: true,
      checkInAt: now,
      checkOutAt: undefined,
      createdAt: now,
      updatedAt: now,
    });

    return await ctx.db.get(attendanceId);
  },
});
