/**
 * @fileoverview Tests for PromptManager service
 */

import { PromptManager, PromptManagerError, getPromptManager } from './prompt-manager';
import type { PromptConfig, TemplateVariables } from '../types/recipe-wizard.types';
import * as fs from 'fs/promises';
import * as path from 'path';

// Mock fs module
jest.mock('fs/promises');
const mockFs = fs as jest.Mocked<typeof fs>;

describe('PromptManager', () => {
  let promptManager: PromptManager;
  
  beforeEach(() => {
    // Clear singleton instance before each test
    (PromptManager as any).instance = null;
    promptManager = PromptManager.getInstance();
    promptManager.clearCache();
    jest.clearAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance when called multiple times', () => {
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
    const mockPotentialCausesConfig: PromptConfig = {
      version: '1.0.0',
      description: 'Conservative medical analysis agent for identifying potential causes of health concerns',
      config: {
        model: 'gpt-4.1-nano',
        temperature: 0.3,
        max_tokens: 2000,
        top_p: 0.9,
        frequency_penalty: 0.1,
        presence_penalty: 0.1
      },
      template: 'Test template with {{healthConcern}} variable',
      schema: {
        type: 'json_schema',
        name: 'potential_causes_response',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            meta: {
              type: 'object',
              properties: {
                step_name: { type: 'string' },
                request_id: { type: 'string' },
                timestamp_utc: { type: 'string' },
                version: { type: 'string' },
                user_language: { type: 'string' },
                status: { type: 'string' },
                message: { type: 'string' }
              },
              required: ['step_name', 'request_id', 'timestamp_utc', 'version', 'user_language', 'status', 'message'],
              additionalProperties: false
            },
            data: {
              type: 'object',
              properties: {
                potential_causes: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      cause_id: { type: 'string' },
                      name_localized: { type: 'string' },
                      suggestion_localized: { type: 'string' },
                      explanation_localized: { type: 'string' }
                    },
                    required: ['cause_id', 'name_localized', 'suggestion_localized', 'explanation_localized'],
                    additionalProperties: false
                  }
                }
              },
              required: ['potential_causes'],
              additionalProperties: false
            }
          },
          required: ['meta', 'data'],
          additionalProperties: false
        }
      }
    };

    it('should successfully load potential-causes.yaml configuration', async () => {
      const yamlContent = `
version: "1.0.0"
description: "Conservative medical analysis agent for identifying potential causes of health concerns"
config:
  model: "gpt-4.1-nano"
  temperature: 0.3
  max_tokens: 2000
  top_p: 0.9
  frequency_penalty: 0.1
  presence_penalty: 0.1
template: |
  Test template with {{healthConcern}} variable
schema:
  type: "json_schema"
  name: "potential_causes_response"
  strict: true
  schema:
    type: "object"
    properties:
      meta:
        type: "object"
        properties:
          step_name:
            type: "string"
          request_id:
            type: "string"
          timestamp_utc:
            type: "string"
          version:
            type: "string"
          user_language:
            type: "string"
          status:
            type: "string"
          message:
            type: "string"
        required: ["step_name", "request_id", "timestamp_utc", "version", "user_language", "status", "message"]
        additionalProperties: false
      data:
        type: "object"
        properties:
          potential_causes:
            type: "array"
            items:
              type: "object"
              properties:
                cause_id:
                  type: "string"
                name_localized:
                  type: "string"
                suggestion_localized:
                  type: "string"
                explanation_localized:
                  type: "string"
              required: ["cause_id", "name_localized", "suggestion_localized", "explanation_localized"]
              additionalProperties: false
        required: ["potential_causes"]
        additionalProperties: false
    required: ["meta", "data"]
    additionalProperties: false
`;

      mockFs.readFile.mockResolvedValue(yamlContent);

      const config = await promptManager.loadPromptConfig('potential-causes');

      expect(mockFs.readFile).toHaveBeenCalledWith(
        expect.stringContaining('potential-causes.yaml'),
        'utf-8'
      );
      expect(config).toEqual(expect.objectContaining({
        version: '1.0.0',
        description: 'Conservative medical analysis agent for identifying potential causes of health concerns',
        config: expect.objectContaining({
          model: 'gpt-4.1-nano',
          temperature: 0.3,
          max_tokens: 2000
        }),
        template: expect.stringContaining('{{healthConcern}}'),
        schema: expect.objectContaining({
          type: 'json_schema',
          name: 'potential_causes_response'
        })
      }));
    });

    it('should cache loaded configurations', async () => {
      const yamlContent = 'version: "1.0.0"\ndescription: "test"\nconfig:\n  model: "gpt-4"\n  temperature: 0.3\n  max_tokens: 1000\ntemplate: "test"\nschema:\n  type: "object"';
      mockFs.readFile.mockResolvedValue(yamlContent);

      // Load twice
      await promptManager.loadPromptConfig('potential-causes');
      await promptManager.loadPromptConfig('potential-causes');

      // Should only read file once
      expect(mockFs.readFile).toHaveBeenCalledTimes(1);
      expect(promptManager.getCachedPrompts()).toContain('potential-causes');
    });

    it('should throw PromptManagerError for missing file', async () => {
      mockFs.readFile.mockRejectedValue(new Error('File not found'));

      await expect(promptManager.loadPromptConfig('non-existent'))
        .rejects.toThrow(PromptManagerError);
    });

    it('should validate required fields in configuration', async () => {
      const invalidYaml = 'version: "1.0.0"\n# missing required fields';
      mockFs.readFile.mockResolvedValue(invalidYaml);

      await expect(promptManager.loadPromptConfig('invalid'))
        .rejects.toThrow(PromptManagerError);
    });
  });

  describe('preloadPrompts', () => {
    it('should preload potential-causes configuration', async () => {
      const yamlContent = 'version: "1.0.0"\ndescription: "test"\nconfig:\n  model: "gpt-4"\n  temperature: 0.3\n  max_tokens: 1000\ntemplate: "test"\nschema:\n  type: "object"';
      mockFs.readFile.mockResolvedValue(yamlContent);

      await promptManager.preloadPrompts();

      expect(mockFs.readFile).toHaveBeenCalledWith(
        expect.stringContaining('potential-causes.yaml'),
        'utf-8'
      );
      expect(promptManager.getCachedPrompts()).toContain('potential-causes');
    });

    it('should throw PromptManagerError if preloading fails', async () => {
      mockFs.readFile.mockRejectedValue(new Error('File read error'));

      await expect(promptManager.preloadPrompts())
        .rejects.toThrow(PromptManagerError);
    });
  });

  describe('getProcessedPrompt', () => {
    it('should process template variables correctly', async () => {
      const yamlContent = 'version: "1.0.0"\ndescription: "test"\nconfig:\n  model: "gpt-4"\n  temperature: 0.3\n  max_tokens: 1000\ntemplate: "Health concern: {{healthConcern}}, Age: {{age}}"\nschema:\n  type: "object"';
      mockFs.readFile.mockResolvedValue(yamlContent);

      const variables: TemplateVariables = {
        healthConcern: 'headache',
        age: '25'
      };

      const result = await promptManager.getProcessedPrompt('potential-causes', variables);

      expect(result.prompt).toBe('Health concern: headache, Age: 25');
      expect(result.config).toEqual(expect.objectContaining({
        config: expect.objectContaining({
          model: 'gpt-4',
          temperature: 0.3
        })
      }));
    });
  });

  describe('clearCache', () => {
    it('should clear the prompt cache', async () => {
      const yamlContent = 'version: "1.0.0"\ndescription: "test"\nconfig:\n  model: "gpt-4"\n  temperature: 0.3\n  max_tokens: 1000\ntemplate: "test"\nschema:\n  type: "object"';
      mockFs.readFile.mockResolvedValue(yamlContent);

      await promptManager.loadPromptConfig('potential-causes');
      expect(promptManager.getCachedPrompts()).toHaveLength(1);

      promptManager.clearCache();
      expect(promptManager.getCachedPrompts()).toHaveLength(0);
    });
  });
});
