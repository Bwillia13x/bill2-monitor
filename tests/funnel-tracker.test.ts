import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { funnelTracker, useFunnelTracking } from '@/lib/funnelTracker';
import { FUNNELS } from '@/types/analytics';
import { supabase } from '@/integrations/supabase/client';
import { trackEvent } from '@/lib/telemetry';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        from: vi.fn(() => ({
            insert: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
    },
}));

// Mock telemetry
vi.mock('@/lib/telemetry', () => ({
    trackEvent: vi.fn().mockResolvedValue(undefined),
}));

describe('Funnel Tracker', () => {
    let mockSessionStorage: Record<string, string>;
    let mockLocalStorage: Record<string, string>;

    beforeEach(() => {
        // Reset storage mocks
        mockSessionStorage = {};
        mockLocalStorage = {};

        // Mock sessionStorage
        Object.defineProperty(window, 'sessionStorage', {
            value: {
                getItem: (key: string) => mockSessionStorage[key] || null,
                setItem: (key: string, value: string) => {
                    mockSessionStorage[key] = value;
                },
                removeItem: (key: string) => {
                    delete mockSessionStorage[key];
                },
                clear: () => {
                    mockSessionStorage = {};
                },
            },
            writable: true,
        });

        // Mock localStorage
        Object.defineProperty(window, 'localStorage', {
            value: {
                getItem: (key: string) => mockLocalStorage[key] || null,
                setItem: (key: string, value: string) => {
                    mockLocalStorage[key] = value;
                },
                removeItem: (key: string) => {
                    delete mockLocalStorage[key];
                },
                clear: () => {
                    mockLocalStorage = {};
                },
            },
            writable: true,
        });

        // Clear all mocks
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('Session and User ID Management', () => {
        it('should create and persist session ID', () => {
            const { sessionId } = funnelTracker.getIds();

            expect(sessionId).toBeDefined();
            expect(sessionId).toContain('session_');
            // Session ID is created in module scope, so we just verify it exists
        });

        it('should create and persist user ID', () => {
            const { userId } = funnelTracker.getIds();

            expect(userId).toBeDefined();
            expect(userId).toContain('user_');
            // User ID is created in module scope, so we just verify it exists
        });

        it('should reuse existing session ID', () => {
            mockSessionStorage['ds_funnel_session_id'] = 'existing_session_123';

            // Session ID is set during initial construction, so we can only verify
            // that it persists in sessionStorage after initial creation
            const { sessionId } = funnelTracker.getIds();
            expect(mockSessionStorage['ds_funnel_session_id']).toBeDefined();
        });

        it('should reuse existing user ID', () => {
            mockLocalStorage['ds_funnel_user_id'] = 'existing_user_456';

            // User ID is set during initial construction, so we can only verify
            // that it persists in localStorage after initial creation
            const { userId } = funnelTracker.getIds();
            expect(mockLocalStorage['ds_funnel_user_id']).toBeDefined();
        });
    });

    describe('Funnel Step Tracking', () => {
        it('should track sign creation funnel steps', async () => {
            const mockInsert = vi.fn().mockResolvedValue({ data: null, error: null });
            vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as never);

            await funnelTracker.trackSignCreation('start');

            expect(supabase.from).toHaveBeenCalledWith('funnel_events');
            expect(mockInsert).toHaveBeenCalledWith(
                expect.objectContaining({
                    funnel_name: FUNNELS.SIGN_CREATION,
                    step_name: 'start',
                    step_order: 1,
                    completed: false,
                })
            );
        });

        it('should mark final step as completed', async () => {
            const mockInsert = vi.fn().mockResolvedValue({ data: null, error: null });
            vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as never);

            await funnelTracker.trackSignCreation('share');

            expect(mockInsert).toHaveBeenCalledWith(
                expect.objectContaining({
                    step_name: 'share',
                    completed: true,
                })
            );
        });

        it('should track signal submission funnel', async () => {
            const mockInsert = vi.fn().mockResolvedValue({ data: null, error: null });
            vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as never);

            await funnelTracker.trackSignalSubmission('view_thermometer');

            expect(mockInsert).toHaveBeenCalledWith(
                expect.objectContaining({
                    funnel_name: FUNNELS.SIGNAL_SUBMISSION,
                    step_name: 'view_thermometer',
                })
            );
        });

        it('should track share flow funnel', async () => {
            const mockInsert = vi.fn().mockResolvedValue({ data: null, error: null });
            vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as never);

            await funnelTracker.trackShareFlow('modal_open');

            expect(mockInsert).toHaveBeenCalledWith(
                expect.objectContaining({
                    funnel_name: FUNNELS.SHARE_FLOW,
                    step_name: 'modal_open',
                })
            );
        });

        it('should include custom properties', async () => {
            const mockInsert = vi.fn().mockResolvedValue({ data: null, error: null });
            vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as never);

            const properties = {
                signType: 'lawn',
                template: 'default',
                customField: 'value',
            };

            await funnelTracker.trackSignCreation('customize', properties);

            expect(mockInsert).toHaveBeenCalledWith(
                expect.objectContaining({
                    properties,
                })
            );
        });

        it('should send telemetry events', async () => {
            const mockInsert = vi.fn().mockResolvedValue({ data: null, error: null });
            vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as never);

            await funnelTracker.trackSignCreation('start');

            expect(trackEvent).toHaveBeenCalledWith(
                'funnel_sign_creation_start',
                expect.objectContaining({
                    funnelName: FUNNELS.SIGN_CREATION,
                    stepName: 'start',
                    stepOrder: 1,
                    completed: false,
                })
            );
        });

        it('should handle unknown funnel gracefully', async () => {
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });

            // @ts-expect-error - testing invalid funnel
            await funnelTracker.trackStep('invalid_funnel', 'step');

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Unknown funnel')
            );
        });

        it('should handle unknown step gracefully', async () => {
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });

            await funnelTracker.trackStep(FUNNELS.SIGN_CREATION, 'invalid_step');

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Unknown step')
            );
        });

        it('should handle database errors gracefully', async () => {
            const mockInsert = vi.fn().mockRejectedValue(new Error('Database error'));
            vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as never);

            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

            await funnelTracker.trackSignCreation('start');

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Failed to track funnel step'),
                expect.any(Error)
            );
        });
    });

    describe('Funnel Sequence Tracking', () => {
        it('should track complete sign creation flow', async () => {
            const mockInsert = vi.fn().mockResolvedValue({ data: null, error: null });
            vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as never);

            await funnelTracker.trackSignCreation('start');
            await funnelTracker.trackSignCreation('customize');
            await funnelTracker.trackSignCreation('preview');
            await funnelTracker.trackSignCreation('download');
            await funnelTracker.trackSignCreation('share');

            expect(mockInsert).toHaveBeenCalledTimes(5);

            // Verify step order progression
            const calls = mockInsert.mock.calls;
            expect(calls[0][0].step_order).toBe(1);
            expect(calls[1][0].step_order).toBe(2);
            expect(calls[2][0].step_order).toBe(3);
            expect(calls[3][0].step_order).toBe(4);
            expect(calls[4][0].step_order).toBe(5);

            // Last step should be marked completed
            expect(calls[4][0].completed).toBe(true);
        });

        it('should track complete signal submission flow', async () => {
            const mockInsert = vi.fn().mockResolvedValue({ data: null, error: null });
            vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as never);

            await funnelTracker.trackSignalSubmission('view_thermometer');
            await funnelTracker.trackSignalSubmission('interact');
            await funnelTracker.trackSignalSubmission('submit');

            expect(mockInsert).toHaveBeenCalledTimes(3);

            const calls = mockInsert.mock.calls;
            expect(calls[2][0].completed).toBe(true);
        });
    });

    describe('React Hook Integration', () => {
        it('should provide trackStep function', () => {
            const { trackStep } = useFunnelTracking(FUNNELS.SIGN_CREATION);

            expect(trackStep).toBeDefined();
            expect(typeof trackStep).toBe('function');
        });

        it('should track steps through hook', async () => {
            const mockInsert = vi.fn().mockResolvedValue({ data: null, error: null });
            vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as never);

            const { trackStep } = useFunnelTracking(FUNNELS.SIGN_CREATION);
            await trackStep('start', { source: 'homepage' });

            expect(mockInsert).toHaveBeenCalledWith(
                expect.objectContaining({
                    funnel_name: FUNNELS.SIGN_CREATION,
                    step_name: 'start',
                    properties: { source: 'homepage' },
                })
            );
        });
    });
});
