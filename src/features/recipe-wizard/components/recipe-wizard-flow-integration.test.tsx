/**
 * @fileoverview Integration tests for complete Recipe Wizard flow
 * Tests the end-to-end user journey: Health Concern → Demographics → Potential Causes with AI integration
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HealthConcernForm } from './health-concern-form';
import { DemographicsForm } from './demographics-form';
import { PotentialCausesForm } from './potential-causes-form';
import { useRecipeWizardStore } from '../store/wizard-store';
import { RecipeWizardStep } from '../types/recipe-wizard.types';
import type { PotentialCause } from '../types/recipe-wizard.types';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  })),
  usePathname: jest.fn(() => '/dashboard/recipe-wizard/health-concern'),
  useSearchParams: jest.fn(() => new URLSearchParams()),
}));

// Mock the store
jest.mock('../store/wizard-store');
const mockUseRecipeWizardStore = useRecipeWizardStore as jest.MockedFunction<typeof useRecipeWizardStore>;

// Mock the AI service
jest.mock('../services/ai-service', () => ({
  fetchPotentialCauses: jest.fn(),
  AIServiceError: class AIServiceError extends Error {
    constructor(message: string, public code: string) {
      super(message);
      this.name = 'AIServiceError';
    }
  }
}));

import { fetchPotentialCauses } from '../services/ai-service';
const mockFetchPotentialCauses = fetchPotentialCauses as jest.MockedFunction<typeof fetchPotentialCauses>;

// Mock AI response data
const mockAIGeneratedCauses: PotentialCause[] = [
  {
    cause_id: 'stress_chronic_001',
    name_localized: 'Chronic Stress Response',
    suggestion_localized: 'Prolonged activation of stress response system affecting daily life',
    explanation_localized: 'Chronic stress affects the hypothalamic-pituitary-adrenal axis, contributing to anxiety symptoms and emotional dysregulation.'
  },
  {
    cause_id: 'sleep_disruption_002',
    name_localized: 'Sleep Pattern Disruption',
    suggestion_localized: 'Irregular sleep patterns affecting emotional regulation and stress recovery',
    explanation_localized: 'Sleep disruption affects neurotransmitter balance, particularly serotonin and GABA, impacting mood stability.'
  },
  {
    cause_id: 'lifestyle_imbalance_003',
    name_localized: 'Work-Life Balance Issues',
    suggestion_localized: 'Overwhelming responsibilities creating sustained pressure and anxiety',
    explanation_localized: 'Poor work-life balance leads to chronic cortisol elevation and reduced time for stress recovery activities.'
  }
];

// Mock store actions
const mockUpdateHealthConcern = jest.fn();
const mockUpdateDemographics = jest.fn();
const mockUpdateSelectedCauses = jest.fn();
const mockSetPotentialCauses = jest.fn();
const mockSetCurrentStep = jest.fn();
const mockMarkStepCompleted = jest.fn();
const mockSetLoading = jest.fn();
const mockSetError = jest.fn();
const mockClearError = jest.fn();
const mockClearStepsAfter = jest.fn();

// Store state progression through the flow
const initialStoreState = {
  healthConcern: null,
  demographics: null,
  selectedCauses: [],
  potentialCauses: [],
  currentStep: RecipeWizardStep.HEALTH_CONCERN,
  completedSteps: [],
  isLoading: false,
  error: null,
  updateHealthConcern: mockUpdateHealthConcern,
  updateDemographics: mockUpdateDemographics,
  updateSelectedCauses: mockUpdateSelectedCauses,
  setPotentialCauses: mockSetPotentialCauses,
  setCurrentStep: mockSetCurrentStep,
  markStepCompleted: mockMarkStepCompleted,
  setLoading: mockSetLoading,
  setError: mockSetError,
  clearError: mockClearError,
  clearStepsAfter: mockClearStepsAfter
};

const healthConcernCompletedState = {
  ...initialStoreState,
  healthConcern: { healthConcern: 'I have been experiencing chronic anxiety and stress that affects my daily life and sleep patterns.' },
  currentStep: RecipeWizardStep.DEMOGRAPHICS,
  completedSteps: [RecipeWizardStep.HEALTH_CONCERN]
};

const demographicsCompletedState = {
  ...healthConcernCompletedState,
  demographics: { gender: 'female', ageCategory: 'adult', specificAge: 30, language: 'EN_US' },
  currentStep: RecipeWizardStep.POTENTIAL_CAUSES,
  completedSteps: [RecipeWizardStep.HEALTH_CONCERN, RecipeWizardStep.DEMOGRAPHICS]
};

const potentialCausesCompletedState = {
  ...demographicsCompletedState,
  potentialCauses: mockAIGeneratedCauses,
  selectedCauses: [mockAIGeneratedCauses[0], mockAIGeneratedCauses[1]],
  completedSteps: [RecipeWizardStep.HEALTH_CONCERN, RecipeWizardStep.DEMOGRAPHICS, RecipeWizardStep.POTENTIAL_CAUSES]
};

describe('Recipe Wizard Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset all mock implementations
    mockFetchPotentialCauses.mockReset();
    mockUpdateHealthConcern.mockReset();
    mockUpdateDemographics.mockReset();
    mockUpdateSelectedCauses.mockReset();
    mockSetPotentialCauses.mockReset();
    mockSetCurrentStep.mockReset();
    mockMarkStepCompleted.mockReset();
    mockSetLoading.mockReset();
    mockSetError.mockReset();
    mockClearError.mockReset();
    mockClearStepsAfter.mockReset();
  });

  describe('Complete Happy Path Flow', () => {
    it('should complete the entire wizard flow from health concern to potential causes selection', async () => {
      const user = userEvent.setup();

      // Step 1: Health Concern Form
      mockUseRecipeWizardStore.mockReturnValue(initialStoreState as any);
      const { rerender } = render(<HealthConcernForm />);

      // Fill health concern
      const healthConcernInput = screen.getByRole('textbox', { name: /describe your health concern/i });
      await user.type(healthConcernInput, 'I have been experiencing chronic anxiety and stress that affects my daily life and sleep patterns.');

      // Submit health concern
      const healthConcernSubmit = screen.getByRole('button', { name: /continue to demographics/i });
      await user.click(healthConcernSubmit);

      expect(mockUpdateHealthConcern).toHaveBeenCalledWith({
        healthConcern: 'I have been experiencing chronic anxiety and stress that affects my daily life and sleep patterns.'
      });
      expect(mockMarkStepCompleted).toHaveBeenCalledWith(RecipeWizardStep.HEALTH_CONCERN);

      // Step 2: Demographics Form
      mockUseRecipeWizardStore.mockReturnValue(healthConcernCompletedState as any);
      rerender(<DemographicsForm />);

      // Fill demographics
      const genderSelect = screen.getByRole('combobox', { name: /gender/i });
      await user.selectOptions(genderSelect, 'female');

      const ageCategorySelect = screen.getByRole('combobox', { name: /age category/i });
      await user.selectOptions(ageCategorySelect, 'adult');

      const ageInput = screen.getByRole('spinbutton', { name: /specific age/i });
      await user.clear(ageInput);
      await user.type(ageInput, '30');

      const languageSelect = screen.getByRole('combobox', { name: /language/i });
      await user.selectOptions(languageSelect, 'EN_US');

      // Submit demographics
      const demographicsSubmit = screen.getByRole('button', { name: /continue to potential causes/i });
      await user.click(demographicsSubmit);

      expect(mockUpdateDemographics).toHaveBeenCalledWith({
        gender: 'female',
        ageCategory: 'adult',
        specificAge: 30,
        language: 'EN_US'
      });
      expect(mockMarkStepCompleted).toHaveBeenCalledWith(RecipeWizardStep.DEMOGRAPHICS);

      // Step 3: Potential Causes Form with AI Integration
      mockFetchPotentialCauses.mockResolvedValueOnce(mockAIGeneratedCauses);
      mockUseRecipeWizardStore.mockReturnValue({
        ...demographicsCompletedState,
        potentialCauses: [] // Empty to trigger AI fetch
      } as any);
      
      rerender(<PotentialCausesForm />);

      // Wait for AI service to be called
      await waitFor(() => {
        expect(mockFetchPotentialCauses).toHaveBeenCalledWith({
          healthConcern: 'I have been experiencing chronic anxiety and stress that affects my daily life and sleep patterns.',
          demographics: {
            gender: 'female',
            ageCategory: 'adult',
            specificAge: 30,
            language: 'EN_US'
          }
        });
      });

      // Verify AI response is processed
      expect(mockSetPotentialCauses).toHaveBeenCalledWith(mockAIGeneratedCauses);

      // Simulate store updated with AI causes
      mockUseRecipeWizardStore.mockReturnValue({
        ...demographicsCompletedState,
        potentialCauses: mockAIGeneratedCauses
      } as any);
      
      rerender(<PotentialCausesForm />);

      // Select potential causes
      const stressCause = screen.getByRole('button', { name: /chronic stress response/i });
      const sleepCause = screen.getByRole('button', { name: /sleep pattern disruption/i });
      
      await user.click(stressCause);
      await user.click(sleepCause);

      expect(mockUpdateSelectedCauses).toHaveBeenCalledWith([mockAIGeneratedCauses[0]]);
      expect(mockUpdateSelectedCauses).toHaveBeenCalledWith([mockAIGeneratedCauses[0], mockAIGeneratedCauses[1]]);

      // Submit potential causes
      const causesSubmit = screen.getByRole('button', { name: /continue/i });
      await user.click(causesSubmit);

      expect(mockMarkStepCompleted).toHaveBeenCalledWith(RecipeWizardStep.POTENTIAL_CAUSES);
    });
  });

  describe('Data Persistence and Flow Navigation', () => {
    it('should maintain data when navigating between completed steps', async () => {
      // Start from demographics step with health concern already completed
      mockUseRecipeWizardStore.mockReturnValue(healthConcernCompletedState as any);
      const { unmount } = render(<DemographicsForm />);

      // Verify health concern data is displayed in summary
      expect(screen.getAllByText(/chronic anxiety and stress/i)[0]).toBeInTheDocument();

      // Clean up before next render
      unmount();

      // Navigate to potential causes step
      mockUseRecipeWizardStore.mockReturnValue({
        ...demographicsCompletedState,
        potentialCauses: mockAIGeneratedCauses
      } as any);

      render(<PotentialCausesForm />);

      // Verify health concern data is preserved in potential causes
      expect(screen.getByText(/chronic anxiety and stress/i)).toBeInTheDocument();
    });

    it('should clear subsequent steps when navigating backwards and making changes', async () => {
      const user = userEvent.setup();

      // Start from potential causes step with all previous steps completed
      mockUseRecipeWizardStore.mockReturnValue(potentialCausesCompletedState as any);
      const { unmount } = render(<PotentialCausesForm />);
      unmount();

      // Simulate user navigating back to demographics and making changes
      // Set up state with completed potential causes step to trigger clearStepsAfter
      mockUseRecipeWizardStore.mockReturnValue({
        ...healthConcernCompletedState,
        completedSteps: [RecipeWizardStep.HEALTH_CONCERN, RecipeWizardStep.DEMOGRAPHICS, RecipeWizardStep.POTENTIAL_CAUSES]
      } as any);

      render(<DemographicsForm />);

      // Change age category (this should clear potential causes)
      const ageCategorySelect = screen.getByRole('combobox', { name: /age category/i });
      await user.selectOptions(ageCategorySelect, 'senior');

      // Verify clearStepsAfter is called to clear subsequent steps
      expect(mockClearStepsAfter).toHaveBeenCalledWith(RecipeWizardStep.DEMOGRAPHICS);
    });

    it('should preserve user selections when returning to previous steps without changes', async () => {
      // Start with all steps completed
      mockUseRecipeWizardStore.mockReturnValue(potentialCausesCompletedState as any);
      const { unmount } = render(<PotentialCausesForm />);

      // Verify selected causes are still selected
      const stressCause = screen.getByRole('button', { name: /chronic stress response/i });
      const sleepCause = screen.getByRole('button', { name: /sleep pattern disruption/i });

      expect(stressCause).toHaveClass('border-blue-500');
      expect(sleepCause).toHaveClass('border-blue-500');

      // Clean up before next render
      unmount();

      // Navigate back to demographics without changes
      mockUseRecipeWizardStore.mockReturnValue(potentialCausesCompletedState as any);
      render(<DemographicsForm />);

      // Verify demographics data is still populated (check form values)
      const genderSelect = screen.getByRole('combobox', { name: /gender/i }) as HTMLSelectElement;
      const ageCategorySelect = screen.getByRole('combobox', { name: /age category/i }) as HTMLSelectElement;
      const ageInput = screen.getByRole('spinbutton', { name: /specific age/i }) as HTMLInputElement;

      expect(genderSelect.value).toBe('female');
      expect(ageCategorySelect.value).toBe('adult');
      expect(ageInput.value).toBe('30');
    });
  });

  describe('AI Integration Points and Timing', () => {
    it('should trigger AI service only after demographics completion', async () => {
      const user = userEvent.setup();

      // Start at health concern - AI should not be called
      mockUseRecipeWizardStore.mockReturnValue(initialStoreState as any);
      render(<HealthConcernForm />);

      expect(mockFetchPotentialCauses).not.toHaveBeenCalled();

      // Move to demographics - AI should still not be called
      mockUseRecipeWizardStore.mockReturnValue(healthConcernCompletedState as any);
      render(<DemographicsForm />);

      expect(mockFetchPotentialCauses).not.toHaveBeenCalled();

      // Move to potential causes with empty causes - AI should be called
      mockFetchPotentialCauses.mockResolvedValueOnce(mockAIGeneratedCauses);
      mockUseRecipeWizardStore.mockReturnValue({
        ...demographicsCompletedState,
        potentialCauses: []
      } as any);

      render(<PotentialCausesForm />);

      await waitFor(() => {
        expect(mockFetchPotentialCauses).toHaveBeenCalledTimes(1);
      });
    });

    it('should not trigger AI service if potential causes already exist', async () => {
      // Start at potential causes step with existing causes
      mockUseRecipeWizardStore.mockReturnValue({
        ...demographicsCompletedState,
        potentialCauses: mockAIGeneratedCauses
      } as any);

      render(<PotentialCausesForm />);

      // AI service should not be called since causes already exist
      expect(mockFetchPotentialCauses).not.toHaveBeenCalled();
    });

    it('should re-trigger AI service when demographics change', async () => {
      const user = userEvent.setup();

      // Start with completed demographics and existing causes
      mockUseRecipeWizardStore.mockReturnValue({
        ...demographicsCompletedState,
        potentialCauses: mockAIGeneratedCauses,
        completedSteps: [RecipeWizardStep.HEALTH_CONCERN, RecipeWizardStep.DEMOGRAPHICS, RecipeWizardStep.POTENTIAL_CAUSES]
      } as any);

      const { unmount } = render(<DemographicsForm />);

      // Change demographics (age category)
      const ageCategorySelect = screen.getByRole('combobox', { name: /age category/i });
      await user.selectOptions(ageCategorySelect, 'senior');

      // Submit changes
      const submitButton = screen.getByRole('button', { name: /continue to potential causes/i });
      await user.click(submitButton);

      // Verify clearStepsAfter is called (which should clear potential causes)
      expect(mockClearStepsAfter).toHaveBeenCalledWith(RecipeWizardStep.DEMOGRAPHICS);

      unmount();

      // Navigate to potential causes with cleared causes
      mockFetchPotentialCauses.mockResolvedValueOnce(mockAIGeneratedCauses);
      mockUseRecipeWizardStore.mockReturnValue({
        ...demographicsCompletedState,
        demographics: { ...demographicsCompletedState.demographics, ageCategory: 'senior' },
        potentialCauses: [] // Cleared due to demographics change
      } as any);

      render(<PotentialCausesForm />);

      // AI service should be called again with new demographics
      await waitFor(() => {
        expect(mockFetchPotentialCauses).toHaveBeenCalledWith({
          healthConcern: 'I have been experiencing chronic anxiety and stress that affects my daily life and sleep patterns.',
          demographics: {
            gender: 'female',
            ageCategory: 'senior',
            specificAge: 30,
            language: 'EN_US'
          }
        });
      });
    });
  });

  describe('Error Recovery and Retry Mechanisms', () => {
    it('should handle AI service failures gracefully with retry option', async () => {
      const user = userEvent.setup();

      // Mock AI service failure
      mockFetchPotentialCauses.mockRejectedValueOnce(new Error('Network error'));

      mockUseRecipeWizardStore.mockReturnValue({
        ...demographicsCompletedState,
        potentialCauses: [],
        error: 'Failed to load potential causes. Please try again.'
      } as any);

      render(<PotentialCausesForm />);

      // Verify error message is displayed
      expect(screen.getByText(/failed to load potential causes/i)).toBeInTheDocument();

      // Verify retry button is available
      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toBeInTheDocument();

      // Click retry
      mockFetchPotentialCauses.mockResolvedValueOnce(mockAIGeneratedCauses);
      await user.click(retryButton);

      // Verify retry actions are called
      expect(mockClearError).toHaveBeenCalled();
    });

    it('should handle validation errors across the flow', async () => {
      const user = userEvent.setup();

      // Test health concern validation
      mockUseRecipeWizardStore.mockReturnValue(initialStoreState as any);
      const { unmount: unmountHealth } = render(<HealthConcernForm />);

      const healthConcernSubmit = screen.getByRole('button', { name: /continue to demographics/i });
      await user.click(healthConcernSubmit);

      expect(screen.getByText(/please describe your health concern/i)).toBeInTheDocument();
      unmountHealth();

      // Test demographics validation
      mockUseRecipeWizardStore.mockReturnValue(healthConcernCompletedState as any);
      const { unmount: unmountDemo } = render(<DemographicsForm />);

      const demographicsSubmit = screen.getByRole('button', { name: /continue to potential causes/i });
      await user.click(demographicsSubmit);

      expect(screen.getByText(/please select your gender/i)).toBeInTheDocument();
      unmountDemo();

      // Test potential causes validation
      mockUseRecipeWizardStore.mockReturnValue({
        ...demographicsCompletedState,
        potentialCauses: mockAIGeneratedCauses
      } as any);

      render(<PotentialCausesForm />);

      // Use more specific selector for potential causes continue button
      const causesSubmit = screen.getByRole('button', { name: /^continue$/i });
      await user.click(causesSubmit);

      expect(screen.getByText(/please select at least one potential cause/i)).toBeInTheDocument();
    });

    it('should recover from AI service errors and continue flow', async () => {
      const user = userEvent.setup();

      // Start with AI error state
      mockUseRecipeWizardStore.mockReturnValue({
        ...demographicsCompletedState,
        potentialCauses: [],
        error: 'Failed to load potential causes. Please try again.'
      } as any);

      render(<PotentialCausesForm />);

      // Retry and succeed
      mockFetchPotentialCauses.mockResolvedValueOnce(mockAIGeneratedCauses);
      const retryButton = screen.getByRole('button', { name: /retry/i });
      await user.click(retryButton);

      // Simulate successful retry
      mockUseRecipeWizardStore.mockReturnValue({
        ...demographicsCompletedState,
        potentialCauses: mockAIGeneratedCauses,
        error: null
      } as any);

      render(<PotentialCausesForm />);

      // Should be able to continue with the flow
      const stressCause = screen.getByRole('button', { name: /chronic stress response/i });
      await user.click(stressCause);

      expect(mockUpdateSelectedCauses).toHaveBeenCalledWith([mockAIGeneratedCauses[0]]);
    });
  });

  describe('Loading States and User Experience', () => {
    it('should show appropriate loading states during AI processing', async () => {
      // Mock delayed AI response
      mockFetchPotentialCauses.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve(mockAIGeneratedCauses), 100))
      );

      mockUseRecipeWizardStore.mockReturnValue({
        ...demographicsCompletedState,
        potentialCauses: [],
        isLoading: true
      } as any);

      render(<PotentialCausesForm />);

      // Verify loading state is displayed
      expect(screen.getByText(/loading potential causes/i)).toBeInTheDocument();
      expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument(); // Loading spinner

      // Verify no form elements are shown during loading
      expect(screen.queryByRole('button', { name: /continue/i })).not.toBeInTheDocument();
    });

    it('should disable form submissions during loading states', async () => {
      const user = userEvent.setup();

      // Test health concern form loading
      mockUseRecipeWizardStore.mockReturnValue({
        ...initialStoreState,
        isLoading: true
      } as any);

      const { unmount: unmountHealth } = render(<HealthConcernForm />);

      const healthConcernInput = screen.getByRole('textbox', { name: /describe your health concern/i });
      await user.type(healthConcernInput, 'Test concern');

      const submitButton = screen.getByRole('button', { name: /processing/i });
      expect(submitButton).toBeDisabled();
      unmountHealth();

      // Test demographics form loading
      mockUseRecipeWizardStore.mockReturnValue({
        ...healthConcernCompletedState,
        isLoading: true
      } as any);

      const { unmount: unmountDemo } = render(<DemographicsForm />);

      const demographicsSubmit = screen.getByRole('button', { name: /processing/i });
      expect(demographicsSubmit).toBeDisabled();
      unmountDemo();

      // Test potential causes form loading
      mockUseRecipeWizardStore.mockReturnValue({
        ...demographicsCompletedState,
        potentialCauses: mockAIGeneratedCauses,
        isLoading: true
      } as any);

      render(<PotentialCausesForm />);

      const causesSubmit = screen.getByRole('button', { name: /processing/i });
      expect(causesSubmit).toBeDisabled();
    });

    it('should provide clear progress indicators throughout the flow', async () => {
      // Health concern step
      mockUseRecipeWizardStore.mockReturnValue(initialStoreState as any);
      const { unmount: unmountHealth } = render(<HealthConcernForm />);

      expect(screen.getByRole('heading', { name: /health concern/i })).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: /describe your health concern/i })).toBeInTheDocument();
      unmountHealth();

      // Demographics step
      mockUseRecipeWizardStore.mockReturnValue(healthConcernCompletedState as any);
      const { unmount: unmountDemo } = render(<DemographicsForm />);

      expect(screen.getByRole('heading', { name: /demographics/i })).toBeInTheDocument();
      expect(screen.getByText(/your health concern/i)).toBeInTheDocument(); // Shows previous step data
      unmountDemo();

      // Potential causes step
      mockUseRecipeWizardStore.mockReturnValue({
        ...demographicsCompletedState,
        potentialCauses: mockAIGeneratedCauses
      } as any);

      render(<PotentialCausesForm />);

      expect(screen.getByRole('heading', { name: /potential causes/i })).toBeInTheDocument();
      expect(screen.getAllByText(/your health concern/i)[0]).toBeInTheDocument(); // Shows context
      expect(screen.getByText(/0.*selected/i)).toBeInTheDocument(); // Shows selection counter
    });

    it('should handle rapid user interactions gracefully', async () => {
      const user = userEvent.setup();

      mockUseRecipeWizardStore.mockReturnValue({
        ...demographicsCompletedState,
        potentialCauses: mockAIGeneratedCauses
      } as any);

      render(<PotentialCausesForm />);

      // Rapidly click multiple causes
      const causes = [
        screen.getByRole('button', { name: /chronic stress response/i }),
        screen.getByRole('button', { name: /sleep pattern disruption/i }),
        screen.getByRole('button', { name: /work-life balance/i })
      ];

      // Click all causes rapidly
      for (const cause of causes) {
        await user.click(cause);
      }

      // Verify all selections are registered
      expect(mockUpdateSelectedCauses).toHaveBeenCalledTimes(3);
    });

    it('should maintain accessibility throughout the flow', async () => {
      // Health concern accessibility
      mockUseRecipeWizardStore.mockReturnValue(initialStoreState as any);
      render(<HealthConcernForm />);

      const healthConcernInput = screen.getByRole('textbox', { name: /describe your health concern/i });
      expect(healthConcernInput).toHaveAttribute('aria-describedby');

      // Demographics accessibility
      mockUseRecipeWizardStore.mockReturnValue(healthConcernCompletedState as any);
      render(<DemographicsForm />);

      const genderSelect = screen.getByRole('combobox', { name: /gender/i });
      expect(genderSelect).toHaveAttribute('aria-required', 'true');

      // Potential causes accessibility
      mockUseRecipeWizardStore.mockReturnValue({
        ...demographicsCompletedState,
        potentialCauses: mockAIGeneratedCauses
      } as any);

      render(<PotentialCausesForm />);

      const firstCause = screen.getByRole('button', { name: /chronic stress response/i });
      expect(firstCause).toHaveAttribute('aria-pressed');
      expect(firstCause).toHaveAttribute('aria-describedby');
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle empty or malformed AI responses', async () => {
      mockFetchPotentialCauses.mockResolvedValueOnce([]);

      mockUseRecipeWizardStore.mockReturnValue({
        ...demographicsCompletedState,
        potentialCauses: []
      } as any);

      render(<PotentialCausesForm />);

      await waitFor(() => {
        expect(mockSetPotentialCauses).toHaveBeenCalledWith([]);
      });

      expect(screen.getByText(/no potential causes found/i)).toBeInTheDocument();
    });

    it('should handle very long health concern descriptions', async () => {
      const user = userEvent.setup();
      const longDescription = 'A'.repeat(500); // Reduced size for faster test

      mockUseRecipeWizardStore.mockReturnValue(initialStoreState as any);
      render(<HealthConcernForm />);

      const healthConcernInput = screen.getByRole('textbox', { name: /describe your health concern/i });

      // Use paste instead of type for better performance with long text
      await user.click(healthConcernInput);
      await user.paste(longDescription);

      const submitButton = screen.getByRole('button', { name: /continue to demographics/i });
      await user.click(submitButton);

      // Should handle long descriptions without errors
      expect(mockUpdateHealthConcern).toHaveBeenCalledWith({
        healthConcern: longDescription
      });
    }, 10000); // Increase timeout to 10 seconds

    it('should handle network timeouts and connection issues', async () => {
      // Mock network timeout
      mockFetchPotentialCauses.mockRejectedValueOnce(new Error('Network timeout'));

      mockUseRecipeWizardStore.mockReturnValue({
        ...demographicsCompletedState,
        potentialCauses: [],
        error: 'Failed to load potential causes. Please try again.'
      } as any);

      render(<PotentialCausesForm />);

      expect(screen.getByText(/failed to load potential causes/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });
  });
});
