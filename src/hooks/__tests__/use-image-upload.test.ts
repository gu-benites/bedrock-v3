// src/hooks/__tests__/use-image-upload.test.ts

import { renderHook, act } from '@testing-library/react';
import { useImageUpload } from '../use-image-upload';

// Mock console methods to reduce noise in tests
const originalConsole = global.console;
beforeAll(() => {
  global.console = {
    ...originalConsole,
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  };
});

afterAll(() => {
  global.console = originalConsole;
});

// Mock URL.createObjectURL and revokeObjectURL
global.URL = {
  createObjectURL: jest.fn(() => 'blob:mock-url'),
  revokeObjectURL: jest.fn(),
} as any;

// Mock FileReader
const mockFileReader = {
  readAsDataURL: jest.fn(),
  result: null,
  onloadend: null,
  onerror: null,
};

global.FileReader = jest.fn(() => mockFileReader) as any;

describe('useImageUpload', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFileReader.result = null;
    mockFileReader.onloadend = null;
    mockFileReader.onerror = null;
    (global.URL.createObjectURL as jest.Mock).mockReturnValue('blob:mock-url');
  });

  const defaultProps = {
    onUpload: jest.fn(),
  };

  describe('Initialization', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useImageUpload(defaultProps));

      expect(result.current.previewUrl).toBeNull();
      expect(result.current.fileName).toBeNull();
      expect(result.current.fileInputRef.current).toBeNull();
      expect(typeof result.current.handleTriggerClick).toBe('function');
      expect(typeof result.current.handleFileChange).toBe('function');
      expect(typeof result.current.handleRemove).toBe('function');
    });

    it('should initialize with initial preview URL', () => {
      const initialPreviewUrl = 'https://example.com/image.jpg';
      const { result } = renderHook(() =>
        useImageUpload({ onUpload: jest.fn(), initialPreviewUrl })
      );

      expect(result.current.previewUrl).toBe(initialPreviewUrl);
    });
  });

  describe('File Input Trigger', () => {
    it('should trigger file input click', () => {
      const { result } = renderHook(() => useImageUpload(defaultProps));
      
      // Mock the file input element
      const mockFileInput = {
        click: jest.fn(),
      };
      
      // Set the ref
      act(() => {
        result.current.fileInputRef.current = mockFileInput as any;
      });

      // Trigger click
      act(() => {
        result.current.handleTriggerClick();
      });

      expect(mockFileInput.click).toHaveBeenCalled();
    });

    it('should handle missing file input ref gracefully', () => {
      const { result } = renderHook(() => useImageUpload(defaultProps));

      // Should not throw when ref is null
      expect(() => {
        act(() => {
          result.current.handleTriggerClick();
        });
      }).not.toThrow();
    });
  });

  describe('File Change Handling', () => {
    it('should handle file selection and reading', async () => {
      const onUpload = jest.fn();
      const { result } = renderHook(() => useImageUpload({ onUpload }));

      const mockFile = new File(['test'], 'test.png', { type: 'image/png' });
      const mockEvent = {
        target: {
          files: [mockFile],
        },
      } as any;

      // Mock FileReader behavior
      mockFileReader.readAsDataURL.mockImplementation(() => {
        mockFileReader.result = 'data:image/png;base64,test';
        // Simulate async file reading
        setTimeout(() => {
          if (mockFileReader.onloadend) {
            mockFileReader.onloadend({} as any);
          }
        }, 0);
      });

      act(() => {
        result.current.handleFileChange(mockEvent);
      });

      // Wait for async file reading
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      expect(mockFileReader.readAsDataURL).toHaveBeenCalledWith(mockFile);
      expect(onUpload).toHaveBeenCalledWith(mockFile, 'data:image/png;base64,test');
      expect(result.current.previewUrl).toBe('blob:mock-url'); // Should be blob URL initially
      expect(result.current.fileName).toBe('test.png');
    });

    it('should handle file reading error', async () => {
      const onUpload = jest.fn();
      const { result } = renderHook(() => useImageUpload({ onUpload }));

      const mockFile = new File(['test'], 'test.png', { type: 'image/png' });
      const mockEvent = {
        target: {
          files: [mockFile],
        },
      } as any;

      // Mock FileReader error
      mockFileReader.readAsDataURL.mockImplementation(() => {
        setTimeout(() => {
          if (mockFileReader.onerror) {
            mockFileReader.onerror({} as any);
          }
        }, 0);
      });

      act(() => {
        result.current.handleFileChange(mockEvent);
      });

      // Wait for async file reading
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      expect(onUpload).toHaveBeenCalledWith(mockFile, null);
      expect(result.current.previewUrl).toBe('blob:mock-url'); // Still shows blob URL even if reading fails
      expect(result.current.fileName).toBe('test.png');
    });

    it('should handle empty file selection', () => {
      const onUpload = jest.fn();
      const { result } = renderHook(() => useImageUpload({ onUpload }));

      const mockEvent = {
        target: {
          files: [],
        },
      } as any;

      act(() => {
        result.current.handleFileChange(mockEvent);
      });

      expect(mockFileReader.readAsDataURL).not.toHaveBeenCalled();
      expect(onUpload).toHaveBeenCalledWith(null, null); // Hook calls onUpload even for empty selection
    });

    it('should handle null files', () => {
      const onUpload = jest.fn();
      const { result } = renderHook(() => useImageUpload({ onUpload }));

      const mockEvent = {
        target: {
          files: null,
        },
      } as any;

      act(() => {
        result.current.handleFileChange(mockEvent);
      });

      expect(mockFileReader.readAsDataURL).not.toHaveBeenCalled();
      expect(onUpload).toHaveBeenCalledWith(null, null); // Hook calls onUpload even for null files
    });
  });

  describe('Remove Handling', () => {
    it('should handle remove and call onUpload with null values', () => {
      const onUpload = jest.fn();
      const { result } = renderHook(() => useImageUpload({ onUpload }));

      act(() => {
        result.current.handleRemove();
      });

      expect(onUpload).toHaveBeenCalledWith(null, null);
      expect(result.current.fileName).toBeNull();
    });

    it('should revoke blob URL when removing', () => {
      const onUpload = jest.fn();
      const { result } = renderHook(() => useImageUpload({ onUpload }));

      // First select a file to create a blob URL
      const mockFile = new File(['test'], 'test.png', { type: 'image/png' });
      const mockEvent = { target: { files: [mockFile] } } as any;

      act(() => {
        result.current.handleFileChange(mockEvent);
      });

      expect(global.URL.createObjectURL).toHaveBeenCalledWith(mockFile);

      // Now remove
      act(() => {
        result.current.handleRemove();
      });

      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
      expect(result.current.fileName).toBeNull();
    });
  });

  describe('Preview URL Updates', () => {
    it('should update preview URL when initialPreviewUrl changes', () => {
      const { result, rerender } = renderHook(
        ({ initialPreviewUrl }) => useImageUpload({ ...defaultProps, initialPreviewUrl }),
        { initialProps: { initialPreviewUrl: 'https://example.com/image1.jpg' } }
      );

      expect(result.current.previewUrl).toBe('https://example.com/image1.jpg');

      // Change the initial preview URL
      rerender({ initialPreviewUrl: 'https://example.com/image2.jpg' });

      expect(result.current.previewUrl).toBe('https://example.com/image2.jpg');
    });

    it('should handle undefined initialPreviewUrl', () => {
      const { result, rerender } = renderHook(
        ({ initialPreviewUrl }) => useImageUpload({ ...defaultProps, initialPreviewUrl }),
        { initialProps: { initialPreviewUrl: 'https://example.com/image1.jpg' } }
      );

      expect(result.current.previewUrl).toBe('https://example.com/image1.jpg');

      // Change to undefined
      rerender({ initialPreviewUrl: undefined });

      expect(result.current.previewUrl).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple rapid file changes', async () => {
      const onUpload = jest.fn();
      const { result } = renderHook(() => useImageUpload({ onUpload }));

      const mockFile1 = new File(['test1'], 'test1.png', { type: 'image/png' });
      const mockFile2 = new File(['test2'], 'test2.png', { type: 'image/png' });

      const mockEvent1 = { target: { files: [mockFile1] } } as any;
      const mockEvent2 = { target: { files: [mockFile2] } } as any;

      // Mock FileReader to complete immediately
      mockFileReader.readAsDataURL.mockImplementation(() => {
        mockFileReader.result = 'data:image/png;base64,test';
        if (mockFileReader.onloadend) {
          mockFileReader.onloadend({} as any);
        }
      });

      act(() => {
        result.current.handleFileChange(mockEvent1);
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      act(() => {
        result.current.handleFileChange(mockEvent2);
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      // Should handle both file changes
      expect(onUpload).toHaveBeenCalledWith(mockFile1, 'data:image/png;base64,test');
      expect(onUpload).toHaveBeenCalledWith(mockFile2, 'data:image/png;base64,test');
      expect(result.current.fileName).toBe('test2.png');
    });

    it('should handle FileReader not being available', () => {
      // Temporarily remove FileReader
      const originalFileReader = global.FileReader;
      delete (global as any).FileReader;

      const onUpload = jest.fn();
      const { result } = renderHook(() => useImageUpload({ onUpload }));

      const mockFile = new File(['test'], 'test.png', { type: 'image/png' });
      const mockEvent = { target: { files: [mockFile] } } as any;

      expect(() => {
        act(() => {
          result.current.handleFileChange(mockEvent);
        });
      }).toThrow('FileReader is not defined');

      // Restore FileReader
      global.FileReader = originalFileReader;
    });
  });
});
