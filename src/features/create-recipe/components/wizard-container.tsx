/**
 * @fileoverview Main container component for the Essential Oil Recipe Creator wizard.
 * Handles step routing and renders the appropriate step component.
 */

'use client';

import { useEffect } from 'react';
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
 */
function StepRenderer({ step, sessionId, layout }: { step: RecipeStep; sessionId: string; layout?: string }) {
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
}

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
  const { currentStep: storeCurrentStep, setCurrentStep, isLoading, error, resetWizard, sessionId } = useRecipeStore();

  // Use prop or store current step
  const activeStep = currentStep || storeCurrentStep;

  // Sync URL step with store state - but only when necessary to prevent loops
  useEffect(() => {
    // Only sync if the URL step is different from store AND we're not already navigating
    // This prevents the synchronization loop that causes multiple re-renders
    if (currentStep && currentStep !== storeCurrentStep && !isLoading) {
      if (process.env.NODE_ENV === 'development') {
        const timestamp = new Date().toISOString();
        console.log(`🔄 [${timestamp}] WizardContainer: Syncing URL step with store:`, {
          urlStep: currentStep,
          storeStep: storeCurrentStep
        });
      }
      setCurrentStep(currentStep);
    }
  }, [currentStep, storeCurrentStep, setCurrentStep, isLoading]);

  // Progress indicator
  const progressPercentage = getCompletionPercentage();

  // Determine if we should show simplified layout for health concern step
  const isHealthConcernStep = activeStep === RecipeStep.HEALTH_CONCERN;
  const shouldShowSimplifiedLayout = isHealthConcernStep && layout === 'dashboard';

  // Wizard content (same for all layouts)
  const wizardContent = (
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
  );

  // Render with appropriate layout
  return (
    <RecipeErrorBoundary>
      {layout === 'dashboard' ? (
        shouldShowSimplifiedLayout ? (
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
