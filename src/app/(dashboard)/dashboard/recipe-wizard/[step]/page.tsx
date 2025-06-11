/**
 * @fileoverview Dynamic page for Recipe Wizard steps.
 * Handles routing for health-concern, demographics, and potential-causes steps.
 */

import React from 'react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';

// Import the new Recipe Wizard components
import { HealthConcernForm } from '@/features/recipe-wizard/components/health-concern-form';
import { DemographicsForm } from '@/features/recipe-wizard/components/demographics-form';
import { PotentialCausesForm } from '@/features/recipe-wizard/components/potential-causes-form';
import { RecipeWizardStep } from '@/features/recipe-wizard/types/recipe-wizard.types';

/**
 * Valid step parameters for the recipe wizard
 */
const VALID_STEPS = [
  RecipeWizardStep.HEALTH_CONCERN,
  RecipeWizardStep.DEMOGRAPHICS,
  RecipeWizardStep.POTENTIAL_CAUSES
] as const;

/**
 * Step metadata configuration
 */
const STEP_METADATA: Record<string, { title: string; description: string }> = {
  [RecipeWizardStep.HEALTH_CONCERN]: {
    title: 'Health Concern - Recipe Wizard',
    description: 'Describe your health concern to get personalized essential oil recommendations'
  },
  [RecipeWizardStep.DEMOGRAPHICS]: {
    title: 'Demographics - Recipe Wizard', 
    description: 'Provide your demographic information for personalized recommendations'
  },
  [RecipeWizardStep.POTENTIAL_CAUSES]: {
    title: 'Potential Causes - Recipe Wizard',
    description: 'Review AI-generated potential causes and select the most relevant ones'
  }
};

/**
 * Generate metadata for each step
 */
export async function generateMetadata({
  params
}: {
  params: Promise<{ step: string }>
}): Promise<Metadata> {
  const { step } = await params;
  const stepMetadata = STEP_METADATA[step];

  if (!stepMetadata) {
    return {
      title: 'Recipe Wizard - AromaRx',
      description: 'Create your personalized essential oil recipe'
    };
  }

  return {
    title: stepMetadata.title,
    description: stepMetadata.description,
    robots: 'noindex, nofollow'
  };
}

/**
 * Recipe Wizard Step Page Component
 */
export default async function RecipeWizardStepPage({
  params
}: {
  params: Promise<{ step: string }>
}) {
  const { step } = await params;

  // Validate step parameter
  if (!VALID_STEPS.includes(step as RecipeWizardStep)) {
    notFound();
  }

  // Render the appropriate component based on the step
  switch (step as RecipeWizardStep) {
    case RecipeWizardStep.HEALTH_CONCERN:
      return <HealthConcernForm />;
      
    case RecipeWizardStep.DEMOGRAPHICS:
      return <DemographicsForm />;
      
    case RecipeWizardStep.POTENTIAL_CAUSES:
      return <PotentialCausesForm />;
      
    default:
      notFound();
  }
}

/**
 * Generate static params for all valid steps
 * This enables static generation for known routes
 */
export function generateStaticParams() {
  return VALID_STEPS.map((step) => ({
    step: step,
  }));
}
