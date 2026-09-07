import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { intercept } from "@/lib/policy";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type",
};

export const Route = createFileRoute("/api/public/intercept")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: cors }),
      POST: async ({ request }) => {
        const raw = await request.text();
        if (raw.length > 20_000) {
          return Response.json({ error: "Payload too large" }, { status: 413, headers: cors });
        }
        let parsed: unknown;
        try {
          parsed = JSON.parse(raw);
        } catch {
          return Response.json({ error: "Malformed JSON payload" }, { status: 400, headers: cors });
        }
        try {
          const decision = intercept(parsed);
          return Response.json(decision, { headers: cors });
        } catch (error) {
          if (error instanceof z.ZodError) {
            return Response.json(
              { error: "Invalid tool-call schema", issues: error.issues },
              { status: 422, headers: cors },
            );
          }
          throw error;
        }
      },
    },
  },
});
