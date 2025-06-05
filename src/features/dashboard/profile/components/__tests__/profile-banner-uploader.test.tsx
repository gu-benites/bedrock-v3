// src/features/dashboard/profile/components/__tests__/profile-banner-uploader.test.tsx

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import ProfileBannerUploader from '../profile-banner-uploader';
import { useToast } from '@/hooks/use-toast';
import { useImageUpload } from '@/hooks';
import { validateImageFile, getImageValidationErrorMessage } from '@/features/user-auth-data/utils/image-validation.utils';

// Mock dependencies
jest.mock('@/hooks/use-toast');
jest.mock('@/hooks');
jest.mock('@/features/user-auth-data/utils/image-validation.utils');

// Mock UI components
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, variant, size, className, ...props }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={className}
      data-variant={variant}
      data-size={size}
      {...props}
      data-testid="button"
    >
      {children}
    </button>
  ),
}));

// Mock Lucide icons
jest.mock('lucide-react', () => ({
  ImagePlus: ({ className }: any) => <div data-testid="image-plus-icon" className={className} />,
  X: () => <div data-testid="x-icon" />,
  Loader2: ({ className }: any) => <div data-testid="loading-spinner" className={className} />,
  AlertCircle: () => <div data-testid="error-indicator" />,
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

describe('ProfileBannerUploader', () => {
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
    name: 'bannerDataUri',
  };

  describe('Rendering', () => {
    it('should render banner uploader with default state', () => {
      render(
        <TestWrapper>
          <ProfileBannerUploader {...defaultProps} />
        </TestWrapper>
      );

      // Should render the banner container
      expect(screen.getByTestId('banner-container')).toBeInTheDocument();
      // Should show placeholder when no image (there are multiple ImagePlus icons)
      expect(screen.getAllByTestId('image-plus-icon')).toHaveLength(2); // One in placeholder, one in button
    });

    it('should render with default image when provided', () => {
      const defaultImage = 'https://example.com/banner.jpg';

      (useImageUpload as jest.Mock).mockReturnValue({
        ...mockUseImageUpload,
        previewUrl: defaultImage,
      });

      render(
        <TestWrapper>
          <ProfileBannerUploader {...defaultProps} defaultImage={defaultImage} />
        </TestWrapper>
      );

      const bannerImage = screen.getByAltText('Profile banner');
      expect(bannerImage).toHaveAttribute('src', defaultImage);
    });

    it('should show placeholder when no image is provided', () => {
      render(
        <TestWrapper>
          <ProfileBannerUploader {...defaultProps} />
        </TestWrapper>
      );

      // Should show the gradient placeholder with ImagePlus icon (multiple icons expected)
      expect(screen.getAllByTestId('image-plus-icon').length).toBeGreaterThan(0);
    });

    it('should show loading state when isPending is true', () => {
      render(
        <TestWrapper>
          <ProfileBannerUploader {...defaultProps} isPending={true} />
        </TestWrapper>
      );

      expect(screen.getByTestId('banner-container')).toHaveClass('opacity-75');
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('should show error state when error is provided', () => {
      const errorMessage = 'Upload failed';
      
      render(
        <TestWrapper>
          <ProfileBannerUploader {...defaultProps} error={errorMessage} />
        </TestWrapper>
      );

      expect(screen.getByTestId('banner-container')).toHaveClass('border-2', 'border-destructive');
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(screen.getByTestId('error-indicator')).toBeInTheDocument();
    });

    it('should show remove button when image exists', () => {
      const defaultImage = 'https://example.com/banner.jpg';
      
      (useImageUpload as jest.Mock).mockReturnValue({
        ...mockUseImageUpload,
        previewUrl: defaultImage,
      });

      render(
        <TestWrapper>
          <ProfileBannerUploader {...defaultProps} defaultImage={defaultImage} />
        </TestWrapper>
      );

      expect(screen.getByLabelText('Remove banner image')).toBeInTheDocument();
      expect(screen.getByLabelText('Change banner image')).toBeInTheDocument();
    });

    it('should be disabled when disabled prop is true', () => {
      render(
        <TestWrapper>
          <ProfileBannerUploader {...defaultProps} disabled={true} />
        </TestWrapper>
      );

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      expect(fileInput).toBeDisabled();

      // When disabled, the upload button is not rendered, so we just check the file input
      expect(screen.queryByLabelText('Upload banner image')).not.toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should trigger file input click when upload button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ProfileBannerUploader {...defaultProps} />
        </TestWrapper>
      );

      const uploadButton = screen.getByLabelText('Upload banner image');
      await user.click(uploadButton);

      expect(mockUseImageUpload.handleTriggerClick).toHaveBeenCalled();
    });

    it('should call onRemove when remove button is clicked', async () => {
      const user = userEvent.setup();
      const onRemove = jest.fn();
      const defaultImage = 'https://example.com/banner.jpg';
      
      (useImageUpload as jest.Mock).mockReturnValue({
        ...mockUseImageUpload,
        previewUrl: defaultImage,
      });

      render(
        <TestWrapper>
          <ProfileBannerUploader {...defaultProps} defaultImage={defaultImage} onRemove={onRemove} />
        </TestWrapper>
      );

      const removeButton = screen.getByLabelText('Remove banner image');
      await user.click(removeButton);

      expect(onRemove).toHaveBeenCalled();
    });

    it('should call hook remove when no onRemove prop is provided', async () => {
      const user = userEvent.setup();
      const defaultImage = 'https://example.com/banner.jpg';
      
      (useImageUpload as jest.Mock).mockReturnValue({
        ...mockUseImageUpload,
        previewUrl: defaultImage,
      });

      render(
        <TestWrapper>
          <ProfileBannerUploader {...defaultProps} defaultImage={defaultImage} />
        </TestWrapper>
      );

      const removeButton = screen.getByLabelText('Remove banner image');
      await user.click(removeButton);

      expect(mockUseImageUpload.handleRemove).toHaveBeenCalled();
    });
  });

  describe('File Upload Validation', () => {
    it('should validate file and show success toast for large files', async () => {
      const mockFile = new File(['test'], 'test.png', { type: 'image/png' });
      Object.defineProperty(mockFile, 'size', { value: 3 * 1024 * 1024 }); // 3MB

      mockValidateImageFile.mockReturnValue({
        isValid: true,
        metadata: { size: 3 * 1024 * 1024, type: 'image/png' }
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
          <ProfileBannerUploader {...defaultProps} />
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
          description: "Banner image (3MB) uploaded successfully.",
          variant: "default"
        });
      });
    });

    it('should not show success toast for small files', async () => {
      const mockFile = new File(['test'], 'test.png', { type: 'image/png' });
      Object.defineProperty(mockFile, 'size', { value: 1024 * 1024 }); // 1MB

      mockValidateImageFile.mockReturnValue({
        isValid: true,
        metadata: { size: 1024 * 1024, type: 'image/png' }
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
          <ProfileBannerUploader {...defaultProps} />
        </TestWrapper>
      );

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [mockFile] } });
      });

      await waitFor(() => {
        expect(mockValidateImageFile).toHaveBeenCalledWith(mockFile);
        expect(mockToast).not.toHaveBeenCalledWith(
          expect.objectContaining({
            title: "Image Uploaded"
          })
        );
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
          <ProfileBannerUploader {...defaultProps} />
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
          <ProfileBannerUploader {...defaultProps} />
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
          <ProfileBannerUploader {...defaultProps} error={errorMessage} />
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
          <ProfileBannerUploader {...defaultProps} error={errorObject} />
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
          <ProfileBannerUploader {...defaultProps} />
        </TestWrapper>
      );

      // Check for banner container and upload functionality
      expect(screen.getByTestId('banner-container')).toBeInTheDocument();
      expect(screen.getByLabelText('Upload banner image')).toBeInTheDocument();
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      expect(fileInput).toHaveAttribute('accept', 'image/png, image/jpeg, image/webp, image/gif');
    });

    it('should have proper ARIA labels when image exists', () => {
      const defaultImage = 'https://example.com/banner.jpg';
      
      (useImageUpload as jest.Mock).mockReturnValue({
        ...mockUseImageUpload,
        previewUrl: defaultImage,
      });

      render(
        <TestWrapper>
          <ProfileBannerUploader {...defaultProps} defaultImage={defaultImage} />
        </TestWrapper>
      );

      expect(screen.getByLabelText('Change banner image')).toBeInTheDocument();
      expect(screen.getByLabelText('Remove banner image')).toBeInTheDocument();
    });

    it('should have proper alt text for banner image', () => {
      const defaultImage = 'https://example.com/banner.jpg';
      
      (useImageUpload as jest.Mock).mockReturnValue({
        ...mockUseImageUpload,
        previewUrl: defaultImage,
      });

      render(
        <TestWrapper>
          <ProfileBannerUploader {...defaultProps} defaultImage={defaultImage} />
        </TestWrapper>
      );

      expect(screen.getByAltText('Profile banner')).toBeInTheDocument();
    });
  });

  describe('Component Lifecycle', () => {
    it('should handle defaultImage prop changes', () => {
      const { rerender } = render(
        <TestWrapper>
          <ProfileBannerUploader {...defaultProps} defaultImage="https://example.com/banner1.jpg" />
        </TestWrapper>
      );

      // Rerender with new defaultImage
      rerender(
        <TestWrapper>
          <ProfileBannerUploader {...defaultProps} defaultImage="https://example.com/banner2.jpg" />
        </TestWrapper>
      );

      // The useEffect should be triggered with the new defaultImage
      expect(useImageUpload).toHaveBeenCalledWith(
        expect.objectContaining({
          initialPreviewUrl: "https://example.com/banner2.jpg"
        })
      );
    });
  });
});
