#!/usr/bin/env node
import { ConvexHttpClient } from "convex/browser";

export const CONVEX_DEPLOYMENTS = Object.freeze({
  prod: Object.freeze({
    cloudUrl: "https://harmless-salamander-44.convex.cloud",
    siteUrl: "https://harmless-salamander-44.convex.site",
    deployment: "harmless-salamander-44",
  }),
  dev: Object.freeze({
    cloudUrl: "https://healthy-flamingo-415.convex.cloud",
    siteUrl: "https://healthy-flamingo-415.convex.site",
    deployment: "healthy-flamingo-415",
  }),
});

const TARGET_ENV_NAMES = ["MISSION_CONTROL_CONVEX_TARGET", "CONVEX_TARGET"];
const URL_ENV_NAMES = ["CONVEX_URL", "NEXT_PUBLIC_CONVEX_URL"];

export function getConvexDeploymentTarget(env = process.env) {
  const provided = TARGET_ENV_NAMES
    .map((name) => [name, env[name]])
    .filter(([, value]) => value !== undefined && value !== "");

  if (provided.length === 0 && env.VERCEL_ENV) {
    const vercelTarget = env.VERCEL_ENV === "production" ? "prod" : "dev";
    provided.push(["VERCEL_ENV", vercelTarget]);
  }

  if (provided.length === 0) {
    throw new Error(
      'Missing explicit Convex target. Set MISSION_CONTROL_CONVEX_TARGET to exactly "prod" or "dev" before running Mission Control scripts.',
    );
  }

  const unique = new Set(provided.map(([, value]) => String(value).trim()));
  if (unique.size > 1) {
    throw new Error(
      `Conflicting Convex target env vars: ${provided.map(([name, value]) => `${name}=${value}`).join(", ")}. Use one explicit target: "prod" or "dev".`,
    );
  }

  const target = [...unique][0];
  if (target !== "prod" && target !== "dev") {
    throw new Error(
      `Convex target must be exactly "prod" or "dev"; got "${target}". Do not use aliases like production, staging, local, or preview.`,
    );
  }

  return target;
}

export function assertConvexTarget(expectedTarget, env = process.env) {
  if (expectedTarget !== "prod" && expectedTarget !== "dev") {
    throw new Error(`Expected target must be "prod" or "dev"; got "${expectedTarget}".`);
  }
  const actualTarget = getConvexDeploymentTarget(env);
  if (actualTarget !== expectedTarget) {
    throw new Error(`Expected Convex target "${expectedTarget}" but got "${actualTarget}".`);
  }
  return actualTarget;
}

function knownUrlForTarget(target, kind) {
  const deployment = CONVEX_DEPLOYMENTS[target];
  return kind === "site" ? deployment.siteUrl : deployment.cloudUrl;
}

function assertUrlMatchesTarget(url, target) {
  const expected = CONVEX_DEPLOYMENTS[target];
  const allowed = new Set([expected.cloudUrl, expected.siteUrl]);
  if (!allowed.has(url)) {
    throw new Error(
      `Convex URL "${url}" conflicts with explicit Convex target "${target}". Expected ${expected.cloudUrl} or ${expected.siteUrl}.`,
    );
  }
}

export function getConvexUrl({ env = process.env, kind = "cloud" } = {}) {
  if (kind !== "cloud" && kind !== "site") {
    throw new Error(`Convex URL kind must be "cloud" or "site"; got "${kind}".`);
  }

  const target = getConvexDeploymentTarget(env);
  const override = URL_ENV_NAMES.map((name) => env[name]).find((value) => value !== undefined && value !== "");
  if (!override) {
    return knownUrlForTarget(target, kind);
  }

  const url = String(override).trim().replace(/\/$/, "");
  assertUrlMatchesTarget(url, target);
  return url;
}

export function getConvexSiteUrl(env = process.env) {
  return getConvexUrl({ env, kind: "site" });
}

export function getConvexCloudUrl(env = process.env) {
  return getConvexUrl({ env, kind: "cloud" });
}

export function createConvexHttpClient(env = process.env) {
  return new ConvexHttpClient(getConvexCloudUrl(env));
}

function runCli() {
  const [command, arg] = process.argv.slice(2);
  try {
    if (command === "assert") {
      assertConvexTarget(arg);
      console.log(`Convex target OK: ${arg}`);
      return;
    }
    if (command === "url") {
      console.log(getConvexUrl({ kind: arg || "cloud" }));
      return;
    }
    if (command === "target") {
      console.log(getConvexDeploymentTarget());
      return;
    }
    if (command === "deployment") {
      console.log(CONVEX_DEPLOYMENTS[getConvexDeploymentTarget()].deployment);
      return;
    }
    console.error('Usage: node scripts/convex-target.mjs <target|deployment|url [cloud|site]|assert <prod|dev>>');
    process.exit(2);
  } catch (error) {
    console.error(`Convex target error: ${error.message}`);
    process.exit(2);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runCli();
}
