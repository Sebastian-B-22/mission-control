/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as activitiesAdmin from "../activitiesAdmin.js";
import type * as admin from "../admin.js";
import type * as agentHuddle from "../agentHuddle.js";
import type * as agentTrigger from "../agentTrigger.js";
import type * as approvalsQueue from "../approvalsQueue.js";
import type * as books from "../books.js";
import type * as calendarEvents from "../calendarEvents.js";
import type * as camp from "../camp.js";
import type * as checkIns from "../checkIns.js";
import type * as cleanupDuplicates from "../cleanupDuplicates.js";
import type * as contacts from "../contacts.js";
import type * as contentPipeline from "../contentPipeline.js";
import type * as contentVerification from "../contentVerification.js";
import type * as costTracker from "../costTracker.js";
import type * as cronJobs from "../cronJobs.js";
import type * as daily from "../daily.js";
import type * as dailyRecap from "../dailyRecap.js";
import type * as emailDrafts from "../emailDrafts.js";
import type * as engagementHabits from "../engagementHabits.js";
import type * as families from "../families.js";
import type * as familyMeeting from "../familyMeeting.js";
import type * as fieldTrips from "../fieldTrips.js";
import type * as games from "../games.js";
import type * as habitTemplates from "../habitTemplates.js";
import type * as habits from "../habits.js";
import type * as health from "../health.js";
import type * as homeschool from "../homeschool.js";
import type * as homeschoolActivities from "../homeschoolActivities.js";
import type * as homeschoolProgress from "../homeschoolProgress.js";
import type * as http from "../http.js";
import type * as jotformSync from "../jotformSync.js";
import type * as mavenFeedback from "../mavenFeedback.js";
import type * as memorySnapshots from "../memorySnapshots.js";
import type * as onboarding from "../onboarding.js";
import type * as overnightInbox from "../overnightInbox.js";
import type * as pendingItems from "../pendingItems.js";
import type * as projectTasks from "../projectTasks.js";
import type * as push from "../push.js";
import type * as pushActions from "../pushActions.js";
import type * as recapImport from "../recapImport.js";
import type * as registrations from "../registrations.js";
import type * as rpm from "../rpm.js";
import type * as scheduleReset from "../scheduleReset.js";
import type * as sebastianTasks from "../sebastianTasks.js";
import type * as seedSebastianTasks from "../seedSebastianTasks.js";
import type * as teamMembers from "../teamMembers.js";
import type * as telegramOutbox from "../telegramOutbox.js";
import type * as updateRPMGoals from "../updateRPMGoals.js";
import type * as users from "../users.js";
import type * as weeklyGoals from "../weeklyGoals.js";
import type * as weeklySchedule from "../weeklySchedule.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  activitiesAdmin: typeof activitiesAdmin;
  admin: typeof admin;
  agentHuddle: typeof agentHuddle;
  agentTrigger: typeof agentTrigger;
  approvalsQueue: typeof approvalsQueue;
  books: typeof books;
  calendarEvents: typeof calendarEvents;
  camp: typeof camp;
  checkIns: typeof checkIns;
  cleanupDuplicates: typeof cleanupDuplicates;
  contacts: typeof contacts;
  contentPipeline: typeof contentPipeline;
  contentVerification: typeof contentVerification;
  costTracker: typeof costTracker;
  cronJobs: typeof cronJobs;
  daily: typeof daily;
  dailyRecap: typeof dailyRecap;
  emailDrafts: typeof emailDrafts;
  engagementHabits: typeof engagementHabits;
  families: typeof families;
  familyMeeting: typeof familyMeeting;
  fieldTrips: typeof fieldTrips;
  games: typeof games;
  habitTemplates: typeof habitTemplates;
  habits: typeof habits;
  health: typeof health;
  homeschool: typeof homeschool;
  homeschoolActivities: typeof homeschoolActivities;
  homeschoolProgress: typeof homeschoolProgress;
  http: typeof http;
  jotformSync: typeof jotformSync;
  mavenFeedback: typeof mavenFeedback;
  memorySnapshots: typeof memorySnapshots;
  onboarding: typeof onboarding;
  overnightInbox: typeof overnightInbox;
  pendingItems: typeof pendingItems;
  projectTasks: typeof projectTasks;
  push: typeof push;
  pushActions: typeof pushActions;
  recapImport: typeof recapImport;
  registrations: typeof registrations;
  rpm: typeof rpm;
  scheduleReset: typeof scheduleReset;
  sebastianTasks: typeof sebastianTasks;
  seedSebastianTasks: typeof seedSebastianTasks;
  teamMembers: typeof teamMembers;
  telegramOutbox: typeof telegramOutbox;
  updateRPMGoals: typeof updateRPMGoals;
  users: typeof users;
  weeklyGoals: typeof weeklyGoals;
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
