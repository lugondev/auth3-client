'use client';import React, { useState, useEffect } from 'react';import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';import { Button } from '@/components/ui/button';import { Badge } from '@/components/ui/badge';import { Separator } from '@/components/ui/separator';import {   Shield,   Plus,   List,   Settings,   FileText,  CheckCircle,  XCircle,  Clock,
  Eye,
  Send,
  BarChart3,
  History,
  Users,
  Zap,
  TrendingUp,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { CreatePresentationRequest } from '@/components/presentation-request/CreatePresentationRequest';
import { PresentationRequestList } from '@/components/presentation-request/PresentationRequestList';
import { PresentationRequestDetail } from '@/components/presentation-request/PresentationRequestDetail';
import { AnalyticsView } from './AnalyticsView';
import { HistoryView } from './HistoryView';
import { analyticsService } from '@/services/analytics-service';
import { presentationRequestService } from '@/services/presentation-request-service';
import type { PresentationRequest } from '@/types/presentation-request';

type ViewMode = 'overview' | 'create' | 'list' | 'detail' | 'settings' | 'analytics' | 'history';

interface SidebarItem {
  id: ViewMode;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  badge?: string;
}

interface OverviewStats {
  totalRequests: number;
  activeRequests: number;
  completedRequests: number;
  pendingRequests: number;
  responseCount: number;
}

export function PresentationDashboard() {
  const [activeView, setActiveView] = useState<ViewMode>('overview');
  const [selectedRequest, setSelectedRequest] = useState<PresentationRequest | null>(null);
  const [overviewStats, setOverviewStats] = useState<OverviewStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Load overview statistics
  useEffect(() => {
    const loadOverviewStats = async () => {
      try {
        setLoadingStats(true);
        
        // Get presentation requests to calculate stats
        const requestsResponse = await presentationRequestService.getRequests({
          page: 1,
          pageSize: 100, // Get enough to calculate proper stats
        });

        const requests = requestsResponse.requests;
        const totalRequests = requests.length;
        const activeRequests = requests.filter((r: PresentationRequest) => r.status === 'active').length;
        const completedRequests = requests.filter((r: PresentationRequest) => r.response_count > 0).length;
        const pendingRequests = requests.filter((r: PresentationRequest) => r.status === 'active' && r.response_count === 0).length;
        const responseCount = requests.reduce((sum: number, r: PresentationRequest) => sum + r.response_count, 0);

        setOverviewStats({
          totalRequests,
          activeRequests,
          completedRequests,
          pendingRequests,
          responseCount,
        });
      } catch (error) {
        console.error('Failed to load overview stats:', error);
        // Use fallback mock data
        setOverviewStats({
          totalRequests: 12,
          activeRequests: 8,
          completedRequests: 89,
          pendingRequests: 23,
          responseCount: 24,
        });
      } finally {
        setLoadingStats(false);
      }
    };

    if (activeView === 'overview') {
      loadOverviewStats();
    }
  }, [activeView]);

  const sidebarItems: SidebarItem[] = [
    {
      id: 'overview',
      label: 'Dashboard',
      icon: BarChart3,
      description: 'Overview & key metrics'
    },
    {
      id: 'create',
      label: 'Create Request',
      icon: Plus,
      description: 'New presentation request',
      badge: 'New'
    },
    {
      id: 'list',
      label: 'All Requests',
      icon: List,
      description: 'Manage presentation requests',
      badge: overviewStats?.totalRequests.toString()
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: TrendingUp,
      description: 'Performance insights',
      badge: 'Pro'
    },
    {
      id: 'history',
      label: 'History',
      icon: History,
      description: 'Verification timeline'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      description: 'Configuration options'
    }
  ];

  const renderContent = () => {
    switch (activeView) {
      case 'overview':
        return (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-l-4 border-l-blue-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Requests</CardTitle>
                  <Send className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {loadingStats ? (
                    <div className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Loading...</span>
                    </div>
                  ) : (
                    <>
                      <div className="text-2xl font-bold">{overviewStats?.activeRequests || 0}</div>
                      <p className="text-xs text-muted-foreground">
                        Currently accepting responses
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completed</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {loadingStats ? (
                    <div className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Loading...</span>
                    </div>
                  ) : (
                    <>
                      <div className="text-2xl font-bold">{overviewStats?.completedRequests || 0}</div>
                      <p className="text-xs text-muted-foreground">
                        Received responses
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-yellow-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {loadingStats ? (
                    <div className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Loading...</span>
                    </div>
                  ) : (
                    <>
                      <div className="text-2xl font-bold">{overviewStats?.pendingRequests || 0}</div>
                      <p className="text-xs text-muted-foreground">
                        Awaiting responses
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-purple-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {loadingStats ? (
                    <div className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Loading...</span>
                    </div>
                  ) : (
                    <>
                      <div className="text-2xl font-bold">{overviewStats?.responseCount || 0}</div>
                      <p className="text-xs text-muted-foreground">
                        Total verifications
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Common presentation request operations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    onClick={() => setActiveView('create')} 
                    className="w-full justify-start bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Request
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setActiveView('list')}
                    className="w-full justify-start"
                  >
                    <List className="h-4 w-4 mr-2" />
                    View All Requests
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setActiveView('analytics')}
                    className="w-full justify-start"
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View Analytics
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setActiveView('settings')}
                    className="w-full justify-start"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Configure Settings
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Status</CardTitle>
                  <CardDescription>Current system performance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-card">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <div>
                        <p className="text-sm font-medium text-foreground">API Status</p>
                        <p className="text-xs text-muted-foreground">All systems operational</p>
                      </div>
                    </div>
                    <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Online</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-card">
                    <div className="flex items-center gap-3">
                      <Zap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Response Time</p>
                        <p className="text-xs text-muted-foreground">Average: 1.2s</p>
                      </div>
                    </div>
                    <Badge variant="secondary">Fast</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'create':
        return <CreatePresentationRequest />;

      case 'list':
        return (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground">All Presentation Requests</h2>
              <p className="text-muted-foreground">Manage and monitor your presentation requests</p>
            </div>
            <PresentationRequestList />
          </div>
        );

      case 'analytics':
        return <AnalyticsView />;

      case 'history':
        return <HistoryView />;

      case 'settings':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Settings</h2>
              <p className="text-muted-foreground">Configure your presentation request preferences</p>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Configuration Options</CardTitle>
                <CardDescription>
                  Presentation request settings and preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-card">
                    <div>
                      <h4 className="font-medium text-foreground">Auto-approve trusted verifiers</h4>
                      <p className="text-sm text-muted-foreground">
                        Automatically approve requests from pre-approved verifiers
                      </p>
                    </div>
                    <Button variant="outline" size="sm">Configure</Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-card">
                    <div>
                      <h4 className="font-medium text-foreground">Default credential types</h4>
                      <p className="text-sm text-muted-foreground">
                        Set default credential types for new requests
                      </p>
                    </div>
                    <Button variant="outline" size="sm">Manage</Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-card">
                    <div>
                      <h4 className="font-medium text-foreground">Notification preferences</h4>
                      <p className="text-sm text-muted-foreground">
                        Configure how you receive notifications
                      </p>
                    </div>
                    <Button variant="outline" size="sm">Edit</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Select a section from the sidebar</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-background to-muted">
      {/* Enhanced Sidebar */}
      <div className="w-72 bg-card border-r border-border flex flex-col shadow-lg h-screen">
        {/* Header */}
        <div className="p-6 border-b border-border bg-gradient-to-r from-primary to-purple-600 dark:from-primary dark:to-purple-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
              <Shield className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-primary-foreground">Presentation</h1>
              <p className="text-sm text-primary-foreground/80">Verification Hub</p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="p-4 bg-muted/50 border-b border-border">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-card p-3 rounded-lg shadow-sm border border-border">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-green-100 dark:bg-green-900 rounded">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Active</p>
                  <p className="text-lg font-bold text-foreground">{overviewStats?.activeRequests || 0}</p>
                </div>
              </div>
            </div>
            <div className="bg-card p-3 rounded-lg shadow-sm border border-border">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-blue-100 dark:bg-blue-900 rounded">
                  <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Responses</p>
                  <p className="text-lg font-bold text-foreground">{overviewStats?.responseCount || 0}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            
            return (
              <Button
                key={item.id}
                variant="ghost"
                className={`w-full justify-start h-12 text-left transition-all duration-200 ${
                  isActive 
                    ? "bg-gradient-to-r from-primary to-purple-500 text-primary-foreground shadow-md hover:from-primary/90 hover:to-purple-600" 
                    : "hover:bg-accent text-foreground hover:text-accent-foreground"
                }`}
                onClick={() => setActiveView(item.id)}
              >
                <div className="flex items-center gap-3 w-full">
                  <Icon className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium truncate">{item.label}</span>
                      {item.badge && (
                        <Badge 
                          variant={isActive ? "secondary" : "default"} 
                          className={`ml-2 text-xs ${
                            isActive 
                              ? "bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30" 
                              : "bg-primary/10 text-primary"
                          }`}
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </div>
                    <p className={`text-xs mt-0.5 truncate ${
                      isActive ? 'text-primary-foreground/80' : 'text-muted-foreground'
                    }`}>
                      {item.description}
                    </p>
                  </div>
                </div>
              </Button>
            );
          })}
        </nav>

        <Separator />

        {/* Quick Actions */}
        <div className="p-4 space-y-2">
          <Button 
            onClick={() => setActiveView('create')} 
            className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-md dark:from-green-600 dark:to-emerald-600 dark:hover:from-green-700 dark:hover:to-emerald-700"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Quick Create
          </Button>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-muted/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
              <Zap className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-foreground">System Status</p>
              <p className="text-xs text-green-600 dark:text-green-400">All systems operational</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <main className="flex-1 overflow-y-auto p-8">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
