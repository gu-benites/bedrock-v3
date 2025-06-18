# 🔧 Troubleshooting Guide: OpenAI Agents JS Orchestration

**Common issues and their solutions when implementing multi-agent workflows**

## 🚨 Common Errors and Solutions

### **1. "Server not initialized" Error**

**❌ Error Message:**
```
Error: Server not initialized. Make sure you call connect() first.
```

**🔍 Root Cause:**
- MCP server not properly connected before agent creation
- Multiple agents trying to share the same MCP server instance
- Server connection closed prematurely

**✅ Solution:**
```typescript
// ❌ WRONG: Multiple agents sharing MCP server
const agent1 = new Agent({ mcpServers: [mcpServer] });
const agent2 = new Agent({ mcpServers: [mcpServer] }); // Conflict!

// ✅ CORRECT: One MCP server, one agent
const mcpServer = new MCPServerStdio({...});
await mcpServer.connect(); // ✅ Connect first
const researchAgent = new Agent({ mcpServers: [mcpServer] });
```

**🔧 Debug Steps:**
1. Check if `await mcpServer.connect()` is called before agent creation
2. Verify only one agent uses the MCP server
3. Ensure server isn't closed before agent execution
4. Add connection status logging:
```typescript
console.log('🔌 Connecting to MCP server...');
await mcpServer.connect();
console.log('✅ MCP server connected successfully!');
```

---

### **2. "Unsupported tool type: hosted_tool" Error**

**❌ Error Message:**
```
Error: Unsupported tool type: hosted_tool
```

**🔍 Root Cause:**
- Incorrect tool definition format
- Using `agent.asTool()` incorrectly
- Mixing custom tools with MCP tools

**✅ Solution:**
```typescript
// ❌ WRONG: Custom tool definition
const customTool = {
  name: 'my_tool',
  execute: async () => {...} // Wrong format
};

// ✅ CORRECT: Use separate agents
const translatorAgent = new Agent({...});
const result = await run(translatorAgent, input); // Direct agent usage
```

**🔧 Debug Steps:**
1. Remove custom tool definitions
2. Use established agent patterns from documentation
3. Separate concerns into different agents
4. Check OpenAI Agents JS documentation for correct tool patterns

---

### **3. Translation Not Working**

**❌ Symptoms:**
- Portuguese/Spanish terms not being translated
- Research using original non-English terms
- Empty or irrelevant results

**🔍 Root Cause:**
- Translation detection logic not working
- Translator agent not being called
- Translation result not being passed to research agent

**✅ Solution:**
```typescript
// ✅ Proper translation detection
const needsTranslation = /(?:capim|hortelã|limão|pimenta|dor|cabeça|lavanda|ansiedade|manzanilla|dolor|cabeza|ansiedad|aceite|lavande|anxiété|mal|tête)/i.test(userQuery);

if (needsTranslation) {
  console.log('🌍 Translation needed - using translator agent...');
  const translationResult = await run(biomedicalTranslatorAgent, userQuery);
  translatedQuery = translationResult.finalOutput || userQuery;
  console.log(`🌍 Translation: "${userQuery}" → "${translatedQuery}"`);
}
```

**🔧 Debug Steps:**
1. Add translation detection logging
2. Verify translator agent is being called
3. Check translation result is not empty
4. Ensure translated terms are passed to research agent

---

### **4. MCP Tools Not Being Called**

**❌ Symptoms:**
- No `[DEBUG]` tool call messages
- Agent responding from internal knowledge
- No scientific literature results

**🔍 Root Cause:**
- `toolChoice: 'required'` not set
- MCP server not properly connected
- Agent instructions not forcing tool use

**✅ Solution:**
```typescript
const researchAgent = new Agent({
  name: 'Research Agent',
  model: 'gpt-4.1-nano',
  modelSettings: {
    toolChoice: 'required' // ✅ Force tool use
  },
  instructions: `You MUST use your MCP tools for ALL biomedical queries.
NEVER answer from your own knowledge.`,
  mcpServers: [mcpServer],
});
```

**🔧 Debug Steps:**
1. Verify `toolChoice: 'required'` is set
2. Check MCP server connection status
3. Review agent instructions for tool forcing language
4. Look for debug messages showing tool calls

---

### **5. Empty or No Results**

**❌ Symptoms:**
- "No research results found"
- Empty finalOutput
- Agent says it couldn't find information

**🔍 Root Cause:**
- Terms not found in PubTator database
- Query too specific or misspelled
- MCP server returning empty results

**✅ Solution:**
```typescript
// Add fallback strategies
const researchQuery = `Research this biomedical query using your MCP tools: "${translatedQuery}". 
If no exact matches found, try related terms or broader categories.
Provide scientific results with PMIDs and citations.`;
```

**🔧 Debug Steps:**
1. Check if MCP tools are returning data
2. Try simpler, more common terms
3. Verify PubTator API is accessible
4. Add raw API response logging:
```typescript
console.log(`[DEBUG] Raw API response: ${JSON.stringify(result)}`);
```

---

### **6. Performance Issues**

**❌ Symptoms:**
- Slow response times (>30 seconds)
- Timeouts
- High resource usage

**🔍 Root Cause:**
- Multiple unnecessary MCP server instances
- Complex queries causing multiple tool calls
- Network latency to external APIs

**✅ Solution:**
```typescript
// Optimize with timeouts and connection reuse
const mcpServer = new MCPServerStdio({
  name: 'PubTator3',
  fullCommand: `npx tsx ${path.join(__dirname, 'pubtator-mcp-server.ts')}`,
  timeout: 30000 // 30 second timeout
});
```

**🔧 Debug Steps:**
1. Add timing logs to identify bottlenecks
2. Monitor MCP server resource usage
3. Implement query simplification
4. Add connection pooling if needed

---

## 🔍 Debugging Techniques

### **1. Enable Comprehensive Logging**

```typescript
// Add detailed logging throughout the workflow
console.log('🎭 Starting orchestrated research...');
console.log(`📝 Original query: "${userQuery}"`);
console.log(`🌍 Translation needed: ${needsTranslation}`);
console.log(`🔬 Translated query: "${translatedQuery}"`);
console.log(`📊 Final result length: ${result.length}`);
```

### **2. MCP Server Debug Mode**

```bash
# Enable MCP server debugging
DEBUG=mcp:* npm run pubmed:orchestrated
```

### **3. OpenAI Agents SDK Debug Mode**

```bash
# Enable SDK debugging
DEBUG=openai-agents:* npm run pubmed:orchestrated
```

### **4. Step-by-Step Verification**

```typescript
async function debugOrchestration(userQuery: string) {
  console.log('🔍 DEBUG MODE: Step-by-step verification');
  
  // Step 1: Test translation
  console.log('1️⃣ Testing translation...');
  const translationResult = await run(biomedicalTranslatorAgent, userQuery);
  console.log(`Translation result: ${translationResult.finalOutput}`);
  
  // Step 2: Test MCP connection
  console.log('2️⃣ Testing MCP connection...');
  const mcpServer = new MCPServerStdio({...});
  await mcpServer.connect();
  console.log('MCP server connected ✅');
  
  // Step 3: Test research agent
  console.log('3️⃣ Testing research agent...');
  const researchAgent = new Agent({...});
  const researchResult = await run(researchAgent, translationResult.finalOutput);
  console.log(`Research result: ${researchResult.finalOutput?.substring(0, 200)}...`);
  
  await mcpServer.close();
}
```

---

## 🛠️ Environment Issues

### **1. Missing Environment Variables**

**❌ Error:**
```
Error: OpenAI API key not found
```

**✅ Solution:**
```bash
# Check .env.local file exists and contains:
OPENAI_API_KEY=your_api_key_here
```

### **2. Node.js Version Issues**

**❌ Error:**
```
SyntaxError: Unexpected token '?'
```

**✅ Solution:**
```bash
# Ensure Node.js 18+ is installed
node --version  # Should be v18.0.0 or higher
npm install -g npm@latest
```

### **3. TypeScript Compilation Issues**

**❌ Error:**
```
Cannot find module '@openai/agents'
```

**✅ Solution:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Verify TypeScript configuration
npx tsc --noEmit
```

---

## 📊 Health Check Script

Create a health check to verify everything is working:

```typescript
// health-check.ts
import { orchestratedBiomedicalResearch } from './orchestrated-research';

async function healthCheck() {
  console.log('🏥 Running health check...');
  
  const testCases = [
    { query: 'lavender', expected: 'english' },
    { query: 'lavanda', expected: 'portuguese' },
    { query: 'manzanilla', expected: 'spanish' }
  ];
  
  for (const testCase of testCases) {
    try {
      console.log(`\n🧪 Testing ${testCase.expected}: "${testCase.query}"`);
      const result = await orchestratedBiomedicalResearch(testCase.query);
      
      if (result && result.length > 50) {
        console.log(`✅ ${testCase.expected} test passed`);
      } else {
        console.log(`❌ ${testCase.expected} test failed: insufficient result`);
      }
    } catch (error) {
      console.log(`❌ ${testCase.expected} test failed: ${error.message}`);
    }
  }
  
  console.log('\n🏥 Health check completed');
}

// Run health check
healthCheck().catch(console.error);
```

```bash
# Run health check
npx tsx health-check.ts
```

---

## 🆘 Getting Help

### **1. Check Documentation First**
- [README.md](./README.md) - Complete implementation guide
- [EXAMPLES.md](./EXAMPLES.md) - Practical usage examples
- [OpenAI Agents JS Docs](https://github.com/openai/openai-agents-js)

### **2. Enable Debug Mode**
```bash
DEBUG=openai-agents:*,mcp:* npm run pubmed:orchestrated
```

### **3. Minimal Reproduction**
Create a minimal test case:
```typescript
// minimal-test.ts
import { Agent, run } from '@openai/agents';

async function minimalTest() {
  const agent = new Agent({
    name: 'Test Agent',
    instructions: 'You are a test agent'
  });
  
  const result = await run(agent, 'Hello');
  console.log(result.finalOutput);
}

minimalTest().catch(console.error);
```

### **4. Common Solutions Checklist**

- [ ] Environment variables set correctly
- [ ] Node.js version 18+
- [ ] Dependencies installed (`npm install`)
- [ ] MCP server connects successfully
- [ ] Only one agent per MCP server
- [ ] `toolChoice: 'required'` set for research agent
- [ ] Translation detection working
- [ ] Debug logging enabled

---

**🎯 Remember: Most issues stem from incorrect MCP server usage or agent configuration. Follow the working patterns in our implementation and you'll avoid 90% of common problems!**
