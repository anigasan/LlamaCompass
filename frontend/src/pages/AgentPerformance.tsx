import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { apiService } from '@/services/api';
import type { AgentPerformance } from '@/types';
import { 
  Bot, 
  Clock, 
  Star, 
  CheckCircle, 
  AlertCircle, 
  TrendingUp, 
  AlertTriangle,
  Users,
  Target,
  Zap
} from 'lucide-react';

export function AgentPerformancePage() {
  const [agents, setAgents] = useState<AgentPerformance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAgentPerformance = async () => {
      try {
        const response = await apiService.getAgentPerformance();
        if (response.success) {
          setAgents(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch agent performance:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAgentPerformance();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const topPerformer = agents.reduce((prev, current) => 
    prev.efficiency > current.efficiency ? prev : current
  );

  const getFailureColor = (percentage: number) => {
    if (percentage <= 10) return 'text-green-600';
    if (percentage <= 20) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getFailureBgColor = (percentage: number) => {
    if (percentage <= 10) return 'bg-green-100';
    if (percentage <= 20) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold dark-blue-header">AI Agent Performance</h1>
          <p className="text-muted-foreground mt-2">
            Monitor AI agent performance and failure metrics across key categories
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium dark-blue-header">Total AI Agents</CardTitle>
            <Bot className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold dark-blue-header">{agents.length}</div>
            <p className="text-xs text-blue-700">Active AI systems</p>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium dark-blue-header">Top Performer</CardTitle>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold dark-blue-header">{topPerformer?.agentName}</div>
            <p className="text-xs text-blue-700">
              {topPerformer?.efficiency}% efficiency rating
            </p>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium dark-blue-header">Total Tasks Completed</CardTitle>
            <CheckCircle className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold dark-blue-header">
              {agents.reduce((sum, agent) => sum + agent.issuesResolved, 0)}
            </div>
            <p className="text-xs text-blue-700">This month</p>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium dark-blue-header">Avg Failure Rate</CardTitle>
            <AlertTriangle className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold dark-blue-header">
              {Math.round(agents.reduce((sum, agent) => 
                sum + (agent.specificationIssues + agent.interAgentAlignment + agent.taskVerification) / 3, 0
              ) / agents.length)}%
            </div>
            <p className="text-xs text-blue-700">Across all categories</p>
          </CardContent>
        </Card>
      </div>

      {/* AI Agent Performance Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {agents.map((agent) => (
          <Card key={agent.id} className="hover:shadow-md transition-shadow bg-blue-50 border-blue-200">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Bot className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg dark-blue-header">
                      {agent.agentName}
                    </CardTitle>
                    <p className="text-sm text-blue-700">
                      AI Agent System
                    </p>
                  </div>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  agent.efficiency >= 90 
                    ? 'bg-green-100 text-green-800' 
                    : agent.efficiency >= 80 
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {agent.efficiency}% Efficiency
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Performance Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <div>
                      <p className="text-lg font-semibold dark-blue-header">
                        {agent.issuesResolved}
                      </p>
                      <p className="text-xs text-blue-600">
                        Tasks Completed
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Target className="w-4 h-4 text-orange-600" />
                    <div>
                      <p className="text-lg font-semibold dark-blue-header">
                        {agent.activeTickets}
                      </p>
                      <p className="text-xs text-blue-600">
                        Active Tasks
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <div>
                      <p className="text-sm font-semibold dark-blue-header">
                        {agent.averageResolutionTime}
                      </p>
                      <p className="text-xs text-blue-600">
                        Avg Resolution
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Star className="w-4 h-4 text-yellow-600" />
                    <div>
                      <p className="text-sm font-semibold dark-blue-header">
                        {agent.customerSatisfaction}/5
                      </p>
                      <p className="text-xs text-blue-600">
                        Satisfaction
                      </p>
                    </div>
                  </div>
                </div>

                {/* Failure Metrics */}
                <div className="border-t border-blue-200 pt-4">
                  <h4 className="text-sm font-semibold dark-blue-header mb-3">Failure Analysis (%)</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="w-4 h-4 text-purple-600" />
                        <span className="text-sm dark-blue-header">Specification Issues</span>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-medium ${getFailureBgColor(agent.specificationIssues)} ${getFailureColor(agent.specificationIssues)}`}>
                        {agent.specificationIssues}%
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-indigo-600" />
                        <span className="text-sm dark-blue-header">Inter-Agent Alignment</span>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-medium ${getFailureBgColor(agent.interAgentAlignment)} ${getFailureColor(agent.interAgentAlignment)}`}>
                        {agent.interAgentAlignment}%
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Zap className="w-4 h-4 text-cyan-600" />
                        <span className="text-sm dark-blue-header">Task Verification</span>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-medium ${getFailureBgColor(agent.taskVerification)} ${getFailureColor(agent.taskVerification)}`}>
                        {agent.taskVerification}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Overall Performance Bar */}
                <div className="border-t border-blue-200 pt-4">
                  <div className="flex justify-between text-xs mb-1 text-blue-600">
                    <span>Overall Performance</span>
                    <span>{agent.efficiency}%</span>
                  </div>
                  <div className="w-full rounded-full h-2 bg-blue-200">
                    <div 
                      className={`h-2 rounded-full ${
                        agent.efficiency >= 90 
                          ? 'bg-green-500' 
                          : agent.efficiency >= 80 
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${agent.efficiency}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {agents.length === 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="text-center py-12">
            <Bot className="w-12 h-12 text-blue-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2 dark-blue-header">No AI Agent Data Found</h3>
            <p className="text-blue-700">
              AI agent performance data will appear here once available.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}