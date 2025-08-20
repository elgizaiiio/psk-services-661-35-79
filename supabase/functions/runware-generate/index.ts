// Supabase Edge Function: runware-generate
// Proxies image generation to Runware API using a secret API key.
// Set the secret with: supabase secrets set --project-ref <ref> RUNWARE_API_KEY=... 

import { serve } from "https://deno.land/std@0.182.0/http/server.ts";

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  const headers = new Headers({
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  });
  if (init.headers) {
    const extra = new Headers(init.headers);
    extra.forEach((v, k) => headers.set(k, v));
  }
  return new Response(JSON.stringify(body), { ...init, headers });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return jsonResponse({ ok: true });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, { status: 405 });

  try {
    const { prompt, width = 1024, height = 1024, count = 1, model = "runware:100@1" } = await req.json();
    if (!prompt || typeof prompt !== "string") {
      return jsonResponse({ error: "prompt is required" }, { status: 400 });
    }

    const apiKey = Deno.env.get("RUNWARE_API_KEY");
    if (!apiKey) return jsonResponse({ error: "Missing RUNWARE_API_KEY" }, { status: 500 });

    const taskUUID = crypto.randomUUID();
    const payload = [
      {
        taskType: "authentication",
        apiKey,
      },
      {
        taskType: "imageInference",
        taskUUID,
        positivePrompt: prompt,
        model,
        width: Math.max(512, Math.min(1024, Number(width) || 1024)),
        height: Math.max(512, Math.min(1024, Number(height) || 1024)),
        numberResults: Math.max(1, Math.min(4, Number(count) || 1)),
        outputFormat: "WEBP",
        CFGScale: 1,
        scheduler: "FlowMatchEulerDiscreteScheduler",
        strength: 0.8,
        lora: [],
      },
    ];

    const res = await fetch("https://api.runware.ai/v1", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      return jsonResponse({ error: "Runware request failed", details: text }, { status: 502 });
    }

    const data = await res.json();
    const images = (data?.data || []).filter((d: any) => d.taskType === "imageInference");
    return jsonResponse({ images });
  } catch (e) {
    return jsonResponse({ error: "Unexpected error", details: String(e) }, { status: 500 });
  }
});
