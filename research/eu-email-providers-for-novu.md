# Which EU-hosted email providers can Novu send through?

Research for [#9](https://github.com/georgeleucutasag/cohort-005-project/issues/9), part of map [#1](https://github.com/georgeleucutasag/cohort-005-project/issues/1).

- **Researched:** 2026-11-19. Pricing and plan gating were read from vendors' public pages on that date and can change.
- **Method:** Only primary sources: Novu's integration docs, the vendors' own docs, pricing pages, DPAs and sub-processor lists. No sign-ups or trial accounts.
- **Fixed context:** Novu Cloud runs in the EU region (Frankfurt) on the Free plan. Novu's demo email provider can't be used in production. Postmark is retired because it is US-only. EU residency is a strict preference: US hosting under SCCs is acceptable only with a dated plan to move to the EU.

## Which email providers does Novu support?

Novu lists 19 email integrations [1]: SendGrid, Amazon SES, Resend, Postmark, Brevo, Sinch Mailgun, Mailjet, SparkPost, Mandrill, Outlook 365, Infobip, Braze, MailerSend, Mailtrap, Netcore, Plunk, Anypost, Email Webhook and **Custom SMTP**.

**Scaleway TEM is not a native integration.** It can only be connected through Custom SMTP [1, 8].

What matters for EU residency is whether Novu's integration form lets us point at the provider's EU endpoint:

| Provider | Novu integration fields | Can it reach the EU endpoint? |
| --- | --- | --- |
| Mailgun | API key, Username, Domain name, **Base URL**, From, Sender name. For EU-region domains, set Base URL to `https://api.eu.mailgun.net/` [2] | Yes |
| Amazon SES | `ACCESS_KEY_ID`, `ACCESS_SECRET_KEY`, **`region`** (default `us-east-1`), From, Sender name, optional Configuration Set Name [3] | Yes: set `region` = `eu-central-1` |
| SparkPost | API key, From, Sender name, **`eu` switch** [4] | Yes, but see the SparkPost/Bird caveat below |
| Mailjet | API key (and secret), From [5] | No field needed: Mailjet is EU-only |
| Brevo | API key, From [6] | No field needed: Brevo is EU-hosted |
| MailerSend | API key [7] | No field needed: MailerSend is EU-hosted |
| SendGrid | API key, From. **No region or base-URL field** [9] | **No.** EU residency needs `api.eu.sendgrid.com` [21] |
| Resend | API key, From, Sender name [10] | Region is set per domain at Resend, but account data stays in the US [22] |
| Custom SMTP | Host, Port, User, Password, Secure / Require TLS / Ignore TLS, TLS options, DKIM domain/key/selector, From, Sender name [8] | Yes, to any SMTP relay (for example Scaleway TEM) |

## Comparison

| | **Mailjet** (Sinch) | **Brevo** | **Scaleway TEM** | **Amazon SES** `eu-central-1` | **Mailgun EU** (Sinch) | **MailerSend** |
| --- | --- | --- | --- | --- | --- | --- |
| **Company** | Mailjet SAS, France (Sinch group) [12] | Brevo SAS, France [13] | Scaleway, France [14] | Amazon (US) | Mailgun Technologies Inc., US (Sinch group) [12] | Lithuania / Ireland entity (MailerLite group) [15] |
| **EU data residency** | **Yes, always.** Google Cloud in Frankfurt and Saint-Ghislain (BE). No US datacenter listed for Mailjet [11, 12] | **Yes, always.** OVH (France) and GCP (Belgium) [13] | **Yes, always.** TEM runs only in `fr-par` (Paris) [14] | **Yes, by region choice.** We choose `eu-central-1` (Frankfurt). Identities, DKIM, sandbox status, suppression list and SMTP credentials are all per region [16]. Customer chooses where content is stored [18] | **Per domain.** Region chosen when the domain is added. EU = GCP Belgium. "Message data never leaves the region", but account metadata, users, billing and API keys are replicated globally [17, 12] | **Yes, always.** GCP Belgium [15, 23] |
| **Region on all plans?** | Yes (single region) | Yes (single region) | Yes (single region) | Yes | Pricing page says US or EU from one account. No plan gate found [19] | Yes (single region) |
| **Free tier for dev** | 6,000 emails/mo, max 200/day. "No Mailjet logo" only from Essential up, so Free likely carries branding [20] | 300 emails/day after account approval [13a] | 300 emails/mo free per organization (Essential plan), then pay-as-you-go. Default quota 10,000/mo [14] | No permanent free tier. New AWS accounts get up to $200 in credits for 6 months. Sandbox allows 200 emails/24h at 1/s, to verified recipients only [24, 25] | 100 emails/day, 1 custom sending domain, 1-day logs [19] | 500 emails/mo, 100 API requests/day, 1 domain, 1-day activity retention [23] |
| **First paid tier** | Starter $9/mo for 8,000 emails, no daily limit [20] | Starter $9/mo from 5,000 emails/mo. All plans include transactional API/SMTP [13a] | Essential is pay-as-you-go above 300/mo. Scale is a fixed price with 100k emails and a dedicated IP [14]. *Per-email price not verified: the pricing page blocks automated fetches* | $0.10 per 1,000 emails (à la carte), no monthly fee [24] | Basic $15/mo for 10,000 emails [19] | Hobby $7/mo for 5,000 emails [23] |
| **DPA** | Sinch DPA [11, 12] | Built into the Terms of Service, Appendix 3 [13] | Scaleway DPA, Art. 11 SCCs [14] | AWS DPA is part of the Service Terms and applies automatically. Includes the 2021 SCCs [18] | Sinch DPA, with SCCs [26] | Published DPA, SCCs (Annex 3) [15] |
| **Sub-processors (location)** | Google Cloud France (DE/BE). Mailjet SAS (FR). Stripe, Atlassian, Zendesk (US & EU). **Mailgun Technologies Inc. (US) for support** [12] | OVH (FR), GCP (BE) for hosting. **US:** Cloudflare (CDN/WAF), Zendesk, Omni, Brevo Inc. **India:** Brevo CRM Solutions, for support/maintenance [13] | "No non-EU sub-processors" for TEM. The stack is fully managed by Scaleway in the EU. US/CA partners only in rare cases, under DPF/SCCs [14] | Depends on the region and services used. AWS updates the list 30 days before changes [27] | GCP (BE for EU). Stripe, Atlassian, Zendesk (US & EU). **Mailgun Technologies Inc. (US)** for support/provisioning [12] | Google Cloud EMEA (BE). MailerLite Ltd (IE). Vercom (PL). **MailerLite Inc. and Bandwidth (US)** [15] |
| **Setup under Novu** | Native. Mailjet API key **Write and Read**. Authenticate the sender (single sender or whole domain) [5] | Native. API key. Domain authentication [6] | **Custom SMTP only:** `smtp.tem.scaleway.com`, port 587 (STARTTLS) / 465 / 2465. Username = Project ID, password = API token. SPF + DKIM required. MX recommended [8, 28] | Native. IAM access keys, `region` = `eu-central-1`. Verify the domain with Easy DKIM CNAMEs. **Request production access** to leave the sandbox [3, 16, 25] | Native. Base URL `https://api.eu.mailgun.net/`. Verify the domain in Mailgun (subdomain recommended) [2, 17] | Native. API token. Verified domain [7] |
| **Sandbox / test mode** | Not documented in Novu's page | Not documented in Novu's page | Not documented | SES sandbox (verified recipients only) [25] | Mailgun has a sandbox domain for authorized recipients. Not verified: the help centre returned 403 | Not documented |
| **Limits under Novu** | None documented | None documented | No native integration, so Novu can't use a provider API (SMTP only) | Novu's Email Activity Tracking needs an SES Configuration Set [3] | None documented | Tiny free tier |

### Not shortlisted

- **SendGrid (EU):** EU residency needs a **Pro or Premier** plan, an EU-pinned subuser, a dedicated EU IP and the `api.eu.sendgrid.com` endpoint. "The parent account itself cannot send emails to the EU" [21, 29]. Novu's SendGrid form has no base-URL field [9], so we found no documented way to reach the EU endpoint through Novu's native integration. Ruled out.
- **Resend:** It can send from Ireland (`eu-west-1`), but "all account data, including email metadata, logs, and API records, is stored in the United States" [22]. All 22 listed sub-processors are US-based [30]. It fails EU residency outright.
- **SparkPost:** Novu has an `eu` switch [4], but SparkPost is now Bird. Bird's docs describe new regional hosts (`eu1.platform.bird.com`), while Novu presumably targets the legacy `api.eu.sparkpost.com`. We could not confirm which host still works [31]. Bird's free tier is 1,000 emails/mo, max 50/day [32]. Too uncertain.
- **MailerSend:** EU-hosted (Belgium) and natively supported, but the free tier is only 500/mo, and two US sub-processors are listed (MailerLite Inc., Bandwidth) [15, 23]. Viable, but weaker than the shortlist.
- **Not evaluated:** Mandrill (Mailchimp, US), Outlook 365, Infobip, Braze, Netcore, Mailtrap, Plunk, Anypost and Email Webhook. They are either not transactional ESPs we would choose or out of scope for this pass.

## Shortlist

### 1. Mailjet (recommended)

- **EU-only by construction.** Data lives on Google Cloud in Frankfurt and Belgium, and there is no US region to pick by mistake [11, 12]. The contracting entity is French (Mailjet SAS).
- **Best free dev tier among the EU options:** 6,000 emails/mo (200/day). Starter costs $9/mo for 8,000 [20].
- **Native Novu integration** with no region config to get wrong: API key/secret and a verified From address [5].
- **Caveats:** One sister-company sub-processor, Mailgun Technologies Inc. (US), does support work. Stripe, Atlassian and Zendesk list US and EU locations [12]. The Free plan probably carries Mailjet branding (no-logo starts at Essential) [20]; it is unconfirmed whether that applies to API-sent transactional mail.

### 2. Brevo (strong alternative)

- **French company, hosting in France (OVH) and Belgium (GCP)** [13]. DPA is built into the Terms. Its sub-processor list is public and itemised by country [13].
- 300 emails/day free. Starter $9/mo. Transactional API/SMTP on every plan [13a].
- **Caveats:** More non-EU parties than Mailjet: Cloudflare (US, with Data Localization Suite), Zendesk, Omni and Brevo Inc. (US), and Brevo CRM Solutions (India) for support [13]. Free-plan sending starts only "once we approve your account for sending" [13a].

### 3. Scaleway TEM (EU-purest, but SMTP only)

- **The only candidate that states it has no non-EU sub-processors for transactional email.** The stack is fully Scaleway-managed in `fr-par` [14].
- 300 free emails/mo, then pay-as-you-go [14]. That is enough for dev, but the dev allowance is small.
- **Caveats:** **No native Novu integration.** It goes through Novu's Custom SMTP (host, port 587, Project ID + API token, optional DKIM) [8, 28]. We could not verify the per-email price from the pricing page (it blocks automated fetches). There is no documented sandbox.

### Also viable (not top 3)

- **Amazon SES in `eu-central-1`:** Same city as Novu's EU region. Cheapest at volume ($0.10/1k) [24]. DPA and SCCs apply automatically [18]. Novu supports the `region` field natively [3]. It is not top 3 because AWS is a US company, there is no permanent free tier (6-month credits only), and leaving the sandbox needs a production-access request [24, 25].
- **Mailgun EU:** Message data stays in the EU region (Belgium), but account metadata and API keys are replicated globally. Sub-processors include Mailgun Technologies Inc. (US) [12, 17]. The free tier is small (100/day) [19].

## Surprises / criteria no candidate fully met

- **No provider is "EU-only with zero non-EU sub-processors" on a native Novu integration.** Scaleway claims zero non-EU sub-processors for TEM, but it is SMTP only. Every native option lists at least one US or Indian party for support, billing or CDN.
- **Scaleway TEM is not in Novu's integration list,** despite being the most obviously EU-native candidate in the ticket.
- **SendGrid EU appears unreachable through Novu's native SendGrid integration** (no base-URL field), and EU residency needs Pro+ anyway.
- **Resend's EU region is only a sending region.** Account data, logs and metadata stay in the US.
- **Novu's integration docs say nothing about provider-side templates, tracking or sandboxes,** except SendGrid's optional "Template Engine" permission and SES's Configuration Set for Email Activity Tracking [3, 9]. Every integration only needs credentials and a From address. We assume content is authored in Novu workflows; confirm this when building.

## Sources

Read 2026-11-19.

1. Novu email integrations overview: https://docs.novu.co/platform/integrations/email
2. Novu Mailgun: https://docs.novu.co/platform/integrations/email/mailgun.md
3. Novu Amazon SES: https://docs.novu.co/platform/integrations/email/amazon-ses.md
4. Novu SparkPost: https://docs.novu.co/platform/integrations/email/sparkpost.md
5. Novu Mailjet: https://docs.novu.co/platform/integrations/email/mailjet.md
6. Novu Brevo: https://docs.novu.co/platform/integrations/email/brevo.md
7. Novu MailerSend: https://docs.novu.co/platform/integrations/email/mailersend.md
8. Novu Custom SMTP: https://docs.novu.co/platform/integrations/email/custom-smtp.md
9. Novu SendGrid: https://docs.novu.co/platform/integrations/email/sendgrid.md
10. Novu Resend: https://docs.novu.co/platform/integrations/email/resend.md
11. Mailjet security & privacy: https://www.mailjet.com/legal/security-privacy/
12. Sinch DPA sub-processors (Mailgun and Mailjet sections): https://sinch.com/legal/data-protection-agreement-sub-processors/
13. Brevo Terms of Service (Version October 1st, 2025): Appendix 3 DPA, Annex 2 List of Sub-Processors: https://www.brevo.com/legal/termsofuse/
13a. Brevo pricing (plans and FAQ): https://www.brevo.com/pricing/
14. Scaleway TEM docs (source repo, scaleway/docs-content): `pages/transactional-email/how-to/manage-tem-plans.mdx`, `reference-content/tem-capabilities-and-limits.mdx`, `faq.mdx`, `concepts.mdx`. Published at https://www.scaleway.com/en/docs/transactional-email/
15. MailerSend DPA (Annex 2 §4.3, Annex 3, Annex 4): https://www.mailersend.com/legal/data-processing-addendum
16. Amazon SES regions: https://docs.aws.amazon.com/ses/latest/dg/regions.html
17. Mailgun API overview (regions, base URLs, data locality): https://documentation.mailgun.com/docs/mailgun/api-reference/api-overview
18. AWS GDPR Center: https://aws.amazon.com/compliance/gdpr-center/
19. Mailgun pricing: https://www.mailgun.com/pricing/
20. Mailjet pricing: https://www.mailjet.com/pricing/
21. Twilio SendGrid EU data residency FAQ: https://www.twilio.com/docs/sendgrid/data-residency/faq
22. Resend regions: https://resend.com/docs/dashboard/domains/regions.md
23. MailerSend pricing: https://www.mailersend.com/pricing, and GDPR page: https://www.mailersend.com/legal/how-mailersend-stays-gdpr-compliant
24. Amazon SES pricing: https://aws.amazon.com/ses/pricing/
25. Amazon SES sending quotas / sandbox: https://docs.aws.amazon.com/ses/latest/dg/manage-sending-quotas.html
26. Mailgun GDPR page (links Sinch DPA, SCCs): https://mailgun.com/gdpr
27. AWS sub-processors: https://aws.amazon.com/compliance/sub-processors/
28. Scaleway TEM SMTP connection troubleshooting (`pages/transactional-email/troubleshooting/smtp-connection.mdx` in scaleway/docs-content)
29. Twilio blog, "How to send emails with Twilio SendGrid on EU servers": https://www.twilio.com/en-us/blog/send-emails-in-eu
30. Resend sub-processors: https://resend.com/legal/subprocessors
31. SparkPost EU FAQ: https://support.sparkpost.com/docs/faq/sparkpost-eu-faq/ and API overview: https://developers.sparkpost.com/api/
32. Bird/SparkPost pricing: https://www.sparkpost.com/pricing
