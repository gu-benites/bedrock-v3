/**
 * @fileoverview Dynamic route page for Essential Oil Recipe Creator wizard steps.
 * Handles routing and step validation for the multi-step wizard.
 */

import { notFound, redirect } from 'next/navigation';
import { Suspense } from 'react';
import { RecipeWizardContainer } from '@/features/create-recipe/components/wizard-container';
import { WIZARD_STEPS, DEFAULT_STEP } from '@/features/create-recipe/constants/recipe.constants';
import { RecipeStep } from '@/features/create-recipe/types/recipe.types';
import { getServerLogger } from '@/lib/logger';

const logger = getServerLogger();

/**
 * Props for the dynamic recipe step page
 */
interface RecipeStepPageProps {
  params: {
    step: string;
  };
}

/**
 * Validates if the provided step is a valid wizard step
 */
function isValidStep(step: string): step is RecipeStep {
  return Object.values(RecipeStep).includes(step as RecipeStep);
}

/**
 * Gets wizard step configuration by step key
 */
function getStepConfig(step: RecipeStep) {
  return WIZARD_STEPS.find(config => config.key === step);
}

/**
 * Generates metadata for the page based on the current step
 */
export async function generateMetadata({ params }: RecipeStepPageProps) {
  const { step } = params;
  
  if (!isValidStep(step)) {
    return {
      title: 'Recipe Creator - Step Not Found',
      description: 'The requested recipe creation step was not found.'
    };
  }
  
  const stepConfig = getStepConfig(step);
  
  return {
    title: `Recipe Creator - ${stepConfig?.title || 'Unknown Step'}`,
    description: stepConfig?.description || 'Create your personalized essential oil recipe',
    robots: 'noindex, nofollow' // Prevent indexing of wizard steps
  };
}

/**
 * Generates static params for all valid wizard steps
 * This enables static generation for known routes
 */
export function generateStaticParams() {
  return Object.values(RecipeStep).map((step) => ({
    step: step,
  }));
}

/**
 * Loading component for the wizard step
 */
function RecipeStepLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Progress indicator skeleton */}
        <div className="mb-8">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-muted-foreground/20 animate-pulse" />
          </div>
          <div className="flex justify-between mt-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-4 w-16 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </div>
        
        {/* Content skeleton */}
        <div className="bg-card rounded-lg border p-6">
          <div className="space-y-4">
            <div className="h-8 bg-muted rounded animate-pulse" />
            <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded animate-pulse" />
              <div className="h-4 bg-muted rounded animate-pulse w-5/6" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Main page component for recipe wizard steps
 */
export default async function RecipeStepPage({ params }: RecipeStepPageProps) {
  const { step } = params;
  
  try {
    // Validate step parameter
    if (!step || typeof step !== 'string') {
      logger.warn('Invalid step parameter provided', { 
        step,
        operation: 'RecipeStepPage'
      });
      redirect(`/dashboard/create-recipe/${DEFAULT_STEP}`);
    }
    
    // Check if step is valid
    if (!isValidStep(step)) {
      logger.warn('Unknown recipe step requested', { 
        step,
        validSteps: Object.values(RecipeStep),
        operation: 'RecipeStepPage'
      });
      notFound();
    }
    
    // Get step configuration
    const stepConfig = getStepConfig(step);
    if (!stepConfig) {
      logger.error('Step configuration not found', { 
        step,
        operation: 'RecipeStepPage'
      });
      notFound();
    }
    
    logger.info('Rendering recipe wizard step', {
      step,
      stepNumber: stepConfig.stepNumber,
      title: stepConfig.title,
      operation: 'RecipeStepPage'
    });
    
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Suspense fallback={<RecipeStepLoading />}>
            <RecipeWizardContainer currentStep={step} />
          </Suspense>
        </div>
      </div>
    );
    
  } catch (error) {
    logger.error('Error rendering recipe step page', {
      step,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      operation: 'RecipeStepPage'
    });
    
    // Redirect to default step on error
    redirect(`/dashboard/create-recipe/${DEFAULT_STEP}`);
  }
}

/**
 * Error boundary for the recipe step page
 */
export function ErrorBoundary({ error }: { error: Error }) {
  logger.error('Recipe step page error boundary triggered', {
    error: error.message,
    stack: error.stack,
    operation: 'RecipeStepPageErrorBoundary'
  });
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 text-center">
          <h2 className="text-lg font-semibold text-destructive mb-2">
            Something went wrong
          </h2>
          <p className="text-muted-foreground mb-4">
            We encountered an error while loading this step of the recipe creator.
          </p>
          <div className="space-x-4">
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Try Again
            </button>
            <a
              href={`/dashboard/create-recipe/${DEFAULT_STEP}`}
              className="inline-flex items-center px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors"
            >
              Start Over
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
