/**
 * @fileoverview Dynamic step mapping configuration for Recipe Creator AI steps.
 * This configuration enables easy addition of new AI steps without hardcoding logic.
 */

/**
 * Data transformation interface for converting between different data formats
 */
export interface DataTransformation {
  /** Source format identifier */
  from: string;
  /** Target format identifier */
  to: string;
  /** Transformation function */
  transform: (data: any) => any;
}

/**
 * Step configuration interface
 */
export interface StepConfig {
  /** Step identifier used for API calls */
  stepId: string;
  /** Human-readable step name */
  displayName: string;
  /** Prompt file name (without .yaml extension) */
  promptName: string;
  /** JSON path to extract data from streaming response */
  jsonArrayPath: string;
  /** Data transformations for this step */
  transformations: DataTransformation[];
  /** Dependencies - which steps must be completed before this one */
  dependencies: string[];
  /** Store property name where the data will be stored */
  storeProperty: string;
  /** Store property name for selected items */
  selectedProperty: string;
  /** Validation rules */
  validation: {
    minSelection: number;
    maxSelection: number;
    required: boolean;
  };
}

/**
 * Recipe-wizard to create-recipe data transformations
 */
export const DATA_TRANSFORMATIONS = {
  // Transform potential causes from recipe-wizard format to create-recipe format
  POTENTIAL_CAUSES: {
    from: 'recipe-wizard',
    to: 'create-recipe',
    transform: (cause: any) => ({
      cause_name: cause.name_localized || cause.cause_id || 'Unknown cause',
      cause_suggestion: cause.suggestion_localized || '',
      explanation: cause.explanation_localized || ''
    })
  },

  // Transform potential symptoms from recipe-wizard format to create-recipe format
  POTENTIAL_SYMPTOMS: {
    from: 'recipe-wizard',
    to: 'create-recipe',
    transform: (symptom: any) => ({
      symptom_name: symptom.name_localized || symptom.symptom_id || 'Unknown symptom',
      symptom_suggestion: symptom.suggestion_localized || '',
      explanation: symptom.explanation_localized || ''
    })
  },

  // Transform therapeutic properties from recipe-wizard format to create-recipe format
  THERAPEUTIC_PROPERTIES: {
    from: 'recipe-wizard',
    to: 'create-recipe',
    transform: (property: any) => ({
      property_name: property.property_name_localized || property.property_name_english || property.property_id || 'Unknown property',
      property_name_english: property.property_name_english || '',
      description: property.description_contextual_localized || '',
      addresses_cause_ids: property.addresses_cause_ids || [],
      addresses_symptom_ids: property.addresses_symptom_ids || [],
      relevancy_score: property.relevancy_score || 1
    })
  }
} as const;

/**
 * Step configurations for the Recipe Creator flow
 */
export const STEP_CONFIGURATIONS: Record<string, StepConfig> = {
  'potential-causes': {
    stepId: 'potential-causes',
    displayName: 'Potential Causes',
    promptName: 'potential-causes',
    jsonArrayPath: 'data.potential_causes',
    transformations: [DATA_TRANSFORMATIONS.POTENTIAL_CAUSES],
    dependencies: ['health-concern', 'demographics'],
    storeProperty: 'potentialCauses',
    selectedProperty: 'selectedCauses',
    validation: {
      minSelection: 1,
      maxSelection: 10,
      required: true
    }
  },

  'potential-symptoms': {
    stepId: 'potential-symptoms',
    displayName: 'Potential Symptoms',
    promptName: 'potential-symptoms',
    jsonArrayPath: 'data.potential_symptoms',
    transformations: [DATA_TRANSFORMATIONS.POTENTIAL_SYMPTOMS],
    dependencies: ['health-concern', 'demographics', 'potential-causes'],
    storeProperty: 'potentialSymptoms',
    selectedProperty: 'selectedSymptoms',
    validation: {
      minSelection: 1,
      maxSelection: 15,
      required: true
    }
  },

  'therapeutic-properties': {
    stepId: 'therapeutic-properties',
    displayName: 'Therapeutic Properties',
    promptName: 'therapeutic-properties',
    jsonArrayPath: 'data.therapeutic_properties',
    transformations: [DATA_TRANSFORMATIONS.THERAPEUTIC_PROPERTIES],
    dependencies: ['health-concern', 'demographics', 'potential-causes', 'potential-symptoms'],
    storeProperty: 'therapeuticProperties',
    selectedProperty: 'selectedTherapeuticProperties',
    validation: {
      minSelection: 1,
      maxSelection: 8,
      required: true
    }
  }
};

/**
 * Get step configuration by step ID
 */
export function getStepConfig(stepId: string): StepConfig | undefined {
  return STEP_CONFIGURATIONS[stepId];
}

/**
 * Get all available step IDs
 */
export function getAvailableSteps(): string[] {
  return Object.keys(STEP_CONFIGURATIONS);
}

/**
 * Check if a step has all its dependencies satisfied
 */
export function canExecuteStep(stepId: string, completedSteps: string[]): boolean {
  const config = getStepConfig(stepId);
  if (!config) return false;

  return config.dependencies.every(dep => completedSteps.includes(dep));
}

/**
 * Get the next step in the flow based on completed steps
 */
export function getNextStep(completedSteps: string[]): string | null {
  const availableSteps = getAvailableSteps();
  
  for (const stepId of availableSteps) {
    if (!completedSteps.includes(stepId) && canExecuteStep(stepId, completedSteps)) {
      return stepId;
    }
  }
  
  return null; // All steps completed or no valid next step
}

/**
 * Transform data using the specified transformation
 */
export function transformData(data: any[], stepId: string): any[] {
  const config = getStepConfig(stepId);
  if (!config || !config.transformations.length) {
    return data;
  }

  // Apply the first transformation (can be extended for multiple transformations)
  const transformation = config.transformations[0];
  return data.map(item => transformation.transform(item));
}

/**
 * Validate selection based on step configuration
 */
export function validateSelection(stepId: string, selectedItems: any[]): {
  isValid: boolean;
  errors: string[];
} {
  const config = getStepConfig(stepId);
  if (!config) {
    return { isValid: false, errors: ['Invalid step configuration'] };
  }

  const errors: string[] = [];
  const count = selectedItems.length;

  if (config.validation.required && count === 0) {
    errors.push(`At least ${config.validation.minSelection} ${config.displayName.toLowerCase()} must be selected`);
  }

  if (count < config.validation.minSelection) {
    errors.push(`Please select at least ${config.validation.minSelection} ${config.displayName.toLowerCase()}`);
  }

  if (count > config.validation.maxSelection) {
    errors.push(`You can select up to ${config.validation.maxSelection} ${config.displayName.toLowerCase()} maximum`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Get step dependencies as a readable string
 */
export function getStepDependenciesText(stepId: string): string {
  const config = getStepConfig(stepId);
  if (!config || !config.dependencies.length) {
    return 'No dependencies';
  }

  return config.dependencies
    .map(dep => dep.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()))
    .join(', ');
}

/**
 * Check if step is the final step in the flow
 */
export function isFinalStep(stepId: string): boolean {
  const allSteps = getAvailableSteps();
  const config = getStepConfig(stepId);
  if (!config) return false;

  // Check if any other step depends on this step
  return !allSteps.some(otherStepId => {
    const otherConfig = getStepConfig(otherStepId);
    return otherConfig && otherConfig.dependencies.includes(stepId);
  });
}

/**
 * Get step progress information
 */
export function getStepProgress(completedSteps: string[]): {
  completed: number;
  total: number;
  percentage: number;
  nextStep: string | null;
} {
  const total = getAvailableSteps().length;
  const completed = completedSteps.length;
  const percentage = Math.round((completed / total) * 100);
  const nextStep = getNextStep(completedSteps);

  return {
    completed,
    total,
    percentage,
    nextStep
  };
}
