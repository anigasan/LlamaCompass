import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { apiService } from '@/services/api';
import type { GitHubScanRequest, GitHubScanResult } from '@/types';
import { 
  Github, 
  Scan, 
  Shield, 
  Code, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  FileText,
  TrendingUp,
  Eye,
  XCircle,
  AlertCircle
} from 'lucide-react';

interface GitHubScannerDialogProps {
  children: React.ReactNode;
  onScanComplete?: () => void;
}

export function GitHubScannerDialog({ children, onScanComplete }: GitHubScannerDialogProps) {
  const [open, setOpen] = useState(false);
  const [repositoryUrl, setRepositoryUrl] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<GitHubScanResult | null>(null);
  const [scanHistory, setScanHistory] = useState<GitHubScanResult[]>([]);
  const [showToken, setShowToken] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchScanHistory();
    }
  }, [open]);

  const fetchScanHistory = async () => {
    try {
      const response = await apiService.getScanHistory();
      if (response.success) {
        setScanHistory(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch scan history:', error);
    }
  };

  const validateGitHubUrl = (url: string): boolean => {
    const githubUrlPattern = /^https:\/\/github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+\/?$/;
    return githubUrlPattern.test(url);
  };

  const handleScan = async () => {
    // Clear previous error and result
    setError(null);
    setScanResult(null);

    // Validate repository URL
    if (!repositoryUrl.trim()) {
      setError('Please enter a repository URL');
      return;
    }

    if (!validateGitHubUrl(repositoryUrl.trim())) {
      setError('Please enter a valid GitHub repository URL (e.g., https://github.com/username/repository)');
      return;
    }

    setIsScanning(true);

    const request: GitHubScanRequest = {
      repository_url: repositoryUrl.trim(),
      ...(accessToken.trim() && { access_token: accessToken.trim() })
    };

    try {
      console.log('Starting GitHub scan for:', request.repository_url);
      const response = await apiService.scanGitHubRepository(request);
      
      if (response.success) {
        console.log('Scan completed successfully:', response.data);
        setScanResult(response.data);
        fetchScanHistory(); // Refresh history
        
        // Notify parent component that scan is complete
        if (onScanComplete) {
          onScanComplete();
        }
      } else {
        console.error('Scan failed:', response.message);
        setError(response.message || 'Scan failed for unknown reason');
      }
    } catch (error) {
      console.error('Scan error:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsScanning(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const resetForm = () => {
    setRepositoryUrl('');
    setAccessToken('');
    setScanResult(null);
    setShowToken(false);
    setError(null);
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      if (!newOpen) {
        resetForm();
      }
    }}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] bg-white">
        <DialogHeader>
          <DialogTitle className="dark-blue-header flex items-center space-x-2">
            <Github className="w-5 h-5" />
            <span>GitHub Repository Scanner</span>
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
          <div className="space-y-6">
            {/* Scan Form */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="repository-url" className="dark-blue-header">
                    Repository URL *
                  </Label>
                  <Input
                    id="repository-url"
                    type="url"
                    placeholder="https://github.com/username/repository"
                    value={repositoryUrl}
                    onChange={(e) => {
                      setRepositoryUrl(e.target.value);
                      setError(null); // Clear error when user types
                    }}
                    className="bg-white border-blue-200"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="access-token" className="dark-blue-header">
                    GitHub Access Token (Optional)
                  </Label>
                  <div className="relative">
                    <Input
                      id="access-token"
                      type={showToken ? "text" : "password"}
                      placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                      value={accessToken}
                      onChange={(e) => setAccessToken(e.target.value)}
                      className="bg-white border-blue-200 pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowToken(!showToken)}
                    >
                      <Eye className="w-4 h-4 text-gray-400" />
                    </Button>
                  </div>
                  <p className="text-xs text-blue-600">
                    Access token is required for private repositories and increases rate limits
                  </p>
                </div>

                {/* Error Display */}
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <XCircle className="w-4 h-4 text-red-600" />
                      <p className="text-sm text-red-800 font-medium">Scan Failed</p>
                    </div>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                )}

                <Button 
                  onClick={handleScan} 
                  disabled={isScanning || !repositoryUrl.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {isScanning ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Scanning Repository...
                    </>
                  ) : (
                    <>
                      <Scan className="w-4 h-4 mr-2" />
                      Scan Repository
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Scan Results */}
            {scanResult && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-2 mb-4">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <h3 className="text-lg font-semibold dark-blue-header">Scan Results</h3>
                  <Badge variant="outline" className="bg-green-100 text-green-800">
                    Issues and solutions have been added to your dashboard
                  </Badge>
                </div>
                
                {scanResult.status === 'completed' && scanResult.results ? (
                  <div className="space-y-4">
                    {/* Overview Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="text-center p-3 bg-white rounded-lg border border-blue-100">
                        <FileText className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                        <p className="text-lg font-bold dark-blue-header">{scanResult.results.total_files}</p>
                        <p className="text-xs text-blue-600">Files</p>
                      </div>
                      
                      <div className="text-center p-3 bg-white rounded-lg border border-blue-100">
                        <Shield className="w-5 h-5 text-orange-600 mx-auto mb-1" />
                        <p className="text-lg font-bold dark-blue-header">{scanResult.results.security_issues}</p>
                        <p className="text-xs text-blue-600">Issues</p>
                      </div>
                      
                      <div className="text-center p-3 bg-white rounded-lg border border-blue-100">
                        <TrendingUp className="w-5 h-5 text-green-600 mx-auto mb-1" />
                        <p className="text-lg font-bold dark-blue-header">{scanResult.results.code_quality_score}</p>
                        <p className="text-xs text-blue-600">Quality</p>
                      </div>
                      
                      <div className="text-center p-3 bg-white rounded-lg border border-blue-100">
                        <Code className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                        <p className="text-lg font-bold dark-blue-header">{scanResult.results.dependencies}</p>
                        <p className="text-xs text-blue-600">Dependencies</p>
                      </div>
                    </div>

                    {/* Languages */}
                    <div>
                      <h4 className="text-sm font-semibold dark-blue-header mb-2">Languages</h4>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(scanResult.results.languages).map(([lang, percentage]) => (
                          <Badge key={lang} variant="outline" className="bg-blue-100 text-blue-800 text-xs">
                            {lang}: {percentage}%
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Vulnerabilities */}
                    {scanResult.results.vulnerabilities.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold dark-blue-header mb-2">
                          Vulnerabilities (Added to Issues)
                        </h4>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {scanResult.results.vulnerabilities.slice(0, 5).map((vuln, index) => (
                            <div key={index} className="p-2 bg-white rounded border border-blue-100">
                              <div className="flex items-start justify-between mb-1">
                                <div className="flex items-center space-x-1">
                                  <AlertTriangle className="w-3 h-3 text-orange-600" />
                                  <span className="font-medium dark-blue-header text-xs">{vuln.type}</span>
                                </div>
                                <Badge className={`text-xs ${getSeverityColor(vuln.severity)}`}>
                                  {vuln.severity.toUpperCase()}
                                </Badge>
                              </div>
                              <p className="text-xs text-blue-700 mb-1">{vuln.description}</p>
                              <p className="text-xs text-blue-600">
                                {vuln.file}{vuln.line && ` (Line ${vuln.line})`}
                              </p>
                            </div>
                          ))}
                          {scanResult.results.vulnerabilities.length > 5 && (
                            <p className="text-xs text-blue-600 text-center">
                              +{scanResult.results.vulnerabilities.length - 5} more vulnerabilities added to Issues page
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Recommendations/Remediations */}
                    {(scanResult.results.recommendations.length > 0 || scanResult.results.remediations) && (
                      <div>
                        <h4 className="text-sm font-semibold dark-blue-header mb-2">
                          {scanResult.results.remediations ? 'Remediations' : 'Recommendations'} (Added to Solutions)
                        </h4>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {scanResult.results.remediations ? (
                            scanResult.results.remediations.slice(0, 3).map((rem, index) => (
                              <div key={index} className="flex items-start space-x-2 p-2 bg-white rounded border border-blue-100">
                                <CheckCircle className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                                <div>
                                  <span className="text-xs font-medium dark-blue-header">{rem.title}</span>
                                  <p className="text-xs text-blue-700">{rem.description}</p>
                                </div>
                              </div>
                            ))
                          ) : (
                            scanResult.results.recommendations.slice(0, 3).map((rec, index) => (
                              <div key={index} className="flex items-start space-x-2 p-2 bg-white rounded border border-blue-100">
                                <CheckCircle className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                                <span className="text-xs text-blue-700">{rec}</span>
                              </div>
                            ))
                          )}
                          {((scanResult.results.remediations && scanResult.results.remediations.length > 3) ||
                            (!scanResult.results.remediations && scanResult.results.recommendations.length > 3)) && (
                            <p className="text-xs text-blue-600 text-center">
                              +{(scanResult.results.remediations?.length || scanResult.results.recommendations.length) - 3} more solutions added to Solutions page
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : scanResult.status === 'failed' ? (
                  <div className="text-center py-6">
                    <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                    <h4 className="text-sm font-semibold dark-blue-header mb-1">Scan Failed</h4>
                    <p className="text-xs text-red-600">{scanResult.error || 'Unknown error occurred'}</p>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Clock className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                    <h4 className="text-sm font-semibold dark-blue-header mb-1">Scan In Progress</h4>
                    <p className="text-xs text-blue-600">Please wait while we analyze the repository...</p>
                  </div>
                )}
              </div>
            )}

            {/* Scan History */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-2 mb-4">
                <Clock className="w-5 h-5" />
                <h3 className="text-lg font-semibold dark-blue-header">Recent Scans</h3>
              </div>
              
              {scanHistory.length > 0 ? (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {scanHistory.map((scan) => (
                    <div key={scan.id} className="p-2 bg-white rounded border border-blue-100">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-1">
                          <Github className="w-3 h-3 text-blue-600" />
                          <span className="font-medium dark-blue-header text-xs">
                            {scan.repository_url.split('/').slice(-2).join('/')}
                          </span>
                        </div>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            scan.status === 'completed' 
                              ? 'bg-green-100 text-green-800'
                              : scan.status === 'failed'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {scan.status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs text-blue-600">
                        <span>{new Date(scan.scan_date).toLocaleString()}</span>
                        {scan.results && (
                          <span>
                            {scan.results.security_issues} issues • Quality: {scan.results.code_quality_score}%
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Github className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                  <h4 className="text-sm font-semibold dark-blue-header mb-1">No Scans Yet</h4>
                  <p className="text-xs text-blue-600">Start by scanning your first repository above</p>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}