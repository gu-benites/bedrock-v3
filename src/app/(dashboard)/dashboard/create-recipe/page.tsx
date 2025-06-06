/**
 * @fileoverview Recipe Creator landing page that redirects to the first step.
 * Handles the base /dashboard/create-recipe route by redirecting to health-concern step.
 */

import { redirect } from 'next/navigation';
import { DEFAULT_STEP } from '@/features/create-recipe/constants/recipe.constants';

/**
 * Recipe Creator landing page
 * Automatically redirects to the first step of the wizard
 */
export default function CreateRecipePage() {
  // Redirect to the first step of the recipe creation wizard
  redirect(`/dashboard/create-recipe/${DEFAULT_STEP}`);
}

/**
 * Metadata for the recipe creator landing page
 */
export const metadata = {
  title: 'Create Recipe - AromaRx',
  description: 'Create your personalized essential oil recipe',
  robots: 'noindex, nofollow' // Prevent indexing since this redirects
};
