# 🚀 Streaming Chat Demo

A beautiful frontend example demonstrating OpenAI Agents with the **Responses API** and real-time streaming.

## ✨ Features

- **🔄 Real-time Streaming**: Watch responses appear character by character
- **🛠️ Tool Integration**: Weather and time tools with visual feedback
- **🎨 Beautiful UI**: Modern, responsive chat interface
- **📡 Responses API**: Uses OpenAI's latest streaming-first API
- **⚡ Fast & Smooth**: Optimized for performance

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Start the development server
pnpm dev
```

The app will open at **http://localhost:3001**

## 🧪 Try These Examples

- "What's the weather in Tokyo?"
- "What time is it?"
- "Tell me a joke"
- "Explain how streaming works"

## 🔧 How It Works

1. **Responses API**: Uses `setOpenAIAPI('responses')` for streaming
2. **Real-time Updates**: `onChunk` callback updates UI in real-time
3. **Tool Calling**: Visual feedback when tools are executed
4. **Error Handling**: Graceful error handling with user feedback

## 📡 API Details

This example specifically demonstrates:
- **Endpoint**: `/v1/responses` (not `/v1/chat/completions`)
- **Streaming**: Character-by-character response streaming
- **Tool Calls**: Real-time tool execution feedback
- **Chunked Processing**: Different chunk types (text_delta, tool_call_started, etc.)

## 🎯 Key Code

```typescript
// Force Responses API
setOpenAIAPI('responses');

// Streaming with real-time updates
const result = await run(agent, message, {
  onChunk: (chunk) => {
    if (chunk.type === 'text_delta') {
      // Update UI with each character
      fullResponse += chunk.textDelta;
      contentDiv.textContent = fullResponse;
    }
  }
});
```
