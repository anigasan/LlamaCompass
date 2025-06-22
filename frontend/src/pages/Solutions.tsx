import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { apiService } from '@/services/api';
import type { Solution } from '@/types';
import { Lightbulb, Star, Users, Calendar, Tag, Github, Search } from 'lucide-react';

export function Solutions() {
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [filteredSolutions, setFilteredSolutions] = useState<Solution[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSource, setSelectedSource] = useState<'all' | 'github' | 'manual'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    const fetchSolutions = async () => {
      try {
        const response = await apiService.getSolutions();
        if (response.success) {
          setSolutions(response.data);
          setFilteredSolutions(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch solutions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSolutions();
  }, []);

  useEffect(() => {
    let filtered = solutions;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(solution =>
        solution.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        solution.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        solution.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        solution.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (solution.repository && solution.repository.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by source
    if (selectedSource !== 'all') {
      filtered = filtered.filter(solution => solution.source === selectedSource);
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(solution => solution.category === selectedCategory);
    }

    setFilteredSolutions(filtered);
  }, [solutions, searchTerm, selectedSource, selectedCategory]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const githubSolutions = solutions.filter(solution => solution.source === 'github');
  const manualSolutions = solutions.filter(solution => solution.source === 'manual');
  const categories = Array.from(new Set(solutions.map(s => s.category)));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold dark-blue-header">Solutions</h1>
          <p className="text-muted-foreground mt-2">
            Knowledge base of proven solutions and remediations
          </p>
        </div>
        
        <div className="flex space-x-2">
          <Badge variant="secondary">{solutions.length} Total Solutions</Badge>
          <Badge variant="outline" className="bg-blue-100 text-blue-800">
            {githubSolutions.length} GitHub
          </Badge>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-600 w-4 h-4" />
              <Input
                placeholder="Search solutions by title, description, category, tags, or repository..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white border-blue-200"
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              {/* Source Filter */}
              <div className="flex gap-1">
                <button
                  onClick={() => setSelectedSource('all')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    selectedSource === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-blue-700 border border-blue-200 hover:bg-blue-50'
                  }`}
                >
                  All Sources
                </button>
                <button
                  onClick={() => setSelectedSource('github')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors flex items-center space-x-1 ${
                    selectedSource === 'github'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-blue-700 border border-blue-200 hover:bg-blue-50'
                  }`}
                >
                  <Github className="w-3 h-3" />
                  <span>GitHub</span>
                </button>
                <button
                  onClick={() => setSelectedSource('manual')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    selectedSource === 'manual'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-blue-700 border border-blue-200 hover:bg-blue-50'
                  }`}
                >
                  Manual
                </button>
              </div>

              {/* Category Filter */}
              <div className="flex gap-1">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    selectedCategory === 'all'
                      ? 'bg-green-600 text-white'
                      : 'bg-white text-green-700 border border-green-200 hover:bg-green-50'
                  }`}
                >
                  All Categories
                </button>
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      selectedCategory === category
                        ? 'bg-green-600 text-white'
                        : 'bg-white text-green-700 border border-green-200 hover:bg-green-50'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Solutions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredSolutions.map((solution) => (
          <Card key={solution.id} className="hover:shadow-md transition-shadow bg-blue-50 border-blue-200">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <CardTitle className="text-lg flex items-center space-x-2 dark-blue-header">
                      <Lightbulb className="w-5 h-5 text-yellow-500" />
                      <span>{solution.title}</span>
                    </CardTitle>
                    {solution.source === 'github' && (
                      <Badge variant="outline" className="bg-blue-100 text-blue-800">
                        <Github className="w-3 h-3 mr-1" />
                        GitHub
                      </Badge>
                    )}
                  </div>
                  {solution.repository && (
                    <p className="text-sm text-blue-600 mb-2">
                      Repository: {solution.repository}
                    </p>
                  )}
                </div>
                <Badge variant="outline" className="bg-blue-100 text-blue-800">
                  {solution.category}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-blue-700">
                {solution.description}
              </p>
              
              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {solution.tags.map((tag) => (
                  <Badge 
                    key={tag} 
                    variant="secondary" 
                    className="text-xs bg-blue-100 text-blue-800"
                  >
                    <Tag className="w-3 h-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
              
              {/* Metrics */}
              <div className="grid grid-cols-3 gap-4 p-4 rounded-lg bg-blue-100">
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="text-lg font-semibold dark-blue-header">
                      {solution.effectiveness}%
                    </span>
                  </div>
                  <p className="text-xs text-blue-600">
                    Effectiveness
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1">
                    <Users className="w-4 h-4 text-blue-500" />
                    <span className="text-lg font-semibold dark-blue-header">
                      {solution.usageCount}
                    </span>
                  </div>
                  <p className="text-xs text-blue-600">
                    Times Used
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1">
                    <Calendar className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-semibold dark-blue-header">
                      {new Date(solution.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-blue-600">
                    Last Updated
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSolutions.length === 0 && !loading && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="text-center py-12">
            {searchTerm || selectedSource !== 'all' || selectedCategory !== 'all' ? (
              <>
                <Search className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2 dark-blue-header">No Solutions Found</h3>
                <p className="text-blue-700">
                  No solutions match your current search criteria. Try adjusting your filters.
                </p>
              </>
            ) : (
              <>
                <Lightbulb className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2 dark-blue-header">No Solutions Found</h3>
                <p className="text-blue-700">
                  Start building your knowledge base by scanning GitHub repositories or adding manual solutions.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Summary Stats */}
      {solutions.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="dark-blue-header">Solution Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold dark-blue-header">{manualSolutions.length}</p>
                <p className="text-sm text-blue-600">Manual Solutions</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold dark-blue-header">{githubSolutions.length}</p>
                <p className="text-sm text-blue-600">GitHub Solutions</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold dark-blue-header">{categories.length}</p>
                <p className="text-sm text-blue-600">Categories</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold dark-blue-header">
                  {Math.round(solutions.reduce((sum, s) => sum + s.effectiveness, 0) / solutions.length) || 0}%
                </p>
                <p className="text-sm text-blue-600">Avg Effectiveness</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}