// src/lib/ai/hooks/use-ai-streaming.test.ts
// Comprehensive unit tests for the useAIStreaming hook (CRITICAL - test-first development)

import { renderHook, act } from '@testing-library/react';
import { useAIStreaming } from './use-ai-streaming';

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

// Create a jest mock function for EventSource
const MockEventSourceConstructor = jest.fn().mockImplementation((url: string) => {
  return new MockEventSource(url);
});

global.EventSource = MockEventSourceConstructor as any;

// Mock fetch for API calls
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  status: 200,
  statusText: 'OK'
});

describe('useAIStreaming Hook', () => {
  let mockEventSourceInstances: MockEventSource[] = [];

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useFakeTimers();
    mockEventSourceInstances = [];

    // Track created instances
    MockEventSourceConstructor.mockImplementation((url: string) => {
      const instance = new MockEventSource(url);
      mockEventSourceInstances.push(instance);
      return instance;
    });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    mockEventSourceInstances = [];
  });

  describe('Initialization', () => {
    it('should initialize with default state values', () => {
      const { result } = renderHook(() => useAIStreaming<string[]>());

      expect(result.current.streamingText).toBe('');
      expect(result.current.isStreaming).toBe(false);
      expect(result.current.isComplete).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.finalData).toBeNull();
      expect(typeof result.current.startStream).toBe('function');
      expect(typeof result.current.resetStream).toBe('function');
    });

    it('should accept custom configuration options', () => {
      const config = {
        maxRetries: 5,
        retryDelay: 2000,
        timeout: 60000
      };

      const { result } = renderHook(() => useAIStreaming<string[]>(config));

      // State should still be default, but config should be applied internally
      expect(result.current.streamingText).toBe('');
      expect(result.current.isStreaming).toBe(false);
    });
  });

  describe('Stream State Management', () => {
    it('should transition from idle to streaming state', async () => {
      const { result } = renderHook(() => useAIStreaming<string[]>());

      await act(async () => {
        result.current.startStream('/api/ai/streaming', {
          feature: 'recipe-wizard',
          step: 'potential-causes',
          data: { healthConcern: 'test' }
        });
      });

      expect(result.current.isStreaming).toBe(true);
      expect(result.current.error).toBeNull();
      expect(result.current.isComplete).toBe(false);
    });

    it('should accumulate streaming text chunks', async () => {
      const { result } = renderHook(() => useAIStreaming<string[]>());

      await act(async () => {
        await result.current.startStream('/api/ai/streaming', {
          feature: 'recipe-wizard',
          step: 'potential-causes',
          data: { healthConcern: 'test' }
        });
      });

      // Wait for EventSource to be created
      expect(mockEventSourceInstances.length).toBe(1);
      const mockEventSource = mockEventSourceInstances[0];

      // Simulate connection open
      await act(async () => {
        mockEventSource.simulateOpen();
      });

      // Simulate streaming text chunks
      await act(async () => {
        mockEventSource.simulateMessage(JSON.stringify({
          type: 'text_chunk',
          content: 'Analyzing your health concern...'
        }));
      });

      expect(result.current.streamingText).toBe('Analyzing your health concern...');

      await act(async () => {
        mockEventSource.simulateMessage(JSON.stringify({
          type: 'text_chunk',
          content: ' Based on the symptoms you described...'
        }));
      });

      expect(result.current.streamingText).toBe('Analyzing your health concern... Based on the symptoms you described...');
    });

    it('should handle completion with final data', async () => {
      const { result } = renderHook(() => useAIStreaming<string[]>());

      await act(async () => {
        await result.current.startStream('/api/ai/streaming', {
          feature: 'recipe-wizard',
          step: 'potential-causes',
          data: { healthConcern: 'test' }
        });
      });

      expect(mockEventSourceInstances.length).toBe(1);
      const mockEventSource = mockEventSourceInstances[0];

      await act(async () => {
        mockEventSource.simulateOpen();
      });

      const finalData = ['cause1', 'cause2', 'cause3'];

      await act(async () => {
        mockEventSource.simulateMessage(JSON.stringify({
          type: 'completion',
          data: finalData
        }));
      });

      expect(result.current.isComplete).toBe(true);
      expect(result.current.isStreaming).toBe(false);
      expect(result.current.finalData).toEqual(finalData);
    });

    it('should handle error states properly', async () => {
      const { result } = renderHook(() => useAIStreaming<string[]>());

      await act(async () => {
        await result.current.startStream('/api/ai/streaming', {
          feature: 'recipe-wizard',
          step: 'potential-causes',
          data: { healthConcern: 'test' }
        });
      });

      expect(mockEventSourceInstances.length).toBe(1);
      const mockEventSource = mockEventSourceInstances[0];

      await act(async () => {
        mockEventSource.simulateOpen();
      });

      await act(async () => {
        mockEventSource.simulateMessage(JSON.stringify({
          type: 'error',
          message: 'AI processing failed'
        }));
      });

      expect(result.current.error).toBe('AI processing failed');
      expect(result.current.isStreaming).toBe(false);
      expect(result.current.isComplete).toBe(false);
    });
  });

  describe('Error Handling and Retry Logic', () => {
    it('should implement exponential backoff with max 3 retries', async () => {
      const { result } = renderHook(() => useAIStreaming<string[]>({
        maxRetries: 3,
        retryDelay: 1000
      }));

      await act(async () => {
        await result.current.startStream('/api/ai/streaming', {
          feature: 'recipe-wizard',
          step: 'potential-causes',
          data: { healthConcern: 'test' }
        });
      });

      expect(mockEventSourceInstances.length).toBe(1);
      const mockEventSource = mockEventSourceInstances[0];

      // Simulate connection error
      await act(async () => {
        mockEventSource.simulateError();
      });

      // Should attempt retry after delay
      expect(result.current.isStreaming).toBe(true); // Still trying

      // Fast-forward time for first retry (1000ms)
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      // Should have created a new EventSource for retry
      expect(mockEventSourceInstances.length).toBe(2);
    });

    it('should stop retrying after max attempts', async () => {
      const { result } = renderHook(() => useAIStreaming<string[]>({
        maxRetries: 2,
        retryDelay: 1000
      }));

      // Start initial connection
      await act(async () => {
        await result.current.startStream('/api/ai/streaming', {
          feature: 'recipe-wizard',
          step: 'potential-causes',
          data: { healthConcern: 'test' }
        });
      });

      // Simulate multiple failures
      for (let i = 0; i < 3; i++) {
        await act(async () => {
          if (mockEventSourceInstances[i]) {
            mockEventSourceInstances[i].simulateError();
          }

          if (i < 2) {
            jest.advanceTimersByTime(1000 * Math.pow(2, i)); // Exponential backoff
          }
        });
      }

      expect(result.current.error).toContain('Failed to establish streaming connection');
      expect(result.current.isStreaming).toBe(false);
    });

    it('should handle connection timeout', async () => {
      const { result } = renderHook(() => useAIStreaming<string[]>({
        timeout: 5000
      }));

      await act(async () => {
        result.current.startStream('/api/ai/streaming', {
          feature: 'recipe-wizard',
          step: 'potential-causes',
          data: { healthConcern: 'test' }
        });
      });

      // Fast-forward past timeout
      await act(async () => {
        jest.advanceTimersByTime(6000);
      });

      expect(result.current.error).toContain('timeout');
      expect(result.current.isStreaming).toBe(false);
    });
  });

  describe('SSE Connection Management', () => {
    it('should establish SSE connection with correct URL and parameters', async () => {
      const { result } = renderHook(() => useAIStreaming<string[]>());

      const requestData = {
        feature: 'recipe-wizard',
        step: 'potential-causes',
        data: { healthConcern: 'chronic anxiety' }
      };

      await act(async () => {
        result.current.startStream('/api/ai/streaming', requestData);
      });

      expect(MockEventSourceConstructor).toHaveBeenCalledWith('/api/ai/streaming');
    });

    it('should clean up connection on unmount', async () => {
      const { result, unmount } = renderHook(() => useAIStreaming<string[]>());

      await act(async () => {
        await result.current.startStream('/api/ai/streaming', {
          feature: 'recipe-wizard',
          step: 'potential-causes',
          data: { healthConcern: 'test' }
        });
      });

      expect(mockEventSourceInstances.length).toBe(1);
      const mockEventSource = mockEventSourceInstances[0];
      const closeSpy = jest.spyOn(mockEventSource, 'close');

      unmount();

      expect(closeSpy).toHaveBeenCalled();
    });

    it('should clean up connection when resetStream is called', async () => {
      const { result } = renderHook(() => useAIStreaming<string[]>());

      await act(async () => {
        result.current.startStream('/api/ai/streaming', {
          feature: 'recipe-wizard',
          step: 'potential-causes',
          data: { healthConcern: 'test' }
        });
      });

      const mockEventSource = mockEventSourceInstances[0];
      const closeSpy = jest.spyOn(mockEventSource, 'close');

      await act(async () => {
        result.current.resetStream();
      });

      expect(closeSpy).toHaveBeenCalled();
      expect(result.current.streamingText).toBe('');
      expect(result.current.isStreaming).toBe(false);
      expect(result.current.isComplete).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.finalData).toBeNull();
    });
  });

  describe('Generic Type Support', () => {
    it('should support different response types', async () => {
      interface PotentialCause {
        cause_id: string;
        name_localized: string;
        description: string;
      }

      const { result } = renderHook(() => useAIStreaming<PotentialCause[]>());

      await act(async () => {
        await result.current.startStream('/api/ai/streaming', {
          feature: 'recipe-wizard',
          step: 'potential-causes',
          data: { healthConcern: 'test' }
        });
      });

      expect(mockEventSourceInstances.length).toBe(1);
      const mockEventSource = mockEventSourceInstances[0];

      await act(async () => {
        mockEventSource.simulateOpen();
      });

      const finalData: PotentialCause[] = [
        {
          cause_id: '1',
          name_localized: 'Stress',
          description: 'Chronic stress response'
        }
      ];

      await act(async () => {
        mockEventSource.simulateMessage(JSON.stringify({
          type: 'completion',
          data: finalData
        }));
      });

      expect(result.current.finalData).toEqual(finalData);
      expect(result.current.finalData?.[0].cause_id).toBe('1');
    });
  });
});
