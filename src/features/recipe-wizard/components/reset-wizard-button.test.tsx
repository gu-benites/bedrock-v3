/**
 * @fileoverview Tests for the Reset Wizard Button component.
 * Tests the reset functionality, confirmation dialog, and state clearing.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { ResetWizardButton, CompactResetWizardButton, DestructiveResetWizardButton } from './reset-wizard-button';
import { useRecipeWizardStore } from '../store/wizard-store';
import { RecipeWizardStep } from '../types/recipe-wizard.types';

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  RotateCcw: ({ className, ...props }: any) => (
    <svg className={className} {...props} data-testid="rotate-ccw-icon">
      <title>RotateCcw</title>
    </svg>
  ),
  Loader2: ({ className, ...props }: any) => (
    <svg className={className} {...props} data-testid="loader2-icon">
      <title>Loader2</title>
    </svg>
  ),
}));

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock the Recipe Wizard store
jest.mock('../store/wizard-store', () => ({
  useRecipeWizardStore: jest.fn(),
}));

// Mock localStorage and sessionStorage
const mockLocalStorage = {
  removeItem: jest.fn(),
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};

const mockSessionStorage = {
  removeItem: jest.fn(),
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
});

describe('ResetWizardButton', () => {
  const mockPush = jest.fn();
  const mockResetWizard = jest.fn();
  const mockOnResetComplete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });

    (useRecipeWizardStore as jest.Mock).mockReturnValue({
      resetWizard: mockResetWizard,
      currentStep: RecipeWizardStep.HEALTH_CONCERN,
    });

    // Reset storage mocks
    mockLocalStorage.length = 0;
    mockLocalStorage.key.mockReturnValue(null);
    mockSessionStorage.length = 0;
    mockSessionStorage.key.mockReturnValue(null);
  });

  describe('Rendering', () => {
    it('should render the reset button with default props', () => {
      render(<ResetWizardButton />);
      
      expect(screen.getByRole('button', { name: /reset wizard/i })).toBeInTheDocument();
      expect(screen.getByText('Reset Wizard')).toBeInTheDocument();
    });

    it('should render with custom children text', () => {
      render(<ResetWizardButton>Start Over</ResetWizardButton>);
      
      expect(screen.getByText('Start Over')).toBeInTheDocument();
    });

    it('should render with icon when showIcon is true', () => {
      render(<ResetWizardButton showIcon={true} />);
      
      const button = screen.getByRole('button');
      expect(button.querySelector('svg')).toBeInTheDocument();
    });

    it('should render without icon when showIcon is false', () => {
      render(<ResetWizardButton showIcon={false} />);
      
      const button = screen.getByRole('button');
      expect(button.querySelector('svg')).not.toBeInTheDocument();
    });

    it('should render compact version correctly', () => {
      render(<CompactResetWizardButton />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('title', 'Reset Recipe Wizard');
      expect(button.querySelector('svg')).toBeInTheDocument();
    });

    it('should render destructive variant correctly', () => {
      render(<DestructiveResetWizardButton />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-destructive');
    });
  });

  describe('Confirmation Dialog', () => {
    it('should open confirmation dialog when button is clicked', async () => {
      render(<ResetWizardButton />);
      
      const button = screen.getByRole('button', { name: /reset wizard/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Reset Recipe Wizard?')).toBeInTheDocument();
        expect(screen.getByText(/are you sure you want to start over/i)).toBeInTheDocument();
      });
    });

    it('should display custom confirmation title and message', async () => {
      const customTitle = 'Custom Reset Title';
      const customMessage = 'Custom reset message';
      
      render(
        <ResetWizardButton 
          confirmationTitle={customTitle}
          confirmationMessage={customMessage}
        />
      );
      
      const button = screen.getByRole('button', { name: /reset wizard/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(customTitle)).toBeInTheDocument();
        expect(screen.getByText(customMessage)).toBeInTheDocument();
      });
    });

    it('should close dialog when Cancel is clicked', async () => {
      render(<ResetWizardButton />);
      
      const button = screen.getByRole('button', { name: /reset wizard/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Reset Recipe Wizard?')).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByText('Reset Recipe Wizard?')).not.toBeInTheDocument();
      });
    });
  });

  describe('Reset Functionality', () => {
    it('should call resetWizard and navigate when confirmed', async () => {
      render(<ResetWizardButton onResetComplete={mockOnResetComplete} />);
      
      const button = screen.getByRole('button', { name: /reset wizard/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Reset Recipe Wizard?')).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /reset wizard/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockResetWizard).toHaveBeenCalledTimes(1);
        expect(mockPush).toHaveBeenCalledWith('/dashboard/recipe-wizard/health-concern');
        expect(mockOnResetComplete).toHaveBeenCalledTimes(1);
      });
    });

    it('should clear additional storage items during reset', async () => {
      // Mock storage items that should be cleared
      mockLocalStorage.length = 2;
      mockLocalStorage.key
        .mockReturnValueOnce('recipe-wizard-data')
        .mockReturnValueOnce('other-data');
      
      mockSessionStorage.length = 1;
      mockSessionStorage.key.mockReturnValueOnce('recipeWizard-session');

      render(<ResetWizardButton />);
      
      const button = screen.getByRole('button', { name: /reset wizard/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Reset Recipe Wizard?')).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /reset wizard/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('recipeWizard-session');
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('recipe-wizard-data');
      });
    });

    it('should handle storage errors gracefully', async () => {
      // Mock storage to have items and throw errors when removing
      mockSessionStorage.length = 1;
      mockSessionStorage.key.mockReturnValue('recipeWizard-session');
      mockSessionStorage.removeItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      render(<ResetWizardButton />);

      const button = screen.getByRole('button', { name: /reset wizard/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Reset Recipe Wizard?')).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /reset wizard/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockResetWizard).toHaveBeenCalledTimes(1);
        expect(mockPush).toHaveBeenCalledWith('/dashboard/recipe-wizard/health-concern');
        expect(consoleSpy).toHaveBeenCalledWith(
          'Error clearing additional storage during reset:',
          expect.any(Error)
        );
      }, { timeout: 3000 });

      consoleSpy.mockRestore();
    });

    it('should handle reset process correctly', async () => {
      render(<ResetWizardButton />);

      const button = screen.getByRole('button', { name: /reset wizard/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Reset Recipe Wizard?')).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /reset wizard/i });
      fireEvent.click(confirmButton);

      // Verify the reset process completes
      await waitFor(() => {
        expect(mockResetWizard).toHaveBeenCalledTimes(1);
        expect(mockPush).toHaveBeenCalledWith('/dashboard/recipe-wizard/health-concern');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<CompactResetWizardButton />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('title', 'Reset Recipe Wizard');
    });

    it('should be keyboard accessible', async () => {
      render(<ResetWizardButton />);

      const button = screen.getByRole('button', { name: /reset wizard/i });

      // Focus and activate with keyboard - use click instead of keyDown for AlertDialog
      button.focus();
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Reset Recipe Wizard?')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle reset errors gracefully', async () => {
      mockResetWizard.mockImplementation(() => {
        throw new Error('Reset failed');
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(<ResetWizardButton />);
      
      const button = screen.getByRole('button', { name: /reset wizard/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Reset Recipe Wizard?')).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /reset wizard/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          '❌ Error resetting Recipe Wizard:',
          expect.any(Error)
        );
        expect(mockPush).toHaveBeenCalledWith('/dashboard/recipe-wizard/health-concern');
      });

      consoleSpy.mockRestore();
    });
  });
});
