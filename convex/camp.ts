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
    label: "July 27-31",
    shortLabel: "P1 · Jul 27-31",
    startDate: "2026-07-27",
    endDate: "2026-07-31",
    regionKey: "pali",
    regionLabel: "Pali",
    locationLabel: "Palisades High School",
    sequence: 5,
    configured: true,
    weeklySlots: 0,
    dailySlots: 40,
  },
  {
    weekId: "week6",
    weekLabel: "Pali Week 2",
    label: "August 3-7",
    shortLabel: "P2 · Aug 3-7",
    startDate: "2026-08-03",
    endDate: "2026-08-07",
    regionKey: "pali",
    regionLabel: "Pali",
    locationLabel: "Palisades High School",
    sequence: 6,
    configured: true,
    weeklySlots: 0,
    dailySlots: 40,
  },
  {
    weekId: "week7",
    weekLabel: "Pali Week 3",
    label: "August 10-14",
    shortLabel: "P3 · Aug 10-14",
    startDate: "2026-08-10",
    endDate: "2026-08-14",
    regionKey: "pali",
    regionLabel: "Pali",
    locationLabel: "Palisades High School",
    sequence: 7,
    configured: true,
    weeklySlots: 0,
    dailySlots: 40,
  },
] as const;

const MAY17_MINI_CAMP_PROGRAM_ID = "trial-day-2026";
const MAY17_MINI_CAMP_EVENT_DATE = "2026-05-17";
const MAY17_MINI_CAMP_SESSION_CAPACITY = 40;
const MAY17_MINI_CAMP_SESSIONS = [
  "Morning Session (9:00 AM - 11:30 AM)",
  "Afternoon Session (12:00 PM - 2:30 PM)",
] as const;

const SPRING_REGISTRATION_PROGRAMS: Record<string, { program: string; region: string }> = {
  "spring-agoura-2026": { program: "spring_league", region: "agoura" },
  "spring-pali-2026": { program: "spring_league", region: "pali" },
  "spring-agoura-2027": { program: "spring_league", region: "agoura" },
  "spring-pali-2027": { program: "spring_league", region: "pali" },
};

function getRegistrationProgramRouting(season: string) {
  if (SPRING_REGISTRATION_PROGRAMS[season]) return SPRING_REGISTRATION_PROGRAMS[season];
  if (season.includes("pdp")) return { program: "pdp", region: season.includes("pali") ? "pali" : "agoura" };
  if (season.includes("camp") || season.includes("summer")) {
    return { program: "camp", region: season.includes("pali") ? "pali" : "agoura" };
  }
  return null;
}

function isTestCampRegistration(registration: any) {
  const email = registration.parent?.email?.trim().toLowerCase() || "";
  const parentName = String((registration.parent?.firstName || "") + " " + (registration.parent?.lastName || "")).trim().toLowerCase();
  return email.includes("corinne")
    || email.includes("smoketest")
    || parentName.includes("test");
}

async function syncPaidRegistrationToFamilyCrm(ctx: any, reg: any) {
  if (reg.status !== "paid") return null;

  const routing = getRegistrationProgramRouting(reg.season);
  if (!routing) return null;

  const email = reg.parent.email.toLowerCase().trim();
  const now = Date.now();

  let family = await ctx.db
    .query("families")
    .withIndex("by_email", (q: any) => q.eq("email", email))
    .first();

  if (family) {
    await ctx.db.patch(family._id, {
      parentFirstName: reg.parent.firstName,
      parentLastName: reg.parent.lastName,
      email,
      phone: reg.parent.phone,
      updatedAt: now,
    });
    family = await ctx.db.get(family._id);
  } else {
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

  if (!family) return null;

  let syncedChildren = 0;
  for (const child of reg.children ?? []) {
    if (!child.firstName || !child.lastName) continue;

    const sessions = child.sessions as Record<string, { type?: string; selectedDays?: string[] }> | undefined;
    const selectedWeekIds = Object.entries(sessions || {})
      .filter(([, session]) => session?.type === "full" || (session?.selectedDays?.length ?? 0) > 0)
      .map(([weekId]) => weekId);

    if (routing.program === "camp" && selectedWeekIds.length === 0) continue;

    const existingChild = await ctx.db
      .query("children")
      .withIndex("by_family", (q: any) => q.eq("familyId", family._id))
      .filter((q: any) => q.and(
        q.eq(q.field("firstName"), child.firstName),
        q.eq(q.field("lastName"), child.lastName)
      ))
      .first();

    let childId = existingChild?._id;
    const birthYear = child.birthYear ? Number(child.birthYear) : (child.age ? new Date().getFullYear() - child.age : undefined);

    if (existingChild) {
      await ctx.db.patch(existingChild._id, {
        dob: child.birthDate || existingChild.dob,
        birthYear: birthYear || existingChild.birthYear,
        gender: child.gender || existingChild.gender,
      });
    } else {
      childId = await ctx.db.insert("children", {
        familyId: family._id,
        firstName: child.firstName,
        lastName: child.lastName,
        dob: child.birthDate,
        birthYear,
        gender: child.gender,
        createdAt: now,
      });
    }

    if (!childId) continue;

    const existingEnrollment = await ctx.db
      .query("enrollments")
      .withIndex("by_child", (q: any) => q.eq("childId", childId))
      .filter((q: any) => q.and(
        q.eq(q.field("program"), routing.program),
        q.eq(q.field("season"), reg.season)
      ))
      .first();

    const enrollment = {
      childId,
      familyId: family._id,
      program: routing.program,
      region: routing.region,
      season: reg.season,
      division: child.division || child.ageGroup,
      practiceDay: child.practiceDay,
      status: "paid_unassigned",
      notes: routing.program === "camp"
        ? "Created from camp registration " + reg._id + "; weeks: " + selectedWeekIds.join(", ")
        : "Created from unified registration",
      updatedAt: now,
    };

    if (existingEnrollment) {
      await ctx.db.patch(existingEnrollment._id, enrollment);
    } else {
      await ctx.db.insert("enrollments", { ...enrollment, createdAt: now });
    }
    syncedChildren += 1;
  }

  return { familyId: family._id, syncedChildren };
}

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
  const configured = Boolean(blueprint.configured);
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
    { regionKey: "pali", regionLabel: "Pali", locationLabel: "Palisades High School" },
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

function addDayAvailabilityToWeeks(weeks: any[], registrations: any[]) {
  const dayAvailabilityByWeek = buildDayAvailabilityByWeek(weeks, registrations);
  const paidRegistrations = registrations.filter((registration) => registration.status === "paid");

  return weeks.map((week) => {
    const days = Object.values(dayAvailabilityByWeek[week.weekId] ?? {});
    const lowestOpenDay = days.length > 0
      ? Math.min(...days.map((day: any) => day.remaining))
      : week.dailyRemaining;
    const highestRegisteredDay = days.length > 0
      ? Math.max(...days.map((day: any) => day.reserved))
      : week.dailyUsed;
    const totalRegistered = paidRegistrations.reduce((sum, registration) => {
      const weekKids = (registration.children ?? []).filter((child: any) => {
        const session = child.sessions?.[week.weekId];
        return session?.type === "full" || (session?.selectedDays?.length ?? 0) > 0;
      }).length;
      return sum + weekKids;
    }, 0);

    return {
      ...week,
      totalRegistered,
      dailyUsed: highestRegisteredDay,
      displaySpots: lowestOpenDay,
      dayAvailability: days,
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

function getCamperGender(child: any) {
  const gender = String(child.gender || "").trim();
  if (!gender) return "Unknown";
  const normalized = gender.toLowerCase();
  if (["girl", "girls", "female"].includes(normalized)) return "Girl";
  if (["boy", "boys", "male"].includes(normalized)) return "Boy";
  return gender;
}

function getCamperAgeGroup(child: any) {
  const ageGroup = String(child.division || child.ageGroup || "").trim();
  if (ageGroup) return ageGroup;

  const age = child.age ?? calculateChildAge(child.birthDate);
  return age === undefined ? "Unknown" : `Age ${age}`;
}

function getDayGenderBreakdown(campers: Array<{ gender: string }>) {
  const counts: Record<string, number> = {};
  for (const camper of campers) {
    counts[camper.gender] = (counts[camper.gender] || 0) + 1;
  }
  return Object.entries(counts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([gender, count]) => ({ gender, count }));
}

function getDayAgeGroupBreakdown(campers: Array<{ ageGroup: string }>) {
  const counts: Record<string, number> = {};
  for (const camper of campers) {
    counts[camper.ageGroup] = (counts[camper.ageGroup] || 0) + 1;
  }
  return Object.entries(counts)
    .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
    .map(([ageGroup, count]) => ({ ageGroup, count }));
}

function buildDayAvailabilityByWeek(weeks: any[], registrations: any[]) {
  const result: Record<string, Record<string, {
    date: string;
    reserved: number;
    remaining: number;
    capacity: number;
    isFull: boolean;
    campers: Array<{
      childName: string;
      parentName: string;
      gender: string;
      ageGroup: string;
      age?: number;
      email?: string;
      phone?: string;
    }>;
    genderBreakdown: Array<{ gender: string; count: number }>;
    ageGroupBreakdown: Array<{ ageGroup: string; count: number }>;
  }>> = {};

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
        campers: [],
        genderBreakdown: [],
        ageGroupBreakdown: [],
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
          day.campers.push({
            childName: `${child.firstName || ""} ${child.lastName || ""}`.trim(),
            parentName: `${registration.parent?.firstName || ""} ${registration.parent?.lastName || ""}`.trim(),
            gender: getCamperGender(child),
            ageGroup: getCamperAgeGroup(child),
            age: child.age ?? calculateChildAge(child.birthDate),
            email: registration.parent?.email,
            phone: registration.parent?.phone,
          });
        }
      }
    }
  }

  for (const dayMap of Object.values(result)) {
    for (const day of Object.values(dayMap)) {
      day.remaining = Math.max(day.capacity - day.reserved, 0);
      day.isFull = day.remaining === 0;
      day.campers.sort((a, b) => a.childName.localeCompare(b.childName));
      day.genderBreakdown = getDayGenderBreakdown(day.campers);
      day.ageGroupBreakdown = getDayAgeGroupBreakdown(day.campers);
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
    const weeksWithAvailability = addDayAvailabilityToWeeks(weeks, registrations);
    const result: Record<string, unknown> = {};
    for (const week of weeksWithAvailability) {
      result[week.weekId] = week;
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

function normalizeCampIdentity(value: string | undefined) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function normalizeCampPhone(value: string | undefined) {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length === 10) return `1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return digits;
  return digits;
}

export const validateFriendPromoEligibility = query({
  args: {
    code: v.optional(v.string()),
    parent: v.object({
      email: v.string(),
      phone: v.string(),
    }),
    children: v.array(v.object({
      firstName: v.string(),
      lastName: v.string(),
      birthDate: v.optional(v.string()),
      birthYear: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const promoCode = (args.code || "FRIEND").trim().toUpperCase();
    const submittedChildren = args.children.map((child) => ({
      name: `${child.firstName || ""} ${child.lastName || ""}`.trim(),
      key: normalizeCampIdentity(`${child.firstName || ""}${child.lastName || ""}`),
      birthDate: child.birthDate,
      birthYear: child.birthYear,
    })).filter((child) => child.key);

    if (!submittedChildren.length) {
      return { eligible: false, error: `${promoCode} requires a camper name.` };
    }

    const submittedEmail = args.parent.email.trim().toLowerCase();
    const submittedPhone = normalizeCampPhone(args.parent.phone);
    const registrations = await ctx.db.query("campRegistrations").collect();
    const activeRegistrations = registrations.filter((registration) =>
      ["paid", "reconciled"].includes(String(registration.status || "").toLowerCase())
    );

    const blockedChildren: string[] = [];
    for (const submitted of submittedChildren) {
      const alreadyCamped = activeRegistrations.some((registration) => {
        const parentEmail = registration.parent.email.trim().toLowerCase();
        const parentPhone = normalizeCampPhone(registration.parent.phone);
        const sameFamily = Boolean(
          (submittedEmail && parentEmail === submittedEmail) ||
          (submittedPhone && parentPhone === submittedPhone)
        );

        return registration.children.some((existingChild) => {
          const existingKey = normalizeCampIdentity(`${existingChild.firstName || ""}${existingChild.lastName || ""}`);
          if (!existingKey || existingKey !== submitted.key) return false;

          const existingBirthDate = existingChild.birthDate;
          const existingBirthYear = existingChild.birthYear;
          if (submitted.birthDate && existingBirthDate) return submitted.birthDate === existingBirthDate;
          if (submitted.birthYear && existingBirthYear) return submitted.birthYear === existingBirthYear;
          return sameFamily || !submitted.birthDate;
        });
      });

      if (alreadyCamped) blockedChildren.push(submitted.name);
    }

    if (blockedChildren.length) {
      return {
        eligible: false,
        error: `${promoCode} is only for campers new to Aspire camps. Already registered: ${blockedChildren.join(", ")}.`,
        blockedChildren,
      };
    }

    return { eligible: true };
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

export const cleanupMay17MiniCampTestRegistrations = mutation({
  args: {},
  handler: async (ctx) => {
    const testEmail = "corinnebriers@gmail.com";
    const registrations = await ctx.db
      .query("campTrialDayRegistrations")
      .withIndex("by_email", (q) => q.eq("email", testEmail))
      .filter((q) => q.and(
        q.eq(q.field("programId"), MAY17_MINI_CAMP_PROGRAM_ID),
        q.eq(q.field("eventDate"), MAY17_MINI_CAMP_EVENT_DATE),
        q.eq(q.field("parentFirstName"), "Kim"),
        q.eq(q.field("parentLastName"), "Test")
      ))
      .collect();

    for (const registration of registrations) {
      await ctx.db.delete(registration._id);
    }

    const family = await ctx.db
      .query("families")
      .withIndex("by_email", (q) => q.eq("email", testEmail))
      .filter((q) => q.and(
        q.eq(q.field("parentFirstName"), "Kim"),
        q.eq(q.field("parentLastName"), "Test")
      ))
      .first();

    let deletedEnrollments = 0;
    let deletedChildren = 0;
    let deletedFamily = 0;

    if (family) {
      const children = await ctx.db
        .query("children")
        .withIndex("by_family", (q) => q.eq("familyId", family._id))
        .collect();

      for (const child of children) {
        const enrollments = await ctx.db
          .query("enrollments")
          .withIndex("by_child", (q) => q.eq("childId", child._id))
          .collect();

        for (const enrollment of enrollments) {
          await ctx.db.delete(enrollment._id);
          deletedEnrollments += 1;
        }

        await ctx.db.delete(child._id);
        deletedChildren += 1;
      }

      await ctx.db.delete(family._id);
      deletedFamily = 1;
    }

    return {
      deletedRegistrations: registrations.length,
      deletedEnrollments,
      deletedChildren,
      deletedFamily,
    };
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
      birthYear: v.optional(v.string()),
      division: v.optional(v.string()),
      practiceDay: v.optional(v.string()),
      ageGroup: v.optional(v.string()),
      gender: v.optional(v.string()),
      allergies: v.optional(v.string()),
      sessions: v.optional(v.any()),
    })),
    emergencyContact: v.object({ name: v.string(), phone: v.string() }),
    waiverAccepted: v.boolean(),
    promoCode: v.optional(v.string()),
    pricing: v.object({
      subtotal: v.number(),
      discount: v.number(),
      accountCreditApplied: v.optional(v.number()),
      total: v.number(),
    }),
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

export const setPaymentIntentForRegistration = internalMutation({
  args: {
    registrationId: v.id("campRegistrations"),
    stripePaymentIntentId: v.string(),
  },
  handler: async (ctx, { registrationId, stripePaymentIntentId }) => {
    const reg = await ctx.db.get(registrationId);
    if (!reg) return null;
    await ctx.db.patch(registrationId, { stripePaymentIntentId });
    return reg;
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
    if (reg.status === "paid") return reg;

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
      const accountCreditApplied = reg.pricing.accountCreditApplied ?? 0;
      if (accountCreditApplied > 0) {
        const creditCents = Math.round(accountCreditApplied * 100);
        const currentBalance = family.creditBalance ?? 0;
        const debitAmount = Math.min(creditCents, currentBalance);

        if (debitAmount > 0) {
          await ctx.db.patch(family._id, {
            creditBalance: currentBalance - debitAmount,
            updatedAt: now,
          });
          await ctx.db.insert("creditTransactions", {
            familyEmail: email,
            amount: -debitAmount,
            type: "applied_to_purchase",
            description: `Applied account credit to ${reg.season} registration`,
            registrationId: String(reg._id),
            createdAt: now,
          });
        }
      }

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

        let childId = existingChild?._id;
        const birthYear = child.birthYear ? Number(child.birthYear) : (child.age ? new Date().getFullYear() - child.age : undefined);

        if (!existingChild) {
          childId = await ctx.db.insert("children", {
            familyId: family._id,
            firstName: child.firstName,
            lastName: child.lastName,
            dob: child.birthDate,
            birthYear,
            gender: child.gender,
            createdAt: now,
          });
        } else if (child.birthDate || child.gender || birthYear) {
          await ctx.db.patch(existingChild._id, {
            dob: child.birthDate || existingChild.dob,
            birthYear: birthYear || existingChild.birthYear,
            gender: child.gender || existingChild.gender,
          });
        }

        const routing = getRegistrationProgramRouting(reg.season);
        if (routing && childId) {
          const existingEnrollment = await ctx.db
            .query("enrollments")
            .withIndex("by_child", (q) => q.eq("childId", childId))
            .filter((q) => q.and(
              q.eq(q.field("program"), routing.program),
              q.eq(q.field("season"), reg.season)
            ))
            .first();

          const enrollment = {
            childId,
            familyId: family._id,
            program: routing.program,
            region: routing.region,
            season: reg.season,
            division: child.division || child.ageGroup,
            practiceDay: child.practiceDay,
            status: "paid_unassigned",
            notes: "Created from unified registration",
            updatedAt: now,
          };

          if (existingEnrollment) {
            await ctx.db.patch(existingEnrollment._id, enrollment);
          } else {
            await ctx.db.insert("enrollments", { ...enrollment, createdAt: now });
          }
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
      const sessions = child.sessions as Record<string, { type: string; selectedDays?: string[] }> | undefined;
      for (const [weekId, session] of Object.entries(sessions || {})) {
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
          const s = (c.sessions as Record<string, { type: string; selectedDays?: string[] }> | undefined)?.[week];
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

export const updateRegistrationWeekDays = mutation({
  args: {
    registrationId: v.id("campRegistrations"),
    childIndex: v.number(),
    weekId: v.string(),
    selectedDays: v.array(v.string()),
  },
  handler: async (ctx, { registrationId, childIndex, weekId, selectedDays }) => {
    const registration = await ctx.db.get(registrationId);
    if (!registration) return { updated: false, reason: "not_found" };

    const children = [...registration.children];
    const child = children[childIndex];
    if (!child) return { updated: false, reason: "child_not_found" };

    const sessions = { ...(child.sessions ?? {}) };
    sessions[weekId] = {
      ...(sessions[weekId] ?? {}),
      type: selectedDays.length > 0 ? "days" : "none",
      selectedDays,
    };

    children[childIndex] = { ...child, sessions };
    await ctx.db.patch(registrationId, { children });

    return { updated: true, registrationId, child: `${child.firstName} ${child.lastName}`, weekId, selectedDays };
  },
});

export const migratePaliCampWeekKeys20260609 = mutation({
  args: { dryRun: v.optional(v.boolean()) },
  handler: async (ctx, { dryRun }) => {
    const registrations = await ctx.db
      .query("campRegistrations")
      .filter((q) => q.eq(q.field("season"), "pali-camps-2026"))
      .collect();

    let registrationsChanged = 0;
    let childrenChanged = 0;
    const changes: Array<{ id: string; status: string; parentEmail: string; child: string; from: string; to: string; days: string[] }> = [];

    for (const registration of registrations) {
      let changedRegistration = false;
      const children = (registration.children ?? []).map((child: any) => {
        const sessions = { ...(child.sessions ?? {}) };
        const updatedSessions = { ...sessions };
        let changedChild = false;

        const oldWeek6 = sessions.week6;
        const oldWeek6Dates = oldWeek6?.selectedDays ?? [];
        const oldWeek6IsAug10 = oldWeek6?.type === "full" || oldWeek6Dates.some((day: string) => day.startsWith("2026-08-1"));
        if ((oldWeek6Dates.length || oldWeek6?.type === "full") && oldWeek6IsAug10) {
          updatedSessions.week7 = oldWeek6;
          delete updatedSessions.week6;
          changedChild = true;
          changes.push({
            id: registration._id,
            status: registration.status,
            parentEmail: registration.parent.email,
            child: `${child.firstName} ${child.lastName}`.trim(),
            from: "old Week 2 / Aug 10-14",
            to: "new Week 3 / Aug 10-14",
            days: oldWeek6.selectedDays ?? [],
          });
        }

        const oldWeek5 = sessions.week5;
        const oldWeek5Dates = oldWeek5?.selectedDays ?? [];
        const oldWeek5IsAug3 = oldWeek5?.type === "full" || oldWeek5Dates.some((day: string) => day.startsWith("2026-08-0"));
        if ((oldWeek5Dates.length || oldWeek5?.type === "full") && oldWeek5IsAug3) {
          updatedSessions.week6 = oldWeek5;
          delete updatedSessions.week5;
          changedChild = true;
          changes.push({
            id: registration._id,
            status: registration.status,
            parentEmail: registration.parent.email,
            child: `${child.firstName} ${child.lastName}`.trim(),
            from: "old Week 1 / Aug 3-7",
            to: "new Week 2 / Aug 3-7",
            days: oldWeek5.selectedDays ?? [],
          });
        }

        if (!changedChild) return child;
        childrenChanged += 1;
        changedRegistration = true;
        return { ...child, sessions: updatedSessions };
      });

      if (changedRegistration) {
        registrationsChanged += 1;
        if (!dryRun) {
          await ctx.db.patch(registration._id, { children });
        }
      }
    }

    return { dryRun: Boolean(dryRun), registrationsChanged, childrenChanged, changes };
  },
});

export const deleteRegistration = mutation({
  args: { registrationId: v.id("campRegistrations") },
  handler: async (ctx, { registrationId }) => {
    const registration = await ctx.db.get(registrationId);
    if (!registration) return { deleted: false, reason: "not_found" };

    await ctx.db.delete(registrationId);
    return {
      deleted: true,
      email: registration.parent.email,
      season: registration.season,
      children: registration.children.length,
    };
  },
});

export const backfillPaidSummerCampFamilyCrm = mutation({
  args: { includeTests: v.optional(v.boolean()) },
  handler: async (ctx, { includeTests }) => {
    const registrations = await ctx.db
      .query("campRegistrations")
      .filter((q) => q.eq(q.field("status"), "paid"))
      .collect();

    let considered = 0;
    let skippedTests = 0;
    let syncedFamilies = 0;
    let syncedChildren = 0;

    for (const registration of registrations) {
      const routing = getRegistrationProgramRouting(registration.season);
      if (routing?.program !== "camp") continue;
      considered += 1;

      if (!includeTests && isTestCampRegistration(registration)) {
        skippedTests += 1;
        continue;
      }

      const result = await syncPaidRegistrationToFamilyCrm(ctx, registration);
      if (result) {
        syncedFamilies += 1;
        syncedChildren += result.syncedChildren;
      }
    }

    return { considered, skippedTests, syncedFamilies, syncedChildren };
  },
});

// ─── Registration Review / Roster Assignment Queue ──────────────────────

export const getEnrollmentReviewQueue = query({
  args: {
    program: v.optional(v.string()),
    region: v.optional(v.string()),
    season: v.optional(v.string()),
    division: v.optional(v.string()),
    practiceDay: v.optional(v.string()),
    status: v.optional(v.string()),
    q: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let enrollments;
    if (args.program && args.status) {
      enrollments = await ctx.db
        .query("enrollments")
        .withIndex("by_program_status", (q) => q.eq("program", args.program!).eq("status", args.status!))
        .collect();
    } else if (args.status) {
      enrollments = await ctx.db
        .query("enrollments")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .collect();
    } else if (args.program) {
      enrollments = await ctx.db
        .query("enrollments")
        .withIndex("by_program", (q) => q.eq("program", args.program!))
        .collect();
    } else {
      enrollments = await ctx.db.query("enrollments").collect();
    }

    enrollments = enrollments.filter((enrollment) => {
      if (args.region && enrollment.region !== args.region) return false;
      if (args.season && enrollment.season !== args.season) return false;
      if (args.division && enrollment.division !== args.division) return false;
      if (args.practiceDay && enrollment.practiceDay !== args.practiceDay) return false;
      return true;
    });

    const rows = [];
    for (const enrollment of enrollments) {
      const [family, child] = await Promise.all([
        ctx.db.get(enrollment.familyId),
        ctx.db.get(enrollment.childId),
      ]);
      if (!family || !child) continue;

      rows.push({
        ...enrollment,
        parent: {
          firstName: family.parentFirstName,
          lastName: family.parentLastName,
          email: family.email,
          phone: family.phone,
        },
        child: {
          firstName: child.firstName,
          lastName: child.lastName,
          dob: child.dob,
          birthYear: child.birthYear,
          gender: child.gender,
        },
        displayName: `${child.firstName} ${child.lastName}`.trim(),
        familyName: `${family.parentFirstName} ${family.parentLastName}`.trim(),
      });
    }

    if (args.q) {
      const needle = args.q.trim().toLowerCase();
      return rows.filter((row) =>
        row.displayName.toLowerCase().includes(needle) ||
        row.familyName.toLowerCase().includes(needle) ||
        row.parent.email.toLowerCase().includes(needle) ||
        row.parent.phone.replace(/\D/g, "").includes(needle.replace(/\D/g, ""))
      );
    }

    return rows.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  },
});

export const updateEnrollmentRosterAssignment = mutation({
  args: {
    enrollmentId: v.id("enrollments"),
    status: v.optional(v.string()),
    assignedGroup: v.optional(v.string()),
    rosterNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const patch: {
      status?: string;
      assignedGroup?: string;
      rosterNotes?: string;
      updatedAt: number;
    } = { updatedAt: Date.now() };

    if (args.status) patch.status = args.status;
    if (args.assignedGroup !== undefined) patch.assignedGroup = args.assignedGroup;
    if (args.rosterNotes !== undefined) patch.rosterNotes = args.rosterNotes;

    await ctx.db.patch(args.enrollmentId, patch);
    return { success: true };
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
    const normalizedWeeks = await getNormalizedCampWeeks(ctx);
    const weeks = addDayAvailabilityToWeeks(normalizedWeeks, regs);
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

            const selectedDays = (session.selectedDays || []).map((day) => day.toLowerCase());
            const attendsThatDay = session.type === "full"
              || selectedDays.includes(date.toLowerCase())
              || selectedDays.includes(weekdayKey);
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
