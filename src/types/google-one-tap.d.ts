// src/types/google-one-tap.d.ts
// TypeScript declarations for Google One Tap

export interface CredentialResponse {
  credential: string;
  select_by?: string;
}

export interface IdConfiguration {
  client_id: string;
  auto_select?: boolean;
  callback: (credentialResponse: CredentialResponse) => void;
  login_uri?: string;
  native_callback?: (response: any) => void;
  cancel_on_tap_outside?: boolean;
  prompt_parent_id?: string;
  nonce?: string;
  context?: 'signin' | 'signup' | 'use';
  state_cookie_domain?: string;
  ux_mode?: 'popup' | 'redirect';
  allowed_parent_origin?: string | string[];
  intermediate_iframe_close_callback?: () => void;
  itp_support?: boolean;
  use_fedcm_for_prompt?: boolean;
}

export interface PromptMomentNotification {
  isDisplayMoment(): boolean;
  isDisplayed(): boolean;
  isNotDisplayed(): boolean;
  getNotDisplayedReason(): 
    | 'browser_not_supported'
    | 'invalid_client'
    | 'missing_client_id'
    | 'opt_out_or_no_session'
    | 'secure_http_required'
    | 'suppressed_by_user'
    | 'unregistered_origin'
    | 'unknown_reason';
  isSkippedMoment(): boolean;
  getSkippedReason():
    | 'auto_cancel'
    | 'user_cancel'
    | 'tap_outside'
    | 'issuing_failed';
  isDismissedMoment(): boolean;
  getDismissedReason():
    | 'credential_returned'
    | 'cancel_called'
    | 'flow_restarted';
  getMomentType(): 'display' | 'skipped' | 'dismissed';
}

export interface GsiButtonConfiguration {
  type?: 'standard' | 'icon';
  theme?: 'outline' | 'filled_blue' | 'filled_black';
  size?: 'large' | 'medium' | 'small';
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  shape?: 'rectangular' | 'pill' | 'circle' | 'square';
  logo_alignment?: 'left' | 'center';
  width?: string;
  locale?: string;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (input: IdConfiguration) => void;
          prompt: (momentListener?: (res: PromptMomentNotification) => void) => void;
          renderButton: (
            parent: HTMLElement,
            options: GsiButtonConfiguration & { click_listener?: () => void }
          ) => void;
          disableAutoSelect: () => void;
          storeCredential: (credentials: { id: string; password: string }) => void;
          cancel: () => void;
          onGoogleLibraryLoad: () => void;
          revoke: (hint: string, callback: (done: any) => void) => void;
        };
      };
    };
  }
}

export {};
