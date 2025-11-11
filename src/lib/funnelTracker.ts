// Funnel tracking utilities for Phase 2 analytics
// Tracks user progression through multi-step funnels with automatic event persistence

import { supabase } from '@/integrations/supabase/client';
import { trackEvent } from './telemetry';
import type { FunnelName, FunnelStep } from '@/types/analytics';
import { FUNNELS, SIGN_CREATION_FUNNEL, SIGNAL_SUBMISSION_FUNNEL, SHARE_FLOW_FUNNEL } from '@/types/analytics';

/**
 * Centralized funnel tracking service
 */
class FunnelTracker {
    private sessionId: string;
    private userId: string;
    private funnelDefinitions: Map<FunnelName, FunnelStep[]>;

    constructor() {
        this.sessionId = this.getOrCreateSessionId();
        this.userId = this.getOrCreateUserId();

        // Register funnel definitions
        this.funnelDefinitions = new Map([
            [FUNNELS.SIGN_CREATION, SIGN_CREATION_FUNNEL],
            [FUNNELS.SIGNAL_SUBMISSION, SIGNAL_SUBMISSION_FUNNEL],
            [FUNNELS.SHARE_FLOW, SHARE_FLOW_FUNNEL],
        ]);
    }

    /**
     * Track a funnel step
     */
    async trackStep(
        funnelName: FunnelName,
        stepName: string,
        properties?: Record<string, unknown>
    ): Promise<void> {
        const funnel = this.funnelDefinitions.get(funnelName);
        if (!funnel) {
            console.warn(`[FunnelTracker] Unknown funnel: ${funnelName}`);
            return;
        }

        const step = funnel.find(s => s.name === stepName);
        if (!step) {
            console.warn(`[FunnelTracker] Unknown step "${stepName}" in funnel "${funnelName}"`);
            return;
        }

        const isLastStep = step.order === funnel.length;

        try {
            // Persist to database
            await supabase
                .from('funnel_events' as any)
                .insert({
                    funnel_name: funnelName,
                    step_name: stepName,
                    step_order: step.order,
                    user_id: this.userId,
                    session_id: this.sessionId,
                    properties: properties || {},
                    completed: isLastStep,
                });

            // Also send telemetry event for real-time analytics
            await trackEvent(`funnel_${funnelName}_${stepName}`, {
                ...properties,
                funnelName,
                stepName,
                stepOrder: step.order,
                userId: this.userId,
                completed: isLastStep,
            });

            console.log(`[FunnelTracker] Tracked ${funnelName} → ${stepName} (step ${step.order}/${funnel.length})`);
        } catch (error) {
            console.error('[FunnelTracker] Failed to track funnel step:', error);
        }
    }

    /**
     * Track sign creation funnel
     */
    async trackSignCreation(step: 'start' | 'customize' | 'preview' | 'download' | 'share', properties?: Record<string, unknown>): Promise<void> {
        await this.trackStep(FUNNELS.SIGN_CREATION, step, properties);
    }

    /**
     * Track signal submission funnel
     */
    async trackSignalSubmission(step: 'view_thermometer' | 'interact' | 'submit', properties?: Record<string, unknown>): Promise<void> {
        await this.trackStep(FUNNELS.SIGNAL_SUBMISSION, step, properties);
    }

    /**
     * Track share flow funnel
     */
    async trackShareFlow(step: 'modal_open' | 'select_platform' | 'share_complete', properties?: Record<string, unknown>): Promise<void> {
        await this.trackStep(FUNNELS.SHARE_FLOW, step, properties);
    }

    /**
     * Get or create session ID
     */
    private getOrCreateSessionId(): string {
        const key = 'ds_funnel_session_id';
        let sessionId = sessionStorage.getItem(key);

        if (!sessionId) {
            sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            sessionStorage.setItem(key, sessionId);
        }

        return sessionId;
    }

    /**
     * Get or create anonymous user ID (persists across sessions)
     */
    private getOrCreateUserId(): string {
        const key = 'ds_funnel_user_id';
        let userId = localStorage.getItem(key);

        if (!userId) {
            userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            localStorage.setItem(key, userId);
        }

        return userId;
    }

    /**
     * Get current session and user IDs
     */
    getIds(): { sessionId: string; userId: string } {
        return {
            sessionId: this.sessionId,
            userId: this.userId,
        };
    }
}

// Export singleton instance
export const funnelTracker = new FunnelTracker();

/**
 * Hook for using funnel tracking in React components
 */
export function useFunnelTracking(funnelName: FunnelName) {
    const trackStep = async (stepName: string, properties?: Record<string, unknown>) => {
        await funnelTracker.trackStep(funnelName, stepName, properties);
    };

    return { trackStep };
}
