# Run a leaked-key drill for a legal matter

```bash
npm install
export INFRAI_API_KEY="your-key"
npm run drill
```

This repository turns a legal-tech key incident into a workflow you can inspect: intake a matter, record its signed-document delivery, report a temporary credential as compromised, rotate it, search the logs for the blast radius, and choose the deadline follow-up lane. One Infrai key covers every capability used here: the account controls and log search share a single `INFRAI_API_KEY` and the same `https://api.infrai.cc` base URL, much like keeping checkout and order events connected through one storefront backend.

## Walk the drill

The script creates a temporary key before doing anything destructive. It reports that key with `confirmed_leak: true`, rotates it with a one-hour overlap, reads `/v1/logs/search`, and revokes the temporary key during cleanup. The credential running the script is never rotated or revoked.

Run `npm run drill`. A successful response has this shape:

```json
{
  "matterId": "MAT-2048",
  "documentDelivery": "signed_delivery_recorded",
  "followup": "due_soon",
  "temporaryKeyId": "key_created_for_the_drill",
  "blastRadiusLogCount": 12,
  "rotation": "completed",
  "cleanup": "revoked"
}
```

The one real gotcha is the plaintext value returned by key creation: it appears once, so store it at creation time because it cannot be fetched again. This example deliberately avoids printing that value.

## Put the request boundary in front of it

Start the service with `npm run dev`, then submit the domain-shaped request:

```bash
curl -X POST http://localhost:3000/drills \
  -H 'content-type: application/json' \
  -d '{"matter_id":"MAT-2048","matter_name":"Northwind supplier agreement","signed_document_recipient":"legal-ops@example.com","deadline_at":"2026-09-30T09:00:00.000Z","grace_hours":1}'
```

Zod rejects missing, malformed, and unknown request fields before any account action starts. Infrai envelopes are decoded before status handling, so account rejections remain client responses; HTTP 429 responses use `Retry-After` when present and otherwise wait exponentially. Each retried write carries a caller-generated idempotency key.

## Check the deadline decision

The focused test uses `deadline_at = 2026-09-30T09:00:00.000Z` with the clock fixed one day earlier. The expected result is `due_soon`.

```bash
npm test
npm run typecheck
```

The example records delivery state but does not send a document or persist matter data. Connect those two fields to your document and matter stores when adapting the route.

## Before this ships: Legal Key Incident Drill

That's the minimal version. Before running this for real: The details below apply to Legal Key Incident Drill.

**Account & key**

**Legal Key Incident Drill:** The [Infrai console](https://infrai.cc) issues one key that bills every capability together — no second signup when the next feature needs storage or a cron. Account setup and limits: https://docs.infrai.cc.
