# WingerX CRM — Production Deployment

This fork contains the WingerX Sales + Tech Command Center on top of Twenty CRM. The custom dashboard is available at `/wingerx` after login and is linked directly from the main navigation.

## What is included

- Sales command center with pipeline, won/lost, weighted forecast, average deal size, stage funnel, lead source distribution, owner performance, stale-deal detection, high-value deal detection, overdue follow-up detection, and largest-open-deal views.
- Tech command center with Projects, Technical Requests, Bugs, Incidents, Deployments and Feature Requests auto-detection, critical-work detection, stale-work detection, deployment health, project progress and attention queues.
- Automation rule center for stale opportunities, high-value deals, overdue tasks, critical technical work, stale engineering work and new lead intake.
- Native Twenty AI integration. The Sales, Tech and Executive AI buttons prefill Twenty's built-in AI chat with workspace-aware analysis prompts.
- Schema-aware object/field detection. WingerX does not hard-code workspace record IDs and safely ignores fields that do not exist or are not readable.
- Production Dockerfile and Render Blueprint with a web server, queue worker, PostgreSQL and Redis-compatible Key Value service.

## Deploy on Render

Use Render Blueprint deployment and select this repository. Render will read `render.yaml` and create:

- `wingerx-crm` — Twenty web/server service
- `wingerx-worker` — Twenty queue/background worker
- `wingerx-db` — PostgreSQL
- `wingerx-redis` — Redis-compatible Key Value

`SERVER_URL` is wired automatically from Render's generated `RENDER_EXTERNAL_URL`, so the initial Blueprint does not require you to guess the service URL. If you later attach a custom domain, update `SERVER_URL` on the web and worker to that final HTTPS URL so generated links and OAuth callbacks use the custom domain.

The Blueprint generates `APP_SECRET` and `ENCRYPTION_KEY`. Do not replace either value after production data has been created unless you are intentionally rotating keys using Twenty's supported rotation procedure.

## Required production settings

`NODE_PORT=10000` is already configured. Database and Redis connection strings are wired automatically by the Blueprint. Database migrations and Twenty cron registration run only on the web service; the worker has both disabled to prevent duplicate registration.

The default Blueprint uses `STORAGE_TYPE=local`. This is acceptable for evaluation and CRM records because records live in PostgreSQL, but local file storage on Render is not appropriate for durable production attachments. Before storing important uploaded files, switch Twenty to S3-compatible storage and configure the `STORAGE_S3_*` variables supported by Twenty. Do not commit storage credentials.

## AI

WingerX deliberately uses Twenty's native AI layer instead of calling a model directly from the browser. This keeps model credentials server-side and respects Twenty workspace permissions. After deployment, configure the AI provider/model in the Twenty administration/settings supported by the version you deployed. The WingerX AI buttons then hand the current analysis task to the native AI chat.

No OpenAI, Anthropic, Google or other model key is hard-coded in this repository.

## Sales data model

The dashboard automatically detects standard/custom objects whose names or labels match Leads, People, Companies, Opportunities/Deals and Tasks. It also looks for common fields such as stage/status, amount/value/ARR, owner/assignee, lead source, close date, due date and timestamps.

If your existing workspace uses different custom labels, add those names to `useWingerXData` in `packages/twenty-front/src/pages/wingerx/WingerXCommandCenterV2Page.tsx`. The reusable query hook only requests readable fields that actually exist, preventing GraphQL failures from absent optional fields.

## Tech data model

WingerX automatically detects Projects, Technical Requests/Tech Requests, Bugs, Incidents, Deployments and Feature Requests. Priority/severity values containing `critical`, `P0`, `P1`, `urgent`, `highest` or `blocker` enter the critical queue. Open technical records with no update for seven days enter the stale queue.

If a technical object does not yet exist in your Twenty workspace, its dashboard card remains available and reports `Object not found` rather than failing the page. Create or import that object later and it will begin populating automatically.

## Automation behavior

The command center evaluates these rules continuously whenever live CRM records load:

1. Open opportunity unchanged for 14+ days → stale-deal escalation signal.
2. Open deal greater than 1.5× the average won-deal size → high-value watch.
3. Open task past its due date → overdue-follow-up signal.
4. Technical priority/severity matching P0/P1/critical/urgent/blocker → critical escalation signal.
5. Open technical record unchanged for 7+ days → stale-engineering signal.
6. Lead/person created in the past 24 hours → new-lead response signal.

Twenty's native workflow engine and queue worker are deployed alongside this dashboard. Use native workflows for actions that send email, call HTTP endpoints, assign records or modify records because Twenty enforces workspace permissions and logs workflow execution. The visual WingerX automation center intentionally does not silently mutate CRM data from a dashboard render.

## Security

- Never commit API keys, model keys, SMTP credentials, OAuth secrets or database passwords.
- Keep the database and Redis services private; the Blueprint exposes neither publicly.
- Use Twenty roles/permissions for sales and technical teams.
- Create API keys only for integrations that need them and assign the least-privileged role available.
- Keep `APP_SECRET` and `ENCRYPTION_KEY` stable and private.
- Use HTTPS for `SERVER_URL`.

## After first login

Create your workspace/admin account, import or connect your CRM data, then open `/wingerx`. The dashboard will immediately report which Sales and Tech objects it detected. Connect email/calendar and configure Twenty AI/workflows as needed; WingerX uses those native capabilities rather than duplicating credentials in frontend code.

## Updating the fork

Keep WingerX changes on a dedicated branch/PR and periodically merge upstream Twenty into your fork. The WingerX implementation is isolated under `packages/twenty-front/src/modules/wingerx`, `packages/twenty-front/src/pages/wingerx`, one route entry, one navigation entry, `Dockerfile.render` and `render.yaml`, which reduces upgrade conflicts.
