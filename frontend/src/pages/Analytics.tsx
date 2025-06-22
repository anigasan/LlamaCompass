import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { apiService } from '@/services/api';
import type { AnalyticsData } from '@/types';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Route,
  Calendar,
  Activity,
  Target,
  Zap
} from 'lucide-react';

export function Analytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await apiService.getAnalytics();
        if (response.success) {
          setAnalytics(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Failed to load analytics data</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold dark-blue-header mb-2">Analytics</h2>
        <p className="text-muted-foreground">Track your navigation patterns and performance</p>
      </div>

      {/* Weekly Summary */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="dark-blue-header flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>This Week</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <p className="text-2xl font-bold dark-blue-header">{analytics.weeklyTrips}</p>
              <p className="text-sm text-muted-foreground">Total Trips</p>
            </div>
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <p className="text-2xl font-bold dark-blue-header">{analytics.weeklyDistance}</p>
              <p className="text-sm text-muted-foreground">Distance</p>
            </div>
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <p className="text-2xl font-bold dark-blue-header">{analytics.weeklyTime}</p>
              <p className="text-sm text-muted-foreground">Travel Time</p>
            </div>
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <p className="text-2xl font-bold dark-blue-header">{analytics.efficiency}%</p>
              <p className="text-sm text-muted-foreground">Efficiency</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="dark-blue-header flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            <span>Performance Trends</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center space-x-3">
                <Route className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium text-sm dark-blue-header">Average Route Efficiency</p>
                  <p className="text-xs text-muted-foreground">Compared to optimal routes</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-green-600">+12%</p>
                <p className="text-xs text-muted-foreground">vs last week</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="font-medium text-sm dark-blue-header">Time Saved</p>
                  <p className="text-xs text-muted-foreground">Through optimized routing</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-green-600">2.4 hrs</p>
                <p className="text-xs text-muted-foreground">this week</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center space-x-3">
                <Zap className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="font-medium text-sm dark-blue-header">Fuel Efficiency</p>
                  <p className="text-xs text-muted-foreground">Estimated savings</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-green-600">+8%</p>
                <p className="text-xs text-muted-foreground">improvement</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Destinations */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="dark-blue-header flex items-center space-x-2">
            <Target className="w-5 h-5" />
            <span>Top Destinations</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.topDestinations.map((dest, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm dark-blue-header">{dest.name}</p>
                    <p className="text-xs text-muted-foreground">{dest.visits} visits</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium dark-blue-header">{dest.avgTime}</p>
                  <p className="text-xs text-muted-foreground">avg time</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Activity Chart Placeholder */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="dark-blue-header flex items-center space-x-2">
            <Activity className="w-5 h-5" />
            <span>Activity Overview</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-center justify-center bg-muted/30 rounded-lg">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">Chart visualization coming soon</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}