import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const repoFiles = execFileSync("git", ["ls-files"], { encoding: "utf8" })
  .trim()
  .split("\n")
  .filter(Boolean);

const scriptFiles = repoFiles.filter((file) => {
  if (file === "scripts/convex-target.mjs") return false;
  if (file === "package.json") return true;
  return (
    (file.endsWith(".mjs") || file.endsWith(".js") || file.endsWith(".ts")) &&
    (file.startsWith("scripts/") || !file.includes("/"))
  );
});

describe("Mission Control scripts declare Convex target explicitly", () => {
  it("does not hardcode Convex deployment URLs outside the target helper", () => {
    const offenders = [];
    for (const file of scriptFiles) {
      const content = readFileSync(file, "utf8");
      if (/https:\/\/[a-z-]+-[0-9]+\.convex\.(cloud|site)/.test(content)) {
        offenders.push(file);
      }
    }

    assert.deepEqual(offenders, []);
  });

  it("does not use ambiguous NEXT_PUBLIC_CONVEX_URL or CONVEX_URL fallbacks in scripts", () => {
    const offenders = [];
    for (const file of scriptFiles) {
      const content = readFileSync(file, "utf8");
      if (/process\.env\.(NEXT_PUBLIC_CONVEX_URL|CONVEX_URL)/.test(content)) {
        offenders.push(file);
      }
    }

    assert.deepEqual(offenders, []);
  });

  it("does not expose an ambiguous Convex deploy npm script", () => {
    const pkg = JSON.parse(readFileSync("package.json", "utf8"));
    const offenders = Object.entries(pkg.scripts || {})
      .filter(([, command]) => /convex\s+deploy/.test(command))
      .filter(([, command]) => !/convex-target\.mjs assert prod/.test(command));

    assert.deepEqual(offenders, []);
  });
});
