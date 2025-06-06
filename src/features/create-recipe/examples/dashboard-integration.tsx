/**
 * @fileoverview Example implementations for integrating Recipe Creator into dashboard layouts.
 * Shows different integration patterns and usage examples.
 */

'use client';

import React from 'react';
import { WizardContainer } from '../components/wizard-container';
import { useDashboardIntegration } from '../components/dashboard-layout';

/**
 * Example 1: Full Dashboard Integration
 * Complete integration with dashboard layout, sidebar, and progress tracking
 */
export function DashboardRecipeCreator() {
  return (
    <WizardContainer 
      layout="dashboard"
      showBreadcrumbs={true}
      showProgress={true}
    />
  );
}

/**
 * Example 2: Minimal Dashboard Integration
 * Simplified version without progress sidebar for smaller screens
 */
export function MinimalDashboardRecipeCreator() {
  return (
    <WizardContainer 
      layout="dashboard"
      showBreadcrumbs={true}
      showProgress={false}
      className="max-w-4xl mx-auto"
    />
  );
}

/**
 * Example 3: Modal Integration
 * Recipe creator in a modal dialog within dashboard
 */
export function ModalRecipeCreator({ 
  isOpen, 
  onClose 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-6xl translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg">
        {/* Modal Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Create Essential Oil Recipe</h2>
          <button
            onClick={onClose}
            className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Content */}
        <div className="max-h-[80vh] overflow-y-auto">
          <WizardContainer 
            layout="standalone"
            showBreadcrumbs={true}
            showProgress={false}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Example 4: Sidebar Integration
 * Recipe creator in a collapsible sidebar
 */
export function SidebarRecipeCreator({ 
  isOpen, 
  onToggle 
}: { 
  isOpen: boolean; 
  onToggle: () => void; 
}) {
  return (
    <div className={`
      fixed right-0 top-0 h-full bg-background border-l shadow-lg transition-transform duration-300 z-40
      ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      w-full max-w-2xl
    `}>
      {/* Sidebar Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">Recipe Creator</h2>
        <button
          onClick={onToggle}
          className="p-2 rounded-md hover:bg-muted transition-colors"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Sidebar Content */}
      <div className="h-full overflow-y-auto p-4">
        <WizardContainer 
          layout="standalone"
          showBreadcrumbs={false}
          showProgress={true}
        />
      </div>
    </div>
  );
}

/**
 * Example 5: Tab Integration
 * Recipe creator as a tab within dashboard
 */
export function TabbedRecipeCreator() {
  const [activeTab, setActiveTab] = React.useState('create');

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-border">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'create', label: 'Create Recipe', icon: '🌿' },
            { id: 'history', label: 'Recipe History', icon: '📋' },
            { id: 'favorites', label: 'Favorites', icon: '⭐' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === tab.id 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
                }
              `}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[600px]">
        {activeTab === 'create' && (
          <WizardContainer 
            layout="standalone"
            showBreadcrumbs={true}
            showProgress={true}
          />
        )}
        {activeTab === 'history' && (
          <div className="text-center py-12 text-muted-foreground">
            Recipe history will be displayed here
          </div>
        )}
        {activeTab === 'favorites' && (
          <div className="text-center py-12 text-muted-foreground">
            Favorite recipes will be displayed here
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Example 6: Dashboard Widget
 * Compact recipe creator widget for dashboard overview
 */
export function RecipeCreatorWidget() {
  const { completionPercentage, currentStep } = useDashboardIntegration();
  const [isExpanded, setIsExpanded] = React.useState(false);

  if (isExpanded) {
    return (
      <div className="bg-card rounded-lg border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Recipe Creator</h3>
          <button
            onClick={() => setIsExpanded(false)}
            className="text-muted-foreground hover:text-foreground"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
        </div>
        
        <WizardContainer 
          layout="standalone"
          showBreadcrumbs={false}
          showProgress={false}
          className="max-h-96 overflow-y-auto"
        />
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Recipe Creator</h3>
        <button
          onClick={() => setIsExpanded(true)}
          className="text-muted-foreground hover:text-foreground"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {completionPercentage > 0 ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{completionPercentage}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Continue your recipe creation
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Create personalized essential oil recommendations
          </p>
          <button className="w-full bg-primary text-primary-foreground rounded-md py-2 text-sm font-medium hover:bg-primary/90 transition-colors">
            Start New Recipe
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Example 7: Custom Layout Integration
 * Shows how to create completely custom layouts
 */
export function CustomLayoutRecipeCreator() {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 h-screen">
      {/* Left Sidebar - Navigation */}
      <div className="xl:col-span-1 bg-card border-r p-4">
        <h3 className="font-semibold mb-4">Quick Navigation</h3>
        {/* Custom navigation content */}
      </div>

      {/* Main Content - Recipe Creator */}
      <div className="xl:col-span-3 overflow-y-auto">
        <WizardContainer 
          layout="standalone"
          showBreadcrumbs={true}
          showProgress={false}
          className="p-6"
        />
      </div>

      {/* Right Sidebar - Additional Info */}
      <div className="xl:col-span-1 bg-card border-l p-4">
        <h3 className="font-semibold mb-4">Tips & Info</h3>
        {/* Additional content */}
      </div>
    </div>
  );
}

/**
 * Usage Examples in Different Dashboard Contexts
 */
export const INTEGRATION_EXAMPLES = {
  // Full page integration
  fullPage: () => <DashboardRecipeCreator />,
  
  // Modal integration
  modal: (props: { isOpen: boolean; onClose: () => void }) => <ModalRecipeCreator {...props} />,
  
  // Sidebar integration
  sidebar: (props: { isOpen: boolean; onToggle: () => void }) => <SidebarRecipeCreator {...props} />,
  
  // Tab integration
  tabbed: () => <TabbedRecipeCreator />,
  
  // Widget integration
  widget: () => <RecipeCreatorWidget />,
  
  // Custom layout
  custom: () => <CustomLayoutRecipeCreator />
};

export default DashboardRecipeCreator;
