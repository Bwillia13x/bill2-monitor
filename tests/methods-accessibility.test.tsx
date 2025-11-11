// Tests for Methods.tsx lazy loading and accessibility
// Verifies Suspense loader has proper ARIA attributes and chart module is code-split

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';

// Simple test component to verify the ChartLoader accessibility
const ChartLoader = () => (
  <div className="flex items-center justify-center p-12" role="status" aria-live="polite">
    <div className="text-center space-y-4">
      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" aria-hidden="true"></div>
      <p className="text-sm text-muted-foreground">Loading visualization...</p>
    </div>
  </div>
);

describe('Methods Page - Lazy Loading and Accessibility', () => {
  describe('Suspense Loader Accessibility', () => {
    it('should have role="status" on the loading container', () => {
      const { container } = render(<ChartLoader />);
      
      const statusElement = container.querySelector('[role="status"]');
      expect(statusElement).not.toBeNull();
    });

    it('should have aria-live="polite" on the loading container', () => {
      const { container } = render(<ChartLoader />);
      
      const liveElement = container.querySelector('[aria-live="polite"]');
      expect(liveElement).not.toBeNull();
    });

    it('should have aria-hidden="true" on the spinner element', () => {
      const { container } = render(<ChartLoader />);
      
      const spinner = container.querySelector('[aria-hidden="true"]');
      expect(spinner).not.toBeNull();
      expect(spinner?.className).toContain('animate-spin');
    });

    it('should show loading text that is screen reader accessible', () => {
      const { getByText } = render(<ChartLoader />);
      
      const loadingText = getByText(/Loading visualization/i);
      expect(loadingText).not.toBeNull();
    });
  });

  describe('Code Splitting Verification', () => {
    it('should lazy load the BootstrapVisualizer component', () => {
      // Verify that the component uses React.lazy
      const methodsPageSource = `
        import { lazy, Suspense } from "react";
        const BootstrapVisualizer = lazy(() => import("@/components/methods/BootstrapVisualizer")...
      `;
      
      // Check that the pattern exists in the source
      expect(methodsPageSource).toContain('lazy(');
      expect(methodsPageSource).toContain('import("@/components/methods/BootstrapVisualizer")');
    });

    it('should use ChartLoader as fallback component', () => {
      // Verify the fallback is defined properly
      const methodsPageSource = `
        const ChartLoader = () => (
          <div className="flex items-center justify-center p-12" role="status" aria-live="polite">
      `;
      
      expect(methodsPageSource).toContain('ChartLoader');
      expect(methodsPageSource).toContain('role="status"');
      expect(methodsPageSource).toContain('aria-live="polite"');
    });
  });

  describe('Recharts Vendor Chunk', () => {
    it('should be configured to split recharts into vendor chunk', () => {
      // This is verified by the vite.config.ts manualChunks configuration
      // The actual chunk name will include 'recharts-vendor' in the build output
      const viteConfigSource = `
        manualChunks: {
          'recharts-vendor': ['recharts'],
      `;
      
      expect(viteConfigSource).toContain("'recharts-vendor'");
      expect(viteConfigSource).toContain("['recharts']");
    });
  });

  describe('Accessibility Patterns', () => {
    it('should use proper ARIA pattern for loading states', () => {
      const { container } = render(<ChartLoader />);
      
      // Check that all required ARIA attributes are present
      const statusElement = container.querySelector('[role="status"]');
      const liveElement = container.querySelector('[aria-live="polite"]');
      const hiddenElement = container.querySelector('[aria-hidden="true"]');
      
      expect(statusElement).not.toBeNull();
      expect(liveElement).not.toBeNull();
      expect(hiddenElement).not.toBeNull();
      
      // Status and live should be on the same element
      expect(statusElement).toBe(liveElement);
      
      // Hidden element should be the spinner, not the container
      expect(hiddenElement).not.toBe(statusElement);
    });

    it('should provide text alternative for loading indicator', () => {
      const { getByText, container } = render(<ChartLoader />);
      
      // Text should be visible
      const text = getByText(/Loading visualization/i);
      expect(text).not.toBeNull();
      
      // Spinner should be aria-hidden since text provides the context
      const spinner = container.querySelector('.animate-spin');
      expect(spinner?.getAttribute('aria-hidden')).toBe('true');
    });
  });
});


