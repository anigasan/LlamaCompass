import os
import json
import requests
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional
import asyncio
from dataclasses import dataclass
from crewai import Agent, Task, Crew, Process, LLM
import yaml
from dotenv import load_dotenv
import time
import re
import logging
import glob
from fastapi import FastAPI, HTTPException, BackgroundTasks, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel, HttpUrl, Field, validator
import uvicorn
from contextlib import asynccontextmanager

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create output directory for saving scan results
OUTPUT_DIR = Path("output")
OUTPUT_DIR.mkdir(exist_ok=True)

class GitHubTool:
    """GitHub tool that supports both public and private repositories"""
    
    def __init__(self, github_token: str = None, debug: bool = True):
        self.debug = debug
        self.github_token = github_token
        
        # Set headers based on whether we have a token
        if github_token:
            self.headers = {
                'Accept': 'application/vnd.github.v3+json',
                'Authorization': f'token {github_token}',
                'User-Agent': 'AI-Security-Scanner/1.0'
            }
            if self.debug:
                logger.info("🔐 Configured with GitHub authentication (private repo access)")
        else:
            self.headers = {
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'AI-Security-Scanner/1.0'
            }
            if self.debug:
                logger.info("🌐 Configured for public repository access only")
    
    def _debug_print(self, message: str):
        """Print debug message if debug mode is enabled"""
        if self.debug:
            logger.info(f"🔍 DEBUG: {message}")
    
    def run(self, repo_url: str, file_path: str = "") -> str:
        """Read file content from GitHub repository"""
        try:
            owner, repo = self._parse_github_url(repo_url)
            self._debug_print(f"Parsed repository: {owner}/{repo}")
            
            # Check repository access
            if not self._verify_repository_access(owner, repo):
                return json.dumps({"error": f"Cannot access repository {owner}/{repo}"})
            
            if file_path:
                content = self._get_file_content(owner, repo, file_path)
                return content
            else:
                files = self._get_all_files(owner, repo)
                self._debug_print(f"Found {len(files)} files total")
                return json.dumps(files, indent=2)
                
        except Exception as e:
            error_msg = f"Error accessing GitHub repository {repo_url}: {str(e)}"
            self._debug_print(f"Exception: {error_msg}")
            return json.dumps({"error": error_msg})
    
    def _parse_github_url(self, repo_url: str) -> tuple:
        """Parse GitHub repository URL"""
        repo_url = repo_url.rstrip('.git')
        if 'github.com' in repo_url:
            parts = repo_url.split('/')
            if len(parts) >= 2:
                return parts[-2], parts[-1]
        raise ValueError(f"Invalid GitHub repository URL: {repo_url}")
    
    def _verify_repository_access(self, owner: str, repo: str) -> bool:
        """Verify access to repository"""
        url = f"https://api.github.com/repos/{owner}/{repo}"
        
        try:
            self._debug_print(f"Checking repository access: {url}")
            response = requests.get(url, headers=self.headers, timeout=15)
            
            self._debug_print(f"Repository check status: {response.status_code}")
            self._debug_print(f"Rate limit remaining: {response.headers.get('X-RateLimit-Remaining')}")
            
            if response.status_code == 200:
                repo_info = response.json()
                self._debug_print(f"Repository found: {repo_info.get('full_name')}")
                self._debug_print(f"Private: {repo_info.get('private')}")
                self._debug_print(f"Size: {repo_info.get('size')} KB")
                self._debug_print(f"Language: {repo_info.get('language', 'Unknown')}")
                return True
            elif response.status_code == 404:
                self._debug_print("Repository not found (404)")
                return False
            elif response.status_code == 403:
                self._debug_print("Access forbidden (403) - check token permissions")
                return False
            else:
                self._debug_print(f"Unexpected response: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            self._debug_print(f"Repository check error: {e}")
            return False
    
    def _get_repo_contents(self, owner: str, repo: str, path: str = "") -> List[Dict]:
        """Get repository contents using GitHub API"""
        url = f"https://api.github.com/repos/{owner}/{repo}/contents/{path}"
        
        try:
            self._debug_print(f"Fetching contents: {url}")
            response = requests.get(url, headers=self.headers, timeout=25)
            
            self._debug_print(f"Contents response: {response.status_code}")
            
            if response.status_code == 200:
                contents = response.json()
                self._debug_print(f"Found {len(contents)} items in {'root' if not path else path}")
                return contents
            elif response.status_code == 404:
                self._debug_print(f"Path not found: {path}")
                return []
            elif response.status_code == 403:
                self._debug_print(f"Rate limited on path: {path} - waiting...")
                time.sleep(2)
                return []
            else:
                self._debug_print(f"Contents error: {response.status_code} - {response.text}")
                return []
                
        except requests.exceptions.Timeout:
            self._debug_print(f"Timeout fetching contents from {path}")
            return []
        except Exception as e:
            self._debug_print(f"Contents fetch error: {e}")
            return []
    
    def _get_file_content(self, owner: str, repo: str, file_path: str) -> str:
        """Get specific file content"""
        contents = self._get_repo_contents(owner, repo, file_path)
        if contents and isinstance(contents, dict) and contents.get('download_url'):
            try:
                self._debug_print(f"Downloading file: {file_path}")
                response = requests.get(contents['download_url'], headers=self.headers, timeout=20)
                if response.status_code == 200:
                    self._debug_print(f"Downloaded {len(response.text)} characters from {file_path}")
                    return response.text
                else:
                    self._debug_print(f"File download failed: {response.status_code}")
            except Exception as e:
                self._debug_print(f"File download error: {e}")
        return ""
    
    def _get_all_files(self, owner: str, repo: str, path: str = "", max_files: int = 25) -> Dict:
        """Recursively get all files from repository with detailed logging"""
        
        self._debug_print(f"Starting repository scan: {owner}/{repo}")
        all_files = {}
        file_count = 0
        
        def scan_directory(current_path="", depth=0):
            nonlocal file_count
            
            if file_count >= max_files:
                self._debug_print(f"Reached file limit ({max_files})")
                return
            
            if depth > 2:
                self._debug_print(f"Reached maximum depth (2) at {current_path}")
                return
                
            try:
                self._debug_print(f"Scanning directory: {current_path if current_path else 'root'} (depth {depth})")
                contents = self._get_repo_contents(owner, repo, current_path)
                
                time.sleep(0.5)  # Rate limiting
                
                for item in contents:
                    if file_count >= max_files:
                        break
                        
                    if item['type'] == 'file':
                        # Skip binary, large files, and common non-code files
                        skip_extensions = ('.png', '.jpg', '.jpeg', '.gif', '.pdf', '.zip', 
                                         '.tar.gz', '.exe', '.bin', '.so', '.dll', '.pyc',
                                         '.class', '.jar', '.war', '.ico', '.svg', '.woff',
                                         '.ttf', '.eot', '.woff2', '.mp4', '.avi', '.mov')
                        
                        skip_files = ('package-lock.json', 'yarn.lock', 'Pipfile.lock', 
                                    'poetry.lock', '.gitignore', '.DS_Store')
                        
                        if (item['name'].lower().endswith(skip_extensions) or 
                            item['name'] in skip_files or
                            item['size'] > 50000):
                            self._debug_print(f"Skipping {item['name']} (binary/large/lock file, {item['size']} bytes)")
                            continue
                        
                        # Prioritize important file types
                        important_extensions = ('.py', '.js', '.java', '.cpp', '.c', '.h', 
                                              '.cs', '.go', '.rs', '.php', '.rb', '.scala',
                                              '.kt', '.swift', '.ts', '.jsx', '.vue',
                                              '.yaml', '.yml', '.json', '.xml', '.sql',
                                              '.sh', '.bash', '.ps1', '.md', '.txt',
                                              '.dockerfile', '.tf', '.hcl')
                        
                        if not any(item['name'].lower().endswith(ext) for ext in important_extensions):
                            self._debug_print(f"Skipping {item['name']} (not a priority file type)")
                            continue
                            
                        # Get file content
                        file_content = ""
                        if item.get('download_url'):
                            try:
                                self._debug_print(f"Downloading content for: {item['path']}")
                                response = requests.get(item['download_url'], 
                                                      headers=self.headers, 
                                                      timeout=15)
                                if response.status_code == 200:
                                    file_content = response.text[:3000]  # Limit to 3KB
                                    self._debug_print(f"✅ Downloaded: {item['path']} ({len(file_content)} chars)")
                                else:
                                    self._debug_print(f"❌ Download failed for {item['path']}: {response.status_code}")
                                
                                time.sleep(0.3)  # Rate limiting
                                
                            except requests.exceptions.Timeout:
                                self._debug_print(f"⏰ Timeout downloading {item['path']}")
                            except Exception as e:
                                self._debug_print(f"❌ Error downloading {item['path']}: {e}")
                        
                        all_files[item['path']] = {
                            'size': item['size'],
                            'content': file_content,
                            'type': item['type'],
                            'download_url': item.get('download_url', ''),
                            'sha': item.get('sha', '')
                        }
                        file_count += 1
                        logger.info(f"📄 Processed: {item['path']} ({file_count}/{max_files})")
                        
                    elif item['type'] == 'dir' and file_count < max_files:
                        skip_dirs = ('.git', '__pycache__', 'node_modules', '.pytest_cache',
                                   'build', 'dist', 'target', '.vscode', '.idea', 'venv',
                                   'env', '.env', 'coverage', '.coverage', 'htmlcov')
                        
                        if item['name'] in skip_dirs:
                            self._debug_print(f"Skipping directory: {item['name']}")
                            continue
                            
                        self._debug_print(f"📁 Entering directory: {item['path']}")
                        scan_directory(item['path'], depth + 1)
                        
            except Exception as e:
                self._debug_print(f"Error scanning directory {current_path}: {e}")
        
        scan_directory(path)
        
        self._debug_print(f"Repository scan complete! Found {len(all_files)} files")
        logger.info(f"✅ Scan complete! Found {len(all_files)} files")
        return all_files

class SecurityScanner:
    """AI Security Scanner for repositories with structured JSON output"""
    
    def __init__(self, 
                 model_name: str = "meta_llama/Llama-4-Maverick-17B-128E-Instruct-FP8",
                 api_key: str = None,
                 temperature: float = 0.1,
                 max_tokens: int = 3000,
                 debug: bool = True):
        """Initialize the security scanner"""
        
        if not api_key:
            api_key = os.environ.get("LLAMA_API_KEY")
        
        if not api_key:
            raise ValueError("LLAMA_API_KEY is required")
        
        self.debug = debug
        
        # Initialize LLM
        logger.info("🔧 Initializing LLM...")
        self.llm = LLM(
            model=model_name,
            api_key=api_key,
            temperature=temperature,
            max_tokens=max_tokens
        )
        logger.info("✅ LLM initialized successfully")
        
        # Load comprehensive security policies
        self.security_policies = self._load_security_policies()
        
        if debug:
            logger.info(f"🛡️  Security scanner initialized")
            logger.info(f"📋 Loaded {sum(len(policies) for policies in self.security_policies.values())} security policies")
    
    def _load_security_policies(self) -> Dict:
        """Load comprehensive security policies for evaluation"""
        return {
            "company": "LlamaCompass",
            "Data": [
                "Ensure encryption of all data in transit with TLS 1.2 or higher",
                "Verify TLS cipher suites include only ECDHE and AES-GCM algorithms",
                "Check that HTTP endpoints redirect all HTTP requests to HTTPS",
                "Confirm certificate rotation occurs before expiration (e.g., every 90 days)",
                "Validate mutual TLS is required for service-to-service communication",
                "Inspect IPsec/VPN tunnels are configured with AES-256-GCM",
                "Ensure database connections enforce SSL mode \"require\"",
                "Check Kafka topics enforce encryption at rest and in transit",
                "Verify all SFTP transfers use SSH with AES-256 cipher",
                "Confirm webhook integrations require HMAC signatures for integrity",
                "Ensure message queues enforce TLS encryption on brokers",
                "Validate that plaintext credentials are never transmitted over APIs",
                "Check backups in transit use encrypted tunnels (e.g., VPN)",
                "Ensure mobile app data sync uses certificate pinning",
                "Verify email transmissions use STARTTLS or SMTPS",
                # ... (truncated for brevity - include all policies from your JSON)
            ],
            "Infra": [
                "Validate S3 buckets have \"Block Public Access\" enabled",
                "Check no S3 bucket ACL includes public-read or public-read/write",
                "Ensure RDS instances do not have the \"publicly accessible\" flag",
                # ... (truncated for brevity)
            ],
            "Network": [
                "Ensure no security group ingress allows 0.0.0.0/0 on port 22",
                "Check security group egress rules do not allow 0.0.0.0/0 for database ports",
                # ... (truncated for brevity)
            ],
            "IAM": [
                "Ensure no IAM policy grants \"Action\": \"*\" on all resources",
                "Check no IAM user has an access key older than 90 days",
                # ... (truncated for brevity)
            ],
            "Privacy": [
                "Ensure no personal data is stored outside approved regions",
                "Check databases containing PII are labeled with a PII tag",
                # ... (truncated for brevity)
            ],
            "Regulatory": [
                "Ensure BAAs are on file for all ePHI-handling vendors",
                "Check HIPAA risk analysis completed within past 12 months",
                # ... (truncated for brevity)
            ]
        }
    
    def scan_repository(self, repo_url: str, github_token: str = None) -> Dict:
        """Scan repository with structured JSON output"""
        
        logger.info(f"🚀 Starting repository scan: {repo_url}")
        
        # Initialize GitHub tool with optional token
        github_tool = GitHubTool(github_token=github_token, debug=self.debug)
        
        # Get repository files
        logger.info("📥 Fetching repository files...")
        repo_files = github_tool.run(repo_url)
        
        # Parse results
        if isinstance(repo_files, str):
            try:
                if repo_files.startswith('{"error"'):
                    error_data = json.loads(repo_files)
                    return {"error": error_data.get("error", "Unknown error")}
                else:
                    repo_files_dict = json.loads(repo_files)
            except json.JSONDecodeError as e:
                return {"error": f"JSON parsing error: {e}"}
        else:
            repo_files_dict = repo_files
        
        if not repo_files_dict:
            return {"error": "No files found in repository"}
        
        logger.info(f"📁 Found {len(repo_files_dict)} files to analyze")
        
        # AI analysis - get structured response
        structured_analysis = self._analyze_with_llm_structured(repo_url, repo_files_dict)
        
        # Create final structured results
        final_results = self._create_structured_report(repo_url, repo_files_dict, structured_analysis)
        
        # Save results to output folder
        saved_file = self._save_scan_results(final_results, repo_url)
        if saved_file:
            final_results['saved_file'] = saved_file
            logger.info(f"💾 Scan results saved to: {saved_file}")
        
        return final_results
    
    def _save_scan_results(self, results: Dict, repo_url: str) -> str:
        """Save scan results to output folder"""
        try:
            # Generate filename
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            repo_name = repo_url.split('/')[-1].replace('.git', '')
            filename = f"scan_{repo_name}_{timestamp}.json"
            filepath = OUTPUT_DIR / filename
            
            # Save JSON file
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(results, f, indent=2, ensure_ascii=False, default=str)
            
            return str(filepath)
            
        except Exception as e:
            logger.error(f"❌ Error saving scan results: {e}")
            return ""
    
    def load_all_scan_results(self) -> List[Dict]:
        """Load all saved scan results from output folder"""
        scan_results = []
        
        try:
            # Find all JSON files in output directory
            json_files = glob.glob(str(OUTPUT_DIR / "scan_*.json"))
            
            for file_path in json_files:
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                        data['_file_path'] = file_path
                        data['_file_name'] = Path(file_path).name
                        scan_results.append(data)
                except Exception as e:
                    logger.error(f"❌ Error loading {file_path}: {e}")
            
            logger.info(f"📂 Loaded {len(scan_results)} scan results for analysis")
            return scan_results
            
        except Exception as e:
            logger.error(f"❌ Error loading scan results: {e}")
            return []
    
    def chat_with_scan_results(self, question: str, scan_files: List[str] = None) -> str:
        """Chat with AI about scan results using Llama model"""
        
        try:
            # Load scan results
            all_results = self.load_all_scan_results()
            
            if not all_results:
                return "No scan results found. Please run some scans first."
            
            # Filter by specific files if requested
            if scan_files:
                all_results = [r for r in all_results if any(sf in r.get('_file_name', '') for sf in scan_files)]
                if not all_results:
                    return f"No scan results found matching files: {scan_files}"
            
            # Create context from scan results
            context = self._create_chat_context(all_results)
            
            # Create chat prompt
            chat_prompt = f"""
            You are a cybersecurity expert assistant analyzing security scan results. 
            
            **Available Scan Data:**
            {context}
            
            **User Question:**
            {question}
            
            **Instructions:**
            - Answer the user's question based on the scan results provided above
            - Be specific and reference actual findings from the scans
            - If asked about trends, compare across multiple scans
            - If asked about specific repositories, focus on those results
            - If the question cannot be answered from the scan data, say so clearly
            - Provide actionable insights and recommendations when relevant
            - Use bullet points and clear formatting for readability
            
            **Response:**
            """
            
            # Get response from Llama model
            response = self.llm.call(chat_prompt)
            
            logger.info(f"💬 Chat response generated for question: {question[:50]}...")
            return response
            
        except Exception as e:
            logger.error(f"❌ Chat error: {e}")
            return f"Error processing chat request: {str(e)}"
    
    def _create_chat_context(self, scan_results: List[Dict]) -> str:
        """Create context summary from scan results for chat"""
        
        context_parts = []
        
        for i, result in enumerate(scan_results, 1):
            metadata = result.get('analysis_metadata', {})
            severity = result.get('severity_summary', {})
            issues = result.get('security_issues', [])
            compliance = result.get('compliance_impact', {})
            
            # Repository info
            repo = metadata.get('repository_analyzed', 'Unknown')
            timestamp = metadata.get('analysis_timestamp', 'Unknown')
            total_issues = metadata.get('total_issues_found', 0)
            files_analyzed = metadata.get('total_files_analyzed', 0)
            
            context_parts.append(f"""
**Scan {i}: {repo}**
- Date: {timestamp}
- Files Analyzed: {files_analyzed}
- Total Issues: {total_issues}
- Severity Breakdown: {severity}
- Risk Level: {compliance.get('immediate_risk_level', 'Unknown')}
""")
            
            # Add top issues if any
            if issues:
                context_parts.append("Top Issues:")
                for issue in issues[:3]:  # Top 3 issues
                    context_parts.append(f"  • {issue.get('title', 'Unknown')} ({issue.get('severity', 'Unknown')}) - {issue.get('file_path', 'Unknown file')}")
            
            context_parts.append("")
        
        return '\n'.join(context_parts)
    
    def _analyze_with_llm_structured(self, repo_url: str, repo_files: Dict) -> Dict:
        """Analyze repository using AI and return structured data"""
        
        logger.info("🤖 Running AI security analysis...")
        
        # Create file summary for analysis
        file_summary = self._create_detailed_file_summary(repo_files)
        
        # Format security policies for prompt
        policies_text = self._format_policies_for_prompt()
        
        prompt = f"""
        You are a cybersecurity expert analyzing the GitHub repository: {repo_url}
        
        **Repository Analysis:**
        Total files analyzed: {len(repo_files)}
        
        **File Contents:**
        {file_summary}
        
        **SECURITY POLICIES TO EVALUATE AGAINST:**
        You must evaluate the repository code against these comprehensive security policies from {self.security_policies['company']}:
        
        {policies_text}
        
        **CRITICAL: You must respond with a valid JSON object in the exact format specified below.**
        
        Analyze the repository for security issues by checking the code against the above security policies and respond with this exact JSON structure:
        
        {{
            "security_issues": [
                {{
                    "issue_id": "unique_identifier",
                    "severity": "CRITICAL|HIGH|MEDIUM|LOW",
                    "category": "hardcoded_secrets|injection_vulnerability|xss|authentication|cryptography|file_operations|network_security|data_encryption|iam_security|privacy_violation|regulatory_compliance|infrastructure_security|other",
                    "title": "Brief issue title",
                    "description": "Detailed description of the security issue",
                    "file_path": "path/to/affected/file",
                    "line_number": "line number if applicable or null",
                    "code_snippet": "relevant code snippet or null",
                    "impact": "Description of potential impact",
                    "remediation": "Specific steps to fix this issue",
                    "policy_reference": "Reference to the specific security policy that was violated"
                }}
            ],
            "severity_summary": {{
                "CRITICAL": 0,
                "HIGH": 0,
                "MEDIUM": 0,
                "LOW": 0
            }},
            "code_frameworks": {{
                "data_encryption_issues": 0,
                "infrastructure_security_issues": 0,
                "network_security_issues": 0,
                "iam_security_issues": 0,
                "privacy_issues": 0,
                "regulatory_compliance_issues": 0,
                "authentication_issues": 0,
                "authorization_issues": 0,
                "input_validation_issues": 0,
                "cryptography_issues": 0,
                "secrets_management_issues": 0,
                "dependency_issues": 0,
                "configuration_issues": 0
            }},
            "compliance_impact": {{
                "owasp_violations": 0,
                "security_misconfigurations": 0,
                "policy_violations": 0,
                "immediate_risk_level": "CRITICAL|HIGH|MEDIUM|LOW"
            }},
            "immediate_actions": [
                "List of urgent actions needed based on policy violations"
            ],
            "general_recommendations": [
                "List of general security improvements aligned with policies"
            ]
        }}
        
        Respond ONLY with the JSON object, no additional text.
        """
        
        try:
            response = self.llm.call(prompt)
            logger.info("✅ AI security analysis completed")
            
            # Try to parse the JSON response
            try:
                clean_response = response.strip()
                if clean_response.startswith('```json'):
                    clean_response = clean_response.replace('```json', '').replace('```', '').strip()
                
                structured_data = json.loads(clean_response)
                logger.info("✅ Successfully parsed structured analysis")
                return structured_data
                
            except json.JSONDecodeError as e:
                logger.error(f"❌ Failed to parse JSON response: {e}")
                return self._get_empty_structured_analysis()
                
        except Exception as e:
            logger.error(f"❌ AI analysis failed: {e}")
            return self._get_empty_structured_analysis()
    
    def _format_policies_for_prompt(self) -> str:
        """Format security policies for inclusion in prompt"""
        formatted_policies = []
        
        for category, policies in self.security_policies.items():
            if category != "company":
                formatted_policies.append(f"\n**{category.upper()} SECURITY POLICIES:**")
                for i, policy in enumerate(policies[:10], 1):  # Limit for prompt size
                    formatted_policies.append(f"{i}. {policy}")
                formatted_policies.append("")
        
        return '\n'.join(formatted_policies)
    
    def _get_empty_structured_analysis(self) -> Dict:
        """Return empty structured analysis when LLM fails"""
        return {
            "security_issues": [],
            "severity_summary": {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0},
            "code_frameworks": {
                "data_encryption_issues": 0,
                "infrastructure_security_issues": 0,
                "network_security_issues": 0,
                "iam_security_issues": 0,
                "privacy_issues": 0,
                "regulatory_compliance_issues": 0,
                "authentication_issues": 0,
                "authorization_issues": 0,
                "input_validation_issues": 0,
                "cryptography_issues": 0,
                "secrets_management_issues": 0,
                "dependency_issues": 0,
                "configuration_issues": 0
            },
            "compliance_impact": {
                "owasp_violations": 0,
                "security_misconfigurations": 0,
                "policy_violations": 0,
                "immediate_risk_level": "MEDIUM"
            },
            "immediate_actions": [],
            "general_recommendations": [
                "Implement secure coding practices aligned with security policies",
                "Ensure all data in transit uses TLS 1.2 or higher encryption"
            ]
        }
    
    def _create_structured_report(self, repo_url: str, repo_files: Dict, analysis_data: Dict) -> Dict:
        """Create the final structured security report"""
        
        total_issues = len(analysis_data.get('security_issues', []))
        
        severity_counts = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0}
        for issue in analysis_data.get('security_issues', []):
            severity = issue.get('severity', 'MEDIUM')
            if severity in severity_counts:
                severity_counts[severity] += 1
        
        policy_violations_by_category = {}
        for issue in analysis_data.get('security_issues', []):
            category = issue.get('category', 'other')
            policy_violations_by_category[category] = policy_violations_by_category.get(category, 0) + 1
        
        structured_report = {
            "analysis_metadata": {
                "analyzer_type": "GitHub Repository Security Analyzer",
                "repository_analyzed": repo_url,
                "analysis_timestamp": datetime.now().isoformat(),
                "total_issues_found": total_issues,
                "total_files_analyzed": len(repo_files),
                "analyzer_version": "1.0.0",
                "ai_model": getattr(self.llm, 'model', 'Unknown'),
                "scan_scope": "repository",
                "security_policies_applied": {
                    "policy_source": self.security_policies.get('company', 'LlamaCompass'),
                    "policy_categories": [cat for cat in self.security_policies.keys() if cat != 'company'],
                    "total_policies_evaluated": sum(len(policies) for cat, policies in self.security_policies.items() if cat != 'company')
                }
            },
            "severity_summary": severity_counts,
            "security_issues": analysis_data.get('security_issues', []),
            "code_frameworks": analysis_data.get('code_frameworks', {}),
            "compliance_impact": analysis_data.get('compliance_impact', {
                "owasp_violations": 0,
                "security_misconfigurations": 0,
                "policy_violations": total_issues,
                "immediate_risk_level": "MEDIUM"
            }),
            "recommendations": {
                "immediate_actions": analysis_data.get('immediate_actions', []),
                "general_recommendations": analysis_data.get('general_recommendations', [])
            },
            "policy_analysis": {
                "violations_by_category": policy_violations_by_category,
                "policy_coverage": {
                    "data_encryption": len([p for p in self.security_policies.get('Data', [])]),
                    "infrastructure": len([p for p in self.security_policies.get('Infra', [])]),
                    "network_security": len([p for p in self.security_policies.get('Network', [])]),
                    "iam_security": len([p for p in self.security_policies.get('IAM', [])]),
                    "privacy_protection": len([p for p in self.security_policies.get('Privacy', [])]),
                    "regulatory_compliance": len([p for p in self.security_policies.get('Regulatory', [])])
                }
            }
        }
        
        return structured_report
    
    def _create_detailed_file_summary(self, repo_files: Dict, max_files: int = 10) -> str:
        """Create detailed summary of repository files for security analysis"""
        summaries = []
        
        # Prioritize security-relevant files
        priority_patterns = [
            ('Authentication/Auth', lambda f: any(word in f.lower() for word in ['auth', 'login', 'token', 'jwt', 'oauth'])),
            ('Configuration', lambda f: any(word in f.lower() for word in ['config', 'settings', 'env', '.yaml', '.yml', '.json'])),
            ('Security', lambda f: any(word in f.lower() for word in ['security', 'crypto', 'encrypt', 'hash', 'password'])),
        ]
        
        categorized_files = {category: [] for category, _ in priority_patterns}
        uncategorized_files = []
        
        # Categorize files
        for file_path, file_info in repo_files.items():
            categorized = False
            for category, pattern_func in priority_patterns:
                if pattern_func(file_path):
                    categorized_files[category].append((file_path, file_info))
                    categorized = True
                    break
            if not categorized:
                uncategorized_files.append((file_path, file_info))
        
        file_count = 0
        
        # Add categorized files first
        for category, files in categorized_files.items():
            if files and file_count < max_files:
                summaries.append(f"\n**{category} Files:**")
                for file_path, file_info in files[:2]:  # Max 2 per category
                    if file_count >= max_files:
                        break
                    content = file_info.get('content', '')[:400]
                    file_size = file_info.get('size', 0)
                    
                    summary = f"""
File: {file_path} ({file_size} bytes)
Content Preview: {content[:300]}{'...' if len(content) > 300 else ''}
"""
                    summaries.append(summary)
                    file_count += 1
        
        # Add some uncategorized files
        if uncategorized_files and file_count < max_files:
            summaries.append(f"\n**Other Important Files:**")
            for file_path, file_info in uncategorized_files[:max_files - file_count]:
                content = file_info.get('content', '')[:400]
                file_size = file_info.get('size', 0)
                
                summary = f"""
File: {file_path} ({file_size} bytes)
Content Preview: {content[:300]}{'...' if len(content) > 300 else ''}
"""
                summaries.append(summary)
                file_count += 1
        
        return '\n'.join(summaries)

# Pydantic models for API
class ScanRequest(BaseModel):
    repository_url: HttpUrl = Field(..., description="GitHub repository URL to scan")
    github_token: Optional[str] = Field(None, description="GitHub access token for private repositories")
    
    @validator('repository_url')
    def validate_github_url(cls, v):
        if 'github.com' not in str(v):
            raise ValueError('Only GitHub repositories are supported')
        return v

class ScanResponse(BaseModel):
    success: bool
    scan_id: Optional[str] = None
    analysis_metadata: Optional[Dict] = None
    severity_summary: Optional[Dict] = None
    security_issues: Optional[List[Dict]] = None
    compliance_impact: Optional[Dict] = None
    recommendations: Optional[Dict] = None
    policy_analysis: Optional[Dict] = None
    saved_file: Optional[str] = None
    error: Optional[str] = None

class ChatRequest(BaseModel):
    question: str = Field(..., description="Question to ask about scan results", min_length=1)
    scan_files: Optional[List[str]] = Field(None, description="Optional: specific scan files to query (if not provided, uses ALL scan files)")

class ChatResponse(BaseModel):
    success: bool
    answer: Optional[str] = None
    context_files: Optional[List[str]] = None
    total_files_used: Optional[int] = None
    error: Optional[str] = None

class FileListResponse(BaseModel):
    success: bool
    files: Optional[List[Dict]] = None
    total_files: Optional[int] = None
    error: Optional[str] = None

class HealthResponse(BaseModel):
    status: str
    timestamp: str
    version: str
    output_directory: str
    total_scan_files: int

# Global scanner instance
scanner = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize scanner on startup"""
    global scanner
    try:
        logger.info("🚀 Initializing Security Scanner...")
        scanner = SecurityScanner()
        logger.info("✅ Security Scanner initialized successfully")
        yield
    except Exception as e:
        logger.error(f"❌ Failed to initialize scanner: {e}")
        raise
    finally:
        logger.info("🔄 Shutting down Security Scanner...")

# FastAPI app
app = FastAPI(
    title="LlamaCompass",
    description="Llama powered security and agent performance analysis",
    version="1.0.0",
    lifespan=lifespan
)

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    # Count scan files
    scan_files = glob.glob(str(OUTPUT_DIR / "scan_*.json"))
    
    return HealthResponse(
        status="healthy",
        timestamp=datetime.now().isoformat(),
        version="1.0.0",
        output_directory=str(OUTPUT_DIR),
        total_scan_files=len(scan_files)
    )

@app.post("/scan", response_model=ScanResponse)
async def scan_repository(request: ScanRequest):
    """
    Scan a GitHub repository for security issues
    
    - **repository_url**: GitHub repository URL (https://github.com/owner/repo)
    - **github_token**: Optional GitHub token for private repositories
    """
    try:
        logger.info(f"🎯 Received scan request for: {request.repository_url}")
        
        if not scanner:
            raise HTTPException(status_code=500, detail="Scanner not initialized")
        
        # Perform the scan
        results = scanner.scan_repository(
            repo_url=str(request.repository_url),
            github_token=request.github_token
        )
        
        # Check for errors
        if 'error' in results:
            logger.error(f"❌ Scan failed: {results['error']}")
            return ScanResponse(
                success=False,
                error=results['error']
            )
        
        # Generate scan ID
        scan_id = f"scan_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{hash(str(request.repository_url)) % 10000}"
        
        logger.info(f"✅ Scan completed successfully: {scan_id}")
        
        return ScanResponse(
            success=True,
            scan_id=scan_id,
            analysis_metadata=results.get('analysis_metadata'),
            severity_summary=results.get('severity_summary'),
            security_issues=results.get('security_issues'),
            compliance_impact=results.get('compliance_impact'),
            recommendations=results.get('recommendations'),
            policy_analysis=results.get('policy_analysis'),
            saved_file=results.get('saved_file')
        )
        
    except Exception as e:
        logger.error(f"❌ Scan error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Scan failed: {str(e)}")

@app.post("/chat", response_model=ChatResponse)
async def chat_with_scans(request: ChatRequest):
    """
    Chat with AI about ALL previous scan results
    
    - **question**: Your question about the security scan results
    - **scan_files**: Optional list to filter to specific scan files (if not provided, uses ALL scan files)
    
    By default, the AI will analyze ALL saved scan results to answer your question.
    Only specify scan_files if you want to limit the analysis to specific scans.
    """
    try:
        logger.info(f"💬 Received chat request: {request.question[:100]}...")
        
        if not scanner:
            raise HTTPException(status_code=500, detail="Scanner not initialized")
        
        # Get chat response (uses ALL files by default)
        answer = scanner.chat_with_scan_results(
            question=request.question,
            scan_files=request.scan_files
        )
        
        # Get context files that were used
        all_results = scanner.load_all_scan_results()
        context_files = [r.get('_file_name', 'unknown') for r in all_results]
        
        # Filter context files if specific files were requested
        if request.scan_files:
            context_files = [f for f in context_files if any(sf in f for sf in request.scan_files)]
            logger.info(f"🔍 Filtered to specific scan files: {len(context_files)} files")
        else:
            logger.info(f"📊 Using ALL scan files: {len(context_files)} files")
        
        logger.info(f"✅ Chat response generated successfully")
        
        return ChatResponse(
            success=True,
            answer=answer,
            context_files=context_files,
            total_files_used=len(context_files)
        )
        
    except Exception as e:
        logger.error(f"❌ Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")

@app.get("/files", response_model=FileListResponse)
async def list_scan_files():
    """
    List all saved scan result files
    """
    try:
        logger.info("📂 Listing scan files...")
        
        # Find all scan files
        scan_files = glob.glob(str(OUTPUT_DIR / "scan_*.json"))
        
        file_info = []
        for file_path in scan_files:
            try:
                stat = Path(file_path).stat()
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    metadata = data.get('analysis_metadata', {})
                
                file_info.append({
                    "filename": Path(file_path).name,
                    "filepath": file_path,
                    "size_bytes": stat.st_size,
                    "created_date": datetime.fromtimestamp(stat.st_ctime).isoformat(),
                    "repository": metadata.get('repository_analyzed', 'Unknown'),
                    "total_issues": metadata.get('total_issues_found', 0),
                    "files_analyzed": metadata.get('total_files_analyzed', 0),
                    "scan_timestamp": metadata.get('analysis_timestamp', 'Unknown')
                })
            except Exception as e:
                logger.error(f"❌ Error reading file {file_path}: {e}")
        
        # Sort by creation date (newest first)
        file_info.sort(key=lambda x: x['created_date'], reverse=True)
        
        logger.info(f"✅ Found {len(file_info)} scan files")
        
        return FileListResponse(
            success=True,
            files=file_info,
            total_files=len(file_info)
        )
        
    except Exception as e:
        logger.error(f"❌ File listing error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"File listing failed: {str(e)}")

@app.delete("/files/{filename}")
async def delete_scan_file(filename: str):
    """
    Delete a specific scan result file
    """
    try:
        file_path = OUTPUT_DIR / filename
        
        if not file_path.exists():
            raise HTTPException(status_code=404, detail=f"File {filename} not found")
        
        if not filename.startswith('scan_') or not filename.endswith('.json'):
            raise HTTPException(status_code=400, detail="Only scan result files can be deleted")
        
        file_path.unlink()
        logger.info(f"🗑️ Deleted scan file: {filename}")
        
        return {"success": True, "message": f"File {filename} deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ File deletion error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"File deletion failed: {str(e)}")

@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "GitHub Security Scanner API with Chat",
        "version": "1.0.0",
        "features": [
            "AI-powered security scanning of GitHub repositories",
            "Automatic saving of scan results to JSON files",
            "Chat functionality to query ALL scan results using AI",
            "File management for scan results"
        ],
        "endpoints": {
            "scan": "POST /scan - Scan a GitHub repository",
            "chat": "POST /chat - Chat with AI about ALL scan results", 
            "files": "GET /files - List all saved scan files",
            "delete": "DELETE /files/{filename} - Delete a scan file",
            "health": "GET /health - Health check",
            "docs": "GET /docs - API documentation"
        },
        "chat_info": {
            "default_behavior": "Uses ALL saved scan files for context",
            "filtering": "Optional: specify scan_files to limit to specific scans",
            "examples": [
                "What are the most critical issues across all repositories?",
                "Which repository has the most security problems?",
                "Show me trends in security issues over time"
            ]
        },
        "output_directory": str(OUTPUT_DIR)
    }

if __name__ == "__main__":
    # Run the FastAPI app
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )