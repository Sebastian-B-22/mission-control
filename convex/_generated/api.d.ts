/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as checkIns from "../checkIns.js";
import type * as daily from "../daily.js";
import type * as fieldTrips from "../fieldTrips.js";
import type * as habitTemplates from "../habitTemplates.js";
import type * as habits from "../habits.js";
import type * as projectTasks from "../projectTasks.js";
import type * as rpm from "../rpm.js";
import type * as teamMembers from "../teamMembers.js";
import type * as users from "../users.js";
import type * as weeklySchedule from "../weeklySchedule.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  checkIns: typeof checkIns;
  daily: typeof daily;
  fieldTrips: typeof fieldTrips;
  habitTemplates: typeof habitTemplates;
  habits: typeof habits;
  projectTasks: typeof projectTasks;
  rpm: typeof rpm;
  teamMembers: typeof teamMembers;
  users: typeof users;
  weeklySchedule: typeof weeklySchedule;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
