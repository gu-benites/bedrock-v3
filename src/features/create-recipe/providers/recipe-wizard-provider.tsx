/**
 * @fileoverview Provider component for Essential Oil Recipe Creator wizard.
 * Combines authentication guard with wizard state management.
 */

'use client';

import { AuthGuard } from '../components/auth-guard';

/**
 * Props for the RecipeWizardProvider
 */
interface RecipeWizardProviderProps {
  children: React.ReactNode;
}

/**
 * Provider component that wraps the recipe wizard with authentication
 * and any other necessary providers
 */
export function RecipeWizardProvider({ children }: RecipeWizardProviderProps) {
  return (
    <AuthGuard 
      redirectTo="/dashboard/create-recipe/health-concern"
      requireProfile={false}
    >
      {children}
    </AuthGuard>
  );
}
