import { useEffect, useRef, useState } from 'react';

interface UseAutoScrollOptions {
  /**
   * Threshold in pixels from bottom to trigger auto-scroll
   * @default 100
   */
  threshold?: number;
  
  /**
   * Smooth scroll behavior
   * @default true
   */
  smooth?: boolean;
  
  /**
   * Delay before scrolling (useful for DOM updates)
   * @default 50
   */
  scrollDelay?: number;
  
  /**
   * Whether to enable auto-scroll
   * @default true
   */
  enabled?: boolean;
}

/**
 * Hook for auto-scrolling to bottom of a container, similar to chat applications
 * 
 * Features:
 * - Smart scroll detection (only scrolls if user is near bottom)
 * - Manual scroll override (stops auto-scroll if user scrolls up)
 * - Smooth scrolling with configurable behavior
 * - Performance optimized with debouncing
 * 
 * @param dependencies - Array of dependencies that trigger scroll check
 * @param options - Configuration options
 * @returns Object with scroll container ref and manual scroll controls
 */
export const useAutoScroll = <T extends HTMLElement = HTMLDivElement>(
  dependencies: any[] = [],
  options: UseAutoScrollOptions = {}
) => {
  const {
    threshold = 100,
    smooth = true,
    scrollDelay = 50,
    enabled = true
  } = options;

  const scrollRef = useRef<T>(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();
  const lastScrollTopRef = useRef(0);

  /**
   * Check if user is near the bottom of the scroll container
   */
  const isNearBottom = (): boolean => {
    if (!scrollRef.current) return true;
    
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    
    return distanceFromBottom <= threshold;
  };

  /**
   * Scroll to bottom with smooth animation
   */
  const scrollToBottom = (force = false) => {
    if (!scrollRef.current || (!shouldAutoScroll && !force) || !enabled) return;

    const element = scrollRef.current;
    
    if (smooth) {
      element.scrollTo({
        top: element.scrollHeight,
        behavior: 'smooth'
      });
    } else {
      element.scrollTop = element.scrollHeight;
    }
  };

  /**
   * Handle scroll events to detect user interaction
   */
  const handleScroll = () => {
    if (!scrollRef.current) return;

    const currentScrollTop = scrollRef.current.scrollTop;
    
    // Detect if user is manually scrolling
    if (Math.abs(currentScrollTop - lastScrollTopRef.current) > 5) {
      setIsUserScrolling(true);
      
      // Clear existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      // Reset user scrolling flag after delay
      scrollTimeoutRef.current = setTimeout(() => {
        setIsUserScrolling(false);
      }, 1000);
    }
    
    lastScrollTopRef.current = currentScrollTop;
    
    // Update auto-scroll permission based on position
    setShouldAutoScroll(isNearBottom());
  };

  /**
   * Auto-scroll effect triggered by dependencies
   */
  useEffect(() => {
    if (!enabled || isUserScrolling) return;

    const timeoutId = setTimeout(() => {
      if (shouldAutoScroll && isNearBottom()) {
        scrollToBottom();
      }
    }, scrollDelay);

    return () => clearTimeout(timeoutId);
  }, [...dependencies, shouldAutoScroll, isUserScrolling, enabled]);

  /**
   * Set up scroll event listener
   */
  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    element.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      element.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Manual controls for external use
   */
  const scrollControls = {
    scrollToBottom: () => scrollToBottom(true),
    scrollToTop: () => {
      if (scrollRef.current) {
        scrollRef.current.scrollTo({
          top: 0,
          behavior: smooth ? 'smooth' : 'auto'
        });
      }
    },
    enableAutoScroll: () => setShouldAutoScroll(true),
    disableAutoScroll: () => setShouldAutoScroll(false),
    isNearBottom,
    isUserScrolling,
    shouldAutoScroll
  };

  return {
    scrollRef,
    ...scrollControls
  };
};
