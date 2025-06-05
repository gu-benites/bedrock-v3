// src/features/user-auth-data/utils/__tests__/test-utils.ts
// Test utilities and setup helpers (not a test file)

// Jest is configured for this project

// Mock Buffer for Node.js environment
if (typeof global.Buffer === 'undefined') {
  global.Buffer = Buffer;
}

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// Mock setTimeout and clearTimeout for testing retry logic
global.setTimeout = jest.fn((callback, delay) => {
  if (typeof callback === 'function') {
    // Execute immediately in tests unless we specifically need to test timing
    callback();
  }
  return 1 as any;
});

global.clearTimeout = jest.fn();

// Mock URL and Blob for browser APIs
if (typeof global.URL === 'undefined') {
  global.URL = {
    createObjectURL: jest.fn(() => 'blob:mock-url'),
    revokeObjectURL: jest.fn(),
  } as any;
}

if (typeof global.Blob === 'undefined') {
  global.Blob = class MockBlob {
    size: number;
    type: string;

    constructor(parts?: any[], options?: { type?: string }) {
      this.size = parts ? parts.reduce((acc, part) => acc + (part.length || 0), 0) : 0;
      this.type = options?.type || '';
    }

    slice() {
      return new MockBlob();
    }

    stream() {
      return new ReadableStream();
    }

    text() {
      return Promise.resolve('');
    }

    arrayBuffer() {
      return Promise.resolve(new ArrayBuffer(this.size));
    }
  } as any;
}

// Mock Image constructor for dimension validation tests
if (typeof global.Image === 'undefined') {
  global.Image = class MockImage {
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    src: string = '';
    width: number = 0;
    height: number = 0;

    constructor() {
      // Default behavior - can be overridden in individual tests
      setTimeout(() => {
        this.width = 800;
        this.height = 600;
        this.onload?.();
      }, 0);
    }
  } as any;
}

// Mock ReadableStream for Blob.stream()
if (typeof global.ReadableStream === 'undefined') {
  global.ReadableStream = class MockReadableStream {
    constructor() {}
    
    getReader() {
      return {
        read: () => Promise.resolve({ done: true, value: undefined }),
        releaseLock: () => {},
        cancel: () => Promise.resolve(),
      };
    }
  } as any;
}

// Export test utilities
export const createMockFile = (name: string, size: number, type: string) => {
  return {
    name,
    size,
    type,
    lastModified: Date.now(),
    webkitRelativePath: '',
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(size)),
    slice: () => new global.Blob(),
    stream: () => new global.ReadableStream(),
    text: () => Promise.resolve(''),
  } as File;
};

export const createMockDataUri = (type: string, sizeInBytes: number = 1000) => {
  // Create base64 data that approximates the desired size
  const base64Length = Math.ceil(sizeInBytes * 4 / 3);
  const base64Data = 'A'.repeat(base64Length);
  return `data:image/${type};base64,${base64Data}`;
};

export const createMockSupabaseClient = () => {
  return {
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn().mockResolvedValue({
          data: { path: 'test-path', id: 'test-id', fullPath: 'full-test-path' },
          error: null
        }),
        remove: jest.fn().mockResolvedValue({ error: null }),
        getPublicUrl: jest.fn().mockReturnValue({
          data: { publicUrl: 'https://example.com/test-url' }
        })
      }))
    }
  };
};

export const createMockLogger = () => {
  return {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  };
};

// Reset all mocks before each test
export const resetAllMocks = () => {
  jest.clearAllMocks();
};
