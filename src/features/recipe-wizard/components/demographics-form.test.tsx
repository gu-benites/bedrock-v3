/**
 * @fileoverview Unit tests for Demographics Form component
 * Tests form validation, user interactions, and store integration
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DemographicsForm } from './demographics-form';
import { useRecipeWizardStore } from '../store/wizard-store';
import { RecipeWizardStep } from '../types/recipe-wizard.types';
import { AGE_CONSTRAINTS } from '../constants/wizard.constants';

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

describe('DemographicsForm', () => {
  const mockUpdateDemographics = jest.fn();
  const mockSetCurrentStep = jest.fn();
  const mockMarkStepCompleted = jest.fn();
  const mockSetError = jest.fn();
  const mockClearError = jest.fn();

  const defaultStoreState = {
    demographics: null,
    isLoading: false,
    error: null,
    updateDemographics: mockUpdateDemographics,
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
      render(<DemographicsForm />);

      expect(screen.getByRole('heading', { name: /demographics/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/gender/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/age category/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/specific age/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/language/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /continue to potential causes/i })).toBeInTheDocument();
    });

    it('should render with existing demographics data', () => {
      const existingData = {
        gender: 'female' as const,
        ageCategory: 'adult' as const,
        specificAge: 28,
        language: 'PT_BR' as const
      };
      mockUseRecipeWizardStore.mockReturnValue({
        ...defaultStoreState,
        demographics: existingData
      } as any);

      render(<DemographicsForm />);

      expect(screen.getByDisplayValue('Female')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Adult (18-64 years)')).toBeInTheDocument();
      expect(screen.getByDisplayValue('28')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Português (Brasil)')).toBeInTheDocument();
    });

    it('should display error message when present', () => {
      mockUseRecipeWizardStore.mockReturnValue({
        ...defaultStoreState,
        error: 'Test error message'
      } as any);

      render(<DemographicsForm />);

      expect(screen.getByText('Test error message')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should show validation error for missing gender', async () => {
      const user = userEvent.setup();
      render(<DemographicsForm />);

      const submitButton = screen.getByRole('button', { name: /continue to potential causes/i });
      await user.click(submitButton);

      expect(screen.getByText(/please select your gender/i)).toBeInTheDocument();
    });

    it('should show validation error for missing age category', async () => {
      const user = userEvent.setup();
      render(<DemographicsForm />);

      // Select gender but not age category
      const genderSelect = screen.getByLabelText(/gender/i);
      await user.selectOptions(genderSelect, 'male');

      const submitButton = screen.getByRole('button', { name: /continue to potential causes/i });
      await user.click(submitButton);

      expect(screen.getByText(/please select your age category/i)).toBeInTheDocument();
    });

    it('should show validation error for invalid age', async () => {
      const user = userEvent.setup();
      render(<DemographicsForm />);

      // Fill required fields
      const genderSelect = screen.getByLabelText(/gender/i);
      await user.selectOptions(genderSelect, 'female');

      const ageCategorySelect = screen.getByLabelText(/age category/i);
      await user.selectOptions(ageCategorySelect, 'adult');

      // Enter invalid age
      const ageInput = screen.getByLabelText(/specific age/i);
      await user.clear(ageInput);
      await user.type(ageInput, '150'); // Over max age

      const submitButton = screen.getByRole('button', { name: /continue to potential causes/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(new RegExp(`between ${AGE_CONSTRAINTS.MIN_AGE} and ${AGE_CONSTRAINTS.MAX_AGE}`, 'i'))).toBeInTheDocument();
      });
    });

    it('should show validation error for age not matching category', async () => {
      const user = userEvent.setup();
      render(<DemographicsForm />);

      // Fill required fields with mismatched age and category
      const genderSelect = screen.getByLabelText(/gender/i);
      await user.selectOptions(genderSelect, 'male');

      const ageCategorySelect = screen.getByLabelText(/age category/i);
      await user.selectOptions(ageCategorySelect, 'child'); // Child category

      const ageInput = screen.getByLabelText(/specific age/i);
      await user.clear(ageInput);
      await user.type(ageInput, '25'); // Adult age

      const submitButton = screen.getByRole('button', { name: /continue to potential causes/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/age does not match the selected category/i)).toBeInTheDocument();
      });
    });

    it('should accept valid form data', async () => {
      const user = userEvent.setup();
      render(<DemographicsForm />);

      // Fill all required fields with valid data
      const genderSelect = screen.getByLabelText(/gender/i);
      await user.selectOptions(genderSelect, 'female');

      const ageCategorySelect = screen.getByLabelText(/age category/i);
      await user.selectOptions(ageCategorySelect, 'adult');

      const ageInput = screen.getByLabelText(/specific age/i);
      await user.clear(ageInput);
      await user.type(ageInput, '28');

      const languageSelect = screen.getByLabelText(/language/i);
      await user.selectOptions(languageSelect, 'PT_BR');

      const submitButton = screen.getByRole('button', { name: /continue to potential causes/i });
      await user.click(submitButton);

      // Should not show validation errors
      expect(screen.queryByText(/please select/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/age does not match/i)).not.toBeInTheDocument();
    });
  });

  describe('Age Category Logic', () => {
    it('should update age input when age category changes', async () => {
      const user = userEvent.setup();
      render(<DemographicsForm />);

      const ageCategorySelect = screen.getByLabelText(/age category/i);
      await user.selectOptions(ageCategorySelect, 'child');

      const ageInput = screen.getByLabelText(/specific age/i) as HTMLInputElement;
      expect(ageInput.min).toBe('1');
      expect(ageInput.max).toBe('12');
    });

    it('should validate age range for teen category', async () => {
      const user = userEvent.setup();
      render(<DemographicsForm />);

      const genderSelect = screen.getByLabelText(/gender/i);
      await user.selectOptions(genderSelect, 'male');

      const ageCategorySelect = screen.getByLabelText(/age category/i);
      await user.selectOptions(ageCategorySelect, 'teen');

      const ageInput = screen.getByLabelText(/specific age/i);
      await user.clear(ageInput);
      await user.type(ageInput, '15'); // Valid teen age

      const languageSelect = screen.getByLabelText(/language/i);
      await user.selectOptions(languageSelect, 'EN_US');

      const submitButton = screen.getByRole('button', { name: /continue to potential causes/i });
      await user.click(submitButton);

      // Should be valid
      expect(screen.queryByText(/age does not match/i)).not.toBeInTheDocument();
    });

    it('should validate age range for senior category', async () => {
      const user = userEvent.setup();
      render(<DemographicsForm />);

      const genderSelect = screen.getByLabelText(/gender/i);
      await user.selectOptions(genderSelect, 'female');

      const ageCategorySelect = screen.getByLabelText(/age category/i);
      await user.selectOptions(ageCategorySelect, 'senior');

      const ageInput = screen.getByLabelText(/specific age/i);
      await user.clear(ageInput);
      await user.type(ageInput, '70'); // Valid senior age

      const languageSelect = screen.getByLabelText(/language/i);
      await user.selectOptions(languageSelect, 'ES_ES');

      const submitButton = screen.getByRole('button', { name: /continue to potential causes/i });
      await user.click(submitButton);

      // Should be valid
      expect(screen.queryByText(/age does not match/i)).not.toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('should call store actions on successful submission', async () => {
      const user = userEvent.setup();
      render(<DemographicsForm />);

      // Fill valid form data
      const genderSelect = screen.getByLabelText(/gender/i);
      await user.selectOptions(genderSelect, 'female');

      const ageCategorySelect = screen.getByLabelText(/age category/i);
      await user.selectOptions(ageCategorySelect, 'adult');

      const ageInput = screen.getByLabelText(/specific age/i);
      await user.clear(ageInput);
      await user.type(ageInput, '32');

      const languageSelect = screen.getByLabelText(/language/i);
      await user.selectOptions(languageSelect, 'FR_FR');

      const submitButton = screen.getByRole('button', { name: /continue to potential causes/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockUpdateDemographics).toHaveBeenCalledWith({
          gender: 'female',
          ageCategory: 'adult',
          specificAge: 32,
          language: 'FR_FR'
        });
        expect(mockMarkStepCompleted).toHaveBeenCalledWith(RecipeWizardStep.DEMOGRAPHICS);
        expect(mockSetCurrentStep).toHaveBeenCalledWith(RecipeWizardStep.POTENTIAL_CAUSES);
      });
    });

    it('should clear errors on successful submission', async () => {
      const user = userEvent.setup();
      mockUseRecipeWizardStore.mockReturnValue({
        ...defaultStoreState,
        error: 'Previous error'
      } as any);

      render(<DemographicsForm />);

      // Fill valid form data
      const genderSelect = screen.getByLabelText(/gender/i);
      await user.selectOptions(genderSelect, 'male');

      const ageCategorySelect = screen.getByLabelText(/age category/i);
      await user.selectOptions(ageCategorySelect, 'adult');

      const ageInput = screen.getByLabelText(/specific age/i);
      await user.clear(ageInput);
      await user.type(ageInput, '25');

      const submitButton = screen.getByRole('button', { name: /continue to potential causes/i });
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

      render(<DemographicsForm />);

      const submitButton = screen.getByRole('button', { name: /processing/i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('User Experience', () => {
    it('should clear validation errors when user makes changes', async () => {
      const user = userEvent.setup();
      render(<DemographicsForm />);

      // First trigger validation error
      const submitButton = screen.getByRole('button', { name: /continue to potential causes/i });
      await user.click(submitButton);

      expect(screen.getByText(/please select your gender/i)).toBeInTheDocument();

      // Then make a selection
      const genderSelect = screen.getByLabelText(/gender/i);
      await user.selectOptions(genderSelect, 'male');

      // Validation error should be cleared
      expect(screen.queryByText(/please select your gender/i)).not.toBeInTheDocument();
    });

    it('should provide helpful descriptions for each field', () => {
      render(<DemographicsForm />);

      expect(screen.getByText(/helps us provide age-appropriate recommendations/i)).toBeInTheDocument();
      expect(screen.getByText(/ensures safety considerations/i)).toBeInTheDocument();
      expect(screen.getByText(/your specific age helps us provide precise dosage/i)).toBeInTheDocument();
      expect(screen.getByText(/for personalized recommendations in your preferred language/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and descriptions', () => {
      render(<DemographicsForm />);

      const genderSelect = screen.getByLabelText(/gender/i);
      expect(genderSelect).toHaveAttribute('aria-describedby');

      const ageInput = screen.getByLabelText(/specific age/i);
      expect(ageInput).toHaveAttribute('aria-describedby');
    });

    it('should associate validation errors with form fields', async () => {
      const user = userEvent.setup();
      render(<DemographicsForm />);

      const submitButton = screen.getByRole('button', { name: /continue to potential causes/i });
      await user.click(submitButton);

      const genderSelect = screen.getByLabelText(/gender/i);
      expect(genderSelect).toHaveAttribute('aria-invalid', 'true');
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<DemographicsForm />);

      // Tab through form elements
      await user.tab(); // Gender select
      expect(screen.getByLabelText(/gender/i)).toHaveFocus();

      await user.tab(); // Age category select
      expect(screen.getByLabelText(/age category/i)).toHaveFocus();

      await user.tab(); // Age input
      expect(screen.getByLabelText(/specific age/i)).toHaveFocus();

      await user.tab(); // Language select
      expect(screen.getByLabelText(/language/i)).toHaveFocus();

      await user.tab(); // Submit button
      expect(screen.getByRole('button', { name: /continue to potential causes/i })).toHaveFocus();
    });
  });
});
