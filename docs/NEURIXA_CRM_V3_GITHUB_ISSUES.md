# Neurixa / WingerX Twenty CRM V3 — GitHub task index

**Issues & team board:** [45 issues and master tracker](https://github.com/avinashbuddana/CRM-automation/issues/46)
**Implementation repository:** [avinashbuddana/wingerxCrm](https://github.com/avinashbuddana/wingerxCrm)
**Full implementation blueprint:** [Neurixa CRM V3 Roadmap](./NEURIXA_CRM_V3_INTERN_ROADMAP.md)

## How to work on a ticket

1. Open the issue assigned to your name in the index below. GitHub assignments are pending verified account names.
2. Check prerequisite tasks (linked below) and read the expected output/acceptance criteria.
3. Create a feature branch in the **WingerX Twenty CRM code repository**, not this tracker repository.
4. Create a PR and reference the full tracking issue, for example `avinashbuddana/CRM-automation#1`.
5. Add staging screenshots/tests and obtain senior review before merging or deploying.
6. Comment progress and blockers on the tracking issue; close it only when acceptance criteria are met.

## Ownership and deadlines

| ID | Intern | Sprint | Due date | Priority | Task / GitHub issue | Prerequisites |
|---|---|---|---|---|---|---|
| N01 | Namit | W0 | 2026-11-27 | P0 | [#1 Audit existing email sender, workers, and persistence](https://github.com/avinashbuddana/CRM-automation/issues/1) | — |
| A01 | Aman | W0 | 2026-11-27 | P0 | [#2 Map current CRM screens and design navigation](https://github.com/avinashbuddana/CRM-automation/issues/2) | — |
| V01 | Varun | W0 | 2026-11-27 | P0 | [#3 Verify self-hosted Ollama GLM model safely](https://github.com/avinashbuddana/CRM-automation/issues/3) | — |
| N02 | Namit | W1 | 2026-12-04 | P0 | [#4 Normalize restaurant import and deduplication](https://github.com/avinashbuddana/CRM-automation/issues/4) | [N01](https://github.com/avinashbuddana/CRM-automation/issues/1) |
| N03 | Namit | W1 | 2026-12-04 | P0 | [#5 Write status dictionary and transition contract](https://github.com/avinashbuddana/CRM-automation/issues/5) | [N01](https://github.com/avinashbuddana/CRM-automation/issues/1) |
| A02 | Aman | W1 | 2026-12-04 | P0 | [#6 Build searchable Restaurant Prospect list](https://github.com/avinashbuddana/CRM-automation/issues/6) | [A01](https://github.com/avinashbuddana/CRM-automation/issues/2), [N02](https://github.com/avinashbuddana/CRM-automation/issues/4) |
| A03 | Aman | W1 | 2026-12-04 | P1 | [#7 Build restaurant 360° detail drawer](https://github.com/avinashbuddana/CRM-automation/issues/7) | [A02](https://github.com/avinashbuddana/CRM-automation/issues/6) |
| V02 | Varun | W1 | 2026-12-04 | P0 | [#8 Create private Ollama AI gateway in backend](https://github.com/avinashbuddana/CRM-automation/issues/8) | [V01](https://github.com/avinashbuddana/CRM-automation/issues/3) |
| V03 | Varun | W1 | 2026-12-04 | P0 | [#9 Add GLM output validation and safety policy](https://github.com/avinashbuddana/CRM-automation/issues/9) | [V02](https://github.com/avinashbuddana/CRM-automation/issues/8) |
| N04 | Namit | W2 | 2026-12-11 | P0 | [#10 Persist outbound message history](https://github.com/avinashbuddana/CRM-automation/issues/10) | [N03](https://github.com/avinashbuddana/CRM-automation/issues/5) |
| N05 | Namit | W2 | 2026-12-11 | P0 | [#11 Make scheduled email batch safe and observable](https://github.com/avinashbuddana/CRM-automation/issues/11) | [N02](https://github.com/avinashbuddana/CRM-automation/issues/4), [N04](https://github.com/avinashbuddana/CRM-automation/issues/10) |
| A04 | Aman | W2 | 2026-12-11 | P0 | [#12 Create campaign queue and per-recipient log screen](https://github.com/avinashbuddana/CRM-automation/issues/12) | [N04](https://github.com/avinashbuddana/CRM-automation/issues/10) |
| A05 | Aman | W2 | 2026-12-11 | P0 | [#13 Create campaign composer with approval preview](https://github.com/avinashbuddana/CRM-automation/issues/13) | [A04](https://github.com/avinashbuddana/CRM-automation/issues/12), [V03](https://github.com/avinashbuddana/CRM-automation/issues/9) |
| V04 | Varun | W2 | 2026-12-11 | P1 | [#14 AI prospect classification with reason](https://github.com/avinashbuddana/CRM-automation/issues/14) | [V03](https://github.com/avinashbuddana/CRM-automation/issues/9), [N02](https://github.com/avinashbuddana/CRM-automation/issues/4) |
| V05 | Varun | W2 | 2026-12-11 | P1 | [#15 AI-generated email draft with review gate](https://github.com/avinashbuddana/CRM-automation/issues/15) | [V03](https://github.com/avinashbuddana/CRM-automation/issues/9), [A05](https://github.com/avinashbuddana/CRM-automation/issues/13) |
| N06 | Namit | W3 | 2026-12-18 | P0 | [#16 Record provider delivery and failure events](https://github.com/avinashbuddana/CRM-automation/issues/16) | [N04](https://github.com/avinashbuddana/CRM-automation/issues/10) |
| N07 | Namit | W3 | 2026-12-18 | P0 | [#17 Sync inbound email and match replies to contacts](https://github.com/avinashbuddana/CRM-automation/issues/17) | [N04](https://github.com/avinashbuddana/CRM-automation/issues/10), [N06](https://github.com/avinashbuddana/CRM-automation/issues/16) |
| A06 | Aman | W3 | 2026-12-18 | P0 | [#18 Build shared inbox and reply triage screen](https://github.com/avinashbuddana/CRM-automation/issues/18) | [N07](https://github.com/avinashbuddana/CRM-automation/issues/17) |
| A07 | Aman | W3 | 2026-12-18 | P1 | [#19 Add salesperson daily work and follow-up drawer](https://github.com/avinashbuddana/CRM-automation/issues/19) | [A06](https://github.com/avinashbuddana/CRM-automation/issues/18) |
| V06 | Varun | W3 | 2026-12-18 | P1 | [#20 Score leads with explainable AI and business rules](https://github.com/avinashbuddana/CRM-automation/issues/20) | [V04](https://github.com/avinashbuddana/CRM-automation/issues/14), [A02](https://github.com/avinashbuddana/CRM-automation/issues/6) |
| V07 | Varun | W3 | 2026-12-18 | P1 | [#21 Classify replies and draft follow-up recommendations](https://github.com/avinashbuddana/CRM-automation/issues/21) | [N07](https://github.com/avinashbuddana/CRM-automation/issues/17), [V03](https://github.com/avinashbuddana/CRM-automation/issues/9) |
| N08 | Namit | W4 | 2026-12-25 | P0 | [#22 Implement send eligibility, consent and opt-out checks](https://github.com/avinashbuddana/CRM-automation/issues/22) | [N05](https://github.com/avinashbuddana/CRM-automation/issues/11), [N07](https://github.com/avinashbuddana/CRM-automation/issues/17) |
| A08 | Aman | W4 | 2026-12-25 | P0 | [#23 Finish drag-and-drop sales opportunity Kanban](https://github.com/avinashbuddana/CRM-automation/issues/23) | [A03](https://github.com/avinashbuddana/CRM-automation/issues/7) |
| V08 | Varun | W4 | 2026-12-25 | P0 | [#24 Define developer Project, Sprint and Issue schema](https://github.com/avinashbuddana/CRM-automation/issues/24) | [V01](https://github.com/avinashbuddana/CRM-automation/issues/3) |
| N09 | Namit | W5 | 2027-01-01 | P0 | [#25 Automate lead owner assignment and follow-up due dates](https://github.com/avinashbuddana/CRM-automation/issues/25) | [N07](https://github.com/avinashbuddana/CRM-automation/issues/17), [A07](https://github.com/avinashbuddana/CRM-automation/issues/19) |
| A09 | Aman | W5 | 2027-01-01 | P1 | [#26 Build deal 360° with timeline, meetings and proposal](https://github.com/avinashbuddana/CRM-automation/issues/26) | [A08](https://github.com/avinashbuddana/CRM-automation/issues/23), [N09](https://github.com/avinashbuddana/CRM-automation/issues/25) |
| V09 | Varun | W5 | 2027-01-01 | P0 | [#27 Implement engineering issue CRUD and permissions](https://github.com/avinashbuddana/CRM-automation/issues/27) | [V08](https://github.com/avinashbuddana/CRM-automation/issues/24) |
| N10 | Namit | W6 | 2027-01-08 | P0 | [#28 Automate Won → onboarding project and deliverables](https://github.com/avinashbuddana/CRM-automation/issues/28) | [N09](https://github.com/avinashbuddana/CRM-automation/issues/25), [V09](https://github.com/avinashbuddana/CRM-automation/issues/27) |
| A10 | Aman | W6 | 2027-01-08 | P0 | [#29 Build developer Kanban and client project UI](https://github.com/avinashbuddana/CRM-automation/issues/29) | [V09](https://github.com/avinashbuddana/CRM-automation/issues/27), [A08](https://github.com/avinashbuddana/CRM-automation/issues/23) |
| V10 | Varun | W6 | 2027-01-08 | P1 | [#30 Add GitHub PR references and read-only status sync](https://github.com/avinashbuddana/CRM-automation/issues/30) | [V09](https://github.com/avinashbuddana/CRM-automation/issues/27) |
| N11 | Namit | W7 | 2027-01-15 | P0 | [#31 Run outreach and handoff end-to-end backend tests](https://github.com/avinashbuddana/CRM-automation/issues/31) | [N10](https://github.com/avinashbuddana/CRM-automation/issues/28), [N08](https://github.com/avinashbuddana/CRM-automation/issues/22) |
| A11 | Aman | W7 | 2027-01-15 | P0 | [#32 Deliver integrated executive dashboard and pilot demo](https://github.com/avinashbuddana/CRM-automation/issues/32) | [A10](https://github.com/avinashbuddana/CRM-automation/issues/29), [N11](https://github.com/avinashbuddana/CRM-automation/issues/31) |
| V11 | Varun | W7 | 2027-01-15 | P0 | [#33 Integrate first approved GLM features with pilot UAT](https://github.com/avinashbuddana/CRM-automation/issues/33) | [V07](https://github.com/avinashbuddana/CRM-automation/issues/21), [A06](https://github.com/avinashbuddana/CRM-automation/issues/18) |
| N12 | Namit | W8 | 2027-01-22 | P1 | [#34 Verify WhatsApp template and webhook lifecycle](https://github.com/avinashbuddana/CRM-automation/issues/34) | [N08](https://github.com/avinashbuddana/CRM-automation/issues/22), [N04](https://github.com/avinashbuddana/CRM-automation/issues/10) |
| N13 | Namit | W8 | 2027-01-22 | P1 | [#35 Publish durable operations health and alerts](https://github.com/avinashbuddana/CRM-automation/issues/35) | [N11](https://github.com/avinashbuddana/CRM-automation/issues/31), [V02](https://github.com/avinashbuddana/CRM-automation/issues/8) |
| A12 | Aman | W8 | 2027-01-22 | P1 | [#36 Build campaign and revenue reports](https://github.com/avinashbuddana/CRM-automation/issues/36) | [A11](https://github.com/avinashbuddana/CRM-automation/issues/32), [N06](https://github.com/avinashbuddana/CRM-automation/issues/16) |
| A13 | Aman | W8 | 2027-01-22 | P1 | [#37 Polish AI approvals and suggestions UX](https://github.com/avinashbuddana/CRM-automation/issues/37) | [V11](https://github.com/avinashbuddana/CRM-automation/issues/33), [V12](https://github.com/avinashbuddana/CRM-automation/issues/38) |
| V12 | Varun | W8 | 2027-01-22 | P1 | [#38 Build AI next-best-action recommendations](https://github.com/avinashbuddana/CRM-automation/issues/38) | [V11](https://github.com/avinashbuddana/CRM-automation/issues/33), [A07](https://github.com/avinashbuddana/CRM-automation/issues/19) |
| V13 | Varun | W8 | 2027-01-22 | P1 | [#39 Automate cross-module QA regression cases](https://github.com/avinashbuddana/CRM-automation/issues/39) | [V11](https://github.com/avinashbuddana/CRM-automation/issues/33), [N11](https://github.com/avinashbuddana/CRM-automation/issues/31) |
| N14 | Namit | W9 | 2027-01-29 | P0 | [#40 Harden concurrency, queues and recovery](https://github.com/avinashbuddana/CRM-automation/issues/40) | [N13](https://github.com/avinashbuddana/CRM-automation/issues/35) |
| N15 | Namit | W9 | 2027-01-29 | P1 | [#41 Prepare backend deployment and recovery runbook](https://github.com/avinashbuddana/CRM-automation/issues/41) | [N14](https://github.com/avinashbuddana/CRM-automation/issues/40) |
| A14 | Aman | W9 | 2027-01-29 | P0 | [#42 Complete role-based UI and salesperson UAT](https://github.com/avinashbuddana/CRM-automation/issues/42) | [A13](https://github.com/avinashbuddana/CRM-automation/issues/37), [A12](https://github.com/avinashbuddana/CRM-automation/issues/36) |
| A15 | Aman | W9 | 2027-01-29 | P1 | [#43 Responsive polish and final screenshot package](https://github.com/avinashbuddana/CRM-automation/issues/43) | [A14](https://github.com/avinashbuddana/CRM-automation/issues/42) |
| V14 | Varun | W9 | 2027-01-29 | P0 | [#44 Test prompt injection, data leakage and AI outages](https://github.com/avinashbuddana/CRM-automation/issues/44) | [V13](https://github.com/avinashbuddana/CRM-automation/issues/39) |
| V15 | Varun | W9 | 2027-01-29 | P1 | [#45 Prepare final test evidence and AI operating guide](https://github.com/avinashbuddana/CRM-automation/issues/45) | [V14](https://github.com/avinashbuddana/CRM-automation/issues/44) |

## Review and security gates

- No bulk emails or WhatsApp template sends without approval and policy checks.
- The GLM/Ollama model must be reached via a private backend gateway; keep credentials out of GitHub.
- Do not change production credentials or deploy production directly as an intern.
- QA evidence is mandatory for closing a task.

**Important:** GitHub Issues were disabled for `avinashbuddana/wingerxCrm` on 25 November 2026. The tasks therefore use `avinashbuddana/CRM-automation` solely for issue tracking; implementation code remains in this repository.
