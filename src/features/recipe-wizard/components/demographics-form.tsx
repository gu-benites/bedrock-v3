/**
 * @fileoverview Demographics Form component for Recipe Wizard
 * Collects user demographics and initiates AI streaming for potential causes
 */

'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useWizardStore, WizardStep } from '../store/wizard-store';
import { useAIStreaming } from '@/lib/ai/hooks/use-ai-streaming';
import type { DemographicsData, PotentialCause } from '../types/recipe-wizard.types';

/**
 * Demographics form validation schema
 */
const demographicsSchema = z.object({
  gender: z.string().min(1, 'Gender is required'),
  ageCategory: z.string().min(1, 'Age category is required'),
  specificAge: z.number().min(1, 'Age must be at least 1').max(120, 'Age must be less than 120'),
  language: z.string().default('en')
});

/**
 * Gender options
 */
const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer-not-to-say', label: 'Prefer not to say' }
];

/**
 * Age category options
 */
const AGE_CATEGORY_OPTIONS = [
  { value: 'child', label: 'Child (0-12)' },
  { value: 'teen', label: 'Teen (13-17)' },
  { value: 'adult', label: 'Adult (18-64)' },
  { value: 'senior', label: 'Senior (65+)' }
];

/**
 * Demographics Form component
 */
export function DemographicsForm() {
  const {
    healthConcern,
    demographics,
    setDemographics,
    setPotentialCauses,
    addPotentialCause,
    setCurrentStep,
    markStepCompleted,
    setStreaming,
    setStreamingError,
    isStreaming
  } = useWizardStore();

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Configure AI streaming hook for potential causes
  const {
    startStream,
    partialData,
    finalData,
    error: streamError,
    isComplete
  } = useAIStreaming<PotentialCause[]>({
    jsonArrayPath: 'data.potential_causes',
    onError: (error) => {
      console.error('Streaming error:', error);
      setStreamingError(error.message);
      return false; // Don't retry on error
    }
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid }
  } = useForm<DemographicsData>({
    resolver: zodResolver(demographicsSchema),
    defaultValues: {
      gender: demographics?.gender || '',
      ageCategory: demographics?.ageCategory || '',
      specificAge: demographics?.specificAge || undefined,
      language: demographics?.language || 'en'
    },
    mode: 'onChange'
  });

  const watchedGender = watch('gender');
  const watchedAgeCategory = watch('ageCategory');

  /**
   * Handle form submission and initiate AI streaming
   */
  const onSubmit = async (data: DemographicsData) => {
    if (!healthConcern) {
      setStreamingError('Health concern is required');
      return;
    }

    setIsSubmitting(true);
    setStreamingError(null);

    try {
      // Save demographics data
      setDemographics(data);
      markStepCompleted(WizardStep.DEMOGRAPHICS);

      // Start AI streaming for potential causes
      setStreaming(true);
      
      await startStream('/api/ai/streaming', {
        feature: 'recipe-wizard',
        step: 'potential-causes',
        data: {
          healthConcern,
          demographics: data
        }
      });

      console.log('AI streaming initiated successfully');

    } catch (error) {
      console.error('Failed to initiate AI streaming:', error);
      setStreamingError(error instanceof Error ? error.message : 'Failed to start AI analysis');
      setStreaming(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle streaming data updates
   */
  React.useEffect(() => {
    if (partialData && Array.isArray(partialData)) {
      // Update store with partial streaming data
      setPotentialCauses(partialData);
    }
  }, [partialData, setPotentialCauses]);

  /**
   * Handle streaming completion
   */
  React.useEffect(() => {
    if (isComplete && finalData) {
      console.log('Streaming completed with final data:', finalData);
      
      // Extract potential causes from final data
      let causes: PotentialCause[] = [];
      if (Array.isArray(finalData)) {
        causes = finalData;
      } else if (finalData && typeof finalData === 'object' && 'data' in finalData) {
        const data = finalData as any;
        if (data.data?.potential_causes && Array.isArray(data.data.potential_causes)) {
          causes = data.data.potential_causes;
        }
      }

      setPotentialCauses(causes);
      setStreaming(false);
      
      // Navigate to potential causes step
      setCurrentStep(WizardStep.POTENTIAL_CAUSES);
    }
  }, [isComplete, finalData, setPotentialCauses, setStreaming, setCurrentStep]);

  /**
   * Handle streaming errors
   */
  React.useEffect(() => {
    if (streamError) {
      setStreamingError(streamError);
      setStreaming(false);
    }
  }, [streamError, setStreamingError, setStreaming]);

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Tell us about yourself
        </h1>
        <p className="text-gray-600">
          This information helps us provide personalized recommendations for your {healthConcern}.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Gender Selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-700">
            Gender *
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {GENDER_OPTIONS.map((option) => (
              <label
                key={option.value}
                className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                  watchedGender === option.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  {...register('gender')}
                  value={option.value}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  disabled={isStreaming || isSubmitting}
                />
                <span className="text-sm font-medium">{option.label}</span>
              </label>
            ))}
          </div>
          {errors.gender && (
            <p className="text-sm text-red-600">{errors.gender.message}</p>
          )}
        </div>

        {/* Age Category */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-700">
            Age Category *
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {AGE_CATEGORY_OPTIONS.map((option) => (
              <label
                key={option.value}
                className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                  watchedAgeCategory === option.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  {...register('ageCategory')}
                  value={option.value}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  disabled={isStreaming || isSubmitting}
                />
                <span className="text-sm font-medium">{option.label}</span>
              </label>
            ))}
          </div>
          {errors.ageCategory && (
            <p className="text-sm text-red-600">{errors.ageCategory.message}</p>
          )}
        </div>

        {/* Specific Age */}
        <div className="space-y-3">
          <label htmlFor="specificAge" className="text-sm font-medium text-gray-700">
            Specific Age *
          </label>
          <input
            type="number"
            id="specificAge"
            {...register('specificAge', { valueAsNumber: true })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your age"
            min="1"
            max="120"
            disabled={isStreaming || isSubmitting}
          />
          {errors.specificAge && (
            <p className="text-sm text-red-600">{errors.specificAge.message}</p>
          )}
        </div>

        {/* Error Display */}
        {(streamError || isStreaming) && (
          <div className={`p-4 rounded-md ${streamError ? 'bg-red-50 border border-red-200' : 'bg-blue-50 border border-blue-200'}`}>
            {streamError ? (
              <p className="text-sm text-red-600">{streamError}</p>
            ) : (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <p className="text-sm text-blue-600">Analyzing your information...</p>
              </div>
            )}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!isValid || isStreaming || isSubmitting}
          className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
            isValid && !isStreaming && !isSubmitting
              ? 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isStreaming || isSubmitting ? 'Analyzing...' : 'Continue to Potential Causes'}
        </button>
      </form>
    </div>
  );
}
