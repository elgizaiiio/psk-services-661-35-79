import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ImageGenerationParams {
  prompt: string;
  width?: number;
  height?: number;
  model?: string;
}

// Hugging Face API
async function generateWithHuggingFace(params: ImageGenerationParams): Promise<string | null> {
  try {
    const response = await fetch(
      "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell",
      {
        headers: { "Content-Type": "application/json" },
        method: "POST",
        body: JSON.stringify({ inputs: params.prompt }),
      }
    );

    if (!response.ok) throw new Error(`HuggingFace API error: ${response.status}`);
    
    const result = await response.blob();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(await result.arrayBuffer())));
    return `data:image/jpeg;base64,${base64}`;
  } catch (error) {
    console.error('HuggingFace generation failed:', error);
    return null;
  }
}

// Pollinations API (Free)
async function generateWithPollinations(params: ImageGenerationParams): Promise<string | null> {
  try {
    const width = params.width || 1024;
    const height = params.height || 1024;
    const encodedPrompt = encodeURIComponent(params.prompt);
    
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&model=flux&seed=${Math.floor(Math.random() * 1000000)}`;
    
    const response = await fetch(imageUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    
    if (!response.ok) throw new Error(`Pollinations API error: ${response.status}`);
    
    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < uint8Array.byteLength; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    const base64 = btoa(binary);
    return `data:image/jpeg;base64,${base64}`;
  } catch (error) {
    console.error('Pollinations generation failed:', error);
    return null;
  }
}

// Segmind API (Free tier)
async function generateWithSegmind(params: ImageGenerationParams): Promise<string | null> {
  try {
    const response = await fetch('https://api.segmind.com/v1/flux-schnell-txt2img', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: params.prompt,
        width: params.width || 1024,
        height: params.height || 1024,
        steps: 4,
        seed: Math.floor(Math.random() * 1000000),
        scheduler: "simple",
        sampler_name: "euler",
        prompt_weighting: "none",
        aspect_ratio: "custom"
      }),
    });

    if (!response.ok) throw new Error(`Segmind API error: ${response.status}`);
    
    const blob = await response.blob();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(await blob.arrayBuffer())));
    return `data:image/jpeg;base64,${base64}`;
  } catch (error) {
    console.error('Segmind generation failed:', error);
    return null;
  }
}

// FAL AI (Free tier)
async function generateWithFal(params: ImageGenerationParams): Promise<string | null> {
  try {
    const response = await fetch('https://fal.run/fal-ai/flux/schnell', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: params.prompt,
        image_size: "landscape_4_3",
        num_inference_steps: 4,
        enable_safety_checker: false
      }),
    });

    if (!response.ok) throw new Error(`Fal AI error: ${response.status}`);
    
    const result = await response.json();
    if (result.images && result.images[0] && result.images[0].url) {
      const imageResponse = await fetch(result.images[0].url);
      const blob = await imageResponse.blob();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(await blob.arrayBuffer())));
      return `data:image/jpeg;base64,${base64}`;
    }
    
    throw new Error('No image returned from Fal AI');
  } catch (error) {
    console.error('Fal AI generation failed:', error);
    return null;
  }
}

// Dezgo API (Free)
async function generateWithDezgo(params: ImageGenerationParams): Promise<string | null> {
  try {
    const response = await fetch('https://api.dezgo.com/text2image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: params.prompt,
        width: params.width || 1024,
        height: params.height || 1024,
        model: 'flux-schnell',
        steps: 4,
        seed: Math.floor(Math.random() * 1000000),
      }),
    });

    if (!response.ok) throw new Error(`Dezgo API error: ${response.status}`);
    
    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < uint8Array.byteLength; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    const base64 = btoa(binary);
    return `data:image/png;base64,${base64}`;
  } catch (error) {
    console.error('Dezgo generation failed:', error);
    return null;
  }
}

// Prodia API (Free)
async function generateWithProdia(params: ImageGenerationParams): Promise<string | null> {
  try {
    const response = await fetch('https://api.prodia.com/v1/sd/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: params.prompt,
        width: params.width || 1024,
        height: params.height || 1024,
        steps: 20,
        cfg_scale: 7,
        seed: Math.floor(Math.random() * 1000000),
        sampler: 'Euler a',
        model: 'sd_xl_base_1.0.safetensors',
      }),
    });

    if (!response.ok) throw new Error(`Prodia API error: ${response.status}`);
    
    const data = await response.json();
    
    if (data.job) {
      // Poll for completion
      let attempts = 0;
      while (attempts < 30) {
        const statusResponse = await fetch(`https://api.prodia.com/v1/job/${data.job}`);
        const statusData = await statusResponse.json();
        
        if (statusData.status === 'succeeded' && statusData.imageUrl) {
          const imageResponse = await fetch(statusData.imageUrl);
          const arrayBuffer = await imageResponse.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);
          let binary = '';
          for (let i = 0; i < uint8Array.byteLength; i++) {
            binary += String.fromCharCode(uint8Array[i]);
          }
          const base64 = btoa(binary);
          return `data:image/png;base64,${base64}`;
        }
        
        if (statusData.status === 'failed') {
          throw new Error('Prodia generation failed');
        }
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        attempts++;
      }
    }
    
    throw new Error('Prodia timeout');
  } catch (error) {
    console.error('Prodia generation failed:', error);
    return null;
  }
}

// Try multiple providers in sequence
async function generateImage(params: ImageGenerationParams): Promise<string> {
  const providers = [
    { name: 'Pollinations', func: generateWithPollinations },
    { name: 'Dezgo', func: generateWithDezgo },
    { name: 'Prodia', func: generateWithProdia },
  ];

  // Try each provider in order
  for (const provider of providers) {
    console.log(`🎨 Trying ${provider.name} for prompt: "${params.prompt}"`);
    
    try {
      const result = await provider.func(params);
      
      if (result) {
        console.log(`✅ Success with ${provider.name}`);
        return result;
      }
    } catch (error) {
      console.error(`❌ ${provider.name} failed:`, error);
    }
    
    console.log(`❌ Failed with ${provider.name}, trying next...`);
  }

  throw new Error('فشل في توليد الصورة، يرجى المحاولة مرة أخرى');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { prompt, width = 1024, height = 1024, model = 'flux' } = await req.json();

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'يرجى إدخال وصف للصورة' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🎨 Generating image for prompt: "${prompt}"`);

    const imageBase64 = await generateImage({ 
      prompt: prompt.trim(), 
      width: Math.max(512, Math.min(1024, Number(width))), 
      height: Math.max(512, Math.min(1024, Number(height))),
      model 
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        image: imageBase64,
        prompt: prompt.trim()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Image generation error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'حدث خطأ أثناء توليد الصورة',
        success: false 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});