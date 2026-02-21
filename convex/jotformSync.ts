import { action, ActionCtx } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

const JOTFORM_API_KEY = "72090aa241467abb2c1c07fb5c515d6a";
const CONVERTKIT_API_KEY = "kit_546b497ab8f2c8578b46a1b98701e47f";

const FORMS: Record<string, string> = {
  agoura: "252936886936175",
  pali: "260227563545155",
};

// Field mapping (confirmed from live API)
// Agoura: Q4=child name, Q11=parent email, Q12=parent name, Q15=phone, Q26=stripe pf, Q51=birth year
// Pali:   Q4=child name, Q11=parent email, Q42=parent name, Q15=phone, Q26=stripe pf, Q48=birth year

function getDivision(year: number): string {
  if (year === 2021) return "5U";
  if (year === 2020) return "6U";
  if (year === 2019) return "7U";
  if (year === 2018) return "8U";
  if (year === 2016 || year === 2017) return "10U";
  if (year === 2014 || year === 2015) return "12U";
  if (year === 2012 || year === 2013) return "14U";
  return "unknown";
}

function parseNameField(val: unknown): { first: string; last: string } {
  if (!val) return { first: "", last: "" };
  if (typeof val === "object" && val !== null) {
    const o = val as Record<string, string>;
    return { first: o.first || "", last: o.last || "" };
  }
  const parts = String(val).trim().split(" ");
  return { first: parts[0] || "", last: parts.slice(1).join(" ") || "" };
}

function parsePhone(val: unknown): string {
  if (!val) return "";
  if (typeof val === "object" && val !== null) {
    return (val as Record<string, string>).full || "";
  }
  return String(val).trim();
}

// Shared sync logic extracted so both actions can call it without circular refs
async function doSync(
  ctx: ActionCtx,
  region: "agoura" | "pali"
): Promise<{ synced: number; skipped: number; total: number }> {
  const formId = FORMS[region];
  const url = `https://api.jotform.com/form/${formId}/submissions?apiKey=${JOTFORM_API_KEY}&limit=1000&orderby=created_at`;
  const resp = await fetch(url);
  const data = (await resp.json()) as { content: unknown[] };
  const subs = data.content || [];

  let synced = 0;
  let skipped = 0;

  for (const _sub of subs) {
    const sub = _sub as Record<string, unknown>;
    const ans = (sub.answers || {}) as Record<string, Record<string, unknown>>;

    // Child name (Q4 on both forms)
    const childName = parseNameField(ans["4"]?.answer);
    if (!childName.first) { skipped++; continue; }

    // Parent name (Q12 Agoura, Q42 Pali)
    const parentName = region === "agoura"
      ? parseNameField(ans["12"]?.answer)
      : parseNameField(ans["42"]?.answer);

    // Contact
    const email = String(ans["11"]?.answer || "").trim().toLowerCase();
    const phone = parsePhone(ans["15"]?.answer);
    if (!email) { skipped++; continue; }

    // Birth year (Q51 Agoura, Q48 Pali)
    const byField = region === "agoura" ? "51" : "48";
    const birthYearRaw = ans[byField]?.answer;
    const birthYear = birthYearRaw ? parseInt(String(birthYearRaw)) : null;

    // Gender + practice day from Stripe prettyFormat (Q26)
    const pf = String(ans["26"]?.prettyFormat || "");
    const genderMatch = region === "agoura"
      ? pf.match(/Select Gender:\s*(Boys|Girls)/i)
      : pf.match(/Gender:\s*(Boys|Girls)/i);
    const gender = genderMatch ? genderMatch[1] : null;

    const dayMatch = pf.match(/Spring League - (MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY)/i);
    const practiceDay = dayMatch ? dayMatch[1] : null;

    const division = birthYear ? getDivision(birthYear) : null;

    // Upsert family
    const familyId = await ctx.runMutation(api.families.upsertFamily, {
      parentFirstName: parentName.first,
      parentLastName: parentName.last,
      email,
      phone,
    });

    // Upsert child
    const childId = await ctx.runMutation(api.families.upsertChild, {
      familyId,
      firstName: childName.first,
      lastName: childName.last,
      birthYear: birthYear ?? undefined,
      gender: gender ?? undefined,
    });

    // Upsert enrollment
    await ctx.runMutation(api.families.upsertEnrollment, {
      childId,
      familyId,
      program: "spring_league",
      region,
      season: "Spring 2026",
      division: division ?? undefined,
      practiceDay: practiceDay ?? undefined,
      status: "active",
    });

    // Tag in ConvertKit (non-fatal)
    try {
      await fetch("https://api.kit.com/v4/subscribers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Kit-Api-Key": CONVERTKIT_API_KEY,
        },
        body: JSON.stringify({
          email_address: email,
          first_name: parentName.first,
          tags: ["Spring League 2026", region === "agoura" ? "Agoura" : "Pali"],
        }),
      });
    } catch {
      // Non-fatal
    }

    synced++;
  }

  return { synced, skipped, total: subs.length };
}

// ─── Public Actions ────────────────────────────────────────────────────────

export const syncJotform = action({
  args: { region: v.union(v.literal("agoura"), v.literal("pali")) },
  handler: async (ctx, { region }) => {
    return doSync(ctx, region);
  },
});

export const syncAll = action({
  args: {},
  handler: async (ctx) => {
    const agoura = await doSync(ctx, "agoura");
    const pali = await doSync(ctx, "pali");
    return { agoura, pali };
  },
});
