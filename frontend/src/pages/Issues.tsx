import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { apiService } from '@/services/api';
import type { Issue } from '@/types';
import { AlertTriangle, Clock, User, Calendar, Github, Search, FileText } from 'lucide-react';

const priorityColors = {
  low: 'bg-blue-100 text-blue-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800'
};

const statusColors = {
  open: 'bg-gray-100 text-gray-800',
  'in-progress': 'bg-blue-600 text-white',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-purple-100 text-purple-800'
};

export function Issues() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [filteredIssues, setFilteredIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSource, setSelectedSource] = useState<'all' | 'github' | 'manual'>('all');

  useEffect(() => {
    const fetchIssues = async () => {
      try {
        const response = await apiService.getIssues();
        if (response.success) {
          setIssues(response.data);
          setFilteredIssues(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch issues:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchIssues();
  }, []);

  useEffect(() => {
    let filtered = issues;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(issue =>
        issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (issue.repository && issue.repository.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by source
    if (selectedSource !== 'all') {
      filtered = filtered.filter(issue => issue.source === selectedSource);
    }

    setFilteredIssues(filtered);
  }, [issues, searchTerm, selectedSource]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const githubIssues = issues.filter(issue => issue.source === 'github');
  const manualIssues = issues.filter(issue => issue.source === 'manual');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold dark-blue-header">Issues</h1>
          <p className="text-muted-foreground mt-2">
            Track and manage system issues from multiple sources
          </p>
        </div>
        
        <div className="flex space-x-2">
          <Badge variant="secondary">{issues.length} Total Issues</Badge>
          <Badge variant="outline" className="bg-blue-100 text-blue-800">
            {githubIssues.length} GitHub
          </Badge>
          <Badge variant="outline">
            {issues.filter(i => i.status === 'open').length} Open
          </Badge>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-600 w-4 h-4" />
              <Input
                placeholder="Search issues by title, description, category, or repository..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white border-blue-200"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedSource('all')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedSource === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-blue-700 border border-blue-200 hover:bg-blue-50'
                }`}
              >
                All Sources
              </button>
              <button
                onClick={() => setSelectedSource('github')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1 ${
                  selectedSource === 'github'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-blue-700 border border-blue-200 hover:bg-blue-50'
                }`}
              >
                <Github className="w-4 h-4" />
                <span>GitHub</span>
              </button>
              <button
                onClick={() => setSelectedSource('manual')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedSource === 'manual'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-blue-700 border border-blue-200 hover:bg-blue-50'
                }`}
              >
                Manual
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Issues Table/List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredIssues.map((issue) => (
          <Card key={issue.id} className="hover:shadow-md transition-shadow bg-blue-50 border-blue-200">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <CardTitle className="text-lg dark-blue-header">
                      {issue.title}
                    </CardTitle>
                    {issue.source === 'github' && (
                      <Badge variant="outline" className="bg-blue-100 text-blue-800">
                        <Github className="w-3 h-3 mr-1" />
                        GitHub
                      </Badge>
                    )}
                  </div>
                  {issue.repository && (
                    <p className="text-sm text-blue-600 mb-1">
                      Repository: {issue.repository}
                    </p>
                  )}
                  {issue.file && (
                    <p className="text-sm text-blue-600 mb-1 flex items-center space-x-1">
                      <FileText className="w-3 h-3" />
                      <span>
                        {issue.file}{issue.line && ` (Line ${issue.line})`}
                      </span>
                    </p>
                  )}
                </div>
                <div className="flex space-x-2">
                  <Badge 
                    variant="outline" 
                    className={priorityColors[issue.priority]}
                  >
                    {issue.priority.toUpperCase()}
                  </Badge>
                  <Badge 
                    variant="outline"
                    className={statusColors[issue.status]}
                  >
                    {issue.status.replace('-', ' ').toUpperCase()}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-blue-700">
                {issue.description}
              </p>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-blue-600">
                <div className="flex items-center space-x-1">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{issue.category}</span>
                </div>
                
                {issue.assignee && (
                  <div className="flex items-center space-x-1">
                    <User className="w-4 h-4" />
                    <span>{issue.assignee}</span>
                  </div>
                )}
                
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
                </div>
                
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{new Date(issue.createdAt).toLocaleTimeString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredIssues.length === 0 && !loading && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="text-center py-12">
            {searchTerm || selectedSource !== 'all' ? (
              <>
                <Search className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2 dark-blue-header">No Issues Found</h3>
                <p className="text-blue-700">
                  No issues match your current search criteria. Try adjusting your filters.
                </p>
              </>
            ) : (
              <>
                <AlertTriangle className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2 dark-blue-header">No Issues Found</h3>
                <p className="text-blue-700">
                  Great! No issues are currently reported in the system.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Summary Stats */}
      {issues.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="dark-blue-header">Issue Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold dark-blue-header">{issues.filter(i => i.priority === 'critical').length}</p>
                <p className="text-sm text-red-600">Critical</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold dark-blue-header">{issues.filter(i => i.priority === 'high').length}</p>
                <p className="text-sm text-orange-600">High</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold dark-blue-header">{issues.filter(i => i.priority === 'medium').length}</p>
                <p className="text-sm text-yellow-600">Medium</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold dark-blue-header">{issues.filter(i => i.priority === 'low').length}</p>
                <p className="text-sm text-blue-600">Low</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}