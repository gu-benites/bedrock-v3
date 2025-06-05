// src/features/auth/components/__tests__/one-tap-component.test.tsx
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import OneTapComponent from '../one-tap-component';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/hooks/use-toast', () => ({
  useToast: jest.fn(),
}));

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(),
}));

jest.mock('next/script', () => {
  return function MockScript({ onLoad, onError, ...props }: any) {
    React.useEffect(() => {
      // Simulate script loading
      setTimeout(() => {
        if (onLoad) onLoad();
      }, 100);
    }, [onLoad]);
    return <script {...props} />;
  };
});

// Mock Google GSI
const mockGoogleAccounts = {
  id: {
    initialize: jest.fn(),
    prompt: jest.fn(),
    cancel: jest.fn(),
    renderButton: jest.fn(),
  },
};

// Mock environment variable
const originalEnv = process.env;

describe('OneTapComponent', () => {
  const mockRouter = {
    push: jest.fn(),
  };

  const mockToast = jest.fn();

  const mockSupabase = {
    auth: {
      getSession: jest.fn(),
      signInWithIdToken: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useToast as jest.Mock).mockReturnValue({ toast: mockToast });
    (createClient as jest.Mock).mockReturnValue(mockSupabase);

    // Mock Google GSI
    (global as any).window = {
      ...global.window,
      google: {
        accounts: mockGoogleAccounts,
      },
    };

    // Mock crypto for nonce generation
    Object.defineProperty(global, 'crypto', {
      value: {
        getRandomValues: jest.fn(() => new Uint8Array(32)),
        subtle: {
          digest: jest.fn(() => Promise.resolve(new ArrayBuffer(32))),
        },
      },
    });

    // Mock btoa
    global.btoa = jest.fn(() => 'mock-nonce');

    // Mock environment variable
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_GOOGLE_CLIENT_ID: 'test-client-id.apps.googleusercontent.com',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should render without crashing when Google Client ID is configured', () => {
    render(<OneTapComponent />);
    expect(screen.getByRole('script')).toBeInTheDocument();
  });

  it('should not render when Google Client ID is not configured', () => {
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = '';
    
    const { container } = render(<OneTapComponent />);
    expect(container.firstChild).toBeNull();
  });

  it('should initialize Google One Tap when script loads', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    render(<OneTapComponent />);

    await waitFor(() => {
      expect(mockGoogleAccounts.id.initialize).toHaveBeenCalledWith(
        expect.objectContaining({
          client_id: 'test-client-id.apps.googleusercontent.com',
          callback: expect.any(Function),
          nonce: expect.any(String),
          use_fedcm_for_prompt: true,
          auto_select: false,
          context: 'signin',
          ux_mode: 'popup',
          cancel_on_tap_outside: false,
          itp_support: true,
        })
      );
    });
  });

  it('should not initialize when user already has session', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'test-user' } } },
      error: null,
    });

    render(<OneTapComponent />);

    await waitFor(() => {
      expect(mockGoogleAccounts.id.initialize).not.toHaveBeenCalled();
    });
  });

  it('should handle successful sign-in', async () => {
    const onSuccess = jest.fn();
    
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    mockSupabase.auth.signInWithIdToken.mockResolvedValue({
      data: { user: { id: 'test-user' } },
      error: null,
    });

    render(<OneTapComponent onSuccess={onSuccess} />);

    await waitFor(() => {
      expect(mockGoogleAccounts.id.initialize).toHaveBeenCalled();
    });

    // Simulate successful callback
    const initializeCall = mockGoogleAccounts.id.initialize.mock.calls[0][0];
    await initializeCall.callback({ credential: 'test-token' });

    expect(mockSupabase.auth.signInWithIdToken).toHaveBeenCalledWith({
      provider: 'google',
      token: 'test-token',
      nonce: expect.any(String),
    });

    expect(onSuccess).toHaveBeenCalled();
    expect(mockRouter.push).toHaveBeenCalledWith('/dashboard');
  });

  it('should handle sign-in error', async () => {
    const onError = jest.fn();
    
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    mockSupabase.auth.signInWithIdToken.mockResolvedValue({
      data: null,
      error: { message: 'Authentication failed' },
    });

    render(<OneTapComponent onError={onError} />);

    await waitFor(() => {
      expect(mockGoogleAccounts.id.initialize).toHaveBeenCalled();
    });

    // Simulate failed callback
    const initializeCall = mockGoogleAccounts.id.initialize.mock.calls[0][0];
    await initializeCall.callback({ credential: 'test-token' });

    expect(onError).toHaveBeenCalledWith('Authentication failed');
    expect(mockToast).toHaveBeenCalledWith({
      title: "Sign-in Failed",
      description: 'Authentication failed',
      variant: "destructive"
    });
  });

  it('should render button when showButton is true', async () => {
    const buttonRef = { current: document.createElement('div') };
    
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    render(<OneTapComponent showButton={true} />);

    await waitFor(() => {
      expect(mockGoogleAccounts.id.renderButton).toHaveBeenCalled();
    });
  });

  it('should cancel existing prompts on cleanup', () => {
    const { unmount } = render(<OneTapComponent />);
    
    unmount();
    
    expect(mockGoogleAccounts.id.cancel).toHaveBeenCalled();
  });
});
