/**
 * @fileoverview Demographics Form component for Recipe Wizard
 * Collects user demographic information including gender, age, and language preferences
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRecipeWizardStore } from '../store/wizard-store';
import { RecipeWizardStep } from '../types/recipe-wizard.types';
import type { DemographicsData, ValidationError } from '../types/recipe-wizard.types';
import { 
  GENDER_OPTIONS, 
  AGE_CATEGORIES, 
  LANGUAGES, 
  AGE_CONSTRAINTS,
  ERROR_MESSAGES 
} from '../constants/wizard.constants';

/**
 * Demographics form component for collecting user demographic information
 */
export function DemographicsForm() {
  const router = useRouter();

  // Store state
  const {
    healthConcern,
    demographics,
    completedSteps,
    isLoading,
    error: storeError,
    updateDemographics,
    setCurrentStep,
    markStepCompleted,
    clearError,
    clearStepsAfter
  } = useRecipeWizardStore();

  // Local form state
  const [formData, setFormData] = useState<DemographicsData>({
    gender: demographics?.gender || ('' as any),
    ageCategory: demographics?.ageCategory || ('' as any),
    specificAge: demographics?.specificAge || 0,
    language: demographics?.language || ('' as any)
  });

  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [hasInteracted, setHasInteracted] = useState(false);

  /**
   * Updates form data when store demographics change
   */
  useEffect(() => {
    if (demographics) {
      setFormData(demographics);
    }
  }, [demographics]);

  /**
   * Validates demographics form data
   */
  const validateDemographics = (data: DemographicsData): ValidationError[] => {
    const errors: ValidationError[] = [];

    // Gender validation
    if (!data.gender) {
      errors.push({ field: 'gender', message: ERROR_MESSAGES.GENDER_REQUIRED });
    }

    // Age category validation
    if (!data.ageCategory) {
      errors.push({ field: 'ageCategory', message: ERROR_MESSAGES.AGE_CATEGORY_REQUIRED });
    }

    // Specific age validation
    if (!data.specificAge || data.specificAge < AGE_CONSTRAINTS.MIN_AGE || data.specificAge > AGE_CONSTRAINTS.MAX_AGE) {
      errors.push({ field: 'specificAge', message: ERROR_MESSAGES.AGE_OUT_OF_RANGE });
    }

    // Age category matching validation
    if (data.ageCategory && data.specificAge) {
      const category = AGE_CATEGORIES.find(cat => cat.value === data.ageCategory);
      if (category && (data.specificAge < category.min || data.specificAge > category.max)) {
        errors.push({ field: 'specificAge', message: ERROR_MESSAGES.AGE_CATEGORY_MISMATCH });
      }
    }

    // Language validation (optional in MVP)
    // if (!data.language) {
    //   errors.push({ field: 'language', message: ERROR_MESSAGES.LANGUAGE_REQUIRED });
    // }

    return errors;
  };

  /**
   * Handles form field changes
   */
  const handleFieldChange = (field: keyof DemographicsData, value: any) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    setHasInteracted(true);

    // Clear validation errors when user makes changes
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }

    // Clear store error when user interacts
    if (storeError) {
      clearError();
    }

    // Clear subsequent steps when demographics change (if there are completed subsequent steps)
    if (completedSteps && completedSteps.includes(RecipeWizardStep.POTENTIAL_CAUSES)) {
      clearStepsAfter(RecipeWizardStep.DEMOGRAPHICS);
    }

    // Update age input constraints when age category changes
    // Note: We don't automatically reset the age to allow validation to show errors
  };

  /**
   * Handles form submission
   */
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Validate form
    const errors = validateDemographics(formData);
    
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      // Clear any existing errors
      clearError();

      // Update store with demographics data
      updateDemographics(formData);

      // Mark step as completed and navigate to next step
      markStepCompleted(RecipeWizardStep.DEMOGRAPHICS);
      setCurrentStep(RecipeWizardStep.POTENTIAL_CAUSES);

      // Navigate to the potential causes page
      router.push('/dashboard/recipe-wizard/potential-causes');

    } catch (error) {
      console.error('Failed to save demographics:', error);
    }
  };

  /**
   * Gets validation error for a specific field
   */
  const getFieldError = (field: string): string | null => {
    const error = validationErrors.find(err => err.field === field);
    return error ? error.message : null;
  };

  /**
   * Gets age input constraints based on selected category
   */
  const getAgeConstraints = () => {
    if (formData.ageCategory) {
      const category = AGE_CATEGORIES.find(cat => cat.value === formData.ageCategory);
      if (category) {
        return { min: category.min, max: category.max };
      }
    }
    return { min: AGE_CONSTRAINTS.MIN_AGE, max: AGE_CONSTRAINTS.MAX_AGE };
  };

  const genderError = getFieldError('gender');
  const ageCategoryError = getFieldError('ageCategory');
  const ageError = getFieldError('specificAge');
  const languageError = getFieldError('language');
  const ageConstraints = getAgeConstraints();

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-gray-900">
          Demographics
        </h1>
        <p className="text-gray-600">
          Help us provide personalized essential oil recommendations based on your profile.
        </p>
      </div>

      {/* Health Concern Summary */}
      {healthConcern && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Your health concern:</h3>
          <p className="text-sm text-gray-600 italic">
            "{healthConcern.healthConcern}"
          </p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        {/* Gender Field */}
        <div className="space-y-2">
          <label 
            htmlFor="gender"
            className="block text-sm font-medium text-gray-700"
          >
            Gender *
          </label>
          
          <select
            id="gender"
            name="gender"
            value={formData.gender}
            onChange={(e) => handleFieldChange('gender', e.target.value)}
            className={`
              w-full px-3 py-2 border rounded-md shadow-sm
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              ${genderError
                ? 'border-red-300 bg-red-50'
                : 'border-gray-300 bg-white'
              }
            `}
            aria-describedby="gender-description gender-error"
            aria-invalid={!!genderError}
            aria-required="true"
            disabled={isLoading}
          >
            <option value="">Select your gender</option>
            {GENDER_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <div id="gender-description" className="text-sm text-gray-500">
            Helps us provide age-appropriate recommendations.
          </div>

          {genderError && (
            <div 
              id="gender-error"
              className="text-sm text-red-600"
              role="alert"
            >
              {genderError}
            </div>
          )}
        </div>

        {/* Age Category Field */}
        <div className="space-y-2">
          <label 
            htmlFor="age-category"
            className="block text-sm font-medium text-gray-700"
          >
            Age Category *
          </label>
          
          <select
            id="age-category"
            name="ageCategory"
            value={formData.ageCategory}
            onChange={(e) => handleFieldChange('ageCategory', e.target.value)}
            className={`
              w-full px-3 py-2 border rounded-md shadow-sm
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              ${ageCategoryError
                ? 'border-red-300 bg-red-50'
                : 'border-gray-300 bg-white'
              }
            `}
            aria-describedby="age-category-description age-category-error"
            aria-invalid={!!ageCategoryError}
            aria-required="true"
            disabled={isLoading}
          >
            <option value="">Select your age category</option>
            {AGE_CATEGORIES.map(category => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>

          <div id="age-category-description" className="text-sm text-gray-500">
            Ensures safety considerations for personalized recommendations.
          </div>

          {ageCategoryError && (
            <div
              id="age-category-error"
              className="text-sm text-red-600"
              role="alert"
            >
              {ageCategoryError}
            </div>
          )}
        </div>

        {/* Specific Age Field */}
        <div className="space-y-2">
          <label
            htmlFor="specific-age"
            className="block text-sm font-medium text-gray-700"
          >
            Specific Age *
          </label>

          <input
            type="number"
            id="specific-age"
            name="specificAge"
            value={formData.specificAge || ''}
            onChange={(e) => handleFieldChange('specificAge', parseInt(e.target.value) || 0)}
            min={ageConstraints.min}
            max={ageConstraints.max}
            className={`
              w-full px-3 py-2 border rounded-md shadow-sm
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              ${ageError
                ? 'border-red-300 bg-red-50'
                : 'border-gray-300 bg-white'
              }
            `}
            aria-describedby="specific-age-description specific-age-error"
            aria-invalid={!!ageError}
            aria-required="true"
            disabled={isLoading}
            placeholder="Enter your age"
          />

          <div id="specific-age-description" className="text-sm text-gray-500">
            Your specific age helps us provide precise dosage and safety recommendations.
          </div>

          {ageError && (
            <div
              id="specific-age-error"
              className="text-sm text-red-600"
              role="alert"
            >
              {ageError}
            </div>
          )}
        </div>

        {/* Language Field */}
        <div className="space-y-2">
          <label
            htmlFor="language"
            className="block text-sm font-medium text-gray-700"
          >
            Preferred Language
          </label>

          <select
            id="language"
            name="language"
            value={formData.language}
            onChange={(e) => handleFieldChange('language', e.target.value)}
            className={`
              w-full px-3 py-2 border rounded-md shadow-sm
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              ${languageError
                ? 'border-red-300 bg-red-50'
                : 'border-gray-300 bg-white'
              }
            `}
            aria-describedby="language-description language-error"
            aria-invalid={!!languageError}
            disabled={isLoading}
          >
            <option value="">Select your preferred language</option>
            {LANGUAGES.map(language => (
              <option key={language.value} value={language.value}>
                {language.label}
              </option>
            ))}
          </select>

          <div id="language-description" className="text-sm text-gray-500">
            For personalized recommendations in your preferred language.
          </div>

          {languageError && (
            <div
              id="language-error"
              className="text-sm text-red-600"
              role="alert"
            >
              {languageError}
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
              'Continue to Potential Causes'
            )}
          </button>
        </div>
      </form>

      {/* Help Text */}
      <div className="text-center text-sm text-gray-500">
        <p>
          Your demographic information helps us provide safe and personalized essential oil recommendations.
        </p>
      </div>
    </div>
  );
}
