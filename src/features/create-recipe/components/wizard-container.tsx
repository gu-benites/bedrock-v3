/**
 * @fileoverview Main container component for the Essential Oil Recipe Creator wizard.
 * Handles step routing and renders the appropriate step component.
 */

'use client';

import React, { useEffect, useCallback, useMemo } from 'react';
import { useRecipeWizardNavigation } from '../hooks/use-recipe-navigation';
import { useRecipeStore } from '../store/recipe-store';
import { RecipeStep } from '../types/recipe.types';
import { HealthConcernForm } from './health-concern-form';
import { HealthConcernChatInput } from './health-concern-chat-input';
import { DemographicsForm } from './demographics-form';
import { CausesSelection } from './causes-selection';
import { SymptomsSelection } from './symptoms-selection';
import { PropertiesDisplay } from './properties-display';
// Note: OilsDisplay removed - oils are now nested within TherapeuticPropertiesSelection
import { MobileLayout } from './mobile-layout';
import { DashboardLayout } from './dashboard-layout';
import { RecipeErrorBoundary } from './error-boundary';

/**
 * Props for the WizardContainer
 */
interface WizardContainerProps {
  currentStep?: RecipeStep;
  layout?: 'mobile' | 'dashboard' | 'standalone';
  showBreadcrumbs?: boolean;
  showProgress?: boolean;
  className?: string;
}

/**
 * Renders the appropriate step component based on current step
 * Memoized to prevent unnecessary re-renders when props haven't changed
 */
const StepRenderer = React.memo(({ step, sessionId, layout }: { step: RecipeStep; sessionId: string; layout?: string }) => {
  switch (step) {
    case RecipeStep.HEALTH_CONCERN:
      // Use chat-style input for dashboard layout, regular form for others
      return layout === 'dashboard'
        ? <HealthConcernChatInput key={`health-concern-chat-${sessionId}`} />
        : <HealthConcernForm key={`health-concern-${sessionId}`} />;
    case RecipeStep.DEMOGRAPHICS:
      return <DemographicsForm key={`demographics-${sessionId}`} />;
    case RecipeStep.CAUSES:
      return <CausesSelection key={`causes-${sessionId}`} />;
    case RecipeStep.SYMPTOMS:
      return <SymptomsSelection key={`symptoms-${sessionId}`} />;
    case RecipeStep.PROPERTIES:
      return <PropertiesDisplay key={`properties-${sessionId}`} />;
    default:
      return <div>Unknown step</div>;
  }
});

/**
 * Main wizard container component
 */
export function WizardContainer({
  currentStep,
  layout = 'mobile',
  showBreadcrumbs = true,
  showProgress = true,
  className
}: WizardContainerProps = {}) {
  const { stepInfo, goToNext, goToPrevious, canGoNext, canGoPrevious, getCompletionPercentage } = useRecipeWizardNavigation();

  // Use optimized selectors to prevent unnecessary re-renders
  const { currentStep: storeCurrentStep, isLoading, error, sessionId } = useRecipeStore(
    useCallback((state) => ({
      currentStep: state.currentStep,
      isLoading: state.isLoading,
      error: state.error,
      sessionId: state.sessionId,
    }), [])
  );

  const { setCurrentStep, resetWizard } = useRecipeStore(
    useCallback((state) => ({
      setCurrentStep: state.setCurrentStep,
      resetWizard: state.resetWizard,
    }), [])
  );

  // Use prop or store current step
  const activeStep = currentStep || storeCurrentStep;

  // Memoize sync condition to prevent unnecessary effect runs
  const shouldSync = useMemo(() => {
    return currentStep && currentStep !== storeCurrentStep && !isLoading;
  }, [currentStep, storeCurrentStep, isLoading]);

  // Sync URL step with store state - optimized to reduce re-renders
  useEffect(() => {
    if (shouldSync) {
      if (process.env.NODE_ENV === 'development') {
        const timestamp = new Date().toISOString();
        console.log(`🔄 [${timestamp}] WizardContainer: Syncing URL step with store:`, {
          urlStep: currentStep,
          storeStep: storeCurrentStep
        });
      }
      setCurrentStep(currentStep);
    }
  }, [shouldSync, currentStep, storeCurrentStep, setCurrentStep]);

  // Memoize progress calculation to prevent unnecessary recalculations
  const progressPercentage = useMemo(() => getCompletionPercentage(), [getCompletionPercentage]);

  // Memoize layout decisions to prevent unnecessary re-renders
  const layoutConfig = useMemo(() => {
    const isHealthConcernStep = activeStep === RecipeStep.HEALTH_CONCERN;
    const shouldShowSimplifiedLayout = isHealthConcernStep && layout === 'dashboard';
    return { isHealthConcernStep, shouldShowSimplifiedLayout };
  }, [activeStep, layout]);

  // Memoize wizard content to prevent unnecessary re-renders
  const wizardContent = useMemo(() => (
    <div className="space-y-6" aria-label="Recipe creation wizard">
      {/* Loading State */}
      {isLoading && (
        <div role="status" className="flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2">Loading...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div role="alert" className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <p className="text-destructive">{error}</p>
            <button
              onClick={resetWizard}
              className="px-3 py-1 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Current Step Announcement */}
      <div role="status" aria-label="Current step" className="sr-only">
        Currently on {stepInfo.current.title}, step {stepInfo.progress} of 6
      </div>

      {/* Step Content */}
      <div className="min-h-[400px]">
        <StepRenderer step={activeStep} sessionId={sessionId} layout={layout} />
      </div>
    </div>
  ), [isLoading, error, resetWizard, stepInfo.current.title, stepInfo.progress, activeStep, sessionId, layout]);

  // Render with appropriate layout
  return (
    <RecipeErrorBoundary>
      {layout === 'dashboard' ? (
        layoutConfig.shouldShowSimplifiedLayout ? (
          // Simplified layout for health concern step - no breadcrumbs or sidebar
          <div className="h-full">
            <StepRenderer step={activeStep} sessionId={sessionId} layout={layout} />
          </div>
        ) : (
          // Regular dashboard layout for other steps
          <DashboardLayout
            showBreadcrumbs={showBreadcrumbs}
            showProgress={showProgress}
            className={className}
          >
            {wizardContent}
          </DashboardLayout>
        )
      ) : layout === 'standalone' ? (
        <div className={className}>
          {wizardContent}
        </div>
      ) : (
        <MobileLayout
          showBreadcrumbs={showBreadcrumbs}
          showProgress={showProgress}
          className={className}
        >
          {wizardContent}
        </MobileLayout>
      )}
    </RecipeErrorBoundary>
  );
}

// Export both names for compatibility
export { WizardContainer as RecipeWizardContainer };
