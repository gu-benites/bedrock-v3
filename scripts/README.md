# Streaming API Test Scripts

This directory contains comprehensive test scripts for demonstrating and validating our streaming AI infrastructure. These scripts provide real-time testing of our OpenAI Agents JS SDK integration with Server-Sent Events (SSE) streaming.

## 📋 Available Scripts

| Script | Purpose | Command |
|--------|---------|---------|
| `test-streaming.js` | Single scenario testing with detailed output | `npm run test:streaming` |
| `demo-streaming.js` | Multi-scenario demo with all test cases | `npm run demo:streaming` |
| `validate-streaming.js` | Environment and configuration validation | `npm run validate:streaming` |
| `test-streaming.sh` | Unix/Linux wrapper script | `./scripts/test-streaming.sh` |
| `test-streaming.bat` | Windows wrapper script | `scripts\test-streaming.bat` |

## 🧪 Streaming API Test (`test-streaming.js`)

A comprehensive test script that demonstrates our `/api/ai/streaming` endpoint with real-time response display in the terminal.

### Features

- **Real-time streaming display** with visual indicators
- **Multiple test scenarios** with realistic health concern data
- **Comprehensive statistics** including timing and performance metrics
- **Error handling** with retry logic and detailed error messages
- **Colored terminal output** for better readability
- **Typing indicators** and progress animations
- **Verbose mode** for debugging and development

### Prerequisites

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Set up environment variables** (create `.env.local`):
   ```bash
   OPENAI_API_KEY=your_openai_api_key_here
   NEXT_PUBLIC_APP_URL=http://localhost:9002  # Optional, defaults to localhost:9002
   ```

### Quick Start

```bash
# Run with default scenario (chronic anxiety)
npm run test:streaming

# Run with a specific scenario
npm run test:streaming -- --scenario digestive-issues

# Run with custom health concern
npm run test:streaming -- --health-concern "I have joint pain and stiffness"

# Run with verbose output for debugging
npm run test:streaming -- --verbose

# List all available scenarios
npm run test:streaming -- --list-scenarios

# Run demo with all scenarios
npm run demo:streaming
```

### Available Test Scenarios

| Scenario | Health Concern | Demographics |
|----------|----------------|--------------|
| `chronic-anxiety` | Chronic anxiety and stress affecting daily life | Female, 32, Adult |
| `digestive-issues` | Frequent digestive problems and bloating | Male, 28, Adult |
| `chronic-headaches` | Chronic headaches and migraines | Female, 45, Adult |
| `sleep-problems` | Trouble falling and staying asleep | Male, 65, Senior |

### Command Line Options

```bash
Options:
  -h, --health-concern <text>    Custom health concern text
  -s, --scenario <name>          Use predefined scenario (default: chronic-anxiety)
  -v, --verbose                  Show detailed request/response information
  --list-scenarios               List all available test scenarios
  --help                         Show help message
```

### Example Output

```
🧪 Streaming API Test
Testing endpoint: http://localhost:3000/api/ai/streaming

📋 Test Configuration:
   Health Concern: "I have been experiencing chronic anxiety and stress..."
   Demographics: female, adult (32)
   Language: en

[14:23:45] 🔗 Connecting to streaming API...
[14:23:46] 🚀 Streaming started
Based on your description of chronic anxiety and stress affecting daily life and sleep patterns, here are the potential underlying causes to consider:

**Stress-Related Factors:**
- Chronic work or life stress
- Major life transitions or changes
- Financial pressures or concerns

**Lifestyle Factors:**
- Poor sleep hygiene
- Excessive caffeine consumption
- Lack of regular exercise
- Inadequate nutrition

**Psychological Factors:**
- Perfectionism or high self-expectations
- Past trauma or unresolved emotional issues
- Social anxiety or relationship stress

[14:23:52] ✅ Streaming completed

📊 Streaming Statistics:
   Total Duration: 6.2s
   Streaming Duration: 5.8s
   Time to First Chunk: 420ms
   Chunks Received: 23
   Total Bytes: 1,247
   Average Chunk Size: 54 bytes

🎯 Final Results:
   Potential Causes Found: 8
   1. Chronic Stress
      Long-term stress affecting daily life and mental health
   2. Poor Sleep Quality
      Inadequate or disrupted sleep patterns
   3. Caffeine Sensitivity
      Excessive caffeine intake causing anxiety symptoms
   ...

✅ Test completed successfully!
```

### Technical Details

The script demonstrates the complete streaming lifecycle:

1. **Connection Phase**: Establishes HTTP connection to the streaming endpoint
2. **Request Phase**: Sends POST request with health concern and demographic data
3. **Streaming Phase**: Receives and displays Server-Sent Events (SSE) in real-time
4. **Completion Phase**: Processes final results and displays statistics

### API Request Format

The script sends requests in the format expected by our streaming API:

```json
{
  "feature": "recipe-wizard",
  "step": "potential-causes",
  "data": {
    "healthConcern": "User's health concern description",
    "demographics": {
      "gender": "female",
      "ageCategory": "adult",
      "specificAge": 32,
      "language": "en"
    }
  }
}
```

### Error Handling

The script includes comprehensive error handling for:

- **Network errors**: Connection timeouts, DNS resolution failures
- **HTTP errors**: 4xx/5xx status codes with detailed error messages
- **Streaming errors**: SSE parsing errors, incomplete streams
- **API errors**: Application-level errors from the streaming endpoint

### Development and Debugging

Use the `--verbose` flag to see detailed information about:

- Request headers and payload
- Response headers and status codes
- Individual SSE chunks and parsing
- Timing information for each phase
- Stack traces for errors

### Integration Testing

This script serves as both a manual testing tool and an integration test for:

- OpenAI Agents JS SDK integration
- SSE (Server-Sent Events) formatting
- API route functionality
- Error handling and recovery
- Performance and latency characteristics

### Configuration

The script can be configured by modifying the `config` object:

```javascript
const config = {
  baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002',
  endpoint: '/api/ai/streaming',
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
  retryDelay: 1000 // 1 second
};
```

### Environment Variables

- `NEXT_PUBLIC_APP_URL`: Base URL for the application (defaults to localhost:9002)

### Troubleshooting

**Common Issues:**

1. **Connection refused**: Make sure the Next.js development server is running (`npm run dev`)
2. **API key errors**: Ensure `OPENAI_API_KEY` is set in your environment
3. **Timeout errors**: Check network connectivity and API response times
4. **Parse errors**: Verify the API is returning valid SSE format

**Debug Steps:**

1. Run with `--verbose` flag to see detailed output
2. Check the API route directly in your browser
3. Verify environment variables are set correctly
4. Test with different scenarios to isolate issues
