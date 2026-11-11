# WingerX Restaurant Outreach

Install this private Twenty app to add the Restaurant prospects table and Restaurant pipeline board. The app preserves WingerX’s existing email and WhatsApp screens. The prospect object stores published business contact details and lets the team record POS status, permission by channel, replies, opt-outs and next actions.

## Install on a staging workspace

From this directory, install dependencies with Yarn. Use the Twenty CLI to connect to the staging workspace and preview the metadata changes with `yarn twenty plan`. Apply the plan with `yarn twenty apply` after checking the custom object, views and navigation. The app targets Twenty 2.31 or later.

Open **Restaurant prospects → … → Import records**. Import the private CSV generated from the workbook using the command below. Match columns by their labels and inspect the preview. Import a small sample first when validating a new workspace. The source ID index rejects duplicate outlet IDs. The new record defaults are **New** and **Unknown**.

```sh
python3 scripts/prepare-restaurant-import.py /path/to/prospects.xlsx /path/to/restaurants.csv
```

Store prospect workbooks and exports outside the repository. The CSV includes no permissions or scheduled actions. Record the restaurant's channel permission and next action in Twenty during qualification.

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
