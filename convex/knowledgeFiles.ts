import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const Area = v.union(
  v.literal("aspire"),
  v.literal("hta"),
  v.literal("homeschool"),
  v.literal("family"),
  v.literal("health"),
  v.literal("operations"),
  v.literal("personal"),
  v.literal("other")
);

const DocType = v.union(
  v.literal("flyer"),
  v.literal("form"),
  v.literal("schedule"),
  v.literal("export"),
  v.literal("note"),
  v.literal("image"),
  v.literal("audio"),
  v.literal("other")
);

const DocumentStatus = v.union(
  v.literal("draft"),
  v.literal("current"),
  v.literal("final"),
  v.literal("archived")
);

const FileKind = v.union(
  v.literal("pdf"),
  v.literal("image"),
  v.literal("audio"),
  v.literal("doc"),
  v.literal("text"),
  v.literal("other")
);

const SourceKind = v.union(
  v.literal("telegram"),
  v.literal("generated"),
  v.literal("manual")
);

const VersionStatus = v.union(
  v.literal("draft"),
  v.literal("current"),
  v.literal("final"),
  v.literal("superseded")
);

function normalizeTags(tags: string[] | undefined) {
  return (tags ?? [])
    .map((tag) => String(tag).trim())
    .filter(Boolean)
    .filter((tag, index, all) => all.findIndex((x) => x.toLowerCase() === tag.toLowerCase()) === index);
}

function searchableText(doc: any, currentVersion: any | null) {
  return [
    doc.title,
    doc.area,
    doc.project,
    doc.collection,
    doc.docType,
    doc.status,
    doc.decisionSummary,
    ...(doc.tags ?? []),
    currentVersion?.fileName,
    currentVersion?.summary,
    currentVersion?.sourceNote,
    currentVersion?.localPath,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export const list = query({
  args: {
    userId: v.id("users"),
    search: v.optional(v.string()),
    area: v.optional(Area),
    status: v.optional(DocumentStatus),
    tag: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100;
    let docs = await ctx.db
      .query("knowledgeDocuments")
      .withIndex("by_user_updated", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit * 3);

    if (args.area) docs = docs.filter((doc) => doc.area === args.area);
    if (args.status) docs = docs.filter((doc) => doc.status === args.status);
    if (args.tag) {
      const tag = args.tag.toLowerCase();
      docs = docs.filter((doc) => doc.tags.some((t) => t.toLowerCase() === tag));
    }

    const withVersions = await Promise.all(
      docs.map(async (doc) => {
        const currentVersion = doc.currentVersionId ? await ctx.db.get(doc.currentVersionId) : null;
        const versions = await ctx.db
          .query("knowledgeDocumentVersions")
          .withIndex("by_document", (q) => q.eq("documentId", doc._id))
          .collect();

        return {
          ...doc,
          currentVersion,
          versionCount: versions.length,
        };
      })
    );

    const search = args.search?.trim().toLowerCase();
    const filtered = search
      ? withVersions.filter((doc) => searchableText(doc, doc.currentVersion).includes(search))
      : withVersions;

    return filtered.slice(0, limit);
  },
});

export const get = query({
  args: {
    documentId: v.id("knowledgeDocuments"),
  },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.documentId);
    if (!doc) return null;

    const currentVersion = doc.currentVersionId ? await ctx.db.get(doc.currentVersionId) : null;
    const versions = await ctx.db
      .query("knowledgeDocumentVersions")
      .withIndex("by_document", (q) => q.eq("documentId", args.documentId))
      .collect();

    versions.sort((a, b) => b.versionNumber - a.versionNumber);

    return {
      ...doc,
      currentVersion,
      versions,
    };
  },
});

export const upsertWithVersion = mutation({
  args: {
    userId: v.id("users"),
    artifactKey: v.string(),
    title: v.string(),
    area: Area,
    project: v.optional(v.string()),
    collection: v.optional(v.string()),
    docType: DocType,
    status: v.optional(DocumentStatus),
    decisionSummary: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    sourceThreadId: v.optional(v.string()),
    sourceMessageIds: v.optional(v.array(v.string())),
    version: v.object({
      label: v.optional(v.string()),
      fileName: v.string(),
      fileKind: FileKind,
      mimeType: v.optional(v.string()),
      storageId: v.optional(v.id("_storage")),
      fileUrl: v.optional(v.string()),
      localPath: v.optional(v.string()),
      telegramFileId: v.optional(v.string()),
      telegramMessageId: v.optional(v.string()),
      sourceKind: SourceKind,
      sourceNote: v.optional(v.string()),
      summary: v.optional(v.string()),
      versionStatus: v.optional(VersionStatus),
    }),
    promote: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const artifactKey = args.artifactKey.trim();
    const promote = args.promote ?? false;

    let doc = await ctx.db
      .query("knowledgeDocuments")
      .withIndex("by_user_artifact", (q) => q.eq("userId", args.userId).eq("artifactKey", artifactKey))
      .first();

    const patch = {
      title: args.title.trim(),
      area: args.area,
      project: args.project?.trim(),
      collection: args.collection?.trim(),
      docType: args.docType,
      status: promote ? (args.status ?? "current") : (args.status ?? doc?.status ?? "draft"),
      decisionSummary: args.decisionSummary?.trim(),
      tags: normalizeTags(args.tags),
      sourceThreadId: args.sourceThreadId?.trim(),
      sourceMessageIds: args.sourceMessageIds,
      updatedAt: now,
    };

    let documentId;
    if (!doc) {
      documentId = await ctx.db.insert("knowledgeDocuments", {
        userId: args.userId,
        artifactKey,
        createdAt: now,
        ...patch,
      });
      doc = await ctx.db.get(documentId);
    } else {
      documentId = doc._id;
      await ctx.db.patch(documentId, patch);
    }

    const versions = await ctx.db
      .query("knowledgeDocumentVersions")
      .withIndex("by_document", (q) => q.eq("documentId", documentId))
      .collect();

    const versionNumber = versions.reduce((max, version) => Math.max(max, version.versionNumber), 0) + 1;

    if (promote) {
      await Promise.all(
        versions
          .filter((version) => version.versionStatus === "current" || version.versionStatus === "final")
          .map((version) => ctx.db.patch(version._id, { versionStatus: "superseded" as const }))
      );
    }

    const versionId = await ctx.db.insert("knowledgeDocumentVersions", {
      documentId,
      versionNumber,
      label: args.version.label?.trim(),
      fileName: args.version.fileName.trim(),
      fileKind: args.version.fileKind,
      mimeType: args.version.mimeType,
      storageId: args.version.storageId,
      fileUrl: args.version.fileUrl,
      localPath: args.version.localPath,
      telegramFileId: args.version.telegramFileId,
      telegramMessageId: args.version.telegramMessageId,
      sourceKind: args.version.sourceKind,
      sourceNote: args.version.sourceNote?.trim(),
      summary: args.version.summary?.trim(),
      versionStatus: promote ? (args.status === "final" ? "final" : "current") : (args.version.versionStatus ?? "draft"),
      createdAt: now,
    });

    if (promote) {
      await ctx.db.patch(documentId, {
        currentVersionId: versionId,
        status: args.status ?? "current",
        updatedAt: now,
      });
    }

    return { documentId, versionId, versionNumber };
  },
});

export const promoteVersion = mutation({
  args: {
    documentId: v.id("knowledgeDocuments"),
    versionId: v.id("knowledgeDocumentVersions"),
    status: v.optional(DocumentStatus),
    decisionSummary: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const versions = await ctx.db
      .query("knowledgeDocumentVersions")
      .withIndex("by_document", (q) => q.eq("documentId", args.documentId))
      .collect();

    await Promise.all(
      versions.map((version) =>
        ctx.db.patch(version._id, {
          versionStatus: version._id === args.versionId ? (args.status === "final" ? "final" : "current") : "superseded",
        })
      )
    );

    await ctx.db.patch(args.documentId, {
      currentVersionId: args.versionId,
      status: args.status ?? "current",
      decisionSummary: args.decisionSummary?.trim(),
      updatedAt: Date.now(),
    });
  },
});

export const updateDocument = mutation({
  args: {
    documentId: v.id("knowledgeDocuments"),
    title: v.optional(v.string()),
    status: v.optional(DocumentStatus),
    decisionSummary: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    area: v.optional(Area),
    project: v.optional(v.string()),
    collection: v.optional(v.string()),
    docType: v.optional(DocType),
  },
  handler: async (ctx, args) => {
    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.title !== undefined) patch.title = args.title.trim();
    if (args.status !== undefined) patch.status = args.status;
    if (args.decisionSummary !== undefined) patch.decisionSummary = args.decisionSummary.trim();
    if (args.tags !== undefined) patch.tags = normalizeTags(args.tags);
    if (args.area !== undefined) patch.area = args.area;
    if (args.project !== undefined) patch.project = args.project.trim();
    if (args.collection !== undefined) patch.collection = args.collection.trim();
    if (args.docType !== undefined) patch.docType = args.docType;

    await ctx.db.patch(args.documentId, patch);
  },
});

export const updateVersionFileLink = mutation({
  args: {
    versionId: v.id("knowledgeDocumentVersions"),
    fileUrl: v.optional(v.string()),
    localPath: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.versionId, {
      fileUrl: args.fileUrl?.trim(),
      localPath: args.localPath?.trim(),
    });
  },
});

export const seedEvaluationDayExample = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("knowledgeDocuments")
      .withIndex("by_user_artifact", (q) =>
        q.eq("userId", args.userId).eq("artifactKey", "aspire/agoura/evaluation-day/programs-camps-one-pager")
      )
      .first();

    if (existing) return existing._id;

    const now = Date.now();
    const documentId = await ctx.db.insert("knowledgeDocuments", {
      userId: args.userId,
      artifactKey: "aspire/agoura/evaluation-day/programs-camps-one-pager",
      title: "Agoura Evaluation Day - Programs & Camps One-Pager",
      area: "aspire",
      project: "Agoura / Region 4",
      collection: "Evaluation Day",
      docType: "flyer",
      status: "final",
      decisionSummary:
        "Simplified to a programs schedule format, changed to supplemental programs, added the core/playground/all-stars note row, finalized camps wording, and made the note headers red.",
      tags: ["Evaluation Day", "Agoura", "Region 4", "PDP", "Camps", "Flyer"],
      sourceThreadId: "telegram:8077799244",
      sourceMessageIds: ["22297"],
      createdAt: now,
      updatedAt: now,
    });

    const versionId = await ctx.db.insert("knowledgeDocumentVersions", {
      documentId,
      versionNumber: 1,
      label: "Final",
      fileName: "agoura-programs-camps-one-page.pdf",
      fileKind: "pdf",
      mimeType: "application/pdf",
      fileUrl: "/knowledge/agoura-evaluation-day/programs-camps-one-page.pdf",
      localPath: "/Users/sebastian/.openclaw/workspace/generated/evaluation-day/agoura-programs-camps-one-page.pdf",
      telegramMessageId: "22297",
      sourceKind: "generated",
      sourceNote: "Final PDF sent to Telegram after red note-header revision.",
      summary: "Final one-page programs and camps flyer for the Agoura Evaluation Day booth.",
      versionStatus: "final",
      createdAt: now,
    });

    await ctx.db.patch(documentId, { currentVersionId: versionId });
    return documentId;
  },
});

const RECENT_ASPIRE_DOCUMENTS = [
  {
    artifactKey: "aspire/agoura/evaluation-day/evaluation-sheet-pdf",
    title: "Agoura Evaluation Day - Evaluation Sheet",
    project: "Agoura / Region 4",
    collection: "Evaluation Day",
    docType: "form",
    decisionSummary:
      "Final printable evaluation sheet with Date & Time Slot, evaluator, age group, gender, clear scoring rows, and enlarged readable footer/header text.",
    tags: ["Evaluation Day", "Agoura", "Region 4", "Evaluator", "Printable"],
    fileName: "agoura-evaluation-day-sheet.pdf",
    fileKind: "pdf",
    mimeType: "application/pdf",
    fileUrl: "/knowledge/agoura-evaluation-day/evaluation-sheet.pdf",
    localPath: "/Users/sebastian/.openclaw/workspace/generated/evaluation-day/agoura-evaluation-day-sheet.pdf",
    summary: "Printable Agoura Evaluation Day evaluator scoring sheet.",
  },
  {
    artifactKey: "aspire/agoura/evaluation-day/evaluation-sheet-xlsx",
    title: "Agoura Evaluation Day - Evaluation Sheet Spreadsheet",
    project: "Agoura / Region 4",
    collection: "Evaluation Day",
    docType: "form",
    decisionSummary:
      "Editable spreadsheet version of the final Agoura Evaluation Day sheet, kept separate from the printable PDF so the current document list stays clean.",
    tags: ["Evaluation Day", "Agoura", "Region 4", "Evaluator", "Spreadsheet"],
    fileName: "agoura-evaluation-day-sheet.xlsx",
    fileKind: "doc",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    fileUrl: "/knowledge/agoura-evaluation-day/evaluation-sheet.xlsx",
    localPath: "/Users/sebastian/.openclaw/workspace/generated/evaluation-day/agoura-evaluation-day-sheet.xlsx",
    summary: "Editable spreadsheet version of the Agoura Evaluation Day evaluation sheet.",
  },
  {
    artifactKey: "aspire/agoura/evaluation-day/evaluator-one-page-guide",
    title: "Agoura Evaluation Day - Evaluator One-Page Guide",
    project: "Agoura / Region 4",
    collection: "Evaluation Day",
    docType: "note",
    decisionSummary:
      "Final one-page evaluator guide with larger text, larger Agoura logos, and date & time slot instructions.",
    tags: ["Evaluation Day", "Agoura", "Region 4", "Evaluator", "Guide"],
    fileName: "agoura-evaluation-day-evaluator-one-page.pdf",
    fileKind: "pdf",
    mimeType: "application/pdf",
    fileUrl: "/knowledge/agoura-evaluation-day/evaluator-one-page-guide.pdf",
    localPath: "/Users/sebastian/.openclaw/workspace/generated/evaluation-day/agoura-evaluation-day-evaluator-one-page.pdf",
    summary: "One-page guide for evaluators working Agoura Evaluation Day.",
  },
  {
    artifactKey: "aspire/agoura/evaluation-day/meeting-agenda",
    title: "Agoura Evaluation Day - Meeting Agenda",
    project: "Agoura / Region 4",
    collection: "Evaluation Day",
    docType: "schedule",
    decisionSummary: "Final meeting agenda packet for organizing Agoura Evaluation Day action items and staff flow.",
    tags: ["Evaluation Day", "Agoura", "Region 4", "Agenda", "Planning"],
    fileName: "agoura-evaluation-day-meeting-agenda.pdf",
    fileKind: "pdf",
    mimeType: "application/pdf",
    fileUrl: "/knowledge/agoura-evaluation-day/meeting-agenda.pdf",
    localPath: "/Users/sebastian/.openclaw/workspace/generated/evaluation-day/agoura-evaluation-day-meeting-agenda.pdf",
    summary: "Meeting agenda and planning packet for Agoura Evaluation Day.",
  },
  {
    artifactKey: "aspire/agoura/skills-medal/stations-todays-skills",
    title: "Agoura Skills Medal - Stations Today's Skills",
    project: "Agoura / Region 4",
    collection: "Skills Medal Challenge",
    docType: "schedule",
    decisionSummary:
      "Final Agoura station skills chart using the approved 6U, 7U/8U, and 10U/12U station layout, Pali-style icons, and corrected Cruyff/Step Over station order.",
    tags: ["Skills Medal", "Agoura", "Region 4", "Stations", "Spring League"],
    fileName: "agoura-stations-todays-skills.pdf",
    fileKind: "pdf",
    mimeType: "application/pdf",
    fileUrl: "/knowledge/agoura-skills-medal/stations-todays-skills.pdf",
    localPath: "/Users/sebastian/.openclaw/workspace/output/agoura-stations-todays-skills.pdf",
    summary: "Printable Agoura Skills Medal station chart.",
  },
  {
    artifactKey: "aspire/agoura/skills-medal/staff-assignments",
    title: "Agoura Skills Medal - Staff Assignments",
    project: "Agoura / Region 4",
    collection: "Skills Medal Challenge",
    docType: "schedule",
    decisionSummary:
      "Printable staff assignment sheet for the Agoura Skills Medal Challenge, with station leads and support roles organized by area.",
    tags: ["Skills Medal", "Agoura", "Region 4", "Staffing", "Spring League"],
    fileName: "agoura-staff-assignments.pdf",
    fileKind: "pdf",
    mimeType: "application/pdf",
    fileUrl: "/knowledge/agoura-skills-medal/staff-assignments.pdf",
    localPath: "/Users/sebastian/.openclaw/workspace/output/agoura-staff-assignments.pdf",
    summary: "Printable staffing sheet for the Agoura Skills Medal Challenge.",
  },
  {
    artifactKey: "aspire/agoura/skills-medal/challenge-graphic",
    title: "Skills Medal Challenge - Final Graphic",
    project: "Agoura / Region 4",
    collection: "Skills Medal Challenge",
    docType: "image",
    decisionSummary:
      "Final short-notes Skills Medal Challenge graphic: core stations 1-6, advanced stations 7-10, 7U/8U rows 9-10 dashed, and Level 2 deferred to next year.",
    tags: ["Skills Medal", "Agoura", "Region 4", "Graphic", "Spring League"],
    fileName: "skills-medal-final-short-notes.png",
    fileKind: "image",
    mimeType: "image/png",
    fileUrl: "/knowledge/agoura-skills-medal/skills-medal-challenge.png",
    localPath: "/Users/sebastian/.openclaw/workspace/output/skills-medal-final-short-notes.png",
    summary: "Final Skills Medal Challenge graphic with shortened bottom notes.",
  },
] as const;

export const seedRecentAspireDocuments = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const documentIds = [];

    for (const item of RECENT_ASPIRE_DOCUMENTS) {
      const existing = await ctx.db
        .query("knowledgeDocuments")
        .withIndex("by_user_artifact", (q) => q.eq("userId", args.userId).eq("artifactKey", item.artifactKey))
        .first();

      if (existing) {
        documentIds.push(existing._id);
        continue;
      }

      const documentId = await ctx.db.insert("knowledgeDocuments", {
        userId: args.userId,
        artifactKey: item.artifactKey,
        title: item.title,
        area: "aspire",
        project: item.project,
        collection: item.collection,
        docType: item.docType,
        status: "final",
        decisionSummary: item.decisionSummary,
        tags: [...item.tags],
        sourceThreadId: "telegram:8077799244",
        sourceMessageIds: [],
        createdAt: now,
        updatedAt: now,
      });

      const versionId = await ctx.db.insert("knowledgeDocumentVersions", {
        documentId,
        versionNumber: 1,
        label: "Final",
        fileName: item.fileName,
        fileKind: item.fileKind,
        mimeType: item.mimeType,
        fileUrl: item.fileUrl,
        localPath: item.localPath,
        sourceKind: "generated",
        sourceNote: "Backfilled into Knowledge & Files from recent Agoura work.",
        summary: item.summary,
        versionStatus: "final",
        createdAt: now,
      });

      await ctx.db.patch(documentId, { currentVersionId: versionId });
      documentIds.push(documentId);
    }

    return { insertedOrExisting: documentIds.length, documentIds };
  },
});
