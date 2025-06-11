/**
 * @fileoverview Prompt Configuration Loader for Recipe Wizard
 * Loads and parses YAML-based prompt configurations for AI agents
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import yaml from 'js-yaml';

/**
 * Interface for prompt configuration structure
 */
export interface PromptConfig {
  version: string;
  description: string;
  config: {
    model: string;
    temperature: number;
    max_tokens?: number;
    top_p: number;
    frequency_penalty: number;
    presence_penalty: number;
  };
  template: string;
  schema: any;
  example_response?: any;
}

/**
 * Cache for loaded prompt configurations
 */
const promptCache = new Map<string, PromptConfig>();

/**
 * Load prompt configuration from YAML file
 * 
 * @param promptName - Name of the prompt file (without .yaml extension)
 * @returns Promise<PromptConfig> - Parsed prompt configuration
 */
export async function loadPromptConfig(promptName: string): Promise<PromptConfig> {
  // Check cache first
  if (promptCache.has(promptName)) {
    return promptCache.get(promptName)!;
  }

  try {
    // Construct file path
    const promptPath = join(process.cwd(), 'src', 'features', 'recipe-wizard', 'prompts', `${promptName}.yaml`);
    
    // Read and parse YAML file
    const yamlContent = readFileSync(promptPath, 'utf8');
    const config = yaml.load(yamlContent) as PromptConfig;
    
    // Validate required fields
    if (!config.template) {
      throw new Error(`Missing template in prompt config: ${promptName}`);
    }
    
    if (!config.config) {
      throw new Error(`Missing config section in prompt config: ${promptName}`);
    }
    
    // Cache the configuration
    promptCache.set(promptName, config);
    
    return config;
  } catch (error) {
    throw new Error(`Failed to load prompt config '${promptName}': ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Process template with variables
 * 
 * @param template - Template string with {{variable}} placeholders
 * @param variables - Object with variable values
 * @returns string - Processed template
 */
export function processTemplate(template: string, variables: Record<string, any>): string {
  let processedTemplate = template;
  
  // Replace all {{variable}} placeholders
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`;
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    processedTemplate = processedTemplate.replace(new RegExp(placeholder, 'g'), stringValue);
  }
  
  return processedTemplate;
}

/**
 * Get all available prompt configurations
 */
export function getAvailablePrompts(): string[] {
  return [
    'potential-causes',
    // Add more prompt names as they are created
    // 'potential-symptoms',
    // 'therapeutic-properties',
    // 'suggested-oils'
  ];
}

/**
 * Clear prompt cache (useful for testing or development)
 */
export function clearPromptCache(): void {
  promptCache.clear();
}

/**
 * Validate prompt configuration structure
 */
export function validatePromptConfig(config: any): config is PromptConfig {
  return (
    typeof config === 'object' &&
    typeof config.version === 'string' &&
    typeof config.description === 'string' &&
    typeof config.config === 'object' &&
    typeof config.template === 'string' &&
    config.schema !== undefined
  );
}
