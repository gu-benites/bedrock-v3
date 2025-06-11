/**
 * @fileoverview Tests for Potential Causes Form component
 * Tests form rendering, cause selection, validation, and store integration
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PotentialCausesForm } from './potential-causes-form';
import { useRecipeWizardStore } from '../store/wizard-store';
import { RecipeWizardStep } from '../types/recipe-wizard.types';
import type { PotentialCause } from '../types/recipe-wizard.types';

// Mock the store
jest.mock('../store/wizard-store');
const mockUseRecipeWizardStore = useRecipeWizardStore as jest.MockedFunction<typeof useRecipeWizardStore>;

// Mock the AI service
jest.mock('../services/ai-service', () => ({
  fetchPotentialCauses: jest.fn(),
  fetchPotentialCausesStreaming: jest.fn(),
  AIServiceError: class AIServiceError extends Error {
    constructor(message: string, public code: string) {
      super(message);
      this.name = 'AIServiceError';
    }
  }
}));

// Mock the AI streaming hook
jest.mock('@/lib/ai/hooks/use-ai-streaming');
import { useAIStreaming } from '@/lib/ai/hooks/use-ai-streaming';
const mockUseAIStreaming = useAIStreaming as jest.MockedFunction<typeof useAIStreaming>;

// Mock potential causes data (aligned with API specification)
const mockPotentialCauses: PotentialCause[] = [
  {
    cause_id: 'stress-1',
    name_localized: 'Chronic Stress',
    suggestion_localized: 'Long-term stress affecting daily life',
    explanation_localized: 'Stress can manifest in various physical symptoms'
  },
  {
    cause_id: 'sleep-1',
    name_localized: 'Poor Sleep Quality',
    suggestion_localized: 'Inadequate or disrupted sleep patterns',
    explanation_localized: 'Sleep issues can affect overall health and wellbeing'
  },
  {
    cause_id: 'diet-1',
    name_localized: 'Dietary Imbalances',
    suggestion_localized: 'Nutritional deficiencies or poor eating habits',
    explanation_localized: 'Diet plays a crucial role in health maintenance'
  }
];

// Mock store actions
const mockUpdateSelectedCauses = jest.fn();
const mockSetCurrentStep = jest.fn();
const mockMarkStepCompleted = jest.fn();
const mockSetPotentialCauses = jest.fn();
const mockSetLoading = jest.fn();
const mockSetError = jest.fn();
const mockClearError = jest.fn();

// Default store state
const defaultStoreState = {
  healthConcern: { healthConcern: 'I have been experiencing chronic anxiety and stress.' },
  demographics: { gender: 'female', ageCategory: 'adult', specificAge: 30, language: 'EN_US' },
  selectedCauses: [],
  potentialCauses: mockPotentialCauses,
  currentStep: RecipeWizardStep.POTENTIAL_CAUSES,
  completedSteps: [RecipeWizardStep.HEALTH_CONCERN, RecipeWizardStep.DEMOGRAPHICS],
  isLoading: false,
  error: null,
  updateSelectedCauses: mockUpdateSelectedCauses,
  setPotentialCauses: mockSetPotentialCauses,
  setCurrentStep: mockSetCurrentStep,
  markStepCompleted: mockMarkStepCompleted,
  setLoading: mockSetLoading,
  setError: mockSetError,
  clearError: mockClearError
};

// Store state for streaming tests (no existing causes)
const streamingStoreState = {
  ...defaultStoreState,
  potentialCauses: []
};

// Mock streaming hook state
const mockStreamingState = {
  streamingText: '',
  isStreaming: false,
  isComplete: false,
  error: null,
  finalData: null,
  startStream: jest.fn(),
  resetStream: jest.fn()
};

describe('PotentialCausesForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRecipeWizardStore.mockReturnValue(defaultStoreState as any);
    mockUseAIStreaming.mockReturnValue(mockStreamingState);
  });

  describe('Rendering', () => {
    it('should render the form with all required elements', () => {
      render(<PotentialCausesForm />);

      expect(screen.getByRole('heading', { name: /potential causes/i })).toBeInTheDocument();
      expect(screen.getByText(/select the potential causes/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument();
    });

    it('should display health concern summary', () => {
      render(<PotentialCausesForm />);

      expect(screen.getByText('Your health concern:')).toBeInTheDocument();
      expect(screen.getByText(/chronic anxiety and stress/i)).toBeInTheDocument();
    });

    it('should render all potential causes', () => {
      render(<PotentialCausesForm />);

      expect(screen.getByText('Chronic Stress')).toBeInTheDocument();
      expect(screen.getByText('Poor Sleep Quality')).toBeInTheDocument();
      expect(screen.getByText('Dietary Imbalances')).toBeInTheDocument();
    });

    it('should display cause descriptions', () => {
      render(<PotentialCausesForm />);

      expect(screen.getByText(/long-term stress affecting daily life/i)).toBeInTheDocument();
      expect(screen.getByText(/inadequate or disrupted sleep patterns/i)).toBeInTheDocument();
    });

    it('should show selection counter', () => {
      render(<PotentialCausesForm />);

      expect(screen.getByText(/0.*selected/i)).toBeInTheDocument();
    });

    it('should display error message when present', () => {
      mockUseRecipeWizardStore.mockReturnValue({
        ...defaultStoreState,
        error: 'Failed to load potential causes'
      } as any);

      render(<PotentialCausesForm />);

      expect(screen.getByText(/failed to load potential causes/i)).toBeInTheDocument();
    });
  });

  describe('Cause Selection', () => {
    it('should allow selecting a cause', async () => {
      const user = userEvent.setup();
      render(<PotentialCausesForm />);

      const stressCause = screen.getByText('Chronic Stress').closest('div');
      await user.click(stressCause!);

      expect(mockUpdateSelectedCauses).toHaveBeenCalledWith([mockPotentialCauses[0]]);
    });

    it('should allow deselecting a cause', async () => {
      const user = userEvent.setup();
      mockUseRecipeWizardStore.mockReturnValue({
        ...defaultStoreState,
        selectedCauses: [mockPotentialCauses[0]]
      } as any);

      render(<PotentialCausesForm />);

      const stressCause = screen.getByText('Chronic Stress').closest('div');
      await user.click(stressCause!);

      expect(mockUpdateSelectedCauses).toHaveBeenCalledWith([]);
    });

    it('should allow selecting multiple causes', async () => {
      const user = userEvent.setup();
      render(<PotentialCausesForm />);

      const stressCause = screen.getByText('Chronic Stress').closest('div');
      const sleepCause = screen.getByText('Poor Sleep Quality').closest('div');

      await user.click(stressCause!);
      await user.click(sleepCause!);

      expect(mockUpdateSelectedCauses).toHaveBeenCalledWith([mockPotentialCauses[0]]);
      expect(mockUpdateSelectedCauses).toHaveBeenCalledWith([mockPotentialCauses[0], mockPotentialCauses[1]]);
    });

    it('should update selection counter when causes are selected', async () => {
      const user = userEvent.setup();
      mockUseRecipeWizardStore.mockReturnValue({
        ...defaultStoreState,
        selectedCauses: [mockPotentialCauses[0]]
      } as any);

      render(<PotentialCausesForm />);

      expect(screen.getByText(/1.*selected/i)).toBeInTheDocument();
    });

    it('should show visual feedback for selected causes', () => {
      mockUseRecipeWizardStore.mockReturnValue({
        ...defaultStoreState,
        selectedCauses: [mockPotentialCauses[0]]
      } as any);

      render(<PotentialCausesForm />);

      const stressCause = screen.getByRole('button', { name: /chronic stress/i });
      expect(stressCause).toHaveClass('border-blue-500'); // or similar selected styling
    });
  });

  describe('Form Validation', () => {
    it('should show validation error when no causes are selected', async () => {
      const user = userEvent.setup();
      render(<PotentialCausesForm />);

      const submitButton = screen.getByRole('button', { name: /continue/i });
      await user.click(submitButton);

      expect(screen.getByText(/please select at least one potential cause/i)).toBeInTheDocument();
    });

    it('should not show validation error when causes are selected', async () => {
      const user = userEvent.setup();
      mockUseRecipeWizardStore.mockReturnValue({
        ...defaultStoreState,
        selectedCauses: [mockPotentialCauses[0]]
      } as any);

      render(<PotentialCausesForm />);

      const submitButton = screen.getByRole('button', { name: /continue/i });
      await user.click(submitButton);

      expect(screen.queryByText(/please select at least one potential cause/i)).not.toBeInTheDocument();
    });

    it('should clear validation errors when user selects a cause', async () => {
      const user = userEvent.setup();
      render(<PotentialCausesForm />);

      // First trigger validation error
      const submitButton = screen.getByRole('button', { name: /continue/i });
      await user.click(submitButton);
      expect(screen.getByText(/please select at least one potential cause/i)).toBeInTheDocument();

      // Then select a cause
      const stressCause = screen.getByText('Chronic Stress').closest('div');
      await user.click(stressCause!);

      expect(mockClearError).toHaveBeenCalled();
    });
  });

  describe('Form Submission', () => {
    it('should call store actions on successful submission', async () => {
      const user = userEvent.setup();
      mockUseRecipeWizardStore.mockReturnValue({
        ...defaultStoreState,
        selectedCauses: [mockPotentialCauses[0]]
      } as any);

      render(<PotentialCausesForm />);

      const submitButton = screen.getByRole('button', { name: /continue/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockMarkStepCompleted).toHaveBeenCalledWith(RecipeWizardStep.POTENTIAL_CAUSES);
        // Note: Next step navigation will depend on what comes after POTENTIAL_CAUSES
      });
    });

    it('should disable submit button when loading', () => {
      mockUseRecipeWizardStore.mockReturnValue({
        ...defaultStoreState,
        isLoading: true,
        selectedCauses: [mockPotentialCauses[0]]
      } as any);

      render(<PotentialCausesForm />);

      const submitButton = screen.getByRole('button', { name: /processing/i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Loading States', () => {
    it('should show loading state when fetching causes', () => {
      mockUseRecipeWizardStore.mockReturnValue({
        ...defaultStoreState,
        isLoading: true,
        potentialCauses: []
      } as any);

      render(<PotentialCausesForm />);

      expect(screen.getByText(/loading potential causes/i)).toBeInTheDocument();
    });

    it('should show empty state when no causes available', () => {
      mockUseRecipeWizardStore.mockReturnValue({
        ...defaultStoreState,
        potentialCauses: []
      } as any);

      render(<PotentialCausesForm />);

      expect(screen.getByText(/no potential causes found/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and descriptions', () => {
      render(<PotentialCausesForm />);

      const form = screen.getByRole('form');
      expect(form).toBeInTheDocument();

      const heading = screen.getByRole('heading', { name: /potential causes/i });
      expect(heading).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<PotentialCausesForm />);

      // Tab to first cause
      await user.tab();
      const firstCause = screen.getByRole('button', { name: /chronic stress/i });
      expect(firstCause).toHaveFocus();

      // Enter should select the cause
      await user.keyboard('{Enter}');
      expect(mockUpdateSelectedCauses).toHaveBeenCalled();
    });
  });

  describe('Streaming Integration', () => {
    describe('Real-time Text Display', () => {
      it('should display streaming text as it arrives', async () => {
        const streamingState = {
          ...mockStreamingState,
          isStreaming: true,
          streamingText: 'Analyzing your health concern...'
        };
        mockUseAIStreaming.mockReturnValue(streamingState);

        render(<PotentialCausesForm />);

        expect(screen.getByText('Analyzing your health concern...')).toBeInTheDocument();
        expect(screen.getByTestId('streaming-text-display')).toBeInTheDocument();
      });

      it('should update streaming text progressively', async () => {
        const { rerender } = render(<PotentialCausesForm />);

        // First chunk
        mockUseAIStreaming.mockReturnValue({
          ...mockStreamingState,
          isStreaming: true,
          streamingText: 'Analyzing your health concern...'
        });
        rerender(<PotentialCausesForm />);
        expect(screen.getByText('Analyzing your health concern...')).toBeInTheDocument();

        // Second chunk
        mockUseAIStreaming.mockReturnValue({
          ...mockStreamingState,
          isStreaming: true,
          streamingText: 'Analyzing your health concern... Based on chronic anxiety symptoms...'
        });
        rerender(<PotentialCausesForm />);
        expect(screen.getByText('Analyzing your health concern... Based on chronic anxiety symptoms...')).toBeInTheDocument();
      });

      it('should show typing indicator during streaming', () => {
        mockUseAIStreaming.mockReturnValue({
          ...mockStreamingState,
          isStreaming: true,
          streamingText: 'Analyzing...'
        });

        render(<PotentialCausesForm />);

        expect(screen.getByTestId('typing-indicator')).toBeInTheDocument();
        expect(screen.getByTestId('typing-indicator')).toHaveClass('animate-pulse');
      });

      it('should hide typing indicator when streaming completes', () => {
        mockUseAIStreaming.mockReturnValue({
          ...mockStreamingState,
          isStreaming: false,
          isComplete: true,
          streamingText: 'Analysis complete.',
          finalData: mockPotentialCauses
        });

        render(<PotentialCausesForm />);

        expect(screen.queryByTestId('typing-indicator')).not.toBeInTheDocument();
      });
    });

    describe('Streaming States', () => {
      it('should show initial loading state before streaming starts', () => {
        mockUseRecipeWizardStore.mockReturnValue({
          ...streamingStoreState,
          isLoading: true
        } as any);

        render(<PotentialCausesForm />);

        expect(screen.getByTestId('initial-loading-spinner')).toBeInTheDocument();
        expect(screen.getByText('Preparing analysis...')).toBeInTheDocument();
      });

      it('should transition from loading to streaming state', async () => {
        const { rerender } = render(<PotentialCausesForm />);

        // Initial loading
        mockUseRecipeWizardStore.mockReturnValue({
          ...streamingStoreState,
          isLoading: true
        } as any);
        rerender(<PotentialCausesForm />);
        expect(screen.getByTestId('initial-loading-spinner')).toBeInTheDocument();

        // Transition to streaming
        mockUseRecipeWizardStore.mockReturnValue({
          ...streamingStoreState,
          isLoading: false
        } as any);
        mockUseAIStreaming.mockReturnValue({
          ...mockStreamingState,
          isStreaming: true,
          streamingText: 'Starting analysis...'
        });
        rerender(<PotentialCausesForm />);

        expect(screen.queryByTestId('initial-loading-spinner')).not.toBeInTheDocument();
        expect(screen.getByTestId('streaming-text-display')).toBeInTheDocument();
      });

      it('should show completion state after streaming finishes', () => {
        mockUseAIStreaming.mockReturnValue({
          ...mockStreamingState,
          isStreaming: false,
          isComplete: true,
          finalData: mockPotentialCauses
        });

        render(<PotentialCausesForm />);

        expect(screen.getByTestId('causes-selection-list')).toBeInTheDocument();
        expect(screen.getByText('Chronic Stress')).toBeInTheDocument();
        expect(screen.getByText('Poor Sleep Quality')).toBeInTheDocument();
      });
    });

    describe('Completion Handling', () => {
      it('should update store with final causes data', async () => {
        mockUseAIStreaming.mockReturnValue({
          ...mockStreamingState,
          isStreaming: false,
          isComplete: true,
          finalData: mockPotentialCauses
        });

        render(<PotentialCausesForm />);

        await waitFor(() => {
          expect(mockSetPotentialCauses).toHaveBeenCalledWith(mockPotentialCauses);
        });
      });

      it('should enable cause selection after completion', () => {
        mockUseAIStreaming.mockReturnValue({
          ...mockStreamingState,
          isStreaming: false,
          isComplete: true,
          finalData: mockPotentialCauses
        });

        render(<PotentialCausesForm />);

        const checkbox = screen.getByRole('button', { name: /chronic stress/i });
        expect(checkbox).toBeEnabled();

        fireEvent.click(checkbox);
        expect(mockUpdateSelectedCauses).toHaveBeenCalled();
      });
    });

    describe('Error Handling', () => {
      it('should display streaming errors', () => {
        mockUseAIStreaming.mockReturnValue({
          ...mockStreamingState,
          isStreaming: false,
          error: 'Failed to analyze health concern'
        });

        render(<PotentialCausesForm />);

        expect(screen.getByTestId('streaming-error-message')).toBeInTheDocument();
        expect(screen.getByText('Failed to analyze health concern')).toBeInTheDocument();
      });

      it('should show retry button on streaming error', () => {
        mockUseAIStreaming.mockReturnValue({
          ...mockStreamingState,
          isStreaming: false,
          error: 'Connection failed'
        });

        render(<PotentialCausesForm />);

        const retryButton = screen.getByRole('button', { name: /retry analysis/i });
        expect(retryButton).toBeInTheDocument();
        expect(retryButton).toBeEnabled();
      });

      it('should restart streaming when retry button is clicked', async () => {
        const user = userEvent.setup();
        mockUseRecipeWizardStore.mockReturnValue(streamingStoreState as any);
        mockUseAIStreaming.mockReturnValue({
          ...mockStreamingState,
          isStreaming: false,
          error: 'Connection failed'
        });

        render(<PotentialCausesForm />);

        const retryButton = screen.getByRole('button', { name: /retry analysis/i });

        await user.click(retryButton);

        expect(mockStreamingState.resetStream).toHaveBeenCalled();
        expect(mockStreamingState.startStream).toHaveBeenCalledWith(
          '/api/ai/streaming',
          {
            feature: 'recipe-wizard',
            step: 'potential-causes',
            data: {
              healthConcern: 'I have been experiencing chronic anxiety and stress.',
              demographics: streamingStoreState.demographics
            }
          }
        );
      });
    });

    describe('Component Integration', () => {
      it('should start streaming on component mount', async () => {
        mockUseRecipeWizardStore.mockReturnValue(streamingStoreState as any);

        render(<PotentialCausesForm />);

        await waitFor(() => {
          expect(mockStreamingState.startStream).toHaveBeenCalledWith(
            '/api/ai/streaming',
            {
              feature: 'recipe-wizard',
              step: 'potential-causes',
              data: {
                healthConcern: 'I have been experiencing chronic anxiety and stress.',
                demographics: streamingStoreState.demographics
              }
            }
          );
        });
      });

      it('should reset streaming on component unmount', () => {
        const { unmount } = render(<PotentialCausesForm />);

        unmount();

        expect(mockStreamingState.resetStream).toHaveBeenCalled();
      });

      it('should handle missing health concern gracefully', () => {
        mockUseRecipeWizardStore.mockReturnValue({
          ...streamingStoreState,
          healthConcern: { healthConcern: '' }
        } as any);

        render(<PotentialCausesForm />);

        expect(screen.getByTestId('missing-health-concern-message')).toBeInTheDocument();
        expect(mockStreamingState.startStream).not.toHaveBeenCalled();
      });
    });
  });
});
