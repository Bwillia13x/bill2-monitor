// Admin Page - Feature Flag Management
// Protected admin interface for managing A/B tests and feature rollouts

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { FeatureFlagDashboard } from '@/components/admin/FeatureFlagDashboard';
import { AnalyticsDebugPanel } from '@/components/admin/AnalyticsDebugPanel';
import { RealTimeAnalyticsDashboard } from '@/components/admin/RealTimeAnalyticsDashboard';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function AdminFeatureFlags() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        // Check if user is admin (has @digitalstrike.ca email)
        if (!user) {
            navigate('/auth');
            return;
        }

        const isAdmin = user.email?.endsWith('@digitalstrike.ca');
        if (!isAdmin) {
            navigate('/');
            return;
        }

        setIsAuthorized(true);
    }, [user, navigate]);

    if (!isAuthorized) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
            <div className="container mx-auto px-4 py-8 max-w-7xl space-y-8">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(-1)}
                    className="mb-6"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                </Button>

                <RealTimeAnalyticsDashboard />

                <FeatureFlagDashboard />

                <AnalyticsDebugPanel />
            </div>
        </div>
    );
}
