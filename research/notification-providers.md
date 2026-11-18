# Which third-party notification providers fit Cadence?

Research for [#2](https://github.com/georgeleucutasag/cohort-005-project/issues/2), part of map [#1](https://github.com/georgeleucutasag/cohort-005-project/issues/1).

- **Researched:** 2026-11-18. All pricing and plan gating below was read from the vendors' public pages on that date. Pricing pages carry no version, so re-check them before deciding.
- **Method:** Vendor docs, pricing pages, DPA/trust/sub-processor pages only. No sign-ups or trial accounts.
- **Candidates:** Knock, Novu Cloud, Courier, MagicBell, SuprSend. Engagespot was considered as an extra candidate, but its pricing page returned 404, so it was not evaluated.

## Comparison

Criteria are listed in the ticket's priority order. "Free" means the vendor's $0 plan.

| Criterion | Knock | Novu Cloud | Courier | MagicBell | SuprSend |
| --- | --- | --- | --- | --- | --- |
| **EU data region** | **None yet.** "We expect to support EU data residency by the end of 2026" [K1] | **Yes, on all plans incl. Free.** Frankfurt. Region is chosen at sign-up and is tied to the API keys [N1, N2] | Yes, Ireland (eu-west-1), on **paid plans only** (Business/Enterprise). It is a separate workspace [C1, C2] | No EU hosting region documented [M2] | "EU-data residency options" mentioned, no details [S2]. Pricing lists custom/multi-region DCs as **Enterprise** [S1] |
| **DPA / sub-processors** | DPA published [K3]. Sub-processor list: 19 entries, all US (AWS, Postmark, Anthropic, OpenAI, ...) [K4]. SOC 2 Type 2, "GDPR certified" [K1] | DPA with SCCs downloadable [N3]. No public sub-processor list (DPA §7.2 refers to an undisclosed list) [N3]. SOC 2 Type II [N1] | Sub-processor page published [C3]. MSA/DPA legal review is Enterprise [C2] | Trust Centre says DPAs are offered. No public DPA text or sub-processor list found [M2] | DPA published [S2]. Trust centre lists sub-processors [S3]. SOC 2 Type 2 |
| **Free tier for dev** | 10,000 messages/mo. Unlimited workflows, profiles and team members. Knock branding on the Feed [K2] | 10,000 workflow runs/mo, **max 5 workflows**, 3 seats, 24h activity retention, Novu branding. Pro is from $30/mo [N2] | 10,000 sends/mo. Test environments count against the quota [C2] | **1,000 deliveries/mo**, 1 project [M1] | 10,000 notifications/mo, SuprSend branding on Inbox [S1] |
| **Notification Feed (React, live, unread)** | `@knocklabs/react`: `NotificationFeedPopover` and `NotificationIconButton` (unread/unseen badge). Managed websocket real-time service. No real-time limits on Free [K5, K6] | `@novu/react` `<Inbox />` with bell, unread count and built-in preferences UI. Real-time via socket (EU: `wss://eu.socket.novu.co`). HMAC `subscriberHash` [N1, N4, N5] | `@trycourier/courier-react` `<CourierInbox />` / popup menu and toasts. `listenForUpdates()` websocket, `totalUnreadCount`. JWT auth [C4, C5] | React `Inbox` / `FloatingInbox`. "Persistent connection" for real-time [M3] | Inbox on all plans [S1]. React SDK not examined in detail |
| **Email via our Postmark** | Yes, with our own Postmark API key and a sandbox mode [K7] | Yes, with our Postmark server token [N6] | Yes, Postmark integration [C6] | Bring-your-own email providers supported (API lists provider configs) [M4] | Third-party vendors are billed separately by the vendor [S1] |
| **Preferences per type × Channel** | Yes. Per-workflow `channel_types` and `channels`, plus categories, with environment defaults. All plans [K2, K8] | Yes. Workflow defaults, then subscriber global preferences, then per-workflow per-channel overrides [N7] | Yes. Subscription topics, with per-section channel selection and a hosted preference page [C7] | Category × Channel preferences UI [M3] | **Business plan and up ($250/mo)** [S1] |
| **Required (non-opt-out) Notifications** | Yes: the workflow toggle "Override recipient preferences" [K8] | Yes: "Mark as critical" hides the workflow from preferences and ignores subscriber layers [N7] | Yes: topic default status `REQUIRED` [C7] | Not documented [M3] | Not confirmed |
| **Digests / batching** | Batch function on all plans: fixed, sliding and scheduled (daily/weekly in recipient TZ) windows, max 90 days [K2, K9] | Digest step (regular + scheduled). **Max window 1 day on Free**, 7 days Pro, 30 days Team [N8] | Topic-based digests with user-selectable schedules [C8], but pricing lists "digest and batching" as **Enterprise** [C2] | No digest feature documented [M5] | **Business plan and up** [S1] |
| **Node/TS server SDK; recipient identity** | Node SDK. Users are identified by **our own user id**. Upsert via identify, bulk identify, or inline on trigger [K10] | `@novu/api` (`serverURL: "https://eu.api.novu.co"` for EU). `subscriberId` = our user id, upserted on every trigger [N9, N10] | Node SDK. `user_id` profiles. Set `COURIER_BASE_URL` for EU [C1, C9] | Node client [M3] | Node SDK. Users upserted by `distinct_id` [S4] |
| **Lock-in / exit** | Proprietary. Workflows-as-code via CLI. Warehouse export is Enterprise | **Open-core, MIT** (`/enterprise` folder is commercial). Self-hostable as a fallback if we ever had to leave Cloud [N11] | Proprietary | Proprietary | Proprietary. Self-host/BYOC on Enterprise [S1] |

## Shortlist

### 1. Novu Cloud (recommended)

- **The only candidate with an EU region on the free tier.** Novu runs in Frankfurt, and the API, dashboard and websocket all have EU endpoints [N1]. That meets our top criterion with no sales call or paid plan.
- It covers every functional criterion: React `<Inbox />` with live unread counts and built-in preferences UI, our own Postmark, per-workflow × Channel preferences, "critical" workflows for Required Notifications, and digests.
- **Lowest lock-in.** The MIT core can be self-hosted, which gives us an exit route even though self-hosting is out of scope for now.
- Recipient sync is simple: `subscriberId` is our user id, upserted on every trigger.

**Open risks**

- **Free tier caps at 5 workflows.** Cadence wants "a wider set of events for all roles". If each Notification type is one workflow, we may outgrow Free and need Pro (from $30/mo, 20 workflows) [N2].
- **Digest window is capped at 1 day on Free** [N8]. A weekly digest would need Pro (7 days).
- **Region is fixed at sign-up.** Moving later needs sales [N1]. We must create the account in the EU region from day one.
- **No public sub-processor list.** We would have to request it, e.g. via trust.novu.co [N3].
- Novu branding stays on the Inbox until Pro.

### 2. Knock (runner-up, conditional on EU region)

- Most generous free tier for functionality: 10k messages, unlimited workflows, and batching (including weekly scheduled windows) on all plans. It has preferences with an "Override recipient preferences" toggle for Required Notifications, a polished React Feed with a managed websocket, and our own Postmark [K2, K5, K8, K9].
- **Blocking risk: no EU data residency today.** It is only "expected by end of 2026" [K1], and all 19 listed sub-processors are US-based [K4]. Data would sit in the US under the DPA/SCCs.
- Paid tier jumps straight to $250/mo (Starter) [K2].
- Proprietary, so exit is harder.

### Ruled out

- **Courier:** EU region is paid-only, and digest/batching is listed as Enterprise [C1, C2].
- **SuprSend:** preferences and digests require Business ($250/mo), and EU/custom regions look Enterprise [S1].
- **MagicBell:** no documented EU region, no digests, no Required Notifications, and only 1,000 deliveries/mo free [M1, M3, M5].

## Criteria no candidate fully met

- **EU region + digests + unlimited Notification types, all on a free tier.** Novu has the EU region but caps workflows (5) and digest windows (1 day). Knock has the features but no EU region.
- **Public, EU-only sub-processor list.** Knock's list is all US. Novu publishes none.

## Sources

Read 2026-11-18.

- [K1] Knock security docs: https://docs.knock.app/developer-tools/security.md
- [K2] Knock pricing: https://knock.app/pricing
- [K3] Knock DPA: https://knock.app/legal/data-processing-addendum
- [K4] Knock sub-processors: https://knock.app/legal/subprocessors
- [K5] Knock feeds overview: https://docs.knock.app/in-app-ui/feeds/overview.md
- [K6] Knock React overview: https://docs.knock.app/in-app-ui/react/overview.md
- [K7] Knock Postmark: https://docs.knock.app/integrations/email/postmark.md
- [K8] Knock preferences: https://docs.knock.app/preferences/overview.md
- [K9] Knock batch function: https://docs.knock.app/designing-workflows/batch-function.md
- [K10] Knock identifying recipients: https://docs.knock.app/managing-recipients/identifying-recipients.md
- [N1] Novu security & data residency: https://docs.novu.co/platform/additional-resources/security.md
- [N2] Novu pricing: https://novu.co/pricing
- [N3] Novu DPA: https://novu.co/dpa
- [N4] Novu React SDK: https://docs.novu.co/platform/sdks/react.md
- [N5] Novu Inbox overview: https://docs.novu.co/platform/inbox/overview.md
- [N6] Novu Postmark: https://docs.novu.co/platform/integrations/email/postmark.md
- [N7] Novu preferences: https://docs.novu.co/platform/concepts/preferences.md
- [N8] Novu digest: https://docs.novu.co/platform/workflow/add-and-configure-steps/configure-action-steps/digest.md
- [N9] Novu TypeScript SDK: https://docs.novu.co/platform/sdks/server/typescript.md
- [N10] Novu subscribers: https://docs.novu.co/platform/concepts/subscribers.md
- [N11] Novu repo/licence: https://github.com/novuhq/novu
- [C1] Courier EU datacenter: https://www.courier.com/docs/platform/workspaces/eu-datacenter
- [C2] Courier pricing (page dated 2026-11-12): https://www.courier.com/pricing
- [C3] Courier sub-processors: https://www.courier.com/subprocessors
- [C4] Courier React SDK: https://www.courier.com/docs/sdk-libraries/courier-react-web.md
- [C5] Courier authenticate users: https://www.courier.com/docs/in-app/authenticate-users.md
- [C6] Courier Postmark: https://www.courier.com/docs/integrations/email/postmark.md
- [C7] Courier preference center: https://www.courier.com/docs/guides/build-a-preference-center.md
- [C8] Courier digests: https://www.courier.com/docs/guides/send-a-daily-digest.md
- [C9] Courier Node SDK: https://www.courier.com/docs/sdk-libraries/node.md
- [M1] MagicBell pricing: https://www.magicbell.com/pricing
- [M2] MagicBell trust centre / privacy: https://www.magicbell.com/security, https://www.magicbell.com/privacy-policy
- [M3] MagicBell in-app channel: https://www.magicbell.com/docs/channels/in_app
- [M4] MagicBell API reference: https://www.magicbell.com/docs/api/reference
- [M5] MagicBell docs index (no digest page found): https://www.magicbell.com/docs
- [S1] SuprSend pricing: https://www.suprsend.com/pricing
- [S2] SuprSend security: https://docs.suprsend.com/docs/security
- [S3] SuprSend trust centre: https://trust.suprsend.com
- [S4] SuprSend users API: https://docs.suprsend.com/reference/create-update-users.md
