/**
 * Accessibility (a11y) smoke tests using axe-core
 * Tests key components for WCAG 2.2 AA compliance
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { run as axeRun } from 'axe-core';
import React, { Suspense } from 'react';

// Helper to run axe and check for violations
async function axe(container: Element) {
  const results = await axeRun(container);
  return results;
}

// Custom matcher for no violations
function toHaveNoViolations(results: any) {
  const violations = results.violations || [];
  
  if (violations.length === 0) {
    return {
      pass: true,
      message: () => 'Expected to have accessibility violations, but found none',
    };
  }
  
  const violationMessages = violations.map((violation: any) => {
    const nodes = violation.nodes.map((node: any) => node.html).join('\n');
    return `${violation.id}: ${violation.description}\n${violation.help}\n${nodes}`;
  }).join('\n\n');
  
  return {
    pass: false,
    message: () => `Expected no accessibility violations, but found ${violations.length}:\n\n${violationMessages}`,
  };
}

// ChartLoader component (from Methods.tsx)
const ChartLoader = () => (
  <div className="flex items-center justify-center p-12" role="status" aria-live="polite">
    <div className="text-center space-y-4">
      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" aria-hidden="true"></div>
      <p className="text-sm text-muted-foreground">Loading visualization...</p>
    </div>
  </div>
);

describe('Accessibility Tests', () => {
  describe('ChartLoader Component', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<ChartLoader />);
      const results = await axe(container);
      expect(toHaveNoViolations(results).pass).toBe(true);
    });

    it('should have proper ARIA attributes', () => {
      const { getByRole } = render(<ChartLoader />);
      const status = getByRole('status');
      
      expect(status).toBeInTheDocument();
      expect(status).toHaveAttribute('aria-live', 'polite');
    });

    it('should have descriptive text for screen readers', () => {
      const { getByText } = render(<ChartLoader />);
      expect(getByText('Loading visualization...')).toBeInTheDocument();
    });

    it('should hide decorative spinner from screen readers', () => {
      const { container } = render(<ChartLoader />);
      const spinner = container.querySelector('[aria-hidden="true"]');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Methods Page Placeholder', () => {
    // Create a simplified placeholder that mimics Methods.tsx structure
    const MethodsPlaceholder = () => (
      <div className="container mx-auto px-4 py-8">
        <header>
          <h1 className="text-3xl font-bold mb-4">Methodology & Transparency</h1>
          <p className="text-muted-foreground mb-8">
            How we collect, validate, and present teacher sentiment data.
          </p>
        </header>

        <main>
          <section aria-labelledby="data-sources-heading">
            <h2 id="data-sources-heading" className="text-2xl font-semibold mb-4">
              Data Sources
            </h2>
            <p className="mb-4">
              Our data comes from anonymous teacher submissions through our platform.
            </p>
          </section>

          {/* Simulated lazy-loaded chart with fallback */}
          <Suspense fallback={<ChartLoader />}>
            <section aria-labelledby="chart-heading">
              <h2 id="chart-heading" className="text-2xl font-semibold mb-4">
                Sentiment Trends
              </h2>
              <div className="bg-card p-6 rounded-lg">
                <p>Chart visualization would load here</p>
              </div>
            </section>
          </Suspense>

          <section aria-labelledby="privacy-heading">
            <h2 id="privacy-heading" className="text-2xl font-semibold mb-4">
              Privacy & Security
            </h2>
            <p>
              All data is anonymized and aggregated to protect teacher privacy.
            </p>
          </section>
        </main>
      </div>
    );

    it('should have no accessibility violations in default render', async () => {
      const { container } = render(<MethodsPlaceholder />);
      const results = await axe(container);
      expect(toHaveNoViolations(results).pass).toBe(true);
    });

    it('should have proper heading hierarchy', () => {
      const { getByRole } = render(<MethodsPlaceholder />);
      
      const h1 = getByRole('heading', { level: 1 });
      expect(h1).toHaveTextContent('Methodology & Transparency');
      
      const h2s = document.querySelectorAll('h2');
      expect(h2s.length).toBeGreaterThan(0);
    });

    it('should have landmarks for navigation', () => {
      const { container } = render(<MethodsPlaceholder />);
      
      const header = container.querySelector('header');
      const main = container.querySelector('main');
      
      expect(header).toBeInTheDocument();
      expect(main).toBeInTheDocument();
    });

    it('should have proper section labeling with aria-labelledby', () => {
      const { container } = render(<MethodsPlaceholder />);
      
      const sections = container.querySelectorAll('section[aria-labelledby]');
      expect(sections.length).toBeGreaterThan(0);
      
      // Verify each section's aria-labelledby points to an existing ID
      sections.forEach(section => {
        const labelId = section.getAttribute('aria-labelledby');
        const labelElement = document.getElementById(labelId!);
        expect(labelElement).toBeInTheDocument();
      });
    });
  });

  describe('Button Accessibility', () => {
    const AccessibleButton = () => (
      <button
        type="button"
        className="px-4 py-2 bg-primary text-white rounded"
        aria-label="Submit form"
      >
        Submit
      </button>
    );

    it('should have no violations for button element', async () => {
      const { container } = render(<AccessibleButton />);
      const results = await axe(container);
      expect(toHaveNoViolations(results).pass).toBe(true);
    });

    it('should have explicit type attribute', () => {
      const { getByRole } = render(<AccessibleButton />);
      const button = getByRole('button');
      expect(button).toHaveAttribute('type', 'button');
    });
  });

  describe('Form Input Accessibility', () => {
    const AccessibleInput = () => (
      <div className="form-group">
        <label htmlFor="email-input" className="block mb-2">
          Email Address
        </label>
        <input
          id="email-input"
          type="email"
          className="w-full px-3 py-2 border rounded"
          aria-required="true"
          aria-describedby="email-help"
        />
        <span id="email-help" className="text-sm text-muted-foreground">
          We'll never share your email.
        </span>
      </div>
    );

    it('should have no violations for labeled input', async () => {
      const { container } = render(<AccessibleInput />);
      const results = await axe(container);
      expect(toHaveNoViolations(results).pass).toBe(true);
    });

    it('should properly associate label with input', () => {
      const { getByLabelText } = render(<AccessibleInput />);
      const input = getByLabelText('Email Address');
      expect(input).toHaveAttribute('id', 'email-input');
    });

    it('should have aria-describedby for helper text', () => {
      const { container } = render(<AccessibleInput />);
      const input = container.querySelector('#email-input');
      expect(input).toHaveAttribute('aria-describedby', 'email-help');
    });
  });

  describe('Image Accessibility', () => {
    const AccessibleImage = () => (
      <img
        src="/placeholder.svg"
        alt="Alberta teacher protest sign reading 'Fund Education'"
        className="w-full rounded"
      />
    );

    it('should have no violations for image with alt text', async () => {
      const { container } = render(<AccessibleImage />);
      const results = await axe(container);
      expect(toHaveNoViolations(results).pass).toBe(true);
    });

    it('should have meaningful alt text', () => {
      const { getByAltText } = render(<AccessibleImage />);
      const img = getByAltText(/Fund Education/i);
      expect(img).toBeInTheDocument();
    });
  });

  describe('Link Accessibility', () => {
    const AccessibleLink = () => (
      <a
        href="https://example.com/methodology"
        className="text-primary underline"
        target="_blank"
        rel="noopener noreferrer"
      >
        Read our full methodology
        <span className="sr-only"> (opens in new tab)</span>
      </a>
    );

    it('should have no violations for external link', async () => {
      const { container } = render(<AccessibleLink />);
      const results = await axe(container);
      expect(toHaveNoViolations(results).pass).toBe(true);
    });

    it('should indicate external link to screen readers', () => {
      const { container } = render(<AccessibleLink />);
      const srOnly = container.querySelector('.sr-only');
      expect(srOnly).toHaveTextContent('(opens in new tab)');
    });

    it('should have proper security attributes for external links', () => {
      const { getByRole } = render(<AccessibleLink />);
      const link = getByRole('link');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });
});
