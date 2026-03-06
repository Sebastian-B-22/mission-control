import { ConvexHttpClient } from "convex/browser";

const client = new ConvexHttpClient("https://harmless-salamander-44.convex.cloud");
const userId = "kx77km204g5c9m51b0280eegh1821dne";

// Books to delete - titles from the screenshots with X marks
const titlesToDelete = [
  "alexander hamilton",
  "americas history vol",
  "bear grylls survival guide",
  "holy bible",
  "blades of freedom",
  "blood and guts",
  "osmosis jones",
  "story of the world book 1 (ancient",
  "the disappearing spoon",
  "treaties, trenches",
];

// Get all books
const books = await client.query("books:getBookLibrary", { userId });
console.log(`Total books: ${books.length}`);

// Find matches
const toDelete = [];
for (const book of books) {
  const title = book.title.toLowerCase();
  for (const target of titlesToDelete) {
    if (title.includes(target)) {
      toDelete.push({ id: book._id, title: book.title });
      break;
    }
  }
}

console.log(`\nFound ${toDelete.length} books to delete:`);
toDelete.forEach(b => console.log(`  - ${b.title}`));

// Delete them
for (const book of toDelete) {
  try {
    await client.mutation("books:deleteBookFromLibrary", { bookId: book.id });
    console.log(`Deleted: ${book.title}`);
  } catch (e) {
    console.log(`Failed to delete ${book.title}: ${e.message}`);
  }
}
