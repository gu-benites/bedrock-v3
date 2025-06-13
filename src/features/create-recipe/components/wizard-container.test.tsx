/**
 * @fileoverview Unit tests for Essential Oil Recipe Creator wizard container component.
 * Tests component rendering, navigation integration, and step management.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WizardContainer } from './wizard-container';
import { useRecipeStore } from '../store/recipe-store';
import { useRecipeNavigation } from '../hooks/use-recipe-navigation';
import { RecipeStep } from '../types/recipe.types';

// Mock the store and navigation hook
jest.mock('../store/recipe-store');
jest.mock('../hooks/use-recipe-navigation');

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  })),
  usePathname: jest.fn(() => '/create-recipe'),
  useSearchParams: jest.fn(() => new URLSearchParams()),
}));

// Mock child components
jest.mock('./health-concern-form', () => ({
  HealthConcernForm: () => <div data-testid="health-concern-form">Health Concern Form</div>
}));

jest.mock('./demographics-form', () => ({
  DemographicsForm: () => <div data-testid="demographics-form">Demographics Form</div>
}));

jest.mock('./causes-selection', () => ({
  CausesSelection: () => <div data-testid="causes-selection">Causes Selection</div>
}));

jest.mock('./symptoms-selection', () => ({
  SymptomsSelection: () => <div data-testid="symptoms-selection">Symptoms Selection</div>
}));

jest.mock('./properties-display', () => ({
  PropertiesDisplay: () => <div data-testid="properties-display">Properties Display</div>
}));

jest.mock('./oils-display', () => ({
  OilsDisplay: () => <div data-testid="oils-display">Oils Display</div>
}));

describe('WizardContainer', () => {
  const mockStore = {
    currentStep: RecipeStep.HEALTH_CONCERN,
    completedSteps: [],
    isLoading: false,
    error: null,
    resetWizard: jest.fn(),
  };

  const mockNavigation = {
    stepInfo: {
      current: { key: RecipeStep.HEALTH_CONCERN, title: 'Health Concern', stepNumber: 1 },
      previous: null,
      next: { key: RecipeStep.DEMOGRAPHICS, title: 'Demographics', stepNumber: 2 },
      progress: 1,
      isFirst: true,
      isLast: false,
    },
    goToNext: jest.fn(),
    goToPrevious: jest.fn(),
    goToStep: jest.fn(),
    canGoNext: jest.fn(),
    canGoPrevious: jest.fn(),
    canNavigateToStep: jest.fn(),
    isStepCompleted: jest.fn(),
    markCurrentStepCompleted: jest.fn(),
    getCompletionPercentage: jest.fn(() => 0),
    getStepProgress: jest.fn(() => 1),
    getStepUrl: jest.fn(),
    isNavigating: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRecipeStore as jest.Mock).mockReturnValue(mockStore);
    (useRecipeNavigation as jest.Mock).mockReturnValue(mockNavigation);
  });

  describe('Rendering', () => {
    it('should render wizard container with current step', () => {
      render(<WizardContainer />);
      
      expect(screen.getByTestId('health-concern-form')).toBeInTheDocument();
      expect(screen.getByText('Health Concern Form')).toBeInTheDocument();
    });

    it('should render demographics form when on demographics step', () => {
      mockStore.currentStep = RecipeStep.DEMOGRAPHICS;
      mockNavigation.stepInfo.current = { 
        key: RecipeStep.DEMOGRAPHICS, 
        title: 'Demographics', 
        stepNumber: 2 
      };
      
      render(<WizardContainer />);
      
      expect(screen.getByTestId('demographics-form')).toBeInTheDocument();
    });

    it('should render causes selection when on causes step', () => {
      mockStore.currentStep = RecipeStep.CAUSES;
      mockNavigation.stepInfo.current = { 
        key: RecipeStep.CAUSES, 
        title: 'Potential Causes', 
        stepNumber: 3 
      };
      
      render(<WizardContainer />);
      
      expect(screen.getByTestId('causes-selection')).toBeInTheDocument();
    });

    it('should render symptoms selection when on symptoms step', () => {
      mockStore.currentStep = RecipeStep.SYMPTOMS;
      mockNavigation.stepInfo.current = { 
        key: RecipeStep.SYMPTOMS, 
        title: 'Symptoms', 
        stepNumber: 4 
      };
      
      render(<WizardContainer />);
      
      expect(screen.getByTestId('symptoms-selection')).toBeInTheDocument();
    });

    it('should render properties display when on properties step', () => {
      mockStore.currentStep = RecipeStep.PROPERTIES;
      mockNavigation.stepInfo.current = { 
        key: RecipeStep.PROPERTIES, 
        title: 'Therapeutic Properties', 
        stepNumber: 5 
      };
      
      render(<WizardContainer />);
      
      expect(screen.getByTestId('therapeutic-properties')).toBeInTheDocument();
    });

    it('should render oils display when on oils step', () => {
      mockStore.currentStep = RecipeStep.OILS;
      mockNavigation.stepInfo.current = { 
        key: RecipeStep.OILS, 
        title: 'Essential Oils', 
        stepNumber: 6 
      };
      
      render(<WizardContainer />);
      
      expect(screen.getByTestId('oils-display')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should show progress indicator', () => {
      mockNavigation.getCompletionPercentage.mockReturnValue(33);

      render(<WizardContainer />);

      // Should show progress text (mobile layout doesn't use progressbar role)
      expect(screen.getByText('33%')).toBeInTheDocument();
      expect(screen.getByText('Progress')).toBeInTheDocument();
    });

    it('should show navigation buttons', () => {
      mockNavigation.canGoPrevious.mockReturnValue(false);
      mockNavigation.canGoNext.mockReturnValue(true);

      render(<WizardContainer />);

      // Mobile layout shows both buttons but disables them based on navigation state
      expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /previous/i })).toBeDisabled();
    });

    it('should call goToNext when next button is clicked', async () => {
      mockNavigation.canGoNext.mockReturnValue(true);
      mockNavigation.goToNext.mockResolvedValue({ success: true });
      
      render(<WizardContainer />);
      
      const nextButton = screen.getByRole('button', { name: /next/i });
      fireEvent.click(nextButton);
      
      await waitFor(() => {
        expect(mockNavigation.goToNext).toHaveBeenCalled();
      });
    });

    it('should call goToPrevious when previous button is clicked', async () => {
      mockStore.currentStep = RecipeStep.DEMOGRAPHICS;
      mockNavigation.stepInfo.isFirst = false;
      mockNavigation.canGoPrevious.mockReturnValue(true);
      mockNavigation.goToPrevious.mockResolvedValue({ success: true });
      
      render(<WizardContainer />);
      
      const previousButton = screen.getByRole('button', { name: /previous/i });
      fireEvent.click(previousButton);
      
      await waitFor(() => {
        expect(mockNavigation.goToPrevious).toHaveBeenCalled();
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading indicator when loading', () => {
      mockStore.isLoading = true;

      render(<WizardContainer />);

      expect(screen.getByText(/loading/i)).toBeInTheDocument();
      expect(screen.getByText(/loading/i).closest('[role="status"]')).toBeInTheDocument();
    });

    it('should disable navigation when loading', () => {
      mockStore.isLoading = true;
      mockNavigation.isNavigating = true;
      
      render(<WizardContainer />);
      
      const nextButton = screen.queryByRole('button', { name: /next/i });
      if (nextButton) {
        expect(nextButton).toBeDisabled();
      }
    });
  });

  describe('Error Handling', () => {
    it('should show error message when error exists', () => {
      mockStore.error = 'Test error message';
      
      render(<WizardContainer />);
      
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Test error message')).toBeInTheDocument();
    });

    it('should provide retry functionality on error', () => {
      mockStore.error = 'Network error';
      
      render(<WizardContainer />);
      
      const retryButton = screen.getByRole('button', { name: /retry/i });
      fireEvent.click(retryButton);
      
      expect(mockStore.resetWizard).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<WizardContainer />);

      // The main element is now inside the mobile layout and doesn't have the aria-label
      expect(screen.getByRole('main')).toBeInTheDocument();
      // Check for the aria-label on the wizard div instead
      expect(screen.getByLabelText('Recipe creation wizard')).toBeInTheDocument();
    });

    it('should announce step changes to screen readers', () => {
      render(<WizardContainer />);
      
      expect(screen.getByRole('status', { name: /current step/i })).toBeInTheDocument();
    });

    it('should have proper heading hierarchy', () => {
      render(<WizardContainer />);
      
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });
  });
});
