import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

import {
  SidebarProvider,
  useSidebar,
  Sidebar,
  SidebarTrigger,
  SidebarVariant,
  SidebarCollapsible,
} from './sidebar'; // Adjust path as necessary

// Mock useIsMobile hook as it's used internally by SidebarProvider
jest.mock('@/hooks/use-mobile', () => ({
  useIsMobile: jest.fn(() => false), // Default to not mobile for most tests
}));

// Test component to consume sidebar context
const TestConsumerComponent = () => {
  const context = useSidebar();
  if (!context) return null;
  return (
    <div>
      <div data-testid="variant">{context.variant}</div>
      <div data-testid="collapsible">{context.collapsible}</div>
      <div data-testid="open">{context.open.toString()}</div>
      <div data-testid="state">{context.state}</div>
      <button onClick={() => context.setVariant('floating')}>Set Variant Floating</button>
      <button onClick={() => context.setCollapsible('icon')}>Set Collapsible Icon</button>
      <button onClick={() => context.setOpen(false)}>Set Open False</button>
      <button onClick={() => context.toggleSidebar()}>Toggle Sidebar</button>
    </div>
  );
};

describe('SidebarProvider and useSidebar', () => {
  test('provides default values through useSidebar hook', () => {
    render(
      <SidebarProvider>
        <TestConsumerComponent />
      </SidebarProvider>
    );

    expect(screen.getByTestId('variant')).toHaveTextContent('sidebar');
    expect(screen.getByTestId('collapsible')).toHaveTextContent('offcanvas');
    expect(screen.getByTestId('open')).toHaveTextContent('true'); // defaultOpen is true
    expect(screen.getByTestId('state')).toHaveTextContent('expanded');
  });

  test('provides initial values through useSidebar hook', () => {
    render(
      <SidebarProvider initialVariant="inset" initialCollapsible="none" defaultOpen={false}>
        <TestConsumerComponent />
      </SidebarProvider>
    );

    expect(screen.getByTestId('variant')).toHaveTextContent('inset');
    expect(screen.getByTestId('collapsible')).toHaveTextContent('none');
    expect(screen.getByTestId('open')).toHaveTextContent('false');
    expect(screen.getByTestId('state')).toHaveTextContent('collapsed');
  });

  test('setVariant updates the variant value in context', () => {
    render(
      <SidebarProvider>
        <TestConsumerComponent />
      </SidebarProvider>
    );
    fireEvent.click(screen.getByText('Set Variant Floating'));
    expect(screen.getByTestId('variant')).toHaveTextContent('floating');
  });

  test('setCollapsible updates the collapsible value in context', () => {
    render(
      <SidebarProvider>
        <TestConsumerComponent />
      </SidebarProvider>
    );
    fireEvent.click(screen.getByText('Set Collapsible Icon'));
    expect(screen.getByTestId('collapsible')).toHaveTextContent('icon');
  });

  test('setOpen updates the open value in context', () => {
    render(
      <SidebarProvider>
        <TestConsumerComponent />
      </SidebarProvider>
    );
    fireEvent.click(screen.getByText('Set Open False'));
    expect(screen.getByTestId('open')).toHaveTextContent('false');
    expect(screen.getByTestId('state')).toHaveTextContent('collapsed');
  });

  test('toggleSidebar updates the open value in context', () => {
    render(
      <SidebarProvider>
        <TestConsumerComponent />
      </SidebarProvider>
    );
    // Default is open=true
    fireEvent.click(screen.getByText('Toggle Sidebar')); // Should set open to false
    expect(screen.getByTestId('open')).toHaveTextContent('false');
    expect(screen.getByTestId('state')).toHaveTextContent('collapsed');

    fireEvent.click(screen.getByText('Toggle Sidebar')); // Should set open to true
    expect(screen.getByTestId('open')).toHaveTextContent('true');
    expect(screen.getByTestId('state')).toHaveTextContent('expanded');
  });
});

describe('Sidebar component', () => {
  test('renders its children', () => {
    render(
      <SidebarProvider>
        <Sidebar>
          <div>Sidebar Child Content</div>
        </Sidebar>
      </SidebarProvider>
    );
    expect(screen.getByText('Sidebar Child Content')).toBeInTheDocument();
  });

  // More detailed tests for Sidebar could involve checking data attributes
  // based on context values (variant, collapsible, state), but this requires
  // the component to be structured to easily query those attributes.
});

describe('SidebarTrigger component', () => {
  test('renders and can be clicked (simulated)', () => {
    const handleClick = jest.fn();
    render(
      <SidebarProvider>
        <SidebarTrigger onClick={handleClick} />
      </SidebarProvider>
    );
    const triggerButton = screen.getByRole('button', { name: /toggle sidebar/i });
    expect(triggerButton).toBeInTheDocument();
    fireEvent.click(triggerButton);
    expect(handleClick).toHaveBeenCalledTimes(1);
    // Also test that context.toggleSidebar was called, which changes the state
    expect(screen.getByTestId('open')).toHaveTextContent('false'); // Assuming TestConsumerComponent is also rendered or state is testable another way
  });

   test('SidebarTrigger calls toggleSidebar from context', () => {
    render(
      <SidebarProvider>
        <TestConsumerComponent /> {/* To observe context changes */}
        <SidebarTrigger />
      </SidebarProvider>
    );
    const triggerButton = screen.getByRole('button', { name: /toggle sidebar/i });

    // Initial state: open = true
    expect(screen.getByTestId('open')).toHaveTextContent('true');

    fireEvent.click(triggerButton);

    // After click: open = false
    expect(screen.getByTestId('open')).toHaveTextContent('false');
  });
});
