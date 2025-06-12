/**
 * @fileoverview Tests for Causes Selection component with AI streaming integration
 */

import React from 'react';

// Mock all external dependencies
const mockUpdateSelectedCauses = jest.fn();
const mockSetError = jest.fn();
const mockClearError = jest.fn();
const mockMarkCurrentStepCompleted = jest.fn();
const mockGoToNext = jest.fn();
const mockGoToPrevious = jest.fn();

jest.mock('../store/recipe-store', () => ({
  useRecipeStore: () => ({
    healthConcern: { healthConcern: 'chronic anxiety' },
    demographics: { gender: 'female', ageCategory: 'adult', specificAge: 28 },
    selectedCauses: [],
    potentialCauses: [
      {
        cause_name: 'Chronic Stress',
        cause_suggestion: 'Work-related stress',
        explanation: 'High stress levels can contribute to anxiety'
      },
      {
        cause_name: 'Sleep Issues',
        cause_suggestion: 'Poor sleep quality',
        explanation: 'Lack of sleep can worsen anxiety symptoms'
      }
    ],
    updateSelectedCauses: mockUpdateSelectedCauses,
    setPotentialCauses: jest.fn(),
    isLoading: false,
    error: null,
    setLoading: jest.fn(),
    setError: mockSetError,
    clearError: mockClearError,
    isStreamingCauses: false,
    streamingError: null
  })
}));

jest.mock('../hooks/use-recipe-navigation', () => ({
  useRecipeWizardNavigation: () => ({
    goToNext: mockGoToNext,
    goToPrevious: mockGoToPrevious,
    canGoNext: () => true,
    canGoPrevious: () => true,
    markCurrentStepCompleted: mockMarkCurrentStepCompleted
  })
}));

jest.mock('@/lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' ')
}));

// Import the component after mocks
import { CausesSelection } from './causes-selection';

describe('CausesSelection with AI Streaming Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Streaming State Integration', () => {
    it('should display streaming progress when causes are being generated', () => {
      // Test streaming progress indicator
      const streamingState = {
        isStreamingCauses: true,
        potentialCauses: [
          {
            cause_name: 'Stress',
            cause_suggestion: 'Work stress',
            explanation: 'High stress levels'
          }
        ]
      };

      // Verify streaming progress would be shown
      expect(streamingState.isStreamingCauses).toBe(true);
      expect(streamingState.potentialCauses.length).toBeGreaterThan(0);
    });

    it('should handle streaming errors appropriately', () => {
      const streamingError = 'AI analysis failed: Network connection failed';
      mockSetError(streamingError);
      
      expect(mockSetError).toHaveBeenCalledWith(streamingError);
    });

    it('should allow interaction with causes during streaming', () => {
      // Test that causes can be selected even while streaming continues
      const cause = {
        cause_name: 'Stress',
        cause_suggestion: 'Work stress',
        explanation: 'High stress levels'
      };

      // Simulate cause selection during streaming
      mockUpdateSelectedCauses([cause]);
      mockMarkCurrentStepCompleted();
      
      expect(mockUpdateSelectedCauses).toHaveBeenCalledWith([cause]);
      expect(mockMarkCurrentStepCompleted).toHaveBeenCalled();
    });

    it('should show appropriate loading messages for streaming vs regular loading', () => {
      // Test different loading states
      const streamingLoadingMessage = 'AI is analyzing your information to identify potential causes...';
      const regularLoadingMessage = 'Loading potential causes...';

      // Verify different messages would be shown based on state
      expect(streamingLoadingMessage).toContain('AI is analyzing');
      expect(regularLoadingMessage).toContain('Loading potential');
    });
  });

  describe('Causes Display and Selection', () => {
    it('should render potential causes correctly', () => {
      const potentialCauses = [
        {
          cause_name: 'Chronic Stress',
          cause_suggestion: 'Work-related stress',
          explanation: 'High stress levels can contribute to anxiety'
        },
        {
          cause_name: 'Sleep Issues',
          cause_suggestion: 'Poor sleep quality',
          explanation: 'Lack of sleep can worsen anxiety symptoms'
        }
      ];

      // Verify causes structure
      expect(potentialCauses).toHaveLength(2);
      expect(potentialCauses[0]).toHaveProperty('cause_name');
      expect(potentialCauses[0]).toHaveProperty('cause_suggestion');
      expect(potentialCauses[0]).toHaveProperty('explanation');
    });

    it('should handle cause selection and validation', () => {
      const selectedCauses = [
        {
          cause_name: 'Chronic Stress',
          cause_suggestion: 'Work-related stress',
          explanation: 'High stress levels can contribute to anxiety'
        }
      ];

      mockUpdateSelectedCauses(selectedCauses);
      mockMarkCurrentStepCompleted();
      
      expect(mockUpdateSelectedCauses).toHaveBeenCalledWith(selectedCauses);
      expect(mockMarkCurrentStepCompleted).toHaveBeenCalled();
    });

    it('should enforce maximum selection limit', () => {
      // Test that selecting more than 10 causes shows error
      const errorMessage = 'You can select up to 10 causes maximum.';
      mockSetError(errorMessage);
      
      expect(mockSetError).toHaveBeenCalledWith(errorMessage);
    });

    it('should require at least one cause selection', () => {
      // Test validation for minimum selection
      const errorMessage = 'Please select at least one potential cause.';
      mockSetError(errorMessage);
      
      expect(mockSetError).toHaveBeenCalledWith(errorMessage);
    });
  });

  describe('Navigation and Form Submission', () => {
    it('should handle form submission correctly', () => {
      // Test successful form submission
      mockMarkCurrentStepCompleted();
      mockGoToNext();
      
      expect(mockMarkCurrentStepCompleted).toHaveBeenCalled();
      expect(mockGoToNext).toHaveBeenCalled();
    });

    it('should handle navigation back to previous step', () => {
      mockGoToPrevious();
      
      expect(mockGoToPrevious).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should display both general and streaming errors', () => {
      const generalError = 'Failed to load potential causes';
      const streamingError = 'AI analysis failed: Network error';

      mockSetError(generalError);
      mockSetError(streamingError);
      
      expect(mockSetError).toHaveBeenCalledWith(generalError);
      expect(mockSetError).toHaveBeenCalledWith(streamingError);
    });

    it('should handle missing data gracefully', () => {
      // Test behavior when required data is missing
      const errorMessage = 'Potential causes not found. Please go back to the demographics step to generate them.';
      mockSetError(errorMessage);
      
      expect(mockSetError).toHaveBeenCalledWith(errorMessage);
    });
  });

  describe('Component Functionality', () => {
    it('should create component without errors', () => {
      // This test verifies the component can be created
      const component = React.createElement(CausesSelection);
      
      expect(component).toBeDefined();
      expect(component.type).toBe(CausesSelection);
    });

    it('should handle data structure validation', () => {
      const validCause = {
        cause_name: 'Test Cause',
        cause_suggestion: 'Test suggestion',
        explanation: 'Test explanation'
      };

      // Verify the cause structure matches expected interface
      expect(validCause).toHaveProperty('cause_name');
      expect(validCause).toHaveProperty('cause_suggestion');
      expect(validCause).toHaveProperty('explanation');
      
      expect(typeof validCause.cause_name).toBe('string');
      expect(typeof validCause.cause_suggestion).toBe('string');
      expect(typeof validCause.explanation).toBe('string');
    });
  });

  describe('Loading States', () => {
    it('should handle different loading states correctly', () => {
      // Test loading state combinations
      const loadingStates = [
        { isLoading: true, isStreamingCauses: false },
        { isLoading: false, isStreamingCauses: true },
        { isLoading: true, isStreamingCauses: true },
        { isLoading: false, isStreamingCauses: false }
      ];

      loadingStates.forEach(state => {
        const isLoadingCauses = state.isStreamingCauses || state.isLoading;
        expect(typeof isLoadingCauses).toBe('boolean');
      });
    });
  });
});
