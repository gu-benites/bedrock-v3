/**
 * @fileoverview Unit tests for Prompt Manager service
 * Tests YAML loading, template processing, and error handling.
 */

import { PromptManager, PromptManagerError, getPromptManager, loadAndProcessPrompt } from './prompt-manager';
import * as fs from 'fs/promises';
import * as yaml from 'js-yaml';

// Mock fs module
jest.mock('fs/promises');
const mockFs = fs as jest.Mocked<typeof fs>;

// Mock js-yaml module
jest.mock('js-yaml');
const mockYaml = yaml as jest.Mocked<typeof yaml>;

describe('PromptManager', () => {
  let promptManager: PromptManager;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Get fresh instance and clear cache
    promptManager = PromptManager.getInstance();
    promptManager.clearCache();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = PromptManager.getInstance();
      const instance2 = PromptManager.getInstance();
      
      expect(instance1).toBe(instance2);
    });

    it('should return the same instance from convenience function', () => {
      const instance1 = PromptManager.getInstance();
      const instance2 = getPromptManager();
      
      expect(instance1).toBe(instance2);
    });
  });

  describe('loadPromptConfig', () => {
    const mockPromptConfig = {
      version: '1.0.0',
      description: 'Test prompt',
      config: {
        model: 'gpt-4o',
        temperature: 0.3,
        max_tokens: 1500
      },
      template: 'Test template with {{variable}}',
      schema: {
        type: 'object',
        properties: {
          test: { type: 'string' }
        }
      }
    };

    it('should load and parse YAML prompt configuration', async () => {
      const yamlContent = 'version: "1.0.0"\ndescription: "Test prompt"';
      
      mockFs.readFile.mockResolvedValue(yamlContent);
      mockYaml.load.mockReturnValue(mockPromptConfig);

      const result = await promptManager.loadPromptConfig('test-prompt');

      expect(mockFs.readFile).toHaveBeenCalledWith(
        expect.stringContaining('test-prompt.yaml'),
        'utf-8'
      );
      expect(mockYaml.load).toHaveBeenCalledWith(yamlContent);
      expect(result).toEqual(mockPromptConfig);
    });

    it('should cache loaded configurations', async () => {
      mockFs.readFile.mockResolvedValue('test content');
      mockYaml.load.mockReturnValue(mockPromptConfig);

      // Load twice
      await promptManager.loadPromptConfig('test-prompt');
      await promptManager.loadPromptConfig('test-prompt');

      // Should only read file once
      expect(mockFs.readFile).toHaveBeenCalledTimes(1);
    });

    it('should throw PromptManagerError for missing files', async () => {
      mockFs.readFile.mockRejectedValue(new Error('File not found'));

      await expect(promptManager.loadPromptConfig('missing-prompt'))
        .rejects.toThrow(PromptManagerError);
    });

    it('should validate required fields', async () => {
      const invalidConfig = {
        version: '1.0.0'
        // Missing required fields
      };

      mockFs.readFile.mockResolvedValue('test content');
      mockYaml.load.mockReturnValue(invalidConfig);

      await expect(promptManager.loadPromptConfig('invalid-prompt'))
        .rejects.toThrow(PromptManagerError);
    });

    it('should validate config section', async () => {
      const invalidConfig = {
        ...mockPromptConfig,
        config: {
          model: 'gpt-4o'
          // Missing temperature and max_tokens
        }
      };

      mockFs.readFile.mockResolvedValue('test content');
      mockYaml.load.mockReturnValue(invalidConfig);

      await expect(promptManager.loadPromptConfig('invalid-config'))
        .rejects.toThrow(PromptManagerError);
    });
  });

  describe('processTemplate', () => {
    it('should substitute simple variables', () => {
      const template = 'Hello {{name}}, you are {{age}} years old.';
      const variables = { name: 'John', age: 30 };

      const result = promptManager.processTemplate(template, variables);

      expect(result).toBe('Hello John, you are 30 years old.');
    });

    it('should handle missing variables gracefully', () => {
      const template = 'Hello {{name}}, you are {{age}} years old.';
      const variables = { name: 'John' }; // Missing age

      const result = promptManager.processTemplate(template, variables);

      expect(result).toBe('Hello John, you are {{age}} years old.');
    });

    it('should process array loops with {{#each}}', () => {
      const template = 'Items: {{#each items}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}';
      const variables = { items: ['apple', 'banana', 'cherry'] };

      const result = promptManager.processTemplate(template, variables);

      expect(result).toContain('apple');
      expect(result).toContain('banana');
      expect(result).toContain('cherry');
    });

    it('should process object arrays with property access', () => {
      const template = '{{#each users}}Name: {{name}}, Age: {{age}}{{/each}}';
      const variables = {
        users: [
          { name: 'Alice', age: 25 },
          { name: 'Bob', age: 30 }
        ]
      };

      const result = promptManager.processTemplate(template, variables);

      expect(result).toContain('Name: Alice, Age: 25');
      expect(result).toContain('Name: Bob, Age: 30');
    });

    it('should handle empty arrays', () => {
      const template = 'Items: {{#each items}}{{this}}{{/each}}';
      const variables = { items: [] };

      const result = promptManager.processTemplate(template, variables);

      expect(result).toBe('Items: ');
    });

    it('should handle complex nested substitution', () => {
      const template = `
        User: {{userName}}
        Health Concern: {{healthConcern}}
        Selected Causes:
        {{#each selectedCauses}}
        - {{cause_name}}: {{cause_description}}
        {{/each}}
      `;
      
      const variables = {
        userName: 'Jane',
        healthConcern: 'Anxiety',
        selectedCauses: [
          { cause_name: 'Stress', cause_description: 'Work-related stress' },
          { cause_name: 'Sleep', cause_description: 'Poor sleep quality' }
        ]
      };

      const result = promptManager.processTemplate(template, variables);

      expect(result).toContain('User: Jane');
      expect(result).toContain('Health Concern: Anxiety');
      expect(result).toContain('- Stress: Work-related stress');
      expect(result).toContain('- Sleep: Poor sleep quality');
    });
  });

  describe('getProcessedPrompt', () => {
    const mockPromptConfig = {
      version: '1.0.0',
      description: 'Test prompt',
      config: {
        model: 'gpt-4o',
        temperature: 0.3,
        max_tokens: 1500
      },
      template: 'Analyze {{healthConcern}} for {{gender}} aged {{age}}.',
      schema: {
        type: 'object',
        properties: {
          analysis: { type: 'string' }
        }
      }
    };

    it('should return processed prompt and config', async () => {
      mockFs.readFile.mockResolvedValue('test content');
      mockYaml.load.mockReturnValue(mockPromptConfig);

      const variables = {
        healthConcern: 'anxiety',
        gender: 'female',
        age: 28
      };

      const result = await promptManager.getProcessedPrompt('test-prompt', variables);

      expect(result.prompt).toBe('Analyze anxiety for female aged 28.');
      expect(result.config).toEqual(mockPromptConfig);
    });

    it('should use convenience function', async () => {
      mockFs.readFile.mockResolvedValue('test content');
      mockYaml.load.mockReturnValue(mockPromptConfig);

      const variables = {
        healthConcern: 'stress',
        gender: 'male',
        age: 35
      };

      const result = await loadAndProcessPrompt('test-prompt', variables);

      expect(result.prompt).toBe('Analyze stress for male aged 35.');
      expect(result.config).toEqual(mockPromptConfig);
    });
  });

  describe('Cache Management', () => {
    it('should clear cache', async () => {
      const mockConfig = {
        version: '1.0.0',
        description: 'Test',
        config: { model: 'gpt-4o', temperature: 0.3, max_tokens: 1500 },
        template: 'test',
        schema: { type: 'object' }
      };

      mockFs.readFile.mockResolvedValue('test content');
      mockYaml.load.mockReturnValue(mockConfig);

      // Load a prompt to cache it
      await promptManager.loadPromptConfig('test-prompt');
      expect(promptManager.getCachedPrompts()).toContain('test-prompt');

      // Clear cache
      promptManager.clearCache();
      expect(promptManager.getCachedPrompts()).toEqual([]);
    });

    it('should return cached prompt names', async () => {
      const mockConfig = {
        version: '1.0.0',
        description: 'Test',
        config: { model: 'gpt-4o', temperature: 0.3, max_tokens: 1500 },
        template: 'test',
        schema: { type: 'object' }
      };

      mockFs.readFile.mockResolvedValue('test content');
      mockYaml.load.mockReturnValue(mockConfig);

      await promptManager.loadPromptConfig('prompt1');
      await promptManager.loadPromptConfig('prompt2');

      const cachedPrompts = promptManager.getCachedPrompts();
      expect(cachedPrompts).toContain('prompt1');
      expect(cachedPrompts).toContain('prompt2');
      expect(cachedPrompts).toHaveLength(2);
    });
  });

  describe('Error Handling', () => {
    it('should throw PromptManagerError with proper error codes', async () => {
      mockFs.readFile.mockRejectedValue(new Error('File not found'));

      try {
        await promptManager.loadPromptConfig('missing-prompt');
      } catch (error) {
        expect(error).toBeInstanceOf(PromptManagerError);
        expect((error as PromptManagerError).code).toBe('LOAD_ERROR');
        expect((error as PromptManagerError).promptName).toBe('missing-prompt');
      }
    });

    it('should preserve original error in PromptManagerError', async () => {
      const originalError = new Error('Original error');
      mockFs.readFile.mockRejectedValue(originalError);

      try {
        await promptManager.loadPromptConfig('test-prompt');
      } catch (error) {
        expect(error).toBeInstanceOf(PromptManagerError);
        expect((error as PromptManagerError).originalError).toBe(originalError);
      }
    });
  });

  describe('preloadPrompts', () => {
    it('should preload all prompt configurations', async () => {
      const mockConfig = {
        version: '1.0.0',
        description: 'Test',
        config: { model: 'gpt-4o', temperature: 0.3, max_tokens: 1500 },
        template: 'test',
        schema: { type: 'object' }
      };

      mockFs.readFile.mockResolvedValue('test content');
      mockYaml.load.mockReturnValue(mockConfig);

      await promptManager.preloadPrompts();

      // Should have loaded only 1 prompt file (MVP: potential-causes only)
      expect(mockFs.readFile).toHaveBeenCalledTimes(1);
      expect(promptManager.getCachedPrompts()).toHaveLength(1);
    });

    it('should throw error if preloading fails', async () => {
      mockFs.readFile.mockRejectedValue(new Error('File not found'));

      await expect(promptManager.preloadPrompts())
        .rejects.toThrow(PromptManagerError);
    });
  });
});
