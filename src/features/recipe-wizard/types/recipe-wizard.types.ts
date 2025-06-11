/**
 * @fileoverview Type definitions for Recipe Wizard feature
 */

/**
 * Template variable substitution interface
 */
export interface TemplateVariables {
  [key: string]: any;
}

/**
 * Prompt configuration interface
 */
export interface PromptConfig {
  version: string;
  description: string;
  config: {
    model: string;
    temperature: number;
    max_tokens: number;
    [key: string]: any;
  };
  template: string;
  schema: Record<string, any>;
  [key: string]: any;
}

/**
 * Demographics data interface
 */
export interface DemographicsData {
  gender?: string;
  ageCategory?: string;
  specificAge?: number;
  language?: string;
}

/**
 * Potential cause interface
 */
export interface PotentialCause {
  cause_id: string;
  name_localized: string;
  suggestion_localized: string;
  explanation_localized: string;
  [key: string]: any;
}
