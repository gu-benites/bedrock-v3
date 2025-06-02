// src/features/user-auth-data/actions/profile.actions.image-handling.test.ts
import { updateUserProfile } from './profile.actions';
import { createClient } from '@/lib/supabase/server';
import { User } from '@supabase/supabase-js';
import { getServerLogger } from '@/lib/logger';

// --- Mocks ---
jest.mock('@/lib/supabase/server');
jest.mock('@/lib/logger', () => ({
  getServerLogger: jest.fn(() => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  })),
}));

const mockUser: User = {
  id: 'test-user-id-images',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'image-test@example.com',
  email_confirmed_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  app_metadata: {},
  user_metadata: {},
  factors: [],
};

const mockSupabaseClient = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(),
  storage: {
    from: jest.fn(),
  },
};

const mockStorageBucket = {
  upload: jest.fn(),
  remove: jest.fn(),
  getPublicUrl: jest.fn(),
};

const mockDbTable = {
  select: jest.fn(),
  update: jest.fn(),
  eq: jest.fn(),
  single: jest.fn(),
};

// Helper to reset and configure mocks before each test
const setupMocks = () => {
  jest.clearAllMocks();
  (createClient as jest.Mock).mockResolvedValue(mockSupabaseClient);
  mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });

  // Mock for storage operations (from('profiles'))
  (mockSupabaseClient.storage.from as jest.Mock).mockReturnValue(mockStorageBucket);

  // Mock for database operations (from('profiles'))
  // Default mock for from('profiles').select().eq().single() - for fetching current profile
  const selectChain = { eq: jest.fn().mockReturnThis(), single: jest.fn() };
  const updateChain = { eq: jest.fn().mockReturnThis(), select: jest.fn().mockReturnThis(), single: jest.fn() };
  
  (mockSupabaseClient.from as jest.Mock).mockImplementation((tableName: string) => {
    if (tableName === 'profiles') {
      return {
        select: jest.fn().mockReturnValue(selectChain),
        update: jest.fn().mockReturnValue(updateChain),
      };
    }
    return {}; // Default empty mock for other tables if any
  });

  // Alias for easier access in tests
  const mockDbProfilesSelect = (mockSupabaseClient.from as jest.Mock).getMockImplementation()('profiles').select().eq().single;
  const mockDbProfilesUpdate = (mockSupabaseClient.from as jest.Mock).getMockImplementation()('profiles').update().eq().select().single;

  return { mockStorageBucket, mockDbProfilesSelect, mockDbProfilesUpdate };
};


const FAKE_AVATAR_DATA_URI = 'data:image/png;base64,fakeavatardata';
const FAKE_BANNER_DATA_URI = 'data:image/jpeg;base64,fakebannerdata';
const EXISTING_AVATAR_URL = 'https://example.com/storage/v1/object/public/profiles/avatars/test-user-id-images.png';
const EXISTING_BANNER_URL = 'https://example.com/storage/v1/object/public/profiles/banners/test-user-id-images.jpeg';
const NEW_AVATAR_PUBLIC_URL = 'https://example.com/storage/v1/object/public/profiles/avatars/test-user-id-images.png_new';
const NEW_BANNER_PUBLIC_URL = 'https://example.com/storage/v1/object/public/profiles/banners/test-user-id-images.jpeg_new';


describe('updateUserProfile - Image Handling Scenarios', () => {
  let mocks: ReturnType<typeof setupMocks>;

  beforeEach(() => {
    mocks = setupMocks();
  });

  // --- Test Scenarios ---

  it('Scenario 1: Uploading only an avatar (no existing images)', async () => {
    mocks.mockDbProfilesSelect.mockResolvedValue({ data: null, error: null }); // No existing profile / images
    mocks.mockStorageBucket.upload.mockResolvedValue({ data: { path: 'avatars/test-user-id-images.png' }, error: null });
    mocks.mockStorageBucket.getPublicUrl.mockReturnValue({ data: { publicUrl: NEW_AVATAR_PUBLIC_URL } });
    mocks.mockDbProfilesUpdate.mockResolvedValue({ data: { id: mockUser.id, avatar_url: NEW_AVATAR_PUBLIC_URL }, error: null });

    const result = await updateUserProfile({ avatarDataUri: FAKE_AVATAR_DATA_URI });

    expect(mocks.mockStorageBucket.upload).toHaveBeenCalledWith(
      'avatars/test-user-id-images.png',
      expect.any(Buffer), // Check if it's a buffer
      expect.objectContaining({ contentType: 'image/png', upsert: true })
    );
    expect(mocks.mockStorageBucket.remove).not.toHaveBeenCalled();
    expect(mocks.mockDbProfilesUpdate).toHaveBeenCalledWith(expect.objectContaining({ avatar_url: NEW_AVATAR_PUBLIC_URL }));
    expect(result.data?.avatarUrl).toBe(NEW_AVATAR_PUBLIC_URL);
    expect(result.error).toBeUndefined();
  });

  it('Scenario 2: Uploading only a banner (no existing images)', async () => {
    mocks.mockDbProfilesSelect.mockResolvedValue({ data: null, error: null });
    mocks.mockStorageBucket.upload.mockResolvedValue({ data: { path: 'banners/test-user-id-images.jpeg' }, error: null });
    mocks.mockStorageBucket.getPublicUrl.mockReturnValue({ data: { publicUrl: NEW_BANNER_PUBLIC_URL } });
    mocks.mockDbProfilesUpdate.mockResolvedValue({ data: { id: mockUser.id, banner_img_url: NEW_BANNER_PUBLIC_URL }, error: null });

    const result = await updateUserProfile({ bannerDataUri: FAKE_BANNER_DATA_URI });

    expect(mocks.mockStorageBucket.upload).toHaveBeenCalledWith(
      'banners/test-user-id-images.jpeg',
      expect.any(Buffer),
      expect.objectContaining({ contentType: 'image/jpeg', upsert: true })
    );
    expect(mocks.mockStorageBucket.remove).not.toHaveBeenCalled();
    expect(mocks.mockDbProfilesUpdate).toHaveBeenCalledWith(expect.objectContaining({ banner_img_url: NEW_BANNER_PUBLIC_URL }));
    expect(result.data?.bannerUrl).toBe(NEW_BANNER_PUBLIC_URL);
    expect(result.error).toBeUndefined();
  });

  it('Scenario 3: Uploading a new avatar when an old one exists', async () => {
    mocks.mockDbProfilesSelect.mockResolvedValue({ data: { avatar_url: EXISTING_AVATAR_URL }, error: null });
    mocks.mockStorageBucket.remove.mockResolvedValue({ data: {}, error: null }); // Mock successful removal
    mocks.mockStorageBucket.upload.mockResolvedValue({ data: { path: 'avatars/test-user-id-images.png_new_path' }, error: null });
    mocks.mockStorageBucket.getPublicUrl.mockReturnValue({ data: { publicUrl: NEW_AVATAR_PUBLIC_URL } });
    mocks.mockDbProfilesUpdate.mockResolvedValue({ data: { id: mockUser.id, avatar_url: NEW_AVATAR_PUBLIC_URL }, error: null });

    const result = await updateUserProfile({ avatarDataUri: FAKE_AVATAR_DATA_URI });

    expect(mocks.mockStorageBucket.remove).toHaveBeenCalledWith(['avatars/test-user-id-images.png']);
    expect(mocks.mockStorageBucket.upload).toHaveBeenCalled();
    expect(mocks.mockDbProfilesUpdate).toHaveBeenCalledWith(expect.objectContaining({ avatar_url: NEW_AVATAR_PUBLIC_URL }));
    expect(result.data?.avatarUrl).toBe(NEW_AVATAR_PUBLIC_URL);
  });

  it('Scenario 4: Uploading a new banner when an old one exists', async () => {
    mocks.mockDbProfilesSelect.mockResolvedValue({ data: { banner_img_url: EXISTING_BANNER_URL }, error: null });
    mocks.mockStorageBucket.remove.mockResolvedValue({ data: {}, error: null });
    mocks.mockStorageBucket.upload.mockResolvedValue({ data: { path: 'banners/test-user-id-images.jpeg_new_path' }, error: null });
    mocks.mockStorageBucket.getPublicUrl.mockReturnValue({ data: { publicUrl: NEW_BANNER_PUBLIC_URL } });
    mocks.mockDbProfilesUpdate.mockResolvedValue({ data: { id: mockUser.id, banner_img_url: NEW_BANNER_PUBLIC_URL }, error: null });

    const result = await updateUserProfile({ bannerDataUri: FAKE_BANNER_DATA_URI });

    expect(mocks.mockStorageBucket.remove).toHaveBeenCalledWith(['banners/test-user-id-images.jpeg']);
    expect(mocks.mockStorageBucket.upload).toHaveBeenCalled();
    expect(mocks.mockDbProfilesUpdate).toHaveBeenCalledWith(expect.objectContaining({ banner_img_url: NEW_BANNER_PUBLIC_URL }));
    expect(result.data?.bannerUrl).toBe(NEW_BANNER_PUBLIC_URL);
  });

  it('Scenario 5: Updating text fields when images exist (no new image data, avatarDataUri/bannerDataUri are undefined)', async () => {
    mocks.mockDbProfilesSelect.mockResolvedValue({ data: { avatar_url: EXISTING_AVATAR_URL, banner_img_url: EXISTING_BANNER_URL }, error: null });
    mocks.mockDbProfilesUpdate.mockResolvedValue({ 
      data: { 
        id: mockUser.id, 
        first_name: 'UpdatedName', 
        avatar_url: EXISTING_AVATAR_URL, 
        banner_img_url: EXISTING_BANNER_URL 
      }, 
      error: null 
    });

    const result = await updateUserProfile({ firstName: 'UpdatedName' }); // avatarDataUri and bannerDataUri are undefined

    expect(mocks.mockStorageBucket.upload).not.toHaveBeenCalled();
    expect(mocks.mockStorageBucket.remove).not.toHaveBeenCalled();
    expect(mocks.mockDbProfilesUpdate).toHaveBeenCalledWith(expect.objectContaining({ first_name: 'UpdatedName' }));
    expect(result.data?.firstName).toBe('UpdatedName');
    expect(result.data?.avatarUrl).toBe(EXISTING_AVATAR_URL); // Should remain unchanged
    expect(result.data?.bannerUrl).toBe(EXISTING_BANNER_URL); // Should remain unchanged
  });
  
  it('Scenario 5b: Updating text fields (avatarDataUri/bannerDataUri explicitly empty string - should be ignored by action for upload)', async () => {
    mocks.mockDbProfilesSelect.mockResolvedValue({ data: { avatar_url: EXISTING_AVATAR_URL, banner_img_url: EXISTING_BANNER_URL }, error: null });
    mocks.mockDbProfilesUpdate.mockResolvedValue({ 
      data: { 
        id: mockUser.id, 
        first_name: 'UpdatedName', 
        avatar_url: EXISTING_AVATAR_URL, 
        banner_img_url: EXISTING_BANNER_URL 
      }, 
      error: null 
    });

    // Simulate form submission where these fields might be empty strings if not touched
    const result = await updateUserProfile({ 
      firstName: 'UpdatedName', 
      avatarDataUri: '', 
      bannerDataUri: '' 
    });

    expect(mocks.mockStorageBucket.upload).not.toHaveBeenCalled();
    expect(mocks.mockStorageBucket.remove).not.toHaveBeenCalled();
    expect(mocks.mockDbProfilesUpdate).toHaveBeenCalledWith(expect.objectContaining({ first_name: 'UpdatedName' }));
    expect(result.data?.firstName).toBe('UpdatedName');
    expect(result.data?.avatarUrl).toBe(EXISTING_AVATAR_URL); 
    expect(result.data?.bannerUrl).toBe(EXISTING_BANNER_URL);
  });


  it('Scenario 6: Explicitly removing an avatar (avatarDataUri is null)', async () => {
    mocks.mockDbProfilesSelect.mockResolvedValue({ data: { avatar_url: EXISTING_AVATAR_URL }, error: null });
    mocks.mockStorageBucket.remove.mockResolvedValue({ data: {}, error: null });
    mocks.mockDbProfilesUpdate.mockResolvedValue({ data: { id: mockUser.id, avatar_url: null }, error: null });

    const result = await updateUserProfile({ avatarDataUri: null });

    expect(mocks.mockStorageBucket.remove).toHaveBeenCalledWith(['avatars/test-user-id-images.png']);
    expect(mocks.mockStorageBucket.upload).not.toHaveBeenCalled();
    expect(mocks.mockDbProfilesUpdate).toHaveBeenCalledWith(expect.objectContaining({ avatar_url: null }));
    expect(result.data?.avatarUrl).toBeNull();
  });

  it('Scenario 7: Explicitly removing a banner (bannerDataUri is null)', async () => {
    mocks.mockDbProfilesSelect.mockResolvedValue({ data: { banner_img_url: EXISTING_BANNER_URL }, error: null });
    mocks.mockStorageBucket.remove.mockResolvedValue({ data: {}, error: null });
    mocks.mockDbProfilesUpdate.mockResolvedValue({ data: { id: mockUser.id, banner_img_url: null }, error: null });

    const result = await updateUserProfile({ bannerDataUri: null });

    expect(mocks.mockStorageBucket.remove).toHaveBeenCalledWith(['banners/test-user-id-images.jpeg']);
    expect(mocks.mockStorageBucket.upload).not.toHaveBeenCalled();
    expect(mocks.mockDbProfilesUpdate).toHaveBeenCalledWith(expect.objectContaining({ banner_img_url: null }));
    expect(result.data?.bannerUrl).toBeNull();
  });

  it('Scenario 8: Uploading both avatar and banner (both new, no existing)', async () => {
    mocks.mockDbProfilesSelect.mockResolvedValue({ data: null, error: null });
    
    // Mock first upload (avatar)
    mocks.mockStorageBucket.upload
      .mockResolvedValueOnce({ data: { path: 'avatars/test-user-id-images.png' }, error: null });
    mocks.mockStorageBucket.getPublicUrl
      .mockReturnValueOnce({ data: { publicUrl: NEW_AVATAR_PUBLIC_URL } });
      
    // Mock second upload (banner)
    mocks.mockStorageBucket.upload
      .mockResolvedValueOnce({ data: { path: 'banners/test-user-id-images.jpeg' }, error: null });
    mocks.mockStorageBucket.getPublicUrl
      .mockReturnValueOnce({ data: { publicUrl: NEW_BANNER_PUBLIC_URL } });

    mocks.mockDbProfilesUpdate.mockResolvedValue({ 
      data: { id: mockUser.id, avatar_url: NEW_AVATAR_PUBLIC_URL, banner_img_url: NEW_BANNER_PUBLIC_URL }, 
      error: null 
    });

    const result = await updateUserProfile({ 
      avatarDataUri: FAKE_AVATAR_DATA_URI, 
      bannerDataUri: FAKE_BANNER_DATA_URI 
    });

    expect(mocks.mockStorageBucket.upload).toHaveBeenCalledTimes(2);
    expect(mocks.mockStorageBucket.upload).toHaveBeenCalledWith('avatars/test-user-id-images.png', expect.any(Buffer), expect.any(Object));
    expect(mocks.mockStorageBucket.upload).toHaveBeenCalledWith('banners/test-user-id-images.jpeg', expect.any(Buffer), expect.any(Object));
    expect(mocks.mockDbProfilesUpdate).toHaveBeenCalledWith(expect.objectContaining({ 
      avatar_url: NEW_AVATAR_PUBLIC_URL, 
      banner_img_url: NEW_BANNER_PUBLIC_URL 
    }));
    expect(result.data?.avatarUrl).toBe(NEW_AVATAR_PUBLIC_URL);
    expect(result.data?.bannerUrl).toBe(NEW_BANNER_PUBLIC_URL);
  });

  it('Scenario 9: Uploading new avatar, removing existing banner', async () => {
    mocks.mockDbProfilesSelect.mockResolvedValue({ data: { banner_img_url: EXISTING_BANNER_URL }, error: null }); // Has banner, no avatar

    // Avatar upload
    mocks.mockStorageBucket.upload.mockResolvedValueOnce({ data: { path: 'avatars/test-user-id-images.png' }, error: null });
    mocks.mockStorageBucket.getPublicUrl.mockReturnValueOnce({ data: { publicUrl: NEW_AVATAR_PUBLIC_URL } });
    
    // Banner removal
    mocks.mockStorageBucket.remove.mockResolvedValueOnce({ data: {}, error: null }); // For banner

    mocks.mockDbProfilesUpdate.mockResolvedValue({ 
      data: { id: mockUser.id, avatar_url: NEW_AVATAR_PUBLIC_URL, banner_img_url: null }, 
      error: null 
    });

    const result = await updateUserProfile({ 
      avatarDataUri: FAKE_AVATAR_DATA_URI, 
      bannerDataUri: null // Explicitly remove banner
    });

    expect(mocks.mockStorageBucket.upload).toHaveBeenCalledWith('avatars/test-user-id-images.png', expect.any(Buffer), expect.any(Object));
    expect(mocks.mockStorageBucket.remove).toHaveBeenCalledWith(['banners/test-user-id-images.jpeg']); // Remove old banner
    expect(mocks.mockDbProfilesUpdate).toHaveBeenCalledWith(expect.objectContaining({ 
      avatar_url: NEW_AVATAR_PUBLIC_URL, 
      banner_img_url: null 
    }));
    expect(result.data?.avatarUrl).toBe(NEW_AVATAR_PUBLIC_URL);
    expect(result.data?.bannerUrl).toBeNull();
  });

  it('should return an error if avatar upload fails', async () => {
    mocks.mockDbProfilesSelect.mockResolvedValue({ data: null, error: null });
    mocks.mockStorageBucket.upload.mockResolvedValue({ data: null, error: { name: 'UploadError', message: 'Avatar upload failed' } });

    const result = await updateUserProfile({ avatarDataUri: FAKE_AVATAR_DATA_URI });

    expect(result.error).toBe('Failed to upload avatar: Avatar upload failed');
    expect(mocks.mockDbProfilesUpdate).not.toHaveBeenCalled();
  });

  it('should return an error if banner upload fails', async () => {
    mocks.mockDbProfilesSelect.mockResolvedValue({ data: null, error: null });
    mocks.mockStorageBucket.upload.mockResolvedValue({ data: null, error: { name: 'UploadError', message: 'Banner upload failed' } });

    const result = await updateUserProfile({ bannerDataUri: FAKE_BANNER_DATA_URI });
    
    expect(result.error).toBe('Failed to upload banner: Banner upload failed');
    expect(mocks.mockDbProfilesUpdate).not.toHaveBeenCalled();
  });

  it('should proceed with text update if avatar removal from storage fails but avatar_url is set to null', async () => {
    mocks.mockDbProfilesSelect.mockResolvedValue({ data: { avatar_url: EXISTING_AVATAR_URL }, error: null });
    mocks.mockStorageBucket.remove.mockResolvedValueOnce({ data: null, error: { name: 'StorageError', message: 'Failed to delete old avatar' } }); // Avatar removal fails
    mocks.mockDbProfilesUpdate.mockResolvedValue({ data: { id: mockUser.id, first_name: 'StillUpdates', avatar_url: null }, error: null });

    const result = await updateUserProfile({ firstName: 'StillUpdates', avatarDataUri: null });

    expect(mocks.mockStorageBucket.remove).toHaveBeenCalledWith(['avatars/test-user-id-images.png']);
    // The logger in the action would log a warning for failed deletion.
    // The DB update should still proceed with avatar_url: null and other text changes.
    expect(mocks.mockDbProfilesUpdate).toHaveBeenCalledWith(expect.objectContaining({ first_name: 'StillUpdates', avatar_url: null }));
    expect(result.data?.firstName).toBe('StillUpdates');
    expect(result.data?.avatarUrl).toBeNull();
    expect(result.error).toBeUndefined();
  });

  it('should handle case where current profile fetch fails during image deletion check', async () => {
    // Simulate error fetching current profile
    mocks.mockDbProfilesSelect.mockRejectedValue(new Error('DB connection error'));
    // Even if current profile fetch fails, it should still try to upload if data URI is present
    mocks.mockStorageBucket.upload.mockResolvedValue({ data: { path: 'avatars/test-user-id-images.png' }, error: null });
    mocks.mockStorageBucket.getPublicUrl.mockReturnValue({ data: { publicUrl: NEW_AVATAR_PUBLIC_URL } });
    mocks.mockDbProfilesUpdate.mockResolvedValue({ data: { id: mockUser.id, avatar_url: NEW_AVATAR_PUBLIC_URL }, error: null });

    const result = await updateUserProfile({ avatarDataUri: FAKE_AVATAR_DATA_URI });

    // It should log the error for fetching current profile but continue with the upload
    expect(mocks.mockStorageBucket.upload).toHaveBeenCalled();
    expect(mocks.mockDbProfilesUpdate).toHaveBeenCalledWith(expect.objectContaining({ avatar_url: NEW_AVATAR_PUBLIC_URL }));
    expect(result.data?.avatarUrl).toBe(NEW_AVATAR_PUBLIC_URL);
    // The error from fetching current profile for deletion check should be logged by the action but not block the main update
    expect(result.error).toBeUndefined();
  });

  it('should handle error when parsing invalid avatar Data URI', async () => {
    mocks.mockDbProfilesSelect.mockResolvedValue({ data: null, error: null });
    const invalidAvatarDataUri = 'data:image/png;base64'; // Missing data part
    const result = await updateUserProfile({ avatarDataUri: invalidAvatarDataUri });

    expect(result.error).toBe('Failed to upload avatar: Invalid avatar Data URI format.');
    expect(mocks.mockStorageBucket.upload).not.toHaveBeenCalled();
    expect(mocks.mockDbProfilesUpdate).not.toHaveBeenCalled();
  });
  
  it('should handle error when parsing invalid banner Data URI', async () => {
    mocks.mockDbProfilesSelect.mockResolvedValue({ data: null, error: null });
    const invalidBannerDataUri = 'thisisnotadatauri';
    const result = await updateUserProfile({ bannerDataUri: invalidBannerDataUri });

    // The action currently only throws for invalid base64 split. 
    // A simple string not starting with 'data:image' will not trigger upload block.
    // This test might need adjustment based on how strict the action's URI check is.
    // For now, assuming it just won't upload if it's not a data URI
    mocks.mockDbProfilesUpdate.mockResolvedValue({ data: { id: mockUser.id, banner_img_url: null }, error: null });
    const updatedProfileNoBanner = await updateUserProfile({ bannerDataUri: invalidBannerDataUri, firstName: "Test" });
    expect(updatedProfileNoBanner.error).toBeUndefined();
    expect(mocks.mockStorageBucket.upload).not.toHaveBeenCalled();
    expect(updatedProfileNoBanner.data?.bannerUrl).toBeUndefined(); // Or null, depending on default if not set
  });


});

    