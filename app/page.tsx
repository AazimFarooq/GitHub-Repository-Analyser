"use client"
import { useState, useRef, useEffect, useCallback, useMemo, Suspense } from "react"
import { RepoForm } from "@/components/ui/repo-form"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { Button } from "@/components/ui/button"
import {
  Copy,
  Download,
  Github,
  Info,
  Sparkles,
  Rocket,
  Zap,
  Code,
  FolderTreeIcon as FileTree,
  Network,
  Activity,
  Share2,
  BookOpen,
  Clock,
  Loader2,
  BarChart,
} from "lucide-react"
import { InfoModal } from "@/components/ui/info-modal"
import { useToast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import type { RepositoryAnalysis } from "@/lib/types"
import { motion, AnimatePresence } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { treeToText } from "@/lib/utils"
import { useImageDownload } from "@/lib/hooks/use-image-download"
import { FolderIcon, FileIcon } from "@/components/ui/icons"
import { calculateTreeStats } from "@/lib/utils/tree-utils"
import { ImpactAnalyzer } from "@/components/impact-analyzer"
import { KnowledgeGraphNavigator } from "@/components/knowledge-graph-navigator"
import { CodeEvolutionTimeline } from "@/components/code-evolution-timeline"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RepoInsights } from "@/components/repo-insights"
import { EnhancedTreeVisualizer } from "@/components/enhanced-tree-visualizer"
import { PredictiveCodeHealth } from "@/components/predictive-code-health"
import { AICodeRelationship } from "@/components/ai-code-relationship"
import { ExportTree } from "@/components/export-tree"
import { ErrorBoundary } from "@/components/ui/error-boundary"
import { AICodeReview } from "@/components/ai-code-review"
import AnalyticsDashboard from "@/app/analytics/page"

export default function Home() {
  const [repoUrl, setRepoUrl] = useState("")
  const [repoData, setRepoData] = useState<RepositoryAnalysis | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [loadingStage, setLoadingStage] = useState("")
  const { toast } = useToast()
  const treeContainerRef = useRef<HTMLDivElement>(null)
  const [activeTab, setActiveTab] = useState("structure")
  const [showIntro, setShowIntro] = useState(true)
  const { downloadAsImage } = useImageDownload(treeContainerRef)
  const [treeStats, setTreeStats] = useState<any>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Loading progress simulation using useEffect with cleanup
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined

    if (isLoading) {
      const stages = [
        "Connecting to GitHub API...",
        "Fetching repository data...",
        "Building tree structure...",
        "Analyzing code dependencies...",
        "Generating insights...",
        "Preparing visualization...",
      ]

      let progress = 0
      interval = setInterval(() => {
        progress += 5
        setLoadingProgress(Math.min(progress, 95))

        const stageIndex = Math.min(Math.floor(progress / (100 / stages.length)), stages.length - 1)
        setLoadingStage(stages[stageIndex])

        if (progress >= 95) clearInterval(interval)
      }, 200)
    }

    // Cleanup function to clear interval when component unmounts or dependencies change
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isLoading])

  // Memoized function to extract owner and repo from URL
  const extractRepoInfo = useCallback((url: string): { owner: string; repo: string } | null => {
    try {
      // Remove trailing slash if present
      const cleanUrl = url.replace(/\/$/, "")

      // Handle different GitHub URL formats
      let urlParts: string[] = []

      if (cleanUrl.includes("github.com")) {
        // Regular GitHub URL
        const urlObj = new URL(cleanUrl)
        const pathParts = urlObj.pathname.split("/").filter(Boolean)
        if (pathParts.length >= 2) {
          return { owner: pathParts[0], repo: pathParts[1] }
        }
      } else {
        // Simple format like "owner/repo"
        urlParts = cleanUrl.split("/")
        const owner = urlParts[urlParts.length - 2]
        const repo = urlParts[urlParts.length - 1]
        if (owner && repo) {
          return { owner, repo }
        }
      }

      throw new Error("Invalid GitHub repository URL format")
    } catch (err) {
      return null
    }
  }, [])

  // Handle repository submission with proper error handling
  const handleRepoSubmit = useCallback(
    async (url: string) => {
      // Reset state
      setIsLoading(true)
      setRepoUrl(url)
      setError(null)
      setLoadingProgress(0)
      setShowIntro(false)

      // Cancel any previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      // Create a new AbortController
      abortControllerRef.current = new AbortController()
      const { signal } = abortControllerRef.current

      try {
        // Validate and extract owner and repo from URL
        const repoInfo = extractRepoInfo(url)

        if (!repoInfo) {
          throw new Error(
            "Invalid GitHub repository URL. Please enter a valid URL (e.g., https://github.com/owner/repo).",
          )
        }

        const { owner, repo } = repoInfo

        // Fetch repository data with timeout and abort signal
        const fetchPromise = fetch(`/api/github?owner=${owner}&repo=${repo}`, {
          signal,
          headers: {
            "Content-Type": "application/json",
          },
        })

        // Set a timeout for the fetch request
        const timeoutId = setTimeout(() => {
          if (abortControllerRef.current) {
            abortControllerRef.current.abort()
          }
        }, 30000) // 30 second timeout

        const response = await fetchPromise

        // Clear the timeout since the request completed
        clearTimeout(timeoutId)

        if (!response.ok) {
          // Try to get error details from the response
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `Failed to fetch repository (${response.status}): ${response.statusText}`)
        }

        const data = await response.json()

        // Simulate completion with a slight delay for smoothness
        setLoadingProgress(100)
        setTimeout(() => {
          setRepoData(data)
          // Calculate tree statistics
          if (data.tree) {
            setTreeStats(calculateTreeStats(data.tree))
          }
          setIsLoading(false)

          // Show success toast
          toast({
            title: "Repository loaded",
            description: `Successfully loaded ${owner}/${repo}`,
          })
        }, 500)
      } catch (err) {
        // Handle different error types
        if (err instanceof Error) {
          // Don't set error state if the request was aborted
          if (err.name === "AbortError") {
            console.log("Fetch request aborted")
            return
          }

          setError(err.message)
          console.error("Error fetching repo data:", err)

          // Show error toast
          toast({
            title: "Error",
            description: err.message,
            variant: "destructive",
          })
        } else {
          setError("An unexpected error occurred")
          console.error("Unknown error:", err)
        }
        setIsLoading(false)
      }
    },
    [extractRepoInfo, toast],
  )

  // Memoize the copy function to avoid recreating it on each render
  const handleCopyAsText = useCallback(() => {
    if (!repoData?.tree) {
      toast({
        title: "Error",
        description: "No repository data available to copy",
        variant: "destructive",
      })
      return
    }

    try {
      const textTree = treeToText(repoData.tree)
      navigator.clipboard
        .writeText(textTree)
        .then(() => {
          toast({
            title: "Copied to clipboard",
            description: "The folder structure has been copied as text",
          })
        })
        .catch((err) => {
          console.error("Failed to copy text: ", err)
          toast({
            title: "Failed to copy",
            description: "Could not copy the folder structure to clipboard",
            variant: "destructive",
          })
        })
    } catch (err) {
      console.error("Error preparing text for clipboard:", err)
      toast({
        title: "Error",
        description: "Failed to prepare text for clipboard",
        variant: "destructive",
      })
    }
  }, [repoData, toast])

  // Example repositories for quick access
  const exampleRepos = useMemo(
    () => [
      { name: "Next.js", url: "https://github.com/vercel/next.js" },
      { name: "React", url: "https://github.com/facebook/react" },
    ],
    [],
  )

  // Clear error when changing tabs
  useEffect(() => {
    setError(null)
  }, [activeTab])

  // Cleanup AbortController on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return (
    <ErrorBoundary>
      <main className="flex min-h-screen flex-col relative overflow-hidden dark:bg-transparent">
        {/* Background effects */}
        <div className="fixed inset-0 clean-dark-bg pointer-events-none"></div>

        <header className="relative z-10 w-full border-b border-border/40 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Github className="h-8 w-8 text-primary animate-pulse-glow" aria-hidden="true" />
                <div className="absolute inset-0 bg-primary rounded-full blur-xl opacity-20 animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold gradient-text">GitHub Visualizer</h1>
                <p className="text-xs text-muted-foreground">Explore repositories in a whole new dimension</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => setIsModalOpen(true)}
                aria-label="About"
              >
                <Info className="h-4 w-4 mr-1" aria-hidden="true" />
                About
              </Button>
              <ThemeToggle />
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hidden md:flex">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Github className="h-4 w-4" aria-hidden="true" />
                  GitHub
                </Button>
              </a>
            </div>
          </div>
        </header>

        <div className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
          <div className="mb-8 max-w-3xl mx-auto">
            <RepoForm onSubmit={handleRepoSubmit} isLoading={isLoading} />
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-4 p-4 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-lg border border-red-200 dark:border-red-800/30 shadow-sm"
                role="alert"
              >
                <div className="flex items-start gap-3">
                  <div className="p-1 bg-red-200 dark:bg-red-800/30 rounded-full">
                    <AlertCircle className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="font-medium">Error fetching repository</h3>
                    <p className="text-sm mt-1">{error}</p>
                    <Button variant="outline" size="sm" className="mt-3" onClick={() => setError(null)}>
                      Dismiss
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-8"
                role="status"
                aria-live="polite"
              >
                <div className="max-w-2xl mx-auto">
                  <div className="flex justify-between items-center mb-2">
                    <h2 className="text-lg font-medium">{loadingStage}</h2>
                    <span className="text-sm text-muted-foreground">{loadingProgress}%</span>
                  </div>
                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full gradient-bg rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${loadingProgress}%` }}
                    ></div>
                  </div>
                  <div className="mt-8 flex flex-col items-center justify-center text-center">
                    <div className="relative mb-6">
                      <div className="w-16 h-16 rounded-full border-4 border-primary/20 flex items-center justify-center">
                        <Loader2 className="w-10 h-10 text-primary animate-spin" aria-hidden="true" />
                      </div>
                      <div className="absolute inset-0 bg-primary rounded-full blur-xl opacity-10 animate-pulse"></div>
                    </div>
                    <p className="text-muted-foreground max-w-md">
                      We're analyzing the repository structure, code dependencies, and generating insights. This might
                      take a moment for larger repositories.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      onClick={() => {
                        if (abortControllerRef.current) {
                          abortControllerRef.current.abort()
                          setIsLoading(false)
                          setError("Request cancelled")
                        }
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

            {showIntro && !isLoading && !repoData && !error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-8 max-w-5xl mx-auto"
              >
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div>
                    <Badge variant="outline" className="mb-4 px-3 py-1 gap-1 text-xs font-normal">
                      <Sparkles className="h-3 w-3 text-amber-500" aria-hidden="true" />
                      <span>Revolutionary Repository Visualization</span>
                    </Badge>
                    <h2 className="text-3xl md:text-4xl font-bold mb-4 gradient-text">
                      Explore Code Like Never Before
                    </h2>
                    <p className="text-muted-foreground mb-6">
                      Enter any GitHub repository URL to transform it into an interactive, visual experience. Discover
                      insights, explore dependencies, and understand code structure in seconds.
                    </p>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="p-1.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                          <Activity className="h-5 w-5" aria-hidden="true" />
                        </div>
                        <div>
                          <h3 className="font-medium">Predictive Code Health</h3>
                          <p className="text-sm text-muted-foreground">
                            AI predicts future issues and suggests targeted refactoring opportunities
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="p-1.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                          <FileTree className="h-5 w-5" aria-hidden="true" />
                        </div>
                        <div>
                          <h3 className="font-medium">Interactive Visualization</h3>
                          <p className="text-sm text-muted-foreground">
                            Explore repository structure with intuitive, interactive visualizations
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="perspective-container">
                    <div className="card-3d glass-card rounded-xl overflow-hidden shadow-2xl">
                      <div className="card-3d-content p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                          </div>
                          <div className="text-xs text-muted-foreground">repository-visualizer</div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <FolderIcon className="h-4 w-4 text-amber-400" aria-hidden="true" />
                            <span className="text-sm font-medium">project-name</span>
                          </div>
                          <div className="pl-6 space-y-2">
                            <div className="flex items-center gap-2">
                              <FolderIcon className="h-4 w-4 text-amber-400" aria-hidden="true" />
                              <span className="text-sm">src</span>
                            </div>
                            <div className="pl-6 space-y-1.5">
                              <div className="flex items-center gap-2">
                                <FileIcon className="h-4 w-4 text-slate-400" aria-hidden="true" />
                                <span className="text-sm">index.js</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <FileIcon className="h-4 w-4 text-slate-400" aria-hidden="true" />
                                <span className="text-sm">app.js</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <FileIcon className="h-4 w-4 text-slate-400" aria-hidden="true" />
                                <span className="text-sm">styles.css</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <FolderIcon className="h-4 w-4 text-amber-400" aria-hidden="true" />
                              <span className="text-sm">components</span>
                            </div>
                            <div className="pl-6 space-y-1.5">
                              <div className="flex items-center gap-2">
                                <FileIcon className="h-4 w-4 text-slate-400" aria-hidden="true" />
                                <span className="text-sm">Button.jsx</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <FileIcon className="h-4 w-4 text-slate-400" aria-hidden="true" />
                                <span className="text-sm">Card.jsx</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <FileIcon className="h-4 w-4 text-slate-400" aria-hidden="true" />
                            <span className="text-sm">package.json</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FileIcon className="h-4 w-4 text-slate-400" aria-hidden="true" />
                            <span className="text-sm">README.md</span>
                          </div>
                        </div>
                      </div>
                      <div className="card-3d-shadow"></div>
                    </div>
                  </div>
                </div>

                <div className="mt-16 text-center">
                  <h3 className="text-lg font-medium mb-2">Ready to get started?</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Enter a GitHub repository URL above to begin exploring its structure and dependencies
                  </p>
                  <div className="flex flex-wrap justify-center gap-4">
                    {exampleRepos.map((example, index) => (
                      <Button
                        key={index}
                        variant={index === 0 ? "default" : "outline"}
                        size="lg"
                        className={index === 0 ? "gap-2 button-glow" : "gap-2"}
                        onClick={() => handleRepoSubmit(example.url)}
                      >
                        {index === 0 ? (
                          <Rocket className="h-4 w-4" aria-hidden="true" />
                        ) : (
                          <Zap className="h-4 w-4" aria-hidden="true" />
                        )}
                        Try with {example.name}
                      </Button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {repoData && !isLoading && (
              <ErrorBoundary
                fallback={
                  <div className="mt-6 p-6 text-center">
                    <h3 className="text-lg font-medium mb-2">Error loading visualization</h3>
                    <p className="text-muted-foreground mb-4">
                      There was a problem visualizing this repository. This could be due to its size or structure.
                    </p>
                    <Button onClick={() => window.location.reload()}>Reload Page</Button>
                  </div>
                }
              >
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-6"
                  ref={treeContainerRef}
                >
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="px-2 py-0.5 text-xs font-normal text-muted-foreground">
                          Repository
                        </Badge>
                        <h2 className="text-2xl font-bold gradient-text">{repoData.tree.name}</h2>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{repoData.stats?.totalFiles || 0} files</span>
                        <span>•</span>
                        <span>{repoData.stats?.totalFolders || 0} folders</span>
                        {repoData.stats?.mainLanguage && (
                          <>
                            <span>•</span>
                            <span>Main language: {repoData.stats.mainLanguage}</span>
                          </>
                        )}
                        {treeStats && treeStats.totalSize > 0 && (
                          <>
                            <span>•</span>
                            <span>Size: {formatBytes(treeStats.totalSize)}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopyAsText}
                        className="flex items-center gap-2"
                        aria-label="Copy repository structure as text"
                      >
                        <Copy className="h-4 w-4" aria-hidden="true" />
                        Copy as Text
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadAsImage(`${repoData.tree.name}`)}
                        className="flex items-center gap-2"
                        aria-label="Download visualization as image"
                      >
                        <Download className="h-4 w-4" aria-hidden="true" />
                        Download as Image
                      </Button>
                    </div>
                  </div>

                  <Tabs defaultValue="structure" value={activeTab} onValueChange={setActiveTab} className="mb-6">
                    <TabsList className="grid w-full grid-cols-10 md:w-auto md:inline-flex">
                      <TabsTrigger value="structure" className="gap-2" aria-label="Structure view">
                        <FileTree className="h-4 w-4" aria-hidden="true" />
                        <span className="hidden md:inline">Structure</span>
                      </TabsTrigger>
                      <TabsTrigger value="dependencies" className="gap-2" aria-label="Dependencies view">
                        <Network className="h-4 w-4" aria-hidden="true" />
                        <span className="hidden md:inline">Dependencies</span>
                      </TabsTrigger>
                      <TabsTrigger value="impact" className="gap-2" aria-label="Impact analysis">
                        <Share2 className="h-4 w-4" aria-hidden="true" />
                        <span className="hidden md:inline">Impact</span>
                      </TabsTrigger>
                      <TabsTrigger value="knowledge" className="gap-2" aria-label="Knowledge graph">
                        <BookOpen className="h-4 w-4" aria-hidden="true" />
                        <span className="hidden md:inline">Knowledge</span>
                      </TabsTrigger>
                      <TabsTrigger value="health" className="gap-2" aria-label="Code health">
                        <Activity className="h-4 w-4" aria-hidden="true" />
                        <span className="hidden md:inline">Health</span>
                      </TabsTrigger>
                      <TabsTrigger value="ai" className="gap-2" aria-label="AI analysis">
                        <Zap className="h-4 w-4" aria-hidden="true" />
                        <span className="hidden md:inline">AI</span>
                      </TabsTrigger>
                      <TabsTrigger value="timeline" className="gap-2" aria-label="Timeline view">
                        <Clock className="h-4 w-4" aria-hidden="true" />
                        <span className="hidden md:inline">Timeline</span>
                      </TabsTrigger>
                      <TabsTrigger value="export" className="gap-2" aria-label="Export options">
                        <Code className="h-4 w-4" aria-hidden="true" />
                        <span className="hidden md:inline">Export</span>
                      </TabsTrigger>
                      <TabsTrigger value="sandbox" className="gap-2" aria-label="Code sandbox">
                        <Code className="h-4 w-4" aria-hidden="true" />
                        <span className="hidden md:inline">Sandbox</span>
                      </TabsTrigger>
                      <TabsTrigger value="analytics" className="gap-2" aria-label="Analytics dashboard">
                        <BarChart className="h-4 w-4" aria-hidden="true" />
                        <span className="hidden md:inline">Analytics</span>
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>

                  <div className="bg-card rounded-xl border shadow-lg overflow-hidden">
                    <Suspense
                      fallback={
                        <div className="p-6 flex items-center justify-center">
                          <Loader2 className="h-8 w-8 text-primary animate-spin" aria-hidden="true" />
                          <span className="sr-only">Loading...</span>
                        </div>
                      }
                    >
                      {activeTab === "structure" && (
                        <div className="p-6">
                          <EnhancedTreeVisualizer data={repoData.tree} initialExpandedLevel={2} />
                        </div>
                      )}

                      {activeTab === "dependencies" && <RepoInsights data={repoData} activeTab="dependencies" />}

                      {activeTab === "sandbox" && <RepoInsights data={repoData} activeTab="sandbox" />}

                      {activeTab === "impact" && (
                        <div className="p-6">
                          <ImpactAnalyzer tree={repoData.tree} dependencies={repoData.dependencies} />
                        </div>
                      )}

                      {activeTab === "knowledge" && (
                        <div className="p-6">
                          <KnowledgeGraphNavigator tree={repoData.tree} />
                        </div>
                      )}

                      {activeTab === "health" && (
                        <div className="p-6">
                          <PredictiveCodeHealth tree={repoData.tree} />
                        </div>
                      )}

                      {activeTab === "ai" && (
                        <div className="p-6">
                          <AICodeRelationship tree={repoData.tree} />
                        </div>
                      )}

                      {activeTab === "timeline" && (
                        <div className="p-6">
                          <CodeEvolutionTimeline tree={repoData.tree} repoUrl={repoUrl} />
                        </div>
                      )}

                      {activeTab === "export" && (
                        <div className="p-6">
                          <ExportTree tree={repoData.tree} />
                        </div>
                      )}
                      {activeTab === "ai-review" && (
                        <div className="p-6">
                          <AICodeReview />
                        </div>
                      )}
                      {activeTab === "analytics" && (
                        <div className="p-6">
                          <AnalyticsDashboard />
                        </div>
                      )}
                    </Suspense>
                  </div>
                </motion.div>
              </ErrorBoundary>
            )}
          </AnimatePresence>
        </div>

        <footer className="relative z-10 mt-auto border-t border-border/40 backdrop-blur-sm py-6">
          <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-muted-foreground">
              <p>GitHub Repository Visualizer • Explore code in a whole new dimension</p>
            </div>
            <div className="flex items-center gap-4">
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Privacy
              </a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Terms
              </a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Contact
              </a>
            </div>
          </div>
        </footer>

        <InfoModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        <Toaster />
      </main>
    </ErrorBoundary>
  )
}

// Helper function to format file size
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B"

  const k = 1024
  const sizes = ["B", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${Number.parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

const AlertCircle = ({ className = "", ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`${className}`}
    {...props}
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" x2="12" y1="8" y2="12" />
    <line x1="12" x2="12.01" y1="16" y2="16" />
  </svg>
)
