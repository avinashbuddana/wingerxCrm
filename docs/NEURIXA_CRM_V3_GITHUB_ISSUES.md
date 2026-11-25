# Neurixa / WingerX Twenty CRM V3 — GitHub task index

**Master tracker:** [#53 — Namit, Aman & Varun](https://github.com/avinashbuddana/wingerxCrm/issues/53)
**All tasks:** [WingerX CRM GitHub Issues](https://github.com/avinashbuddana/wingerxCrm/issues)
**Functional blueprint:** [V3 Roadmap](./NEURIXA_CRM_V3_INTERN_ROADMAP.md)

## How interns work
1. Choose your task below. Confirm dependencies are complete before development.
2. Create a feature branch and implement the changes in this **same** Twenty repository.
3. Open a pull request linking the task issue; attach staging screenshots and tests.
4. Senior lead reviews, QA verifies acceptance criteria, then issue moves to Done.
5. Personal names indicate ownership; assign GitHub handles after verifying their usernames.

## Ticket index — full team

| ID | Intern | Sprint | Due | Priority | Issue / title | Depends on |
|---|---|---|---|---|---|---|
| N01 | Namit | W0 | 2026-11-27 | P0 | [#8 Audit existing email sender, workers, and persistence](https://github.com/avinashbuddana/wingerxCrm/issues/8) | — |
| A01 | Aman | W0 | 2026-11-27 | P0 | [#9 Map current CRM screens and design navigation](https://github.com/avinashbuddana/wingerxCrm/issues/9) | — |
| V01 | Varun | W0 | 2026-11-27 | P0 | [#10 Verify self-hosted Ollama GLM model safely](https://github.com/avinashbuddana/wingerxCrm/issues/10) | — |
| N02 | Namit | W1 | 2026-12-04 | P0 | [#11 Normalize restaurant import and deduplication](https://github.com/avinashbuddana/wingerxCrm/issues/11) | [N01](https://github.com/avinashbuddana/wingerxCrm/issues/8) |
| N03 | Namit | W1 | 2026-12-04 | P0 | [#12 Write status dictionary and transition contract](https://github.com/avinashbuddana/wingerxCrm/issues/12) | [N01](https://github.com/avinashbuddana/wingerxCrm/issues/8) |
| A02 | Aman | W1 | 2026-12-04 | P0 | [#13 Build searchable Restaurant Prospect list](https://github.com/avinashbuddana/wingerxCrm/issues/13) | [A01](https://github.com/avinashbuddana/wingerxCrm/issues/9),[N02](https://github.com/avinashbuddana/wingerxCrm/issues/11) |
| A03 | Aman | W1 | 2026-12-04 | P1 | [#14 Build restaurant 360° detail drawer](https://github.com/avinashbuddana/wingerxCrm/issues/14) | [A02](https://github.com/avinashbuddana/wingerxCrm/issues/13) |
| V02 | Varun | W1 | 2026-12-04 | P0 | [#15 Create private Ollama AI gateway in backend](https://github.com/avinashbuddana/wingerxCrm/issues/15) | [V01](https://github.com/avinashbuddana/wingerxCrm/issues/10) |
| V03 | Varun | W1 | 2026-12-04 | P0 | [#16 Add GLM output validation and safety policy](https://github.com/avinashbuddana/wingerxCrm/issues/16) | [V02](https://github.com/avinashbuddana/wingerxCrm/issues/15) |
| N04 | Namit | W2 | 2026-12-11 | P0 | [#17 Persist outbound message history](https://github.com/avinashbuddana/wingerxCrm/issues/17) | [N03](https://github.com/avinashbuddana/wingerxCrm/issues/12) |
| N05 | Namit | W2 | 2026-12-11 | P0 | [#18 Make scheduled email batch safe and observable](https://github.com/avinashbuddana/wingerxCrm/issues/18) | [N02](https://github.com/avinashbuddana/wingerxCrm/issues/11),[N04](https://github.com/avinashbuddana/wingerxCrm/issues/17) |
| A04 | Aman | W2 | 2026-12-11 | P0 | [#19 Create campaign queue and per-recipient log screen](https://github.com/avinashbuddana/wingerxCrm/issues/19) | [N04](https://github.com/avinashbuddana/wingerxCrm/issues/17) |
| A05 | Aman | W2 | 2026-12-11 | P0 | [#20 Create campaign composer with approval preview](https://github.com/avinashbuddana/wingerxCrm/issues/20) | [A04](https://github.com/avinashbuddana/wingerxCrm/issues/19),[V03](https://github.com/avinashbuddana/wingerxCrm/issues/16) |
| V04 | Varun | W2 | 2026-12-11 | P1 | [#21 AI prospect classification with reason](https://github.com/avinashbuddana/wingerxCrm/issues/21) | [V03](https://github.com/avinashbuddana/wingerxCrm/issues/16),[N02](https://github.com/avinashbuddana/wingerxCrm/issues/11) |
| V05 | Varun | W2 | 2026-12-11 | P1 | [#22 AI-generated email draft with review gate](https://github.com/avinashbuddana/wingerxCrm/issues/22) | [V03](https://github.com/avinashbuddana/wingerxCrm/issues/16),[A05](https://github.com/avinashbuddana/wingerxCrm/issues/20) |
| N06 | Namit | W3 | 2026-12-18 | P0 | [#23 Record provider delivery and failure events](https://github.com/avinashbuddana/wingerxCrm/issues/23) | [N04](https://github.com/avinashbuddana/wingerxCrm/issues/17) |
| N07 | Namit | W3 | 2026-12-18 | P0 | [#24 Sync inbound email and match replies to contacts](https://github.com/avinashbuddana/wingerxCrm/issues/24) | [N04](https://github.com/avinashbuddana/wingerxCrm/issues/17),[N06](https://github.com/avinashbuddana/wingerxCrm/issues/23) |
| A06 | Aman | W3 | 2026-12-18 | P0 | [#25 Build shared inbox and reply triage screen](https://github.com/avinashbuddana/wingerxCrm/issues/25) | [N07](https://github.com/avinashbuddana/wingerxCrm/issues/24) |
| A07 | Aman | W3 | 2026-12-18 | P1 | [#26 Add salesperson daily work and follow-up drawer](https://github.com/avinashbuddana/wingerxCrm/issues/26) | [A06](https://github.com/avinashbuddana/wingerxCrm/issues/25) |
| V06 | Varun | W3 | 2026-12-18 | P1 | [#27 Score leads with explainable AI and business rules](https://github.com/avinashbuddana/wingerxCrm/issues/27) | [V04](https://github.com/avinashbuddana/wingerxCrm/issues/21),[A02](https://github.com/avinashbuddana/wingerxCrm/issues/13) |
| V07 | Varun | W3 | 2026-12-18 | P1 | [#28 Classify replies and draft follow-up recommendations](https://github.com/avinashbuddana/wingerxCrm/issues/28) | [N07](https://github.com/avinashbuddana/wingerxCrm/issues/24),[V03](https://github.com/avinashbuddana/wingerxCrm/issues/16) |
| N08 | Namit | W4 | 2026-12-25 | P0 | [#29 Implement send eligibility, consent and opt-out checks](https://github.com/avinashbuddana/wingerxCrm/issues/29) | [N05](https://github.com/avinashbuddana/wingerxCrm/issues/18),[N07](https://github.com/avinashbuddana/wingerxCrm/issues/24) |
| A08 | Aman | W4 | 2026-12-25 | P0 | [#30 Finish drag-and-drop sales opportunity Kanban](https://github.com/avinashbuddana/wingerxCrm/issues/30) | [A03](https://github.com/avinashbuddana/wingerxCrm/issues/14) |
| V08 | Varun | W4 | 2026-12-25 | P0 | [#31 Define developer Project, Sprint and Issue schema](https://github.com/avinashbuddana/wingerxCrm/issues/31) | [V01](https://github.com/avinashbuddana/wingerxCrm/issues/10) |
| N09 | Namit | W5 | 2027-01-01 | P0 | [#32 Automate lead owner assignment and follow-up due dates](https://github.com/avinashbuddana/wingerxCrm/issues/32) | [N07](https://github.com/avinashbuddana/wingerxCrm/issues/24),[A07](https://github.com/avinashbuddana/wingerxCrm/issues/26) |
| A09 | Aman | W5 | 2027-01-01 | P1 | [#33 Build deal 360° with timeline, meetings and proposal](https://github.com/avinashbuddana/wingerxCrm/issues/33) | [A08](https://github.com/avinashbuddana/wingerxCrm/issues/30),[N09](https://github.com/avinashbuddana/wingerxCrm/issues/32) |
| V09 | Varun | W5 | 2027-01-01 | P0 | [#34 Implement engineering issue CRUD and permissions](https://github.com/avinashbuddana/wingerxCrm/issues/34) | [V08](https://github.com/avinashbuddana/wingerxCrm/issues/31) |
| N10 | Namit | W6 | 2027-01-08 | P0 | [#35 Automate Won → onboarding project and deliverables](https://github.com/avinashbuddana/wingerxCrm/issues/35) | [N09](https://github.com/avinashbuddana/wingerxCrm/issues/32),[V09](https://github.com/avinashbuddana/wingerxCrm/issues/34) |
| A10 | Aman | W6 | 2027-01-08 | P0 | [#36 Build developer Kanban and client project UI](https://github.com/avinashbuddana/wingerxCrm/issues/36) | [V09](https://github.com/avinashbuddana/wingerxCrm/issues/34),[A08](https://github.com/avinashbuddana/wingerxCrm/issues/30) |
| V10 | Varun | W6 | 2027-01-08 | P1 | [#37 Add GitHub PR references and read-only status sync](https://github.com/avinashbuddana/wingerxCrm/issues/37) | [V09](https://github.com/avinashbuddana/wingerxCrm/issues/34) |
| N11 | Namit | W7 | 2027-01-15 | P0 | [#38 Run outreach and handoff end-to-end backend tests](https://github.com/avinashbuddana/wingerxCrm/issues/38) | [N10](https://github.com/avinashbuddana/wingerxCrm/issues/35),[N08](https://github.com/avinashbuddana/wingerxCrm/issues/29) |
| A11 | Aman | W7 | 2027-01-15 | P0 | [#39 Deliver integrated executive dashboard and pilot demo](https://github.com/avinashbuddana/wingerxCrm/issues/39) | [A10](https://github.com/avinashbuddana/wingerxCrm/issues/36),[N11](https://github.com/avinashbuddana/wingerxCrm/issues/38) |
| V11 | Varun | W7 | 2027-01-15 | P0 | [#40 Integrate first approved GLM features with pilot UAT](https://github.com/avinashbuddana/wingerxCrm/issues/40) | [V07](https://github.com/avinashbuddana/wingerxCrm/issues/28),[A06](https://github.com/avinashbuddana/wingerxCrm/issues/25) |
| N12 | Namit | W8 | 2027-01-22 | P1 | [#41 Verify WhatsApp template and webhook lifecycle](https://github.com/avinashbuddana/wingerxCrm/issues/41) | [N08](https://github.com/avinashbuddana/wingerxCrm/issues/29),[N04](https://github.com/avinashbuddana/wingerxCrm/issues/17) |
| N13 | Namit | W8 | 2027-01-22 | P1 | [#42 Publish durable operations health and alerts](https://github.com/avinashbuddana/wingerxCrm/issues/42) | [N11](https://github.com/avinashbuddana/wingerxCrm/issues/38),[V02](https://github.com/avinashbuddana/wingerxCrm/issues/15) |
| A12 | Aman | W8 | 2027-01-22 | P1 | [#43 Build campaign and revenue reports](https://github.com/avinashbuddana/wingerxCrm/issues/43) | [A11](https://github.com/avinashbuddana/wingerxCrm/issues/39),[N06](https://github.com/avinashbuddana/wingerxCrm/issues/23) |
| A13 | Aman | W8 | 2027-01-22 | P1 | [#44 Polish AI approvals and suggestions UX](https://github.com/avinashbuddana/wingerxCrm/issues/44) | [V11](https://github.com/avinashbuddana/wingerxCrm/issues/40),[V12](https://github.com/avinashbuddana/wingerxCrm/issues/45) |
| V12 | Varun | W8 | 2027-01-22 | P1 | [#45 Build AI next-best-action recommendations](https://github.com/avinashbuddana/wingerxCrm/issues/45) | [V11](https://github.com/avinashbuddana/wingerxCrm/issues/40),[A07](https://github.com/avinashbuddana/wingerxCrm/issues/26) |
| V13 | Varun | W8 | 2027-01-22 | P1 | [#46 Automate cross-module QA regression cases](https://github.com/avinashbuddana/wingerxCrm/issues/46) | [V11](https://github.com/avinashbuddana/wingerxCrm/issues/40),[N11](https://github.com/avinashbuddana/wingerxCrm/issues/38) |
| N14 | Namit | W9 | 2027-01-29 | P0 | [#47 Harden concurrency, queues and recovery](https://github.com/avinashbuddana/wingerxCrm/issues/47) | [N13](https://github.com/avinashbuddana/wingerxCrm/issues/42) |
| N15 | Namit | W9 | 2027-01-29 | P1 | [#48 Prepare backend deployment and recovery runbook](https://github.com/avinashbuddana/wingerxCrm/issues/48) | [N14](https://github.com/avinashbuddana/wingerxCrm/issues/47) |
| A14 | Aman | W9 | 2027-01-29 | P0 | [#49 Complete role-based UI and salesperson UAT](https://github.com/avinashbuddana/wingerxCrm/issues/49) | [A13](https://github.com/avinashbuddana/wingerxCrm/issues/44),[A12](https://github.com/avinashbuddana/wingerxCrm/issues/43) |
| A15 | Aman | W9 | 2027-01-29 | P1 | [#50 Responsive polish and final screenshot package](https://github.com/avinashbuddana/wingerxCrm/issues/50) | [A14](https://github.com/avinashbuddana/wingerxCrm/issues/49) |
| V14 | Varun | W9 | 2027-01-29 | P0 | [#51 Test prompt injection, data leakage and AI outages](https://github.com/avinashbuddana/wingerxCrm/issues/51) | [V13](https://github.com/avinashbuddana/wingerxCrm/issues/46) |
| V15 | Varun | W9 | 2027-01-29 | P1 | [#52 Prepare final test evidence and AI operating guide](https://github.com/avinashbuddana/wingerxCrm/issues/52) | [V14](https://github.com/avinashbuddana/wingerxCrm/issues/51) |

## Release checkpoints

- **Week 0:** 25–27 November 2026 — existing code/UI audit + Ollama verification
- **Weeks 1–3:** 30 November–18 December 2026 — restaurant data, outreach reliability, inbox and GLM gateway
- **Weeks 4–6:** 21 December 2026–8 January 2027 — consent, sales, developer Kanban and onboarding
- **Week 7:** 11–15 January 2027 — MVP pilot
- **Weeks 8–9:** 18–29 January 2027 — reporting, WhatsApp, hardening and AI safety

Historical original issues remain available at [CRM-automation](https://github.com/avinashbuddana/CRM-automation/issues), but no new work should be recorded there.
