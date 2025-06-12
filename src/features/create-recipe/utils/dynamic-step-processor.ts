/**
 * @fileoverview Dynamic step processor utility for handling AI steps in a generic way.
 * This utility enables processing any step without hardcoded logic.
 */

import { useAIStreaming } from '@/lib/ai/hooks/use-ai-streaming';
import { getStepConfig, transformData, validateSelection } from '../config/step-mapping';
import type { StepConfig } from '../config/step-mapping';

/**
 * Step processing options
 */
export interface StepProcessingOptions {
  /** Step identifier */
  stepId: string;
  /** Health concern data */
  healthConcern: any;
  /** Demographics data */
  demographics: any;
  /** Previously selected data (for dependent steps) */
  previousSelections?: Record<string, any[]>;
  /** User language preference */
  language?: string;
  /** Custom error handler */
  onError?: (error: string) => void;
  /** Custom success handler */
  onSuccess?: (data: any[]) => void;
  /** Custom progress handler */
  onProgress?: (partialData: any[]) => void;
}

/**
 * Step processing result
 */
export interface StepProcessingResult {
  /** Whether the step can be processed */
  canProcess: boolean;
  /** Error message if step cannot be processed */
  error?: string;
  /** Step configuration */
  config?: StepConfig;
  /** Streaming hook instance */
  streamingHook?: ReturnType<typeof useAIStreaming>;
}

/**
 * Dynamic step processor class
 */
export class DynamicStepProcessor {
  private stepId: string;
  private config: StepConfig;
  private options: StepProcessingOptions;

  constructor(options: StepProcessingOptions) {
    this.stepId = options.stepId;
    this.options = options;
    
    const config = getStepConfig(options.stepId);
    if (!config) {
      throw new Error(`Invalid step ID: ${options.stepId}`);
    }
    this.config = config;
  }

  /**
   * Validate that all dependencies are satisfied
   */
  validateDependencies(): { isValid: boolean; missingDependencies: string[] } {
    const { healthConcern, demographics, previousSelections = {} } = this.options;
    const missingDependencies: string[] = [];

    // Check basic dependencies
    if (this.config.dependencies.includes('health-concern') && !healthConcern) {
      missingDependencies.push('health-concern');
    }

    if (this.config.dependencies.includes('demographics') && !demographics) {
      missingDependencies.push('demographics');
    }

    // Check previous step dependencies
    this.config.dependencies.forEach(dep => {
      if (dep !== 'health-concern' && dep !== 'demographics') {
        if (!previousSelections[dep] || previousSelections[dep].length === 0) {
          missingDependencies.push(dep);
        }
      }
    });

    return {
      isValid: missingDependencies.length === 0,
      missingDependencies
    };
  }

  /**
   * Prepare request data for the AI streaming call
   */
  prepareRequestData(): any {
    const { healthConcern, demographics, previousSelections = {}, language = 'en' } = this.options;

    const requestData: any = {
      feature: 'recipe-wizard',
      step: this.stepId,
      data: {
        healthConcern: healthConcern.healthConcern,
        demographics: {
          gender: demographics.gender,
          ageCategory: demographics.ageCategory,
          specificAge: demographics.specificAge,
          language
        }
      }
    };

    // Add previous selections based on step dependencies
    if (previousSelections['potential-causes']) {
      requestData.data.selectedCauses = previousSelections['potential-causes'];
    }

    if (previousSelections['potential-symptoms']) {
      requestData.data.selectedSymptoms = previousSelections['potential-symptoms'];
    }

    if (previousSelections['therapeutic-properties']) {
      requestData.data.selectedProperties = previousSelections['therapeutic-properties'];
    }

    return requestData;
  }

  /**
   * Process streaming data with transformation
   */
  processStreamingData(rawData: any[]): any[] {
    if (!Array.isArray(rawData)) {
      console.warn('Expected array data from streaming, got:', typeof rawData);
      return [];
    }

    return transformData(rawData, this.stepId);
  }

  /**
   * Validate selection for this step
   */
  validateStepSelection(selectedItems: any[]): { isValid: boolean; errors: string[] } {
    return validateSelection(this.stepId, selectedItems);
  }

  /**
   * Get step configuration
   */
  getConfig(): StepConfig {
    return this.config;
  }

  /**
   * Get display information for the step
   */
  getDisplayInfo(): {
    title: string;
    description: string;
    selectionText: string;
    validationText: string;
  } {
    const { displayName, validation } = this.config;
    
    return {
      title: `Select ${displayName}`,
      description: `Based on your previous selections, here are potential ${displayName.toLowerCase()}. Select all that apply to your situation.`,
      selectionText: `Select ${validation.minSelection}-${validation.maxSelection} ${displayName.toLowerCase()} that might apply to you`,
      validationText: `${validation.minSelection}/${validation.maxSelection} selected`
    };
  }
}

/**
 * Hook for dynamic step processing
 */
export function useDynamicStepProcessor(options: StepProcessingOptions): StepProcessingResult {
  try {
    const processor = new DynamicStepProcessor(options);
    const config = processor.getConfig();

    // Validate dependencies
    const dependencyValidation = processor.validateDependencies();
    if (!dependencyValidation.isValid) {
      return {
        canProcess: false,
        error: `Missing dependencies: ${dependencyValidation.missingDependencies.join(', ')}`,
        config
      };
    }

    // Set up streaming hook
    const streamingHook = useAIStreaming<any[]>({
      jsonArrayPath: config.jsonArrayPath,
      onError: (error) => {
        console.error(`Streaming error for step ${options.stepId}:`, error);
        if (options.onError) {
          options.onError(`AI analysis failed: ${error.message}`);
        }
        return false; // Don't retry on error
      }
    });

    // Process partial data
    React.useEffect(() => {
      if (streamingHook.partialData && Array.isArray(streamingHook.partialData)) {
        const transformedData = processor.processStreamingData(streamingHook.partialData);
        if (options.onProgress) {
          options.onProgress(transformedData);
        }
      }
    }, [streamingHook.partialData, processor, options.onProgress]);

    // Process final data
    React.useEffect(() => {
      if (streamingHook.isComplete && streamingHook.finalData) {
        let finalArray: any[] = [];
        
        if (Array.isArray(streamingHook.finalData)) {
          finalArray = streamingHook.finalData;
        } else if (streamingHook.finalData && typeof streamingHook.finalData === 'object') {
          // Extract from nested structure
          const pathParts = config.jsonArrayPath.split('.');
          let current = streamingHook.finalData;
          for (const part of pathParts) {
            if (current && typeof current === 'object' && part in current) {
              current = current[part];
            } else {
              current = null;
              break;
            }
          }
          if (Array.isArray(current)) {
            finalArray = current;
          }
        }

        const transformedData = processor.processStreamingData(finalArray);
        if (options.onSuccess) {
          options.onSuccess(transformedData);
        }
      }
    }, [streamingHook.isComplete, streamingHook.finalData, processor, options.onSuccess]);

    return {
      canProcess: true,
      config,
      streamingHook
    };

  } catch (error) {
    return {
      canProcess: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      config: undefined
    };
  }
}

/**
 * Utility function to start step processing
 */
export async function startStepProcessing(
  processor: DynamicStepProcessor,
  streamingHook: ReturnType<typeof useAIStreaming>
): Promise<void> {
  const requestData = processor.prepareRequestData();
  
  console.log(`Starting AI streaming for step: ${processor.getConfig().stepId}`);
  console.log('Request data:', requestData);

  await streamingHook.startStream('/api/ai/streaming', requestData);
}

/**
 * Utility function to get step processing status
 */
export function getStepProcessingStatus(
  streamingHook: ReturnType<typeof useAIStreaming>
): {
  isLoading: boolean;
  isStreaming: boolean;
  isComplete: boolean;
  hasError: boolean;
  error?: string;
} {
  return {
    isLoading: streamingHook.isStreaming,
    isStreaming: streamingHook.isStreaming,
    isComplete: streamingHook.isComplete,
    hasError: !!streamingHook.error,
    error: streamingHook.error
  };
}

// Import React for useEffect
import React from 'react';
