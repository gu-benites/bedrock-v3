# Profile Component Tests

This directory contains comprehensive tests for the profile uploader components and related utilities.

## 📁 Test Structure

```
__tests__/
├── profile-avatar-uploader.test.tsx    # Avatar uploader component tests
├── profile-banner-uploader.test.tsx    # Banner uploader component tests
└── README.md                           # This documentation
```

## 🧪 Test Coverage

### ProfileAvatarUploader Component (18 tests)
- **Rendering Tests (7 tests)**
  - Default state rendering
  - Image display with defaultImage prop
  - Loading state with spinner
  - Error state with visual indicators
  - Remove button visibility
  - Disabled state handling
  - Accessibility features

- **User Interactions (4 tests)**
  - Avatar click triggers file input
  - Keyboard navigation (Enter/Space)
  - Remove button functionality
  - File input triggering

- **File Upload Validation (3 tests)**
  - Valid file upload with success toast
  - Invalid file rejection with error toast
  - Upload error handling

- **Error Display (2 tests)**
  - String error message display
  - Error object message formatting

- **Accessibility (2 tests)**
  - ARIA labels and roles
  - Keyboard navigation support

### ProfileBannerUploader Component (20 tests)
- **Rendering Tests (7 tests)**
  - Default state with placeholder
  - Image display with defaultImage prop
  - Loading state with spinner
  - Error state with visual indicators
  - Remove button visibility
  - Disabled state handling
  - Placeholder icon display

- **User Interactions (3 tests)**
  - Upload button click triggers file input
  - Remove button with onRemove callback
  - Remove button with hook default behavior

- **File Upload Validation (4 tests)**
  - Large file upload with success toast (>2MB)
  - Small file upload without toast (<2MB)
  - Invalid file rejection with error toast
  - Upload error handling

- **Error Display (2 tests)**
  - String error message display
  - Error object message formatting

- **Accessibility (3 tests)**
  - ARIA labels and roles
  - Image alt text
  - Button accessibility

- **Component Lifecycle (1 test)**
  - defaultImage prop changes handling

### useImageUpload Hook (14 tests)
- **Initialization (2 tests)**
  - Default values setup
  - Initial preview URL handling

- **File Input Trigger (2 tests)**
  - File input click triggering
  - Missing ref graceful handling

- **File Change Handling (4 tests)**
  - File selection and reading
  - File reading error handling
  - Empty file selection
  - Null files handling

- **Remove Handling (2 tests)**
  - Remove with onUpload callback
  - Blob URL cleanup on remove

- **Preview URL Updates (2 tests)**
  - initialPreviewUrl changes
  - Undefined initialPreviewUrl handling

- **Edge Cases (2 tests)**
  - Multiple rapid file changes
  - FileReader unavailability

## 🛠️ Testing Technologies

### Core Testing Framework
- **Jest**: Test runner and assertion library
- **@testing-library/react**: React component testing utilities
- **@testing-library/user-event**: User interaction simulation
- **@testing-library/jest-dom**: Custom Jest matchers for DOM

### Test Environment
- **jsdom**: Browser environment simulation
- **jest-environment-jsdom**: Jest environment for DOM testing

### Mocking Strategy
- **Component Mocks**: UI components (Avatar, Button, Icons)
- **Hook Mocks**: useToast, useImageUpload
- **Utility Mocks**: Image validation functions
- **Browser API Mocks**: FileReader, URL, console methods

## 🎯 Key Testing Patterns

### 1. Component Rendering Tests
```typescript
it('should render with default state', () => {
  render(<TestWrapper><Component {...props} /></TestWrapper>);
  expect(screen.getByTestId('component')).toBeInTheDocument();
});
```

### 2. User Interaction Tests
```typescript
it('should handle user click', async () => {
  const user = userEvent.setup();
  render(<TestWrapper><Component {...props} /></TestWrapper>);
  
  await user.click(screen.getByRole('button'));
  expect(mockFunction).toHaveBeenCalled();
});
```

### 3. File Upload Tests
```typescript
it('should handle file upload', async () => {
  const mockFile = new File(['test'], 'test.png', { type: 'image/png' });
  
  render(<TestWrapper><Component {...props} /></TestWrapper>);
  
  const fileInput = document.querySelector('input[type="file"]');
  await act(async () => {
    fireEvent.change(fileInput, { target: { files: [mockFile] } });
  });
  
  expect(mockValidation).toHaveBeenCalledWith(mockFile);
});
```

### 4. Async Behavior Tests
```typescript
it('should handle async operations', async () => {
  // Setup async mock
  mockFunction.mockImplementation(() => {
    return new Promise(resolve => setTimeout(resolve, 10));
  });
  
  render(<TestWrapper><Component {...props} /></TestWrapper>);
  
  await waitFor(() => {
    expect(screen.getByText('Success')).toBeInTheDocument();
  });
});
```

## 🔧 Test Utilities

### TestWrapper Component
Provides React Hook Form context for components that require `control` prop:

```typescript
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { control } = useForm();
  return <div>{React.cloneElement(children, { control })}</div>;
};
```

### Mock Implementations
- **File Input Queries**: `document.querySelector('input[type="file"]')`
- **File Creation**: `new File(['content'], 'filename.ext', { type: 'mime/type' })`
- **Event Simulation**: `fireEvent.change(input, { target: { files: [file] } })`

## 🚀 Running Tests

### Run All Component Tests
```bash
npm test -- src/features/dashboard/profile/components/__tests__
```

### Run Specific Test File
```bash
npm test -- src/features/dashboard/profile/components/__tests__/profile-avatar-uploader.test.tsx
```

### Run Tests in Watch Mode
```bash
npm test -- --watch src/features/dashboard/profile/components/__tests__
```

### Run Tests with Coverage
```bash
npm test -- --coverage src/features/dashboard/profile/components/__tests__
```

## 📊 Test Quality Metrics

### Coverage Goals
- **Functions**: 100% - All exported functions tested
- **Branches**: 95%+ - All conditional paths covered
- **Lines**: 95%+ - All executable lines tested
- **Statements**: 95%+ - All statements covered

### Test Reliability
- ✅ **Deterministic**: Tests produce consistent results
- ✅ **Isolated**: Each test is independent
- ✅ **Fast**: Tests execute quickly (<10s total)
- ✅ **Maintainable**: Clear structure and naming

### Error Scenarios Covered
- ✅ Invalid file types and formats
- ✅ File size exceeding limits
- ✅ Network and upload failures
- ✅ Browser API unavailability
- ✅ Component prop edge cases
- ✅ User interaction edge cases

## 🎨 Best Practices Applied

1. **Descriptive Test Names**: Clear, specific test descriptions
2. **Arrange-Act-Assert**: Consistent test structure
3. **Mock Isolation**: Proper mock setup and cleanup
4. **Async Handling**: Proper async/await usage
5. **Error Testing**: Comprehensive error scenario coverage
6. **Accessibility Testing**: ARIA labels and keyboard navigation
7. **User-Centric Testing**: Testing from user perspective
8. **Edge Case Coverage**: Boundary conditions and error states

## 🔄 Continuous Integration

These tests are designed to run in CI/CD pipelines with:
- Consistent results across environments
- Proper mock cleanup between tests
- No external dependencies
- Fast execution times
- Clear failure reporting
