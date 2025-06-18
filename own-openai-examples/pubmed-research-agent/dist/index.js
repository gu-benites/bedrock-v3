"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const agents_1 = require("@openai/agents");
const path = __importStar(require("node:path"));
const promises_1 = require("node:readline/promises");
async function main() {
    console.log('Starting PubMed Research Agent...');
    // Create the MCP server configuration
    const mcpServer = new agents_1.MCPServerStdio({
        name: 'PubTator3',
        command: 'npx',
        args: ['ts-node', path.join(__dirname, 'pubtator-mcp-server.ts')]
    });
    await mcpServer.connect();
    // Create an agent that uses our MCP server
    const agent = new agents_1.Agent({
        name: 'PubMed Research Assistant',
        instructions: `You are a biomedical research assistant with access to PubTator3 tools.
        You can help users find information about biomedical entities, search literature, and discover relationships between entities.
        Always cite your sources with PMID when providing information from scientific literature.
        Available tools:
        - find_entity: Look up identifiers for biomedical concepts (genes, diseases, chemicals, etc.)
        - search_pubtator: Search for relevant scientific articles
        - get_paper_text: Retrieve the full text of articles
        - find_related_entities: Discover relationships between biomedical entities
        Remember that PubTator has a rate limit of 3 requests per second.`,
        mcpServers: [mcpServer],
    });
    // Create a CLI interface
    const rl = (0, promises_1.createInterface)({ input: process.stdin, output: process.stdout });
    try {
        console.log('PubMed Research Assistant');
        console.log('Type "exit" to quit');
        while (true) {
            const query = await rl.question('\nWhat would you like to research? ');
            if (query.toLowerCase() === 'exit') {
                break;
            }
            await (0, agents_1.withTrace)('PubMed Research', async () => {
                console.log('Researching, please wait...');
                const result = await (0, agents_1.run)(agent, query);
                console.log('\nResponse:', result.finalOutput);
            });
        }
    }
    finally {
        rl.close();
        // Close the MCP server connection
        await mcpServer.close();
    }
}
main().catch(console.error);
