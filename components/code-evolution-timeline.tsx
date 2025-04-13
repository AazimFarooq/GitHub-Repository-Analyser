"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { TreeNode } from "@/types/github"
import { Clock, Play, Pause, SkipBack, SkipForward, Calendar, GitCommit, GitMerge, Layers, Braces } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

type CodeEvolutionTimelineProps = {
  tree: TreeNode
  repoUrl: string
}

// Simulated commit history data
const generateSimulatedCommitHistory = (tree: TreeNode, days = 90) => {
  const now = new Date()
  const commits = []
  const fileNodes: TreeNode[] = []

  // Extract all file nodes
  const extractFiles = (node: TreeNode) => {
    if (node.type === "blob") {
      fileNodes.push(node)
    } else if (node.children) {
      node.children.forEach(extractFiles)
    }
  }
  extractFiles(tree)

  // Generate random commit dates
  const commitDates = Array(Math.floor(days * 1.5))
    .fill(0)
    .map(() => {
      const date = new Date(now)
      date.setDate(date.getDate() - Math.floor(Math.random() * days))
      return date
    })
    .sort((a, b) => a.getTime() - b.getTime())

  // Generate commits with affected files
  const codebase = new Map()
  let complexity = 50
  const contributors = ["alice", "bob", "charlie", "diana", "evan"]

  commitDates.forEach((date, i) => {
    // Determine number of files affected in this commit
    const filesChanged = Math.floor(Math.random() * 5) + 1
    const affectedFiles = fileNodes
      .sort(() => Math.random() - 0.5)
      .slice(0, filesChanged)
      .map((file) => file.path)

    // Determine commit type
    let commitType = "feature"
    const r = Math.random()
    if (r < 0.2) commitType = "bugfix"
    else if (r < 0.3) commitType = "refactor"
    else if (r < 0.35) commitType = "test"
    else if (r < 0.4) commitType = "docs"

    // Update complexity based on commit type
    if (commitType === "feature") complexity += Math.random() * 5
    else if (commitType === "bugfix") complexity += Math.random() * 2
    else if (commitType === "refactor") complexity -= Math.random() * 8
    complexity = Math.max(20, Math.min(100, complexity))

    // Create commit
    commits.push({
      id: `commit_${i}`,
      date,
      message: generateCommitMessage(commitType, affectedFiles),
      author: contributors[Math.floor(Math.random() * contributors.length)],
      type: commitType,
      affectedFiles,
      complexity: Math.floor(complexity),
      linesAdded: Math.floor(Math.random() * 100) + 5,
      linesRemoved: Math.floor(Math.random() * 50),
    })

    // Occasionally add a merge commit
    if (i > 0 && Math.random() < 0.15) {
      commits.push({
        id: `merge_${i}`,
        date: new Date(date.getTime() + 1000 * 60 * 30), // 30 minutes later
        message: `Merge branch 'feature/xyz' into main`,
        author: contributors[Math.floor(Math.random() * contributors.length)],
        type: "merge",
        affectedFiles: [],
        complexity: Math.floor(complexity),
        linesAdded: Math.floor(Math.random() * 20),
        linesRemoved: Math.floor(Math.random() * 20),
      })
    }
  })

  return commits.sort((a, b) => a.date.getTime() - b.date.getTime())
}

// Generate realistic commit messages
const generateCommitMessage = (type: string, files: string[]) => {
  const fileNames = files.map((f) => f.split("/").pop() || f)
  const randomFile = fileNames[Math.floor(Math.random() * fileNames.length)]

  const featureMessages = [
    `Add ${randomFile} component`,
    `Implement new ${randomFile} functionality`,
    `Create ${randomFile} module`,
    `Add support for ${randomFile}`,
    `Integrate ${randomFile} feature`,
  ]

  const bugfixMessages = [
    `Fix issue in ${randomFile}`,
    `Fix ${randomFile} bug`,
    `Resolve ${randomFile} error`,
    `Fix crash in ${randomFile}`,
    `Fix edge case in ${randomFile}`,
  ]

  const refactorMessages = [
    `Refactor ${randomFile}`,
    `Clean up ${randomFile} code`,
    `Optimize ${randomFile} performance`,
    `Simplify ${randomFile} logic`,
    `Restructure ${randomFile} module`,
  ]

  const testMessages = [
    `Add tests for ${randomFile}`,
    `Improve test coverage for ${randomFile}`,
    `Fix flaky tests in ${randomFile}`,
    `Add unit tests for ${randomFile}`,
    `Create integration tests for ${randomFile}`,
  ]

  const docsMessages = [
    `Update ${randomFile} documentation`,
    `Add comments to ${randomFile}`,
    `Improve ${randomFile} docs`,
    `Document ${randomFile} API`,
    `Add examples for ${randomFile}`,
  ]

  switch (type) {
    case "feature":
      return featureMessages[Math.floor(Math.random() * featureMessages.length)]
    case "bugfix":
      return bugfixMessages[Math.floor(Math.random() * bugfixMessages.length)]
    case "refactor":
      return refactorMessages[Math.floor(Math.random() * refactorMessages.length)]
    case "test":
      return testMessages[Math.floor(Math.random() * testMessages.length)]
    case "docs":
      return docsMessages[Math.floor(Math.random() * docsMessages.length)]
    default:
      return `Update ${randomFile}`
  }
}

export function CodeEvolutionTimeline({ tree, repoUrl }: CodeEvolutionTimelineProps) {
  const [commits, setCommits] = useState<any[]>([])
  const [timelinePosition, setTimelinePosition] = useState(100) // 0-100
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [viewMode, setViewMode] = useState<"timeline" | "complexity" | "activity">("timeline")
  const [selectedCommit, setSelectedCommit] = useState<any>(null)
  const [codebaseState, setCodebaseState] = useState<Map<string, any>>(new Map())
  const timelineRef = useRef<HTMLDivElement>(null)
  const playInterval = useRef<NodeJS.Timeout | null>(null)

  // Initialize with simulated data
  useEffect(() => {
    if (!tree) return

    const simulatedCommits = generateSimulatedCommitHistory(tree)
    setCommits(simulatedCommits)

    // Set initial position to latest commit
    setTimelinePosition(100)
    setSelectedCommit(simulatedCommits[simulatedCommits.length - 1])

    // Calculate initial codebase state (at the end of timeline)
    calculateCodebaseState(simulatedCommits, 100)
  }, [tree])

  // Handle timeline position change
  useEffect(() => {
    if (commits.length === 0) return

    // Find the commit closest to the current timeline position
    const commitIndex = Math.min(Math.floor((commits.length - 1) * (timelinePosition / 100)), commits.length - 1)

    setSelectedCommit(commits[commitIndex])
    calculateCodebaseState(commits, timelinePosition)
  }, [timelinePosition, commits])

  // Handle playback
  useEffect(() => {
    if (isPlaying) {
      // Clear any existing interval
      if (playInterval.current) {
        clearInterval(playInterval.current)
      }

      // Start playback
      playInterval.current = setInterval(() => {
        setTimelinePosition((prev) => {
          if (prev >= 100) {
            setIsPlaying(false)
            return 100
          }
          return Math.min(prev + 0.5 * playbackSpeed, 100)
        })
      }, 100)
    } else if (playInterval.current) {
      clearInterval(playInterval.current)
    }

    return () => {
      if (playInterval.current) {
        clearInterval(playInterval.current)
      }
    }
  }, [isPlaying, playbackSpeed])

  // Calculate codebase state at a given timeline position
  const calculateCodebaseState = (commitHistory: any[], position: number) => {
    const newCodebase = new Map<string, any>()
    const commitIndex = Math.min(Math.floor((commitHistory.length - 1) * (position / 100)), commitHistory.length - 1)

    // Apply all commits up to the current position
    for (let i = 0; i <= commitIndex; i++) {
      const commit = commitHistory[i]

      // Update files affected by this commit
      commit.affectedFiles.forEach((filePath: string) => {
        if (!newCodebase.has(filePath)) {
          newCodebase.set(filePath, {
            created: commit.date,
            lastModified: commit.date,
            author: commit.author,
            complexity: 10 + Math.floor(Math.random() * 20),
            size: 100 + Math.floor(Math.random() * 900),
            changes: 1,
          })
        } else {
          const fileData = newCodebase.get(filePath)
          newCodebase.set(filePath, {
            ...fileData,
            lastModified: commit.date,
            author: commit.author,
            complexity: Math.min(100, fileData.complexity + (Math.random() > 0.7 ? 5 : -2)),
            size: Math.max(100, fileData.size + (commit.linesAdded - commit.linesRemoved) / 2),
            changes: fileData.changes + 1,
          })
        }
      })
    }

    setCodebaseState(newCodebase)
  }

  // Jump to specific points in timeline
  const jumpToStart = () => {
    setTimelinePosition(0)
    setIsPlaying(false)
  }

  const jumpToEnd = () => {
    setTimelinePosition(100)
    setIsPlaying(false)
  }

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  // Get commit type badge color
  const getCommitTypeColor = (type: string) => {
    switch (type) {
      case "feature":
        return "bg-green-500 text-white"
      case "bugfix":
        return "bg-red-500 text-white"
      case "refactor":
        return "bg-blue-500 text-white"
      case "test":
        return "bg-purple-500 text-white"
      case "docs":
        return "bg-yellow-500 text-black"
      case "merge":
        return "bg-indigo-500 text-white"
      default:
        return "bg-gray-500 text-white"
    }
  }

  // Render file nodes based on current codebase state
  const renderCodebaseState = () => {
    if (codebaseState.size === 0) return null

    // Sort files by most recently modified
    const sortedFiles = Array.from(codebaseState.entries())
      .sort((a, b) => b[1].lastModified.getTime() - a[1].lastModified.getTime())
      .slice(0, 50) // Show only top 50 files

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4 max-h-[300px] overflow-y-auto pr-2">
        {sortedFiles.map(([filePath, data]) => {
          const fileName = filePath.split("/").pop() || filePath
          const fileExt = fileName.split(".").pop() || ""

          // Determine file color based on extension
          let fileColor = "bg-gray-200 dark:bg-gray-700"
          if (/^(js|jsx|ts|tsx)$/.test(fileExt)) fileColor = "bg-yellow-200 dark:bg-yellow-800"
          else if (/^(css|scss|less)$/.test(fileExt)) fileColor = "bg-pink-200 dark:bg-pink-800"
          else if (/^(json|yml|yaml|xml)$/.test(fileExt)) fileColor = "bg-blue-200 dark:bg-blue-800"
          else if (/^(md|txt)$/.test(fileExt)) fileColor = "bg-green-200 dark:bg-green-800"

          // Calculate age indicator (newer files are more vibrant)
          const agePercent = Math.min(
            100,
            ((selectedCommit.date.getTime() - data.created.getTime()) / (1000 * 60 * 60 * 24 * 30)) * 100,
          )
          const opacity = Math.max(0.3, 1 - agePercent / 100)

          return (
            <motion.div
              key={filePath}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`p-3 rounded-md border ${fileColor} text-sm`}
              style={{ opacity }}
            >
              <div className="flex justify-between items-start">
                <div className="font-medium truncate" title={filePath}>
                  {fileName}
                </div>
                <Badge variant="outline" className="text-[10px] ml-1 shrink-0">
                  {data.changes} {data.changes === 1 ? "change" : "changes"}
                </Badge>
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-300 mt-1 truncate">{filePath}</div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div className="text-gray-500 dark:text-gray-400">Complexity</div>
                  <div className="font-medium">{data.complexity}</div>
                </div>
                <div>
                  <div className="text-gray-500 dark:text-gray-400">Size</div>
                  <div className="font-medium">{data.size} LOC</div>
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">Last modified by {data.author}</div>
            </motion.div>
          )
        })}
      </div>
    )
  }

  // Render complexity graph
  const renderComplexityGraph = () => {
    if (commits.length === 0) return null

    // Get complexity data points
    const dataPoints = commits.map((commit) => ({
      date: commit.date,
      complexity: commit.complexity,
    }))

    // Find current point based on timeline position
    const currentIndex = Math.min(Math.floor((dataPoints.length - 1) * (timelinePosition / 100)), dataPoints.length - 1)

    const maxComplexity = Math.max(...dataPoints.map((d) => d.complexity))
    const height = 200

    return (
      <div className="mt-4 relative h-[200px]">
        <div className="absolute inset-y-0 left-0 w-10 flex flex-col justify-between text-xs text-gray-500">
          <div>{maxComplexity}</div>
          <div>{Math.floor(maxComplexity / 2)}</div>
          <div>0</div>
        </div>
        <div className="absolute inset-0 ml-10">
          {/* Horizontal grid lines */}
          <div className="absolute w-full h-[1px] bg-gray-200 dark:bg-gray-700"></div>
          <div className="absolute w-full h-[1px] bg-gray-200 dark:bg-gray-700" style={{ top: "50%" }}></div>
          <div className="absolute w-full h-[1px] bg-gray-200 dark:bg-gray-700" style={{ bottom: 0 }}></div>

          {/* Complexity line */}
          <svg className="absolute inset-0 overflow-visible">
            <defs>
              <linearGradient id="complexityGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgb(59, 130, 246)" stopOpacity="0.8" />
                <stop offset="100%" stopColor="rgb(59, 130, 246)" stopOpacity="0.2" />
              </linearGradient>
            </defs>

            {/* Area under the curve */}
            <path
              d={`
                M 0 ${height}
                ${dataPoints
                  .map((point, i) => {
                    const x = (i / (dataPoints.length - 1)) * 100 + "%"
                    const y = height - (point.complexity / maxComplexity) * height
                    return `L ${x} ${y}`
                  })
                  .join(" ")}
                L 100% ${height}
                Z
              `}
              fill="url(#complexityGradient)"
              opacity={0.5}
            />

            {/* Line */}
            <path
              d={`
                M 0 ${height - (dataPoints[0].complexity / maxComplexity) * height}
                ${dataPoints
                  .map((point, i) => {
                    const x = (i / (dataPoints.length - 1)) * 100 + "%"
                    const y = height - (point.complexity / maxComplexity) * height
                    return `L ${x} ${y}`
                  })
                  .join(" ")}
              `}
              stroke="rgb(59, 130, 246)"
              strokeWidth="2"
              fill="none"
            />

            {/* Current point */}
            <circle
              cx={`${(currentIndex / (dataPoints.length - 1)) * 100}%`}
              cy={height - (dataPoints[currentIndex].complexity / maxComplexity) * height}
              r="4"
              fill="rgb(59, 130, 246)"
              stroke="white"
              strokeWidth="2"
            />
          </svg>
        </div>
      </div>
    )
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-sm font-medium flex items-center">
            <Clock className="h-4 w-4 mr-2 text-primary" />
            4D Code Evolution Timeline
          </CardTitle>
          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)} className="w-auto">
            <TabsList className="h-8">
              <TabsTrigger value="timeline" className="text-xs px-2 py-1">
                <Calendar className="h-3 w-3 mr-1" />
                Timeline
              </TabsTrigger>
              <TabsTrigger value="complexity" className="text-xs px-2 py-1">
                <Braces className="h-3 w-3 mr-1" />
                Complexity
              </TabsTrigger>
              <TabsTrigger value="activity" className="text-xs px-2 py-1">
                <Layers className="h-3 w-3 mr-1" />
                Activity
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Timeline slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="text-sm font-medium">
                {commits.length > 0 && selectedCommit && <span>{formatDate(selectedCommit.date)}</span>}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-6 w-6" onClick={jumpToStart}>
                  <SkipBack className="h-3 w-3" />
                </Button>
                <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => setIsPlaying(!isPlaying)}>
                  {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                </Button>
                <Button variant="outline" size="icon" className="h-6 w-6" onClick={jumpToEnd}>
                  <SkipForward className="h-3 w-3" />
                </Button>
                <select
                  className="h-6 text-xs bg-transparent border rounded px-1"
                  value={playbackSpeed}
                  onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                >
                  <option value="0.5">0.5x</option>
                  <option value="1">1x</option>
                  <option value="2">2x</option>
                  <option value="5">5x</option>
                </select>
              </div>
            </div>

            <div className="relative" ref={timelineRef}>
              <Slider
                value={[timelinePosition]}
                min={0}
                max={100}
                step={0.1}
                onValueChange={(value) => {
                  setTimelinePosition(value[0])
                  setIsPlaying(false)
                }}
              />

              {/* Commit markers */}
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 pointer-events-none">
                {commits.map((commit, index) => {
                  const position = (index / (commits.length - 1)) * 100
                  return (
                    <div
                      key={commit.id}
                      className={`absolute h-2 w-2 rounded-full -translate-x-1/2 -translate-y-1/2 ${
                        commit.type === "merge" ? "bg-indigo-500" : "bg-primary"
                      }`}
                      style={{ left: `${position}%` }}
                    />
                  )
                })}
              </div>
            </div>
          </div>

          {/* Selected commit details */}
          {selectedCommit && (
            <div className="p-3 border rounded-md bg-muted/30">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    {selectedCommit.type === "merge" ? (
                      <GitMerge className="h-4 w-4 text-indigo-500" />
                    ) : (
                      <GitCommit className="h-4 w-4 text-primary" />
                    )}
                    <span className="font-medium">{selectedCommit.message}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {selectedCommit.author} committed on {formatDate(selectedCommit.date)}
                  </div>
                </div>
                <Badge className={cn("text-xs", getCommitTypeColor(selectedCommit.type))}>{selectedCommit.type}</Badge>
              </div>

              {selectedCommit.affectedFiles.length > 0 && (
                <div className="mt-3">
                  <div className="text-xs font-medium mb-1">Files changed</div>
                  <div className="flex flex-wrap gap-1">
                    {selectedCommit.affectedFiles.map((file: string) => (
                      <Badge key={file} variant="outline" className="text-xs">
                        {file.split("/").pop()}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                <div>
                  <div className="text-muted-foreground">Added</div>
                  <div className="font-medium text-green-500">+{selectedCommit.linesAdded}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Removed</div>
                  <div className="font-medium text-red-500">-{selectedCommit.linesRemoved}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Complexity</div>
                  <div className="font-medium">{selectedCommit.complexity}</div>
                </div>
              </div>
            </div>
          )}

          {/* View mode content */}
          <AnimatePresence mode="wait">
            {viewMode === "timeline" && (
              <motion.div key="timeline" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {renderCodebaseState()}
              </motion.div>
            )}

            {viewMode === "complexity" && (
              <motion.div key="complexity" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {renderComplexityGraph()}
              </motion.div>
            )}

            {viewMode === "activity" && (
              <motion.div
                key="activity"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mt-4"
              >
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: 52 }).map((_, weekIndex) => (
                    <div key={weekIndex} className="flex flex-col gap-1">
                      {Array.from({ length: 7 }).map((_, dayIndex) => {
                        // Calculate date for this cell
                        const date = new Date(selectedCommit.date)
                        date.setDate(date.getDate() - ((51 - weekIndex) * 7 + (6 - dayIndex)))

                        // Count commits on this day
                        const dayCommits = commits.filter(
                          (c) =>
                            c.date.getDate() === date.getDate() &&
                            c.date.getMonth() === date.getMonth() &&
                            c.date.getFullYear() === date.getFullYear(),
                        )

                        // Determine cell color based on commit count
                        let bgColor = "bg-gray-200 dark:bg-gray-800"
                        if (dayCommits.length === 1) bgColor = "bg-green-200 dark:bg-green-900"
                        else if (dayCommits.length === 2) bgColor = "bg-green-300 dark:bg-green-800"
                        else if (dayCommits.length === 3) bgColor = "bg-green-400 dark:bg-green-700"
                        else if (dayCommits.length >= 4) bgColor = "bg-green-500 dark:bg-green-600"

                        return (
                          <div
                            key={dayIndex}
                            className={`w-3 h-3 rounded-sm ${bgColor} cursor-pointer`}
                            title={`${date.toDateString()}: ${dayCommits.length} commits`}
                          />
                        )
                      })}
                    </div>
                  ))}
                </div>
                <div className="flex justify-end mt-2 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-gray-200 dark:bg-gray-800 rounded-sm"></div>
                    <span>0</span>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <div className="w-3 h-3 bg-green-200 dark:bg-green-900 rounded-sm"></div>
                    <span>1</span>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <div className="w-3 h-3 bg-green-300 dark:bg-green-800 rounded-sm"></div>
                    <span>2</span>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <div className="w-3 h-3 bg-green-400 dark:bg-green-700 rounded-sm"></div>
                    <span>3</span>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <div className="w-3 h-3 bg-green-500 dark:bg-green-600 rounded-sm"></div>
                    <span>4+</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  )
}
