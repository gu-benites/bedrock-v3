import { tool } from '@openai/agents';
import { z } from 'zod';

// Customer Service Tools
export const lookupCustomerTool = tool({
  name: 'lookup_customer',
  description: 'Look up customer information by ID',
  parameters: z.object({
    customerId: z.string().describe('The customer ID to look up'),
  }),
  execute: async ({ customerId }) => {
    // Simulate customer lookup
    return `Customer ${customerId}: John Doe, Premium Plan, Account Status: Active`;
  },
});

export const createTicketTool = tool({
  name: 'create_ticket',
  description: 'Create a support ticket for the customer',
  parameters: z.object({
    customerId: z.string().describe('The customer ID'),
    issue: z.string().describe('Description of the issue'),
    priority: z.enum(['low', 'medium', 'high']).describe('Priority level'),
  }),
  execute: async ({ customerId, issue, priority }) => {
    const ticketId = `TICKET-${Date.now()}`;
    return `Created ticket ${ticketId} for customer ${customerId}: ${issue} (Priority: ${priority})`;
  },
});

// Weather Tools
export const getWeatherTool = tool({
  name: 'get_weather',
  description: 'Get current weather information for a location',
  parameters: z.object({
    location: z.string().describe('The city or location to get weather for'),
    units: z.enum(['celsius', 'fahrenheit']).optional().describe('Temperature units'),
  }),
  execute: async ({ location, units = 'celsius' }) => {
    // Simulate weather API call
    const conditions = ['sunny', 'cloudy', 'rainy', 'snowy', 'partly cloudy'];
    const condition = conditions[Math.floor(Math.random() * conditions.length)];
    const temp = units === 'celsius' 
      ? Math.floor(Math.random() * 30) + 5
      : Math.floor(Math.random() * 54) + 41;
    
    return {
      location,
      condition,
      temperature: temp,
      units,
      humidity: Math.floor(Math.random() * 40) + 30,
      windSpeed: Math.floor(Math.random() * 20) + 5,
    };
  },
});

export const getForecastTool = tool({
  name: 'get_forecast',
  description: 'Get weather forecast for the next few days',
  parameters: z.object({
    location: z.string().describe('The city or location'),
    days: z.number().min(1).max(7).describe('Number of days for forecast'),
  }),
  execute: async ({ location, days }) => {
    // Simulate forecast data
    const forecast = Array.from({ length: days }, (_, i) => ({
      day: i + 1,
      condition: ['sunny', 'cloudy', 'rainy'][Math.floor(Math.random() * 3)],
      high: Math.floor(Math.random() * 15) + 20,
      low: Math.floor(Math.random() * 10) + 10,
    }));
    
    return { location, forecast };
  },
});

// Research Tools
export const webSearchTool = tool({
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

export const analyzeDataTool = tool({
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

// Export all tools as a map for easy lookup
export const toolRegistry = {
  lookup_customer: lookupCustomerTool,
  create_ticket: createTicketTool,
  get_weather: getWeatherTool,
  get_forecast: getForecastTool,
  web_search: webSearchTool,
  analyze_data: analyzeDataTool,
};
