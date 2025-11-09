import { useState } from "react";
import { BackgroundFX } from "@/components/BackgroundFX";
import { Header } from "@/components/Header";
import { Banner } from "@/components/Banner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Check, 
  X, 
  AlertTriangle, 
  Clock, 
  Eye, 
  Filter,
  RefreshCw,
  Shield
} from "lucide-react";
import { useModerationQueue, useModerationAction, useModerationStats } from "@/hooks/useModeration";
import { SocialMetaTags } from "@/components/v3/SocialMetaTags";

const ModerationDashboard = () => {
  const [selectedTab, setSelectedTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const { data: queueItems, isLoading, refetch } = useModerationQueue(selectedTab);
  const { data: stats } = useModerationStats();
  const moderationAction = useModerationAction();

  const getRiskColor = (riskScore: number) => {
    if (riskScore >= 0.8) return 'text-red-500 bg-red-500/10';
    if (riskScore >= 0.5) return 'text-yellow-500 bg-yellow-500/10';
    return 'text-green-500 bg-green-500/10';
  };

  const getFlagBadge = (flag: string) => {
    const flagConfig: Record<string, { label: string; color: string }> = {
      pii_detected: { label: 'PII', color: 'bg-purple-500' },
      profanity: { label: 'Profanity', color: 'bg-orange-500' },
      potential_names: { label: 'Names', color: 'bg-blue-500' },
      sensitive_keywords: { label: 'Sensitive', color: 'bg-red-500' },
      blocked_content: { label: 'Blocked', color: 'bg-red-700' },
    };

    const config = flagConfig[flag] || { label: flag, color: 'bg-gray-500' };
    return (
      <Badge key={flag} className={`${config.color} text-white`}>
        {config.label}
      </Badge>
    );
  };

  const handleModerationAction = async (queueItemId: string, action: 'approve' | 'reject') => {
    await moderationAction.mutateAsync({ queueItemId, action });
  };

  const renderContentCard = (item: any) => (
    <Card key={item.id} className="mb-4">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="capitalize">
              {item.content_type.replace('_', ' ')}
            </Badge>
            <Badge className={getRiskColor(item.risk_score)}>
              Risk: {(item.risk_score * 100).toFixed(0)}%
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Submitted {new Date(item.created_at).toLocaleString()}
          </p>
        </div>
        {item.flags && item.flags.length > 0 && (
          <div className="flex gap-1">
            {item.flags.map(getFlagBadge)}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <p className="text-sm bg-muted p-3 rounded-lg whitespace-pre-wrap">
            {item.content_text}
          </p>
          
          {item.content_metadata && Object.keys(item.content_metadata).length > 0 && (
            <div className="flex flex-wrap gap-2">
              {item.content_metadata.district && (
                <Badge variant="secondary">{item.content_metadata.district}</Badge>
              )}
              {item.content_metadata.role && (
                <Badge variant="secondary">{item.content_metadata.role}</Badge>
              )}
              {item.content_metadata.title && (
                <Badge variant="outline">{item.content_metadata.title}</Badge>
              )}
            </div>
          )}

          {selectedTab === 'pending' && (
            <div className="flex gap-2 justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleModerationAction(item.id, 'reject')}
                disabled={moderationAction.isPending}
              >
                <X className="w-4 h-4 mr-1" />
                Reject
              </Button>
              <Button
                size="sm"
                onClick={() => handleModerationAction(item.id, 'approve')}
                disabled={moderationAction.isPending}
              >
                <Check className="w-4 h-4 mr-1" />
                Approve
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <>
      <SocialMetaTags 
        title="Moderation Dashboard"
        description="Review and moderate user-generated content"
      />
      
      <div className="relative min-h-screen w-full text-foreground bg-background overflow-x-hidden">
        <BackgroundFX />
        <Header />
        <Banner />

        <main className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 py-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold">Moderation Dashboard</h1>
                <p className="text-muted-foreground">
                  Review and moderate user-generated content
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Stats Overview */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats[0]?.total_pending || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats[0]?.high_risk_pending || 0} high risk
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Approved</CardTitle>
                  <Check className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats[0]?.total_approved || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    All time
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Rejected</CardTitle>
                  <X className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats[0]?.total_rejected || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    All time
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Review Time</CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(stats[0]?.avg_review_time_hours || 0).toFixed(1)}h
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Per item
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Tabs */}
          <Tabs value={selectedTab} onValueChange={(value) => setSelectedTab(value as any)}>
            <TabsList className="mb-6">
              <TabsTrigger value="pending" className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Pending
                {stats && (
                  <Badge variant="secondary" className="ml-1">
                    {stats[0]?.total_pending || 0}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="approved" className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                Approved
              </TabsTrigger>
              <TabsTrigger value="rejected" className="flex items-center gap-2">
                <X className="w-4 h-4" />
                Rejected
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <RefreshCw className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : queueItems && queueItems.length > 0 ? (
                <div className="space-y-4">
                  {queueItems.map(renderContentCard)}
                </div>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Check className="w-12 h-12 text-green-500 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">All caught up!</h3>
                    <p className="text-muted-foreground text-center">
                      No pending items in the moderation queue.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="approved">
              {queueItems && queueItems.length > 0 ? (
                <div className="space-y-4">
                  {queueItems.map(renderContentCard)}
                </div>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Clock className="w-12 h-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No approved items</h3>
                    <p className="text-muted-foreground text-center">
                      Approved items will appear here.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="rejected">
              {queueItems && queueItems.length > 0 ? (
                <div className="space-y-4">
                  {queueItems.map(renderContentCard)}
                </div>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Filter className="w-12 h-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No rejected items</h3>
                    <p className="text-muted-foreground text-center">
                      Rejected items will appear here.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </main>

        {/* Footer */}
        <footer className="relative z-10 border-t border-border mt-16">
          <div className="mx-auto max-w-7xl px-6 py-8 text-xs text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>© {new Date().getFullYear()} Civic Data Platform.</span>
            <span>Privacy-first content moderation.</span>
          </div>
        </footer>
      </div>
    </>
  );
};

export default ModerationDashboard;