# Essential Oil Recipe Wizard MVP - File & Folder Architecture

## Complete Directory Structure

```
src/features/recipe-wizard/
├── 📁 services/                           # Feature-specific business logic and AI integration
│   ├── 📄 agent-orchestrator.ts           # Feature-specific orchestration for recipe wizard agents
│   ├── 📄 agent-orchestrator.test.ts      # Unit tests for agent orchestrator
│   ├── 📄 prompt-manager.ts               # Enhanced YAML prompt configuration manager
│   ├── 📄 prompt-manager.test.ts          # Unit tests for prompt manager
│   │
│   └── 📁 agents/                         # Recipe wizard specialized AI agents
│       ├── 📄 medical-analysis-agent.ts   # Conservative medical analysis (temp: 0.3)
│       ├── 📄 medical-analysis-agent.test.ts
│       ├── 📄 symptom-correlation-agent.ts # Symptom identification (temp: 0.4)
│       ├── 📄 symptom-correlation-agent.test.ts
│       ├── 📄 therapeutic-properties-agent.ts # Properties analysis (temp: 0.2)
│       ├── 📄 therapeutic-properties-agent.test.ts
│       ├── 📄 oil-recommendation-agent.ts  # Oil suggestions (temp: 0.5)
│       ├── 📄 oil-recommendation-agent.test.ts
       └── 📄 index.ts                    # Barrel file for agents exports
│
├── 📁 prompts/                            # YAML-based prompt configurations
│   ├── 📄 potential-causes.yaml          # Medical analysis prompt with safety tools
│   ├── 📄 potential-symptoms.yaml        # Symptom correlation prompt with research
│   ├── 📄 therapeutic-properties.yaml    # Properties analysis prompt (conservative)
│   └── 📄 suggested-oils.yaml            # Oil recommendation prompt with quality tools
│
├── 📁 store/                              # State management with agent context
│   ├── 📄 wizard-store.ts                # Enhanced Zustand store with agent data
│   └── 📄 wizard-store.test.ts           # Unit tests for enhanced store
│
├── 📁 hooks/                              # Custom React hooks for wizard logic
│   ├── 📄 use-wizard-navigation.ts       # Navigation with agent validation
│   └── 📄 use-wizard-navigation.test.ts  # Unit tests for navigation hook
│
├── 📁 components/                         # React components for UI
│   ├── 📄 wizard-container.tsx           # Main orchestration with agent selection
│   ├── 📄 wizard-container.test.tsx      # Unit tests for wizard container
│   │
│   ├── 📁 steps/                         # Individual wizard step components
│   │   ├── 📄 health-concern-input.tsx   # Health concern input step
│   │   ├── 📄 health-concern-input.test.tsx
│   │   ├── 📄 demographics-form.tsx      # Demographics collection step
│   │   ├── 📄 demographics-form.test.tsx
│   │   ├── 📄 causes-selection.tsx       # Enhanced causes with safety warnings
│   │   ├── 📄 causes-selection.test.tsx
│   │   ├── 📄 symptoms-selection.tsx     # Enhanced symptoms with correlation
│   │   ├── 📄 symptoms-selection.test.tsx
│   │   ├── 📄 properties-display.tsx     # Enhanced properties with research
│   │   ├── 📄 properties-display.test.tsx
│   │   ├── 📄 oils-display.tsx           # Enhanced oils with safety & quality
│   │   └── 📄 oils-display.test.tsx
│   │
│   └── 📁 ui/                            # Reusable UI components
│       ├── 📄 progress-indicator.tsx     # Enhanced with agent status tracking
│       ├── 📄 progress-indicator.test.tsx
│       ├── 📄 navigation-controls.tsx    # Enhanced with agent validation
│       ├── 📄 navigation-controls.test.tsx
│       ├── 📄 error-boundary.tsx         # Enhanced with agent-specific errors
│       ├── 📄 error-boundary.test.tsx
│       ├── 📄 safety-warning.tsx         # NEW: Safety warnings & contraindications
│       ├── 📄 safety-warning.test.tsx
│       ├── 📄 research-citation.tsx      # NEW: Research evidence displays
│       └── 📄 research-citation.test.tsx
│
├── 📁 types/                              # TypeScript type definitions
│   ├── 📄 wizard.types.ts                # Enhanced wizard data structures
│   └── 📄 agent.types.ts                 # NEW: Agent and tool type definitions
│
├── 📁 schemas/                            # Data validation schemas
│   ├── 📄 wizard-schemas.ts              # Enhanced Zod schemas with safety data
│   └── 📄 wizard-schemas.test.ts         # Unit tests for enhanced schemas
│
└── 📁 constants/                          # Configuration constants
    ├── 📄 wizard.constants.ts            # Enhanced wizard configuration
    └── 📄 agent.constants.ts             # NEW: Agent configs & temperature settings
```

## API Routes Structure

```
src/app/api/recipe-wizard/
└── 📁 analyze/
    ├── 📄 route.ts                       # Enhanced API with agent orchestration
    └── 📄 route.test.ts                  # Unit tests for enhanced API route
```



## Dashboard Pages Structure

```
src/app/(dashboard)/dashboard/recipe-wizard/
├── 📄 page.tsx                          # Main recipe wizard entry point
├── 📄 layout.tsx                        # Layout component for wizard pages
└── 📁 [step]/
    └── 📄 page.tsx                      # Dynamic step page component
```

---

## 🏗️ Organizational Patterns & Design Rationale

### 1. **Services Layer Architecture**

#### **📁 services/** - Feature-Specific Business Logic Hub
```
services/
├── agent-orchestrator.ts              # 🎯 Recipe wizard coordination point
└── agents/                            # 🤖 Recipe wizard AI specialists
```

**Rationale:**
- **Feature Separation:** Recipe wizard agents stay in feature folder for domain-specific logic
- **Single Responsibility:** Each agent focuses on one domain (medical, symptoms, properties, oils)
- **Scalability:** Easy to add new agents without affecting existing code
- **Testability:** Each component can be unit tested independently

#### **🤖 Specialized Agents Strategy**
```
agents/
├── medical-analysis-agent.ts          # Conservative (temp: 0.3) - Safety first
├── symptom-correlation-agent.ts       # Moderate (temp: 0.4) - Balanced analysis
├── therapeutic-properties-agent.ts    # Low (temp: 0.2) - Maximum accuracy
└── oil-recommendation-agent.ts        # Balanced (temp: 0.5) - Creative but safe
```

**Temperature Optimization Logic:**
- **Medical Analysis (0.3):** Conservative for health-related analysis
- **Symptom Correlation (0.4):** Moderate for pattern recognition
- **Therapeutic Properties (0.2):** Lowest for factual accuracy
- **Oil Recommendations (0.5):** Higher for creative combinations



### 2. **YAML Prompt Management**

#### **📁 prompts/** - Centralized Configuration
```
prompts/
├── potential-causes.yaml             # Medical agent + safety tools
├── potential-symptoms.yaml           # Symptom agent + research tools
├── therapeutic-properties.yaml       # Properties agent (conservative)
└── suggested-oils.yaml              # Oil agent + quality tools
```

**YAML Structure Pattern:**
```yaml
# Each YAML file contains:
template: |                          # Multi-line prompt template
  # Agent-specific instructions...
config:                             # Agent configuration
  temperature: 0.3                  # Optimized per domain
  tools: ["safety_tool", "research_tool"]
schema:                             # Response validation
  type: "object"
  properties: {...}
```

**Benefits:**
- **Single Source of Truth:** All agent config in one file
- **Version Control:** Easy to track prompt changes
- **A/B Testing:** Simple to swap configurations
- **Hot Reloading:** Development-time prompt updates

### 3. **Component Architecture**

#### **📁 components/** - UI Layer Organization
```
components/
├── wizard-container.tsx             # 🎯 Main orchestration
├── steps/                          # 📋 Step-specific components
└── ui/                            # 🎨 Reusable UI elements
```

**Step Components:**
- **causes-selection.tsx:** Multi-select interface for potential causes
- **symptoms-selection.tsx:** Multi-select interface for symptoms
- **properties-display.tsx:** Display therapeutic properties information
- **oils-display.tsx:** Display essential oil recommendations

### 4. **Type Safety & Validation**

#### **📁 types/** - Enhanced Type Definitions
```
types/
├── wizard.types.ts                 # Core wizard data structures
└── agent.types.ts                  # Agent & tool specific types
```

**Agent Type Strategy:**
```typescript
// agent.types.ts
export interface AgentResponse<T> {
  analysis: T;
  safetyWarnings?: SafetyWarning[];
  researchBacking?: ResearchCitation[];
  qualityMetrics?: QualityMetric[];
}

export interface AgentConfig {
  temperature: number;
  tools: ExternalTool[];
  maxTokens: number;
}
```

#### **📁 schemas/** - Data Validation
```
schemas/
├── wizard-schemas.ts              # Enhanced with safety & research data
└── wizard-schemas.test.ts         # Comprehensive validation tests
```

### 5. **Constants & Configuration**

#### **📁 constants/** - Configuration Management
```
constants/
├── wizard.constants.ts            # General wizard configuration
└── agent.constants.ts             # Agent-specific settings
```

**Agent Constants Pattern:**
```typescript
// agent.constants.ts
export const AGENT_CONFIGS = {
  MEDICAL_ANALYSIS: {
    temperature: 0.3,
    tools: ['safety_database_tool'],
    maxTokens: 2000
  },
  // ... other agents
} as const;
```

---

## 🔄 File Relationships & Interaction Patterns

### 1. **Data Flow Architecture**

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   User Input    │───▶│  WizardContainer │───▶│ AgentOrchestrator│
│   (Frontend)    │    │   (React)        │    │   (Service)     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                         │
                       ┌─────────────────────────────────┼─────────────────────────────────┐
                       ▼                                 ▼                                 ▼
              ┌─────────────────┐              ┌─────────────────┐              ┌─────────────────┐
              │ PromptManager   │              │ Specialized     │              │ External Tools  │
              │ (YAML Loader)   │              │ Agents          │              │ (APIs)          │
              └─────────────────┘              └─────────────────┘              └─────────────────┘
                       │                                 │                                 │
                       ▼                                 ▼                                 ▼
              ┌─────────────────┐              ┌─────────────────┐              ┌─────────────────┐
              │ YAML Prompts    │              │ OpenAI Agents   │              │ Safety/Research │
              │ Configuration   │              │ JS SDK          │              │ Data            │
              └─────────────────┘              └─────────────────┘              └─────────────────┘
                                                         │
                                                         ▼
                                               ┌─────────────────┐
                                               │ Enhanced        │
                                               │ Response        │
                                               │ (with Safety)   │
                                               └─────────────────┘
```

### 2. **Component Interaction Matrix**

| Component | Depends On | Provides To | Purpose |
|-----------|------------|-------------|---------|
| **AgentOrchestrator** | Agents, Tools, PromptManager | WizardContainer | Central coordination |
| **MedicalAnalysisAgent** | SafetyDatabaseTool, PromptManager | AgentOrchestrator | Conservative medical analysis |
| **SafetyDatabaseTool** | External Safety API | All Agents | Contraindication checking |
| **PromptManager** | YAML Files | All Agents | Configuration loading |
| **WizardContainer** | AgentOrchestrator, Store | Step Components | UI orchestration |
| **CausesSelection** | SafetyWarning, ResearchCitation | WizardContainer | Enhanced causes display |

### 3. **Service Layer Dependencies**

```
AgentOrchestrator (recipe-wizard feature)
├── 🤖 MedicalAnalysisAgent
│   └── 📄 potential-causes.yaml
├── 🤖 SymptomCorrelationAgent
│   └── 📄 potential-symptoms.yaml
├── 🤖 TherapeuticPropertiesAgent
│   └── 📄 therapeutic-properties.yaml
└── 🤖 OilRecommendationAgent
    └── 📄 suggested-oils.yaml
```

**Barrel File Import Pattern:**
```typescript
// In agent-orchestrator.ts
import {
  MedicalAnalysisAgent,
  SymptomCorrelationAgent,
  TherapeuticPropertiesAgent,
  OilRecommendationAgent
} from './agents';

// Barrel file: src/features/recipe-wizard/services/agents/index.ts
export { MedicalAnalysisAgent } from './medical-analysis-agent';
export { SymptomCorrelationAgent } from './symptom-correlation-agent';
export { TherapeuticPropertiesAgent } from './therapeutic-properties-agent';
export { OilRecommendationAgent } from './oil-recommendation-agent';
```

### 4. **State Management Flow**

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ User Interaction│───▶│   WizardStore    │───▶│ Session Storage │
│                 │    │   (Zustand)      │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │ Enhanced Context │
                       │ - Agent Results  │
                       │ - Safety Data    │
                       │ - Research Data  │
                       │ - Quality Metrics│
                       └──────────────────┘
```

### 5. **Error Handling Hierarchy**

```
ErrorBoundary (Top Level)
├── AgentOrchestrator Error Handling
│   ├── Individual Agent Failures
│   │   ├── Fallback to General Agent
│   │   └── User Notification
│   └── External Tool Failures
│       ├── Cached Data Fallback
│       └── Graceful Degradation
└── UI Component Error Handling
    ├── Step-Specific Errors
    └── Navigation Errors
```

---

## 🎯 Key Architectural Benefits

### 1. **Modularity & Maintainability**
- **Clear Separation:** Agents, tools, and UI components are independently maintainable
- **Single Responsibility:** Each file has a focused, well-defined purpose
- **Easy Testing:** Each component can be unit tested in isolation

### 2. **Scalability & Extensibility**
- **New Agents:** Easy to add specialized agents for new domains
- **New Tools:** Simple to integrate additional external APIs
- **New Steps:** Straightforward to add wizard steps with agent support

### 3. **Safety & Quality Assurance**
- **Built-in Safety:** Safety validation integrated at the agent level
- **Research Backing:** Evidence validation for all therapeutic claims
- **Quality Transparency:** Oil quality and sourcing information

### 4. **Performance Optimization**
- **Agent Specialization:** Optimized temperature settings per domain
- **Intelligent Caching:** Separate caching for agents and external tools
- **Parallel Processing:** Potential for concurrent agent execution

### 5. **Developer Experience**
- **Type Safety:** Comprehensive TypeScript coverage
- **Barrel File Imports:** Clean, organized import statements following project guidelines
- **Hot Reloading:** YAML prompt updates without restart
- **Clear Structure:** Intuitive folder organization
- **Comprehensive Testing:** Unit tests for all components

### 6. **Barrel File Benefits**
- **Clean Imports:** Single import statement for multiple related modules
- **Refactoring Safety:** Internal file moves don't break external imports
- **Consistent Pattern:** Follows established project structure guidelines
- **IDE Support:** Better autocomplete and IntelliSense
- **Maintainability:** Centralized export management

**Barrel File Structure:**
```typescript
// External tools barrel: src/lib/ai/external-tools/index.ts
export { SafetyDatabaseTool } from './safety-database-tool';
export { ResearchAPITool } from './research-api-tool';
export { OilQualityTool } from './oil-quality-tool';

// Agents barrel: src/features/recipe-wizard/services/agents/index.ts
export { MedicalAnalysisAgent } from './medical-analysis-agent';
export { SymptomCorrelationAgent } from './symptom-correlation-agent';
export { TherapeuticPropertiesAgent } from './therapeutic-properties-agent';
export { OilRecommendationAgent } from './oil-recommendation-agent';
```

This architecture provides a robust, scalable foundation for the Essential Oil Recipe Wizard MVP while maintaining clear separation of concerns, following project structure guidelines, and enabling future enhancements.
