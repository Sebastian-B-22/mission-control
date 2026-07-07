import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ===== BIOMARKER REFERENCE DATA =====
// Clinical ranges for common biomarkers

export const BIOMARKER_RANGES: Record<string, {
  name: string;
  unit: string;
  category: string;
  optimal: [number, number];
  normal: [number, number];
  description: string;
}> = {
  // Lipids
  "total-cholesterol": {
    name: "Total Cholesterol",
    unit: "mg/dL",
    category: "lipids",
    optimal: [125, 180],
    normal: [125, 200],
    description: "Total blood cholesterol",
  },
  "ldl": {
    name: "LDL Cholesterol",
    unit: "mg/dL",
    category: "lipids",
    optimal: [50, 70],
    normal: [50, 100],
    description: "Low-density lipoprotein (bad cholesterol)",
  },
  "hdl": {
    name: "HDL Cholesterol",
    unit: "mg/dL",
    category: "lipids",
    optimal: [60, 100],
    normal: [40, 100],
    description: "High-density lipoprotein (good cholesterol)",
  },
  "triglycerides": {
    name: "Triglycerides",
    unit: "mg/dL",
    category: "lipids",
    optimal: [50, 100],
    normal: [50, 150],
    description: "Blood fat levels",
  },
  "apoB": {
    name: "ApoB",
    unit: "mg/dL",
    category: "lipids",
    optimal: [40, 70],
    normal: [40, 90],
    description: "Apolipoprotein B - cardiovascular risk marker",
  },
  "lp-a": {
    name: "Lp(a)",
    unit: "nmol/L",
    category: "lipids",
    optimal: [0, 30],
    normal: [0, 75],
    description: "Lipoprotein(a) - genetic cardiovascular risk",
  },

  // Metabolic
  "glucose-fasting": {
    name: "Fasting Glucose",
    unit: "mg/dL",
    category: "metabolic",
    optimal: [70, 90],
    normal: [70, 100],
    description: "Blood sugar after fasting",
  },
  "hba1c": {
    name: "HbA1c",
    unit: "%",
    category: "metabolic",
    optimal: [4.0, 5.3],
    normal: [4.0, 5.7],
    description: "3-month average blood sugar",
  },
  "fasting-insulin": {
    name: "Fasting Insulin",
    unit: "μIU/mL",
    category: "metabolic",
    optimal: [2, 5],
    normal: [2, 10],
    description: "Insulin resistance marker",
  },
  "homa-ir": {
    name: "HOMA-IR",
    unit: "index",
    category: "metabolic",
    optimal: [0.5, 1.0],
    normal: [0.5, 2.0],
    description: "Insulin resistance index",
  },

  // Inflammation
  "hs-crp": {
    name: "hs-CRP",
    unit: "mg/L",
    category: "inflammation",
    optimal: [0, 0.5],
    normal: [0, 1.0],
    description: "High-sensitivity C-reactive protein",
  },
  "homocysteine": {
    name: "Homocysteine",
    unit: "μmol/L",
    category: "inflammation",
    optimal: [5, 7],
    normal: [5, 12],
    description: "Cardiovascular inflammation marker",
  },
  "ferritin": {
    name: "Ferritin",
    unit: "ng/mL",
    category: "inflammation",
    optimal: [40, 100],
    normal: [20, 200],
    description: "Iron storage / inflammation marker",
  },

  // Thyroid
  "tsh": {
    name: "TSH",
    unit: "mIU/L",
    category: "thyroid",
    optimal: [1.0, 2.0],
    normal: [0.4, 4.0],
    description: "Thyroid stimulating hormone",
  },
  "free-t4": {
    name: "Free T4",
    unit: "ng/dL",
    category: "thyroid",
    optimal: [1.0, 1.5],
    normal: [0.8, 1.8],
    description: "Free thyroxine",
  },
  "free-t3": {
    name: "Free T3",
    unit: "pg/mL",
    category: "thyroid",
    optimal: [3.0, 4.0],
    normal: [2.3, 4.2],
    description: "Free triiodothyronine",
  },

  // Vitamins & Minerals
  "vitamin-d": {
    name: "Vitamin D (25-OH)",
    unit: "ng/mL",
    category: "vitamins",
    optimal: [50, 80],
    normal: [30, 100],
    description: "Vitamin D status",
  },
  "vitamin-b12": {
    name: "Vitamin B12",
    unit: "pg/mL",
    category: "vitamins",
    optimal: [500, 1000],
    normal: [200, 1100],
    description: "B12 levels",
  },
  "folate": {
    name: "Folate",
    unit: "ng/mL",
    category: "vitamins",
    optimal: [10, 25],
    normal: [3, 30],
    description: "Folate / B9 levels",
  },
  "magnesium-rbc": {
    name: "RBC Magnesium",
    unit: "mg/dL",
    category: "vitamins",
    optimal: [5.5, 6.5],
    normal: [4.2, 6.8],
    description: "Intracellular magnesium",
  },
  "iron": {
    name: "Iron",
    unit: "μg/dL",
    category: "vitamins",
    optimal: [80, 120],
    normal: [60, 170],
    description: "Serum iron",
  },
  "zinc": {
    name: "Zinc",
    unit: "μg/dL",
    category: "vitamins",
    optimal: [90, 120],
    normal: [60, 130],
    description: "Serum zinc",
  },

  // Hormones
  "testosterone-total": {
    name: "Total Testosterone",
    unit: "ng/dL",
    category: "hormones",
    optimal: [500, 900], // male ranges
    normal: [300, 1000],
    description: "Total testosterone (male range)",
  },
  "testosterone-free": {
    name: "Free Testosterone",
    unit: "pg/mL",
    category: "hormones",
    optimal: [15, 25],
    normal: [9, 30],
    description: "Free testosterone (male range)",
  },
  "estradiol": {
    name: "Estradiol",
    unit: "pg/mL",
    category: "hormones",
    optimal: [20, 35], // male ranges
    normal: [10, 40],
    description: "Estradiol (male range)",
  },
  "dhea-s": {
    name: "DHEA-S",
    unit: "μg/dL",
    category: "hormones",
    optimal: [250, 450],
    normal: [100, 500],
    description: "DHEA-sulfate",
  },
  "cortisol-am": {
    name: "Cortisol (AM)",
    unit: "μg/dL",
    category: "hormones",
    optimal: [10, 18],
    normal: [6, 23],
    description: "Morning cortisol",
  },

  // Liver & Kidney
  "alt": {
    name: "ALT",
    unit: "U/L",
    category: "liver",
    optimal: [10, 25],
    normal: [7, 40],
    description: "Alanine aminotransferase (liver)",
  },
  "ast": {
    name: "AST",
    unit: "U/L",
    category: "liver",
    optimal: [10, 25],
    normal: [8, 40],
    description: "Aspartate aminotransferase (liver)",
  },
  "ggt": {
    name: "GGT",
    unit: "U/L",
    category: "liver",
    optimal: [10, 25],
    normal: [9, 48],
    description: "Gamma-glutamyl transferase",
  },
  "creatinine": {
    name: "Creatinine",
    unit: "mg/dL",
    category: "kidney",
    optimal: [0.8, 1.1],
    normal: [0.7, 1.3],
    description: "Kidney function marker",
  },
  "egfr": {
    name: "eGFR",
    unit: "mL/min",
    category: "kidney",
    optimal: [90, 120],
    normal: [60, 120],
    description: "Estimated glomerular filtration rate",
  },
  "bun": {
    name: "BUN",
    unit: "mg/dL",
    category: "kidney",
    optimal: [10, 16],
    normal: [7, 20],
    description: "Blood urea nitrogen",
  },

  // Blood
  "hemoglobin": {
    name: "Hemoglobin",
    unit: "g/dL",
    category: "blood",
    optimal: [14, 17],
    normal: [13, 18],
    description: "Oxygen-carrying protein",
  },
  "hematocrit": {
    name: "Hematocrit",
    unit: "%",
    category: "blood",
    optimal: [42, 50],
    normal: [38, 54],
    description: "Red blood cell percentage",
  },
  "wbc": {
    name: "WBC",
    unit: "K/μL",
    category: "blood",
    optimal: [4.5, 7.5],
    normal: [4.0, 11.0],
    description: "White blood cell count",
  },
  "platelets": {
    name: "Platelets",
    unit: "K/μL",
    category: "blood",
    optimal: [175, 300],
    normal: [150, 400],
    description: "Platelet count",
  },
};

export const BIOMARKER_CATEGORIES = [
  { id: "lipids", name: "Lipids", color: "rose", icon: "heart" },
  { id: "metabolic", name: "Metabolic", color: "amber", icon: "flame" },
  { id: "inflammation", name: "Inflammation", color: "orange", icon: "zap" },
  { id: "thyroid", name: "Thyroid", color: "purple", icon: "activity" },
  { id: "vitamins", name: "Vitamins & Minerals", color: "emerald", icon: "pill" },
  { id: "hormones", name: "Hormones", color: "blue", icon: "trending-up" },
  { id: "liver", name: "Liver", color: "yellow", icon: "droplet" },
  { id: "kidney", name: "Kidney", color: "cyan", icon: "droplets" },
  { id: "blood", name: "Blood Cells", color: "red", icon: "droplet" },
];

// ===== QUERIES =====

export const getResults = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query("biomarkerResults")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    return results.sort((a, b) => b.testDate.localeCompare(a.testDate));
  },
});

export const getLatestResult = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query("biomarkerResults")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .first();
    return results;
  },
});

export const getBiomarkerHistory = query({
  args: { userId: v.id("users"), biomarkerKey: v.string() },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query("biomarkerResults")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    const history = results
      .map((r) => {
        const marker = r.biomarkers.find((b) => b.name === args.biomarkerKey);
        if (!marker) return null;
        return { date: r.testDate, value: marker.value };
      })
      .filter(Boolean)
      .sort((a, b) => a!.date.localeCompare(b!.date));
    
    return history;
  },
});

export const getRanges = query({
  args: {},
  handler: async () => {
    return BIOMARKER_RANGES;
  },
});

export const getCategories = query({
  args: {},
  handler: async () => {
    return BIOMARKER_CATEGORIES;
  },
});

// ===== MUTATIONS =====

export const addResult = mutation({
  args: {
    userId: v.id("users"),
    testDate: v.string(),
    labName: v.optional(v.string()),
    biomarkers: v.array(v.object({
      name: v.string(),
      value: v.number(),
      unit: v.string(),
      category: v.string(),
    })),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("biomarkerResults", {
      userId: args.userId,
      testDate: args.testDate,
      labName: args.labName,
      biomarkers: args.biomarkers,
      notes: args.notes,
      createdAt: Date.now(),
    });
  },
});

export const updateResult = mutation({
  args: {
    resultId: v.id("biomarkerResults"),
    testDate: v.optional(v.string()),
    labName: v.optional(v.string()),
    biomarkers: v.optional(v.array(v.object({
      name: v.string(),
      value: v.number(),
      unit: v.string(),
      category: v.string(),
    }))),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { resultId, ...updates } = args;
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );
    await ctx.db.patch(resultId, filtered);
  },
});

export const deleteResult = mutation({
  args: { resultId: v.id("biomarkerResults") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.resultId);
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});
