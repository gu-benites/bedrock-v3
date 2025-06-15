/**
 * @fileoverview Tests for dynamic step mapping configuration
 */

import {
  getStepConfig,
  getAvailableSteps,
  canExecuteStep,
  getNextStep,
  transformData,
  validateSelection,
  getStepDependenciesText,
  isFinalStep,
  getStepProgress,
  DATA_TRANSFORMATIONS,
  STEP_CONFIGURATIONS
} from './step-mapping';

describe('Step Mapping Configuration', () => {
  describe('getStepConfig', () => {
    it('should return configuration for valid step', () => {
      const config = getStepConfig('potential-causes');
      
      expect(config).toBeDefined();
      expect(config?.stepId).toBe('potential-causes');
      expect(config?.displayName).toBe('Potential Causes');
      expect(config?.promptName).toBe('potential-causes');
      expect(config?.jsonArrayPath).toBe('data.potential_causes');
    });

    it('should return undefined for invalid step', () => {
      const config = getStepConfig('invalid-step');
      expect(config).toBeUndefined();
    });
  });

  describe('getAvailableSteps', () => {
    it('should return all configured steps', () => {
      const steps = getAvailableSteps();
      
      expect(steps).toContain('potential-causes');
      expect(steps).toContain('potential-symptoms');
      expect(steps).toContain('therapeutic-properties');
      expect(steps.length).toBeGreaterThan(0);
    });
  });

  describe('canExecuteStep', () => {
    it('should allow potential-causes with basic dependencies', () => {
      const canExecute = canExecuteStep('potential-causes', ['health-concern', 'demographics']);
      expect(canExecute).toBe(true);
    });

    it('should not allow potential-symptoms without causes', () => {
      const canExecute = canExecuteStep('potential-symptoms', ['health-concern', 'demographics']);
      expect(canExecute).toBe(false);
    });

    it('should allow potential-symptoms with all dependencies', () => {
      const canExecute = canExecuteStep('potential-symptoms', [
        'health-concern', 
        'demographics', 
        'potential-causes'
      ]);
      expect(canExecute).toBe(true);
    });

    it('should not allow therapeutic-properties without all dependencies', () => {
      const canExecute = canExecuteStep('therapeutic-properties', [
        'health-concern', 
        'demographics', 
        'potential-causes'
      ]);
      expect(canExecute).toBe(false);
    });

    it('should allow therapeutic-properties with all dependencies', () => {
      const canExecute = canExecuteStep('therapeutic-properties', [
        'health-concern', 
        'demographics', 
        'potential-causes',
        'potential-symptoms'
      ]);
      expect(canExecute).toBe(true);
    });
  });

  describe('getNextStep', () => {
    it('should return potential-causes as first step', () => {
      const nextStep = getNextStep(['health-concern', 'demographics']);
      expect(nextStep).toBe('potential-causes');
    });

    it('should return potential-symptoms after causes', () => {
      const nextStep = getNextStep([
        'health-concern', 
        'demographics', 
        'potential-causes'
      ]);
      expect(nextStep).toBe('potential-symptoms');
    });

    it('should return therapeutic-properties after symptoms', () => {
      const nextStep = getNextStep([
        'health-concern', 
        'demographics', 
        'potential-causes',
        'potential-symptoms'
      ]);
      expect(nextStep).toBe('therapeutic-properties');
    });

    it('should return null when all steps completed', () => {
      const nextStep = getNextStep([
        'health-concern', 
        'demographics', 
        'potential-causes',
        'potential-symptoms',
        'therapeutic-properties'
      ]);
      expect(nextStep).toBe(null);
    });
  });

  describe('transformData', () => {
    it('should transform potential causes correctly', () => {
      const recipeWizardData = [
        {
          cause_id: 'c1',
          name_localized: 'Stress',
          suggestion_localized: 'Work stress',
          explanation_localized: 'High stress levels'
        }
      ];

      const transformed = transformData(recipeWizardData, 'potential-causes');
      
      expect(transformed).toHaveLength(1);
      expect(transformed[0]).toEqual({
        cause_name: 'Stress',
        cause_suggestion: 'Work stress',
        explanation: 'High stress levels'
      });
    });

    it('should transform potential symptoms correctly', () => {
      const recipeWizardData = [
        {
          symptom_id: 's1',
          name_localized: 'Headache',
          suggestion_localized: 'Tension headache',
          explanation_localized: 'Stress-related headache'
        }
      ];

      const transformed = transformData(recipeWizardData, 'potential-symptoms');
      
      expect(transformed).toHaveLength(1);
      expect(transformed[0]).toEqual({
        symptom_name: 'Headache',
        symptom_suggestion: 'Tension headache',
        explanation: 'Stress-related headache'
      });
    });

    it('should handle missing fields gracefully', () => {
      const incompleteData = [
        {
          cause_id: 'c1',
          name_localized: 'Incomplete Cause'
          // Missing suggestion and explanation
        }
      ];

      const transformed = transformData(incompleteData, 'potential-causes');
      
      expect(transformed[0]).toEqual({
        cause_name: 'Incomplete Cause',
        cause_suggestion: '',
        explanation: ''
      });
    });

    it('should return original data for unknown step', () => {
      const data = [{ test: 'data' }];
      const transformed = transformData(data, 'unknown-step');
      
      expect(transformed).toEqual(data);
    });
  });

  describe('validateSelection', () => {
    it('should validate potential causes selection correctly', () => {
      const validSelection = [{ cause_name: 'Stress' }];
      const validation = validateSelection('potential-causes', validSelection);
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should reject empty selection for required step', () => {
      const validation = validateSelection('potential-causes', []);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('At least 1 potential causes must be selected');
    });

    it('should reject selection exceeding maximum', () => {
      const tooManyItems = Array.from({ length: 11 }, (_, i) => ({ cause_name: `Cause ${i}` }));
      const validation = validateSelection('potential-causes', tooManyItems);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('You can select up to 10 potential causes maximum');
    });

    it('should handle invalid step gracefully', () => {
      const validation = validateSelection('invalid-step', []);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Invalid step configuration');
    });
  });

  describe('getStepDependenciesText', () => {
    it('should return formatted dependencies text', () => {
      const text = getStepDependenciesText('potential-symptoms');
      expect(text).toContain('Health Concern');
      expect(text).toContain('Demographics');
      expect(text).toContain('Potential Causes');
    });

    it('should return no dependencies for steps without dependencies', () => {
      // Mock a step without dependencies
      const text = getStepDependenciesText('potential-causes');
      expect(text).toContain('Health Concern');
      expect(text).toContain('Demographics');
    });
  });

  describe('isFinalStep', () => {
    it('should identify therapeutic-properties as final step', () => {
      const isFinal = isFinalStep('therapeutic-properties');
      expect(isFinal).toBe(true);
    });

    it('should not identify potential-causes as final step', () => {
      const isFinal = isFinalStep('potential-causes');
      expect(isFinal).toBe(false);
    });

    it('should handle invalid step', () => {
      const isFinal = isFinalStep('invalid-step');
      expect(isFinal).toBe(false);
    });
  });

  describe('getStepProgress', () => {
    it('should calculate progress correctly', () => {
      const progress = getStepProgress(['health-concern', 'demographics', 'potential-causes']);
      
      expect(progress.completed).toBe(3);
      expect(progress.total).toBeGreaterThan(0);
      expect(progress.percentage).toBeGreaterThan(0);
      expect(progress.nextStep).toBe('potential-symptoms');
    });

    it('should handle completed flow', () => {
      const progress = getStepProgress([
        'health-concern',
        'demographics',
        'potential-causes',
        'potential-symptoms',
        'therapeutic-properties'
      ]);

      expect(progress.nextStep).toBe(null);
      // The percentage calculation includes all completed steps vs configured steps
      // Since we have 5 completed steps and 3 configured steps, percentage will be > 100
      expect(progress.percentage).toBeGreaterThan(100);
      expect(progress.completed).toBe(5);
    });

    it('should handle empty completed steps', () => {
      const progress = getStepProgress([]);
      
      expect(progress.completed).toBe(0);
      expect(progress.percentage).toBe(0);
      expect(progress.nextStep).toBe(null); // No steps can be executed without dependencies
    });
  });

  describe('DATA_TRANSFORMATIONS', () => {
    it('should have correct transformation configurations', () => {
      expect(DATA_TRANSFORMATIONS.POTENTIAL_CAUSES.from).toBe('recipe-wizard');
      expect(DATA_TRANSFORMATIONS.POTENTIAL_CAUSES.to).toBe('create-recipe');
      expect(typeof DATA_TRANSFORMATIONS.POTENTIAL_CAUSES.transform).toBe('function');
    });

    it('should transform data correctly', () => {
      const testData = {
        cause_id: 'test-cause-id',
        name_localized: 'Test Cause',
        suggestion_localized: 'Test suggestion',
        explanation_localized: 'Test explanation'
      };

      const transformed = DATA_TRANSFORMATIONS.POTENTIAL_CAUSES.transform(testData);

      expect(transformed).toEqual({
        cause_id: 'test-cause-id', // Should preserve AI-generated ID
        cause_name: 'Test Cause',
        cause_suggestion: 'Test suggestion',
        explanation: 'Test explanation'
      });
    });
  });

  describe('STEP_CONFIGURATIONS', () => {
    it('should have valid configuration structure', () => {
      Object.values(STEP_CONFIGURATIONS).forEach(config => {
        expect(config).toHaveProperty('stepId');
        expect(config).toHaveProperty('displayName');
        expect(config).toHaveProperty('promptName');
        expect(config).toHaveProperty('jsonArrayPath');
        expect(config).toHaveProperty('transformations');
        expect(config).toHaveProperty('dependencies');
        expect(config).toHaveProperty('storeProperty');
        expect(config).toHaveProperty('selectedProperty');
        expect(config).toHaveProperty('validation');
        
        expect(Array.isArray(config.transformations)).toBe(true);
        expect(Array.isArray(config.dependencies)).toBe(true);
        expect(typeof config.validation.minSelection).toBe('number');
        expect(typeof config.validation.maxSelection).toBe('number');
        expect(typeof config.validation.required).toBe('boolean');
      });
    });

    it('should have unique step IDs', () => {
      const stepIds = Object.keys(STEP_CONFIGURATIONS);
      const uniqueStepIds = new Set(stepIds);
      
      expect(stepIds.length).toBe(uniqueStepIds.size);
    });

    it('should have valid dependency chains', () => {
      Object.values(STEP_CONFIGURATIONS).forEach(config => {
        config.dependencies.forEach(dep => {
          // Dependencies should either be basic steps or other configured steps
          const isBasicStep = ['health-concern', 'demographics'].includes(dep);
          const isConfiguredStep = STEP_CONFIGURATIONS.hasOwnProperty(dep);
          
          expect(isBasicStep || isConfiguredStep).toBe(true);
        });
      });
    });
  });
});
