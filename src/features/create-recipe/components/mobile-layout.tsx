/**
 * @fileoverview Mobile-optimized layout component for Essential Oil Recipe Creator.
 * Provides responsive design with mobile-first approach and touch-friendly interactions.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRecipeNavigation } from '../hooks/use-recipe-navigation';
import { useRecipeStore } from '../store/recipe-store';
import { BreadcrumbNavigation, CompactBreadcrumbNavigation } from './breadcrumb-navigation';
import { cn } from '@/lib/utils';

/**
 * Mobile layout props
 */
interface MobileLayoutProps {
  children: React.ReactNode;
  showBreadcrumbs?: boolean;
  showProgress?: boolean;
  className?: string;
}

/**
 * Mobile-optimized header component
 */
function MobileHeader() {
  const { stepInfo, getCompletionPercentage } = useRecipeNavigation();
  const { currentStep } = useRecipeStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const completionPercentage = getCompletionPercentage();

  return (
    <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="container mx-auto px-4 py-3">
        {/* Header content */}
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold text-foreground truncate">
              {stepInfo.current.title}
            </h1>
            <p className="text-sm text-muted-foreground">
              Step {stepInfo.progress} of 6
            </p>
          </div>

          {/* Menu toggle for mobile */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-md hover:bg-muted transition-colors"
            aria-label="Toggle navigation menu"
          >
            <svg
              className={cn("w-5 h-5 transition-transform", isMenuOpen && "rotate-180")}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
              />
            </svg>
          </button>
        </div>

        {/* Progress bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>Progress</span>
            <span>{completionPercentage}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-500 ease-in-out"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        {/* Mobile navigation menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-2">
            <CompactBreadcrumbNavigation
              currentStep={currentStep}
              className="border-t pt-4"
            />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Mobile-optimized footer component
 */
function MobileFooter() {
  const { goToNext, goToPrevious, canGoNext, canGoPrevious, stepInfo } = useRecipeNavigation();
  const { isLoading } = useRecipeStore();

  return (
    <div className="sticky bottom-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          {/* Previous button */}
          <button
            onClick={goToPrevious}
            disabled={!canGoPrevious() || isLoading}
            className={cn(
              "flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              canGoPrevious()
                ? "bg-secondary text-secondary-foreground hover:bg-secondary/90"
                : "bg-muted text-muted-foreground"
            )}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline">Previous</span>
          </button>

          {/* Step indicator */}
          <div className="flex items-center space-x-1">
            {Array.from({ length: 6 }).map((_, index) => {
              const stepNumber = index + 1;
              const isActive = stepNumber === stepInfo.progress;
              const isCompleted = stepNumber < stepInfo.progress;

              return (
                <div
                  key={index}
                  className={cn(
                    "w-2 h-2 rounded-full transition-colors",
                    isActive && "bg-primary",
                    isCompleted && "bg-primary/60",
                    !isActive && !isCompleted && "bg-muted"
                  )}
                />
              );
            })}
          </div>

          {/* Next button */}
          <button
            onClick={goToNext}
            disabled={!canGoNext() || isLoading}
            className={cn(
              "flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              canGoNext()
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-muted text-muted-foreground"
            )}
          >
            <span className="hidden sm:inline">
              {stepInfo.isLast ? 'Complete' : 'Next'}
            </span>
            {!stepInfo.isLast && (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
            {stepInfo.isLast && (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Touch-friendly scroll area
 */
function ScrollArea({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "flex-1 overflow-y-auto overscroll-y-contain",
        // iOS momentum scrolling
        "[-webkit-overflow-scrolling:touch]",
        // Custom scrollbar for webkit browsers
        "[&::-webkit-scrollbar]:w-2",
        "[&::-webkit-scrollbar-track]:bg-muted/20",
        "[&::-webkit-scrollbar-thumb]:bg-muted",
        "[&::-webkit-scrollbar-thumb]:rounded-full",
        "[&::-webkit-scrollbar-thumb:hover]:bg-muted/80",
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Mobile-optimized layout component
 */
export function MobileLayout({
  children,
  showBreadcrumbs = true,
  showProgress = true,
  className
}: MobileLayoutProps) {
  const [viewportHeight, setViewportHeight] = useState<number>(0);
  const { currentStep } = useRecipeStore();

  // Handle viewport height changes (mobile browser address bar)
  useEffect(() => {
    const updateViewportHeight = () => {
      setViewportHeight(window.innerHeight);
    };

    updateViewportHeight();
    window.addEventListener('resize', updateViewportHeight);
    window.addEventListener('orientationchange', updateViewportHeight);

    return () => {
      window.removeEventListener('resize', updateViewportHeight);
      window.removeEventListener('orientationchange', updateViewportHeight);
    };
  }, []);

  return (
    <div
      className={cn("flex flex-col min-h-screen bg-background", className)}
      style={{
        minHeight: viewportHeight > 0 ? `${viewportHeight}px` : '100vh'
      }}
    >
      {/* Mobile header */}
      <MobileHeader />

      {/* Desktop breadcrumbs */}
      {showBreadcrumbs && (
        <div className="hidden md:block border-b bg-muted/30">
          <div className="container mx-auto px-4 py-3">
            <BreadcrumbNavigation
              currentStep={currentStep}
              showStepNumbers={true}
              showCompletionStatus={true}
              allowNavigation={true}
            />
          </div>
        </div>
      )}

      {/* Main content area */}
      <ScrollArea className="flex-1">
        <main className="container mx-auto px-4 py-6">
          <div className="max-w-4xl mx-auto">
            {children}
          </div>
        </main>
      </ScrollArea>

      {/* Mobile footer */}
      <MobileFooter />
    </div>
  );
}

/**
 * Hook for detecting mobile device
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);

    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, []);

  return isMobile;
}

/**
 * Hook for detecting touch device
 */
export function useIsTouchDevice() {
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  return isTouchDevice;
}

/**
 * Hook for viewport dimensions
 */
export function useViewportSize() {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateSize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    window.addEventListener('orientationchange', updateSize);

    return () => {
      window.removeEventListener('resize', updateSize);
      window.removeEventListener('orientationchange', updateSize);
    };
  }, []);

  return size;
}

export default MobileLayout;
