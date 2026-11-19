// PROTOTYPE — throwaway. Three structurally different Notifications sections
// for the Settings page. Switched via ?variant=A|B|C (same key as the Feed).
// Add &novuDown=1 to see the "Novu unreachable" state.
//   A: Category × Channel grid, autosaves per toggle
//   B: one card per Category with pill toggles, explicit Save
//   C: grouped by Channel (Feed list, email list), sentence-style checkboxes
import { useState } from "react";
import { useSearchParams } from "react-router";
import { toast } from "sonner";
import { AlertTriangle, Bell, Lock, Mail } from "lucide-react";
import { cn } from "~/lib/utils";
import { UserRole } from "~/db/schema";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import {
  LOCKED_COPY,
  categoriesFor,
  type Category,
  type CategoryKey,
  type Prefs,
} from "./data";
import { togglePref, useProtoStore } from "./store";

interface Props {
  role: UserRole;
  isTeamAdmin: boolean;
}

function Switch({
  checked,
  disabled,
  onChange,
  label,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange?: () => void;
  label: string;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={onChange}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
        checked ? "bg-primary" : "bg-input",
        disabled && "cursor-not-allowed opacity-50"
      )}
    >
      <span
        className={cn(
          "inline-block size-4 rounded-full bg-background shadow transition-transform",
          checked ? "translate-x-4" : "translate-x-0.5"
        )}
      />
    </button>
  );
}

function NovuDown() {
  return (
    <div className="flex items-start gap-3 rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm">
      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
      <div>
        <p className="font-medium">We couldn't load your notification settings.</p>
        <p className="mt-1 text-muted-foreground">
          Nothing has changed. Try again in a few minutes.
        </p>
      </div>
    </div>
  );
}

function useCommon(role: UserRole, isTeamAdmin: boolean) {
  const [params] = useSearchParams();
  const { prefs } = useProtoStore();
  return {
    categories: categoriesFor(role, isTeamAdmin),
    prefs,
    novuDown: params.get("novuDown") === "1",
  };
}

function autosave(key: CategoryKey, channel: "feed" | "email", c: Category) {
  togglePref(key, channel);
  toast.success(`${c.name} ${channel === "feed" ? "in-app" : "email"} updated`);
}

// ---------------------------------------------------------------- Variant A
export function PrefsA_Grid({ role, isTeamAdmin }: Props) {
  const { categories, prefs, novuDown } = useCommon(role, isTeamAdmin);
  return (
    <Card id="notifications" className="mt-8 max-w-2xl">
      <CardHeader>
        <h2 className="text-lg font-semibold">Notifications</h2>
        <p className="text-sm text-muted-foreground">
          Choose what reaches you, and where. Changes apply to future
          Notifications and save straight away.
        </p>
      </CardHeader>
      <CardContent>
        {novuDown ? (
          <NovuDown />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="pb-2 font-medium">Category</th>
                <th className="w-20 pb-2 text-center font-medium">
                  <Bell className="mx-auto mb-0.5 size-4" />
                  In Cadence
                </th>
                <th className="w-20 pb-2 text-center font-medium">
                  <Mail className="mx-auto mb-0.5 size-4" />
                  Email
                </th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.key} className="border-b last:border-b-0">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-1.5 font-medium">
                      {c.name}
                      {c.locked && (
                        <Lock className="size-3.5 text-muted-foreground" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {c.locked ? LOCKED_COPY : c.description}
                    </p>
                    {c.emailNote && (
                      <p className="mt-0.5 text-xs italic text-muted-foreground">
                        {c.emailNote}
                      </p>
                    )}
                  </td>
                  {(["feed", "email"] as const).map((ch) => (
                    <td key={ch} className="py-3 text-center">
                      <Switch
                        label={`${c.name} ${ch}`}
                        checked={c.locked || prefs[c.key][ch]}
                        disabled={c.locked}
                        onChange={() => autosave(c.key, ch, c)}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------- Variant B
export function PrefsB_Cards({ role, isTeamAdmin }: Props) {
  const { categories, prefs, novuDown } = useCommon(role, isTeamAdmin);
  const [draft, setDraft] = useState<Prefs>(prefs);
  const dirty = categories.some(
    (c) =>
      draft[c.key].feed !== prefs[c.key].feed ||
      draft[c.key].email !== prefs[c.key].email
  );

  function save() {
    for (const c of categories)
      for (const ch of ["feed", "email"] as const)
        if (draft[c.key][ch] !== prefs[c.key][ch]) togglePref(c.key, ch);
    toast.success("Notification settings saved.");
  }

  return (
    <section id="notifications" className="mt-10 max-w-2xl">
      <h2 className="text-xl font-semibold">Notifications</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Pick how each kind of Notification reaches you.
      </p>
      {novuDown ? (
        <NovuDown />
      ) : (
        <>
          <div className="space-y-3">
            {categories.map((c) => (
              <div
                key={c.key}
                className={cn(
                  "rounded-lg border p-4",
                  c.locked && "bg-muted/50"
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-medium">{c.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {c.description}
                    </p>
                  </div>
                  {c.locked && (
                    <span className="flex shrink-0 items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      <Lock className="size-3" /> Always on
                    </span>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(["feed", "email"] as const).map((ch) => {
                    const on = c.locked || draft[c.key][ch];
                    const Icon = ch === "feed" ? Bell : Mail;
                    return (
                      <button
                        key={ch}
                        disabled={c.locked}
                        onClick={() =>
                          setDraft({
                            ...draft,
                            [c.key]: { ...draft[c.key], [ch]: !draft[c.key][ch] },
                          })
                        }
                        className={cn(
                          "flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm",
                          on
                            ? "border-primary bg-primary/10 text-foreground"
                            : "text-muted-foreground line-through",
                          c.locked && "cursor-not-allowed"
                        )}
                      >
                        <Icon className="size-3.5" />
                        {ch === "feed" ? "In Cadence" : "By email"}
                      </button>
                    );
                  })}
                </div>
                {c.locked && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {LOCKED_COPY}
                  </p>
                )}
                {c.emailNote && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {c.emailNote}
                  </p>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-3">
            <Button onClick={save} disabled={!dirty}>
              Save preferences
            </Button>
            {dirty && (
              <span className="text-sm text-muted-foreground">
                Unsaved changes
              </span>
            )}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Changes apply to future Notifications only.
          </p>
        </>
      )}
    </section>
  );
}

// ---------------------------------------------------------------- Variant C
export function PrefsC_ByChannel({ role, isTeamAdmin }: Props) {
  const { categories, prefs, novuDown } = useCommon(role, isTeamAdmin);
  const locked = categories.filter((c) => c.locked);
  const optional = categories.filter((c) => !c.locked);

  return (
    <Card id="notifications" className="mt-8 max-w-md">
      <CardHeader>
        <h2 className="text-lg font-semibold">Notifications</h2>
      </CardHeader>
      <CardContent className="space-y-6">
        {novuDown ? (
          <NovuDown />
        ) : (
          <>
            {locked.map((c) => (
              <div
                key={c.key}
                className="flex gap-2 rounded-md bg-muted p-3 text-sm"
              >
                <Lock className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <p>
                  <span className="font-medium">{c.name}</span> Notifications
                  always reach you in Cadence and by email. {LOCKED_COPY}
                </p>
              </div>
            ))}
            {(
              [
                ["feed", Bell, "In your Notification Feed", "Show me"],
                ["email", Mail, "By email", "Email me about"],
              ] as const
            ).map(([ch, Icon, heading, verb]) => (
              <fieldset key={ch}>
                <legend className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  <Icon className="size-4" /> {heading}
                </legend>
                <div className="space-y-2">
                  {optional.map((c) => (
                    <label
                      key={c.key}
                      className="flex cursor-pointer items-start gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={prefs[c.key][ch]}
                        onChange={() => autosave(c.key, ch, c)}
                      />
                      <span>
                        {verb} <span className="font-medium">{c.name}</span>
                        <span className="block text-xs text-muted-foreground">
                          {ch === "email" && c.emailNote
                            ? c.emailNote
                            : c.description}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
            <p className="text-xs text-muted-foreground">
              Saved as you go. Applies to future Notifications only.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
