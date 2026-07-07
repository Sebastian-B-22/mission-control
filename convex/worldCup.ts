import { internalAction, internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { Doc } from "./_generated/dataModel";
import { v } from "convex/values";
import { internal } from "./_generated/api";

declare const process: { env: Record<string, string | undefined> };

function blankPublishedResults() {
  return {
  groupWinners: {} as Record<string, string>,
  groupRunnersUp: {} as Record<string, string>,
  groupAdvancers: [] as string[],
  groupStagePoints: {} as Record<string, number>,
  knockoutWinners: {
    r32: [] as string[],
    r16: [] as string[],
    qf: [] as string[],
    sf: [] as string[],
    final: [] as string[],
  },
  champion: "",
  finalists: [] as string[],
  semifinalists: [] as string[],
  playerStats: {} as Record<string, { goals: number; assists: number; cleanSheets: number }>,
  };
}

function cleanDisplayName(value: string | undefined, fallback: string) {
  const cleaned = (value || fallback)
    .replace(/[^\w\s&'-]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 42);
  const normalized = cleaned.toLowerCase();
  const unsafeTerms = ["poop", "butt", "idiot", "stupid", "dumb", "hate", "kill", "sex", "fuck", "shit"];
  if (unsafeTerms.some((term) => normalized.includes(term))) return fallback;
  return cleaned || fallback;
}

function formatPublicPlayerName(value: string | undefined) {
  return (value || "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b([a-z])/g, (letter) => letter.toUpperCase());
}

function normalizeGroupCode(value: string | undefined) {
  return (value || "")
    .replace(/[^a-z0-9]/gi, "")
    .toUpperCase()
    .slice(0, 12);
}

function canonicalTeamName(value: string | undefined) {
  const cleaned = String(value || "").trim();
  const aliases: Record<string, string> = {
    "Cape Verde": "Cabo Verde",
    "Czech Republic": "Czechia",
    "Democratic Republic of the Congo": "DR Congo",
    "Congo DR": "DR Congo",
    "Ivory Coast": "Côte d'Ivoire",
    "Cote d'Ivoire": "Côte d'Ivoire",
    "Turkey": "Türkiye",
  };
  return aliases[cleaned] || cleaned;
}

function valuesFromRound(round: unknown) {
  if (!round || typeof round !== "object") return [];
  return Object.values(round as Record<string, unknown>).filter((value): value is string => typeof value === "string" && value.length > 0);
}

function orderedGroupPicks(picks: unknown) {
  if (Array.isArray(picks)) return picks.map(String).filter(Boolean);
  if (!picks || typeof picks !== "object") return [];
  const value = picks as Record<string, unknown>;
  return [value.winner, value.runnerUp, value.thirdPlace, value.fourthPlace].map(String).filter((team) => team && team !== "undefined");
}

type FantasyPlayer = { id: string; name: string; country: string; cost: number; roles: string[] };

const fantasyPlayerCatalog: Record<string, FantasyPlayer> = {
  messi: { id: "messi", name: "Lionel Messi", country: "Argentina", cost: 8, roles: ["star", "playmaker"] },
  mbappe: { id: "mbappe", name: "Kylian Mbappe", country: "France", cost: 8, roles: ["star", "goalGetter"] },
  haaland: { id: "haaland", name: "Erling Haaland", country: "Norway", cost: 8, roles: ["star", "goalGetter"] },
  vinicius: { id: "vinicius", name: "Vinicius Junior", country: "Brazil", cost: 8, roles: ["star", "goalGetter"] },
  bellingham: { id: "bellingham", name: "Jude Bellingham", country: "England", cost: 8, roles: ["star", "playmaker"] },
  ronaldo: { id: "ronaldo", name: "Cristiano Ronaldo", country: "Portugal", cost: 7, roles: ["star", "goalGetter"] },
  pulisic: { id: "pulisic", name: "Christian Pulisic", country: "United States", cost: 7, roles: ["star", "goalGetter", "playmaker"] },
  yamal: { id: "yamal", name: "Lamine Yamal", country: "Spain", cost: 7, roles: ["star", "goalGetter", "playmaker"] },
  salah: { id: "salah", name: "Mohamed Salah", country: "Egypt", cost: 7, roles: ["star", "goalGetter"] },
  son: { id: "son", name: "Son Heung-min", country: "South Korea", cost: 7, roles: ["star", "goalGetter"] },
  kane: { id: "kane", name: "Harry Kane", country: "England", cost: 7, roles: ["goalGetter"] },
  lautaro: { id: "lautaro", name: "Lautaro Martinez", country: "Argentina", cost: 6, roles: ["goalGetter"] },
  isak: { id: "isak", name: "Alexander Isak", country: "Sweden", cost: 6, roles: ["goalGetter"] },
  valencia: { id: "valencia", name: "Enner Valencia", country: "Ecuador", cost: 4, roles: ["goalGetter", "wildcard"] },
  dzeko: { id: "dzeko", name: "Edin Dzeko", country: "Bosnia and Herzegovina", cost: 4, roles: ["goalGetter", "wildcard"] },
  shomurodov: { id: "shomurodov", name: "Eldor Shomurodov", country: "Uzbekistan", cost: 3, roles: ["goalGetter", "wildcard"] },
  debruyne: { id: "debruyne", name: "Kevin De Bruyne", country: "Belgium", cost: 7, roles: ["playmaker"] },
  modric: { id: "modric", name: "Luka Modric", country: "Croatia", cost: 6, roles: ["playmaker"] },
  bruno: { id: "bruno", name: "Bruno Fernandes", country: "Portugal", cost: 6, roles: ["playmaker"] },
  musiala: { id: "musiala", name: "Jamal Musiala", country: "Germany", cost: 7, roles: ["playmaker", "goalGetter"] },
  mitoma: { id: "mitoma", name: "Kaoru Mitoma", country: "Japan", cost: 5, roles: ["playmaker", "goalGetter", "wildcard"] },
  caicedo: { id: "caicedo", name: "Linda Caicedo", country: "Colombia", cost: 4, roles: ["playmaker", "goalGetter", "wildcard"] },
  afif: { id: "afif", name: "Akram Afif", country: "Qatar", cost: 3, roles: ["playmaker", "wildcard"] },
  davies: { id: "davies", name: "Alphonso Davies", country: "Canada", cost: 6, roles: ["defenderKeeper", "playmaker"] },
  vandijk: { id: "vandijk", name: "Virgil van Dijk", country: "Netherlands", cost: 6, roles: ["defenderKeeper"] },
  hakimi: { id: "hakimi", name: "Achraf Hakimi", country: "Morocco", cost: 5, roles: ["defenderKeeper", "wildcard"] },
  alaba: { id: "alaba", name: "David Alaba", country: "Austria", cost: 5, roles: ["defenderKeeper", "playmaker"] },
  ochoa: { id: "ochoa", name: "Guillermo Ochoa", country: "Mexico", cost: 5, roles: ["defenderKeeper"] },
  cech: { id: "cech", name: "Petr Cech", country: "Czechia", cost: 3, roles: ["defenderKeeper", "wildcard"] },
  mbemba: { id: "mbemba", name: "Chancel Mbemba", country: "DR Congo", cost: 3, roles: ["defenderKeeper", "wildcard"] },
  drogba: { id: "drogba", name: "Didier Drogba", country: "Côte d'Ivoire", cost: 4, roles: ["wildcard", "goalGetter"] },
  mahrez: { id: "mahrez", name: "Riyad Mahrez", country: "Algeria", cost: 4, roles: ["wildcard", "playmaker"] },
  kudus: { id: "kudus", name: "Mohammed Kudus", country: "Ghana", cost: 4, roles: ["wildcard", "playmaker", "goalGetter"] },
  aldawsari: { id: "aldawsari", name: "Salem Al-Dawsari", country: "Saudi Arabia", cost: 3, roles: ["wildcard", "goalGetter"] },
  bebe: { id: "bebe", name: "Bebe", country: "Cabo Verde", cost: 3, roles: ["wildcard", "goalGetter"] },
};

function fantasyPlayersFromEntry(data: any) {
  const fantasy = data?.fantasyFive;
  const picks = fantasy?.picks && typeof fantasy.picks === "object" ? fantasy.picks : {};
  const customPicks = fantasy?.customPicks && typeof fantasy.customPicks === "object" ? fantasy.customPicks as Record<string, any> : {};
  const players = Object.entries(picks)
    .map(([slotKey, value]) => {
      if (typeof value !== "string") return null;
      if (value.startsWith("custom:")) {
        const custom = customPicks[slotKey];
        const name = String(custom?.name || "").trim().slice(0, 60);
        const country = String(custom?.country || "").trim().slice(0, 60);
        const cost = Number(custom?.cost);
        if (!name || !country) return null;
        return {
          id: value,
          name,
          country,
          cost: Number.isFinite(cost) ? Math.max(1, Math.min(cost, 8)) : 4,
          roles: Array.isArray(custom?.roles) ? custom.roles.map(String).filter(Boolean).slice(0, 3) : [slotKey],
        };
      }
      if (fantasyPlayerCatalog[value]) return fantasyPlayerCatalog[value];
      const custom = customPicks[slotKey];
      const name = String(custom?.name || "").trim().slice(0, 60);
      const country = String(custom?.country || "").trim().slice(0, 60);
      const cost = Number(custom?.cost);
      if (!name || !country) return null;
      return {
        id: value,
        name,
        country,
        cost: Number.isFinite(cost) ? Math.max(1, Math.min(cost, 8)) : 4,
        roles: Array.isArray(custom?.roles) ? custom.roles.map(String).filter(Boolean).slice(0, 3) : [slotKey],
      };
    })
    .filter((player): player is FantasyPlayer => Boolean(player))
    .filter((player) => player.id && player.name && player.country);
  const captainId = String(fantasy?.captain || "");
  return { players, captainId };
}

async function buildPublishedResults(ctx: { db: any }) {
  const results = blankPublishedResults();
  const standings = await ctx.db.query("worldCupGroupStandings").collect();
  const groups = new Map<string, Doc<"worldCupGroupStandings">[]>();
  for (const standing of standings) {
    const groupId = String(standing.groupId || "").toUpperCase();
    if (!groupId) continue;
    if (!groups.has(groupId)) groups.set(groupId, []);
    groups.get(groupId)!.push(standing);
  }

  const thirdPlace: Doc<"worldCupGroupStandings">[] = [];
  for (const [groupId, rows] of groups) {
    if (!rows.some((row) => (row.matches ?? 0) > 0)) continue;
    const sorted = rows.slice().sort((a, b) => a.position - b.position);
    sorted.forEach((row) => {
      results.groupStagePoints[canonicalTeamName(row.teamName)] = row.points || 0;
    });
    if (sorted[0]) results.groupWinners[groupId] = canonicalTeamName(sorted[0].teamName);
    if (sorted[1]) results.groupRunnersUp[groupId] = canonicalTeamName(sorted[1].teamName);
    sorted.slice(0, 2).forEach((row) => results.groupAdvancers.push(canonicalTeamName(row.teamName)));
    if (sorted[2]) thirdPlace.push(sorted[2]);
  }
  thirdPlace
    .sort((a, b) =>
      (b.points ?? 0) - (a.points ?? 0)
      || (b.goalDiff ?? 0) - (a.goalDiff ?? 0)
      || (b.goalsFor ?? 0) - (a.goalsFor ?? 0)
      || a.teamName.localeCompare(b.teamName)
    )
    .slice(0, 8)
    .forEach((row) => results.groupAdvancers.push(canonicalTeamName(row.teamName)));
  results.groupAdvancers = Array.from(new Set(results.groupAdvancers));

  const matches = await ctx.db.query("worldCupMatchResults").collect();
  for (const match of matches) {
    if (!match.winner) continue;
    if (match.stage in results.knockoutWinners) {
      results.knockoutWinners[match.stage as keyof typeof results.knockoutWinners].push(canonicalTeamName(match.winner));
    }
    if (match.stage === "final") {
      results.champion = canonicalTeamName(match.winner);
      results.finalists = [match.homeTeam, match.awayTeam].filter((team): team is string => Boolean(team)).map(canonicalTeamName);
    }
    if (match.stage === "sf") {
      [match.homeTeam, match.awayTeam].filter(Boolean).forEach((team) => results.semifinalists.push(canonicalTeamName(team as string)));
    }
  }
  results.semifinalists = Array.from(new Set(results.semifinalists));

  const playerStats = await ctx.db.query("worldCupFantasyPlayerStats").collect();
  for (const stat of playerStats) {
    results.playerStats[stat.playerId] = {
      goals: stat.goals || 0,
      assists: stat.assists || 0,
      cleanSheets: stat.cleanSheets || 0,
    };
  }
  return results;
}

function scoreEntry(entry: Doc<"worldCupEntries">, publishedResults: ReturnType<typeof blankPublishedResults>) {
  const data = entry.entryData as any;
  let groupWinnerPoints = 0;
  let groupRunnerUpPoints = 0;
  let advancingPoints = 0;
  let knockoutPoints = 0;
  let championPoints = 0;
  let finalistBonus = 0;
  let semifinalistBonus = 0;
  let underdogPoints = 0;

  if (entry.mode === "quick-kids") {
    const champion = data?.simplePicks?.champion;
    const surpriseTeams = Array.isArray(data?.simplePicks?.quarterfinalists) ? data.simplePicks.quarterfinalists : [];
    championPoints = champion && publishedResults.champion && champion === publishedResults.champion ? 20 : 0;
    finalistBonus = surpriseTeams.filter((team: string) => publishedResults.finalists.includes(team)).length * 12;
    semifinalistBonus = surpriseTeams.filter((team: string) => publishedResults.semifinalists.includes(team)).length * 6;
    underdogPoints = surpriseTeams.filter((team: string) => publishedResults.groupAdvancers.includes(team)).length * 2;
  } else if (entry.mode === "fantasy-five") {
    const { players, captainId } = fantasyPlayersFromEntry(data);
    for (const player of players) {
      let playerPoints = 0;
      playerPoints += publishedResults.groupStagePoints[player.country] || 0;
      if (publishedResults.groupAdvancers.includes(player.country)) playerPoints += 3;
      for (const round of ["r32", "r16", "qf", "sf", "final"] as const) {
        if (publishedResults.knockoutWinners[round].includes(player.country)) playerPoints += round === "final" ? 8 : 4;
      }
      if (publishedResults.champion === player.country) playerPoints += 10;
      const statLine = publishedResults.playerStats[player.id] || { goals: 0, assists: 0, cleanSheets: 0 };
      playerPoints += statLine.goals * 5;
      playerPoints += statLine.assists * 3;
      if (player.roles.includes("defenderKeeper")) playerPoints += statLine.cleanSheets * 4;
      if (player.roles.includes("wildcard") && player.cost <= 4 && publishedResults.groupAdvancers.includes(player.country)) playerPoints += 4;
      if (player.id === captainId) playerPoints *= 2;
      knockoutPoints += playerPoints;
    }
  } else {
    const groupPicks = data?.groupPicks && typeof data.groupPicks === "object" ? data.groupPicks : {};
    const advancingPicks = new Set<string>();
    for (const [groupId, picks] of Object.entries(groupPicks)) {
      const teams = orderedGroupPicks(picks);
      if (teams[0] && publishedResults.groupWinners[groupId] === teams[0]) groupWinnerPoints += 3;
      if (teams[1] && publishedResults.groupRunnersUp[groupId] === teams[1]) groupRunnerUpPoints += 2;
      teams.slice(0, 2).forEach((team) => advancingPicks.add(team));
    }
    if (Array.isArray(data?.wildcards)) data.wildcards.forEach((team: string) => advancingPicks.add(team));
    advancingPoints = [...advancingPicks].filter((team) => publishedResults.groupAdvancers.includes(String(team))).length;

    const winners = data?.winners || {};
    const roundScores: Record<string, number> = entry.mode === "second-chance"
      ? { r32: 3, r16: 5, qf: 7, sf: 9, final: 15 }
      : { r32: 4, r16: 6, qf: 8, sf: 10, final: 20 };
    for (const round of Object.keys(roundScores)) {
      const picked = valuesFromRound(winners[round]);
      const actual = publishedResults.knockoutWinners[round as keyof typeof publishedResults.knockoutWinners] || [];
      knockoutPoints += picked.filter((team) => actual.includes(team)).length * roundScores[round];
    }
    const champion = winners?.final?.final_0;
    championPoints = champion && publishedResults.champion && champion === publishedResults.champion ? 20 : 0;
  }

  const total = groupWinnerPoints + groupRunnerUpPoints + advancingPoints + knockoutPoints + championPoints + finalistBonus + semifinalistBonus + underdogPoints;
  return {
    total,
    groupWinnerPoints,
    groupRunnerUpPoints,
    advancingPoints,
    knockoutPoints,
    championPoints,
    finalistBonus,
    semifinalistBonus,
    underdogPoints,
  };
}

export const submitEntryInternal = internalMutation({
  args: {
    familyName: v.string(),
    parentName: v.optional(v.string()),
    parentEmail: v.optional(v.string()),
    parentPhone: v.optional(v.string()),
    textOptIn: v.boolean(),
    htaLaunchOptIn: v.boolean(),
    participantName: v.optional(v.string()),
    participantDisplayName: v.optional(v.string()),
    participantType: v.optional(v.string()),
    ageRange: v.optional(v.string()),
    mode: v.union(v.literal("quick-kids"), v.literal("full-family"), v.literal("fantasy-five"), v.literal("second-chance"), v.literal("launch-list")),
    groupCodes: v.optional(v.array(v.string())),
    entryData: v.any(),
    source: v.string(),
    userAgent: v.optional(v.string()),
    confirmationTextSentAt: v.optional(v.number()),
    adminStatus: v.optional(v.union(v.literal("active"), v.literal("test"), v.literal("archived"))),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const groupCodes = Array.from(new Set((args.groupCodes || []).map(normalizeGroupCode).filter(Boolean))).slice(0, 10);
    return await ctx.db.insert("worldCupEntries", {
      ...args,
      groupCodes,
      adminStatus: args.adminStatus || "active",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const markEntryConfirmationTextInternal = internalMutation({
  args: {
    id: v.id("worldCupEntries"),
    sentAt: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { confirmationTextSentAt: args.sentAt, updatedAt: Date.now() });
  },
});

export const setEntryAdminStatus = mutation({
  args: {
    id: v.id("worldCupEntries"),
    adminStatus: v.union(v.literal("active"), v.literal("test"), v.literal("archived")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { adminStatus: args.adminStatus, updatedAt: Date.now() });
  },
});

export const upsertFantasyPlayerStats = mutation({
  args: {
    playerId: v.string(),
    playerName: v.string(),
    country: v.string(),
    goals: v.number(),
    assists: v.number(),
    cleanSheets: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const playerId = args.playerId.trim().slice(0, 80);
    const existing = await ctx.db
      .query("worldCupFantasyPlayerStats")
      .withIndex("by_player", (q) => q.eq("playerId", playerId))
      .first();
    const payload = {
      playerId,
      playerName: args.playerName.trim().slice(0, 120),
      country: args.country.trim().slice(0, 80),
      goals: Math.max(0, Math.floor(args.goals)),
      assists: Math.max(0, Math.floor(args.assists)),
      cleanSheets: Math.max(0, Math.floor(args.cleanSheets)),
      notes: args.notes?.slice(0, 300),
      updatedAt: now,
    };
    if (existing) {
      await ctx.db.patch(existing._id, payload);
      return existing._id;
    }
    return await ctx.db.insert("worldCupFantasyPlayerStats", payload);
  },
});

export const hasEntryForPhoneInternal = internalQuery({
  args: {
    parentPhone: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("worldCupEntries")
      .withIndex("by_parent_phone", (q) => q.eq("parentPhone", args.parentPhone))
      .first();
    return Boolean(existing);
  },
});

export const listEntriesForPhoneInternal = internalQuery({
  args: {
    parentPhone: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("worldCupEntries")
      .withIndex("by_parent_phone", (q) => q.eq("parentPhone", args.parentPhone))
      .order("desc")
      .collect();
  },
});

export const createAccessTokenInternal = internalMutation({
  args: {
    token: v.string(),
    parentPhone: v.string(),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("worldCupAccessTokens", {
      ...args,
      sentAt: now,
      createdAt: now,
    });
  },
});

export const listAccessTokens = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(Math.max(args.limit ?? 50, 1), 200);
    return await ctx.db
      .query("worldCupAccessTokens")
      .withIndex("by_expires")
      .order("desc")
      .take(limit);
  },
});

export const getAccessBundleInternal = internalQuery({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const access = await ctx.db
      .query("worldCupAccessTokens")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();
    if (!access) return null;

    const entries = await ctx.db
      .query("worldCupEntries")
      .withIndex("by_parent_phone", (q) => q.eq("parentPhone", access.parentPhone))
      .order("desc")
      .collect();
    const groupCodes = Array.from(new Set(entries.flatMap((entry) => entry.groupCodes || []).map(normalizeGroupCode).filter(Boolean)));
    const groups: Doc<"worldCupGroups">[] = [];
    for (const code of groupCodes) {
      const group = await ctx.db
        .query("worldCupGroups")
        .withIndex("by_join_code", (q) => q.eq("joinCode", code))
        .first();
      if (group) groups.push(group);
    }

    return { parentPhone: access.parentPhone, entries, groups };
  },
});

export const createGroupInternal = internalMutation({
  args: {
    name: v.string(),
    joinCode: v.string(),
    type: v.union(v.literal("family"), v.literal("team"), v.literal("region")),
    adminName: v.optional(v.string()),
    adminEmail: v.optional(v.string()),
    adminPhone: v.optional(v.string()),
    regionTag: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const joinCode = normalizeGroupCode(args.joinCode);
    const existing = await ctx.db
      .query("worldCupGroups")
      .withIndex("by_join_code", (q) => q.eq("joinCode", joinCode))
      .first();
    if (existing) throw new Error("Group code already exists");
    const now = Date.now();
    return await ctx.db.insert("worldCupGroups", {
      ...args,
      name: args.name.trim().slice(0, 80),
      joinCode,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const upsertGroupStandingInternal = internalMutation({
  args: {
    groupId: v.string(),
    teamName: v.string(),
    position: v.number(),
    points: v.optional(v.number()),
    matches: v.optional(v.number()),
    goalDiff: v.optional(v.number()),
    goalsFor: v.optional(v.number()),
    goalsAgainst: v.optional(v.number()),
    raw: v.any(),
    source: v.string(),
    syncedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const existingRows = await ctx.db
      .query("worldCupGroupStandings")
      .withIndex("by_team", (q) => q.eq("teamName", args.teamName))
      .collect();
    const existing = existingRows.find((row) => row.groupId === args.groupId);
    const payload = { ...args, groupId: args.groupId.toUpperCase(), updatedAt: Date.now() };
    if (existing) {
      await ctx.db.patch(existing._id, payload);
      return existing._id;
    }
    return await ctx.db.insert("worldCupGroupStandings", payload);
  },
});

export const upsertMatchResultInternal = internalMutation({
  args: {
    sourceMatchId: v.string(),
    fixtureId: v.optional(v.string()),
    stage: v.union(v.literal("group"), v.literal("r32"), v.literal("r16"), v.literal("qf"), v.literal("sf"), v.literal("final"), v.literal("other")),
    groupId: v.optional(v.string()),
    round: v.optional(v.string()),
    homeTeam: v.optional(v.string()),
    awayTeam: v.optional(v.string()),
    homeScore: v.optional(v.number()),
    awayScore: v.optional(v.number()),
    winner: v.optional(v.string()),
    status: v.string(),
    kickoffAt: v.optional(v.string()),
    raw: v.any(),
    source: v.string(),
    syncedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("worldCupMatchResults")
      .withIndex("by_source_match", (q) => q.eq("sourceMatchId", args.sourceMatchId))
      .first();
    const payload = { ...args, groupId: args.groupId?.toUpperCase(), updatedAt: Date.now() };
    if (existing) {
      await ctx.db.patch(existing._id, payload);
      return existing._id;
    }
    return await ctx.db.insert("worldCupMatchResults", payload);
  },
});

export const recordSyncRunInternal = internalMutation({
  args: {
    status: v.union(v.literal("success"), v.literal("missing-key"), v.literal("error")),
    provider: v.string(),
    matchesUpserted: v.number(),
    standingsUpserted: v.number(),
    message: v.optional(v.string()),
    startedAt: v.number(),
    finishedAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("worldCupResultSyncRuns", args);
  },
});

export const submitMissionInternal = internalMutation({
  args: {
    familyName: v.string(),
    parentName: v.optional(v.string()),
    parentEmail: v.optional(v.string()),
    parentPhone: v.optional(v.string()),
    childFirstName: v.optional(v.string()),
    challengeKey: v.string(),
    challengeTitle: v.string(),
    caption: v.optional(v.string()),
    socialPostUrl: v.optional(v.string()),
    mediaStorageId: v.optional(v.id("_storage")),
    mediaName: v.optional(v.string()),
    mediaType: v.optional(v.string()),
    mediaSize: v.optional(v.number()),
    marketingPermission: v.boolean(),
    repostPermission: v.optional(v.boolean()),
    source: v.string(),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("worldCupMissionSubmissions", {
      ...args,
      status: "submitted",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const listEntries = query({
  args: {
    limit: v.optional(v.number()),
    mode: v.optional(v.union(v.literal("quick-kids"), v.literal("full-family"), v.literal("fantasy-five"), v.literal("second-chance"), v.literal("launch-list"))),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(Math.max(args.limit ?? 100, 1), 500);
    if (args.mode) {
      return await ctx.db
        .query("worldCupEntries")
        .withIndex("by_mode", (q) => q.eq("mode", args.mode!))
        .order("desc")
        .take(limit);
    }

    return await ctx.db
      .query("worldCupEntries")
      .withIndex("by_created")
      .order("desc")
      .take(limit);
  },
});

function entryAdminStatus(entry: Doc<"worldCupEntries">) {
  return (entry as any).adminStatus || "active";
}

function latestEntryKey(entry: Doc<"worldCupEntries">) {
  const contact = entry.parentPhone || entry.parentEmail || entry.familyName || String(entry._id);
  return `${contact.toLowerCase()}::${entry.participantName || "family"}::${entry.mode}`;
}

function latestActiveEntries(entries: Doc<"worldCupEntries">[]) {
  const latest = new Map<string, Doc<"worldCupEntries">>();
  for (const entry of entries) {
    if (entry.mode === "launch-list") continue;
    if (entryAdminStatus(entry) !== "active") continue;
    const key = latestEntryKey(entry);
    const current = latest.get(key);
    if (!current || entry.createdAt > current.createdAt) latest.set(key, entry);
  }
  return Array.from(latest.values());
}

export const listLeaderboard = query({
  args: {
    limit: v.optional(v.number()),
    publicOnly: v.optional(v.boolean()),
    groupCode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(Math.max(args.limit ?? 100, 1), 500);
    const groupCode = normalizeGroupCode(args.groupCode);
    const publishedResults = await buildPublishedResults(ctx);
    const entries = await ctx.db
      .query("worldCupEntries")
      .withIndex("by_created")
      .order("desc")
      .take(500);

    const group = groupCode
      ? await ctx.db
          .query("worldCupGroups")
          .withIndex("by_join_code", (q) => q.eq("joinCode", groupCode))
          .first()
      : null;

    const rows = latestActiveEntries(entries)
      .filter((entry) => !groupCode || (entry.groupCodes || []).includes(groupCode))
      .map((entry) => {
        const score = scoreEntry(entry, publishedResults);
        const fantasy = entry.mode === "fantasy-five" ? fantasyPlayersFromEntry(entry.entryData) : null;
        const showPrivateNames = Boolean(groupCode);
        const participantLabel = entry.participantDisplayName || entry.participantName;
        const displaySource = showPrivateNames && participantLabel
          ? `${participantLabel} - ${entry.familyName || "Family Team"}`
          : entry.mode === "quick-kids" && entry.participantDisplayName
            ? `${entry.participantDisplayName} - ${entry.familyName || "Family Team"}`
            : entry.familyName || entry.participantDisplayName || entry.participantName;
        return {
          id: entry._id,
          familyName: args.publicOnly ? cleanDisplayName(entry.familyName, "Family Team") : entry.familyName,
          displayName: cleanDisplayName(displaySource, "Family Team"),
          participantName: args.publicOnly && !showPrivateNames ? undefined : entry.participantName,
          participantDisplayName: args.publicOnly && !showPrivateNames ? undefined : entry.participantDisplayName,
          mode: entry.mode,
          ageRange: entry.ageRange,
          score,
          champion: entryChampion(entry),
          fantasySummary: fantasy ? {
            captain: formatPublicPlayerName(fantasy.players.find((player) => player.id === fantasy.captainId)?.name),
            players: fantasy.players.map((player) => formatPublicPlayerName(player.name)).slice(0, 5),
          } : undefined,
          createdAt: entry.createdAt,
        };
      })
      .sort((a, b) => b.score.total - a.score.total || a.createdAt - b.createdAt)
      .slice(0, limit)
      .map((row, index) => ({ ...row, rank: index + 1 }));
    return {
      group: group ? {
        name: group.name,
        joinCode: group.joinCode,
        type: group.type,
      } : null,
      rows,
    };
  },
});

export const getPublicGroupByCode = query({
  args: {
    joinCode: v.string(),
  },
  handler: async (ctx, args) => {
    const joinCode = normalizeGroupCode(args.joinCode);
    if (!joinCode) return null;
    const group = await ctx.db
      .query("worldCupGroups")
      .withIndex("by_join_code", (q) => q.eq("joinCode", joinCode))
      .first();
    if (!group) return null;
    return {
      name: group.name,
      joinCode: group.joinCode,
      type: group.type,
    };
  },
});

export const listMissionSubmissions = query({
  args: {
    limit: v.optional(v.number()),
    challengeKey: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(Math.max(args.limit ?? 100, 1), 500);
    if (args.challengeKey) {
      return await ctx.db
        .query("worldCupMissionSubmissions")
        .withIndex("by_challenge", (q) => q.eq("challengeKey", args.challengeKey!))
        .order("desc")
        .take(limit);
    }
    return await ctx.db
      .query("worldCupMissionSubmissions")
      .withIndex("by_created")
      .order("desc")
      .take(limit);
  },
});

function entryChampion(entry: Doc<"worldCupEntries">) {
  const data = entry.entryData as any;
  if (entry.mode === "quick-kids") return data?.simplePicks?.champion || "";
  if (entry.mode === "fantasy-five") {
    const { players, captainId } = fantasyPlayersFromEntry(data);
    return players.find((player) => player.id === captainId)?.name || players[0]?.name || "";
  }
  return data?.winners?.final?.final_0 || "";
}

function asArray(value: unknown): any[] {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object") return [];
  const record = value as Record<string, any>;
  if (Array.isArray(record.data)) return record.data;
  if (Array.isArray(record.results)) return record.results;
  if (Array.isArray(record.matches)) return record.matches;
  if (Array.isArray(record.fixtures)) return record.fixtures;
  if (Array.isArray(record.standings)) return record.standings;
  if (Array.isArray(record.teams)) return record.teams;
  if (Array.isArray(record.groups)) return record.groups;
  if (Array.isArray(record.games)) return record.games;
  return [];
}

function numberValue(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

function teamName(value: unknown) {
  if (!value) return undefined;
  if (typeof value === "string") return value.trim() || undefined;
  if (typeof value !== "object") return undefined;
  const record = value as Record<string, any>;
  const name = String(record.name || record.team_name || record.country || record.short_name || "").trim();
  return name ? canonicalTeamName(name) : undefined;
}

function scoreValue(match: Record<string, any>, side: "home" | "away") {
  const direct = numberValue(match[`${side}Score`] ?? match[`${side}_score`] ?? match[`${side}TeamScore`]);
  if (direct !== undefined) return direct;
  const scores = match.scores || match.score || {};
  return numberValue(
    scores?.[side]
    ?? scores?.[`${side}_score`]
    ?? scores?.full_time?.[side]
    ?? scores?.fullTime?.[side]
    ?? scores?.current?.[side]
    ?? scores?.total?.[side]
  );
}

function normalizeStage(value: unknown) {
  const text = String(value || "").toLowerCase();
  if (text.includes("round of 32") || text.includes("r32") || text === "32") return "r32";
  if (text.includes("round of 16") || text.includes("r16") || text === "16") return "r16";
  if (text.includes("quarter") || text.includes("qf")) return "qf";
  if (text.includes("semi") || text.includes("sf")) return "sf";
  if (text.includes("final")) return "final";
  if (text.includes("group") || /^[1-3]$/.test(text)) return "group";
  return "other";
}

function matchWinner(match: Record<string, any>, homeTeam?: string, awayTeam?: string, homeScore?: number, awayScore?: number) {
  const outcome = String(
    match.outcome
    ?? match.winner
    ?? match.result?.winner
    ?? match.outcomes?.penalty_shootout
    ?? match.outcomes?.extra_time
    ?? match.outcomes?.full_time
    ?? ""
  ).trim();
  if (outcome === "1" || outcome.toLowerCase() === "home") return homeTeam;
  if (outcome === "2" || outcome.toLowerCase() === "away") return awayTeam;
  if (outcome && outcome !== "draw" && outcome !== "0") return outcome;
  if (homeScore !== undefined && awayScore !== undefined && homeScore !== awayScore) {
    return homeScore > awayScore ? homeTeam : awayTeam;
  }
  return undefined;
}

function sourceMatchId(match: Record<string, any>) {
  return String(match.id ?? match.match_id ?? match.fixture_id ?? match.game_id ?? `${match.home_team?.name || match.homeTeam || "home"}-${match.away_team?.name || match.awayTeam || "away"}-${match.date || match.datetime || match.kickoff || ""}`);
}

async function fetchWorldCupApi(path: string, key: string) {
  const url = new URL(`https://worldcupapi.com/api/${path}`);
  url.searchParams.set("key", key);
  const res = await fetch(url.toString(), { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`WorldCupAPI ${path} failed (${res.status}): ${await res.text()}`);
  return await res.json();
}

async function fetchWorldCup26Ir(path: string) {
  const res = await fetch(`https://worldcup26.ir/get/${path}`, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`worldcup26.ir ${path} failed (${res.status}): ${await res.text()}`);
  return await res.json();
}

function teamNameFromWorldCup26(value: unknown, teamsById: Map<string, string>) {
  if (!value) return undefined;
  const name = teamsById.get(String(value));
  return name ? canonicalTeamName(name) : undefined;
}

async function syncFromWorldCup26Ir(ctx: any, startedAt: number) {
  const provider = "worldcup26.ir";
  let standingsUpserted = 0;
  let matchesUpserted = 0;
  const syncedAt = Date.now();
  const [teamsPayload, groupsPayload, gamesPayload] = await Promise.all([
    fetchWorldCup26Ir("teams"),
    fetchWorldCup26Ir("groups"),
    fetchWorldCup26Ir("games"),
  ]);

  const teamsById = new Map<string, string>();
  for (const team of asArray(teamsPayload)) {
    const id = String(team.id ?? team.team_id ?? "");
    const name = String(team.name_en || team.name || team.team_name || "").trim();
    if (id && name) teamsById.set(id, name);
  }

  for (const group of asArray(groupsPayload)) {
    const groupId = String(group.name || group.group || group.groupId || "").toUpperCase();
    if (!groupId) continue;
    const rows = Array.isArray(group.teams) ? group.teams : [];
    const sorted = rows.slice().sort((a: any, b: any) =>
      (numberValue(b.pts) ?? 0) - (numberValue(a.pts) ?? 0)
      || (numberValue(b.gd) ?? 0) - (numberValue(a.gd) ?? 0)
      || (numberValue(b.gf) ?? 0) - (numberValue(a.gf) ?? 0)
      || String(teamNameFromWorldCup26(a.team_id, teamsById) || "").localeCompare(String(teamNameFromWorldCup26(b.team_id, teamsById) || ""))
    );
    for (const [index, row] of sorted.entries()) {
      const team = teamNameFromWorldCup26(row.team_id, teamsById);
      if (!team) continue;
      await ctx.runMutation(internal.worldCup.upsertGroupStandingInternal, {
        groupId,
        teamName: team,
        position: index + 1,
        points: numberValue(row.pts),
        matches: numberValue(row.mp),
        goalDiff: numberValue(row.gd),
        goalsFor: numberValue(row.gf),
        goalsAgainst: numberValue(row.ga),
        raw: row,
        source: provider,
        syncedAt,
      });
      standingsUpserted += 1;
    }
  }

  for (const match of asArray(gamesPayload)) {
    const homeTeam = teamNameFromWorldCup26(match.home_team_id, teamsById) || teamName(match.home_team_name_en);
    const awayTeam = teamNameFromWorldCup26(match.away_team_id, teamsById) || teamName(match.away_team_name_en);
    const homeScore = numberValue(match.home_score);
    const awayScore = numberValue(match.away_score);
    const winner = String(match.finished).toUpperCase() === "TRUE"
      ? matchWinner(match, homeTeam, awayTeam, homeScore, awayScore)
      : undefined;
    await ctx.runMutation(internal.worldCup.upsertMatchResultInternal, {
      sourceMatchId: String(match.id || match._id),
      stage: normalizeStage(match.type || match.group) as "group" | "r32" | "r16" | "qf" | "sf" | "final" | "other",
      groupId: match.group ? String(match.group).toUpperCase() : undefined,
      round: match.matchday ? `Matchday ${match.matchday}` : undefined,
      homeTeam,
      awayTeam,
      homeScore,
      awayScore,
      winner,
      status: String(match.finished).toUpperCase() === "TRUE" ? "finished" : String(match.time_elapsed || "scheduled").slice(0, 40),
      kickoffAt: match.local_date ? String(match.local_date).slice(0, 80) : undefined,
      raw: match,
      source: provider,
      syncedAt,
    });
    matchesUpserted += 1;
  }

  await ctx.runMutation(internal.worldCup.recordSyncRunInternal, {
    status: "success",
    provider,
    matchesUpserted,
    standingsUpserted,
    startedAt,
    finishedAt: Date.now(),
  });
  return { ok: true, provider, matchesUpserted, standingsUpserted };
}

export const syncWorldCupResultsInternal = internalAction({
  args: {},
  handler: async (ctx) => {
    const startedAt = Date.now();
    const provider = "worldcupapi.com";
    const key = process.env.WORLDCUPAPI_KEY || process.env.WORLD_CUP_API_KEY || process.env.WORLD_CUP_API_TOKEN;
    if (!key) {
      return await syncFromWorldCup26Ir(ctx, startedAt);
    }

    let standingsUpserted = 0;
    let matchesUpserted = 0;
    const syncedAt = Date.now();
    try {
      for (const groupId of "ABCDEFGHIJKL".split("")) {
        const payload = await fetchWorldCupApi(`standings?group=${groupId}`, key);
        for (const row of asArray(payload)) {
          const team = teamName(row.team || row.country || row);
          const position = numberValue(row.position ?? row.rank ?? row.group_position);
          if (!team || position === undefined) continue;
          await ctx.runMutation(internal.worldCup.upsertGroupStandingInternal, {
            groupId,
            teamName: team,
            position,
            points: numberValue(row.points ?? row.pts),
            matches: numberValue(row.played ?? row.matches_played ?? row.games),
            goalDiff: numberValue(row.goal_difference ?? row.goalDiff ?? row.gd),
            goalsFor: numberValue(row.goals_for ?? row.goalsFor ?? row.gf),
            goalsAgainst: numberValue(row.goals_against ?? row.goalsAgainst ?? row.ga),
            raw: row,
            source: provider,
            syncedAt,
          });
          standingsUpserted += 1;
        }
      }

      const historyPayload = await fetchWorldCupApi("matches?from=2026-06-11&to=2026-07-19", key);
      for (const match of asArray(historyPayload)) {
        const homeTeam = teamName(match.home_team || match.homeTeam || match.home);
        const awayTeam = teamName(match.away_team || match.awayTeam || match.away);
        const homeScore = scoreValue(match, "home");
        const awayScore = scoreValue(match, "away");
        const stage = normalizeStage(match.stage || match.round || match.phase || match.group) as "group" | "r32" | "r16" | "qf" | "sf" | "final" | "other";
        const winner = matchWinner(match, homeTeam, awayTeam, homeScore, awayScore);
        await ctx.runMutation(internal.worldCup.upsertMatchResultInternal, {
          sourceMatchId: sourceMatchId(match),
          fixtureId: match.fixture_id ? String(match.fixture_id) : undefined,
          stage,
          groupId: match.group ? String(match.group).replace(/group\s*/i, "").toUpperCase().slice(0, 2) : undefined,
          round: match.round ? String(match.round).slice(0, 40) : undefined,
          homeTeam,
          awayTeam,
          homeScore,
          awayScore,
          winner,
          status: String(match.status || match.match_status || "unknown").slice(0, 40),
          kickoffAt: match.date || match.datetime || match.kickoff ? String(match.date || match.datetime || match.kickoff).slice(0, 80) : undefined,
          raw: match,
          source: provider,
          syncedAt,
        });
        matchesUpserted += 1;
      }

      await ctx.runMutation(internal.worldCup.recordSyncRunInternal, {
        status: "success",
        provider,
        matchesUpserted,
        standingsUpserted,
        startedAt,
        finishedAt: Date.now(),
      });
      return { ok: true, matchesUpserted, standingsUpserted };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await ctx.runMutation(internal.worldCup.recordSyncRunInternal, {
        status: "error",
        provider,
        matchesUpserted,
        standingsUpserted,
        message,
        startedAt,
        finishedAt: Date.now(),
      });
      throw error;
    }
  },
});
