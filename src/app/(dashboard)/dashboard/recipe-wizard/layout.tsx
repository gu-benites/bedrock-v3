/**
 * @fileoverview Layout for the Recipe Wizard feature.
 * Provides consistent layout and navigation for all recipe wizard steps.
 */

import React from 'react';
import { Metadata } from 'next';
import { ResetWizardButton } from '@/features/recipe-wizard/components/reset-wizard-button';

/**
 * Metadata for all recipe wizard pages
 */
export const metadata: Metadata = {
  title: 'Recipe Wizard - AromaRx',
  description: 'Create your personalized essential oil recipe with AI-powered recommendations based on your health concerns and demographics.',
  keywords: ['essential oils', 'recipe wizard', 'aromatherapy', 'AI recommendations', 'personalized wellness'],
  robots: 'noindex, nofollow' // Keep private for authenticated users
};

/**
 * Recipe Wizard Header Component
 * Provides header with title and reset button
 */
function RecipeWizardHeader() {
  return (
    <div className="flex items-center justify-between mb-6 pb-4 border-b">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Recipe Wizard</h1>
        <p className="text-sm text-muted-foreground">
          Create your personalized essential oil recipe with AI recommendations
        </p>
      </div>
      <div className="flex items-center gap-2">
        <ResetWizardButton
          variant="outline"
          size="sm"
          className="text-muted-foreground hover:text-foreground"
        />
      </div>
    </div>
  );
}

/**
 * Recipe Wizard Layout Component
 * Provides consistent structure for all wizard steps
 */
export default function RecipeWizardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="recipe-wizard-layout">
      {/* Main content area */}
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-6 max-w-2xl">
          <RecipeWizardHeader />
          {children}
        </div>
      </main>
    </div>
  );
}
