import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

function normalizeBookKey(title?: string, author?: string) {
  const normalize = (value?: string) =>
    (value || "")
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();

  return `${normalize(title)}::${normalize(author)}`;
}

async function findLibraryMatch(ctx: any, userId: any, title: string, author?: string) {
  const books = await ctx.db
    .query("bookLibrary")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .collect();

  const exactKey = normalizeBookKey(title, author);
  const titleOnlyKey = normalizeBookKey(title, undefined).split("::")[0];

  return (
    books.find((book: any) => normalizeBookKey(book.title, book.author) === exactKey) ||
    books.find((book: any) => normalizeBookKey(book.title, undefined).split("::")[0] === titleOnlyKey)
  );
}

// Book Library
export const getBookLibrary = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const books = await ctx.db
      .query("bookLibrary")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    // Sort alphabetically by title
    return books.sort((a, b) => a.title.localeCompare(b.title));
  },
});

export const addBookToLibrary = mutation({
  args: {
    userId: v.id("users"),
    title: v.string(),
    author: v.optional(v.string()),
    category: v.optional(v.string()),
    coverUrl: v.optional(v.string()),
    isbn: v.optional(v.string()),
    reader: v.optional(v.string()),
    status: v.optional(v.union(
      v.literal("want-to-read"),
      v.literal("reading"),
      v.literal("finished")
    )),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("bookLibrary", {
      userId: args.userId,
      title: args.title,
      author: args.author,
      category: args.category,
      coverUrl: args.coverUrl,
      isbn: args.isbn,
      reader: args.reader,
      status: args.status || "want-to-read",
      read: args.status === "finished",
      createdAt: Date.now(),
    });
  },
});

export const updateBookCover = mutation({
  args: {
    id: v.id("bookLibrary"),
    coverUrl: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { coverUrl: args.coverUrl });
  },
});

export const updateBookReader = mutation({
  args: {
    id: v.id("bookLibrary"),
    reader: v.union(
      v.literal("anthony"),
      v.literal("roma"),
      v.literal("both"),
      v.literal("family")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { reader: args.reader });
  },
});

export const updateBookStatus = mutation({
  args: {
    id: v.id("bookLibrary"),
    status: v.union(
      v.literal("want-to-read"),
      v.literal("reading"),
      v.literal("finished")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { 
      status: args.status,
      read: args.status === "finished"
    });
  },
});

export const toggleBookRead = mutation({
  args: {
    id: v.id("bookLibrary"),
    read: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { read: args.read });
  },
});

export const deleteBookFromLibrary = mutation({
  args: { id: v.id("bookLibrary") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// Read-Aloud Books (currently reading)
export const getReadAloudBooks = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const books = await ctx.db
      .query("readAloudBooks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const library = await ctx.db
      .query("bookLibrary")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const libraryByKey = new Map(
      library.map((book) => [normalizeBookKey(book.title, book.author), book])
    );

    return books
      .filter(b => !b.status || b.status === "reading")
      .map((b) => {
        const match =
          libraryByKey.get(normalizeBookKey(b.title, b.author)) ||
          library.find((book) => normalizeBookKey(book.title, undefined).split("::")[0] === normalizeBookKey(b.title, undefined).split("::")[0]);

        return match
          ? {
              ...b,
              title: match.title,
              author: match.author,
              coverUrl: b.coverUrl || match.coverUrl,
              libraryBookId: match._id,
            }
          : b;
      })
      .sort((a, b) => a.title.localeCompare(b.title));
  },
});

// Up Next / Books on Deck
export const getUpNextBooks = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const books = await ctx.db
      .query("readAloudBooks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const library = await ctx.db
      .query("bookLibrary")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const libraryByKey = new Map(
      library.map((book) => [normalizeBookKey(book.title, book.author), book])
    );

    return books
      .filter(b => b.status === "up-next")
      .map((b) => {
        const match =
          libraryByKey.get(normalizeBookKey(b.title, b.author)) ||
          library.find((book) => normalizeBookKey(book.title, undefined).split("::")[0] === normalizeBookKey(b.title, undefined).split("::")[0]);

        return match
          ? {
              ...b,
              title: match.title,
              author: match.author,
              coverUrl: b.coverUrl || match.coverUrl,
              libraryBookId: match._id,
            }
          : b;
      })
      .sort((a, b) => a.title.localeCompare(b.title));
  },
});

export const addReadAloudBook = mutation({
  args: {
    userId: v.id("users"),
    title: v.string(),
    author: v.optional(v.string()),
    coverUrl: v.optional(v.string()),
    status: v.optional(v.union(v.literal("reading"), v.literal("up-next"))),
  },
  handler: async (ctx, args) => {
    const libraryMatch = await findLibraryMatch(ctx, args.userId, args.title, args.author);

    if (libraryMatch) {
      await ctx.db.patch(libraryMatch._id, {
        author: libraryMatch.author || args.author,
        coverUrl: libraryMatch.coverUrl || args.coverUrl,
        status: args.status === "reading" ? "reading" : libraryMatch.status,
      });
    } else {
      await ctx.db.insert("bookLibrary", {
        userId: args.userId,
        title: args.title,
        author: args.author,
        coverUrl: args.coverUrl,
        status: args.status === "reading" ? "reading" : "want-to-read",
        read: false,
        createdAt: Date.now(),
      });
    }

    return await ctx.db.insert("readAloudBooks", {
      userId: args.userId,
      title: libraryMatch?.title || args.title,
      author: libraryMatch?.author || args.author,
      coverUrl: libraryMatch?.coverUrl || args.coverUrl,
      completed: false,
      status: args.status || "reading",
      createdAt: Date.now(),
    });
  },
});

export const updateReadAloudCover = mutation({
  args: {
    id: v.id("readAloudBooks"),
    coverUrl: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { coverUrl: args.coverUrl });
  },
});

export const updateReadAloudTitleUnsafe = mutation({
  args: {
    id: v.id("readAloudBooks"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { title: args.title });
  },
});

export const updateReadAloudBookUnsafe = mutation({
  args: {
    id: v.id("readAloudBooks"),
    title: v.optional(v.string()),
    author: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const patch: { title?: string; author?: string } = {};
    if (args.title !== undefined) patch.title = args.title;
    if (args.author !== undefined) patch.author = args.author;
    await ctx.db.patch(args.id, patch);
  },
});

// Move book from up-next to currently reading
export const moveToReading = mutation({
  args: { id: v.id("readAloudBooks") },
  handler: async (ctx, args) => {
    const readAloud = await ctx.db.get(args.id);
    if (!readAloud) return;

    await ctx.db.patch(args.id, { status: "reading" });

    const libraryMatch = await findLibraryMatch(ctx, readAloud.userId, readAloud.title, readAloud.author);
    if (libraryMatch) {
      await ctx.db.patch(libraryMatch._id, { status: "reading" });
    }
  },
});

// Move book to up-next
export const moveToUpNext = mutation({
  args: { id: v.id("readAloudBooks") },
  handler: async (ctx, args) => {
    const readAloud = await ctx.db.get(args.id);
    if (!readAloud) return;

    await ctx.db.patch(args.id, { status: "up-next" });

    const libraryMatch = await findLibraryMatch(ctx, readAloud.userId, readAloud.title, readAloud.author);
    if (libraryMatch && libraryMatch.status === "reading") {
      await ctx.db.patch(libraryMatch._id, { status: "want-to-read" });
    }
  },
});

export const toggleReadAloudCompleted = mutation({
  args: {
    id: v.id("readAloudBooks"),
    completed: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { completed: args.completed });
  },
});

export const deleteReadAloudBook = mutation({
  args: { id: v.id("readAloudBooks") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
