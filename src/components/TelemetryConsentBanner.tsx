/**
 * Telemetry Consent Banner Component
 * Displays a privacy-friendly consent banner for telemetry collection
 * Respects user choice and stores consent in localStorage
 */

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from './ui/button';

const CONSENT_STORAGE_KEY = 'telemetryConsent';

export type TelemetryConsent = 'granted' | 'denied' | null;

/**
 * Get the current telemetry consent status from localStorage
 */
export function getTelemetryConsent(): TelemetryConsent {
  if (typeof localStorage === 'undefined') {
    return null;
  }
  
  const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
  if (stored === 'granted' || stored === 'denied') {
    return stored;
  }
  
  return null;
}

/**
 * Set the telemetry consent status in localStorage
 */
export function setTelemetryConsent(consent: 'granted' | 'denied'): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(CONSENT_STORAGE_KEY, consent);
  }
}

/**
 * Telemetry Consent Banner
 * Shows a dismissible banner asking for telemetry consent
 * Only shows if consent hasn't been granted or denied yet
 */
export function TelemetryConsentBanner() {
  const [consent, setConsent] = useState<TelemetryConsent>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if consent has already been given
    const existingConsent = getTelemetryConsent();
    setConsent(existingConsent);
    
    // Show banner only if no consent decision has been made
    if (existingConsent === null) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    setTelemetryConsent('granted');
    setConsent('granted');
    setIsVisible(false);
  };

  const handleDeny = () => {
    setTelemetryConsent('denied');
    setConsent('denied');
    setIsVisible(false);
  };

  // Don't render if already decided or SSR
  if (!isVisible || typeof window === 'undefined') {
    return null;
  }

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border shadow-lg"
      role="dialog"
      aria-labelledby="consent-banner-title"
      aria-describedby="consent-banner-description"
    >
      <div className="container max-w-7xl mx-auto p-4 md:p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex-1">
            <h2 id="consent-banner-title" className="text-lg font-semibold mb-2">
              Privacy & Performance Data
            </h2>
            <p id="consent-banner-description" className="text-sm text-muted-foreground">
              We collect anonymous performance metrics and error reports to improve the application.
              All data is privacy-preserving (HMAC-SHA-256 hashed session IDs, no PII).
              You can opt out at any time.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeny}
              className="whitespace-nowrap"
            >
              Decline
            </Button>
            <Button
              size="sm"
              onClick={handleAccept}
              className="whitespace-nowrap"
            >
              Accept
            </Button>
            <button
              onClick={handleDeny}
              className="p-1 hover:bg-accent rounded-md transition-colors"
              aria-label="Close banner"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
