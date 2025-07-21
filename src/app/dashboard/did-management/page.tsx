'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText,
  Settings,
  Search,
  Plus,
  Globe,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Users,
  Clock
} from 'lucide-react';

import { 
  DIDDocumentEditor,
  DIDDocumentPreview,
  AdvancedDIDResolver
} from '@/components';

import type { DIDDocument, UniversalResolutionResponse, DIDResponse } from '@/types/did';
import didService from '@/services/didService';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface DIDManagementDashboardProps {
  userId?: string;
  tenantId?: string;
}

interface DIDStats {
  total: number;
  active: number;
  updated24h: number;
  methods: Record<string, number>;
}

// Type based on actual API response
interface DIDItem {
  id: string;
  did: string;
  document: DIDDocument;
  method: string;
  identifier: string;
  status: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  metadata?: Record<string, any>;
}

const DIDManagementDashboard: React.FC<DIDManagementDashboardProps> = ({
  userId: propUserId,
  tenantId: propTenantId
}) => {
  const { user } = useAuth();
  
  // Use auth context user data or props
  const userId = propUserId || user?.id;
  const tenantId = propTenantId || user?.tenant_id;

  // Core state
  const [activeTab, setActiveTab] = useState('overview');
  const [userDIDs, setUserDIDs] = useState<DIDItem[]>([]);
  const [selectedDID, setSelectedDID] = useState<DIDDocument | null>(null);
  const [stats, setStats] = useState<DIDStats>({
    total: 0,
    active: 0,
    updated24h: 0,
    methods: {}
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [didsPage, setDidsPage] = useState(1);
  const [didsHasMore, setDidsHasMore] = useState(true);
  const [didsLoading, setDidsLoading] = useState(false);
  const [showAllDIDs, setShowAllDIDs] = useState(false);
  const [totalDIDs, setTotalDIDs] = useState(0); // Track total count from API

  // Editor state
  const [isEditing, setIsEditing] = useState(false);
  const [showCreateNew, setShowCreateNew] = useState(false);

  // Resolution state
  const [recentResolutions, setRecentResolutions] = useState<UniversalResolutionResponse[]>([]);
  const [resolutionsPage, setResolutionsPage] = useState(1);
  const [resolutionsHasMore, setResolutionsHasMore] = useState(true);
  const [resolutionsLoading, setResolutionsLoading] = useState(false);
  const [showAllResolutions, setShowAllResolutions] = useState(false);

  // Load user DIDs function with useCallback
  const loadUserDIDs = useCallback(async (page: number = 1, append: boolean = false) => {
    const handleLoadSuccess = (response: any) => {
      const newDIDs = response.dids as unknown as DIDItem[] || [];
      
      // Update total count from API response
      if (response.total !== undefined) {
        setTotalDIDs(response.total);
      }
      
      if (append && page > 1) {
        setUserDIDs(prev => [...prev, ...newDIDs]);
      } else {
        setUserDIDs(newDIDs);
      }
      
      // Check if there are more items to load
      setDidsHasMore(newDIDs.length === 5 && !showAllDIDs); // Only check for 5-item pagination
      setDidsPage(page);
    };

    const handleLoadError = (err: any) => {
      const errorMessage = err.message || 'Failed to load DIDs';
      setError(errorMessage);
      toast({
        title: 'Loading Failed',
        description: errorMessage,
        variant: 'destructive'
      });
    };

    try {
      if (page === 1) {
        setLoading(true);
      } else {
        setDidsLoading(true);
      }
      setError(null);

      // Fetch user's DIDs from backend with pagination
      const limit = showAllDIDs ? (totalDIDs || 100) : 5;
      console.log(`Loading DIDs: page=${page}, limit=${limit}, showAll=${showAllDIDs}`);
      
      const response = await didService.listDIDs({
        limit,
        page,
        sort: 'created_at_desc' // Sort by creation date, newest first
      });
      
      handleLoadSuccess(response);
    } catch (err: any) {
      handleLoadError(err);
    } finally {
      setLoading(false);
      setDidsLoading(false);
    }
  }, [totalDIDs, showAllDIDs]);

  // Load user DIDs and stats
  useEffect(() => {
    if (userId) {
      loadUserDIDs(1, false);
      loadStats();
    }
  }, [userId, tenantId, loadUserDIDs]);

  const loadStats = async () => {
    try {
      // Fetch statistics from backend
      const [statsResponse] = await Promise.all([
        didService.getDIDStatistics()
      ]);

      // For stats, we can use the totalDIDs or current userDIDs
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Calculate local stats from user DIDs (if we have them)
      const stats: DIDStats = {
        total: totalDIDs || userDIDs.length, // Use totalDIDs from API
        active: userDIDs.filter(item => item.status === 'active').length,
        updated24h: userDIDs.filter(item => {
          const updatedAt = new Date(item.updated_at);
          return updatedAt >= yesterday;
        }).length,
        methods: userDIDs.reduce((acc, item) => {
          const method = item.method;
          acc[method] = (acc[method] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      };

      setStats(stats);
    } catch (err) {
      console.error('Failed to load stats:', err);
      // Fallback to local calculation
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const fallbackStats: DIDStats = {
        total: totalDIDs || userDIDs.length,
        active: userDIDs.filter(item => item.status === 'active').length,
        updated24h: userDIDs.filter(item => {
          const updatedAt = new Date(item.updated_at);
          return updatedAt >= yesterday;
        }).length,
        methods: userDIDs.reduce((acc, item) => {
          const method = item.method;
          acc[method] = (acc[method] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      };

      setStats(fallbackStats);
    }
  };

  // Load more DIDs function
  const loadMoreDIDs = useCallback(async () => {
    if (didsLoading || !didsHasMore) return;
    await loadUserDIDs(didsPage + 1, true);
  }, [didsLoading, didsHasMore, didsPage, loadUserDIDs]);

  // Load all DIDs function
  const loadAllDIDs = useCallback(async () => {
    setShowAllDIDs(true);
    await loadUserDIDs(1, false);
  }, [loadUserDIDs]);

  const handleDIDSaved = async (savedDID: DIDDocument) => {
    try {
      // Refresh the user DIDs list to get updated data
      await loadUserDIDs();
      
      // Find the corresponding DID response for selection
      const didResponse = userDIDs.find(item => item.did === savedDID.id);
      if (didResponse) {
        // Use the saved DID document directly
        setSelectedDID(savedDID);
      } else {
        setSelectedDID(savedDID);
      }
      
      setIsEditing(false);
      setShowCreateNew(false);
      
      toast({
        title: 'Success',
        description: 'DID document saved successfully'
      });
      
      // Reload stats
      await loadStats();
    } catch (error) {
      console.error('Failed to refresh DIDs after save:', error);
      // Still set the selectedDID even if refresh fails
      setSelectedDID(savedDID);
      setIsEditing(false);
      setShowCreateNew(false);
      
      toast({
        title: 'Success',
        description: 'DID document saved successfully'
      });
    }
  };

  const handleDIDSelected = async (didItem: DIDItem) => {
    try {
      // Use the document directly from the API response or fetch if needed
      if (didItem.document) {
        setSelectedDID(didItem.document);
      } else {
        // Fetch the full DID document for the selected DID
        const response = await didService.getDID(didItem.did);
        setSelectedDID(response.document);
      }
      
      setIsEditing(false);
      setActiveTab('document');
    } catch (error) {
      console.error('Failed to load DID document:', error);
      toast({
        title: 'Error',
        description: 'Failed to load DID document',
        variant: 'destructive'
      });
    }
  };

  const handleResolutionCompleted = (result: UniversalResolutionResponse) => {
    setRecentResolutions(prev => [result, ...prev.slice(0, 4)]); // Keep last 5
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading DID management dashboard...</p>
        </div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Authentication Required</h3>
          <p className="text-muted-foreground">
            Please log in to access the DID management dashboard
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">DID Management Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive DID document management with enhanced features
          </p>
        </div>
        <Button onClick={() => setShowCreateNew(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create New DID
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total DIDs</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              Across all methods
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active DIDs</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
            <p className="text-xs text-muted-foreground">
              Currently active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Updated Today</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.updated24h}</div>
            <p className="text-xs text-muted-foreground">
              Last 24 hours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Methods</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1">
              {Object.entries(stats.methods).map(([method, count]) => (
                <Badge key={method} variant="secondary" className="text-xs">
                  {method}: {count}
                </Badge>
              ))}
              {Object.keys(stats.methods).length === 0 && (
                <span className="text-sm text-muted-foreground">None yet</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="border-b px-6 pt-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="document" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Document
                  {selectedDID && <Badge variant="secondary">Selected</Badge>}
                </TabsTrigger>
                <TabsTrigger value="resolver" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Resolver
                </TabsTrigger>
                <TabsTrigger value="editor" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Editor
                  {(isEditing || showCreateNew) && <Badge variant="secondary">Active</Badge>}
                </TabsTrigger>
              </TabsList>
            </div>
            
            <div className="p-6">
              {/* Overview Tab */}
              <TabsContent value="overview" className="mt-0 space-y-6">
                <OverviewContent 
                  userDIDs={userDIDs}
                  recentResolutions={recentResolutions}
                  onDIDSelected={handleDIDSelected}
                  onCreateNew={() => setShowCreateNew(true)}
                  didsHasMore={didsHasMore}
                  didsLoading={didsLoading}
                  onLoadMoreDIDs={loadMoreDIDs}
                  onLoadAllDIDs={loadAllDIDs}
                  showAllDIDs={showAllDIDs}
                  resolutionsHasMore={resolutionsHasMore}
                  resolutionsLoading={resolutionsLoading}
                  showAllResolutions={showAllResolutions}
                />
              </TabsContent>

              {/* Document Tab */}
              <TabsContent value="document" className="mt-0">
                {selectedDID ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium">DID Document</h3>
                        <code className="text-sm text-muted-foreground">{selectedDID.id}</code>
                      </div>
                      <Button 
                        variant="outline" 
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-2"
                      >
                        <Settings className="h-4 w-4" />
                        Edit
                      </Button>
                    </div>
                    <DIDDocumentPreview document={selectedDID} />
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Document Selected</h3>
                    <p className="text-muted-foreground mb-4">
                      Select a DID from your overview or create a new one
                    </p>
                    <Button onClick={() => setShowCreateNew(true)}>
                      Create New DID
                    </Button>
                  </div>
                )}
              </TabsContent>

              {/* Resolver Tab */}
              <TabsContent value="resolver" className="mt-0">
                <AdvancedDIDResolver 
                  initialDid={selectedDID?.id || ''}
                  onResolved={handleResolutionCompleted}
                />
              </TabsContent>

              {/* Editor Tab */}
              <TabsContent value="editor" className="mt-0">
                {(isEditing || showCreateNew) ? (
                  <DIDDocumentEditor 
                    did={selectedDID?.id || ''}
                    initialDocument={isEditing && selectedDID ? selectedDID : undefined}
                    onSave={handleDIDSaved}
                    onCancel={() => {
                      setIsEditing(false);
                      setShowCreateNew(false);
                    }}
                  />
                ) : (
                  <div className="text-center py-12">
                    <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Active Editor</h3>
                    <p className="text-muted-foreground mb-4">
                      Select a DID to edit or create a new one
                    </p>
                    <div className="flex gap-2 justify-center">
                      <Button 
                        variant="outline" 
                        onClick={() => setIsEditing(!!selectedDID)}
                        disabled={!selectedDID}
                      >
                        Edit Selected
                      </Button>
                      <Button onClick={() => setShowCreateNew(true)}>
                        Create New
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

// Sub-components
interface OverviewContentProps {
  userDIDs: DIDItem[];
  recentResolutions: UniversalResolutionResponse[];
  onDIDSelected: (didItem: DIDItem) => void;
  onCreateNew: () => void;
  didsHasMore: boolean;
  didsLoading: boolean;
  onLoadMoreDIDs: () => void;
  onLoadAllDIDs: () => void;
  showAllDIDs: boolean;
  resolutionsHasMore: boolean;
  resolutionsLoading: boolean;
  showAllResolutions: boolean;
}

const OverviewContent: React.FC<OverviewContentProps> = ({
  userDIDs,
  recentResolutions,
  onDIDSelected,
  onCreateNew,
  didsHasMore,
  didsLoading,
  onLoadMoreDIDs,
  onLoadAllDIDs,
  showAllDIDs,
  resolutionsHasMore,
  resolutionsLoading,
  showAllResolutions
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* User DIDs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Your DIDs
            <Button variant="outline" size="sm" onClick={onCreateNew}>
              <Plus className="h-4 w-4 mr-2" />
              New
            </Button>
          </CardTitle>
          <CardDescription>
            Manage your DID documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          {userDIDs.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No DIDs Created Yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Start by creating your first Decentralized Identifier to manage your digital identity
              </p>
              <Button onClick={onCreateNew} className="hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First DID
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {userDIDs.map((didItem, index) => (
                <div 
                  key={didItem.id || index}
                  className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => onDIDSelected(didItem)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <code className="text-sm font-mono bg-muted px-2 py-1 rounded text-foreground truncate">
                        {didItem.did}
                      </code>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs">
                        {didItem.method}
                      </Badge>
                      <Badge 
                        variant={didItem.status === 'active' ? 'default' : 'secondary'} 
                        className="text-xs"
                      >
                        {didItem.status}
                      </Badge>
                      {didItem.metadata?.keyType && (
                        <Badge variant="secondary" className="text-xs">
                          {didItem.metadata.keyType}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        Created: {new Date(didItem.created_at).toLocaleDateString()}
                      </span>
                      {didItem.updated_at !== didItem.created_at && (
                        <span className="text-xs text-muted-foreground">
                          • Updated: {new Date(didItem.updated_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {didItem.document?.verificationMethod && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        {didItem.document.verificationMethod.length} verification method(s)
                        {didItem.document.service && didItem.document.service.length > 0 && 
                          ` • ${didItem.document.service.length} service(s)`
                        }
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button variant="ghost" size="sm" className="hover:bg-primary/10">
                      <FileText className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
              ))}
              
              {/* Action Buttons */}
              {(didsHasMore || !showAllDIDs) && (
                <div className="text-center pt-3">
                  <p className="text-sm text-muted-foreground mb-2">
                    {showAllDIDs 
                      ? `Showing all ${userDIDs.length} DID${userDIDs.length > 1 ? 's' : ''}`
                      : `Showing ${userDIDs.length} DID${userDIDs.length > 1 ? 's' : ''}`
                    }
                  </p>
                  <div className="flex gap-2 justify-center">
                    {didsHasMore && !showAllDIDs && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={onLoadMoreDIDs}
                        disabled={didsLoading}
                      >
                        {didsLoading ? 'Loading...' : 'View More (+5)'}
                      </Button>
                    )}
                    {!showAllDIDs && (
                      <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={onLoadAllDIDs}
                        disabled={didsLoading}
                      >
                        {didsLoading ? 'Loading...' : 'Show All'}
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Resolutions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Resolutions</CardTitle>
          <CardDescription>
            Latest DID resolution activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentResolutions.length === 0 ? (
            <div className="text-center py-8">
              <Search className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No recent resolutions</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentResolutions.map((resolution, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex-1">
                    <code className="text-sm">{resolution.didDocument?.id || 'Unknown'}</code>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge 
                        variant={resolution.resolutionResult === 'success' ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        {resolution.resolutionResult}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {resolution.resolutionTime}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default function DIDManagementPage() {
  return <DIDManagementDashboard />;
}
