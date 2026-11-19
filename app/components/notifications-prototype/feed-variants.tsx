// PROTOTYPE — throwaway. Three structurally different Notification Feeds,
// mounted in the real sidebar. Switched via ?variant=A|B|C.
//   A: bell in the sidebar header → compact popover
//   B: nav item → right-hand slide-over drawer of rich cards with actions
//   C: always-visible sidebar section → "View all" two-pane modal by Category
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import {
  Bell,
  BookOpen,
  Check,
  CheckCheck,
  GraduationCap,
  Lock,
  Receipt,
  Settings,
  Shield,
  UsersRound,
  X,
} from "lucide-react";
import { cn } from "~/lib/utils";
import { UserRole } from "~/db/schema";
import { UserAvatar } from "~/components/user-avatar";
import {
  categoriesFor,
  categoryName,
  isToday,
  notificationsFor,
  timeAgo,
  type CategoryKey,
  type MockNotification,
} from "./data";
import {
  isRead,
  markAllRead,
  markRead,
  markUnread,
  useProtoStore,
} from "./store";

export const FEED_VARIANTS = [
  { key: "A", name: "Bell popover + grid" },
  { key: "B", name: "Drawer of cards + category cards" },
  { key: "C", name: "Sidebar section + per-channel lists" },
];

const ICONS: Record<CategoryKey, React.ComponentType<{ className?: string }>> =
  {
    account: Receipt,
    learning: BookOpen,
    teaching: GraduationCap,
    teamLicence: UsersRound,
    platformAdmin: Shield,
  };

const TAG_COLOURS: Record<CategoryKey, string> = {
  account: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  learning: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300",
  teaching:
    "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300",
  teamLicence:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  platformAdmin: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300",
};

const CTA: Record<CategoryKey, string> = {
  account: "View details",
  learning: "Open",
  teaching: "Open",
  teamLicence: "View team",
  platformAdmin: "Review",
};

function useFeed(role: UserRole | null, isTeamAdmin: boolean) {
  const store = useProtoStore();
  const categories = useMemo(
    () => categoriesFor(role, isTeamAdmin),
    [role, isTeamAdmin]
  );
  const items = useMemo(() => notificationsFor(categories), [categories]).map(
    (n) => ({ ...n, read: isRead(store, n.id, n.read) })
  );
  const unread = items.filter((n) => !n.read);
  return { categories, items, unread };
}

function useSettingsHref() {
  const [params] = useSearchParams();
  const v = params.get("variant");
  return `/settings${v ? `?variant=${v}` : ""}#notifications`;
}

function useOpenNotification(onDone?: () => void) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  return (n: MockNotification) => {
    markRead(n.id);
    onDone?.();
    const v = params.get("variant");
    navigate(`${n.href}${v ? `?variant=${v}` : ""}`);
  };
}

function CountBadge({ count, className }: { count: number; className?: string }) {
  if (count === 0) return null;
  return (
    <span
      className={cn(
        "flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold leading-none text-white",
        className
      )}
    >
      {count > 9 ? "9+" : count}
    </span>
  );
}

interface FeedProps {
  role: UserRole | null;
  isTeamAdmin: boolean;
}

// ---------------------------------------------------------------- Variant A
// Bell in the sidebar header with a red count; opens a compact popover next
// to the sidebar. Rows are dense, grouped Today / Earlier, All | Unread tabs.

export function FeedA_HeaderBell({ role, isTeamAdmin }: FeedProps) {
  const { items, unread } = useFeed(role, isTeamAdmin);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"all" | "unread">("all");
  const ref = useRef<HTMLDivElement>(null);
  const settingsHref = useSettingsHref();
  const openN = useOpenNotification(() => setOpen(false));

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const shown = tab === "all" ? items : unread;
  const today = shown.filter(isToday);
  const earlier = shown.filter((n) => !isToday(n));

  return (
    <div ref={ref} className="relative ml-auto">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-md p-1.5 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        aria-label={`Notifications, ${unread.length} unread`}
      >
        <Bell className="size-5" />
        <CountBadge count={unread.length} className="absolute -right-0.5 -top-0.5" />
      </button>

      {open && (
        <div className="fixed left-[13.5rem] top-2 z-50 flex max-h-[80vh] w-96 flex-col overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-xl">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h2 className="font-semibold">Notifications</h2>
            <div className="flex items-center gap-1">
              <button
                onClick={() => markAllRead(unread.map((n) => n.id))}
                disabled={unread.length === 0}
                className="flex items-center gap-1 rounded px-2 py-1 text-xs text-muted-foreground hover:bg-muted disabled:opacity-40"
              >
                <CheckCheck className="size-3.5" /> Mark all read
              </button>
              <Link
                to={settingsHref}
                onClick={() => setOpen(false)}
                title="Notification settings"
                className="rounded p-1 text-muted-foreground hover:bg-muted"
              >
                <Settings className="size-4" />
              </Link>
            </div>
          </div>
          <div className="flex gap-4 border-b px-4 text-sm">
            {(["all", "unread"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "-mb-px border-b-2 py-2 capitalize",
                  tab === t
                    ? "border-primary font-medium"
                    : "border-transparent text-muted-foreground"
                )}
              >
                {t}
                {t === "unread" && unread.length > 0 && ` (${unread.length})`}
              </button>
            ))}
          </div>
          <div className="overflow-y-auto">
            {shown.length === 0 && (
              <p className="p-8 text-center text-sm text-muted-foreground">
                You're all caught up.
              </p>
            )}
            {[
              ["Today", today],
              ["Earlier", earlier],
            ].map(([label, group]) =>
              (group as MockNotification[]).length === 0 ? null : (
                <div key={label as string}>
                  <div className="bg-muted/50 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {label as string}
                  </div>
                  {(group as MockNotification[]).map((n) => {
                    const Icon = ICONS[n.category];
                    return (
                      <div
                        key={n.id}
                        className="group flex cursor-pointer gap-3 border-b px-4 py-3 last:border-b-0 hover:bg-muted/60"
                        onClick={() => openN(n)}
                      >
                        <div className="mt-0.5 flex w-3 justify-center">
                          {!n.read && (
                            <span className="mt-1.5 size-2 rounded-full bg-blue-600" />
                          )}
                        </div>
                        <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                        <div className="min-w-0 flex-1">
                          <p
                            className={cn(
                              "text-sm",
                              !n.read ? "font-semibold" : "text-muted-foreground"
                            )}
                          >
                            {n.title}
                          </p>
                          {n.body && (
                            <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                              {n.body}
                            </p>
                          )}
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <span className="text-xs text-muted-foreground">
                            {timeAgo(n.minutesAgo)}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              n.read ? markUnread(n.id) : markRead(n.id);
                            }}
                            title={n.read ? "Mark unread" : "Mark read"}
                            className="invisible rounded p-0.5 text-muted-foreground hover:bg-muted group-hover:visible"
                          >
                            <Check className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- Variant B
// A "Notifications" nav item (first in the list) with a count pill; opens a
// full-height drawer from the right. Rich cards: Category tag, actor avatar,
// full body, a call-to-action button, Required lock. Filter chips by Category.

export function FeedB_NavDrawer({ role, isTeamAdmin }: FeedProps) {
  const { categories, items, unread } = useFeed(role, isTeamAdmin);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<CategoryKey | "all">("all");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const settingsHref = useSettingsHref();
  const openN = useOpenNotification(() => setOpen(false));

  useEffect(() => {
    if (!open) return;
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [open]);

  const shown = items.filter(
    (n) =>
      (filter === "all" || n.category === filter) && (!unreadOnly || !n.read)
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
          open
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        )}
      >
        <Bell className="size-4" />
        Notifications
        {unread.length > 0 && (
          <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
            {unread.length}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setOpen(false)}
          />
          <div className="relative flex h-full w-[30rem] flex-col border-l bg-background shadow-2xl">
            <div className="flex items-center justify-between px-5 pt-5">
              <div>
                <h2 className="text-xl font-bold">Notifications</h2>
                <p className="text-sm text-muted-foreground">
                  {unread.length === 0
                    ? "You're all caught up."
                    : `${unread.length} unread`}
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-md p-1.5 hover:bg-muted"
                aria-label="Close"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 border-b px-5 py-3">
              {[{ key: "all" as const, name: "All" }, ...categories].map((c) => (
                <button
                  key={c.key}
                  onClick={() => setFilter(c.key)}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-xs",
                    filter === c.key
                      ? "border-primary bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  )}
                >
                  {c.name}
                </button>
              ))}
              <label className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={unreadOnly}
                  onChange={(e) => setUnreadOnly(e.target.checked)}
                />
                Unread only
              </label>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto bg-muted/30 p-5">
              {shown.length === 0 && (
                <p className="py-12 text-center text-sm text-muted-foreground">
                  Nothing here.
                </p>
              )}
              {shown.map((n) => {
                const Icon = ICONS[n.category];
                return (
                  <div
                    key={n.id}
                    className={cn(
                      "rounded-lg border bg-card p-4 shadow-sm",
                      !n.read && "border-l-4 border-l-primary"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "rounded px-1.5 py-0.5 text-[11px] font-medium",
                          TAG_COLOURS[n.category]
                        )}
                      >
                        {categoryName(n.category)}
                      </span>
                      {n.category === "account" && (
                        <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground">
                          <Lock className="size-3" /> Required
                        </span>
                      )}
                      {n.digestCount && (
                        <span className="text-[11px] text-muted-foreground">
                          · Digest of {n.digestCount}
                        </span>
                      )}
                      <span className="ml-auto text-xs text-muted-foreground">
                        {timeAgo(n.minutesAgo)} ago
                      </span>
                    </div>
                    <div className="mt-3 flex gap-3">
                      {n.actor ? (
                        <UserAvatar name={n.actor} avatarUrl={null} />
                      ) : (
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
                          <Icon className="size-4 text-muted-foreground" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{n.title}</p>
                        {n.body && (
                          <p className="mt-1 text-sm text-muted-foreground">
                            {n.body}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        onClick={() => openN(n)}
                        className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                      >
                        {CTA[n.category]}
                      </button>
                      <button
                        onClick={() =>
                          n.read ? markUnread(n.id) : markRead(n.id)
                        }
                        className="rounded-md px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted"
                      >
                        {n.read ? "Mark unread" : "Mark read"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between border-t px-5 py-3 text-sm">
              <button
                onClick={() => markAllRead(unread.map((n) => n.id))}
                disabled={unread.length === 0}
                className="text-muted-foreground hover:text-foreground disabled:opacity-40"
              >
                Mark all as read
              </button>
              <Link
                to={settingsHref}
                onClick={() => setOpen(false)}
                className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <Settings className="size-4" /> Notification settings
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------- Variant C
// The Feed is always on screen: a sidebar section above Recent Courses with
// the 3 newest unread one-liners. "View all" opens a wide modal laid out like
// a mail client: Categories with unread counts on the left, a timeline right.

export function FeedC_SidebarSection({ role, isTeamAdmin }: FeedProps) {
  const { categories, items, unread } = useFeed(role, isTeamAdmin);
  const [open, setOpen] = useState(false);
  const [folder, setFolder] = useState<CategoryKey | "all">("all");
  const settingsHref = useSettingsHref();
  const openN = useOpenNotification(() => setOpen(false));

  useEffect(() => {
    if (!open) return;
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [open]);

  const preview = unread.slice(0, 3);
  const shown = items.filter((n) => folder === "all" || n.category === folder);

  return (
    <div className="border-t border-sidebar-border p-3">
      <div className="mb-2 flex items-center px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50">
        Notifications
        {unread.length > 0 && (
          <span className="ml-2 rounded-full bg-blue-600 px-1.5 text-[10px] text-white">
            {unread.length}
          </span>
        )}
      </div>
      <div className="space-y-0.5">
        {preview.length === 0 && (
          <p className="px-3 py-1 text-xs text-sidebar-foreground/50">
            All caught up.
          </p>
        )}
        {preview.map((n) => (
          <button
            key={n.id}
            onClick={() => openN(n)}
            className="flex w-full items-start gap-2 rounded-md px-3 py-1.5 text-left hover:bg-sidebar-accent"
          >
            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-blue-600" />
            <span className="line-clamp-2 text-xs">{n.title}</span>
          </button>
        ))}
        <button
          onClick={() => setOpen(true)}
          className="w-full rounded-md px-3 py-1.5 text-left text-xs font-medium text-primary hover:bg-sidebar-accent"
        >
          View all →
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-8">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <div className="relative flex h-[75vh] w-full max-w-4xl overflow-hidden rounded-xl border bg-background shadow-2xl">
            <div className="flex w-60 shrink-0 flex-col border-r bg-muted/30 p-3">
              <h2 className="px-2 pb-3 text-lg font-bold">Notifications</h2>
              {[{ key: "all" as const, name: "Everything" }, ...categories].map(
                (c) => {
                  const count = unread.filter(
                    (n) => c.key === "all" || n.category === c.key
                  ).length;
                  const Icon = c.key === "all" ? Bell : ICONS[c.key];
                  return (
                    <button
                      key={c.key}
                      onClick={() => setFolder(c.key)}
                      className={cn(
                        "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm",
                        folder === c.key
                          ? "bg-background font-medium shadow-sm"
                          : "text-muted-foreground hover:bg-background/60"
                      )}
                    >
                      <Icon className="size-4" />
                      <span className="flex-1 text-left">{c.name}</span>
                      {count > 0 && (
                        <span className="text-xs font-semibold">{count}</span>
                      )}
                    </button>
                  );
                }
              )}
              <div className="mt-auto">
                <Link
                  to={settingsHref}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-background/60"
                >
                  <Settings className="size-4" /> Notification settings
                </Link>
              </div>
            </div>

            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex items-center justify-between border-b px-6 py-3">
                <span className="text-sm font-medium">
                  {folder === "all" ? "Everything" : categoryName(folder)}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      markAllRead(
                        shown.filter((n) => !n.read).map((n) => n.id)
                      )
                    }
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Mark these read
                  </button>
                  <button
                    onClick={() => setOpen(false)}
                    className="rounded-md p-1 hover:bg-muted"
                    aria-label="Close"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              </div>
              <ol className="relative flex-1 overflow-y-auto px-6 py-4">
                <div className="absolute bottom-4 left-[2.15rem] top-4 w-px bg-border" />
                {shown.map((n) => {
                  const Icon = ICONS[n.category];
                  return (
                    <li key={n.id} className="relative mb-5 flex gap-4">
                      <div
                        className={cn(
                          "z-10 flex size-7 shrink-0 items-center justify-center rounded-full border-2 bg-background",
                          n.read ? "border-border" : "border-blue-600"
                        )}
                      >
                        <Icon
                          className={cn(
                            "size-3.5",
                            n.read ? "text-muted-foreground" : "text-blue-600"
                          )}
                        />
                      </div>
                      <button
                        onClick={() => openN(n)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <div className="flex items-baseline gap-2">
                          <span
                            className={cn(
                              "text-sm",
                              n.read ? "text-muted-foreground" : "font-semibold"
                            )}
                          >
                            {n.title}
                          </span>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {timeAgo(n.minutesAgo)}
                          </span>
                        </div>
                        {n.body && (
                          <p className="mt-0.5 text-sm text-muted-foreground">
                            {n.body}
                          </p>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
