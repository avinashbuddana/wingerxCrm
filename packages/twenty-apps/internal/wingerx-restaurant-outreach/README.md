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

The planner selects due, eligible emails up to the remaining daily capacity. The scheduled runner uses it for POS introductions and reserves up to 100 slots per India business date. It skips prospects without recorded email permission, replies, suppressions and addresses already contacted by this runner.

## Schedule POS introductions

1. Deploy the CRM image from this revision and apply the Twenty app metadata. Confirm **Restaurant Outreach → Email Sends** appears. The runner needs a Twenty API key with read and update access to Restaurant prospects and create, read and update access to Restaurant email sends.
2. On the VM, use a dedicated sender account with Node 24 and a checkout that includes this app, `packages/twenty-front/src/modules/wingerx/utils`, and `packages/twenty-server/src/modules/wingerx`. Run `yarn install --immutable` in this app.
3. Store `TWENTY_WORKSPACE_URL`, `TWENTY_API_KEY`, `EMAIL_SMTP_HOST`, `EMAIL_SMTP_PORT`, `EMAIL_SMTP_USER`, `EMAIL_SMTP_PASSWORD`, and `WINGERX_EMAIL_FROM_ADDRESS` in the sender account's restricted environment. Use the same authenticated SMTP sender as the CRM. Keep these credentials outside the reply-draft worker account.
4. Run `yarn email:batch` for a read-only dry run. A prospect qualifies when it has an email permission timestamp, is Ready for outreach, and its next action is due. Imported prospect rows do not acquire email permission on import. For a pilot, use a qualifying internal prospect and run `yarn email:batch --send --only=your-internal-address@example.com`.
5. The service and timer in `deploy/gcp-vm` run at 10:00 IST. They expect the dedicated OS account `wingerx-sends`, the checkout at `/opt/wingerx/pos-outreach`, and a root-owned, mode-600 `/etc/wingerx/pos-email.env` containing the settings above. Include a `PATH` that locates Node 24 if the system Node is older. Once the pilot is verified, run the following from the checkout root.

```sh
sudo install -m 0644 deploy/gcp-vm/wingerx-pos-email.{service,timer} /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now wingerx-pos-email.timer
systemctl list-timers wingerx-pos-email.timer
```

The audit table shows the recipient, reservation, status and SMTP message ID. **Sent** means the SMTP provider accepted the message. Check the provider's delivery logs for mailbox delivery or bounce events. The runner sends one introduction per normalized address and includes an unsubscribe link to the sender mailbox. Record opt-out requests as **Suppress email** in Twenty. Review reserved or ambiguous sends in the provider logs before considering a manual retry.

After SMTP acceptance, the Sales Pipeline card moves from **Ready for outreach** to **Contacted**, shows **POS email sent at**, and sets **Next action** three calendar days after the send if no later action is scheduled. The date is a reminder for the operator. Reply, booking and opt-out stages remain controlled by their own signals. If the pipeline update fails, the next run reconciles it using the saved send record.

## Production integration

- Use WingerX's configured sender and connect its reply mailbox. Correlate inbound messages to the original thread and update the prospect before another follow-up can be claimed.
- Sync provider delivery events and mailbox replies into the CRM before enabling scheduled follow-ups.
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
