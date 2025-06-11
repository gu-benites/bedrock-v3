// src/setupTests.ts
// Jest setup file for React component testing

import '@testing-library/jest-dom';

// Mock Web APIs for Next.js API route testing
import { TextEncoder, TextDecoder } from 'util';
import { URL, URLSearchParams } from 'url';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

// Mock URL for Next.js
global.URL = URL as any;
global.URLSearchParams = URLSearchParams as any;

// Mock Request and Response for Next.js API routes
if (!global.Request) {
  global.Request = class MockRequest {
    constructor(public url: string, public init?: any) {}
    async json() {
      return this.init?.body ? JSON.parse(this.init.body) : {};
    }
    async text() {
      return this.init?.body || '';
    }
  } as any;
}

if (!global.Response) {
  global.Response = class MockResponse {
    constructor(public body: any, public init?: any) {
      this.status = init?.status || 200;
    }
    status: number;
    async json() {
      return typeof this.body === 'string' ? JSON.parse(this.body) : this.body;
    }
    static json(data: any, init?: any) {
      return new MockResponse(data, init);
    }
  } as any;
}

// Mock fetch for API calls
if (!global.fetch) {
  global.fetch = jest.fn();
}

// Mock window.URL for file upload tests
global.URL = {
  createObjectURL: jest.fn(() => 'blob:mock-url'),
  revokeObjectURL: jest.fn(),
} as any;

// Mock window.FileReader for file upload tests
global.FileReader = class MockFileReader {
  result: string | ArrayBuffer | null = null;
  error: any = null;
  readyState: number = 0;
  onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
  onloadend: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
  onerror: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;

  readAsDataURL(file: Blob): void {
    this.readyState = 2;
    this.result = `data:${file.type};base64,mock-base64-data`;
    setTimeout(() => {
      if (this.onloadend) {
        this.onloadend({} as ProgressEvent<FileReader>);
      }
    }, 0);
  }

  readAsText(file: Blob): void {
    this.readyState = 2;
    this.result = 'mock-text-content';
    setTimeout(() => {
      if (this.onloadend) {
        this.onloadend({} as ProgressEvent<FileReader>);
      }
    }, 0);
  }

  readAsArrayBuffer(file: Blob): void {
    this.readyState = 2;
    this.result = new ArrayBuffer(8);
    setTimeout(() => {
      if (this.onloadend) {
        this.onloadend({} as ProgressEvent<FileReader>);
      }
    }, 0);
  }

  abort(): void {
    this.readyState = 2;
  }

  addEventListener(): void {}
  removeEventListener(): void {}
  dispatchEvent(): boolean { return true; }
} as any;

// Mock console methods to reduce noise in tests
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// Restore console for specific tests if needed
(global as any).restoreConsole = () => {
  global.console = originalConsole;
};

// Mock ResizeObserver for components that might use it
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock IntersectionObserver for components that might use it
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock matchMedia for responsive components
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock scrollTo for components that might use it
global.scrollTo = jest.fn();

// Mock requestAnimationFrame for animations
global.requestAnimationFrame = jest.fn(cb => setTimeout(cb, 0));
global.cancelAnimationFrame = jest.fn();

// Suppress specific warnings in tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is deprecated')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
