# NEURIXA | TWENTY CRM — IMPLEMENTATION BLUEPRINT V3
**Issued:** 25 November 2026 | **Owners:** Namit, Aman, Varun | **MVP gate:** 15 January 2027 | **Hardening gate:** 29 January 2027

> Design/specification only. UI mockups use sample data and are not verified production screenshots. Assignments are proposed; no live Twenty tasks have been created by this document.

## 1. Mission

Keep the existing Twenty CRM fork and extend it into an integrated restaurant-prospect, sales, outreach, onboarding, developer Kanban and AI-assisted operations workspace. AI uses the internally hosted Ollama GLM model through a private backend gateway; every customer-facing action is subject to explicit policy and/or human review.

## 2. Current state versus target

| Capability | Evidence | Action |
|---|---|---|
| Twenty CRM foundation + /wingerx | Existing in source | Retain; verify deployed revision before coding |
| Sales analytics and Tech analytics | Existing in source | Validate live data counts, create true issue workflow |
| Outreach email and WhatsApp actions | Existing in source | Preserve sender, add durable delivery history and eligibility |
| RestaurantProspect + RestaurantEmailSend references | Referenced in existing UI | Verify physical objects, indexes, roles and data in workspace |
| Manual rule-run creates Twenty tasks | Existing in source | Extend as durable event-driven, permission-controlled automations |
| Recent outreach history in React state | Existing code limitation | Persist in database and show after refresh |
| Rate-limit/idempotency via in-process maps | Existing code limitation | Move to Redis/DB to survive concurrency and restart |
| Internal Ollama GLM model | User reports hosted | Verify actual model tag, endpoint, capacity and supported output modes |
| Developer sprint Kanban | Target feature | Build objects/relationships and real board; not just Tech metrics |
| Inbox reply sync and metrics | Requires deployment audit | Implement only missing adapters; do not duplicate Twenty email sync |

## 3. Who owns what

- **Namit:** persistent data model integration, email/WhatsApp and reply reliability, lead assignment, outbound workers, backend tests and runbooks.
- **Aman:** navigation, prospect/deal/campaign/inbox screens, business/developer Kanban UI, dashboards, UX and role UAT.
- **Varun:** Ollama gateway, schema validation, AI classification/drafting, developer-project model/API, GitHub references, AI safety and QA.
- **Senior reviewer/project lead:** architecture, production access, consent/legal decisions, migrations, campaign approval, secrets and release signoff.

## 4. Full pipeline

| Phase | Trigger / work | Expected record/output | Lead |
|---|---|---|---|
| Discover | Import CSV/approved sources | Prospects with provenance and dedupe key | Namit |
| Qualify | Normalize + rules + GLM suggestions | Lead profile, score, proposed products | Namit + Varun |
| Approve outreach | Human reviews audience + drafts + policy | Campaign approval + legal eligibility snapshot | Aman + Namit |
| Send | Durable enqueue + provider request | Send ID, attempt, provider state | Namit |
| Respond | Inbound sync + intent suggestion | Linked thread, owner, follow-up task | Namit + Varun |
| Sell | Opportunity stages, demos, proposals | Won/Lost, amount, next action | Aman + Namit |
| Onboard | Won event creates delivery project once | Project, checklist and due dates | Namit + Varun |
| Deliver | Sprint board + PR + QA + release | Developer issue history and status | Varun + Aman |
| Improve | Metrics + GLM recommendations | Management dashboard, AI reason and audit | Aman + Varun |

## 5. Target AI architecture and boundaries

Twenty/PostgreSQL is the source of truth. Redis/queue provides durable orchestration. Internal `/api/ai` gateway calls configured `OLLAMA_BASE_URL` + actual `OLLAMA_MODEL` through private connectivity. GLM returns typed suggestions only; backend validates output. Only authenticated CRM commands execute actions after permission and approval checks. Never send CRM PII, secrets, credentials or raw attachments by default. The exact GLM model tag, model support for JSON/tool calling, hardware capacity and endpoint remain to be verified in V01.

**Example structured suggestion (illustrative):**
```json
{"intent":"INTERESTED","confidence":0.84,"reason":"Asked for a short demo","suggestedAction":"CREATE_FOLLOWUP_TASK","requiresApproval":true}
```

**Guardrails:** No model-initiated email send, WhatsApp send, data deletion, stage change or deployment; source facts shown; JSON validated; prompt-injection tests; per-request auditing; human can edit/reject; model outage has deterministic fallback.

## 6. Data objects and fields

| Object | Essential fields (verify existing metadata first) | Tasks |
|---|---|---|
| RestaurantProspect | name, market, city, website, businessEmail, businessPhone, sourceUrl, sourceDate, ownerId, contactStatus, leadScore, legalBasisReview | N02/A02 |
| Opportunity (prefer standard) | company/person, stage, amount+currency, owner, expectedCloseDate, lastActivityAt, nextActionAt | A08/N09 |
| RestaurantEmailSend (verify existing) | campaignId, prospectId, idempotencyKey, scheduledAt, queuedAt, sentAt, providerMessageId, providerStatus, errorCode, attempt | N04/N05 |
| CommunicationEvent | sendId, eventType, providerTimestamp, receivedAt, externalEventId, rawPayloadRef, actor, source | N04/N06 |
| InboundMessage | threadId, messageId, replyToId, sender, recipient, receivedAt, bodyRef, matchedProspectId, assignedOwnerId | N07/A06 |
| SuppressionRecord | channel, normalizedDestination, reason, sourceEventId, createdAt, createdBy | N08 |
| Campaign / approval | name, market, audienceSnapshot, subject, templateVersion, legalReviewStatus, approverId, approvalAt, dailyCap | A05/N05 |
| Project / Sprint / EngineeringIssue | projectId, clientId, sprintId, title, description, ownerId, priority, status, dueAt, acceptance, PRUrl, QAStatus | V08/V09 |
| AIGeneration | requestId, modelTag, promptVersion, featureName, recordId, requestHash, status, resultJson, validationErrors, reviewedBy | V02/V03 |
| AuditEvent | actorId, objectType, objectId, action, previousState, newState, timestamp, correlationId | All |

## 7. Ten-week execution calendar

| Sprint | Date | Goal | Namit | Aman | Varun |
|---|---|---|---|---|---|
| W0 | 25–27 Nov 2026 | Foundation, safe access and baseline | N01 | A01 | V01 |
| W1 | 30 Nov–4 Dec | Prospect data + private AI gateway | N02, N03 | A02, A03 | V02, V03 |
| W2 | 7–11 Dec | Persistent campaigns and editable AI drafts | N04, N05 | A04, A05 | V04, V05 |
| W3 | 14–18 Dec | Replies, inbox, AI reply triage | N06, N07 | A06, A07 | V06, V07 |
| W4 | 21–25 Dec | Compliance checks + Kanban schema | N08 | A08 | V08 |
| W5 | 28 Dec–1 Jan | Lead ownership + engineering issue APIs | N09 | A09 | V09 |
| W6 | 4–8 Jan | Won-deal onboarding + developer board | N10 | A10 | V10 |
| W7 | 11–15 Jan | Working MVP: cross-module pilot | N11 | A11 | V11 |
| W8 | 18–22 Jan | WhatsApp, analytics and AI recommendations | N12, N13 | A12, A13 | V12, V13 |
| W9 | 25–29 Jan | Reliability, security and handover | N14, N15 | A14, A15 | V14, V15 |

Each person has at most ~4 planned build days per full week plus review/demo buffer. W4/W5 account for potential leave/holidays rather than assuming every date is a working day.

## 8. Intern task cards — each card has a clear “Done when”


### W0 — 25–27 Nov 2026 — Foundation, safe access and baseline

#### N01 — Audit existing email sender, workers, and persistence  [Namit; P0; 2d]
- **Why:** Understand which outreach features actually run in staging before changing code.
- **Do these steps:** Inspect the deployed commit and service configs; trace one dry-run email from RestaurantProspect to RestaurantEmailSend; record status changes and failures without sending to external customers.
- **Expected screen/output:** A one-page diagnostic checklist: worker healthy, SMTP configured, records available, failure reason visible.
- **Done when:** Show staging logs and a reproducible current-state matrix; no production sends or config changes.
- **Depends:** —
- **Screen reference:** 13 Integrations health
- **Review evidence:** PR + test evidence

#### A01 — Map current CRM screens and design navigation  [Aman; P0; 2d]
- **Why:** Use existing /wingerx screens and avoid rebuilding features that already work.
- **Do these steps:** Open Sales/Tech/Outreach/Automation in staging; take screenshots and list broken/empty states; propose new sidebar sections and mobile behavior.
- **Expected screen/output:** A clickable navigation outline: Overview, Restaurants, Campaigns, Inbox, Deals, Projects, AI, Reports, Settings.
- **Done when:** Provide annotated current-screen audit plus wireframe with all navigation entries.
- **Depends:** —
- **Screen reference:** 01 Executive + sidebar
- **Review evidence:** PR + test evidence

#### V01 — Verify self-hosted Ollama GLM model safely  [Varun; P0; 2d]
- **Why:** Confirm the actual deployed model identifier, network path and capability before building AI features.
- **Do these steps:** Ask senior for internal service access (no credentials in git); test /api/tags and /api/chat; run five masked examples for JSON reliability and measure latency.
- **Expected screen/output:** An AI Health card with model name, reachable status, median latency and last checked time.
- **Done when:** Deliver model capability sheet, latency results and sanitized test fixtures; no CRM data sent externally.
- **Depends:** —
- **Screen reference:** 16 AI operations
- **Review evidence:** PR + test evidence


### W1 — 30 Nov–4 Dec — Prospect data + private AI gateway

#### N02 — Normalize restaurant import and deduplication  [Namit; P0; 2d]
- **Why:** Make restaurant CSV rows usable in the existing CRM without creating duplicates.
- **Do these steps:** Map source columns to existing RestaurantProspect fields; normalize phone + country and email; deduplicate by domain/phone/name+city and keep source/provenance.
- **Expected screen/output:** Import preview shows New, Duplicate, Invalid counts; errors downloadable as CSV.
- **Done when:** 100 sample rows import cleanly; second import adds zero duplicates; original data remains traceable.
- **Depends:** N01
- **Screen reference:** 02 Restaurants
- **Review evidence:** PR + test evidence

#### N03 — Write status dictionary and transition contract  [Namit; P0; 2d]
- **Why:** Replace confusing labels such as queued versus sent with unambiguous statuses.
- **Do these steps:** Define imported, eligible, approved, queued, provider-accepted, sent, delivered, bounced, failed, replied, opted-out; document allowed transitions and event timestamps.
- **Expected screen/output:** Status chips and timeline use the same names on every screen.
- **Done when:** Unit tests reject illegal transitions and prevent queued/accepted from appearing as delivered.
- **Depends:** N01
- **Screen reference:** 06 Outreach queue
- **Review evidence:** PR + test evidence

#### A02 — Build searchable Restaurant Prospect list  [Aman; P0; 2d]
- **Why:** Sales should find a restaurant and understand what to do next without opening spreadsheets.
- **Do these steps:** Reuse Twenty record objects; add search/filter for city, market, source, contact validity, owner and lead stage; show import status.
- **Expected screen/output:** Table columns: business, city, website, email, phone, lead stage, owner, last contact, next action.
- **Done when:** Filtering and sorting work on at least 100 fixture rows; empty/loading/error states are shown.
- **Depends:** A01,N02
- **Screen reference:** 02 Restaurants
- **Review evidence:** PR + test evidence

#### A03 — Build restaurant 360° detail drawer  [Aman; P1; 2d]
- **Why:** Each prospect should have one readable activity and sales timeline.
- **Do these steps:** Add overview, contacts, campaign history, replies, tasks and notes tabs; display field provenance; link to opportunity.
- **Expected screen/output:** Side drawer header: Restaurant name, city, owner, status; timeline with timestamp and source.
- **Done when:** Sales user can open a prospect, update basic fields and see linked activities on refresh.
- **Depends:** A02
- **Screen reference:** 04 Account 360
- **Review evidence:** PR + test evidence

#### V02 — Create private Ollama AI gateway in backend  [Varun; P0; 2d]
- **Why:** Do not call the GLM server directly from browser JavaScript.
- **Do these steps:** Create configurable OLLAMA_BASE_URL, OLLAMA_MODEL, timeouts; add auth and input size cap; make POST /internal/ai/generate through NestJS or worker.
- **Expected screen/output:** AI service status displayed in Integrations with safe error text and retry button.
- **Done when:** Health endpoint plus integration test work; errors time out cleanly; model URL not exposed to browser.
- **Depends:** V01
- **Screen reference:** 16 AI operations
- **Review evidence:** PR + test evidence

#### V03 — Add GLM output validation and safety policy  [Varun; P0; 2d]
- **Why:** AI suggestions must be typed, auditable and never perform actions on their own.
- **Do these steps:** Define Zod/JSON-schema response types; reject bad JSON; log prompt template version, duration and request ID; redact unnecessary personal fields.
- **Expected screen/output:** Every AI suggestion has confidence/reason, Regenerate, Edit and Approve controls.
- **Done when:** Malformed output shows controlled error; no automatic send, status change or deployment.
- **Depends:** V02
- **Screen reference:** 14 AI workbench
- **Review evidence:** PR + test evidence


### W2 — 7–11 Dec — Persistent campaigns and editable AI drafts

#### N04 — Persist outbound message history  [Namit; P0; 2d]
- **Why:** Remove browser-only history and prevent sending duplicates after service restart.
- **Do these steps:** Create or extend durable send + event records with unique idempotency keys; write transactional state and provider IDs; include manual action actor.
- **Expected screen/output:** Per-recipient message timeline survives browser reload and worker restart.
- **Done when:** Replay same idempotency key creates only one outbound send; 20 simulated events retained.
- **Depends:** N03
- **Screen reference:** 06 Outreach queue
- **Review evidence:** PR + test evidence

#### N05 — Make scheduled email batch safe and observable  [Namit; P0; 2d]
- **Why:** Use the existing POS outreach job as a base, not a new parallel sender.
- **Do these steps:** Implement dry-run and approval gate, a configurable maximum 100/day, per-market timezone, suppression checks, locked batches, retry-with-backoff and counts from durable records.
- **Expected screen/output:** Queue page shows scheduled/eligible/excluded/queued/sent/failed with run ID and error.
- **Done when:** Two overlapping workers cannot duplicate a send; dry-run sends zero emails; cap cannot be exceeded.
- **Depends:** N02,N04
- **Screen reference:** 06 Outreach queue
- **Review evidence:** PR + test evidence

#### A04 — Create campaign queue and per-recipient log screen  [Aman; P0; 2d]
- **Why:** Marketing should see exactly which restaurant got which email and what happened.
- **Do these steps:** Build campaign selector, status filters, recipient table and event drawer linked to real send history.
- **Expected screen/output:** Visible run date, subject, owner, attempt, provider ID, last error and retry eligibility.
- **Done when:** Reload keeps message history; a failed row links to a useful error and can be filtered.
- **Depends:** N04
- **Screen reference:** 06 Outreach queue
- **Review evidence:** PR + test evidence

#### A05 — Create campaign composer with approval preview  [Aman; P0; 2d]
- **Why:** Sales prepares outreach without accidentally sending it.
- **Do these steps:** Implement campaign draft, template selection, personalization preview, test send to internal mailbox, reviewer status, and recipient estimate.
- **Expected screen/output:** Stepper: Audience → Content → Preview → Approval → Schedule; AI draft optional.
- **Done when:** User cannot press Launch until reviewer approval and eligibility checks pass.
- **Depends:** A04,V03
- **Screen reference:** 05 Campaign builder
- **Review evidence:** PR + test evidence

#### V04 — AI prospect classification with reason  [Varun; P1; 2d]
- **Why:** Help sales identify likely POS/GBP/SEO opportunities without inventing data.
- **Do these steps:** Send masked business name/category/website summary to GLM; request strict JSON for services, confidence and rationale; store suggestion separately from actual fields.
- **Expected screen/output:** AI Insights panel lists Suggested offering: POS, GBP, Website, WhatsApp, with editable rationale.
- **Done when:** 20 fixture cases produce valid schema; unsupported facts are marked unknown.
- **Depends:** V03,N02
- **Screen reference:** 14 AI workbench
- **Review evidence:** PR + test evidence

#### V05 — AI-generated email draft with review gate  [Varun; P1; 2d]
- **Why:** Generate helpful English/German drafts, never sending automatically.
- **Do these steps:** Add prompt templates by offer/market; require factual grounding from CRM; expose tone and language options with output moderation/validation.
- **Expected screen/output:** Composer shows AI suggestion next to editable human-approved email and a clear AI label.
- **Done when:** Generate draft in both languages for 5 fixtures; reviewer edit/history preserved; no send action invoked by model.
- **Depends:** V03,A05
- **Screen reference:** 05 Campaign builder
- **Review evidence:** PR + test evidence


### W3 — 14–18 Dec — Replies, inbox, AI reply triage

#### N06 — Record provider delivery and failure events  [Namit; P0; 2d]
- **Why:** Track real delivery signals instead of assuming a queued message reached the recipient.
- **Do these steps:** Implement supported SMTP/ESP webhook or polling adapter; verify event signature when available; dedupe events, timestamp them and update send state.
- **Expected screen/output:** History shows queue accepted, provider sent, delivered/bounced when supported, and unknown when not supported.
- **Done when:** Duplicate webhook is harmless; bounced recipient is suppressed; unknown capabilities are not claimed.
- **Depends:** N04
- **Screen reference:** 06 Outreach queue
- **Review evidence:** PR + test evidence

#### N07 — Sync inbound email and match replies to contacts  [Namit; P0; 2d]
- **Why:** A salesperson must see incoming responses on the associated restaurant record.
- **Do these steps:** Connect authorized mailbox with provider API/IMAP as supported; map Message-ID/In-Reply-To/thread ID; fallback safe email match; create activity + owner task.
- **Expected screen/output:** Inbox thread opens with restaurant, owner, campaign, timestamps and reply text.
- **Done when:** A seeded reply attaches to the correct restaurant; unknown sender enters unmatched queue, not random contact.
- **Depends:** N04,N06
- **Screen reference:** 07 Inbox
- **Review evidence:** PR + test evidence

#### A06 — Build shared inbox and reply triage screen  [Aman; P0; 2d]
- **Why:** Give sales one list of replies requiring attention.
- **Do these steps:** Create New, Assigned, Waiting, Closed filters; reply detail with safe read-only preview; owner assignment and suggested next action.
- **Expected screen/output:** Two-column inbox: threads left, conversation/CRM sidebar right; AI suggestion clearly labeled.
- **Done when:** A new reply appears with badge, correct owner, and link to restaurant without refresh confusion.
- **Depends:** N07
- **Screen reference:** 07 Inbox
- **Review evidence:** PR + test evidence

#### A07 — Add salesperson daily work and follow-up drawer  [Aman; P1; 2d]
- **Why:** Sales agents need a next-action queue, not just dashboard numbers.
- **Do these steps:** Show overdue follow-ups, demos, unowned leads, interested replies, and due-today tasks; allow manual action completion.
- **Expected screen/output:** My Day cards with due time, priority, client and quick actions (Call, Email draft, Open deal).
- **Done when:** Completing a task updates CRM state and disappears from My Day; overdue remains visible until resolved.
- **Depends:** A06
- **Screen reference:** 07 Inbox
- **Review evidence:** PR + test evidence

#### V06 — Score leads with explainable AI and business rules  [Varun; P1; 2d]
- **Why:** Prioritize sales without using unverifiable predictions.
- **Do these steps:** Combine explicit rule signals (market, contact completeness, website, category) with GLM category suggestion; show components and manual override.
- **Expected screen/output:** Restaurant list adds Priority and Why column; details show scoring breakdown.
- **Done when:** All scores 0–100, deterministic rule portion testable, and AI missingness is clearly marked.
- **Depends:** V04,A02
- **Screen reference:** 02 Restaurants
- **Review evidence:** PR + test evidence

#### V07 — Classify replies and draft follow-up recommendations  [Varun; P1; 2d]
- **Why:** Automatically propose a category and task, but let sales make the final choice.
- **Do these steps:** Classify interested, meeting request, not now, unsubscribe, wrong contact, and other in strict JSON; propose owner task only after validated rules.
- **Expected screen/output:** Inbox AI panel: Intent, Evidence excerpt, Confidence, Suggested task, Approve/Reject.
- **Done when:** Unsubscribe goes to mandatory suppression without AI permission; remaining AI suggestions can be edited and rejected.
- **Depends:** N07,V03
- **Screen reference:** 14 AI workbench
- **Review evidence:** PR + test evidence


### W4 — 21–25 Dec — Compliance checks + Kanban schema

#### N08 — Implement send eligibility, consent and opt-out checks  [Namit; P0; 2d]
- **Why:** Prevent prohibited outreach and respect unsubscribes across channels.
- **Do these steps:** Add contact-source and jurisdiction fields; capture legal-basis/permission evidence where needed; enforce suppression and DNC at API send time; require manager-approved campaign policy.
- **Expected screen/output:** Contact detail shows Do not contact / legal basis / source / review needed; blocked sends explain why.
- **Done when:** Suppressed records cannot be manually or automatically sent; test Germany cases with legal-review-required flag.
- **Depends:** N05,N07
- **Screen reference:** 05 Campaign builder
- **Review evidence:** PR + test evidence

#### A08 — Finish drag-and-drop sales opportunity Kanban  [Aman; P0; 2d]
- **Why:** Turn existing opportunity analytics into an actionable sales board.
- **Do these steps:** Use standard Opportunity records; columns: New, Qualified, Contacted, Interested, Demo, Proposal, Won, Lost; add missing required fields when changing stage.
- **Expected screen/output:** Pipeline cards show restaurant, deal value/currency, owner, last activity, next action.
- **Done when:** Drag changes underlying record and survives refresh; Won triggers handoff only once after review.
- **Depends:** A03
- **Screen reference:** 03 Sales pipeline
- **Review evidence:** PR + test evidence

#### V08 — Define developer Project, Sprint and Issue schema  [Varun; P0; 2d]
- **Why:** Create a safe internal engineering model without duplicating existing Twenty objects.
- **Do these steps:** Audit available Project/Bug/Deployment objects; define minimal Project, Sprint, EngineeringIssue, Release relations and status enums; write migration plan and indexes.
- **Expected screen/output:** Development board can show project and sprint filters, linked client and GitHub PR.
- **Done when:** Sample project with 6 issues saved/retrieved through Twenty API; senior approves schema before migration.
- **Depends:** V01
- **Screen reference:** 08 Developer Kanban
- **Review evidence:** PR + test evidence


### W5 — 28 Dec–1 Jan — Lead ownership + engineering issue APIs

#### N09 — Automate lead owner assignment and follow-up due dates  [Namit; P0; 2d]
- **Why:** New and interested leads need one clear responsible salesperson.
- **Do these steps:** Use round-robin/territory rule configurable by manager; create follow-up tasks on qualified reply; prevent duplicates on event replay.
- **Expected screen/output:** Restaurant row and My Day show assigned salesperson and the exact due date.
- **Done when:** Simulate 10 new leads; all assigned once and replay creates no duplicate follow-ups.
- **Depends:** N07,A07
- **Screen reference:** 03 Sales pipeline
- **Review evidence:** PR + test evidence

#### A09 — Build deal 360° with timeline, meetings and proposal  [Aman; P1; 2d]
- **Why:** Sales can progress a deal without hunting across the CRM.
- **Do these steps:** Add deal tabs: activity, next action, meetings, proposal draft, contacts; link to restaurant record.
- **Expected screen/output:** Single detail page with stage tracker, deal value, dates, timeline, and attachments.
- **Done when:** Create an opportunity, log a demo and view linked communications and assigned tasks.
- **Depends:** A08,N09
- **Screen reference:** 04 Account 360
- **Review evidence:** PR + test evidence

#### V09 — Implement engineering issue CRUD and permissions  [Varun; P0; 2d]
- **Why:** Developers should receive real tasks with assignee, status and acceptance details.
- **Do these steps:** Create API operations to add/update/comment/assign issues and link to Project/Sprint; validate status transitions and scope permissions.
- **Expected screen/output:** Issue drawer contains description, checklist, priority, assignee, due date, PR link, QA result.
- **Done when:** Create/move/reassign issue in staging; non-developer role cannot change restricted fields.
- **Depends:** V08
- **Screen reference:** 15 Engineering issue
- **Review evidence:** PR + test evidence


### W6 — 4–8 Jan — Won-deal onboarding + developer board

#### N10 — Automate Won → onboarding project and deliverables  [Namit; P0; 2d]
- **Why:** A closed deal should generate a complete handoff for implementation.
- **Do these steps:** On Opportunity stage Won, create or link Client Project, service checklist, kickoff task and due dates; use unique event key to prevent duplicates.
- **Expected screen/output:** Deal detail shows Handover created and link to onboarding project.
- **Done when:** One Won event creates one project and matching tasks; repeated event does not create copies.
- **Depends:** N09,V09
- **Screen reference:** 11 Client onboarding
- **Review evidence:** PR + test evidence

#### A10 — Build developer Kanban and client project UI  [Aman; P0; 2d]
- **Why:** Replace technology metrics with a board that developers actually use daily.
- **Do these steps:** Render issues by status Backlog, Ready, Doing, Review, QA, Done; support drag/drop, filters, sprint selector and issue detail drawer.
- **Expected screen/output:** Project header with progress, sprint date, blockers, lead owner; issue cards with priority and due date.
- **Done when:** Issue moved to QA persists; blocked issues visually identified; client can only see permitted view.
- **Depends:** V09,A08
- **Screen reference:** 08 Developer Kanban
- **Review evidence:** PR + test evidence

#### V10 — Add GitHub PR references and read-only status sync  [Varun; P1; 2d]
- **Why:** Make issue status traceable to reviewed code without auto-merging.
- **Do these steps:** Connect authorized repo(s) using scoped token; parse PR URL and branch name; show PR open/merged/check status; handle repository access failures.
- **Expected screen/output:** Issue panel: branch, linked PR, CI checks, last sync; no merge control for interns.
- **Done when:** Two sample PRs resolve correctly; invalid/private URL shows safe message and does not leak token.
- **Depends:** V09
- **Screen reference:** 09 Project detail
- **Review evidence:** PR + test evidence


### W7 — 11–15 Jan — Working MVP: cross-module pilot

#### N11 — Run outreach and handoff end-to-end backend tests  [Namit; P0; 2d]
- **Why:** Prove the complete loop works reliably with no duplicate sending or onboarding.
- **Do these steps:** Test import→approval→queue→provider event→reply→assigned task→Won→project; include service restart and duplicate-event replay.
- **Expected screen/output:** Integrations Health displays test scenario results and last run.
- **Done when:** Pass 12 backend scenarios with timestamps, log IDs and sample data; provide rollback steps.
- **Depends:** N10,N08
- **Screen reference:** 13 Integrations health
- **Review evidence:** PR + test evidence

#### A11 — Deliver integrated executive dashboard and pilot demo  [Aman; P0; 2d]
- **Why:** Managers need useful sales, campaign, task, and delivery summaries.
- **Do these steps:** Connect live aggregate endpoints; add date, region and owner filters; use real counts and clear empty state; verify accessibility.
- **Expected screen/output:** Cards: prospects, eligible, emails sent, replies, demos, won deals, open issues, overdue; trend panels.
- **Done when:** All dashboard numbers reconcile with table filters for 20 sample records; demo captured as short video.
- **Depends:** A10,N11
- **Screen reference:** 01 Executive dashboard
- **Review evidence:** PR + test evidence

#### V11 — Integrate first approved GLM features with pilot UAT  [Varun; P0; 2d]
- **Why:** Make AI classification and drafts useful without bypassing the sales team.
- **Do these steps:** Hook AI insights into the profile and inbox; measure JSON-valid rate/latency; include 30 scored fixtures and fallback when unavailable.
- **Expected screen/output:** AI panels show working/retrying/needs review and human approval record.
- **Done when:** Pilot can generate, edit and reject 5 drafts; model down leaves CRM functional.
- **Depends:** V07,A06
- **Screen reference:** 14 AI workbench
- **Review evidence:** PR + test evidence


### W8 — 18–22 Jan — WhatsApp, analytics and AI recommendations

#### N12 — Verify WhatsApp template and webhook lifecycle  [Namit; P1; 2d]
- **Why:** Reuse existing Meta notification module with correct delivery evidence.
- **Do these steps:** Integrate approved template selection, consent evidence and webhook statuses; log provider ID/failure details; never claim accepted equals delivered.
- **Expected screen/output:** Contact activity shows WhatsApp queued/accepted/sent/delivered/read/failed by actual provider event.
- **Done when:** Meta sandbox/test number can demonstrate statuses and webhook dedupe; blocked contacts cannot send.
- **Depends:** N08,N04
- **Screen reference:** 07 Inbox
- **Review evidence:** PR + test evidence

#### N13 — Publish durable operations health and alerts  [Namit; P1; 2d]
- **Why:** Operators need to know when workers, SMTP, inbox or model are failing.
- **Do these steps:** Add health checks for queue lag, webhook lag, failures, cron last run, integration disabled; add alert thresholds and status history.
- **Expected screen/output:** Integrations page shows green/amber/red state, reason, last healthy time, retry button and logs.
- **Done when:** Kill worker in staging: alert appears; on restart, backlog processes exactly once.
- **Depends:** N11,V02
- **Screen reference:** 13 Integrations health
- **Review evidence:** PR + test evidence

#### A12 — Build campaign and revenue reports  [Aman; P1; 2d]
- **Why:** Managers should measure outcomes beyond emails sent.
- **Do these steps:** Add campaign funnel metrics and market/date filters using durable event counts; create export CSV and denominator definitions.
- **Expected screen/output:** Charts for audience→eligible→sent→delivered(where supported)→replied→demo→won.
- **Done when:** A report filtered to Berlin matches underlying records; unsupported delivery metrics show N/A.
- **Depends:** A11,N06
- **Screen reference:** 12 Reports
- **Review evidence:** PR + test evidence

#### A13 — Polish AI approvals and suggestions UX  [Aman; P1; 2d]
- **Why:** Sales needs to know what AI suggested versus what a human approved.
- **Do these steps:** Make approval queue for drafts, reply intents, task suggestions; add compare/edit and revision history with actor/time.
- **Expected screen/output:** AI Workbench tabs: Drafts, Reply Triage, Next Actions, History; actions require explicit click.
- **Done when:** Approve/reject/change recorded; prohibited automatic send or stage-change cannot be triggered by suggestion.
- **Depends:** V11,V12
- **Screen reference:** 14 AI workbench
- **Review evidence:** PR + test evidence

#### V12 — Build AI next-best-action recommendations  [Varun; P1; 2d]
- **Why:** Recommend safe next steps from existing CRM facts and task history.
- **Do these steps:** Combine rule-based overdue/campaign/reply state with GLM explanation; output suggestion type, rationale, source fields and confidence.
- **Expected screen/output:** My Day and Deal drawer show “Suggested next action” with Accept / Dismiss, no auto-execution.
- **Done when:** 10 fixtures give actionable suggestions with source references; a non-existent client fact is never asserted.
- **Depends:** V11,A07
- **Screen reference:** 14 AI workbench
- **Review evidence:** PR + test evidence

#### V13 — Automate cross-module QA regression cases  [Varun; P1; 2d]
- **Why:** Prevent CRM changes from breaking the sender or developer board.
- **Do these steps:** Add API tests for object relations and idempotency, UI smoke for key screens, model-mocked contract tests for GLM failures.
- **Expected screen/output:** QA view links each test to its scenario and result with build/version.
- **Done when:** CI blocks merging on failing critical tests; tests run with dummy data and no external sends.
- **Depends:** V11,N11
- **Screen reference:** 15 Engineering issue
- **Review evidence:** PR + test evidence


### W9 — 25–29 Jan — Reliability, security and handover

#### N14 — Harden concurrency, queues and recovery  [Namit; P0; 2d]
- **Why:** Prove the sender survives restart, replay and burst traffic safely.
- **Do these steps:** Load-test the batch on staging, cap concurrency, enforce database uniqueness and retries, and check worker/log retention.
- **Expected screen/output:** Operations screen shows retry count, queued age, errors and per-day cap consumption.
- **Done when:** Run 100 synthetic eligible recipients without duplicate sends; failures are isolated and recoverable.
- **Depends:** N13
- **Screen reference:** 13 Integrations health
- **Review evidence:** PR + test evidence

#### N15 — Prepare backend deployment and recovery runbook  [Namit; P1; 2d]
- **Why:** Hand over a service that a developer can operate without guessing.
- **Do these steps:** Document env vars, worker command, migrations, backups, SMTP/Meta setup, dry-run, rollback and incident procedure.
- **Expected screen/output:** Settings page includes links to health, operator runbook and campaign safety state.
- **Done when:** Another developer follows runbook in staging and replays a failed test event successfully.
- **Depends:** N14
- **Screen reference:** 13 Integrations health
- **Review evidence:** PR + test evidence

#### A14 — Complete role-based UI and salesperson UAT  [Aman; P0; 2d]
- **Why:** Verify separate sales, developer, manager and admin experiences.
- **Do these steps:** Test navigation/permissions for four role fixtures; create short how-to instructions with screenshots and keyboard/empty states.
- **Expected screen/output:** Sales sees deals/inbox; developer sees issues; manager sees reports; settings only to authorized roles.
- **Done when:** UAT scripts pass for all roles and restricted actions are hidden or blocked server-side.
- **Depends:** A13,A12
- **Screen reference:** 01 Executive dashboard
- **Review evidence:** PR + test evidence

#### A15 — Responsive polish and final screenshot package  [Aman; P1; 2d]
- **Why:** Make the application coherent, readable and understandable.
- **Do these steps:** Resolve layout issues at 1440, 1024, 768 and 390 px; correct labels; collect before/after screenshots and accessibility checks.
- **Expected screen/output:** Consistent sidebar, tables, drawers, loading/empty/error states across all screens.
- **Done when:** Screen signoff covers 16 mockups and mobile critical flows; zero critical clipping issues.
- **Depends:** A14
- **Screen reference:** 08 Developer Kanban
- **Review evidence:** PR + test evidence

#### V14 — Test prompt injection, data leakage and AI outages  [Varun; P0; 2d]
- **Why:** Validate AI safety before release, especially on untrusted inbound messages.
- **Do these steps:** Add adversarial fixtures with instruction-bearing email body, malformed JSON, and model timeout; audit masking and logs.
- **Expected screen/output:** AI workbench shows “unavailable” and manual fallback rather than blocking sales or doing wrong actions.
- **Done when:** No AI prompt can invoke send/deploy; sensitive env values never appear in output or logs.
- **Depends:** V13
- **Screen reference:** 16 AI operations
- **Review evidence:** PR + test evidence

#### V15 — Prepare final test evidence and AI operating guide  [Varun; P1; 2d]
- **Why:** Make GLM integration sustainable after internship handover.
- **Do these steps:** Write model configuration and evaluation instructions, prompt version process, safe feature flags, monitoring and fallback procedures.
- **Expected screen/output:** AI Health panel lists model version, validation rate, latency, feature status, and fallback mode.
- **Done when:** Lead receives reproducible fixture suite, known limitations, and approval checklist.
- **Depends:** V14
- **Screen reference:** 16 AI operations
- **Review evidence:** PR + test evidence


## 9. Target screen gallery (PNG names in ZIP)

1. **Executive dashboard** — `01_executive_dashboard.png`. Prospects, eligible audience, send/reply/demo/won counts and issue health. Each KPI opens a filtered record list.
2. **Restaurant prospect list** — `02_restaurant_prospects.png`. Search/filter by market and owner; accurate email validity, consent review and next action; import preview.
3. **Opportunity Kanban** — `03_sales_pipeline.png`. Stage drag/drop must persist and validate missing mandatory stage fields; use standard Opportunity where possible.
4. **Restaurant / account 360°** — `04_account_360.png`. Contacts, source, evidence, campaign sends, inbound replies, tasks, demos and deal history in one timeline.
5. **Campaign composer** — `05_campaign_builder.png`. Audience→Content→Preview→Approval→Schedule; no external send before approver and eligibility gates.
6. **Outreach queue** — `06_outreach_queue.png`. Distinct queued, accepted, delivered, failed and replied labels; detail panel exposes provider and retry reason.
7. **Shared inbox and My Day** — `07_inbox_activity.png`. Conversation thread, owner, intent suggestion, follow-up, unread and unmatched-identity queues.
8. **Developer Kanban** — `08_developer_kanban.png`. Backlog→Ready→In Progress→Review→QA→Done, with sprint/project filters and due-date badges.
9. **Project and QA details** — `09_project_detail.png`. Project milestone list, linked issues, PR state, blockers, QA outcome and upcoming releases.
10. **Automation rules** — `10_automation_builder.png`. Triggers, conditions, actions, approvals, dry-run, event logs and failure/retry handling.
11. **Won-deal onboarding** — `11_client_onboarding.png`. Service package checklist, assignees, dates, deliverables, progress and salesperson/developer handoff.
12. **Reports & revenue analytics** — `12_analytics.png`. Conversion rates with precise denominators; data filters for date, owner, market and campaign.
13. **Integration health** — `13_integrations_health.png`. Twenty DB, worker, Redis, SMTP, inbound mailbox, Meta, GLM and GitHub statuses with last-check time.
14. **AI suggestion approval workbench** — `14_ai_workbench.png`. GLM draft/email/intent/next-action suggestions remain editable; approval and audit history visible.
15. **Developer sprint workboard** — `15_engineering_sprint.png`. Task cards show owner, priority, due date, status, expected outcome, QA and linked PR.
16. **Ollama GLM operations** — `16_ai_operations.png`. Model identity, capability test, latency, validation rate and manual fallback; never reveal secrets.

## 10. Acceptance / test gate

| Test | Scenario | Expected result |
|---|---|---|
| AT-01 | Import same 100-row CSV twice | No duplicate restaurant added on second import |
| AT-02 | Upload CSV with invalid phone and missing email | Flag or exclude with reasons; original import source retained |
| AT-03 | Run campaign preview without approval | No external send or queue entry |
| AT-04 | Run two copies of batch worker | Exactly one send per prospect/campaign idempotency key |
| AT-05 | Force worker restart mid-batch | Unprocessed sends safely resume, completed ones do not duplicate |
| AT-06 | Send with missing contact policy evidence for Germany | Blocked/pending legal review; no automated unsolicited send |
| AT-07 | Fake webhook duplicated three times | Only one effective status event/transition |
| AT-08 | Provider reports accepted but not delivered | UI says accepted, not delivered |
| AT-09 | Provider reports bounced | Contact suppressed for future email campaigns |
| AT-10 | Inbound reply with In-Reply-To matches thread | Correct restaurant and owner receive activity/task |
| AT-11 | Incoming message says unsubscribe | Immediate suppression and visible case |
| AT-12 | Drag opportunity from Demo to Won | Stage persisted; onboarding created once only |
| AT-13 | Developer moves issue to QA | Record persists; accepted PR not auto-merged |
| AT-14 | GLM returns invalid JSON | Controlled error and human fallback; no mutation |
| AT-15 | GLM server unavailable | CRM use, email history and Kanban continue functioning |
| AT-16 | Prompt-injection inside incoming email | AI cannot trigger send/deploy/secret access |
| AT-17 | Sales role visits admin page | Forbidden actions blocked at backend too |
| AT-18 | Dashboard filter Berlin last 30 days | KPI equals underlying filtered record count |

## 11. Definition of Done / workflow

Use **Backlog → Ready → In Progress → Code Review → QA → Done**, plus **Blocked**. A task is Done only with linked PR, reviewer approval, tests passing, updated mockup if UI changed, evidence screenshot/video, and correct staging data. No direct production releases by interns. Managers approve actual campaigns and releases. Report blocker after 2 hours and unblock at standup.

**Daily:** 15-minute standup; update ticket status with branch and blocker. **Thursday:** integration QA. **Friday:** demo to lead using real staging fixture and release checklist. **No live outreach** from test runs.

## 12. Launch gates / safety

- Backups/rollback verified, actual deployed Twenty version pinned, staging/production separated.
- Source/permission fields reviewed before any German/EU prospect email; do not equate scraping/public listing with permission to market.
- Message status distinguishes queued/accepted/sent/delivered/read, only when corresponding provider evidence exists.
- CRM role checks run server-side; secrets stay in environment/config vault.
- AI suggestions and actions are audit-logged; model outage never blocks manual operations.
- Automated outreach to real recipients remains disabled until appropriate review/approval.


## 13. Decisions/inputs required from project lead

1. Confirm which repo/branch and deployed commit is active (the repo is an implementation reference, not a live audit).
2. Grant staging and limited repo access; designate senior reviewer and allowed test mailboxes.
3. Provide exact internal Ollama URL/model tag via secure channel (not in doc).
4. Confirm provider callbacks, German-market campaign legal review and opt-out handling.
5. Decide which teams/roles may approve drafts, send campaigns, migrate data, and deploy.
6. Confirm employee leave/holiday availability before promising calendar dates.


## 14. Source references

- [Verified source code (GitHub connector)](https://github.com/avinashbuddana/wingerxCrm)
- [Twenty developer docs](https://docs.twenty.com/developers/extend/apps/getting-started)
- [Twenty workflow how-to](https://docs.twenty.com/user-guide/workflows/how-tos/crm-automations/notify-teammates-of-note-to-review)
- [Ollama /api/chat](https://docs.ollama.com/api/chat)
- [Ollama OpenAI compatibility](https://docs.ollama.com/api/openai-compatibility)
- [Ollama structured output](https://docs.ollama.com/capabilities/structured-outputs)
- [Ollama tool calling](https://docs.ollama.com/capabilities/tool-calling)

---

Implementation tracking: GitHub Issues bearing `N01–N15`, `A01–A15`, `V01–V15`. Owner names in issues are planned personnel assignments until GitHub usernames are verified.
