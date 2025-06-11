/**
 * @fileoverview Unit tests for Health Concern Form component
 * Tests form validation, user interactions, and store integration
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HealthConcernForm } from './health-concern-form';
import { useRecipeWizardStore } from '../store/wizard-store';
import { RecipeWizardStep } from '../types/recipe-wizard.types';
import { MIN_HEALTH_CONCERN_LENGTH, MAX_HEALTH_CONCERN_LENGTH } from '../constants/wizard.constants';

// Mock the wizard store
jest.mock('../store/wizard-store');
const mockUseRecipeWizardStore = useRecipeWizardStore as jest.MockedFunction<typeof useRecipeWizardStore>;

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

describe('HealthConcernForm', () => {
  const mockUpdateHealthConcern = jest.fn();
  const mockSetCurrentStep = jest.fn();
  const mockMarkStepCompleted = jest.fn();
  const mockSetError = jest.fn();
  const mockClearError = jest.fn();

  const defaultStoreState = {
    healthConcern: null,
    isLoading: false,
    error: null,
    updateHealthConcern: mockUpdateHealthConcern,
    setCurrentStep: mockSetCurrentStep,
    markStepCompleted: mockMarkStepCompleted,
    setError: mockSetError,
    clearError: mockClearError
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRecipeWizardStore.mockReturnValue(defaultStoreState as any);
  });

  describe('Rendering', () => {
    it('should render the form with all required elements', () => {
      render(<HealthConcernForm />);

      expect(screen.getByRole('heading', { name: /health concern/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/describe your health concern/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /continue to demographics/i })).toBeInTheDocument();
    });

    it('should render with existing health concern data', () => {
      const existingData = { healthConcern: 'Chronic anxiety and stress' };
      mockUseRecipeWizardStore.mockReturnValue({
        ...defaultStoreState,
        healthConcern: existingData
      } as any);

      render(<HealthConcernForm />);

      const textarea = screen.getByLabelText(/describe your health concern/i);
      expect(textarea).toHaveValue('Chronic anxiety and stress');
    });

    it('should show character count', () => {
      render(<HealthConcernForm />);

      const characterCount = screen.getByText(/0 \/ 500 characters/i);
      expect(characterCount).toBeInTheDocument();
    });

    it('should display error message when present', () => {
      mockUseRecipeWizardStore.mockReturnValue({
        ...defaultStoreState,
        error: 'Test error message'
      } as any);

      render(<HealthConcernForm />);

      expect(screen.getByText('Test error message')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should show validation error for empty input', async () => {
      const user = userEvent.setup();
      render(<HealthConcernForm />);

      const submitButton = screen.getByRole('button', { name: /continue to demographics/i });
      await user.click(submitButton);

      expect(screen.getByText(/please describe your health concern/i)).toBeInTheDocument();
    });

    it('should show validation error for input too short', async () => {
      const user = userEvent.setup();
      render(<HealthConcernForm />);

      const textarea = screen.getByLabelText(/describe your health concern/i);
      await user.type(textarea, 'Too short');

      const submitButton = screen.getByRole('button', { name: /continue to demographics/i });
      await user.click(submitButton);

      expect(screen.getByText(new RegExp(`at least ${MIN_HEALTH_CONCERN_LENGTH} characters`, 'i'))).toBeInTheDocument();
    });

    it('should show validation error for input too long', async () => {
      const user = userEvent.setup();
      render(<HealthConcernForm />);

      const longText = 'a'.repeat(MAX_HEALTH_CONCERN_LENGTH + 1);
      const textarea = screen.getByLabelText(/describe your health concern/i);

      // Use fireEvent.change for performance instead of typing each character
      fireEvent.change(textarea, { target: { value: longText } });

      const submitButton = screen.getByRole('button', { name: /continue to demographics/i });
      await user.click(submitButton);

      expect(screen.getByText(new RegExp(`no more than ${MAX_HEALTH_CONCERN_LENGTH} characters`, 'i'))).toBeInTheDocument();
    });

    it('should accept valid input', async () => {
      const user = userEvent.setup();
      render(<HealthConcernForm />);

      const validText = 'I have been experiencing chronic anxiety and stress that affects my daily life and sleep patterns.';
      const textarea = screen.getByLabelText(/describe your health concern/i);
      await user.type(textarea, validText);

      const submitButton = screen.getByRole('button', { name: /continue to demographics/i });
      await user.click(submitButton);

      // Should not show validation errors
      expect(screen.queryByText(/please describe your health concern/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/at least.*characters/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/no more than.*characters/i)).not.toBeInTheDocument();
    });
  });

  describe('Character Count', () => {
    it('should update character count as user types', async () => {
      const user = userEvent.setup();
      render(<HealthConcernForm />);

      const textarea = screen.getByLabelText(/describe your health concern/i);
      await user.type(textarea, 'Hello world');

      expect(screen.getByText(/11.*500.*characters/)).toBeInTheDocument();
    });

    it('should show warning color when approaching limit', async () => {
      const user = userEvent.setup();
      render(<HealthConcernForm />);

      const nearLimitText = 'a'.repeat(451); // 451 > 450 (90% of 500) triggers warning
      const textarea = screen.getByLabelText(/describe your health concern/i);

      // Use userEvent.clear and paste for better performance than typing
      await user.clear(textarea);
      await user.click(textarea);
      await user.paste(nearLimitText);

      await waitFor(() => {
        const characterCount = screen.getByText(/451.*500.*characters/);
        expect(characterCount).toHaveClass('text-yellow-600'); // Warning color
      });
    });

    it('should show error color when over limit', async () => {
      render(<HealthConcernForm />);

      const overLimitText = 'a'.repeat(510); // Over 500 limit
      const textarea = screen.getByLabelText(/describe your health concern/i);

      // Simulate typing beyond limit (in real app, this might be prevented)
      fireEvent.change(textarea, { target: { value: overLimitText } });

      const characterCount = screen.getByText(/510.*500.*characters/);
      expect(characterCount).toHaveClass('text-red-600'); // Error color
    });
  });

  describe('Form Submission', () => {
    it('should call store actions on successful submission', async () => {
      const user = userEvent.setup();
      render(<HealthConcernForm />);

      const validText = 'I have been experiencing chronic anxiety and stress that affects my daily life.';
      const textarea = screen.getByLabelText(/describe your health concern/i);

      // Use fireEvent.change for performance and accuracy
      fireEvent.change(textarea, { target: { value: validText } });

      const submitButton = screen.getByRole('button', { name: /continue to demographics/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockUpdateHealthConcern).toHaveBeenCalledWith({
          healthConcern: validText
        });
        expect(mockMarkStepCompleted).toHaveBeenCalledWith(RecipeWizardStep.HEALTH_CONCERN);
        expect(mockSetCurrentStep).toHaveBeenCalledWith(RecipeWizardStep.DEMOGRAPHICS);
      });
    });

    it('should clear errors on successful submission', async () => {
      const user = userEvent.setup();
      mockUseRecipeWizardStore.mockReturnValue({
        ...defaultStoreState,
        error: 'Previous error'
      } as any);

      render(<HealthConcernForm />);

      const validText = 'I have been experiencing chronic anxiety and stress.';
      const textarea = screen.getByLabelText(/describe your health concern/i);
      await user.type(textarea, validText);

      const submitButton = screen.getByRole('button', { name: /continue to demographics/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockClearError).toHaveBeenCalled();
      });
    });

    it('should disable submit button when loading', () => {
      mockUseRecipeWizardStore.mockReturnValue({
        ...defaultStoreState,
        isLoading: true
      } as any);

      render(<HealthConcernForm />);

      const submitButton = screen.getByRole('button', { name: /processing/i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('User Experience', () => {
    it('should clear validation errors when user starts typing', async () => {
      const user = userEvent.setup();
      render(<HealthConcernForm />);

      // First trigger validation error
      const submitButton = screen.getByRole('button', { name: /continue to demographics/i });
      await user.click(submitButton);

      expect(screen.getByText(/please describe your health concern/i)).toBeInTheDocument();

      // Then start typing
      const textarea = screen.getByLabelText(/describe your health concern/i);
      await user.type(textarea, 'Starting to type...');

      // Validation error should be cleared
      expect(screen.queryByText(/please describe your health concern/i)).not.toBeInTheDocument();
    });

    it('should provide helpful placeholder text', () => {
      render(<HealthConcernForm />);

      const textarea = screen.getByLabelText(/describe your health concern/i);
      expect(textarea).toHaveAttribute('placeholder', expect.stringMatching(/describe/i));
    });

    it('should focus on textarea when component mounts', () => {
      render(<HealthConcernForm />);

      const textarea = screen.getByLabelText(/describe your health concern/i);
      expect(textarea).toHaveFocus();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<HealthConcernForm />);

      const textarea = screen.getByLabelText(/describe your health concern/i);
      expect(textarea).toHaveAttribute('aria-describedby');
      
      const description = screen.getByText(/provide details about your health concern/i);
      expect(description).toHaveAttribute('id');
    });

    it('should associate validation errors with form field', async () => {
      const user = userEvent.setup();
      render(<HealthConcernForm />);

      const submitButton = screen.getByRole('button', { name: /continue to demographics/i });
      await user.click(submitButton);

      const textarea = screen.getByLabelText(/describe your health concern/i);
      const errorMessage = screen.getByText(/please describe your health concern/i);
      
      expect(textarea).toHaveAttribute('aria-invalid', 'true');
      expect(textarea).toHaveAttribute('aria-describedby', expect.stringContaining(errorMessage.id));
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<HealthConcernForm />);

      // Textarea should have focus on mount
      const textarea = screen.getByLabelText(/describe your health concern/i);
      expect(textarea).toHaveFocus();

      // Tab to submit button
      await user.tab();
      const submitButton = screen.getByRole('button', { name: /continue to demographics/i });
      expect(submitButton).toHaveFocus();

      // Enter should submit form with valid text
      fireEvent.change(textarea, { target: { value: 'Valid health concern description for testing purposes.' } });
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(mockUpdateHealthConcern).toHaveBeenCalled();
      });
    });
  });
});
