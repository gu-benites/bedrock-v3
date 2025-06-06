/**
 * @fileoverview Wizard layout component with progress indicator for Essential Oil Recipe Creator.
 * Provides consistent layout structure and navigation for all wizard steps.
 */

'use client';

import { useRecipeNavigation } from '../hooks/use-recipe-navigation';
import { useRecipeStore } from '../store/recipe-store';
import { WIZARD_STEPS } from '../constants/recipe.constants';
import { RecipeStep } from '../types/recipe.types';
import { cn } from '@/lib/utils';

/**
 * Props for the WizardLayout component
 */
interface WizardLayoutProps {
  children: React.ReactNode;
  currentStep: RecipeStep;
  showNavigation?: boolean;
  className?: string;
}

/**
 * Progress indicator component
 */
function ProgressIndicator({ currentStep }: { currentStep: RecipeStep }) {
  const { stepInfo, isStepCompleted, canNavigateToStep } = useRecipeNavigation();
  const { completedSteps } = useRecipeStore();
  
  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-foreground">
            {stepInfo.current.title}
          </h1>
          <span className="text-sm text-muted-foreground">
            Step {stepInfo.progress} of {WIZARD_STEPS.length}
          </span>
        </div>
        
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-500 ease-in-out"
            style={{ width: `${(stepInfo.progress / WIZARD_STEPS.length) * 100}%` }}
          />
        </div>
        
        <p className="text-muted-foreground">
          {stepInfo.current.description}
        </p>
      </div>

      {/* Step indicators */}
      <div className="hidden sm:flex justify-between items-center">
        {WIZARD_STEPS.map((step, index) => {
          const isCompleted = isStepCompleted(step.key);
          const isCurrent = step.key === currentStep;
          const isAccessible = canNavigateToStep(step.key);
          
          return (
            <div
              key={step.key}
              className={cn(
                "flex flex-col items-center space-y-1 flex-1",
                index < WIZARD_STEPS.length - 1 && "relative"
              )}
            >
              {/* Step circle */}
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200",
                  {
                    "bg-primary text-primary-foreground": isCurrent,
                    "bg-primary/20 text-primary": isCompleted && !isCurrent,
                    "bg-muted text-muted-foreground": !isCompleted && !isCurrent && isAccessible,
                    "bg-muted/50 text-muted-foreground/50": !isAccessible
                  }
                )}
              >
                {isCompleted ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  step.stepNumber
                )}
              </div>
              
              {/* Step label */}
              <span
                className={cn(
                  "text-xs text-center max-w-16 leading-tight",
                  {
                    "text-foreground font-medium": isCurrent,
                    "text-muted-foreground": !isCurrent && isAccessible,
                    "text-muted-foreground/50": !isAccessible
                  }
                )}
              >
                {step.title}
              </span>
              
              {/* Connector line */}
              {index < WIZARD_STEPS.length - 1 && (
                <div
                  className={cn(
                    "absolute top-4 left-1/2 w-full h-0.5 -translate-y-1/2 translate-x-4",
                    {
                      "bg-primary": isCompleted,
                      "bg-muted": !isCompleted
                    }
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile step indicator */}
      <div className="sm:hidden flex items-center justify-center space-x-2">
        {WIZARD_STEPS.map((step, index) => {
          const isCompleted = isStepCompleted(step.key);
          const isCurrent = step.key === currentStep;
          
          return (
            <div
              key={step.key}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-200",
                {
                  "bg-primary w-6": isCurrent,
                  "bg-primary/60": isCompleted && !isCurrent,
                  "bg-muted": !isCompleted && !isCurrent
                }
              )}
            />
          );
        })}
      </div>
    </div>
  );
}

/**
 * Navigation buttons component
 */
function NavigationButtons() {
  const { stepInfo, goToPrevious, goToNext, canGoPrevious, canGoNext, isNavigating } = useRecipeNavigation();
  
  return (
    <div className="flex justify-between items-center pt-6 border-t">
      <div>
        {canGoPrevious() && (
          <button
            onClick={goToPrevious}
            disabled={isNavigating}
            className={cn(
              "inline-flex items-center px-4 py-2 rounded-md transition-colors",
              "bg-secondary text-secondary-foreground hover:bg-secondary/90",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </button>
        )}
      </div>
      
      <div className="flex items-center space-x-3">
        {/* Step completion indicator */}
        <span className="text-sm text-muted-foreground">
          {stepInfo.progress} of {WIZARD_STEPS.length} completed
        </span>
        
        {canGoNext() && (
          <button
            onClick={goToNext}
            disabled={isNavigating}
            className={cn(
              "inline-flex items-center px-4 py-2 rounded-md transition-colors",
              "bg-primary text-primary-foreground hover:bg-primary/90",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {stepInfo.isLast ? 'Complete' : 'Next'}
            {!stepInfo.isLast && (
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Main wizard layout component
 */
export function WizardLayout({ 
  children, 
  currentStep, 
  showNavigation = true,
  className 
}: WizardLayoutProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Progress indicator */}
      <ProgressIndicator currentStep={currentStep} />
      
      {/* Main content area */}
      <div className="min-h-[500px]">
        {children}
      </div>
      
      {/* Navigation */}
      {showNavigation && <NavigationButtons />}
    </div>
  );
}

/**
 * Simplified wizard layout for specific use cases
 */
export function SimpleWizardLayout({ children, title, description }: {
  children: React.ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        {description && (
          <p className="text-muted-foreground">{description}</p>
        )}
      </div>
      
      <div className="min-h-[400px]">
        {children}
      </div>
    </div>
  );
}
