const OPENROUTER_API_KEY = "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";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export async function sendChatMessage(messages: ChatMessage[]): Promise<string> {
  try {
    console.log("Sending request to OpenRouter API...", { messages: messages.slice(-5) });
    
    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": window.location.href,
        "X-Title": "Viral Mining Chat"
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b:free",
        messages: messages,
        temperature: 0.7,
        max_tokens: 1500,
        stream: false
      })
    });

    console.log("Response status:", response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("API Error:", errorData);
      throw new Error(`HTTP ${response.status}: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    console.log("API Response:", data);
    
    if (!data.choices?.[0]?.message?.content) {
      console.error("Invalid response format:", data);
      throw new Error("Invalid response from server");
    }

    const content = data.choices[0].message.content.trim();
    console.log("Received content:", content);
    
    return content;
  } catch (error) {
    console.error("OpenRouter API Error:", error);
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error("Failed to connect to server. Check your internet connection.");
    }
    
    throw error;
  }
}