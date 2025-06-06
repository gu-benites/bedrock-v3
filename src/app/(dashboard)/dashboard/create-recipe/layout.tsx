/**
 * @fileoverview Layout wrapper for Essential Oil Recipe Creator pages.
 * Provides consistent layout and navigation for the recipe wizard.
 */

import { Metadata } from 'next';
import { Suspense } from 'react';
import { RecipeWizardProvider } from '@/features/create-recipe/providers/recipe-wizard-provider';
import { getServerLogger } from '@/lib/logger';

const logger = getServerLogger();

/**
 * Metadata for the recipe creator section
 */
export const metadata: Metadata = {
  title: {
    template: '%s | Recipe Creator | AromaChat',
    default: 'Recipe Creator | AromaChat'
  },
  description: 'Create personalized essential oil recipes based on your health concerns and preferences.',
  keywords: ['essential oils', 'aromatherapy', 'recipe creator', 'natural health', 'wellness'],
  robots: 'noindex, nofollow', // Prevent indexing of wizard pages
  openGraph: {
    title: 'Essential Oil Recipe Creator',
    description: 'Create personalized essential oil recipes based on your health concerns.',
    type: 'website',
  }
};

/**
 * Props for the recipe creator layout
 */
interface RecipeCreatorLayoutProps {
  children: React.ReactNode;
}

/**
 * Loading component for the recipe creator layout
 */
function RecipeCreatorLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Main content skeleton - no header skeleton needed */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-6">
            <div className="h-12 bg-muted rounded animate-pulse" />
            <div className="bg-card rounded-lg border p-6">
              <div className="space-y-4">
                <div className="h-6 bg-muted rounded animate-pulse w-3/4" />
                <div className="h-4 bg-muted rounded animate-pulse" />
                <div className="h-4 bg-muted rounded animate-pulse w-5/6" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Layout component for recipe creator pages
 */
export default function RecipeCreatorLayout({ children }: RecipeCreatorLayoutProps) {
  try {
    logger.info('Rendering recipe creator layout', {
      operation: 'RecipeCreatorLayout'
    });
    
    return (
      <div className="min-h-screen bg-background">
        {/* Main content area - no header needed as dashboard layout provides its own */}
        <main className="flex-1">
          <Suspense fallback={<RecipeCreatorLoading />}>
            <RecipeWizardProvider>
              {children}
            </RecipeWizardProvider>
          </Suspense>
        </main>
        
        {/* Footer */}
        <footer className="border-t bg-card/30 mt-auto">
          <div className="container mx-auto px-4 py-6">
            <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0">
              <div className="text-sm text-muted-foreground">
                Recipe Creator powered by AI aromatherapy expertise
              </div>
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <span>Need help?</span>
                <a 
                  href="/support" 
                  className="text-primary hover:text-primary/80 transition-colors"
                >
                  Contact Support
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    );
    
  } catch (error) {
    logger.error('Error rendering recipe creator layout', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      operation: 'RecipeCreatorLayout'
    });
    
    // Fallback layout on error
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">
            Recipe Creator
          </h1>
          <p className="text-muted-foreground">
            Loading your personalized recipe creator...
          </p>
          <div className="w-full max-w-md">
            {children}
          </div>
        </div>
      </div>
    );
  }
}
