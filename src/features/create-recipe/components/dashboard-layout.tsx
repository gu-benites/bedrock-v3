/**
 * @fileoverview Dashboard layout variant for Essential Oil Recipe Creator.
 * Integrates the wizard into the dashboard's shared layout system.
 */

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useRecipeWizardNavigation } from '../hooks/use-recipe-navigation';
import { useRecipeStore } from '../store/recipe-store';
import { BreadcrumbNavigation } from './breadcrumb-navigation';
import { cn } from '@/lib/utils';

/**
 * Dashboard layout props
 */
interface DashboardLayoutProps {
  children: React.ReactNode;
  showBreadcrumbs?: boolean;
  showProgress?: boolean;
  className?: string;
}

/**
 * Dashboard progress sidebar component
 */
function DashboardProgressSidebar() {
  const router = useRouter();
  const { stepInfo, getCompletionPercentage } = useRecipeWizardNavigation();
  const { currentStep, completedSteps, resetWizard, sessionId } = useRecipeStore();

  const completionPercentage = getCompletionPercentage();

  /**
   * Handle starting a new recipe
   */
  const handleStartNewRecipe = () => {
    resetWizard();
    router.push('/dashboard/create-recipe/health-concern');
  };

  return (
    <div className="bg-card rounded-lg border p-4 space-y-4">
      {/* Progress Header */}
      <div className="space-y-2">
        <h3 className="font-semibold text-foreground">Recipe Progress</h3>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Step {stepInfo.progress} of 6</span>
          <span>{completionPercentage}%</span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-500 ease-in-out"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Step List */}
      <div className="space-y-2">
        {[
          { key: 'health-concern', title: 'Health Concern', step: 1 },
          { key: 'demographics', title: 'Demographics', step: 2 },
          { key: 'causes', title: 'Potential Causes', step: 3 },
          { key: 'symptoms', title: 'Symptoms', step: 4 },
          { key: 'properties', title: 'Properties', step: 5 },
          { key: 'oils', title: 'Essential Oils', step: 6 }
        ].map((item) => {
          const isActive = currentStep === item.key;
          const isCompleted = completedSteps.includes(item.key as any);
          
          return (
            <div
              key={item.key}
              className={cn(
                "flex items-center space-x-3 p-2 rounded-md text-sm transition-colors",
                isActive && "bg-primary/10 text-primary",
                isCompleted && !isActive && "text-muted-foreground",
                !isActive && !isCompleted && "text-muted-foreground/60"
              )}
            >
              {/* Step Number/Status */}
              <div className={cn(
                "flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium transition-colors",
                isActive && "bg-primary text-primary-foreground",
                isCompleted && !isActive && "bg-green-100 text-green-600",
                !isActive && !isCompleted && "bg-muted text-muted-foreground"
              )}>
                {isCompleted && !isActive ? (
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  item.step
                )}
              </div>
              
              {/* Step Title */}
              <span className="font-medium">{item.title}</span>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="pt-2 border-t space-y-2">
        <button className="w-full text-left text-sm text-muted-foreground hover:text-foreground transition-colors">
          💾 Save Progress
        </button>
        <button className="w-full text-left text-sm text-muted-foreground hover:text-foreground transition-colors">
          📋 View Previous Recipes
        </button>
        <button
          onClick={handleStartNewRecipe}
          className="w-full text-left text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          🔄 Start New Recipe
        </button>
      </div>
    </div>
  );
}

/**
 * Dashboard header component
 */
function DashboardHeader() {
  const { stepInfo } = useRecipeWizardNavigation();

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Create Essential Oil Recipe
          </h1>
          <p className="text-muted-foreground">
            Get personalized essential oil recommendations for your health concerns
          </p>
        </div>
        
        {/* Current Step Badge */}
        <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
          {stepInfo.current.title}
        </div>
      </div>

      {/* Breadcrumb Navigation */}
      <BreadcrumbNavigation
        currentStep={stepInfo.current.key}
        showStepNumbers={true}
        showCompletionStatus={true}
        allowNavigation={true}
        className="bg-muted/30 rounded-lg p-3"
      />
    </div>
  );
}

/**
 * Dashboard layout component for recipe wizard
 */
export function DashboardLayout({
  children,
  showBreadcrumbs = true,
  showProgress = true,
  className
}: DashboardLayoutProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Dashboard Header */}
      <DashboardHeader />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3">
          <div className="bg-card rounded-lg border p-6">
            {children}
          </div>
        </div>

        {/* Progress Sidebar */}
        {showProgress && (
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <DashboardProgressSidebar />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Hook for dashboard-specific features
 */
export function useDashboardIntegration() {
  const { currentStep, completedSteps } = useRecipeStore();
  const { getCompletionPercentage } = useRecipeWizardNavigation();

  // Dashboard-specific functionality
  const saveToFavorites = () => {
    // Implementation for saving recipe to user favorites
  };

  const shareRecipe = () => {
    // Implementation for sharing recipe
  };

  const exportRecipe = () => {
    // Implementation for exporting recipe as PDF
  };

  return {
    currentStep,
    completedSteps,
    completionPercentage: getCompletionPercentage(),
    saveToFavorites,
    shareRecipe,
    exportRecipe
  };
}

export default DashboardLayout;
