import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the origin from the request
    const url = new URL(req.url);
    const origin = req.headers.get("origin") || `${url.protocol}//${url.host}`;
    
    // Create dynamic manifest based on the requesting origin
    const manifest = {
      url: origin,
      name: "PSK Services - VIRAL Mining",
      iconUrl: `${origin}/favicon.ico`,
      description: "PSK Services - Connect your TON wallet to start mining VIRAL tokens and earn rewards through our advanced mining platform",
      image: `${origin}/og-image.png`,
      termsOfUseUrl: `${origin}/terms`,
      privacyPolicyUrl: `${origin}/privacy`
    };

    console.log(`📋 Generated dynamic manifest for origin: ${origin}`);

    return new Response(JSON.stringify(manifest, null, 2), {
      headers: corsHeaders,
    });
  } catch (error) {
    console.error("❌ Error generating manifest:", error);
    
    // Fallback manifest
    const fallbackManifest = {
      url: "https://psk-viral-mining.lovable.app",
      name: "PSK Services - VIRAL Mining",
      iconUrl: "https://psk-viral-mining.lovable.app/favicon.ico",
      description: "PSK Services - Connect your TON wallet to start mining VIRAL tokens and earn rewards through our advanced mining platform",
      image: "https://psk-viral-mining.lovable.app/og-image.png",
      termsOfUseUrl: "https://psk-viral-mining.lovable.app/terms",
      privacyPolicyUrl: "https://psk-viral-mining.lovable.app/privacy"
    };

    return new Response(JSON.stringify(fallbackManifest, null, 2), {
      headers: corsHeaders,
    });
  }
});