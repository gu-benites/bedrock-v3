/**
 * @fileoverview Prompt Manager service for loading and processing YAML prompt configurations
 * for the Recipe Wizard OpenAI Agents SDK integration.
 */

import * as yaml from 'js-yaml';
import * as fs from 'fs/promises';
import * as path from 'path';
import type { PromptConfig } from '../types/recipe-wizard.types';

/**
 * Error class for prompt management operations
 */
export class PromptManagerError extends Error {
  constructor(
    message: string,
    public code: string,
    public promptName?: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'PromptManagerError';

    // Maintain proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, PromptManagerError.prototype);
  }
}

/**
 * Template variable substitution interface
 */
interface TemplateVariables {
  [key: string]: any;
}

/**
 * Prompt Manager class for handling YAML prompt configurations
 */
export class PromptManager {
  private static instance: PromptManager;
  private promptCache: Map<string, PromptConfig> = new Map();
  private readonly promptsBasePath: string;

  private constructor() {
    // Set base path for prompts directory
    this.promptsBasePath = path.join(process.cwd(), 'src', 'features', 'recipe-wizard', 'prompts');
  }

  /**
   * Get singleton instance of PromptManager
   */
  public static getInstance(): PromptManager {
    if (!PromptManager.instance) {
      PromptManager.instance = new PromptManager();
    }
    return PromptManager.instance;
  }

  /**
   * Load a YAML prompt configuration file
   */
  public async loadPromptConfig(promptName: string): Promise<PromptConfig> {
    try {
      // Check cache first
      if (this.promptCache.has(promptName)) {
        return this.promptCache.get(promptName)!;
      }

      // Construct file path
      const filePath = path.join(this.promptsBasePath, `${promptName}.yaml`);

      // Read and parse YAML file
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const promptConfig = yaml.load(fileContent) as PromptConfig;

      // Validate the loaded configuration
      this.validatePromptConfig(promptConfig, promptName);

      // Cache the configuration
      this.promptCache.set(promptName, promptConfig);

      return promptConfig;
    } catch (error) {
      if (error instanceof PromptManagerError) {
        throw error;
      }

      throw new PromptManagerError(
        `Failed to load prompt configuration: ${promptName}`,
        'LOAD_ERROR',
        promptName,
        error as Error
      );
    }
  }

  /**
   * Process template with variable substitution
   */
  public processTemplate(template: string, variables: TemplateVariables): string {
    try {
      let processedTemplate = template;

      // Handle Handlebars-style {{variable}} substitution
      processedTemplate = processedTemplate.replace(/\{\{(\w+)\}\}/g, (match, variableName) => {
        if (variables.hasOwnProperty(variableName)) {
          return String(variables[variableName]);
        }
        return match; // Keep original if variable not found
      });

      // Handle Handlebars-style {{#each array}} loops
      processedTemplate = processedTemplate.replace(
        /\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g,
        (match, arrayName, loopContent) => {
          if (variables.hasOwnProperty(arrayName) && Array.isArray(variables[arrayName])) {
            return variables[arrayName]
              .map((item: any, index: number) => {
                let itemContent = loopContent;
                
                // Replace {{this}} with current item (for simple arrays)
                itemContent = itemContent.replace(/\{\{this\}\}/g, String(item));
                
                // Replace {{@index}} with current index
                itemContent = itemContent.replace(/\{\{@index\}\}/g, String(index));
                
                // Replace {{@last}} with boolean indicating if this is the last item
                itemContent = itemContent.replace(/\{\{@last\}\}/g, String(index === variables[arrayName].length - 1));
                
                // Replace object properties like {{property_name}}
                if (typeof item === 'object' && item !== null) {
                  Object.keys(item).forEach(key => {
                    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
                    itemContent = itemContent.replace(regex, String(item[key]));
                  });
                }
                
                return itemContent;
              })
              .join('');
          }
          return match; // Keep original if array not found
        }
      );

      // Handle conditional blocks {{#unless @last}}
      processedTemplate = processedTemplate.replace(
        /\{\{#unless\s+@last\}\}([\s\S]*?)\{\{\/unless\}\}/g,
        (match, content) => {
          // This is a simplified implementation - in a real scenario,
          // you'd need to track the context of the @last variable
          return content;
        }
      );

      return processedTemplate;
    } catch (error) {
      throw new PromptManagerError(
        'Failed to process template variables',
        'TEMPLATE_ERROR',
        undefined,
        error as Error
      );
    }
  }

  /**
   * Get processed prompt with variables substituted
   */
  public async getProcessedPrompt(
    promptName: string, 
    variables: TemplateVariables
  ): Promise<{ prompt: string; config: PromptConfig }> {
    try {
      const promptConfig = await this.loadPromptConfig(promptName);
      const processedPrompt = this.processTemplate(promptConfig.template, variables);

      return {
        prompt: processedPrompt,
        config: promptConfig
      };
    } catch (error) {
      if (error instanceof PromptManagerError) {
        throw error;
      }

      throw new PromptManagerError(
        `Failed to get processed prompt: ${promptName}`,
        'PROCESS_ERROR',
        promptName,
        error as Error
      );
    }
  }

  /**
   * Clear the prompt cache
   */
  public clearCache(): void {
    this.promptCache.clear();
  }

  /**
   * Get cached prompt names
   */
  public getCachedPrompts(): string[] {
    return Array.from(this.promptCache.keys());
  }

  /**
   * Validate prompt configuration structure
   */
  private validatePromptConfig(config: any, promptName: string): void {
    const requiredFields = ['version', 'description', 'config', 'template', 'schema'];
    
    for (const field of requiredFields) {
      if (!config.hasOwnProperty(field)) {
        throw new PromptManagerError(
          `Missing required field '${field}' in prompt configuration`,
          'VALIDATION_ERROR',
          promptName
        );
      }
    }

    // Validate config section
    if (!config.config || typeof config.config !== 'object') {
      throw new PromptManagerError(
        'Invalid config section in prompt configuration',
        'VALIDATION_ERROR',
        promptName
      );
    }

    const requiredConfigFields = ['model', 'temperature', 'max_tokens'];
    for (const field of requiredConfigFields) {
      if (!config.config.hasOwnProperty(field)) {
        throw new PromptManagerError(
          `Missing required config field '${field}' in prompt configuration`,
          'VALIDATION_ERROR',
          promptName
        );
      }
    }

    // Validate template
    if (typeof config.template !== 'string' || config.template.trim().length === 0) {
      throw new PromptManagerError(
        'Template must be a non-empty string',
        'VALIDATION_ERROR',
        promptName
      );
    }

    // Validate schema
    if (!config.schema || typeof config.schema !== 'object') {
      throw new PromptManagerError(
        'Schema must be a valid object',
        'VALIDATION_ERROR',
        promptName
      );
    }
  }

  /**
   * Preload prompt configurations (MVP: only potential-causes)
   */
  public async preloadPrompts(): Promise<void> {
    const promptNames = ['potential-causes'];

    try {
      await Promise.all(
        promptNames.map(name => this.loadPromptConfig(name))
      );
    } catch (error) {
      throw new PromptManagerError(
        'Failed to preload prompt configurations',
        'PRELOAD_ERROR',
        undefined,
        error as Error
      );
    }
  }
}

/**
 * Convenience function to get the singleton instance
 */
export function getPromptManager(): PromptManager {
  return PromptManager.getInstance();
}

/**
 * Convenience function to load and process a prompt
 */
export async function loadAndProcessPrompt(
  promptName: string,
  variables: TemplateVariables
): Promise<{ prompt: string; config: PromptConfig }> {
  const manager = getPromptManager();
  return manager.getProcessedPrompt(promptName, variables);
}
