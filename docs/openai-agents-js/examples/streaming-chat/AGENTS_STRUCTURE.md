# 🤖 Organized Agent Structure

This example demonstrates how to organize OpenAI Agents JS into a scalable, maintainable structure with separate files for agents, prompts, tools, and configurations.

## 📁 **Folder Structure**

```
streaming-chat/
├── agents/                 # Agent definitions
│   ├── index.ts           # Central exports
│   ├── customer-service.ts # Customer service agent
│   ├── weather.ts         # Weather specialist
│   ├── research.ts        # Research specialist
│   └── triage.ts          # Routing agent
├── prompts/               # Prompt templates
│   ├── index.ts           # Central exports
│   ├── customer-service.ts # Customer service prompts
│   ├── weather.ts         # Weather prompts
│   ├── research.ts        # Research prompts
│   └── triage.ts          # Triage prompts
├── tools/                 # Tool definitions
│   └── index.ts           # All tools centralized
├── config/                # Configuration files
│   ├── agents.json        # JSON configuration
│   └── agents.yaml        # YAML configuration
├── utils/                 # Utilities
│   └── agent-loader.ts    # Dynamic agent loading
└── example-usage.ts       # Usage examples
```

## 🎯 **Benefits of This Structure**

### **1. Separation of Concerns**
- **Agents**: Business logic and tool integration
- **Prompts**: Instructions and behavior definitions
- **Tools**: Reusable functionality
- **Config**: Environment-specific settings

### **2. Reusability**
- Prompts can be shared across agents
- Tools can be mixed and matched
- Configurations can be environment-specific

### **3. Maintainability**
- Easy to update prompts without touching code
- Clear organization for team collaboration
- Version control friendly

### **4. Scalability**
- Add new agents by creating new files
- Dynamic loading from configuration
- Easy to test individual components

## 🚀 **Usage Examples**

### **Basic Usage**
```typescript
import { triageAgent } from './agents';
import { run } from '@openai/agents';

const result = await run(triageAgent, "What's the weather?");
console.log(result.finalOutput);
```

### **Dynamic Loading**
```typescript
import { loadAllAgents, getAgent } from './utils/agent-loader';

// Load from configuration
const agents = await loadAllAgents('./config/agents.json');

// Use specific agent
const weatherAgent = getAgent('weather');
const result = await run(weatherAgent, "Weather in Tokyo?");
```

### **Custom Configuration**
```typescript
// Load from different config file
const agents = await loadAllAgents('./config/production-agents.json');

// Or use YAML
const agents = await loadAllAgents('./config/agents.yaml');
```

## 📝 **Configuration Formats**

### **JSON Configuration**
```json
{
  "agents": {
    "weather": {
      "name": "Weather Specialist",
      "model": "gpt-4o-mini",
      "modelSettings": {
        "temperature": 0.2,
        "maxTokens": 800
      },
      "tools": ["get_weather", "get_forecast"],
      "promptFile": "weather"
    }
  }
}
```

### **YAML Configuration**
```yaml
agents:
  weather:
    name: "Weather Specialist"
    model: "gpt-4o-mini"
    temperature: 0.2
    max_tokens: 800
    tools:
      - "get_weather"
      - "get_forecast"
    prompt_file: "weather"
```

## 🛠 **Adding New Agents**

### **1. Create Agent File**
```typescript
// agents/new-agent.ts
import { Agent } from '@openai/agents';
import { newAgentPrompts } from '../prompts/new-agent';

export const newAgent = new Agent({
  name: 'New Agent',
  model: 'gpt-4o',
  instructions: newAgentPrompts.main,
  // ... configuration
});
```

### **2. Create Prompt File**
```typescript
// prompts/new-agent.ts
export const newAgentPrompts = {
  main: `You are a specialized agent for...`,
  // ... other prompts
};
```

### **3. Add to Configuration**
```json
{
  "agents": {
    "new_agent": {
      "name": "New Agent",
      "model": "gpt-4o",
      "promptFile": "new-agent"
    }
  }
}
```

### **4. Export from Index**
```typescript
// agents/index.ts
export { newAgent } from './new-agent';
```

## 🔧 **Advanced Features**

### **Environment-Specific Configs**
```
config/
├── agents.json              # Default
├── agents.development.json  # Development
├── agents.production.json   # Production
└── agents.test.json         # Testing
```

### **Prompt Versioning**
```typescript
export const customerServicePrompts = {
  v1: `Original prompt...`,
  v2: `Updated prompt...`,
  main: `Current active prompt...`,
};
```

### **Tool Categories**
```
tools/
├── index.ts           # All tools
├── customer/          # Customer-specific tools
├── weather/           # Weather tools
└── research/          # Research tools
```

## 🎨 **Best Practices**

1. **Naming Conventions**
   - Use kebab-case for files: `customer-service.ts`
   - Use camelCase for exports: `customerServiceAgent`
   - Use snake_case for config keys: `customer_service`

2. **Prompt Organization**
   - Keep prompts focused and specific
   - Use sections for different behaviors
   - Include examples in prompts

3. **Tool Design**
   - Make tools reusable across agents
   - Use clear parameter descriptions
   - Handle errors gracefully

4. **Configuration Management**
   - Use environment variables for sensitive data
   - Keep configs version controlled
   - Document configuration options

## 🧪 **Testing**

```typescript
// Test individual agents
import { weatherAgent } from './agents/weather';
import { run } from '@openai/agents';

describe('Weather Agent', () => {
  it('should provide weather information', async () => {
    const result = await run(weatherAgent, "Weather in Tokyo?");
    expect(result.finalOutput).toContain('Tokyo');
  });
});
```

This structure provides a solid foundation for building complex, maintainable agent systems with OpenAI Agents JS! 🚀
