// src/lib/ai/utils/stream-helpers.test.ts
// Unit tests for streaming utilities (CRITICAL - test-first development)

import {
  createSSEConnection,
  processStreamEvent,
  parseStreamedResponse,
  handleConnectionError,
  validateStreamEvent
} from './stream-helpers';

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

// Mock EventSource for SSE testing
class MockEventSource {
  public onopen: ((event: Event) => void) | null = null;
  public onmessage: ((event: MessageEvent) => void) | null = null;
  public onerror: ((event: Event) => void) | null = null;
  public readyState: number = 0;
  public url: string;
  public withCredentials: boolean = false;

  constructor(url: string) {
    this.url = url;
    this.readyState = 0; // CONNECTING
  }

  close() {
    this.readyState = 2; // CLOSED
  }

  // Helper methods for testing
  simulateOpen() {
    this.readyState = 1; // OPEN
    if (this.onopen) {
      this.onopen(new Event('open'));
    }
  }

  simulateMessage(data: string) {
    if (this.onmessage) {
      const event = new MessageEvent('message', { data });
      this.onmessage(event);
    }
  }

  simulateError() {
    if (this.onerror) {
      this.onerror(new Event('error'));
    }
  }
}

global.EventSource = MockEventSource as any;

describe('Stream Helpers Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createSSEConnection', () => {
    it('should create EventSource with correct URL', () => {
      const url = '/api/ai/streaming';
      const eventSource = createSSEConnection(url);

      expect(eventSource).toBeInstanceOf(MockEventSource);
      expect(eventSource.url).toBe(url);
    });

    it('should set up event handlers when provided', () => {
      const url = '/api/ai/streaming';
      const handlers = {
        onOpen: jest.fn(),
        onMessage: jest.fn(),
        onError: jest.fn()
      };

      const eventSource = createSSEConnection(url, handlers);

      expect(eventSource.onopen).toBe(handlers.onOpen);
      expect(eventSource.onmessage).toBe(handlers.onMessage);
      expect(eventSource.onerror).toBe(handlers.onError);
    });

    it('should work without event handlers', () => {
      const url = '/api/ai/streaming';
      const eventSource = createSSEConnection(url);

      expect(eventSource.onopen).toBeNull();
      expect(eventSource.onmessage).toBeNull();
      expect(eventSource.onerror).toBeNull();
    });

    it('should handle invalid URLs gracefully', () => {
      const invalidUrl = '';
      const eventSource = createSSEConnection(invalidUrl);

      expect(eventSource).toBeInstanceOf(MockEventSource);
      expect(eventSource.url).toBe(invalidUrl);
    });
  });

  describe('processStreamEvent', () => {
    it('should process text_chunk events correctly', () => {
      const rawEvent = {
        data: JSON.stringify({
          type: 'text_chunk',
          content: 'Analyzing your health concern...'
        })
      } as MessageEvent;

      const result = processStreamEvent(rawEvent);

      expect(result).toEqual({
        type: 'text_chunk',
        content: 'Analyzing your health concern...',
        isValid: true
      });
    });

    it('should process completion events correctly', () => {
      const finalData = [
        { cause_id: '1', name_localized: 'Stress', description: 'Chronic stress' }
      ];

      const rawEvent = {
        data: JSON.stringify({
          type: 'completion',
          data: finalData
        })
      } as MessageEvent;

      const result = processStreamEvent(rawEvent);

      expect(result).toEqual({
        type: 'completion',
        data: finalData,
        isValid: true
      });
    });

    it('should process error events correctly', () => {
      const rawEvent = {
        data: JSON.stringify({
          type: 'error',
          message: 'AI processing failed'
        })
      } as MessageEvent;

      const result = processStreamEvent(rawEvent);

      expect(result).toEqual({
        type: 'error',
        message: 'AI processing failed',
        isValid: true
      });
    });

    it('should handle invalid JSON gracefully', () => {
      const rawEvent = {
        data: 'invalid json'
      } as MessageEvent;

      const result = processStreamEvent(rawEvent);

      expect(result).toEqual({
        type: 'error',
        message: 'Failed to parse stream event',
        isValid: false,
        originalData: 'invalid json'
      });
    });

    it('should handle missing event type', () => {
      const rawEvent = {
        data: JSON.stringify({
          content: 'some content'
        })
      } as MessageEvent;

      const result = processStreamEvent(rawEvent);

      expect(result).toEqual({
        type: 'error',
        message: 'Invalid stream event: missing type',
        isValid: false,
        originalData: JSON.stringify({ content: 'some content' })
      });
    });

    it('should handle unknown event types', () => {
      const rawEvent = {
        data: JSON.stringify({
          type: 'unknown_type',
          content: 'some content'
        })
      } as MessageEvent;

      const result = processStreamEvent(rawEvent);

      expect(result).toEqual({
        type: 'error',
        message: 'Unknown stream event type: unknown_type',
        isValid: false,
        originalData: JSON.stringify({ type: 'unknown_type', content: 'some content' })
      });
    });
  });

  describe('parseStreamedResponse', () => {
    it('should parse valid JSON response', () => {
      const jsonString = JSON.stringify([
        { cause_id: '1', name_localized: 'Stress' },
        { cause_id: '2', name_localized: 'Poor Sleep' }
      ]);

      const result = parseStreamedResponse<Array<{ cause_id: string; name_localized: string }>>(jsonString);

      expect(result).toEqual([
        { cause_id: '1', name_localized: 'Stress' },
        { cause_id: '2', name_localized: 'Poor Sleep' }
      ]);
    });

    it('should handle invalid JSON', () => {
      const invalidJson = 'invalid json string';

      expect(() => {
        parseStreamedResponse(invalidJson);
      }).toThrow('Failed to parse streamed response');
    });

    it('should handle empty string', () => {
      const emptyString = '';

      expect(() => {
        parseStreamedResponse(emptyString);
      }).toThrow('Failed to parse streamed response');
    });

    it('should handle null values', () => {
      const nullString = 'null';

      const result = parseStreamedResponse(nullString);
      expect(result).toBeNull();
    });
  });

  describe('handleConnectionError', () => {
    it('should return retry info for retryable errors', () => {
      const error = new Error('Connection failed');
      const currentRetry = 1;
      const maxRetries = 3;

      const result = handleConnectionError(error, currentRetry, maxRetries);

      expect(result).toEqual({
        shouldRetry: true,
        retryDelay: 2000, // 1000 * 2^1
        retryCount: 2,
        errorMessage: 'Connection failed'
      });
    });

    it('should return no retry for max retries reached', () => {
      const error = new Error('Connection failed');
      const currentRetry = 3;
      const maxRetries = 3;

      const result = handleConnectionError(error, currentRetry, maxRetries);

      expect(result).toEqual({
        shouldRetry: false,
        retryDelay: 0,
        retryCount: 3,
        errorMessage: 'Failed to establish streaming connection after maximum retries'
      });
    });

    it('should handle exponential backoff calculation', () => {
      const error = new Error('Connection failed');
      
      // Test different retry counts
      const result1 = handleConnectionError(error, 0, 3);
      expect(result1.retryDelay).toBe(1000); // 1000 * 2^0

      const result2 = handleConnectionError(error, 1, 3);
      expect(result2.retryDelay).toBe(2000); // 1000 * 2^1

      const result3 = handleConnectionError(error, 2, 3);
      expect(result3.retryDelay).toBe(4000); // 1000 * 2^2
    });

    it('should handle non-Error objects', () => {
      const error = 'String error';
      const currentRetry = 1;
      const maxRetries = 3;

      const result = handleConnectionError(error, currentRetry, maxRetries);

      expect(result.errorMessage).toBe('String error');
      expect(result.shouldRetry).toBe(true);
    });
  });

  describe('validateStreamEvent', () => {
    it('should validate text_chunk events', () => {
      const event = {
        type: 'text_chunk',
        content: 'Some text content'
      };

      const result = validateStreamEvent(event);

      expect(result).toEqual({
        isValid: true,
        errors: []
      });
    });

    it('should validate completion events', () => {
      const event = {
        type: 'completion',
        data: [{ id: '1', name: 'test' }]
      };

      const result = validateStreamEvent(event);

      expect(result).toEqual({
        isValid: true,
        errors: []
      });
    });

    it('should validate error events', () => {
      const event = {
        type: 'error',
        message: 'Error message'
      };

      const result = validateStreamEvent(event);

      expect(result).toEqual({
        isValid: true,
        errors: []
      });
    });

    it('should reject events without type', () => {
      const event = {
        content: 'Some content'
      };

      const result = validateStreamEvent(event);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing required field: type');
    });

    it('should reject text_chunk events without content', () => {
      const event = {
        type: 'text_chunk'
      };

      const result = validateStreamEvent(event);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('text_chunk events must have content field');
    });

    it('should reject completion events without data', () => {
      const event = {
        type: 'completion'
      };

      const result = validateStreamEvent(event);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('completion events must have data field');
    });

    it('should reject error events without message', () => {
      const event = {
        type: 'error'
      };

      const result = validateStreamEvent(event);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('error events must have message field');
    });
  });
});
