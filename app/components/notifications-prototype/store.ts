// PROTOTYPE — throwaway. In-memory state shared by the Feed (sidebar) and the
// Settings page, so marking read / toggling a preference survives navigation
// but is wiped on reload.

import { useSyncExternalStore } from "react";
import { defaultPrefs, type CategoryKey, type Prefs } from "./data";

interface State {
  readIds: number[];
  unreadIds: number[]; // items the user marked unread again
  prefs: Prefs;
}

let state: State = { readIds: [], unreadIds: [], prefs: defaultPrefs() };
const listeners = new Set<() => void>();

function set(next: State) {
  state = next;
  listeners.forEach((l) => l());
}

export function useProtoStore() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
    () => state
  );
}

export function isRead(s: State, id: number, initiallyRead: boolean) {
  if (s.unreadIds.includes(id)) return false;
  return initiallyRead || s.readIds.includes(id);
}

export function markRead(id: number) {
  set({
    ...state,
    readIds: [...state.readIds, id],
    unreadIds: state.unreadIds.filter((x) => x !== id),
  });
}

export function markUnread(id: number) {
  set({
    ...state,
    readIds: state.readIds.filter((x) => x !== id),
    unreadIds: [...state.unreadIds, id],
  });
}

export function markAllRead(ids: number[]) {
  set({ ...state, readIds: [...state.readIds, ...ids], unreadIds: [] });
}

export function togglePref(key: CategoryKey, channel: "feed" | "email") {
  set({
    ...state,
    prefs: {
      ...state.prefs,
      [key]: { ...state.prefs[key], [channel]: !state.prefs[key][channel] },
    },
  });
}
