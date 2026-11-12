# WingerX Restaurant Outreach

Install this private Twenty app to add a **Restaurant Outreach** folder to the sidebar.

| Sidebar shortcut | Use it to |
| --- | --- |
| **Sales Pipeline** | See leads by stage on the Kanban board and move a restaurant as outreach progresses. |
| **All Restaurants** | Search, filter by market, look up business contact details, or import records. |
| **Reply Drafts** | Request and review drafts for incoming replies. |

## Install on a staging workspace

From this directory, install dependencies with Yarn. Use the Twenty CLI to connect to the staging workspace and preview the metadata changes with `yarn twenty plan`. Apply the plan with `yarn twenty apply` after checking the custom object, views and navigation. The app targets Twenty 2.31 or later.

Open **Restaurant Outreach → All Restaurants → … → Import records**. Import the private CSV generated from the workbook using the command below. Match columns by their labels and inspect the preview. Import a small sample first when validating a new workspace. The source ID index rejects duplicate outlet IDs. The new record defaults are **New** and **Unknown**.

```sh
python3 scripts/prepare-restaurant-import.py /path/to/prospects.xlsx /path/to/restaurants.csv
```

Store prospect workbooks and exports outside the repository. The CSV includes no permissions or scheduled actions. Record the restaurant's channel permission and next action in Twenty during qualification.

## Use the Neurixa POS email template

In the WingerX Command Center, open **Outreach**. Choose a client or enter a restaurant's business email, then click **Use Neurixa POS template**. Review the editable email subject and message, including Abhi's signature and the 30-minute Calendly link. When the email address matches the selected client, the template uses that client's name.

The **Send email** button uses the configured WingerX mail sender. Check the From address and reply delivery with an internal test before sending the template to restaurants.

## Validate the batch planner

```sh
yarn typecheck
yarn test
```

The planner selects due, eligible emails up to the remaining daily capacity. It counts initial emails and follow-ups against the same 100-email allowance, ignores replied or suppressed records, and emits at most one result per normalized email. It runs as pure application code for now. Nothing is scheduled or sent by installing this version.

## Production integration

- Use WingerX's configured sender and connect its reply mailbox. Correlate inbound messages to the original thread and update the prospect before another follow-up can be claimed.
- Persist send reservations and provider message IDs. Reserve the daily allowance in one transaction with the outbound job, using the workspace's India business date. Reconcile ambiguous sends before retrying.
- Add authenticated WhatsApp webhook ingestion and use WingerX's existing template sending integration for opted-in prospects. Store the approved template and channel permissions in the workspace.
- Check that an outbound test, a real reply, a bounce, an opt-out, a duplicate job and a retry each leave the correct state. Then enable scheduled outreach and report accepted sends, replies, delivery failures and demos booked.

## Request a reply draft with Codex

Install the official Codex CLI on the private worker host. Sign in with `codex login` as the Linux account that will run the worker, and verify the session with `codex login status`. Use a dedicated OS account for this worker and keep the CRM and mail service configuration outside that account's readable files. The worker passes only the restaurant name and the incoming reply text to Codex. Paste the relevant excerpt and exclude personal or sensitive information unrelated to the reply.

Install the Twenty app changes, then create a scoped **Twenty** API key with read and update access to Restaurant reply drafts. Set `TWENTY_WORKSPACE_URL` and `TWENTY_API_KEY` through the worker's environment. The worker uses the signed-in Codex session for inference.

1. In Twenty, open **Restaurant Outreach → Reply Drafts**, click **New**, and enter the restaurant name and incoming reply. The status starts at **Requested**.
2. Run the command below on the signed-in worker host. Schedule it on a single host under the same OS account to pick up subsequent requests.
3. Read the intent and draft in Twenty and send the approved reply from the original channel. Opt-out drafts are empty and marked with the `opt_out` intent for the operator to record in the prospect's channel preferences.

```sh
flock -n "${XDG_RUNTIME_DIR:-$HOME}/wingerx-reply-drafts.lock" node scripts/run-reply-drafts.mjs
```

The draft worker does not connect to mail or WhatsApp. Direct inbox ingestion and send automation are separate from this workflow.

## Refresh the restaurant list

Install the official [Overture Maps CLI](https://docs.overturemaps.org/getting-data/) on the worker host. Configure the same workspace URL with a Twenty API key that can read Restaurant prospects. Run this command after a new Overture release or from a monthly job. Keep exports outside the repository.

```sh
node scripts/refresh-restaurant-prospects.mjs "/private/outreach/restaurants-$(date +%Y-%m).csv"
```

Append market names to restrict a run, for example `Ranchi Surat`. The script reads the current CRM list, downloads Overture Places for the selected areas, and writes a CSV containing only candidates with a source ID, a plausible public phone, and no matching CRM source ID, normalized phone, or normalized email. City-area map bounds may include nearby localities. Open **Restaurant Outreach → All Restaurants → … → Import records** to review and import the CSV as **New** prospects. Existing records, owner assignments, stages, and opt-outs are untouched. Source: Overture Maps Foundation and contributors. See the [attribution and licensing](https://docs.overturemaps.org/attribution/) terms.
