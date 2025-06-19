/**
 * @fileoverview Generic step selector component that can handle any AI step dynamically.
 * This component eliminates the need for step-specific components.
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRecipeStore } from '../store/recipe-store';
import { useRecipeWizardNavigation } from '../hooks/use-recipe-navigation';
import { useDynamicStepProcessor, startStepProcessing, getStepProcessingStatus } from '../utils/dynamic-step-processor';
import type { StepProcessingOptions } from '../utils/dynamic-step-processor';
import { cn } from '@/lib/utils';

/**
 * Memoized item component for better performance with large lists
 */
const SelectableItem = React.memo(({
  item,
  isSelected,
  onToggle,
  itemId
}: {
  item: any;
  isSelected: boolean;
  onToggle: () => void;
  itemId: string;
}) => {
  return (
    <div
      className={cn(
        "border rounded-lg p-4 cursor-pointer transition-all duration-200",
        "hover:shadow-md",
        isSelected
          ? "border-primary bg-primary/5 shadow-sm"
          : "border-input hover:border-primary/50"
      )}
      onClick={onToggle}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-1">
          <div className={cn(
            "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
            isSelected
              ? "border-primary bg-primary"
              : "border-input"
          )}>
            {isSelected && (
              <svg className="w-3 h-3 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </div>
        </div>

        <div className="flex-1 space-y-2">
          <h3 className="font-medium text-foreground">
            {item.cause_name || item.symptom_name || item.property_name || item.name || 'Unknown'}
          </h3>

          {(item.cause_suggestion || item.symptom_suggestion || item.description) && (
            <p className="text-sm text-muted-foreground">
              {item.cause_suggestion || item.symptom_suggestion || item.description}
            </p>
          )}

          {item.explanation && (
            <p className="text-xs text-muted-foreground italic">
              {item.explanation}
            </p>
          )}
        </div>
      </div>
    </div>
  );
});

/**
 * Generic step selector props
 */
interface GenericStepSelectorProps {
  /** Step identifier */
  stepId: string;
  /** Custom title override */
  title?: string;
  /** Custom description override */
  description?: string;
  /** Custom CSS classes */
  className?: string;
  /** Custom item renderer */
  renderItem?: (item: any, isSelected: boolean, onToggle: () => void) => React.ReactNode;
}

/**
 * Generic step selector component
 */
export function GenericStepSelector({
  stepId,
  title,
  description,
  className,
  renderItem
}: GenericStepSelectorProps) {
  const {
    healthConcern,
    demographics,
    selectedCauses,
    selectedSymptoms,
    therapeuticProperties,
    isLoading,
    error,
    setError,
    clearError,
    isStreamingCauses,
    streamingError,
    setStreamingCauses,
    setStreamingError,
    clearStreamingError
  } = useRecipeStore();

  const { goToNext, goToPrevious, canGoNext, canGoPrevious, markCurrentStepCompleted } = useRecipeWizardNavigation();
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [stepData, setStepData] = useState<any[]>([]);

  // Prepare previous selections for dependencies
  const previousSelections = {
    'potential-causes': selectedCauses,
    'potential-symptoms': selectedSymptoms,
    'therapeutic-properties': therapeuticProperties
  };

  // Set up dynamic step processor
  const processingOptions: StepProcessingOptions = {
    stepId,
    healthConcern,
    demographics,
    previousSelections,
    language: 'en',
    onError: (error) => {
      console.error(`Step ${stepId} error:`, error);
      setStreamingError(error);
    },
    onSuccess: (data) => {
      console.log(`Step ${stepId} completed with data:`, data);
      setStepData(data);
      setStreamingCauses(false);
    },
    onProgress: (partialData) => {
      console.log(`Step ${stepId} progress:`, partialData);
      setStepData(partialData);
    }
  };

  const stepProcessor = useDynamicStepProcessor(processingOptions);

  // Get display information
  const displayInfo = stepProcessor.config ? 
    stepProcessor.config && new (class {
      getDisplayInfo() {
        const config = stepProcessor.config!;
        return {
          title: title || `Select ${config.displayName}`,
          description: description || `Based on your previous selections, here are potential ${config.displayName.toLowerCase()}. Select all that apply to your situation.`,
          selectionText: `Select ${config.validation.minSelection}-${config.validation.maxSelection} ${config.displayName.toLowerCase()} that might apply to you`,
          validationText: `${config.validation.minSelection}/${config.validation.maxSelection} selected`
        };
      }
    })().getDisplayInfo() : null;

  // Initialize selected items from store
  useEffect(() => {
    if (!stepProcessor.config) return;

    const storeProperty = stepProcessor.config.selectedProperty;
    const storeData = (useRecipeStore.getState() as any)[storeProperty] || [];
    
    if (storeData.length > 0) {
      const ids = new Set(storeData.map((item: any) => getItemId(item)));
      setSelectedItemIds(ids);
    }
  }, [stepProcessor.config]);

  // Get item ID based on step type
  const getItemId = (item: any): string => {
    if (item.cause_name) return item.cause_name;
    if (item.symptom_name) return item.symptom_name;
    if (item.property_name) return item.property_name;
    return item.id || item.name || JSON.stringify(item);
  };

  // Handle item selection toggle
  const handleItemToggle = useCallback((item: any) => {
    if (!stepProcessor.config) return;

    const itemId = getItemId(item);
    const newSelectedIds = new Set(selectedItemIds);

    if (newSelectedIds.has(itemId)) {
      newSelectedIds.delete(itemId);
    } else {
      if (newSelectedIds.size >= stepProcessor.config.validation.maxSelection) {
        setError(`You can select up to ${stepProcessor.config.validation.maxSelection} ${stepProcessor.config.displayName.toLowerCase()} maximum.`);
        return;
      }
      newSelectedIds.add(itemId);
      clearError();
    }

    setSelectedItemIds(newSelectedIds);

    // Update store with selected items
    const selectedItems = stepData.filter(item => newSelectedIds.has(getItemId(item)));
    
    // Update the appropriate store property
    const storeProperty = stepProcessor.config.selectedProperty;
    const updateAction = `update${storeProperty.charAt(0).toUpperCase() + storeProperty.slice(1)}`;
    const storeActions = useRecipeStore.getState() as any;
    
    if (storeActions[updateAction]) {
      storeActions[updateAction](selectedItems);
    }

    // Mark step as completed if minimum selection is met
    if (selectedItems.length >= stepProcessor.config.validation.minSelection) {
      markCurrentStepCompleted();
    }
  }, [stepData, selectedItemIds, stepProcessor.config, setError, clearError, markCurrentStepCompleted]);

  // Start step processing
  const startProcessing = useCallback(async () => {
    if (!stepProcessor.canProcess || !stepProcessor.streamingHook) {
      setError(stepProcessor.error || 'Cannot process step');
      return;
    }

    try {
      setStreamingCauses(true);
      clearError();
      clearStreamingError();

      const processor = new (await import('../utils/dynamic-step-processor')).DynamicStepProcessor(processingOptions);
      await startStepProcessing(processor, stepProcessor.streamingHook);
    } catch (error) {
      console.error('Failed to start step processing:', error);
      setStreamingError(error instanceof Error ? error.message : 'Failed to start processing');
    }
  }, [stepProcessor, processingOptions, setStreamingCauses, clearError, clearStreamingError, setStreamingError]);

  // Auto-start processing if dependencies are met and no data exists
  useEffect(() => {
    if (stepProcessor.canProcess && stepData.length === 0 && !isStreamingCauses && !error && !streamingError) {
      startProcessing();
    }
  }, [stepProcessor.canProcess, stepData.length, isStreamingCauses, error, streamingError, startProcessing]);

  // Handle form submission
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stepProcessor.config) return;

    const validation = stepProcessor.config && new (class {
      validateStepSelection(items: any[]) {
        const config = stepProcessor.config!;
        const errors: string[] = [];
        const count = items.length;

        if (config.validation.required && count === 0) {
          errors.push(`At least ${config.validation.minSelection} ${config.displayName.toLowerCase()} must be selected`);
        }

        if (count < config.validation.minSelection) {
          errors.push(`Please select at least ${config.validation.minSelection} ${config.displayName.toLowerCase()}`);
        }

        return { isValid: errors.length === 0, errors };
      }
    })().validateStepSelection(Array.from(selectedItemIds));

    if (!validation.isValid) {
      setError(validation.errors[0]);
      return;
    }

    try {
      markCurrentStepCompleted();
      if (canGoNext()) {
        await goToNext();
      }
    } catch (error) {
      console.error('Form submission failed:', error);
      setError('Failed to proceed to next step. Please try again.');
    }
  };

  // Handle go back
  const handleGoBack = async () => {
    if (canGoPrevious()) {
      await goToPrevious();
    }
  };

  // Render error state
  if (!stepProcessor.canProcess) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <p className="text-destructive text-sm">{stepProcessor.error}</p>
        </div>
      </div>
    );
  }

  const isFormValid = selectedItemIds.size >= (stepProcessor.config?.validation.minSelection || 1) && 
                     selectedItemIds.size <= (stepProcessor.config?.validation.maxSelection || 10);

  return (
    <div data-testid={`${stepId}-selector`} className={cn("space-y-6", className)}>
      {/* Header */}
      {displayInfo && (
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground">
            {displayInfo.title}
          </h2>
          <p className="text-muted-foreground">
            {displayInfo.description}
          </p>
        </div>
      )}

      {/* Health Concern Summary */}
      {healthConcern && (
        <div className="bg-muted/50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-foreground mb-2">Your health concern:</h3>
          <p className="text-sm text-muted-foreground italic">
            "{healthConcern.healthConcern}"
          </p>
        </div>
      )}

      {/* Error Display */}
      {(error || streamingError) && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <p className="text-destructive text-sm">{error || streamingError}</p>
        </div>
      )}

      {/* Loading State */}
      {isStreamingCauses && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">
              AI is analyzing your information...
            </p>
          </div>
        </div>
      )}

      {/* Items Selection */}
      {stepData.length > 0 && !isLoading && (
        <form onSubmit={onSubmit} className="space-y-6">
          {/* Selection Counter */}
          {displayInfo && (
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                {displayInfo.selectionText}
              </p>
              <span className={cn(
                "text-sm font-medium",
                selectedItemIds.size > (stepProcessor.config?.validation.maxSelection || 10) ? "text-destructive" : "text-foreground"
              )}>
                {selectedItemIds.size}/{stepProcessor.config?.validation.maxSelection || 10} selected
              </span>
            </div>
          )}

          {/* Items Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stepData.map((item, index) => {
              const itemId = getItemId(item);
              const isSelected = selectedItemIds.has(itemId);

              if (renderItem) {
                return renderItem(item, isSelected, () => handleItemToggle(item));
              }

              return (
                <SelectableItem
                  key={`${itemId}-${index}`}
                  item={item}
                  isSelected={isSelected}
                  onToggle={() => handleItemToggle(item)}
                  itemId={itemId}
                />
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4">
            <button
              type="button"
              onClick={handleGoBack}
              disabled={!canGoPrevious() || isLoading}
              className={cn(
                "px-6 py-2 rounded-md font-medium transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2",
                canGoPrevious()
                  ? "bg-secondary text-secondary-foreground hover:bg-secondary/90"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
            >
              ← Previous
            </button>

            <div className="flex items-center space-x-4">
              {isFormValid && (
                <span className="text-sm text-green-600">✓ Ready to continue</span>
              )}

              <button
                type="submit"
                disabled={!isFormValid || isLoading}
                className={cn(
                  "px-6 py-2 rounded-md font-medium transition-colors",
                  "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                  isFormValid
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
              >
                {isLoading ? 'Processing...' : 'Continue →'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Empty State */}
      {!isStreamingCauses && stepData.length === 0 && !error && !streamingError && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No data found. Please go back and check your previous selections.
          </p>
          <button
            onClick={handleGoBack}
            className="mt-4 px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90"
          >
            ← Go Back
          </button>
        </div>
      )}
    </div>
  );
}
