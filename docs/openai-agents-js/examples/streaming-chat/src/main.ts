import { Agent, run, setOpenAIAPI, setDefaultOpenAIClient, setTracingDisabled, setTracingExportApiKey, setDefaultOpenAIKey, tool } from '@openai/agents';
import { z } from 'zod';
import OpenAI from 'openai';

// Debug environment variables
console.log('🔧 Environment Debug:');
console.log('- import.meta.env.VITE_OPENAI_API_KEY:', import.meta.env.VITE_OPENAI_API_KEY ? '✅ Found' : '❌ Missing');
console.log('- All env vars:', import.meta.env);

// Check if API key is available (Vite requires VITE_ prefix)
const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
console.log('🔑 Final API Key status:', apiKey ? '✅ Found' : '❌ Missing');
console.log('🔑 API Key length:', apiKey ? apiKey.length : 0);
console.log('🔑 API Key starts with:', apiKey ? apiKey.substring(0, 10) + '...' : 'N/A');

if (!apiKey) {
  console.error('❌ No API key found. Available env vars:', Object.keys(import.meta.env || {}));
  alert('❌ API Key not found! Make sure you have VITE_OPENAI_API_KEY in your .env file');
  throw new Error('API Key not found');
} else {
  console.log('✅ API Key loaded successfully');

  // For SERVER-SIDE: Enable tracing and use secure API key
  // setTracingDisabled(false); // Enable tracing
  // setTracingExportApiKey(apiKey); // Set tracing API key
  // setDefaultOpenAIKey(apiKey); // Set API key securely

  // For BROWSER: Disable tracing and allow browser usage
  setTracingDisabled(true);
  console.log('🚫 Tracing disabled for browser');

  // Create OpenAI client with browser support (based on official docs)
  const openaiClient = new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true
  });

  // Set the client for the SDK
  setDefaultOpenAIClient(openaiClient);
  console.log('🔑 OpenAI client configured for browser');
}

// Force use of Responses API for streaming (based on official docs)
try {
  setOpenAIAPI('responses');
  console.log('📡 Using Responses API for streaming');
} catch (error) {
  console.error('❌ Error setting OpenAI API:', error);
}

// Create some example tools to demonstrate tool calling
const weatherTool = tool({
  name: 'get_weather',
  description: 'Get current weather for a city',
  parameters: z.object({
    city: z.string().describe('The city to get weather for'),
  }),
  execute: async ({ city }) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    const conditions = ['sunny', 'cloudy', 'rainy', 'snowy', 'partly cloudy'];
    const condition = conditions[Math.floor(Math.random() * conditions.length)];
    const temp = Math.floor(Math.random() * 30) + 5;
    return `The weather in ${city} is ${condition} with a temperature of ${temp}°C.`;
  },
});

const timeTool = tool({
  name: 'get_current_time',
  description: 'Get the current time and date',
  parameters: z.object({}),
  execute: async () => {
    return `Current time: ${new Date().toLocaleString()}`;
  },
});

// Create the agent with streaming capabilities
console.log('🤖 Creating agent...');
let agent: any;

try {
  agent = new Agent({
    name: 'Streaming Chat Assistant',
    instructions: `You are a helpful and friendly AI assistant. You have access to tools for weather and time.

    Guidelines:
    - Be conversational and engaging
    - Use tools when appropriate (weather, time)
    - Provide detailed and helpful responses
    - Show enthusiasm and personality
    - If asked about streaming, explain that you're using OpenAI's Responses API`,
    tools: [weatherTool, timeTool],
  });
  console.log('✅ Agent created successfully');

  // Make agent globally available for debugging
  (window as any).agent = agent;
} catch (error) {
  console.error('❌ Error creating agent:', error);
  alert('❌ Error creating agent: ' + error);
  throw error; // Re-throw to prevent further execution
}

// DOM elements
console.log('🔍 Looking for DOM elements...');
const messagesContainer = document.getElementById('messages') as HTMLDivElement;
const messageInput = document.getElementById('messageInput') as HTMLInputElement;
const sendButton = document.getElementById('sendButton') as HTMLButtonElement;

console.log('📋 DOM elements found:', {
  messagesContainer: !!messagesContainer,
  messageInput: !!messageInput,
  sendButton: !!sendButton
});

if (!messagesContainer || !messageInput || !sendButton) {
  console.error('❌ Missing DOM elements!');
  alert('❌ DOM elements not found! Check the HTML structure.');
}

// State
let isStreaming = false;

// Add message to chat
function addMessage(content: string, isUser: boolean, isStreaming = false): HTMLDivElement {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${isUser ? 'user' : 'assistant'}${isStreaming ? ' streaming' : ''}`;
  
  const contentDiv = document.createElement('div');
  contentDiv.className = 'message-content';
  contentDiv.textContent = content;
  
  messageDiv.appendChild(contentDiv);
  messagesContainer.appendChild(messageDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
  
  return messageDiv;
}

// Add typing indicator
function addTypingIndicator(): HTMLDivElement {
  const messageDiv = document.createElement('div');
  messageDiv.className = 'message assistant';
  
  const contentDiv = document.createElement('div');
  contentDiv.className = 'message-content';
  
  const typingDiv = document.createElement('div');
  typingDiv.className = 'typing-indicator';
  typingDiv.innerHTML = `
    AI is thinking
    <div class="typing-dots">
      <span></span>
      <span></span>
      <span></span>
    </div>
  `;
  
  contentDiv.appendChild(typingDiv);
  messageDiv.appendChild(contentDiv);
  messagesContainer.appendChild(messageDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
  
  return messageDiv;
}

// Send message
async function sendMessage() {
  console.log('📤 sendMessage called');
  const message = messageInput.value.trim();
  console.log('💬 Message:', message);
  console.log('🔄 isStreaming:', isStreaming);

  if (!message) {
    console.log('❌ Empty message, returning');
    return;
  }

  if (isStreaming) {
    console.log('❌ Already streaming, returning');
    return;
  }

  if (!agent) {
    console.error('❌ Agent not available');
    alert('❌ Agent not initialized properly');
    return;
  }
  
  // Add user message
  addMessage(message, true);
  messageInput.value = '';
  
  // Disable input
  isStreaming = true;
  sendButton.disabled = true;
  messageInput.disabled = true;
  
  // Add typing indicator
  const typingIndicator = addTypingIndicator();
  
  try {
    // Create streaming message container
    const streamingMessage = addMessage('', false, true);
    const contentDiv = streamingMessage.querySelector('.message-content') as HTMLDivElement;
    
    // Remove typing indicator
    typingIndicator.remove();
    
    let fullResponse = '';
    
    // Run agent with streaming (based on official docs)
    console.log('🚀 Starting streaming run...');
    const streamResult = await run(agent, message, {
      stream: true
    });

    // Use the text stream for character-by-character streaming
    const textStream = streamResult.toTextStream();

    // Process text stream
    for await (const textChunk of textStream) {
      console.log('📝 Text chunk:', textChunk);
      fullResponse += textChunk;
      contentDiv.textContent = fullResponse;
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Wait for completion (important!)
    await streamResult.completed;
    console.log('✅ Stream completed');

    // Remove streaming indicator
    streamingMessage.classList.remove('streaming');

    // Final content is already updated from the stream
    console.log('📄 Final response:', fullResponse);
    
  } catch (error) {
    console.error('Error:', error);
    typingIndicator.remove();
    addMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`, false);
  } finally {
    // Re-enable input
    isStreaming = false;
    sendButton.disabled = false;
    messageInput.disabled = false;
    messageInput.focus();
  }
}

// Event listeners
console.log('🎯 Setting up event listeners...');
sendButton.addEventListener('click', () => {
  console.log('🖱️ Send button clicked');
  sendMessage();
});

messageInput.addEventListener('keypress', (e) => {
  console.log('⌨️ Key pressed:', e.key);
  if (e.key === 'Enter' && !e.shiftKey) {
    console.log('↩️ Enter key pressed, sending message');
    e.preventDefault();
    sendMessage();
  }
});

console.log('✅ Event listeners set up successfully');

// Focus input on load
messageInput.focus();

// Add some example prompts
setTimeout(() => {
  const exampleDiv = document.createElement('div');
  exampleDiv.className = 'message assistant';
  exampleDiv.innerHTML = `
    <div class="message-content">
      💡 <strong>Try these examples:</strong><br>
      • "What's the weather in Tokyo?"<br>
      • "What time is it?"<br>
      • "Tell me a joke"<br>
      • "Explain how streaming works"
    </div>
  `;
  messagesContainer.appendChild(exampleDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}, 1000);
