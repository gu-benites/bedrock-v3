# 🔧 API Reference - Sistema de Pesquisa Biomédica

**Referência completa das funções, interfaces e agentes do sistema**

## 📚 Funções Principais

### `orchestratedBiomedicalResearch()`

Função principal que implementa o fluxo completo de pesquisa biomédica.

```typescript
async function orchestratedBiomedicalResearch(
  userQuery: string,
  sessionMemory?: OrchestrationMemory,
  sharedMcpServer?: MCPServerStdio
): Promise<{
  result: string;
  memory: OrchestrationMemory;
  runResult: RunResult<any, any>;
}>
```

**Parâmetros:**
- `userQuery`: Query do usuário em qualquer idioma suportado
- `sessionMemory`: Memória da sessão (opcional)
- `sharedMcpServer`: Servidor MCP compartilhado (opcional)

**Retorno:**
- `result`: Resultado da pesquisa em formato texto
- `memory`: Memória atualizada da sessão
- `runResult`: Resultado completo do agente

### `orchestratedBiomedicalResearchWithProperPatterns()`

Versão melhorada usando padrões OpenAI Agents JS completos.

```typescript
async function orchestratedBiomedicalResearchWithProperPatterns(
  userQuery: string,
  sessionMemory?: OrchestrationMemory,
  sharedMcpServer?: MCPServerStdio
): Promise<{
  result: string;
  memory: OrchestrationMemory;
  runResult: RunResult<any, any>;
}>
```

**Características:**
- Input Guardrails com agente de classificação
- Routing com handoffs entre agentes
- Output Guardrails para validação
- Tracing completo com `withTrace()`

### `testBothApproaches()`

Função para comparar as duas implementações.

```typescript
async function testBothApproaches(query: string): Promise<void>
```

**Uso:**
```bash
test estudos sobre lavanda
```

## 🛡️ Input Guardrails

### `queryClassificationGuard`

Agente especializado em classificação de queries.

```typescript
const queryClassificationGuard = new Agent({
  name: 'Query Classification Guard',
  model: 'gpt-4.1-nano',
  outputType: QueryClassificationSchema,
  instructions: `...`
});
```

**Schema de Saída:**
```typescript
const QueryClassificationSchema = z.object({
  queryType: z.enum(['biomedical_search', 'pmid_details', 'paper_analysis', 'general_question']),
  extractedPMID: z.string().nullable(),
  needsTranslation: z.boolean(),
  detectedLanguage: z.string(),
  confidence: z.number().min(0).max(1),
  biomedicalTerms: z.array(z.string()),
  reasoning: z.string()
});
```

### `classifyQueryWithInputGuardrail()`

Função de fallback para classificação usando pattern matching.

```typescript
function classifyQueryWithInputGuardrail(
  userQuery: string,
  sessionMemory: OrchestrationMemory
): QueryClassification
```

## 🎭 Agentes Especializados

### `createPMIDDetailsAgent()`

Cria agente especializado em detalhes de papers.

```typescript
function createPMIDDetailsAgent(mcpServer: MCPServerStdio): Agent<any, any>
```

**Ferramentas:**
- `get_paper_text`: Busca texto completo do paper
- `search_pubtator`: Fallback para informações básicas

### `createBiomedicalSearchAgent()`

Cria agente especializado em busca biomédica.

```typescript
function createBiomedicalSearchAgent(mcpServer: MCPServerStdio): Agent<any, any>
```

**Ferramentas:**
- `search_pubtator`: Busca na literatura
- `find_entity`: Identificação de entidades biomédicas

### `createTriageAgent()`

Cria agente de triagem com handoffs.

```typescript
function createTriageAgent(
  pmidAgent: Agent<any, any>,
  searchAgent: Agent<any, any>
): Agent<any, any>
```

**Handoffs:**
- PMID Details Specialist
- Biomedical Search Specialist

## 💾 Sistema de Memória

### `OrchestrationMemory`

Interface principal para memória da sessão.

```typescript
interface OrchestrationMemory {
  conversationId: string;
  sessionStarted: string;
  totalInteractions: number;
  
  languageDetectionHistory: Array<{
    query: string;
    detectedLanguage: string;
    needsTranslation: boolean;
    confidence: number;
    timestamp: string;
  }>;
  
  researchContext: {
    entities: Record<string, any>;
    searches: string[];
    findings: string[];
    pmids: string[];
  };
  
  conversationHistory: any[];
  lastRunState?: string;
  lastRunResult?: any;
}
```

### `loadOrchestrationMemory()`

Carrega memória do disco.

```typescript
async function loadOrchestrationMemory(): Promise<OrchestrationMemory>
```

### `saveOrchestrationMemory()`

Salva memória no disco.

```typescript
async function saveOrchestrationMemory(memory: OrchestrationMemory): Promise<void>
```

## 🔧 MCP Tools

### Ferramentas Disponíveis

1. **`search_pubtator`**
   ```typescript
   {
     name: "search_pubtator",
     arguments: { query: string }
   }
   ```

2. **`get_paper_text`**
   ```typescript
   {
     name: "get_paper_text",
     arguments: { pmids: string[], format: "pubtator" }
   }
   ```

3. **`find_entity`**
   ```typescript
   {
     name: "find_entity",
     arguments: { query: string, concept: string }
   }
   ```

4. **`find_related_entities`**
   ```typescript
   {
     name: "find_related_entities",
     arguments: { entity_id: string }
   }
   ```

## 💻 CLI Interface

### `runFixedOrchestratedCLI()`

Interface de linha de comando principal.

```typescript
async function runFixedOrchestratedCLI(): Promise<void>
```

**Comandos Disponíveis:**

| Comando | Descrição | Exemplo |
|---------|-----------|---------|
| `memory` | Exibe estatísticas da sessão | `memory` |
| `clear` | Limpa memória da sessão | `clear` |
| `test [query]` | Compara abordagens | `test estudos sobre lavanda` |
| `exit` | Sai com cleanup | `exit` |

### Funções de Gerenciamento

#### `displayMemory()`
```typescript
async function displayMemory(): Promise<void>
```

#### `clearMemory()`
```typescript
async function clearMemory(): Promise<void>
```

## 🔒 Output Guardrails (Preparado)

### `BiomedicalOutputValidationSchema`

Schema para validação de saída.

```typescript
const BiomedicalOutputValidationSchema = z.object({
  containsPMIDs: z.boolean(),
  isScientificallyAccurate: z.boolean(),
  hasProperCitations: z.boolean(),
  isRelevantToBiomedical: z.boolean(),
  qualityScore: z.number().min(0).max(10),
  reasoning: z.string()
});
```

## 🌍 Tradutor Biomédico

### `biomedicalTranslatorAgent`

Agente especializado em tradução de termos biomédicos.

```typescript
import { biomedicalTranslatorAgent } from './biomedical-translator-agent';
```

**Uso:**
```typescript
const result = await run(biomedicalTranslatorAgent, "estudos sobre lavanda");
// Resultado: "lavender studies"
```

## ⚙️ Configurações

### `getAgentConfig()`

Obtém configuração dos agentes.

```typescript
function getAgentConfig(preset?: 'default' | 'fast' | 'deep' | 'nano'): AgentConfig
```

**Presets Disponíveis:**
- `default`: `gpt-4.1-nano` (padrão)
- `fast`: `gpt-4o-mini` (rápido)
- `deep`: `gpt-4o` (análise profunda)
- `nano`: `gpt-4.1-nano` (ultra-rápido)

## 📊 Tipos e Interfaces

### `QueryClassification`

```typescript
interface QueryClassification {
  queryType: 'biomedical_search' | 'pmid_details' | 'paper_analysis' | 'general_question';
  isEnglish: boolean;
  needsTranslation: boolean;
  detectedLanguage: string;
  confidence: number;
  extractedPMID: string | null;
  biomedicalTerms: string[];
  reasoning: string;
}
```

## 🚀 Exemplos de Uso

### Pesquisa Básica
```typescript
const result = await orchestratedBiomedicalResearch("estudos sobre lavanda");
console.log(result.result);
```

### Com Memória Compartilhada
```typescript
let memory = await loadOrchestrationMemory();
const result = await orchestratedBiomedicalResearch("detalhes sobre 38155861", memory);
memory = result.memory;
```

### Com Servidor MCP Compartilhado
```typescript
const mcpServer = new MCPServerStdio({...});
await mcpServer.connect();

const result = await orchestratedBiomedicalResearch(
  "peppermint studies",
  undefined,
  mcpServer
);
```

---

**Esta API oferece uma interface completa e flexível para pesquisa biomédica usando padrões OpenAI Agents JS.** 🎯
