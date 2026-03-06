#!/usr/bin/env node
import { spawnSync } from "child_process";

// IDs of duplicate books WITHOUT covers (keeping the ones WITH covers)
const dupeIds = [
  "j577qxwy4mesmxg6kvsraz9gfh82dz7r", // How to Be a Person (no cover)
  "j5776b50q0y7jy6kjtmfte78en82c73d", // Little Britches (no cover)  
  "j572vvrkqxat4hksw41nftkty582d28q", // Primitive Technology (no cover)
];

console.log(`Deleting ${dupeIds.length} duplicate books...`);

for (const id of dupeIds) {
  const result = spawnSync("npx", ["convex", "run", "books:deleteBookFromLibrary", JSON.stringify({ bookId: id })], {
    cwd: new URL("..", import.meta.url).pathname,
    encoding: "utf8",
    timeout: 30000,
  });
  console.log(result.status === 0 ? `✓ Deleted ${id}` : `✗ Failed ${id}`);
}
