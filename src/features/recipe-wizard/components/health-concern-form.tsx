/**
 * @fileoverview Health Concern Form component for Recipe Wizard
 * Collects and validates user's health concern description
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useRecipeWizardStore } from '../store/wizard-store';
import { RecipeWizardStep } from '../types/recipe-wizard.types';
import { 
  MIN_HEALTH_CONCERN_LENGTH, 
  MAX_HEALTH_CONCERN_LENGTH,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES 
} from '../constants/wizard.constants';

/**
 * Validation error interface
 */
interface ValidationError {
  field: string;
  message: string;
}

/**
 * Health Concern Form component
 */
export function HealthConcernForm(): JSX.Element {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Store state and actions
  const {
    healthConcern,
    isLoading,
    error: storeError,
    updateHealthConcern,
    setCurrentStep,
    markStepCompleted,
    clearError
  } = useRecipeWizardStore();

  // Local form state
  const [formData, setFormData] = useState({
    healthConcern: healthConcern?.healthConcern || ''
  });
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Focus textarea on mount
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  /**
   * Validates the health concern input
   */
  const validateHealthConcern = (value: string): ValidationError[] => {
    const errors: ValidationError[] = [];

    if (!value.trim()) {
      errors.push({
        field: 'healthConcern',
        message: ERROR_MESSAGES.HEALTH_CONCERN_REQUIRED
      });
    } else if (value.trim().length < MIN_HEALTH_CONCERN_LENGTH) {
      errors.push({
        field: 'healthConcern',
        message: ERROR_MESSAGES.HEALTH_CONCERN_TOO_SHORT
      });
    } else if (value.length > MAX_HEALTH_CONCERN_LENGTH) {
      errors.push({
        field: 'healthConcern',
        message: ERROR_MESSAGES.HEALTH_CONCERN_TOO_LONG
      });
    }

    return errors;
  };

  /**
   * Handles input change
   */
  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { value } = event.target;
    
    setFormData({ healthConcern: value });
    setHasInteracted(true);

    // Clear validation errors when user starts typing
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }

    // Clear store error when user interacts
    if (storeError) {
      clearError();
    }
  };

  /**
   * Handles form submission
   */
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Validate form
    const errors = validateHealthConcern(formData.healthConcern);
    
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      // Clear any existing errors
      clearError();

      // Update store with health concern data
      updateHealthConcern({ healthConcern: formData.healthConcern.trim() });

      // Mark step as completed and navigate to next step
      markStepCompleted(RecipeWizardStep.HEALTH_CONCERN);
      setCurrentStep(RecipeWizardStep.DEMOGRAPHICS);

      // Navigate to the demographics page
      router.push('/dashboard/recipe-wizard/demographics');

    } catch (error) {
      console.error('Failed to save health concern:', error);
    }
  };

  /**
   * Gets character count styling based on current length
   */
  const getCharacterCountClass = (length: number): string => {
    if (length > MAX_HEALTH_CONCERN_LENGTH) {
      return 'text-red-600';
    } else if (length > MAX_HEALTH_CONCERN_LENGTH * 0.9) {
      return 'text-yellow-600';
    }
    return 'text-gray-500';
  };

  /**
   * Gets the current validation error for health concern field
   */
  const getHealthConcernError = (): string | null => {
    const error = validationErrors.find(err => err.field === 'healthConcern');
    return error ? error.message : null;
  };

  const characterCount = formData.healthConcern.length;
  const healthConcernError = getHealthConcernError();
  const hasError = !!healthConcernError || !!storeError;

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-gray-900">
          Describe Your Health Concern
        </h1>
        <p className="text-gray-600">
          Please provide a detailed description of what you'd like to address with essential oils.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Health Concern Textarea */}
        <div className="space-y-2">
          <label 
            htmlFor="health-concern"
            className="block text-sm font-medium text-gray-700"
          >
            Describe your health concern *
          </label>
          
          <div className="relative">
            <textarea
              ref={textareaRef}
              id="health-concern"
              name="healthConcern"
              value={formData.healthConcern}
              onChange={handleInputChange}
              placeholder="Describe your symptoms, concerns, or what you'd like to address. For example: 'I've been experiencing chronic anxiety and stress that affects my sleep and daily activities...'"
              rows={6}
              maxLength={MAX_HEALTH_CONCERN_LENGTH + 50} // Allow slight overflow for validation
              className={`
                w-full px-3 py-2 border rounded-md shadow-sm resize-none
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                ${hasError 
                  ? 'border-red-300 bg-red-50' 
                  : 'border-gray-300 bg-white'
                }
              `}
              aria-describedby="health-concern-description health-concern-count health-concern-error"
              aria-invalid={hasError}
              disabled={isLoading}
            />
          </div>

          {/* Character Count */}
          <div className="flex justify-between items-center text-sm">
            <div id="health-concern-description" className="text-gray-500">
              Provide details about your health concern for personalized recommendations.
            </div>
            <div
              id="health-concern-count"
              className={getCharacterCountClass(characterCount)}
            >
              {characterCount} / {MAX_HEALTH_CONCERN_LENGTH} characters
            </div>
          </div>

          {/* Validation Error */}
          {healthConcernError && (
            <div 
              id="health-concern-error"
              className="text-sm text-red-600"
              role="alert"
            >
              {healthConcernError}
            </div>
          )}
        </div>

        {/* Store Error */}
        {storeError && (
          <div 
            className="p-4 bg-red-50 border border-red-200 rounded-md"
            role="alert"
          >
            <div className="text-sm text-red-600">
              {storeError}
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className={`
              px-6 py-2 rounded-md font-medium text-white
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              disabled:opacity-50 disabled:cursor-not-allowed
              ${isLoading
                ? 'bg-gray-400'
                : 'bg-blue-600 hover:bg-blue-700'
              }
            `}
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg 
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24"
                >
                  <circle 
                    className="opacity-25" 
                    cx="12" 
                    cy="12" 
                    r="10" 
                    stroke="currentColor" 
                    strokeWidth="4"
                  />
                  <path 
                    className="opacity-75" 
                    fill="currentColor" 
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Processing...
              </span>
            ) : (
              'Continue to Demographics'
            )}
          </button>
        </div>
      </form>

      {/* Help Text */}
      <div className="text-center text-sm text-gray-500">
        <p>
          Your information is kept private and secure. This will help us provide 
          personalized essential oil recommendations.
        </p>
      </div>
    </div>
  );
}
