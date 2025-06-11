// Central export for all prompts
export { customerServicePrompts } from './customer-service';
export { weatherPrompts } from './weather';
export { researchPrompts } from './research';
export { triagePrompts } from './triage';

// Common prompt utilities
export const commonPrompts = {
  greeting: "Hello! How can I help you today?",
  error: "I apologize, but I encountered an error. Please try again.",
  thinking: "Let me think about that...",
  
  // Common instructions
  beHelpful: "Always be helpful, polite, and professional.",
  beAccurate: "Provide accurate information and cite sources when possible.",
  beConcise: "Be concise but thorough in your responses.",
};
