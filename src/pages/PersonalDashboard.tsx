import { useState, useEffect } from "react";
import { BackgroundFX } from "@/components/BackgroundFX";
import { Header } from "@/components/Header";
import { Banner } from "@/components/Banner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Download, 
  Trash2, 
  Eye, 
  Calendar,
  BarChart3,
  FileText,
  Shield,
  TrendingUp,
  MapPin,
  User
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { anonymousTokenService } from "@/lib/anonymousToken";
import { Sparkline } from "@/components/metrics/Sparkline";
import { SocialMetaTags } from "@/components/v3/SocialMetaTags";
import { toast } from "sonner";

const PersonalDashboard = () => {
  const [token, setToken] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  // Fetch token on mount
  useEffect(() => {
    const initToken = async () => {
      try {
        const tokenValue = await anonymousTokenService.getOrCreateToken();
        setToken(tokenValue);
      } catch (error) {
        console.error('Failed to get token:', error);
        toast.error("Failed to initialize dashboard");
      } finally {
        setIsLoading(false);
      }
    };

    initToken();
  }, []);

  // Fetch dashboard data
  const { data: dashboardData, isLoading: dataLoading } = useQuery({
    queryKey: ["personalDashboard", token],
    queryFn: async () => {
      if (!token) return null;
      return anonymousTokenService.getDashboardData(token);
    },
    enabled: !!token,
  });

  // Handle data export
  const handleExport = async (format: 'csv' | 'json') => {
    if (!token) return;
    
    try {
      const data = await anonymousTokenService.exportDashboardData(token, format);
      const blob = new Blob([data], { 
        type: format === 'json' ? 'application/json' : 'text/csv' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dashboard-data-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success(`Data exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error("Failed to export data");
    }
  };

  // Handle token deletion
  const handleDeleteData = async () => {
    if (!token) return;
    
    if (confirm("Are you sure you want to delete all your dashboard data? This action cannot be undone.")) {
      try {
        await anonymousTokenService.deleteTokenData(token);
        toast.success("All data deleted successfully");
        // Generate new token
        const newToken = await anonymousTokenService.getOrCreateToken();
        setToken(newToken);
      } catch (error) {
        toast.error("Failed to delete data");
      }
    }
  };

  const getSubmissionTypeColor = (type: string) => {
    switch (type) {
      case 'signal': return 'bg-blue-500';
      case 'story': return 'bg-green-500';
      case 'cci': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  if (isLoading || dataLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <SocialMetaTags 
        title="Personal Dashboard"
        description="View your submission history and trends"
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
                <h1 className="text-3xl font-bold">Personal Dashboard</h1>
                <p className="text-muted-foreground">
                  Your anonymous submission history and trends
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('csv')}
              >
                <Download className="w-4 h-4 mr-1" />
                Export CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('json')}
              >
                <FileText className="w-4 h-4 mr-1" />
                Export JSON
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteData}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete All
              </Button>
            </div>
          </div>

          {/* Stats Overview */}
          {dashboardData && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {dashboardData.stats.totalSubmissions}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    All time
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">First Submission</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold">
                    {dashboardData.stats.firstSubmission 
                      ? new Date(dashboardData.stats.firstSubmission).toLocaleDateString()
                      : 'N/A'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Starting point
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Most Active District</CardTitle>
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold">
                    {dashboardData.stats.mostActiveDistrict || 'N/A'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Top location
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Most Common Role</CardTitle>
                  <User className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold">
                    {dashboardData.stats.mostActiveRole || 'N/A'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Primary role
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Activity Trends */}
          {dashboardData && dashboardData.trends.length > 0 && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Activity Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <Sparkline data={dashboardData.trends} />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Submissions History */}
          <Tabs defaultValue="all">
            <TabsList className="mb-6">
              <TabsTrigger value="all">All Submissions</TabsTrigger>
              <TabsTrigger value="signal">Signals</TabsTrigger>
              <TabsTrigger value="story">Stories</TabsTrigger>
              <TabsTrigger value="cci">CCI</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              {dashboardData?.submissions.length ? (
                <div className="space-y-3">
                  {dashboardData.submissions.map((submission) => (
                    <Card key={`${submission.id}-${submission.type}`}>
                      <CardContent className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                          <Badge className={getSubmissionTypeColor(submission.type)}>
                            {submission.type}
                          </Badge>
                          <div>
                            <p className="font-medium">
                              {submission.id}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(submission.date).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {submission.district && (
                            <Badge variant="secondary">
                              <MapPin className="w-3 h-3 mr-1" />
                              {submission.district}
                            </Badge>
                          )}
                          {submission.role && (
                            <Badge variant="outline">
                              <User className="w-3 h-3 mr-1" />
                              {submission.role}
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Eye className="w-12 h-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No submissions yet</h3>
                    <p className="text-muted-foreground text-center">
                      Your future submissions will appear here.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="signal">
              {dashboardData?.submissions.filter(s => s.type === 'signal').length ? (
                <div className="space-y-3">
                  {dashboardData.submissions
                    .filter(s => s.type === 'signal')
                    .map((submission) => (
                      <Card key={submission.id}>
                        <CardContent className="flex items-center justify-between p-4">
                          <div className="flex items-center gap-3">
                            <Badge className={getSubmissionTypeColor(submission.type)}>
                              Signal
                            </Badge>
                            <p className="text-sm text-muted-foreground">
                              {new Date(submission.date).toLocaleString()}
                            </p>
                          </div>
                          {submission.district && (
                            <Badge variant="secondary">
                              {submission.district}
                            </Badge>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <p className="text-muted-foreground">No signals submitted yet</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="story">
              {dashboardData?.submissions.filter(s => s.type === 'story').length ? (
                <div className="space-y-3">
                  {dashboardData.submissions
                    .filter(s => s.type === 'story')
                    .map((submission) => (
                      <Card key={submission.id}>
                        <CardContent className="flex items-center justify-between p-4">
                          <div className="flex items-center gap-3">
                            <Badge className={getSubmissionTypeColor(submission.type)}>
                              Story
                            </Badge>
                            <p className="text-sm text-muted-foreground">
                              {new Date(submission.date).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {submission.district && (
                              <Badge variant="secondary">
                                {submission.district}
                              </Badge>
                            )}
                            {submission.role && (
                              <Badge variant="outline">
                                {submission.role}
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <p className="text-muted-foreground">No stories submitted yet</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="cci">
              {dashboardData?.submissions.filter(s => s.type === 'cci').length ? (
                <div className="space-y-3">
                  {dashboardData.submissions
                    .filter(s => s.type === 'cci')
                    .map((submission) => (
                      <Card key={submission.id}>
                        <CardContent className="flex items-center justify-between p-4">
                          <div className="flex items-center gap-3">
                            <Badge className={getSubmissionTypeColor(submission.type)}>
                              CCI
                            </Badge>
                            <p className="text-sm text-muted-foreground">
                              {new Date(submission.date).toLocaleString()}
                            </p>
                          </div>
                          {submission.district && (
                            <Badge variant="secondary">
                              {submission.district}
                            </Badge>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <p className="text-muted-foreground">No CCI submissions yet</p>
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
            <span>Privacy-first personal dashboards.</span>
          </div>
        </footer>
      </div>
    </>
  );
};

export default PersonalDashboard;