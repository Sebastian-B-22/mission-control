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
import type * as books from "../books.js";
import type * as camp from "../camp.js";
import type * as checkIns from "../checkIns.js";
import type * as contacts from "../contacts.js";
import type * as contentPipeline from "../contentPipeline.js";
import type * as contentVerification from "../contentVerification.js";
import type * as daily from "../daily.js";
import type * as engagementHabits from "../engagementHabits.js";
import type * as families from "../families.js";
import type * as familyMeeting from "../familyMeeting.js";
import type * as fieldTrips from "../fieldTrips.js";
import type * as habitTemplates from "../habitTemplates.js";
import type * as habits from "../habits.js";
import type * as health from "../health.js";
import type * as homeschool from "../homeschool.js";
import type * as http from "../http.js";
import type * as jotformSync from "../jotformSync.js";
import type * as mavenFeedback from "../mavenFeedback.js";
import type * as projectTasks from "../projectTasks.js";
import type * as registrations from "../registrations.js";
import type * as rpm from "../rpm.js";
import type * as sebastianTasks from "../sebastianTasks.js";
import type * as seedSebastianTasks from "../seedSebastianTasks.js";
import type * as teamMembers from "../teamMembers.js";
import type * as updateRPMGoals from "../updateRPMGoals.js";
import type * as users from "../users.js";
import type * as weeklySchedule from "../weeklySchedule.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  books: typeof books;
  camp: typeof camp;
  checkIns: typeof checkIns;
  contacts: typeof contacts;
  contentPipeline: typeof contentPipeline;
  contentVerification: typeof contentVerification;
  daily: typeof daily;
  engagementHabits: typeof engagementHabits;
  families: typeof families;
  familyMeeting: typeof familyMeeting;
  fieldTrips: typeof fieldTrips;
  habitTemplates: typeof habitTemplates;
  habits: typeof habits;
  health: typeof health;
  homeschool: typeof homeschool;
  http: typeof http;
  jotformSync: typeof jotformSync;
  mavenFeedback: typeof mavenFeedback;
  projectTasks: typeof projectTasks;
  registrations: typeof registrations;
  rpm: typeof rpm;
  sebastianTasks: typeof sebastianTasks;
  seedSebastianTasks: typeof seedSebastianTasks;
  teamMembers: typeof teamMembers;
  updateRPMGoals: typeof updateRPMGoals;
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
