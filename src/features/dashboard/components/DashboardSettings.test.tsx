import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

import { DashboardSettings } from './DashboardSettings';
import { useSidebar, SidebarProvider } from '@/components/ui/sidebar'; // We need SidebarProvider to host the context

// Mock the actual useSidebar hook
jest.mock('@/components/ui/sidebar', () => {
  const originalModule = jest.requireActual('@/components/ui/sidebar');
  return {
    ...originalModule,
    useSidebar: jest.fn(),
  };
});

// Typed mock for useSidebar
const mockedUseSidebar = useSidebar as jest.MockedFunction<typeof useSidebar>;

describe('DashboardSettings', () => {
  let mockSetVariant: jest.Mock;
  let mockSetCollapsible: jest.Mock;

  beforeEach(() => {
    mockSetVariant = jest.fn();
    mockSetCollapsible = jest.fn();

    // Provide default mock implementation for useSidebar
    mockedUseSidebar.mockReturnValue({
      variant: 'sidebar',
      setVariant: mockSetVariant,
      collapsible: 'offcanvas',
      setCollapsible: mockSetCollapsible,
      open: true,
      setOpen: jest.fn(),
      state: 'expanded',
      isMobile: false,
      openMobile: false,
      setOpenMobile: jest.fn(),
      toggleSidebar: jest.fn(),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders settings title and controls', () => {
    render(<DashboardSettings />);

    expect(screen.getByText('Sidebar Settings')).toBeInTheDocument();
    expect(screen.getByLabelText('Default')).toBeInTheDocument(); // Variant: sidebar
    expect(screen.getByLabelText('Floating')).toBeInTheDocument(); // Variant: floating
    expect(screen.getByLabelText('Inset')).toBeInTheDocument(); // Variant: inset
    expect(screen.getByLabelText('Off-canvas')).toBeInTheDocument(); // Collapsible: offcanvas
    expect(screen.getByLabelText('Icon Only')).toBeInTheDocument(); // Collapsible: icon
    expect(screen.getByLabelText('None (Always Open)')).toBeInTheDocument(); // Collapsible: none
  });

  test('displays current variant and collapsible mode from useSidebar', () => {
    mockedUseSidebar.mockReturnValue({
      ...mockedUseSidebar(), // gets default values from beforeEach
      variant: 'floating',
      collapsible: 'icon',
    });

    render(<DashboardSettings />);

    // Check if the correct radio buttons are checked based on mocked context
    // For Shadcn RadioGroup, the checked item has data-state="checked" on RadioGroupItem
    // and the Label associated with it might have a specific style or attribute.
    // We'll check the descriptive text.
    expect(screen.getByText(/Current variant: floating/i)).toBeInTheDocument();
    expect(screen.getByText(/Current collapsible mode: icon/i)).toBeInTheDocument();

    // To be more precise for radio buttons, check the underlying input's checked state
    const floatingRadio = screen.getByLabelText('Floating').previousElementSibling as HTMLInputElement;
    expect(floatingRadio).toBeChecked();

    const iconRadio = screen.getByLabelText('Icon Only').previousElementSibling as HTMLInputElement;
    expect(iconRadio).toBeChecked();
  });

  test('calls setVariant when a variant radio button is clicked', () => {
    render(<DashboardSettings />);

    // Click on the "Inset" variant label, which should trigger the radio item
    fireEvent.click(screen.getByLabelText('Inset'));
    expect(mockSetVariant).toHaveBeenCalledTimes(1);
    expect(mockSetVariant).toHaveBeenCalledWith('inset');
  });

  test('calls setCollapsible when a collapsible mode radio button is clicked', () => {
    render(<DashboardSettings />);

    // Click on the "Icon Only" collapsible mode label
    fireEvent.click(screen.getByLabelText('Icon Only'));
    expect(mockSetCollapsible).toHaveBeenCalledTimes(1);
    expect(mockSetCollapsible).toHaveBeenCalledWith('icon');
  });

  test('radio buttons for variant correctly reflect initial state', () => {
    mockedUseSidebar.mockReturnValue({
      ...mockedUseSidebar(),
      variant: 'inset',
    });
    render(<DashboardSettings />);
    const insetRadio = screen.getByLabelText('Inset').previousElementSibling as HTMLInputElement;
    expect(insetRadio).toBeChecked();
  });

  test('radio buttons for collapsible mode correctly reflect initial state', () => {
    mockedUseSidebar.mockReturnValue({
      ...mockedUseSidebar(),
      collapsible: 'none',
    });
    render(<DashboardSettings />);
    const noneRadio = screen.getByLabelText('None (Always Open)').previousElementSibling as HTMLInputElement;
    expect(noneRadio).toBeChecked();
  });
});
