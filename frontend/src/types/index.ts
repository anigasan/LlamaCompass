export interface DashboardMetrics {
  totalIssues: number;
  openIssues: number;
  resolvedIssues: number;
  activeAgents: number;
  totalAgents: number;
  avgResolutionTime: string;
  resolutionTrend: number;
  customerSatisfaction: number;
  totalFeedback: number;
  weeklyResolved: number;
  avgResponseTime: string;
  agentEfficiency: number;
  recentIssues: {
    id: string;
    title: string;
    category: string;
    priority: string;
    timeAgo: string;
  }[];
  // GitHub scan summary
  githubSummary?: {
    totalScans: number;
    criticalIssues: number;
    highIssues: number;
    avgQualityScore: number;
    lastScanDate?: string;
  };
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  assignee?: string;
  createdAt: string;
  // GitHub specific fields
  source?: 'github' | 'manual';
  repository?: string;
  file?: string;
  line?: number;
  scanId?: string;
}

export interface Solution {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  effectiveness: number;
  usageCount: number;
  updatedAt: string;
  // GitHub specific fields
  source?: 'github' | 'manual';
  repository?: string;
  scanId?: string;
}

export interface AgentPerformance {
  id: string;
  agentName: string;
  email: string;
  issuesResolved: number;
  activeTickets: number;
  averageResolutionTime: string;
  customerSatisfaction: number;
  efficiency: number;
  // AI Agent failure percentages
  specificationIssues: number;
  interAgentAlignment: number;
  taskVerification: number;
}

export interface GitHubScanRequest {
  repository_url: string;
  access_token?: string;
}

export interface GitHubVulnerability {
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: string;
  description: string;
  file: string;
  line?: number;
  remediation?: string;
}

export interface GitHubScanResult {
  id: string;
  repository_url: string;
  scan_date: string;
  status: 'pending' | 'completed' | 'failed';
  results?: {
    total_files: number;
    languages: Record<string, number>;
    security_issues: number;
    code_quality_score: number;
    dependencies: number;
    vulnerabilities: GitHubVulnerability[];
    recommendations: string[];
    remediations?: Array<{
      id: string;
      title: string;
      description: string;
      category: string;
      tags: string[];
      effectiveness: number;
      applies_to: string[];
    }>;
  };
  error?: string;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

// Store for GitHub scan data
export interface GitHubDataStore {
  scans: GitHubScanResult[];
  issues: Issue[];
  solutions: Solution[];
  lastUpdated: string;
}