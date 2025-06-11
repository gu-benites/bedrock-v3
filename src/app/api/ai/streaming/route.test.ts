// src/app/api/ai/streaming/route.test.ts
// API route integration tests (CRITICAL - test-first development)

import { NextRequest } from 'next/server';
import { POST, GET } from './route';

// Mock NextRequest to avoid URL validation issues
jest.mock('next/server', () => ({
  NextRequest: jest.fn().mockImplementation((url, init) => ({
    url,
    method: init?.method || 'GET',
    headers: new Map(Object.entries(init?.headers || {})),
    json: jest.fn().mockResolvedValue(JSON.parse(init?.body || '{}')),
    ...init
  })),
  NextResponse: {
    json: jest.fn().mockImplementation((data, init) => ({
      status: init?.status || 200,
      headers: new Map(Object.entries(init?.headers || {})),
      json: jest.fn().mockResolvedValue(data)
    })),
    // Add constructor for streaming responses
    constructor: jest.fn().mockImplementation((stream, init) => ({
      status: init?.status || 200,
      headers: new Map(Object.entries(init?.headers || {}))
    }))
  }
}));

// Mock OpenAI Agents JS SDK
const mockRun = jest.fn();
const mockAgent = jest.fn();

jest.mock('@openai/agents', () => ({
  Agent: mockAgent,
  run: mockRun,
  setDefaultOpenAIKey: jest.fn(),
  setOpenAIAPI: jest.fn(),
  withTrace: jest.fn((name, fn) => fn())
}));

// Mock prompt manager
const mockGetPromptManager = jest.fn();
const mockLoadPromptConfig = jest.fn();
const mockGetProcessedPrompt = jest.fn();

jest.mock('@/features/recipe-wizard/services/prompt-manager', () => ({
  getPromptManager: mockGetPromptManager,
  PromptManagerError: class PromptManagerError extends Error {
    constructor(message: string, public code: string, public promptName: string, public originalError?: Error) {
      super(message);
      this.name = 'PromptManagerError';
    }
  }
}));

// Mock logger
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
};

jest.mock('@/lib/logger', () => ({
  getServerLogger: jest.fn(() => mockLogger)
}));

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

// Mock environment variables
const originalEnv = process.env;
beforeEach(() => {
  jest.clearAllMocks();
  process.env = {
    ...originalEnv,
    OPENAI_API_KEY: 'test-api-key'
  };

  // Setup default mocks
  mockGetPromptManager.mockReturnValue({
    loadPromptConfig: mockLoadPromptConfig,
    getProcessedPrompt: mockGetProcessedPrompt
  });

  mockLoadPromptConfig.mockResolvedValue({
    template: 'Test prompt template',
    config: {
      model: 'gpt-4',
      temperature: 0.3,
      max_tokens: 1000
    }
  });

  mockGetProcessedPrompt.mockResolvedValue({
    prompt: 'Processed test prompt',
    config: {
      model: 'gpt-4',
      temperature: 0.3,
      max_tokens: 1000
    }
  });

  // Mock Agent constructor
  mockAgent.mockImplementation(() => ({
    name: 'test-agent',
    instructions: 'test instructions',
    model: 'gpt-4'
  }));
});

afterEach(() => {
  process.env = originalEnv;
});

describe('/api/ai/streaming Route', () => {
  describe('POST Method', () => {
    it('should accept valid streaming requests', async () => {
      const requestData = {
        feature: 'recipe-wizard',
        step: 'potential-causes',
        data: {
          healthConcern: 'chronic anxiety',
          demographics: {
            gender: 'female',
            ageCategory: 'adult',
            specificAge: 30,
            language: 'en'
          }
        }
      };

      // Mock streaming response
      const mockStream = {
        toTextStream: jest.fn().mockReturnValue({
          pipe: jest.fn(),
          on: jest.fn()
        }),
        completed: Promise.resolve(),
        [Symbol.asyncIterator]: async function* () {
          yield { type: 'text_chunk', content: 'Analyzing...' };
          yield { type: 'completion', data: [{ cause_id: '1', name_localized: 'Stress' }] };
        }
      };

      mockRun.mockResolvedValue(mockStream);

      const request = {
        json: jest.fn().mockResolvedValue(requestData),
        method: 'POST',
        headers: new Map([['Content-Type', 'application/json']])
      } as any;

      const response = await POST(request);

      // Debug: log the actual response to see what's happening
      if (response.status !== 200) {
        const errorData = await response.json();
        console.log('Unexpected response:', { status: response.status, data: errorData });
      }

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('text/event-stream');
      expect(response.headers.get('Cache-Control')).toBe('no-cache');
      expect(response.headers.get('Connection')).toBe('keep-alive');
    });

    it('should validate request data structure', async () => {
      const invalidRequestData = {
        feature: 'recipe-wizard',
        // Missing step and data fields
      };

      const request = {
        json: jest.fn().mockResolvedValue(invalidRequestData),
        method: 'POST',
        headers: new Map([['Content-Type', 'application/json']])
      } as any;

      const response = await POST(request);

      expect(response.status).toBe(400);
      const responseData = await response.json();
      expect(responseData.error).toContain('Invalid request data');
    });

    it('should handle missing OpenAI API key', async () => {
      delete process.env.OPENAI_API_KEY;

      const requestData = {
        feature: 'recipe-wizard',
        step: 'potential-causes',
        data: { healthConcern: 'test' }
      };

      const request = {
        json: jest.fn().mockResolvedValue(requestData),
        method: 'POST',
        headers: new Map([['Content-Type', 'application/json']])
      } as any;

      const response = await POST(request);

      expect(response.status).toBe(500);
      const responseData = await response.json();
      expect(responseData.error).toBe('OpenAI API key not configured');
    });

    it('should handle prompt manager errors', async () => {
      const PromptManagerError = require('@/features/recipe-wizard/services/prompt-manager').PromptManagerError;
      mockLoadPromptConfig.mockRejectedValue(
        new PromptManagerError('Prompt not found', 'PROMPT_NOT_FOUND', 'test-prompt')
      );

      const requestData = {
        feature: 'recipe-wizard',
        step: 'potential-causes',
        data: { healthConcern: 'test' }
      };

      const request = {
        json: jest.fn().mockResolvedValue(requestData),
        method: 'POST',
        headers: new Map([['Content-Type', 'application/json']])
      } as any;

      const response = await POST(request);

      expect(response.status).toBe(500);
      const responseData = await response.json();
      expect(responseData.error).toBe('Failed to load AI configuration');
    });

    it('should handle OpenAI API failures', async () => {
      mockRun.mockRejectedValue(new Error('OpenAI API error'));

      const requestData = {
        feature: 'recipe-wizard',
        step: 'potential-causes',
        data: { healthConcern: 'test' }
      };

      const request = {
        json: jest.fn().mockResolvedValue(requestData),
        method: 'POST',
        headers: new Map([['Content-Type', 'application/json']])
      } as any;

      const response = await POST(request);

      expect(response.status).toBe(500);
      const responseData = await response.json();
      expect(responseData.error).toContain('Streaming failed');
    });

    it('should handle request timeout', async () => {
      // Mock a request that never resolves (simulating timeout)
      mockRun.mockImplementation(() => new Promise(() => {})); // Never resolves

      const requestData = {
        feature: 'recipe-wizard',
        step: 'potential-causes',
        data: { healthConcern: 'test' }
      };

      const request = {
        json: jest.fn().mockResolvedValue(requestData),
        method: 'POST',
        headers: new Map([['Content-Type', 'application/json']])
      } as any;

      // Mock setTimeout to immediately trigger timeout
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = jest.fn().mockImplementation((callback) => {
        callback();
        return 1;
      });

      const response = await POST(request);

      // Restore setTimeout
      global.setTimeout = originalSetTimeout;

      expect(response.status).toBe(408);
      const responseData = await response.json();
      expect(responseData.error).toBe('Request timeout');
    });

    it('should use OpenAI Agents JS SDK streaming patterns', async () => {
      const requestData = {
        feature: 'recipe-wizard',
        step: 'potential-causes',
        data: { healthConcern: 'test' }
      };

      const mockStream = {
        toTextStream: jest.fn().mockReturnValue({
          pipe: jest.fn(),
          on: jest.fn()
        }),
        completed: Promise.resolve(),
        [Symbol.asyncIterator]: async function* () {
          yield { type: 'text_chunk', content: 'Test content' };
        }
      };

      mockRun.mockResolvedValue(mockStream);

      const request = {
        json: jest.fn().mockResolvedValue(requestData),
        method: 'POST',
        headers: new Map([['Content-Type', 'application/json']])
      } as any;

      await POST(request);

      // Verify OpenAI Agents JS SDK was called with streaming enabled
      expect(mockRun).toHaveBeenCalledWith(
        expect.anything(), // agent
        expect.any(String), // prompt
        expect.objectContaining({ stream: true })
      );
    });

    it('should integrate with existing YAML prompt management', async () => {
      const requestData = {
        feature: 'recipe-wizard',
        step: 'potential-causes',
        data: {
          healthConcern: 'chronic anxiety',
          demographics: {
            gender: 'female',
            ageCategory: 'adult',
            specificAge: 30,
            language: 'en'
          }
        }
      };

      const mockStream = {
        toTextStream: jest.fn().mockReturnValue({
          pipe: jest.fn(),
          on: jest.fn()
        }),
        completed: Promise.resolve(),
        [Symbol.asyncIterator]: async function* () {
          yield { type: 'completion', data: [] };
        }
      };

      mockRun.mockResolvedValue(mockStream);

      const request = {
        json: jest.fn().mockResolvedValue(requestData),
        method: 'POST',
        headers: new Map([['Content-Type', 'application/json']])
      } as any;

      await POST(request);

      // Verify prompt manager was used
      expect(mockGetPromptManager).toHaveBeenCalled();
      expect(mockLoadPromptConfig).toHaveBeenCalledWith('potential-causes');
      expect(mockGetProcessedPrompt).toHaveBeenCalledWith(
        'potential-causes',
        expect.objectContaining({
          healthConcern: 'chronic anxiety',
          demographics: expect.objectContaining({
            gender: 'female',
            ageCategory: 'adult'
          })
        })
      );
    });
  });

  describe('GET Method', () => {
    it('should return API status and configuration', async () => {
      // GET method doesn't need request body

      const response = await GET();

      expect(response.status).toBe(200);
      const responseData = await response.json();
      expect(responseData).toEqual({
        status: 'healthy',
        service: 'AI Streaming API',
        version: '1.0.0',
        configured: true,
        features: ['recipe-wizard'],
        timestamp: expect.any(String)
      });
    });

    it('should indicate when API key is not configured', async () => {
      delete process.env.OPENAI_API_KEY;

      const response = await GET();

      expect(response.status).toBe(200);
      const responseData = await response.json();
      expect(responseData.configured).toBe(false);
    });
  });
});
