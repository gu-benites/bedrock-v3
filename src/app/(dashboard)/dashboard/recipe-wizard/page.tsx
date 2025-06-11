/**
 * @fileoverview Recipe Wizard landing page that redirects to the first step.
 * Handles the base /dashboard/recipe-wizard route by redirecting to health-concern step.
 */

import { redirect } from 'next/navigation';
import { RecipeWizardStep } from '@/features/recipe-wizard/types/recipe-wizard.types';

/**
 * Recipe Wizard landing page
 * Automatically redirects to the first step of the wizard
 */
export default function RecipeWizardPage() {
  // Redirect to the first step of the recipe wizard
  redirect(`/dashboard/recipe-wizard/${RecipeWizardStep.HEALTH_CONCERN}`);
}

/**
 * Metadata for the recipe wizard landing page
 */
export const metadata = {
  title: 'Recipe Wizard - AromaRx',
  description: 'Create your personalized essential oil recipe with AI-powered recommendations',
  robots: 'noindex, nofollow' // Prevent indexing since this redirects
};
