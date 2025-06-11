/**
 * @fileoverview Integration tests for Potential Causes AI functionality
 * Tests the integration between PotentialCausesForm and OpenAI Agents JS SDK
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
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
  fetchPotentialCauses: jest.fn()
}));

import { fetchPotentialCauses } from '../services/ai-service';
const mockFetchPotentialCauses = fetchPotentialCauses as jest.MockedFunction<typeof fetchPotentialCauses>;

// Mock AI response data (matching API specification)
const mockAIResponse: PotentialCause[] = [
  {
    cause_id: 'cause_chronic_stress',
    name_localized: 'Chronic Stress Response',
    suggestion_localized: 'Prolonged activation of stress response system',
    explanation_localized: 'Chronic stress affects the hypothalamic-pituitary-adrenal axis, contributing to anxiety symptoms.'
  },
  {
    cause_id: 'cause_sleep_disruption',
    name_localized: 'Sleep Pattern Disruption',
    suggestion_localized: 'Irregular sleep patterns affecting emotional regulation',
    explanation_localized: 'Sleep disruption affects neurotransmitter balance and stress hormone regulation.'
  }
];

// Mock store actions
const mockSetPotentialCauses = jest.fn();
const mockSetLoading = jest.fn();
const mockSetError = jest.fn();
const mockClearError = jest.fn();

// Default store state for AI integration tests
const defaultStoreState = {
  healthConcern: { healthConcern: 'I have been experiencing chronic anxiety and stress.' },
  demographics: { gender: 'female', ageCategory: 'adult', specificAge: 30, language: 'EN_US' },
  selectedCauses: [],
  potentialCauses: [], // Start with empty causes to trigger AI fetch
  currentStep: RecipeWizardStep.POTENTIAL_CAUSES,
  completedSteps: [RecipeWizardStep.HEALTH_CONCERN, RecipeWizardStep.DEMOGRAPHICS],
  isLoading: false,
  error: null,
  setPotentialCauses: mockSetPotentialCauses,
  setLoading: mockSetLoading,
  setError: mockSetError,
  clearError: mockClearError,
  updateSelectedCauses: jest.fn(),
  setCurrentStep: jest.fn(),
  markStepCompleted: jest.fn()
};

describe('PotentialCausesForm AI Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset all mock implementations
    mockFetchPotentialCauses.mockReset();
    mockSetPotentialCauses.mockReset();
    mockSetLoading.mockReset();
    mockSetError.mockReset();
    mockClearError.mockReset();

    // Set default mock return value
    mockUseRecipeWizardStore.mockReturnValue(defaultStoreState as any);
  });

  describe('AI Service Integration', () => {
    it('should fetch potential causes from AI service when component mounts with empty causes', async () => {
      mockFetchPotentialCauses.mockResolvedValueOnce(mockAIResponse);

      render(<PotentialCausesForm />);

      await waitFor(() => {
        expect(mockFetchPotentialCauses).toHaveBeenCalledWith({
          healthConcern: 'I have been experiencing chronic anxiety and stress.',
          demographics: {
            gender: 'female',
            ageCategory: 'adult',
            specificAge: 30,
            language: 'EN_US'
          }
        });
      });

      expect(mockSetPotentialCauses).toHaveBeenCalledWith(mockAIResponse);
    });

    it('should show loading state while fetching AI data', async () => {
      // Mock a delayed response
      mockFetchPotentialCauses.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockAIResponse), 100))
      );

      mockUseRecipeWizardStore.mockReturnValue({
        ...defaultStoreState,
        isLoading: true
      } as any);

      render(<PotentialCausesForm />);

      expect(screen.getByText(/loading potential causes/i)).toBeInTheDocument();
      expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument(); // Loading spinner
    });

    it('should display AI-generated causes after successful fetch', async () => {
      mockFetchPotentialCauses.mockResolvedValueOnce(mockAIResponse);

      // Simulate the store being updated with AI response
      mockUseRecipeWizardStore.mockReturnValue({
        ...defaultStoreState,
        potentialCauses: mockAIResponse
      } as any);

      render(<PotentialCausesForm />);

      expect(screen.getByText('Chronic Stress Response')).toBeInTheDocument();
      expect(screen.getByText('Sleep Pattern Disruption')).toBeInTheDocument();
      expect(screen.getByText(/prolonged activation of stress response/i)).toBeInTheDocument();
    });

    it('should handle AI service errors gracefully', async () => {
      const errorMessage = 'Failed to generate potential causes';
      mockFetchPotentialCauses.mockRejectedValueOnce(new Error(errorMessage));

      // Start with empty causes to trigger AI fetch
      mockUseRecipeWizardStore.mockReturnValue({
        ...defaultStoreState,
        potentialCauses: [] // Ensure empty to trigger fetch
      } as any);

      render(<PotentialCausesForm />);

      // Wait for the AI service to be called
      await waitFor(() => {
        expect(mockFetchPotentialCauses).toHaveBeenCalled();
      });

      // Wait for error to be set
      await waitFor(() => {
        expect(mockSetError).toHaveBeenCalledWith(
          expect.stringContaining('Failed to load potential causes')
        );
      });
    });

    it('should not fetch causes if already loaded', async () => {
      mockUseRecipeWizardStore.mockReturnValue({
        ...defaultStoreState,
        potentialCauses: mockAIResponse // Already has causes
      } as any);

      render(<PotentialCausesForm />);

      // Should not call AI service if causes already exist
      expect(mockFetchPotentialCauses).not.toHaveBeenCalled();
    });
  });

  describe('Request Format Compliance', () => {
    it('should format request data according to API specification', async () => {
      mockFetchPotentialCauses.mockResolvedValueOnce(mockAIResponse);

      render(<PotentialCausesForm />);

      await waitFor(() => {
        expect(mockFetchPotentialCauses).toHaveBeenCalledWith({
          healthConcern: 'I have been experiencing chronic anxiety and stress.',
          demographics: {
            gender: 'female',
            ageCategory: 'adult',
            specificAge: 30,
            language: 'EN_US'
          }
        });
      });
    });

    it('should handle missing health concern data', async () => {
      mockUseRecipeWizardStore.mockReturnValue({
        ...defaultStoreState,
        healthConcern: null
      } as any);

      render(<PotentialCausesForm />);

      // Should not call AI service without required data
      expect(mockFetchPotentialCauses).not.toHaveBeenCalled();
      expect(screen.getByText(/no potential causes found/i)).toBeInTheDocument();
    });

    it('should handle missing demographics data', async () => {
      mockUseRecipeWizardStore.mockReturnValue({
        ...defaultStoreState,
        demographics: null
      } as any);

      render(<PotentialCausesForm />);

      // Should not call AI service without required data
      expect(mockFetchPotentialCauses).not.toHaveBeenCalled();
      expect(screen.getByText(/no potential causes found/i)).toBeInTheDocument();
    });
  });

  describe('Response Handling', () => {
    it('should handle empty AI response', async () => {
      // Mock the AI service to return empty array
      mockFetchPotentialCauses.mockResolvedValueOnce([]);

      // Start with empty causes to trigger AI fetch
      mockUseRecipeWizardStore.mockReturnValue({
        ...defaultStoreState,
        potentialCauses: [] // Initially empty to trigger fetch
      } as any);

      render(<PotentialCausesForm />);

      // Wait for the AI service to be called and store to be updated
      await waitFor(() => {
        expect(mockFetchPotentialCauses).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(mockSetPotentialCauses).toHaveBeenCalledWith([]);
      });

      // The component should already be showing the empty state since potentialCauses is []
      expect(screen.getByText(/no potential causes found/i)).toBeInTheDocument();
    });

    it('should validate AI response structure', async () => {
      // Mock the AI service to reject with validation error
      mockFetchPotentialCauses.mockRejectedValueOnce(new Error('Invalid response format from AI service'));

      // Start with empty causes to trigger AI fetch
      mockUseRecipeWizardStore.mockReturnValue({
        ...defaultStoreState,
        potentialCauses: [] // Ensure empty to trigger fetch
      } as any);

      render(<PotentialCausesForm />);

      // Wait for the AI service to be called
      await waitFor(() => {
        expect(mockFetchPotentialCauses).toHaveBeenCalled();
      });

      // Wait for error to be set
      await waitFor(() => {
        expect(mockSetError).toHaveBeenCalledWith(
          expect.stringContaining('Failed to load potential causes')
        );
      });
    });
  });

  describe('User Interaction with AI Data', () => {
    it('should allow selecting AI-generated causes', async () => {
      const mockUpdateSelectedCauses = jest.fn();
      
      mockUseRecipeWizardStore.mockReturnValue({
        ...defaultStoreState,
        potentialCauses: mockAIResponse,
        updateSelectedCauses: mockUpdateSelectedCauses
      } as any);

      const user = userEvent.setup();
      render(<PotentialCausesForm />);

      const stressCause = screen.getByRole('button', { name: /chronic stress response/i });
      await user.click(stressCause);

      expect(mockUpdateSelectedCauses).toHaveBeenCalledWith([mockAIResponse[0]]);
    });

    it('should show retry option on AI service failure', async () => {
      // First, render with an error state
      mockUseRecipeWizardStore.mockReturnValue({
        ...defaultStoreState,
        error: 'Failed to load potential causes. Please try again.',
        potentialCauses: [] // Empty to show error state
      } as any);

      const user = userEvent.setup();
      render(<PotentialCausesForm />);

      const retryButton = screen.getByRole('button', { name: /retry/i });
      await user.click(retryButton);

      expect(mockClearError).toHaveBeenCalled();
      // Note: The fetchPotentialCauses might be called multiple times due to useEffect
      expect(mockFetchPotentialCauses).toHaveBeenCalled();
    });
  });
});
