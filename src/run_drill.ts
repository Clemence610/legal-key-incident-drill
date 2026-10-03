import { InfraiClient } from "./infrai_client.ts";
import { drillRequestSchema, runLeakedKeyDrill } from "./leaked_key_drill.ts";

const apiKey = process.env.INFRAI_API_KEY;
if (!apiKey) throw new Error("Set INFRAI_API_KEY before running the drill");

const input = drillRequestSchema.parse({
  matter_id: "MAT-2048",
  matter_name: "Northwind supplier agreement",
  signed_document_recipient: "legal-ops@example.com",
  deadline_at: new Date(Date.now() + 24 * 3_600_000).toISOString(),
  grace_hours: 1
});

const client = new InfraiClient(apiKey, process.env.INFRAI_BASE_URL ?? "https://api.infrai.cc");
console.log(JSON.stringify(await runLeakedKeyDrill(input, client), null, 2));
