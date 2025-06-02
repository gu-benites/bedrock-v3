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
  from: jest.fn(), // This will be a general mock for .from()
  storage: {
    from: jest.fn(),
  },
};

const mockStorageBucket = {
  upload: jest.fn(),
  remove: jest.fn(),
  getPublicUrl: jest.fn(),
};

// Helper to reset and configure mocks before each test
const setupMocks = () => {
  jest.clearAllMocks();
  (createClient as jest.Mock).mockResolvedValue(mockSupabaseClient);
  mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });

  (mockSupabaseClient.storage.from as jest.Mock).mockReturnValue(mockStorageBucket);

  // Specific mocks for the .single() calls at the end of chains
  const mockSelectProfileSingle = jest.fn();
  const mockUpdateProfileSingle = jest.fn();

  // Mock for from('profiles').select().eq().single()
  const selectEqChain = { single: mockSelectProfileSingle };
  const selectFromProfilesChain = { eq: jest.fn().mockReturnValue(selectEqChain) };

  // Mock for from('profiles').update().eq().select().single()
  const updateSelectChain = { single: mockUpdateProfileSingle };
  const updateEqChain = { select: jest.fn().mockReturnValue(updateSelectChain) };
  const updateFromProfilesChain = { eq: jest.fn().mockReturnValue(updateEqChain) };

  (mockSupabaseClient.from as jest.Mock).mockImplementation((tableName: string) => {
    if (tableName === 'profiles') {
      return {
        select: jest.fn().mockReturnValue(selectFromProfilesChain),
        update: jest.fn().mockReturnValue(updateFromProfilesChain),
      };
    }
    return {};
  });

  return {
    mockStorageBucket,
    mockSelectProfileSingle, // Use this for asserting/mocking profile selections
    mockUpdateProfileSingle, // Use this for asserting/mocking profile updates
  };
};

const FAKE_AVATAR_DATA_URI = 'data:image/png;base64,fakeavatardata';
const FAKE_BANNER_DATA_URI = 'data:image/jpeg;base64,fakebannerdata';
const EXISTING_AVATAR_URL = 'https://example.com/storage/v1/object/public/profiles/avatars/test-user-id-images.png';
const EXISTING_BANNER_URL = 'https://example.com/storage/v1/object/public/profiles/banners/test-user-id-images.jpeg';
const NEW_AVATAR_PUBLIC_URL = 'https://example.com/storage/v1/object/public/profiles/avatars/test-user-id-images_new.png';
const NEW_BANNER_PUBLIC_URL = 'https://example.com/storage/v1/object/public/profiles/banners/test-user-id-images_new.jpeg';


describe('updateUserProfile - Image Handling Scenarios', () => {
  let mocks: ReturnType<typeof setupMocks>;

  beforeEach(() => {
    mocks = setupMocks();
  });

  it('Scenario 1: Uploading only an avatar (no existing images)', async () => {
    mocks.mockSelectProfileSingle.mockResolvedValue({ data: null, error: null }); // No existing profile / images
    mocks.mockStorageBucket.upload.mockResolvedValue({ data: { path: 'avatars/test-user-id-images.png' }, error: null });
    mocks.mockStorageBucket.getPublicUrl.mockReturnValue({ data: { publicUrl: NEW_AVATAR_PUBLIC_URL } });
    mocks.mockUpdateProfileSingle.mockResolvedValue({ data: { id: mockUser.id, avatar_url: NEW_AVATAR_PUBLIC_URL, first_name: null, last_name: null, gender: null, age_category: null, specific_age: null, language: 'en', banner_img_url: null, bio: null, role: 'user', stripe_customer_id: null, subscription_status: null, subscription_tier: null, subscription_period: null, subscription_start_date: null, subscription_end_date: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }, error: null });

    const result = await updateUserProfile({ avatarDataUri: FAKE_AVATAR_DATA_URI });

    expect(mocks.mockStorageBucket.upload).toHaveBeenCalledWith(
      'avatars/test-user-id-images.png',
      expect.any(Buffer),
      expect.objectContaining({ contentType: 'image/png', upsert: true })
    );
    expect(mocks.mockStorageBucket.remove).not.toHaveBeenCalled();
    // Check the arguments of the update call on the 'profiles' table mock
    expect((mockSupabaseClient.from('profiles').update as jest.Mock).mock.calls[0][0]).toEqual(
        expect.objectContaining({ avatar_url: NEW_AVATAR_PUBLIC_URL })
    );
    expect(result.data?.avatarUrl).toBe(NEW_AVATAR_PUBLIC_URL);
    expect(result.error).toBeUndefined();
  });

  it('Scenario 2: Uploading only a banner (no existing images)', async () => {
    mocks.mockSelectProfileSingle.mockResolvedValue({ data: null, error: null });
    mocks.mockStorageBucket.upload.mockResolvedValue({ data: { path: 'banners/test-user-id-images.jpeg' }, error: null });
    mocks.mockStorageBucket.getPublicUrl.mockReturnValue({ data: { publicUrl: NEW_BANNER_PUBLIC_URL } });
    mocks.mockUpdateProfileSingle.mockResolvedValue({ data: { id: mockUser.id, banner_img_url: NEW_BANNER_PUBLIC_URL, first_name: null, last_name: null, gender: null, age_category: null, specific_age: null, language: 'en', avatar_url: null, bio: null, role: 'user', stripe_customer_id: null, subscription_status: null, subscription_tier: null, subscription_period: null, subscription_start_date: null, subscription_end_date: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }, error: null });

    const result = await updateUserProfile({ bannerDataUri: FAKE_BANNER_DATA_URI });

    expect(mocks.mockStorageBucket.upload).toHaveBeenCalledWith(
      'banners/test-user-id-images.jpeg',
      expect.any(Buffer),
      expect.objectContaining({ contentType: 'image/jpeg', upsert: true })
    );
    expect(mocks.mockStorageBucket.remove).not.toHaveBeenCalled();
    expect((mockSupabaseClient.from('profiles').update as jest.Mock).mock.calls[0][0]).toEqual(
        expect.objectContaining({ banner_img_url: NEW_BANNER_PUBLIC_URL })
    );
    expect(result.data?.bannerUrl).toBe(NEW_BANNER_PUBLIC_URL);
    expect(result.error).toBeUndefined();
  });

  it('Scenario 3: Uploading a new avatar when an old one exists', async () => {
    mocks.mockSelectProfileSingle.mockResolvedValue({ data: { avatar_url: EXISTING_AVATAR_URL }, error: null });
    mocks.mockStorageBucket.remove.mockResolvedValue({ data: {}, error: null });
    mocks.mockStorageBucket.upload.mockResolvedValue({ data: { path: 'avatars/test-user-id-images_new.png' }, error: null });
    mocks.mockStorageBucket.getPublicUrl.mockReturnValue({ data: { publicUrl: NEW_AVATAR_PUBLIC_URL } });
    mocks.mockUpdateProfileSingle.mockResolvedValue({ data: { id: mockUser.id, avatar_url: NEW_AVATAR_PUBLIC_URL }, error: null });

    const result = await updateUserProfile({ avatarDataUri: FAKE_AVATAR_DATA_URI });

    expect(mocks.mockStorageBucket.remove).toHaveBeenCalledWith(['avatars/test-user-id-images.png']);
    expect(mocks.mockStorageBucket.upload).toHaveBeenCalled();
    expect((mockSupabaseClient.from('profiles').update as jest.Mock).mock.calls[0][0]).toEqual(
        expect.objectContaining({ avatar_url: NEW_AVATAR_PUBLIC_URL })
    );
    expect(result.data?.avatarUrl).toBe(NEW_AVATAR_PUBLIC_URL);
  });

  it('Scenario 4: Uploading a new banner when an old one exists', async () => {
    mocks.mockSelectProfileSingle.mockResolvedValue({ data: { banner_img_url: EXISTING_BANNER_URL }, error: null });
    mocks.mockStorageBucket.remove.mockResolvedValue({ data: {}, error: null });
    mocks.mockStorageBucket.upload.mockResolvedValue({ data: { path: 'banners/test-user-id-images_new.jpeg' }, error: null });
    mocks.mockStorageBucket.getPublicUrl.mockReturnValue({ data: { publicUrl: NEW_BANNER_PUBLIC_URL } });
    mocks.mockUpdateProfileSingle.mockResolvedValue({ data: { id: mockUser.id, banner_img_url: NEW_BANNER_PUBLIC_URL }, error: null });

    const result = await updateUserProfile({ bannerDataUri: FAKE_BANNER_DATA_URI });

    expect(mocks.mockStorageBucket.remove).toHaveBeenCalledWith(['banners/test-user-id-images.jpeg']);
    expect(mocks.mockStorageBucket.upload).toHaveBeenCalled();
    expect((mockSupabaseClient.from('profiles').update as jest.Mock).mock.calls[0][0]).toEqual(
        expect.objectContaining({ banner_img_url: NEW_BANNER_PUBLIC_URL })
    );
    expect(result.data?.bannerUrl).toBe(NEW_BANNER_PUBLIC_URL);
  });

  it('Scenario 5: Updating text fields when images exist (no new image data, avatarDataUri/bannerDataUri are undefined)', async () => {
    mocks.mockSelectProfileSingle.mockResolvedValue({ data: { avatar_url: EXISTING_AVATAR_URL, banner_img_url: EXISTING_BANNER_URL }, error: null });
    mocks.mockUpdateProfileSingle.mockResolvedValue({
      data: {
        id: mockUser.id,
        first_name: 'UpdatedName',
        avatar_url: EXISTING_AVATAR_URL,
        banner_img_url: EXISTING_BANNER_URL,
        updated_at: new Date().toISOString()
      },
      error: null
    });

    const result = await updateUserProfile({ firstName: 'UpdatedName' });

    expect(mocks.mockStorageBucket.upload).not.toHaveBeenCalled();
    expect(mocks.mockStorageBucket.remove).not.toHaveBeenCalled();
    expect((mockSupabaseClient.from('profiles').update as jest.Mock).mock.calls[0][0]).toEqual(
        expect.objectContaining({ first_name: 'UpdatedName' })
    );
    expect(result.data?.firstName).toBe('UpdatedName');
    expect(result.data?.avatarUrl).toBe(EXISTING_AVATAR_URL);
    expect(result.data?.bannerUrl).toBe(EXISTING_BANNER_URL);
  });

  it('Scenario 5b: Updating text fields (avatarDataUri/bannerDataUri explicitly empty string - should be ignored by action for upload)', async () => {
    mocks.mockSelectProfileSingle.mockResolvedValue({ data: { avatar_url: EXISTING_AVATAR_URL, banner_img_url: EXISTING_BANNER_URL }, error: null });
    mocks.mockUpdateProfileSingle.mockResolvedValue({
      data: {
        id: mockUser.id,
        first_name: 'UpdatedName',
        avatar_url: EXISTING_AVATAR_URL,
        banner_img_url: EXISTING_BANNER_URL,
        updated_at: new Date().toISOString()
      },
      error: null
    });

    const result = await updateUserProfile({
      firstName: 'UpdatedName',
      avatarDataUri: '',
      bannerDataUri: ''
    });

    expect(mocks.mockStorageBucket.upload).not.toHaveBeenCalled();
    expect(mocks.mockStorageBucket.remove).not.toHaveBeenCalled();
    expect((mockSupabaseClient.from('profiles').update as jest.Mock).mock.calls[0][0]).toEqual(
        expect.objectContaining({ first_name: 'UpdatedName' })
    );
    expect(result.data?.firstName).toBe('UpdatedName');
    expect(result.data?.avatarUrl).toBe(EXISTING_AVATAR_URL);
    expect(result.data?.bannerUrl).toBe(EXISTING_BANNER_URL);
  });

  it('Scenario 6: Explicitly removing an avatar (avatarDataUri is null)', async () => {
    mocks.mockSelectProfileSingle.mockResolvedValue({ data: { avatar_url: EXISTING_AVATAR_URL }, error: null });
    mocks.mockStorageBucket.remove.mockResolvedValue({ data: {}, error: null });
    mocks.mockUpdateProfileSingle.mockResolvedValue({ data: { id: mockUser.id, avatar_url: null }, error: null });

    const result = await updateUserProfile({ avatarDataUri: null });

    expect(mocks.mockStorageBucket.remove).toHaveBeenCalledWith(['avatars/test-user-id-images.png']);
    expect(mocks.mockStorageBucket.upload).not.toHaveBeenCalled();
    expect((mockSupabaseClient.from('profiles').update as jest.Mock).mock.calls[0][0]).toEqual(
        expect.objectContaining({ avatar_url: null })
    );
    expect(result.data?.avatarUrl).toBeNull();
  });

  it('Scenario 7: Explicitly removing a banner (bannerDataUri is null)', async () => {
    mocks.mockSelectProfileSingle.mockResolvedValue({ data: { banner_img_url: EXISTING_BANNER_URL }, error: null });
    mocks.mockStorageBucket.remove.mockResolvedValue({ data: {}, error: null });
    mocks.mockUpdateProfileSingle.mockResolvedValue({ data: { id: mockUser.id, banner_img_url: null }, error: null });

    const result = await updateUserProfile({ bannerDataUri: null });

    expect(mocks.mockStorageBucket.remove).toHaveBeenCalledWith(['banners/test-user-id-images.jpeg']);
    expect(mocks.mockStorageBucket.upload).not.toHaveBeenCalled();
    expect((mockSupabaseClient.from('profiles').update as jest.Mock).mock.calls[0][0]).toEqual(
        expect.objectContaining({ banner_img_url: null })
    );
    expect(result.data?.bannerUrl).toBeNull();
  });

  it('Scenario 8: Uploading both avatar and banner (both new, no existing)', async () => {
    mocks.mockSelectProfileSingle.mockResolvedValue({ data: null, error: null });

    mocks.mockStorageBucket.upload
      .mockResolvedValueOnce({ data: { path: 'avatars/test-user-id-images.png' }, error: null }) // Avatar
      .mockResolvedValueOnce({ data: { path: 'banners/test-user-id-images.jpeg' }, error: null }); // Banner
    mocks.mockStorageBucket.getPublicUrl
      .mockReturnValueOnce({ data: { publicUrl: NEW_AVATAR_PUBLIC_URL } }) // Avatar
      .mockReturnValueOnce({ data: { publicUrl: NEW_BANNER_PUBLIC_URL } }); // Banner

    mocks.mockUpdateProfileSingle.mockResolvedValue({
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
    expect((mockSupabaseClient.from('profiles').update as jest.Mock).mock.calls[0][0]).toEqual(
        expect.objectContaining({ avatar_url: NEW_AVATAR_PUBLIC_URL, banner_img_url: NEW_BANNER_PUBLIC_URL })
    );
    expect(result.data?.avatarUrl).toBe(NEW_AVATAR_PUBLIC_URL);
    expect(result.data?.bannerUrl).toBe(NEW_BANNER_PUBLIC_URL);
  });

  it('Scenario 9: Uploading new avatar, removing existing banner', async () => {
    mocks.mockSelectProfileSingle.mockResolvedValue({ data: { banner_img_url: EXISTING_BANNER_URL }, error: null });

    mocks.mockStorageBucket.upload.mockResolvedValueOnce({ data: { path: 'avatars/test-user-id-images.png' }, error: null }); // Avatar
    mocks.mockStorageBucket.getPublicUrl.mockReturnValueOnce({ data: { publicUrl: NEW_AVATAR_PUBLIC_URL } }); // Avatar
    mocks.mockStorageBucket.remove.mockResolvedValueOnce({ data: {}, error: null }); // Banner removal

    mocks.mockUpdateProfileSingle.mockResolvedValue({
      data: { id: mockUser.id, avatar_url: NEW_AVATAR_PUBLIC_URL, banner_img_url: null },
      error: null
    });

    const result = await updateUserProfile({
      avatarDataUri: FAKE_AVATAR_DATA_URI,
      bannerDataUri: null
    });

    expect(mocks.mockStorageBucket.upload).toHaveBeenCalledWith('avatars/test-user-id-images.png', expect.any(Buffer), expect.any(Object));
    expect(mocks.mockStorageBucket.remove).toHaveBeenCalledWith(['banners/test-user-id-images.jpeg']);
    expect((mockSupabaseClient.from('profiles').update as jest.Mock).mock.calls[0][0]).toEqual(
        expect.objectContaining({ avatar_url: NEW_AVATAR_PUBLIC_URL, banner_img_url: null })
    );
    expect(result.data?.avatarUrl).toBe(NEW_AVATAR_PUBLIC_URL);
    expect(result.data?.bannerUrl).toBeNull();
  });

  it('should return an error if avatar upload fails', async () => {
    mocks.mockSelectProfileSingle.mockResolvedValue({ data: null, error: null });
    mocks.mockStorageBucket.upload.mockResolvedValue({ data: null, error: { name: 'UploadError', message: 'Avatar upload failed' } });

    const result = await updateUserProfile({ avatarDataUri: FAKE_AVATAR_DATA_URI });

    expect(result.error).toBe('Failed to upload avatar: Avatar upload failed');
    expect(mocks.mockUpdateProfileSingle).not.toHaveBeenCalled();
  });

  it('should return an error if banner upload fails', async () => {
    mocks.mockSelectProfileSingle.mockResolvedValue({ data: null, error: null });
    mocks.mockStorageBucket.upload.mockResolvedValue({ data: null, error: { name: 'UploadError', message: 'Banner upload failed' } });

    const result = await updateUserProfile({ bannerDataUri: FAKE_BANNER_DATA_URI });

    expect(result.error).toBe('Failed to upload banner: Banner upload failed');
    expect(mocks.mockUpdateProfileSingle).not.toHaveBeenCalled();
  });

  it('should proceed with text update if avatar removal from storage fails but avatar_url is set to null', async () => {
    mocks.mockSelectProfileSingle.mockResolvedValue({ data: { avatar_url: EXISTING_AVATAR_URL }, error: null });
    mocks.mockStorageBucket.remove.mockResolvedValueOnce({ data: null, error: { name: 'StorageError', message: 'Failed to delete old avatar' } });
    mocks.mockUpdateProfileSingle.mockResolvedValue({ data: { id: mockUser.id, first_name: 'StillUpdates', avatar_url: null, updated_at: new Date().toISOString() }, error: null });

    const result = await updateUserProfile({ firstName: 'StillUpdates', avatarDataUri: null });

    expect(mocks.mockStorageBucket.remove).toHaveBeenCalledWith(['avatars/test-user-id-images.png']);
    expect((mockSupabaseClient.from('profiles').update as jest.Mock).mock.calls[0][0]).toEqual(
        expect.objectContaining({ first_name: 'StillUpdates', avatar_url: null })
    );
    expect(result.data?.firstName).toBe('StillUpdates');
    expect(result.data?.avatarUrl).toBeNull();
    expect(result.error).toBeUndefined();
  });

  it('should handle case where current profile fetch fails during image deletion check but still attempt upload', async () => {
    mocks.mockSelectProfileSingle.mockRejectedValue(new Error('DB connection error')); // Simulate error fetching current profile
    mocks.mockStorageBucket.upload.mockResolvedValue({ data: { path: 'avatars/test-user-id-images.png' }, error: null });
    mocks.mockStorageBucket.getPublicUrl.mockReturnValue({ data: { publicUrl: NEW_AVATAR_PUBLIC_URL } });
    mocks.mockUpdateProfileSingle.mockResolvedValue({ data: { id: mockUser.id, avatar_url: NEW_AVATAR_PUBLIC_URL }, error: null });

    const result = await updateUserProfile({ avatarDataUri: FAKE_AVATAR_DATA_URI });

    expect(mocks.mockStorageBucket.upload).toHaveBeenCalled();
    expect((mockSupabaseClient.from('profiles').update as jest.Mock).mock.calls[0][0]).toEqual(
        expect.objectContaining({ avatar_url: NEW_AVATAR_PUBLIC_URL })
    );
    expect(result.data?.avatarUrl).toBe(NEW_AVATAR_PUBLIC_URL);
    expect(result.error).toBeUndefined(); // Error is logged internally but doesn't block upload
  });

  it('should handle error when parsing invalid avatar Data URI', async () => {
    mocks.mockSelectProfileSingle.mockResolvedValue({ data: null, error: null });
    const invalidAvatarDataUri = 'data:image/png;base64'; // Missing data part
    
    // This scenario should not call the DB update if it errors out early
    // So, we don't need to mock mockUpdateProfileSingle for success here.

    const result = await updateUserProfile({ avatarDataUri: invalidAvatarDataUri });

    expect(result.error).toBe('Failed to upload avatar: Invalid avatar Data URI format.');
    expect(mocks.mockStorageBucket.upload).not.toHaveBeenCalled();
    expect(mocks.mockUpdateProfileSingle).not.toHaveBeenCalled();
  });

  it('should proceed with text update if banner Data URI is invalid (non-data URI string)', async () => {
    mocks.mockSelectProfileSingle.mockResolvedValue({ data: null, error: null });
    const invalidBannerDataUri = 'thisisnotadatauri';
    // If only text fields are updated, bannerUrl should remain as it was or be undefined if new
    mocks.mockUpdateProfileSingle.mockResolvedValue({ data: { id: mockUser.id, first_name: "Test", banner_img_url: undefined }, error: null });

    const result = await updateUserProfile({ bannerDataUri: invalidBannerDataUri, firstName: "Test" });

    expect(result.error).toBeUndefined();
    expect(mocks.mockStorageBucket.upload).not.toHaveBeenCalled();
    expect((mockSupabaseClient.from('profiles').update as jest.Mock).mock.calls[0][0]).toEqual(
        expect.objectContaining({ first_name: "Test" })
    );
    // banner_img_url should not be in the update object if invalidBannerDataUri is not a valid data URI and not null
    expect((mockSupabaseClient.from('profiles').update as jest.Mock).mock.calls[0][0].banner_img_url).toBeUndefined();
    expect(result.data?.bannerUrl).toBeUndefined();
  });
});
