import { Agent, tool } from '@openai/agents';
import { z } from 'zod';
import { researchPrompts } from '../prompts/research';

// Context type for research agent
export interface ResearchContext {
  topic?: string;
  depth?: 'basic' | 'detailed' | 'comprehensive';
  sources?: string[];
}

// Research tools
const webSearchTool = tool({
  name: 'web_search',
  description: 'Search the web for information on a topic',
  parameters: z.object({
    query: z.string().describe('Search query'),
    maxResults: z.number().optional().describe('Maximum number of results'),
  }),
  execute: async ({ query, maxResults = 5 }) => {
    // Simulate web search
    const results = Array.from({ length: Math.min(maxResults, 5) }, (_, i) => ({
      title: `Result ${i + 1} for "${query}"`,
      url: `https://example.com/result-${i + 1}`,
      snippet: `This is a sample snippet about ${query} from result ${i + 1}...`,
    }));
    
    return { query, results };
  },
});

const analyzeDataTool = tool({
  name: 'analyze_data',
  description: 'Analyze and summarize research data',
  parameters: z.object({
    data: z.string().describe('Raw data to analyze'),
    analysisType: z.enum(['summary', 'trends', 'insights']).describe('Type of analysis'),
  }),
  execute: async ({ data, analysisType }) => {
    // Simulate data analysis
    return {
      analysisType,
      summary: `Analysis of the provided data shows key patterns related to the research topic.`,
      keyPoints: [
        'Key finding 1 from the data',
        'Key finding 2 from the data',
        'Key finding 3 from the data',
      ],
      confidence: 0.85,
    };
  },
});

// Research Agent
export const researchAgent = new Agent<ResearchContext>({
  name: 'Research Specialist',
  model: 'gpt-4o', // More powerful model for complex research
  instructions: researchPrompts.main,
  tools: [webSearchTool, analyzeDataTool],
  modelSettings: {
    temperature: 0.4, // Balanced creativity and accuracy
    maxTokens: 2000, // Longer responses for detailed research
  },
});
