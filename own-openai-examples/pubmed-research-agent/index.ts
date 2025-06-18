import { Agent, run, withTrace, MCPServerStdio, RunState, RunResult } from '@openai/agents';
import * as path from 'node:path';
import { createInterface } from 'node:readline/promises';
import * as dotenv from 'dotenv';
import * as fs from 'node:fs/promises';
import { getAgentConfig, getConfigInfo } from './agent-instructions';
import { biomedicalTranslatorTool } from './biomedical-translator-agent';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Memory management
interface SessionMemory {
  conversationId: string;
  history: any[];
  lastState?: string;
  researchContext: {
    entities: Record<string, any>;
    searches: string[];
    findings: string[];
  };
}

const MEMORY_FILE = 'pubmed-session-memory.json';

async function loadMemory(): Promise<SessionMemory> {
  try {
    const data = await fs.readFile(MEMORY_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return {
      conversationId: `session_${Date.now()}`,
      history: [],
      researchContext: {
        entities: {},
        searches: [],
        findings: []
      }
    };
  }
}

async function saveMemory(memory: SessionMemory): Promise<void> {
  await fs.writeFile(MEMORY_FILE, JSON.stringify(memory, null, 2));
}

async function main() {
  // Get agent configuration (you can change this to 'fast', 'deep', 'nano', or 'default')
  const agentConfig = getAgentConfig('default');

  console.log('Starting PubMed Research Agent with Memory & Tracing...');
  console.log(getConfigInfo(agentConfig));

  // Load session memory
  let sessionMemory = await loadMemory();
  console.log(`Session ID: ${sessionMemory.conversationId}`);

  // Create the MCP server configuration
  const mcpServer = new MCPServerStdio({
    name: 'PubTator3',
    fullCommand: `npx tsx ${path.join(__dirname, 'pubtator-mcp-server.ts')}`
  });

  try {
    console.log('Connecting to MCP server...');
    await mcpServer.connect();
    console.log('MCP server connected successfully!');
  } catch (error) {
    console.error('Error initializing MCP server:', error);
    return;
  }

  // Create an agent using the centralized configuration
  const agent = new Agent({
    name: agentConfig.name,
    model: agentConfig.model,
    modelSettings: agentConfig.modelSettings,
    instructions: agentConfig.instructions,
    mcpServers: [mcpServer],
    tools: [biomedicalTranslatorTool], // Add translator as a tool
  });

  // Create a CLI interface
  const rl = createInterface({ input: process.stdin, output: process.stdout });

  try {
    console.log('PubMed Research Assistant with Memory & Tracing');
    console.log('Type "exit" to quit, "memory" to view session memory, "clear" to clear memory');

    if (sessionMemory.history.length > 0) {
      console.log(`\n📚 Resuming session with ${sessionMemory.history.length} previous interactions`);
    }

    while (true) {
      const query = await rl.question('\nWhat would you like to research? ');

      if (query.toLowerCase() === 'exit') {
        break;
      }

      if (query.toLowerCase() === 'memory') {
        console.log('\n📋 Session Memory:');
        console.log(`Conversation ID: ${sessionMemory.conversationId}`);
        console.log(`Entities discovered: ${Object.keys(sessionMemory.researchContext.entities).length}`);
        console.log(`Searches performed: ${sessionMemory.researchContext.searches.length}`);
        console.log(`Key findings: ${sessionMemory.researchContext.findings.length}`);
        if (sessionMemory.researchContext.searches.length > 0) {
          console.log('Recent searches:', sessionMemory.researchContext.searches.slice(-3));
        }
        continue;
      }

      if (query.toLowerCase() === 'clear') {
        sessionMemory = {
          conversationId: `session_${Date.now()}`,
          history: [],
          researchContext: {
            entities: {},
            searches: [],
            findings: []
          }
        };
        await saveMemory(sessionMemory);
        console.log('🧹 Memory cleared! Starting fresh session.');
        continue;
      }

      // Use withTrace with session context
      await withTrace(
        'PubMed Research Session',
        async () => {
          console.log('🔬 Researching, please wait...');

          // Run with conversation history for context
          const result: RunResult<any, any> = await run(agent, sessionMemory.history.concat([
            { role: 'user', content: query }
          ]));

          // Debug: Show all tool calls including translator
          console.log('\n[DEBUG] Tool calls made during this interaction:');
          for (const item of result.newItems) {
            if (item.type === 'tool_call_item') {
              const rawItem = (item as any).rawItem;
              const toolName = rawItem?.name || 'unknown';
              const args = rawItem?.arguments ? JSON.parse(rawItem.arguments) : {};

              console.log(`[DEBUG] 🔧 Tool Called: ${toolName}`);

              if (toolName === 'translate_biomedical_terms') {
                console.log(`[DEBUG] 🌍 Translation Input: "${args.biomedical_terms || JSON.stringify(args)}"`);
              } else {
                const inputStr = JSON.stringify(args);
                const truncatedInput = inputStr.length > 100 ? inputStr.substring(0, 100) + '...' : inputStr;
                console.log(`[DEBUG] 📥 Tool Input: ${truncatedInput}`);
              }
            }

            if (item.type === 'tool_call_output_item') {
              const rawItem = (item as any).rawItem;
              const toolName = rawItem?.name || 'unknown';
              const output = rawItem?.result || 'no output';

              if (toolName === 'translate_biomedical_terms') {
                console.log(`[DEBUG] 🌍 Translation Output: "${output}"`);
              } else {
                console.log(`[DEBUG] 📤 Tool Result: ${toolName} returned data`);
              }
            }
          }

          // Update memory with new interaction
          sessionMemory.history = result.history;
          sessionMemory.lastState = result.state.toString();

          // Extract and store research context
          if (query.toLowerCase().includes('entity') || query.toLowerCase().includes('find')) {
            sessionMemory.researchContext.searches.push(query);
          }

          if (result.finalOutput) {
            sessionMemory.researchContext.findings.push(result.finalOutput.substring(0, 200) + '...');
          }

          // Save updated memory
          await saveMemory(sessionMemory);

          console.log('\n📊 Response:', result.finalOutput);
          console.log(`\n💾 Memory updated | Interactions: ${sessionMemory.history.length} | State saved: ${result.state ? 'Yes' : 'No'}`);
        },
        {
          groupId: sessionMemory.conversationId,
          metadata: {
            sessionType: 'pubmed-research',
            queryType: query.toLowerCase().includes('entity') ? 'entity-search' : 'general-research'
          }
        }
      );
    }
  } finally {
    rl.close();
    // Close the MCP server connection
    await mcpServer.close();
    console.log('\n👋 Session ended. Memory saved for next time!');
  }
}

main().catch(console.error);