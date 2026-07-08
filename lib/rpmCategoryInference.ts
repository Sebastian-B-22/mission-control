type CalendarLike = {
  title?: string;
  location?: string;
};

type ProjectTaskLike = {
  project?: string;
  subProject?: string;
  title?: string;
  description?: string;
};

const CATEGORY = {
  resilientHumans: "Raising Resilient Humans",
  friendships: "Extraordinary Friendships",
  body: "Bangin' Ass Body",
  relationship: "Phenomenal Relationship",
  finance: "Financial Independence & Freedom",
  home: "Home Haven & Sanctuary",
  businessOwner: "Bad Ass Business Owner",
  hta: "HTA Empire Builder",
  staff: "Staff Empowerment & Kickass Workplace",
  marketing: "Marketing & Networking Genius",
  systems: "Operational Systems Guru",
  program: "Program Innovation & Excellence",
} as const;

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function includesAny(text: string, needles: string[]) {
  return needles.some((needle) => text.includes(needle));
}

export function inferCalendarRpmCategoryName(event: CalendarLike): string | undefined {
  const text = normalize([event.title, event.location].filter(Boolean).join(" "));

  if (
    includesAny(text, [
      "walk with antonia",
      "antonia walk",
      "walk antonia",
      "coffee with",
      "lunch with",
      "dinner with friends",
      "friend dinner",
      "friend lunch",
      "catch up with",
      "catchup with",
      "meet with friend",
      "meet friends",
    ])
  ) {
    return CATEGORY.friendships;
  }

  if (
    includesAny(text, [
      "evaluation day",
      "skills medal",
      "medal day",
      "zoom",
    ])
  ) {
    return CATEGORY.businessOwner;
  }

  if (
    includesAny(text, [
      "synthesis teams",
      "wonder math",
      "math academy",
      "homeschool",
      "outschool",
      "drawing",
      "ninja class",
      "jiu jitsu",
      "jiujitsu",
      "boxing",
      "teen center",
      "play date",
      "playdate",
    ])
  ) {
    return CATEGORY.resilientHumans;
  }

  if (includesAny(text, ["antonia", "tara", "liv", "graduation", "grad party", "party", "friend"])) {
    return CATEGORY.friendships;
  }

  if (includesAny(text, ["irish dance", "dance class", "workout", "weights", "lift weights", "strength", "fitness", "pilates", "yoga", "hike"])) {
    return CATEGORY.body;
  }

  if (includesAny(text, ["invoice", "bill", "payment", "finance", "tax"])) {
    return CATEGORY.finance;
  }

  if (includesAny(text, ["cleaners", "cleaner", "cleaning", "planning", "prep", "floor", "flooring", "home", "contractor", "remodel"])) {
    return CATEGORY.home;
  }

  if (includesAny(text, ["date night", "joey"])) {
    return CATEGORY.relationship;
  }

  return undefined;
}

export function inferProjectTaskRpmCategoryName(task: ProjectTaskLike): string | undefined {
  const text = normalize([task.project, task.subProject, task.title, task.description].filter(Boolean).join(" "));

  if (includesAny(text, ["invoice", "payment", "pricing", "revenue", "financial"])) {
    return CATEGORY.finance;
  }

  if (includesAny(text, ["staff", "coach assignment", "coach assignments", "schedule coaches", "workplace"])) {
    return CATEGORY.staff;
  }

  if (includesAny(text, ["camp email", "camp emails", "flyer", "yard sign", "local ad", "marketing", "networking", "lead", "follow up"])) {
    return CATEGORY.marketing;
  }

  if (includesAny(text, ["registration system", "admin system", "ops", "operational", "quo", "workflow", "automation"])) {
    return CATEGORY.systems;
  }

  if (includesAny(text, ["skill video", "curriculum", "program innovation", "bracket", "competition", "training design"])) {
    return CATEGORY.program;
  }

  if (task.project === "hta" || includesAny(text, ["hta", "founding families", "founder bonus", "offer architecture", "logo", "signup target"])) {
    return CATEGORY.hta;
  }

  if (task.project === "aspire" || includesAny(text, ["7v7", "soccer7v7", "spring league", "pali", "agoura"])) {
    return CATEGORY.businessOwner;
  }

  if (task.project === "homeschool" || includesAny(text, ["synthesis", "wonder math", "homeschool"])) {
    return CATEGORY.resilientHumans;
  }

  return undefined;
}
