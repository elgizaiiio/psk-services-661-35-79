import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { sendChatMessage, ChatMessage } from "@/lib/openrouter";
import { toast } from "sonner";
import { Send, Bot, User, Loader2, MessageCircle, Trash2 } from "lucide-react";

const OpenRouterChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: inputValue.trim()
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await sendChatMessage(newMessages);
      
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: response
      };

      setMessages([...newMessages, assistantMessage]);
      toast.success("Response received successfully");
    } catch (error: any) {
      console.error("Chat error:", error);
      toast.error(error?.message || "An error occurred while sending");
      
      // Remove the user message if there was an error
      setMessages(messages);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const clearChat = () => {
    setMessages([]);
    toast.success("Chat cleared");
  };

  return (
    <div className="max-w-4xl mx-auto p-4 pb-24" style={{ backgroundColor: '#0D0D0D', minHeight: '100vh' }}>
      <header className="text-center py-6 space-y-4">
        <div className="flex items-center justify-center gap-3 mb-4">
          <MessageCircle className="w-8 h-8" style={{ color: '#007AFF' }} />
          <h1 className="text-3xl font-bold" style={{ color: '#FFFFFF' }}>
            Smart Chat with OpenRouter
          </h1>
        </div>
        <div className="flex items-center justify-center gap-2">
          <Badge className="text-sm" style={{ backgroundColor: '#8B5CF6', color: '#FFFFFF' }}>
            <Bot className="w-4 h-4 mr-1" />
            gpt-oss-20b:free
          </Badge>
          <Badge className="text-sm" style={{ backgroundColor: '#262626', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.2)' }}>
            Free
          </Badge>
        </div>
      </header>

      <Card className="h-[600px] flex flex-col dark-card" style={{ backgroundColor: '#262626', border: '1px solid rgba(255,255,255,0.1)' }}>
        {/* Chat Messages */}
        <div className="flex-1 p-4">
          <ScrollArea ref={scrollAreaRef} className="h-full">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-center">
                <div className="space-y-4" style={{ color: '#B3B3B3' }}>
                  <Bot className="w-16 h-16 mx-auto opacity-50" style={{ color: '#007AFF' }} />
                  <div>
                    <h3 className="text-lg font-medium mb-2" style={{ color: '#FFFFFF' }}>Welcome to Smart Chat</h3>
                    <p className="text-sm" style={{ color: '#B3B3B3' }}>Start a new conversation by typing your question below</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex gap-3 ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {message.role === "assistant" && (
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(0, 122, 255, 0.1)' }}>
                        <Bot className="w-4 h-4" style={{ color: '#007AFF' }} />
                      </div>
                    )}
                    
                    <div
                      className="max-w-[80%] px-4 py-2 rounded-lg text-sm"
                      style={{
                        backgroundColor: message.role === "user" ? '#007AFF' : '#1A1A1A',
                        color: '#FFFFFF',
                        marginLeft: message.role === "user" ? 'auto' : '0'
                      }}
                    >
                      <div className="whitespace-pre-wrap break-words">
                        {message.content}
                      </div>
                    </div>

                    {message.role === "user" && (
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#8B5CF6' }}>
                        <User className="w-4 h-4" style={{ color: '#FFFFFF' }} />
                      </div>
                    )}
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(0, 122, 255, 0.1)' }}>
                      <Bot className="w-4 h-4" style={{ color: '#007AFF' }} />
                    </div>
                    <div className="px-4 py-2 rounded-lg" style={{ backgroundColor: '#1A1A1A' }}>
                      <div className="flex items-center gap-2 text-sm" style={{ color: '#B3B3B3' }}>
                        <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#007AFF' }} />
                        Typing...
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Input Area */}
        <div className="p-4 space-y-3" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <div className="flex-1">
              <Textarea
                ref={textareaRef}
                placeholder="Type your message here... (Enter to send, Shift+Enter for new line)"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                className="min-h-[60px] max-h-[120px] resize-none"
                style={{ 
                  backgroundColor: '#1A1A1A',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#FFFFFF'
                }}
                disabled={isLoading}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="h-[60px] px-4"
                style={{ 
                  backgroundColor: '#007AFF',
                  color: '#FFFFFF',
                  border: 'none'
                }}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
              {messages.length > 0 && (
                <Button
                  type="button"
                  onClick={clearChat}
                  className="h-[28px] px-2"
                  style={{ 
                    backgroundColor: '#262626',
                    color: '#FFFFFF',
                    border: '1px solid rgba(255,255,255,0.2)'
                  }}
                  disabled={isLoading}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              )}
            </div>
          </form>
          
          <div className="text-xs text-center" style={{ color: '#B3B3B3' }}>
            Powered by OpenRouter API • Model: gpt-oss-20b:free
          </div>
        </div>
      </Card>
    </div>
  );
};

export default OpenRouterChat;