// PROTOTYPE — throwaway. Answers "How should the Notification Feed and its
// settings look?" (wayfinder ticket #11). Mock data only; nothing persists.

import { UserRole } from "~/db/schema";

export type CategoryKey =
  | "account"
  | "learning"
  | "teaching"
  | "teamLicence"
  | "platformAdmin";

export interface Category {
  key: CategoryKey;
  name: string;
  description: string;
  locked: boolean;
  defaults: { feed: boolean; email: boolean };
  emailNote?: string;
}

export const CATEGORIES: Category[] = [
  {
    key: "account",
    name: "Account & Enrollment",
    description: "Refund Requests, refunds, and Enrollments from a claimed Seat.",
    locked: true,
    defaults: { feed: true, email: true },
  },
  {
    key: "learning",
    name: "Learning",
    description: "Replies to your comments and new lessons on your courses.",
    locked: false,
    defaults: { feed: true, email: true },
  },
  {
    key: "teaching",
    name: "Teaching",
    description: "Comments, questions, ratings and Enrollments on your courses.",
    locked: false,
    defaults: { feed: true, email: true },
    emailNote: "Only new comments and questions are emailed.",
  },
  {
    key: "teamLicence",
    name: "Team Licence",
    description: "Seats claimed on your Team Licence.",
    locked: false,
    defaults: { feed: true, email: false },
  },
  {
    key: "platformAdmin",
    name: "Platform Admin",
    description: "Refund Requests waiting for a decision and failed refunds.",
    locked: false,
    defaults: { feed: true, email: true },
  },
];

export const LOCKED_COPY =
  "These concern your money or your Enrollments, so they can't be turned off.";

// Assumption: everyone can enrol, so everyone sees Account & Enrollment + Learning.
export function categoriesFor(role: UserRole | null, isTeamAdmin: boolean) {
  return CATEGORIES.filter((c) => {
    if (c.key === "account" || c.key === "learning") return true;
    if (c.key === "teaching") return role === UserRole.Instructor;
    if (c.key === "teamLicence") return isTeamAdmin;
    if (c.key === "platformAdmin") return role === UserRole.Admin;
    return false;
  });
}

export interface MockNotification {
  id: number;
  category: CategoryKey;
  title: string;
  body?: string;
  actor?: string;
  minutesAgo: number;
  href: string;
  read: boolean;
  digestCount?: number;
}

const ALL: MockNotification[] = [
  {
    id: 1,
    category: "account",
    title: "Your refund request was approved",
    body: "Intro to TypeScript · €49.00 will be back on your card in 5–10 days.",
    minutesAgo: 12,
    href: "/settings",
    read: false,
  },
  {
    id: 2,
    category: "learning",
    title: "Dana Lee replied to your comment",
    body: "“Good question — the generic is inferred from the first argument…”",
    actor: "Dana Lee",
    minutesAgo: 45,
    href: "/courses",
    read: false,
  },
  {
    id: 3,
    category: "learning",
    title: "3 new lessons in Advanced React Patterns",
    body: "Compound components, Render props, State reducers",
    minutesAgo: 60 * 3,
    href: "/courses",
    read: false,
    digestCount: 3,
  },
  {
    id: 4,
    category: "teaching",
    title: "New question on “Generics in depth”",
    body: "“Why does this overload resolve to the second signature?”",
    actor: "Sam Patel",
    minutesAgo: 20,
    href: "/instructor/questions",
    read: false,
  },
  {
    id: 5,
    category: "teaching",
    title: "7 new Enrollments on Intro to TypeScript",
    minutesAgo: 60 * 9,
    href: "/instructor",
    read: false,
    digestCount: 7,
  },
  {
    id: 6,
    category: "teaching",
    title: "2 new ratings on Intro to TypeScript",
    body: "Average ★ 4.5",
    minutesAgo: 60 * 26,
    href: "/instructor/analytics",
    read: true,
    digestCount: 2,
  },
  {
    id: 7,
    category: "teamLicence",
    title: "4 Seats claimed on Acme Engineering",
    body: "12 of 20 Seats now claimed.",
    minutesAgo: 60 * 8,
    href: "/team",
    read: false,
    digestCount: 4,
  },
  {
    id: 8,
    category: "teamLicence",
    title: "All Seats claimed on Design Team",
    minutesAgo: 60 * 50,
    href: "/team",
    read: true,
  },
  {
    id: 9,
    category: "platformAdmin",
    title: "Refund Request waiting for a decision",
    body: "Alex Kim · Intro to TypeScript · €49.00",
    actor: "Alex Kim",
    minutesAgo: 5,
    href: "/admin/refunds",
    read: false,
  },
  {
    id: 10,
    category: "platformAdmin",
    title: "Refund failed",
    body: "Jo Brown · Advanced React Patterns · card expired",
    minutesAgo: 60 * 30,
    href: "/admin/refunds",
    read: true,
  },
  {
    id: 11,
    category: "account",
    title: "You're enrolled in Advanced React Patterns",
    body: "Seat claimed on Acme Engineering's Team Licence.",
    minutesAgo: 60 * 72,
    href: "/courses",
    read: true,
  },
  {
    id: 12,
    category: "learning",
    title: "Priya Shah replied to your comment",
    body: "“Yes, that also works with useReducer.”",
    actor: "Priya Shah",
    minutesAgo: 60 * 80,
    href: "/courses",
    read: true,
  },
];

export function notificationsFor(categories: Category[]) {
  const keys = new Set(categories.map((c) => c.key));
  return ALL.filter((n) => keys.has(n.category)).map((n) => ({ ...n }));
}

export function categoryName(key: CategoryKey) {
  return CATEGORIES.find((c) => c.key === key)!.name;
}

export function timeAgo(minutes: number) {
  if (minutes < 60) return `${minutes}m`;
  if (minutes < 60 * 24) return `${Math.round(minutes / 60)}h`;
  return `${Math.round(minutes / 60 / 24)}d`;
}

export function isToday(n: MockNotification) {
  return n.minutesAgo < 60 * 24;
}

export type Prefs = Record<CategoryKey, { feed: boolean; email: boolean }>;

export function defaultPrefs(): Prefs {
  return Object.fromEntries(
    CATEGORIES.map((c) => [c.key, { ...c.defaults }])
  ) as Prefs;
}
