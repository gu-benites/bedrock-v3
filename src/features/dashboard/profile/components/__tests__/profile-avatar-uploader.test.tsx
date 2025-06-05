// src/features/dashboard/profile/components/__tests__/profile-avatar-uploader.test.tsx

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { ProfileAvatarUploader } from '../profile-avatar-uploader';
import { useToast } from '@/hooks/use-toast';
import { useImageUpload } from '@/hooks';
import { validateImageFile, getImageValidationErrorMessage } from '@/features/user-auth-data/utils/image-validation.utils';

// Mock dependencies
jest.mock('@/hooks/use-toast');
jest.mock('@/hooks');
jest.mock('@/features/user-auth-data/utils/image-validation.utils');

// Mock UI components
jest.mock('@/components/ui/avatar', () => ({
  Avatar: ({ children, className }: any) => <div className={className} data-testid="avatar">{children}</div>,
  AvatarFallback: ({ children }: any) => <div data-testid="avatar-fallback">{children}</div>,
  AvatarImage: ({ src, alt }: any) => src ? <img src={src} alt={alt} data-testid="avatar-image" /> : null,
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props} data-testid="button">
      {children}
    </button>
  ),
}));

// Mock Lucide icons
jest.mock('lucide-react', () => ({
  ImagePlus: () => <div data-testid="image-plus-icon" />,
  X: () => <div data-testid="x-icon" />,
  Loader2: ({ className }: any) => <div data-testid="loading-spinner" className={className} />,
  AlertCircle: () => <div data-testid="error-indicator" />,
  UserCircle2: () => <div data-testid="user-circle-icon" />,
}));

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { control } = useForm();
  return (
    <div>
      {React.cloneElement(children as React.ReactElement, { control })}
    </div>
  );
};

// Mock implementations
const mockToast = jest.fn();
const mockUseImageUpload = {
  previewUrl: null,
  fileInputRef: { current: null },
  handleTriggerClick: jest.fn(),
  handleFileChange: jest.fn(),
  handleRemove: jest.fn(),
};

const mockValidateImageFile = validateImageFile as jest.MockedFunction<typeof validateImageFile>;
const mockGetImageValidationErrorMessage = getImageValidationErrorMessage as jest.MockedFunction<typeof getImageValidationErrorMessage>;

describe('ProfileAvatarUploader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    (useToast as jest.Mock).mockReturnValue({ toast: mockToast });
    (useImageUpload as jest.Mock).mockReturnValue(mockUseImageUpload);
    
    mockValidateImageFile.mockReturnValue({
      isValid: true,
      metadata: { size: 1024, type: 'image/png' }
    });
    
    mockGetImageValidationErrorMessage.mockReturnValue('Validation error message');
  });

  const defaultProps = {
    name: 'avatarDataUri',
    displayName: 'John Doe',
    getInitialsFn: () => 'JD',
  };

  describe('Rendering', () => {
    it('should render avatar uploader with default state', () => {
      render(
        <TestWrapper>
          <ProfileAvatarUploader {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByTestId('avatar')).toBeInTheDocument();
      expect(screen.getByTestId('avatar-fallback')).toBeInTheDocument();
      expect(screen.getByText('JD')).toBeInTheDocument();
    });

    it('should render with default image when provided', () => {
      const defaultImage = 'https://example.com/avatar.jpg';
      
      render(
        <TestWrapper>
          <ProfileAvatarUploader {...defaultProps} defaultImage={defaultImage} />
        </TestWrapper>
      );

      expect(screen.getByTestId('avatar-image')).toHaveAttribute('src', defaultImage);
    });

    it('should show loading state when isPending is true', () => {
      render(
        <TestWrapper>
          <ProfileAvatarUploader {...defaultProps} isPending={true} />
        </TestWrapper>
      );

      expect(screen.getByTestId('avatar')).toHaveClass('opacity-75');
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('should show error state when error is provided', () => {
      const errorMessage = 'Upload failed';
      
      render(
        <TestWrapper>
          <ProfileAvatarUploader {...defaultProps} error={errorMessage} />
        </TestWrapper>
      );

      expect(screen.getByTestId('avatar')).toHaveClass('border-destructive');
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(screen.getByTestId('error-indicator')).toBeInTheDocument();
    });

    it('should show remove button when image exists and onRemove is provided', () => {
      const onRemove = jest.fn();
      const defaultImage = 'https://example.com/avatar.jpg';
      
      (useImageUpload as jest.Mock).mockReturnValue({
        ...mockUseImageUpload,
        previewUrl: defaultImage,
      });

      render(
        <TestWrapper>
          <ProfileAvatarUploader {...defaultProps} defaultImage={defaultImage} onRemove={onRemove} />
        </TestWrapper>
      );

      expect(screen.getByLabelText('Remove avatar')).toBeInTheDocument();
    });

    it('should be disabled when disabled prop is true', () => {
      render(
        <TestWrapper>
          <ProfileAvatarUploader {...defaultProps} disabled={true} />
        </TestWrapper>
      );

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      expect(fileInput).toBeDisabled();
    });
  });

  describe('User Interactions', () => {
    it('should trigger file input click when avatar is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ProfileAvatarUploader {...defaultProps} />
        </TestWrapper>
      );

      const uploadOverlay = screen.getByRole('button', { name: 'Change profile picture' });
      await user.click(uploadOverlay);

      expect(mockUseImageUpload.handleTriggerClick).toHaveBeenCalled();
    });

    it('should handle keyboard navigation (Enter key)', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ProfileAvatarUploader {...defaultProps} />
        </TestWrapper>
      );

      const uploadOverlay = screen.getByRole('button', { name: 'Change profile picture' });
      await user.type(uploadOverlay, '{enter}');

      expect(mockUseImageUpload.handleTriggerClick).toHaveBeenCalled();
    });

    it('should handle keyboard navigation (Space key)', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ProfileAvatarUploader {...defaultProps} />
        </TestWrapper>
      );

      const uploadOverlay = screen.getByRole('button', { name: 'Change profile picture' });
      await user.type(uploadOverlay, ' ');

      expect(mockUseImageUpload.handleTriggerClick).toHaveBeenCalled();
    });

    it('should call onRemove when remove button is clicked', async () => {
      const user = userEvent.setup();
      const onRemove = jest.fn();
      const defaultImage = 'https://example.com/avatar.jpg';
      
      (useImageUpload as jest.Mock).mockReturnValue({
        ...mockUseImageUpload,
        previewUrl: defaultImage,
      });

      render(
        <TestWrapper>
          <ProfileAvatarUploader {...defaultProps} defaultImage={defaultImage} onRemove={onRemove} />
        </TestWrapper>
      );

      const removeButton = screen.getByLabelText('Remove avatar');
      await user.click(removeButton);

      expect(onRemove).toHaveBeenCalled();
    });
  });

  describe('File Upload Validation', () => {
    it('should validate file and show success toast for large files', async () => {
      const mockFile = new File(['test'], 'test.png', { type: 'image/png' });
      Object.defineProperty(mockFile, 'size', { value: 2 * 1024 * 1024 }); // 2MB

      mockValidateImageFile.mockReturnValue({
        isValid: true,
        metadata: { size: 2 * 1024 * 1024, type: 'image/png' }
      });

      // Mock the onUpload callback that will be called by the component
      let onUploadCallback: ((file: File | null, dataUrl: string | null) => void) | null = null;

      (useImageUpload as jest.Mock).mockImplementation(({ onUpload }: any) => {
        onUploadCallback = onUpload;
        return {
          ...mockUseImageUpload,
          handleFileChange: jest.fn((event: any) => {
            const file = event.target.files?.[0];
            if (file && onUploadCallback) {
              // Simulate the file reading process
              onUploadCallback(file, 'data:image/png;base64,test');
            }
          }),
        };
      });

      render(
        <TestWrapper>
          <ProfileAvatarUploader {...defaultProps} />
        </TestWrapper>
      );

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [mockFile] } });
      });

      await waitFor(() => {
        expect(mockValidateImageFile).toHaveBeenCalledWith(mockFile);
        expect(mockToast).toHaveBeenCalledWith({
          title: "Image Uploaded",
          description: "Avatar image (2MB) uploaded successfully.",
          variant: "default"
        });
      });
    });

    it('should show error toast for invalid files', async () => {
      const mockFile = new File(['test'], 'test.bmp', { type: 'image/bmp' });

      mockValidateImageFile.mockReturnValue({
        isValid: false,
        error: {
          code: 'UNSUPPORTED_TYPE',
          message: 'Unsupported file type',
          details: {}
        }
      });

      mockGetImageValidationErrorMessage.mockReturnValue('Please select a valid image file');

      // Mock the onUpload callback that will be called by the component
      let onUploadCallback: ((file: File | null, dataUrl: string | null) => void) | null = null;

      (useImageUpload as jest.Mock).mockImplementation(({ onUpload }: any) => {
        onUploadCallback = onUpload;
        return {
          ...mockUseImageUpload,
          handleFileChange: jest.fn((event: any) => {
            const file = event.target.files?.[0];
            if (file && onUploadCallback) {
              // Simulate the file reading process
              onUploadCallback(file, null);
            }
          }),
        };
      });

      render(
        <TestWrapper>
          <ProfileAvatarUploader {...defaultProps} />
        </TestWrapper>
      );

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [mockFile] } });
      });

      await waitFor(() => {
        expect(mockValidateImageFile).toHaveBeenCalledWith(mockFile);
        expect(mockToast).toHaveBeenCalledWith({
          title: "Invalid Image",
          description: "Please select a valid image file",
          variant: "destructive"
        });
      });
    });

    it('should handle upload errors gracefully', async () => {
      const mockFile = new File(['test'], 'test.png', { type: 'image/png' });

      // Mock validation to throw an error
      mockValidateImageFile.mockImplementation(() => {
        throw new Error('Validation error');
      });

      // Mock the onUpload callback that will be called by the component
      let onUploadCallback: ((file: File | null, dataUrl: string | null) => void) | null = null;

      (useImageUpload as jest.Mock).mockImplementation(({ onUpload }: any) => {
        onUploadCallback = onUpload;
        return {
          ...mockUseImageUpload,
          handleFileChange: jest.fn((event: any) => {
            const file = event.target.files?.[0];
            if (file && onUploadCallback) {
              // Simulate the file reading process
              onUploadCallback(file, 'data:image/png;base64,test');
            }
          }),
        };
      });

      render(
        <TestWrapper>
          <ProfileAvatarUploader {...defaultProps} />
        </TestWrapper>
      );

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [mockFile] } });
      });

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "Upload Error",
          description: "An error occurred while processing the image. Please try again.",
          variant: "destructive"
        });
      });
    });
  });

  describe('Error Display', () => {
    it('should display string error messages', () => {
      const errorMessage = 'Upload failed';
      
      render(
        <TestWrapper>
          <ProfileAvatarUploader {...defaultProps} error={errorMessage} />
        </TestWrapper>
      );

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('should display error object messages using validation utility', () => {
      const errorObject = {
        code: 'FILE_TOO_LARGE' as const,
        message: 'File too large',
        details: {}
      };
      
      mockGetImageValidationErrorMessage.mockReturnValue('File size exceeds limit');
      
      render(
        <TestWrapper>
          <ProfileAvatarUploader {...defaultProps} error={errorObject} />
        </TestWrapper>
      );

      expect(mockGetImageValidationErrorMessage).toHaveBeenCalledWith(errorObject);
      expect(screen.getByText('File size exceeds limit')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(
        <TestWrapper>
          <ProfileAvatarUploader {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByRole('button', { name: 'Change profile picture' })).toBeInTheDocument();
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      expect(fileInput).toHaveAttribute('accept', 'image/png, image/jpeg, image/webp, image/gif');
    });

    it('should have proper ARIA label for remove button', () => {
      const onRemove = jest.fn();
      const defaultImage = 'https://example.com/avatar.jpg';
      
      (useImageUpload as jest.Mock).mockReturnValue({
        ...mockUseImageUpload,
        previewUrl: defaultImage,
      });

      render(
        <TestWrapper>
          <ProfileAvatarUploader {...defaultProps} defaultImage={defaultImage} onRemove={onRemove} />
        </TestWrapper>
      );

      expect(screen.getByLabelText('Remove avatar')).toBeInTheDocument();
    });

    it('should support keyboard navigation', () => {
      render(
        <TestWrapper>
          <ProfileAvatarUploader {...defaultProps} />
        </TestWrapper>
      );

      const uploadOverlay = screen.getByRole('button', { name: 'Change profile picture' });
      expect(uploadOverlay).toHaveAttribute('tabIndex', '0');
    });
  });
});
