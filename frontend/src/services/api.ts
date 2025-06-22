import type { 
  DashboardMetrics, 
  Issue, 
  Solution, 
  AgentPerformance, 
  GitHubScanRequest, 
  GitHubScanResult, 
  GitHubDataStore,
  ApiResponse 
} from '@/types';

// In-memory store for GitHub scan data
let githubDataStore: GitHubDataStore = {
  scans: [],
  issues: [],
  solutions: [],
  lastUpdated: new Date().toISOString()
};

// Mock data for development (reduced to minimal)
const mockDashboardMetrics: DashboardMetrics = {
  totalIssues: 0,
  openIssues: 0,
  resolvedIssues: 0,
  activeAgents: 6,
  totalAgents: 6,
  avgResolutionTime: '1.4h',
  resolutionTrend: -8,
  customerSatisfaction: 94,
  totalFeedback: 156,
  weeklyResolved: 0,
  avgResponseTime: '12m',
  agentEfficiency: 87,
  recentIssues: []
};

// Minimal mock issues (will be replaced by GitHub data)
const mockIssues: Issue[] = [];

// Minimal mock solutions (will be replaced by GitHub data)
const mockSolutions: Solution[] = [];

// Updated AI Agent Performance data with failure percentages
const mockAgentPerformance: AgentPerformance[] = [
  {
    id: '1',
    agentName: 'Appworld',
    email: 'appworld@ai-agents.com',
    issuesResolved: 142,
    activeTickets: 8,
    averageResolutionTime: '1.2h',
    customerSatisfaction: 4.2,
    efficiency: 78,
    specificationIssues: 12,
    interAgentAlignment: 8,
    taskVerification: 15
  },
  {
    id: '2',
    agentName: 'HyperAgent',
    email: 'hyperagent@ai-agents.com',
    issuesResolved: 189,
    activeTickets: 3,
    averageResolutionTime: '0.9h',
    customerSatisfaction: 4.6,
    efficiency: 85,
    specificationIssues: 7,
    interAgentAlignment: 5,
    taskVerification: 9
  },
  {
    id: '3',
    agentName: 'AG2',
    email: 'ag2@ai-agents.com',
    issuesResolved: 156,
    activeTickets: 12,
    averageResolutionTime: '1.8h',
    customerSatisfaction: 4.1,
    efficiency: 72,
    specificationIssues: 18,
    interAgentAlignment: 22,
    taskVerification: 14
  },
  {
    id: '4',
    agentName: 'ChatDev',
    email: 'chatdev@ai-agents.com',
    issuesResolved: 203,
    activeTickets: 6,
    averageResolutionTime: '1.1h',
    customerSatisfaction: 4.5,
    efficiency: 88,
    specificationIssues: 6,
    interAgentAlignment: 4,
    taskVerification: 8
  },
  {
    id: '5',
    agentName: 'MetaGPT',
    email: 'metagpt@ai-agents.com',
    issuesResolved: 167,
    activeTickets: 9,
    averageResolutionTime: '1.5h',
    customerSatisfaction: 4.3,
    efficiency: 81,
    specificationIssues: 11,
    interAgentAlignment: 13,
    taskVerification: 10
  },
  {
    id: '6',
    agentName: 'OpenManus',
    email: 'openmanus@ai-agents.com',
    issuesResolved: 134,
    activeTickets: 15,
    averageResolutionTime: '2.1h',
    customerSatisfaction: 3.9,
    efficiency: 69,
    specificationIssues: 21,
    interAgentAlignment: 25,
    taskVerification: 19
  }
];

// Process GitHub scan results and convert to issues and solutions
const processGitHubScanResults = (scanResult: GitHubScanResult): void => {
  if (scanResult.status !== 'completed' || !scanResult.results) {
    console.log('Scan not completed or no results:', scanResult.status);
    return;
  }

  const repositoryName = scanResult.repository_url.split('/').slice(-2).join('/');
  console.log('Processing scan results for repository:', repositoryName);

  // Convert vulnerabilities to issues
  const newIssues: Issue[] = scanResult.results.vulnerabilities.map((vuln, index) => ({
    id: `github-${scanResult.id}-issue-${index}`,
    title: `${vuln.type}`,
    description: vuln.description,
    status: 'open' as const,
    priority: vuln.severity as 'low' | 'medium' | 'high' | 'critical',
    category: 'Security',
    createdAt: scanResult.scan_date,
    source: 'github' as const,
    repository: repositoryName,
    file: vuln.file,
    line: vuln.line,
    scanId: scanResult.id
  }));

  console.log(`Created ${newIssues.length} issues from vulnerabilities`);

  // Convert remediations to solutions
  let newSolutions: Solution[] = [];
  
  if (scanResult.results.remediations && scanResult.results.remediations.length > 0) {
    newSolutions = scanResult.results.remediations.map((remediation) => ({
      id: `github-${scanResult.id}-solution-${remediation.id}`,
      title: remediation.title,
      description: remediation.description,
      category: remediation.category,
      tags: remediation.tags,
      effectiveness: remediation.effectiveness,
      usageCount: 0,
      updatedAt: scanResult.scan_date,
      source: 'github' as const,
      repository: repositoryName,
      scanId: scanResult.id
    }));
    console.log(`Created ${newSolutions.length} solutions from remediations`);
  }

  // Convert recommendations to solutions if no remediations exist
  if (newSolutions.length === 0 && scanResult.results.recommendations && scanResult.results.recommendations.length > 0) {
    newSolutions = scanResult.results.recommendations.map((rec, index) => ({
      id: `github-rec-${scanResult.id}-${index}`,
      title: `Recommendation: ${rec.substring(0, 50)}${rec.length > 50 ? '...' : ''}`,
      description: rec,
      category: 'Best Practice',
      tags: ['recommendation', 'github', 'security'],
      effectiveness: 75,
      usageCount: 0,
      updatedAt: scanResult.scan_date,
      source: 'github' as const,
      repository: repositoryName,
      scanId: scanResult.id
    }));
    console.log(`Created ${newSolutions.length} solutions from recommendations`);
  }

  // Update the data store
  githubDataStore.scans.push(scanResult);
  githubDataStore.issues.push(...newIssues);
  githubDataStore.solutions.push(...newSolutions);
  githubDataStore.lastUpdated = new Date().toISOString();

  console.log('Updated GitHub data store:', {
    totalScans: githubDataStore.scans.length,
    totalIssues: githubDataStore.issues.length,
    totalSolutions: githubDataStore.solutions.length
  });

  // Keep only the last 10 scans to prevent memory issues
  if (githubDataStore.scans.length > 10) {
    const oldestScan = githubDataStore.scans.shift();
    if (oldestScan) {
      // Remove issues and solutions from the oldest scan
      githubDataStore.issues = githubDataStore.issues.filter(issue => issue.scanId !== oldestScan.id);
      githubDataStore.solutions = githubDataStore.solutions.filter(solution => solution.scanId !== oldestScan.id);
      console.log('Removed oldest scan data to maintain limit');
    }
  }
};

// Calculate GitHub summary for dashboard
const calculateGitHubSummary = () => {
  const githubIssues = githubDataStore.issues;
  const criticalIssues = githubIssues.filter(issue => issue.priority === 'critical').length;
  const highIssues = githubIssues.filter(issue => issue.priority === 'high').length;
  
  const avgQualityScore = githubDataStore.scans.length > 0 
    ? Math.round(githubDataStore.scans.reduce((sum, scan) => 
        sum + (scan.results?.code_quality_score || 0), 0) / githubDataStore.scans.length)
    : 0;

  const lastScanDate = githubDataStore.scans.length > 0 
    ? githubDataStore.scans[githubDataStore.scans.length - 1].scan_date
    : undefined;

  return {
    totalScans: githubDataStore.scans.length,
    criticalIssues,
    highIssues,
    avgQualityScore,
    lastScanDate
  };
};

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const apiService = {
  async getDashboardMetrics(): Promise<ApiResponse<DashboardMetrics>> {
    await delay(500);
    
    const githubSummary = calculateGitHubSummary();
    
    // Create recent issues from GitHub data
    const githubRecentIssues = githubDataStore.issues
      .slice(-5) // Get last 5 issues
      .map(issue => ({
        id: issue.id,
        title: issue.title,
        category: issue.category,
        priority: issue.priority.charAt(0).toUpperCase() + issue.priority.slice(1),
        timeAgo: 'GitHub scan'
      }));

    const combinedMetrics: DashboardMetrics = {
      ...mockDashboardMetrics,
      totalIssues: githubDataStore.issues.length,
      openIssues: githubDataStore.issues.filter(i => i.status === 'open').length,
      resolvedIssues: githubDataStore.issues.filter(i => i.status === 'resolved').length,
      weeklyResolved: githubDataStore.issues.filter(i => i.status === 'resolved').length,
      githubSummary: githubSummary.totalScans > 0 ? githubSummary : undefined,
      recentIssues: githubRecentIssues
    };

    return {
      data: combinedMetrics,
      success: true,
      message: 'Dashboard metrics retrieved successfully'
    };
  },

  async getIssues(): Promise<ApiResponse<Issue[]>> {
    await delay(700);
    
    // Return only GitHub issues (no mock data)
    return {
      data: githubDataStore.issues,
      success: true,
      message: 'Issues retrieved successfully'
    };
  },

  async getSolutions(): Promise<ApiResponse<Solution[]>> {
    await delay(600);
    
    // Return only GitHub solutions (no mock data)
    return {
      data: githubDataStore.solutions,
      success: true,
      message: 'Solutions retrieved successfully'
    };
  },

  async getAgentPerformance(): Promise<ApiResponse<AgentPerformance[]>> {
    await delay(800);
    return {
      data: mockAgentPerformance,
      success: true,
      message: 'AI agent performance data retrieved successfully'
    };
  },

  async scanGitHubRepository(request: GitHubScanRequest): Promise<ApiResponse<GitHubScanResult>> {
    try {
      console.log('Calling real GitHub scan API for:', request.repository_url);
      
      const response = await fetch('http://localhost:8000/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        mode: 'cors',
        body: JSON.stringify(request),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        let errorText;
        try {
          errorText = await response.text();
        } catch (e) {
          errorText = `HTTP ${response.status} ${response.statusText}`;
        }
        console.error('API response error:', response.status, errorText);
        throw new Error(`API Error ${response.status}: ${errorText || response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response received:', text);
        throw new Error('Server returned non-JSON response');
      }

      const data = await response.json();
      console.log('Received scan result:', data);
      
      // Validate the response structure
      if (!data.id || !data.repository_url || !data.status) {
        console.error('Invalid response structure:', data);
        throw new Error('Invalid response format from scan service');
      }
      
      // Process the real scan results and update our data store
      processGitHubScanResults(data);
      
      return {
        data,
        success: true,
        message: 'Repository scan completed successfully'
      };
    } catch (error) {
      console.error('GitHub scan failed:', error);
      
      let errorMessage = 'Failed to scan repository';
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        errorMessage = 'Unable to connect to the scan service. Please ensure the API server is running on localhost:8000 and CORS is properly configured.';
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      return {
        data: {} as GitHubScanResult,
        success: false,
        message: errorMessage
      };
    }
  },

  async getScanHistory(): Promise<ApiResponse<GitHubScanResult[]>> {
    await delay(500);
    return {
      data: githubDataStore.scans,
      success: true,
      message: 'Scan history retrieved successfully'
    };
  },

  // New method to get GitHub data store for debugging
  async getGitHubDataStore(): Promise<ApiResponse<GitHubDataStore>> {
    return {
      data: githubDataStore,
      success: true,
      message: 'GitHub data store retrieved successfully'
    };
  }
};