// Free AI Responses - No API Key Required
const responses = {
  greeting: [
    "Hello! How can I help you today?",
    "Welcome! I'm here to help with anything you need.",
    "Hi there! What would you like to talk about?"
  ],
  programming: [
    "Programming is amazing! Which programming language would you like help with? I can assist with JavaScript, Python, React and more.",
    "I love programming! Do you want to learn programming basics or do you have a specific problem?",
    "Programming is the language of the future. Choose the language you want to learn and I'll help you with simple steps."
  ],
  writing: [
    "Writing is the most beautiful art! What type of article would you like me to help you write?",
    "I love helping people with writing. Do you want a technical, creative, or academic article?",
    "Good writing needs a clear idea. Tell me the topic and I'll help you organize your thoughts."
  ],
  ideas: [
    "Creative ideas come from thinking outside the box! What field do you want ideas for?",
    "I have lots of ideas! Do you want ideas for a project, app, or creative content?",
    "Creativity has no limits! Tell me the field and I'll suggest innovative ideas."
  ],
  explanation: [
    "I love explaining complex topics simply! What topic do you want to understand?",
    "Learning is real fun. Choose any topic and I'll explain it to you in the simplest way possible.",
    "No question is too hard! Tell me what you want to learn and I'll explain it step by step."
  ],
  general: [
    "That's an excellent question! Let me think about it... 🤔",
    "I appreciate your curiosity! This is an interesting topic.",
    "Great question! There are several aspects we can discuss about this topic.",
    "Fun conversation! I love this type of question.",
    "Let me share my perspective on this topic..."
  ],
  farewell: [
    "It was a pleasure talking with you! See you soon 👋",
    "Thank you for the great conversation! Feel free to come back anytime.",
    "Goodbye! I hope I helped you today 😊"
  ]
};

// Keywords for response categorization
const keywords = {
  greeting: ["hello", "hi", "hey", "morning", "evening", "good"],
  programming: ["programming", "code", "javascript", "python", "react", "development", "website", "app"],
  writing: ["write", "article", "story", "content", "text"],
  ideas: ["ideas", "suggest", "creative", "project"],
  explanation: ["explain", "how", "what", "why", "tell"],
  farewell: ["goodbye", "bye", "thanks", "thank"]
};

export function generateFreeAIResponse(userMessage: string): string {
  const message = userMessage.toLowerCase();
  
  // Check for specific keywords
  for (const [category, words] of Object.entries(keywords)) {
    if (words.some(word => message.includes(word))) {
      const categoryResponses = responses[category as keyof typeof responses];
      return categoryResponses[Math.floor(Math.random() * categoryResponses.length)];
    }
  }
  
  // Default to general responses
  const generalResponses = responses.general;
  return generalResponses[Math.floor(Math.random() * generalResponses.length)];
}

// Extended responses for better conversation
export function getContextualResponse(userMessage: string, conversationLength: number): string {
  if (conversationLength === 0) {
    return responses.greeting[Math.floor(Math.random() * responses.greeting.length)];
  }
  
  if (conversationLength > 10) {
    return "We've talked a lot today! Is there something specific you want to focus on?";
  }
  
  return generateFreeAIResponse(userMessage);
}

export default { generateFreeAIResponse, getContextualResponse };