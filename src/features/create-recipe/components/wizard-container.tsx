/**
 * @fileoverview Main container component for the Essential Oil Recipe Creator wizard.
 * Handles step routing and renders the appropriate step component.
 */

'use client';

import { useEffect } from 'react';
import { useRecipeNavigation } from '../hooks/use-recipe-navigation';
import { useRecipeStore } from '../store/recipe-store';
import { RecipeStep } from '../types/recipe.types';
import { HealthConcernForm } from './health-concern-form';
import { DemographicsForm } from './demographics-form';
import { CausesSelection } from './causes-selection';
import { SymptomsSelection } from './symptoms-selection';
import { PropertiesDisplay } from './properties-display';
import { OilsDisplay } from './oils-display';
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
function StepRenderer({ step }: { step: RecipeStep }) {
  switch (step) {
    case RecipeStep.HEALTH_CONCERN:
      return <HealthConcernForm />;
    case RecipeStep.DEMOGRAPHICS:
      return <DemographicsForm />;
    case RecipeStep.CAUSES:
      return <CausesSelection />;
    case RecipeStep.SYMPTOMS:
      return <SymptomsSelection />;
    case RecipeStep.PROPERTIES:
      return <PropertiesDisplay />;
    case RecipeStep.OILS:
      return <OilsDisplay />;
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
  const { stepInfo, goToNext, goToPrevious, canGoNext, canGoPrevious, getCompletionPercentage } = useRecipeNavigation();
  const { currentStep: storeCurrentStep, setCurrentStep, isLoading, error, resetWizard } = useRecipeStore();

  // Use prop or store current step
  const activeStep = currentStep || storeCurrentStep;

  // Sync URL step with store state
  useEffect(() => {
    if (currentStep && currentStep !== stepInfo.current.key) {
      setCurrentStep(currentStep);
    }
  }, [currentStep, stepInfo.current.key, setCurrentStep]);

  // Progress indicator
  const progressPercentage = getCompletionPercentage();

  // Select layout component based on layout prop
  const LayoutComponent = layout === 'dashboard'
    ? DashboardLayout
    : layout === 'standalone'
    ? ({ children }: { children: React.ReactNode }) => <div className={className}>{children}</div>
    : MobileLayout;

  return (
    <RecipeErrorBoundary>
      <LayoutComponent
        showBreadcrumbs={showBreadcrumbs}
        showProgress={showProgress}
        className={className}
      >
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
            <StepRenderer step={activeStep} />
          </div>
        </div>
      </LayoutComponent>
    </RecipeErrorBoundary>
  );
}

// Export both names for compatibility
export { WizardContainer as RecipeWizardContainer };
