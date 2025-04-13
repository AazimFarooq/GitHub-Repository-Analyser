"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { TreeNode } from "@/types/github"
import { AlertTriangle, CheckCircle, Zap, Lightbulb, TrendingUp, BarChart, Activity, ArrowRight } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

type PredictiveCodeHealthProps = {
  tree: TreeNode
}

type CodeIssue = {
  id: string
  filePath: string
  fileName: string
  issueType: "complexity" | "duplication" | "maintainability" | "security" | "performance"
  severity: "critical" | "high" | "medium" | "low"
  title: string
  description: string
  suggestion: string
  impact: number // 0-100
  effort: number // 0-100
  aiConfidence: number // 0-100
}

type CodeMetric = {
  name: string
  value: number
  target: number
  description: string
  trend: "improving" | "stable" | "declining"
}

export function PredictiveCodeHealth({ tree }: PredictiveCodeHealthProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [activeTab, setActiveTab] = useState<"issues" | "metrics" | "predictions">("issues")
  const [codeIssues, setCodeIssues] = useState<CodeIssue[]>([])
  const [codeMetrics, setCodeMetrics] = useState<CodeMetric[]>([])
  const [selectedSeverity, setSelectedSeverity] = useState<string | null>(null)
  const [selectedIssueType, setSelectedIssueType] = useState<string | null>(null)
  const [predictedTrends, setPredictedTrends] = useState<any[]>([])
  const [healthScore, setHealthScore] = useState(0)
  const [expandedIssue, setExpandedIssue] = useState<string | null>(null)

  // Start analysis when component mounts
  useEffect(() => {
    if (!tree) return

    startAnalysis()
  }, [tree])

  // Simulate code analysis
  const startAnalysis = () => {
    setIsAnalyzing(true)
    setAnalysisProgress(0)

    // Simulate analysis progress
    const interval = setInterval(() => {
      setAnalysisProgress((prev) => {
        const newProgress = prev + Math.random() * 5
        if (newProgress >= 100) {
          clearInterval(interval)
          generateAnalysisResults()
          return 100
        }
        return newProgress
      })
    }, 100)
  }

  // Generate simulated analysis results
  const generateAnalysisResults = () => {
    // Extract file nodes
    const fileNodes: TreeNode[] = []
    const extractFiles = (node: TreeNode) => {
      if (node.type === "blob") {
        fileNodes.push(node)
      } else if (node.children) {
        node.children.forEach(extractFiles)
      }
    }
    extractFiles(tree)

    // Generate simulated code issues
    const issues: CodeIssue[] = []
    const issueTypes: ("complexity" | "duplication" | "maintainability" | "security" | "performance")[] = [
      "complexity",
      "duplication",
      "maintainability",
      "security",
      "performance",
    ]

    const severities: ("critical" | "high" | "medium" | "low")[] = ["critical", "high", "medium", "low"]

    // Generate 15-25 random issues
    const issueCount = Math.floor(Math.random() * 10) + 15

    for (let i = 0; i < issueCount; i++) {
      const randomFile = fileNodes[Math.floor(Math.random() * fileNodes.length)]
      const issueType = issueTypes[Math.floor(Math.random() * issueTypes.length)]
      const severity = severities[Math.floor(Math.random() * severities.length)]

      issues.push({
        id: `issue-${i}`,
        filePath: randomFile.path,
        fileName: randomFile.name,
        issueType,
        severity,
        title: generateIssueTitle(issueType),
        description: generateIssueDescription(issueType),
        suggestion: generateIssueSuggestion(issueType),
        impact: Math.floor(Math.random() * 100),
        effort: Math.floor(Math.random() * 100),
        aiConfidence: 70 + Math.floor(Math.random() * 30),
      })
    }

    // Generate code metrics
    const metrics: CodeMetric[] = [
      {
        name: "Code Complexity",
        value: Math.floor(Math.random() * 50) + 50,
        target: 70,
        description: "Average cyclomatic complexity across all functions",
        trend: Math.random() > 0.5 ? "improving" : "declining",
      },
      {
        name: "Test Coverage",
        value: Math.floor(Math.random() * 40) + 40,
        target: 80,
        description: "Percentage of code covered by automated tests",
        trend: Math.random() > 0.7 ? "improving" : "declining",
      },
      {
        name: "Code Duplication",
        value: Math.floor(Math.random() * 30) + 5,
        target: 5,
        description: "Percentage of duplicated code blocks",
        trend: Math.random() > 0.6 ? "improving" : "declining",
      },
      {
        name: "Documentation",
        value: Math.floor(Math.random() * 50) + 30,
        target: 90,
        description: "Percentage of public APIs with documentation",
        trend: Math.random() > 0.5 ? "stable" : "declining",
      },
      {
        name: "Technical Debt",
        value: Math.floor(Math.random() * 40) + 30,
        target: 20,
        description: "Estimated hours to fix all known issues",
        trend: Math.random() > 0.7 ? "stable" : "declining",
      },
    ]

    // Generate predicted trends
    const trends = [
      {
        name: "Maintenance Effort",
        current: Math.floor(Math.random() * 20) + 10,
        predicted: Math.floor(Math.random() * 30) + 20,
        unit: "hours/week",
        increasing: true,
        description: "Predicted maintenance effort will increase if issues are not addressed",
      },
      {
        name: "Bug Frequency",
        current: Math.floor(Math.random() * 5) + 1,
        predicted: Math.floor(Math.random() * 10) + 5,
        unit: "bugs/month",
        increasing: true,
        description: "Predicted increase in bug frequency based on code health trends",
      },
      {
        name: "Development Velocity",
        current: Math.floor(Math.random() * 20) + 30,
        predicted: Math.floor(Math.random() * 20) + 10,
        unit: "story points/sprint",
        increasing: false,
        description: "Predicted decrease in development velocity due to increasing technical debt",
      },
      {
        name: "Onboarding Time",
        current: Math.floor(Math.random() * 5) + 5,
        predicted: Math.floor(Math.random() * 10) + 10,
        unit: "days",
        increasing: true,
        description: "Predicted increase in time required for new developers to become productive",
      },
    ]

    // Calculate overall health score
    const score = calculateHealthScore(issues, metrics)

    // Update state
    setCodeIssues(issues)
    setCodeMetrics(metrics)
    setPredictedTrends(trends)
    setHealthScore(score)
    setIsAnalyzing(false)
  }

  // Calculate overall health score
  const calculateHealthScore = (issues: CodeIssue[], metrics: CodeMetric[]) => {
    // Count issues by severity
    const criticalCount = issues.filter((i) => i.severity === "critical").length
    const highCount = issues.filter((i) => i.severity === "high").length
    const mediumCount = issues.filter((i) => i.severity === "medium").length
    const lowCount = issues.filter((i) => i.severity === "low").length

    // Calculate score based on issues and metrics
    let score = 100

    // Deduct points for issues based on severity
    score -= criticalCount * 15
    score -= highCount * 10
    score -= mediumCount * 5
    score -= lowCount * 2

    // Adjust based on metrics
    metrics.forEach((metric) => {
      if (metric.name === "Test Coverage" || metric.name === "Documentation") {
        // Higher is better
        score += (metric.value / metric.target) * 10
      } else if (metric.name === "Code Duplication" || metric.name === "Technical Debt") {
        // Lower is better
        score -= (metric.value / metric.target) * 10
      }
    })

    // Ensure score is between 0-100
    return Math.max(0, Math.min(100, Math.round(score)))
  }

  // Generate issue title based on type
  const generateIssueTitle = (type: string) => {
    const titles: Record<string, string[]> = {
      complexity: [
        "High cyclomatic complexity",
        "Function is too complex",
        "Class has too many responsibilities",
        "Excessive nesting depth",
      ],
      duplication: ["Duplicated code block", "Similar implementation in multiple places", "Redundant logic pattern"],
      maintainability: [
        "Poor code organization",
        "Inconsistent naming convention",
        "Missing documentation",
        "Unclear function purpose",
      ],
      security: [
        "Potential SQL injection",
        "Insecure authentication",
        "Unvalidated user input",
        "Sensitive data exposure",
      ],
      performance: ["Inefficient algorithm", "Excessive memory usage", "Redundant computation", "Unoptimized query"],
    }

    const options = titles[type] || titles.complexity
    return options[Math.floor(Math.random() * options.length)]
  }

  // Generate issue description based on type
  const generateIssueDescription = (type: string) => {
    const descriptions: Record<string, string[]> = {
      complexity: [
        "This function has a cyclomatic complexity score that exceeds recommended thresholds, making it difficult to understand and test.",
        "The code contains deeply nested conditional statements that increase cognitive load and error probability.",
        "This class has grown to handle too many responsibilities, violating the Single Responsibility Principle.",
      ],
      duplication: [
        "This code block appears to be duplicated across multiple files with only minor variations.",
        "Similar implementation logic is repeated in several places, suggesting an opportunity for abstraction.",
        "The same algorithm is implemented multiple times throughout the codebase.",
      ],
      maintainability: [
        "The code lacks sufficient comments and documentation, making it difficult for new developers to understand.",
        "Inconsistent naming conventions are used throughout this file, reducing readability.",
        "The function's purpose and behavior are not clear from its name and implementation.",
      ],
      security: [
        "User input is being directly used in a database query without proper sanitization.",
        "Authentication credentials are being stored in plaintext or with weak encryption.",
        "The application does not properly validate user input before processing it.",
      ],
      performance: [
        "This algorithm has O(n²) complexity when an O(n log n) solution would be more efficient.",
        "The function allocates excessive memory that could be reduced with a more efficient approach.",
        "Database queries are being executed in a loop, causing performance degradation with larger datasets.",
      ],
    }

    const options = descriptions[type] || descriptions.complexity
    return options[Math.floor(Math.random() * options.length)]
  }

  // Generate issue suggestion based on type
  const generateIssueSuggestion = (type: string) => {
    const suggestions: Record<string, string[]> = {
      complexity: [
        "Refactor this function into smaller, more focused functions with clear responsibilities.",
        "Reduce nesting by extracting conditional logic into separate helper functions.",
        "Apply the Strategy pattern to simplify complex conditional logic.",
      ],
      duplication: [
        "Extract the duplicated logic into a shared utility function that can be reused.",
        "Create a base class or shared component that encapsulates the common functionality.",
        "Implement the DRY (Don't Repeat Yourself) principle by centralizing this logic.",
      ],
      maintainability: [
        "Add comprehensive documentation explaining the purpose, inputs, and outputs of this code.",
        "Standardize naming conventions according to the project's style guide.",
        "Rename variables and functions to clearly communicate their purpose and behavior.",
      ],
      security: [
        "Use parameterized queries or an ORM to prevent SQL injection vulnerabilities.",
        "Implement proper password hashing and storage using bcrypt or a similar algorithm.",
        "Add input validation and sanitization before processing user-provided data.",
      ],
      performance: [
        "Replace the current algorithm with a more efficient implementation to reduce time complexity.",
        "Optimize memory usage by processing data in chunks or using more efficient data structures.",
        "Implement pagination or lazy loading to reduce the initial data load.",
      ],
    }

    const options = suggestions[type] || suggestions.complexity
    return options[Math.floor(Math.random() * options.length)]
  }

  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-500 text-white"
      case "high":
        return "bg-orange-500 text-white"
      case "medium":
        return "bg-yellow-500 text-black"
      case "low":
        return "bg-blue-500 text-white"
      default:
        return "bg-gray-500 text-white"
    }
  }

  // Get issue type icon
  const getIssueTypeIcon = (type: string) => {
    switch (type) {
      case "complexity":
        return <AlertTriangle className="h-4 w-4" />
      case "duplication":
        return <Copy className="h-4 w-4" />
      case "maintainability":
        return <Tool className="h-4 w-4" />
      case "security":
        return <Shield className="h-4 w-4" />
      case "performance":
        return <Zap className="h-4 w-4" />
      default:
        return <AlertTriangle className="h-4 w-4" />
    }
  }

  // Get health score color
  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500"
    if (score >= 60) return "text-yellow-500"
    if (score >= 40) return "text-orange-500"
    return "text-red-500"
  }

  // Filter issues based on selected filters
  const filteredIssues = codeIssues.filter((issue) => {
    if (selectedSeverity && issue.severity !== selectedSeverity) return false
    if (selectedIssueType && issue.issueType !== selectedIssueType) return false
    return true
  })

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-sm font-medium flex items-center">
            <Activity className="h-4 w-4 mr-2 text-primary" />
            Predictive Code Health Analysis
          </CardTitle>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-auto">
            <TabsList className="h-8">
              <TabsTrigger value="issues" className="text-xs px-2 py-1">
                <AlertTriangle className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">Issues</span>
              </TabsTrigger>
              <TabsTrigger value="metrics" className="text-xs px-2 py-1">
                <BarChart className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">Metrics</span>
              </TabsTrigger>
              <TabsTrigger value="predictions" className="text-xs px-2 py-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">Predictions</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        {isAnalyzing ? (
          <div className="py-12 flex flex-col items-center justify-center">
            <div className="relative mb-6">
              <div className="w-16 h-16 rounded-full border-4 border-primary/20 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full border-4 border-t-primary border-primary/20 animate-spin"></div>
              </div>
              <div className="absolute inset-0 bg-primary rounded-full blur-xl opacity-10 animate-pulse"></div>
            </div>
            <div className="text-center mb-4">
              <h3 className="text-lg font-medium mb-1">Analyzing Code Health</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Our AI is analyzing your codebase to identify issues, measure code health metrics, and predict future
                trends.
              </p>
            </div>
            <div className="w-64 h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${analysisProgress}%` }}
              ></div>
            </div>
            <div className="mt-2 text-sm text-muted-foreground">{Math.round(analysisProgress)}% complete</div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Health Score */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div>
                <h3 className="text-lg font-medium">Overall Code Health</h3>
                <p className="text-sm text-muted-foreground">
                  Based on {codeIssues.length} detected issues and {codeMetrics.length} code metrics
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className={`text-4xl font-bold ${getHealthScoreColor(healthScore)}`}>{healthScore}</div>
                <div className="text-sm">
                  <div className="font-medium">Health Score</div>
                  <div className="text-muted-foreground">
                    {healthScore >= 80 ? "Excellent" : healthScore >= 60 ? "Good" : healthScore >= 40 ? "Fair" : "Poor"}
                  </div>
                </div>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {activeTab === "issues" && (
                <motion.div
                  key="issues"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Issue Filters */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge
                      variant={selectedSeverity === null ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => setSelectedSeverity(null)}
                    >
                      All Severities
                    </Badge>
                    {["critical", "high", "medium", "low"].map((severity) => (
                      <Badge
                        key={severity}
                        variant={selectedSeverity === severity ? "default" : "outline"}
                        className={`cursor-pointer ${selectedSeverity === severity ? "" : getSeverityColor(severity)}`}
                        onClick={() => setSelectedSeverity(selectedSeverity === severity ? null : severity)}
                      >
                        {severity.charAt(0).toUpperCase() + severity.slice(1)}
                      </Badge>
                    ))}

                    <div className="ml-auto"></div>

                    <Badge
                      variant={selectedIssueType === null ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => setSelectedIssueType(null)}
                    >
                      All Types
                    </Badge>
                    {["complexity", "duplication", "maintainability", "security", "performance"].map((type) => (
                      <Badge
                        key={type}
                        variant={selectedIssueType === type ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => setSelectedIssueType(selectedIssueType === type ? null : type)}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </Badge>
                    ))}
                  </div>

                  {/* Issues List */}
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                    {filteredIssues.length === 0 ? (
                      <div className="text-center py-12">
                        <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                        <h3 className="text-lg font-medium">No issues found</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          No issues match your current filter criteria
                        </p>
                      </div>
                    ) : (
                      filteredIssues.map((issue) => (
                        <div
                          key={issue.id}
                          className={`border rounded-lg overflow-hidden transition-all duration-200 ${
                            expandedIssue === issue.id ? "shadow-md" : ""
                          }`}
                        >
                          <div
                            className="p-3 flex items-start gap-3 cursor-pointer"
                            onClick={() => setExpandedIssue(expandedIssue === issue.id ? null : issue.id)}
                          >
                            <div
                              className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(issue.severity)}`}
                            >
                              {issue.severity}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{issue.title}</div>
                              <div className="text-xs text-muted-foreground truncate">{issue.fileName}</div>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {issue.issueType}
                            </Badge>
                          </div>

                          {expandedIssue === issue.id && (
                            <div className="px-3 pb-3 pt-1 border-t bg-muted/30">
                              <div className="text-sm mb-3">{issue.description}</div>

                              <div className="bg-primary/5 p-3 rounded-md mb-3">
                                <div className="flex items-center gap-2 text-sm font-medium mb-1">
                                  <Lightbulb className="h-4 w-4 text-primary" />
                                  <span>Suggested Fix</span>
                                </div>
                                <p className="text-sm">{issue.suggestion}</p>
                              </div>

                              <div className="grid grid-cols-3 gap-3 text-xs">
                                <div>
                                  <div className="text-muted-foreground mb-1">Impact</div>
                                  <Progress value={issue.impact} className="h-2" />
                                  <div className="mt-1 font-medium">{issue.impact}% significant</div>
                                </div>
                                <div>
                                  <div className="text-muted-foreground mb-1">Effort</div>
                                  <Progress value={issue.effort} className="h-2" />
                                  <div className="mt-1 font-medium">{issue.effort}% complex</div>
                                </div>
                                <div>
                                  <div className="text-muted-foreground mb-1">AI Confidence</div>
                                  <Progress value={issue.aiConfidence} className="h-2" />
                                  <div className="mt-1 font-medium">{issue.aiConfidence}% certain</div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === "metrics" && (
                <motion.div
                  key="metrics"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="space-y-4">
                    {codeMetrics.map((metric, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-medium">{metric.name}</h3>
                            <p className="text-xs text-muted-foreground">{metric.description}</p>
                          </div>
                          <Badge
                            variant="outline"
                            className={`
                            ${
                              metric.trend === "improving"
                                ? "text-green-500"
                                : metric.trend === "declining"
                                  ? "text-red-500"
                                  : "text-yellow-500"
                            }
                          `}
                          >
                            {metric.trend === "improving"
                              ? "↗ Improving"
                              : metric.trend === "declining"
                                ? "↘ Declining"
                                : "→ Stable"}
                          </Badge>
                        </div>

                        <div className="relative pt-1">
                          <div className="flex items-center justify-between mb-1">
                            <div className="text-xs font-medium">Current: {metric.value}</div>
                            <div className="text-xs text-muted-foreground">Target: {metric.target}</div>
                          </div>
                          <div className="overflow-hidden h-2 text-xs flex rounded bg-secondary">
                            <div
                              className={`
                                shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center
                                ${metric.value >= metric.target ? "bg-green-500" : "bg-primary"}
                              `}
                              style={{ width: `${(metric.value / metric.target) * 100}%` }}
                            ></div>
                          </div>
                          {/* Target marker */}
                          <div
                            className="absolute h-3 w-0.5 bg-black dark:bg-white top-[18px] pointer-events-none"
                            style={{ left: `${(metric.target / 100) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === "predictions" && (
                <motion.div
                  key="predictions"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="space-y-4">
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <h3 className="font-medium mb-1">AI-Powered Predictions</h3>
                      <p className="text-sm text-muted-foreground">
                        Based on current code health metrics and historical trends, our AI predicts these changes over
                        the next 3 months if current patterns continue.
                      </p>
                    </div>

                    {predictedTrends.map((trend, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-medium">{trend.name}</h3>
                            <p className="text-xs text-muted-foreground">{trend.description}</p>
                          </div>
                          <Badge variant={trend.increasing ? "destructive" : "default"}>
                            {trend.increasing ? "↗ Increasing" : "↘ Decreasing"}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold">{trend.current}</div>
                            <div className="text-xs text-muted-foreground">Current</div>
                            <div className="text-xs">{trend.unit}</div>
                          </div>

                          <div className="flex-1 flex items-center justify-center">
                            <ArrowRight className="h-6 w-6 text-muted-foreground" />
                          </div>

                          <div className="text-center">
                            <div
                              className={`text-2xl font-bold ${
                                (trend.increasing && trend.name !== "Development Velocity") ||
                                (!trend.increasing && trend.name === "Development Velocity")
                                  ? "text-red-500"
                                  : "text-green-500"
                              }`}
                            >
                              {trend.predicted}
                            </div>
                            <div className="text-xs text-muted-foreground">Predicted</div>
                            <div className="text-xs">{trend.unit}</div>
                          </div>
                        </div>
                      </div>
                    ))}

                    <div className="p-4 border border-dashed rounded-lg">
                      <div className="flex items-start gap-3">
                        <Lightbulb className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
                        <div>
                          <h3 className="font-medium">Recommendation</h3>
                          <p className="text-sm mt-1">
                            Based on our analysis, we recommend focusing on reducing code complexity and increasing test
                            coverage to improve long-term maintainability and reduce future bugs. Addressing the
                            critical and high severity issues would have the most immediate positive impact.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Missing imports
function Copy(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  )
}

function Tool(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  )
}

function Shield(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
    </svg>
  )
}
