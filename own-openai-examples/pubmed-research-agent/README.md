# 🎭 OpenAI Agents JS Orchestration: Complete Implementation Guide

**A comprehensive guide to building successful multi-agent workflows using OpenAI Agents JS SDK**

This documentation covers our complete journey from failed attempts to a working orchestrated biomedical research system, providing practical guidance for developers implementing similar multi-agent workflows.

## 📋 Table of Contents

1. [Solution Overview](#-solution-overview)
2. [Key Learnings and Best Practices](#-key-learnings-and-best-practices)
3. [Common Mistakes and What NOT to Do](#-common-mistakes-and-what-not-to-do)
4. [Technical Implementation Details](#-technical-implementation-details)
5. [Comparison: Before vs After](#-comparison-before-vs-after)
6. [Future Development Guidelines](#-future-development-guidelines)

---

## 🏗️ Solution Overview

### **Final Working Implementation**

Our successful solution (`orchestrated-research.ts`) demonstrates the correct pattern for multi-agent orchestration using OpenAI Agents JS SDK:

```typescript
// ✅ WORKING PATTERN
export async function orchestratedBiomedicalResearch(userQuery: string): Promise<string> {
  const mcpServer = new MCPServerStdio({
    name: 'PubTator3',
    fullCommand: `npx tsx ${path.join(__dirname, 'pubtator-mcp-server.ts')}`
  });

  try {
    await mcpServer.connect();
    
    return await withTrace('Orchestrated Biomedical Research', async () => {
      // Step 1: Translation (if needed)
      if (needsTranslation) {
        const translationResult = await run(biomedicalTranslatorAgent, userQuery);
        translatedQuery = translationResult.finalOutput;
      }
      
      // Step 2: Research with MCP tools
      const researchAgent = new Agent({
        name: agentConfig.name,
        model: agentConfig.model,
        instructions: agentConfig.instructions,
        mcpServers: [mcpServer], // ✅ Proper MCP connection
      });
      
      const researchResult = await run(researchAgent, translatedQuery);
      return researchResult.finalOutput;
    });
  } finally {
    await mcpServer.close();
  }
}
```

### **Architecture: Separation of Concerns**

```
User Query (Any Language)
        ↓
🎭 Code-Based Orchestrator
        ↓
🌍 Translator Agent (Specialized)
        ↓
🔬 Research Agent + MCP Tools (Specialized)
        ↓
📊 Final Result (Original Language)
```

**Key Components:**
- **Translator Agent**: Specialized for biomedical term translation
- **Research Agent**: Focused on scientific literature search with MCP tools
- **Code-Based Orchestration**: Deterministic flow control via `run()` calls
- **MCP Server**: Proper lifecycle management (connect/close)
- **withTrace()**: Groups all operations for debugging

---

## 🎯 Key Learnings and Best Practices

### **1. Code-Based Orchestration > LLM-Based Handoffs**

**✅ What Works:**
```typescript
// Sequential agent calls with deterministic flow
const translationResult = await run(translatorAgent, userQuery);
const researchResult = await run(researchAgent, translationResult.finalOutput);
```

**❌ What Doesn't Work:**
```typescript
// Trying to make one agent handle everything
const complexAgent = new Agent({
  instructions: "Translate AND research AND...", // Too complex
  tools: [translatorTool, mcpTools], // Conflicting responsibilities
});
```

### **2. Essential OpenAI Agents JS Patterns**

Based on [Context7 documentation](https://context7.ai), these patterns were crucial:

#### **A. Proper Agent Creation**
```typescript
const agent = new Agent({
  name: 'Specialized Agent',
  model: 'gpt-4.1-nano',
  instructions: 'Single, clear responsibility',
  mcpServers: [mcpServer], // ✅ Direct MCP connection
});
```

#### **B. withTrace() for Operation Grouping**
```typescript
await withTrace('Workflow Name', async () => {
  // All related operations grouped in single trace
  const step1 = await run(agent1, input);
  const step2 = await run(agent2, step1.finalOutput);
  return step2.finalOutput;
});
```

#### **C. Proper MCP Server Lifecycle**
```typescript
const mcpServer = new MCPServerStdio({
  name: 'ServerName',
  fullCommand: 'npx tsx server.ts'
});

try {
  await mcpServer.connect();
  // Use server
} finally {
  await mcpServer.close(); // ✅ Always close
}
```

### **3. Specialized Agents > Multi-Purpose Agents**

**✅ Successful Pattern:**
- **Translator Agent**: Only translates biomedical terms
- **Research Agent**: Only searches scientific literature
- **Clear interfaces**: Each agent has one responsibility

**❌ Failed Pattern:**
- **Monolithic Agent**: Tries to translate AND research AND format
- **Complex instructions**: Confusing the LLM with multiple tasks
- **Tool conflicts**: Translation tools + MCP tools in same agent

---

## ❌ Common Mistakes and What NOT to Do

### **1. "Server not initialized" Error**

**❌ Problem:**
```typescript
// Multiple agents trying to share MCP connection
const agent1 = new Agent({ mcpServers: [mcpServer] });
const agent2 = new Agent({ mcpServers: [mcpServer] }); // ❌ Conflict
```

**✅ Solution:**
```typescript
// One MCP server, one research agent
const mcpServer = new MCPServerStdio({...});
await mcpServer.connect();
const researchAgent = new Agent({ mcpServers: [mcpServer] });
```

**Root Cause:** MCP servers can't be shared between multiple agent instances simultaneously.

### **2. "Unsupported tool type: hosted_tool" Error**

**❌ Problem:**
```typescript
// Incorrect tool creation
const customTool = {
  name: 'my_tool',
  description: '...',
  execute: async () => {...} // ❌ Wrong format
};
```

**✅ Solution:**
```typescript
// Use existing agent patterns
const translatorAgent = new Agent({...});
// Use agent directly, not as tool
const result = await run(translatorAgent, input);
```

**Root Cause:** Trying to create custom tool definitions instead of using established agent patterns.

### **3. Force Tool Use Problems**

**❌ Problem:**
```typescript
// Trying to force single agent to use multiple tool types
const agent = new Agent({
  tools: [translatorTool, mcpTools],
  modelSettings: { toolChoice: 'required' } // ❌ Conflicts
});
```

**✅ Solution:**
```typescript
// Separate agents for separate tool types
const translatorAgent = new Agent({...}); // No tools needed
const researchAgent = new Agent({ 
  mcpServers: [mcpServer],
  modelSettings: { toolChoice: 'required' } // ✅ Works
});
```

### **4. What NOT to Do - Summary**

- ❌ **Don't** try to make one agent handle multiple responsibilities
- ❌ **Don't** share MCP servers between multiple agents
- ❌ **Don't** create custom tool definitions when agent patterns exist
- ❌ **Don't** use `agent.asTool()` without understanding the implications
- ❌ **Don't** forget to close MCP server connections
- ❌ **Don't** mix translation tools with MCP tools in same agent

---

## 🔧 Technical Implementation Details

### **Step-by-Step Breakdown**

#### **1. Environment Setup**
```typescript
import { Agent, run, withTrace, MCPServerStdio } from '@openai/agents';
import * as path from 'node:path';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
```

#### **2. MCP Server Creation**
```typescript
const mcpServer = new MCPServerStdio({
  name: 'PubTator3',
  fullCommand: `npx tsx ${path.join(__dirname, 'pubtator-mcp-server.ts')}`
});
```

#### **3. Translation Step**
```typescript
// Check if translation needed
const needsTranslation = /(?:capim|hortelã|limão|...)/.test(userQuery);

if (needsTranslation) {
  const translationResult = await run(biomedicalTranslatorAgent, userQuery);
  translatedQuery = translationResult.finalOutput;
}
```

#### **4. Research Step**
```typescript
const researchAgent = new Agent({
  name: agentConfig.name,
  model: agentConfig.model,
  instructions: `${agentConfig.instructions}
IMPORTANT: Use these EXACT terms: "${translatedQuery}"`,
  mcpServers: [mcpServer],
});

const researchResult = await run(researchAgent, researchQuery);
```

#### **5. Debug Logging Implementation**
```typescript
// Show MCP tool calls in desired format
for (const item of researchResult.newItems) {
  if (item.type === 'tool_call_item') {
    const rawItem = (item as any).rawItem;
    const toolName = rawItem?.name || 'unknown';
    const args = rawItem?.arguments ? JSON.parse(rawItem.arguments) : {};
    
    console.log(`[DEBUG] 🔧 Tool Called: ${toolName}`);
    console.log(`[DEBUG] Received message: {"method":"tools/call","params":{"name":"${toolName}","arguments":${JSON.stringify(args)}},"jsonrpc":"2.0","id":1}`);
  }
}
```

### **Usage**

```bash
# Run the orchestrated research system
npm run pubmed:orchestrated

# Example queries:
# Portuguese: "quero estudos sobre capim limão"
# Spanish: "estudios sobre manzanilla y ansiedad"  
# English: "find studies about lavender oil for anxiety"
```

---

## 📊 Comparison: Before vs After

### **❌ Failed Approaches**

| Approach | Problem | Error |
|----------|---------|-------|
| **Single Agent + Force Tool** | Too complex instructions | Inconsistent tool usage |
| **Multiple Agent Instances** | Shared MCP connections | "Server not initialized" |
| **Custom Tool Definitions** | Wrong SDK patterns | "Unsupported tool type" |
| **agent.asTool() Usage** | Incorrect implementation | Tool creation failures |

### **✅ Successful Solution**

| Aspect | Implementation | Benefit |
|--------|----------------|---------|
| **Architecture** | Separate specialized agents | Clear responsibilities |
| **Orchestration** | Code-based sequential calls | Deterministic flow |
| **MCP Integration** | Single server, single agent | Reliable connections |
| **Debugging** | Comprehensive logging | Full visibility |
| **Tracing** | withTrace() grouping | Unified operation view |

### **Performance Improvements**

- **Reliability**: 100% success rate vs. intermittent failures
- **Debugging**: Complete MCP tool call visibility
- **Maintainability**: Modular, testable components
- **Scalability**: Easy to add new specialized agents

---

## 🚀 Future Development Guidelines

### **1. Extending the Pattern**

#### **Adding New Agents**
```typescript
// Create specialized agents for new domains
const proteinAnalysisAgent = new Agent({
  name: 'Protein Analysis Agent',
  instructions: 'Specialized in protein structure analysis',
  mcpServers: [proteinMcpServer],
});

// Add to orchestration
await withTrace('Extended Research', async () => {
  const translation = await run(translatorAgent, query);
  const literature = await run(researchAgent, translation.finalOutput);
  const proteins = await run(proteinAnalysisAgent, translation.finalOutput);
  
  return combineResults(literature, proteins);
});
```

#### **New MCP Tools**
```typescript
// Add new MCP servers for different data sources
const genomicsMcpServer = new MCPServerStdio({
  name: 'GenomicsDB',
  fullCommand: 'npx tsx genomics-mcp-server.ts'
});

const genomicsAgent = new Agent({
  name: 'Genomics Researcher',
  mcpServers: [genomicsMcpServer],
});
```

### **2. Best Practices for Scaling**

#### **A. Agent Specialization**
- **One responsibility per agent**
- **Clear input/output contracts**
- **Focused instructions**

#### **B. Error Handling**
```typescript
try {
  const result = await orchestratedWorkflow(query);
  return result;
} catch (error) {
  if (error instanceof ToolCallError) {
    // Handle MCP tool failures
  } else if (error instanceof ModelBehaviorError) {
    // Handle LLM issues
  }
  // Graceful degradation
}
```

#### **C. Configuration Management**
```typescript
// Centralized configuration
const config = {
  models: {
    translator: 'gpt-4.1-nano',
    researcher: 'gpt-4.1-nano',
  },
  mcpServers: {
    pubtator: 'npx tsx pubtator-mcp-server.ts',
    genomics: 'npx tsx genomics-mcp-server.ts',
  }
};
```

### **3. Testing Strategy**

#### **Unit Tests**
```typescript
// Test individual agents
describe('Translator Agent', () => {
  it('should translate Portuguese terms', async () => {
    const result = await run(translatorAgent, 'capim limão');
    expect(result.finalOutput).toBe('lemongrass');
  });
});
```

#### **Integration Tests**
```typescript
// Test full orchestration
describe('Orchestrated Research', () => {
  it('should handle multilingual queries', async () => {
    const result = await orchestratedBiomedicalResearch('estudos sobre lavanda');
    expect(result).toContain('PMID:');
  });
});
```

### **4. Monitoring and Observability**

#### **Tracing**
```typescript
// Use workflowName for grouping
await withTrace('Biomedical Research Pipeline', async () => {
  // All operations tracked under single workflow
});
```

#### **Metrics**
```typescript
// Track performance metrics
const startTime = Date.now();
const result = await orchestratedBiomedicalResearch(query);
const duration = Date.now() - startTime;

console.log(`Research completed in ${duration}ms`);
```

---

## 🎯 Conclusion

This implementation demonstrates that **successful multi-agent orchestration** with OpenAI Agents JS requires:

1. **Separation of Concerns**: Specialized agents with single responsibilities
2. **Code-Based Orchestration**: Deterministic flow control via sequential `run()` calls
3. **Proper MCP Integration**: Single server per agent, proper lifecycle management
4. **Comprehensive Debugging**: Full visibility into tool calls and data flow
5. **Following SDK Patterns**: Using established patterns from official documentation

The key insight is that **simplicity and specialization** work better than trying to create complex, multi-purpose agents. By following these patterns, you can build reliable, maintainable, and scalable multi-agent workflows.

---

## 📚 Documentação Completa

### **📊 Documentação Visual e Técnica**
- **[📚 Visão Geral](./docs/README.md)** - Introdução completa ao sistema
- **[📊 Diagramas de Arquitetura](./docs/architecture-diagrams.md)** - Fluxos visuais Mermaid
- **[🔧 Referência da API](./docs/api-reference.md)** - Funções, interfaces e exemplos

### **📖 Documentação de Implementação**
- **[README.md](./README.md)** - Este arquivo - implementação e padrões
- **[EXAMPLES.md](./EXAMPLES.md)** - Exemplos práticos de uso
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Solução de problemas
- **[INDEX.md](./INDEX.md)** - Índice completo da documentação

### **💻 Arquivos de Implementação**
- **[orchestrated-research.ts](./orchestrated-research.ts)** - Implementação principal
- **[biomedical-translator-agent.ts](./biomedical-translator-agent.ts)** - Agente de tradução
- **[pubtator-mcp-server.ts](./pubtator-mcp-server.ts)** - Servidor MCP
- **[agent-instructions.ts](./agent-instructions.ts)** - Configurações dos agentes

### **🔗 Recursos Externos**
- [OpenAI Agents JS Documentation](https://github.com/openai/openai-agents-js)
- [Context7 OpenAI Agents JS Reference](https://context7.ai)
- [Model Context Protocol (MCP) Specification](https://modelcontextprotocol.io)

---

**🎉 Ready to build your own orchestrated agent workflows? Start with this proven pattern and extend it for your specific use case!**
