/**
 * @fileoverview Demo component to test state clearing functionality.
 * This component demonstrates the state clearing logic when navigating backwards.
 */

'use client';

import React from 'react';
import { useRecipeStore } from '../store/recipe-store';
import { useRecipeWizardNavigation } from '../hooks/use-recipe-navigation';
import { RecipeStep } from '../types/recipe.types';
import { Button } from '@/components/ui/button';

/**
 * Demo component for testing state clearing functionality
 */
export function StateClearingDemo() {
  const {
    currentStep,
    completedSteps,
    healthConcern,
    demographics,
    selectedCauses,
    selectedSymptoms,
    therapeuticProperties,
    suggestedOils,
    updateHealthConcern,
    updateDemographics,
    updateSelectedCauses,
    updateSelectedSymptoms,
    clearStepsAfter,
    clearStepData,
    resetWizard
  } = useRecipeStore();

  const { goToStep, startNewRecipe } = useRecipeWizardNavigation();

  /**
   * Populate test data for demonstration
   */
  const populateTestData = () => {
    // Add health concern
    updateHealthConcern({ healthConcern: 'Test health concern for demo' });
    
    // Add demographics
    updateDemographics({
      gender: 'Female',
      ageCategory: '25-34',
      specificAge: 28,
      language: 'English'
    });
    
    // Add test causes
    updateSelectedCauses([
      { cause_id: '1', cause_name: 'Test Cause 1', relevancy: 5 },
      { cause_id: '2', cause_name: 'Test Cause 2', relevancy: 4 }
    ]);
    
    // Add test symptoms
    updateSelectedSymptoms([
      { symptom_id: '1', symptom_name: 'Test Symptom 1', relevancy: 5 },
      { symptom_id: '2', symptom_name: 'Test Symptom 2', relevancy: 4 }
    ]);
  };

  /**
   * Test clearing steps after a specific step
   */
  const testClearStepsAfter = (step: RecipeStep) => {
    clearStepsAfter(step);
  };

  /**
   * Test clearing specific step data
   */
  const testClearStepData = (step: RecipeStep) => {
    clearStepData(step);
  };

  /**
   * Test navigation with automatic clearing
   */
  const testNavigationClearing = async (targetStep: RecipeStep) => {
    await goToStep(targetStep);
  };

  return (
    <div className="p-6 space-y-6 bg-card rounded-lg border">
      <div className="space-y-2">
        <h2 className="text-xl font-bold">State Clearing Demo</h2>
        <p className="text-sm text-muted-foreground">
          Test the state clearing functionality for recipe wizard navigation
        </p>
      </div>

      {/* Current State Display */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Current State</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Current Step:</strong> {currentStep}
          </div>
          <div>
            <strong>Completed Steps:</strong> {completedSteps.join(', ') || 'None'}
          </div>
          <div>
            <strong>Health Concern:</strong> {healthConcern?.healthConcern || 'None'}
          </div>
          <div>
            <strong>Demographics:</strong> {demographics ? 'Set' : 'None'}
          </div>
          <div>
            <strong>Selected Causes:</strong> {selectedCauses.length}
          </div>
          <div>
            <strong>Selected Symptoms:</strong> {selectedSymptoms.length}
          </div>
          <div>
            <strong>Therapeutic Properties:</strong> {therapeuticProperties.length}
          </div>
          <div>
            <strong>Suggested Oils:</strong> {suggestedOils.length}
          </div>
        </div>
      </div>

      {/* Test Controls */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Test Controls</h3>
        
        {/* Setup */}
        <div className="space-y-2">
          <h4 className="font-medium">Setup</h4>
          <div className="flex gap-2">
            <Button onClick={populateTestData} variant="outline" size="sm">
              Populate Test Data
            </Button>
            <Button onClick={resetWizard} variant="outline" size="sm">
              Reset All Data
            </Button>
          </div>
        </div>

        {/* Clear Steps After */}
        <div className="space-y-2">
          <h4 className="font-medium">Clear Steps After</h4>
          <div className="flex gap-2 flex-wrap">
            <Button 
              onClick={() => testClearStepsAfter(RecipeStep.HEALTH_CONCERN)} 
              variant="outline" 
              size="sm"
            >
              Clear After Health Concern
            </Button>
            <Button 
              onClick={() => testClearStepsAfter(RecipeStep.DEMOGRAPHICS)} 
              variant="outline" 
              size="sm"
            >
              Clear After Demographics
            </Button>
            <Button 
              onClick={() => testClearStepsAfter(RecipeStep.CAUSES)} 
              variant="outline" 
              size="sm"
            >
              Clear After Causes
            </Button>
            <Button 
              onClick={() => testClearStepsAfter(RecipeStep.SYMPTOMS)} 
              variant="outline" 
              size="sm"
            >
              Clear After Symptoms
            </Button>
          </div>
        </div>

        {/* Clear Specific Step */}
        <div className="space-y-2">
          <h4 className="font-medium">Clear Specific Step</h4>
          <div className="flex gap-2 flex-wrap">
            <Button 
              onClick={() => testClearStepData(RecipeStep.HEALTH_CONCERN)} 
              variant="outline" 
              size="sm"
            >
              Clear Health Concern
            </Button>
            <Button 
              onClick={() => testClearStepData(RecipeStep.DEMOGRAPHICS)} 
              variant="outline" 
              size="sm"
            >
              Clear Demographics
            </Button>
            <Button 
              onClick={() => testClearStepData(RecipeStep.CAUSES)} 
              variant="outline" 
              size="sm"
            >
              Clear Causes
            </Button>
            <Button 
              onClick={() => testClearStepData(RecipeStep.SYMPTOMS)} 
              variant="outline" 
              size="sm"
            >
              Clear Symptoms
            </Button>
          </div>
        </div>

        {/* Navigation with Clearing */}
        <div className="space-y-2">
          <h4 className="font-medium">Navigation with Auto-Clearing</h4>
          <div className="flex gap-2 flex-wrap">
            <Button 
              onClick={() => testNavigationClearing(RecipeStep.HEALTH_CONCERN)} 
              variant="outline" 
              size="sm"
            >
              Navigate to Health Concern
            </Button>
            <Button 
              onClick={() => testNavigationClearing(RecipeStep.DEMOGRAPHICS)} 
              variant="outline" 
              size="sm"
            >
              Navigate to Demographics
            </Button>
            <Button 
              onClick={() => testNavigationClearing(RecipeStep.CAUSES)} 
              variant="outline" 
              size="sm"
            >
              Navigate to Causes
            </Button>
          </div>
        </div>

        {/* Start New Recipe */}
        <div className="space-y-2">
          <h4 className="font-medium">Complete Reset</h4>
          <Button onClick={startNewRecipe} variant="destructive" size="sm">
            Start New Recipe
          </Button>
        </div>
      </div>

      {/* Instructions */}
      <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
        <h4 className="font-medium">Testing Instructions</h4>
        <ol className="text-sm space-y-1 list-decimal list-inside">
          <li>Click "Populate Test Data" to add sample data to all steps</li>
          <li>Test "Clear Steps After" buttons to see how data is cleared for subsequent steps</li>
          <li>Test "Clear Specific Step" buttons to clear individual step data</li>
          <li>Test "Navigation with Auto-Clearing" to see automatic clearing during backwards navigation</li>
          <li>Monitor the state display to see how data is cleared</li>
        </ol>
      </div>
    </div>
  );
}
