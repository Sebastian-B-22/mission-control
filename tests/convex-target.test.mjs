import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  assertConvexTarget,
  getConvexDeploymentTarget,
  getConvexUrl,
} from "../scripts/convex-target.mjs";

function env(overrides = {}) {
  return { ...overrides };
}

describe("Convex deployment targeting", () => {
  it("fails loudly when no target is declared", () => {
    assert.throws(
      () => getConvexDeploymentTarget(env()),
      /MISSION_CONTROL_CONVEX_TARGET.*prod.*dev/i,
    );
  });

  it("maps Vercel preview builds to dev and production builds to prod", () => {
    assert.equal(getConvexDeploymentTarget(env({ VERCEL_ENV: "preview" })), "dev");
    assert.equal(getConvexDeploymentTarget(env({ VERCEL_ENV: "development" })), "dev");
    assert.equal(getConvexDeploymentTarget(env({ VERCEL_ENV: "production" })), "prod");
  });

  it("returns the production cloud URL only when prod is explicit", () => {
    assert.equal(
      getConvexUrl({ env: env({ MISSION_CONTROL_CONVEX_TARGET: "prod" }), kind: "cloud" }),
      "https://harmless-salamander-44.convex.cloud",
    );
  });

  it("returns the development cloud URL only when dev is explicit", () => {
    assert.equal(
      getConvexUrl({ env: env({ MISSION_CONTROL_CONVEX_TARGET: "dev" }), kind: "cloud" }),
      "https://healthy-flamingo-415.convex.cloud",
    );
  });

  it("rejects ambiguous target aliases", () => {
    assert.throws(
      () => getConvexDeploymentTarget(env({ MISSION_CONTROL_CONVEX_TARGET: "production" })),
      /must be exactly "prod" or "dev"/i,
    );
  });

  it("rejects URL overrides that conflict with the explicit target", () => {
    assert.throws(
      () => getConvexUrl({
        env: env({
          MISSION_CONTROL_CONVEX_TARGET: "dev",
          CONVEX_URL: "https://harmless-salamander-44.convex.cloud",
        }),
        kind: "cloud",
      }),
      /conflicts with explicit Convex target "dev"/i,
    );
  });

  it("can assert the expected target for deployment scripts", () => {
    assert.doesNotThrow(() => assertConvexTarget("prod", env({ MISSION_CONTROL_CONVEX_TARGET: "prod" })));
    assert.throws(
      () => assertConvexTarget("prod", env({ MISSION_CONTROL_CONVEX_TARGET: "dev" })),
      /expected Convex target "prod" but got "dev"/i,
    );
  });
});
