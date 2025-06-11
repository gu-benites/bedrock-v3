import { Agent, tool } from '@openai/agents';
import { z } from 'zod';
import { weatherPrompts } from '../prompts/weather';

// Context type for weather agent
export interface WeatherContext {
  location?: string;
  units?: 'celsius' | 'fahrenheit';
  language?: string;
}

// Weather tool
const getWeatherTool = tool({
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

const getForecastTool = tool({
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

// Weather Agent
export const weatherAgent = new Agent<WeatherContext>({
  name: 'Weather Specialist',
  model: 'gpt-4o-mini', // Cheaper model for simple weather queries
  instructions: weatherPrompts.main,
  tools: [getWeatherTool, getForecastTool],
  modelSettings: {
    temperature: 0.2, // Very consistent for factual weather info
    maxTokens: 800,
  },
});
