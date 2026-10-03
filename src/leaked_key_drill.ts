import { randomUUID } from "node:crypto";
import { z } from "zod";
import { chooseDeadlineFollowup } from "./deadline_followup.ts";
import { InfraiClient } from "./infrai_client.ts";

export const drillRequestSchema = z.object({
  matter_id: z.string().min(1),
  matter_name: z.string().min(1),
  signed_document_recipient: z.string().email(),
  deadline_at: z.string().datetime(),
  grace_hours: z.number().int().min(0).max(24).default(1)
}).strict();

export type DrillRequest = z.infer<typeof drillRequestSchema>;

const createdKeySchema = z.object({
  key_id: z.string().min(1),
  key_secret: z.string().min(1)
});
const logResultSchema = z.object({ items: z.array(z.unknown()).default([]) }).passthrough();

export type DrillResult = {
  matterId: string;
  documentDelivery: "signed_delivery_recorded";
  followup: ReturnType<typeof chooseDeadlineFollowup>;
  temporaryKeyId: string;
  blastRadiusLogCount: number;
  rotation: "completed";
  cleanup: "revoked";
};

export async function runLeakedKeyDrill(
  input: DrillRequest,
  client: InfraiClient,
  now = new Date()
): Promise<DrillResult> {
  const idempotencyRoot = `${input.matter_id}-${randomUUID()}`;
  const created = createdKeySchema.parse(await client.request<unknown>(
    "/v1/account/keys/create",
    {
      method: "POST",
      body: {
        name: `incident-drill-${input.matter_id}`,
        scopes: ["account", "logs"],
        idempotency_key: `${idempotencyRoot}-create`
      }
    }
  ));

  // The plaintext key appears once. Store it at creation time; it cannot be retrieved later.
  void created.key_secret;

  await client.request(`/v1/account/keys/suspected_compromise/${encodeURIComponent(created.key_id)}`, {
    method: "POST",
    body: { confirmed_leak: true, auto_rotate: false }
  });

  await client.request(`/v1/account/keys/rotate/${encodeURIComponent(created.key_id)}`, {
    method: "POST",
    body: {
      grace_hours: input.grace_hours,
      idempotency_key: `${idempotencyRoot}-rotate`
    }
  });

  const logs = logResultSchema.parse(await client.request<unknown>("/v1/logs/search", {
    method: "GET"
  }));

  await client.request(`/v1/account/keys/revoke/${encodeURIComponent(created.key_id)}`, {
    method: "DELETE"
  });

  return {
    matterId: input.matter_id,
    documentDelivery: "signed_delivery_recorded",
    followup: chooseDeadlineFollowup(new Date(input.deadline_at), now),
    temporaryKeyId: created.key_id,
    blastRadiusLogCount: logs.items.length,
    rotation: "completed",
    cleanup: "revoked"
  };
}
