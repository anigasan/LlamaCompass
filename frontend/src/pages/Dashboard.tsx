import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { GitHubScannerDialog } from '@/components/GitHubScannerDialog';
import { apiService } from '@/services/api';
import type { DashboardMetrics } from '@/types';
import { 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Users,
  Clock,
  Target,
  Activity,
  Github,
  Shield,
  Code,
  Scan
} from 'lucide-react';

export function Dashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    try {
      const response = await apiService.getDashboardMetrics();
      if (response.success) {
        setMetrics(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  // Refresh metrics when GitHub scan is completed
  const handleScanComplete = () => {
    fetchMetrics();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Failed to load dashboard data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold dark-blue-header">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Welcome back! Here's what's happening with your platform.
          </p>
        </div>
        
        {/* GitHub Scanner Button */}
        <GitHubScannerDialog onScanComplete={handleScanComplete}>
          <Button 
            variant="outline" 
            size="sm"
            className="bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-700"
          >
            <Github className="w-4 h-4 mr-2" />
            GitHub Scanner
          </Button>
        </GitHubScannerDialog>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium dark-blue-header">Total Issues</CardTitle>
            <AlertTriangle className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold dark-blue-header">{metrics.totalIssues}</div>
            <p className="text-xs text-blue-700">
              {metrics.openIssues} open, {metrics.resolvedIssues} resolved
            </p>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium dark-blue-header">Active Agents</CardTitle>
            <Users className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold dark-blue-header">{metrics.activeAgents}</div>
            <p className="text-xs text-blue-700">
              {metrics.totalAgents} total agents
            </p>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium dark-blue-header">Avg Resolution Time</CardTitle>
            <Clock className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold dark-blue-header">{metrics.avgResolutionTime}</div>
            <p className="text-xs text-blue-700">
              {metrics.resolutionTrend > 0 ? '+' : ''}{metrics.resolutionTrend}% from last week
            </p>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium dark-blue-header">Customer Satisfaction</CardTitle>
            <Target className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold dark-blue-header">{metrics.customerSatisfaction}%</div>
            <p className="text-xs text-blue-700">
              Based on {metrics.totalFeedback} responses
            </p>
          </CardContent>
        </Card>
      </div>

      {/* GitHub Summary Section */}
      {metrics.githubSummary && metrics.githubSummary.totalScans > 0 && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="dark-blue-header flex items-center space-x-2">
              <Github className="w-5 h-5" />
              <span>GitHub Security Summary</span>
              <Badge variant="outline" className="bg-blue-100 text-blue-800">
                {metrics.githubSummary.totalScans} scans
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-white rounded-lg border border-blue-100">
                <Shield className="w-5 h-5 text-red-600 mx-auto mb-1" />
                <p className="text-lg font-bold dark-blue-header">{metrics.githubSummary.criticalIssues}</p>
                <p className="text-xs text-blue-600">Critical Issues</p>
              </div>
              
              <div className="text-center p-3 bg-white rounded-lg border border-blue-100">
                <AlertTriangle className="w-5 h-5 text-orange-600 mx-auto mb-1" />
                <p className="text-lg font-bold dark-blue-header">{metrics.githubSummary.highIssues}</p>
                <p className="text-xs text-blue-600">High Priority</p>
              </div>
              
              <div className="text-center p-3 bg-white rounded-lg border border-blue-100">
                <Code className="w-5 h-5 text-green-600 mx-auto mb-1" />
                <p className="text-lg font-bold dark-blue-header">{metrics.githubSummary.avgQualityScore}%</p>
                <p className="text-xs text-blue-600">Avg Quality</p>
              </div>
              
              <div className="text-center p-3 bg-white rounded-lg border border-blue-100">
                <Scan className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                <p className="text-sm font-bold dark-blue-header">
                  {metrics.githubSummary.lastScanDate 
                    ? new Date(metrics.githubSummary.lastScanDate).toLocaleDateString()
                    : 'N/A'
                  }
                </p>
                <p className="text-xs text-blue-600">Last Scan</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="dark-blue-header flex items-center space-x-2">
              <Activity className="w-5 h-5" />
              <span>Recent Issues</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.recentIssues.map((issue) => (
                <div key={issue.id} className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-blue-100">
                  <div className="flex items-center space-x-2">
                    {issue.timeAgo === 'GitHub scan' ? (
                      <Github className="w-4 h-4 text-blue-600" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-orange-600" />
                    )}
                    {issue.timeAgo === 'GitHub scan' && (
                      <Badge variant="outline" className="bg-blue-100 text-blue-800 text-xs">
                        GitHub
                      </Badge>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm dark-blue-header">{issue.title}</p>
                    <p className="text-xs text-blue-600">{issue.category} • {issue.priority}</p>
                  </div>
                  <span className="text-xs text-blue-600">{issue.timeAgo}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="dark-blue-header flex items-center space-x-2">
              <TrendingUp className="w-5 h-5" />
              <span>Performance Trends</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-100">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="font-medium text-sm dark-blue-header">Issues Resolved</span>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">+{metrics.weeklyResolved}</p>
                  <p className="text-xs text-blue-600">This week</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-100">
                <div className="flex items-center space-x-3">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-sm dark-blue-header">Response Time</span>
                </div>
                <div className="text-right">
                  <p className="font-bold dark-blue-header">{metrics.avgResponseTime}</p>
                  <p className="text-xs text-blue-600">Average</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-100">
                <div className="flex items-center space-x-3">
                  <Users className="w-4 h-4 text-purple-600" />
                  <span className="font-medium text-sm dark-blue-header">Agent Efficiency</span>
                </div>
                <div className="text-right">
                  <p className="font-bold text-purple-600">{metrics.agentEfficiency}%</p>
                  <p className="text-xs text-blue-600">Overall</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}