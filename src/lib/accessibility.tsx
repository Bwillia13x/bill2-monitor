// Accessibility utilities and enhancements

import { useEffect, useState } from 'react';
import React from 'react';

// Reduced motion hook
export function useReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return reducedMotion;
}

// High contrast hook
export function useHighContrast() {
  const [highContrast, setHighContrast] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    setHighContrast(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setHighContrast(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return highContrast;
}

// Focus management utility
export function useFocusManagement() {
  const trapFocus = (container: HTMLElement) => {
    const focusableElements = container.querySelectorAll<
      HTMLElement
    >('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  };

  return { trapFocus };
}

// Skip link utility
export function SkipLink({
  to,
  children,
  className = '',
}: {
  to: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <a
      href={to}
      className={`skip-link ${className}`}
      onClick={(e) => {
        e.preventDefault();
        const target = document.querySelector(to);
        if (target) {
          (target as HTMLElement).focus();
          (target as HTMLElement).scrollIntoView({ behavior: 'smooth' });
        }
      }}
    >
      {children}
    </a>
  );
}

// Announce to screen readers
export function announceToScreenReader(message: string) {
  if (typeof document === 'undefined') return;

  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', 'polite');
  announcement.setAttribute('aria-atomic', 'true');
  announcement.style.position = 'absolute';
  announcement.style.left = '-10000px';
  announcement.style.width = '1px';
  announcement.style.height = '1px';
  announcement.style.overflow = 'hidden';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

// Color contrast utilities
export const contrastColors = {
  // WCAG AA compliant combinations
  text: {
    primary: 'text-accessible-text-primary',
    secondary: 'text-accessible-text-secondary',
    muted: 'text-accessible-text-muted',
  },
  background: {
    main: 'bg-accessible-background-main',
    card: 'bg-accessible-background-card',
    border: 'border-accessible-background-border',
  },
  primary: {
    DEFAULT: 'bg-accessible-primary',
    hover: 'hover:bg-accessible-primary-hover',
    text: 'text-accessible-primary',
  },
};

// Focus visible styles
export const focusVisibleClasses = 
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background';

// ARIA utilities
export const ariaLabels = {
  mainNavigation: 'Main navigation',
  footer: 'Footer',
  search: 'Search',
  close: 'Close',
  menu: 'Menu',
  loading: 'Loading',
  success: 'Success',
  error: 'Error',
  warning: 'Warning',
};

// Keyboard navigation utilities
export const keyboardKeys = {
  tab: 'Tab',
  enter: 'Enter',
  escape: 'Escape',
  space: ' ',
  arrowUp: 'ArrowUp',
  arrowDown: 'ArrowDown',
  arrowLeft: 'ArrowLeft',
  arrowRight: 'ArrowRight',
  home: 'Home',
  end: 'End',
};

// Test if element is visible
export function isElementVisible(element: HTMLElement): boolean {
  const style = window.getComputedStyle(element);
  return (
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    style.opacity !== '0' &&
    element.offsetWidth > 0 &&
    element.offsetHeight > 0
  );
}

// Get next focusable element
export function getNextFocusableElement(
  currentElement: HTMLElement,
  direction: 'next' | 'prev' = 'next'
): HTMLElement | null {
  const focusableElements = Array.from(
    document.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
  ).filter(isElementVisible);

  const currentIndex = focusableElements.indexOf(currentElement);
  
  if (direction === 'next') {
    return focusableElements[currentIndex + 1] || focusableElements[0];
  } else {
    return focusableElements[currentIndex - 1] || focusableElements[focusableElements.length - 1];
  }
}

// Reduced motion CSS class getter
export function getMotionClass(normalClass: string, reducedClass: string) {
  const prefersReducedMotion = useReducedMotion();
  return prefersReducedMotion ? reducedClass : normalClass;
}

// ARIA live region component
export function AriaLiveRegion({
  message,
  politeness = 'polite',
}: {
  message: string;
  politeness?: 'polite' | 'assertive';
}) {
  return (
    <div
      aria-live={politeness}
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
}

// Loading state for screen readers
export function LoadingAnnouncement({ isLoading }: { isLoading: boolean }) {
  useEffect(() => {
    if (isLoading) {
      announceToScreenReader('Loading content');
    } else {
      announceToScreenReader('Content loaded');
    }
  }, [isLoading]);

  return null;
}

// Error boundary for accessibility
export class AccessibleErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Accessible error caught:', error, errorInfo);
    announceToScreenReader('An error occurred. Please refresh the page.');
  }

  render() {
    if (this.state.hasError) {
      return (
        <div role="alert" className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <h2 className="text-lg font-bold mb-2">Something went wrong</h2>
          <p>An error occurred while loading this content.</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}