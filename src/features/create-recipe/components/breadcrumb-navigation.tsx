/**
 * @fileoverview Breadcrumb navigation component for Essential Oil Recipe Creator.
 * Provides hierarchical navigation and step completion tracking.
 */

'use client';

import React from 'react';
import { useRecipeWizardNavigation } from '../hooks/use-recipe-navigation';
import { useRecipeStore } from '../store/recipe-store';
import { WIZARD_STEPS } from '../constants/recipe.constants';
import { RecipeStep } from '../types/recipe.types';
import { cn } from '@/lib/utils';

/**
 * Props for the BreadcrumbNavigation component
 */
interface BreadcrumbNavigationProps {
  currentStep: RecipeStep;
  showStepNumbers?: boolean;
  showCompletionStatus?: boolean;
  allowNavigation?: boolean;
  className?: string;
}

/**
 * Individual breadcrumb item component
 * Memoized to prevent unnecessary re-renders when props haven't changed
 */
const BreadcrumbItem = React.memo(({
  step,
  isActive,
  isCompleted,
  isAccessible,
  showStepNumber,
  allowNavigation,
  onClick
}: {
  step: typeof WIZARD_STEPS[0];
  isActive: boolean;
  isCompleted: boolean;
  isAccessible: boolean;
  showStepNumber: boolean;
  allowNavigation: boolean;
  onClick?: () => void;
}) => {
  const baseClasses = "flex items-center space-x-2 px-3 py-2 rounded-md transition-all duration-200";
  const interactiveClasses = allowNavigation && isAccessible 
    ? "cursor-pointer hover:bg-muted/50" 
    : "cursor-default";
  
  const textClasses = cn({
    "text-primary font-medium": isActive,
    "text-foreground": isCompleted && !isActive,
    "text-muted-foreground": !isCompleted && !isActive && isAccessible,
    "text-muted-foreground/50": !isAccessible
  });

  const content = (
    <div className={cn(baseClasses, interactiveClasses, textClasses)}>
      {/* Step indicator */}
      <div
        className={cn(
          "flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium transition-all duration-200",
          {
            "bg-primary text-primary-foreground": isActive,
            "bg-primary/20 text-primary": isCompleted && !isActive,
            "bg-muted text-muted-foreground": !isCompleted && !isActive && isAccessible,
            "bg-muted/50 text-muted-foreground/50": !isAccessible
          }
        )}
      >
        {isCompleted && !isActive ? (
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        ) : showStepNumber ? (
          step.stepNumber
        ) : (
          <div className="w-2 h-2 rounded-full bg-current" />
        )}
      </div>

      {/* Step title */}
      <span className="text-sm font-medium">{step.title}</span>

      {/* Completion indicator */}
      {isCompleted && (
        <div className="flex items-center">
          <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      )}
    </div>
  );

  if (allowNavigation && isAccessible && onClick) {
    return (
      <button
        onClick={onClick}
        className="text-left focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md"
        aria-label={`Navigate to ${step.title}`}
      >
        {content}
      </button>
    );
  }

  return content;
});

/**
 * Breadcrumb separator component
 * Memoized since it's a pure component with no props
 */
const BreadcrumbSeparator = React.memo(() => {
  return (
    <div className="flex items-center px-2">
      <svg
        className="w-4 h-4 text-muted-foreground/50"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </div>
  );
});

/**
 * Main breadcrumb navigation component
 */
export function BreadcrumbNavigation({
  currentStep,
  showStepNumbers = true,
  showCompletionStatus = true,
  allowNavigation = true,
  className
}: BreadcrumbNavigationProps) {
  const { goToStep, canNavigateToStep, isStepCompleted } = useRecipeWizardNavigation();
  const { completedSteps } = useRecipeStore();

  const handleStepClick = async (step: RecipeStep) => {
    if (allowNavigation && canNavigateToStep(step)) {
      await goToStep(step);
    }
  };

  return (
    <nav
      className={cn("flex items-center space-x-1 overflow-x-auto pb-2", className)}
      aria-label="Recipe creation progress"
    >
      {WIZARD_STEPS.map((step, index) => {
        const isActive = step.key === currentStep;
        const isCompleted = isStepCompleted(step.key);
        const isAccessible = canNavigateToStep(step.key);

        return (
          <div key={step.key} className="flex items-center flex-shrink-0">
            <BreadcrumbItem
              step={step}
              isActive={isActive}
              isCompleted={isCompleted}
              isAccessible={isAccessible}
              showStepNumber={showStepNumbers}
              allowNavigation={allowNavigation}
              onClick={() => handleStepClick(step.key)}
            />
            
            {index < WIZARD_STEPS.length - 1 && <BreadcrumbSeparator />}
          </div>
        );
      })}
    </nav>
  );
}

/**
 * Compact breadcrumb navigation for mobile
 */
export function CompactBreadcrumbNavigation({
  currentStep,
  className
}: {
  currentStep: RecipeStep;
  className?: string;
}) {
  const { stepInfo, goToPrevious, goToNext, canGoPrevious, canGoNext } = useRecipeWizardNavigation();

  return (
    <nav
      className={cn("flex items-center justify-between", className)}
      aria-label="Recipe creation navigation"
    >
      {/* Previous step */}
      <div className="flex items-center">
        {canGoPrevious() && stepInfo.previous && (
          <button
            onClick={goToPrevious}
            className="flex items-center space-x-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>{stepInfo.previous.title}</span>
          </button>
        )}
      </div>

      {/* Current step */}
      <div className="flex items-center space-x-2 px-4 py-2 bg-primary/10 rounded-md">
        <div className="w-2 h-2 bg-primary rounded-full" />
        <span className="text-sm font-medium text-primary">
          {stepInfo.current.title}
        </span>
        <span className="text-xs text-muted-foreground">
          ({stepInfo.progress}/{WIZARD_STEPS.length})
        </span>
      </div>

      {/* Next step */}
      <div className="flex items-center">
        {canGoNext() && stepInfo.next && (
          <button
            onClick={goToNext}
            className="flex items-center space-x-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <span>{stepInfo.next.title}</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>
    </nav>
  );
}

/**
 * Step completion summary component
 */
export function StepCompletionSummary({ className }: { className?: string }) {
  const { getCompletionPercentage } = useRecipeWizardNavigation();
  const { completedSteps } = useRecipeStore();
  
  const completionPercentage = getCompletionPercentage();
  const completedCount = completedSteps.length;
  const totalSteps = WIZARD_STEPS.length;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-foreground">
          Progress
        </span>
        <span className="text-sm text-muted-foreground">
          {completedCount} of {totalSteps} completed
        </span>
      </div>
      
      <div className="w-full bg-muted rounded-full h-2">
        <div
          className="bg-primary h-2 rounded-full transition-all duration-500 ease-in-out"
          style={{ width: `${completionPercentage}%` }}
        />
      </div>
      
      <div className="text-xs text-muted-foreground text-center">
        {completionPercentage}% complete
      </div>
    </div>
  );
}

/**
 * Hook for tracking step completion analytics
 */
export function useStepCompletionTracking() {
  const { completedSteps, currentStep } = useRecipeStore();
  const { stepInfo, getCompletionPercentage } = useRecipeWizardNavigation();

  const getStepAnalytics = () => {
    return {
      currentStep,
      currentStepNumber: stepInfo.progress,
      completedSteps: completedSteps.length,
      totalSteps: WIZARD_STEPS.length,
      completionPercentage: getCompletionPercentage(),
      remainingSteps: WIZARD_STEPS.length - completedSteps.length,
      isFirstStep: stepInfo.isFirst,
      isLastStep: stepInfo.isLast
    };
  };

  const trackStepCompletion = (step: RecipeStep) => {
    // This could be extended to send analytics events
    console.log(`Step completed: ${step}`, getStepAnalytics());
  };

  const trackStepNavigation = (fromStep: RecipeStep, toStep: RecipeStep) => {
    // This could be extended to send analytics events
    console.log(`Navigation: ${fromStep} -> ${toStep}`, getStepAnalytics());
  };

  return {
    getStepAnalytics,
    trackStepCompletion,
    trackStepNavigation
  };
}
