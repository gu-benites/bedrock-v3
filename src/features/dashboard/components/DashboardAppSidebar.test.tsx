import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { DashboardAppSidebar } from './DashboardAppSidebar';
import { SidebarProvider } from '@/components/ui/sidebar'; // Original SidebarProvider

// Mock child components to simplify testing and focus on DashboardAppSidebar structure
jest.mock('@/components/nav-main', () => ({
  NavMain: jest.fn(() => <div data-testid="nav-main">NavMain</div>),
}));
jest.mock('@/components/nav-documents', () => ({
  NavDocuments: jest.fn(() => <div data-testid="nav-documents">NavDocuments</div>),
}));
jest.mock('@/components/nav-secondary', () => ({
  NavSecondary: jest.fn(() => <div data-testid="nav-secondary">NavSecondary</div>),
}));
jest.mock('./dashboard-user-menu', () => ({
  DashboardUserMenu: jest.fn(() => <div data-testid="dashboard-user-menu">DashboardUserMenu</div>),
}));

// Mock useIsMobile hook as it's used internally by SidebarProvider
jest.mock('@/hooks/use-mobile', () => ({
  useIsMobile: jest.fn(() => false),
}));


describe('DashboardAppSidebar', () => {
  test('renders without errors within a SidebarProvider', () => {
    expect(() => {
      render(
        <SidebarProvider>
          <DashboardAppSidebar />
        </SidebarProvider>
      );
    }).not.toThrow();
  });

  test('renders key child components', () => {
    render(
      <SidebarProvider>
        <DashboardAppSidebar />
      </SidebarProvider>
    );

    // Check for parts of the Sidebar component itself that DashboardAppSidebar configures
    // These data attributes are set by the underlying Sidebar component from ui/sidebar.tsx
    const sidebarElement = screen.getByRole('complementary'); // Assuming Sidebar renders a <aside> or similar landmark
    expect(sidebarElement).toBeInTheDocument();

    // Check for mocked child components
    expect(screen.getByTestId('nav-main')).toBeInTheDocument();
    expect(screen.getByTestId('nav-documents')).toBeInTheDocument();
    expect(screen.getByTestId('nav-secondary')).toBeInTheDocument();
    expect(screen.getByTestId('dashboard-user-menu')).toBeInTheDocument();

    // Check for general structure elements if possible (more fragile)
    // For example, SidebarHeader, SidebarContent, SidebarFooter are abstract parts of the Sidebar from ui/sidebar
    // We can check if their children (our Nav components) are present.
    // A better way might be to check for specific text or accessible names if available.
    // For now, checking for the presence of the mocked nav components implies their containers are rendered.
    expect(screen.getByText('Acme Inc.')).toBeInTheDocument(); // From SidebarHeader in DashboardAppSidebar
  });

  test('passes className to the underlying Sidebar', () => {
    const testClassName = "custom-sidebar-class";
    render(
      <SidebarProvider>
        <DashboardAppSidebar className={testClassName} />
      </SidebarProvider>
    );
    const sidebarElement = screen.getByRole('complementary');
    // The actual class might be combined with others by cn(), so we check for its inclusion.
    expect(sidebarElement.className).toContain(testClassName);
  });

});
